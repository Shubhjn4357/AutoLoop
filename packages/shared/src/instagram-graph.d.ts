/**
 * Instagram Graph API client
 * All calls use the stored Page Access Token from socialAccounts.accessToken
 */
import { IGMedia, IGInsightMetric, IGUserProfile, HashtagSearchResult, HashtagMedia } from '@autoloop/types';
/** Fetch all media posts for an IG Business account */
export declare function fetchIGMedia(externalId: string, accessToken: string, limit?: number): Promise<IGMedia[]>;
/** Fetch active stories for an IG Business account */
export declare function fetchIGStories(externalId: string, accessToken: string): Promise<IGMedia[]>;
/** Fetch account-level insights */
export declare function fetchIGInsights(externalId: string, accessToken: string, metrics?: string[], period?: "day" | "week" | "days_28", since?: string, until?: string): Promise<IGInsightMetric[]>;
/** Fetch IG Business user profile */
export declare function fetchIGProfile(externalId: string, accessToken: string): Promise<IGUserProfile>;
/** Publish a photo post to Instagram */
export declare function publishIGPost(externalId: string, accessToken: string, imageUrl: string, caption: string): Promise<{
    id: string;
}>;
/** Search hashtags by name (fuzzy-ish search via hashtag) */
export declare function searchHashtags(externalId: string, accessToken: string, hashtagName: string): Promise<HashtagSearchResult[]>;
/** Get recent media for a hashtag */
export declare function getHashtagRecentMedia(hashtagId: string, accessToken: string, limit?: number): Promise<HashtagMedia[]>;
/** Fuzzy-like search: Search hashtags and extract unique usernames from recent posts */
export declare function fuzzySearchIGUsers(externalId: string, accessToken: string, query: string): Promise<{
    username: string;
    mediaCount: number;
    sampleMedia: HashtagMedia;
}[]>;
/** Business Discovery: Search and fetch other business profiles/media */
export declare function searchIGUser(externalId: string, accessToken: string, targetUsername: string): Promise<IGUserProfile & {
    media?: {
        data: IGMedia[];
    };
}>;
