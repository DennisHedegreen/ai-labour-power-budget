(function attachPdfReport(root, factory) {
  "use strict";

  const api = factory(root);
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  } else {
    root.AILabourPowerBudgetPdfReport = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function createPdfReportApi(root) {
  "use strict";

  const DEFAULT_FILENAME = "ai-labour-power-budget-report.pdf";
  const PDF_MIME_TYPE = "application/pdf";

  function text(value, fallback = "") {
    return value === undefined || value === null ? fallback : String(value);
  }

  function compact(values) {
    return values.filter(Boolean);
  }

  function metricCell(metric) {
    return {
      stack: [
        { text: text(metric.label), style: "cardLabel" },
        { text: text(metric.value), style: metric.primary ? "primaryMetricValue" : "metricValue" },
        metric.note ? { text: text(metric.note), style: "cardNote" } : null,
      ].filter(Boolean),
      margin: [7, 4, 7, 5],
      fillColor: metric.primary ? "#f4fbf7" : "#ffffff",
    };
  }

  function buildMetricTable(metrics) {
    const body = [];
    let pending = null;

    metrics.forEach((metric) => {
      const normalized = metric || {};
      if (normalized.primary) {
        if (pending) {
          body.push([metricCell(pending), {}]);
          pending = null;
        }
        body.push([{ ...metricCell(normalized), colSpan: 2 }, {}]);
        return;
      }
      if (pending) {
        body.push([metricCell(pending), metricCell(normalized)]);
        pending = null;
      } else {
        pending = normalized;
      }
    });

    if (pending) body.push([metricCell(pending), {}]);
    if (!body.length) return null;

    return {
      table: {
        widths: ["*", "*"],
        body,
        dontBreakRows: true,
      },
      layout: {
        hLineColor: () => "#cfd6d2",
        vLineColor: () => "#cfd6d2",
        hLineWidth: () => 0.7,
        vLineWidth: () => 0.7,
        paddingLeft: () => 0,
        paddingRight: () => 0,
        paddingTop: () => 0,
        paddingBottom: () => 0,
      },
      margin: [0, 0, 0, 10],
    };
  }

  function comparisonCell(comparison) {
    return {
      stack: [
        { text: text(comparison.label), style: "cardLabel" },
        { text: text(comparison.value), style: "comparisonValue" },
        comparison.assumption ? { text: text(comparison.assumption), style: "assumption" } : null,
      ].filter(Boolean),
      margin: [7, 4, 7, 5],
    };
  }

  function buildComparisonTable(comparisons) {
    const body = [];
    for (let index = 0; index < comparisons.length; index += 2) {
      body.push([
        comparisonCell(comparisons[index] || {}),
        comparisons[index + 1] ? comparisonCell(comparisons[index + 1]) : {},
      ]);
    }
    if (!body.length) return null;
    return {
      table: { widths: ["*", "*"], body, dontBreakRows: true },
      layout: {
        hLineColor: () => "#cfd6d2",
        vLineColor: () => "#cfd6d2",
        hLineWidth: () => 0.7,
        vLineWidth: () => 0.7,
      },
      margin: [0, 0, 0, 10],
    };
  }

  function evidenceValue(row) {
    const value = { text: text(row.value), style: "evidenceValue" };
    if (row.href) {
      value.link = text(row.href);
      value.color = "#137d4a";
      value.decoration = "underline";
    }
    return value;
  }

  function buildEvidenceTable(rows) {
    if (!rows.length) return null;
    return {
      table: {
        widths: [122, "*"],
        body: rows.map((row) => [
          { text: text(row.label), style: "evidenceLabel", margin: [6, 5, 6, 5] },
          { ...evidenceValue(row), margin: [6, 5, 6, 5] },
        ]),
        dontBreakRows: true,
      },
      layout: {
        hLineColor: () => "#d9dfdc",
        vLineColor: () => "#d9dfdc",
        hLineWidth: () => 0.6,
        vLineWidth: () => 0.6,
      },
      margin: [0, 0, 0, 12],
    };
  }

  function callout(value, style = "boundary") {
    if (!value) return null;
    return {
      table: {
        widths: ["*"],
        body: [[{ text: text(value), style, margin: [9, 8, 9, 8] }]],
      },
      layout: {
        hLineColor: () => "#cfd6d2",
        vLineColor: () => "#cfd6d2",
        hLineWidth: () => 0.7,
        vLineWidth: () => 0.7,
      },
      margin: [0, 0, 0, 14],
    };
  }

  function buildDocumentDefinition(model = {}) {
    const sourceEvidence = model.sourceEvidence || {};
    const truthBoundary = model.truthBoundary || {};
    const metrics = Array.isArray(model.metrics) ? model.metrics : [];
    const comparisons = Array.isArray(model.comparisons) ? model.comparisons : [];
    const evidenceRows = Array.isArray(sourceEvidence.rows) ? sourceEvidence.rows : [];
    const generatedLine = compact([
      model.generatedLabel && `${text(model.generatedLabel)}:`,
      model.generatedAt,
    ]).join(" ");
    const statusLine = compact([
      model.statusLabel && `${text(model.statusLabel)}:`,
      model.status,
    ]).join(" ");
    const fontFamily = text(model.fontFamily, "Roboto");

    const content = compact([
      model.kicker ? { text: text(model.kicker), style: "kicker" } : null,
      { text: text(model.title, "AI Labour Power Budget"), style: "title" },
      model.lead ? { text: text(model.lead), style: "lead" } : null,
      callout(model.energyBoundary),
      buildMetricTable(metrics),
      comparisons.length && model.comparisonsTitle
        ? { text: text(model.comparisonsTitle), style: "sectionTitle" }
        : null,
      buildComparisonTable(comparisons),
      {
        text: text(sourceEvidence.title, "Source evidence"),
        style: "sectionTitle",
      },
      buildEvidenceTable(evidenceRows),
      callout(sourceEvidence.candidateBoundary, "candidateBoundary"),
      truthBoundary.title ? { text: text(truthBoundary.title), style: "sectionTitle" } : null,
      truthBoundary.text ? { text: text(truthBoundary.text), style: "truthText" } : null,
      generatedLine || statusLine
        ? {
            table: {
              widths: ["*"],
              body: compact([
                generatedLine ? [{ text: generatedLine, style: "statusLine" }] : null,
                statusLine ? [{ text: statusLine, style: "statusLine" }] : null,
              ]),
            },
            layout: "noBorders",
            margin: [0, 14, 0, 0],
          }
        : null,
    ]);

    return {
      pageSize: "A4",
      pageMargins: [36, 36, 36, 34],
      info: {
        title: text(model.documentTitle || model.title, "AI Labour Power Budget report"),
        author: text(model.author, "Hedegreen Research"),
        subject: text(model.subject, "AI Labour Power Budget energy-equivalent scenario report"),
        keywords: text(model.keywords, "AI labour power budget, energy-equivalent scenario, public review"),
        creator: "AI Labour Power Budget",
        producer: "pdfmake",
      },
      language: text(model.locale, "en"),
      defaultStyle: {
        font: fontFamily,
        fontSize: 9.5,
        lineHeight: 1.25,
        color: "#151817",
      },
      styles: {
        kicker: { font: fontFamily, fontSize: 7.5, bold: true, color: "#137d4a", characterSpacing: 0.8, margin: [0, 0, 0, 7] },
        title: { font: fontFamily, fontSize: 22, bold: true, lineHeight: 1.05, margin: [0, 0, 0, 9] },
        lead: { font: fontFamily, fontSize: 12, lineHeight: 1.25, margin: [0, 0, 0, 10] },
        boundary: { font: fontFamily, fontSize: 9, color: "#535a57" },
        sectionTitle: { font: fontFamily, fontSize: 11.5, bold: true, color: "#151817", margin: [0, 8, 0, 6] },
        cardLabel: { font: fontFamily, fontSize: 7, bold: true, color: "#5d6662", characterSpacing: 0.6 },
        metricValue: { font: fontFamily, fontSize: 13, bold: true, margin: [0, 4, 0, 0] },
        primaryMetricValue: { font: fontFamily, fontSize: 24, bold: true, color: "#137d4a", margin: [0, 4, 0, 0] },
        cardNote: { font: fontFamily, fontSize: 7.5, color: "#5d6662", margin: [0, 4, 0, 0] },
        comparisonValue: { font: fontFamily, fontSize: 13, bold: true, color: "#8a5b00", margin: [0, 4, 0, 0] },
        assumption: { font: fontFamily, fontSize: 8, color: "#6a5940", margin: [0, 4, 0, 0] },
        evidenceLabel: { font: fontFamily, fontSize: 7.5, bold: true, color: "#5d6662" },
        evidenceValue: { font: fontFamily, fontSize: 8.5 },
        candidateBoundary: { font: fontFamily, fontSize: 9, bold: true, color: "#704d00" },
        truthText: { font: fontFamily, fontSize: 9.5, lineHeight: 1.35, margin: [0, 0, 0, 8] },
        statusLine: { font: fontFamily, fontSize: 7.5, color: "#5d6662", margin: [0, 2, 0, 0] },
        footer: { font: fontFamily, fontSize: 7, color: "#68706c" },
      },
      content,
      footer(currentPage, pageCount) {
        return {
          margin: [36, 0, 36, 12],
          columns: [
            { text: text(model.footer), style: "footer" },
            { text: `${currentPage} / ${pageCount}`, style: "footer", alignment: "right" },
          ],
        };
      },
    };
  }

  function asPdfBlob(blob) {
    if (blob && blob.type === PDF_MIME_TYPE) return Promise.resolve(blob);
    const BlobConstructor = root && root.Blob;
    if (typeof BlobConstructor !== "function") {
      return Promise.reject(new Error("Blob is unavailable; cannot guarantee a PDF download MIME type."));
    }
    if (blob && typeof blob.arrayBuffer === "function") {
      return Promise.resolve(blob.arrayBuffer()).then(
        (buffer) => new BlobConstructor([buffer], { type: PDF_MIME_TYPE })
      );
    }
    return Promise.resolve(new BlobConstructor([blob || ""], { type: PDF_MIME_TYPE }));
  }

  function createPdfBlob(model, suppliedPdfMake) {
    const engine = suppliedPdfMake || (root && root.pdfMake);
    if (!engine || typeof engine.createPdf !== "function") {
      return Promise.reject(new Error("pdfMake is required to create the PDF report."));
    }
    const definition = buildDocumentDefinition(model);
    return new Promise((resolve, reject) => {
      try {
        const document = engine.createPdf(definition);
        if (!document || typeof document.getBlob !== "function") {
          reject(new Error("pdfMake.createPdf() did not return a getBlob-capable document."));
          return;
        }
        document.getBlob((blob) => {
          asPdfBlob(blob).then(resolve, reject);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  function sanitizeFilename(filename) {
    let basename = text(filename, DEFAULT_FILENAME).trim().replace(/\.pdf$/i, "");
    if (typeof basename.normalize === "function") {
      basename = basename.normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
    }
    basename = basename
      .replace(/[\u0000-\u001f\u007f<>:"/\\|?*]/g, "-")
      .replace(/\.+/g, "-")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^[\s.-]+|[\s.-]+$/g, "")
      .slice(0, 120)
      .replace(/[\s.-]+$/g, "");
    return `${basename || "ai-labour-power-budget-report"}.pdf`;
  }

  function downloadBlob(blob, filename, env) {
    const target = env || root;
    const document = target && target.document;
    const urlApi = target && target.URL;
    if (!document || typeof document.createElement !== "function" || !urlApi || typeof urlApi.createObjectURL !== "function") {
      throw new Error("A browser document and URL API are required to download the PDF report.");
    }

    const safeFilename = sanitizeFilename(filename);
    const blobUrl = urlApi.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = blobUrl;
    anchor.download = safeFilename;
    anchor.hidden = true;
    if (anchor.style) anchor.style.display = "none";
    if (typeof anchor.setAttribute === "function") anchor.setAttribute("aria-hidden", "true");
    const parent = document.body || document.documentElement;

    try {
      if (parent && typeof parent.appendChild === "function") parent.appendChild(anchor);
      if (typeof anchor.click !== "function") throw new Error("The browser cannot start the PDF download.");
      anchor.click();
    } finally {
      if (typeof anchor.remove === "function") anchor.remove();
      else if (parent && typeof parent.removeChild === "function") parent.removeChild(anchor);

      const revoke = () => urlApi.revokeObjectURL(blobUrl);
      const schedule = target.setTimeout || (root && root.setTimeout);
      if (typeof schedule === "function") schedule(revoke, 1000);
      else revoke();
    }

    return safeFilename;
  }

  async function downloadReport(model, options = {}) {
    const blob = await createPdfBlob(model, options.pdfMake);
    const filename = downloadBlob(blob, options.filename || model.filename, options.env);
    return { blob, filename };
  }

  return {
    buildDocumentDefinition,
    createPdfBlob,
    downloadBlob,
    downloadReport,
  };
});
