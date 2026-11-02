const { test, expect } = require("@playwright/test");
const { getEnvironment } = require("../config/environment");
const { gotoSite } = require("../utils/site-helpers");

test.describe("[Site] Production www navigation", () => {
  test("homepage loads with primary hero and demo section", async ({ page }) => {
    const env = getEnvironment();
    await gotoSite(page, env.siteUrl);
    await expect(page).toHaveTitle(/Shunya Labs/i);
    await expect(page.getByRole("heading", { name: /Information Paradox/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Ask it something/i })).toBeVisible();
  });

  test("docs and playground entry pages load", async ({ page }) => {
    const env = getEnvironment();
    await gotoSite(page, env.docsUrl);
    await expect(page).toHaveURL(/\/docs/);
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible({ timeout: 30_000 });

    await gotoSite(page, env.playgroundUrl);
    await expect(page).toHaveURL(/\/playground|sign-in.*playground/i, { timeout: 30_000 });
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible({ timeout: 30_000 });
  });
});
