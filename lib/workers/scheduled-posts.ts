import { and, eq, lte } from "drizzle-orm";

import { db } from "@/db";
import { connectedAccounts, socialPosts } from "@/db/schema";
import { claimSocialEvent, buildSocialEventKey, releaseSocialEvent } from "@/lib/social/event-dedupe";
import { socialPublisher } from "@/lib/social/publisher";
import { Logger } from "@/lib/logger";

const CHECK_INTERVAL_MS = 30 * 1000;

let intervalId: NodeJS.Timeout | null = null;
let isRunning = false;

async function publishScheduledPost(post: typeof socialPosts.$inferSelect) {
  if (!post.connectedAccountId) {
    await db
      .update(socialPosts)
      .set({
        status: "failed",
        error: "Scheduled post is missing a connected account",
        updatedAt: new Date(),
      })
      .where(eq(socialPosts.id, post.id));
    return;
  }

  const lockKey = buildSocialEventKey(post.platform, post.connectedAccountId, "scheduled-post", post.id);
  const claimed = await claimSocialEvent(lockKey, 60 * 10);

  if (!claimed) {
    return;
  }

  try {
    const account = await db.query.connectedAccounts.findFirst({
      where: eq(connectedAccounts.id, post.connectedAccountId),
    });

    if (!account) {
      throw new Error("Connected account not found");
    }

    await db
      .update(socialPosts)
      .set({
        status: "publishing",
        updatedAt: new Date(),
      })
      .where(and(eq(socialPosts.id, post.id), eq(socialPosts.status, "scheduled")));

    const mediaUrl = post.mediaUrls?.[0];
    const payload = {
      content: post.content || post.title || "",
      mediaUrl,
      accessToken: account.accessToken,
      providerAccountId: account.providerAccountId,
      refreshToken: account.refreshToken || undefined,
    };

    let platformPostId: string | null = null;

    if (account.provider === "facebook") {
      platformPostId = await socialPublisher.publishToFacebook(payload);
    } else if (account.provider === "instagram") {
      platformPostId = await socialPublisher.publishToInstagram(payload);
    } else if (account.provider === "linkedin") {
      platformPostId = await socialPublisher.publishToLinkedin(payload);
    } else if (account.provider === "youtube") {
      platformPostId = (await socialPublisher.publishToYoutube(payload)) || null;
    } else {
      throw new Error(`Unsupported scheduled publishing provider: ${account.provider}`);
    }

    await db
      .update(socialPosts)
      .set({
        status: "published",
        platformPostId,
        publishedAt: new Date(),
        error: null,
        updatedAt: new Date(),
      })
      .where(eq(socialPosts.id, post.id));

    Logger.info("Scheduled post published", {
      postId: post.id,
      platform: account.provider,
      platformPostId,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    await db
      .update(socialPosts)
      .set({
        status: "failed",
        error: message,
        updatedAt: new Date(),
      })
      .where(eq(socialPosts.id, post.id));

    Logger.error("Scheduled post publish failed", error, {
      postId: post.id,
    });
  } finally {
    await releaseSocialEvent(lockKey);
  }
}

export async function processScheduledPostsOnce() {
  const now = new Date();

  const duePosts = await db.query.socialPosts.findMany({
    where: and(
      eq(socialPosts.status, "scheduled"),
      lte(socialPosts.scheduledAt, now)
    ),
    limit: 25,
  });

  for (const post of duePosts) {
    await publishScheduledPost(post);
  }
}

export function startScheduledPostWorker(intervalMs = CHECK_INTERVAL_MS) {
  if (isRunning) {
    return;
  }

  isRunning = true;

  processScheduledPostsOnce().catch((error) => {
    Logger.error("Initial scheduled post run failed", error);
  });

  intervalId = setInterval(() => {
    processScheduledPostsOnce().catch((error) => {
      Logger.error("Scheduled post worker run failed", error);
    });
  }, intervalMs);

  Logger.info("Scheduled post worker started", { intervalMs });
}

export function stopScheduledPostWorker() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }

  isRunning = false;
}
