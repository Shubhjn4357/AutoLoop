import { expect, test } from "@playwright/test";

test.use({ baseURL: "http://127.0.0.1:7860" });

test("server is healthy", async ({ page }) => {
  const response = await page.goto("/");
  expect(response?.status()).toBe(200);
  const text = await page.innerText("body");
  expect(text).toContain("Autoloop Automation Server is running!");
});

test("health endpoint returns ok", async ({ page }) => {
  const response = await page.goto("/health");
  expect(response?.status()).toBe(200);
  const json = await response?.json();
  expect(json.status).toBe("ok");
});

test("protected api rejects unauthenticated requests", async ({ request }) => {
  const response = await request.get("/api/instagram/profile?userId=test");
  expect(response.status()).toBe(401);
});
