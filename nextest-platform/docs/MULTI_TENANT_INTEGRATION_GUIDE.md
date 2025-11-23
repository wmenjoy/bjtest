# 多租户系统集成指南

本文档提供将多租户功能集成到现有系统的分步指导。

## 🎯 集成概览

多租户系统已完成的组件:
- ✅ 数据库模型 (Tenant, Project, 以及所有资源表的tenant_id/project_id字段)
- ✅ Repository层 (所有Repository都有*WithTenant方法)
- ✅ TenantContext中间件 (验证和注入租户上下文)
- ✅ Tenant和Project的Service和Handler

待集成的部分:
- ⬜ 在main.go中注册TenantContext中间件
- ⬜ 更新现有Handler使用中间件
- ⬜ 更新现有Service使用tenant-isolated Repository方法

## 📋 集成步骤

### Step 1: 在main.go中创建TenantContext中间件实例

在 `cmd/server/main.go` 中添加中间件实例化:

```go
import (
	"test-management-service/internal/middleware"
	// ... other imports
)

func main() {
	// ... existing code ...

	// Initialize repositories
	tenantRepo := repository.NewTenantRepository(db)
	projectRepo := repository.NewProjectRepository(db)
	// ... other repos ...

	// NEW: Initialize TenantContext middleware
	tenantContext := middleware.NewTenantContext(tenantRepo, projectRepo)

	// ... rest of initialization ...
}
```

### Step 2: 应用中间件到需要租户隔离的路由

有两种方式应用中间件:

#### 方式A: 应用到路由组 (推荐)

```go
// Setup Gin router
r := gin.Default()

// Enable CORS
r.Use(corsMiddleware())

// Create API v2 group with tenant isolation
v2 := r.Group("/api/v2")
v2.Use(tenantContext.ValidateTenantAndProject()) // Apply middleware to all v2 routes
{
	// Register handlers under v2 group
	testHandler.RegisterRoutesV2(v2)
	workflowHandler.RegisterRoutesV2(v2)
	envHandler.RegisterRoutesV2(v2)
}

// Legacy routes without tenant isolation
v1 := r.Group("/api/v1")
{
	testHandler.RegisterRoutesV1(v1)  // Old routes
	workflowHandler.RegisterRoutesV1(v1)
}

// Public routes (no tenant check needed)
tenantHandler.RegisterRoutes(r)
projectHandler.RegisterRoutes(r)
```

#### 方式B: 应用到特定路由

```go
// Specific routes with tenant check
v2 := r.Group("/api/v2")
{
	// These routes require tenant context
	v2.GET("/tests", tenantContext.ValidateTenantAndProject(), testHandler.ListTests)
	v2.POST("/tests", tenantContext.ValidateTenantAndProject(), testHandler.CreateTest)
	v2.GET("/tests/:id", tenantContext.ValidateTenantAndProject(), testHandler.GetTest)

	// Public route (no tenant check)
	v2.GET("/health", healthCheck)
}
```

### Step 3: 更新Handler获取租户上下文

在Handler方法中使用middleware提供的helper函数获取租户信息:

```go
package handler

import (
	"test-management-service/internal/middleware"
	"github.com/gin-gonic/gin"
)

func (h *TestHandler) CreateTest(c *gin.Context) {
	// Extract tenant and project from context (set by middleware)
	tenantID := middleware.GetTenantID(c)
	projectID := middleware.GetProjectID(c)

	// Optional: Get full tenant/project objects
	tenant := middleware.GetTenant(c)
	project := middleware.GetProject(c)

	// Parse request body
	var req CreateTestRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	// Pass tenant context to service
	testCase, err := h.service.CreateTestCaseWithTenant(c.Request.Context(), tenantID, projectID, &req)
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	c.JSON(201, testCase)
}
```

### Step 4: 更新Service使用tenant-isolated Repository方法

修改Service方法接收租户上下文并使用*WithTenant repository方法:

```go
package service

// Before (legacy)
func (s *testService) CreateTestCase(req *CreateTestCaseRequest) (*models.TestCase, error) {
	tc := &models.TestCase{
		TestID: req.TestID,
		Name:   req.Name,
		// ...
	}

	return s.caseRepo.Create(tc) // Legacy method
}

// After (with tenant isolation)
func (s *testService) CreateTestCaseWithTenant(
	ctx context.Context,
	tenantID, projectID string,
	req *CreateTestCaseRequest,
) (*models.TestCase, error) {
	tc := &models.TestCase{
		TestID:    req.TestID,
		TenantID:  tenantID,    // Set from parameter
		ProjectID: projectID,   // Set from parameter
		Name:      req.Name,
		// ...
	}

	return s.caseRepo.CreateWithTenant(ctx, tc) // Tenant-isolated method
}
```

## 🔍 完整示例: TestCase CRUD集成

### 1. Handler (test_handler.go)

```go
package handler

import (
	"test-management-service/internal/middleware"
	"test-management-service/internal/service"
	"github.com/gin-gonic/gin"
)

type TestHandler struct {
	service service.TestService
}

// RegisterRoutesV2 registers routes with tenant isolation
func (h *TestHandler) RegisterRoutesV2(rg *gin.RouterGroup) {
	// Middleware already applied at group level
	rg.POST("/tests", h.CreateTest)
	rg.GET("/tests/:id", h.GetTest)
	rg.PUT("/tests/:id", h.UpdateTest)
	rg.DELETE("/tests/:id", h.DeleteTest)
	rg.GET("/tests", h.ListTests)
}

func (h *TestHandler) CreateTest(c *gin.Context) {
	tenantID := middleware.GetTenantID(c)
	projectID := middleware.GetProjectID(c)

	var req service.CreateTestCaseRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	testCase, err := h.service.CreateTestCaseWithTenant(c.Request.Context(), tenantID, projectID, &req)
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	c.JSON(201, testCase)
}

func (h *TestHandler) GetTest(c *gin.Context) {
	tenantID := middleware.GetTenantID(c)
	projectID := middleware.GetProjectID(c)
	testID := c.Param("id")

	testCase, err := h.service.GetTestCaseWithTenant(c.Request.Context(), testID, tenantID, projectID)
	if err != nil {
		c.JSON(404, gin.H{"error": err.Error()})
		return
	}

	c.JSON(200, testCase)
}

func (h *TestHandler) UpdateTest(c *gin.Context) {
	tenantID := middleware.GetTenantID(c)
	projectID := middleware.GetProjectID(c)
	testID := c.Param("id")

	var req service.UpdateTestCaseRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	testCase, err := h.service.UpdateTestCaseWithTenant(c.Request.Context(), testID, tenantID, projectID, &req)
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	c.JSON(200, testCase)
}

func (h *TestHandler) DeleteTest(c *gin.Context) {
	tenantID := middleware.GetTenantID(c)
	projectID := middleware.GetProjectID(c)
	testID := c.Param("id")

	err := h.service.DeleteTestCaseWithTenant(c.Request.Context(), testID, tenantID, projectID)
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	c.JSON(204, nil)
}

func (h *TestHandler) ListTests(c *gin.Context) {
	tenantID := middleware.GetTenantID(c)
	projectID := middleware.GetProjectID(c)

	limit := 100
	offset := 0
	// Parse pagination params if provided

	tests, total, err := h.service.ListTestCasesWithTenant(c.Request.Context(), tenantID, projectID, limit, offset)
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	c.JSON(200, gin.H{
		"data":  tests,
		"total": total,
	})
}
```

### 2. Service (test_service.go)

```go
package service

import (
	"context"
	"fmt"
	"test-management-service/internal/models"
	"test-management-service/internal/repository"
)

// Update TestService interface to include tenant-isolated methods
type TestService interface {
	// Legacy methods (for backward compatibility)
	CreateTestCase(req *CreateTestCaseRequest) (*models.TestCase, error)
	GetTestCase(testID string) (*models.TestCase, error)
	// ...

	// NEW: Tenant-isolated methods
	CreateTestCaseWithTenant(ctx context.Context, tenantID, projectID string, req *CreateTestCaseRequest) (*models.TestCase, error)
	GetTestCaseWithTenant(ctx context.Context, testID, tenantID, projectID string) (*models.TestCase, error)
	UpdateTestCaseWithTenant(ctx context.Context, testID, tenantID, projectID string, req *UpdateTestCaseRequest) (*models.TestCase, error)
	DeleteTestCaseWithTenant(ctx context.Context, testID, tenantID, projectID string) error
	ListTestCasesWithTenant(ctx context.Context, tenantID, projectID string, limit, offset int) ([]models.TestCase, int64, error)
}

// Implement tenant-isolated methods
func (s *testService) CreateTestCaseWithTenant(
	ctx context.Context,
	tenantID, projectID string,
	req *CreateTestCaseRequest,
) (*models.TestCase, error) {
	tc := &models.TestCase{
		TestID:    req.TestID,
		TenantID:  tenantID,    // CRITICAL: Set from parameter
		ProjectID: projectID,   // CRITICAL: Set from parameter
		GroupID:   req.GroupID,
		Name:      req.Name,
		Type:      req.Type,
		// ... other fields
	}

	// Use tenant-isolated repository method
	if err := s.caseRepo.CreateWithTenant(ctx, tc); err != nil {
		return nil, fmt.Errorf("failed to create test case: %w", err)
	}

	return tc, nil
}

func (s *testService) GetTestCaseWithTenant(
	ctx context.Context,
	testID, tenantID, projectID string,
) (*models.TestCase, error) {
	return s.caseRepo.FindByIDWithTenant(ctx, testID, tenantID, projectID)
}

func (s *testService) UpdateTestCaseWithTenant(
	ctx context.Context,
	testID, tenantID, projectID string,
	req *UpdateTestCaseRequest,
) (*models.TestCase, error) {
	// Get existing test case with tenant check
	tc, err := s.caseRepo.FindByIDWithTenant(ctx, testID, tenantID, projectID)
	if err != nil {
		return nil, fmt.Errorf("failed to find test case: %w", err)
	}
	if tc == nil {
		return nil, fmt.Errorf("test case not found: %s", testID)
	}

	// Update fields
	if req.Name != "" {
		tc.Name = req.Name
	}
	// ... update other fields

	// Use tenant-isolated update
	if err := s.caseRepo.UpdateWithTenant(ctx, tc); err != nil {
		return nil, fmt.Errorf("failed to update test case: %w", err)
	}

	return tc, nil
}

func (s *testService) DeleteTestCaseWithTenant(
	ctx context.Context,
	testID, tenantID, projectID string,
) error {
	return s.caseRepo.DeleteWithTenant(ctx, testID, tenantID, projectID)
}

func (s *testService) ListTestCasesWithTenant(
	ctx context.Context,
	tenantID, projectID string,
	limit, offset int,
) ([]models.TestCase, int64, error) {
	return s.caseRepo.FindAllWithTenant(ctx, tenantID, projectID, limit, offset)
}
```

## 🔄 迁移策略

### 渐进式迁移 (推荐)

1. **第一阶段**: 创建v2 API路由，应用租户隔离
   - 保留v1路由不变 (向后兼容)
   - 新功能只在v2中实现

2. **第二阶段**: 逐步迁移现有Handler到v2
   - 每个资源创建*WithTenant service方法
   - 更新对应的handler使用新方法

3. **第三阶段**: 弃用v1 API
   - 通知用户迁移到v2
   - 设置v1 deprecation警告
   - 最终移除v1

### 一次性迁移 (快速但有风险)

直接替换所有Service和Handler方法，要求:
- 所有API客户端必须提供租户上下文
- 充分的测试覆盖
- 数据迁移脚本确保所有现有数据有正确的tenant_id/project_id

## 📝 请求示例

### 使用HTTP Headers

```bash
curl -X POST http://localhost:8090/api/v2/tests \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: tenant-123" \
  -H "X-Project-ID: project-456" \
  -d '{
    "testId": "test-001",
    "groupId": "group-001",
    "name": "My Test",
    "type": "http"
  }'
```

### 使用Query Parameters

```bash
curl -X GET "http://localhost:8090/api/v2/tests/test-001?tenant_id=tenant-123&project_id=project-456"
```

### 使用默认租户 (开发/测试环境)

```bash
# 如果不提供租户ID，中间件会使用"default"
curl -X GET http://localhost:8090/api/v2/tests
# 相当于: tenant_id=default&project_id=default
```

## ⚠️ 重要注意事项

1. **数据一致性**:
   - 确保所有现有数据都有正确的tenant_id和project_id
   - 运行数据迁移脚本设置默认值

2. **测试隔离**:
   - 每个租户的测试数据必须完全隔离
   - 添加端到端测试验证隔离

3. **性能**:
   - 所有带tenant_id/project_id的查询都有索引
   - 监控查询性能

4. **安全**:
   - 生产环境应从JWT token提取租户ID，而不是HTTP header
   - 实施RBAC控制

## 📚 相关文档

- [多租户中间件使用指南](./MULTI_TENANT_MIDDLEWARE.md)
- [多租户实现进度](./MULTI_TENANT_PROGRESS.md)
- [数据库设计](./DATABASE_DESIGN.md)
