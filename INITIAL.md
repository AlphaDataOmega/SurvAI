## 🚀 INITIAL.md – Bootstrapping SurvAI with AI Agent PRP

### FEATURE

SurvAI MVP initial setup using a Claude-executed PRP. This initializes the scaffold for a dynamic AI-enhanced survey engine, optimizing monetization through EPC and dynamic AI-driven UX. This prompt prepares Claude to fully scaffold the codebase using our planning and conventions.

### OBJECTIVE

Claude will create and validate a complete development-ready project structure that includes:

* Monorepo layout with `frontend/`, `backend/`, `shared/`, and `tests/`
* `.env.example` with all required secrets and defaults
* `docker-compose.yml` for Postgres, Redis, and dev containers
* Functional dev scripts for backend and frontend
* `README.md` with architecture diagram and startup instructions

### INSTRUCTIONS FOR CLAUDE

Trigger `generate-prp.md` using this file as the root input. When generating the PRP, use these directives:

* ✅ Reference and obey all conventions and folder structure from `PLANNING.md`
* ✅ Follow code quality and modularity rules from `CLAUDE.md`
* ✅ Include all bootstrapping and validation tests in the generated PRP
* ✅ Assume OpenAI and Ollama support will be needed in future tasks
* ⚠️ DO NOT generate app logic yet – this is just bootstrapping

### 🔍 CONTEXT REFERENCES

* `CLAUDE.md`: Dev constraints and patterns (file size, testing, modularity)
* `PLANNING.md`: Feature definitions and folder structures
* `.claude/commands/`: Run `/generate-prp INITIAL.md`

### 📁 TARGET STRUCTURE

```bash
/home/ado/SurvAI.3.0/
├── frontend/
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── backend/
│   ├── package.json
│   ├── tsconfig.json
│   └── src/app.ts
├── shared/
│   └── package.json
├── tests/                        # (mirror structure of src/)
├── .env.example
├── docker-compose.yml
├── README.md
├── package.json                  # monorepo root
```

### 📦 TASK CHECKLIST (Claude must include in generated PRP)

* [ ] Validate monorepo workspace resolution
* [ ] `.env.example` contains all required secrets (DB, Redis, AI API keys)
* [ ] Docker runs database and cache properly
* [ ] Dev commands run frontend + backend
* [ ] README has run instructions and structure
* [ ] Frontend and backend compile cleanly with `type-check`
* [ ] All lint rules from CLAUDE.md apply

### 🧪 VALIDATION LOOP

Claude must ensure the following validations exist in the PRP:

```bash
npm run lint
npm run type-check
npm run dev             # (should launch both frontend and backend)
docker-compose up -d    # (should boot Postgres + Redis)
```

Include smoke tests in the PRP to validate that frontend loads and backend responds to `GET /health`.

### 🧱 FILES TO GENERATE

```yaml
- package.json (monorepo root)
- .env.example
- docker-compose.yml
- README.md
- frontend/package.json
- frontend/tsconfig.json
- frontend/vite.config.ts
- backend/package.json
- backend/tsconfig.json
- backend/src/app.ts
```

### 📚 DOCUMENTATION INSTRUCTIONS

The `README.md` must include:

* ✅ Overview of SurvAI MVP goals
* ✅ How to install dependencies
* ✅ How to run dev mode for frontend/backend
* ✅ How to run Docker stack (Postgres, Redis)
* ✅ `.env` config details
* ✅ Folder structure diagram

### 📎 EXTERNAL REFERENCES

* [Pydantic AI Docs](https://ai.pydantic.dev/) ← for later agent modules
* [Prisma + Express Docs](https://www.prisma.io/express)
* [Vite Setup Guide](https://vitejs.dev/guide/)

---
