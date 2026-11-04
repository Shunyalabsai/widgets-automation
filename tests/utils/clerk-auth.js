const { getEnvironment } = require("../config/environment");
const { gotoSite } = require("./site-helpers");

function getTestCredentials() {
  const email = process.env.SHUNYA_TEST_EMAIL || "";
  const password = process.env.SHUNYA_TEST_PASSWORD || "";
  return { email, password };
}

function hasTestCredentials() {
  const { email, password } = getTestCredentials();
  return Boolean(email && password);
}

/**
 * Clerk email + password sign-in on www/stage. Leaves page on redirect target when successful.
 * @param {import('@playwright/test').Page} page
 * @param {{ redirectPath?: string, baseOrigin?: string }} [options]
 */
async function signInWithClerk(page, options = {}) {
  const env = getEnvironment();
  const { email, password } = getTestCredentials();
  if (!email || !password) {
    throw new Error(
      "Missing SHUNYA_TEST_EMAIL / SHUNYA_TEST_PASSWORD. Set them in .env (see .env.example).",
    );
  }

  const redirectPath = options.redirectPath ?? "/playground";
  const origin = options.baseOrigin || env.siteOrigin;
  const targetUrl = `${origin}${redirectPath.startsWith("/") ? redirectPath : `/${redirectPath}`}`;
  await gotoSite(page, targetUrl);
  if (!page.url().includes("/sign-in")) {
    return;
  }

  const signInUrl = `${origin}/sign-in?redirect_url=${encodeURIComponent(redirectPath)}`;
  await gotoSite(page, signInUrl);

  const emailInput = page.locator('input[name="identifier"], input[type="email"]').first();
  await emailInput.waitFor({ state: "visible", timeout: 30_000 });
  await emailInput.fill(email);

  await page.getByRole("button", { name: /^Continue$/i }).click();

  const passwordInput = page.locator('input[name="password"], input[type="password"]').first();
  await passwordInput.waitFor({ state: "visible", timeout: 30_000 });
  await passwordInput.fill(password);

  await page.getByRole("button", { name: /^Continue$/i }).click();

  await page.waitForURL(
    (url) => !url.pathname.includes("/sign-in"),
    { timeout: 90_000 },
  );
}

async function signInToPlayground(page) {
  const env = getEnvironment();
  await signInWithClerk(page, { redirectPath: "/playground", baseOrigin: env.siteOrigin });
  await page.waitForURL(/\/playground/, { timeout: 60_000 });
}

module.exports = {
  getTestCredentials,
  hasTestCredentials,
  signInWithClerk,
  signInToPlayground,
};
