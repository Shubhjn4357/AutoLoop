import { render, screen, cleanup } from "@testing-library/react";
import { describe, it, expect, afterEach, vi } from "vitest";
import type { ReactNode } from "react";
import { LandingPage } from "@/components/home/landing-page";

// Mock framer-motion
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: { children: ReactNode }) => <div {...props}>{children}</div>,
    h1: ({ children, ...props }: { children: ReactNode }) => <h1 {...props}>{children}</h1>,
    p: ({ children, ...props }: { children: ReactNode }) => <p {...props}>{children}</p>,
    article: ({ children, ...props }: { children: ReactNode }) => <article {...props}>{children}</article>,
  },
  AnimatePresence: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

afterEach(() => cleanup());

describe("Home Page", () => {
  it("renders the primary headline", () => {
    render(<LandingPage />);
    const headline = screen.getByRole("heading", { name: /Automate Instagram/i, level: 1 });
    expect(headline).toBeInTheDocument();
  });

  it("renders all three feature card headings", () => {
    render(<LandingPage />);
    const headings = screen.getAllByRole("heading", { level: 3 });
    const headingTexts = headings.map(h => h.textContent);
    expect(headingTexts).toContain("Fast Replies");
    expect(headingTexts).toContain("Secure API");
    expect(headingTexts).toContain("Keyword Matching");
  });

  it("renders Open Dashboard link", () => {
    render(<LandingPage />);
    const cta = screen.getByText(/Open Dashboard/i);
    expect(cta).toBeInTheDocument();
  });

  it("renders footer", () => {
    render(<LandingPage />);
    expect(screen.getByText(/Built for Instagram Business/i)).toBeInTheDocument();
  });
});
