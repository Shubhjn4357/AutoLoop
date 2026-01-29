"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PenTool, MessageSquare, Settings, ExternalLink, Users, Eye, Trash2 } from "lucide-react";
import { SiFacebook, SiYoutube } from "@icons-pack/react-simple-icons";
import { Linkedin } from "lucide-react";
import Link from "next/link";
import { useApi } from "@/hooks/use-api";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Image from "next/image";

interface SocialPost {
    id: string;
    content: string;
    mediaUrls: string[];
    platform: string;
    status: string;
    createdAt: string;
    platformPostId?: string;
}

interface AnalyticsPlatform {
    platform: string;
    name?: string;
    followers: number;
    reach: number;
}

interface AnalyticsData {
    totalFollowers: number;
    totalReach: number;
    platforms: AnalyticsPlatform[];
}

export default function SocialDashboardPage() {
    const { get, del } = useApi();
    const [posts, setPosts] = useState<SocialPost[]>([]);
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
    const [analyticsLoading, setAnalyticsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            // Fetch Posts
            try {
                const postsData = await get("/api/social/posts") as { posts: SocialPost[] };
                if (postsData?.posts) {
                    setPosts(postsData.posts);
                }
            } catch (error) {
                console.error("Failed to fetch posts:", error);
            }

            // Fetch Analytics
            setAnalyticsLoading(true);
            try {
                const analyticsData = await get("/api/social/analytics") as AnalyticsData;
                setAnalytics(analyticsData);
            } catch (error) {
                console.error("Failed to fetch analytics:", error);
            } finally {
                setAnalyticsLoading(false);
            }
        };

        fetchData();
    }, [get]);

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.preventDefault(); // Prevent navigating if wrapped
        if (!confirm("Are you sure you want to delete this post history?")) return;

        try {
            await del(`/api/social/posts?id=${id}`);
            setPosts(posts.filter(p => p.id !== id));
            toast.success("Post deleted");
        } catch (error) {
            console.error("Delete failed", error);
            toast.error("Failed to delete post");
        }
    };

    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Social Content</h1>
                        <p className="text-muted-foreground">
                            Create posts, manage automations, and view analytics.
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" asChild>
                            <Link href="/dashboard/settings?tab=api">
                                <Settings className="mr-2 h-4 w-4" />
                                Manage Connections
                            </Link>
                        </Button>
                        <Button asChild>
                            <Link href="/dashboard/social/posts/new">
                                <PenTool className="mr-2 h-4 w-4" /> Create Post
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>

            <Tabs defaultValue="content" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="content">Content</TabsTrigger>
                    <TabsTrigger value="analytics">Analytics</TabsTrigger>
                </TabsList>

                <TabsContent value="content" className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-3">
                        {/* Stats / Quick Actions */}
                        <Card className="hover:bg-muted/50 transition-colors">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-xl font-medium">Automations</CardTitle>
                                <MessageSquare className="h-6 w-6 text-primary" />
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-col gap-4 mt-4">
                                    <p className="text-sm text-muted-foreground">
                                        Configure auto-replies and engagement rules.
                                    </p>
                                    <Button variant="secondary" asChild>
                                        <Link href="/dashboard/social/automations">Manage Rules</Link>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Recent Posts Table */}
                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold">Recent Posts</h2>
                        {posts.length === 0 ? (
                            <Card>
                                <CardContent className="flex flex-col items-center justify-center p-10 text-muted-foreground">
                                    <p>No posts yet. create your first post!</p>
                                    <Button variant="link" asChild>
                                        <Link href="/dashboard/social/posts/new">Create Post</Link>
                                    </Button>
                                </CardContent>
                            </Card>
                        ) : (
                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                    {posts.map((post) => (
                                        <Card key={post.id} className="overflow-hidden">
                                            {post.mediaUrls && post.mediaUrls.length > 0 && (
                                                <div className="aspect-video bg-muted relative">
                                                    <Image
                                                        src={post.mediaUrls[0]}
                                                        alt="Post media"
                                                        fill
                                                        className="object-cover"
                                                        unoptimized
                                                    />
                                                </div>
                                            )}
                                            <CardContent className="p-4 space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <Badge variant={post.status === 'published' ? 'default' : post.status === 'failed' ? 'destructive' : 'secondary'}>
                                                        {post.status}
                                                    </Badge>
                                                    <div className="flex gap-1 text-muted-foreground">
                                                        {post.platform === 'facebook' && <SiFacebook className="h-4 w-4 fill-current" />}
                                                        {post.platform === 'linkedin' && <Linkedin className="h-4 w-4 text-[#0077b5] fill-current" />}
                                                        {post.platform === 'youtube' && <SiYoutube className="h-4 w-4 fill-current" />}
                                                    </div>
                                                </div>
                                                <p className="text-sm line-clamp-3">{post.content || "No caption"}</p>
                                                <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                                                    <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                                                    <div className="flex gap-1">
                                                        {post.platformPostId && (
                                                            <Button variant="ghost" size="icon" className="h-6 w-6" title="View on Platform">
                                                                <ExternalLink className="h-3 w-3" />
                                                            </Button>
                                                        )}
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-6 w-6 text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                                                            onClick={(e) => handleDelete(post.id, e)}
                                                            title="Delete Post History"
                                                        >
                                                            <Trash2 className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                            </div>
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="analytics" className="space-y-6">
                    {analyticsLoading ? (
                        <div className="flex items-center justify-center p-12">Checking Analytics...</div>
                    ) : (
                        <>
                            {/* Overview Cards */}
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Total Audience</CardTitle>
                                        <Users className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{analytics?.totalFollowers?.toLocaleString() || 0}</div>
                                        <p className="text-xs text-muted-foreground">Across all platforms</p>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                            <CardTitle className="text-sm font-medium">Total Reach</CardTitle>
                                            <Eye className="h-4 w-4 text-muted-foreground" />
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl font-bold">{analytics?.totalReach?.toLocaleString() || 0}</div>
                                            <p className="text-xs text-muted-foreground">Views & Impressions</p>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Platform Breakdown */}
                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                    {analytics?.platforms?.map((p) => (
                                        <Card key={p.platform}>
                                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                                <CardTitle className="text-base font-medium capitalize flex items-center gap-2">
                                                    {p.platform === 'facebook' && <SiFacebook className="h-4 w-4 text-[#1877F2]" />}
                                                    {p.platform === 'linkedin' && <Linkedin className="h-4 w-4 text-[#0A66C2] fill-current" />}
                                                    {p.platform === 'youtube' && <SiYoutube className="h-4 w-4 text-[#FF0000]" />}
                                                    {p.name || p.platform}
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm text-muted-foreground">Followers/Subs</span>
                                                    <span className="font-bold">{p.followers?.toLocaleString()}</span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm text-muted-foreground">Reach/Views</span>
                                                    <span className="font-bold">{p.reach?.toLocaleString()}</span>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
