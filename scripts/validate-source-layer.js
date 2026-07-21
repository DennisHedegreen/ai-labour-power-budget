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

function assertDatasetShape(dataset, expected) {
  assert.strictEqual(dataset.status, "source_candidate", `${expected.id} must remain source_candidate`);
  assert.strictEqual(dataset.dataset_id, expected.id, `${expected.id} dataset_id mismatch`);
  assert.strictEqual(dataset.unit, "TWh/year", `${expected.id} must use TWh/year`);
  assert(Array.isArray(dataset.records), `${expected.id} records must be an array`);
  assert.strictEqual(dataset.records.length, expected.records, `${expected.id} record count mismatch`);

  const codes = new Set();
  for (const record of dataset.records) {
    assert(record.code && typeof record.code === "string", `${expected.id} has record without code`);
    assert(!codes.has(record.code), `${expected.id} duplicate code ${record.code}`);
    codes.add(record.code);
    assert(Number.isFinite(record.annual_electricity_twh), `${record.code} annual_electricity_twh must be numeric`);
    assert(record.annual_electricity_twh > 0, `${record.code} annual_electricity_twh must be positive`);
    assert.strictEqual(record.source_status, "source_candidate", `${record.code} must remain source_candidate`);
    assert(record.source_retrieved_at, `${record.code} missing source_retrieved_at`);
    assert(Array.isArray(record.review_flags), `${record.code} missing review_flags`);
    assert(record.definition && typeof record.definition === "string", `${record.code} missing definition`);
  }

  for (const requiredCode of expected.requiredCodes || []) {
    assert(codes.has(requiredCode), `${expected.id} missing ${requiredCode}`);
  }
}

const sourceDefinitions = readDataJson("source-definitions.json");
const gate = readCandidate("promotion-gate-summary.json");
const eu27 = readCandidate("eu27-electricity-use.candidate.json");
const usNational = readCandidate("us-national-electricity-use.candidate.json");
const usStates = readCandidate("us-states-electricity-use.candidate.json");
const world = readCandidate("world-electricity-use.candidate.json");

assert.strictEqual(
  sourceDefinitions.runtime_import_authorized,
  false,
  "runtime import must stay disabled until an explicit promotion gate changes it"
);
assert(Array.isArray(sourceDefinitions.definitions), "source-definitions.json must list definitions");
assert(sourceDefinitions.definitions.length >= 3, "source-definitions.json must include EU, US, and World definitions");

const definitionsById = Object.fromEntries(sourceDefinitions.definitions.map((definition) => [definition.id, definition]));
assert(definitionsById.eurostat_final_consumption_electricity, "missing Eurostat definition");
assert(definitionsById.eia_retail_sales_ultimate_customers, "missing EIA definition");
assert(definitionsById.unsd_world_final_consumption_electricity, "missing UNSD World definition");

assert.strictEqual(definitionsById.eurostat_final_consumption_electricity.runtime_allowed, false);
assert.strictEqual(definitionsById.eia_retail_sales_ultimate_customers.runtime_allowed, false);
assert.strictEqual(definitionsById.unsd_world_final_consumption_electricity.runtime_allowed, false);
assert.match(
  definitionsById.eia_retail_sales_ultimate_customers.boundary_note,
  /excludes direct use/i,
  "EIA boundary note must preserve direct-use exclusion"
);
assert.match(
  sourceDefinitions.default_truth_boundary,
  /not spare grid capacity/i,
  "default truth boundary must reject spare-grid-capacity framing"
);

assert.strictEqual(gate.live_import_authorized, false, "promotion gate must not authorize live import");
assert.strictEqual(
  gate.eu27.status,
  "source_value_check_passed_candidate_not_promoted",
  "EU27 gate must remain candidate-not-promoted"
);
assert.strictEqual(gate.eu27.mismatches, 0, "EU27 direct API refresh must not have unresolved mismatches");
assert.strictEqual(
  gate.us_national.status,
  "source_value_check_passed_candidate_not_promoted",
  "US national status must remain candidate-not-promoted"
);
assert.strictEqual(
  gate.us_states.status,
  "source_value_check_passed_candidate_not_promoted",
  "US states status must remain candidate-not-promoted"
);
assert.strictEqual(
  gate.world.status,
  "source_value_check_passed_candidate_not_promoted",
  "World status must remain candidate-not-promoted"
);

assertDatasetShape(eu27, {
  id: "eu27-electricity-use",
  records: 28,
  requiredCodes: ["EU27", "DK", "DE", "FR", "SE"]
});
const eu27Aggregate = eu27.records[0];
assert.strictEqual(eu27Aggregate.code, "EU27", "EU27 aggregate must remain the first EU candidate record");
assert.strictEqual(eu27Aggregate.jurisdiction_type, "country_group");
assert.strictEqual(eu27Aggregate.annual_electricity_twh, 2413.752);
assert.match(eu27Aggregate.source_metric, /aggregate computed from the 27 reviewed member records/);
assert(
  eu27Aggregate.review_flags.includes("eu27_member_sum_from_checked_records"),
  "EU27 aggregate must preserve the member-sum review flag"
);
assert(
  eu27.records
    .filter((record) => record.jurisdiction_type === "country")
    .every((record) => record.review_flags.includes("eurostat_direct_api_value_checked")),
  "EU27 member-country records must keep direct Eurostat API check flag"
);
assert(
  eu27.records.every((record) => record.review_flags.includes("source_candidate_not_promoted")),
  "EU27 records must stay candidate-not-promoted"
);
assert.strictEqual(
  eu27.records.find((record) => record.code === "GR")?.source_geo_code,
  "EL",
  "Greece must preserve Eurostat geo code EL while exposing UI code GR"
);

assertDatasetShape(usNational, {
  id: "us-national-electricity-use",
  records: 1,
  requiredCodes: ["US"]
});
assertDatasetShape(usStates, {
  id: "us-states-electricity-use",
  records: 51,
  requiredCodes: ["US-CA", "US-DC", "US-NY", "US-TX"]
});
assert(
  usNational.records.concat(usStates.records).every((record) =>
    record.review_flags.includes("eia_retail_sales_excludes_direct_use")
  ),
  "US records must keep EIA direct-use exclusion flag"
);

assertDatasetShape(world, {
  id: "world-electricity-use",
  records: 4,
  requiredCodes: ["WLD", "UK", "AU", "CA"]
});
const worldRecord = world.records.find((record) => record.code === "WLD");
const ukRecord = world.records.find((record) => record.code === "UK");
const australiaRecord = world.records.find((record) => record.code === "AU");
const canadaRecord = world.records.find((record) => record.code === "CA");
assert.strictEqual(worldRecord.annual_electricity_twh, 25539.798);
assert.strictEqual(worldRecord.source_year, "2023");
assert.strictEqual(worldRecord.source_retrieved_at, "2026-07-13");
assert.strictEqual(
  worldRecord.source_url,
  "https://unstats.un.org/unsd/energystats/pubs/yearbook/2023/t34.pdf"
);
assert(
  worldRecord.review_flags.includes("unsd_yearbook_table_value_checked"),
  "World record must keep the official UNSD Yearbook table check flag"
);
assert(
  worldRecord.review_flags.includes("source_candidate_not_promoted"),
  "World record must stay candidate-not-promoted"
);
assert.strictEqual(gate.world.official_gwh / 1000, worldRecord.annual_electricity_twh);
assert.strictEqual(ukRecord.annual_electricity_twh, 269.086);
assert.strictEqual(ukRecord.source_year, "2023");
assert.strictEqual(ukRecord.source_retrieved_at, "2026-07-21");
assert.strictEqual(ukRecord.jurisdiction_type, "country");
assert.strictEqual(ukRecord.source_url, "https://unstats.un.org/unsd/energystats/pubs/yearbook/2023/t34.pdf");
assert(
  ukRecord.review_flags.includes("selected_non_eu_country_denominator"),
  "UK record must be labelled as a selected non-EU country denominator"
);
assert(
  ukRecord.review_flags.includes("source_candidate_not_promoted"),
  "UK record must stay candidate-not-promoted"
);
assert.strictEqual(gate.world.checked_records.find((record) => record.code === "UK").official_gwh / 1000, ukRecord.annual_electricity_twh);
assert.strictEqual(australiaRecord.annual_electricity_twh, 224.377);
assert.strictEqual(australiaRecord.source_year, "2023");
assert.strictEqual(australiaRecord.source_retrieved_at, "2026-07-21");
assert.strictEqual(australiaRecord.jurisdiction_type, "country");
assert.strictEqual(australiaRecord.source_url, "https://unstats.un.org/unsd/energystats/pubs/yearbook/2023/t34.pdf");
assert(
  australiaRecord.review_flags.includes("selected_non_eu_country_denominator"),
  "Australia record must be labelled as a selected non-EU country denominator"
);
assert(
  australiaRecord.review_flags.includes("source_candidate_not_promoted"),
  "Australia record must stay candidate-not-promoted"
);
assert.strictEqual(
  gate.world.checked_records.find((record) => record.code === "AU").official_gwh / 1000,
  australiaRecord.annual_electricity_twh
);
assert.strictEqual(canadaRecord.annual_electricity_twh, 529.902);
assert.strictEqual(canadaRecord.source_year, "2023");
assert.strictEqual(canadaRecord.source_retrieved_at, "2026-07-21");
assert.strictEqual(canadaRecord.jurisdiction_type, "country");
assert.strictEqual(canadaRecord.source_url, "https://unstats.un.org/unsd/energystats/pubs/yearbook/2023/t34.pdf");
assert(
  canadaRecord.review_flags.includes("selected_non_eu_country_denominator"),
  "Canada record must be labelled as a selected non-EU country denominator"
);
assert(
  canadaRecord.review_flags.includes("source_candidate_not_promoted"),
  "Canada record must stay candidate-not-promoted"
);
assert.strictEqual(
  gate.world.checked_records.find((record) => record.code === "CA").official_gwh / 1000,
  canadaRecord.annual_electricity_twh
);

console.log("AI Labour Power Budget source layer validation passed");
