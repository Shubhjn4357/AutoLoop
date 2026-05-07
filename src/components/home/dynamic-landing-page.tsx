"use client";

import dynamic from "next/dynamic";

const LandingPageContent = dynamic(() => import("./landing-page-content"), {
  ssr: false
});

export function DynamicLandingPage() {
  return <LandingPageContent />;
}
