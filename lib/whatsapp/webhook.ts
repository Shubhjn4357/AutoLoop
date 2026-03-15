import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { socialAutomations, users, whatsappMessages } from "@/db/schema";
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
}

export async function handleWhatsAppEvent(body: WhatsAppWebhookBody) {
  if (body.object !== "whatsapp_business_account") {
    return;
  }

  for (const entry of body.entry) {
    for (const change of entry.changes) {
      const phoneNumberId = change.value.metadata.phone_number_id;

      if (change.value.messages) {
        for (const message of change.value.messages) {
          await processMessage(message, phoneNumberId);
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

async function processStatusUpdate(status: WhatsAppStatus) {
  try {
    await db
      .update(whatsappMessages)
      .set({ status: status.status, updatedAt: new Date() })
      .where(eq(whatsappMessages.wamid, status.id));
  } catch (error) {
    console.error(`Failed to update status for ${status.id}:`, error);
  }
}

async function processMessage(message: WhatsAppMessage, phoneNumberId: string) {
  const senderPhone = message.from;
  const messageId = message.id;
  const timestamp = new Date(parseInt(message.timestamp, 10) * 1000);

  const text =
    message.type === "text" && message.text
      ? message.text.body
      : `[${message.type} message]`;

  try {
    await db
      .insert(whatsappMessages)
      .values({
        wamid: messageId,
        phoneNumber: senderPhone,
        direction: "inbound",
        type: message.type,
        status: "received",
        body: text,
        createdAt: timestamp,
        updatedAt: timestamp,
      })
      .onConflictDoNothing({ target: whatsappMessages.wamid });
  } catch (error) {
    console.error("Failed to log inbound WhatsApp message:", error);
  }

  if (message.type !== "text") {
    return;
  }

  const user = await db.query.users.findFirst({
    where: eq(users.whatsappBusinessPhone, phoneNumberId),
    columns: {
      id: true,
      whatsappBusinessPhone: true,
      whatsappAccessToken: true,
    },
  });

  if (!user) {
    console.warn(`No WhatsApp-configured user found for phone number id ${phoneNumberId}`);
    return;
  }

  const rules = await db.query.socialAutomations.findMany({
    where: and(
      eq(socialAutomations.userId, user.id),
      eq(socialAutomations.isActive, true)
    ),
  });

  for (const rule of rules) {
    let matched = false;

    if (rule.triggerType === "whatsapp_keyword") {
      matched = !!rule.keywords?.some((keyword) =>
        text.toLowerCase().includes(keyword.toLowerCase())
      );
    } else if (rule.triggerType === "whatsapp_command") {
      matched = !!rule.keywords?.some((keyword) => {
        const normalizedKeyword = keyword.toLowerCase().trim();
        const normalizedText = text.toLowerCase().trim();
        return (
          normalizedText === normalizedKeyword ||
          normalizedText.startsWith(`${normalizedKeyword} `)
        );
      });
    }

    if (!matched) {
      continue;
    }

    await sendWhatsAppMessage({
      to: senderPhone,
      text: rule.responseTemplate || "",
      phoneId: user.whatsappBusinessPhone || undefined,
      accessToken: user.whatsappAccessToken || undefined,
    });

    if (rule.triggerType === "whatsapp_command") {
      break;
    }
  }
}
