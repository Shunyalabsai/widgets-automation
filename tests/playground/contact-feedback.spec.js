const fs = require("fs");
const path = require("path");
const { test, expect } = require("@playwright/test");
const { hasTestCredentials } = require("../utils/clerk-auth");
const { PlaygroundFeedbackPage } = require("../pages/playground-feedback-page");

const AUTH_FILE = path.resolve(__dirname, "../../.auth/playground.json");

test.describe("[Playground] Contact feedback", () => {
  test.use({ storageState: AUTH_FILE });

  test("signed-in user can submit feedback to console API", async ({ page }, testInfo) => {
    if (!hasTestCredentials() || !fs.existsSync(AUTH_FILE)) {
      testInfo.skip(true, "Requires SHUNYA_TEST_* in .env and playground auth.");
    }

    const feedback = new PlaygroundFeedbackPage(page);
    await feedback.open();
    await expect(feedback.messageInput()).toBeVisible({ timeout: 30_000 });
    await feedback
      .messageInput()
      .fill("[AUTOMATION] Playground feedback E2E — please ignore.");

    const response = await Promise.all([
      page.waitForResponse(
        (res) =>
          res.url().includes("/api/console/feedback") && res.request().method() === "POST",
        { timeout: 90_000 },
      ),
      feedback.submitButton().click(),
    ]).then(([res]) => res);

    expect(response.ok(), "feedback API should accept submission").toBeTruthy();
  });
});
