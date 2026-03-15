import { getRedis } from "@/lib/redis";

const DEFAULT_TTL_SECONDS = 60 * 60 * 24 * 7;

export function buildSocialEventKey(
  provider: string,
  accountId: string,
  eventType: string,
  eventId: string
) {
  return `social:event:${provider}:${accountId}:${eventType}:${eventId}`;
}

export async function claimSocialEvent(
  eventKey: string,
  ttlSeconds = DEFAULT_TTL_SECONDS
): Promise<boolean> {
  const redis = getRedis();

  if (!redis) {
    return true;
  }

  try {
    const result = await redis.set(eventKey, "1", "EX", ttlSeconds, "NX");
    return result === "OK";
  } catch (error) {
    console.error("Failed to claim social event:", error);
    return true;
  }
}

export async function releaseSocialEvent(eventKey: string): Promise<void> {
  const redis = getRedis();

  if (!redis) {
    return;
  }

  try {
    await redis.del(eventKey);
  } catch (error) {
    console.error("Failed to release social event:", error);
  }
}
