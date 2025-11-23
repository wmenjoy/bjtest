# TestCase 系统重新设计 - 第一性原理

**日期**: 2025-11-23
**状态**: 设计中
**目标**: 构建一个清晰、可审核、可维护的测试案例系统

---

## 🎯 第一性原理：测试用例的本质

### 测试用例是什么？

从本质上讲，一个测试用例是：

```
测试用例 = 前置条件 + 执行步骤 + 预期结果 + 验证断言 + 实际结果
```

**核心目标**：
1. **可重复性** - 任何人都能按照相同步骤得到相同结果
2. **可验证性** - 明确的断言判断通过/失败
3. **可追溯性** - 执行过程可回溯、可审核
4. **可理解性** - 测试目的、方法、结果一目了然

---

## 👥 用户角色分析

### 测试工程师的需求

1. **编写测试用例**
   - 明确的测试目标和场景描述
   - 清晰的前置条件（环境、数据）
   - 易于编辑的步骤定义
   - 明确的验证点和断言

2. **执行测试**
   - 一键执行，实时查看进度
   - 每个步骤的执行状态可见
   - 断言结果清晰展示
   - 失败时快速定位问题

3. **审核测试结果**
   - 完整的执行日志
   - 每个断言的对比结果（期望 vs 实际）
   - 失败原因分析
   - 截图/录屏（UI测试）

4. **维护测试用例**
   - 版本控制
   - 复制/修改已有用例
   - 批量更新共同部分

### 研发工程师的需求

1. **理解测试意图**
   - 这个用例在测什么？（业务场景）
   - 为什么失败？（根因分析）
   - 如何复现？（环境、数据、步骤）

2. **调试失败用例**
   - 查看完整的 Request/Response
   - 查看每个步骤的变量值
   - 查看数据流转过程

3. **集成到 CI/CD**
   - 命令行执行
   - 机器可读的结果
   - 失败自动通知

---

## ❌ 当前系统的问题分析

### 问题 1：工作流绑定的测试用例看不到执行过程

**根本原因**：将执行委托给 WorkflowRunner，但没有同步执行状态回测试用例

**后果**：
- 测试工程师无法审核每个步骤的执行情况
- 无法判断是哪个步骤失败的
- 无法查看中间变量

### 问题 2：测试案例的运行是假的运行

**根本原因**：前端模拟执行，没有真正调用后端 API

**后果**：
- 结果不可信
- 无法验证真实系统行为
- 浪费测试工程师时间

### 问题 3：测试目标/断言在详情页无法展示

**根本原因**：数据模型中缺少 assertions 字段的展示逻辑

**后果**：
- 不知道这个用例在验证什么
- 无法判断测试是否充分

### 问题 4：详情页全屏效果不好

**根本原因**：UX 设计问题，没有考虑信息层级和上下文切换

**后果**：
- 无法快速在多个用例间切换
- 失去了文件树导航的上下文

### 问题 5：Step 的条件分支、循环编辑很难用

**根本原因**：UI 没有针对复杂逻辑提供可视化编辑

**后果**：
- 只能写 JSON 代码，学习成本高
- 容易出错，难以调试

### 问题 6：不同 Step 的参数传递不清楚

**根本原因**：缺少数据流可视化

**后果**：
- 不知道变量来自哪里
- 不知道变量被谁使用
- 调试困难

---

## 🏗️ 重新设计方案

### 核心设计原则

1. **关注点分离**
   - TestCase = 测试定义（What to test）
   - TestExecution = 测试执行（How it was tested）
   - TestResult = 测试结果（What happened）

2. **显式优于隐式**
   - 明确的前置条件
   - 明确的断言
   - 明确的数据流

3. **可视化优于文本**
   - 图形化展示数据流
   - 步骤执行状态可视化
   - 断言结果对比可视化

---

## 📊 数据模型重新设计

### TestCase（测试用例定义）

```typescript
interface TestCase {
  // ===== 元数据 =====
  id: string;
  title: string;                    // 用例标题
  description: string;               // 详细描述
  objective: string;                 // 测试目标（这个用例要验证什么？）
  tags: string[];
  priority: Priority;
  status: Status;

  // ===== 前置条件 =====
  preconditions: {
    environment?: string;            // 需要的环境
    dataSetup?: string[];            // 需要准备的数据
    dependencies?: string[];         // 依赖的其他用例
  };

  // ===== 测试定义 =====
  type: 'HTTP' | 'WORKFLOW' | 'MANUAL' | 'DATABASE' | 'UI';

  // 方式 1: 简单 HTTP 测试
  httpConfig?: {
    method: string;
    url: string;
    headers?: Record<string, string>;
    body?: any;
  };

  // 方式 2: 复杂工作流测试
  workflowId?: string;               // 引用工作流定义

  // 方式 3: 手动测试步骤
  steps?: TestStep[];

  // ===== 验证点（核心！）=====
  assertions: Assertion[];           // 明确的断言列表

  // ===== 输入输出 =====
  inputs?: TestInput[];              // 测试输入参数
  expectedOutputs?: ExpectedOutput[]; // 预期输出

  // ===== 审计信息 =====
  createdBy: string;
  createdAt: string;
  lastModifiedBy: string;
  lastModifiedAt: string;
  version: number;
}
```

### Assertion（断言定义）

```typescript
interface Assertion {
  id: string;
  name: string;                      // 断言名称：如 "返回状态码应为 200"
  type: AssertionType;               // 断言类型
  target: string;                    // 断言目标：如 "response.status"
  operator: ComparisonOperator;      // 比较操作符
  expectedValue: any;                // 期望值
  description?: string;              // 说明
  severity: 'CRITICAL' | 'MAJOR' | 'MINOR'; // 严重程度
}

type AssertionType =
  | 'STATUS_CODE'      // HTTP 状态码
  | 'RESPONSE_TIME'    // 响应时间
  | 'JSON_FIELD'       // JSON 字段值
  | 'JSON_SCHEMA'      // JSON Schema 验证
  | 'CONTAINS'         // 包含某文本
  | 'REGEX'            // 正则匹配
  | 'DATABASE_RECORD'  // 数据库记录
  | 'CUSTOM';          // 自定义脚本

type ComparisonOperator =
  | 'EQUALS' | 'NOT_EQUALS'
  | 'GREATER_THAN' | 'LESS_THAN'
  | 'CONTAINS' | 'NOT_CONTAINS'
  | 'MATCHES' | 'NOT_MATCHES'
  | 'EXISTS' | 'NOT_EXISTS';
```

### TestExecution（测试执行记录）

```typescript
interface TestExecution {
  id: string;
  testCaseId: string;
  testCaseVersion: number;           // 用例版本快照

  // ===== 执行信息 =====
  status: 'RUNNING' | 'PASSED' | 'FAILED' | 'BLOCKED' | 'SKIPPED';
  startTime: string;
  endTime?: string;
  duration?: number;

  // ===== 执行环境 =====
  environment: {
    name: string;
    variables: Record<string, any>;
  };

  // ===== 执行者 =====
  executedBy: 'USER' | 'SCHEDULER' | 'CI_CD';
  executor: string;                  // 用户名或系统名

  // ===== 步骤执行详情 =====
  stepExecutions: StepExecution[];

  // ===== 断言结果 =====
  assertionResults: AssertionResult[];

  // ===== 日志和附件 =====
  logs: ExecutionLog[];
  attachments?: Attachment[];        // 截图、录屏等

  // ===== 失败信息 =====
  failureReason?: string;
  errorMessage?: string;
  stackTrace?: string;
}
```

### StepExecution（步骤执行详情）

```typescript
interface StepExecution {
  stepId: string;
  stepName: string;
  status: 'PENDING' | 'RUNNING' | 'PASSED' | 'FAILED' | 'SKIPPED';
  startTime: string;
  endTime?: string;
  duration?: number;

  // ===== 输入输出 =====
  inputs: Record<string, any>;       // 步骤输入参数
  outputs: Record<string, any>;      // 步骤输出结果

  // ===== HTTP 详情 =====
  httpRequest?: {
    method: string;
    url: string;
    headers: Record<string, string>;
    body?: any;
  };
  httpResponse?: {
    statusCode: number;
    headers: Record<string, string>;
    body: any;
    responseTime: number;
  };

  // ===== 命令执行详情 =====
  commandExecution?: {
    command: string;
    exitCode: number;
    stdout: string;
    stderr: string;
  };

  // ===== 日志 =====
  logs: string[];

  // ===== 错误信息 =====
  error?: {
    message: string;
    type: string;
    stackTrace?: string;
  };
}
```

### AssertionResult（断言结果）

```typescript
interface AssertionResult {
  assertionId: string;
  assertionName: string;
  status: 'PASSED' | 'FAILED' | 'SKIPPED';

  // ===== 对比信息 =====
  expectedValue: any;
  actualValue: any;
  difference?: any;                  // 差异详情

  // ===== 执行信息 =====
  evaluatedAt: string;
  message: string;                   // 结果消息

  // ===== 调试信息 =====
  context?: Record<string, any>;     // 断言执行时的上下文
}
```

---

## 🎨 UI/UX 重新设计

### 1. TestCase 详情页 - 三栏布局

```
┌────────────────────────────────────────────────────────────────┐
│  [< Back]  Test Case: API-001-用户登录                          │
├──────────────┬────────────────────────────┬────────────────────┤
│              │                            │                    │
│  左侧导航    │      中间内容区              │   右侧属性面板      │
│  (固定)      │      (主要内容)             │   (可折叠)         │
│              │                            │                    │
│  📋 Overview │  [Overview Tab Content]    │  Properties        │
│  🎯 Assertion│                            │  - Priority: P1    │
│  🔄 Steps    │  Test Objective:           │  - Status: Active  │
│  📊 History  │  验证用户使用正确的用户名...   │  - Tags: [...]     │
│  ⚙️  Config  │                            │                    │
│              │  Preconditions:            │  Quick Actions     │
│              │  - Environment: Dev         │  [▶ Run]          │
│              │  - Test User exists        │  [📝 Edit]        │
│              │                            │  [📋 Clone]       │
│              │  Inputs:                   │                    │
│              │  - username: test@ex.com   │  Related          │
│              │  - password: ********      │  - Workflow: w-01  │
│              │                            │  - History: 15 runs│
└──────────────┴────────────────────────────┴────────────────────┘
```

**设计原则**：
- 不全屏，保持上下文
- 左侧导航固定，快速切换视图
- 中间是主要内容区
- 右侧是属性和快捷操作

### 2. Assertion 展示 - 核心功能

```
┌─────────────────────────────────────────────────────────────────┐
│  🎯 Assertions (断言列表)                                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ ✓ #1 返回状态码应为 200                    [CRITICAL]     │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │ Target:    response.status                                │  │
│  │ Operator:  EQUALS                                         │  │
│  │ Expected:  200                                            │  │
│  │ Severity:  CRITICAL                                       │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ ✓ #2 返回 JWT Token 字段存在                [CRITICAL]     │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │ Target:    response.body.token                            │  │
│  │ Operator:  EXISTS                                         │  │
│  │ Severity:  CRITICAL                                       │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ ⚠ #3 响应时间应小于 500ms                   [MAJOR]       │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │ Target:    response.responseTime                          │  │
│  │ Operator:  LESS_THAN                                      │  │
│  │ Expected:  500                                            │  │
│  │ Severity:  MAJOR                                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  [+ Add Assertion]                                              │
└─────────────────────────────────────────────────────────────────┘
```

### 3. 执行过程展示 - 实时可审核

```
┌─────────────────────────────────────────────────────────────────┐
│  Execution: exec-20231123-001                  [⏸ Pause] [⏹ Stop]│
├─────────────────────────────────────────────────────────────────┤
│  Status: Running  |  Duration: 2.3s  |  Progress: 60%           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Step Timeline (可展开每个步骤查看详情)                            │
│                                                                  │
│  ✓ Step 1: 获取登录 Token                        0.5s            │
│    ├─ Request:  POST /api/auth/login                           │
│    ├─ Response: 200 OK                                          │
│    ├─ Output:   token = "eyJhbGc..."                           │
│    └─ [View Details] [View Request/Response]                   │
│                                                                  │
│  ✓ Step 2: 使用 Token 访问用户信息               0.3s            │
│    ├─ Request:  GET /api/user/profile                          │
│    │            Authorization: Bearer {{token}}                │
│    ├─ Response: 200 OK                                          │
│    ├─ Output:   userId = "123", userName = "test"             │
│    └─ [View Details]                                           │
│                                                                  │
│  🔄 Step 3: 验证权限访问                         Running...      │
│    ├─ Request:  GET /api/admin/dashboard                       │
│    └─ Status:   Waiting for response...                        │
│                                                                  │
│  ⏹ Step 4: 退出登录                             Pending          │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│  Assertion Results                                              │
│                                                                  │
│  ✓ #1 返回状态码应为 200           PASSED                        │
│     Expected: 200  |  Actual: 200  ✓                           │
│                                                                  │
│  ✓ #2 JWT Token 字段存在            PASSED                       │
│     Expected: EXISTS  |  Actual: "eyJhbGc..."  ✓               │
│                                                                  │
│  ⏹ #3 响应时间应小于 500ms          Pending                      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 4. 数据流可视化 - 参数传递清晰

```
┌─────────────────────────────────────────────────────────────────┐
│  Data Flow View (数据流视图)                                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   [INPUT]                                                       │
│   username ──────────────┐                                      │
│   password ──────────┐   │                                      │
│                      │   │                                      │
│   ┌─────────────────────────────────┐                          │
│   │  Step 1: Login API              │                          │
│   │  POST /api/auth/login           │                          │
│   │  Body: {username, password}  ◄──┴──────                    │
│   └─────────────────────────────────┘                          │
│              │                                                  │
│              │ outputs:                                         │
│              ├─ token ────────────┐                            │
│              └─ userId ────────┐  │                            │
│                                 │  │                            │
│   ┌─────────────────────────────────────┐                      │
│   │  Step 2: Get User Profile           │                      │
│   │  GET /api/user/profile              │                      │
│   │  Headers: {Authorization: token} ◄──┴──                    │
│   └─────────────────────────────────────┘                      │
│              │                                                  │
│              │ outputs:                                         │
│              └─ userProfile ────────┐                          │
│                                      │                          │
│   ┌─────────────────────────────────────┐                      │
│   │  Step 3: Verify Permissions         │                      │
│   │  Check userId in userProfile     ◄──┴──                    │
│   └─────────────────────────────────────┘                      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔧 实现优先级

### Phase 1: 数据模型和 API（2-3 天）

**目标**: 建立正确的数据基础

1. **后端改造**
   - 扩展 TestCase 模型，添加 assertions, preconditions, inputs, expectedOutputs
   - 创建 TestExecution 模型
   - 创建 StepExecution 模型
   - 创建 AssertionResult 模型

2. **执行 API**
   - `POST /api/tests/:id/execute` - 执行测试
   - `GET /api/executions/:id` - 获取执行详情
   - `GET /api/executions/:id/steps` - 获取步骤执行详情
   - `GET /api/executions/:id/assertions` - 获取断言结果
   - `WS /api/executions/:id/stream` - 实时推送执行状态

3. **断言引擎**
   - 实现各种断言类型的验证逻辑
   - JSON Path 支持
   - 正则表达式支持
   - 自定义脚本支持

### Phase 2: TestCase 详情页重构（2-3 天）

**目标**: 清晰展示测试定义

1. **三栏布局**
   - 左侧导航（Overview, Assertions, Steps, History, Config）
   - 中间内容区（根据导航显示不同内容）
   - 右侧属性面板（可折叠）

2. **Assertion 编辑器**
   - 可视化添加断言
   - 断言模板
   - 实时验证

3. **数据流可视化**
   - 显示 Step 之间的参数传递
   - 高亮显示变量来源和去向

### Phase 3: 执行过程展示（2-3 天）

**目标**: 可审核的执行过程

1. **实时执行视图**
   - Step-by-Step 展示
   - 每个 Step 的 Request/Response
   - 每个 Step 的输入输出
   - 实时日志流

2. **断言结果展示**
   - 期望 vs 实际对比
   - Diff 视图
   - 失败原因分析

3. **执行历史**
   - 历史执行列表
   - 趋势分析（成功率、响应时间）
   - 失败模式分析

### Phase 4: 高级功能（3-4 天）

1. **条件分支可视化编辑**
   - 流程图编辑器
   - If/Else 可视化
   - 循环可视化

2. **变量管理**
   - 全局变量
   - 环境变量
   - 步骤变量
   - 变量作用域可视化

3. **调试工具**
   - 断点调试
   - 单步执行
   - 变量监控

---

## 📝 关键决策

### 决策 1: TestCase 定义 vs TestExecution 分离

**为什么分离？**
- TestCase 是不可变的定义（What to test）
- TestExecution 是可变的执行记录（How it was executed）
- 分离后可以追溯历史执行，版本对比

### 决策 2: Assertion 作为一等公民

**为什么重要？**
- 断言是测试的核心价值
- 明确的断言让测试目的清晰
- 断言结果是判断通过/失败的唯一标准

### 决策 3: 数据流可视化

**为什么需要？**
- 复杂测试流程中，变量传递是最容易出错的
- 可视化让调试效率提升 10 倍
- 降低学习成本

### 决策 4: 实时执行 + 历史回放

**为什么两者都需要？**
- 实时执行：测试工程师需要看到实时进度
- 历史回放：研发工程师需要复现问题
- 两者结合：完整的可追溯性

---

## 🎯 成功指标

### 用户体验指标

1. **可理解性**
   - 新用户 5 分钟内能看懂一个测试用例
   - 测试目的一目了然

2. **可审核性**
   - 5 秒内能判断测试是否通过
   - 10 秒内能定位失败原因

3. **可维护性**
   - 修改一个断言只需 30 秒
   - 复制一个用例只需 1 分钟

### 技术指标

1. **执行准确性**
   - 0% 假阳性/假阴性
   - 100% 可重复

2. **执行效率**
   - 单个用例执行时间 < 5s（简单 HTTP）
   - 复杂工作流 < 30s

3. **可扩展性**
   - 支持 10000+ 测试用例
   - 支持并发执行 100+ 用例

---

## 📚 参考案例

### 优秀的测试平台设计

1. **Postman**
   - 优点：清晰的 Request/Response 展示，强大的断言系统
   - 缺点：缺少复杂工作流支持

2. **Cypress**
   - 优点：实时执行视图，时间旅行调试
   - 缺点：限于前端测试

3. **Robot Framework**
   - 优点：关键字驱动，易于理解
   - 缺点：UI 比较简陋

### 我们的差异化

1. **统一平台** - HTTP + Workflow + Database + UI 测试
2. **实时可视化** - 执行过程完全透明
3. **AI 辅助** - 智能断言生成，失败分析

---

## 🚀 下一步行动

1. **评审这个设计文档** ✓（当前）
2. **原型设计** - 画出关键页面的原型
3. **数据库 Schema 设计** - 设计新的表结构
4. **API 设计** - 设计 RESTful API
5. **分阶段实施** - 按 Phase 1-4 执行

---

**创建时间**: 2025-11-23
**设计者**: Claude Code + User
**状态**: 待评审和反馈
