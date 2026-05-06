export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db/client";
import { socialAccounts, users } from "@/lib/db/schema";
import { SettingsClient } from "./settings-client";
import { fetchIGProfile } from "@/lib/instagram/graph";
import { getNotificationPrefs } from "@/lib/utils/settings";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const [dbUser, dbAccounts] = await Promise.all([
    db.query.users.findFirst({
      where: eq(users.id, session.user.id),
    }),
    db.query.socialAccounts.findMany({
      where: eq(socialAccounts.userId, session.user.id),
    }),
  ]);

  if (!dbUser) redirect("/");

  // Enrich DB accounts with live profile data
  const enrichedAccounts = await Promise.all(
    dbAccounts.map(async (acc) => {
      try {
        if (acc.externalId && acc.accessToken) {
          const profile = await fetchIGProfile(acc.externalId, acc.accessToken);
          return {
            id: acc.id,
            instagramUsername: profile.username,
            instagramProfilePicture: profile.profile_picture_url || null,
          };
        }
      } catch (err) {
        console.error("Failed to fetch IG profile for settings:", err);
      }
      return {
        id: acc.id,
        instagramUsername: "Unknown",
        instagramProfilePicture: null,
      };
    })
  );

  const notificationPrefs = getNotificationPrefs(dbUser.settingsJson);

  return (
    <div className="flex-1 p-6 lg:p-10 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your account preferences and connected platforms.</p>
      </div>

      <SettingsClient 
        userName={dbUser.name ?? null} 
        webhookToken={dbUser.webhookToken ?? null}
        notificationPrefs={notificationPrefs}
        accounts={enrichedAccounts} 
        subscriptionStatus={dbUser.subscriptionStatus ?? null}
        stripePriceId={dbUser.stripePriceId ?? null}
      />
    </div>
  );
}
