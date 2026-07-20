# AI Labour Power Budget Data Contract

This folder is the reviewable local data snapshot for the private prototype.
The app should treat these files as input data, not application logic.

## Files

- `countries.json`: country electricity-budget records.
- `eu27-shell.json`: country rack layout and labels.
- `worker-profiles.json`: watt, runtime, and overhead scenario options.
- `electricity-allocation-profiles.json`: national electricity allocation presets.
- `comparison-assumptions.json`: reference assumptions for report comparisons.
- `source-definitions.json`: source-specific denominator definitions and import gate.
- `source-candidates/`: reviewed candidate datasets available only to the
  explicit `source_candidate_review` calculation mode; they are not promoted or
  verified runtime data.
- `copy/languages.json`: language manifest used by the loader and tests.
- `copy/*.json`: controlled UI and report copy by language.

## Country Fields

- `code`: ISO-like country code used by the UI.
- `name`: English display name.
- `local_name`: local display name used in local-language mode.
- `local_language`: copy file key, for example `da`, `de`, or `sv`.
- `local_language_label`: label shown on the language toggle.
- `population`: rough population field, not currently used in calculation.
- `annual_electricity_twh`: annual electricity use in TWh/year.
- `electricity_per_capita_kwh_year`: derived/reference field for review only.
- `source_name`: source label for the electricity figure.
- `source_url`: URL for the source record, or `null` for demo placeholders.
- `source_year`: source year, or `DEMO` for placeholders.
- `source_status`: data confidence/status. Current placeholder value is `demo_not_verified`.
- `retrieved_at`: ISO date/time when the source was retrieved, or `null`.
- `notes`: reviewer notes and replacement instructions.

## Energy vs Load

`annual_electricity_twh` is annual energy. It is not power capacity.
The UI derives average continuous load in GW by spreading annual TWh across a year.

Use precise wording:

- electricity allocation = share of annual national electricity use
- equivalent AI-worker profiles = energy-equivalent scenario profiles
- not spare grid capacity
- not a deployment or job-loss prediction

## Source Metrics

Different source systems do not always use the same electricity denominator.
Do not flatten them into one generic phrase unless the source metric has been
reviewed and promoted.

Current source definitions:

- EU27 candidate: Eurostat annual final electricity consumption. Status:
  source-value checked, not promoted. Includes a local `EU27` aggregate computed
  from the 27 reviewed member records.
- U.S. candidate: EIA retail sales to ultimate customers. Status:
  source-value checked, not promoted. This excludes direct use.
- World candidate dataset: UNSD Energy Statistics Yearbook 2023 Table 34 total
  final consumption of electricity. Status: source-value checked, not
  promoted. Includes the World global total plus selected non-EU country
  denominators such as UK.

Use the source-specific labels in `source-definitions.json` before adding any
new public-facing region mode.

## Source-Pass Rule

A country record is not source-ready until `source_name`, `source_url`,
`source_year`, `retrieved_at`, and `source_status` have been reviewed.

Do not replace demo placeholders silently. Update `notes` when changing a value.

Candidate data may live in `source-candidates/`, but it must not be copied into
`countries.json` until the import gate is explicitly opened and the UI copy has
the right denominator label.

## Copy Rule

Copy files use string templates with `{placeholder}` tokens.
Do not move truth-boundary claims into code. Keep them reviewable here.

Add new languages through `copy/languages.json`, then add a matching
`copy/{language}.json` file with the exact same keys as `copy/en.json`.
See `copy/TRANSLATION-GUIDE.md` before translating.
