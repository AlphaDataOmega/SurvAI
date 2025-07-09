## 🚀 M4\_PHASE\_04.md – Production Build & CDN Deployment Pipeline for Widget

### FEATURE

Set up an automated production build and deployment pipeline that:

1. Produces a minified, versioned `survai-widget.js` bundle.
2. Publishes the file to SurvAI’s CDN bucket (e.g., Google Cloud Storage + CloudFlare).
3. Generates an integrity hash + embed snippet and updates `/docs/WIDGET.md`.
4. Adds semantic versioning (e.g., `1.0.0`) with Git tags triggered by CI.

### OBJECTIVE

Enable friction‑free releases of the widget so any embed on partner sites can hot‑swap to the latest stable version (or lock to a specific version).

### DEPENDENCIES

* Widget build scripts from **M4\_PHASE\_01** and **02**
* CI environment (GitHub Actions or similar) with secret access keys

### TASKS FOR CLAUDE

1. **Build Script**

   * Add `npm run build:widget:prod` using Vite in library mode + `rollup-plugin-terser`.
2. **CI Workflow**

   * `.github/workflows/widget-deploy.yml` that:

     1. Runs `build:widget:prod`.
     2. Uploads `dist/survai-widget.js` to S3 bucket `survai-widget/$VERSION/`.
     3. Invalidate CloudFront distribution.
     4. Creates Git tag `widget-v$VERSION`.
3. **Integrity Hash**

   * Generate SHA‑384 hash of bundle; output to `dist/survai-widget.js.sha384`.
   * Update `/docs/WIDGET.md` with new embed snippet showing:

     ```html
     <script src="https://cdn.survai.app/widget/1.0.0/survai-widget.js"
             integrity="sha384-..." crossorigin="anonymous"></script>
     ```
4. **Docs Automation**

   * Add `scripts/update-widget-doc.mjs` that patches `docs/WIDGET.md` with the latest version + hash.

### 📁 FILES TO CREATE / UPDATE

```bash
package.json                     # add build:widget:prod script
vite.widget.config.ts            # ensure minification + target ES2017
.github/workflows/widget-deploy.yml
scripts/update-widget-doc.mjs
docs/WIDGET.md                   # auto‑patched by script
```

### ✅ SUCCESS CRITERIA

* [ ] Running CI on `main` with `WIDGET_RELEASE=true` builds and uploads bundle.
* [ ] CDN URL resolves and serves minified script (<90 kB gzipped).
* [ ] SHA‑384 integrity hash matches deployed file.
* [ ] `/docs/WIDGET.md` commit auto‑updates embed snippet.
* [ ] Git tag `widget-vX.Y.Z` is created.

### 🧪 VALIDATION LOOP

```bash
npm run lint
npm run type-check
npm run build:widget:prod
shasum -a 384 dist/survai-widget.js   # verify hash output
```

### GOTCHAS

* Ensure AWS credentials are stored as encrypted GitHub secrets.
* Fail CI if bundle > 100 kB gzipped.
* Always bump semver before deploying.

### REFERENCES

* `PLANNING.md` → Deployment & CDN goals
* `CLAUDE.md` → CI & modularity rules
* Google Cloud Storage + CloudFlare docs
* prp_base.md (PRP Base)
---
