import { auth, isGoogleAuthConfigured, isGithubAuthConfigured } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { LoginForm } from "@/components/auth/login-form";

export default async function LoginPage() {
  await headers();
  const session = await auth();

  // If already authenticated, redirect to dashboard immediately
  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <LoginForm 
          googleConfigured={isGoogleAuthConfigured()} 
          githubConfigured={isGithubAuthConfigured()} 
        />
      </div>
    </div>
  );
}
