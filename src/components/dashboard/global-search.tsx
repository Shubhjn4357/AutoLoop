"use client";

import * as React from "react";
import { Search, Loader2, User, ImageIcon, Download, ExternalLink, Heart, MessageCircle, AlertCircle, ChevronLeft, ChevronRight, Play } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import Fuse from "fuse.js";

import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger, DrawerClose, DrawerFooter } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AnimatedButton } from "@/components/ui/animated-button";
import { motion, AnimatePresence } from "framer-motion";
import type { IGMedia, IGUserProfile } from "@/lib/instagram/graph";
import { useDashboardContext } from "./dashboard-context";

interface Suggestion {
  username: string;
  name?: string;
  profilePic?: string;
  mediaCount?: number;
  source: "local" | "instagram" | "exact";
}

interface FuzzySearchResult {
  exactMatch: IGUserProfile & { media?: { data: IGMedia[] } } | null;
  fuzzyMatches: Array<{
    username: string;
    mediaCount: number;
    sampleMedia: {
      media_url?: string;
      thumbnail_url?: string;
    };
  }>;
  query: string;
}

export function GlobalSearch() {
  const { isSearchOpen: open, setIsSearchOpen: setOpen } = useDashboardContext();
  const [query, setQuery] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<(IGUserProfile & { media?: { data: IGMedia[] } }) | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [selectedMedia, setSelectedMedia] = React.useState<IGMedia | null>(null);
  const [currentMediaIndex, setCurrentMediaIndex] = React.useState(0);
  const [suggestions, setSuggestions] = React.useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = React.useState(false);
  const [localContacts, setLocalContacts] = React.useState<Suggestion[]>([]);
  const [view, setView] = React.useState<"search" | "viewer">("search");
  const debounceRef = React.useRef<NodeJS.Timeout | null>(null);

  // Load local contacts for suggestions
  React.useEffect(() => {
    const loadContacts = async () => {
      try {
        const res = await fetch("/api/contacts/list?limit=50");
        if (res.ok) {
          const data = await res.json();
          setLocalContacts(
            data.contacts.map((c: { username?: string; name?: string; profilePic?: string }) => ({
              username: c.username || "",
              name: c.name,
              profilePic: c.profilePic,
              source: "local" as const,
            })).filter((c: Suggestion) => c.username)
          );
        }
      } catch {
        // Silently fail - suggestions are optional
      }
    };
    if (open) loadContacts();
  }, [open]);

  // Debounced Instagram fuzzy search suggestions
  React.useEffect(() => {
    const cleanQuery = query.replace("@", "").trim().toLowerCase();

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (cleanQuery.length === 0) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      // First get local matches using Fuse.js
      let localMatches: Suggestion[] = [];
      if (localContacts.length > 0) {
        const fuse = new Fuse(localContacts, {
          keys: ["username", "name"],
          threshold: 0.3,
        });
        localMatches = fuse.search(cleanQuery).map((r: { item: Suggestion }) => r.item);
      }

      // Then get Instagram fuzzy search results
      const instagramMatches: Suggestion[] = [];
      if (cleanQuery.length >= 1) {
        try {
          const res = await fetch(`/api/instagram/search-fuzzy?q=${encodeURIComponent(cleanQuery)}`);
          if (res.ok) {
            const data: FuzzySearchResult = await res.json();
            // Add exact match as first suggestion if found
            if (data.exactMatch) {
              instagramMatches.push({
                username: data.exactMatch.username,
                name: data.exactMatch.name,
                profilePic: data.exactMatch.profile_picture_url,
                source: "exact",
              });
            }
            // Add fuzzy matches
            instagramMatches.push(
              ...data.fuzzyMatches.map((m) => ({
                username: m.username,
                profilePic: m.sampleMedia.thumbnail_url || m.sampleMedia.media_url,
                mediaCount: m.mediaCount,
                source: "instagram" as const,
              }))
            );
          }
        } catch {
          // Silently fail - local suggestions will still show
        }
      }

      // Combine and deduplicate
      const seen = new Set<string>();
      const allSuggestions: Suggestion[] = [];

      // Add local matches first
      for (const s of localMatches) {
        if (!seen.has(s.username.toLowerCase())) {
          seen.add(s.username.toLowerCase());
          allSuggestions.push(s);
        }
      }

      // Then add Instagram matches
      for (const s of instagramMatches) {
        if (!seen.has(s.username.toLowerCase())) {
          seen.add(s.username.toLowerCase());
          allSuggestions.push(s);
        }
      }

      setSuggestions(allSuggestions.slice(0, 10));
      setShowSuggestions(allSuggestions.length > 0);
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, localContacts]);

  const handleSearch = async (searchQuery?: string) => {
    const cleanUsername = (searchQuery || query).replace("@", "").trim().toLowerCase();
    if (!cleanUsername) return;

    setLoading(true);
    setError(null);
    setShowSuggestions(false);
    try {
      const res = await fetch(`/api/instagram/search?username=${encodeURIComponent(cleanUsername)}`);
      const data = await res.json();

      if (!res.ok) {
        if (data.error?.includes("#10") || data.error?.includes("permission")) {
          throw new Error("Meta Permission Error: Reconnect your account in Settings and ensure 'Business Discovery' is checked.");
        }
        if (data.error?.includes("not found") || data.error?.includes("#803")) {
          throw new Error(`@${cleanUsername} not found. Try checking the spelling or search for a different username.`);
        }
        throw new Error(data.error || "Search failed");
      }

      setResult(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Search failed";
      setError(msg);
      toast.error(msg);
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const downloadMedia = (url: string) => {
    window.open(url, "_blank");
    toast.success("Opening media in new tab...");
  };

  const openMediaViewer = (post: IGMedia, index: number) => {
    setSelectedMedia(post);
    setCurrentMediaIndex(index);
    setView("viewer");
  };

  const closeMediaViewer = () => {
    setView("search");
    setSelectedMedia(null);
  };

  const navigateMedia = (direction: "prev" | "next") => {
    if (!result?.media?.data) return;
    const newIndex = direction === "next"
      ? Math.min(currentMediaIndex + 1, result.media.data.length - 1)
      : Math.max(currentMediaIndex - 1, 0);
    setCurrentMediaIndex(newIndex);
    setSelectedMedia(result.media.data[newIndex]);
  };

  return (
    <>
      <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <AnimatedButton
          variant="outline"
          size="sm"
          className="hidden md:flex text-muted-foreground gap-2 rounded-full px-4 glass-card border-border"
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
        <DrawerContent className="h-[100vh] max-h-[100vh] rounded-none">
        <div className="mx-auto w-full max-w-4xl overflow-hidden flex flex-col h-full">
            <DrawerHeader className="shrink-0 border-b pb-4">
              <div className="flex items-center justify-between">
                <DrawerTitle className="flex items-center gap-2">
                  <Search className="size-5 text-primary" />
                  Instagram Business Discovery
                </DrawerTitle>
                {view === "viewer" && (
                  <Button variant="ghost" size="sm" onClick={closeMediaViewer} className="rounded-xl gap-2">
                    <ChevronLeft className="size-4" />
                    Back to Profile
                  </Button>
                )}
              </div>
              {view === "search" && (
                <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }} className="mt-4 flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground z-10" />
                    <Input
                      placeholder="Search username (try typing 's' for suggestions)"
                      className="pl-10 h-11 rounded-xl bg-muted/50 border-border"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onFocus={() => query.length > 0 && suggestions.length > 0 && setShowSuggestions(true)}
                      autoFocus
                    />
                    {/* Suggestions Dropdown */}
                    {showSuggestions && suggestions.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-xl shadow-lg z-50 max-h-64 overflow-y-auto">
                        <div className="p-2 text-xs text-muted-foreground border-b border-border/50">
                          {query.length === 1 ? "Popular accounts" : "Suggestions"} - Press Enter to search exact match
                        </div>
                        {suggestions.map((suggestion) => (
                          <button
                            key={`${suggestion.source}-${suggestion.username}`}
                            type="button"
                            className="w-full flex items-center gap-3 p-3 hover:bg-accent transition-colors text-left"
                            onClick={() => {
                              setQuery(suggestion.username);
                              setShowSuggestions(false);
                              handleSearch(suggestion.username);
                            }}
                          >
                            <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                              {suggestion.profilePic ? (
                                /* eslint-disable-next-line @next/next/no-img-element */
                                <img
                                  src={suggestion.profilePic}
                                  alt=""
                                  className="w-full h-full rounded-full object-cover"
                                />
                              ) : (
                                <User className="size-4 text-primary" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">@{suggestion.username}</p>
                              {suggestion.name && (
                                <p className="text-xs text-muted-foreground truncate">{suggestion.name}</p>
                              )}
                            </div>
                            <span className="text-[10px] text-muted-foreground uppercase tracking-wider shrink-0">
                              {suggestion.source === "local" ? "Contact" : "Popular"}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <Button type="submit" disabled={loading} className="h-11 px-6 rounded-xl">
                    {loading ? <Loader2 className="size-4 animate-spin" /> : "Search"}
                  </Button>
                </form>
              )}
            </DrawerHeader>

          <div className="flex-1 overflow-y-auto p-6 space-y-8 min-h-[40vh]">
            <AnimatePresence mode="wait">
              {view === "search" ? (
                <motion.div
                  key="search-view"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-8"
                >
                  {loading ? (
                    <div className="flex flex-col items-center justify-center h-64 gap-4">
                      <Loader2 className="size-10 animate-spin text-primary" />
                      <p className="text-muted-foreground animate-pulse">Scanning Instagram for @{query.replace("@", "")}...</p>
                    </div>
                  ) : error ? (
                    <div className="flex flex-col items-center justify-center h-64 gap-4 text-center p-8 bg-rose-500/5 rounded-3xl border border-rose-500/20 animate-in fade-in zoom-in-95">
                      <AlertCircle className="size-12 text-rose-500" />
                      <div className="space-y-1">
                        <p className="font-bold text-rose-500">Account Not Found</p>
                        <p className="text-sm text-muted-foreground max-w-xs mx-auto">{error}</p>
                        <p className="text-xs text-muted-foreground mt-2">Try searching with the exact username (case-insensitive)</p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="rounded-xl" onClick={() => setQuery("")}>
                          Try Another Search
                        </Button>
                        <Button variant="outline" size="sm" className="rounded-xl border-rose-500/20 text-rose-500" onClick={() => window.location.href = '/dashboard/settings'}>
                          Go to Settings
                        </Button>
                      </div>
                    </div>
                  ) : result ? (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                      {/* Profile Header */}
                      <div className="flex flex-col sm:flex-row items-center gap-6 glass-card p-6 rounded-3xl border border-border">
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
                            {result.media.data.map((post: IGMedia, index: number) => {
                              const mediaSrc = post.media_url || post.thumbnail_url;
                              return (
                                <div
                                  key={post.id}
                                  className="group relative aspect-square rounded-2xl overflow-hidden glass-card border border-border hover:shadow-2xl transition-all duration-300 cursor-pointer"
                                  onClick={() => openMediaViewer(post, index)}
                                >
                                  {post.media_type === "CAROUSEL_ALBUM" && post.children ? (
                                    <div className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar h-full">
                                      {post.children.data.map((child) => (
                                        <div key={child.id} className="snap-center shrink-0 w-full h-full relative">
                                          <Image unoptimized src={child.media_url} alt="carousel" fill className="object-cover" />
                                        </div>
                                      ))}
                                    </div>
                                  ) : mediaSrc ? (
                                    <Image unoptimized src={mediaSrc} alt="post" fill className="object-cover transition-transform duration-500 group-hover:scale-110" />
                                  ) : (
                                    <div className="size-full bg-muted flex items-center justify-center"><ImageIcon className="size-8 opacity-20" /></div>
                                  )}
                                  <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3 gap-2">
                                    <div className="flex items-center gap-3 text-foreground text-xs font-bold">
                                      <span className="flex items-center gap-1"><Heart className="size-3 fill-current text-rose-500" /> {post.like_count || 0}</span>
                                      <span className="flex items-center gap-1"><MessageCircle className="size-3 fill-current text-primary" /> {post.comments_count || 0}</span>
                                    </div>
                                    <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                                      {mediaSrc && (
                                        <Button size="icon" variant="secondary" className="size-8 rounded-lg bg-background/80 backdrop-blur" onClick={() => downloadMedia(mediaSrc)}>
                                          <Download className="size-4" />
                                        </Button>
                                      )}
                                      <a href={post.permalink} target="_blank" rel="noopener noreferrer" className="size-8 rounded-lg bg-background/80 backdrop-blur flex items-center justify-center border border-border hover:bg-primary hover:text-primary-foreground transition-colors">
                                        <ExternalLink className="size-4" />
                                      </a>
                                    </div>
                                  </div>
                                  {post.media_type === "VIDEO" && (
                                    <div className="absolute top-2 right-2 size-6 bg-background/60 backdrop-blur rounded-full flex items-center justify-center shadow-lg">
                                      <div className="size-0 border-t-[4px] border-t-transparent border-l-[6px] border-l-foreground border-b-[4px] border-b-transparent ml-0.5" />
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="text-center py-12 glass-card rounded-3xl border border-dashed border-border">
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
                </motion.div>
              ) : (
                <motion.div
                  key="viewer-view"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="h-full flex flex-col"
                >
                  {selectedMedia && (
                    <div className="flex flex-col h-full">
                      {/* Media Viewport */}
                      <div className="flex-1 relative flex items-center justify-center bg-black/5 rounded-3xl overflow-hidden border border-border">
                        {result?.media?.data && result.media.data.length > 1 ? (
                          <>
                            <Button
                              variant="secondary"
                              size="icon"
                              className="absolute left-4 z-10 size-10 rounded-full bg-background/60 backdrop-blur hover:bg-background/80"
                              onClick={() => navigateMedia("prev")}
                              disabled={currentMediaIndex === 0}
                            >
                              <ChevronLeft className="size-6" />
                            </Button>
                            <Button
                              variant="secondary"
                              size="icon"
                              className="absolute right-4 z-10 size-10 rounded-full bg-background/60 backdrop-blur hover:bg-background/80"
                              onClick={() => navigateMedia("next")}
                              disabled={currentMediaIndex === (result.media?.data?.length ?? 0) - 1}
                            >
                              <ChevronRight className="size-6" />
                            </Button>
                          </>
                        ) : null}
                        
                        {selectedMedia?.media_type === "VIDEO" ? (
                          selectedMedia?.media_url ? (
                            <video
                              src={selectedMedia.media_url}
                              controls
                              autoPlay
                              className="max-w-full max-h-full object-contain"
                              poster={selectedMedia.thumbnail_url || undefined}
                            />
                          ) : (
                            <div className="flex flex-col items-center gap-4">
                              <Play className="size-16 text-primary/50" />
                              <p className="text-muted-foreground font-medium">Video preview not available</p>
                            </div>
                          )
                        ) : (
                          <div className="relative w-full h-full">
                             <Image
                               src={selectedMedia?.media_url || selectedMedia?.thumbnail_url || ""}
                               alt=""
                               fill
                               className="object-contain"
                               unoptimized
                             />
                          </div>
                        )}
                      </div>

                      {/* Info Panel */}
                      <div className="mt-6 space-y-4 px-2 pb-8">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                             <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/20 text-sm font-bold">
                               <Heart className="size-4 fill-current" /> {selectedMedia?.like_count?.toLocaleString() || 0}
                             </div>
                             <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-sm font-bold">
                               <MessageCircle className="size-4 fill-current" /> {selectedMedia?.comments_count?.toLocaleString() || 0}
                             </div>
                          </div>
                          
                          <div className="flex gap-2">
                             {selectedMedia?.media_url && (
                               <Button variant="outline" size="sm" className="rounded-xl" onClick={() => downloadMedia(selectedMedia.media_url!)}>
                                 <Download className="size-4 mr-2" />
                                 Download
                               </Button>
                             )}
                             <a href={selectedMedia.permalink} target="_blank" rel="noopener noreferrer">
                               <Button variant="outline" size="sm" className="rounded-xl">
                                 <ExternalLink className="size-4 mr-2" />
                                 Instagram
                               </Button>
                             </a>
                          </div>
                        </div>

                        {selectedMedia?.caption && (
                          <div className="glass-card p-4 rounded-2xl border border-border">
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{selectedMedia.caption}</p>
                          </div>
                        )}
                        
                        {result?.media?.data && (
                           <div className="flex justify-center">
                              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                                Item {currentMediaIndex + 1} of {result.media.data.length}
                              </p>
                           </div>
                        )}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <DrawerFooter className="shrink-0 border-t">
            <DrawerClose asChild>
              <Button variant="outline" className="rounded-xl">Close</Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
    </>
  );
}
