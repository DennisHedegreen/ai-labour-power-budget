# Promotion Gate Review

Date: 2026-07-12
Reviewer: Codex local source pass

## Result

Do not import the candidate source data into the live prototype yet.

The workpack is valid as a candidate package. The U.S. source values now pass a
direct workbook recheck. The EU27 candidate remains blocked because the direct
Eurostat comparison does not match.

## Offline Workpack Validator

Command:

```bash
PYTHONPATH=/tmp/ai-labour-validation-deps python3 scripts/validate_workpack.py
```

Result:

```text
WORKPACK VALIDATION: PASS
```

Notes:

- Dependencies were installed only into `/tmp/ai-labour-validation-deps`.
- Candidate statuses remain `source_candidate`.
- The validator correctly treats external live-source refreshes as separate
  promotion gates.

## EU27 Direct Eurostat Check

The handoff requested:

```text
nrg_cb_e?freq=A&nrg_bal=FC_E&siec=E7000&unit=GWH&time=2023
```

That query returned no observations because `FC_E` is not a valid `nrg_bal`
code in `nrg_cb_e`.

The valid direct comparison query used:

```text
nrg_cb_e?freq=A&nrg_bal=FC&siec=E7000&unit=GWH&time=2023
```

Raw response saved at:

`review-output/eurostat-nrg_cb_e-FC-E7000-GWH-2023.json`

Comparison output saved at:

`review-output/eu27-eurostat-direct-comparison.json`

Result:

- 27 EU country records compared.
- 0 missing country observations.
- 27 mismatches.
- Maximum absolute difference: 19.911 TWh.

Examples:

- Denmark candidate: 30.413 TWh; Eurostat `nrg_cb_e/FC`: 31.651 TWh.
- Germany candidate: 453.586 TWh; Eurostat `nrg_cb_e/FC`: 473.497 TWh.
- France candidate: 399.487 TWh; Eurostat `nrg_cb_e/FC`: 407.334 TWh.

Decision:

EU27 candidate remains blocked. Do not remove:

- `official_api_refresh_required`
- `commit_pinned_transport_mirror`

The candidate may still be useful as a trace, but it is not source-promoted.

## U.S. EIA Workbook Check

Official workbook downloaded to:

`review-output/eia-HS861-2010-.xlsx`

Workbook source:

`https://www.eia.gov/electricity/data/state/xls/861/HS861%202010-.xlsx`

Parsed sheet:

`Total Electric Industry`

Filter:

- year: 2024
- column group: TOTAL
- measure: Sales
- unit: Megawatthours

Comparison output saved at:

`review-output/eia-2024-retail-sales-direct-comparison.json`

Result:

- 52 records checked: U.S. national row, 50 states, District of Columbia.
- 0 missing rows.
- 0 mismatches after rounding MWh to 0.001 TWh.

Decision:

U.S. candidate passes the direct source-value check.

However, the metric boundary must be preserved:

- EIA values are retail sales / sales delivered to ultimate customers.
- They exclude EIA direct use.
- The app must not label these values as all electricity use unless the metric
  is redesigned.

## Import Decision

Current status:

- EU27: blocked.
- U.S. national: source-value check passed, still candidate until metric-label
  and UI mode are designed.
- U.S. states/DC: source-value check passed, still candidate until metric-label
  and UI mode are designed.

Recommended next step:

1. Decide whether to keep separate source definitions:
   - EU: final electricity consumption.
   - U.S.: retail sales to ultimate customers.
2. If yes, update app copy/schema so the denominator label is source-specific.
3. Build an adapter that can load reviewed datasets without overwriting
   `data/countries.json` directly.
4. Rework the EU extraction around `nrg_cb_e/FC` or explicitly choose another
   Eurostat definition and document the difference.

