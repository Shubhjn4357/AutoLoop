import Image from "next/image";
import { searchIGUser } from "@/lib/instagram/graph";
import { Users, BookOpen, Heart, MessageCircle, Globe } from "lucide-react";

interface Props {
  query: string;
  externalId: string;
  accessToken: string;
}

export async function SearchResults({ query, externalId, accessToken }: Props) {
  if (!query) {
    return (
      <div className="glass-card rounded-3xl p-16 text-center text-muted-foreground">
        <Globe className="size-12 mx-auto mb-4 opacity-20" />
        <p>Enter a username in the search bar above to discover profiles.</p>
      </div>
    );
  }

  try {
    const profile = await searchIGUser(externalId, accessToken, query);

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
                <Users className="size-4 text-primary" />
                <span className="font-bold">{profile.followers_count?.toLocaleString()}</span>
                <span className="text-muted-foreground">Followers</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm">
                <BookOpen className="size-4 text-primary" />
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
                <span className="flex items-center gap-1"><Heart className="size-3" /> {item.like_count}</span>
                <span className="flex items-center gap-1"><MessageCircle className="size-3" /> {item.comments_count}</span>
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
