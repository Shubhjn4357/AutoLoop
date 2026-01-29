"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Play, Sparkles } from "lucide-react";
import { BusinessTypeSelect } from "@/components/business-type-select";
import { KeywordInput } from "@/components/keyword-input";
import { ActiveTaskCard } from "@/components/active-task-card";
import { useApi } from "@/hooks/use-api";
import { toast } from "sonner";
import { allLocations } from "@/lib/locations";
import { sendNotification } from "@/components/notification-bell";

interface ScraperTask {
  id: string;
  type?: string;
  status: string;
  workflowName?: string;
  businessesFound?: number;
}

export default function ScraperPage() {
  const [businessType, setBusinessType] = useState<string>("");
  const [location, setLocation] = useState<string>("");
  const [keywords, setKeywords] = useState<string[]>([]);
  const [scrapingSources, setScrapingSources] = useState<string[]>(["google-maps", "google-search"]);
  const [isScrapingStarted, setIsScrapingStarted] = useState(false);
  const [isGeneratingKeywords, setIsGeneratingKeywords] = useState(false);
  const [activeTask, setActiveTask] = useState<ScraperTask | null>(null);

  const { post: startScraping } = useApi();
  const { post: generateKeywords } = useApi<{ keywords: string[] }>();
  const { get: getActiveTasks } = useApi<{ tasks: ScraperTask[] }>();

  const handleStartScraping = async () => {
    if (!businessType || !location) return;

    setIsScrapingStarted(true);
    try {
      const result = await startScraping("/api/scraping/start", {
        targetBusinessType: businessType,
        keywords,
        location,
        sources: scrapingSources,
      });

      if (result) {
        sendNotification({
          title: "Scraping job started!",
          message: "Check the Tasks page to monitor progress.",
          type: "success",
          link: "/dashboard/tasks",
          actionLabel: "View Tasks"
        });

        // Fetch active task immediately to show updated status
        const tasksData = await getActiveTasks("/api/tasks");
        if (tasksData?.tasks) {
          const activeJob = tasksData.tasks.find(t => t.type === 'scraping' && (t.status === 'processing' || t.status === 'paused'));
          if (activeJob) {
            setActiveTask(activeJob);
          }
        }
      }
    } catch (error) {
      console.error("Scraping error:", error);
      toast.error("Failed to start scraping");
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
      console.error("Keyword generation error:", error);
      toast.error("Failed to generate keywords");
    } finally {
      setIsGeneratingKeywords(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Lead Scraper</h1>
        <p className="text-muted-foreground">
          Find local businesses and build your lead database.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Start New Search</CardTitle>
          <CardDescription>
            Configure your scraping parameters below.
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
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
              </Button>
            </div>
            <KeywordInput
              businessTypeId={businessType}
              value={keywords}
              onChange={setKeywords}
              placeholder="Add relevant keywords..."
            />
          </div>

          <div className="space-y-2">
            <Label>Scraping Sources</Label>
            <div className="flex flex-wrap gap-3">
              {["google-maps", "google-search", "linkedin", "facebook", "instagram"].map((source) => (
                <label key={source} className="flex items-center gap-2 cursor-pointer border p-2 rounded hover:bg-muted">
                  <Checkbox
                    checked={scrapingSources.includes(source)}
                    onCheckedChange={(checked) => {
                      if (checked) setScrapingSources([...scrapingSources, source]);
                      else setScrapingSources(scrapingSources.filter(s => s !== source));
                    }}
                  />
                  <span className="text-sm capitalize">{source.replace('-', ' ')}</span>
                </label>
              ))}
            </div>
          </div>
          <Button
            onClick={handleStartScraping}
            disabled={isScrapingStarted || !businessType || !location}
            className="w-full cursor-pointer"
            size="lg"
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

          {activeTask && (
            <div className="mt-4">
              <ActiveTaskCard
                jobId={activeTask.id}
                workflowName={activeTask.workflowName || ""}
                status={activeTask.status}
                businessesFound={activeTask.businessesFound || 0}
                onDismiss={() => setActiveTask(null)}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
