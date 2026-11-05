const { getEnvironment } = require("../config/environment");

/** Signed-in playground feedback at /playground/contact */
class PlaygroundFeedbackPage {
  constructor(page) {
    this.page = page;
    this.env = getEnvironment();
  }

  async open() {
    await this.page.goto(`${this.env.playgroundUrl}/contact`, {
      waitUntil: "networkidle",
      timeout: 90_000,
    });
    await this.page.waitForURL(/\/playground\/contact/, { timeout: 60_000 });
  }

  messageInput() {
    return this.page.getByRole("textbox", { name: /Message/i });
  }

  submitButton() {
    return this.page.getByRole("button", { name: /^Submit$/i });
  }
}

module.exports = { PlaygroundFeedbackPage };
