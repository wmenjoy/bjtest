# HTTP Status Code Specification

本文档定义了nextest-platform所有API端点应该返回的HTTP状态码规范。

## 目的

- 为后端开发提供明确的状态码标准
- 为测试用例提供断言依据
- 确保API符合RESTful最佳实践
- 提升API的可预测性和易用性

## 状态码分类

### 2xx 成功状态码

| 状态码 | 说明 | 使用场景 |
|--------|------|----------|
| 200 OK | 请求成功 | GET、PUT、DELETE成功 |
| 201 Created | 资源创建成功 | POST创建资源成功 |
| 204 No Content | 请求成功但无返回内容 | DELETE成功（可选） |

### 4xx 客户端错误

| 状态码 | 说明 | 使用场景 |
|--------|------|----------|
| 400 Bad Request | 请求参数错误 | 缺少必填字段、字段类型错误、JSON格式错误 |
| 404 Not Found | 资源不存在 | GET/PUT/DELETE不存在的资源ID、执行不存在的workflow |
| 409 Conflict | 资源冲突 | 创建已存在的资源(UNIQUE约束)、违反业务规则 |
| 422 Unprocessable Entity | 语义错误 | 请求格式正确但业务逻辑不允许(可选，可用409替代) |

### 5xx 服务器错误

| 状态码 | 说明 | 使用场景 |
|--------|------|----------|
| 500 Internal Server Error | 服务器内部错误 | 数据库连接失败、未处理的panic、代码bug |

**重要原则：5xx错误应该只用于服务器内部错误，不应该用于业务逻辑错误（如资源不存在、业务规则冲突）**

## 详细场景规范

### 1. 资源查询 (GET)

| 场景 | HTTP方法 | 路径示例 | 应返回状态码 |
|------|----------|----------|--------------|
| 查询成功 | GET | `/api/tests/{id}` | 200 |
| 资源ID不存在 | GET | `/api/tests/non-existent-id` | 404 |
| 查询列表成功(空列表也是成功) | GET | `/api/tests` | 200 |
| 路由不存在 | GET | `/api/unknown-endpoint` | 404 (由框架返回) |

### 2. 资源创建 (POST)

| 场景 | HTTP方法 | 路径示例 | 应返回状态码 |
|------|----------|----------|--------------|
| 创建成功 | POST | `/api/groups` | 201 |
| 缺少必填字段 | POST | `/api/groups` (无groupId) | 400 |
| JSON格式错误 | POST | `/api/groups` (invalid JSON) | 400 |
| 字段类型错误 | POST | `/api/groups` (groupId为数字) | 400 |
| 资源ID已存在(UNIQUE) | POST | `/api/groups` (重复groupId) | 409 |
| 父资源不存在 | POST | `/api/tests` (parentGroupId不存在) | 404 或 400 |

### 3. 资源更新 (PUT)

| 场景 | HTTP方法 | 路径示例 | 应返回状态码 |
|------|----------|----------|--------------|
| 更新成功 | PUT | `/api/tests/{id}` | 200 |
| 资源ID不存在 | PUT | `/api/tests/non-existent-id` | 404 |
| 缺少必填字段 | PUT | `/api/tests/{id}` (无name) | 400 |
| JSON格式错误 | PUT | `/api/tests/{id}` | 400 |

### 4. 资源删除 (DELETE)

| 场景 | HTTP方法 | 路径示例 | 应返回状态码 |
|------|----------|----------|--------------|
| 删除成功 | DELETE | `/api/tests/{id}` | 200 或 204 |
| 资源ID不存在 | DELETE | `/api/tests/non-existent-id` | 404 |
| 有子资源不能删除 | DELETE | `/api/groups/{id}` (有tests) | 409 |
| 资源正在使用不能删除 | DELETE | `/api/environments/{id}` (激活状态) | 409 |

### 5. 资源执行/操作 (POST action)

| 场景 | HTTP方法 | 路径示例 | 应返回状态码 |
|------|----------|----------|--------------|
| 执行成功 | POST | `/api/tests/{id}/execute` | 200 或 201 |
| 资源ID不存在 | POST | `/api/workflows/xxx/execute` | 404 |
| 激活环境成功 | POST | `/api/environments/{id}/activate` | 200 |
| 环境ID不存在 | POST | `/api/environments/xxx/activate` | 404 |

### 6. 特定业务场景

#### 6.1 Test Group Management

| API | 成功 | 失败场景 |
|-----|------|----------|
| POST /api/groups | 201 | 400(缺少字段), 409(ID已存在) |
| GET /api/groups/{id} | 200 | 404(不存在) |
| GET /api/groups/tree | 200 | - |
| PUT /api/groups/{id} | 200 | 404(不存在), 400(参数错误) |
| DELETE /api/groups/{id} | 200 | 404(不存在), 409(有子测试) |
| POST /api/groups/{id}/execute | 200 | 404(不存在) |

#### 6.2 Test Case Management

| API | 成功 | 失败场景 |
|-----|------|----------|
| POST /api/tests | 201 | 400(缺少字段), 409(ID已存在), 404(groupId不存在) |
| GET /api/tests/{id} | 200 | 404(不存在) |
| PUT /api/tests/{id} | 200 | 404(不存在), 400(参数错误) |
| DELETE /api/tests/{id} | 200 | 404(不存在) |
| POST /api/tests/{id}/execute | 200 | 404(不存在) |

#### 6.3 Environment Management

| API | 成功 | 失败场景 |
|-----|------|----------|
| POST /api/environments | 201 | 400(缺少字段), 409(ID已存在) |
| GET /api/environments/{id} | 200 | 404(不存在) |
| PUT /api/environments/{id} | 200 | 404(不存在), 400(参数错误) |
| DELETE /api/environments/{id} | 200 | 404(不存在), 409(是激活状态) |
| POST /api/environments/{id}/activate | 200 | 404(不存在) |
| POST /api/environments/{id}/variables | 201 | 404(envId不存在) |
| DELETE /api/environments/{id}/variables/{key} | 200 | 404(env或key不存在) |

#### 6.4 Workflow Management

| API | 成功 | 失败场景 |
|-----|------|----------|
| POST /api/workflows | 201 | 400(缺少字段), 409(ID已存在) |
| GET /api/workflows/{id} | 200 | 404(不存在) |
| PUT /api/workflows/{id} | 200 | 404(不存在), 400(参数错误) |
| DELETE /api/workflows/{id} | 200 | 404(不存在) |
| POST /api/workflows/{id}/execute | 200/201 | 404(不存在) |
| GET /api/workflows/runs/{runId} | 200 | 404(runId不存在) |
| GET /api/workflows/runs/{runId}/steps | 200 | 404(runId不存在) |
| GET /api/workflows/runs/{runId}/logs | 200 | 404(runId不存在) |

#### 6.5 Results & History

| API | 成功 | 失败场景 |
|-----|------|----------|
| GET /api/results/{id} | 200 | 404(不存在) |
| GET /api/tests/{id}/history | 200 | 404(testId不存在), 200(空列表) |
| GET /api/runs/{id} | 200 | 404(不存在) |

## 错误响应格式

所有错误响应应该返回统一的JSON格式：

```json
{
  "error": "描述性的错误信息",
  "code": "ERROR_CODE",  // 可选，用于客户端程序化处理
  "details": {}          // 可选，额外的错误详情
}
```

### 示例

**404 Not Found:**
```json
{
  "error": "test case not found"
}
```

**400 Bad Request:**
```json
{
  "error": "Key: 'CreateTestGroupRequest.GroupID' Error:Field validation for 'GroupID' failed on the 'required' tag"
}
```

**409 Conflict:**
```json
{
  "error": "cannot delete active environment 'prod'"
}
```

## 常见错误和修正

### ❌ 错误做法

```go
// 资源不存在返回500
if testCase == nil {
    c.JSON(500, gin.H{"error": "test case not found"})
    return
}
```

### ✅ 正确做法

```go
// 资源不存在返回404
if testCase == nil {
    c.JSON(404, gin.H{"error": "test case not found"})
    return
}
```

### ❌ 错误做法

```go
// 业务规则冲突返回500
if env.IsActive {
    c.JSON(500, gin.H{"error": "cannot delete active environment"})
    return
}
```

### ✅ 正确做法

```go
// 业务规则冲突返回409
if env.IsActive {
    c.JSON(409, gin.H{"error": "cannot delete active environment"})
    return
}
```

## 实施建议

1. **渐进式修复**：优先修复P0问题（资源不存在返回500），再处理P1、P2
2. **测试驱动**：先写符合规范的测试，测试失败即表明后端需要修复
3. **文档同步**：API文档必须准确反映状态码规范
4. **代码审查**：在code review时检查状态码是否符合规范

## 参考标准

- [RFC 7231 - HTTP/1.1 Semantics and Content](https://tools.ietf.org/html/rfc7231)
- [RFC 7807 - Problem Details for HTTP APIs](https://tools.ietf.org/html/rfc7807)
- [RESTful API Design Best Practices](https://restfulapi.net/http-status-codes/)

## 版本历史

- v1.0 (2025-11-23): 初始版本，定义核心状态码规范
