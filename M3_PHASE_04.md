## 🚧 M3\_PHASE\_04.md – EPC Service Implementation

### FEATURE

Create the first functional draft of the `epcService`, which will handle EPC (earnings per click) calculation based on user click and conversion data. This phase focuses on:

* Implementing EPC calculation logic based on recent click/conversion events
* Creating update utilities to refresh EPC values per offer
* Exposing this via internal functions only (no public route yet)

This lays the groundwork for real-time question ordering based on performance.

### OBJECTIVE

Establish a centralized, testable EPC service that can:

* Calculate EPC from recent activity (e.g., past 7 days)
* Update the `Offer.epcValue` in the database
* Be safely called by tracking services and question sorting logic

### DEPENDENCIES

* Prisma models: `Click`, `Offer`
* `epcScore` field on `Question`
* `epcService.ts` stub from M3\_PHASE\_03

### INSTRUCTIONS FOR CLAUDE

* ✅ Implement function `calculateEPC(offerId: string): number`
* ✅ Implement function `updateEPC(offerId: string): Promise<void>` that writes EPC to DB
* ✅ Query `Click` records within the last 7 days (use `new Date(Date.now() - 7*24*60*60*1000)`)
* ✅ Handle zero-click case (EPC = 0)
* ✅ Use a Prisma transaction
* ✅ Add unit tests for various conversion scenarios

### 📁 FILES TO MODIFY OR CREATE

```bash
backend/src/services/epcService.ts                  # Full implementation
backend/src/utils/time.ts                           # Utility for date math
tests/backend/services/epcService.test.ts           # Unit tests
```

### ✅ SUCCESS CRITERIA

* [ ] `calculateEPC()` returns a float based on offer performance in past 7 days
* [ ] `updateEPC()` writes correct EPC to `Offer` model
* [ ] EPC = 0.0 when no clicks are recorded
* [ ] Edge case: some clicks, no conversions returns EPC = 0.0
* [ ] All code paths are covered by unit tests
* [ ] Service uses transaction for data consistency
* [ ] All Necessary Documentation has been reviewed and updated and/or added

### 🧪 VALIDATION LOOP

```bash
npm run lint
npm run type-check
npm run test:unit
```

### 🧠 CONTEXT TO USE

* Prisma schema definitions for `Click`, `Offer`
* Business logic: EPC = (Conversions / Clicks) \* 100 (or use revenue if added later)
* Add helper to handle timestamp window filtering

### 📚 REFERENCES

* `PLANNING.md` (EPC responsibilities)
* `CLAUDE.md` (modularity and test rules)
* `M3_PHASE_03.md` (downstream consumer of EPC data)
* `prp_base.md` (PRP Base)

---
