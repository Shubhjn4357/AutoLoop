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
  const graphVersion = options.graphVersion || process.env.META_GRAPH_VERSION || "v25.0";
  const url = `https://graph.facebook.com/${graphVersion}/${actorId}/messages`;
  
  let messagePayload: any = {};
  if (messageText) {
    messagePayload.text = messageText;
  }

  // Handle Multi-media or Attachment IDs
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
      messagePayload.attachments = mediaElements.slice(0, 10); // Meta limit is 10
    }
  }

  // If buttons are provided, use a Generic Template
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

  // If quick replies are provided
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

  let lastError: any = null;
  const retries = 5;
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(30000),
      });

      const data = await res.json();
      if (res.ok) return data;
      
      lastError = new Error(`Instagram API Error: ${data?.error?.message || res.statusText}`);
    } catch (err: any) {
      lastError = err;
    }
    if (i < retries - 1) await new Promise(r => setTimeout(r, 2000 * Math.pow(2, i)));
  }
  throw lastError;
}

export async function replyToInstagramComment(
  commentId: string,
  messageText: string,
  accessToken: string,
  graphVersion: string = process.env.META_GRAPH_VERSION || "v25.0"
) {
  const url = `https://graph.facebook.com/${graphVersion}/${commentId}/replies`;
  
  const payload = {
    message: messageText,
  };

  let lastError: any = null;
  for (let i = 0; i < 3; i++) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(20000),
      });

      const data = await res.json();
      if (res.ok) return data;
      lastError = new Error(`Instagram API Error: ${data?.error?.message || res.statusText}`);
    } catch (err) {
      lastError = err;
    }
    if (i < 2) await new Promise(r => setTimeout(r, 2000));
  }
  throw lastError;
}

export interface InstagramUserProfile {
  id: string;
  name?: string;
  username?: string;
  profile_pic?: string;
  is_user_follow_business?: boolean;
  is_business_follow_user?: boolean;
}

export async function getInstagramUserProfile(
  recipientId: string,
  accessToken: string,
  graphVersion: string = process.env.META_GRAPH_VERSION || "v25.0"
): Promise<InstagramUserProfile> {
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

  let lastError: any = null;
  for (let i = 0; i < 3; i++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
      const data = await res.json();

      if (!res.ok) {
        const apiMessage =
          typeof data?.error?.message === "string" ? data.error.message : res.statusText;
        throw new Error(`Instagram profile lookup failed: ${apiMessage}`);
      }

      return data as InstagramUserProfile;
    } catch (err) {
      lastError = err;
    }
    if (i < 2) await new Promise(r => setTimeout(r, 2000));
  }
  throw lastError;
}

/**
 * Like or unlike an Instagram media post or comment.
 * Requires instagram_manage_engagement permission.
 */
export async function likeMediaOrComment(
  igUserId: string,
  targetId: string, // media_id or comment_id
  accessToken: string,
  action: 'POST' | 'DELETE' = 'POST',
  type: 'media_id' | 'comment_id' = 'comment_id',
  graphVersion: string = process.env.META_GRAPH_VERSION || "v25.0"
) {
  const url = `https://graph.facebook.com/${graphVersion}/${igUserId}/likes`;
  
  const payload: Record<string, string> = {};
  payload[type] = targetId;

  let lastError: any = null;
  for (let i = 0; i < 3; i++) {
    try {
      if (action === 'DELETE') {
        const deleteUrl = new URL(url);
        deleteUrl.searchParams.set("access_token", accessToken);
        deleteUrl.searchParams.set(type, targetId);
        const delRes = await fetch(deleteUrl.toString(), { method: 'DELETE' });
        const delData = await delRes.json();
        if (delRes.ok) return delData;
        throw new Error(delData?.error?.message || delRes.statusText);
      }

      const res = await fetch(url, {
        method: action,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) return data;
      lastError = new Error(`Instagram Engagement API Error: ${data?.error?.message || res.statusText}`);
    } catch (err) {
      lastError = err;
    }
    if (i < 2) await new Promise(r => setTimeout(r, 2000));
  }
  throw lastError;
}
