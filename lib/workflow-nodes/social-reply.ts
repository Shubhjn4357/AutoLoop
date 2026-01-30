/**
 * Social Reply & Monitor Node Executors
 * Handles auto-reply setup and social monitoring in workflows
 */

import type { SocialReplyNode, SocialMonitorNode, NodeExecutionResult } from '@/types/workflow-nodes';
import { db } from '@/db';
import { socialAutomations, connectedAccounts } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * Execute Social Reply Node
 * Creates or updates an automation rule
 */
export async function executeSocialReplyNode(
    node: SocialReplyNode,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _context: Record<string, unknown>
): Promise<NodeExecutionResult> {
    try {
        const { platform, accountId, triggerType, keywords, responseTemplate, actionType } = node.data;

        // Check if account exists
        const account = await db.query.connectedAccounts.findFirst({
            where: eq(connectedAccounts.id, accountId),
        });

        if (!account) {
            return {
                success: false,
                error: 'Connected account not found',
            };
        }

        // Create automation rule
        const automation = await db.insert(socialAutomations).values({
            userId: account.userId,
            name: `Workflow Auto-Reply - ${platform}`,
            connectedAccountId: accountId,
            triggerType,
            keywords: keywords || [],
            actionType,
            responseTemplate,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
        }).returning();

        console.log(`✅ Created social automation:`, automation[0].id);

        return {
            success: true,
            output: {
                automationId: automation[0].id,
                platform,
                triggerType,
            },
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to create automation',
        };
    }
}

/**
 * Execute Social Monitor Node
 * Monitors social media for specific activities
 */
export async function executeSocialMonitorNode(
    node: SocialMonitorNode,
    context: Record<string, unknown>
): Promise<NodeExecutionResult> {
    try {
        const { platform, accountId, monitorType, keywords, saveToVariable } = node.data;

        // Get account
        const account = await db.query.connectedAccounts.findFirst({
            where: eq(connectedAccounts.id, accountId),
        });

        if (!account) {
            return {
                success: false,
                error: 'Connected account not found',
            };
        }

        let results: unknown[] = [];

        // Perform monitoring based on type
        switch (monitorType) {
            case 'comments':
                results = await monitorComments(account, platform, keywords);
                break;
            case 'mentions':
                results = await monitorMentions(account, platform, keywords);
                break;
            case 'messages':
                results = await monitorMessages(account, platform, keywords);
                break;
            case 'followers':
                results = await monitorFollowers(account, platform);
                break;
            default:
                return {
                    success: false,
                    error: `Unknown monitor type: ${monitorType}`,
                };
        }

        // Save to workflow context variable if specified
        const output: Record<string, unknown> = {
            results,
            count: results.length,
            platform,
            monitorType,
        };

        if (saveToVariable) {
            context[saveToVariable] = results;
            output.savedTo = saveToVariable;
        }

        return {
            success: true,
            output,
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to monitor',
        };
    }
}

// Monitor helper functions

async function monitorComments(
    account: typeof connectedAccounts.$inferSelect,
    platform: string,
    keywords?: string[]
): Promise<unknown[]> {
    const comments: unknown[] = [];

    try {
        switch (platform) {
            case 'facebook': {
                const url = `https://graph.facebook.com/v21.0/${account.providerAccountId}/posts?fields=comments{message,from,created_time}&access_token=${account.accessToken}`;
                const response = await fetch(url);
                const data = await response.json();

                if (data.data) {
                    for (const post of data.data) {
                        if (!post.comments?.data) continue;

                        for (const comment of post.comments.data) {
                            // Filter by keywords if provided
                            if (keywords && keywords.length > 0) {
                                const matches = keywords.some(kw =>
                                    comment.message?.toLowerCase().includes(kw.toLowerCase())
                                );
                                if (!matches) continue;
                            }

                            comments.push(comment);
                        }
                    }
                }
                break;
            }

            case 'instagram': {
                const url = `https://graph.facebook.com/v21.0/${account.providerAccountId}/media?fields=comments{text,from,timestamp}&access_token=${account.accessToken}`;
                const response = await fetch(url);
                const data = await response.json();

                if (data.data) {
                    for (const media of data.data) {
                        if (!media.comments?.data) continue;

                        for (const comment of media.comments.data) {
                            if (keywords && keywords.length > 0) {
                                const matches = keywords.some(kw =>
                                    comment.text?.toLowerCase().includes(kw.toLowerCase())
                                );
                                if (!matches) continue;
                            }

                            comments.push(comment);
                        }
                    }
                }
                break;
            }
        }
    } catch (error) {
        console.error('Error monitoring comments:', error);
    }

    return comments;
}

async function monitorMentions(
    account: typeof connectedAccounts.$inferSelect,
    platform: string,
    keywords?: string[]
): Promise<unknown[]> {
    // Similar implementation for mentions
    console.log('Monitoring mentions:', platform, keywords);
    return [];
}

async function monitorMessages(
    account: typeof connectedAccounts.$inferSelect,
    platform: string,
    keywords?: string[]
): Promise<unknown[]> {
    // Similar implementation for messages/DMs
    console.log('Monitoring messages:', platform, keywords);
    return [];
}

async function monitorFollowers(
    account: typeof connectedAccounts.$inferSelect,
    platform: string
): Promise<unknown[]> {
    const followers: unknown[] = [];

    try {
        switch (platform) {
            case 'facebook': {
                const url = `https://graph.facebook.com/v21.0/${account.providerAccountId}?fields=followers_count&access_token=${account.accessToken}`;
                const response = await fetch(url);
                const data = await response.json();

                if (data.followers_count !== undefined) {
                    followers.push({ count: data.followers_count });
                }
                break;
            }

            case 'instagram': {
                const url = `https://graph.facebook.com/v21.0/${account.providerAccountId}?fields=followers_count&access_token=${account.accessToken}`;
                const response = await fetch(url);
                const data = await response.json();

                if (data.followers_count !== undefined) {
                    followers.push({ count: data.followers_count });
                }
                break;
            }
        }
    } catch (error) {
        console.error('Error monitoring followers:', error);
    }

    return followers;
}
