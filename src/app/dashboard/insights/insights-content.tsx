import { fetchIGInsights, fetchIGProfile, type IGInsightMetric } from "@/lib/instagram/graph";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InsightsCharts } from "./insights-charts";
import { AppInsightsData } from "./app-insights-data";
import { TrendingUp, Users, Eye, BarChart2, AlertCircle } from "lucide-react";

interface Props {
  externalId: string;
  accessToken: string;
  userId: string;
}

function sumValues(metric: IGInsightMetric | undefined): number {
  if (!metric) return 0;
  const total = metric.values.reduce((acc, v) => acc + v.value, 0);
  return total;
}

export async function InsightsContent({ externalId, accessToken, userId }: Props) {
  const until = Math.floor(Date.now() / 1000);
  const since = until - (7 * 24 * 60 * 60); // 7 days ago

  let profile: Awaited<ReturnType<typeof fetchIGProfile>> | null = null;
  let metrics: IGInsightMetric[] = [];
  let apiError: string | null = null;

  try {
    [profile, metrics] = await Promise.all([
      fetchIGProfile(externalId, accessToken),
      fetchIGInsights(
        externalId,
        accessToken,
        ["reach", "profile_views", "accounts_engaged", "total_interactions"],
        "day",
        String(since),
        String(until)
      ),
    ]);
  } catch (err) {
    apiError = err instanceof Error ? err.message : "Instagram API unavailable";
    console.error("[Insights] Failed to fetch IG data:", err);
  }

  const hasIGData = metrics.length > 0 && profile;

  const reach = metrics.find((m) => m.name === "reach");
  const profileViews = metrics.find((m) => m.name === "profile_views");
  const interactions = metrics.find((m) => m.name === "total_interactions");
  const engaged = metrics.find((m) => m.name === "accounts_engaged");

  const igStats = [
    {
      label: "Accounts Reached",
      value: sumValues(reach).toLocaleString(),
      icon: Users,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: "Profile Views",
      value: sumValues(profileViews).toLocaleString(),
      icon: Eye,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      label: "Interactions",
      value: sumValues(interactions).toLocaleString(),
      icon: BarChart2,
      color: "text-fuchsia-500",
      bg: "bg-fuchsia-500/10",
    },
    {
      label: "Total Interactions",
      value: sumValues(engaged).toLocaleString(),
      icon: TrendingUp,
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
            <AlertCircle className="size-5 text-amber-500 shrink-0" />
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
