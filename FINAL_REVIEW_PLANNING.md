## 🧠 FINAL\_REVIEW\_PLANNING.md – QA & Production Hardening Roadmap

### PURPOSE

This planning document defines the **final‑review and hardening milestone (Milestone 5)**.  The goal is to take the fully‑implemented SurvAI codebase and:

1. Replace all placeholder functions / TODOs with production‑ready logic.
2. Achieve 90%+ unit & integration test coverage for **all** API routes, services, and critical frontend hooks.
3. Expand the Playwright visual‑snapshot suite to cover every major page/state.
4. Consolidate and polish documentation (README, PLANNING, docs/\*, WIDGET.md).
5. Provide a single initialization script that spins up Docker (Postgres, Redis), seeds DB, and sets `.env` variables.
6. Harden CI/CD pipelines (build, test, deploy).

### SCOPE BREAKDOWN

Milestone 5 will be split into phases:

| Phase             | Focus                                  | Key Outputs                                                                             |
| ----------------- | -------------------------------------- | --------------------------------------------------------------------------------------- |
| **M5\_PHASE\_01** | Placeholder Replacement & Code Cleanup | Replace all `TODO` markers / stubbed logic; conform to CLAUDE rules                     |
| **M5\_PHASE\_02** | Full API Test Coverage                 | Jest + Supertest for every route; coverage report ≥ 90%                                 |
| **M5\_PHASE\_03** | Comprehensive Visual Tests             | Playwright scenarios for Admin Dashboard, Chat, Survey flow, Widget embed               |
| **M5\_PHASE\_04** | Documentation Review & Aggregation     | Merge/clean docs; finalize README, PLANNING, docs/WIDGET.md, CHANGELOG                  |
| **M5\_PHASE\_05** | Initialization & Bootstrap Script      | `scripts/init.sh` – Docker compose, prisma migrate, seed, env setup                     |
| **M5\_PHASE\_06** | CI/CD Hardening & Badges               | Ensure all pipelines run lint, type‑check, unit, integration, visual; add status badges |

### GLOBAL RULES (Inherit + Add)

* Continue obeying `CLAUDE.md` (modularity, ≤ 500 LOC, tests, docs).
* For Final Review tasks, always update `TASK.md` and bump CHANGELOG.
* **All placeholder code must be removed**; no lingering `console.log`, `FIXME`, or `mock*`.
* Minimum coverage gate: 90% lines & branches.
* Visual tests must run headless in CI (GitHub Actions Linux‑x64).

### PENDING DOCS TO CONSOLIDATE


essentially all files in /docs

### TOOLING & ENVIRONMENT

* Testing: **Jest**, **Supertest**, **Playwright**.
* Coverage: `jest --coverage` + Playwright trace viewer.
* Docker compose: services `db` (Postgres), `cache` (Redis), `backend`, optional `widget‑cdn` local.

---

This planning file is the **source of truth** for Milestone 5.  All phases below will reference these goals.

Next step → draft **M5\_PHASE\_01.md** per this roadmap.
