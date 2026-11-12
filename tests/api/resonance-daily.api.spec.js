const { test, expect } = require("@playwright/test");
const { getEnvironment } = require("../config/environment");
const { isMorningDailyE2eRun } = require("../config/resonance-automation");
const { postResonanceAutomationCallback } = require("./helpers/resonance-callback-client");

/**
 * Daily Resonance demo call (homepage “Talk to Meera”).
 * Runs only when RUN_DAILY_RESONANCE_E2E=1 (morning GAS trigger). Uses API + secret — not the public form (Turnstile).
 */
test.describe("[API] Resonance daily demo callback", () => {
  test("morning run initiates demo callback (once per 24h)", async ({ request }) => {
    test.skip(!isMorningDailyE2eRun(), "Resonance E2E runs only on morning schedule (RUN_DAILY_RESONANCE_E2E=1)");

    const env = getEnvironment();
    const result = await postResonanceAutomationCallback(request, env.siteOrigin);

    if (result.skipped) {
      test.skip(true, result.reason);
    }

    if (result.status === 404) {
      throw new Error(
        `Resonance callback route not found (404) at ${result.url}. Ask backend for the production path and set RESONANCE_CALLBACK_PATH.`,
      );
    }

    if (result.alreadyRanToday) {
      test.info().annotations.push({
        type: "note",
        description: "HTTP 429 — Resonance automation bypass already used in the last 24h (expected).",
      });
      expect(result.bodyText).toMatch(/already ran today|automation test already/i);
      return;
    }

    expect(result.status).toBe(200);
    expect(result.bodyText).toMatch(/success|call|initiated|queued/i);
  });
});
