---
name: react-component
description: Build production-grade React + Vite + TypeScript components with WCAG 2.1 AA accessibility, responsiveness across mobile/tablet/desktop, and clean design. Use when creating new UI components, pages, or interactive features. Includes a11y checks and unit test generation.
metadata:
  source: adapted from https://github.com/anthropics/skills (web-artifacts-builder + frontend-design)
  author: ai-skills
  version: 1.0.0
  sdlc-phase: 3-develop
  next-skill: unit-test, webapp-testing
---

# React Component Builder

Build accessible, responsive, production-grade React components for the Vite + TypeScript stack.

## Trigger Conditions
- "Build a [component/page/form/dashboard]"
- "Create a React component for X"
- "Add a UI for X"

## Prerequisites
- `specs/<feature-slug>.spec.md` approved
- `project-scaffold` has been run (frontend/ directory exists)

## Steps

### 1. Read the Spec
Open `specs/<feature-slug>.spec.md` and extract:
- Component name and purpose
- Acceptance criteria
- A11y requirements
- Responsive breakpoints

### 2. Design Thinking (Before Coding)
Commit to a clear aesthetic direction — avoid generic "AI slop":
- **Purpose**: What problem does this UI solve?
- **Tone**: Pick a direction (minimal, editorial, playful, professional) and execute it precisely
- **Typography**: Use distinctive fonts — avoid Inter, Roboto, Arial
- **Color**: Commit to a cohesive palette with CSS variables
- **Avoid**: Purple gradients, centered everything, uniform rounded corners

### 3. Component Structure

Follow this file structure:
```
frontend/src/
├── components/
│   └── <ComponentName>/
│       ├── index.tsx          # Main component
│       ├── <ComponentName>.test.tsx  # Vitest unit tests
│       └── <ComponentName>.module.css  # Scoped styles (or Tailwind)
├── pages/
│   └── <PageName>.tsx
```

### 4. Accessibility Requirements (WCAG 2.1 AA — Non-Negotiable)

Every component MUST:
```tsx
// ✅ Semantic HTML
<button type="button" onClick={handleClick}>
  <span aria-hidden="true">→</span>
  <span className="sr-only">Next step</span>
</button>

// ✅ ARIA labels on interactive elements
<input
  id="email"
  type="email"
  aria-describedby="email-error"
  aria-invalid={!!errors.email}
  aria-required="true"
/>
<span id="email-error" role="alert">{errors.email}</span>

// ✅ Focus management
<dialog aria-modal="true" aria-labelledby="dialog-title">
  <h2 id="dialog-title">Confirm Action</h2>
  {/* auto-focus first interactive element */}
</dialog>

// ✅ Color contrast — 4.5:1 for text, 3:1 for UI components
// ✅ Keyboard navigable — Tab, Enter, Escape, Arrow keys
// ✅ No content only via color
```

### 5. Responsiveness (Required Breakpoints)

```css
/* Mobile-first in Tailwind */
<div className="
  w-full px-4           /* 320px — mobile */
  sm:px-6              /* 640px — large mobile */
  md:px-8 md:grid md:grid-cols-2  /* 768px — tablet */
  lg:grid-cols-3       /* 1024px — desktop */
  xl:max-w-7xl xl:mx-auto  /* 1280px — wide */
">
```

### 6. Component Template

```tsx
import { forwardRef, type ComponentPropsWithoutRef } from 'react'

interface Props extends ComponentPropsWithoutRef<'div'> {
  label: string
  variant?: 'primary' | 'secondary'
}

export const MyComponent = forwardRef<HTMLDivElement, Props>(
  ({ label, variant = 'primary', className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        role="region"
        aria-label={label}
        className={/* tailwind classes */}
        {...props}
      >
        {/* content */}
      </div>
    )
  }
)

MyComponent.displayName = 'MyComponent'
```

### 7. Motion and Interactions

```tsx
// CSS transitions preferred for simple animations
// Use Framer Motion for complex sequences
import { motion } from 'framer-motion'

<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0 }}
  transition={{ duration: 0.2 }}
>
```

Respect `prefers-reduced-motion`:
```css
@media (prefers-reduced-motion: reduce) {
  * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
}
```

### 8. Unit Test Template (Vitest + Testing Library)

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe, toHaveNoViolations } from 'jest-axe'
import { MyComponent } from './index'

expect.extend(toHaveNoViolations)

describe('MyComponent', () => {
  it('renders with accessible label', () => {
    render(<MyComponent label="Test" />)
    expect(screen.getByRole('region', { name: 'Test' })).toBeInTheDocument()
  })

  it('is keyboard navigable', async () => {
    const user = userEvent.setup()
    render(<MyComponent label="Test" />)
    await user.tab()
    expect(document.activeElement).toBeInTheDocument()
  })

  it('has no axe accessibility violations', async () => {
    const { container } = render(<MyComponent label="Test" />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
```

### 9. Verification Gate

Run these before marking component done:
```bash
cd frontend

# TypeScript — zero errors
npx tsc --noEmit

# Lint — zero errors
npm run lint

# Unit tests — all pass, coverage >= 80%
npm run test -- --coverage

# axe accessibility check built into tests
npm run test -- --reporter=verbose
```

**Gate:** All checks must pass. Fix errors before moving to `webapp-testing`.

## Artifacts Produced
- `frontend/src/components/<ComponentName>/index.tsx`
- `frontend/src/components/<ComponentName>/<ComponentName>.test.tsx`
- Screenshot of rendered component (via Playwright if needed)
