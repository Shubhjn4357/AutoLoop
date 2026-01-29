import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { socialPosts, connectedAccounts } from "@/db/schema";
import { getEffectiveUserId } from "@/lib/auth-utils";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import { socialPublisher } from "@/lib/social/publisher";

export async function GET() {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = await getEffectiveUserId(session.user.id);

    const posts = await db.query.socialPosts.findMany({
        where: eq(socialPosts.userId, userId),
        orderBy: (posts, { desc }) => [desc(posts.createdAt)],
        with: {
            // We might want to join with connectedAccount to see which page it was posted to
        }
    });

    return NextResponse.json({ posts });
}

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = await getEffectiveUserId(session.user.id);
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { content, mediaUrl, platforms, title, thumbnailUrl, tags, category, scheduledAt } = body;
        // platforms: array of connectedAccount Ids

        if (!content && !mediaUrl && !title) {
            return NextResponse.json({ error: "Content, Title, or Media required" }, { status: 400 });
        }
        if (!platforms || !Array.isArray(platforms) || platforms.length === 0) {
            return NextResponse.json({ error: "Select at least one platform" }, { status: 400 });
        }

        const results = [];

        for (const accountId of platforms) {
            // Fetch account details
            const account = await db.query.connectedAccounts.findFirst({
                where: eq(connectedAccounts.id, accountId)
            });

            if (!account) {
                results.push({ accountId, status: "failed", error: "Account not found" });
                continue;
            }

            // Create DB Entry
            const postId = nanoid();
            const isScheduled = !!scheduledAt;

            await db.insert(socialPosts).values({
                id: postId,
                userId,
                connectedAccountId: accountId,
                content: content,
                title: title,
                thumbnailUrl: thumbnailUrl,
                tags: tags,
                category: category,
                mediaUrls: mediaUrl ? [mediaUrl] : [],
                scheduledAt: isScheduled ? new Date(scheduledAt) : null,
                status: isScheduled ? "scheduled" : "publishing",
                platform: account.provider,
                createdAt: new Date(),
                updatedAt: new Date()
            });

            // If scheduled, skip publishing
            if (isScheduled) {
                results.push({ accountId, status: "scheduled", postId });
                continue;
            }

            // Trigger Publish
            try {
                let platformPostId = null;
                const fullMediaUrl = mediaUrl ? (mediaUrl.startsWith("http") ? mediaUrl : `${process.env.NEXT_PUBLIC_APP_URL}${mediaUrl}`) : undefined;

                const payload = {
                    content,
                    title, // Pass title
                    mediaUrl: fullMediaUrl,
                    accessToken: account.accessToken,
                    providerAccountId: account.providerAccountId,
                    refreshToken: account.refreshToken || undefined
                };

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const provider = account.provider as any;

                if (provider === "facebook") {
                    platformPostId = await socialPublisher.publishToFacebook(payload);
                } else if (provider === "instagram") {
                    const metadata = account.metadata as Record<string, unknown> | null;
                    if (provider === "facebook" && metadata?.type === "instagram") {
                        platformPostId = await socialPublisher.publishToFacebook(payload);
                    } else {
                        platformPostId = await socialPublisher.publishToFacebook(payload);
                    }
                } else if (provider === "linkedin") {
                    platformPostId = await socialPublisher.publishToLinkedin(payload);
                } else if (provider === "youtube") {
                    platformPostId = await socialPublisher.publishToYoutube(payload);
                }

                // Update DB Success
                await db.update(socialPosts).set({
                    status: "published",
                    platformPostId: platformPostId,
                    publishedAt: new Date()
                }).where(eq(socialPosts.id, postId));

                results.push({ accountId, status: "published", postId: platformPostId });

            } catch (err: unknown) {
                const errorMessage = err instanceof Error ? err.message : "Unknown error";
                console.error(`Publish failed for ${account.provider}:`, err);
                // Update DB Fail
                await db.update(socialPosts).set({
                    status: "failed",
                    error: errorMessage
                }).where(eq(socialPosts.id, postId));

                results.push({ accountId, status: "failed", error: errorMessage });
            }
        }

        return NextResponse.json({ success: true, results });

    } catch (error) {
        console.error("Create Post Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = await getEffectiveUserId(session.user.id);

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    try {
        await db.delete(socialPosts).where(and(eq(socialPosts.id, id), eq(socialPosts.userId, userId)));
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Delete Post Error:", error);
        return NextResponse.json({ error: "Failed to delete post" }, { status: 500 });
    }
}
