export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth/config";
import { getDashboardData } from "@/lib/dashboard/data";
import { headers } from "next/headers";
import { DashboardContent } from "./dashboard-bridge";

export default async function DashboardPage() {
  await headers();
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) return null;

  const data = await getDashboardData(userId);

  return <DashboardContent data={data} />;
}
