import { 
  IGMedia, 
  IGInsightMetric, 
  IGUserProfile, 
  HashtagSearchResult, 
  HashtagMedia 
} from '@autoloop/types';
import { fetchWithRetry } from "./fetch-utils";

const DEFAULT_GRAPH_VERSION = process.env.META_GRAPH_VERSION || "v21.0";
const BASE = `https://graph.facebook.com/${DEFAULT_GRAPH_VERSION}`;

/**
 * Internal helper for Graph API calls
 */
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

  return fetchWithRetry(url.toString()) as Promise<T>;
}

export async function sendInstagramMessage(
  actorId: string,
  recipientId: string,
  messageText: string | null,
  accessToken: string,
  options: {
    buttons?: Array<{ type: 'web_url', url: string, title: string } | { type: 'postback', title: string, payload: string }>;
    quickReplies?: Array<{ title: string, payload: string }>;
    mediaUrls?: string[];
    attachmentIds?: string[];
    graphVersion?: string;
  } = {}
) {
  const graphVersion = options.graphVersion || DEFAULT_GRAPH_VERSION;
  const url = `https://graph.facebook.com/${graphVersion}/${actorId}/messages`;
  
  let messagePayload: any = {};
  if (messageText) {
    messagePayload.text = messageText;
  }

  const mediaElements: any[] = [];
  if (options.mediaUrls) {
    options.mediaUrls.forEach(url => mediaElements.push({ type: 'image', payload: { url } }));
  }
  if (options.attachmentIds) {
    options.attachmentIds.forEach(id => mediaElements.push({ type: 'image', payload: { attachment_id: id } }));
  }

  if (mediaElements.length > 0) {
    if (mediaElements.length === 1) {
      messagePayload.attachment = mediaElements[0];
    } else {
      messagePayload.attachments = mediaElements.slice(0, 10);
    }
  }

  if (options.buttons && options.buttons.length > 0) {
    messagePayload = {
      attachment: {
        type: "template",
        payload: {
          template_type: "generic",
          elements: [{
            title: (messageText || "Explore").substring(0, 80),
            buttons: options.buttons
          }]
        }
      }
    };
  }

  if (options.quickReplies && options.quickReplies.length > 0) {
    messagePayload.quick_replies = options.quickReplies.map(qr => ({
      content_type: "text",
      title: qr.title,
      payload: qr.payload
    }));
  }

  const payload = {
    recipient: { id: recipientId },
    message: messagePayload,
    messaging_type: "RESPONSE",
  };

  return fetchWithRetry(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });
}

export async function replyToInstagramComment(
  commentId: string,
  messageText: string,
  accessToken: string,
  graphVersion: string = DEFAULT_GRAPH_VERSION
) {
  const url = `https://graph.facebook.com/${graphVersion}/${commentId}/replies`;
  const payload = { message: messageText };

  return fetchWithRetry(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });
}

export async function getInstagramUserProfile(
  recipientId: string,
  accessToken: string,
  graphVersion: string = DEFAULT_GRAPH_VERSION
): Promise<IGUserProfile> {
  const fields = [
    "id",
    "name",
    "username",
    "profile_pic",
    "is_user_follow_business",
    "is_business_follow_user",
  ].join(",");
  const url = new URL(`https://graph.facebook.com/${graphVersion}/${recipientId}`);
  url.searchParams.set("fields", fields);
  url.searchParams.set("access_token", accessToken);

  return fetchWithRetry(url.toString()) as Promise<IGUserProfile>;
}

export async function likeMediaOrComment(
  igUserId: string,
  targetId: string,
  accessToken: string,
  action: 'POST' | 'DELETE' = 'POST',
  type: 'media_id' | 'comment_id' = 'comment_id',
  graphVersion: string = DEFAULT_GRAPH_VERSION
) {
  const url = `https://graph.facebook.com/${graphVersion}/${igUserId}/likes`;
  
  if (action === 'DELETE') {
    const deleteUrl = new URL(url);
    deleteUrl.searchParams.set("access_token", accessToken);
    deleteUrl.searchParams.set(type, targetId);
    return fetchWithRetry(deleteUrl.toString(), { method: 'DELETE' });
  }

  const payload: Record<string, string> = {};
  payload[type] = targetId;

  return fetchWithRetry(url, {
    method: action,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });
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
      fields: "id,media_type,media_product_type,media_url,thumbnail_url,caption,timestamp,like_count,comments_count,reposts_count,permalink,children{id,media_url,media_type,thumbnail_url}",
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
  metrics: string[] = ["reach", "profile_visits", "views", "accounts_engaged"],
  period: "day" | "week" | "days_28" = "day",
  since?: string,
  until?: string
): Promise<IGInsightMetric[]> {
  const lifetimeMetrics = ["followers_count", "follows_count"];
  const timeSeriesMetrics = [
    "reach", 
    "views", 
    "profile_visits", 
    "website_clicks",
    "accounts_engaged",
    "total_interactions",
    "likes"
  ];

  const metricMap: Record<string, string> = {
    "impressions": "views",
    "profile_views": "profile_visits",
    "plays": "views"
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
        // Reverse mapping to maintain compatibility with dashboard expectation
        const normalized = timeData.data.map(m => {
          const requestedName = metrics.find(rm => (metricMap[rm] || rm) === m.name);
          return requestedName ? { ...m, name: requestedName } : m;
        });
        results.push(...normalized);
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

  const containerData: any = await fetchWithRetry(containerUrl.toString(), { method: "POST" });

  const publishUrl = new URL(`${BASE}/${externalId}/media_publish`);
  publishUrl.searchParams.set("access_token", accessToken);
  publishUrl.searchParams.set("creation_id", containerData.id);

  const publishData: any = await fetchWithRetry(publishUrl.toString(), { method: "POST" });
  return { id: publishData.id };
}

/** Search hashtags by name */
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

/** Fuzzy search for IG users via hashtags */
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

/** Business Discovery: Search and fetch other business profiles */
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

/** Upload an attachment to Meta CDN */
export async function uploadAttachment(
  pageId: string,
  accessToken: string,
  mediaUrl: string,
  type: 'image' | 'video' | 'audio' | 'file' = 'image'
): Promise<string> {
  const data = await graphFetch<{ attachment_id: string }>(
    `/${pageId}/message_attachments`,
    accessToken,
    {
      platform: "instagram",
      message: JSON.stringify({
        attachment: {
          type,
          payload: {
            url: mediaUrl,
            is_reusable: "true"
          }
        }
      })
    }
  );
  return data.attachment_id;
}
