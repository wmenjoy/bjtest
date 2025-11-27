# 文档标准缺口分析：代码结构与测试案例

**文档类型**: 临时文档
**清理规则**: 完成后归档到 `docs/7-archive/`
**状态**: 🔄 进行中
**创建时间**: 2025-11-27
**预计完成**: 2025-12-05
**负责人**: Claude

---

## 背景

用户要求审查现有文档标准（`docs/directory-standards.md` v4.0）,识别在以下两个关键领域的缺口：

1. **代码结构文档化标准** - 如何系统地记录代码库架构、模块组织、包结构
2. **测试案例文档化标准** - 如何记录测试计划、测试策略、测试规范

当前文档标准定义了七层文档架构，但对上述两个领域的具体指导不够明确。

## 目标

- [x] 全面审查 `directory-standards.md`
- [x] 识别代码结构文档化的缺口
- [x] 识别测试案例文档化的缺口
- [ ] 提出填补缺口的具体建议
- [ ] 制定补充标准文档的实施计划

## 当前标准的覆盖范围

### 已明确定义的七层架构

| 层级 | 目录 | 用途 | 现有细化程度 |
|-----|------|------|------------|
| 1️⃣ | `1-specs/` | 技术规范 | ✅ 较详细 (api/, backend/, frontend/, database/, websocket/) |
| 2️⃣ | `2-requirements/` | 产品需求 | ✅ 清晰 (prd/, stories/, features/) |
| 3️⃣ | `3-guides/` | 使用指南 | ⚠️  存在但不够详细 (development/, testing/, user/) |
| 4️⃣ | `4-planning/` | 计划文档 | ✅ 非常详细 (active/, backlog/, completed/, archive/) |
| 5️⃣ | `5-wiki/` | 业务知识库 | ✅ 详细 (testcase/, actionlibrary/, apicenter/, workflow/, architecture/) |
| 6️⃣ | `6-decisions/` | 架构决策 | ✅ 清晰 (ADR规范) |
| 7️⃣ | `7-archive/` | 历史归档 | ✅ 非常详细 (按季度+分类) |

### 已覆盖的关键规范

✅ **命名规范**
- 目录命名：kebab-case (除5-wiki用全小写无连字符)
- 文件命名：kebab-case
- 特殊文件：README.md, _template-*.md, index.md

✅ **生命周期管理**
- 创建 → 维护 → 归档 → 删除
- 归档触发条件
- 安全操作规则（v4.0新增）

✅ **文档分类决策树**
- 清晰的分类逻辑
- 针对不同文档类型的存放位置

## 缺口分析

### 缺口1：代码结构文档化标准 ⚠️  严重

#### 1.1 当前状态

**现有提及**:
- `5-wiki/architecture/module-boundaries.md` - 被引用但无具体标准
- `1-specs/backend/`, `1-specs/frontend/` - 存在但用途模糊

**问题**:
1. **不清晰的定义边界**
   - `1-specs/backend/` 应该记录什么？
   - 是记录单个模块的API规范？还是记录整体代码架构？
   - 是记录接口定义？还是记录实现设计？

2. **缺少代码组织文档的明确位置**
   - 项目的包结构（package structure）应该放在哪？
   - 代码分层架构（layered architecture）应该放在哪？
   - 模块依赖关系图应该放在哪？
   - 代码命名规范应该放在哪？

3. **与5-wiki/architecture的关系不明确**
   - 什么内容应该放在 `1-specs/` vs `5-wiki/architecture/`?
   - 两者的区分标准是什么？

#### 1.2 具体缺失的文档类型

| 文档类型 | 示例 | 当前位置？ | 应该放哪？ |
|---------|------|----------|----------|
| **代码库架构总览** | "项目采用三层架构：Handler-Service-Repository" | ❓ 不明确 | 需定义 |
| **包结构说明** | "internal/models/, internal/repository/, internal/service/" | ❓ 不明确 | 需定义 |
| **模块依赖关系** | "Workflow模块依赖TestCase模块" | ❓ 可能在5-wiki/architecture | 需明确 |
| **代码分层规范** | "业务逻辑必须在Service层，禁止在Handler层" | ❓ 不明确 | 需定义 |
| **代码命名规范** | "Repository接口命名规则：{Entity}Repository" | ❓ 不明确 | 需定义 |
| **目录结构约定** | "每个模块必须包含model.go, repository.go, service.go" | ❓ 不明确 | 需定义 |
| **代码组织原则** | "按功能分包 vs 按层级分包" | ❓ 可能在6-decisions | 需明确 |

#### 1.3 根本问题

**缺少对"代码结构文档"的分类标准**:

```
代码结构文档应该分为：
├─ 架构设计（高层次）→ 应该放在哪？
├─ 模块规范（中层次）→ 应该放在哪？
├─ 包结构（低层次）→ 应该放在哪？
└─ 命名约定（实施细节）→ 应该放在哪？
```

**建议的分类逻辑**（待讨论）:

| 层次 | 内容类型 | 建议位置 | 理由 |
|-----|---------|---------|------|
| **架构设计** | 整体架构、设计模式、技术栈 | `1-specs/architecture/` 或 `6-decisions/` | 技术决策层面 |
| **模块边界** | 模块职责、依赖关系、接口定义 | `5-wiki/architecture/` | 业务知识层面 |
| **包结构规范** | 目录组织、命名规范、文件分类 | `3-guides/development/code-organization.md` | 开发指南层面 |
| **代码示例** | 具体实现示例、最佳实践 | `3-guides/development/examples/` | 教学层面 |

### 缺口2：测试案例文档化标准 ⚠️  中等

#### 2.1 当前状态

**现有提及**:
- `3-guides/testing/` - 目录存在但用途不明确
- `5-wiki/testcase/` - 存在但标准缺失

**问题**:
1. **测试文档的类型未分类**
   - 测试计划 vs 测试用例 vs 测试报告？
   - 单元测试文档 vs 集成测试文档？
   - 自动化测试脚本文档 vs 手工测试流程？

2. **测试文档的存放位置不明确**
   - `3-guides/testing/` 应该放什么？（操作指南？）
   - `5-wiki/testcase/` 应该放什么？（领域知识？）
   - `1-specs/` 应该包含测试规范吗？
   - `2-requirements/` 的验收标准算测试文档吗？

3. **缺少测试策略文档的位置**
   - 整体测试策略（测试金字塔、覆盖率目标）应该放哪？
   - QA流程文档应该放哪？
   - 性能测试、安全测试的计划应该放哪？

#### 2.2 具体缺失的文档类型

| 文档类型 | 示例 | 当前位置？ | 应该放哪？ |
|---------|------|----------|----------|
| **测试策略** | "项目采用测试金字塔模型" | ❓ 不明确 | 需定义 |
| **测试计划** | "v2.0测试计划：功能测试+性能测试" | ❓ 可能在4-planning | 需明确 |
| **测试用例规范** | "HTTP测试用例编写规范" | ❓ 可能在5-wiki/testcase | 需明确 |
| **测试环境文档** | "测试环境配置：Dev/Staging/Prod" | ❓ 不明确 | 需定义 |
| **测试结果报告** | "v2.0功能测试报告" | ❓ 可能在7-archive | 需明确 |
| **QA流程文档** | "从提交到发布的测试流程" | ❓ 不明确 | 需定义 |
| **自动化测试指南** | "如何编写单元测试" | ❓ 可能在3-guides/testing | 需明确 |
| **测试数据管理** | "测试数据准备与清理规范" | ❓ 不明确 | 需定义 |

#### 2.3 建议的分类逻辑（待讨论）

| 层次 | 内容类型 | 建议位置 | 理由 |
|-----|---------|---------|------|
| **测试策略/方法论** | 测试金字塔、测试类型、质量目标 | `6-decisions/testing-strategy.md` 或 `5-wiki/testing/overview.md` | 战略决策 |
| **测试计划** | 版本测试计划、测试排期 | `4-planning/testing/` | 项目计划层面 |
| **测试规范** | 测试用例编写规范、命名规范 | `1-specs/testing/` | 技术规范层面 |
| **测试指南** | 如何编写单元测试、集成测试 | `3-guides/testing/` | 操作指南层面 |
| **测试领域知识** | 测试用例库使用、测试平台功能 | `5-wiki/testcase/` | 业务知识层面 |
| **测试结果/报告** | 测试执行报告、缺陷分析 | `7-archive/YYYY-QN/test-reports/` | 历史记录 |

## 对比分析

### 为什么有些领域标准清晰，有些不清晰？

**清晰的领域**:
- ✅ **产品需求** (2-requirements) - 软件工程成熟实践
- ✅ **架构决策** (6-decisions) - ADR是标准模式
- ✅ **项目计划** (4-planning) - 敏捷开发成熟实践

**不清晰的领域**:
- ⚠️  **代码结构** - 每个团队实践不同，缺乏统一标准
- ⚠️  **测试案例** - 测试文档分类复杂，边界模糊

**根本原因**:
1. **代码结构文档化**是开发实践细节，不同技术栈差异大
2. **测试文档**涉及多个层次（策略-计划-规范-执行-报告），交叉复杂
3. 现有标准更关注"产品视角"（需求、计划、决策），较少关注"工程实践视角"（代码、测试）

## 建议的解决方案

### 方案A：扩展现有层级（保守方案）

**优点**: 不破坏现有结构
**缺点**: 可能导致某些层级内容过于复杂

#### 针对代码结构

```
1-specs/
├─ architecture/          ⭐ 新增 - 架构设计规范
│   ├─ overview.md       # 整体架构
│   ├─ layered-design.md # 分层设计
│   └─ module-structure.md # 模块结构

3-guides/development/
├─ code-organization.md  ⭐ 新增 - 代码组织指南
├─ naming-conventions.md ⭐ 新增 - 命名规范
└─ package-structure.md  ⭐ 新增 - 包结构说明

5-wiki/architecture/
├─ module-boundaries.md  # 已存在 - 模块边界
└─ dependency-graph.md   ⭐ 新增 - 依赖关系
```

#### 针对测试案例

```
1-specs/testing/         ⭐ 新增 - 测试技术规范
├─ test-case-format.md   # 测试用例格式
├─ api-testing-spec.md   # API测试规范
└─ test-data-spec.md     # 测试数据规范

3-guides/testing/
├─ unit-testing.md       ⭐ 新增 - 单元测试指南
├─ integration-testing.md ⭐ 新增 - 集成测试指南
└─ e2e-testing.md        ⭐ 新增 - E2E测试指南

4-planning/testing/      ⭐ 新增 - 测试计划
├─ active/
│   └─ v2.0-test-plan.md
└─ completed/

5-wiki/testcase/
├─ overview.md           # 测试平台功能说明
└─ test-execution.md     # 测试执行知识

6-decisions/
└─ testing-strategy.md   ⭐ 新增 - 测试策略ADR

7-archive/YYYY-QN/
└─ test-reports/         ⭐ 新增 - 测试报告归档
```

### 方案B：创建专门章节（激进方案）

在 `directory-standards.md` 中增加两个专门章节：

```markdown
## 📦 代码结构文档化标准

### 分类逻辑
### 存放位置
### 命名规范
### 模板示例

## 🧪 测试文档化标准

### 测试文档分类
### 存放位置矩阵
### 命名规范
### 模板示例
```

**优点**: 集中管理，查阅方便
**缺点**: directory-standards.md 会变得很长

### 方案C：混合方案（推荐） ⭐

1. **在 directory-standards.md 中增加简要章节**
   - 定义代码结构文档的分类逻辑
   - 定义测试文档的分类逻辑
   - 提供决策树和快速查询表

2. **创建专门的详细文档**
   - `3-guides/development/code-documentation-guide.md` - 代码文档化完整指南
   - `3-guides/testing/test-documentation-guide.md` - 测试文档化完整指南

3. **扩展相关目录的 README.md**
   - `1-specs/README.md` - 说明architecture/和testing/子目录
   - `3-guides/development/README.md` - 索引所有开发指南
   - `3-guides/testing/README.md` - 索引所有测试指南

## 后续行动项

### 优先级P0（立即执行）

- [ ] **决定采用哪种方案**（A/B/C）
- [ ] **更新 directory-standards.md**
  - [ ] 增加"代码结构文档化"章节
  - [ ] 增加"测试文档化"章节
  - [ ] 更新决策树包含新文档类型

### 优先级P1（本周完成）

- [ ] **创建缺失的目录结构**
  - [ ] `1-specs/architecture/` + README.md
  - [ ] `1-specs/testing/` + README.md
  - [ ] `4-planning/testing/` + active/backlog/completed/
  - [ ] `7-archive/*/test-reports/`

- [ ] **编写核心指南文档**
  - [ ] `3-guides/development/code-documentation-guide.md`
  - [ ] `3-guides/testing/test-documentation-guide.md`

### 优先级P2（未来两周）

- [ ] **创建模板文件**
  - [ ] `1-specs/architecture/_template.md`
  - [ ] `1-specs/testing/_template-test-spec.md`
  - [ ] `4-planning/testing/_template-test-plan.md`

- [ ] **迁移现有文档到新结构**
  - [ ] 审查现有backend/frontend相关文档
  - [ ] 按新标准重新分类和组织

- [ ] **更新 write-standard-document skill**
  - [ ] 增加代码结构文档类型支持
  - [ ] 增加测试文档类型支持
  - [ ] 增加相应模板

### 优先级P3（长期改进）

- [ ] **创建合规性检查脚本**
  - [ ] 检查代码文档是否符合新标准
  - [ ] 检查测试文档是否符合新标准

- [ ] **编写最佳实践案例**
  - [ ] 展示优秀的代码结构文档示例
  - [ ] 展示优秀的测试文档示例

## 关键决策点

需要与用户确认的关键问题：

1. **代码结构文档的粒度**
   - 是否需要为每个主要模块创建独立的架构文档？
   - 还是只需要一个整体的架构overview？

2. **测试文档的详细程度**
   - 测试用例是否需要在文档中详细记录？
   - 还是只记录测试计划和测试策略，用例在测试平台管理？

3. **是否需要向后兼容**
   - 现有的backend/docs/中的文档如何处理？
   - 是否需要迁移还是保持现状？

4. **自动化程度**
   - 是否需要工具自动从代码生成部分文档？（如API文档）
   - 是否需要CI/CD集成检查文档完整性？

## 相关文档

- [现有文档标准](directory-standards.md) - v4.0
- [文档组织架构决策](6-decisions/2025-11-26-documentation-organization-architecture.md)
- [文档自动清理规则](claude-code-cleanup-rules.md)

---

**完成标准**:
完成上述P0和P1行动项后，将状态改为 "✅ 已完成"，然后运行 `/cleanup-docs archive`
