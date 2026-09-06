/** Browser-side helpers for Playwright waitForFunction (each function must be self-contained). */

function transcriptHasPhrases(phrases) {
  const rows = Array.from(document.querySelectorAll(".flex.items-center.space-x-2"));
  const rowText = rows.map((row) => row.textContent || "").join(" ");
  const rootText = document.body?.innerText || "";
  const rawText = `${rowText} ${rootText}`.trim();
  const normalize = (value) =>
    String(value || "")
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .replace(/\s+/g, " ")
      .trim();
  const text = normalize(rawText);
  return (phrases || []).every((line) => text.includes(normalize(line)));
}

function transcriptHasMeaningfulContent(minLength) {
  const minContentLength = typeof minLength === "number" ? minLength : 120;
  const rows = Array.from(document.querySelectorAll(".flex.items-center.space-x-2"));
  const rowText = rows.map((row) => row.textContent || "").join(" ");
  const rootText = document.body?.innerText || "";
  const text = `${rowText} ${rootText}`.trim();
  const hasSpeaker = /speaker\s*\d/i.test(text);
  const transcriptBodyLength = text.replace(/speaker\s*\d/gi, "").trim().length;
  if (hasSpeaker && transcriptBodyLength >= minContentLength) {
    return true;
  }
  if (text.length < minContentLength) return false;
  const ascii = text.toLowerCase();
  const emptyStateMarkers = [
    "choose a sample clip, upload an audio file",
    "choose a sample",
  ];
  return !emptyStateMarkers.some((item) => ascii.includes(item));
}

function transcriptUploadComplete(minContentLength) {
  const minLength = typeof minContentLength === "number" ? minContentLength : 80;
  const rows = Array.from(document.querySelectorAll(".flex.items-center.space-x-2"));
  const rowText = rows.map((row) => row.textContent || "").join(" ");
  const rootText = document.body?.innerText || "";
  const text = `${rowText} ${rootText}`.trim();
  const normalized = String(text || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
  const hasSpeaker = /speaker\s*\d/i.test(text);
  const hasMeaningfulContent =
    text.length >= minLength &&
    !text.toLowerCase().includes("upload your file here") &&
    !text.toLowerCase().includes("choose a sample clip, upload an audio file");
  const hasTranscriptBody = normalized.length >= 40;
  return hasMeaningfulContent && hasTranscriptBody && (hasSpeaker || rows.length > 0);
}

module.exports = {
  transcriptHasPhrases,
  transcriptHasMeaningfulContent,
  transcriptUploadComplete,
};
