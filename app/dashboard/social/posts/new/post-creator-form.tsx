"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
// If DatePicker doesn't exist, we'll use input type="datetime-local" for MVP.

interface ConnectedAccount {
    id: string;
    name: string | null;
    provider: string;
    providerAccountId: string;
}

interface PostCreatorFormProps {
    accounts: ConnectedAccount[];
}

export function PostCreatorForm({ accounts }: PostCreatorFormProps) {
    const router = useRouter();
    const [submitting, setSubmitting] = useState(false);
    const [selectedAccount, setSelectedAccount] = useState("");
    const [content, setContent] = useState("");
    const [imageUrl, setImageUrl] = useState("");

    const handleSubmit = async () => {
        if (!selectedAccount) {
            toast.error("Please select an account");
            return;
        }
        if (!content && !imageUrl) {
            toast.error("Please add text or an image");
            return;
        }

        const account = accounts.find(a => a.id === selectedAccount);
        if (!account) return;

        setSubmitting(true);
        try {
            const res = await fetch("/api/social/posts/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    connectedAccountId: selectedAccount,
                    platform: account.provider,
                    content,
                    mediaUrls: imageUrl ? [imageUrl] : []
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            toast.success("Post published successfully!");
            router.push("/dashboard/social");
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : String(error);
            toast.error(msg || "Failed to publish");
        } finally {
            setSubmitting(false);
        }
    };

    if (accounts.length === 0) {
        return (
            <Card>
                <CardContent className="pt-6 text-center space-y-4">
                    <p>You haven&apos;t connected any social accounts yet.</p>
                    <Button asChild>
                        <Link href="/dashboard/social">Connect Account</Link>
                    </Button>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="max-w-2xl mx-auto p-6 space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/dashboard/social"><ArrowLeft className="h-4 w-4" /></Link>
                </Button>
                <h1 className="text-2xl font-bold">Create New Post</h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Post Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>Select Account</Label>
                        <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                            <SelectTrigger>
                                <SelectValue placeholder="Choose an account..." />
                            </SelectTrigger>
                            <SelectContent>
                                {accounts.map((acc) => (
                                    <SelectItem key={acc.id} value={acc.id}>
                                        {acc.name || acc.providerAccountId} ({acc.provider})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Caption</Label>
                        <Textarea
                            placeholder="What's on your mind?"
                            className="min-h-[100px]"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Image URL (Optional)</Label>
                        <Input
                            placeholder="https://..."
                            value={imageUrl}
                            onChange={(e) => setImageUrl(e.target.value)}
                        />
                        {imageUrl && (
                            <div className="relative w-full h-48 mt-2 rounded border overflow-hidden">
                                <Image src={imageUrl} alt="Preview" fill className="object-cover" unoptimized />
                            </div>
                        )}
                        <p className="text-xs text-muted-foreground">Direct link to image (JPG/PNG)</p>
                    </div>

                    <Button onClick={handleSubmit} className="w-full" disabled={submitting}>
                        {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Publish Now
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
