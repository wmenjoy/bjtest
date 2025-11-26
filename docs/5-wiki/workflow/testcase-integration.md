# TestCase 与 Workflow 整合设计

**日期**: 2025-11-24
**核心问题**: 如何平衡现有工作流引擎与 TestCase 重新设计

---

## 现有工作流引擎能力分析

### 已有能力（不需要重复造轮子）

```
internal/workflow/executor.go
├── DAG 执行引擎（拓扑排序、并行执行）
├── WebSocket 实时推送（hub.Broadcast）
├── 变量插值（{{variable}} 语法）
├── Action 注册机制（HTTP, Command, TestCase）
├── WorkflowRun 记录
├── WorkflowStepExecution 记录
└── WorkflowStepLog 日志
```

### 缺失能力（需要补充）

```
1. Assertion 断言引擎
2. TestCase → Workflow 执行关联
3. 断言结果记录
4. 执行结果回写到 TestCase
```

---

## 核心架构决策

### 原则：TestCase 是 Workflow 的高层抽象

```
┌─────────────────────────────────────────────────────────────┐
│                      TestCase (高层)                         │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │ 测试目标    │  │ 前置条件     │  │ 断言定义         │   │
│  │ (What)      │  │ (Precond)    │  │ (Assertions)     │   │
│  └─────────────┘  └──────────────┘  └──────────────────┘   │
│                           │                                  │
│                           │ 执行方式                         │
│                           ▼                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Workflow (底层执行引擎)                  │   │
│  │  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐    │   │
│  │  │ Step 1 │─▶│ Step 2 │─▶│ Step 3 │─▶│ Step N │    │   │
│  │  └────────┘  └────────┘  └────────┘  └────────┘    │   │
│  │        ↓           ↓           ↓           ↓        │   │
│  │   [HTTP]      [Command]   [Assert]    [HTTP]       │   │
│  └─────────────────────────────────────────────────────┘   │
│                           │                                  │
│                           │ 执行完成                         │
│                           ▼                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Assertion Engine (断言引擎)              │   │
│  │  评估所有断言，生成 AssertionResults                   │   │
│  └─────────────────────────────────────────────────────┘   │
│                           │                                  │
│                           ▼                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              TestExecution (执行记录)                 │   │
│  │  关联 WorkflowRun + AssertionResults                  │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 三种执行模式统一

### 模式 1: 简单 HTTP 测试

```
TestCase (type: HTTP)
    │
    └── 自动生成单步 Workflow
            │
            └── Step: HTTP Request
                    │
                    └── 执行后评估 Assertions
```

**实现**: 不需要用户创建 Workflow，系统自动包装

```go
// 简单 HTTP 测试自动转换为 Workflow
func (e *TestCaseExecutor) createInlineWorkflow(tc *TestCase) *WorkflowDefinition {
    return &WorkflowDefinition{
        Steps: map[string]Step{
            "http-request": {
                Type: "http",
                Config: tc.HTTPConfig,
            },
        },
    }
}
```

### 模式 2: 简单命令测试

```
TestCase (type: COMMAND)
    │
    └── 自动生成单步 Workflow
            │
            └── Step: Command Execution
                    │
                    └── 执行后评估 Assertions
```

### 模式 3: 复杂工作流测试

```
TestCase (type: WORKFLOW)
    │
    └── 引用外部 Workflow (workflowId)
            │
            └── 复用现有工作流引擎完整能力
                    │
                    └── 执行后评估 Assertions
```

---

## 关键组件设计

### 1. TestCaseExecutor (新增)

```go
// internal/testcase/executor.go

type TestCaseExecutor struct {
    db              *gorm.DB
    workflowExec    *workflow.WorkflowExecutorImpl  // 复用现有引擎
    assertionEngine *AssertionEngine                 // 新增
}

// Execute 执行测试用例
func (e *TestCaseExecutor) Execute(ctx context.Context, testCaseID string, params *ExecutionParams) (*TestExecution, error) {
    // 1. 加载 TestCase
    tc, err := e.loadTestCase(testCaseID)

    // 2. 创建 TestExecution 记录
    exec := &TestExecution{
        ID:         uuid.New().String(),
        TestCaseID: testCaseID,
        Status:     "running",
        StartTime:  time.Now(),
    }
    e.db.Create(exec)

    // 3. 确定执行方式并执行
    var workflowResult *workflow.WorkflowResult
    switch tc.Type {
    case "http", "command":
        // 自动生成内联 Workflow
        inlineWf := e.createInlineWorkflow(tc)
        workflowResult, err = e.workflowExec.Execute("inline-"+testCaseID, inlineWf, params)
    case "workflow":
        // 使用外部 Workflow
        workflowResult, err = e.workflowExec.Execute(tc.WorkflowID, nil, params)
    }

    // 4. 关联 WorkflowRun
    exec.WorkflowRunID = workflowResult.RunID

    // 5. 评估断言
    assertionResults := e.assertionEngine.Evaluate(tc.Assertions, workflowResult)
    exec.AssertionResults = assertionResults

    // 6. 计算最终状态
    exec.Status = e.calculateStatus(workflowResult, assertionResults)
    exec.EndTime = time.Now()

    // 7. 保存执行记录
    e.db.Save(exec)

    return exec, nil
}
```

### 2. AssertionEngine (新增)

```go
// internal/assertion/engine.go

type AssertionEngine struct{}

type AssertionResult struct {
    AssertionID   string
    Name          string
    Status        string  // "passed", "failed", "skipped"
    ExpectedValue interface{}
    ActualValue   interface{}
    Message       string
}

// Evaluate 评估所有断言
func (e *AssertionEngine) Evaluate(assertions []Assertion, result *workflow.WorkflowResult) []AssertionResult {
    var results []AssertionResult

    for _, a := range assertions {
        r := e.evaluateSingle(a, result)
        results = append(results, r)
    }

    return results
}

func (e *AssertionEngine) evaluateSingle(a Assertion, result *workflow.WorkflowResult) AssertionResult {
    // 获取实际值
    actualValue := e.extractValue(a.Target, result)

    // 比较
    passed := e.compare(actualValue, a.Operator, a.ExpectedValue)

    status := "passed"
    if !passed {
        status = "failed"
    }

    return AssertionResult{
        AssertionID:   a.ID,
        Name:          a.Name,
        Status:        status,
        ExpectedValue: a.ExpectedValue,
        ActualValue:   actualValue,
        Message:       e.generateMessage(a, actualValue, passed),
    }
}

// extractValue 从执行结果中提取值
// 支持路径: "steps.step1.response.status", "variables.token", etc.
func (e *AssertionEngine) extractValue(path string, result *workflow.WorkflowResult) interface{} {
    // 使用 gjson 或类似库解析路径
    // ...
}
```

### 3. 断言类型实现

```go
// internal/assertion/types.go

type AssertionType string

const (
    AssertStatusCode    AssertionType = "STATUS_CODE"
    AssertResponseTime  AssertionType = "RESPONSE_TIME"
    AssertJSONField     AssertionType = "JSON_FIELD"
    AssertJSONSchema    AssertionType = "JSON_SCHEMA"
    AssertContains      AssertionType = "CONTAINS"
    AssertRegex         AssertionType = "REGEX"
    AssertExists        AssertionType = "EXISTS"
    AssertDatabaseQuery AssertionType = "DATABASE_QUERY"
)

// 断言目标路径示例:
// - "steps.login.response.status"       → HTTP 状态码
// - "steps.login.response.body.token"   → JSON 字段
// - "steps.login.response.time"         → 响应时间
// - "variables.userId"                  → 变量值
// - "steps.query.result.rows[0].name"   → 数据库结果
```

---

## 数据模型调整

### TestCase 扩展字段

```sql
ALTER TABLE test_cases ADD COLUMN assertions JSON;
-- 示例:
-- [
--   {"id": "a1", "name": "状态码200", "type": "STATUS_CODE", "target": "steps.http.response.status", "operator": "EQUALS", "expectedValue": 200},
--   {"id": "a2", "name": "响应时间<500ms", "type": "RESPONSE_TIME", "target": "steps.http.response.time", "operator": "LESS_THAN", "expectedValue": 500}
-- ]

ALTER TABLE test_cases ADD COLUMN preconditions JSON;
-- 示例:
-- {"environment": "dev", "dataSetup": ["create test user"], "dependencies": ["tc-001"]}

ALTER TABLE test_cases ADD COLUMN inputs JSON;
-- 示例:
-- [{"name": "username", "type": "string", "defaultValue": "test@example.com"}]
```

### 新增 TestExecution 表

```sql
CREATE TABLE test_executions (
    id VARCHAR(36) PRIMARY KEY,
    test_case_id VARCHAR(36) NOT NULL,
    test_case_version INT DEFAULT 1,

    -- 关联 workflow run
    workflow_run_id VARCHAR(36),

    -- 状态
    status VARCHAR(20) NOT NULL,  -- running, passed, failed, blocked, skipped

    -- 时间
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP,
    duration_ms INT,

    -- 环境
    environment_id VARCHAR(36),
    environment_name VARCHAR(100),

    -- 执行者
    executed_by VARCHAR(100),      -- user/scheduler/ci
    executor_name VARCHAR(100),

    -- 断言结果
    assertion_results JSON,

    -- 失败信息
    failure_reason TEXT,
    error_message TEXT,

    -- 审计
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (test_case_id) REFERENCES test_cases(test_id),
    FOREIGN KEY (workflow_run_id) REFERENCES workflow_runs(run_id)
);
```

---

## 前端复用现有组件

### WorkflowRunner 组件复用

```tsx
// 现有: components/workflow/WorkflowRunner.tsx
// 已经有:
// - WebSocket 连接实时日志
// - 步骤状态展示
// - 执行控制

// 新增: 在 TestRunner 中包装 WorkflowRunner
const TestExecutionView: React.FC<{testCaseId: string}> = ({testCaseId}) => {
    const [execution, setExecution] = useState<TestExecution | null>(null);

    // 1. 触发执行，获取 executionId
    const startExecution = async () => {
        const exec = await api.executeTestCase(testCaseId);
        setExecution(exec);
    };

    return (
        <div className="test-execution-container">
            {/* 测试信息头 */}
            <TestCaseHeader testCase={testCase} />

            {/* 断言预览（执行前） */}
            <AssertionPreview assertions={testCase.assertions} />

            {/* 工作流执行视图 - 复用现有组件 */}
            {execution?.workflowRunId && (
                <WorkflowRunner
                    workflowId={testCase.workflowId || `inline-${testCaseId}`}
                    runId={execution.workflowRunId}
                    onComplete={handleWorkflowComplete}
                />
            )}

            {/* 断言结果（执行后） */}
            {execution?.status !== 'running' && (
                <AssertionResults results={execution.assertionResults} />
            )}
        </div>
    );
};
```

---

## 执行流程图

```
用户点击 "Run Test"
        │
        ▼
┌───────────────────┐
│ POST /api/tests/  │
│    {id}/execute   │
└───────────────────┘
        │
        ▼
┌───────────────────────────────────────────────────────┐
│ TestCaseExecutor.Execute()                            │
├───────────────────────────────────────────────────────┤
│ 1. 创建 TestExecution 记录                             │
│ 2. 判断执行类型:                                        │
│    - HTTP/Command → 创建内联 Workflow                  │
│    - Workflow → 使用现有 WorkflowID                    │
│ 3. 调用 WorkflowExecutor.Execute() ──────────────────┐│
│ 4. 等待执行完成                                  ▼     ││
│                               ┌─────────────────────┐││
│                               │ 现有工作流引擎       │││
│                               │ - DAG 执行          │││
│                               │ - WebSocket 推送    │││
│                               │ - 日志记录          │││
│                               └─────────────────────┘││
│                                          │            │
│ 5. 获取 WorkflowResult ◄─────────────────┘           │
│ 6. 调用 AssertionEngine.Evaluate()                    │
│ 7. 更新 TestExecution 状态和结果                       │
│ 8. 返回结果                                           │
└───────────────────────────────────────────────────────┘
        │
        ▼
┌───────────────────┐
│ 前端更新 UI       │
│ - 断言结果展示    │
│ - 最终状态        │
└───────────────────┘
```

---

## 实施步骤（保持最小改动）

### Step 1: 扩展 TestCase 模型（后端）

```go
// 在现有 models/test_case.go 中添加字段
type TestCase struct {
    // ... 现有字段 ...

    Assertions    JSONB `gorm:"type:text;column:assertions"`
    Preconditions JSONB `gorm:"type:text;column:preconditions"`
    Inputs        JSONB `gorm:"type:text;column:inputs"`
}
```

### Step 2: 创建断言引擎（新增）

```
internal/assertion/
├── engine.go       # 断言评估引擎
├── types.go        # 断言类型定义
├── evaluators/     # 各类型评估器
│   ├── status.go
│   ├── json.go
│   ├── time.go
│   └── regex.go
└── extractor.go    # 值提取器
```

### Step 3: 创建 TestCaseExecutor（新增）

```
internal/testcase/
├── executor.go     # 测试用例执行器（复用 WorkflowExecutor）
└── inline.go       # 内联 Workflow 生成器
```

### Step 4: 创建 TestExecution 模型和 API

```
- models/test_execution.go
- repository/test_execution_repository.go
- handler/test_execution_handler.go
- 路由: POST /api/tests/:id/execute → GET /api/executions/:id
```

### Step 5: 前端整合

```
- 修改 TestRunner.tsx，整合 WorkflowRunner
- 新增 AssertionPreview 组件
- 新增 AssertionResults 组件
```

---

## 关键收益

1. **复用现有引擎** - 不重新造轮子，DAG/WebSocket/日志全部复用
2. **统一执行入口** - 无论 HTTP/Command/Workflow，都走同一流程
3. **断言与执行分离** - 执行引擎专注执行，断言引擎专注验证
4. **向后兼容** - 现有 Workflow 不受影响，TestCase 作为高层抽象

---

## 下一步

1. 确认此架构设计
2. 开始 Step 1-2 的后端实现
3. 同步前端组件调整

**预计工作量**: 3-4 天完成核心功能
