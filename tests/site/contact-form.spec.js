const { test, expect } = require("@playwright/test");
const { getEnvironment } = require("../config/environment");
const { ContactPage } = require("../pages/contact-page");

test.describe("[Site] Contact form (/contact)", () => {
  test("shows fields, terms, and submit", async ({ page }) => {
    const env = getEnvironment();
    const contact = new ContactPage(page, env);
    await contact.open();

    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible({ timeout: 30_000 });
    await expect(contact.nameInput()).toBeVisible();
    await expect(contact.emailInput()).toBeVisible();
    await expect(contact.phoneInput()).toBeVisible();
    await expect(contact.messageInput()).toBeVisible();
    await expect(contact.termsCheckbox()).toBeVisible();
    await expect(contact.submitButton()).toBeVisible();
    await expect(page.locator('iframe[title*="reCAPTCHA"], .g-recaptcha, #g-recaptcha-response').first()).toBeAttached();
  });

  test("validates required fields on submit", async ({ page }) => {
    const env = getEnvironment();
    const contact = new ContactPage(page, env);
    await contact.open();

    await contact.termsCheckbox().check({ force: true });
    await contact.submitButton().click();

    await expect(page.getByText("Name is required.")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("Email is required.")).toBeVisible();
    await expect(page.getByText("Phone number is required.")).toBeVisible();
    await expect(page.getByText("Message is required.")).toBeVisible();
  });

  test("accepts filled input without sending mail (no live submit)", async ({ page }) => {
    const env = getEnvironment();
    const contact = new ContactPage(page, env);
    await contact.open();

    await contact.fillSample();
    await expect(contact.nameInput()).toHaveValue("QA Automation");
    await expect(contact.emailInput()).toHaveValue("qa-automation+contact@tmail.com");
    await expect(contact.messageInput()).toHaveValue(/\[AUTOMATION\]/);
  });
});
