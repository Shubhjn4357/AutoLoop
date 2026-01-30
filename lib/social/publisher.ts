import fs from "fs";
import path from "path";
import { google } from "googleapis";

export interface SocialPostPayload {
    content: string;
    mediaUrl?: string; // Relative path like "/uploads/xyz.jpg"
    accessToken: string;
    providerAccountId: string;
    refreshToken?: string; // Needed for YouTube
}

// Helper to get file stream
const getFileStream = (mediaUrl: string) => {
    // Assume mediaUrl is relative to public (e.g. /uploads/file.jpg)
    // Remove query params if any
    const cleanPath = mediaUrl.split('?')[0]; 
    const filePath = path.join(process.cwd(), "public", cleanPath);
    if (!fs.existsSync(filePath)) {
        throw new Error(`File not found at ${filePath}`);
    }
    return {
        stream: fs.createReadStream(filePath),
        size: fs.statSync(filePath).size,
        path: filePath,
        mimeType: cleanPath.endsWith(".mp4") ? "video/mp4" : cleanPath.endsWith(".png") ? "image/png" : "image/jpeg"
    };
};

export const socialPublisher = {
    publishToFacebook: async (payload: SocialPostPayload) => {
        const { content, mediaUrl, accessToken, providerAccountId } = payload;
        
        const params = new FormData();
        params.append("access_token", accessToken);
        
        let url = `https://graph.facebook.com/v21.0/${providerAccountId}/feed`;
        
        if (mediaUrl) {
            const file = getFileStream(mediaUrl);
            const isVideo = file.mimeType.startsWith("video");
            
            if (isVideo) {
                 url = `https://graph.facebook.com/v21.0/${providerAccountId}/videos`;
                 params.append("description", content);
           
                 params.append("source", new Blob([fs.readFileSync(file.path)]), path.basename(file.path));
            } else {
                 url = `https://graph.facebook.com/v21.0/${providerAccountId}/photos`;
                 params.append("message", content);
           
                 params.append("source", new Blob([fs.readFileSync(file.path)]), path.basename(file.path));
            }
        } else {
            params.append("message", content);
        }

        const res = await fetch(url, {
            method: "POST",
            body: params, 
        });

        const data = await res.json();
        if (data.error) throw new Error(data.error.message);
        return data.id;
    },

    publishToInstagram: async (payload: SocialPostPayload) => {
        // IG still requires public URL for 'image_url' or 'video_url' in Content Publishing API usually.
        // However, for strict binary upload, we might need to use the graph API slightly differently or rely on a public URL.
        // Since we are running locally, "localhost" urls won't work for IG to download.
        // BUT, we can use the "Upload API" if we were using the Instagram Graph API for Stories etc, but for Feed it primarily asks for URL.
        
        // CRITICAL LIMITATION: Instagram Graph API *requires* the image/video to be on a public URL. It does NOT support binary upload for feed posts easily like FB.
        // Workaround: We must warn the user if on localhost.
        // OR: If we really want "real business suite", we'd upload to a temporary Image hosting service or S3.
        // For this task, we will try to use the binary upload endpoint valid for *Stories* or *Reels* if applicable, but for generic posts it's tricky.
        // ACTUALLY: The "Container" endpoint only accepts 'image_url'.
        
        // Strategy: Throw error if URL is localhost, prompt to use ngrok or deploy.
        const { content, mediaUrl, accessToken, providerAccountId } = payload;
        
        if (!mediaUrl) throw new Error("Instagram posts require media");
        
        // Check for localhost
        // Use process.env.NEXT_PUBLIC_APP_URL
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
        if (appUrl.includes("localhost") || appUrl.includes("127.0.0.1")) {
            throw new Error("Instagram Direct Publishing requires a publically accessible Media URL. Localhost is not supported by Meta. Please deploy the app or use ngrok.");
        }

        // Logic remains same as URL based for IG because it enforces it.
        // ... (previous logic) ...
         const containerUrl = `https://graph.facebook.com/v21.0/${providerAccountId}/media`;
         const fullUrl = mediaUrl.startsWith("http") ? mediaUrl : `${appUrl}${mediaUrl}`;

        const containerParams: {
            access_token: string;
            caption: string;
            image_url?: string;
            media_type?: 'VIDEO';
            video_url?: string;
        } = {
            access_token: accessToken,
            caption: content,
        };

        if (mediaUrl.match(/\.(jpg|jpeg|png)$/i)) {
             containerParams.image_url = fullUrl;
        } else if (mediaUrl.match(/\.(mp4|mov)$/i)) {
             containerParams.media_type = "VIDEO";
             containerParams.video_url = fullUrl;
        }

        const containerRes = await fetch(containerUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(containerParams),
        });
        const containerData = await containerRes.json();
        if (containerData.error) throw new Error(containerData.error.message);
        
        const creationId = containerData.id;

        // Step 2: Publish
        const publishUrl = `https://graph.facebook.com/v21.0/${providerAccountId}/media_publish`;
        const publishRes = await fetch(publishUrl, {
             method: "POST",
             headers: { "Content-Type": "application/json" },
             body: JSON.stringify({
                 creation_id: creationId,
                 access_token: accessToken
             }),
        });
        const publishData = await publishRes.json();
        if (publishData.error) throw new Error(publishData.error.message);
        return publishData.id;
    },

    publishToLinkedin: async (payload: SocialPostPayload) => {
        const { content, mediaUrl, accessToken, providerAccountId } = payload;
        
        let asset = null;

        if (mediaUrl) {
            const file = getFileStream(mediaUrl);
            
            // 1. Register Upload
            const registerUrl = "https://api.linkedin.com/v2/assets?action=registerUpload";
            const registerBody = {
                registerUploadRequest: {
                    recipes: [
                        "urn:li:digitalmediaRecipe:feedshare-image" // Simplified for image
                    ],
                    owner: `urn:li:person:${providerAccountId}`,
                    serviceRelationships: [
                        {
                            relationshipType: "OWNER",
                            identifier: "urn:li:userGeneratedContent"
                        }
                    ]
                }
            };
            // Note: Video recipe is 'urn:li:digitalmediaRecipe:feedshare-video'
            if (file.mimeType.startsWith("video")) {
                registerBody.registerUploadRequest.recipes = ["urn:li:digitalmediaRecipe:feedshare-video"];
            }

            const regRes = await fetch(registerUrl, {
                method: "POST",
                headers: { "Authorization": `Bearer ${accessToken}`, "Content-Type": "application/json" },
                body: JSON.stringify(registerBody)
            });
            const regData = await regRes.json();
            if (regData.status && regData.status !== 200) throw new Error("LinkedIn Register Failed: " + JSON.stringify(regData));

            const uploadUrl = regData.value.uploadMechanism["com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"].uploadUrl;
            asset = regData.value.asset;

            // 2. Upload Binary
            const uploadRes = await fetch(uploadUrl, {
                method: "PUT",
                headers: { "Authorization": `Bearer ${accessToken}`, "Content-Type": "application/octet-stream" },
                body: fs.readFileSync(file.path) 
            });
            
            if (uploadRes.status !== 201 && uploadRes.status !== 200) {
                 throw new Error("LinkedIn Binary Upload Failed");
            }
        }

        // 3. Create Post
        const url = "https://api.linkedin.com/v2/ugcPosts";
        const body: {
            author: string;
            lifecycleState: 'PUBLISHED';
            specificContent: {
                'com.linkedin.ugc.ShareContent': {
                    shareCommentary: { text: string };
                    shareMediaCategory: 'NONE' | 'IMAGE' | 'VIDEO';
                    media?: Array<{
                        status: string;
                        description: { text: string };
                        media: string;
                        title: { text: string };
                    }>;
                };
            };
            visibility: {
                'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC';
            };
        } = {
            author: `urn:li:person:${providerAccountId}`,
            lifecycleState: "PUBLISHED",
            specificContent: {
                "com.linkedin.ugc.ShareContent": {
                    shareCommentary: {
                        text: content
                    },
                    shareMediaCategory: asset ? (mediaUrl?.match(/\.mp4$/) ? "VIDEO" : "IMAGE") : "NONE",
                }
            },
            visibility: {
                "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
            }
        };

        if (asset) {
            body.specificContent["com.linkedin.ugc.ShareContent"].media = [
                {
                    status: "READY",
                    description: { text: "Center stage!" },
                    media: asset,
                    title: { text: "Uploaded Media" }
                }
            ];
        }

        const res = await fetch(url, {
             method: "POST",
             headers: {
                 "Authorization": `Bearer ${accessToken}`,
                 "Content-Type": "application/json",
                 "X-Restli-Protocol-Version": "2.0.0"
             },
             body: JSON.stringify(body)
        });

        const data = await res.json();
        if (data.status && data.status !== 201) throw new Error(data.message || "Linkedin Post Failed");
        return data.id;
    },

    publishToYoutube: async (payload: SocialPostPayload) => {
         const { content, mediaUrl, accessToken, refreshToken } = payload;
         
         if (!mediaUrl) throw new Error("YouTube requires a video file.");
         const file = getFileStream(mediaUrl);

         const oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET
         );

         oauth2Client.setCredentials({
             access_token: accessToken,
             refresh_token: refreshToken
         });

         const youtube = google.youtube({
             version: 'v3',
             auth: oauth2Client
         });

         const res = await youtube.videos.insert({
             part: ['snippet', 'status'],
             requestBody: {
                 snippet: {
                     title: content.substring(0, 100), // Title is limited
                     description: content,
                 },
                 status: {
                     privacyStatus: 'public' // or private/unlisted
                 }
             },
             media: {
                 body: fs.createReadStream(file.path)
             }
         });

         return res.data.id;
    }
};
