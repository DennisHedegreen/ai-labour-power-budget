# AI Labour Power Budget Translation Guide

Use this guide when creating or reviewing a new `copy/{language}.json` file.

## Hard Rules

- Keep every JSON key exactly the same as `en.json`.
- Translate only string values.
- Do not add, remove, rename, or reorder keys unless explicitly asked.
- Preserve every `{placeholder}` token exactly.
- Preserve JSON validity.
- Keep the distinction between annual values and the explicitly labelled average per calendar day. Translate `average kWh/calendar day` accurately; do not shorten it to an ambiguous `kWh/day`.
- Keep SI symbols such as `W`, `kWh`, `MWh`, `TWh`, and `GW` unchanged. Localize the time denominator in `unitTwhPerYear`, `unitMwhPerYear`, `unitKwhPerYear`, and `unitHoursPerWeek` using the target language's normal concise convention (for example, English `TWh/year` and Danish `TWh/år`).
- Keep numbers out of the copy unless they already exist as reference assumptions.
- Translate `downloadReport` as a concise direct PDF-download action. Do not mention printing or “save as PDF”.
- Keep `wind3` and `fullOutputAssumption` explicit that the result is an energy equivalent at continuous 3 MW nameplate output, not a realistic turbine-count claim.

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

`Electricity allocation` means a share of the active source denominator. Preserve `{denominator}` so EU final consumption and US retail sales are not collapsed into a generic metric.

`Scenario capacity` means the number of configured profiles that fit inside that energy budget.

`Calculation basis` means the transparent formula used for the report number.

## Template Rules

Templates must preserve placeholders:

```json
"allocationSentenceTemplate": "Allocating {share} of {countryName}'s {denominator} to this scenario would provide an equivalent yearly energy budget for {profiles} configured AI-worker profiles."
```

The translated sentence must still include:

- `{share}`
- `{countryName}`
- `{profiles}`
- `{denominator}`

The same rule applies to every template:

- `allocationSentenceTemplate`
- `comparisonSentenceTemplate`
- `allocationLabelTemplate`
- `shareCapacityLabelTemplate`
- `calculationBasisTemplate`
- `averageKwhCalendarDayValueTemplate`

## Review Checklist

Before handing back a translation:

- JSON parses.
- All keys from `en.json` are present.
- No new keys were invented.
- All placeholders are unchanged.
- Every string key and nested string path in `en.json` is present.
- The main report sentence does not sound like spare electricity exists.
- The truth-boundary text is still clear.
- 100% allocation is still labelled as a thought experiment.
