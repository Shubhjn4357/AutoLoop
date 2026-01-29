/**
 * Base types and interfaces for all scrapers
 */

export interface ScrapingOptions {
  keywords: string[];
  location: string;
  limit?: number;
}

export interface BusinessData {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  rating?: number;
  reviewCount?: number;
  category?: string;
  description?: string;
  hours?: string;
  imageUrl?: string;
  socialMedia?: {
    linkedin?: string;
    facebook?: string;
    instagram?: string;
    twitter?: string;
  };
  source: string; // Source where this data was found
  sourceUrl?: string; // Original listing URL
  emailStatus?: string | null;
}

export interface ScraperSource {
  name: string;
  displayName: string;
  enabled: boolean;
  scrape(options: ScrapingOptions, userId?: string): Promise<BusinessData[]>;
}

export type ScraperSourceName = 
  | "google-maps"
  | "google-search"
  | "linkedin"
  | "facebook"
  | "instagram";
