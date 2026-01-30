// Social Media Publishing Types

import type { Redis } from 'ioredis';

// ============================================================================
// Social Media Publishing Types
// ============================================================================

export interface SocialPostPayload {
    content: string;
    mediaUrl?: string; // Relative path like "/uploads/xyz.jpg"
    accessToken: string;
    providerAccountId: string;
    refreshToken?: string; // Needed for YouTube
}

export interface FacebookFormParams {
    append(name: string, value: string | Blob, fileName?: string): void;
}

export interface InstagramContainerParams {
    access_token: string;
    caption: string;
    image_url?: string;
    media_type?: 'VIDEO' | 'IMAGE';
    video_url?: string;
}

export interface LinkedInPostBody {
    author: string;
    lifecycleState: 'PUBLISHED';
    specificContent: {
        'com.linkedin.ugc.ShareContent': {
            shareCommentary: {
                text: string;
            };
            shareMediaCategory: 'NONE' | 'IMAGE' | 'VIDEO';
            media?: Array<{
                status: 'READY';
                description: { text: string };
                media: string;
                title: { text: string };
            }>;
        };
    };
    visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC';
    };
}

export interface LinkedInRegisterUploadRequest {
    registerUploadRequest: {
        recipes: string[];
        owner: string;
        serviceRelationships: Array<{
            relationshipType: string;
            identifier: string;
        }>;
    };
}

export interface LinkedInRegisterResponse {
    value: {
        uploadMechanism: {
            'com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest': {
                uploadUrl: string;
            };
        };
        asset: string;
    };
    status?: number;
}

export interface YouTubeVideoSnippet {
    title: string;
    description: string;
}

export interface YouTubeVideoStatus {
    privacyStatus: 'public' | 'private' | 'unlisted';
}

// ============================================================================
// Redis & Brute Force Protection Types
// ============================================================================

export type RedisClient = Redis | null;

export interface BruteForceAttempt {
    timestamp: number;
    ip: string;
    identifier: string;
}

export interface BruteForceConfig {
    maxAttempts: number;
    windowMs: number;
    blockDurationMs: number;
}

// ============================================================================
// Workflow Node & Edge Types
// ============================================================================

export type WorkflowNodeType = 
    | 'trigger'
    | 'scraper'
    | 'filter'
    | 'email'
    | 'delay'
    | 'condition'
    | 'ai-generated-email'
    | 'api-request'
    | 'agent-excel';

export interface WorkflowNodePosition {
    x: number;
    y: number;
}

export interface WorkflowNodeData {
    label: string;
    type?: WorkflowNodeType;
    config?: Record<string, unknown>;
    // Specific node configurations
    keywords?: string[];
    emailTemplate?: string;
    delayHours?: number;
    condition?: string;
    apiUrl?: string;
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    headers?: Record<string, string>;
    body?: string;
}

export interface WorkflowNode {
    id: string;
    type: WorkflowNodeType;
    position: WorkflowNodePosition;
    data: WorkflowNodeData;
}

export interface WorkflowEdge {
    id: string;
    source: string;
    target: string;
    sourceHandle?: string | null;
    targetHandle?: string | null;
    type?: string;
    animated?: boolean;
    label?: string;
}

// ============================================================================
// Social Automation Types
// ============================================================================

export type SocialTriggerType = 
    | 'comment_keyword'
    | 'dm_keyword'
    | 'story_mention'
    | 'any_comment';

export type SocialActionType = 
    | 'reply_comment'
    | 'send_dm'
    | 'whatsapp_reply';

export interface SocialAutomation {
    id: string;
    userId: string;
    connectedAccountId: string | null;
    name: string;
    triggerType: SocialTriggerType;
    keywords: string[] | null;
    actionType: SocialActionType;
    responseTemplate: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface SocialComment {
    id: string;
    postId: string;
    text: string;
    authorId: string;
    authorName: string;
    createdAt: Date;
}

export interface SocialMention {
    id: string;
    type: 'comment' | 'dm' | 'story';
    content: string;
    authorId: string;
    authorName: string;
    createdAt: Date;
}

// ============================================================================
// Scraper Types
// ============================================================================

export type ScraperSourceName = 
    | 'google-maps'
    | 'google-search'
    | 'linkedin'
    | 'facebook'
    | 'instagram';

export interface ScrapingOptions {
    keywords: string[];
    location?: string;
    limit?: number;
    maxResults?: number;
}

export interface BusinessData {
    name: string;
    address?: string;
    phone?: string;
    email?: string;
    website?: string;
    rating?: number;
    reviewCount?: number;
    category?: string;
    description?: string;
    hours?: string;
    imageUrl?: string;
    source: string;
    sourceUrl?: string;
    socialMedia?: {
        linkedin?: string;
        facebook?: string;
        instagram?: string;
        twitter?: string;
    };
}

export interface Scraper {
    displayName: string;
    enabled: boolean;
    scrape: (options: ScrapingOptions, userId: string) => Promise<BusinessData[]>;
}
