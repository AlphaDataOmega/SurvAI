## 🚀 M5\_PHASE\_01.md – Placeholder Replacement & Code Cleanup

### FEATURE

Eliminate every remaining *placeholder*, `TODO`, mock implementation, and temporary console statement across the SurvAI codebase. Bring all modules to production‑ready status in line with `CLAUDE.md` rules.

### OBJECTIVE

1. **Audit** the repository for unfinished code (grep for `TODO`, `FIXME`, `PLACEHOLDER`, `mock`, `console.log`).
2. **Implement real logic** or remove the call for every match.
3. **Refactor** any quick‑and‑dirty code to meet style/architecture guidelines.
4. **Document** each resolved placeholder in CHANGELOG and remove notes from code.

### DELIVERABLES

* Zero occurrences of `TODO`, `FIXME`, or placeholder stubs across `src/` and `widget/` directories.
* Updated tests to cover newly implemented logic.
* CHANGELOG entry summarising replacements.
* Code passes lint, type‑check, unit, integration, visual suites.

### TASKS FOR CLAUDE

1. **Repo Audit Script**

   * `scripts/placeholder-audit.mjs` → lists offending lines; run in CI.
2. **Implementation Pass**

   * Replace stubs in services/controllers (e.g., `epcService`, `trackingService`, `ChatCommand parser` etc.).
3. **Log & Comment Cleanup**

   * Remove stray `console.*` calls (except intentional warnings).
4. **Tests**

   * Write unit tests for newly filled logic to maintain ≥ 90 % coverage.
5. **CHANGELOG**

   * Add `## [Unreleased]` section detailing placeholder resolutions.
6. **Docs**

   * If logic differences impact APIs, update `/docs/API.md`.

### 📁 FILES TYPICALLY AFFECTED (partial list)

```bash
backend/src/services/**/*
backend/src/controllers/**/*
frontend/src/hooks/**/*
frontend/src/widget/**/*
shared/types/**/*
scripts/placeholder-audit.mjs
```

### ✅ SUCCESS CRITERIA

* [ ] `scripts/placeholder-audit.mjs` returns **0** matches.
* [ ] Lint (`npm run lint`) passes with no warnings.
* [ ] Type‑check (`npm run type-check`) green.
* [ ] Unit + integration + visual tests all pass; coverage ≥ 90 %.
* [ ] CHANGELOG updated; docs refreshed.
* [ ] All Necessary Documentation has been reviewed and updated and/or added

### 🧪 VALIDATION LOOP

```bash
npm run lint
npm run type-check
npm run test:unit
npm run test:integration
npm run test:visual
node scripts/placeholder-audit.mjs  # should print "No placeholders found."
```

### GOTCHAS

* Don’t touch auto‑generated Prisma client code.
* Keep audit script polite: ignore `node_modules`, `dist`, `coverage`, `baselines`.
* If a placeholder refers to a later phase feature, convert it to a tracked `TASK.md` item instead of leaving it in code.

### REFERENCES

* `FINAL_REVIEW_PLANNING.md` – Milestone 5 goals
* `CLAUDE.md` – style & coverage rules
* `prp_base.md` (PRP Base)
---

