// This is a bridge between TikTok webhooks and our unified engine logic
// In a full implementation, we would have a unified engine function that takes platform as a param

export async function processTikTokMessage(data: Record<string, unknown>) {
  // Map TikTok payload to our internal engine format
  // For now, we proxy to the existing engine logic but with platform: 'tiktok'
  // Note: We'd need to update engine.ts to support platform filtering properly
  console.log("[TikTok Engine] Processing message:", data);
}

export async function processTikTokComment(data: Record<string, unknown>) {
  console.log("[TikTok Engine] Processing comment:", data);
}
