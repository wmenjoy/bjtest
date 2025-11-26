# 统一术语表 (Glossary)

**版本**: 1.0
**最后更新**: 2025-11-26
**维护者**: 开发团队

---

## 使用规则

1. **代码中**: 必须使用英文标准术语
2. **文档中**: 中文优先使用标准译名
3. **UI中**: 统一使用标准译名
4. **禁止**: 使用同义词或自创术语

**违反规范**: 会导致代码审查不通过，文档需要修订

---

## 核心业务术语

### 测试用例管理

| 概念 | 英文术语 | 中文术语 | 说明 | ❌ 禁止使用 |
|------|---------|---------|------|-----------|
| 测试用例 | TestCase | 测试用例 | 单个测试的定义和执行单元 | Test, TestSuite, Case, TC |
| 测试分组 | TestGroup | 测试分组 | 测试用例的层级分组管理 | Folder, Category, Group, Dir |
| 测试结果 | TestResult | 测试结果 | 单次测试执行的结果 | Result, Outcome, ExecutionResult |
| 测试批次 | TestRun | 测试批次 | 批量测试执行的记录 | Batch, RunRecord, Execution |
| 断言 | Assertion | 断言 | 测试验证条件 | Assert, Check, Validation |
| 步骤 | Step | 步骤 | 测试用例中的单个操作 | Stage, Phase, Action |

---

### 工作流引擎

| 概念 | 英文术语 | 中文术语 | 说明 | ❌ 禁止使用 |
|------|---------|---------|------|-----------|
| 工作流 | Workflow | 工作流 | 多步骤的编排和调度 | Pipeline, Flow, Process, Chain |
| 工作流步骤 | Step / WorkflowStep | 工作流步骤 | 工作流中的单个步骤 | Task, Action, Node, Stage |
| 工作流运行 | WorkflowRun | 工作流运行 | 工作流的单次执行记录 | Execution, Instance, Run |
| 动作 | Action | 动作 | 可复用的操作单元 | Operation, Activity, Operator |
| DAG | DAG (Directed Acyclic Graph) | 有向无环图 | 工作流的执行依赖图 | Graph, Dependency, Flow |
| 变量 | Variable | 变量 | 工作流中的数据传递 | Var, Param, Data |

---

### 环境管理

| 概念 | 英文术语 | 中文术语 | 说明 | ❌ 禁止使用 |
|------|---------|---------|------|-----------|
| 环境 | Environment | 环境 | 运行环境配置(Dev/Staging/Prod) | Env, Config, Setting |
| 环境变量 | EnvironmentVariable | 环境变量 | 环境中的配置项 | EnvVar, ConfigVar, Setting |

---

### 多租户系统

| 概念 | 英文术语 | 中文术语 | 说明 | ❌ 禁止使用 |
|------|---------|---------|------|-----------|
| 租户 | Tenant | 租户 | 多租户系统的隔离单位 | Customer, Account, Org |
| 组织 | Organization | 组织 | 租户下的组织结构 | Org, Company, Team |
| 项目 | Project | 项目 | 组织下的项目 | Workspace, Space, Module |
| 用户 | User | 用户 | 系统使用者 | Member, Account, Person |
| 角色 | Role | 角色 | 权限分组 | Group, Permission, Authority |

---

## 技术架构术语

### DDD分层架构

| 概念 | 英文术语 | 中文术语 | 说明 | 代码路径 |
|------|---------|---------|------|---------|
| 领域层 | Domain Layer | 领域层 | 核心业务逻辑 | `backend/internal/domain/` |
| 应用层 | Application Layer | 应用层 | 用例编排 | `backend/internal/application/` |
| 基础设施层 | Infrastructure Layer | 基础设施层 | 技术实现 | `backend/internal/infrastructure/` |
| 接口层 | Interface Layer | 接口层 | API/WebSocket | `backend/internal/interfaces/` |
| 聚合根 | Aggregate Root | 聚合根 | 领域对象的根 | `*.go` (如 `case.go`) |
| 值对象 | Value Object | 值对象 | 不可变的值 | `types.go` |
| 仓储 | Repository | 仓储 | 数据访问接口 | `*_repo.go` |

---

### 前端架构术语

| 概念 | 英文术语 | 中文术语 | 说明 | 代码路径 |
|------|---------|---------|------|---------|
| 特性模块 | Feature Module | 特性模块 | 业务功能模块 | `front/src/features/` |
| 页面组件 | Page Component | 页面组件 | 路由级组件 | `features/*/pages/` |
| 业务组件 | Business Component | 业务组件 | 功能组件 | `features/*/components/` |
| UI组件 | UI Component | UI组件 | 纯展示组件 | `src/components/ui/` |
| Hook | Hook | Hook | 状态逻辑复用 | `features/*/hooks/` |

---

## 数据类型术语

| 概念 | 英文术语 | 中文术语 | 说明 | 示例 |
|------|---------|---------|------|------|
| 字符串 | String | 字符串 | 文本类型 | `"hello"` |
| 整数 | Integer | 整数 | 整数类型 | `42` |
| 布尔值 | Boolean | 布尔值 | 真假值 | `true`, `false` |
| 数组 | Array | 数组 | 列表 | `["a", "b"]` |
| 对象 | Object | 对象 | 键值对 | `{"key": "value"}` |
| UUID | UUID | 通用唯一标识符 | ID类型 | `550e8400-e29b-41d4-a716-446655440000` |
| 时间戳 | Timestamp | 时间戳 | 时间类型 | `2025-11-26T12:00:00Z` |

---

## HTTP相关术语

| 概念 | 英文术语 | 中文术语 | 说明 | ❌ 禁止使用 |
|------|---------|---------|------|-----------|
| 端点 | Endpoint | 端点 | API接口 | API, Interface, URL |
| 请求 | Request | 请求 | HTTP请求 | Req, Call |
| 响应 | Response | 响应 | HTTP响应 | Resp, Reply |
| 头部 | Header | 头部 | HTTP头 | Head |
| 载荷 | Payload | 载荷 | 请求/响应体 | Body, Data |
| 查询参数 | Query Parameter | 查询参数 | URL参数 | QueryString, Param |
| 路径参数 | Path Parameter | 路径参数 | URL路径变量 | PathVar, URLParam |

---

## 状态相关术语

### 测试状态

| 英文 | 中文 | 说明 | ❌ 禁止使用 |
|------|------|------|-----------|
| Pending | 待执行 | 测试尚未开始 | Waiting, Queued |
| Running | 执行中 | 测试正在执行 | InProgress, Executing |
| Passed | 通过 | 测试成功 | Success, OK |
| Failed | 失败 | 测试失败 | Error, Fail |
| Skipped | 跳过 | 测试被跳过 | Ignored, Bypassed |

### 工作流状态

| 英文 | 中文 | 说明 | ❌ 禁止使用 |
|------|------|------|-----------|
| Pending | 待执行 | 工作流等待中 | Waiting, Queued |
| Running | 执行中 | 工作流运行中 | InProgress, Executing |
| Succeeded | 成功 | 工作流成功完成 | Success, Completed |
| Failed | 失败 | 工作流失败 | Error, Aborted |
| Paused | 暂停 | 工作流暂停 | Suspended, Stopped |
| Cancelled | 已取消 | 工作流取消 | Aborted, Terminated |

---

## 优先级术语

| 英文 | 中文 | 说明 | 使用场景 |
|------|------|------|---------|
| P0 | 紧急/严重 | 必须立即处理 | Bug修复、核心功能 |
| P1 | 高优先级 | 尽快处理 | 重要功能、性能优化 |
| P2 | 中优先级 | 正常排期 | 常规功能、改进 |
| P3 | 低优先级 | 有时间再做 | 可选功能、优化 |

---

## 命名约定

### 文件命名

| 类型 | 规范 | 示例 | ❌ 错误示例 |
|------|------|------|-----------|
| Go文件 | snake_case | `testcase_repo.go` | `testCaseRepo.go` |
| Go测试 | *_test.go | `service_test.go` | `service.test.go` |
| React组件 | PascalCase | `TestCaseList.tsx` | `testCaseList.tsx` |
| React Hook | use + PascalCase | `useTestCase.ts` | `testCaseHook.ts` |
| Markdown | kebab-case | `test-guide.md` | `TestGuide.md` |
| JSON | kebab-case | `test-data.json` | `testData.json` |
| YAML | kebab-case | `deployment.yaml` | `Deployment.yaml` |

### 代码命名

| 类型 | Go规范 | TypeScript规范 |
|------|--------|---------------|
| 包名 | lowercase | lowercase |
| 类型/接口 | PascalCase | PascalCase |
| 函数/方法 | PascalCase (exported)<br>camelCase (private) | camelCase |
| 变量 | camelCase | camelCase |
| 常量 | SCREAMING_SNAKE_CASE | SCREAMING_SNAKE_CASE |

---

## 缩写规范

### 允许使用的缩写

| 缩写 | 完整术语 | 使用场景 |
|------|---------|---------|
| API | Application Programming Interface | 代码、文档、UI |
| HTTP | HyperText Transfer Protocol | 代码、文档 |
| ID | Identifier | 代码、文档、UI |
| UUID | Universally Unique Identifier | 代码、文档 |
| URL | Uniform Resource Locator | 代码、文档 |
| JSON | JavaScript Object Notation | 代码、文档 |
| YAML | YAML Ain't Markup Language | 代码、文档 |
| DAG | Directed Acyclic Graph | 代码、文档 |
| UI | User Interface | 代码、文档、UI |
| E2E | End-to-End | 测试相关 |

### ❌ 禁止使用的缩写

| ❌ 错误缩写 | ✅ 应使用 | 原因 |
|----------|---------|------|
| Env | Environment | 不够清晰 |
| Org | Organization | 容易混淆 |
| Repo | Repository | 代码中使用完整词 |
| Doc | Document | 代码中使用完整词 |
| Impl | Implementation | 代码中使用完整词 |
| Mgr | Manager | 代码中使用完整词 |

---

## 术语使用示例

### ✅ 正确示例

**代码**:
```go
type TestCase struct {
    ID   string
    Name string
}

func (s *TestCaseService) Execute(testCase *TestCase) (*TestResult, error) {
    // ...
}
```

**文档**:
```markdown
测试用例(TestCase)由测试分组(TestGroup)管理，执行后生成测试结果(TestResult)。
```

**UI**:
```
测试用例列表 | 创建测试用例 | 执行测试
```

---

### ❌ 错误示例

**代码**:
```go
type Test struct {  // ❌ 应使用 TestCase
    ID   string
    Name string
}

func (s *TestSvc) Run(tc *Test) (*Result, error) {  // ❌ Svc/tc/Result
    // ...
}
```

**文档**:
```markdown
Test由Folder管理，运行后生成Result。  // ❌ 应使用标准术语
```

**UI**:
```
测试列表 | 新建Test | 运行  // ❌ 中英文混用、术语不统一
```

---

## 术语演进历史

| 时间 | 变更 | 原因 |
|------|------|------|
| 2025-11-26 | 创建统一术语表 | 建立文档组织规范 |

---

## 相关文档

- **模块边界定义**: [architecture/module-boundaries.md](architecture/module-boundaries.md)
- **代码规范**: [../3-guides/development/coding-standards.md](../3-guides/development/coding-standards.md)
- **命名规范**: [../6-decisions/2025-11-26-documentation-organization-architecture.md](../6-decisions/2025-11-26-documentation-organization-architecture.md#命名规范)

---

## 术语表维护

### 何时更新

1. **引入新概念** - 添加新的业务模块时
2. **术语冲突** - 发现同义词混用时
3. **重构重命名** - 代码重构后统一更新
4. **团队反馈** - 团队讨论后达成共识

### 更新流程

1. 在团队会议上讨论新术语
2. 达成共识后更新本文档
3. 更新相关代码和文档中的术语
4. Code Review时检查术语使用

### 术语冲突解决

如果发现现有代码使用了禁止术语:
1. 创建Issue记录
2. 逐步重构(不强制一次性改完)
3. 新代码严格遵循规范
4. Code Review拦截新增违规

---

**维护责任**: 全体开发人员
**审核人**: 技术负责人
**最后审核**: 2025-11-26
