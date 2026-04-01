---
name: api-endpoint
description: Build a Node.js + Express + TypeScript REST API endpoint with input validation, error handling, PostgreSQL integration, and unit tests. Use when adding or modifying backend API routes.
metadata:
  author: ai-skills
  version: 1.0.0
  sdlc-phase: 3-develop
  next-skill: db-migrate, unit-test, webapp-testing
compatibility:
  node: ">=20"
  tools: node, npm
---

# API Endpoint Builder

Build production-grade Node.js REST endpoints. Always driven by an approved spec.

## Trigger Conditions
- "Add API endpoint for X"
- "Create a POST/GET/PUT/DELETE route for X"
- "Build backend logic for X"

## Prerequisites
- `specs/<feature-slug>.spec.md` exists and approved
- `project-scaffold` has been run (backend/ directory exists)

## Architecture Pattern

Follow the **Controller → Service → Repository** layered pattern:

```
backend/src/
├── routes/         # Route definitions (Express Router)
├── controllers/    # Request/response handling
├── services/       # Business logic
├── repositories/   # Database queries (pg)
├── middleware/     # Auth, validation, error handling
├── types/          # TypeScript interfaces
└── __tests__/      # Vitest unit tests
```

## Step 1: Define Types

```ts
// backend/src/types/<feature>.ts
export interface CreateUserDto {
  name: string
  email: string
  role: 'admin' | 'user'
}

export interface User extends CreateUserDto {
  id: string
  createdAt: Date
  updatedAt: Date
}
```

## Step 2: Repository (Database Layer)

```ts
// backend/src/repositories/user.repository.ts
import { pool } from '../db'
import type { User, CreateUserDto } from '../types/user'

export const userRepository = {
  async findById(id: string): Promise<User | null> {
    const { rows } = await pool.query(
      'SELECT * FROM users WHERE id = $1',
      [id]
    )
    return rows[0] ?? null
  },

  async create(dto: CreateUserDto): Promise<User> {
    const { rows } = await pool.query(
      `INSERT INTO users (name, email, role)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [dto.name, dto.email, dto.role]
    )
    return rows[0]
  }
}
```

## Step 3: Service (Business Logic)

```ts
// backend/src/services/user.service.ts
import { userRepository } from '../repositories/user.repository'
import type { CreateUserDto } from '../types/user'

export const userService = {
  async getUser(id: string) {
    const user = await userRepository.findById(id)
    if (!user) throw Object.assign(new Error('User not found'), { status: 404 })
    return user
  },

  async createUser(dto: CreateUserDto) {
    // Business rules here (e.g., check for duplicate email)
    return userRepository.create(dto)
  }
}
```

## Step 4: Controller (Request/Response)

```ts
// backend/src/controllers/user.controller.ts
import { RequestHandler } from 'express'
import { z } from 'zod'
import { userService } from '../services/user.service'

const createUserSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  role: z.enum(['admin', 'user'])
})

export const getUser: RequestHandler = async (req, res, next) => {
  try {
    const user = await userService.getUser(req.params.id)
    res.json(user)
  } catch (err) {
    next(err)
  }
}

export const createUser: RequestHandler = async (req, res, next) => {
  try {
    const dto = createUserSchema.parse(req.body)  // Zod validation
    const user = await userService.createUser(dto)
    res.status(201).json(user)
  } catch (err) {
    next(err)
  }
}
```

## Step 5: Route Registration

```ts
// backend/src/routes/user.routes.ts
import { Router } from 'express'
import { getUser, createUser } from '../controllers/user.controller'
import { authenticate } from '../middleware/auth'

export const userRouter = Router()

userRouter.get('/:id', authenticate, getUser)
userRouter.post('/', authenticate, createUser)
```

## Step 6: Centralized Error Handler

```ts
// backend/src/middleware/errorHandler.ts
import { ErrorRequestHandler } from 'express'
import { ZodError } from 'zod'

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Validation failed',
      details: err.flatten().fieldErrors
    })
  }

  const status = (err as any).status ?? 500
  const message = status < 500 ? err.message : 'Internal server error'

  if (status >= 500) console.error(err)

  res.status(status).json({ error: message })
}
```

## Step 7: Unit Tests (Vitest)

```ts
// backend/src/__tests__/user.service.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { userService } from '../services/user.service'
import { userRepository } from '../repositories/user.repository'

vi.mock('../repositories/user.repository')

describe('userService.getUser', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns user when found', async () => {
    const mockUser = { id: '1', name: 'Alice', email: 'a@test.com', role: 'user' }
    vi.mocked(userRepository.findById).mockResolvedValue(mockUser as any)

    const result = await userService.getUser('1')
    expect(result).toEqual(mockUser)
  })

  it('throws 404 when user not found', async () => {
    vi.mocked(userRepository.findById).mockResolvedValue(null)

    await expect(userService.getUser('999')).rejects.toMatchObject({ status: 404 })
  })
})
```

## Verification Gate

```bash
cd backend

# TypeScript — zero errors
npx tsc --noEmit && echo "TS: OK"

# Lint
npm run lint && echo "LINT: OK"

# Unit tests with coverage
npm run test -- --coverage && echo "TESTS: OK"

# Manual smoke test (server must be running)
curl -s http://localhost:3001/health | jq .
```

**Gate:** All pass before `requesting-code-review`.

## Security Checklist
- [ ] Input validated with Zod at controller layer
- [ ] No raw SQL string interpolation — use parameterized queries (`$1`, `$2`)
- [ ] Auth middleware applied to protected routes
- [ ] Errors sanitized — no stack traces exposed in production responses
- [ ] Rate limiting applied (use `express-rate-limit` on public endpoints)
