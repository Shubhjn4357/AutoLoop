import { fetchIGMedia } from "@/lib/instagram/graph";
import type { automations as AutomationType } from "@/lib/db/schema";
import { ContentDashboardClient } from "./content-dashboard-client";

type Automation = typeof AutomationType.$inferSelect;

interface Props {
  igUserId: string;
  accessToken: string;
  automations: Automation[];
}

export async function ContentDashboard({ igUserId, accessToken, automations }: Props) {
  const media = await fetchIGMedia(igUserId, accessToken, 30).catch(() => []);

  return (
    <ContentDashboardClient
      igUserId={igUserId}
      accessToken={accessToken}
      automations={automations}
      initialMedia={media}
    />
  );
}
