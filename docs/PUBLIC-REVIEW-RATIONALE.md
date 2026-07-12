# Public Review Rationale

This repository is public so the method can be inspected before the tool makes
stronger claims.

AI Labour Power Budget deals with numbers that are easy to overstate:
electricity use, national-scale allocation, configured AI-worker profiles, and
reference comparisons. Keeping the prototype and its source gates visible makes
the weak points reviewable instead of hiding them inside a polished interface.

## What Public Review Should Check

- Whether the tool's wording preserves the scenario boundary.
- Whether source candidates are clearly separated from runtime data.
- Whether the U.S. EIA retail-sales denominator is labelled honestly.
- Whether the EU27 Eurostat mismatch remains blocked until resolved.
- Whether translations preserve the meaning instead of turning the scenario
  into a claim about spare electricity or real deployment.
- Whether the calculation model is simple enough to audit.

## What Public Does Not Mean

Public does not mean the prototype is finished.

Public does not mean the source candidates are promoted.

Public does not mean the demo values are verified national data.

Public does not grant permission to reuse or redeploy the work. The repository
is published for review and inspection under an all-rights-reserved boundary.

## Current Boundary

The runtime app still uses demo-labelled country values. The reviewable source
layer exists so people can inspect why candidate values have not simply been
copied into the app.

The goal is to make the instrument more trustworthy before it becomes more
visible.

