/** Shared helpers for www.shunyalabs.ai (cookie banner, stable waits). */

async function dismissCookieBanner(page) {
  const accept = page.getByRole("button", { name: /^Accept$/i });
  const essential = page.getByRole("button", { name: /^Essential only$/i });
  if (await accept.isVisible().catch(() => false)) {
    await accept.click();
    return;
  }
  if (await essential.isVisible().catch(() => false)) {
    await essential.click();
  }
}

async function gotoSite(page, url, options = {}) {
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: options.timeout ?? 90_000 });
  await dismissCookieBanner(page);
}

module.exports = { dismissCookieBanner, gotoSite };
