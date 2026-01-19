import type { ScrapingOptions, BusinessData, ScraperSourceName } from "./types";
import { googleMapsScraper } from "./google-maps";
import { googleSearchScraper } from "./google-search";

/**
 * Scraper Manager - orchestrates multiple scraping sources
 */

// Registry of all available scrapers
const scrapers = {
    "google-maps": googleMapsScraper,
    "google-search": googleSearchScraper,
    // Future scrapers:
    // "linkedin": linkedinScraper,
    // "facebook": facebookScraper,
    // "instagram": instagramScraper,
};

export interface MultiSourceScrapingOptions extends ScrapingOptions {
    sources?: ScraperSourceName[];
}

/**
 * Scrape from multiple sources and merge results
 */
export async function scrapeMultiSource(
    options: MultiSourceScrapingOptions,
    userId: string
): Promise<BusinessData[]> {
    const { sources = ["google-maps"], ...scrapingOptions } = options;

    console.log(`\n🌐 Multi-Source Scraping Started`);
    console.log(`   Sources: ${sources.join(", ")}`);
    console.log(`   Keywords: ${scrapingOptions.keywords.join(", ")}`);
    console.log(`   Location: ${scrapingOptions.location}`);

    const allBusinesses: BusinessData[] = [];

    // Scrape from each source
    for (const sourceName of sources) {
        const scraper = scrapers[sourceName as keyof typeof scrapers];

        if (!scraper) {
            console.warn(`⚠️  Scraper not found: ${sourceName}`);
            continue;
        }

        if (!scraper.enabled) {
            console.log(`⏭️  Skipping disabled scraper: ${sourceName}`);
            continue;
        }

        try {
            const results = await scraper.scrape(scrapingOptions, userId);
            allBusinesses.push(...results);
        } catch (error) {
            console.error(`❌ Error scraping from ${sourceName}:`, error);
        }
    }

    // Deduplicate and merge results
    const merged = deduplicateBusinesses(allBusinesses);

    console.log(`\n✅ Multi-Source Scraping Complete`);
    console.log(`   Total raw results: ${allBusinesses.length}`);
    console.log(`   After deduplication: ${merged.length}`);

    return merged;
}

/**
 * Deduplicate businesses based on name and location similarity
 */
function deduplicateBusinesses(businesses: BusinessData[]): BusinessData[] {
    const uniqueMap = new Map<string, BusinessData>();

    for (const business of businesses) {
        // Create a unique key based on normalized name
        const key = business.name.toLowerCase().replace(/[^a-z0-9]/g, "");

        if (uniqueMap.has(key)) {
            // Merge data from multiple sources
            const existing = uniqueMap.get(key)!;
            uniqueMap.set(key, mergeBusinessData(existing, business));
        } else {
            uniqueMap.set(key, business);
        }
    }

    return Array.from(uniqueMap.values());
}

/**
 * Merge business data from multiple sources
 * Prioritizes more complete data
 */
function mergeBusinessData(
    existing: BusinessData,
    newData: BusinessData
): BusinessData {
    return {
        // Keep existing name
        name: existing.name,

        // Prefer non-empty values
        address: existing.address || newData.address,
        phone: existing.phone || newData.phone,
        email: existing.email || newData.email,
        website: existing.website || newData.website,

        // Keep highest rating
        rating: Math.max(existing.rating || 0, newData.rating || 0) || undefined,
        reviewCount: Math.max(existing.reviewCount || 0, newData.reviewCount || 0) || undefined,

        // Merge categories
        category: existing.category || newData.category,

        // Prefer longer description
        description:
            (existing.description?.length || 0) > (newData.description?.length || 0)
                ? existing.description
                : newData.description,

        hours: existing.hours || newData.hours,
        imageUrl: existing.imageUrl || newData.imageUrl,

        // Combine sources
        source: `${existing.source},${newData.source}`,
        sourceUrl: existing.sourceUrl || newData.sourceUrl,

        // Merge social media links
        socialMedia: {
            linkedin: existing.socialMedia?.linkedin || newData.socialMedia?.linkedin,
            facebook: existing.socialMedia?.facebook || newData.socialMedia?.facebook,
            instagram: existing.socialMedia?.instagram || newData.socialMedia?.instagram,
            twitter: existing.socialMedia?.twitter || newData.socialMedia?.twitter,
        },
    };
}

/**
 * Get list of available scrapers
 */
export function getAvailableScrapers() {
    return Object.entries(scrapers).map(([name, scraper]) => ({
        name: name as ScraperSourceName,
        displayName: scraper.displayName,
        enabled: scraper.enabled,
    }));
}
