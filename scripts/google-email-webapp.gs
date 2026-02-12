function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents || "{}");
    const to = payload.to || "";
    const subject = payload.subject || "QC Automation Report";
    const body = payload.body || "";

    if (!to) {
      return ContentService.createTextOutput(
        JSON.stringify({ ok: false, error: "Missing recipient(s)." }),
      ).setMimeType(ContentService.MimeType.JSON);
    }

    MailApp.sendEmail({
      to: to,
      subject: subject,
      htmlBody: body
    });
    return ContentService.createTextOutput(
      JSON.stringify({ ok: true }),
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(
      JSON.stringify({ ok: false, error: error && error.message ? error.message : String(error) }),
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet() {
  return ContentService.createTextOutput(
    JSON.stringify({ ok: true, message: "Use POST to send email." }),
  ).setMimeType(ContentService.MimeType.JSON);
}
