import { auth } from "@/auth";
import { db } from "@/db";
import { socialAutomations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Zap, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export default async function AutomationsPage() {
    const session = await auth();
    if (!session?.user?.id) redirect("/auth/signin");

    const automations = await db.query.socialAutomations.findMany({
        where: eq(socialAutomations.userId, session.user.id),
        with: {
            account: true,
        }
    });

    const getActionLabel = (actionType: string) => {
        if (actionType === "reply_comment") return "Reply to Comment";
        if (actionType === "send_dm") return "Send Direct Message";
        if (actionType === "whatsapp_reply") return "Send WhatsApp Reply";
        return actionType;
    };

    const getPlatformLabel = (triggerType: string, provider?: string | null) => {
        if (provider) return provider;
        if (triggerType.startsWith("whatsapp_")) return "whatsapp";
        return "unassigned";
    };

    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="flex items-center justify-between">
                <div className="flex flex-col gap-2">
                    <Button variant="ghost" className="w-fit pl-0 hover:bg-transparent hover:text-primary" asChild>
                        <Link href="/dashboard/social">
                            <ChevronLeft className="mr-2 h-4 w-4" />
                            Back to Dashboard
                        </Link>
                    </Button>
                    <h1 className="text-3xl font-bold tracking-tight">Social Automations</h1>
                    <p className="text-muted-foreground">
                        Automatically handle comments, DMs, mentions, and WhatsApp replies.
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
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="capitalize">
                                        {getPlatformLabel(auto.triggerType, auto.account?.provider)}
                                    </Badge>
                                    <Badge variant={auto.isActive ? "default" : "secondary"}>
                                        {auto.isActive ? "Active" : "Paused"}
                                    </Badge>
                                </div>
                            </div>
                            <CardDescription>
                                Trigger: <span className="font-mono text-xs">{auto.triggerType}</span>
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-sm space-y-2">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Zap className="h-3 w-3" />
                                    <span>Action: {getActionLabel(auto.actionType)}</span>
                                </div>
                                {auto.account?.name && (
                                    <div className="text-xs text-muted-foreground">
                                        Account: {auto.account.name}
                                    </div>
                                )}
                                {auto.keywords && auto.keywords.length > 0 && (
                                    <div className="text-xs text-muted-foreground">
                                        Keywords: {auto.keywords.join(", ")}
                                    </div>
                                )}
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
