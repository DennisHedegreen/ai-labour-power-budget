(function attachCalculator(globalScope) {
  "use strict";

  const KWH_PER_TWH = 1000000000;
  const DAYS_PER_YEAR = 365;
  const WEEKS_PER_YEAR = DAYS_PER_YEAR / 7;
  const HOURS_PER_YEAR = 8760;
  const WATTS_PER_KW = 1000;
  const WATTS_PER_GW = 1000000000;

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

  const api = {
    KWH_PER_TWH,
    DAYS_PER_YEAR,
    WEEKS_PER_YEAR,
    HOURS_PER_YEAR,
    WATTS_PER_KW,
    WATTS_PER_GW,
    calculateWorkerEnergy,
    calculateCountryBudget,
  };

  globalScope.AILabourPowerBudgetCalculator = api;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(typeof window !== "undefined" ? window : globalThis);
