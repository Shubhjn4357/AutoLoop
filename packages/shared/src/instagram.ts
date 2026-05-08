export async function sendInstagramMessage(
  externalId: string,
  recipientId: string,
  messageText: string,
  accessToken: string,
  graphVersion: string = "v25.0"
) {
  const url = `https://graph.instagram.com/${graphVersion}/${externalId}/messages`;
  
  const payload = {
    recipient: {
      id: recipientId,
    },
    message: {
      text: messageText,
    },
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

export async function replyToInstagramComment(
  commentId: string,
  messageText: string,
  accessToken: string,
  graphVersion: string = "v25.0"
) {
  const url = `https://graph.instagram.com/${graphVersion}/${commentId}/replies`;
  
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
  graphVersion: string = "v25.0"
): Promise<InstagramUserProfile> {
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
