import { google } from "googleapis";
import { Business, EmailTemplate } from "@/types";

interface SendEmailOptions {
  to: string;
  subject: string;
  body: string;
  accessToken: string;
  refreshToken?: string;
}

export async function sendEmail(options: SendEmailOptions): Promise<{ success: boolean; error?: string }> {
  const { to, subject, body, accessToken, refreshToken } = options;

  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );

    oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    const gmail = google.gmail({ version: "v1", auth: oauth2Client });

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
    });

    return { success: true };
  } catch (error) {
    console.error("Error sending email:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: errorMessage };
  }
}

export function interpolateTemplate(
  template: string,
  business: Business,
  sender?: {
    name?: string | null;
    email?: string | null;
    phone?: string | null;
    company?: string | null;
    website?: string | null;
    jobTitle?: string | null;
    customVariables?: Record<string, string | number | boolean | null> | null;
  }
): string {
  let result = template
    .replace(/\{brand_name\}/g, business.name)
    .replace(/\{email\}/g, business.email || "")
    .replace(/\{phone\}/g, business.phone || "")
    .replace(/\{website\}/g, business.website || "")
    .replace(/\{address\}/g, business.address || "")
    .replace(/\{category\}/g, business.category);

  if (sender) {
    result = result
      .replace(/\{sender_name\}/g, sender.name || "")
      .replace(/\{sender_email\}/g, sender.email || "")
      .replace(/\{sender_phone\}/g, sender.phone || "")
      .replace(/\{sender_company\}/g, sender.company || "")
      .replace(/\{sender_website\}/g, sender.website || "")
      .replace(/\{sender_job_title\}/g, sender.jobTitle || "");

    // Custom Sender Variables
    if (sender.customVariables) {
      Object.entries(sender.customVariables).forEach(([key, value]) => {
        const regex = new RegExp(`\\{${key}\\}`, "g");
        result = result.replace(regex, typeof value === 'string' ? value : String(value));
      });
    }
  }

  return result;
}

export async function sendColdEmail(
  business: Business,
  template: EmailTemplate,
  accessToken: string,
  sender?: {
    name?: string | null;
    email?: string | null;
    phone?: string | null;
    company?: string | null;
    website?: string | null;
    jobTitle?: string | null;
    customVariables?: Record<string, string | number | boolean | null> | null;
    refreshToken?: string | null;
  }
): Promise<{ success: boolean; error?: string }> {
  if (!business.email) {
    console.log(`No email for business ${business.name}`);
    return { success: false, error: "No email address" };
  }

  const subject = interpolateTemplate(template.subject, business, sender);
  const body = interpolateTemplate(template.body, business, sender);

  return await sendEmail({
    to: business.email,
    subject,
    body,
    accessToken,
    refreshToken: sender?.refreshToken || undefined,
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
        const { success, error } = await sendColdEmail(
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
          errorMessage: error,
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
