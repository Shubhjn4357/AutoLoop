import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import { LandingPage } from "@/components/home/landing-page";

export default async function Home() {
  const session = await auth();

  // Auto sign-in: if already logged in, go straight to dashboard
  if (session) {
    redirect("/dashboard");
  }

  return <LandingPage />;
}
