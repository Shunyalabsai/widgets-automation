/** Homepage Resonance “Talk to Meera” daily E2E — API + automation secret (Turnstile blocks browser submit). */

const RESONANCE_E2E_MESSAGE = "[E2E-DAILY] Resonance demo callback test";

function isMorningDailyE2eRun() {
  return process.env.RUN_DAILY_RESONANCE_E2E === "1";
}

function getResonanceAutomationSecret() {
  return (
    process.env.RESONANCE_AUTOMATION_SECRET ||
    process.env.CONTACT_AUTOMATION_SECRET ||
    process.env.SHUNYA_CONTACT_AUTOMATION_SECRET ||
    ""
  ).trim();
}

function getResonanceAutomationPhone() {
  return (process.env.RESONANCE_AUTOMATION_PHONE || process.env.SHUNYA_TEST_PHONE || "").trim();
}

/** Backend route path — confirm with team (e.g. /api/site/resonance/...). */
function getResonanceCallbackPath() {
  return (process.env.RESONANCE_CALLBACK_PATH || "").trim();
}

function resonanceCallbackUrl(siteOrigin) {
  const path = getResonanceCallbackPath();
  if (!path) return "";
  return new URL(path.startsWith("/") ? path : `/${path}`, siteOrigin).href;
}

function isResonanceAlreadyRanToday(status, bodyText) {
  return status === 429 && /already ran today|automation test already/i.test(bodyText || "");
}

module.exports = {
  RESONANCE_E2E_MESSAGE,
  getResonanceAutomationPhone,
  getResonanceAutomationSecret,
  getResonanceCallbackPath,
  isMorningDailyE2eRun,
  isResonanceAlreadyRanToday,
  resonanceCallbackUrl,
};
