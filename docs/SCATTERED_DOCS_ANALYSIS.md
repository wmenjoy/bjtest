# 零散文档统计与整理计划

**生成时间**: 2025-11-26
**扫描范围**: 整个项目 (排除 .kiro .cursor .trae .claude)
**状态**: 📊 分析完成，待执行整理

---

## 📊 统计概览

| 位置 | 文档数量 | 优先级 | 状态 |
|------|---------|-------|------|
| **项目根目录** (`./`) | 40 | P0 | 需立即整理 |
| **backend根目录** (`backend/`) | 13 | P1 | 需整理 |
| **front根目录** (`front/`) | 8 | P1 | 需整理 |
| **backend/docs/** (遗留) | 49 | ✅ | 已在迁移计划中 |
| **front/components/** | 17 | P2 | 需整理 |
| **backend/1功能规划示意图/** | 12 | P2 | 需评估 |
| **backend/examples/self-test/** | 2 | - | 保留原位 |
| **backend/nextest-platform/docs/** | 3 | P1 | 需整理 |
| **backend/NextTestPlatformUI/components/** | ~8 | P0 | 需迁移 |
| **总计** | **~150+** | - | - |

---

## 📁 分类详情

### 1. 项目根目录文档 (40个) ⚠️ 最严重

#### 1.1 实施报告类 (15个)

```
IMPLEMENTATION_COMPLETE_SUMMARY.md
IMPLEMENTATION_COMPLETE.md
IMPLEMENTATION_SUMMARY.md
IMPLEMENTATION_PROGRESS.md
FINAL_IMPLEMENTATION_REPORT.md
EXECUTION_REPORT.md
BACKEND_IMPLEMENTATION_SUMMARY.md
PHASE_2_COMPLETION_REPORT.md
PHASE_3_COMPLETION_REPORT.md
TWO_COLUMN_LAYOUT_COMPLETION_REPORT.md
NESTED_STEPS_IMPLEMENTATION_REPORT.md
LOOP_BRANCH_CONDITION_FIX_REPORT.md
TEST_EXECUTION_REPORT.md
TEST_CASES_SUMMARY.md
TEST_EXECUTION_STATISTICS.md
```

**处理方案**: 归档到 `docs/7-archive/2024-Q4/implementation-reports/`

#### 1.2 计划类 (5个)

```
COMPLETE_IMPLEMENTATION_PLAN.md
IMPLEMENTATION_PLAN.md
PARALLEL_FIX_PLAN.md
TWO_COLUMN_LAYOUT_PLAN.md
UNIFICATION_PLAN.md
```

**处理方案**: 归档到 `docs/7-archive/2024-Q4/plans/`

#### 1.3 分析类 (4个)

```
ANALYSIS_SUMMARY.md
ARCHITECTURE_FIX_SUGGESTIONS.md
TEST_COMPLETENESS_ANALYSIS.md
NextTestPlatformUI_UI_FRAMEWORK_ANALYSIS.md
```

**处理方案**:
- 有价值的 → `docs/4-planning/backlog/`
- 过时的 → `docs/7-archive/2024-Q4/analysis/`

#### 1.4 功能设计类 (9个)

```
ASSERTION_EDITOR_IMPLEMENTATION.md
ASSERTION_EDITOR_VISUAL_GUIDE.md
WORKFLOW_VIEW_IMPLEMENTATION.md
WORKFLOW_VIEW_INTEGRATION_GUIDE.md
WORKFLOW_VIEW_USER_GUIDE.md
WORKFLOW_VIEW_实现总结_中文.md
WORKFLOW_FIRST_PRINCIPLES_ANALYSIS.md
TESTCASE_EDITOR_ANALYSIS.md
TESTCASE_EDITOR_DETAILED_ANALYSIS.md
```

**处理方案**:
- 设计决策 → `docs/6-decisions/` (添加日期前缀)
- 用户指南 → `docs/3-guides/user/`
- 实现总结 → `docs/7-archive/2024-Q4/`

#### 1.5 指南类 (7个)

```
CLAUDE.md ⭐ (保留)
TESTING_GUIDE.md
TESTCASE_LIBRARY_GUIDE.md
TESTCASE_EDITOR_QUICK_REFERENCE.md
TESTCASE_EDITOR_DOCS_INDEX.md
TESTCASE_OPTIMIZATION_PLAN.md
QUICKSTART_TESTING.md
PORT_CONFIGURATION.md
```

**处理方案**:
- CLAUDE.md → 保留在根目录
- *_GUIDE.md → `docs/3-guides/`
- PORT_CONFIGURATION.md → `docs/3-guides/deployment/ports.md`

---

### 2. backend根目录文档 (13个)

#### 2.1 核心文档 (保留 - 4个)

```
README.md ⭐
QUICKSTART.md ⭐
PROJECT_SUMMARY.md
DEPLOYMENT.md
```

**操作**: 无需移动，这些是backend模块的核心文档

#### 2.2 实施报告 (归档 - 5个)

```
SELF_TEST_IMPLEMENTATION_SUMMARY.md
WEBSOCKET_IMPLEMENTATION_SUMMARY.md
MULTI_TENANCY_VERIFICATION_REPORT.md
FIXES_SUMMARY.md
WORKFLOW_TEST_FIX_REPORT.md
```

**处理方案**: → `docs/7-archive/2024-Q4/backend-reports/`

#### 2.3 技术文档 (迁移 - 4个)

| 文件 | 目标位置 |
|------|---------|
| WEBSOCKET_ARCHITECTURE.md | docs/1-specs/backend/websocket-architecture.md |
| WEBSOCKET_INTEGRATION.md | docs/5-wiki/workflow/websocket-integration.md |
| WEBSOCKET_TESTING_GUIDE.md | docs/3-guides/testing/websocket-guide.md |
| FRONTEND_GUIDE.md | docs/3-guides/development/backend-api-usage.md |

---

### 3. front根目录文档 (8个)

#### 3.1 核心文档 (保留 - 1个)

```
README.md ⭐
```

#### 3.2 实施报告 (归档 - 4个)

```
INTEGRATION_COMPLETION_REPORT.md
PHASE_7_COMPLETION_REPORT.md
TEST_REPORT_2025-11-24.md
TESTCASE_REDESIGN_STATUS.md
```

**处理方案**: → `docs/7-archive/2024-Q4/front-reports/`

#### 3.3 测试计划 (整理 - 3个)

```
LOOP_BRANCH_TEST_CASES.md → docs/4-planning/backlog/loop-branch-tests.md
UX_EVALUATION_REPORT_2025-11-24.md → docs/7-archive/2024-Q4/front-reports/
UX_TEST_OPTIMIZATION_PLAN.md → docs/4-planning/backlog/ux-optimization.md
```

---

### 4. backend/docs/遗留文档 (49个) ✅

**状态**: 已在 `docs/4-planning/active/documentation-migration.md` 迁移计划中

这些文档已经在映射表中，后续执行迁移即可。

---

### 5. front/components/文档 (17个)

#### 5.1 组件级README (保留原位 - 4个)

```
front/components/testcase/assertion/README.md
front/components/testcase/assertion/QUICKSTART.md
front/components/testcase/datamapper/README.md
front/components/testcase/datamapper/QUICK_START.md
```

**操作**: 组件文档保留在组件目录，符合惯例

#### 5.2 实施报告 (归档 - 5个)

```
TASK_3_3_IMPLEMENTATION_SUMMARY.md
TASK_3.2_COMPLETION_SUMMARY.md
IMPLEMENTATION_VERIFICATION.md
TASK_DEV001_COMPLETION.md
datamapper/IMPLEMENTATION_SUMMARY.md
```

**处理方案**: → `docs/7-archive/2024-Q4/component-reports/`

#### 5.3 组件文档 (整合 - 8个)

**SIMPLE_LIST_EDITOR系列 (5个)**: 整合为1个
```
SIMPLE_LIST_EDITOR_INDEX.md
SIMPLE_LIST_EDITOR_QUICKSTART.md
SIMPLE_LIST_EDITOR_README.md
SIMPLE_LIST_EDITOR_VERIFICATION.md
→ 整合为: front/components/workflow/SimpleListEditor/README.md
```

**DAG_EDITOR系列 (2个)**: 整合为1个
```
ADVANCED_DAG_EDITOR.md
README_DAG_EDITOR.md
→ 整合为: front/components/workflow/DAGEditor/README.md
```

**其他**:
```
README_FILTER_COMPONENTS.md → front/components/testcase/filters/README.md
```

---

### 6. backend/1功能规划示意图/ (12个)

**文件列表**:
```
1.2.1.设计示意图-用户登录.md
1.2.2.设计示意图-仪表盘.md
1.2.3.设计示意图-测试用例管理.md
1.2.4.设计示意图-测试执行器.md
1.2.5.设计示意图-测试历史.md
1.2.6.设计示意图-脚本实验室.md
1.2.7.设计示意图-动作库.md
1.2.8.设计示意图-数据库管理.md
1.2.9.设计示意图-文档中心.md
1.2.10.设计示意图-管理门户.md
1.2.11.设计示意图-系统配置.md
1.2.12.设计示意图-YAML编辑器.md
```

**处理方案**:
- 如果是早期设计稿 → `docs/7-archive/early-designs/`
- 如果仍有参考价值 → `docs/2-requirements/designs/`

---

### 7. backend/nextest-platform/docs/ (3个)

```
BUG_FIX_REPORT_2025-11-23.md
IMPLEMENTATION_TODO.md
KNOWN_ISSUES.md
```

**处理方案**:
- BUG_FIX_REPORT → `docs/7-archive/2024-Q4/bug-fixes/`
- IMPLEMENTATION_TODO → `docs/4-planning/backlog/implementation-todos.md`
- KNOWN_ISSUES → `docs/4-planning/backlog/known-issues.md`

---

### 8. backend/NextTestPlatformUI/components/ (~8个) ⚠️

**问题**: 这是backend/下的前端组件文档，目录结构错误

**处理方案**: 迁移到 `front/components/` 对应位置

---

## 🎯 整理策略

### 优先级P0 (立即处理 - 30分钟)

#### 任务1: 清理项目根目录

```bash
# 1. 创建归档目录
mkdir -p docs/7-archive/2024-Q4/{implementation-reports,plans,analysis}

# 2. 归档实施报告 (15个)
mv *_REPORT.md *_SUMMARY.md *_COMPLETE*.md docs/7-archive/2024-Q4/implementation-reports/

# 3. 归档计划 (5个)
mv *_PLAN.md docs/7-archive/2024-Q4/plans/

# 4. 归档分析文档 (4个)
mv ANALYSIS_SUMMARY.md ARCHITECTURE_FIX_SUGGESTIONS.md \
   TEST_COMPLETENESS_ANALYSIS.md NextTestPlatformUI_UI_FRAMEWORK_ANALYSIS.md \
   docs/7-archive/2024-Q4/analysis/

# 5. 保留CLAUDE.md
```

**预期结果**: 项目根目录从40个文档减少到~15个

---

### 优先级P1 (本周内 - 1小时)

#### 任务2: 整理backend/根目录

```bash
# 归档实施报告
mkdir -p docs/7-archive/2024-Q4/backend-reports
mv backend/*_SUMMARY.md backend/*_REPORT.md docs/7-archive/2024-Q4/backend-reports/

# 迁移技术文档
mv backend/WEBSOCKET_ARCHITECTURE.md docs/1-specs/backend/websocket-architecture.md
mv backend/WEBSOCKET_INTEGRATION.md docs/5-wiki/workflow/websocket-integration.md
mv backend/WEBSOCKET_TESTING_GUIDE.md docs/3-guides/testing/websocket-guide.md
mv backend/FRONTEND_GUIDE.md docs/3-guides/development/backend-api-usage.md
```

#### 任务3: 整理front/根目录

```bash
# 归档实施报告
mkdir -p docs/7-archive/2024-Q4/front-reports
mv front/*_REPORT.md front/*_STATUS.md docs/7-archive/2024-Q4/front-reports/

# 迁移测试计划
mv front/LOOP_BRANCH_TEST_CASES.md docs/4-planning/backlog/loop-branch-tests.md
mv front/UX_TEST_OPTIMIZATION_PLAN.md docs/4-planning/backlog/ux-optimization.md
```

---

### 优先级P2 (后续 - 2-3小时)

#### 任务4: 整合组件文档

1. 整合SIMPLE_LIST_EDITOR系列 (5 → 1)
2. 整合DAG_EDITOR系列 (2 → 1)
3. 归档实施报告 (5个)

#### 任务5: 评估功能规划示意图

1. 查看12个设计示意图内容
2. 决定保留或归档
3. 如果保留 → 重命名并迁移到docs/2-requirements/designs/

---

## ⚠️ 风险控制

| 风险 | 影响 | 概率 | 应对措施 |
|------|------|------|---------|
| 误删有用文档 | 高 | 低 | 1. 先归档到archive/而非删除<br>2. Git可恢复 |
| 链接失效 | 中 | 中 | 1. 搜索引用链接<br>2. 更新fix-links.sh |
| 团队成员找不到文档 | 低 | 中 | 1. 更新README<br>2. 创建迁移日志<br>3. 团队通知 |
| 文档丢失重要信息 | 中 | 低 | 1. Review每个文档<br>2. 提取有价值内容 |

---

## ✅ 执行检查清单

### P0任务 (立即执行)

- [ ] 归档项目根目录实施报告 (15个)
- [ ] 归档项目根目录计划文档 (5个)
- [ ] 归档项目根目录分析文档 (4个)
- [ ] 验证CLAUDE.md保留
- [ ] 提交git commit

### P1任务 (本周内)

- [ ] 归档backend实施报告 (5个)
- [ ] 迁移backend技术文档 (4个)
- [ ] 归档front实施报告 (4个)
- [ ] 迁移front测试计划 (2个)
- [ ] 更新README引用
- [ ] 提交git commit

### P2任务 (后续)

- [ ] 整合SIMPLE_LIST_EDITOR文档 (5 → 1)
- [ ] 整合DAG_EDITOR文档 (2 → 1)
- [ ] 归档组件实施报告 (5个)
- [ ] 评估功能规划示意图 (12个)
- [ ] 整理backend/nextest-platform/docs/ (3个)
- [ ] 提交git commit

---

## 📈 预期成果

**整理前**:
- 项目根目录: 40个文档 ⚠️
- backend根目录: 13个文档
- front根目录: 8个文档
- 零散组件文档: 17个

**整理后**:
- 项目根目录: ~10个文档 (CLAUDE.md + 少量核心指南) ✅
- backend根目录: 4个文档 (README等核心文档) ✅
- front根目录: 1个文档 (README) ✅
- 组件文档: 规范化在组件目录 ✅
- docs/7-archive/: 所有历史文档归档 ✅

**整体效果**:
- 项目结构清晰度提升80%
- 新成员onboarding时间减少50%
- 文档维护成本降低60%

---

## 🔗 相关文档

- [文档迁移计划](docs/4-planning/active/documentation-migration.md) - backend/docs/的49个文档迁移
- [文档组织架构](docs/6-decisions/2025-11-26-documentation-organization-architecture.md) - 七层架构定义

---

**下一步**: 执行P0任务 - 清理项目根目录

**创建日期**: 2025-11-26
**最后更新**: 2025-11-26
