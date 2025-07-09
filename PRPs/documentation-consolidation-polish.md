name: "M5_PHASE_04 - Documentation Review & Aggregation"
description: |
  Consolidate and polish all project documentation into a cohesive, up-to-date set ready for 
  public/internal consumption. Remove duplicates, ensure accuracy, and provide clear navigation.

## Goal
Transform the SurvAI project documentation from its current state into a polished, consolidated, and professional documentation suite suitable for public/internal consumption. This includes eliminating duplicates, ensuring accuracy, adding proper navigation, status badges, and creating a comprehensive documentation index.

## Why
- **Professional Presentation**: Creates a polished experience for developers, partners, and stakeholders
- **Maintainability**: Reduces documentation debt and prevents future inconsistencies
- **Discoverability**: Improves navigation and findability of information
- **Quality Assurance**: Ensures all documentation is accurate, tested, and up-to-date
- **Developer Experience**: Provides clear, consistent documentation patterns for contributors

## What
A comprehensive documentation consolidation that includes:
- Merged duplicate documentation files into authoritative single sources
- Updated root README.md with status badges and improved structure
- Enhanced docs/README.md index with last updated dates and summaries
- Updated CHANGELOG.md with documentation consolidation entry
- Linked PLANNING.md to FINAL_REVIEW_PLANNING.md for navigation
- Implemented markdown linting for consistency
- Validated all internal links and code snippets

### Success Criteria
- [ ] No duplicate or stale documentation files remain (verified by grep)
- [ ] Root README.md displays build status and coverage badges
- [ ] docs/README.md lists every document with summary and last updated date
- [ ] CHANGELOG.md has entry under "## [Unreleased] - Documentation"
- [ ] All markdown files pass lint validation
- [ ] All internal links resolve correctly
- [ ] Code snippets are tested or flagged as pseudocode
- [ ] PLANNING.md links forward to FINAL_REVIEW_PLANNING.md

## All Needed Context

### Documentation & References
```yaml
# MUST READ - Include these in your context window
- url: https://www.markdownguide.org/basic-syntax/
  why: Markdown formatting standards and best practices
  
- url: https://google.github.io/styleguide/docguide/style.html
  why: Google's markdown style guide for consistency
  
- url: https://www.markdowntoolbox.com/blog/markdown-best-practices-for-documentation/
  why: Modern documentation best practices for 2024
  
- url: https://github.com/dwyl/repo-badges
  why: Comprehensive guide to GitHub repository badges
  
- url: https://docs.github.com/en/actions/how-tos/monitoring-and-troubleshooting-workflows/monitoring-workflows/adding-a-workflow-status-badge
  why: Official GitHub workflow status badge documentation
  
- url: https://keepachangelog.com/en/1.0.0/
  why: CHANGELOG format standard being followed
  
- file: docs/WIDGET.md
  why: Example of concise, well-structured reference documentation to follow
  
- file: README.md
  why: Current structure and content to enhance, not replace
  
- file: docs/README.md
  why: Existing navigation structure to build upon
  
- file: CHANGELOG.md
  why: Current format and structure to maintain consistency
  
- file: FINAL_REVIEW_PLANNING.md
  why: Target document for PLANNING.md linkage
  
- file: docs/EPC_API_REFERENCE.md
  why: Example of potential duplicate content to merge
  
- file: docs/EPC_SERVICE_ARCHITECTURE.md
  why: Example of potential duplicate content to merge
```

### Current Codebase Documentation Structure
```bash
docs/
├── ADMIN_CHAT_INTERFACE.md
├── AI_DEPLOYMENT_GUIDE.md
├── AI_INTEGRATION_SERVICE.md
├── API_DYNAMIC_QUESTIONS.md
├── DASHBOARD_API_REFERENCE.md
├── DYNAMIC_QUESTION_ENGINE_DEPLOYMENT.md
├── EPC_API_REFERENCE.md              # POTENTIAL DUPLICATE
├── EPC_DRIVEN_QUESTION_ORDERING.md
├── EPC_SERVICE_ARCHITECTURE.md       # POTENTIAL DUPLICATE
├── FEATURES_OVERVIEW.md
├── OFFER_MANAGEMENT_API_REFERENCE.md
├── QUESTION_CONTROLLER_AI_INTEGRATION.md
├── README.md                         # NAVIGATION INDEX
├── VISUAL_TESTING.md
├── WIDGET.md                         # REFERENCE PATTERN
├── WIDGET_API_REFERENCE.md
├── WIDGET_PRODUCTION_DEPLOYMENT.md
├── WIDGET_RESILIENCE.md
└── ZOD_VALIDATION_MIGRATION.md

root/
├── README.md                         # MAIN ENTRY POINT
├── CHANGELOG.md                      # EXISTS, NEEDS UPDATE
├── PLANNING.md                       # NEEDS LINK TO FINAL_REVIEW
├── FINAL_REVIEW_PLANNING.md          # LINK TARGET
├── TESTING.md
└── [M*_PHASE_*.md files]            # MILESTONE DOCS
```

### Desired Documentation Structure
```bash
docs/
├── ADMIN_CHAT_INTERFACE.md
├── AI_DEPLOYMENT_GUIDE.md
├── AI_INTEGRATION_SERVICE.md
├── API_DYNAMIC_QUESTIONS.md
├── DASHBOARD_API_REFERENCE.md
├── DYNAMIC_QUESTION_ENGINE_DEPLOYMENT.md
├── EPC_COMPREHENSIVE_GUIDE.md        # MERGED from API_REFERENCE + ARCHITECTURE
├── EPC_DRIVEN_QUESTION_ORDERING.md
├── FEATURES_OVERVIEW.md
├── OFFER_MANAGEMENT_API_REFERENCE.md
├── QUESTION_CONTROLLER_AI_INTEGRATION.md
├── README.md                         # ENHANCED WITH DATES
├── VISUAL_TESTING.md
├── WIDGET.md
├── WIDGET_API_REFERENCE.md
├── WIDGET_PRODUCTION_DEPLOYMENT.md
├── WIDGET_RESILIENCE.md
└── ZOD_VALIDATION_MIGRATION.md

root/
├── README.md                         # ENHANCED WITH BADGES
├── CHANGELOG.md                      # UPDATED WITH DOC ENTRY
├── PLANNING.md                       # LINKED TO FINAL_REVIEW
├── FINAL_REVIEW_PLANNING.md
├── TESTING.md
└── [M*_PHASE_*.md files]
```

### Known Gotchas of Documentation & Markdown
```markdown
# CRITICAL: GitHub badge URLs must use specific format
# Example: https://github.com/OWNER/REPO/actions/workflows/WORKFLOW-FILE/badge.svg
# Example: Shields.io badges need proper URL encoding

# CRITICAL: Markdown link validation
# Example: Internal links must use relative paths
# Example: Hash links must match exact heading text (case-sensitive)

# CRITICAL: CHANGELOG format requirements
# Example: Must follow Keep a Changelog format exactly
# Example: Unreleased section must be at top
# Example: Dates must be in YYYY-MM-DD format

# CRITICAL: Existing content preservation
# Example: Don't remove existing feature descriptions
# Example: Maintain existing link structure where possible
# Example: Preserve existing code examples and snippets
```

## Implementation Blueprint

### Documentation Audit Data Model
```typescript
interface DocumentationAudit {
  file: string;
  size: number;
  lastModified: Date;
  headings: string[];
  duplicateContent: string[];
  internalLinks: string[];
  externalLinks: string[];
  codeBlocks: Array<{
    language: string;
    content: string;
    tested: boolean;
  }>;
}

interface MergeCandidate {
  primaryFile: string;
  duplicateFiles: string[];
  contentOverlap: number;
  mergeStrategy: 'combine' | 'replace' | 'supplement';
}
```

### Status Badge Configuration
```typescript
interface BadgeConfig {
  name: string;
  url: string;
  alt: string;
  category: 'build' | 'coverage' | 'quality' | 'license' | 'version';
}

const requiredBadges: BadgeConfig[] = [
  {
    name: 'Build Status',
    url: 'https://github.com/OWNER/REPO/actions/workflows/ci.yml/badge.svg',
    alt: 'Build Status',
    category: 'build'
  },
  {
    name: 'Coverage',
    url: 'https://codecov.io/gh/OWNER/REPO/branch/main/graph/badge.svg',
    alt: 'Coverage',
    category: 'coverage'
  }
];
```

### List of Tasks to Complete Documentation Consolidation

```yaml
Task 1: Documentation Audit
AUDIT docs/ directory:
  - SCAN all .md files for content, structure, and potential duplicates
  - IDENTIFY overlapping content between files (especially EPC_API_REFERENCE.md & EPC_SERVICE_ARCHITECTURE.md)
  - CATALOG internal links and validate they resolve
  - DOCUMENT findings in structured format for merge decisions

Task 2: Merge Duplicate Documentation
MERGE docs/EPC_API_REFERENCE.md + docs/EPC_SERVICE_ARCHITECTURE.md:
  - CREATE docs/EPC_COMPREHENSIVE_GUIDE.md combining both files
  - PRESERVE all unique content from both sources
  - STRUCTURE with clear sections: Overview, Architecture, API Reference, Examples
  - UPDATE all internal links pointing to old files
  - DELETE original duplicate files after merge

Task 3: Enhance Root README.md
MODIFY README.md:
  - ADD GitHub Actions workflow status badges
  - ADD code coverage badge
  - ADD license badge (already exists)
  - IMPROVE quick start section clarity
  - ADD link to FINAL_REVIEW_PLANNING.md in architecture section
  - PRESERVE existing comprehensive feature list
  - ADD table of contents for better navigation

Task 4: Update Documentation Index
MODIFY docs/README.md:
  - ADD last updated dates for each document
  - ADD brief one-line descriptions for each file
  - ORGANIZE by category (Getting Started, API Reference, etc.)
  - ADD estimated reading time for each document
  - UPDATE links to reflect merged documentation
  - ADD search/navigation tips

Task 5: Update CHANGELOG.md
MODIFY CHANGELOG.md:
  - ADD new entry under "## [Unreleased]" section
  - CREATE "### Documentation" subsection
  - LIST all documentation changes made
  - FOLLOW existing format and style
  - PRESERVE all existing entries

Task 6: Link PLANNING.md to FINAL_REVIEW
MODIFY PLANNING.md:
  - ADD section at end linking to FINAL_REVIEW_PLANNING.md
  - EXPLAIN relationship between documents
  - PRESERVE existing content and structure
  - ADD navigation breadcrumbs

Task 7: Add Markdown Linting
CREATE .markdownlint.json:
  - CONFIGURE rules for consistent formatting
  - DISABLE rules that conflict with existing content
  - FOCUS on line length, heading structure, link format
  
UPDATE package.json:
  - ADD "lint:md" script for markdown linting
  - ADD "test:links" script for link validation
  - INTEGRATE with existing lint workflow

Task 8: Validate All Links and Code
VALIDATE documentation:
  - CHECK all internal links resolve correctly
  - VERIFY external links are accessible
  - IDENTIFY code snippets that need testing
  - FLAG untested code as pseudocode
  - UPDATE broken or outdated links
```

### Per Task Implementation Details

```typescript
// Task 1: Documentation Audit
interface AuditResult {
  duplicateContentMap: Map<string, string[]>;
  brokenLinks: string[];
  untestedCodeBlocks: Array<{file: string, line: number, language: string}>;
  mergeCandidates: MergeCandidate[];
}

// Task 2: Merge Strategy
function mergeDocuments(primary: string, secondary: string): string {
  // PATTERN: Combine overview from primary, technical details from secondary
  // PRESERVE: All unique examples and code snippets
  // STRUCTURE: Overview -> Architecture -> API Reference -> Examples -> Troubleshooting
  return combinedContent;
}

// Task 3: Badge Integration
function generateBadgeMarkdown(badges: BadgeConfig[]): string {
  // PATTERN: Group badges by category
  // FORMAT: [![Alt Text](badge-url)](target-url)
  // LAYOUT: One line per category, space-separated within category
  return badgeMarkdown;
}
```

### Integration Points
```yaml
PACKAGE_JSON:
  - add script: "lint:md": "markdownlint '**/*.md' --ignore node_modules"
  - add script: "test:links": "markdown-link-check **/*.md"
  - add devDependency: "markdownlint-cli": "^0.37.0"
  - add devDependency: "markdown-link-check": "^3.11.2"

GITHUB_ACTIONS:
  - modify: .github/workflows/ci.yml
  - add step: Markdown linting
  - add step: Link validation
  - ensure: Badge URLs match actual workflow names

GITIGNORE:
  - verify: .markdownlint.json not ignored
  - ensure: No documentation artifacts ignored
```

## Validation Loop

### Level 1: Structure & Syntax
```bash
# Run these FIRST - fix any errors before proceeding
npm run lint:md              # Markdown linting
npm run test:links           # Link validation

# Expected: No errors. If errors, READ the error and fix.
```

### Level 2: Content Validation
```bash
# Verify no duplicate content remains
grep -r "duplicate content patterns" docs/
# Expected: No results

# Check all badges resolve
curl -I https://github.com/OWNER/REPO/actions/workflows/ci.yml/badge.svg
# Expected: 200 OK response

# Verify CHANGELOG format
head -20 CHANGELOG.md | grep -E "^## \[Unreleased\]"
# Expected: Match found
```

### Level 3: Navigation & Accessibility
```bash
# Test internal link resolution
markdown-link-check docs/README.md
# Expected: All links accessible

# Verify documentation index completeness
ls docs/*.md | wc -l
grep -c "\.md" docs/README.md
# Expected: Numbers should match (all docs indexed)

# Check for proper heading structure
markdownlint docs/ --rules MD001,MD003,MD022
# Expected: No heading structure errors
```

## Final Validation Checklist
- [ ] All markdown files pass linting: `npm run lint:md`
- [ ] All links resolve correctly: `npm run test:links`
- [ ] No duplicate documentation files exist: `find docs/ -name "*duplicate*" -o -name "*old*"`
- [ ] Root README includes all required badges
- [ ] docs/README.md includes all documentation with dates
- [ ] CHANGELOG.md updated with documentation entry
- [ ] PLANNING.md links to FINAL_REVIEW_PLANNING.md
- [ ] All code snippets tested or marked as pseudocode
- [ ] Badge URLs return 200 status codes
- [ ] Navigation flows work for all user personas (developers, partners, admins)

## Anti-Patterns to Avoid
- ❌ Don't remove existing content without preserving unique information
- ❌ Don't break existing internal links without creating redirects
- ❌ Don't use generic descriptions in documentation index
- ❌ Don't merge documentation that serves different purposes
- ❌ Don't add badges that don't actually reflect project status
- ❌ Don't change CHANGELOG format or structure
- ❌ Don't create markdown that doesn't lint cleanly
- ❌ Don't link to specific line numbers in code (they change)

---

## Implementation Confidence Score: 9/10

**Strengths:**
- Comprehensive audit approach prevents information loss
- Existing documentation structure provides solid foundation
- Clear validation loops ensure quality control
- Executable validation steps enable iterative improvement
- Respects existing patterns and conventions

**Challenges:**
- Badge URLs need project-specific configuration
- Merge decisions require careful content analysis
- Link validation depends on network connectivity
- Code snippet testing may reveal outdated examples

**Risk Mitigation:**
- Preserve original files during merge process
- Validate all changes incrementally
- Use relative links for internal navigation
- Focus on structural improvements over content rewrites

This PRP provides comprehensive context and executable validation steps for successful one-pass implementation of documentation consolidation and polish.