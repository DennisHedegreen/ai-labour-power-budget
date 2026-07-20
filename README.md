# AI Labour Power Budget

Static Hedegreen Research prototype for testing how configured AI-worker energy
profiles compare with a country's annual electricity-denominator scenario.

Status: public-review prototype. EU, U.S., and World calculations run explicitly
in `source_candidate_review` mode; those values are not promoted or verified
runtime data. Demo placeholders remain separate.

## Why This Repository Is Public

This repository is public for method and source review before the tool makes
stronger claims. The important parts are intentionally visible: calculation
logic, source gates, translation files, and the unresolved data boundaries.

Read: `docs/PUBLIC-REVIEW-RATIONALE.md`

## What It Is

The tool is a scenario instrument. It calculates an energy-equivalent yearly
budget for configured AI-worker profiles.

It does not claim:

- that a country has spare electricity
- that grid capacity is available
- that AI-workers are concrete deployed employees
- that the result predicts job loss
- that 100% allocation is plausible

Preferred framing:

> equivalent yearly energy budget for configured AI-worker profiles

## Run

```bash
npm run start
```

Open:

```text
http://127.0.0.1:8797/
```

The app has no backend. It loads local JSON files from `data/`.

## Public Demo

The GitHub Pages demo, when enabled, is a public review surface rather than a
finished release:

```text
https://dennishedegreen.github.io/ai-labour-power-budget/
```

Read: `docs/DEPLOYMENT.md`

## Verify

```bash
npm run check
```

Individual checks:

```bash
node tests/calculation.test.js
node tests/data-contract.test.js
node tests/source-layer.test.js
node scripts/validate-source-layer.js
node scripts/source-status.js
```

## Repository Structure

```text
.
├── app.js
├── calculate.js
├── data.js
├── index.html
├── styles.css
├── assets/
├── data/
│   ├── countries.json
│   ├── source-definitions.json
│   ├── source-candidates/
│   └── copy/
├── docs/
│   └── source-data-pass-2026-07-12/
├── scripts/
└── tests/
```

## Data Status

Explicit data modes:

- `demo`: unverified placeholders for interface testing only.
- `source_candidate_review`: candidate values may be used in review
  calculations, with source evidence and candidate-not-promoted labels.
- `promoted_runtime`: blocked unless the explicit source promotion gate opens.

Runtime app data:

- `data/countries.json` contains separate demo placeholder records.
- Demo values are not mixed with source-candidate review calculations.

Jurisdiction modes:

- `EU` loads Eurostat candidate records from `data/source-candidates/` for
  review mode only, with the denominator labelled as annual final electricity
  consumption.
- `USA` loads EIA candidate records from `data/source-candidates/` for review
  mode only, with the denominator labelled as annual retail electricity sales.
- `World` loads the official UNSD 2023 Energy Statistics Yearbook World total
  plus selected non-EU country denominators for review mode only, with the
  denominator labelled as annual final electricity consumption.

Source candidate data:

- EU27 candidate values are refreshed from the official Eurostat API and remain
  candidate-only until explicitly promoted.
- U.S. national and U.S. state values passed direct EIA workbook value checks.
- U.S. values remain candidate-only because they are EIA retail sales to
  ultimate customers and exclude direct use.
- The World candidate dataset uses UNSD Table 34 total-final-consumption
  electricity values for 2023. World is 25,539,798 GWh, converted to
  25,539.798 TWh/year. UK is 269,086 GWh, converted to 269.086 TWh/year. These
  remain candidate-only and are not promoted runtime data.

The source gate is intentionally strict. Candidate values are not imported into
runtime just because the files exist.

Read:

- `data/README.md`
- `data/source-candidates/README.md`
- `docs/DATA-READINESS.md`
- `docs/source-data-pass-2026-07-12/PROMOTION-GATE-REVIEW-2026-07-12.md`
- `docs/ROADMAP.md`
- `docs/PUBLICATION-CHECKLIST.md`

Quick source-status command:

```bash
npm run source:status
node scripts/source-status.js --json
```

## Localization

Language files live in `data/copy/`.

Read:

- `data/copy/TRANSLATION-GUIDE.md`
- `data/copy/TRANSLATION-PROMPT.md`

The translation contract is part of the product contract: wording must preserve
the scenario boundary.

## Review Workflow

Start with `REVIEW.md` for manual review.

GitHub issue templates are provided for:

- source-data review
- product/UI review
- language/localization review

Pull requests should use the included template and report the result of:

```bash
npm run check
```

## License

All rights reserved. This repository is available for review and inspection, not
for redistribution or derivative deployment.
