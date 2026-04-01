---
name: deploy-railway
description: Deploy the React+Vite frontend and Node.js backend to Railway.com via Docker. Provisions PostgreSQL, runs migrations, and verifies the live deployment. Use after docker-build succeeds.
metadata:
  author: ai-skills
  version: 1.0.0
  sdlc-phase: 7-deploy
  next-skill: (end of SDLC — verify live URL)
compatibility:
  tools: node, npm, docker, railway CLI
---

# Deploy to Railway

Deploy production Docker images to Railway.com. Includes database provisioning, migration, and post-deploy health verification.

## Trigger Conditions
- "Deploy to Railway"
- "Push to production"
- Automatically: after `docker-build` gate passes

## Prerequisites
- `docker-build` completed — both images verified locally
- Railway account exists and `RAILWAY_TOKEN` set in `.env`
- Railway CLI installed: `npm install -g @railway/cli`

## Step 1: Login & Project Setup

```bash
# Login (opens browser)
railway login

# Link to existing project or create new
railway link         # existing project
# OR
railway init         # new project → follow prompts, note PROJECT_ID
```

## Step 2: Provision PostgreSQL on Railway

```bash
# Add PostgreSQL plugin to your Railway project
railway add --plugin postgresql

# Verify DATABASE_URL is set in Railway environment
railway variables | grep DATABASE_URL
```

## Step 3: Configure Railway Services

Railway reads `railway.toml` from project root:

```toml
# railway.toml
[build]
builder = "DOCKERFILE"

[[services]]
name = "backend"
source = "backend"
dockerfile = "backend/Dockerfile"

[services.backend.variables]
PORT = "3001"
NODE_ENV = "production"

[services.backend.deploy]
healthcheckPath = "/health"
healthcheckTimeout = 300
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 3

[[services]]
name = "frontend"
source = "frontend"
dockerfile = "frontend/Dockerfile"

[services.frontend.deploy]
healthcheckPath = "/"
```

## Step 4: Set Environment Variables

```bash
# Backend secrets (never commit these)
railway variables set \
  --service backend \
  NODE_ENV=production \
  JWT_SECRET=$(openssl rand -base64 32) \
  CORS_ORIGIN=https://your-frontend.railway.app

# Frontend build-time vars
railway variables set \
  --service frontend \
  VITE_API_URL=https://your-backend.railway.app
```

## Step 5: Run Migrations Before Deploying App

```bash
# Get Railway DATABASE_URL
DB_URL=$(railway variables get DATABASE_URL --service backend)

# Run migrations against Railway DB
DATABASE_URL="$DB_URL" npm run migrate:up --prefix backend

echo "Migrations complete"
```

## Step 6: Deploy

```bash
# Deploy all services
railway up --detach

# Watch deployment logs
railway logs --service backend
railway logs --service frontend

# Get deployment URLs
railway domain --service backend   # → https://backend-xxx.railway.app
railway domain --service frontend  # → https://frontend-xxx.railway.app
```

## Step 7: Post-Deploy Verification

```bash
BACKEND_URL=$(railway domain --service backend)
FRONTEND_URL=$(railway domain --service frontend)

# Health check backend
curl -sf "https://${BACKEND_URL}/health" | jq . && echo "BACKEND HEALTH: OK"

# Check frontend loads
curl -sf "https://${FRONTEND_URL}" | grep -q "<!DOCTYPE html>" && echo "FRONTEND: OK"

# Smoke test key API endpoint
curl -sf "https://${BACKEND_URL}/api/v1/status" | jq . && echo "API STATUS: OK"

# Run Playwright smoke tests against live URL (optional but recommended)
PLAYWRIGHT_BASE_URL="https://${FRONTEND_URL}" npx playwright test --grep="@smoke"
```

## Step 8: Rollback (If Needed)

```bash
# List recent deployments
railway deployments --service backend

# Roll back to previous deployment
railway rollback --service backend --deployment <DEPLOYMENT_ID>
```

## Verification Gate

All must pass before considering deploy complete:

| Check | Command | Expected |
|-------|---------|----------|
| Backend health | `curl /health` | `{"status":"ok"}` |
| Frontend loads | `curl /` | 200 + HTML |
| DB connection | `curl /api/status` | 200 |
| No error logs | `railway logs` | No ERROR in last 50 lines |

```bash
# Final gate check
echo "=== DEPLOY VERIFICATION ==="
curl -sf "https://${BACKEND_URL}/health" && echo "✓ Backend healthy"
curl -sf "https://${FRONTEND_URL}" > /dev/null && echo "✓ Frontend live"
railway logs --service backend --lines 50 | grep -c "ERROR" | \
  xargs -I{} sh -c '[ {} -eq 0 ] && echo "✓ No errors in logs" || echo "✗ Errors found"'
echo "=========================="
echo "Live URLs:"
echo "  Frontend: https://${FRONTEND_URL}"
echo "  Backend:  https://${BACKEND_URL}"
```

## Railway Tips
- **Auto-deploy on push:** Connect your GitHub repo in Railway dashboard → every push to `main` triggers deploy
- **Environment parity:** Railway staging environment mirrors production — use `railway environment staging`
- **Costs:** Railway charges per vCPU/memory usage — check dashboard for billing alerts
- **Logs retention:** 7 days by default — export critical logs if needed
