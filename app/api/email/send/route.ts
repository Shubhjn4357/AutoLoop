import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { businesses, emailTemplates, emailLogs, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { sendColdEmail, interpolateTemplate } from "@/lib/email";
import { checkEmailRateLimit } from "@/lib/rate-limit";
import { SessionUser } from "@/types";

export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const currentUser = session.user as SessionUser;

        // CHECK RATE LIMIT
        const allowed = await checkEmailRateLimit(currentUser.id);
        if (!allowed) {
            return NextResponse.json(
                { error: "Daily email limit reached (50/day). Please upgrade your plan." },
                { status: 429 }
            );
        }

        const { businessId } = await request.json();

        if (!businessId) {
            return NextResponse.json(
                { error: "Business ID required" },
                { status: 400 }
            );
        }
        // Check if user has connected Google Account (access token)
        if (!currentUser.accessToken) {
            return NextResponse.json(
                { error: "Google Account not connected. Please sign out and sign in with Google." },
                { status: 403 }
            );
        }

        // Fetch business
        const business = await db.query.businesses.findFirst({
            where: and(
                eq(businesses.id, businessId),
                eq(businesses.userId, currentUser.id)
            ),
        });

        if (!business) {
            return NextResponse.json({ error: "Business not found" }, { status: 404 });
        }

        // Fetch default template
        const template = await db.query.emailTemplates.findFirst({
            where: and(
                eq(emailTemplates.userId, currentUser.id),
                eq(emailTemplates.isDefault, true)
            ),
        });

        if (!template) {
            return NextResponse.json(
                { error: "No default email template found. Please set one in Settings > Templates." },
                { status: 400 }
            );
        }

        // Fetch user details for variable interpolation
        const userDetails = await db.query.users.findFirst({
            where: eq(users.id, currentUser.id),
        });

        // Send email
        const { success, error } = await sendColdEmail(business, template, currentUser.accessToken, userDetails);

        // Update business status
        await db
            .update(businesses)
            .set({
                emailSent: true,
                emailSentAt: new Date(),
                emailStatus: success ? "sent" : "failed",
                updatedAt: new Date(),
            })
            .where(eq(businesses.id, businessId));

        // Log email
        await db.insert(emailLogs).values({
            userId: currentUser.id,
            businessId: business.id,
            templateId: template.id,
            subject: interpolateTemplate(template.subject, business, userDetails),
            body: interpolateTemplate(template.body, business, userDetails),
            status: success ? "sent" : "failed",
            errorMessage: error, // Log the error message
            sentAt: success ? new Date() : null,
        });

        if (!success) {
            console.error("Email send failed:", error);
            return NextResponse.json(
                { error: error || "Failed to send email via Gmail API" },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true, emailStatus: "sent" });
    } catch (error) {
        console.error("Error sending email:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
