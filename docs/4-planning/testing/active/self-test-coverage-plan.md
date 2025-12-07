# 平台自测覆盖率提升计划

**计划类型**: 测试覆盖率提升计划
**计划编号**: TEST-PLAN-2025-Q1
**计划周期**: 2025-11-27 ~ 2026-02-28 (3个月)
**计划状态**: Active
**负责人**: QA团队

---

## 📋 计划概述

本计划旨在提升测试管理平台的测试覆盖率，基于[测试策略](../../../6-decisions/testing-strategy.md)中定义的测试金字塔模型，系统性地补充单元测试、集成测试和E2E测试。

### 计划目标

| 目标 | 当前 | 目标 | 完成期限 |
|-----|------|------|---------|
| **后端单元测试覆盖率** | ~20% | ≥60% | 2026-01-31 |
| **后端集成测试覆盖率** | ~40% | ≥30% | 2026-01-31 |
| **前端组件测试覆盖率** | ~10% | ≥60% | 2026-02-15 |
| **E2E测试覆盖率** | ~15% | ≥10% | 2026-02-28 |
| **整体代码覆盖率** | ~25% | ≥75% | 2026-02-28 |

### 质量门禁

- ✅ 核心业务逻辑覆盖率 ≥ 80%
- ✅ 所有新增代码必须有测试
- ✅ PR合并前覆盖率不能下降
- ✅ 平台自测用例100%通过

---

## 📊 当前测试覆盖现状

### 1. E2E测试现状

#### 平台自测用例（已完成）

| 测试套件 | 文件 | 步骤数 | 状态 | 覆盖模块 |
|---------|------|-------|------|---------|
| TestGroup API | self-test-testgroup-api.json | 15 | ✅ 完成 | 测试组CRUD、树形结构 |
| TestCase API | self-test-testcase-api.json | 13 | ✅ 完成 | 测试用例CRUD、搜索 |
| Platform Integration | self-test-platform.json | 16 | ✅ 完成 | 端到端集成流程 |
| Action Features | self-test-actions.json | 8 | ✅ 完成 | 工作流动作功能 |
| Environment API | self-test-environment-api.json | 17 | ✅ 完成 | 环境管理CRUD |
| Workflow Execution | self-test-workflow-execution-api.json | 15 | ✅ 完成 | 工作流执行引擎 |
| Test Results | self-test-results-api.json | 9 | ✅ 完成 | 测试结果查询 |

**总计**: 93个测试步骤 ✅ 已完成

**覆盖功能**:
- ✅ 测试组管理（CRUD、层级结构）
- ✅ 测试用例管理（CRUD、搜索、分页）
- ✅ 环境管理（CRUD、激活切换）
- ✅ 工作流执行（HTTP、Command、TestCase动作）
- ✅ 测试结果查询（按状态、时间范围）
- ✅ 端到端集成流程

**未覆盖功能**:
- ❌ WebSocket实时推送测试
- ❌ 多租户隔离验证
- ❌ 价值评分功能测试
- ❌ 性能测试（并发、大数据量）
- ❌ 错误场景测试（4xx、5xx）

### 2. 后端测试现状

#### 单元测试覆盖情况

| 模块 | 当前覆盖率 | 目标覆盖率 | 缺口 | 优先级 |
|-----|-----------|-----------|------|--------|
| **Service层** | ~15% | ≥80% | -65% | P0 |
| `testcase/executor.go` | ~10% | ≥90% | -80% | P0 |
| `workflow/executor.go` | ~20% | ≥90% | -70% | P0 |
| `workflow/variable_resolver.go` | ~5% | ≥90% | -85% | P0 |
| **Repository层** | ~25% | ≥60% | -35% | P1 |
| **Handler层** | ~30% | ≥70% | -40% | P1 |
| **工具函数** | ~40% | ≥90% | -50% | P0 |

**评估**: 单元测试严重不足，核心业务逻辑缺少覆盖

#### 集成测试覆盖情况

| 测试类型 | 当前状态 | 目标 | 缺口 |
|---------|---------|------|------|
| **HTTP API端点** | 部分覆盖 | 100% | 约40% |
| **WebSocket集成** | 未覆盖 | 100% | 100% |
| **数据库操作** | 部分覆盖 | 80% | 约50% |
| **工作流DAG解析** | 未覆盖 | 100% | 100% |

**评估**: 集成测试覆盖不均衡，WebSocket和Workflow引擎缺少测试

### 3. 前端测试现状

#### 组件测试覆盖情况

| 组件 | 当前覆盖率 | 目标覆盖率 | 缺口 | 优先级 |
|-----|-----------|-----------|------|--------|
| `TestCaseManager.tsx` | 0% | ≥70% | -70% | P0 |
| `WorkflowBuilder.tsx` | 0% | ≥70% | -70% | P0 |
| `Dashboard.tsx` | 0% | ≥60% | -60% | P1 |
| `useTestCases` Hook | 0% | ≥80% | -80% | P0 |
| `useWorkflowExecution` Hook | 0% | ≥80% | -80% | P0 |

**评估**: 前端测试几乎空白，急需补充

---

## 🎯 测试补充计划

### Phase 1: 核心业务逻辑单元测试 (Week 1-4)

**目标**: 为核心业务逻辑补充单元测试，覆盖率达到60%

#### 1.1 测试执行引擎 (Week 1-2)

**文件**: `backend/internal/testcase/executor.go`

**待补充测试**:

| 测试场景 | 函数 | 优先级 | 工作量 |
|---------|------|--------|--------|
| HTTP测试执行 - 成功场景 | `executeHTTP()` | P0 | 2小时 |
| HTTP测试执行 - 超时场景 | `executeHTTP()` | P0 | 1小时 |
| HTTP测试执行 - 网络错误 | `executeHTTP()` | P1 | 1小时 |
| Command测试执行 - 成功场景 | `executeCommand()` | P0 | 2小时 |
| Command测试执行 - 超时场景 | `executeCommand()` | P0 | 1小时 |
| 状态码断言验证 | `checkStatusCode()` | P0 | 1小时 |
| JSONPath断言验证 | `checkJSONPath()` | P0 | 2小时 |
| Workflow测试执行 - Mode 1 | `executeWorkflowTest()` | P0 | 2小时 |
| Workflow测试执行 - Mode 2 | `executeWorkflowTest()` | P0 | 2小时 |
| 生命周期Hook执行 | `executeSetupHooks()`, `executeTeardownHooks()` | P1 | 3小时 |

**预期覆盖率**: executor.go: 85%

#### 1.2 工作流引擎 (Week 2-3)

**文件**: `backend/internal/workflow/executor.go`

**待补充测试**:

| 测试场景 | 函数 | 优先级 | 工作量 |
|---------|------|--------|--------|
| DAG解析和层级划分 | `buildDAG()` | P0 | 3小时 |
| 并行步骤执行 | `executeLayer()` | P0 | 3小时 |
| 步骤依赖验证 | `validateDependencies()` | P0 | 2小时 |
| 错误处理策略 - abort | `handleStepError()` | P0 | 2小时 |
| 错误处理策略 - continue | `handleStepError()` | P0 | 2小时 |
| 重试机制 | `executeStepWithRetry()` | P1 | 2小时 |
| 超时控制 | `executeWithTimeout()` | P1 | 1小时 |

**预期覆盖率**: executor.go: 80%

#### 1.3 变量解析器 (Week 3)

**文件**: `backend/internal/workflow/variable_resolver.go`

**待补充测试**:

| 测试场景 | 函数 | 优先级 | 工作量 |
|---------|------|--------|--------|
| 简单变量替换 | `Resolve()` | P0 | 1小时 |
| 嵌套变量替换 | `Resolve()` | P0 | 1小时 |
| JSONPath表达式解析 | `resolveJSONPath()` | P0 | 2小时 |
| DataMapper转换 - toString | `applyTransform()` | P0 | 1小时 |
| DataMapper转换 - toNumber | `applyTransform()` | P0 | 1小时 |
| DataMapper转换 - toDate | `applyTransform()` | P1 | 1小时 |
| 循环引用检测 | `detectCircularRef()` | P1 | 2小时 |

**预期覆盖率**: variable_resolver.go: 90%

#### 1.4 Service层业务逻辑 (Week 4)

**文件**: `backend/internal/service/*.go`

**待补充测试**:

| 测试场景 | Service | 优先级 | 工作量 |
|---------|---------|--------|--------|
| 创建测试用例 - 成功 | `TestCaseService.CreateTestCase()` | P0 | 2小时 |
| 创建测试用例 - 重复ID | `TestCaseService.CreateTestCase()` | P0 | 1小时 |
| 创建测试用例 - 测试组不存在 | `TestCaseService.CreateTestCase()` | P1 | 1小时 |
| 执行测试用例 | `TestCaseService.ExecuteTestCase()` | P0 | 2小时 |
| 更新测试统计 | `TestCaseService.UpdateStatistics()` | P1 | 2小时 |
| 价值评分计算 | `ScoringService.CalculateScore()` | P1 | 3小时 |

**预期覆盖率**: service层: 70%

**Phase 1 总工作量**: 约50小时 (1人月)

---

### Phase 2: 集成测试补充 (Week 5-8)

**目标**: 补充关键集成测试，覆盖率达到30%

#### 2.1 HTTP API集成测试 (Week 5-6)

**待补充测试**:

| API端点 | 场景 | 优先级 | 工作量 |
|---------|------|--------|--------|
| POST /api/v2/test-cases | 创建测试用例 | P0 | 2小时 |
| GET /api/v2/test-cases/:id | 获取测试用例 | P0 | 1小时 |
| PUT /api/v2/test-cases/:id | 更新测试用例 | P0 | 1小时 |
| DELETE /api/v2/test-cases/:id | 删除测试用例 | P0 | 1小时 |
| POST /api/v2/test-cases/:id/execute | 执行测试 | P0 | 3小时 |
| POST /api/v2/workflows/execute | 执行工作流 | P0 | 3小时 |
| GET /api/v2/workflows/runs/:runId | 获取执行结果 | P0 | 1小时 |

**测试工具**: `httptest`, `testify/assert`

**预期覆盖率**: HTTP API: 80%

#### 2.2 WebSocket集成测试 (Week 6-7)

**待补充测试**:

| 测试场景 | 描述 | 优先级 | 工作量 |
|---------|------|--------|--------|
| WebSocket连接建立 | 验证握手协议 | P0 | 2小时 |
| 消息广播 - 单个Client | 验证消息推送 | P0 | 2小时 |
| 消息广播 - 多个Client | 验证分组推送 | P0 | 3小时 |
| 心跳检测 | 验证ping-pong机制 | P1 | 2小时 |
| 慢客户端断开 | 验证缓冲区溢出处理 | P1 | 2小时 |
| 连接清理 | 验证资源释放 | P1 | 2小时 |

**测试工具**: `gorilla/websocket`, 自定义测试客户端

**预期覆盖率**: WebSocket: 85%

#### 2.3 数据库集成测试 (Week 7-8)

**待补充测试**:

| 测试场景 | 描述 | 优先级 | 工作量 |
|---------|------|--------|--------|
| Repository CRUD | 验证基本数据操作 | P0 | 3小时 |
| 事务管理 | 验证事务回滚 | P0 | 2小时 |
| 并发写入 | 验证数据一致性 | P1 | 3小时 |
| 软删除 | 验证DeletedAt字段 | P1 | 1小时 |
| 外键约束 | 验证级联删除 | P1 | 2小时 |

**测试工具**: SQLite内存数据库, GORM

**预期覆盖率**: Repository层: 75%

**Phase 2 总工作量**: 约40小时

---

### Phase 3: 前端测试补充 (Week 9-12)

**目标**: 补充前端组件测试，覆盖率达到60%

#### 3.1 核心组件测试 (Week 9-10)

**待补充测试**:

| 组件 | 测试场景 | 优先级 | 工作量 |
|-----|---------|--------|--------|
| `TestCaseManager` | 渲染测试 | P0 | 2小时 |
| `TestCaseManager` | 创建测试用例交互 | P0 | 3小时 |
| `TestCaseManager` | 编辑测试用例交互 | P0 | 2小时 |
| `TestCaseManager` | 删除测试用例交互 | P0 | 2小时 |
| `WorkflowBuilder` | 渲染测试 | P0 | 2小时 |
| `WorkflowBuilder` | 添加步骤交互 | P0 | 3小时 |
| `WorkflowBuilder` | 连接步骤交互 | P0 | 3小时 |
| `Dashboard` | 渲染测试 | P1 | 2小时 |
| `Dashboard` | 数据展示 | P1 | 2小时 |

**测试工具**: Jest, React Testing Library

**预期覆盖率**: 核心组件: 70%

#### 3.2 Hook测试 (Week 11)

**待补充测试**:

| Hook | 测试场景 | 优先级 | 工作量 |
|-----|---------|--------|--------|
| `useTestCases` | 获取测试用例列表 | P0 | 2小时 |
| `useTestCases` | 创建测试用例 | P0 | 2小时 |
| `useTestCases` | 更新测试用例 | P0 | 2小时 |
| `useWorkflowExecution` | 执行工作流 | P0 | 3小时 |
| `useWorkflowExecution` | WebSocket监听 | P0 | 3小时 |

**测试工具**: @testing-library/react-hooks

**预期覆盖率**: Hooks: 80%

#### 3.3 集成测试 (Week 12)

**待补充测试**:

| 测试场景 | 描述 | 优先级 | 工作量 |
|---------|------|--------|--------|
| 测试用例创建流程 | 表单填写 + API调用 | P0 | 3小时 |
| 测试执行 + 日志展示 | WebSocket + UI更新 | P0 | 4小时 |
| 路由导航 | 页面跳转和状态保持 | P1 | 2小时 |

**测试工具**: MSW (Mock Service Worker)

**预期覆盖率**: 前端集成: 60%

**Phase 3 总工作量**: 约45小时

---

### Phase 4: E2E测试补充 (Week 13-16)

**目标**: 补充关键用户流程E2E测试

#### 4.1 新增E2E测试场景

| 测试场景 | 描述 | 优先级 | 工作量 |
|---------|------|--------|--------|
| WebSocket实时推送 | 验证实时日志展示 | P0 | 4小时 |
| 多租户隔离 | 验证数据隔离 | P0 | 3小时 |
| 价值评分 | 验证评分计算和展示 | P1 | 3小时 |
| 错误处理 - 400 | 验证参数错误提示 | P1 | 2小时 |
| 错误处理 - 404 | 验证资源不存在提示 | P1 | 2小时 |
| 错误处理 - 409 | 验证冲突处理 | P1 | 2小时 |
| 性能测试 - 并发 | 100并发测试执行 | P2 | 4小时 |
| 性能测试 - 大数据量 | 1000+测试用例 | P2 | 3小时 |

**测试工具**: Playwright, 自测用例框架

**预期新增**: 8个E2E测试场景

**Phase 4 总工作量**: 约23小时

---

## 📅 执行时间表

### 里程碑计划

| 里程碑 | 目标 | 完成日期 | 负责人 |
|--------|------|---------|--------|
| **M1: 单元测试基础** | 后端核心模块覆盖率≥60% | 2026-01-15 | Backend团队 |
| **M2: 集成测试完善** | 集成测试覆盖率≥30% | 2026-01-31 | Backend团队 |
| **M3: 前端测试建立** | 前端组件覆盖率≥60% | 2026-02-15 | Frontend团队 |
| **M4: E2E测试增强** | E2E测试场景补充完成 | 2026-02-28 | QA团队 |

### 每周计划 (16周)

| 周次 | 阶段 | 主要任务 | 产出 |
|-----|------|---------|------|
| W1-W2 | Phase 1.1 | 测试执行引擎单元测试 | executor.go: 85%覆盖率 |
| W3-W4 | Phase 1.2-1.3 | 工作流引擎+变量解析器 | workflow: 85%覆盖率 |
| W5-W6 | Phase 1.4 + 2.1 | Service层+HTTP API | service: 70%, API: 80% |
| W7-W8 | Phase 2.2-2.3 | WebSocket+数据库集成 | WebSocket: 85%, DB: 75% |
| W9-W10 | Phase 3.1 | 核心组件测试 | 组件: 70%覆盖率 |
| W11-W12 | Phase 3.2-3.3 | Hook+前端集成测试 | Hook: 80%, 集成: 60% |
| W13-W14 | Phase 4.1 | E2E测试补充 | +4个E2E场景 |
| W15-W16 | 收尾优化 | 修复Flaky测试，优化CI | CI执行<5分钟 |

---

## 🎯 成功指标

### 覆盖率目标

| 指标 | 基线 | 目标 | 当前 | 达标 |
|-----|------|------|------|------|
| **后端单元测试** | 20% | 60% | - | ⏳ |
| **后端集成测试** | 40% | 30% | - | ⏳ |
| **前端组件测试** | 10% | 60% | - | ⏳ |
| **E2E测试场景** | 93步骤 | +8场景 | - | ⏳ |
| **整体覆盖率** | 25% | 75% | - | ⏳ |

### 质量指标

| 指标 | 目标 | 测量方式 |
|-----|------|---------|
| **测试通过率** | 100% | CI每次构建 |
| **Flaky测试率** | <2% | 统计测试波动 |
| **测试执行时间** | <5分钟 | CI Pipeline时长 |
| **Bug逃逸率** | <5% | 生产环境Bug统计 |

---

## 🛠️ 测试工具和环境

### 测试工具

| 类型 | 工具 | 用途 |
|-----|------|------|
| **后端单元** | Go testing, testify | 单元测试框架 |
| **后端集成** | httptest, SQLite内存库 | API和数据库测试 |
| **前端组件** | Jest, RTL | 组件测试 |
| **前端集成** | MSW | API Mock |
| **E2E** | Playwright, 自测框架 | 端到端测试 |
| **覆盖率** | go tool cover, Jest coverage | 覆盖率统计 |

### CI/CD配置

**测试执行策略**:
```yaml
# 本地开发: 单元测试
make test-unit

# PR提交: 单元+集成
make test-integration

# 合并main: 全量测试
make test-all

# 每日构建: 全量+E2E
make test-e2e
```

**覆盖率报告**:
- 每次PR自动生成覆盖率报告
- 覆盖率下降则CI失败
- 每周发布覆盖率趋势图

---

## 🚧 风险和缓解

### 风险1: 测试编写工作量超预期

**概率**: 高
**影响**: 中

**缓解措施**:
- ✅ 优先完成P0测试
- ✅ 并行执行（后端+前端团队）
- ✅ 复用测试辅助函数减少重复
- ✅ 必要时调整时间表

### 风险2: 现有代码不易测试

**概率**: 中
**影响**: 高

**缓解措施**:
- ✅ 识别需要重构的代码
- ✅ 先重构再测试（小步快跑）
- ✅ 使用依赖注入提升可测试性
- ✅ 记录技术债务

### 风险3: Flaky测试影响CI

**概率**: 中
**影响**: 高

**缓解措施**:
- ✅ 避免硬编码等待时间
- ✅ 使用条件等待（assert.Eventually）
- ✅ 隔离测试数据
- ✅ 建立Flaky测试监控

---

## 📊 进度跟踪

### 每周检查点

**每周五下午4:00** - 进度同步会议

**检查内容**:
- ✅ 本周完成的测试数量
- ✅ 覆盖率增长情况
- ✅ 遇到的技术难题
- ✅ 下周计划调整

### 月度审查

**每月最后一个周五** - 月度总结会议

**审查内容**:
- ✅ 里程碑达成情况
- ✅ 覆盖率趋势分析
- ✅ 质量指标评估
- ✅ 风险和问题汇总

---

## 📚 相关文档

### 测试策略和规范
- [测试策略ADR](../../../6-decisions/testing-strategy.md) - 测试金字塔和工具选型
- [测试用例格式规范](../../../1-specs/testing/test-case-format.md) - 测试用例JSON格式
- [API测试规范](../../../1-specs/testing/api-testing-spec.md) - API测试技术规范
- [测试文档化指南](../../../3-guides/testing/test-documentation-guide.md) - 测试文档编写

### 平台自测
- [平台自测用例](../../../5-wiki/testcase/platform-self-tests.md) - 93个自测步骤详细说明

### 开发指南
- [后端分层架构](../../../1-specs/architecture/backend-layered-design.md) - 三层架构设计
- [命名规范](../../../3-guides/development/naming-conventions.md) - 代码命名规范

---

## 📝 变更历史

| 日期 | 版本 | 变更内容 | 变更人 |
|-----|------|---------|--------|
| 2025-11-27 | 1.0 | 初始计划 | QA团队 |

---

**计划批准**:
- [x] QA负责人：已批准
- [x] 技术负责人：已批准
- [x] 项目经理：已批准

**下次审查**: 2026-01-31 (M2里程碑)
