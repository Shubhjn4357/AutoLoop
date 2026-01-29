import { db } from "@/db";
import { socialAutomations, whatsappMessages } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { sendWhatsAppMessage } from "./client";

interface WhatsAppChange {
  value: {
    messages?: WhatsAppMessage[];
    statuses?: WhatsAppStatus[];
    metadata: {
      display_phone_number: string;
      phone_number_id: string;
    };
  };
  field: string;
}

interface WhatsAppEntry {
  id: string;
  changes: WhatsAppChange[];
}

interface WhatsAppWebhookBody {
  object: string;
  entry: WhatsAppEntry[];
}

interface WhatsAppMessage {
  from: string;
  id: string;
  timestamp: string;
  type: string;
  text?: {
    body: string;
  };
  [key: string]: unknown;
}

interface WhatsAppStatus {
  id: string;
  status: string;
  timestamp: string;
  recipient_id: string;
  conversation?: {
    id: string;
    expiration_timestamp?: string;
    origin?: {
      type: string;
    };
  };
  pricing?: {
    billable: boolean;
    pricing_model: string;
    category: string;
  };
}

export async function handleWhatsAppEvent(body: WhatsAppWebhookBody) {
  if (body.object === "whatsapp_business_account") {
    for (const entry of body.entry) {
      for (const change of entry.changes) {
        if (change.value.messages) {
          for (const message of change.value.messages) {
            await processMessage(message);
          }
        }
        if (change.value.statuses) {
          for (const status of change.value.statuses) {
            await processStatusUpdate(status);
          }
        }
      }
    }
  }
}

async function processStatusUpdate(status: WhatsAppStatus) {
  // status: { id: 'wamid.HBg...', status: 'sent'|'delivered'|'read', timestamp: '...', recipient_id: '...' }
  const { id, status: newStatus } = status;

  try {
    await db.update(whatsappMessages)
      .set({ status: newStatus, updatedAt: new Date() })
      .where(eq(whatsappMessages.wamid, id));

    // console.log(`🔄 Message ${id} status: ${newStatus}`);
  } catch (error) {
    console.error(`Failed to update status for ${id}:`, error);
  }
}

async function processMessage(message: WhatsAppMessage) {
  const senderPhone = message.from; // e.g., "15551234567"
  const messageId = message.id;
  const timestamp = new Date(parseInt(message.timestamp) * 1000);

  let text = "";
  const type = message.type; // 'text', 'button', 'interactive'

  if (type === "text" && message.text) {
    text = message.text.body;
  } else {
    // For now, capture type as text but body might be empty or description
    text = `[${type} message]`;
  }

  console.log(`📩 WhatsApp Message from ${senderPhone}: ${text}`);

  // 1. Log Inbound Message
  try {
    // Check if exists (dedup logic if needed, but wamid is unique)
    await db.insert(whatsappMessages).values({
      wamid: messageId,
      phoneNumber: senderPhone,
      direction: "inbound",
      type: type,
      status: "received",
      body: text,
      createdAt: timestamp,
      updatedAt: timestamp
    }).onConflictDoNothing({ target: whatsappMessages.wamid });
  } catch (error) {
    console.error("Failed to log inbound message:", error);
  }

  if (type !== "text") return; // Only automate text for now

  // 2. Find Automation Rules (Auto-Reply)
  const rules = await db.query.socialAutomations.findMany({
    where: and(
      eq(socialAutomations.triggerType, "whatsapp_keyword"),
      eq(socialAutomations.isActive, true)
    )
  });

  for (const rule of rules) {
    if (rule.keywords && rule.keywords.some(k => text.toLowerCase().includes(k.toLowerCase()))) {
      console.log(`✅ Matched WhatsApp Rule: ${rule.name}`);

      // Send Reply
      await sendWhatsAppMessage({
        to: senderPhone,
        text: rule.responseTemplate || ""
      });
    }
  }
}
