# Environment - 环境管理模块概览

**版本**: 1.0
**最后更新**: 2025-11-26
**维护者**: 开发团队

---

## 目录

1. [模块简介](#模块简介)
2. [核心概念](#核心概念)
3. [代码路径](#代码路径)
4. [数据模型](#数据模型)
5. [核心流程](#核心流程)
6. [API接口](#api接口)
7. [与其他模块的关系](#与其他模块的关系)
8. [常见问题](#常见问题)

---

## 模块简介

环境管理模块负责多环境配置管理(Dev/Staging/Prod),支持环境变量定义、激活切换和密钥保护。

### 主要功能

- **多环境管理**: 创建和管理开发、预发布、生产等多个环境
- **环境变量**: 为每个环境配置独立的变量集(BASE_URL, API_KEY等)
- **激活切换**: 一键切换活跃环境,影响测试执行的配置源
- **密钥保护**: 标记敏感变量为secret,前端掩码显示
- **类型支持**: 支持string, number, boolean, json等多种变量类型
- **项目隔离**: 环境归属于项目,实现项目级隔离

### 适用场景

- **多环境测试**: 在不同环境(开发/测试/生产)执行相同测试用例
- **配置集中管理**: 统一管理API地址、数据库连接、第三方密钥
- **环境隔离**: 避免测试数据污染生产环境
- **快速切换**: 一键切换测试目标环境
- **密钥管理**: 安全存储和使用API密钥、Token等敏感信息

---

## 核心概念

### 概念1: Environment (环境)

**定义**: 测试环境的配置集合,包含环境名称、描述、激活状态和变量集。

**属性**:
- `envId` (String) - 环境唯一标识符
- `tenantId` (String) - 租户ID (多租户隔离)
- `projectId` (String) - 项目ID (项目级隔离)
- `name` (String) - 环境名称
- `description` (String) - 环境描述
- `isActive` (Boolean) - 是否为活跃环境 (一个项目同时只能有一个活跃环境)
- `variables` (JSONB) - 环境变量集合 (键值对)

**示例**:
```json
{
  "envId": "env-dev-001",
  "projectId": "proj-test-platform",
  "name": "Development",
  "description": "开发环境",
  "isActive": true,
  "variables": {
    "API_BASE_URL": "https://dev-api.example.com",
    "DB_HOST": "localhost",
    "TIMEOUT": "30000",
    "ENABLE_DEBUG": "true"
  }
}
```

### 概念2: EnvironmentVariable (环境变量)

**定义**: 单个环境变量的详细配置,支持类型定义和密钥保护。

**属性**:
- `envId` (String) - 关联的环境ID
- `key` (String) - 变量名
- `value` (String) - 变量值
- `valueType` (String) - 变量类型: string(默认), number, boolean, json
- `isSecret` (Boolean) - 是否为密钥 (前端掩码显示为 ***)

**示例**:
```json
{
  "envId": "env-prod-001",
  "key": "API_KEY",
  "value": "sk-1234567890abcdef",
  "valueType": "string",
  "isSecret": true
}
```

### 概念3: 环境激活规则

**定义**: 一个项目同时只能有一个活跃环境,激活新环境会自动停用其他环境。

**激活流程**:
```
1. 用户请求激活 Environment A
2. 系统查询同项目下所有Environment
3. 将其他Environment的isActive设为false
4. 将Environment A的isActive设为true
5. 后续测试执行会从Environment A读取变量
```

**影响范围**:
- **TestCase执行**: 变量插值时从活跃环境读取
- **Workflow执行**: 工作流变量合并时使用活跃环境
- **前端显示**: UI上高亮显示当前活跃环境

### 概念4: 变量优先级

**定义**: 当多个来源提供相同变量名时的优先级规则。

**优先级顺序** (从高到低):
1. **运行时传入**: API请求body中传入的variables参数
2. **TestCase/Workflow定义**: 在definition中硬编码的变量
3. **活跃环境变量**: 从Environment.variables读取
4. **默认值**: 代码中定义的fallback值

**示例**:
```
// Workflow定义
{
  "variables": {
    "baseUrl": "https://default.com"  // 优先级2
  }
}

// 活跃Environment
{
  "variables": {
    "baseUrl": "https://staging.com"  // 优先级3
  }
}

// 运行时请求
POST /api/workflows/:id/execute
{
  "variables": {
    "baseUrl": "https://prod.com"  // 优先级1,最终使用这个
  }
}

最终baseUrl = "https://prod.com"
```

### 概念5: 密钥掩码机制

**定义**: 对敏感变量进行前端掩码显示,保护密钥不被泄露。

**掩码规则**:
- **isSecret=true**: 前端显示为 `***************`
- **isSecret=false**: 前端正常显示实际值

**使用场景**:
- API密钥 (API_KEY, SECRET_KEY)
- 数据库密码 (DB_PASSWORD)
- 第三方Token (OAUTH_TOKEN)

**安全注意**: 掩码只在前端显示层,后端API仍返回完整值 (需配合权限控制)

---

## 代码路径

### 后端代码

| 分层 | 路径 | 职责 |
|------|------|------|
| **模型层** | `nextest-platform/internal/models/environment.go` | GORM数据模型定义 |
| **仓储层** | `nextest-platform/internal/repository/environment_repo.go` | 数据访问接口 |
| **服务层** | `nextest-platform/internal/service/environment_service.go` | 业务逻辑和激活管理 |
| **处理层** | `nextest-platform/internal/handler/environment_handler.go` | HTTP API处理器 |

**关键文件**:
- `models/environment.go` - Environment, EnvironmentVariable模型
- `service/environment_service.go` - 环境激活、变量管理
- `handler/environment_handler.go` - `/api/v2/environments` 端点处理

---

### 前端代码

| 分层 | 路径 | 职责 |
|------|------|------|
| **页面组件** | `NextTestPlatformUI/components/SystemConfig.tsx` | 环境配置主页 |
| **UI组件** | `NextTestPlatformUI/components/environment/` | 环境相关组件 |

**关键文件**:
- `SystemConfig.tsx` - 环境列表、创建、编辑、激活
- 密钥掩码组件 - 显示 `***` 或实际值

---

## 数据模型

### 核心实体

#### Environment (环境)

**数据库表**: `environments`

**字段说明**:

| 字段 | 类型 | 说明 | 是否必填 |
|------|------|------|---------|
| id | uint | 自增主键 | ✅ |
| env_id | string | 环境唯一ID (最长50字符) | ✅ |
| tenant_id | string | 租户ID (多租户隔离) | ❌ |
| project_id | string | 项目ID (项目级隔离) | ❌ |
| name | string | 环境名称 (如Development) | ✅ |
| description | text | 环境描述 | ❌ |
| is_active | bool | 是否为活跃环境,默认false | ✅ |
| variables | jsonb | 环境变量集合 (键值对) | ❌ |
| created_at | timestamp | 创建时间 | ✅ |
| updated_at | timestamp | 更新时间 | ✅ |
| deleted_at | timestamp | 软删除时间 | ❌ |

**索引**:
- `env_id`: 唯一索引
- `tenant_id`: 普通索引
- `project_id`: 普通索引
- `is_active`: 普通索引 (快速查询活跃环境)

**完整Schema**: 详见 [`docs/1-specs/database/schema.md#environments`](../../1-specs/database/schema.md)

#### EnvironmentVariable (环境变量)

**数据库表**: `environment_variables`

**字段说明**:

| 字段 | 类型 | 说明 | 是否必填 |
|------|------|------|---------|
| id | uint | 自增主键 | ✅ |
| env_id | string | 关联的环境ID | ✅ |
| key | string | 变量名 | ✅ |
| value | text | 变量值 | ✅ |
| value_type | string | 变量类型,默认string | ❌ |
| is_secret | bool | 是否为密钥,默认false | ❌ |
| created_at | timestamp | 创建时间 | ✅ |
| updated_at | timestamp | 更新时间 | ✅ |

**关联关系**:
- `Environment hasMany EnvironmentVariable` (一对多)
- 外键: `env_id` → `environments.env_id`

---

## 核心流程

### 流程1: 创建环境

**触发条件**: 用户在SystemConfig页面点击"新建环境"

**流程步骤**:
```
1. 用户操作 → 前端打开EnvironmentEditor
2. 填写表单 → 输入name, description
3. 配置初始变量 (可选)
4. 提交 → POST /api/v2/environments
5. 后端Handler接收请求
   5.1 验证必填字段 (name)
   5.2 生成唯一EnvID
   5.3 设置isActive=false (新环境默认不激活)
   5.4 调用Service.CreateEnvironment()
   5.5 Repository保存到数据库
6. 返回201 Created + Environment对象
7. 前端刷新环境列表
```

**涉及组件**:
- 前端: `SystemConfig.tsx`, `EnvironmentEditor.tsx`
- 后端: `environment_handler.go:CreateEnvironment()`
- 数据库: `environments`

### 流程2: 激活环境

**触发条件**: 用户点击环境的"激活"按钮

**流程步骤**:
```
1. 用户点击Activate → POST /api/v2/environments/:id/activate
2. 后端Handler接收激活请求
   2.1 查询目标Environment
   2.2 获取其projectId
   2.3 调用Service.ActivateEnvironment(envId)
   2.4 Service执行激活逻辑:
       a. 在同一projectId下查询所有Environment
       b. 批量更新: 设置所有isActive=false
       c. 单独更新: 设置目标Environment的isActive=true
       d. 使用数据库事务保证原子性
   2.5 Repository执行数据库更新
3. 返回200 OK + 更新后的Environment
4. 前端刷新环境列表
   4.1 高亮显示活跃环境 (绿色圆点/标记)
   4.2 其他环境显示为灰色
```

**涉及组件**:
- 前端: `SystemConfig.tsx`
- 后端: `environment_service.go:ActivateEnvironment()`
- 数据库: `environments` (批量更新is_active字段)

### 流程3: 配置环境变量

**触发条件**: 用户在环境详情页管理变量

**流程步骤 (两种方式)**:

**方式1: 直接更新Environment.variables (批量)**
```
1. 编辑变量列表 → 提交
2. PUT /api/v2/environments/:id
   {
     "variables": {
       "API_BASE_URL": "https://api.example.com",
       "API_KEY": "sk-12345",
       "TIMEOUT": "30000"
     }
   }
3. 后端更新Environment.variables字段 (JSONB)
```

**方式2: 单独管理EnvironmentVariable (细粒度)**
```
1. 添加变量 → POST /api/v2/environments/:id/variables
   {
     "key": "DB_HOST",
     "value": "db.example.com",
     "valueType": "string",
     "isSecret": false
   }

2. 更新变量 → PUT /api/v2/environments/:id/variables/:key
   {
     "value": "new-value",
     "isSecret": true
   }

3. 删除变量 → DELETE /api/v2/environments/:id/variables/:key
```

**密钥处理**:
```
前端显示: isSecret=true → 显示为 ***************
前端编辑: 点击"显示"按钮 → 请求完整值
后端响应: 根据权限决定是否返回实际值
```

**涉及组件**:
- 前端: `SystemConfig.tsx`, 变量编辑组件
- 后端: `environment_handler.go:SetVariable(), UpdateVariable(), DeleteVariable()`
- 数据库: `environments.variables` (JSONB) 或 `environment_variables` 表

### 流程4: 测试执行时读取变量

**触发条件**: TestCase或Workflow执行时需要环境变量

**流程步骤**:
```
1. 测试执行开始
2. Executor初始化上下文
   2.1 查询当前projectId下is_active=true的Environment
   2.2 读取Environment.variables
   2.3 合并到执行上下文的变量池
3. 变量插值
   3.1 TestCase/Workflow定义中的{{varName}}
   3.2 查找变量池中的varName
   3.3 替换为实际值
   3.4 例如: {{API_BASE_URL}} → https://api.example.com
4. 执行测试/工作流
```

**涉及组件**:
- `environment_service.go:GetActiveEnvironment(projectId)`
- `testcase_executor.go` / `workflow/executor.go` - 调用读取变量
- 数据库: `environments` (WHERE project_id=? AND is_active=true)

---

## API接口

### 核心端点

#### 创建环境

```http
POST /api/v2/environments
Content-Type: application/json

{
  "projectId": "proj-001",
  "name": "Development",
  "description": "开发环境",
  "variables": {
    "API_BASE_URL": "https://dev-api.example.com",
    "TIMEOUT": "30000"
  }
}
```

**响应**:
```json
{
  "envId": "env-dev-001",
  "projectId": "proj-001",
  "name": "Development",
  "isActive": false,
  "createdAt": "2025-11-26T10:00:00Z"
}
```

#### 获取环境列表

```http
GET /api/v2/environments?projectId=proj-001
```

**响应**:
```json
{
  "data": [
    {
      "envId": "env-dev-001",
      "name": "Development",
      "isActive": true,
      "variables": {
        "API_BASE_URL": "https://dev-api.example.com"
      }
    },
    {
      "envId": "env-prod-001",
      "name": "Production",
      "isActive": false
    }
  ]
}
```

#### 获取活跃环境

```http
GET /api/v2/environments/active?projectId=proj-001
```

**响应**:
```json
{
  "envId": "env-dev-001",
  "name": "Development",
  "isActive": true,
  "variables": {
    "API_BASE_URL": "https://dev-api.example.com",
    "TIMEOUT": "30000"
  }
}
```

#### 激活环境

```http
POST /api/v2/environments/:envId/activate
```

**响应**:
```json
{
  "envId": "env-prod-001",
  "name": "Production",
  "isActive": true,
  "message": "Environment activated successfully"
}
```

#### 设置环境变量

```http
PUT /api/v2/environments/:envId/variables/:key
Content-Type: application/json

{
  "value": "sk-1234567890",
  "valueType": "string",
  "isSecret": true
}
```

**响应**:
```json
{
  "key": "API_KEY",
  "value": "***************",  // 掩码
  "valueType": "string",
  "isSecret": true
}
```

#### 删除环境变量

```http
DELETE /api/v2/environments/:envId/variables/:key
```

**详细API文档**: [`docs/1-specs/api/v2-documentation.md#environment-api`](../../1-specs/api/v2-documentation.md)

---

## 与其他模块的关系

### 依赖关系

**本模块依赖**:
- **Tenant模块** - 环境归属于项目,通过projectId和tenantId隔离 (可选)

**本模块被依赖**:
- **TestCase模块** - 执行时读取活跃环境的变量
- **Workflow模块** - 合并环境变量到工作流上下文
- **Dashboard模块** - 显示当前活跃环境信息

### 边界规则

**✅ 允许的调用**:
- TestCase可以调用 `Environment.GetActiveVariables(projectId)` 读取变量
- Workflow可以调用 `Environment.GetActiveVariables(projectId)` 读取变量
- Frontend可以调用 `Environment.List(projectId)` 获取环境列表

**❌ 禁止的调用**:
- Environment **不能**主动调用TestCase或Workflow
- Environment **不能**跨项目访问其他项目的环境
- Environment **不能**修改Tenant或Project的数据

**调用流向**:
```
TestCase → Environment (读取变量,单向)
Workflow → Environment (读取变量,单向)
Dashboard → Environment (读取显示,单向)
Tenant/Project → Environment (拥有关系,间接)
```

**数据隔离**: 通过projectId和tenantId实现多租户隔离,API查询时自动过滤

**详细边界定义**: [`docs/5-wiki/architecture/module-boundaries.md`](../architecture/module-boundaries.md)

---

## 相关文档

### 技术规范
- **数据库设计**: [`1-specs/database/schema.md#environments`](../../1-specs/database/schema.md)
- **API文档**: [`1-specs/api/v2-documentation.md#environment-api`](../../1-specs/api/v2-documentation.md)

### 决策记录
- 暂无专门的环境管理决策记录

### 开发指南
- [环境管理开发指南](../../3-guides/development/environment-management.md)

---

## 常见问题

### Q1: 如何为不同环境配置不同的变量？

**A**: 创建多个Environment,每个配置不同的variables:

```json
// 开发环境
{
  "name": "Development",
  "variables": {
    "API_BASE_URL": "http://localhost:8090",
    "DB_HOST": "localhost"
  }
}

// 生产环境
{
  "name": "Production",
  "variables": {
    "API_BASE_URL": "https://api.example.com",
    "DB_HOST": "db.example.com"
  }
}
```

**使用**: 激活Development环境时,所有测试使用 `http://localhost:8090`

### Q2: 同时激活多个环境可以吗？

**A**: 不可以。一个项目同时只能有一个活跃环境。

**原因**: 避免变量冲突,确保测试执行的配置来源唯一。

**操作**: 激活新环境会自动停用其他环境 (数据库事务保证原子性)

### Q3: 如何保护敏感的API密钥？

**A**: 使用`isSecret`标记:

```json
{
  "key": "API_KEY",
  "value": "sk-1234567890abcdef",
  "isSecret": true
}
```

**前端显示**: `***************`
**后端存储**: 完整值 (未加密,建议结合KMS)

**安全建议**:
1. 使用HTTPS传输
2. 结合RBAC权限控制谁能查看密钥
3. 生产环境使用外部密钥管理服务 (AWS KMS, HashiCorp Vault)

### Q4: 环境变量支持哪些数据类型？

**A**: 支持4种类型:

```json
{
  "STRING_VAR": {
    "value": "hello",
    "valueType": "string"
  },
  "NUMBER_VAR": {
    "value": "42",
    "valueType": "number"
  },
  "BOOL_VAR": {
    "value": "true",
    "valueType": "boolean"
  },
  "JSON_VAR": {
    "value": "{\"key\": \"value\"}",
    "valueType": "json"
  }
}
```

**类型转换**: 执行时根据valueType自动转换

### Q5: 如何在工作流中使用环境变量？

**A**: 使用特殊前缀 `env.`:

```json
{
  "variables": {
    "baseUrl": "{{env.API_BASE_URL}}"  // 从活跃环境读取
  },
  "steps": [
    {
      "config": {
        "url": "{{baseUrl}}/users"
      }
    }
  ]
}
```

**执行时**: 系统自动将 `{{env.API_BASE_URL}}` 替换为活跃环境的实际值

### Q6: 环境删除后会影响测试吗？

**A**: 取决于是否为活跃环境:

- **停用环境**: 删除不影响,因为测试不读取停用环境
- **活跃环境**: 删除后该项目没有活跃环境,测试执行时:
  - 变量插值失败 → 使用默认值或报错
  - 建议: 删除前先激活其他环境

**软删除**: 使用deleted_at字段,支持恢复

---

## 术语表

| 术语 | 说明 |
|------|------|
| Environment | 环境,一组配置的集合(Dev/Staging/Prod) |
| EnvironmentVariable | 环境变量,单个配置项 |
| Active Environment | 活跃环境,当前生效的环境 |
| Variable Interpolation | 变量插值,将{{var}}替换为实际值 |
| Secret Masking | 密钥掩码,敏感信息显示为*** |
| Variable Type | 变量类型,string/number/boolean/json |

**完整术语表**: [`docs/5-wiki/glossary.md`](../glossary.md)

---

## 更新历史

| 日期 | 版本 | 变更说明 | 作者 |
|------|------|---------|------|
| 2025-11-26 | 1.0 | 初始版本,基于现有代码和实施计划创建 | 开发团队 |

---

**维护提示**:
- 当添加新的变量类型时,更新"概念2"和FAQ Q4
- 当修改激活逻辑时,更新"概念3"和"流程2"
- 当增强密钥保护机制时,更新"概念5"和FAQ Q3
- 当修改变量优先级时,更新"概念4"
