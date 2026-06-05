# AetherFlow Project Documentation

This document describes the current AetherFlow codebase, its architecture, implemented capabilities, known gaps, and the recommended roadmap for moving closer to n8n-style workflow automation parity.

The frontend currently uses the FlowCore product name in the UI. The broader platform goal described by the project is AetherFlow.

## 1. Product Overview

AetherFlow is a self-hosted workflow automation platform. Users can create workflows visually, configure nodes, store reusable credentials, trigger workflows manually or through webhooks and schedules, and inspect historical execution logs.

The target product direction is a practical n8n-like system:

- Visual workflow creation.
- Node-based automation graph.
- Trigger, action, logic, utility, and integration nodes.
- Credentials and secrets.
- Variables.
- Execution history and debugging.
- Realtime workflow status.
- Import and export.
- Workflow lifecycle management.

## 2. Current Architecture

### High-Level Runtime

```text
Browser
  |
  | React + Vite frontend
  | REST + Socket.IO
  v
Express API
  |
  | Prisma
  v
PostgreSQL

Express API
  |
  | BullMQ
  v
Redis
  |
  v
Workers
```

### Frontend Responsibilities

The frontend is located in `apps/frontend`.

It is responsible for:

- Authentication screens.
- App shell and navigation.
- Dashboard, workflows, builder, execution logs, monitoring, templates, and settings pages.
- Workflow builder canvas using React Flow.
- Node catalog and node parameter rendering.
- Zustand stores for auth, workflows, credentials, executions, variables, and UI state.
- API calls through Axios.
- Socket.IO client connection for realtime execution updates.

Important files:

```text
apps/frontend/src/App.jsx
apps/frontend/src/main.jsx
apps/frontend/src/pages/WorkflowBuilder.jsx
apps/frontend/src/pages/Executions.jsx
apps/frontend/src/pages/Workflows.jsx
apps/frontend/src/workflow-builder/FlowEditor.jsx
apps/frontend/src/workflow-builder/ParameterRenderer.jsx
apps/frontend/src/workflow-builder/CredentialSelector.jsx
apps/frontend/src/store/workflowStore.js
apps/frontend/src/store/executionStore.js
apps/frontend/src/store/authStore.js
apps/frontend/src/services/api.js
```

### Backend Responsibilities

The backend is located in `backend`.

It is responsible for:

- Express API.
- Authentication and refresh tokens.
- Workflow CRUD.
- Workflow version snapshots.
- Trigger activation and deactivation.
- Manual, webhook, and schedule trigger entry points.
- Execution orchestration.
- Node registry and node execution.
- Credential encryption and credential APIs.
- Variables and tags.
- Execution APIs.
- Socket.IO event publishing.
- BullMQ workers.
- Health checks.

Important files:

```text
backend/src/app.js
backend/src/server.js
backend/src/routes/*.js
backend/src/controllers/*.js
backend/src/services/*.js
backend/src/orchestrator/index.js
backend/src/nodes/registry.js
backend/src/nodes/definitions/*.node.js
backend/src/queues/*.js
backend/src/workers/*.js
backend/src/triggers/cron.js
backend/src/sockets/*.js
backend/src/prisma/schema.prisma
```

## 3. Implemented Feature Inventory

### Authentication

Implemented:

- User registration.
- Login.
- JWT access tokens.
- Refresh tokens.
- Authenticated route middleware.
- Frontend protected routes.
- Local storage token persistence.

Primary files:

```text
backend/src/routes/auth.routes.js
backend/src/controllers/auth.controller.js
backend/src/services/auth.service.js
backend/src/middleware/auth.middleware.js
apps/frontend/src/store/authStore.js
apps/frontend/src/pages/Login.jsx
apps/frontend/src/pages/Register.jsx
```

### Workflow Management

Implemented:

- Create workflows.
- List workflows.
- Get workflow with nodes and edges.
- Update workflow metadata, nodes, and edges.
- Delete workflows.
- Clone workflows.
- Publish workflows.
- Pause workflows.
- Resume workflows.
- Import workflows.
- Export workflows.
- Version history.
- Restore version.
- Tags.

Primary files:

```text
backend/src/routes/workflow.routes.js
backend/src/controllers/workflow.controller.js
backend/src/services/workflow.service.js
apps/frontend/src/store/workflowStore.js
apps/frontend/src/pages/Workflows.jsx
apps/frontend/src/pages/WorkflowBuilder.jsx
```

### Workflow Builder

Implemented:

- React Flow canvas.
- Start node fallback for new workflows.
- Node catalog.
- Drag and drop nodes.
- Node configuration panel.
- Credential selector integration.
- Parameter renderer.
- Sticky notes.
- Deleteable edges.
- Node context menu.
- Rename node.
- Duplicate node.
- Disable node toggle in UI state.
- Auto layout.
- Undo and redo.
- Copy and paste.
- Import and export.
- Save, publish, and execute buttons.
- Execution output panel.

Important recent fix:

- `WorkflowBuilder.jsx` imports `useMemo` and supports saving new workflows from `/builder` before an ID exists.

### Node Framework

Implemented:

- Registry loads files from `backend/src/nodes/definitions`.
- Each node definition exposes description metadata.
- Frontend can request node descriptions through `/node-types`.
- Parameter renderer uses node definition properties.

Current node categories include:

- Trigger nodes.
- Action nodes.
- Logic nodes.
- Utility nodes.
- Database nodes.
- Messaging/email nodes.

### Credentials

Implemented:

- Credential model.
- Credential API routes.
- Credential type listing.
- Credential create, read, update, delete.
- Credential test endpoint.
- Encryption service.
- Frontend credential store and selector.

Primary files:

```text
backend/src/routes/credential.routes.js
backend/src/controllers/credential.controller.js
backend/src/services/credential.service.js
backend/src/services/encryption.service.js
apps/frontend/src/store/credentialStore.js
apps/frontend/src/workflow-builder/CredentialSelector.jsx
```

### Variables

Implemented:

- Variable model.
- Unique variable key per user.
- Variable CRUD routes.
- Frontend variable store.

Primary files:

```text
backend/src/routes/variable.routes.js
backend/src/controllers/variable.controller.js
backend/src/services/variable.service.js
apps/frontend/src/store/variableStore.js
```

### Executions

Implemented:

- Workflow run model.
- Node execution model.
- Execution data model.
- Execution list API.
- Execution details API.
- Node execution data API.
- Retry, cancel, and delete execution routes.
- Legacy `/runs/:id` route.
- Execution logs frontend page.
- Live event stream for running executions.

Important recent fix:

- `Executions.jsx` now handles `/workflows/:id/runs` returning `{ runs, total }`.

### Realtime Events

Implemented:

- Socket.IO server initialized in `backend/src/server.js`.
- Socket client in `apps/frontend/src/hooks/useSocket.js`.
- Workflow and node event handlers in execution store.
- Builder can join a run room and receive execution events.

### Security Foundations

Implemented:

- Helmet.
- CORS.
- JSON body size limit.
- Rate limiting.
- JWT route protection.
- Password hashing.
- Credential encryption service.

Needs more hardening before production:

- Strong secret generation and rotation policy.
- SSRF protection for HTTP nodes.
- Code node sandboxing.
- Webhook authentication options.
- Audit logging.
- RBAC.
- Workspace boundaries.

## 4. Backend API Contract

### Public

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/health` | Health check with database and Redis probes. |
| `POST` | `/auth/register` | Register account. |
| `POST` | `/auth/login` | Login. |
| `POST` | `/auth/refresh` | Refresh access token. |
| `POST` | `/webhooks/:workflowId/:secret` | Webhook trigger entry point. |

### Authenticated

All authenticated requests require:

```http
Authorization: Bearer <accessToken>
```

#### Workflows

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/workflows` | List workflows. |
| `POST` | `/workflows` | Create workflow. |
| `POST` | `/workflows/import` | Import workflow JSON. |
| `GET` | `/workflows/:id` | Get workflow. |
| `PUT` | `/workflows/:id` | Update workflow. |
| `DELETE` | `/workflows/:id` | Delete workflow. |
| `POST` | `/workflows/:id/publish` | Publish and snapshot. |
| `POST` | `/workflows/:id/pause` | Pause workflow. |
| `POST` | `/workflows/:id/resume` | Resume workflow. |
| `POST` | `/workflows/:id/clone` | Clone workflow. |
| `GET` | `/workflows/:id/runs` | Execution history. |
| `POST` | `/workflows/:id/trigger` | Manual trigger. |
| `GET` | `/workflows/:id/versions` | Version history. |
| `POST` | `/workflows/:id/versions/:version/restore` | Restore snapshot. |
| `GET` | `/workflows/:id/export` | Export workflow JSON. |

#### Executions

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/executions` | List execution runs. |
| `GET` | `/executions/:runId` | Execution details. |
| `GET` | `/executions/:runId/nodes/:nodeId` | Node data. |
| `POST` | `/executions/:runId/retry` | Retry execution. |
| `POST` | `/executions/:runId/cancel` | Cancel execution. |
| `DELETE` | `/executions/:runId` | Delete execution. |
| `GET` | `/runs/:id` | Legacy run detail route. |

#### Credentials

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/credentials` | List credentials. |
| `POST` | `/credentials` | Create credential. |
| `GET` | `/credentials/types` | List credential types. |
| `GET` | `/credentials/:id` | Get credential. |
| `PUT` | `/credentials/:id` | Update credential. |
| `DELETE` | `/credentials/:id` | Delete credential. |
| `POST` | `/credentials/:id/test` | Test credential. |

#### Variables, Tags, Node Types

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/variables` | List variables. |
| `POST` | `/variables` | Create variable. |
| `PUT` | `/variables/:id` | Update variable. |
| `DELETE` | `/variables/:id` | Delete variable. |
| `GET` | `/tags` | List tags. |
| `POST` | `/tags` | Create tag. |
| `DELETE` | `/tags/:id` | Delete tag. |
| `POST` | `/tags/workflows/:workflowId` | Attach tag. |
| `DELETE` | `/tags/workflows/:workflowId/:tagId` | Detach tag. |
| `GET` | `/node-types` | List node definitions. |

## 5. Data Model Summary

### User

Owns workflows, credentials, variables, and refresh tokens.

Security notes:

- Passwords are stored as hashes.
- Refresh tokens should be revocable.
- Future workspace support should move ownership from only `userId` to a workspace or project boundary.

### Workflow

Represents the automation. Owns nodes, edges, runs, triggers, versions, tags, and pin data.

Key fields:

- `name`
- `description`
- `status`
- `version`
- `settings`
- `staticData`

### WorkflowNode

Represents one canvas node.

Key fields:

- `type`
- `label`
- `config`
- `positionX`
- `positionY`
- `disabled`
- `settings`

### WorkflowEdge

Represents one connection between two nodes.

Key fields:

- `sourceNodeId`
- `targetNodeId`
- `sourceOutput`
- `targetInput`
- `branchType`

### WorkflowRun

Represents a workflow execution.

Key fields:

- `workflowId`
- `status`
- `mode`
- `startedAt`
- `completedAt`
- `triggerPayload`
- `errorMessage`
- `lastExecutedNodeId`

### NodeExecution

Represents execution of one node in a run.

Key fields:

- `workflowRunId`
- `nodeId`
- `nodeName`
- `status`
- `inputData`
- `outputData`
- `durationMs`
- `errorMessage`
- `attempt`

### Credential

Stores encrypted reusable credential data.

Future improvements:

- Credential type schema model.
- OAuth account/token models.
- Credential sharing rules.
- Masked and redacted API responses.

### Variable

Stores user-scoped key-value configuration.

Future improvements:

- Workspace variables.
- Secret variables.
- Environment scopes.

### WorkflowVersion

Stores workflow snapshots.

Future improvements:

- Diff view.
- Restore preview.
- Version comments and publish approvals.

### NodePinData

Stores pinned node output for debugging.

Future improvements:

- UI integration for pinned data.
- Pin data import/export.
- Per-user pin data ownership.

## 6. Execution Engine

The current execution engine is a useful foundation, but it is not yet a full n8n-compatible engine.

### Current Capabilities

- Executes workflow graph.
- Records workflow run status.
- Records node-level execution data.
- Emits realtime events.
- Supports manual, webhook, and schedule entry points.
- Has worker processes for async/background jobs.

### Required n8n-Level Improvements

#### Item-Based Data Flow

n8n executes arrays of items where each item carries JSON and optional binary data.

Recommended item envelope:

```js
{
  json: {},
  binary: {},
  pairedItem: {
    item: 0,
    input: 0,
    sourceNode: "node-id"
  },
  metadata: {}
}
```

#### Node Runtime Contract

Recommended internal interface:

```js
async function executeNode({
  node,
  inputItems,
  credentials,
  variables,
  staticData,
  helpers,
  executionContext
}) {
  return {
    outputItems: [],
    branchOutputs: {},
    waitUntil: null,
    metadata: {}
  };
}
```

#### Branching

Required semantics:

- One node can emit multiple output branches.
- IF/Switch must route items to branch-specific outputs.
- Merge must support append, combine, wait-for-both, and pass-through modes.

#### Partial Runs

Needed builder features:

- Run selected node.
- Run from here.
- Run to here.
- Use pinned data for upstream nodes.

#### Wait/Resume

Required backend features:

- Persist wait state.
- Resume by timer, webhook, or manual action.
- Prevent workers from holding long-running memory state.

#### Cancellation

Required backend features:

- Store cancellation request.
- Workers check cancellation between node executions.
- Socket emits cancellation state.

## 7. Expression and Mapping System

The project should evolve toward a full expression engine for dynamic node fields.

### Recommended Expression Syntax

Examples:

```text
{{$json.email}}
{{$node["HTTP Request"].json.id}}
{{$vars.companyName}}
{{$env.NODE_ENV}}
{{$now}}
```

### Runtime Resolution

Each node parameter should be resolved before node execution:

1. Load raw node config.
2. Detect expression fields.
3. Build expression context.
4. Evaluate safely.
5. Pass resolved config to node executor.

### Required Context

```js
{
  $json,
  $item,
  $node,
  $vars,
  $env,
  $workflow,
  $execution,
  $now,
  helpers
}
```

### Security Requirements

- Do not use unrestricted `eval`.
- Limit available globals.
- Timeout expression evaluation.
- Prevent filesystem, process, and network access from expressions.
- Redact secrets in previews.

### Frontend UX

Needed components:

- Expression toggle per field.
- Expression editor.
- Data picker from previous node outputs.
- Preview result panel.
- Validation errors inline.

## 8. Credential and Secret Design

Current credential support is a good start. To reach production quality, add:

- Credential type registry.
- Required field schema per credential type.
- OAuth2 authorization code flow.
- OAuth2 refresh token handling.
- Per-node credential requirements.
- Credential testing adapters.
- Redaction service for logs and API responses.
- Workspace sharing and ownership.

Recommended credential response shape:

```js
{
  id: "cred-id",
  name: "Production Stripe",
  type: "httpHeaderAuth",
  createdAt: "...",
  updatedAt: "...",
  dataPreview: {
    apiKey: "********"
  }
}
```

## 9. Frontend State Architecture

Current Zustand stores:

- `authStore`
- `workflowStore`
- `executionStore`
- `credentialStore`
- `variableStore`
- `uiStore`

Recommended future builder store shape:

```js
{
  workflow: {
    id,
    name,
    description,
    status,
    version,
    settings
  },
  graph: {
    nodes: [],
    edges: [],
    selectedNodeId,
    selectedEdgeId
  },
  nodeTypes: {
    byName: {},
    allNames: []
  },
  execution: {
    activeRunId,
    nodeExecutionsByRunId: {},
    pinnedDataByNodeId: {}
  },
  editor: {
    isDirty,
    isSaving,
    panelTab,
    commandPaletteOpen,
    nodePickerOpen
  }
}
```

## 10. Security and Production Hardening

### Already Present

- Helmet.
- CORS.
- Rate limiting.
- JWT authentication.
- Password hashing.
- JSON body limit.
- Credential encryption service.

### Add Before Production

- Strong `JWT_SECRET`.
- Strong `ENCRYPTION_KEY`.
- Secret rotation strategy.
- HTTPS termination.
- CSRF strategy if cookies are introduced.
- SSRF protection for HTTP nodes.
- Block private IP ranges in HTTP request nodes by default.
- Code node sandbox with CPU and memory limits.
- Audit logs for auth, workflow changes, credentials, and executions.
- Permission checks for every resource.
- Payload size limits for webhook routes.
- Webhook signature support.
- PII and secret redaction in logs.
- Rate limits per route type.

## 11. Observability

Recommended additions:

- Structured request logs.
- Execution lifecycle logs.
- Queue metrics.
- Worker heartbeat.
- Failed job dashboard.
- Prometheus metrics endpoint.
- OpenTelemetry traces.
- Retention policy for execution data.
- Dead-letter queue handling.
- Admin page for queue status.

Suggested metrics:

- `workflow_runs_total`
- `workflow_run_duration_ms`
- `workflow_run_failed_total`
- `node_execution_duration_ms`
- `queue_jobs_waiting`
- `queue_jobs_active`
- `queue_jobs_failed`
- `http_requests_total`
- `http_request_duration_ms`

## 12. Roadmap Toward n8n Parity

### Phase 1: Stabilize Foundations

Goals:

- Make existing flows reliable.
- Remove mock fallbacks from production paths.
- Standardize API response shapes.
- Improve error boundaries.

Deliverables:

- Frontend error boundary around protected pages.
- Unified execution details endpoint.
- Consistent `/executions` and `/runs` usage.
- Better API errors.
- Tests for builder save/create flow.
- Tests for execution logs data loading.

### Phase 2: Expression and Data Flow

Goals:

- Add n8n-like item execution.
- Add expression runtime.
- Add expression editor.

Deliverables:

- Item envelope.
- Expression parser and evaluator.
- Parameter resolver.
- Previous node output picker.
- Runtime tests for expressions.

### Phase 3: Node System

Goals:

- Make nodes registry-driven end to end.
- Support richer node definitions.

Deliverables:

- Node schema contract.
- Credential requirement metadata.
- Dynamic `loadOptions`.
- Node validation hooks.
- Node test execution endpoint.
- More integration nodes.

### Phase 4: Debugging UX

Goals:

- Make execution inspection feel close to n8n.

Deliverables:

- Node-by-node execution timeline.
- Input/output item inspector.
- Pinned data UI.
- Retry from failed node.
- Run from here and run to here.
- Execution diff view.

### Phase 5: Production Platform

Goals:

- Support teams and production operations.

Deliverables:

- Workspaces/projects.
- RBAC.
- Audit logs.
- API keys or personal access tokens.
- Execution retention policies.
- Queue dashboard.
- Metrics and tracing.

## 13. Immediate Next 10 Engineering Tasks

1. Add a frontend error boundary around `MainAppShell` routes.
2. Add Playwright or React Testing Library smoke tests for `/login`, `/workflows`, `/builder`, and `/executions`.
3. Standardize execution detail fetching to prefer `/executions/:runId` and retire legacy `/runs/:id` from the frontend.
4. Add backend tests for `POST /workflows` with nodes and edges.
5. Add backend tests for `GET /workflows/:id/runs` response shape.
6. Add a node execution item envelope and update one or two nodes to prove the pattern.
7. Implement a safe expression resolver for simple `{{$json.path}}` expressions.
8. Add an expression toggle and preview to `ParameterRenderer`.
9. Add credential redaction to every credential API response.
10. Add a local Docker Compose file for PostgreSQL and Redis.

## 14. Development Checklist

Before opening a PR or submitting the project:

- Backend starts with `npm run dev`.
- Worker starts with `npm run worker`.
- Frontend starts with `npm run dev`.
- `GET /health` returns database and Redis status.
- User can register and login.
- User can create a workflow.
- `/builder` opens without a blank page.
- New workflow can be saved from the builder.
- Existing workflow can be loaded by `/builder?id=<id>`.
- Workflow can be manually executed.
- Execution logs page shows real run history.
- `npm test` passes in `backend`.
- `npm run build` passes in `apps/frontend`.

## 15. Known Limitations

- Not a complete n8n replacement yet.
- No workspace/project model yet.
- No full RBAC.
- No complete expression editor.
- No fully isolated code node sandbox.
- No complete OAuth credential lifecycle.
- No binary data subsystem.
- No template marketplace.
- No built-in Docker Compose file in the current workspace.
- Execution semantics need deeper item-based behavior.

