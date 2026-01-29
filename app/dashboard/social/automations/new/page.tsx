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

// Mock accounts for now or implement fetching
// We'll reuse the pattern: UI Client Component + Server Action later
// For MVP speed, let's hardcode account selection or make it "All Accounts"

export default function NewAutomationPage() {
    const router = useRouter();
    const [submitting, setSubmitting] = useState(false);

    // Form State
    const [name, setName] = useState("");
    const [triggerType, setTriggerType] = useState("comment_keyword");
    const [keywords, setKeywords] = useState("");
    const [actionType, setActionType] = useState("reply_comment");
    const [responseTemplate, setResponseTemplate] = useState("");

    const handleSubmit = async () => {
        if (!name || !responseTemplate) {
            toast.error("Please fill required fields");
            return;
        }

        setSubmitting(true);
        try {
            // Need an API endpoint to save this
            // We'll create app/api/social/automations/create/route.ts next
            const res = await fetch("/api/social/automations/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name,
                    triggerType,
                    keywords: keywords.split(",").map(k => k.trim()).filter(k => k),
                    actionType,
                    responseTemplate
                })
            });

            const data = await res.json(); // Fixed: parse response
            if (!res.ok) throw new Error(data.error);

            toast.success("Rule created successfully!");
            router.push("/dashboard/social/automations");
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : String(error);
            toast.error(msg || "Failed to create rule");
        } finally {
            setSubmitting(false); // Fixed: ensure loader stops
        }
    };

    return (
        <div className="max-w-2xl mx-auto p-6 space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/dashboard/social/automations"><ArrowLeft className="h-4 w-4" /></Link>
                </Button>
                <h1 className="text-2xl font-bold">Create Automation Rule</h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Rule Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>Rule Name</Label>
                        <Input
                            placeholder="e.g. Pricing Auto-Reply"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Trigger</Label>
                            <Select value={triggerType} onValueChange={setTriggerType}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="comment_keyword">Comment Keyword</SelectItem>
                                    <SelectItem value="dm_keyword">DM Keyword</SelectItem>
                                    <SelectItem value="any_comment">Any Comment</SelectItem>
                                    <SelectItem value="whatsapp_keyword">WhatsApp Message</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Action</Label>
                            <Select value={actionType} onValueChange={setActionType}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="reply_comment">Reply to Comment</SelectItem>
                                    <SelectItem value="send_dm">Send Private Message</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {(triggerType === "comment_keyword" || triggerType === "dm_keyword") && (
                        <div className="space-y-2">
                            <Label>Keywords (comma separated)</Label>
                            <Input
                                placeholder="price, cost, how much"
                                value={keywords}
                                onChange={(e) => setKeywords(e.target.value)}
                            />
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label>Response Message</Label>
                        <Textarea
                            placeholder="Hi there! Our pricing starts at..."
                            className="min-h-[100px]"
                            value={responseTemplate}
                            onChange={(e) => setResponseTemplate(e.target.value)}
                        />
                    </div>

                    <Button onClick={handleSubmit} className="w-full" disabled={submitting}>
                        {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Create Rule
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
