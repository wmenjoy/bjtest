#!/bin/bash

# 文档内部链接修复脚本
# 将旧的大写文件名链接替换为新的小写七层架构路径

echo "================================================================="
echo "文档内部链接修复脚本"
echo "================================================================="
echo ""

# 定义映射关系(旧文件名|新路径)
MAPPINGS=(
    # Layer 1: Specs
    "DATABASE_DESIGN.md|1-specs/database/schema.md"
    "DATABASE_CONFIGURATION.md|1-specs/database/configuration.md"
    "API_DOCUMENTATION.md|1-specs/api/v2-documentation.md"
    "API_COMMUNICATION_SPEC.md|1-specs/api/communication-spec.md"
    "HTTP_STATUS_CODE_SPEC.md|1-specs/api/http-status-codes.md"
    "DATAMAPPER_IMPLEMENTATION.md|1-specs/backend/datamapper-implementation.md"
    "DATAMAPPER_QUICK_REFERENCE.md|1-specs/backend/datamapper-quick-reference.md"
    "STEP_CONTROL_FLOW_DESIGN.md|1-specs/ui/step-control-flow.md"

    # Layer 2: Requirements
    "PRD.md|2-requirements/prd/current.md"
    "NON_FUNCTIONAL_REQUIREMENTS.md|2-requirements/non-functional.md"

    # Layer 3: Guides
    "FRONTEND_IMPLEMENTATION_GUIDE.md|3-guides/development/frontend-implementation.md"
    "BACKEND_IMPLEMENTATION_GUIDE.md|3-guides/development/backend-implementation.md"
    "MULTI_TENANT_INTEGRATION_GUIDE.md|3-guides/development/multi-tenant-integration.md"
    "ENVIRONMENT_MANAGEMENT_GUIDE.md|3-guides/development/environment-management.md"

    # Layer 4: Planning
    "PROJECT_STATUS_2025-11-23.md|4-planning/active/status-2025-11-23.md"
    "MULTI_TENANT_PROGRESS.md|4-planning/completed/2024-Q4/multi-tenant-progress.md"
    "FRONTEND_BACKEND_FEATURE_MATRIX.md|4-planning/active/frontend-backend-integration-status.md"

    # Layer 5: Wiki
    "SELF_TEST_ORGANIZATION.md|5-wiki/testcase/self-test-organization.md"
    "WORKFLOW_TESTCASE_INTEGRATION.md|5-wiki/workflow/testcase-integration.md"
    "ENVIRONMENT_MANAGEMENT_MIDDLEWARE.md|5-wiki/environment/middleware.md"

    # Layer 6: Decisions
    "UNIFIED_WORKFLOW_ARCHITECTURE.md|6-decisions/2024-11-24-unified-workflow-architecture.md"
    "TESTCASE_WORKFLOW_DESIGN.md|6-decisions/2024-11-20-testcase-workflow-design-feature.md"
    "TESTCASE_REDESIGN.md|6-decisions/2024-11-21-testcase-redesign-feature.md"
    "TESTCASE_STEP_DESIGN.md|6-decisions/2024-11-22-testcase-step-design-feature.md"
    "TESTCASE_AS_WORKFLOW_VIEW.md|6-decisions/2024-11-23-testcase-as-workflow-view-feature.md"
    "FRONTEND_ARCHITECTURE_DESIGN.md|6-decisions/2024-11-25-frontend-architecture-design.md"
    "TEST_PLATFORM_PRODUCTIZATION_ARCHITECTURE.md|6-decisions/2024-11-26-test-platform-productization-architecture.md"

    # Layer 7: Archive
    "CI_PLATFORM_ALIGNMENT.md|7-archive/2024-Q4/ci-platform-alignment.md"
    "FRONTEND_INTEGRATION_SUMMARY.md|7-archive/2024-Q4/frontend-integration-summary.md"
    "TESTCASE_VALUE_SCORING_FEATURE.md|7-archive/2024-Q4/testcase-value-scoring-feature.md"
    "TESTCASE_GROUP_FLAKY_SCORING_FEATURE.md|7-archive/2024-Q4/testcase-group-flaky-scoring-feature.md"
    "FRONTEND_UI_STATE_MANAGEMENT_HISTORY.md|7-archive/2024-Q4/frontend-ui-state-management-history.md"
    "UI_DESIGN_V2_ARCHITECTURE.md|7-archive/2024-Q4/ui-design-v2-architecture.md"
)

TOTAL_FILES=0
FIXED_FILES=0
TOTAL_REPLACEMENTS=0

# 遍历所有markdown文件
while IFS= read -r -d '' file; do
    REPLACEMENTS_IN_FILE=0
    TEMP_FILE="${file}.tmp"
    cp "$file" "$TEMP_FILE"

    # 对每个映射进行替换
    for mapping in "${MAPPINGS[@]}"; do
        old_name=$(echo "$mapping" | cut -d'|' -f1)
        new_path=$(echo "$mapping" | cut -d'|' -f2)

        # 替换各种链接模式
        # ](<OLD_NAME>) -> ](../../<new_path>)
        # ](../<OLD_NAME>) -> ](../../<new_path>)
        # ](./<OLD_NAME>) -> ](../../<new_path>)
        # ](<OLD_NAME>) -> ](../../<new_path>)

        # 使用perl进行替换(更强大的正则支持)
        if command -v perl &> /dev/null; then
            perl -i.bak -pe "s|\]\((\.\.?/)?${old_name}\)|](../../${new_path})|g" "$TEMP_FILE" 2>/dev/null
        else
            # 回退到sed
            sed -i.bak "s|](${old_name})|](../../${new_path})|g; s|](\./${old_name})|](../../${new_path})|g; s|](\.\./${old_name})|](../../${new_path})|g" "$TEMP_FILE" 2>/dev/null
        fi

        # 清理备份文件
        rm -f "${TEMP_FILE}.bak"
    done

    # 检查是否有变化
    if ! diff -q "$file" "$TEMP_FILE" >/dev/null 2>&1; then
        # 计算替换次数
        REPLACEMENTS_IN_FILE=$(diff "$file" "$TEMP_FILE" | grep -c '^<' || echo 0)
        mv "$TEMP_FILE" "$file"
        FIXED_FILES=$((FIXED_FILES + 1))
        TOTAL_REPLACEMENTS=$((TOTAL_REPLACEMENTS + REPLACEMENTS_IN_FILE))
        echo "✅ $file ($REPLACEMENTS_IN_FILE 处替换)"
    else
        rm "$TEMP_FILE"
    fi

    TOTAL_FILES=$((TOTAL_FILES + 1))
done < <(find docs -name "*.md" -type f -print0)

echo ""
echo "================================================================="
echo "修复完成"
echo "================================================================="
echo "总文件数: $TOTAL_FILES"
echo "修复文件数: $FIXED_FILES"
echo "总替换数: $TOTAL_REPLACEMENTS"
echo ""
echo "请运行 'git diff docs/' 查看更改"
