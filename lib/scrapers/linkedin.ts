import puppeteer from "puppeteer";
import type { ScrapingOptions, BusinessData, ScraperSource } from "./types";

/**
 * LinkedIn Scraper (via Google) - extracts company profiles from Google search results
 */
export const linkedinScraper: ScraperSource = {
    name: "linkedin",
    displayName: "LinkedIn",
    enabled: true,

    async scrape(options: ScrapingOptions): Promise<BusinessData[]> {
        const { keywords, location, limit = 20 } = options;
        const businesses: BusinessData[] = [];

        console.log(`🔍 LinkedIn Scraper: Searching for "${keywords.join(", ")}" in ${location}`);

        let browser;
        try {
            browser = await puppeteer.launch({
                headless: true,
                args: ["--no-sandbox", "--disable-setuid-sandbox"],
            });

            const page = await browser.newPage();
            await page.setUserAgent(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            );

            for (const keyword of keywords) {
                if (businesses.length >= limit) break;

                // Targeted search for LinkedIn Company pages
                const query = `site:linkedin.com/company ${keyword} ${location}`;
                const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;

                console.log(`  Searching: ${query}`);
                await page.goto(searchUrl, { waitUntil: "networkidle2" });

                const results = await page.evaluate(() => {
                    const items: BusinessData[] = [];
                    const searchResults = document.querySelectorAll(".g, .tF2Cxc");

                    searchResults.forEach((result) => {
                        try {
                            const titleEl = result.querySelector("h3");
                            const linkEl = result.querySelector("a");
                            const snippetEl = result.querySelector(".VwiC3b, .aCOpRe");

                            if (!titleEl || !linkEl) return;

                            let name = titleEl.textContent?.trim() || "";
                            // Clean up LinkedIn title suffix
                            name = name.replace(/ \| LinkedIn$/, "").replace(/ - LinkedIn$/, "").replace(/: LinkedIn$/, "");

                            const website = linkEl.getAttribute("href") || "";
                            const description = snippetEl?.textContent?.trim() || "";

                            // Validation: Only accept actual LinkedIn Company URLs
                            if (name && website.includes("linkedin.com/company")) {
                                items.push({
                                    name,
                                    website, // LinkedIn URL as website
                                    description: description.substring(0, 200),
                                    source: "linkedin",
                                    sourceUrl: website,
                                    address: "LinkedIn Profile",
                                    category: "Company Profile",
                                    phone: undefined,
                                    email: undefined,
                                    rating: undefined,
                                    reviewCount: undefined
                                });
                            }
                        } catch {
                            // Ignore errors
                        }
                    });
                    return items;
                });

                // Remove duplicates based on website (LinkedIn URL)
                const uniqueResults = results.filter(r =>
                    !businesses.some(b => b.website === r.website)
                );

                businesses.push(...uniqueResults);

                // Rate limit delay
                await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 2000));
            }

            return businesses.slice(0, limit);
        } catch (error) {
            console.error("❌ LinkedIn scraper failed:", error);
            return businesses;
        } finally {
            if (browser) {
                await browser.close();
            }
        }
    },
};
