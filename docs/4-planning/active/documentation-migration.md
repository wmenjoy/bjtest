# 文档组织规范实施计划

**计划版本**: 1.0
**创建日期**: 2025-11-26
**预计周期**: 8周
**负责人**: 开发团队

---

## 目录

1. [实施概览](#实施概览)
2. [阶段1: 文档重组](#阶段1-文档重组week-1)
3. [阶段2: Wiki文档补全](#阶段2-wiki文档补全week-2-3)
4. [阶段3: 代码重构](#阶段3-代码重构week-4-6)
5. [阶段4: 测试资产建设](#阶段4-测试资产建设week-4-6)
6. [阶段5: 脚本与部署规范化](#阶段5-脚本与部署规范化week-7)
7. [阶段6: 规范落地与培训](#阶段6-规范落地与培训week-8)
8. [风险控制](#风险控制)
9. [验收标准](#验收标准)

---

## 实施概览

### 总体目标

将当前项目从混乱状态转换为规范化的、AI友好的开发体系：
- **文档**: 49个混乱文档 → 七层清晰架构
- **代码**: 扁平结构 → DDD分层 + Feature-Driven
- **测试**: 零测试资产 → 完整的测试案例库 + 测试代码
- **部署**: 手动部署 → 标准化Docker + K8s配置

### 实施原则

1. **渐进式迁移** - 分模块逐步推进，不一次性重构全部
2. **保留历史** - 旧代码放入_deprecated/，确保功能正常后删除
3. **文档先行** - 先整理文档，再重构代码
4. **持续可用** - 每个阶段结束后系统仍可正常运行

### 时间表

| 阶段 | 时间 | 核心交付物 | 依赖 |
|------|------|----------|------|
| 阶段1 | Week 1 | 七层文档架构 | 无 |
| 阶段2 | Week 2-3 | 完整Wiki文档 | 阶段1 |
| 阶段3 | Week 4-6 | 重构后的代码结构 | 阶段2 |
| 阶段4 | Week 4-6 | 测试案例库 + 测试代码 | 阶段2 |
| 阶段5 | Week 7 | 标准化脚本和部署配置 | 阶段3 |
| 阶段6 | Week 8 | 规范落地工具 + 团队培训 | 全部 |

**注**: 阶段3和阶段4可以并行进行

---

## 阶段1: 文档重组（Week 1）

### 目标

将现有49个文档按照七层架构重新组织，建立清晰的文档导航体系。

### 任务清单

#### 1.1 创建七层目录结构

```bash
# 在项目根目录执行
mkdir -p docs/{1-specs,2-requirements,3-guides,4-planning,5-wiki,6-decisions,7-archive}
mkdir -p docs/1-specs/{database,api,backend,ui}
mkdir -p docs/2-requirements/{prd,features,stories}
mkdir -p docs/3-guides/{development,ui-design,testing}
mkdir -p docs/4-planning/{active,by-feature,backlog,completed}
mkdir -p docs/5-wiki/{architecture,testcase,workflow,environment,tenant,action-library,api-center}
mkdir -p docs/6-decisions
mkdir -p docs/7-archive/2024-Q4
```

#### 1.2 迁移现有文档

**详细迁移清单**（49个文档）：

| 原文件 | 新位置 | 类型 |
|--------|--------|------|
| **Specs层（7个）** |
| DATABASE_DESIGN.md | 1-specs/database/schema.md | Specs |
| DATABASE_CONFIGURATION.md | 1-specs/database/configuration.md | Specs |
| API_DOCUMENTATION.md | 1-specs/api/v2-documentation.md | Specs |
| API_COMMUNICATION_SPEC.md | 1-specs/api/communication-spec.md | Specs |
| HTTP_STATUS_CODE_SPEC.md | 1-specs/api/http-status-codes.md | Specs |
| DATAMAPPER_IMPLEMENTATION.md | 1-specs/backend/datamapper-implementation.md | Specs |
| DATAMAPPER_QUICK_REFERENCE.md | 1-specs/backend/datamapper-quick-reference.md | Specs |
| **Requirements层（2个）** |
| PRD.md | 2-requirements/prd/current.md | Requirements |
| USER-STORIES.md | 2-requirements/stories/user-stories.md | Requirements |
| **Guides层（3个）** |
| ENVIRONMENT_MANAGEMENT_GUIDE.md | 3-guides/development/environment-management.md | Guides |
| MULTI_TENANT_INTEGRATION_GUIDE.md | 3-guides/development/multi-tenant-integration.md | Guides |
| SELF_TEST_DOCUMENTATION.md | 3-guides/testing/self-test-guide.md | Guides |
| **Planning层（19个）** |
| FRONTEND_ADAPTATION_PLAN.md | 4-planning/by-feature/frontend-modernization/adaptation-plan.md | Planning |
| FRONTEND_API_FIXES.md | 4-planning/by-feature/frontend-modernization/api-fixes.md | Planning |
| FRONTEND_INTEGRATION_PLAN.md | 4-planning/by-feature/frontend-modernization/integration-plan.md | Planning |
| FRONTEND_PHASE3-5_PLAN.md | 4-planning/by-feature/frontend-modernization/phase3-5-plan.md | Planning |
| PHASE2_INTEGRATION_PLAN.md | 4-planning/by-feature/frontend-modernization/phase2-integration.md | Planning |
| FRONTEND_PHASE1_SUMMARY.md | 4-planning/completed/2024-Q4/frontend-phase1.md | Planning |
| FRONTEND_PHASE2_PROGRESS.md | 4-planning/completed/2024-Q4/frontend-phase2.md | Planning |
| FRONTEND_PHASE3_PROGRESS.md | 4-planning/completed/2024-Q4/frontend-phase3.md | Planning |
| FRONTEND_PHASE4_PROGRESS.md | 4-planning/completed/2024-Q4/frontend-phase4.md | Planning |
| FRONTEND_PHASE5_PROGRESS.md | 4-planning/completed/2024-Q4/frontend-phase5.md | Planning |
| ENVIRONMENT_MANAGEMENT_IMPLEMENTATION_PLAN.md | 4-planning/by-feature/environment-management/implementation-plan.md | Planning |
| MULTI_TENANT_IMPLEMENTATION_SUMMARY.md | 4-planning/completed/2024-Q4/multi-tenant-implementation.md | Planning |
| MULTI_TENANT_PROGRESS.md | 4-planning/completed/2024-Q4/multi-tenant-progress.md | Planning |
| IMPLEMENTATION_COMPLETE.md | 4-planning/completed/2024-Q4/implementation-complete.md | Planning |
| enhancement-plan.md | 4-planning/backlog/enhancement-plan.md | Planning |
| detailed-implementation-design.md | 4-planning/archive/detailed-implementation-design.md | Planning |
| KNOWN_ISSUES_AND_ROADMAP.md | 4-planning/backlog/roadmap.md | Planning |
| PROJECT_STATUS_2025-11-23.md | 4-planning/completed/2024-Q4/status-2024-11-23.md | Planning |
| FRONTEND_BACKEND_FEATURE_MATRIX.md | 5-wiki/architecture/frontend-backend-feature-matrix.md | Planning转Wiki |
| **Wiki层（3个现有+需补充）** |
| SELF_TEST_ORGANIZATION.md | 5-wiki/testcase/self-test-organization.md | Wiki |
| MULTI_TENANT_MIDDLEWARE.md | 5-wiki/tenant/middleware.md | Wiki |
| TESTCASE_WORKFLOW_INTEGRATION.md | 5-wiki/workflow/testcase-integration.md | Wiki |
| **Decisions层（7个）** |
| TEST_CASE_WORKFLOW_DESIGN.md | 6-decisions/2024-11-20-testcase-workflow-design-feature.md | Decisions |
| TESTCASE_REDESIGN.md | 6-decisions/2024-11-21-testcase-redesign-feature.md | Decisions |
| TESTCASE_STEP_DESIGN.md | 6-decisions/2024-11-22-testcase-step-design-feature.md | Decisions |
| TESTCASE_AS_WORKFLOW_VIEW.md | 6-decisions/2024-11-23-testcase-as-workflow-view-feature.md | Decisions |
| UNIFIED_WORKFLOW_ARCHITECTURE.md | 6-decisions/2024-11-24-unified-workflow-architecture.md | Decisions |
| FRONTEND_ARCHITECTURE_DESIGN.md | 6-decisions/2024-11-25-frontend-architecture-design.md | Decisions |
| TEST_PLATFORM_PRODUCTIZATION_DESIGN.md | 6-decisions/2024-11-26-test-platform-productization-architecture.md | Decisions |
| **Archive层（6个）** |
| testcase-workflow-integration.md | 7-archive/2024-Q4/testcase-workflow-integration.md | Archive |
| CI_PLATFORM_ALIGNMENT_ANALYSIS.md | 7-archive/2024-Q4/ci-platform-alignment.md | Archive |
| ARCHITECTURE_COMPARISON_AND_COEXISTENCE.md | 7-archive/2024-Q4/architecture-comparison.md | Archive |
| FRONTEND_INTEGRATION_SUMMARY.md | 7-archive/2024-Q4/frontend-integration-summary.md | Archive |
| FRONTEND_ARCHITECTURE_ENHANCEMENT.md | 7-archive/2024-Q4/frontend-architecture-enhancement.md | Archive |
| FRONTEND_IMPLEMENTATION_GUIDE.md | 3-guides/development/frontend-implementation.md | Archive转Guides |
| STEP_CONTROL_FLOW_DESIGN.md | 5-wiki/workflow/step-control-flow.md | 需确认 |

#### 1.3 创建索引和导航文档

**创建 docs/README.md:**
```markdown
# 测试平台文档导航

## 文档架构

本项目采用**七层文档架构**，详见 [文档组织规范设计](plans/2025-11-26-documentation-organization-design.md)

### 快速导航

| 层级 | 用途 | 适合场景 |
|------|------|---------|
| [1-specs/](1-specs/) | 技术规范 | 查看数据库Schema、API定义 |
| [2-requirements/](2-requirements/) | 需求管理 | 了解产品需求、用户故事 |
| [3-guides/](3-guides/) | 开发指南 | 学习如何开发、测试、部署 |
| [4-planning/](4-planning/) | 计划任务 | 查看Sprint计划、项目进度 |
| [5-wiki/](5-wiki/) | 业务知识 | 理解模块原理、架构设计 |
| [6-decisions/](6-decisions/) | 决策记录 | 追溯"为什么这么做" |
| [7-archive/](7-archive/) | 历史归档 | 参考历史文档 |

### 按角色导航

**新加入开发者**:
1. 先读 [5-wiki/architecture/overview.md](5-wiki/architecture/overview.md) 了解整体架构
2. 再读 [3-guides/development/](3-guides/development/) 学习开发流程
3. 查看 [1-specs/api/](1-specs/api/) 了解API规范

**AI系统**:
1. 理解需求 → [2-requirements/](2-requirements/)
2. 学习业务 → [5-wiki/{模块}/overview.md](5-wiki/)
3. 查阅决策 → [6-decisions/](6-decisions/)
4. 确认规范 → [1-specs/](1-specs/)

**产品人员**:
1. 查看需求 → [2-requirements/prd/](2-requirements/prd/)
2. 查看进度 → [4-planning/active/](4-planning/active/)
3. 规划路线 → [4-planning/backlog/roadmap.md](4-planning/backlog/roadmap.md)

## 文档维护规则

详见 [文档维护规则](plans/2025-11-26-documentation-organization-design.md#文档维护规则)
```

**创建 docs/6-decisions/index.md:**
```markdown
# 决策记录索引

## 按时间排序

| 日期 | 主题 | 类型 | 状态 |
|------|------|------|------|
| 2024-11-26 | 测试平台产品化设计 | architecture | Approved |
| 2024-11-25 | 前端架构设计 | architecture | Implemented |
| 2024-11-24 | 统一工作流架构 | architecture | Approved |
| 2024-11-23 | TestCase作为Workflow视图 | feature | Implemented |
| 2024-11-22 | TestCase步骤设计 | feature | Implemented |
| 2024-11-21 | TestCase重新设计 | feature | Implemented |
| 2024-11-20 | TestCase与Workflow设计 | feature | Implemented |

## 按模块分类

### 架构级决策
- [测试平台产品化设计](2024-11-26-test-platform-productization-architecture.md)
- [统一工作流架构](2024-11-24-unified-workflow-architecture.md)
- [前端架构设计](2024-11-25-frontend-architecture-design.md)

### 功能级决策

**测试用例模块:**
- [TestCase重新设计](2024-11-21-testcase-redesign-feature.md)
- [TestCase步骤设计](2024-11-22-testcase-step-design-feature.md)
- [TestCase作为Workflow视图](2024-11-23-testcase-as-workflow-view-feature.md)

**工作流模块:**
- [TestCase与Workflow设计](2024-11-20-testcase-workflow-design-feature.md)
- [统一工作流架构](2024-11-24-unified-workflow-architecture.md)
```

#### 1.4 执行迁移脚本

**创建 scripts/tools/migrate-docs.sh:**
```bash
#!/bin/bash
set -euo pipefail

# 文档迁移脚本
# 用法: ./migrate-docs.sh

GREEN='\033[0;32m'
NC='\033[0m'

log_info() {
  echo -e "${GREEN}[INFO]${NC} $1"
}

SOURCE_DIR="nextest-platform/docs"
TARGET_DIR="docs"

log_info "开始文档迁移..."

# 复制并重命名文件（示例）
cp "$SOURCE_DIR/DATABASE_DESIGN.md" "$TARGET_DIR/1-specs/database/schema.md"
cp "$SOURCE_DIR/API_DOCUMENTATION.md" "$TARGET_DIR/1-specs/api/v2-documentation.md"
# ... 其余文件

log_info "文档迁移完成！"
log_info "请检查 $TARGET_DIR 目录"
```

### 验收标准

- [ ] 七层目录结构已创建
- [ ] 49个文档已按分类迁移到新位置
- [ ] docs/README.md 导航文档已创建
- [ ] docs/6-decisions/index.md 决策索引已创建
- [ ] 旧文档目录标记为deprecated但保留

### 耗时估计

- 创建目录结构: 0.5小时
- 迁移文档: 3小时
- 创建索引: 1小时
- 验证和调整: 1.5小时
- **总计**: 6小时（1天）

---

## 阶段2: Wiki文档补全（Week 2-3）

### 目标

为每个业务模块创建完整的Wiki文档，建立代码-文档映射关系。

### 任务清单

#### 2.1 创建统一术语表

**创建 docs/5-wiki/glossary.md:**
```markdown
# 统一术语表

## 核心概念

| 概念 | 英文术语 | 说明 | 禁止使用 |
|------|---------|------|---------|
| 测试用例 | TestCase | 单个测试的定义和执行 | Test, TestSuite, Case |
| 测试分组 | TestGroup | 测试用例的分组管理 | Folder, Category |
| 工作流 | Workflow | 多步骤的编排和调度 | Pipeline, Flow |
| 工作流步骤 | Step / WorkflowStep | 工作流中的单个步骤 | Task, Action, Node |
| 动作 | Action | 可复用的操作单元 | Operation, Activity |
| 环境 | Environment | 运行环境配置 | Env, Config |
| 租户 | Tenant | 多租户隔离单位 | Customer, Account |
| 组织 | Organization | 租户下的组织 | Org, Company |
| 项目 | Project | 组织下的项目 | Workspace, Space |

## 使用规则

1. **代码中**: 必须使用英文标准术语
2. **文档中**: 中文优先使用标准译名
3. **UI中**: 统一使用标准译名
4. **禁止**: 使用同义词或自创术语
```

#### 2.2 按优先级创建Wiki文档

**P0: 核心模块**（Week 2）

1. **testcase模块** (`docs/5-wiki/testcase/`):
   - [ ] overview.md - 模块概览 + 代码映射
   - [ ] data-model.md - 数据模型设计
   - [ ] execution-flow.md - 执行流程
   - [ ] assertion-system.md - 断言系统
   - [ ] step-types.md - 步骤类型说明

2. **workflow模块** (`docs/5-wiki/workflow/`):
   - [ ] overview.md - 模块概览 + 代码映射
   - [ ] dag-execution.md - DAG执行逻辑
   - [ ] variable-system.md - 变量系统
   - [ ] action-types.md - 动作类型
   - [ ] integration-modes.md - 三种集成模式

3. **environment模块** (`docs/5-wiki/environment/`):
   - [ ] overview.md - 模块概览 + 代码映射
   - [ ] configuration.md - 配置管理
   - [ ] variable-management.md - 变量管理

**P1: 重要模块**（Week 3）

4. **tenant模块** (`docs/5-wiki/tenant/`):
   - [ ] overview.md - 模块概览
   - [ ] multi-tenant-design.md - 多租户设计
   - [ ] organization-project.md - 组织和项目
   - [ ] permission-model.md - 权限模型

5. **action-library模块** (`docs/5-wiki/action-library/`):
   - [ ] overview.md - 模块概览
   - [ ] template-management.md - 模板管理

**P2: 辅助模块**（按需补充）

6. **api-center模块**
7. **architecture文档**
   - [ ] module-boundaries.md - 模块边界定义
   - [ ] ddd-layers.md - DDD分层说明

#### 2.3 Wiki模板

**overview.md模板**（保存到 docs/5-wiki/_template-overview.md）:
```markdown
# {模块名称} - 模块概览

**版本**: 1.0
**最后更新**: 2025-XX-XX

---

## 模块简介

[一句话描述这个模块的职责]

## 核心概念

### 概念1
[解释]

### 概念2
[解释]

## 代码路径

### 后端
- **领域层**: `backend/internal/domain/{模块}/`
- **应用层**: `backend/internal/application/{模块}/`
- **持久层**: `backend/internal/infrastructure/persistence/models/{模块}.go`
- **接口层**: `backend/internal/interfaces/http/handler/{模块}_handler.go`

### 前端
- **特性模块**: `front/src/features/{模块}/`
- **页面组件**: `front/src/features/{模块}/pages/`
- **业务组件**: `front/src/features/{模块}/components/`

## 数据流

[用文字或简单图示说明数据如何流转]

## 核心接口

### API端点
- `POST /api/v2/{模块}` - [说明]
- `GET /api/v2/{模块}/:id` - [说明]

详见: [API文档](../../1-specs/api/v2-documentation.md#{模块}-api)

### 领域接口
```go
type {模块}Repository interface {
    Create(ctx context.Context, entity *{模块}) error
    GetByID(ctx context.Context, id string) (*{模块}, error)
}
```

## 与其他模块的关系

- **依赖**: 本模块依赖哪些模块
- **被依赖**: 哪些模块依赖本模块
- **边界规则**: 模块间调用的限制

## 相关文档

- **数据库设计**: [schema.md](../../1-specs/database/schema.md#{表名})
- **API文档**: [v2-documentation.md](../../1-specs/api/v2-documentation.md)
- **决策记录**: [相关ADR](../../6-decisions/)

## 常见问题

### Q1: [问题]
A: [回答]
```

### 验收标准

- [ ] 所有P0模块的overview.md已创建
- [ ] 每个overview.md包含代码路径映射
- [ ] glossary.md术语表已完成
- [ ] module-boundaries.md已创建，明确模块边界

### 耗时估计

- P0模块文档(testcase/workflow/environment): 8小时
- P1模块文档(tenant/action-library): 4小时
- 架构文档(glossary/boundaries): 4小时
- **总计**: 16小时（2周）

---

## 阶段3: 代码重构（Week 4-6）

### 目标

将后端和前端代码按照DDD分层和Feature-Driven架构重构。

### 子阶段3.1: 项目根目录重组（Week 4）

#### 任务

1. **重命名主目录:**
```bash
# 在testplatform/根目录执行
mv nextest-platform backend
mv NextTestPlatformUI front

# 创建统一docs/
# (已在阶段1完成)
```

2. **移动文档到根目录:**
```bash
# 将backend/docs/内容移至docs/
# 将front/docs/内容移至docs/
# 删除空的backend/docs和front/docs目录
```

3. **更新README:**
- 更新根目录README.md
- 更新backend/README.md
- 更新front/README.md

### 子阶段3.2: 后端DDD重构（Week 4-5）

#### 步骤

**Step 1: 创建新的目录结构**
```bash
cd backend/internal

# 创建DDD分层目录
mkdir -p domain/{testcase,workflow,environment,tenant}
mkdir -p application/{testcase,workflow,environment,tenant}
mkdir -p infrastructure/{persistence,websocket,expression,database}
mkdir -p infrastructure/persistence/{models,repository}
mkdir -p interfaces/{http,websocket}
mkdir -p interfaces/http/{handler,middleware}
mkdir -p shared/{config,errors,testutil}
```

**Step 2: 分模块迁移（以testcase为例）**

```bash
# 保留旧代码
mkdir -p _deprecated/testcase

# 迁移domain层
cp -r testcase/case.go domain/testcase/
cp -r testcase/group.go domain/testcase/
cp -r testcase/types.go domain/testcase/

# 迁移application层
cp -r service/testcase_service.go application/testcase/service.go
cp -r testcase/executor.go application/testcase/executor.go

# 迁移infrastructure层
cp -r models/test_case.go infrastructure/persistence/models/testcase.go
cp -r repository/testcase_repo.go infrastructure/persistence/repository/

# 迁移interfaces层
cp -r handler/testcase_handler.go interfaces/http/handler/

# 备份旧代码
mv testcase _deprecated/
mv service/testcase_service.go _deprecated/
mv handler/testcase_handler.go _deprecated/
```

**Step 3: 更新导入路径**

使用工具批量更新import路径:
```bash
# 使用gofmt或goland进行重构
# 或使用sed批量替换
find backend/internal -name "*.go" -exec sed -i '' 's|testplatform/nextest-platform/internal/testcase|testplatform/backend/internal/domain/testcase|g' {} \;
```

**Step 4: 运行测试**
```bash
cd backend
make test-unit
make test-integration

# 确保所有测试通过后，删除_deprecated/
```

#### 模块迁移优先级

1. Week 4: testcase模块
2. Week 5: workflow模块
3. Week 5: environment + tenant模块

### 子阶段3.3: 前端Feature重构（Week 5-6）

#### 步骤

**Step 1: 创建features目录**
```bash
cd front/src
mkdir -p features/{testcase,workflow,environment,library,api-center,dashboard,admin,auth}
```

**Step 2: 迁移testcase feature**
```bash
# 创建feature目录结构
mkdir -p features/testcase/{pages,components,hooks}

# 迁移页面组件
mv components/TestCaseList.tsx features/testcase/pages/
mv components/TestCaseEditor.tsx features/testcase/pages/

# 迁移业务组件
mv components/testcase/* features/testcase/components/

# 创建types.ts
cat > features/testcase/types.ts << 'EOF'
export interface TestCase {
  id: string;
  name: string;
  // ...
}
EOF
```

**Step 3: 整理共享组件**
```bash
mkdir -p components/ui components/layout

# 识别纯UI组件（无业务逻辑）并移至components/ui/
# 如: Button, Modal, Input, Table等
```

**Step 4: 更新导入路径**
```bash
# 使用IDE重构功能或手动更新
# 例如: import TestCaseList from '../TestCaseList'
#  改为: import TestCaseList from './pages/TestCaseList'
```

**Step 5: 运行测试**
```bash
cd front
npm run test
npm run build

# 确保编译通过
```

#### Feature迁移优先级

1. Week 5: testcase + workflow
2. Week 6: environment + library + api-center
3. Week 6: dashboard + admin + auth

### 风险控制

1. **渐进式迁移**: 每个模块迁移后立即测试
2. **保留旧代码**: 使用_deprecated/目录，确保可回滚
3. **功能验收**: 每个模块迁移后进行手动功能测试
4. **性能验证**: 监控重构后的性能指标

### 验收标准

- [ ] 后端代码按DDD分层完成
- [ ] 前端代码按Feature-Driven完成
- [ ] 所有测试通过
- [ ] 功能无回归
- [ ] 代码导入路径正确
- [ ] _deprecated/目录已清理

### 耗时估计

- 后端重构: 10天
- 前端重构: 10天
- 测试和验证: 2天
- **总计**: 22天（约3周，实际并行2-3周）

---

## 阶段4: 测试资产建设（Week 4-6）

**注**: 本阶段与阶段3并行进行

### 目标

建立完整的测试案例库和测试代码体系。

### 子阶段4.1: 测试案例库创建（Week 4）

#### 任务

**Step 1: 创建testcases/目录结构**
```bash
mkdir -p testcases/{api,workflow,e2e,templates,datasets}
mkdir -p testcases/api/{user-management,testcase-management,workflow-execution,environment-switching}
mkdir -p testcases/workflow/{basic,advanced,integration}
```

**Step 2: 迁移现有测试数据**
```bash
# 将backend/examples/sample-tests.json中的数据拆分
# 按模块分类保存到testcases/api/下

# 示例: 提取测试用例管理的测试
cat backend/examples/sample-tests.json | jq '.testcases' > testcases/api/testcase-management/sample-cases.json
```

**Step 3: 创建测试模板**
```bash
# HTTP请求模板
cat > testcases/templates/http-request-template.json << 'EOF'
{
  "name": "HTTP请求测试模板",
  "description": "通用HTTP请求测试用例模板",
  "type": "http",
  "config": {
    "method": "GET",
    "url": "{{BASE_URL}}/api/v2/resource",
    "headers": {},
    "body": null
  },
  "assertions": [
    {
      "type": "status_code",
      "expected": 200
    }
  ]
}
EOF
```

**Step 4: 创建index.json**
```json
{
  "version": "1.0",
  "lastUpdated": "2025-11-26",
  "categories": {
    "api": {
      "count": 15,
      "modules": ["user-management", "testcase-management", "workflow-execution"]
    },
    "workflow": {
      "count": 8,
      "modules": ["basic", "advanced"]
    }
  }
}
```

#### 验收标准

- [ ] testcases/目录结构已创建
- [ ] 现有测试数据已迁移并分类
- [ ] 至少创建3个测试模板
- [ ] index.json已创建
- [ ] 每个子目录都有README.md

### 子阶段4.2: 后端测试代码规范化（Week 5）

#### 任务

**Step 1: 创建tests/目录**
```bash
cd backend
mkdir -p tests/{integration,e2e,fixtures,mocks,testutil}
```

**Step 2: 迁移测试工具**
```bash
# 将internal/testutil/移至tests/testutil/
mv internal/testutil tests/
```

**Step 3: 创建集成测试**
```bash
cat > tests/integration/testcase_api_test.go << 'EOF'
package integration

import (
    "testing"
    "testplatform/backend/tests/testutil"
)

func TestTestCaseAPI(t *testing.T) {
    // 启动测试服务器
    server := testutil.NewTestServer(t)
    defer server.Close()

    // 测试用例...
}
EOF
```

**Step 4: 更新Makefile**
```makefile
test-unit:
    go test ./internal/... -v

test-integration:
    go test ./tests/integration/... -v

test-e2e:
    go test ./tests/e2e/... -v

test-all:
    make test-unit && make test-integration && make test-e2e
```

### 子阶段4.3: 前端测试代码规范化（Week 6）

#### 任务

**Step 1: 创建__tests__/目录**
```bash
cd front/src
mkdir -p __tests__/{setup,mocks,utils}
```

**Step 2: 配置测试环境**
```typescript
// src/__tests__/setup.ts
import { beforeAll, afterAll } from 'vitest';

beforeAll(() => {
  // 全局测试设置
});

afterAll(() => {
  // 清理
});
```

**Step 3: 创建Mock**
```typescript
// src/__tests__/mocks/api.ts
export const mockTestCaseApi = {
  getList: vi.fn(),
  getById: vi.fn(),
  create: vi.fn(),
};
```

**Step 4: 创建测试工具**
```typescript
// src/__tests__/utils/render.tsx
import { render } from '@testing-library/react';
import { AppProvider } from '../../contexts/AppContext';

export const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <AppProvider>
      {ui}
    </AppProvider>
  );
};
```

### 验收标准

- [ ] testcases/目录有至少30个业务测试用例
- [ ] 后端tests/目录已创建
- [ ] 前端__tests__/目录已创建
- [ ] 测试覆盖率>=60%

### 耗时估计

- 测试案例库创建: 2天
- 后端测试代码: 3天
- 前端测试代码: 3天
- **总计**: 8天（约1.5周）

---

## 阶段5: 脚本与部署规范化（Week 7）

### 目标

建立标准化的脚本和部署配置体系。

### 任务清单

#### 5.1 创建scripts/目录

```bash
mkdir -p scripts/{dev,build,test,deploy,ci,maintenance,tools}
```

#### 5.2 创建核心脚本

**开发脚本**:
```bash
# scripts/dev/setup.sh - 初始化开发环境
# scripts/dev/reset-db.sh - 重置数据库
# scripts/dev/seed-data.sh - 填充测试数据
```

**构建脚本**:
```bash
# scripts/build/build-backend.sh
# scripts/build/build-front.sh
# scripts/build/build-all.sh
```

**测试脚本**:
```bash
# scripts/test/run-unit-tests.sh
# scripts/test/run-integration-tests.sh
# scripts/test/run-e2e-tests.sh
```

**工具脚本**:
```bash
# scripts/tools/doc-check.sh - 文档规范检查
# scripts/tools/import-testcases.sh - 导入测试用例
# scripts/tools/export-testcases.sh - 导出测试用例
```

#### 5.3 创建部署配置

**Docker配置**:
```bash
mkdir -p deploy/docker/{backend,front}

# deploy/docker/backend/Dockerfile
# deploy/docker/front/Dockerfile
# deploy/docker/docker-compose.yml
```

**Kubernetes配置**:
```bash
mkdir -p deploy/kubernetes/{base,overlays}
mkdir -p deploy/kubernetes/overlays/{dev,staging,prod}
```

#### 5.4 创建CI/CD配置

```bash
mkdir -p .github/workflows

# .github/workflows/ci.yml - 持续集成
# .github/workflows/cd-dev.yml - 部署到开发环境
# .github/workflows/testcase-validation.yml - 测试用例验证
```

### 验收标准

- [ ] scripts/目录完整
- [ ] 核心脚本已创建并测试通过
- [ ] deploy/docker/配置完成，docker-compose可启动
- [ ] .github/workflows/CI配置完成

### 耗时估计

- 创建脚本: 2天
- 创建部署配置: 2天
- 创建CI配置: 1天
- **总计**: 5天（1周）

---

## 阶段6: 规范落地与培训（Week 8）

### 目标

创建规范落地工具，并进行团队培训。

### 任务清单

#### 6.1 创建文档模板

```bash
# 在docs/创建模板文件
docs/6-decisions/_template.md
docs/5-wiki/_template-overview.md
docs/3-guides/_template.md
```

#### 6.2 创建检查脚本

**scripts/tools/doc-check.sh:**
- 检查ADR文件名格式
- 检查Wiki文档映射声明
- 检查禁止术语

**scripts/tools/term-check.sh:**
- 检查代码中的术语使用
- 检查文档中的术语使用

#### 6.3 配置git hooks

```bash
# .git/hooks/pre-commit
#!/bin/bash
./scripts/tools/doc-check.sh
```

#### 6.4 创建.claude/项目上下文

```markdown
# .claude/project-context.md

本项目使用七层文档架构和DDD代码结构。

在修改代码前，必须先阅读对应的Wiki文档:
- 修改testcase模块 → 先读 docs/5-wiki/testcase/overview.md
- 修改workflow模块 → 先读 docs/5-wiki/workflow/overview.md

决策记录规则:
- 架构级决策 → 创建ADR（architecture）
- 功能级决策 → 创建ADR（feature）

术语表: docs/5-wiki/glossary.md
```

#### 6.5 团队培训

**培训内容**:
1. 七层文档架构介绍（30分钟）
2. 代码结构规范讲解（30分钟）
3. 测试资产管理流程（20分钟）
4. 实操演练（40分钟）

**培训材料**:
- PPT: docs/plans/training-slides.pdf
- 实操手册: docs/3-guides/development/onboarding.md

### 验收标准

- [ ] 所有模板文件已创建
- [ ] 检查脚本已创建并集成到git hooks
- [ ] .claude/project-context.md已创建
- [ ] 团队培训已完成

### 耗时估计

- 创建模板和工具: 2天
- 准备培训材料: 1天
- 进行培训: 0.5天
- **总计**: 3.5天（约1周）

---

## 风险控制

### 风险识别

| 风险 | 影响 | 概率 | 应对措施 |
|------|------|------|---------|
| 重构导致功能回归 | 高 | 中 | 1. 渐进式迁移 2. 保留旧代码 3. 充分测试 |
| 团队不熟悉新结构 | 中 | 高 | 1. 详细文档 2. 团队培训 3. Code Review |
| 时间延期 | 中 | 中 | 1. 分模块实施 2. 调整优先级 3. 并行工作 |
| 文档维护成本高 | 低 | 高 | 1. 自动化检查 2. 模板化 3. AI辅助 |

### 回滚策略

1. **文档回滚**: 保留旧文档在7-archive/
2. **代码回滚**: 保留_deprecated/目录
3. **测试回滚**: 保留原有测试数据

---

## 验收标准

### 整体验收

- [ ] 文档: 49个文档已按七层架构组织
- [ ] 代码: 后端DDD分层完成，前端Feature-Driven完成
- [ ] 测试: testcases/有>=30个测试用例，测试覆盖率>=60%
- [ ] 脚本: scripts/和deploy/目录完整
- [ ] CI/CD: GitHub Actions配置完成
- [ ] 培训: 团队已完成培训

### 质量指标

| 指标 | 目标 | 验证方式 |
|------|------|---------|
| 文档完整性 | 100% | 检查清单 |
| 代码测试覆盖率 | >=60% | go test -cover, npm run test:coverage |
| 文档规范符合度 | >=95% | scripts/tools/doc-check.sh |
| 术语统一度 | 100% | scripts/tools/term-check.sh |
| CI通过率 | 100% | GitHub Actions绿色 |

---

**计划创建日期**: 2025-11-26
**预计开始日期**: 2025-12-01
**预计完成日期**: 2026-01-26（8周）
