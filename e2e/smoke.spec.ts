import { expect, test } from "@playwright/test";

test("home page renders and links to login", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "AutoLoop" })).toBeVisible();
  await page.getByRole("link", { name: /Get Started/i }).click();
  await expect(page).toHaveURL(/\/login/);
});

test("login page exposes Google auth state", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByText(/Welcome to AutoLoop/i)).toBeVisible();
  await expect(page.getByRole("button", { name: /Sign in with Google/i })).toBeVisible();
});
