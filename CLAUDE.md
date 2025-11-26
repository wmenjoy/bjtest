# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is a **Test Management Platform** consisting of two main components:
1. **nextest-platform**: Go backend service for test case management, execution, and workflow orchestration
2. **NextTestPlatformUI**: React frontend built with Vite, TypeScript, and Gemini AI integration

## Project Structure

```
testplatform/
├── nextest-platform/          # Go backend service
│   ├── cmd/
│   │   ├── server/           # Main service entry point
│   │   └── import/           # Data import tool
│   ├── internal/
│   │   ├── config/           # TOML configuration management
│   │   ├── models/           # GORM data models
│   │   ├── repository/       # Data access layer
│   │   ├── service/          # Business logic layer
│   │   ├── handler/          # HTTP & WebSocket handlers
│   │   ├── testcase/         # Test execution engines (HTTP, Command)
│   │   ├── workflow/         # Workflow engine & executor
│   │   └── websocket/        # WebSocket hub & client management
│   ├── migrations/           # Database migration scripts
│   ├── examples/             # Sample test data (JSON)
│   ├── web/                  # Embedded web UI (HTML)
│   └── data/                 # SQLite database (auto-created)
│
└── NextTestPlatformUI/        # React frontend
    ├── components/           # React components
    ├── hooks/               # Custom React hooks
    └── data/                # Sample data files
```

## Backend (nextest-platform)

### Technology Stack
- **Language**: Go 1.24
- **Web Framework**: Gin
- **ORM**: GORM
- **Database**: SQLite (supports MySQL/PostgreSQL)
- **Configuration**: TOML
- **WebSocket**: Gorilla WebSocket

### Architecture
Clean layered architecture:
- **Models** (internal/models): GORM entities with custom JSON types (JSONB, JSONArray)
- **Repository** (internal/repository): Data access interfaces and implementations
- **Service** (internal/service): Business logic and test execution orchestration
- **Handler** (internal/handler): HTTP API and WebSocket endpoints

### Common Commands

**Build & Run**:
```bash
cd nextest-platform

# One-command setup (install deps + build + import sample data)
make init

# Build binaries
make build              # Build server
make build-import       # Build import tool
make build-all         # Build both

# Run service
make run               # Build and run
make dev               # Development mode with auto-reload
./test-service         # Run compiled binary

# Import sample test data
make import
```

**Development**:
```bash
# Install dependencies
make install-deps

# Format code
make fmt

# Run linter
make lint

# Run tests
make test
make test-cover        # With coverage report

# Clean build artifacts
make clean
make clean-db          # Clean database only
```

**API Testing**:
```bash
make health            # Check service health
make api-groups        # List test groups
make api-tests         # List test cases
make api-runs          # List test runs
```

### Database Design

**11 core tables** organized in 3 modules:

1. **Test Management** (4 tables):
   - `test_groups` - Hierarchical test organization
   - `test_cases` - Test definitions (HTTP, Command, Workflow)
   - `test_results` - Execution results
   - `test_runs` - Batch execution records

2. **Workflow Management** (5 tables):
   - `workflows` - Workflow definitions
   - `workflow_runs` - Execution records
   - `workflow_step_executions` - Step-level execution data
   - `workflow_step_logs` - Structured logs for each step
   - `workflow_variable_changes` - Variable mutation history

3. **Environment Management** (2 tables):
   - `environments` - Multi-environment configs (Dev/Staging/Prod)
   - `environment_variables` - Reserved for future extension

**Key features**:
- Soft delete support (GORM `DeletedAt`)
- Custom JSONB types for complex configurations
- Foreign key constraints with CASCADE deletion for workflow data
- Comprehensive indexing for performance

See `nextest-platform/docs/DATABASE_DESIGN.md` for complete schema.

### WebSocket Architecture

**Real-time workflow execution streaming**:

1. **Hub** (`internal/websocket/hub.go`):
   - Single instance managing all WebSocket connections
   - Groups clients by `runID` for targeted broadcasting
   - Thread-safe using mutexes and channels (256 buffer)

2. **Client** (`internal/websocket/client.go`):
   - One instance per connection
   - Dual goroutines: ReadPump (incoming) + WritePump (outgoing)
   - Auto-cleanup on disconnect
   - Heartbeat ping-pong every 54s

3. **Broadcast Logger** (`internal/workflow/broadcast_logger.go`):
   - Triple output: Database + WebSocket + Console
   - Used by workflow executor for real-time step logging

**WebSocket endpoint**: `ws://host/api/v2/workflows/runs/:runId/stream`

See `nextest-platform/WEBSOCKET_ARCHITECTURE.md` for detailed flow diagrams.

### Workflow Engine

**Core features**:
- DAG-based execution with dependency resolution
- Parallel step execution within layers
- Variable interpolation with `{{VAR_NAME}}` syntax
- Step types: `http`, `command`, `test-case`
- Retry mechanism with configurable attempts
- Error handling: `abort` or `continue` on failure

**Three integration modes**:
1. **Mode 1**: Test case references standalone workflow (via `workflow_id`)
2. **Mode 2**: Test case embeds workflow definition (via `workflow_def`)
3. **Mode 3**: Workflow step references test case (type: `test-case`)

**Key files**:
- `internal/workflow/executor.go` - Main execution engine
- `internal/workflow/types.go` - Workflow data structures
- `internal/workflow/actions/` - Action implementations (HTTP, Command, TestCase)

### API Endpoints

**Base URL**: `http://localhost:8090/api/v2`

**Test Management**:
- `POST /tests` - Create test case
- `GET /tests/:id` - Get test case
- `PUT /tests/:id` - Update test case
- `DELETE /tests/:id` - Delete test case
- `GET /tests` - List with pagination
- `GET /tests/search?q=keyword` - Search
- `POST /tests/:id/execute` - Execute test

**Workflow Management**:
- `POST /workflows` - Create workflow
- `GET /workflows/:id` - Get workflow
- `PUT /workflows/:id` - Update workflow
- `DELETE /workflows/:id` - Delete workflow
- `POST /workflows/:workflowId/execute` - Execute workflow
- `GET /workflows/runs/:runId` - Get execution result
- `GET /ws/workflows/runs/:runId/stream` - WebSocket for real-time logs

**Test Groups**:
- `POST /groups` - Create group
- `GET /groups/tree` - Get hierarchical tree
- `POST /groups/:id/execute` - Execute all tests in group

See `nextest-platform/docs/API_DOCUMENTATION.md` for complete API reference.

### Configuration

**config.toml**:
```toml
[server]
host = "0.0.0.0"
port = 8090

[database]
type = "sqlite"
dsn = "./data/test_management.db"

[test]
target_host = "http://127.0.0.1:9095"  # Target service URL
```

### Custom JSON Types

The codebase uses custom types for JSON serialization with SQLite:
- `JSONB` - Generic JSON object storage
- `JSONArray` - JSON array storage

These provide automatic marshaling/unmarshaling when working with GORM models.

Example from `internal/models/test_case.go`:
```go
type TestCase struct {
    HTTPConfig    JSONB     `gorm:"type:text;column:http_config"`
    Assertions    JSONArray `gorm:"type:text;column:assertions"`
}
```

## Frontend (NextTestPlatformUI)

### Technology Stack
- **Framework**: React 19.2 + TypeScript
- **Build Tool**: Vite 6.2
- **AI Integration**: Google Gemini API (@google/genai)
- **UI Components**: Custom components (no major UI library)
- **Data Viz**: Recharts 3.4
- **Icons**: Lucide React

### Common Commands

```bash
cd NextTestPlatformUI

# Install dependencies
npm install

# Development server
npm run dev           # Starts on http://localhost:5173

# Production build
npm run build         # Output to dist/

# Preview production build
npm run preview
```

### Key Components

Located in `NextTestPlatformUI/components/`:
- `ActionLibrary.tsx` - Action management and library
- `Dashboard.tsx` - Main dashboard view
- `TestCaseManager.tsx` - Test case CRUD operations
- `TestRunner.tsx` - Test execution interface
- `WorkflowBuilder.tsx` - Visual workflow editor (if exists)
- `DocumentationHub.tsx` - Documentation viewer
- `DatabaseManager.tsx` - Database administration
- `ScriptLab.tsx` - Script editor and runner

### Configuration

**Environment variables** (`.env.local`):
```
GEMINI_API_KEY=your_gemini_api_key_here
```

## Development Workflow

### Working with Tests

1. **Create test data**:
   ```bash
   cd nextest-platform
   # Edit examples/sample-tests.json
   make import
   ```

2. **Run backend**:
   ```bash
   make run  # Starts on :8090
   ```

3. **Run frontend** (separate terminal):
   ```bash
   cd NextTestPlatformUI
   npm run dev  # Starts on :5173
   ```

### Working with Workflows

1. **Create workflow definition**: Add to database via API or import tool
2. **Test execution**: Use `POST /workflows/:workflowId/execute`
3. **Monitor real-time**: Connect WebSocket to `/ws/workflows/runs/:runId/stream`
4. **View results**: Query workflow_runs, workflow_step_executions tables

### Database Migrations

Migration files in `nextest-platform/migrations/`:
- `001_initial.sql` - Initial schema
- `002_add_hooks.sql` - Lifecycle hooks
- `003_add_workflow_integration.sql` - Workflow tables
- `004_add_environment_management.sql` - Environment management

**Apply migrations**:
```bash
# SQLite
sqlite3 data/test_management.db < migrations/004_add_environment_management.sql

# GORM auto-migration (run on startup)
# See cmd/server/main.go
```

## Testing Strategy

### Unit Tests
```bash
cd nextest-platform
go test ./...                    # All tests
go test ./internal/workflow/...  # Specific package
```

### Integration Tests
- Test WebSocket connections with real clients
- Verify workflow execution with sample data
- Test database migrations

### Load Testing
- Test 1000+ concurrent WebSocket connections
- High-frequency message broadcasting
- Memory leak detection

## Important Architecture Patterns

### 1. Layered Architecture
Always follow the pattern: `Handler → Service → Repository → Database`
- Never skip layers (e.g., Handler directly accessing Repository)
- Keep business logic in Service layer
- Repository only handles data access

### 2. Interface-Based Design
Most components are interfaces (Repository, Service) for testability:
```go
type TestCaseRepository interface {
    Create(ctx context.Context, testCase *models.TestCase) error
    GetByID(ctx context.Context, testID string) (*models.TestCase, error)
}
```

### 3. Context Propagation
All repository and service methods accept `context.Context` for:
- Request cancellation
- Timeout control
- Transaction management

### 4. Error Handling
- Use wrapped errors with context: `fmt.Errorf("failed to create test: %w", err)`
- Repository returns domain errors
- Handler converts to HTTP status codes

### 5. Concurrency Model
- Hub runs in single goroutine (thread-safe via channels)
- Each WebSocket client gets 2 goroutines (ReadPump, WritePump)
- Workflow steps execute in parallel within DAG layers
- Use buffered channels to prevent blocking (256 buffer size)

## Common Development Tasks

### Adding a New Test Type

1. Add executor in `internal/testcase/executor.go`:
   ```go
   func (e *Executor) executeNewType(ctx context.Context, config *NewTypeConfig) (*Result, error)
   ```

2. Add config field to `models.TestCase`:
   ```go
   NewTypeConfig JSONB `gorm:"type:text;column:new_type_config"`
   ```

3. Update handler to route new type

### Adding a New Workflow Action

1. Create action in `internal/workflow/actions/`:
   ```go
   type NewAction struct {}
   func (a *NewAction) Execute(ctx *ExecutionContext, step *Step) error
   ```

2. Register in `internal/workflow/action_registry.go`:
   ```go
   registry["new-action"] = &NewAction{}
   ```

### Adding a New API Endpoint

1. Add handler method in `internal/handler/`:
   ```go
   func (h *TestHandler) NewEndpoint(c *gin.Context) { }
   ```

2. Register route in `cmd/server/main.go`:
   ```go
   v2.POST("/new-endpoint", handler.NewEndpoint)
   ```

## Documentation References

**Backend**:
- `nextest-platform/README.md` - Quick start guide
- `nextest-platform/PROJECT_SUMMARY.md` - Feature overview
- `nextest-platform/QUICKSTART.md` - 1-minute setup
- `nextest-platform/docs/DATABASE_DESIGN.md` - Complete schema
- `nextest-platform/docs/API_DOCUMENTATION.md` - API reference
- `nextest-platform/WEBSOCKET_ARCHITECTURE.md` - WebSocket design
- `nextest-platform/DEPLOYMENT.md` - Deployment guide

**Frontend**:
- `NextTestPlatformUI/README.md` - Setup instructions
- `NextTestPlatformUI/docs/BUSINESS_WIKI.md` - Business context

## Performance Considerations

### Database
- Use indexes for frequently queried fields (test_id, workflow_id, status)
- Avoid `SELECT *`, specify needed columns
- Use pagination for large result sets
- Consider VACUUM for SQLite maintenance

### WebSocket
- Each client has 256-message send buffer
- Hub has 256-message broadcast buffer
- Slow clients are disconnected to prevent memory leaks
- Use heartbeat (54s) to detect dead connections

### Workflow Execution
- Parallel execution of independent steps
- DAG layering reduces total execution time
- Configurable timeouts prevent hanging

## Port Configuration

Default ports:
- **Backend**: 8090 (configurable in config.toml)
- **Frontend**: 5173 (Vite default)
- **Target Service**: 9095 (configurable in config.toml)

## Troubleshooting

### "Port already in use"
```bash
# Change port in config.toml
[server]
port = 8091  # Use different port
```

### "Database locked"
SQLite issue - ensure:
- Only one service instance running
- Set `PRAGMA journal_mode = WAL` in config

### WebSocket connection fails
Check:
- CORS configuration in backend
- WebSocket upgrade headers
- Firewall rules for port 8090

### Tests fail with connection refused
Ensure target service is running:
```bash
# Update target_host in config.toml
[test]
target_host = "http://localhost:9095"
```

## Documentation Management

### Documentation Structure

This project uses a **seven-layer documentation architecture** in the `docs/` directory:

1. **1-specs/** - Technical specifications (API, database, backend architecture)
2. **2-requirements/** - Product requirements, user stories, feature definitions
3. **3-guides/** - Development, testing, deployment, and user guides
4. **4-planning/** - Active plans, backlog, completed milestones, archived plans
5. **5-wiki/** - Business knowledge organized by module (testcase, workflow, tenant, etc.)
6. **6-decisions/** - Architecture Decision Records (ADRs) with date prefix
7. **7-archive/** - Historical documents organized by quarter (YYYY-QN/)

**Core Principle**: Every document has ONE correct location based on its type and lifecycle stage.

### Naming Conventions

**Directory naming**:
- Layers 1-4, 6-7: Use `kebab-case` (e.g., `api/`, `backend/`, `multi-tenant-integration.md`)
- Layer 5 (wiki): Use lowercase without hyphens (e.g., `actionlibrary/`, `apicenter/`)

**File naming**:
- All lowercase with hyphens: `feature-name-type.md`
- ADRs (Layer 6): `YYYY-MM-DD-subject-type.md`
- Special files: `README.md`, `overview.md`, `_template-*.md`

**docs/ root directory** - Keep clean with only 3 files max:
- `README.md` - Documentation navigation
- `directory-standards.md` - Organization rules
- Temporary reports (should be archived after use)

### When Creating Documentation

**Create new directory when**:
- ✅ 3+ related documents on same topic
- ❌ Only 1-2 documents → use flat structure

**Create new file when**:
- ✅ Content > 500 lines needing split
- ✅ Different audiences (dev vs user)
- ✅ Different update frequencies
- ❌ Can be a section in existing doc

### Document Lifecycle

**1. Creation**:
- Determine document type (use decision tree in `docs/directory-standards.md`)
- Follow naming convention
- Update parent directory's README.md

**2. Maintenance**:
- Monthly review for accuracy
- Update when code/architecture changes

**3. Archiving** (when any true):
- Feature deprecated
- Superseded by new doc
- > 6 months without updates and no longer relevant
- Project phase completed (implementation reports)

**4. Archive location**:
```
7-archive/YYYY-QN/
├── implementation-reports/  # Completed implementation records
├── plans/                   # Obsolete plans
├── analysis/               # Historical analysis
└── feature-designs/        # Implemented feature designs
```

### Report Documentation

**Type 1: Implementation Reports** (completed) → `7-archive/YYYY-QN/implementation-reports/`
**Type 2: Analysis Reports** (one-time) → `7-archive/YYYY-QN/analysis/`
**Type 3: Monitoring Reports** (recurring) → Reference latest in wiki, don't keep history
**Type 4: Progress Reports** (ongoing) → `4-planning/active/`, move to `completed/` when done

### Quick Reference

**Looking for specs?** → `docs/1-specs/{api|backend|database|ui}/`
**Need implementation guide?** → `docs/3-guides/development/`
**Checking project status?** → `docs/4-planning/active/status-YYYY-MM-DD.md`
**Understanding a module?** → `docs/5-wiki/{module}/overview.md`
**Reviewing decisions?** → `docs/6-decisions/index.md`

**Full documentation standards**: See `docs/directory-standards.md` (v3.0)

### Documentation References (Updated Paths)

**Backend**:
- `docs/1-specs/database/schema.md` - Complete database schema
- `docs/1-specs/api/v2-documentation.md` - API reference
- `docs/1-specs/backend/websocket-architecture.md` - WebSocket design
- `docs/3-guides/development/backend-implementation.md` - Backend guide
- `docs/3-guides/deployment/port-configuration.md` - Port configuration

**Frontend**:
- `NextTestPlatformUI/README.md` - Setup instructions

**Business Context**:
- `docs/5-wiki/testcase/overview.md` - Test case module
- `docs/5-wiki/workflow/overview.md` - Workflow module
- `docs/5-wiki/tenant/overview.md` - Multi-tenant system
- `docs/5-wiki/glossary.md` - Unified terminology

**Project Planning**:
- `docs/4-planning/active/` - Current active plans
- `docs/4-planning/backlog/roadmap.md` - Future roadmap

