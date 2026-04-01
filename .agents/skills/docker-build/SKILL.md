---
name: docker-build
description: Build production Docker images for React+Vite frontend and Node.js backend using multi-stage builds. Validates images locally before pushing. Use after code-quality-report passes.
metadata:
  author: ai-skills
  version: 1.0.0
  sdlc-phase: 6-build
  next-skill: deploy-railway
compatibility:
  tools: docker, docker compose
---

# Docker Build

Build lean, production-ready Docker images. Multi-stage builds only — no dev dependencies in production images.

## Trigger Conditions
- "Build Docker image"
- "Containerize the app"
- Automatically: after `code-quality-report` all gates pass

## Prerequisites
- `code-quality-report` all gates green
- Docker daemon running: `docker info`

## Frontend Dockerfile

```dockerfile
# frontend/Dockerfile

# ---- Build Stage ----
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci --frozen-lockfile

COPY . .
RUN npm run build          # Outputs to /app/dist

# ---- Production Stage ----
FROM nginx:alpine AS production

# Security: non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Nginx config for SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Fix permissions
RUN chown -R appuser:appgroup /usr/share/nginx/html \
    && chmod -R 755 /usr/share/nginx/html

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
```

**`frontend/nginx.conf`:**
```nginx
server {
    listen 8080;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";
    add_header Referrer-Policy "strict-origin-when-cross-origin";

    # Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;

    # Cache static assets
    location ~* \.(js|css|png|jpg|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

## Backend Dockerfile

```dockerfile
# backend/Dockerfile

# ---- Build Stage ----
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci --frozen-lockfile

COPY . .
RUN npm run build          # tsc → dist/

# ---- Production Stage ----
FROM node:20-alpine AS production
WORKDIR /app

ENV NODE_ENV=production

# Security: non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY package*.json ./
RUN npm ci --frozen-lockfile --omit=dev   # prod deps only

COPY --from=builder /app/dist ./dist

RUN chown -R appuser:appgroup /app
USER appuser

EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3001/health || exit 1

CMD ["node", "dist/index.js"]
```

## Build & Verify

```bash
# Build images
docker build -t myapp-frontend:latest ./frontend
docker build -t myapp-backend:latest ./backend

# Check image sizes (should be small)
docker images | grep myapp

# Run locally and verify
docker compose -f docker-compose.prod.yml up -d
sleep 5

# Health checks
curl -s http://localhost:8080 | grep -q "<!DOCTYPE html>" && echo "FRONTEND: OK"
curl -s http://localhost:3001/health | grep -q "ok" && echo "BACKEND: OK"

docker compose -f docker-compose.prod.yml down
```

## `docker-compose.prod.yml` (local production test)

```yaml
version: '3.9'
services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: appdb
      POSTGRES_USER: appuser
      POSTGRES_PASSWORD: apppassword
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U appuser"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    image: myapp-backend:latest
    environment:
      DATABASE_URL: postgres://appuser:apppassword@db:5432/appdb
      NODE_ENV: production
      PORT: 3001
    ports:
      - "3001:3001"
    depends_on:
      db:
        condition: service_healthy

  frontend:
    image: myapp-frontend:latest
    ports:
      - "8080:8080"
    depends_on:
      - backend
```

## Verification Gate

```bash
# Images must exist
docker image inspect myapp-frontend:latest > /dev/null && echo "FRONTEND IMAGE: OK"
docker image inspect myapp-backend:latest > /dev/null && echo "BACKEND IMAGE: OK"

# Images must be reasonably sized
FRONTEND_SIZE=$(docker image inspect myapp-frontend:latest --format='{{.Size}}')
BACKEND_SIZE=$(docker image inspect myapp-backend:latest --format='{{.Size}}')
echo "Frontend image size: $((FRONTEND_SIZE / 1024 / 1024))MB"
echo "Backend image size: $((BACKEND_SIZE / 1024 / 1024))MB"

# No CRITICAL vulnerabilities (if trivy available)
which trivy && trivy image myapp-backend:latest --severity CRITICAL
```

**Gate:** Both health checks must return 200 OK before `deploy-railway`.

## Artifacts Produced
- `myapp-frontend:latest` Docker image
- `myapp-backend:latest` Docker image
- `docker-compose.prod.yml` for local prod testing
