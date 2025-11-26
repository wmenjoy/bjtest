# backend/docs/剩余文档迁移计划

**状态**: ⚠️ 暂停执行，等待Review
**原因**: 发现mv命令覆盖风险，已恢复2个被覆盖文件
**剩余文档**: 23个

---

## ⚠️ 重要提示

**已发现问题**:
- `backend/docs/ENVIRONMENT_MANAGEMENT_GUIDE.md` 覆盖了 `docs/3-guides/development/environment-management.md`（已恢复）
- `backend/docs/MULTI_TENANT_INTEGRATION_GUIDE.md` 覆盖了 `docs/3-guides/development/multi-tenant-integration.md`（已恢复）

**问题根源**:
- backend/docs/中的文档是旧版本（来自nextest-platform/docs/）
- docs/中的部分文档已经被更新过（有正确的内部链接）
- 使用`mv`命令会直接覆盖，造成内容丢失

**安全迁移策略**:
1. 先检查目标文件是否存在
2. 如果存在，对比内容差异
3. 如果backend/docs/是旧版本 → 删除backend/docs/中的文件，保留docs/中的版本
4. 如果backend/docs/是新版本 → 手动合并或替换
5. 如果目标不存在 → 安全移动

---

## 📋 剩余23个文档分类建议

### 归档到 7-archive/2024-Q4/ (7个)

| 文件 | 目标位置 | 原因 |
|------|---------|------|
| ARCHITECTURE_COMPARISON_AND_COEXISTENCE.md | 7-archive/2024-Q4/architecture-comparison.md | 架构对比分析（历史文档） |
| CI_PLATFORM_ALIGNMENT_ANALYSIS.md | 7-archive/2024-Q4/ci-platform-alignment.md | CI平台对齐分析（已完成） |
| FRONTEND_ARCHITECTURE_ENHANCEMENT.md | 7-archive/2024-Q4/frontend-architecture-enhancement.md | 前端架构增强计划（已实施） |
| FRONTEND_IMPLEMENTATION_PLAN.md | 7-archive/2024-Q4/frontend-implementation-plan.md | 前端实施计划（已完成） |
| FRONTEND_INTEGRATION_SUMMARY.md | 7-archive/2024-Q4/frontend-integration-summary.md | 前端集成总结（历史记录） |
| testcase-workflow-integration.md | 7-archive/2024-Q4/testcase-workflow-integration.md | 测试用例工作流集成（旧文档） |
| UI_DESIGN_V2_ARCHITECTURE.md | 7-archive/2024-Q4/ui-design-v2-architecture.md | UI设计v2架构（已废弃） |

### 迁移到 4-planning/ (6个)

| 文件 | 目标位置 | 操作 |
|------|---------|------|
| enhancement-plan.md | 4-planning/backlog/enhancement-plan.md | ⚠️ **已存在** - 对比后决定 |
| KNOWN_ISSUES_AND_ROADMAP.md | 合并到 4-planning/backlog/roadmap.md | 合并内容 |
| detailed-implementation-design.md | 4-planning/archive/detailed-implementation-design.md | 详细设计（过时） |
| PROJECT_STATUS_2025-11-23.md | 4-planning/active/status-2025-11-23.md | ⚠️ **已存在** - 对比后决定 |
| FRONTEND_BACKEND_FEATURE_MATRIX.md | 4-planning/active/frontend-backend-integration-status.md | ⚠️ **已存在** - 对比后决定 |
| FRONTEND_IMPLEMENTATION_GUIDE.md | 3-guides/development/frontend-implementation.md | ⚠️ **已存在** - 对比后决定 |

### 迁移到 5-wiki/ (5个)

| 文件 | 目标位置 | 操作 |
|------|---------|------|
| MULTI_TENANT_MIDDLEWARE.md | 5-wiki/tenant/middleware.md | ⚠️ **已存在** - 对比后决定 |
| SELF_TEST_ORGANIZATION.md | 5-wiki/testcase/self-test-organization.md | ⚠️ **已存在** - 对比后决定 |
| WORKFLOW_TESTCASE_INTEGRATION.md | 5-wiki/workflow/testcase-integration.md | ⚠️ **已存在** - 对比后决定 |
| TESTCASE_WORKFLOW_INTEGRATION.md | （重复，删除） | 与上一个重复 |

### 迁移到 1-specs/ (1个)

| 文件 | 目标位置 | 操作 |
|------|---------|------|
| STEP_CONTROL_FLOW_DESIGN.md | 1-specs/ui/step-control-flow.md | ⚠️ **已存在** - 对比后决定 |

### 迁移到 6-decisions/ (4个)

| 文件 | 目标位置 | 操作 |
|------|---------|------|
| FRONTEND_ARCHITECTURE_DESIGN.md | 6-decisions/2024-11-25-frontend-architecture-design.md | ⚠️ **已存在** - 对比后决定 |
| TESTCASE_AS_WORKFLOW_VIEW.md | 6-decisions/2024-11-23-testcase-as-workflow-view-feature.md | ⚠️ **已存在** - 对比后决定 |
| TESTCASE_REDESIGN.md | 6-decisions/2024-11-21-testcase-redesign-feature.md | ⚠️ **已存在** - 对比后决定 |
| TESTCASE_STEP_DESIGN.md | 6-decisions/2024-11-22-testcase-step-design-feature.md | ⚠️ **已存在** - 对比后决定 |
| TEST_CASE_WORKFLOW_DESIGN.md | 6-decisions/2024-11-20-testcase-workflow-design-feature.md | ⚠️ **已存在** - 对比后决定 |
| TEST_PLATFORM_PRODUCTIZATION_DESIGN.md | 6-decisions/2024-11-26-test-platform-productization-architecture.md | ⚠️ **已存在** - 对比后决定 |
| UNIFIED_WORKFLOW_ARCHITECTURE.md | 6-decisions/2024-11-24-unified-workflow-architecture.md | ⚠️ **已存在** - 对比后决定 |

---

## ⚠️ 冲突文件处理建议

**共有16个文件在docs/中已存在！**

### 推荐处理流程

**步骤1**: 对比内容
```bash
# 对于每个冲突文件
diff backend/docs/FILE.md docs/TARGET/file.md
```

**步骤2**: 判断版本
- 如果backend/docs/是旧版本 → 删除backend/docs/中的文件
- 如果backend/docs/是新版本 → 需要手动合并或替换
- 如果两者相同 → 删除backend/docs/中的文件

**步骤3**: 非冲突文件安全迁移
```bash
# 只迁移不存在冲突的7个归档文件
mv backend/docs/ARCHITECTURE_COMPARISON_AND_COEXISTENCE.md docs/7-archive/2024-Q4/architecture-comparison.md
mv backend/docs/CI_PLATFORM_ALIGNMENT_ANALYSIS.md docs/7-archive/2024-Q4/ci-platform-alignment.md
# ... 其他归档文件
```

---

## 🔧 安全迁移脚本

```bash
#!/bin/bash

# 安全迁移函数
safe_move() {
    src=$1
    dst=$2

    if [ ! -f "$src" ]; then
        echo "⏭️  源文件不存在: $src"
        return
    fi

    if [ -f "$dst" ]; then
        echo "⚠️  目标已存在: $dst"
        echo "   请手动对比: diff $src $dst"
        return
    fi

    mv "$src" "$dst"
    echo "✅ 迁移成功: $src → $dst"
}

# 执行迁移（仅非冲突文件）
safe_move "backend/docs/ARCHITECTURE_COMPARISON_AND_COEXISTENCE.md" "docs/7-archive/2024-Q4/architecture-comparison.md"
safe_move "backend/docs/CI_PLATFORM_ALIGNMENT_ANALYSIS.md" "docs/7-archive/2024-Q4/ci-platform-alignment.md"
# ... 添加其他非冲突文件
```

---

## 📊 统计

| 分类 | 数量 | 状态 |
|------|------|------|
| 需归档 | 7个 | ✅ 可安全迁移 |
| 已存在冲突 | 16个 | ⚠️ 需对比处理 |
| 总计 | 23个 | - |

---

## 下一步建议

1. **暂停自动迁移** - 避免覆盖风险 ✅ 已完成
2. **对比冲突文件** - 确认哪些是新版本
3. **手动合并** - 必要时合并backend/docs/和docs/中的内容
4. **迁移归档文件** - 7个无冲突文件可安全迁移
5. **清理backend/docs/** - 迁移完成后删除空目录

**推荐**: 创建一个对比报告，列出所有冲突文件的diff，然后逐个决定如何处理

