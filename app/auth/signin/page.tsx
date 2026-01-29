"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Infinity, Github, ArrowLeft, Send, Lock } from "lucide-react";
import { toast } from "sonner";

export default function SignIn() {
  const [isWhatsApp, setIsWhatsApp] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async () => {
    if (!phoneNumber) {
      toast.error("Please enter a phone number");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success("OTP sent to WhatsApp!");
      setStep("otp");
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      toast.error(msg || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp) {
      toast.error("Please enter the OTP");
      return;
    }
    setLoading(true);
    try {
      const res = await signIn("whatsapp-otp", {
        phoneNumber,
        code: otp,
        callbackUrl: "/dashboard",
        redirect: false
      });

      if (res?.error) {
        throw new Error(res.error);
      } else if (res?.ok) {
        window.location.href = "/dashboard";
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      toast.error(msg || "Invalid OTP or Login Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-indigo-200 via-slate-100 to-indigo-100 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-900">
      <div className="absolute inset-0 bg-grid-slate-200/50 mask-[linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:bg-grid-slate-700/25 dark:mask-[linear-gradient(0deg,rgba(255,255,255,0.1),rgba(255,255,255,0.5))]" />

      <Card className="relative w-full max-w-md border-0 bg-white/70 shadow-2xl backdrop-blur-xl dark:bg-slate-950/70">
        <CardHeader className="text-center pb-8">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-linear-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30 ring-1 ring-white/50">
            <Infinity className="h-10 w-10 text-white" />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-3xl font-bold tracking-tight bg-linear-to-br from-indigo-500 to-purple-600 bg-clip-text text-transparent">
              {isWhatsApp ? "WhatsApp Login" : "AutoLoop"}
            </CardTitle>
            <CardDescription className="text-base font-medium text-slate-600 dark:text-slate-400">
              {isWhatsApp ? "Secure OTP Verification" : "Automated Cold Email Intelligence"}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 px-8 pb-8">
          {isWhatsApp ? (
            <div className="space-y-4">
              {step === "phone" ? (
                <div className="space-y-4">
                  <div className="space-y-2 text-left">
                    <Label>WhatsApp Number</Label>
                    <Input
                      placeholder="+1234567890"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                    />
                  </div>
                  <Button className="w-full" onClick={handleSendOtp} disabled={loading}>
                    {loading ? "Sending..." : "Send OTP"} <Send className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2 text-left">
                    <Label>Enter OTP</Label>
                    <Input
                      placeholder="123456"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      maxLength={6}
                      className="text-center text-lg tracking-widest"
                    />
                  </div>
                  <Button className="w-full" onClick={handleVerifyOtp} disabled={loading}>
                    {loading ? "Verifying..." : "Verify & Login"} <Lock className="ml-2 h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setStep("phone")} className="w-full">
                    Change Phone Number
                  </Button>
                </div>
              )}

              <div className="pt-4 border-t">
                <Button variant="ghost" className="w-full" onClick={() => setIsWhatsApp(false)}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back to Social Login
                </Button>
              </div>
            </div>
          ) : (
              <div className="grid gap-4">
                <Button
                  variant="outline"
                  size="lg"
                  className="relative h-12 border-slate-200 bg-white hover:bg-slate-50 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-900 dark:hover:text-slate-50 transition-all hover:scale-[1.02] hover:shadow-md"
                  onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
                >
                  <div className="absolute left-4 flex h-6 w-6 items-center justify-center">
                    <svg viewBox="0 0 24 24" className="h-5 w-5">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-222.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                  </div>
                  <span className="font-semibold">Continue with Google</span>
                </Button>

                <Button
                  variant="outline"
                  size="lg"
                  className="relative h-12 border-slate-200 bg-white hover:bg-slate-50 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-900 dark:hover:text-slate-50 transition-all hover:scale-[1.02] hover:shadow-md"
                  onClick={() => signIn("github", { callbackUrl: "/dashboard" })}
                >
                  <div className="absolute left-4 flex h-6 w-6 items-center justify-center">
                    <Github className="h-5 w-5" />
                  </div>
                  <span className="font-semibold">Continue with GitHub</span>
                </Button>

                <Button
                  variant="outline"
                  size="lg"
                  className="relative h-12 border-green-200 bg-green-50 hover:bg-green-100 text-green-700 dark:border-green-900 dark:bg-green-900/20 dark:text-green-400 transition-all hover:scale-[1.02] hover:shadow-md"
                  onClick={() => setIsWhatsApp(true)}
                >
                  <div className="absolute left-4 flex h-6 w-6 items-center justify-center">
                    {/* WhatsApp Icon */}
                    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                    </svg>
                  </div>
                  <span className="font-semibold">Login with WhatsApp</span>
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-slate-200 dark:border-slate-800" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-slate-500 dark:bg-slate-950 dark:text-slate-400">
                      Or continue with
                    </span>
                  </div>
                </div>

                <div className="text-center">
                  <Button variant="link" asChild className="text-slate-500 dark:text-slate-400 font-normal hover:text-primary transition-colors">
                    <Link href="/admin/login">Admin Access</Link>
                  </Button>
                </div>
            </div>
          )}

          <p className="text-center text-xs text-slate-500 dark:text-slate-400 px-4 leading-relaxed">
            By clicking continue, you agree to our{" "}
            <Link href="/terms" className="font-medium text-primary hover:underline underline-offset-4">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="font-medium text-primary hover:underline underline-offset-4">
              Privacy Policy
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
