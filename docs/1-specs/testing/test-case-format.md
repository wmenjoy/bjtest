# 测试用例格式规范

**版本**: 1.0
**最后更新**: 2025-11-27
**维护者**: QA团队、测试工程师
**状态**: Approved

---

## 概述

本规范定义了测试平台支持的所有测试用例格式标准，包括HTTP、Command、Workflow等类型。所有测试用例必须遵循此规范以确保系统能正确解析和执行。

### 适用范围

- 测试用例的JSON格式定义
- API导入测试用例
- 测试平台UI创建测试用例
- 自动化测试脚本生成

---

## 通用字段规范

所有类型的测试用例都包含以下通用字段：

### 必填字段

| 字段 | 类型 | 说明 | 示例 |
|-----|------|------|------|
| `testId` | string | 唯一标识符（项目内唯一） | `"login-001"` |
| `name` | string | 测试用例名称（描述性） | `"测试用户登录成功"` |
| `type` | string | 测试类型（见下方支持类型） | `"http"` |
| `groupId` | string | 所属测试组ID | `"api-auth"` |

### 可选字段

| 字段 | 类型 | 默认值 | 说明 |
|-----|------|-------|------|
| `tenantId` | string | `"default"` | 租户ID（多租户隔离） |
| `projectId` | string | `"default"` | 项目ID |
| `priority` | string | `"P2"` | 优先级（P0/P1/P2） |
| `status` | string | `"active"` | 状态（active/inactive） |
| `objective` | string | - | 测试目的描述 |
| `timeout` | number | `300` | 超时时间（秒） |
| `tags` | array | `[]` | 标签列表 |
| `assertions` | array | `[]` | 断言列表 |
| `preconditions` | array | `[]` | 前置条件 |
| `setupHooks` | array | `[]` | 执行前钩子 |
| `teardownHooks` | array | `[]` | 执行后钩子 |

### 支持的测试类型

| 类型 | 说明 | 配置字段 |
|-----|------|---------|
| `http` | HTTP API测试 | `http` |
| `command` | 命令行执行测试 | `command` |
| `workflow` | 工作流编排测试 | `workflowId` 或 `workflowDef` |
| `database` | 数据库测试 | `database` |
| `grpc` | gRPC服务测试 | `grpc` |
| `websocket` | WebSocket测试 | `websocket` |
| `integration` | 集成测试 | `integration` |
| `performance` | 性能测试 | `performance` |
| `security` | 安全测试 | `security` |
| `e2e` | 端到端测试 | `e2e` |

---

## HTTP测试用例格式

### 完整示例

```json
{
  "testId": "login-success-001",
  "tenantId": "default",
  "projectId": "auth-service",
  "groupId": "api-auth",
  "name": "测试用户登录成功",
  "type": "http",
  "priority": "P0",
  "status": "active",
  "objective": "验证用户使用正确的用户名密码可以成功登录",
  "timeout": 30,
  "http": {
    "method": "POST",
    "path": "/api/v1/auth/login",
    "headers": {
      "Content-Type": "application/json",
      "User-Agent": "TestRunner/1.0"
    },
    "body": {
      "username": "testuser",
      "password": "Test@123"
    }
  },
  "assertions": [
    {
      "type": "status_code",
      "expected": 200,
      "description": "返回200状态码"
    },
    {
      "type": "json_path",
      "path": "$.code",
      "expected": 0,
      "description": "业务状态码为0"
    },
    {
      "type": "json_path",
      "path": "$.data.token",
      "operator": "exists",
      "description": "返回token字段"
    },
    {
      "type": "response_time",
      "operator": "less_than",
      "expected": 1000,
      "description": "响应时间小于1秒"
    }
  ],
  "tags": ["api", "auth", "login", "P0"]
}
```

### HTTP配置字段 (`http`)

#### 必填字段

| 字段 | 类型 | 说明 | 示例 |
|-----|------|------|------|
| `method` | string | HTTP方法 | `"GET"`, `"POST"`, `"PUT"`, `"DELETE"`, `"PATCH"` |
| `path` | string | 请求路径（可含查询参数） | `"/api/v1/users"` |

#### 可选字段

| 字段 | 类型 | 默认值 | 说明 |
|-----|------|-------|------|
| `headers` | object | `{}` | 请求头键值对 |
| `body` | object/string | - | 请求体（POST/PUT） |
| `queryParams` | object | `{}` | 查询参数（会自动拼接到path） |

### 断言类型 (`assertions`)

#### 1. 状态码断言 (`status_code`)

```json
{
  "type": "status_code",
  "expected": 200,
  "description": "期望返回200状态码"
}
```

支持操作符：
- `equals` (默认)：精确匹配
- `in`：状态码在列表中

示例：
```json
{
  "type": "status_code",
  "operator": "in",
  "expected": [200, 201, 204],
  "description": "成功状态码"
}
```

#### 2. JSONPath断言 (`json_path`)

```json
{
  "type": "json_path",
  "path": "$.data.user.id",
  "operator": "exists",
  "description": "用户ID存在"
}
```

支持操作符：
- `equals`：精确匹配值
- `exists`：字段存在
- `contains`：字符串包含
- `regex`：正则表达式匹配
- `greater_than`：大于
- `less_than`：小于

示例：
```json
{
  "type": "json_path",
  "path": "$.data.items",
  "operator": "greater_than",
  "expected": 0,
  "description": "返回至少一条记录"
}
```

#### 3. 响应时间断言 (`response_time`)

```json
{
  "type": "response_time",
  "operator": "less_than",
  "expected": 2000,
  "description": "响应时间小于2秒"
}
```

支持操作符：
- `less_than`：小于（毫秒）
- `greater_than`：大于（毫秒）

#### 4. 响应头断言 (`header`)

```json
{
  "type": "header",
  "name": "Content-Type",
  "operator": "contains",
  "expected": "application/json",
  "description": "响应类型为JSON"
}
```

---

## Command测试用例格式

### 完整示例

```json
{
  "testId": "docker-version-001",
  "groupId": "system-tests",
  "name": "验证Docker版本",
  "type": "command",
  "priority": "P1",
  "objective": "验证Docker环境已正确安装",
  "command": {
    "executable": "docker",
    "args": ["--version"],
    "workDir": "/tmp",
    "env": {
      "PATH": "/usr/local/bin:/usr/bin:/bin"
    },
    "timeout": 10
  },
  "assertions": [
    {
      "type": "exit_code",
      "expected": 0,
      "description": "命令执行成功"
    },
    {
      "type": "stdout",
      "operator": "contains",
      "expected": "Docker version",
      "description": "输出包含版本信息"
    }
  ],
  "tags": ["system", "docker", "P1"]
}
```

### Command配置字段 (`command`)

| 字段 | 类型 | 必填 | 说明 |
|-----|------|------|------|
| `executable` | string | ✅ | 可执行命令 |
| `args` | array | - | 命令参数列表 |
| `workDir` | string | - | 工作目录 |
| `env` | object | - | 环境变量 |
| `timeout` | number | - | 超时时间（秒），默认30 |
| `shell` | string | - | Shell类型（bash/sh/zsh） |

### Command断言类型

#### 1. 退出码断言 (`exit_code`)

```json
{
  "type": "exit_code",
  "expected": 0,
  "description": "命令执行成功"
}
```

#### 2. 标准输出断言 (`stdout`)

```json
{
  "type": "stdout",
  "operator": "contains",
  "expected": "Success",
  "description": "输出包含Success"
}
```

支持操作符：`equals`, `contains`, `regex`, `not_contains`

#### 3. 标准错误断言 (`stderr`)

```json
{
  "type": "stderr",
  "operator": "equals",
  "expected": "",
  "description": "无错误输出"
}
```

---

## Workflow测试用例格式

Workflow测试用例支持两种集成模式：

### 模式1：引用已有Workflow

```json
{
  "testId": "user-registration-flow",
  "groupId": "integration-tests",
  "name": "用户注册完整流程",
  "type": "workflow",
  "priority": "P0",
  "workflowId": "wf-user-registration-001",
  "tags": ["workflow", "integration", "user"]
}
```

### 模式2：内嵌Workflow定义

```json
{
  "testId": "login-and-query",
  "groupId": "integration-tests",
  "name": "登录后查询用户信息",
  "type": "workflow",
  "priority": "P0",
  "workflowDef": {
    "name": "登录和查询流程",
    "steps": [
      {
        "id": "step-login",
        "name": "用户登录",
        "type": "http",
        "config": {
          "method": "POST",
          "url": "/api/v1/login",
          "body": {
            "username": "testuser",
            "password": "Test@123"
          }
        },
        "outputs": {
          "token": "{{response.body.data.token}}"
        }
      },
      {
        "id": "step-get-profile",
        "name": "获取用户信息",
        "type": "http",
        "dependsOn": ["step-login"],
        "config": {
          "method": "GET",
          "url": "/api/v1/user/profile",
          "headers": {
            "Authorization": "Bearer {{step-login.outputs.token}}"
          }
        }
      }
    ]
  },
  "tags": ["workflow", "integration"]
}
```

详细的Workflow定义格式请参考：[Workflow格式规范](./workflow-format.md)

---

## 生命周期钩子 (Hooks)

### Setup Hooks（执行前钩子）

在测试用例执行**之前**运行，用于准备测试环境。

```json
{
  "setupHooks": [
    {
      "type": "http",
      "name": "创建测试用户",
      "config": {
        "method": "POST",
        "url": "/api/v1/users",
        "body": {
          "username": "testuser",
          "password": "Test@123"
        }
      }
    },
    {
      "type": "command",
      "name": "清理测试数据",
      "config": {
        "executable": "rm",
        "args": ["-rf", "/tmp/test-data"]
      }
    }
  ]
}
```

### Teardown Hooks（执行后钩子）

在测试用例执行**之后**运行，用于清理测试环境。

```json
{
  "teardownHooks": [
    {
      "type": "http",
      "name": "删除测试用户",
      "config": {
        "method": "DELETE",
        "url": "/api/v1/users/testuser"
      }
    },
    {
      "type": "command",
      "name": "清理临时文件",
      "config": {
        "executable": "rm",
        "args": ["-rf", "/tmp/test-*"]
      }
    }
  ]
}
```

### Hook配置

| 字段 | 类型 | 必填 | 说明 |
|-----|------|------|------|
| `type` | string | ✅ | Hook类型（http/command/database） |
| `name` | string | ✅ | Hook名称（描述性） |
| `config` | object | ✅ | Hook配置（根据type不同） |
| `continueOnError` | boolean | - | 失败后是否继续（默认false） |
| `timeout` | number | - | 超时时间（秒） |

---

## 多租户和项目隔离

### 租户ID (`tenantId`)

用于多租户环境下的数据隔离：

```json
{
  "testId": "tenant-a-test",
  "tenantId": "tenant-a",
  "projectId": "project-001",
  "name": "租户A的测试",
  "type": "http",
  ...
}
```

**验证规则**:
- 租户ID必须是已注册的租户
- 测试用例只能访问同租户下的资源
- 默认租户为 `"default"`

### 项目ID (`projectId`)

用于项目级别的测试组织：

```json
{
  "testId": "auth-service-test",
  "tenantId": "default",
  "projectId": "auth-service",
  "name": "认证服务测试",
  "type": "http",
  ...
}
```

---

## 优先级定义

| 优先级 | 说明 | 执行频率 | 示例场景 |
|--------|------|---------|---------|
| `P0` | 核心功能，阻塞性 | 每次提交 | 登录、注册、支付 |
| `P1` | 重要功能，非阻塞 | 每日构建 | 用户资料、订单查询 |
| `P2` | 次要功能 | 每周回归 | UI样式、边界情况 |

---

## 验证规则

### 字段验证

1. **testId验证**:
   - 格式：字母、数字、连字符、下划线
   - 长度：3-255字符
   - 唯一性：项目内唯一

2. **name验证**:
   - 长度：1-255字符
   - 建议：描述性名称（动词+名词+场景）

3. **type验证**:
   - 必须是支持的类型之一
   - 必须提供对应的配置字段

4. **timeout验证**:
   - 范围：1-3600秒
   - HTTP默认：30秒
   - Command默认：30秒
   - Workflow默认：300秒

### 配置验证

根据`type`字段验证对应的配置：

- `type: "http"` → 必须有 `http` 字段
- `type: "command"` → 必须有 `command` 字段
- `type: "workflow"` → 必须有 `workflowId` 或 `workflowDef`

---

## 错误处理

### 验证失败

```json
{
  "code": 400,
  "message": "Test case validation failed",
  "errors": [
    {
      "field": "testId",
      "message": "testId is required"
    },
    {
      "field": "http.method",
      "message": "Invalid HTTP method: INVALID"
    }
  ]
}
```

### 执行失败

测试用例执行失败时，结果中包含：

```json
{
  "testId": "login-001",
  "status": "failed",
  "error": "Assertion failed: Expected status 200, got 500",
  "failures": [
    {
      "type": "status_code",
      "expected": 200,
      "actual": 500,
      "message": "Status code mismatch"
    }
  ],
  "duration": 1234,
  "startTime": "2025-11-27T10:00:00Z",
  "endTime": "2025-11-27T10:00:01Z"
}
```

---

## 最佳实践

### 1. testId命名规范

```
{功能模块}-{操作}-{序号}

示例：
- login-success-001
- user-create-002
- order-query-003
```

### 2. 测试用例命名

使用"测试+动词+名词+条件"格式：

```
✅ 推荐：
- "测试用户登录成功"
- "测试创建订单失败（余额不足）"
- "测试查询用户列表（分页）"

❌ 不推荐：
- "登录测试"
- "test1"
- "用户测试用例"
```

### 3. 断言设计

- 每个测试用例至少包含1个断言
- 优先验证关键业务逻辑
- 避免过度断言（影响维护性）

```json
{
  "assertions": [
    {
      "type": "status_code",
      "expected": 200,
      "description": "✅ 必要：验证请求成功"
    },
    {
      "type": "json_path",
      "path": "$.data.userId",
      "operator": "exists",
      "description": "✅ 必要：验证返回用户ID"
    },
    {
      "type": "json_path",
      "path": "$.data.avatar",
      "operator": "contains",
      "expected": "https://",
      "description": "❌ 过度：头像URL格式验证（非核心）"
    }
  ]
}
```

### 4. 使用标签分类

```json
{
  "tags": [
    "api",           // 测试类型
    "auth",          // 功能模块
    "login",         // 具体功能
    "P0",            // 优先级
    "smoke",         // 测试套件类型
    "regression"     // 回归测试
  ]
}
```

---

## 相关文档

- [API测试规范](./api-testing-spec.md) - API测试详细规范
- [Workflow格式规范](./workflow-format.md) - Workflow定义规范
- [测试数据规范](./test-data-spec.md) - 测试数据管理规范
- [测试指南](../../3-guides/testing/) - 测试执行指南
- [测试平台使用](../../5-wiki/testcase/) - 测试平台功能说明

---

## 附录A：完整字段清单

### TestCase模型所有字段

```typescript
interface TestCase {
  // === 基础字段 ===
  id?: number;                    // 自增ID（系统生成）
  testId: string;                 // 测试用例唯一标识（必填）
  tenantId?: string;              // 租户ID
  projectId?: string;             // 项目ID
  groupId: string;                // 测试组ID（必填）
  name: string;                   // 测试用例名称（必填）
  type: string;                   // 测试类型（必填）
  priority?: string;              // 优先级（P0/P1/P2）
  status?: string;                // 状态（active/inactive）
  objective?: string;             // 测试目的
  timeout?: number;               // 超时时间（秒）

  // === Workflow集成 ===
  workflowId?: string;            // 引用Workflow ID（模式1）
  workflowDef?: object;           // 内嵌Workflow定义（模式2）

  // === 测试配置（根据type选择一个） ===
  http?: object;                  // HTTP测试配置
  command?: object;               // Command测试配置
  database?: object;              // Database测试配置
  grpc?: object;                  // gRPC测试配置
  websocket?: object;             // WebSocket测试配置
  integration?: object;           // 集成测试配置
  performance?: object;           // 性能测试配置
  security?: object;              // 安全测试配置
  e2e?: object;                   // E2E测试配置
  custom?: object;                // 自定义配置

  // === 测试逻辑 ===
  preconditions?: array;          // 前置条件
  steps?: array;                  // 测试步骤（废弃，使用workflow）
  assertions?: array;             // 断言列表
  tags?: array;                   // 标签

  // === 生命周期钩子 ===
  setupHooks?: array;             // 执行前钩子
  teardownHooks?: array;          // 执行后钩子

  // === 价值评分（系统计算） ===
  coverageScore?: number;         // 覆盖率得分
  stabilityScore?: number;        // 稳定性得分
  efficiencyScore?: number;       // 效率得分
  maintainabilityScore?: number;  // 可维护性得分
  overallScore?: number;          // 综合得分

  // === 执行统计（系统更新） ===
  executionCount?: number;        // 执行次数
  successCount?: number;          // 成功次数
  failureCount?: number;          // 失败次数
  avgDuration?: number;           // 平均耗时（毫秒）
  successRate?: number;           // 成功率（0-100）
  lastRunAt?: string;             // 最后执行时间
  lastSuccessAt?: string;         // 最后成功时间
  lastFailureAt?: string;         // 最后失败时间

  // === Flaky测试检测（系统计算） ===
  isFlaky?: boolean;              // 是否为Flaky测试
  flakyScore?: number;            // Flaky得分（0-100）
  consecutiveFailures?: number;   // 连续失败次数

  // === 所有权 ===
  ownerId?: string;               // 负责人ID
  lastModifiedBy?: string;        // 最后修改人

  // === 时间戳（系统生成） ===
  createdAt?: string;             // 创建时间
  updatedAt?: string;             // 更新时间
}
```

---

## 附录B：示例集合

### 最小化HTTP测试用例

```json
{
  "testId": "minimal-http-test",
  "groupId": "api-tests",
  "name": "最小HTTP测试",
  "type": "http",
  "http": {
    "method": "GET",
    "path": "/api/health"
  }
}
```

### 完整HTTP测试用例

参见"HTTP测试用例格式"章节的完整示例。

### 最小化Command测试用例

```json
{
  "testId": "minimal-command-test",
  "groupId": "system-tests",
  "name": "最小Command测试",
  "type": "command",
  "command": {
    "executable": "echo",
    "args": ["hello"]
  }
}
```

---

**审核历史**:
- 2025-11-27: 初始版本 - QA团队
- 基于 backend/internal/models/test_case.go (v1.0)
- 基于 backend/examples/sample-tests.json (v1.0)
