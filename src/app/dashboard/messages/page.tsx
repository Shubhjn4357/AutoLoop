import { db } from "@/lib/db/client";
import { messages as dbMessages, instagramAccounts } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import { MessageSquare } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default async function MessagesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const accounts = await db.query.instagramAccounts.findMany({
    where: eq(instagramAccounts.userId, session.user.id),
  });

  const igUserIds = accounts.map(a => a.igUserId).filter(Boolean) as string[];

  let recentMessages: typeof dbMessages.$inferSelect[] = [];
  
  if (igUserIds.length > 0) {
    recentMessages = await db.query.messages.findMany({
      where: eq(dbMessages.igUserId, igUserIds[0]),
      orderBy: [desc(dbMessages.timestamp)],
      limit: 50
    });
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <Card>
        <CardHeader>
          <CardTitle>Recent Messages</CardTitle>
          <CardDescription>View incoming DMs caught by the webhook</CardDescription>
        </CardHeader>
        <CardContent>
          {recentMessages.length === 0 ? (
            <div className="p-12 text-center border border-dashed rounded-lg">
              <MessageSquare className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No messages received yet.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sender ID</TableHead>
                  <TableHead>Message Text</TableHead>
                  <TableHead className="text-right">Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentMessages.map(msg => (
                  <TableRow key={msg.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <div className="bg-indigo-100 text-indigo-700 h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold">
                          {msg.senderId.slice(0, 2)}
                        </div>
                        {msg.senderId}
                      </div>
                    </TableCell>
                    <TableCell>{msg.text}</TableCell>
                    <TableCell className="text-right text-muted-foreground text-sm">
                      {msg.timestamp.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
