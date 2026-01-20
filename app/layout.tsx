import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "./cursor-styles.css";
import { Providers } from "./providers";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "AutoLoop 🔄 - Automated Cold Email Outreach",
    template: "%s | AutoLoop 🔄",
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
  description:
    "Automate your cold email outreach with AI. Find, qualify, and reach out to your ideal customers automatically using Google Maps scraping and Gmail integration.",
  keywords: [
    "cold email",
    "email outreach",
    "automation",
    "AI",
    "AutoLoop",
    "Google Maps scraping",
    "lead generation",
    "email marketing",
  ],
  authors: [{ name: "Shubh Jain" }],
  creator: "Shubh Jain",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://shubhjn-autoloop.hf.space",
    title: "AutoLoop - Automated Cold Email Outreach",
    description: "Automate your cold email outreach with AI-powered lead generation",
    siteName: "AutoLoop",
  },
  twitter: {
    card: "summary_large_image",
    title: "AutoLoop - Automated Cold Email Outreach",
    description: "Automate your cold email outreach with AI-powered lead generation",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
  }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.variable}>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
