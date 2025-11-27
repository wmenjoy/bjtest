# 测试文档化完整指南

**版本**: 1.0
**最后更新**: 2025-11-27
**适用对象**: QA工程师、测试负责人、开发者
**难度**: 中级

---

## 概述

本指南提供完整的测试文档化工作流程，帮助团队系统地记录测试策略、计划、规范和结果。

### 本指南解决的问题

- ❓ 测试计划应该记录在哪里？
- ❓ 测试规范和测试指南有什么区别？
- ❓ 测试报告应该如何归档？
- ❓ 如何避免测试文档混乱？

### 前置条件

阅读本指南前，应先了解：
- [x] 项目的七层文档架构（`docs/directory-standards.md`）
- [x] 测试基础知识（单元测试、集成测试、E2E测试）
- [x] 测试平台的基本使用

---

## 快速参考：测试文档分类

| 文档类型 | 存放位置 | 何时创建 | 示例 |
|---------|---------|---------|------|
| **测试策略** | `6-decisions/` | 制定整体测试方法时 | `testing-strategy.md` |
| **测试计划** | `4-planning/testing/active/` | 版本开发开始时 | `v2.0-test-plan.md` |
| **测试规范** | `1-specs/testing/` | 定义技术标准时 | `test-case-format.md` |
| **测试指南** | `3-guides/testing/` | 编写操作指导时 | `unit-testing.md` |
| **测试知识库** | `5-wiki/testcase/` | 平台功能更新时 | `overview.md` |
| **测试报告** | `7-archive/YYYY-QN/test-reports/` | 测试完成时 | `v1.0-test-report.md` |

---

## 第一部分：测试文档化决策流程

### 决策树：我应该创建什么测试文档？

```
你要记录什么？
│
├─ 测试策略和方法论
│   ├─ 为什么采用这个测试策略？ → 6-decisions/testing-strategy.md
│   └─ 测试体系概览 → 5-wiki/testing/overview.md
│
├─ 某个版本的测试计划
│   ├─ 正在执行 → 4-planning/testing/active/v{X.Y}-test-plan.md
│   ├─ 计划未来 → 4-planning/testing/backlog/xxx-test-plan.md
│   └─ 已经完成 → 4-planning/testing/completed/YYYY-QN/xxx-test-plan.md
│
├─ 测试技术标准
│   ├─ 测试用例格式 → 1-specs/testing/test-case-format.md
│   ├─ API测试规范 → 1-specs/testing/api-testing-spec.md
│   └─ 测试数据规范 → 1-specs/testing/test-data-spec.md
│
├─ 如何编写和执行测试
│   ├─ 单元测试指南 → 3-guides/testing/unit-testing.md
│   ├─ 集成测试指南 → 3-guides/testing/integration-testing.md
│   └─ E2E测试指南 → 3-guides/testing/e2e-testing.md
│
├─ 测试平台使用知识
│   ├─ 平台功能 → 5-wiki/testcase/overview.md
│   └─ 测试执行流程 → 5-wiki/testcase/test-execution.md
│
└─ 测试执行结果
    └─ 测试报告 → 7-archive/YYYY-QN/test-reports/v{X.Y}-xxx-report.md
```

### 快速判断表

| 问题 | 答案 YES → | 答案 NO → |
|-----|-----------|----------|
| 这是战略层面的测试决策吗？ | `6-decisions/` | 继续下一题 |
| 这是版本测试计划吗？ | `4-planning/testing/` | 继续下一题 |
| 这是技术格式标准吗？ | `1-specs/testing/` | 继续下一题 |
| 这是操作指导吗？ | `3-guides/testing/` | 继续下一题 |
| 这是平台功能说明吗？ | `5-wiki/testcase/` | 继续下一题 |
| 这是测试结果报告吗？ | `7-archive/*/test-reports/` | 重新评估 |

---

## 第二部分：测试策略文档

### 2.1 何时创建测试策略文档？

**触发场景**：
1. 项目启动时 - 定义整体测试方法
2. 测试方法变更时 - 记录新的测试策略
3. 引入新测试工具时 - 记录工具选型决策

### 2.2 测试策略的两个层次

#### 层次1：测试策略决策 (ADR)

**位置**: `docs/6-decisions/`
**目的**: 记录**为什么**采用某个测试策略
**时机**: 做出决策时立即记录

**示例场景**：
```
场景: 团队决定采用测试金字塔模型

步骤1: 创建 ADR
文件: 6-decisions/testing-strategy.md

内容框架:
- 背景：当前测试覆盖不足
- 决策：采用测试金字塔（70%单元 + 20%集成 + 10%E2E）
- 备选方案：测试倒三角、全E2E测试
- 优缺点对比
- 预期效果：更快反馈、更低成本
```

**ADR模板**：
```markdown
# 测试策略：采用测试金字塔模型

**日期**: 2025-11-27
**状态**: Accepted
**决策者**: QA团队 + 技术负责人

## 背景

当前问题：
- E2E测试太多，执行时间长（30分钟+）
- 单元测试不足，缺陷发现太晚
- CI/CD流水线经常因测试超时失败

## 决策

采用测试金字塔模型：
- 70% 单元测试（快速、隔离）
- 20% 集成测试（关键路径）
- 10% E2E测试（核心业务流程）

## 目标

- 测试执行时间 < 10分钟
- 覆盖率 >= 80%
- 缺陷在单元测试阶段发现 >= 70%

## 实施计划

- [ ] 为核心模块补充单元测试
- [ ] 重构集成测试，提升独立性
- [ ] 精简E2E测试，只保留核心流程

## 相关文档

- [单元测试指南](../3-guides/testing/unit-testing.md)
- [测试计划](../4-planning/testing/active/test-coverage-improvement.md)
```

#### 层次2：测试知识库

**位置**: `docs/5-wiki/testing/`
**目的**: 记录测试体系的整体知识
**时机**: ADR批准后补充细节

**示例**: `5-wiki/testing/overview.md`

```markdown
# 测试体系概览

## 测试分层

### 单元测试（Unit Testing）

**定义**: 测试单个函数或类的行为

**特点**:
- ⚡ 执行快（毫秒级）
- 🔬 隔离性强（不依赖数据库、网络）
- 🎯 目标：代码逻辑正确性

**示例场景**:
- 测试Repository的CRUD方法
- 测试Service的业务逻辑
- 测试工具函数的计算结果

### 集成测试（Integration Testing）

**定义**: 测试多个模块协作的行为

**特点**:
- 🔄 涉及真实依赖（数据库、缓存）
- ⏱️ 执行较慢（秒级）
- 🎯 目标：模块间协作正确性

**示例场景**:
- 测试API端到端流程（Handler → Service → Repository → DB）
- 测试Workflow引擎执行
- 测试WebSocket消息流转

### E2E测试（End-to-End Testing）

**定义**: 从用户视角测试完整业务流程

**特点**:
- 👤 模拟真实用户操作
- 🐢 执行最慢（分钟级）
- 🎯 目标：核心业务流程可用

**示例场景**:
- 测试用户登录 → 创建测试用例 → 执行测试 → 查看结果
- 测试完整的Workflow编排流程

## 测试工具栈

| 层次 | 工具 | 用途 |
|-----|------|------|
| 单元测试 | Go testing, Jest | 快速验证代码逻辑 |
| 集成测试 | Testcontainers, SQLite | 集成依赖的测试 |
| E2E测试 | Playwright, Cypress | 模拟用户操作 |

## 质量目标

- 代码覆盖率: >= 80%
- 测试执行时间: < 10分钟
- 测试通过率: >= 95%
```

---

## 第三部分：测试计划文档

### 3.1 何时创建测试计划？

**触发场景**：
1. 版本开发启动时 - 创建版本测试计划
2. 专项测试需要时 - 创建性能/安全测试计划
3. 回归测试需要时 - 创建回归测试计划

### 3.2 测试计划的生命周期

```
backlog/           active/           completed/
(计划未来)          (正在执行)         (已经完成)
    │                  │                  │
    │  开始测试         │  测试完成         │
    └──────────────────┴──────────────────┘
```

### 3.3 版本测试计划创建步骤

**步骤1**: 创建测试计划文件

**位置**: `4-planning/testing/active/v2.0-test-plan.md`

**模板** (简化版):

```markdown
# v2.0 测试计划

**版本**: v2.0
**测试负责人**: 张三
**计划日期**: 2025-11-27
**预计完成**: 2025-12-15
**状态**: 🔄 进行中

## 1. 测试目标

验证v2.0版本的功能完整性和质量，确保可以安全发布。

## 2. 测试范围

### 功能范围
- [x] API中心功能
- [x] 权限模型升级
- [ ] Workflow引擎优化
- [ ] 性能优化

### 测试类型
- [x] 单元测试
- [x] 集成测试
- [x] 功能测试
- [ ] 性能测试（待定）

### 不测试内容
- 旧版本已废弃功能
- 第三方库内部逻辑

## 3. 测试进度

| 模块 | 负责人 | 状态 | 完成度 |
|-----|-------|------|-------|
| API中心 | 李四 | ✅ 完成 | 100% |
| 权限模型 | 王五 | 🔄 进行中 | 60% |
| Workflow | 张三 | ⏳ 待开始 | 0% |

## 4. 风险

| 风险 | 影响 | 缓解措施 |
|-----|------|---------|
| 测试环境不稳定 | 高 | 准备备用环境 |
| 测试数据不足 | 中 | 使用数据生成脚本 |

## 5. 退出标准

- [ ] P0/P1用例通过率 >= 95%
- [ ] 无阻塞性缺陷
- [ ] 代码覆盖率 >= 80%
- [ ] 性能回归测试通过

## 6. 相关文档

- [需求文档](../../2-requirements/prd/v2.0-features.md)
- [测试用例规范](../../1-specs/testing/test-case-format.md)
```

**步骤2**: 定期更新进度

- 每周更新"测试进度"部分
- 发现风险时及时添加到"风险"部分
- 状态变化时更新"状态"字段

**步骤3**: 测试完成后归档

```bash
# 标记状态为已完成
状态: ✅ 已完成

# 移动到completed目录
mv docs/4-planning/testing/active/v2.0-test-plan.md \
   docs/4-planning/testing/completed/2025-Q1/v2.0-test-plan.md
```

---

## 第四部分：测试规范文档

### 4.1 何时创建测试规范？

**触发场景**：
1. 项目启动时 - 定义测试用例格式
2. 测试平台升级时 - 更新测试用例规范
3. 发现格式不统一时 - 制定统一标准

### 4.2 核心测试规范文档

#### 规范1：测试用例格式

**位置**: `1-specs/testing/test-case-format.md`

**内容要点**:
- JSON schema定义
- 必填字段说明
- 字段验证规则
- 完整示例

**示例片段**:
```markdown
# 测试用例格式规范

## HTTP测试用例

### 必填字段

| 字段 | 类型 | 说明 | 示例 |
|-----|------|------|------|
| `test_id` | string | 唯一标识 | `"test-001"` |
| `name` | string | 测试名称 | `"测试用户登录"` |
| `type` | string | 必须为`"http"` | `"http"` |
| `http_config.url` | string | 请求URL | `"/api/v2/login"` |
| `http_config.method` | string | HTTP方法 | `"POST"` |

### 可选字段

| 字段 | 类型 | 默认值 | 说明 |
|-----|------|-------|------|
| `enabled` | boolean | `true` | 是否启用 |
| `timeout` | number | `30000` | 超时时间(ms) |

### 完整示例

\`\`\`json
{
  "test_id": "login-001",
  "name": "测试用户登录成功",
  "type": "http",
  "enabled": true,
  "http_config": {
    "url": "http://localhost:8090/api/v2/login",
    "method": "POST",
    "headers": {
      "Content-Type": "application/json"
    },
    "body": {
      "username": "admin",
      "password": "password123"
    }
  },
  "assertions": [
    {
      "type": "status",
      "operator": "equals",
      "expected": 200
    },
    {
      "type": "body",
      "operator": "contains",
      "expected": "token"
    }
  ]
}
\`\`\`
```

#### 规范2：API测试规范

**位置**: `1-specs/testing/api-testing-spec.md`

**内容要点**:
- 断言类型定义
- 操作符规范
- 错误处理标准

---

## 第五部分：测试指南文档

### 5.1 何时创建测试指南？

**触发场景**：
1. 新测试类型引入时 - 编写指南教团队使用
2. 新工具引入时 - 编写工具使用指南
3. 新人加入时 - 补充缺失的指南

### 5.2 核心测试指南文档

#### 指南1：单元测试指南

**位置**: `3-guides/testing/unit-testing.md`

**内容结构**:
```markdown
# 单元测试编写指南

## 什么是单元测试？

（简要说明）

## 环境准备

- 安装测试框架
- 配置测试命令

## 编写步骤

### 步骤1: 创建测试文件

### 步骤2: 编写测试用例

### 步骤3: 运行测试

## 最佳实践

1. 一个测试只验证一个功能点
2. 使用Mock隔离外部依赖
3. 测试命名清晰描述场景

## 常见错误

### 错误1: 测试包含外部依赖

❌ 错误示例：
\`\`\`go
func TestCreateUser(t *testing.T) {
    db := setupRealDatabase()  // 依赖真实数据库
    // ...
}
\`\`\`

✅ 正确示例：
\`\`\`go
func TestCreateUser(t *testing.T) {
    mockDB := &MockDatabase{}  // 使用Mock
    // ...
}
\`\`\`

## 相关文档

- [测试策略](../../6-decisions/testing-strategy.md)
- [测试用例格式](../../1-specs/testing/test-case-format.md)
```

#### 指南2：测试平台使用指南

**位置**: `3-guides/testing/test-platform-usage.md`

**内容要点**:
- 登录和权限
- 创建测试用例
- 执行测试
- 查看结果
- 故障排除

---

## 第六部分：测试报告文档

### 6.1 何时创建测试报告？

**触发场景**：
1. 版本测试完成时 - 生成测试总结报告
2. 专项测试完成时 - 生成性能/安全测试报告
3. 重大缺陷分析时 - 生成缺陷分析报告

### 6.2 测试报告创建和归档

**步骤1**: 创建测试报告

**位置**: 临时创建在 `docs/`根目录

**文件名**: `v2.0-functional-test-report.md`

**模板**:
```markdown
# v2.0 功能测试报告

**测试版本**: v2.0
**测试负责人**: 张三
**测试时间**: 2025-11-27 ~ 2025-12-15
**报告日期**: 2025-12-15

## 测试概要

- 测试用例总数: 150
- 执行用例数: 148
- 通过用例数: 145
- 失败用例数: 3
- 通过率: 98%

## 测试覆盖

| 模块 | 用例数 | 通过 | 失败 | 通过率 |
|-----|-------|------|------|-------|
| API中心 | 50 | 50 | 0 | 100% |
| 权限模型 | 40 | 39 | 1 | 97.5% |
| Workflow | 58 | 56 | 2 | 96.6% |

## 缺陷统计

| 严重级别 | 数量 | 已修复 | 待修复 |
|---------|------|-------|-------|
| Blocker | 0 | 0 | 0 |
| Critical | 1 | 1 | 0 |
| Major | 5 | 4 | 1 |
| Minor | 8 | 6 | 2 |

## 关键缺陷

### BUG-001: Workflow步骤执行顺序错误

- **严重级别**: Critical
- **状态**: ✅ 已修复
- **影响**: Workflow执行结果错误
- **修复方案**: 修正DAG拓扑排序逻辑

## 测试结论

✅ **建议发布**

理由：
- 无阻塞性缺陷
- 通过率达标（>= 95%）
- 剩余缺陷影响较小

## 风险提示

⚠️ **Minor级别缺陷遗留**

- BUG-015: UI样式问题
- BUG-022: 日志格式不统一

## 改进建议

1. 增加Workflow的单元测试覆盖率
2. 补充权限模型的边界场景测试
3. 优化测试数据准备流程

## 附录

- [测试计划](../4-planning/testing/active/v2.0-test-plan.md)
- [缺陷列表](./bug-list-v2.0.xlsx)
```

**步骤2**: 归档测试报告

```bash
# 确定归档季度
当前: 2025-12-15 → 归档到 2025-Q4

# 移动到archive目录
mv docs/v2.0-functional-test-report.md \
   docs/7-archive/2025-Q4/test-reports/v2.0-functional-test-report.md

# 更新归档README
echo "- v2.0功能测试报告 (2025-12-15)" >> \
  docs/7-archive/2025-Q4/test-reports/README.md
```

---

## 第七部分：测试文档维护工作流

### 7.1 版本测试完整工作流

```
版本开发启动
    ↓
1. 创建测试计划 (4-planning/testing/active/v{X.Y}-test-plan.md)
    ↓
2. 编写测试用例 (按1-specs/testing/规范编写)
    ↓
3. 执行测试 (定期更新测试计划进度)
    ↓
4. 测试完成
    ↓
5. 创建测试报告 (docs/v{X.Y}-test-report.md)
    ↓
6. 归档测试计划和报告 (7-archive/YYYY-QN/test-reports/)
```

### 7.2 测试文档审查清单

创建测试文档后，使用此清单审查：

- [ ] **正确的位置**: 文档是否放在正确的目录？
- [ ] **遵循规范**: 是否使用标准模板？
- [ ] **完整的元数据**: 版本、日期、负责人都有吗？
- [ ] **清晰的指标**: 测试计划是否有明确的退出标准？
- [ ] **关联文档**: 是否链接到需求和规范文档？

---

## 第八部分：常见场景示例

### 场景1: 版本测试全流程

**步骤1**: 版本开发启动，创建测试计划
```
文件: 4-planning/testing/active/v2.0-test-plan.md
内容: 测试范围、进度、风险、退出标准
```

**步骤2**: 根据规范编写测试用例
```
参考: 1-specs/testing/test-case-format.md
在平台: 创建HTTP/Command/Workflow测试用例
```

**步骤3**: 执行测试，每周更新计划
```
更新: 测试进度表、风险列表
状态: 🔄 进行中
```

**步骤4**: 测试完成，创建报告
```
文件: docs/v2.0-functional-test-report.md
内容: 测试概要、缺陷统计、测试结论
```

**步骤5**: 归档计划和报告
```
移动: 4-planning/testing/active/v2.0-test-plan.md
  → 4-planning/testing/completed/2025-Q1/v2.0-test-plan.md

移动: docs/v2.0-functional-test-report.md
  → 7-archive/2025-Q1/test-reports/v2.0-functional-test-report.md
```

### 场景2: 引入自动化测试

**步骤1**: 创建测试策略ADR
```
文件: 6-decisions/test-automation-decision.md
内容: 为什么选择Playwright进行E2E自动化
```

**步骤2**: 更新测试知识库
```
文件: 5-wiki/testing/overview.md
内容: 增加E2E测试说明和工具栈
```

**步骤3**: 编写E2E测试指南
```
文件: 3-guides/testing/e2e-testing.md
内容: 如何使用Playwright编写E2E测试
```

### 场景3: 性能测试专项

**步骤1**: 创建性能测试计划
```
文件: 4-planning/testing/active/performance-test-plan.md
内容: 性能测试场景、目标、工具
```

**步骤2**: 执行性能测试

**步骤3**: 创建性能测试报告
```
文件: docs/v2.0-performance-test-report.md
内容: 响应时间、并发能力、瓶颈分析
```

**步骤4**: 归档报告
```
移动: → 7-archive/2025-Q1/test-reports/v2.0-performance-test-report.md
```

---

## 第九部分：最佳实践

### 9.1 测试文档编写原则

1. **及时性**: 测试计划在开发启动时创建
2. **准确性**: 测试报告基于真实数据
3. **完整性**: 测试计划包含所有必要信息
4. **可追溯性**: 测试用例关联需求文档

### 9.2 常见反模式

| 反模式 | 问题 | 正确做法 |
|--------|------|---------|
| **测试后补文档** | 文档流于形式 | 测试前创建计划 |
| **文档不更新** | 进度不透明 | 定期更新测试计划 |
| **报告藏在聊天工具** | 无法追溯 | 归档到7-archive/ |
| **规范和实践脱节** | 文档无效 | 规范和指南配套 |

### 9.3 测试文档的价值

**短期价值**:
- 指导测试执行
- 追踪测试进度
- 评估发布风险

**长期价值**:
- 历史对比分析
- 质量趋势追踪
- 新人培训材料

---

## 附录A：测试文档模板清单

### 测试策略ADR模板
- 位置: `6-decisions/_template-testing.md`
- 用途: 记录测试方法论决策

### 测试计划模板
- 位置: `4-planning/testing/_template-test-plan.md`
- 用途: 版本测试计划

### 测试规范模板
- 位置: `1-specs/testing/_template-spec.md`
- 用途: 测试技术规范

### 测试报告模板
- 位置: `7-archive/_template-test-report.md`
- 用途: 测试总结报告

---

## 附录B：相关文档

- [文档标准](../../directory-standards.md) - 完整的文档组织规范
- [测试技术规范](../../1-specs/testing/README.md) - 测试格式标准
- [测试计划说明](../../4-planning/testing/README.md) - 测试计划管理
- [测试平台功能](../../5-wiki/testcase/overview.md) - 测试平台使用

---

## 附录C：故障排除

### 问题1: 不知道测试文档应该放哪？

**解决方案**: 使用决策树（第一部分）或查看快速判断表

### 问题2: 测试计划太复杂，不知如何简化？

**解决方案**:
- 使用模板的简化版（只保留核心部分）
- 小版本测试计划可以合并
- 回归测试计划可以复用

### 问题3: 测试报告写完就忘了？

**解决方案**:
- 及时归档到7-archive/
- 在归档README中添加索引
- 定期回顾历史报告，总结经验

---

**维护者**: QA团队负责人、测试工程师
**反馈**: 如有问题请联系QA负责人
**最后审核**: 2025-11-27
