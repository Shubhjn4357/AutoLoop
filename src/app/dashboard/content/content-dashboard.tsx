import { fetchIGMedia } from "@/lib/instagram/graph";
import type { automations as AutomationType } from "@/lib/db/schema";
import { ContentDashboardClient } from "./content-dashboard-client";

type Automation = typeof AutomationType.$inferSelect;

interface Props {
  externalId: string;
  accessToken: string;
  automations: Automation[];
}

export async function ContentDashboard({ externalId, accessToken, automations }: Props) {
  const media = await fetchIGMedia(externalId, accessToken, 30).catch(() => []);

  return (
    <ContentDashboardClient
      externalId={externalId}
      accessToken={accessToken}
      automations={automations}
      initialMedia={media}
    />
  );
}
