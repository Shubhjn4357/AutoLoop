"use client";

import { useState, useEffect, useCallback } from "react";
import { StatCard } from "@/components/dashboard/stat-card";
import { BusinessTable } from "@/components/dashboard/business-table";
import { BusinessDetailModal } from "@/components/dashboard/business-detail-modal";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Business } from "@/types";
import {
  Users,
  Mail,
  CheckCircle2,
  TrendingUp,
  Play,
  Loader2,
  Sparkles,
} from "lucide-react";
import { BusinessTypeSelect } from "@/components/business-type-select";
import { KeywordInput } from "@/components/keyword-input";
import { ActiveTaskCard } from "@/components/active-task-card";
// Recharts moved to separate component
import dynamic from "next/dynamic";
import { AnimatedContainer } from "@/components/animated-container";

const EmailChart = dynamic(() => import("@/components/dashboard/email-chart"), {
  loading: () => <div className="h-[300px] flex items-center justify-center"><Loader2 className="animate-spin h-6 w-6" /></div>,
  ssr: false
});
import { useApi } from "@/hooks/use-api";
import { toast } from "sonner";
import { allLocations } from "@/lib/locations";
import { sendNotification } from "@/components/notification-bell";

interface DashboardStats {
  totalBusinesses: number;
  totalTemplates: number;
  totalWorkflows: number;
  emailsSent: number;
  emailsOpened: number;
  emailsClicked: number;
  openRate: number;
  clickRate: number;
}

interface ChartDataPoint {
  name: string;
  sent: number;
  opened: number;
}

interface ActiveTask {
  jobId: string;
  workflowName: string;
  status: string;
  businessesFound: number;
}

export default function DashboardPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [isScrapingStarted, setIsScrapingStarted] = useState(false);
  const [isGeneratingKeywords, setIsGeneratingKeywords] = useState(false);
  const [activeTask, setActiveTask] = useState<ActiveTask | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [businessType, setBusinessType] = useState<string>("");
  const [location, setLocation] = useState<string>("");
  const [scrapingSources, setScrapingSources] = useState<string[]>(["google-maps", "google-search"]);

  const handleViewDetails = (business: Business) => {
    setSelectedBusiness(business);
    setIsModalOpen(true);
  };

  // API Hooks
  const { post: startScraping } = useApi();
  const { get: getBusinessesApi } = useApi<{ businesses: Business[] }>();
  // Use loadingStats from hook instead of local state
  const { get: getStatsApi, loading: loadingStats } = useApi<{ stats: DashboardStats; chartData: ChartDataPoint[] }>();
  const { post: generateKeywords } = useApi<{ keywords: string[] }>();
  const { get: getActiveTasks } = useApi<{ tasks: Array<{ id: string; type: string; status: string; workflowName?: string; businessesFound?: number }> }>();

  const fetchDashboardStats = useCallback(async () => {
    const data = await getStatsApi("/api/dashboard/stats");
    if (data) {
      setStats(data.stats);
      setChartData(data.chartData || []);
    }
  }, [getStatsApi]);

  const fetchActiveTask = useCallback(async () => {
    const data = await getActiveTasks("/api/tasks");
    if (data?.tasks) {
      // Find first active scraping task
      const activeJob = data.tasks.find(
        (task: { type: string; status: string }) =>
          task.type === "scraping" &&
          (task.status === "processing" || task.status === "paused")
      );

      if (activeJob) {
        setActiveTask({
          jobId: activeJob.id,
          workflowName: activeJob.workflowName || "Scraping Job",
          status: activeJob.status,
          businessesFound: activeJob.businessesFound || 0,
        });
      } else if (activeTask) {
        // Clear if task completed
        setActiveTask(null);
      }
    }
  }, [getActiveTasks, activeTask]);

  useEffect(() => {
    const initData = async () => {
      // Fetch businesses
      const businessData = await getBusinessesApi("/api/businesses");
      if (businessData) {
        setBusinesses(businessData.businesses || []);
      }

      // Fetch stats
      await fetchDashboardStats();

      // Fetch active task
      await fetchActiveTask();
    };

    initData();

    // Auto-refresh stats every 30 seconds
    const statsInterval = setInterval(fetchDashboardStats, 30000);

    // Auto-refresh active task every 5 seconds
    const taskInterval = setInterval(fetchActiveTask, 5000);

    return () => {
      clearInterval(statsInterval);
      clearInterval(taskInterval);
    };
  }, [getBusinessesApi, fetchDashboardStats, fetchActiveTask]);

  const { post: sendEmailApi } = useApi();

  const handleSendEmail = async (business: Business) => {
    const toastId = toast.loading(`Sending email to ${business.name}...`);
    try {
      await sendEmailApi("/api/email/send", { businessId: business.id });
      toast.success(`Email sent to ${business.email}`, { id: toastId });

      setBusinesses(prev => prev.map(b =>
        b.id === business.id
          ? { ...b, emailStatus: "sent", emailSent: true }
          : b
      ));
    } catch {
      toast.error("Failed to send email", { id: toastId });
    }
  };

  const handleStartScraping = async () => {
    if (!businessType || !location) return;

    setIsScrapingStarted(true);
    try {
      const result = await startScraping("/api/scraping/start", {
        targetBusinessType: businessType,
        keywords,
        location,
        sources: scrapingSources, // Pass selected sources
      });

      if (result) {
        sendNotification({
          title: "Scraping job started!",
          message: "Check the Tasks page to monitor progress.",
          type: "success",
          link: "/dashboard/tasks",
          actionLabel: "View Tasks"
        });

        // Refresh businesses list after a short delay
        setTimeout(async () => {
          const businessData = await getBusinessesApi("/api/businesses");
          if (businessData) {
            setBusinesses(businessData.businesses || []);
          }
        }, 2000);
      }
    } catch (error) {
      toast.error("Failed to start scraping", {
        description: "Please try again or check your connection.",
      });
      console.error("Error starting scraping:", error);
    } finally {
      setIsScrapingStarted(false);
    }
  };

  const handleGenerateKeywords = async () => {
    if (!businessType) {
      toast.error("Please select a business type first");
      return;
    }

    setIsGeneratingKeywords(true);
    try {
      const result = await generateKeywords("/api/keywords/generate", {
        businessType,
      });

      if (result?.keywords) {
        // Merge with existing keywords, avoiding duplicates
        const newKeywords = result.keywords.filter(
          (kw: string) => !keywords.includes(kw)
        );
        setKeywords([...keywords, ...newKeywords]);
        sendNotification({
          title: "Keywords Generated",
          message: `Successfully generated ${newKeywords.length} new keywords.`,
          type: "success"
        });
      }
    } catch (error) {
      toast.error("Failed to generate keywords");
      console.error("Error generating keywords:", error);
    } finally {
      setIsGeneratingKeywords(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Scraping Form */}
      <Card>
        <CardHeader>
          <CardTitle>Start New Search</CardTitle>
          <CardDescription>
            Find local businesses and automatically reach out to them
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="businessType">Business Type</Label>
              <BusinessTypeSelect
                value={businessType}
                onValueChange={setBusinessType}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                list="locations"
                placeholder="e.g., New York, NY"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
              <datalist id="locations">
                {allLocations.map((loc) => (
                  <option key={loc} value={loc} />
                ))}
              </datalist>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="keywords">Keywords (Optional)</Label>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleGenerateKeywords}
                disabled={!businessType || isGeneratingKeywords}
                className="gap-2"
              >
                {isGeneratingKeywords ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </>
                ) : (
                  <>
                      <Sparkles className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
            <KeywordInput
              businessTypeId={businessType}
              value={keywords}
              onChange={setKeywords}
              placeholder="Add relevant keywords..."
            />
            <p className="text-sm text-muted-foreground">
              Press Enter to add custom keywords, click suggestions, or use AI to generate
            </p>
          </div>

          {/* Scraping Sources Selection */}
          <div className="space-y-2">
            <Label>Scraping Sources</Label>
            <div className="flex flex-wrap gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={scrapingSources.includes("google-maps")}
                  onChange={(e) => {
                    if (e.target.checked) setScrapingSources([...scrapingSources, "google-maps"]);
                    else setScrapingSources(scrapingSources.filter(s => s !== "google-maps"));
                  }}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <span className="text-sm">📍 Google Maps</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={scrapingSources.includes("google-search")}
                  onChange={(e) => {
                    if (e.target.checked) setScrapingSources([...scrapingSources, "google-search"]);
                    else setScrapingSources(scrapingSources.filter(s => s !== "google-search"));
                  }}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <span className="text-sm">🔍 Google Search</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={scrapingSources.includes("linkedin")}
                  onChange={(e) => {
                    if (e.target.checked) setScrapingSources([...scrapingSources, "linkedin"]);
                    else setScrapingSources(scrapingSources.filter(s => s !== "linkedin"));
                  }}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <span className="text-sm">💼 LinkedIn</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={scrapingSources.includes("facebook")}
                  onChange={(e) => {
                    if (e.target.checked) setScrapingSources([...scrapingSources, "facebook"]);
                    else setScrapingSources(scrapingSources.filter(s => s !== "facebook"));
                  }}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <span className="text-sm">👥 Facebook</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={scrapingSources.includes("instagram")}
                  onChange={(e) => {
                    if (e.target.checked) setScrapingSources([...scrapingSources, "instagram"]);
                    else setScrapingSources(scrapingSources.filter(s => s !== "instagram"));
                  }}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <span className="text-sm">📸 Instagram</span>
              </label>
            </div>
            <p className="text-xs text-muted-foreground">
              Select sources to scrape from. More sources = more comprehensive results.
            </p>
          </div>
          <Button
            onClick={handleStartScraping}
            disabled={isScrapingStarted || !businessType || !location}
            className="w-full cursor-pointer"
          >
            {isScrapingStarted ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Scraping...
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Start Scraping
              </>
            )}
          </Button>

          {/* Active Task Card - Shown here when scraping */}
          {activeTask && (
            <ActiveTaskCard
              jobId={activeTask.jobId}
              workflowName={activeTask.workflowName}
              status={activeTask.status}
              businessesFound={activeTask.businessesFound}
              onDismiss={() => setActiveTask(null)}
              onStatusChange={fetchActiveTask}
            />
          )}
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {loadingStats || !stats ? (
          Array.from({ length: 4 }).map((_, i) => (
            <AnimatedContainer key={i} delay={0.1 + (i * 0.1)}>
              <Card>
              <CardHeader>
                <div className="h-4 w-24 bg-muted animate-pulse rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 w-16 bg-muted animate-pulse rounded"></div>
              </CardContent>
            </Card>
            </AnimatedContainer>
          ))
        ) : (
                <>
              <AnimatedContainer delay={0.2}>
                  <StatCard
                    title="Total Businesses"
                    value={stats.totalBusinesses}
                    icon={Users}
                  />
              </AnimatedContainer>
              <AnimatedContainer delay={0.3}>
                  <StatCard
                    title="Emails Sent"
                    value={stats.emailsSent}
                    icon={Mail}
                  />
              </AnimatedContainer>
              <AnimatedContainer delay={0.4}>
                  <StatCard
                    title="Emails Opened"
                    value={stats.emailsOpened}
                    icon={CheckCircle2}
                  />
              </AnimatedContainer>
              <AnimatedContainer delay={0.5}>
                  <StatCard
                    title="Open Rate"
                    value={`${stats.openRate}% `}
                    icon={TrendingUp}
                  />
              </AnimatedContainer>
                </>
              )}
            </div>

            {/* Chart */}
      <AnimatedContainer delay={0.6}>
            <Card>
              <CardHeader>
                <CardTitle>Email Performance (Last 7 Days)</CardTitle>
              </CardHeader>
          <CardContent>
            <EmailChart data={chartData} loading={loadingStats} />
              </CardContent>
            </Card>
      </AnimatedContainer>

            {/* Business Table */}
            <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Leads ({businesses.length})</CardTitle>
          <Button variant="outline" asChild>
            <a href="/dashboard/businesses">View All</a>
          </Button>
              </CardHeader>
              <CardContent>
                <BusinessTable
            businesses={businesses.slice(0, 10)}
                  onViewDetails={handleViewDetails}
                  onSendEmail={handleSendEmail}
                />
              </CardContent>
            </Card>

            {/* Detail Modal */}
            <BusinessDetailModal
              business={selectedBusiness}
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              onSendEmail={handleSendEmail}
            />
          </div>
          );
}
