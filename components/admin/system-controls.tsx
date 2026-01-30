"use client";

import { useState, useEffect } from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertTriangle, Save, RefreshCw } from "lucide-react";
import { useApi } from "@/hooks/use-api";

interface SystemSettings {
    featureFlags: {
        betaFeatures: boolean;
        registration: boolean;
        maintenance: boolean;
    };
    emailConfig: {
        dailyLimit: number;
        userRateLimit: number;
    };
}

export function SystemControls() {
    const { get, post, loading: apiLoading } = useApi<SystemSettings>();
    const [localSettings, setLocalSettings] = useState<SystemSettings>({
        featureFlags: {
            betaFeatures: false,
            registration: true,
            maintenance: false,
        },
        emailConfig: {
            dailyLimit: 10000,
            userRateLimit: 50,
        },
    });
    const [initialLoading, setInitialLoading] = useState(true);

    useEffect(() => {
        const fetchSettings = async () => {
             const data = await get("/api/admin/settings");
             if (data) {
                setLocalSettings({
                    featureFlags: { ...localSettings.featureFlags, ...(data.featureFlags || {}) },
                    emailConfig: { ...localSettings.emailConfig, ...(data.emailConfig || {}) }
                });
             }
             setInitialLoading(false);
        };
        fetchSettings();
    }, [get, localSettings.emailConfig, localSettings.featureFlags]); // Run once on mount

    const handleSave = async () => {
        await post("/api/admin/settings", localSettings, {
            successMessage: "System settings updated successfully"
        });
    };

    const updateFeatureFlag = (key: keyof SystemSettings["featureFlags"], value: boolean) => {
        setLocalSettings(prev => ({
            ...prev,
            featureFlags: { ...prev.featureFlags, [key]: value }
        }));
    };

    const updateEmailConfig = (key: keyof SystemSettings["emailConfig"], value: number) => {
        setLocalSettings(prev => ({
            ...prev,
            emailConfig: { ...prev.emailConfig, [key]: value }
        }));
    };

    const loading = initialLoading || apiLoading;

    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle>Feature Flags</CardTitle>
                    <CardDescription>
                        Toggle system-wide features and experimental functionality
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label>Beta Features</Label>
                            <div className="text-sm text-muted-foreground">
                                Enable experimental features for all users
                            </div>
                        </div>
                        <Switch
                            checked={localSettings.featureFlags.betaFeatures}
                            onCheckedChange={(c) => updateFeatureFlag("betaFeatures", c)}
                            disabled={loading}
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label>User Registration</Label>
                            <div className="text-sm text-muted-foreground">
                                Allow new users to sign up
                            </div>
                        </div>
                        <Switch
                            checked={localSettings.featureFlags.registration}
                            onCheckedChange={(c) => updateFeatureFlag("registration", c)}
                            disabled={loading}
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label>Maintenance Mode</Label>
                            <div className="text-sm text-muted-foreground">
                                Disable access for non-admin users
                            </div>
                        </div>
                        <Switch
                            checked={localSettings.featureFlags.maintenance}
                            onCheckedChange={(c) => updateFeatureFlag("maintenance", c)}
                            disabled={loading}
                        />
                    </div>
                </CardContent>
                <CardFooter>
                    <Button onClick={handleSave} disabled={loading}>
                        {loading ? (
                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Save className="mr-2 h-4 w-4" />
                        )}
                        Save Changes
                    </Button>
                </CardFooter>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Email Configuration</CardTitle>
                    <CardDescription>
                        Manage global email sending limits and rate limiting
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-2">
                        <Label>Daily Global Limit</Label>
                        <Input
                            type="number"
                            value={localSettings.emailConfig.dailyLimit}
                            onChange={(e) => updateEmailConfig("dailyLimit", parseInt(e.target.value))}
                            disabled={loading}
                        />
                        <p className="text-xs text-muted-foreground">
                            Maximum emails sent across all users per day
                        </p>
                    </div>
                    <div className="grid gap-2">
                        <Label>Default User Rate Limit</Label>
                        <Input
                            type="number"
                            value={localSettings.emailConfig.userRateLimit}
                            onChange={(e) => updateEmailConfig("userRateLimit", parseInt(e.target.value))}
                            disabled={loading}
                        />
                        <p className="text-xs text-muted-foreground">
                            Emails per hour per user account
                        </p>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button variant="outline" onClick={handleSave} disabled={loading}>
                        Update Configuration
                    </Button>
                </CardFooter>
            </Card>

            <Card className="border-red-200 dark:border-red-900">
                <CardHeader>
                    <div className="flex items-center gap-2 text-red-600">
                        <AlertTriangle className="h-5 w-5" />
                        <CardTitle>Danger Zone</CardTitle>
                    </div>
                    <CardDescription>
                        Irreversible actions that affect the entire system
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg bg-red-50 dark:bg-red-950/20">
                        <div>
                            <div className="font-medium text-red-900 dark:text-red-200">
                                Clear System Cache
                            </div>
                            <div className="text-sm text-red-700 dark:text-red-300">
                                Flush Redis cache and reset rate limits
                            </div>
                        </div>
                        <Button variant="destructive" size="sm">
                            Clear Cache
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
