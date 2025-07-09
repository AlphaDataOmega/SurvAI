## 🚀 M4\_PHASE\_03.md – Widget Clickstream Batching & Resilience

### FEATURE

Improve the embeddable widget’s network efficiency and fault‑tolerance by adding:

1. **Clickstream batching** – queue click events in local memory and POST in batches (e.g., 10 or every 5 sec).
2. **Retry logic** – exponential back‑off if the SurvAI API is unreachable.
3. **Offline support** – persist queued events in `localStorage` so they flush when connection resumes.

### OBJECTIVE

Reduce network chatter and prevent data loss from transient outages, keeping bundle overhead minimal (< +15 kB).

### DEPENDENCIES

* Widget tracking calls (`/track-click`) from M4\_PHASE\_01.
* No backend change required (existing endpoint already idempotent).

### TASKS FOR CLAUDE

1. **Batching Queue**

   * Create `widget/utils/ClickQueue.ts` (≤150 LOC).
   * API: `enqueue(event)`; internal timer flushes batch.
2. **Retry & Persistence**

   * On flush failure, store batch in `localStorage:srv_click_queue`.
   * Retry with exponential back‑off (start 2 s → max 30 s).
3. **Hook Integration**

   * Update `useWidget.ts` to push clicks via `ClickQueue.enqueue()`.
4. **Tests**

   * Unit: queue batching & flush, retry logic, localStorage persistence.
5. **Docs**

   * Update `docs/WIDGET.md` with note on offline batching and storage key.

### 📁 FILES TO CREATE / UPDATE

```bash
frontend/src/widget/utils/ClickQueue.ts
frontend/src/widget/hooks/useWidget.ts   # integrate
tests/widget/ClickQueue.test.ts          # unit tests
shared/types/widget.ts                   # optional: event type
docs/WIDGET.md                           # update
```

### ✅ SUCCESS CRITERIA

* [ ] Click events batch (10 or 5 sec) before POST.
* [ ] On offline mode (simulate fetch failure), events persist and flush after reconnect.
* [ ] Exponential back‑off caps at 30 sec then repeats.
* [ ] No data loss verified via unit tests (simulate 20 queued clicks, 2 failures, final success).
* [ ] Bundle size increase ≤ +15 kB.
* [ ] All Necessary Documentation has been reviewed and updated and/or added

### 🧪 VALIDATION LOOP

```bash
npm run lint
npm run type-check
npm run test:unit
npm run build:widget
open examples/widget-offline-test.html  # manual offline simulation
```

### GOTCHAS

* Guard against duplicate send (idempotent keys per event).
* Purge localStorage on successful flush.
* Use `navigator.onLine` + `window.addEventListener('online',……)` to trigger flush.

### REFERENCES

* `PLANNING.md` → Widget resilience requirements
* `CLAUDE.md` → bundle size & modularity rules
* MDN `navigator.onLine` docs
* `prp_base.md` (PRP Base)
---


