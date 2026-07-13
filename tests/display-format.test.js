const assert = require("node:assert/strict");
const { formatPercent } = require("../display-format.js");

assert.equal(formatPercent(0.01, "en-GB"), "1%");
assert.equal(formatPercent(0.1, "en-GB"), "10%");
assert.equal(formatPercent(1, "en-GB"), "100%");

assert.equal(
  formatPercent(0.01363573, "en-GB"),
  "1.36%",
  "target-driven shares must retain enough display precision to be recomputed"
);
assert.equal(formatPercent(0.0005, "en-GB"), "0.05%");
assert.equal(formatPercent(0, "en-GB"), "0%");
assert.equal(formatPercent(0.01363573, "da-DK").replace(/\s/g, " "), "1,36 %");

assert.throws(() => formatPercent(Number.NaN, "en-GB"), /finite number/);
assert.throws(() => formatPercent(Number.POSITIVE_INFINITY, "en-GB"), /finite number/);

console.log("AI Labour Power Budget display-format tests passed");
