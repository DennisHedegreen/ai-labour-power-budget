# Next Implementation Note

Date: 2026-07-12

Supersession note: later on 2026-07-12 the EU27 candidate file was refreshed
directly from the Eurostat API and the gate moved to
`source_value_check_passed_candidate_not_promoted`. Keep the original blocked
language below as handoff history; use `data/source-candidates/promotion-gate-summary.json`
for current status.

## Current State

The source-data handoff is now preserved inside the prototype as a review-only
source layer:

- `data/source-candidates/eu27-electricity-use.candidate.json`
- `data/source-candidates/us-national-electricity-use.candidate.json`
- `data/source-candidates/us-states-electricity-use.candidate.json`
- `data/source-candidates/promotion-gate-summary.json`
- `data/source-definitions.json`

These files are not runtime imports. `data/countries.json` still contains the
demo placeholder records.

## Gate Decision

Do not import source candidates into runtime data yet.

- EU27 remains blocked. Direct Eurostat `nrg_cb_e / FC / E7000 / GWH / 2023`
  comparison mismatched all 27 candidate records.
- U.S. national and state records pass the direct EIA workbook value check, but
  they remain candidates because the metric is EIA retail sales to ultimate
  customers, excluding direct use.

## Semantic Rule

The public-facing denominator must be source-specific.

Do not say generic "electricity use" for the U.S. candidate unless the metric is
redesigned. Prefer:

> annual retail electricity sales

For all report output, keep the scenario language:

> equivalent yearly energy budget for configured AI-worker profiles

Do not use wording that implies spare grid capacity, installed capacity, or a
deployment prediction.

## Validation

Run:

```bash
node scripts/validate-source-layer.js
node tests/source-layer.test.js
node tests/data-contract.test.js
node tests/calculation.test.js
```

Current result: all pass.

## Recommended Next Work

1. Decide runtime mode names:
   - EU mode after Eurostat definition is resolved.
   - U.S. mode as "retail sales" unless direct-use is added.
2. Build a reviewed import adapter that emits runtime-shaped records only when
   `runtime_import_authorized` is explicitly true.
3. Rebuild the EU27 source pass against the selected Eurostat definition.
4. Add GitHub README structure for public review of source policy, source
   candidates, validation scripts, and promotion gates.
