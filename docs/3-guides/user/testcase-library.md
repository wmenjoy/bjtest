# 测试案例库完整指南

**版本**: v1.0
**创建日期**: 2025-11-26
**维护状态**: ✅ 生产就绪

---

## 📋 目录

1. [概述](#概述)
2. [测试案例库结构](#测试案例库结构)
3. [API自测套件](#api自测套件)
4. [错误处理测试套件](#错误处理测试套件)
5. [集成测试套件](#集成测试套件)
6. [测试用例维护规范](#测试用例维护规范)
7. [最佳实践](#最佳实践)
8. [快速开始](#快速开始)

---

## 概述

### 什么是系统自测案例库？

系统自测案例库是NexTest测试平台的核心组成部分，它通过**自举测试**（Dogfooding）的方式，使用平台自己的API来测试平台本身的功能。这确保了：

✅ **平台功能的正确性** - 每个API端点都有对应的测试
✅ **回归测试保护** - 新功能不会破坏现有功能
✅ **文档即示例** - 测试用例本身就是API使用的最佳示例
✅ **持续验证** - 可以随时运行测试验证系统健康状态

### 统计数据

| 指标 | 数量 |
|------|------|
| **总测试用例数** | 19 |
| **API自测用例** | 5 |
| **错误处理测试** | 4 |
| **集成测试** | 3 |
| **P0级别测试** | 6 |
| **测试覆盖率** | ~85% |

---

## 测试案例库结构

```
Test Repository/
├── 📁 API Self Tests (系统API自测)
│   ├── TestCase API Complete Test
│   ├── TestGroup API Complete Test
│   ├── Environment API Complete Test
│   ├── Workflow Execution API Test
│   └── Test Results API Test
│
├── 📁 Error Handling Tests (错误处理测试)
│   ├── 404 Not Found Tests
│   ├── 400 Bad Request Tests
│   ├── 409 Conflict Tests
│   └── Error Handling Tests
│
├── 📁 Integration Tests (集成测试)
│   ├── Service Health Check
│   ├── Database Connection Test
│   └── API Response Time Test
│
├── 📁 API Tests (功能API测试)
│   ├── Lifecycle Hooks Demo Test
│   ├── 基础镜像API测试/
│   │   ├── List Base Images
│   │   └── Get Base Image Detail
│   └── 自定义镜像API测试/
│       ├── List Custom Images
│       └── Create Custom Image
│
└── 📁 Platform Tests (平台测试)
    ├── Basic Workflow Test
    └── Platform Self Test
```

---

## API自测套件

### 1. TestCase API Complete Test

**目的**: 测试TestCase API的完整CRUD生命周期

**Workflow ID**: `self-test-testcase-complete`

**测试步骤**:
```
Step 1: Create Test Case
  ├─ POST /api/v2/tests
  ├─ Body: { name, description, projectId, status }
  ├─ Assertions:
  │   ├─ response.status == 201
  │   ├─ response.body.testId exists
  │   └─ response.body.name == input.name
  └─ Outputs: testId

Step 2: Get Test Case
  ├─ GET /api/v2/tests/{{testId}}
  ├─ Assertions:
  │   ├─ response.status == 200
  │   ├─ response.body.testId == testId
  │   └─ response.body.status == "ACTIVE"
  └─ Outputs: testCase

Step 3: Update Test Case
  ├─ PUT /api/v2/tests/{{testId}}
  ├─ Body: { description: "Updated description" }
  ├─ Assertions:
  │   └─ response.status == 200
  └─ Outputs: updatedTestCase

Step 4: Verify Update
  ├─ GET /api/v2/tests/{{testId}}
  ├─ Assertions:
  │   └─ response.body.description == "Updated description"
  └─ Outputs: -

Step 5: Delete Test Case
  ├─ DELETE /api/v2/tests/{{testId}}
  ├─ Assertions:
  │   └─ response.status == 204 or 200
  └─ Outputs: -

Step 6: Verify Deletion
  ├─ GET /api/v2/tests/{{testId}}
  └─ Assertions:
      └─ response.status == 404
```

**期望结果**: 所有6个步骤通过 ✓

**执行频率**: 每次部署前、每日自动化

**优先级**: P0

---

### 2. TestGroup API Complete Test

**目的**: 测试TestGroup API的完整CRUD生命周期

**Workflow ID**: `self-test-testgroup-complete`

**测试步骤**:
```
Step 1: Create Test Group
  ├─ POST /api/v2/groups
  ├─ Body: { name, description, parentId }
  ├─ Assertions:
  │   ├─ response.status == 201
  │   └─ response.body.groupId exists
  └─ Outputs: groupId

Step 2: Get Test Group
  ├─ GET /api/v2/groups/{{groupId}}
  ├─ Assertions:
  │   ├─ response.status == 200
  │   └─ response.body.name == input.name
  └─ Outputs: testGroup

Step 3: Get Group Tree
  ├─ GET /api/v2/groups/tree
  ├─ Assertions:
  │   ├─ response.status == 200
  │   └─ response.body contains groupId
  └─ Outputs: -

Step 4: Update Test Group
  ├─ PUT /api/v2/groups/{{groupId}}
  └─ Assertions:
      └─ response.status == 200

Step 5: Delete Test Group
  ├─ DELETE /api/v2/groups/{{groupId}}
  └─ Assertions:
      └─ response.status == 204

Step 6: Verify Deletion
  ├─ GET /api/v2/groups/{{groupId}}
  └─ Assertions:
      └─ response.status == 404
```

**期望结果**: 所有6个步骤通过 ✓

**执行频率**: 每次部署前、每日自动化

**优先级**: P0

---

### 3. Environment API Complete Test

**目的**: 测试Environment API的完整CRUD生命周期

**Workflow ID**: `self-test-environment-complete`

**测试步骤**:
```
Step 1: List Environments
  ├─ GET /api/v2/environments
  ├─ Assertions:
  │   ├─ response.status == 200
  │   └─ response.body is array
  └─ Outputs: existingEnvCount

Step 2: Create Environment
  ├─ POST /api/v2/environments
  ├─ Body: { name, type, config }
  ├─ Assertions:
  │   ├─ response.status == 201
  │   └─ response.body.id exists
  └─ Outputs: envId

Step 3: Get Environment
  ├─ GET /api/v2/environments/{{envId}}
  ├─ Assertions:
  │   ├─ response.status == 200
  │   ├─ response.body.name == input.name
  │   └─ response.body.type == input.type
  └─ Outputs: -

Step 4: Update Environment
  ├─ PUT /api/v2/environments/{{envId}}
  └─ Assertions:
      └─ response.status == 200

Step 5: Delete Environment
  ├─ DELETE /api/v2/environments/{{envId}}
  └─ Assertions:
      └─ response.status == 204

Step 6: Verify List Count
  ├─ GET /api/v2/environments
  └─ Assertions:
      └─ response.body.length == existingEnvCount
```

**期望结果**: 所有6个步骤通过 ✓

**执行频率**: 每日自动化

**优先级**: P1

---

### 4. Workflow Execution API Test

**目的**: 测试Workflow执行API

**Workflow ID**: `self-test-workflow-execution`

**测试步骤**:
```
Step 1: Create Workflow
  ├─ POST /api/v2/workflows
  ├─ Body: { name, steps[], variables }
  ├─ Assertions:
  │   └─ response.status == 201
  └─ Outputs: workflowId

Step 2: Execute Workflow
  ├─ POST /api/v2/workflows/{{workflowId}}/execute
  ├─ Assertions:
  │   ├─ response.status == 200
  │   └─ response.body.runId exists
  └─ Outputs: runId

Step 3: Get Execution Status (Polling)
  ├─ GET /api/v2/workflows/runs/{{runId}}
  ├─ Retry: every 2s, max 10 times
  ├─ Assertions:
  │   ├─ response.status == 200
  │   └─ response.body.status in ["success", "failed"]
  └─ Outputs: finalStatus

Step 4: Verify Success
  ├─ Assertions:
  │   └─ finalStatus == "success"
  └─ Outputs: -

Step 5: Get Workflow Steps
  ├─ GET /api/v2/workflows/runs/{{runId}}/steps
  ├─ Assertions:
  │   ├─ response.status == 200
  │   └─ response.body.length > 0
  └─ Outputs: -

Step 6: Cleanup
  ├─ DELETE /api/v2/workflows/{{workflowId}}
  └─ Assertions:
      └─ response.status == 204
```

**期望结果**: 所有6个步骤通过 ✓

**执行频率**: 每日自动化

**优先级**: P0

---

### 5. Test Results API Test

**目的**: 测试Test Results API

**Workflow ID**: `self-test-results`

**测试步骤**:
```
Step 1: Create Test Case
  ├─ POST /api/v2/tests
  └─ Outputs: testId

Step 2: Execute Test
  ├─ POST /api/v2/tests/{{testId}}/execute
  └─ Outputs: executionId

Step 3: Get Test Results
  ├─ GET /api/v2/tests/{{testId}}/results
  ├─ Assertions:
  │   ├─ response.status == 200
  │   └─ response.body is array
  └─ Outputs: results

Step 4: Get Specific Result
  ├─ GET /api/v2/results/{{executionId}}
  ├─ Assertions:
  │   ├─ response.status == 200
  │   ├─ response.body.testId == testId
  │   └─ response.body.status exists
  └─ Outputs: -

Step 5: Cleanup
  ├─ DELETE /api/v2/tests/{{testId}}
  └─ Assertions:
      └─ response.status == 204
```

**期望结果**: 所有5个步骤通过 ✓

**执行频率**: 每日自动化

**优先级**: P1

---

## 错误处理测试套件

### 1. 404 Not Found Tests

**目的**: 验证API对不存在资源的处理

**测试场景**:
```
Scenario 1: Get Non-existent Test Case
  ├─ GET /api/v2/tests/non-existent-id-12345
  └─ Assertions:
      ├─ response.status == 404
      ├─ response.body.error exists
      └─ response.body.message contains "not found"

Scenario 2: Update Non-existent Test Group
  ├─ PUT /api/v2/groups/invalid-group-id
  └─ Assertions:
      └─ response.status == 404

Scenario 3: Delete Non-existent Workflow
  ├─ DELETE /api/v2/workflows/non-existent-workflow
  └─ Assertions:
      └─ response.status == 404

Scenario 4: Get Non-existent Execution Result
  ├─ GET /api/v2/results/invalid-execution-id
  └─ Assertions:
      └─ response.status == 404
```

**期望结果**: 所有场景返回正确的404错误 ✓

**优先级**: P0

---

### 2. 400 Bad Request Tests

**目的**: 验证API对无效输入的验证

**测试场景**:
```
Scenario 1: Create Test Case with Missing Required Fields
  ├─ POST /api/v2/tests
  ├─ Body: { } (empty body)
  └─ Assertions:
      ├─ response.status == 400
      └─ response.body.error contains "required"

Scenario 2: Create Test Case with Invalid Data Type
  ├─ POST /api/v2/tests
  ├─ Body: { name: 123, status: "INVALID_STATUS" }
  └─ Assertions:
      ├─ response.status == 400
      └─ response.body.error contains "invalid"

Scenario 3: Update with Invalid JSON
  ├─ PUT /api/v2/tests/{{testId}}
  ├─ Body: "not-valid-json"
  └─ Assertions:
      └─ response.status == 400

Scenario 4: Execute Workflow with Invalid Input
  ├─ POST /api/v2/workflows/{{workflowId}}/execute
  ├─ Body: { variables: "not-an-object" }
  └─ Assertions:
      └─ response.status == 400
```

**期望结果**: 所有场景返回正确的400错误 ✓

**优先级**: P0

---

### 3. 409 Conflict Tests

**目的**: 验证API对资源冲突的处理

**测试场景**:
```
Scenario 1: Create Duplicate Test Case
  ├─ Step 1: Create test case with name "Unique Test"
  ├─ Step 2: Create another test case with same name
  └─ Assertions:
      ├─ Step 2 response.status == 409
      └─ response.body.error contains "already exists"

Scenario 2: Create Duplicate Test Group
  ├─ Step 1: Create test group with name "Unique Group"
  ├─ Step 2: Create another group with same name and parentId
  └─ Assertions:
      └─ Step 2 response.status == 409

Scenario 3: Update to Duplicate Name
  ├─ Step 1: Create test case A
  ├─ Step 2: Create test case B
  ├─ Step 3: Update test case B to have same name as A
  └─ Assertions:
      └─ Step 3 response.status == 409
```

**期望结果**: 所有场景正确检测并返回409冲突 ✓

**优先级**: P1

---

### 4. Error Handling Tests

**目的**: 验证通用错误处理机制

**测试场景**:
```
Scenario 1: Server Error Simulation
  ├─ Trigger: Call API endpoint that simulates 500 error
  └─ Assertions:
      ├─ response.status == 500
      ├─ response.body.error exists
      └─ response.body.requestId exists

Scenario 2: Timeout Handling
  ├─ Trigger: Call API with very long processing time
  └─ Assertions:
      ├─ response.status == 408 or 504
      └─ response.time < 30000ms

Scenario 3: Rate Limiting
  ├─ Trigger: Send 100 requests in 1 second
  └─ Assertions:
      ├─ Some responses have status 429
      └─ response.headers['Retry-After'] exists
```

**期望结果**: 错误被正确处理和返回 ✓

**优先级**: P1

---

## 集成测试套件

### 1. Service Health Check

**目的**: 验证所有核心服务的健康状态

**测试步骤**:
```
Step 1: Check API Server Health
  ├─ GET /api/v2/health
  └─ Assertions:
      ├─ response.status == 200
      ├─ response.body.status == "healthy"
      └─ response.time < 1000ms

Step 2: Check Database Connection
  ├─ GET /api/v2/health/database
  └─ Assertions:
      ├─ response.status == 200
      └─ response.body.connected == true

Step 3: Check WebSocket Service
  ├─ Connect to ws://host/api/v2/ws
  └─ Assertions:
      └─ connection established within 5s

Step 4: Check File Storage
  ├─ GET /api/v2/health/storage
  └─ Assertions:
      ├─ response.status == 200
      └─ response.body.writable == true
```

**期望结果**: 所有服务健康 ✓

**执行频率**: 每小时自动化、监控告警

**优先级**: P0

---

### 2. Database Connection Test

**目的**: 验证数据库连接池和查询性能

**测试步骤**:
```
Step 1: Test Connection Pool
  ├─ Parallel execution of 50 database queries
  └─ Assertions:
      ├─ All queries succeed
      ├─ Average response time < 100ms
      └─ No connection timeout errors

Step 2: Test Transaction
  ├─ Create test data in transaction
  ├─ Rollback transaction
  └─ Assertions:
      └─ Data not persisted after rollback

Step 3: Test Concurrent Writes
  ├─ Parallel create operations (10 concurrent)
  └─ Assertions:
      ├─ All writes succeed
      └─ No deadlocks or conflicts
```

**期望结果**: 数据库稳定可靠 ✓

**执行频率**: 每日自动化

**优先级**: P1

---

### 3. API Response Time Test

**目的**: 验证API性能指标

**测试步骤**:
```
Step 1: Test List API Performance
  ├─ GET /api/v2/tests?page=1&pageSize=50
  └─ Assertions:
      ├─ response.status == 200
      └─ response.time < 500ms

Step 2: Test Detail API Performance
  ├─ GET /api/v2/tests/{{testId}}
  └─ Assertions:
      └─ response.time < 200ms

Step 3: Test Create API Performance
  ├─ POST /api/v2/tests
  └─ Assertions:
      └─ response.time < 1000ms

Step 4: Test Update API Performance
  ├─ PUT /api/v2/tests/{{testId}}
  └─ Assertions:
      └─ response.time < 800ms

Step 5: Test Delete API Performance
  ├─ DELETE /api/v2/tests/{{testId}}
  └─ Assertions:
      └─ response.time < 500ms
```

**期望结果**: 所有API响应时间符合SLA ✓

**执行频率**: 每日自动化、性能回归测试

**优先级**: P1

---

## 测试用例维护规范

### 命名规范

**文件夹命名**:
```
✓ Good: "API Self Tests", "Error Handling Tests"
✗ Bad: "test1", "myTests", "临时测试"
```

**测试用例命名**:
```
格式: [Component] [API/Function] [Test Type]

✓ Good:
  - "TestCase API Complete Test"
  - "Workflow Execution API Test"
  - "404 Not Found Tests"

✗ Bad:
  - "test123"
  - "我的测试"
  - "临时测试20231126"
```

### 文档规范

每个测试用例必须包含:

```markdown
1. **Title** (标题) - 简洁描述测试内容
2. **Description** (描述) - 详细说明测试目的
3. **Priority** (优先级) - P0/P1/P2
4. **Tags** (标签) - ["api", "crud", "self-test"]
5. **Steps** (步骤) - 清晰的测试步骤
6. **Assertions** (断言) - 明确的验证点
7. **Expected Result** (期望结果) - 成功标准
```

### 版本管理

测试用例版本控制策略:

```
Version Format: vMAJOR.MINOR.PATCH

MAJOR: API重大变更（breaking changes）
MINOR: 新增测试步骤或断言
PATCH: 修复测试bug或优化

示例:
- v1.0.0: 初始版本
- v1.1.0: 新增Step 7验证删除后的清理
- v1.1.1: 修复Step 3的断言条件
- v2.0.0: API v2升级，URL变更
```

### 标签系统

使用标签进行测试分类和过滤:

| 标签 | 用途 | 示例 |
|------|------|------|
| `api` | API测试 | API Self Tests |
| `crud` | CRUD操作 | Create/Read/Update/Delete |
| `integration` | 集成测试 | Service Health Check |
| `error-handling` | 错误处理 | 404/400/409 Tests |
| `performance` | 性能测试 | Response Time Test |
| `self-test` | 系统自测 | 所有API Self Tests |
| `smoke` | 冒烟测试 | 关键路径测试 |
| `regression` | 回归测试 | 防止功能退化 |
| `p0` | 最高优先级 | 核心功能必测 |
| `p1` | 高优先级 | 重要功能 |
| `p2` | 中优先级 | 辅助功能 |

### 断言最佳实践

**好的断言示例**:
```typescript
// ✓ 明确、可验证、有意义
{
  type: "value",
  target: "{{response.status}}",
  operator: "equals",
  expected: 201,
  message: "Expected HTTP 201 Created"
}

{
  type: "structure",
  target: "{{response.body.testId}}",
  operator: "exists",
  message: "Response must contain testId"
}

{
  type: "value",
  target: "{{response.body.name}}",
  operator: "equals",
  expected: "{{input.name}}",
  message: "Returned name must match input name"
}
```

**避免的断言示例**:
```typescript
// ✗ 太模糊、不可靠、无意义
{
  target: "{{response}}",
  operator: "exists"  // 太宽泛
}

{
  target: "{{response.status}}",
  operator: "greaterThan",
  expected: 0  // 没有意义
}

{
  target: "{{response.body}}",
  operator: "contains",
  expected: "success"  // 太不精确
}
```

---

## 最佳实践

### 1. 测试独立性

**原则**: 每个测试用例必须独立运行，不依赖其他测试的状态

```
✓ Good:
  - 测试开始时创建所需数据
  - 测试结束时清理创建的数据
  - 使用唯一的测试数据（timestamp, UUID）

✗ Bad:
  - 依赖其他测试创建的数据
  - 修改共享的测试数据
  - 不清理测试数据
```

**实现方式**:
```javascript
// Step 1: Setup - Create test data
const testData = {
  name: `Test-${Date.now()}`,  // 唯一名称
  description: "Temporary test case"
};

// Step 2-5: Test operations

// Step 6: Cleanup - Delete test data
DELETE /api/v2/tests/{{testId}}
```

### 2. 幂等性

**原则**: 测试可以重复执行多次，结果一致

```
实现方式:
1. 使用 DELETE-IF-EXISTS 模式
2. 清理残留的测试数据
3. 避免硬编码ID
```

**示例**:
```
Pre-Step: Cleanup (if test was interrupted before)
  ├─ GET /api/v2/tests?name=Test-Unique-Name
  ├─ IF testId exists:
  │   └─ DELETE /api/v2/tests/{{testId}}
  └─ Continue to Step 1

Step 1: Create Test Case
  └─ (now guaranteed to not conflict)
```

### 3. 快速反馈

**原则**: 测试执行要快，提供及时反馈

```
优化策略:
1. P0测试控制在 < 30秒
2. 并行执行独立测试
3. 使用合理的超时设置
4. 避免不必要的 sleep/wait
```

**超时配置建议**:
```
- API调用: 5秒
- Workflow执行: 30秒
- 数据库操作: 2秒
- WebSocket连接: 10秒
```

### 4. 清晰的失败信息

**原则**: 测试失败时，一眼看出问题所在

```
✓ Good Assertion Messages:
  "Expected user creation to return 201, but got 400"
  "Response must contain 'userId' field, but it was missing"
  "Created test name should be 'Test ABC', but was 'Test XYZ'"

✗ Bad Assertion Messages:
  "Assertion failed"
  "Error"
  "Test failed at step 3"
```

### 5. 测试数据管理

**原则**: 使用真实但安全的测试数据

```
测试数据策略:
1. 使用工厂模式生成测试数据
2. 使用专用的测试环境
3. 敏感数据使用 mock 值
4. 定期清理过期测试数据
```

**测试数据工厂**:
```javascript
const TestDataFactory = {
  createTestCase: () => ({
    name: `AutoTest-${Date.now()}`,
    description: "Automated test case",
    projectId: "test-project",
    status: "ACTIVE",
    tags: ["automated", "self-test"]
  }),

  createTestGroup: () => ({
    name: `TestGroup-${Date.now()}`,
    description: "Automated test group",
    parentId: null
  }),

  createWorkflow: () => ({
    name: `Workflow-${Date.now()}`,
    description: "Automated workflow",
    steps: [/* ... */]
  })
};
```

### 6. 监控和告警

**原则**: 自动监控测试健康状态

```
监控指标:
1. 测试通过率 (目标: ≥95%)
2. 平均执行时间 (目标: <60s)
3. Flaky测试数量 (目标: 0)
4. 失败测试数量 (目标: 0)
```

**告警规则**:
```
CRITICAL:
  - P0测试失败 → 立即通知 (Slack/Email/SMS)
  - 测试通过率 < 90% → 立即通知

WARNING:
  - P1测试失败 → 15分钟内通知
  - 测试执行时间 > 120s → 30分钟内通知

INFO:
  - 新增Flaky测试 → 每日汇总
  - P2测试失败 → 每日汇总
```

---

## 快速开始

### 运行所有自测用例

**方式1: 通过UI手动执行**
```
1. 登录 http://localhost:8082
2. 导航到 Test Repository
3. 展开 "API Self Tests" 文件夹
4. 点击每个测试用例
5. 点击 "Run" 按钮
6. 查看执行结果
```

**方式2: 通过API批量执行**
```bash
# 获取所有自测用例ID
curl -X GET http://localhost:8082/api/v2/tests?tags=self-test

# 批量执行
for test_id in $(cat test_ids.txt); do
  curl -X POST http://localhost:8082/api/v2/tests/${test_id}/execute
done

# 查看结果
curl -X GET http://localhost:8082/api/v2/results?tags=self-test
```

**方式3: 使用测试套件**
```bash
cd nextest-platform

# 运行所有P0测试
make test-p0

# 运行所有API自测
make test-api-self

# 运行完整测试套件
make test-all
```

### 创建新的自测用例

**Step 1: 规划测试**
```markdown
1. 确定测试目标 (What to test?)
2. 设计测试步骤 (How to test?)
3. 定义断言 (How to verify?)
4. 确定优先级 (P0/P1/P2?)
```

**Step 2: 创建测试用例**
```
1. 导航到 Test Repository
2. 选择 "API Self Tests" 文件夹
3. 点击 "+" 创建新测试
4. 填写:
   - Name: [Component] API [Operation] Test
   - Description: 详细描述
   - Tags: ["api", "self-test", "p0"]
   - Type: Workflow
5. 创建 Workflow Definition
6. 添加测试步骤
7. 添加断言
8. 保存
```

**Step 3: 验证测试**
```
1. 执行测试 (至少3次)
2. 验证所有断言通过
3. 检查执行时间 (< 30s for P0)
4. 检查清理步骤是否完整
```

**Step 4: 文档化**
```
1. 更新本文档
2. 添加测试用例描述
3. 更新统计数据
4. Commit 到代码库
```

### 维护现有测试

**定期维护任务** (每周):
```
1. 检查 Flaky 测试 (通过率 < 100%)
2. 清理过期测试数据
3. 更新测试用例文档
4. 检查测试覆盖率
5. 优化慢速测试
```

**API变更时**:
```
1. 识别受影响的测试用例
2. 更新测试步骤和断言
3. 更新API endpoint URLs
4. 验证所有测试通过
5. 更新文档和版本号
```

---

## 附录

### A. 测试用例清单

| # | 测试用例名称 | 类型 | 优先级 | 状态 |
|---|-------------|------|--------|------|
| 1 | TestCase API Complete Test | API Self Test | P0 | ✅ Active |
| 2 | TestGroup API Complete Test | API Self Test | P0 | ✅ Active |
| 3 | Environment API Complete Test | API Self Test | P1 | ✅ Active |
| 4 | Workflow Execution API Test | API Self Test | P0 | ✅ Active |
| 5 | Test Results API Test | API Self Test | P1 | ✅ Active |
| 6 | 404 Not Found Tests | Error Handling | P0 | ✅ Active |
| 7 | 400 Bad Request Tests | Error Handling | P0 | ✅ Active |
| 8 | 409 Conflict Tests | Error Handling | P1 | ✅ Active |
| 9 | Error Handling Tests | Error Handling | P1 | ✅ Active |
| 10 | Service Health Check | Integration | P0 | ✅ Active |
| 11 | Database Connection Test | Integration | P1 | ✅ Active |
| 12 | API Response Time Test | Integration | P1 | ✅ Active |
| 13 | Lifecycle Hooks Demo Test | Feature Test | P2 | ✅ Active |
| 14 | List Base Images | Feature Test | P2 | ✅ Active |
| 15 | Get Base Image Detail | Feature Test | P2 | ✅ Active |
| 16 | List Custom Images | Feature Test | P2 | ✅ Active |
| 17 | Create Custom Image | Feature Test | P2 | ✅ Active |
| 18 | Basic Workflow Test | Platform Test | P1 | ✅ Active |
| 19 | Platform Self Test | Platform Test | P0 | ✅ Active |

### B. API端点覆盖率矩阵

| API端点 | 方法 | 测试用例 | 覆盖率 |
|---------|------|---------|--------|
| `/api/v2/tests` | POST | TestCase API Complete Test | ✅ 100% |
| `/api/v2/tests/:id` | GET | TestCase API Complete Test | ✅ 100% |
| `/api/v2/tests/:id` | PUT | TestCase API Complete Test | ✅ 100% |
| `/api/v2/tests/:id` | DELETE | TestCase API Complete Test | ✅ 100% |
| `/api/v2/tests/:id/execute` | POST | Test Results API Test | ✅ 100% |
| `/api/v2/groups` | POST | TestGroup API Complete Test | ✅ 100% |
| `/api/v2/groups/:id` | GET | TestGroup API Complete Test | ✅ 100% |
| `/api/v2/groups/:id` | PUT | TestGroup API Complete Test | ✅ 100% |
| `/api/v2/groups/:id` | DELETE | TestGroup API Complete Test | ✅ 100% |
| `/api/v2/groups/tree` | GET | TestGroup API Complete Test | ✅ 100% |
| `/api/v2/environments` | GET | Environment API Complete Test | ✅ 100% |
| `/api/v2/environments` | POST | Environment API Complete Test | ✅ 100% |
| `/api/v2/environments/:id` | GET | Environment API Complete Test | ✅ 100% |
| `/api/v2/environments/:id` | PUT | Environment API Complete Test | ✅ 100% |
| `/api/v2/environments/:id` | DELETE | Environment API Complete Test | ✅ 100% |
| `/api/v2/workflows` | POST | Workflow Execution API Test | ✅ 100% |
| `/api/v2/workflows/:id/execute` | POST | Workflow Execution API Test | ✅ 100% |
| `/api/v2/workflows/runs/:runId` | GET | Workflow Execution API Test | ✅ 100% |
| `/api/v2/workflows/runs/:runId/steps` | GET | Workflow Execution API Test | ✅ 100% |
| `/api/v2/results/:executionId` | GET | Test Results API Test | ✅ 100% |
| `/api/v2/health` | GET | Service Health Check | ✅ 100% |
| `/api/v2/health/database` | GET | Database Connection Test | ✅ 100% |

**总体API覆盖率**: 85% (19/22 endpoints)

### C. 常见问题 (FAQ)

**Q1: 测试失败时应该如何调试？**

A: 按以下步骤调试：
1. 查看执行日志 (Execution Logs)
2. 检查失败的断言
3. 查看Request/Response详情
4. 检查变量值是否正确
5. 手动执行相同的API调用
6. 检查后端日志
7. 必要时添加额外的Debug日志

**Q2: 如何处理Flaky测试？**

A: Flaky测试处理流程：
1. 标记为Flaky (添加⚠️标签)
2. 分析失败原因 (timing, race condition, etc.)
3. 增加重试机制或调整超时
4. 修复根本原因
5. 连续执行10次验证稳定性
6. 移除Flaky标签

**Q3: 什么时候应该更新测试用例？**

A: 以下情况需要更新：
- API端点URL变更
- Request/Response格式变更
- 业务逻辑变更
- 新增功能或字段
- 废弃旧功能
- 性能要求变更

**Q4: 如何平衡测试覆盖率和执行时间？**

A: 策略建议：
- P0测试: 快速执行 (< 30s)
- P1测试: 中等执行 (< 2min)
- P2测试: 可以较长 (< 5min)
- 使用并行执行
- 避免不必要的等待
- 定期优化慢速测试

**Q5: 测试数据如何清理？**

A: 清理策略：
- 测试结束时立即清理 (推荐)
- 使用TTL自动清理 (24小时)
- 定期批量清理 (每周)
- 使用专用测试环境 (可直接重置)

---

## 总结

本指南提供了NexTest测试平台的完整测试案例库文档，包括：

✅ 5个核心API自测套件
✅ 4个错误处理测试套件
✅ 3个集成测试套件
✅ 完整的维护规范和最佳实践
✅ 快速开始指南和FAQ

**持续改进承诺**：
- 每月审查测试覆盖率
- 每季度更新最佳实践
- 持续添加新的测试用例
- 保持文档与代码同步

**联系方式**：
- 文档问题：创建Issue或PR
- 测试失败：联系测试团队
- 功能建议：提交Feature Request

---

**文档版本**: v1.0
**最后更新**: 2025-11-26
**维护者**: NexTest团队
**状态**: ✅ 生产就绪
