/**
 * Instagram Graph API client
 * All calls use the stored Page Access Token from socialAccounts.accessToken
 */

import { 
  IGMedia, 
  IGInsightMetric, 
  IGUserProfile, 
  HashtagSearchResult, 
  HashtagMedia 
} from '@autoloop/types';

const GRAPH_VERSION = "v22.0"; // Use a stable version
const BASE = `https://graph.facebook.com/${GRAPH_VERSION}`;

async function graphFetch<T>(
  path: string,
  accessToken: string,
  params: Record<string, string> = {},
  retries = 3
): Promise<T> {
  const url = new URL(`${BASE}${path}`);
  url.searchParams.set("access_token", accessToken);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }

  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url.toString(), { signal: AbortSignal.timeout(10000) });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: { message: string } };
        // Retry on 5xx errors or network issues, but not on 4xx (auth/params errors)
        if (i < retries - 1 && (res.status >= 500 || res.status === 408)) throw new Error(body?.error?.message ?? `Status ${res.status}`);
        throw new Error(body?.error?.message ?? `Graph API error ${res.status}`);
      }
      return res.json() as Promise<T>;
    } catch (err: any) {
      if (i === retries - 1) throw err;
      console.warn(`[GraphFetch Retry] Attempt ${i + 1} failed: ${err.message}. Retrying in 1000ms...`);
      await new Promise(r => setTimeout(r, 1000));
    }
  }
  throw new Error("Maximum retries reached");
}

/** Fetch all media posts for an IG Business account */
export async function fetchIGMedia(
  externalId: string,
  accessToken: string,
  limit = 20
): Promise<IGMedia[]> {
  const data = await graphFetch<{ data: IGMedia[] }>(
    `/${externalId}/media`,
    accessToken,
    {
      fields: "id,media_type,media_product_type,media_url,thumbnail_url,caption,timestamp,like_count,comments_count,permalink,children{id,media_url,media_type,thumbnail_url}",
      limit: String(limit),
    }
  );
  return data.data ?? [];
}

/** Fetch active stories for an IG Business account */
export async function fetchIGStories(
  externalId: string,
  accessToken: string
): Promise<IGMedia[]> {
  const data = await graphFetch<{ data: IGMedia[] }>(
    `/${externalId}/stories`,
    accessToken,
    {
      fields: "id,media_type,media_product_type,media_url,thumbnail_url,caption,timestamp,permalink",
    }
  );
  return data.data ?? [];
}

/** Fetch account-level insights */
export async function fetchIGInsights(
  externalId: string,
  accessToken: string,
  metrics: string[] = ["reach", "profile_views", "impressions", "accounts_engaged"],
  period: "day" | "week" | "days_28" = "day",
  since?: string,
  until?: string
): Promise<IGInsightMetric[]> {
  const lifetimeMetrics = ["followers_count", "follows_count"];
  const timeSeriesMetrics = [
    "reach", 
    "impressions", 
    "profile_visits", 
    "website_clicks",
    "accounts_engaged",
    "total_interactions"
  ];

  const metricMap: Record<string, string> = {
    "profile_views": "profile_visits",
  };

  const finalMetrics = metrics.map(m => metricMap[m] || m);

  const lifetimeMetricsToFetch = finalMetrics.filter((m) => lifetimeMetrics.includes(m));
  const timeSeriesMetricsToFetch = finalMetrics.filter((m) => timeSeriesMetrics.includes(m));

  const results: IGInsightMetric[] = [];

  if (lifetimeMetricsToFetch.length > 0) {
    const lifetimeParams: Record<string, string> = {
      metric: lifetimeMetricsToFetch.join(","),
      period: "lifetime",
      metric_type: "total_value",
    };
    if (since) lifetimeParams.since = since;
    if (until) lifetimeParams.until = until;

    try {
      const lifetimeData = await graphFetch<{ data: IGInsightMetric[] }>(
        `/${externalId}/insights`,
        accessToken,
        lifetimeParams
      );
      if (lifetimeData.data) {
        results.push(...lifetimeData.data);
      }
    } catch (err) {
      console.error("[fetchIGInsights] Lifetime metrics failed:", err);
    }
  }

  if (timeSeriesMetricsToFetch.length > 0) {
    const timeParams: Record<string, string> = {
      metric: timeSeriesMetricsToFetch.join(","),
      period,
    };
    if (since) timeParams.since = since;
    if (until) timeParams.until = until;

    try {
      const timeData = await graphFetch<{ data: IGInsightMetric[] }>(
        `/${externalId}/insights`,
        accessToken,
        timeParams
      );
      if (timeData.data) {
        results.push(...timeData.data);
      }
    } catch (err) {
      console.error("[fetchIGInsights] Time-series metrics failed:", err);
    }
  }

  return results;
}

/** Fetch IG Business user profile */
export async function fetchIGProfile(
  externalId: string,
  accessToken: string
): Promise<IGUserProfile> {
  return graphFetch<IGUserProfile>(
    `/${externalId}`,
    accessToken,
    {
      fields: "id,name,username,biography,profile_picture_url,followers_count,follows_count,media_count,website",
    }
  );
}

/** Publish a photo post to Instagram */
export async function publishIGPost(
  externalId: string,
  accessToken: string,
  imageUrl: string,
  caption: string
): Promise<{ id: string }> {
  const containerUrl = new URL(`${BASE}/${externalId}/media`);
  containerUrl.searchParams.set("access_token", accessToken);
  containerUrl.searchParams.set("image_url", imageUrl);
  containerUrl.searchParams.set("caption", caption);

  const containerRes = await fetch(containerUrl.toString(), { method: "POST" });
  const containerData: any = await containerRes.json();
  if (!containerRes.ok || containerData.error) {
    throw new Error(containerData.error?.message ?? "Failed to create media container");
  }

  const publishUrl = new URL(`${BASE}/${externalId}/media_publish`);
  publishUrl.searchParams.set("access_token", accessToken);
  publishUrl.searchParams.set("creation_id", containerData.id);

  const publishRes = await fetch(publishUrl.toString(), { method: "POST" });
  const publishData: any = await publishRes.json();
  if (!publishRes.ok || publishData.error) {
    throw new Error(publishData.error?.message ?? "Failed to publish post");
  }
  return { id: publishData.id };
}

/** Search hashtags by name (fuzzy-ish search via hashtag) */
export async function searchHashtags(

  externalId: string,
  accessToken: string,
  hashtagName: string
): Promise<HashtagSearchResult[]> {
  const data = await graphFetch<{ data: HashtagSearchResult[] }>(
    "/ig_hashtag_search",
    accessToken,
    {
      user_id: externalId,
      q: hashtagName,
    }
  );
  return data.data ?? [];
}

/** Get recent media for a hashtag */
export async function getHashtagRecentMedia(
  hashtagId: string,
  accessToken: string,
  limit = 25
): Promise<HashtagMedia[]> {
  const data = await graphFetch<{ data: HashtagMedia[] }>(
    `/${hashtagId}/recent_media`,
    accessToken,
    {
      fields: "id,caption,media_url,thumbnail_url,media_type,permalink,timestamp,like_count,comments_count,owner{username}",
      limit: String(limit),
    }
  );
  return data.data ?? [];
}

/** Fuzzy-like search: Search hashtags and extract unique usernames from recent posts */
export async function fuzzySearchIGUsers(
  externalId: string,
  accessToken: string,
  query: string
): Promise<{ username: string; mediaCount: number; sampleMedia: HashtagMedia }[]> {
  if (!query || query.length < 1) return [];

  const hashtags = await searchHashtags(externalId, accessToken, query);
  if (hashtags.length === 0) return [];
  const topHashtag = hashtags[0];
  const media = await getHashtagRecentMedia(topHashtag.id, accessToken, 50);

  const usernameMap = new Map<string, { count: number; sample: HashtagMedia }>();

  for (const item of media) {
    const username = item.owner?.username || item.username;
    if (!username) continue;

    const existing = usernameMap.get(username);
    if (existing) {
      existing.count++;
    } else {
      usernameMap.set(username, { count: 1, sample: item });
    }
  }

  return Array.from(usernameMap.entries())
    .map(([username, data]) => ({
      username,
      mediaCount: data.count,
      sampleMedia: data.sample,
    }))
    .sort((a, b) => b.mediaCount - a.mediaCount)
    .slice(0, 10);
}

/** Business Discovery: Search and fetch other business profiles/media */
export async function searchIGUser(
  externalId: string,
  accessToken: string,
  targetUsername: string
): Promise<IGUserProfile & { media?: { data: IGMedia[] } }> {
  const res = await graphFetch<{ business_discovery: IGUserProfile & { media?: { data: IGMedia[] } } }>(
    `/${externalId}`,
    accessToken,
    {
      fields: `business_discovery.username(${targetUsername}){id,username,biography,name,profile_picture_url,followers_count,follows_count,media_count,media{id,caption,media_url,thumbnail_url,media_type,permalink,timestamp,like_count,comments_count,children{id,media_url,media_type,thumbnail_url}}}`,
    }
  );
  return res.business_discovery;
}
