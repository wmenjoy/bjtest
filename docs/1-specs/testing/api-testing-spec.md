# API测试规范

**版本**: 1.0
**最后更新**: 2025-11-27
**维护者**: 测试团队
**状态**: Approved

---

## 概述

本文档定义了测试管理平台中API测试的技术规范，包括断言类型、断言操作符、HTTP方法使用规范和请求头标准设置。

### 适用范围

- HTTP类型测试用例
- Workflow中的HTTP步骤
- 生命周期钩子（Setup/Teardown Hooks）中的HTTP操作

---

## 断言类型定义

API测试支持以下断言类型，用于验证HTTP响应的不同方面。

### 1. status_code（状态码断言）

**用途**: 验证HTTP响应状态码

**支持的操作符**:
- `equals` (默认) - 精确匹配
- `in` - 状态码在指定列表中

**字段说明**:
| 字段 | 类型 | 必填 | 说明 |
|-----|------|------|------|
| `type` | string | ✅ | 固定值：`"status_code"` |
| `expected` | number \| array | ✅ | 期望的状态码或状态码数组 |
| `operator` | string | ❌ | 操作符，默认 `"equals"` |

**示例**:

```json
// 精确匹配
{
  "type": "status_code",
  "expected": 200
}

// 匹配多个可能的状态码
{
  "type": "status_code",
  "expected": [200, 201, 204],
  "operator": "in"
}
```

**实现逻辑**:
```go
// 源代码位置: backend/internal/testcase/executor.go:437-460
func checkStatusCode(assertion Assertion, actualCode int) bool {
    if assertion.Operator == "in" {
        // 检查状态码是否在数组中
        if arr, ok := assertion.Expected.([]interface{}); ok {
            for _, v := range arr {
                if code, ok := v.(float64); ok && int(code) == actualCode {
                    return true
                }
            }
            return false
        }
    }

    // 精确匹配
    if expected, ok := assertion.Expected.(float64); ok {
        return int(expected) == actualCode
    }
    return false
}
```

### 2. json_path（JSON路径断言）

**用途**: 使用JSONPath表达式验证响应体中的字段值

**支持的操作符**:
- `equals` (默认) - 精确匹配
- `exists` - 字段存在性检查

**字段说明**:
| 字段 | 类型 | 必填 | 说明 |
|-----|------|------|------|
| `type` | string | ✅ | 固定值：`"json_path"` |
| `path` | string | ✅ | JSONPath表达式（`$.field.nested`） |
| `expected` | any | ⚠️ | 期望值（`exists`操作符时可选） |
| `operator` | string | ❌ | 操作符，默认 `"equals"` |

**JSONPath语法支持**:
- 根节点：`$`
- 字段访问：`$.field` 或 `$.field.nested`
- 当前实现：支持点号分隔的嵌套路径（不支持数组索引）

**示例**:

```json
// 检查字段是否存在
{
  "type": "json_path",
  "path": "$.data.token",
  "operator": "exists"
}

// 精确匹配字段值
{
  "type": "json_path",
  "path": "$.code",
  "expected": 0
}

// 嵌套字段匹配
{
  "type": "json_path",
  "path": "$.data.user.name",
  "expected": "testuser"
}
```

**实现逻辑**:
```go
// 源代码位置: backend/internal/testcase/executor.go:463-506
func checkJSONPath(assertion Assertion, body map[string]interface{}, result *TestResult) bool {
    path := strings.TrimPrefix(assertion.Path, "$.")

    var value interface{}
    if strings.Contains(path, ".") {
        // 嵌套路径
        parts := strings.Split(path, ".")
        current := body
        for i, part := range parts {
            if i == len(parts)-1 {
                value = current[part]
            } else {
                if next, ok := current[part].(map[string]interface{}); ok {
                    current = next
                } else {
                    return false // 路径不存在
                }
            }
        }
    } else {
        value = body[path]
    }

    if assertion.Operator == "exists" {
        return value != nil
    }

    // 精确匹配
    return value == assertion.Expected
}
```

### 3. response_time（响应时间断言）

**用途**: 验证API响应时间是否在可接受范围内

**状态**: ⚠️ 规划中（当前版本未实现）

**计划字段**:
| 字段 | 类型 | 必填 | 说明 |
|-----|------|------|------|
| `type` | string | ✅ | 固定值：`"response_time"` |
| `expected` | number | ✅ | 期望的最大响应时间（毫秒） |
| `operator` | string | ❌ | 操作符，默认 `"less_than"` |

**计划示例**:
```json
{
  "type": "response_time",
  "expected": 1000,
  "operator": "less_than"
}
```

### 4. header（响应头断言）

**用途**: 验证HTTP响应头中的字段

**状态**: ⚠️ 规划中（当前版本未实现）

**计划字段**:
| 字段 | 类型 | 必填 | 说明 |
|-----|------|------|------|
| `type` | string | ✅ | 固定值：`"header"` |
| `path` | string | ✅ | 响应头名称（如 `Content-Type`） |
| `expected` | string | ✅ | 期望的响应头值 |
| `operator` | string | ❌ | 操作符，默认 `"equals"` |

**计划示例**:
```json
{
  "type": "header",
  "path": "Content-Type",
  "expected": "application/json",
  "operator": "contains"
}
```

---

## 断言操作符规范

### 1. equals（精确匹配）

**适用断言类型**: `status_code`, `json_path`, `header`

**行为**: 验证实际值与期望值完全相等

**类型匹配规则**:
- 数字比较：支持 `int` 和 `float64` 自动转换
- 字符串比较：严格区分大小写
- 布尔值比较：`true` 和 `false`
- 对象/数组：暂不支持深度比较

**示例**:
```json
{
  "type": "json_path",
  "path": "$.status",
  "expected": "active",
  "operator": "equals"  // 可省略，默认就是equals
}
```

### 2. in（包含于列表）

**适用断言类型**: `status_code`

**行为**: 验证实际值在期望值列表中

**示例**:
```json
{
  "type": "status_code",
  "expected": [200, 201, 204],
  "operator": "in"
}
```

### 3. exists（存在性检查）

**适用断言类型**: `json_path`, `header`

**行为**: 仅验证字段是否存在，不检查具体值

**返回条件**:
- ✅ 字段存在且值不为 `null`
- ❌ 字段不存在或值为 `null`

**示例**:
```json
{
  "type": "json_path",
  "path": "$.data.token",
  "operator": "exists"
}
```

### 4. contains（字符串包含）

**适用断言类型**: `json_path`, `header`, `stdout_contains` (命令测试)

**行为**: 验证实际值（字符串）包含期望值

**示例**:
```json
{
  "type": "json_path",
  "path": "$.message",
  "expected": "success",
  "operator": "contains"
}
```

### 5. less_than（小于）

**适用断言类型**: `response_time`, `json_path` (数值字段)

**行为**: 验证实际值小于期望值

**状态**: ⚠️ 规划中

**示例**:
```json
{
  "type": "response_time",
  "expected": 1000,
  "operator": "less_than"
}
```

### 6. greater_than（大于）

**适用断言类型**: `json_path` (数值字段)

**状态**: ⚠️ 规划中

**示例**:
```json
{
  "type": "json_path",
  "path": "$.data.count",
  "expected": 0,
  "operator": "greater_than"
}
```

### 7. regex（正则表达式匹配）

**适用断言类型**: `json_path`, `header`

**状态**: ⚠️ 规划中

**示例**:
```json
{
  "type": "json_path",
  "path": "$.data.email",
  "expected": "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
  "operator": "regex"
}
```

---

## HTTP方法使用规范

### 支持的HTTP方法

| 方法 | 用途 | 幂等性 | 安全性 | 请求体 |
|-----|------|--------|--------|--------|
| `GET` | 获取资源 | ✅ 是 | ✅ 安全 | ❌ 不应有 |
| `POST` | 创建资源 | ❌ 否 | ❌ 不安全 | ✅ 可选 |
| `PUT` | 更新资源（全量） | ✅ 是 | ❌ 不安全 | ✅ 必须 |
| `PATCH` | 更新资源（部分） | ❌ 否 | ❌ 不安全 | ✅ 必须 |
| `DELETE` | 删除资源 | ✅ 是 | ❌ 不安全 | ❌ 不应有 |
| `HEAD` | 获取响应头 | ✅ 是 | ✅ 安全 | ❌ 不应有 |
| `OPTIONS` | 获取支持的方法 | ✅ 是 | ✅ 安全 | ❌ 不应有 |

### 方法使用示例

#### GET - 获取资源

```json
{
  "testId": "get-user-profile",
  "name": "获取用户信息",
  "type": "http",
  "http": {
    "method": "GET",
    "path": "/api/v2/users/123",
    "headers": {
      "Content-Type": "application/json",
      "Authorization": "Bearer {{ACCESS_TOKEN}}"
    }
  },
  "assertions": [
    {
      "type": "status_code",
      "expected": 200
    },
    {
      "type": "json_path",
      "path": "$.data.id",
      "expected": "123"
    }
  ]
}
```

#### POST - 创建资源

```json
{
  "testId": "create-test-case",
  "name": "创建测试用例",
  "type": "http",
  "http": {
    "method": "POST",
    "path": "/api/v2/test-cases",
    "headers": {
      "Content-Type": "application/json"
    },
    "body": {
      "testId": "test-001",
      "name": "测试用例1",
      "type": "http",
      "groupId": "group-001"
    }
  },
  "assertions": [
    {
      "type": "status_code",
      "expected": [200, 201],
      "operator": "in"
    },
    {
      "type": "json_path",
      "path": "$.data.testId",
      "expected": "test-001"
    }
  ]
}
```

#### PUT - 全量更新资源

```json
{
  "testId": "update-test-case",
  "name": "更新测试用例",
  "type": "http",
  "http": {
    "method": "PUT",
    "path": "/api/v2/test-cases/test-001",
    "headers": {
      "Content-Type": "application/json"
    },
    "body": {
      "testId": "test-001",
      "name": "测试用例1（已更新）",
      "type": "http",
      "groupId": "group-001",
      "priority": "P0"
    }
  },
  "assertions": [
    {
      "type": "status_code",
      "expected": 200
    }
  ]
}
```

#### DELETE - 删除资源

```json
{
  "testId": "delete-test-case",
  "name": "删除测试用例",
  "type": "http",
  "http": {
    "method": "DELETE",
    "path": "/api/v2/test-cases/test-001",
    "headers": {
      "Content-Type": "application/json"
    }
  },
  "assertions": [
    {
      "type": "status_code",
      "expected": [200, 204],
      "operator": "in"
    }
  ]
}
```

### 方法选择指南

**何时使用GET**:
- 查询单个资源
- 查询资源列表
- 搜索和过滤操作
- 分页查询

**何时使用POST**:
- 创建新资源
- 触发操作（如执行测试、启动工作流）
- 复杂查询（请求体包含查询条件）

**何时使用PUT**:
- 完全替换现有资源
- 需要提供资源的所有字段

**何时使用PATCH**:
- 部分更新资源
- 只修改特定字段

**何时使用DELETE**:
- 删除资源（支持软删除）

---

## 请求头标准设置

### 必需请求头

#### Content-Type

**用途**: 指定请求体的媒体类型

**常用值**:
| 值 | 用途 |
|----|------|
| `application/json` | JSON格式请求体（推荐） |
| `application/x-www-form-urlencoded` | 表单数据 |
| `multipart/form-data` | 文件上传 |
| `text/plain` | 纯文本 |

**示例**:
```json
{
  "headers": {
    "Content-Type": "application/json"
  }
}
```

#### Accept

**用途**: 指定客户端期望的响应类型

**常用值**:
- `application/json` - 期望JSON响应
- `text/html` - 期望HTML响应
- `*/*` - 接受任意类型

**示例**:
```json
{
  "headers": {
    "Content-Type": "application/json",
    "Accept": "application/json"
  }
}
```

### 认证请求头

#### Authorization

**用途**: 携带认证凭证

**格式**:
- Bearer Token: `Bearer <token>`
- Basic Auth: `Basic <base64(username:password)>`
- API Key: `ApiKey <key>`

**示例**:
```json
{
  "headers": {
    "Content-Type": "application/json",
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**使用环境变量**:
```json
{
  "headers": {
    "Authorization": "Bearer {{ACCESS_TOKEN}}"
  }
}
```

### 可选请求头

#### User-Agent

**用途**: 标识客户端应用

**示例**:
```json
{
  "headers": {
    "User-Agent": "TestPlatform/1.0 (Automated Testing)"
  }
}
```

#### X-Request-ID

**用途**: 请求追踪ID，用于日志关联

**示例**:
```json
{
  "headers": {
    "X-Request-ID": "{{REQUEST_ID}}"
  }
}
```

#### X-Tenant-ID / X-Project-ID

**用途**: 多租户隔离标识

**示例**:
```json
{
  "headers": {
    "X-Tenant-ID": "{{TENANT_ID}}",
    "X-Project-ID": "{{PROJECT_ID}}"
  }
}
```

### 自定义请求头

**命名规范**: 使用 `X-` 前缀表示自定义头

**示例**:
```json
{
  "headers": {
    "X-Test-Environment": "staging",
    "X-Feature-Flag": "new-ui-enabled"
  }
}
```

---

## URL配置规范

### URL vs Path

测试用例支持两种URL配置方式：

#### 1. 使用 path（相对路径）

**适用场景**: 大部分测试，使用全局baseURL

**配置**:
```json
{
  "http": {
    "method": "GET",
    "path": "/api/v2/test-cases",
    "headers": {}
  }
}
```

**最终URL**: `{baseURL}/api/v2/test-cases`

**baseURL来源**:
- 配置文件 `config.toml` → `[test].target_host`
- 环境变量 `TARGET_HOST`

#### 2. 使用 url（绝对路径）

**适用场景**: 测试外部API、跨域测试

**配置**:
```json
{
  "http": {
    "method": "GET",
    "url": "https://api.external.com/v1/users",
    "headers": {}
  }
}
```

**最终URL**: 直接使用提供的完整URL

**优先级**: `url` > `path`

### 查询参数

**方法1: 内嵌在path/url中**
```json
{
  "http": {
    "method": "GET",
    "path": "/api/v2/test-cases?page=1&pageSize=20&status=active"
  }
}
```

**方法2: 使用变量替换**
```json
{
  "http": {
    "method": "GET",
    "path": "/api/v2/test-cases?page={{PAGE}}&pageSize={{PAGE_SIZE}}"
  }
}
```

---

## 请求体规范

### JSON请求体

**最常用格式，推荐使用**

**示例**:
```json
{
  "http": {
    "method": "POST",
    "path": "/api/v2/test-cases",
    "headers": {
      "Content-Type": "application/json"
    },
    "body": {
      "testId": "test-001",
      "name": "测试用例",
      "type": "http",
      "groupId": "group-001",
      "priority": "P0",
      "http": {
        "method": "GET",
        "path": "/api/health"
      },
      "assertions": [
        {
          "type": "status_code",
          "expected": 200
        }
      ]
    }
  }
}
```

### 嵌套对象

**支持任意层级嵌套**

**示例**:
```json
{
  "body": {
    "user": {
      "profile": {
        "name": "Test User",
        "email": "test@example.com",
        "address": {
          "city": "Beijing",
          "country": "China"
        }
      },
      "preferences": {
        "language": "zh-CN",
        "timezone": "Asia/Shanghai"
      }
    }
  }
}
```

### 数组

**支持数组类型字段**

**示例**:
```json
{
  "body": {
    "tags": ["api", "integration", "P0"],
    "testIds": ["test-001", "test-002", "test-003"],
    "assertions": [
      {
        "type": "status_code",
        "expected": 200
      },
      {
        "type": "json_path",
        "path": "$.data",
        "operator": "exists"
      }
    ]
  }
}
```

### 变量替换

**在请求体中使用环境变量**

**语法**: `{{VARIABLE_NAME}}`

**示例**:
```json
{
  "body": {
    "username": "{{TEST_USER}}",
    "password": "{{TEST_PASSWORD}}",
    "tenantId": "{{TENANT_ID}}"
  }
}
```

---

## 响应验证规范

### 完整验证示例

```json
{
  "testId": "comprehensive-api-test",
  "name": "综合API测试示例",
  "type": "http",
  "http": {
    "method": "POST",
    "path": "/api/v2/test-cases",
    "headers": {
      "Content-Type": "application/json",
      "Authorization": "Bearer {{ACCESS_TOKEN}}"
    },
    "body": {
      "testId": "test-001",
      "name": "测试用例1",
      "type": "http"
    }
  },
  "assertions": [
    {
      "type": "status_code",
      "expected": 201,
      "operator": "equals"
    },
    {
      "type": "json_path",
      "path": "$.code",
      "expected": 0
    },
    {
      "type": "json_path",
      "path": "$.message",
      "operator": "exists"
    },
    {
      "type": "json_path",
      "path": "$.data",
      "operator": "exists"
    },
    {
      "type": "json_path",
      "path": "$.data.testId",
      "expected": "test-001"
    },
    {
      "type": "json_path",
      "path": "$.data.id",
      "operator": "exists"
    }
  ]
}
```

### 多状态码处理

**场景**: API可能返回多个成功状态码

```json
{
  "assertions": [
    {
      "type": "status_code",
      "expected": [200, 201, 204],
      "operator": "in"
    }
  ]
}
```

### 嵌套字段验证

**验证深层嵌套字段**

```json
{
  "assertions": [
    {
      "type": "json_path",
      "path": "$.data.user.profile.email",
      "expected": "test@example.com"
    },
    {
      "type": "json_path",
      "path": "$.data.metadata.created_at",
      "operator": "exists"
    }
  ]
}
```

---

## 错误处理规范

### HTTP错误状态码

| 状态码 | 含义 | 典型场景 |
|--------|------|----------|
| 400 | Bad Request | 请求参数错误、验证失败 |
| 401 | Unauthorized | 未认证、Token过期 |
| 403 | Forbidden | 无权限访问 |
| 404 | Not Found | 资源不存在 |
| 409 | Conflict | 资源冲突（如重复ID） |
| 422 | Unprocessable Entity | 语义错误（如业务规则验证失败） |
| 429 | Too Many Requests | 请求限流 |
| 500 | Internal Server Error | 服务器内部错误 |
| 502 | Bad Gateway | 网关错误 |
| 503 | Service Unavailable | 服务不可用 |

### 错误响应测试

**测试404场景**:
```json
{
  "testId": "test-404-not-found",
  "name": "测试资源不存在",
  "type": "http",
  "http": {
    "method": "GET",
    "path": "/api/v2/test-cases/non-existent-id"
  },
  "assertions": [
    {
      "type": "status_code",
      "expected": 404
    },
    {
      "type": "json_path",
      "path": "$.code",
      "expected": 404
    },
    {
      "type": "json_path",
      "path": "$.message",
      "operator": "exists"
    }
  ]
}
```

**测试400场景**:
```json
{
  "testId": "test-400-bad-request",
  "name": "测试请求参数错误",
  "type": "http",
  "http": {
    "method": "POST",
    "path": "/api/v2/test-cases",
    "headers": {
      "Content-Type": "application/json"
    },
    "body": {
      "testId": "",
      "name": ""
    }
  },
  "assertions": [
    {
      "type": "status_code",
      "expected": 400
    },
    {
      "type": "json_path",
      "path": "$.error",
      "operator": "exists"
    }
  ]
}
```

---

## 超时配置

### 测试级别超时

**默认值**: 300秒（5分钟）

**配置位置**: 测试用例的 `timeout` 字段

**示例**:
```json
{
  "testId": "long-running-test",
  "name": "长时间运行的测试",
  "type": "http",
  "timeout": 600,
  "http": {
    "method": "POST",
    "path": "/api/v2/workflows/execute"
  }
}
```

### HTTP客户端超时

**默认值**: 30秒

**配置位置**: `backend/internal/testcase/executor.go:89`

**代码**:
```go
client: &http.Client{
    Timeout: 30 * time.Second,
}
```

### 超时测试示例

**验证API在规定时间内响应**:
```json
{
  "testId": "test-response-time",
  "name": "测试响应时间",
  "type": "http",
  "timeout": 5,
  "http": {
    "method": "GET",
    "path": "/api/v2/test-cases"
  },
  "assertions": [
    {
      "type": "status_code",
      "expected": 200
    }
  ]
}
```

---

## 最佳实践

### 1. 断言设计原则

**最小化断言**: 只验证必要的字段
```json
// ✅ 好的做法
{
  "assertions": [
    {
      "type": "status_code",
      "expected": 200
    },
    {
      "type": "json_path",
      "path": "$.data.id",
      "operator": "exists"
    }
  ]
}

// ❌ 不好的做法（过度验证）
{
  "assertions": [
    {
      "type": "json_path",
      "path": "$.data.createdAt",
      "expected": "2025-11-27T10:00:00Z"
    }
  ]
}
```

**分层验证**: 从粗到细
```json
{
  "assertions": [
    // 1. 验证HTTP状态码
    {
      "type": "status_code",
      "expected": 200
    },
    // 2. 验证响应结构
    {
      "type": "json_path",
      "path": "$.data",
      "operator": "exists"
    },
    // 3. 验证关键字段
    {
      "type": "json_path",
      "path": "$.data.testId",
      "expected": "test-001"
    }
  ]
}
```

### 2. 请求头管理

**使用环境变量存储敏感信息**:
```json
{
  "headers": {
    "Authorization": "Bearer {{ACCESS_TOKEN}}",
    "X-API-Key": "{{API_KEY}}"
  }
}
```

**标准化请求头**:
```json
{
  "headers": {
    "Content-Type": "application/json",
    "Accept": "application/json",
    "User-Agent": "TestPlatform/1.0",
    "X-Request-ID": "{{REQUEST_ID}}"
  }
}
```

### 3. 测试数据管理

**使用变量避免硬编码**:
```json
{
  "body": {
    "username": "{{TEST_USER}}",
    "email": "{{TEST_EMAIL}}",
    "tenantId": "{{TENANT_ID}}"
  }
}
```

**唯一ID生成**: 使用时间戳或UUID避免冲突
```json
{
  "body": {
    "testId": "test-{{TIMESTAMP}}",
    "name": "Test Case {{UUID}}"
  }
}
```

### 4. 错误场景覆盖

**正常场景 + 边界场景 + 异常场景**:
```
✅ 创建测试用例（200）
✅ 创建重复ID测试用例（409）
✅ 创建空testId测试用例（400）
✅ 创建超长name测试用例（400）
✅ 未认证创建测试用例（401）
```

---

## 代码参考

### 源代码文件

| 文件 | 功能 | 行数 |
|-----|------|------|
| `backend/internal/testcase/executor.go` | HTTP测试执行器 | 389-506 |
| `backend/internal/testcase/types.go` | 测试类型定义 | 1-75 |
| `backend/internal/models/test_case.go` | 测试用例模型 | 12-83 |

### 关键函数

**HTTP测试执行**:
```go
// 位置: executor.go:161-240
func (e *UnifiedTestExecutor) executeHTTP(tc *TestCase, result *TestResult)
```

**HTTP断言处理**:
```go
// 位置: executor.go:389-405
func (e *UnifiedTestExecutor) runHTTPAssertions(
    assertions []Assertion,
    statusCode int,
    body map[string]interface{},
    result *TestResult
)
```

**状态码断言**:
```go
// 位置: executor.go:437-460
func (e *UnifiedTestExecutor) checkStatusCode(assertion Assertion, actualCode int) bool
```

**JSONPath断言**:
```go
// 位置: executor.go:463-506
func (e *UnifiedTestExecutor) checkJSONPath(
    assertion Assertion,
    body map[string]interface{},
    result *TestResult
) bool
```

---

## 相关文档

### 测试规范
- [测试用例格式规范](./test-case-format.md) - 完整的测试用例JSON格式
- [测试文档化指南](../../3-guides/testing/test-documentation-guide.md) - 测试文档编写指南

### 架构设计
- [后端分层架构](../architecture/backend-layered-design.md) - 三层架构详细说明
- [系统架构概览](../architecture/overview.md) - 整体架构设计

### 开发指南
- [命名规范](../../3-guides/development/naming-conventions.md) - 代码命名规范

---

**审核历史**:
- 2025-11-27: 初始版本 - 测试团队
- 基于 `executor.go` 和 `types.go` 实际实现编写

**维护计划**:
- 新增断言类型时同步更新
- 每季度审查断言覆盖率
- 收集测试团队反馈持续优化
