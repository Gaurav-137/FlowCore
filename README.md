# AetherFlow Workflow Automation Platform

AetherFlow is a self-hosted workflow automation platform inspired by n8n. It provides a visual workflow builder, authenticated workspace UI, workflow CRUD, credential storage, variables, triggers, execution history, node-level execution data, and real-time execution updates.

The product currently uses the FlowCore brand in the frontend UI, but the project goal is AetherFlow: an n8n-style automation engine built with React, Node.js, PostgreSQL, Redis, BullMQ, Prisma, and Socket.IO.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Environment Variables](#environment-variables)
- [Local Setup](#local-setup)
- [Running the App](#running-the-app)
- [Scripts](#scripts)
- [Backend API](#backend-api)
- [Workflow Builder](#workflow-builder)
- [Execution Model](#execution-model)
- [Database Models](#database-models)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)
- [Current n8n Parity Status](#current-n8n-parity-status)
- [Documentation](#documentation)

## Features

### Implemented

- JWT authentication with refresh tokens.
- Protected React dashboard with login and register pages.
- Workflow CRUD with draft, active, inactive, and error statuses.
- Visual workflow builder using React Flow.
- Drag-and-drop node catalog and configurable node parameter panel.
- Workflow save, publish, pause, resume, clone, import, and export.
- Manual workflow execution trigger.
- Webhook trigger support.
- Cron schedule trigger support.
- Execution history with workflow run and node execution records.
- Live execution events over Socket.IO.
- Credential management with encrypted credential payloads.
- Variable management.
- Workflow tags.
- Workflow version snapshots and restore.
- Node pin data data model.
- Rate limiting, Helmet, CORS, and JSON body limits.
- Health check endpoint for database and Redis.
- Backend Jest tests.
- Frontend production build with Vite.

### Core Node Library

The backend includes a registry-driven node definition system under `backend/src/nodes/definitions`.

Current node definitions include:

- Start
- Webhook
- Schedule
- HTTP Request
- Notify
- Delay
- IF
- Switch
- Filter
- Set
- Code
- Merge
- Loop
- Split in Batches
- Wait
- Execute Workflow
- Respond to Webhook
- Date and Time
- JSON
- CSV
- Postgres
- Redis
- Email IMAP
- Sticky Note support in the frontend builder

## Tech Stack

### Frontend

- React 18
- Vite
- React Router
- Zustand
- React Flow
- Socket.IO Client
- Framer Motion
- Tailwind CSS
- Lucide React icons
- Recharts
- Axios

### Backend

- Node.js
- Express
- Prisma
- PostgreSQL
- Redis
- BullMQ
- Socket.IO
- Zod
- JWT
- bcrypt
- Helmet
- express-rate-limit
- Pino
- Jest and Supertest

## Project Structure

```text
.
├── apps/
│   └── frontend/
│       ├── src/
│       │   ├── pages/
│       │   ├── workflow-builder/
│       │   ├── store/
│       │   ├── services/
│       │   ├── hooks/
│       │   └── components/
│       ├── package.json
│       └── vite.config.js
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── nodes/
│   │   ├── orchestrator/
│   │   ├── queues/
│   │   ├── workers/
│   │   ├── triggers/
│   │   ├── sockets/
│   │   ├── validators/
│   │   ├── prisma/
│   │   └── app.js
│   ├── tests/
│   └── package.json
├── docs/
│   └── PROJECT_DOCUMENTATION.md
├── DESIGN-figma.md
└── README.md
```

## Prerequisites

- Node.js 18 or newer.
- npm.
- PostgreSQL.
- Redis.

No Docker Compose file is currently present in this workspace. If you want containerized local development, add a `docker-compose.yml` for PostgreSQL, Redis, backend, and frontend.

## Environment Variables

### Backend

Copy the example file:

```bash
cd backend
cp .env.example .env
```

Required and supported variables:

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/workflows
REDIS_URL=redis://localhost:6379
JWT_SECRET=replace-with-a-long-random-secret
ACCESS_TOKEN_EXPIRES=15m
REFRESH_TOKEN_EXPIRES=30d
PORT=4000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
ENCRYPTION_KEY=32-byte-base64-or-hex-key
LOG_LEVEL=info
SMTP_HOST=localhost
SMTP_PORT=1025
```

The checked-in `backend/.env.example` uses service hostnames such as `postgres` and `redis`, which are useful for container networking. For direct local development, use `localhost` instead.

### Frontend

Copy the example file:

```bash
cd apps/frontend
cp .env.example .env
```

Supported variable:

```env
VITE_API_URL=http://localhost:4000
```

## Local Setup

### 1. Install backend dependencies

```bash
cd backend
npm install
```

### 2. Install frontend dependencies

```bash
cd apps/frontend
npm install
```

### 3. Start PostgreSQL and Redis

Use your preferred local installation. The backend expects:

- PostgreSQL reachable through `DATABASE_URL`.
- Redis reachable through `REDIS_URL`.

### 4. Generate Prisma client

```bash
cd backend
npm run prisma
```

### 5. Apply database schema

The project currently includes Prisma schema models in `backend/src/prisma/schema.prisma`.

For development, run:

```bash
cd backend
npx prisma migrate dev --schema=src/prisma/schema.prisma --name init
```

If migrations are not available or you are resetting a local database, you can use:

```bash
npx prisma db push --schema=src/prisma/schema.prisma
```

## Running the App

Open three terminals.

### Terminal 1: Backend API

```bash
cd backend
npm run dev
```

Default URL:

```text
http://localhost:4000
```

### Terminal 2: Workers

```bash
cd backend
npm run worker
```

### Terminal 3: Frontend

```bash
cd apps/frontend
npm run dev
```

Default URL:

```text
http://localhost:5173
```

Then open:

```text
http://localhost:5173/login
```

## Scripts

### Backend

Run from `backend/`.

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Express API with nodemon. |
| `npm start` | Start the Express API once. |
| `npm run worker` | Start BullMQ workers. |
| `npm run prisma` | Generate Prisma client from `src/prisma/schema.prisma`. |
| `npm test` | Run all Jest tests. |
| `npm run test:unit` | Run validator unit tests. |
| `npm run test:integration` | Run workflow integration tests. |
| `npm run lint` | Run ESLint. |
| `npm run format` | Run Prettier for backend source files. |

### Frontend

Run from `apps/frontend/`.

| Command | Description |
| --- | --- |
| `npm run dev` | Start Vite dev server. |
| `npm run build` | Build production frontend bundle. |
| `npm run preview` | Preview production build locally. |

## Backend API

Base URL:

```text
http://localhost:4000
```

### Public Routes

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/health` | API, database, and Redis health status. |
| `POST` | `/auth/register` | Create a user account. |
| `POST` | `/auth/login` | Login and receive tokens. |
| `POST` | `/auth/refresh` | Refresh access token. |
| `POST` | `/webhooks/:workflowId/:secret` | Trigger a workflow by webhook. |

### Authenticated Routes

Requests require:

```http
Authorization: Bearer <accessToken>
```

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/auth/me` | Current authenticated user. |
| `GET` | `/workflows` | List user workflows. |
| `POST` | `/workflows` | Create workflow. |
| `GET` | `/workflows/:id` | Get workflow with nodes and edges. |
| `PUT` | `/workflows/:id` | Update workflow canvas and metadata. |
| `DELETE` | `/workflows/:id` | Delete workflow. |
| `POST` | `/workflows/:id/publish` | Create version snapshot and activate workflow. |
| `POST` | `/workflows/:id/pause` | Deactivate workflow. |
| `POST` | `/workflows/:id/resume` | Activate workflow triggers. |
| `POST` | `/workflows/:id/clone` | Clone workflow. |
| `GET` | `/workflows/:id/runs` | List workflow run history. |
| `POST` | `/workflows/:id/trigger` | Manually trigger workflow. |
| `GET` | `/workflows/:id/versions` | List workflow versions. |
| `POST` | `/workflows/:id/versions/:version/restore` | Restore a version snapshot. |
| `GET` | `/workflows/:id/export` | Export workflow JSON. |
| `POST` | `/workflows/import` | Import workflow JSON. |
| `GET` | `/executions` | List execution runs. |
| `GET` | `/executions/:runId` | Get execution detail. |
| `GET` | `/executions/:runId/nodes/:nodeId` | Get node execution data. |
| `POST` | `/executions/:runId/retry` | Retry execution. |
| `POST` | `/executions/:runId/cancel` | Cancel execution. |
| `DELETE` | `/executions/:runId` | Delete execution. |
| `GET` | `/runs/:id` | Legacy run detail route. |
| `GET` | `/credentials` | List credentials. |
| `POST` | `/credentials` | Create credential. |
| `GET` | `/credentials/types` | List credential types. |
| `GET` | `/credentials/:id` | Get credential metadata. |
| `PUT` | `/credentials/:id` | Update credential. |
| `DELETE` | `/credentials/:id` | Delete credential. |
| `POST` | `/credentials/:id/test` | Test credential. |
| `GET` | `/variables` | List variables. |
| `POST` | `/variables` | Create variable. |
| `PUT` | `/variables/:id` | Update variable. |
| `DELETE` | `/variables/:id` | Delete variable. |
| `GET` | `/node-types` | List backend node definitions. |
| `GET` | `/tags` | List tags. |
| `POST` | `/tags` | Create tag. |
| `DELETE` | `/tags/:id` | Delete tag. |
| `POST` | `/tags/workflows/:workflowId` | Attach tag to workflow. |
| `DELETE` | `/tags/workflows/:workflowId/:tagId` | Detach tag from workflow. |

## Workflow Builder

The builder lives at:

```text
http://localhost:5173/builder
```

For an existing workflow:

```text
http://localhost:5173/builder?id=<workflowId>
```

Builder capabilities:

- Node catalog sidebar.
- Drag and drop nodes onto the canvas.
- Start node fallback for new workflows.
- Node parameter drawer.
- Credential selectors for nodes that require credentials.
- Node context menu.
- Sticky notes.
- Deleteable edges.
- Auto layout.
- Undo and redo.
- Copy and paste selected node.
- Import and export workflow JSON.
- Save, publish, and execute controls.
- Execution output panel for selected nodes.
- Live execution progress display.

## Execution Model

The current workflow engine records:

- `WorkflowRun` for each run.
- `NodeExecution` for each node.
- Input and output JSON per node.
- Duration and status per node.
- Run-level error message.
- Last executed node.

Trigger types:

- Manual trigger through `/workflows/:id/trigger`.
- Webhook trigger through `/webhooks/:workflowId/:secret`.
- Schedule trigger through cron schedules.

Execution statuses:

- `PENDING`
- `RUNNING`
- `SUCCESS`
- `FAILED`
- `CANCELLED`
- `WAITING`

Node execution statuses:

- `PENDING`
- `RUNNING`
- `SUCCESS`
- `FAILED`
- `SKIPPED`

## Database Models

Main Prisma models:

- `User`
- `RefreshToken`
- `Workflow`
- `WorkflowNode`
- `WorkflowEdge`
- `WorkflowRun`
- `NodeExecution`
- `ExecutionData`
- `WorkflowSchedule`
- `Webhook`
- `Credential`
- `Variable`
- `WorkflowVersion`
- `WorkflowTag`
- `WorkflowTagBinding`
- `NodePinData`

Schema file:

```text
backend/src/prisma/schema.prisma
```

## Testing

Run backend tests:

```bash
cd backend
npm test
```

Run unit tests:

```bash
npm run test:unit
```

Run integration tests:

```bash
npm run test:integration
```

Build frontend:

```bash
cd apps/frontend
npm run build
```

## Troubleshooting

### Login opens but protected pages redirect back to login

Make sure the backend is running and the frontend `VITE_API_URL` points to the backend.

### Backend cannot connect to database

Check `DATABASE_URL` in `backend/.env`.

For local development, the host is usually `localhost`, not `postgres`.

### Backend cannot connect to Redis

Check `REDIS_URL` in `backend/.env`.

For local development:

```env
REDIS_URL=redis://localhost:6379
```

### Prisma client errors

Regenerate the Prisma client:

```bash
cd backend
npm run prisma
```

Then apply the schema:

```bash
npx prisma migrate dev --schema=src/prisma/schema.prisma
```

### Blank builder or execution logs page

Run a production build to catch frontend compile errors:

```bash
cd apps/frontend
npm run build
```

Also open the browser console and check for React runtime errors.

### Websocket events do not appear

Verify:

- Backend API is running.
- Frontend is authenticated.
- `VITE_API_URL` points to the backend.
- Socket.IO is initialized by `backend/src/server.js`.

## Current n8n Parity Status

AetherFlow is not yet a complete n8n replacement. It has strong foundations, but several n8n-level capabilities still need deeper implementation.

### Strong Foundations

- Visual workflow builder.
- Node registry.
- Credentials.
- Variables.
- Workflow versions.
- Execution history.
- Webhook and schedule triggers.
- Realtime execution events.
- Import and export.

### Gaps Remaining

- Full item-based execution semantics.
- Complete expression editor and expression runtime.
- Rich binary data handling.
- Advanced credential OAuth flows.
- Node test runs and partial executions.
- Wait/resume execution persistence.
- Advanced merge semantics.
- Error workflow binding.
- Subworkflow production behavior.
- Multi-user workspaces and RBAC.
- Audit logging.
- Template marketplace.
- Worker isolation and code sandboxing.
- SSRF protection for HTTP nodes.
- Observability with metrics and tracing.
- Full n8n-compatible node ecosystem.

## Documentation

Read the full project document here:

[docs/PROJECT_DOCUMENTATION.md](docs/PROJECT_DOCUMENTATION.md)

It covers architecture, data models, frontend state, backend services, execution flow, security notes, and the implementation roadmap.

