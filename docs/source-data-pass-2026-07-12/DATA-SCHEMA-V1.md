# Data Schema V1

The current app already reads a simpler country schema. This workpack defines
the next review schema. The app can later be adapted to read the extended fields.

## Jurisdiction Record

```json
{
  "code": "DK",
  "name": "Denmark",
  "local_name": "Danmark",
  "local_language": "da",
  "local_language_label": "Dansk",
  "jurisdiction_type": "country",
  "parent": "EU",
  "population": null,
  "annual_electricity_twh": 35.0,
  "electricity_per_capita_kwh_year": null,
  "source_name": "Demo placeholder",
  "source_dataset": null,
  "source_series": null,
  "source_url": null,
  "source_year": "DEMO",
  "source_retrieved_at": null,
  "source_status": "demo_not_verified",
  "definition": "annual electricity sold/used by final customers or ultimate customers",
  "unit_original": null,
  "conversion_note": null,
  "review_flags": [],
  "notes": "Approximate placeholder for local testing only."
}
```

## Field Rules

- `code`: unique UI code. EU country examples: `DK`, `DE`. USA states: `US-CA`
  or `CA` depending on the future UI mode. Prefer `US-CA` for data uniqueness.
- `jurisdiction_type`: `country`, `us_state`, `region`, or `aggregate`.
- `parent`: `EU`, `US`, or another parent jurisdiction.
- `annual_electricity_twh`: numeric TWh/year.
- `source_year`: latest complete annual year.
- `source_retrieved_at`: ISO date, for example `2026-07-12`.
- `source_status`: see `SOURCE-POLICY.md`.
- `review_flags`: array of short machine-readable strings.

## Output Files

Expected candidate files:

- `eu27-electricity-use.candidate.json`
- `us-national-electricity-use.candidate.json`
- `us-states-electricity-use.candidate.json`

