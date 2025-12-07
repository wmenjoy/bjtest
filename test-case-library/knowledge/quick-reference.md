# AI 测试生成 - 核心知识速查 (必读)

> 这是 AI 生成测试时必须参考的核心知识，保持精简
> 详细内容见各专题知识文件

## 1. 测试必须覆盖的场景

```
每个函数必须测试:

✓ Happy Path     → 正常输入，预期输出
✓ Error Path     → 错误输入，适当错误
✓ Edge Cases     → 边界值和特殊情况
✓ Null/Empty     → 空值处理
```

## 2. 快速决策树

```
函数有参数验证？→ 测试无效输入
函数调用外部服务？→ Mock + 测试失败情况
函数有条件分支？→ 每个分支至少一个测试
函数处理用户输入？→ 安全测试（注入）
函数涉及并发？→ 并发测试
```

## 3. 断言速查

| 场景 | Go | Java | TypeScript | C++ |
|------|-----|------|-----------|-----|
| 相等 | `assert.Equal(t, exp, act)` | `assertThat(act).isEqualTo(exp)` | `expect(act).toBe(exp)` | `EXPECT_EQ(exp, act)` |
| 不等 | `assert.NotEqual` | `isNotEqualTo()` | `not.toBe()` | `EXPECT_NE` |
| 空值 | `assert.Nil` | `isNull()` | `toBeNull()` | `EXPECT_EQ(nullptr,)` |
| 非空 | `assert.NotNil` | `isNotNull()` | `not.toBeNull()` | `EXPECT_NE(nullptr,)` |
| 错误 | `require.Error` | `assertThrows()` | `toThrow()` | `EXPECT_THROW` |
| 无错 | `require.NoError` | `assertDoesNotThrow()` | `resolves` | `EXPECT_NO_THROW` |
| 包含 | `assert.Contains` | `contains()` | `toContain()` | `Contains()` |
| 长度 | `assert.Len(x, n)` | `hasSize(n)` | `toHaveLength(n)` | `SizeIs(n)` |

## 4. 测试结构模板

**所有语言通用 AAA 模式:**
```
// Arrange - 准备测试数据和 Mock
// Act - 执行被测函数
// Assert - 验证结果
```

## 5. 边界值速查

| 类型 | 必测边界值 |
|------|----------|
| 数值 | `0, -1, 1, MAX, MIN` |
| 字符串 | `"", " ", "a", 超长(1000+)` |
| 集合 | `[], [单元素], [大量]` |
| 指针 | `nil/null` |

## 6. 命名规范

```
Go:        Test{Function}_{Scenario}
Java:      should{Behavior}When{Condition}
TypeScript: it('should {行为} when {条件}')
C++:       TEST_F({Suite}, {Scenario})
```

## 7. 需要详细知识时

```
详细测试场景 → test-case-library/knowledge/test-scenarios.md
详细断言模式 → test-case-library/assertions/assertion-patterns.md
语言示例代码 → test-case-library/examples/{language}/
项目特定配置 → .ai-test-config.yaml (如果存在)
```
