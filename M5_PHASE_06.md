
## 🚀 M5\_PHASE\_06.md – CI/CD Hardening & Status Badges

### FEATURE:

Lock down the SurvAI CI/CD pipeline so every push/run enforces **lint**, **type‑check**, **unit**, **integration**, **visual**, and **coverage gates (≥ 90 %)**.  Publish build+coverage status badges on the root README.

### EXAMPLES:

* Use the GH Actions workflow in `.github/workflows/widget-deploy.yml` as a pattern; extend it to `ci.yml` covering all jobs.
* Badge syntax: `![CI](https://github.com/<org>/SurvAI/actions/workflows/ci.yml/badge.svg)`.

### DOCUMENTATION:

* `FINAL_REVIEW_PLANNING.md` – CI/CD goals.
* `CLAUDE.md` – lint & test commands.
* `/docs/DEPLOYMENT.md` – update with CI badge explanation.

### OTHER CONSIDERATIONS:

* Separate **build** and **deploy** jobs; deploy runs only on `main` & tag pushes.
* Cache npm deps with `actions/setup-node@v4` + `cache: npm`.
* Upload Playwright traces and coverage reports as artifacts.
* Fail fast on first red job; use `needs` to chain.

---

### TASK CHECKLIST

* [ ] **Create** `.github/workflows/ci.yml` with matrix for `node@18` & `node@20`.
* [ ] **Jobs**:

  * `lint-type`: `npm run lint && npm run type-check`.
  * `test-unit-int`: `npm run test:unit && npm run test:integration`.
  * `test-visual`: `npm run test:visual` (headless).
  * `coverage-gate`: Jest coverage threshold 90 %.
* [ ] **Artifacts**: upload `coverage/`, `playwright-report/`.
* [ ] **Deploy Workflow Update**: ensure `widget-deploy.yml` depends on `ci.yml` success.
* [ ] **Badges**: add CI and coverage badge to root README.

```bash
# Validation Loop (local dry‑run)
act pull_request -j lint-type
act pull_request -j test-unit-int
```

#### Success Criteria

* All CI jobs green on PR and push.
* `ci.yml` completes < 5 min with caching.
* Coverage job fails if < 90 %.
* README displays CI + coverage badges.
* Deployment workflow triggers only on main merge or tag.

---

