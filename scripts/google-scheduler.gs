function postDispatch(eventType, clientPayload) {
  var props = PropertiesService.getScriptProperties();
  var owner = props.getProperty("GITHUB_OWNER");
  var repo = props.getProperty("GITHUB_REPO");
  var token = props.getProperty("GITHUB_PAT");

  if (!owner || !repo || !token) {
    throw new Error("Missing GITHUB_OWNER/GITHUB_REPO/GITHUB_PAT in script properties.");
  }

  var url = "https://api.github.com/repos/" + owner + "/" + repo + "/dispatches";
  var body = { event_type: eventType };
  if (clientPayload) {
    body.client_payload = clientPayload;
  }
  var payload = JSON.stringify(body);

  var options = {
    method: "post",
    contentType: "application/json",
    headers: {
      Authorization: "token " + token,
      Accept: "application/vnd.github+json",
    },
    payload: payload,
    muteHttpExceptions: true,
  };

  var response = UrlFetchApp.fetch(url, options);
  if (response.getResponseCode() >= 300) {
    throw new Error("GitHub dispatch failed: " + response.getResponseCode() + " " + response.getContentText());
  }
}

/** Full regression without daily Resonance call E2E (afternoon / extra runs). */
function triggerRunTests() {
  postDispatch("run-tests", { run_daily_resonance: false });
}

/** Morning run: includes Resonance demo callback E2E (once per day). */
function triggerRunTestsMorning() {
  postDispatch("run-tests", { run_daily_resonance: true });
}
