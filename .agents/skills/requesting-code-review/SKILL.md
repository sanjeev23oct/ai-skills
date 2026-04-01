---
name: requesting-code-review
description: Use when completing tasks, implementing major features, or before merging to verify work meets requirements. Dispatches a focused code-reviewer subagent with precise context. Use after every major SDLC phase.
metadata:
  source: https://github.com/obra/superpowers/blob/main/skills/requesting-code-review/SKILL.md
  author: obra
---

# Requesting Code Review

Dispatch a code-reviewer subagent to catch issues before they cascade. The reviewer gets precisely crafted context for evaluation — never your session's history. This keeps the reviewer focused on the work product, not your thought process, and preserves your own context for continued work.

**Core principle:** Review early, review often.

## When to Request Review

**Mandatory:**
- After each task in subagent-driven development
- After completing major feature
- Before merge to main

**Optional but valuable:**
- When stuck (fresh perspective)
- Before refactoring (baseline check)
- After fixing complex bug

## How to Request

**1. Get git SHAs:**
```bash
BASE_SHA=$(git rev-parse HEAD~1)  # or origin/main
HEAD_SHA=$(git rev-parse HEAD)
```

**2. Dispatch code-reviewer subagent:**

Use Task tool with the following context filled in:

```
WHAT_WAS_IMPLEMENTED: [what you just built]
PLAN_OR_REQUIREMENTS: specs/<feature-slug>.spec.md
BASE_SHA: [starting commit]
HEAD_SHA: [ending commit]
DESCRIPTION: [brief summary of changes]
```

**3. Act on feedback:**
- Fix Critical issues immediately
- Fix Important issues before proceeding
- Note Minor issues for later
- Push back if reviewer is wrong (with reasoning)

## Example

```
[Just completed Task 2: Add React component for user profile]

BASE_SHA=$(git log --oneline | grep "Task 1" | head -1 | awk '{print $1}')
HEAD_SHA=$(git rev-parse HEAD)

[Dispatch code-reviewer subagent]
  WHAT_WAS_IMPLEMENTED: UserProfile React component with a11y
  PLAN_OR_REQUIREMENTS: specs/user-profile.spec.md
  BASE_SHA: a7981ec
  HEAD_SHA: 3df7661
  DESCRIPTION: Added UserProfile with WCAG 2.1 AA compliance, Vitest tests

[Subagent returns]:
  Strengths: Proper ARIA labels, keyboard nav works
  Issues:
    Important: Missing focus trap in modal
    Minor: Color contrast ratio is 4.2:1 (needs 4.5:1)
  Assessment: Fix before proceeding

[Fix issues → re-run tests → continue]
```

## Integration with SDLC (ai-skills)

**Mandatory review checkpoints:**
1. After `react-component` or `api-endpoint`
2. After `db-migrate`
3. After `webapp-testing` (E2E) passes
4. Before `docker-build`

## Red Flags

**Never:**
- Skip review because "it's simple"
- Ignore Critical issues
- Proceed with unfixed Important issues
- Argue with valid technical feedback

**If reviewer is wrong:**
- Push back with technical reasoning
- Show code/tests that prove it works
- Request clarification
