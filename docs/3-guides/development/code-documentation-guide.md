# 代码文档化完整指南

**版本**: 1.0
**最后更新**: 2025-11-27
**适用对象**: 全栈开发者、架构师
**难度**: 中级

---

## 概述

本指南提供完整的代码文档化工作流程，帮助开发者系统地记录代码库的架构、设计和组织方式。

### 本指南解决的问题

- ❓ 我写了一个新模块，应该记录什么文档？
- ❓ 架构文档应该放在哪个目录？
- ❓ 代码规范文档和架构文档有什么区别？
- ❓ 如何避免文档重复或放错位置？

### 前置条件

阅读本指南前，应先了解：
- [x] 项目的七层文档架构（`docs/directory-standards.md`）
- [x] 基本的软件架构概念（分层、模块化）
- [x] 所使用的编程语言和框架

---

## 快速参考：代码文档分类

| 文档类型 | 存放位置 | 何时创建 | 示例 |
|---------|---------|---------|------|
| **架构设计规范** | `1-specs/architecture/` | 架构确定时 | `backend-layered-design.md` |
| **架构决策记录** | `6-decisions/` | 做出架构决策时 | `2024-11-24-unified-workflow-architecture.md` |
| **模块边界定义** | `5-wiki/architecture/` | 模块划分时 | `module-boundaries.md` |
| **编码规范** | `3-guides/development/` | 规范制定时 | `naming-conventions.md` |
| **代码示例** | `3-guides/development/examples/` | 有最佳实践时 | `example-repository-pattern.md` |

---

## 第一部分：代码文档化决策流程

### 决策树：我应该创建什么文档？

```
你要记录什么？
│
├─ 整体系统架构设计
│   ├─ 为什么选择这个架构？ → 6-decisions/YYYY-MM-DD-architecture-decision.md
│   └─ 架构是什么样的？ → 1-specs/architecture/overview.md
│
├─ 某个模块或子系统的架构
│   ├─ 技术实现细节 → 1-specs/architecture/{component}-design.md
│   └─ 业务职责和依赖 → 5-wiki/architecture/module-boundaries.md
│
├─ 代码组织和命名规范
│   ├─ 整体规范 → 3-guides/development/code-organization.md
│   ├─ 命名规范 → 3-guides/development/naming-conventions.md
│   └─ 包结构 → 3-guides/development/package-structure.md
│
└─ 具体实现的最佳实践
    └─ 代码示例 → 3-guides/development/examples/example-{pattern}.md
```

### 快速判断表

| 问题 | 答案 YES → | 答案 NO → |
|-----|-----------|----------|
| 这是架构级别的决策吗？ | `6-decisions/` | 继续下一题 |
| 这是技术规范吗？ | `1-specs/architecture/` | 继续下一题 |
| 这是业务知识吗？ | `5-wiki/architecture/` | 继续下一题 |
| 这是操作指南吗？ | `3-guides/development/` | 重新评估 |

---

## 第二部分：架构设计文档

### 2.1 何时创建架构文档？

**触发场景**：
1. 项目启动时 - 记录整体架构设计
2. 引入新技术栈时 - 记录技术选型和集成方式
3. 重构大模块时 - 记录新的架构设计
4. 做出重大架构决策时 - 记录决策过程和结果

### 2.2 架构文档的两个层次

#### 层次1：架构决策记录 (ADR)

**位置**: `docs/6-decisions/`
**目的**: 记录**为什么**选择某个架构
**时机**: 做出决策时立即记录

**示例场景**：
```
场景: 团队决定采用Handler-Service-Repository三层架构

步骤1: 创建 ADR
文件: 6-decisions/2025-11-27-layered-architecture-decision.md

内容框架:
- 背景：为什么需要分层？
- 决策：采用Handler-Service-Repository
- 备选方案：MVC、Clean Architecture
- 优缺点对比
- 最终选择理由
```

**ADR 模板**：
```markdown
# ADR-XXX: 采用三层架构设计

**日期**: 2025-11-27
**状态**: Accepted
**决策者**: 架构团队

## 背景

当前代码混乱，业务逻辑分散在各处，难以测试和维护。

## 决策

采用Handler-Service-Repository三层架构：
- Handler层：处理HTTP请求和响应
- Service层：实现业务逻辑
- Repository层：数据访问

## 备选方案

### 方案1: MVC架构
- 优点：简单直观
- 缺点：业务逻辑容易侵入Controller

### 方案2: Clean Architecture
- 优点：依赖隔离最彻底
- 缺点：过于复杂，学习成本高

### 方案3: 三层架构（选中）
- 优点：职责清晰、易于测试、适合团队规模
- 缺点：需要编写更多接口代码

## 影响

- 所有新模块必须遵循三层架构
- 现有代码逐步重构
- 需要编写开发指南

## 相关文档

- [三层架构规范](../1-specs/architecture/backend-layered-design.md)
```

#### 层次2：架构规范文档

**位置**: `docs/1-specs/architecture/`
**目的**: 记录架构**是什么**（权威规范）
**时机**: ADR批准后立即创建

**示例场景**：
```
场景: ADR批准后，创建详细的架构规范

步骤2: 创建架构规范
文件: 1-specs/architecture/backend-layered-design.md

内容框架:
- 架构概览图
- 每一层的职责
- 层间依赖规则
- 接口设计规范
- 实施细节
```

**架构规范模板**：
```markdown
# 后端三层架构设计

**版本**: 1.0
**最后更新**: 2025-11-27
**维护者**: 后端团队
**状态**: Approved

## 架构概览

\`\`\`
┌─────────────────┐
│  Handler Layer  │ ← HTTP请求处理
├─────────────────┤
│  Service Layer  │ ← 业务逻辑
├─────────────────┤
│ Repository Layer│ ← 数据访问
└─────────────────┘
\`\`\`

## Handler层职责

**职责**：
- 接收HTTP请求
- 验证请求参数
- 调用Service层方法
- 转换响应格式
- 返回HTTP响应

**禁止**：
- ❌ 编写业务逻辑
- ❌ 直接访问数据库
- ❌ 调用其他Handler

**示例**：
\`\`\`go
func (h *TestHandler) CreateTest(c *gin.Context) {
    var req CreateTestRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(400, gin.H{"error": err.Error()})
        return
    }

    test, err := h.service.CreateTest(c.Request.Context(), &req)
    if err != nil {
        c.JSON(500, gin.H{"error": err.Error()})
        return
    }

    c.JSON(201, test)
}
\`\`\`

## Service层职责

**职责**：
- 实现核心业务逻辑
- 协调多个Repository
- 处理事务
- 返回领域对象

**禁止**：
- ❌ 访问HTTP context
- ❌ 解析HTTP参数
- ❌ 格式化HTTP响应

## Repository层职责

**职责**：
- 封装数据库操作
- 提供CRUD接口
- 处理数据映射

**禁止**：
- ❌ 包含业务逻辑
- ❌ 调用Service层

## 依赖规则

\`\`\`
Handler → Service → Repository
  ❌  ←    ❌  ←      ✅
\`\`\`

**规则**：
1. Handler只能依赖Service
2. Service只能依赖Repository
3. 禁止反向依赖
4. 同层模块禁止相互调用

## 相关文档

- [架构决策](../../6-decisions/2025-11-27-layered-architecture-decision.md)
- [包结构规范](../../3-guides/development/package-structure.md)
```

### 2.3 架构文档维护

**更新触发条件**：
- 架构调整（如增加新层）
- 技术栈升级
- 设计模式改变

**更新流程**：
1. 更新 ADR 状态（如标记为 Superseded）
2. 创建新的 ADR
3. 更新 `1-specs/architecture/` 中的规范文档
4. 同步更新开发指南

---

## 第三部分：模块边界文档

### 3.1 何时创建模块边界文档？

**触发场景**：
1. 系统拆分为多个模块时
2. 模块职责不清晰时
3. 模块间依赖关系复杂时

### 3.2 模块边界 vs 架构设计

| 方面 | 架构设计 (1-specs) | 模块边界 (5-wiki) |
|-----|-------------------|------------------|
| 关注点 | **技术实现**（如何分层） | **业务职责**（做什么） |
| 内容 | 代码结构、依赖方向 | 业务功能、协作关系 |
| 读者 | 开发者、架构师 | 所有团队成员 |
| 示例 | "Handler调用Service" | "测试模块负责执行测试" |

### 3.3 模块边界文档创建

**位置**: `docs/5-wiki/architecture/module-boundaries.md`

**示例**：
```markdown
# 模块边界定义

## 核心模块

### TestCase模块

**职责**：
- 管理测试用例的CRUD
- 执行单个测试用例
- 返回测试结果

**不负责**：
- ❌ 批量执行（由TestRun模块负责）
- ❌ 测试编排（由Workflow模块负责）

**对外接口**：
- `CreateTestCase()`
- `ExecuteTestCase()`
- `GetTestResult()`

**依赖模块**：
- Database模块（存储）
- HttpClient模块（发送请求）

### Workflow模块

**职责**：
- 编排多个测试步骤
- 管理步骤依赖关系
- 处理变量传递

**不负责**：
- ❌ 执行具体测试（调用TestCase模块）
- ❌ 管理测试数据（由TestData模块负责）

## 模块依赖图

\`\`\`
TestRun ──> TestCase ──> HttpClient
   │           │
   └──> Workflow ──────> TestCase
\`\`\`

## 集成点

### TestCase与Workflow集成

**方式**: Workflow通过TestCaseExecutor接口调用TestCase模块

**数据流**:
1. Workflow传入test_id
2. TestCase模块加载测试配置
3. TestCase执行并返回结果
4. Workflow接收结果继续下一步
```

---

## 第四部分：编码规范文档

### 4.1 何时创建编码规范？

**触发场景**：
1. 项目启动时制定统一规范
2. 代码审查发现命名不一致
3. 新成员加入需要规范指导

### 4.2 编码规范的层次

**层次1：命名规范** - `3-guides/development/naming-conventions.md`
- 文件命名
- 变量命名
- 函数命名
- 接口命名

**层次2：代码组织** - `3-guides/development/code-organization.md`
- 文件如何分组
- 目录如何组织
- 何时拆分文件

**层次3：包结构** - `3-guides/development/package-structure.md`
- 包的划分原则
- internal/ vs pkg/
- 循环依赖避免

### 4.3 编码规范文档示例

**文件**: `3-guides/development/naming-conventions.md`

```markdown
# 代码命名规范

## Go代码命名规范

### 文件命名

**规则**: 全小写，用下划线分隔

```
✅ test_case.go
✅ test_case_repository.go
❌ TestCase.go
❌ test-case.go
```

### 接口命名

**规则**: 名词 + 动作，以 `I` 结尾或动词 + `er`

```go
// ✅ 推荐
type TestCaseRepository interface {}
type TestExecutor interface {}

// ❌ 不推荐
type TestCaseRepo interface {}  // 缩写
type ITestCase interface {}      // I前缀（C#风格）
```

### 函数命名

**规则**: 驼峰命名，动词开头

```go
// ✅ 推荐
func CreateTestCase() {}
func GetTestByID() {}
func IsTestEnabled() {}

// ❌ 不推荐
func create_test_case() {}  // 下划线
func testcase_create() {}   // 名词在前
```

### 常量命名

**规则**: 全大写，下划线分隔

```go
// ✅ 推荐
const MAX_RETRY_COUNT = 3
const DEFAULT_TIMEOUT = 30000

// ❌ 不推荐
const maxRetryCount = 3
const default_timeout = 30000
```

## React组件命名

### 组件文件命名

**规则**: PascalCase，与组件名一致

```
✅ TestCaseManager.tsx
✅ WorkflowBuilder.tsx
❌ testCaseManager.tsx
❌ test-case-manager.tsx
```

### Hook命名

**规则**: use开头，驼峰命名

```typescript
// ✅ 推荐
useTestCases()
useWorkflowExecution()

// ❌ 不推荐
getTestCases()  // 不是hook
UseTestCases()  // 大写开头
```
```

---

## 第五部分：代码示例文档

### 5.1 何时创建代码示例？

**触发场景**：
1. 团队形成某个最佳实践
2. 新成员频繁询问如何实现某个模式
3. 代码审查中反复出现相同问题

### 5.2 代码示例的价值

| 场景 | 没有示例 | 有示例 |
|-----|---------|--------|
| 新人上手 | 需要阅读大量代码 | 10分钟看懂模式 |
| 代码审查 | "这样写不对" | "参考example-xxx.md" |
| 知识传承 | 依赖老员工口传 | 文档化沉淀 |

### 5.3 代码示例文档创建

**位置**: `docs/3-guides/development/examples/`

**命名**: `example-{pattern-name}.md`

**示例**: `example-repository-pattern.md`

```markdown
# 示例：Repository模式实现

## 适用场景

当你需要：
- 封装数据库操作
- 提供可测试的数据访问接口
- 隔离业务逻辑和数据访问

## 完整示例

### 1. 定义Repository接口

\`\`\`go
// internal/repository/test_case_repository.go
package repository

type TestCaseRepository interface {
    Create(ctx context.Context, testCase *models.TestCase) error
    GetByID(ctx context.Context, testID string) (*models.TestCase, error)
    Update(ctx context.Context, testCase *models.TestCase) error
    Delete(ctx context.Context, testID string) error
    List(ctx context.Context, filter *TestCaseFilter) ([]*models.TestCase, error)
}
\`\`\`

### 2. 实现Repository

\`\`\`go
// internal/repository/test_case_repository_impl.go
package repository

type testCaseRepositoryImpl struct {
    db *gorm.DB
}

func NewTestCaseRepository(db *gorm.DB) TestCaseRepository {
    return &testCaseRepositoryImpl{db: db}
}

func (r *testCaseRepositoryImpl) Create(ctx context.Context, testCase *models.TestCase) error {
    return r.db.WithContext(ctx).Create(testCase).Error
}

func (r *testCaseRepositoryImpl) GetByID(ctx context.Context, testID string) (*models.TestCase, error) {
    var testCase models.TestCase
    err := r.db.WithContext(ctx).Where("test_id = ?", testID).First(&testCase).Error
    if err != nil {
        return nil, err
    }
    return &testCase, nil
}
\`\`\`

### 3. 在Service中使用

\`\`\`go
// internal/service/test_case_service.go
package service

type TestCaseService struct {
    repo repository.TestCaseRepository
}

func NewTestCaseService(repo repository.TestCaseRepository) *TestCaseService {
    return &TestCaseService{repo: repo}
}

func (s *TestCaseService) CreateTestCase(ctx context.Context, req *CreateTestRequest) (*models.TestCase, error) {
    testCase := &models.TestCase{
        TestID: generateID(),
        Name:   req.Name,
        // ... 其他字段
    }

    if err := s.repo.Create(ctx, testCase); err != nil {
        return nil, fmt.Errorf("failed to create test case: %w", err)
    }

    return testCase, nil
}
\`\`\`

### 4. Mock Repository用于测试

\`\`\`go
// internal/repository/mock/test_case_repository_mock.go
package mock

type MockTestCaseRepository struct {
    CreateFunc  func(ctx context.Context, testCase *models.TestCase) error
    GetByIDFunc func(ctx context.Context, testID string) (*models.TestCase, error)
}

func (m *MockTestCaseRepository) Create(ctx context.Context, testCase *models.TestCase) error {
    if m.CreateFunc != nil {
        return m.CreateFunc(ctx, testCase)
    }
    return nil
}

func (m *MockTestCaseRepository) GetByID(ctx context.Context, testID string) (*models.TestCase, error) {
    if m.GetByIDFunc != nil {
        return m.GetByIDFunc(ctx, testID)
    }
    return &models.TestCase{}, nil
}
\`\`\`

## 关键要点

1. **接口优先**: 先定义接口，再实现
2. **依赖注入**: 通过构造函数注入Repository
3. **错误包装**: 使用`fmt.Errorf`包装错误，保留调用栈
4. **Context传递**: 所有方法接受`context.Context`
5. **可测试性**: 接口使Mock变得简单

## 常见错误

### ❌ 错误1: Service直接使用GORM

\`\`\`go
// ❌ 不要这样
func (s *TestCaseService) CreateTestCase(req *CreateTestRequest) error {
    return s.db.Create(&testCase).Error  // Service直接操作DB
}
\`\`\`

### ✅ 正确: 通过Repository

\`\`\`go
// ✅ 应该这样
func (s *TestCaseService) CreateTestCase(ctx context.Context, req *CreateTestRequest) error {
    return s.repo.Create(ctx, &testCase)  // 通过Repository
}
\`\`\`

## 相关文档

- [三层架构规范](../../1-specs/architecture/backend-layered-design.md)
- [依赖注入指南](../dependency-injection.md)
```

---

## 第六部分：文档维护工作流

### 6.1 新功能开发时的文档工作流

```
1. 设计阶段
   ├─ 是否需要架构调整？
   │  └─ YES → 创建ADR（6-decisions/）
   │            ↓
   │            创建架构规范（1-specs/architecture/）
   └─ NO → 继续

2. 实现阶段
   ├─ 是否引入新模块？
   │  └─ YES → 更新模块边界文档（5-wiki/architecture/）
   └─ NO → 继续

3. 完成阶段
   ├─ 是否有可复用的模式？
   │  └─ YES → 创建代码示例（3-guides/development/examples/）
   └─ NO → 完成
```

### 6.2 文档审查清单

创建代码文档后，使用此清单审查：

- [ ] **正确的位置**: 文档是否放在正确的目录？
- [ ] **遵循规范**: 是否使用标准模板？
- [ ] **完整的元数据**: 版本、日期、维护者都有吗？
- [ ] **清晰的示例**: 是否包含代码示例？
- [ ] **关联文档**: 是否链接到相关文档？
- [ ] **更新README**: 是否更新目录的README？

### 6.3 文档过时检测

**每月审查**（技术负责人）：
1. 检查`1-specs/architecture/`中的架构规范是否与代码一致
2. 检查`5-wiki/architecture/`中的模块边界是否准确
3. 检查`3-guides/development/`中的规范是否过时

**触发更新**：
- 重构后架构变化
- 新技术栈引入
- 代码审查发现不一致

---

## 第七部分：常见场景示例

### 场景1: 引入新的中间件层

**情况**: 团队决定在Handler和Service之间增加Middleware层

**文档化步骤**:

```
步骤1: 创建ADR
文件: 6-decisions/2025-11-27-add-middleware-layer.md
内容: 为什么需要中间件层（认证、日志、限流）

步骤2: 更新架构规范
文件: 1-specs/architecture/backend-layered-design.md
修改: 增加Middleware层的说明，更新架构图

步骤3: 更新开发指南
文件: 3-guides/development/code-organization.md
修改: 增加middleware目录的组织规范
```

### 场景2: 重构数据访问层

**情况**: 从直接使用GORM改为Repository模式

**文档化步骤**:

```
步骤1: 创建ADR
文件: 6-decisions/2025-11-27-adopt-repository-pattern.md
内容: 为什么采用Repository模式（可测试性、解耦）

步骤2: 创建代码示例
文件: 3-guides/development/examples/example-repository-pattern.md
内容: 完整的Repository实现示例

步骤3: 更新包结构文档
文件: 3-guides/development/package-structure.md
修改: 增加repository包的说明
```

### 场景3: 新增Workflow模块

**情况**: 新增一个复杂的Workflow编排模块

**文档化步骤**:

```
步骤1: 更新模块边界
文件: 5-wiki/architecture/module-boundaries.md
内容: 增加Workflow模块的职责和依赖关系

步骤2: 创建模块技术规范（可选）
文件: 1-specs/workflow/workflow-engine.md
内容: Workflow引擎的技术实现细节

步骤3: 创建使用指南
文件: 5-wiki/workflow/overview.md
内容: Workflow的业务使用说明
```

---

## 第八部分：最佳实践

### 8.1 文档编写原则

1. **及时性**: 设计时同步编写，不要事后补
2. **准确性**: 代码和文档必须一致
3. **简洁性**: 只记录必要信息，避免冗余
4. **可维护性**: 使用标准模板，便于更新

### 8.2 常见反模式

| 反模式 | 问题 | 正确做法 |
|--------|------|---------|
| **文档和代码分离** | 代码改了文档没改 | 重构时同步更新文档 |
| **过度文档化** | 文档太多，难以维护 | 只记录架构级别的信息 |
| **文档重复** | 多个地方记录相同内容 | 单一职责，交叉引用 |
| **没有示例** | 规范难以理解 | 提供完整代码示例 |

### 8.3 文档和代码的平衡

**不需要文档化的**:
- ❌ 每个函数的实现细节（用代码注释）
- ❌ 临时的代码片段
- ❌ 显而易见的命名规则

**必须文档化的**:
- ✅ 架构设计和决策
- ✅ 模块边界和职责
- ✅ 非显而易见的编码规范
- ✅ 最佳实践和模式

---

## 附录A：文档模板清单

### ADR模板
- 位置: `6-decisions/_template.md`
- 用途: 架构决策记录

### 架构规范模板
- 位置: `1-specs/architecture/_template.md`
- 用途: 技术架构规范

### 模块边界模板
- 位置: `5-wiki/architecture/_template-module.md`
- 用途: 模块职责定义

### 代码示例模板
- 位置: `3-guides/development/examples/_template.md`
- 用途: 设计模式示例

---

## 附录B：相关文档

- [文档标准](../../directory-standards.md) - 完整的文档组织规范
- [架构设计规范](../../1-specs/architecture/README.md) - 架构文档说明
- [架构决策记录](../../6-decisions/README.md) - ADR使用指南
- [模块边界定义](../../5-wiki/architecture/module-boundaries.md) - 当前模块划分

---

## 附录C：故障排除

### 问题1: 不知道文档应该放哪？

**解决方案**: 使用决策树（第一部分）或查看快速判断表

### 问题2: 文档太多，维护不过来？

**解决方案**:
- 只维护架构级别文档
- 实现细节写在代码注释中
- 定期归档过时文档

### 问题3: 团队成员不愿意写文档？

**解决方案**:
- 将文档纳入Definition of Done
- 代码审查时检查文档
- 使用模板降低编写成本

---

**维护者**: 技术负责人、架构师
**反馈**: 如有问题请联系技术负责人
**最后审核**: 2025-11-27
