import { NextResponse } from "next/server";
import { db } from "@/db";
import { emailLogs, businesses } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * Email tracking webhook endpoint
 * Handles SendGrid/Resend webhooks for email events (opened, clicked, bounced, etc.)
 */
export async function POST(request: Request) {
  try {
    const events = await request.json();

    for (const event of Array.isArray(events) ? events : [events]) {
      const { email, event: eventType, timestamp } = event;

      // Find the email log by recipient email
      const business = await db.query.businesses.findFirst({
        where: eq(businesses.email, email),
      });

      if (!business) {
        console.warn(`Business not found for email: ${email}`);
        continue;
      }

      // Update email log based on event type
      switch (eventType) {
        case "open":
        case "opened":
          await db
            .update(emailLogs)
            .set({
              status: "opened",
              openedAt: new Date(timestamp * 1000),
            })
            .where(eq(emailLogs.businessId, business.id));

          // Update business email status
          await db
            .update(businesses)
            .set({ emailStatus: "opened" })
            .where(eq(businesses.id, business.id));
          break;

        case "click":
        case "clicked":
          await db
            .update(emailLogs)
            .set({
              status: "clicked",
              clickedAt: new Date(timestamp * 1000),
            })
            .where(eq(emailLogs.businessId, business.id));

          await db
            .update(businesses)
            .set({ emailStatus: "clicked" })
            .where(eq(businesses.id, business.id));
          break;

        case "bounce":
        case "bounced":
          await db
            .update(emailLogs)
            .set({
              status: "bounced",
            })
            .where(eq(emailLogs.businessId, business.id));

          await db
            .update(businesses)
            .set({ emailStatus: "bounced" })
            .where(eq(businesses.id, business.id));
          break;

        case "spam":
        case "spamreport":
          await db
            .update(emailLogs)
            .set({
              status: "error",
            })
            .where(eq(emailLogs.businessId, business.id));

          await db
            .update(businesses)
            .set({ emailStatus: "failed" })
            .where(eq(businesses.id, business.id));
          break;

        case "unsubscribe":
          await db
            .update(businesses)
            .set({ emailStatus: "unsubscribed" })
            .where(eq(businesses.id, business.id));
          break;

        default:
          console.log(`Unknown event type: ${eventType}`);
      }

      console.log(`📧 Email event processed: ${eventType} for ${email}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return NextResponse.json(
      { error: "Failed to process webhook" },
      { status: 500 }
    );
  }
}
