import { callServer } from "@/lib/server-api";
import type { automations as AutomationType } from "@/lib/db/schema";
import { ContentDashboardClient } from "./content-bridge";

type Automation = typeof AutomationType.$inferSelect;

interface Props {
  externalId: string;
  accessToken: string;
  automations: Automation[];
  userId: string;
}

export async function ContentDashboard({ externalId, accessToken, automations, userId }: Props) {
  const { data: media } = await callServer('/api/instagram/media', userId).catch(() => ({ data: [] }));

  return (
    <ContentDashboardClient
      externalId={externalId}
      accessToken={accessToken}
      automations={automations}
      initialMedia={media}
      userId={userId}
    />
  );
}
