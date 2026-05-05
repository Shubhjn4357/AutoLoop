"use client";

import React, { useState, useTransition } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart, MessageCircle, ExternalLink, Plus, Upload,
  Loader2, ImageIcon, ArrowLeft, Calendar, Link2,
  Download, BookOpen
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AnimatedButton } from "@/components/ui/animated-button";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger, DrawerClose, DrawerFooter } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { IGMedia } from "@/lib/instagram/graph";
import type { automations as AutoType } from "@/lib/db/schema";

type Automation = typeof AutoType.$inferSelect;

interface Props {
  igUserId: string;
  accessToken: string;
  automations: Automation[];
  initialMedia: IGMedia[];
}

export function ContentDashboardClient({ automations, initialMedia }: Props) {
  const [media, setMedia] = useState<IGMedia[]>(initialMedia);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [view, setView] = useState<"grid" | "detail" | "create">("grid");
  const [selectedPost, setSelectedPost] = useState<IGMedia | null>(null);
  const [mediaFilter, setMediaFilter] = useState<"ALL" | "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM" | "REELS">("ALL");
  const [selectedAutomation, setSelectedAutomation] = useState("");
  const [caption, setCaption] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isPending, startTransition] = useTransition();

  function refreshMedia() {
    setLoadingMedia(true);
    fetch("/api/instagram/media")
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d.data)) setMedia(d.data); })
      .catch(() => toast.error("Failed to refresh posts"))
      .finally(() => setLoadingMedia(false));
  }

  function openPost(post: IGMedia) {
    setSelectedPost(post);
    setView("detail");
  }

  async function handlePublish() {
    if (!imageUrl) { toast.error("Enter a public image URL"); return; }
    startTransition(async () => {
      try {
        const res = await fetch("/api/instagram/publish", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageUrl, caption }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed");
        toast.success(`Published! Post ID: ${data.postId}`);
        setCaption(""); setImageUrl(""); setView("grid");
        setTimeout(refreshMedia, 2000);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Error publishing");
      }
    });
  }

  const filteredMedia = mediaFilter === "ALL" ? media : media.filter((m) => m.media_type === mediaFilter);

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex gap-1 bg-muted/30 rounded-xl p-1 text-xs font-medium">
          {(["ALL", "IMAGE", "VIDEO", "REELS"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setMediaFilter(f as typeof mediaFilter)}
              className={cn("px-3 py-1.5 rounded-lg transition-all", mediaFilter === f ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}
            >
              {f === "ALL" ? "All" : f === "IMAGE" ? "Posts" : f === "VIDEO" ? "Videos" : "Reels"}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <AnimatedButton variant="outline" disableGlow size="sm" className="rounded-full" onClick={refreshMedia} disabled={loadingMedia}>
            {loadingMedia ? <Loader2 className="size-4 animate-spin mr-1" /> : <Download className="size-4 mr-1" />}
            Refresh
          </AnimatedButton>
          <AnimatedButton size="sm" className="rounded-full px-5" onClick={() => setView("create")}>
            <Plus className="size-4 mr-1" /> New Post
          </AnimatedButton>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* GRID VIEW */}
        {view === "grid" && (
          <motion.div key="grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {filteredMedia.length === 0 ? (
              <div className="glass-card rounded-3xl p-16 text-center text-muted-foreground">
                <ImageIcon className="size-12 mx-auto mb-4 opacity-30" />
                <p>No posts found on this account.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {filteredMedia.map((post) => (
                  <motion.button
                    key={post.id}
                    type="button"
                    onClick={() => openPost(post)}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="group relative aspect-square rounded-2xl overflow-hidden glass-card border border-white/10 cursor-pointer"
                  >
                    {(post.media_url || post.thumbnail_url) ? (
                      <Image
                        src={post.media_url ?? post.thumbnail_url!}
                        alt={post.caption?.substring(0, 30) ?? "post"}
                        fill unoptimized
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-muted">
                        <BookOpen className="size-8 text-muted-foreground" />
                      </div>
                    )}
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-2">
                      <div className="flex items-center gap-2 text-white text-xs font-medium">
                        <span className="flex items-center gap-1"><Heart className="size-3" /> {post.like_count ?? 0}</span>
                        <span className="flex items-center gap-1"><MessageCircle className="size-3" /> {post.comments_count ?? 0}</span>
                      </div>
                    </div>
                    {/* Type badge */}
                    <div className="absolute top-1.5 left-1.5 text-[9px] text-white font-bold bg-black/50 rounded px-1.5 py-0.5 backdrop-blur">
                      {post.media_type === "CAROUSEL_ALBUM" ? "ALBUM" : post.media_type}
                    </div>
                  </motion.button>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* DETAIL VIEW */}
        {view === "detail" && selectedPost && (
          <motion.div key="detail" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
            <button type="button" onClick={() => setView("grid")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
              <ArrowLeft className="size-4" /> Back to grid
            </button>
            <div className="grid md:grid-cols-[1fr_340px] gap-6">
              {/* Post image */}
              <div className="relative aspect-square rounded-3xl overflow-hidden glass-card border border-white/10">
                {(selectedPost.media_url || selectedPost.thumbnail_url) && (
                  <Image
                    src={selectedPost.media_url ?? selectedPost.thumbnail_url!}
                    alt="post"
                    fill unoptimized
                    className="object-cover"
                  />
                )}
              </div>
              {/* Post meta + automation binding */}
              <div className="space-y-4">
                <Card className="glass-card">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Post Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="flex gap-6">
                      <span className="flex items-center gap-1.5 text-muted-foreground"><Heart className="size-4" /> {selectedPost.like_count ?? 0} likes</span>
                      <span className="flex items-center gap-1.5 text-muted-foreground"><MessageCircle className="size-4" /> {selectedPost.comments_count ?? 0} comments</span>
                    </div>
                    {selectedPost.timestamp && (
                      <p className="text-muted-foreground flex items-center gap-1.5">
                        <Calendar className="size-4" />
                        {format(new Date(selectedPost.timestamp), "MMM d, yyyy")}
                      </p>
                    )}
                    {selectedPost.caption && (
                      <p className="text-foreground/80 text-xs line-clamp-4">{selectedPost.caption}</p>
                    )}
                    {selectedPost.permalink && (
                      <a href={selectedPost.permalink} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1.5 text-xs">
                        <ExternalLink className="size-3.5" /> View on Instagram
                      </a>
                    )}
                  </CardContent>
                </Card>

                <Card className="glass-card">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Link2 className="size-4 text-emerald-500" /> Bind Automation
                    </CardTitle>
                    <CardDescription className="text-xs">Attach an automation rule to this specific post.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Drawer>
                      <DrawerTrigger asChild>
                        <Button variant="outline" className="w-full justify-between text-sm">
                          {selectedAutomation ? automations.find((a) => a.id === selectedAutomation)?.name ?? "Select" : "Select a rule"}
                        </Button>
                      </DrawerTrigger>
                      <DrawerContent>
                        <div className="mx-auto w-full max-w-sm">
                          <DrawerHeader><DrawerTitle>Choose Rule</DrawerTitle></DrawerHeader>
                          <div className="p-4 space-y-2">
                            <DrawerClose asChild>
                              <Button variant={selectedAutomation === "" ? "default" : "outline"} className="w-full justify-start" onClick={() => setSelectedAutomation("")}>
                                None
                              </Button>
                            </DrawerClose>
                            {automations.map((a) => (
                              <DrawerClose asChild key={a.id}>
                                <Button variant={selectedAutomation === a.id ? "default" : "outline"} className="w-full justify-start" onClick={() => setSelectedAutomation(a.id)}>
                                  <Link2 className="size-4 mr-2 text-emerald-500" /> {a.name}
                                </Button>
                              </DrawerClose>
                            ))}
                            {automations.length === 0 && <p className="text-sm text-center text-muted-foreground py-4">No automations yet. Create one first.</p>}
                          </div>
                          <DrawerFooter>
                            <DrawerClose asChild><Button variant="outline">Cancel</Button></DrawerClose>
                          </DrawerFooter>
                        </div>
                      </DrawerContent>
                    </Drawer>
                    <p className="text-xs text-muted-foreground">When bound, comments matching the rule&apos;s keyword will trigger the automation for this post.</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </motion.div>
        )}

        {/* CREATE VIEW */}
        {view === "create" && (
          <motion.div key="create" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
            <button type="button" onClick={() => setView("grid")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
              <ArrowLeft className="size-4" /> Back to grid
            </button>
            <div className="grid md:grid-cols-[1fr_340px] gap-6">
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle>Publish New Post</CardTitle>
                  <CardDescription>Publish a photo to Instagram via Graph API.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  {/* Preview */}
                  {imageUrl && (
                    <div className="relative aspect-square rounded-2xl overflow-hidden border border-white/10">
                      <Image src={imageUrl} alt="preview" fill unoptimized className="object-cover" onError={() => {}} />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="imageUrl">Image URL (public HTTPS)</Label>
                    <Input
                      id="imageUrl"
                      placeholder="https://example.com/photo.jpg"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="caption">Caption</Label>
                    <Textarea
                      id="caption"
                      placeholder="Write your caption…"
                      value={caption}
                      onChange={(e) => setCaption(e.target.value)}
                      className="min-h-[120px] resize-none"
                    />
                  </div>

                  <AnimatedButton className="w-full rounded-full" onClick={handlePublish} disabled={isPending}>
                    {isPending ? <Loader2 className="size-4 animate-spin mr-2" /> : <Upload className="size-4 mr-2" />}
                    {isPending ? "Publishing…" : "Publish to Instagram"}
                  </AnimatedButton>
                </CardContent>
              </Card>

              <div className="space-y-4">
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Link2 className="size-4 text-emerald-500" /> Attach Automation
                    </CardTitle>
                    <CardDescription className="text-xs">Bind a rule before publishing.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Drawer>
                      <DrawerTrigger asChild>
                        <Button variant="outline" className="w-full justify-between text-sm">
                          {selectedAutomation ? automations.find((a) => a.id === selectedAutomation)?.name ?? "Select" : "Select a rule"}
                        </Button>
                      </DrawerTrigger>
                      <DrawerContent>
                        <div className="mx-auto w-full max-w-sm">
                          <DrawerHeader><DrawerTitle>Choose Rule</DrawerTitle></DrawerHeader>
                          <div className="p-4 space-y-2">
                            <DrawerClose asChild>
                              <Button variant="outline" className="w-full justify-start" onClick={() => setSelectedAutomation("")}>None</Button>
                            </DrawerClose>
                            {automations.map((a) => (
                              <DrawerClose asChild key={a.id}>
                                <Button variant={selectedAutomation === a.id ? "default" : "outline"} className="w-full justify-start" onClick={() => setSelectedAutomation(a.id)}>
                                  {a.name}
                                </Button>
                              </DrawerClose>
                            ))}
                          </div>
                          <DrawerFooter>
                            <DrawerClose asChild><Button variant="outline">Cancel</Button></DrawerClose>
                          </DrawerFooter>
                        </div>
                      </DrawerContent>
                    </Drawer>
                  </CardContent>
                </Card>
                <Card className="glass-card p-4">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    <span className="font-semibold text-foreground block mb-1">How it works</span>
                    1. Enter a public image URL.<br />
                    2. Write your caption (optionally include a CTA keyword like &quot;Comment PRICE&quot;).<br />
                    3. Optionally bind an automation rule — anyone commenting that keyword will get an auto-DM.<br />
                    4. Hit Publish.
                  </p>
                </Card>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
