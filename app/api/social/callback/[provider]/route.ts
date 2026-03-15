import { NextRequest, NextResponse } from "next/server";
import { setDefaultResultOrder } from "node:dns";
import { auth } from "@/auth";
import { db } from "@/db";
import { connectedAccounts } from "@/db/schema";
import { eq, and } from "drizzle-orm";

setDefaultResultOrder("ipv4first");
export async function GET(
    req: NextRequest,
    props: { params: Promise<{ provider: string }> }
) {
    const params = await props.params;
    const session = await auth();

    // Facebook callbacks might not have session cookies if same-site strict? 
    // We encoded userId in state, but ideally we want session active.
    // For now let's rely on session or state.

    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const stateParam = searchParams.get("state");
    const error = searchParams.get("error");
    const { provider } = await params;

    // Dynamic Base URL Detection
    const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
    const protocol = req.headers.get("x-forwarded-proto") || "https";
    const baseUrl = host ? `${protocol}://${host}` : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const effectiveBaseUrl = (process.env.NEXT_PUBLIC_APP_URL && !process.env.NEXT_PUBLIC_APP_URL.includes("0.0.0.0"))
        ? process.env.NEXT_PUBLIC_APP_URL
        : baseUrl;

    if (error) {
        return NextResponse.redirect(new URL(`/dashboard/social?error=${error}`, effectiveBaseUrl));
    }

    if (!code) {
        return NextResponse.redirect(new URL("/dashboard/social?error=no_code", effectiveBaseUrl));
    }

    try {
        const state = stateParam ? JSON.parse(stateParam) : {};
        const userId = session?.user?.id || state.userId;

        if (!userId) {
            return NextResponse.redirect(new URL("/auth/signin", effectiveBaseUrl));
        }

        if (provider === "facebook" || provider === "instagram") {
            const clientId = process.env.FACEBOOK_CLIENT_ID;
            const clientSecret = process.env.FACEBOOK_CLIENT_SECRET;

            const redirectUri = `${effectiveBaseUrl}/api/social/callback/facebook`;

            // 1. Exchange User Code for Short-Lived Token
            const tokenUrl = `https://graph.facebook.com/v19.0/oauth/access_token?client_id=${clientId}&redirect_uri=${redirectUri}&client_secret=${clientSecret}&code=${code}`;
            const tokenRes = await fetch(tokenUrl);
            const tokenData = await tokenRes.json();

            if (tokenData.error) {
                throw new Error(tokenData.error.message);
            }

            const shortLivedToken = tokenData.access_token;

            // 2. Exchange for Long-Lived Token
            const exchangeUrl = `https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${clientId}&client_secret=${clientSecret}&fb_exchange_token=${shortLivedToken}`;
            const exchangeRes = await fetch(exchangeUrl);
            const exchangeData = await exchangeRes.json();

            if (exchangeData.error) {
                throw new Error(exchangeData.error.message);
            }

            const longLivedToken = exchangeData.access_token;
            const expiresSeconds = exchangeData.expires_in || 5184000; // 60 days fallback
            const expiresAt = new Date(Date.now() + expiresSeconds * 1000);

            // 3. Fetch managed pages and linked Instagram business accounts.
            const pagesUrl = `https://graph.facebook.com/v21.0/me/accounts?fields=id,name,picture{url},access_token,instagram_business_account{id,username,profile_picture_url}&access_token=${longLivedToken}`;
            const pagesRes = await fetch(pagesUrl);
            const pagesData = await pagesRes.json();

            if (pagesData.error) {
                throw new Error(pagesData.error.message);
            }

            const pages = pagesData.data || [];

            if (pages.length === 0) {
                throw new Error("No Facebook Pages found. Connect a Page with the required permissions first.");
            }

            for (const page of pages) {
                const existingFacebookAccount = await db.query.connectedAccounts.findFirst({
                    where: and(
                        eq(connectedAccounts.userId, userId),
                        eq(connectedAccounts.provider, "facebook"),
                        eq(connectedAccounts.providerAccountId, page.id)
                    )
                });

                const facebookPayload = {
                    accessToken: page.access_token || longLivedToken,
                    expiresAt,
                    updatedAt: new Date(),
                    name: page.name,
                    picture: page.picture?.data?.url,
                    metadata: {
                        type: "facebook_page",
                        source: "meta_oauth",
                    },
                };

                if (existingFacebookAccount) {
                    await db
                        .update(connectedAccounts)
                        .set(facebookPayload)
                        .where(eq(connectedAccounts.id, existingFacebookAccount.id));
                } else {
                    await db.insert(connectedAccounts).values({
                        userId,
                        provider: "facebook",
                        providerAccountId: page.id,
                        ...facebookPayload,
                    });
                }

                const instagramAccount = page.instagram_business_account;

                if (instagramAccount?.id) {
                    const existingInstagramAccount = await db.query.connectedAccounts.findFirst({
                        where: and(
                            eq(connectedAccounts.userId, userId),
                            eq(connectedAccounts.provider, "instagram"),
                            eq(connectedAccounts.providerAccountId, instagramAccount.id)
                        )
                    });

                    const instagramPayload = {
                        accessToken: page.access_token || longLivedToken,
                        expiresAt,
                        updatedAt: new Date(),
                        name: instagramAccount.username || page.name,
                        picture: instagramAccount.profile_picture_url || page.picture?.data?.url,
                        metadata: {
                            type: "instagram_business",
                            pageId: page.id,
                            pageName: page.name,
                            source: "meta_oauth",
                        },
                    };

                    if (existingInstagramAccount) {
                        await db
                            .update(connectedAccounts)
                            .set(instagramPayload)
                            .where(eq(connectedAccounts.id, existingInstagramAccount.id));
                    } else {
                        await db.insert(connectedAccounts).values({
                            userId,
                            provider: "instagram",
                            providerAccountId: instagramAccount.id,
                            ...instagramPayload,
                        });
                    }
                }
            }

            return NextResponse.redirect(new URL("/dashboard/settings?success=connected", effectiveBaseUrl));
        }

        if (provider === "linkedin") {
            const clientId = process.env.LINKEDIN_CLIENT_ID;
            const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
            const redirectUri = `${effectiveBaseUrl}/api/social/callback/linkedin`;

            const tokenUrl = "https://www.linkedin.com/oauth/v2/accessToken";
            const params = new URLSearchParams();
            params.append("grant_type", "authorization_code");
            params.append("code", code);
            params.append("redirect_uri", redirectUri);
            params.append("client_id", clientId!);
            params.append("client_secret", clientSecret!);

            const tokenRes = await fetch(tokenUrl, {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: params
            });
            const tokenData = await tokenRes.json();

            if (tokenData.error) {
                throw new Error(tokenData.error_description || "LinkedIn Auth Failed");
            }

            const accessToken = tokenData.access_token;
            const expiresSeconds = tokenData.expires_in;
            const expiresAt = new Date(Date.now() + expiresSeconds * 1000);

            // Fetch Profile (OpenID)
            const meUrl = "https://api.linkedin.com/v2/userinfo";
            const meRes = await fetch(meUrl, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            const meData = await meRes.json();
            // meData: { sub: "id", name: "...", picture: "...", email: "..." }

            // Save to DB
            const existingAccount = await db.query.connectedAccounts.findFirst({
                where: and(
                    eq(connectedAccounts.userId, userId),
                    eq(connectedAccounts.provider, "linkedin")
                )
            });

            if (existingAccount) {
                await db.update(connectedAccounts).set({
                    accessToken: accessToken,
                    expiresAt: expiresAt,
                    updatedAt: new Date(),
                    name: meData.name,
                    picture: meData.picture,
                    providerAccountId: meData.sub
                }).where(eq(connectedAccounts.id, existingAccount.id));
            } else {
                await db.insert(connectedAccounts).values({
                    userId: userId,
                    provider: "linkedin",
                    providerAccountId: meData.sub,
                    accessToken: accessToken,
                    expiresAt: expiresAt,
                    name: meData.name,
                    picture: meData.picture
                });
            }

            return NextResponse.redirect(new URL("/dashboard/settings?success=connected", effectiveBaseUrl));
        }

        if (provider === "youtube") {
            const clientId = process.env.GOOGLE_CLIENT_ID;
            const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
            const redirectUri = `${effectiveBaseUrl}/api/social/callback/youtube`;

            const tokenUrl = "https://oauth2.googleapis.com/token";
            const params = new URLSearchParams();
            params.append("grant_type", "authorization_code");
            params.append("code", code);
            params.append("redirect_uri", redirectUri);
            params.append("client_id", clientId!);
            params.append("client_secret", clientSecret!);

            const tokenRes = await fetch(tokenUrl, {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: params
            });
            const tokenData = await tokenRes.json();

            if (tokenData.error) {
                throw new Error(tokenData.error_description || "YouTube Auth Failed");
            }

            const accessToken = tokenData.access_token;
            // Google tokens expire in 1 hour usually
            const expiresSeconds = tokenData.expires_in;
            const expiresAt = new Date(Date.now() + expiresSeconds * 1000);

            // Fetch Profile
            const meUrl = "https://www.googleapis.com/oauth2/v2/userinfo";
            const meRes = await fetch(meUrl, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            const meData = await meRes.json();
            // meData: { id: "...", email: "...", name: "...", picture: "..." }

            // Save to DB
            const existingAccount = await db.query.connectedAccounts.findFirst({
                where: and(
                    eq(connectedAccounts.userId, userId),
                    eq(connectedAccounts.provider, "youtube")
                )
            });

            if (existingAccount) {
                await db.update(connectedAccounts).set({
                    accessToken: accessToken,
                    expiresAt: expiresAt,
                    updatedAt: new Date(),
                    name: meData.name,
                    picture: meData.picture,
                    providerAccountId: meData.id
                }).where(eq(connectedAccounts.id, existingAccount.id));
            } else {
                await db.insert(connectedAccounts).values({
                    userId: userId,
                    provider: "youtube",
                    providerAccountId: meData.id,
                    accessToken: accessToken,
                    expiresAt: expiresAt,
                    name: meData.name,
                    picture: meData.picture
                });
            }

            return NextResponse.redirect(new URL("/dashboard/settings?success=connected", effectiveBaseUrl));
        }

    } catch (err) {
        console.error("Social Auth Error:", err);
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        return NextResponse.redirect(new URL(`/dashboard/social?error=${encodeURIComponent(errorMessage)}`, effectiveBaseUrl));
    }

    return NextResponse.redirect(new URL("/dashboard/social", effectiveBaseUrl));
}
