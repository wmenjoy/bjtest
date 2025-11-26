# 模块边界定义 (Module Boundaries)

**版本**: 1.0
**最后更新**: 2025-11-26
**维护者**: 开发团队
**状态**: ✅ 生效中

---

## 目录

1. [概述](#概述)
2. [模块清单](#模块清单)
3. [依赖关系图](#依赖关系图)
4. [模块职责边界](#模块职责边界)
5. [调用规则](#调用规则)
6. [数据所有权](#数据所有权)
7. [违规示例](#违规示例)
8. [架构演进](#架构演进)

---

## 概述

本文档定义NextTest平台各业务模块间的边界和依赖规则,防止循环依赖、职责混乱和架构腐化。

### 核心原则

1. **单向依赖**: 模块间依赖必须单向,禁止循环依赖
2. **数据所有权**: 每个数据表只能由一个模块修改
3. **接口隔离**: 模块间通过Service接口调用,禁止直接访问Repository
4. **职责明确**: 每个模块只负责其核心领域逻辑

### 违规后果

- **Code Review不通过**: 违反边界规则的代码不允许合并
- **技术债标记**: 遗留违规代码标记为Tech Debt,优先重构
- **架构审查**: 重大架构变更需通过架构审查委员会

---

## 模块清单

| 模块名称 | 职责 | 核心实体 | Wiki文档 |
|---------|------|---------|----------|
| **TestCase** | 测试用例管理和执行 | TestCase, TestResult, TestRun | [overview.md](../testcase/overview.md) |
| **Workflow** | 工作流编排和调度 | Workflow, WorkflowRun, WorkflowStepExecution | [overview.md](../workflow/overview.md) |
| **Environment** | 环境变量管理 | Environment, EnvironmentVariable | [overview.md](../environment/overview.md) |
| **Tenant** | 多租户和项目管理 | Tenant, Project, TenantMember, ProjectMember | [overview.md](../tenant/overview.md) |
| **TestGroup** | 测试分组和层级管理 | TestGroup | - |
| **User** | 用户认证和权限 | User, Role, Permission | - |
| **ActionLibrary** | 动作库管理 | ActionTemplate | 计划中 |
| **APICenter** | API文档中心 | APIEndpoint, APISchema | 计划中 |

---

## 依赖关系图

### 完整依赖图

```
┌────────────────────────────────────────────────────────────────┐
│                         Platform Layer                         │
│                       (User, Tenant, Env)                      │
└────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌────────────────────────────────────────────────────────────────┐
│                      Foundation Layer                          │
│              Tenant → Project → Environment                    │
│                         User → Role                            │
└────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌────────────────────────────────────────────────────────────────┐
│                      Business Layer                            │
│                                                                │
│       TestGroup → TestCase ⇄ Workflow                         │
│                       │         │                              │
│                       ▼         ▼                              │
│                   TestResult  WorkflowRun                      │
│                                                                │
└────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌────────────────────────────────────────────────────────────────┐
│                      Extension Layer                           │
│          ActionLibrary (计划中), APICenter (计划中)            │
└────────────────────────────────────────────────────────────────┘

图例:
→  单向依赖 (A → B: A依赖B)
⇄  双向依赖 (需特殊处理,防止循环)
```

### 分层依赖规则

**Layer 1: Platform Layer (平台层)**
- 职责: 提供基础的租户、用户、环境管理
- 依赖: 无 (最底层)
- 被依赖: 所有业务层模块

**Layer 2: Business Layer (业务层)**
- 职责: 核心业务逻辑(测试、工作流)
- 依赖: Platform Layer
- 被依赖: Extension Layer

**Layer 3: Extension Layer (扩展层)**
- 职责: 可选的增强功能
- 依赖: Business Layer
- 被依赖: 无

**规则**: 高层可以依赖低层,低层**禁止**依赖高层

---

## 模块职责边界

### TestCase 模块

**✅ 职责范围**:
- 创建、编辑、删除测试用例
- 执行测试用例 (HTTP, Command, Workflow集成)
- 记录和查询测试结果
- 计算价值评分和Flaky检测
- 管理测试用例的生命周期钩子

**❌ 禁止职责**:
- 管理TestGroup的层级结构 (由TestGroup模块负责)
- 修改Workflow定义 (只能引用执行)
- 创建或修改Environment (只能读取变量)
- 管理用户权限 (由User模块负责)

**数据所有权**:
- **拥有**: `test_cases`, `test_results`, `test_runs`
- **只读**: `test_groups`, `workflows`, `environments`
- **禁止访问**: `tenants`, `projects`, `users`

---

### Workflow 模块

**✅ 职责范围**:
- 创建、编辑、删除工作流定义
- 解析DAG和步骤依赖
- 执行工作流并记录执行历史
- 管理步骤日志和变量变更
- 通过WebSocket推送实时日志

**❌ 禁止职责**:
- 修改TestCase定义 (只能调用执行)
- 创建或修改Environment (只能读取变量)
- 管理WebSocket连接 (由WebSocket Hub负责,Workflow只发送消息)

**数据所有权**:
- **拥有**: `workflows`, `workflow_runs`, `workflow_step_executions`, `workflow_step_logs`, `workflow_variable_changes`
- **只读**: `test_cases` (Mode 3调用), `environments`
- **禁止访问**: 其他模块的数据表

---

### Environment 模块

**✅ 职责范围**:
- 创建、编辑、删除环境
- 管理环境变量 (CRUD)
- 激活和停用环境 (一个项目同时只能有一个活跃)
- 提供变量查询接口给其他模块

**❌ 禁止职责**:
- 执行测试或工作流 (被动提供变量)
- 修改TestCase或Workflow定义
- 主动推送变量变更通知

**数据所有权**:
- **拥有**: `environments`, `environment_variables`
- **只读**: `projects` (验证归属)
- **禁止访问**: 其他模块的数据表

---

### Tenant 模块

**✅ 职责范围**:
- 创建、暂停、删除租户
- 创建、归档、删除项目
- 管理租户和项目成员
- 提供多租户中间件 (注入tenantId和projectId)
- 检查配额限制

**❌ 禁止职责**:
- 执行业务逻辑 (测试、工作流)
- 修改业务数据 (TestCase, Workflow)
- 管理用户认证 (由User模块负责)

**数据所有权**:
- **拥有**: `tenants`, `projects`, `tenant_members`, `project_members`
- **只读**: `users` (验证成员存在性)
- **禁止访问**: 业务数据表 (通过中间件隔离)

---

### TestGroup 模块

**✅ 职责范围**:
- 创建、编辑、删除测试分组
- 管理分组层级结构 (树形结构)
- 提供分组查询和树形遍历接口

**❌ 禁止职责**:
- 执行测试用例 (由TestCase模块负责)
- 修改TestCase的属性
- 管理测试结果

**数据所有权**:
- **拥有**: `test_groups`
- **只读**: `projects` (验证归属)
- **禁止访问**: `test_cases` (通过外键关联即可)

---

## 调用规则

### 允许的依赖调用

#### TestCase → Workflow (Mode 1)
```go
// ✅ 允许: TestCase引用Workflow执行
func (s *TestCaseService) Execute(testCase *TestCase) error {
    if testCase.WorkflowID != "" {
        return s.workflowService.Execute(testCase.WorkflowID)
    }
}
```

#### Workflow → TestCase (Mode 3)
```go
// ✅ 允许: Workflow步骤调用TestCase
func (a *TestCaseAction) Execute(ctx *ExecutionContext, step *Step) error {
    testCaseID := step.Config["testCaseId"]
    return a.testCaseService.Execute(testCaseID)
}
```

#### TestCase/Workflow → Environment
```go
// ✅ 允许: 读取活跃环境变量
func (s *TestCaseService) Execute(testCase *TestCase) error {
    env := s.environmentService.GetActiveEnvironment(testCase.ProjectID)
    variables := env.Variables
    // 使用变量
}
```

#### 所有模块 → Tenant (Middleware)
```go
// ✅ 允许: 通过中间件获取tenantId和projectId
func (h *TestCaseHandler) List(c *gin.Context) {
    tenantID := c.GetString("tenantId")
    projectID := c.GetString("projectId")
    cases := h.service.List(tenantID, projectID)
}
```

---

### 禁止的依赖调用

#### ❌ Environment → TestCase (反向依赖)
```go
// ❌ 禁止: Environment主动调用TestCase
func (s *EnvironmentService) Activate(envID string) error {
    // ❌ 错误: 不能主动触发测试执行
    s.testCaseService.ExecuteAll(envID)  // 禁止!
}
```

**正确做法**: TestCase在执行时主动读取活跃环境

#### ❌ TestCase → Tenant (跨层依赖)
```go
// ❌ 禁止: TestCase直接访问Tenant数据
func (s *TestCaseService) Create(testCase *TestCase) error {
    // ❌ 错误: 不能直接查询租户
    tenant := s.tenantRepo.Get(testCase.TenantID)  // 禁止!
}
```

**正确做法**: 通过中间件自动注入tenantId,TestCase只使用不验证

#### ❌ Workflow → Environment (修改)
```go
// ❌ 禁止: Workflow修改环境变量
func (e *WorkflowExecutor) Execute(workflow *Workflow) error {
    // ❌ 错误: 不能修改环境
    s.environmentService.SetVariable(envID, "key", "value")  // 禁止!
}
```

**正确做法**: Workflow只读取环境变量,不修改

#### ❌ 直接访问其他模块的Repository
```go
// ❌ 禁止: 跨模块直接访问Repository
func (s *TestCaseService) Execute(testCase *TestCase) error {
    // ❌ 错误: 应该调用WorkflowService,不是WorkflowRepo
    workflow := s.workflowRepo.Get(testCase.WorkflowID)  // 禁止!
}
```

**正确做法**: 通过Service接口调用
```go
// ✅ 正确
workflow := s.workflowService.Get(testCase.WorkflowID)
```

---

## 数据所有权

### 数据表归属

| 数据表 | 所属模块 | 允许写入 | 允许读取 | 禁止操作 |
|-------|---------|---------|---------|---------|
| `test_cases` | TestCase | TestCase | Workflow (Mode 3), Dashboard | Workflow修改 |
| `test_results` | TestCase | TestCase | Dashboard, TestRun | 其他模块修改 |
| `test_runs` | TestCase | TestCase | Dashboard | 其他模块修改 |
| `test_groups` | TestGroup | TestGroup | TestCase (读取groupId) | TestCase修改层级 |
| `workflows` | Workflow | Workflow | TestCase (Mode 1), Dashboard | TestCase修改定义 |
| `workflow_runs` | Workflow | Workflow | Dashboard | 其他模块修改 |
| `workflow_step_executions` | Workflow | Workflow | Dashboard | 其他模块修改 |
| `workflow_step_logs` | Workflow | Workflow | Dashboard | 其他模块修改 |
| `workflow_variable_changes` | Workflow | Workflow | Dashboard | 其他模块修改 |
| `environments` | Environment | Environment | TestCase, Workflow (只读变量) | 业务模块修改 |
| `environment_variables` | Environment | Environment | 同上 | 同上 |
| `tenants` | Tenant | Tenant | 中间件 (验证), Dashboard | 业务模块修改 |
| `projects` | Tenant | Tenant | 中间件 (验证), Dashboard | 业务模块修改 |
| `tenant_members` | Tenant | Tenant | User模块 | 业务模块修改 |
| `project_members` | Tenant | Tenant | User模块 | 业务模块修改 |

### 数据访问模式

**模式1: 拥有 (Own)**
- 可以CRUD全部操作
- 负责数据完整性和业务规则
- 例如: TestCase模块拥有test_cases表

**模式2: 只读引用 (Read-Only Reference)**
- 只能SELECT查询
- 通过Service接口获取数据
- 例如: TestCase读取Workflow定义

**模式3: 调用执行 (Execute)**
- 不直接访问数据
- 调用对方的Service执行业务逻辑
- 例如: TestCase调用Workflow.Execute()

**模式4: 禁止访问 (Forbidden)**
- 完全禁止访问
- 通过其他模块间接获取
- 例如: TestCase禁止访问tenants表

---

## 违规示例

### 示例1: 循环依赖

**❌ 错误代码**:
```go
// testcase_service.go
type TestCaseService struct {
    environmentService *EnvironmentService  // TestCase依赖Environment
}

// environment_service.go
type EnvironmentService struct {
    testCaseService *TestCaseService  // ❌ Environment又依赖TestCase,形成循环!
}
```

**✅ 正确做法**:
```go
// 单向依赖: TestCase → Environment
type TestCaseService struct {
    environmentService *EnvironmentService  // ✅ 单向依赖
}

// Environment不依赖TestCase
type EnvironmentService struct {
    // ✅ 不持有testCaseService
}
```

### 示例2: 跨模块直接访问Repository

**❌ 错误代码**:
```go
// testcase_service.go
func (s *TestCaseService) Execute(testCase *TestCase) error {
    // ❌ 直接访问WorkflowRepo,绕过了WorkflowService的业务逻辑!
    workflow := s.workflowRepo.Get(testCase.WorkflowID)
    // 直接执行workflow
}
```

**✅ 正确做法**:
```go
// testcase_service.go
func (s *TestCaseService) Execute(testCase *TestCase) error {
    // ✅ 通过WorkflowService调用,保证业务逻辑完整性
    return s.workflowService.Execute(testCase.WorkflowID)
}
```

### 示例3: 修改其他模块的数据

**❌ 错误代码**:
```go
// workflow_service.go
func (s *WorkflowService) Execute(workflowID string) error {
    // ❌ Workflow直接修改Environment数据!
    s.db.Model(&Environment{}).
        Where("env_id = ?", envID).
        Update("variables", newVars)  // 禁止!
}
```

**✅ 正确做法**:
```go
// workflow_service.go
func (s *WorkflowService) Execute(workflowID string) error {
    // ✅ 只读取环境变量,不修改
    env := s.environmentService.GetActiveEnvironment(projectID)
    variables := env.Variables  // 只读
    // 使用变量执行工作流
}
```

### 示例4: 绕过多租户隔离

**❌ 错误代码**:
```go
// testcase_repo.go
func (r *TestCaseRepo) List() ([]*TestCase, error) {
    // ❌ 没有按tenantId和projectId过滤,会返回所有租户的数据!
    var cases []*TestCase
    r.db.Find(&cases)
    return cases, nil
}
```

**✅ 正确做法**:
```go
// testcase_repo.go
func (r *TestCaseRepo) List(tenantID, projectID string) ([]*TestCase, error) {
    // ✅ 强制添加多租户过滤
    var cases []*TestCase
    r.db.Where("tenant_id = ? AND project_id = ?", tenantID, projectID).
        Find(&cases)
    return cases, nil
}
```

---

## 架构演进

### 当前状态 (v1.0)

**已实现模块**:
- ✅ TestCase - 完整实现
- ✅ Workflow - 完整实现
- ✅ Environment - 完整实现
- ✅ Tenant - 完整实现
- ✅ TestGroup - 基础实现

**计划中模块**:
- ⏳ ActionLibrary - 设计中
- ⏳ APICenter - 设计中
- ⏳ User (完整RBAC) - 部分实现

### 待解决的边界问题

#### 问题1: TestCase ⇄ Workflow 双向依赖

**现状**: TestCase和Workflow互相调用,存在潜在循环依赖风险

**解决方案**:
1. **限制调用深度**: 最多5层嵌套,防止无限递归
2. **调用栈检测**: 在ExecutionContext中记录调用栈
3. **未来重构**: 考虑引入统一的ExecutionEngine,TestCase和Workflow都作为Runnable接口实现

**实施时间**: v2.0 (2026-Q1)

#### 问题2: 缺少统一的权限检查层

**现状**: 每个Service自行实现权限检查,代码重复

**解决方案**:
1. 引入AuthorizationService统一权限检查
2. 使用装饰器模式在Service层自动注入权限验证
3. 定义统一的Permission接口

**实施时间**: v1.5 (2025-Q4)

### 模块拆分计划

#### 计划1: TestCase模块拆分

**背景**: TestCase模块职责过重 (执行 + 结果 + 价值评分)

**拆分方案**:
```
TestCase (当前) →
  ├─ TestCaseDefinition (测试定义管理)
  ├─ TestCaseExecution (测试执行引擎)
  ├─ TestCaseResult (结果和统计)
  └─ TestCaseAnalytics (价值评分和Flaky检测)
```

**优势**: 职责更清晰,便于独立扩展

**风险**: 增加模块间通信复杂度

**决策时间**: v2.0架构评审

#### 计划2: Workflow模块细化

**背景**: Workflow包含DAG调度、Action执行、日志推送等多种职责

**拆分方案**:
```
Workflow (当前) →
  ├─ WorkflowDefinition (工作流定义管理)
  ├─ WorkflowEngine (DAG调度引擎)
  ├─ WorkflowExecution (执行和状态追踪)
  └─ WorkflowLogging (日志和WebSocket推送)
```

**决策时间**: v2.5架构评审

---

## 相关文档

### 模块文档
- **TestCase**: [`../testcase/overview.md`](../testcase/overview.md)
- **Workflow**: [`../workflow/overview.md`](../workflow/overview.md)
- **Environment**: [`../environment/overview.md`](../environment/overview.md)
- **Tenant**: [`../tenant/overview.md`](../tenant/overview.md)

### 架构决策
- [统一工作流架构](../../6-decisions/2024-11-24-unified-workflow-architecture.md)
- [测试平台产品化架构](../../6-decisions/2024-11-26-test-platform-productization-architecture.md)
- [文档组织规范与代码结构](../../6-decisions/2025-11-26-documentation-organization-architecture.md)

### 开发指南
- [多租户集成指南](../../3-guides/development/multi-tenant-integration.md)
- [环境管理指南](../../3-guides/development/environment-management.md)

---

## 审查与维护

### Code Review检查清单

Code Reviewer应检查:
- [ ] 新代码是否违反模块边界 (参考"禁止的依赖调用")
- [ ] 是否直接访问其他模块的Repository
- [ ] 是否修改了非所属模块的数据表
- [ ] 是否正确使用多租户隔离 (tenantId + projectId)
- [ ] 是否引入了新的模块间依赖 (需在此文档中说明)

### 架构审查流程

**触发条件**: 引入新模块或修改模块依赖关系

**审查流程**:
1. 提交架构变更提案 (ADR文档)
2. 技术负责人审查
3. 团队讨论和投票
4. 更新module-boundaries.md文档
5. 实施变更

### 更新记录

| 日期 | 版本 | 变更说明 | 作者 |
|------|------|---------|------|
| 2025-11-26 | 1.0 | 初始版本,定义当前4个核心模块的边界 | 开发团队 |

---

**维护责任**: 技术负责人 + 全体开发人员
**审核周期**: 每季度审查一次,确保文档与实际代码一致
**反馈渠道**: 创建Issue或在团队会议上讨论

