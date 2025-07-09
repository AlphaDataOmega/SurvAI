# Widget Production Build & CDN Deployment Pipeline

## Goal
Set up an automated production build and deployment pipeline that produces a minified, versioned `survai-widget.js` bundle, publishes it to a CDN with integrity hashes, and enables friction-free releases with semantic versioning.

## Why
- **Business value**: Enable partner sites to hot-swap to latest stable widget versions or lock to specific versions
- **Integration**: Seamless widget distribution via CDN with integrity verification
- **Problems solved**: Manual deployment friction, version management, and secure distribution for partner integrations

## What
Production pipeline that:
1. Builds minified, versioned widget bundle with terser optimization
2. Publishes to Google Cloud Storage bucket with CloudFlare invalidation
3. Generates SHA-384 integrity hashes for security
4. Auto-updates documentation with new embed snippets
5. Creates semantic version Git tags for releases
6. Validates bundle size limits (<90kB gzipped)

### Success Criteria
- [ ] CI workflow builds and deploys widget bundle on `WIDGET_RELEASE=true`
- [ ] CDN URL serves minified bundle under 90kB gzipped
- [ ] SHA-384 integrity hash matches deployed file
- [ ] `/docs/WIDGET.md` auto-updates with new embed snippet
- [ ] Git tag `widget-vX.Y.Z` created on successful deployment
- [ ] Bundle validation fails CI if size exceeds 100kB gzipped

## All Needed Context

### Documentation & References
```yaml
# MUST READ - Include these in your context window
- url: https://docs.github.com/en/actions/automating-builds-and-tests/building-and-testing-nodejs
  why: GitHub Actions Node.js workflow patterns for CI/CD
  
- url: https://cloud.google.com/storage/docs/uploading-objects
  section: Google Cloud Storage upload via gsutil
  critical: Google Cloud Storage credentials must be stored as encrypted GitHub secrets

- url: https://cloud.google.com/storage/docs/deleting-objects
  section: Google Cloud Storage object deletion
  critical: Object deletion required for immediate CDN updates

- url: https://cloudflare.com/docs/cdn/cache-invalidation/
  section: CloudFlare cache invalidation
  critical: Cache invalidation required for immediate CDN updates

- url: https://vitejs.dev/guide/build.html#library-mode
  section: Vite library mode and production builds
  critical: Production builds must use terser with tree-shaking

- url: https://developer.mozilla.org/en-US/docs/Web/Security/Subresource_Integrity
  section: SHA-384 integrity hash generation
  critical: Integrity hashes prevent tampering and ensure security

- file: /home/ado/SurvAI.3.0/vite.widget.config.ts
  why: Existing widget build configuration to extend for production
  
- file: /home/ado/SurvAI.3.0/package.json
  why: Current build scripts and dependencies pattern
  
- file: /home/ado/SurvAI.3.0/docs/WIDGET.md
  why: Documentation pattern for embed snippets to auto-update

- docfile: /home/ado/SurvAI.3.0/M4_PHASE_04.md
  why: Complete feature requirements and success criteria
```

### Current Codebase Structure
```bash
/home/ado/SurvAI.3.0/
├── package.json                    # Root package with build scripts
├── vite.widget.config.ts           # Widget build configuration
├── frontend/
│   └── src/
│       └── widget/                 # Widget source code
│           ├── index.ts
│           ├── Widget.tsx
│           ├── hooks/useWidget.ts
│           └── utils/
│               ├── theme.ts
│               ├── remoteConfig.ts
│               └── ClickQueue.ts
├── docs/
│   └── WIDGET.md                   # Widget documentation to update
├── dist/                           # Build output directory
│   └── widget/
│       └── survai-widget.js        # Current build output
├── examples/
│   └── widget-test.html            # Widget examples
└── tests/
    └── frontend/
        └── widget*                 # Widget tests
```

### Desired Codebase Structure with new files
```bash
/home/ado/SurvAI.3.0/
├── package.json                    # ADD: build:widget:prod script
├── vite.widget.config.ts           # MODIFY: ensure production optimizations
├── .github/
│   └── workflows/
│       └── widget-deploy.yml       # CREATE: CI/CD workflow
├── scripts/
│   └── update-widget-doc.mjs       # CREATE: Documentation updater
├── dist/
│   ├── survai-widget.js            # Output: versioned bundle
│   └── survai-widget.js.sha384     # Output: integrity hash
└── docs/
    └── WIDGET.md                   # MODIFY: auto-updated embed snippet
```

### Known Gotchas & Library Quirks
```javascript
// CRITICAL: Vite library mode requires explicit external dependencies
// Example: React must be external to prevent bundle bloat
rollupOptions: {
  external: ['react', 'react-dom']
}

// CRITICAL: Terser must drop console/debugger in production
terserOptions: {
  compress: {
    drop_console: true,
    drop_debugger: true
  }
}

// CRITICAL: Google Cloud Storage requires specific credential environment variables
// GitHub Actions secrets: GOOGLE_CLOUD_STORAGE_KEY, GOOGLE_CLOUD_STORAGE_BUCKET

// CRITICAL: Bundle size validation must use gzipped size not raw size
// Use: gzip -c dist/survai-widget.js | wc -c (not just file size)

// CRITICAL: CloudFlare invalidation can take 5-15 minutes
// CI should not wait for invalidation completion, just trigger it

// CRITICAL: GitHub Actions requires specific permissions for tagging
// Use: GITHUB_TOKEN with contents: write permissions

// CRITICAL: Semantic versioning must be incremented before deployment
// Fail CI if version in package.json hasn't changed since last release
```

## Implementation Blueprint

### Data Models and Structure
```typescript
// Version management structure
interface VersionConfig {
  version: string;      // semver from package.json
  gitTag: string;       // git tag format: widget-v1.0.0
  cdnPath: string;      // S3 path: widget/1.0.0/survai-widget.js
  integrityHash: string; // SHA-384 hash
}

// Build output structure
interface BuildOutput {
  bundlePath: string;     // dist/survai-widget.js
  bundleSize: number;     // file size in bytes
  gzipSize: number;       // gzipped size in bytes
  integrityHash: string;  // SHA-384 hash
}
```

### List of tasks to be completed in order

```yaml
Task 1: 
CREATE package.json build script:
  - ADD "build:widget:prod" script using existing vite.widget.config.ts
  - ENSURE production optimizations enabled
  - PRESERVE existing "build:widget" for development

Task 2:
MODIFY vite.widget.config.ts:
  - ENSURE minify: 'terser' is enabled
  - ENSURE terserOptions drops console/debugger
  - ENSURE target: 'es2017' for compatibility
  - ENSURE rollupOptions external dependencies
  - PRESERVE existing configuration structure

Task 3:
CREATE .github/workflows/widget-deploy.yml:
  - TRIGGER on push to main with WIDGET_RELEASE=true environment
  - SETUP Node.js 18 environment
  - RUN npm install and build:widget:prod
  - VALIDATE bundle size < 100kB gzipped (fail if exceeded)
  - GENERATE SHA-384 integrity hash
  - UPLOAD to S3 bucket survai-widget/$VERSION/
  - INVALIDATE CloudFlare distribution
  - CREATE git tag widget-v$VERSION
  - CALL update-widget-doc.mjs script

Task 4:
CREATE scripts/update-widget-doc.mjs:
  - READ current package.json version
  - READ generated SHA-384 hash from dist/survai-widget.js.sha384
  - PATCH docs/WIDGET.md with new embed snippet
  - REPLACE existing CDN URL and integrity hash
  - PRESERVE existing documentation structure
  - COMMIT changes to git with automated message

Task 5:
CREATE bundle validation logic:
  - CALCULATE gzipped bundle size
  - FAIL CI if bundle exceeds 100kB gzipped
  - OUTPUT size metrics to GitHub Actions summary
  - GENERATE size comparison with previous build

Task 6:
UPDATE docs/WIDGET.md automation:
  - IDENTIFY embed snippet section to update
  - REPLACE version-specific URLs and integrity hashes
  - MAINTAIN backward compatibility examples
  - PRESERVE existing documentation formatting
```

### Per-task Pseudocode

```javascript
// Task 1: Build script enhancement
// package.json
{
  "scripts": {
    "build:widget:prod": "NODE_ENV=production vite build --config vite.widget.config.ts"
  }
}

// Task 2: Production vite config
// vite.widget.config.ts
export default defineConfig({
  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    rollupOptions: {
      external: ['react', 'react-dom']
    }
  }
})

// Task 3: GitHub Actions workflow
// .github/workflows/widget-deploy.yml
steps:
  - name: Build widget
    run: |
      npm run build:widget:prod
      gzip -c dist/survai-widget.js | wc -c > bundle-size.txt
      
  - name: Validate bundle size
    run: |
      SIZE=$(cat bundle-size.txt)
      if [ $SIZE -gt 102400 ]; then
        echo "Bundle size $SIZE exceeds 100kB limit"
        exit 1
      fi

// Task 4: Documentation updater
// scripts/update-widget-doc.mjs
import { readFileSync, writeFileSync } from 'fs';
import { createHash } from 'crypto';

const updateWidgetDoc = () => {
  const bundle = readFileSync('dist/survai-widget.js');
  const hash = createHash('sha384').update(bundle).digest('base64');
  const version = JSON.parse(readFileSync('package.json')).version;
  
  let docs = readFileSync('docs/WIDGET.md', 'utf8');
  docs = docs.replace(
    /src="https:\/\/cdn\.survai\.app\/widget\/[\d\.]+\/survai-widget\.js"/g,
    `src="https://cdn.survai.app/widget/${version}/survai-widget.js"`
  );
  docs = docs.replace(
    /integrity="sha384-[^"]+"/g,
    `integrity="sha384-${hash}"`
  );
  
  writeFileSync('docs/WIDGET.md', docs);
  writeFileSync('dist/survai-widget.js.sha384', hash);
};
```

### Integration Points
```yaml
GITHUB_ACTIONS:
  - secrets: "GOOGLE_CLOUD_STORAGE_KEY, GOOGLE_CLOUD_STORAGE_BUCKET"
  - permissions: "contents: write (for git tagging)"
  - environment: "WIDGET_RELEASE=true (trigger condition)"
  
GOOGLE_CLOUD_STORAGE:
  - bucket: "survai-widget"
  - path: "widget/$VERSION/survai-widget.js"
  - permissions: "public-read for CDN access"
  
CLOUDFLARE:
  - distribution: "configured for survai-widget bucket"
  - invalidation: "path: /widget/*, automatic on deployment"
  
PACKAGE_JSON:
  - version: "must be incremented before deployment"
  - script: "build:widget:prod for production builds"
  
DOCUMENTATION:
  - file: "docs/WIDGET.md"
  - update: "automated CDN URLs and integrity hashes"
```

## Validation Loop

### Level 1: Syntax & Style
```bash
# Run these FIRST - fix any errors before proceeding
npm run lint                         # ESLint check
npm run type-check                   # TypeScript validation
# Expected: No errors. If errors, READ the error and fix.
```

### Level 2: Build and Bundle Tests
```bash
# Test production build
npm run build:widget:prod

# Validate bundle size
ls -la dist/survai-widget.js        # Check file exists
gzip -c dist/survai-widget.js | wc -c  # Check gzipped size < 90kB

# Test integrity hash generation
shasum -a 384 dist/survai-widget.js  # Generate SHA-384 hash

# Expected: Bundle exists, size under limit, hash generates correctly
```

### Level 3: CI/CD Pipeline Test
```bash
# Test GitHub Actions workflow (local simulation)
export WIDGET_RELEASE=true
export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test
export AWS_REGION=us-east-1

# Run build steps
npm install
npm run build:widget:prod

# Test documentation update
node scripts/update-widget-doc.mjs

# Expected: All steps complete without errors
```

### Level 4: Integration Test
```bash
# Test CDN deployment (manual verification)
# 1. Deploy to staging S3 bucket
aws s3 cp dist/survai-widget.js s3://survai-widget-staging/widget/test/

# 2. Test CDN access
curl -I https://cdn-staging.survai.app/widget/test/survai-widget.js
# Expected: 200 OK with correct content-type

# 3. Verify integrity hash
curl -s https://cdn-staging.survai.app/widget/test/survai-widget.js | shasum -a 384
# Expected: Hash matches generated hash
```

## Final Validation Checklist
- [ ] All tests pass: `npm run test`
- [ ] No linting errors: `npm run lint`
- [ ] No type errors: `npm run type-check`
- [ ] Production build succeeds: `npm run build:widget:prod`
- [ ] Bundle size under 90kB gzipped: `gzip -c dist/survai-widget.js | wc -c`
- [ ] SHA-384 hash generates correctly: `shasum -a 384 dist/survai-widget.js`
- [ ] Documentation update script works: `node scripts/update-widget-doc.mjs`
- [ ] GitHub Actions workflow syntax valid: `yamllint .github/workflows/widget-deploy.yml`
- [ ] All required environment variables documented
- [ ] Error handling covers all failure scenarios

---

## Anti-Patterns to Avoid
- ❌ Don't hardcode version numbers - read from package.json
- ❌ Don't skip bundle size validation - always enforce limits
- ❌ Don't ignore Google Cloud Storage credential security - use GitHub secrets
- ❌ Don't deploy without integrity hash - security requirement
- ❌ Don't skip CloudFlare invalidation - stale cache breaks updates
- ❌ Don't commit Google Cloud Storage credentials - use environment variables only
- ❌ Don't tag releases without version increment - prevents duplicate deploys
- ❌ Don't assume Google Cloud Storage upload success - add error handling and retries

## External Research Context

### CDN and S3 Deployment
- **Google Cloud Storage CLI**: https://cloud.google.com/storage/docs/uploading-objects
- **CloudFlare Invalidation**: https://cloudflare.com/docs/cdn/cache-invalidation/
- **GitHub Actions AWS**: https://github.com/aws-actions/configure-aws-credentials

### Build Optimization
- **Vite Production Build**: https://vitejs.dev/guide/build.html#customizing-the-build
- **Terser Options**: https://terser.org/docs/api-reference#compress-options
- **Bundle Size Analysis**: https://github.com/webpack-contrib/webpack-bundle-analyzer

### Security and Integrity
- **SRI (Subresource Integrity)**: https://developer.mozilla.org/en-US/docs/Web/Security/Subresource_Integrity
- **SHA-384 Generation**: https://nodejs.org/api/crypto.html#crypto_crypto_createhash_algorithm_options

### CI/CD Best Practices
- **GitHub Actions Node.js**: https://docs.github.com/en/actions/automating-builds-and-tests/building-and-testing-nodejs
- **Semantic Versioning**: https://semver.org/
- **Git Tagging**: https://git-scm.com/book/en/v2/Git-Basics-Tagging

## Confidence Score: 9/10

This PRP provides comprehensive context for one-pass implementation with:
- ✅ Complete codebase analysis and existing patterns
- ✅ Detailed task breakdown with specific file modifications
- ✅ Real-world AWS/GitHub Actions integration examples
- ✅ Comprehensive validation loops with executable commands
- ✅ Security best practices and error handling
- ✅ External documentation references for implementation details
- ✅ Clear anti-patterns and gotchas from production experience

The implementation should succeed in one pass with proper context and validation gates.