import { auth } from "@/auth";
import { db } from "@/db";
import { connectedAccounts } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Facebook, Share2, Plus, AlertCircle, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default async function SocialDashboardPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const session = await auth();
    if (!session?.user?.id) redirect("/auth/signin");

    const resolvedSearchParams = await searchParams;
    const error = resolvedSearchParams?.error as string;
    const success = resolvedSearchParams?.success as string;

    const accounts = await db.query.connectedAccounts.findMany({
        where: eq(connectedAccounts.userId, session.user.id),
    });

    const fbAccount = accounts.find((a) => a.provider === "facebook");
    // const igAccount = accounts.find((a) => a.provider === "instagram"); // In this model, they might be same "Facebook" login entry, or separate. For now let's assume we store the Facebook User Token.

    // Note: We currently store "facebook" provider for the main connection.
    // Instagram accounts are fetched VIA the Facebook connection.
    // So we primarily check for the Facebook provider existence.

    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Social Suite</h1>
                <p className="text-muted-foreground">
                    Manage your connected social accounts for auto-posting and engagement.
                </p>
            </div>

            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>
                        {error === "access_denied" ? "You denied access. Please try again and accept permissions." : error}
                    </AlertDescription>
                </Alert>
            )}

            {success && (
                <Alert className="border-green-500 text-green-600">
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertTitle>Success</AlertTitle>
                    <AlertDescription>Account connected successfully!</AlertDescription>
                </Alert>
            )}

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* Facebook Connection Card */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xl font-medium">Facebook & Instagram</CardTitle>
                        <Facebook className="h-6 w-6 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        {fbAccount ? (
                            <div className="flex flex-col gap-4 mt-4">
                                <div className="flex items-center gap-3">
                                    {fbAccount.picture ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={fbAccount.picture} alt={fbAccount.name || "Profile"} className="w-10 h-10 rounded-full" />
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center">
                                            <span className="text-lg font-bold text-slate-500">{fbAccount.name?.charAt(0)}</span>
                                        </div>
                                    )}
                                    <div>
                                        <p className="font-medium">{fbAccount.name}</p>
                                        <p className="text-xs text-muted-foreground">Connected as {fbAccount.providerAccountId}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-2 rounded border border-green-100">
                                    <CheckCircle2 className="h-4 w-4" />
                                    Long-Lived Token Active
                                </div>
                                <Button variant="outline" className="w-full" asChild>
                                    <Link href="/api/social/connect/facebook">Reconnect / Refresh</Link>
                                </Button>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-4 mt-4">
                                <p className="text-sm text-muted-foreground">
                                    Connect your Facebook account to manage Pages and linked Instagram Business accounts.
                                </p>
                                <Button className="w-full bg-[#1877F2] hover:bg-[#1864D9]" asChild>
                                    <Link href="/api/social/connect/facebook">
                                        <Plus className="h-4 w-4 mr-2" /> Connect Facebook
                                    </Link>
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Placeholder for future specific Instagram if needed separately (usually handled via FB Graph) */}
                <Card className="opacity-75 relative overflow-hidden">
                    <div className="absolute inset-0 bg-slate-50/50 z-10 flex items-center justify-center backdrop-blur-[1px]">
                        <span className="bg-slate-900 text-white text-xs px-2 py-1 rounded">Coming Soon</span>
                    </div>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xl font-medium">LinkedIn (Social)</CardTitle>
                        <Share2 className="h-6 w-6 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col gap-4 mt-4">
                            <p className="text-sm text-muted-foreground">Manage Company Page posts and analytics.</p>
                            <Button disabled variant="outline" className="w-full">Connect LinkedIn</Button>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Future: Post Capability Preview */}
            {fbAccount && (
                <div className="mt-8 border-t pt-8">
                    <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
                    <div className="flex gap-4">
                        <Button asChild>
                            <Link href="/dashboard/social/posts/new">Create New Post</Link>
                        </Button>
                        <Button variant="secondary" asChild>
                            <Link href="/dashboard/social/automations">Auto-Reply Rules</Link>
                        </Button>
                        <Button disabled variant="secondary">View Scheduled Posts</Button>
                    </div>
                </div>
            )}

        </div>
    );
}
