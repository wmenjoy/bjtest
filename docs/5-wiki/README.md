# 业务知识库 (Wiki)

**最后更新**: 2025-11-26

---

## 目录概览

本层是核心业务逻辑和架构知识的集中地，也是AI系统的主要学习材料。

```
5-wiki/
├── architecture/
│   ├── overview.md                # 系统整体架构
│   ├── module-boundaries.md       # 模块边界定义
│   └── ddd-layers.md              # DDD分层说明
│
├── testcase/
│   ├── overview.md                # 模块概览
│   ├── data-model.md              # 数据模型
│   ├── execution-flow.md          # 执行流程
│   ├── assertion-system.md        # 断言系统
│   └── step-types.md              # 步骤类型
│
├── workflow/
│   ├── overview.md
│   ├── dag-execution.md           # DAG执行逻辑
│   ├── variable-system.md         # 变量系统
│   ├── action-types.md            # 动作类型
│   └── integration-modes.md       # 三种集成模式
│
├── environment/
│   ├── overview.md
│   ├── configuration.md
│   └── variable-management.md
│
├── tenant/
│   ├── overview.md
│   ├── multi-tenant-design.md
│   ├── organization-project.md
│   └── permission-model.md
│
├── action-library/
│   ├── overview.md
│   └── template-management.md
│
├── api-center/
│   ├── overview.md
│   └── debugging-features.md
│
└── glossary.md                    # 统一术语表
```

---

## 模块列表

### 核心业务模块

| 模块 | 状态 | 后端代码 | 前端代码 | Wiki入口 |
|------|------|---------|---------|---------|
| **架构总览** | ✅ 完整 | `internal/` | `src/` | [architecture/overview.md](architecture/overview.md) |
| **测试用例管理** | ✅ 已完成 | `domain/testcase/`<br>`application/testcase/` | `features/testcase/` | [testcase/overview.md](testcase/overview.md) |
| **工作流引擎** | ✅ 已完成 | `domain/workflow/`<br>`application/workflow/` | `features/workflow/` | [workflow/overview.md](workflow/overview.md) |
| **环境管理** | ✅ 已完成 | `domain/environment/` | `features/environment/` | [environment/overview.md](environment/overview.md) |
| **多租户系统** | 🟡 进行中 | `domain/tenant/` | `features/admin/` | [tenant/overview.md](tenant/overview.md) |
| **动作库** | 🟡 进行中 | `domain/workflow/actions/` | `features/library/` | [action-library/overview.md](action-library/overview.md) |
| **API中心** | 🟡 进行中 | `interfaces/http/` | `features/api-center/` | [api-center/overview.md](api-center/overview.md) |

**状态说明**:
- ✅ 已完成 - 功能稳定，Wiki文档完整
- 🟡 进行中 - 功能开发中，Wiki需补充
- 🟢 计划中 - 已规划，Wiki待创建

---

## 模块状态详情

### ✅ 已完成模块

#### 1. 测试用例管理 (TestCase)
**核心功能**: 测试用例的CRUD、执行、断言、分组管理

**Wiki文档**:
- ✅ overview.md - 模块概览和代码映射
- ✅ data-model.md - TestCase/TestGroup/TestResult数据模型
- ✅ execution-flow.md - HTTP/Command执行流程
- ✅ assertion-system.md - 断言系统原理
- ✅ step-types.md - 测试步骤类型

**代码路径**:
- 后端: `backend/internal/domain/testcase/`
- 前端: `front/src/features/testcase/`

#### 2. 工作流引擎 (Workflow)
**核心功能**: DAG编排、并行执行、变量插值、动作调度

**Wiki文档**:
- ✅ overview.md - 工作流引擎概览
- ✅ dag-execution.md - DAG依赖解析和并行执行
- ✅ variable-system.md - 变量定义、插值、传递
- ✅ action-types.md - HTTP/Command/TestCase动作
- ✅ integration-modes.md - 三种集成模式详解

**代码路径**:
- 后端: `backend/internal/domain/workflow/`
- 前端: `front/src/features/workflow/`

#### 3. 环境管理 (Environment)
**核心功能**: 多环境配置、变量管理、环境切换

**Wiki文档**:
- ✅ overview.md - 环境管理概览
- ✅ configuration.md - 环境配置结构
- ✅ variable-management.md - 变量作用域和优先级

**代码路径**:
- 后端: `backend/internal/domain/environment/`
- 前端: `front/src/features/environment/`

---

### 🟡 进行中模块

#### 4. 多租户系统 (Tenant)
**核心功能**: 组织/项目隔离、四层权限模型

**Wiki文档** (待补充):
- 🟡 overview.md - 多租户架构概览
- 🟡 multi-tenant-design.md - 数据隔离设计
- 🟡 organization-project.md - 组织和项目层次
- 🟡 permission-model.md - 四层权限模型

**代码路径**:
- 后端: `backend/internal/domain/tenant/`
- 前端: `front/src/features/admin/`

#### 5. 动作库 (Action Library)
**核心功能**: 可复用测试步骤、模板管理

**Wiki文档** (待补充):
- 🟡 overview.md - 动作库概览
- 🟡 template-management.md - 模板创建和使用

**代码路径**:
- 后端: `backend/internal/domain/workflow/actions/`
- 前端: `front/src/features/library/`

#### 6. API中心 (API Center)
**核心功能**: API调试、Mock服务、文档生成

**Wiki文档** (待补充):
- 🟡 overview.md - API中心概览
- 🟡 debugging-features.md - 调试功能说明

**代码路径**:
- 后端: `backend/internal/interfaces/http/`
- 前端: `front/src/features/api-center/`

---

## 统一术语表

**重要**: 所有文档和代码必须使用统一术语，禁止同义词。

详见: [glossary.md](glossary.md)

**核心术语**:

| 概念 | 标准术语(英文) | 中文 | 禁止使用 |
|------|--------------|------|---------|
| 测试用例 | TestCase | 测试用例 | ❌ Test, TestSuite, Case |
| 测试分组 | TestGroup | 测试分组 | ❌ Folder, Category |
| 工作流 | Workflow | 工作流 | ❌ Pipeline, Flow, Process |
| 工作流步骤 | Step / WorkflowStep | 工作流步骤 | ❌ Task, Action, Node |
| 动作 | Action | 动作 | ❌ Operation, Activity |
| 环境 | Environment | 环境 | ❌ Env, Config |
| 租户 | Tenant | 租户 | ❌ Customer, Account |
| 组织 | Organization | 组织 | ❌ Org, Company |
| 项目 | Project | 项目 | ❌ Workspace, Space |

---

## 代码-文档映射说明

### 映射原则

**每个业务模块在三处保持一致**:
1. **Wiki文档**: `5-wiki/{模块}/overview.md`
2. **后端代码**: `backend/internal/domain/{模块}/`
3. **前端代码**: `front/src/features/{模块}/`

### Overview.md 必须包含

每个模块的 `overview.md` 必须包含以下章节:

```markdown
# {模块名称} 概览

## 模块简介
[1-2段话描述模块用途]

## 核心概念
[关键概念列表]

## 数据模型
[核心实体和值对象]

## 业务流程
[关键流程图或描述]

## 代码路径映射

### 后端
- **领域层**: `backend/internal/domain/{模块}/`
- **应用层**: `backend/internal/application/{模块}/`
- **持久层**: `backend/internal/infrastructure/persistence/models/{模块}.go`
- **接口层**: `backend/internal/interfaces/http/handler/{模块}_handler.go`

### 前端
- **特性模块**: `front/src/features/{模块}/`
- **页面组件**: `front/src/features/{模块}/pages/`
- **业务组件**: `front/src/features/{模块}/components/`

## 相关文档
- **数据库设计**: [../../1-specs/database/schema.md](../../1-specs/database/schema.md)
- **API文档**: [../../1-specs/api/v2.md](../../1-specs/api/v2.md)
- **决策记录**: [../../6-decisions/](../../6-decisions/index.md)
```

---

## 模块边界定义

详见: [architecture/module-boundaries.md](architecture/module-boundaries.md)

### 核心边界规则

#### TestCase vs Workflow

| 维度 | TestCase | Workflow |
|------|----------|----------|
| **核心职责** | 单个测试用例的定义和执行 | 多步骤的编排和调度 |
| **执行方式** | 线性执行 | DAG并行执行 |
| **可否嵌套** | ❌ 不能包含其他TestCase | ✅ 可以包含TestCase作为步骤 |
| **代码原则** | **TestCase不能调用Workflow** | **Workflow可以调用TestCase** |

#### Environment vs Tenant

| 维度 | Environment | Tenant |
|------|------------|--------|
| **核心职责** | 管理运行环境配置 | 管理组织/项目隔离 |
| **隔离级别** | 同租户下的不同环境 | 不同租户完全隔离 |
| **代码原则** | **Environment属于Tenant** | **Environment不能跨Tenant** |

---

## AI使用指南

### AI修改代码的标准流程

当AI需要修改代码时，应按以下顺序阅读文档:

```
1. 理解需求
   └─> 读取 2-requirements/ 中的相关需求文档

2. 查阅决策历史
   └─> 搜索 6-decisions/ 是否有相关决策

3. 学习业务逻辑 ⭐ 从这里开始
   └─> 读取 5-wiki/{模块}/overview.md
   └─> 读取相关子主题文档

4. 确认技术规范
   └─> 读取 1-specs/database/schema.md (如需修改数据库)
   └─> 读取 1-specs/api/v2.md (如需修改API)

5. 查看实施指南
   └─> 读取 3-guides/ 中的相关指南

6. 定位代码文件
   └─> 根据 overview.md 中的"代码路径映射"定位
   └─> 后端: backend/internal/domain/{模块}/
   └─> 前端: front/src/features/{模块}/

7. 实施修改
   └─> 按照DDD分层或Feature-Driven原则修改代码

8. 更新文档
   └─> 如果修改了核心逻辑，更新 5-wiki/
   └─> 如果是重大决策,创建 6-decisions/ ADR
   └─> 如果修改了Schema/API，更新 1-specs/
```

### AI创建新功能的标准流程

```
1. 理解需求 → 2-requirements/

2. 设计决策
   └─> 如果是架构级: 创建ADR (Proposed状态)
   └─> 讨论备选方案，确定后标记Accepted

3. 创建Wiki文档 ⭐ 关键步骤
   └─> 5-wiki/{新模块}/overview.md
   └─> 包含: 代码路径映射、核心概念、数据流

4. 更新Specs
   └─> 1-specs/database/schema.md (如需新表)
   └─> 1-specs/api/v2.md (如需新API)

5. 实施代码
   └─> 后端: 按DDD分层创建 (domain → application → infrastructure → interfaces)
   └─> 前端: 在features/下创建新目录

6. 标记决策为Implemented
   └─> 更新ADR状态
```

---

## 文档维护规则

### 何时更新Wiki

**必须更新**:
- ✅ 添加新的业务模块
- ✅ 修改核心数据模型
- ✅ 变更重要业务流程
- ✅ 调整模块边界

**不需要更新**:
- ❌ 小的bug修复
- ❌ UI样式调整
- ❌ 性能优化（不改变业务逻辑）

### 更新流程

```bash
# 1. 修改代码
git add backend/internal/domain/testcase/

# 2. 同步更新Wiki
git add docs/5-wiki/testcase/overview.md

# 3. 提交时注明文档更新
git commit -m "feat: 添加测试用例批量操作

- 实现批量执行功能
- 更新testcase/overview.md
- 补充execution-flow.md"
```

---

## 与其他文档层的关系

- **需求来源**: [2-requirements/](../2-requirements/) - 功能需求驱动Wiki创建
- **技术规范**: [1-specs/](../1-specs/) - Wiki解释规范的业务意义
- **实施指南**: [3-guides/](../3-guides/) - Wiki提供原理，Guide提供实践
- **决策支撑**: [6-decisions/](../6-decisions/) - Wiki记录决策的业务背景

---

## 统计信息

- **总模块数**: 7
- **已完成**: 3 (TestCase, Workflow, Environment)
- **进行中**: 3 (Tenant, ActionLibrary, APICenter)
- **计划中**: 1 (Dashboard)
- **Wiki文档总数**: 约25篇

---

## 常见问题

### Q: Wiki和技术文档有什么区别？
**A:**
- **Wiki**: 业务知识，解释"是什么"和"为什么"
- **Specs**: 技术规范，定义"怎么实现"
- **Guides**: 操作指南，教"如何做"

### Q: 如何查找某个功能的Wiki？
**A: 三种方式:**
1. 按模块查找: 本README → 模块列表 → 点击overview
2. 按关键词: 使用IDE全局搜索
3. 查看术语表: glossary.md → 找到标准术语 → 查对应模块

### Q: Wiki文档过时了怎么办？
**A:**
1. 检查代码实现是否还是Wiki描述的样子
2. 如果业务逻辑已变更 → 更新Wiki
3. 如果功能已废弃 → 标注废弃，考虑移至7-archive/

---

## 相关文档

- **文档架构设计**: [../6-decisions/2025-11-26-documentation-organization-architecture.md](../6-decisions/2025-11-26-documentation-organization-architecture.md)
- **模块边界定义**: [architecture/module-boundaries.md](architecture/module-boundaries.md)
- **统一术语表**: [glossary.md](glossary.md)
- **系统架构总览**: [architecture/overview.md](architecture/overview.md)

---

## 模板

### Wiki Overview模板
位置: [_template-overview.md](_template-overview.md)

用于创建新模块的overview.md文档。

---

**维护者**: 测试平台团队

**问题反馈**: 如发现Wiki文档与代码不一致，请立即提Issue
