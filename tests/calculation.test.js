const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const {
  KWH_PER_TWH,
  ELECTRICITY_SHARE_MODES,
  calculateWorkerEnergy,
  calculateCountryBudget,
  calculateShareForTargetProfiles,
  classifyElectricityShare,
} = require("../calculate.js");

function closeTo(actual, expected, tolerance = 0.000001) {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} not close to ${expected}`);
}

const worker = calculateWorkerEnergy({
  wattsPerAiWorker: 700,
  runtimeHoursPerWeek: 168,
  overheadFactor: 1,
});

closeTo(worker.kwhDayAverage, 16.8);
closeTo(worker.kwhYear, 6132);
closeTo(worker.mwhYear, 6.132);

const denmark = calculateCountryBudget({
  annualElectricityTwh: 35,
  electricityAllocationShare: 0.1,
  wattsPerAiWorker: 700,
  runtimeHoursPerWeek: 168,
  overheadFactor: 1,
  targetAiWorkers: 1000000,
});

assert.equal(denmark.allocatedElectricityTwhYear, 3.5);
assert.equal(denmark.supportedAiWorkers, 570776);
closeTo(denmark.targetEnergyTwhYear, 6.132);
closeTo(denmark.shareOfNationalElectricityNeeded, 0.1752);
closeTo(denmark.averageLoadGw, 0.7);
closeTo(denmark.activeLoadGw, 0.7);

const zeroAllocation = calculateCountryBudget({
  annualElectricityTwh: 35,
  electricityAllocationShare: 0,
  wattsPerAiWorker: 700,
  runtimeHoursPerWeek: 168,
  overheadFactor: 1,
  targetAiWorkers: 0,
});

assert.equal(zeroAllocation.allocatedElectricityTwhYear, 0);
assert.equal(zeroAllocation.supportedAiWorkers, 0);
assert.equal(zeroAllocation.targetEnergyTwhYear, 0);
assert.equal(zeroAllocation.shareOfNationalElectricityNeeded, 0);

const stress = calculateCountryBudget({
  annualElectricityTwh: 35,
  electricityAllocationShare: 3,
  wattsPerAiWorker: 700,
  runtimeHoursPerWeek: 168,
  overheadFactor: 1,
  targetAiWorkers: 1000000,
});

assert.equal(stress.allocatedElectricityTwhYear, 105);
assert.equal(stress.supportedAiWorkers, 17123287);

for (const share of [0, 0.01, 1]) {
  assert.equal(classifyElectricityShare(share), ELECTRICITY_SHARE_MODES.ALLOCATION);
}
for (const share of [1 + Number.EPSILON, 1.93738, 3]) {
  assert.equal(classifyElectricityShare(share), ELECTRICITY_SHARE_MODES.REQUIRED_ENERGY_MULTIPLE);
}

function readDataJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(__dirname, "..", "data", relativePath), "utf8"));
}

const workerProfiles = readDataJson("worker-profiles.json");
const candidateRecords = [
  ...readDataJson("source-candidates/eu27-electricity-use.candidate.json").records,
  ...readDataJson("source-candidates/us-national-electricity-use.candidate.json").records,
  ...readDataJson("source-candidates/us-states-electricity-use.candidate.json").records,
  ...readDataJson("source-candidates/world-electricity-use.candidate.json").records,
];
const targetPresets = [100000, 1000000, 10000000, 50000000, 250000000];
let roundtripCases = 0;

for (const country of candidateRecords) {
  for (const power of workerProfiles.powerProfiles) {
    for (const runtime of workerProfiles.runtimeProfiles) {
      for (const overhead of workerProfiles.overheadProfiles) {
        for (const targetAiWorkers of targetPresets) {
          const electricityAllocationShare = calculateShareForTargetProfiles({
            annualElectricityTwh: country.annual_electricity_twh,
            targetAiWorkers,
            wattsPerAiWorker: power.watts,
            runtimeHoursPerWeek: runtime.hours_per_week,
            overheadFactor: overhead.factor,
          });
          const scenario = calculateCountryBudget({
            annualElectricityTwh: country.annual_electricity_twh,
            electricityAllocationShare,
            wattsPerAiWorker: power.watts,
            runtimeHoursPerWeek: runtime.hours_per_week,
            overheadFactor: overhead.factor,
            targetAiWorkers,
          });

          assert.equal(
            scenario.supportedAiWorkers,
            targetAiWorkers,
            `${country.code}/${power.id}/${runtime.id}/${overhead.id}/${targetAiWorkers} target roundtrip drifted`
          );
          roundtripCases += 1;
        }
      }
    }
  }
}

assert.equal(roundtripCases, 7200, "target roundtrip matrix must cover all built-in combinations");

const conservativeWorker = calculateWorkerEnergy({
  wattsPerAiWorker: 700,
  runtimeHoursPerWeek: 168,
  overheadFactor: 1,
});
const conservativeTarget = 1000000;
const exactConservativeShare =
  conservativeTarget * conservativeWorker.kwhYear / (35 * KWH_PER_TWH);
const justBelowTarget = calculateCountryBudget({
  annualElectricityTwh: 35,
  electricityAllocationShare: exactConservativeShare * (1 - 1e-10),
  wattsPerAiWorker: 700,
  runtimeHoursPerWeek: 168,
  overheadFactor: 1,
  targetAiWorkers: conservativeTarget,
});
assert.equal(
  justBelowTarget.supportedAiWorkers,
  conservativeTarget - 1,
  "roundtrip compensation must not round a genuinely insufficient allocation up"
);

console.log("AI Labour Power Budget calculation tests passed");
