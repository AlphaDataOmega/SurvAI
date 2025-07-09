## 🚀 M4\_PHASE\_02.md – Widget Theming & Partner Configuration

### FEATURE

Add customizable theming, partner‑level configuration, and remote initialization options to the embeddable SurvAI widget.  Partners should be able to:

1. Pass a `theme` object (colors, border radius, font family).
2. Supply a `partnerId` so analytics attribute traffic to their account.
3. Load widget via `<script>` tag with inline config or via a remote JSON config URL.

### OBJECTIVE

* Extend existing `mount(element, options)` API to accept:

  ```ts
  interface WidgetOptions {
    surveyId: string;
    partnerId?: string;
    theme?: ThemeConfig; // optionalOverrides
    configUrl?: string;  // remote JSON with WidgetOptions
  }
  ```
* If `configUrl` is provided, fetch JSON first and merge into local options.
* Apply Tailwind `theme` overrides using CSS variables within Shadow DOM.
* Send `partnerId` in all widget API calls (`/sessions`, `/track-click`).
* Update docs (`docs/WIDGET.md`) with new embed examples.

📖 **Remember:**  Check `/docs` for embed guidelines and update accordingly.

### DEPENDENCIES

* Widget scaffold from **M4\_PHASE\_01**
* Tracking endpoints must accept `partnerId` query param

### TASKS FOR CLAUDE

1. **Type Updates**

   * `shared/types/widget.ts` → add `WidgetOptions`, `ThemeConfig`.
2. **Widget Logic**

   * In `widget/index.ts`, extend `mount()` to merge remote config.
   * In `Widget.tsx`, inject CSS variables (e.g., `--survai-primary`) based on theme.
3. **API Layer**

   * Modify `widget/hooks/useWidget.ts` to include `partnerId` on calls.
4. **Docs**

   * Update `docs/WIDGET.md` with:

     * Inline config snippet
     * Remote config snippet
     * Theme override example
5. **Tests**

   * Unit: config merge, partnerId propagation, theme variables.
   * Integration: load remote config via mocked fetch.

### 📁 FILES TO CREATE / UPDATE

```bash
shared/types/widget.ts              # expand
frontend/src/widget/index.ts        # extend mount()
frontend/src/widget/Widget.tsx      # apply theme
frontend/src/widget/hooks/useWidget.ts
frontend/src/widget/utils/theme.ts  # helper
docs/WIDGET.md                      # update
examples/widget-theme-test.html     # demo page
tests/widget/options.test.ts        # unit tests
tests/widget/remoteConfig.test.ts   # fetch mock
```

### ✅ SUCCESS CRITERIA

* [ ] Partners can embed widget and pass `theme` overrides (color, radius, font).
* [ ] Widget applies overrides inside Shadow DOM without host bleed.
* [ ] `partnerId` is included in network requests.
* [ ] Remote `configUrl` JSON merges successfully, overriding inline options.
* [ ] Example HTML page renders themed widget correctly.
* [ ] All tests pass; bundle size increase ≤ +30 kB.
* [ ] All Necessary Documentation has been reviewed and updated and/or added
                    
### 🧪 VALIDATION LOOP

```bash
npm run lint
npm run type-check
npm run test:unit
npm run build:widget
open examples/widget-theme-test.html  # manual theme check
```

### GOTCHAS

* Block remote config fetch if CORS not allowed; fail gracefully.
* Validate `theme` object keys, default to safe values.
* Keep additional bundle code minimal; reuse existing util libs.

### REFERENCES

* `PLANNING.md` → Widget customization goals
* `CLAUDE.md` → file size, testing, modularity
* `/docs` → embed guide updates
* `prp_base.md` (PRP Base)
---


