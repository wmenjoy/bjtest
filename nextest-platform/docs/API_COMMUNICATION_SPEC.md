# 前后端通信格式规范

**版本**: 1.0.0
**创建日期**: 2025-11-23
**适用范围**: NextTestPlatformUI (前端) <-> nextest-platform (后端)

---

## 一、基础约定

### 1.1 API 基础信息

| 项目 | 值 |
|------|-----|
| 基础 URL | `http://localhost:8090/api` |
| v2 API URL | `http://localhost:8090/api/v2` |
| WebSocket URL | `ws://localhost:8090/api` |
| 内容类型 | `application/json` |
| 字符编码 | UTF-8 |

### 1.2 API 版本说明

| 版本 | 路径前缀 | 说明 |
|------|----------|------|
| v1 (默认) | `/api/` | Tests, Groups, Environments, Workflows |
| v2 | `/api/v2/` | Tenants, Projects (多租户) |

---

## 二、命名规范

### 2.1 字段命名 - **camelCase**

**规则**: 所有 JSON 字段使用小驼峰命名法 (camelCase)

```json
{
  "testId": "test-001",          // ✅ 正确
  "groupId": "group-001",        // ✅ 正确
  "createdAt": "2025-11-23T...", // ✅ 正确
  "isActive": true,              // ✅ 正确

  "test_id": "test-001",         // ❌ 错误 (snake_case)
  "TestId": "test-001",          // ❌ 错误 (PascalCase)
  "TESTID": "test-001"           // ❌ 错误 (UPPER_CASE)
}
```

### 2.2 ID 字段命名

| 实体 | 前端字段 | 后端字段 | 说明 |
|------|----------|----------|------|
| 测试案例 | `id` | `testId` | 业务主键 |
| 测试分组 | `id` | `groupId` | 业务主键 |
| 环境 | `id` | `envId` | 业务主键 |
| 工作流 | `id` | `workflowId` | 业务主键 |
| 租户 | `id` | `tenantId` | 业务主键 |
| 项目 | `id` | `projectId` | 业务主键 |

**前端适配**: 前端需要做字段映射

```typescript
// 前端映射示例
interface FrontendTestCase {
  id: string;        // 映射自后端 testId
  folderId: string;  // 映射自后端 groupId
  title: string;     // 映射自后端 name
}

function fromBackend(backend: BackendTestCase): FrontendTestCase {
  return {
    id: backend.testId,
    folderId: backend.groupId,
    title: backend.name,
    // ...
  };
}
```

### 2.3 URL 路径命名

**规则**: 使用 kebab-case (小写短横线分隔)

```
GET  /api/groups                    ✅ 正确
GET  /api/test-tree                 ✅ 正确
POST /api/environments/dev/activate ✅ 正确

GET  /api/testGroups                ❌ 错误 (camelCase)
GET  /api/Test_Groups               ❌ 错误 (混合)
```

---

## 三、请求格式

### 3.1 GET 请求

**URL 参数使用 camelCase**:

```
GET /api/tests?limit=20&offset=0
GET /api/tests/search?q=login
GET /api/environments?isActive=true
```

### 3.2 POST/PUT 请求

**请求体格式**:

```json
{
  "testId": "test-001",
  "name": "登录测试",
  "type": "http",
  "groupId": "group-001",
  "http": {
    "method": "POST",
    "url": "{{baseUrl}}/login",
    "headers": {
      "Content-Type": "application/json"
    },
    "body": {
      "username": "test"
    }
  }
}
```

### 3.3 DELETE 请求

**无请求体，资源 ID 在 URL 路径中**:

```
DELETE /api/tests/test-001
DELETE /api/groups/group-001
DELETE /api/environments/dev
```

---

## 四、响应格式

### 4.1 列表响应 (分页)

**标准格式**:

```json
{
  "data": [
    { "testId": "test-001", "name": "测试1" },
    { "testId": "test-002", "name": "测试2" }
  ],
  "total": 100,
  "limit": 20,
  "offset": 0
}
```

**字段说明**:

| 字段 | 类型 | 说明 |
|------|------|------|
| `data` | Array | 数据列表 |
| `total` | Integer | 符合条件的总记录数 |
| `limit` | Integer | 每页记录数 |
| `offset` | Integer | 偏移量 (从 0 开始) |

**前端分页计算**:

```typescript
const currentPage = Math.floor(offset / limit) + 1;
const totalPages = Math.ceil(total / limit);
```

### 4.2 单个资源响应

**直接返回对象**:

```json
{
  "testId": "test-001",
  "name": "登录测试",
  "type": "http",
  "groupId": "group-001",
  "createdAt": "2025-11-23T10:00:00Z",
  "updatedAt": "2025-11-23T10:00:00Z"
}
```

### 4.3 创建成功响应 (201)

```json
{
  "id": 1,
  "testId": "test-001",
  "name": "登录测试",
  "createdAt": "2025-11-23T10:00:00Z"
}
```

### 4.4 删除成功响应 (200)

```json
{
  "message": "test case deleted"
}
```

或

```json
{
  "message": "resource deleted successfully"
}
```

---

## 五、分页规范

### 5.1 分页参数

| 参数 | 类型 | 默认值 | 最大值 | 说明 |
|------|------|--------|--------|------|
| `limit` | Integer | 20 | 100 | 每页记录数 |
| `offset` | Integer | 0 | - | 偏移量 |

### 5.2 使用示例

```
# 第一页 (20条)
GET /api/tests?limit=20&offset=0

# 第二页
GET /api/tests?limit=20&offset=20

# 第三页
GET /api/tests?limit=20&offset=40

# 自定义每页数量
GET /api/tests?limit=50&offset=0
```

### 5.3 前端封装建议

```typescript
interface PaginationParams {
  page: number;     // 从 1 开始
  pageSize: number;
}

interface ApiPagination {
  limit: number;
  offset: number;
}

function toApiPagination(params: PaginationParams): ApiPagination {
  return {
    limit: params.pageSize,
    offset: (params.page - 1) * params.pageSize,
  };
}

function fromApiResponse<T>(response: { data: T[], total: number, limit: number, offset: number }) {
  return {
    items: response.data,
    total: response.total,
    page: Math.floor(response.offset / response.limit) + 1,
    pageSize: response.limit,
    totalPages: Math.ceil(response.total / response.limit),
  };
}
```

---

## 六、错误码规范

### 6.1 HTTP 状态码

| 状态码 | 含义 | 使用场景 |
|--------|------|----------|
| 200 | OK | GET/PUT/DELETE 成功 |
| 201 | Created | POST 创建成功 |
| 400 | Bad Request | 请求参数验证失败 |
| 404 | Not Found | 资源不存在 |
| 409 | Conflict | 资源冲突 (重复创建、业务规则冲突) |
| 500 | Internal Server Error | 服务器内部错误 |

### 6.2 错误响应格式

**标准格式**:

```json
{
  "error": "错误描述信息"
}
```

**验证错误详情** (400):

```json
{
  "error": "Key: 'CreateTestGroupRequest.GroupID' Error:Field validation for 'GroupID' failed on the 'required' tag\nKey: 'CreateTestGroupRequest.Name' Error:Field validation for 'Name' failed on the 'required' tag"
}
```

### 6.3 错误码分类

| 错误类型 | HTTP 状态码 | error 字段示例 |
|----------|-------------|----------------|
| 资源不存在 | 404 | `"test case not found"` |
| 重复创建 | 409 | `"resource already exists"` |
| 业务规则冲突 | 409 | `"cannot delete active environment"` |
| 参数验证失败 | 400 | `"Field validation for 'Name' failed"` |
| 服务器错误 | 500 | `"internal server error"` |

### 6.4 前端错误处理建议

```typescript
interface ApiError {
  error: string;
  statusCode: number;
}

async function handleApiError(response: Response): Promise<never> {
  const body = await response.json();
  const error: ApiError = {
    error: body.error || 'Unknown error',
    statusCode: response.status,
  };

  switch (response.status) {
    case 400:
      throw new ValidationError(error.error);
    case 404:
      throw new NotFoundError(error.error);
    case 409:
      throw new ConflictError(error.error);
    case 500:
      throw new ServerError(error.error);
    default:
      throw new UnknownError(error.error);
  }
}
```

---

## 七、时间格式

### 7.1 时间字段

**格式**: ISO 8601 (带时区)

```json
{
  "createdAt": "2025-11-23T10:00:00Z",
  "updatedAt": "2025-11-23T10:00:00+08:00",
  "deletedAt": null
}
```

### 7.2 前端处理

```typescript
// 解析后端时间
const createdAt = new Date(response.createdAt);

// 格式化显示
const formatted = createdAt.toLocaleString('zh-CN', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
});
```

---

## 八、数据类型映射

### 8.1 前后端类型对照

| 后端 Go 类型 | JSON 类型 | 前端 TypeScript 类型 |
|--------------|-----------|----------------------|
| `string` | string | `string` |
| `int`, `int64` | number | `number` |
| `float64` | number | `number` |
| `bool` | boolean | `boolean` |
| `time.Time` | string (ISO 8601) | `string` (解析为 `Date`) |
| `JSONB` | object | `Record<string, any>` |
| `JSONArray` | array | `any[]` |
| `*time.Time` (nullable) | string \| null | `string \| null` |

### 8.2 枚举值映射

**测试优先级**:

| 后端值 | 前端 enum | 说明 |
|--------|-----------|------|
| `"P0"` | `Priority.CRITICAL` | 关键 |
| `"P1"` | `Priority.HIGH` | 高 |
| `"P2"` | `Priority.MEDIUM` | 中 |
| `""` | `Priority.LOW` | 低 (默认) |

**测试状态**:

| 后端值 | 前端 enum |
|--------|-----------|
| `"active"` | `Status.ACTIVE` |
| `"inactive"` | `Status.DEPRECATED` |
| `"draft"` | `Status.DRAFT` |

**执行状态**:

| 后端值 | 前端 enum |
|--------|-----------|
| `"pending"` | `ExecutionStatus.PENDING` |
| `"running"` | `ExecutionStatus.RUNNING` |
| `"passed"` | `ExecutionStatus.PASSED` |
| `"failed"` | `ExecutionStatus.FAILED` |

---

## 九、实体字段映射

### 9.1 TestCase 映射

| 前端字段 | 后端字段 | 类型 | 说明 |
|----------|----------|------|------|
| `id` | `testId` | string | 业务主键 |
| `folderId` | `groupId` | string | 所属分组 |
| `title` | `name` | string | 名称 |
| `description` | `objective` | string | 描述/目标 |
| `priority` | `priority` | enum | 需转换 |
| `status` | `status` | enum | 需转换 |
| `tags` | `tags` | string[] | 标签 |
| `lastUpdated` | `updatedAt` | string | 更新时间 |

### 9.2 TestFolder → TestGroup 映射

| 前端字段 | 后端字段 | 类型 |
|----------|----------|------|
| `id` | `groupId` | string |
| `name` | `name` | string |
| `parentId` | `parentId` | string \| null |
| `type` | - | 前端专用 |

### 9.3 Environment 映射

| 前端字段 | 后端字段 | 类型 |
|----------|----------|------|
| `id` | `envId` | string |
| `name` | `name` | string |
| `variables` | `variables` | EnvironmentVariable[] → Record |
| `color` | - | 前端专用 |

**变量格式转换**:

```typescript
// 前端格式
interface FrontendEnv {
  variables: { key: string; value: string; isSecret: boolean }[];
}

// 后端格式
interface BackendEnv {
  variables: Record<string, any>;
}

// 转换函数
function toBackendVariables(vars: FrontendEnv['variables']): Record<string, any> {
  const result: Record<string, any> = {};
  vars.forEach(v => result[v.key] = v.value);
  return result;
}

function fromBackendVariables(vars: Record<string, any>): FrontendEnv['variables'] {
  return Object.entries(vars).map(([key, value]) => ({
    key,
    value: String(value),
    isSecret: key.toLowerCase().includes('secret') || key.toLowerCase().includes('password'),
  }));
}
```

---

## 十、WebSocket 通信规范

### 10.1 连接

```typescript
const ws = new WebSocket('ws://localhost:8090/api/workflows/runs/{runId}/stream');
```

### 10.2 消息格式

```json
{
  "runId": "run-abc-123",
  "type": "step_start|step_complete|step_log|variable_change",
  "payload": { /* 具体数据 */ }
}
```

### 10.3 消息类型

| type | 说明 | payload 结构 |
|------|------|--------------|
| `step_start` | 步骤开始 | `{ stepId, stepName }` |
| `step_complete` | 步骤完成 | `{ stepId, stepName, status, duration }` |
| `step_log` | 步骤日志 | `{ stepId, level, message, timestamp }` |
| `variable_change` | 变量变更 | `{ stepId, varName, oldValue, newValue, changeType }` |

### 10.4 心跳

- 服务器每 54 秒发送 Ping
- 客户端需响应 Pong
- 60 秒无响应断开连接

---

## 十一、Header 规范

### 11.1 请求头

```http
Content-Type: application/json
Accept: application/json
X-Tenant-ID: tenant-001       # 多租户标识 (可选)
X-Project-ID: project-001     # 项目标识 (可选)
Authorization: Bearer <token>  # 认证令牌 (未来)
```

### 11.2 响应头

```http
Content-Type: application/json
X-Request-ID: uuid-xxx        # 请求追踪 ID
```

---

## 十二、API 端点汇总

### v1 API (`/api/`)

| 模块 | 端点 | 方法 |
|------|------|------|
| Tests | `/tests` | GET, POST |
| | `/tests/:id` | GET, PUT, DELETE |
| | `/tests/:id/execute` | POST |
| | `/tests/search` | GET |
| Groups | `/groups` | GET, POST |
| | `/groups/:id` | GET, PUT, DELETE |
| | `/groups/tree` | GET |
| Environments | `/environments` | GET, POST |
| | `/environments/:id` | GET, PUT, DELETE |
| | `/environments/active` | GET |
| | `/environments/:id/activate` | POST |
| Workflows | `/workflows` | GET, POST |
| | `/workflows/:id` | GET, PUT, DELETE |
| | `/workflows/:id/execute` | POST |
| | `/workflows/runs/:runId` | GET |
| | `/workflows/runs/:runId/stream` | WS |

### v2 API (`/api/v2/`)

| 模块 | 端点 | 方法 |
|------|------|------|
| Tenants | `/tenants` | GET, POST |
| | `/tenants/:id` | GET, PUT, DELETE |
| | `/tenants/:id/suspend` | POST |
| | `/tenants/:id/activate` | POST |
| | `/tenants/:id/projects` | GET |
| Projects | `/projects` | GET, POST |
| | `/projects/:id` | GET, PUT, DELETE |
| | `/projects/:id/archive` | POST |
| | `/projects/:id/activate` | POST |

---

**更新日期**: 2025-11-23
**维护人**: Development Team
