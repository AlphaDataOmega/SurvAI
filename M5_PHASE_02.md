## 🧪 M5\_PHASE\_02.md – Comprehensive API Test Coverage

### FEATURE:

Achieve **≥ 90 % line & branch coverage** for **all backend API routes** using Jest + Supertest.  This phase adds or extends test suites so every controller, service, and middleware path is validated—success, edge, and failure cases.

### EXAMPLES:

* Pattern your tests on `tests/backend/controllers/offerController.test.ts` (happy‑edge‑fail structure, Supertest for HTTP assertions).
* Use fixtures in `tests/helpers/dbSeed.ts` for consistent seeded data.

### DOCUMENTATION:

* `FINAL_REVIEW_PLANNING.md` – phases & coverage gate.
* `CLAUDE.md` – testing patterns and file size limits.
* `/docs/API.md` – ensure docs match any behaviour revealed by tests.

### OTHER CONSIDERATIONS:

* **Database Isolation**: Use `beforeAll` → `prisma.$transaction` rollback or `docker‑compose` test DB.
* **Auth Tokens**: Use the `helpers/getTestToken.ts` util to simulate admin JWTs.
* **Rate‑Limit & Error Paths**: Include tests for 429 (rate‑limit) and 401/403 (auth).
* **CI Gate**: Add `jest --coverage --coverageThreshold '{"global":{"branches":90,"lines":90}}'`.

---

### TASK CHECKLIST

* [ ] **Inventory**: list all routes/controllers; map existing vs missing tests.
* [ ] **Write Tests**: add suites in `tests/backend/controllers/*` & `tests/backend/services/*`.
* [ ] **Seed / Teardown**: use DB seed helper for deterministic data.
* [ ] **Coverage Gate**: update `package.json` test script with threshold.
* [ ] **Docs**: note new coverage badge in README.

```bash
# Validation Loop
npm run lint
npm run type-check
npm run test:unit     # includes Jest + Supertest suites
codecov               # optional upload if configured
```

#### Success Criteria

* Coverage report shows ≥ 90 % for branches & lines.
* All critical error paths tested (400, 401, 403, 404, 409, 500).
* Tests run in <60 s via parallel workers.
* CI fails if coverage drops below threshold.
* README displays coverage badge (Codecov or Jest badge generator).

---

