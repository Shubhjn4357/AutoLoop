"use client";

import * as React from "react";
import { Search, Loader2, User, ImageIcon, Download, ExternalLink, Heart, MessageCircle, AlertCircle, X, ChevronLeft, ChevronRight, Play } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger, DrawerClose, DrawerFooter } from "@/components/ui/drawer";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AnimatedButton } from "@/components/ui/animated-button";
import type { IGMedia, IGUserProfile } from "@/lib/instagram/graph";
import { useDashboardContext } from "./dashboard-context";

export function GlobalSearch() {
  const { isSearchOpen: open, setIsSearchOpen: setOpen } = useDashboardContext();
  const [query, setQuery] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<(IGUserProfile & { media?: { data: IGMedia[] } }) | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [selectedMedia, setSelectedMedia] = React.useState<IGMedia | null>(null);
  const [currentMediaIndex, setCurrentMediaIndex] = React.useState(0);
  const [isViewerOpen, setIsViewerOpen] = React.useState(false);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanUsername = query.replace("@", "").trim().toLowerCase();
    if (!cleanUsername) return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/instagram/search?username=${cleanUsername}`);
      const data = await res.json();
      
      if (!res.ok) {
        if (data.error?.includes("#10") || data.error?.includes("permission")) {
          throw new Error("Meta Permission Error: Reconnect your account in Settings and ensure 'Business Discovery' is checked.");
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
    setIsViewerOpen(true);
  };

  const closeMediaViewer = () => {
    setIsViewerOpen(false);
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
            <DrawerTitle className="flex items-center gap-2">
              <Search className="size-5 text-primary" />
              Instagram Business Discovery
            </DrawerTitle>
            <form onSubmit={handleSearch} className="mt-4 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="Enter username (e.g. @zuck)"
                  className="pl-10 h-11 rounded-xl bg-muted/50 border-border"
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
          </div>

          <DrawerFooter className="shrink-0 border-t">
            <DrawerClose asChild>
              <Button variant="outline" className="rounded-xl">Close</Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>

      {/* Media Viewer Modal */}
      <Dialog open={isViewerOpen} onOpenChange={setIsViewerOpen}>
        <DialogContent className="max-w-5xl w-[95vw] h-[90vh] p-0 overflow-hidden bg-background/95 backdrop-blur-xl">
          <DialogTitle className="sr-only">Media Viewer</DialogTitle>
          {selectedMedia && (
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-border/50">
                <div className="flex items-center gap-3">
                  {result?.profile_picture_url ? (
                    <Image src={result.profile_picture_url} alt="" width={32} height={32} className="rounded-full" unoptimized />
                  ) : null}
                  <div>
                    <p className="font-semibold text-sm">@{result?.username}</p>
                    <p className="text-xs text-muted-foreground">{selectedMedia?.media_type === "VIDEO" ? "Video" : selectedMedia?.media_type === "CAROUSEL_ALBUM" ? "Carousel" : "Photo"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" className="gap-2" onClick={() => selectedMedia?.media_url && downloadMedia(selectedMedia.media_url)}>
                    <Download className="size-4" />
                    Download
                  </Button>
                  <Button variant="ghost" size="icon" onClick={closeMediaViewer}>
                    <X className="size-5" />
                  </Button>
                </div>
              </div>

              {/* Media */}
              <div className="flex-1 relative flex items-center justify-center bg-black/50">
                {result?.media?.data && result.media.data.length > 1 ? (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute left-4 z-10 bg-background/20 hover:bg-background/40 text-white"
                      onClick={() => navigateMedia("prev")}
                      disabled={currentMediaIndex === 0}
                    >
                      <ChevronLeft className="size-6" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-4 z-10 bg-background/20 hover:bg-background/40 text-white"
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
                      className="max-w-full max-h-full"
                      poster={selectedMedia.thumbnail_url || undefined}
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-4">
                      <Play className="size-16 text-white/50" />
                      <p className="text-white/70">Video preview not available</p>
                    </div>
                  )
                ) : (
                  <Image
                    src={selectedMedia?.media_url || selectedMedia?.thumbnail_url || ""}
                    alt=""
                    fill
                    className="object-contain"
                    unoptimized
                  />
                )}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-border/50">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1 text-sm"><Heart className="size-4 fill-rose-500 text-rose-500" /> {selectedMedia?.like_count || 0}</span>
                  <span className="flex items-center gap-1 text-sm"><MessageCircle className="size-4" /> {selectedMedia?.comments_count || 0}</span>
                  {result?.media?.data ? (
                    <span className="text-xs text-muted-foreground ml-auto">
                      {currentMediaIndex + 1} / {result.media.data.length}
                    </span>
                  ) : null}
                </div>
                {selectedMedia?.caption ? (
                  <p className="text-sm mt-3 line-clamp-3">{selectedMedia.caption}</p>
                ) : null}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
