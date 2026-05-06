import { after, NextResponse } from "next/server";
import { processTikTokMessage, processTikTokComment } from "@/lib/automation/tiktok-engine";
import { checkRateLimit, getClientIP } from "@/lib/rate-limit";
import crypto from "crypto";

export async function POST(request: Request) {
  const ip = getClientIP(request);
  const rateLimit = checkRateLimit(ip);
  if (!rateLimit.allowed) {
    return new NextResponse("Rate limited", { status: 429 });
  }

  try {
    const textBody = await request.text();
    // TikTok signature verification logic would go here
    
    const body = JSON.parse(textBody);

    if (body.event === "im.message.receive") {
      after(() => processTikTokMessage(body.data).catch(console.error));
    } else if (body.event === "comment.create") {
      after(() => processTikTokComment(body.data).catch(console.error));
    }

    return new NextResponse("OK", { status: 200 });
  } catch (error) {
    console.error("TikTok Webhook Error:", error);
    return new NextResponse("Error", { status: 500 });
  }
}
