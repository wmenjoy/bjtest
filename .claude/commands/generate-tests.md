# AI 测试生成命令

根据用户需求为指定代码生成高质量测试用例。

## 使用方式

```
/generate-tests [选项]
```

## 选项

- `--file <路径>`: 目标源文件路径
- `--function <名称>`: 特定函数名（可选，不指定则生成整个文件的测试）
- `--language <语言>`: 目标语言（go/java/javascript/typescript/cpp），自动检测
- `--coverage <百分比>`: 目标覆盖率，默认 85%
- `--include-security`: 包含安全测试
- `--include-performance`: 包含性能测试
- `--output <路径>`: 输出文件路径（默认自动生成）

## 执行流程

请按以下步骤执行测试生成：

### 步骤 1: 解析参数

从用户输入中提取参数。如果未指定必要参数，询问用户。

```
必需参数: file (目标文件路径)
可选参数: function, language, coverage, include-security, include-performance, output
```

### 步骤 2: 读取和分析目标代码

1. 读取目标源文件
2. 分析代码结构：
   - 识别函数/方法
   - 识别参数类型和返回值
   - 识别依赖关系
   - 计算圈复杂度
   - 识别分支和条件

使用以下模板分析代码：

```
代码分析报告:
- 文件: {file_path}
- 语言: {language}
- 包/模块: {package}
- 函数数量: {function_count}
- 总行数: {lines}
- 圈复杂度: {complexity}

函数列表:
1. {function_name}
   - 参数: {params}
   - 返回值: {returns}
   - 复杂度: {complexity}
   - 依赖: {dependencies}
```

### 步骤 3: 确定测试场景

根据代码分析，确定需要测试的场景：

1. **Happy Path (正常路径)**
   - 有效输入的正常处理
   - 预期的成功返回

2. **Error Handling (错误处理)**
   - 无效输入
   - 外部依赖失败
   - 边界条件错误

3. **Edge Cases (边界情况)**
   - 空值/nil/null
   - 边界值（0, -1, MAX, MIN）
   - 特殊字符
   - 并发场景

4. **Security (安全测试)** - 如果 include-security
   - 注入攻击
   - 权限验证
   - 敏感数据处理

### 步骤 4: 参考测试案例库

查找相关的测试模板和模式：

```
测试案例库位置: docs/1-specs/ai-test-generation/test-case-library-standard.md

匹配策略:
1. 按函数名匹配模板 (如 Login -> authentication.yaml)
2. 按代码模式匹配 (如 CRUD -> crud-operations.yaml)
3. 按领域匹配 (如 payment -> payment-processing.yaml)
```

### 步骤 5: 生成测试代码

根据语言生成对应的测试代码：

**Go 语言模板:**
```go
func Test{Function}_{Scenario}(t *testing.T) {
    // Arrange
    {setup_code}

    // Act
    {action_code}

    // Assert
    {assertion_code}
}
```

**Java 语言模板:**
```java
@Test
@DisplayName("Should {expected_behavior} when {condition}")
void test{Scenario}() {
    // Given
    {setup_code}

    // When
    {action_code}

    // Then
    {assertion_code}
}
```

**JavaScript/TypeScript 模板:**
```typescript
describe('{Module}', () => {
    describe('{function}', () => {
        it('should {expected_behavior} when {condition}', async () => {
            // Arrange
            {setup_code}

            // Act
            {action_code}

            // Assert
            {assertion_code}
        });
    });
});
```

**C++ 模板:**
```cpp
TEST_F({Class}Test, {Scenario}) {
    // Arrange
    {setup_code}

    // Act
    {action_code}

    // Assert
    {assertion_code}
}
```

### 步骤 6: 验证生成的测试

1. 检查语法正确性
2. 确保测试可编译
3. 如果可能，运行测试确认通过

### 步骤 7: 输出结果

1. 显示生成的测试代码
2. 提供测试场景摘要
3. 给出覆盖率估算
4. 如果指定了 output，写入文件

## 输出格式

```markdown
## 测试生成报告

### 目标
- 文件: {file}
- 函数: {function}
- 语言: {language}

### 生成的测试

#### {test_file_name}

```{language}
{generated_test_code}
```

### 测试场景摘要

| 场景 | 类型 | 描述 |
|------|------|------|
| TestXxx_Success | happy_path | 正常输入成功处理 |
| TestXxx_InvalidInput | error_handling | 无效输入返回错误 |
| ...

### 覆盖率估算
- 预计行覆盖: {line_coverage}%
- 预计分支覆盖: {branch_coverage}%

### 建议
- {suggestions}
```

## 示例

### 示例 1: 基本使用

```
用户: /generate-tests --file internal/auth/service.go --function Login
```

### 示例 2: 指定覆盖率和安全测试

```
用户: /generate-tests --file internal/payment/processor.go --coverage 90 --include-security
```

### 示例 3: 生成整个文件的测试

```
用户: /generate-tests --file src/services/userService.ts
```

## 注意事项

1. 生成的测试需要人工审查
2. Mock 对象可能需要手动调整
3. 复杂的业务逻辑可能需要补充测试
4. 建议运行测试验证正确性
5. 参考 `docs/3-guides/ai-testing/best-practices.md` 了解最佳实践
