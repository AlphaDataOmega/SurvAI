## 🚀 M4\_PHASE\_05.md – Widget Analytics Beacon & Dashboard Tile

### FEATURE

Add a lightweight analytics beacon so the SurvAI platform records every widget load and basic engagement metrics (impressions and time‑on‑widget). Surface these stats on the Admin Dashboard.

### OBJECTIVE

1. **Widget side**: Fire a one‑time `POST /widget/analytics` payload when the widget mounts.
2. **Backend**: Store the event (date, surveyId).
3. **Dashboard**: New metric tile “Widget Impressions” (last 7 days) with small line chart.

### SCOPE

* Single‑tenant: no partner IDs.
* Metrics limited to widget `loaded` and `dwellTimeMs` (time until first CTA click or unload).

### ENDPOINT SPEC

`POST /widget/analytics`

```json
{
  "surveyId": "abc123",
  "event": "loaded" | "dwell",
  "dwellTimeMs": 5230  // only for dwell event
}
```

### TASKS FOR CLAUDE

1. **Backend**

   * Update `schema.prisma` with `WidgetAnalytics` model: id, surveyId, event, dwellTimeMs, timestamp.
   * Add `routes/widgetAnalytics.ts` & controller.
   * Service to aggregate counts for last 7 days.
2. **Widget**

   * In `useWidget.ts`, on mount send `loaded` event.
   * Start timer; on first CTA click or `beforeunload`, send `dwell` event.
3. **Dashboard**

   * `WidgetImpressionsTile.tsx` – small line chart (Recharts) showing daily loads.
   * Embed in Dashboard grid.
4. **Docs / Tests**

   * Update `/docs/WIDGET.md` noting analytics beacon.
   * Unit tests: event payload construction & debounce.
   * Integration test: backend aggregation returns correct counts.

### 📁 FILES TO CREATE / UPDATE

```bash
backend/prisma/schema.prisma
backend/src/routes/widgetAnalytics.ts
backend/src/controllers/widgetAnalyticsController.ts
backend/src/services/widgetAnalyticsService.ts
frontend/src/widget/hooks/useWidget.ts  # add beacon logic
frontend/src/components/admin/metrics/WidgetImpressionsTile.tsx
docs/WIDGET.md
tests/widget/analytics.test.ts
tests/backend/controllers/widgetAnalyticsController.test.ts
```

### ✅ SUCCESS CRITERIA

* [ ] `POST /widget/analytics` stores events.
* [ ] Widget sends `loaded` and `dwell` events exactly once per mount.
* [ ] Dashboard tile shows correct daily counts (manual DB seed test).
* [ ] Unit & integration tests green; lint + type‑check pass.
* [ ] All Necessary Documentation has been reviewed and updated and/or added

### 🧪 VALIDATION LOOP

```bash
npm run lint
npm run type-check
npm run test:unit
npm run test:integration
```

### GOTCHAS

* Debounce dwell event; ensure it fires even if page closes quickly.
* Limit beacon payload size; use `navigator.sendBeacon` if available.
* Dashboard query must group by date in DB‑agnostic way (Prisma `groupBy`).

### REFERENCES

* `PLANNING.md` → Widget analytics goals
* `CLAUDE.md` → modularity & test rules
* MDN `navigator.sendBeacon`
* `prp_base.md` (PRP Base)
---


