# Deployment

The prototype is static and can be served directly from the repository root.

Current intended public demo mode:

- GitHub Pages from `main` branch, repository root.
- No build step.
- No backend.
- No GitHub Actions workflow is required.

The public demo is a review surface, not a product release. It still uses
demo-labelled runtime country values and candidate-only source data.

Expected URL after GitHub Pages is enabled:

```text
https://dennishedegreen.github.io/ai-labour-power-budget/
```

Run locally:

```bash
npm run start
```

Verify before publishing:

```bash
npm run check
```

