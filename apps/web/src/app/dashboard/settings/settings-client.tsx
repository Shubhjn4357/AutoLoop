"use client";

import React, { useState } from "react";
import Image from "next/image";
import { 
  Bell, 
  Link2, 
  Palette, 
  Shield, 
  CheckCircle2, 
  CircleAlert,
  Loader2,
  Save,
  User,
  ShieldCheck,
  Smartphone,
  RefreshCw,
  Copy,
  CreditCard,
  Zap
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { AnimatedButton } from "@/components/ui/animated-button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { AlertDialog } from "@/components/ui/alert-dialog";
import { useTheme } from "next-themes";
import { updateUserSettings } from "@/lib/actions/settings";
import type { NotificationPrefs } from "@/lib/utils/settings";
import { serverFetch } from "@/lib/api-client";


interface InstagramAccount {
  id: string;
  instagramUsername: string;
  instagramProfilePicture: string | null;
}

interface Props {
  userName: string | null;
  webhookToken: string | null;
  notificationPrefs: NotificationPrefs;
  accounts: InstagramAccount[];
  subscriptionStatus: string | null;
  stripePriceId: string | null;
  userId: string;
  serverUrl: string;
}

const CATEGORIES = [
  { id: "general", label: "General", icon: User },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "billing", label: "Billing", icon: CreditCard },
  { id: "connections", label: "Connections", icon: Link2 },
  { id: "theme", label: "Appearance", icon: Palette },
  { id: "security", label: "Security", icon: ShieldCheck },
];

export function SettingsClient({ userName, webhookToken, notificationPrefs, accounts, subscriptionStatus, userId, serverUrl }: Props) {
  const [activeTab, setActiveTab] = useState("general");
  const { theme, setTheme } = useTheme();
  const [isSaving, setIsSaving] = useState(false);
  const [localName, setLocalName] = useState(userName || "");
  const [currentToken, setCurrentToken] = useState(webhookToken);
  const [connectedAccounts, setConnectedAccounts] = useState(accounts);
  const [prefs, setPrefs] = useState<NotificationPrefs>(notificationPrefs);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [isDisconnectDialogOpen, setIsDisconnectDialogOpen] = useState(false);
  const [disconnectId, setDisconnectId] = useState<string | null>(null);

  // Check for success/error in URL
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("success") === "instagram_connected") {
      toast.success("Instagram account connected successfully!");
      // Clean up URL
      window.history.replaceState({}, "", window.location.pathname);
    }
    if (params.get("error")) {
      toast.error(`Connection failed: ${params.get("error")?.replace(/_/g, " ")}`);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateUserSettings({ name: localName });
      toast.success("Settings updated successfully");
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateToken = async () => {
    setIsSaving(true);
    try {
      const res = await updateUserSettings({ generateWebhookToken: true });
      if (res.webhookToken) setCurrentToken(res.webhookToken);
      toast.success("New API token generated");
    } catch {
      toast.error("Failed to generate token");
    } finally {
      setIsSaving(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const handleDisconnect = async (accountId: string) => {
    setDisconnectId(accountId);
    setIsDisconnectDialogOpen(true);
  };

  const confirmDisconnect = async () => {
    if (!disconnectId) return;
    const accountId = disconnectId;
    setIsSaving(true);
    try {
      const res = await serverFetch("/api/instagram/disconnect", userId, {
        method: "POST",
        body: JSON.stringify({ accountId }),
      });
      if (!res.ok) throw new Error("Disconnect failed");
      setConnectedAccounts((prev) => prev.filter((a) => a.id !== accountId));
      toast.success("Account disconnected");
    } catch {
      toast.error("Failed to disconnect account");
    } finally {
      setIsSaving(false);
    }
  };

  const togglePref = async (key: keyof NotificationPrefs) => {
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    setSavingPrefs(true);
    try {
      await updateUserSettings({ notificationPrefs: next });
      toast.success("Preferences saved");
    } catch {
      toast.error("Failed to save preferences");
      setPrefs(prefs);
    } finally {
      setSavingPrefs(false);
    }
  };

  return (
    <div className="grid lg:grid-cols-[240px_1fr] gap-8">
      {/* Sidebar Nav */}
      <div className="space-y-1">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeTab === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveTab(cat.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all",
                isActive 
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <Icon className="size-4" />
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Content Area */}
      <div className="space-y-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === "general" && (
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle>General Settings</CardTitle>
                  <CardDescription>Update your profile and app preferences.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label>Display Name</Label>
                    <Input 
                      value={localName} 
                      onChange={(e) => setLocalName(e.target.value)} 
                      placeholder="Your name" 
                      className="max-w-md bg-background/50" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Account Security</Label>
                    <div className="flex items-center gap-3 p-4 rounded-xl border border-border/50 bg-background/40">
                       <Shield className="size-5 text-primary" />
                       <p className="text-sm">Two-factor authentication is managed by your login provider.</p>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-border">
                    <AnimatedButton onClick={handleSave} disabled={isSaving}>
                      {isSaving ? <Loader2 className="size-4 animate-spin mr-2" /> : <Save className="size-4 mr-2" />}
                      Save Changes
                    </AnimatedButton>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === "notifications" && (
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle>Notification Settings</CardTitle>
                  <CardDescription>Choose how you want to be alerted about activity.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { key: "automationTriggered" as const, label: "New Automation Triggered", desc: "Get notified when a rule fires on a comment or DM." },
                    { key: "connectionAlerts" as const, label: "Connection Alerts", desc: "Immediate warning if your Instagram account disconnects." },
                    { key: "weeklyDigest" as const, label: "Weekly Insights Digest", desc: "A summary of your account performance every Monday." },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-background/40">
                      <div className="space-y-0.5">
                        <p className="text-sm font-semibold">{item.label}</p>
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                      </div>
                      <Switch
                        checked={prefs[item.key]}
                        onCheckedChange={() => togglePref(item.key)}
                        disabled={savingPrefs}
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {activeTab === "connections" && (
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle>Instagram Connections</CardTitle>
                  <CardDescription>Manage your linked Meta accounts and business pages.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {connectedAccounts.length > 0 ? (
                    connectedAccounts.map((acc) => (
                      <div key={acc.id} className="flex items-center gap-4 p-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5">
                        <div className="size-12 rounded-full overflow-hidden border-2 border-emerald-500/20">
                           {acc.instagramProfilePicture ? (
                            <Image src={acc.instagramProfilePicture} alt="" width={48} height={48} className="size-full object-cover" unoptimized />
                           ) : (
                             <div className="size-full bg-muted flex items-center justify-center"><User className="size-6 text-muted-foreground" /></div>
                           )}
                        </div>
                        <div className="flex-1">
                          <p className="font-bold">@{acc.instagramUsername}</p>
                          <div className="flex items-center gap-1.5 text-emerald-500 text-xs">
                            <CheckCircle2 className="size-3" />
                            Connected & Healthy
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-xl hover:bg-rose-500/10 hover:text-rose-500 hover:border-rose-500/20"
                          onClick={() => handleDisconnect(acc.id)}
                          disabled={isSaving}
                        >
                          {isSaving ? <Loader2 className="size-4 animate-spin" /> : "Disconnect"}
                        </Button>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center glass-card rounded-2xl border-dashed border-border/50">
                      <CircleAlert className="size-10 mx-auto text-muted-foreground opacity-20 mb-3" />
                      <p className="text-sm text-muted-foreground">No accounts linked yet.</p>
                      <form action={`${serverUrl}/api/instagram/connect`} method="GET">
                        <input type="hidden" name="userId" value={userId} />
                        <Button type="submit" className="mt-4 rounded-xl">Connect Meta Account</Button>
                      </form>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {activeTab === "theme" && (
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle>Appearance</CardTitle>
                  <CardDescription>Customize how AutoLoop looks on your screen.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { id: "light", label: "Light", icon: Palette },
                      { id: "dark", label: "Dark", icon: Palette },
                      { id: "system", label: "System", icon: Smartphone },
                    ].map((m) => (
                      <button
                        key={m.id}
                        onClick={() => setTheme(m.id)}
                        className={cn(
                          "flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all",
                          theme === m.id ? "border-primary bg-primary/5" : "border-border/50 hover:border-border"
                        )}
                      >
                        <m.icon className={cn("size-6", theme === m.id ? "text-primary" : "text-muted-foreground")} />
                        <span className="text-xs font-bold">{m.label}</span>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === "security" && (
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle>Security & Access</CardTitle>
                  <CardDescription>Manage your API keys and session preferences.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-6 rounded-2xl border border-border/50 bg-background/40 space-y-6">
                    {/* API Token */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Your API Token</Label>
                        <Button variant="ghost" size="sm" className="h-7 text-[10px] uppercase font-bold" onClick={handleGenerateToken} disabled={isSaving}>
                          <RefreshCw className={cn("size-3 mr-1", isSaving && "animate-spin")} />
                          Regenerate
                        </Button>
                      </div>
                      <div className="flex gap-2">
                        <Input
                          value={currentToken || "Click regenerate to create a token"}
                          readOnly
                          className="font-mono text-xs bg-muted/20 border-border/50"
                        />
                        <Button variant="outline" size="icon" className="shrink-0" onClick={() => currentToken && copyToClipboard(currentToken)}>
                          <Copy className="size-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Webhook URL */}
                    <div className="space-y-4">
                      <Label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Your Webhook URL</Label>
                      <div className="flex gap-2">
                        <Input
                          value={currentToken ? `${window.location.origin}/api/webhook/instagram?token=${currentToken}` : "Generate token to see webhook URL"}
                          readOnly
                          className="font-mono text-xs bg-muted/20 border-border/50"
                        />
                        <Button variant="outline" size="icon" className="shrink-0" onClick={() => currentToken && copyToClipboard(`${window.location.origin}/api/webhook/instagram?token=${currentToken}`)}>
                          <Copy className="size-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/10">
                       <p className="text-[10px] text-amber-500 leading-relaxed font-medium">
                        <span className="font-bold">Warning:</span> Keep these credentials secret. The API token allows external access, and the webhook URL receives Instagram events.
                       </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {activeTab === "billing" && (
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle>Subscription & Billing</CardTitle>
                  <CardDescription>Manage your plan and billing details.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="p-6 rounded-2xl border border-primary/20 bg-primary/5 flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Zap className="size-5 text-primary" />
                        <h4 className="font-bold">{subscriptionStatus === "active" ? "Pro Plan" : "Free Plan"}</h4>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {subscriptionStatus === "active" 
                          ? "You have full access to all AI features and multi-account support." 
                          : "Upgrade to Pro to unlock AI smart replies and connect up to 10 accounts."}
                      </p>
                    </div>
                    <form action={subscriptionStatus === "active" ? "/api/billing/portal" : "/api/billing/checkout"} method="POST">
                       <Button type="submit" className="rounded-xl shadow-lg shadow-primary/20">
                         {subscriptionStatus === "active" ? "Manage Subscription" : "Upgrade to Pro"}
                       </Button>
                    </form>
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
      
      <AlertDialog
        open={isDisconnectDialogOpen}
        onOpenChange={setIsDisconnectDialogOpen}
        title="Disconnect Instagram Account"
        description="Are you sure you want to disconnect this account? All associated automations will stop immediately."
        actionText="Disconnect"
        variant="destructive"
        onAction={confirmDisconnect}
      />
    </div>
  );
}
