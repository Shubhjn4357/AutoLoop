// Simple in-memory scraper for Google Maps data
// In production, you'd use a proper scraping service or API

import { Business } from "@/types";

interface ScraperOptions {
  keywords: string[];
  location?: string;
  maxResults?: number;
}

// This is a placeholder implementation
// In production, you would integrate with a real Google Maps scraping service
// or use the Google Places API

export async function scrapeGoogleMaps(
  options: ScraperOptions,
  userId: string
): Promise<Business[]> {
  const { keywords, location = "United States", maxResults = 50 } = options;

  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Generate mock data for demonstration
  const businesses: Partial<Business>[] = [];

  for (const keyword of keywords) {
    for (let i = 0; i < Math.min(10, maxResults); i++) {
      const business: Partial<Business> = {
        userId,
        name: `${keyword} Business ${i + 1}`,
        email: `contact${i}@${keyword.toLowerCase().replace(/\s+/g, "")}.com`,
        phone: `+1-555-${Math.floor(Math.random() * 9000) + 1000}`,
        website: Math.random() > 0.3 ? `https://www.${keyword.toLowerCase().replace(/\s+/g, "")}-${i}.com` : null,
        address: `${100 + i} Main St, ${location}`,
        category: keyword,
        rating: Math.random() * 2 + 3, // 3-5 stars
        reviewCount: Math.floor(Math.random() * 500),
        latitude: 40.7128 + (Math.random() - 0.5) * 0.1,
        longitude: -74.006 + (Math.random() - 0.5) * 0.1,
        emailSent: false,
        emailSentAt: null,
        emailStatus: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      businesses.push(business);
    }
  }

  return businesses as Business[];
}

// Background job to continuously scrape
export class ScrapingService {
  private isRunning = false;
  private intervalId: NodeJS.Timeout | null = null;

  async start(workflowId: string, keywords: string[], userId: string) {
    if (this.isRunning) {
      console.log("Scraping service is already running");
      return;
    }

    this.isRunning = true;
    console.log(`Starting scraping service for workflow ${workflowId}`);

    // Initial scrape
    await this.scrapeAndSave(keywords, userId);

    // Continue scraping every 6 hours
    this.intervalId = setInterval(
      async () => {
        await this.scrapeAndSave(keywords, userId);
      },
      6 * 60 * 60 * 1000
    );
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log("Scraping service stopped");
  }

  private async scrapeAndSave(keywords: string[], userId: string) {
    try {
      console.log("Starting scraping job...");
      const businesses = await scrapeGoogleMaps({ keywords }, userId);

      // Save to database
      const dbModule = await import("@/db");
      const schemaModule = await import("@/db/schema");

      await dbModule.db.insert(schemaModule.businesses).values(businesses);

      console.log(`Scraped and saved ${businesses.length} businesses`);
    } catch (error) {
      console.error("Error in scraping job:", error);
    }
  }
}
