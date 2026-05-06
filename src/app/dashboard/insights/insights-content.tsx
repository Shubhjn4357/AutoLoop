import { fetchIGInsights, fetchIGProfile, type IGInsightMetric } from "@/lib/instagram/graph";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InsightsCharts } from "./insights-charts";
import { TrendingUp, Users, Eye, BarChart2 } from "lucide-react";

interface Props {
  igUserId: string;
  accessToken: string;
}

function sumValues(metric: IGInsightMetric | undefined): number {
  if (!metric) return 0;
  // Some metrics have 'total_value' in the values array, others need summation
  const total = metric.values.reduce((acc, v) => acc + v.value, 0);
  return total;
}

export async function InsightsContent({ igUserId, accessToken }: Props) {
  const until = Math.floor(Date.now() / 1000);
  const since = until - (7 * 24 * 60 * 60); // 7 days ago

  const [profile, metrics] = await Promise.all([
    fetchIGProfile(igUserId, accessToken).catch(() => null),
    fetchIGInsights(
      igUserId, 
      accessToken, 
      ["reach", "profile_views", "impressions", "accounts_engaged"], 
      "day",
      String(since),
      String(until)
    ).catch(() => []),
  ]);

  const reach = metrics.find((m) => m.name === "reach");
  const profileViews = metrics.find((m) => m.name === "profile_views");
  const impressions = metrics.find((m) => m.name === "impressions");
  const engaged = metrics.find((m) => m.name === "accounts_engaged");

  const stats = [
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
      label: "Impressions",
      value: sumValues(impressions).toLocaleString(),
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
      {/* Profile header */}
      {profile && (
        <div className="glass-card rounded-2xl p-5 flex items-center gap-4">
          {profile.profile_picture_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.profile_picture_url}
              alt={profile.username}
              className="size-14 rounded-full border-2 border-primary/20"
            />
          )}
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

      {/* Stat cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label} className="glass-card hover:-translate-y-1 transition-transform">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{label}</CardTitle>
              <div className={`p-2 rounded-lg ${bg}`}>
                <Icon className={`size-4 ${color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{value}</div>
              <p className="text-xs text-muted-foreground mt-1">Last 7 days</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts — client component because recharts needs browser */}
      <InsightsCharts reachMetric={reach} impressionsMetric={impressions} profileViewsMetric={profileViews} />
    </>
  );
}
