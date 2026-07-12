## Scope

What changed?

## Review Surface

- [ ] Product/interface
- [ ] Calculation logic
- [ ] Runtime data
- [ ] Source candidate data
- [ ] Copy/localization
- [ ] Documentation only

## Source/Data Boundary

- [ ] This does not promote candidate source data into runtime data.
- [ ] If it changes source data, the promotion gate and source definition are updated.
- [ ] If it changes U.S. data language, the EIA retail-sales/direct-use boundary is preserved.
- [ ] If it changes EU27 data, the Eurostat mismatch status is addressed.

## Checks

```bash
npm run check
```

Result:

