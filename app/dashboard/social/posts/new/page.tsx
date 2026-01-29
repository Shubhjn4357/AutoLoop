"use client";

import { useState, useEffect } from "react";
import { ConnectedAccount } from "@/types";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Wand2, Upload, X, AlertCircle, Linkedin, ChevronLeft, Calendar as CalendarIcon, Plus, Check, ChevronsUpDown } from "lucide-react";
import { SiFacebook, SiYoutube } from "@icons-pack/react-simple-icons";
import { useApi } from "@/hooks/use-api";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import Image from "next/image";

export default function CreatePostPage() {
    const router = useRouter();
    const { get, post } = useApi();

    // State
    const [connectedAccounts, setConnectedAccounts] = useState<ConnectedAccount[]>([]);
    const [loadingAccounts, setLoadingAccounts] = useState(true);
    const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);

    // Post Data
    const [content, setContent] = useState("");
    const [title, setTitle] = useState("");

    // Dynamic Fields
    const [tags, setTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState("");

    interface Playlist {
        id: string;
        title: string;
    }
    const [playlists, setPlaylists] = useState<Playlist[]>([]);
    const [playlist, setPlaylist] = useState(""); // Stores ID
    const [playlistOpen, setPlaylistOpen] = useState(false);
    const [loadingPlaylists, setLoadingPlaylists] = useState(false);
    const [playlistSearch, setPlaylistSearch] = useState(""); // For create

    // YouTube specific
    const [category, setCategory] = useState("");

    const [mediaFile, setMediaFile] = useState<File | null>(null);
    const [mediaPreview, setMediaPreview] = useState<string | null>(null);

    const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
    const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);

    const [scheduledDate, setScheduledDate] = useState<Date | undefined>(undefined);

    const [captionLoading, setCaptionLoading] = useState(false);
    const [tagsLoading, setTagsLoading] = useState(false);
    const [uploading, setUploading] = useState(false);

    // Fetch accounts
    useEffect(() => {
        setLoadingAccounts(true);
        get("/api/settings").then((data: unknown) => {
            const typedData = data as { connectedAccounts: ConnectedAccount[] } | null;
            if (typedData?.connectedAccounts) {
                setConnectedAccounts(typedData.connectedAccounts);
                // If YouTube is connected, fetch playlists
                if (typedData.connectedAccounts.some(acc => acc.provider === 'youtube')) {
                    fetchPlaylists();
                }
            }
        }).finally(() => {
            setLoadingAccounts(false);
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [get]);

    const fetchPlaylists = async () => {
        setLoadingPlaylists(true);
        try {
            const res = await get("/api/social/youtube/playlists");
            const data = res as { playlists: Playlist[] };
            if (data.playlists) {
                setPlaylists(data.playlists);
            }
        } catch (error) {
            console.error("Failed to fetch playlists", error);
        } finally {
            setLoadingPlaylists(false);
        }
    };

    const handleCreatePlaylist = async (name: string) => {
        setLoadingPlaylists(true);
        try {
            const res = await post("/api/social/youtube/playlists", { title: name });
            const data = res as { playlist: Playlist };
            if (data.playlist) {
                const newPlaylist = data.playlist;
                setPlaylists([...playlists, newPlaylist]);
                setPlaylist(newPlaylist.id);
                toast.success(`Created playlist: ${newPlaylist.title}`);
                setPlaylistOpen(false);
                setPlaylistSearch("");
            }
        } catch (error) {
            console.error("Failed to create playlist", error);
            toast.error("Failed to create playlist");
        } finally {
            setLoadingPlaylists(false);
        }
    };

    // Handle File Selection
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'media' | 'thumbnail') => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                if (type === 'media') {
                    setMediaFile(file);
                    setMediaPreview(reader.result as string);
                } else {
                    setThumbnailFile(file);
                    setThumbnailPreview(reader.result as string);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    // Handle AI Generation
    const handleGenerateAI = async () => {
        if (!content && !mediaFile && !title) {
            toast.error("Please provide some context or topic for AI generation");
            return;
        }

        setCaptionLoading(true);
        try {
            const res = await fetch("/api/ai/generate-content", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    prompt: `${title ? `Title: ${title}. ` : ''}${content}` || "A generic engaging post",
                    type: "caption",
                    context: "Social Media Marketing"
                })
            });
            const data = await res.json();
            if (data.content) {
                setContent(data.content.trim());
                toast.success("AI Caption Generated!");
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to generate content");
        } finally {
            setCaptionLoading(false);
        }
    };

    // Handle Tags
    const handleAddTag = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            const val = tagInput.trim();
            if (val && !tags.includes(val)) {
                setTags([...tags, val]);
                setTagInput("");
            }
        }
    };
    const removeTag = (tag: string) => {
        setTags(tags.filter(t => t !== tag));
    };

    // Submit Post
    const handleSubmit = async () => {
        if (selectedPlatforms.length === 0) {
            toast.error("Please select at least one platform");
            return;
        }
        if (!content && !mediaFile && !title) {
            toast.error("Please add content, title or media");
            return;
        }

        setUploading(true);
        try {
            let mediaUrl = null;
            let thumbnailUrl = null;

            // 1. Upload Media
            if (mediaFile) {
                const formData = new FormData();
                formData.append("file", mediaFile);
                const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
                if (!uploadRes.ok) throw new Error("Upload failed");
                const uploadData = await uploadRes.json();
                mediaUrl = uploadData.url;
            }

            // 2. Upload Thumbnail
            if (thumbnailFile) {
                const formData = new FormData();
                formData.append("file", thumbnailFile);
                const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
                if (!uploadRes.ok) throw new Error("Thumbnail upload failed");
                const uploadData = await uploadRes.json();
                thumbnailUrl = uploadData.url;
            }

            // 3. Create Post
            const result = await post("/api/social/posts", {
                content,
                title,
                mediaUrl,
                thumbnailUrl,
                tags,
                category,
                playlist,
                scheduledAt: scheduledDate?.toISOString(),
                platforms: selectedPlatforms
            }) as { success?: boolean; error?: string };

            if (result.success) {
                toast.success(scheduledDate ? "Post scheduled successfully!" : "Post submitted successfully!");
                router.push("/dashboard/social");
            } else {
                toast.error(result.error || "Post creation failed");
            }

        } catch (error) {
            console.error(error);
            toast.error("Something went wrong");
        } finally {
            setUploading(false);
        }
    };

    const togglePlatform = (id: string) => {
        setSelectedPlatforms(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
    };

    return (
        <div className="flex flex-col gap-6 p-6 max-w-5xl mx-auto relative">
            {/* Blocking Overlay */}
            {uploading && (
                <div className="absolute inset-0 z-50 bg-background/50 backdrop-blur-sm flex items-center justify-center rounded-lg">
                    <div className="flex flex-col items-center gap-4 bg-background p-8 rounded-lg shadow-lg border animate-in fade-in zoom-in duration-300">
                        <Loader2 className="h-12 w-12 animate-spin text-primary" />
                        <div className="text-center space-y-1">
                            <h3 className="font-semibold text-lg">{scheduledDate ? "Scheduling Post" : "Publishing Post"}</h3>
                            <p className="text-muted-foreground text-sm">Uploading media and processing...</p>
                        </div>
                    </div>
                </div>
            )}

            <div>
                <Button variant="ghost" className="mb-4 pl-0 hover:bg-transparent hover:text-primary" asChild>
                    <Link href="/dashboard/social">
                        <ChevronLeft className="mr-2 h-4 w-4" />
                        Back to Dashboard
                    </Link>
                </Button>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Create New Post</h1>
                        <p className="text-muted-foreground">Compose and publish content to your social networks.</p>
                    </div>
                    {/* Schedule Toggle/Indicator could go here */}
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-[2fr_1fr]">
                <div className="space-y-6">
                    {/* Main Content Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Post Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Title (Required for YouTube / Articles)</Label>
                                <Input
                                    placeholder="Enter a catchy title..."
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    disabled={uploading}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Post Content</Label>
                                <div className="relative">
                                    <Textarea
                                        placeholder="What's on your mind? (Use AI to help you write)"
                                        className={`min-h-[150px] pr-24 resize-none transition-all ${captionLoading ? "opacity-50" : ""}`}
                                        value={content}
                                        onChange={(e) => setContent(e.target.value)}
                                        disabled={captionLoading || uploading}
                                    />
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="absolute bottom-2 right-2 text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                                        onClick={handleGenerateAI}
                                        disabled={captionLoading || uploading}
                                    >
                                        <Wand2 className={`h-4 w-4 mr-1 ${captionLoading ? "animate-spin" : ""}`} />
                                        {captionLoading ? "Generating..." : "Generate AI"}
                                    </Button>
                                </div>
                            </div>

                            {/* Tags Input */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label>Tags</Label>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-6 text-xs text-purple-600 hover:text-purple-700 hover:bg-purple-50 px-2"
                                        onClick={async () => {
                                            if (!content && !title) {
                                                toast.error("Add content or title first to generate tags");
                                                return;
                                            }
                                            setTagsLoading(true);
                                            try {
                                                const res = await fetch("/api/ai/generate-content", {
                                                    method: "POST",
                                                    headers: { "Content-Type": "application/json" },
                                                    body: JSON.stringify({
                                                        prompt: `${title} ${content}`,
                                                        type: "tags",
                                                        context: "Social Media Optimization"
                                                    })
                                                });
                                                const data = await res.json();
                                                if (data.content) {
                                                    const newTags = data.content.split(',').map((t: string) => t.trim().replace(/^#/, '')).filter(Boolean);
                                                    setTags(prev => [...new Set([...prev, ...newTags])]); // Merge unique
                                                    toast.success(`Generated ${newTags.length} tags`);
                                                }
                                            } catch (e) {
                                                console.error(e);
                                                toast.error("Failed to generate tags");
                                            } finally {
                                                setTagsLoading(false);
                                            }
                                        }}
                                        disabled={tagsLoading || uploading}
                                    >
                                        <Wand2 className={`h-3 w-3 mr-1 ${tagsLoading ? "animate-spin" : ""}`} />
                                        {tagsLoading ? "Generating..." : "Auto Tags"}
                                    </Button>
                                </div>
                                <div className="flex flex-wrap gap-2 border rounded-md p-2 bg-background focus-within:ring-1 focus-within:ring-ring">
                                    {tags.map(tag => (
                                        <span key={tag} className="flex items-center bg-secondary text-secondary-foreground text-xs px-2 py-1 rounded-full">
                                            #{tag}
                                            <button onClick={() => removeTag(tag)} className="ml-1 hover:text-destructive"><X className="h-3 w-3" /></button>
                                        </span>
                                    ))}
                                    <input
                                        className="flex-1 bg-transparent outline-none text-sm min-w-[100px]"
                                        placeholder="Type and press Enter..."
                                        value={tagInput}
                                        onChange={(e) => setTagInput(e.target.value)}
                                        onKeyDown={handleAddTag}
                                        disabled={uploading}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Media Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Media & Options</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Primary Media */}
                                <div className="space-y-2">
                                    <Label>Primary Media</Label>
                                    {mediaPreview ? (
                                        <div className="relative rounded-lg overflow-hidden border bg-muted aspect-video flex items-center justify-center group">
                                            {mediaFile?.type.startsWith('video') ? (
                                                <video src={mediaPreview} controls className="max-h-full max-w-full" />
                                            ) : (
                                                <Image
                                                    src={mediaPreview}
                                                    alt="Preview"
                                                    fill
                                                    className="object-contain"
                                                    unoptimized
                                                />
                                            )}
                                            <Button
                                                variant="destructive"
                                                size="icon"
                                                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={() => { setMediaFile(null); setMediaPreview(null); }}
                                                disabled={uploading}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className={`border-2 border-dashed rounded-lg p-6 text-center relative ${uploading ? "opacity-50" : "hover:bg-muted/50 cursor-pointer"}`}>
                                            <input
                                                type="file"
                                                className="absolute inset-0 opacity-0 cursor-pointer"
                                                onChange={(e) => handleFileChange(e, 'media')}
                                                accept="image/*,video/*,video/x-matroska,video/x-flv,video/webm"
                                                disabled={uploading}
                                            />
                                            <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                                <Upload className="h-6 w-6" />
                                                <p className="text-xs font-medium">Upload Media</p>
                                                <p className="text-[10px] text-muted-foreground">MP4, MOV, FLV, MKV, PNG, JPG</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Thumbnail */}
                                <div className="space-y-2">
                                    <Label>Thumbnail (Video only)</Label>
                                    {thumbnailPreview ? (
                                        <div className="relative rounded-lg overflow-hidden border bg-muted aspect-video flex items-center justify-center group">
                                            <Image
                                                src={thumbnailPreview}
                                                alt="Thumbnail Preview"
                                                fill
                                                className="object-cover"
                                                unoptimized
                                            />
                                            <Button
                                                variant="destructive"
                                                size="icon"
                                                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={() => { setThumbnailFile(null); setThumbnailPreview(null); }}
                                                disabled={uploading}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className={`border-2 border-dashed rounded-lg p-6 text-center relative ${uploading ? "opacity-50" : "hover:bg-muted/50 cursor-pointer"}`}>
                                            <input
                                                type="file"
                                                className="absolute inset-0 opacity-0 cursor-pointer"
                                                onChange={(e) => handleFileChange(e, 'thumbnail')}
                                                accept="image/*"
                                                disabled={uploading}
                                            />
                                            <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                                <Upload className="h-6 w-6" />
                                                <p className="text-xs font-medium">Upload Thumbnail</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Additional Metadata */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Category (YouTube)</Label>
                                    <Select value={category} onValueChange={setCategory} disabled={uploading}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="22">People & Blogs</SelectItem>
                                            <SelectItem value="28">Science & Technology</SelectItem>
                                            <SelectItem value="27">Education</SelectItem>
                                            <SelectItem value="24">Entertainment</SelectItem>
                                            <SelectItem value="10">Music</SelectItem>
                                            <SelectItem value="17">Sports</SelectItem>
                                            <SelectItem value="20">Gaming</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Playlist (YouTube)</Label>
                                    <Popover open={playlistOpen} onOpenChange={setPlaylistOpen}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                aria-expanded={playlistOpen}
                                                className="w-full justify-between"
                                                disabled={uploading}
                                            >
                                                {playlist
                                                    ? playlists.find((p) => p.id === playlist)?.title
                                                    : "Select or Create Playlist..."}
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[300px] p-0">
                                            <Command>
                                                <CommandInput
                                                    placeholder="Search or create playlist..."
                                                    value={playlistSearch}
                                                    onValueChange={setPlaylistSearch}
                                                />
                                                <CommandList>
                                                    <CommandEmpty className="py-2 px-2">
                                                        <div className="flex flex-col gap-2">
                                                            <p className="text-sm text-muted-foreground">No playlist found.</p>
                                                            {playlistSearch && (
                                                                <Button
                                                                    variant="secondary"
                                                                    size="sm"
                                                                    className="w-full h-8 justify-start"
                                                                    onClick={() => handleCreatePlaylist(playlistSearch)}
                                                                    disabled={loadingPlaylists}
                                                                >
                                                                    <Plus className="h-3 w-3 mr-2" />
                                                                    Create &quot;{playlistSearch}&quot;
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </CommandEmpty>
                                                    <CommandGroup>
                                                        {playlists.map((p) => (
                                                            <CommandItem
                                                                key={p.id}
                                                                value={p.title}
                                                                onSelect={() => {
                                                                    setPlaylist(p.id === playlist ? "" : p.id);
                                                                    setPlaylistOpen(false);
                                                                }}
                                                            >
                                                                <Check
                                                                    className={cn(
                                                                        "mr-2 h-4 w-4",
                                                                        playlist === p.id ? "opacity-100" : "opacity-0"
                                                                    )}
                                                                />
                                                                {p.title}
                                                            </CommandItem>
                                                        ))}
                                                    </CommandGroup>
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    {/* Platform Selector */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Select Platforms</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {loadingAccounts ? (
                                <div className="space-y-3">
                                    <Skeleton className="h-10 w-full rounded-lg" />
                                    <Skeleton className="h-10 w-full rounded-lg" />
                                </div>
                            ) : connectedAccounts.length === 0 ? (
                                <div className="text-sm text-yellow-600 bg-yellow-50 p-3 rounded flex items-start gap-2">
                                    <AlertCircle className="h-4 w-4 mt-0.5" />
                                    <div>No accounts connected. Go to Settings to connect.</div>
                                </div>
                            ) : (
                                connectedAccounts.map(account => (
                                    <div key={account.id} className="flex items-center space-x-2 border p-3 rounded-lg hover:bg-muted/50 transition-colors">
                                        <Checkbox
                                            id={account.id}
                                            checked={selectedPlatforms.includes(account.id)}
                                            onCheckedChange={() => togglePlatform(account.id)}
                                            disabled={uploading}
                                        />
                                        <Label htmlFor={account.id} className="flex items-center gap-2 cursor-pointer flex-1">
                                            {account.provider === 'facebook' && <SiFacebook className="h-4 w-4 text-[#1877F2]" />}
                                            {account.provider === 'linkedin' && <Linkedin className="h-4 w-4 text-[#0A66C2] fill-current" />}
                                            {account.provider === 'youtube' && <SiYoutube className="h-4 w-4 text-[#FF0000]" />}
                                            <span className="truncate">{account.name || account.provider}</span>
                                        </Label>
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>

                    {/* Scheduling Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Scheduling</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col gap-2">
                                <Label>Publish Date & Time (Optional)</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant={"outline"}
                                            className={cn(
                                                "w-full justify-start text-left font-normal",
                                                !scheduledDate && "text-muted-foreground"
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {scheduledDate ? format(scheduledDate, "PPP p") : <span>Pick a date</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <Calendar
                                            mode="single"
                                            selected={scheduledDate}
                                            onSelect={setScheduledDate}
                                            initialFocus
                                        />
                                        <div className="p-3 border-t">
                                            <Input
                                                type="time"
                                                onChange={(e) => {
                                                    const date = scheduledDate || new Date();
                                                    const [hours, minutes] = e.target.value.split(':');
                                                    date.setHours(parseInt(hours), parseInt(minutes));
                                                    setScheduledDate(new Date(date));
                                                }}
                                            />
                                        </div>
                                    </PopoverContent>
                                </Popover>
                                {scheduledDate && (
                                    <Button variant="ghost" size="sm" onClick={() => setScheduledDate(undefined)} className="text-muted-foreground h-auto p-0">
                                        Clear Schedule
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Submit Button */}
                    <div className="flex flex-col gap-2">
                        <Button
                            size="lg"
                            className="w-full"
                            onClick={handleSubmit}
                            disabled={uploading || selectedPlatforms.length === 0}
                        >
                            {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {uploading ? "Processing..." : (scheduledDate ? `Schedule Post` : "Post Now")}
                        </Button>
                        <p className="text-xs text-center text-muted-foreground">
                            {scheduledDate ? "Post will be saved internally and published at the scheduled time." : "Post will be published immediately to selected platforms."}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
