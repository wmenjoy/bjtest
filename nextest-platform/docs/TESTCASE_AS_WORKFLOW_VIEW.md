# TestCase = Workflow + 测试视角

**核心洞察**: 案例库是工作流的另一种视角/包装

---

## 本质分析

### 工作流是什么？

```
Workflow = 步骤定义 + 执行顺序 + 变量传递 + 执行引擎
```

### 测试案例是什么？

```
TestCase = Workflow + 测试元数据 + 断言 + 传统文字描述
```

### 关系图

```
┌─────────────────────────────────────────────────────────────┐
│                      TestCase (测试视角)                     │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ 测试元数据 (传统案例管理需要的)                          │ │
│  │  - 测试目标/目的 (为什么测这个？)                        │ │
│  │  - 优先级 P0/P1/P2                                      │ │
│  │  - 标签、分组、模块                                      │ │
│  │  - 前置条件描述 (文字)                                   │ │
│  │  - 预期结果描述 (文字)                                   │ │
│  │  - 负责人、评审状态                                      │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ 断言定义 (验证点)                                        │ │
│  │  - 状态码断言、响应时间断言、数据断言...                  │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ 执行定义 = Workflow                                      │ │
│  │  ┌──────────────────────────────────────────────────┐  │ │
│  │  │           现有工作流引擎                          │  │ │
│  │  │  Step 1 → Step 2 → Step 3 → ... → Step N        │  │ │
│  │  │  (HTTP)   (Command)  (Assert)    (HTTP)          │  │ │
│  │  └──────────────────────────────────────────────────┘  │ │
│  │                                                         │ │
│  │  或者: 传统手工步骤 (纯文字描述)                         │ │
│  │  ┌──────────────────────────────────────────────────┐  │ │
│  │  │ 步骤1: 打开登录页面                               │  │ │
│  │  │ 步骤2: 输入用户名 admin                          │  │ │
│  │  │ 步骤3: 输入密码 ******                           │  │ │
│  │  │ 步骤4: 点击登录按钮                               │  │ │
│  │  │ 预期: 跳转到首页，显示欢迎信息                     │  │ │
│  │  └──────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 统一数据模型

### TestCase (唯一核心实体)

```typescript
interface TestCase {
  // ========== 测试元数据 (传统案例管理) ==========
  id: string;
  title: string;                    // 用例标题
  objective: string;                // 测试目标 (为什么要测？)
  description: string;              // 详细描述

  // 分类
  moduleId: string;                 // 所属模块
  tags: string[];                   // 标签
  priority: 'P0' | 'P1' | 'P2' | 'P3';

  // 状态管理
  status: 'draft' | 'review' | 'approved' | 'deprecated';
  owner: string;                    // 负责人
  reviewer: string;                 // 评审人

  // 传统文字描述
  preconditionText: string;         // 前置条件 (文字)
  expectedResultText: string;       // 预期结果 (文字)

  // ========== 执行定义 (两种模式) ==========
  executionMode: 'MANUAL' | 'AUTOMATED' | 'HYBRID';

  // 模式1: 手工步骤 (纯文字)
  manualSteps?: ManualStep[];

  // 模式2: 自动化 (复用 Workflow)
  automationConfig?: {
    // 方式A: 引用外部工作流
    workflowId?: string;

    // 方式B: 内联定义 (简单场景)
    inlineWorkflow?: WorkflowDefinition;

    // 输入参数映射
    inputMappings?: Record<string, any>;
  };

  // ========== 断言定义 ==========
  assertions: Assertion[];

  // ========== 审计信息 ==========
  createdAt: string;
  updatedAt: string;
  version: number;
}

// 手工测试步骤 (传统文字)
interface ManualStep {
  order: number;
  action: string;           // 操作步骤描述
  expectedResult: string;   // 预期结果描述
  notes?: string;           // 备注
}

// 断言 (自动化验证点)
interface Assertion {
  id: string;
  name: string;             // "返回状态码应为200"
  type: AssertionType;
  target: string;           // "response.status"
  operator: Operator;
  expectedValue: any;
  severity: 'critical' | 'major' | 'minor';
}
```

---

## 三种执行模式

### 模式 1: 纯手工测试 (MANUAL)

```
TestCase
├── manualSteps: [
│   { action: "打开登录页", expected: "页面正常显示" },
│   { action: "输入用户名", expected: "输入框接受输入" },
│   { action: "点击登录", expected: "跳转到首页" }
│ ]
├── automationConfig: null
└── assertions: []  // 手工测试不需要自动断言

执行方式: 测试人员按步骤手工执行，逐步标记通过/失败
```

### 模式 2: 纯自动化测试 (AUTOMATED)

```
TestCase
├── manualSteps: []
├── automationConfig: {
│   workflowId: "login-workflow-001"  // 引用工作流
│ }
└── assertions: [
    { name: "状态码200", target: "response.status", expected: 200 },
    { name: "返回token", target: "response.body.token", operator: "EXISTS" }
  ]

执行方式: 调用工作流引擎执行，自动评估断言
```

### 模式 3: 混合测试 (HYBRID)

```
TestCase
├── manualSteps: [
│   { action: "验证UI显示正确", expected: "无样式错乱" }  // 人工检查
│ ]
├── automationConfig: {
│   workflowId: "api-test-001"  // 自动化部分
│ }
└── assertions: [...]

执行方式: 先执行自动化部分，再提示人工检查手工步骤
```

---

## UI 设计

### TestCase 编辑器 - 统一界面

```
┌─────────────────────────────────────────────────────────────────┐
│  编辑测试用例: TC-001-用户登录测试                    [保存] [取消]│
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─ 基本信息 ─────────────────────────────────────────────────┐ │
│  │ 标题:    [用户登录测试                              ]      │ │
│  │ 模块:    [用户管理 ▼]     优先级: [P1 ▼]                   │ │
│  │ 标签:    [login] [auth] [+ 添加]                           │ │
│  │ 负责人:  [张三 ▼]         状态:   [待评审 ▼]               │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌─ 测试目标 ─────────────────────────────────────────────────┐ │
│  │ [验证用户使用正确的用户名和密码可以成功登录系统，          ] │ │
│  │ [并获取有效的访问令牌。                                   ] │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌─ 前置条件 ─────────────────────────────────────────────────┐ │
│  │ [1. 测试环境已启动                                        ] │ │
│  │ [2. 测试用户 test@example.com 已存在                      ] │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌─ 执行定义 ─────────────────────────────────────────────────┐ │
│  │                                                             │ │
│  │  执行模式: (●) 自动化  ( ) 手工  ( ) 混合                  │ │
│  │                                                             │ │
│  │  ┌─ 自动化配置 ──────────────────────────────────────────┐ │ │
│  │  │ 工作流:  [login-api-test ▼]  [创建新工作流] [编辑]    │ │ │
│  │  │                                                       │ │ │
│  │  │ 或 快速配置:                                          │ │ │
│  │  │ ┌──────────────────────────────────────────────────┐ │ │ │
│  │  │ │ 类型: [HTTP ▼]                                    │ │ │ │
│  │  │ │ 方法: [POST ▼]  URL: [/api/auth/login        ]   │ │ │ │
│  │  │ │ Body: { "username": "{{user}}", "password": "{{pwd}}" } │ │ │
│  │  │ └──────────────────────────────────────────────────┘ │ │ │
│  │  └───────────────────────────────────────────────────────┘ │ │
│  │                                                             │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌─ 验证点 (断言) ────────────────────────────────────────────┐ │
│  │                                                             │ │
│  │  ✓ #1 [返回状态码200           ] [response.status] [=] [200]│ │
│  │  ✓ #2 [返回JWT Token          ] [response.body.token] [存在]│ │
│  │  ✓ #3 [响应时间<500ms          ] [response.time] [<] [500] │ │
│  │                                                             │ │
│  │  [+ 添加验证点]                                             │ │
│  │                                                             │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌─ 预期结果 (文字描述) ──────────────────────────────────────┐ │
│  │ [登录成功，返回有效的JWT Token，可用于后续接口鉴权         ] │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 关键设计点

1. **执行模式选择**: 用户明确选择是手工、自动化还是混合
2. **工作流复用**: 自动化测试可以选择已有工作流，或快速创建简单配置
3. **验证点可视化**: 断言以表格形式展示，易于理解和编辑
4. **传统信息保留**: 测试目标、前置条件、预期结果等文字描述仍然保留

---

## 数据库设计

### 统一的 test_cases 表

```sql
CREATE TABLE test_cases (
    -- 主键
    test_id VARCHAR(36) PRIMARY KEY,

    -- ===== 测试元数据 =====
    title VARCHAR(200) NOT NULL,
    objective TEXT,                      -- 测试目标
    description TEXT,

    -- 分类
    module_id VARCHAR(36),               -- 所属模块
    group_id VARCHAR(36),                -- 所属分组
    tags JSON,                           -- 标签数组
    priority VARCHAR(10) DEFAULT 'P2',   -- P0/P1/P2/P3

    -- 状态管理
    status VARCHAR(20) DEFAULT 'draft',  -- draft/review/approved/deprecated
    owner VARCHAR(100),
    reviewer VARCHAR(100),

    -- 传统文字描述
    precondition_text TEXT,              -- 前置条件文字
    expected_result_text TEXT,           -- 预期结果文字

    -- ===== 执行定义 =====
    execution_mode VARCHAR(20) NOT NULL, -- MANUAL/AUTOMATED/HYBRID

    -- 手工步骤 (JSON数组)
    manual_steps JSON,
    -- 示例: [{"order":1,"action":"打开页面","expected":"显示正常"}]

    -- 自动化配置
    workflow_id VARCHAR(36),             -- 引用外部工作流
    inline_workflow JSON,                -- 内联工作流定义 (简单场景)
    input_mappings JSON,                 -- 输入参数映射

    -- ===== 断言定义 =====
    assertions JSON,
    -- 示例: [{"id":"a1","name":"状态码","target":"response.status","operator":"EQUALS","expected":200}]

    -- ===== 审计 =====
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    version INT DEFAULT 1,

    -- 外键
    FOREIGN KEY (workflow_id) REFERENCES workflows(workflow_id),
    FOREIGN KEY (module_id) REFERENCES test_groups(group_id)
);

-- 索引
CREATE INDEX idx_testcase_module ON test_cases(module_id);
CREATE INDEX idx_testcase_status ON test_cases(status);
CREATE INDEX idx_testcase_priority ON test_cases(priority);
```

---

## 执行流程

### 统一执行入口

```go
func (e *TestCaseExecutor) Execute(ctx context.Context, testCaseID string) (*TestExecution, error) {
    tc := e.loadTestCase(testCaseID)

    exec := e.createExecution(tc)

    switch tc.ExecutionMode {
    case "MANUAL":
        // 返回手工步骤列表，等待人工逐步标记
        return exec, nil  // 状态: pending_manual

    case "AUTOMATED":
        // 执行工作流
        workflowResult := e.executeWorkflow(tc)
        // 评估断言
        assertionResults := e.evaluateAssertions(tc.Assertions, workflowResult)
        // 更新执行结果
        exec.Status = e.calculateStatus(assertionResults)
        return exec, nil

    case "HYBRID":
        // 先执行自动化部分
        workflowResult := e.executeWorkflow(tc)
        assertionResults := e.evaluateAssertions(tc.Assertions, workflowResult)
        // 返回，等待人工检查手工步骤
        exec.AutomationResults = assertionResults
        exec.Status = "pending_manual"  // 等待人工确认
        return exec, nil
    }
}
```

---

## 总结

### 核心思想

```
TestCase = Workflow (执行引擎) + 测试视角 (元数据+断言+文字描述)
```

### 关键优势

1. **复用工作流引擎** - 不重复造轮子
2. **支持传统案例管理** - 文字描述、手工步骤保留
3. **灵活的执行模式** - 手工/自动化/混合
4. **统一数据模型** - 一张表管理所有类型
5. **渐进式自动化** - 先手工，逐步自动化

### 与现有系统的关系

| 概念 | 定位 |
|------|------|
| Workflow | 底层执行引擎，纯技术实现 |
| TestCase | 高层测试视角，面向测试人员 |
| Workflow UI (ScriptLab) | 工作流编辑器，技术人员使用 |
| TestCase UI | 测试用例管理，测试人员使用 |
