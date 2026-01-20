import { auth } from "@/auth";
import { db } from "@/db";
import { banners } from "@/db/schema";
import { desc } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { sendGlobalNotification, createBanner, toggleBanner, deleteBanner } from "@/app/admin/actions";
import { Switch } from "@/components/ui/switch";
import { Trash2 } from "lucide-react";

export default async function SettingsPage() {
    const session = await auth();
    if (session?.user?.role !== "admin") return <div>Unauthorized</div>;

    const allBanners = await db.select().from(banners).orderBy(desc(banners.createdAt));

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
                <p className="text-muted-foreground">Manage platform configurations</p>
            </div>

            <Tabs defaultValue="notifications" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="notifications">Notifications</TabsTrigger>
                    <TabsTrigger value="banners">Info Banners</TabsTrigger>
                    <TabsTrigger value="changelog">Change Log</TabsTrigger>
                </TabsList>

                <TabsContent value="notifications">
                    <Card>
                        <CardHeader>
                            <CardTitle>Global Push Notification</CardTitle>
                            <CardDescription>Send a notification to all user dashboards.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form action={async (formData) => {
                                "use server";
                                await sendGlobalNotification(formData);
                            }} className="space-y-4 max-w-lg">
                                <div className="space-y-2">
                                    <Label htmlFor="title">Title</Label>
                                    <Input id="title" name="title" placeholder="e.g. System Update" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="message">Message</Label>
                                    <Textarea id="message" name="message" placeholder="Details..." required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="type">Type</Label>
                                    <select name="type" className="w-full p-2 border rounded-md bg-background">
                                        <option value="info">Info</option>
                                        <option value="warning">Warning</option>
                                        <option value="success">Success</option>
                                    </select>
                                </div>
                                <Button type="submit">Send Broadcast</Button>
                            </form>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="banners">
                    <div className="grid gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Create Info Banner</CardTitle>
                                <CardDescription>This will appear as a marquee on user dashboards.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form action={async (formData) => {
                                    "use server";
                                    await createBanner(formData);
                                }} className="space-y-4 max-w-lg">
                                    <div className="space-y-2">
                                        <Label htmlFor="message">Banner Message</Label>
                                        <Input id="message" name="message" placeholder="e.g. 50% Off Promo!" required />
                                    </div>
                                    <Button type="submit">Create Banner</Button>
                                </form>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Active Banners</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {allBanners.map((banner) => (
                                        <div key={banner.id} className="flex items-center justify-between p-4 border rounded-lg">
                                            <div>
                                                <p className="font-medium">{banner.message}</p>
                                                <p className="text-xs text-muted-foreground">{banner.createdAt.toLocaleDateString()}</p>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <form action={async () => {
                                                    "use server"
                                                    await toggleBanner(banner.id, !banner.isActive)
                                                }}>
                                                    <div className="flex items-center gap-2">
                                                        <Switch checked={banner.isActive} type="submit" />
                                                        <span className="text-sm">{banner.isActive ? "Active" : "Inactive"}</span>
                                                    </div>
                                                </form>
                                                <form action={async () => {
                                                    "use server"
                                                    await deleteBanner(banner.id)
                                                }}>
                                                    <Button size="icon" variant="ghost" className="text-destructive">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </form>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="changelog">
                    <Card>
                        <CardHeader>
                            <CardTitle>Platform Change Log</CardTitle>
                            <CardDescription>Track updates and version history (Coming Soon)</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">Change log management will be implemented in the next phase.</p>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
