# AI 测试生成最佳实践指南

> 版本: 2.0.0
> 创建日期: 2025-12-07
> 最后更新: 2025-12-08
> 适用对象: 开发人员、测试工程师、产品经理

## 1. 概述

本指南提供使用 AI 生成测试案例的最佳实践，帮助团队高效地创建高质量、可维护的测试代码。

### 1.1 指南目标

- 让任何人都能使用 AI 生成有效测试
- 确保生成的测试符合行业最佳实践
- 保证测试覆盖率和质量
- 建立可持续的测试维护流程

### 1.2 适用人群

| 角色 | 使用场景 |
|------|---------|
| **开发人员** | 为新代码生成测试，提高开发效率 |
| **测试工程师** | 补充测试用例，提高覆盖率 |
| **产品经理** | 从需求角度描述测试场景 |
| **DevOps** | 自动化测试生成和维护 |

---

## 2. 测试意图描述

### 2.1 好的测试意图描述

测试意图描述越清晰，AI 生成的测试质量越高。

#### 2.1.1 描述要素

```
一个好的测试意图描述应包含：
├── 1. 被测目标（What）
│   └── 具体的函数、API 或功能
├── 2. 测试场景（When）
│   └── 在什么条件下测试
├── 3. 预期行为（Then）
│   └── 期望的输出或结果
├── 4. 边界条件（Edge Cases）
│   └── 特殊情况和异常处理
└── 5. 质量要求（Quality）
    └── 覆盖率、安全性等要求
```

#### 2.1.2 好的描述示例

**示例 1: 简洁但完整**
```
测试用户登录功能：
- 正确凭证应返回 JWT token
- 错误密码返回 401
- 用户不存在返回 401（不泄露用户是否存在）
- 账户锁定返回 403
- 需要防止 SQL 注入
- 目标覆盖率：90%
```

**示例 2: 结构化描述**
```yaml
target:
  function: CreateOrder
  module: order_service

scenarios:
  - name: 正常下单
    input: 有效商品 + 有效库存 + 有效支付信息
    expect: 订单创建成功，返回订单号

  - name: 库存不足
    input: 有效商品 + 库存为0
    expect: 返回库存不足错误

  - name: 并发下单
    input: 多用户同时下单同一商品
    expect: 不超卖，正确处理并发

requirements:
  coverage: 85%
  include_security: true
```

**示例 3: 对话式描述**
```
我需要测试购物车的添加商品功能。

功能说明：
- 用户可以添加商品到购物车
- 已有商品应增加数量
- 最多添加 99 件同一商品
- 需要验证商品是否存在和库存

需要测试的场景：
1. 正常添加新商品
2. 增加已有商品数量
3. 达到数量上限
4. 商品不存在
5. 库存不足
```

#### 2.1.3 避免的描述方式

```
❌ 太模糊：
"测试登录功能"

❌ 只有正常路径：
"测试用户输入正确用户名密码后登录成功"

❌ 缺少预期结果：
"测试当用户输入错误密码时的情况"

❌ 过于技术化（对非技术人员）：
"测试 LoginService.authenticate() 在 UserRepository.findByUsername()
返回 null 时是否正确抛出 UserNotFoundException"
```

### 2.2 分层描述策略

根据角色使用不同的描述层次：

```
┌─────────────────────────────────────────────────────────────┐
│  Level 1: 业务描述（产品经理/业务人员）                        │
│  "用户应该能够安全登录系统"                                   │
├─────────────────────────────────────────────────────────────┤
│  Level 2: 功能描述（测试工程师）                              │
│  "测试登录功能的正常流程、错误处理和安全防护"                   │
├─────────────────────────────────────────────────────────────┤
│  Level 3: 技术描述（开发人员）                                │
│  "测试 AuthService.Login() 函数，覆盖所有分支，                │
│   mock UserRepository 和 TokenService"                       │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. 测试设计原则

### 3.1 FIRST 原则

```
F - Fast（快速）
    单元测试应在毫秒级完成

I - Independent（独立）
    测试之间不应有依赖关系

R - Repeatable（可重复）
    每次运行结果应相同

S - Self-Validating（自验证）
    测试应自动判断通过/失败

T - Timely（及时）
    测试应与代码同时编写
```

### 3.2 AAA 模式

每个测试应遵循 Arrange-Act-Assert 模式：

```go
func TestLogin_Success(t *testing.T) {
    // Arrange - 准备测试数据和环境
    user := &User{
        Username: "testuser",
        Password: hashedPassword,
    }
    mockRepo.On("FindByUsername", "testuser").Return(user, nil)

    // Act - 执行被测行为
    token, err := authService.Login("testuser", "password")

    // Assert - 验证结果
    require.NoError(t, err)
    assert.NotEmpty(t, token)
}
```

### 3.3 单一职责

每个测试只验证一个行为：

```go
// ❌ 错误：一个测试验证多个行为
func TestUser(t *testing.T) {
    // 测试创建
    user, err := service.Create(...)
    assert.NoError(t, err)

    // 测试更新
    err = service.Update(user.ID, ...)
    assert.NoError(t, err)

    // 测试删除
    err = service.Delete(user.ID)
    assert.NoError(t, err)
}

// ✅ 正确：拆分为独立测试
func TestUser_Create_Success(t *testing.T) {
    user, err := service.Create(...)
    assert.NoError(t, err)
    assert.NotEmpty(t, user.ID)
}

func TestUser_Update_Success(t *testing.T) {
    // 独立的 setup
    user := createTestUser(t)

    err := service.Update(user.ID, ...)
    assert.NoError(t, err)
}

func TestUser_Delete_Success(t *testing.T) {
    // 独立的 setup
    user := createTestUser(t)

    err := service.Delete(user.ID)
    assert.NoError(t, err)
}
```

### 3.4 测试边界

确保覆盖所有边界条件：

```
数值边界:
├── 零值 (0)
├── 负数 (-1)
├── 最小值 (MIN_INT)
├── 最大值 (MAX_INT)
├── 边界值 (N-1, N, N+1)
└── 溢出值

字符串边界:
├── 空字符串 ("")
├── 单字符 ("a")
├── 超长字符串 (10000+ chars)
├── 特殊字符 (!@#$%^&*)
├── Unicode (中文、emoji)
├── 空白字符 (spaces, tabs, newlines)
└── SQL/XSS 注入字符

集合边界:
├── 空集合 ([])
├── 单元素 ([item])
├── 大集合 (10000+ items)
├── null/nil
└── 重复元素

时间边界:
├── 过去时间
├── 未来时间
├── 时区边界
├── 闰年/闰秒
└── 边界日期 (月末、年末)
```

---

## 4. 测试场景分类

### 4.1 场景金字塔

```
                    /\
                   /  \
                  /    \
                 / E2E  \          ← 少量端到端测试
                /________\
               /          \
              / Integration \       ← 适量集成测试
             /______________\
            /                \
           /    Unit Tests    \     ← 大量单元测试
          /____________________\
```

### 4.2 场景分类标准

```yaml
scenarios:
  happy_path:
    description: "正常流程测试"
    coverage: "必须覆盖"
    priority: critical
    examples:
      - 有效输入返回预期结果
      - 正常业务流程

  error_handling:
    description: "错误处理测试"
    coverage: "必须覆盖"
    priority: high
    examples:
      - 无效输入返回错误
      - 外部依赖失败
      - 网络超时
      - 数据库错误

  edge_cases:
    description: "边界情况测试"
    coverage: "应该覆盖"
    priority: medium
    examples:
      - 空值处理
      - 边界值
      - 并发访问
      - 大数据量

  security:
    description: "安全测试"
    coverage: "应该覆盖"
    priority: high
    examples:
      - 注入攻击防护
      - 权限验证
      - 数据脱敏
      - 敏感信息保护

  performance:
    description: "性能测试"
    coverage: "选择性覆盖"
    priority: medium
    examples:
      - 响应时间
      - 吞吐量
      - 资源使用
```

### 4.3 场景覆盖检查清单

```markdown
## 功能测试检查清单

### 输入验证
- [ ] 有效输入
- [ ] 无效输入格式
- [ ] 缺少必填字段
- [ ] 超过长度限制
- [ ] 特殊字符处理

### 业务逻辑
- [ ] 正常流程
- [ ] 条件分支
- [ ] 循环边界
- [ ] 状态转换

### 错误处理
- [ ] 预期错误
- [ ] 意外错误
- [ ] 错误恢复
- [ ] 错误信息

### 数据访问
- [ ] 创建成功
- [ ] 查询存在的数据
- [ ] 查询不存在的数据
- [ ] 更新成功
- [ ] 更新冲突
- [ ] 删除成功
- [ ] 删除不存在的数据

### 安全性
- [ ] 认证验证
- [ ] 授权验证
- [ ] 输入净化
- [ ] 敏感数据处理

### 并发
- [ ] 并发读取
- [ ] 并发写入
- [ ] 死锁防护
- [ ] 竞态条件
```

---

## 5. 多语言最佳实践

### 5.1 Golang 测试最佳实践

```go
// 1. 使用表驱动测试
func TestCalculate(t *testing.T) {
    tests := []struct {
        name     string
        input    int
        expected int
        wantErr  bool
    }{
        {"positive", 5, 25, false},
        {"zero", 0, 0, false},
        {"negative", -5, 25, false},
        {"overflow", math.MaxInt64, 0, true},
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            result, err := Calculate(tt.input)
            if tt.wantErr {
                require.Error(t, err)
                return
            }
            require.NoError(t, err)
            assert.Equal(t, tt.expected, result)
        })
    }
}

// 2. 使用子测试进行分组
func TestUserService(t *testing.T) {
    t.Run("Create", func(t *testing.T) {
        t.Run("Success", testUserCreate_Success)
        t.Run("DuplicateEmail", testUserCreate_DuplicateEmail)
    })

    t.Run("Update", func(t *testing.T) {
        t.Run("Success", testUserUpdate_Success)
        t.Run("NotFound", testUserUpdate_NotFound)
    })
}

// 3. 使用测试辅助函数
func createTestUser(t *testing.T) *User {
    t.Helper()
    user := &User{
        ID:    uuid.New().String(),
        Email: fmt.Sprintf("test-%s@example.com", uuid.New().String()),
    }
    return user
}

// 4. 使用 testify 进行断言
func TestExample(t *testing.T) {
    // require: 失败时立即停止
    require.NoError(t, err)

    // assert: 失败时继续执行
    assert.Equal(t, expected, actual)
    assert.NotNil(t, result)
    assert.Contains(t, slice, item)
}

// 5. 并行测试
func TestParallel(t *testing.T) {
    t.Parallel() // 标记为可并行

    tests := []struct{...}
    for _, tt := range tests {
        tt := tt // 捕获变量
        t.Run(tt.name, func(t *testing.T) {
            t.Parallel() // 子测试也并行
            // ...
        })
    }
}
```

### 5.2 Java 测试最佳实践

```java
// 1. 使用 JUnit 5 特性
@DisplayName("User Service Tests")
class UserServiceTest {

    @Nested
    @DisplayName("Create User")
    class CreateUser {

        @Test
        @DisplayName("Should create user with valid data")
        void shouldCreateUserWithValidData() {
            // Given
            CreateUserRequest request = new CreateUserRequest("test@example.com", "password");

            // When
            User result = userService.create(request);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.getEmail()).isEqualTo("test@example.com");
        }

        @ParameterizedTest
        @CsvSource({
            "'', Invalid email",
            "'invalid', Invalid email format",
            "'test@', Invalid email format"
        })
        @DisplayName("Should reject invalid email")
        void shouldRejectInvalidEmail(String email, String expectedError) {
            // ...
        }
    }
}

// 2. 使用 AssertJ 流式断言
@Test
void shouldReturnUserList() {
    List<User> users = userService.findAll();

    assertThat(users)
        .isNotEmpty()
        .hasSize(3)
        .extracting(User::getEmail)
        .containsExactly("user1@example.com", "user2@example.com", "user3@example.com");
}

// 3. 使用 Mockito 进行 mock
@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private PaymentService paymentService;

    @InjectMocks
    private OrderService orderService;

    @Test
    void shouldCreateOrder() {
        // Given
        when(paymentService.process(any())).thenReturn(PaymentResult.SUCCESS);

        // When
        Order order = orderService.create(orderRequest);

        // Then
        verify(orderRepository).save(any(Order.class));
        verify(paymentService).process(any(PaymentRequest.class));
    }
}

// 4. 使用 @BeforeEach 和 @AfterEach
@BeforeEach
void setUp() {
    // 每个测试前执行
}

@AfterEach
void tearDown() {
    // 每个测试后执行
}
```

### 5.3 JavaScript/TypeScript 测试最佳实践

```typescript
// 1. 使用 describe/it 组织测试
describe('UserService', () => {
    describe('create', () => {
        it('should create user with valid data', async () => {
            const result = await userService.create({
                email: 'test@example.com',
                password: 'password123'
            });

            expect(result).toBeDefined();
            expect(result.email).toBe('test@example.com');
        });

        it('should throw error for duplicate email', async () => {
            await expect(
                userService.create({ email: 'existing@example.com', password: 'password' })
            ).rejects.toThrow('Email already exists');
        });
    });
});

// 2. 使用 beforeEach/afterEach
describe('DatabaseService', () => {
    let connection: Connection;

    beforeEach(async () => {
        connection = await createTestConnection();
    });

    afterEach(async () => {
        await connection.close();
    });

    // tests...
});

// 3. 使用 Jest mock
jest.mock('./userRepository');
const mockUserRepository = userRepository as jest.Mocked<typeof userRepository>;

beforeEach(() => {
    mockUserRepository.findById.mockReset();
});

it('should return user by id', async () => {
    mockUserRepository.findById.mockResolvedValue({
        id: '123',
        email: 'test@example.com'
    });

    const result = await userService.getById('123');

    expect(mockUserRepository.findById).toHaveBeenCalledWith('123');
    expect(result.email).toBe('test@example.com');
});

// 4. 使用 test.each 进行参数化测试
test.each([
    ['valid@email.com', true],
    ['invalid', false],
    ['', false],
    ['@no-local.com', false],
])('validates email %s as %s', (email, expected) => {
    expect(isValidEmail(email)).toBe(expected);
});

// 5. React 组件测试
import { render, screen, fireEvent } from '@testing-library/react';

describe('LoginForm', () => {
    it('should submit form with valid data', async () => {
        const onSubmit = jest.fn();
        render(<LoginForm onSubmit={onSubmit} />);

        fireEvent.change(screen.getByLabelText('Email'), {
            target: { value: 'test@example.com' }
        });
        fireEvent.change(screen.getByLabelText('Password'), {
            target: { value: 'password' }
        });
        fireEvent.click(screen.getByRole('button', { name: 'Login' }));

        await waitFor(() => {
            expect(onSubmit).toHaveBeenCalledWith({
                email: 'test@example.com',
                password: 'password'
            });
        });
    });
});
```

### 5.4 C++ 测试最佳实践

```cpp
// 1. 使用 Google Test
#include <gtest/gtest.h>

// 基本测试
TEST(CalculatorTest, AddPositiveNumbers) {
    Calculator calc;
    EXPECT_EQ(calc.Add(2, 3), 5);
}

// 2. 使用 Test Fixtures
class UserServiceTest : public ::testing::Test {
protected:
    void SetUp() override {
        // 每个测试前执行
        mockRepo = std::make_unique<MockUserRepository>();
        service = std::make_unique<UserService>(mockRepo.get());
    }

    void TearDown() override {
        // 每个测试后执行
    }

    std::unique_ptr<MockUserRepository> mockRepo;
    std::unique_ptr<UserService> service;
};

TEST_F(UserServiceTest, CreateUserSuccess) {
    EXPECT_CALL(*mockRepo, Save(testing::_))
        .WillOnce(testing::Return(true));

    auto result = service->CreateUser("test@example.com");
    EXPECT_TRUE(result.has_value());
}

// 3. 参数化测试
class ValidationTest : public ::testing::TestWithParam<std::tuple<std::string, bool>> {};

TEST_P(ValidationTest, ValidateEmail) {
    auto [email, expected] = GetParam();
    EXPECT_EQ(ValidateEmail(email), expected);
}

INSTANTIATE_TEST_SUITE_P(
    EmailValidation,
    ValidationTest,
    ::testing::Values(
        std::make_tuple("valid@email.com", true),
        std::make_tuple("invalid", false),
        std::make_tuple("", false)
    )
);

// 4. 使用 Google Mock
class MockDatabase : public Database {
public:
    MOCK_METHOD(bool, Connect, (), (override));
    MOCK_METHOD(std::optional<User>, FindUser, (const std::string& id), (override));
    MOCK_METHOD(bool, SaveUser, (const User& user), (override));
};

TEST_F(UserServiceTest, GetUserNotFound) {
    EXPECT_CALL(*mockRepo, FindUser("non-existent"))
        .WillOnce(testing::Return(std::nullopt));

    auto result = service->GetUser("non-existent");
    EXPECT_FALSE(result.has_value());
}

// 5. 异常测试
TEST(ParserTest, ThrowsOnInvalidInput) {
    Parser parser;
    EXPECT_THROW(parser.Parse("invalid"), ParseException);
}

TEST(ParserTest, NoThrowOnValidInput) {
    Parser parser;
    EXPECT_NO_THROW(parser.Parse("valid input"));
}
```

### 5.5 Python 测试最佳实践

```python
# 1. 使用 pytest 特性
import pytest
from unittest.mock import Mock, MagicMock, patch

class TestUserService:
    def test_create_user_success(self):
        # Arrange
        mock_repo = Mock()
        mock_repo.find_by_email.return_value = None
        mock_repo.save.return_value = User(id=1, email="test@example.com")
        service = UserService(mock_repo)

        # Act
        result = service.create("test@example.com", "password")

        # Assert
        assert result is not None
        assert result.email == "test@example.com"
        mock_repo.save.assert_called_once()

    # 2. 使用 fixtures
    @pytest.fixture
    def user_service(self):
        mock_repo = Mock()
        return UserService(mock_repo)

    def test_with_fixture(self, user_service):
        result = user_service.get_user(1)
        assert result is not None

    # 3. 参数化测试
    @pytest.mark.parametrize("email,expected", [
        ("valid@email.com", True),
        ("invalid", False),
        ("", False),
        ("@no-local.com", False),
    ])
    def test_email_validation(self, email, expected):
        assert validate_email(email) == expected

    # 4. 使用 pytest-mock
    def test_with_mocker(self, mocker):
        mock_database = mocker.patch('module.database.Database')
        mock_database.return_value.query.return_value = [{"id": 1}]

        result = get_users()

        assert len(result) == 1
        mock_database.return_value.query.assert_called_once()

    # 5. 异步测试
    @pytest.mark.asyncio
    async def test_async_function(self):
        result = await async_function()
        assert result == expected

    # 6. 异常测试
    def test_raises_exception(self):
        with pytest.raises(ValueError, match="Invalid input"):
            validate_input("invalid")

    # 7. 测试类方法
    @classmethod
    def setup_class(cls):
        """类级别 setup，所有测试前执行一次"""
        cls.shared_resource = create_resource()

    def setup_method(self):
        """方法级别 setup，每个测试前执行"""
        self.test_data = {}

    def teardown_method(self):
        """方法级别 teardown，每个测试后执行"""
        cleanup()
```

### 5.6 Rust 测试最佳实践

```rust
// 1. 基本单元测试
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_calculate_success() {
        let result = calculate(5, 3);
        assert_eq!(result, 8);
    }

    #[test]
    fn test_calculate_overflow() {
        let result = calculate(i32::MAX, 1);
        assert!(result.is_err());
    }

    // 2. 使用 Result 进行测试
    #[test]
    fn test_parse_json() -> Result<(), Box<dyn std::error::Error>> {
        let data = r#"{"name": "test"}"#;
        let parsed: User = serde_json::from_str(data)?;
        assert_eq!(parsed.name, "test");
        Ok(())
    }

    // 3. 测试 panic
    #[test]
    #[should_panic(expected = "division by zero")]
    fn test_divide_by_zero() {
        divide(10, 0);
    }

    // 4. 忽略测试
    #[test]
    #[ignore]
    fn expensive_test() {
        // 长时间运行的测试
    }

    // 5. 使用 mockall 进行 mocking
    use mockall::predicate::*;
    use mockall::mock;

    mock! {
        Database {}

        impl Database {
            fn find_user(&self, id: u32) -> Option<User>;
            fn save_user(&mut self, user: User) -> bool;
        }
    }

    #[test]
    fn test_with_mock() {
        let mut mock_db = MockDatabase::new();

        mock_db
            .expect_find_user()
            .with(eq(1))
            .times(1)
            .returning(|_| Some(User { id: 1, name: "test".to_string() }));

        let service = UserService::new(mock_db);
        let result = service.get_user(1);

        assert!(result.is_some());
        assert_eq!(result.unwrap().name, "test");
    }

    // 6. 集成测试文档测试
    /// ```
    /// use mylib::calculate;
    /// assert_eq!(calculate(2, 2), 4);
    /// ```
    fn documented_function() {}

    // 7. 基准测试 (benches/)
    #[bench]
    fn bench_calculate(b: &mut Bencher) {
        b.iter(|| calculate(100, 200));
    }
}
```

### 5.7 Vue 测试最佳实践

```typescript
// 1. Vue 组件测试基础
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import UserProfile from './UserProfile.vue'

describe('UserProfile.vue', () => {
    let wrapper: any

    beforeEach(() => {
        wrapper = mount(UserProfile, {
            props: {
                userId: 123
            }
        })
    })

    it('should render user name', async () => {
        await wrapper.setData({ user: { name: 'John' } })
        expect(wrapper.text()).toContain('John')
    })

    // 2. 测试事件
    it('should emit save event when button clicked', async () => {
        const button = wrapper.find('[data-testid="save-button"]')
        await button.trigger('click')

        expect(wrapper.emitted('save')).toBeTruthy()
        expect(wrapper.emitted('save')[0]).toEqual([{ name: 'John' }])
    })

    // 3. 测试 props
    it('should receive userId prop', () => {
        expect(wrapper.props('userId')).toBe(123)
    })

    // 4. 测试插槽
    it('should render slot content', () => {
        const wrapper = mount(UserProfile, {
            slots: {
                default: '<div>Custom content</div>'
            }
        })
        expect(wrapper.html()).toContain('Custom content')
    })

    // 5. 测试 Vuex/Pinia store
    it('should dispatch action', async () => {
        const mockStore = {
            dispatch: vi.fn()
        }

        const wrapper = mount(UserProfile, {
            global: {
                mocks: {
                    $store: mockStore
                }
            }
        })

        await wrapper.vm.saveUser()
        expect(mockStore.dispatch).toHaveBeenCalledWith('user/save', { name: 'John' })
    })

    // 6. 测试异步数据加载
    it('should load user data on mount', async () => {
        const mockUserService = {
            getUser: vi.fn().mockResolvedValue({ id: 123, name: 'John' })
        }

        const wrapper = mount(UserProfile, {
            props: { userId: 123 },
            global: {
                provide: {
                    userService: mockUserService
                }
            }
        })

        await flushPromises()

        expect(wrapper.vm.user.name).toBe('John')
        expect(mockUserService.getUser).toHaveBeenCalledWith(123)
    })

    // 7. 测试 computed properties
    it('should compute full name', async () => {
        await wrapper.setData({
            user: { firstName: 'John', lastName: 'Doe' }
        })
        expect(wrapper.vm.fullName).toBe('John Doe')
    })

    // 8. 测试条件渲染
    it('should show loading state', async () => {
        await wrapper.setData({ loading: true })
        expect(wrapper.find('[data-testid="loading"]').exists()).toBe(true)

        await wrapper.setData({ loading: false })
        expect(wrapper.find('[data-testid="loading"]').exists()).toBe(false)
    })
})
```

### 5.8 React 测试最佳实践

```typescript
// 1. React 组件测试基础
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { UserProfile } from './UserProfile'

describe('UserProfile', () => {
    // 2. 测试渲染
    it('should render user name', async () => {
        const mockUser = { id: 123, name: 'John Doe' }

        render(<UserProfile user={mockUser} />)

        expect(screen.getByText('John Doe')).toBeInTheDocument()
    })

    // 3. 测试用户交互
    it('should call onSave when save button clicked', async () => {
        const user = userEvent.setup()
        const mockOnSave = jest.fn()

        render(<UserProfile user={{}} onSave={mockOnSave} />)

        const saveButton = screen.getByRole('button', { name: /save/i })
        await user.click(saveButton)

        expect(mockOnSave).toHaveBeenCalledTimes(1)
    })

    // 4. 测试表单输入
    it('should update input value', async () => {
        const user = userEvent.setup()

        render(<UserProfile />)

        const nameInput = screen.getByLabelText(/name/i)
        await user.type(nameInput, 'John')

        expect(nameInput).toHaveValue('John')
    })

    // 5. 测试异步操作
    it('should load and display user data', async () => {
        const mockUserService = {
            getUser: jest.fn().mockResolvedValue({ id: 123, name: 'John' })
        }

        render(<UserProfile userId={123} userService={mockUserService} />)

        await waitFor(() => {
            expect(screen.getByText('John')).toBeInTheDocument()
        })

        expect(mockUserService.getUser).toHaveBeenCalledWith(123)
    })

    // 6. 测试错误状态
    it('should display error message when loading fails', async () => {
        const mockUserService = {
            getUser: jest.fn().mockRejectedValue(new Error('Not found'))
        }

        render(<UserProfile userId={999} userService={mockUserService} />)

        await waitFor(() => {
            expect(screen.getByText(/error/i)).toBeInTheDocument()
        })
    })

    // 7. 测试条件渲染
    it('should show loading spinner while loading', () => {
        render(<UserProfile loading={true} />)
        expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()

        render(<UserProfile loading={false} user={{}} />)
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument()
    })

    // 8. 测试 React Hooks
    it('should update state with useState', async () => {
        const user = userEvent.setup()
        const { rerender } = render(<Counter />)

        const button = screen.getByRole('button', { name: /increment/i })
        await user.click(button)

        expect(screen.getByText('Count: 1')).toBeInTheDocument()
    })

    // 9. 测试 Context
    it('should access theme from context', () => {
        render(
            <ThemeContext.Provider value={{ theme: 'dark' }}>
                <ThemedComponent />
            </ThemeContext.Provider>
        )

        expect(screen.getByTestId('theme')).toHaveTextContent('dark')
    })

    // 10. 测试自定义 Hooks
    import { renderHook, act } from '@testing-library/react'

    it('should use custom hook', () => {
        const { result } = renderHook(() => useCounter())

        expect(result.current.count).toBe(0)

        act(() => {
            result.current.increment()
        })

        expect(result.current.count).toBe(1)
    })
})
```

---

## 6. 覆盖率策略

### 6.1 覆盖率目标设定

```yaml
coverage_targets:
  # 按代码重要性分级
  critical_code:
    path_patterns:
      - "**/auth/**"
      - "**/payment/**"
      - "**/security/**"
    targets:
      line: 95%
      branch: 90%
      mutation: 80%

  core_business:
    path_patterns:
      - "**/service/**"
      - "**/domain/**"
    targets:
      line: 90%
      branch: 85%
      mutation: 75%

  standard_code:
    path_patterns:
      - "**/handler/**"
      - "**/repository/**"
    targets:
      line: 80%
      branch: 75%
      mutation: 60%

  utility_code:
    path_patterns:
      - "**/util/**"
      - "**/helper/**"
    targets:
      line: 70%
      branch: 65%
      mutation: 50%
```

### 6.2 覆盖率提升策略

```
1. 识别未覆盖代码
   ├── 运行覆盖率工具
   ├── 分析覆盖率报告
   └── 标记关键未覆盖区域

2. 分析未覆盖原因
   ├── 缺少测试场景
   ├── 死代码（永远不会执行）
   ├── 难以测试的代码（需要重构）
   └── 错误处理路径

3. 针对性补充测试
   ├── 为未覆盖分支添加测试
   ├── 补充边界条件测试
   ├── 添加错误路径测试
   └── 使用 AI 生成补充测试

4. 重构难以测试的代码
   ├── 提取依赖
   ├── 使用依赖注入
   ├── 减少函数复杂度
   └── 分离副作用
```

### 6.3 变异测试

变异测试通过修改代码来验证测试质量：

```
变异类型:
├── 条件变异
│   └── > 改为 >= 或 <
├── 常量变异
│   └── 0 改为 1
├── 返回值变异
│   └── true 改为 false
├── 方法调用变异
│   └── 删除方法调用
└── 逻辑变异
    └── && 改为 ||

变异分数 = 被测试杀死的变异体 / 总变异体数

目标:
- 关键代码: 80%+
- 业务代码: 70%+
- 工具代码: 50%+
```

---

## 7. 持续集成最佳实践

### 7.1 CI 流程集成

```yaml
# .github/workflows/test.yml
name: Test Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Go
        uses: actions/setup-go@v4
        with:
          go-version: '1.21'

      - name: Run Tests
        run: make test-cover

      - name: Check Coverage
        run: |
          COVERAGE=$(go tool cover -func=coverage.out | grep total | awk '{print $3}' | sed 's/%//')
          if (( $(echo "$COVERAGE < 80" | bc -l) )); then
            echo "Coverage $COVERAGE% is below threshold 80%"
            exit 1
          fi

      - name: Upload Coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage.out

  ai-test-generation:
    runs-on: ubuntu-latest
    needs: test
    if: github.event_name == 'pull_request'
    steps:
      - uses: actions/checkout@v3

      - name: Analyze Changed Files
        id: changes
        run: |
          FILES=$(git diff --name-only origin/main...HEAD | grep '\.go$' | grep -v '_test\.go$')
          echo "files=$FILES" >> $GITHUB_OUTPUT

      - name: Generate Tests for Changed Files
        if: steps.changes.outputs.files != ''
        run: |
          for file in ${{ steps.changes.outputs.files }}; do
            claude "/generate-tests --file=$file --coverage=85"
          done

      - name: Create PR Comment
        uses: actions/github-script@v6
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: '🤖 AI 已为变更的代码生成测试建议，请查看上方的测试文件。'
            })
```

### 7.2 测试质量门禁

```yaml
quality_gates:
  pre_commit:
    - lint_tests
    - run_unit_tests

  pull_request:
    - all_tests_pass
    - coverage_not_decreased
    - no_flaky_tests

  merge_to_main:
    - coverage_above_threshold
    - mutation_score_above_threshold
    - performance_tests_pass

  release:
    - all_gates_pass
    - e2e_tests_pass
    - security_tests_pass
```

### 7.3 测试报告

```markdown
## 测试报告模板

### 概览
- 总测试数: 250
- 通过: 248 (99.2%)
- 失败: 2 (0.8%)
- 跳过: 0

### 覆盖率
- 行覆盖率: 87.5% (目标: 85%) ✅
- 分支覆盖率: 82.3% (目标: 80%) ✅
- 变异分数: 71.2% (目标: 70%) ✅

### 失败测试
1. `TestLogin_RateLimit` - 超时
2. `TestPayment_Concurrent` - 断言失败

### 新增测试
- AI 生成: 15 个测试用例
- 手动添加: 3 个测试用例

### 建议
- 为 `internal/payment/refund.go` 增加边界测试
- `TestLogin_RateLimit` 需要增加超时时间
```

---

## 8. 测试维护

### 8.1 测试代码审查清单

```markdown
## 测试代码审查清单

### 结构
- [ ] 测试遵循 AAA 模式（Arrange-Act-Assert）
- [ ] 测试名称清晰描述场景
- [ ] 测试分组合理

### 质量
- [ ] 每个测试只验证一个行为
- [ ] 测试相互独立
- [ ] 没有测试间共享状态
- [ ] 测试确定性（无随机失败）

### 断言
- [ ] 断言充分且必要
- [ ] 错误信息有意义
- [ ] 使用合适的断言方法

### 可维护性
- [ ] 没有重复代码
- [ ] 使用测试辅助函数
- [ ] 合理使用 fixtures

### 覆盖
- [ ] 覆盖正常路径
- [ ] 覆盖错误路径
- [ ] 覆盖边界条件
```

### 8.2 测试重构时机

```
何时重构测试:
├── 测试经常失败（flaky）
├── 测试执行太慢
├── 测试代码重复度高
├── 测试难以理解
├── 添加新测试很困难
└── 被测代码已重构

重构策略:
├── 提取公共 setup 到辅助函数
├── 使用表驱动测试减少重复
├── 分离慢测试和快测试
├── 使用更好的断言库
└── 改进测试命名
```

### 8.3 处理 Flaky 测试

```yaml
flaky_test_handling:
  detection:
    - 运行测试多次（10+次）
    - 收集失败率统计
    - 标记 flaky 测试

  analysis:
    - 时间依赖
    - 顺序依赖
    - 资源竞争
    - 外部依赖
    - 随机数据

  fixes:
    time_dependent:
      - 使用固定时间或 mock 时间
      - 增加合理的超时

    order_dependent:
      - 确保测试独立性
      - 使用 fresh 数据

    resource_contention:
      - 使用独立资源
      - 添加同步机制

    external_dependency:
      - Mock 外部服务
      - 使用测试替身

    random_data:
      - 使用固定种子
      - 记录失败时的数据
```

---

## 9. 工具链推荐

### 9.1 测试框架

| 语言 | 框架 | 用途 |
|------|------|------|
| Go | testing + testify | 标准测试 |
| Go | gomock | Mock 生成 |
| Go | go-sqlmock | 数据库 mock |
| Java | JUnit 5 | 标准测试 |
| Java | Mockito | Mock |
| Java | AssertJ | 流式断言 |
| JS/TS | Jest | 标准测试 |
| JS/TS | Testing Library | 组件测试 |
| JS/TS | Cypress | E2E 测试 |
| C++ | Google Test | 标准测试 |
| C++ | Google Mock | Mock |

### 9.2 覆盖率工具

| 语言 | 工具 |
|------|------|
| Go | go test -cover |
| Java | JaCoCo |
| JS/TS | Istanbul / c8 |
| C++ | gcov / lcov |
| 通用 | Codecov, Coveralls |

### 9.3 变异测试工具

| 语言 | 工具 |
|------|------|
| Go | go-mutesting |
| Java | PITest |
| JS/TS | Stryker |
| C++ | mull |

---

## 10. 常见问题解答

### Q1: AI 生成的测试可靠吗？

**A**: AI 生成的测试需要人工审查，但可以大大提高效率：
- 优点：快速生成基础测试，覆盖常见场景
- 注意：需要验证断言正确性，补充业务特定逻辑

### Q2: 应该追求 100% 覆盖率吗？

**A**: 不推荐盲目追求 100%：
- 关键代码：追求高覆盖率（90%+）
- 普通代码：合理覆盖（80%）
- 工具代码：基本覆盖（70%）
- 关注测试质量，而非数量

### Q3: 如何处理遗留代码的测试？

**A**: 渐进式策略：
1. 先为关键路径添加测试
2. 每次修改时补充相关测试
3. 使用 AI 批量生成基础测试
4. 重构时同步更新测试

### Q4: 测试执行太慢怎么办？

**A**: 优化策略：
1. 并行执行测试
2. 分离单元测试和集成测试
3. 使用 mock 替代真实依赖
4. 只运行受影响的测试（增量测试）

### Q5: 如何让非技术人员参与测试设计？

**A**: 使用本系统的意图描述层：
1. 提供自然语言输入界面
2. AI 辅助转换为测试场景
3. 技术人员审查和补充
4. 自动生成测试代码
