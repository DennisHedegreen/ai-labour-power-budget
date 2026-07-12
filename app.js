(async function initAiLabourPowerBudget() {
  "use strict";

  const calculator = window.AILabourPowerBudgetCalculator;
  const dataLoader = window.AILabourPowerBudgetDataLoader;
  let data;

  try {
    data = await dataLoader.loadPrototypeData();
  } catch (error) {
    document.body.innerHTML = `<main class="tool-shell"><section class="source-box" style="margin-top: 10vh;"><p class="panel-label">Data load failed</p><p>${escapeHtml(error.message)}</p><p>Run this prototype through a local HTTP server so the JSON files can load.</p></section></main>`;
    throw error;
  }

  const state = {
    page: "country-select",
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
    languageMode: "en",
  };

  const app = document.querySelector("#app");
  const serverStage = document.querySelector(".server-stage");
  const pages = Array.from(document.querySelectorAll("[data-page]"));
  const stepButtons = Array.from(document.querySelectorAll("[data-step-target]"));
  const countryRack = document.querySelector("#country-rack");
  const countrySelect = document.querySelector("#country-select");
  const powerOptions = document.querySelector("#power-options");
  const runtimeOptions = document.querySelector("#runtime-options");
  const overheadOptions = document.querySelector("#overhead-options");
  const workerScaleOptions = document.querySelector("#worker-scale-options");
  const workerScaleSlider = document.querySelector("#worker-scale-slider");
  const customWatts = document.querySelector("#custom-watts");
  const customRuntime = document.querySelector("#custom-runtime");
  const customOverhead = document.querySelector("#custom-overhead");
  const targetWorkers = document.querySelector("#target-workers");
  const workerReadout = document.querySelector("#worker-readout");
  const budgetPreview = document.querySelector("#budget-preview");
  const previewCountry = document.querySelector("#preview-country");
  const sharePreview = document.querySelector("#share-preview");
  const targetPreview = document.querySelector("#target-preview");
  const pressureFill = document.querySelector("#pressure-fill");
  const reportGrid = document.querySelector("#report-grid");
  const reportCoreSentence = document.querySelector("#report-core-sentence");
  const languageToggle = document.querySelector("#language-toggle");
  const languageState = document.querySelector("#language-state");

  const copy = data.copy;
  const copyLanguageByCode = new Map((data.copyLanguages || []).map((language) => [language.code, language]));

  const countryByCode = new Map(data.countries.map((country) => [country.code, country]));
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

  function renderCountrySelectors() {
    const text = activeCopy();
    const rackSlots = [...data.eu27Shell];
    while (rackSlots.length < 30) {
      rackSlots.push(["", "Empty bay"]);
    }

    countryRack.innerHTML = rackSlots
      .map(([code, name]) => {
        if (!code) {
          return `<span class="rack-slot is-empty" aria-hidden="true"></span>`;
        }
        const hasData = countryByCode.has(code);
        const classes = ["rack-slot", hasData ? "has-data" : ""].filter(Boolean).join(" ");
        const disabled = hasData ? "" : "disabled";
        return `<button type="button" class="${classes}" data-country-code="${escapeHtml(code)}" ${disabled} aria-label="${escapeAttribute(name)}">
          <span>${escapeHtml(code)}</span>
          <small aria-hidden="true"></small>
        </button>`;
      })
      .join("");

    countrySelect.innerHTML = [
      `<option value="">${escapeHtml(text.selectCountry)}</option>`,
      ...data.eu27Shell.map(([code, name]) => {
        const hasData = countryByCode.has(code);
        const suffix = hasData ? ` - ${text.demoValue}` : ` - ${text.sourcePassNeeded}`;
        return `<option value="${escapeAttribute(code)}" ${hasData ? "" : "disabled"}>${escapeHtml(countryShellName(code, name) + suffix)}</option>`;
      }),
    ].join("");
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

  function countryShellName(code, fallbackName) {
    const country = countryByCode.get(code);
    if (state.languageMode === "local" && country?.local_name) return country.local_name;
    return fallbackName;
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
    document.querySelectorAll(".status-stack span").forEach((chip, index) => {
      chip.textContent = text.statusChips[index] || chip.textContent;
    });
    stepButtons.forEach((button, index) => {
      button.textContent = text.steps[index] || button.textContent;
    });

    const workerPanel = document.querySelector(".page-worker");
    const allocationPanel = document.querySelector(".page-allocation");
    const reportPanel = document.querySelector(".page-report");
    const sourceBox = document.querySelector(".source-box");

    setText("#worker-heading", text.defineWorker);
    setText(".page-worker .panel-label", text.workerProfile);
    setText(".page-worker .panel-head p:not(.panel-label)", text.workerIntro);
    setText('[data-action="back-country"]', text.back);
    setText('[data-action="back-worker"]', text.back);
    setText('[data-action="back-allocation"]', text.back);
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
    setText(".page-allocation .panel-head p:not(.panel-label)", text.allocationIntro);
    setText(".page-allocation .control-card h3", text.electricityShare);
    if (allocationPanel) {
      const allocationLabels = allocationPanel.querySelectorAll(".custom-field span");
      if (allocationLabels[0]) allocationLabels[0].textContent = text.nationalAllocation;
      if (allocationLabels[1]) allocationLabels[1].textContent = text.compareTargetProfiles;
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
      if (paragraph) paragraph.textContent = text.truthBoundaryText;
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
    syncInstrumentLabels();
  }

  function selectCountry(code) {
    const country = countryByCode.get(code);
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
      readout("kWh/day", formatNumber(worker.kwhDayAverage, 2)),
      readout("kWh/year", formatNumber(worker.kwhYear, 0)),
      readout("MWh/year", formatNumber(worker.mwhYear, 3)),
    ].join("");

    const scenario = readScenario();
    if (!scenario) {
      budgetPreview.innerHTML = "";
      reportGrid.innerHTML = "";
      return;
    }

    previewCountry.textContent = `${countryDisplayName(state.selectedCountry)} · ${state.selectedCountry.source_status}`;
    sharePreview.textContent = formatTemplate(text.allocationSentenceTemplate, {
      share: formatPercent(state.electricityAllocationShare),
      countryName: countryDisplayName(state.selectedCountry),
      profiles: formatInteger(scenario.supportedAiWorkers),
    });
    pressureFill.style.width = `${Math.min(100, state.electricityAllocationShare * 100)}%`;
    pressureFill.dataset.pressure = pressureBand(state.electricityAllocationShare);
    budgetPreview.innerHTML = [
      readout(text.selectedAllocation, formatTemplate(text.allocationLabelTemplate, { share: formatPercent(state.electricityAllocationShare) })),
      readout(text.equivalentProfiles, `${formatInteger(scenario.supportedAiWorkers)} ${text.profiles}`),
      readout(text.allocatedElectricity, `${formatNumber(scenario.allocatedElectricityTwhYear, 3)} TWh/year`),
      readout(text.averageAllocatedLoad, `${formatNumber(allocatedAverageLoadGw(scenario), 3)} GW`),
      readout(text.annualElectricity, `${formatNumber(state.selectedCountry.annual_electricity_twh, 1)} TWh/year`),
    ].join("");
    targetPreview.textContent = formatTemplate(text.comparisonSentenceTemplate, {
      profiles: formatInteger(state.targetAiWorkers),
      twh: formatNumber(scenario.targetEnergyTwhYear, 3),
      share: formatPercent(scenario.shareOfNationalElectricityNeeded),
    });

    reportCoreSentence.textContent = formatTemplate(text.allocationSentenceTemplate, {
      share: formatPercent(state.electricityAllocationShare),
      countryName: countryDisplayName(state.selectedCountry),
      profiles: formatInteger(scenario.supportedAiWorkers),
    });
    reportGrid.innerHTML = renderReport(scenario);
    syncStageHeight();
  }

  function renderReport(scenario) {
    const text = activeCopy();
    const source = state.selectedCountry.source_status;
    return [
      metric(text.equivalentProfiles, formatInteger(scenario.supportedAiWorkers), text.energyBoundary, "is-primary"),
      metric(text.electricityAllocation, formatPercent(state.electricityAllocationShare), text.ofNationalAnnualElectricity, "is-primary"),
      metric(text.allocatedElectricity, `${formatNumber(scenario.allocatedElectricityTwhYear, 3)} TWh/year`, text.scenarioOutput),
      metric(text.country, countryDisplayName(state.selectedCountry), source),
      metric(text.wattProfile, `${formatNumber(state.wattsPerAiWorker, 0)} W`, text.scenarioSetting),
      metric(text.runtime, runtimeLabel(state.runtimeHoursPerWeek), text.scenarioSetting),
      metric(text.overhead, `${formatNumber(state.overheadFactor, 2)}x`, text.scenarioSetting),
      metric(text.oneAiWorker, `${formatNumber(scenario.worker.kwhDayAverage, 2)} kWh/day`, text.underSelectedWattProfile),
      metric(text.oneProfileYearly, `${formatNumber(scenario.worker.mwhYear, 4)} MWh/year`, text.calculationBasisPrecise),
      metric(text.calculationBasis, calculationBasisText(scenario), text.calculationBasisStatus, "is-calculation"),
      metric(text.averageAllocatedLoad, `${formatNumber(allocatedAverageLoadGw(scenario), 3)} GW`, text.annualEnergySpread),
      metric(text.targetComparison, `${formatInteger(state.targetAiWorkers)} ${text.profiles}`, formatTemplate(text.allocationLabelTemplate, { share: formatPercent(scenario.shareOfNationalElectricityNeeded) })),
      ...renderComparisons(scenario),
      metric(formatTemplate(text.shareCapacityLabelTemplate, { share: "1%" }), `${formatInteger(supportedAtShare(0.01))} ${text.profiles}`, source),
      metric(formatTemplate(text.shareCapacityLabelTemplate, { share: "10%" }), `${formatInteger(supportedAtShare(0.1))} ${text.profiles}`, source),
      metric(formatTemplate(text.shareCapacityLabelTemplate, { share: "100%" }), `${formatInteger(supportedAtShare(1))} ${text.profiles}`, text.thoughtExperiment),
      metric(text.dataStatus, source, text.notVerified),
    ].join("");
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

  function pressureBand(share) {
    if (share < 0.25) return "low";
    if (share < 0.75) return "medium";
    return "high";
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

    return [
      metric(text.wind3, formatInteger(fullOutputWindTurbines), text.fullOutputAssumption, "is-comparison"),
      metric(text.wind8, formatInteger(offshoreAverageWindTurbines), text.offshoreAssumption, "is-comparison"),
      metric(text.households, formatInteger(householdYears), text.householdAssumption, "is-comparison"),
    ];
  }

  function runtimeLabel(hoursPerWeek) {
    if (hoursPerWeek === 168) return "24/7 - 168 h/week";
    return `${formatNumber(hoursPerWeek, 0)} h/week`;
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

  function readout(label, value) {
    return `<div class="readout-item"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`;
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
      card.setAttribute("aria-label", `${card.querySelector("h3")?.textContent || controlName}: ${activeLabel}. ${text.clickToCycle}.`);
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

  countryRack.addEventListener("click", (event) => {
    const button = event.target.closest("[data-country-code]");
    if (!button || button.disabled) return;
    selectCountry(button.getAttribute("data-country-code"));
  });

  countrySelect.addEventListener("change", () => selectCountry(countrySelect.value));

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
    state.allocationProfileId = button.getAttribute("data-profile-id");
    state.electricityAllocationShare = Number(button.getAttribute("data-profile-value"));
    workerScaleSlider.value = String(Math.round(state.electricityAllocationShare * 100));
    setActiveButton(workerScaleOptions, state.allocationProfileId);
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
    state.allocationProfileId = "custom";
    state.electricityAllocationShare = clampNumber(Number(workerScaleSlider.value), 1, 100, 10) / 100;
    setActiveButton(workerScaleOptions, "custom");
    updateOutputs();
  });

  targetWorkers.addEventListener("input", () => {
    state.targetAiWorkers = clampNumber(Number(targetWorkers.value), 0, 10000000000, 1000000);
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
    return new Intl.NumberFormat(activeLocale(), {
      style: "percent",
      minimumFractionDigits: value < 0.01 ? 1 : 0,
      maximumFractionDigits: 1,
    }).format(value);
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
    const page = params.get("page");
    const lang = params.get("lang");

    if (lang === "local") {
      state.languageMode = "local";
    }

    if (countryCode && countryByCode.has(countryCode)) {
      state.selectedCountry = countryByCode.get(countryCode);
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
