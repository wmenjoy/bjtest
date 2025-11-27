# 测试策略决策

**决策类型**: 架构决策记录 (ADR)
**决策编号**: ADR-002
**决策日期**: 2025-11-27
**决策状态**: Accepted
**决策者**: 架构团队、QA团队

---

## 上下文和问题陈述

测试管理平台作为一个企业级测试平台，自身的质量保证至关重要。我们需要确定：

1. **采用何种测试模型**？测试金字塔、测试菱形还是测试冰淇淋？
2. **各类测试的比例**？单元测试、集成测试、E2E测试的分配？
3. **测试覆盖率目标**？需要达到什么水平才能保证质量？
4. **测试工具选型**？Go生态和前端生态中选择哪些工具？

**面临的挑战**:
- 项目同时包含后端（Go）和前端（React）
- 测试平台本身需要测试（Meta测试问题）
- 需要快速迭代同时保证质量
- 团队规模有限，测试成本需要控制

---

## 决策驱动因素

### 质量要求
- ✅ **高可靠性**：测试平台崩溃会影响所有测试
- ✅ **功能正确性**：测试结果必须准确
- ✅ **性能稳定性**：支持并发测试执行

### 技术因素
- Go语言的单元测试原生支持良好
- React组件测试工具成熟（Jest、React Testing Library）
- WebSocket、Workflow等复杂逻辑需要集成测试
- 端到端测试成本高但价值明确

### 资源约束
- 团队规模：小型团队（2-4人）
- 时间压力：快速迭代需求
- CI/CD环境：GitHub Actions或GitLab CI

---

## 考虑的方案

### 方案1：测试金字塔（Test Pyramid）

**结构**:
```
        /\
       /  \      E2E Tests (10%)
      /    \
     /------\    Integration Tests (30%)
    /        \
   /----------\  Unit Tests (60%)
  /____________\
```

**优点**:
- ✅ 单元测试快速、稳定、成本低
- ✅ 测试反馈周期短
- ✅ 易于定位问题根因
- ✅ 适合TDD开发方式

**缺点**:
- ❌ 可能忽视系统集成问题
- ❌ E2E测试覆盖不足

### 方案2：测试菱形（Test Diamond）

**结构**:
```
      /\
     /  \      E2E Tests (10%)
    /    \
   /------\    Integration Tests (60%)
   \      /
    \    /     Unit Tests (30%)
     \  /
      \/
```

**优点**:
- ✅ 强调集成测试，更贴近实际使用
- ✅ 能发现更多接口契约问题

**缺点**:
- ❌ 集成测试维护成本高
- ❌ 测试执行时间长
- ❌ 定位问题困难

### 方案3：测试冰淇淋（Test Ice Cream Cone）

**结构**:
```
  ____________
  \          /  E2E Tests (60%)
   \        /
    \------/    Integration Tests (30%)
     \    /
      \  /      Unit Tests (10%)
       \/
```

**优点**:
- ✅ 最接近用户视角

**缺点**:
- ❌ E2E测试成本极高
- ❌ 执行时间长
- ❌ Flaky测试多
- ❌ 不适合快速迭代

---

## 决策结果

### 选择方案1：测试金字塔模型

**理由**:
1. **符合快速迭代需求**：单元测试执行快，反馈周期短
2. **成本可控**：小团队能够维护
3. **质量可靠**：单元测试覆盖核心逻辑，集成测试验证交互
4. **行业最佳实践**：被广泛验证的成熟模式

### 测试比例目标

#### 后端测试（Go）

| 测试类型 | 目标比例 | 典型场景 | 工具 |
|---------|---------|----------|------|
| **单元测试** | 60% | Service层业务逻辑、Repository层数据访问、工具函数 | Go testing, testify |
| **集成测试** | 30% | HTTP API端点、数据库操作、WebSocket连接 | Go testing, httptest |
| **E2E测试** | 10% | 完整测试执行流程、工作流编排 | 自测用例 |

**单元测试示例场景**:
- ✅ `TestCaseService.CreateTestCase()` - 业务逻辑验证
- ✅ `TestCaseRepository.GetByID()` - 数据访问验证
- ✅ `VariableResolver.Resolve()` - 变量解析逻辑
- ✅ `checkStatusCode()` - 断言验证逻辑

**集成测试示例场景**:
- ✅ `POST /api/v2/test-cases` - HTTP API端点
- ✅ WebSocket消息广播 - Hub和Client集成
- ✅ 工作流DAG解析和执行 - Workflow Engine
- ✅ 数据库事务处理 - GORM集成

**E2E测试示例场景**:
- ✅ 平台自测用例（93个测试步骤）
- ✅ 工作流完整执行流程
- ✅ 多租户数据隔离验证

#### 前端测试（React）

| 测试类型 | 目标比例 | 典型场景 | 工具 |
|---------|---------|----------|------|
| **组件测试** | 60% | UI组件逻辑、状态管理、事件处理 | Jest, RTL |
| **集成测试** | 30% | 页面交互流程、API调用、路由跳转 | Jest, RTL, MSW |
| **E2E测试** | 10% | 用户完整操作流程 | Playwright |

**组件测试示例场景**:
- ✅ `TestCaseManager` 组件渲染测试
- ✅ `WorkflowBuilder` 组件交互测试
- ✅ `useTestCases` Hook测试
- ✅ 表单验证逻辑测试

**集成测试示例场景**:
- ✅ 测试用例创建流程（表单填写 + API调用）
- ✅ 测试执行 + 实时日志展示（WebSocket）
- ✅ 页面路由导航和状态保持

**E2E测试示例场景**:
- ✅ 完整测试用例生命周期（创建、执行、查看结果）
- ✅ 工作流可视化构建和执行
- ✅ 多环境切换测试

---

## 测试覆盖率目标

### 代码覆盖率

| 模块 | 目标覆盖率 | 强制要求 | 说明 |
|-----|-----------|---------|------|
| **核心业务逻辑** | ≥ 80% | ✅ 是 | Service层、Workflow引擎 |
| **HTTP Handler层** | ≥ 70% | ✅ 是 | API端点 |
| **Repository层** | ≥ 60% | ❌ 否 | 数据访问逻辑 |
| **工具函数** | ≥ 90% | ✅ 是 | 变量解析、断言验证 |
| **前端组件** | ≥ 70% | ✅ 是 | 核心UI组件 |

### 功能覆盖率

| 功能模块 | 覆盖要求 | 测试类型 |
|---------|---------|----------|
| **测试用例CRUD** | 100% | 单元 + 集成 |
| **测试执行引擎** | 100% | 单元 + 集成 |
| **工作流引擎** | 100% | 单元 + 集成 + E2E |
| **WebSocket推送** | 100% | 集成 + E2E |
| **多租户隔离** | 100% | 集成 |
| **价值评分** | 80% | 单元 |

### 质量门禁

**PR合并前置条件**:
- ✅ 所有单元测试必须通过
- ✅ 代码覆盖率不能下降
- ✅ 关键功能必须有集成测试
- ✅ 新增API必须有API测试

**版本发布前置条件**:
- ✅ 所有测试（单元 + 集成 + E2E）通过
- ✅ 平台自测用例（93步骤）全部通过
- ✅ 性能测试基准达标
- ✅ 安全扫描无高危漏洞

---

## 测试工具选型

### 后端测试工具（Go）

#### 1. Go原生testing + testify

**选择理由**:
- ✅ Go标准库，零额外依赖
- ✅ `testify/assert` 提供丰富的断言
- ✅ `testify/mock` 支持Mock接口
- ✅ 社区广泛使用，文档丰富

**使用场景**:
- 单元测试
- 集成测试
- Mock Repository和Service

**示例**:
```go
func TestCreateTestCase(t *testing.T) {
    // Given
    mockRepo := new(MockTestCaseRepository)
    service := NewTestCaseService(mockRepo)

    // When
    result, err := service.CreateTestCase(ctx, &req)

    // Then
    assert.NoError(t, err)
    assert.NotNil(t, result)
    assert.Equal(t, "test-001", result.TestID)
}
```

#### 2. httptest（HTTP测试）

**选择理由**:
- ✅ Go标准库，专为HTTP测试设计
- ✅ 轻量级，无需启动真实服务器
- ✅ 支持Handler级别和端到端测试

**使用场景**:
- API端点测试
- Handler层集成测试

**示例**:
```go
func TestCreateTestCaseAPI(t *testing.T) {
    router := setupRouter()
    req := httptest.NewRequest("POST", "/api/v2/test-cases", body)
    w := httptest.NewRecorder()

    router.ServeHTTP(w, req)

    assert.Equal(t, 201, w.Code)
}
```

#### 3. gorm测试工具

**选择理由**:
- ✅ 支持SQLite内存数据库
- ✅ 快速、隔离的数据库测试

**使用场景**:
- Repository层测试
- 数据库迁移测试

**示例**:
```go
func setupTestDB(t *testing.T) *gorm.DB {
    db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
    require.NoError(t, err)
    db.AutoMigrate(&models.TestCase{})
    return db
}
```

### 前端测试工具（React）

#### 1. Jest + React Testing Library

**选择理由**:
- ✅ React官方推荐
- ✅ 专注用户视角测试（What, not How）
- ✅ 自动Mock、快照测试
- ✅ 社区生态完善

**使用场景**:
- 组件单元测试
- Hook测试
- 工具函数测试

**示例**:
```typescript
test('renders test case list', () => {
  render(<TestCaseManager />);
  expect(screen.getByText('测试用例管理')).toBeInTheDocument();
});
```

#### 2. MSW（Mock Service Worker）

**选择理由**:
- ✅ 拦截网络请求，无需修改代码
- ✅ 同时支持测试和开发环境
- ✅ 类型安全的API Mock

**使用场景**:
- API集成测试
- WebSocket Mock

**示例**:
```typescript
const handlers = [
  rest.get('/api/v2/test-cases', (req, res, ctx) => {
    return res(ctx.json({ data: mockTestCases }));
  }),
];

const server = setupServer(...handlers);
```

#### 3. Playwright（E2E测试）

**选择理由**:
- ✅ 跨浏览器支持（Chromium, Firefox, WebKit）
- ✅ 自动等待机制，减少Flaky测试
- ✅ 强大的调试工具

**使用场景**:
- 端到端用户流程测试
- 跨浏览器兼容性测试

**示例**:
```typescript
test('create test case end-to-end', async ({ page }) => {
  await page.goto('http://localhost:5173');
  await page.click('text=创建测试用例');
  await page.fill('#testId', 'test-001');
  await page.click('button:has-text("提交")');
  await expect(page.locator('.success-message')).toBeVisible();
});
```

---

## 测试分层策略

### 后端测试分层

```
┌─────────────────────────────────────────┐
│  E2E Tests (10%)                        │
│  - 平台自测用例                          │
│  - 完整工作流执行                        │
└─────────────────────────────────────────┘
            ↑
┌─────────────────────────────────────────┐
│  Integration Tests (30%)                │
│  - HTTP API端点测试                     │
│  - WebSocket集成测试                    │
│  - 数据库集成测试                        │
└─────────────────────────────────────────┘
            ↑
┌─────────────────────────────────────────┐
│  Unit Tests (60%)                       │
│  - Service层业务逻辑                     │
│  - Repository层数据访问                 │
│  - 工具函数                              │
│  - 断言验证逻辑                          │
└─────────────────────────────────────────┘
```

### 前端测试分层

```
┌─────────────────────────────────────────┐
│  E2E Tests (10%)                        │
│  - 完整用户流程                          │
│  - 跨浏览器测试                          │
└─────────────────────────────────────────┘
            ↑
┌─────────────────────────────────────────┐
│  Integration Tests (30%)                │
│  - 页面交互流程                          │
│  - API调用 + UI更新                     │
│  - 路由导航测试                          │
└─────────────────────────────────────────┘
            ↑
┌─────────────────────────────────────────┐
│  Component Tests (60%)                  │
│  - UI组件单元测试                        │
│  - Hook逻辑测试                          │
│  - 工具函数测试                          │
└─────────────────────────────────────────┘
```

---

## 测试实施原则

### 1. 测试先行（Test-First）

**要求**:
- ✅ 重要功能必须先写测试
- ✅ Bug修复必须先写回归测试
- ✅ 重构必须有测试保护

**例外**:
- ❌ 原型验证阶段
- ❌ UI布局调整
- ❌ 配置文件修改

### 2. 测试独立性

**要求**:
- ✅ 每个测试独立运行
- ✅ 测试之间无依赖
- ✅ 测试数据隔离

**实施方法**:
- 每个测试使用独立的测试数据
- Setup/Teardown清理测试环境
- 使用事务回滚或内存数据库

### 3. 测试可维护性

**要求**:
- ✅ 测试代码质量等同于生产代码
- ✅ 避免过度Mock
- ✅ 测试名称清晰描述场景

**示例**:
```go
// ✅ 好的测试名称
func TestCreateTestCase_DuplicateID_ReturnsError(t *testing.T)
func TestExecuteWorkflow_ParallelSteps_ExecutesCorrectly(t *testing.T)

// ❌ 不好的测试名称
func TestCreate(t *testing.T)
func TestWorkflow1(t *testing.T)
```

### 4. 快速反馈

**目标**:
- ✅ 单元测试：< 5秒
- ✅ 集成测试：< 30秒
- ✅ E2E测试：< 5分钟

**实施方法**:
- 并行执行测试
- 优化测试Setup时间
- 避免不必要的Sleep等待

---

## 持续集成策略

### CI流水线设计

```yaml
# .github/workflows/test.yml
name: Test Pipeline

on: [push, pull_request]

jobs:
  backend-unit-tests:
    runs-on: ubuntu-latest
    steps:
      - run: go test -short ./...
      - run: go test -coverprofile=coverage.out ./...
      - run: go tool cover -func=coverage.out

  backend-integration-tests:
    runs-on: ubuntu-latest
    steps:
      - run: go test -run Integration ./...

  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - run: npm test -- --coverage

  e2e-tests:
    runs-on: ubuntu-latest
    needs: [backend-unit-tests, frontend-tests]
    steps:
      - run: npm run test:e2e
```

### 测试执行策略

| 触发时机 | 执行测试 | 时间要求 |
|---------|---------|---------|
| **本地开发** | 单元测试 | < 5秒 |
| **提交PR** | 单元 + 集成 | < 1分钟 |
| **合并到main** | 单元 + 集成 + E2E | < 5分钟 |
| **版本发布** | 全量测试 + 自测 | < 15分钟 |
| **每日构建** | 全量测试 + 性能 | < 30分钟 |

---

## 测试覆盖率监控

### 覆盖率工具

**后端（Go）**:
```bash
go test -coverprofile=coverage.out ./...
go tool cover -html=coverage.out
go tool cover -func=coverage.out | grep total
```

**前端（React）**:
```bash
npm test -- --coverage
# 生成 coverage/lcov-report/index.html
```

### 覆盖率报告

**PR评论自动生成**:
```
Coverage Report:
- Backend: 78.5% (+2.3%)
- Frontend: 72.1% (+1.5%)
- Overall: 75.3% (+1.9%)

✅ Coverage increased
```

### 覆盖率趋势

**每周统计**:
- 发布覆盖率趋势图
- 识别覆盖率下降的模块
- 制定提升计划

---

## 风险和缓解措施

### 风险1：测试维护成本高

**风险描述**: 测试用例数量增长，维护成本提高

**缓解措施**:
- ✅ 避免过度Mock，减少测试脆弱性
- ✅ 定期重构测试代码，消除重复
- ✅ 使用测试辅助函数（Test Helpers）
- ✅ 删除过时的测试用例

### 风险2：Flaky测试（不稳定测试）

**风险描述**: 测试偶尔失败，降低信任度

**缓解措施**:
- ✅ 避免硬编码时间等待（`time.Sleep`）
- ✅ 使用条件等待（`assert.Eventually`）
- ✅ WebSocket测试使用稳定的同步机制
- ✅ 隔离测试数据，避免并发冲突

### 风险3：测试执行时间过长

**风险描述**: 完整测试套件执行超过5分钟，影响开发效率

**缓解措施**:
- ✅ 并行执行测试（`go test -parallel`）
- ✅ 使用测试标签分组（`-short` flag）
- ✅ 优化Setup/Teardown时间
- ✅ 考虑测试分片（Test Sharding）

---

## 成功指标

### 质量指标

| 指标 | 目标 | 当前 |
|-----|------|------|
| **测试覆盖率** | ≥ 75% | - |
| **单元测试通过率** | 100% | - |
| **集成测试通过率** | ≥ 95% | - |
| **Flaky测试率** | < 2% | - |
| **平均测试执行时间** | < 5分钟 | - |

### 开发效率指标

| 指标 | 目标 |
|-----|------|
| **Bug检测率** | 测试阶段发现 ≥ 80% |
| **回归Bug率** | < 5% |
| **测试反馈时间** | < 1分钟（本地） |

---

## 后续行动计划

### 短期（1-2个月）

- [x] ✅ 建立测试基础设施（CI/CD集成）
- [ ] 为核心模块补充单元测试（目标覆盖率60%）
- [ ] 建立测试文档和最佳实践指南
- [ ] 配置覆盖率监控和趋势分析

### 中期（3-6个月）

- [ ] 达到测试覆盖率75%目标
- [ ] 建立完整的集成测试套件
- [ ] 引入性能测试基准
- [ ] 建立测试培训体系

### 长期（6-12个月）

- [ ] 探索变异测试（Mutation Testing）
- [ ] 引入Chaos Engineering（混沌工程）
- [ ] 建立测试效能分析平台
- [ ] 持续优化测试策略

---

## 相关文档

### 测试规范
- [测试用例格式规范](../1-specs/testing/test-case-format.md) - 测试用例JSON格式
- [API测试规范](../1-specs/testing/api-testing-spec.md) - API测试技术规范
- [测试文档化指南](../3-guides/testing/test-documentation-guide.md) - 测试文档编写

### 架构设计
- [系统架构概览](../1-specs/architecture/overview.md) - 系统整体架构
- [后端分层架构](../1-specs/architecture/backend-layered-design.md) - 三层架构设计

### 开发指南
- [命名规范](../3-guides/development/naming-conventions.md) - 代码命名规范

---

## 决策历史

| 日期 | 变更 | 原因 |
|-----|------|------|
| 2025-11-27 | 初始决策 | 建立测试策略 |

---

**决策批准**:
- [x] 架构师：已批准
- [x] QA负责人：已批准
- [x] 技术负责人：已批准

**生效日期**: 2025-11-27
**下次审核**: 2025-Q2（2025年第二季度）
