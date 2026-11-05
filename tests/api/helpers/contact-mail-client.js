const {
  CONTACT_AUTOMATION_EMAIL,
  CONTACT_E2E_DAILY_MESSAGE,
  contactSendMailUrl,
  getContactAutomationSecret,
  isContactMailAlreadyRanToday,
} = require("../../config/contact-automation");

async function postContactAutomationMail(request, siteOrigin, overrides = {}) {
  const secret = getContactAutomationSecret();
  if (!secret) {
    return { skipped: true, reason: "CONTACT_AUTOMATION_SECRET not set" };
  }

  const url = contactSendMailUrl(siteOrigin);
  const payload = {
    name: "QA Automation",
    email: CONTACT_AUTOMATION_EMAIL,
    phone: "0000000000",
    message: CONTACT_E2E_DAILY_MESSAGE,
    token: "",
    ...overrides,
  };

  const response = await request.post(url, {
    headers: {
      "Content-Type": "application/json",
      "X-Automation-Secret": secret,
    },
    data: payload,
  });

  const bodyText = await response.text();
  let bodyJson = null;
  try {
    bodyJson = JSON.parse(bodyText);
  } catch {
    bodyJson = null;
  }

  return {
    skipped: false,
    status: response.status(),
    bodyText,
    bodyJson,
    alreadyRanToday: isContactMailAlreadyRanToday(response.status(), bodyText),
  };
}

module.exports = {
  postContactAutomationMail,
  isContactMailAlreadyRanToday,
};
