# Source Policy

## Locked Tool Definition

The tool should use:

`annual electricity sold/used by final customers or ultimate customers`

Unit:

`TWh/year`

## Why This Definition

The user-facing question is:

How much of a country's or state's current annual electricity use would this
scenario require?

That is a consumption/allocation question, not a production or capacity
question.

## Acceptable Source Types

Preferred:

- National statistical office
- Eurostat
- U.S. Energy Information Administration (EIA)
- official government energy agencies
- transparent public datasets with methodology and downloadable tables

Avoid:

- Wikipedia
- unsourced summaries
- generation-only tables
- installed-capacity tables
- peak-load tables
- total energy across all fuels
- news articles as the primary source

## EU27 Source Target

Preferred source path:

- Eurostat electricity/final consumption table if extractable.

Fallback source path:

- A documented electricity data source with annual country consumption values,
  provided each record has source metadata and review notes.

## USA Source Target

Preferred source path:

- EIA electricity retail sales / sales to ultimate customers.
- Annual frequency.
- Total sector.
- State-level records.

## Conversion Rules

- MWh to TWh: divide by 1,000,000.
- GWh to TWh: divide by 1,000.
- kWh to TWh: divide by 1,000,000,000.

Keep enough precision for review. Do not hide rounding.

## Status Values

Use these source statuses:

- `demo_not_verified`: local placeholder only.
- `source_candidate`: AI/source-pass candidate, not accepted yet.
- `source_reviewed`: human/Codex source review passed.
- `verified_primary_source`: primary-source value accepted.
- `needs_review`: source ambiguity remains.

## Review Flags

Use `review_flags` for:

- provisional year
- unclear series definition
- generation vs consumption ambiguity
- missing sector filter
- missing unit
- value differs strongly from another official source

