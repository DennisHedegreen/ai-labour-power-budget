const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const copyRoot = path.join(__dirname, "..", "data", "copy");
const languages = JSON.parse(fs.readFileSync(path.join(copyRoot, "languages.json"), "utf8"));

const requiredKeys = [
  "dataMode",
  "dataModeDemo",
  "dataModeSourceCandidateReview",
  "dataModePromotedRuntime",
  "dataModeDemoText",
  "dataModeSourceCandidateReviewText",
  "dataModePromotedRuntimeText",
  "guide",
  "close",
  "guideTitle",
  "candidateNotPromoted",
  "sourceEvidence",
  "sourceName",
  "sourceYear",
  "sourceMetric",
  "retrievalDate",
  "sourceUrl",
  "sourceStatus",
  "sourceUnavailable",
  "unitTwhPerYear",
  "unitMwhPerYear",
  "unitKwhPerYear",
  "unitHoursPerWeek",
  "denominatorFinalElectricityConsumption",
  "denominatorRetailElectricitySales",
  "denominatorSelected",
  "averageKwhCalendarDay",
  "averageKwhCalendarDayValueTemplate",
  "truthBoundaryEuSourceCandidate",
  "truthBoundaryUsSourceCandidate",
  "truthBoundaryWorldSourceCandidate",
  "requiredEnergy",
  "requiredEnergyMultiple",
  "beyondTotalElectricity",
  "beyondTotalIntro",
  "requiredEnergySentenceTemplate",
  "requiredEnergyLabelTemplate",
  "sourceCandidateReportBoundary",
  "targetMatch",
  "targetMatchSentenceTemplate",
  "targetPreset",
  "overThreeHundredPercent",
  "downloadReport",
  "referenceComparisons",
  "generatedLabel",
  "publicReviewPdfBoundary",
  "truthBoundaryText",
  "wind3",
  "fullOutputAssumption",
];

const directPdfLabels = {
  en: "Download PDF",
  da: "Hent PDF",
  de: "PDF herunterladen",
  sv: "Ladda ner PDF",
  fr: "Télécharger le PDF",
  nl: "PDF downloaden",
  es: "Descargar PDF",
  it: "Scarica PDF",
  pt: "Transferir PDF",
  pl: "Pobierz PDF",
  ro: "Descarcă PDF",
  cs: "Stáhnout PDF",
  sk: "Stiahnuť PDF",
  hu: "PDF letöltése",
  bg: "Изтегляне на PDF",
  hr: "Preuzmi PDF",
  sl: "Prenesi PDF",
  el: "Λήψη PDF",
  fi: "Lataa PDF",
  et: "Laadi PDF alla",
  lv: "Lejupielādēt PDF",
  lt: "Atsisiųsti PDF",
  ga: "Íoslódáil PDF",
  mt: "Niżżel PDF",
  ja: "PDFをダウンロード",
};

function placeholders(template) {
  return [...String(template).matchAll(/\{([a-zA-Z0-9_]+)\}/g)]
    .map((match) => match[1])
    .sort();
}

function assertNoDuplicateJsonKeys(rawText, fileName) {
  const tokenPattern = /"(?:\\.|[^"\\])*"|[{}\[\]:,]|-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?|true|false|null/g;
  const tokens = [];
  let previousEnd = 0;

  for (const match of rawText.matchAll(tokenPattern)) {
    const gap = rawText.slice(previousEnd, match.index);
    assert.match(gap, /^\s*$/, `${fileName} contains invalid JSON near offset ${previousEnd}`);
    tokens.push(match[0]);
    previousEnd = match.index + match[0].length;
  }

  assert.match(
    rawText.slice(previousEnd),
    /^\s*$/,
    `${fileName} contains invalid trailing JSON near offset ${previousEnd}`
  );

  let cursor = 0;

  function consume(expected) {
    assert.equal(tokens[cursor], expected, `${fileName} expected ${expected} at token ${cursor}`);
    cursor += 1;
  }

  function parseValue() {
    const token = tokens[cursor];
    if (token === "{") {
      parseObject();
      return;
    }
    if (token === "[") {
      parseArray();
      return;
    }
    assert(token !== undefined, `${fileName} ended before a JSON value at token ${cursor}`);
    assert.notEqual(token, "}", `${fileName} has an unexpected } at token ${cursor}`);
    assert.notEqual(token, "]", `${fileName} has an unexpected ] at token ${cursor}`);
    assert.notEqual(token, ":", `${fileName} has an unexpected : at token ${cursor}`);
    assert.notEqual(token, ",", `${fileName} has an unexpected , at token ${cursor}`);
    cursor += 1;
  }

  function parseObject() {
    consume("{");
    const keys = new Set();
    if (tokens[cursor] === "}") {
      cursor += 1;
      return;
    }

    while (true) {
      const keyToken = tokens[cursor];
      assert.match(keyToken || "", /^"/, `${fileName} expected an object key at token ${cursor}`);
      const key = JSON.parse(keyToken);
      assert(!keys.has(key), `${fileName} contains duplicate JSON key ${key}`);
      keys.add(key);
      cursor += 1;
      consume(":");
      parseValue();
      if (tokens[cursor] === "}") {
        cursor += 1;
        return;
      }
      consume(",");
    }
  }

  function parseArray() {
    consume("[");
    if (tokens[cursor] === "]") {
      cursor += 1;
      return;
    }

    while (true) {
      parseValue();
      if (tokens[cursor] === "]") {
        cursor += 1;
        return;
      }
      consume(",");
    }
  }

  parseValue();
  assert.equal(cursor, tokens.length, `${fileName} contains extra JSON tokens after the root value`);
}

assert.doesNotThrow(() =>
  assertNoDuplicateJsonKeys(
    '{"left":{"label":"one"},"right":{"label":"two"}}',
    "distinct-object-keys.fixture.json"
  )
);
assert.throws(
  () => assertNoDuplicateJsonKeys('{"value":1,"value":2}', "duplicate-key.fixture.json"),
  /duplicate JSON key value/
);

function stringLeaves(value, prefix = "", result = new Map()) {
  if (typeof value === "string") {
    result.set(prefix, value);
    return result;
  }

  if (Array.isArray(value)) {
    value.forEach((entry, index) => stringLeaves(entry, `${prefix}[${index}]`, result));
    return result;
  }

  if (value && typeof value === "object") {
    for (const [key, entry] of Object.entries(value)) {
      stringLeaves(entry, prefix ? `${prefix}.${key}` : key, result);
    }
  }

  return result;
}

function structureSignature(value) {
  if (Array.isArray(value)) {
    return {
      type: "array",
      entries: value.map(structureSignature),
    };
  }

  if (value && typeof value === "object") {
    return {
      type: "object",
      entries: Object.entries(value)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, entry]) => [key, structureSignature(entry)]),
    };
  }

  return { type: typeof value };
}

assert.equal(languages.length, 25, "all configured public-review languages must be checked");

const englishCopy = JSON.parse(fs.readFileSync(path.join(copyRoot, "en.json"), "utf8"));
const englishStringLeaves = stringLeaves(englishCopy);
const englishStringPaths = [...englishStringLeaves.keys()].sort();
const englishStructure = structureSignature(englishCopy);
const copyByLanguage = new Map();
for (const language of languages) {
  const rawText = fs.readFileSync(path.join(copyRoot, language.file), "utf8");
  assertNoDuplicateJsonKeys(rawText, language.file);
  const text = JSON.parse(rawText);
  copyByLanguage.set(language.code, text);

  assert.deepEqual(
    structureSignature(text),
    englishStructure,
    `${language.code} full copy structure drifted from en.json`
  );

  const localizedStringLeaves = stringLeaves(text);
  assert.deepEqual(
    [...localizedStringLeaves.keys()].sort(),
    englishStringPaths,
    `${language.code} string-key structure drifted from en.json`
  );

  for (const stringPath of englishStringPaths) {
    const localizedValue = localizedStringLeaves.get(stringPath);
    assert(localizedValue.trim(), `${language.code} has empty string copy at ${stringPath}`);
    assert.deepEqual(
      placeholders(localizedValue),
      placeholders(englishStringLeaves.get(stringPath)),
      `${language.code} placeholders drifted at ${stringPath}`
    );
  }

  for (const key of requiredKeys) {
    assert.equal(typeof text[key], "string", `${language.code} missing string copy key ${key}`);
    assert(text[key].trim(), `${language.code} has empty copy key ${key}`);
  }

  assert.equal(
    text.downloadReport,
    directPdfLabels[language.code],
    `${language.code} downloadReport must describe a direct PDF download`
  );

  assert.deepEqual(
    Object.keys(text).filter((key) => /print/i.test(key)),
    [],
    `${language.code} retains obsolete print-specific copy keys`
  );

  assert.deepEqual(
    placeholders(text.requiredEnergySentenceTemplate),
    ["countryName", "denominator", "energyMultiple", "profiles", "twh"],
    `${language.code} required-energy sentence placeholders drifted`
  );
  assert.deepEqual(
    placeholders(text.requiredEnergyLabelTemplate),
    ["denominator", "energyMultiple"],
    `${language.code} required-energy label placeholders drifted`
  );
  assert.deepEqual(
    placeholders(text.targetMatchSentenceTemplate),
    ["ratio"],
    `${language.code} target-match sentence placeholders drifted`
  );

  assert.match(text.unitTwhPerYear, /^TWh\//, `${language.code} must retain the TWh SI symbol`);
  assert.match(text.unitMwhPerYear, /^MWh\//, `${language.code} must retain the MWh SI symbol`);
  assert.match(text.unitKwhPerYear, /^kWh\//, `${language.code} must retain the kWh SI symbol`);
  assert.match(text.wind3, /3(?: |-)MW/, `${language.code} wind comparison must name the 3 MW basis`);
  assert.match(
    text.fullOutputAssumption,
    /3(?: |-)MW/,
    `${language.code} wind assumption must name the continuous 3 MW basis`
  );
}

const en = copyByLanguage.get("en");
assert.deepEqual(
  {
    unitTwhPerYear: en.unitTwhPerYear,
    unitMwhPerYear: en.unitMwhPerYear,
    unitKwhPerYear: en.unitKwhPerYear,
    unitHoursPerWeek: en.unitHoursPerWeek,
  },
  {
    unitTwhPerYear: "TWh/year",
    unitMwhPerYear: "MWh/year",
    unitKwhPerYear: "kWh/year",
    unitHoursPerWeek: "h/week",
  }
);
assert.equal(en.wind3, "Continuous 3 MW nameplate-output equivalents");
assert.equal(en.batteryPacks, "100 MWh full-cycle equivalents");
assert.equal(en.targetPreset, "preset");
assert.equal(en.overThreeHundredPercent, "over 300%");
assert.doesNotMatch(en.batteryPacks, /battery packs/i);
assert.equal(
  en.fullOutputAssumption,
  "reference assumption: energy equivalent at continuous 3 MW nameplate output; not a realistic turbine count"
);
assert.match(en.batteryAssumption, /throughput/i);
assert.match(en.dataModeSourceCandidateReviewText, /source-candidate/i);
assert.match(en.dataModeSourceCandidateReviewText, /not promoted/i);
assert.match(en.dataModePromotedRuntimeText, /promotion gate/i);
assert.match(en.candidateNotPromoted, /not promoted/i);
assert.match(en.sourceCandidateReportBoundary, /not promoted/i);
assert.match(en.sourceCandidateReportBoundary, /not .*verified runtime/i);
assert.match(en.truthBoundaryWorldSourceCandidate, /UNSD/i);
assert.match(en.truthBoundaryWorldSourceCandidate, /2023/i);
assert.match(en.truthBoundaryWorldSourceCandidate, /world total/i);
assert.match(en.truthBoundaryWorldSourceCandidate, /selected non-EU country/i);
assert.match(en.truthBoundaryWorldSourceCandidate, /final electricity consumption/i);
assert.match(en.truthBoundaryWorldSourceCandidate, /source candidate/i);
assert.match(en.truthBoundaryWorldSourceCandidate, /not promoted/i);
assert.match(en.truthBoundaryWorldSourceCandidate, /verified runtime data/i);
assert.match(en.beyondTotalIntro, /above 100%/i);
assert.match(en.beyondTotalIntro, /not an allocation/i);
assert.match(en.requiredEnergySentenceTemplate, /beyond-total-electricity thought experiment/i);
assert.match(en.requiredEnergySentenceTemplate, /not an allocation/i);
assert.match(en.truthBoundaryText, /energy-equivalent/i);
assert.match(en.truthBoundaryText, /spare electricity or grid capacity/i);
assert.match(en.truthBoundaryText, /job loss/i);
assert.doesNotMatch(en.truthBoundaryText, /uses demo values/i);

const da = copyByLanguage.get("da");
assert.deepEqual(
  {
    unitTwhPerYear: da.unitTwhPerYear,
    unitMwhPerYear: da.unitMwhPerYear,
    unitKwhPerYear: da.unitKwhPerYear,
    unitHoursPerWeek: da.unitHoursPerWeek,
  },
  {
    unitTwhPerYear: "TWh/år",
    unitMwhPerYear: "MWh/år",
    unitKwhPerYear: "kWh/år",
    unitHoursPerWeek: "t/uge",
  }
);
assert.equal(da.wind3, "Ækvivalenter ved kontinuerligt 3 MW-mærkeoutput");
assert.equal(da.targetPreset, "forvalg");
assert.equal(da.overThreeHundredPercent, "over 300 %");
assert.equal(
  da.fullOutputAssumption,
  "referenceantagelse: energiækvivalent ved kontinuerligt 3 MW-mærkeoutput; ikke et realistisk antal vindmøller"
);
assert.match(da.dataModeSourceCandidateReviewText, /kildekandidat/i);
assert.match(da.dataModeSourceCandidateReviewText, /ikke promoveret/i);
assert.match(da.sourceCandidateReportBoundary, /ikke promoveret/i);
assert.match(da.truthBoundaryWorldSourceCandidate, /UNSD/i);
assert.match(da.truthBoundaryWorldSourceCandidate, /2023/i);
assert.match(da.truthBoundaryWorldSourceCandidate, /samlede endelige elforbrug for verden/i);
assert.match(da.truthBoundaryWorldSourceCandidate, /kildekandidat/i);
assert.match(da.truthBoundaryWorldSourceCandidate, /ikke promoveret/i);
assert.match(da.truthBoundaryWorldSourceCandidate, /verificeret.*runtime-data/i);
assert.match(da.beyondTotalIntro, /over 100 %/i);
assert.match(da.beyondTotalIntro, /ikke en allokering/i);
assert.match(da.truthBoundaryText, /energiækvivalente/i);
assert.match(da.truthBoundaryText, /netkapacitet/i);
assert.match(da.truthBoundaryText, /tab af arbejdspladser/i);
assert.doesNotMatch(da.truthBoundaryText, /bruger demoværdier/i);

console.log("AI Labour Power Budget truth-copy tests passed");
