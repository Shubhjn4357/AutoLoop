import { db } from "@/lib/db/client";
import { automations, messages as dbMessages, instagramAccounts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { sendInstagramMessage } from "@/lib/instagram/client";

interface EngineParams {
  igUserId: string;
  senderId: string;
  text: string;
}

export async function processInstagramMessage({ igUserId, senderId, text }: EngineParams) {
  // 1. Store message
  await db.insert(dbMessages).values({
    id: crypto.randomUUID(),
    igUserId,
    senderId,
    text,
    timestamp: new Date(),
  });

  // 2. Map igUserId to our system user
  const igAccount = await db.query.instagramAccounts.findFirst({
    where: eq(instagramAccounts.igUserId, igUserId),
  });

  if (!igAccount || !igAccount.accessToken) {
    console.error("[Engine] No system user/token found for IG user:", igUserId);
    return;
  }

  // 3. Find automation rules for this user
  const rules = await db.query.automations.findMany({
    where: eq(automations.userId, igAccount.userId)
  });

  // 4. Match rules
  for (const rule of rules) {
    if (rule.isActive && rule.triggerType === "keyword" && rule.condition) {
      if (text.toLowerCase().includes(rule.condition.toLowerCase())) {
        await executeAction(igUserId, senderId, rule.responseTemplate, igAccount.accessToken);
        return; // handle first match for now
      }
    }
  }
}

async function executeAction(igUserId: string, senderId: string, template: string, accessToken: string) {
  console.log(`[Action Executed] Replying to ${senderId} with: ${template}`);
  await sendInstagramMessage(igUserId, senderId, template, accessToken);
}
