"use client";

import React, { useState } from "react";
import { 
  Settings as SettingsIcon, 
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
  Smartphone
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AnimatedButton } from "@/components/ui/animated-button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useTheme } from "next-themes";

interface InstagramAccount {
  id: string;
  instagramUsername: string;
  instagramProfilePicture: string | null;
}

interface Props {
  userName: string | null;
  accounts: InstagramAccount[];
}

const CATEGORIES = [
  { id: "general", label: "General", icon: User },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "connections", label: "Connections", icon: Link2 },
  { id: "theme", label: "Appearance", icon: Palette },
  { id: "security", label: "Security", icon: ShieldCheck },
];

export function SettingsClient({ userName, accounts }: Props) {
  const [activeTab, setActiveTab] = useState("general");
  const { theme, setTheme } = useTheme();
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast.success("Settings updated successfully");
    }, 1000);
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
                    <Input defaultValue={userName || ""} placeholder="Your name" className="max-w-md bg-background/50" />
                  </div>
                  <div className="space-y-2">
                    <Label>Email Address</Label>
                    <Input defaultValue="shubhamjain.com.in@gmail.com" disabled className="max-w-md bg-muted/20" />
                    <p className="text-[10px] text-muted-foreground">Contact support to change your account email.</p>
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
                    { label: "New Automation Triggered", desc: "Get notified when a rule fires on a comment or DM." },
                    { label: "Connection Alerts", desc: "Immediate warning if your Instagram account disconnects." },
                    { label: "Weekly Insights Digest", desc: "A summary of your account performance every Monday." },
                  ].map((item, i) => (
                    <label key={i} className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-background/40 hover:bg-accent/50 transition-all cursor-pointer">
                      <div className="space-y-0.5">
                        <p className="text-sm font-semibold">{item.label}</p>
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                      </div>
                      <input type="checkbox" defaultChecked className="size-5 accent-primary rounded-lg" />
                    </label>
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
                  {accounts.length > 0 ? (
                    accounts.map((acc) => (
                      <div key={acc.id} className="flex items-center gap-4 p-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5">
                        <div className="size-12 rounded-full overflow-hidden border-2 border-emerald-500/20">
                           <img src={acc.instagramProfilePicture || ""} alt="" className="size-full object-cover" />
                        </div>
                        <div className="flex-1">
                          <p className="font-bold">@{acc.instagramUsername}</p>
                          <div className="flex items-center gap-1.5 text-emerald-500 text-xs">
                            <CheckCircle2 className="size-3" />
                            Connected & Healthy
                          </div>
                        </div>
                        <Button variant="outline" size="sm" className="rounded-xl hover:bg-rose-500/10 hover:text-rose-500 hover:border-rose-500/20">Disconnect</Button>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center glass-card rounded-2xl border-dashed border-border/50">
                      <CircleAlert className="size-10 mx-auto text-muted-foreground opacity-20 mb-3" />
                      <p className="text-sm text-muted-foreground">No accounts linked yet.</p>
                      <Button className="mt-4 rounded-xl">Connect Meta Account</Button>
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
                  <div className="p-4 rounded-xl border border-border/50 bg-background/40">
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Your API Token</Label>
                    <div className="flex gap-2 mt-2">
                      <Input value="••••••••••••••••••••••••" readOnly className="font-mono bg-muted/20" />
                      <Button variant="outline">Copy</Button>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-2">Used for triggering automations via external webhooks.</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
