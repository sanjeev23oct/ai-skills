---
name: spec-writer
description: Write a structured feature spec before any code is written. Use this skill when starting any new feature, bug fix, or API change. Produces a spec document that all subsequent SDLC skills reference.
metadata:
  author: ai-skills
  version: 1.0.0
  sdlc-phase: 1-spec
  next-skill: project-scaffold or react-component or api-endpoint
---

# Spec Writer

Write a complete feature specification before touching any code. This is the entry point of the SDLC. No code skill should run without a spec.

## Trigger Conditions
- User says "build X", "add feature X", "implement X", "create X"
- Any new React component, API endpoint, DB migration, or user story

## Output Artifact
Create `specs/<feature-slug>.spec.md` in the project root.

## Steps

### 1. Clarify Requirements
Ask the user (or infer from context) the following — do NOT skip:
- **What** is being built (user-facing feature or internal?)
- **Who** uses it (persona / role)
- **Why** it is needed (problem being solved)
- **Acceptance criteria** — observable, testable outcomes
- **Out of scope** — what this spec explicitly excludes

### 2. Write the Spec Document

Use this exact template:

```markdown
# Spec: <Feature Name>

## Status
Draft | Review | Approved

## Summary
One paragraph describing what is being built and why.

## User Story
As a <persona>, I want to <action> so that <outcome>.

## Acceptance Criteria
- [ ] AC1: <specific, testable criterion>
- [ ] AC2: ...
- [ ] AC3: ...

## Technical Scope

### Frontend
- Components to create/modify
- Routes affected
- Accessibility requirements (WCAG 2.1 AA)
- Responsive breakpoints (mobile 320px, tablet 768px, desktop 1280px)

### Backend
- API endpoints (method, path, request/response shape)
- Authentication/authorization rules

### Database
- Tables/columns to add or modify
- Migrations required
- Indexes needed

## Non-Functional Requirements
- Performance: (e.g., page load < 2s, API response < 200ms)
- Accessibility: WCAG 2.1 AA compliance required
- Security: (e.g., input validation, SQL injection prevention)

## Test Plan
- Unit tests: what functions/components need tests
- E2E tests: what Playwright scenarios to cover
- A11y tests: axe-core scan on all new pages/components

## Open Questions
- [ ] Question 1
- [ ] Question 2

## Definition of Done
- [ ] All acceptance criteria met
- [ ] Unit test coverage >= 80%
- [ ] Playwright E2E tests pass
- [ ] axe-core reports 0 violations
- [ ] ESLint + TypeScript strict: 0 errors
- [ ] Docker build succeeds
- [ ] Deployed to Railway staging, health check passes
```

### 3. Verify Before Proceeding
- Spec file exists at `specs/<feature-slug>.spec.md`
- All acceptance criteria are specific and testable (not vague like "it works")
- Test plan section is filled in
- Definition of Done checklist is complete

### 4. Gate
**Do not proceed to any coding skill until the spec is written and the user confirms it is correct.**

Output to user:
```
Spec written: specs/<feature-slug>.spec.md
Next step: run `react-component`, `api-endpoint`, or `project-scaffold` skill
```
