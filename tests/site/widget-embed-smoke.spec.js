const { test, expect } = require("@playwright/test");
const { getEnvironment } = require("../config/environment");
const { MODULES } = require("../pages/widget-page");
const { gotoSite } = require("../utils/site-helpers");

const EMBED_SMOKE = ["vak", "zero stt indic", "zero tts indic", "zero stt med", "zero stt codeswitch"];

test.describe("[Site] Widget embeds on www", () => {
  for (const moduleName of EMBED_SMOKE) {
    test(`${moduleName} embed loads`, async ({ page }) => {
      const env = getEnvironment();
      const config = MODULES[moduleName];
      const suffix = config.slug === "vak" ? "&inlinePickers=1" : "";
      const url = `${env.widgetPageBase}?widget=${config.slug}-v2&embed=1${suffix}`;
      await gotoSite(page, url);
      await expect(page).toHaveURL(/\/widget\?widget=/);
      if (config.slug === "zero-tts-indic") {
        await expect(page.locator("textarea").first()).toBeVisible({ timeout: 60_000 });
      } else if (config.slug === "vak") {
        await expect(page.locator("textarea[placeholder*='source language' i]")).toBeVisible({
          timeout: 60_000,
        });
      } else {
        await expect(page.getByRole("tab", { name: /Sample clips/i })).toBeVisible({ timeout: 60_000 });
      }
    });
  }
});
