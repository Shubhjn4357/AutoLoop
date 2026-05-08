import Image from "next/image";
import { callServer } from "@/lib/server-api";
import type { IGUserProfile, IGMedia } from "@autoloop/types";

interface Props {
  query: string;
  externalId: string;
  accessToken: string;
  userId: string;
}

export async function SearchResults({ query, externalId, accessToken, userId }: Props) {
  if (!query) {
    return (
      <div className="glass-card rounded-3xl p-16 text-center text-muted-foreground">
        <svg className="size-12 mx-auto mb-4 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
        </svg>
        <p>Enter a username in the search bar above to discover profiles.</p>
      </div>
    );
  }

  try {
    const { data: profile } = await callServer(`/api/instagram/search?q=${query}`, userId) as { data: IGUserProfile & { media?: { data: IGMedia[] } } };

    return (
      <div className="space-y-6">
        {/* Profile Card */}
        <div className="glass-card rounded-3xl p-6 flex flex-col md:flex-row gap-6 items-center md:items-start">
          {profile.profile_picture_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img 
              src={profile.profile_picture_url} 
              alt={profile.username} 
              className="size-24 rounded-full border-4 border-primary/10"
            />
          )}
          <div className="flex-1 text-center md:text-left space-y-2">
            <h2 className="text-2xl font-bold">@{profile.username}</h2>
            <p className="text-muted-foreground">{profile.name}</p>
            {profile.biography && <p className="text-sm max-w-xl">{profile.biography}</p>}
            
            <div className="flex flex-wrap justify-center md:justify-start gap-4 pt-2">
              <div className="flex items-center gap-1.5 text-sm">
                <svg className="size-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <span className="font-bold">{profile.followers_count?.toLocaleString()}</span>
                <span className="text-muted-foreground">Followers</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm">
                <svg className="size-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <span className="font-bold">{profile.media_count?.toLocaleString()}</span>
                <span className="text-muted-foreground">Posts</span>
              </div>
            </div>
          </div>
          <a 
            href={`https://instagram.com/${profile.username}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="px-6 py-2.5 rounded-full bg-linear-to-r from-fuchsia-600 to-pink-600 text-white text-sm font-bold shadow-lg shadow-pink-500/20 hover:scale-105 transition-transform"
          >
            Visit Instagram
          </a>
        </div>

        {/* Media Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {profile.media?.data.map((item) => (
            <div key={item.id} className="group relative aspect-square rounded-xl overflow-hidden glass-card border border-white/10">
              {(item.thumbnail_url || item.media_url) && (
                <Image 
                  src={item.thumbnail_url ?? item.media_url!} 
                  alt="post" 
                  fill unoptimized 
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                />
              )}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 text-white text-xs font-bold">
                <span className="flex items-center gap-1">
                  <svg className="size-3" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                  {item.like_count}
                </span>
                <span className="flex items-center gap-1">
                  <svg className="size-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  {item.comments_count}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  } catch (err) {
    return (
      <div className="glass-card rounded-3xl p-16 text-center text-destructive">
        <p className="font-bold">Discovery Failed</p>
        <p className="text-sm opacity-80 mt-1">
          {err instanceof Error ? err.message : "User not found or is not a Business/Creator account."}
        </p>
        <p className="text-xs text-muted-foreground mt-4">
          Note: Business Discovery only works for public Instagram Business and Creator accounts.
        </p>
      </div>
    );
  }
}
