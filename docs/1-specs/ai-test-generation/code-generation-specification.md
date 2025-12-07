# 多语言测试代码生成规范

> 版本: 1.0.0
> 创建日期: 2025-12-07
> 状态: 设计阶段

## 1. 概述

本规范定义了如何将标准化测试场景转换为不同编程语言的测试代码，确保生成的代码符合各语言的最佳实践和惯用写法。

### 1.1 支持的语言

| 语言 | 测试框架 | Mock 框架 | 断言库 | 状态 |
|------|---------|----------|--------|------|
| **Go** | testing | gomock | testify | ✅ 支持 |
| **Java** | JUnit 5 | Mockito | AssertJ | ✅ 支持 |
| **JavaScript** | Jest | Jest | expect | ✅ 支持 |
| **TypeScript** | Jest/Vitest | Jest | expect | ✅ 支持 |
| **C++** | GoogleTest | GoogleMock | gtest | ✅ 支持 |
| **Python** | pytest | unittest.mock | pytest | 🔜 计划中 |
| **Rust** | cargo test | mockall | assert | 🔜 计划中 |

### 1.2 生成流程

```
标准测试场景 (YAML/JSON)
         │
         ▼
┌─────────────────────┐
│   场景解析器        │
│   ScenarioParser    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   语言选择器        │
│   LanguageSelector  │
└──────────┬──────────┘
           │
     ┌─────┴─────┬──────────┬──────────┐
     ▼           ▼          ▼          ▼
┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
│   Go    │ │  Java   │ │   JS    │ │   C++   │
│Generator│ │Generator│ │Generator│ │Generator│
└────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘
     │           │          │          │
     ▼           ▼          ▼          ▼
  *_test.go  *Test.java  *.test.js  *_test.cpp
```

---

## 2. 通用生成规则

### 2.1 代码结构映射

```yaml
standard_structure:
  test_suite:           # 测试套件
    maps_to:
      go: "package xxx_test"
      java: "class XxxTest"
      javascript: "describe('Xxx', () => {})"
      cpp: "class XxxTest : public ::testing::Test"

  test_case:            # 测试用例
    maps_to:
      go: "func TestXxx_Scenario(t *testing.T)"
      java: "@Test void testScenario()"
      javascript: "it('should xxx', () => {})"
      cpp: "TEST_F(XxxTest, Scenario)"

  setup:                # 前置设置
    maps_to:
      go: "func (s *Suite) SetupTest()"
      java: "@BeforeEach void setUp()"
      javascript: "beforeEach(() => {})"
      cpp: "void SetUp() override"

  teardown:             # 后置清理
    maps_to:
      go: "func (s *Suite) TearDownTest()"
      java: "@AfterEach void tearDown()"
      javascript: "afterEach(() => {})"
      cpp: "void TearDown() override"
```

### 2.2 命名转换规则

```yaml
naming_conventions:
  go:
    test_file: "{source}_test.go"
    test_function: "Test{Function}_{Scenario}"
    helper_function: "test{Helper}"
    mock_type: "Mock{Interface}"
    style: PascalCase

  java:
    test_file: "{Source}Test.java"
    test_method: "test{Scenario}_{ExpectedBehavior}"
    helper_method: "create{Object}"
    mock_field: "mock{Dependency}"
    style: camelCase

  javascript:
    test_file: "{source}.test.{js|ts}"
    describe_block: "{ClassName}"
    it_block: "should {behavior} when {condition}"
    helper_function: "create{Object}"
    style: camelCase

  cpp:
    test_file: "{source}_test.cpp"
    test_fixture: "{Class}Test"
    test_case: "{Scenario}"
    mock_class: "Mock{Class}"
    style: PascalCase
```

### 2.3 断言映射

```yaml
assertion_mappings:
  equals:
    standard: "assert_equals(expected, actual)"
    go: "assert.Equal(t, expected, actual)"
    java: "assertThat(actual).isEqualTo(expected)"
    javascript: "expect(actual).toBe(expected)"
    cpp: "EXPECT_EQ(expected, actual)"

  not_nil:
    standard: "assert_not_nil(value)"
    go: "assert.NotNil(t, value)"
    java: "assertThat(value).isNotNull()"
    javascript: "expect(value).not.toBeNull()"
    cpp: "EXPECT_NE(nullptr, value)"

  throws:
    standard: "assert_throws(exception_type, action)"
    go: "assert.PanicsWithValue(t, expected, func() { action() })"
    java: "assertThrows(ExceptionType.class, () -> action())"
    javascript: "expect(() => action()).toThrow(ErrorType)"
    cpp: "EXPECT_THROW(action(), ExceptionType)"

  contains:
    standard: "assert_contains(collection, item)"
    go: "assert.Contains(t, collection, item)"
    java: "assertThat(collection).contains(item)"
    javascript: "expect(collection).toContain(item)"
    cpp: "EXPECT_THAT(collection, Contains(item))"

  error:
    standard: "assert_error(err)"
    go: "assert.Error(t, err)"
    java: "assertThrows(...) or assertThat(result).isFailure()"
    javascript: "expect(promise).rejects.toThrow()"
    cpp: "EXPECT_FALSE(result.ok())"

  no_error:
    standard: "assert_no_error(err)"
    go: "require.NoError(t, err)"
    java: "assertDoesNotThrow(() -> ...)"
    javascript: "await expect(promise).resolves.toBeDefined()"
    cpp: "EXPECT_TRUE(result.ok())"
```

---

## 3. Go 代码生成规范

### 3.1 文件结构

```go
// {package}_test.go

package {package}_test

import (
    "context"
    "testing"

    "github.com/stretchr/testify/assert"
    "github.com/stretchr/testify/require"
    "github.com/stretchr/testify/mock"
    "github.com/golang/mock/gomock"

    "{module}/internal/{package}"
)

// ============================================================
// Mocks
// ============================================================

type Mock{Dependency} struct {
    mock.Mock
}

func (m *Mock{Dependency}) {Method}({params}) ({returns}) {
    args := m.Called({params})
    return args.Get(0).({ReturnType}), args.Error(1)
}

// ============================================================
// Test Helpers
// ============================================================

func createTest{Entity}(t *testing.T) *{Entity} {
    t.Helper()
    return &{Entity}{
        // fields
    }
}

// ============================================================
// Tests
// ============================================================

func Test{Function}_{Scenario}(t *testing.T) {
    // Arrange
    // ...

    // Act
    // ...

    // Assert
    // ...
}
```

### 3.2 测试模板

#### 3.2.1 基本测试

```go
func Test{Function}_Success(t *testing.T) {
    // Arrange
    ctx := context.Background()
    input := &{InputType}{
        Field1: "value1",
        Field2: 123,
    }

    mockRepo := new(MockRepository)
    mockRepo.On("Method", mock.Anything).Return(expectedResult, nil)

    service := NewService(mockRepo)

    // Act
    result, err := service.{Function}(ctx, input)

    // Assert
    require.NoError(t, err)
    assert.NotNil(t, result)
    assert.Equal(t, expected, result.Field)

    mockRepo.AssertExpectations(t)
}
```

#### 3.2.2 表驱动测试

```go
func Test{Function}_EdgeCases(t *testing.T) {
    tests := []struct {
        name      string
        input     {InputType}
        setupMock func(*Mock{Dependency})
        want      {OutputType}
        wantErr   error
    }{
        {
            name: "valid input",
            input: {InputType}{Field: "valid"},
            setupMock: func(m *Mock{Dependency}) {
                m.On("Method", mock.Anything).Return(result, nil)
            },
            want: {OutputType}{Field: "expected"},
        },
        {
            name: "empty input",
            input: {InputType}{Field: ""},
            wantErr: ErrInvalidInput,
        },
        {
            name: "dependency failure",
            input: {InputType}{Field: "valid"},
            setupMock: func(m *Mock{Dependency}) {
                m.On("Method", mock.Anything).Return(nil, errors.New("db error"))
            },
            wantErr: ErrDatabaseFailure,
        },
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            // Arrange
            mockDep := new(Mock{Dependency})
            if tt.setupMock != nil {
                tt.setupMock(mockDep)
            }
            service := NewService(mockDep)

            // Act
            got, err := service.{Function}(context.Background(), tt.input)

            // Assert
            if tt.wantErr != nil {
                require.ErrorIs(t, err, tt.wantErr)
                return
            }
            require.NoError(t, err)
            assert.Equal(t, tt.want, got)
        })
    }
}
```

#### 3.2.3 HTTP Handler 测试

```go
func TestHandler_{Endpoint}(t *testing.T) {
    // Arrange
    mockService := new(MockService)
    mockService.On("Method", mock.Anything, mock.Anything).
        Return(expectedResult, nil)

    handler := NewHandler(mockService)
    router := gin.New()
    router.{METHOD}("{path}", handler.{Endpoint})

    requestBody := `{"field": "value"}`
    req := httptest.NewRequest(http.Method{METHOD}, "{path}", strings.NewReader(requestBody))
    req.Header.Set("Content-Type", "application/json")
    rec := httptest.NewRecorder()

    // Act
    router.ServeHTTP(rec, req)

    // Assert
    assert.Equal(t, http.StatusOK, rec.Code)

    var response {ResponseType}
    err := json.Unmarshal(rec.Body.Bytes(), &response)
    require.NoError(t, err)
    assert.Equal(t, expected, response.Field)

    mockService.AssertExpectations(t)
}
```

### 3.3 Go 特定规则

```yaml
go_rules:
  imports:
    - 标准库优先
    - 第三方库其次
    - 项目内部包最后
    - 使用 goimports 格式化

  testing:
    - 使用 testify/assert 进行断言
    - 使用 testify/require 进行必要检查
    - 错误检查用 require，值检查用 assert
    - 使用 t.Helper() 标记辅助函数
    - 使用 t.Parallel() 并行执行独立测试

  mocking:
    - 接口定义在使用方
    - 使用 gomock 或 testify/mock
    - Mock 放在测试文件中

  naming:
    - 测试函数: Test{Function}_{Scenario}
    - 基准测试: Benchmark{Function}
    - 示例函数: Example{Function}
```

---

## 4. Java 代码生成规范

### 4.1 文件结构

```java
// {Class}Test.java

package com.example.{package};

import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.*;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("{Class} Tests")
class {Class}Test {

    @Mock
    private {Dependency} mock{Dependency};

    @InjectMocks
    private {Class} {instance};

    private AutoCloseable mocks;

    @BeforeEach
    void setUp() {
        // setup code
    }

    @AfterEach
    void tearDown() {
        // cleanup code
    }

    @Nested
    @DisplayName("{Method} Tests")
    class {Method}Tests {

        @Test
        @DisplayName("Should {expected_behavior} when {condition}")
        void shouldBehaviorWhenCondition() {
            // Given
            // When
            // Then
        }
    }
}
```

### 4.2 测试模板

#### 4.2.1 基本测试

```java
@Test
@DisplayName("Should create user successfully with valid data")
void shouldCreateUserWithValidData() {
    // Given
    CreateUserRequest request = CreateUserRequest.builder()
        .email("test@example.com")
        .name("Test User")
        .build();

    User expectedUser = User.builder()
        .id(UUID.randomUUID())
        .email(request.getEmail())
        .name(request.getName())
        .build();

    when(mockUserRepository.save(any(User.class)))
        .thenReturn(expectedUser);

    // When
    User result = userService.create(request);

    // Then
    assertThat(result)
        .isNotNull()
        .satisfies(user -> {
            assertThat(user.getId()).isNotNull();
            assertThat(user.getEmail()).isEqualTo("test@example.com");
            assertThat(user.getName()).isEqualTo("Test User");
        });

    verify(mockUserRepository, times(1)).save(any(User.class));
}
```

#### 4.2.2 参数化测试

```java
@ParameterizedTest
@DisplayName("Should validate email format correctly")
@CsvSource({
    "valid@email.com, true",
    "invalid, false",
    "'', false",
    "@no-local.com, false",
    "no-at-sign.com, false"
})
void shouldValidateEmailFormat(String email, boolean expected) {
    // When
    boolean result = validator.isValidEmail(email);

    // Then
    assertThat(result).isEqualTo(expected);
}

@ParameterizedTest
@DisplayName("Should reject invalid inputs")
@MethodSource("invalidInputProvider")
void shouldRejectInvalidInputs(CreateUserRequest request, Class<? extends Exception> exceptionClass) {
    // When & Then
    assertThatThrownBy(() -> userService.create(request))
        .isInstanceOf(exceptionClass);
}

static Stream<Arguments> invalidInputProvider() {
    return Stream.of(
        Arguments.of(null, IllegalArgumentException.class),
        Arguments.of(new CreateUserRequest(null, "name"), ValidationException.class),
        Arguments.of(new CreateUserRequest("invalid", "name"), ValidationException.class)
    );
}
```

#### 4.2.3 异常测试

```java
@Test
@DisplayName("Should throw UserNotFoundException when user does not exist")
void shouldThrowWhenUserNotFound() {
    // Given
    String nonExistentId = "non-existent-id";
    when(mockUserRepository.findById(nonExistentId))
        .thenReturn(Optional.empty());

    // When & Then
    assertThatThrownBy(() -> userService.getById(nonExistentId))
        .isInstanceOf(UserNotFoundException.class)
        .hasMessageContaining(nonExistentId);
}
```

### 4.3 Java 特定规则

```yaml
java_rules:
  imports:
    - 使用静态导入减少代码
    - assertj 静态导入: assertThat
    - mockito 静态导入: mock, when, verify

  testing:
    - 使用 JUnit 5 (Jupiter)
    - 使用 @DisplayName 提供可读描述
    - 使用 @Nested 组织相关测试
    - 使用 AssertJ 流式断言

  mocking:
    - 使用 @ExtendWith(MockitoExtension.class)
    - 使用 @Mock 和 @InjectMocks
    - 避免 mock final 类（除非配置）

  naming:
    - 测试类: {Class}Test
    - 测试方法: should{Behavior}When{Condition}
    - 或: test{Scenario}_{ExpectedBehavior}
```

---

## 5. JavaScript/TypeScript 代码生成规范

### 5.1 文件结构

```typescript
// {module}.test.ts

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { {Class} } from './{module}';
import { {Dependency} } from './{dependency}';

// Mocks
jest.mock('./{dependency}');
const mock{Dependency} = {Dependency} as jest.Mocked<typeof {Dependency}>;

describe('{Class}', () => {
    let instance: {Class};

    beforeEach(() => {
        jest.clearAllMocks();
        instance = new {Class}();
    });

    afterEach(() => {
        // cleanup
    });

    describe('{method}', () => {
        it('should {expected_behavior} when {condition}', async () => {
            // Arrange
            // Act
            // Assert
        });
    });
});
```

### 5.2 测试模板

#### 5.2.1 基本测试

```typescript
describe('UserService', () => {
    let userService: UserService;
    let mockUserRepository: jest.Mocked<UserRepository>;

    beforeEach(() => {
        mockUserRepository = {
            findById: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
        } as jest.Mocked<UserRepository>;

        userService = new UserService(mockUserRepository);
    });

    describe('create', () => {
        it('should create user with valid data', async () => {
            // Arrange
            const request = {
                email: 'test@example.com',
                name: 'Test User',
            };
            const expectedUser = {
                id: 'generated-id',
                ...request,
                createdAt: new Date(),
            };
            mockUserRepository.save.mockResolvedValue(expectedUser);

            // Act
            const result = await userService.create(request);

            // Assert
            expect(result).toEqual(expectedUser);
            expect(mockUserRepository.save).toHaveBeenCalledWith(
                expect.objectContaining({
                    email: request.email,
                    name: request.name,
                })
            );
        });

        it('should throw ValidationError for invalid email', async () => {
            // Arrange
            const request = {
                email: 'invalid-email',
                name: 'Test User',
            };

            // Act & Assert
            await expect(userService.create(request))
                .rejects
                .toThrow(ValidationError);
        });
    });
});
```

#### 5.2.2 参数化测试

```typescript
describe('Validator', () => {
    describe('isValidEmail', () => {
        const testCases = [
            { email: 'valid@email.com', expected: true },
            { email: 'invalid', expected: false },
            { email: '', expected: false },
            { email: '@no-local.com', expected: false },
        ];

        test.each(testCases)(
            'should return $expected for email "$email"',
            ({ email, expected }) => {
                expect(validator.isValidEmail(email)).toBe(expected);
            }
        );
    });
});
```

#### 5.2.3 React 组件测试

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from './LoginForm';

describe('LoginForm', () => {
    const mockOnSubmit = jest.fn();

    beforeEach(() => {
        mockOnSubmit.mockClear();
    });

    it('should render login form', () => {
        render(<LoginForm onSubmit={mockOnSubmit} />);

        expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
    });

    it('should submit form with valid data', async () => {
        const user = userEvent.setup();
        render(<LoginForm onSubmit={mockOnSubmit} />);

        await user.type(screen.getByLabelText(/email/i), 'test@example.com');
        await user.type(screen.getByLabelText(/password/i), 'password123');
        await user.click(screen.getByRole('button', { name: /login/i }));

        await waitFor(() => {
            expect(mockOnSubmit).toHaveBeenCalledWith({
                email: 'test@example.com',
                password: 'password123',
            });
        });
    });

    it('should show validation error for invalid email', async () => {
        const user = userEvent.setup();
        render(<LoginForm onSubmit={mockOnSubmit} />);

        await user.type(screen.getByLabelText(/email/i), 'invalid-email');
        await user.click(screen.getByRole('button', { name: /login/i }));

        expect(await screen.findByText(/invalid email/i)).toBeInTheDocument();
        expect(mockOnSubmit).not.toHaveBeenCalled();
    });
});
```

### 5.3 JavaScript/TypeScript 特定规则

```yaml
js_ts_rules:
  testing:
    - 使用 Jest 或 Vitest
    - 使用 describe/it 组织测试
    - 使用 async/await 处理异步
    - React 使用 @testing-library/react

  mocking:
    - 使用 jest.mock() 模块 mock
    - 使用 jest.fn() 函数 mock
    - 使用 jest.spyOn() spy

  naming:
    - 测试文件: {module}.test.{js|ts}
    - describe: 模块或类名
    - it: "should {behavior} when {condition}"

  async:
    - 使用 async/await 而非 callbacks
    - 使用 waitFor 等待异步操作
    - 使用 act() 包装状态更新
```

---

## 6. C++ 代码生成规范

### 6.1 文件结构

```cpp
// {class}_test.cpp

#include <gtest/gtest.h>
#include <gmock/gmock.h>

#include "{class}.h"
#include "{dependency}.h"

using ::testing::_;
using ::testing::Return;
using ::testing::NiceMock;
using ::testing::StrictMock;

namespace {namespace} {
namespace {

// ============================================================
// Mocks
// ============================================================

class Mock{Dependency} : public {Dependency} {
public:
    MOCK_METHOD({return_type}, {method}, ({params}), (override));
};

// ============================================================
// Test Fixture
// ============================================================

class {Class}Test : public ::testing::Test {
protected:
    void SetUp() override {
        mock_dependency_ = std::make_unique<NiceMock<Mock{Dependency}>>();
        instance_ = std::make_unique<{Class}>(mock_dependency_.get());
    }

    void TearDown() override {
        // cleanup
    }

    std::unique_ptr<Mock{Dependency}> mock_dependency_;
    std::unique_ptr<{Class}> instance_;
};

// ============================================================
// Tests
// ============================================================

TEST_F({Class}Test, {Method}_{Scenario}) {
    // Arrange
    // Act
    // Assert
}

}  // namespace
}  // namespace {namespace}
```

### 6.2 测试模板

#### 6.2.1 基本测试

```cpp
TEST_F(UserServiceTest, CreateUser_Success) {
    // Arrange
    CreateUserRequest request;
    request.email = "test@example.com";
    request.name = "Test User";

    User expected_user;
    expected_user.id = "generated-id";
    expected_user.email = request.email;
    expected_user.name = request.name;

    EXPECT_CALL(*mock_repository_, Save(_))
        .WillOnce(Return(expected_user));

    // Act
    auto result = service_->CreateUser(request);

    // Assert
    ASSERT_TRUE(result.has_value());
    EXPECT_EQ(result->email, "test@example.com");
    EXPECT_EQ(result->name, "Test User");
}

TEST_F(UserServiceTest, CreateUser_InvalidEmail_ReturnsError) {
    // Arrange
    CreateUserRequest request;
    request.email = "invalid-email";
    request.name = "Test User";

    // Act
    auto result = service_->CreateUser(request);

    // Assert
    ASSERT_FALSE(result.has_value());
    EXPECT_EQ(result.error(), Error::kInvalidEmail);
}
```

#### 6.2.2 参数化测试

```cpp
class EmailValidationTest
    : public ::testing::TestWithParam<std::tuple<std::string, bool>> {};

TEST_P(EmailValidationTest, ValidatesEmailCorrectly) {
    auto [email, expected] = GetParam();

    auto result = Validator::IsValidEmail(email);

    EXPECT_EQ(result, expected);
}

INSTANTIATE_TEST_SUITE_P(
    EmailFormats,
    EmailValidationTest,
    ::testing::Values(
        std::make_tuple("valid@email.com", true),
        std::make_tuple("invalid", false),
        std::make_tuple("", false),
        std::make_tuple("@no-local.com", false),
        std::make_tuple("test@域名.com", true)  // Unicode
    )
);
```

#### 6.2.3 异常测试

```cpp
TEST_F(ParserTest, Parse_InvalidInput_ThrowsException) {
    // Arrange
    std::string invalid_input = "{{invalid}}";

    // Act & Assert
    EXPECT_THROW(parser_->Parse(invalid_input), ParseException);
}

TEST_F(ParserTest, Parse_InvalidInput_ThrowsWithMessage) {
    // Arrange
    std::string invalid_input = "{{invalid}}";

    // Act & Assert
    try {
        parser_->Parse(invalid_input);
        FAIL() << "Expected ParseException";
    } catch (const ParseException& e) {
        EXPECT_THAT(e.what(), ::testing::HasSubstr("invalid"));
    }
}
```

### 6.3 C++ 特定规则

```yaml
cpp_rules:
  testing:
    - 使用 Google Test
    - 使用 Test Fixture 共享 setup
    - 使用 EXPECT_* 继续执行
    - 使用 ASSERT_* 失败时停止

  mocking:
    - 使用 Google Mock
    - 使用 NiceMock 忽略未设置的调用
    - 使用 StrictMock 严格模式
    - MOCK_METHOD 声明 mock 方法

  memory:
    - 使用 unique_ptr 管理生命周期
    - 在 TearDown 中清理资源
    - 注意避免内存泄漏

  naming:
    - 测试文件: {class}_test.cpp
    - 测试类: {Class}Test
    - 测试用例: {Method}_{Scenario}
```

---

## 7. 代码生成引擎

### 7.1 生成器接口

```python
from abc import ABC, abstractmethod
from typing import List
from dataclasses import dataclass

@dataclass
class TestScenario:
    """标准测试场景"""
    id: str
    name: str
    category: str
    given: List[dict]
    when: dict
    then: List[dict]
    tags: List[str]

@dataclass
class GeneratedTest:
    """生成的测试代码"""
    filename: str
    code: str
    language: str
    framework: str

class TestGenerator(ABC):
    """测试生成器基类"""

    @abstractmethod
    def generate(self, scenarios: List[TestScenario]) -> GeneratedTest:
        """生成测试代码"""
        pass

    @abstractmethod
    def generate_mock(self, interface: str) -> str:
        """生成 mock 代码"""
        pass

    @abstractmethod
    def generate_fixture(self, entity: str) -> str:
        """生成测试数据"""
        pass

    @abstractmethod
    def format_code(self, code: str) -> str:
        """格式化代码"""
        pass
```

### 7.2 Go 生成器实现

```python
class GoTestGenerator(TestGenerator):
    """Go 测试代码生成器"""

    def __init__(self, config: dict):
        self.package_name = config.get("package", "test")
        self.use_testify = config.get("use_testify", True)

    def generate(self, scenarios: List[TestScenario]) -> GeneratedTest:
        imports = self._generate_imports(scenarios)
        mocks = self._generate_mocks(scenarios)
        helpers = self._generate_helpers(scenarios)
        tests = self._generate_tests(scenarios)

        code = f'''package {self.package_name}_test

{imports}

{mocks}

{helpers}

{tests}
'''
        return GeneratedTest(
            filename=f"{self.package_name}_test.go",
            code=self.format_code(code),
            language="go",
            framework="testify"
        )

    def _generate_tests(self, scenarios: List[TestScenario]) -> str:
        tests = []
        for scenario in scenarios:
            test = self._generate_single_test(scenario)
            tests.append(test)
        return "\n\n".join(tests)

    def _generate_single_test(self, scenario: TestScenario) -> str:
        function_name = self._to_pascal_case(scenario.name)
        arrange = self._generate_arrange(scenario.given)
        act = self._generate_act(scenario.when)
        assertions = self._generate_assertions(scenario.then)

        return f'''func Test{function_name}(t *testing.T) {{
    // Arrange
{arrange}

    // Act
{act}

    // Assert
{assertions}
}}'''

    def _generate_assertions(self, then_clauses: List[dict]) -> str:
        assertions = []
        for clause in then_clauses:
            assertion = self._map_assertion(clause)
            assertions.append(f"    {assertion}")
        return "\n".join(assertions)

    def _map_assertion(self, clause: dict) -> str:
        assertion_type = clause.get("assert")
        mapping = {
            "no_error": "require.NoError(t, err)",
            "error": "require.Error(t, err)",
            "equals": f"assert.Equal(t, {clause.get('expected')}, {clause.get('actual')})",
            "not_nil": f"assert.NotNil(t, {clause.get('target')})",
            "contains": f"assert.Contains(t, {clause.get('collection')}, {clause.get('item')})",
        }
        return mapping.get(assertion_type, f"// TODO: {assertion_type}")

    def format_code(self, code: str) -> str:
        # 使用 gofmt 格式化
        import subprocess
        result = subprocess.run(
            ["gofmt"],
            input=code,
            capture_output=True,
            text=True
        )
        return result.stdout if result.returncode == 0 else code
```

### 7.3 生成器工厂

```python
class TestGeneratorFactory:
    """测试生成器工厂"""

    _generators = {
        "go": GoTestGenerator,
        "java": JavaTestGenerator,
        "javascript": JavaScriptTestGenerator,
        "typescript": TypeScriptTestGenerator,
        "cpp": CppTestGenerator,
    }

    @classmethod
    def create(cls, language: str, config: dict = None) -> TestGenerator:
        generator_class = cls._generators.get(language.lower())
        if not generator_class:
            raise ValueError(f"Unsupported language: {language}")
        return generator_class(config or {})

    @classmethod
    def supported_languages(cls) -> List[str]:
        return list(cls._generators.keys())
```

---

## 8. 质量验证

### 8.1 生成代码验证流程

```yaml
validation_pipeline:
  - stage: syntax_check
    description: 检查语法错误
    actions:
      go: "go vet ./..."
      java: "javac -Xlint:all *.java"
      javascript: "eslint --ext .js,.ts ."
      cpp: "g++ -fsyntax-only -std=c++17 *.cpp"

  - stage: compilation
    description: 编译验证
    actions:
      go: "go build ./..."
      java: "mvn compile test-compile"
      javascript: "tsc --noEmit"
      cpp: "cmake --build . --target tests"

  - stage: test_execution
    description: 执行测试
    actions:
      go: "go test -v ./..."
      java: "mvn test"
      javascript: "npm test"
      cpp: "ctest --output-on-failure"

  - stage: coverage_check
    description: 覆盖率检查
    threshold: 80%
```

### 8.2 代码风格检查

```yaml
style_checks:
  go:
    - tool: gofmt
      fix: true
    - tool: golint
    - tool: staticcheck

  java:
    - tool: checkstyle
      config: google_checks.xml
    - tool: spotbugs

  javascript:
    - tool: eslint
      config: .eslintrc.js
    - tool: prettier
      fix: true

  cpp:
    - tool: clang-format
      style: Google
    - tool: clang-tidy
```

---

## 9. 扩展新语言

### 9.1 添加新语言支持步骤

```markdown
1. 创建生成器类
   - 继承 TestGenerator 基类
   - 实现所有抽象方法

2. 定义语言配置
   - 测试框架
   - Mock 框架
   - 断言库
   - 命名约定

3. 添加断言映射
   - 在 assertion_mappings 中添加语言映射

4. 添加代码模板
   - 测试文件模板
   - 测试函数模板
   - Mock 模板

5. 配置格式化工具
   - 代码格式化命令
   - 风格检查工具

6. 添加验证流程
   - 语法检查
   - 编译验证
   - 测试执行

7. 编写测试和文档
   - 生成器单元测试
   - 语言特定文档
```

### 9.2 配置模板

```yaml
# languages/{language}.yaml
language:
  name: "{Language}"
  file_extension: ".{ext}"

  testing:
    framework: "{framework}"
    file_pattern: "*_test.{ext}"
    run_command: "{test_command}"

  mocking:
    framework: "{mock_framework}"
    import: "{mock_import}"

  assertions:
    library: "{assertion_lib}"
    import: "{assertion_import}"

  naming:
    test_file: "{pattern}"
    test_function: "{pattern}"
    test_class: "{pattern}"

  formatting:
    tool: "{formatter}"
    command: "{format_command}"

  templates:
    test_file: |
      // 测试文件模板
    test_function: |
      // 测试函数模板
    mock_class: |
      // Mock 类模板
```

---

## 10. 附录

### 10.1 断言速查表

| 标准断言 | Go (testify) | Java (AssertJ) | JS (Jest) | C++ (gtest) |
|---------|--------------|----------------|-----------|-------------|
| 相等 | `assert.Equal` | `assertThat().isEqualTo()` | `expect().toBe()` | `EXPECT_EQ` |
| 不相等 | `assert.NotEqual` | `assertThat().isNotEqualTo()` | `expect().not.toBe()` | `EXPECT_NE` |
| 空 | `assert.Nil` | `assertThat().isNull()` | `expect().toBeNull()` | `EXPECT_EQ(nullptr,)` |
| 非空 | `assert.NotNil` | `assertThat().isNotNull()` | `expect().not.toBeNull()` | `EXPECT_NE(nullptr,)` |
| 真 | `assert.True` | `assertThat().isTrue()` | `expect().toBeTruthy()` | `EXPECT_TRUE` |
| 假 | `assert.False` | `assertThat().isFalse()` | `expect().toBeFalsy()` | `EXPECT_FALSE` |
| 包含 | `assert.Contains` | `assertThat().contains()` | `expect().toContain()` | `EXPECT_THAT(,Contains())` |
| 抛异常 | `assert.Panics` | `assertThrows()` | `expect().toThrow()` | `EXPECT_THROW` |
| 无错误 | `require.NoError` | `assertDoesNotThrow()` | `expect().resolves` | `EXPECT_NO_THROW` |

### 10.2 常用 Mock 模式

```yaml
mock_patterns:
  stub:
    description: 返回预设值
    go: 'mock.On("Method", args).Return(value)'
    java: 'when(mock.method()).thenReturn(value)'
    js: 'mock.mockReturnValue(value)'

  verify_called:
    description: 验证方法被调用
    go: 'mock.AssertCalled(t, "Method", args)'
    java: 'verify(mock).method()'
    js: 'expect(mock).toHaveBeenCalled()'

  verify_times:
    description: 验证调用次数
    go: 'mock.AssertNumberOfCalls(t, "Method", n)'
    java: 'verify(mock, times(n)).method()'
    js: 'expect(mock).toHaveBeenCalledTimes(n)'

  argument_capture:
    description: 捕获参数
    go: 'mock.On("Method", mock.AnythingOfType("Type"))'
    java: 'ArgumentCaptor.forClass(Type.class)'
    js: 'expect(mock).toHaveBeenCalledWith(arg)'
```
