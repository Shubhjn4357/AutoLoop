export async function sendInstagramMessage(
  actorId: string,
  recipientId: string,
  messageText: string,
  accessToken: string,
  graphVersion: string = process.env.META_GRAPH_VERSION || "v25.0"
) {
  const url = `https://graph.facebook.com/${graphVersion}/${actorId}/messages`;
  
  const payload = {
    recipient: {
      id: recipientId,
    },
    message: {
      text: messageText,
    },
    messaging_type: "RESPONSE",
  };

  let lastError: any = null;
  for (let i = 0; i < 3; i++) {
    try {
      console.log(`[Instagram API] Sending message attempt ${i + 1} from ${actorId} to ${recipientId}...`);
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(30000), // 30s timeout
      });

      const data = await res.json();
      if (res.ok) {
        console.log(`[Instagram API] Message sent successfully to ${recipientId}`);
        return data;
      }
      
      const apiMessage = typeof data?.error?.message === "string" ? data.error.message : res.statusText;
      lastError = new Error(`Instagram API Error: ${apiMessage} (Status ${res.status})`);
      console.warn(`[Instagram API] Attempt ${i + 1} failed: ${lastError.message}`);
    } catch (err: any) {
      lastError = err;
      console.error(`[Instagram API] Attempt ${i + 1} connection failed: ${err.message}`);
    }
    
    if (i < 2) await new Promise(r => setTimeout(r, 2000));
  }

  throw lastError || new Error("Failed to send Instagram message after 3 attempts");
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

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok) {
    const apiMessage =
      typeof data?.error?.message === "string" ? data.error.message : res.statusText;
    throw new Error(`Instagram API Error: ${apiMessage}`);
  }

  return data;
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

  const res = await fetch(url);
  const data = await res.json();

  if (!res.ok) {
    const apiMessage =
      typeof data?.error?.message === "string" ? data.error.message : res.statusText;
    throw new Error(`Instagram profile lookup failed: ${apiMessage}`);
  }

  return data as InstagramUserProfile;
}
