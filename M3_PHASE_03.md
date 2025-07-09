## 🚧 M3\_PHASE\_03.md – Question Controller + AI Integration

### FEATURE

Wire up `questionController` to utilize the newly created `AIService` for generating dynamic survey questions. Route all relevant question-generation logic through the service and begin preparing for EPC-aware ordering. This will include endpoints for:

* Creating questions (with optional AI-generated copy)
* Updating questions
* Fetching ordered question lists per survey

Also includes Zod validation and unit tests.

### OBJECTIVE

Provide full controller logic and routing for managing survey questions, incorporating AI-generated content, and returning ordered lists optimized for EPC.

### DEPENDENCIES

* `AIService` from M3\_PHASE\_02
* Prisma models: `Survey`, `Question`, `QuestionOffer`
* EPC logic stubbed or mocked for now (will connect later)

### INSTRUCTIONS FOR CLAUDE

* ✅ Use `AIService.generateQuestion()` if `useAI` flag is true during creation
* ✅ Add `/questions/generate` route that supports both static and dynamic generation
* ✅ Return EPC-ordered questions when hitting `/questions/:surveyId`
* ✅ Include tests for controller + integration routes
* ✅ Input validation via `zod`
* ⚠️ Do not generate EPC logic yet — stub only

### 📁 FILES TO MODIFY OR CREATE

```bash
backend/src/controllers/questionController.ts    # New
backend/src/routes/questions.ts                   # New
backend/src/validators/questionValidator.ts       # New
backend/src/services/epcService.ts                # (stub function)
tests/backend/controllers/questionController.test.ts
```

### ✅ SUCCESS CRITERIA

✅ SUCCESS CRITERIA
 API route POST /questions/generate creates a new question using either:

 Provided static input, or

 AI-generated copy via AIService.generateQuestion()

 API route GET /questions/:surveyId returns all active questions for a given survey:

 Questions are ordered by epcScore descending (mocked/stubbed for now)

 API route PUT /questions/:id allows updates to an existing question

 All routes validate input using zod schemas in questionValidator.ts

 Unit tests exist for:

 Happy path creation (AI and static)

 Update functionality

 Fetching and ordering

 Failure cases (invalid input, missing data, etc.)

 Stub exists in epcService.ts for future EPC logic

 All controller logic lives in questionController.ts

 Code passes:

npm run lint

npm run type-check

npm run test:unit

### 🧪 VALIDATION LOOP

```bash
npm run type-check
npm run lint
npm run test:unit
curl http://localhost:3000/api/questions/:surveyId   # Returns ordered questions
```

### 🧠 CONTEXT TO USE

* Use the `generateQuestion(context)` method from M3\_PHASE\_02.
* Use mock data or stubs for EPC ordering.
* Use Prisma's `orderBy` and relations loading.

### 📚 REFERENCES

* `PLANNING.md` (QuestionController responsibilities)
* `CLAUDE.md` (file structure + modularity rules)
* `schema.prisma` (Survey + Question relations)
* M3\_PHASE\_02.md (AIService usage)
* `prp_base.md` (PRP Base)
---
