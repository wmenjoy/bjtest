# 文档组织规范与业务开发Wiki体系设计

**文档版本**: 1.0
**创建日期**: 2025-11-26
**状态**: Approved
**设计者**: Claude Code

---

## 目录

1. [设计背景](#设计背景)
2. [设计目标](#设计目标)
3. [七层文档架构](#七层文档架构)
4. [代码结构规范](#代码结构规范)
5. [测试资产管理](#测试资产管理)
6. [脚本与部署配置](#脚本与部署配置)
7. [代码-文档映射关系](#代码-文档映射关系)
8. [命名规范](#命名规范)
9. [文档维护规则](#文档维护规则)
10. [AI工作流程](#ai工作流程)
11. [实施路线](#实施路线)

---

## 设计背景

### 当前问题

**文档混乱:**
- nextest-platform/docs/ 有49个文档，类型混杂（架构、API、实现计划、进度追踪）
- 缺少清晰的分类和组织规则
- 找文档困难，不知道某类信息应该在哪个文档中

**代码结构不一致:**
- 前端19个大组件直接堆在根目录
- 文档中的术语与代码不匹配（test-management vs testcase）
- 模块边界不清晰（TestCase与Workflow职责重叠）

**AI工作效率低:**
- 文档与代码对不上号，AI不知道改哪个文件
- 缺少统一术语表，同一概念多种命名
- 决策历史分散，AI无法理解"为什么这么做"

### 设计需求

**核心用户**: AI系统（Claude Code等）、开发人员、产品人员、测试人员

**关键需求:**
1. **AI能组织文档生成** - 按规范自动归类和创建文档
2. **维护决策历史** - 记录架构级和功能级决策，可追溯
3. **文档-代码映射** - 文档与代码模块一一对应
4. **支持迭代** - 需求、计划、进度按时间和功能组织

---

## 设计目标

### 主要目标

1. **模块边界清晰** - 解决"这段代码应该放在哪个模块？"的问题
2. **文档-代码映射明确** - 解决"文档里说的XX模块对应代码哪里？"的问题
3. **决策可追溯** - 记录架构级(A)和功能级(B)决策，不记录代码级细节
4. **AI高效工作** - 文档结构清晰，AI能快速定位和理解

### 成功指标

- ✅ 每个业务模块有完整的Wiki文档（overview + 子主题）
- ✅ 重大决策都有ADR记录，包含背选方案和选择理由
- ✅ AI在实现功能时，能自动找到对应的Wiki和代码位置
- ✅ 新加入成员能在1小时内理解项目结构

---

## 七层文档架构

### 整体结构

```
docs/
├── 1-specs/           # 技术规范（Schema, API, 协议）
├── 2-requirements/    # 需求管理（PRD, Stories）
├── 3-guides/          # 开发指南（长期有效的How-to）
├── 4-planning/        # 计划任务（Sprint, Roadmap）
├── 5-wiki/            # 业务知识（模块概览, 核心概念）
├── 6-decisions/       # ADR决策记录
├── 7-archive/         # 历史归档
└── README.md          # 文档导航入口
```

---

### 1. Specs层 - 技术规范（持续更新）

**目的**: 存放技术约束和规范定义，作为代码实现的"合约"

```
docs/1-specs/
├── database/
│   ├── schema.md              # 全量数据库Schema定义
│   ├── configuration.md       # 数据库配置说明
│   └── migrations/            # 迁移记录
│       ├── 001_initial.md
│       ├── 002_add_hooks.md
│       ├── 003_add_workflow.md
│       ├── 004_add_environment.md
│       └── index.md           # 迁移索引
│
├── api/
│   ├── v1.md                  # API v1文档
│   ├── v2.md                  # API v2文档
│   ├── communication-spec.md  # 通信规范
│   ├── http-status-codes.md   # HTTP状态码规范
│   └── openapi.yaml           # 机器可读规范
│
├── backend/
│   ├── datamapper-implementation.md
│   └── datamapper-quick-reference.md
│
└── ui/
    ├── design-tokens.md       # 颜色、字体、间距等设计token
    ├── accessibility-standards.md
    └── responsive-breakpoints.md
```

**更新频率**: 每次Schema/API变更时必须同步更新
**AI使用场景**: 生成代码、校验实现是否符合规范

---

### 2. Requirements层 - 需求管理（按需求迭代）

**目的**: 管理产品需求和用户故事，持续演进

```
docs/2-requirements/
├── prd/
│   ├── current.md             # 当前活跃的PRD
│   └── history/               # 历史版本PRD
│       ├── v1.0-initial.md
│       └── v2.0-productization.md
│
├── features/
│   ├── testcase-management.md    # 测试用例管理需求
│   ├── workflow-engine.md         # 工作流引擎需求
│   ├── environment-management.md  # 环境管理需求
│   └── multi-tenant.md            # 多租户需求
│
└── stories/
    ├── by-feature/            # 按功能分组的stories
    │   ├── testcase/
    │   ├── workflow/
    │   └── environment/
    └── archive/               # 已完成的stories
        └── 2024-Q4/
```

**更新频率**: 每次需求评审时
**AI使用场景**: 理解业务目标、功能优先级

---

### 3. Guides层 - 开发指南（长期有效）

**目的**: 存放操作指南和最佳实践，告诉开发者"如何做"

```
docs/3-guides/
├── development/
│   ├── frontend-implementation.md    # 前端开发指南
│   ├── backend-implementation.md     # 后端开发指南
│   ├── multi-tenant-integration.md   # 多租户集成指南
│   └── environment-management.md     # 环境管理使用指南
│
├── ui-design/
│   ├── design-system.md       # UI设计系统（组件使用）
│   ├── component-library.md   # 组件库文档
│   └── interaction-patterns.md # 交互模式（批量操作、拖拽等）
│
└── testing/
    ├── self-test-guide.md     # 自测指南
    └── test-organization.md   # 测试组织方法
```

**与Wiki的区别:**
- **Wiki**: "这个模块是什么，怎么工作的"（概念+原理）
- **Guides**: "如何使用这个模块进行开发"（步骤+实践）

**更新频率**: 新开发模式加入时
**AI使用场景**: 学习如何实现某个功能

---

### 4. Planning层 - 计划任务（和需求关联）

**目的**: 管理开发计划、任务分解、进度追踪

```
docs/4-planning/
├── active/                    # 当前正在进行的
│   ├── sprint-current.md      # 当前Sprint计划
│   └── wip-tasks.md           # 进行中的任务
│
├── by-feature/                # 按需求分类的计划
│   ├── frontend-modernization/
│   │   ├── plan.md            # 总体计划
│   │   └── progress/          # 进度追踪
│   │       ├── phase1.md
│   │       ├── phase2.md
│   │       └── phase3-5.md
│   ├── multi-tenant/
│   │   ├── plan.md
│   │   └── progress/
│   │       └── implementation.md
│   └── environment-management/
│       └── implementation-plan.md
│
├── backlog/
│   ├── roadmap.md             # 产品路线图
│   └── future-features.md     # 未来功能规划
│
└── completed/                 # 按季度归档
    ├── 2024-Q3/
    └── 2024-Q4/
        ├── frontend-phase1.md
        └── implementation-complete.md
```

**归档策略**: 每季度末，将active/中已完成的移至completed/
**AI使用场景**: 了解当前进度、剩余任务

---

### 5. Wiki层 - 业务知识库（AI学习源）

**目的**: 核心业务逻辑和架构知识，AI的主要学习材料

```
docs/5-wiki/
├── architecture/
│   ├── overview.md            # 系统整体架构
│   ├── module-boundaries.md   # 模块边界定义
│   └── ddd-layers.md          # DDD分层说明
│
├── testcase/
│   ├── overview.md            # 模块概览（包含代码路径映射）
│   ├── data-model.md          # 数据模型
│   ├── execution-flow.md      # 执行流程
│   ├── assertion-system.md    # 断言系统
│   └── step-types.md          # 步骤类型
│
├── workflow/
│   ├── overview.md
│   ├── dag-execution.md       # DAG执行逻辑
│   ├── variable-system.md     # 变量系统
│   ├── action-types.md        # 动作类型
│   └── integration-modes.md   # 三种集成模式
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
└── glossary.md                # 统一术语表
```

**每个模块的overview.md必须包含:**
1. 模块简介
2. 核心概念
3. 代码路径映射（后端+前端）
4. 相关决策记录链接

**更新频率**: 架构变化时
**AI使用场景**: 理解模块原理、数据流

---

### 6. Decisions层 - ADR决策记录

**目的**: 追溯"为什么这么做"，记录设计选择的理由

```
docs/6-decisions/
├── 2024-11-01-sqlite-choice-architecture.md
├── 2024-11-15-websocket-design-architecture.md
├── 2024-11-20-testcase-workflow-design-feature.md
├── 2024-11-21-testcase-redesign-feature.md
├── 2024-11-23-unified-workflow-architecture.md
├── 2024-11-24-test-platform-productization-architecture.md
├── index.md                   # 决策索引（按时间、按模块）
└── _template.md               # ADR模板
```

**命名规范**: `YYYY-MM-DD-主题-[architecture|feature].md`

**创建时机:**
- **architecture** - 开发前创建（影响多模块的重大决策）
- **feature** - 开发中创建（新功能的设计选择）

**AI使用场景**: 理解"为什么选择这个方案而不是那个方案"

---

### 7. Archive层 - 历史归档

**目的**: 保留已废弃文档，供历史参考

```
docs/7-archive/
├── 2024-Q3/
│   └── old-architecture.md
└── 2024-Q4/
    ├── testcase-workflow-integration.md  # 被新文档取代
    ├── ci-platform-alignment.md
    └── deprecated-designs/
```

**归档触发:**
- 文档被新版本取代
- 设计方案被废弃
- 功能已下线

**归档后操作:**
- 添加"已归档"标记
- 添加指向替代文档的链接
- 保留完整原始内容

---

## 代码结构规范

### 项目根目录

```
testplatform/                  # 项目根目录
├── backend/                   # 后端服务（原nextest-platform）
├── front/                     # 前端应用（原NextTestPlatformUI）
├── docs/                      # 统一文档目录（七层架构）
├── testcases/                 # 测试案例库（长期维护的业务测试用例）
├── scripts/                   # 项目级脚本（构建、部署、工具）
├── deploy/                    # 部署配置（Docker、K8s、CI/CD）
├── .github/                   # GitHub工作流
└── README.md                  # 项目总入口
```

**核心变化:**
- **testcases/** - 业务测试用例资产库（JSON/YAML格式）
- **scripts/** - 所有脚本文件集中管理
- **deploy/** - 容器化和部署配置
- **docs/** - 纯文档，不包含可执行内容

---

### 后端代码结构（DDD分层）

```
backend/
├── cmd/                       # 命令行入口
│   ├── server/                # 主服务
│   └── tools/                 # 工具命令
│       └── import/
│
├── internal/
│   ├── domain/                # 领域层（核心业务逻辑）
│   │   ├── testcase/          # 测试用例领域
│   │   │   ├── case.go        # Case聚合根
│   │   │   ├── group.go       # Group实体
│   │   │   ├── result.go      # Result值对象
│   │   │   ├── executor.go    # 执行器接口
│   │   │   └── types.go       # 领域类型
│   │   ├── workflow/          # 工作流领域
│   │   │   ├── workflow.go
│   │   │   ├── step.go
│   │   │   ├── run.go
│   │   │   ├── executor.go
│   │   │   ├── dag.go
│   │   │   └── actions/
│   │   ├── environment/
│   │   └── tenant/
│   │
│   ├── application/           # 应用服务层（用例编排）
│   │   ├── testcase/
│   │   │   ├── service.go
│   │   │   ├── executor.go
│   │   │   └── dto.go
│   │   ├── workflow/
│   │   ├── environment/
│   │   └── tenant/
│   │
│   ├── infrastructure/        # 基础设施层（技术实现）
│   │   ├── persistence/
│   │   │   ├── models/        # GORM模型
│   │   │   └── repository/    # 仓储实现
│   │   ├── websocket/
│   │   ├── expression/
│   │   └── database/
│   │
│   ├── interfaces/            # 接口适配层
│   │   ├── http/
│   │   │   ├── handler/
│   │   │   ├── middleware/
│   │   │   └── router.go
│   │   └── websocket/
│   │
│   └── shared/                # 共享内核
│       ├── config/
│       ├── errors/
│       └── testutil/
│
├── migrations/
├── examples/
├── config.toml
└── Makefile
```

---

### 前端代码结构（Feature-Driven）

```
front/
├── src/
│   ├── features/              # 业务特性（按领域模块）
│   │   ├── testcase/
│   │   │   ├── pages/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   └── types.ts
│   │   ├── workflow/
│   │   ├── environment/
│   │   ├── library/
│   │   ├── api-center/
│   │   ├── dashboard/
│   │   ├── admin/
│   │   └── auth/
│   │
│   ├── components/            # 共享UI组件
│   │   ├── ui/
│   │   └── layout/
│   │
│   ├── hooks/                 # 全局hooks
│   ├── services/              # 服务层
│   │   ├── api/
│   │   └── gemini/
│   │
│   ├── utils/
│   ├── types/
│   ├── App.tsx
│   ├── main.tsx
│   └── routes.tsx
│
├── public/
├── vite.config.ts
└── package.json
```

**设计原则:**
- features/按业务模块组织，与backend/internal/domain/对齐
- 每个feature自包含（pages/components/hooks/types）
- 共享UI组件独立于业务逻辑

---

## 测试资产管理

### 测试案例库（testcases/）

**目的**: 维护长期的业务测试用例资产，作为项目的核心交付物之一

```
testcases/
├── api/                       # API测试用例
│   ├── user-management/       # 按业务模块分类
│   │   ├── create-user.json
│   │   ├── update-user.json
│   │   └── delete-user.json
│   ├── workflow-execution/
│   │   ├── simple-workflow.json
│   │   ├── parallel-workflow.json
│   │   └── error-handling.json
│   └── environment-switching/
│       └── env-variables.json
│
├── workflow/                  # 工作流测试用例
│   ├── basic/
│   │   ├── linear-flow.yaml
│   │   └── conditional-flow.yaml
│   ├── advanced/
│   │   ├── dag-parallel.yaml
│   │   └── nested-workflow.yaml
│   └── integration/
│       └── testcase-workflow-integration.yaml
│
├── e2e/                       # 端到端测试场景
│   ├── complete-test-lifecycle.yaml
│   └── multi-tenant-isolation.yaml
│
├── templates/                 # 测试模板（可复用）
│   ├── http-request-template.json
│   ├── command-execution-template.json
│   └── workflow-template.yaml
│
├── datasets/                  # 测试数据集
│   ├── users.json
│   ├── environments.json
│   └── organizations.json
│
├── README.md                  # 测试案例库说明
└── index.json                 # 测试案例索引（元数据）
```

**测试案例分类原则:**
1. **按业务模块** - api/, workflow/, e2e/
2. **按复杂度** - basic/, advanced/, integration/
3. **按用途** - 功能测试、性能测试、回归测试

**版本化管理:**
```json
// index.json 示例
{
  "version": "2.0",
  "lastUpdated": "2025-11-26",
  "categories": {
    "api": {
      "count": 45,
      "modules": ["user-management", "workflow-execution", "environment-switching"]
    },
    "workflow": {
      "count": 28,
      "modules": ["basic", "advanced", "integration"]
    }
  },
  "compatibility": {
    "backendVersion": ">=2.0.0",
    "apiVersion": "v2"
  }
}
```

**维护规则:**
1. **新功能必须提交测试用例** - 与代码同时提交到testcases/
2. **测试用例即文档** - 用例本身就是功能的最佳示例
3. **季度审查** - 每季度清理过时的测试用例
4. **CI自动执行** - testcases/中的用例自动加载到测试平台执行

---

### 测试代码规范

#### 后端测试代码（Go）

```
backend/
├── internal/
│   ├── domain/testcase/
│   │   ├── case.go
│   │   └── case_test.go        # 单元测试与代码同目录
│   ├── application/testcase/
│   │   ├── service.go
│   │   └── service_test.go
│   └── infrastructure/persistence/
│       └── repository/
│           ├── testcase_repo.go
│           └── testcase_repo_test.go
│
├── tests/                      # 集成测试和E2E测试
│   ├── integration/            # 集成测试
│   │   ├── testcase_api_test.go
│   │   ├── workflow_execution_test.go
│   │   └── environment_test.go
│   ├── e2e/                    # 端到端测试
│   │   ├── complete_flow_test.go
│   │   └── multi_tenant_test.go
│   ├── fixtures/               # 测试数据固件
│   │   ├── testcases.json
│   │   └── workflows.json
│   ├── mocks/                  # Mock对象
│   │   ├── mock_repository.go
│   │   └── mock_executor.go
│   └── testutil/               # 测试工具函数
│       ├── database.go         # 测试数据库设置
│       ├── server.go           # 测试服务器启动
│       └── assertions.go       # 自定义断言
│
└── Makefile                    # 包含测试命令
```

**测试文件命名:**
- 单元测试: `*_test.go` (与源文件同目录)
- 集成测试: `tests/integration/*_test.go`
- E2E测试: `tests/e2e/*_test.go`

**运行测试:**
```bash
# 单元测试
make test-unit
go test ./internal/... -v

# 集成测试
make test-integration
go test ./tests/integration/... -v

# E2E测试
make test-e2e
go test ./tests/e2e/... -v

# 覆盖率
make test-cover
go test ./... -coverprofile=coverage.out
```

---

#### 前端测试代码（React/TypeScript）

```
front/
├── src/
│   ├── features/testcase/
│   │   ├── pages/
│   │   │   ├── TestCaseList.tsx
│   │   │   └── TestCaseList.test.tsx    # 测试文件与源文件同目录
│   │   ├── components/
│   │   │   ├── CaseCard.tsx
│   │   │   └── CaseCard.test.tsx
│   │   └── hooks/
│   │       ├── useTestCase.ts
│   │       └── useTestCase.test.ts
│   │
│   ├── components/ui/
│   │   ├── Button/
│   │   │   ├── Button.tsx
│   │   │   └── Button.test.tsx
│   │   └── Modal/
│   │       ├── Modal.tsx
│   │       └── Modal.test.tsx
│   │
│   └── __tests__/              # 全局测试配置和工具
│       ├── setup.ts            # 测试环境设置
│       ├── mocks/              # 全局Mock
│       │   ├── api.ts
│       │   └── websocket.ts
│       └── utils/              # 测试工具函数
│           ├── render.tsx      # 自定义render（包含provider）
│           └── fixtures.ts     # 测试数据固件
│
├── e2e/                        # E2E测试（Playwright/Cypress）
│   ├── testcase-management.spec.ts
│   ├── workflow-builder.spec.ts
│   └── fixtures/
│       └── test-data.json
│
├── vitest.config.ts            # Vitest配置
└── playwright.config.ts        # E2E测试配置
```

**测试文件命名:**
- 单元测试: `*.test.tsx` / `*.test.ts` (与源文件同目录)
- 集成测试: `*.integration.test.tsx`
- E2E测试: `e2e/*.spec.ts`

**运行测试:**
```bash
# 单元测试
npm run test
npm run test:watch

# 覆盖率
npm run test:coverage

# E2E测试
npm run test:e2e
```

---

### 测试文档

测试相关文档应该放在`docs/3-guides/testing/`

```
docs/3-guides/testing/
├── unit-testing-guide.md       # 单元测试编写指南
├── integration-testing-guide.md # 集成测试编写指南
├── e2e-testing-guide.md        # E2E测试编写指南
├── test-data-management.md     # 测试数据管理
├── mocking-strategy.md         # Mock策略
└── ci-testing.md               # CI中的测试执行
```

---

## 脚本与部署配置

### 脚本目录（scripts/）

**目的**: 集中管理所有自动化脚本

```
scripts/
├── dev/                        # 开发脚本
│   ├── setup.sh                # 初始化开发环境
│   ├── reset-db.sh             # 重置数据库
│   └── seed-data.sh            # 填充测试数据
│
├── build/                      # 构建脚本
│   ├── build-backend.sh        # 编译后端
│   ├── build-front.sh          # 编译前端
│   └── build-all.sh            # 全量编译
│
├── test/                       # 测试脚本
│   ├── run-unit-tests.sh       # 运行单元测试
│   ├── run-integration-tests.sh # 运行集成测试
│   ├── run-e2e-tests.sh        # 运行E2E测试
│   └── generate-coverage.sh    # 生成覆盖率报告
│
├── deploy/                     # 部署脚本
│   ├── deploy-dev.sh           # 部署到开发环境
│   ├── deploy-staging.sh       # 部署到预发布环境
│   ├── deploy-prod.sh          # 部署到生产环境
│   └── rollback.sh             # 回滚脚本
│
├── ci/                         # CI专用脚本
│   ├── prepare-ci.sh           # CI环境准备
│   ├── run-ci-tests.sh         # CI测试执行
│   └── publish-artifacts.sh    # 发布构建产物
│
├── maintenance/                # 维护脚本
│   ├── backup-db.sh            # 备份数据库
│   ├── migrate-data.sh         # 数据迁移
│   └── cleanup-logs.sh         # 清理日志
│
├── tools/                      # 工具脚本
│   ├── doc-check.sh            # 文档规范检查
│   ├── term-check.sh           # 术语检查
│   ├── import-testcases.sh     # 导入测试用例到平台
│   └── export-testcases.sh     # 从平台导出测试用例
│
└── README.md                   # 脚本使用说明
```

**脚本编写规范:**
1. **使用bash shebang**: `#!/bin/bash`
2. **启用严格模式**: `set -euo pipefail`
3. **添加帮助信息**: 支持 `--help` 参数
4. **日志输出**: 使用统一的日志格式
5. **错误处理**: 捕获错误并返回非零退出码

**脚本模板:**
```bash
#!/bin/bash
set -euo pipefail

# 脚本说明: XXX脚本的用途
# 用法: ./script.sh [options]

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
  echo -e "${GREEN}[INFO]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1" >&2
}

log_warn() {
  echo -e "${YELLOW}[WARN]${NC} $1"
}

# 帮助信息
show_help() {
  cat << EOF
用法: $0 [OPTIONS]

描述:
  脚本的详细说明

选项:
  -h, --help     显示帮助信息
  -v, --verbose  详细输出

示例:
  $0 --verbose
EOF
}

# 主逻辑
main() {
  log_info "开始执行..."
  # 脚本逻辑
  log_info "执行完成"
}

# 解析参数
while [[ $# -gt 0 ]]; do
  case $1 in
    -h|--help)
      show_help
      exit 0
      ;;
    -v|--verbose)
      VERBOSE=true
      shift
      ;;
    *)
      log_error "未知参数: $1"
      show_help
      exit 1
      ;;
  esac
done

main "$@"
```

---

### 部署配置（deploy/）

**目的**: 管理容器化和部署相关配置

```
deploy/
├── docker/                     # Docker配置
│   ├── backend/
│   │   ├── Dockerfile          # 后端镜像
│   │   └── .dockerignore
│   ├── front/
│   │   ├── Dockerfile          # 前端镜像
│   │   ├── nginx.conf          # Nginx配置
│   │   └── .dockerignore
│   └── docker-compose.yml      # 本地开发环境
│
├── kubernetes/                 # K8s配置
│   ├── base/                   # 基础配置
│   │   ├── deployment-backend.yaml
│   │   ├── deployment-front.yaml
│   │   ├── service.yaml
│   │   └── configmap.yaml
│   ├── overlays/               # 环境差异配置
│   │   ├── dev/
│   │   │   └── kustomization.yaml
│   │   ├── staging/
│   │   │   └── kustomization.yaml
│   │   └── prod/
│   │       └── kustomization.yaml
│   └── README.md
│
├── helm/                       # Helm Charts（可选）
│   ├── testplatform/
│   │   ├── Chart.yaml
│   │   ├── values.yaml
│   │   ├── values-dev.yaml
│   │   ├── values-staging.yaml
│   │   ├── values-prod.yaml
│   │   └── templates/
│   └── README.md
│
├── terraform/                  # 基础设施即代码（可选）
│   ├── modules/
│   ├── environments/
│   │   ├── dev/
│   │   ├── staging/
│   │   └── prod/
│   └── README.md
│
├── ansible/                    # 配置管理（可选）
│   ├── playbooks/
│   ├── roles/
│   └── inventory/
│
└── README.md                   # 部署说明总览
```

**Docker镜像构建:**
```bash
# 后端
cd deploy/docker/backend
docker build -t testplatform-backend:latest .

# 前端
cd deploy/docker/front
docker build -t testplatform-front:latest .

# 使用docker-compose启动
cd deploy/docker
docker-compose up -d
```

**Kubernetes部署:**
```bash
# 开发环境
kubectl apply -k deploy/kubernetes/overlays/dev/

# 生产环境
kubectl apply -k deploy/kubernetes/overlays/prod/
```

---

### CI/CD配置（.github/）

```
.github/
├── workflows/                  # GitHub Actions工作流
│   ├── ci.yml                  # 持续集成
│   ├── cd-dev.yml              # 部署到开发环境
│   ├── cd-staging.yml          # 部署到预发布环境
│   ├── cd-prod.yml             # 部署到生产环境
│   ├── test-coverage.yml       # 测试覆盖率
│   ├── docker-build.yml        # Docker镜像构建
│   └── docs-check.yml          # 文档规范检查
│
├── ISSUE_TEMPLATE/             # Issue模板
│   ├── bug_report.md
│   └── feature_request.md
│
└── PULL_REQUEST_TEMPLATE.md    # PR模板
```

**CI工作流示例（ci.yml）:**
```yaml
name: CI

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-go@v4
        with:
          go-version: '1.24'
      - name: Run backend tests
        run: |
          cd backend
          make test-unit
          make test-integration

  test-front:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - name: Run frontend tests
        run: |
          cd front
          npm ci
          npm run test:coverage

  test-testcases:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Import and run testcases
        run: |
          ./scripts/tools/import-testcases.sh
          ./scripts/test/run-testcase-suite.sh
```

---

## 代码-文档映射关系

### 核心映射表

| 业务模块 | Wiki文档 | 后端代码 | 前端代码 |
|---------|---------|---------|---------|
| 测试用例管理 | `5-wiki/testcase/` | `domain/testcase/`<br>`application/testcase/` | `features/testcase/` |
| 工作流引擎 | `5-wiki/workflow/` | `domain/workflow/`<br>`application/workflow/` | `features/workflow/` |
| 环境管理 | `5-wiki/environment/` | `domain/environment/` | `features/environment/` |
| 多租户 | `5-wiki/tenant/` | `domain/tenant/` | `features/admin/` |
| 动作库 | `5-wiki/action-library/` | `domain/workflow/actions/` | `features/library/` |
| API中心 | `5-wiki/api-center/` | `interfaces/http/` | `features/api-center/` |

### Wiki文档必须包含的代码映射

每个模块的`overview.md`必须包含以下部分:

```markdown
## 代码路径

### 后端
- **领域层**: `backend/internal/domain/testcase/`
- **应用层**: `backend/internal/application/testcase/`
- **持久层**: `backend/internal/infrastructure/persistence/models/testcase.go`
- **接口层**: `backend/internal/interfaces/http/handler/testcase_handler.go`

### 前端
- **特性模块**: `front/src/features/testcase/`
- **页面组件**: `front/src/features/testcase/pages/`
- **业务组件**: `front/src/features/testcase/components/`

### 相关文档
- **数据库设计**: `1-specs/database/schema.md#test_cases表`
- **API文档**: `1-specs/api/v2.md#测试用例API`
- **决策记录**: `6-decisions/2024-11-21-testcase-redesign-feature.md`
```

### 模块边界定义

#### TestCase vs Workflow

| 维度 | TestCase | Workflow |
|------|----------|----------|
| 核心职责 | 单个测试用例的定义和执行 | 多步骤的编排和调度 |
| 执行方式 | 线性执行 | DAG并行执行 |
| 可否嵌套 | ❌ 不能包含其他TestCase | ✅ 可以包含TestCase作为步骤 |
| 代码原则 | **TestCase不能调用Workflow** | **Workflow可以调用TestCase** |

#### Environment vs Tenant

| 维度 | Environment | Tenant |
|------|------------|--------|
| 核心职责 | 管理运行环境配置 | 管理组织/项目隔离 |
| 隔离级别 | 同租户下的不同环境 | 不同租户完全隔离 |
| 代码原则 | **Environment属于Tenant** | **Environment不能跨Tenant** |

---

## 命名规范

### 统一术语表

**强制使用标准术语，禁止同义词:**

| 概念 | 标准术语(英文) | 禁止使用 |
|------|--------------|---------|
| 测试用例 | TestCase | ❌ Test, TestSuite, Case |
| 测试分组 | TestGroup | ❌ Folder, Category |
| 工作流 | Workflow | ❌ Pipeline, Flow, Process |
| 工作流步骤 | Step / WorkflowStep | ❌ Task, Action, Node |
| 动作 | Action | ❌ Operation, Activity |
| 环境 | Environment | ❌ Env, Config |
| 租户 | Tenant | ❌ Customer, Account |
| 组织 | Organization | ❌ Org, Company |
| 项目 | Project | ❌ Workspace, Space |

**统一术语详见**: `docs/5-wiki/glossary.md`

---

### 文件命名规范

#### 后端（Go）

```bash
# 领域实体: 单数名词
domain/testcase/case.go          ✅
domain/testcase/cases.go         ❌ 不用复数

# 仓储: 模块名_repo.go
repository/testcase_repo.go      ✅
repository/test_case_repo.go     ❌ 不拆分概念

# 处理器: 模块名_handler.go
handler/testcase_handler.go      ✅
handler/test_handler.go          ❌ 使用完整术语

# 服务: service.go（在模块目录下）
application/testcase/service.go  ✅
application/testcase/testcase_service.go  ❌ 目录已表明模块
```

#### 前端（TypeScript/React）

```bash
# 页面组件: 大驼峰 + 功能描述
features/testcase/pages/TestCaseList.tsx    ✅
features/testcase/pages/testCaseList.tsx    ❌ 小驼峰

# 业务组件: 大驼峰
features/testcase/components/CaseCard.tsx   ✅
features/testcase/components/case-card.tsx  ❌ kebab-case

# Hooks: use + 驼峰
features/testcase/hooks/useTestCase.ts      ✅
features/testcase/hooks/testCaseHook.ts     ❌ 必须use开头

# 服务: 小驼峰.ts
services/api/testcase.ts                    ✅
services/api/testcaseApi.ts                 ❌ 目录已表明api
```

#### 文档（Markdown）

```bash
# Wiki: 小写kebab-case
5-wiki/testcase/overview.md                 ✅
5-wiki/testcase/Overview.md                 ❌ 不用大写

# ADR: YYYY-MM-DD-主题-类型.md
6-decisions/2024-11-21-testcase-redesign-feature.md     ✅
6-decisions/testcase-redesign.md                        ❌ 缺少日期

# Specs: 描述性名称
1-specs/database/schema.md                  ✅
1-specs/api/v2-documentation.md             ✅
```

#### 测试案例（JSON/YAML）

```bash
# 业务测试用例: 小写kebab-case
testcases/api/user-management/create-user.json           ✅
testcases/api/user-management/CreateUser.json           ❌ 不用大驼峰
testcases/api/user_management/create_user.json          ❌ 不用下划线

# 工作流测试用例: 小写kebab-case
testcases/workflow/basic/linear-flow.yaml                ✅
testcases/workflow/basic/LinearFlow.yaml                 ❌ 不用大驼峰

# 模板: 用途-template
testcases/templates/http-request-template.json           ✅
testcases/templates/http_template.json                   ❌ 不够描述性

# 数据集: 复数名词
testcases/datasets/users.json                            ✅
testcases/datasets/user-data.json                        ❌ 不用data后缀
```

#### 脚本（Shell/Python）

```bash
# 脚本: 小写kebab-case.sh
scripts/dev/setup.sh                                     ✅
scripts/dev/Setup.sh                                     ❌ 不用大写
scripts/dev/setup_env.sh                                 ❌ 不用下划线

# 多词命名: 动词-名词
scripts/build/build-backend.sh                           ✅
scripts/deploy/deploy-prod.sh                            ✅
scripts/tools/import-testcases.sh                        ✅
scripts/tools/testcase-import.sh                         ❌ 动词在前

# Python脚本: snake_case.py
scripts/tools/data_migration.py                          ✅
scripts/tools/dataMigration.py                           ❌ Python用snake_case
```

#### 部署配置

```bash
# Dockerfile: 大驼峰 或 标准名
deploy/docker/backend/Dockerfile                         ✅
deploy/docker/backend/backend.dockerfile                 ❌ 统一用Dockerfile

# Kubernetes: kebab-case.yaml
deploy/kubernetes/base/deployment-backend.yaml           ✅
deploy/kubernetes/base/deployment_backend.yaml           ❌ 不用下划线
deploy/kubernetes/base/BackendDeployment.yaml            ❌ 不用大驼峰

# 环境配置: values-环境.yaml
deploy/helm/testplatform/values-dev.yaml                 ✅
deploy/helm/testplatform/values.dev.yaml                 ❌ 用连字符
```

---

## 文档维护规则

### 规则1: Wiki与代码同步更新

**何时更新Wiki:**
- ✅ 添加新的业务模块
- ✅ 修改核心数据模型
- ✅ 变更重要业务流程
- ❌ 小的bug修复（不需要）
- ❌ UI样式调整（不需要）

**更新流程:**
```
1. 修改代码
2. 提交前检查: 是否影响Wiki中的说明?
3. 如果是，更新对应的Wiki文档
4. 在commit message中注明: "docs: 更新testcase/overview.md"
```

---

### 规则2: ADR创建时机

**架构级决策（architecture）- 开发前创建:**
- 选择新的技术栈（如引入Redis）
- 重大架构调整（如从单体到微服务）
- 跨模块的设计模式（如统一的错误处理）

**功能级决策（feature）- 开发中创建:**
- 新增业务模块（如多租户）
- 核心功能的设计选择（如三种工作流集成模式）
- 重要的API设计（如分页参数格式）

**ADR模板**: `docs/6-decisions/_template.md`

---

### 规则3: Specs文档版本化

**Database Schema必须包含:**
```markdown
**版本**: 2.0
**最后更新**: 2025-11-26
**迁移版本**: 004

## 变更历史
| 版本 | 日期 | 变更说明 | 迁移文件 |
|------|------|---------|---------|
| 2.0  | 2025-11-21 | 添加环境管理表 | 004_add_environment.sql |
```

**API Documentation必须包含:**
- 版本号（v1/v2）
- 添加日期
- 变更历史
- 示例请求/响应
- 错误码说明

---

### 规则4: Planning文档归档策略

**Active → Completed 转移条件:**
- Sprint结束
- 功能完全上线
- 所有验收标准通过

**归档流程:**
```bash
# 每季度末执行
1. 将 docs/4-planning/active/ 中已完成的移至 completed/2024-Q4/
2. 更新 docs/4-planning/backlog/roadmap.md
3. 创建下季度的 active/ 计划
```

---

### 规则5: 测试案例库维护

**新功能提交测试用例:**
- ✅ 实现新API端点 → 在testcases/api/中添加对应测试用例
- ✅ 实现新工作流类型 → 在testcases/workflow/中添加示例
- ✅ 修改重要逻辑 → 更新或新增测试用例

**测试用例与代码同步提交:**
```bash
# 推荐的commit流程
1. git add backend/internal/domain/testcase/
2. git add testcases/api/testcase-management/
3. git commit -m "feat: 添加测试用例批量导入功能

- 实现批量导入API
- 添加数据验证逻辑
- 提供5个测试用例示例"
```

**测试用例审查周期:**
```bash
# 每季度审查
1. 检查testcases/中的用例是否与当前API版本兼容
2. 删除已废弃功能的测试用例
3. 补充新功能缺失的测试用例
4. 更新index.json中的元数据
```

**测试用例命名和组织:**
- **描述性命名**: `create-user-with-admin-role.json` 而不是 `test1.json`
- **按模块分类**: api/user-management/ 而不是 api/test1/, api/test2/
- **复杂度标记**: basic/ advanced/ integration/
- **添加README**: 每个子目录都有README说明用例用途

**CI自动化执行:**
```yaml
# .github/workflows/testcase-validation.yml
name: Testcase Validation

on:
  pull_request:
    paths:
      - 'testcases/**'

jobs:
  validate-testcases:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Validate JSON/YAML syntax
        run: |
          find testcases/ -name "*.json" -exec python -m json.tool {} \; > /dev/null
          find testcases/ -name "*.yaml" -exec yamllint {} \;

      - name: Import testcases to platform
        run: |
          ./scripts/dev/setup.sh
          ./scripts/tools/import-testcases.sh testcases/

      - name: Run imported testcases
        run: |
          ./scripts/test/run-testcase-suite.sh
```

---

## AI工作流程

### AI修改代码的标准流程

```
1. 理解需求
   └─> 读取 2-requirements/ 中的相关需求文档

2. 查阅决策历史
   └─> 搜索 6-decisions/ 是否有相关决策

3. 学习业务逻辑
   └─> 读取 5-wiki/{模块}/overview.md
   └─> 读取相关子主题文档

4. 确认技术规范
   └─> 读取 1-specs/database/schema.md（如需修改数据库）
   └─> 读取 1-specs/api/v2.md（如需修改API）

5. 查看实施指南
   └─> 读取 3-guides/ 中的相关指南

6. 定位代码文件
   └─> 根据 overview.md 中的"代码路径"定位
   └─> 后端: backend/internal/domain/{模块}/
   └─> 前端: front/src/features/{模块}/

7. 实施修改
   └─> 按照DDD分层或Feature-Driven原则修改代码

8. 更新文档
   └─> 如果修改了核心逻辑，更新 5-wiki/
   └─> 如果是重大决策，创建 6-decisions/ ADR
   └─> 如果修改了Schema/API，更新 1-specs/

9. 提交代码
   └─> commit message注明文档更新
```

### AI创建新功能的标准流程

```
1. 理解需求 → 2-requirements/

2. 设计决策
   └─> 如果是架构级: 创建ADR（Proposed状态）
   └─> 讨论备选方案，确定后标记Accepted

3. 创建Wiki文档
   └─> 5-wiki/{新模块}/overview.md
   └─> 包含: 代码路径映射、核心概念、数据流

4. 更新Specs
   └─> 1-specs/database/schema.md（如需新表）
   └─> 1-specs/api/v2.md（如需新API）

5. 实施代码
   └─> 后端: 按DDD分层创建（domain → application → infrastructure → interfaces）
   └─> 前端: 在features/下创建新目录

6. 标记决策为Implemented
   └─> 更新ADR状态

7. 创建Guide（如需要）
   └─> 3-guides/development/{新模块}-guide.md
```

---

## 实施路线

### 阶段1: 文档重组（Week 1）

**任务:**
1. 创建新的七层目录结构
2. 将现有49个文档归类迁移
3. 创建必要的索引文件（README.md, index.md）

**交付物:**
- 完整的七层文档架构
- 文档迁移清单（记录每个文档的新位置）
- 顶层README.md（文档导航）

**详细计划**: `docs/plans/2025-11-26-documentation-migration-plan.md`

---

### 阶段2: Wiki文档补全（Week 2-3）

**任务:**
1. 为每个业务模块创建overview.md
2. 补充缺失的子主题文档（如assertion-system.md）
3. 创建glossary.md统一术语表
4. 创建module-boundaries.md模块边界定义

**优先级:**
- P0: testcase, workflow, environment（核心模块）
- P1: tenant, action-library（重要模块）
- P2: api-center, dashboard（辅助模块）

---

### 阶段3: 代码重构（Week 4-6）

**任务:**
1. 后端DDD分层重构
   - 创建domain/application/infrastructure/interfaces目录
   - 迁移现有代码到新结构
   - 保留_deprecated/目录存放旧代码

2. 前端Feature-Driven重构
   - 创建features/目录结构
   - 按模块迁移组件
   - 整理共享UI组件到components/ui/

3. 项目根目录重命名
   - nextest-platform → backend
   - NextTestPlatformUI → front
   - 创建统一的docs/

**风险控制:**
- 分模块逐步迁移，不一次性全部重构
- 保留旧代码在_deprecated/，确保功能正常后再删除
- 每个模块迁移后进行回归测试

---

### 阶段4: 规范落地（Week 7-8）

**任务:**
1. 创建文档模板（ADR, Wiki, Guide）
2. 创建检查脚本（scripts/doc-check.sh）
3. 配置git hooks（pre-commit检查）
4. 编写.claude/project-context.md（AI指导文档）
5. 团队培训（文档规范、代码结构）

**交付物:**
- 完整的模板库
- 自动化检查脚本
- AI Prompt模板
- 团队培训材料

---

## 附录

### 文档模板位置

- ADR模板: `docs/6-decisions/_template.md`
- Wiki Overview模板: `docs/5-wiki/_template-overview.md`
- Guide模板: `docs/3-guides/_template.md`

### 检查脚本

- 文档规范检查: `scripts/doc-check.sh`
- 术语检查: `scripts/term-check.sh`
- 代码-文档映射检查: `scripts/mapping-check.sh`

### 参考资料

- ADR概念: https://adr.github.io/
- DDD分层架构: https://www.domainlanguage.com/
- Feature-Driven Architecture: https://feature-sliced.design/

---

**设计完成日期**: 2025-11-26
**下一步**: 执行文档迁移计划
