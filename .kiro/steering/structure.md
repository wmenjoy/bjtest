# Project Structure

## Repository Layout

This is a monorepo containing both backend (Go) and frontend (React) applications:

```
.
├── nextest-platform/           # Backend Go application
├── NextTestPlatformUI/         # Frontend React application
└── [documentation files]       # Root-level planning and analysis docs
```

## Backend Structure (nextest-platform/)

### Core Directories

**cmd/** - Application entry points
- `server/main.go`: Main HTTP service
- `import/main.go`: Data import utility

**internal/** - Private application code (Go convention)
- `config/`: Configuration loading and management
- `models/`: GORM database models with custom JSON types
- `repository/`: Data access layer (interfaces + implementations)
- `service/`: Business logic layer
- `handler/`: HTTP request handlers (Gin)
- `middleware/`: HTTP middleware (tenant context, auth, etc.)
- `workflow/`: Workflow execution engine
  - `actions/`: Built-in workflow actions (HTTP, database, assert, script)
  - `executor.go`: Main workflow orchestration
  - `logger.go`: Execution logging
  - `variable_tracker.go`: Variable state management
- `testcase/`: Test case execution engine
- `websocket/`: WebSocket hub and client management
- `expression/`: Expression evaluation for conditions
- `errors/`: Custom error types

**migrations/** - SQL schema migration files
- Numbered sequentially (001, 002, 003, etc.)
- Applied in order during database initialization

**examples/** - Sample test data
- `sample-tests.json`: Basic test examples
- `self-test/`: Platform self-testing suites

**test/** - Test files
- `integration/`: Integration test suites

**docs/** - Technical documentation
- API specs, database design, implementation guides

### Configuration Files

- `config.toml`: Service configuration (server, database, test settings)
- `go.mod`, `go.sum`: Go dependency management
- `Makefile`: Build and development automation

## Frontend Structure (NextTestPlatformUI/)

### Core Directories

**components/** - React components organized by feature
- `admin/`: Admin portal (users, roles, orgs, projects)
- `auth/`: Login and registration forms
- `config/`: System configuration (environments, general, security)
- `dashboard/`: Dashboard with charts and statistics
- `database/`: Database table management
- `history/`: Test execution history
- `library/`: Action library management
- `runner/`: Test execution interface with copilot
- `scriptlab/`: Visual workflow editor (canvas, toolbox, node inspector)
- `testcase/`: Test case management and editor
- `layout/`: Shared layout components

**hooks/** - Custom React hooks
- `useAppState.ts`: Global application state
- `usePermissions.ts`: Permission checking
- `useWorkflowGraph.ts`: Workflow graph management

**services/** - API service layer
- `geminiService.ts`: AI integration

**data/** - Static data and mocks
- `mockData.ts`: Mock data for development

**docs/** - Frontend documentation
- Business requirements and wiki

### Configuration Files

- `package.json`: NPM dependencies and scripts
- `vite.config.ts`: Vite build configuration
- `tsconfig.json`: TypeScript configuration
- `index.html`: HTML entry point

## Key Architectural Patterns

### Backend Patterns

1. **Layered Architecture**: Handler → Service → Repository → Model
2. **Interface-based Design**: Repositories and services use interfaces for testability
3. **Dependency Injection**: Services receive dependencies via constructors
4. **Soft Deletes**: GORM DeletedAt for data retention
5. **Multi-tenancy**: Tenant context propagated via middleware

### Frontend Patterns

1. **Component Composition**: Small, focused components
2. **Custom Hooks**: Reusable stateful logic
3. **Context API**: Global state management (ConfigContext)
4. **Feature-based Organization**: Components grouped by feature

### Data Flow

```
Frontend (React)
    ↓ HTTP/WebSocket
Backend Handler (Gin)
    ↓
Service Layer (Business Logic)
    ↓
Repository Layer (Data Access)
    ↓
Database (SQLite/PostgreSQL/MySQL)
```

### Workflow Execution Flow

```
Test Case (type: workflow)
    ↓
Workflow Service
    ↓
Workflow Executor
    ↓ (for each step)
Action Registry → Action Implementation
    ↓
Step Execution Repository (record)
    ↓
WebSocket Hub (broadcast)
    ↓
Frontend (real-time update)
```

## File Naming Conventions

### Backend (Go)

- Models: `snake_case.go` (e.g., `test_case.go`)
- Interfaces: `interface_name.go` or embedded in implementation file
- Tests: `*_test.go` suffix
- Repositories: `*_repository.go` suffix
- Services: `*_service.go` suffix
- Handlers: `*_handler.go` suffix

### Frontend (TypeScript/React)

- Components: `PascalCase.tsx` (e.g., `TestCaseManager.tsx`)
- Hooks: `camelCase.ts` with `use` prefix (e.g., `useAppState.ts`)
- Services: `camelCase.ts` with `Service` suffix (e.g., `geminiService.ts`)
- Types: `types.ts` or inline in component files
- Constants: `constants.ts` or `UPPER_SNAKE_CASE` inline

## Important Files to Know

### Backend Entry Points

- `cmd/server/main.go`: Service initialization and routing
- `internal/handler/test_handler.go`: Test case API endpoints
- `internal/handler/workflow_handler.go`: Workflow API endpoints
- `internal/workflow/executor.go`: Core workflow execution logic

### Frontend Entry Points

- `index.tsx`: React app initialization
- `App.tsx`: Main app component with routing
- `ConfigContext.tsx`: Global configuration context

### Configuration

- `nextest-platform/config.toml`: Backend configuration
- `NextTestPlatformUI/.env.local`: Frontend environment variables (create this)

### Documentation

- `nextest-platform/README.md`: Backend quick start
- `nextest-platform/docs/DATABASE_DESIGN.md`: Complete database schema
- `nextest-platform/docs/API_DOCUMENTATION.md`: API reference
- Root-level `*.md` files: Planning and analysis documents
