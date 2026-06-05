# Workflow Orchestrator

This repository contains a workflow orchestration platform with:

- Backend API, auth, workflow CRUD, and orchestrator execution
- BullMQ queue workers for delays and notifications
- React + Vite frontend builder and real-time monitoring
- Docker Compose for local development
- Jest/Supertest backend tests and CI workflow support

## Getting started

### Backend setup

1. Copy `backend/.env.example` to `backend/.env` and update values as needed.
2. Install backend dependencies:

```bash
cd backend
npm install
npm run prisma generate
npm run prisma migrate dev --name init
npm run dev
```

### Frontend setup

1. Copy `apps/frontend/.env.example` to `apps/frontend/.env` if needed.
2. Install frontend dependencies:

```bash
cd apps/frontend
npm install
npm run dev
```

### Docker Compose

Use the correct command without a trailing tilde:

```bash
docker compose up --build
```

If you see an error like `unknown flag: --build~`, it means the command was typed with `--build~` instead of `--build`.

If Docker is not running yet, start Docker Desktop and verify with:

```bash
docker info
```

If you see Postgres initdb warnings about removing data files or a read-only filesystem, the local named volume may be corrupted. Recover by shutting down the compose stack and deleting the Postgres volume:

```bash
docker compose down -v
docker volume rm capstone_project_pgdata
docker compose build --no-cache
docker compose up --build
```

If the backend container still fails after cleanup, the most likely cause is host `node_modules` being copied into the Linux container. This repo now includes `.dockerignore` files in `backend/` and `apps/frontend/` to prevent that.

If log reads still fail, restart Docker Desktop and try again.

## Tests

Run backend tests from `backend/`:

```bash
cd backend
npm test
```

For unit-only tests:

```bash
npm run test:unit
```

For integration tests, make sure Postgres and Redis are running via Docker Compose or another local stack.

## Production readiness

### What is included

- Docker Compose for local development
- Backend API and worker containers
- Frontend Vite container
- Environment variable support via `.env` files
- GitHub Actions CI configuration for linting, testing, and frontend build

### Recommended production improvements

- Use real secrets instead of local `.env` values
- Add a production-ready Dockerfile or build pipeline for the backend and frontend
- Configure HTTPS/TLS for frontend and API endpoints
- Add a production deployment workflow or cloud infrastructure manifests
- Harden auth, rate limiting, and error handling for production use
- Add service health checks and logging/monitoring integration

## CI

A GitHub Actions workflow is configured in `.github/workflows/ci.yml` to run backend lint/tests and frontend build using Postgres and Redis service containers.
