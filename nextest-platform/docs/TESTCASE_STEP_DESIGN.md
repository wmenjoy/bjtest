# TestCase 与 Workflow 统一设计

## 核心对应关系

```
TestCase    =  Workflow  +  测试元数据  +  断言
TestStep    =  WorkflowNode/Action
```

## 数据结构

```typescript
interface TestCase {
  // ===== 测试元数据 =====
  id: string;
  title: string;
  objective: string;           // 测试目标
  priority: 'P0' | 'P1' | 'P2';
  tags: string[];
  status: 'active' | 'draft';

  // ===== 执行定义 = Workflow =====
  steps: TestStep[];           // 等同于 Workflow.nodes

  // ===== 断言 =====
  assertions: Assertion[];

  // ===== 变量定义 =====
  variables: Record<string, any>;  // 初始变量
}

interface TestStep {
  // ===== 等同于 WorkflowNode =====
  id: string;
  name: string;
  type: 'http' | 'command' | 'database' | 'script' | 'assert';

  // ===== Action 配置 =====
  config: HTTPConfig | CommandConfig | DatabaseConfig | ...;

  // ===== 数据流 =====
  inputs: Record<string, string>;    // 输入参数映射 (从哪取值)
  outputs: Record<string, string>;   // 输出变量映射 (存到哪)

  // ===== 依赖关系 =====
  dependsOn?: string[];              // 依赖的步骤 ID

  // ===== 控制流 =====
  condition?: string;                // 条件表达式
  loop?: LoopConfig;                 // 循环配置
}
```

## 执行流程

```
TestCase.execute()
    │
    ├── 初始化变量 (variables)
    │
    ├── 按依赖顺序执行 Steps
    │   │
    │   └── 对每个 TestStep:
    │       ├── 解析 inputs (变量替换)
    │       ├── 执行 Action (HTTP/Command/...)
    │       ├── 保存 outputs 到变量池
    │       └── 记录执行日志
    │
    ├── 评估 Assertions
    │   └── 对每个断言:
    │       ├── 从变量池取值
    │       ├── 执行比较
    │       └── 记录结果
    │
    └── 返回执行结果
```

## 与现有 Workflow 引擎的关系

### 方案：复用引擎，统一入口

```go
// TestCase 执行时，将 steps 转换为 WorkflowDefinition
func (tc *TestCase) ToWorkflowDefinition() *WorkflowDefinition {
    steps := make(map[string]WorkflowStep)
    for _, s := range tc.Steps {
        steps[s.ID] = WorkflowStep{
            Name:      s.Name,
            Type:      s.Type,
            Config:    s.Config,
            DependsOn: s.DependsOn,
        }
    }
    return &WorkflowDefinition{
        Variables: tc.Variables,
        Steps:     steps,
    }
}

// 执行 TestCase
func (e *TestCaseExecutor) Execute(tc *TestCase) (*TestExecution, error) {
    // 1. 转换为 Workflow 格式
    wfDef := tc.ToWorkflowDefinition()

    // 2. 调用现有工作流引擎
    wfResult, err := e.workflowExecutor.Execute("inline-"+tc.ID, wfDef, nil)

    // 3. 评估断言
    assertionResults := e.evaluateAssertions(tc.Assertions, wfResult)

    // 4. 返回执行结果
    return &TestExecution{
        TestCaseID:       tc.ID,
        WorkflowRunID:    wfResult.RunID,
        AssertionResults: assertionResults,
        Status:           calculateStatus(assertionResults),
    }, nil
}
```

## UI 设计

### TestCase 编辑器 - Step 可视化

```
┌─────────────────────────────────────────────────────────────────┐
│  测试用例: TC-001-用户登录                           [保存] [运行]│
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─ 基本信息 ──────────────────────────────────────────────────┐│
│  │ 标题: [用户登录测试]  优先级: [P1▼]  标签: [login][auth]    ││
│  │ 目标: [验证用户登录接口，返回有效Token]                      ││
│  └──────────────────────────────────────────────────────────────┘│
│                                                                  │
│  ┌─ 初始变量 ──────────────────────────────────────────────────┐│
│  │ username = "test@example.com"                                ││
│  │ password = "********"                                        ││
│  │ [+ 添加变量]                                                 ││
│  └──────────────────────────────────────────────────────────────┘│
│                                                                  │
│  ┌─ 测试步骤 (Steps) ──────────────────────────────────────────┐│
│  │                                                              ││
│  │  ┌─ Step 1: 调用登录接口 ────────────────────────────────┐  ││
│  │  │ 类型: [HTTP ▼]                                        │  ││
│  │  │ 方法: [POST ▼]  URL: [/api/auth/login]               │  ││
│  │  │ Body: {"username": "{{username}}", "password": "{{password}}"}│││
│  │  │                                                       │  ││
│  │  │ 输出映射:                                             │  ││
│  │  │   response.body.token → token                        │  ││
│  │  │   response.body.userId → userId                      │  ││
│  │  └───────────────────────────────────────────────────────┘  ││
│  │                          │                                   ││
│  │                          ▼                                   ││
│  │  ┌─ Step 2: 获取用户信息 ────────────────────────────────┐  ││
│  │  │ 类型: [HTTP ▼]                                        │  ││
│  │  │ 方法: [GET ▼]  URL: [/api/user/{{userId}}]           │  ││
│  │  │ Headers: Authorization = Bearer {{token}}            │  ││
│  │  │                                                       │  ││
│  │  │ 输出映射:                                             │  ││
│  │  │   response.body.email → userEmail                    │  ││
│  │  └───────────────────────────────────────────────────────┘  ││
│  │                                                              ││
│  │  [+ 添加步骤]                                                ││
│  └──────────────────────────────────────────────────────────────┘│
│                                                                  │
│  ┌─ 断言 (Assertions) ─────────────────────────────────────────┐│
│  │ ✓ #1 登录返回200     [steps.step1.response.status] [=] [200]││
│  │ ✓ #2 返回Token       [token] [存在]                         ││
│  │ ✓ #3 邮箱一致        [userEmail] [=] [{{username}}]         ││
│  │ [+ 添加断言]                                                 ││
│  └──────────────────────────────────────────────────────────────┘│
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 数据流可视化

```
┌─────────────────────────────────────────────────────────────────┐
│  变量流向图                                                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   [初始变量]                                                     │
│   username ─────┐                                               │
│   password ─────┤                                               │
│                 │                                               │
│                 ▼                                               │
│   ┌─────────────────────────┐                                   │
│   │ Step 1: 登录接口        │                                   │
│   │ POST /api/auth/login    │                                   │
│   └─────────────────────────┘                                   │
│          │                                                      │
│          ├── token ──────────────┐                              │
│          └── userId ─────────────┤                              │
│                                  │                              │
│                                  ▼                              │
│   ┌─────────────────────────────────┐                           │
│   │ Step 2: 获取用户信息            │                           │
│   │ GET /api/user/{{userId}}        │                           │
│   │ Header: Bearer {{token}}        │                           │
│   └─────────────────────────────────┘                           │
│          │                                                      │
│          └── userEmail ──────────┐                              │
│                                  │                              │
│                                  ▼                              │
│   ┌─────────────────────────────────┐                           │
│   │ 断言评估                         │                           │
│   │ - status == 200  ✓              │                           │
│   │ - token EXISTS   ✓              │                           │
│   │ - userEmail == username  ✓      │                           │
│   └─────────────────────────────────┘                           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## 总结

| 概念 | TestCase 视角 | Workflow 视角 | 关系 |
|------|--------------|---------------|------|
| 容器 | TestCase | Workflow | TestCase = Workflow + 元数据 + 断言 |
| 执行单元 | TestStep | Node/Action | TestStep = Node |
| 数据流 | inputs/outputs | variables | 同一套变量机制 |
| 执行引擎 | - | WorkflowExecutor | 复用 |
