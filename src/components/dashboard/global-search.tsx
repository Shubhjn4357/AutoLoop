"use client";

import * as React from "react";
import { Search, Loader2, User, ImageIcon, Download, ExternalLink, Heart, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger, DrawerClose, DrawerFooter } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AnimatedButton } from "@/components/ui/animated-button";
import type { IGMedia, IGUserProfile } from "@/lib/instagram/graph";

export function GlobalSearch() {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<(IGUserProfile & { media?: { data: IGMedia[] } }) | null>(null);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanUsername = query.replace("@", "").trim();
    if (!cleanUsername) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/instagram/search?username=${cleanUsername}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Search failed");
      setResult(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Search failed");
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const downloadMedia = (url: string) => {
    // In a real browser, this might be blocked by CORS if direct, 
    // but we can try to open it in a new tab or use a proxy.
    // For now, let's open in new tab as "view/download"
    window.open(url, "_blank");
    toast.success("Opening media in new tab...");
  };

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <AnimatedButton
          variant="outline"
          size="sm"
          className="hidden md:flex text-muted-foreground gap-2 rounded-full px-4 glass-card border-white/10"
          disableGlow
        >
          <Search className="size-4" />
          <span>Search Instagram users...</span>
        </AnimatedButton>
      </DrawerTrigger>
      <DrawerTrigger asChild className="md:hidden">
        <AnimatedButton variant="ghost" size="icon" className="rounded-full">
          <Search className="size-5" />
        </AnimatedButton>
      </DrawerTrigger>
      <DrawerContent className="max-h-[90vh]">
        <div className="mx-auto w-full max-w-4xl overflow-hidden flex flex-col h-full">
          <DrawerHeader className="shrink-0 border-b pb-4">
            <DrawerTitle className="flex items-center gap-2">
              <Search className="size-5 text-primary" />
              Instagram Business Discovery
            </DrawerTitle>
            <form onSubmit={handleSearch} className="mt-4 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="Enter username (e.g. @zuck)"
                  className="pl-10 h-11 rounded-xl bg-muted/50 border-white/10"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  autoFocus
                />
              </div>
              <Button type="submit" disabled={loading} className="h-11 px-6 rounded-xl">
                {loading ? <Loader2 className="size-4 animate-spin" /> : "Search"}
              </Button>
            </form>
          </DrawerHeader>

          <div className="flex-1 overflow-y-auto p-6 space-y-8 min-h-[40vh]">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-64 gap-4">
                <Loader2 className="size-10 animate-spin text-primary" />
                <p className="text-muted-foreground animate-pulse">Scanning Instagram for @{query.replace("@", "")}...</p>
              </div>
            ) : result ? (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Profile Header */}
                <div className="flex flex-col sm:flex-row items-center gap-6 glass-card p-6 rounded-3xl border border-white/10">
                  <div className="relative size-24 shrink-0 rounded-full overflow-hidden ring-4 ring-primary/20 shadow-xl">
                    {result.profile_picture_url ? (
                      <Image unoptimized src={result.profile_picture_url} alt={result.username} fill className="object-cover" />
                    ) : (
                      <div className="size-full bg-muted flex items-center justify-center"><User className="size-10" /></div>
                    )}
                  </div>
                  <div className="flex-1 text-center sm:text-left space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <h3 className="text-2xl font-bold">@{result.username}</h3>
                      {result.name && <span className="text-muted-foreground font-medium">({result.name})</span>}
                    </div>
                    {result.biography && <p className="text-sm line-clamp-2 max-w-xl mx-auto sm:mx-0">{result.biography}</p>}
                    <div className="flex flex-wrap justify-center sm:justify-start gap-4 pt-2">
                      <div className="text-center sm:text-left">
                        <p className="text-lg font-bold">{result.followers_count?.toLocaleString()}</p>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Followers</p>
                      </div>
                      <div className="text-center sm:text-left">
                        <p className="text-lg font-bold">{result.follows_count?.toLocaleString()}</p>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Following</p>
                      </div>
                      <div className="text-center sm:text-left">
                        <p className="text-lg font-bold">{result.media_count?.toLocaleString()}</p>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Posts</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Media Grid */}
                <div className="space-y-4">
                  <h4 className="text-sm font-bold uppercase tracking-widest text-muted-foreground px-1">Recent Content</h4>
                  {result.media && result.media.data && result.media.data.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {result.media.data.map((post: IGMedia) => {
                        const mediaSrc = post.media_url || post.thumbnail_url;
                        return (
                          <div key={post.id} className="group relative aspect-square rounded-2xl overflow-hidden glass-card border border-white/10 hover:shadow-2xl transition-all duration-300">
                            {mediaSrc ? (
                              <Image unoptimized src={mediaSrc} alt="post" fill className="object-cover transition-transform duration-500 group-hover:scale-110" />
                            ) : (
                              <div className="size-full bg-muted flex items-center justify-center"><ImageIcon className="size-8 opacity-20" /></div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3 gap-2">
                              <div className="flex items-center gap-3 text-white text-xs font-bold">
                                <span className="flex items-center gap-1"><Heart className="size-3 fill-current" /> {post.like_count || 0}</span>
                                <span className="flex items-center gap-1"><MessageCircle className="size-3 fill-current" /> {post.comments_count || 0}</span>
                              </div>
                              <div className="flex gap-1">
                                {mediaSrc && (
                                  <Button size="icon" variant="secondary" className="size-8 rounded-lg" onClick={() => downloadMedia(mediaSrc)}>
                                    <Download className="size-4" />
                                  </Button>
                                )}
                                <Button
                                  size="icon"
                                  variant="secondary"
                                  className="size-8 rounded-lg"
                                  render={
                                    <a href={post.permalink} target="_blank" rel="noopener noreferrer">
                                      <ExternalLink className="size-4" />
                                    </a>
                                  }
                                />
                              </div>
                            </div>
                            {post.media_type === "VIDEO" && (
                               <div className="absolute top-2 right-2 size-6 bg-black/50 backdrop-blur rounded-full flex items-center justify-center">
                                 <div className="size-0 border-t-[4px] border-t-transparent border-l-[6px] border-l-white border-b-[4px] border-b-transparent ml-0.5" />
                               </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-12 glass-card rounded-3xl border border-dashed border-white/10">
                       <ImageIcon className="size-10 mx-auto text-muted-foreground opacity-20 mb-2" />
                       <p className="text-muted-foreground">No public media found for this user.</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-center opacity-50 grayscale">
                <div className="size-20 bg-muted rounded-full flex items-center justify-center mb-4">
                  <Search className="size-8" />
                </div>
                <p className="text-sm max-w-xs">Search for any Instagram Business or Creator account to see their metrics and content.</p>
              </div>
            )}
          </div>

          <DrawerFooter className="shrink-0 border-t">
            <DrawerClose asChild>
              <Button variant="outline" className="rounded-xl">Close</Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
