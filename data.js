(function attachPrototypeDataLoader(globalScope) {
  "use strict";

  const DATA_ROOT = new URL("./data", document.currentScript?.src || globalScope.location.href).href;
  const dataPolicy = globalScope.AILabourPowerBudgetDataPolicy;

  if (!dataPolicy) {
    throw new Error("AI Labour Power Budget data policy failed to load");
  }

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
      sourceDefinitions,
      promotionGate,
      copyBundle,
    ] = await Promise.all([
      fetchJson(`${DATA_ROOT}/countries.json`),
      fetchJson(`${DATA_ROOT}/eu27-shell.json`),
      fetchJson(`${DATA_ROOT}/jurisdiction-groups.json`),
      fetchJson(`${DATA_ROOT}/worker-profiles.json`),
      fetchJson(`${DATA_ROOT}/electricity-allocation-profiles.json`),
      fetchJson(`${DATA_ROOT}/comparison-assumptions.json`),
      fetchJson(`${DATA_ROOT}/source-definitions.json`),
      fetchJson(`${DATA_ROOT}/source-candidates/promotion-gate-summary.json`),
      loadCopy(),
    ]);

    const jurisdictionGroups = await buildJurisdictionGroups({
      countries,
      eu27Shell,
      jurisdictionGroupDefinitions,
      sourceDefinitions,
      promotionGate,
    });

    const copy = copyBundle.text;

    const defaultDataMode = jurisdictionGroups[0]?.data_mode || dataPolicy.DATA_MODES.DEMO;

    return {
      dataMode: defaultDataMode,
      availableDataModes: Object.values(dataPolicy.DATA_MODES),
      sourcePolicy: {
        policyVersion: sourceDefinitions.policy_version,
        runtimeImportAuthorized: sourceDefinitions.runtime_import_authorized,
        liveImportAuthorized: promotionGate.live_import_authorized,
      },
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

  async function buildJurisdictionGroups({
    countries,
    eu27Shell,
    jurisdictionGroupDefinitions,
    sourceDefinitions,
    promotionGate,
  }) {
    const groups = [];
    const definitionsById = new Map(
      (sourceDefinitions.definitions || []).map((definition) => [definition.id, definition])
    );

    for (const group of jurisdictionGroupDefinitions) {
      const mode = group.data_mode || dataPolicy.DATA_MODES.DEMO;
      dataPolicy.assertKnownDataMode(mode);
      const sourceDefinition = definitionsById.get(group.source_definition_id) || null;

      if (mode === dataPolicy.DATA_MODES.SOURCE_CANDIDATE_REVIEW) {
        if (!group.candidate_paths?.length) {
          throw new Error(`${group.id} candidate-review mode requires candidate_paths`);
        }
        const candidateDatasets = await Promise.all(
          group.candidate_paths.map((candidatePath) => fetchJson(`${DATA_ROOT}/${candidatePath}`))
        );
        const records = candidateDatasets.flatMap((dataset) =>
          (dataset.records || []).map((record) =>
            normalizeCandidateRecord(record, dataset, group, sourceDefinition)
          )
        );
        dataPolicy.validateDataMode({
          mode,
          records,
          runtimeImportAuthorized: sourceDefinitions.runtime_import_authorized,
          runtimeAllowed: sourceDefinition?.runtime_allowed === true,
        });
        groups.push({
          ...group,
          data_mode: mode,
          promotion_status: "candidate_not_promoted",
          source_definition: sourceDefinition,
          runtime_import_authorized: false,
          live_import_authorized: promotionGate.live_import_authorized === true,
          candidate_dataset_ids: candidateDatasets.map((dataset) => dataset.dataset_id),
          shell: group.shell_path === "eu27-shell.json"
            ? eu27Shell.map(([code, name]) => ({ code, name }))
            : records.map((record) => ({ code: record.code, name: record.name })),
          records,
        });
        continue;
      }

      if (mode === dataPolicy.DATA_MODES.PROMOTED_RUNTIME) {
        dataPolicy.validateDataMode({
          mode,
          records: group.records || [],
          runtimeImportAuthorized: sourceDefinitions.runtime_import_authorized,
          runtimeAllowed: sourceDefinition?.runtime_allowed === true,
        });
      }

      if (mode === dataPolicy.DATA_MODES.DEMO && group.id === "eu") {
        const demoRecords = countries.map((record) => normalizeDemoRecord(record, group));
        dataPolicy.validateDataMode({ mode, records: demoRecords });
        groups.push({
          ...group,
          data_mode: mode,
          shell: eu27Shell.map(([code, name]) => ({ code, name })),
          records: demoRecords,
        });
        continue;
      }

      const records = group.records || [];
      dataPolicy.validateDataMode({ mode, records });
      groups.push({
        ...group,
        data_mode: mode,
        shell: (group.records || []).map((record) => ({ code: record.code, name: record.name })),
        records,
      });
    }

    return groups.map((group) => ({
      ...group,
      selectable_count: group.records.filter((record) => Number.isFinite(record.annual_electricity_twh)).length,
      shell_count: group.shell.length,
    }));
  }

  function normalizeCandidateRecord(record, dataset, group, sourceDefinition) {
    return {
      code: record.code,
      name: record.name,
      local_name: record.local_name || record.name,
      sentence_name: record.sentence_name || null,
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
      data_mode: dataPolicy.DATA_MODES.SOURCE_CANDIDATE_REVIEW,
      promotion_status: "candidate_not_promoted",
      source_metric: record.source_metric || sourceDefinition?.metric_label || record.definition || dataset.definition,
      source_definition: sourceDefinition?.definition || record.definition || dataset.definition,
      source_review_status: sourceDefinition?.review_status || "source_candidate_not_promoted",
      runtime_allowed: sourceDefinition?.runtime_allowed === true,
    };
  }

  function normalizeDemoRecord(record, group) {
    return {
      ...record,
      data_mode: dataPolicy.DATA_MODES.DEMO,
      promotion_status: "demo_not_verified",
      denominator_label: group.denominator_label,
      allocation_label_template: group.allocation_label_template,
      scenario_sentence_template: group.scenario_sentence_template,
      truth_boundary: group.truth_boundary,
    };
  }

  globalScope.AILabourPowerBudgetDataLoader = {
    loadPrototypeData,
  };
})(window);
