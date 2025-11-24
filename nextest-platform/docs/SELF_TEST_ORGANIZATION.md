# 测试平台自测用例组织方案

> **文档版本**: v1.0.0
> **创建日期**: 2025-11-24
> **基于第一性原理和多角色视角设计**

## 目录

- [1. 第一性原理分析](#1-第一性原理分析)
- [2. 现有自测用例清单](#2-现有自测用例清单)
- [3. 多角色视角分析](#3-多角色视角分析)
- [4. 测试用例重组方案](#4-测试用例重组方案)
- [5. 实施建议](#5-实施建议)

---

## 1. 第一性原理分析

### 1.1 测试的本质

从第一性原理出发，测试的本质是：

```
输入 (Input) → 系统行为 (System Behavior) → 输出验证 (Output Verification)
```

**核心要素**:
1. **前置条件** (Precondition): 系统必须处于某种已知状态
2. **操作动作** (Action): 对系统执行特定操作
3. **预期结果** (Expected Result): 系统应产生的响应或状态变化
4. **后置清理** (Cleanup): 恢复系统到干净状态

### 1.2 测试平台自测的独特性

测试平台自测具有**元测试**特性：用测试来测试测试系统

```
┌─────────────────────────────────────────────────────────────┐
│                    元测试架构                                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  测试平台 (Subject Under Test)                              │
│  ═══════════════════════════════                           │
│  │                                                          │
│  ├─► API 层: HTTP Endpoints                                │
│  │   └─► 测试: 验证请求/响应契约                            │
│  │                                                          │
│  ├─► 业务层: TestCase, Workflow, Environment               │
│  │   └─► 测试: 验证业务逻辑正确性                           │
│  │                                                          │
│  ├─► 数据层: Database CRUD                                 │
│  │   └─► 测试: 验证数据持久化和隔离                         │
│  │                                                          │
│  └─► 执行层: Test Executor, Workflow Engine                │
│      └─► 测试: 验证执行引擎行为                             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 1.3 分层测试策略

```
                    测试金字塔
              ════════════════════

         ┌──────────────────────────┐
         │    E2E Integration Test  │  (少量: 完整业务流程)
         │    06-end-to-end-*.json  │
         └──────────────────────────┘
                    ▲
         ┌──────────────────────────┐
         │   API Integration Test   │  (中等: API 交互)
         │   self-test-*-api.json   │
         └──────────────────────────┘
                    ▲
         ┌──────────────────────────┐
         │    Functional Tests      │  (较多: 功能验证)
         │   self-test-actions.json │
         └──────────────────────────┘
                    ▲
         ┌──────────────────────────┐
         │   Error Handling Tests   │  (必要: 边界条件)
         │   self-test-error-*.json │
         └──────────────────────────┘
```

---

## 2. 现有自测用例清单

### 2.1 按文件分类

| 文件名 | 类型 | 步骤数 | 测试目标 |
|--------|------|--------|----------|
| `self-test-platform.json` | 综合集成 | 16 | 平台核心功能完整性 |
| `self-test-testcase-api.json` | API测试 | 13 | TestCase CRUD API |
| `self-test-workflow-execution-api.json` | API测试 | 15 | Workflow 执行 API |
| `self-test-tenant-api.json` | API测试 | ~10 | 租户管理 API |
| `self-test-project-api.json` | API测试 | ~10 | 项目管理 API |
| `self-test-environment-api.json` | API测试 | ~10 | 环境管理 API |
| `self-test-testgroup-api.json` | API测试 | ~10 | 测试组 API |
| `self-test-error-handling.json` | 负面测试 | 14 | 错误响应 (404/400/409) |
| `self-test-400-bad-request.json` | 负面测试 | ~8 | 400 错误场景 |
| `self-test-404-not-found.json` | 负面测试 | ~8 | 404 错误场景 |
| `self-test-409-conflict.json` | 负面测试 | ~8 | 409 冲突场景 |
| `self-test-actions.json` | 功能测试 | ~12 | Action 执行引擎 |
| `05-multi-tenant-tests.json` | 隔离测试 | 23 | 多租户数据隔离 |
| `06-end-to-end-integration-test.json` | E2E测试 | 31 | 完整业务流程 |

### 2.2 测试覆盖分析

```
API 端点覆盖率
═══════════════

测试管理 API:
├─ POST   /api/tests          ✅ 已覆盖
├─ GET    /api/tests/:id      ✅ 已覆盖
├─ PUT    /api/tests/:id      ✅ 已覆盖
├─ DELETE /api/tests/:id      ✅ 已覆盖
├─ GET    /api/tests          ✅ 已覆盖
├─ GET    /api/tests/search   ✅ 已覆盖
└─ POST   /api/tests/:id/execute ✅ 已覆盖

测试组 API:
├─ POST   /api/groups         ✅ 已覆盖
├─ GET    /api/groups/:id     ✅ 已覆盖
├─ PUT    /api/groups/:id     ✅ 已覆盖
├─ DELETE /api/groups/:id     ✅ 已覆盖
└─ GET    /api/groups/tree    ✅ 已覆盖

工作流 API:
├─ POST   /api/workflows              ✅ 已覆盖
├─ GET    /api/workflows/:id          ✅ 已覆盖
├─ PUT    /api/workflows/:id          ⚠️ 部分覆盖
├─ DELETE /api/workflows/:id          ✅ 已覆盖
├─ POST   /api/workflows/:id/execute  ✅ 已覆盖
├─ GET    /api/workflows/runs/:runId  ✅ 已覆盖
├─ GET    /api/workflows/runs/:runId/steps ✅ 已覆盖
└─ GET    /api/workflows/runs/:runId/logs  ✅ 已覆盖

环境管理 API:
├─ POST   /api/environments           ✅ 已覆盖
├─ GET    /api/environments           ✅ 已覆盖
├─ GET    /api/environments/:id       ✅ 已覆盖
├─ PUT    /api/environments/:id       ⚠️ 部分覆盖
├─ DELETE /api/environments/:id       ✅ 已覆盖
├─ GET    /api/environments/active    ✅ 已覆盖
└─ POST   /api/environments/:id/activate ✅ 已覆盖

租户管理 API (v2):
├─ POST   /api/v2/tenants             ✅ 已覆盖
├─ GET    /api/v2/tenants             ✅ 已覆盖
├─ GET    /api/v2/tenants/:id         ✅ 已覆盖
├─ PUT    /api/v2/tenants/:id         ⚠️ 部分覆盖
├─ DELETE /api/v2/tenants/:id         ✅ 已覆盖
└─ POST   /api/v2/tenants/:id/suspend ⚠️ 未覆盖

项目管理 API (v2):
├─ POST   /api/v2/projects            ✅ 已覆盖
├─ GET    /api/v2/projects            ✅ 已覆盖
├─ GET    /api/v2/projects/:id        ✅ 已覆盖
├─ PUT    /api/v2/projects/:id        ⚠️ 部分覆盖
├─ DELETE /api/v2/projects/:id        ✅ 已覆盖
└─ POST   /api/v2/projects/:id/archive ⚠️ 未覆盖
```

---

## 3. 多角色视角分析

### 3.1 QA 视角 (质量保证)

**核心关注点**: 测试覆盖、断言有效性、缺陷检测能力

#### 3.1.1 断言类型分析

当前使用的断言类型:

| 断言类型 | 用途 | 示例 | 使用频率 |
|----------|------|------|----------|
| `equals` | 精确匹配 | `status == 200` | ⭐⭐⭐⭐⭐ |
| `exists` | 存在性检查 | `response.id exists` | ⭐⭐⭐ |
| `greater_than` | 数值比较 | `count > 0` | ⭐⭐ |
| `contains` | 包含检查 | `error contains "not found"` | ⭐ |

**QA 建议**:
1. 增加 `less_than`, `between` 等范围断言
2. 增加 `matches` 正则匹配断言
3. 增加 `schema` JSON Schema 验证断言
4. 增加响应时间断言 (`response_time < 500ms`)

#### 3.1.2 测试覆盖质量评估

```
覆盖质量矩阵
═══════════════

                    正向测试    负向测试    边界测试    并发测试
TestCase API         ✅          ✅          ⚠️          ❌
Workflow API         ✅          ✅          ⚠️          ❌
Environment API      ✅          ✅          ❌          ❌
Multi-Tenant         ✅          ✅          ✅          ❌

✅ 已覆盖  ⚠️ 部分覆盖  ❌ 未覆盖
```

**QA 优先改进项**:
1. 添加边界值测试（空字符串、超长字符串、特殊字符）
2. 添加并发测试（同时创建多个资源）
3. 添加数据完整性验证（数据库级别）

#### 3.1.3 QA 视角的测试分组建议

```
QA 测试金字塔组织
══════════════════

冒烟测试集 (Smoke Tests) - 5分钟内完成
├─ self-test-platform.json (核心功能)
└─ self-test-error-handling.json (基本错误处理)

回归测试集 (Regression Tests) - 15分钟内完成
├─ self-test-testcase-api.json
├─ self-test-workflow-execution-api.json
├─ self-test-environment-api.json
├─ self-test-testgroup-api.json
├─ self-test-tenant-api.json
└─ self-test-project-api.json

完整测试集 (Full Tests) - 30分钟内完成
├─ 所有上述测试
├─ 05-multi-tenant-tests.json
└─ 06-end-to-end-integration-test.json
```

### 3.2 PM 视角 (产品经理)

**核心关注点**: 业务场景覆盖、用户旅程完整性、功能可用性

#### 3.2.1 业务场景映射

```
用户旅程 → 测试映射
═════════════════════

旅程1: 新用户首次使用
━━━━━━━━━━━━━━━━━━━━
1. 创建租户 → self-test-tenant-api.json
2. 创建项目 → self-test-project-api.json
3. 创建环境 → self-test-environment-api.json
4. 创建测试组 → self-test-testgroup-api.json
5. 创建测试用例 → self-test-testcase-api.json
6. 执行测试 → self-test-platform.json

旅程2: 日常测试执行
━━━━━━━━━━━━━━━━━━━━
1. 切换环境 → environment activation tests
2. 执行单个测试 → test execution tests
3. 查看结果 → result retrieval tests
4. 执行测试组 → group execution tests

旅程3: 工作流编排
━━━━━━━━━━━━━━━━━━━━
1. 创建工作流 → workflow creation tests
2. 配置步骤 → workflow step configuration
3. 执行工作流 → self-test-workflow-execution-api.json
4. 监控进度 → workflow run monitoring
5. 查看日志 → step logs retrieval

旅程4: 多团队协作
━━━━━━━━━━━━━━━━━━━━
1. 租户隔离 → 05-multi-tenant-tests.json
2. 跨项目访问 → cross-tenant access denial tests
3. 环境隔离 → environment isolation tests
```

#### 3.2.2 PM 关注的测试场景优先级

| 优先级 | 业务场景 | 测试覆盖状态 | 影响 |
|--------|----------|--------------|------|
| P0 | 测试执行成功返回结果 | ✅ 已覆盖 | 核心价值 |
| P0 | 工作流执行并产出日志 | ✅ 已覆盖 | 核心价值 |
| P0 | 多租户数据隔离 | ✅ 已覆盖 | 安全合规 |
| P1 | 环境切换生效 | ✅ 已覆盖 | 用户体验 |
| P1 | 测试组批量执行 | ⚠️ 部分覆盖 | 效率提升 |
| P2 | 测试用例搜索 | ✅ 已覆盖 | 易用性 |
| P2 | 测试历史查询 | ⚠️ 未覆盖 | 追溯能力 |
| P3 | 测试用例导入导出 | ❌ 未覆盖 | 数据迁移 |

#### 3.2.3 PM 视角的测试套件建议

```
业务功能测试套件
══════════════════

Suite 1: 核心业务流程 (Demo Ready)
├─ 06-end-to-end-integration-test.json
└─ 演示完整的租户→项目→环境→测试→执行流程

Suite 2: 企业级功能 (Enterprise Features)
├─ 05-multi-tenant-tests.json
└─ 验证多租户隔离和安全性

Suite 3: API 稳定性 (API Stability)
├─ self-test-testcase-api.json
├─ self-test-workflow-execution-api.json
└─ 验证 API 契约稳定

Suite 4: 错误处理 (User Friendly Errors)
├─ self-test-error-handling.json
├─ self-test-400-bad-request.json
├─ self-test-404-not-found.json
└─ 验证用户友好的错误提示
```

### 3.3 Dev 视角 (开发人员)

**核心关注点**: API 契约、集成点、代码变更验证

#### 3.3.1 API 契约验证

```go
// API 契约测试要点

type APIContract struct {
    // 请求契约
    Request struct {
        Method      string            // GET, POST, PUT, DELETE
        Path        string            // /api/tests/:id
        Headers     map[string]string // Content-Type, X-Tenant-ID
        Body        interface{}       // JSON body schema
        QueryParams map[string]string // Pagination, filters
    }

    // 响应契约
    Response struct {
        StatusCode int               // 200, 201, 400, 404, 500
        Headers    map[string]string // Content-Type
        Body       interface{}       // Response schema
    }
}
```

**Dev 关注的契约测试**:

| API 端点 | 请求契约 | 响应契约 | 错误契约 |
|----------|----------|----------|----------|
| `POST /api/tests` | ✅ | ✅ | ✅ |
| `GET /api/tests/:id` | ✅ | ✅ | ✅ |
| `PUT /api/tests/:id` | ⚠️ | ⚠️ | ⚠️ |
| `DELETE /api/tests/:id` | ✅ | ✅ | ✅ |
| `POST /api/workflows/:id/execute` | ✅ | ✅ | ✅ |

#### 3.3.2 数据库交互验证

现有测试使用 `database` 类型步骤进行数据验证：

```json
{
  "type": "database",
  "config": {
    "driver": "sqlite3",
    "dsn": "{{dbPath}}",
    "queryType": "select",
    "query": "SELECT * FROM test_cases WHERE test_id = ?",
    "args": ["{{testId}}"]
  }
}
```

**Dev 建议改进**:
1. 添加事务回滚验证
2. 添加软删除验证 (`deleted_at` 字段)
3. 添加外键约束验证
4. 添加索引使用验证

#### 3.3.3 Dev 视角的测试分层

```
开发测试分层
═══════════════

Layer 1: Handler 测试 (API 层)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
├─ 请求解析正确性
├─ 参数验证
├─ 响应格式
└─ HTTP 状态码

Layer 2: Service 测试 (业务层)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
├─ 业务逻辑正确性
├─ 事务处理
├─ 错误传播
└─ 状态转换

Layer 3: Repository 测试 (数据层)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
├─ CRUD 操作
├─ 查询正确性
├─ 数据完整性
└─ 多租户隔离

Layer 4: Integration 测试 (集成层)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
├─ 组件协作
├─ 端到端流程
├─ 外部服务模拟
└─ 性能基准
```

#### 3.3.4 代码变更关联测试

```
代码模块 → 影响测试
═══════════════════════

internal/handler/test_handler.go
└─► self-test-testcase-api.json

internal/handler/workflow_handler.go
└─► self-test-workflow-execution-api.json

internal/service/test_service.go
└─► self-test-testcase-api.json
└─► self-test-platform.json

internal/workflow/executor.go
└─► self-test-workflow-execution-api.json
└─► 06-end-to-end-integration-test.json

internal/repository/test_repository.go
└─► 所有测试 (数据层变更影响全局)
```

---

## 4. 测试用例重组方案

### 4.1 按测试类型重组

```
tests/
├── smoke/                          # 冒烟测试 (5分钟)
│   ├── platform-health.json        # 平台健康检查
│   └── critical-path.json          # 关键路径验证
│
├── api/                            # API 契约测试
│   ├── testcase-api.json           # TestCase CRUD
│   ├── workflow-api.json           # Workflow CRUD
│   ├── environment-api.json        # Environment CRUD
│   ├── testgroup-api.json          # TestGroup CRUD
│   ├── tenant-api.json             # Tenant CRUD
│   └── project-api.json            # Project CRUD
│
├── functional/                     # 功能测试
│   ├── test-execution.json         # 测试执行
│   ├── workflow-execution.json     # 工作流执行
│   ├── environment-switching.json  # 环境切换
│   └── group-execution.json        # 批量执行
│
├── negative/                       # 负面测试
│   ├── error-400.json              # 参数错误
│   ├── error-404.json              # 资源不存在
│   ├── error-409.json              # 资源冲突
│   └── error-500.json              # 服务器错误
│
├── integration/                    # 集成测试
│   ├── multi-tenant.json           # 多租户隔离
│   └── e2e-complete.json           # 端到端流程
│
└── performance/                    # 性能测试 (待添加)
    ├── api-latency.json            # API 延迟
    └── concurrent-execution.json   # 并发执行
```

### 4.2 现有文件到新结构的映射

| 原文件 | 新位置 | 调整说明 |
|--------|--------|----------|
| `self-test-platform.json` | `smoke/critical-path.json` | 精简为冒烟测试 |
| `self-test-testcase-api.json` | `api/testcase-api.json` | 保持不变 |
| `self-test-workflow-execution-api.json` | `functional/workflow-execution.json` | 重命名 |
| `self-test-tenant-api.json` | `api/tenant-api.json` | 保持不变 |
| `self-test-project-api.json` | `api/project-api.json` | 保持不变 |
| `self-test-environment-api.json` | `api/environment-api.json` | 保持不变 |
| `self-test-testgroup-api.json` | `api/testgroup-api.json` | 保持不变 |
| `self-test-error-handling.json` | 拆分到 `negative/` | 按错误码拆分 |
| `05-multi-tenant-tests.json` | `integration/multi-tenant.json` | 保持不变 |
| `06-end-to-end-integration-test.json` | `integration/e2e-complete.json` | 保持不变 |

### 4.3 测试套件定义

```json
// test-suites.json - 测试套件配置

{
  "suites": {
    "smoke": {
      "name": "冒烟测试",
      "description": "快速验证系统可用性",
      "timeout": "5m",
      "tests": [
        "smoke/platform-health.json",
        "smoke/critical-path.json"
      ],
      "schedule": "*/30 * * * *",
      "triggerOn": ["commit", "pr"]
    },

    "api-regression": {
      "name": "API 回归测试",
      "description": "验证 API 契约稳定性",
      "timeout": "15m",
      "tests": [
        "api/testcase-api.json",
        "api/workflow-api.json",
        "api/environment-api.json",
        "api/testgroup-api.json",
        "api/tenant-api.json",
        "api/project-api.json"
      ],
      "triggerOn": ["merge-to-main"]
    },

    "negative": {
      "name": "错误处理测试",
      "description": "验证错误响应正确性",
      "timeout": "10m",
      "tests": [
        "negative/error-400.json",
        "negative/error-404.json",
        "negative/error-409.json"
      ],
      "triggerOn": ["release"]
    },

    "full-regression": {
      "name": "完整回归测试",
      "description": "发布前完整验证",
      "timeout": "30m",
      "tests": [
        "smoke/*",
        "api/*",
        "functional/*",
        "negative/*",
        "integration/*"
      ],
      "triggerOn": ["release"]
    }
  }
}
```

---

## 5. 实施建议

### 5.1 短期改进 (1-2周)

1. **文件重组**: 按照 4.1 的结构重新组织测试文件
2. **添加缺失测试**:
   - `PUT` 操作的完整测试
   - `suspend/activate` 操作测试
   - `archive` 操作测试
3. **断言增强**:
   - 添加响应时间断言
   - 添加数据库状态验证

### 5.2 中期改进 (2-4周)

1. **测试套件配置**: 实现 `test-suites.json` 驱动的测试执行
2. **CI/CD 集成**: 在不同阶段触发相应测试套件
3. **报告增强**: 按套件生成聚合报告
4. **并发测试**: 添加并发场景验证

### 5.3 长期改进 (1-2月)

1. **性能基准**: 建立 API 响应时间基准
2. **混沌测试**: 添加故障注入测试
3. **安全测试**: 添加权限边界测试
4. **可视化**: 测试覆盖率仪表盘

### 5.4 测试数据管理建议

```go
// 测试数据生命周期管理

type TestDataManager interface {
    // 创建隔离的测试数据
    CreateIsolatedData(ctx context.Context, testID string) (*TestData, error)

    // 清理测试数据
    CleanupTestData(ctx context.Context, testID string) error

    // 验证数据隔离
    VerifyIsolation(ctx context.Context, tenantID string) (bool, error)
}
```

**关键原则**:
1. 每个测试使用唯一时间戳生成 ID
2. 测试开始前清理可能的残留数据
3. 测试结束后确保清理所有创建的数据
4. 支持并行执行而不互相干扰

---

## 附录

### A. 测试用例模板

```json
{
  "workflowId": "test-{feature}-{scenario}",
  "name": "{Feature} - {Scenario} Test",
  "version": "1.0.0",
  "description": "测试 {Feature} 的 {Scenario} 场景",
  "definition": {
    "variables": {
      "baseUrl": "http://localhost:8090/api",
      "dbPath": "./data/test_management.db",
      "testId": ""
    },
    "steps": {
      "step01_setup": {
        "id": "step01_setup",
        "name": "[Setup] 准备测试数据",
        "type": "script",
        "config": { }
      },
      "step02_execute": {
        "id": "step02_execute",
        "name": "[Execute] 执行测试操作",
        "type": "http",
        "dependsOn": ["step01_setup"],
        "config": { }
      },
      "step03_verify": {
        "id": "step03_verify",
        "name": "[Verify] 验证结果",
        "type": "assert",
        "dependsOn": ["step02_execute"],
        "config": { }
      },
      "step04_cleanup": {
        "id": "step04_cleanup",
        "name": "[Cleanup] 清理测试数据",
        "type": "database",
        "dependsOn": ["step03_verify"],
        "config": { }
      }
    }
  }
}
```

### B. 断言类型参考

| 类型 | 语法 | 示例 |
|------|------|------|
| `equals` | `actual == expected` | `status == 200` |
| `not_equals` | `actual != expected` | `status != 500` |
| `greater_than` | `actual > expected` | `count > 0` |
| `less_than` | `actual < expected` | `duration < 1000` |
| `contains` | `actual contains expected` | `error contains "not found"` |
| `exists` | `actual exists` | `response.id exists` |
| `matches` | `actual matches pattern` | `email matches ".*@.*"` |
| `json_path` | `jsonPath(actual, path) == expected` | `$.users[0].name == "test"` |

---

**文档结束**
