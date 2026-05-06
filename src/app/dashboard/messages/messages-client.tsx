"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Send, User, Tag, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Conversation } from "@/lib/messages/data";
import type { messages } from "@/lib/db/schema";

type MessageRow = typeof messages.$inferSelect;

interface Props {
  conversations: Conversation[];
  initialMessages: MessageRow[];
  selectedSenderId: string | null;
}

export function MessagesClient({ conversations, initialMessages, selectedSenderId }: Props) {
  const [activeSenderId, setActiveSenderId] = useState<string | null>(selectedSenderId);
  const [messagesMap, setMessagesMap] = useState<Record<string, MessageRow[]>>({
    ...(selectedSenderId ? { [selectedSenderId]: initialMessages } : {}),
  });
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);

  const activeConversation = conversations.find(
    (c) => c.contact.senderId === activeSenderId
  );
  const threadMessages = activeSenderId ? messagesMap[activeSenderId] ?? [] : [];

  async function loadThread(senderId: string) {
    setActiveSenderId(senderId);
    if (messagesMap[senderId]) return;

    try {
      const res = await fetch(`/api/messages/thread?senderId=${encodeURIComponent(senderId)}`);
      if (res.ok) {
        const data = await res.json();
        setMessagesMap((prev) => ({ ...prev, [senderId]: data.messages }));
      }
    } catch (err) {
      console.error("Failed to load thread:", err);
    }
  }

  async function sendReply() {
    if (!activeSenderId || !replyText.trim()) return;
    setSending(true);

    try {
      const res = await fetch("/api/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientId: activeSenderId, text: replyText.trim() }),
      });

      if (res.ok) {
        const newMsg: MessageRow = {
          id: crypto.randomUUID(),
          userId: "",
          igUserId: "",
          senderId: activeSenderId,
          automationId: null,
          direction: "outbound",
          status: "sent",
          text: replyText.trim(),
          timestamp: new Date(),
        };
        setMessagesMap((prev) => ({
          ...prev,
          [activeSenderId]: [newMsg, ...(prev[activeSenderId] ?? [])],
        }));
        setReplyText("");
      }
    } catch (err) {
      console.error("Send failed:", err);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-0 border border-border rounded-2xl overflow-hidden bg-card/30">
      {/* Conversation List */}
      <div className="w-80 border-r border-border bg-card/50 flex flex-col">
        <div className="p-4 border-b border-border">
          <h3 className="font-semibold text-sm">Conversations</h3>
          <p className="text-xs text-muted-foreground mt-1">
            {conversations.length} contact{conversations.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3 p-6 text-center">
              <MessageSquare className="size-8 opacity-40" />
              <p className="text-sm">No conversations yet.</p>
              <p className="text-xs">Messages from your automations will appear here.</p>
            </div>
          ) : (
            conversations.map((conv) => {
              const isActive = conv.contact.senderId === activeSenderId;
              return (
                <button
                  key={conv.contact.id}
                  onClick={() => loadThread(conv.contact.senderId)}
                  className={cn(
                    "w-full text-left p-4 border-b border-border/50 transition-colors hover:bg-accent/50",
                    isActive && "bg-primary/10 hover:bg-primary/10"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="size-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                      {conv.contact.profilePic ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={conv.contact.profilePic}
                          alt={conv.contact.name ?? ""}
                          className="size-10 rounded-full object-cover"
                        />
                      ) : (
                        <User className="size-5 text-primary" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-sm truncate">
                          {conv.contact.name ?? conv.contact.username ?? "Unknown"}
                        </p>
                        {conv.lastMessage && (
                          <span className="text-[10px] text-muted-foreground shrink-0">
                            {formatDistanceToNow(new Date(conv.lastMessage.timestamp), {
                              addSuffix: false,
                            })}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {conv.lastMessage
                          ? `${conv.lastMessage.direction === "outbound" ? "You: " : ""}${conv.lastMessage.text}`
                          : "No messages yet"}
                      </p>
                      {conv.tags.length > 0 && (
                        <div className="flex gap-1 mt-1.5 flex-wrap">
                          {conv.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-md bg-muted border border-border"
                            >
                              <Tag className="size-2.5" />
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Thread View */}
      <div className="flex-1 flex flex-col bg-background/50">
        {activeConversation ? (
          <>
            {/* Header */}
            <div className="h-16 border-b border-border flex items-center px-6 gap-3 bg-card/30">
              <div className="size-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                {activeConversation.contact.profilePic ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={activeConversation.contact.profilePic}
                    alt=""
                    className="size-9 rounded-full object-cover"
                  />
                ) : (
                  <User className="size-4 text-primary" />
                )}
              </div>
              <div>
                <p className="font-semibold text-sm">
                  {activeConversation.contact.name ?? activeConversation.contact.username ?? "Unknown"}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {activeConversation.contact.isFollower ? "Follower" : "Not following"} ·{" "}
                  {activeConversation.contact.status}
                </p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {[...threadMessages].reverse().map((msg) => {
                const isOutbound = msg.direction === "outbound";
                return (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex",
                      isOutbound ? "justify-end" : "justify-start"
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[70%] rounded-2xl px-4 py-2.5 text-sm",
                        isOutbound
                          ? "bg-primary text-primary-foreground rounded-br-md"
                          : "bg-muted border border-border rounded-bl-md"
                      )}
                    >
                      <p>{msg.text}</p>
                      <p
                        className={cn(
                          "text-[10px] mt-1",
                          isOutbound ? "text-primary-foreground/60" : "text-muted-foreground"
                        )}
                      >
                        {formatDistanceToNow(new Date(msg.timestamp), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Reply Input */}
            <div className="h-16 border-t border-border p-3 flex items-center gap-3 bg-card/30">
              <Input
                placeholder="Type a reply..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendReply()}
                className="flex-1 rounded-xl"
              />
              <Button
                size="icon"
                className="rounded-xl"
                disabled={!replyText.trim() || sending}
                onClick={sendReply}
              >
                <Send className="size-4" />
              </Button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-3">
            <MessageSquare className="size-12 opacity-30" />
            <p className="text-sm">Select a conversation to view messages</p>
          </div>
        )}
      </div>
    </div>
  );
}
