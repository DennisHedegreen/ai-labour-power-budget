const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const {
  DATA_MODES,
  assertKnownDataMode,
  validateDataMode,
} = require("../data-policy.js");

const dataRoot = path.join(__dirname, "..", "data");

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(dataRoot, relativePath), "utf8"));
}

assert.deepEqual(Object.values(DATA_MODES), [
  "demo",
  "source_candidate_review",
  "promoted_runtime",
]);

for (const mode of Object.values(DATA_MODES)) {
  assert.doesNotThrow(() => assertKnownDataMode(mode));
}
assert.throws(() => assertKnownDataMode("candidate"), /Unknown data mode/);

const demoRecord = { code: "DEMO", source_status: "demo_not_verified" };
const candidateRecord = { code: "CANDIDATE", source_status: "source_candidate" };
const verifiedRecord = { code: "VERIFIED", source_status: "verified_runtime" };

assert.equal(
  validateDataMode({ mode: DATA_MODES.DEMO, records: [demoRecord] }),
  DATA_MODES.DEMO
);
assert.throws(
  () => validateDataMode({ mode: DATA_MODES.DEMO, records: [candidateRecord] }),
  /only expose demo_not_verified/
);

assert.equal(
  validateDataMode({ mode: DATA_MODES.SOURCE_CANDIDATE_REVIEW, records: [candidateRecord] }),
  DATA_MODES.SOURCE_CANDIDATE_REVIEW
);
assert.throws(
  () => validateDataMode({ mode: DATA_MODES.SOURCE_CANDIDATE_REVIEW, records: [demoRecord] }),
  /only expose source_candidate/
);

assert.throws(
  () => validateDataMode({
    mode: DATA_MODES.PROMOTED_RUNTIME,
    records: [verifiedRecord],
    runtimeImportAuthorized: false,
    runtimeAllowed: true,
  }),
  /blocked by the source promotion gate/
);
assert.throws(
  () => validateDataMode({
    mode: DATA_MODES.PROMOTED_RUNTIME,
    records: [verifiedRecord],
    runtimeImportAuthorized: true,
    runtimeAllowed: false,
  }),
  /blocked by the source promotion gate/
);
assert.throws(
  () => validateDataMode({
    mode: DATA_MODES.PROMOTED_RUNTIME,
    records: [candidateRecord],
    runtimeImportAuthorized: true,
    runtimeAllowed: true,
  }),
  /only expose verified_runtime/
);
assert.equal(
  validateDataMode({
    mode: DATA_MODES.PROMOTED_RUNTIME,
    records: [verifiedRecord],
    runtimeImportAuthorized: true,
    runtimeAllowed: true,
  }),
  DATA_MODES.PROMOTED_RUNTIME
);

const sourceDefinitions = readJson("source-definitions.json");
const promotionGate = readJson("source-candidates/promotion-gate-summary.json");
const groups = readJson("jurisdiction-groups.json");
const definitionsById = new Map(
  sourceDefinitions.definitions.map((definition) => [definition.id, definition])
);

assert.equal(sourceDefinitions.runtime_import_authorized, false);
assert.equal(promotionGate.live_import_authorized, false);
assert.equal(groups[0].data_mode, DATA_MODES.SOURCE_CANDIDATE_REVIEW);

for (const group of groups.filter((entry) => entry.data_mode === DATA_MODES.SOURCE_CANDIDATE_REVIEW)) {
  assert(group.source_definition_id, `${group.id} candidate mode needs source_definition_id`);
  const definition = definitionsById.get(group.source_definition_id);
  assert(definition, `${group.id} references an unknown source definition`);
  assert.equal(definition.runtime_allowed, false, `${group.id} must not be runtime-authorized`);
  assert(group.candidate_paths?.length > 0, `${group.id} candidate mode needs candidate_paths`);

  const candidateDatasets = group.candidate_paths.map((candidatePath) => readJson(candidatePath));
  const records = candidateDatasets.flatMap((dataset) => dataset.records);
  assert(candidateDatasets.every((dataset) => dataset.status === "source_candidate"));
  assert(records.length > 0, `${group.id} candidate mode has no records`);
  assert(records.every((record) => record.source_status === "source_candidate"));
  assert.match(definition.review_status, /candidate_not_promoted/);
  assert.equal(
    validateDataMode({
      mode: group.data_mode,
      records,
      runtimeImportAuthorized: sourceDefinitions.runtime_import_authorized,
      runtimeAllowed: definition.runtime_allowed,
    }),
    DATA_MODES.SOURCE_CANDIDATE_REVIEW
  );
}

assert(
  groups.every((group) => group.data_mode !== DATA_MODES.PROMOTED_RUNTIME),
  "No jurisdiction may claim promoted runtime while the promotion gate is closed"
);

console.log("AI Labour Power Budget data-mode tests passed");
