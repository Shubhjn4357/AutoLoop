import puppeteer from "puppeteer";
import type { ScrapingOptions, BusinessData, ScraperSource } from "./types";

/**
 * Google Search scraper - extracts business data from Google search results
 */
export const googleSearchScraper: ScraperSource = {
    name: "google-search",
    displayName: "Google Search",
    enabled: true,

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async scrape(options: ScrapingOptions, _userId: string): Promise<BusinessData[]> {
        const { keywords, location, limit = 20 } = options;
        const businesses: BusinessData[] = [];

        console.log(`🔍 Google Search: Scraping for "${keywords.join(", ")}" in ${location}`);

        try {
            const browser = await puppeteer.launch({
                headless: true,
                args: ["--no-sandbox", "--disable-setuid-sandbox"],
            });

            const page = await browser.newPage();
            await page.setUserAgent(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            );

            for (const keyword of keywords) {
                if (businesses.length >= limit) break;

                const query = `${keyword} in ${location}`;
                const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;

                console.log(`  Searching: ${query}`);
                await page.goto(searchUrl, { waitUntil: "networkidle2" });

                // Extract business data from search results
                const results = await page.evaluate(() => {
                    const items: Array<{
                        name: string;
                        website: string;
                        description: string;
                        phone?: string;
                        email?: string;
                        source: string;
                        sourceUrl: string;
                    }> = [];

                    // Look for business-related search results
                    const searchResults = document.querySelectorAll(".g, .tF2Cxc");

                    searchResults.forEach((result) => {
                        try {
                            const titleEl = result.querySelector("h3");
                            const linkEl = result.querySelector("a");
                            const snippetEl = result.querySelector(".VwiC3b, .aCOpRe");

                            if (!titleEl || !linkEl) return;

                            const name = titleEl.textContent?.trim() || "";
                            const website = linkEl.getAttribute("href") || "";
                            const description = snippetEl?.textContent?.trim() || "";

                            // Try to extract phone and email from snippet
                            const phoneMatch = description.match(/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
                            const emailMatch = description.match(/[\w.-]+@[\w.-]+\.\w+/);

                            if (name && website) {
                                items.push({
                                    name,
                                    website,
                                    description: description.substring(0, 200),
                                    phone: phoneMatch ? phoneMatch[0] : undefined,
                                    email: emailMatch ? emailMatch[0] : undefined,
                                    source: "google-search",
                                    sourceUrl: website,
                                });
                            }
                        } catch (_err) {
                            console.error("❌ Google Search scraper failed:", _err);
                            // Skip invalid results
                        }
                    });

                    return items;
                });

                businesses.push(...results);
                console.log(`  Found ${results.length} results for "${keyword}"`);

                // Random delay to avoid rate limiting
                await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 2000));
            }

            await browser.close();
            console.log(`✅ Google Search: Found ${businesses.length} businesses`);

            return businesses.slice(0, limit);
        } catch (error) {
            console.error("❌ Google Search scraper failed:", error);
            return businesses;
        }
    },
};
