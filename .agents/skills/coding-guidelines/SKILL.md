---
name: coding-guidelines
description: Reference coding standards for this stack (React+Vite+TypeScript, Node.js, PostgreSQL). Use when writing any code to ensure consistency. Also use when reviewing code for style compliance. Not a step in the flow — a reference all other skills consult.
metadata:
  author: ai-skills
  version: 1.0.0
  sdlc-phase: reference
---

# Coding Guidelines

Standards for the full-stack: React+Vite+TypeScript frontend, Node.js+Express backend, PostgreSQL database.

## General Principles

1. **Spec first** — No code without `specs/<feature>.spec.md`
2. **TypeScript strict** — `strict: true` in all `tsconfig.json` files. No `any`.
3. **Small functions** — max 30 lines. If longer, split.
4. **Explicit over implicit** — No magic. Name things clearly.
5. **Fail fast** — Validate at boundaries. Trust internals.
6. **No premature abstraction** — Three similar uses before extracting a helper.

---

## Frontend (React + Vite + TypeScript)

### File & Folder Naming
```
frontend/src/
├── components/          # PascalCase folders, index.tsx inside
│   └── UserCard/
│       ├── index.tsx
│       ├── UserCard.test.tsx
│       └── UserCard.module.css
├── pages/               # PascalCase, route-level components
├── hooks/               # camelCase, prefix with "use"
├── utils/               # camelCase, pure functions
├── types/               # PascalCase interfaces/types
├── api/                 # camelCase, API client functions
└── store/               # state management
```

### TypeScript
```ts
// ✅ Explicit return types on exported functions
export function formatDate(date: Date): string { ... }

// ✅ Prefer interfaces for object shapes
interface UserCardProps {
  userId: string
  onEdit?: (id: string) => void
}

// ✅ Use discriminated unions over boolean flags
type RequestState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: User }
  | { status: 'error'; error: string }

// ❌ Never use any
const data: any = ...   // FORBIDDEN
```

### React Components
```tsx
// ✅ Named exports only (no default exports for components)
export function UserCard({ userId, onEdit }: UserCardProps) { ... }

// ✅ One component per file
// ✅ Props destructured in signature
// ✅ forwardRef when component wraps a DOM element
// ❌ No inline components (breaks Fast Refresh + causes re-render bugs)
function Parent() {
  const Inner = () => <div />   // FORBIDDEN
}
```

### Hooks
```ts
// ✅ Single responsibility
export function useUserData(userId: string) {
  // Only fetching/caching logic here
}

// ✅ Return named object, not array (unless following React convention)
return { user, isLoading, error, refetch }

// ✅ Cleanup side effects
useEffect(() => {
  const sub = subscribe()
  return () => sub.unsubscribe()  // always return cleanup
}, [])
```

### Styling
```tsx
// ✅ Tailwind utility classes — mobile-first
// ✅ CSS modules for complex, component-specific styles
// ✅ CSS variables for theme tokens
// ❌ No inline styles (except dynamic values)
// ❌ No !important
```

### Accessibility (WCAG 2.1 AA — Mandatory)
```tsx
// ✅ Semantic HTML always
<button>, <nav>, <main>, <section aria-label="...">

// ✅ Every image has alt
<img src={src} alt={description} />   // or alt="" for decorative

// ✅ Focus visible — never remove outline without replacing
:focus-visible { outline: 2px solid var(--color-focus); }

// ✅ Color contrast: 4.5:1 for text, 3:1 for UI
// ✅ Keyboard navigable — Tab, Enter, Escape, Arrows
// ✅ ARIA only when semantics are insufficient
```

---

## Backend (Node.js + Express + TypeScript)

### File Naming
```
backend/src/
├── routes/        # <resource>.routes.ts
├── controllers/   # <resource>.controller.ts
├── services/      # <resource>.service.ts
├── repositories/  # <resource>.repository.ts
├── middleware/    # <name>.middleware.ts
├── types/         # <name>.types.ts
└── __tests__/     # <name>.test.ts
```

### API Design
```
GET    /api/v1/users          # List (paginated)
GET    /api/v1/users/:id      # Get one
POST   /api/v1/users          # Create
PUT    /api/v1/users/:id      # Replace
PATCH  /api/v1/users/:id      # Partial update
DELETE /api/v1/users/:id      # Delete
```

```ts
// ✅ Always version APIs: /api/v1/...
// ✅ Return consistent shapes
{ data: T }                         // success
{ error: string, details?: unknown } // error

// ✅ Use HTTP status codes correctly
200 OK, 201 Created, 204 No Content
400 Bad Request, 401 Unauthorized, 403 Forbidden
404 Not Found, 409 Conflict, 422 Unprocessable Entity
500 Internal Server Error
```

### Security
```ts
// ✅ Validate ALL input with Zod at controller layer
const schema = z.object({ email: z.string().email() })
const dto = schema.parse(req.body)

// ✅ Parameterized queries — NEVER string interpolation
pool.query('SELECT * FROM users WHERE id = $1', [id])

// ✅ Sanitize error messages — no stack traces to clients
// ✅ Rate limit public endpoints
// ✅ helmet() on all Express apps
// ✅ CORS whitelist — no wildcard in production
```

### Error Handling
```ts
// ✅ Throw errors with status codes from services
throw Object.assign(new Error('Not found'), { status: 404 })

// ✅ All controllers pass errors to next()
try { ... } catch (err) { next(err) }

// ✅ One centralized error handler at app level
```

---

## Database (PostgreSQL)

### Schema Conventions
```sql
-- Table names: snake_case, plural
-- Column names: snake_case
-- Primary keys: UUID (gen_random_uuid())
-- Always: created_at, updated_at (timestamptz)
-- Foreign keys: <table_singular>_id

CREATE TABLE user_profiles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  bio         TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Query Rules
```ts
// ✅ Parameterized queries only
// ✅ Select only needed columns (never SELECT *)
// ✅ Index foreign keys and frequently-queried columns
// ✅ Use LIMIT on all list queries
// ✅ Wrap multi-step operations in transactions
```

### Migrations
```
// ✅ Every change via migration file
// ✅ Always write down() function
// ✅ Test up + down + up before merging
// ✅ Never edit a run migration — always new file
```

---

## Git & Commits

```
# Commit message format (Conventional Commits)
feat: add user profile component
fix: correct email validation in registration
chore: update dependencies
test: add E2E tests for checkout flow
docs: update API README

# Branch naming
feature/<ticket-id>-short-description
fix/<ticket-id>-short-description

# PRs
- Linked to spec file
- All CI checks green
- Code review done (requesting-code-review skill)
```

---

## Definition of Done (Per Feature)

- [ ] Spec written and approved
- [ ] TypeScript: 0 errors
- [ ] ESLint: 0 errors
- [ ] Unit test coverage ≥ 80%
- [ ] Playwright E2E: all pass
- [ ] axe-core: 0 violations
- [ ] Docker build: succeeds
- [ ] Deployed to Railway: health check passes
- [ ] Code review: no Critical/Important issues open
