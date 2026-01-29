import { auth } from "@/auth";
import { db } from "@/db";
import { socialAutomations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Zap } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export default async function AutomationsPage() {
    const session = await auth();
    if (!session?.user?.id) redirect("/auth/signin");

    const automations = await db.query.socialAutomations.findMany({
        where: eq(socialAutomations.userId, session.user.id),
        with: {
            // We haven't defined relation in schema relations.ts yet, so usually we'd fetch manually or define relations.
            // For now, let's just fetch plain. We might lack account name in UI.
        }
    });

    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="flex items-center justify-between">
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-bold tracking-tight">Social Automations</h1>
                    <p className="text-muted-foreground">
                        Automatically reply to comments and DMs based on keywords.
                    </p>
                </div>
                <Button asChild>
                    <Link href="/dashboard/social/automations/new">
                        <Plus className="mr-2 h-4 w-4" /> Create Rule
                    </Link>
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {automations.map(auto => (
                    <Card key={auto.id}>
                        <CardHeader className="pb-3">
                            <div className="flex justify-between items-start">
                                <CardTitle className="text-lg">{auto.name}</CardTitle>
                                <Badge variant={auto.isActive ? "default" : "secondary"}>
                                    {auto.isActive ? "Active" : "Paused"}
                                </Badge>
                            </div>
                            <CardDescription>
                                Trigger: <span className="font-mono text-xs">{auto.triggerType}</span>
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-sm space-y-2">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Zap className="h-3 w-3" />
                                    <span>Action: {auto.actionType === "reply_comment" ? "Reply to Comment" : "Send DM"}</span>
                                </div>
                                <div className="p-2 bg-muted rounded text-xs truncate">
                                    {auto.responseTemplate}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {automations.length === 0 && (
                    <Card className="col-span-full border-dashed">
                        <CardContent className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
                            <Zap className="h-10 w-10 mb-4 opacity-20" />
                            <p>No automation rules yet.</p>
                            <p className="text-sm">Create your first rule to handle customer queries automatically.</p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
