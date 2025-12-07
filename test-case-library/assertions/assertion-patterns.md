# 断言模式知识库

> 本文件告诉 AI 各语言如何编写断言

## 1. 通用断言原则

### 1.1 选择合适的断言方法

```
规则: 使用最具体的断言方法

❌ assert.True(t, a == b)
✅ assert.Equal(t, expected, actual)

❌ expect(arr.length === 3).toBe(true)
✅ expect(arr).toHaveLength(3)
```

### 1.2 提供有意义的错误消息

```
规则: 断言失败时应该清楚问题所在

❌ assert.Equal(t, 200, code)
✅ assert.Equal(t, 200, code, "expected success status code")

❌ expect(result).toBe(expected)
✅ expect(result).toBe(expected) // Jest 会自动显示差异
```

### 1.3 区分 require 和 assert（Go）

```go
// require: 失败时立即停止测试
// 用于前置条件检查
require.NoError(t, err, "setup failed")

// assert: 失败时继续执行
// 用于结果验证
assert.Equal(t, expected, actual)
```

---

## 2. Go 断言模式 (testify)

### 2.1 相等性断言

```go
// 基本相等
assert.Equal(t, expected, actual)
assert.NotEqual(t, notExpected, actual)

// 深度相等（struct, map, slice）
assert.EqualValues(t, expected, actual)

// 指针相等
assert.Same(t, expectedPtr, actualPtr)
```

### 2.2 空值断言

```go
// nil 检查
assert.Nil(t, value)
assert.NotNil(t, value)

// 空值检查（空字符串、空 slice、零值）
assert.Empty(t, value)
assert.NotEmpty(t, value)

// 零值检查
assert.Zero(t, value)
assert.NotZero(t, value)
```

### 2.3 布尔断言

```go
assert.True(t, condition)
assert.False(t, condition)
```

### 2.4 错误断言

```go
// 有错误
require.Error(t, err)
assert.Error(t, err)

// 无错误（通常用 require）
require.NoError(t, err)

// 特定错误类型
assert.ErrorIs(t, err, ErrNotFound)

// 错误类型断言
var targetErr *MyError
assert.ErrorAs(t, err, &targetErr)

// 错误消息包含
assert.ErrorContains(t, err, "not found")
```

### 2.5 集合断言

```go
// 长度
assert.Len(t, slice, 3)

// 包含
assert.Contains(t, slice, item)
assert.NotContains(t, slice, item)

// 子集
assert.Subset(t, superset, subset)

// 元素匹配
assert.ElementsMatch(t, expected, actual) // 忽略顺序
```

### 2.6 字符串断言

```go
assert.Equal(t, "expected", actual)
assert.Contains(t, str, "substring")
assert.Regexp(t, regexp.MustCompile(`\d+`), str)
```

### 2.7 数值比较

```go
assert.Greater(t, a, b)
assert.GreaterOrEqual(t, a, b)
assert.Less(t, a, b)
assert.LessOrEqual(t, a, b)
assert.InDelta(t, expected, actual, delta) // 浮点数
```

---

## 3. Java 断言模式 (AssertJ)

### 3.1 相等性断言

```java
// 基本相等
assertThat(actual).isEqualTo(expected);
assertThat(actual).isNotEqualTo(notExpected);

// 同一实例
assertThat(actual).isSameAs(expected);
```

### 3.2 空值断言

```java
assertThat(value).isNull();
assertThat(value).isNotNull();
assertThat(collection).isEmpty();
assertThat(collection).isNotEmpty();
```

### 3.3 布尔断言

```java
assertThat(condition).isTrue();
assertThat(condition).isFalse();
```

### 3.4 异常断言

```java
// 断言抛出异常
assertThatThrownBy(() -> service.method())
    .isInstanceOf(IllegalArgumentException.class)
    .hasMessageContaining("invalid");

// 断言不抛出异常
assertThatNoException().isThrownBy(() -> service.method());

// JUnit 5 方式
assertThrows(IllegalArgumentException.class, () -> service.method());
```

### 3.5 集合断言

```java
assertThat(list)
    .hasSize(3)
    .contains("item1", "item2")
    .containsExactly("item1", "item2", "item3")
    .containsExactlyInAnyOrder("item3", "item1", "item2")
    .doesNotContain("item4");

// 提取字段
assertThat(users)
    .extracting(User::getName)
    .contains("Alice", "Bob");
```

### 3.6 字符串断言

```java
assertThat(str)
    .isEqualTo("expected")
    .contains("substring")
    .startsWith("prefix")
    .endsWith("suffix")
    .matches("\\d+");
```

### 3.7 对象断言

```java
// 递归比较
assertThat(actual)
    .usingRecursiveComparison()
    .isEqualTo(expected);

// 忽略字段
assertThat(actual)
    .usingRecursiveComparison()
    .ignoringFields("id", "createdAt")
    .isEqualTo(expected);
```

---

## 4. JavaScript/TypeScript 断言模式 (Jest)

### 4.1 相等性断言

```typescript
// 基本相等（===）
expect(actual).toBe(expected);

// 深度相等
expect(actual).toEqual(expected);

// 不相等
expect(actual).not.toBe(notExpected);
```

### 4.2 空值断言

```typescript
expect(value).toBeNull();
expect(value).not.toBeNull();
expect(value).toBeDefined();
expect(value).toBeUndefined();
expect(value).toBeTruthy();
expect(value).toBeFalsy();
```

### 4.3 异常断言

```typescript
// 同步异常
expect(() => syncFunction()).toThrow();
expect(() => syncFunction()).toThrow(Error);
expect(() => syncFunction()).toThrow('error message');

// 异步异常
await expect(asyncFunction()).rejects.toThrow();
await expect(asyncFunction()).rejects.toThrow(Error);
```

### 4.4 集合断言

```typescript
expect(array).toHaveLength(3);
expect(array).toContain(item);
expect(array).toContainEqual(item); // 深度比较
expect(array).toEqual(expect.arrayContaining([item1, item2]));
```

### 4.5 对象断言

```typescript
expect(obj).toHaveProperty('key');
expect(obj).toHaveProperty('key', value);
expect(obj).toMatchObject(partialObject);
expect(obj).toEqual(expect.objectContaining({ key: value }));
```

### 4.6 字符串断言

```typescript
expect(str).toBe('expected');
expect(str).toContain('substring');
expect(str).toMatch(/regex/);
```

### 4.7 Mock 断言

```typescript
// 调用检查
expect(mockFn).toHaveBeenCalled();
expect(mockFn).toHaveBeenCalledTimes(2);
expect(mockFn).toHaveBeenCalledWith(arg1, arg2);
expect(mockFn).toHaveBeenLastCalledWith(arg);

// 返回值检查
expect(mockFn).toHaveReturnedWith(value);
```

---

## 5. C++ 断言模式 (GoogleTest)

### 5.1 基本断言

```cpp
// EXPECT_* 失败后继续
// ASSERT_* 失败后停止

// 相等
EXPECT_EQ(expected, actual);
EXPECT_NE(not_expected, actual);

// 布尔
EXPECT_TRUE(condition);
EXPECT_FALSE(condition);
```

### 5.2 字符串断言

```cpp
EXPECT_STREQ(expected, actual);    // C 字符串相等
EXPECT_STRNE(not_expected, actual);
EXPECT_STRCASEEQ(expected, actual); // 忽略大小写

// std::string
EXPECT_EQ(expected, actual);
```

### 5.3 浮点数断言

```cpp
EXPECT_FLOAT_EQ(expected, actual);
EXPECT_DOUBLE_EQ(expected, actual);
EXPECT_NEAR(expected, actual, tolerance);
```

### 5.4 异常断言

```cpp
EXPECT_THROW(statement, exception_type);
EXPECT_NO_THROW(statement);
EXPECT_ANY_THROW(statement);
```

### 5.5 Matcher 断言 (GoogleMock)

```cpp
using ::testing::Eq;
using ::testing::Ne;
using ::testing::Lt;
using ::testing::Gt;
using ::testing::HasSubstr;
using ::testing::StartsWith;
using ::testing::EndsWith;
using ::testing::ContainerEq;
using ::testing::Contains;
using ::testing::IsEmpty;
using ::testing::SizeIs;

EXPECT_THAT(str, HasSubstr("substring"));
EXPECT_THAT(container, Contains(element));
EXPECT_THAT(container, SizeIs(3));
EXPECT_THAT(value, Gt(0));
```

---

## 6. 断言选择决策树

```
需要断言什么？
├── 相等性
│   ├── 基本类型 → toBe / EXPECT_EQ / assert.Equal
│   └── 对象/结构 → toEqual / assert.EqualValues / assertThat().isEqualTo()
├── 空值
│   ├── null/nil → toBeNull / assert.Nil
│   └── 空集合/字符串 → isEmpty / assert.Empty
├── 错误/异常
│   ├── Go → require.Error / assert.ErrorIs
│   ├── Java → assertThrows / assertThatThrownBy
│   └── JS → expect().toThrow / rejects.toThrow
├── 集合
│   ├── 长度 → toHaveLength / assert.Len / hasSize
│   ├── 包含 → toContain / assert.Contains / contains
│   └── 顺序无关 → arrayContaining / ElementsMatch / containsExactlyInAnyOrder
└── 数值比较
    └── 大于/小于 → toBeGreaterThan / assert.Greater / Gt
```
