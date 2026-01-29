import { db } from "@/db";
import { whatsappMessages } from "@/db/schema";

interface SendMessageParams {
  to: string;
  templateName?: string;
  templateLanguage?: string;
  templateComponents?: unknown[];
  text?: string;
}

const PHONE_ID = process.env.WHATSAPP_PHONE_ID;
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;

/**
 * Send a WhatsApp Message via Meta Cloud API
 */
export async function sendWhatsAppMessage(payload: SendMessageParams): Promise<{ success: boolean; id?: string; error?: string }> {
  const phoneId = PHONE_ID;
  const token = ACCESS_TOKEN;

  if (!phoneId || !token) {
    return { success: false, error: "Missing WhatsApp Credentials" };
  }

  try {
    const url = `https://graph.facebook.com/v18.0/${phoneId}/messages`;

    const body: Record<string, unknown> = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: payload.to,
    };

    if (payload.templateName) {
      body.type = "template";
      body.template = {
        name: payload.templateName,
        language: { code: payload.templateLanguage || "en_US" },
        components: payload.templateComponents ?? [],
      } as Record<string, unknown>;
    } else if (payload.text) {
      body.type = "text";
      body.text = { body: payload.text } as Record<string, string>;
    } else {
      throw new Error("Message must have template or text");
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json() as unknown;

    if (!response.ok) {
      console.error("WhatsApp API Error:", data);
      const errMsg = (data as { error?: { message?: string } })?.error?.message ?? "Unknown Error";
      return { success: false, error: errMsg };
    }

    const messageId = (data as { messages?: Array<{ id?: string }> })?.messages?.[0]?.id;

    // Log to DB (best-effort)
    try {
      await db.insert(whatsappMessages).values({
        wamid: messageId,
        phoneNumber: payload.to,
        direction: "outbound",
        type: payload.templateName ? "template" : "text",
        status: "sent",
        body: payload.text || `Template: ${payload.templateName}`
      });
    } catch (dbErr) {
      console.error("Failed to log WhatsApp message to DB:", dbErr instanceof Error ? dbErr.message : String(dbErr));
    }

    return { success: true, id: messageId };
  } catch (error: unknown) {
    console.error("WhatsApp Client Error:", error instanceof Error ? error.message : String(error));
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function sendWhatsAppOTP(phoneNumber: string, code: string) {
  // Basic text message for MVP if template not approved yet
  // "Your AutoLoop Verification Code is: 123456"
  return sendWhatsAppMessage({
    to: phoneNumber,
    text: `Your AutoLoop verification code is: ${code}`
  });
}
