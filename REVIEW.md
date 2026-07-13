# Review Guide

This prototype has two separate review surfaces:

1. Product and interface review.
2. Source-data and semantic-boundary review.

## Product Review

Run:

```bash
npm run start
```

Open:

```text
http://127.0.0.1:8797/
```

The interface is a static public-review prototype. EU, U.S., and World
calculations run in explicit `source_candidate_review` mode. Candidate values
are review inputs, not promoted or verified runtime data. Demo values remain a
separate mode.

Review questions:

- Does the flow make clear that the tool is a scenario instrument?
- Does the report avoid implying spare grid capacity?
- Does "AI-worker" read as a configured energy profile rather than a concrete
  deployed employee?
- Does the country/language interaction remain understandable without long
  explanatory copy?

## Source Review

Run:

```bash
npm run validate:source
```

Then read:

- `data/README.md`
- `data/source-definitions.json`
- `data/source-candidates/README.md`
- `docs/source-data-pass-2026-07-12/PROMOTION-GATE-REVIEW-2026-07-12.md`
- `docs/source-data-pass-2026-07-12/NEXT-IMPLEMENTATION-NOTE.md`

Current decision:

- EU27, U.S. national/state, and World values are source-value checked, but not
  promoted.
- The U.S. denominator remains retail electricity sales to ultimate customers
  and excludes direct use.
- Runtime promotion remains blocked; the interface may use candidate values only
  inside the visibly labelled source-candidate review mode.

## Language Review

Read:

- `data/copy/TRANSLATION-GUIDE.md`
- `data/copy/TRANSLATION-PROMPT.md`
- `data/copy/en.json`

Translation must preserve the semantic boundary. Do not translate the tool into
a claim about spare electricity, grid capacity, job loss, or real deployed AI
workers.
