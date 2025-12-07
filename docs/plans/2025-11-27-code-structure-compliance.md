# Code Structure Compliance Adjustment Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Refactor backend and frontend code to comply with documented naming conventions and architecture standards defined in `docs/3-guides/development/naming-conventions.md` and `docs/1-specs/architecture/backend-layered-design.md`.

**Architecture:** Standardize Repository/Service implementation naming, enforce private export rules, fix frontend file extensions and document locations, maintain backward compatibility through careful refactoring with comprehensive testing.

**Tech Stack:** Go 1.24, GORM, React 19, TypeScript, Vite

---

## Phase 1: Backend Repository Layer Standardization (Priority: High)

### Task 1: Standardize testCaseRepo Implementation Naming

**Files:**
- Modify: `backend/internal/repository/test_case_repo.go`
- Test: Verify with existing tests in `backend/internal/repository/test_case_repo_test.go`

**Step 1: Rename struct from testCaseRepo to testCaseRepository**

```go
// In test_case_repo.go, find:
type testCaseRepo struct {
    db *gorm.DB
}

// Replace with:
type testCaseRepository struct {
    db *gorm.DB
}
```

**Step 2: Update constructor function**

```go
// Find:
func NewTestCaseRepository(db *gorm.DB) TestCaseRepository {
    return &testCaseRepo{db: db}
}

// Replace with:
func NewTestCaseRepository(db *gorm.DB) TestCaseRepository {
    return &testCaseRepository{db: db}
}
```

**Step 3: Update all method receivers**

```go
// Find pattern:
func (r *testCaseRepo) MethodName(...)

// Replace with:
func (r *testCaseRepository) MethodName(...)
```

**Step 4: Run existing tests to verify**

Run: `cd backend && go test ./internal/repository -run TestCaseRepository -v`
Expected: All tests PASS (no behavior change)

**Step 5: Commit**

```bash
git add backend/internal/repository/test_case_repo.go
git commit -m "refactor(repo): rename testCaseRepo to testCaseRepository for consistency"
```

---

### Task 2: Standardize testGroupRepo Implementation Naming

**Files:**
- Modify: `backend/internal/repository/test_group_repo.go`

**Step 1: Rename struct**

```go
// Find:
type testGroupRepo struct {
    db *gorm.DB
}

// Replace with:
type testGroupRepository struct {
    db *gorm.DB
}
```

**Step 2: Update constructor**

```go
func NewTestGroupRepository(db *gorm.DB) TestGroupRepository {
    return &testGroupRepository{db: db}
}
```

**Step 3: Update all method receivers**

```go
// Pattern: func (r *testGroupRepo) → func (r *testGroupRepository)
```

**Step 4: Test**

Run: `cd backend && go test ./internal/repository -run TestGroup -v`
Expected: PASS

**Step 5: Commit**

```bash
git add backend/internal/repository/test_group_repo.go
git commit -m "refactor(repo): rename testGroupRepo to testGroupRepository"
```

---

### Task 3: Standardize testResultRepo Implementation Naming

**Files:**
- Modify: `backend/internal/repository/test_result_repo.go`

**Step 1: Rename first struct**

```go
// Find:
type testResultRepo struct {
    db *gorm.DB
}

// Replace with:
type testResultRepository struct {
    db *gorm.DB
}
```

**Step 2: Update TestResultRepository constructor**

```go
func NewTestResultRepository(db *gorm.DB) TestResultRepository {
    return &testResultRepository{db: db}
}
```

**Step 3: Rename second struct**

```go
// Find:
type testRunRepo struct {
    db *gorm.DB
}

// Replace with:
type testRunRepository struct {
    db *gorm.DB
}
```

**Step 4: Update TestRunRepository constructor**

```go
func NewTestRunRepository(db *gorm.DB) TestRunRepository {
    return &testRunRepository{db: db}
}
```

**Step 5: Update all method receivers for both structs**

```go
// func (r *testResultRepo) → func (r *testResultRepository)
// func (r *testRunRepo) → func (r *testRunRepository)
```

**Step 6: Test**

Run: `cd backend && go test ./internal/repository -run "TestResult|TestRun" -v`
Expected: PASS

**Step 7: Commit**

```bash
git add backend/internal/repository/test_result_repo.go
git commit -m "refactor(repo): standardize test result/run repo naming"
```

---

### Task 4: Standardize projectRepo Implementation Naming

**Files:**
- Modify: `backend/internal/repository/project_repository.go`

**Step 1: Rename struct**

```go
// Find:
type projectRepo struct {
    db *gorm.DB
}

// Replace with:
type projectRepository struct {
    db *gorm.DB
}
```

**Step 2: Update constructor**

```go
func NewProjectRepository(db *gorm.DB) ProjectRepository {
    return &projectRepository{db: db}
}
```

**Step 3: Update method receivers**

**Step 4: Test**

Run: `cd backend && go test ./internal/repository -run Project -v`
Expected: PASS

**Step 5: Commit**

```bash
git add backend/internal/repository/project_repository.go
git commit -m "refactor(repo): rename projectRepo to projectRepository"
```

---

### Task 5: Standardize tenantRepo Implementation Naming

**Files:**
- Modify: `backend/internal/repository/tenant_repository.go`

**Step 1: Rename struct**

```go
// Find:
type tenantRepo struct {
    db *gorm.DB
}

// Replace with:
type tenantRepository struct {
    db *gorm.DB
}
```

**Step 2: Update constructor**

```go
func NewTenantRepository(db *gorm.DB) TenantRepository {
    return &tenantRepository{db: db}
}
```

**Step 3: Update method receivers**

**Step 4: Test**

Run: `cd backend && go test ./internal/repository -run Tenant -v`
Expected: PASS

**Step 5: Commit**

```bash
git add backend/internal/repository/tenant_repository.go
git commit -m "refactor(repo): rename tenantRepo to tenantRepository"
```

---

## Phase 2: Fix Private Export Violations (Priority: High)

### Task 6: Fix StepExecutionRepository Export

**Files:**
- Modify: `backend/internal/repository/step_execution_repository.go`

**Step 1: Change struct to private**

```go
// Find:
type StepExecutionRepository struct {
    db *gorm.DB
}

// Replace with:
type stepExecutionRepository struct {
    db *gorm.DB
}
```

**Step 2: Update constructor return**

```go
// Keep interface public, return private implementation:
func NewStepExecutionRepository(db *gorm.DB) StepExecutionRepository {
    return &stepExecutionRepository{db: db}
}
```

**Step 3: Update all method receivers**

```go
// func (r *StepExecutionRepository) → func (r *stepExecutionRepository)
```

**Step 4: Check for any direct struct usage outside package**

Run: `cd backend && grep -r "StepExecutionRepository{" --include="*.go" | grep -v repository/`
Expected: No matches (all usage should be through interface)

**Step 5: Test**

Run: `cd backend && go test ./internal/repository -run StepExecution -v`
Expected: PASS

**Step 6: Commit**

```bash
git add backend/internal/repository/step_execution_repository.go
git commit -m "fix(repo): make stepExecutionRepository private"
```

---

### Task 7: Fix StepLogRepository Export

**Files:**
- Modify: `backend/internal/repository/step_log_repository.go`

**Step 1: Change struct to private**

```go
type stepLogRepository struct {
    db *gorm.DB
}
```

**Step 2: Update constructor**

```go
func NewStepLogRepository(db *gorm.DB) StepLogRepository {
    return &stepLogRepository{db: db}
}
```

**Step 3: Update method receivers**

**Step 4: Verify no external usage**

Run: `cd backend && grep -r "StepLogRepository{" --include="*.go" | grep -v repository/`

**Step 5: Test**

Run: `cd backend && go test ./internal/repository -run StepLog -v`
Expected: PASS

**Step 6: Commit**

```bash
git add backend/internal/repository/step_log_repository.go
git commit -m "fix(repo): make stepLogRepository private"
```

---

### Task 8: Fix VariableChangeRepository Export

**Files:**
- Modify: `backend/internal/repository/variable_change_repository.go`

**Step 1: Change struct to private**

```go
type variableChangeRepository struct {
    db *gorm.DB
}
```

**Step 2: Update constructor and methods**

**Step 3: Test**

Run: `cd backend && go test ./internal/repository -run VariableChange -v`
Expected: PASS

**Step 4: Commit**

```bash
git add backend/internal/repository/variable_change_repository.go
git commit -m "fix(repo): make variableChangeRepository private"
```

---

### Task 9: Fix WorkflowRepository Export

**Files:**
- Modify: `backend/internal/repository/workflow_repository.go`

**Step 1: Change struct to private**

```go
type workflowRepository struct {
    db *gorm.DB
}
```

**Step 2: Update constructor and methods**

**Step 3: Test**

Run: `cd backend && go test ./internal/repository -run "Workflow" -v`
Expected: PASS

**Step 4: Commit**

```bash
git add backend/internal/repository/workflow_repository.go
git commit -m "fix(repo): make workflowRepository private"
```

---

### Task 10: Fix WorkflowRunRepository Export

**Files:**
- Modify: `backend/internal/repository/workflow_run_repository.go`

**Step 1: Change struct to private**

```go
type workflowRunRepository struct {
    db *gorm.DB
}
```

**Step 2: Update constructor and methods**

**Step 3: Test**

Run: `cd backend && go test ./internal/repository -run WorkflowRun -v`
Expected: PASS

**Step 4: Commit**

```bash
git add backend/internal/repository/workflow_run_repository.go
git commit -m "fix(repo): make workflowRunRepository private"
```

---

## Phase 3: Backend Service Layer Standardization (Priority: High)

### Task 11: Add Impl Suffix to testService

**Files:**
- Modify: `backend/internal/service/test_service.go`

**Step 1: Rename implementation struct**

```go
// Find:
type testService struct {
    repo repository.TestCaseRepository
    // ... other fields
}

// Replace with:
type testServiceImpl struct {
    repo repository.TestCaseRepository
    // ... other fields
}
```

**Step 2: Update constructor**

```go
func NewTestService(...) TestService {
    return &testServiceImpl{
        repo: repo,
        // ... other fields
    }
}
```

**Step 3: Update all method receivers**

```go
// func (s *testService) → func (s *testServiceImpl)
```

**Step 4: Test**

Run: `cd backend && go test ./internal/service -run TestService -v`
Expected: PASS

**Step 5: Commit**

```bash
git add backend/internal/service/test_service.go
git commit -m "refactor(service): add Impl suffix to testService"
```

---

### Task 12: Add Impl Suffix to workflowService

**Files:**
- Modify: `backend/internal/service/workflow_service.go`

**Step 1: Rename struct to workflowServiceImpl**

**Step 2: Update constructor and method receivers**

**Step 3: Test**

Run: `cd backend && go test ./internal/service -run Workflow -v`
Expected: PASS

**Step 4: Commit**

```bash
git add backend/internal/service/workflow_service.go
git commit -m "refactor(service): add Impl suffix to workflowService"
```

---

### Task 13: Add Impl Suffix to environmentService

**Files:**
- Modify: `backend/internal/service/environment_service.go`

**Step 1: Rename to environmentServiceImpl**

**Step 2: Update constructor and methods**

**Step 3: Test**

Run: `cd backend && go test ./internal/service -run Environment -v`
Expected: PASS

**Step 4: Commit**

```bash
git add backend/internal/service/environment_service.go
git commit -m "refactor(service): add Impl suffix to environmentService"
```

---

### Task 14: Add Impl Suffix to projectService

**Files:**
- Modify: `backend/internal/service/project_service.go`

**Step 1: Rename to projectServiceImpl**

**Step 2: Update constructor and methods**

**Step 3: Test**

Run: `cd backend && go test ./internal/service -run Project -v`
Expected: PASS

**Step 4: Commit**

```bash
git add backend/internal/service/project_service.go
git commit -m "refactor(service): add Impl suffix to projectService"
```

---

### Task 15: Add Impl Suffix to tenantService

**Files:**
- Modify: `backend/internal/service/tenant_service.go`

**Step 1: Rename to tenantServiceImpl**

**Step 2: Update constructor and methods**

**Step 3: Test**

Run: `cd backend && go test ./internal/service -run Tenant -v`
Expected: PASS

**Step 4: Commit**

```bash
git add backend/internal/service/tenant_service.go
git commit -m "refactor(service): add Impl suffix to tenantService"
```

---

## Phase 4: Fix Handler Layer Violation (Priority: Medium)

### Task 16: Create UserService for UserHandler

**Files:**
- Create: `backend/internal/service/user_service.go`
- Modify: `backend/internal/handler/user_handler.go`
- Test: `backend/internal/service/user_service_test.go`

**Step 1: Write interface definition**

```go
// backend/internal/service/user_service.go
package service

import (
    "context"
    "test-platform/internal/models"
    "test-platform/internal/repository"
)

type UserService interface {
    ListRoles(ctx context.Context) ([]*models.Role, error)
    // Add other user-related methods as needed
}
```

**Step 2: Write implementation struct**

```go
type userServiceImpl struct {
    roleRepo repository.RoleRepository
}

func NewUserService(roleRepo repository.RoleRepository) UserService {
    return &userServiceImpl{
        roleRepo: roleRepo,
    }
}
```

**Step 3: Implement ListRoles method**

```go
func (s *userServiceImpl) ListRoles(ctx context.Context) ([]*models.Role, error) {
    return s.roleRepo.GetAll(ctx)
}
```

**Step 4: Write test**

```go
// backend/internal/service/user_service_test.go
package service_test

import (
    "context"
    "testing"
    "test-platform/internal/models"
    "test-platform/internal/service"
)

type mockRoleRepository struct {
    roles []*models.Role
    err   error
}

func (m *mockRoleRepository) GetAll(ctx context.Context) ([]*models.Role, error) {
    return m.roles, m.err
}

func TestUserService_ListRoles(t *testing.T) {
    roles := []*models.Role{{ID: 1, Name: "admin"}}
    mockRepo := &mockRoleRepository{roles: roles}
    svc := service.NewUserService(mockRepo)

    result, err := svc.ListRoles(context.Background())
    if err != nil {
        t.Fatalf("expected no error, got %v", err)
    }
    if len(result) != 1 {
        t.Errorf("expected 1 role, got %d", len(result))
    }
}
```

**Step 5: Run test**

Run: `cd backend && go test ./internal/service -run TestUserService_ListRoles -v`
Expected: PASS

**Step 6: Update UserHandler to use service**

```go
// backend/internal/handler/user_handler.go
// Find:
type UserHandler struct {
    roleRepo repository.RoleRepository
}

// Replace with:
type UserHandler struct {
    userService service.UserService
}

// Update constructor:
func NewUserHandler(userService service.UserService) *UserHandler {
    return &UserHandler{
        userService: userService,
    }
}

// Update ListRoles method:
func (h *UserHandler) ListRoles(c *gin.Context) {
    roles, err := h.userService.ListRoles(c.Request.Context())
    if err != nil {
        c.JSON(500, gin.H{"error": err.Error()})
        return
    }
    c.JSON(200, gin.H{"data": roles})
}
```

**Step 7: Update dependency injection in main.go**

```go
// backend/cmd/server/main.go
// Find the UserHandler setup and add UserService:
roleRepo := repository.NewRoleRepository(db)
userService := service.NewUserService(roleRepo)
userHandler := handler.NewUserHandler(userService)
```

**Step 8: Integration test**

Run: `cd backend && go test ./... -v`
Expected: All tests PASS

**Step 9: Commit**

```bash
git add backend/internal/service/user_service.go
git add backend/internal/service/user_service_test.go
git add backend/internal/handler/user_handler.go
git add backend/cmd/server/main.go
git commit -m "fix(handler): add UserService layer, remove direct repository access from UserHandler"
```

---

## Phase 5: Frontend File Extension Fixes (Priority: Medium)

### Task 17: Fix scriptlab utils.tsx Extension

**Files:**
- Rename: `front/components/scriptlab/utils.tsx` → `front/components/scriptlab/utils.ts`
- Modify: `front/components/scriptlab/widgets.tsx` (update import)

**Step 1: Check file content to confirm no JSX**

Run: `grep -E "(<[A-Z]|jsx|React\.FC)" front/components/scriptlab/utils.tsx`
Expected: No matches (confirms it's pure TypeScript)

**Step 2: Rename file**

Run: `git mv front/components/scriptlab/utils.tsx front/components/scriptlab/utils.ts`

**Step 3: Update import in widgets.tsx**

```typescript
// front/components/scriptlab/widgets.tsx
// The import should already work, but verify:
import { FieldSpec } from './utils';  // Note: .tsx/.ts is optional in imports
```

**Step 4: Fix incorrect import reference**

```typescript
// Find this line:
import { FieldSpec } from './constants';

// Replace with:
import { FieldSpec } from './utils';
```

**Step 5: Verify TypeScript compilation**

Run: `cd front && npm run build`
Expected: Build succeeds with no errors

**Step 6: Commit**

```bash
git add front/components/scriptlab/utils.ts
git add front/components/scriptlab/widgets.tsx
git commit -m "fix(frontend): rename utils.tsx to utils.ts (no JSX content)"
```

---

### Task 18: Rename widgets.tsx to Widgets.tsx

**Files:**
- Rename: `front/components/scriptlab/widgets.tsx` → `front/components/scriptlab/Widgets.tsx`
- Modify: All files importing from widgets.tsx

**Step 1: Find all imports of widgets**

Run: `cd front && grep -r "from.*widgets" --include="*.tsx" --include="*.ts"`
Note: Record all files that import from widgets

**Step 2: Rename file**

Run: `git mv front/components/scriptlab/widgets.tsx front/components/scriptlab/Widgets.tsx`

**Step 3: Update imports in found files**

```typescript
// In each file found in Step 1:
// Find:
import { KVEditor, JSONEditor } from './widgets';

// Replace with:
import { KVEditor, JSONEditor } from './Widgets';
```

**Step 4: Verify build**

Run: `cd front && npm run build`
Expected: Success

**Step 5: Commit**

```bash
git add front/components/scriptlab/Widgets.tsx
git add [other files with updated imports]
git commit -m "refactor(frontend): rename widgets.tsx to Widgets.tsx per PascalCase convention"
```

---

## Phase 6: Frontend Documentation Relocation (Priority: High)

### Task 19: Move DAG Editor Documentation

**Files:**
- Move: `front/components/ADVANCED_DAG_EDITOR.md` → `docs/5-wiki/components/dag-editor.md`
- Move: `front/components/README_DAG_EDITOR.md` → `docs/5-wiki/components/dag-editor-overview.md`

**Step 1: Create target directory**

```bash
mkdir -p docs/5-wiki/components
```

**Step 2: Move files**

```bash
git mv front/components/ADVANCED_DAG_EDITOR.md docs/5-wiki/components/dag-editor.md
git mv front/components/README_DAG_EDITOR.md docs/5-wiki/components/dag-editor-overview.md
```

**Step 3: Update docs/5-wiki/components/README.md**

```markdown
# Components Module

## DAG Editor

- [DAG Editor Overview](./dag-editor-overview.md) - Introduction and features
- [Advanced DAG Editor](./dag-editor.md) - Detailed implementation guide
```

**Step 4: Check for internal links and update**

Run: `grep -r "ADVANCED_DAG_EDITOR\|README_DAG_EDITOR" docs/ front/`
Update any references found

**Step 5: Commit**

```bash
git add docs/5-wiki/components/
git add docs/5-wiki/components/README.md
git commit -m "docs: move DAG editor docs to wiki/components"
```

---

### Task 20: Move Simple List Editor Documentation

**Files:**
- Move all `front/components/SIMPLE_LIST_EDITOR_*.md` to `docs/3-guides/components/simple-list-editor/`

**Step 1: Create target directory**

```bash
mkdir -p docs/3-guides/components/simple-list-editor
```

**Step 2: Move and rename files**

```bash
git mv front/components/SIMPLE_LIST_EDITOR_INDEX.md \
  docs/3-guides/components/simple-list-editor/index.md

git mv front/components/SIMPLE_LIST_EDITOR_QUICKSTART.md \
  docs/3-guides/components/simple-list-editor/quickstart.md

git mv front/components/SIMPLE_LIST_EDITOR_README.md \
  docs/3-guides/components/simple-list-editor/overview.md

git mv front/components/SIMPLE_LIST_EDITOR_VERIFICATION.md \
  docs/3-guides/components/simple-list-editor/verification.md
```

**Step 3: Create README for the guide**

```markdown
# Simple List Editor Guide

## Documents

- [Overview](./overview.md) - Component description
- [Index](./index.md) - Quick reference
- [Quickstart](./quickstart.md) - Getting started guide
- [Verification](./verification.md) - Testing guide
```

**Step 4: Commit**

```bash
git add docs/3-guides/components/simple-list-editor/
git commit -m "docs: relocate simple list editor docs to guides/components"
```

---

### Task 21: Archive Task Implementation Reports

**Files:**
- Move: `front/components/TASK_3_3_IMPLEMENTATION_SUMMARY.md` → archive
- Move: `front/components/TASK_3.2_COMPLETION_SUMMARY.md` → archive

**Step 1: Create archive directory**

```bash
mkdir -p docs/7-archive/2025-Q4/implementation-reports
```

**Step 2: Move files**

```bash
git mv front/components/TASK_3_3_IMPLEMENTATION_SUMMARY.md \
  docs/7-archive/2025-Q4/implementation-reports/task-3-3-implementation-summary.md

git mv front/components/TASK_3.2_COMPLETION_SUMMARY.md \
  docs/7-archive/2025-Q4/implementation-reports/task-3-2-completion-summary.md
```

**Step 3: Update archive README**

```markdown
# 2025 Q4 Implementation Reports

## Task Completion Summaries

- [Task 3.2 Completion](./task-3-2-completion-summary.md)
- [Task 3.3 Implementation](./task-3-3-implementation-summary.md)
```

**Step 4: Commit**

```bash
git add docs/7-archive/2025-Q4/
git commit -m "docs: archive task implementation reports to 2025-Q4"
```

---

## Phase 7: Cleanup and Verification (Priority: Low)

### Task 22: Remove Empty types Directory

**Files:**
- Delete: `front/types/`

**Step 1: Verify directory is empty**

Run: `ls -la front/types/`
Expected: Empty or only contains .gitkeep

**Step 2: Check for any references**

Run: `grep -r "from.*types/" front/ --include="*.tsx" --include="*.ts"`
Expected: No matches to front/types/ (should only reference front/types.ts)

**Step 3: Remove directory**

```bash
rm -rf front/types/
```

**Step 4: Commit**

```bash
git add front/types/
git commit -m "cleanup: remove empty front/types directory"
```

---

### Task 23: Run Complete Test Suite

**Files:**
- None (verification only)

**Step 1: Backend tests**

Run: `cd backend && go test ./... -v`
Expected: All PASS

**Step 2: Frontend build**

Run: `cd front && npm run build`
Expected: Success with no errors

**Step 3: Frontend type check**

Run: `cd front && npx tsc --noEmit`
Expected: No type errors

**Step 4: Integration smoke test**

```bash
# Start backend
cd backend && ./test-service &
BACKEND_PID=$!

# Start frontend
cd front && npm run dev &
FRONTEND_PID=$!

# Wait and check health
sleep 5
curl http://localhost:8090/health
curl http://localhost:5173/

# Cleanup
kill $BACKEND_PID $FRONTEND_PID
```

Expected: Both services respond successfully

**Step 5: If all pass, create summary commit**

```bash
git add -A
git commit -m "chore: verify all tests pass after code structure compliance refactor"
```

---

### Task 24: Update Documentation References

**Files:**
- Update: `CLAUDE.md` (if needed)
- Update: `docs/README.md` (add references to moved docs)

**Step 1: Update CLAUDE.md with new standards**

```markdown
## Code Structure Standards

All code must follow the documented standards:

- **Backend**: See `docs/1-specs/architecture/backend-layered-design.md`
- **Naming**: See `docs/3-guides/development/naming-conventions.md`
- **Repository pattern**: Implementation structs use `xxxRepository` naming
- **Service pattern**: Implementation structs use `xxxServiceImpl` naming
- **Export rules**: All implementation structs are private (lowercase)
```

**Step 2: Update docs/README.md navigation**

```markdown
### Component Documentation
- [DAG Editor](./5-wiki/components/dag-editor-overview.md)
- [Simple List Editor](./3-guides/components/simple-list-editor/overview.md)
```

**Step 3: Commit**

```bash
git add CLAUDE.md docs/README.md
git commit -m "docs: update references after documentation relocation"
```

---

### Task 25: Create Compliance Verification Script

**Files:**
- Create: `scripts/tools/check-code-compliance.sh`

**Step 1: Write script**

```bash
#!/bin/bash
# scripts/tools/check-code-compliance.sh

echo "=== Code Structure Compliance Check ==="

# Backend: Check for incorrect Impl naming
echo "Checking backend Repository naming..."
grep -r "type.*Repo struct" backend/internal/repository --include="*.go" && \
  echo "❌ Found shortened 'Repo' struct (should be 'Repository')" || \
  echo "✅ Repository naming correct"

# Backend: Check for public implementation structs
echo "Checking for public implementation structs..."
grep -r "^type [A-Z].*Repository struct\|^type [A-Z].*Service struct" \
  backend/internal/repository backend/internal/service --include="*.go" && \
  echo "❌ Found public implementation struct (should be private)" || \
  echo "✅ All implementation structs are private"

# Frontend: Check for .tsx on non-component files
echo "Checking frontend file extensions..."
find front -name "*.tsx" -type f -exec sh -c \
  'grep -L "React\|jsx\|JSX" "$1" | grep -v node_modules' _ {} \; | \
  head -5 && echo "❌ Found .tsx files without JSX" || \
  echo "✅ File extensions correct"

# Frontend: Check for docs in components directory
echo "Checking for misplaced documentation..."
find front/components -name "*.md" -type f && \
  echo "❌ Found .md files in components/ (should be in docs/)" || \
  echo "✅ No misplaced documentation"

echo "=== Compliance check complete ==="
```

**Step 2: Make executable**

```bash
chmod +x scripts/tools/check-code-compliance.sh
```

**Step 3: Run script to verify current state**

Run: `./scripts/tools/check-code-compliance.sh`
Expected: All ✅ after completing all tasks

**Step 4: Commit**

```bash
git add scripts/tools/check-code-compliance.sh
git commit -m "feat: add code structure compliance verification script"
```

---

## Summary

**Total Tasks:** 25
**Estimated Time:** 3-4 hours
**Testing Strategy:** Run tests after each task, full integration test at end
**Commit Strategy:** One commit per task (25 commits)

**Risk Mitigation:**
- All changes maintain backward compatibility (interface-based)
- Comprehensive test coverage at each step
- Rename operations use `git mv` to preserve history
- Can roll back any task independently via git revert

**Success Criteria:**
- ✅ All Repository implementations named `xxxRepository` (not `xxxRepo`)
- ✅ All Service implementations named `xxxServiceImpl`
- ✅ All implementation structs are private (lowercase first letter)
- ✅ No Handler directly accesses Repository (goes through Service)
- ✅ All frontend .tsx files contain JSX/React components
- ✅ All documentation in correct `docs/` subdirectories
- ✅ All tests pass (backend + frontend)
- ✅ Compliance verification script shows all ✅

**Documentation Updated:**
- ✅ `CLAUDE.md` references compliance standards
- ✅ `docs/README.md` includes new document locations
- ✅ Archive includes migration log
