
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useApi } from "@/hooks/use-api";
import { Loader2, MessageSquare, CheckCircle2, Copy, Eye, EyeOff, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";

interface WhatsAppSettingsProps {
    businessPhone?: string | null;
    isConfigured: boolean;
}

export function WhatsAppSettings({ businessPhone, isConfigured: initialConfigured }: WhatsAppSettingsProps) {
    const { patch, loading } = useApi();
    const [phoneId, setPhoneId] = useState(businessPhone || "");
    const [accessToken, setAccessToken] = useState("");
    const [verifyToken, setVerifyToken] = useState("");
    const [isConfigured, setIsConfigured] = useState(initialConfigured);
    const [showToken, setShowToken] = useState(false);

    const handleSave = async () => {
        if (!phoneId) {
            toast({
                title: "Error",
                description: "Phone Number ID is required",
                variant: "destructive"
            });
            return;
        }

        const data: any = { whatsappBusinessPhone: phoneId };
        if (accessToken) data.whatsappAccessToken = accessToken;
        if (verifyToken) data.whatsappVerifyToken = verifyToken;

        const result = await patch("/api/settings", data, {
            successMessage: "WhatsApp configuration saved successfully"
        });

        if (result) {
            setIsConfigured(true);
            setAccessToken(""); // Clear sensitive data after save
            setVerifyToken("");
        }
    };

    const copyWebhookUrl = () => {
        const url = `${window.location.origin}/api/webhooks/whatsapp`;
        navigator.clipboard.writeText(url);
        toast({ title: "Copied", description: "Webhook URL copied to clipboard" });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5 text-green-600" />
                        WhatsApp Business
                    </div>
                    <Badge variant={isConfigured ? "default" : "outline"} className={isConfigured ? "bg-green-600 hover:bg-green-700" : ""}>
                        {isConfigured ? "Configured" : "Not Setup"}
                    </Badge>
                </CardTitle>
                <CardDescription>
                    Connect your WhatsApp Business API account to send automated messages.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="wa-phone-id">Phone Number ID</Label>
                    <Input
                        id="wa-phone-id"
                        placeholder="e.g. 100609346..."
                        value={phoneId}
                        onChange={(e) => setPhoneId(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                        Found in your Meta App Dashboard under WhatsApp &gt; API Setup.
                    </p>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="wa-token">Permanent Access Token</Label>
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <Input
                                id="wa-token"
                                type={showToken ? "text" : "password"}
                                placeholder={isConfigured ? "••••••••••••••••••••••••" : "EAAG..."}
                                value={accessToken}
                                onChange={(e) => setAccessToken(e.target.value)}
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                onClick={() => setShowToken(!showToken)}
                            >
                                {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                        </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        The System User Access Token from Meta Business Settings.
                    </p>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="wa-verify">Webhook Verify Token</Label>
                    <Input
                        id="wa-verify"
                        placeholder="Your custom verify token"
                        value={verifyToken}
                        onChange={(e) => setVerifyToken(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                        Set this in Meta Dashboard when configuring the Webhook.
                    </p>
                </div>

                <div className="pt-4 pb-2">
                    <div className="rounded-md bg-muted p-3">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium">Webhook URL</span>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={copyWebhookUrl}>
                                <Copy className="h-3 w-3" />
                            </Button>
                        </div>
                        <code className="text-xs break-all block text-muted-foreground">
                            {typeof window !== 'undefined' ? `${window.location.origin}/api/webhooks/whatsapp` : '/api/webhooks/whatsapp'}
                        </code>
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
                        <ExternalLink className="h-3 w-3" />
                        Configure in <a href="https://developers.facebook.com/apps/" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">Meta App Dashboard</a>
                    </div>
                </div>

                <Button onClick={handleSave} disabled={loading} className="w-full sm:w-auto">
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Configuration
                </Button>
            </CardContent>
        </Card>
    );
}
