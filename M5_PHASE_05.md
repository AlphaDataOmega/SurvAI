## 🔧 M5\_PHASE\_05.md – Initialization & Bootstrap Script

### FEATURE:

Provide a **single‑command bootstrap script** that sets up the entire SurvAI stack for a fresh developer or CI environment:

1. Starts Docker Compose (Postgres, Redis, backend).
2. Applies Prisma migrations & seeds initial data.
3. Populates a local `.env` file from `.env.example`, generating secrets where needed.
4. Runs smoke tests to confirm services are reachable.

### EXAMPLES:

* Use `scripts/init.sh` pattern similar to `examples/dev_init.sh` in the repo (if exists).
* Follow `docker-compose.yml` service names (`db`, `cache`, `backend`).

### DOCUMENTATION:

* `FINAL_REVIEW_PLANNING.md` – milestone outline.
* `/docs/DEPLOYMENT.md` – update with the new init steps.
* Root `README.md` – add “Quick Start” section referencing `./scripts/init.sh`.

### OTHER CONSIDERATIONS:

* **Cross‑platform**: ensure script works on macOS + Linux; offer `init.ps1` for Windows (optional).
* Generate random `JWT_SECRET`, `OLLAMA_URL` defaults if not present.
* Use colorized echo output for readability.
* Fail fast if Docker not installed.

---

### TASK CHECKLIST

* [ ] **Create** `scripts/init.sh` (≤ 200 LOC, bash).
* [ ] **Copy** `.env.example` → `.env` if not present; fill placeholders.
* [ ] **Run** `docker-compose up -d`.
* [ ] **Wait** for Postgres to accept connections (loop with `pg_isready`).
* [ ] **Execute** `npx prisma migrate deploy` + `npx prisma db seed`.
* [ ] **Smoke Test**: curl `http://localhost:4000/health` → expect `200 OK`.
* [ ] **Docs**: update README & DEPLOYMENT.md.

```bash
# Validation Loop
bash scripts/init.sh         # completes without error
npm run test:smoke           # optional additional smoke test
```

#### Success Criteria

* Script completes with green “SurvAI environment is ready” message.
* `.env` file exists and contains non‑placeholder values.
* `docker ps` shows `db`, `cache`, `backend` containers running.
* Healthcheck returns 200.
* README quick‑start instructions are accurate.

---

