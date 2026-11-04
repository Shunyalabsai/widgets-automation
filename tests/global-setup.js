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

  const maxAgeMs = 6 * 60 * 60 * 1000;
  if (fs.existsSync(PLAYGROUND_AUTH)) {
    const age = Date.now() - fs.statSync(PLAYGROUND_AUTH).mtimeMs;
    if (age < maxAgeMs) return;
  }

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  await signInToPlayground(page);
  await context.storageState({ path: PLAYGROUND_AUTH });
  await browser.close();
}

module.exports = globalSetup;
