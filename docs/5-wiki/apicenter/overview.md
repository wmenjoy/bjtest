# API Center - API文档中心模块概览

**版本**: 0.1 (规划中)
**最后更新**: 2025-11-26
**维护者**: 开发团队
**状态**: ⏳ 计划中

---

## 目录

1. [模块简介](#模块简介)
2. [核心概念](#核心概念)
3. [规划的代码路径](#规划的代码路径)
4. [规划的数据模型](#规划的数据模型)
5. [规划的核心流程](#规划的核心流程)
6. [规划的API接口](#规划的api接口)
7. [与其他模块的关系](#与其他模块的关系)
8. [实施计划](#实施计划)

---

## 模块简介

> **注意**: 本模块当前处于规划阶段,以下内容为设计方案,尚未实施。

API文档中心模块负责集中管理、展示和测试项目中的所有API端点,提供类似Swagger/Postman的API文档管理能力。

### 主要功能 (规划)

- **API目录管理**: 自动发现和手动注册API端点
- **接口文档**: 自动生成和维护API文档(参数、响应、示例)
- **Schema管理**: 管理请求/响应的JSON Schema定义
- **在线测试**: 直接在文档页面测试API调用
- **版本管理**: 支持API版本控制和变更历史追踪
- **Mock服务**: 基于Schema自动生成Mock数据

### 适用场景

- **API文档维护**: 替代手动编写的API文档,自动生成保持最新
- **接口测试**: 快速测试API端点,验证请求/响应格式
- **前后端协作**: 提供统一的API契约,减少沟通成本
- **第三方集成**: 为外部系统提供标准化的API目录
- **API治理**: 监控API使用情况,发现废弃接口

---

## 核心概念

### 概念1: APIEndpoint (API端点)

**定义**: 单个API接口的完整定义,包含路径、方法、参数、响应等信息。

**属性**:
- `endpointId` (String) - 端点唯一标识符
- `path` (String) - API路径 (如 /api/v2/tests)
- `method` (String) - HTTP方法 (GET/POST/PUT/DELETE)
- `category` (String) - 分类 (如 TestCase, Workflow, Environment)
- `summary` (String) - 简短描述
- `description` (Text) - 详细说明
- `deprecated` (Boolean) - 是否废弃
- `version` (String) - API版本
- `requestSchemaId` (String) - 请求Schema ID (关联APISchema)
- `responseSchemaId` (String) - 响应Schema ID (关联APISchema)
- `tags` (Array) - 标签数组

**示例**:
```json
{
  "endpointId": "endpoint-create-testcase",
  "path": "/api/v2/tests",
  "method": "POST",
  "category": "TestCase",
  "summary": "创建测试用例",
  "description": "创建一个新的测试用例,支持HTTP、Command、Workflow等多种类型",
  "deprecated": false,
  "version": "v2",
  "requestSchemaId": "schema-testcase-create-request",
  "responseSchemaId": "schema-testcase-response",
  "tags": ["testcase", "crud", "创建"]
}
```

### 概念2: APISchema (API Schema)

**定义**: JSON Schema定义,描述API请求/响应的数据结构。

**属性**:
- `schemaId` (String) - Schema唯一标识符
- `name` (String) - Schema名称
- `type` (String) - Schema类型: request(请求), response(响应), model(数据模型)
- `schemaDefinition` (JSONB) - JSON Schema定义
- `examples` (JSONB) - 示例数据数组
- `version` (String) - Schema版本

**示例**:
```json
{
  "schemaId": "schema-testcase-create-request",
  "name": "TestCase创建请求",
  "type": "request",
  "version": "1.0",
  "schemaDefinition": {
    "type": "object",
    "required": ["name", "type", "groupId"],
    "properties": {
      "name": {
        "type": "string",
        "description": "测试用例名称",
        "minLength": 1,
        "maxLength": 255
      },
      "type": {
        "type": "string",
        "enum": ["http", "command", "workflow", "database"],
        "description": "测试类型"
      },
      "groupId": {
        "type": "string",
        "description": "所属测试分组ID"
      },
      "priority": {
        "type": "string",
        "enum": ["P0", "P1", "P2", "P3"],
        "default": "P2",
        "description": "优先级"
      }
    }
  },
  "examples": [
    {
      "name": "用户登录API测试",
      "type": "http",
      "groupId": "group-001",
      "priority": "P0"
    }
  ]
}
```

### 概念3: API Discovery (API自动发现)

**定义**: 通过扫描代码或注解自动识别和注册API端点的机制。

**发现方式**:
1. **注解扫描**: 扫描后端代码中的路由注册 (Gin路由)
2. **OpenAPI导入**: 导入已有的OpenAPI/Swagger规范文件
3. **流量分析**: 分析实际API请求流量自动识别端点
4. **手动注册**: 通过UI界面手动添加端点

**示例 - 从Gin路由自动发现**:
```go
// 后端代码 - nextest-platform/cmd/server/main.go
v2 := r.Group("/api/v2")
{
    // 自动发现: POST /api/v2/tests → 映射为APIEndpoint
    v2.POST("/tests", handler.CreateTestCase)

    // 自动发现: GET /api/v2/tests/:id → 带路径参数
    v2.GET("/tests/:id", handler.GetTestCase)
}
```

**自动生成的APIEndpoint**:
```json
{
  "path": "/api/v2/tests",
  "method": "POST",
  "handler": "handler.CreateTestCase",
  "discovered": true,
  "discoveryMethod": "gin-route-scan"
}
```

### 概念4: API Versioning (API版本管理)

**定义**: 管理API的多个版本,支持版本共存和平滑迁移。

**版本策略**:
- **URL版本**: `/api/v1/tests` vs `/api/v2/tests`
- **Header版本**: `Accept: application/vnd.api+json; version=2`
- **时间戳版本**: 记录每次API变更的时间和内容

**变更追踪**:
```json
{
  "endpointId": "endpoint-create-testcase",
  "versionHistory": [
    {
      "version": "v1",
      "createdAt": "2024-01-01",
      "deprecatedAt": "2024-11-01",
      "changes": ["初始版本"]
    },
    {
      "version": "v2",
      "createdAt": "2024-11-01",
      "changes": [
        "添加workflow集成支持",
        "添加价值评分字段",
        "支持多租户隔离"
      ]
    }
  ]
}
```

### 概念5: API Mock Server (API模拟服务器)

**定义**: 基于Schema自动生成Mock数据,用于前后端并行开发。

**Mock策略**:
- **基于Schema**: 根据JSON Schema生成符合规范的随机数据
- **基于示例**: 使用examples字段中的真实数据
- **基于规则**: 自定义Mock规则 (如userId总是user-xxx格式)

**使用场景**:
```bash
# 前端开发时调用Mock服务
GET http://localhost:8090/mock/api/v2/tests/test-001

# 返回基于Schema生成的Mock数据
{
  "testId": "test-mock-abc123",
  "name": "Mock测试用例",
  "type": "http",
  "status": "active",
  "successRate": 85,
  "avgDuration": 1250
}
```

### 概念6: API Testing Playground (API测试沙盒)

**定义**: 在文档页面直接测试API调用,类似Postman的Try It功能。

**功能**:
- **参数填写**: 根据Schema自动生成表单
- **认证配置**: 配置Token、API Key等认证信息
- **请求发送**: 直接调用真实API或Mock API
- **响应展示**: 格式化展示响应数据和HTTP状态
- **保存案例**: 将测试请求保存为TestCase

---

## 规划的代码路径

### 后端代码 (规划)

| 分层 | 路径 | 职责 |
|------|------|------|
| **模型层** | `nextest-platform/internal/models/api_center.go` | APIEndpoint, APISchema模型定义 |
| **仓储层** | `nextest-platform/internal/repository/api_center_repo.go` | 数据访问接口 |
| **服务层** | `nextest-platform/internal/service/api_center_service.go` | API发现、Schema管理 |
| **处理层** | `nextest-platform/internal/handler/api_center_handler.go` | HTTP API处理器 |
| **发现引擎** | `nextest-platform/internal/apicenter/discovery_engine.go` | Gin路由扫描,OpenAPI导入 |
| **Mock引擎** | `nextest-platform/internal/apicenter/mock_engine.go` | 基于Schema生成Mock数据 |
| **Schema验证** | `nextest-platform/internal/apicenter/schema_validator.go` | JSON Schema验证 |

---

### 前端代码 (规划)

| 分层 | 路径 | 职责 |
|------|------|------|
| **页面组件** | `NextTestPlatformUI/components/APICenter.tsx` | API文档中心主页 |
| **UI组件** | `NextTestPlatformUI/components/apicenter/APIExplorer.tsx` | API浏览器 |
| **UI组件** | `NextTestPlatformUI/components/apicenter/SchemaEditor.tsx` | Schema编辑器 |
| **UI组件** | `NextTestPlatformUI/components/apicenter/APIPlayground.tsx` | API测试沙盒 |

---

## 规划的数据模型

### 核心实体

#### APIEndpoint (API端点)

**数据库表**: `api_endpoints` (规划)

**字段说明**:

| 字段 | 类型 | 说明 | 是否必填 |
|------|------|---------|---------|
| id | uint | 自增主键 | ✅ |
| endpoint_id | string | 端点唯一ID (UUID) | ✅ |
| tenant_id | string | 租户ID (多租户隔离) | ❌ |
| project_id | string | 项目ID (项目级隔离) | ❌ |
| path | string | API路径 (如/api/v2/tests) | ✅ |
| method | string | HTTP方法 (GET/POST/PUT/DELETE) | ✅ |
| category | string | 分类 (TestCase/Workflow等) | ❌ |
| summary | string | 简短描述 | ✅ |
| description | text | 详细说明 | ❌ |
| deprecated | bool | 是否废弃,默认false | ❌ |
| version | string | API版本 (如v2) | ✅ |
| request_schema_id | string | 请求Schema ID | ❌ |
| response_schema_id | string | 响应Schema ID | ❌ |
| tags | jsonb | 标签数组 | ❌ |
| handler | string | 处理函数名 (自动发现) | ❌ |
| discovered | bool | 是否自动发现,默认false | ❌ |
| discovery_method | string | 发现方式 (gin-route/openapi/manual) | ❌ |
| usage_count | int | 调用次数统计 | ❌ |
| last_used_at | timestamp | 最后调用时间 | ❌ |
| created_at | timestamp | 创建时间 | ✅ |
| updated_at | timestamp | 更新时间 | ✅ |
| deleted_at | timestamp | 软删除时间 | ❌ |

**索引**:
- `endpoint_id`: 唯一索引
- `tenant_id`, `project_id`: 联合索引 (多租户查询)
- `path`, `method`: 联合唯一索引 (防止重复)
- `category`: 普通索引 (分类查询)
- `deprecated`: 普通索引 (过滤废弃API)

**关联关系**:
- `RequestSchema APISchema` - 请求Schema (belongs to)
- `ResponseSchema APISchema` - 响应Schema (belongs to)

#### APISchema (API Schema)

**数据库表**: `api_schemas` (规划)

**字段说明**:

| 字段 | 类型 | 说明 | 是否必填 |
|------|------|---------|---------|
| id | uint | 自增主键 | ✅ |
| schema_id | string | Schema唯一ID (UUID) | ✅ |
| tenant_id | string | 租户ID | ❌ |
| project_id | string | 项目ID | ❌ |
| name | string | Schema名称 | ✅ |
| type | string | Schema类型: request/response/model | ✅ |
| schema_definition | jsonb | JSON Schema定义 | ✅ |
| examples | jsonb | 示例数据数组 | ❌ |
| version | string | Schema版本 | ✅ |
| is_shared | bool | 是否跨项目共享,默认false | ❌ |
| reference_count | int | 被引用次数统计 | ❌ |
| created_at | timestamp | 创建时间 | ✅ |
| updated_at | timestamp | 更新时间 | ✅ |
| deleted_at | timestamp | 软删除时间 | ❌ |

**索引**:
- `schema_id`: 唯一索引
- `tenant_id`, `project_id`: 联合索引
- `type`: 普通索引

**关联关系**:
- `Endpoints []APIEndpoint` - 使用此Schema的端点列表

#### APIEndpointVersion (API端点版本历史)

**数据库表**: `api_endpoint_versions` (规划)

**字段说明**:

| 字段 | 类型 | 说明 | 是否必填 |
|------|------|---------|---------|
| id | uint | 自增主键 | ✅ |
| endpoint_id | string | 关联端点ID | ✅ |
| version | string | 版本号 | ✅ |
| changes | jsonb | 变更内容数组 | ❌ |
| created_at | timestamp | 创建时间 | ✅ |
| deprecated_at | timestamp | 废弃时间 | ❌ |
| removed_at | timestamp | 移除时间 | ❌ |

---

## 规划的核心流程

### 流程1: 自动发现API端点

**触发条件**: 系统启动或手动触发扫描

**流程步骤**:
```
1. 启动Discovery Engine
2. 扫描Gin路由注册代码
   2.1 解析cmd/server/main.go中的路由定义
   2.2 提取path, method, handler信息
3. 生成APIEndpoint记录
   3.1 检查数据库是否已存在 (path + method)
   3.2 如果存在 → 更新last_used_at
   3.3 如果不存在 → 创建新记录
       - 设置discovered=true
       - 设置discovery_method="gin-route-scan"
       - summary和description留空 (待人工补充)
4. 关联已有的Schema (如果存在)
5. 生成发现报告
   - 新发现端点: 15个
   - 更新端点: 3个
   - 废弃端点: 2个 (代码中已移除)
6. 通知管理员补充文档
```

**涉及组件**:
- `apicenter/discovery_engine.go:ScanGinRoutes()`
- `api_endpoints` 表
- 通知系统 (发送文档补充提醒)

### 流程2: 创建API文档

**触发条件**: 管理员在APICenter页面点击"新建API"

**流程步骤**:
```
1. 用户打开APIEndpointEditor
2. 填写基本信息
   - path: /api/v2/custom-action
   - method: POST
   - category: ActionLibrary
   - summary: 执行自定义动作
3. 创建或选择Request Schema
   3.1 选择"创建新Schema" → 打开SchemaEditor
   3.2 编写JSON Schema定义
   3.3 添加examples示例数据
   3.4 保存Schema → 返回schemaId
4. 创建或选择Response Schema (同上)
5. 添加tags (如 ["action", "custom", "execution"])
6. 提交 → POST /api/v2/api-center/endpoints
7. 后端保存
   7.1 验证path和method的唯一性
   7.2 验证schemaId存在性
   7.3 创建APIEndpoint记录
   7.4 discovered=false (手动创建)
8. 返回201 Created
9. 前端刷新API目录
```

**涉及组件**:
- 前端: `APICenter.tsx`, `APIEndpointEditor.tsx`, `SchemaEditor.tsx`
- 后端: `api_center_handler.go:CreateEndpoint()`
- 数据库: `api_endpoints`, `api_schemas`

### 流程3: API在线测试

**触发条件**: 用户在API文档页面点击"Try It"

**流程步骤**:
```
1. 加载APIEndpoint和RequestSchema
2. 根据Schema自动生成表单
   2.1 解析schemaDefinition.properties
   2.2 为每个字段生成输入组件
       - string → <input type="text">
       - enum → <select>
       - number → <input type="number">
       - object → 嵌套表单
   2.3 标记required字段
3. 用户填写参数
   3.1 可以选择Schema中的example快速填充
   3.2 配置认证信息 (Bearer Token)
4. 点击"Send Request"
5. 前端发送实际HTTP请求
   5.1 构造请求: method + path + body
   5.2 添加headers (Content-Type, Authorization)
   5.3 发送到实际后端API
6. 接收响应
   6.1 显示HTTP状态码
   6.2 格式化展示响应JSON
   6.3 语法高亮
7. 提供操作选项
   7.1 "保存为TestCase" → 跳转到TestCaseEditor
   7.2 "复制cURL命令"
   7.3 "再次发送"
```

**涉及组件**:
- 前端: `APIPlayground.tsx`, `SchemaForm.tsx`
- 后端: 实际的业务API (如 `/api/v2/tests`)
- 不经过API Center Service,直接调用真实API

### 流程4: Mock数据生成

**触发条件**: 前端开发时访问Mock服务

**流程步骤**:
```
1. 前端请求Mock数据
   GET http://localhost:8090/mock/api/v2/tests/test-001

2. Mock Engine拦截请求
   2.1 解析path: /mock/api/v2/tests/:id
   2.2 去除/mock前缀,得到实际path: /api/v2/tests/:id
   2.3 匹配APIEndpoint (GET /api/v2/tests/:id)

3. 查询ResponseSchema
   3.1 加载schema_definition
   3.2 解析required和properties

4. 生成Mock数据
   4.1 如果有examples → 随机返回一个example
   4.2 否则根据Schema类型生成:
       - string → faker.randomString()
       - number → faker.randomInt()
       - boolean → faker.randomBool()
       - array → 生成3-5个元素
       - object → 递归生成嵌套对象
   4.3 特殊字段识别:
       - *Id → 生成UUID格式
       - *At → 生成时间戳
       - email → 生成邮箱格式

5. 返回Mock响应
   {
     "testId": "test-mock-abc123",
     "name": "Mock测试用例名称",
     "type": "http",
     "status": "active",
     "createdAt": "2025-11-26T10:00:00Z"
   }

6. 记录Mock调用统计
   - 增加endpoint.usage_count
   - 更新endpoint.last_used_at
```

**涉及组件**:
- `apicenter/mock_engine.go:HandleMockRequest()`
- `apicenter/data_generator.go:GenerateBySchema()`
- Faker库 (生成随机数据)

---

## 规划的API接口

### 核心端点

#### 创建API端点

```http
POST /api/v2/api-center/endpoints
Content-Type: application/json

{
  "path": "/api/v2/custom-action",
  "method": "POST",
  "category": "ActionLibrary",
  "summary": "执行自定义动作",
  "description": "执行用户自定义的动作模板",
  "version": "v2",
  "requestSchemaId": "schema-custom-action-request",
  "responseSchemaId": "schema-custom-action-response",
  "tags": ["action", "custom"]
}
```

**响应**:
```json
{
  "endpointId": "endpoint-uuid-123",
  "path": "/api/v2/custom-action",
  "method": "POST",
  "category": "ActionLibrary",
  "createdAt": "2025-11-26T10:00:00Z"
}
```

#### 获取API目录

```http
GET /api/v2/api-center/endpoints?category=TestCase&deprecated=false
```

**响应**:
```json
{
  "data": [
    {
      "endpointId": "endpoint-001",
      "path": "/api/v2/tests",
      "method": "POST",
      "summary": "创建测试用例",
      "deprecated": false,
      "version": "v2"
    },
    {
      "endpointId": "endpoint-002",
      "path": "/api/v2/tests/:id",
      "method": "GET",
      "summary": "获取测试用例详情",
      "deprecated": false,
      "version": "v2"
    }
  ],
  "pagination": {
    "page": 1,
    "size": 20,
    "total": 45
  }
}
```

#### 创建Schema

```http
POST /api/v2/api-center/schemas
Content-Type: application/json

{
  "name": "TestCase创建请求",
  "type": "request",
  "version": "1.0",
  "schemaDefinition": {
    "type": "object",
    "required": ["name", "type", "groupId"],
    "properties": {
      "name": {"type": "string", "minLength": 1},
      "type": {"type": "string", "enum": ["http", "command", "workflow"]},
      "groupId": {"type": "string"}
    }
  },
  "examples": [
    {
      "name": "示例测试用例",
      "type": "http",
      "groupId": "group-001"
    }
  ]
}
```

#### 触发API发现

```http
POST /api/v2/api-center/discover
Content-Type: application/json

{
  "method": "gin-route-scan",
  "options": {
    "updateExisting": false
  }
}
```

**响应**:
```json
{
  "discoveryId": "discovery-run-001",
  "status": "completed",
  "summary": {
    "newEndpoints": 15,
    "updatedEndpoints": 3,
    "deprecatedEndpoints": 2
  },
  "details": [
    {
      "path": "/api/v2/workflows",
      "method": "POST",
      "action": "created",
      "endpointId": "endpoint-new-001"
    }
  ]
}
```

#### Mock API访问

```http
GET /mock/api/v2/tests/test-001
```

**响应** (自动生成的Mock数据):
```json
{
  "testId": "test-mock-abc123",
  "name": "Mock测试用例名称",
  "type": "http",
  "status": "active",
  "priority": "P1",
  "successRate": 85,
  "avgDuration": 1250,
  "createdAt": "2025-11-26T10:00:00Z"
}
```

---

## 与其他模块的关系

### 依赖关系

**本模块依赖** (规划):
- **Tenant模块** - API端点归属于项目,通过projectId隔离
- **User模块** - API文档的查看和编辑权限控制

**本模块被依赖** (规划):
- **TestCase模块** - API测试沙盒可以快速创建TestCase
- **ActionLibrary模块** - 自定义Action的API文档管理
- **Dashboard模块** - 显示API使用统计和趋势

### 边界规则

**✅ 允许的调用**:
- API Center可以读取 `Tenant.GetProjects()` 获取项目列表
- API Center可以调用 `TestCase.Create()` 从沙盒创建测试用例
- Dashboard可以调用 `APICenter.GetUsageStats()` 获取API调用统计

**❌ 禁止的调用**:
- API Center **不能**修改其他模块的业务逻辑
- API Center **不能**直接执行测试或工作流
- API Center **不能**跨租户/项目访问API文档

**调用流向**:
```
TestCase → API Center (从沙盒创建TestCase)
Dashboard → API Center (读取统计数据)
API Center → Tenant (验证项目归属)
API Center → Discovery Engine (自动发现API)
```

**数据隔离**: 通过projectId和tenantId实现多租户隔离

**详细边界定义**: [`docs/5-wiki/architecture/module-boundaries.md`](../architecture/module-boundaries.md)

---

## 实施计划

### Phase 1: 基础设施 (预计4周)

**目标**: 建立数据模型和基本CRUD

**任务**:
1. 设计数据库表结构 (api_endpoints, api_schemas)
2. 创建GORM模型和仓储层
3. 实现基本CRUD API
   - 创建/查询/更新/删除APIEndpoint
   - 创建/查询/更新/删除APISchema
4. 前端APICenter主页框架搭建

**验收标准**:
- [ ] 数据库表创建完成
- [ ] 可以手动创建和查询API端点
- [ ] 可以创建和管理Schema
- [ ] 前端可以展示API目录列表

### Phase 2: API自动发现 (预计3周)

**目标**: 实现Gin路由扫描和自动注册

**任务**:
1. 实现DiscoveryEngine.ScanGinRoutes()
2. 解析cmd/server/main.go中的路由定义
3. 自动生成APIEndpoint记录
4. 实现增量更新 (不覆盖已有文档)
5. 生成发现报告

**验收标准**:
- [ ] 可以扫描所有现有API端点 (~50个)
- [ ] 自动识别path, method, handler
- [ ] 增量更新不丢失人工补充的文档
- [ ] 生成易读的发现报告

### Phase 3: Schema管理和文档补充 (预计3周)

**目标**: 完善Schema编辑和文档维护

**任务**:
1. 实现SchemaEditor前端组件
2. 支持JSON Schema可视化编辑
3. 添加示例数据管理
4. 关联Schema到Endpoint
5. 补充现有API的完整文档

**验收标准**:
- [ ] 可以可视化编辑JSON Schema
- [ ] 支持添加多个example
- [ ] 所有核心API都有完整文档
- [ ] Schema验证功能正常

### Phase 4: API在线测试 (预计2周)

**目标**: 实现Try It功能

**任务**:
1. 实现APIPlayground组件
2. 根据Schema自动生成表单
3. 发送真实HTTP请求
4. 展示响应结果
5. 支持保存为TestCase

**验收标准**:
- [ ] 可以在线测试所有API
- [ ] 表单自动生成符合Schema
- [ ] 支持认证配置
- [ ] 可以一键保存为TestCase

### Phase 5: Mock服务 (预计3周)

**目标**: 实现Mock数据生成

**任务**:
1. 实现MockEngine
2. 基于Schema生成Mock数据
3. 支持/mock前缀路由
4. 实现数据生成规则
5. 集成Faker库

**验收标准**:
- [ ] 可以访问/mock/api/v2/xxx获取Mock数据
- [ ] Mock数据符合Schema定义
- [ ] 支持自定义Mock规则
- [ ] 前端开发可以完全使用Mock API

### Phase 6: 高级功能 (预计4周)

**目标**: 版本管理和OpenAPI导入

**任务**:
1. 实现API版本管理
2. 记录变更历史
3. 支持OpenAPI/Swagger导入
4. 生成OpenAPI文档导出
5. API使用统计和分析

**验收标准**:
- [ ] 可以查看API变更历史
- [ ] 可以导入OpenAPI 3.0文档
- [ ] 可以导出完整的OpenAPI规范
- [ ] 显示API调用统计图表

---

## 相关文档

### 技术规范
- **数据库设计**: 待实施后补充至 [`1-specs/database/schema.md#api-center`](../../1-specs/database/schema.md)
- **API文档**: 待实施后补充至 [`1-specs/api/v2-documentation.md#api-center-api`](../../1-specs/api/v2-documentation.md)

### 决策记录
- 暂无专门的API Center决策记录 (规划阶段)

### 架构文档
- [模块边界定义](../architecture/module-boundaries.md) - API Center定位为Extension Layer

### 外部参考
- **OpenAPI规范**: https://swagger.io/specification/
- **JSON Schema规范**: https://json-schema.org/
- **Postman文档**: https://www.postman.com/api-platform/api-documentation/

---

## 术语表

| 术语 | 说明 |
|------|------|
| API Endpoint | API端点,单个HTTP接口的定义 |
| API Schema | API Schema,描述请求/响应数据结构的JSON Schema |
| API Discovery | API自动发现,通过扫描代码识别API端点 |
| Mock Server | Mock服务器,基于Schema生成虚拟数据 |
| API Playground | API测试沙盒,在线测试API功能 |
| OpenAPI | OpenAPI规范,标准化的API文档格式 |
| JSON Schema | JSON Schema规范,描述JSON数据结构 |

**完整术语表**: [`docs/5-wiki/glossary.md`](../glossary.md)

---

## 更新历史

| 日期 | 版本 | 变更说明 | 作者 |
|------|------|---------|------|
| 2025-11-26 | 0.1 | 初始版本,规划设计文档 | 开发团队 |

---

**维护提示**:
- 本文档为规划文档,实施后需更新为实际实现
- 当开始实施时,更新状态从"计划中"改为"开发中"
- 实施完成后,补充实际的代码路径和API端点
- 定期review规划内容,根据实际需求调整设计

---

## 常见问题 (规划)

### Q1: 为什么需要API Center?

**A**: API Center解决以下痛点:

1. **文档过期**: 手动维护的API文档容易与代码脱节
2. **测试困难**: 每次测试API需要打开Postman或cURL
3. **前后端协作**: 缺少统一的API契约,沟通成本高
4. **API治理**: 不清楚哪些API已废弃,哪些被频繁使用

### Q2: 与现有的API文档(1-specs/api/)有什么区别?

**A**:

- **现有文档**: 手动编写的Markdown文档,静态,需人工维护
- **API Center**: 数据库驱动,动态,自动发现+人工补充,支持在线测试

两者互补:
- API Center提供实时、可测试的文档
- Markdown文档提供设计理念和使用指南

### Q3: 自动发现会覆盖人工编写的文档吗?

**A**: 不会。自动发现采用增量更新策略:

```go
// 伪代码
if endpoint.Discovered && endpoint.Summary != "" {
    // 已有人工补充的文档,只更新技术信息
    endpoint.Handler = discoveredHandler
    endpoint.LastUsedAt = now()
} else {
    // 新端点或空文档,创建基础记录
    endpoint.Discovered = true
    endpoint.Summary = "" // 待补充
}
```

### Q4: Mock服务会影响真实API吗?

**A**: 不会。Mock服务完全独立:

- **真实API**: `/api/v2/tests` → 调用实际业务逻辑
- **Mock API**: `/mock/api/v2/tests` → 调用Mock Engine生成数据

前端可以通过环境变量切换:
```typescript
const BASE_URL = process.env.USE_MOCK
  ? 'http://localhost:8090/mock'
  : 'http://localhost:8090'
```

### Q5: 如何处理路径参数的Mock?

**A**: Mock Engine智能识别路径参数:

```
请求: GET /mock/api/v2/tests/test-001

Mock Engine解析:
- 模板: /api/v2/tests/:id
- 参数: id=test-001
- 生成: 返回Mock数据,其中testId="test-001"
```

如果Schema定义了id字段,Mock数据会使用路径参数的实际值。

### Q6: 实施优先级如何确定?

**A**: 分阶段实施,优先级:

1. **P0 - Phase 1-2**: 基础CRUD + 自动发现 (立即价值)
2. **P1 - Phase 3-4**: 文档补充 + 在线测试 (提升体验)
3. **P2 - Phase 5-6**: Mock服务 + 高级功能 (锦上添花)

建议先完成P0功能,验证可行性后再推进P1/P2。

---

**规划审查时间**: 2026-Q1 (待产品需求确认后启动实施)
