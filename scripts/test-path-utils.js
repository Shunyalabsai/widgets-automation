/** Playwright JSON reports use paths like `site/foo.spec.js` (no `tests/` prefix). */

function normalizePath(filePath) {
  return filePath ? filePath.split(/[/\\]/).join("/") : "";
}

function normalizeReportFilePath(filePath) {
  const normalized = normalizePath(filePath);
  if (!normalized) return normalized;
  if (normalized.includes("/tests/")) return normalized;
  if (/^(site|playground|api)\//.test(normalized)) return `tests/${normalized}`;
  return normalized;
}

function moduleFromReportFile(filePath) {
  const normalized = normalizeReportFilePath(filePath);
  if (normalized.includes("/tests/api/health/")) return "health";
  if (normalized.includes("/tests/site/")) return "site";
  if (normalized.includes("/tests/playground/")) return "playground";
  if (normalized.includes("tests/api/") || normalized.includes("/tests/api/")) return "api";
  const layeredMatch = normalized.match(/\/tests\/(?:api|playground|site)\/([^/]+)\//);
  if (layeredMatch) return layeredMatch[1];
  return "unknown";
}

function testLayerFromReportFile(filePath) {
  const normalized = normalizeReportFilePath(filePath);
  if (normalized.includes("/tests/api/")) return "api";
  if (normalized.includes("/tests/ui/")) return "ui";
  if (/\.api\.spec\.js$/.test(normalized)) return "api";
  return "ui";
}

function isApiReportFile(filePath) {
  const normalized = normalizeReportFilePath(filePath);
  return normalized.includes("/tests/api/") && !normalized.includes("/tests/api/health/");
}

function isPlaygroundReportFile(filePath) {
  return normalizeReportFilePath(filePath).includes("/tests/playground/");
}

module.exports = {
  normalizeReportFilePath,
  moduleFromReportFile,
  testLayerFromReportFile,
  isApiReportFile,
  isPlaygroundReportFile,
};
