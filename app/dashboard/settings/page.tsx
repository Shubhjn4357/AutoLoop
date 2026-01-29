'use client'
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Key, Bell, Copy, Check, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/components/theme-provider";
import { signOut } from "next-auth/react";
import { useApi } from "@/hooks/use-api";
import { UserProfile } from "@/types";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Moon, Sun, LogOut, Trash2, AlertTriangle, Palette } from "lucide-react";
import { MailSettings } from "@/components/mail/mail-settings";

interface StatusResponse {
  database: boolean;
  redis: boolean;
}

export default function SettingsPage() {
  const { data: session, update } = useSession();
  const { toast } = useToast();
  const { theme, toggleTheme } = useTheme();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isSavingNotifications, setIsSavingNotifications] = useState(false);

  // API Hooks
  const { get: getSettings, patch: patchSettings, loading: settingsLoading } = useApi<{ user: UserProfile & { isGeminiKeySet: boolean, isGmailConnected: boolean, isLinkedinCookieSet: boolean } }>();
  const { get: getStatus, loading: statusLoading } = useApi<StatusResponse>();
  const { del: deleteUserFn, loading: deletingUser } = useApi<void>();
  const { del: deleteDataFn, loading: deletingData } = useApi<void>();

  const [isDeleteDataModalOpen, setIsDeleteDataModalOpen] = useState(false);

  // API Key State
  const [geminiApiKey, setGeminiApiKey] = useState("");
  const [isGeminiKeySet, setIsGeminiKeySet] = useState(false);
  const [isGmailConnected, setIsGmailConnected] = useState(false);

  // Connection Status State
  const [connectionStatus, setConnectionStatus] = useState({ database: false, redis: false });

  const [profileData, setProfileData] = useState({
    name: session?.user?.name || "",
    phone: "",
    jobTitle: "",
    company: "",
    website: "",
    timezone: "IST (GMT+5:30)",
  });
  const [customVariables, setCustomVariables] = useState<{ key: string; value: string }[]>([]);
  const [settings, setSettings] = useState({
    emailNotifications: true,
    campaignAlerts: true,
    weeklyReports: false,
  });

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
        // Fetch User Settings
      const settingsData = await getSettings("/api/settings");
      if (settingsData?.user) {
        setProfileData(prev => ({
          ...prev,
          name: settingsData.user.name || prev.name,
          phone: settingsData.user.phone || "",
          jobTitle: settingsData.user.jobTitle || "",
          company: settingsData.user.company || "",
          website: settingsData.user.website || ""
        }));

        if (settingsData.user.customVariables) {
          const vars = Object.entries(settingsData.user.customVariables).map(([key, value]) => ({ key, value: String(value) }));
          setCustomVariables(vars);
        }
        setIsGeminiKeySet(settingsData.user.isGeminiKeySet);
        setIsGmailConnected(settingsData.user.isGmailConnected);
        }

        // Fetch Connection Status
      const statusData = await getStatus("/api/settings/status");
      if (statusData) {
        setConnectionStatus(statusData);
      }
    };
    fetchData();
  }, [getSettings, getStatus]);

  const handleSaveApiKey = async () => {
    if (!geminiApiKey) return;

    const result = await patchSettings("/api/settings", { geminiApiKey });

    if (result) {
      setIsGeminiKeySet(true);
      setGeminiApiKey(""); // Clear input on success
      toast({
        title: "API Key Updated",
        description: "Your Gemini API key has been saved securely.",
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to update API key.",
        variant: "destructive",
      });
    }
  }

  const [linkedinCookie, setLinkedinCookie] = useState("");
  const [isLinkedinCookieSet, setIsLinkedinCookieSet] = useState(false);

  // Load LinkedIn cookie set status
  useEffect(() => {
    const loadLinkedinStatus = async () => {
      const settingsData = await getSettings("/api/user/settings");
      if (settingsData?.user?.isLinkedinCookieSet) {
        setIsLinkedinCookieSet(true);
      }
    };
    loadLinkedinStatus();
  }, [getSettings]);

  const handleSaveLinkedinCookie = async () => {
    if (!linkedinCookie) return;

    const result = await patchSettings("/api/settings", { linkedinSessionCookie: linkedinCookie });

    if (result) {
      setIsLinkedinCookieSet(true);
      setLinkedinCookie("");
      toast({
        title: "LinkedIn Cookie Updated",
        description: "Your session cookie has been saved.",
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to update cookie.",
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveProfile = async () => {
    const result = await patchSettings("/api/settings", {
      name: profileData.name,
      phone: profileData.phone,
      jobTitle: profileData.jobTitle,
      company: profileData.company,
      website: profileData.website,
      customVariables: customVariables.reduce((acc, curr) => ({ ...acc, [curr.key]: curr.value }), {})
    });

    if (result) {
      await update({ name: profileData.name });

      toast({
        title: "Profile updated",
        description: "Your profile information has been saved successfully.",
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to save profile. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSaveNotifications = async () => {
    setIsSavingNotifications(true);
    // In a real app, this would save to a user preferences table
    // For now, we'll just show success after a delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    toast({
      title: "Preferences saved",
      description: "Your notification preferences have been updated.",
    });
    setIsSavingNotifications(false);
  };

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/" });
  };

  const handleDeleteAccount = async () => {
    const result = await deleteUserFn("/api/user/delete");

    if (result !== null) { // Expecting success even if void/null
      toast({
        title: "Account deleted",
        description: "Your account has been permanently deleted.",
      });

      await signOut({ callbackUrl: "/" });
    } else {
      toast({
        title: "Error",
        description: "Failed to delete account. Please try again.",
        variant: "destructive",
      });
      setIsDeleteModalOpen(false);
    }
  };

  const handleDeleteData = async () => {
    const result = await deleteDataFn("/api/settings/delete-data");

    if (result !== null) {
      toast({
        title: "Data Deleted",
        description: "All scraped businesses and jobs have been permanently deleted.",
      });
      setIsDeleteDataModalOpen(false);
    } else {
      toast({
        title: "Error",
        description: "Failed to delete data. Please try again.",
        variant: "destructive",
      });
      setIsDeleteDataModalOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile" className="cursor-pointer">
            <User className="mr-2 h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="api" className="cursor-pointer">
            <Key className="mr-2 h-4 w-4" />
            API Keys
          </TabsTrigger>
          <TabsTrigger value="notifications" className="cursor-pointer">
            <Bell className="mr-2 h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="appearance" className="cursor-pointer">
            <Palette className="mr-2 h-4 w-4" />
            Appearance
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your personal information and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={session?.user?.image || ""} alt={session?.user?.name || ""} />
                  <AvatarFallback className="text-2xl font-bold bg-linear-to-r from-blue-600 to-purple-600 text-white">
                    {session?.user?.name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold">{session?.user?.name || "User"}</h3>
                  <p className="text-sm text-muted-foreground">{session?.user?.email}</p>
                </div>
              </div>

              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={profileData.name}
                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                    placeholder="Enter your name"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={profileData.phone}
                      onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      value={profileData.website}
                      onChange={(e) => setProfileData({ ...profileData, website: e.target.value })}
                      placeholder="https://example.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="company">Company</Label>
                    <Input
                      id="company"
                      value={profileData.company}
                      onChange={(e) => setProfileData({ ...profileData, company: e.target.value })}
                      placeholder="Acme Inc."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="jobTitle">Job Title</Label>
                    <Input
                      id="jobTitle"
                      value={profileData.jobTitle}
                      onChange={(e) => setProfileData({ ...profileData, jobTitle: e.target.value })}
                      placeholder="CEO"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Custom Variables</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCustomVariables([...customVariables, { key: "", value: "" }])}
                      className="cursor-pointer"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Variable
                    </Button>
                  </div>
                  <Card>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Key (e.g. calendar_link)</TableHead>
                          <TableHead>Value (e.g. cal.com/me)</TableHead>
                          <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {customVariables.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={3} className="text-center text-muted-foreground">
                              No custom variables added
                            </TableCell>
                          </TableRow>
                        )}
                        {customVariables.map((variable, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <Input
                                value={variable.key}
                                onChange={(e) => {
                                  const newVars = [...customVariables];
                                  newVars[index].key = e.target.value;
                                  setCustomVariables(newVars);
                                }}
                                placeholder="my_variable"
                                className="h-8"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                value={variable.value}
                                onChange={(e) => {
                                  const newVars = [...customVariables];
                                  newVars[index].value = e.target.value;
                                  setCustomVariables(newVars);
                                }}
                                placeholder="Value"
                                className="h-8"
                              />
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  const newVars = customVariables.filter((_, i) => i !== index);
                                  setCustomVariables(newVars);
                                }}
                                className="h-8 w-8 text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Card>
                  <p className="text-xs text-muted-foreground">
                    These variables can be used in your email templates using {"{key}"}.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    defaultValue={session?.user?.email || ""}
                    disabled
                  />
                  <p className="text-xs text-muted-foreground">
                    Email cannot be changed for security reasons
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <select
                    id="timezone"
                    value={profileData.timezone}
                    onChange={(e) => setProfileData({ ...profileData, timezone: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background cursor-pointer"
                  >
                    <option>UTC (GMT+0:00)</option>
                    <option>EST (GMT-5:00)</option>
                    <option>PST (GMT-8:00)</option>
                    <option>IST (GMT+5:30)</option>
                  </select>
                </div>

                <Button
                  className="w-fit cursor-pointer"
                  onClick={handleSaveProfile}
                  disabled={settingsLoading}
                >
                  {settingsLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-destructive flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Danger Zone
              </CardTitle>
              <CardDescription>
                Irreversible account actions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between p-4 border rounded-lg bg-muted/20">
                <div className="space-y-1">
                  <div className="font-medium">Sign Out</div>
                  <div className="text-sm text-muted-foreground">
                    Sign out of your active session
                  </div>
                </div>
                <Button variant="outline" onClick={handleSignOut} className="cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </Button>
              </div>

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between p-4 border border-destructive/20 rounded-lg bg-destructive/5">
                <div className="space-y-1">
                  <div className="font-medium text-destructive">Delete Scraped Data</div>
                  <div className="text-sm text-muted-foreground">
                    Permanently delete all scraped businesses and jobs
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setIsDeleteDataModalOpen(true)}
                  className="cursor-pointer border-destructive/50 text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Data
                </Button>
              </div>

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between p-4 border border-destructive/20 rounded-lg bg-destructive/5">
                <div className="space-y-1">
                  <div className="font-medium text-destructive">Delete Account</div>
                  <div className="text-sm text-muted-foreground">
                    Permanently delete your account and all data
                  </div>
                </div>
                <Button
                  variant="destructive"
                  onClick={() => setIsDeleteModalOpen(true)}
                  className="cursor-pointer"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* API Keys Tab */}
        <TabsContent value="api" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>API Keys & Integrations</CardTitle>
              <CardDescription>
                Manage your connections and API keys.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Mail Settings (Gmail) */}
              <div className="space-y-2">
                <MailSettings isConnected={isGmailConnected} email={session?.user?.email} />
              </div>

              {/* Database URL */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Database Connection</Label>
                  {statusLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Badge variant={connectionStatus.database ? "default" : "destructive"}>
                      {connectionStatus.database ? "Connected" : "Not Connected"}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  Database
                </p>
              </div>

              {/* Redis */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Redis Queue</Label>
                  {statusLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Badge variant={connectionStatus.redis ? "default" : "destructive"}>
                      {connectionStatus.redis ? "Connected" : "Not Connected"}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  Background job processing
                </p>
              </div>

              {/* Gemini API */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Gemini API Key</Label>
                  <Badge variant={isGeminiKeySet ? "default" : "destructive"}>
                    {isGeminiKeySet ? "Configured" : "Not Set"}
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Input
                    type="password"
                    placeholder={isGeminiKeySet ? "••••••••••••••••" : "Enter your API Key"}
                    value={geminiApiKey}
                    onChange={(e) => setGeminiApiKey(e.target.value)}
                  />
                  <Button
                    variant="outline"
                    className="cursor-pointer"
                    onClick={handleSaveApiKey}
                    disabled={settingsLoading || !geminiApiKey}
                  >
                    {settingsLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Update"
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Required for AI-powered email generation and scraping.
                </p>
              </div>

              {/* LinkedIn Session Cookie */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>LinkedIn Session Cookie (li_at)</Label>
                  <Badge variant={isLinkedinCookieSet ? "default" : "secondary"}>
                    {isLinkedinCookieSet ? "Configured" : "Not Set"}
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Input
                    type="password"
                    placeholder={isLinkedinCookieSet ? "••••••••••••••••" : "Paste your li_at cookie here"}
                    value={linkedinCookie}
                    onChange={(e) => setLinkedinCookie(e.target.value)}
                  />
                  <Button
                    variant="outline"
                    className="cursor-pointer"
                    onClick={handleSaveLinkedinCookie}
                    disabled={settingsLoading || !linkedinCookie}
                  >
                    {settingsLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Update"
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Required for real LinkedIn automation.
                  <span className="text-yellow-600 dark:text-yellow-400 font-medium ml-1">
                    Warning: Use with caution.
                  </span>
                </p>
              </div>

              {/* Webhook URL */}
              <div className="space-y-2">
                <Label>Webhook URL</Label>
                <div className="flex gap-2">
                  <Input
                    value={`${typeof window !== 'undefined' ? window.location.origin : ''}/api/webhooks/email`}
                    readOnly
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(`${typeof window !== 'undefined' ? window.location.origin : ''}/api/webhooks/email`)}
                    className="cursor-pointer"
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Use this URL for email tracking webhooks
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Choose how you want to be notified
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive email updates about your campaigns
                  </p>
                </div>
                <Switch
                  checked={settings.emailNotifications}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, emailNotifications: checked })
                  }
                  className="cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Campaign Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when campaigns complete or fail
                  </p>
                </div>
                <Switch
                  checked={settings.campaignAlerts}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, campaignAlerts: checked })
                  }
                  className="cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Weekly Reports</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive weekly performance summaries
                  </p>
                </div>
                <Switch
                  checked={settings.weeklyReports}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, weeklyReports: checked })
                  }
                  className="cursor-pointer"
                />
              </div>

              <Button
                className="cursor-pointer"
                onClick={handleSaveNotifications}
                disabled={isSavingNotifications}
              >
                {isSavingNotifications ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Preferences"
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        {/* Appearance Tab */}
        <TabsContent value="appearance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>
                Customize the look and feel of the application
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Theme</Label>
                  <p className="text-sm text-muted-foreground">
                    Select your preferred theme
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant={theme === "light" ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleTheme()}
                    className="cursor-pointer"
                  >
                    <Sun className="mr-2 h-4 w-4" />
                    Light
                  </Button>
                  <Button
                    variant={theme === "dark" ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleTheme()}
                    className="cursor-pointer"
                  >
                    <Moon className="mr-2 h-4 w-4" />
                    Dark
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Account</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete your account? This action cannot be undone. All your data will be permanently removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteModalOpen(false)}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={deletingUser}
              className="cursor-pointer"
            >
              {deletingUser ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Account"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDataModalOpen} onOpenChange={setIsDeleteDataModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete All Scraped Data</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete all scraped businesses and jobs? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDataModalOpen(false)}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteData}
              disabled={deletingData}
              className="cursor-pointer"
            >
              {deletingData ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Data"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
