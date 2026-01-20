import puppeteer from "puppeteer";
import type { ScrapingOptions, BusinessData, ScraperSource } from "./types";

export const instagramScraper: ScraperSource = {
    name: "instagram",
    displayName: "Instagram",
    enabled: true,

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async scrape(options: ScrapingOptions, _userId: string): Promise<BusinessData[]> {
        const { keywords, location, limit = 20 } = options;
        const businesses: BusinessData[] = [];

        console.log(`🔍 Instagram Scraper: Searching for "${keywords.join(", ")}" in ${location}`);

        try {
            const browser = await puppeteer.launch({
                headless: true,
                args: ["--no-sandbox", "--disable-setuid-sandbox"],
            });

            const page = await browser.newPage();
            await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36");

            for (const keyword of keywords) {
                if (businesses.length >= limit) break;

                const query = `site:instagram.com ${keyword} ${location}`;
                const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;

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
                            name = name.replace(/ • Instagram photos and videos$/, "").replace(/ \| Instagram$/, "");
                            // Often Instagram titles are "Name (@username) ..."
                            const handleMatch = name.match(/\(@([^)]+)\)/);
                            if (handleMatch) {
                                name = handleMatch[1]; // Use handle as name if found
                            }

                            const website = linkEl.getAttribute("href") || "";
                            const description = snippetEl?.textContent?.trim() || "";

                            if (name && website.includes("instagram.com")) {
                                items.push({
                                    name,
                                    website,
                                    description: description.substring(0, 200),
                                    source: "instagram",
                                    sourceUrl: website,
                                    address: "Instagram Profile",
                                    category: "Social Profile"
                                });
                            }
                        } catch { }
                    });
                    return items;
                });

                businesses.push(...results);
                await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 2000));
            }

            await browser.close();
            return businesses.slice(0, limit);
        } catch (error) {
            console.error("❌ Instagram scraper failed:", error);
            return businesses;
        }
    },
};
