/**
 * Instagram Graph API client
 * All calls use the stored Page Access Token from instagramAccounts.accessToken
 */

const GRAPH_VERSION = process.env.META_GRAPH_VERSION ?? "v25.0";
const BASE = `https://graph.facebook.com/${GRAPH_VERSION}`;

export interface IGMedia {
  id: string;
  media_type: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM" | "REELS";
  media_url?: string;
  thumbnail_url?: string;
  caption?: string;
  timestamp: string;
  like_count?: number;
  comments_count?: number;
  permalink?: string;
}

export interface IGInsightValue {
  value: number;
  end_time: string;
}

export interface IGInsightMetric {
  name: string;
  period: string;
  values: IGInsightValue[];
  title: string;
  description: string;
  id: string;
}

export interface IGUserProfile {
  id: string;
  name: string;
  username: string;
  biography?: string;
  profile_picture_url?: string;
  followers_count?: number;
  follows_count?: number;
  media_count?: number;
  website?: string;
}

async function graphFetch<T>(
  path: string,
  accessToken: string,
  params: Record<string, string> = {}
): Promise<T> {
  const url = new URL(`${BASE}${path}`);
  url.searchParams.set("access_token", accessToken);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  const res = await fetch(url.toString(), { next: { revalidate: 60 } });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: { message: string } };
    throw new Error(body?.error?.message ?? `Graph API error ${res.status}`);
  }
  return res.json() as Promise<T>;
}

/** Fetch all media posts for an IG Business account */
export async function fetchIGMedia(
  igUserId: string,
  accessToken: string,
  limit = 20
): Promise<IGMedia[]> {
  const data = await graphFetch<{ data: IGMedia[] }>(
    `/${igUserId}/media`,
    accessToken,
    {
      fields: "id,media_type,media_url,thumbnail_url,caption,timestamp,like_count,comments_count,permalink",
      limit: String(limit),
    }
  );
  return data.data ?? [];
}

/** Fetch account-level insights */
export async function fetchIGInsights(
  igUserId: string,
  accessToken: string,
  metrics: string[] = ["reach", "profile_views", "impressions", "accounts_engaged"],
  period: "day" | "week" | "days_28" = "day",
  since?: string,
  until?: string
): Promise<IGInsightMetric[]> {
  const params: Record<string, string> = {
    metric: metrics.join(","),
    period,
  };
  if (since) params.since = since;
  if (until) params.until = until;
  const data = await graphFetch<{ data: IGInsightMetric[] }>(
    `/${igUserId}/insights`,
    accessToken,
    params
  );
  return data.data ?? [];
}

/** Fetch IG Business user profile */
export async function fetchIGProfile(
  igUserId: string,
  accessToken: string
): Promise<IGUserProfile> {
  return graphFetch<IGUserProfile>(
    `/${igUserId}`,
    accessToken,
    {
      fields: "id,name,username,biography,profile_picture_url,followers_count,follows_count,media_count,website",
    }
  );
}

/** Publish a photo post to Instagram */
export async function publishIGPost(
  igUserId: string,
  accessToken: string,
  imageUrl: string,
  caption: string
): Promise<{ id: string }> {
  // Step 1: Create container
  const containerUrl = new URL(`${BASE}/${igUserId}/media`);
  containerUrl.searchParams.set("access_token", accessToken);
  containerUrl.searchParams.set("image_url", imageUrl);
  containerUrl.searchParams.set("caption", caption);

  const containerRes = await fetch(containerUrl.toString(), { method: "POST" });
  const containerData = await containerRes.json();
  if (!containerRes.ok || containerData.error) {
    throw new Error(containerData.error?.message ?? "Failed to create media container");
  }

  // Step 2: Publish container
  const publishUrl = new URL(`${BASE}/${igUserId}/media_publish`);
  publishUrl.searchParams.set("access_token", accessToken);
  publishUrl.searchParams.set("creation_id", containerData.id);

  const publishRes = await fetch(publishUrl.toString(), { method: "POST" });
  const publishData = await publishRes.json();
  if (!publishRes.ok || publishData.error) {
    throw new Error(publishData.error?.message ?? "Failed to publish post");
  }
  return { id: publishData.id };
}

/** Business Discovery: Search and fetch other business profiles/media */
export async function searchIGUser(
  igUserId: string,
  accessToken: string,
  targetUsername: string
): Promise<IGUserProfile & { media?: { data: IGMedia[] } }> {
  // We use the connected IG User ID as the root to discover another account by username
  const res = await graphFetch<{ business_discovery: IGUserProfile & { media?: { data: IGMedia[] } } }>(
    `/${igUserId}`,
    accessToken,
    {
      fields: `business_discovery.username(${targetUsername}){id,username,biography,name,profile_picture_url,followers_count,follows_count,media_count,media{id,caption,media_url,thumbnail_url,media_type,permalink,timestamp,like_count,comments_count}}`,
    }
  );
  return res.business_discovery;
}
