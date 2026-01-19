import { AnalyticsDashboard } from "@/components/analytics-dashboard";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Analytics",
  description: "View detailed analytics and performance metrics for your email campaigns",
};

export default function AnalyticsPage() {
  return (
    <div className="p-6">
      <AnalyticsDashboard />
    </div>
  );
}
