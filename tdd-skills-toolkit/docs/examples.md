# TDD Skills Toolkit - 使用示例集

> 真实场景下的TDD技能应用示例

## 示例索引

1. [新功能开发 - 用户注册](#示例1-新功能开发---用户注册)
2. [Bug修复 - 空指针修复](#示例2-bug修复---空指针修复)
3. [遗留代码加测试](#示例3-遗留代码加测试)
4. [API接口开发](#示例4-api接口开发)
5. [数据库操作](#示例5-数据库操作)
6. [重构现有代码](#示例6-重构现有代码)

---

## 示例1: 新功能开发 - 用户注册

### 场景
为系统添加用户注册功能，需要：
- 验证邮箱格式
- 检查用户名唯一性
- 密码加密存储
- 返回JWT token

### 实现过程

#### 对话记录

**用户**:
```
实现用户注册功能：
1. 接收username, email, password
2. 验证邮箱格式
3. 检查用户名是否已存在
4. 密码加密后存储
5. 返回JWT token
```

**Claude**:
```
我会使用test-driven-development技能实现这个功能。

=== Phase 1: RED - 写失败的测试 ===

创建文件: backend/internal/service/auth_service_test.go
```

```go
package service_test

import (
    "context"
    "testing"

    "github.com/stretchr/testify/assert"
    "github.com/stretchr/testify/mock"
    "github.com/stretchr/testify/require"

    "your-project/internal/models"
    "your-project/internal/service"
)

// 测试1: 成功注册
func TestRegister_Success(t *testing.T) {
    // Arrange
    mockRepo := new(MockUserRepository)
    mockJWT := new(MockJWTService)
    svc := service.NewAuthService(mockRepo, mockJWT)

    ctx := context.Background()
    req := &service.RegisterRequest{
        Username: "testuser",
        Email:    "test@example.com",
        Password: "password123",
    }

    mockRepo.On("FindByUsername", ctx, "testuser").Return(nil, nil)
    mockRepo.On("Create", ctx, mock.AnythingOfType("*models.User")).Return(nil)
    mockJWT.On("GenerateToken", mock.Anything).Return("jwt-token-xyz", nil)

    // Act
    result, err := svc.Register(ctx, req)

    // Assert
    require.NoError(t, err)
    assert.NotNil(t, result)
    assert.Equal(t, "jwt-token-xyz", result.Token)
    assert.Equal(t, "testuser", result.User.Username)
    mockRepo.AssertExpectations(t)
}

// 测试2: 无效邮箱
func TestRegister_InvalidEmail(t *testing.T) {
    // Arrange
    mockRepo := new(MockUserRepository)
    mockJWT := new(MockJWTService)
    svc := service.NewAuthService(mockRepo, mockJWT)

    req := &service.RegisterRequest{
        Username: "testuser",
        Email:    "invalid-email",
        Password: "password123",
    }

    // Act
    result, err := svc.Register(context.Background(), req)

    // Assert
    require.Error(t, err)
    assert.Nil(t, result)
    assert.Contains(t, err.Error(), "invalid email")
}

// 测试3: 用户名已存在
func TestRegister_UsernameExists(t *testing.T) {
    // Arrange
    mockRepo := new(MockUserRepository)
    mockJWT := new(MockJWTService)
    svc := service.NewAuthService(mockRepo, mockJWT)

    existingUser := &models.User{Username: "testuser"}
    mockRepo.On("FindByUsername", context.Background(), "testuser").
        Return(existingUser, nil)

    req := &service.RegisterRequest{
        Username: "testuser",
        Email:    "test@example.com",
        Password: "password123",
    }

    // Act
    result, err := svc.Register(context.Background(), req)

    // Assert
    require.Error(t, err)
    assert.Nil(t, result)
    assert.Contains(t, err.Error(), "username already exists")
    mockRepo.AssertExpectations(t)
}
```

```
=== Phase 2: 运行测试确认失败 ===

$ go test -v ./internal/service -run TestRegister

# 输出:
# auth_service_test.go:25: svc.Register undefined (type *AuthService has no field or method Register)
# FAIL

✅ 测试失败（符合预期 - Register方法不存在）
```

```
=== Phase 3: GREEN - 最小实现 ===

创建文件: backend/internal/service/auth_service.go
```

```go
package service

import (
    "context"
    "fmt"
    "regexp"

    "golang.org/x/crypto/bcrypt"

    "your-project/internal/models"
    "your-project/internal/repository"
)

type AuthService struct {
    userRepo repository.UserRepository
    jwtSvc   JWTService
}

func NewAuthService(userRepo repository.UserRepository, jwtSvc JWTService) *AuthService {
    return &AuthService{
        userRepo: userRepo,
        jwtSvc:   jwtSvc,
    }
}

type RegisterRequest struct {
    Username string `json:"username"`
    Email    string `json:"email"`
    Password string `json:"password"`
}

type RegisterResponse struct {
    User  *models.User `json:"user"`
    Token string       `json:"token"`
}

func (s *AuthService) Register(ctx context.Context, req *RegisterRequest) (*RegisterResponse, error) {
    // 验证邮箱格式
    if !isValidEmail(req.Email) {
        return nil, fmt.Errorf("invalid email format")
    }

    // 检查用户名是否已存在
    existing, err := s.userRepo.FindByUsername(ctx, req.Username)
    if err != nil {
        return nil, fmt.Errorf("failed to check username: %w", err)
    }
    if existing != nil {
        return nil, fmt.Errorf("username already exists")
    }

    // 加密密码
    hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
    if err != nil {
        return nil, fmt.Errorf("failed to hash password: %w", err)
    }

    // 创建用户
    user := &models.User{
        Username: req.Username,
        Email:    req.Email,
        Password: string(hashedPassword),
    }

    if err := s.userRepo.Create(ctx, user); err != nil {
        return nil, fmt.Errorf("failed to create user: %w", err)
    }

    // 生成JWT
    token, err := s.jwtSvc.GenerateToken(user)
    if err != nil {
        return nil, fmt.Errorf("failed to generate token: %w", err)
    }

    return &RegisterResponse{
        User:  user,
        Token: token,
    }, nil
}

func isValidEmail(email string) bool {
    pattern := `^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`
    re := regexp.MustCompile(pattern)
    return re.MatchString(email)
}
```

```
=== Phase 4: 验证测试通过 ===

$ go test -v ./internal/service -run TestRegister

# 输出:
=== RUN   TestRegister_Success
--- PASS: TestRegister_Success (0.00s)
=== RUN   TestRegister_InvalidEmail
--- PASS: TestRegister_InvalidEmail (0.00s)
=== RUN   TestRegister_UsernameExists
--- PASS: TestRegister_UsernameExists (0.00s)
PASS
ok      your-project/internal/service    0.015s

✅ 所有测试通过！
```

```
=== Phase 5: REFACTOR ===

提取邮箱验证到单独的validator包...
（保持测试GREEN）

✅ 重构完成，测试仍然通过
```

```
=== 完成 ===

功能已实现：
✅ 用户注册服务
✅ 邮箱格式验证
✅ 用户名唯一性检查
✅ 密码加密
✅ JWT生成
✅ 100%测试覆盖率

文件:
  backend/internal/service/auth_service.go (70 lines)
  backend/internal/service/auth_service_test.go (120 lines)

下一步: 实现HTTP handler或继续添加登录功能？
```

---

## 示例2: Bug修复 - 空指针修复

### 场景
生产环境报错：`panic: nil pointer dereference in GetUserProfile`

### 修复过程

**用户**:
```
修复bug: GetUserProfile在用户不存在时panic

错误日志:
panic: runtime error: invalid memory address or nil pointer dereference
at internal/handler/user_handler.go:45
```

**Claude**:
```
我会使用TDD方法修复这个bug。

=== Step 1: 写测试复现bug ===

添加测试: backend/internal/handler/user_handler_test.go
```

```go
// 测试用户不存在的情况
func TestGetUserProfile_UserNotFound(t *testing.T) {
    // Arrange
    mockService := new(MockUserService)
    handler := NewUserHandler(mockService)

    // 模拟用户不存在
    mockService.On("GetByID", context.Background(), "nonexistent").
        Return(nil, nil)  // 返回nil用户

    req := httptest.NewRequest("GET", "/users/nonexistent", nil)
    rec := httptest.NewRecorder()

    // Act
    handler.GetUserProfile(rec, req)

    // Assert
    // 不应该panic，应该返回404
    assert.Equal(t, http.StatusNotFound, rec.Code)
}
```

```
=== Step 2: 运行测试确认复现bug ===

$ go test -v ./internal/handler -run TestGetUserProfile_UserNotFound

# 输出:
panic: runtime error: invalid memory address or nil pointer dereference

✅ Bug复现成功
```

```
=== Step 3: 修复代码 ===

修改: backend/internal/handler/user_handler.go
```

```go
func (h *UserHandler) GetUserProfile(w http.ResponseWriter, r *http.Request) {
    userID := chi.URLParam(r, "userID")

    user, err := h.userService.GetByID(r.Context(), userID)
    if err != nil {
        http.Error(w, "Failed to get user", http.StatusInternalServerError)
        return
    }

    // 修复: 添加nil检查
    if user == nil {
        http.Error(w, "User not found", http.StatusNotFound)
        return
    }

    // 原来这里没有nil检查，直接使用user导致panic
    json.NewEncoder(w).Encode(user)
}
```

```
=== Step 4: 验证测试通过 ===

$ go test -v ./internal/handler

# 输出:
=== RUN   TestGetUserProfile_UserNotFound
--- PASS: TestGetUserProfile_UserNotFound (0.00s)
PASS

✅ Bug修复，测试通过
```

```
=== 完成 ===

Bug已修复：
✅ 添加nil检查
✅ 返回404 Not Found
✅ 测试覆盖该场景
✅ 不再panic

提交: git commit -m "fix: handle nil user in GetUserProfile

Fixes panic when user not found.
Added nil check before accessing user object.
Added test case for user not found scenario."
```

---

## 示例3: 遗留代码加测试

### 场景
有一个已存在的PaymentService，没有测试，需要补充测试

### 操作过程

**用户**:
```
/generate-tests backend/internal/service/payment_service.go
```

**Claude (自动使用test-generation-expert)**:
```
📊 分析 payment_service.go...

发现方法:
1. ProcessPayment(ctx, orderID, amount) error
2. RefundPayment(ctx, paymentID) error
3. GetPaymentStatus(ctx, paymentID) (*PaymentStatus, error)

生成测试文件: backend/internal/service/payment_service_test.go
```

```go
package service_test

import (
    "context"
    "errors"
    "testing"

    "github.com/stretchr/testify/assert"
    "github.com/stretchr/testify/mock"
    "github.com/stretchr/testify/require"

    "your-project/internal/models"
    "your-project/internal/service"
)

// ======================
// ProcessPayment Tests
// ======================

func TestProcessPayment_Success(t *testing.T) {
    mockRepo := new(MockPaymentRepository)
    mockGateway := new(MockPaymentGateway)
    svc := service.NewPaymentService(mockRepo, mockGateway)

    ctx := context.Background()
    orderID := "order-123"
    amount := 99.99

    mockGateway.On("Charge", orderID, amount).Return("payment-456", nil)
    mockRepo.On("SavePayment", ctx, mock.AnythingOfType("*models.Payment")).Return(nil)

    err := svc.ProcessPayment(ctx, orderID, amount)

    require.NoError(t, err)
    mockGateway.AssertExpectations(t)
    mockRepo.AssertExpectations(t)
}

func TestProcessPayment_GatewayError(t *testing.T) {
    mockRepo := new(MockPaymentRepository)
    mockGateway := new(MockPaymentGateway)
    svc := service.NewPaymentService(mockRepo, mockGateway)

    mockGateway.On("Charge", "order-123", 99.99).
        Return("", errors.New("gateway error"))

    err := svc.ProcessPayment(context.Background(), "order-123", 99.99)

    require.Error(t, err)
    assert.Contains(t, err.Error(), "gateway error")
}

// ======================
// RefundPayment Tests
// ======================

func TestRefundPayment_Success(t *testing.T) {
    mockRepo := new(MockPaymentRepository)
    mockGateway := new(MockPaymentGateway)
    svc := service.NewPaymentService(mockRepo, mockGateway)

    ctx := context.Background()
    paymentID := "payment-456"

    payment := &models.Payment{
        ID:     paymentID,
        Amount: 99.99,
        Status: "completed",
    }

    mockRepo.On("GetPayment", ctx, paymentID).Return(payment, nil)
    mockGateway.On("Refund", paymentID).Return(nil)
    mockRepo.On("UpdatePaymentStatus", ctx, paymentID, "refunded").Return(nil)

    err := svc.RefundPayment(ctx, paymentID)

    require.NoError(t, err)
    mockRepo.AssertExpectations(t)
    mockGateway.AssertExpectations(t)
}

// ... 更多测试 ...

✅ 生成了15个测试用例
```

```
运行测试:

$ go test -v ./internal/service -run TestPayment

# 输出:
=== RUN   TestProcessPayment_Success
--- PASS: TestProcessPayment_Success (0.00s)
=== RUN   TestProcessPayment_GatewayError
--- PASS: TestProcessPayment_GatewayError (0.00s)
=== RUN   TestRefundPayment_Success
--- PASS: TestRefundPayment_Success (0.00s)
... (12 more tests)
PASS
ok      your-project/internal/service    0.023s

✅ 所有生成的测试都通过！
```

**用户**:
```
/analyze-coverage backend/internal/service/payment_service.go
```

**Claude**:
```
📊 Coverage Analysis for payment_service.go

Overall Coverage: 87.5%
Target: 80.0%
Status: ✅ PASS

Detailed Coverage:
  ProcessPayment:     95.0% (19/20 lines)
  RefundPayment:      90.0% (18/20 lines)
  GetPaymentStatus:   75.0% (12/16 lines)

Missing Coverage:
  payment_service.go:78-80 (error handling in GetPaymentStatus)
  payment_service.go:92 (edge case in RefundPayment)

📝 Recommendations:
  1. Add test for GetPaymentStatus with database error
  2. Add test for RefundPayment with already refunded payment

✅ Coverage is above target, but consider adding these edge cases
```

---

## 更多示例

完整示例集包括：
- API接口开发 (示例4)
- 数据库操作 (示例5)
- 重构现有代码 (示例6)
- 并发代码测试
- 微服务集成测试
- 前端组件测试

详见各skill的SKILL.md文件中的示例部分。

---

## 总结

这些示例展示了TDD技能在实际开发中的应用：

✅ **新功能** - 先写测试，保证质量
✅ **Bug修复** - 先复现，再修复，确保不复发
✅ **遗留代码** - 快速生成测试，建立安全网
✅ **重构** - 测试保护，安心重构

使用TDD Skills Toolkit，让测试成为开发的自然组成部分，而不是事后补救。
