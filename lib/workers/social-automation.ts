/**
 * Social Automation Worker
 * Monitors social media platforms for comments/mentions and executes auto-replies
 */

import { db } from "@/db";
import { socialAutomations, connectedAccounts } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { SocialAutomation, SocialComment } from "@/types/social-workflow";

interface AutoReplyContext {
    automation: SocialAutomation & { account: typeof connectedAccounts.$inferSelect };
    comment: SocialComment;
    matchedKeyword: string;
}

/**
 * Main worker class for social automation
 */
export class SocialAutomationWorker {
    private isRunning = false;
    private intervalId: NodeJS.Timeout | null = null;
    private checkIntervalMs = 60000; // Check every 1 minute

    async start() {
        if (this.isRunning) {
            console.log("⚠️ Social automation worker is already running");
            return;
        }

        this.isRunning = true;
        console.log("🤖 Social automation worker started");

        // Initial check
        await this.processAutomations();

        // Set up recurring checks
        this.intervalId = setInterval(async () => {
            await this.processAutomations();
        }, this.checkIntervalMs);
    }

    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        this.isRunning = false;
        console.log("🛑 Social automation worker stopped");
    }

    /**
     * Process all active automations
     */
    private async processAutomations() {
        try {
            // Get all active automations with their connected accounts
            const activeAutomations = await db.query.socialAutomations.findMany({
                where: eq(socialAutomations.isActive, true),
                with: {
                    // This would work if relations are set up in schema
                },
            });

            if (activeAutomations.length === 0) {
                console.log("📭 No active social automations");
                return;
            }

            console.log(`🔍 Processing ${activeAutomations.length} active automations`);

            for (const automation of activeAutomations) {
                try {
                    await this.processAutomation(automation);
                } catch (error) {
                    console.error(`❌ Error processing automation ${automation.id}:`, error);
                }
            }
        } catch (error) {
            console.error("❌ Error in processAutomations:", error);
        }
    }

    /**
     * Process a single automation
     */
    private async processAutomation(automation: typeof socialAutomations.$inferSelect) {
        if (!automation.connectedAccountId) {
            console.log(`⚠️ Automation ${automation.id} has no connected account`);
            return;
        }

        // Get account details
        const account = await db.query.connectedAccounts.findFirst({
            where: eq(connectedAccounts.id, automation.connectedAccountId),
        });

        if (!account) {
            console.log(`⚠️ Connected account not found for automation ${automation.id}`);
            return;
        }

        console.log(`🔎 Checking ${account.provider} for automation "${automation.name}"`);

        // Based on trigger type, check for events
        switch (automation.triggerType) {
            case "comment_keyword":
                await this.checkForKeywordComments(automation, account);
                break;
            case "dm_keyword":
                await this.checkForKeywordDMs(automation, account);
                break;
            case "story_mention":
                await this.checkForStoryMentions(automation, account);
                break;
            case "any_comment":
                await this.checkForAnyComments(automation, account);
                break;
            default:
                console.log(`⚠️ Unknown trigger type: ${automation.triggerType}`);
        }
    }

    /**
     * Check for comments containing keywords
     */
    private async checkForKeywordComments(
        automation: typeof socialAutomations.$inferSelect,
        account: typeof connectedAccounts.$inferSelect
    ) {
        try {
            // Platform-specific implementation
            switch (account.provider) {
                case "facebook":
                    await this.checkFacebookComments(automation, account);
                    break;
                case "instagram":
                    await this.checkInstagramComments(automation, account);
                    break;
                case "linkedin":
                    await this.checkLinkedInComments(automation, account);
                    break;
                default:
                    console.log(`⚠️ Platform ${account.provider} not supported for comment monitoring`);
            }
        } catch (error) {
            console.error(`❌ Error checking keyword comments:`, error);
        }
    }

    /**
     * Check Facebook for comments
     */
    private async checkFacebookComments(
        automation: typeof socialAutomations.$inferSelect,
        account: typeof connectedAccounts.$inferSelect
    ) {
        try {
            // Get recent posts from the page/account
            const url = `https://graph.facebook.com/v21.0/${account.providerAccountId}/posts?fields=id,message,comments{id,message,from}&access_token=${account.accessToken}`;

            const response = await fetch(url);
            const data = await response.json();

            if (data.error) {
                console.error("❌ Facebook API error:", data.error);
                return;
            }

            // Check each post's comments
            for (const post of data.data || []) {
                if (!post.comments?.data) continue;

                for (const comment of post.comments.data) {
                    // Check if comment matches keywords
                    const matchedKeyword = this.matchesKeywords(
                        comment.message,
                        automation.keywords || []
                    );

                    if (matchedKeyword) {
                        console.log(`✅ Found matching comment on Facebook: "${comment.message.substring(0, 50)}..."`);

                        // Execute auto-reply
                        await this.executeAutoReply({
                            automation: automation as AutoReplyContext['automation'],
                            comment: {
                                id: comment.id,
                                postId: post.id,
                                text: comment.message,
                                authorId: comment.from.id,
                                authorName: comment.from.name,
                                createdAt: new Date(),
                            },
                            matchedKeyword,
                        }, account);
                    }
                }
            }
        } catch (error) {
            console.error("❌ Error checking Facebook comments:", error);
        }
    }

    /**
     * Check Instagram for comments
     */
    private async checkInstagramComments(
        automation: typeof socialAutomations.$inferSelect,
        account: typeof connectedAccounts.$inferSelect
    ) {
        try {
            // Get recent media
            const mediaUrl = `https://graph.facebook.com/v21.0/${account.providerAccountId}/media?fields=id,caption,comments{id,text,from,timestamp}&access_token=${account.accessToken}`;

            const response = await fetch(mediaUrl);
            const data = await response.json();

            if (data.error) {
                console.error("❌ Instagram API error:", data.error);
                return;
            }

            // Check each media's comments
            for (const media of data.data || []) {
                if (!media.comments?.data) continue;

                for (const comment of media.comments.data) {
                    const matchedKeyword = this.matchesKeywords(
                        comment.text,
                        automation.keywords || []
                    );

                    if (matchedKeyword) {
                        console.log(`✅ Found matching comment on Instagram: "${comment.text.substring(0, 50)}..."`);

                        await this.executeAutoReply({
                            automation: automation as AutoReplyContext['automation'],
                            comment: {
                                id: comment.id,
                                postId: media.id,
                                text: comment.text,
                                authorId: comment.from.id,
                                authorName: comment.from.username || comment.from.id,
                                createdAt: new Date(comment.timestamp),
                            },
                            matchedKeyword,
                        }, account);
                    }
                }
            }
        } catch (error) {
            console.error("❌ Error checking Instagram comments:", error);
        }
    }

    /**
     * Check LinkedIn for comments
     */
    private async checkLinkedInComments(
        automation: typeof socialAutomations.$inferSelect,
        account: typeof connectedAccounts.$inferSelect
    ) {
        try {
            // Get user's recent posts/articles
            const postsUrl = `https://api.linkedin.com/v2/ugcPosts?q=authors&authors=List(urn:li:person:${account.providerAccountId})&count=10`;

            const response = await fetch(postsUrl, {
                headers: {
                    'Authorization': `Bearer ${account.accessToken}`,
                    'X-Restli-Protocol-Version': '2.0.0',
                },
            });

            const data = await response.json();

            if (data.status && data.status !== 200) {
                console.error("❌ LinkedIn API error:", data.message);
                return;
            }

            // Check each post for comments
            for (const post of data.elements || []) {
                const postUrn = post.id;

                // Get comments for this post
                const commentsUrl = `https://api.linkedin.com/v2/socialActions/${postUrn}/comments`;

                const commentsResponse = await fetch(commentsUrl, {
                    headers: {
                        'Authorization': `Bearer ${account.accessToken}`,
                        'X-Restli-Protocol-Version': '2.0.0',
                    },
                });

                const commentsData = await commentsResponse.json();

                for (const comment of commentsData.elements || []) {
                    const commentText = comment.message?.text || '';

                    const matchedKeyword = this.matchesKeywords(
                        commentText,
                        automation.keywords || []
                    );

                    if (matchedKeyword) {
                        console.log(`✅ Found matching comment on LinkedIn: "${commentText.substring(0, 50)}..."`);

                        await this.executeAutoReply({
                            automation: automation as AutoReplyContext['automation'],
                            comment: {
                                id: comment.id,
                                postId: postUrn,
                                text: commentText,
                                authorId: comment.actor || '',
                                authorName: comment.actor || 'LinkedIn User',
                                createdAt: new Date(comment.created?.time || Date.now()),
                            },
                            matchedKeyword,
                        }, account);
                    }
                }
            }
        } catch (error) {
            console.error("❌ Error checking LinkedIn comments:", error);
        }
    }

    /**
     * Check for DMs with keywords
     */
    private async checkForKeywordDMs(
        automation: typeof socialAutomations.$inferSelect,
        account: typeof connectedAccounts.$inferSelect
    ) {
        try {
            switch (account.provider) {
                case "facebook":
                    await this.checkFacebookMessages(automation, account);
                    break;
                case "instagram":
                    await this.checkInstagramMessages(automation, account);
                    break;
                default:
                    console.log(`⚠️ DM monitoring not supported for ${account.provider}`);
            }
        } catch (error) {
            console.error("❌ Error checking DMs:", error);
        }
    }

    /**
     * Check Facebook Messenger for messages
     */
    private async checkFacebookMessages(
        automation: typeof socialAutomations.$inferSelect,
        account: typeof connectedAccounts.$inferSelect
    ) {
        try {
            // Get conversations
            const url = `https://graph.facebook.com/v21.0/me/conversations?fields=messages{message,from,created_time}&access_token=${account.accessToken}`;

            const response = await fetch(url);
            const data = await response.json();

            if (data.error) {
                console.error("❌ Facebook Messenger API error:", data.error);
                return;
            }

            for (const conversation of data.data || []) {
                if (!conversation.messages?.data) continue;

                for (const message of conversation.messages.data) {
                    // Skip messages from the page itself
                    if (message.from?.id === account.providerAccountId) continue;

                    const matchedKeyword = this.matchesKeywords(
                        message.message || '',
                        automation.keywords || []
                    );

                    if (matchedKeyword) {
                        console.log(`✅ Found matching DM on Facebook: "${message.message?.substring(0, 50)}..."`);

                        // Send DM reply
                        await this.sendDM(message.from.id, automation.responseTemplate || 'Thank you!', account);
                    }
                }
            }
        } catch (error) {
            console.error("❌ Error checking Facebook messages:", error);
        }
    }

    /**
     * Check Instagram Direct Messages
     */
    private async checkInstagramMessages(
        automation: typeof socialAutomations.$inferSelect,
        account: typeof connectedAccounts.$inferSelect
    ) {
        try {
            // Get conversations from Instagram
            const url = `https://graph.facebook.com/v21.0/me/conversations?platform=instagram&fields=messages{message,from,created_time}&access_token=${account.accessToken}`;

            const response = await fetch(url);
            const data = await response.json();

            if (data.error) {
                console.error("❌ Instagram Messages API error:", data.error);
                return;
            }

            for (const conversation of data.data || []) {
                if (!conversation.messages?.data) continue;

                for (const message of conversation.messages.data) {
                    // Skip messages from the account itself
                    if (message.from?.id === account.providerAccountId) continue;

                    const matchedKeyword = this.matchesKeywords(
                        message.message || '',
                        automation.keywords || []
                    );

                    if (matchedKeyword) {
                        console.log(`✅ Found matching DM on Instagram: "${message.message?.substring(0, 50)}..."`);

                        await this.sendDM(message.from.id, automation.responseTemplate || 'Thank you!', account);
                    }
                }
            }
        } catch (error) {
            console.error("❌ Error checking Instagram messages:", error);
        }
    }

    /**
     * Check for Instagram story mentions
     */
    private async checkForStoryMentions(
        automation: typeof socialAutomations.$inferSelect,
        account: typeof connectedAccounts.$inferSelect
    ) {
        if (account.provider !== 'instagram') {
            console.log(`⚠️ Story mentions only supported on Instagram`);
            return;
        }

        try {
            // Get recent stories with mentions
            const url = `https://graph.facebook.com/v21.0/${account.providerAccountId}/stories?fields=id,media_type,media_url,timestamp&access_token=${account.accessToken}`;

            const response = await fetch(url);
            const data = await response.json();

            if (data.error) {
                console.error("❌ Instagram Stories API error:", data.error);
                return;
            }

            for (const story of data.data || []) {
                // Get mentions for this story
                const mentionsUrl = `https://graph.facebook.com/v21.0/${story.id}/insights?metric=mentions&access_token=${account.accessToken}`;

                const mentionsResponse = await fetch(mentionsUrl);
                const mentionsData = await mentionsResponse.json();

                if (mentionsData.data && mentionsData.data.length > 0) {
                    console.log(`✅ Found story mention on Instagram`);

                    // For story mentions, we typically send a DM
                    const replyText = automation.responseTemplate || 'Thanks for mentioning us in your story!';

                    // Note: We'd need the user ID who mentioned us
                    // This is typically provided via webhooks in real-time
                    console.log(`📸 Story mention detected, response: "${replyText}"`);
                }
            }
        } catch (error) {
            console.error("❌ Error checking story mentions:", error);
        }
    }

    /**
     * Check for any comments (responds to all comments without keyword filtering)
     */
    private async checkForAnyComments(
        automation: typeof socialAutomations.$inferSelect,
        account: typeof connectedAccounts.$inferSelect
    ) {
        try {
            switch (account.provider) {
                case "facebook":
                    await this.checkFacebookAllComments(automation, account);
                    break;
                case "instagram":
                    await this.checkInstagramAllComments(automation, account);
                    break;
                case "linkedin":
                    await this.checkLinkedInComments(automation, account);
                    break;
                default:
                    console.log(`⚠️ Platform ${account.provider} not supported for comment monitoring`);
            }
        } catch (error) {
            console.error("❌ Error checking all comments:", error);
        }
    }

    /**
     * Check all Facebook comments without keyword filtering
     */
    private async checkFacebookAllComments(
        automation: typeof socialAutomations.$inferSelect,
        account: typeof connectedAccounts.$inferSelect
    ) {
        try {
            const url = `https://graph.facebook.com/v21.0/${account.providerAccountId}/posts?fields=id,message,comments{id,message,from}&limit=10&access_token=${account.accessToken}`;

            const response = await fetch(url);
            const data = await response.json();

            if (data.error) {
                console.error("❌ Facebook API error:", data.error);
                return;
            }

            for (const post of data.data || []) {
                if (!post.comments?.data) continue;

                for (const comment of post.comments.data) {
                    console.log(`✅ Found comment on Facebook: "${comment.message?.substring(0, 50)}..."`);

                    await this.executeAutoReply({
                        automation: automation as AutoReplyContext['automation'],
                        comment: {
                            id: comment.id,
                            postId: post.id,
                            text: comment.message,
                            authorId: comment.from.id,
                            authorName: comment.from.name,
                            createdAt: new Date(),
                        },
                        matchedKeyword: '', // No keyword for "any comment" trigger
                    }, account);
                }
            }
        } catch (error) {
            console.error("❌ Error checking all Facebook comments:", error);
        }
    }

    /**
     * Check all Instagram comments without keyword filtering
     */
    private async checkInstagramAllComments(
        automation: typeof socialAutomations.$inferSelect,
        account: typeof connectedAccounts.$inferSelect
    ) {
        try {
            const mediaUrl = `https://graph.facebook.com/v21.0/${account.providerAccountId}/media?fields=id,caption,comments{id,text,from,timestamp}&limit=10&access_token=${account.accessToken}`;

            const response = await fetch(mediaUrl);
            const data = await response.json();

            if (data.error) {
                console.error("❌ Instagram API error:", data.error);
                return;
            }

            for (const media of data.data || []) {
                if (!media.comments?.data) continue;

                for (const comment of media.comments.data) {
                    console.log(`✅ Found comment on Instagram: "${comment.text?.substring(0, 50)}..."`);

                    await this.executeAutoReply({
                        automation: automation as AutoReplyContext['automation'],
                        comment: {
                            id: comment.id,
                            postId: media.id,
                            text: comment.text,
                            authorId: comment.from.id,
                            authorName: comment.from.username || comment.from.id,
                            createdAt: new Date(comment.timestamp),
                        },
                        matchedKeyword: '', // No keyword for "any comment" trigger
                    }, account);
                }
            }
        } catch (error) {
            console.error("❌ Error checking all Instagram comments:", error);
        }
    }

    /**
     * Check if text matches any keywords
     */
    private matchesKeywords(text: string, keywords: string[]): string | null {
        if (!keywords || keywords.length === 0) return null;

        const lowerText = text.toLowerCase();
        for (const keyword of keywords) {
            if (lowerText.includes(keyword.toLowerCase())) {
                return keyword;
            }
        }
        return null;
    }

    /**
     * Execute auto-reply action
     */
    private async executeAutoReply(
        context: AutoReplyContext,
        account: typeof connectedAccounts.$inferSelect
    ) {
        try {
            const { automation, comment, matchedKeyword } = context;

            // Generate reply text (replace template variables)
            let replyText = automation.responseTemplate || "Thank you for your comment!";
            replyText = replyText
                .replace(/\{keyword\}/g, matchedKeyword)
                .replace(/\{author\}/g, comment.authorName)
                .replace(/\{comment\}/g, comment.text);

            console.log(`💬 Sending auto-reply: "${replyText.substring(0, 50)}..."`);

            // Execute based on action type
            switch (automation.actionType) {
                case "reply_comment":
                    await this.replyToComment(comment, replyText, account);
                    break;
                case "send_dm":
                    await this.sendDM(comment.authorId, replyText, account);
                    break;
                case "whatsapp_reply":
                    console.log("📱 WhatsApp reply not yet implemented");
                    break;
                default:
                    console.log(`⚠️ Unknown action type: ${automation.actionType}`);
            }

            // Log the action
            console.log(`✅ Auto-reply sent for automation "${automation.name}"`);
        } catch (error) {
            console.error("❌ Error executing auto-reply:", error);
        }
    }

    /**
     * Reply to a comment
     */
    private async replyToComment(
        comment: SocialComment,
        replyText: string,
        account: typeof connectedAccounts.$inferSelect
    ) {
        try {
            let url = "";
            let body: Record<string, string> = {};

            switch (account.provider) {
                case "facebook":
                    url = `https://graph.facebook.com/v21.0/${comment.id}/comments`;
                    body = {
                        message: replyText,
                        access_token: account.accessToken,
                    };
                    break;
                case "instagram":
                    url = `https://graph.facebook.com/v21.0/${comment.id}/replies`;
                    body = {
                        message: replyText,
                        access_token: account.accessToken,
                    };
                    break;
                default:
                    console.log(`⚠️ Platform ${account.provider} not supported for replying`);
                    return;
            }

            const response = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            const data = await response.json();

            if (data.error) {
                console.error("❌ Error replying to comment:", data.error);
            } else {
                console.log(`✅ Reply posted successfully`);
            }
        } catch (error) {
            console.error("❌ Error in replyToComment:", error);
        }
    }

    /**
     * Send DM to user
     */
    private async sendDM(
        userId: string,
        messageText: string,
        account: typeof connectedAccounts.$inferSelect
    ) {
        try {
            let url = '';
            let body: Record<string, unknown> = {};

            switch (account.provider) {
                case 'facebook':
                    // Facebook Messenger Send API
                    url = `https://graph.facebook.com/v21.0/me/messages`;
                    body = {
                        recipient: { id: userId },
                        message: { text: messageText },
                        access_token: account.accessToken,
                    };
                    break;

                case 'instagram':
                    // Instagram Direct Messages API
                    url = `https://graph.facebook.com/v21.0/me/messages`;
                    body = {
                        recipient: { id: userId },
                        message: { text: messageText },
                        access_token: account.accessToken,
                    };
                    break;

                case 'linkedin':
                    // LinkedIn Messaging API
                    url = `https://api.linkedin.com/v2/messages`;
                    body = {
                        recipients: [`urn:li:person:${userId}`],
                        subject: 'Message from AutoLoop',
                        body: messageText,
                    };
                    break;

                default:
                    console.log(`⚠️ DM sending not supported for ${account.provider}`);
                    return;
            }

            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
            };

            if (account.provider === 'linkedin') {
                headers['Authorization'] = `Bearer ${account.accessToken}`;
                headers['X-Restli-Protocol-Version'] = '2.0.0';
            }

            const response = await fetch(url, {
                method: 'POST',
                headers,
                body: JSON.stringify(body),
            });

            const data = await response.json();

            if (data.error || (response.status >= 400)) {
                console.error(`❌ Error sending DM on ${account.provider}:`, data.error || data);
            } else {
                console.log(`✅ DM sent successfully on ${account.provider} to user ${userId}`);
            }
        } catch (error) {
            console.error('❌ Error in sendDM:', error);
        }
    }
}

// Export singleton instance
export const socialAutomationWorker = new SocialAutomationWorker();

/**
 * Start the social automation worker
 */
export async function startSocialAutomationWorker() {
    console.log("🚀 Starting social automation worker...");
    await socialAutomationWorker.start();
}

/**
 * Stop the social automation worker
 */
export function stopSocialAutomationWorker() {
    socialAutomationWorker.stop();
}
