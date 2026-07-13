const assert = require("node:assert/strict");
const {
  buildDocumentDefinition,
  createPdfBlob,
  downloadBlob,
  downloadReport,
} = require("../pdf-report.js");

const model = {
  locale: "da-DK",
  filename: "Danmark – scenarierapport.pdf",
  documentTitle: "AI Labour Power Budget – Danmark",
  author: "Hedegreen Research",
  subject: "Energiækvivalent scenarierapport",
  kicker: "Hedegreen Research · AI Labour Power Budget",
  title: "Scenarierapport",
  lead: "10 % svarer i dette scenarie til 570.776 konfigurerede profiler.",
  energyBoundary: "Energiækvivalent scenarie – ikke ledig netkapacitet.",
  metrics: [
    { label: "Land", value: "Danmark" },
    { label: "Tilsvarende profiler", value: "570.776", primary: true },
    { label: "Elandel", value: "10 %", note: "Scenarieværdi" },
  ],
  comparisonsTitle: "Referencesammenligninger",
  comparisons: [
    { label: "3 MW-vindmøller", value: "133", assumption: "Referenceantagelse: kontinuerlig fuld produktion" },
    { label: "Husstandsår", value: "875.000", assumption: "Referenceantagelse: 4.000 kWh/år" },
  ],
  sourceEvidence: {
    title: "Kildedokumentation",
    rows: [
      { label: "Kildenavn", value: "Eurostat" },
      { label: "Kilde-URL", value: "https://example.test/source", href: "https://example.test/source" },
      { label: "Status", value: "source_candidate · candidate_not_promoted" },
    ],
    candidateBoundary: "Kandidatkilde – ikke promoveret runtime-data.",
  },
  truthBoundary: {
    title: "Sandhedsgrænse",
    text: "Rapporten viser et energiækvivalent scenarie, ikke verificeret kapacitet.",
  },
  generatedLabel: "Genereret",
  generatedAt: "2026-07-13T11:05:00.000Z",
  statusLabel: "Datastatus",
  status: "source_candidate · candidate_not_promoted",
  footer: "Offentlig review-prototype · ikke en deployment-prognose",
};

const definition = buildDocumentDefinition(model);
assert.equal(definition.pageSize, "A4");
assert.equal(definition.defaultStyle.font, "Roboto");
assert.equal(definition.language, "da-DK");
assert.equal(definition.info.title, model.documentTitle);
assert.equal(definition.info.author, model.author);
assert.equal(definition.info.subject, model.subject);

const serialized = JSON.stringify(definition.content);
for (const expected of [
  model.title,
  model.lead,
  model.energyBoundary,
  "570.776",
  model.comparisonsTitle,
  "Referenceantagelse",
  model.sourceEvidence.title,
  model.sourceEvidence.candidateBoundary,
  model.truthBoundary.title,
  model.truthBoundary.text,
  model.generatedAt,
  model.status,
]) {
  assert(serialized.includes(expected), `PDF definition is missing ${expected}`);
}

const sourceHeading = definition.content.find((item) => item.text === model.sourceEvidence.title);
assert(sourceHeading, "source evidence heading is missing");
assert.equal(sourceHeading.pageBreak, "before", "source evidence must start on a new page");

function findLinkedValue(value) {
  for (const item of definition.content) {
    const body = item?.table?.body;
    if (!Array.isArray(body)) continue;
    for (const row of body) {
      for (const cell of row) {
        if (cell?.text === value && cell?.link) return cell;
      }
    }
  }
  return null;
}

assert.equal(findLinkedValue("https://example.test/source")?.link, "https://example.test/source");
const footer = definition.footer(2, 3);
assert.equal(footer.columns[0].text, model.footer);
assert.equal(footer.columns[1].text, "2 / 3");

let capturedDefinition;
const fakePdfMake = {
  createPdf(documentDefinition) {
    capturedDefinition = documentDefinition;
    return {
      getBlob(callback) {
        callback(new Blob(["%PDF-test"], { type: "application/octet-stream" }));
      },
    };
  },
};

(async () => {
  const blob = await createPdfBlob(model, fakePdfMake);
  assert.equal(blob.type, "application/pdf");
  assert.equal(await blob.text(), "%PDF-test");
  assert.equal(capturedDefinition.info.title, model.documentTitle);

  let clicked = 0;
  let appended = 0;
  let removed = 0;
  let revoked;
  let createdFrom;
  const anchor = {
    style: {},
    setAttribute() {},
    click() { clicked += 1; },
    remove() { removed += 1; },
  };
  const env = {
    document: {
      body: { appendChild() { appended += 1; } },
      createElement(tag) {
        assert.equal(tag, "a");
        return anchor;
      },
    },
    URL: {
      createObjectURL(value) {
        createdFrom = value;
        return "blob:pdf-test";
      },
      revokeObjectURL(value) { revoked = value; },
    },
    setTimeout(callback, delay) {
      assert.equal(delay, 1000);
      callback();
    },
  };

  const filename = downloadBlob(blob, "../../Bulgaria: report?.PDF", env);
  assert.equal(filename, "Bulgaria-report.pdf");
  assert.equal(anchor.download, filename);
  assert.equal(anchor.href, "blob:pdf-test");
  assert.equal(anchor.hidden, true);
  assert.equal(clicked, 1);
  assert.equal(appended, 1);
  assert.equal(removed, 1);
  assert.equal(revoked, "blob:pdf-test");
  assert.equal(createdFrom, blob);

  const result = await downloadReport(model, {
    pdfMake: fakePdfMake,
    filename: "Danmark / rapport",
    env,
  });
  assert.equal(result.blob.type, "application/pdf");
  assert.equal(result.filename, "Danmark-rapport.pdf");
  assert.equal(anchor.download, result.filename);

  console.log("AI Labour Power Budget PDF report tests passed");
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
