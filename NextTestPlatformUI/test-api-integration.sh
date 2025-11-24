#!/bin/bash

echo "==================================="
echo "Test Statistics API Integration Test"
echo "==================================="
echo ""

# Test statistics endpoint
echo "1. Testing GET /api/v2/tests/statistics"
curl -s -X GET "http://localhost:8090/api/v2/tests/statistics?userId=current-user" \
  -H "Accept: application/json" | python3 -m json.tool || echo "API endpoint not available or returned non-JSON"

echo ""
echo ""

# Test flaky tests endpoint
echo "2. Testing GET /api/v2/tests/flaky"
curl -s -X GET "http://localhost:8090/api/v2/tests/flaky?limit=10" \
  -H "Accept: application/json" | python3 -m json.tool || echo "API endpoint not available or returned non-JSON"

echo ""
echo ""
echo "==================================="
echo "Test completed"
echo "==================================="
