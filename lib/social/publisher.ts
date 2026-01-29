
interface PublishParams {
  accessToken: string;
  providerAccountId: string; // Page ID for FB, IG Business User ID for IG
  content?: string;
  mediaUrls?: string[];
}

export async function publishToFacebook({ accessToken, providerAccountId, content, mediaUrls }: PublishParams) {
  // For now, let's support text-only or single image for MVP simplification
  // Multi-photo posts on Graph API require a staged upload flow (unpublished media -> attached to post)

  const pageId = providerAccountId;
  let endpoint = `https://graph.facebook.com/v19.0/${pageId}/feed`;
  const params = new URLSearchParams({ access_token: accessToken });

  if (content) params.append("message", content);

  if (mediaUrls && mediaUrls.length > 0) {
    // If photos, use /photos endpoint for single photo
    // TODO: Support multi-photo
    endpoint = `https://graph.facebook.com/v19.0/${pageId}/photos`;
    params.append("url", mediaUrls[0]);
    if (content) params.append("caption", content); // FB photos use 'caption' not 'message'
  }

  const res = await fetch(`${endpoint}?${params.toString()}`, { method: "POST" });
  const data = await res.json();

  if (data.error) {
    throw new Error(data.error.message);
  }

  return { id: data.id || data.post_id };
}


export async function publishToInstagram({ accessToken, providerAccountId, content, mediaUrls }: PublishParams) {
  // Instagram requires: 1. Create Container, 2. Publish Container
  const igUserId = providerAccountId;

  if (!mediaUrls || mediaUrls.length === 0) {
    throw new Error("Instagram posts require at least one image/video.");
  }

  const imageUrl = mediaUrls[0]; // Single image for MVP

  // Step 1: Create Container
  // https://graph.facebook.com/v19.0/{ig-user-id}/media
  const containerParams = new URLSearchParams({
    access_token: accessToken,
    image_url: imageUrl,
  });
  if (content) containerParams.append("caption", content);

  const containerRes = await fetch(`https://graph.facebook.com/v19.0/${igUserId}/media?${containerParams.toString()}`, { method: "POST" });
  const containerData = await containerRes.json();

  if (containerData.error) {
    throw new Error(`IG Container Error: ${containerData.error.message}`);
  }

  const containerId = containerData.id;

  // Step 2: Publish Container
  // https://graph.facebook.com/v19.0/{ig-user-id}/media_publish
  const publishParams = new URLSearchParams({
    access_token: accessToken,
    creation_id: containerId
  });

  const publishRes = await fetch(`https://graph.facebook.com/v19.0/${igUserId}/media_publish?${publishParams.toString()}`, { method: "POST" });
  const publishData = await publishRes.json();

  if (publishData.error) {
    throw new Error(`IG Publish Error: ${publishData.error.message}`);
  }


  return { id: publishData.id };
}

export async function replyToComment(commentId: string, message: string, accessToken: string) {
  const res = await fetch(`https://graph.facebook.com/v19.0/${commentId}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      access_token: accessToken
    })
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data;
}

export async function sendPrivateMessage(recipientId: string, message: string, accessToken: string) {
  // For Pages messaging users (Messenger Platform)
  // NOTE: This requires 'pages_messaging' permission
  const res = await fetch(`https://graph.facebook.com/v19.0/me/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      recipient: { id: recipientId },
      message: { text: message },
      access_token: accessToken
    })
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data;
}

