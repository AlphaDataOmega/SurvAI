## 🚀 M3\_PHASE\_06.md – Admin Dashboard Metrics & Visualization

### FEATURE

Implement the first iteration of the Admin Dashboard that surfaces live metrics:

* Total clicks and conversions per offer
* EPC per offer and per question
* CTR per copy variant
* Basic charts / tables for quick insights

### OBJECTIVE

Provide administrators with a real‑time snapshot of survey performance so they can monitor and tweak offers/questions manually before the fully automated optimizer kicks in.

### DEPENDENCIES

* Tracking & EPC services from M3\_PHASE\_04 and 05
* Auth + Admin shell from M1\_PHASE\_01
* Frontend charting library (e.g., Recharts or lightweight alternative)

### INSTRUCTIONS FOR CLAUDE

* ✅ Add `/api/dashboard/metrics` route that aggregates stats:

  * Offer clicks, conversions, EPC
  * Question EPC averages
* ✅ On frontend, create `Dashboard.tsx` with:

  * Table of offers and metrics
  * Simple bar chart of EPC per offer
  * Filters (last 24h, 7d, 30d)
* ✅ Protect route with admin middleware
* ✅ Unit tests for aggregation logic
* ✅ Snapshot tests for chart rendering (optional)

### 📁 FILES TO CREATE / MODIFY

```bash
backend/src/routes/dashboard.ts           # Aggregation endpoint
backend/src/controllers/dashboardController.ts
backend/src/services/dashboardService.ts  # Metric builders
frontend/src/components/admin/Dashboard.tsx
frontend/src/components/admin/charts/EpcBarChart.tsx
frontend/src/services/dashboard.ts
shared/types/metrics.ts
```

### ✅ SUCCESS CRITERIA

* [ ] `/api/dashboard/metrics` returns aggregated data in <200ms for 10k records
* [ ] Dashboard UI shows table + bar chart
* [ ] Filters adjust data correctly
* [ ] All new code passes lint + type-check
* [ ] Unit tests cover aggregation edge cases
* [ ] All Necessary Documentation has been reviewed and updated and/or added

### 🧪 VALIDATION LOOP

```bash
npm run lint
npm run type-check
npm run test:unit
npm run test:integration
npm run dev  # visually inspect dashboard
```

### GOTCHAS

* Use Prisma aggregations; avoid N+1 queries
* Chart components must not exceed 500 LOC
* Ensure metrics reflect only active offers/questions

### REFERENCES

* PLANNING.md – Dashboard module description
* CLAUDE.md – component/file size rules
* Prisma aggregation docs
* `prp_base.md` (PRP Base)
