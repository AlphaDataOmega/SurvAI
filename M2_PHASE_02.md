🚀 M2_PHASE_02.md — Linkout Tracking, EPC Attribution & Pixel Injection
FEATURE
Implement the full affiliate conversion tracking pipeline:

When a user clicks a CTA, a new tab opens with the destination offer URL.

A {click_id} and {survey_id} are injected into that URL for attribution.

A corresponding pixel URL is generated and displayed in the backend (read-only).

When the pixel fires (server-side), the click is marked as converted.

EPC values are updated in real time and used for question ordering.

OBJECTIVE
Build and verify the click-through → conversion → EPC feedback loop using only:

pixel tracking (no affiliate APIs)

Prisma data models already defined

URL parameter substitution

atomic click creation with session context

This completes the first iteration of monetization logic.

🔩 REQUIREMENTS
✅ Frontend
 Clicking a CTA button opens a new tab to destinationUrl with:

{click_id} and {survey_id} inserted dynamically

Example: https://example.com/?cid=123&sid=456

 Track outbound clicks via a call to /api/track-click

Returns click_id, used for pixel generation

Starts EPC calculation chain

✅ Backend
 POST /api/track-click

Creates a Click record with sessionId, offerId

Returns the generated click_id

 GET /pixel/:click_id

Marks click as converted

Updates offer EPC in background job or async handler

✅ EPC Logic
 EPC = (conversions / clicks) * 100

 Update epcValue on Offer table

 Questions using that offer should bubble higher in display order

✅ Admin
 Offer Management UI must show:

Pixel URL (read-only)

Destination URL (editable)

EPC value (auto-updating)

🧪 VALIDATION
Smoke Tests
bash
Copy
Edit
npm run dev
docker-compose up -d
# Click CTA → opens tab with params → pixel GET works → EPC updates
Backend Unit Tests
 /track-click creates record and returns ID

 /pixel/:click_id sets converted = true

 EPC calculation rounds correctly and updates offer

 Invalid click IDs return 404 or handled error

Frontend Unit Tests
 Button click calls tracking route, opens window

 Pixel URLs match what backend expects

 EPC field shows correct value after mock conversion

🔍 CODE TARGETS
yaml
Copy
Edit
backend/
  src/routes/tracking.ts           # Click and pixel endpoints
  src/services/trackingService.ts # Business logic
  src/controllers/offerController.ts # EPC update on pixel hit
  src/utils/epc.ts                # EPC math utility

frontend/
  src/components/survey/QuestionCard.tsx # Insert click_id + open tab
  src/services/tracking.ts              # trackClick, build URL
  src/components/admin/OfferManagement.tsx # Read-only pixel URL

shared/
  types/analytics.ts # Define ClickData, EPCScore
⚠️ GOTCHAS
❗ Ensure clicks are created before redirect, so click_id is ready

❗ Do not generate pixel client-side — it must come from backend with exact click_id

❗ Use Prisma $transaction when marking clicks and updating EPC

🧠 CONTEXT REFERENCES
PLANNING.md → tracking model, EPC usage

CLAUDE.md → atomic DB ops, click precision, typesafe patterns

M2_PHASE_01.md → CTA button and question structure

schema.prisma → Click, Offer, QuestionOffer, Session