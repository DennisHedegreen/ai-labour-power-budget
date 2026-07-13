# Source Candidate Layer

This folder stores reviewed source-pass candidate datasets. These files are not
runtime data.

Current gate status:

- EU27: source-value checked, not promoted. Candidate records are refreshed
  from the official Eurostat `nrg_cb_e` API using final consumption (`FC`) of
  electricity (`E7000`) for 2023.
- U.S. national: source-value check passed, but not promoted.
- U.S. states/DC: source-value check passed, but not promoted.
- World: source-value check passed against the official UNSD 2023 Energy
  Statistics Yearbook Table 34. The 25,539,798 GWh value is represented as
  25,539.798 TWh/year and remains not promoted.

Do not copy these records into `data/countries.json` until:

1. `source-definitions.json` has a runtime-approved metric definition.
2. The app copy uses the source-specific denominator label.
3. A promotion gate explicitly changes `runtime_import_authorized` to `true`.
4. The import adapter has been run and reviewed.

The important distinction is semantic, not just technical: these values are
annual energy denominators for scenario comparison. They are not spare grid
capacity, installed capacity, or predictions of deployment.
