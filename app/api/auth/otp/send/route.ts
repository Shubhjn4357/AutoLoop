import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { sendWhatsAppOTP } from "@/lib/whatsapp/client";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const { phoneNumber } = await req.json();

    if (!phoneNumber) {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
    }

    // Check if user exists with this phone number?
    // For now, let's enforce that the user must exist in DB (even if just Admin)
    // Or we allow anyone to receive OTP but only login if they match a known user?
    // Let's check DB first for security.
    const user = await db.query.users.findFirst({
      where: eq(users.phone, phoneNumber)
    });

    // Also allow admin credential phone fallback if defined in env?
    // For MVP, if no user found, maybe block or allow sign up?
    // "User Review Required": Decision: Only allow existing users.
    if (!user) {
      return NextResponse.json({ error: "No user found with this phone number." }, { status: 404 });
    }

    // Generate 6 digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Store in Redis (TTL 5 mins)
    await redis.set(`otp:${phoneNumber}`, code, "EX", 300);

    // Send via WhatsApp
    await sendWhatsAppOTP(phoneNumber, code);

    // Development Mode: Log code to console if no creds
    if (process.env.NODE_ENV === "development") {
      console.log(`[DEV] OTP for ${phoneNumber}: ${code}`);
    }

    return NextResponse.json({ success: true });

  } catch (error: unknown) {
    console.error("OTP Send Error:", error instanceof Error ? error.message : String(error));
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
