export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { CheckCircle2, CircleAlert, Link2, PlugZap, Shield } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { QueryToast } from "@/components/dashboard/query-toast";
import { auth, isGoogleAuthConfigured } from "@/lib/auth/config";
import { db } from "@/lib/db/client";
import { instagramAccounts, scheduledMessages } from "@/lib/db/schema";
import { createNotificationLog } from "@/lib/notifications/logs";

function hasEnv(...names: string[]) {
  return names.some((name) => Boolean(process.env[name]));
}

function StatusRow({
  label,
  ok,
  detail,
}: {
  label: string;
  ok: boolean;
  detail: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-md border p-3">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{detail}</p>
      </div>
      {ok ? (
        <CheckCircle2 className="size-5 shrink-0 text-green-600" />
      ) : (
        <CircleAlert className="size-5 shrink-0 text-amber-600" />
      )}
    </div>
  );
}

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const accounts = await db.query.instagramAccounts.findMany({
    where: eq(instagramAccounts.userId, session.user.id),
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const webhookUrl = `${appUrl}/api/webhook/instagram`;
  const followUpUrl = `${appUrl}/api/automation/followups`;

  async function disconnectInstagramAction(formData: FormData) {
    "use server";
    const session = await auth();
    if (!session?.user?.id) redirect("/login");

    const id = String(formData.get("id") ?? "");
    const account = await db.query.instagramAccounts.findFirst({
      where: eq(instagramAccounts.id, id),
    });

    if (!account || account.userId !== session.user.id) {
      redirect("/dashboard/settings?error=oauth_failed");
    }

    await db.delete(instagramAccounts).where(eq(instagramAccounts.id, id));
    await db
      .delete(scheduledMessages)
      .where(eq(scheduledMessages.userId, session.user.id));

    await createNotificationLog({
      userId: session.user.id,
      type: "instagram.disconnected",
      title: "Instagram disconnected",
      message: `Disconnected Instagram account ${account.igUserId}`,
      status: "warning",
      metadata: { igUserId: account.igUserId, pageId: account.pageId },
    });

    revalidatePath("/dashboard/settings");
    redirect("/dashboard/settings?disconnected=1");
  }

  return (
    <div className="max-w-5xl space-y-6">
      <Suspense fallback={null}>
        <QueryToast />
      </Suspense>
      <div className="border-b border-gray-200 pb-4 dark:border-gray-800">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h2>
        <p className="text-gray-500 dark:text-gray-400">
          Manage API readiness, webhooks, and connected Instagram accounts.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="size-5" />
              API Readiness
            </CardTitle>
            <CardDescription>Secrets stay in deployment environment variables.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <StatusRow
              label="Google Login"
              ok={isGoogleAuthConfigured()}
              detail="GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET"
            />
            <StatusRow
              label="Auth Secret"
              ok={hasEnv("AUTH_SECRET", "NEXTAUTH_SECRET")}
              detail="AUTH_SECRET or NEXTAUTH_SECRET"
            />
            <StatusRow
              label="Meta App"
              ok={hasEnv("FACEBOOK_CLIENT_ID") && hasEnv("FACEBOOK_CLIENT_SECRET")}
              detail="FACEBOOK_CLIENT_ID and FACEBOOK_CLIENT_SECRET"
            />
            <StatusRow
              label="Webhook Security"
              ok={hasEnv("META_VERIFY_TOKEN") && hasEnv("META_APP_SECRET")}
              detail="META_VERIFY_TOKEN and META_APP_SECRET"
            />
            <StatusRow
              label="Follow-up Worker"
              ok={hasEnv("AUTOMATION_CRON_SECRET")}
              detail="AUTOMATION_CRON_SECRET for scheduled follow-up route"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PlugZap className="size-5" />
              Endpoints
            </CardTitle>
            <CardDescription>Use these URLs in Meta and scheduled worker tooling.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="appUrl">App URL</Label>
              <Input id="appUrl" value={appUrl} readOnly />
            </div>
            <div className="space-y-2">
              <Label htmlFor="webhookUrl">Instagram webhook callback</Label>
              <Input id="webhookUrl" value={webhookUrl} readOnly />
            </div>
            <div className="space-y-2">
              <Label htmlFor="followUpUrl">Follow-up processor</Label>
              <Input id="followUpUrl" value={followUpUrl} readOnly />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="size-5 text-pink-600" />
            Instagram Connections
          </CardTitle>
          <CardDescription>Official Meta OAuth for Instagram Business accounts.</CardDescription>
        </CardHeader>
        <CardContent>
          {accounts.length === 0 ? (
            <div className="rounded-md border border-dashed p-6 text-center">
              <p className="mb-4 text-sm text-muted-foreground">
                No Instagram Business account is connected.
              </p>
              <form action="/api/instagram/connect" method="POST">
                <Button type="submit">Connect Meta Account</Button>
              </form>
            </div>
          ) : (
            <div className="space-y-3">
              {accounts.map((account) => (
                <div
                  key={account.id}
                  className="flex flex-col gap-4 rounded-md border p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div className="min-w-0">
                    <p className="font-medium">Instagram user ID: {account.igUserId}</p>
                    <p className="text-sm text-muted-foreground">Page ID: {account.pageId}</p>
                    <p className="text-sm text-muted-foreground">
                      Connected: {account.connectedAt?.toLocaleString() ?? "Unknown"}
                    </p>
                  </div>
                  <form action={disconnectInstagramAction}>
                    <input type="hidden" name="id" value={account.id} />
                    <Button type="submit" variant="destructive">
                      Disconnect
                    </Button>
                  </form>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

