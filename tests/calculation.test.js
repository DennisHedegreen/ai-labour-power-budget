const assert = require("node:assert/strict");
const {
  calculateWorkerEnergy,
  calculateCountryBudget,
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

console.log("AI Labour Power Budget calculation tests passed");
