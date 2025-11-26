# {模块名称} - 模块概览

**版本**: 1.0
**最后更新**: 2025-XX-XX
**维护者**: @username

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

[一句话描述这个模块的职责，例如: "测试用例模块负责测试用例的创建、管理和执行"]

### 主要功能

- 功能1: [描述]
- 功能2: [描述]
- 功能3: [描述]

### 适用场景

- 场景1: [描述何时使用]
- 场景2: [描述何时使用]

---

## 核心概念

### 概念1: [名称]

**定义**: [清晰的定义]

**属性**:
- 属性1: [类型] - [说明]
- 属性2: [类型] - [说明]

**示例**:
```json
{
  "name": "示例",
  "value": "xxx"
}
```

### 概念2: [名称]

[同上结构]

---

## 代码路径

### 后端代码

| 分层 | 路径 | 职责 |
|------|------|------|
| **领域层** | `backend/internal/domain/{模块}/` | 核心业务逻辑、领域实体 |
| **应用层** | `backend/internal/application/{模块}/` | 用例编排、业务服务 |
| **持久层** | `backend/internal/infrastructure/persistence/` | 数据持久化 |
| **接口层** | `backend/internal/interfaces/http/handler/` | HTTP API处理 |

**关键文件**:
- `domain/{模块}/{实体}.go` - [实体]聚合根
- `application/{模块}/service.go` - [模块]应用服务
- `infrastructure/persistence/models/{模块}.go` - GORM模型
- `interfaces/http/handler/{模块}_handler.go` - HTTP处理器

---

### 前端代码

| 分层 | 路径 | 职责 |
|------|------|------|
| **特性模块** | `front/src/features/{模块}/` | 模块所有代码 |
| **页面组件** | `front/src/features/{模块}/pages/` | 页面级组件 |
| **业务组件** | `front/src/features/{模块}/components/` | 业务组件 |
| **Hooks** | `front/src/features/{模块}/hooks/` | 状态管理Hooks |
| **类型定义** | `front/src/features/{模块}/types.ts` | TypeScript类型 |

**关键文件**:
- `pages/[模块]List.tsx` - 列表页
- `pages/[模块]Editor.tsx` - 编辑页
- `hooks/use[模块].ts` - 状态管理Hook
- `types.ts` - 类型定义

---

## 数据模型

### 核心实体

#### {实体名称}

**数据库表**: `{表名}`

**字段说明**:

| 字段 | 类型 | 说明 | 是否必填 |
|------|------|------|---------|
| id | string | UUID主键 | ✅ |
| name | string | 名称 | ✅ |
| created_at | timestamp | 创建时间 | ✅ |
| updated_at | timestamp | 更新时间 | ✅ |

**完整Schema**: 详见 [`docs/1-specs/database/schema.md#{表名}`](../../1-specs/database/schema.md)

---

## 核心流程

### 流程1: [流程名称]

**触发条件**: [什么时候触发]

**流程步骤**:
```
1. 用户操作 → 前端发起请求
2. 后端Handler接收请求
3. Service层处理业务逻辑
   3.1 验证参数
   3.2 调用Repository
   3.3 执行核心逻辑
4. 返回响应给前端
5. 前端更新UI
```

**涉及组件**:
- 前端: `features/{模块}/pages/XXX.tsx`
- 后端: `application/{模块}/service.go`
- 数据库: `{表名}`

### 流程2: [流程名称]

[同上结构]

---

## API接口

### 核心端点

#### 创建{实体}

```http
POST /api/v2/{模块}
Content-Type: application/json

{
  "name": "示例",
  "config": {}
}
```

**响应**:
```json
{
  "id": "uuid",
  "name": "示例",
  "created_at": "2025-01-01T00:00:00Z"
}
```

#### 获取{实体}列表

```http
GET /api/v2/{模块}?page=1&size=20
```

**详细API文档**: [`docs/1-specs/api/v2-documentation.md#{模块}-api`](../../1-specs/api/v2-documentation.md)

---

## 与其他模块的关系

### 依赖关系

**本模块依赖**:
- `{模块A}` - [为什么依赖，如何使用]
- `{模块B}` - [为什么依赖，如何使用]

**本模块被依赖**:
- `{模块C}` - [为什么被依赖]
- `{模块D}` - [为什么被依赖]

### 边界规则

**✅ 允许的调用**:
- 本模块可以调用 `{模块A}` 的接口XXX
- `{模块C}` 可以调用本模块的接口YYY

**❌ 禁止的调用**:
- 本模块**不能**调用 `{模块X}` (会造成循环依赖)
- 本模块**不能**直接访问其他模块的数据库表

**详细边界定义**: [`docs/5-wiki/architecture/module-boundaries.md`](../architecture/module-boundaries.md)

---

## 相关文档

### 技术规范
- **数据库设计**: [`1-specs/database/schema.md#{表名}`](../../1-specs/database/schema.md)
- **API文档**: [`1-specs/api/v2-documentation.md#{模块}`](../../1-specs/api/v2-documentation.md)

### 决策记录
- [XXX设计决策](../../6-decisions/2024-XX-XX-xxx-feature.md)
- [YYY架构决策](../../6-decisions/2024-XX-XX-yyy-architecture.md)

### 开发指南
- [模块开发指南](../../3-guides/development/{模块}-guide.md)
- [测试指南](../../3-guides/testing/unit-testing-guide.md)

---

## 常见问题

### Q1: [问题]

**A**: [回答]

**示例代码**:
```go
// 代码示例
```

### Q2: [问题]

**A**: [回答]

### Q3: 如何扩展新功能？

**A**:
1. 先阅读相关决策记录
2. 在`domain/{模块}/`中添加领域逻辑
3. 在`application/{模块}/`中添加应用服务
4. 更新Wiki文档

---

## 术语表

| 术语 | 说明 |
|------|------|
| {术语1} | [定义] |
| {术语2} | [定义] |

**完整术语表**: [`docs/5-wiki/glossary.md`](../glossary.md)

---

## 更新历史

| 日期 | 版本 | 变更说明 | 作者 |
|------|------|---------|------|
| 2025-XX-XX | 1.0 | 初始版本 | @username |

---

**维护提示**:
- 当添加新功能时，更新"核心流程"部分
- 当修改数据模型时，更新"数据模型"部分并同步到Schema文档
- 当修改API时，同步更新API文档
