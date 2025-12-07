# AI 驱动的测试代码生成设计

> 版本: 2.0.0
> 创建日期: 2025-12-07
> 更新: 采用 AI 直接生成替代传统模板引擎

## 1. 核心理念

### 1.1 为什么用 AI 生成而非模板引擎？

| 维度 | 传统模板引擎 | AI 生成 |
|------|-------------|---------|
| **灵活性** | 低，固定格式 | 高，智能适应 |
| **上下文理解** | 无，只做替换 | 强，理解代码含义 |
| **边界处理** | 需预定义所有情况 | 自动识别和处理 |
| **代码风格** | 固定风格 | 适应项目风格 |
| **维护成本** | 高，需维护大量模板 | 低，只需维护知识库 |
| **扩展新语言** | 需开发新模板 | 只需添加少量知识 |

### 1.2 新架构的核心思想

```
知识库 + AI = 智能测试生成

知识库 (What): 告诉 AI 应该测试什么、怎样是好的测试
AI (How): 理解代码上下文，智能生成具体测试代码
```

---

## 2. 架构设计

### 2.1 整体流程

```
用户输入                    AI 处理                       输出
─────────                  ────────                      ─────

"测试登录功能"              ┌─────────────────────┐
     │                     │   1. 意图理解        │
     ├────────────────────▶│   理解用户想测什么   │
     │                     └──────────┬──────────┘
     │                                │
目标代码                              ▼
func Login()               ┌─────────────────────┐
     │                     │   2. 代码分析        │
     ├────────────────────▶│   理解代码结构       │
     │                     │   识别参数、返回值   │
     │                     │   找出分支条件       │
     │                     └──────────┬──────────┘
     │                                │
知识库                                ▼
(测试模式、                 ┌─────────────────────┐
 最佳实践、                 │   3. 知识增强        │      测试代码
 断言规范)                  │   参考测试模式       │      func TestLogin_
     │                     │   应用最佳实践       │──────▶  Success()
     ├────────────────────▶│   选择合适断言       │      func TestLogin_
     │                     └──────────┬──────────┘        InvalidPwd()
     │                                │                  ...
     │                                ▼
     │                     ┌─────────────────────┐
     │                     │   4. 代码生成        │
     │                     │   AI 直接生成代码    │
     │                     │   适应项目风格       │
     │                     └─────────────────────┘
```

### 2.2 知识库的新定位

知识库不再是代码模板，而是 **AI 的参考资料**：

```
test-case-library/
├── knowledge/                      # AI 参考知识
│   ├── test-scenarios.md           # 测试场景分类
│   ├── best-practices.md           # 最佳实践
│   └── common-patterns.md          # 常见测试模式
│
├── examples/                       # 示例代码（供 AI 参考风格）
│   ├── golang/
│   │   ├── unit-test-example.go
│   │   ├── table-driven-example.go
│   │   └── mock-example.go
│   ├── java/
│   │   └── ...
│   └── typescript/
│       └── ...
│
├── assertions/                     # 断言模式（告诉 AI 各语言写法）
│   ├── equality-patterns.md
│   ├── error-patterns.md
│   └── collection-patterns.md
│
└── rules/                          # 质量规则（AI 生成后检查）
    ├── naming-conventions.md
    ├── coverage-requirements.md
    └── quality-checklist.md
```

### 2.3 AI Prompt 设计

核心 Prompt 结构：

```markdown
# System Prompt (测试生成专家)

你是一个专业的测试工程师，帮助用户生成高质量的测试代码。

## 你的知识库

### 测试场景分类
{从 knowledge/test-scenarios.md 加载}

### 最佳实践
{从 knowledge/best-practices.md 加载}

### 断言模式
{从 assertions/*.md 加载相关语言的断言}

## 代码风格参考
{从 examples/{language}/*.* 加载示例}

## 质量要求
{从 rules/*.md 加载}

---

# User Prompt

## 目标代码
```{language}
{source_code}
```

## 测试需求
{user_intent}

## 要求
1. 生成符合 {language} 最佳实践的测试代码
2. 覆盖正常路径、错误处理、边界情况
3. 使用合适的断言方法
4. 遵循项目代码风格
5. 目标覆盖率：{coverage_target}%

请生成完整的测试代码。
```

---

## 3. 实现方案

### 3.1 Claude Code 集成

在 Claude Code 环境中，直接利用 Claude 的能力：

```markdown
# .claude/commands/generate-tests.md

当用户请求生成测试时：

1. **读取知识库**
   - 读取 test-case-library/knowledge/*.md
   - 读取对应语言的示例 test-case-library/examples/{lang}/*
   - 读取断言模式 test-case-library/assertions/*

2. **分析目标代码**
   - 读取目标源文件
   - 识别函数签名、参数、返回值
   - 分析分支条件和复杂度

3. **构建上下文**
   结合以下信息生成测试：
   - 用户意图
   - 代码分析结果
   - 知识库参考
   - 项目现有测试风格

4. **生成测试代码**
   直接用 AI 能力生成，而非模板替换

5. **验证质量**
   - 检查语法正确性
   - 检查命名规范
   - 检查断言充分性
```

### 3.2 知识库内容设计

**test-scenarios.md** - 告诉 AI 应该测试什么：

```markdown
# 测试场景知识库

## 函数测试场景

当测试一个函数时，AI 应该考虑以下场景：

### 1. Happy Path（正常路径）
- 有效输入返回预期结果
- 所有前置条件满足时的正常流程

### 2. Error Handling（错误处理）
- 无效输入（空值、错误类型、超出范围）
- 外部依赖失败（数据库、网络、文件）
- 业务规则违反

### 3. Edge Cases（边界情况）
- 数值边界：0, -1, MAX, MIN
- 字符串边界：空、单字符、超长
- 集合边界：空、单元素、大量元素
- 时间边界：过去、未来、边界日期

### 4. Security（安全测试）
- 注入攻击防护
- 权限验证
- 敏感数据处理

## 根据代码特征选择场景

| 代码特征 | 必须测试的场景 |
|---------|---------------|
| 有参数验证 | 无效输入、边界值 |
| 调用外部服务 | mock 外部依赖、超时处理 |
| 有数据库操作 | CRUD 成功/失败、并发 |
| 有条件分支 | 每个分支至少一个测试 |
| 处理用户输入 | 注入攻击、特殊字符 |
```

**best-practices.md** - 告诉 AI 什么是好的测试：

```markdown
# 测试最佳实践知识库

## AAA 模式

每个测试必须遵循 Arrange-Act-Assert 模式：

```go
func TestExample(t *testing.T) {
    // Arrange - 准备测试数据
    input := prepareInput()
    mock := setupMock()

    // Act - 执行被测行为
    result, err := functionUnderTest(input)

    // Assert - 验证结果
    require.NoError(t, err)
    assert.Equal(t, expected, result)
}
```

## 单一职责

每个测试只验证一个行为。如果测试名称包含 "and"，考虑拆分。

## 测试命名

好的测试名称描述：被测对象_场景_预期结果

示例：
- TestLogin_ValidCredentials_ReturnsToken
- TestLogin_InvalidPassword_ReturnsUnauthorized
- TestCreateOrder_InsufficientStock_ReturnsError

## 断言原则

1. 使用具体断言而非通用断言
   - ✅ assert.Equal(t, expected, actual)
   - ❌ assert.True(t, expected == actual)

2. 提供有意义的错误消息
   - ✅ assert.Equal(t, 200, resp.Code, "expected success status")
   - ❌ assert.Equal(t, 200, resp.Code)

3. 先验证前置条件（用 require），再验证结果（用 assert）
```

### 3.3 示例驱动学习

提供各语言的高质量示例，让 AI 学习风格：

**examples/golang/table-driven-example.go**:

```go
// 这是 Go 语言表驱动测试的标准写法
// AI 应该在适合的场景使用这种模式

func TestCalculate_EdgeCases(t *testing.T) {
    tests := []struct {
        name     string
        input    int
        expected int
        wantErr  error
    }{
        {
            name:     "positive number",
            input:    5,
            expected: 25,
        },
        {
            name:     "zero",
            input:    0,
            expected: 0,
        },
        {
            name:     "negative number",
            input:    -5,
            expected: 25,
        },
        {
            name:    "overflow",
            input:   math.MaxInt64,
            wantErr: ErrOverflow,
        },
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            result, err := Calculate(tt.input)

            if tt.wantErr != nil {
                require.ErrorIs(t, err, tt.wantErr)
                return
            }

            require.NoError(t, err)
            assert.Equal(t, tt.expected, result)
        })
    }
}
```

---

## 4. AI 生成的优势

### 4.1 智能适应代码风格

AI 可以分析项目现有测试，自动适应：

```
现有测试风格分析:
- 使用 testify/assert ✓
- 使用表驱动测试 ✓
- 变量命名: camelCase ✓
- 错误变量名: err ✓
- mock 命名: mock{Dependency} ✓

生成新测试时自动遵循这些约定
```

### 4.2 智能边界推断

AI 可以根据参数类型自动推断边界：

```go
// 目标函数
func ProcessAge(age int) error

// AI 自动推断的测试场景：
// - age = 0 (边界)
// - age = -1 (负数)
// - age = 150 (可能的上限)
// - age = math.MaxInt64 (溢出)
```

### 4.3 上下文理解

AI 能理解代码含义，生成更有意义的测试：

```go
// 目标函数
func (s *OrderService) CreateOrder(userID string, items []Item) (*Order, error) {
    // 检查用户
    user, err := s.userRepo.GetByID(userID)
    if err != nil {
        return nil, err
    }

    // 检查库存
    for _, item := range items {
        stock, _ := s.inventoryRepo.GetStock(item.ProductID)
        if stock < item.Quantity {
            return nil, ErrInsufficientStock
        }
    }

    // 创建订单...
}

// AI 理解后生成的测试：
// 1. TestCreateOrder_Success - 正常创建
// 2. TestCreateOrder_UserNotFound - 用户不存在
// 3. TestCreateOrder_InsufficientStock - 库存不足
// 4. TestCreateOrder_EmptyItems - 空商品列表
// 5. TestCreateOrder_MultipleItemsPartialStock - 多商品部分缺货
```

---

## 5. 质量保证

### 5.1 生成后验证

```yaml
validation_pipeline:
  - step: syntax_check
    description: 检查语法
    go: "go vet"
    java: "javac -Xlint"
    ts: "tsc --noEmit"

  - step: compile_check
    description: 编译验证
    go: "go build ./..."
    java: "mvn compile"
    ts: "npm run build"

  - step: test_execution
    description: 运行测试
    go: "go test -v"
    java: "mvn test"
    ts: "npm test"

  - step: quality_review
    description: 质量审查
    checks:
      - 测试命名规范
      - AAA 模式遵循
      - 断言充分性
      - 边界覆盖
```

### 5.2 反馈学习

```
测试执行结果 → 反馈给 AI → 改进生成

示例反馈循环:
1. AI 生成测试
2. 执行测试，发现失败
3. 分析失败原因
4. AI 修正测试
5. 重新验证
```

---

## 6. 与传统方案的对比

| 场景 | 传统模板 | AI 生成 |
|------|---------|---------|
| **简单 CRUD** | 快速，但固定 | 同样快速，更灵活 |
| **复杂业务逻辑** | 需要大量模板变体 | AI 理解逻辑后智能生成 |
| **特殊边界情况** | 需预定义 | AI 自动识别 |
| **新语言支持** | 需开发全套模板 | 只需少量示例 |
| **代码风格适配** | 固定风格 | 自动适应项目风格 |
| **错误处理** | 模板可能有误 | AI 可以修正 |

---

## 7. 实施建议

### 7.1 知识库优先

1. **先建立高质量知识库**
   - 测试场景分类
   - 最佳实践指南
   - 各语言示例代码

2. **知识库持续更新**
   - 根据实际使用反馈更新
   - 添加新的测试模式
   - 更新最佳实践

### 7.2 渐进式验证

1. **第一阶段**: 生成 + 人工审查
2. **第二阶段**: 生成 + 自动验证 + 人工确认
3. **第三阶段**: 生成 + 自动验证 + 自动集成

### 7.3 反馈闭环

```
用户使用 → 收集反馈 → 改进知识库 → 提升生成质量
                ↑                         │
                └─────────────────────────┘
```

---

## 8. 总结

**核心转变**: 从"模板填充"到"AI 理解+生成"

- **知识库**: 告诉 AI 什么是好的测试（What）
- **AI**: 理解代码并智能生成（How）
- **验证**: 确保生成质量（Check）

这种方式更灵活、更智能，能够处理复杂场景，同时降低维护成本。
