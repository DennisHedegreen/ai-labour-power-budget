# Publication Checklist

Use this before making the repository public or linking it from Hedegreen
Research.

## Repository

- `npm run check` passes.
- `git status --short` is clean.
- No raw `.xlsx` or `.zip` source artifacts are committed.
- No local machine paths are present.
- `docs/PUBLIC-REVIEW-RATIONALE.md` explains why the repo is public.
- License boundary is intentional.
- GitHub Actions status is understood. Current token cannot push workflow files.

## Source Data

- `data/source-definitions.json` says whether runtime import is authorized.
- `data/source-candidates/promotion-gate-summary.json` is current.
- EU27 is not promoted while the Eurostat mismatch remains unresolved.
- U.S. values are not described as all electricity use if the retail-sales
  metric remains in use.

## Product Language

- "Supported AI-workers" is avoided where it sounds like real deployment.
- Preferred wording remains "equivalent AI-worker profiles" or "scenario
  capacity".
- Report copy does not imply spare grid capacity.
- 100% allocation is framed as a thought experiment.

## Site Integration

- Test standalone at `http://127.0.0.1:8797/`.
- Test GitHub Pages at `https://dennishedegreen.github.io/ai-labour-power-budget/` if enabled.
- Test inside the future Hedegreen Research TID shell.
- Test desktop and compact layouts.
- Confirm page 4 can scroll.
