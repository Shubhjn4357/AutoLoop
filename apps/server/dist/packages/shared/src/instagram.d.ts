export declare function sendInstagramMessage(externalId: string, recipientId: string, messageText: string, accessToken: string, graphVersion?: string): Promise<any>;
export declare function replyToInstagramComment(commentId: string, messageText: string, accessToken: string, graphVersion?: string): Promise<any>;
export interface InstagramUserProfile {
    id: string;
    name?: string;
    username?: string;
    profile_pic?: string;
    is_user_follow_business?: boolean;
    is_business_follow_user?: boolean;
}
export declare function getInstagramUserProfile(recipientId: string, accessToken: string, graphVersion?: string): Promise<InstagramUserProfile>;
