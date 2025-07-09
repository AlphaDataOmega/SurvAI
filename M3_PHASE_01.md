## 🚀 M3\_PHASE\_01.md – EPC Click Tracking + Pixel Attribution

### FEATURE

Implement backend click tracking and pixel attribution logic for EPC-based offer optimization. This phase introduces click recording, conversion updates, and pixel firing via generated tracking URLs. Data will be recorded per session and offer.

### OBJECTIVE

Build a complete, testable click-tracking and attribution system that:

* Records every click with `click_id`, `offer_id`, and `session_id`
* Accepts conversion updates via pixel callbacks
* Calculates EPC values and updates offers
* Uses tracking URLs with `{click_id}` and `{survey_id}` tokens ( Click ID comes from the session cookies and refers to the click from the traffic source ie gclid, gbraid etc. Survey ID refers to the click through on the survey, both are unique identifiers for separate clicks. If this doesn't make sense ask questions.)

### IMPLEMENTATION SCOPE

* ✅ Back-end only (frontend tracking will be done later)
* ✅ Include Prisma model updates, routes, and services
* ✅ Include pixel-firing simulation for manual testing
* ⚠️ Do not build full EPC optimization logic yet – just log and store metrics

### 🎯 FILES TO CREATE/UPDATE

```bash
backend/src/routes/tracking.ts           # Pixel + click endpoints
backend/src/controllers/trackingController.ts
backend/src/services/trackingService.ts
backend/src/middleware/tracking.ts       # (optional: session/click injection)
backend/prisma/schema.prisma             # Click model already exists
```

### 🔄 CONTEXT

From `PLANNING.md`, this phase activates tracking logic with placeholder token support (`{click_id}`, `{survey_id}`) so that every click can be tied back to conversions and impact EPC calculations. This supports affiliate logic and future question ordering.

### 🧪 VALIDATION TESTS

Claude must create tests and run validation for:

```bash
# Backend
npm run type-check
npm run lint
npm run test:unit
npm run test:integration
```

### ✅ ACCEPTANCE CRITERIA

* [ ] Clicks are stored correctly on click-through
* [ ] `click_id` is returned in tracking response
* [ ] Conversion pixel can be fired and marks conversion
* [ ] Pixel URLs are dynamically generated using session/offer data
* [ ] EPC calculation logic is present but not yet automated
* [ ] All new logic covered by unit + integration tests

### 🧠 GOTCHAS + REMINDERS

```yaml
- Click tracking MUST be atomic (use transactions)
- Pixel firing MUST be idempotent (no double-conversions)
- Session + offer must be validated for every click
- Do NOT skip input validation (use zod or pydantic equivalent)
- Log each fired pixel to detect abuse/debug
```

### 🤖 PSEUDOCODE REFERENCE

```ts
POST /track/click
- Validate session + offer
- Create click with UUID
- Return click_id + pixel URL (including tokens)

GET /pixel/fire?click_id=abc123
- Validate click
- Update click.converted = true
- Return 200 OK (image/gif or 1x1 if needed)

// EPC pseudo
clicks = await db.click.findMany({ offerId })
converted = clicks.filter(c => c.converted)
epc = (converted.length / clicks.length) * 100
await db.offer.update({ epcValue: epc })
```

### 📎 REFERENCES

```yaml
- CLAUDE.md – file structure, testing, style conventions
- PLANNING.md – tracking + EPC goals
- /docs - Developer Insights and Knowledgebase
- https://uppromote.com/blog/what-is-affiliate-tracking/ – pixel logic
- https://www.prisma.io/docs – transaction handling
```
