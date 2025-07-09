## 🚀 M4\_PHASE\_01.md – Embeddable Widget Scaffold

### FEATURE

Kick‑off Milestone 4 by scaffolding an embeddable survey widget that external partners can drop onto any webpage via a single `<script>` tag.  The widget must load in isolation (UMD/IIFE bundle), fetch the first question from SurvAI’s API, display CTA buttons, and track clicks with `{click_id}` + `{survey_id}` parameters.

### OBJECTIVE

Build a minimal but functional widget bundle:

* Packages React components & state into a self‑contained module in `/widget` directory.
* Compiles to `dist/survai‑widget.js` (UMD) via Vite library build.
* Exports global `SurvAIWidget.mount(element, options)` API.
* Handles session bootstrap (`POST /sessions`) and first question fetch.
* Opens offer links in new tab and calls `/track-click`.

📖 **Remember:** check the `/docs` folder (e.g. `docs/WIDGET.md` to be added) for embed instructions & more context.

### DEPENDENCIES

* Question fetch endpoint (`/api/questions/next`)
* Tracking endpoint (`/api/track-click`)
* Session endpoint (`/api/sessions`)

### INSTRUCTIONS FOR CLAUDE

1. **Directory & Build Config**

   * Create `frontend/src/widget/` directory.
   * Add `vite.widget.config.ts` (library mode) to output UMD bundle `survai-widget.js`.
2. **Widget Code**

   * `widget/index.ts` → entry point exporting `mount()`.
   * `widget/Widget.tsx` → minimal React component rendering QuestionCard.
   * Use a Shadow DOM root to avoid CSS bleed.
3. **Loader Script** (optional)

   * `widget/loader.js` → tiny (\~30 LOC) script tag helper that injects bundle.
4. **Type Definitions**

   * `shared/types/widget.ts` for mount options (e.g. `surveyId`, theme).
5. **Docs**

   * Create `docs/WIDGET.md` with embed guide & example HTML snippet.
6. **Tests & Validation**

   * Unit test `mount()` and API calls with Jest + jsdom.
   * Manual test page `examples/widget-test.html`.

### 📁 FILES TO CREATE / UPDATE

```bash
frontend/src/widget/index.ts
frontend/src/widget/Widget.tsx
frontend/src/widget/hooks/useWidget.ts
vite.widget.config.ts
widget/loader.js (optional)
docs/WIDGET.md
examples/widget-test.html
shared/types/widget.ts
tests/widget/mount.test.ts
```

### ✅ SUCCESS CRITERIA

* [ ] Running `npm run build:widget` outputs `dist/survai-widget.js` (UMD) ≤ 250 kB.
* [ ] Example HTML page embeds widget and shows first question.
* [ ] Click opens offer in new tab and fires `/track-click`.
* [ ] Shadow DOM prevents style bleed (e.g., inspecting host page CSS shows no collisions).
* [ ] Unit tests for mount lifecycle & API mocks pass.
* [ ] Documentation in `docs/WIDGET.md` explains embed, props, and versioning.
* [ ] All Necessary Documentation has been reviewed and updated and/or added

### 🧪 VALIDATION LOOP

```bash
npm run lint
npm run type-check
npm run test:unit
npm run build:widget
open examples/widget-test.html  # manual visual check
```

### GOTCHAS

* Don’t pull large chunks of the main app; keep widget bundle slim.
* Avoid globals; expose only `SurvAIWidget`.
* Ensure CORS headers set on API for external domains.
* Widget must gracefully fail if API unreachable (show fallback message).

### REFERENCES

* `PLANNING.md` – Embeddable Widget module
* `CLAUDE.md` – bundle size & file structure rules
* `/docs` folder – embed guidelines & any future design docs
* `prp_base.md` (PRP Base)
---

