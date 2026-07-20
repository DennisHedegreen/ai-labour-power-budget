const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const dataRoot = path.join(root, "data");

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(dataRoot, relativePath), "utf8"));
}

function sha256(relativePath) {
  return crypto.createHash("sha256").update(fs.readFileSync(path.join(root, relativePath))).digest("hex");
}

const index = read("index.html");
const app = read("app.js");
const pdfReport = read("pdf-report.js");
const dataLoader = read("data.js");
const groups = readJson("jurisdiction-groups.json");
const sourceDefinitions = readJson("source-definitions.json");
const definitionsById = new Map(
  sourceDefinitions.definitions.map((definition) => [definition.id, definition])
);

assert.match(index, /id="source-evidence"/);
assert.match(index, /<script src="\.\/data-policy\.js"><\/script>/);
assert.match(index, /<script src="\.\/display-format\.js"><\/script>/);
assert.match(index, /data-action="download-report"/);
assert.doesNotMatch(index, /data-action="print-report"/);
assert(
  index.indexOf("./data-policy.js") < index.indexOf("./data.js"),
  "data policy must load before the data loader"
);
assert(
  index.indexOf("./display-format.js") < index.indexOf("./app.js"),
  "display formatter must load before app.js"
);
for (const script of [
  "./vendor/pdfmake-0.2.20/pdfmake.min.js",
  "./vendor/pdfmake-0.2.20/vfs_fonts.js",
  "./pdf-report.js",
]) {
  assert(index.includes(script), `index.html missing direct-PDF runtime ${script}`);
}
assert(
  index.indexOf("./pdf-report.js") < index.indexOf("./app.js"),
  "PDF report runtime must load before app.js"
);
assert.equal(
  sha256("vendor/pdfmake-0.2.20/pdfmake.min.js"),
  "c2fd3a5e24db096c9139bb7d266765de433b0b866d03ba356c2ef4d9ae1a53b7",
  "vendored pdfmake runtime changed without an explicit version/integrity update"
);
assert.equal(
  sha256("vendor/pdfmake-0.2.20/vfs_fonts.js"),
  "f91db5690400fc851536c3a9322f822619f8e9f681abe42013e572d88d3c1f38",
  "vendored pdfmake fonts changed without an explicit version/integrity update"
);
assert.match(read("vendor/pdfmake-0.2.20/LICENSE"), /MIT License/);

for (const hook of [
  "sourceEvidenceRows",
  "renderSourceEvidence",
  "buildPdfReportModel",
  "downloadScenarioReportPdf",
  "sourceCandidateReportBoundary",
  "truthBoundaryText",
]) {
  assert(app.includes(hook), `app.js missing report hook ${hook}`);
}
for (const field of [
  "source_name",
  "source_year",
  "source_metric",
  "retrieved_at",
  "source_status",
  "promotion_status",
  "source_url",
]) {
  assert(app.includes(`country.${field}`), `screen/PDF source evidence missing ${field}`);
}
assert.match(app, /href="\$\{escapeAttribute\(href\)\}"/);
assert.match(app, /rel="noopener noreferrer"/);
assert.match(app, /isBeyondTotalElectricity\(state\.electricityAllocationShare\)/);
assert.match(app, /requiredEnergySentenceTemplate\(\)/);
assert.match(app, /calculateShareForTargetProfiles/);
assert.match(app, /text\.averageKwhCalendarDay/);
assert.match(app, /text\.averageKwhCalendarDayValueTemplate/);
assert.match(app, /text\.referenceComparisons/);
assert.match(app, /text\.generatedLabel/);
assert.match(app, /text\.publicReviewPdfBoundary/);
assert.match(app, /pdfReport\.downloadReport/);
assert.match(pdfReport, /application\/pdf/);
assert.match(pdfReport, /createObjectURL/);
assert.match(pdfReport, /revokeObjectURL/);
assert.match(pdfReport, /\.download\s*=/);
assert.doesNotMatch(app, /window\.(?:open|print)\s*\(/);
assert.doesNotMatch(pdfReport, /window\.(?:open|print)\s*\(/);
assert.doesNotMatch(app, /document\.write\s*\(/);
assert.doesNotMatch(app, /openScenarioReportPrint/);
assert.doesNotMatch(app, /["']kWh\/day["']/);
for (const rawUnit of ["TWh/year", "MWh/year", "kWh/year", "h/week"]) {
  assert(!app.includes(rawUnit), `app.js must render ${rawUnit} through localized copy`);
}
for (const copyKey of [
  "unitTwhPerYear",
  "unitMwhPerYear",
  "unitKwhPerYear",
  "unitHoursPerWeek",
  "targetPreset",
  "overThreeHundredPercent",
]) {
  assert(app.includes(copyKey), `app.js must render localized copy key ${copyKey}`);
}
assert.doesNotMatch(app, /Download report/);
assert.doesNotMatch(index, /Download report/);

for (const field of [
  "scenario_sentence_template",
  "comparison_sentence_template",
  "allocation_label_template",
  "required_energy_sentence_template",
  "required_energy_label_template",
  "allocation_intro",
  "truth_boundary",
]) {
  assert.doesNotMatch(
    app,
    new RegExp(`(?:group\\?\\.${field}|group\\.${field})(?![_A-Za-z0-9])`),
    `runtime must not render English jurisdiction field ${field}`
  );
}

for (const field of [
  "source_name",
  "source_url",
  "source_year",
  "source_status",
  "retrieved_at",
  "source_metric",
  "promotion_status",
  "data_mode",
]) {
  assert(dataLoader.includes(`${field}:`), `normalized records missing ${field}`);
}
assert.match(dataLoader, /record\.source_metric/, "record-level source metrics must be preserved for aggregates");
assert(dataLoader.includes("sentence_name:"), "normalized records must preserve an aggregate sentence name");
assert(app.includes("countrySentenceName"), "report sentences must support aggregate grammar without changing display names");

const expectedGroups = {
  eu: {
    source: /Eurostat/i,
    metric: /final electricity consumption/i,
    directUseBoundary: null,
  },
  us: {
    source: /U\.S\. Energy Information Administration|EIA/i,
    metric: /retail electricity sales to ultimate customers/i,
    directUseBoundary: /excludes direct use/i,
  },
  world: {
    source: /United Nations Statistics Division|UNSD/i,
    metric: /total final consumption of electricity/i,
    directUseBoundary: null,
  },
};

for (const [groupId, expected] of Object.entries(expectedGroups)) {
  const group = groups.find((entry) => entry.id === groupId);
  assert(group, `missing ${groupId} jurisdiction group`);
  assert.equal(group.data_mode, "source_candidate_review");
  assert(group.denominator_copy_key, `${groupId} denominator copy key is missing`);
  assert(group.truth_boundary_copy_key, `${groupId} truth-boundary copy key is missing`);
  assert.match(group.truth_boundary, /source candidate/i);
  assert.match(group.truth_boundary, /not promoted runtime data/i);
  assert.match(group.required_energy_label_template, /\{energyMultiple\}/);
  assert.match(group.required_energy_sentence_template, /\{energyMultiple\}/);
  assert.match(group.required_energy_sentence_template, /\{countryName\}/);
  assert.match(group.required_energy_sentence_template, /\{profiles\}/);
  assert.match(group.required_energy_sentence_template, /\{twh\}/);
  assert.match(group.required_energy_sentence_template, /not an allocation/i);

  const definition = definitionsById.get(group.source_definition_id);
  assert(definition, `${groupId} source definition is missing`);
  assert.match(definition.source_system, expected.source);
  assert.match(definition.metric_label, expected.metric);
  assert.equal(definition.runtime_allowed, false);
  assert.match(definition.review_status, /candidate_not_promoted/);
  if (expected.directUseBoundary) {
    assert.match(definition.boundary_note, expected.directUseBoundary);
    assert.match(group.allocation_intro, expected.directUseBoundary);
  }

  const candidateDatasets = group.candidate_paths.map((candidatePath) => readJson(candidatePath));
  assert(candidateDatasets.every((dataset) => dataset.status === "source_candidate"));
  const records = candidateDatasets.flatMap((dataset) => dataset.records);
  for (const record of records) {
    assert(record.source_name, `${record.code} missing source name`);
    assert(record.source_year, `${record.code} missing source year`);
    assert(record.source_url, `${record.code} missing source URL`);
    assert(record.source_retrieved_at, `${record.code} missing retrieval date`);
    assert(record.definition, `${record.code} missing source metric/definition`);
    assert.equal(record.source_status, "source_candidate");
  }
}

const worldGroup = groups.find((entry) => entry.id === "world");
assert.equal(worldGroup.denominator_copy_key, "denominatorFinalElectricityConsumption");
assert.equal(worldGroup.truth_boundary_copy_key, "truthBoundaryWorldSourceCandidate");
const worldDataset = readJson("source-candidates/world-electricity-use.candidate.json");
const worldRecord = worldDataset.records.find((record) => record.code === "WLD");
const ukRecord = worldDataset.records.find((record) => record.code === "UK");
assert.equal(worldRecord.code, "WLD");
assert.equal(worldRecord.sentence_name, "the world");
assert.equal(worldRecord.annual_electricity_twh, 25539.798);
assert.equal(worldRecord.source_year, "2023");
assert.equal(worldRecord.source_retrieved_at, "2026-07-13");
assert.equal(
  worldRecord.source_url,
  "https://unstats.un.org/unsd/energystats/pubs/yearbook/2023/t34.pdf"
);
assert(worldRecord.review_flags.includes("source_candidate_not_promoted"));
assert.equal(ukRecord.code, "UK");
assert.equal(ukRecord.sentence_name, "the United Kingdom");
assert.equal(ukRecord.annual_electricity_twh, 269.086);
assert.equal(ukRecord.source_year, "2023");
assert.equal(ukRecord.source_retrieved_at, "2026-07-21");
assert.equal(
  ukRecord.source_url,
  "https://unstats.un.org/unsd/energystats/pubs/yearbook/2023/t34.pdf"
);
assert(ukRecord.review_flags.includes("selected_non_eu_country_denominator"));
assert(ukRecord.review_flags.includes("source_candidate_not_promoted"));

console.log("AI Labour Power Budget source/report contract tests passed");
