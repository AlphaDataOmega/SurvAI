## 🚧 M3\_PHASE\_05.md – EPC-Driven Question Ordering

### FEATURE

Use EPC values to dynamically order questions for each survey session. This step will ensure that users are routed through higher-performing questions first, optimizing conversions and revenue.

This also completes the feedback loop between click tracking, EPC calculation, and question delivery.

### OBJECTIVE

Update the survey flow logic and controller to:

* Fetch all `Question` entries tied to a `Survey`
* Join on `QuestionOffer` and related `Offer.epcValue`
* Calculate or retrieve `epcScore` per question (average of linked offers)
* Return questions sorted by descending EPC
* Fall back to `Question.order` if EPCs are all 0

### DEPENDENCIES

* `epcService` from M3\_PHASE\_04
* Question and Offer Prisma models
* `SurveyController.getQuestions()` or similar handler

### INSTRUCTIONS FOR CLAUDE

* ✅ In `surveyController.ts`, update the endpoint that returns survey questions
* ✅ Create utility `getQuestionEPC(questionId: string): number` if needed
* ✅ Refactor query to fetch EPC-enhanced question data
* ✅ Sort questions dynamically based on average `Offer.epcValue`
* ✅ Fall back to static order if no EPCs available
* ✅ Add unit test for EPC sorting logic
* ✅ Add integration test to simulate a full survey session with EPC-based reordering

### 📁 FILES TO MODIFY OR CREATE

```bash
backend/src/controllers/surveyController.ts          # Modify question retrieval
backend/src/services/epcService.ts                   # Optional: helper for question EPC
tests/backend/controllers/surveyController.test.ts   # New test cases
```

### ✅ SUCCESS CRITERIA

* [ ] Survey questions are returned ordered by average EPC
* [ ] Questions without offers or EPCs fall back to static order
* [ ] EPC scores are calculated using only active offers
* [ ] Edge cases: no EPCs, some EPCs, all EPCs tested
* [ ] End-to-end test confirms ordering improves as EPCs change
* [ ] Tests validate correctness and safety
* [ ] All Necessary Documentation has been reviewed and updated and/or added

### 🧪 VALIDATION LOOP

```bash
npm run lint
npm run type-check
npm run test:unit
npm run test:integration
```

### 🧠 CONTEXT TO USE

* `PLANNING.md` – EPC defines question routing priority
* `CLAUDE.md` – Testing and structure expectations
* Prisma schema for `Question`, `Offer`, `Click`

### 📚 REFERENCES

* M3\_PHASE\_04.md – EPC calculation service
* M2\_PHASE\_02.md – SurveyController setup
* Prisma relation docs
* `prp_base.md` (PRP Base)

---
