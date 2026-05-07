import { fetchIGMedia } from "@/lib/instagram/graph";
import type { automations as AutomationType } from "@/lib/db/schema";
import dynamic from "next/dynamic";

const ContentDashboardClient = dynamic(() => import("./content-dashboard-client").then(mod => mod.ContentDashboardClient), {
  ssr: false
});

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
