/** Public contact form automation bypass (reCAPTCHA) — backend QA contract. */

const CONTACT_AUTOMATION_EMAIL = "automated-test@example.com";

const CONTACT_E2E_DAILY_MESSAGE = "[E2E-DAILY] Contact form delivery test";

function getContactAutomationSecret() {
  return (
    process.env.CONTACT_AUTOMATION_SECRET ||
    process.env.SHUNYA_CONTACT_AUTOMATION_SECRET ||
    ""
  ).trim();
}

function contactSendMailUrl(siteOrigin) {
  return new URL("/api/site/send-mail", siteOrigin).href;
}

function isContactMailAlreadyRanToday(status, bodyText) {
  return status === 429 && /automation test already ran today/i.test(bodyText || "");
}

module.exports = {
  CONTACT_AUTOMATION_EMAIL,
  CONTACT_E2E_DAILY_MESSAGE,
  contactSendMailUrl,
  getContactAutomationSecret,
  isContactMailAlreadyRanToday,
};
