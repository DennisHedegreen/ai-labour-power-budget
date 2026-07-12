# Data Readiness

Date: 2026-07-12

This project is not runtime-data ready.

The app can be reviewed publicly as a prototype, but the country electricity
denominators must not be presented as verified runtime data yet.

## Current Runtime Data

Runtime file:

`data/countries.json`

Current status:

- 3 demo records.
- All runtime records are labelled `demo_not_verified`.
- These values are only placeholders for interface and calculation review.

## Source Candidate Status

Candidate files:

- `data/source-candidates/eu27-electricity-use.candidate.json`
- `data/source-candidates/us-national-electricity-use.candidate.json`
- `data/source-candidates/us-states-electricity-use.candidate.json`
- `data/source-candidates/promotion-gate-summary.json`

Current gate:

- Runtime import authorized: no.
- Live import authorized: no.

The interface may load source candidates in review mode so the source boundary,
denominator wording, and layout can be inspected. That is not a promotion into
verified runtime data.

### EU27

Status: source value checked, candidate not promoted.

Reason:

The candidate uses Eurostat `nrg_cb_e` annual final consumption (`FC`) of
electricity (`E7000`) in GWh for 2023, converted to TWh/year. It is an official
source extraction, but it remains candidate data until the promotion gate is
explicitly opened.

### United States National

Status: source value checked, candidate not promoted.

Reason:

The candidate uses EIA retail electricity sales to ultimate customers. This is a
valid official denominator candidate, but it excludes direct use. Public copy
must not call it generic "electricity use" unless the metric is redesigned.

### United States States and DC

Status: source value checked, candidate not promoted.

Reason:

The same EIA retail-sales boundary applies to all state/DC records. These can
support source review, but not runtime import yet.

## Jurisdiction Mode Status

- EU: selectable `source_candidate` records from Eurostat final-consumption
  candidate files; not verified promoted runtime data.
- USA: selectable `source_candidate` records from EIA retail-sales candidate
  files; not verified primary-source runtime data.
- World: placeholder mode only; no source definition selected.

## Required Before Promotion

1. Review whether the EU27 Eurostat final-consumption denominator is the right
   denominator before promotion.
2. Decide whether the US metric remains "annual retail electricity sales" or is
   redesigned to include direct use.
3. Add a promotion adapter that refuses to write runtime data unless the source
   gate explicitly authorizes it.
4. Preserve source-specific denominator wording in the app and report output.
5. Re-run:

```bash
npm run check
npm run source:status
```

## Review Command

Use:

```bash
npm run source:status
```

For machine-readable output:

```bash
node scripts/source-status.js --json
```

The command intentionally reports "not ready" until the source gate changes.
