## 🧩 M1\_PHASE\_01.md – Authentication + Admin Dashboard Scaffold

### 🎯 OBJECTIVE

Build the foundational user system and admin scaffold, including:

* Secure email/password authentication
* JWT-based session management
* Admin dashboard shell (UI only, no logic)
* Route structure, middleware, protected routes

This phase enables local login + protected admin routing + session validation, all scaffolded per our global rules.

### 🔐 FEATURE: Auth + Admin System

Build a simple secure authentication system and protected dashboard shell:

* Email/password registration + login via REST
* JWT issued on login and stored in secure HTTP-only cookie
* Auth middleware for Express
* Login page (frontend) with form + error handling
* AdminPage shell with placeholder nav, heading, and welcome text

### 🧱 SCOPE OF WORK

#### Backend

* `POST /api/auth/register` – email + password
* `POST /api/auth/login` – return JWT
* `GET /api/auth/me` – return user object if authed
* `middleware/auth.ts` – validate JWT
* `services/authService.ts` – hashing, token logic
* `controllers/authController.ts` – orchestrate login/register
* `routes/auth.ts` – mount endpoints
* Prisma schema: create `User` model

#### Frontend

* `LoginPage.tsx` – email/password login form
* `AdminPage.tsx` – shell with welcome, nav placeholder
* `useAuth.ts` – login logic, session persistence
* `api.ts` – add login, me endpoints
* `Layout.tsx` – check session, show nav if admin

#### Shared

* `types/user.ts` – User object

### 🔄 VALIDATION

**Unit Tests:**

* Auth service (hashing, token)
* Auth controller
* API route logic

**Integration Tests:**

* Login -> Get me flow
* JWT rejection on bad token

**Manual:**

* Run `npm run dev`
* Visit `/login`, login
* Visit `/admin` -> shows AdminPage shell

### 📦 FILES TO GENERATE OR UPDATE

```yaml
backend/src/routes/auth.ts
backend/src/controllers/authController.ts
backend/src/services/authService.ts
backend/src/middleware/auth.ts
backend/src/models/user.ts (or schema.prisma)
frontend/src/pages/LoginPage.tsx
frontend/src/pages/AdminPage.tsx
frontend/src/hooks/useAuth.ts
frontend/src/components/common/Layout.tsx
shared/types/user.ts
```

### 📁 FILE CONVENTIONS TO FOLLOW

* Modular code under 500 LOC per file
* Use `pydantic`, `zod`, or schema validation per CLAUDE.md
* Docstrings for all exported functions (Google style)
* Lint and TypeCheck before merging

### ⚠️ GOTCHAS

* Securely hash passwords (bcrypt)
* Store JWT in HTTP-only cookie, NOT localStorage
* JWT must include user role
* Routes should 403 if role !== 'ADMIN'

### 🧪 TEST COMMANDS

```bash
npm run lint
npm run type-check
npm run test:unit
npm run test:integration
npm run dev # then login manually and check /admin route
```

### ✅ SUCCESS CRITERIA

* Admin login works
* `/admin` route is protected
* Session persists across reloads
* AdminPage loads only if logged in
* Test coverage hits: authService, authController, session flow
* Everything conforms to CLAUDE + PLANNING

---

> Next Phase: M1\_PHASE\_02 – Offer Management CRUD
