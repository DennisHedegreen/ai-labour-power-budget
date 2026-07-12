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

    const [
      countries,
      eu27Shell,
      jurisdictionGroupDefinitions,
      workerProfiles,
      electricityAllocationProfiles,
      comparisonAssumptions,
      copyBundle,
    ] = await Promise.all([
      fetchJson(`${DATA_ROOT}/countries.json`),
      fetchJson(`${DATA_ROOT}/eu27-shell.json`),
      fetchJson(`${DATA_ROOT}/jurisdiction-groups.json`),
      fetchJson(`${DATA_ROOT}/worker-profiles.json`),
      fetchJson(`${DATA_ROOT}/electricity-allocation-profiles.json`),
      fetchJson(`${DATA_ROOT}/comparison-assumptions.json`),
      loadCopy(),
    ]);

    const jurisdictionGroups = await buildJurisdictionGroups({
      countries,
      eu27Shell,
      jurisdictionGroupDefinitions,
    });

    const copy = copyBundle.text;

    return {
      status: "demo_only_not_verified",
      countries,
      eu27Shell,
      jurisdictionGroups,
      powerProfiles: workerProfiles.powerProfiles,
      runtimeProfiles: workerProfiles.runtimeProfiles,
      overheadProfiles: workerProfiles.overheadProfiles,
      electricityAllocationProfiles,
      comparisonAssumptions,
      copyLanguages: copyBundle.languages,
      copy,
    };
  }

  async function buildJurisdictionGroups({ countries, eu27Shell, jurisdictionGroupDefinitions }) {
    const countryByCode = new Map(countries.map((country) => [country.code, country]));
    const groups = [];

    for (const group of jurisdictionGroupDefinitions) {
      if (group.id === "eu") {
        groups.push({
          ...group,
          shell: eu27Shell.map(([code, name]) => ({ code, name })),
          records: countries,
        });
        continue;
      }

      if (group.id === "us") {
        const candidateDatasets = await Promise.all(
          (group.candidate_paths || []).map((candidatePath) => fetchJson(`${DATA_ROOT}/${candidatePath}`))
        );
        const records = candidateDatasets.flatMap((dataset) =>
          (dataset.records || []).map((record) => normalizeCandidateRecord(record, dataset, group))
        );
        groups.push({
          ...group,
          candidate_dataset_ids: candidateDatasets.map((dataset) => dataset.dataset_id),
          shell: records.map((record) => ({ code: record.code, name: record.name })),
          records,
        });
        continue;
      }

      groups.push({
        ...group,
        shell: (group.records || []).map((record) => ({ code: record.code, name: record.name })),
        records: group.records || [],
      });
    }

    return groups.map((group) => ({
      ...group,
      selectable_count: group.records.filter((record) => Number.isFinite(record.annual_electricity_twh)).length,
      shell_count: group.shell.length,
    }));
  }

  function normalizeCandidateRecord(record, dataset, group) {
    return {
      code: record.code,
      name: record.name,
      local_name: record.local_name || record.name,
      local_language: record.local_language || "en",
      local_language_label: record.local_language_label || "English",
      jurisdiction_type: record.jurisdiction_type || group.kind,
      parent: record.parent || null,
      population: record.population || null,
      annual_electricity_twh: record.annual_electricity_twh,
      electricity_per_capita_kwh_year: record.electricity_per_capita_kwh_year || null,
      source_name: record.source_name,
      source_url: record.source_url,
      source_year: record.source_year,
      source_status: record.source_status,
      retrieved_at: record.source_retrieved_at || null,
      definition: record.definition || dataset.definition,
      denominator_label: group.denominator_label,
      allocation_label_template: group.allocation_label_template,
      scenario_sentence_template: group.scenario_sentence_template,
      truth_boundary: group.truth_boundary,
      review_flags: record.review_flags || [],
      notes: record.notes || dataset.source_method_note || "",
    };
  }

  globalScope.AILabourPowerBudgetDataLoader = {
    loadPrototypeData,
  };
})(window);
