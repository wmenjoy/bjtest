/**
 * C++ 测试示例 - AI 参考代码
 *
 * 本文件展示 GoogleTest + GoogleMock 的最佳实践
 * AI 应该参考这些示例来生成符合规范的 C++ 测试代码
 */

#include <gtest/gtest.h>
#include <gmock/gmock.h>
#include <memory>
#include <string>
#include <vector>
#include <optional>

// 使用 testing 命名空间的常用类
using ::testing::_;
using ::testing::Return;
using ::testing::ReturnNull;
using ::testing::Throw;
using ::testing::NiceMock;
using ::testing::StrictMock;
using ::testing::Invoke;
using ::testing::DoAll;
using ::testing::SetArgPointee;
using ::testing::SaveArg;
using ::testing::HasSubstr;
using ::testing::Contains;
using ::testing::SizeIs;
using ::testing::ElementsAre;
using ::testing::Gt;
using ::testing::Lt;
using ::testing::Ge;
using ::testing::Le;
using ::testing::IsEmpty;
using ::testing::Not;

// ============================================================
// 类型定义
// ============================================================

struct User {
    std::string id;
    std::string email;
    std::string name;
    bool is_active;
};

struct CreateUserRequest {
    std::string email;
    std::string name;
};

// 抽象接口
class IUserRepository {
public:
    virtual ~IUserRepository() = default;
    virtual std::optional<User> FindById(const std::string& id) = 0;
    virtual std::optional<User> FindByEmail(const std::string& email) = 0;
    virtual User Save(const User& user) = 0;
    virtual void Delete(const std::string& id) = 0;
    virtual std::vector<User> FindAll() = 0;
};

class IEmailService {
public:
    virtual ~IEmailService() = default;
    virtual void SendWelcomeEmail(const User& user) = 0;
};

// 自定义异常
class UserNotFoundException : public std::runtime_error {
public:
    explicit UserNotFoundException(const std::string& msg) : std::runtime_error(msg) {}
};

class ValidationException : public std::runtime_error {
public:
    explicit ValidationException(const std::string& msg) : std::runtime_error(msg) {}
};

class DuplicateEmailException : public std::runtime_error {
public:
    explicit DuplicateEmailException(const std::string& msg) : std::runtime_error(msg) {}
};

// ============================================================
// Mock 类定义
// ============================================================

class MockUserRepository : public IUserRepository {
public:
    MOCK_METHOD(std::optional<User>, FindById, (const std::string& id), (override));
    MOCK_METHOD(std::optional<User>, FindByEmail, (const std::string& email), (override));
    MOCK_METHOD(User, Save, (const User& user), (override));
    MOCK_METHOD(void, Delete, (const std::string& id), (override));
    MOCK_METHOD(std::vector<User>, FindAll, (), (override));
};

class MockEmailService : public IEmailService {
public:
    MOCK_METHOD(void, SendWelcomeEmail, (const User& user), (override));
};

// ============================================================
// 被测试的服务类
// ============================================================

class UserService {
public:
    UserService(std::unique_ptr<IUserRepository> repo,
                std::unique_ptr<IEmailService> email_service)
        : repository_(std::move(repo)),
          email_service_(std::move(email_service)) {}

    User CreateUser(const CreateUserRequest& request);
    std::optional<User> FindById(const std::string& id);
    std::vector<User> GetAllUsers();
    bool IsValidEmail(const std::string& email);

private:
    std::unique_ptr<IUserRepository> repository_;
    std::unique_ptr<IEmailService> email_service_;
};

// ============================================================
// 示例 1: 基本测试结构 (Test Fixture)
// ============================================================

class UserServiceTest : public ::testing::Test {
protected:
    // 每个测试前执行
    void SetUp() override {
        // 创建 mock 对象（使用原始指针保留引用）
        mock_repo_ = new NiceMock<MockUserRepository>();
        mock_email_ = new NiceMock<MockEmailService>();

        // 创建服务，转移所有权
        service_ = std::make_unique<UserService>(
            std::unique_ptr<IUserRepository>(mock_repo_),
            std::unique_ptr<IEmailService>(mock_email_)
        );
    }

    // 每个测试后执行
    void TearDown() override {
        // unique_ptr 会自动清理
    }

    // 测试辅助方法
    User CreateTestUser(const std::string& id, const std::string& email) {
        return User{id, email, "Test User", true};
    }

    // Mock 对象的原始指针（用于设置期望）
    MockUserRepository* mock_repo_;
    MockEmailService* mock_email_;

    // 被测服务
    std::unique_ptr<UserService> service_;
};

// ============================================================
// 示例 2: 基本测试用例
// ============================================================

TEST_F(UserServiceTest, CreateUser_Success) {
    // Arrange
    CreateUserRequest request{"test@example.com", "Test User"};
    User expected_user{"generated-id", "test@example.com", "Test User", true};

    EXPECT_CALL(*mock_repo_, FindByEmail(request.email))
        .WillOnce(Return(std::nullopt));

    EXPECT_CALL(*mock_repo_, Save(_))
        .WillOnce(Return(expected_user));

    EXPECT_CALL(*mock_email_, SendWelcomeEmail(_))
        .Times(1);

    // Act
    User result = service_->CreateUser(request);

    // Assert
    EXPECT_EQ(result.email, expected_user.email);
    EXPECT_EQ(result.name, expected_user.name);
    EXPECT_FALSE(result.id.empty());
}

TEST_F(UserServiceTest, CreateUser_DuplicateEmail_ThrowsException) {
    // Arrange
    CreateUserRequest request{"existing@example.com", "Test User"};
    User existing_user{"existing-id", "existing@example.com", "Existing", true};

    EXPECT_CALL(*mock_repo_, FindByEmail(request.email))
        .WillOnce(Return(existing_user));

    // 不应该调用 Save 和 SendWelcomeEmail
    EXPECT_CALL(*mock_repo_, Save(_)).Times(0);
    EXPECT_CALL(*mock_email_, SendWelcomeEmail(_)).Times(0);

    // Act & Assert
    EXPECT_THROW(service_->CreateUser(request), DuplicateEmailException);
}

TEST_F(UserServiceTest, CreateUser_EmptyEmail_ThrowsValidationException) {
    CreateUserRequest request{"", "Test User"};

    EXPECT_THROW(service_->CreateUser(request), ValidationException);
}

// ============================================================
// 示例 3: 查询测试
// ============================================================

TEST_F(UserServiceTest, FindById_ExistingUser_ReturnsUser) {
    // Arrange
    std::string user_id = "user-123";
    User expected_user = CreateTestUser(user_id, "test@example.com");

    EXPECT_CALL(*mock_repo_, FindById(user_id))
        .WillOnce(Return(expected_user));

    // Act
    auto result = service_->FindById(user_id);

    // Assert
    ASSERT_TRUE(result.has_value());
    EXPECT_EQ(result->id, user_id);
    EXPECT_EQ(result->email, "test@example.com");
}

TEST_F(UserServiceTest, FindById_NonExistingUser_ReturnsNullopt) {
    // Arrange
    EXPECT_CALL(*mock_repo_, FindById("non-existent"))
        .WillOnce(Return(std::nullopt));

    // Act
    auto result = service_->FindById("non-existent");

    // Assert
    EXPECT_FALSE(result.has_value());
}

TEST_F(UserServiceTest, GetAllUsers_ReturnsUserList) {
    // Arrange
    std::vector<User> expected_users = {
        CreateTestUser("1", "alice@example.com"),
        CreateTestUser("2", "bob@example.com"),
        CreateTestUser("3", "charlie@example.com"),
    };

    EXPECT_CALL(*mock_repo_, FindAll())
        .WillOnce(Return(expected_users));

    // Act
    auto result = service_->GetAllUsers();

    // Assert
    EXPECT_THAT(result, SizeIs(3));
    EXPECT_THAT(result, Contains(::testing::Field(&User::email, "alice@example.com")));
}

// ============================================================
// 示例 4: 参数化测试
// ============================================================

class EmailValidationTest : public ::testing::TestWithParam<std::tuple<std::string, bool>> {
protected:
    UserService* service_;

    void SetUp() override {
        auto mock_repo = std::make_unique<NiceMock<MockUserRepository>>();
        auto mock_email = std::make_unique<NiceMock<MockEmailService>>();
        service_ = new UserService(std::move(mock_repo), std::move(mock_email));
    }

    void TearDown() override {
        delete service_;
    }
};

TEST_P(EmailValidationTest, ValidatesEmailCorrectly) {
    auto [email, expected] = GetParam();

    bool result = service_->IsValidEmail(email);

    EXPECT_EQ(result, expected) << "Email: " << email;
}

INSTANTIATE_TEST_SUITE_P(
    EmailFormats,
    EmailValidationTest,
    ::testing::Values(
        std::make_tuple("valid@email.com", true),
        std::make_tuple("user.name@domain.org", true),
        std::make_tuple("user+tag@example.com", true),
        std::make_tuple("", false),
        std::make_tuple("invalid", false),
        std::make_tuple("@nodomain.com", false),
        std::make_tuple("noat.com", false)
    )
);

// ============================================================
// 示例 5: 异常测试
// ============================================================

TEST_F(UserServiceTest, CreateUser_RepositoryThrows_PropagatesException) {
    CreateUserRequest request{"test@example.com", "Test User"};

    EXPECT_CALL(*mock_repo_, FindByEmail(_))
        .WillOnce(Return(std::nullopt));

    EXPECT_CALL(*mock_repo_, Save(_))
        .WillOnce(Throw(std::runtime_error("Database connection failed")));

    EXPECT_THROW({
        try {
            service_->CreateUser(request);
        } catch (const std::runtime_error& e) {
            EXPECT_THAT(e.what(), HasSubstr("Database"));
            throw;
        }
    }, std::runtime_error);
}

// 验证不抛出异常
TEST_F(UserServiceTest, FindById_EmptyId_DoesNotThrow) {
    EXPECT_CALL(*mock_repo_, FindById(""))
        .WillOnce(Return(std::nullopt));

    EXPECT_NO_THROW({
        auto result = service_->FindById("");
        EXPECT_FALSE(result.has_value());
    });
}

// ============================================================
// 示例 6: Mock 高级用法
// ============================================================

TEST_F(UserServiceTest, CreateUser_CapturesArguments) {
    CreateUserRequest request{"test@example.com", "Test User"};
    User captured_user;

    EXPECT_CALL(*mock_repo_, FindByEmail(_))
        .WillOnce(Return(std::nullopt));

    // 使用 SaveArg 捕获参数
    EXPECT_CALL(*mock_repo_, Save(_))
        .WillOnce(DoAll(
            SaveArg<0>(&captured_user),
            Return(User{"id", "test@example.com", "Test User", true})
        ));

    service_->CreateUser(request);

    // 验证捕获的参数
    EXPECT_EQ(captured_user.email, "test@example.com");
    EXPECT_EQ(captured_user.name, "Test User");
}

TEST_F(UserServiceTest, CreateUser_VerifiesCallOrder) {
    CreateUserRequest request{"test@example.com", "Test User"};

    // 使用 InSequence 验证调用顺序
    {
        ::testing::InSequence seq;

        EXPECT_CALL(*mock_repo_, FindByEmail(_))
            .WillOnce(Return(std::nullopt));

        EXPECT_CALL(*mock_repo_, Save(_))
            .WillOnce(Return(User{"id", "test@example.com", "Test User", true}));

        EXPECT_CALL(*mock_email_, SendWelcomeEmail(_))
            .Times(1);
    }

    service_->CreateUser(request);
}

// 使用 Invoke 自定义行为
TEST_F(UserServiceTest, FindById_CustomBehavior) {
    int call_count = 0;

    EXPECT_CALL(*mock_repo_, FindById(_))
        .WillRepeatedly(Invoke([&call_count](const std::string& id) -> std::optional<User> {
            call_count++;
            if (call_count == 1) {
                return std::nullopt;  // 第一次返回空
            }
            return User{id, "test@example.com", "Test", true};
        }));

    auto result1 = service_->FindById("user-1");
    auto result2 = service_->FindById("user-1");

    EXPECT_FALSE(result1.has_value());
    EXPECT_TRUE(result2.has_value());
}

// ============================================================
// 示例 7: Matcher 高级用法
// ============================================================

TEST_F(UserServiceTest, GetAllUsers_UsesMatchers) {
    std::vector<User> users = {
        {"1", "alice@example.com", "Alice", true},
        {"2", "bob@example.com", "Bob", true},
        {"3", "charlie@example.com", "Charlie", false},
    };

    EXPECT_CALL(*mock_repo_, FindAll())
        .WillOnce(Return(users));

    auto result = service_->GetAllUsers();

    // 使用各种 Matcher
    EXPECT_THAT(result, SizeIs(3));
    EXPECT_THAT(result, Not(IsEmpty()));

    // 验证元素
    EXPECT_THAT(result, ElementsAre(
        ::testing::Field(&User::name, "Alice"),
        ::testing::Field(&User::name, "Bob"),
        ::testing::Field(&User::name, "Charlie")
    ));

    // 验证至少包含某个元素
    EXPECT_THAT(result, Contains(
        ::testing::AllOf(
            ::testing::Field(&User::email, "bob@example.com"),
            ::testing::Field(&User::is_active, true)
        )
    ));
}

// ============================================================
// 示例 8: 类型参数化测试 (Type-Parameterized Test)
// ============================================================

template <typename T>
class NumericValidatorTest : public ::testing::Test {
protected:
    bool IsPositive(T value) { return value > 0; }
};

using NumericTypes = ::testing::Types<int, long, float, double>;
TYPED_TEST_SUITE(NumericValidatorTest, NumericTypes);

TYPED_TEST(NumericValidatorTest, PositiveNumbersAreValid) {
    EXPECT_TRUE(this->IsPositive(static_cast<TypeParam>(1)));
    EXPECT_TRUE(this->IsPositive(static_cast<TypeParam>(100)));
}

TYPED_TEST(NumericValidatorTest, NonPositiveNumbersAreInvalid) {
    EXPECT_FALSE(this->IsPositive(static_cast<TypeParam>(0)));
    EXPECT_FALSE(this->IsPositive(static_cast<TypeParam>(-1)));
}

// ============================================================
// 示例 9: Death Test (测试程序终止)
// ============================================================

// 注意：Death Test 在某些环境下可能不可用
TEST_F(UserServiceTest, DISABLED_DeleteNullUser_Dies) {
    // 这个测试验证程序在某种条件下会终止
    // 使用 DISABLED_ 前缀默认禁用
    EXPECT_DEATH({
        service_->FindById(nullptr);  // 假设这会导致程序终止
    }, ".*");  // 匹配任何错误消息
}

// ============================================================
// main 函数
// ============================================================

int main(int argc, char** argv) {
    ::testing::InitGoogleTest(&argc, argv);
    return RUN_ALL_TESTS();
}
