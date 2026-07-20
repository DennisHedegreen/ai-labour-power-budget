const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const dataRoot = path.join(root, "data");
const candidateRoot = path.join(dataRoot, "source-candidates");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function readDataJson(relativePath) {
  return readJson(path.join(dataRoot, relativePath));
}

function readCandidate(fileName) {
  return readJson(path.join(candidateRoot, fileName));
}

function summarizeDataset(dataset, gateStatus) {
  const records = dataset.records || [];
  const statusCounts = {};
  const flagCounts = {};

  for (const record of records) {
    statusCounts[record.source_status] = (statusCounts[record.source_status] || 0) + 1;
    for (const flag of record.review_flags || []) {
      flagCounts[flag] = (flagCounts[flag] || 0) + 1;
    }
  }

  return {
    dataset_id: dataset.dataset_id,
    gate_status: gateStatus,
    dataset_status: dataset.status,
    definition: dataset.definition,
    unit: dataset.unit,
    source_year: records[0]?.source_year || null,
    record_count: records.length,
    source_status_counts: statusCounts,
    review_flag_counts: flagCounts,
    source_method_note: dataset.source_method_note,
  };
}

function buildStatus() {
  const runtimeCountries = readDataJson("countries.json");
  const sourceDefinitions = readDataJson("source-definitions.json");
  const gate = readCandidate("promotion-gate-summary.json");
  const eu27 = readCandidate("eu27-electricity-use.candidate.json");
  const usNational = readCandidate("us-national-electricity-use.candidate.json");
  const usStates = readCandidate("us-states-electricity-use.candidate.json");
  const world = readCandidate("world-electricity-use.candidate.json");

  const runtimeStatusCounts = {};
  for (const country of runtimeCountries) {
    runtimeStatusCounts[country.source_status] = (runtimeStatusCounts[country.source_status] || 0) + 1;
  }

  const definitions = sourceDefinitions.definitions.map((definition) => ({
    id: definition.id,
    jurisdiction_scope: definition.jurisdiction_scope,
    source_system: definition.source_system,
    review_status: definition.review_status,
    metric_label: definition.metric_label,
    runtime_allowed: definition.runtime_allowed,
    boundary_note: definition.boundary_note,
  }));

  return {
    generated_at: new Date().toISOString(),
    runtime_import_authorized: sourceDefinitions.runtime_import_authorized,
    live_import_authorized: gate.live_import_authorized,
    default_truth_boundary: sourceDefinitions.default_truth_boundary,
    runtime_data: {
      file: "data/countries.json",
      record_count: runtimeCountries.length,
      source_status_counts: runtimeStatusCounts,
      ready_for_public_claims: false,
    },
    source_definitions: definitions,
    candidates: [
      summarizeDataset(eu27, gate.eu27.status),
      summarizeDataset(usNational, gate.us_national.status),
      summarizeDataset(usStates, gate.us_states.status),
      summarizeDataset(world, gate.world.status),
    ],
    promotion_gate: {
      eu27: gate.eu27,
      us_national: gate.us_national,
      us_states: gate.us_states,
      world: gate.world,
      next_steps: gate.next_steps,
    },
    conclusion: {
      runtime_ready: false,
      source_candidates_ready_for_runtime: false,
      reason:
        "Runtime import is not authorized. EU27, US, World, and selected non-EU country records are source-value checked candidates, but none are promoted runtime data.",
      next_required_actions: [
        "Review the Eurostat final-consumption denominator before promoting EU27.",
        "Decide whether the US denominator remains retail electricity sales or is redesigned to include direct use.",
        "Review the UNSD World and selected non-EU country total-final-consumption denominators before promotion.",
        "Build a promotion adapter that refuses runtime output unless the gate is explicitly authorized.",
        "Update public copy to use source-specific denominator labels before any promotion.",
      ],
    },
  };
}

function assertStatus(status) {
  assert.strictEqual(status.runtime_import_authorized, false, "runtime import must remain disabled");
  assert.strictEqual(status.live_import_authorized, false, "live import must remain disabled");
  assert.strictEqual(status.runtime_data.ready_for_public_claims, false, "runtime data cannot be public-claim-ready");

  const byId = Object.fromEntries(status.candidates.map((candidate) => [candidate.dataset_id, candidate]));
  assert.strictEqual(
    byId["eu27-electricity-use"].gate_status,
    "source_value_check_passed_candidate_not_promoted",
    "EU27 gate must remain candidate-not-promoted"
  );
  assert.strictEqual(
    byId["us-national-electricity-use"].gate_status,
    "source_value_check_passed_candidate_not_promoted",
    "US national gate must remain candidate-not-promoted"
  );
  assert.strictEqual(
    byId["us-states-electricity-use"].gate_status,
    "source_value_check_passed_candidate_not_promoted",
    "US states gate must remain candidate-not-promoted"
  );
  assert.strictEqual(
    byId["world-electricity-use"].gate_status,
    "source_value_check_passed_candidate_not_promoted",
    "World gate must remain candidate-not-promoted"
  );
}

function printText(status) {
  console.log("AI Labour Power Budget Source Status");
  console.log("");
  console.log(`Runtime import authorized: ${status.runtime_import_authorized}`);
  console.log(`Live import authorized: ${status.live_import_authorized}`);
  console.log(
    `Runtime data: ${status.runtime_data.record_count} records (${Object.entries(status.runtime_data.source_status_counts)
      .map(([key, value]) => `${key}: ${value}`)
      .join(", ")})`
  );
  console.log("");
  for (const candidate of status.candidates) {
    console.log(`${candidate.dataset_id}`);
    console.log(`  gate: ${candidate.gate_status}`);
    console.log(`  records: ${candidate.record_count}`);
    console.log(`  metric: ${candidate.definition}`);
    console.log(`  year: ${candidate.source_year}`);
  }
  console.log("");
  console.log(`Conclusion: ${status.conclusion.reason}`);
}

const status = buildStatus();
assertStatus(status);

if (process.argv.includes("--json")) {
  console.log(JSON.stringify(status, null, 2));
} else {
  printText(status);
}
