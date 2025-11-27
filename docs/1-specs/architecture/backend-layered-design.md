# 后端三层架构设计

**版本**: 1.0
**最后更新**: 2025-11-27
**维护者**: 后端团队
**状态**: Approved

---

## 概述

本文档定义了测试管理平台后端服务的三层架构设计标准，确保代码的可维护性、可测试性和可扩展性。

### 架构模式

采用经典的**Handler-Service-Repository三层架构**，严格遵循单向依赖原则。

### 设计目标

- 🎯 **职责分离**：每层只负责特定职责，避免职责混乱
- 🔄 **依赖倒置**：上层依赖接口，下层实现接口
- 🧪 **可测试性**：通过接口隔离，便于单元测试和Mock
- 📈 **可扩展性**：新增功能时遵循相同模式，易于理解和扩展

---

## 架构概览

### 分层图

```
┌─────────────────────────────────────────────┐
│  Client (HTTP/WebSocket)                    │
└─────────────────────────────────────────────┘
                    ↕
┌─────────────────────────────────────────────┐
│  Handler Layer (HTTP Handlers)              │
│  - 接收请求                                  │
│  - 参数验证                                  │
│  - 调用Service                              │
│  - 返回响应                                  │
└─────────────────────────────────────────────┘
                    ↓ (只能调用Service接口)
┌─────────────────────────────────────────────┐
│  Service Layer (Business Logic)             │
│  - 业务逻辑实现                              │
│  - 事务管理                                  │
│  - 协调多个Repository                       │
│  - 返回领域对象                              │
└─────────────────────────────────────────────┘
                    ↓ (只能调用Repository接口)
┌─────────────────────────────────────────────┐
│  Repository Layer (Data Access)             │
│  - CRUD操作                                 │
│  - 数据映射                                  │
│  - 查询封装                                  │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│  Database (SQLite/MySQL/PostgreSQL)         │
└─────────────────────────────────────────────┘
```

### 依赖规则

```
Handler → Service → Repository → Database
  ❌  ←    ❌  ←      ❌  ←
```

**严格禁止**:
- ❌ Handler直接调用Repository
- ❌ Service反向依赖Handler
- ❌ Repository调用Service
- ❌ 跨层直接访问数据库

---

## Handler层（HTTP处理层）

### 职责

Handler层是系统的入口，负责HTTP请求处理和响应格式化。

**核心职责**:
1. **接收HTTP请求**：接收来自客户端的HTTP请求
2. **参数绑定和验证**：绑定请求参数并验证合法性
3. **调用Service方法**：调用业务逻辑层处理请求
4. **错误处理**：捕获Service层错误并转换为HTTP状态码
5. **响应格式化**：将Service返回的数据转换为JSON响应

### 禁止事项

- ❌ **不能包含业务逻辑**：任何业务规则都应在Service层实现
- ❌ **不能直接访问数据库**：必须通过Service调用Repository
- ❌ **不能调用其他Handler**：Handler之间应相互独立
- ❌ **不能处理复杂数据转换**：复杂转换逻辑放在Service层

### 代码示例

#### 标准Handler结构

```go
// internal/handler/test_case_handler.go
package handler

import (
	"net/http"
	"github.com/gin-gonic/gin"
	"test-platform/internal/service"
)

// TestCaseHandler 测试用例HTTP处理器
type TestCaseHandler struct {
	service service.TestCaseService // 依赖Service接口
}

// NewTestCaseHandler 构造函数（依赖注入）
func NewTestCaseHandler(service service.TestCaseService) *TestCaseHandler {
	return &TestCaseHandler{
		service: service,
	}
}

// CreateTestCase 创建测试用例
func (h *TestCaseHandler) CreateTestCase(c *gin.Context) {
	// 1. 绑定请求参数
	var req CreateTestCaseRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "Invalid request parameters",
			"error":   err.Error(),
		})
		return
	}

	// 2. 调用Service层
	testCase, err := h.service.CreateTestCase(c.Request.Context(), &req)
	if err != nil {
		// 3. 错误处理和状态码映射
		statusCode := mapErrorToStatusCode(err)
		c.JSON(statusCode, gin.H{
			"code":    statusCode,
			"message": "Failed to create test case",
			"error":   err.Error(),
		})
		return
	}

	// 4. 成功响应
	c.JSON(http.StatusCreated, gin.H{
		"code":    0,
		"message": "Test case created successfully",
		"data":    testCase,
	})
}

// GetTestCase 获取测试用例详情
func (h *TestCaseHandler) GetTestCase(c *gin.Context) {
	testID := c.Param("id")

	testCase, err := h.service.GetTestCase(c.Request.Context(), testID)
	if err != nil {
		if errors.Is(err, service.ErrTestCaseNotFound) {
			c.JSON(http.StatusNotFound, gin.H{
				"code":    404,
				"message": "Test case not found",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "Failed to get test case",
			"error":   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code": 0,
		"data": testCase,
	})
}

// 错误到状态码映射
func mapErrorToStatusCode(err error) int {
	switch {
	case errors.Is(err, service.ErrTestCaseNotFound):
		return http.StatusNotFound
	case errors.Is(err, service.ErrInvalidInput):
		return http.StatusBadRequest
	case errors.Is(err, service.ErrUnauthorized):
		return http.StatusUnauthorized
	default:
		return http.StatusInternalServerError
	}
}
```

#### 请求/响应DTO

```go
// internal/handler/dto.go
package handler

// CreateTestCaseRequest 创建测试用例请求
type CreateTestCaseRequest struct {
	TestID   string                 `json:"testId" binding:"required"`
	Name     string                 `json:"name" binding:"required"`
	Type     string                 `json:"type" binding:"required,oneof=http command workflow"`
	GroupID  string                 `json:"groupId" binding:"required"`
	Priority string                 `json:"priority" binding:"omitempty,oneof=P0 P1 P2"`
	HTTPConfig map[string]interface{} `json:"http,omitempty"`
}

// TestCaseResponse 测试用例响应
type TestCaseResponse struct {
	ID        uint      `json:"id"`
	TestID    string    `json:"testId"`
	Name      string    `json:"name"`
	Type      string    `json:"type"`
	Status    string    `json:"status"`
	CreatedAt time.Time `json:"createdAt"`
}
```

---

## Service层（业务逻辑层）

### 职责

Service层是系统的核心，实现所有业务逻辑。

**核心职责**:
1. **实现业务规则**：所有业务逻辑和规则验证
2. **协调多个Repository**：组合多个数据操作完成业务流程
3. **事务管理**：管理跨Repository的事务边界
4. **数据转换**：将Repository返回的数据转换为业务对象
5. **错误封装**：封装底层错误为业务错误

### 禁止事项

- ❌ **不能访问HTTP上下文**：不依赖gin.Context等HTTP特定对象
- ❌ **不能解析HTTP参数**：参数应由Handler解析后传入
- ❌ **不能格式化HTTP响应**：返回业务对象，由Handler格式化
- ❌ **不能直接使用数据库连接**：必须通过Repository接口

### 代码示例

#### 标准Service接口和实现

```go
// internal/service/test_case_service.go
package service

import (
	"context"
	"errors"
	"fmt"
	"test-platform/internal/models"
	"test-platform/internal/repository"
)

// 业务错误定义
var (
	ErrTestCaseNotFound = errors.New("test case not found")
	ErrInvalidInput     = errors.New("invalid input")
	ErrDuplicateTestID  = errors.New("test ID already exists")
)

// TestCaseService 测试用例服务接口
type TestCaseService interface {
	CreateTestCase(ctx context.Context, req *CreateTestCaseRequest) (*models.TestCase, error)
	GetTestCase(ctx context.Context, testID string) (*models.TestCase, error)
	UpdateTestCase(ctx context.Context, testID string, req *UpdateTestCaseRequest) (*models.TestCase, error)
	DeleteTestCase(ctx context.Context, testID string) error
	ExecuteTestCase(ctx context.Context, testID string) (*models.TestResult, error)
}

// testCaseServiceImpl Service实现
type testCaseServiceImpl struct {
	repo          repository.TestCaseRepository
	groupRepo     repository.TestGroupRepository
	executorSvc   TestExecutorService
}

// NewTestCaseService 构造函数（依赖注入）
func NewTestCaseService(
	repo repository.TestCaseRepository,
	groupRepo repository.TestGroupRepository,
	executorSvc TestExecutorService,
) TestCaseService {
	return &testCaseServiceImpl{
		repo:        repo,
		groupRepo:   groupRepo,
		executorSvc: executorSvc,
	}
}

// CreateTestCase 创建测试用例（业务逻辑）
func (s *testCaseServiceImpl) CreateTestCase(
	ctx context.Context,
	req *CreateTestCaseRequest,
) (*models.TestCase, error) {
	// 1. 业务验证：检查测试组是否存在
	_, err := s.groupRepo.GetByID(ctx, req.GroupID)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return nil, fmt.Errorf("test group not found: %w", ErrInvalidInput)
		}
		return nil, fmt.Errorf("failed to validate group: %w", err)
	}

	// 2. 业务验证：检查testID是否重复
	existing, _ := s.repo.GetByTestID(ctx, req.TestID)
	if existing != nil {
		return nil, ErrDuplicateTestID
	}

	// 3. 业务逻辑：构建测试用例对象
	testCase := &models.TestCase{
		TestID:   req.TestID,
		Name:     req.Name,
		Type:     req.Type,
		GroupID:  req.GroupID,
		Priority: req.Priority,
		Status:   "active",
		HTTPConfig: req.HTTPConfig,
	}

	// 4. 业务逻辑：设置默认值
	if testCase.Priority == "" {
		testCase.Priority = "P2"
	}
	if testCase.Timeout == 0 {
		testCase.Timeout = 300
	}

	// 5. 调用Repository持久化
	if err := s.repo.Create(ctx, testCase); err != nil {
		return nil, fmt.Errorf("failed to create test case: %w", err)
	}

	return testCase, nil
}

// ExecuteTestCase 执行测试用例（复杂业务流程）
func (s *testCaseServiceImpl) ExecuteTestCase(
	ctx context.Context,
	testID string,
) (*models.TestResult, error) {
	// 1. 获取测试用例
	testCase, err := s.repo.GetByTestID(ctx, testID)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return nil, ErrTestCaseNotFound
		}
		return nil, fmt.Errorf("failed to get test case: %w", err)
	}

	// 2. 业务验证
	if testCase.Status != "active" {
		return nil, fmt.Errorf("test case is not active: %w", ErrInvalidInput)
	}

	// 3. 执行测试（调用其他Service）
	result, err := s.executorSvc.Execute(ctx, testCase)
	if err != nil {
		return nil, fmt.Errorf("test execution failed: %w", err)
	}

	// 4. 更新统计信息（业务逻辑）
	testCase.ExecutionCount++
	if result.Status == "passed" {
		testCase.SuccessCount++
	} else {
		testCase.FailureCount++
	}
	testCase.SuccessRate = (testCase.SuccessCount * 100) / testCase.ExecutionCount
	testCase.LastRunAt = &result.StartTime

	// 5. 更新到数据库
	if err := s.repo.Update(ctx, testCase); err != nil {
		// 记录错误但不影响结果返回
		fmt.Printf("failed to update test case stats: %v\n", err)
	}

	return result, nil
}
```

#### Service请求对象

```go
// internal/service/requests.go
package service

// CreateTestCaseRequest Service层请求对象
type CreateTestCaseRequest struct {
	TestID     string
	Name       string
	Type       string
	GroupID    string
	Priority   string
	Timeout    int
	HTTPConfig map[string]interface{}
}

// UpdateTestCaseRequest 更新请求
type UpdateTestCaseRequest struct {
	Name       *string
	Priority   *string
	Status     *string
	HTTPConfig map[string]interface{}
}
```

---

## Repository层（数据访问层）

### 职责

Repository层负责所有数据持久化操作。

**核心职责**:
1. **CRUD操作**：提供标准的增删改查方法
2. **数据映射**：GORM模型与数据库表之间的映射
3. **查询封装**：封装复杂查询逻辑
4. **错误处理**：统一数据访问错误

### 禁止事项

- ❌ **不能包含业务逻辑**：只做数据访问，不做业务判断
- ❌ **不能调用Service层**：单向依赖，禁止反向调用
- ❌ **不能直接返回GORM错误**：封装为Repository层错误

### 代码示例

#### 标准Repository接口和实现

```go
// internal/repository/test_case_repository.go
package repository

import (
	"context"
	"errors"
	"fmt"
	"gorm.io/gorm"
	"test-platform/internal/models"
)

// Repository层错误定义
var (
	ErrNotFound      = errors.New("record not found")
	ErrDuplicateKey  = errors.New("duplicate key")
	ErrInvalidFilter = errors.New("invalid filter")
)

// TestCaseRepository 测试用例仓储接口
type TestCaseRepository interface {
	Create(ctx context.Context, testCase *models.TestCase) error
	GetByID(ctx context.Context, id uint) (*models.TestCase, error)
	GetByTestID(ctx context.Context, testID string) (*models.TestCase, error)
	Update(ctx context.Context, testCase *models.TestCase) error
	Delete(ctx context.Context, id uint) error
	List(ctx context.Context, filter *TestCaseFilter) ([]*models.TestCase, int64, error)
}

// testCaseRepositoryImpl Repository实现
type testCaseRepositoryImpl struct {
	db *gorm.DB
}

// NewTestCaseRepository 构造函数
func NewTestCaseRepository(db *gorm.DB) TestCaseRepository {
	return &testCaseRepositoryImpl{db: db}
}

// Create 创建测试用例
func (r *testCaseRepositoryImpl) Create(ctx context.Context, testCase *models.TestCase) error {
	if err := r.db.WithContext(ctx).Create(testCase).Error; err != nil {
		// 处理唯一约束冲突
		if errors.Is(err, gorm.ErrDuplicatedKey) {
			return ErrDuplicateKey
		}
		return fmt.Errorf("create test case failed: %w", err)
	}
	return nil
}

// GetByID 根据ID获取测试用例
func (r *testCaseRepositoryImpl) GetByID(ctx context.Context, id uint) (*models.TestCase, error) {
	var testCase models.TestCase
	err := r.db.WithContext(ctx).First(&testCase, id).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("get test case failed: %w", err)
	}
	return &testCase, nil
}

// GetByTestID 根据testID获取
func (r *testCaseRepositoryImpl) GetByTestID(ctx context.Context, testID string) (*models.TestCase, error) {
	var testCase models.TestCase
	err := r.db.WithContext(ctx).
		Where("test_id = ?", testID).
		First(&testCase).Error

	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("get test case by test_id failed: %w", err)
	}
	return &testCase, nil
}

// Update 更新测试用例
func (r *testCaseRepositoryImpl) Update(ctx context.Context, testCase *models.TestCase) error {
	result := r.db.WithContext(ctx).Save(testCase)
	if result.Error != nil {
		return fmt.Errorf("update test case failed: %w", result.Error)
	}
	if result.RowsAffected == 0 {
		return ErrNotFound
	}
	return nil
}

// Delete 删除测试用例（软删除）
func (r *testCaseRepositoryImpl) Delete(ctx context.Context, id uint) error {
	result := r.db.WithContext(ctx).Delete(&models.TestCase{}, id)
	if result.Error != nil {
		return fmt.Errorf("delete test case failed: %w", result.Error)
	}
	if result.RowsAffected == 0 {
		return ErrNotFound
	}
	return nil
}

// List 列表查询（带分页和过滤）
func (r *testCaseRepositoryImpl) List(
	ctx context.Context,
	filter *TestCaseFilter,
) ([]*models.TestCase, int64, error) {
	var testCases []*models.TestCase
	var total int64

	// 构建查询
	query := r.db.WithContext(ctx).Model(&models.TestCase{})

	// 应用过滤条件
	if filter.GroupID != "" {
		query = query.Where("group_id = ?", filter.GroupID)
	}
	if filter.Type != "" {
		query = query.Where("type = ?", filter.Type)
	}
	if filter.Status != "" {
		query = query.Where("status = ?", filter.Status)
	}
	if filter.Priority != "" {
		query = query.Where("priority = ?", filter.Priority)
	}

	// 计算总数
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, fmt.Errorf("count failed: %w", err)
	}

	// 应用分页和排序
	offset := (filter.Page - 1) * filter.PageSize
	err := query.
		Order("created_at DESC").
		Limit(filter.PageSize).
		Offset(offset).
		Find(&testCases).Error

	if err != nil {
		return nil, 0, fmt.Errorf("list test cases failed: %w", err)
	}

	return testCases, total, nil
}
```

#### 查询过滤器

```go
// internal/repository/filters.go
package repository

// TestCaseFilter 测试用例查询过滤器
type TestCaseFilter struct {
	GroupID  string
	Type     string
	Status   string
	Priority string
	Page     int
	PageSize int
}

// Validate 验证过滤器
func (f *TestCaseFilter) Validate() error {
	if f.Page < 1 {
		f.Page = 1
	}
	if f.PageSize < 1 || f.PageSize > 100 {
		f.PageSize = 20
	}
	return nil
}
```

---

## 依赖注入和组装

### 依赖注入原则

使用**构造函数注入**实现依赖倒置：

```go
// 正确：依赖接口
type TestCaseService struct {
	repo repository.TestCaseRepository // 接口
}

// 错误：依赖实现
type TestCaseService struct {
	repo *repository.TestCaseRepositoryImpl // 具体实现
}
```

### 组装示例

```go
// cmd/server/main.go
package main

import (
	"gorm.io/gorm"
	"test-platform/internal/handler"
	"test-platform/internal/repository"
	"test-platform/internal/service"
)

func setupDependencies(db *gorm.DB) *handler.TestCaseHandler {
	// 1. 创建Repository层
	testCaseRepo := repository.NewTestCaseRepository(db)
	testGroupRepo := repository.NewTestGroupRepository(db)

	// 2. 创建Service层（注入Repository）
	executorSvc := service.NewTestExecutorService()
	testCaseSvc := service.NewTestCaseService(
		testCaseRepo,
		testGroupRepo,
		executorSvc,
	)

	// 3. 创建Handler层（注入Service）
	testCaseHandler := handler.NewTestCaseHandler(testCaseSvc)

	return testCaseHandler
}
```

---

## 事务管理

### 事务在Service层

事务边界应该在Service层管理：

```go
// internal/service/test_case_service.go

func (s *testCaseServiceImpl) CreateTestWithResults(
	ctx context.Context,
	req *CreateTestRequest,
) error {
	// 开启事务
	return s.db.Transaction(func(tx *gorm.DB) error {
		// 使用事务创建Repository
		txRepo := repository.NewTestCaseRepository(tx)

		// 1. 创建测试用例
		testCase := &models.TestCase{...}
		if err := txRepo.Create(ctx, testCase); err != nil {
			return err // 自动回滚
		}

		// 2. 创建测试结果
		result := &models.TestResult{...}
		resultRepo := repository.NewTestResultRepository(tx)
		if err := resultRepo.Create(ctx, result); err != nil {
			return err // 自动回滚
		}

		// 事务提交
		return nil
	})
}
```

---

## Context传递

### 统一使用context.Context

所有跨层方法都应接受`context.Context`：

```go
// Handler层
func (h *TestCaseHandler) CreateTestCase(c *gin.Context) {
	ctx := c.Request.Context() // 从HTTP请求获取
	testCase, err := h.service.CreateTestCase(ctx, req)
	...
}

// Service层
func (s *TestCaseService) CreateTestCase(
	ctx context.Context,
	req *Request,
) (*TestCase, error) {
	...
	err := s.repo.Create(ctx, testCase)
	...
}

// Repository层
func (r *TestCaseRepository) Create(
	ctx context.Context,
	testCase *models.TestCase,
) error {
	return r.db.WithContext(ctx).Create(testCase).Error
}
```

### Context用途

- ⏱️ **超时控制**：传递请求超时信息
- 🔑 **认证信息**：传递用户身份信息
- 📊 **追踪信息**：传递链路追踪ID
- ❌ **取消信号**：请求取消时中断处理

---

## 错误处理

### 分层错误处理

每层定义自己的错误类型：

```go
// Repository层错误
var (
	ErrNotFound     = errors.New("record not found")
	ErrDuplicateKey = errors.New("duplicate key")
)

// Service层错误
var (
	ErrTestCaseNotFound = errors.New("test case not found")
	ErrInvalidInput     = errors.New("invalid input")
	ErrUnauthorized     = errors.New("unauthorized")
)

// Handler层错误映射
func mapErrorToStatusCode(err error) int {
	switch {
	case errors.Is(err, service.ErrTestCaseNotFound):
		return http.StatusNotFound
	case errors.Is(err, service.ErrInvalidInput):
		return http.StatusBadRequest
	default:
		return http.StatusInternalServerError
	}
}
```

### 错误包装

使用`fmt.Errorf`和`%w`保留错误链：

```go
// Service层
if err := s.repo.Create(ctx, testCase); err != nil {
	return fmt.Errorf("failed to create test case: %w", err)
}

// Handler层检测
if errors.Is(err, repository.ErrNotFound) {
	// 处理特定错误
}
```

---

## 最佳实践

### 1. 接口优先设计

先定义接口，再实现：

```go
// 1. 先定义接口
type TestCaseService interface {
	CreateTestCase(ctx context.Context, req *Request) (*TestCase, error)
}

// 2. 再实现
type testCaseServiceImpl struct {
	repo repository.TestCaseRepository
}

func (s *testCaseServiceImpl) CreateTestCase(...) {...}
```

### 2. 保持方法简洁

每个方法只做一件事：

```go
// ✅ 好的做法
func (s *Service) CreateTestCase(ctx context.Context, req *Request) error {
	if err := s.validateInput(req); err != nil {
		return err
	}
	testCase := s.buildTestCase(req)
	return s.repo.Create(ctx, testCase)
}

// ❌ 不好的做法
func (s *Service) CreateTestCase(ctx context.Context, req *Request) error {
	// 200行代码混在一个方法中
}
```

### 3. 使用领域对象

Service层使用领域模型，Handler层使用DTO：

```go
// models/test_case.go - 领域模型
type TestCase struct {
	ID       uint
	TestID   string
	Name     string
	...
}

// handler/dto.go - DTO
type CreateTestCaseRequest struct {
	TestID string `json:"testId"`
	Name   string `json:"name"`
}

type TestCaseResponse struct {
	ID     uint   `json:"id"`
	TestID string `json:"testId"`
}
```

### 4. 避免贫血模型

领域模型可以包含业务方法：

```go
// models/test_case.go
type TestCase struct {
	...
	SuccessCount int
	FailureCount int
}

// 业务方法
func (t *TestCase) CalculateSuccessRate() int {
	if t.ExecutionCount == 0 {
		return 0
	}
	return (t.SuccessCount * 100) / t.ExecutionCount
}

func (t *TestCase) IsFlaky() bool {
	return t.FlakyScore > 70
}
```

---

## 测试策略

### Mock接口进行单元测试

```go
// service/test_case_service_test.go
package service_test

import (
	"testing"
	"test-platform/internal/service"
)

// Mock Repository
type mockTestCaseRepository struct {
	createFunc func(ctx context.Context, tc *models.TestCase) error
}

func (m *mockTestCaseRepository) Create(ctx context.Context, tc *models.TestCase) error {
	if m.createFunc != nil {
		return m.createFunc(ctx, tc)
	}
	return nil
}

func TestCreateTestCase(t *testing.T) {
	// 创建Mock
	mockRepo := &mockTestCaseRepository{
		createFunc: func(ctx context.Context, tc *models.TestCase) error {
			tc.ID = 1
			return nil
		},
	}

	// 创建Service（注入Mock）
	svc := service.NewTestCaseService(mockRepo, nil, nil)

	// 测试
	result, err := svc.CreateTestCase(context.Background(), &req)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if result.ID != 1 {
		t.Errorf("expected ID 1, got %d", result.ID)
	}
}
```

---

## 相关文档

- [系统架构概览](./overview.md) - 整体架构设计
- [WebSocket架构设计](./websocket-architecture.md) - WebSocket实现
- [代码文档化指南](../../3-guides/development/code-documentation-guide.md) - 文档编写指南
- [Repository模式示例](../../3-guides/development/examples/example-repository-pattern.md) - 具体示例

---

**审核历史**:
- 2025-11-27: 初始版本 - 后端团队
- 基于项目实际代码结构整理

**维护计划**:
- 架构调整时同步更新
- 每季度审查遵循情况
- 新人入职必读文档
