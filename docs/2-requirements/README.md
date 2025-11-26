# 需求管理文档

**最后更新**: 2025-11-26

---

## 目录概览

本层管理产品需求和用户故事，持续演进以反映产品发展方向。

```
2-requirements/
├── prd/
│   ├── current.md                 # 当前活跃的PRD
│   └── history/                   # 历史版本PRD
│       ├── v1.0-initial.md
│       └── v2.0-productization.md
│
├── features/
│   ├── testcase-management.md     # 测试用例管理需求
│   ├── workflow-engine.md         # 工作流引擎需求
│   ├── environment-management.md  # 环境管理需求
│   └── multi-tenant.md            # 多租户需求
│
└── stories/
    ├── by-feature/                # 按功能分组的stories
    │   ├── testcase/
    │   ├── workflow/
    │   └── environment/
    └── archive/                   # 已完成的stories
        └── 2024-Q4/
```

---

## 当前需求概览

### 产品需求文档 (PRD)

| 文档 | 版本 | 状态 | 最后更新 | 说明 |
|------|------|------|---------|------|
| current.md | 2.0 | 🟢 活跃 | 待补充 | 产品化阶段PRD |
| v2.0-productization.md | 2.0 | 📦 归档 | 待补充 | 产品化完整PRD |
| v1.0-initial.md | 1.0 | 📦 归档 | 待补充 | 初始版本PRD |

**PRD版本演进**:
- **v1.0**: 基础测试管理功能
- **v2.0**: 产品化，添加多租户、权限管理、API中心

### 功能需求 (Features)

| 功能模块 | 状态 | 优先级 | 负责人 | 文档 |
|---------|------|--------|--------|------|
| 测试用例管理 | ✅ 已完成 | P0 | - | [testcase-management.md](features/testcase-management.md) |
| 工作流引擎 | ✅ 已完成 | P0 | - | [workflow-engine.md](features/workflow-engine.md) |
| 环境管理 | ✅ 已完成 | P1 | - | [environment-management.md](features/environment-management.md) |
| 多租户系统 | 🟡 进行中 | P0 | - | [multi-tenant.md](features/multi-tenant.md) |
| 权限管理 | 🟡 进行中 | P0 | - | 待创建 |
| 动作库 | 🟡 进行中 | P1 | - | 待创建 |
| API中心 | 🟡 进行中 | P1 | - | 待创建 |
| 数据看板 | 🟢 计划中 | P2 | - | 待创建 |

**状态说明**:
- ✅ 已完成 - 功能已上线并稳定运行
- 🟡 进行中 - 正在开发或部分完成
- 🟢 计划中 - 已列入Backlog，等待排期
- 🔴 暂停 - 因某些原因暂停开发

---

## PRD版本历史

### v2.0 - 产品化阶段 (2025)

**核心目标**: 从内部工具转变为多租户SaaS产品

**新增功能**:
- 多租户隔离 (Organization → Project)
- 四层权限模型 (平台/组织/项目/资源)
- API中心 (调试、Mock、文档生成)
- 动作库 (可复用的测试步骤)
- 数据看板 (测试统计和可视化)

**主要改进**:
- 前端现代化 (React 19 + TypeScript)
- WebSocket实时推送
- 环境管理增强

### v1.0 - 初始版本 (2024)

**核心目标**: 提供基础的测试管理和执行能力

**核心功能**:
- 测试用例管理 (CRUD)
- HTTP测试执行
- 命令行测试执行
- 工作流编排 (DAG)
- 断言系统
- 测试分组

---

## 需求状态跟踪

### 按优先级

#### P0 - 核心功能（必须有）
- [x] 测试用例管理
- [x] 工作流引擎
- [ ] 多租户系统
- [ ] 权限管理

#### P1 - 重要功能（应该有）
- [x] 环境管理
- [ ] 动作库
- [ ] API中心
- [ ] 批量操作

#### P2 - 增值功能（可以有）
- [ ] 数据看板
- [ ] 测试报告
- [ ] 定时任务
- [ ] 通知集成

### 按状态

#### 已完成 (Completed)
1. 测试用例管理 - 2024-Q3
2. 工作流引擎 - 2024-Q4
3. 环境管理 - 2024-Q4
4. WebSocket实时推送 - 2024-Q4

#### 进行中 (In Progress)
1. 多租户系统 - 预计 2025-Q1
2. 权限管理 - 预计 2025-Q1
3. 动作库 - 预计 2025-Q1
4. API中心 - 预计 2025-Q2

#### 计划中 (Planned)
1. 数据看板 - 2025-Q2
2. 测试报告 - 2025-Q2
3. 定时任务 - 2025-Q3

---

## 用户故事管理

### 故事分类

**按功能模块**:
```
stories/by-feature/
├── testcase/          # 测试用例相关stories
├── workflow/          # 工作流相关stories
├── environment/       # 环境管理相关stories
├── tenant/            # 多租户相关stories
├── library/           # 动作库相关stories
└── api-center/        # API中心相关stories
```

**按状态**:
- **Active**: 当前Sprint正在实现的stories
- **Backlog**: 已评审待排期的stories
- **Archive**: 已完成的stories（按季度归档）

### 故事模板

每个User Story应包含:
```markdown
# [功能名称] User Story

**创建日期**: YYYY-MM-DD
**状态**: Active/Backlog/Done
**优先级**: P0/P1/P2
**预估点数**: X

## 用户角色
作为一个 [角色]

## 需求描述
我想要 [功能]

## 业务价值
以便于 [价值/目标]

## 验收标准
- [ ] 场景1: Given...When...Then...
- [ ] 场景2: Given...When...Then...
- [ ] 场景3: Given...When...Then...

## 技术备注
- 涉及的模块
- 技术难点
- 依赖关系

## 相关链接
- Feature文档: [链接]
- 决策记录: [链接]
- 设计稿: [链接]
```

---

## 需求评审流程

### 1. 需求收集
- 产品经理整理需求
- 创建Feature文档到 `features/`
- 分解为User Stories到 `stories/by-feature/`

### 2. 需求评审
- 技术团队评审可行性
- 评估技术风险和依赖
- 确定优先级和工作量

### 3. 排期规划
- 添加到 `4-planning/backlog/`
- 或直接加入当前Sprint (`4-planning/active/`)

### 4. 开发实施
- 参考需求文档实现
- 在Wiki中补充业务知识 (`5-wiki/`)
- 重大决策记录ADR (`6-decisions/`)

### 5. 验收归档
- 验证验收标准
- Story移至 `stories/archive/YYYY-QX/`
- 更新Feature文档状态

---

## 需求文档模板

### Feature需求模板
位置: `features/_template.md`

```markdown
# [功能名称] 功能需求

**版本**: 1.0
**创建日期**: YYYY-MM-DD
**状态**: Draft/Review/Approved/Implemented
**优先级**: P0/P1/P2

## 功能概述
[简要描述功能的目的和价值]

## 目标用户
- 用户角色1
- 用户角色2

## 功能需求

### 核心需求
1. [需求1]
2. [需求2]

### 非功能需求
- 性能要求
- 安全要求
- 可用性要求

## 用户场景

### 场景1: [场景名称]
**角色**: [用户角色]
**前置条件**: [条件]
**操作步骤**:
1. 步骤1
2. 步骤2

**预期结果**: [结果]

## 技术约束
- 技术限制
- 依赖的功能
- 系统兼容性

## 验收标准
- [ ] 标准1
- [ ] 标准2

## 相关文档
- PRD: [链接]
- 设计稿: [链接]
- Wiki: [链接]
```

---

## 与其他文档层的关系

- **驱动规范定义**: [1-specs/](../1-specs/) - 需求明确后定义技术规范
- **指导实施**: [4-planning/](../4-planning/) - 需求分解为实施计划
- **形成知识**: [5-wiki/](../5-wiki/) - 实现后沉淀为业务知识
- **记录决策**: [6-decisions/](../6-decisions/) - 需求评审中的重要决策

---

## 统计信息

- **总功能数**: 8
- **已完成**: 3
- **进行中**: 4
- **计划中**: 1
- **活跃Stories**: 待统计
- **已完成Stories**: 待统计

---

## 常见问题

### Q: Feature和Story有什么区别？
**A:**
- **Feature**: 大的功能模块，通常需要多个Sprint完成
- **Story**: Feature的细分，单个Sprint内可完成的用户故事

### Q: 如何确定需求优先级？
**A: 根据以下因素综合评估:**
- 业务价值 (用户需求强度)
- 技术依赖 (是否被其他功能依赖)
- 开发成本 (工作量大小)
- 风险程度 (技术风险、业务风险)

### Q: 需求变更如何处理？
**A:**
1. 评估变更影响范围
2. 更新Feature文档，记录变更历史
3. 如影响较大，创建ADR记录决策
4. 通知相关开发人员
5. 调整Planning中的计划

---

## 相关文档

- **文档架构设计**: [../6-decisions/2025-11-26-documentation-organization-architecture.md](../6-decisions/2025-11-26-documentation-organization-architecture.md)
- **产品路线图**: [../4-planning/backlog/roadmap.md](../4-planning/backlog/)
- **功能实施计划**: [../4-planning/by-feature/](../4-planning/by-feature/)
