# 多租户中间件使用指南

## 概述

租户上下文中间件 (`TenantContext`) 提供了多租户和项目隔离功能，确保所有API请求都在正确的租户和项目上下文中执行。

## 核心组件

### 1. TenantContext 中间件

主要中间件，负责：
- 从请求头或查询参数中提取租户ID和项目ID
- 验证租户存在且状态为活跃
- 验证项目存在且属于指定租户
- 将租户和项目信息设置到Gin上下文中

### 2. 上下文键

```go
const (
    TenantIDKey  = "tenant_id"  // 租户ID键
    ProjectIDKey = "project_id" // 项目ID键
    TenantKey    = "tenant"     // 租户对象键
    ProjectKey   = "project"    // 项目对象键
)
```

### 3. 辅助中间件

- `RequireTenant()`: 确保租户上下文存在
- `RequireProject()`: 确保项目上下文存在

## 使用方法

### 初始化中间件

```go
import (
    "test-management-service/internal/middleware"
    "test-management-service/internal/repository"
)

// 创建repositories
tenantRepo := repository.NewTenantRepository(db)
projectRepo := repository.NewProjectRepository(db)

// 创建中间件实例
tenantContext := middleware.NewTenantContext(tenantRepo, projectRepo)
```

### 在路由中使用

```go
// 方式1: 全局应用
router := gin.New()
router.Use(tenantContext.ValidateTenantAndProject())

// 方式2: 应用到路由组
api := router.Group("/api/v2")
api.Use(tenantContext.ValidateTenantAndProject())
{
    api.GET("/tests", testHandler.ListTests)
    api.POST("/tests", testHandler.CreateTest)
}

// 方式3: 应用到特定路由
router.GET("/api/v2/tests/:id",
    tenantContext.ValidateTenantAndProject(),
    testHandler.GetTest,
)
```

### 在Handler中获取租户/项目信息

```go
import "test-management-service/internal/middleware"

func (h *TestHandler) CreateTest(c *gin.Context) {
    // 获取租户ID
    tenantID := middleware.GetTenantID(c)

    // 获取项目ID
    projectID := middleware.GetProjectID(c)

    // 获取租户对象
    tenant := middleware.GetTenant(c)

    // 获取项目对象
    project := middleware.GetProject(c)

    // 使用租户/项目信息
    testCase := &models.TestCase{
        TestID:    generateID(),
        TenantID:  tenantID,
        ProjectID: projectID,
        Name:      req.Name,
    }

    // ... 创建测试用例
}
```

## 请求头格式

### HTTP 请求头

```http
GET /api/v2/tests HTTP/1.1
Host: localhost:8090
X-Tenant-ID: tenant-123
X-Project-ID: project-456
```

### 查询参数

```http
GET /api/v2/tests?tenant_id=tenant-123&project_id=project-456 HTTP/1.1
Host: localhost:8090
```

### 默认值

如果未指定租户ID或项目ID，中间件会使用 `"default"` 作为默认值。

## 错误响应

### 租户不存在

```json
{
  "error": "tenant not found",
  "code": "TENANT_NOT_FOUND"
}
```
HTTP Status: `404 Not Found`

### 租户未激活

```json
{
  "error": "tenant is not active",
  "code": "TENANT_INACTIVE"
}
```
HTTP Status: `403 Forbidden`

### 项目不存在

```json
{
  "error": "project not found",
  "code": "PROJECT_NOT_FOUND"
}
```
HTTP Status: `404 Not Found`

### 项目不属于租户

```json
{
  "error": "project does not belong to tenant",
  "code": "PROJECT_TENANT_MISMATCH"
}
```
HTTP Status: `403 Forbidden`

### 项目未激活

```json
{
  "error": "project is not active",
  "code": "PROJECT_INACTIVE"
}
```
HTTP Status: `403 Forbidden`

## 测试示例

### 单元测试

```go
func TestWithTenantContext(t *testing.T) {
    // 设置测试环境
    db := setupTestDB(t)
    tenantRepo := repository.NewTenantRepository(db)
    projectRepo := repository.NewProjectRepository(db)
    middleware := NewTenantContext(tenantRepo, projectRepo)

    // 创建路由
    router := gin.New()
    router.Use(middleware.ValidateTenantAndProject())
    router.GET("/test", func(c *gin.Context) {
        tenantID := GetTenantID(c)
        c.JSON(200, gin.H{"tenant_id": tenantID})
    })

    // 测试请求
    req := httptest.NewRequest("GET", "/test", nil)
    req.Header.Set("X-Tenant-ID", "test-tenant")
    req.Header.Set("X-Project-ID", "test-project")
    w := httptest.NewRecorder()
    router.ServeHTTP(w, req)

    assert.Equal(t, 200, w.Code)
}
```

### 集成测试

```go
func TestAPIWithTenantIsolation(t *testing.T) {
    // 创建两个租户的测试数据
    tenant1 := createTestTenant(t, db, "tenant-1")
    tenant2 := createTestTenant(t, db, "tenant-2")

    project1 := createTestProject(t, db, "project-1", "tenant-1")
    project2 := createTestProject(t, db, "project-2", "tenant-2")

    // 创建测试用例 (tenant-1)
    testCase1 := createTestCase(t, "test-1", "tenant-1", "project-1")

    // 尝试用tenant-2访问tenant-1的数据 (应该失败)
    req := httptest.NewRequest("GET", "/api/v2/tests/test-1", nil)
    req.Header.Set("X-Tenant-ID", "tenant-2")
    req.Header.Set("X-Project-ID", "project-2")
    w := httptest.NewRecorder()
    router.ServeHTTP(w, req)

    // 应该返回404，因为租户隔离
    assert.Equal(t, 404, w.Code)
}
```

## 最佳实践

### 1. 始终验证租户和项目

在所有需要租户隔离的API路由上都应用中间件：

```go
// 正确
api.Use(tenantContext.ValidateTenantAndProject())

// 不推荐: 仅依赖客户端发送正确的租户ID
```

### 2. 在Repository层实现租户过滤

Repository方法应该始终过滤租户和项目：

```go
func (r *TestCaseRepository) GetByID(testID, tenantID, projectID string) (*models.TestCase, error) {
    var testCase models.TestCase
    err := r.db.Where("test_id = ? AND tenant_id = ? AND project_id = ?",
        testID, tenantID, projectID).First(&testCase).Error
    // ...
}
```

### 3. 在Service层传递租户上下文

Service方法应该接收并传递租户和项目ID：

```go
func (s *TestService) CreateTest(tenantID, projectID string, req *CreateTestRequest) (*models.TestCase, error) {
    testCase := &models.TestCase{
        TestID:    generateID(),
        TenantID:  tenantID,
        ProjectID: projectID,
        // ...
    }
    return s.repo.Create(testCase)
}
```

### 4. 日志记录

在日志中包含租户和项目信息：

```go
log.WithFields(log.Fields{
    "tenant_id":  tenantID,
    "project_id": projectID,
    "test_id":    testID,
}).Info("创建测试用例")
```

## 常见问题

### Q: 如何支持超级管理员跨租户访问？

A: 可以创建额外的中间件来检查用户权限，允许管理员绕过租户检查：

```go
func AdminBypass() gin.HandlerFunc {
    return func(c *gin.Context) {
        if isAdmin(c) {
            // 设置特殊标志或跳过验证
            c.Set("is_admin", true)
        }
        c.Next()
    }
}
```

### Q: 默认租户的用途是什么？

A: 默认租户用于：
- 系统初始化和测试
- 向后兼容不支持多租户的旧API
- 单租户部署场景

### Q: 如何处理批量操作？

A: 批量操作仍然应该限制在单个租户和项目内：

```go
func (s *TestService) BatchCreate(tenantID, projectID string, tests []*CreateTestRequest) error {
    for _, test := range tests {
        test.TenantID = tenantID
        test.ProjectID = projectID
    }
    // ...
}
```

## 安全考虑

1. **永远不要信任客户端提供的租户ID** - 在生产环境中，应该从认证token中提取租户ID
2. **实施API速率限制** - 按租户限制API调用频率
3. **审计日志** - 记录所有跨租户访问尝试
4. **定期审查** - 定期检查租户隔离是否正常工作
