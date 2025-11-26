# Workflow - 工作流引擎模块概览

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

工作流引擎模块负责多步骤任务的编排、调度和执行。基于DAG(有向无环图)实现步骤依赖管理和并行执行,支持变量传递、实时日志和状态追踪。

### 主要功能

- **工作流定义**: 使用JSON/YAML定义多步骤执行流程
- **DAG调度**: 自动解析步骤依赖关系,并行执行独立步骤
- **变量系统**: 支持步骤间数据传递和变量插值 `{{varName}}`
- **实时执行**: 通过WebSocket推送步骤状态和日志
- **多种Action**: HTTP请求、命令执行、TestCase调用等
- **错误处理**: 支持重试机制和错误处理策略(abort/continue)

### 适用场景

- **复杂测试场景**: 编排多步骤的集成测试流程
- **CI/CD流水线**: 构建、测试、部署的自动化编排
- **数据处理**: 多步骤数据ETL处理
- **定时任务**: 定期执行的批处理任务
- **业务流程**: 跨系统的业务流程自动化

---

## 核心概念

### 概念1: Workflow (工作流)

**定义**: 多步骤任务的定义,包含步骤列表、依赖关系、变量定义和执行配置。

**属性**:
- `workflowId` (String) - 全局唯一标识符
- `name` (String) - 工作流名称
- `version` (String) - 版本号
- `description` (String) - 描述信息
- `definition` (JSONB) - 工作流定义(步骤、变量、配置)
- `isTestCase` (Boolean) - 是否被TestCase引用

**定义结构**:
```json
{
  "workflowId": "wf-user-registration",
  "name": "用户注册完整流程",
  "version": "1.0.0",
  "definition": {
    "variables": {
      "baseUrl": "https://api.example.com",
      "userId": ""
    },
    "steps": [
      {
        "id": "step-1",
        "name": "创建用户",
        "type": "http",
        "dependsOn": [],
        "config": {
          "method": "POST",
          "url": "{{baseUrl}}/users",
          "body": {
            "username": "testuser",
            "email": "test@example.com"
          }
        },
        "outputs": {
          "response.body.id": "userId"
        }
      },
      {
        "id": "step-2",
        "name": "发送欢迎邮件",
        "type": "http",
        "dependsOn": ["step-1"],
        "config": {
          "method": "POST",
          "url": "{{baseUrl}}/emails/send",
          "body": {
            "to": "test@example.com",
            "userId": "{{userId}}"
          }
        }
      }
    ],
    "onError": {
      "strategy": "abort",
      "maxRetries": 3
    }
  }
}
```

### 概念2: WorkflowRun (工作流执行)

**定义**: 单次工作流执行的记录,包含执行状态、上下文变量、时间统计。

**属性**:
- `runId` (String) - 执行唯一ID
- `workflowId` (String) - 关联的工作流ID
- `status` (String) - 执行状态: running(执行中), success(成功), failed(失败), cancelled(取消)
- `startTime` (Timestamp) - 开始时间
- `endTime` (Timestamp) - 结束时间
- `duration` (Integer) - 总耗时(毫秒)
- `context` (JSONB) - 执行上下文(所有变量值)
- `error` (String) - 错误信息

**示例**:
```json
{
  "runId": "run-abc123",
  "workflowId": "wf-user-registration",
  "status": "success",
  "startTime": "2025-11-26T10:00:00Z",
  "endTime": "2025-11-26T10:00:15Z",
  "duration": 15000,
  "context": {
    "baseUrl": "https://api.example.com",
    "userId": "user-xyz789",
    "emailSent": true
  }
}
```

### 概念3: WorkflowStepExecution (步骤执行)

**定义**: 工作流中单个步骤的执行记录,用于实时追踪和调试。

**属性**:
- `runId` (String) - 关联的执行ID
- `stepId` (String) - 步骤ID
- `stepName` (String) - 步骤名称
- `status` (String) - 状态: pending(待执行), running(执行中), success(成功), failed(失败), skipped(跳过)
- `inputData` (JSONB) - 输入数据快照
- `outputData` (JSONB) - 输出数据快照
- `duration` (Integer) - 步骤耗时(毫秒)

### 概念4: DAG (有向无环图)

**定义**: 工作流步骤的依赖关系图,用于确定执行顺序和并行度。

**特性**:
- **依赖声明**: 通过`dependsOn`数组声明步骤依赖
- **层级划分**: 自动计算步骤层级,同层步骤可并行执行
- **环检测**: 启动前检测循环依赖,防止死锁

**DAG示例**:
```
步骤依赖关系:
step-1: [] (无依赖,第0层)
step-2: [step-1] (依赖step-1,第1层)
step-3: [step-1] (依赖step-1,第1层)
step-4: [step-2, step-3] (依赖step-2和step-3,第2层)

执行顺序:
Layer 0: step-1 (单独执行)
Layer 1: step-2, step-3 (并行执行)
Layer 2: step-4 (等待Layer 1完成后执行)
```

### 概念5: 变量系统

**定义**: 支持步骤间数据传递和动态配置的变量管理机制。

**变量来源**:
1. **初始变量**: 在`variables`字段定义的默认值
2. **环境变量**: 从活跃Environment模块读取
3. **步骤输出**: 通过`outputs`映射将响应数据保存到变量
4. **运行时传入**: 执行时通过API传入覆盖默认值

**变量插值语法**: `{{variableName}}`

**示例**:
```json
{
  "variables": {
    "baseUrl": "{{env.API_BASE_URL}}",  // 从环境变量读取
    "userId": ""
  },
  "steps": [
    {
      "id": "step-1",
      "config": {
        "url": "{{baseUrl}}/users"  // 插值使用
      },
      "outputs": {
        "response.body.id": "userId"  // 将响应的id字段存入userId变量
      }
    },
    {
      "id": "step-2",
      "config": {
        "url": "{{baseUrl}}/users/{{userId}}/profile"  // 使用上一步的输出
      }
    }
  ]
}
```

### 概念6: Action类型

**定义**: 工作流步骤支持的操作类型。

**内置Action**:
- **http**: 发送HTTP请求 (GET/POST/PUT/DELETE等)
- **command**: 执行命令行命令
- **test-case**: 调用TestCase模块执行测试 (Mode 3集成)
- **wait**: 等待指定时间
- **script**: 执行JavaScript/Python脚本 (未来支持)

**自定义Action**: 可扩展新的Action类型

---

## 代码路径

### 后端代码

| 分层 | 路径 | 职责 |
|------|------|------|
| **模型层** | `nextest-platform/internal/models/workflow.go` | GORM数据模型定义 |
| **仓储层** | `nextest-platform/internal/repository/workflow_repo.go` | 数据访问接口 |
| **服务层** | `nextest-platform/internal/service/workflow_service.go` | 业务逻辑和执行编排 |
| **处理层** | `nextest-platform/internal/handler/workflow_handler.go` | HTTP API处理器 |
| **执行引擎** | `nextest-platform/internal/workflow/executor.go` | 工作流执行引擎 |
| **DAG解析** | `nextest-platform/internal/workflow/dag.go` | 依赖关系解析 |
| **Action实现** | `nextest-platform/internal/workflow/actions/` | 各种Action执行器 |
| **日志广播** | `nextest-platform/internal/workflow/broadcast_logger.go` | WebSocket日志推送 |
| **WebSocket Hub** | `nextest-platform/internal/websocket/hub.go` | WebSocket连接管理 |

**关键文件**:
- `models/workflow.go` - Workflow, WorkflowRun, WorkflowStepExecution等模型
- `workflow/executor.go` - 核心执行引擎,DAG调度,变量管理
- `workflow/actions/http_action.go` - HTTP请求Action实现
- `workflow/actions/command_action.go` - 命令执行Action实现
- `workflow/actions/testcase_action.go` - TestCase调用Action实现
- `workflow/broadcast_logger.go` - 三重输出日志(DB + WebSocket + Console)
- `handler/workflow_handler.go` - `/api/v2/workflows` 端点处理

---

### 前端代码

| 分层 | 路径 | 职责 |
|------|------|------|
| **页面组件** | `NextTestPlatformUI/components/ScriptLab.tsx` | 工作流管理主页 |
| **页面组件** | `NextTestPlatformUI/components/WorkflowRunner.tsx` | 工作流执行界面 (如存在) |
| **UI组件** | `NextTestPlatformUI/components/workflow/` | 工作流相关组件 |

**关键文件**:
- `ScriptLab.tsx` - 工作流列表、创建、编辑、执行
- WebSocket客户端集成 - 实时接收步骤状态和日志

---

## 数据模型

### 核心实体

#### Workflow (工作流)

**数据库表**: `workflows`

**字段说明**:

| 字段 | 类型 | 说明 | 是否必填 |
|------|------|------|---------|
| id | uint | 自增主键 | ✅ |
| workflow_id | string | 全局唯一WorkflowID (UUID) | ✅ |
| tenant_id | string | 租户ID (多租户隔离) | ❌ |
| project_id | string | 项目ID (项目级隔离) | ❌ |
| name | string | 工作流名称 | ✅ |
| version | string | 版本号 (如v1.0.0) | ❌ |
| description | text | 描述信息 | ❌ |
| definition | jsonb | 工作流完整定义 (步骤、变量、配置) | ✅ |
| is_test_case | bool | 是否被TestCase引用 (标记用途) | ❌ |
| created_at | timestamp | 创建时间 | ✅ |
| updated_at | timestamp | 更新时间 | ✅ |
| deleted_at | timestamp | 软删除时间 | ❌ |
| created_by | string | 创建者ID | ❌ |

**关联关系**:
- `TestCases []TestCase` - 反向关联,哪些TestCase引用了这个Workflow
- `Runs []WorkflowRun` - 执行历史

**完整Schema**: 详见 [`docs/1-specs/database/schema.md#workflows`](../../1-specs/database/schema.md)

#### WorkflowRun (执行记录)

**数据库表**: `workflow_runs`

**关键字段**:
- `run_id`: 执行唯一ID (UUID)
- `workflow_id`: 关联的工作流ID
- `status`: running/success/failed/cancelled
- `context`: 执行上下文(所有变量的最终值) JSONB
- `error`: 失败时的错误信息

**CASCADE删除**: 当Workflow被删除时,关联的WorkflowRun也会级联删除

#### WorkflowStepExecution (步骤执行)

**数据库表**: `workflow_step_executions`

**关键字段**:
- `run_id`: 关联的执行ID
- `step_id`: 步骤ID
- `status`: pending/running/success/failed/skipped
- `input_data`: 输入数据快照 (JSONB)
- `output_data`: 输出数据快照 (JSONB)
- `duration`: 步骤耗时(毫秒)

**用途**: 实时数据流追踪,调试步骤执行

#### WorkflowStepLog (步骤日志)

**数据库表**: `workflow_step_logs`

**关键字段**:
- `run_id`: 关联的执行ID
- `step_id`: 步骤ID
- `level`: debug/info/warn/error
- `message`: 日志消息
- `timestamp`: 日志时间

**用途**: 结构化日志存储,支持按level过滤

#### WorkflowVariableChange (变量变更历史)

**数据库表**: `workflow_variable_changes`

**关键字段**:
- `run_id`: 关联的执行ID
- `step_id`: 触发变更的步骤ID
- `var_name`: 变量名
- `old_value`: 旧值 (JSONB)
- `new_value`: 新值 (JSONB)
- `change_type`: create/update/delete

**用途**: 追踪变量在执行过程中的变化,调试数据流

---

## 核心流程

### 流程1: 创建工作流

**触发条件**: 用户在ScriptLab页面点击"新建工作流"

**流程步骤**:
```
1. 用户操作 → 前端打开WorkflowEditor
2. 编写工作流定义 (JSON/YAML)
3. 验证格式和DAG合法性 (前端预检)
4. 提交 → POST /api/v2/workflows
5. 后端Handler接收请求
   5.1 验证definition格式
   5.2 检测DAG循环依赖
   5.3 生成唯一WorkflowID (UUID)
   5.4 调用Service.CreateWorkflow()
   5.5 Repository保存到数据库
6. 返回201 Created + Workflow对象
7. 前端刷新工作流列表
```

**涉及组件**:
- 前端: `ScriptLab.tsx`, `WorkflowEditor.tsx`
- 后端: `workflow_handler.go:CreateWorkflow()`, `workflow/dag.go:ValidateDAG()`
- 数据库: `workflows`

### 流程2: 执行工作流

**触发条件**: 用户点击工作流的"Run"按钮 或 API调用

**流程步骤**:
```
1. 用户点击Run → POST /api/v2/workflows/:id/execute
2. 后端Handler接收执行请求
   2.1 从数据库加载Workflow
   2.2 解析definition
   2.3 创建WorkflowRun记录 (status=running)
   2.4 启动goroutine异步执行
3. 执行引擎 (workflow/executor.go):
   3.1 初始化执行上下文 (Context)
      - 加载初始变量
      - 合并环境变量
      - 合并运行时传入变量
   3.2 构建DAG图
      - 解析steps的dependsOn
      - 计算层级 (layering)
      - 检测循环依赖
   3.3 按层级顺序执行
      For each layer:
        3.3.1 获取该层所有步骤
        3.3.2 并行执行这些步骤 (goroutine pool)
        For each step:
          a. 创建StepExecution记录 (status=running)
          b. 变量插值 (替换{{var}})
          c. 根据step.type路由到Action
             - type=http → HttpAction.Execute()
             - type=command → CommandAction.Execute()
             - type=test-case → TestCaseAction.Execute()
          d. 记录步骤日志 (BroadcastLogger)
             - 写入workflow_step_logs表
             - 推送到WebSocket (实时)
             - 输出到Console
          e. 提取outputs,更新变量
             - 解析response.body.xxx
             - 更新Context.Variables
             - 记录变量变更到workflow_variable_changes
          f. 更新StepExecution (status=success/failed)
          g. 如果失败:
             - 判断onError策略
             - abort → 终止整个Workflow
             - continue → 继续执行下一步
             - 重试 → 重新执行(最多maxRetries次)
        3.3.3 等待该层所有步骤完成
        3.3.4 检查是否有失败且策略为abort
   3.4 执行完成
      - 更新WorkflowRun (status=success/failed)
      - 保存最终Context到context字段
      - 计算总耗时
4. 返回WorkflowRun结果给前端
5. 前端通过WebSocket实时展示执行进度
```

**涉及组件**:
- 前端: `ScriptLab.tsx`, WebSocket客户端
- 后端:
  - `workflow_handler.go:ExecuteWorkflow()`
  - `workflow/executor.go:Execute()`
  - `workflow/dag.go:BuildDAG(), Layering()`
  - `workflow/actions/http_action.go`
  - `workflow/broadcast_logger.go`
  - `websocket/hub.go`
- 数据库: `workflows`, `workflow_runs`, `workflow_step_executions`, `workflow_step_logs`, `workflow_variable_changes`

### 流程3: WebSocket实时日志推送

**触发条件**: 前端连接到 `ws://host/api/v2/workflows/runs/:runId/stream`

**流程步骤**:
```
1. 前端建立WebSocket连接
   WS /api/v2/workflows/runs/:runId/stream
2. 后端WebSocket Handler
   2.1 创建Client实例
   2.2 注册到Hub (按runId分组)
   2.3 启动ReadPump和WritePump goroutines
3. 工作流执行过程中
   3.1 BroadcastLogger.Info/Warn/Error()被调用
   3.2 构造日志消息
      {
        "type": "LOG",
        "stepId": "step-1",
        "level": "info",
        "message": "Sending HTTP request...",
        "timestamp": "2025-11-26T10:00:00Z"
      }
   3.3 三重输出:
      - Database: 写入workflow_step_logs表
      - WebSocket: Hub.Broadcast(runId, message)
      - Console: fmt.Println()
   3.4 Hub将消息推送给所有订阅该runId的Client
4. 前端WebSocket onMessage
   4.1 接收日志消息
   4.2 实时更新UI (步骤状态、日志列表)
5. 执行完成
   5.1 发送COMPLETE消息
   5.2 前端展示最终结果
   5.3 可选择断开连接
```

**消息类型**:
- `STEP_START`: 步骤开始
- `STEP_COMPLETE`: 步骤完成
- `LOG`: 日志消息
- `VARIABLE_CHANGE`: 变量变更
- `WORKFLOW_COMPLETE`: 工作流完成

**涉及组件**:
- `websocket/hub.go:Broadcast()` - 消息分发
- `websocket/client.go:WritePump()` - 消息发送
- `workflow/broadcast_logger.go` - 三重输出

---

## API接口

### 核心端点

#### 创建工作流

```http
POST /api/v2/workflows
Content-Type: application/json

{
  "name": "用户注册流程",
  "version": "1.0.0",
  "description": "完整的用户注册和验证流程",
  "definition": {
    "variables": {
      "baseUrl": "https://api.example.com"
    },
    "steps": [
      {
        "id": "step-1",
        "name": "创建用户",
        "type": "http",
        "dependsOn": [],
        "config": {
          "method": "POST",
          "url": "{{baseUrl}}/users",
          "body": {"username": "test"}
        },
        "outputs": {
          "response.body.id": "userId"
        }
      }
    ]
  }
}
```

**响应**:
```json
{
  "workflowId": "wf-uuid-123",
  "name": "用户注册流程",
  "version": "1.0.0",
  "createdAt": "2025-11-26T10:00:00Z"
}
```

#### 执行工作流

```http
POST /api/v2/workflows/:workflowId/execute
Content-Type: application/json

{
  "variables": {
    "baseUrl": "https://staging-api.example.com"  // 覆盖默认值
  }
}
```

**响应**:
```json
{
  "runId": "run-abc123",
  "workflowId": "wf-uuid-123",
  "status": "running",
  "startTime": "2025-11-26T10:05:00Z"
}
```

#### 获取执行结果

```http
GET /api/v2/workflows/runs/:runId
```

**响应**:
```json
{
  "runId": "run-abc123",
  "workflowId": "wf-uuid-123",
  "status": "success",
  "startTime": "2025-11-26T10:05:00Z",
  "endTime": "2025-11-26T10:05:15Z",
  "duration": 15000,
  "context": {
    "baseUrl": "https://staging-api.example.com",
    "userId": "user-xyz789"
  }
}
```

#### WebSocket连接

```http
GET /api/v2/workflows/runs/:runId/stream
Upgrade: websocket
Connection: Upgrade
```

**接收消息示例**:
```json
{
  "type": "LOG",
  "stepId": "step-1",
  "level": "info",
  "message": "HTTP POST https://api.example.com/users",
  "timestamp": "2025-11-26T10:05:01Z"
}
```

**详细API文档**: [`docs/1-specs/api/v2-documentation.md#workflow-api`](../../1-specs/api/v2-documentation.md)

---

## 与其他模块的关系

### 依赖关系

**本模块依赖**:
- **Environment模块** - 读取环境变量合并到工作流上下文 (可选)
- **TestCase模块** - Mode 3中调用TestCase执行 (type=test-case时)
- **Tenant模块** - 多租户隔离,通过tenantId和projectId过滤数据 (可选)

**本模块被依赖**:
- **TestCase模块** - Mode 1和Mode 2中TestCase引用Workflow执行
- **Dashboard模块** - 读取WorkflowRun数据生成执行统计

### 边界规则

**✅ 允许的调用**:
- Workflow可以调用 `TestCase.Execute(testCaseId)` 执行测试 (Mode 3)
- Workflow可以读取 `Environment.GetVariables()` 获取环境变量
- TestCase可以调用 `Workflow.Execute(workflowId)` 执行工作流 (Mode 1)

**❌ 禁止的调用**:
- Workflow **不能**修改TestCase的定义 (只能调用执行)
- Workflow **不能**跨租户/项目访问其他Workflow
- Workflow **不能**无限递归调用自己 (需要检测深度)

**调用流向**:
```
Workflow ⇄ TestCase (双向,Mode 1和Mode 3)
Workflow → Environment (单向读取)
Workflow → WebSocket Hub (推送日志)
Dashboard → Workflow (单向读取统计)
```

**特殊注意**: Workflow和TestCase存在双向依赖,需要防止循环调用:
- 限制最大嵌套深度 (例如5层)
- 记录调用栈检测循环

**详细边界定义**: [`docs/5-wiki/architecture/module-boundaries.md`](../architecture/module-boundaries.md)

---

## 相关文档

### 技术规范
- **数据库设计**: [`1-specs/database/schema.md#workflows`](../../1-specs/database/schema.md)
- **API文档**: [`1-specs/api/v2-documentation.md#workflow-api`](../../1-specs/api/v2-documentation.md)
- **WebSocket架构**: `nextest-platform/WEBSOCKET_ARCHITECTURE.md`

### 决策记录
- [统一工作流架构决策](../../6-decisions/2024-11-24-unified-workflow-architecture.md)
- [TestCase工作流设计](../../6-decisions/2024-11-20-testcase-workflow-design-feature.md)

### 业务知识
- [TestCase与Workflow集成](testcase-integration.md)

### 开发指南
- [环境管理指南](../../3-guides/development/environment-management.md)

---

## 常见问题

### Q1: 如何编写工作流定义？

**A**: 工作流定义是JSON格式,包含3个主要部分:

**示例**:
```json
{
  "variables": {  // 1. 变量定义
    "baseUrl": "https://api.example.com",
    "userId": ""
  },
  "steps": [  // 2. 步骤列表
    {
      "id": "step-1",
      "name": "创建用户",
      "type": "http",
      "dependsOn": [],  // 依赖其他步骤的ID数组
      "config": {  // 步骤配置(根据type不同)
        "method": "POST",
        "url": "{{baseUrl}}/users"
      },
      "outputs": {  // 输出映射
        "response.body.id": "userId"
      }
    }
  ],
  "onError": {  // 3. 错误处理策略
    "strategy": "abort",  // abort | continue
    "maxRetries": 3
  }
}
```

### Q2: 如何实现步骤并行执行？

**A**: DAG引擎自动识别并行机会:

```json
{
  "steps": [
    {"id": "A", "dependsOn": []},  // Layer 0
    {"id": "B", "dependsOn": ["A"]},  // Layer 1
    {"id": "C", "dependsOn": ["A"]},  // Layer 1 (与B并行)
    {"id": "D", "dependsOn": ["B", "C"]}  // Layer 2 (等待B和C)
  ]
}
```

**执行顺序**: A → (B并行C) → D

**原理**: 同一层级(Layer)的步骤会并行执行,不同层级按顺序执行

### Q3: 变量插值支持哪些语法？

**A**:
- **简单变量**: `{{varName}}`
- **嵌套对象**: `{{user.profile.email}}`
- **数组索引**: `{{users[0].id}}`
- **环境变量**: `{{env.API_KEY}}`

**注意**: 暂不支持表达式计算,仅支持路径查找

### Q4: 如何调试工作流执行？

**A**: 3种方式:

1. **WebSocket实时日志** - 前端连接 `ws://host/api/workflows/runs/:runId/stream`
2. **数据库查询** - 查看 `workflow_step_executions` 和 `workflow_step_logs`
3. **变量追踪** - 查看 `workflow_variable_changes` 表

**推荐**: 使用WebSocket实时查看,最直观

### Q5: 如何处理步骤失败？

**A**: 通过`onError`配置错误处理策略:

```json
{
  "onError": {
    "strategy": "abort",  // 或 "continue"
    "maxRetries": 3,
    "retryDelay": 5000  // 毫秒
  }
}
```

- **abort**: 失败立即终止整个Workflow
- **continue**: 跳过失败步骤继续执行

**重试**: 失败时自动重试最多3次,每次间隔5秒

### Q6: 如何扩展新的Action类型？

**A**:
1. 在`workflow/actions/`目录创建新的Action文件,如`email_action.go`
2. 实现`Action`接口:
   ```go
   type EmailAction struct {}

   func (a *EmailAction) Execute(ctx *ExecutionContext, step *Step) error {
       // 实现邮件发送逻辑
   }
   ```
3. 在`workflow/action_registry.go`注册:
   ```go
   actionRegistry["email"] = &EmailAction{}
   ```
4. 在工作流中使用:
   ```json
   {
     "type": "email",
     "config": {
       "to": "user@example.com",
       "subject": "Welcome"
     }
   }
   ```

---

## 术语表

| 术语 | 说明 |
|------|------|
| Workflow | 工作流,多步骤任务的定义 |
| WorkflowRun | 工作流执行,单次执行的记录 |
| Step | 步骤,工作流中的单个操作 |
| DAG | 有向无环图,描述步骤依赖关系 |
| Layer | 层级,DAG中同层步骤可并行执行 |
| Action | 动作,步骤的具体操作类型 |
| Variable | 变量,步骤间数据传递的载体 |
| Interpolation | 插值,将变量替换到配置中 |
| BroadcastLogger | 广播日志器,三重输出日志 |

**完整术语表**: [`docs/5-wiki/glossary.md`](../glossary.md)

---

## 更新历史

| 日期 | 版本 | 变更说明 | 作者 |
|------|------|---------|------|
| 2025-11-26 | 1.0 | 初始版本,基于现有代码和统一架构决策创建 | 开发团队 |

---

**维护提示**:
- 当添加新Action类型时,更新"概念6"和FAQ Q6
- 当修改DAG算法时,更新"概念4"和"流程2"
- 当修改WebSocket协议时,更新"流程3"和WebSocket架构文档
- 当修改变量系统时,更新"概念5"和FAQ Q3
