## 🚀 M3\_PHASE\_08.md – Admin Chat Interface (MVP)

### FEATURE

Introduce a lightweight, internal chat panel that lets the admin manage Offers and Questions conversationally. This interface will sit inside the Admin Dashboard and leverage existing REST endpoints under the hood.
**Scope:** CRUD for offers & questions, basic slash‐command help, no AI tooling yet.

### OBJECTIVE

*Give admins a faster way to tweak content without leaving the dashboard UI.*
In this MVP we will:

1. Render a chat panel component in the dashboard sidebar.
2. Support slash commands:

   * `/list offers` – return paginated offers
   * `/list questions` – return questions for active survey
   * `/add offer <destinationUrl>` – open modal with pre‑filled URL
   * `/add question <surveyId>` – open modal form
   * `/help` – show supported commands
3. Parse input client‑side, hit existing API routes, and stream responses.
4. Persist chat history in local component state (no DB persistence yet).

### DEPENDENCIES

* Admin Dashboard shell (M3\_PHASE\_06)
* Offer and Question CRUD routes (M3\_PHASE\_07 and earlier)
* Auth middleware in place (M1)

### INSTRUCTIONS FOR CLAUDE

* ✅ Create `ChatPanel.tsx` with minimal Tailwind layout (≤ 500 LOC).
* ✅ Create `useChatCommands.ts` hook to parse & dispatch commands.
* ✅ Wire commands to API calls via `offerService` & `questionService`.
* ✅ Render chat inside `Dashboard.tsx` alongside metrics.
* ✅ Provide `/help` output listing commands.
* ✅ Add unit tests for command parsing.
* ✅ Add integration test: type “/list offers” → expect offers list in chat.

### 📁 FILES TO CREATE / UPDATE

```bash
frontend/src/components/admin/chat/ChatPanel.tsx
frontend/src/hooks/useChatCommands.ts
frontend/src/services/chat.ts          # optional helper abstractions
frontend/src/components/admin/Dashboard.tsx   # embed panel
tests/frontend/hooks/useChatCommands.test.ts
tests/frontend/components/ChatPanel.test.tsx
```

### ✅ SUCCESS CRITERIA

* [ ] Dashboard shows a chat sidebar that collapses/expands.
* [ ] `/help` lists all commands.
* [ ] `/list offers` & `/list questions` render tables inside chat.
* [ ] `/add offer <url>` opens Offer modal; saving refreshes chat and metrics.
* [ ] All new code passes lint + type‑check.
* [ ] Unit tests cover command parsing edge‑cases.
* [ ] All Necessary Documentation has been reviewed and updated and/or added

### 🧪 VALIDATION LOOP

```bash
npm run lint
npm run type-check
npm run test:unit
npm run test:integration
npm run dev   # ✨ manual chat flow
```

### GOTCHAS

* Keep command parsing simple RegEx (avoid over‑engineering NLP).
* Protect all actions with existing JWT; redirect to login if 401.
* Ensure chat panel code stays under 500 LOC (split into sub‑components if needed).

### REFERENCES

* PLANNING.md → Admin Chat Interface module
* CLAUDE.md → file size, testing, modularity rules
* M3\_PHASE\_06 & 07 → Dashboard + Offer endpoints
* `prp_base.md` (PRP Base)

---
