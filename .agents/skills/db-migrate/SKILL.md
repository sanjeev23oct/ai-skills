---
name: db-migrate
description: Create and run PostgreSQL schema migrations for Node.js projects. Use when adding tables, columns, indexes, or constraints. Uses node-pg-migrate. Always spec-driven — check spec before creating any migration.
metadata:
  author: ai-skills
  version: 1.0.0
  sdlc-phase: 3-develop
  next-skill: api-endpoint, unit-test
compatibility:
  tools: node, npm, psql, docker
---

# Database Migration

Manage PostgreSQL schema changes safely with `node-pg-migrate`. Every migration is versioned, reversible, and reviewed before merging.

## Trigger Conditions
- "Add table for X"
- "Add column X to table Y"
- "Create index on X"
- "Modify schema for X feature"

## Prerequisites
- `specs/<feature-slug>.spec.md` — check the Database section
- PostgreSQL running (`docker-compose up db` or Railway DB provisioned)
- `DATABASE_URL` set in `.env`

## Setup (First Time)

```bash
cd backend
npm install node-pg-migrate pg
```

**`package.json` scripts:**
```json
{
  "scripts": {
    "migrate:up": "node-pg-migrate up",
    "migrate:down": "node-pg-migrate down",
    "migrate:create": "node-pg-migrate create",
    "migrate:status": "node-pg-migrate status"
  }
}
```

**`database.json`** (node-pg-migrate config):
```json
{
  "dev": {
    "url": { "ENV": "DATABASE_URL" }
  }
}
```

## Step 1: Create Migration File

```bash
cd backend
npm run migrate:create -- add_users_table
# Creates: migrations/1712000000000_add_users_table.js
```

## Step 2: Write Migration

```js
// migrations/1712000000000_add_users_table.js
/** @type {import('node-pg-migrate').MigrationBuilder} */
exports.up = (pgm) => {
  // Enable UUID extension
  pgm.createExtension('pgcrypto', { ifNotExists: true })

  pgm.createTable('users', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()')
    },
    name: {
      type: 'varchar(100)',
      notNull: true
    },
    email: {
      type: 'varchar(255)',
      notNull: true,
      unique: true
    },
    role: {
      type: 'varchar(20)',
      notNull: true,
      default: "'user'",
      check: "role IN ('admin', 'user')"
    },
    created_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('NOW()')
    },
    updated_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('NOW()')
    }
  })

  // Index for email lookups
  pgm.createIndex('users', 'email')

  // Auto-update updated_at trigger
  pgm.sql(`
    CREATE OR REPLACE FUNCTION update_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
    $$ LANGUAGE plpgsql;
  `)
  pgm.sql(`
    CREATE TRIGGER users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  `)
}

exports.down = (pgm) => {
  pgm.sql('DROP TRIGGER IF EXISTS users_updated_at ON users')
  pgm.sql('DROP FUNCTION IF EXISTS update_updated_at')
  pgm.dropTable('users')
}
```

## Step 3: Run Migration

```bash
cd backend

# Apply migration
DATABASE_URL=postgres://appuser:apppassword@localhost:5432/appdb \
  npm run migrate:up

# Verify
psql $DATABASE_URL -c "\dt"
psql $DATABASE_URL -c "\d users"
```

## Step 4: Common Migration Patterns

**Add column (non-breaking):**
```js
exports.up = (pgm) => {
  pgm.addColumn('users', {
    avatar_url: { type: 'text', notNull: false }  // nullable = safe
  })
}
exports.down = (pgm) => pgm.dropColumn('users', 'avatar_url')
```

**Add index:**
```js
exports.up = (pgm) => {
  pgm.createIndex('orders', ['user_id', 'created_at'], { name: 'idx_orders_user_date' })
}
exports.down = (pgm) => pgm.dropIndex('orders', [], { name: 'idx_orders_user_date' })
```

**Rename column (multi-step, safe):**
```js
// Migration 1: Add new column
exports.up = (pgm) => pgm.addColumn('users', { full_name: { type: 'varchar(100)' } })
// Migration 2: Backfill data
// Migration 3: Drop old column
```

## Step 5: Migration Safety Rules

- **Never** edit a migration that has already been run in production
- **Always** write a `down` function — rollback must work
- **Test rollback** locally before merging: `npm run migrate:down && npm run migrate:up`
- **Use transactions** for DDL — node-pg-migrate wraps in transactions by default
- **Nullable first** for new columns on existing tables (avoid locking large tables)
- **No app code changes** in the same PR as a destructive migration

## Verification Gate

```bash
# Migration runs cleanly
npm run migrate:up && echo "MIGRATE UP: OK"

# Rollback works
npm run migrate:down && echo "MIGRATE DOWN: OK"

# Re-apply
npm run migrate:up && echo "RE-APPLY: OK"

# Schema matches spec
psql $DATABASE_URL -c "\d <table_name>"
```

**Gate:** All 3 steps (up, down, up) must succeed before continuing.
