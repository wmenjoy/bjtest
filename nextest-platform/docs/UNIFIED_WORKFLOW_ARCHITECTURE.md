# 统一 Workflow 架构设计方案

> **文档版本**: v1.0.0
> **创建日期**: 2025-11-24
> **最后更新**: 2025-11-24
> **状态**: 设计完成，待实施

## 目录

- [1. 架构概述](#1-架构概述)
- [2. 核心概念定义](#2-核心概念定义)
- [3. Action 复用机制](#3-action-复用机制)
- [4. 数据流与变量映射](#4-数据流与变量映射)
- [5. 并行执行与 Merge 机制](#5-并行执行与-merge-机制)
- [6. 控制流可视化](#6-控制流可视化)
- [7. 双模式编辑器](#7-双模式编辑器)
- [8. 多租户共享机制](#8-多租户共享机制)
- [9. 有效性验证机制](#9-有效性验证机制)
- [10. Action Library 组织](#10-action-library-组织)
- [11. 实施路线图](#11-实施路线图)

---

## 1. 架构概述

### 1.1 设计理念

从第一性原理出发，**Workflow** 和 **TestCase** 的本质都是**可执行的步骤序列**：

```
输入 (Inputs) → 处理 (Steps/Actions) → 输出 (Outputs)
                    ↓
            控制流 (Condition/Loop/Branch)
                    ↓
            验证 (Assertions)
```

### 1.2 统一命名体系

```
Workflow (工作流) - 顶层定义
  ├── Node (节点) - 图形化表示
  └── Step (步骤) - 代码表示 (Node 的数据结构)
      └── Action (操作) - 可复用的原子操作定义
```

### 1.3 视角差异化

| 维度 | 测试视角 (QA) | 研发视角 (Dev) |
|------|---------------|----------------|
| **关注点** | 验证正确性 | 实现业务逻辑 |
| **核心要素** | 断言 (Assertions) | 数据流转 (Data Flow) |
| **执行结果** | Pass/Fail | Success/Error |
| **前置条件** | Test Fixtures | Dependencies (DAG) |
| **可视化需求** | 简单列表 | 复杂 DAG 图 |
| **复用需求** | 低 (每个测试独立) | 高 (业务逻辑重复) |

**核心策略**: 统一底层数据结构，差异化上层视图

---

## 2. 核心概念定义

### 2.1 Workflow (工作流)

```go
type Workflow struct {
    ID          string          `json:"id"`
    Name        string          `json:"name"`
    Description string          `json:"description"`
    Type        string          `json:"type"`  // "workflow" or "testcase"

    // 步骤定义
    Steps []WorkflowStep `json:"steps"`

    // 全局变量
    Variables map[string]interface{} `json:"variables"`

    // 生命周期
    SetupSteps    []string `json:"setupSteps"`    // Setup 步骤ID列表
    TeardownSteps []string `json:"teardownSteps"` // Teardown 步骤ID列表

    // 多租户
    TenantID  string `json:"tenantId"`
    ProjectID string `json:"projectId"`

    // 元数据
    CreatedBy string    `json:"createdBy"`
    CreatedAt time.Time `json:"createdAt"`
    UpdatedAt time.Time `json:"updatedAt"`
    Version   string    `json:"version"`
}
```

### 2.2 WorkflowStep (统一步骤定义)

```go
type WorkflowStep struct {
    ID       string `json:"id"`
    Name     string `json:"name"`
    Type     string `json:"type"`  // action, branch, loop, merge, delay

    // 方式1: 引用 Action Template (推荐)
    ActionTemplateId string `json:"actionTemplateId,omitempty"`
    ActionVersion    string `json:"actionVersion,omitempty"`

    // 方式2: 内联 Action 定义 (向后兼容)
    Config map[string]interface{} `json:"config,omitempty"`

    // 数据流
    Inputs  map[string]string `json:"inputs"`   // 参数绑定
    Outputs map[string]string `json:"outputs"`  // 输出映射

    // 数据映射器 (可视化配置)
    DataMappers []DataMapper `json:"dataMappers,omitempty"`

    // 控制流
    Condition string   `json:"condition,omitempty"`  // 条件表达式
    DependsOn []string `json:"dependsOn,omitempty"`  // 依赖步骤ID (DAG)

    // 循环
    Loop *LoopConfig `json:"loop,omitempty"`

    // 分支
    Branches []BranchConfig `json:"branches,omitempty"`

    // 嵌套步骤
    Children []string `json:"children,omitempty"`  // 子步骤ID列表

    // 错误处理
    OnError      string `json:"onError,omitempty"`      // abort, continue, retry
    RetryCount   int    `json:"retryCount,omitempty"`   // 重试次数
    RetryDelay   int    `json:"retryDelay,omitempty"`   // 重试延迟(秒)
    Timeout      int    `json:"timeout,omitempty"`      // 超时(秒)

    // 断言 (测试视角关注)
    Assertions []Assertion `json:"assertions,omitempty"`

    // UI 相关
    Position   *Position `json:"position,omitempty"`   // 画布坐标
    Collapsed  bool      `json:"collapsed,omitempty"`  // 是否折叠
    Disabled   bool      `json:"disabled,omitempty"`   // 是否禁用
}

type Position struct {
    X float64 `json:"x"`
    Y float64 `json:"y"`
}
```

### 2.3 DataMapper (数据映射器)

```go
type DataMapper struct {
    SourceStep  string `json:"sourceStep"`   // "step-login"
    SourcePath  string `json:"sourcePath"`   // "response.body.token"
    TargetParam string `json:"targetParam"`  // "authToken"
    Transform   string `json:"transform"`    // 转换函数: "uppercase", "parseInt"
}
```

### 2.4 LoopConfig (循环配置)

```go
type LoopConfig struct {
    Type          string      `json:"type"`  // forEach, while, count
    Source        string      `json:"source"`        // "{{userList}}"
    ItemVar       string      `json:"itemVar"`       // "user"
    IndexVar      string      `json:"indexVar"`      // "index"
    Condition     string      `json:"condition"`     // while 条件
    Count         interface{} `json:"count"`         // count 循环次数
    MaxIterations int         `json:"maxIterations"` // 安全限制
}
```

### 2.5 BranchConfig (分支配置)

```go
type BranchConfig struct {
    Condition string   `json:"condition"` // "{{status}} == 200"
    Label     string   `json:"label"`     // "成功分支"
    Children  []string `json:"children"`  // 子步骤ID列表
}
```

### 2.6 MergeNode (合并节点)

```go
type MergeNode struct {
    WorkflowStep
    Type          string `json:"type"` // 固定为 "merge"
    MergeStrategy string `json:"mergeStrategy"` // waitAll, waitAny, waitN
    WaitCount     int    `json:"waitCount"`     // 当 strategy = waitN 时需要

    MergeConfig struct {
        Mode    string            `json:"mode"`    // object, array
        Mapping map[string]string `json:"mapping"` // 自定义映射
    } `json:"mergeConfig"`
}
```

---

## 3. Action 复用机制

### 3.1 Action Template (可复用的 Action 定义)

**核心理念**: 定义一次，处处复用

```go
type ActionTemplate struct {
    ID          string `json:"id"`          // "action-login-user"
    Name        string `json:"name"`        // "用户登录"
    Description string `json:"description"` // "通过用户名密码登录系统"
    Category    string `json:"category"`    // "Authentication"
    Type        string `json:"type"`        // "http", "command", "database", "script"

    // Action 配置模板 (带参数占位符)
    ConfigTemplate map[string]interface{} `json:"configTemplate"`

    // 输入参数定义
    Parameters []ActionParameter `json:"parameters"`

    // 输出定义
    Outputs []ActionOutput `json:"outputs"`

    // 标签 (用于搜索和分类)
    Tags []string `json:"tags"`

    // 多租户
    Scope    string `json:"scope"`    // system, platform, tenant
    TenantID string `json:"tenantId"` // NULL for system/platform

    // 权限控制
    IsPublic   bool `json:"isPublic"`   // 是否公开
    AllowCopy  bool `json:"allowCopy"`  // 是否允许复制

    // 元数据
    IsBuiltIn   bool      `json:"isBuiltIn"`
    IsTemplate  bool      `json:"isTemplate"`
    Version     string    `json:"version"`
    CreatedBy   string    `json:"createdBy"`
    CreatedAt   time.Time `json:"createdAt"`
    UpdatedAt   time.Time `json:"updatedAt"`
}

type ActionParameter struct {
    Name         string      `json:"name"`
    Type         string      `json:"type"` // string, number, boolean, object, array
    Description  string      `json:"description"`
    Required     bool        `json:"required"`
    DefaultValue interface{} `json:"defaultValue"`
    Enum         []string    `json:"enum"` // 枚举值
}

type ActionOutput struct {
    Name        string `json:"name"`
    Type        string `json:"type"`
    Path        string `json:"path"` // JSONPath: "response.body.token"
    Description string `json:"description"`
}
```

### 3.2 示例: 用户登录 Action Template

```json
{
  "id": "action-user-login",
  "name": "用户登录",
  "description": "通过用户名密码登录系统，返回 JWT Token",
  "category": "Authentication",
  "type": "http",
  "configTemplate": {
    "method": "POST",
    "url": "/api/auth/login",
    "headers": {
      "Content-Type": "application/json"
    },
    "body": {
      "username": "{{username}}",
      "password": "{{password}}"
    }
  },
  "parameters": [
    {
      "name": "username",
      "type": "string",
      "description": "用户名",
      "required": true
    },
    {
      "name": "password",
      "type": "string",
      "description": "密码",
      "required": true
    }
  ],
  "outputs": [
    {
      "name": "authToken",
      "type": "string",
      "path": "response.body.token",
      "description": "JWT 认证令牌"
    },
    {
      "name": "userId",
      "type": "string",
      "path": "response.body.userId",
      "description": "用户ID"
    }
  ],
  "tags": ["auth", "login", "user"],
  "scope": "platform",
  "isPublic": true,
  "allowCopy": true,
  "version": "1.0.0"
}
```

### 3.3 Step 引用 Action Template

```json
{
  "id": "step-login",
  "name": "用户登录",
  "actionTemplateId": "action-user-login",
  "actionVersion": "1.0.0",
  "inputs": {
    "username": "{{testUsername}}",
    "password": "{{testPassword}}"
  },
  "outputs": {
    "authToken": "currentAuthToken",
    "userId": "currentUserId"
  },
  "assertions": [
    {
      "type": "equals",
      "actual": "{{step-login.response.status}}",
      "expected": 200
    }
  ]
}
```

### 3.4 执行时解析流程

```go
func (e *WorkflowExecutor) ExecuteStep(ctx *ExecutionContext, step *WorkflowStep) (*StepResult, error) {
    // 1. 检查是否引用 Action Template
    if step.ActionTemplateId != "" {
        // 从 Action Library 加载模板
        template, err := e.actionLibrary.GetTemplate(step.ActionTemplateId, step.ActionVersion)
        if err != nil {
            return nil, fmt.Errorf("action template not found: %s", step.ActionTemplateId)
        }

        // 2. 合并配置: Template Config + Step Inputs
        resolvedConfig := e.mergeConfig(template.ConfigTemplate, step.Inputs)

        // 3. 创建临时 Action 实例
        action := e.createAction(template.Type, resolvedConfig)

        // 4. 执行 Action
        result, err := action.Execute(ctx)

        // 5. 提取输出变量
        e.extractOutputs(result, template.Outputs, step.Outputs)

        return result, err
    }

    // 内联 Action (向后兼容)
    action := e.createAction(step.Type, step.Config)
    return action.Execute(ctx)
}
```

---

## 4. 数据流与变量映射

### 4.1 可视化数据映射面板 (三栏布局)

```
┌─────────────────────────────────────────────────────────────┐
│                    Step 配置面板                              │
├─────────────────────────────────────────────────────────────┤
│  Step: API 创建订单                                           │
│                                                               │
│  ┌───────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  上游输出     │  │   映射关系    │  │  当前输入    │     │
│  │  (可展开树)   │  │              │  │  (参数列表)  │     │
│  ├───────────────┤  ├──────────────┤  ├──────────────┤     │
│  │ step-login    │  │              │  │ userId       │     │
│  │ ├─ token      │──┼──────────────┼→ │   required   │     │
│  │ └─ userId     │  │              │  │              │     │
│  │               │  │              │  │ productId    │     │
│  │ step-product  │  │              │  │   required   │     │
│  │ ├─ id         │──┼──────────────┼→ │              │     │
│  │ ├─ name       │  │              │  │ quantity     │     │
│  │ └─ price      │  │              │  │   optional   │     │
│  └───────────────┘  └──────────────┘  └──────────────┘     │
│                                                               │
│  [+ Add Custom Mapper] [Preview JSON]                        │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 拖拽交互流程

1. **上游输出树**: 展示所有前置步骤的输出结构（支持嵌套展开）
2. **拖拽连线**: 从上游输出字段拖拽到当前步骤的输入参数
3. **自动转换**: 系统自动推断类型转换（如 number → string）
4. **预览配置**: 实时预览解析后的配置 JSON

### 4.3 复杂类型支持

#### 4.3.1 数组映射

```typescript
// 示例: 上游输出是数组
step1.output = {
    users: [
        {id: "1", name: "Alice", email: "alice@example.com"},
        {id: "2", name: "Bob", email: "bob@example.com"}
    ]
}

// 方式1: 映射整个数组
{
    sourcePath: "step1.users",
    targetParam: "userList",
    transform: null
}

// 方式2: 提取数组字段 (JSONPath)
{
    sourcePath: "step1.users[*].email",
    targetParam: "emailList",
    transform: "arrayMap"  // ["alice@example.com", "bob@example.com"]
}

// 方式3: 循环遍历
{
    loop: {
        type: "forEach",
        source: "step1.users",
        itemVar: "currentUser"
    },
    dataMappers: [
        {
            sourcePath: "currentUser.id",
            targetParam: "userId"
        }
    ]
}
```

#### 4.3.2 内置转换函数

```go
var BUILT_IN_TRANSFORMS = map[string]TransformFunc{
    // 类型转换
    "toString":   func(v interface{}) interface{} { return fmt.Sprintf("%v", v) },
    "toNumber":   func(v interface{}) interface{} { return parseNumber(v) },
    "toBoolean":  func(v interface{}) interface{} { return parseBool(v) },

    // 字符串操作
    "uppercase":  func(v interface{}) interface{} { return strings.ToUpper(v.(string)) },
    "lowercase":  func(v interface{}) interface{} { return strings.ToLower(v.(string)) },
    "trim":       func(v interface{}) interface{} { return strings.TrimSpace(v.(string)) },

    // 数组操作
    "arrayMap":    arrayMapTransform,
    "arrayFilter": arrayFilterTransform,
    "arrayJoin":   arrayJoinTransform,

    // 对象操作
    "pick": pickTransform,
    "omit": omitTransform,

    // 日期格式化
    "formatDate": formatDateTransform,
}
```

---

## 5. 并行执行与 Merge 机制

### 5.1 DAG 分层并行执行

```
                Workflow 执行流
┌────────────────────────────────────────────────────┐
│                                                    │
│  [Start] ──► [Step 1: 用户登录]                    │
│                │                                   │
│                ├───► [Step 2a: 查询订单] ──┐       │
│                │         (并行层1)          │       │
│                ├───► [Step 2b: 查询商品] ──┤       │
│                │         (并行层1)          │       │
│                └───► [Step 2c: 查询库存] ──┘       │
│                                │                   │
│                                ▼                   │
│                        [Step 3: 汇总数据]          │
│                        (Merge 节点)                │
│                                │                   │
│                                ▼                   │
│                          [Step 4: 生成报表]        │
│                                │                   │
│                                ▼                   │
│                             [End]                  │
└────────────────────────────────────────────────────┘
```

### 5.2 Merge Node 配置

```json
{
    "id": "step-merge",
    "name": "汇总数据",
    "type": "merge",
    "dependsOn": ["step-2a", "step-2b", "step-2c"],
    "mergeStrategy": "waitAll",
    "mergeConfig": {
        "mode": "object",
        "mapping": {
            "orders": "step-2a.data",
            "products": "step-2b.data",
            "inventory": "step-2c.data"
        }
    },
    "outputs": {
        "merged": "allData"
    }
}
```

### 5.3 Merge 策略

| 策略 | 说明 | 使用场景 |
|------|------|---------|
| **waitAll** | 等待所有依赖步骤完成 | 数据汇总 |
| **waitAny** | 任意一个依赖步骤完成即继续 | 快速响应 |
| **waitN** | 等待 N 个依赖步骤完成 | 部分数据可用即可 |

### 5.4 后端执行逻辑

```go
func (e *WorkflowExecutor) Execute(workflow *Workflow) (*WorkflowResult, error) {
    // 1. 构建 DAG
    graph := buildDAG(workflow.Steps)

    // 2. 拓扑排序得到执行层
    layers := topologicalSort(graph)
    // 示例: [[step1], [step2a, step2b, step2c], [step3]]

    // 3. 按层并行执行
    for layerIdx, layer := range layers {
        var wg sync.WaitGroup
        results := make(chan *StepResult, len(layer))

        for _, step := range layer {
            wg.Add(1)
            go func(s *WorkflowStep) {
                defer wg.Done()
                result := e.ExecuteStep(ctx, s)
                results <- result
            }(step)
        }

        wg.Wait()
        close(results)

        // 收集本层执行结果
        for result := range results {
            ctx.SetStepResult(result.StepID, result)
        }
    }

    return buildWorkflowResult(ctx)
}
```

---

## 6. 控制流可视化

### 6.1 条件分支 (菱形判断节点)

```
              [Step 1: 检查库存]
                      │
                      ▼
                 ◆ 库存充足? ◆
                  /         \
              Yes/           \No
                /             \
               ▼               ▼
    [Step 2a: 创建订单]  [Step 2b: 补货通知]
               │               │
               └───────┬───────┘
                       ▼
                [Step 3: 发送通知]
```

**数据结构**:

```typescript
interface BranchNode extends WorkflowStep {
    type: 'branch';
    branches: {
        condition: string;     // "{{inventory.quantity}} > 10"
        label: string;         // "库存充足"
        children: string[];    // 子步骤ID列表
    }[];
    defaultBranch?: string[];  // else 分支
}
```

### 6.2 循环 (循环容器节点)

```
┌─────────────────────────────────────────────┐
│ 🔄 Loop: forEach user in userList          │
│    ┌──────────────────────────────────┐    │
│    │ [Step 1: 发送邮件]               │    │
│    │   Input: {{user.email}}          │    │
│    │                                   │    │
│    │ [Step 2: 记录日志]               │    │
│    │   Input: {{user.id}}             │    │
│    └──────────────────────────────────┘    │
│                                             │
│ Loop Var: user, index                      │
│ Max Iterations: 1000                        │
└─────────────────────────────────────────────┘
```

### 6.3 子流程数据传递

```typescript
// 循环外的变量: {{globalVar}}
// 循环内的变量: {{user}}, {{index}}
// 循环外访问循环结果: {{loopResults}}

// 示例配置
{
    type: 'loop',
    loop: {
        source: '{{userList}}',
        itemVar: 'user',
        indexVar: 'i'
    },
    children: ['step-send-email'],
    outputs: {
        'loopResults': 'emailResults'
    }
}

// 循环结束后
emailResults = [
    { index: 0, user: user1, success: true },
    { index: 1, user: user2, success: true },
    { index: 2, user: user3, success: false }
]
```

### 6.4 不同循环之间共享数据

```json
// 循环1: 收集用户ID
{
    "id": "loop-1",
    "type": "loop",
    "loop": {"source": "{{users}}", "itemVar": "user"},
    "children": ["step-extract-id"],
    "outputs": {"loopResults": "userIds"}
}

// 循环2: 查询详情 (依赖循环1)
{
    "id": "loop-2",
    "type": "loop",
    "dependsOn": ["loop-1"],
    "loop": {
        "source": "{{userIds}}",
        "itemVar": "userId"
    },
    "children": ["step-query-details"]
}
```

---

## 7. 双模式编辑器

### 7.1 设计理念

```
                   统一的底层数据
                     (Workflow)
                          │
         ┌────────────────┴────────────────┐
         ▼                                  ▼
  简单模式 (Simple Mode)          高级模式 (Advanced Mode)
  ══════════════════════          ═════════════════════════
  • 列表式编辑                    • 图形化拖拽 (React Flow)
  • 线性步骤                      • DAG 可视化
  • 适合测试人员 (QA)             • 并行/分支/循环可视化
  • 快速创建                      • 适合研发人员 (Dev)
  • 断言突出显示                  • 复杂流程编排
```

### 7.2 Simple Mode (列表式编辑器)

**特点**:
- ✅ 垂直列表布局 (StepCard 组件)
- ✅ 折叠/展开配置
- ✅ 拖拽排序
- ✅ 适合简单线性流程

**UI 布局**:

```typescript
const SimpleEditor = ({ workflow }) => {
    return (
        <div className="p-6">
            {/* 顶部工具栏 */}
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">测试步骤</h2>
                <button onClick={() => switchToAdvancedMode(workflow.id)}>
                    升级到高级模式
                </button>
            </div>

            {/* 步骤列表 (支持拖拽排序) */}
            <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="steps">
                    {steps.map((step, index) => (
                        <StepCard
                            step={step}
                            index={index}
                            onChange={(s) => updateStep(index, s)}
                            onDelete={() => deleteStep(index)}
                        />
                    ))}
                </Droppable>
            </DragDropContext>

            {/* 添加步骤按钮 */}
            <button onClick={addStep}>+ 添加步骤</button>
        </div>
    );
};
```

### 7.3 Advanced Mode (图形化编辑器)

**特点**:
- ✅ React Flow 图形引擎
- ✅ 自由拖拽布局
- ✅ 自动布局算法 (Dagre)
- ✅ 并行、分支、循环可视化
- ✅ 数据流连线

**UI 布局**:

```typescript
const AdvancedWorkflowEditor = ({ workflow }) => {
    const [nodes, setNodes] = useNodesState([]);
    const [edges, setEdges] = useEdgesState([]);

    // 自定义节点类型
    const nodeTypes = {
        action: ActionNode,
        branch: BranchNode,
        loop: LoopNode,
        merge: MergeNode
    };

    return (
        <div className="h-screen flex">
            {/* 左侧: Action Library */}
            <ActionLibrarySidebar />

            {/* 中间: 画布 */}
            <div className="flex-1">
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    nodeTypes={nodeTypes}
                    onConnect={handleConnect}
                    fitView
                >
                    <Background />
                    <Controls />
                    <MiniMap />
                </ReactFlow>
            </div>

            {/* 右侧: Step 配置面板 */}
            <StepConfigPanel step={selectedStep} />
        </div>
    );
};
```

### 7.4 自定义节点类型

#### 7.4.1 Action Node (矩形)

```typescript
const ActionNode = ({ data }) => {
    return (
        <div className="bg-white border-2 border-blue-400 rounded-lg p-4 min-w-[200px]">
            <div className="flex items-center space-x-2 mb-2">
                <Zap size={16} className="text-blue-600"/>
                <span className="font-bold">{data.name}</span>
            </div>
            <div className="text-xs text-slate-500">
                {data.actionTemplateId || data.type}
            </div>
            <Handle type="target" position="top" />
            <Handle type="source" position="bottom" />
        </div>
    );
};
```

#### 7.4.2 Branch Node (菱形)

```typescript
const BranchNode = ({ data }) => {
    return (
        <div className="relative">
            <div className="w-32 h-32 bg-yellow-100 border-2 border-yellow-500 transform rotate-45">
                <div className="absolute inset-0 flex items-center justify-center transform -rotate-45">
                    <GitBranch size={20}/>
                </div>
            </div>
            <Handle type="target" position="top" />
            {data.branches.map((branch, idx) => (
                <Handle
                    key={idx}
                    type="source"
                    id={`branch-${idx}`}
                    position="bottom"
                />
            ))}
        </div>
    );
};
```

### 7.5 模式切换逻辑

```typescript
const switchToAdvancedMode = (workflowId: string) => {
    const hasComplexFlow = detectComplexFlow(workflow);

    if (!hasComplexFlow) {
        // 简单线性流程自动转换为 DAG
        const dagWorkflow = convertToDAG(workflow);
    }

    navigate(`/workflows/${workflowId}/advanced`);
};

const detectComplexFlow = (workflow: Workflow) => {
    return workflow.steps.some(step =>
        step.type === 'branch' ||
        step.type === 'loop' ||
        step.type === 'merge' ||
        (step.dependsOn && step.dependsOn.length > 1)
    );
};
```

---

## 8. 多租户共享机制

### 8.1 分层 Action Library

```
┌────────────────────────────────────────────────────┐
│              Action Library 架构                    │
├────────────────────────────────────────────────────┤
│                                                    │
│  Level 1: 系统内置 (System Built-in)               │
│  ═════════════════════════════════════             │
│  • HTTP Request                                    │
│  • Database Query                                  │
│  • Redis Command                                   │
│  • Scope: 所有租户只读访问                          │
│  • 无法修改或删除                                   │
│                                                    │
├────────────────────────────────────────────────────┤
│                                                    │
│  Level 2: 平台公共 (Platform Shared)               │
│  ═══════════════════════════════════               │
│  • 用户登录                                         │
│  • 发送邮件                                         │
│  • 文件上传                                         │
│  • Scope: 所有租户只读访问                          │
│  • 由平台管理员维护                                 │
│  • 租户可以复制到私有库                             │
│                                                    │
├────────────────────────────────────────────────────┤
│                                                    │
│  Level 3: 租户私有 (Tenant Private)                │
│  ════════════════════════════════                  │
│  • Tenant A: 查询订单 API                          │
│  • Tenant A: 发送短信验证码                        │
│  • Scope: 仅当前租户                               │
│  • 完全控制 (CRUD)                                 │
│                                                    │
└────────────────────────────────────────────────────┘
```

### 8.2 数据库设计

```sql
CREATE TABLE action_templates (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50),
    category VARCHAR(100),
    config_template JSONB,
    parameters JSONB,
    outputs JSONB,

    -- 多租户字段
    scope VARCHAR(20) NOT NULL,  -- 'system', 'platform', 'tenant'
    tenant_id VARCHAR(255),      -- NULL for system/platform

    -- 权限控制
    is_public BOOLEAN DEFAULT false,
    allow_copy BOOLEAN DEFAULT true,

    -- 元数据
    version VARCHAR(20),
    created_by VARCHAR(255),
    created_at TIMESTAMP,
    updated_at TIMESTAMP,

    INDEX idx_scope_tenant (scope, tenant_id),
    INDEX idx_category (category),
    INDEX idx_public (is_public)
);
```

### 8.3 权限控制逻辑

```go
func (s *ActionTemplateService) ListTemplates(ctx context.Context, tenantID string) ([]*ActionTemplate, error) {
    var templates []*ActionTemplate

    query := s.db.Where("1=1")

    // 1. 系统内置 (所有人可见)
    query = query.Or("scope = ?", "system")

    // 2. 平台公共 (所有人可见)
    query = query.Or("scope = ? AND is_public = ?", "platform", true)

    // 3. 租户私有 (仅当前租户)
    query = query.Or("scope = ? AND tenant_id = ?", "tenant", tenantID)

    // 4. 其他租户公开的 (可见但只读)
    query = query.Or("scope = ? AND is_public = ? AND tenant_id != ?", "tenant", true, tenantID)

    query.Find(&templates)

    return templates, nil
}
```

### 8.4 复制到私有库

```go
func (s *ActionTemplateService) CopyToPrivate(ctx context.Context, sourceID string, tenantID string) (*ActionTemplate, error) {
    source, err := s.GetTemplate(ctx, sourceID, "")
    if err != nil {
        return nil, err
    }

    if !source.AllowCopy {
        return nil, fmt.Errorf("action template does not allow copying")
    }

    copy := &ActionTemplate{
        ID:             generateID(),
        Name:           fmt.Sprintf("Copy of %s", source.Name),
        Type:           source.Type,
        ConfigTemplate: source.ConfigTemplate,
        Parameters:     source.Parameters,
        Outputs:        source.Outputs,
        Scope:          "tenant",
        TenantID:       tenantID,
        IsPublic:       false,
        SourceID:       sourceID,
    }

    return s.CreateTemplate(ctx, copy)
}
```

---

## 9. 有效性验证机制

### 9.1 验证层级

```
┌────────────────────────────────────────────┐
│          Validation Pipeline               │
├────────────────────────────────────────────┤
│                                            │
│  1. Schema Validation (结构验证)           │
│     • 必填字段检查                          │
│     • 类型检查                              │
│     • 格式验证 (URL, Email等)              │
│                                            │
│  2. Dependency Validation (依赖验证)       │
│     • DAG 循环依赖检测                      │
│     • 变量引用有效性                        │
│     • Action Template 存在性               │
│                                            │
│  3. Runtime Validation (运行时验证)        │
│     • 参数值验证                            │
│     • API 连通性测试                        │
│     • 权限检查                              │
│                                            │
│  4. Dry Run (模拟执行)                     │
│     • 无副作用的完整执行                    │
│     • 变量解析测试                          │
│     • 数据流验证                            │
│                                            │
└────────────────────────────────────────────┘
```

### 9.2 实时验证 UI

```typescript
const StepEditor = ({ step }) => {
    const [validation, setValidation] = useState<ValidationResult>({
        valid: true,
        errors: [],
        warnings: []
    });

    useEffect(() => {
        const result = validateStep(step, workflow);
        setValidation(result);
    }, [step]);

    return (
        <div>
            <ValidationStatus result={validation} />
            <StepConfigForm step={step} />

            {!validation.valid && (
                <ValidationPanel result={validation} />
            )}

            <button onClick={() => dryRunStep(step)}>
                测试执行
            </button>
        </div>
    );
};
```

### 9.3 验证逻辑

```typescript
const validateStep = (step: WorkflowStep, workflow: Workflow): ValidationResult => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 1. Schema 验证
    if (!step.name) errors.push("步骤名称不能为空");
    if (!step.actionTemplateId && !step.type) errors.push("必须指定 Action 或类型");

    // 2. Action Template 验证
    if (step.actionTemplateId) {
        const template = getActionTemplate(step.actionTemplateId);
        if (!template) {
            errors.push(`Action Template "${step.actionTemplateId}" 不存在`);
        } else {
            template.parameters.filter(p => p.required).forEach(param => {
                if (!step.inputs[param.name]) {
                    errors.push(`缺少必填参数: ${param.name}`);
                }
            });
        }
    }

    // 3. 依赖验证
    step.dependsOn?.forEach(depId => {
        if (!workflow.steps.find(s => s.id === depId)) {
            errors.push(`依赖步骤 "${depId}" 不存在`);
        }
    });

    // 4. 变量引用验证
    Object.values(step.inputs).forEach(value => {
        const varRefs = extractVariableRefs(value);
        varRefs.forEach(varRef => {
            if (!isVariableAvailable(varRef, step, workflow)) {
                warnings.push(`变量 "${varRef}" 可能未定义`);
            }
        });
    });

    // 5. 循环依赖检测
    if (hasCyclicDependency(step, workflow)) {
        errors.push("检测到循环依赖");
    }

    return { valid: errors.length === 0, errors, warnings };
};
```

### 9.4 Dry Run API

```go
// POST /api/steps/validate
func (h *StepHandler) ValidateStep(c *gin.Context) {
    var req struct {
        Step   *WorkflowStep           `json:"step"`
        Config map[string]interface{} `json:"config"`
        DryRun bool                    `json:"dryRun"`
    }

    if err := c.BindJSON(&req); err != nil {
        c.JSON(400, gin.H{"error": err.Error()})
        return
    }

    ctx := &ExecutionContext{
        Variables: req.Config,
        DryRun:    req.DryRun,
    }

    result, err := h.executor.ExecuteStep(ctx, req.Step)

    c.JSON(200, gin.H{
        "valid":  err == nil,
        "result": result,
        "error":  err,
    })
}
```

---

## 10. Action Library 组织

### 10.1 组织维度

```
Action Library 组织结构
═══════════════════════

1. 按类别 (Category)
   ├─ Network (HTTP, WebSocket, GraphQL)
   ├─ Database (MySQL, Postgres, MongoDB, Redis)
   ├─ Messaging (Kafka, RabbitMQ, MQTT)
   ├─ File System (Read, Write, Upload)
   ├─ Authentication (Login, OAuth, JWT)
   ├─ Data Transform (JSON, XML, CSV)
   └─ Custom Scripts

2. 按标签 (Tags)
   • #authentication #api #http
   • #database #query #mysql
   • #cache #redis #session

3. 按使用频率
   • 最常用 (Top 10)
   • 最近使用 (Recent 20)
   • 我的收藏 (Favorites)

4. 按创建者
   • 系统内置
   • 平台公共
   • 我的团队
   • 我创建的
```

### 10.2 数据库设计

```sql
-- Action 标签表
CREATE TABLE action_tags (
    action_id VARCHAR(255),
    tag VARCHAR(100),
    PRIMARY KEY (action_id, tag),
    INDEX idx_tag (tag)
);

-- Action 使用统计
CREATE TABLE action_usage_stats (
    action_id VARCHAR(255) PRIMARY KEY,
    usage_count INT DEFAULT 0,
    last_used_at TIMESTAMP,
    favorite_count INT DEFAULT 0,
    INDEX idx_usage (usage_count DESC),
    INDEX idx_last_used (last_used_at DESC)
);

-- 用户收藏
CREATE TABLE action_favorites (
    user_id VARCHAR(255),
    action_id VARCHAR(255),
    created_at TIMESTAMP,
    PRIMARY KEY (user_id, action_id)
);
```

### 10.3 智能搜索与推荐

```typescript
const ActionLibrary = () => {
    // 智能搜索
    const searchActions = async (query: string) => {
        return await fetch('/api/action-templates/search', {
            method: 'POST',
            body: JSON.stringify({
                query,
                fuzzy: true,
                includeDescription: true,
                includeTags: true
            })
        });
    };

    // 推荐 Actions
    const getRecommendations = async (context) => {
        return await fetch('/api/action-templates/recommend', {
            method: 'POST',
            body: JSON.stringify(context)
        });
    };

    return (
        <div>
            <SearchBar onSearch={searchActions} />
            <RecommendedActions />
            <CategoryBrowser />
            <TagCloud />
        </div>
    );
};
```

### 10.4 推荐算法

```go
func (s *ActionRecommendationService) Recommend(ctx context.Context, req *RecommendRequest) ([]*ActionTemplate, error) {
    var recommendations []*ActionTemplate

    // 1. 基于当前 Workflow 推荐 (协同过滤)
    if req.Workflow != nil {
        usedActions := extractUsedActions(req.Workflow)
        similar := s.findSimilarActions(usedActions)
        recommendations = append(recommendations, similar...)
    }

    // 2. 基于最近使用推荐
    if len(req.RecentActions) > 0 {
        recent := s.getActionsByIDs(req.RecentActions)
        recommendations = append(recommendations, recent...)
    }

    // 3. 基于热度推荐
    popular := s.getPopularActions(10)
    recommendations = append(recommendations, popular...)

    // 4. 去重并排序
    recommendations = deduplicateAndSort(recommendations)

    return recommendations[:10], nil
}
```

---

## 11. 实施路线图

### 11.1 Phase 1: 核心基础 (2-3周)

**优先级**: 🔴 高

**目标**: 建立 Action Template 基础设施和多租户支持

#### 后端任务

1. **创建 `action_templates` 表和相关表**
   - `action_templates` (主表)
   - `action_tags` (标签表)
   - `action_usage_stats` (统计表)
   - `action_favorites` (收藏表)

2. **实现 `ActionTemplateRepository`**
   ```go
   type ActionTemplateRepository interface {
       Create(ctx context.Context, template *ActionTemplate) error
       GetByID(ctx context.Context, id, version string) (*ActionTemplate, error)
       List(ctx context.Context, filters *ListFilters) ([]*ActionTemplate, error)
       Update(ctx context.Context, template *ActionTemplate) error
       Delete(ctx context.Context, id string) error
       CopyToPrivate(ctx context.Context, sourceID, tenantID string) (*ActionTemplate, error)
   }
   ```

3. **实现 `ActionTemplateService`**
   - 权限控制逻辑 (system/platform/tenant)
   - 复制到私有库功能
   - 版本管理

4. **修改 `WorkflowExecutor.ExecuteStep()`**
   - 支持 `actionTemplateId` 解析
   - Config 合并逻辑
   - 输出变量提取

5. **添加 API 端点**
   ```
   POST   /api/action-templates
   GET    /api/action-templates/:id
   PUT    /api/action-templates/:id
   DELETE /api/action-templates/:id
   GET    /api/action-templates
   POST   /api/action-templates/:id/copy
   ```

#### 前端任务

1. **扩展类型定义**
   ```typescript
   // types/action-template.ts
   export interface ActionTemplate { ... }
   export interface ActionParameter { ... }
   export interface ActionOutput { ... }
   ```

2. **增强 `ActionLibrary.tsx`**
   - 支持通用 Action Template (不仅是脚本)
   - 作用域过滤 (system/platform/tenant)
   - 复制到私有库按钮

3. **添加内置 Action Templates**
   - HTTP GET/POST
   - 用户登录
   - 数据库查询
   - Redis 命令

#### 验收标准

- ✅ 可以创建、查看、编辑、删除 Action Template
- ✅ 多租户权限隔离正常工作
- ✅ Step 可以引用 Action Template 并正确执行
- ✅ 前端可以从 Action Library 浏览和选择 Actions

---

### 11.2 Phase 2: 用户体验增强 (2-3周)

**优先级**: 🟡 中

**目标**: 提升数据映射和控制流的可视化体验

#### 后端任务

1. **实现 Merge Node**
   ```go
   type MergeNode struct {
       WorkflowStep
       MergeStrategy string
       MergeConfig   MergeConfigStruct
   }

   func (e *WorkflowExecutor) executeMergeNode(ctx *ExecutionContext, node *MergeNode) (*StepResult, error)
   ```

2. **增强变量解析**
   - 支持 JSONPath (使用 `tidwall/gjson`)
   - 支持转换函数 (uppercase, parseInt, etc.)
   - 支持嵌套变量引用

3. **实现循环变量作用域**
   - Loop 内部变量隔离
   - Loop 结果收集 (`loopResults`)
   - 不同 Loop 之间数据共享

#### 前端任务

1. **数据映射面板 (DataMappingPanel.tsx)**
   - 三栏布局 (上游输出 | 映射关系 | 当前输入)
   - 拖拽交互
   - JSONPath 可视化编辑
   - 转换函数选择器

2. **控制流可视化**
   - `BranchNode` 菱形组件
   - `LoopNode` 容器组件
   - `MergeNode` 汇总组件

3. **React Flow 集成**
   - 自定义节点类型
   - 自动布局算法 (Dagre)
   - 连线样式优化

#### 验收标准

- ✅ 可以通过拖拽配置 Step 间数据映射
- ✅ Branch/Loop/Merge 节点可视化正常
- ✅ 复杂数据类型 (数组、对象) 映射正确
- ✅ 循环变量作用域隔离正确

---

### 11.3 Phase 3: 智能化与验证 (1-2周)

**优先级**: 🟢 低

**目标**: 提供智能搜索、推荐和实时验证

#### 后端任务

1. **实现智能搜索 API**
   ```go
   POST /api/action-templates/search
   // 支持模糊搜索、全文搜索、标签搜索
   ```

2. **实现推荐算法**
   ```go
   POST /api/action-templates/recommend
   // 基于协同过滤、热度、最近使用
   ```

3. **实现 Dry Run API**
   ```go
   POST /api/steps/validate
   // 无副作用的模拟执行
   ```

4. **实现验证服务**
   - Schema 验证
   - 依赖验证
   - 循环依赖检测
   - 变量引用检查

#### 前端任务

1. **智能搜索界面**
   - 搜索栏自动补全
   - 搜索结果高亮
   - 搜索历史

2. **推荐面板**
   - 基于上下文推荐
   - 热门 Actions
   - 最近使用

3. **实时验证 UI**
   - 验证状态指示器
   - 错误/警告面板
   - 修复建议

4. **Dry Run 测试按钮**
   - 模拟执行
   - 结果预览
   - 错误定位

#### 验收标准

- ✅ 搜索响应速度 < 500ms
- ✅ 推荐 Actions 准确率 > 70%
- ✅ 实时验证延迟 < 200ms
- ✅ Dry Run 成功率 > 90%

---

### 11.4 Phase 4: 双模式编辑器 (2-3周)

**优先级**: 🟡 中

**目标**: 实现 Simple Mode 和 Advanced Mode 双模式编辑

#### 前端任务

1. **Simple Mode (列表式编辑器)**
   - 基于现有 `StepCard.tsx`
   - 添加 "升级到高级模式" 按钮
   - 拖拽排序优化

2. **Advanced Mode (图形化编辑器)**
   - React Flow 完整集成
   - Action Library 侧边栏
   - Step 配置面板
   - 自动布局

3. **模式切换逻辑**
   - 检测复杂流程
   - 自动转换为 DAG
   - 保持数据一致性

4. **路由管理**
   ```
   /testcases/:id        → Simple Mode
   /workflows/:id/edit   → Advanced Mode
   ```

#### 后端任务

1. **Workflow 位置信息存储**
   - 扩展 `WorkflowStep` 添加 `position` 字段
   - 保存节点坐标

2. **自动布局 API**
   ```go
   POST /api/workflows/:id/auto-layout
   // 返回自动计算的节点位置
   ```

#### 验收标准

- ✅ Simple Mode 和 Advanced Mode 可以无缝切换
- ✅ 数据在两种模式间保持一致
- ✅ 自动布局算法生成合理的图形
- ✅ 复杂 Workflow (>10个节点) 可视化清晰

---

## 12. 技术栈总结

### 12.1 后端技术

| 组件 | 技术选型 | 说明 |
|------|---------|------|
| **框架** | Gin | HTTP 框架 |
| **ORM** | GORM | 数据库 ORM |
| **数据库** | PostgreSQL / SQLite | 支持 JSONB 类型 |
| **JSON 处理** | `tidwall/gjson` | JSONPath 查询 |
| **图算法** | 自实现 | DAG 拓扑排序 |
| **并发** | Goroutine + WaitGroup | 并行执行 |

### 12.2 前端技术

| 组件 | 技术选型 | 说明 |
|------|---------|------|
| **框架** | React 19 + TypeScript | UI 框架 |
| **构建工具** | Vite | 开发服务器 |
| **图形引擎** | React Flow | DAG 可视化 |
| **拖拽** | react-beautiful-dnd | 列表拖拽排序 |
| **布局算法** | Dagre | 自动布局 |
| **状态管理** | React Hooks | 本地状态 |
| **HTTP 客户端** | Fetch API | API 请求 |

---

## 13. 附录

### 13.1 参考文档

- [DATABASE_DESIGN.md](./DATABASE_DESIGN.md) - 数据库设计文档
- [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) - API 文档
- [STEP_CONTROL_FLOW_DESIGN.md](./STEP_CONTROL_FLOW_DESIGN.md) - 控制流设计
- [TESTCASE_WORKFLOW_INTEGRATION.md](./TESTCASE_WORKFLOW_INTEGRATION.md) - Workflow 集成

### 13.2 相关 Issue

- 用户登录 Action 复用问题
- Step 间数据映射交互优化
- 多租户 Action 共享机制

### 13.3 变更记录

| 版本 | 日期 | 作者 | 变更内容 |
|------|------|------|---------|
| v1.0.0 | 2025-11-24 | AI Assistant | 初始版本 |

---

**文档结束**
