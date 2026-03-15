"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface ConnectedAccount {
  id: string;
  provider: string;
  name?: string | null;
  providerAccountId: string;
}

export default function NewAutomationPage() {
  const router = useRouter();

  const [submitting, setSubmitting] = useState(false);
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);

  const [name, setName] = useState("");
  const [triggerType, setTriggerType] = useState("comment_keyword");
  const [keywords, setKeywords] = useState("");
  const [actionType, setActionType] = useState("reply_comment");
  const [responseTemplate, setResponseTemplate] = useState("");
  const [connectedAccountId, setConnectedAccountId] = useState("");

  const isWhatsAppTrigger = triggerType === "whatsapp_keyword" || triggerType === "whatsapp_command";

  useEffect(() => {
    let active = true;

    async function loadAccounts() {
      try {
        const response = await fetch("/api/settings");
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to load connected accounts");
        }

        if (!active) {
          return;
        }

        const socialAccounts = (data.connectedAccounts || []).filter((account: ConnectedAccount) =>
          ["facebook", "instagram", "linkedin"].includes(account.provider)
        );

        setAccounts(socialAccounts);

        if (socialAccounts.length > 0) {
          setConnectedAccountId(socialAccounts[0].id);
        }
      } catch (error) {
        console.error(error);
        toast.error("Failed to load connected accounts");
      } finally {
        if (active) {
          setLoadingAccounts(false);
        }
      }
    }

    loadAccounts();

    return () => {
      active = false;
    };
  }, []);

  const availableActions = useMemo(() => {
    if (triggerType === "any_comment" || triggerType === "comment_keyword") {
      return [
        { value: "reply_comment", label: "Reply to Comment" },
        { value: "send_dm", label: "Send Private Message" },
      ];
    }

    return [
      { value: "send_dm", label: "Send Private Message" },
    ];
  }, [triggerType]);

  useEffect(() => {
    if (!availableActions.some((action) => action.value === actionType)) {
      setActionType(availableActions[0].value);
    }
  }, [actionType, availableActions]);

  const handleSubmit = async () => {
    if (!name || !responseTemplate) {
      toast.error("Please fill the required fields");
      return;
    }

    if (!isWhatsAppTrigger && !connectedAccountId) {
      toast.error("Please select a connected account");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/social/automations/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          triggerType,
          keywords: keywords
            .split(",")
            .map((keyword) => keyword.trim())
            .filter(Boolean),
          actionType,
          responseTemplate,
          connectedAccountId: isWhatsAppTrigger ? null : connectedAccountId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create automation rule");
      }

      toast.success("Rule created successfully");
      router.push("/dashboard/social/automations");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      toast.error(message || "Failed to create rule");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/social/automations">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Create Automation Rule</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Rule Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Rule Name</Label>
            <Input
              placeholder="e.g. Pricing Auto-Reply"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Trigger</Label>
              <Select value={triggerType} onValueChange={setTriggerType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="comment_keyword">Comment Keyword</SelectItem>
                  <SelectItem value="dm_keyword">DM Keyword</SelectItem>
                  <SelectItem value="story_mention">Story Mention</SelectItem>
                  <SelectItem value="any_comment">Any Comment</SelectItem>
                  <SelectItem value="whatsapp_keyword">WhatsApp Keyword</SelectItem>
                  <SelectItem value="whatsapp_command">WhatsApp Command</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Action</Label>
              <Select value={actionType} onValueChange={setActionType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableActions.map((action) => (
                    <SelectItem key={action.value} value={action.value}>
                      {action.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {!isWhatsAppTrigger && (
            <div className="space-y-2">
              <Label>Connected Account</Label>
              <Select
                value={connectedAccountId}
                onValueChange={setConnectedAccountId}
                disabled={loadingAccounts || accounts.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder={loadingAccounts ? "Loading accounts..." : "Select an account"} />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {(account.name || account.providerAccountId) + ` (${account.provider})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {(triggerType === "comment_keyword" || triggerType === "dm_keyword" || triggerType === "whatsapp_keyword" || triggerType === "whatsapp_command") && (
            <div className="space-y-2">
              <Label>
                {triggerType === "whatsapp_command"
                  ? "Commands (comma separated)"
                  : "Keywords (comma separated)"}
              </Label>
              <Input
                placeholder={triggerType === "whatsapp_command" ? "/start, /menu" : "price, cost, how much"}
                value={keywords}
                onChange={(event) => setKeywords(event.target.value)}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>Response Message</Label>
            <Textarea
              placeholder="Hi there! Here is the information you asked for..."
              className="min-h-[120px]"
              value={responseTemplate}
              onChange={(event) => setResponseTemplate(event.target.value)}
            />
          </div>

          <Button onClick={handleSubmit} className="w-full" disabled={submitting}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Rule
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
