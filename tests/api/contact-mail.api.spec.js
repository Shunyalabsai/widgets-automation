const { test, expect } = require("@playwright/test");
const { getEnvironment } = require("../config/environment");
const { getContactAutomationSecret } = require("../config/contact-automation");
const { postContactAutomationMail } = require("./helpers/contact-mail-client");

/**
 * Daily E2E contact email delivery (reCAPTCHA bypass via X-Automation-Secret).
 * UI /contact tests stay validation-only; browsers cannot send the secret header.
 */
test.describe("[API] Contact form mail delivery", () => {
  test("send-mail accepts automation bypass (once per 24h)", async ({ request }) => {
    const secret = getContactAutomationSecret();
    test.skip(!secret, "Set CONTACT_AUTOMATION_SECRET (shared by Shunya) to run this check");

    const env = getEnvironment();
    const result = await postContactAutomationMail(request, env.siteOrigin);
    expect(result.skipped).toBe(false);

    if (result.alreadyRanToday) {
      test.info().annotations.push({
        type: "note",
        description:
          "HTTP 429 — automation bypass already used in the last 24h (expected on second daily regression run).",
      });
      expect(result.bodyText).toMatch(/automation test already ran today/i);
      return;
    }

    expect(result.status).toBe(200);
    expect(result.bodyText).toMatch(/emails sent successfully/i);
  });
});
