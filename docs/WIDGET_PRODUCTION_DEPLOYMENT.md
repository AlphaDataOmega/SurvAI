# 🚀 Widget Production Deployment Pipeline

## Overview

The SurvAI widget production deployment pipeline provides automated build, validation, and CDN deployment for embeddable widgets. This ensures consistent, secure, and optimized widget distribution with semantic versioning and integrity verification.

## Pipeline Features

### 🔄 Automated Deployment
- **Trigger**: Commits containing `WIDGET_RELEASE=true` in the commit message
- **Manual Trigger**: GitHub Actions workflow_dispatch with force deployment option
- **Version Management**: Automatic semantic versioning with git tags
- **Rollback Support**: Previous versions remain available on CDN

### 📦 Production Build
- **Bundle Optimization**: Terser minification with tree-shaking
- **Target Compatibility**: ES2017 for broad browser support
- **External Dependencies**: React and ReactDOM as external dependencies
- **Source Maps**: Generated for debugging (development only)

### 📊 Bundle Validation
- **Size Limits**: Fails deployment if bundle exceeds 100kB gzipped
- **Current Size**: 7.4kB gzipped (well under limit)
- **Performance Metrics**: Bundle size tracking and reporting
- **Size Comparison**: Comparison with previous builds

### 🔐 Security Features
- **Integrity Hashes**: SHA-384 hashes for all deployed bundles
- **Secure Distribution**: HTTPS-only CDN distribution
- **Cache Headers**: Proper cache control for performance and security
- **Version Isolation**: Each version deployed to separate CDN path

### ☁️ CDN Distribution
- **Google Cloud Storage**: Primary storage backend
- **CloudFlare**: CDN and cache invalidation
- **Global Distribution**: Worldwide CDN for optimal performance
- **High Availability**: Redundant distribution for reliability

## Deployment Process

### 1. Pre-Deployment Checks
```bash
# Version validation
- Check if version in package.json has been incremented
- Verify no duplicate git tags exist
- Validate commit message contains WIDGET_RELEASE=true

# Build validation
- Run ESLint for code quality
- Run TypeScript compiler for type checking
- Execute production build process
```

### 2. Bundle Creation
```bash
# Production build
npm run build:widget:prod

# Build outputs
- dist/survai-widget.umd.js      # Minified UMD bundle
- dist/survai-widget.umd.js.sha384  # SHA-384 integrity hash
```

### 3. Size Validation
```bash
# Gzipped size check
BUNDLE_SIZE=$(gzip -c dist/survai-widget.umd.js | wc -c)

# Validation thresholds
- Warning: 90kB gzipped
- Failure: 100kB gzipped
- Current: 7.4kB gzipped ✅
```

### 4. Security Hash Generation
```bash
# Generate SHA-384 hash
shasum -a 384 dist/survai-widget.umd.js | cut -d' ' -f1 | base64

# Example output
uB+JC2m2xgdhhUPqO+lrgQAt7ljODakP/CgP60RtqF2cL4mpQjlVtjZ6RyL+lbWk
```

### 5. CDN Deployment
```bash
# Upload to Google Cloud Storage
gsutil cp dist/survai-widget.umd.js gs://survai-widget-bucket/widget/1.0.0/survai-widget.js
gsutil cp dist/survai-widget.umd.js.sha384 gs://survai-widget-bucket/widget/1.0.0/survai-widget.js.sha384

# Set public permissions
gsutil acl ch -u AllUsers:R gs://survai-widget-bucket/widget/1.0.0/survai-widget.js
```

### 6. Cache Invalidation
```bash
# CloudFlare cache invalidation
curl -X POST "https://api.cloudflare.com/client/v4/zones/ZONE_ID/purge_cache" \
  -H "Authorization: Bearer API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{"files":["https://cdn.survai.app/widget/1.0.0/survai-widget.js"]}'
```

### 7. Version Tagging
```bash
# Create semantic version tag
git tag -a "widget-v1.0.0" -m "Widget release v1.0.0

Bundle size: 7434 bytes (gzipped)
SHA-384: uB+JC2m2xgdhhUPqO+lrgQAt7ljODakP/CgP60RtqF2cL4mpQjlVtjZ6RyL+lbWk
CDN URL: https://cdn.survai.app/widget/1.0.0/survai-widget.js

🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>"
```

### 8. Documentation Update
```bash
# Automatic documentation updates
node scripts/update-widget-doc.mjs

# Updates include:
- CDN URLs in docs/WIDGET.md
- SHA-384 integrity hashes
- Version references
- Bundle size information
```

## GitHub Actions Workflow

### Configuration
```yaml
name: Widget Production Deploy

on:
  push:
    branches: [ main ]
  workflow_dispatch:
    inputs:
      force_deploy:
        description: 'Force deployment regardless of WIDGET_RELEASE'
        required: false
        default: false
        type: boolean

permissions:
  contents: write
  id-token: write
```

### Environment Variables
```bash
# Required secrets
GOOGLE_CLOUD_STORAGE_KEY      # Service account key JSON
GOOGLE_CLOUD_STORAGE_BUCKET   # Storage bucket name
GOOGLE_CLOUD_PROJECT_ID       # GCP project ID
CLOUDFLARE_ZONE_ID           # CloudFlare zone identifier
CLOUDFLARE_API_TOKEN         # CloudFlare API token
```

### Workflow Steps
1. **Checkout Repository**: Clone code with full history
2. **Setup Node.js**: Install Node.js 18 with npm cache
3. **Install Dependencies**: Run npm install
4. **Quality Checks**: ESLint and TypeScript validation
5. **Build Production Bundle**: Generate optimized widget
6. **Validate Bundle Size**: Check size limits
7. **Generate Security Hash**: Create SHA-384 integrity hash
8. **Deploy to CDN**: Upload to Google Cloud Storage
9. **Invalidate Cache**: Clear CloudFlare cache
10. **Create Git Tag**: Semantic version tagging
11. **Update Documentation**: Automatic doc updates
12. **Deployment Summary**: Generate deployment report

## CDN Structure

### URL Pattern
```
https://cdn.survai.app/widget/{version}/survai-widget.js
https://cdn.survai.app/widget/{version}/survai-widget.js.sha384
```

### Examples
```
# Current version
https://cdn.survai.app/widget/1.0.0/survai-widget.js
https://cdn.survai.app/widget/1.0.0/survai-widget.js.sha384

# Future versions
https://cdn.survai.app/widget/1.1.0/survai-widget.js
https://cdn.survai.app/widget/2.0.0/survai-widget.js
```

### Cache Configuration
```http
Cache-Control: public, max-age=31536000  # 1 year
Content-Type: application/javascript
Access-Control-Allow-Origin: *
```

## Integration Examples

### Basic Integration
```html
<!-- Load React dependencies -->
<script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
<script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>

<!-- Load SurvAI Widget with integrity hash -->
<script src="https://cdn.survai.app/widget/1.0.0/survai-widget.js" 
        integrity="sha384-uB+JC2m2xgdhhUPqO+lrgQAt7ljODakP/CgP60RtqF2cL4mpQjlVtjZ6RyL+lbWk" 
        crossorigin="anonymous"></script>
```

### Version Pinning
```html
<!-- Pin to specific version for stability -->
<script src="https://cdn.survai.app/widget/1.0.0/survai-widget.js" 
        integrity="sha384-uB+JC2m2xgdhhUPqO+lrgQAt7ljODakP/CgP60RtqF2cL4mpQjlVtjZ6RyL+lbWk" 
        crossorigin="anonymous"></script>
```

### Latest Version (Not Recommended)
```html
<!-- Not recommended for production -->
<script src="https://cdn.survai.app/widget/latest/survai-widget.js"></script>
```

## Security Considerations

### Subresource Integrity (SRI)
- **Always use integrity hashes** in production
- **Verify hash matches** the deployed bundle
- **Use crossorigin="anonymous"** for CORS safety

### Content Security Policy
```http
Content-Security-Policy: script-src 'self' https://cdn.survai.app; connect-src 'self' https://api.survai.com;
```

### HTTPS Only
- **All CDN URLs use HTTPS** for secure distribution
- **No HTTP fallback** to prevent downgrade attacks
- **HSTS headers** enforce secure connections

## Monitoring and Metrics

### Bundle Size Tracking
```bash
# Historical size tracking
v1.0.0: 7.4kB gzipped
v1.1.0: TBD
v2.0.0: TBD
```

### Performance Metrics
- **Load Time**: CDN global distribution for optimal performance
- **Cache Hit Rate**: CloudFlare edge caching
- **Compression**: Gzip compression for all assets
- **Availability**: 99.9% uptime SLA

### Error Tracking
- **Build Failures**: Automated alerts for failed deployments
- **Size Violations**: Immediate failure for oversized bundles
- **CDN Errors**: Monitoring for upload and distribution issues

## Troubleshooting

### Common Issues

#### Bundle Size Exceeded
```bash
# Error: Bundle size exceeds 100kB limit
# Solution: Optimize bundle or increase limit

# Check current size
gzip -c dist/survai-widget.umd.js | wc -c

# Analyze bundle composition
npm run build:widget:prod -- --analyze
```

#### Version Already Exists
```bash
# Error: Git tag already exists
# Solution: Increment version in package.json

# Check existing tags
git tag -l "widget-v*"

# Increment version
npm version patch  # or minor/major
```

#### CDN Upload Failed
```bash
# Error: Google Cloud Storage upload failed
# Solution: Check credentials and permissions

# Verify credentials
gcloud auth application-default login

# Test upload
gsutil cp test-file.txt gs://bucket-name/
```

#### Cache Not Invalidated
```bash
# Error: Old version still served
# Solution: Manual cache invalidation

# Check cache headers
curl -I https://cdn.survai.app/widget/1.0.0/survai-widget.js

# Manual invalidation
curl -X POST "https://api.cloudflare.com/client/v4/zones/ZONE_ID/purge_cache" \
  -H "Authorization: Bearer API_TOKEN" \
  --data '{"purge_everything":true}'
```

## Best Practices

### Version Management
- **Semantic Versioning**: Follow semver for all releases
- **Increment Before Deploy**: Always increment version first
- **Tag Consistently**: Use consistent tag format (widget-v1.0.0)

### Build Optimization
- **Tree Shaking**: Remove unused code
- **Minification**: Compress for production
- **External Dependencies**: Keep React external
- **Bundle Analysis**: Regular size monitoring

### Security
- **Integrity Hashes**: Always include SHA-384 hashes
- **HTTPS Only**: Never use HTTP for distribution
- **Version Pinning**: Pin to specific versions in production

### Documentation
- **Auto-Update**: Use automated documentation updates
- **Version History**: Maintain changelog
- **Integration Examples**: Provide working examples

## Support

### Deployment Issues
- **GitHub Actions Logs**: Check workflow execution logs
- **CDN Status**: Monitor Google Cloud Storage and CloudFlare
- **Bundle Analysis**: Use build tools for size optimization

### Integration Support
- **Documentation**: Comprehensive integration guide
- **Examples**: Working code examples
- **Troubleshooting**: Common issues and solutions

---

**🚀 The widget production deployment pipeline ensures reliable, secure, and optimized distribution of SurvAI widgets to partners worldwide.**