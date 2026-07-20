(async function initAiLabourPowerBudget() {
  "use strict";

  const calculator = window.AILabourPowerBudgetCalculator;
  const dataLoader = window.AILabourPowerBudgetDataLoader;
  const displayFormat = window.AILabourPowerBudgetDisplayFormat;
  let data;

  try {
    data = await dataLoader.loadPrototypeData();
  } catch (error) {
    document.body.innerHTML = `<main class="tool-shell"><section class="source-box" style="margin-top: 10vh;"><p class="panel-label">Data load failed</p><p>${escapeHtml(error.message)}</p><p>Run this prototype through a local HTTP server so the JSON files can load.</p></section></main>`;
    throw error;
  }

  const state = {
    page: "country-select",
    jurisdictionGroupId: "eu",
    dataMode: data.dataMode,
    selectedCountry: null,
    wattsPerAiWorker: 700,
    powerProfileId: "heavy_700w",
    runtimeHoursPerWeek: 168,
    runtimeProfileId: "always_on_24_7",
    overheadFactor: 1,
    overheadProfileId: "raw_compute",
    targetAiWorkers: 1000000,
    allocationProfileId: "ten_percent",
    electricityAllocationShare: 0.1,
    budgetDriver: "allocation",
    languageMode: "en",
  };

  const app = document.querySelector("#app");
  const serverStage = document.querySelector(".server-stage");
  const pages = Array.from(document.querySelectorAll("[data-page]"));
  const stepButtons = Array.from(document.querySelectorAll("[data-step-target]"));
  const countryRack = document.querySelector("#country-rack");
  const countrySelect = document.querySelector("#country-select");
  const jurisdictionModeSwitch = document.querySelector("#jurisdiction-mode-switch");
  const jurisdictionStatus = document.querySelector("#jurisdiction-status");
  const powerOptions = document.querySelector("#power-options");
  const runtimeOptions = document.querySelector("#runtime-options");
  const overheadOptions = document.querySelector("#overhead-options");
  const workerScaleOptions = document.querySelector("#worker-scale-options");
  const workerScaleSlider = document.querySelector("#worker-scale-slider");
  const allocationDriverValue = document.querySelector("#allocation-driver-value");
  const profileDriverValue = document.querySelector("#profile-driver-value");
  const targetProfileOptions = document.querySelector("#target-profile-options");
  const targetWorkersSlider = document.querySelector("#target-workers-slider");
  const customWatts = document.querySelector("#custom-watts");
  const customRuntime = document.querySelector("#custom-runtime");
  const customOverhead = document.querySelector("#custom-overhead");
  const targetWorkers = document.querySelector("#target-workers");
  const workerReadout = document.querySelector("#worker-readout");
  const budgetPreview = document.querySelector("#budget-preview");
  const previewCountry = document.querySelector("#preview-country");
  const balanceMode = document.querySelector("#balance-mode");
  const equationShare = document.querySelector("#equation-share");
  const equationShareLabel = document.querySelector("#equation-share-label");
  const equationProfiles = document.querySelector("#equation-profiles");
  const sharePreview = document.querySelector("#share-preview");
  const targetPreview = document.querySelector("#target-preview");
  const pressureFill = document.querySelector("#pressure-fill");
  const reportGrid = document.querySelector("#report-grid");
  const reportCoreSentence = document.querySelector("#report-core-sentence");
  const sourceEvidence = document.querySelector("#source-evidence");
  const allocationDriverHeading = document.querySelector("#allocation-driver-heading");
  const allocationRangeLabel = document.querySelector("#allocation-range-label");
  const languageToggle = document.querySelector("#language-toggle");
  const languageState = document.querySelector("#language-state");
  const guideOverlay = document.querySelector("#app-guide");
  const guidePanel = document.querySelector(".guide-panel");
  let lastGuideTrigger = document.querySelector('[data-action="open-guide"]');

  const copy = data.copy;
  const copyLanguageByCode = new Map((data.copyLanguages || []).map((language) => [language.code, language]));
  const MAX_ALLOCATION_SHARE = 3;
  const SLIDER_MAX = 1000;
  const SHARE_SLIDER_POINTS = [
    { slider: 0, share: 0 },
    { slider: 260, share: 0.01 },
    { slider: 430, share: 0.1 },
    { slider: 610, share: 0.25 },
    { slider: 780, share: 1 },
    { slider: SLIDER_MAX, share: MAX_ALLOCATION_SHARE },
  ];
  const TARGET_PROFILE_PRESETS = [
    { id: "target_100k", label: "100k", value: 100000 },
    { id: "target_1m", label: "1M", value: 1000000 },
    { id: "target_10m", label: "10M", value: 10000000 },
    { id: "target_50m", label: "50M", value: 50000000 },
    { id: "target_250m", label: "250M", value: 250000000 },
  ];

  const jurisdictionGroups = data.jurisdictionGroups || [];
  const jurisdictionGroupById = new Map(jurisdictionGroups.map((group) => [group.id, group]));
  const profileControls = {
    power: {
      profiles: data.powerProfiles,
      container: powerOptions,
      stateId: "powerProfileId",
      stateValue: "wattsPerAiWorker",
      valueKey: "watts",
      input: customWatts,
      min: 1,
      max: 50000,
      fallback: 700,
    },
    runtime: {
      profiles: data.runtimeProfiles,
      container: runtimeOptions,
      stateId: "runtimeProfileId",
      stateValue: "runtimeHoursPerWeek",
      valueKey: "hours_per_week",
      input: customRuntime,
      min: 1,
      max: 168,
      fallback: 168,
    },
    overhead: {
      profiles: data.overheadProfiles,
      container: overheadOptions,
      stateId: "overheadProfileId",
      stateValue: "overheadFactor",
      valueKey: "factor",
      input: customOverhead,
      min: 0.1,
      max: 10,
      fallback: 1,
    },
  };

  function activeJurisdictionGroup() {
    return jurisdictionGroupById.get(state.jurisdictionGroupId) || jurisdictionGroups[0];
  }

  function activeDataMode() {
    return activeJurisdictionGroup()?.data_mode || state.dataMode || "demo";
  }

  function dataModeLabel(text = activeCopy()) {
    if (activeDataMode() === "source_candidate_review") return text.dataModeSourceCandidateReview;
    if (activeDataMode() === "promoted_runtime") return text.dataModePromotedRuntime;
    return text.dataModeDemo;
  }

  function dataModeBoundary(text = activeCopy()) {
    if (activeDataMode() === "source_candidate_review") return text.dataModeSourceCandidateReviewText;
    if (activeDataMode() === "promoted_runtime") return text.dataModePromotedRuntimeText;
    return text.dataModeDemoText;
  }

  function activeJurisdictionRecords() {
    return activeJurisdictionGroup()?.records || [];
  }

  function activeCountryByCode() {
    return new Map(activeJurisdictionRecords().map((country) => [country.code, country]));
  }

  function renderJurisdictionModes() {
    if (!jurisdictionModeSwitch) return;
    const activeGroup = activeJurisdictionGroup();
    jurisdictionModeSwitch.innerHTML = jurisdictionGroups
      .map((group) => {
        const active = group.id === activeGroup?.id ? " is-active" : "";
        const status = group.status === "source_not_selected" ? "not-ready" : group.status.replaceAll("_", "-");
        return `<button type="button" class="jurisdiction-button${active}" data-jurisdiction-group="${escapeAttribute(group.id)}" data-status="${escapeAttribute(status)}">
          <strong>${escapeHtml(group.short_label || group.label)}</strong>
          <span>${escapeHtml(String(group.selectable_count || 0))}/${escapeHtml(String(group.shell_count || 0))}</span>
        </button>`;
      })
      .join("");

    if (jurisdictionStatus && activeGroup) {
      jurisdictionStatus.textContent = `${activeGroup.label} · ${denominatorText()} · ${dataModeLabel()}`;
    }
  }

  function renderCountrySelectors() {
    const text = activeCopy();
    const activeGroup = activeJurisdictionGroup();
    const countryByCode = activeCountryByCode();
    const rackSlots = [...(activeGroup.shell || [])];
    const minimumSlots = activeGroup.id === "eu" ? 30 : Math.max(36, rackSlots.length);
    while (rackSlots.length < minimumSlots) {
      rackSlots.push({ code: "", name: "Empty bay" });
    }

    countryRack.style.setProperty("--rack-columns", String(activeGroup.rack_columns || 5));
    countryRack.dataset.jurisdiction = activeGroup.id || "";
    countryRack.classList.toggle("is-dense", rackSlots.length > 36);
    countryRack.setAttribute("aria-label", `${activeGroup.label} rack selector`);
    countryRack.innerHTML = rackSlots
      .map((slot) => {
        const code = Array.isArray(slot) ? slot[0] : slot.code;
        const name = Array.isArray(slot) ? slot[1] : slot.name;
        if (!code) {
          return `<span class="rack-slot is-empty" aria-hidden="true"></span>`;
        }
        const hasData = countryByCode.has(code);
        const classes = [
          "rack-slot",
          hasData ? "has-data" : "",
          activeGroup.id === "us" && code === "US" ? "is-national" : "",
          activeGroup.id === "eu" && code === "EU27" ? "is-national" : "",
          activeGroup.id === "world" && code === "WLD" ? "is-national" : "",
        ].filter(Boolean).join(" ");
        const disabled = hasData ? "" : "disabled";
        return `<button type="button" class="${classes}" data-country-code="${escapeHtml(code)}" ${disabled} aria-label="${escapeAttribute(name)}">
          <span>${escapeHtml(rackDisplayCode(code))}</span>
          <small aria-hidden="true"></small>
        </button>`;
      })
      .join("");

    countrySelect.innerHTML = [
      `<option value="">${escapeHtml(text.selectCountry)}</option>`,
      ...(activeGroup.shell || []).map((slot) => {
        const code = Array.isArray(slot) ? slot[0] : slot.code;
        const name = Array.isArray(slot) ? slot[1] : slot.name;
        const hasData = countryByCode.has(code);
        const sourceStatus = countryByCode.get(code)?.source_status;
        const suffix = hasData ? ` - ${sourceStatus || text.demoValue}` : ` - ${text.sourcePassNeeded}`;
        return `<option value="${escapeAttribute(code)}" ${hasData ? "" : "disabled"}>${escapeHtml(countryShellName(code, name) + suffix)}</option>`;
      }),
    ].join("");
    renderJurisdictionModes();
  }

  function activeLanguage() {
    if (state.languageMode === "local" && state.selectedCountry?.local_language) {
      return state.selectedCountry.local_language;
    }
    return "en";
  }

  function activeCopy() {
    return copy[activeLanguage()] || copy.en;
  }

  function activeLocale() {
    const language = activeLanguage();
    return copyLanguageByCode.get(language)?.locale || "en";
  }

  function countryDisplayName(country) {
    if (!country) return activeCopy().noCountrySelected;
    if (state.languageMode === "local" && country.local_name) return country.local_name;
    return country.name;
  }

  function countrySentenceName(country) {
    if (!country) return activeCopy().noCountrySelected;
    return country.sentence_name || countryDisplayName(country);
  }

  function countryShellName(code, fallbackName) {
    const country = activeCountryByCode().get(code);
    if (state.languageMode === "local" && country?.local_name) return country.local_name;
    return fallbackName;
  }

  function rackDisplayCode(code) {
    if (activeJurisdictionGroup()?.id === "world" && code === "WLD") {
      return "WORLD";
    }
    if (activeJurisdictionGroup()?.id === "us" && /^US-[A-Z]{2}$/.test(code)) {
      return code.slice(3);
    }
    return code;
  }

  function updateLanguageControl() {
    const text = activeCopy();
    if (languageState) {
      languageState.textContent = state.languageMode === "local" ? text.languageState : copy.en.languageState;
    }
    if (languageToggle) {
      const localLabel = state.selectedCountry?.local_language_label || text.localLanguageFallback;
      languageToggle.textContent = state.languageMode === "local" ? text.languageButton : localLabel;
      languageToggle.classList.toggle("is-active", state.languageMode === "local");
    }
  }

  function applyStaticCopy() {
    const text = activeCopy();
    const modeStatusChip = activeDataMode() === "source_candidate_review"
      ? text.candidateNotPromoted
      : activeDataMode() === "promoted_runtime"
        ? text.dataModePromotedRuntime
        : text.notVerified;
    const modeChips = [dataModeLabel(text), modeStatusChip, text.statusChips[2]];
    document.querySelectorAll(".status-stack span").forEach((chip, index) => {
      chip.textContent = modeChips[index] || chip.textContent;
    });
    stepButtons.forEach((button, index) => {
      button.textContent = text.steps[index] || button.textContent;
    });

    const workerPanel = document.querySelector(".page-worker");
    const allocationPanel = document.querySelector(".page-allocation");
    const reportPanel = document.querySelector(".page-report");
    const sourceBox = document.querySelector(".page-report .source-box:not(.source-evidence)");

    setText("#worker-heading", text.defineWorker);
    setText(".page-worker .panel-label", text.workerProfile);
    setText(".page-worker .panel-head p:not(.panel-label)", text.workerIntro);
    setText('[data-action="back-country"]', text.back);
    setText('[data-action="back-worker"]', text.back);
    setText('[data-action="back-allocation"]', text.back);
    setText('[data-action="download-report"]', text.downloadReport);
    setText('[data-action="restart"]', text.restart);
    setText('[data-cycle-control="power"] h3', text.powerDraw);
    setText('[data-cycle-control="runtime"] h3', text.runtime);
    setText('[data-cycle-control="overhead"] h3', text.infrastructureOverhead);
    setText('[for="country-select"]', text.selectCountry);

    if (workerPanel) {
      const customLabels = workerPanel.querySelectorAll(".custom-field span");
      if (customLabels[0]) customLabels[0].textContent = text.customWatts;
      if (customLabels[1]) customLabels[1].textContent = text.customHours;
      if (customLabels[2]) customLabels[2].textContent = text.customFactor;
    }
    setText(".readout-card .panel-label", text.oneWorkerUses);
    setText(".readout-card .boundary-copy", text.scenarioSettingsBoundary);
    setText('[data-action="to-allocation"]', text.continueToScale);

    setText(".page-allocation .panel-label", text.countryElectricityBudget);
    setText("#allocation-heading", text.chooseElectricityShare);
    setText(
      ".page-allocation .panel-head p:not(.panel-label)",
      formatTemplate(text.allocationIntro, { denominator: denominatorText(text) })
    );
    setText(".page-allocation .control-card h3", text.electricityShare);
    if (allocationPanel) {
      const allocationLabels = allocationPanel.querySelectorAll(".custom-field span");
      if (allocationLabels[0]) allocationLabels[0].textContent = text.compareTargetProfiles;
    }
    setText(".budget-preview .panel-label", text.preview);
    setText('[data-action="to-report"]', text.generateReport);

    setText(".page-report .panel-label", text.scenarioReport);
    setText("#report-heading", text.scenarioReport);
    if (reportPanel && !state.selectedCountry) {
      reportCoreSentence.textContent = text.noCountrySelected;
    }
    if (sourceBox) {
      const label = sourceBox.querySelector(".panel-label");
      const paragraph = sourceBox.querySelector("p:not(.panel-label)");
      if (label) label.textContent = text.truthBoundary;
      if (paragraph) paragraph.textContent = truthBoundaryText();
    }
  }

  function setText(selector, value) {
    const node = document.querySelector(selector);
    if (node) node.textContent = value;
  }

  function localizeProfile(profile) {
    const localized = activeCopy().profileText?.[profile.id] || {};
    return {
      label: localized.label || profile.label,
      description: localized.description || profile.description || "",
    };
  }

  function renderProfileButtons(container, profiles, activeId, getValue) {
    container.innerHTML = profiles
      .map((profile) => {
        const profileText = localizeProfile(profile);
        const active = profile.id === activeId ? " is-active" : "";
        return `<button type="button" class="option-button${active}" data-profile-id="${escapeAttribute(profile.id)}" data-profile-value="${escapeAttribute(getValue(profile))}">
          <strong>${escapeHtml(profileText.label)}</strong>
          <span>${escapeHtml(profileText.description)}</span>
        </button>`;
      })
      .join("");
  }

  function renderAllControls() {
    renderProfileButtons(powerOptions, data.powerProfiles, state.powerProfileId, (item) => item.watts);
    renderProfileButtons(runtimeOptions, data.runtimeProfiles, state.runtimeProfileId, (item) => item.hours_per_week);
    renderProfileButtons(overheadOptions, data.overheadProfiles, state.overheadProfileId, (item) => item.factor);
    renderProfileButtons(workerScaleOptions, data.electricityAllocationProfiles, state.allocationProfileId, (item) => item.share);
    renderTargetProfileButtons();
    syncInstrumentLabels();
  }

  function renderTargetProfileButtons() {
    if (!targetProfileOptions) return;
    const text = activeCopy();
    const maxProfiles = maxTargetProfiles();
    targetProfileOptions.innerHTML = TARGET_PROFILE_PRESETS.map((preset) => {
      const disabled = preset.value > maxProfiles ? "disabled" : "";
      const active = Math.abs(state.targetAiWorkers - preset.value) < 1 ? " is-active" : "";
      return `<button type="button" class="option-button${active}" data-target-workers="${escapeAttribute(preset.value)}" ${disabled}>
        <strong>${escapeHtml(preset.label)}</strong>
        <span>${escapeHtml(disabled ? text.overThreeHundredPercent : text.targetPreset)}</span>
      </button>`;
    }).join("");
  }

  function selectCountry(code) {
    const country = activeCountryByCode().get(code);
    if (!country) {
      return;
    }

    state.selectedCountry = country;
    countrySelect.value = code;
    syncSelectedCountryButton(code);
    if (state.languageMode === "local") {
      renderCountrySelectors();
      countrySelect.value = code;
      syncSelectedCountryButton(code);
      renderAllControls();
    }
    updateLanguageControl();
    goToPage("worker-profile");
  }

  function selectJurisdictionGroup(groupId) {
    if (!jurisdictionGroupById.has(groupId) || state.jurisdictionGroupId === groupId) return;
    state.jurisdictionGroupId = groupId;
    state.dataMode = activeJurisdictionGroup()?.data_mode || data.dataMode;
    state.selectedCountry = null;
    countrySelect.value = "";
    renderCountrySelectors();
    updateLanguageControl();
    applyStaticCopy();
    updateOutputs();
    goToPage("country-select");
  }

  function syncSelectedCountryButton(code) {
    countryRack.querySelectorAll(".rack-slot").forEach((slot) => {
      slot.classList.toggle("is-selected", slot.getAttribute("data-country-code") === code);
    });
  }

  function goToPage(page) {
    state.page = page;
    app.dataset.scene = page;
    pages.forEach((node) => node.classList.toggle("is-active", node.getAttribute("data-page") === page));
    stepButtons.forEach((button) => {
      const target = button.getAttribute("data-step-target");
      const enabled = canOpenPage(target);
      button.disabled = !enabled;
      button.classList.toggle("is-active", target === page);
    });
    applyStaticCopy();
    updateOutputs();
    syncStageHeight();
  }

  function canOpenPage(page) {
    if (page === "country-select") return true;
    if (!state.selectedCountry) return false;
    if (page === "worker-profile") return true;
    if (page === "allocation") return true;
    if (page === "report") return true;
    return false;
  }

  function readScenario() {
    if (!state.selectedCountry) {
      return null;
    }

    return calculator.calculateCountryBudget({
      annualElectricityTwh: state.selectedCountry.annual_electricity_twh,
      electricityAllocationShare: state.electricityAllocationShare,
      wattsPerAiWorker: state.wattsPerAiWorker,
      runtimeHoursPerWeek: state.runtimeHoursPerWeek,
      overheadFactor: state.overheadFactor,
      targetAiWorkers: state.targetAiWorkers,
    });
  }

  function updateOutputs() {
    const text = activeCopy();
    const worker = calculator.calculateWorkerEnergy({
      wattsPerAiWorker: state.wattsPerAiWorker,
      runtimeHoursPerWeek: state.runtimeHoursPerWeek,
      overheadFactor: state.overheadFactor,
    });

    workerReadout.innerHTML = [
      readout(text.averageKwhCalendarDay, formatNumber(worker.kwhDayAverage, 2), "is-numeric"),
      readout(text.unitKwhPerYear, formatNumber(worker.kwhYear, 0), "is-numeric"),
      readout(text.unitMwhPerYear, formatNumber(worker.mwhYear, 3), "is-numeric"),
    ].join("");

    reconcileBudgetDriver();
    const scenario = readScenario();
    if (!scenario) {
      budgetPreview.innerHTML = "";
      reportGrid.innerHTML = "";
      if (sourceEvidence) sourceEvidence.innerHTML = "";
      return;
    }

    const profileCount = scenarioProfileCount(scenario);
    const beyondTotal = isBeyondTotalElectricity(state.electricityAllocationShare);
    previewCountry.textContent = `${countryDisplayName(state.selectedCountry)} · ${dataModeLabel(text)}`;
    if (allocationDriverHeading) allocationDriverHeading.textContent = beyondTotal ? text.requiredEnergy : text.electricityShare;
    if (allocationRangeLabel) allocationRangeLabel.textContent = beyondTotal ? text.requiredEnergyMultiple : text.electricityShare;
    if (equationShareLabel) equationShareLabel.textContent = beyondTotal ? text.requiredEnergyMultiple : text.electricityShare;
    if (allocationDriverValue) {
      allocationDriverValue.textContent = beyondTotal
        ? formatEnergyMultiple(state.electricityAllocationShare)
        : formatPercent(state.electricityAllocationShare);
    }
    if (profileDriverValue) profileDriverValue.textContent = `${formatInteger(state.targetAiWorkers)} ${text.profiles}`;
    if (equationShare) {
      equationShare.textContent = beyondTotal
        ? formatEnergyMultiple(state.electricityAllocationShare)
        : formatPercent(state.electricityAllocationShare);
    }
    if (equationProfiles) equationProfiles.textContent = formatInteger(profileCount);
    if (balanceMode) {
      balanceMode.textContent = beyondTotal
        ? text.beyondTotalIntro
        : state.budgetDriver === "profiles"
          ? text.compareTargetProfiles
          : text.nationalAllocation;
    }
    sharePreview.textContent = scenarioCoreSentence(scenario, profileCount);
    pressureFill.style.width = `${Math.min(100, state.electricityAllocationShare / MAX_ALLOCATION_SHARE * 100)}%`;
    pressureFill.dataset.pressure = pressureBand(state.electricityAllocationShare);
    budgetPreview.innerHTML = [
      readout(
        beyondTotal ? text.requiredEnergy : text.selectedAllocation,
        beyondTotal
          ? formatTemplate(requiredEnergyLabelTemplate(), {
              energyMultiple: formatEnergyMultipleValue(state.electricityAllocationShare),
              denominator: denominatorText(text),
            })
          : formatTemplate(allocationLabelTemplate(), {
              share: formatPercent(state.electricityAllocationShare),
              denominator: denominatorText(text),
            })
      ),
      readout(text.equivalentProfiles, `${formatInteger(profileCount)} ${text.profiles}`, "is-numeric"),
      readout(
        beyondTotal ? text.requiredEnergy : text.allocatedElectricity,
        formatValueWithUnit(scenario.allocatedElectricityTwhYear, 3, "unitTwhPerYear"),
        "is-numeric"
      ),
      readout(text.averageAllocatedLoad, `${formatNumber(allocatedAverageLoadGw(scenario), 3)} GW`, "is-numeric"),
      readout(
        text.annualElectricity,
        formatValueWithUnit(state.selectedCountry.annual_electricity_twh, 1, "unitTwhPerYear"),
        "is-numeric"
      ),
    ].join("");
    targetPreview.textContent = targetComparisonSentence(scenario);

    syncBudgetControlValues(scenario);
    reportCoreSentence.textContent = scenarioCoreSentence(scenario, profileCount);
    reportGrid.innerHTML = renderReport(scenario);
    if (sourceEvidence) sourceEvidence.innerHTML = renderSourceEvidence();
    updateTruthBoundary();
    syncStageHeight();
  }

  function renderReport(scenario) {
    const text = activeCopy();
    const source = state.selectedCountry.source_status;
    const profileCount = scenarioProfileCount(scenario);
    const beyondTotal = isBeyondTotalElectricity(state.electricityAllocationShare);
    return [
      metric(text.equivalentProfiles, formatInteger(profileCount), text.energyBoundary, "is-primary"),
      metric(
        beyondTotal ? text.requiredEnergyMultiple : text.electricityAllocation,
        beyondTotal ? formatEnergyMultiple(state.electricityAllocationShare) : formatPercent(state.electricityAllocationShare),
        beyondTotal
          ? text.beyondTotalElectricity
          : formatTemplate(allocationLabelTemplate(), {
              share: formatPercent(state.electricityAllocationShare),
              denominator: denominatorText(text),
            }),
        "is-primary"
      ),
      metric(
        beyondTotal ? text.requiredEnergy : text.allocatedElectricity,
        formatValueWithUnit(scenario.allocatedElectricityTwhYear, 3, "unitTwhPerYear"),
        text.scenarioOutput
      ),
      metric(text.country, countryDisplayName(state.selectedCountry), source),
      metric(text.wattProfile, `${formatNumber(state.wattsPerAiWorker, 0)} W`, text.scenarioSetting),
      metric(text.runtime, runtimeLabel(state.runtimeHoursPerWeek), text.scenarioSetting),
      metric(text.overhead, `${formatNumber(state.overheadFactor, 2)}x`, text.scenarioSetting),
      metric(
        text.oneAiWorker,
        formatTemplate(text.averageKwhCalendarDayValueTemplate, {
          value: formatNumber(scenario.worker.kwhDayAverage, 2),
        }),
        text.underSelectedWattProfile
      ),
      metric(
        text.oneProfileYearly,
        formatValueWithUnit(scenario.worker.mwhYear, 4, "unitMwhPerYear"),
        text.calculationBasisPrecise
      ),
      metric(text.calculationBasis, calculationBasisText(scenario), text.calculationBasisStatus, "is-calculation"),
      metric(text.averageAllocatedLoad, `${formatNumber(allocatedAverageLoadGw(scenario), 3)} GW`, text.annualEnergySpread),
      metric(
        text.targetComparison,
        `${formatInteger(state.targetAiWorkers)} ${text.profiles}`,
        isBeyondTotalElectricity(scenario.shareOfNationalElectricityNeeded)
          ? formatTemplate(requiredEnergyLabelTemplate(), {
              energyMultiple: formatEnergyMultipleValue(scenario.shareOfNationalElectricityNeeded),
              denominator: denominatorText(text),
            })
          : formatTemplate(allocationLabelTemplate(), {
              share: formatPercent(scenario.shareOfNationalElectricityNeeded),
              denominator: denominatorText(text),
            })
      ),
      ...renderComparisons(scenario),
      metric(formatTemplate(text.shareCapacityLabelTemplate, { share: "1%" }), `${formatInteger(supportedAtShare(0.01))} ${text.profiles}`, source),
      metric(formatTemplate(text.shareCapacityLabelTemplate, { share: "10%" }), `${formatInteger(supportedAtShare(0.1))} ${text.profiles}`, source),
      metric(formatTemplate(text.shareCapacityLabelTemplate, { share: "100%" }), `${formatInteger(supportedAtShare(1))} ${text.profiles}`, text.thoughtExperiment),
      metric(text.dataStatus, source, activeDataMode() === "source_candidate_review" ? text.candidateNotPromoted : text.notVerified),
    ].join("");
  }

  function sourceEvidenceRows() {
    const text = activeCopy();
    const country = state.selectedCountry;
    if (!country) return [];
    return [
      [text.dataMode, dataModeLabel(text), null],
      [text.sourceName, country.source_name || text.sourceUnavailable, null],
      [text.sourceYear, country.source_year || text.sourceUnavailable, null],
      [text.sourceMetric, country.source_metric || country.definition || text.sourceUnavailable, null],
      [text.retrievalDate, country.retrieved_at || text.sourceUnavailable, null],
      [text.sourceStatus, `${country.source_status || text.sourceUnavailable} · ${country.promotion_status || text.sourceUnavailable}`, null],
      [text.sourceUrl, country.source_url || text.sourceUnavailable, country.source_url || null],
    ];
  }

  function renderSourceEvidence() {
    const text = activeCopy();
    const rows = sourceEvidenceRows().map(([label, value, href]) => {
      const renderedValue = href
        ? `<a href="${escapeAttribute(href)}" target="_blank" rel="noopener noreferrer">${escapeHtml(value)}</a>`
        : escapeHtml(value);
      return `<div><dt>${escapeHtml(label)}</dt><dd>${renderedValue}</dd></div>`;
    }).join("");
    const candidateBoundary = activeDataMode() === "source_candidate_review"
      ? `<p class="source-evidence__boundary">${escapeHtml(text.sourceCandidateReportBoundary)}</p>`
      : "";
    return `<p class="panel-label">${escapeHtml(text.sourceEvidence)}</p><dl>${rows}</dl>${candidateBoundary}`;
  }

  function truthBoundaryText() {
    const text = activeCopy();
    const parts = [dataModeBoundary(text)];
    const jurisdictionBoundary = jurisdictionTruthBoundary(text);
    if (jurisdictionBoundary) {
      parts.push(jurisdictionBoundary);
    }
    parts.push(text.truthBoundaryText);
    return parts.filter(Boolean).join(" ");
  }

  function jurisdictionTruthBoundary(text = activeCopy()) {
    const group = activeJurisdictionGroup();
    const copyKey = group?.truth_boundary_copy_key;
    return (copyKey && (text[copyKey] || copy.en[copyKey])) || "";
  }

  function updateTruthBoundary() {
    const paragraph = document.querySelector(".page-report .source-box:not(.source-evidence) p:not(.panel-label)");
    if (paragraph) paragraph.textContent = truthBoundaryText();
  }

  function supportedAtShare(share) {
    if (!state.selectedCountry) return 0;
    return calculator.calculateCountryBudget({
      annualElectricityTwh: state.selectedCountry.annual_electricity_twh,
      electricityAllocationShare: share,
      wattsPerAiWorker: state.wattsPerAiWorker,
      runtimeHoursPerWeek: state.runtimeHoursPerWeek,
      overheadFactor: state.overheadFactor,
      targetAiWorkers: state.targetAiWorkers,
    }).supportedAiWorkers;
  }

  function maxTargetProfiles() {
    if (!state.selectedCountry) return 1000000;
    return Math.max(1000, supportedAtShare(MAX_ALLOCATION_SHARE));
  }

  function targetShareForProfiles(profiles) {
    if (!state.selectedCountry) return state.electricityAllocationShare;
    return calculator.calculateShareForTargetProfiles({
      annualElectricityTwh: state.selectedCountry.annual_electricity_twh,
      targetAiWorkers: profiles,
      wattsPerAiWorker: state.wattsPerAiWorker,
      runtimeHoursPerWeek: state.runtimeHoursPerWeek,
      overheadFactor: state.overheadFactor,
    });
  }

  function scenarioProfileCount(scenario) {
    return state.budgetDriver === "profiles"
      ? Math.round(state.targetAiWorkers)
      : scenario.supportedAiWorkers;
  }

  function isBeyondTotalElectricity(share) {
    return calculator.classifyElectricityShare(share) === calculator.ELECTRICITY_SHARE_MODES.REQUIRED_ENERGY_MULTIPLE;
  }

  function formatEnergyMultiple(share) {
    return `${formatEnergyMultipleValue(share)}×`;
  }

  function formatEnergyMultipleValue(share) {
    const digits = share < 10 ? 2 : share < 100 ? 1 : 0;
    return formatNumber(share, digits);
  }

  function syncBudgetControlValues() {
    if (workerScaleSlider) {
      workerScaleSlider.value = String(shareToSliderValue(state.electricityAllocationShare));
    }
    if (targetWorkers) {
      targetWorkers.value = String(Math.round(state.targetAiWorkers));
    }
    if (targetWorkersSlider) {
      targetWorkersSlider.max = String(SLIDER_MAX);
      targetWorkersSlider.step = "1";
      targetWorkersSlider.value = String(profilesToSliderValue(state.targetAiWorkers));
    }
    renderTargetProfileButtons();
    workerScaleOptions.querySelectorAll(".option-button").forEach((button) => {
      const value = Number(button.getAttribute("data-profile-value"));
      button.classList.toggle("is-active", Math.abs(value - state.electricityAllocationShare) < 0.0001);
    });
  }

  function reconcileBudgetDriver() {
    if (!state.selectedCountry) return;
    if (state.budgetDriver === "profiles") {
      state.electricityAllocationShare = targetShareForProfiles(state.targetAiWorkers);
      return;
    }
    state.targetAiWorkers = supportedAtShare(state.electricityAllocationShare);
  }

  function pressureBand(share) {
    if (share < 0.25) return "low";
    if (share < 1) return "medium";
    if (share < MAX_ALLOCATION_SHARE) return "high";
    return "over";
  }

  function shareToSliderValue(share) {
    return Math.round(mapPiecewise(clampNumber(share, 0, MAX_ALLOCATION_SHARE, 0.1), "share", "slider", SHARE_SLIDER_POINTS));
  }

  function sliderValueToShare(value) {
    return mapPiecewise(clampNumber(value, 0, SLIDER_MAX, 0), "slider", "share", SHARE_SLIDER_POINTS);
  }

  function profilesToSliderValue(profiles) {
    const maxProfiles = maxTargetProfiles();
    if (maxProfiles <= 0) return 0;
    const clampedProfiles = clampNumber(profiles, 0, maxProfiles, 0);
    const ratio = Math.log1p(clampedProfiles) / Math.log1p(maxProfiles);
    return Math.round(ratio * SLIDER_MAX);
  }

  function sliderValueToProfiles(value) {
    const maxProfiles = maxTargetProfiles();
    if (maxProfiles <= 0) return 0;
    const ratio = clampNumber(value, 0, SLIDER_MAX, 0) / SLIDER_MAX;
    return Math.round(Math.expm1(Math.log1p(maxProfiles) * ratio));
  }

  function mapPiecewise(value, fromKey, toKey, points) {
    const sorted = [...points].sort((a, b) => a[fromKey] - b[fromKey]);
    if (value <= sorted[0][fromKey]) return sorted[0][toKey];
    for (let index = 1; index < sorted.length; index += 1) {
      const previous = sorted[index - 1];
      const next = sorted[index];
      if (value <= next[fromKey]) {
        const span = next[fromKey] - previous[fromKey];
        const ratio = span === 0 ? 0 : (value - previous[fromKey]) / span;
        return previous[toKey] + (next[toKey] - previous[toKey]) * ratio;
      }
    }
    return sorted[sorted.length - 1][toKey];
  }

  function allocatedAverageLoadGw(scenario) {
    return scenario.allocatedElectricityTwhYear / 8.76;
  }

  function renderComparisons(scenario) {
    const text = activeCopy();
    const assumptions = data.comparisonAssumptions;
    const averageLoadGw = allocatedAverageLoadGw(scenario);
    const fullOutputWindTurbines = averageLoadGw * 1000 / assumptions.onshore_wind_turbine_mw;
    const offshoreAverageWindTurbines =
      averageLoadGw * 1000 / (assumptions.offshore_wind_turbine_mw * assumptions.offshore_capacity_factor);
    const householdYears = scenario.allocatedElectricityTwhYear * 1000000000 / assumptions.household_kwh_year;
    const batteryPacks = scenario.allocatedElectricityTwhYear * 1000000 / assumptions.battery_pack_mwh;
    const nuclearReactors =
      averageLoadGw * 1000 / (assumptions.nuclear_reactor_mw * assumptions.nuclear_capacity_factor);
    const hydroPlants =
      averageLoadGw * 1000 / (assumptions.hydro_plant_mw * assumptions.hydro_capacity_factor);

    return [
      metric(text.wind3, formatInteger(fullOutputWindTurbines), text.fullOutputAssumption, "is-comparison"),
      metric(text.wind8, formatInteger(offshoreAverageWindTurbines), text.offshoreAssumption, "is-comparison"),
      metric(text.households, formatInteger(householdYears), text.householdAssumption, "is-comparison"),
      metric(copyLabel("batteryPacks"), formatInteger(batteryPacks), copyLabel("batteryAssumption"), "is-comparison"),
      metric(copyLabel("nuclearReactors"), formatNumber(nuclearReactors, 2), copyLabel("nuclearAssumption"), "is-comparison"),
      metric(copyLabel("hydroPlants"), formatNumber(hydroPlants, 2), copyLabel("hydroAssumption"), "is-comparison"),
    ];
  }

  function buildPdfReportModel(scenario) {
    const text = activeCopy();
    const generatedAt = new Date().toISOString();
    const profileCount = scenarioProfileCount(scenario);
    const beyondTotal = isBeyondTotalElectricity(state.electricityAllocationShare);
    const metrics = [
      { label: text.country, value: countryDisplayName(state.selectedCountry) },
      { label: text.equivalentProfiles, value: `${formatInteger(profileCount)} ${text.profiles}`, primary: true },
      {
        label: beyondTotal ? text.requiredEnergyMultiple : text.electricityAllocation,
        value: beyondTotal ? formatEnergyMultiple(state.electricityAllocationShare) : formatPercent(state.electricityAllocationShare),
      },
      {
        label: beyondTotal ? text.requiredEnergy : text.allocatedElectricity,
        value: formatValueWithUnit(scenario.allocatedElectricityTwhYear, 3, "unitTwhPerYear"),
      },
      { label: text.wattProfile, value: `${formatNumber(state.wattsPerAiWorker, 0)} W` },
      { label: text.runtime, value: runtimeLabel(state.runtimeHoursPerWeek) },
      { label: text.overhead, value: `${formatNumber(state.overheadFactor, 2)}x` },
      {
        label: text.oneProfileYearly,
        value: formatValueWithUnit(scenario.worker.mwhYear, 4, "unitMwhPerYear"),
      },
      { label: text.calculationBasis, value: calculationBasisText(scenario) },
      { label: text.dataStatus, value: state.selectedCountry.source_status },
    ];
    const comparisons = reportComparisonRows(scenario).map(([label, value, assumption]) => ({ label, value, assumption }));
    const evidenceRows = sourceEvidenceRows().map(([label, value, href]) => ({ label, value, href }));
    const sourceStatus = `${state.selectedCountry.source_status} · ${state.selectedCountry.promotion_status || ""}`;
    return {
      filename: `ai-labour-power-budget-${state.selectedCountry.code}-${generatedAt.slice(0, 10)}.pdf`,
      documentTitle: `AI Labour Power Budget - ${text.scenarioReport}`,
      author: "Hedegreen Research",
      subject: text.energyBoundary,
      locale: activeLanguage(),
      kicker: "Hedegreen Research · AI Labour Power Budget",
      title: text.scenarioReport,
      lead: scenarioCoreSentence(scenario, profileCount),
      energyBoundary: text.energyBoundary,
      metrics,
      comparisonsTitle: text.referenceComparisons,
      comparisons,
      sourceEvidence: {
        title: text.sourceEvidence,
        rows: evidenceRows,
        candidateBoundary: activeDataMode() === "source_candidate_review" ? text.sourceCandidateReportBoundary : "",
      },
      truthBoundary: {
        title: text.truthBoundary,
        text: truthBoundaryText(),
      },
      generatedLabel: text.generatedLabel,
      generatedAt,
      statusLabel: text.sourceStatus,
      status: sourceStatus,
      footer: text.publicReviewPdfBoundary,
    };
  }

  async function downloadScenarioReportPdf(button) {
    const scenario = readScenario();
    if (!scenario || !state.selectedCountry || !button) return;
    const pdfReport = window.AILabourPowerBudgetPdfReport;
    if (!pdfReport || !window.pdfMake) {
      console.error("AI Labour Power Budget PDF runtime is unavailable.");
      return;
    }

    button.disabled = true;
    button.setAttribute("aria-busy", "true");
    try {
      await pdfReport.downloadReport(buildPdfReportModel(scenario), {
        pdfMake: window.pdfMake,
        env: window,
      });
    } catch (error) {
      console.error("AI Labour Power Budget PDF download failed", error);
    } finally {
      button.disabled = false;
      button.removeAttribute("aria-busy");
    }
  }

  function reportComparisonRows(scenario) {
    const text = activeCopy();
    const assumptions = data.comparisonAssumptions;
    const averageLoadGw = allocatedAverageLoadGw(scenario);
    return [
      [text.wind3, formatInteger(averageLoadGw * 1000 / assumptions.onshore_wind_turbine_mw), text.fullOutputAssumption],
      [
        text.wind8,
        formatInteger(averageLoadGw * 1000 / (assumptions.offshore_wind_turbine_mw * assumptions.offshore_capacity_factor)),
        text.offshoreAssumption,
      ],
      [
        text.households,
        formatInteger(scenario.allocatedElectricityTwhYear * 1000000000 / assumptions.household_kwh_year),
        text.householdAssumption,
      ],
      [
        copyLabel("batteryPacks"),
        formatInteger(scenario.allocatedElectricityTwhYear * 1000000 / assumptions.battery_pack_mwh),
        copyLabel("batteryAssumption"),
      ],
      [
        copyLabel("nuclearReactors"),
        formatNumber(averageLoadGw * 1000 / (assumptions.nuclear_reactor_mw * assumptions.nuclear_capacity_factor), 2),
        copyLabel("nuclearAssumption"),
      ],
      [
        copyLabel("hydroPlants"),
        formatNumber(averageLoadGw * 1000 / (assumptions.hydro_plant_mw * assumptions.hydro_capacity_factor), 2),
        copyLabel("hydroAssumption"),
      ],
    ];
  }

  function copyLabel(key) {
    return activeCopy()[key] || copy.en[key] || key;
  }

  function formatValueWithUnit(value, fractionDigits, unitKey) {
    return `${formatNumber(value, fractionDigits)} ${copyLabel(unitKey)}`;
  }

  function runtimeLabel(hoursPerWeek) {
    const value = formatValueWithUnit(hoursPerWeek, 0, "unitHoursPerWeek");
    return hoursPerWeek === 168 ? `24/7 - ${value}` : value;
  }

  function calculationBasisText(scenario) {
    return formatTemplate(activeCopy().calculationBasisTemplate, {
      watts: formatNumber(state.wattsPerAiWorker, 0),
      hoursPerWeek: formatNumber(state.runtimeHoursPerWeek, 0),
      weeksPerYear: formatNumber(calculator.WEEKS_PER_YEAR, 4),
      overhead: formatNumber(state.overheadFactor, 2),
      mwhYear: formatNumber(scenario.worker.mwhYear, 4),
    });
  }

  function allocationSentenceTemplate() {
    return activeCopy().allocationSentenceTemplate || copy.en.allocationSentenceTemplate;
  }

  function comparisonSentenceTemplate() {
    return activeCopy().comparisonSentenceTemplate || copy.en.comparisonSentenceTemplate;
  }

  function allocationLabelTemplate() {
    return activeCopy().allocationLabelTemplate || copy.en.allocationLabelTemplate;
  }

  function requiredEnergySentenceTemplate() {
    return activeCopy().requiredEnergySentenceTemplate || copy.en.requiredEnergySentenceTemplate;
  }

  function requiredEnergyLabelTemplate() {
    return activeCopy().requiredEnergyLabelTemplate || copy.en.requiredEnergyLabelTemplate;
  }

  function denominatorText(text = activeCopy()) {
    const group = activeJurisdictionGroup();
    const copyKey = group?.denominator_copy_key;
    return (copyKey && (text[copyKey] || copy.en[copyKey])) || text.denominatorSelected || copy.en.denominatorSelected;
  }

  function scenarioCoreSentence(scenario, profileCount = scenarioProfileCount(scenario)) {
    if (isBeyondTotalElectricity(state.electricityAllocationShare)) {
      return formatTemplate(requiredEnergySentenceTemplate(), {
        energyMultiple: formatEnergyMultipleValue(state.electricityAllocationShare),
        countryName: countrySentenceName(state.selectedCountry),
        twh: formatNumber(scenario.allocatedElectricityTwhYear, 3),
        profiles: formatInteger(profileCount),
        denominator: denominatorText(),
      });
    }
    return formatTemplate(allocationSentenceTemplate(), {
      share: formatPercent(state.electricityAllocationShare),
      countryName: countrySentenceName(state.selectedCountry),
      profiles: formatInteger(profileCount),
      denominator: denominatorText(),
    });
  }

  function targetComparisonSentence(scenario) {
    if (isBeyondTotalElectricity(scenario.shareOfNationalElectricityNeeded)) {
      return formatTemplate(requiredEnergySentenceTemplate(), {
        energyMultiple: formatEnergyMultipleValue(scenario.shareOfNationalElectricityNeeded),
        countryName: countrySentenceName(state.selectedCountry),
        twh: formatNumber(scenario.targetEnergyTwhYear, 3),
        profiles: formatInteger(state.targetAiWorkers),
        denominator: denominatorText(),
      });
    }
    return formatTemplate(comparisonSentenceTemplate(), {
      profiles: formatInteger(state.targetAiWorkers),
      twh: formatNumber(scenario.targetEnergyTwhYear, 3),
      share: formatPercent(scenario.shareOfNationalElectricityNeeded),
      countryName: countrySentenceName(state.selectedCountry),
      denominator: denominatorText(),
    });
  }

  function formatTemplate(template, values) {
    return String(template || "").replace(/\{([a-zA-Z0-9_]+)\}/g, (match, key) => {
      return Object.prototype.hasOwnProperty.call(values, key) ? values[key] : match;
    });
  }

  function syncStageHeight() {
    if (!serverStage) return;
    const activePanel = document.querySelector(".page.is-active .machine-panel");
    const panelHeight = activePanel ? activePanel.scrollHeight : 620;
    serverStage.style.setProperty("--stage-height", `${Math.max(704, panelHeight + 28)}px`);
  }

  function readout(label, value, className = "") {
    return `<div class="readout-item ${escapeAttribute(className)}"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`;
  }

  function metric(label, value, status, className = "") {
    return `<div class="metric ${escapeAttribute(className)}">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
      <small>${escapeHtml(status)}</small>
    </div>`;
  }

  function setActiveButton(container, id) {
    container.querySelectorAll(".option-button").forEach((button) => {
      button.classList.toggle("is-active", button.getAttribute("data-profile-id") === id);
    });
    syncInstrumentLabels();
  }

  function syncInstrumentLabels() {
    const text = activeCopy();
    Object.entries(profileControls).forEach(([controlName, config]) => {
      const card = document.querySelector(`[data-cycle-control="${controlName}"]`);
      const profile = config.profiles.find((item) => item.id === state[config.stateId]);
      const activeLabel = profile ? compactInstrumentLabel(controlName, profile) : "CUSTOM";
      const activeDescription = profile ? localizeProfile(profile).description : text.manualSetting;
      card.dataset.activeLabel = activeLabel;
      card.dataset.activeDescription = activeDescription;
      config.container.dataset.activeDescription = activeDescription;
      card.setAttribute(
        "aria-label",
        `${card.querySelector("h3")?.textContent || controlName}: ${activeLabel}. ${activeDescription}. ${text.clickToCycle}.`
      );
    });
  }

  function compactInstrumentLabel(controlName, profile) {
    if (controlName === "runtime") {
      if (profile.id === "human_week_37h") return "37h";
      if (profile.id === "standard_40h") return "40h";
      if (profile.id === "always_on_24_7") return "24/7";
    }
    if (controlName === "overhead") {
      if (profile.id === "raw_compute") return "RAW";
      return profile.label.toUpperCase();
    }
    return profile.label;
  }

  function selectProfile(controlName, profileId) {
    const config = profileControls[controlName];
    const profile = config?.profiles.find((item) => item.id === profileId);
    if (!config || !profile) return;
    state[config.stateId] = profile.id;
    state[config.stateValue] = Number(profile[config.valueKey]);
    config.input.value = String(state[config.stateValue]);
    setActiveButton(config.container, state[config.stateId]);
    updateOutputs();
  }

  function cycleProfile(controlName) {
    const config = profileControls[controlName];
    if (!config) return;
    const currentIndex = config.profiles.findIndex((item) => item.id === state[config.stateId]);
    const nextProfile = config.profiles[(currentIndex + 1 + config.profiles.length) % config.profiles.length];
    selectProfile(controlName, nextProfile.id);
  }

  function setGuideOpen(isOpen) {
    if (!guideOverlay) return;
    guideOverlay.hidden = !isOpen;
    document.body.classList.toggle("guide-is-open", isOpen);
    if (isOpen) {
      guidePanel?.focus();
      return;
    }
    lastGuideTrigger?.focus();
  }

  countryRack.addEventListener("click", (event) => {
    const button = event.target.closest("[data-country-code]");
    if (!button || button.disabled) return;
    selectCountry(button.getAttribute("data-country-code"));
  });

  countrySelect.addEventListener("change", () => selectCountry(countrySelect.value));

  jurisdictionModeSwitch?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-jurisdiction-group]");
    if (!button) return;
    selectJurisdictionGroup(button.getAttribute("data-jurisdiction-group"));
  });

  powerOptions.addEventListener("click", (event) => {
    const button = event.target.closest("[data-profile-id]");
    if (!button) return;
    selectProfile("power", button.getAttribute("data-profile-id"));
  });

  runtimeOptions.addEventListener("click", (event) => {
    const button = event.target.closest("[data-profile-id]");
    if (!button) return;
    selectProfile("runtime", button.getAttribute("data-profile-id"));
  });

  overheadOptions.addEventListener("click", (event) => {
    const button = event.target.closest("[data-profile-id]");
    if (!button) return;
    selectProfile("overhead", button.getAttribute("data-profile-id"));
  });

  document.querySelectorAll("[data-cycle-control]").forEach((card) => {
    card.addEventListener("click", (event) => {
      if (event.target.closest(".option-button, input, label, button")) return;
      cycleProfile(card.getAttribute("data-cycle-control"));
    });
    card.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      cycleProfile(card.getAttribute("data-cycle-control"));
    });
  });

  workerScaleOptions.addEventListener("click", (event) => {
    const button = event.target.closest("[data-profile-id]");
    if (!button) return;
    state.budgetDriver = "allocation";
    state.allocationProfileId = button.getAttribute("data-profile-id");
    state.electricityAllocationShare = Number(button.getAttribute("data-profile-value"));
    state.targetAiWorkers = supportedAtShare(state.electricityAllocationShare);
    updateOutputs();
  });

  targetProfileOptions?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-target-workers]");
    if (!button || button.disabled) return;
    state.budgetDriver = "profiles";
    state.targetAiWorkers = clampNumber(Number(button.getAttribute("data-target-workers")), 0, 10000000000, 1000000);
    state.electricityAllocationShare = targetShareForProfiles(state.targetAiWorkers);
    updateOutputs();
  });

  customWatts.addEventListener("input", () => {
    state.powerProfileId = "custom";
    state.wattsPerAiWorker = clampNumber(Number(customWatts.value), 1, 50000, 700);
    setActiveButton(powerOptions, "custom");
    updateOutputs();
  });

  customRuntime.addEventListener("input", () => {
    state.runtimeProfileId = "custom";
    state.runtimeHoursPerWeek = clampNumber(Number(customRuntime.value), 1, 168, 168);
    setActiveButton(runtimeOptions, "custom");
    updateOutputs();
  });

  customOverhead.addEventListener("input", () => {
    state.overheadProfileId = "custom";
    state.overheadFactor = clampNumber(Number(customOverhead.value), 0.1, 10, 1);
    setActiveButton(overheadOptions, "custom");
    updateOutputs();
  });

  workerScaleSlider.addEventListener("input", () => {
    state.budgetDriver = "allocation";
    state.allocationProfileId = "custom";
    state.electricityAllocationShare = sliderValueToShare(Number(workerScaleSlider.value));
    state.targetAiWorkers = supportedAtShare(state.electricityAllocationShare);
    updateOutputs();
  });

  targetWorkers.addEventListener("input", () => {
    state.budgetDriver = "profiles";
    state.targetAiWorkers = clampNumber(Number(targetWorkers.value), 0, 10000000000, 1000000);
    state.electricityAllocationShare = targetShareForProfiles(state.targetAiWorkers);
    updateOutputs();
  });

  targetWorkersSlider?.addEventListener("input", () => {
    state.budgetDriver = "profiles";
    state.targetAiWorkers = sliderValueToProfiles(Number(targetWorkersSlider.value));
    state.electricityAllocationShare = targetShareForProfiles(state.targetAiWorkers);
    updateOutputs();
  });

  document.addEventListener("click", (event) => {
    const action = event.target.closest("[data-action]")?.getAttribute("data-action");
    if (!action) return;
    if (action === "back-country") goToPage("country-select");
    if (action === "to-allocation") goToPage("allocation");
    if (action === "back-worker") goToPage("worker-profile");
    if (action === "to-report") goToPage("report");
    if (action === "back-allocation") goToPage("allocation");
    if (action === "open-guide") {
      lastGuideTrigger = event.target.closest('[data-action="open-guide"]') || lastGuideTrigger;
      setGuideOpen(true);
    }
    if (action === "close-guide") setGuideOpen(false);
    if (action === "download-report") {
      event.preventDefault();
      void downloadScenarioReportPdf(event.target.closest('[data-action="download-report"]'));
    }
    if (action === "restart") {
      state.selectedCountry = null;
      countrySelect.value = "";
      countryRack.querySelectorAll(".rack-slot").forEach((slot) => slot.classList.remove("is-selected"));
      goToPage("country-select");
    }
  });

  languageToggle?.addEventListener("click", () => {
    state.languageMode = state.languageMode === "local" ? "en" : "local";
    renderCountrySelectors();
    renderAllControls();
    if (state.selectedCountry) {
      countrySelect.value = state.selectedCountry.code;
      syncSelectedCountryButton(state.selectedCountry.code);
    }
    updateLanguageControl();
    applyStaticCopy();
    updateOutputs();
  });

  document.addEventListener("click", (event) => {
    const target = event.target.closest("[data-step-target]");
    if (!target || target.disabled) return;
    goToPage(target.getAttribute("data-step-target"));
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && guideOverlay && !guideOverlay.hidden) {
      setGuideOpen(false);
    }
  });

  function clampNumber(value, min, max, fallback) {
    if (!Number.isFinite(value)) return fallback;
    return Math.min(max, Math.max(min, value));
  }

  function formatInteger(value) {
    return new Intl.NumberFormat(activeLocale(), { maximumFractionDigits: 0 }).format(value);
  }

  function formatNumber(value, digits) {
    return new Intl.NumberFormat(activeLocale(), {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }).format(value);
  }

  function formatPercent(value) {
    return displayFormat.formatPercent(value, activeLocale());
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function escapeAttribute(value) {
    return escapeHtml(value).replace(/`/g, "&#96;");
  }

  function applyInitialUrlState() {
    const params = new URLSearchParams(window.location.search);
    const countryCode = params.get("country");
    const groupId = params.get("mode");
    const page = params.get("page");
    const lang = params.get("lang");

    if (lang === "local") {
      state.languageMode = "local";
    }

    if (groupId && jurisdictionGroupById.has(groupId)) {
      state.jurisdictionGroupId = groupId;
      state.dataMode = activeJurisdictionGroup()?.data_mode || data.dataMode;
    }

    if (countryCode && activeCountryByCode().has(countryCode)) {
      state.selectedCountry = activeCountryByCode().get(countryCode);
    }
    renderCountrySelectors();
    renderAllControls();
    if (state.selectedCountry) {
      countrySelect.value = state.selectedCountry.code;
      syncSelectedCountryButton(state.selectedCountry.code);
    }
    updateLanguageControl();
    applyStaticCopy();

    if (page && canOpenPage(page)) {
      goToPage(page);
      return true;
    }

    return false;
  }

  renderCountrySelectors();
  renderAllControls();
  updateLanguageControl();
  applyStaticCopy();
  if (!applyInitialUrlState()) {
    app.dataset.scene = state.page;
    updateOutputs();
  }
})();
