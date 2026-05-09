export async function sendInstagramMessage(
  actorId: string,
  recipientId: string,
  messageText: string,
  accessToken: string,
  options: {
    buttons?: Array<{ type: 'web_url', url: string, title: string } | { type: 'postback', title: string, payload: string }>;
    quickReplies?: Array<{ title: string, payload: string }>;
    graphVersion?: string;
  } = {}
) {
  const graphVersion = options.graphVersion || process.env.META_GRAPH_VERSION || "v25.0";
  const url = `https://graph.facebook.com/${graphVersion}/${actorId}/messages`;
  
  let messagePayload: any = { text: messageText };

  // If buttons are provided, use a Generic Template
  if (options.buttons && options.buttons.length > 0) {
    messagePayload = {
      attachment: {
        type: "template",
        payload: {
          template_type: "generic",
          elements: [{
            title: messageText.substring(0, 80),
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
