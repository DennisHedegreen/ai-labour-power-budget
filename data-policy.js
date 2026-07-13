(function attachDataPolicy(globalScope) {
  "use strict";

  const DATA_MODES = Object.freeze({
    DEMO: "demo",
    SOURCE_CANDIDATE_REVIEW: "source_candidate_review",
    PROMOTED_RUNTIME: "promoted_runtime",
  });
  const ALLOWED_DATA_MODES = new Set(Object.values(DATA_MODES));

  function assertKnownDataMode(mode) {
    if (!ALLOWED_DATA_MODES.has(mode)) {
      throw new Error(`Unknown data mode: ${mode}`);
    }
  }

  function validateDataMode({
    mode,
    records = [],
    runtimeImportAuthorized = false,
    runtimeAllowed = false,
  }) {
    assertKnownDataMode(mode);

    if (mode === DATA_MODES.DEMO) {
      if (records.some((record) => record.source_status !== "demo_not_verified")) {
        throw new Error("Demo mode may only expose demo_not_verified records");
      }
      return mode;
    }

    if (mode === DATA_MODES.SOURCE_CANDIDATE_REVIEW) {
      if (records.some((record) => record.source_status !== "source_candidate")) {
        throw new Error("Source-candidate review mode may only expose source_candidate records");
      }
      return mode;
    }

    if (!runtimeImportAuthorized || !runtimeAllowed) {
      throw new Error("Promoted runtime mode is blocked by the source promotion gate");
    }

    if (records.some((record) => record.source_status !== "verified_runtime")) {
      throw new Error("Promoted runtime mode may only expose verified_runtime records");
    }

    return mode;
  }

  const api = {
    DATA_MODES,
    assertKnownDataMode,
    validateDataMode,
  };

  globalScope.AILabourPowerBudgetDataPolicy = api;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(typeof window !== "undefined" ? window : globalThis);
