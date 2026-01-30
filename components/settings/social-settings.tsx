"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, RefreshCw, Linkedin, Trash2, Plus } from "lucide-react";
import { SiFacebook, SiInstagram, SiYoutube } from "@icons-pack/react-simple-icons";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface ConnectedAccount {
  id: string;
  userId: string;
  provider: string;
  providerAccountId: string;
  name?: string | null;
  picture?: string | null;
  accessToken?: string | null;
  expiresAt?: Date | null;
}

interface SocialAutomation {
  id: string;
  userId: string;
  connectedAccountId: string;
  platform: string;
  triggerType: string;
  keywords: string[] | null;
  responseTemplate: string;
  actionType: string;
  createdAt: Date;
}

interface SocialSettingsProps {
  connectedAccounts: ConnectedAccount[];
  automations?: SocialAutomation[];
}

export function SocialSettings({ connectedAccounts, automations = [] }: SocialSettingsProps) {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const success = searchParams.get("success");
  const { toast } = useToast();

  const [autoReplies, setAutoReplies] = useState<SocialAutomation[]>(automations);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fbAccount = connectedAccounts.find((a) => a.provider === "facebook");
  const linkedinAccount = connectedAccounts.find((a) => a.provider === "linkedin");
  const youtubeAccount = connectedAccounts.find((a) => a.provider === "youtube");

  const handleDeleteAutomation = async () => {
    if (!deleteId) return;

    try {
      const res = await fetch(`/api/social/automations/${deleteId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setAutoReplies((prev) => prev.filter((a) => a.id !== deleteId));
        toast({
          title: "Success",
          description: "Auto-reply rule deleted successfully",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to delete auto-reply rule",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete auto-reply rule",
        variant: "destructive",
      });
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error === "access_denied"
              ? "You denied access. Please try again and accept permissions."
              : error}
          </AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-500 text-green-600 bg-green-50">
          <CheckCircle2 className="h-4 w-4" />
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>Account connected successfully!</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Facebook & Instagram */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xl font-medium">Facebook & Instagram</CardTitle>
            <div className="flex gap-1">
              <SiFacebook className="h-6 w-6 text-[#1877F2]" />
              <SiInstagram className="h-6 w-6 text-[#E4405F]" />
            </div>
          </CardHeader>
          <CardContent>
            {fbAccount ? (
              <div className="flex flex-col gap-4 mt-4">
                <div className="flex items-center gap-3">
                  {fbAccount.picture ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={fbAccount.picture}
                      alt={fbAccount.name || "Profile"}
                      className="w-10 h-10 rounded-full"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center">
                      <span className="text-lg font-bold text-slate-500">
                        {fbAccount.name?.charAt(0)}
                      </span>
                    </div>
                  )}
                  <div>
                    <p className="font-medium">{fbAccount.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Connected as {fbAccount.providerAccountId}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-2 rounded border border-green-100">
                  <CheckCircle2 className="h-4 w-4" />
                  Connected & Active
                </div>
                <Button variant="outline" className="w-full gap-2" asChild>
                  <Link href="/api/social/connect/facebook">
                    <RefreshCw className="h-4 w-4" /> Reconnect / Refresh
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-4 mt-4">
                <p className="text-sm text-muted-foreground">
                  Connect to manage Facebook Pages and Instagram Business accounts.
                </p>
                <Button className="w-full bg-[#1877F2] hover:bg-[#1864D9]" asChild>
                  <Link href="/api/social/connect/facebook">
                    Connect Facebook
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* LinkedIn */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xl font-medium">LinkedIn</CardTitle>
            <Linkedin className="h-6 w-6 text-[#0A66C2] fill-current" />
          </CardHeader>
          <CardContent>
            {linkedinAccount ? (
              <div className="flex flex-col gap-4 mt-4">
                <div className="flex items-center gap-3">
                  {linkedinAccount.picture ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={linkedinAccount.picture}
                      alt={linkedinAccount.name || "Profile"}
                      className="w-10 h-10 rounded-full"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center">
                      <span className="text-lg font-bold text-slate-500">
                        {linkedinAccount.name?.charAt(0)}
                      </span>
                    </div>
                  )}
                  <div>
                    <p className="font-medium">{linkedinAccount.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Connected as {linkedinAccount.providerAccountId}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-2 rounded border border-green-100">
                  <CheckCircle2 className="h-4 w-4" />
                  Connected & Active
                </div>
                <Button variant="outline" className="w-full gap-2" asChild>
                  <Link href="/api/social/connect/linkedin">
                    <RefreshCw className="h-4 w-4" /> Reconnect / Refresh
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-4 mt-4">
                <p className="text-sm text-muted-foreground">
                  Connect LinkedIn to create posts and manage your profile.
                </p>
                <Button className="w-full bg-[#0A66C2] hover:bg-[#004182]" asChild>
                  <Link href="/api/social/connect/linkedin">
                    Connect LinkedIn
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* YouTube */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xl font-medium">YouTube</CardTitle>
            <SiYoutube className="h-6 w-6 text-[#FF0000]" />
          </CardHeader>
          <CardContent>
            {youtubeAccount ? (
              <div className="flex flex-col gap-4 mt-4">
                <div className="flex items-center gap-3">
                  {youtubeAccount.picture ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={youtubeAccount.picture}
                      alt={youtubeAccount.name || "Profile"}
                      className="w-10 h-10 rounded-full"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center">
                      <span className="text-lg font-bold text-slate-500">
                        {youtubeAccount.name?.charAt(0)}
                      </span>
                    </div>
                  )}
                  <div>
                    <p className="font-medium">{youtubeAccount.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Connected as {youtubeAccount.providerAccountId}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-2 rounded border border-green-100">
                  <CheckCircle2 className="h-4 w-4" />
                  Connected & Active
                </div>
                <Button variant="outline" className="w-full gap-2" asChild>
                  <Link href="/api/social/connect/youtube">
                    <RefreshCw className="h-4 w-4" /> Reconnect / Refresh
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-4 mt-4">
                <p className="text-sm text-muted-foreground">
                  Connect YouTube to upload videos and view analytics.
                </p>
                <Button className="w-full bg-[#FF0000] hover:bg-[#CC0000]" asChild>
                  <Link href="/api/social/connect/youtube">
                    Connect YouTube
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Auto-Reply Management Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Auto-Reply Rules</CardTitle>
              <CardDescription>
                Manage automatic responses to comments and messages
              </CardDescription>
            </div>
            <Button asChild>
              <Link href="/dashboard/social/create-automation">
                <Plus className="h-4 w-4 mr-2" />
                Add Rule
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {autoReplies.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No auto-reply rules configured yet</p>
              <p className="text-sm mt-2">
                Create rules to automatically respond to comments and messages
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {autoReplies.map((automation) => (
                <div
                  key={automation.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary">{automation.platform}</Badge>
                      <Badge variant="outline">{automation.triggerType}</Badge>
                    </div>
                    <p className="text-sm font-medium mb-1">
                      {automation.keywords && automation.keywords.length > 0
                        ? `Keywords: ${automation.keywords.join(", ")}`
                        : "All interactions"}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {automation.responseTemplate}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => setDeleteId(automation.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Auto-Reply Rule?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this auto-reply rule. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAutomation}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
