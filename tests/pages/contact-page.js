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

  termsCheckbox() {
    return this.page.locator('input[name="agreeTerms"]');
  }

  submitButton() {
    return this.page.getByRole("button", { name: /^SUBMIT$/i });
  }

  async fillSample({ tag = "AUTOMATION" } = {}) {
    await this.nameInput().fill("QA Automation");
    await this.emailInput().fill("qa-automation+contact@tmail.com");
    await this.phoneInput().fill("9999999999");
    await this.messageInput().fill(`[${tag}] Contact form test — please ignore.`);
    await this.termsCheckbox().check({ force: true });
  }
}

module.exports = { ContactPage };
