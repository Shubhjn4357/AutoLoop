import type { ScrapingOptions, BusinessData, ScraperSource } from "./types";
import { scrapeGoogleMapsReal } from "../scraper-real";

/**
 * Google Maps scraper - wrapper around existing implementation
 */
export const googleMapsScraper: ScraperSource = {
  name: "google-maps",
  displayName: "Google Maps",
  enabled: true,

  async scrape(options: ScrapingOptions, userId: string): Promise<BusinessData[]> {
    console.log(`📍 Google Maps: Scraping for "${options.keywords.join(", ")}" in ${options.location}`);

    try {
      const results = await scrapeGoogleMapsReal(options, userId);

      // Convert to BusinessData format
      const businesses: BusinessData[] = results.map((business) => ({
        name: business.name || "",
        address: business.address || undefined,
        phone: business.phone || undefined,
        email: business.email || undefined,
        website: business.website || undefined,
        rating: business.rating ? Number(business.rating) : undefined,
        reviewCount: business.totalReviews ? Number(business.totalReviews) : undefined,
        category: business.category || undefined,
        description: undefined, // Not available from scraper
        hours: undefined, // Not available from scraper  
        imageUrl: undefined, // Not available from scraper
        source: "google-maps",
        sourceUrl: business.website || undefined,
      }));

      console.log(`✅ Google Maps: Found ${businesses.length} businesses`);
      return businesses;
    } catch (error) {
      console.error("❌ Google Maps scraper failed:", error);
      return [];
    }
  },
};
