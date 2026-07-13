const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const dataRoot = path.join(root, "data");

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(dataRoot, relativePath), "utf8"));
}

const countries = readJson("countries.json");
const eu27Shell = readJson("eu27-shell.json");
const jurisdictionGroups = readJson("jurisdiction-groups.json");
const workerProfiles = readJson("worker-profiles.json");
const allocationProfiles = readJson("electricity-allocation-profiles.json");
const assumptions = readJson("comparison-assumptions.json");
const sourceDefinitions = readJson("source-definitions.json");
const promotionGate = readJson("source-candidates/promotion-gate-summary.json");
const worldCandidate = readJson("source-candidates/world-electricity-use.candidate.json");
const copyLanguages = readJson("copy/languages.json");
const copy = Object.fromEntries(
  copyLanguages.map((language) => [language.code, readJson(`copy/${language.file}`)])
);

assert(Array.isArray(countries), "countries.json must be an array");
assert(Array.isArray(eu27Shell), "eu27-shell.json must be an array");
assert(Array.isArray(jurisdictionGroups), "jurisdiction-groups.json must be an array");
assert(Array.isArray(allocationProfiles), "electricity-allocation-profiles.json must be an array");
assert(Array.isArray(copyLanguages) && copyLanguages.length > 0, "copy/languages.json must list languages");

const jurisdictionGroupsById = Object.fromEntries(jurisdictionGroups.map((group) => [group.id, group]));
for (const requiredGroup of ["eu", "us", "world"]) {
  assert(jurisdictionGroupsById[requiredGroup], `jurisdiction-groups.json missing ${requiredGroup}`);
}

for (const group of jurisdictionGroups) {
  for (const key of [
    "id",
    "label",
    "short_label",
    "status",
    "rack_columns",
    "denominator_label",
    "allocation_label_template",
    "scenario_sentence_template",
    "truth_boundary",
  ]) {
    assert(Object.prototype.hasOwnProperty.call(group, key), `jurisdiction group ${group.id || "unknown"} missing ${key}`);
  }
  assert(Number.isInteger(group.rack_columns) && group.rack_columns >= 3, `${group.id} rack_columns must be usable`);
  assert(group.allocation_label_template.includes("{share}"), `${group.id} allocation template must include {share}`);
}

assert.strictEqual(
  jurisdictionGroupsById.eu.candidate_paths?.[0],
  "source-candidates/eu27-electricity-use.candidate.json",
  "EU group must load reviewed source candidates, not demo placeholders"
);
assert(
  countries.every((country) => country.source_status === "demo_not_verified"),
  "countries.json must remain a demo placeholder file until promotion is explicitly authorized"
);
assert(
  jurisdictionGroupsById.us.candidate_paths?.every((candidatePath) => candidatePath.startsWith("source-candidates/")),
  "US group must point at source-candidate files, not promoted runtime data"
);
assert.strictEqual(
  jurisdictionGroupsById.world.data_mode,
  "source_candidate_review",
  "World must expose the reviewed UNSD value only in source-candidate review mode"
);
assert.strictEqual(jurisdictionGroupsById.world.status, "source_candidate_review");
assert.deepEqual(
  jurisdictionGroupsById.world.candidate_paths,
  ["source-candidates/world-electricity-use.candidate.json"]
);
assert.strictEqual(
  jurisdictionGroupsById.world.denominator_copy_key,
  "denominatorFinalElectricityConsumption"
);
assert.strictEqual(
  jurisdictionGroupsById.world.truth_boundary_copy_key,
  "truthBoundaryWorldSourceCandidate"
);

const worldDefinition = sourceDefinitions.definitions.find(
  (definition) => definition.id === jurisdictionGroupsById.world.source_definition_id
);
assert(worldDefinition, "World group must reference a source definition");
assert.strictEqual(worldDefinition.source_system, "United Nations Statistics Division (UNSD)");
assert.strictEqual(worldDefinition.runtime_allowed, false, "World candidate must not be runtime-authorized");
assert.match(worldDefinition.review_status, /candidate_not_promoted/);

assert.strictEqual(worldCandidate.dataset_id, "world-electricity-use");
assert.strictEqual(worldCandidate.status, "source_candidate");
assert.strictEqual(worldCandidate.records.length, 1);
const worldRecord = worldCandidate.records[0];
assert.strictEqual(worldRecord.code, "WLD");
assert.strictEqual(worldRecord.sentence_name, "the world");
assert.strictEqual(worldRecord.annual_electricity_twh, 25539.798);
assert.strictEqual(worldRecord.source_year, "2023");
assert.strictEqual(worldRecord.source_retrieved_at, "2026-07-13");
assert.strictEqual(
  worldRecord.source_url,
  "https://unstats.un.org/unsd/energystats/pubs/yearbook/2023/t34.pdf"
);
assert.strictEqual(worldRecord.source_status, "source_candidate");
assert(worldRecord.review_flags.includes("source_candidate_not_promoted"));
assert.strictEqual(promotionGate.world.status, "source_value_check_passed_candidate_not_promoted");
assert.strictEqual(promotionGate.live_import_authorized, false);

for (const language of copyLanguages) {
  assert(language.code && typeof language.code === "string", "copy language missing code");
  assert(language.label && typeof language.label === "string", `${language.code} missing label`);
  assert(language.locale && typeof language.locale === "string", `${language.code} missing locale`);
  assert(language.file && typeof language.file === "string", `${language.code} missing file`);
  assert(fs.existsSync(path.join(dataRoot, "copy", language.file)), `${language.code} file does not exist`);
}

for (const country of countries) {
  for (const key of [
    "code",
    "name",
    "local_name",
    "local_language",
    "annual_electricity_twh",
    "source_name",
    "source_url",
    "source_year",
    "source_status",
    "retrieved_at",
  ]) {
    assert(Object.prototype.hasOwnProperty.call(country, key), `country ${country.code || "unknown"} missing ${key}`);
  }
  assert(Number.isFinite(country.annual_electricity_twh), `${country.code} annual_electricity_twh must be numeric`);
}

const profileIds = [
  ...workerProfiles.powerProfiles.map((profile) => profile.id),
  ...workerProfiles.runtimeProfiles.map((profile) => profile.id),
  ...workerProfiles.overheadProfiles.map((profile) => profile.id),
  ...allocationProfiles.map((profile) => profile.id),
];

for (const [language, text] of Object.entries(copy)) {
  for (const key of [
    "allocationSentenceTemplate",
    "comparisonSentenceTemplate",
    "allocationLabelTemplate",
    "shareCapacityLabelTemplate",
    "calculationBasisTemplate",
  ]) {
    assert(typeof text[key] === "string" && text[key].includes("{"), `${language} missing template ${key}`);
  }
  for (const profileId of profileIds) {
    assert(text.profileText[profileId], `${language} copy missing profileText.${profileId}`);
  }
}

for (const key of [
  "onshore_wind_turbine_mw",
  "offshore_wind_turbine_mw",
  "offshore_capacity_factor",
  "household_kwh_year",
  "battery_pack_mwh",
  "nuclear_reactor_mw",
  "nuclear_capacity_factor",
  "hydro_plant_mw",
  "hydro_capacity_factor",
]) {
  assert(Number.isFinite(assumptions[key]), `comparison-assumptions.json missing numeric ${key}`);
}

console.log("AI Labour Power Budget data contract tests passed");
