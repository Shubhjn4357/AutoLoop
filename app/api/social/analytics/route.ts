import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { connectedAccounts } from "@/db/schema";
import { getEffectiveUserId } from "@/lib/auth-utils";
import { eq } from "drizzle-orm";
import { google } from "googleapis";

export async function GET() {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = await getEffectiveUserId(session.user.id);

    try {
        const accounts = await db.query.connectedAccounts.findMany({
            where: eq(connectedAccounts.userId, userId)
        });

        const analyticsPromises = accounts.map(async (account) => {
            const stats = {
                platform: account.provider,
                followers: 0,
                reach: 0,
                engagement: 0,
                name: account.name,
                picture: account.picture
            };

            try {
                if (account.provider === "facebook") {
                    // Fetch Page Insights: followers_count, fan_count
                    // Note: 'followers_count' is for User, 'fan_count' for Page
                    const url = `https://graph.facebook.com/v21.0/${account.providerAccountId}?fields=fan_count,followers_count&access_token=${account.accessToken}`;
                    const res = await fetch(url);
                    const data = await res.json();

                    if (data.fan_count !== undefined) stats.followers = data.fan_count;
                    if (data.followers_count !== undefined) stats.followers = Math.max(stats.followers, data.followers_count);

                    // Mock Reach/Engagement for now as it requires complex insights queries with date ranges
                    // In a real app we'd query /insights/page_impressions_unique
                }
                else if (account.provider === "youtube") {
                    const oauth2Client = new google.auth.OAuth2(
                        process.env.GOOGLE_CLIENT_ID,
                        process.env.GOOGLE_CLIENT_SECRET
                    );

                    oauth2Client.setCredentials({
                        access_token: account.accessToken,
                        refresh_token: account.refreshToken,
                        expiry_date: account.expiresAt ? new Date(account.expiresAt).getTime() : undefined
                    });

                    // Auto-refresh handler
                    oauth2Client.on('tokens', async (tokens) => {
                        if (tokens.access_token) {
                            await db.update(connectedAccounts).set({
                                accessToken: tokens.access_token,
                                refreshToken: tokens.refresh_token || account.refreshToken, // Keep old refresh token if new one not provided
                                expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : undefined,
                                updatedAt: new Date()
                            }).where(eq(connectedAccounts.id, account.id));
                        }
                    });

                    const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

                    try {
                        const res = await youtube.channels.list({
                            part: ['statistics'],
                            mine: true
                        });

                        if (res.data.items && res.data.items.length > 0) {
                            const st = res.data.items[0].statistics;
                            stats.followers = parseInt(st?.subscriberCount || "0");
                            stats.reach = parseInt(st?.viewCount || "0");
                            stats.engagement = parseInt(st?.videoCount || "0");
                        }
                    } catch (apiError: unknown) {
                        // Attempt explicit refresh if 401
                        // Need to cast to any or a specific error interface to access 'code'
                        // Google API errors usually have 'code' or 'response.status'
                        const fetchError = apiError as { code?: number; response?: { status?: number } };
                        if (fetchError.code === 401 || fetchError.response?.status === 401) {
                            console.log("YouTube Token expired, attempting refresh...");
                            try {
                                const { credentials } = await oauth2Client.refreshAccessToken();
                                oauth2Client.setCredentials(credentials);

                                // Retry request
                                const res = await youtube.channels.list({
                                    part: ['statistics'],
                                    mine: true
                                });

                                if (res.data.items && res.data.items.length > 0) {
                                    const st = res.data.items[0].statistics;
                                    stats.followers = parseInt(st?.subscriberCount || "0");
                                    stats.reach = parseInt(st?.viewCount || "0");
                                    stats.engagement = parseInt(st?.videoCount || "0");
                                }
                            } catch (refreshError: unknown) {
                                console.error("Failed to refresh YouTube token:", refreshError);
                                // Optional: access token invalid, maybe disconnect?
                            }
                        } else {
                            throw apiError;
                        }
                    }
                }
                else if (account.provider === "linkedin") {
                    // LinkedIn Profile API - v2/me or organizationalEntityAcls
                    // Getting follower count is restricted for personal profiles in v2 API without specific partner programs.
                    // We will skip deep stats for personal profiles and just set 0 or mock.
                }
            } catch (e: unknown) {
                console.error(`Failed to fetch stats for ${account.provider}`, e);
            }

            return stats;
        });

        const results = await Promise.all(analyticsPromises);

        // Aggregate
        const aggregated = {
            totalFollowers: results.reduce((acc, curr) => acc + curr.followers, 0),
            totalReach: results.reduce((acc, curr) => acc + curr.reach, 0),
            platforms: results
        };

        return NextResponse.json(aggregated);

    } catch (error: unknown) {
        console.error("Analytics Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
