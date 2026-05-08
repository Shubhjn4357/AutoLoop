import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InsightsCharts, AppInsightsData } from "./insights-dynamic";
import { callServer } from "@/lib/server-api";
import type { IGInsightMetric, IGUserProfile } from "@autoloop/types";

interface Props {
  externalId: string;
  userId: string;
}

function sumValues(metric: IGInsightMetric | undefined): number {
  if (!metric) return 0;
  const total = metric.values.reduce((acc: number, v: { value: number }) => acc + v.value, 0);
  return total;
}

export async function InsightsContent({ externalId, userId }: Props) {
  const until = Math.floor(Date.now() / 1000);
  const since = until - (7 * 24 * 60 * 60); // 7 days ago

  let profile: IGUserProfile | null = null;
  let metrics: IGInsightMetric[] = [];
  let apiError: string | null = null;

  try {
    const [profileRes, metricsRes] = await Promise.all([
      callServer('/api/instagram/profile', userId),
      callServer(`/api/instagram/insights?since=${since}&until=${until}`, userId),
    ]);
    profile = profileRes.data;
    metrics = metricsRes.data;
  } catch (err) {
    apiError = err instanceof Error ? err.message : "Instagram API unavailable";
    console.error("[Insights] Failed to fetch IG data:", err);
  }

  const hasIGData = metrics.length > 0 && profile;

  const reach = metrics.find((m) => m.name === "reach");
  const profileViews = metrics.find((m) => m.name === "profile_views" || m.name === "profile_visits");
  const interactions = metrics.find((m) => m.name === "total_interactions");
  const engaged = metrics.find((m) => m.name === "accounts_engaged");

  const impressions = metrics.find((m) => m.name === "impressions");

  const igStats = [
    {
      label: "Reach",
      value: sumValues(reach).toLocaleString(),
      icon: (props: React.SVGProps<SVGSVGElement>) => (
        <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: "Impressions",
      value: sumValues(impressions).toLocaleString(),
      icon: (props: React.SVGProps<SVGSVGElement>) => (
        <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      ),
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      label: "Engaged Accounts",
      value: sumValues(engaged).toLocaleString(),
      icon: (props: React.SVGProps<SVGSVGElement>) => (
        <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      color: "text-fuchsia-500",
      bg: "bg-fuchsia-500/10",
    },
    {
      label: "Total Interactions",
      value: sumValues(interactions).toLocaleString(),
      icon: (props: React.SVGProps<SVGSVGElement>) => (
        <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
    },
  ];

  return (
    <>
      {/* API Error Banner */}
      {apiError && (
        <Card className="border-amber-500/20 bg-amber-500/5">
          <CardContent className="flex items-center gap-3 py-4">
            <svg className="size-5 text-amber-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-600">Instagram API Unavailable</p>
              <p className="text-xs text-muted-foreground">Showing AutoLoop app data instead. Error: {apiError}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* IG Profile Header - Only if available */}
      {profile && (
        <div className="glass-card rounded-2xl p-5 flex items-center gap-4">
          <div>
            <p className="font-bold text-lg">@{profile.username}</p>
            <p className="text-sm text-muted-foreground">{profile.biography ?? profile.name}</p>
          </div>
          <div className="ml-auto hidden sm:flex items-center gap-6 text-center">
            <div>
              <p className="font-bold text-xl">{profile.media_count?.toLocaleString() ?? "—"}</p>
              <p className="text-xs text-muted-foreground">Posts</p>
            </div>
            <div>
              <p className="font-bold text-xl">{profile.followers_count?.toLocaleString() ?? "—"}</p>
              <p className="text-xs text-muted-foreground">Followers</p>
            </div>
            <div>
              <p className="font-bold text-xl">{profile.follows_count?.toLocaleString() ?? "—"}</p>
              <p className="text-xs text-muted-foreground">Following</p>
            </div>
          </div>
        </div>
      )}

      {/* IG Stats - Only if available */}
      {hasIGData && (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {igStats.map(({ label, value, icon: Icon, color, bg }) => (
              <Card key={label} className="glass-card hover:-translate-y-1 transition-transform">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">{label}</CardTitle>
                  <div className={`p-2 rounded-lg ${bg}`}>
                    <Icon className={`size-4 ${color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{value}</div>
                  <p className="text-xs text-muted-foreground mt-1">Last 7 days from Instagram</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <InsightsCharts
            reachMetric={reach}
            interactionsMetric={interactions}
            profileViewsMetric={profileViews}
          />
        </>
      )}

      {/* App-Level Fallback Data */}
      <AppInsightsData userId={userId} externalId={externalId} />
    </>
  );
}
