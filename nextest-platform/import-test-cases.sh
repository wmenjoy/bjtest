#!/bin/bash

# 测试案例导入脚本
# 用于快速导入所有测试案例到后端服务

set -e  # 遇到错误立即退出

# 配置
BACKEND_URL="${BACKEND_URL:-http://localhost:8090}"
EXAMPLES_DIR="$(dirname "$0")/examples"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}  测试案例导入工具${NC}"
echo -e "${BLUE}================================${NC}"
echo ""

# 检查后端服务
echo -e "${YELLOW}[1/4] 检查后端服务...${NC}"
if curl -s -f "${BACKEND_URL}/health" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ 后端服务运行正常${NC}"
else
    echo -e "${RED}✗ 后端服务未运行 (${BACKEND_URL})${NC}"
    echo -e "${YELLOW}请先启动后端服务:${NC}"
    echo -e "  cd nextest-platform"
    echo -e "  make run"
    exit 1
fi
echo ""

# 检查示例文件
echo -e "${YELLOW}[2/4] 检查示例文件...${NC}"
TEST_FILES=(
    "test-new-architecture.json"
    "demo-comprehensive-workflow.json"
    "test-frontend-features.json"
)

for file in "${TEST_FILES[@]}"; do
    if [ -f "${EXAMPLES_DIR}/${file}" ]; then
        echo -e "${GREEN}✓ ${file}${NC}"
    else
        echo -e "${RED}✗ ${file} 不存在${NC}"
        exit 1
    fi
done
echo ""

# 导入测试案例
echo -e "${YELLOW}[3/4] 导入测试案例...${NC}"

import_file() {
    local file=$1
    local filepath="${EXAMPLES_DIR}/${file}"

    echo -e "${BLUE}导入: ${file}${NC}"

    # 尝试导入（根据后端 API 调整）
    # 假设有 /api/v2/import 端点，如果没有则逐个导入

    # 方式 1: 使用批量导入端点
    # response=$(curl -s -X POST "${BACKEND_URL}/api/v2/import" \
    #     -H "Content-Type: application/json" \
    #     -d @"${filepath}")

    # 方式 2: 解析 JSON 并逐个导入
    # 导入测试分组
    groups=$(jq -c '.testGroups[]?' "${filepath}" 2>/dev/null || echo "")
    if [ -n "$groups" ]; then
        echo "  导入测试分组..."
        echo "$groups" | while IFS= read -r group; do
            groupId=$(echo "$group" | jq -r '.groupId')
            response=$(curl -s -w "\n%{http_code}" -X POST "${BACKEND_URL}/api/v2/groups" \
                -H "Content-Type: application/json" \
                -d "$group")

            http_code=$(echo "$response" | tail -n 1)
            if [ "$http_code" = "201" ] || [ "$http_code" = "200" ]; then
                echo -e "    ${GREEN}✓ ${groupId}${NC}"
            else
                echo -e "    ${YELLOW}⚠ ${groupId} (${http_code})${NC}"
            fi
        done
    fi

    # 导入工作流
    workflows=$(jq -c '.workflows[]?' "${filepath}" 2>/dev/null || echo "")
    if [ -n "$workflows" ]; then
        echo "  导入工作流..."
        echo "$workflows" | while IFS= read -r workflow; do
            workflowId=$(echo "$workflow" | jq -r '.workflowId')
            response=$(curl -s -w "\n%{http_code}" -X POST "${BACKEND_URL}/api/v2/workflows" \
                -H "Content-Type: application/json" \
                -d "$workflow")

            http_code=$(echo "$response" | tail -n 1)
            if [ "$http_code" = "201" ] || [ "$http_code" = "200" ]; then
                echo -e "    ${GREEN}✓ ${workflowId}${NC}"
            else
                echo -e "    ${YELLOW}⚠ ${workflowId} (${http_code})${NC}"
            fi
        done
    fi

    # 导入测试案例
    testcases=$(jq -c '.testCases[]?' "${filepath}" 2>/dev/null || echo "")
    if [ -n "$testcases" ]; then
        echo "  导入测试案例..."
        echo "$testcases" | while IFS= read -r testcase; do
            testId=$(echo "$testcase" | jq -r '.testId')
            response=$(curl -s -w "\n%{http_code}" -X POST "${BACKEND_URL}/api/v2/tests" \
                -H "Content-Type: application/json" \
                -d "$testcase")

            http_code=$(echo "$response" | tail -n 1)
            if [ "$http_code" = "201" ] || [ "$http_code" = "200" ]; then
                echo -e "    ${GREEN}✓ ${testId}${NC}"
            else
                echo -e "    ${YELLOW}⚠ ${testId} (${http_code})${NC}"
            fi
        done
    fi

    echo ""
}

# 导入所有文件
for file in "${TEST_FILES[@]}"; do
    import_file "$file"
done

# 验证导入结果
echo -e "${YELLOW}[4/4] 验证导入结果...${NC}"

# 检查测试分组
groups_count=$(curl -s "${BACKEND_URL}/api/v2/groups/tree" | jq 'length' 2>/dev/null || echo "0")
echo -e "${GREEN}✓ 测试分组: ${groups_count}${NC}"

# 检查工作流
workflows_count=$(curl -s "${BACKEND_URL}/api/v2/workflows?limit=100" | jq '.total' 2>/dev/null || echo "0")
echo -e "${GREEN}✓ 工作流: ${workflows_count}${NC}"

# 检查测试案例
tests_count=$(curl -s "${BACKEND_URL}/api/v2/tests?limit=100" | jq '.total' 2>/dev/null || echo "0")
echo -e "${GREEN}✓ 测试案例: ${tests_count}${NC}"

echo ""
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}  导入完成!${NC}"
echo -e "${GREEN}================================${NC}"
echo ""
echo -e "下一步:"
echo -e "  1. 访问前端: ${BLUE}http://localhost:5173${NC}"
echo -e "  2. 进入 Test Case Manager"
echo -e "  3. 执行测试案例"
echo -e "  4. 查看 ${BLUE}TESTING_GUIDE.md${NC} 了解详细测试步骤"
echo ""
