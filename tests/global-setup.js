const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");
const { loadEnvFile } = require("./utils/load-env");
const { hasTestCredentials, signInToPlayground } = require("./utils/clerk-auth");

const AUTH_DIR = path.resolve(__dirname, "../.auth");
const PLAYGROUND_AUTH = path.join(AUTH_DIR, "playground.json");

async function globalSetup() {
  loadEnvFile();
  fs.mkdirSync(AUTH_DIR, { recursive: true });
  if (!hasTestCredentials()) {
    fs.writeFileSync(PLAYGROUND_AUTH, JSON.stringify({ cookies: [], origins: [] }));
    return;
  }

  const force =
    process.env.PLAYGROUND_FORCE_AUTH === "1" || process.env.CI === "1";
  const maxAgeMs = 6 * 60 * 60 * 1000;
  if (!force && fs.existsSync(PLAYGROUND_AUTH)) {
    const age = Date.now() - fs.statSync(PLAYGROUND_AUTH).mtimeMs;
    if (age < maxAgeMs) return;
  }

  const browser = await chromium.launch();
  const context = await browser.newContext();
  let page = await context.newPage();
  const maxAttempts = 3;
  let lastError;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await signInToPlayground(page);
      lastError = undefined;
      break;
    } catch (err) {
      lastError = err;
      if (attempt === maxAttempts) break;
      await page.close().catch(() => {});
      page = await context.newPage();
    }
  }
  if (lastError) {
    await browser.close();
    throw lastError;
  }
  await context.storageState({ path: PLAYGROUND_AUTH });
  await browser.close();
}

module.exports = globalSetup;
