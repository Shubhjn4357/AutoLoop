import { render, screen, cleanup } from "@testing-library/react";
import { describe, it, expect, afterEach } from "vitest";
import Home from "@/app/page";

afterEach(() => cleanup());

describe("Home Page", () => {
  it("renders the primary headline", () => {
    render(<Home />);
    const headline = screen.getByText(/Automate Instagram DMs like a Pro/i);
    expect(headline).toBeInTheDocument();
  });

  it("renders all three feature card headings", () => {
    render(<Home />);
    // Use getAllByRole since multiple h-levels exist; then filter by level 3
    const headings = screen.getAllByRole("heading", { level: 3 });
    const headingTexts = headings.map(h => h.textContent);
    expect(headingTexts).toContain("Fast Replies");
    expect(headingTexts).toContain("Secure API");
    expect(headingTexts).toContain("Keyword Matching");
  });

  it("renders Get Started CTA link", () => {
    render(<Home />);
    const cta = screen.getByText(/Open Dashboard/i);
    expect(cta).toBeInTheDocument();
  });

  it("renders footer", () => {
    render(<Home />);
    expect(screen.getByText(/Hugging Face Docker/i)).toBeInTheDocument();
  });
});
