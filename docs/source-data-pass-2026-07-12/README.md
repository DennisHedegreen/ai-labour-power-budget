# AI Labour Power Budget Source Data Workpack

Date: 2026-07-12
Status: workpack for external AI/source review
Tool status: private prototype, not public release

## Purpose

This workpack is for building the next data layer for the AI Labour Power Budget
tool with ChatGPT or another research assistant.

The translation layer is already EU24-ready. This workpack is only about
electricity-use source data.

## Work To Do

1. Define the source standard for annual electricity use.
2. Produce EU27 country records with source evidence.
3. Produce USA national and USA state records with source evidence.
4. Return normalized JSON that can be reviewed before it is imported into the
   local prototype.

## Do Not Do

- Do not change the UI.
- Do not change calculations.
- Do not invent values.
- Do not use Wikipedia as the data source.
- Do not mix electricity generation, installed capacity, and final use.
- Do not claim spare electricity or grid capacity.

## Recommended Standard

Use annual electricity sold/used by final customers or ultimate customers,
measured in TWh/year.

This is the closest match to the tool question:

How large a share of current national electricity use would this scenario use?

## Files

- `CHATGPT-SOURCE-PASS-PROMPT.md`: copy-paste prompt for ChatGPT.
- `SOURCE-POLICY.md`: source and definition rules.
- `DATA-SCHEMA-V1.md`: target JSON schema.
- `OUTPUT-TEMPLATES.md`: exact output formats to request.
- `TASKS.md`: staged task list.
- `candidate-data/README.md`: where returned JSON candidates should go.
- `reference/current-countries.demo.json`: current local demo data.
- `reference/current-eu27-shell.json`: current EU rack shell.
- `reference/current-data-contract.md`: current app data contract.

## Integration Rule

Anything returned by ChatGPT is a candidate until it passes:

1. Source review.
2. JSON validation.
3. Data-contract tests.
4. Manual sanity checks against known national totals.

Do not overwrite `data/countries.json`
directly from AI output.
