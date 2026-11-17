const { expect } = require("@playwright/test");
const { gotoSite } = require("../utils/site-helpers");

/** Public marketing contact form at /contact */
class ContactPage {
  constructor(page, env) {
    this.page = page;
    this.env = env;
  }

  async open() {
    const url = new URL("/contact", this.env.siteUrl).href;
    await gotoSite(this.page, url);
    await this.nameInput().waitFor({ state: "visible", timeout: 60_000 });
    await this.submitButton().waitFor({ state: "visible", timeout: 30_000 });
  }

  async acceptPrivacyTerms() {
    const box = this.privacyTermsCheckbox();
    await box.scrollIntoViewIfNeeded();
    await box.check();
    await expect(box).toBeChecked({ timeout: 10_000 });
  }

  async submitForValidation() {
    await this.nameInput().click();
    await this.submitButton().scrollIntoViewIfNeeded();
    await this.submitButton().click();
  }

  fieldErrorPattern(field) {
    const patterns = {
      name: /name is required/i,
      email: /email is required/i,
      phone: /phone( number)? is required/i,
      message: /message is required/i,
    };
    return patterns[field];
  }

  async expectFieldValidation(field) {
    const pattern = this.fieldErrorPattern(field);
    const input =
      field === "message"
        ? this.messageInput()
        : this.page.locator(`input[name="${field}"]`).first();
    const errorText = this.page.getByText(pattern).first();
    const timeout = process.env.CI ? 20_000 : 10_000;

    await expect(async () => {
      if (await errorText.isVisible().catch(() => false)) return;
      const htmlMsg = await input.evaluate((el) => el.validationMessage || "").catch(() => "");
      if (pattern.test(htmlMsg)) return;
      throw new Error(`Validation not shown for ${field}`);
    }).toPass({ timeout });
  }

  nameInput() {
    return this.page.locator('input[name="name"]');
  }

  emailInput() {
    return this.page.locator('input[name="email"]');
  }

  phoneInput() {
    return this.page.locator('input[name="phone"]');
  }

  messageInput() {
    return this.page.locator('textarea[name="message"]');
  }

  privacyTermsCheckbox() {
    return this.page.getByRole("checkbox", {
      name: /Privacy Policy and Terms of Service/i,
    });
  }

  marketingCheckbox() {
    return this.page.getByRole("checkbox", {
      name: /marketing communications from Shunya Labs/i,
    });
  }

  /** @deprecated use privacyTermsCheckbox */
  termsCheckbox() {
    return this.privacyTermsCheckbox();
  }

  submitButton() {
    return this.page.getByRole("button", { name: /^submit$/i });
  }

  async fillSample({ tag = "AUTOMATION" } = {}) {
    await this.nameInput().waitFor({ state: "visible", timeout: 30_000 });
    await this.nameInput().fill("QA Automation");
    await this.emailInput().fill("qa-automation+contact@tmail.com");
    await this.phoneInput().fill("9999999999");
    await this.messageInput().fill(`[${tag}] Contact form test — please ignore.`);
    await this.privacyTermsCheckbox().check();
  }
}

module.exports = { ContactPage };
