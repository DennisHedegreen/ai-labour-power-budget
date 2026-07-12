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
const workerProfiles = readJson("worker-profiles.json");
const allocationProfiles = readJson("electricity-allocation-profiles.json");
const assumptions = readJson("comparison-assumptions.json");
const copyLanguages = readJson("copy/languages.json");
const copy = Object.fromEntries(
  copyLanguages.map((language) => [language.code, readJson(`copy/${language.file}`)])
);

assert(Array.isArray(countries), "countries.json must be an array");
assert(Array.isArray(eu27Shell), "eu27-shell.json must be an array");
assert(Array.isArray(allocationProfiles), "electricity-allocation-profiles.json must be an array");
assert(Array.isArray(copyLanguages) && copyLanguages.length > 0, "copy/languages.json must list languages");

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
]) {
  assert(Number.isFinite(assumptions[key]), `comparison-assumptions.json missing numeric ${key}`);
}

console.log("AI Labour Power Budget data contract tests passed");
