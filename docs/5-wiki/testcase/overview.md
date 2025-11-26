# TestCase - 测试用例模块概览

**版本**: 1.0
**最后更新**: 2025-11-26
**维护者**: 开发团队

---

## 目录

1. [模块简介](#模块简介)
2. [核心概念](#核心概念)
3. [代码路径](#代码路径)
4. [数据模型](#数据模型)
5. [核心流程](#核心流程)
6. [API接口](#api接口)
7. [与其他模块的关系](#与其他模块的关系)
8. [常见问题](#常见问题)

---

## 模块简介

测试用例模块负责测试用例的创建、管理、执行和结果追踪。支持多种测试类型（HTTP、命令行、工作流集成）和智能化价值评估。

### 主要功能

- **测试用例管理**: 创建、编辑、删除测试用例,支持分组管理
- **多类型支持**: HTTP API测试、命令行测试、数据库测试、E2E测试等9种测试类型
- **工作流集成**: 3种模式集成Workflow引擎,支持复杂测试场景
- **价值评估**: 自动计算覆盖分数、稳定性、效率和维护成本
- **执行追踪**: 完整记录执行历史、成功率、平均耗时
- **Flaky检测**: 自动识别不稳定的测试用例

### 适用场景

- **API测试**: 验证RESTful API的请求/响应、状态码、断言
- **回归测试**: 批量执行测试用例,验证系统功能稳定性
- **性能测试**: 配置性能指标,监控响应时间和吞吐量
- **集成测试**: 通过Workflow编排多步骤测试流程
- **持续集成**: 集成到CI/CD流水线,自动化测试执行

---

## 核心概念

### 概念1: TestCase (测试用例)

**定义**: 单个测试的定义和执行单元,包含测试配置、步骤、断言和生命周期钩子。

**属性**:
- `testId` (String) - 全局唯一标识符
- `name` (String) - 测试用例名称
- `type` (String) - 测试类型: http, command, workflow, database, e2e等
- `priority` (String) - 优先级: P0(紧急), P1(高), P2(中), P3(低)
- `status` (String) - 状态: active(活跃), inactive(停用)
- `objective` (String) - 测试目标描述
- `timeout` (Integer) - 超时时间(秒),默认300

**示例**:
```json
{
  "testId": "test-001",
  "name": "用户登录API测试",
  "type": "http",
  "priority": "P0",
  "status": "active",
  "objective": "验证用户登录接口的正常流程和异常处理",
  "timeout": 30,
  "http": {
    "method": "POST",
    "url": "/api/v1/auth/login",
    "headers": {
      "Content-Type": "application/json"
    },
    "body": {
      "username": "testuser",
      "password": "password123"
    }
  },
  "assertions": [
    {
      "target": "response.status",
      "operator": "==",
      "expected": 200
    },
    {
      "target": "response.body.token",
      "operator": "exists",
      "expected": true
    }
  ]
}
```

### 概念2: TestResult (测试结果)

**定义**: 单次测试执行的结果记录,包含状态、耗时、失败原因、日志等。

**属性**:
- `testId` (String) - 关联的测试用例ID
- `runId` (String) - 关联的批次执行ID (可选)
- `status` (String) - 执行状态: passed(通过), failed(失败), error(错误), skipped(跳过)
- `startTime` (Timestamp) - 开始时间
- `endTime` (Timestamp) - 结束时间
- `duration` (Integer) - 执行耗时(毫秒)
- `error` (String) - 错误信息
- `failures` (Array) - 断言失败列表
- `logs` (Array) - 执行日志
- `artifacts` (Array) - 产出文件(截图、报告等)

**示例**:
```json
{
  "testId": "test-001",
  "status": "failed",
  "startTime": "2025-11-26T10:00:00Z",
  "endTime": "2025-11-26T10:00:05Z",
  "duration": 5000,
  "failures": [
    {
      "target": "response.body.token",
      "expected": "exists",
      "actual": "undefined",
      "message": "Expected token to exist but got undefined"
    }
  ],
  "logs": [
    "[10:00:00] Sending POST request to /api/v1/auth/login",
    "[10:00:05] Response status: 401 Unauthorized",
    "[10:00:05] Assertion failed: response.body.token exists"
  ]
}
```

### 概念3: TestRun (测试批次)

**定义**: 批量测试执行的记录,聚合多个测试结果的统计信息。

**属性**:
- `runId` (String) - 批次执行唯一ID
- `name` (String) - 批次名称
- `total` (Integer) - 总测试数
- `passed` (Integer) - 通过数
- `failed` (Integer) - 失败数
- `errors` (Integer) - 错误数
- `skipped` (Integer) - 跳过数
- `status` (String) - 批次状态: running(执行中), completed(完成), cancelled(取消)

### 概念4: Workflow集成模式

**定义**: TestCase与Workflow模块的3种集成方式。

**Mode 1: 引用独立工作流**
```json
{
  "testId": "test-002",
  "type": "workflow",
  "workflowId": "wf-login-flow"  // 引用已存在的工作流
}
```

**Mode 2: 嵌入工作流定义**
```json
{
  "testId": "test-003",
  "type": "workflow",
  "workflowDef": {
    "steps": [
      { "id": "s1", "type": "http", "config": {...} },
      { "id": "s2", "type": "assert", "config": {...} }
    ]
  }
}
```

**Mode 3: Workflow步骤引用TestCase**
```json
{
  "workflowId": "wf-regression",
  "steps": [
    { "id": "s1", "type": "test-case", "testCaseId": "test-001" },
    { "id": "s2", "type": "test-case", "testCaseId": "test-002" }
  ]
}
```

### 概念5: 价值评分 (Value Scoring)

**定义**: 自动评估测试用例质量的4维度评分体系。

**评分维度**:
- **覆盖分数 (CoverageScore)**: 测试覆盖的功能范围,0-100分
- **稳定性 (StabilityScore)**: 基于成功率,稳定的测试得高分,0-100分
- **执行效率 (EfficiencyScore)**: 基于平均耗时,快速的测试得高分,0-100分
- **维护成本 (MaintainabilityScore)**: 基于修改频率和复杂度,0-100分
- **综合评分 (OverallScore)**: 4个维度的加权平均,0-100分

**使用场景**: 识别高价值测试用例、淘汰低价值用例、优化测试集

---

## 代码路径

### 后端代码

| 分层 | 路径 | 职责 |
|------|------|------|
| **模型层** | `nextest-platform/internal/models/test_case.go` | GORM数据模型定义 |
| **仓储层** | `nextest-platform/internal/repository/testcase_repo.go` | 数据访问接口 |
| **服务层** | `nextest-platform/internal/service/testcase_service.go` | 业务逻辑和执行编排 |
| **处理层** | `nextest-platform/internal/handler/testcase_handler.go` | HTTP API处理器 |
| **执行引擎** | `nextest-platform/internal/testcase/executor.go` | 测试执行引擎 |
| **执行器** | `nextest-platform/internal/testcase/http_executor.go` | HTTP测试执行器 |
| **执行器** | `nextest-platform/internal/testcase/command_executor.go` | 命令行测试执行器 |

**关键文件**:
- `models/test_case.go` - TestCase, TestResult, TestRun模型
- `service/testcase_service.go` - 测试执行、结果聚合、价值评分
- `testcase/executor.go` - 多类型测试执行引擎
- `handler/testcase_handler.go` - `/api/v2/tests` 端点处理

---

### 前端代码

| 分层 | 路径 | 职责 |
|------|------|------|
| **页面组件** | `NextTestPlatformUI/components/TestCaseManager.tsx` | 测试用例管理主页 |
| **页面组件** | `NextTestPlatformUI/components/TestRunner.tsx` | 测试执行界面 |
| **页面组件** | `NextTestPlatformUI/components/TestHistory.tsx` | 执行历史查看 |
| **UI组件** | `NextTestPlatformUI/components/testcase/` | 测试用例相关组件 |

**关键文件**:
- `TestCaseManager.tsx` - 列表、创建、编辑测试用例
- `TestRunner.tsx` - 实时执行和结果展示
- `TestHistory.tsx` - 历史记录和趋势分析

---

## 数据模型

### 核心实体

#### TestCase (测试用例)

**数据库表**: `test_cases`

**字段说明**:

| 字段 | 类型 | 说明 | 是否必填 |
|------|------|------|---------|
| id | uint | 自增主键 | ✅ |
| test_id | string | 全局唯一TestID (UUID) | ✅ |
| tenant_id | string | 租户ID (多租户隔离) | ❌ |
| project_id | string | 项目ID (项目级隔离) | ❌ |
| group_id | string | 测试分组ID | ✅ |
| name | string | 测试用例名称 | ✅ |
| type | string | 测试类型 (http, command, workflow等) | ✅ |
| priority | string | 优先级 (P0/P1/P2/P3) | ❌ |
| status | string | 状态 (active/inactive) | ✅ |
| objective | text | 测试目标描述 | ❌ |
| timeout | int | 超时时间(秒), 默认300 | ❌ |
| workflow_id | string | 引用的工作流ID (Mode 1) | ❌ |
| workflow_def | jsonb | 嵌入的工作流定义 (Mode 2) | ❌ |
| http_config | jsonb | HTTP测试配置 | ❌ |
| command_config | jsonb | 命令行测试配置 | ❌ |
| assertions | jsonb | 断言列表 | ❌ |
| tags | jsonb | 标签数组 | ❌ |
| setup_hooks | jsonb | 前置钩子 | ❌ |
| teardown_hooks | jsonb | 后置钩子 | ❌ |
| coverage_score | int | 覆盖分数 (0-100) | ❌ |
| stability_score | int | 稳定性分数 (0-100) | ❌ |
| efficiency_score | int | 效率分数 (0-100) | ❌ |
| maintainability_score | int | 维护成本分数 (0-100) | ❌ |
| overall_score | int | 综合评分 (0-100) | ❌ |
| execution_count | int | 执行次数统计 | ❌ |
| success_count | int | 成功次数统计 | ❌ |
| failure_count | int | 失败次数统计 | ❌ |
| avg_duration | int | 平均耗时(毫秒) | ❌ |
| success_rate | int | 成功率 (0-100) | ❌ |
| last_run_at | timestamp | 最后执行时间 | ❌ |
| is_flaky | bool | 是否为不稳定测试 | ❌ |
| flaky_score | int | 不稳定分数 (0-100) | ❌ |
| owner_id | string | 负责人ID | ❌ |
| created_at | timestamp | 创建时间 | ✅ |
| updated_at | timestamp | 更新时间 | ✅ |
| deleted_at | timestamp | 软删除时间 | ❌ |

**完整Schema**: 详见 [`docs/1-specs/database/schema.md#test_cases`](../../1-specs/database/schema.md)

#### TestResult (测试结果)

**数据库表**: `test_results`

**关键字段**:
- `test_id`: 关联测试用例
- `run_id`: 关联批次执行 (可选)
- `status`: passed/failed/error/skipped
- `duration`: 执行耗时(毫秒)
- `failures`: 失败断言列表(JSON)
- `logs`: 执行日志(JSON)

#### TestRun (测试批次)

**数据库表**: `test_runs`

**关键字段**:
- `run_id`: 批次唯一ID
- `total/passed/failed/errors/skipped`: 统计计数
- `status`: running/completed/cancelled

---

## 核心流程

### 流程1: 创建测试用例

**触发条件**: 用户在TestCaseManager页面点击"新建测试用例"

**流程步骤**:
```
1. 用户操作 → 前端打开TestCaseEditor Modal
2. 填写表单 → 选择测试类型 → 配置参数 → 添加断言
3. 提交表单 → POST /api/v2/tests
4. 后端Handler接收请求
   4.1 验证必填字段 (name, type, groupId)
   4.2 生成唯一TestID (UUID)
   4.3 调用Service.CreateTestCase()
   4.4 Repository保存到数据库
   4.5 初始化价值评分字段为0
5. 返回201 Created + TestCase对象
6. 前端刷新测试用例列表
```

**涉及组件**:
- 前端: `TestCaseManager.tsx`, `TestCaseEditor.tsx`
- 后端: `testcase_handler.go:CreateTestCase()`
- 数据库: `test_cases`

### 流程2: 执行测试用例

**触发条件**: 用户点击测试用例的"Run"按钮

**流程步骤**:
```
1. 用户点击Run → POST /api/v2/tests/:id/execute
2. 后端Handler接收执行请求
   2.1 从数据库加载TestCase
   2.2 调用Service.ExecuteTestCase()
   2.3 根据type路由到不同执行器
       - type=http → http_executor.Execute()
       - type=command → command_executor.Execute()
       - type=workflow → workflow集成执行
3. 执行前置钩子 (setupHooks)
4. 执行测试主体逻辑
   4.1 发送HTTP请求 / 执行命令 / 运行工作流
   4.2 收集响应数据
   4.3 执行断言验证
5. 执行后置钩子 (teardownHooks)
6. 创建TestResult记录
   6.1 计算duration
   6.2 设置status (passed/failed/error)
   6.3 记录failures/logs
   6.4 保存到test_results表
7. 更新TestCase统计字段
   7.1 incrementExecutionCount
   7.2 updateSuccessRate
   7.3 updateAvgDuration
   7.4 detectFlaky (连续失败3次标记为flaky)
   7.5 recalculateValueScores
8. 返回TestResult给前端
9. 前端TestRunner实时展示执行进度和结果
```

**涉及组件**:
- 前端: `TestRunner.tsx`, `TestHistory.tsx`
- 后端: `testcase_service.go:ExecuteTestCase()`, `executor.go`, `http_executor.go`
- 数据库: `test_cases`, `test_results`

### 流程3: 批量执行测试组

**触发条件**: 用户点击测试组的"Run All"按钮

**流程步骤**:
```
1. POST /api/v2/groups/:id/execute
2. 创建TestRun记录 (status=running)
3. 查询该组下所有active状态的TestCase
4. 并行/串行执行所有测试用例
5. 每个用例执行完成后:
   - 更新TestRun统计 (passed++/failed++)
   - 创建TestResult关联runId
6. 全部执行完成:
   - 设置TestRun.status = completed
   - 计算总耗时
7. 返回TestRun聚合结果
```

**涉及组件**:
- 后端: `testcase_service.go:ExecuteTestGroup()`
- 数据库: `test_cases`, `test_results`, `test_runs`

---

## API接口

### 核心端点

#### 创建测试用例

```http
POST /api/v2/tests
Content-Type: application/json

{
  "groupId": "group-001",
  "name": "用户注册API测试",
  "type": "http",
  "priority": "P1",
  "objective": "验证用户注册流程",
  "http": {
    "method": "POST",
    "url": "/api/v1/users/register",
    "body": {
      "username": "newuser",
      "email": "newuser@example.com"
    }
  },
  "assertions": [
    {
      "target": "response.status",
      "operator": "==",
      "expected": 201
    }
  ],
  "tags": ["smoke", "registration"]
}
```

**响应**:
```json
{
  "testId": "test-uuid-123",
  "groupId": "group-001",
  "name": "用户注册API测试",
  "type": "http",
  "status": "active",
  "createdAt": "2025-11-26T10:00:00Z"
}
```

#### 获取测试用例列表

```http
GET /api/v2/tests?page=1&size=20&priority=P0&type=http
```

**响应**:
```json
{
  "data": [
    {
      "testId": "test-001",
      "name": "登录API测试",
      "type": "http",
      "priority": "P0",
      "successRate": 95,
      "lastRunAt": "2025-11-26T09:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "size": 20,
    "total": 150
  }
}
```

#### 执行测试用例

```http
POST /api/v2/tests/:testId/execute
```

**响应**:
```json
{
  "testId": "test-001",
  "status": "passed",
  "duration": 1250,
  "startTime": "2025-11-26T10:05:00Z",
  "endTime": "2025-11-26T10:05:01Z"
}
```

#### 获取测试历史

```http
GET /api/v2/tests/:testId/results?limit=10
```

#### 获取批次执行结果

```http
GET /api/v2/runs/:runId
```

**详细API文档**: [`docs/1-specs/api/v2-documentation.md#testcase-api`](../../1-specs/api/v2-documentation.md)

---

## 与其他模块的关系

### 依赖关系

**本模块依赖**:
- **TestGroup模块** - 测试用例必须属于某个测试分组,通过groupId关联
- **Workflow模块** - Mode 1和Mode 3集成模式需要引用Workflow (可选)
- **Environment模块** - 执行时读取活跃环境的变量配置 (可选)
- **Tenant模块** - 多租户隔离,通过tenantId和projectId过滤数据 (可选)

**本模块被依赖**:
- **Dashboard模块** - 读取TestResult数据生成统计图表
- **Workflow模块** - Mode 3中Workflow步骤可以引用TestCase
- **CI/CD集成** - 外部系统调用API执行测试并获取结果

### 边界规则

**✅ 允许的调用**:
- TestCase可以调用 `Workflow.Execute(workflowId)` 执行工作流 (Mode 1)
- TestCase可以读取 `Environment.GetActiveVariables()` 获取环境变量
- TestCase可以查询 `TestGroup.GetByID(groupId)` 验证分组存在性

**❌ 禁止的调用**:
- TestCase **不能**直接修改Workflow定义 (只能引用执行)
- TestCase **不能**跨租户/项目访问其他TestCase的数据
- TestCase **不能**绕过Service层直接操作数据库

**调用流向**:
```
TestCase → Workflow (执行工作流)
TestCase → Environment (读取变量)
TestCase → TestGroup (验证分组)
Workflow → TestCase (Mode 3: 调用测试用例)
Dashboard → TestCase (读取统计数据)
```

**详细边界定义**: [`docs/5-wiki/architecture/module-boundaries.md`](../architecture/module-boundaries.md)

---

## 相关文档

### 技术规范
- **数据库设计**: [`1-specs/database/schema.md#test_cases`](../../1-specs/database/schema.md)
- **API文档**: [`1-specs/api/v2-documentation.md#testcase-api`](../../1-specs/api/v2-documentation.md)

### 决策记录
- [TestCase工作流设计决策](../../6-decisions/2024-11-20-testcase-workflow-design-feature.md)
- [TestCase重新设计决策](../../6-decisions/2024-11-21-testcase-redesign-feature.md)
- [TestCase步骤设计决策](../../6-decisions/2024-11-22-testcase-step-design-feature.md)
- [TestCase作为Workflow视图](../../6-decisions/2024-11-23-testcase-as-workflow-view-feature.md)

### 业务知识
- [自测组织方案](../testcase/self-test-organization.md)
- [Workflow集成方案](../workflow/testcase-integration.md)

### 开发指南
- [自测指南](../../3-guides/testing/self-test-guide.md)
- [环境管理指南](../../3-guides/development/environment-management.md)

---

## 常见问题

### Q1: 如何选择测试类型？

**A**: 根据测试目标选择合适的类型:
- **http**: 测试RESTful API接口
- **command**: 测试命令行工具或脚本
- **workflow**: 需要多步骤编排的复杂场景
- **database**: 直接查询数据库验证数据
- **e2e**: 端到端业务流程测试

**示例代码**:
```json
{
  "type": "http",
  "http": {
    "method": "GET",
    "url": "/api/v1/users/{{userId}}"
  }
}
```

### Q2: Workflow集成的3种模式如何选择？

**A**:
- **Mode 1** (引用): 工作流可被多个TestCase复用 → 使用`workflowId`
- **Mode 2** (嵌入): 工作流仅用于单个TestCase → 使用`workflowDef`
- **Mode 3** (反向): Workflow步骤需要调用TestCase → 在Workflow中配置`type: test-case`

**推荐**: 大多数场景使用Mode 1,减少重复定义

### Q3: 价值评分如何计算？

**A**:
```go
// 稳定性分数 = 成功率
stabilityScore = testCase.SuccessRate

// 效率分数 = 100 - (avgDuration / 10000 * 100)
// 假设10秒以上为低效
efficiencyScore = max(0, 100 - testCase.AvgDuration/10000*100)

// 覆盖分数 = 根据assertions数量和complexity计算
coverageScore = min(100, len(assertions) * 20)

// 维护成本 = 100 - (最近修改频率 * 权重)
maintainabilityScore = calculateByModificationFrequency()

// 综合评分 = 加权平均
overallScore = (stability*0.3 + coverage*0.3 + efficiency*0.2 + maintainability*0.2)
```

### Q4: 如何实现Flaky测试检测？

**A**: 系统自动检测以下模式:
1. **连续失败**: 连续失败3次 → `isFlaky=true`
2. **间歇性失败**: 成功率在30%-70% → `flakyScore`高
3. **超时波动**: 执行时间方差大 → 提示优化

**处理建议**: 对Flaky测试进行重构或禁用

### Q5: 如何扩展新的测试类型？

**A**:
1. 在`models/test_case.go`中添加新的配置字段 (例如`GRPCConfig`)
2. 在`testcase/executor.go`中添加路由逻辑
3. 实现新的执行器 `testcase/grpc_executor.go`
4. 更新API文档和Wiki

**示例**:
```go
// executor.go
func (e *Executor) Execute(ctx context.Context, testCase *models.TestCase) (*Result, error) {
    switch testCase.Type {
    case "http":
        return e.executeHTTP(ctx, testCase)
    case "grpc":  // 新增类型
        return e.executeGRPC(ctx, testCase)
    }
}
```

---

## 术语表

| 术语 | 说明 |
|------|------|
| TestCase | 测试用例,单个测试的定义和执行单元 |
| TestResult | 测试结果,单次执行的结果记录 |
| TestRun | 测试批次,批量执行的聚合记录 |
| Assertion | 断言,验证条件的定义 |
| Flaky Test | 不稳定测试,执行结果不一致的测试 |
| Value Scoring | 价值评分,测试用例质量评估体系 |
| Setup Hook | 前置钩子,测试执行前的准备操作 |
| Teardown Hook | 后置钩子,测试执行后的清理操作 |

**完整术语表**: [`docs/5-wiki/glossary.md`](../glossary.md)

---

## 更新历史

| 日期 | 版本 | 变更说明 | 作者 |
|------|------|---------|------|
| 2025-11-26 | 1.0 | 初始版本,基于现有代码和决策记录创建 | 开发团队 |

---

**维护提示**:
- 当添加新测试类型时,更新"核心概念"和"常见问题"部分
- 当修改价值评分算法时,更新"概念5"和FAQ Q3
- 当修改API端点时,同步更新API文档 [`1-specs/api/v2-documentation.md`](../../1-specs/api/v2-documentation.md)
- 当添加新的Workflow集成模式时,更新"概念4"并创建新的决策记录
