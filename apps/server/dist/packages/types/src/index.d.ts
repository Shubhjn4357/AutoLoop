export type ConditionOperator = "any" | "contains" | "equals" | "starts_with" | "ends_with" | "regex";
export interface FlowBlock {
    id: string;
    type: "trigger" | "condition" | "reply" | "follow_up";
    label: string;
}
export interface WebhookEvent {
    platform: 'instagram' | 'facebook';
    type: string;
    payload: any;
    timestamp: number;
}
export interface IGMedia {
    id: string;
    media_type: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
    media_product_type?: "AD" | "FEED" | "STORY" | "REELS";
    media_url?: string;
    thumbnail_url?: string;
    caption?: string;
    timestamp: string;
    like_count?: number;
    comments_count?: number;
    permalink?: string;
    children?: {
        data: {
            id: string;
            media_url: string;
            media_type: string;
            thumbnail_url?: string;
        }[];
    };
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
export interface HashtagSearchResult {
    id: string;
    name: string;
}
export interface HashtagMedia extends IGMedia {
    username?: string;
    owner?: {
        id: string;
        username: string;
    };
}
