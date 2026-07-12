# AI Labour Power Budget

Static Hedegreen Research prototype for testing how configured AI-worker energy
profiles compare with a country's annual electricity-denominator scenario.

Status: prototype. Runtime country values are still demo placeholders.

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

Runtime app data:

- `data/countries.json` contains demo placeholder records.
- Demo values must remain visibly labelled until replaced.

Source candidate data:

- EU27 candidate is blocked after direct Eurostat mismatch.
- U.S. national and U.S. state values passed direct EIA workbook value checks.
- U.S. values remain candidate-only because they are EIA retail sales to
  ultimate customers and exclude direct use.

The source gate is intentionally strict. Candidate values are not imported into
runtime just because the files exist.

Read:

- `data/README.md`
- `data/source-candidates/README.md`
- `docs/source-data-pass-2026-07-12/PROMOTION-GATE-REVIEW-2026-07-12.md`
- `docs/ROADMAP.md`
- `docs/PUBLICATION-CHECKLIST.md`

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
