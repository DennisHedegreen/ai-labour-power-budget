(function attachCalculator(globalScope) {
  "use strict";

  const KWH_PER_TWH = 1000000000;
  const DAYS_PER_YEAR = 365;
  const WEEKS_PER_YEAR = DAYS_PER_YEAR / 7;
  const HOURS_PER_YEAR = 8760;
  const WATTS_PER_KW = 1000;
  const WATTS_PER_GW = 1000000000;
  const ELECTRICITY_SHARE_MODES = Object.freeze({
    ALLOCATION: "allocation",
    REQUIRED_ENERGY_MULTIPLE: "required_energy_multiple",
  });

  function assertPositiveNumber(value, name) {
    if (!Number.isFinite(value) || value <= 0) {
      throw new Error(`${name} must be a positive number`);
    }
  }

  function assertNonNegativeNumber(value, name) {
    if (!Number.isFinite(value) || value < 0) {
      throw new Error(`${name} must be a non-negative number`);
    }
  }

  function calculateWorkerEnergy({ wattsPerAiWorker, runtimeHoursPerWeek, overheadFactor = 1 }) {
    assertPositiveNumber(wattsPerAiWorker, "wattsPerAiWorker");
    assertPositiveNumber(runtimeHoursPerWeek, "runtimeHoursPerWeek");
    assertPositiveNumber(overheadFactor, "overheadFactor");

    if (runtimeHoursPerWeek > 168) {
      throw new Error("runtimeHoursPerWeek must be <= 168");
    }

    const runtimeHoursPerYear = runtimeHoursPerWeek * WEEKS_PER_YEAR;
    const kwhYear = (wattsPerAiWorker / WATTS_PER_KW) * runtimeHoursPerYear * overheadFactor;

    return {
      runtimeHoursPerYear,
      kwhDayAverage: kwhYear / DAYS_PER_YEAR,
      kwhYear,
      mwhYear: kwhYear / 1000,
    };
  }

  function calculateCountryBudget({
    annualElectricityTwh,
    electricityAllocationShare,
    wattsPerAiWorker,
    runtimeHoursPerWeek,
    overheadFactor = 1,
    targetAiWorkers = 1000000,
  }) {
    assertPositiveNumber(annualElectricityTwh, "annualElectricityTwh");
    assertNonNegativeNumber(electricityAllocationShare, "electricityAllocationShare");
    assertPositiveNumber(wattsPerAiWorker, "wattsPerAiWorker");
    assertPositiveNumber(runtimeHoursPerWeek, "runtimeHoursPerWeek");
    assertPositiveNumber(overheadFactor, "overheadFactor");

    if (!Number.isFinite(targetAiWorkers) || targetAiWorkers < 0) {
      throw new Error("targetAiWorkers must be >= 0");
    }

    const worker = calculateWorkerEnergy({
      wattsPerAiWorker,
      runtimeHoursPerWeek,
      overheadFactor,
    });
    const countryElectricityKwhYear = annualElectricityTwh * KWH_PER_TWH;
    const allocatedElectricityKwhYear = countryElectricityKwhYear * electricityAllocationShare;
    const allocatedElectricityTwhYear = annualElectricityTwh * electricityAllocationShare;
    const supportedAiWorkers = Math.floor(allocatedElectricityKwhYear / worker.kwhYear);
    const targetEnergyKwhYear = targetAiWorkers * worker.kwhYear;
    const targetEnergyTwhYear = targetEnergyKwhYear / KWH_PER_TWH;
    const shareOfNationalElectricityNeeded = targetEnergyTwhYear / annualElectricityTwh;
    const averageLoadGw = (targetEnergyKwhYear / HOURS_PER_YEAR) * WATTS_PER_KW / WATTS_PER_GW;
    const activeLoadGw = targetAiWorkers * wattsPerAiWorker * overheadFactor / WATTS_PER_GW;

    return {
      worker,
      allocatedElectricityTwhYear,
      allocatedElectricityKwhYear,
      supportedAiWorkers,
      targetEnergyTwhYear,
      shareOfNationalElectricityNeeded,
      averageLoadGw,
      activeLoadGw,
    };
  }

  function calculateShareForTargetProfiles({
    annualElectricityTwh,
    targetAiWorkers,
    wattsPerAiWorker,
    runtimeHoursPerWeek,
    overheadFactor = 1,
  }) {
    assertPositiveNumber(annualElectricityTwh, "annualElectricityTwh");
    assertNonNegativeNumber(targetAiWorkers, "targetAiWorkers");
    const worker = calculateWorkerEnergy({
      wattsPerAiWorker,
      runtimeHoursPerWeek,
      overheadFactor,
    });
    const exactShare = targetAiWorkers * worker.kwhYear / (annualElectricityTwh * KWH_PER_TWH);

    if (exactShare === 0) return 0;
    return exactShare * (1 + Number.EPSILON * 4);
  }

  function classifyElectricityShare(electricityAllocationShare) {
    assertNonNegativeNumber(electricityAllocationShare, "electricityAllocationShare");
    return electricityAllocationShare > 1
      ? ELECTRICITY_SHARE_MODES.REQUIRED_ENERGY_MULTIPLE
      : ELECTRICITY_SHARE_MODES.ALLOCATION;
  }

  function calculateProfileComparisonGauge({
    calculatedProfiles,
    targetProfiles,
    ceilingRatio = 3,
  }) {
    assertNonNegativeNumber(calculatedProfiles, "calculatedProfiles");
    assertPositiveNumber(ceilingRatio, "ceilingRatio");

    if (!Number.isFinite(targetProfiles) || targetProfiles < 0) {
      throw new Error("targetProfiles must be >= 0");
    }

    if (targetProfiles === 0) {
      return {
        ratio: null,
        percent: null,
        clampedPercent: 0,
      };
    }

    const ratio = calculatedProfiles / targetProfiles;
    const percent = ratio * 100;
    return {
      ratio,
      percent,
      clampedPercent: Math.min(ceilingRatio * 100, percent),
    };
  }

  const api = {
    KWH_PER_TWH,
    DAYS_PER_YEAR,
    WEEKS_PER_YEAR,
    HOURS_PER_YEAR,
    WATTS_PER_KW,
    WATTS_PER_GW,
    ELECTRICITY_SHARE_MODES,
    calculateWorkerEnergy,
    calculateCountryBudget,
    calculateShareForTargetProfiles,
    classifyElectricityShare,
    calculateProfileComparisonGauge,
  };

  globalScope.AILabourPowerBudgetCalculator = api;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(typeof window !== "undefined" ? window : globalThis);
