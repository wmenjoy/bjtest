# 测试平台产品化设计方案

> **文档版本**: v1.0.0
> **创建日期**: 2025-11-24
> **最后更新**: 2025-11-24
> **状态**: 设计方案，待评审

## 目录

- [1. 资源复用与生命周期管理](#1-资源复用与生命周期管理)
- [2. 测试用例有效管理](#2-测试用例有效管理)
- [3. 规范测试报告](#3-规范测试报告)
- [4. 多类型测试与CI/CD集成](#4-多类型测试与cicd集成)
- [5. 前端测试支持](#5-前端测试支持)
- [6. 移动端测试支持](#6-移动端测试支持)
- [7. 实施路线图](#7-实施路线图)

---

## 1. 资源复用与生命周期管理

### 1.1 问题分析

**从测试角度（QA）**:
- 测试前需要准备数据（用户、订单、库存等）
- 测试后需要清理数据，避免污染环境
- 多个测试用例可能需要相同的前置资源

**从产品经理角度（PM）**:
- 需要复用常见的业务流程（登录、创建订单、支付）
- 希望组装业务场景而不是每次从头编写
- 需要跨项目/跨团队共享测试资源

### 1.2 设计方案：三层资源管理体系

```
┌─────────────────────────────────────────────────────────┐
│             资源复用三层架构                              │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Layer 1: 原子资源 (Atomic Resources)                   │
│  ════════════════════════════════════                   │
│  • 数据库记录 (User, Product, Order)                    │
│  • 外部服务配置 (Redis, Kafka)                          │
│  • 文件资源 (上传文件, 配置文件)                         │
│  • 环境变量 (API Keys, Tokens)                          │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Layer 2: 资源模板 (Resource Templates)                 │
│  ═══════════════════════════════════                    │
│  • 标准用户模板 (Admin, Normal User, Guest)             │
│  • 业务数据模板 (订单模板, 商品模板)                      │
│  • 可参数化配置                                          │
│  • 支持多租户隔离                                        │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Layer 3: 资源池 (Resource Pools)                       │
│  ═════════════════════════════                          │
│  • 预创建的资源集合                                      │
│  • 动态分配与回收                                        │
│  • 并发测试资源隔离                                      │
│  • 生命周期自动管理                                      │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 1.3 数据模型设计

#### 1.3.1 资源模板表 (resource_templates)

```sql
CREATE TABLE resource_templates (
    id INTEGER PRIMARY KEY,
    resource_id VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL,  -- user, data, config, file
    scope VARCHAR(20) NOT NULL,     -- system, platform, tenant, project
    tenant_id VARCHAR(255),
    project_id VARCHAR(255),

    -- 模板定义
    definition TEXT NOT NULL,       -- JSON: 创建资源的步骤定义
    cleanup_definition TEXT,        -- JSON: 清理资源的步骤定义

    -- 参数定义
    parameters TEXT,                -- JSON: 可配置参数列表
    default_values TEXT,            -- JSON: 默认参数值

    -- 依赖关系
    depends_on TEXT,                -- JSON: 依赖的其他资源模板

    -- 元数据
    description TEXT,
    tags TEXT,                      -- JSON: 标签数组
    is_public BOOLEAN DEFAULT FALSE,
    allow_copy BOOLEAN DEFAULT TRUE,
    created_by VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    deleted_at DATETIME,

    INDEX idx_resource_templates_category (category),
    INDEX idx_resource_templates_scope (scope),
    INDEX idx_resource_templates_tenant (tenant_id)
);
```

**示例数据 - 标准测试用户模板**:

```json
{
  "resource_id": "resource-test-user",
  "name": "标准测试用户",
  "category": "user",
  "scope": "platform",
  "definition": {
    "type": "workflow",
    "steps": [
      {
        "id": "create-user",
        "type": "http",
        "config": {
          "method": "POST",
          "path": "/api/users",
          "body": {
            "username": "{{username}}",
            "password": "{{password}}",
            "email": "{{email}}",
            "role": "{{role}}"
          }
        },
        "outputs": {
          "response.body.userId": "userId",
          "response.body.token": "authToken"
        }
      }
    ]
  },
  "cleanup_definition": {
    "type": "workflow",
    "steps": [
      {
        "id": "delete-user",
        "type": "http",
        "config": {
          "method": "DELETE",
          "path": "/api/users/{{userId}}",
          "headers": {
            "Authorization": "Bearer {{authToken}}"
          }
        }
      }
    ]
  },
  "parameters": [
    {
      "name": "username",
      "type": "string",
      "required": true,
      "description": "用户名"
    },
    {
      "name": "password",
      "type": "string",
      "required": false,
      "description": "密码，默认为 'test123'"
    },
    {
      "name": "email",
      "type": "string",
      "required": false,
      "description": "邮箱，默认自动生成"
    },
    {
      "name": "role",
      "type": "string",
      "required": false,
      "enum": ["admin", "user", "guest"],
      "description": "用户角色，默认为 user"
    }
  ],
  "default_values": {
    "password": "test123",
    "email": "test-{{timestamp}}@example.com",
    "role": "user"
  }
}
```

#### 1.3.2 资源实例表 (resource_instances)

```sql
CREATE TABLE resource_instances (
    id INTEGER PRIMARY KEY,
    instance_id VARCHAR(255) UNIQUE NOT NULL,
    resource_id VARCHAR(255) NOT NULL,  -- 关联 resource_templates
    test_id VARCHAR(255),               -- 关联的测试用例
    run_id VARCHAR(255),                -- 关联的测试执行

    -- 实例状态
    status VARCHAR(32) NOT NULL,        -- creating, ready, in_use, cleaning, deleted

    -- 实例数据
    instance_data TEXT NOT NULL,        -- JSON: 实例的实际数据
    allocated_at DATETIME,
    released_at DATETIME,

    -- 生命周期
    ttl INTEGER,                        -- Time to live (seconds)
    expires_at DATETIME,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (resource_id) REFERENCES resource_templates(resource_id),
    INDEX idx_resource_instances_test_id (test_id),
    INDEX idx_resource_instances_run_id (run_id),
    INDEX idx_resource_instances_status (status),
    INDEX idx_resource_instances_expires_at (expires_at)
);
```

### 1.4 测试用例中的资源声明

扩展 `TestCase` 模型，增加资源管理字段：

```go
type TestCase struct {
    // ... 现有字段 ...

    // 资源管理 (新增)
    RequiredResources []ResourceRequirement `gorm:"type:text;column:required_resources" json:"requiredResources,omitempty"`
    ResourceLifecycle string                `gorm:"size:50;default:'test_scoped'" json:"resourceLifecycle,omitempty"` // test_scoped, suite_scoped, persistent
}

type ResourceRequirement struct {
    ResourceID string                 `json:"resourceId"`      // 引用 resource_templates
    Alias      string                 `json:"alias"`           // 在测试中的别名
    Parameters map[string]interface{} `json:"parameters"`      // 覆盖默认参数
    Lifecycle  string                 `json:"lifecycle"`       // auto, manual
    Order      int                    `json:"order"`           // 创建顺序
}
```

**示例：测试用例中声明资源需求**

```json
{
  "testId": "test-order-creation",
  "name": "订单创建流程测试",
  "type": "workflow",
  "requiredResources": [
    {
      "resourceId": "resource-test-user",
      "alias": "testUser",
      "parameters": {
        "role": "user"
      },
      "lifecycle": "auto",
      "order": 1
    },
    {
      "resourceId": "resource-test-product",
      "alias": "testProduct",
      "parameters": {
        "stock": 100,
        "price": 99.99
      },
      "lifecycle": "auto",
      "order": 2
    }
  ],
  "steps": [
    {
      "id": "login",
      "type": "http",
      "config": {
        "method": "POST",
        "path": "/api/login",
        "body": {
          "username": "{{testUser.username}}",
          "password": "{{testUser.password}}"
        }
      }
    },
    {
      "id": "create-order",
      "type": "http",
      "config": {
        "method": "POST",
        "path": "/api/orders",
        "headers": {
          "Authorization": "Bearer {{login.response.body.token}}"
        },
        "body": {
          "productId": "{{testProduct.productId}}",
          "quantity": 1
        }
      }
    }
  ]
}
```

### 1.5 资源生命周期管理

#### 1.5.1 资源管理器 (ResourceManager)

```go
package resource

type ResourceManager interface {
    // 分配资源
    AllocateResources(ctx context.Context, requirements []ResourceRequirement) (map[string]*ResourceInstance, error)

    // 释放资源
    ReleaseResources(ctx context.Context, instanceIds []string) error

    // 获取资源实例
    GetInstance(ctx context.Context, instanceId string) (*ResourceInstance, error)

    // 清理过期资源
    CleanupExpiredResources(ctx context.Context) (int, error)
}

type ResourceInstance struct {
    InstanceID   string
    ResourceID   string
    Status       string
    Data         map[string]interface{} // 资源的实际数据
    AllocatedAt  time.Time
    ExpiresAt    time.Time
}
```

#### 1.5.2 资源分配流程

```
测试执行流程（带资源管理）
═════════════════════════

1. 【解析资源需求】
   ├─ 读取 test_case.required_resources
   ├─ 按 order 排序
   └─ 检查依赖关系

2. 【分配资源】
   ├─ 检查资源池是否有可用实例
   │  ├─ 有 → 直接分配
   │  └─ 无 → 创建新实例
   ├─ 执行资源模板的 definition
   ├─ 记录实例到 resource_instances
   └─ 返回实例数据

3. 【执行测试】
   ├─ 注入资源变量（{{testUser.username}}）
   ├─ 执行测试步骤
   └─ 记录测试结果

4. 【清理资源】
   ├─ 根据 lifecycle 决定清理策略
   │  ├─ test_scoped → 立即清理
   │  ├─ suite_scoped → 批次结束后清理
   │  └─ persistent → 不清理（手动）
   ├─ 执行资源模板的 cleanup_definition
   └─ 更新实例状态为 deleted
```

#### 1.5.3 后台清理任务

```go
// 定时清理过期资源
func (m *ResourceManagerImpl) StartCleanupWorker(ctx context.Context) {
    ticker := time.NewTicker(5 * time.Minute)
    defer ticker.Stop()

    for {
        select {
        case <-ticker.C:
            count, err := m.CleanupExpiredResources(ctx)
            if err != nil {
                log.Printf("Failed to cleanup expired resources: %v", err)
            } else {
                log.Printf("Cleaned up %d expired resources", count)
            }
        case <-ctx.Done():
            return
        }
    }
}

func (m *ResourceManagerImpl) CleanupExpiredResources(ctx context.Context) (int, error) {
    // 1. 查询过期资源
    var instances []models.ResourceInstance
    err := m.db.Where("status IN (?, ?)", "ready", "in_use").
        Where("expires_at < ?", time.Now()).
        Find(&instances).Error
    if err != nil {
        return 0, err
    }

    cleaned := 0
    for _, instance := range instances {
        // 2. 执行清理脚本
        template, err := m.GetTemplate(ctx, instance.ResourceID)
        if err != nil {
            continue
        }

        if template.CleanupDefinition != nil {
            err = m.executeCleanup(ctx, template, instance)
            if err != nil {
                log.Printf("Failed to cleanup instance %s: %v", instance.InstanceID, err)
                continue
            }
        }

        // 3. 标记为已删除
        instance.Status = "deleted"
        instance.ReleasedAt = time.Now()
        m.db.Save(&instance)
        cleaned++
    }

    return cleaned, nil
}
```

### 1.6 前端UI设计

#### 1.6.1 资源模板库页面

```typescript
// components/ResourceLibrary.tsx

interface ResourceTemplate {
    resourceId: string;
    name: string;
    category: 'user' | 'data' | 'config' | 'file';
    scope: 'system' | 'platform' | 'tenant' | 'project';
    definition: WorkflowDefinition;
    cleanupDefinition?: WorkflowDefinition;
    parameters: ResourceParameter[];
    defaultValues: Record<string, any>;
}

const ResourceLibrary = () => {
    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold">资源模板库</h1>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg">
                    + 新建资源模板
                </button>
            </div>

            {/* 分类标签 */}
            <div className="flex space-x-2 mb-6">
                <button className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full">
                    👤 用户 (15)
                </button>
                <button className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full">
                    📦 数据 (23)
                </button>
                <button className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full">
                    ⚙️ 配置 (8)
                </button>
                <button className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full">
                    📄 文件 (5)
                </button>
            </div>

            {/* 资源模板列表 */}
            <div className="grid grid-cols-3 gap-4">
                {templates.map(template => (
                    <ResourceTemplateCard key={template.resourceId} template={template} />
                ))}
            </div>
        </div>
    );
};
```

#### 1.6.2 测试用例资源配置

```typescript
// components/testcase/ResourceConfig.tsx

const ResourceConfig = ({ testCase, onChange }) => {
    return (
        <div className="bg-white rounded-lg border p-4">
            <h3 className="text-sm font-bold text-slate-700 mb-3">
                所需资源
            </h3>

            {testCase.requiredResources.map((req, idx) => (
                <div key={idx} className="mb-3 p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-sm text-blue-600">
                            {req.alias}
                        </span>
                        <span className="text-xs text-slate-500">
                            {req.resourceId}
                        </span>
                    </div>

                    {/* 参数覆盖 */}
                    <div className="text-xs">
                        <span className="text-slate-500">参数: </span>
                        {JSON.stringify(req.parameters)}
                    </div>

                    {/* 生命周期 */}
                    <div className="mt-2 flex items-center space-x-2">
                        <select value={req.lifecycle} className="text-xs">
                            <option value="auto">自动管理</option>
                            <option value="manual">手动管理</option>
                        </select>
                        <span className="text-[10px] text-slate-400">
                            创建顺序: {req.order}
                        </span>
                    </div>
                </div>
            ))}

            <button className="w-full mt-2 py-2 border-2 border-dashed border-slate-300 rounded-lg text-sm text-slate-500 hover:border-blue-400 hover:text-blue-600">
                + 添加资源
            </button>
        </div>
    );
};
```

---

## 2. 测试用例有效管理

### 2.1 问题分析

**测试用例管理的核心挑战**:
- 测试用例数量快速增长（数千个用例）
- 如何快速找到需要的测试用例
- 如何组织测试用例避免混乱
- 如何评估测试用例的价值
- 如何维护和更新测试用例

### 2.2 设计方案：多维度测试用例管理

```
┌─────────────────────────────────────────────────────────┐
│            测试用例管理体系                              │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  1. 分层分组 (Hierarchical Groups)                      │
│     • 按业务模块分组                                     │
│     • 按测试类型分组                                     │
│     • 按优先级分组                                       │
│     • 支持无限层级                                       │
│                                                         │
│  2. 智能标签 (Smart Tags)                               │
│     • 功能标签: #登录 #支付 #订单                        │
│     • 类型标签: #smoke #regression #e2e                 │
│     • 状态标签: #stable #flaky #deprecated              │
│     • 自动标签: #high-failure-rate #long-running        │
│                                                         │
│  3. 元数据丰富化 (Metadata Enrichment)                  │
│     • 测试目标 (objective)                              │
│     • 前置条件 (preconditions)                          │
│     • 维护人 (owner)                                    │
│     • 最后执行时间                                       │
│     • 平均执行时长                                       │
│     • 成功率统计                                         │
│                                                         │
│  4. 智能搜索 (Smart Search)                             │
│     • 全文搜索                                           │
│     • 多条件过滤                                         │
│     • 模糊匹配                                           │
│     • 搜索历史记录                                       │
│                                                         │
│  5. 测试集合 (Test Suites)                              │
│     • 冒烟测试集                                         │
│     • 回归测试集                                         │
│     • 发布前测试集                                       │
│     • 动态测试集 (基于条件)                              │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 2.3 数据模型扩展

#### 2.3.1 扩展 test_cases 表

```sql
ALTER TABLE test_cases ADD COLUMN owner VARCHAR(255);                -- 维护人
ALTER TABLE test_cases ADD COLUMN last_run_at DATETIME;             -- 最后执行时间
ALTER TABLE test_cases ADD COLUMN avg_duration INTEGER;             -- 平均执行时长(ms)
ALTER TABLE test_cases ADD COLUMN success_rate DECIMAL(5,2);        -- 成功率
ALTER TABLE test_cases ADD COLUMN execution_count INTEGER DEFAULT 0; -- 执行次数
ALTER TABLE test_cases ADD COLUMN failure_count INTEGER DEFAULT 0;   -- 失败次数
ALTER TABLE test_cases ADD COLUMN is_flaky BOOLEAN DEFAULT FALSE;    -- 是否不稳定
ALTER TABLE test_cases ADD COLUMN is_deprecated BOOLEAN DEFAULT FALSE; -- 是否已废弃
ALTER TABLE test_cases ADD COLUMN deprecation_reason TEXT;           -- 废弃原因

CREATE INDEX idx_test_cases_owner ON test_cases(owner);
CREATE INDEX idx_test_cases_last_run_at ON test_cases(last_run_at);
CREATE INDEX idx_test_cases_success_rate ON test_cases(success_rate);
CREATE INDEX idx_test_cases_is_flaky ON test_cases(is_flaky);
```

#### 2.3.2 测试集合表 (test_suites)

```sql
CREATE TABLE test_suites (
    id INTEGER PRIMARY KEY,
    suite_id VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL,              -- static, dynamic
    tenant_id VARCHAR(255),
    project_id VARCHAR(255),

    -- 静态集合
    test_case_ids TEXT,                     -- JSON: 测试用例ID列表

    -- 动态集合（基于条件）
    selection_criteria TEXT,                -- JSON: 选择条件

    -- 执行配置
    execution_config TEXT,                  -- JSON: 并发数、超时等

    -- 调度配置
    schedule_config TEXT,                   -- JSON: cron 表达式

    -- 元数据
    created_by VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    deleted_at DATETIME,

    INDEX idx_test_suites_type (type),
    INDEX idx_test_suites_tenant (tenant_id),
    INDEX idx_test_suites_project (project_id)
);
```

**示例：动态测试集合（冒烟测试）**

```json
{
  "suite_id": "suite-smoke-tests",
  "name": "冒烟测试集",
  "type": "dynamic",
  "selection_criteria": {
    "tags": {
      "include": ["smoke"],
      "exclude": ["deprecated"]
    },
    "priority": ["P0"],
    "status": ["active"],
    "successRate": {
      "min": 0.95
    },
    "isFlaky": false
  },
  "execution_config": {
    "parallelism": 5,
    "timeout": 300,
    "stopOnFirstFailure": false
  }
}
```

### 2.4 智能标签系统

#### 2.4.1 自动标签生成

```go
// 后台任务：分析测试执行结果，自动打标签
func (s *TestService) AnalyzeAndTagTests(ctx context.Context) error {
    tests, err := s.repo.ListAllTests(ctx)
    if err != nil {
        return err
    }

    for _, test := range tests {
        // 1. 分析成功率
        if test.SuccessRate < 0.8 {
            test.AddTag("#low-success-rate")
        }

        // 2. 分析稳定性（flaky）
        if test.IsFlaky {
            test.AddTag("#flaky")
        }

        // 3. 分析执行时长
        if test.AvgDuration > 60000 { // 超过1分钟
            test.AddTag("#long-running")
        }

        // 4. 分析最后执行时间
        if time.Since(test.LastRunAt) > 30*24*time.Hour { // 30天未执行
            test.AddTag("#unused")
        }

        // 5. 检测flaky pattern
        recentResults := s.GetRecentResults(ctx, test.TestID, 10)
        if s.DetectFlakyPattern(recentResults) {
            test.IsFlaky = true
            test.AddTag("#flaky")
        }

        s.repo.UpdateTest(ctx, test)
    }

    return nil
}

// 检测 flaky pattern: 连续成功和失败交替
func (s *TestService) DetectFlakyPattern(results []TestResult) bool {
    if len(results) < 5 {
        return false
    }

    changes := 0
    for i := 1; i < len(results); i++ {
        if results[i].Status != results[i-1].Status {
            changes++
        }
    }

    // 如果状态变化超过40%，认为是flaky
    changeRate := float64(changes) / float64(len(results)-1)
    return changeRate > 0.4
}
```

### 2.5 智能搜索与过滤

#### 2.5.1 搜索API

```go
type TestSearchRequest struct {
    // 全文搜索
    Keyword string `json:"keyword"`

    // 精确过滤
    Groups    []string `json:"groups"`
    Types     []string `json:"types"`
    Priorities []string `json:"priorities"`
    Statuses  []string `json:"statuses"`
    Owners    []string `json:"owners"`

    // 标签过滤
    IncludeTags []string `json:"includeTags"`
    ExcludeTags []string `json:"excludeTags"`

    // 范围过滤
    SuccessRateMin *float64 `json:"successRateMin"`
    SuccessRateMax *float64 `json:"successRateMax"`
    AvgDurationMin *int     `json:"avgDurationMin"`
    AvgDurationMax *int     `json:"avgDurationMax"`

    // 时间过滤
    LastRunAfter  *time.Time `json:"lastRunAfter"`
    LastRunBefore *time.Time `json:"lastRunBefore"`

    // 布尔过滤
    IsFlaky      *bool `json:"isFlaky"`
    IsDeprecated *bool `json:"isDeprecated"`

    // 排序和分页
    SortBy    string `json:"sortBy"`    // name, lastRunAt, successRate, avgDuration
    SortOrder string `json:"sortOrder"` // asc, desc
    Page      int    `json:"page"`
    PageSize  int    `json:"pageSize"`
}

// GET /api/v2/tests/search
func (h *TestHandler) SearchTests(c *gin.Context) {
    var req TestSearchRequest
    if err := c.BindJSON(&req); err != nil {
        c.JSON(400, gin.H{"error": err.Error()})
        return
    }

    results, total, err := h.service.SearchTests(c.Request.Context(), &req)
    if err != nil {
        c.JSON(500, gin.H{"error": err.Error()})
        return
    }

    c.JSON(200, gin.H{
        "tests": results,
        "total": total,
        "page": req.Page,
        "pageSize": req.PageSize,
    })
}
```

### 2.6 测试用例价值评估

```go
type TestCaseValue struct {
    TestID          string  `json:"testId"`
    Name            string  `json:"name"`
    ValueScore      float64 `json:"valueScore"`      // 0-100

    // 价值维度
    CoverageScore   float64 `json:"coverageScore"`   // 覆盖重要功能
    StabilityScore  float64 `json:"stabilityScore"`  // 稳定性
    EfficiencyScore float64 `json:"efficiencyScore"` // 执行效率
    MaintenanceScore float64 `json:"maintenanceScore"` // 维护成本

    Recommendation  string  `json:"recommendation"`  // keep, optimize, deprecate
}

func (s *TestService) EvaluateTestValue(test *TestCase) *TestCaseValue {
    value := &TestCaseValue{
        TestID: test.TestID,
        Name:   test.Name,
    }

    // 1. 覆盖分数 (基于优先级和标签)
    if test.Priority == "P0" {
        value.CoverageScore = 100
    } else if test.Priority == "P1" {
        value.CoverageScore = 70
    } else {
        value.CoverageScore = 40
    }

    // 2. 稳定性分数
    value.StabilityScore = test.SuccessRate * 100
    if test.IsFlaky {
        value.StabilityScore -= 30
    }

    // 3. 效率分数 (执行时间越短越好)
    if test.AvgDuration < 5000 { // 5秒以内
        value.EfficiencyScore = 100
    } else if test.AvgDuration < 30000 { // 30秒以内
        value.EfficiencyScore = 70
    } else {
        value.EfficiencyScore = 40
    }

    // 4. 维护成本 (最近更新频率)
    daysSinceUpdate := time.Since(test.UpdatedAt).Hours() / 24
    if daysSinceUpdate > 90 {
        value.MaintenanceScore = 100 // 长期稳定
    } else if daysSinceUpdate > 30 {
        value.MaintenanceScore = 70
    } else {
        value.MaintenanceScore = 40 // 频繁修改
    }

    // 综合评分
    value.ValueScore = (value.CoverageScore + value.StabilityScore +
                       value.EfficiencyScore + value.MaintenanceScore) / 4

    // 推荐决策
    if value.ValueScore >= 80 {
        value.Recommendation = "keep"
    } else if value.ValueScore >= 50 {
        value.Recommendation = "optimize"
    } else {
        value.Recommendation = "deprecate"
    }

    return value
}
```

### 2.7 前端UI：测试用例管理中心

```typescript
// components/TestCaseCenter.tsx

const TestCaseCenter = () => {
    return (
        <div className="h-screen flex">
            {/* 左侧：分组树 + 过滤器 */}
            <div className="w-80 border-r bg-slate-50 p-4 overflow-y-auto">
                <h3 className="font-bold mb-3">测试分组</h3>
                <TestGroupTree />

                <hr className="my-4" />

                <h3 className="font-bold mb-3">快速过滤</h3>
                <div className="space-y-2">
                    <FilterButton label="我的测试" icon="👤" />
                    <FilterButton label="P0用例" icon="🔥" />
                    <FilterButton label="不稳定" icon="⚠️" badge={3} />
                    <FilterButton label="长时间运行" icon="⏱️" />
                    <FilterButton label="30天未执行" icon="💤" />
                </div>

                <hr className="my-4" />

                <h3 className="font-bold mb-3">标签云</h3>
                <TagCloud tags={["smoke", "regression", "api", "e2e"]} />
            </div>

            {/* 中间：测试用例列表 */}
            <div className="flex-1 flex flex-col">
                {/* 搜索栏 */}
                <div className="p-4 border-b bg-white">
                    <div className="flex items-center space-x-2">
                        <input
                            type="text"
                            placeholder="搜索测试用例..."
                            className="flex-1 px-4 py-2 border rounded-lg"
                        />
                        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg">
                            高级搜索
                        </button>
                    </div>

                    {/* 当前过滤器 */}
                    <div className="flex items-center space-x-2 mt-2">
                        <FilterChip label="优先级: P0" onRemove={() => {}} />
                        <FilterChip label="标签: smoke" onRemove={() => {}} />
                        <FilterChip label="成功率 > 95%" onRemove={() => {}} />
                    </div>
                </div>

                {/* 测试用例列表 */}
                <div className="flex-1 overflow-y-auto p-4">
                    <TestCaseList />
                </div>
            </div>

            {/* 右侧：测试用例详情 */}
            <div className="w-96 border-l bg-white p-4 overflow-y-auto">
                <TestCaseDetail />
            </div>
        </div>
    );
};
```

---

## 3. 规范测试报告

### 3.1 问题分析

**测试报告的核心需求**:
- 不同角色需要不同粒度的报告（开发 vs QA vs 管理层）
- 需要快速定位失败原因
- 需要趋势分析和历史对比
- 需要支持多种导出格式（HTML, PDF, JSON）
- 需要自动化报告分发

### 3.2 设计方案：分层报告体系

```
┌─────────────────────────────────────────────────────────┐
│              测试报告分层架构                            │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Layer 1: 执行报告 (Execution Report)                   │
│  ════════════════════════════════════                   │
│  • 单次测试执行结果                                      │
│  • 步骤级详细日志                                        │
│  • 失败原因分析                                          │
│  • 截图和录屏（如有）                                    │
│  • 适合开发人员调试                                      │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Layer 2: 批次报告 (Batch Report)                       │
│  ═══════════════════════════                            │
│  • 批量测试执行汇总                                      │
│  • 通过率统计                                            │
│  • 失败用例列表                                          │
│  • 执行时长分析                                          │
│  • 适合QA团队评审                                        │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Layer 3: 趋势报告 (Trend Report)                       │
│  ═══════════════════════════                            │
│  • 时间序列分析                                          │
│  • 质量趋势图表                                          │
│  • 不稳定用例识别                                        │
│  • 性能回归检测                                          │
│  • 适合管理层决策                                        │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 3.3 数据模型：测试报告表

```sql
CREATE TABLE test_reports (
    id INTEGER PRIMARY KEY,
    report_id VARCHAR(255) UNIQUE NOT NULL,
    type VARCHAR(50) NOT NULL,              -- execution, batch, trend, custom
    run_id VARCHAR(255),                    -- 关联测试批次
    suite_id VARCHAR(255),                  -- 关联测试集

    -- 报告元数据
    title VARCHAR(255) NOT NULL,
    summary TEXT,
    generated_at DATETIME NOT NULL,
    generated_by VARCHAR(255),

    -- 报告内容
    content TEXT NOT NULL,                  -- JSON: 报告完整数据

    -- 统计数据
    total_tests INTEGER DEFAULT 0,
    passed_tests INTEGER DEFAULT 0,
    failed_tests INTEGER DEFAULT 0,
    error_tests INTEGER DEFAULT 0,
    skipped_tests INTEGER DEFAULT 0,
    success_rate DECIMAL(5,2),
    total_duration INTEGER,                 -- milliseconds

    -- 附件
    attachments TEXT,                       -- JSON: 截图、日志文件等

    -- 发布配置
    recipients TEXT,                        -- JSON: 接收人列表
    send_status VARCHAR(32),                -- pending, sent, failed
    sent_at DATETIME,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_test_reports_type (type),
    INDEX idx_test_reports_run_id (run_id),
    INDEX idx_test_reports_generated_at (generated_at)
);
```

### 3.4 报告生成器

```go
package report

type ReportGenerator interface {
    // 生成执行报告
    GenerateExecutionReport(ctx context.Context, result *TestResult) (*Report, error)

    // 生成批次报告
    GenerateBatchReport(ctx context.Context, runID string) (*Report, error)

    // 生成趋势报告
    GenerateTrendReport(ctx context.Context, opts *TrendReportOptions) (*Report, error)

    // 导出报告
    ExportReport(ctx context.Context, report *Report, format string) ([]byte, error)
}

type Report struct {
    ReportID    string
    Type        string
    Title       string
    Summary     string
    GeneratedAt time.Time

    // 统计数据
    Statistics *ReportStatistics

    // 章节
    Sections []ReportSection

    // 附件
    Attachments []Attachment
}

type ReportStatistics struct {
    TotalTests    int
    PassedTests   int
    FailedTests   int
    ErrorTests    int
    SkippedTests  int
    SuccessRate   float64
    TotalDuration int
}

type ReportSection struct {
    ID      string
    Title   string
    Type    string // summary, details, charts, failures
    Content interface{}
}
```

### 3.5 批次报告示例

```go
func (g *ReportGeneratorImpl) GenerateBatchReport(ctx context.Context, runID string) (*Report, error) {
    // 1. 获取测试批次信息
    run, err := g.testService.GetTestRun(ctx, runID)
    if err != nil {
        return nil, err
    }

    // 2. 获取所有测试结果
    results, err := g.testService.GetTestResultsByRunID(ctx, runID)
    if err != nil {
        return nil, err
    }

    // 3. 构建报告
    report := &Report{
        ReportID:    generateReportID(),
        Type:        "batch",
        Title:       fmt.Sprintf("测试批次报告 - %s", run.Name),
        GeneratedAt: time.Now(),
        Statistics: &ReportStatistics{
            TotalTests:    run.Total,
            PassedTests:   run.Passed,
            FailedTests:   run.Failed,
            ErrorTests:    run.Errors,
            SkippedTests:  run.Skipped,
            SuccessRate:   float64(run.Passed) / float64(run.Total) * 100,
            TotalDuration: run.Duration,
        },
    }

    // 4. 添加章节：概览
    report.Sections = append(report.Sections, ReportSection{
        ID:    "summary",
        Title: "执行概览",
        Type:  "summary",
        Content: map[string]interface{}{
            "runId":     run.RunID,
            "startTime": run.StartTime,
            "endTime":   run.EndTime,
            "duration":  run.Duration,
            "status":    run.Status,
        },
    })

    // 5. 添加章节：失败用例
    failedResults := filterFailedResults(results)
    report.Sections = append(report.Sections, ReportSection{
        ID:    "failures",
        Title: "失败用例",
        Type:  "failures",
        Content: map[string]interface{}{
            "total":   len(failedResults),
            "details": failedResults,
        },
    })

    // 6. 添加章节：性能分析
    report.Sections = append(report.Sections, ReportSection{
        ID:    "performance",
        Title: "性能分析",
        Type:  "charts",
        Content: g.analyzePerformance(results),
    })

    // 7. 添加章节：覆盖率
    report.Sections = append(report.Sections, ReportSection{
        ID:    "coverage",
        Title: "测试覆盖率",
        Type:  "charts",
        Content: g.analyzeCoverage(results),
    })

    return report, nil
}
```

### 3.6 HTML报告模板

```go
// 生成HTML报告
func (g *ReportGeneratorImpl) ExportHTML(report *Report) ([]byte, error) {
    tmpl := `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>{{.Title}}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .header { border-bottom: 3px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; }
        .header h1 { margin: 0; color: #1e293b; }
        .header .meta { color: #64748b; margin-top: 10px; }
        .stats { display: grid; grid-template-columns: repeat(5, 1fr); gap: 20px; margin-bottom: 30px; }
        .stat-card { background: #f8fafc; padding: 20px; border-radius: 8px; border-left: 4px solid #2563eb; }
        .stat-card.passed { border-left-color: #10b981; }
        .stat-card.failed { border-left-color: #ef4444; }
        .stat-card.error { border-left-color: #f59e0b; }
        .stat-card.skipped { border-left-color: #6b7280; }
        .stat-card .label { color: #64748b; font-size: 14px; }
        .stat-card .value { font-size: 32px; font-weight: bold; color: #1e293b; }
        .section { margin-bottom: 40px; }
        .section h2 { color: #1e293b; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; }
        .failure-list { background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 20px; }
        .failure-item { background: white; padding: 15px; margin-bottom: 10px; border-radius: 6px; border-left: 4px solid #ef4444; }
        .failure-item .name { font-weight: bold; color: #dc2626; }
        .failure-item .error { color: #991b1b; font-family: monospace; font-size: 12px; margin-top: 10px; }
        .chart { width: 100%; height: 300px; }
    </style>
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4"></script>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <h1>{{.Title}}</h1>
            <div class="meta">
                生成时间: {{.GeneratedAt.Format "2006-01-02 15:04:05"}} |
                报告ID: {{.ReportID}}
            </div>
        </div>

        <!-- Statistics -->
        <div class="stats">
            <div class="stat-card">
                <div class="label">总数</div>
                <div class="value">{{.Statistics.TotalTests}}</div>
            </div>
            <div class="stat-card passed">
                <div class="label">通过</div>
                <div class="value">{{.Statistics.PassedTests}}</div>
            </div>
            <div class="stat-card failed">
                <div class="label">失败</div>
                <div class="value">{{.Statistics.FailedTests}}</div>
            </div>
            <div class="stat-card error">
                <div class="label">错误</div>
                <div class="value">{{.Statistics.ErrorTests}}</div>
            </div>
            <div class="stat-card skipped">
                <div class="label">跳过</div>
                <div class="value">{{.Statistics.SkippedTests}}</div>
            </div>
        </div>

        <div class="stats">
            <div class="stat-card" style="grid-column: span 2;">
                <div class="label">成功率</div>
                <div class="value">{{printf "%.2f" .Statistics.SuccessRate}}%</div>
            </div>
            <div class="stat-card" style="grid-column: span 3;">
                <div class="label">总耗时</div>
                <div class="value">{{.Statistics.TotalDuration}}ms</div>
            </div>
        </div>

        <!-- Sections -->
        {{range .Sections}}
        <div class="section">
            <h2>{{.Title}}</h2>
            {{if eq .Type "failures"}}
                <div class="failure-list">
                    {{range .Content.details}}
                    <div class="failure-item">
                        <div class="name">{{.TestName}}</div>
                        <div class="error">{{.Error}}</div>
                    </div>
                    {{end}}
                </div>
            {{else if eq .Type "charts"}}
                <canvas id="chart-{{.ID}}" class="chart"></canvas>
            {{end}}
        </div>
        {{end}}
    </div>
</body>
</html>
    `

    t, err := template.New("report").Parse(tmpl)
    if err != nil {
        return nil, err
    }

    var buf bytes.Buffer
    err = t.Execute(&buf, report)
    if err != nil {
        return nil, err
    }

    return buf.Bytes(), nil
}
```

### 3.7 趋势报告：质量仪表盘

```go
type TrendReportOptions struct {
    TimeRange  string   // 7d, 30d, 90d
    GroupBy    string   // day, week, month
    TestSuites []string // 限定测试集
    Projects   []string // 限定项目
}

func (g *ReportGeneratorImpl) GenerateTrendReport(ctx context.Context, opts *TrendReportOptions) (*Report, error) {
    // 1. 获取时间范围内的所有测试执行
    startTime, endTime := parseTimeRange(opts.TimeRange)
    runs, err := g.testService.GetTestRunsBetween(ctx, startTime, endTime)
    if err != nil {
        return nil, err
    }

    // 2. 按时间分组统计
    timeSeriesData := g.aggregateByTime(runs, opts.GroupBy)

    // 3. 生成趋势报告
    report := &Report{
        ReportID:    generateReportID(),
        Type:        "trend",
        Title:       fmt.Sprintf("质量趋势报告 - %s", opts.TimeRange),
        GeneratedAt: time.Now(),
    }

    // 成功率趋势图
    report.Sections = append(report.Sections, ReportSection{
        ID:    "success-rate-trend",
        Title: "成功率趋势",
        Type:  "charts",
        Content: ChartData{
            Type: "line",
            Labels: timeSeriesData.Labels,
            Datasets: []Dataset{
                {
                    Label: "成功率",
                    Data:  timeSeriesData.SuccessRates,
                    Color: "#10b981",
                },
            },
        },
    })

    // 执行次数趋势
    report.Sections = append(report.Sections, ReportSection{
        ID:    "execution-count-trend",
        Title: "执行次数趋势",
        Type:  "charts",
        Content: ChartData{
            Type: "bar",
            Labels: timeSeriesData.Labels,
            Datasets: []Dataset{
                {
                    Label: "通过",
                    Data:  timeSeriesData.PassedCounts,
                    Color: "#10b981",
                },
                {
                    Label: "失败",
                    Data:  timeSeriesData.FailedCounts,
                    Color: "#ef4444",
                },
            },
        },
    })

    // Top失败用例
    topFailures := g.getTopFailedTests(ctx, startTime, endTime, 10)
    report.Sections = append(report.Sections, ReportSection{
        ID:    "top-failures",
        Title: "Top 10 失败用例",
        Type:  "table",
        Content: topFailures,
    })

    // Flaky测试识别
    flakyTests := g.detectFlakyTests(ctx, startTime, endTime)
    report.Sections = append(report.Sections, ReportSection{
        ID:    "flaky-tests",
        Title: "不稳定测试",
        Type:  "table",
        Content: flakyTests,
    })

    return report, nil
}
```

### 3.8 自动化报告分发

```go
// 报告分发配置
type ReportDistribution struct {
    ReportType string   // execution, batch, trend
    Schedule   string   // cron expression
    Recipients []string // email addresses
    Channels   []string // email, slack, webhook
    Format     string   // html, pdf, json
}

// 自动发送报告
func (g *ReportGeneratorImpl) ScheduleReportDistribution(ctx context.Context, config *ReportDistribution) error {
    cronScheduler.AddFunc(config.Schedule, func() {
        // 1. 生成报告
        var report *Report
        var err error

        switch config.ReportType {
        case "batch":
            // 获取最近一次执行的批次
            latestRun := g.getLatestTestRun(ctx)
            report, err = g.GenerateBatchReport(ctx, latestRun.RunID)
        case "trend":
            // 生成最近7天的趋势报告
            report, err = g.GenerateTrendReport(ctx, &TrendReportOptions{
                TimeRange: "7d",
                GroupBy:   "day",
            })
        }

        if err != nil {
            log.Printf("Failed to generate report: %v", err)
            return
        }

        // 2. 导出报告
        content, err := g.ExportReport(ctx, report, config.Format)
        if err != nil {
            log.Printf("Failed to export report: %v", err)
            return
        }

        // 3. 发送报告
        for _, channel := range config.Channels {
            switch channel {
            case "email":
                g.sendEmail(config.Recipients, report.Title, content)
            case "slack":
                g.sendSlack(config.Recipients[0], report)
            case "webhook":
                g.sendWebhook(config.Recipients[0], report)
            }
        }
    })

    return nil
}
```

---

## 4. 多类型测试与CI/CD集成

### 4.1 测试类型扩展

当前平台已支持：
- ✅ HTTP API 测试
- ✅ Command 测试
- ✅ Workflow 测试

需要扩展支持：
- 功能测试 (Functional Testing)
- 集成测试 (Integration Testing)
- 压力测试 (Load/Stress Testing)

#### 4.1.1 集成测试支持

```go
type IntegrationTestConfig struct {
    Services []ServiceDependency `json:"services"`      // 依赖的服务
    Setup    []WorkflowStep      `json:"setup"`         // 集成测试前置步骤
    Teardown []WorkflowStep      `json:"teardown"`      // 集成测试后置步骤
    Scenarios []TestScenario     `json:"scenarios"`     // 测试场景
}

type ServiceDependency struct {
    Name    string `json:"name"`      // 服务名称
    Type    string `json:"type"`      // http, grpc, database, message_queue
    Endpoint string `json:"endpoint"` // 服务地址
    HealthCheck *HealthCheckConfig `json:"healthCheck"` // 健康检查配置
}

type HealthCheckConfig struct {
    Type     string `json:"type"`     // http, tcp, grpc
    Endpoint string `json:"endpoint"` // 健康检查地址
    Timeout  int    `json:"timeout"`  // 超时时间(秒)
    Interval int    `json:"interval"` // 检查间隔(秒)
}
```

**示例：订单-支付集成测试**

```json
{
  "testId": "integration-order-payment",
  "name": "订单-支付服务集成测试",
  "type": "integration",
  "integration": {
    "services": [
      {
        "name": "order-service",
        "type": "http",
        "endpoint": "http://order-service:8080",
        "healthCheck": {
          "type": "http",
          "endpoint": "/health",
          "timeout": 5,
          "interval": 10
        }
      },
      {
        "name": "payment-service",
        "type": "http",
        "endpoint": "http://payment-service:8081",
        "healthCheck": {
          "type": "http",
          "endpoint": "/health",
          "timeout": 5,
          "interval": 10
        }
      },
      {
        "name": "message-queue",
        "type": "message_queue",
        "endpoint": "rabbitmq://localhost:5672"
      }
    ],
    "setup": [
      {
        "id": "check-services",
        "type": "health-check",
        "config": {
          "services": ["order-service", "payment-service", "message-queue"]
        }
      },
      {
        "id": "init-data",
        "type": "http",
        "config": {
          "method": "POST",
          "url": "http://order-service:8080/api/test/init"
        }
      }
    ],
    "scenarios": [
      {
        "id": "scenario-1",
        "name": "正常下单并支付",
        "steps": [
          {
            "id": "create-order",
            "service": "order-service",
            "type": "http",
            "config": {
              "method": "POST",
              "path": "/api/orders",
              "body": {"productId": "p001", "quantity": 1}
            }
          },
          {
            "id": "pay-order",
            "service": "payment-service",
            "type": "http",
            "dependsOn": ["create-order"],
            "config": {
              "method": "POST",
              "path": "/api/payments",
              "body": {"orderId": "{{create-order.response.body.orderId}}"}
            }
          },
          {
            "id": "verify-message",
            "service": "message-queue",
            "type": "message-consume",
            "config": {
              "queue": "order.paid",
              "timeout": 10000,
              "expectedMessage": {
                "orderId": "{{create-order.response.body.orderId}}",
                "status": "paid"
              }
            }
          }
        ]
      }
    ],
    "teardown": [
      {
        "id": "cleanup-data",
        "type": "http",
        "config": {
          "method": "POST",
          "url": "http://order-service:8080/api/test/cleanup"
        }
      }
    ]
  }
}
```

#### 4.1.2 压力测试支持

```go
type PerformanceTestConfig struct {
    LoadProfile *LoadProfile `json:"loadProfile"`       // 负载配置
    Duration    int          `json:"duration"`          // 持续时间(秒)
    RampUp      int          `json:"rampUp"`            // 爬坡时间(秒)
    Metrics     []string     `json:"metrics"`           // 关注指标
    Thresholds  map[string]Threshold `json:"thresholds"` // 阈值
}

type LoadProfile struct {
    Type           string `json:"type"`           // constant, ramp, spike, stress
    VirtualUsers   int    `json:"virtualUsers"`   // 虚拟用户数
    RequestsPerSec int    `json:"requestsPerSec"` // 每秒请求数
}

type Threshold struct {
    Metric   string  `json:"metric"`   // response_time, error_rate, throughput
    Operator string  `json:"operator"` // <, >, <=, >=
    Value    float64 `json:"value"`    // 阈值
}
```

**示例：登录接口压力测试**

```json
{
  "testId": "perf-login-api",
  "name": "登录接口压力测试",
  "type": "performance",
  "performance": {
    "loadProfile": {
      "type": "ramp",
      "virtualUsers": 1000,
      "requestsPerSec": 100
    },
    "duration": 300,
    "rampUp": 60,
    "metrics": [
      "response_time_p50",
      "response_time_p95",
      "response_time_p99",
      "error_rate",
      "throughput"
    ],
    "thresholds": {
      "response_time_p95": {
        "metric": "response_time_p95",
        "operator": "<",
        "value": 500
      },
      "error_rate": {
        "metric": "error_rate",
        "operator": "<",
        "value": 0.01
      }
    }
  },
  "steps": [
    {
      "id": "login-request",
      "type": "http",
      "config": {
        "method": "POST",
        "path": "/api/login",
        "body": {
          "username": "{{$randomUsername}}",
          "password": "test123"
        }
      }
    }
  ]
}
```

### 4.2 CI/CD 集成

#### 4.2.1 GitLab CI 集成

```yaml
# .gitlab-ci.yml

stages:
  - build
  - test
  - deploy

variables:
  TEST_PLATFORM_URL: "http://test-platform:8090"
  TEST_SUITE_ID: "suite-smoke-tests"

# 单元测试阶段
unit-test:
  stage: test
  script:
    - npm test

# API测试阶段（集成测试平台）
api-test:
  stage: test
  script:
    # 1. 激活测试环境
    - |
      curl -X POST ${TEST_PLATFORM_URL}/api/environments/dev/activate

    # 2. 执行冒烟测试集
    - |
      RUN_ID=$(curl -X POST ${TEST_PLATFORM_URL}/api/test-suites/${TEST_SUITE_ID}/execute | jq -r '.runId')
      echo "Test run ID: $RUN_ID"

    # 3. 等待测试完成
    - |
      while true; do
        STATUS=$(curl ${TEST_PLATFORM_URL}/api/runs/${RUN_ID} | jq -r '.status')
        if [ "$STATUS" = "completed" ]; then
          break
        fi
        sleep 5
      done

    # 4. 检查测试结果
    - |
      RESULT=$(curl ${TEST_PLATFORM_URL}/api/runs/${RUN_ID})
      PASSED=$(echo $RESULT | jq -r '.passed')
      FAILED=$(echo $RESULT | jq -r '.failed')

      echo "Passed: $PASSED, Failed: $FAILED"

      if [ "$FAILED" -gt 0 ]; then
        echo "Tests failed!"
        exit 1
      fi

    # 5. 下载测试报告
    - |
      curl ${TEST_PLATFORM_URL}/api/runs/${RUN_ID}/report > test-report.html

  artifacts:
    when: always
    paths:
      - test-report.html
    reports:
      junit: test-report.xml  # 如果生成了JUnit格式报告

# 部署后验证
post-deploy-test:
  stage: deploy
  script:
    # 激活 staging 环境
    - curl -X POST ${TEST_PLATFORM_URL}/api/environments/staging/activate

    # 执行回归测试集
    - |
      RUN_ID=$(curl -X POST ${TEST_PLATFORM_URL}/api/test-suites/suite-regression/execute | jq -r '.runId')
      # ... 等待和检查逻辑同上
  only:
    - staging
```

#### 4.2.2 GitHub Actions 集成

```yaml
# .github/workflows/test.yml

name: API Test

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  api-test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Run API Tests
        env:
          TEST_PLATFORM_URL: ${{ secrets.TEST_PLATFORM_URL }}
          TEST_PLATFORM_TOKEN: ${{ secrets.TEST_PLATFORM_TOKEN }}
        run: |
          # 执行测试套件
          response=$(curl -X POST \
            -H "Authorization: Bearer $TEST_PLATFORM_TOKEN" \
            ${TEST_PLATFORM_URL}/api/test-suites/suite-smoke-tests/execute)

          run_id=$(echo $response | jq -r '.runId')
          echo "RUN_ID=$run_id" >> $GITHUB_ENV

          # 等待测试完成
          while true; do
            status=$(curl -H "Authorization: Bearer $TEST_PLATFORM_TOKEN" \
              ${TEST_PLATFORM_URL}/api/runs/${run_id} | jq -r '.status')

            if [ "$status" = "completed" ]; then
              break
            fi
            sleep 5
          done

          # 获取结果
          result=$(curl -H "Authorization: Bearer $TEST_PLATFORM_TOKEN" \
            ${TEST_PLATFORM_URL}/api/runs/${run_id})

          echo $result | jq '.'

          failed=$(echo $result | jq -r '.failed')
          if [ "$failed" -gt 0 ]; then
            echo "::error::Tests failed: $failed test(s) failed"
            exit 1
          fi

      - name: Upload Test Report
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: test-report
          path: test-report.html

      - name: Comment PR with Test Results
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v6
        with:
          script: |
            const runId = process.env.RUN_ID;
            const response = await fetch(
              `${process.env.TEST_PLATFORM_URL}/api/runs/${runId}`
            );
            const result = await response.json();

            const body = `## 🧪 Test Results

            - ✅ Passed: ${result.passed}
            - ❌ Failed: ${result.failed}
            - ⚠️ Errors: ${result.errors}
            - ⏭️ Skipped: ${result.skipped}
            - 📊 Success Rate: ${(result.passed / result.total * 100).toFixed(2)}%
            - ⏱️ Duration: ${(result.duration / 1000).toFixed(2)}s

            [View Full Report](${process.env.TEST_PLATFORM_URL}/reports/${runId})
            `;

            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.name,
              body: body
            });
```

#### 4.2.3 Jenkins Pipeline 集成

```groovy
// Jenkinsfile

pipeline {
    agent any

    environment {
        TEST_PLATFORM_URL = 'http://test-platform:8090'
        TEST_SUITE_ID = 'suite-smoke-tests'
    }

    stages {
        stage('Build') {
            steps {
                sh 'npm run build'
            }
        }

        stage('API Test') {
            steps {
                script {
                    // 执行测试套件
                    def response = sh(
                        script: "curl -X POST ${TEST_PLATFORM_URL}/api/test-suites/${TEST_SUITE_ID}/execute",
                        returnStdout: true
                    ).trim()

                    def runId = readJSON(text: response).runId
                    echo "Test run ID: ${runId}"

                    // 等待测试完成
                    timeout(time: 10, unit: 'MINUTES') {
                        waitUntil {
                            def status = sh(
                                script: "curl ${TEST_PLATFORM_URL}/api/runs/${runId} | jq -r '.status'",
                                returnStdout: true
                            ).trim()
                            return status == 'completed'
                        }
                    }

                    // 获取测试结果
                    def result = sh(
                        script: "curl ${TEST_PLATFORM_URL}/api/runs/${runId}",
                        returnStdout: true
                    )
                    def resultJson = readJSON(text: result)

                    echo "Passed: ${resultJson.passed}, Failed: ${resultJson.failed}"

                    // 下载报告
                    sh "curl ${TEST_PLATFORM_URL}/api/runs/${runId}/report -o test-report.html"

                    // 发布报告
                    publishHTML([
                        reportDir: '.',
                        reportFiles: 'test-report.html',
                        reportName: 'Test Report'
                    ])

                    // 检查是否失败
                    if (resultJson.failed > 0) {
                        error("Tests failed: ${resultJson.failed} test(s) failed")
                    }
                }
            }
        }

        stage('Deploy') {
            when {
                branch 'main'
            }
            steps {
                sh 'npm run deploy'
            }
        }
    }

    post {
        always {
            // 存档测试报告
            archiveArtifacts artifacts: 'test-report.html', allowEmptyArchive: true
        }
        failure {
            // 发送失败通知
            emailext(
                subject: "Build Failed: ${env.JOB_NAME} - ${env.BUILD_NUMBER}",
                body: """
                    Build failed!

                    Job: ${env.JOB_NAME}
                    Build: ${env.BUILD_NUMBER}
                    URL: ${env.BUILD_URL}

                    Test Report: ${env.BUILD_URL}Test_Report/
                """,
                to: 'team@example.com'
            )
        }
    }
}
```

---

## 5. 前端测试支持

### 5.1 前端测试类型

```
前端测试金字塔
═══════════════

      ┌─────────────┐
      │   E2E Tests │  (少量，关键流程)
      └─────────────┘
         ▲
    ┌───────────────┐
    │ Integration   │  (中等数量，组件集成)
    └───────────────┘
         ▲
    ┌─────────────────┐
    │  Component Tests│  (大量，UI组件)
    └─────────────────┘
         ▲
    ┌───────────────────┐
    │   Unit Tests      │  (大量，业务逻辑)
    └───────────────────┘
```

### 5.2 设计方案：Playwright/Puppeteer 集成

#### 5.2.1 E2E 测试配置

```go
type E2ETestConfig struct {
    Browser      *BrowserConfig `json:"browser"`       // 浏览器配置
    BaseURL      string         `json:"baseUrl"`       // 起始URL
    Viewport     *Viewport      `json:"viewport"`      // 视口大小
    Screenshots  bool           `json:"screenshots"`   // 是否截图
    VideoRecording bool         `json:"videoRecording"` // 是否录制视频
    Actions      []E2EAction    `json:"actions"`       // E2E操作序列
}

type BrowserConfig struct {
    Type       string `json:"type"`       // chromium, firefox, webkit
    Headless   bool   `json:"headless"`   // 是否无头模式
    SlowMo     int    `json:"slowMo"`     // 减速执行(ms)
    DevTools   bool   `json:"devTools"`   // 是否打开DevTools
}

type Viewport struct {
    Width  int `json:"width"`
    Height int `json:"height"`
}

type E2EAction struct {
    Type     string                 `json:"type"`     // navigate, click, type, wait, screenshot, assert
    Selector string                 `json:"selector"` // CSS选择器
    Value    interface{}            `json:"value"`    // 操作值
    Options  map[string]interface{} `json:"options"`  // 附加选项
}
```

**示例：登录流程 E2E 测试**

```json
{
  "testId": "e2e-user-login",
  "name": "用户登录E2E测试",
  "type": "e2e",
  "e2e": {
    "browser": {
      "type": "chromium",
      "headless": true,
      "slowMo": 100
    },
    "baseUrl": "http://localhost:3000",
    "viewport": {
      "width": 1280,
      "height": 720
    },
    "screenshots": true,
    "videoRecording": false,
    "actions": [
      {
        "type": "navigate",
        "value": "/login"
      },
      {
        "type": "wait",
        "selector": "input[name='username']",
        "options": {
          "timeout": 5000
        }
      },
      {
        "type": "type",
        "selector": "input[name='username']",
        "value": "testuser"
      },
      {
        "type": "type",
        "selector": "input[name='password']",
        "value": "test123"
      },
      {
        "type": "screenshot",
        "value": "before-login-click"
      },
      {
        "type": "click",
        "selector": "button[type='submit']"
      },
      {
        "type": "wait",
        "selector": ".dashboard",
        "options": {
          "timeout": 10000
        }
      },
      {
        "type": "assert",
        "selector": ".user-name",
        "value": "testuser",
        "options": {
          "assertType": "text"
        }
      },
      {
        "type": "screenshot",
        "value": "after-login"
      }
    ]
  }
}
```

#### 5.2.2 E2E 执行器实现

```go
package e2e

import (
    "context"
    "fmt"
    "github.com/playwright-community/playwright-go"
)

type E2EExecutor struct {
    pw *playwright.Playwright
}

func NewE2EExecutor() (*E2EExecutor, error) {
    pw, err := playwright.Run()
    if err != nil {
        return nil, err
    }
    return &E2EExecutor{pw: pw}, nil
}

func (e *E2EExecutor) Execute(ctx context.Context, config *E2ETestConfig) (*E2EResult, error) {
    // 1. 启动浏览器
    browser, err := e.launchBrowser(config.Browser)
    if err != nil {
        return nil, err
    }
    defer browser.Close()

    // 2. 创建上下文和页面
    context, err := browser.NewContext(playwright.BrowserNewContextOptions{
        BaseURL:       playwright.String(config.BaseURL),
        ViewportSize:  &playwright.Size{Width: config.Viewport.Width, Height: config.Viewport.Height},
        RecordVideo:   e.getVideoOptions(config.VideoRecording),
    })
    if err != nil {
        return nil, err
    }
    defer context.Close()

    page, err := context.NewPage()
    if err != nil {
        return nil, err
    }

    result := &E2EResult{
        Screenshots: []Screenshot{},
        Logs:        []string{},
    }

    // 3. 执行操作序列
    for i, action := range config.Actions {
        err := e.executeAction(page, action, result)
        if err != nil {
            result.Error = fmt.Sprintf("Action %d failed: %v", i, err)
            result.Status = "failed"
            return result, err
        }
        result.Logs = append(result.Logs, fmt.Sprintf("✓ Action %d: %s", i, action.Type))
    }

    result.Status = "passed"
    return result, nil
}

func (e *E2EExecutor) executeAction(page playwright.Page, action E2EAction, result *E2EResult) error {
    switch action.Type {
    case "navigate":
        _, err := page.Goto(action.Value.(string))
        return err

    case "click":
        return page.Click(action.Selector)

    case "type":
        return page.Fill(action.Selector, action.Value.(string))

    case "wait":
        timeout := float64(5000)
        if t, ok := action.Options["timeout"].(float64); ok {
            timeout = t
        }
        _, err := page.WaitForSelector(action.Selector, playwright.PageWaitForSelectorOptions{
            Timeout: playwright.Float(timeout),
        })
        return err

    case "screenshot":
        filename := fmt.Sprintf("%s.png", action.Value.(string))
        screenshot, err := page.Screenshot(playwright.PageScreenshotOptions{
            Path: playwright.String(filename),
        })
        if err != nil {
            return err
        }
        result.Screenshots = append(result.Screenshots, Screenshot{
            Name: action.Value.(string),
            Path: filename,
            Data: screenshot,
        })
        return nil

    case "assert":
        element, err := page.QuerySelector(action.Selector)
        if err != nil {
            return err
        }

        assertType := action.Options["assertType"].(string)
        switch assertType {
        case "text":
            text, err := element.TextContent()
            if err != nil {
                return err
            }
            expected := action.Value.(string)
            if text != expected {
                return fmt.Errorf("assertion failed: expected %s, got %s", expected, text)
            }
        case "visible":
            visible, err := element.IsVisible()
            if err != nil {
                return err
            }
            if !visible {
                return fmt.Errorf("element %s is not visible", action.Selector)
            }
        }
        return nil

    default:
        return fmt.Errorf("unknown action type: %s", action.Type)
    }
}

func (e *E2EExecutor) launchBrowser(config *BrowserConfig) (playwright.Browser, error) {
    options := playwright.BrowserTypeLaunchOptions{
        Headless: playwright.Bool(config.Headless),
        SlowMo:   playwright.Float(float64(config.SlowMo)),
        Devtools: playwright.Bool(config.DevTools),
    }

    switch config.Type {
    case "chromium":
        return e.pw.Chromium.Launch(options)
    case "firefox":
        return e.pw.Firefox.Launch(options)
    case "webkit":
        return e.pw.WebKit.Launch(options)
    default:
        return e.pw.Chromium.Launch(options)
    }
}

type E2EResult struct {
    Status      string
    Screenshots []Screenshot
    VideoPath   string
    Logs        []string
    Error       string
}

type Screenshot struct {
    Name string
    Path string
    Data []byte
}
```

### 5.3 前端可视化回归测试

```go
type VisualRegressionConfig struct {
    BaseURL       string   `json:"baseUrl"`
    Pages         []string `json:"pages"`          // 需要截图的页面列表
    Viewports     []Viewport `json:"viewports"`    // 不同分辨率
    Threshold     float64  `json:"threshold"`      // 像素差异阈值
    BaselineDir   string   `json:"baselineDir"`    // 基准图片目录
    CompareDir    string   `json:"compareDir"`     // 对比图片目录
}

func (e *E2EExecutor) VisualRegression(ctx context.Context, config *VisualRegressionConfig) (*VisualRegressionResult, error) {
    result := &VisualRegressionResult{
        Comparisons: []VisualComparison{},
    }

    for _, viewport := range config.Viewports {
        for _, pagePath := range config.Pages {
            // 1. 访问页面并截图
            screenshot, err := e.captureScreenshot(config.BaseURL+pagePath, viewport)
            if err != nil {
                return nil, err
            }

            // 2. 加载基准图片
            baselinePath := fmt.Sprintf("%s/%s-%dx%d.png",
                config.BaselineDir,
                sanitizePath(pagePath),
                viewport.Width,
                viewport.Height)

            baseline, err := loadImage(baselinePath)
            if err != nil {
                // 首次运行，保存为基准
                saveImage(baselinePath, screenshot)
                continue
            }

            // 3. 像素级对比
            diff, diffPercentage := compareImages(baseline, screenshot)

            comparison := VisualComparison{
                Page:           pagePath,
                Viewport:       viewport,
                DiffPercentage: diffPercentage,
                Passed:         diffPercentage < config.Threshold,
                DiffImagePath:  fmt.Sprintf("%s/diff-%s-%dx%d.png",
                    config.CompareDir,
                    sanitizePath(pagePath),
                    viewport.Width,
                    viewport.Height),
            }

            // 保存差异图片
            if !comparison.Passed {
                saveDiffImage(comparison.DiffImagePath, diff)
            }

            result.Comparisons = append(result.Comparisons, comparison)
        }
    }

    // 计算总体通过率
    passed := 0
    for _, comp := range result.Comparisons {
        if comp.Passed {
            passed++
        }
    }
    result.PassRate = float64(passed) / float64(len(result.Comparisons)) * 100

    return result, nil
}

type VisualComparison struct {
    Page           string
    Viewport       Viewport
    DiffPercentage float64
    Passed         bool
    DiffImagePath  string
}
```

---

## 6. 移动端测试支持

### 6.1 移动端测试场景

```
移动端测试类型
═══════════════

1. 真机测试 (Real Device Testing)
   • iOS设备 (iPhone, iPad)
   • Android设备 (各厂商)

2. 模拟器测试 (Emulator/Simulator Testing)
   • Android Emulator
   • iOS Simulator

3. 云测试 (Cloud Testing)
   • BrowserStack
   • Sauce Labs
   • AWS Device Farm
```

### 6.2 设计方案：Appium 集成

#### 6.2.1 移动端测试配置

```go
type MobileTestConfig struct {
    Platform      string          `json:"platform"`      // ios, android
    DeviceType    string          `json:"deviceType"`    // real, simulator, cloud
    Device        *DeviceConfig   `json:"device"`        // 设备配置
    App           *AppConfig      `json:"app"`           // 应用配置
    Actions       []MobileAction  `json:"actions"`       // 操作序列
    Screenshots   bool            `json:"screenshots"`   // 是否截图
    VideoRecording bool           `json:"videoRecording"` // 是否录制视频
}

type DeviceConfig struct {
    // 真机配置
    UDID         string `json:"udid"`         // 设备UDID
    DeviceName   string `json:"deviceName"`   // 设备名称
    PlatformVersion string `json:"platformVersion"` // 系统版本

    // 模拟器配置
    SimulatorName string `json:"simulatorName"` // 模拟器名称

    // 云测试配置
    CloudProvider string `json:"cloudProvider"` // browserstack, saucelabs
    CloudConfig   map[string]interface{} `json:"cloudConfig"`
}

type AppConfig struct {
    AppPath      string `json:"appPath"`      // .apk或.ipa文件路径
    AppPackage   string `json:"appPackage"`   // Android包名
    AppActivity  string `json:"appActivity"`  // Android启动Activity
    BundleID     string `json:"bundleId"`     // iOS Bundle ID
}

type MobileAction struct {
    Type     string                 `json:"type"`     // tap, swipe, input, wait, screenshot, assert
    Locator  *ElementLocator        `json:"locator"`  // 元素定位
    Value    interface{}            `json:"value"`    // 操作值
    Options  map[string]interface{} `json:"options"`  // 附加选项
}

type ElementLocator struct {
    Strategy string `json:"strategy"` // id, xpath, accessibility_id, class_name
    Value    string `json:"value"`    // 定位值
}
```

**示例：移动端登录测试**

```json
{
  "testId": "mobile-user-login",
  "name": "移动端用户登录测试",
  "type": "mobile",
  "mobile": {
    "platform": "android",
    "deviceType": "simulator",
    "device": {
      "simulatorName": "Pixel_4_API_30",
      "platformVersion": "11.0"
    },
    "app": {
      "appPath": "/path/to/app.apk",
      "appPackage": "com.example.app",
      "appActivity": ".MainActivity"
    },
    "screenshots": true,
    "videoRecording": false,
    "actions": [
      {
        "type": "wait",
        "locator": {
          "strategy": "id",
          "value": "com.example.app:id/username"
        },
        "options": {
          "timeout": 10000
        }
      },
      {
        "type": "input",
        "locator": {
          "strategy": "id",
          "value": "com.example.app:id/username"
        },
        "value": "testuser"
      },
      {
        "type": "input",
        "locator": {
          "strategy": "id",
          "value": "com.example.app:id/password"
        },
        "value": "test123"
      },
      {
        "type": "screenshot",
        "value": "before-login"
      },
      {
        "type": "tap",
        "locator": {
          "strategy": "id",
          "value": "com.example.app:id/login_button"
        }
      },
      {
        "type": "wait",
        "locator": {
          "strategy": "id",
          "value": "com.example.app:id/home_screen"
        },
        "options": {
          "timeout": 15000
        }
      },
      {
        "type": "assert",
        "locator": {
          "strategy": "id",
          "value": "com.example.app:id/welcome_text"
        },
        "value": "Welcome, testuser",
        "options": {
          "assertType": "text"
        }
      },
      {
        "type": "screenshot",
        "value": "after-login"
      }
    ]
  }
}
```

#### 6.2.2 移动端执行器实现

```go
package mobile

import (
    "context"
    "fmt"
    "github.com/jlipps/go-webdriver"
)

type MobileExecutor struct {
    driver webdriver.WebDriver
}

func NewMobileExecutor(config *MobileTestConfig) (*MobileExecutor, error) {
    // 1. 构建 Appium Capabilities
    capabilities := map[string]interface{}{
        "platformName":    config.Platform,
        "deviceName":      config.Device.DeviceName,
        "platformVersion": config.Device.PlatformVersion,
        "automationName":  getAutomationName(config.Platform),
    }

    if config.Platform == "android" {
        capabilities["appPackage"] = config.App.AppPackage
        capabilities["appActivity"] = config.App.AppActivity
        if config.App.AppPath != "" {
            capabilities["app"] = config.App.AppPath
        }
    } else if config.Platform == "ios" {
        capabilities["bundleId"] = config.App.BundleID
        if config.App.AppPath != "" {
            capabilities["app"] = config.App.AppPath
        }
    }

    // 真机配置
    if config.DeviceType == "real" && config.Device.UDID != "" {
        capabilities["udid"] = config.Device.UDID
    }

    // 云测试配置
    if config.DeviceType == "cloud" {
        for k, v := range config.Device.CloudConfig {
            capabilities[k] = v
        }
    }

    // 2. 连接 Appium Server
    appiumURL := "http://localhost:4723/wd/hub" // 可配置
    driver, err := webdriver.NewSession(appiumURL, capabilities)
    if err != nil {
        return nil, err
    }

    return &MobileExecutor{driver: driver}, nil
}

func (m *MobileExecutor) Execute(ctx context.Context, config *MobileTestConfig) (*MobileResult, error) {
    result := &MobileResult{
        Screenshots: []Screenshot{},
        Logs:        []string{},
    }

    defer m.driver.Quit()

    // 执行操作序列
    for i, action := range config.Actions {
        err := m.executeAction(action, result)
        if err != nil {
            result.Error = fmt.Sprintf("Action %d failed: %v", i, err)
            result.Status = "failed"
            return result, err
        }
        result.Logs = append(result.Logs, fmt.Sprintf("✓ Action %d: %s", i, action.Type))
    }

    result.Status = "passed"
    return result, nil
}

func (m *MobileExecutor) executeAction(action MobileAction, result *MobileResult) error {
    switch action.Type {
    case "tap":
        element, err := m.findElement(action.Locator)
        if err != nil {
            return err
        }
        return element.Click()

    case "input":
        element, err := m.findElement(action.Locator)
        if err != nil {
            return err
        }
        return element.SendKeys(action.Value.(string))

    case "swipe":
        // 实现滑动逻辑
        options := action.Options
        startX := int(options["startX"].(float64))
        startY := int(options["startY"].(float64))
        endX := int(options["endX"].(float64))
        endY := int(options["endY"].(float64))
        duration := int(options["duration"].(float64))

        return m.driver.TouchPerform([]webdriver.TouchAction{
            {Action: "press", Options: map[string]interface{}{"x": startX, "y": startY}},
            {Action: "wait", Options: map[string]interface{}{"ms": duration}},
            {Action: "moveTo", Options: map[string]interface{}{"x": endX, "y": endY}},
            {Action: "release"},
        })

    case "wait":
        timeout := 5000
        if t, ok := action.Options["timeout"].(float64); ok {
            timeout = int(t)
        }

        // 等待元素出现
        _, err := m.driver.WaitForElement(
            action.Locator.Strategy,
            action.Locator.Value,
            timeout,
        )
        return err

    case "screenshot":
        screenshot, err := m.driver.Screenshot()
        if err != nil {
            return err
        }

        filename := fmt.Sprintf("%s.png", action.Value.(string))
        result.Screenshots = append(result.Screenshots, Screenshot{
            Name: action.Value.(string),
            Path: filename,
            Data: screenshot,
        })
        return nil

    case "assert":
        element, err := m.findElement(action.Locator)
        if err != nil {
            return err
        }

        assertType := action.Options["assertType"].(string)
        switch assertType {
        case "text":
            text, err := element.Text()
            if err != nil {
                return err
            }
            expected := action.Value.(string)
            if text != expected {
                return fmt.Errorf("assertion failed: expected %s, got %s", expected, text)
            }
        case "displayed":
            displayed, err := element.IsDisplayed()
            if err != nil {
                return err
            }
            if !displayed {
                return fmt.Errorf("element is not displayed")
            }
        }
        return nil

    default:
        return fmt.Errorf("unknown action type: %s", action.Type)
    }
}

func (m *MobileExecutor) findElement(locator *ElementLocator) (webdriver.WebElement, error) {
    return m.driver.FindElement(locator.Strategy, locator.Value)
}

func getAutomationName(platform string) string {
    if platform == "android" {
        return "UiAutomator2"
    } else if platform == "ios" {
        return "XCUITest"
    }
    return ""
}

type MobileResult struct {
    Status      string
    Screenshots []Screenshot
    VideoPath   string
    Logs        []string
    Error       string
}
```

### 6.3 云测试平台集成

#### 6.3.1 BrowserStack 集成

```go
type BrowserStackConfig struct {
    Username    string `json:"username"`
    AccessKey   string `json:"accessKey"`
    Device      string `json:"device"`       // "iPhone 13"
    OSVersion   string `json:"osVersion"`    // "15"
    Project     string `json:"project"`
    Build       string `json:"build"`
    Name        string `json:"name"`
}

func (m *MobileExecutor) ExecuteOnBrowserStack(config *BrowserStackConfig) error {
    capabilities := map[string]interface{}{
        "browserstack.user":      config.Username,
        "browserstack.key":       config.AccessKey,
        "device":                 config.Device,
        "os_version":             config.OSVersion,
        "project":                config.Project,
        "build":                  config.Build,
        "name":                   config.Name,
        "browserstack.debug":     true,
        "browserstack.networkLogs": true,
    }

    appiumURL := "https://hub-cloud.browserstack.com/wd/hub"
    driver, err := webdriver.NewSession(appiumURL, capabilities)
    if err != nil {
        return err
    }

    m.driver = driver
    return nil
}
```

---

## 7. 实施路线图

### Phase 1: 资源管理基础 (2-3周)

**目标**: 建立资源复用和生命周期管理

#### 后端任务
- [ ] 创建 `resource_templates` 表
- [ ] 创建 `resource_instances` 表
- [ ] 实现 `ResourceManager` 接口
- [ ] 扩展 `TestCase` 模型支持资源需求
- [ ] 实现资源分配和释放逻辑
- [ ] 后台清理任务

#### 前端任务
- [ ] `ResourceLibrary` 页面
- [ ] `ResourceTemplateEditor` 组件
- [ ] 测试用例中的资源配置UI

### Phase 2: 测试用例管理增强 (2-3周)

**目标**: 提升测试用例管理能力

#### 后端任务
- [ ] 扩展 `test_cases` 表字段
- [ ] 创建 `test_suites` 表
- [ ] 实现智能搜索API
- [ ] 实现自动标签生成
- [ ] 测试价值评估算法

#### 前端任务
- [ ] `TestCaseCenter` 管理中心
- [ ] 高级搜索和过滤
- [ ] 测试集合管理
- [ ] 标签云和快速过滤

### Phase 3: 测试报告系统 (2周)

**目标**: 建立完整的报告生成和分发系统

#### 后端任务
- [ ] 创建 `test_reports` 表
- [ ] 实现 `ReportGenerator` 接口
- [ ] HTML/PDF报告导出
- [ ] 趋势报告生成
- [ ] 自动化报告分发

#### 前端任务
- [ ] 报告查看器
- [ ] 趋势图表可视化
- [ ] 报告订阅配置

### Phase 4: CI/CD集成 (1-2周)

**目标**: 实现与主流CI/CD工具的集成

#### 后端任务
- [ ] Webhook API
- [ ] JUnit格式报告导出
- [ ] CI/CD执行API
- [ ] 状态回调机制

#### 文档任务
- [ ] GitLab CI集成指南
- [ ] GitHub Actions集成指南
- [ ] Jenkins Pipeline集成指南

### Phase 5: 前端测试支持 (3-4周)

**目标**: 支持E2E和可视化回归测试

#### 后端任务
- [ ] 扩展 `e2e_config` 支持
- [ ] Playwright/Puppeteer集成
- [ ] E2E执行器实现
- [ ] 可视化回归测试引擎
- [ ] 截图和视频存储

#### 前端任务
- [ ] E2E测试配置UI
- [ ] 可视化回归对比查看器

### Phase 6: 移动端测试支持 (3-4周)

**目标**: 支持iOS和Android测试

#### 后端任务
- [ ] 扩展 `mobile_config` 支持
- [ ] Appium集成
- [ ] 移动端执行器实现
- [ ] 云测试平台集成

#### 基础设施
- [ ] Appium Server部署
- [ ] Android Emulator配置
- [ ] iOS Simulator配置

---

## 附录

### A. 技术栈总结

**后端**:
- Go 1.24 + Gin + GORM
- Playwright-Go (E2E测试)
- Go-WebDriver (移动端测试)

**前端**:
- React 19 + TypeScript
- Chart.js (报告图表)
- React Flow (可视化编辑器)

**外部依赖**:
- Appium Server (移动端测试)
- Playwright (浏览器自动化)

### B. 数据库表汇总

新增表:
1. `resource_templates` - 资源模板
2. `resource_instances` - 资源实例
3. `test_suites` - 测试集合
4. `test_reports` - 测试报告

扩展表:
1. `test_cases` - 新增资源管理、元数据字段
2. `test_results` - 新增截图、视频附件字段

### C. API端点汇总

新增端点:
```
# 资源管理
POST   /api/v2/resource-templates
GET    /api/v2/resource-templates/:id
PUT    /api/v2/resource-templates/:id
DELETE /api/v2/resource-templates/:id
GET    /api/v2/resource-templates
POST   /api/v2/resource-instances/allocate
POST   /api/v2/resource-instances/release

# 测试集合
POST   /api/v2/test-suites
GET    /api/v2/test-suites/:id
PUT    /api/v2/test-suites/:id
DELETE /api/v2/test-suites/:id
GET    /api/v2/test-suites
POST   /api/v2/test-suites/:id/execute

# 测试报告
GET    /api/v2/reports/:id
GET    /api/v2/reports
POST   /api/v2/reports/generate
GET    /api/v2/reports/:id/export

# CI/CD集成
POST   /api/v2/ci/trigger
GET    /api/v2/ci/status/:runId
POST   /api/v2/ci/webhook
```

---

**文档结束**
