const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const SUMMARY_PATH = path.join(ROOT, "docs", "data", "latest.json");

function buildAttachmentUrls(attachments, baseUrl) {
  if (!Array.isArray(attachments)) return [];
  return attachments.map((attachment) => {
    if (!baseUrl) return attachment;
    const trimmedBase = baseUrl.replace(/\/+$/, "");
    const trimmedPath = String(attachment.path || "").replace(/^\/+/, "");
    return {
      ...attachment,
      url: trimmedPath ? `${trimmedBase}/${trimmedPath}` : trimmedBase,
    };
  });
}

function flattenAttachments(attachments) {
  const buckets = { screenshot: [], video: [], trace: [], other: [] };
  (attachments || []).forEach((attachment) => {
    const name = attachment.name || "artifact";
    const contentType = attachment.contentType || "";
    const path = attachment.url || attachment.path || "";
    const entry = `${name}:${path}`;
    if (contentType.includes("image") || name.toLowerCase().includes("screenshot")) {
      buckets.screenshot.push(entry);
    } else if (contentType.includes("video") || name.toLowerCase().includes("video")) {
      buckets.video.push(entry);
    } else if (contentType.includes("zip") || name.toLowerCase().includes("trace")) {
      buckets.trace.push(entry);
    } else {
      buckets.other.push(entry);
    }
  });
  return buckets;
}

function buildTestcaseIds(tests) {
  const titles = Array.from(
    new Set(
      tests.map((test) => test.title || "").filter((title) => title.length > 0),
    ),
  ).sort((a, b) => a.localeCompare(b));
  const map = new Map();
  titles.forEach((title, index) => {
    const id = `TC${String(index + 1).padStart(3, "0")}`;
    map.set(title, id);
  });
  return map;
}

async function main() {
  const sheetUrl = process.env.GOOGLE_SHEETS_WEB_APP_URL;
  const sheetName = process.env.GOOGLE_SHEETS_SHEET_NAME || "test-coverage";
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID || "";
  const clearSheet = String(process.env.GOOGLE_SHEETS_CLEAR || "").toLowerCase() ===
    "true";
  if (!sheetUrl) {
    console.log("GOOGLE_SHEETS_WEB_APP_URL not set. Skipping sheet update.");
    return;
  }

  if (!fs.existsSync(SUMMARY_PATH)) {
    console.log("Dashboard summary not found. Skipping sheet update.");
    return;
  }

  const run = JSON.parse(fs.readFileSync(SUMMARY_PATH, "utf8"));
  const baseUrl = process.env.DASHBOARD_BASE_URL || "";
  const testcaseIds = buildTestcaseIds(run.tests || []);
  const tests = (run.tests || []).map((test) => {
    const attachments = buildAttachmentUrls(test.attachments || [], baseUrl);
    const testcaseId = testcaseIds.get(test.title) || "";
    return {
      ...test,
      testcaseId,
      description: `Covers ${test.moduleLabel || test.module || ""} - ${test.title || ""}`,
      attachments,
      attachmentBuckets: flattenAttachments(attachments),
    };
  });
  const formatIST = (isoString) => {
    const date = isoString ? new Date(isoString) : new Date();
    return date.toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  };
  const payload = {
    timestamp: formatIST(),
    sheetName,
    spreadsheetId,
    clearSheet,
    run: {
      id: run.id,
      startedAt: formatIST(run.startedAt),
      durationMs: run.durationMs,
      summary: run.summary,
      tests,
    },
  };

  try {
    const response = await fetch(sheetUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      console.log(`Sheet update failed: ${response.status}`);
    } else {
      console.log("Sheet update succeeded.");
    }
  } catch (error) {
    console.log("Sheet update failed:", error.message || error);
  }
}

main();
