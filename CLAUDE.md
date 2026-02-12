# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

A **Test Management Platform** with a Go backend and React frontend for test case management, workflow orchestration, and real-time execution monitoring.

## Common Commands

### Backend (run from `backend/`)

```bash
make init              # Full setup: install deps + build + import sample data
make run               # Build and run server (port 8090)
make dev               # Dev mode with auto-reload (GIN_MODE=debug)
make build             # Build server binary only
make test              # Run all Go tests
make test-cover        # Tests with coverage report
make fmt               # Format Go code
make lint              # Run golangci-lint
make import            # Import sample test data from examples/
```

Run a single test package:
```bash
cd backend
go test -v ./internal/workflow/...
go test -v -run TestSpecificName ./internal/service/...
```

### Frontend (run from `front/`)

```bash
pnpm install           # Install dependencies
pnpm dev               # Dev server on http://localhost:8081
pnpm build             # Production build to dist/
```

Note: The frontend uses **pnpm**, not npm. The dev server runs on port **8081** (configured in vite.config.ts).

## Architecture

### Backend Layered Architecture

```
Handler → Service → Repository → Database (GORM/SQLite)
```

- **Models** (`internal/models/`): GORM entities with custom `JSONB` and `JSONArray` types for SQLite JSON storage
- **Repository** (`internal/repository/`): Data access layer, all interface-based
- **Service** (`internal/service/`): Business logic, orchestration
- **Handler** (`internal/handler/`): HTTP endpoints. Each handler uses a `RegisterRoutes(rg *gin.RouterGroup)` method to self-register its routes
- **Middleware** (`internal/middleware/`): Tenant context isolation
- **Errors** (`internal/errors/`): Custom API error types

### Multi-Tenant Route Architecture

Routes are split into two groups in `cmd/server/main.go`:

1. **Public routes** — Tenant and project CRUD, user/role management (no tenant isolation)
2. **Tenant-isolated routes** (`/api/*`) — All test, workflow, environment, and action template endpoints pass through `TenantContext.ValidateTenantAndProject()` middleware

The middleware extracts `X-Tenant-ID` and `X-Project-ID` from request headers (or query params), falling back to `"default"` for both. These values are set in the Gin context for downstream handlers.

### Workflow Engine

- DAG-based execution with dependency resolution and parallel step execution within layers
- Variable interpolation with `{{VAR_NAME}}` syntax
- Step types: `http`, `command`, `test-case`
- Real-time execution streaming via WebSocket (`/api/ws/workflows/runs/:runId/stream`)
- Key files: `internal/workflow/executor.go`, `internal/workflow/step_executor.go`, `internal/workflow/broadcast_logger.go`
- Broadcast logger provides triple output: Database + WebSocket + Console

### WebSocket Architecture

Single Hub instance manages all connections, grouping clients by `runID`. Each client has dual goroutines (ReadPump + WritePump) with 256-message buffers and 54s heartbeat.

### Frontend

- React 19 + TypeScript + Vite
- `@xyflow/react` + `@dagrejs/dagre` for DAG/workflow visual editing
- `@google/genai` for Gemini AI integration
- `recharts` for data visualization
- Path alias: `@/*` maps to project root (configured in tsconfig.json and vite.config.ts)
- API client in `front/services/api/`

## Key Patterns

### Adding a New API Endpoint

1. Add handler method in `internal/handler/your_handler.go`
2. Register it inside the handler's `RegisterRoutes` method (not in main.go):
   ```go
   func (h *YourHandler) RegisterRoutes(rg *gin.RouterGroup) {
       rg.GET("/your-endpoint", h.YourMethod)
   }
   ```
3. If it's a new handler, instantiate it in `cmd/server/main.go` and call `handler.RegisterRoutes(api)`

### Custom JSON Types

`JSONB` and `JSONArray` in `internal/models/` handle JSON serialization for SQLite's TEXT columns. Use these for any structured data fields in GORM models.

### Context Propagation

All repository and service methods accept `context.Context` for cancellation, timeouts, and transaction management.

### Error Handling

Wrapped errors with context: `fmt.Errorf("failed to create test: %w", err)`. Custom API error types in `internal/errors/` are converted to HTTP status codes in handlers.

## Database

SQLite by default (configurable in `backend/config.toml`). GORM auto-migration runs on startup for all models. Manual migration scripts in `backend/migrations/` for schema extensions (action templates, test case extensions).

Core model groups:
- **Multi-tenant**: Tenant, Project, TenantMember, ProjectMember
- **Test management**: TestGroup, TestCase, TestResult, TestRun
- **Workflow**: Workflow, WorkflowRun, WorkflowStepExecution, WorkflowStepLog, WorkflowVariableChange
- **Environment**: Environment, EnvironmentVariable
- **Auth**: User, Role

## API Base URL

`http://localhost:8090/api` (tenant-isolated endpoints require `X-Tenant-ID` and `X-Project-ID` headers)

## Configuration

`backend/config.toml`:
```toml
[server]
host = "0.0.0.0"
port = 8090

[database]
type = "sqlite"
dsn = "./data/test_management.db"

[test]
target_host = "http://127.0.0.1:9095"
```

## Documentation

Seven-layer doc structure in `docs/`:
- `1-specs/` — API, database schema, backend architecture specs
- `2-requirements/` — PRDs, feature definitions
- `3-guides/` — Development, testing, deployment guides
- `4-planning/` — Active plans and backlog
- `5-wiki/` — Business knowledge by module (testcase, workflow, tenant)
- `6-decisions/` — Architecture Decision Records (ADRs)
- `7-archive/` — Historical documents by quarter
