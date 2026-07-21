const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const css = fs.readFileSync(path.join(__dirname, "..", "styles.css"), "utf8");
const tabletStart = css.indexOf("@media (max-width: 880px)");
const phoneStart = css.indexOf("@media (max-width: 560px)");

assert(tabletStart >= 0, "missing 880px responsive breakpoint");
assert(phoneStart > tabletStart, "560px overrides must follow the 880px breakpoint");

const tabletCss = css.slice(tabletStart, phoneStart);
const phoneCss = css.slice(phoneStart);
const baseCss = css.slice(0, tabletStart);

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function ruleBody(cssText, selector) {
  const match = cssText.match(new RegExp(`(?:^|\\n)\\s*${escapeRegExp(selector)}\\s*\\{([^}]*)\\}`));
  assert(match, `missing responsive rule ${selector}`);
  return match[1];
}

function assertDeclarations(cssText, selector, declarations) {
  const body = ruleBody(cssText, selector);
  for (const declaration of declarations) {
    assert.match(body, declaration, `${selector} missing ${declaration}`);
  }
}

assertDeclarations(baseCss, ".driver-value", [
  /font-size:\s*clamp\(/,
  /white-space:\s*normal/,
  /overflow-wrap:\s*anywhere/,
]);
assertDeclarations(baseCss, ".equation-readout strong", [
  /font-size:\s*clamp\(/,
  /white-space:\s*normal/,
  /overflow-wrap:\s*anywhere/,
]);
assertDeclarations(baseCss, "#equation-profiles", [
  /font-size:\s*clamp\(/,
]);
assertDeclarations(baseCss, ".readout-item.is-numeric strong", [
  /font-size:\s*clamp\(/,
  /white-space:\s*normal/,
  /overflow-wrap:\s*anywhere/,
]);
assertDeclarations(baseCss, ".metric.is-primary strong", [
  /font-size:\s*clamp\(/,
  /white-space:\s*normal/,
  /overflow-wrap:\s*anywhere/,
]);

assertDeclarations(tabletCss, ".machine-panel-side", [
  /min-height:\s*auto/,
  /padding:\s*24px 20px/,
]);
assertDeclarations(tabletCss, ".machine-panel-side .panel-head", [
  /position:\s*relative/,
  /inset:\s*auto/,
  /min-height:\s*0/,
]);
assertDeclarations(tabletCss, ".machine-panel-side .control-grid", [
  /position:\s*relative/,
  /inset:\s*auto/,
  /grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\)/,
  /grid-template-rows:\s*auto auto/,
]);
assertDeclarations(tabletCss, ".machine-panel-side .readout-card", [
  /grid-column:\s*1 \/ -1/,
  /width:\s*100%/,
]);
assertDeclarations(tabletCss, ".machine-panel-side .action-row", [
  /position:\s*relative/,
  /right:\s*auto/,
  /bottom:\s*auto/,
]);
assertDeclarations(tabletCss, ".machine-panel-pressure .allocation-layout", [
  /grid-template-columns:\s*1fr/,
  /margin-top:\s*24px/,
]);
assertDeclarations(tabletCss, ".machine-panel-pressure .budget-preview", [
  /min-width:\s*0/,
]);
assertDeclarations(tabletCss, ".report-actions", [
  /flex-wrap:\s*wrap/,
  /justify-content:\s*flex-start/,
]);

assertDeclarations(phoneCss, ".machine-panel-side .control-grid", [
  /grid-template-columns:\s*1fr/,
]);
assertDeclarations(phoneCss, ".machine-panel-side .action-row .primary-button", [
  /width:\s*100%/,
]);
assertDeclarations(phoneCss, ".equation-readout", [
  /grid-template-columns:\s*1fr/,
]);
assertDeclarations(phoneCss, ".balance-equation .readout-list", [
  /grid-template-columns:\s*1fr/,
  /grid-auto-rows:\s*auto/,
]);

console.log("AI Labour Power Budget responsive CSS contract tests passed");
