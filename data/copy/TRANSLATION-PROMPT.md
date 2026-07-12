# Copy-Paste Translation Prompt

Use this prompt with ChatGPT or another translator.

```text
You are translating the UI copy for a private Hedegreen Research prototype called AI Labour Power Budget.

Task:
Translate the attached JSON file from English into TARGET_LANGUAGE.

Rules:
- Return only valid JSON.
- Keep every JSON key exactly the same.
- Translate only string values.
- Do not add, remove, rename, or reorder keys.
- Preserve every placeholder exactly, including braces: {share}, {countryName}, {profiles}, {twh}, {watts}, {hoursPerWeek}, {weeksPerYear}, {overhead}, {mwhYear}.
- Preserve units such as W, GW, TWh/year, MWh/year, kWh/day, and h/week unless the target language has a very strong standard convention.
- Keep "AI-worker profile" meaning as an energy/configuration profile, not a real employee.
- Do not make the tool sound like it predicts job loss.
- Do not make the tool sound like a country has spare electricity.
- Do not make "100% allocation" sound plausible; keep it as a thought experiment.

Semantic framing:
The tool calculates an energy-equivalent yearly budget for configured AI-worker profiles using a country's annual electricity use. It is not a grid-capacity claim, not a spare-electricity claim, and not a deployment prediction.

Quality check before replying:
- The JSON must parse.
- Every key from the source JSON must be present.
- Every placeholder token must still exist exactly as in the source.
- The main result wording must remain careful and bounded.

Return only the translated JSON.
```

After receiving the translated JSON, save it as `copy/{language}.json`, add it to `copy/languages.json`, and run:

```bash
node tests/data-contract.test.js
```
