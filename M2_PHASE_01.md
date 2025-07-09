## 🚀 M2\_PHASE\_01.md – Dynamic Question Engine: Offer-Based CTA Questions

### GOAL

Implement the dynamic question component system using offer-based CTA buttons, as seen in lead generation landing pages. These are not traditional questions — they’re AI-generated persuasive prompts with clickable button variants that redirect to external offers, each tracked individually for EPC performance.

### OUTCOME

* Users see a question-style component with multiple CTA buttons.
* Each button links to a destination offer and is tracked via `{click_id}` and `{survey_id}`.
* Backend provides questions and variants dynamically.
* Clicks are logged, associated to session, and ready for EPC scoring.

### 📦 FEATURES TO IMPLEMENT

#### Backend

* [ ] `GET /questions/next` – returns the next question + offer/button variant set for the session
* [ ] `POST /track-click` – logs a click with session ID, question ID, offer ID, and variant copy
* [ ] Pixel URL generator in `trackingService.ts` → returns URL like:

  ```ts
  https://tracking.domain.com/pixel?click_id={click_id}&survey_id={survey_id}
  ```
* [ ] Update `question` and `offer` models to include:

  * button copy variants (stored in JSON)
  * order priority
  * active/inactive flag

#### Frontend

* [ ] `QuestionCard.tsx` – renders prompt, subtext, CTA buttons, and a "No Thanks"
* [ ] `OfferButton.tsx` – renders individual clickable button variant (with tracking + open in new tab)
* [ ] On click:

  * Send `POST /track-click`
  * Open offer URL in new tab with appended `click_id` + `survey_id`
* [ ] Handle layout and spacing for variable button counts (Tailwind: `space-y-4` or grid layout)

### 🧪 VALIDATION

* [ ] A session retrieves a CTA-style question
* [ ] Buttons open offer links in new tabs with correct parameters
* [ ] Backend logs each click (and can be viewed in DB)
* [ ] Pixel URL is generated correctly
* [ ] Question variants rotate properly per session

### 📎 AI INTEGRATION TARGETS

* [ ] Use `question_details` to generate prompt and subtext
* [ ] Use `question_rules` to control button copy and offer links
* [ ] Generate button copy variants and test performance based on clicks

### 🔍 REFERENCE

* Visual reference: \[Attached Screenshot]
* Context: SurvAI survey questions are monetization CTAs, not traditional forms
* CLAUDE.md: Follow conventions for modularity, testing, and separation of logic
* PLANNING.md: Component structure and endpoint architecture

### 🧱 FILES TO TOUCH

```ts
frontend/src/components/survey/QuestionCard.tsx
frontend/src/components/survey/OfferButton.tsx
frontend/src/hooks/useSurvey.ts
frontend/src/services/tracking.ts
backend/src/routes/questions.ts
backend/src/routes/tracking.ts
backend/src/services/trackingService.ts
backend/src/controllers/questionController.ts
backend/src/controllers/trackingController.ts
backend/prisma/schema.prisma
```

### ✅ SUCCESS CRITERIA

* [ ] Component renders like the screenshot
* [ ] Links track properly with click/session/variant data
* [ ] Pixel URLs resolve with expected IDs
* [ ] Offers can be dynamically rotated by backend/AI
* [ ] EPC data can be derived from click logs
* [ ] Documentation updated with new question system
