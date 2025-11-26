# Tenant - 多租户系统模块概览

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

多租户系统模块负责组织(Tenant)和项目(Project)的管理,实现数据隔离、成员管理和配额限制。采用四层权限模型: Platform → Tenant → Project → Resource。

### 主要功能

- **租户管理**: 创建、暂停、删除组织(Tenant)
- **项目管理**: 在租户下创建和管理项目(Project)
- **成员管理**: 为租户和项目分配成员及角色
- **权限控制**: 基于角色的访问控制(RBAC)
- **数据隔离**: 通过tenantId和projectId实现多租户数据隔离
- **配额限制**: 限制租户可创建的项目数、用户数、测试用例数

### 适用场景

- **SaaS多租户**: 为不同企业客户提供隔离的测试平台实例
- **企业组织管理**: 大型企业内部按部门/团队隔离数据
- **项目隔离**: 同一组织下不同项目的测试数据互不影响
- **成员协作**: 团队成员按角色分配不同权限
- **资源配额**: 控制每个租户的资源使用量

---

## 核心概念

### 概念1: Tenant (租户/组织)

**定义**: 多租户系统的顶层隔离单位,通常对应一个企业客户或部门。

**属性**:
- `tenantId` (String) - 租户唯一标识符
- `name` (String) - 租户名称
- `displayName` (String) - 显示名称
- `description` (String) - 租户描述
- `status` (String) - 状态: active(活跃), suspended(暂停), deleted(删除)
- `settings` (JSONB) - 租户配置(主题、语言等)
- `maxProjects` (Integer) - 最多可创建项目数,默认10
- `maxUsers` (Integer) - 最多可添加用户数,默认50
- `maxTestCases` (Integer) - 最多可创建测试用例数,默认1000

**示例**:
```json
{
  "tenantId": "tenant-acme-corp",
  "name": "acme-corp",
  "displayName": "Acme Corporation",
  "description": "Acme公司测试平台",
  "status": "active",
  "maxProjects": 20,
  "maxUsers": 100,
  "maxTestCases": 5000,
  "settings": {
    "theme": "dark",
    "language": "zh-CN"
  },
  "contactEmail": "admin@acme.com",
  "contactPhone": "+86-138-0000-0000"
}
```

### 概念2: Project (项目)

**定义**: 租户下的子级隔离单位,用于组织具体的测试项目或产品线。

**属性**:
- `projectId` (String) - 项目唯一标识符
- `tenantId` (String) - 所属租户ID
- `name` (String) - 项目名称
- `displayName` (String) - 显示名称
- `status` (String) - 状态: active(活跃), archived(归档), deleted(删除)
- `ownerId` (String) - 项目负责人ID
- `repositoryUrl` (String) - 代码仓库地址
- `testCaseCount` (Integer) - 测试用例数量统计
- `testGroupCount` (Integer) - 测试分组数量统计

**示例**:
```json
{
  "projectId": "proj-mobile-app",
  "tenantId": "tenant-acme-corp",
  "name": "mobile-app",
  "displayName": "移动应用测试项目",
  "status": "active",
  "ownerId": "user-john",
  "repositoryUrl": "https://github.com/acme/mobile-app",
  "testCaseCount": 156,
  "testGroupCount": 23
}
```

### 概念3: 四层权限模型

**定义**: Platform → Tenant → Project → Resource的层级权限体系。

**权限层级**:
```
┌────────────────────────────────────────┐
│ Platform Level (平台级)                │
│ - Platform Admin (平台管理员)          │
│ - 管理所有租户和项目                   │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│ Tenant Level (租户级)                  │
│ - Tenant Owner (租户所有者)            │
│ - Tenant Admin (租户管理员)            │
│ - Tenant Member (租户成员)             │
│ - Tenant Viewer (租户查看者)           │
│ - 管理租户下所有项目                   │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│ Project Level (项目级)                 │
│ - Project Owner (项目所有者)           │
│ - Project Maintainer (项目维护者)      │
│ - Project Developer (项目开发者)       │
│ - Project Tester (项目测试者)          │
│ - Project Viewer (项目查看者)          │
│ - 管理项目下的测试资源                 │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│ Resource Level (资源级)                │
│ - TestCase, Workflow, Environment等    │
│ - 通过projectId隔离                    │
└────────────────────────────────────────┘
```

**权限继承**:
- Tenant Owner自动成为所有Project的Owner
- Platform Admin可以管理所有Tenant和Project

### 概念4: 数据隔离机制

**定义**: 通过tenantId和projectId字段实现多租户数据隔离。

**隔离规则**:
1. **查询隔离**: 所有数据查询自动添加 `WHERE tenant_id=? AND project_id=?`
2. **创建隔离**: 创建资源时自动填充当前用户的tenantId和projectId
3. **更新隔离**: 更新时验证资源归属,防止跨租户修改
4. **删除隔离**: 删除时验证权限和归属

**实现方式**:
- **后端中间件**: 自动从JWT Token提取tenantId和projectId
- **数据库索引**: tenant_id和project_id上建立联合索引
- **API过滤**: Handler层强制添加过滤条件

**示例**:
```go
// 自动添加租户和项目过滤
func (r *TestCaseRepo) List(ctx context.Context, tenantID, projectID string) ([]*TestCase, error) {
    var cases []*TestCase
    err := r.db.Where("tenant_id = ? AND project_id = ?", tenantID, projectID).
        Find(&cases).Error
    return cases, err
}
```

### 概念5: TenantMember 和 ProjectMember

**定义**: 租户成员和项目成员的关联关系。

**TenantMember (租户成员)**:
- `tenantId` + `userId` - 联合唯一
- `role` - 角色: owner, admin, member, viewer
- `permissions` - 自定义权限(JSONB)

**ProjectMember (项目成员)**:
- `projectId` + `userId` - 联合唯一
- `role` - 角色: owner, maintainer, developer, tester, viewer
- `permissions` - 自定义权限(JSONB)

**关系**:
- 用户可以是多个Tenant的成员
- 用户可以是多个Project的成员
- Tenant成员不自动成为Project成员 (需显式添加)

### 概念6: 配额限制 (Quota)

**定义**: 限制租户可使用的资源数量,防止资源滥用。

**限制项**:
- `maxProjects` - 最多可创建项目数
- `maxUsers` - 最多可添加用户数
- `maxTestCases` - 最多可创建测试用例数

**检查时机**:
- 创建Project时 → 检查是否超过maxProjects
- 添加成员时 → 检查是否超过maxUsers
- 创建TestCase时 → 检查是否超过maxTestCases

**超限处理**:
```
if currentProjectCount >= tenant.maxProjects {
    return Error("已达到项目数量上限")
}
```

---

## 代码路径

### 后端代码

| 分层 | 路径 | 职责 |
|------|------|------|
| **模型层** | `nextest-platform/internal/models/tenant.go` | GORM数据模型定义 |
| **仓储层** | `nextest-platform/internal/repository/tenant_repo.go` | 数据访问接口 |
| **服务层** | `nextest-platform/internal/service/tenant_service.go` | 业务逻辑和权限管理 |
| **处理层** | `nextest-platform/internal/handler/tenant_handler.go` | HTTP API处理器 |
| **中间件** | `nextest-platform/internal/middleware/tenant_middleware.go` | 多租户中间件 |

**关键文件**:
- `models/tenant.go` - Tenant, Project, TenantMember, ProjectMember模型
- `service/tenant_service.go` - 租户创建、暂停、成员管理
- `middleware/tenant_middleware.go` - 自动注入tenantId和projectId
- `handler/tenant_handler.go` - `/api/v2/tenants`, `/api/v2/projects` 端点

---

### 前端代码

| 分层 | 路径 | 职责 |
|------|------|------|
| **页面组件** | `NextTestPlatformUI/components/AdminPortal.tsx` | 租户和项目管理主页 |
| **Sidebar** | `NextTestPlatformUI/components/Sidebar.tsx` | 租户/项目切换选择器 |
| **UI组件** | `NextTestPlatformUI/components/tenant/` | 租户相关组件 |

**关键文件**:
- `AdminPortal.tsx` - 租户和项目CRUD、成员管理
- `Sidebar.tsx` - 三级选择器: 组织 → 项目 → 环境

---

## 数据模型

### 核心实体

#### Tenant (租户)

**数据库表**: `tenants`

**字段说明**:

| 字段 | 类型 | 说明 | 是否必填 |
|------|------|------|---------|
| id | uint | 自增主键 | ✅ |
| tenant_id | string | 租户唯一ID (最长100字符) | ✅ |
| name | string | 租户名称 | ✅ |
| display_name | string | 显示名称 | ❌ |
| description | text | 租户描述 | ❌ |
| status | string | 状态: active/suspended/deleted,默认active | ✅ |
| settings | jsonb | 租户配置(主题、语言等) | ❌ |
| max_projects | int | 最多项目数,默认10 | ❌ |
| max_users | int | 最多用户数,默认50 | ❌ |
| max_test_cases | int | 最多测试用例数,默认1000 | ❌ |
| contact_email | string | 联系邮箱 | ❌ |
| contact_phone | string | 联系电话 | ❌ |
| created_at | timestamp | 创建时间 | ✅ |
| updated_at | timestamp | 更新时间 | ✅ |
| deleted_at | timestamp | 软删除时间 | ❌ |

**关联关系**:
- `Projects []Project` - 租户下的项目列表
- `Members []TenantMember` - 租户成员列表

**完整Schema**: 详见 [`docs/1-specs/database/schema.md#tenants`](../../1-specs/database/schema.md)

#### Project (项目)

**数据库表**: `projects`

**关键字段**:
- `project_id`: 项目唯一ID
- `tenant_id`: 所属租户ID (外键)
- `status`: active/archived/deleted
- `owner_id`: 项目负责人ID
- `test_case_count`: 测试用例数统计
- `test_group_count`: 测试分组数统计

**关联关系**:
- `Tenant Tenant` - 所属租户
- `Members []ProjectMember` - 项目成员列表
- `TestGroups []TestGroup` - 测试分组列表
- `TestCases []TestCase` - 测试用例列表

#### TenantMember (租户成员)

**数据库表**: `tenant_members`

**关键字段**:
- `tenant_id` + `user_id` - 联合唯一索引
- `role`: owner/admin/member/viewer
- `permissions`: 自定义权限(JSONB)

#### ProjectMember (项目成员)

**数据库表**: `project_members`

**关键字段**:
- `project_id` + `user_id` - 联合唯一索引
- `role`: owner/maintainer/developer/tester/viewer
- `permissions`: 自定义权限(JSONB)

---

## 核心流程

### 流程1: 创建租户

**触发条件**: Platform Admin创建新租户

**流程步骤**:
```
1. Platform Admin登录 → 进入AdminPortal
2. 点击"新建租户" → 填写表单
   - 租户名称 (name)
   - 显示名称 (displayName)
   - 描述 (description)
   - 配额限制 (maxProjects, maxUsers, maxTestCases)
   - 联系信息 (contactEmail, contactPhone)
3. 提交 → POST /api/v2/tenants
4. 后端Handler接收请求
   4.1 验证Platform Admin权限
   4.2 验证必填字段
   4.3 生成唯一TenantID
   4.4 设置status=active
   4.5 设置默认配额
   4.6 调用Service.CreateTenant()
   4.7 Repository保存到数据库
5. 返回201 Created + Tenant对象
6. 前端刷新租户列表
```

**涉及组件**:
- 前端: `AdminPortal.tsx`
- 后端: `tenant_handler.go:CreateTenant()`
- 数据库: `tenants`

### 流程2: 创建项目

**触发条件**: Tenant Owner/Admin创建新项目

**流程步骤**:
```
1. Tenant Owner登录 → 选择租户 → 进入AdminPortal
2. 点击"新建项目" → 填写表单
   - 项目名称 (name)
   - 显示名称 (displayName)
   - 描述 (description)
   - 负责人 (ownerId)
   - 代码仓库 (repositoryUrl)
3. 提交 → POST /api/v2/projects
4. 后端Handler接收请求
   4.1 从JWT Token提取tenantId
   4.2 验证用户是否为Tenant Owner/Admin
   4.3 检查配额: 是否超过maxProjects
   4.4 生成唯一ProjectID
   4.5 设置status=active
   4.6 设置tenantId (自动关联)
   4.7 调用Service.CreateProject()
   4.8 Repository保存到数据库
5. 返回201 Created + Project对象
6. 前端刷新项目列表
```

**涉及组件**:
- 前端: `AdminPortal.tsx`
- 后端: `tenant_handler.go:CreateProject()`, `tenant_service.go:CheckQuota()`
- 数据库: `projects`, `tenants` (读取配额)

### 流程3: 添加租户成员

**触发条件**: Tenant Owner/Admin添加新成员

**流程步骤**:
```
1. Tenant Owner登录 → 选择租户 → 成员管理页
2. 点击"添加成员" → 选择用户 → 分配角色
   - 用户: user-alice
   - 角色: member
3. 提交 → POST /api/v2/tenants/:id/members
   {
     "userId": "user-alice",
     "role": "member",
     "permissions": {}
   }
4. 后端Handler接收请求
   4.1 验证Tenant Owner/Admin权限
   4.2 检查配额: 是否超过maxUsers
   4.3 检查用户是否已存在
   4.4 创建TenantMember记录
   4.5 Repository保存到数据库
5. 返回201 Created
6. 前端刷新成员列表
```

**涉及组件**:
- 前端: `AdminPortal.tsx`, 成员管理组件
- 后端: `tenant_handler.go:AddTenantMember()`
- 数据库: `tenant_members`

### 流程4: 数据隔离中间件

**触发条件**: 所有需要多租户隔离的API请求

**流程步骤**:
```
1. 前端发起请求 (携带JWT Token)
   GET /api/v2/tests
   Authorization: Bearer <jwt_token>

2. 后端TenantMiddleware拦截
   2.1 解析JWT Token
   2.2 提取claims中的tenantId和projectId
   2.3 注入到Request Context
       ctx = context.WithValue(ctx, "tenantId", tenantId)
       ctx = context.WithValue(ctx, "projectId", projectId)
   2.4 传递给下一个Handler

3. Handler处理请求
   3.1 从Context提取tenantId和projectId
       tenantId := ctx.Value("tenantId").(string)
       projectId := ctx.Value("projectId").(string)
   3.2 调用Service,传递隔离参数
       testCases := service.List(ctx, tenantId, projectId)

4. Service调用Repository
   4.1 Repository自动添加WHERE条件
       WHERE tenant_id=? AND project_id=?
   4.2 查询并返回隔离后的数据

5. 返回响应给前端
```

**涉及组件**:
- `middleware/tenant_middleware.go:ExtractTenantContext()`
- `handler/*.go` - 所有Handler
- `repository/*.go` - 所有Repository

### 流程5: 前端租户/项目切换

**触发条件**: 用户在Sidebar切换租户或项目

**流程步骤**:
```
1. 用户点击Sidebar的租户选择器
2. 下拉列表展示用户有权限的所有租户
3. 选择新租户 → setActiveTenantId(tenantId)
4. 前端State更新:
   - 清空当前项目和环境选择
   - 重新加载该租户下的项目列表
5. 项目选择器自动过滤:
   projects.filter(p => p.tenantId === activeTenantId)
6. 所有数据列表自动刷新 (过滤到新的tenantId和projectId)
7. 后续API请求携带新的tenantId和projectId (通过JWT Token更新)
```

**涉及组件**:
- 前端: `Sidebar.tsx`, `App.tsx` (State管理)
- 后端: 无需修改 (通过JWT Token自动隔离)

---

## API接口

### 核心端点

#### 创建租户

```http
POST /api/v2/tenants
Content-Type: application/json

{
  "name": "acme-corp",
  "displayName": "Acme Corporation",
  "description": "Acme公司测试平台",
  "maxProjects": 20,
  "maxUsers": 100,
  "contactEmail": "admin@acme.com"
}
```

**响应**:
```json
{
  "tenantId": "tenant-acme-corp",
  "name": "acme-corp",
  "status": "active",
  "createdAt": "2025-11-26T10:00:00Z"
}
```

#### 获取租户列表

```http
GET /api/v2/tenants
```

**响应**:
```json
{
  "data": [
    {
      "tenantId": "tenant-acme-corp",
      "name": "acme-corp",
      "displayName": "Acme Corporation",
      "status": "active",
      "maxProjects": 20
    }
  ]
}
```

#### 创建项目

```http
POST /api/v2/projects
Content-Type: application/json

{
  "tenantId": "tenant-acme-corp",
  "name": "mobile-app",
  "displayName": "移动应用测试项目",
  "ownerId": "user-john"
}
```

**响应**:
```json
{
  "projectId": "proj-mobile-app",
  "tenantId": "tenant-acme-corp",
  "name": "mobile-app",
  "status": "active",
  "createdAt": "2025-11-26T10:05:00Z"
}
```

#### 暂停租户

```http
POST /api/v2/tenants/:id/suspend
```

**响应**:
```json
{
  "tenantId": "tenant-acme-corp",
  "status": "suspended",
  "message": "租户已暂停"
}
```

#### 添加租户成员

```http
POST /api/v2/tenants/:id/members
Content-Type: application/json

{
  "userId": "user-alice",
  "role": "member"
}
```

**详细API文档**: [`docs/1-specs/api/v2-documentation.md#tenant-api`](../../1-specs/api/v2-documentation.md)

---

## 与其他模块的关系

### 依赖关系

**本模块依赖**:
- **User模块** - 成员管理需要关联用户ID (计划中)

**本模块被依赖**:
- **所有业务模块** - TestCase, Workflow, Environment等都通过tenantId和projectId隔离数据
- **权限系统** - 所有权限验证基于Tenant和Project角色

### 边界规则

**✅ 允许的调用**:
- TestCase可以读取 `Tenant.GetQuota()` 检查是否超限
- Frontend可以调用 `Tenant.List()` 获取租户列表
- 所有模块都应该使用tenantId和projectId进行数据隔离

**❌ 禁止的调用**:
- Tenant **不能**主动调用TestCase或Workflow
- Tenant **不能**修改用户的认证信息
- 任何模块**不能**绕过多租户中间件直接访问数据

**调用流向**:
```
Middleware → Tenant (提取tenantId/projectId)
All Modules → Tenant (数据隔离依赖)
Frontend → Tenant (租户切换)
```

**数据隔离强制执行**:
- Middleware层自动注入tenantId和projectId
- Repository层强制添加WHERE条件
- 禁止跨租户/项目的任何数据访问

**详细边界定义**: [`docs/5-wiki/architecture/module-boundaries.md`](../architecture/module-boundaries.md)

---

## 相关文档

### 技术规范
- **数据库设计**: [`1-specs/database/schema.md#tenants`](../../1-specs/database/schema.md)
- **API文档**: [`1-specs/api/v2-documentation.md#tenant-api`](../../1-specs/api/v2-documentation.md)

### 决策记录
- [测试平台产品化架构](../../6-decisions/2024-11-26-test-platform-productization-architecture.md)

### 业务知识
- [多租户中间件](middleware.md)

### 开发指南
- [多租户集成指南](../../3-guides/development/multi-tenant-integration.md)

---

## 常见问题

### Q1: 如何为新租户分配配额？

**A**: 创建租户时指定配额限制:

```json
{
  "name": "new-tenant",
  "maxProjects": 50,  // 最多50个项目
  "maxUsers": 200,    // 最多200个用户
  "maxTestCases": 10000  // 最多10000个测试用例
}
```

**动态调整**: 后续可通过 `PUT /api/v2/tenants/:id` 更新配额

### Q2: 用户可以属于多个租户吗？

**A**: 可以。一个用户可以是多个租户的成员。

**切换方式**: 前端Sidebar提供租户选择器,切换后:
1. JWT Token更新 (包含新的tenantId)
2. 所有API请求自动使用新租户的数据

### Q3: 如何实现项目级权限控制？

**A**: 通过ProjectMember表和角色:

```
角色权限:
- owner: 所有权限
- maintainer: 管理测试用例、工作流、环境
- developer: 创建和执行测试
- tester: 执行测试和查看结果
- viewer: 仅查看权限
```

**权限检查**:
```go
func (s *TestCaseService) CreateTestCase(ctx context.Context, userID, projectID string, ...) error {
    member := s.projectMemberRepo.Get(projectID, userID)
    if member.Role != "owner" && member.Role != "maintainer" && member.Role != "developer" {
        return ErrPermissionDenied
    }
    // 创建测试用例
}
```

### Q4: 租户暂停后会发生什么？

**A**: 当租户status设为suspended时:

1. **API访问**: 中间件拦截,返回403 Forbidden
2. **前端显示**: 显示"租户已暂停"提示
3. **数据保留**: 数据不会被删除,只是无法访问
4. **恢复**: 调用 `POST /api/v2/tenants/:id/activate` 重新激活

### Q5: 如何处理租户删除？

**A**: 使用软删除机制:

```go
// 软删除 (deleted_at不为空)
DELETE /api/v2/tenants/:id

// 数据处理:
1. 设置tenant.deleted_at = now()
2. 级联软删除关联的projects, members
3. 不删除test_cases等业务数据 (保留归档)

// 永久删除 (可选,需Platform Admin权限)
DELETE /api/v2/tenants/:id?permanent=true
```

**建议**: 生产环境使用软删除,保留数据用于审计和恢复

### Q6: 如何扩展自定义权限？

**A**: 使用permissions字段(JSONB):

```json
{
  "tenantId": "tenant-001",
  "userId": "user-alice",
  "role": "member",
  "permissions": {
    "canDeleteTestCase": false,
    "canViewSecrets": false,
    "canManageBilling": true
  }
}
```

**权限检查**:
```go
if member.Permissions["canDeleteTestCase"] != true {
    return ErrPermissionDenied
}
```

---

## 术语表

| 术语 | 说明 |
|------|------|
| Tenant | 租户/组织,多租户系统的顶层隔离单位 |
| Project | 项目,租户下的子级隔离单位 |
| TenantMember | 租户成员,用户在租户中的角色 |
| ProjectMember | 项目成员,用户在项目中的角色 |
| Quota | 配额,限制租户可使用的资源数量 |
| Data Isolation | 数据隔离,通过tenantId和projectId实现 |
| RBAC | 基于角色的访问控制 |

**完整术语表**: [`docs/5-wiki/glossary.md`](../glossary.md)

---

## 更新历史

| 日期 | 版本 | 变更说明 | 作者 |
|------|------|---------|------|
| 2025-11-26 | 1.0 | 初始版本,基于现有代码和产品化架构决策创建 | 开发团队 |

---

**维护提示**:
- 当添加新的租户配额项时,更新"概念6"和FAQ Q1
- 当修改角色权限时,更新"概念3"和FAQ Q3
- 当修改数据隔离机制时,更新"概念4"和"流程4"
- 当添加新的API端点时,同步更新API文档
