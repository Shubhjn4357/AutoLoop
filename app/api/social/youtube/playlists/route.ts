import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { connectedAccounts } from "@/db/schema";
import { getEffectiveUserId } from "@/lib/auth-utils";
import { eq, and } from "drizzle-orm";
import { google } from "googleapis";

// Helper to get authenticated YouTube client
async function getYouTubeClient(userId: string) {
    const account = await db.query.connectedAccounts.findFirst({
        where: and(
            eq(connectedAccounts.userId, userId),
            eq(connectedAccounts.provider, "youtube")
        )
    });

    if (!account) {
        throw new Error("YouTube account not connected");
    }

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
                refreshToken: tokens.refresh_token || account.refreshToken,
                expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : undefined,
                updatedAt: new Date()
            }).where(eq(connectedAccounts.id, account.id));
        }
    });

    return google.youtube({ version: 'v3', auth: oauth2Client });
}

export async function GET() {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = await getEffectiveUserId(session.user.id);

    try {
        const youtube = await getYouTubeClient(userId);

        // Handle 401/Refresh logic wrapper could be extracted, but for now relying on library + simple retry if needed
        // The library handles auto-refresh if refresh_token is set (which we do).

        const response = await youtube.playlists.list({
            part: ['snippet', 'contentDetails'],
            mine: true,
            maxResults: 50
        });

        const playlists = response.data.items?.map(item => ({
            id: item.id,
            title: item.snippet?.title,
            thumbnail: item.snippet?.thumbnails?.default?.url
        })) || [];

        return NextResponse.json({ playlists });

    } catch (error: unknown) {
        console.error("Fetch Playlists Error:", error);
        const errorMessage = error instanceof Error ? error.message : "Failed to fetch playlists";
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = await getEffectiveUserId(session.user.id);

    try {
        const { title, description } = await req.json();

        if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 });

        const youtube = await getYouTubeClient(userId);

        const response = await youtube.playlists.insert({
            part: ['snippet', 'status'],
            requestBody: {
                snippet: {
                    title: title,
                    description: description || "Created via AutoLoop"
                },
                status: {
                    privacyStatus: 'public' // Default to public or private? 'public' is usually desired for social tools
                }
            }
        });

        const newPlaylist = {
            id: response.data.id,
            title: response.data.snippet?.title,
            thumbnail: response.data.snippet?.thumbnails?.default?.url
        };

        return NextResponse.json({ playlist: newPlaylist });

    } catch (error: unknown) {
        console.error("Create Playlist Error:", error);
        const errorMessage = error instanceof Error ? error.message : "Failed to create playlist";
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
