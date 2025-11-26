# 测试平台文档中心

**最后更新**: 2025-11-26

---

## 欢迎使用测试平台文档

本文档采用七层架构组织，旨在为开发人员、AI系统、产品人员和测试人员提供清晰、高效的信息导航。

---

## 七层架构概览

```
docs/
├── 1-specs/           技术规范 - 数据库Schema、API定义、协议规范
├── 2-requirements/    需求管理 - PRD、功能需求、用户故事
├── 3-guides/          开发指南 - 实施指南、最佳实践
├── 4-planning/        计划任务 - Sprint计划、进度追踪
├── 5-wiki/            业务知识 - 模块概览、核心概念
├── 6-decisions/       决策记录 - ADR架构和功能决策
└── 7-archive/         历史归档 - 已废弃的文档
```

---

## 快速导航表格

| 文档层 | 用途 | 适用人群 | 更新频率 | 入口 |
|--------|------|---------|----------|------|
| **1-Specs** | 技术规范和约束定义 | 开发人员、AI系统 | 每次Schema/API变更 | [进入](1-specs/README.md) |
| **2-Requirements** | 产品需求和用户故事 | 产品人员、开发人员 | 每次需求评审 | [进入](2-requirements/README.md) |
| **3-Guides** | 开发指南和最佳实践 | 开发人员、新成员 | 新开发模式加入时 | [进入](3-guides/README.md) |
| **4-Planning** | 计划任务和进度追踪 | 全员 | 每日/每周 | [进入](4-planning/README.md) |
| **5-Wiki** | 业务知识和架构原理 | AI系统、开发人员 | 架构变化时 | [进入](5-wiki/README.md) |
| **6-Decisions** | 架构和功能决策记录 | 开发人员、架构师 | 重大决策时 | [进入](6-decisions/index.md) |
| **7-Archive** | 历史文档归档 | 需要时查阅 | 季度末 | [进入](7-archive/README.md) |

---

## 按角色导航

### 新开发者（Quick Start）
1. **了解系统架构** → [5-wiki/architecture/overview.md](5-wiki/architecture/overview.md)
2. **查看开发指南** → [3-guides/development/](3-guides/development/)
3. **理解核心模块** → [5-wiki/](5-wiki/README.md)
4. **查看当前任务** → [4-planning/active/](4-planning/active/)

### AI系统（Claude Code等）
1. **学习业务逻辑** → [5-wiki/](5-wiki/README.md) - 包含代码路径映射
2. **查阅决策历史** → [6-decisions/](6-decisions/index.md) - 理解"为什么"
3. **确认技术规范** → [1-specs/](1-specs/README.md) - Schema和API定义
4. **查看实施指南** → [3-guides/](3-guides/README.md) - 如何实现

### 产品人员
1. **编写PRD** → [2-requirements/prd/](2-requirements/)
2. **管理功能需求** → [2-requirements/features/](2-requirements/)
3. **查看实施进度** → [4-planning/](4-planning/README.md)
4. **理解业务概念** → [5-wiki/](5-wiki/README.md)

### 测试人员
1. **查看测试指南** → [3-guides/testing/](3-guides/testing/)
2. **理解模块功能** → [5-wiki/](5-wiki/README.md)
3. **查看API规范** → [1-specs/api/](1-specs/)
4. **查看测试计划** → [4-planning/](4-planning/README.md)

---

## 核心业务模块索引

| 模块 | Wiki文档 | 后端代码 | 前端代码 | 状态 |
|------|---------|---------|---------|------|
| 测试用例管理 | [5-wiki/testcase/](5-wiki/testcase/) | `domain/testcase/` | `features/testcase/` | ✅ 已完成 |
| 工作流引擎 | [5-wiki/workflow/](5-wiki/workflow/) | `domain/workflow/` | `features/workflow/` | ✅ 已完成 |
| 环境管理 | [5-wiki/environment/](5-wiki/environment/) | `domain/environment/` | `features/environment/` | ✅ 已完成 |
| 多租户 | [5-wiki/tenant/](5-wiki/tenant/) | `domain/tenant/` | `features/admin/` | 🟡 进行中 |
| 动作库 | [5-wiki/action-library/](5-wiki/action-library/) | `domain/workflow/actions/` | `features/library/` | 🟡 进行中 |
| API中心 | [5-wiki/api-center/](5-wiki/api-center/) | `interfaces/http/` | `features/api-center/` | 🟡 进行中 |

---

## 文档维护规则

### 核心原则
1. **Wiki与代码同步** - 修改核心逻辑时必须更新Wiki
2. **重大决策记录ADR** - 架构级和功能级决策需要创建ADR
3. **Specs文档版本化** - Schema和API变更必须记录版本历史
4. **Planning文档季度归档** - 已完成计划每季度移至completed/

### 详细规范
查看完整的文档维护规则: [6-decisions/2025-11-26-documentation-organization-architecture.md#文档维护规则](6-decisions/2025-11-26-documentation-organization-architecture.md)

---

## 常见问题

### Q: 我该把新文档放在哪一层？
**A: 根据文档性质选择:**
- **技术规范** (Schema/API/协议) → 1-specs/
- **产品需求** (PRD/Stories) → 2-requirements/
- **操作指南** (How-to) → 3-guides/
- **计划任务** (Sprint/Roadmap) → 4-planning/
- **业务知识** (概念/原理) → 5-wiki/
- **设计决策** (为什么这么做) → 6-decisions/

### Q: Wiki和Guides有什么区别？
**A:**
- **Wiki**: "这个模块是什么，怎么工作的" (概念 + 原理)
- **Guides**: "如何使用这个模块进行开发" (步骤 + 实践)

### Q: 什么时候需要创建ADR？
**A:**
- **架构级** (开发前): 影响多模块的重大决策
- **功能级** (开发中): 新功能的设计选择
- **不需要**: 代码级细节、小的bug修复

### Q: 如何查找某个功能的文档？
**A: 三种方式:**
1. 按模块导航: [5-wiki/](5-wiki/README.md) → 选择模块 → 查看overview
2. 按时间查找: [6-decisions/index.md](6-decisions/index.md) → 按时间排序
3. 搜索关键词: 使用IDE全局搜索功能

---

## 项目统计

### 文档统计
- **Specs文档**: 4类 (database/api/backend/ui)
- **Wiki模块**: 7个 (testcase/workflow/environment/tenant/action-library/api-center/architecture)
- **决策记录**: 1条 (文档组织规范)
- **活跃计划**: 1个 (文档迁移)

### 代码统计
- **后端**: Go 1.24, DDD分层架构
- **前端**: React 19.2 + TypeScript, Feature-Driven
- **数据库**: 11张核心表, SQLite/MySQL/PostgreSQL

---

## 相关资源

### 项目文档
- **项目根README**: [../README.md](../README.md)
- **后端README**: [../nextest-platform/README.md](../nextest-platform/README.md)
- **前端README**: [../NextTestPlatformUI/README.md](../NextTestPlatformUI/README.md)

### 快速链接
- **数据库Schema**: [1-specs/database/schema.md](1-specs/database/schema.md)
- **API文档**: [1-specs/api/v2.md](1-specs/api/v2.md)
- **术语表**: [5-wiki/glossary.md](5-wiki/glossary.md)
- **模块边界定义**: [5-wiki/architecture/module-boundaries.md](5-wiki/architecture/module-boundaries.md)

---

## 贡献指南

### 如何更新文档
1. **确定文档类型** - 根据上述分类选择正确的层级
2. **遵循命名规范** - 参考 [命名规范](#)
3. **更新索引文件** - 在对应层级的README/index.md中添加链接
4. **提交PR** - 包含清晰的commit message

### 文档模板
- **ADR模板**: [6-decisions/_template.md](6-decisions/_template.md)
- **Wiki Overview模板**: [5-wiki/_template-overview.md](5-wiki/_template-overview.md)
- **Guide模板**: [3-guides/_template.md](3-guides/_template.md)

---

**文档架构设计**: [6-decisions/2025-11-26-documentation-organization-architecture.md](6-decisions/2025-11-26-documentation-organization-architecture.md)

**维护者**: 测试平台团队

**问题反馈**: 请在项目Issue中提出
