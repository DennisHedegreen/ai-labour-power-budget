# Codex Review Note

Date: 2026-07-12
Received package: `source-data-pass-2026-07-12-codex-handoff.zip`

## Local Status

The received handoff has been unpacked into:

`received/source-data-pass-2026-07-12-codex-handoff/`

It contains:

- EU27 candidate electricity-use data.
- U.S. national candidate electricity-use data.
- U.S. state/DC candidate electricity-use data.
- JSON schemas.
- validation script.
- source provenance and import plan.

## Current Decision

Do not import these records into the live prototype yet.

The package is useful and structurally coherent, but it explicitly marks itself:

`handoff-ready, not live-import-ready`

## Candidate Summary

EU27 candidate:

- 27 records.
- Year: 2023.
- Unit: TWh/year.
- Definition: annual final consumption of electricity for energy use.
- Sum of country records: about 2,330.980 TWh after per-record rounding.
- Main blocker: `official_api_refresh_required`.

U.S. national candidate:

- 1 record.
- Year: 2024.
- Unit: TWh/year.
- Definition: annual electricity sales delivered to ultimate customers.
- Value: 3,975.382 TWh.
- Main boundary: excludes EIA direct use.

U.S. state candidate:

- 51 records: 50 states plus District of Columbia.
- Year: 2024.
- Unit: TWh/year.
- Definition: annual electricity sales delivered to ultimate customers.
- Sum of rounded state/DC records: about 3,975.384 TWh.
- Main boundary: national value must use official U.S. row, not summed rounded states.

## Promotion Gates

Before any import:

1. Install or provide the validation dependency and run:

   ```bash
   python3 -m pip install -r requirements-validation.txt
   python3 scripts/validate_workpack.py
   ```

2. Refresh EU27 directly from Eurostat `nrg_cb_e`:

   ```text
   freq=A
   nrg_bal=FC_E
   siec=E7000
   unit=GWH
   time=2023
   ```

3. Compare all 27 EU country values against the candidate extraction trace.

4. Re-download the official EIA workbook and compare all 51 state/DC rows plus
   the official U.S. row.

5. Decide how the UI will label the denominator:

   - EU: final electricity consumption.
   - U.S.: retail sales to ultimate customers, excluding direct use.

6. Only after review, promote candidate files to reviewed files and import
   through an adapter. Do not overwrite app runtime data directly.

## Local Checks Already Run

No-dependency audit:

- EU27 records: 27.
- U.S. national records: 1.
- U.S. state/DC records: 51.
- All three candidate files parse as JSON.
- All values are positive numeric TWh/year.
- Candidate statuses remain `source_candidate`.

The received validator was not run yet because `jsonschema>=4.18,<5` is not
installed in the current environment.

