export async function sendInstagramMessage(
  igUserId: string,
  recipientId: string,
  messageText: string,
  accessToken: string
) {
  const graphVersion = process.env.META_GRAPH_VERSION || "v21.0";
  const url = `https://graph.instagram.com/${graphVersion}/${igUserId}/messages`;
  
  const payload = {
    recipient: {
      id: recipientId,
    },
    message: {
      text: messageText,
    },
  };

  try {
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
      console.error("[IG Client] Error sending message:", data);
      const apiMessage =
        typeof data?.error?.message === "string" ? data.error.message : res.statusText;
      throw new Error(`Instagram API Error: ${apiMessage}`);
    }

    console.log("[IG Client] Message sent successfully", data);
    return data;
  } catch (error) {
    console.error("[IG Client] Failed to send message", error);
    throw error;
  }
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
  accessToken: string
): Promise<InstagramUserProfile> {
  const graphVersion = process.env.META_GRAPH_VERSION || "v21.0";
  const fields = [
    "id",
    "name",
    "username",
    "profile_pic",
    "is_user_follow_business",
    "is_business_follow_user",
  ].join(",");
  const url = new URL(`https://graph.instagram.com/${graphVersion}/${recipientId}`);
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
