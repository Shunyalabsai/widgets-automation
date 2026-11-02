const { test, expect } = require("@playwright/test");
const { getEnvironment } = require("../config/environment");
const { ALL_SMOKE_PATHS } = require("../config/site-pages");
const { gotoSite } = require("../utils/site-helpers");

test.describe("[Site] Key public pages", () => {
  for (const route of ALL_SMOKE_PATHS) {
    test(`loads ${route}`, async ({ page }) => {
      const env = getEnvironment();
      const url = new URL(route, env.siteUrl).href;
      await gotoSite(page, url);
      await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible({ timeout: 30_000 });
      await expect(page.getByText(/This page could not be found|404/)).toHaveCount(0);
    });
  }
});
