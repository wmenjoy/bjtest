# 测试用例与工作流架构设计

**日期**: 2025-11-23
**状态**: 设计中

---

## 📊 当前问题分析

### 数据现状
```
Test Cases: 15 (all HTTP/command, no workflow links)
Workflows: 23 (all standalone automation)
Relationship: 0 (completely disconnected!)
```

### 问题根源
1. **概念混淆**: 工作流被当作独立实体，而非测试用例的执行方式
2. **数据断裂**: 没有建立 Test Case → Workflow 的关联
3. **使用困惑**: 用户不知道该用 TestCaseManager 还是 ScriptLab

---

## 🎯 第一性原则设计

### 核心概念

```
┌─────────────────────────────────────────────────┐
│                TEST CASE (测试用例)               │
│  - What: 我要测试什么                             │
│  - Why: 为什么要测试                              │
│  - Metadata: 优先级、标签、所属组                   │
└─────────────────────────────────────────────────┘
                        │
                        │ links to
                        ▼
┌─────────────────────────────────────────────────┐
│                WORKFLOW (工作流)                  │
│  - How: 如何自动化执行                            │
│  - Steps: HTTP请求、命令、断言                     │
│  - Variables: 输入输出变量                        │
└─────────────────────────────────────────────────┘
```

### 关系模型

| Test Case Type | Workflow Relationship |
|----------------|----------------------|
| Manual (手动) | No workflow, human executes steps |
| HTTP (简单API) | Inline config, no separate workflow |
| Command (命令) | Inline config, no separate workflow |
| Workflow (自动化) | References external workflow by ID |

---

## 📋 详细设计方案

### Phase 1: 数据清理与关联 (High Priority)

#### 1.1 为每个工作流创建对应测试用例

**策略**: 每个工作流应该有一个"父"测试用例来组织和执行它

```sql
-- 为现有 23 个工作流创建对应的测试用例
-- 命名规范: TC-{workflow-name}
-- 类型: workflow
-- workflow_id: 关联到对应工作流
```

**示例转换**:
```
Workflow: self-test-testcase-complete
    ↓
Test Case: TC-TestCase-API-Complete
  - name: TestCase API Complete Test
  - type: workflow
  - workflow_id: self-test-testcase-complete
  - group_id: api-tests
  - priority: P1
```

#### 1.2 整理现有测试用例

**保留并增强**:
- health-check → TC-Health-Check (HTTP type)
- database-connection → TC-Database-Connection (Command type)
- api-response-time → TC-API-Response-Time (HTTP type)

**删除重复**:
- test-health-check (duplicate of health-check)
- base-images-* (move to dedicated group)

---

### Phase 2: UI 重新设计

#### 2.1 TestCaseManager 增强

**主视图**:
```
┌──────────────────────────────────────────────────────┐
│ [Folders]  │ [Test Cases List]     │ [Detail Panel]   │
│            │                       │                  │
│ ▼ API Tests│ ● TC-Health-Check    │ ┌──────────────┐ │
│   ▼ Core   │   Type: HTTP         │ │ Test Info    │ │
│     ...    │   Status: Active     │ │              │ │
│            │                       │ │ Steps/Config │ │
│ ▼ Self-Test│ ● TC-TestCase-API    │ │              │ │
│   ▼ v1     │   Type: Workflow     │ │ [Run] [Edit] │ │
│     ...    │   Workflow: linked   │ └──────────────┘ │
└──────────────────────────────────────────────────────┘
```

**Type 指示器**:
- 🌐 HTTP - 简单 API 测试
- 💻 Command - 命令行测试
- ⚙️ Workflow - 工作流自动化

**Detail Panel 根据类型显示**:

**HTTP Type**:
```
┌─────────────────────────┐
│ HTTP Configuration      │
├─────────────────────────┤
│ Method: GET             │
│ URL: /api/health        │
│ Headers: {...}          │
│ Body: {...}             │
│                         │
│ Assertions:             │
│ - status == 200         │
│ - body.status == "ok"   │
└─────────────────────────┘
```

**Workflow Type**:
```
┌─────────────────────────┐
│ Linked Workflow         │
├─────────────────────────┤
│ Name: TestCase API Test │
│ Steps: 8                │
│ Last Run: 2h ago        │
│ Status: ✅ Passed        │
│                         │
│ [View Workflow]         │
│ [Edit Workflow]         │
│ [View History]          │
└─────────────────────────┘
```

#### 2.2 ScriptLab 定位调整

**从**: 独立的工作流管理
**到**: 工作流编辑器（从 TestCaseManager 跳转）

**入口点**:
1. TestCaseManager → 选择 Workflow 类型用例 → Edit Workflow
2. 创建新测试用例 → 选择 Workflow 类型 → 创建/选择工作流

**ScriptLab 功能**:
- 可视化工作流编辑器
- 步骤配置
- 变量管理
- 测试执行
- 执行历史

#### 2.3 新增功能: Test Definition Editor

**TestCaseManager → Edit → 根据类型显示不同编辑器**

**HTTP Editor**:
```tsx
<HTTPTestEditor
  method, url, headers, body
  assertions[]
  onSave={updateCase}
/>
```

**Command Editor**:
```tsx
<CommandTestEditor
  command, args, timeout
  expectedOutput
  onSave={updateCase}
/>
```

**Workflow Selector**:
```tsx
<WorkflowSelector
  currentWorkflowId
  workflows[]
  onSelect={linkWorkflow}
  onCreate={openScriptLab}
/>
```

---

### Phase 3: 执行与验证

#### 3.1 统一执行入口

**所有测试从 TestCaseManager 执行**:

```tsx
// TestRunner 根据类型选择执行方式
switch (testCase.type) {
  case 'http':
    return <HTTPTestRunner config={testCase.http} />;
  case 'command':
    return <CommandTestRunner config={testCase.command} />;
  case 'workflow':
    return <WorkflowRunner workflowId={testCase.workflowId} />;
}
```

#### 3.2 执行结果统一展示

```
┌─────────────────────────────────────────┐
│ Test Run Result                         │
├─────────────────────────────────────────┤
│ Test Case: TC-TestCase-API-Complete     │
│ Type: Workflow                          │
│ Status: ✅ Passed                        │
│ Duration: 2.3s                          │
│ Environment: Development                │
│                                         │
│ Steps:                                  │
│ 1. ✅ Create Test Case (0.3s)           │
│ 2. ✅ Get Test Case (0.2s)              │
│ 3. ✅ Update Test Case (0.3s)           │
│ 4. ✅ List Test Cases (0.5s)            │
│ 5. ✅ Delete Test Case (0.2s)           │
│                                         │
│ [View Logs] [Re-run] [Export]           │
└─────────────────────────────────────────┘
```

---

## 🗂️ 数据迁移计划

### Step 1: 创建测试用例组织结构

```sql
-- 创建分组
INSERT INTO test_groups (group_id, name, project_id) VALUES
('api-self-tests', 'API Self Tests', 'default'),
('error-handling', 'Error Handling Tests', 'default'),
('core-health', 'Core Health Checks', 'default');
```

### Step 2: 为工作流创建测试用例

```javascript
// 自动创建脚本
const workflowsToTestCases = [
  // API 自测试
  { workflow: 'self-test-testcase-complete', group: 'api-self-tests', name: 'TestCase API Complete', priority: 'P1' },
  { workflow: 'self-test-testgroup-complete', group: 'api-self-tests', name: 'TestGroup API Complete', priority: 'P1' },
  { workflow: 'self-test-environment-api', group: 'api-self-tests', name: 'Environment API Complete', priority: 'P1' },
  { workflow: 'self-test-workflow-execution-api', group: 'api-self-tests', name: 'Workflow Execution API', priority: 'P1' },
  { workflow: 'self-test-results-api', group: 'api-self-tests', name: 'Test Results API', priority: 'P2' },

  // 错误处理测试
  { workflow: 'self-test-error-handling', group: 'error-handling', name: 'Error Handling Tests', priority: 'P2' },
  { workflow: 'self-test-404-not-found', group: 'error-handling', name: '404 Not Found Tests', priority: 'P2' },
  { workflow: 'self-test-400-bad-request', group: 'error-handling', name: '400 Bad Request Tests', priority: 'P2' },
  { workflow: 'self-test-409-conflict', group: 'error-handling', name: '409 Conflict Tests', priority: 'P2' },

  // 其他
  { workflow: 'platform-self-test-v1', group: 'core-health', name: 'Platform Self Test', priority: 'P0' },
  { workflow: 'action-feature-test-v1', group: 'core-health', name: 'Action Feature Test', priority: 'P1' },
];
```

### Step 3: 清理重复数据

```sql
-- 删除重复/过时的测试用例
DELETE FROM test_cases WHERE test_id IN (
  'test-health-check',  -- duplicate
  'curl-test-001',      -- test artifact
  'test-default-001',   -- test artifact
  'test-tenant-001'     -- test artifact
);

-- 删除过时的工作流版本
DELETE FROM workflows WHERE workflow_id LIKE '%-v2'
  OR workflow_id LIKE '%-v3'
  OR workflow_id LIKE '%-v4'
  OR workflow_id LIKE '%-v5'
  OR workflow_id LIKE '%-v6';
```

---

## 🧪 测试验证计划

### Phase 1 验证: 数据完整性

- [ ] 每个工作流都有对应的测试用例
- [ ] 测试用例数量 >= 工作流数量
- [ ] workflow_id 关联正确
- [ ] 分组结构清晰

### Phase 2 验证: UI 功能

- [ ] TestCaseManager 显示所有测试用例
- [ ] Type 图标正确显示
- [ ] Detail Panel 根据类型显示不同内容
- [ ] Workflow 类型显示关联的工作流信息

### Phase 3 验证: 执行功能

- [ ] HTTP 类型可以直接执行
- [ ] Command 类型可以直接执行
- [ ] Workflow 类型调用 WorkflowRunner
- [ ] 执行结果正确保存
- [ ] 历史记录可查看

### End-to-End 测试场景

**场景 1: 创建新的 HTTP 测试用例**
1. TestCaseManager → New
2. 选择 HTTP 类型
3. 配置 URL, Method, Headers
4. 添加断言
5. 保存
6. 运行测试
7. 查看结果

**场景 2: 创建新的 Workflow 测试用例**
1. TestCaseManager → New
2. 选择 Workflow 类型
3. 选择现有工作流 或 创建新工作流
4. 配置输入变量
5. 保存
6. 运行测试（调用 WorkflowRunner）
7. 查看实时日志
8. 查看结果和步骤详情

**场景 3: 批量执行测试组**
1. 选择测试组 "API Self Tests"
2. 点击 "Run All"
3. 并行/串行执行所有测试
4. 查看汇总报告

---

## 📈 实施优先级

### 高优先级 (本次实施)
1. ✅ 数据清理和关联建立
2. ✅ TestCaseManager Detail Panel 增强
3. ✅ 统一执行入口

### 中优先级 (下次迭代)
1. HTTP/Command 编辑器完善
2. Workflow 选择器
3. 批量执行功能

### 低优先级 (未来)
1. 测试报告导出
2. CI/CD 集成
3. 定时执行

---

## 📝 文件修改清单

### 数据迁移
- [ ] 创建迁移脚本 `migrations/006_link_workflows_to_testcases.sql`
- [ ] 创建数据导入 JSON `examples/workflow-testcases.json`

### 前端修改
- [ ] `components/testcase/CaseDetail.tsx` - 根据类型显示不同内容
- [ ] `components/testcase/CaseList.tsx` - 添加类型图标
- [ ] `components/TestCaseManager.tsx` - 统一执行入口
- [ ] `components/TestRunner.tsx` - 路由到正确的执行器

### API 适配
- [ ] `services/api/testApi.ts` - 加载工作流关联信息
- [ ] `hooks/useApiState.ts` - 关联工作流数据

---

**创建时间**: 2025-11-23
**状态**: 待实施
**下一步**: 执行数据迁移，建立 Test Case → Workflow 关联
