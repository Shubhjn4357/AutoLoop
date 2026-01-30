/**
 * Social Post Node Executor
 * Handles posting content to social media platforms
 */

import type { SocialPostNode, NodeExecutionResult } from '@/types/workflow-nodes';
import { db } from '@/db';
import { connectedAccounts } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function executeSocialPostNode(
  node: SocialPostNode,
  context: Record<string, unknown>
): Promise<NodeExecutionResult> {
  try {
    const { platforms, content, mediaUrl, scheduledFor, accountId } = node.data;

    // Get connected account
    const account = await db.query.connectedAccounts.findFirst({
      where: eq(connectedAccounts.id, accountId),
    });
    
    if (!account) {
      return {
        success: false,
        error: 'Connected account not found',
      };
    }

    const results: Record<string, boolean> = {};

    // Post to each platform
    for (const platform of platforms) {
      try {
        let posted = false;

        switch (platform) {
          case 'facebook':
            posted = await postToFacebook(account, content, mediaUrl);
            break;
          case 'instagram':
            posted = await postToInstagram(account, content, mediaUrl);
            break;
          case 'linkedin':
            posted = await postToLinkedIn(account, content, mediaUrl);
            break;
          case 'twitter':
            posted = await postToTwitter(account, content, mediaUrl);
            break;
          default:
            console.log(`Platform ${platform} not supported`);
        }

        results[platform] = posted;
      } catch (error) {
        console.error(`Error posting to ${platform}:`, error);
        results[platform] = false;
      }
    }

    // Check if at least one post succeeded
    const anySuccess = Object.values(results).some(v => v);

    return {
      success: anySuccess,
      output: {
        results,
        postedAt: new Date().toISOString(),
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to post',
    };
  }
}

async function postToFacebook(
  account: typeof connectedAccounts.$inferSelect,
  content: string,
  mediaUrl?: string
): Promise<boolean> {
  try {
    const url = `https://graph.facebook.com/v21.0/${account.providerAccountId}/feed`;
    
    const body: Record<string, string> = {
      message: content,
      access_token: account.accessToken,
    };

    if (mediaUrl) {
      body.link = mediaUrl;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    
    if (data.error) {
      console.error('Facebook post error:', data.error);
      return false;
    }

    console.log('✅ Posted to Facebook:', data.id);
    return true;
  } catch (error) {
    console.error('Error posting to Facebook:', error);
    return false;
  }
}

async function postToInstagram(
  account: typeof connectedAccounts.$inferSelect,
  content: string,
  mediaUrl?: string
): Promise<boolean> {
  try {
    // Instagram requires media URL for posts
    if (!mediaUrl) {
      console.error('Instagram posts require media URL');
      return false;
    }

    // Create media container
    const containerUrl = `https://graph.facebook.com/v21.0/${account.providerAccountId}/media`;
    
    const containerBody = {
      image_url: mediaUrl,
      caption: content,
      access_token: account.accessToken,
    };

    const containerResponse = await fetch(containerUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(containerBody),
    });

    const containerData = await containerResponse.json();
    
    if (containerData.error) {
      console.error('Instagram container error:', containerData.error);
      return false;
    }

    // Publish media
    const publishUrl = `https://graph.facebook.com/v21.0/${account.providerAccountId}/media_publish`;
    
    const publishBody = {
      creation_id: containerData.id,
      access_token: account.accessToken,
    };

    const publishResponse = await fetch(publishUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(publishBody),
    });

    const publishData = await publishResponse.json();
    
    if (publishData.error) {
      console.error('Instagram publish error:', publishData.error);
      return false;
    }

    console.log('✅ Posted to Instagram:', publishData.id);
    return true;
  } catch (error) {
    console.error('Error posting to Instagram:', error);
    return false;
  }
}

async function postToLinkedIn(
  account: typeof connectedAccounts.$inferSelect,
  content: string,
  mediaUrl?: string
): Promise<boolean> {
  try {
    const url = 'https://api.linkedin.com/v2/ugcPosts';
    
    const body = {
      author: `urn:li:person:${account.providerAccountId}`,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: {
            text: content,
          },
          shareMediaCategory: mediaUrl ? 'ARTICLE' : 'NONE',
          ...(mediaUrl && {
            media: [
              {
                status: 'READY',
                originalUrl: mediaUrl,
              },
            ],
          }),
        },
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
      },
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${account.accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    
    if (response.status >= 400) {
      console.error('LinkedIn post error:', data);
      return false;
    }

    console.log('✅ Posted to LinkedIn:', data.id);
    return true;
  } catch (error) {
    console.error('Error posting to LinkedIn:', error);
    return false;
  }
}

async function postToTwitter(
  account: typeof connectedAccounts.$inferSelect,
  content: string,
  mediaUrl?: string
): Promise<boolean> {
  // Twitter/X API v2 posting
  console.log('Twitter posting not yet implemented');
  return false;
}
