## 🚧 M3\_PHASE\_02.md – AI Integration Service (OpenAI + Ollama)

### FEATURE

Create a unified AI integration layer to support OpenAI and Ollama for question generation and future use cases. The system must allow fallback from OpenAI to Ollama if OpenAI fails, and include basic prompt scaffolding for financial assistance survey content generation. This module will power AI-driven copy and adaptive question logic.

### OBJECTIVE

Establish a modular, extendable AI service in the backend:

* Supports multiple providers (OpenAI, Ollama)
* Includes fallback logic
* Offers basic function: `generateQuestion(context: QuestionContext): Promise<GeneratedQuestion>`
* Logs provider performance
* Includes validation and unit tests

### 🧠 CONTEXT FROM PLANNING.md

* SurvAI uses AI to generate survey copy and optimize flow
* AI content generation is non-blocking (calls async)
* Supports OpenAI and Ollama interchangeably (local fallback)
* Responses must be sanitized before DB insertion

### 🔍 FILES TO GENERATE

```ts
backend/src/services/aiService.ts         # Main service
backend/src/types/ai.ts                   # Type definitions
backend/tests/services/aiService.test.ts  # Unit tests
```

### ✅ TASKS

* [ ] Create `aiService.ts` with provider-agnostic class `AIService`
* [ ] Implement `generateQuestion()` with provider fallback
* [ ] Add `sanitizeContent()` utility function to strip invalid text
* [ ] Write unit tests for:

  * Successful generation via OpenAI
  * Fallback to Ollama on OpenAI failure
  * Invalid response handling
* [ ] Log response times and errors per provider
* [ ] Use `load_env()` to inject API keys and base URLs
* [ ] Document provider config in `.env.example`

### 🔐 ENVIRONMENT VARIABLES

```env
OPENAI_API_KEY=your_openai_api_key_here
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=(Install Ollama and Research the best Model for this hardware and use case)
```

### 📎 VALIDATION LOOP

```bash
npm run type-check
npm run test:unit
```

* Tests must pass for both providers
* Fallback logic must be verified
* Output must match `GeneratedQuestion` type

### 📚 DOCUMENTATION

Update these:

* [ ] `README.md` – Add AI config setup section
* [ ] `docs/API.md` – Add description of AI generation API (if exposed)
* [ ] `CLAUDE.md` – Add rule: "Always sanitize AI responses before use"

### 📌 EXAMPLE PROMPT

```json
{
  "system": "Generate engaging financial assistance survey questions.",
  "user": "Context: { user_income: '<50k', employment: 'self-employed' }"
}
```

---

### 🚨 GOTCHAS

* ❗ OpenAI and Ollama have different error formats – normalize them
* ❗ Ollama returns slower – ensure fallback doesn’t hang UX
* ❗ All AI output must be sanitized before storage
* ❗ Do not hardcode any provider-specific logic outside `AIService`

### ✅ EXIT CRITERIA

* AIService can generate output with fallback
* Providers are configurable via `.env`
* Unit tests verify all key paths
* Docs updated
* Claude can reuse this module in M3\_PHASE\_03
