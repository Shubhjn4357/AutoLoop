"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Share2, AlertCircle, CheckCircle2, RefreshCw, Linkedin } from "lucide-react";
import { SiFacebook, SiInstagram, SiYoutube } from "@icons-pack/react-simple-icons";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

interface ConnectedAccount {
  id: string;
  userId: string;
  provider: string; // 'facebook', 'linkedin', etc.
  providerAccountId: string;
  name?: string | null;
  picture?: string | null;
  accessToken?: string | null;
  expiresAt?: Date | null;
}

interface SocialSettingsProps {
  connectedAccounts: ConnectedAccount[];
}

export function SocialSettings({ connectedAccounts }: SocialSettingsProps) {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const success = searchParams.get("success");

  const fbAccount = connectedAccounts.find((a) => a.provider === "facebook");
  const linkedinAccount = connectedAccounts.find((a) => a.provider === "linkedin");
  const youtubeAccount = connectedAccounts.find((a) => a.provider === "youtube");

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error === "access_denied"
              ? "You denied access. Please try again and accept permissions."
              : error}
          </AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-500 text-green-600 bg-green-50">
          <CheckCircle2 className="h-4 w-4" />
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>Account connected successfully!</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Facebook & Instagram */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xl font-medium">Facebook & Instagram</CardTitle>
            <div className="flex gap-1">
              <SiFacebook className="h-6 w-6 text-[#1877F2]" />
              <SiInstagram className="h-6 w-6 text-[#E4405F]" />
            </div>
          </CardHeader>
          <CardContent>
            {fbAccount ? (
              <div className="flex flex-col gap-4 mt-4">
                <div className="flex items-center gap-3">
                  {fbAccount.picture ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={fbAccount.picture}
                      alt={fbAccount.name || "Profile"}
                      className="w-10 h-10 rounded-full"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center">
                      <span className="text-lg font-bold text-slate-500">
                        {fbAccount.name?.charAt(0)}
                      </span>
                    </div>
                  )}
                  <div>
                    <p className="font-medium">{fbAccount.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Connected as {fbAccount.providerAccountId}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-2 rounded border border-green-100">
                  <CheckCircle2 className="h-4 w-4" />
                  Connected & Active
                </div>
                <Button variant="outline" className="w-full gap-2" asChild>
                  <Link href="/api/social/connect/facebook">
                    <RefreshCw className="h-4 w-4" /> Reconnect / Refresh
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-4 mt-4">
                <p className="text-sm text-muted-foreground">
                  Connect to manage Facebook Pages and Instagram Business accounts.
                </p>
                <Button className="w-full bg-[#1877F2] hover:bg-[#1864D9]" asChild>
                  <Link href="/api/social/connect/facebook">
                    Connect Facebook
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* LinkedIn */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xl font-medium">LinkedIn</CardTitle>
            <Linkedin className="h-6 w-6 text-[#0A66C2] fill-current" />
          </CardHeader>
          <CardContent>
            {linkedinAccount ? (
              <div className="flex flex-col gap-4 mt-4">
                <div className="flex items-center gap-3">
                  {linkedinAccount.picture ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={linkedinAccount.picture}
                      alt={linkedinAccount.name || "Profile"}
                      className="w-10 h-10 rounded-full"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center">
                      <span className="text-lg font-bold text-slate-500">
                        {linkedinAccount.name?.charAt(0)}
                      </span>
                    </div>
                  )}
                  <div>
                    <p className="font-medium">{linkedinAccount.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Connected as {linkedinAccount.providerAccountId}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-2 rounded border border-green-100">
                  <CheckCircle2 className="h-4 w-4" />
                  Connected & Active
                </div>
                <Button variant="outline" className="w-full gap-2" asChild>
                  <Link href="/api/social/connect/linkedin">
                    <RefreshCw className="h-4 w-4" /> Reconnect / Refresh
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-4 mt-4">
                <p className="text-sm text-muted-foreground">
                  Connect LinkedIn to create posts and manage your profile.
                </p>
                <Button className="w-full bg-[#0A66C2] hover:bg-[#004182]" asChild>
                  <Link href="/api/social/connect/linkedin">
                    Connect LinkedIn
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* YouTube */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xl font-medium">YouTube</CardTitle>
            <SiYoutube className="h-6 w-6 text-[#FF0000]" />
          </CardHeader>
          <CardContent>
            {youtubeAccount ? (
              <div className="flex flex-col gap-4 mt-4">
                <div className="flex items-center gap-3">
                  {youtubeAccount.picture ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={youtubeAccount.picture}
                      alt={youtubeAccount.name || "Profile"}
                      className="w-10 h-10 rounded-full"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center">
                      <span className="text-lg font-bold text-slate-500">
                        {youtubeAccount.name?.charAt(0)}
                      </span>
                    </div>
                  )}
                  <div>
                    <p className="font-medium">{youtubeAccount.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Connected as {youtubeAccount.providerAccountId}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-2 rounded border border-green-100">
                  <CheckCircle2 className="h-4 w-4" />
                  Connected & Active
                </div>
                <Button variant="outline" className="w-full gap-2" asChild>
                  <Link href="/api/social/connect/youtube">
                    <RefreshCw className="h-4 w-4" /> Reconnect / Refresh
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-4 mt-4">
                <p className="text-sm text-muted-foreground">
                  Connect YouTube to upload videos and view analytics.
                </p>
                <Button className="w-full bg-[#FF0000] hover:bg-[#CC0000]" asChild>
                  <Link href="/api/social/connect/youtube">
                    Connect YouTube
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
