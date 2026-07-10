# AptiCode – Deployment Guide & CI/CD Pipelines

This document details the configuration files, infrastructure topologies, build pipeline stages, and multi-tenant hosting definitions required to compile, build, containerize, and run AptiCode in staging and production.

---

## 1. Containerization Configuration

To maintain parity between local developer environments, staging setups, and production clusters, the systems run inside Docker.

### 1.1 Backend Dockerfile (`backend/Dockerfile`)
```dockerfile
# 1. Build Stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci
COPY . .
RUN npm run build
RUN npx prisma generate

# 2. Production Stage
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

ENV NODE_ENV=production
EXPOSE 5000

CMD ["node", "dist/app.js"]
```

### 1.2 Frontend Dockerfile (`frontend/Dockerfile`)
```dockerfile
# 1. Build Stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# 2. Production Runner
FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules

ENV NODE_ENV=production
EXPOSE 3000

CMD ["npm", "run", "start"]
```

---

## 2. Local/Staging Orchestration (`docker-compose.yml`)

Runs the frontend, backend, PostgreSQL, and Redis in local/staging environments.

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: apticode_postgres
    restart: always
    environment:
      POSTGRES_USER: apticode_admin
      POSTGRES_PASSWORD: SecureDbPassword2026
      POSTGRES_DB: apticode_production
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    container_name: apticode_redis
    restart: always
    ports:
      - "6379:6379"
    command: redis-server --appendonly yes --requirepass SecureRedisPassword2026
    volumes:
      - redisdata:/data

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: apticode_backend
    restart: always
    ports:
      - "5000:5000"
    environment:
      - DATABASE_URL=postgresql://apticode_admin:SecureDbPassword2026@postgres:5432/apticode_production?schema=public
      - REDIS_URL=redis://:SecureRedisPassword2026@redis:6379
      - JWT_SECRET=ProductionSuperSecretJWTKey2026!
      - GEMINI_API_KEY=${GEMINI_API_KEY}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - JUDGE0_API_URL=http://judge0:8000
    depends_on:
      - postgres
      - redis

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: apticode_frontend
    restart: always
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:5000
    depends_on:
      - backend

volumes:
  pgdata:
  redisdata:
```

---

## 3. CI/CD Deployment Pipeline (GitHub Actions)

Creates an automated path from code commit on `main` branch to active updates in production.

```yaml
name: AptiCode CI/CD Build and Deploy

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v3

      - name: Set up Node.js
        uses: actions/lookup-node@v3
        with:
          node-version: 18
          cache: 'npm'

      - name: Install Monorepo Dependencies
        run: npm ci

      - name: Run Linter Checks
        run: npm run lint

      - name: Run Unit Tests
        run: npm run test:unit

  deploy-backend:
    needs: validate
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v3

      - name: Configure AWS Credentials
        uses: aws-actions/configure-aws-credentials@v1-node16
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1

      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v1

      - name: Build, tag, and push Docker image to Amazon ECR
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          ECR_REPOSITORY: apticode-backend
          IMAGE_TAG: ${{ github.sha }}
        run: |
          docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG -t $ECR_REGISTRY/$ECR_REPOSITORY:latest ./backend
          docker push $ECR_REGISTRY/$ECR_REPOSITORY --all-tags

      - name: Update AWS ECS Service
        run: |
          aws ecs update-service --cluster apticode-prod-cluster --service apticode-backend-service --force-new-deployment

  deploy-frontend:
    needs: validate
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v3

      - name: Deploy to Vercel Production
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

---

## 4. Production Hosting Configuration & Infrastructure Guidelines

### 4.1 Frontend Platform (Vercel)
* **Caching**: Configure Vercel Edge Cache headers. Route API calls directly using AWS API Gateway rather than Next.js API Routes to minimize Vercel Serverless cold starts.
* **Environments**: Separate variables for production: `NEXT_PUBLIC_API_URL` pointing to the public AWS application load balancer.

### 4.2 Data Storage (AWS RDS PostgreSQL)
* **Instance Type**: Multi-AZ instance (e.g., `db.m6g.2xlarge` to support high concurrent I/O operations).
* **Replica Pattern**: Launch 2 Read Replicas. Configure database connection pools in Express to point all `SELECT` queries to replica endpoints.

### 4.3 Key-Value Cache (AWS ElastiCache Redis)
* **Cluster configuration**: Multi-node replication group, primary write node + secondary read-only nodes.
* **Eviction Policy**: Configure `volatile-lru` or `allkeys-lru` so Redis automatically evicts expired tokens and cached models first.
