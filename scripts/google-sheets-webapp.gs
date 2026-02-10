const DEFAULT_SHEET_NAME = "test-coverage";

function ensureHeaders(sheet) {
  const headers = [
    "Testcase ID",
    "Test Name",
    "Description",
    "Update Date & time",
    "Status",
    "Comment(proof)",
  ];
  const existing = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
  const needsHeaders = existing.join("").trim() === "";
  if (needsHeaders) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }
  return headers;
}

function resetSheet(sheet, headers) {
  sheet.clear();
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
}

function formatTimestamp(value) {
  try {
    const date = value ? new Date(value) : new Date();
    const tz = Session.getScriptTimeZone() || "UTC";
    return Utilities.formatDate(date, tz, "yyyy-MM-dd HH:mm:ss z");
  } catch (error) {
    return value || "";
  }
}

function upsertRows(sheet, headers, rows) {
  if (!rows.length) return;
  const existing = sheet.getDataRange().getValues();
  const headerRow = existing[0] || [];
  const headerMap = new Map();
  headerRow.forEach((value, idx) => headerMap.set(value, idx));

  const keyIndex = headerMap.get("Testcase ID");
  const rowMap = new Map();

  for (let i = 1; i < existing.length; i += 1) {
    const key = `${existing[i][keyIndex]}`;
    rowMap.set(key, i + 1);
  }

  rows.forEach((row) => {
    const key = `${row["Testcase ID"]}`;
    const rowValues = headers.map((header) => row[header] ?? "");
    const existingRow = rowMap.get(key);
    if (existingRow) {
      sheet.getRange(existingRow, 1, 1, headers.length).setValues([rowValues]);
    } else {
      sheet.appendRow(rowValues);
    }
  });
}

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents || "{}");
    const run = payload.run || {};
    const tests = run.tests || [];
    const sheetName = payload.sheetName || DEFAULT_SHEET_NAME;
    const spreadsheetId =
      (payload.spreadsheetId || PropertiesService.getScriptProperties().getProperty("SPREADSHEET_ID") || "").trim();
    const spreadsheet = spreadsheetId
      ? SpreadsheetApp.openById(spreadsheetId)
      : SpreadsheetApp.getActiveSpreadsheet();
    const sheet = spreadsheet.getSheetByName(sheetName) || spreadsheet.insertSheet(sheetName);
    const headers = ensureHeaders(sheet);
    if (payload.clearSheet === true) {
      resetSheet(sheet, headers);
    }

    const rows = tests.map((test) => {
      const buckets = test.attachmentBuckets || {};
      const description = test.description || `${test.moduleLabel || test.module || ""} | ${test.file || ""}`;
      const proofParts = [
        (buckets.screenshot || []).join(" | "),
        (buckets.video || []).join(" | "),
        (buckets.trace || []).join(" | "),
        (buckets.other || []).join(" | "),
      ].filter(Boolean);
      const proof = proofParts.join(" | ") || test.error || "";
      const status = String(test.status || "").toLowerCase();
      const statusLabel =
        status === "passed"
          ? "PASS"
          : status === "failed"
            ? "FAIL"
            : status === "timedout"
              ? "TIMEOUT"
              : status === "skipped"
                ? "SKIPPED"
                : status.toUpperCase();
      return {
        "Testcase ID": test.testcaseId || test.title || "",
        "Test Name": test.title || "",
        Description: description.trim(),
        "Update Date & time": formatTimestamp(run.startedAt || payload.timestamp),
        Status: statusLabel || "",
        "Comment(proof)": proof,
        Comment: proof,
      };
    });

    upsertRows(sheet, headers, rows);

    return ContentService.createTextOutput(
      JSON.stringify({ ok: true, rows: rows.length }),
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(
      JSON.stringify({ ok: false, error: error && error.message ? error.message : String(error) }),
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet() {
  return ContentService.createTextOutput(
    JSON.stringify({ ok: true, message: "Use POST to submit results." }),
  ).setMimeType(ContentService.MimeType.JSON);
}
