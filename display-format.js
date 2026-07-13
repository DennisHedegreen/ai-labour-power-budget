(function attachDisplayFormat(globalScope) {
  "use strict";

  function formatPercent(value, locale = "en") {
    if (!Number.isFinite(value)) {
      throw new TypeError("value must be a finite number");
    }

    return new Intl.NumberFormat(locale, {
      style: "percent",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(value);
  }

  const api = { formatPercent };
  globalScope.AILabourPowerBudgetDisplayFormat = api;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(typeof window !== "undefined" ? window : globalThis);
