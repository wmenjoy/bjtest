# 测试数据生成器 - AI 参考知识

> AI 生成测试数据时的参考模式和最佳实践

## 1. 数据生成原则

```
核心原则:
1. 可重复性 - 使用固定种子保证测试可重复
2. 边界覆盖 - 自动包含边界值
3. 类型安全 - 生成的数据符合类型约束
4. 真实性 - 数据看起来像真实数据
```

## 2. 基础数据生成模式

### 2.1 字符串生成

| 场景 | Go | Java | TypeScript |
|------|-----|------|-----------|
| 随机字符串 | `uuid.New().String()` | `UUID.randomUUID().toString()` | `crypto.randomUUID()` |
| 固定长度 | `strings.Repeat("a", n)` | `"a".repeat(n)` | `'a'.repeat(n)` |
| 邮箱 | `fmt.Sprintf("test%d@example.com", i)` | `"test" + i + "@example.com"` | `` `test${i}@example.com` `` |
| 手机号 | `fmt.Sprintf("138%08d", i)` | `String.format("138%08d", i)` | `` `138${String(i).padStart(8,'0')}` `` |

### 2.2 数值生成

```go
// Go - 边界值生成器
func IntBoundaries() []int {
    return []int{
        0,              // 零值
        -1,             // 负边界
        1,              // 正边界
        math.MaxInt32,  // 最大值
        math.MinInt32,  // 最小值
    }
}
```

```java
// Java - 边界值生成器
public static Stream<Integer> intBoundaries() {
    return Stream.of(0, -1, 1, Integer.MAX_VALUE, Integer.MIN_VALUE);
}
```

```typescript
// TypeScript - 边界值生成器
const intBoundaries = () => [
    0,                      // 零值
    -1,                     // 负边界
    1,                      // 正边界
    Number.MAX_SAFE_INTEGER,// 最大安全整数
    Number.MIN_SAFE_INTEGER // 最小安全整数
];
```

### 2.3 时间数据生成

```go
// Go - 时间测试数据
func TimeTestData() []time.Time {
    now := time.Now()
    return []time.Time{
        now,                           // 当前时间
        time.Time{},                   // 零值
        now.Add(-24 * time.Hour),      // 昨天
        now.Add(24 * time.Hour),       // 明天
        time.Date(2000, 1, 1, 0, 0, 0, 0, time.UTC), // Y2K
        time.Date(2038, 1, 19, 3, 14, 7, 0, time.UTC), // Unix 2038
    }
}
```

```java
// Java - 时间测试数据
public static Stream<LocalDateTime> timeTestData() {
    LocalDateTime now = LocalDateTime.now();
    return Stream.of(
        now,                                    // 当前时间
        LocalDateTime.MIN,                      // 最小值
        LocalDateTime.MAX,                      // 最大值
        now.minusDays(1),                       // 昨天
        now.plusDays(1),                        // 明天
        LocalDateTime.of(2000, 1, 1, 0, 0)     // Y2K
    );
}
```

## 3. 实体数据生成器

### 3.1 用户实体

```go
// Go - 用户测试数据工厂
type UserFactory struct {
    counter int64
}

func (f *UserFactory) Build() *User {
    f.counter++
    return &User{
        ID:        fmt.Sprintf("user-%d", f.counter),
        Name:      fmt.Sprintf("Test User %d", f.counter),
        Email:     fmt.Sprintf("user%d@test.com", f.counter),
        CreatedAt: time.Now(),
        Status:    "active",
    }
}

func (f *UserFactory) BuildAdmin() *User {
    user := f.Build()
    user.Role = "admin"
    return user
}

func (f *UserFactory) BuildInactive() *User {
    user := f.Build()
    user.Status = "inactive"
    return user
}

func (f *UserFactory) BuildBatch(n int) []*User {
    users := make([]*User, n)
    for i := 0; i < n; i++ {
        users[i] = f.Build()
    }
    return users
}
```

```java
// Java - 用户测试数据工厂
public class UserFactory {
    private final AtomicLong counter = new AtomicLong();

    public User build() {
        long id = counter.incrementAndGet();
        return User.builder()
            .id("user-" + id)
            .name("Test User " + id)
            .email("user" + id + "@test.com")
            .createdAt(LocalDateTime.now())
            .status("active")
            .build();
    }

    public User buildAdmin() {
        return build().toBuilder()
            .role("admin")
            .build();
    }

    public User buildInactive() {
        return build().toBuilder()
            .status("inactive")
            .build();
    }

    public List<User> buildBatch(int count) {
        return IntStream.range(0, count)
            .mapToObj(i -> build())
            .collect(Collectors.toList());
    }
}
```

```typescript
// TypeScript - 用户测试数据工厂
class UserFactory {
    private counter = 0;

    build(): User {
        this.counter++;
        return {
            id: `user-${this.counter}`,
            name: `Test User ${this.counter}`,
            email: `user${this.counter}@test.com`,
            createdAt: new Date(),
            status: 'active'
        };
    }

    buildAdmin(): User {
        return { ...this.build(), role: 'admin' };
    }

    buildInactive(): User {
        return { ...this.build(), status: 'inactive' };
    }

    buildBatch(count: number): User[] {
        return Array.from({ length: count }, () => this.build());
    }
}
```

### 3.2 通用工厂模式

```go
// Go - 通用测试数据构建器
type Builder[T any] struct {
    obj T
}

func NewBuilder[T any](base T) *Builder[T] {
    return &Builder[T]{obj: base}
}

func (b *Builder[T]) With(modifier func(*T)) *Builder[T] {
    modifier(&b.obj)
    return b
}

func (b *Builder[T]) Build() T {
    return b.obj
}

// 使用示例
user := NewBuilder(User{Status: "active"}).
    With(func(u *User) { u.Name = "Admin" }).
    With(func(u *User) { u.Role = "admin" }).
    Build()
```

## 4. HTTP 请求测试数据

### 4.1 请求体生成

```go
// Go - HTTP 请求测试数据
func ValidCreateUserRequest() *CreateUserRequest {
    return &CreateUserRequest{
        Name:     "Valid User",
        Email:    "valid@example.com",
        Password: "SecurePass123!",
    }
}

func InvalidCreateUserRequests() []struct {
    Name    string
    Request *CreateUserRequest
    Error   string
} {
    return []struct {
        Name    string
        Request *CreateUserRequest
        Error   string
    }{
        {
            Name:    "empty name",
            Request: &CreateUserRequest{Name: "", Email: "a@b.com", Password: "pass"},
            Error:   "name is required",
        },
        {
            Name:    "invalid email",
            Request: &CreateUserRequest{Name: "User", Email: "invalid", Password: "pass"},
            Error:   "invalid email format",
        },
        {
            Name:    "short password",
            Request: &CreateUserRequest{Name: "User", Email: "a@b.com", Password: "123"},
            Error:   "password too short",
        },
    }
}
```

### 4.2 响应数据生成

```go
// Go - Mock 响应数据
func MockUserResponse(id string) *UserResponse {
    return &UserResponse{
        ID:        id,
        Name:      "Mock User",
        Email:     "mock@example.com",
        CreatedAt: time.Now().Format(time.RFC3339),
    }
}

func MockErrorResponse(code int, message string) *ErrorResponse {
    return &ErrorResponse{
        Code:    code,
        Message: message,
        Details: nil,
    }
}
```

## 5. 边界值矩阵

### 5.1 字符串边界

| 场景 | 测试值 | 预期行为 |
|------|--------|----------|
| 空字符串 | `""` | 拒绝或使用默认值 |
| 只有空格 | `"   "` | 拒绝或 trim |
| 单字符 | `"a"` | 接受 |
| 最大长度 | `strings.Repeat("a", MAX)` | 接受 |
| 超过最大 | `strings.Repeat("a", MAX+1)` | 拒绝 |
| Unicode | `"中文测试"` | 正确处理 |
| 特殊字符 | `"<script>"` | 转义/拒绝 |
| SQL 注入 | `"'; DROP TABLE--"` | 转义/拒绝 |

### 5.2 数值边界

| 场景 | int32 | int64 | float64 |
|------|-------|-------|---------|
| 零值 | `0` | `0` | `0.0` |
| 最小 | `-2147483648` | `-9223372036854775808` | `-1.7976931348623157e+308` |
| 最大 | `2147483647` | `9223372036854775807` | `1.7976931348623157e+308` |
| 负一 | `-1` | `-1` | `-1.0` |
| 正一 | `1` | `1` | `1.0` |
| NaN | N/A | N/A | `math.NaN()` |
| Inf | N/A | N/A | `math.Inf(1)` |

### 5.3 集合边界

| 场景 | Go | Java | TypeScript |
|------|-----|------|-----------|
| 空集合 | `[]T{}` | `List.of()` | `[]` |
| 单元素 | `[]T{item}` | `List.of(item)` | `[item]` |
| 多元素 | `[]T{a, b, c}` | `List.of(a, b, c)` | `[a, b, c]` |
| nil/null | `nil` | `null` | `null` |
| 大量元素 | `make([]T, 10000)` | `new ArrayList<>(10000)` | `Array(10000).fill(0)` |

## 6. 场景化测试数据

### 6.1 认证场景

```go
// 认证测试数据
var AuthTestData = struct {
    ValidToken   string
    ExpiredToken string
    InvalidToken string
    AdminToken   string
}{
    ValidToken:   "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwiZXhwIjoxOTk5OTk5OTk5fQ.xxx",
    ExpiredToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwiZXhwIjoxMDAwMDAwMDAwfQ.xxx",
    InvalidToken: "invalid-token-format",
    AdminToken:   "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwicm9sZSI6ImFkbWluIn0.xxx",
}
```

### 6.2 分页场景

```go
// 分页测试数据
func PaginationTestCases() []struct {
    Name     string
    Page     int
    PageSize int
    Total    int
    Expected int // 预期返回数量
} {
    return []struct {
        Name     string
        Page     int
        PageSize int
        Total    int
        Expected int
    }{
        {"first page", 1, 10, 100, 10},
        {"last page partial", 10, 10, 95, 5},
        {"empty result", 1, 10, 0, 0},
        {"page beyond total", 100, 10, 50, 0},
        {"page size larger than total", 1, 100, 50, 50},
        {"page zero", 0, 10, 100, 10}, // 应转为第1页
        {"negative page", -1, 10, 100, 10}, // 应转为第1页
        {"zero page size", 1, 0, 100, 20}, // 应使用默认值
    }
}
```

## 7. Fixture 文件模式

### 7.1 JSON Fixture

```
testdata/
├── users/
│   ├── valid_user.json
│   ├── admin_user.json
│   └── users_list.json
├── requests/
│   ├── create_user_valid.json
│   └── create_user_invalid.json
└── responses/
    ├── success.json
    └── error_404.json
```

### 7.2 加载 Fixture

```go
// Go - Fixture 加载器
func LoadFixture[T any](filename string) T {
    data, err := os.ReadFile(filepath.Join("testdata", filename))
    if err != nil {
        panic(fmt.Sprintf("failed to load fixture %s: %v", filename, err))
    }
    var result T
    if err := json.Unmarshal(data, &result); err != nil {
        panic(fmt.Sprintf("failed to parse fixture %s: %v", filename, err))
    }
    return result
}

// 使用
user := LoadFixture[User]("users/valid_user.json")
```

```java
// Java - Fixture 加载器
public class FixtureLoader {
    private static final ObjectMapper mapper = new ObjectMapper();

    public static <T> T load(String filename, Class<T> type) {
        try (InputStream is = FixtureLoader.class.getResourceAsStream("/testdata/" + filename)) {
            return mapper.readValue(is, type);
        } catch (IOException e) {
            throw new RuntimeException("Failed to load fixture: " + filename, e);
        }
    }
}

// 使用
User user = FixtureLoader.load("users/valid_user.json", User.class);
```

## 8. 数据生成最佳实践

```
DO:
✓ 使用工厂模式创建测试对象
✓ 提供有意义的默认值
✓ 支持链式修改
✓ 自动递增 ID 避免冲突
✓ 包含所有边界值场景
✓ 将 fixture 文件纳入版本控制

DON'T:
✗ 在测试中硬编码大量数据
✗ 使用真实的敏感数据
✗ 依赖外部服务生成数据
✗ 忘记 nil/null 场景
✗ 忽略 Unicode 和特殊字符
```
