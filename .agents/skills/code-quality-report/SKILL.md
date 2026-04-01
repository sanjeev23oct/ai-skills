---
name: code-quality-report
description: Generate a comprehensive code quality report covering ESLint, TypeScript strict checks, Vitest coverage, and bundle size. Use before docker-build to gate quality. Produces a machine-readable report artifact.
metadata:
  author: ai-skills
  version: 1.0.0
  sdlc-phase: 5-quality
  next-skill: docker-build
compatibility:
  node: ">=20"
  tools: node, npm
---

# Code Quality Report

Run all quality checks and produce a consolidated report before building Docker images.

## Trigger Conditions
- "Run quality checks"
- "Generate code quality report"
- "Check code before deploy"
- Automatically: before every `docker-build`

## Prerequisites
- All unit tests passing (`unit-test` skill complete)
- All E2E tests passing (`webapp-testing` skill complete)

## Step 1: Frontend Quality Checks

```bash
cd frontend

echo "=== FRONTEND QUALITY REPORT ===" > /tmp/quality-report.md
echo "Generated: $(date)" >> /tmp/quality-report.md
echo "" >> /tmp/quality-report.md

# 1. TypeScript strict
echo "### TypeScript" >> /tmp/quality-report.md
npx tsc --noEmit 2>&1 | tee -a /tmp/quality-report.md
echo "" >> /tmp/quality-report.md

# 2. ESLint
echo "### ESLint" >> /tmp/quality-report.md
npm run lint -- --format=compact 2>&1 | tee -a /tmp/quality-report.md
echo "" >> /tmp/quality-report.md

# 3. Vitest coverage
echo "### Test Coverage" >> /tmp/quality-report.md
npm run test -- --coverage --reporter=verbose 2>&1 | tee -a /tmp/quality-report.md
echo "" >> /tmp/quality-report.md

# 4. Bundle size analysis
echo "### Bundle Size" >> /tmp/quality-report.md
npm run build 2>&1 | tee -a /tmp/quality-report.md
du -sh dist/ >> /tmp/quality-report.md
echo "" >> /tmp/quality-report.md
```

## Step 2: Backend Quality Checks

```bash
cd ../backend

echo "=== BACKEND QUALITY REPORT ===" >> /tmp/quality-report.md

# 1. TypeScript
echo "### TypeScript" >> /tmp/quality-report.md
npx tsc --noEmit 2>&1 | tee -a /tmp/quality-report.md

# 2. ESLint
echo "### ESLint" >> /tmp/quality-report.md
npm run lint -- --format=compact 2>&1 | tee -a /tmp/quality-report.md

# 3. Vitest coverage
echo "### Test Coverage" >> /tmp/quality-report.md
npm run test -- --coverage 2>&1 | tee -a /tmp/quality-report.md
```

## Step 3: Accessibility Report

```bash
echo "=== ACCESSIBILITY REPORT ===" >> /tmp/quality-report.md
echo "Run axe-core tests:" >> /tmp/quality-report.md
cd frontend
npm run test -- --grep="axe" --reporter=verbose 2>&1 | tee -a /tmp/quality-report.md
```

## Step 4: Quality Gates (Hard Stops)

Parse the report and enforce these thresholds:

| Check | Threshold | Hard Stop? |
|-------|-----------|------------|
| TypeScript errors | 0 | YES |
| ESLint errors | 0 | YES |
| ESLint warnings | 0 (ideally) | warn only |
| Line coverage | >= 80% | YES |
| Branch coverage | >= 80% | YES |
| axe violations | 0 | YES |
| Bundle size (frontend) | < 500KB gzip | warn |

```bash
# Fail if any TS errors
npx tsc --noEmit && echo "TS_GATE=PASS" || { echo "TS_GATE=FAIL"; exit 1; }

# Fail if any ESLint errors
npm run lint && echo "LINT_GATE=PASS" || { echo "LINT_GATE=FAIL"; exit 1; }

# Fail if coverage below 80%
npm run test -- --coverage --reporter=json > coverage.json
node -e "
  const cov = require('./coverage/coverage-summary.json')
  const lines = cov.total.lines.pct
  if (lines < 80) { console.error('Coverage ' + lines + '% < 80%'); process.exit(1) }
  console.log('COVERAGE_GATE=PASS (' + lines + '%)')
"
```

## Step 5: Produce Report Artifact

```bash
# Save timestamped report
mkdir -p reports
cp /tmp/quality-report.md "reports/quality-$(date +%Y%m%d-%H%M%S).md"

echo ""
echo "Quality report saved to: reports/quality-*.md"
echo ""
echo "=== GATE SUMMARY ==="
echo "TypeScript:  PASS/FAIL"
echo "ESLint:      PASS/FAIL"
echo "Coverage:    PASS/FAIL (XX%)"
echo "Axe a11y:    PASS/FAIL"
echo ""
echo "Next: run docker-build skill"
```

## What Blocks Deploy

**Do not proceed to `docker-build` if any of these fail:**
1. TypeScript errors (any number)
2. ESLint errors (warnings allowed)
3. Test coverage below 80% on any file
4. axe-core violations > 0
5. Vitest tests failing

## Artifacts Produced
- `reports/quality-<timestamp>.md` — full quality report
- `frontend/coverage/` — HTML coverage report
- `backend/coverage/` — HTML coverage report
