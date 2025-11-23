#!/bin/bash
# run-self-tests.sh - Run all platform self-tests

BASE_URL="http://localhost:8090/api"

echo "=== NextTest Platform Self-Test Suite ==="
echo "Base URL: $BASE_URL"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

# Check if service is running
if ! curl -s "http://localhost:8090/health" > /dev/null 2>&1; then
    echo -e "${RED}ERROR: Service is not running at $BASE_URL${NC}"
    echo "Please start the service first with: make run"
    exit 1
fi

echo "Service is running. Starting tests..."
echo ""

# Array to store results
declare -a test_results

# Function to run a test workflow
run_test() {
    local workflow_id=$1
    local test_name=$2
    local json_file=$3

    echo -n "Testing $test_name... "

    # Check if workflow exists, create if not
    if ! curl -s "$BASE_URL/workflows/$workflow_id" | grep -q "workflowId"; then
        if [ -f "$json_file" ]; then
            curl -s -X POST "$BASE_URL/workflows" -H "Content-Type: application/json" -d @"$json_file" > /dev/null
        fi
    fi

    # Execute workflow
    result=$(curl -s -X POST "$BASE_URL/workflows/$workflow_id/execute" -H "Content-Type: application/json")
    status=$(echo "$result" | jq -r '.status')
    duration=$(echo "$result" | jq -r '.duration')

    if [ "$status" == "success" ]; then
        echo -e "${GREEN}PASSED${NC} (${duration}ms)"
        test_results+=("$test_name:PASSED:$duration")
        return 0
    else
        echo -e "${RED}FAILED${NC}"
        test_results+=("$test_name:FAILED:$duration")
        return 1
    fi
}

# Run all tests
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
EXAMPLES_DIR="$SCRIPT_DIR/examples"

passed=0
failed=0

echo "--- TestGroup API Tests ---"
if run_test "self-test-testgroup-v2" "TestGroup CRUD Operations" "$EXAMPLES_DIR/self-test-testgroup-api.json"; then
    ((passed++))
else
    ((failed++))
fi

echo ""
echo "--- TestCase API Tests ---"
if run_test "self-test-testcase-v6" "TestCase CRUD Operations" "$EXAMPLES_DIR/self-test-testcase-api.json"; then
    ((passed++))
else
    ((failed++))
fi

echo ""
echo "--- Platform Self-Test ---"
if run_test "platform-self-test-v1" "Platform Integration Test" "$EXAMPLES_DIR/self-test-platform.json"; then
    ((passed++))
else
    ((failed++))
fi

echo ""
echo "--- Action Feature Tests ---"
if run_test "action-feature-test-v1" "Action Features (DB, Script, Assert)" "$EXAMPLES_DIR/self-test-actions.json"; then
    ((passed++))
else
    ((failed++))
fi

echo ""
echo "--- Environment API Tests ---"
if run_test "self-test-environment-api-v2" "Environment Management API" "$EXAMPLES_DIR/self-test-environment-api.json"; then
    ((passed++))
else
    ((failed++))
fi

echo ""
echo "--- Workflow Execution API Tests ---"
if run_test "self-test-workflow-execution-api" "Workflow Execution API" "$EXAMPLES_DIR/self-test-workflow-execution-api.json"; then
    ((passed++))
else
    ((failed++))
fi

echo ""
echo "--- Test Results API Tests ---"
if run_test "self-test-results-api" "Test Results API" "$EXAMPLES_DIR/self-test-results-api.json"; then
    ((passed++))
else
    ((failed++))
fi

echo ""
echo "--- 404 Not Found Error Tests ---"
if run_test "self-test-404-not-found" "404 Not Found Responses" "$EXAMPLES_DIR/self-test-404-not-found.json"; then
    ((passed++))
else
    ((failed++))
fi

echo ""
echo "--- 400 Bad Request Error Tests ---"
if run_test "self-test-400-bad-request" "400 Bad Request Responses" "$EXAMPLES_DIR/self-test-400-bad-request.json"; then
    ((passed++))
else
    ((failed++))
fi

echo ""
echo "--- 409 Conflict Error Tests ---"
if run_test "self-test-409-conflict" "409 Conflict Responses" "$EXAMPLES_DIR/self-test-409-conflict.json"; then
    ((passed++))
else
    ((failed++))
fi

echo ""
echo "--- Workflow Basic Tests ---"
if run_test "self-test-workflow" "Workflow Basic Functionality" "$EXAMPLES_DIR/self-test-workflow.json"; then
    ((passed++))
else
    ((failed++))
fi

echo ""
echo "--- Comprehensive Error Handling Tests ---"
if run_test "self-test-error-handling" "Error Handling Validation" "$EXAMPLES_DIR/self-test-error-handling.json"; then
    ((passed++))
else
    ((failed++))
fi

# Summary
echo ""
echo "=== Test Summary ==="
total=$((passed + failed))
echo -e "Total: $total tests"
echo -e "${GREEN}Passed: $passed${NC}"
if [ $failed -gt 0 ]; then
    echo -e "${RED}Failed: $failed${NC}"
fi

echo ""
if [ $failed -eq 0 ]; then
    echo -e "${GREEN}All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}Some tests failed!${NC}"
    exit 1
fi
