const {
  RESONANCE_E2E_MESSAGE,
  getResonanceAutomationPhone,
  getResonanceAutomationSecret,
  getResonanceCallbackPath,
  isResonanceAlreadyRanToday,
  resonanceCallbackUrl,
} = require("../../config/resonance-automation");

async function postResonanceAutomationCallback(request, siteOrigin, overrides = {}) {
  const secret = getResonanceAutomationSecret();
  const phone = getResonanceAutomationPhone();
  const path = getResonanceCallbackPath();
  if (!path) {
    return { skipped: true, reason: "RESONANCE_CALLBACK_PATH not set" };
  }
  if (!secret) {
    return { skipped: true, reason: "RESONANCE_AUTOMATION_SECRET / CONTACT_AUTOMATION_SECRET not set" };
  }
  if (!phone) {
    return { skipped: true, reason: "RESONANCE_AUTOMATION_PHONE not set" };
  }

  const url = resonanceCallbackUrl(siteOrigin);
  const payload = {
    phone,
    message: RESONANCE_E2E_MESSAGE,
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
    url,
    status: response.status(),
    bodyText,
    bodyJson,
    alreadyRanToday: isResonanceAlreadyRanToday(response.status(), bodyText),
  };
}

module.exports = { postResonanceAutomationCallback };
