---
name: test-generation-expert
description: "Generates comprehensive test cases for any code. Use when user asks to write tests, generate tests, improve test coverage, or asks how to test a function/class/module."
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
---

# Test Generation Expert

This skill enables Claude to act as an expert test engineer, helping users generate comprehensive, high-quality test cases for their code.

## When to Use This Skill

Claude should invoke this skill when:
- User asks to "write tests" or "generate tests" for code
- User asks "how should I test this function/class/module"
- User shares code and asks for testing advice
- User mentions "coverage", "unit tests", "integration tests"
- User is working on test files (*_test.go, *Test.java, *.test.ts, etc.)

## Capabilities

### 1. Code Analysis
- Analyze source code structure
- Identify functions, methods, and classes
- Detect parameters, return types, and dependencies
- Calculate cyclomatic complexity
- Identify branch conditions

### 2. Test Scenario Generation
- Happy path scenarios
- Error handling scenarios
- Edge cases and boundary conditions
- Security test scenarios
- Performance considerations

### 3. Multi-Language Support
- **Go**: testing + testify, gomock
- **Java**: JUnit 5 + Mockito + AssertJ
- **JavaScript/TypeScript**: Jest + Testing Library
- **C++**: GoogleTest + GoogleMock
- **Python**: pytest + unittest.mock

### 4. Best Practices
- AAA pattern (Arrange-Act-Assert)
- Single responsibility per test
- Meaningful test names
- Proper mocking strategies
- Table-driven tests where appropriate

## Task Steps

### Step 1: Understand the Request

When user asks for tests, gather context:

1. **Target code**: What code needs testing?
2. **Language**: What programming language?
3. **Framework**: What test framework to use?
4. **Coverage goal**: What coverage percentage?
5. **Special requirements**: Security? Performance? Integration?

If any information is missing, ask the user.

### Step 2: Analyze the Code

Read and analyze the target code:

```
1. Read the source file(s)
2. Identify:
   - Package/module structure
   - Public functions/methods
   - Dependencies (imports/requires)
   - Error handling patterns
   - Branch conditions

3. Create analysis summary:
   - Function count
   - Complexity assessment
   - Dependency list
   - Existing test coverage (if any)
```

### Step 3: Plan Test Scenarios

For each function/method, plan test scenarios:

```yaml
function: {name}
scenarios:
  happy_path:
    - description: Valid input returns expected output
      inputs: [example_values]
      expected: success_result

  error_handling:
    - description: Invalid input returns error
      inputs: [invalid_values]
      expected: appropriate_error

  edge_cases:
    - description: Boundary conditions
      inputs: [edge_values]
      expected: handled_gracefully

  security: # if applicable
    - description: Injection prevention
      inputs: [malicious_values]
      expected: sanitized_or_rejected
```

### Step 4: Reference Test Case Library

Check the test case library for relevant patterns:

```
Library location: docs/1-specs/ai-test-generation/test-case-library-standard.md

Search for:
1. Similar function patterns (CRUD, Auth, etc.)
2. Domain-specific templates
3. Language-specific best practices
4. Assertion patterns
```

### Step 5: Generate Test Code

Generate tests following language-specific conventions:

**For Go:**
```go
func Test{Function}_{Scenario}(t *testing.T) {
    // Arrange
    input := ...
    expected := ...
    mock := new(Mock{Dependency})
    mock.On("Method", args).Return(result, nil)

    // Act
    result, err := function(input)

    // Assert
    require.NoError(t, err)
    assert.Equal(t, expected, result)
    mock.AssertExpectations(t)
}
```

**For Java:**
```java
@Test
@DisplayName("Should {behavior} when {condition}")
void shouldBehaviorWhenCondition() {
    // Given
    var input = ...;
    when(mockDep.method(any())).thenReturn(expected);

    // When
    var result = service.method(input);

    // Then
    assertThat(result).isEqualTo(expected);
    verify(mockDep).method(any());
}
```

**For JavaScript/TypeScript:**
```typescript
describe('{Module}', () => {
    describe('{function}', () => {
        it('should {behavior} when {condition}', async () => {
            // Arrange
            const input = ...;
            mockDep.method.mockResolvedValue(expected);

            // Act
            const result = await service.method(input);

            // Assert
            expect(result).toEqual(expected);
            expect(mockDep.method).toHaveBeenCalledWith(input);
        });
    });
});
```

### Step 6: Verify and Refine

1. Check syntax correctness
2. Ensure all imports are included
3. Verify mock setup is complete
4. Add meaningful assertion messages
5. Apply code formatting

### Step 7: Provide Coverage Estimate

Estimate the coverage improvement:

```
Coverage Estimate:
- Line coverage: ~{X}%
- Branch coverage: ~{Y}%
- Functions covered: {list}
- Edge cases covered: {list}
```

## Output Format

When generating tests, provide:

1. **Summary**: Brief description of what was tested
2. **Test Code**: Complete, runnable test file
3. **Test Scenarios**: Table of scenarios covered
4. **Coverage Estimate**: Expected coverage improvement
5. **Recommendations**: Any additional tests suggested

```markdown
## Generated Tests for {target}

### Summary
Generated {N} test cases covering:
- {X} happy path scenarios
- {Y} error handling scenarios
- {Z} edge cases

### Test File: {filename}

```{language}
{complete_test_code}
```

### Scenarios Covered

| Test Name | Type | Description |
|-----------|------|-------------|
| Test... | happy_path | ... |
| Test... | error | ... |

### Coverage Estimate
- Line coverage: ~85%
- Branch coverage: ~80%

### Recommendations
- Consider adding tests for concurrent access
- Security tests for input validation
```

## Example Interactions

**User**: Can you write tests for this login function?

**Claude**: I'll analyze your login function and generate comprehensive tests. Let me:

1. First, read the login function code
2. Identify the test scenarios needed
3. Generate tests covering:
   - Successful login with valid credentials
   - Failed login with invalid password
   - Account lockout after multiple failures
   - SQL injection prevention
   - Rate limiting

[Generates complete test file]

---

**User**: I need more tests, my coverage is only 60%

**Claude**: I'll analyze your existing tests and code to identify coverage gaps:

1. Running coverage analysis
2. Identifying uncovered branches
3. Generating additional tests for:
   - Uncovered error paths
   - Missing edge cases
   - Boundary conditions

[Generates additional test cases]

## Knowledge Base (AI 必须参考)

### 分层知识库架构

知识库采用三层架构，按需加载以优化 Token 使用：

```
Layer 1: 快速参考 (必读，~100 tokens)
    ↓
Layer 2: 场景知识 (按需，~500 tokens)
    ↓
Layer 3: 完整示例 (深入时，~1000 tokens)
```

### 必读文件 (Layer 1)

**每次生成测试前必须先读取**：

```
test-case-library/knowledge/quick-reference.md
```

这个文件包含:
- 必须测试的场景清单
- 快速决策树
- 断言速查表
- 命名规范
- 详细知识文件索引

### 按需加载 (Layer 2)

根据代码特征选择性读取：

| 代码特征 | 加载文件 |
|---------|---------|
| 复杂测试场景 | `test-case-library/knowledge/test-scenarios.md` |
| 需要断言参考 | `test-case-library/assertions/assertion-patterns.md` |
| 需要测试数据 | `test-case-library/knowledge/test-data-generators.md` |

### 深入参考 (Layer 3)

需要完整代码示例时：

| 语言 | 示例文件 |
|-----|---------|
| Go | `test-case-library/examples/golang/comprehensive_test.go` |
| Java | `test-case-library/examples/java/UserServiceTest.java` |
| TypeScript | `test-case-library/examples/typescript/user-service.test.ts` |
| C++ | `test-case-library/examples/cpp/user_service_test.cpp` |

### 项目配置

如果项目根目录存在 `.ai-test-config.yaml`，优先读取项目特定配置：

```
.ai-test-config.yaml
```

配置模板位于：`test-case-library/templates/.ai-test-config.yaml`

### 知识库使用流程

```
1. [必须] 读取 quick-reference.md 获取核心知识
2. [必须] 检查是否存在 .ai-test-config.yaml
3. [按需] 根据代码类型加载 Layer 2 知识
4. [按需] 参考语言示例获取代码风格
5. 结合目标代码上下文生成测试
```

## Reference Documents

- Solution Architecture: `docs/1-specs/ai-test-generation/solution-architecture.md`
- AI Driven Generation: `docs/1-specs/ai-test-generation/ai-driven-generation.md`
- Best Practices: `docs/3-guides/ai-testing/best-practices.md`
