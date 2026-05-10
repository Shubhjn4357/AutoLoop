export type ConditionOperator = 
  | "any"
  | "contains"
  | "equals"
  | "starts_with"
  | "ends_with"
  | "regex";

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

// Instagram Graph API Types
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
  reposts_count?: number;
  permalink?: string;
  children?: { data: { id: string; media_url: string; media_type: string; thumbnail_url?: string }[] };
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
  profile_pic?: string;
  is_user_follow_business?: boolean;
  is_business_follow_user?: boolean;
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
  owner?: { id: string; username: string };
}

// Architecture System Prompt Types
export enum TriggerType {
  COMMENT = "comment",
  STORY_REPLY = "story_reply",
  DM = "dm",
  FOLLOW = "follow",
  REEL_COMMENT = "reel_comment",
  MENTION = "mention",
  LIVE_COMMENT = "live_comment",
  POST_LIKE = "post_like",
}

export enum ActionType {
  SEND_DM = "send_dm",
  REPLY_COMMENT = "reply_comment",
  WAIT = "wait",
  SEND_FOLLOWUP = "send_followup",
  TAG_USER = "tag_user",
  SAVE_LEAD = "save_lead",
  WEBHOOK = "webhook",
  EMAIL = "email",
  NOTIFICATION = "notification",
  AI_GENERATE_REPLY = "ai_generate_reply",
}

export interface InternalEvent {
  eventId: string;
  platform: "instagram";
  triggerType: TriggerType;
  accountId: string;
  userId: string;
  username: string;
  message?: string;
  commentId?: string;
  mediaId?: string;
  timestamp: number;
  rawPayload: any;
}

export type TriggerConfig = {
  type: TriggerType;
  scope: {
    mode: "all_posts" | "specific_post";
    postIds?: string[];
  };
  keywordMode?: {
    enabled: boolean;
    matchType: "contains" | "exact" | "starts_with" | "regex";
    keywords: string[];
  };
};

export interface Condition {
  type: string;
  operator: ConditionOperator;
  value: any;
}

export interface WorkflowAction {
  id: string;
  type: ActionType;
  delay?: number;
  payload: Record<string, any>;
}

export interface Workflow {
  id: string;
  userId: string;
  name: string;
  enabled: boolean;
  trigger: TriggerConfig;
  conditions: Condition[];
  actions: WorkflowAction[];
  settings?: Record<string, any>;
  analytics?: Record<string, any>;
}
