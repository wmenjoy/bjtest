# 代码命名规范

**版本**: 1.0
**最后更新**: 2025-11-27
**适用对象**: 全栈开发者
**难度**: 初级

---

## 概述

本文档定义了项目中所有代码的命名规范，确保代码风格统一、可读性强、易于维护。

### 命名原则

1. **清晰性**：名称应清楚表达意图
2. **一致性**：相同类型使用相同风格
3. **简洁性**：避免过长或过度缩写
4. **可搜索性**：便于全局搜索和替换

---

## Go代码命名规范

### 文件命名

**规则**: 全小写，用下划线分隔

```
✅ 推荐：
test_case.go
test_case_handler.go
test_case_repository.go
websocket_client.go

❌ 不推荐：
TestCase.go          # 大写开头
testCase.go          # 驼峰
test-case.go         # 连字符
```

**目录结构**:
```
internal/
├── handler/
│   ├── test_case_handler.go
│   └── workflow_handler.go
├── service/
│   ├── test_case_service.go
│   └── workflow_service.go
└── repository/
    ├── test_case_repository.go
    └── workflow_repository.go
```

### 包命名

**规则**: 全小写，单数形式，简短

```go
✅ 推荐：
package handler
package service
package repository
package testcase
package workflow

❌ 不推荐：
package handlers      // 复数
package TestCase      // 大写
package test_case     // 下划线
```

### 接口命名

**规则**: 名词 + 后缀，或动词 + er

```go
✅ 推荐：
type TestCaseRepository interface {}
type WorkflowExecutor interface {}
type Logger interface {}
type Reader interface {}
type Writer interface {}

❌ 不推荐：
type ITestCase interface {}        // I前缀（C#风格）
type TestCaseRepositoryInterface {} // 后缀Interface冗余
type TestCaseRepo interface {}     // 过度缩写
```

**接口方法命名**:
```go
type TestCaseRepository interface {
	Create(ctx context.Context, testCase *models.TestCase) error
	GetByID(ctx context.Context, id uint) (*models.TestCase, error)
	Update(ctx context.Context, testCase *models.TestCase) error
	Delete(ctx context.Context, id uint) error
	List(ctx context.Context, filter *Filter) ([]*models.TestCase, error)
}
```

### 结构体命名

**规则**: 驼峰命名，首字母大写表示导出

```go
✅ 推荐：
type TestCase struct {}           // 导出
type testCaseHandler struct {}    // 私有
type HTTPConfig struct {}         // 缩写全大写
type WebSocketClient struct {}    // 驼峰

❌ 不推荐：
type test_case struct {}          // 下划线
type Testcase struct {}           // 全小写
type Test_Case struct {}          // 混合风格
```

**实现结构体命名**:
```go
// 接口
type TestCaseService interface {}

// 实现（私有，加Impl后缀）
type testCaseServiceImpl struct {
	repo repository.TestCaseRepository
}

// 构造函数
func NewTestCaseService(...) TestCaseService {
	return &testCaseServiceImpl{...}
}
```

### 函数和方法命名

**规则**: 驼峰命名，动词开头，首字母大写表示导出

```go
✅ 推荐：
func CreateTestCase() {}          // 创建
func GetTestByID() {}             // 获取
func UpdateTestCase() {}          // 更新
func DeleteTestCase() {}          // 删除
func IsTestEnabled() {}           // 判断
func HasPermission() {}           // 判断
func CalculateScore() {}          // 计算
func ValidateInput() {}           // 验证

❌ 不推荐：
func create_test_case() {}        // 下划线
func testcase_create() {}         // 名词在前
func GetTest() {}                 // 不够具体
func get() {}                     // 太通用
```

**常见动词**:
| 动词 | 用途 | 示例 |
|-----|------|------|
| `Create` | 创建 | `CreateTestCase` |
| `Get` | 获取单个 | `GetTestByID` |
| `List` | 获取列表 | `ListTestCases` |
| `Update` | 更新 | `UpdateTestCase` |
| `Delete` | 删除 | `DeleteTestCase` |
| `Execute` | 执行 | `ExecuteTestCase` |
| `Validate` | 验证 | `ValidateInput` |
| `Calculate` | 计算 | `CalculateScore` |
| `Is` / `Has` / `Can` | 判断 | `IsActive`, `HasPermission`, `CanExecute` |

### 变量命名

**规则**: 驼峰命名，首字母小写表示私有

```go
✅ 推荐：
var testCase *models.TestCase
var testID string
var maxRetryCount int
var httpClient *http.Client
var ctx context.Context

❌ 不推荐：
var test_case *models.TestCase    // 下划线
var TestCase *models.TestCase     // 大写（除非导出）
var tc *models.TestCase           // 过度缩写
var test *models.TestCase         // 不够具体
```

**缩写规则**:
- 常见缩写全大写：`HTTP`, `URL`, `ID`, `API`, `JSON`, `XML`
- 驼峰中缩写仅首字母大写：`httpClient`, `userID`, `apiKey`

```go
✅ 推荐：
type HTTPConfig struct {
	URL        string
	APIKey     string
	UserID     string
}

var httpConfig *HTTPConfig
var apiURL string

❌ 不推荐：
var HTTPConfig *HTTPConfig        // 变量名全大写
var ApiUrl string                 // 驼峰中缩写首字母小写
```

### 常量命名

**规则**: 驼峰命名，全局常量首字母大写

```go
✅ 推荐：
const (
	MaxRetryCount       = 3
	DefaultTimeout      = 30
	StatusActive        = "active"
	StatusInactive      = "inactive"
	PriorityP0          = "P0"
)

// 私有常量
const (
	maxBufferSize       = 1024
	defaultConcurrency  = 10
)

❌ 不推荐：
const MAX_RETRY_COUNT = 3         // 全大写下划线（C风格）
const maxretrycount = 3           // 全小写
const max_retry_count = 3         // 下划线
```

**枚举类型常量**:
```go
type Status string

const (
	StatusPending   Status = "pending"
	StatusRunning   Status = "running"
	StatusCompleted Status = "completed"
	StatusFailed    Status = "failed"
)
```

### 错误变量命名

**规则**: `Err` 前缀，驼峰命名

```go
✅ 推荐：
var (
	ErrNotFound          = errors.New("not found")
	ErrInvalidInput      = errors.New("invalid input")
	ErrUnauthorized      = errors.New("unauthorized")
	ErrTestCaseNotFound  = errors.New("test case not found")
)

❌ 不推荐：
var NotFoundError = errors.New("not found")      // 后缀
var ERROR_NOT_FOUND = errors.New("not found")    // 全大写
var errNotFound = errors.New("not found")        // 小写（应导出）
```

---

## React/TypeScript命名规范

### 组件文件命名

**规则**: PascalCase（大驼峰），与组件名一致

```
✅ 推荐：
TestCaseManager.tsx
WorkflowBuilder.tsx
DashboardView.tsx
UserProfile.tsx

❌ 不推荐：
testCaseManager.tsx     # 小写开头
test-case-manager.tsx   # 连字符
TestCase_Manager.tsx    # 下划线
```

### 组件命名

**规则**: PascalCase，名词 + 功能后缀

```typescript
✅ 推荐：
export function TestCaseManager() {}
export function WorkflowBuilder() {}
export function UserList() {}
export function LoginForm() {}
export default function Dashboard() {}

❌ 不推荐：
export function testCaseManager() {}    // 小写开头
export function TestCase() {}           // 太通用
export function Manager() {}            // 缺少上下文
```

**常见后缀**:
| 后缀 | 用途 | 示例 |
|-----|------|------|
| `Manager` | 管理界面 | `TestCaseManager` |
| `Builder` | 构建器 | `WorkflowBuilder` |
| `Editor` | 编辑器 | `CodeEditor` |
| `Viewer` | 查看器 | `LogViewer` |
| `List` | 列表 | `UserList` |
| `Form` | 表单 | `LoginForm` |
| `Dialog` / `Modal` | 对话框 | `ConfirmDialog` |
| `Card` | 卡片 | `TestCaseCard` |
| `Button` | 按钮 | `SubmitButton` |

### Hook命名

**规则**: `use` 前缀 + 驼峰

```typescript
✅ 推荐：
function useTestCases() {}
function useWorkflowExecution() {}
function useAuth() {}
function useLocalStorage() {}
function usePrevious() {}

❌ 不推荐：
function getTestCases() {}      // 不是hook，不用use
function UseTestCases() {}      // 大写开头
function use_test_cases() {}    // 下划线
```

### Props类型命名

**规则**: 组件名 + `Props` 后缀

```typescript
✅ 推荐：
interface TestCaseManagerProps {
	testId: string;
	onSave: () => void;
}

export function TestCaseManager(props: TestCaseManagerProps) {}

❌ 不推荐：
interface Props {}                      // 太通用
interface TestCaseManagerProperties {}  // 冗长
interface ITestCaseManagerProps {}      // I前缀
```

### 事件处理函数命名

**规则**: `handle` + 动作 或 `on` + 动作

```typescript
✅ 推荐：
// 组件内部
function handleSubmit() {}
function handleClick() {}
function handleChange() {}

// Props传递
interface Props {
	onSubmit: () => void;
	onClick: () => void;
	onChange: (value: string) => void;
}

❌ 不推荐：
function submit() {}              // 缺少handle
function clickHandler() {}        // 后缀Handler
function on_click() {}            // 下划线
```

### 状态变量命名

**规则**: 清晰的名词，避免缩写

```typescript
✅ 推荐：
const [isLoading, setIsLoading] = useState(false);
const [testCases, setTestCases] = useState([]);
const [selectedId, setSelectedId] = useState<string | null>(null);
const [error, setError] = useState<Error | null>(null);

❌ 不推荐：
const [loading, setLoading] = useState(false);  // 不够明确
const [data, setData] = useState([]);           // 太通用
const [tc, setTc] = useState([]);               // 过度缩写
```

---

## 数据库命名规范

### 表名

**规则**: 全小写，下划线分隔，复数形式

```sql
✅ 推荐：
test_cases
test_groups
test_results
workflow_runs
workflow_step_executions

❌ 不推荐：
TestCases          -- 大写
test_case          -- 单数
testCases          -- 驼峰
test-cases         -- 连字符
```

### 列名

**规则**: 全小写，下划线分隔

```sql
✅ 推荐：
test_id
created_at
updated_at
deleted_at
http_config
user_id

❌ 不推荐：
testId             -- 驼峰
TestID             -- 大写
test-id            -- 连字符
```

**特殊列**:
```sql
-- 主键
id                 -- 自增主键

-- 外键
user_id            -- 关联users表
test_id            -- 关联test_cases表

-- 时间戳
created_at         -- 创建时间
updated_at         -- 更新时间
deleted_at         -- 软删除时间

-- 租户隔离
tenant_id          -- 租户ID
project_id         -- 项目ID
```

### 索引命名

**规则**: `idx_` + 表名 + `_` + 列名

```sql
✅ 推荐：
idx_test_cases_test_id
idx_test_cases_group_id
idx_test_cases_tenant_id_project_id
idx_workflow_runs_status

❌ 不推荐：
test_id_index
index_test_id
idx_test_id       -- 缺少表名
```

---

## API命名规范

### RESTful端点

**规则**: 小写，连字符分隔，复数资源名

```
✅ 推荐：
GET    /api/v2/test-cases
GET    /api/v2/test-cases/:id
POST   /api/v2/test-cases
PUT    /api/v2/test-cases/:id
DELETE /api/v2/test-cases/:id
POST   /api/v2/test-cases/:id/execute

GET    /api/v2/workflows
POST   /api/v2/workflows/:workflowId/execute

❌ 不推荐：
GET /api/testCases              -- 驼峰
GET /api/test_cases             -- 下划线
GET /api/TestCases              -- 大写
GET /api/testcase               -- 单数（集合）
```

### 查询参数

**规则**: 驼峰命名

```
✅ 推荐：
GET /api/v2/test-cases?page=1&pageSize=20
GET /api/v2/test-cases?groupId=xxx&status=active
GET /api/v2/test-cases?sortBy=createdAt&order=desc

❌ 不推荐：
GET /api/v2/test-cases?page_size=20    -- 下划线
GET /api/v2/test-cases?PageSize=20     -- 大写
```

### JSON字段

**规则**: 驼峰命名

```json
✅ 推荐：
{
  "testId": "test-001",
  "name": "测试用例",
  "createdAt": "2025-11-27T10:00:00Z",
  "httpConfig": {
    "method": "GET",
    "url": "/api/test"
  }
}

❌ 不推荐：
{
  "test_id": "test-001",        // 下划线
  "TestId": "test-001",         // 大写
  "HTTP_Config": {}             // 大写+下划线
}
```

---

## 测试用例命名规范

### 测试ID命名

**规则**: 小写，连字符分隔，`{模块}-{操作}-{序号}`

```
✅ 推荐：
login-success-001
user-create-002
order-query-003
workflow-execution-001

❌ 不推荐：
test1                   -- 不够描述性
LoginSuccess            -- 大写
login_success           -- 下划线
login-success           -- 缺少序号
```

### 测试名称

**规则**: "测试" + 动词 + 名词 + [条件]

```
✅ 推荐：
测试用户登录成功
测试创建订单失败（余额不足）
测试查询用户列表（分页）
测试Workflow执行（并行步骤）

❌ 不推荐：
登录测试               -- 缺少"测试"前缀
test1                  -- 英文+数字
用户测试用例           -- 不够具体
```

### Go测试函数命名

**规则**: `Test` + 功能 + `_` + 场景

```go
✅ 推荐：
func TestCreateTestCase_Success(t *testing.T) {}
func TestCreateTestCase_DuplicateID(t *testing.T) {}
func TestExecuteWorkflow_ParallelSteps(t *testing.T) {}
func TestRepository_GetByID_NotFound(t *testing.T) {}

❌ 不推荐：
func TestCreate(t *testing.T) {}              -- 不够具体
func Test_CreateTestCase(t *testing.T) {}     -- 开头下划线
func testCreateTestCase(t *testing.T) {}      -- 小写开头
```

---

## 配置文件命名

### 文件名

**规则**: 小写，连字符分隔

```
✅ 推荐：
config.toml
database.yml
docker-compose.yml
.env.local
.env.production

❌ 不推荐：
Config.toml           -- 大写
config_toml           -- 下划线（扩展名外）
```

### 环境变量

**规则**: 全大写，下划线分隔

```bash
✅ 推荐：
DATABASE_URL=xxx
API_KEY=xxx
MAX_CONNECTIONS=100
REDIS_HOST=localhost

❌ 不推荐：
databaseUrl=xxx       -- 小写
database-url=xxx      -- 连字符
Database_Url=xxx      -- 混合大小写
```

---

## 文档命名规范

### Markdown文件

**规则**: 小写，连字符分隔

```
✅ 推荐：
README.md
test-case-format.md
backend-layered-design.md
naming-conventions.md

❌ 不推荐：
TestCaseFormat.md        -- 大写
test_case_format.md      -- 下划线
testCaseFormat.md        -- 驼峰
```

### 文档标题

**规则**: 标题首字母大写，主要单词大写

```markdown
✅ 推荐：
# 后端三层架构设计
# 测试用例格式规范
# API Documentation

❌ 不推荐：
# 后端三层架构设计文档       -- 冗余"文档"
# backend layered design     -- 全小写
# BACKEND LAYERED DESIGN     -- 全大写
```

---

## 最佳实践

### 1. 保持一致性

同一项目中使用统一的命名风格：

```go
// ✅ 一致：都用完整单词
CreateTestCase()
UpdateTestCase()
DeleteTestCase()

// ❌ 不一致：混合完整和缩写
CreateTestCase()
UpdateTC()
DelTest()
```

### 2. 避免魔法数字和字符串

使用常量代替：

```go
// ❌ 魔法字符串
if status == "active" {}

// ✅ 使用常量
const StatusActive = "active"
if status == StatusActive {}
```

### 3. 上下文明确性

在嵌套结构中保持名称明确：

```go
// ❌ 上下文不明确
type Config struct {
	Config HTTPConfig  // 重复
}

// ✅ 上下文明确
type TestCase struct {
	HTTPConfig  HTTPConfig
	CommandConfig CommandConfig
}
```

### 4. 遵循语言惯例

Go和TypeScript有不同的惯例：

```go
// Go: 首字母大写表示导出
type TestCase struct {}
func NewTestCase() {}

// TypeScript: export关键字
export interface TestCase {}
export function createTestCase() {}
```

---

## 命名检查清单

创建新代码时，使用此清单检查命名：

- [ ] **文件名**：遵循语言规范（Go下划线，TS大驼峰）
- [ ] **类型名**：清晰描述类型用途
- [ ] **函数名**：动词开头，描述动作
- [ ] **变量名**：名词，避免缩写
- [ ] **常量名**：大写或驼峰（根据语言）
- [ ] **接口名**：无I前缀，有描述性后缀
- [ ] **测试名**：清晰描述测试场景
- [ ] **API端点**：RESTful规范
- [ ] **数据库字段**：小写下划线
- [ ] **一致性**：与现有代码保持一致

---

## 相关文档

- [后端分层架构设计](../../1-specs/architecture/backend-layered-design.md) - 架构规范
- [代码文档化指南](./code-documentation-guide.md) - 文档编写指南
- [系统架构概览](../../1-specs/architecture/overview.md) - 整体架构

---

**审核历史**:
- 2025-11-27: 初始版本 - 开发团队

**维护计划**:
- 代码审查时检查遵循情况
- 每季度审查并更新规范
- 新人入职必读文档
