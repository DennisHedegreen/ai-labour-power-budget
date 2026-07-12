(function attachPrototypeDataLoader(globalScope) {
  "use strict";

  const DATA_ROOT = new URL("./data", document.currentScript?.src || globalScope.location.href).href;

  async function fetchJson(path) {
    const response = await fetch(path, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Failed to load ${path}: HTTP ${response.status}`);
    }
    return response.json();
  }

  async function loadCopy() {
    const languages = await fetchJson(`${DATA_ROOT}/copy/languages.json`);
    const entries = await Promise.all(
      languages.map(async (language) => [language.code, await fetchJson(`${DATA_ROOT}/copy/${language.file}`)])
    );
    return {
      languages,
      text: Object.fromEntries(entries),
    };
  }

  async function loadPrototypeData() {
    if (globalScope.location?.protocol === "file:") {
      throw new Error("AI Labour Power Budget now loads JSON data and must be served from a local HTTP server.");
    }

    const [countries, eu27Shell, workerProfiles, electricityAllocationProfiles, comparisonAssumptions, copyBundle] =
      await Promise.all([
        fetchJson(`${DATA_ROOT}/countries.json`),
        fetchJson(`${DATA_ROOT}/eu27-shell.json`),
        fetchJson(`${DATA_ROOT}/worker-profiles.json`),
        fetchJson(`${DATA_ROOT}/electricity-allocation-profiles.json`),
        fetchJson(`${DATA_ROOT}/comparison-assumptions.json`),
        loadCopy(),
      ]);

    const copy = copyBundle.text;

    return {
      status: "demo_only_not_verified",
      countries,
      eu27Shell,
      powerProfiles: workerProfiles.powerProfiles,
      runtimeProfiles: workerProfiles.runtimeProfiles,
      overheadProfiles: workerProfiles.overheadProfiles,
      electricityAllocationProfiles,
      comparisonAssumptions,
      copyLanguages: copyBundle.languages,
      copy,
    };
  }

  globalScope.AILabourPowerBudgetDataLoader = {
    loadPrototypeData,
  };
})(window);
