import { Bot, MessageCircle, BarChart3 } from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/db/client";
import { automations, messages as dbMessages, instagramAccounts } from "@/lib/db/schema";
import { eq, count, sql } from "drizzle-orm";
import { auth } from "@/lib/auth/config";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MessageChart } from "@/components/message-chart";

export default async function DashboardPage() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) return null;

  // 1. Gather real metrics
  const autoCountRes = await db.select({ value: count() })
    .from(automations)
    .where(eq(automations.userId, userId));
    
  const igAccountsRes = await db.select({ value: count() })
    .from(instagramAccounts)
    .where(eq(instagramAccounts.userId, userId));

  // Determine user's primary IG Account to pull message stats
  const igAccount = await db.query.instagramAccounts.findFirst({
    where: eq(instagramAccounts.userId, userId)
  });

  let messageCount = 0;
  let chartData: { date: string; messages: number }[] = [];

  if (igAccount?.igUserId) {
    const msgCountRes = await db.select({ value: count() })
      .from(dbMessages)
      .where(eq(dbMessages.igUserId, igAccount.igUserId));
    
    messageCount = msgCountRes[0].value;

    // Build Trailing 7 Day Chart Data mapping
    const rawData = await db.all(sql`
      SELECT date(timestamp/1000, 'unixepoch') as day, count(id) as c
      FROM messages
      WHERE ig_user_id = ${igAccount.igUserId}
      GROUP BY day
      ORDER BY day DESC
      LIMIT 7
    `);
    
    chartData = (rawData as Record<string, unknown>[]).map((row) => ({
      date: String(row.day),
      messages: Number(row.c),
    })).reverse();
    
    if (chartData.length === 0) {
      // Mock data if empty for visual demo
      chartData = [
        { date: "Mon", messages: 0 },
        { date: "Tue", messages: 1 },
        { date: "Wed", messages: 0 },
      ];
    }
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white mb-6">Overview & Analytics</h2>
      
      {/* Stats row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Connected Accounts</CardTitle>
            <div className="p-2 bg-indigo-100 rounded-lg dark:bg-indigo-900 border border-indigo-200 dark:border-indigo-800">
              <MessageCircle className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{igAccountsRes[0].value}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Automations</CardTitle>
            <div className="p-2 bg-green-100 rounded-lg dark:bg-green-900 border border-green-200 dark:border-green-800">
              <Bot className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{autoCountRes[0].value}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">DMs Processed</CardTitle>
            <div className="p-2 bg-orange-100 rounded-lg dark:bg-orange-900 border border-orange-200 dark:border-orange-800">
              <BarChart3 className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{messageCount}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
        {/* Main Analytics Chart */}
        <Card className="col-span-1 lg:col-span-4">
          <CardHeader>
            <CardTitle>Conversation Velocity</CardTitle>
            <CardDescription>
              Volume of messages received and processed over the trailing week.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MessageChart data={chartData} />
          </CardContent>
        </Card>

        {/* Calls to action */}
        <div className="col-span-1 lg:col-span-3 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Getting Started</CardTitle>
              <CardDescription>Complete these steps to activate flow.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">1. Connect Instagram</span>
                <Link href="/dashboard/settings" className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-md text-sm hover:bg-gray-200 transition-colors">Setup</Link>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">2. Create Automation Rule</span>
                <Link href="/dashboard/automations" className="px-3 py-1 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-md text-sm hover:bg-indigo-100 transition-colors">Go</Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
