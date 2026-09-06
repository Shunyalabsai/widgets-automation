function normalizePath(filePath) {
  return filePath ? filePath.split(/[/\\]/).join("/") : "";
}

function testLayerFromFile(filePath) {
  const normalized = normalizePath(filePath);
  if (normalized.includes("/tests/api/") || normalized.includes("/api/")) return "api";
  if (normalized.includes("/tests/ui/") || normalized.includes("/tests/ui/")) return "ui";
  if (/\.api\.spec\.js$/.test(normalized)) return "api";
  return "ui";
}

function shortTestName(title) {
  if (!title) return "Unknown test";
  const parts = title.split(" > ");
  return parts[parts.length - 1] || title;
}

function moduleFromTest(test) {
  if (test.module) return test.module;
  const normalized = normalizePath(test.file || "");
  const layeredMatch = normalized.match(/\/tests\/(?:api|ui)\/([^/]+)\//);
  if (layeredMatch) return layeredMatch[1];
  const match = normalized.match(/\/tests\/([^/]+)\//);
  if (match && !["api", "ui", "pages", "utils", "config", "data"].includes(match[1])) {
    return match[1];
  }
  return "unknown";
}

function apiChecksPassedForModule(test, allTests) {
  const moduleName = moduleFromTest(test);
  const apiTests = allTests.filter((candidate) => {
    if (moduleFromTest(candidate) !== moduleName) return false;
    return (candidate.testLayer || testLayerFromFile(candidate.file)) === "api";
  });
  if (!apiTests.length) return null;
  return apiTests.every((candidate) => candidate.status === "passed");
}

function isTimeoutError(errorText) {
  const error = (errorText || "").toLowerCase();
  return (
    error.includes("timeout") ||
    error.includes("timed out") ||
    error.includes("exceeded")
  );
}

function classifyFailure(test, allTests = []) {
  const error = test.error || "";
  const layer = test.testLayer || testLayerFromFile(test.file);
  const apiPassed = apiChecksPassedForModule(test, allTests);

  if (/upload failed in widget|something went wrong|please try again/i.test(error)) {
    return {
      category: "product",
      label: "Product error",
      reason: "Widget showed an upload/processing error — likely a real product issue.",
      summary:
        "The widget showed an upload or processing error during the check. This likely needs a product fix.",
      severity: "high",
      apiPassed,
    };
  }

  if (isTimeoutError(error)) {
    if (layer === "ui" && apiPassed === true) {
      return {
        category: "test-timing",
        label: "Likely test timing issue",
        reason: "Not a confirmed product bug — UI timed out but API check for same feature passed.",
        summary:
          "The UI check timed out, but the API check for the same feature passed. The live widget is probably fine — the automation likely stopped waiting too soon.",
        severity: "low",
        apiPassed,
      };
    }

    if (layer === "api") {
      return {
        category: "api-timeout",
        label: "API check timed out",
        reason: "Backend API was too slow to respond during the check.",
        summary:
          "The backend API did not respond in time. This may be a server slowdown or an environment issue.",
        severity: "medium",
        apiPassed,
      };
    }

    return {
      category: "ui-timeout",
      label: "UI check timed out",
      reason: "Page or transcript loaded too slowly for the automated check.",
      summary:
        "The page did not finish loading in time during the automated check. This may be slow loading or a test wait that is too short.",
      severity: "medium",
      apiPassed,
    };
  }

  if (/403|401|forbidden|unauthorized|network|econnref|payment re|payment required|quota|billing/i.test(error)) {
    return {
      category: "environment",
      label: "Environment or access issue",
      reason: "CI, network, billing, or permissions issue — not a widget bug.",
      summary:
        "The run hit an access or network problem. This is usually a CI, credentials, or permissions issue — not a widget bug.",
      severity: "medium",
      apiPassed,
    };
  }

  return {
    category: "needs-review",
    label: "Needs review",
    reason: "Failed — review screenshot to confirm if product or test issue.",
    summary:
      "A check failed. Review the dashboard screenshot or technical error details to confirm whether this is a product issue or a test problem.",
    severity: "medium",
    apiPassed,
  };
}

function buildFailureReports(tests = []) {
  return tests
    .filter((test) => test.status === "failed" || test.status === "timedOut")
    .map((test) => {
      const analysis = classifyFailure(test, tests);
      return {
        testName: shortTestName(test.title),
        title: test.title,
        moduleLabel: test.moduleLabel || test.module || moduleFromTest(test),
        status: test.status,
        testLayer: test.testLayer || testLayerFromFile(test.file),
        error: test.error || "",
        reason: analysis.reason,
        ...analysis,
      };
    });
}

function buildRunFailureSummary(tests = []) {
  const failures = buildFailureReports(tests);
  if (!failures.length) return null;

  const timingIssues = failures.filter((item) => item.category === "test-timing");
  const productIssues = failures.filter((item) => item.category === "product");
  const environmentIssues = failures.filter((item) => item.category === "environment");

  let headline = `${failures.length} failed test case${failures.length === 1 ? "" : "s"}`;
  let plainEnglish =
    "Each failed test case has one clear reason below — share this with the team to explain what happened.";

  if (timingIssues.length === failures.length) {
    headline = `${failures.length} likely test timing issue${failures.length === 1 ? "" : "s"}`;
    plainEnglish =
      "All failures look like automation timing issues, not confirmed product bugs. API checks passed where available.";
  } else if (productIssues.length) {
    headline = `${productIssues.length} possible product issue${productIssues.length === 1 ? "" : "s"}`;
    plainEnglish =
      "At least one failure looks like a real widget or API problem. Review those items first.";
  } else if (environmentIssues.length === failures.length) {
    headline = `${failures.length} environment issue${failures.length === 1 ? "" : "s"}`;
    plainEnglish =
      "Failures look related to CI access or network conditions rather than the live widgets.";
  }

  return {
    headline,
    plainEnglish,
    failures,
  };
}

function enrichTestsWithFailureAnalysis(tests = []) {
  return tests.map((test) => {
    if (test.status !== "failed" && test.status !== "timedOut") return test;
    const failureAnalysis = classifyFailure(test, tests);
    return {
      ...test,
      failureAnalysis,
      failureReason: failureAnalysis.reason,
    };
  });
}

module.exports = {
  buildFailureReports,
  buildRunFailureSummary,
  classifyFailure,
  enrichTestsWithFailureAnalysis,
  shortTestName,
};
