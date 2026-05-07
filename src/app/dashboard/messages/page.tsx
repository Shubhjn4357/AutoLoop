export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import { getConversations } from "@/lib/messages/data";
import { getThreadMessages } from "@/lib/messages/data";
import { MessagesClient } from "./messages-bridge";

interface PageProps {
  searchParams: Promise<{ senderId?: string }>;
}

export default async function MessagesPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { senderId } = await searchParams;
  const conversations = await getConversations(session.user.id);

  let initialMessages: Awaited<ReturnType<typeof getThreadMessages>> = [];
  if (senderId) {
    initialMessages = await getThreadMessages(session.user.id, senderId);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Inbox</h1>
        <p className="text-muted-foreground">
          Manage all your Instagram conversations and manual replies in one place.
        </p>
      </div>
      <MessagesClient
        conversations={conversations}
        initialMessages={initialMessages}
        selectedSenderId={senderId ?? null}
      />
    </div>
  );
}
