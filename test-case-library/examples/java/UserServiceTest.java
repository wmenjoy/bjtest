/**
 * Java 测试示例 - AI 参考代码
 *
 * 本文件展示 JUnit 5 + Mockito + AssertJ 的最佳实践
 * AI 应该参考这些示例来生成符合规范的 Java 测试代码
 */
package com.example.service;

import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.*;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.*;
import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.*;

// ============================================================
// 示例 1: 基本测试结构
// ============================================================

@ExtendWith(MockitoExtension.class)
@DisplayName("UserService 测试")
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private EmailService emailService;

    @InjectMocks
    private UserService userService;

    // --------------------------------------------------------
    // 使用 @Nested 组织相关测试
    // --------------------------------------------------------

    @Nested
    @DisplayName("创建用户")
    class CreateUser {

        @Test
        @DisplayName("应该成功创建有效用户")
        void shouldCreateUserWithValidData() {
            // Given (Arrange)
            CreateUserRequest request = CreateUserRequest.builder()
                .email("test@example.com")
                .name("Test User")
                .build();

            User expectedUser = User.builder()
                .id(UUID.randomUUID())
                .email(request.getEmail())
                .name(request.getName())
                .build();

            when(userRepository.existsByEmail(request.getEmail()))
                .thenReturn(false);
            when(userRepository.save(any(User.class)))
                .thenReturn(expectedUser);

            // When (Act)
            User result = userService.createUser(request);

            // Then (Assert)
            assertThat(result)
                .isNotNull()
                .satisfies(user -> {
                    assertThat(user.getId()).isNotNull();
                    assertThat(user.getEmail()).isEqualTo("test@example.com");
                    assertThat(user.getName()).isEqualTo("Test User");
                });

            // 验证交互
            verify(userRepository).existsByEmail(request.getEmail());
            verify(userRepository).save(any(User.class));
            verify(emailService).sendWelcomeEmail(any(User.class));
        }

        @Test
        @DisplayName("应该拒绝重复邮箱")
        void shouldRejectDuplicateEmail() {
            // Given
            CreateUserRequest request = CreateUserRequest.builder()
                .email("existing@example.com")
                .name("Test User")
                .build();

            when(userRepository.existsByEmail(request.getEmail()))
                .thenReturn(true);

            // When & Then
            assertThatThrownBy(() -> userService.createUser(request))
                .isInstanceOf(DuplicateEmailException.class)
                .hasMessageContaining("existing@example.com");

            // 验证没有保存
            verify(userRepository, never()).save(any());
            verify(emailService, never()).sendWelcomeEmail(any());
        }

        @Test
        @DisplayName("应该拒绝空请求")
        void shouldRejectNullRequest() {
            assertThatThrownBy(() -> userService.createUser(null))
                .isInstanceOf(IllegalArgumentException.class);
        }
    }

    // ============================================================
    // 示例 2: 参数化测试
    // ============================================================

    @Nested
    @DisplayName("邮箱验证")
    class EmailValidation {

        @ParameterizedTest(name = "邮箱 \"{0}\" 应该 {1}")
        @DisplayName("验证各种邮箱格式")
        @CsvSource({
            "valid@email.com, 有效",
            "user.name@domain.org, 有效",
            "user+tag@example.com, 有效",
            "'', 无效",
            "invalid, 无效",
            "@nodomain.com, 无效",
            "noat.com, 无效"
        })
        void shouldValidateEmailFormat(String email, String expectedResult) {
            boolean isValid = userService.isValidEmail(email);

            if ("有效".equals(expectedResult)) {
                assertThat(isValid).isTrue();
            } else {
                assertThat(isValid).isFalse();
            }
        }

        @ParameterizedTest
        @DisplayName("应该拒绝无效邮箱并返回正确错误")
        @MethodSource("invalidEmailProvider")
        void shouldRejectInvalidEmails(String email, Class<? extends Exception> expectedException) {
            CreateUserRequest request = CreateUserRequest.builder()
                .email(email)
                .name("Test")
                .build();

            assertThatThrownBy(() -> userService.createUser(request))
                .isInstanceOf(expectedException);
        }

        static Stream<Arguments> invalidEmailProvider() {
            return Stream.of(
                Arguments.of("", ValidationException.class),
                Arguments.of("invalid", ValidationException.class),
                Arguments.of(null, IllegalArgumentException.class)
            );
        }
    }

    // ============================================================
    // 示例 3: 查询测试
    // ============================================================

    @Nested
    @DisplayName("查询用户")
    class FindUser {

        @Test
        @DisplayName("应该根据ID找到用户")
        void shouldFindUserById() {
            // Given
            UUID userId = UUID.randomUUID();
            User expectedUser = User.builder()
                .id(userId)
                .email("test@example.com")
                .name("Test User")
                .build();

            when(userRepository.findById(userId))
                .thenReturn(Optional.of(expectedUser));

            // When
            Optional<User> result = userService.findById(userId);

            // Then
            assertThat(result)
                .isPresent()
                .hasValueSatisfying(user -> {
                    assertThat(user.getId()).isEqualTo(userId);
                    assertThat(user.getEmail()).isEqualTo("test@example.com");
                });
        }

        @Test
        @DisplayName("应该返回空当用户不存在")
        void shouldReturnEmptyWhenUserNotFound() {
            // Given
            UUID userId = UUID.randomUUID();
            when(userRepository.findById(userId))
                .thenReturn(Optional.empty());

            // When
            Optional<User> result = userService.findById(userId);

            // Then
            assertThat(result).isEmpty();
        }

        @Test
        @DisplayName("应该支持分页查询")
        void shouldSupportPagination() {
            // Given
            List<User> users = List.of(
                User.builder().id(UUID.randomUUID()).name("User 1").build(),
                User.builder().id(UUID.randomUUID()).name("User 2").build()
            );
            Page<User> page = new PageImpl<>(users, PageRequest.of(0, 10), 50);

            when(userRepository.findAll(any(Pageable.class)))
                .thenReturn(page);

            // When
            Page<User> result = userService.findAll(PageRequest.of(0, 10));

            // Then
            assertThat(result.getContent()).hasSize(2);
            assertThat(result.getTotalElements()).isEqualTo(50);
            assertThat(result.getTotalPages()).isEqualTo(5);
        }
    }

    // ============================================================
    // 示例 4: 集合断言
    // ============================================================

    @Test
    @DisplayName("应该返回用户列表并验证内容")
    void shouldReturnUserListWithCorrectContent() {
        // Given
        List<User> expectedUsers = List.of(
            User.builder().id(UUID.randomUUID()).name("Alice").email("alice@example.com").build(),
            User.builder().id(UUID.randomUUID()).name("Bob").email("bob@example.com").build(),
            User.builder().id(UUID.randomUUID()).name("Charlie").email("charlie@example.com").build()
        );

        when(userRepository.findAll()).thenReturn(expectedUsers);

        // When
        List<User> result = userService.getAllUsers();

        // Then
        assertThat(result)
            .hasSize(3)
            .extracting(User::getName)
            .containsExactly("Alice", "Bob", "Charlie");

        assertThat(result)
            .extracting(User::getEmail)
            .allMatch(email -> email.endsWith("@example.com"));
    }

    // ============================================================
    // 示例 5: 异常测试的多种写法
    // ============================================================

    @Nested
    @DisplayName("异常处理")
    class ExceptionHandling {

        @Test
        @DisplayName("使用 assertThatThrownBy")
        void usingAssertThatThrownBy() {
            assertThatThrownBy(() -> userService.deleteUser(null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("User ID cannot be null");
        }

        @Test
        @DisplayName("使用 assertThatExceptionOfType")
        void usingAssertThatExceptionOfType() {
            assertThatExceptionOfType(UserNotFoundException.class)
                .isThrownBy(() -> userService.findByIdOrThrow(UUID.randomUUID()))
                .withMessageContaining("not found");
        }

        @Test
        @DisplayName("使用 catchThrowable 捕获并检查")
        void usingCatchThrowable() {
            Throwable thrown = catchThrowable(() -> userService.createUser(null));

            assertThat(thrown)
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("null");
        }

        @Test
        @DisplayName("验证不抛出异常")
        void shouldNotThrowException() {
            CreateUserRequest validRequest = CreateUserRequest.builder()
                .email("valid@example.com")
                .name("Valid User")
                .build();

            when(userRepository.existsByEmail(anyString())).thenReturn(false);
            when(userRepository.save(any())).thenReturn(User.builder().build());

            assertThatNoException()
                .isThrownBy(() -> userService.createUser(validRequest));
        }
    }

    // ============================================================
    // 示例 6: Mock 高级用法
    // ============================================================

    @Nested
    @DisplayName("Mock 高级用法")
    class AdvancedMocking {

        @Test
        @DisplayName("使用 ArgumentCaptor 捕获参数")
        void shouldCaptureArguments() {
            // Given
            CreateUserRequest request = CreateUserRequest.builder()
                .email("test@example.com")
                .name("Test User")
                .build();

            ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
            when(userRepository.existsByEmail(anyString())).thenReturn(false);
            when(userRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            // When
            userService.createUser(request);

            // Then
            verify(userRepository).save(userCaptor.capture());
            User savedUser = userCaptor.getValue();
            assertThat(savedUser.getEmail()).isEqualTo("test@example.com");
            assertThat(savedUser.getName()).isEqualTo("Test User");
        }

        @Test
        @DisplayName("验证调用顺序")
        void shouldVerifyCallOrder() {
            // Given
            CreateUserRequest request = CreateUserRequest.builder()
                .email("test@example.com")
                .name("Test User")
                .build();

            when(userRepository.existsByEmail(anyString())).thenReturn(false);
            when(userRepository.save(any())).thenReturn(User.builder().build());

            // When
            userService.createUser(request);

            // Then - 验证调用顺序
            InOrder inOrder = inOrder(userRepository, emailService);
            inOrder.verify(userRepository).existsByEmail(anyString());
            inOrder.verify(userRepository).save(any());
            inOrder.verify(emailService).sendWelcomeEmail(any());
        }

        @Test
        @DisplayName("模拟异常")
        void shouldHandleRepositoryException() {
            // Given
            CreateUserRequest request = CreateUserRequest.builder()
                .email("test@example.com")
                .name("Test User")
                .build();

            when(userRepository.existsByEmail(anyString())).thenReturn(false);
            when(userRepository.save(any()))
                .thenThrow(new RuntimeException("Database connection failed"));

            // When & Then
            assertThatThrownBy(() -> userService.createUser(request))
                .isInstanceOf(ServiceException.class)
                .hasCauseInstanceOf(RuntimeException.class)
                .hasMessageContaining("Failed to create user");
        }
    }

    // ============================================================
    // 示例 7: 生命周期方法
    // ============================================================

    @BeforeAll
    static void setUpClass() {
        // 所有测试前执行一次
        System.out.println("Starting UserService tests...");
    }

    @AfterAll
    static void tearDownClass() {
        // 所有测试后执行一次
        System.out.println("UserService tests completed.");
    }

    @BeforeEach
    void setUp() {
        // 每个测试前执行
        // MockitoExtension 会自动初始化 @Mock 和 @InjectMocks
    }

    @AfterEach
    void tearDown() {
        // 每个测试后执行
        // 可以用于清理资源
    }
}

// ============================================================
// 辅助类定义（实际项目中应该在单独文件）
// ============================================================

// 这些类仅用于示例编译，实际项目中应该导入真实类
class User {
    private UUID id;
    private String email;
    private String name;
    // ... builder, getters, setters
}

class CreateUserRequest {
    private String email;
    private String name;
    // ... builder, getters, setters
}

interface UserRepository {
    Optional<User> findById(UUID id);
    User save(User user);
    boolean existsByEmail(String email);
    List<User> findAll();
    Page<User> findAll(Pageable pageable);
}

interface EmailService {
    void sendWelcomeEmail(User user);
}

class UserService {
    // ... 实现
}

class DuplicateEmailException extends RuntimeException {}
class UserNotFoundException extends RuntimeException {}
class ValidationException extends RuntimeException {}
class ServiceException extends RuntimeException {}
