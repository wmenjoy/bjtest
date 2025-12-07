---
name: coverage-analyzer
description: "Analyzes test coverage and identifies gaps. Use when user mentions coverage percentage, asks what tests are missing, or wants to improve/increase test coverage."
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
---

# Coverage Analyzer

This skill enables Claude to analyze test coverage, identify gaps in test suites, and generate targeted tests to improve coverage metrics.

## When to Use This Skill

Claude should invoke this skill when:
- User mentions "coverage" or "test coverage"
- User asks "what tests am I missing"
- User wants to "improve coverage" or "increase coverage"
- User shares coverage reports or asks about coverage gaps
- User wants to reach a specific coverage target

## Capabilities

### 1. Coverage Data Collection
- Run coverage tools for different languages
- Parse coverage reports (lcov, cobertura, go cover, etc.)
- Identify uncovered lines and branches

### 2. Gap Analysis
- Categorize uncovered code
- Prioritize by importance (critical vs utility)
- Identify patterns in coverage gaps

### 3. Root Cause Analysis
- Why is code uncovered?
  - Missing test case
  - Dead code
  - Hard to test code
  - Error handling paths

### 4. Test Generation
- Generate tests specifically for uncovered code
- Focus on high-value coverage improvements
- Suggest refactoring for hard-to-test code

## Task Steps

### Step 1: Collect Coverage Data

Run coverage tools based on project language:

**Go:**
```bash
go test -coverprofile=coverage.out ./...
go tool cover -func=coverage.out
```

**Java (Maven):**
```bash
mvn test jacoco:report
# Read: target/site/jacoco/jacoco.xml
```

**JavaScript/TypeScript:**
```bash
npm test -- --coverage
# Read: coverage/coverage-summary.json
```

**Python:**
```bash
pytest --cov=. --cov-report=xml
# Read: coverage.xml
```

### Step 2: Parse Coverage Report

Extract key metrics:

```yaml
coverage_summary:
  total:
    lines: {covered}/{total} ({percentage}%)
    branches: {covered}/{total} ({percentage}%)
    functions: {covered}/{total} ({percentage}%)

  by_file:
    - file: path/to/file.go
      lines: 85%
      branches: 70%
      uncovered_lines: [45, 67-72, 89]
      uncovered_branches:
        - line: 45
          condition: "err != nil"
          branch: "true"
```

### Step 3: Identify Coverage Gaps

Categorize uncovered code:

```yaml
coverage_gaps:
  critical: # High priority - business logic, security
    - file: internal/auth/service.go
      lines: [45-52]
      reason: "Error handling path not tested"
      impact: "Security-sensitive code"

  important: # Medium priority - core functionality
    - file: internal/order/processor.go
      lines: [120-135]
      reason: "Edge case not covered"
      impact: "Could cause bugs in production"

  low: # Lower priority - utilities, logging
    - file: pkg/utils/strings.go
      lines: [78-80]
      reason: "Utility function rarely used"
      impact: "Minimal risk"
```

### Step 4: Analyze Root Causes

For each significant gap, determine why:

| Gap Type | Indicators | Solution |
|----------|-----------|----------|
| Missing test | No test targets this code | Generate new test |
| Dead code | No execution path reaches it | Delete or document |
| Hard to test | Complex dependencies | Suggest refactoring |
| Error path | Requires failure injection | Add error mocking |
| Edge case | Boundary conditions | Add boundary tests |

### Step 5: Generate Targeted Tests

For each high-priority gap, generate specific tests:

```
Gap: internal/auth/service.go:45-52 (error handling)

Analysis:
- Code handles database connection error
- Never triggered in current tests
- Need to mock DB failure

Generated Test:
```go
func TestLogin_DatabaseError_ReturnsError(t *testing.T) {
    // Arrange
    mockDB := new(MockDatabase)
    mockDB.On("Connect").Return(nil, errors.New("connection refused"))
    service := NewAuthService(mockDB)

    // Act
    _, err := service.Login("user", "pass")

    // Assert
    require.Error(t, err)
    assert.Contains(t, err.Error(), "database")
}
```

### Step 6: Estimate Impact

Calculate expected coverage improvement:

```yaml
improvement_estimate:
  current:
    line_coverage: 72%
    branch_coverage: 65%

  after_adding_tests:
    line_coverage: 85%  # +13%
    branch_coverage: 78% # +13%

  tests_to_add: 8
  files_affected: 4
```

## Output Format

### Coverage Analysis Report

```markdown
# Coverage Analysis Report

## Current Coverage

| Metric | Value | Target | Gap |
|--------|-------|--------|-----|
| Line Coverage | 72% | 85% | -13% |
| Branch Coverage | 65% | 80% | -15% |
| Function Coverage | 80% | 90% | -10% |

## Critical Gaps (Highest Priority)

### 1. internal/auth/service.go

**Uncovered Lines:** 45-52, 78-82
**Coverage:** 68%
**Risk:** HIGH (Security-sensitive)

**Uncovered Code:**
```go
if err := db.Connect(); err != nil {
    logger.Error("database connection failed", err)
    return nil, ErrDatabaseConnection
}
```

**Root Cause:** Error injection not set up in tests

**Suggested Test:**
```go
func TestLogin_DatabaseConnectionFailed(t *testing.T) {
    // [Generated test code]
}
```

---

## Coverage Improvement Plan

| Priority | File | Current | Target | Tests Needed |
|----------|------|---------|--------|--------------|
| 1 | auth/service.go | 68% | 90% | 3 |
| 2 | order/processor.go | 75% | 85% | 2 |
| 3 | user/repository.go | 70% | 80% | 2 |

## Estimated Improvement

By implementing the suggested tests:
- Line coverage: 72% → 85% (+13%)
- Branch coverage: 65% → 80% (+15%)
- Tests to add: 7 new test functions

## Dead Code Candidates

The following code appears unreachable and may be dead code:
- `pkg/utils/deprecated.go:45-60`
- `internal/legacy/handler.go:100-120`

Consider removing or documenting these sections.
```

## Example Interactions

**User**: My coverage is stuck at 70%, help me get to 85%

**Claude**: I'll analyze your coverage and create a targeted improvement plan:

1. Running coverage analysis...
2. Found 15 uncovered code sections
3. Categorizing by priority:
   - 4 critical (security/core logic)
   - 6 important (business functions)
   - 5 low priority (utilities)

Here's your improvement plan to reach 85% coverage:
[Detailed plan with specific tests]

---

**User**: Why isn't this line covered?

**Claude**: Let me analyze that specific line:

1. Line 45 in auth/service.go handles database errors
2. Current tests don't inject database failures
3. This is an error handling path

To cover this line, you need:
```go
func TestLogin_DatabaseError(t *testing.T) {
    // Test that mocks DB failure
}
```

## Knowledge Base (AI 必须参考)

### 分层知识库架构

在生成补充测试时，使用分层知识库以优化 Token：

```
Layer 1: 快速参考 (必读)
    ↓
Layer 2: 详细知识 (按需)
    ↓
Layer 3: 完整示例 (深入时)
```

### 必读文件 (Layer 1)

```
test-case-library/knowledge/quick-reference.md
```

### 按需加载 (Layer 2)

| 场景 | 文件 |
|-----|-----|
| 生成测试数据 | `test-case-library/knowledge/test-data-generators.md` |
| 确定测试场景 | `test-case-library/knowledge/test-scenarios.md` |
| 断言模式参考 | `test-case-library/assertions/assertion-patterns.md` |

### 语言示例 (Layer 3)

| 语言 | 文件 |
|-----|-----|
| Go | `test-case-library/examples/golang/comprehensive_test.go` |
| Java | `test-case-library/examples/java/UserServiceTest.java` |
| TypeScript | `test-case-library/examples/typescript/user-service.test.ts` |
| C++ | `test-case-library/examples/cpp/user_service_test.cpp` |

### 项目配置

优先读取项目特定配置（如存在）：

```
.ai-test-config.yaml
```

## Reference Documents

- Best Practices: `docs/3-guides/ai-testing/best-practices.md`
- Test Case Library: `docs/1-specs/ai-test-generation/test-case-library-standard.md`
- Code Generation: `docs/1-specs/ai-test-generation/code-generation-specification.md`
