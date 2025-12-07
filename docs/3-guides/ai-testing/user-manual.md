# AI 测试生成系统使用手册

> 版本: 1.0.0
> 更新日期: 2025-12-07

## 目录

1. [快速开始](#1-快速开始)
2. [Commands 使用指南](#2-commands-使用指南)
3. [Skills 自动触发](#3-skills-自动触发)
4. [描述测试需求的技巧](#4-描述测试需求的技巧)
5. [多语言支持](#5-多语言支持)
6. [覆盖率分析](#6-覆盖率分析)
7. [测试改进](#7-测试改进)
8. [最佳实践](#8-最佳实践)
9. [常见问题](#9-常见问题)

---

## 1. 快速开始

### 1.1 最简单的用法

只需告诉 Claude 你想测试什么：

```
你: 帮我测试这个 Login 函数

你: 为 UserService 生成单元测试

你: 我的 CreateOrder 函数需要测试
```

Claude 会自动：
1. 分析你的代码
2. 确定需要测试的场景
3. 生成符合最佳实践的测试代码

### 1.2 使用 Commands

更精确的控制：

```
/generate-tests --file internal/auth/service.go --function Login

/analyze-coverage --path ./src

/improve-tests --file tests/user_test.go
```

### 1.3 一个完整示例

**你说:**
```
帮我测试这个函数，要求覆盖率达到 90%：

func (s *UserService) CreateUser(ctx context.Context, req *CreateUserRequest) (*User, error) {
    if req == nil {
        return nil, ErrNilRequest
    }
    if req.Email == "" {
        return nil, ErrEmptyEmail
    }

    existing, _ := s.repo.FindByEmail(ctx, req.Email)
    if existing != nil {
        return nil, ErrDuplicateEmail
    }

    user := &User{
        ID:    uuid.New().String(),
        Email: req.Email,
        Name:  req.Name,
    }

    if err := s.repo.Save(ctx, user); err != nil {
        return nil, fmt.Errorf("failed to save user: %w", err)
    }

    return user, nil
}
```

**Claude 生成:**
```go
func TestUserService_CreateUser(t *testing.T) {
    t.Run("success with valid request", func(t *testing.T) {
        // Arrange
        ctx := context.Background()
        req := &CreateUserRequest{Email: "test@example.com", Name: "Test"}

        mockRepo := new(MockUserRepository)
        mockRepo.On("FindByEmail", ctx, req.Email).Return(nil, nil)
        mockRepo.On("Save", ctx, mock.AnythingOfType("*User")).Return(nil)

        service := NewUserService(mockRepo)

        // Act
        user, err := service.CreateUser(ctx, req)

        // Assert
        require.NoError(t, err)
        assert.NotEmpty(t, user.ID)
        assert.Equal(t, req.Email, user.Email)
        mockRepo.AssertExpectations(t)
    })

    t.Run("error when request is nil", func(t *testing.T) {
        service := NewUserService(nil)
        _, err := service.CreateUser(context.Background(), nil)
        assert.ErrorIs(t, err, ErrNilRequest)
    })

    t.Run("error when email is empty", func(t *testing.T) {
        service := NewUserService(nil)
        _, err := service.CreateUser(context.Background(), &CreateUserRequest{})
        assert.ErrorIs(t, err, ErrEmptyEmail)
    })

    t.Run("error when email already exists", func(t *testing.T) {
        ctx := context.Background()
        existingUser := &User{ID: "existing", Email: "test@example.com"}

        mockRepo := new(MockUserRepository)
        mockRepo.On("FindByEmail", ctx, "test@example.com").Return(existingUser, nil)

        service := NewUserService(mockRepo)
        _, err := service.CreateUser(ctx, &CreateUserRequest{Email: "test@example.com"})

        assert.ErrorIs(t, err, ErrDuplicateEmail)
    })

    t.Run("error when save fails", func(t *testing.T) {
        ctx := context.Background()

        mockRepo := new(MockUserRepository)
        mockRepo.On("FindByEmail", ctx, mock.Anything).Return(nil, nil)
        mockRepo.On("Save", ctx, mock.Anything).Return(errors.New("db error"))

        service := NewUserService(mockRepo)
        _, err := service.CreateUser(ctx, &CreateUserRequest{Email: "test@example.com"})

        assert.Error(t, err)
        assert.Contains(t, err.Error(), "failed to save")
    })
}
```

---

## 2. Commands 使用指南

### 2.1 /generate-tests - 生成测试

**基本用法:**
```
/generate-tests --file <文件路径>
```

**完整选项:**
```
/generate-tests --file <路径> [选项]

选项:
  --function <名称>      指定函数名（不指定则测试整个文件）
  --coverage <百分比>    目标覆盖率（默认 85%）
  --include-security     包含安全测试
  --include-performance  包含性能测试
  --output <路径>        输出文件路径
```

**示例:**
```bash
# 测试单个函数
/generate-tests --file internal/auth/service.go --function Login

# 测试整个文件，目标覆盖率 90%
/generate-tests --file src/services/user.ts --coverage 90

# 包含安全测试
/generate-tests --file internal/payment/processor.go --include-security

# 指定输出路径
/generate-tests --file src/User.java --output src/UserTest.java
```

### 2.2 /analyze-coverage - 分析覆盖率

**基本用法:**
```
/analyze-coverage --path <路径>
```

**完整选项:**
```
/analyze-coverage --path <路径> [选项]

选项:
  --report <路径>      使用现有覆盖率报告
  --threshold <百分比>  目标阈值（默认 80%）
  --generate           自动生成补充测试
```

**示例:**
```bash
# 分析目录覆盖率
/analyze-coverage --path ./internal

# 分析并生成补充测试
/analyze-coverage --path ./src --generate

# 使用现有报告
/analyze-coverage --report coverage.out --threshold 90
```

### 2.3 /improve-tests - 改进测试

**基本用法:**
```
/improve-tests --file <测试文件路径>
```

**完整选项:**
```
/improve-tests --file <路径> [选项]

选项:
  --fix          自动修复问题
  --style        检查代码风格
  --performance  分析测试性能
```

**示例:**
```bash
# 分析测试质量
/improve-tests --file internal/auth/service_test.go

# 自动修复问题
/improve-tests --file tests/user.test.ts --fix

# 检查风格和性能
/improve-tests --file UserServiceTest.java --style --performance
```

---

## 3. Skills 自动触发

系统配置了两个自动触发的 Skills：

### 3.1 test-generation-expert

**自动触发场景:**
- 说 "测试" 或 "test"
- 说 "写测试" 或 "生成测试"
- 分享代码并问 "怎么测试"
- 讨论 "覆盖率" 或 "coverage"

**示例对话:**
```
你: 这个函数怎么测试？

你: 帮我写个单元测试

你: 我的覆盖率太低了

你: 这个 API 需要什么测试？
```

### 3.2 coverage-analyzer

**自动触发场景:**
- 说 "覆盖率" 或 "coverage"
- 说 "缺少测试" 或 "补充测试"
- 问 "哪些代码没测试"

**示例对话:**
```
你: 我的覆盖率是 60%，想提高到 85%

你: 哪些函数还没有测试？

你: 帮我找出覆盖率的缺口
```

---

## 4. 描述测试需求的技巧

### 4.1 好的描述 ✅

**具体明确:**
```
测试 UserService.CreateUser 函数：
- 正常创建用户
- 邮箱重复时拒绝
- 参数为空时返回错误
- 数据库失败时的处理
```

**指定场景:**
```
为登录 API 生成测试，需要覆盖：
1. 正确凭证返回 token
2. 错误密码返回 401
3. 用户不存在返回 401
4. 账户锁定返回 403
5. SQL 注入攻击防护
```

**指定要求:**
```
测试 OrderService，要求：
- 覆盖率 90%
- 包含并发测试
- 包含边界值测试
- 使用表驱动测试风格
```

### 4.2 避免的描述 ❌

```
❌ 太模糊: "测试一下这个"

❌ 没有上下文: "写测试" （没有代码）

❌ 只要正常情况: "测试登录成功的情况"
```

### 4.3 描述模板

**简单版:**
```
测试 [函数/类名]，需要覆盖 [场景列表]
```

**完整版:**
```
目标: [函数/模块名]
语言: [Go/Java/TypeScript/C++]
场景:
  - [场景1]
  - [场景2]
  - [场景3]
要求:
  - 覆盖率: [X%]
  - 其他: [安全测试/性能测试/并发测试]
```

---

## 5. 多语言支持

### 5.1 支持的语言

| 语言 | 测试框架 | Mock 框架 | 状态 |
|------|---------|----------|------|
| **Go** | testing + testify | gomock/testify | ✅ 完整支持 |
| **Java** | JUnit 5 | Mockito | ✅ 完整支持 |
| **TypeScript/JavaScript** | Jest | Jest | ✅ 完整支持 |
| **C++** | GoogleTest | GoogleMock | ✅ 完整支持 |

### 5.2 语言自动检测

Claude 会根据文件扩展名自动检测语言：

```
.go      → Go (testify)
.java    → Java (JUnit 5 + Mockito)
.ts/.tsx → TypeScript (Jest)
.js/.jsx → JavaScript (Jest)
.cpp/.cc → C++ (GoogleTest)
```

### 5.3 指定语言

如果需要明确指定：

```
用 JUnit 5 风格测试这个 Java 代码

生成 Jest 测试，使用 TypeScript

用 GoogleTest 写 C++ 测试
```

---

## 6. 覆盖率分析

### 6.1 覆盖率目标建议

| 代码类型 | 建议覆盖率 |
|---------|-----------|
| 核心业务逻辑 | 90%+ |
| API 处理 | 85%+ |
| 数据访问层 | 80%+ |
| 工具函数 | 75%+ |
| 配置代码 | 60%+ |

### 6.2 分析覆盖率缺口

```
你: /analyze-coverage --path ./internal/auth

Claude 会返回:
- 当前覆盖率
- 未覆盖的代码位置
- 缺口原因分析
- 补充测试建议
```

### 6.3 自动补充测试

```
你: /analyze-coverage --path ./src --generate

Claude 会:
1. 分析覆盖率缺口
2. 生成针对性的补充测试
3. 显示预计覆盖率提升
```

---

## 7. 测试改进

### 7.1 质量检查项

Claude 会检查以下问题：

| 问题类型 | 描述 |
|---------|------|
| 命名不规范 | 测试名称不描述场景 |
| 缺少断言 | 测试没有验证结果 |
| 多职责 | 一个测试验证多个行为 |
| 测试逻辑 | 测试中有条件判断 |
| 共享状态 | 测试间有依赖 |
| 不稳定 | 可能随机失败 |

### 7.2 自动修复

```
你: /improve-tests --file service_test.go --fix

可以自动修复:
- 命名规范
- 代码格式
- 添加缺失的 t.Helper()
- 移除死代码
```

---

## 8. 最佳实践

### 8.1 测试结构

```
每个测试遵循 AAA 模式:
- Arrange: 准备数据
- Act: 执行行为
- Assert: 验证结果
```

### 8.2 测试命名

```
Go:     Test{Function}_{Scenario}
Java:   should{Behavior}When{Condition}
JS/TS:  it('should {behavior} when {condition}')
C++:    TEST_F({Suite}, {Scenario})
```

### 8.3 测试分类

```
1. Happy Path - 正常流程（必须）
2. Error Handling - 错误处理（必须）
3. Edge Cases - 边界情况（建议）
4. Security - 安全测试（按需）
5. Performance - 性能测试（按需）
```

### 8.4 Mock 使用

```
何时 Mock:
✅ 外部服务（数据库、API、文件系统）
✅ 不确定性来源（时间、随机数）
✅ 难以触发的条件（网络错误）

何时不 Mock:
❌ 简单的值对象
❌ 纯函数
❌ 被测代码本身
```

---

## 9. 常见问题

### Q1: 生成的测试编译失败？

**原因:** 缺少导入或类型不匹配

**解决:**
```
1. 检查 import 语句
2. 确认 Mock 类型正确
3. 告诉 Claude 具体错误信息
```

### Q2: 测试运行失败？

**原因:** Mock 配置不正确或逻辑理解有误

**解决:**
```
1. 检查 Mock 的期望配置
2. 验证测试数据
3. 分享错误信息让 Claude 修复
```

### Q3: 覆盖率没有提升？

**原因:** 测试没有触发特定分支

**解决:**
```
1. 使用 /analyze-coverage 找出缺口
2. 明确告诉 Claude 哪些分支未覆盖
3. 请求生成针对性测试
```

### Q4: 如何测试私有方法？

**建议:**
```
1. 优先通过公共方法间接测试
2. 如果需要直接测试，考虑重构
3. Go: 使用同包测试 (package xxx)
4. Java: 使用反射或修改可见性
```

### Q5: 如何处理异步代码测试？

**Go:**
```go
// 使用 channel 或 WaitGroup
done := make(chan struct{})
go func() {
    // 异步操作
    close(done)
}()
<-done
```

**TypeScript:**
```typescript
// 使用 async/await
it('should handle async', async () => {
    const result = await asyncFunction();
    expect(result).toBe(expected);
});
```

---

## 附录: 知识库文件

AI 生成测试时会参考以下知识库：

| 文件 | 用途 |
|------|------|
| `test-case-library/knowledge/test-scenarios.md` | 测试场景分类 |
| `test-case-library/assertions/assertion-patterns.md` | 断言模式 |
| `test-case-library/examples/golang/` | Go 示例 |
| `test-case-library/examples/java/` | Java 示例 |
| `test-case-library/examples/typescript/` | TS 示例 |
| `test-case-library/examples/cpp/` | C++ 示例 |

---

## 获取帮助

如果遇到问题：

1. 描述你的具体需求和遇到的问题
2. 分享相关代码和错误信息
3. Claude 会帮助你解决

```
你: 我按照手册用了 /generate-tests，但是生成的测试有这个错误: [错误信息]

Claude: 让我看看问题...
```
