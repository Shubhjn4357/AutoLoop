"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, CheckCircle2, AlertTriangle, RefreshCw } from "lucide-react";
import { signIn } from "next-auth/react";

interface MailSettingsProps {
    isConnected: boolean;
    email?: string | null;
}

export function MailSettings({ isConnected, email }: MailSettingsProps) {
    const [isLoading, setIsLoading] = useState(false);

    const handleConnect = async () => {
        setIsLoading(true);
        try {
            // Force re-authorization to get new tokens
            await signIn("google", {
                callbackUrl: "/dashboard/settings",
                prompt: "consent"
            });
        } catch (error) {
            console.error(error);
            setIsLoading(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    Email Automation Settings
                </CardTitle>
                <CardDescription>
                    Connect your Gmail account to enable automated email sending.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${isConnected ? "bg-green-100 text-green-600" : "bg-amber-100 text-amber-600"}`}>
                            {isConnected ? <CheckCircle2 className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
                        </div>
                        <div>
                            <h4 className="font-medium text-sm">
                                {isConnected ? "Gmail Connected" : "Gmail Not Connected"}
                            </h4>
                            <p className="text-xs text-muted-foreground">
                                {isConnected
                                    ? `Sending emails as ${email || "your account"}`
                                    : "Connect to allow the app to send emails on your behalf"}
                            </p>
                        </div>
                    </div>
                    <Button
                        variant={isConnected ? "outline" : "default"}
                        size="sm"
                        onClick={handleConnect}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                            <Mail className="h-4 w-4 mr-2" />
                        )}
                        {isConnected ? "Reconnect / Refresh" : "Connect Gmail"}
                    </Button>
                </div>

                <div className="text-xs bg-blue-50 dark:bg-blue-900/20 p-3 rounded text-blue-800 dark:text-blue-300">
                    <strong>Note:</strong> Loggin in with GitHub will keep these permissions active. You only need to reconnect if you see &quot;Invalid Credentials&quot; errors.
                </div>
            </CardContent>
        </Card>
    );
}
