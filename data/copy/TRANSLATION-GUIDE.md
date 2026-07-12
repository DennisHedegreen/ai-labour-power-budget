# AI Labour Power Budget Translation Guide

Use this guide when creating or reviewing a new `copy/{language}.json` file.

## Hard Rules

- Keep every JSON key exactly the same as `en.json`.
- Translate only string values.
- Do not add, remove, rename, or reorder keys unless explicitly asked.
- Preserve every `{placeholder}` token exactly.
- Preserve JSON validity.
- Do not translate units such as `W`, `GW`, `TWh/year`, `MWh/year`, `kWh/day`, and `h/week` unless the target language has a very strong convention.
- Keep numbers out of the copy unless they already exist as reference assumptions.

## Meaning Rules

This tool shows an energy-equivalent scenario.

It does not claim:

- the country has spare electricity
- the grid can actually allocate this power
- AI-workers are real deployed workers
- jobs will be lost
- 100% electricity allocation is plausible

Translate these ideas conservatively:

- `Equivalent AI-worker profiles`
- `energy-equivalent scenario capacity`
- `not spare grid capacity`
- `not a deployment prediction`
- `scenario settings, not a prediction`
- `truth boundary`

If a literal translation sounds too strong, use a more careful phrase.

## Preferred Vocabulary

`AI-worker profile` means a configured energy profile, not a person and not a real autonomous employee.

`Electricity allocation` means a share of annual national electricity use.

`Scenario capacity` means the number of configured profiles that fit inside that energy budget.

`Calculation basis` means the transparent formula used for the report number.

## Template Rules

Templates must preserve placeholders:

```json
"allocationSentenceTemplate": "Allocating {share} of {countryName}'s annual electricity use to this scenario would provide an equivalent yearly energy budget for {profiles} configured AI-worker profiles."
```

The translated sentence must still include:

- `{share}`
- `{countryName}`
- `{profiles}`

The same rule applies to every template:

- `allocationSentenceTemplate`
- `comparisonSentenceTemplate`
- `allocationLabelTemplate`
- `shareCapacityLabelTemplate`
- `calculationBasisTemplate`

## Review Checklist

Before handing back a translation:

- JSON parses.
- All keys from `en.json` are present.
- No new keys were invented.
- All placeholders are unchanged.
- The main report sentence does not sound like spare electricity exists.
- The truth-boundary text is still clear.
- 100% allocation is still labelled as a thought experiment.

