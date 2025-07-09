## 📸 M5\_PHASE\_03.md – Comprehensive Visual Tests Suite

### FEATURE:

Build out a full Playwright visual-snapshot suite that covers **every major UI state**:

1. Admin Dashboard (metrics + chat panel collapsed/expanded).
2. Offer Management screen (list + modal).
3. Survey flow (initial CTA question, subsequent question, thank-you page).
4. Embeddable Widget (inline on standalone test page).
   All snapshots will be diff-checked against baselines in CI.

### EXAMPLES:

* Follow the pattern in `tests/visual/visual.spec.ts` from M3\_PHASE\_09 for login + dashboard capture.
* Use `expect(page).toHaveScreenshot({ maxDiffPixelRatio: 0.001 })` for tight diffs.

### DOCUMENTATION:

* `FINAL_REVIEW_PLANNING.md` – milestone goals & headless CI requirement.
* `CLAUDE.md` – file size and test conventions.
* `/docs/VISUAL_TESTING.md` (create/update) – instructions for updating baselines.

### OTHER CONSIDERATIONS:

* **Baseline Storage**: keep under `tests/visual/baselines/` – reviewers should check in updated PNGs when UI intentionally changes.
* **Viewport**: use `1366×768` for all captures to remain deterministic.
* **Seed Data**: ensure DB seeded with deterministic fixtures before running visual tests.
* **Flaky Fixes**: hide animations or use `prefers-reduced-motion` CSS to stabilize captures.

---

### TASK CHECKLIST

* [ ] **Scenario List**: enumerate each UI state and write Playwright steps.
* [ ] **Baseline Capture**: run tests locally to generate initial baselines.
* [ ] **CI Integration**: add `npm run test:visual` job to GitHub Actions with headless chromium.
* [ ] **Docs**: create `/docs/VISUAL_TESTING.md` with baseline-update workflow.
* [ ] **All Necessary Documentation has been reviewed and updated and/or added

```bash
# Validation Loop
npm run lint
npm run type-check
npm run test:visual   # generates/compares screenshots
```

#### Success Criteria

* Baseline PNGs exist for all target screens (≥ 8 captures).
* CI fails when an unintended pixel diff > 0.1 % is detected.
* Visual test run completes in < 90 s in CI.
* `/docs/VISUAL_TESTING.md` clearly explains updating baselines.
* Coverage report shows visual suite executed (Playwright traces uploaded as artifacts).
* All Necessary Documentation has been reviewed and updated and/or added

---

