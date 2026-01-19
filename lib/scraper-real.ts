import puppeteer from "puppeteer";
import { Business } from "@/types";
import { db } from "@/db";
import { businesses, scrapingJobs } from "@/db/schema";
import { eq } from "drizzle-orm";

interface ScrapingOptions {
  keywords: string[];
  location?: string;
  limit?: number;
}

/**
 * Real Google Maps scraping using Puppeteer
 * Scrapes business data including name, address, phone, email, website, rating, and reviews
 */
export async function scrapeGoogleMapsReal(
  options: ScrapingOptions,
  userId: string
): Promise<Partial<Business>[]> {
  const { keywords, location = "United States", limit = 20 } = options;
  const results: Partial<Business>[] = [];

  let browser;
  try {
    // Launch headless browser
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();

    // Set user agent to avoid detection
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    );

    for (const keyword of keywords) {
      try {
        // Navigate to Google Maps search
        const searchUrl = `https://www.google.com/maps/search/${encodeURIComponent(
          keyword + " " + location
        )}`;
        
        await page.goto(searchUrl, { waitUntil: "networkidle2", timeout: 30000 });
        
        // Wait for results to load
        await page.waitForSelector('div[role="feed"]', { timeout: 10000 });

        // Scroll to load more results
        await autoScroll(page);

        // Extract business data
        const businessData = await page.evaluate(() => {
          const items = Array.from(
            document.querySelectorAll('div[role="feed"] > div > div[role="article"]')
          );

          return items.map((item) => {
            const titleEl = item.querySelector('div.fontHeadlineSmall');
            const ratingEl = item.querySelector('span[role="img"]');
            const reviewsEl = item.querySelector('span[role="img"] + span');
            const addressEl = item.querySelector('div.fontBodyMedium > div:nth-child(2) > div:nth-child(2)');
            const descriptionEl = item.querySelector('div.fontBodyMedium span');
            const imageEl = item.querySelector('img');
            
            const name = titleEl?.textContent?.trim() || "";
            const ratingText = ratingEl?.getAttribute("aria-label") || "";
            const rating = parseFloat(ratingText.match(/[\d.]+/)?.[0] || "0");
            const reviewsText = reviewsEl?.textContent?.trim() || "0";
            const reviewCount = parseInt(reviewsText.replace(/[^\d]/g, "") || "0");
            const address = addressEl?.textContent?.trim() || "";
            const description = descriptionEl?.textContent?.trim() || "";
            const imageUrl = imageEl?.getAttribute("src") || "";

            return { name, rating, reviewCount, address, description, imageUrl };
          });
        });

        // Process each business
        for (const business of businessData.slice(0, limit)) {
          if (!business.name) continue;

          // Try to find email and website by clicking on the business
          try {
            const businessName = business.name;
            const businessLink = await page.$(
              `a:has-text("${businessName}")`
            );
            
            if (businessLink) {
              await businessLink.click();
              await new Promise(resolve => setTimeout(resolve, 2000));

              // Extract additional details
              const details = await page.evaluate(() => {
                const websiteEl = document.querySelector(
                  'a[data-item-id="authority"]'
                );
                const phoneEl = document.querySelector(
                  'button[data-item-id^="phone"]'
                );

                return {
                  website: websiteEl?.getAttribute("href") || null,
                  phone: phoneEl?.getAttribute("aria-label")?.replace("Phone: ", "") || null,
                };
              });

              // Estimate email from website
              const email = details.website
                ? await extractEmailFromWebsite(details.website)
                : await generateEmail(businessName);

              results.push({
                userId,
                name: business.name,
                email,
                phone: details.phone || null,
                website: details.website || null,
                address: business.address,
                rating: business.rating,
                totalReviews: business.reviewCount,
                category: keyword,
                source: "google_maps",
                emailStatus: "pending",
                lastContactedAt: null,
              });

              // Go back to search results
              await page.goBack();
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          } catch (error) {
            console.error(`Error processing business ${business.name}:`, error);
            // Add without detailed info
            results.push({
              userId,
              name: business.name,
              email: await generateEmail(business.name),
              address: business.address,
              rating: business.rating,
              totalReviews: business.reviewCount,
              category: keyword,
              source: "google_maps",
              emailStatus: "pending",
              description: business.description || null,
              logo: business.imageUrl || null,
            });
          }

          if (results.length >= limit) break;
        }

        if (results.length >= limit) break;
      } catch (error) {
        console.error(`Error scraping keyword "${keyword}":`, error);
      }
    }

    return results;
  } catch (error) {
    console.error("Error in Google Maps scraping:", error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * Auto-scroll to load more results
 */
async function autoScroll(page: import("puppeteer").Page) {
  await page.evaluate(async () => {
    const feed = document.querySelector('div[role="feed"]');
    if (feed) {
      for (let i = 0; i < 3; i++) {
        feed.scrollTop = feed.scrollHeight;
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }
  });
}

/**
 * Extract email from website using basic scraping
 */
async function extractEmailFromWebsite(website: string): Promise<string | null> {
  try {
    const axios = (await import("axios")).default;
    const response = await axios.get(website, { timeout: 5000 });
    const html = response.data;

    // Simple email regex
    const emailRegex = /[\w.-]+@[\w.-]+\.\w+/g;
    const emails = html.match(emailRegex);

    if (emails && emails.length > 0) {
      // Filter out common non-business emails
      const filtered = emails.filter(
        (email: string) =>
          !email.includes("example.com") &&
          !email.includes("domain.com") &&
          !email.includes("wixpress.com")
      );
      return filtered[0] || null;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Generate estimated email from business name
 */
function generateEmail(businessName: string): string {
  const cleaned = businessName
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, "");
  
  const domain = `${cleaned}.com`;
  return `info@${domain}`;
}

/**
 * Background scraping service with Redis queue
 */
export class RealScrapingService {
  private isRunning = false;

  async start() {
    this.isRunning = true;
    console.log("🚀 Real scraping service started");

    while (this.isRunning) {
      try {
        // Find pending scraping jobs
        const pendingJobs = await db.query.scrapingJobs.findMany({
          where: eq(scrapingJobs.status, "pending"),
          limit: 1,
        });

        for (const job of pendingJobs) {
          try {
            // Update job status to running
            await db
              .update(scrapingJobs)
              .set({ status: "running" })
              .where(eq(scrapingJobs.id, job.id));

            // Perform scraping
            const results = await scrapeGoogleMapsReal(
              { keywords: job.keywords as string[], limit: 50 },
              job.userId
            );

            // Save results to database
            if (results.length > 0) {
              console.log("🚀 Saving results to database");
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              await db.insert(businesses).values(results as any);
            }

            // Update job as completed
            await db
              .update(scrapingJobs)
              .set({
                status: "completed",
                businessesFound: results.length,
                completedAt: new Date(),
              })
              .where(eq(scrapingJobs.id, job.id));

            console.log(
              `✅ Scraping job ${job.id} completed: ${results.length} businesses found`
            );
          } catch (error) {
            console.error(`❌ Scraping job ${job.id} failed:`, error);
            await db
              .update(scrapingJobs)
              .set({ status: "failed" })
              .where(eq(scrapingJobs.id, job.id));
          }
        }

        // Wait before checking for new jobs
        await new Promise((resolve) => setTimeout(resolve, 10000));
      } catch (error) {
        console.error("Error in scraping service:", error);
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    }
  }

  stop() {
    this.isRunning = false;
    console.log("🛑 Scraping service stopped");
  }
}
