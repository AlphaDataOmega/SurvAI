## 🚧 M3\_PHASE\_07.md – Offer Management CRUD + Pixel URL Auto‑Generation

### FEATURE

Build the complete Offer Management module so admins can create, edit, activate, and deactivate affiliate offers. The UI must automatically generate a pixel‑tracking URL that contains `{click_id}` and `{survey_id}` placeholders when the destination URL is entered or updated.

### OBJECTIVE

Provide end‑to‑end functionality for offers:

* Admin UI to list, add, edit, delete, or toggle active status
* Backend routes + controller logic
* Pixel URL generation utility
* Validation, unit tests, and integration smoke tests

### DEPENDENCIES

* Auth (admin role)
* Click‑tracking and EPC logic from M3\_PHASE\_04
* Shared `Offer` model in `schema.prisma`

### TASKS FOR CLAUDE

1. **Backend**

   * `routes/offers.ts` | CRUD endpoints
   * `controllers/offerController.ts` | business logic + validation
   * `services/offerService.ts` | includes `generatePixelUrl()` that returns e.g.

     ```ts
     `${PIXEL_BASE}?click_id={click_id}&survey_id={survey_id}`
     ```
   * Zod validations in `validators/offerValidator.ts`

2. **Frontend**

   * `admin/OfferManagement.tsx` | form & table UI (Tailwind, ≤500 LOC)
   * Auto‑fill Pixel URL (read‑only) when Destination URL changes
   * Hooks in `services/offer.ts` for API calls

3. **Shared Types**

   * `shared/types/offer.ts` | Offer interface with `pixelUrl`, `epcValue`, `isActive`

4. **Tests**

   * Unit: pixel URL generation, service CRUD
   * Integration: create → list → update → delete flow

### 📁 FILES TO CREATE / UPDATE

```bash
backend/src/routes/offers.ts
backend/src/controllers/offerController.ts
backend/src/services/offerService.ts
backend/src/validators/offerValidator.ts
frontend/src/components/admin/OfferManagement.tsx
frontend/src/services/offer.ts
shared/types/offer.ts
tests/backend/services/offerService.test.ts
tests/backend/controllers/offerController.test.ts
```

### ✅ SUCCESS CRITERIA

* [ ] `POST /offers` creates an offer and auto‑generates pixel URL
* [ ] `GET /offers` lists offers with EPC & pixel URL
* [ ] `PATCH /offers/:id` updates destination and regenerates pixel URL
* [ ] `DELETE /offers/:id` (soft delete) and `PATCH /offers/:id/toggle` work
* [ ] Frontend UI displays table + form; pixel URL field read‑only
* [ ] Unit & integration tests all green; type‑check + lint pass
* [ ] All Necessary Documentation has been reviewed and updated and/or added

### 🧪 VALIDATION LOOP

```bash
npm run lint
npm run type-check
npm run test:unit
npm run test:integration
npm run dev   # manual CRUD sanity
```

### GOTCHAS

* Do **not** store `{click_id}` / `{survey_id}` placeholders encoded → keep raw
* Pixel URL must change if domain env var changes
* Use Prisma `updatedAt` trigger when destination URL mutates

### REFERENCES

* PLANNING.md – Offer Management specs
* CLAUDE.md – module size & testing rules
* M3\_PHASE\_04.md – EPC fields

---

Ready to `/generate-prp PRPs/M3_PHASE_07.md` 🚀

* `prp_base.md` (PRP Base)
