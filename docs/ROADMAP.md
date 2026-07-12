# Roadmap

This roadmap separates source truth, product interface, and public release. Do
not merge the phases just to make the tool look more complete.

## Phase 1: Reviewable Prototype

Status: current.

- Static local app works without backend.
- Runtime country data remains demo-labelled.
- Source-candidate layer exists and is blocked from runtime import.
- UI copy is JSON-backed.
- 24 language files exist for review.
- Local checks pass through `npm run check`.

## Phase 2: Source Promotion

Required before real country data becomes runtime data:

- Resolve the EU27 source definition and rebuild the Eurostat extraction.
- Decide whether U.S. mode uses EIA retail sales or a redesigned metric that
  includes direct use.
- Add an import adapter that refuses to emit runtime data unless the source gate
  explicitly authorizes promotion.
- Preserve source-specific denominator labels in report copy.

## Phase 3: Product Hardening

- Test the tool inside the Hedegreen Research TID shell at smaller widths.
- Tighten page 3 and page 4 responsive behavior.
- Add calculation-basis disclosure for rounded values.
- Keep the instrument style, but avoid hiding important truth-boundary language.

## Phase 4: Public Review

- Decide whether to make this repository public.
- Add GitHub Actions once the GitHub token has `workflow` scope.
- Open source-review issues from the templates.
- Document exactly which source values are promoted and why.

## Phase 5: Public Release Candidate

- Replace demo runtime records only after source promotion.
- Re-run language review for final semantic wording.
- Re-test embedded TID shell presentation.
- Keep 100% allocation visibly marked as a thought experiment.

