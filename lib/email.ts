import { google } from "googleapis";
import { Business, EmailTemplate } from "@/types";

interface SendEmailOptions {
  to: string;
  subject: string;
  body: string;
  accessToken: string;
}

export async function sendEmail(options: SendEmailOptions): Promise<boolean> {
  const { to, subject, body, accessToken } = options;

  try {
    const gmail = google.gmail({ version: "v1" });

    // Create email message
    const message = [
      `To: ${to}`,
      `Subject: ${subject}`,
      "Content-Type: text/html; charset=utf-8",
      "",
      body,
    ].join("\n");

    // Encode message in base64
    const encodedMessage = Buffer.from(message)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    // Send email
    await gmail.users.messages.send({
      userId: "me",
      requestBody: {
        raw: encodedMessage,
      },
      auth: new google.auth.OAuth2({
        credentials: {
          access_token: accessToken,
        },
      }),
    });

    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
}

export function interpolateTemplate(
  template: string,
  business: Business
): string {
  return template
    .replace(/\{brand_name\}/g, business.name)
    .replace(/\{email\}/g, business.email || "")
    .replace(/\{phone\}/g, business.phone || "")
    .replace(/\{website\}/g, business.website || "")
    .replace(/\{address\}/g, business.address || "")
    .replace(/\{category\}/g, business.category);
}

export async function sendColdEmail(
  business: Business,
  template: EmailTemplate,
  accessToken: string
): Promise<boolean> {
  if (!business.email) {
    console.log(`No email for business ${business.name}`);
    return false;
  }

  const subject = interpolateTemplate(template.subject, business);
  const body = interpolateTemplate(template.body, business);

  return await sendEmail({
    to: business.email,
    subject,
    body,
    accessToken,
  });
}

// Process emails in queue
export class EmailService {
  private isRunning = false;
  private intervalId: NodeJS.Timeout | null = null;

  async start(userId: string, accessToken: string) {
    if (this.isRunning) {
      console.log("Email service is already running");
      return;
    }

    this.isRunning = true;
    console.log("Starting email service");

    // Process emails every 5 minutes
    this.intervalId = setInterval(
      async () => {
        await this.processEmailQueue(userId, accessToken);
      },
      5 * 60 * 1000
    );
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log("Email service stopped");
  }

  private async processEmailQueue(userId: string, accessToken: string) {
    try {
      const { db } = await import("@/db");
      const { businesses, emailTemplates } = await import("@/db/schema");
      const { eq, and } = await import("drizzle-orm");

      // Get businesses that haven't been emailed yet
      const pendingBusinesses = await db.query.businesses.findMany({
        where: and(
          eq(businesses.userId, userId),
          eq(businesses.emailSent, false)
        ),
        limit: 10, // Process 10 at a time to avoid rate limits
      });

      if (pendingBusinesses.length === 0) {
        console.log("No pending emails");
        return;
      }

      // Get default template
      const defaultTemplate = await db.query.emailTemplates.findFirst({
        where: and(
          eq(emailTemplates.userId, userId),
          eq(emailTemplates.isDefault, true)
        ),
      });

      if (!defaultTemplate) {
        console.log("No default template found");
        return;
      }

      // Send emails
      for (const business of pendingBusinesses) {
        const success = await sendColdEmail(
          business,
          defaultTemplate,
          accessToken
        );

        // Update business
        await db
          .update(businesses)
          .set({
            emailSent: true,
            emailSentAt: new Date(),
            emailStatus: success ? "sent" : "failed",
            updatedAt: new Date(),
          })
          .where(eq(businesses.id, business.id));

        // Log email
        const { emailLogs } = await import("@/db/schema");
        await db.insert(emailLogs).values({
          userId,
          businessId: business.id,
          templateId: defaultTemplate.id,
          subject: interpolateTemplate(defaultTemplate.subject, business),
          body: interpolateTemplate(defaultTemplate.body, business),
          status: success ? "sent" : "failed",
          sentAt: success ? new Date() : null,
        });

        // Add delay between emails to avoid rate limits
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }

      console.log(`Processed ${pendingBusinesses.length} emails`);
    } catch (error) {
      console.error("Error processing email queue:", error);
    }
  }
}
