const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const SUMMARY_PATH = path.join(ROOT, "dashboard", "data", "latest-summary.json");

async function main() {
  const sheetUrl = process.env.GOOGLE_SHEETS_WEB_APP_URL;
  if (!sheetUrl) {
    console.log("GOOGLE_SHEETS_WEB_APP_URL not set. Skipping sheet update.");
    return;
  }

  if (!fs.existsSync(SUMMARY_PATH)) {
    console.log("Dashboard summary not found. Skipping sheet update.");
    return;
  }

  const summary = JSON.parse(fs.readFileSync(SUMMARY_PATH, "utf8"));
  const payload = {
    timestamp: new Date().toISOString(),
    summary,
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
