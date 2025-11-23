# Technology Stack

## Backend (nextest-platform)

### Core Technologies

- **Language**: Go 1.24
- **Web Framework**: Gin (HTTP router and middleware)
- **ORM**: GORM v1.31.1
- **Database**: SQLite (default), PostgreSQL, MySQL support
- **Configuration**: TOML (github.com/BurntSushi/toml)
- **WebSocket**: gorilla/websocket v1.5.3
- **UUID**: google/uuid v1.6.0
- **JSON Processing**: tidwall/gjson for JSON path queries

### Project Structure

```
nextest-platform/
├── cmd/
│   ├── server/          # Main service entry point
│   └── import/          # Data import tool
├── internal/
│   ├── config/          # Configuration management
│   ├── models/          # GORM data models
│   ├── repository/      # Data access layer
│   ├── service/         # Business logic layer
│   ├── handler/         # HTTP API handlers
│   ├── middleware/      # HTTP middleware (tenant context, etc.)
│   ├── workflow/        # Workflow execution engine
│   ├── testcase/        # Test execution engine
│   ├── websocket/       # WebSocket hub and clients
│   └── expression/      # Expression evaluator
├── migrations/          # SQL migration scripts
├── examples/            # Sample test data
└── test/integration/    # Integration tests
```

### Common Commands

```bash
# Build
make build              # Build main service
make build-import       # Build import tool
make build-all          # Build all binaries

# Development
make dev                # Run in development mode
make run                # Build and run service

# Testing
make test               # Run all tests
make test-cover         # Run tests with coverage report

# Database
make import             # Import sample test data
make clean-db           # Clean database

# Initialization
make init               # Full setup: deps + build + import data

# API Testing
make health             # Check service health
make api-groups         # List test groups
make api-tests          # List test cases
make api-runs           # List test runs
```

### Configuration

- **Config File**: `config.toml` (TOML format)
- **Default Port**: 8090
- **Database**: SQLite at `./data/test_management.db`
- **Target Host**: Configurable test target URL

## Frontend (NextTestPlatformUI)

### Core Technologies

- **Framework**: React 19.2.0
- **Language**: TypeScript 5.8.2
- **Build Tool**: Vite 6.2.0
- **Charts**: Recharts 3.4.1
- **Icons**: Lucide React 0.554.0
- **AI Integration**: Google Generative AI 1.30.0
- **YAML**: js-yaml 4.1.0

### Project Structure

```
NextTestPlatformUI/
├── components/          # React components
│   ├── admin/          # Admin portal components
│   ├── auth/           # Authentication components
│   ├── config/         # Configuration components
│   ├── dashboard/      # Dashboard components
│   ├── database/       # Database management
│   ├── history/        # Test history
│   ├── library/        # Action library
│   ├── runner/         # Test runner
│   ├── scriptlab/      # Script lab (workflow editor)
│   └── testcase/       # Test case management
├── hooks/              # Custom React hooks
├── services/           # API services
├── data/               # Mock data
└── docs/               # Documentation
```

### Common Commands

```bash
# Development
npm run dev             # Start dev server (port 8081)

# Build
npm run build           # Production build

# Preview
npm run preview         # Preview production build
```

### Configuration

- **Dev Server**: Port 8081, host 0.0.0.0
- **API Key**: Set `GEMINI_API_KEY` in `.env.local`
- **Backend API**: Typically http://localhost:8090

## Database

### Schema Management

- **Migrations**: SQL files in `migrations/` directory
- **Current Version**: 005 (multi-tenancy support)
- **Auto-migration**: GORM handles schema updates

### Key Tables

- `test_groups`: Hierarchical test organization
- `test_cases`: Test definitions (supports workflow type)
- `test_results`: Execution results
- `test_runs`: Batch execution records
- `workflows`: Workflow definitions
- `workflow_runs`: Workflow execution records
- `workflow_step_executions`: Step-level execution tracking
- `workflow_step_logs`: Real-time execution logs
- `workflow_variable_changes`: Variable change history
- `environments`: Environment configurations
- `environment_variables`: Environment-specific variables
- `tenants`: Multi-tenant support
- `projects`: Project management

## Development Patterns

### Layered Architecture

1. **Handler Layer**: HTTP request/response handling
2. **Service Layer**: Business logic and orchestration
3. **Repository Layer**: Data access abstraction
4. **Model Layer**: GORM models with custom JSON types

### Custom JSON Types

- `JSONB`: For JSON objects (map[string]interface{})
- `JSONArray`: For JSON arrays ([]interface{})
- Automatic serialization/deserialization with GORM

### Error Handling

- Custom error types in `internal/errors/`
- Consistent HTTP status codes (see `docs/HTTP_STATUS_CODE_SPEC.md`)

### Testing

- Unit tests: `*_test.go` files
- Integration tests: `test/integration/`
- Test helper: `internal/testutil/db_helper.go`

## API Design

- **Base Path**: `/api/v2/`
- **RESTful**: Standard HTTP methods (GET, POST, PUT, DELETE)
- **CORS**: Enabled for cross-origin requests
- **WebSocket**: `/api/v2/workflows/runs/:runId/stream` for real-time updates
