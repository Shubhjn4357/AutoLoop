import { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://autoloop.com"),
  title: {
    default: "AutoLoop - AI-Powered Cold Email Outreach Automation",
    template: "%s | AutoLoop",
  },
  description:
    "Automate your cold email outreach with AI. Find, qualify, and reach out to your ideal customers automatically using Google Maps scraping, AI personalization, and Gmail integration. Scale your B2B sales with AutoLoop.",
  keywords: [
    "cold email",
    "email outreach",
    "AI email automation",
    "AutoLoop",
    "Google Maps scraping",
    "lead generation",
    "email marketing",
    "B2B sales automation",
    "email warm-up",
    "lead enrichment",
    "sales automation",
    "email personalization",
    "deliverability",
    "SPF DKIM DMARC",
    "email sequences",
    "sales outreach",
  ],
  authors: [{ name: "AutoLoop Team" }],
  creator: "AutoLoop",
  publisher: "AutoLoop",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://autoloop.com",
    title: "AutoLoop - AI-Powered Cold Email Outreach Automation",
    description:
      "Automate your cold email outreach with AI-powered lead generation. Find ideal customers, personalize at scale, and track results with advanced analytics.",
    siteName: "AutoLoop",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "AutoLoop - Cold Email Automation Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AutoLoop - AI-Powered Cold Email Outreach Automation",
    description:
      "Automate your cold email outreach with AI-powered lead generation and personalization at scale.",
    images: ["/og-image.png"],
    creator: "@autoloop",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "your-google-verification-code",
    yandex: "your-yandex-verification-code",
  },
  alternates: {
    canonical: "https://autoloop.com",
  },
  category: "technology",
};

// JSON-LD Structured Data for SEO
export const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "AutoLoop",
  "applicationCategory": "BusinessApplication",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD",
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "ratingCount": "250",
  },
  "description":
    "AI-powered cold email outreach automation platform for B2B sales teams. Automate lead generation, email personalization, and follow-up sequences.",
  "featureList": [
    "AI Email Personalization",
    "Automated Lead Generation",
    "Email Warm-up System",
    "Google Maps Scraping",
    "Advanced Analytics",
    "Email Sequence Builder",
  ],
};
