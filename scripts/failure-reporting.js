const {
  moduleFromReportFile,
  testLayerFromReportFile,
  isApiReportFile,
  isPlaygroundReportFile,
  normalizeReportFilePath,
} = require("./test-path-utils");

function shortTestName(title) {
  if (!title) return "Unknown test";
  const parts = title.split(" > ");
  return parts[parts.length - 1] || title;
}

function moduleFromTest(test) {
  if (test.module && test.module !== "unknown") return test.module;
  return moduleFromReportFile(test.file || "");
}

function testLayerFromFile(filePath) {
  return testLayerFromReportFile(filePath);
}

const MODULE_LABELS = {
  site: "Website (public pages)",
  playground: "Playground (signed-in UI)",
  api: "Backend API (playground routes)",
  health: "API health (hourly)",
};

function humanModuleLabel(test) {
  const key = test.moduleLabel || test.module || moduleFromTest(test);
  if (MODULE_LABELS[key]) return MODULE_LABELS[key];
  if (typeof key === "string" && key.includes("(")) return key;
  return MODULE_LABELS[key] || key;
}

function isApiLayerTest(candidate) {
  return (candidate.testLayer || testLayerFromFile(candidate.file)) === "api";
}

function apiChecksPassedForModule(test, allTests) {
  const moduleName = moduleFromTest(test);
  const apiTests = allTests.filter((candidate) => {
    if (moduleFromTest(candidate) !== moduleName) return false;
    return isApiLayerTest(candidate);
  });
  if (!apiTests.length) return null;
  return apiTests.every((candidate) => candidate.status === "passed");
}

function groupChecksPassed(allTests, filterFn) {
  const related = allTests.filter(filterFn);
  if (!related.length) return null;
  return related.every((candidate) => candidate.status === "passed");
}

/** Homepage UI ↔ backend API and signed-in playground for the same product. */
function relatedProductChecksPassed(test, allTests) {
  const hay = `${test.title || ""}`.toLowerCase();
  const rules = [
    {
      feature: /listen|horizon/,
      groups: [
        (t) => isApiReportFile(t.file) && /stt endpoint/i.test(t.title || ""),
        (t) => isPlaygroundReportFile(t.file) && /listen|horizon/i.test(t.title || ""),
      ],
    },
    {
      feature: /speak|radiance/,
      groups: [
        (t) => isApiReportFile(t.file) && /tts endpoint/i.test(t.title || ""),
        (t) =>
          isPlaygroundReportFile(t.file) &&
          /speak|radiance/i.test(t.title || "") &&
          /workspace|loads/i.test(t.title || ""),
      ],
    },
    {
      feature: /translate|parallax/,
      groups: [
        (t) => isApiReportFile(t.file) && /translate endpoint/i.test(t.title || ""),
        (t) => isPlaygroundReportFile(t.file) && /translate|parallax/i.test(t.title || ""),
      ],
    },
  ];

  for (const { feature, groups } of rules) {
    if (!feature.test(hay)) continue;
    let sawFailure = false;
    for (const filterFn of groups) {
      const result = groupChecksPassed(allTests, filterFn);
      if (result === true) return true;
      if (result === false) sawFailure = true;
    }
    if (sawFailure) return false;
    return null;
  }
  return null;
}

function backendChecksPassed(test, allTests) {
  const related = relatedProductChecksPassed(test, allTests);
  if (related !== null) return related;
  return apiChecksPassedForModule(test, allTests);
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
  const apiPassed = backendChecksPassed(test, allTests);

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
        reason:
          "Not a confirmed product bug — UI timed out but API or playground check for the same feature passed.",
        summary:
          "The homepage UI check timed out, but backend API and/or playground checks for the same feature passed. The product is likely fine — the marketing embed may load slowly in CI.",
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
      reason: "Page or widget loaded too slowly for the automated check.",
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
        moduleLabel: humanModuleLabel(test),
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
    headline = `${timingIssues.length} likely test timing issue${timingIssues.length === 1 ? "" : "s"}`;
    plainEnglish =
      "All failures look like automation timing issues, not confirmed product bugs. API or playground checks passed where available.";
  } else if (productIssues.length) {
    headline = `${productIssues.length} possible product issue${productIssues.length === 1 ? "" : "s"}`;
    plainEnglish =
      "At least one failure looks like a real widget or API problem. Review those items first.";
  } else if (environmentIssues.length === failures.length) {
    headline = `${environmentIssues.length} environment issue${environmentIssues.length === 1 ? "" : "s"}`;
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
  moduleFromTest,
  normalizeReportFilePath,
};
