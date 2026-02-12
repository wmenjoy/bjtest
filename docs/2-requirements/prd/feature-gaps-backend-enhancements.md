# 测试管理平台 - 功能增强与后端完善PRD

**文档类型**: PRD (Product Requirements Document)
**版本**: 1.0
**创建日期**: 2025-11-27
**产品负责人**: 测试平台团队
**技术负责人**: 后端架构组
**目标发布**: 2025-Q2至2026-Q1 (12个月)
**状态**: Draft → Review → Approved

---

## 📋 文档目录

1. [概述](#概述)
2. [功能差距分析](#功能差距分析)
3. [后端模型改进](#后端模型改进)
4. [API扩展需求](#api扩展需求)
5. [功能实现优先级](#功能实现优先级)
6. [技术架构](#技术架构)
7. [12个月路线图](#12个月路线图)
8. [成功指标](#成功指标)
9. [风险与应对](#风险与应对)

---

## 概述

### 背景分析

经过对前端实现与后端支持的全面分析，测试管理平台已具备坚实的架构基础。后端实现了完整的多租户、工作流引擎、动作模板等核心功能，与前端mock数据高度匹配。然而，为实现**企业级测试平台**的愿景，仍需完善以下关键能力：

### 当前状态

**已实现功能** (✅):
- ✅ 多租户支持 (Tenant + Project隔离)
- ✅ 完整的工作流引擎 (DAG、循环、分支、并行)
- ✅ 动作模板系统 (4级作用域)
- ✅ 环境变量管理
- ✅ WebSocket实时执行
- ✅ 测试用例评分与不稳定检测
- ✅ 数据映射 (DataMapper)

**待增强功能** (🔄):
- 🔄 AI智能测试生成 (AICenter)
- 🔄 高级基础设施测试 (Redis、Kafka、ES)
- 🔄 浏览器自动化测试
- 🔄 RPC调用支持
- 🔄 高级数据转换
- 🔄 实时协作
- 🔄 测试用例版本管理

### 目标定位

**从"功能完备"升级到"智能测试平台"**

| 维度 | 当前状态 | 目标状态 |
|------|---------|---------|
| **测试创建** | 手工编写 | AI辅助生成 |
| **基础设施测试** | 仅HTTP/Database | Redis/Kafka/ES/浏览器 |
| **协作能力** | 单人操作 | 多人实时协作 |
| **数据处理** | 基础JSON操作 | 复杂数据转换 |
| **执行效率** | 串行为主 | 智能并行编排 |

### 核心价值主张

**增强1: AI驱动的测试用例生成**
- 通过自然语言描述自动生成测试用例
- 智能识别接口变更并推荐测试更新
- 基于历史数据生成边界测试数据

**增强2: 全栈基础设施测试**
- 支持常用中间件(Redis/Kafka/Elasticsearch)
- 浏览器自动化测试(E2E场景)
- RPC协议(gRPC/Dubbo/Thrift)测试

**增强3: 高效协作与版本管理**
- 多人同时编辑同一测试套件
- 测试用例版本控制与回滚
- 基于Git的测试代码托管

---

## 功能差距分析

### 1. AI智能中心 (AICenter)

#### 现状

前端已实现mock界面，包含以下功能：
- AI Prompt输入框
- 测试用例生成请求
- AI响应解析

#### 差距

后端缺失:
```go
// 待实现的服务接口
type AIService interface {
    // 根据需求描述生成测试用例
    GenerateTestCase(ctx context.Context, req *AIRequest) (*TestCase, error)

    // 分析API变更并推荐测试更新
    AnalyzeChangesAndRecommend(ctx context.Context, changeLog string) ([]TestUpdate, error)

    // 生成智能测试数据
    GenerateTestData(ctx context.Context, param TestDataParam) (*TestData, error)

    // 生成测试脚本
    GenerateTestScript(ctx context.Context, req *ScriptRequest) (*Script, error)

    // 错误分析辅助
    AnalyzeFailure(ctx context.Context, logs []string) (*FailureAnalysis, error)
}
```

依赖项:
- Gemini/Google AI API integration
- Prompt工程
- Few-shot learning examples

#### 实现范围

**P0 (核心)**:
- [ ] AI测试用例生成服务
- [ ] Prompt优化与上下文管理
- [ ] AI生成内容的质量验证

**P1 (增强)**:
- [ ] API变更智能分析
- [ ] 测试数据生成
- [ ] 错误日志分析

**P2 (高级)**:
- [ ] 测试脚本生成
- [ ] 性能问题诊断
- [ ] 测试策略推荐

#### 技术方案

1. **AI服务集成**
```go
type AIConfig struct {
    GeminiAPIKey      string
    Model             string // gemini-1.5-pro, gemini-1.5-flash
    MaxTokens         int
    Temperature       float32
    TopP              float32
}
```

2. **Prompt管理**
- 模板化Prompt
- 上下文缓存(最近20个对话)
- 历史Prompt版本管理

3. **响应验证**
- JSON Schema验证
- 关键词检查
- 重复性检测

### 2. 高级基础设施测试

#### 2.1 Redis命令测试 (NodeType.REDIS_CMD)

**现状**: 前端mock存在，后端无实现

**需求实现**:
```go
type RedisAction struct {
    Command   string                 // GET, SET, HGET, HSET, LPUSH, etc
    Key       string                 // Redis key
    Value     string                 // Value (for SET)
    Field     string                 // Hash field (for HGET/HSET)
    Timeout   int                    // Command timeout (ms)
    Asserts   []Assertion            // Response assertions
}

type RedisConfig struct {
    Host      string
    Port      int
    Password  string
    DB        int
    PoolSize  int
}
```

**数据库模型**:
```sql
CREATE TABLE redis_configs (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    host VARCHAR(255) NOT NULL,
    port INT NOT NULL DEFAULT 6379,
    password VARCHAR(255),
    db INT DEFAULT 0,
    pool_size INT DEFAULT 10,
    tenant_id VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE redis_test_executions (
    id VARCHAR(50) PRIMARY KEY,
    config_id VARCHAR(50) NOT NULL,
    command VARCHAR(50) NOT NULL,
    key_pattern VARCHAR(255),
    status ENUM('pending', 'running', 'success', 'failed') NOT NULL,
    response TEXT,
    error_message TEXT,
    duration_ms INT,
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**API端点**:
- `POST /api/v2/redis/configs` - 创建Redis配置
- `GET /api/v2/redis/configs` - 查询Redis配置
- `POST /api/v2/redis/tests` - 执行Redis测试
- `GET /api/v2/redis/tests/:id` - 查询测试结果

**实现优先级**: P1

#### 2.2 Kafka消息测试 (NodeType.KAFKA_PUB)

**实现范围**:
```go
type KafkaAction struct {
    Brokers     []string          // Kafka brokers
    Topic       string            // Topic name
    Message     string            // Message body
    Key         string            // Message key
    Headers     map[string]string // Message headers
    Timeout     int               // Timeout (ms)
    AssertMode  string            // sync/async
}

type KafkaConfig struct {
    Brokers     []string
    SASLConfig  *SASLConfig
    TLSConfig   *TLSConfig
}
```

**数据库模型**:
```sql
CREATE TABLE kafka_configs (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    brokers JSON NOT NULL, -- Array of broker addresses
    sasl_enabled BOOLEAN DEFAULT FALSE,
    sasl_mechanism VARCHAR(50),
    username VARCHAR(255),
    password VARCHAR(255),
    tls_enabled BOOLEAN DEFAULT FALSE,
    tenant_id VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE kafka_test_executions (
    id VARCHAR(50) PRIMARY KEY,
    config_id VARCHAR(50) NOT NULL,
    topic VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    message_key VARCHAR(255),
    status ENUM('pending', 'running', 'success', 'failed') NOT NULL,
    partition INT,
    offset BIGINT,
    error_message TEXT,
    duration_ms INT,
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**API端点**:
- `POST /api/v2/kafka/configs` - 创建Kafka配置
- `POST /api/v2/kafka/tests` - 发布消息测试
- `GET /api/v2/kafka/tests/:id/consumers` - 消费验证

**实现优先级**: P2

#### 2.3 Elasticsearch查询测试 (NodeType.ES_QUERY)

**实现范围**:
```go
type ESAction struct {
    QueryType   string          // search, index, delete, update
    Index       string          // Index name
    Query       map[string]any  // ES query DSL
    Document    map[string]any  // Document for index
    Timeout     int             // Timeout (ms)
    Asserts     []Assertion     // Response assertions
}

type ESConfig struct {
    Hosts       []string
    Username    string
    Password    string
    APIKey      string
}
```

**数据库模型**:
```sql
CREATE TABLE es_configs (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    hosts JSON NOT NULL,
    username VARCHAR(255),
    password VARCHAR(255),
    api_key VARCHAR(255),
    tenant_id VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE es_test_executions (
    id VARCHAR(50) PRIMARY KEY,
    config_id VARCHAR(50) NOT NULL,
    query_type ENUM('search', 'index', 'delete', 'update') NOT NULL,
    index_name VARCHAR(255),
    query JSON,
    status ENUM('pending', 'running', 'success', 'failed') NOT NULL,
    hits INT,
    response JSON,
    error_message TEXT,
    duration_ms INT,
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**实现优先级**: P2

#### 2.4 浏览器自动化测试 (NodeType.BROWSER_ACTION)

**实现范围**:
```go
type BrowserAction struct {
    ActionType  string          // open, click, type, select, wait, screenshot
    URL         string          // Initial URL
    Selector    string          // CSS/XPath selector
    Value       string          // Input value
    Timeout     int             // Wait timeout (ms)
    Asserts     []Assertion     // Page assertions
}

type BrowserConfig struct {
    BrowserType string          // chrome, firefox, webkit
    Headless    bool            // Headless mode
    Viewport    Viewport        // Viewport size
    UserAgent   string          // Custom User-Agent
}
```

**技术方案**:
- 使用 [Playwright-Go](https://github.com/playwright-community/playwright-go)
- 容器化浏览器执行环境
- 截图和录屏支持

```go
// 示例: 浏览器执行器
type BrowserExecutor struct {
    pw      *playwright.Playwright
    browser playwright.Browser
    page    playwright.Page
}

func (e *BrowserExecutor) Execute(action *BrowserAction) (*BrowserResult, error) {
    switch action.ActionType {
    case "open":
        return e.openPage(action.URL)
    case "click":
        return e.clickElement(action.Selector)
    case "type":
        return e.typeInput(action.Selector, action.Value)
    case "screenshot":
        return e.takeScreenshot(action.Selector)
    default:
        return nil, fmt.Errorf("unsupported action type: %s", action.ActionType)
    }
}
```

**数据库模型**:
```sql
CREATE TABLE browser_configs (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    browser_type VARCHAR(50) NOT NULL, -- chrome, firefox
    headless BOOLEAN DEFAULT TRUE,
    viewport_width INT DEFAULT 1920,
    viewport_height INT DEFAULT 1080,
    user_agent TEXT,
    tenant_id VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE browser_test_executions (
    id VARCHAR(50) PRIMARY KEY,
    config_id VARCHAR(50) NOT NULL,
    action_type VARCHAR(50) NOT NULL,
    url TEXT,
    selector VARCHAR(500),
    value TEXT,
    status ENUM('pending', 'running', 'success', 'failed') NOT NULL,
    screenshot_url VARCHAR(500),
    video_url VARCHAR(500),
    error_message TEXT,
    duration_ms INT,
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**实现优先级**: P1

#### 2.5 RPC调用测试 (NodeType.RPC_CALL)

**实现范围**:
```go
type RPCAction struct {
    Protocol    string          // gRPC, Dubbo, Thrift, HTTP/2
    Service     string          // Service name
    Method      string          // Method name
    Endpoint    string          // Server endpoint
    Request     map[string]any  // Request payload
    Headers     map[string]string // Metadata headers
    Timeout     int             // Timeout (ms)
    Asserts     []Assertion     // Response assertions
}

type RPCConfig struct {
    Protocol    string
    Endpoint    string
    Headers     map[string]string
}
```

**支持协议**:
- **gRPC**: Protocol Buffers + gRPC-Go
- **Dubbo**: Dubbo-go集成
- **Thrift**: Apache Thrift

**数据库模型**:
```sql
CREATE TABLE rpc_configs (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    protocol VARCHAR(50) NOT NULL, -- grpc, dubbo, thrift
    endpoint VARCHAR(255) NOT NULL,
    service_name VARCHAR(255),
    metadata JSON, -- Protocol-specific metadata
    tenant_id VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE rpc_test_executions (
    id VARCHAR(50) PRIMARY KEY,
    config_id VARCHAR(50) NOT NULL,
    method VARCHAR(255) NOT NULL,
    request JSON,
    status ENUM('pending', 'running', 'success', 'failed') NOT NULL,
    response JSON,
    error_code VARCHAR(100),
    error_message TEXT,
    duration_ms INT,
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**实现优先级**: P3

### 3. 实时协作功能

#### 需求场景

多个测试工程师同时编辑同一测试套件/TestCase，需要：
- 实时看到他人的编辑位置
- 冲突检测与合并
- 编辑锁定机制
- 变更历史追踪

#### 技术方案

**WebSocket扩展**:
```go
type CollaborationHub struct {
    clients    map[string]*CollaborationClient // clientID -> client
    documents  map[string][]string             // documentID -> clientIDs
    mutex      sync.RWMutex
}

type CollaborationMessage struct {
    Type        string    // cursor, edit, lock, unlock
    DocumentID  string    // TestCase ID or Group ID
    ClientID    string
    UserID      string
    UserName    string
    Position    *Position // For cursor
    Content     string    // For edit
    Range       *Range    // For edit
    Timestamp   time.Time
}
```

**实现功能**:
1. **光标同步** (P1)
   - 显示其他用户的光标位置
   - 显示用户名称和头像

2. **实时编辑同步** (P1)
   - Operational Transformation (OT) 或 CRDT
   - 推荐: **Yjs** + WebSocket

3. **文档锁定** (P2)
   - 谁正在编辑
   - 锁定30秒自动释放

4. **变更历史** (P2)
   - 基于Yjs的history
   - 回放编辑过程

```typescript
// 前端集成
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'

const ydoc = new Y.Doc()
const provider = new WebsocketProvider(
  'ws://localhost:8090/api/v2/collaboration',
  documentId,
  ydoc
)

const ytext = ydoc.getText('test-case-content')
```

**数据库模型**:
```sql
CREATE TABLE collaboration_sessions (
    id VARCHAR(50) PRIMARY KEY,
    document_id VARCHAR(50) NOT NULL, -- TestCase ID
    document_type VARCHAR(50) NOT NULL, -- test-case, workflow
    user_id VARCHAR(50) NOT NULL,
    session_started TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_locked BOOLEAN DEFAULT FALSE
);

CREATE TABLE collaboration_changes (
    id VARCHAR(50) PRIMARY KEY,
    document_id VARCHAR(50) NOT NULL,
    user_id VARCHAR(50) NOT NULL,
    change_type VARCHAR(50) NOT NULL,
    change_data JSON NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_document_timestamp (document_id, timestamp)
);
```

**API端点**:
- `WS /api/v2/collaboration/:documentId` - 协作WebSocket
- `GET /api/v2/collaboration/:documentId/users` - 在线用户列表
- `POST /api/v2/collaboration/:documentId/lock` - 锁定文档
- `DELETE /api/v2/collaboration/:documentId/lock` - 解锁文档

**实现优先级**: P2

### 4. 测试用例版本管理

#### 需求场景

测试用例需要版本控制，支持：
- 查看历史版本
- 对比版本差异
- 回滚到历史版本
- 版本标签和说明

#### 技术方案

**版本控制策略**: Git-based

```go
type TestCaseVersion struct {
    VersionID   string    `gorm:"primaryKey"`
    TestCaseID  string    `gorm:"index"`
    Version     string    // semantic version: 1.0.0, 1.0.1
    Branch      string    // main, feature-x, hotfix-y
    CommitHash  string    // Git commit hash
    AuthorID    string    // Who made the change
    AuthorName  string
    Message     string    // Commit message
    Diff        string    // JSON diff
    CreatedAt   time.Time
}

type VersionController struct {
    repo       *git.Repository
    worktree   *git.Worktree
}

func (vc *VersionController) CommitTestCase(
    tc *models.TestCase,
    author *models.User,
    message string,
) error {
    // 1. Serialize test case to file
    // 2. Add to git
    // 3. Commit
    // 4. Store metadata in database
}
```

**Git仓库结构**:
```
test-cases/
├── {tenant-id}/
│   ├── {project-id}/
│   │   ├── test-case-{id}.json
│   │   └── workflow-{id}.json
```

**数据库模型**:
```sql
CREATE TABLE test_case_versions (
    version_id VARCHAR(50) PRIMARY KEY,
    test_case_id VARCHAR(50) NOT NULL,
    version VARCHAR(20) NOT NULL, -- v1.0.0
    branch VARCHAR(100), -- main, feature-x
    commit_hash VARCHAR(100), -- Git hash
    author_id VARCHAR(50) NOT NULL,
    author_name VARCHAR(100),
    message TEXT,
    diff JSON, -- JSON diff
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_testcase_version (test_case_id, version),
    INDEX idx_created_at (created_at)
);

CREATE TABLE version_tags (
    id VARCHAR(50) PRIMARY KEY,
    test_case_id VARCHAR(50) NOT NULL,
    version VARCHAR(20) NOT NULL,
    tag VARCHAR(100) NOT NULL, -- v1.0-release, hotfix-jan
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**API端点**:
- `POST /api/v2/tests/:id/versions` - 创建版本
- `GET /api/v2/tests/:id/versions` - 查询版本历史
- `GET /api/v2/tests/:id/versions/:version` - 获取指定版本
- `POST /api/v2/tests/:id/versions/:version/rollback` - 回滚到版本
- `POST /api/v2/tests/:id/versions/:version/tags` - 添加标签

**视觉差异展示**:
```typescript
// 前端使用monaco-editor + diff功能
import { diffEditor } from 'monaco-editor'

const diffEditor = monaco.editor.createDiffEditor(container)
diffEditor.setModel({
    original: monaco.editor.createModel(prevVersion, 'json'),
    modified: monaco.editor.createModel(currentVersion, 'json')
})
```

**实现优先级**: P2

---

## 后端模型改进

### 1. 测试用例模型增强

#### 当前模型 (`internal/models/test_case.go`)

```go
type TestCase struct {
    TestID          string          `gorm:"primaryKey;column:test_id"`
    TenantID        string          `gorm:"column:tenant_id;index"`
    ProjectID       string          `gorm:"column:project_id;index"`
    TestGroupID     string          `gorm:"column:test_group_id"`
    Name            string          `gorm:"column:name"`
    Description     string          `gorm:"column:description"`
    Type            string          `gorm:"column:test_type"`           // api, command, workflow
    HTTPConfig      repository.JSONB     `gorm:"type:text;column:http_config"`
    CommandConfig   repository.JSONB     `gorm:"type:text;column:command_config"`
    WorkflowID      string          `gorm:"column:workflow_id"`
    WorkflowDef     repository.JSONB     `gorm:"type:text;column:workflow_def"`
    Priority        string          `gorm:"column:priority"`
    Status          string          `gorm:"column:status"`
    CreatedAt       time.Time       `gorm:"column:created_at"`
    UpdatedAt       time.Time       `gorm:"column:updated_at"`
    CreatedBy       string          `gorm:"column:created_by"`
    UpdatedBy       string          `gorm:"column:updated_by"`
    Tags            repository.JSONArray `gorm:"type:text;column:tags"`
    Assertions      repository.JSONArray `gorm:"type:text;column:assertions"`
}
```

#### 改进建议

**新增字段**:
```go
type TestCase struct {
    // ... existing fields ...

    // 版本控制 (支持Git-based版本管理)
    CurrentVersion  string          `gorm:"column:current_version"`    // 当前版本号
    VersionBranch   string          `gorm:"column:version_branch"`     // 版本分支
    LastVersionID   string          `gorm:"column:last_version_id"`    // 上个版本ID

    // AI增强字段
    AIGenerated     bool            `gorm:"column:ai_generated"`       // 是否AI生成
    AIConfidence    float32         `gorm:"column:ai_confidence"`      // AI置信度
    AIPromptID      string          `gorm:"column:ai_prompt_id"`       // 生成使用的Prompt

    // 协作字段
    LockedBy        string          `gorm:"column:locked_by"`          // 谁锁定了编辑
    LockedAt        *time.Time      `gorm:"column:locked_at"`          // 锁定时间
    Collaborators   repository.JSONArray `gorm:"type:text;column:collaborators"` // 协作者列表

    // 统计增强
    CoverageScore   float32         `gorm:"column:coverage_score"`     // 覆盖率评分
    StabilityScore  float32         `gorm:"column:stability_score"`    // 稳定性评分
    EfficiencyScore float32         `gorm:"column:efficiency_score"`   // 效率评分

    // 执行优化
    Parallelizable  bool            `gorm:"column:parallelizable"`     // 是否可并行
    RequiredTests   repository.JSONArray `gorm:"type:text;column:required_tests"` // 前置依赖测试

    // 元数据扩展
    CustomFields    repository.JSONB     `gorm:"type:text;column:custom_fields"`  // 自定义字段
    Metadata        repository.JSONB     `gorm:"type:text;column:metadata"`       // 扩展元数据
}
```

**新增关联表**:
```sql
-- 测试用例依赖关系
CREATE TABLE test_case_dependencies (
    id VARCHAR(50) PRIMARY KEY,
    test_case_id VARCHAR(50) NOT NULL, -- 当前测试用例
    depends_on_test_id VARCHAR(50) NOT NULL, -- 依赖的测试用例
    dependency_type ENUM('hard', 'soft') NOT NULL, -- 硬依赖/软依赖
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (test_case_id) REFERENCES test_cases(test_id) ON DELETE CASCADE,
    FOREIGN KEY (depends_on_test_id) REFERENCES test_cases(test_id) ON DELETE CASCADE,
    UNIQUE KEY unique_dep (test_case_id, depends_on_test_id)
);

-- 测试用例标签索引优化
CREATE TABLE test_case_tag_index (
    id VARCHAR(50) PRIMARY KEY,
    test_case_id VARCHAR(50) NOT NULL,
    tag VARCHAR(100) NOT NULL,
    tenant_id VARCHAR(50) NOT NULL,
    INDEX idx_tag_lookup (tenant_id, tag),
    FOREIGN KEY (test_case_id) REFERENCES test_cases(test_id) ON DELETE CASCADE
);
```

### 2. 工作流模型增强

#### 当前模型

```go
type Workflow struct {
    ID          string    `gorm:"primaryKey;column:id"`
    WorkflowID  string    `gorm:"column:workflow_id;index"`
    TenantID    string    `gorm:"column:tenant_id;index"`
    ProjectID   string    `gorm:"column:project_id;index"`
    Name        string    `gorm:"column:name"`
    Description string    `gorm:"column:description"`
    Mode        string    `gorm:"column:mode"` // sequence, parallel, dag
    Steps       repository.JSONB `gorm:"type:text;column:steps"`
    Variables   repository.JSONB `gorm:"type:text;column:variables"`
    Labels      repository.JSONArray `gorm:"type:text;column:labels"`
    Status      string    `gorm:"column:status"`
    CreatedAt   time.Time `gorm:"column:created_at"`
    UpdatedAt   time.Time `gorm:"column:updated_at"`
}
```

#### 改进建议

```go
type Workflow struct {
    // ... existing fields ...

    // 调度配置
    ScheduleEnabled bool            `gorm:"column:schedule_enabled"`
    ScheduleCron    string          `gorm:"column:schedule_cron"`     // Cron表达式
    ScheduleNextRun time.Time       `gorm:"column:schedule_next_run"`

    // 通知配置
    NotifyOnSuccess repository.JSONArray `gorm:"type:text;column:notify_on_success"`
    NotifyOnFailure repository.JSONArray `gorm:"type:text;column:notify_on_failure"`
    NotifyWebhook   string          `gorm:"column:notify_webhook"`

    // 执行策略
    RetryStrategy   repository.JSONB `gorm:"type:text;column:retry_strategy"` // 重试策略
    TimeoutStrategy repository.JSONB `gorm:"type:text;column:timeout_strategy"` // 超时策略

    // 资源限制
    MaxParallel     int             `gorm:"column:max_parallel"`        // 最大并行数
    ResourceQuota   repository.JSONB `gorm:"type:text;column:resource_quota"` // CPU/Memory限制

    // 触发器
    Triggers        repository.JSONB `gorm:"type:text;column:triggers"` // Webhook/Git triggers

    // 统计信息
    TotalRuns       int             `gorm:"column:total_runs"`
    SuccessRate     float32         `gorm:"column:success_rate"`
    AvgDuration     int             `gorm:"column:avg_duration_ms"`

    // 版本控制
    Version         string          `gorm:"column:version"`
    IsTemplate      bool            `gorm:"column:is_template"`         // 是否作为模板
}
```

### 3. 测试执行模型增强

**当前问题**: 执行记录分散在 `test_results`, `test_runs`, `workflow_runs` 多个表

**改进方案**: 统一执行模型

```go
type Execution struct {
    ExecutionID     string          `gorm:"primaryKey;column:execution_id"`
    TenantID        string          `gorm:"column:tenant_id;index"`
    ProjectID       string          `gorm:"column:project_id;index"`
    Type            string          `gorm:"column:type"` // test-case, workflow, test-suite
    ResourceID      string          `gorm:"column:resource_id"` // TestCase ID or Workflow ID
    ResourceName    string          `gorm:"column:resource_name"`

    // 执行状态
    Status          string          `gorm:"column:status"` // pending, running, success, failed, cancelled
    StatusMessage   string          `gorm:"column:status_message"`
    StartTime       time.Time       `gorm:"column:start_time"`
    EndTime         *time.Time      `gorm:"column:end_time"`
    DurationMs      int             `gorm:"column:duration_ms"`

    // 执行详情
    TriggeredBy     string          `gorm:"column:triggered_by"` // user, schedule, webhook
    TriggeredByID   string          `gorm:"column:triggered_by_id"`
    Environment     string          `gorm:"column:environment"` // dev, staging, prod
    Variables       repository.JSONB `gorm:"type:text;column:variables"`

    // 结果统计
    TotalSteps      int             `gorm:"column:total_steps"`
    PassedSteps     int             `gorm:"column:passed_steps"`
    FailedSteps     int             `gorm:"column:failed_steps"`
    SkippedSteps    int             `gorm:"column:skipped_steps"`

    // 资源使用
    ResourceUsage   repository.JSONB `gorm:"type:text;column:resource_usage"` // CPU, Memory logs

    // 日志和报告
    LogsURL         string          `gorm:"column:logs_url"` // S3/MinIO URL
    ReportURL       string          `gorm:"column:report_url"`
    JUnitReportURL  string          `gorm:"column:junit_report_url"`

    // 错误信息
    ErrorType       string          `gorm:"column:error_type"` // timeout, assertion, exception
    ErrorMessage    string          `gorm:"column:error_message"`
    StackTrace      string          `gorm:"column:stack_trace"`

    // AI分析 (失败时)
    AIFailureAnalysis repository.JSONB `gorm:"type:text;column:ai_failure_analysis"`

    CreatedAt       time.Time       `gorm:"column:created_at"`
}
```

**旧表迁移策略**:
- `test_results` → `executions` (Type='test-case')
- `test_runs` → `executions` (Type='test-suite')
- `workflow_runs` → `executions` (Type='workflow')
- `workflow_step_executions` → `execution_steps`

### 4. AI服务相关模型

```go
package models

// AIRequest AI请求
type AIRequest struct {
    RequestID   string    `gorm:"primaryKey;column:request_id"`
    TenantID    string    `gorm:"column:tenant_id;index"`
    UserID      string    `gorm:"column:user_id;index"`
    RequestType string    `gorm:"column:request_type"` // test-case, script, data

    // 请求内容
    Prompt      string    `gorm:"column:prompt;type:text"`
    Context     repository.JSONB `gorm:"type:text;column:context"` // Additional context
    Parameters  repository.JSONB `gorm:"type:text;column:parameters"`

    // AI模型
    Model       string    `gorm:"column:model"` // gemini-1.5-pro
    Temperature float32   `gorm:"column:temperature"`
    MaxTokens   int       `gorm:"column:max_tokens"`

    // 响应
    Response    string    `gorm:"column:response;type:text"`
    Status      string    `gorm:"column:status"` // pending, success, failed
    Error       string    `gorm:"column:error"`

    // 质量评估
    GeneratedID string    `gorm:"column:generated_id"`    // 生成的TestCase/Workflow ID
    Confidence  float32   `gorm:"column:confidence"`
    Verified    bool      `gorm:"column:verified"`          // 是否人工确认

    // 计费
    TokenUsage  int       `gorm:"column:token_usage"`
    Cost        float64   `gorm:"column:cost"`

    CreatedAt   time.Time `gorm:"column:created_at"`
}

// AIPromptTemplate Prompt模板
type AIPromptTemplate struct {
    TemplateID  string    `gorm:"primaryKey;column:template_id"`
    TenantID    string    `gorm:"column:tenant_id;index"`
    Name        string    `gorm:"column:name"`
    Description string    `gorm:"column:description"`
    Category    string    `gorm:"column:category"` // test-case, script, data

    // Prompt内容
    Template    string    `gorm:"column:template;type:text"`
    Variables   repository.JSONB `gorm:"type:text;column:variables"` // 模板变量定义
    Examples    repository.JSONB `gorm:"type:text;column:examples"`  // Few-shot examples

    // 统计
    UsageCount  int       `gorm:"column:usage_count"`
    AvgRating   float32   `gorm:"column:avg_rating"`

    CreatedBy   string    `gorm:"column:created_by"`
    CreatedAt   time.Time `gorm:"column:created_at"`
    UpdatedAt   time.Time `gorm:"column:updated_at"`
}

// AIAgent AI智能体配置
type AIAgent struct {
    AgentID     string    `gorm:"primaryKey;column:agent_id"`
    TenantID    string    `gorm:"column:tenant_id;index"`
    Name        string    `gorm:"column:name"`
    Description string    `gorm:"column:description"`

    // 能力
    Capabilities repository.JSONArray `gorm:"type:text;column:capabilities"` // [test-gen, script-gen, analysis]

    // 配置
    Config      repository.JSONB `gorm:"type:text;column:config"`

    // 记忆
    Memory      repository.JSONB `gorm:"type:text;column:memory"` // 对话历史
    KnowledgeBase string        `gorm:"column:knowledge_base"`     // 知识库引用

    IsActive    bool      `gorm:"column:is_active"`
    CreatedAt   time.Time `gorm:"column:created_at"`
    UpdatedAt   time.Time `gorm:"column:updated_at"`
}
```

---

## API扩展需求

### 1. AI中心API (新模块)

```go
// /api/v2/ai

func setupAIRoutes(v2 *gin.RouterGroup, handler *handler.AIHandler) {
    ai := v2.Group("/ai")
    {
        // AI生成测试用例
        ai.POST("/generate-test-case", handler.GenerateTestCase)

        // AI生成测试数据
        ai.POST("/generate-test-data", handler.GenerateTestData)

        // AI分析失败
        ai.POST("/analyze-failure", handler.AnalyzeFailure)

        // AI生成脚本
        ai.POST("/generate-script", handler.GenerateScript)

        // Prompt模板管理
        ai.GET("/prompts", handler.ListPromptTemplates)
        ai.POST("/prompts", handler.CreatePromptTemplate)
        ai.GET("/prompts/:id", handler.GetPromptTemplate)
        ai.PUT("/prompts/:id", handler.UpdatePromptTemplate)
        ai.DELETE("/prompts/:id", handler.DeletePromptTemplate)

        // AI智能体管理
        ai.GET("/agents", handler.ListAgents)
        ai.POST("/agents", handler.CreateAgent)
        ai.GET("/agents/:id", handler.GetAgent)
        ai.PUT("/agents/:id", handler.UpdateAgent)
        ai.DELETE("/agents/:id", handler.DeleteAgent)

        // AI请求历史
        ai.GET("/requests", handler.ListAIRequests)
        ai.GET("/requests/:id", handler.GetAIRequest)
    }
}
```

**实现文件位置**:
- `internal/handler/ai_handler.go`
- `internal/service/ai_service.go`
- `internal/repository/ai_repository.go`

### 2. 基础设施测试API (扩展现有/workflow)

```go
// Redis测试
v2.POST("/redis/configs", handler.CreateRedisConfig)
v2.GET("/redis/configs", handler.ListRedisConfigs)
v2.GET("/redis/configs/:id", handler.GetRedisConfig)
v2.PUT("/redis/configs/:id", handler.UpdateRedisConfig)
v2.DELETE("/redis/configs/:id", handler.DeleteRedisConfig)
v2.POST("/redis/tests", handler.ExecuteRedisTest)
v2.GET("/redis/tests/:id", handler.GetRedisTestResult)

// Kafka测试
v2.POST("/kafka/configs", handler.CreateKafkaConfig)
v2.GET("/kafka/configs", handler.ListKafkaConfigs)
v2.GET("/kafka/configs/:id", handler.GetKafkaConfig)
v2.PUT("/kafka/configs/:id", handler.UpdateKafkaConfig)
v2.DELETE("/kafka/configs/:id", handler.DeleteKafkaConfig)
v2.POST("/kafka/tests", handler.ExecuteKafkaTest)
v2.GET("/kafka/tests/:id", handler.GetKafkaTestResult)
v2.POST("/kafka/tests/:id/consumers", handler.CreateKafkaConsumer)

// Elasticsearch测试
v2.POST("/es/configs", handler.CreateESConfig)
v2.GET("/es/configs", handler.ListESConfigs)
v2.GET("/es/configs/:id", handler.GetESConfig)
v2.PUT("/es/configs/:id", handler.UpdateESConfig)
v2.DELETE("/es/configs/:id", handler.DeleteESConfig)
v2.POST("/es/tests", handler.ExecuteESTest)
v2.GET("/es/tests/:id", handler.GetESTestResult)

// 浏览器自动化测试
v2.POST("/browser/configs", handler.CreateBrowserConfig)
v2.GET("/browser/configs", handler.ListBrowserConfigs)
v2.GET("/browser/configs/:id", handler.GetBrowserConfig)
v2.PUT("/browser/configs/:id", handler.UpdateBrowserConfig)
v2.DELETE("/browser/configs/:id", handler.DeleteBrowserConfig)
v2.POST("/browser/tests", handler.ExecuteBrowserTest)
v2.GET("/browser/tests/:id", handler.GetBrowserTestResult)

// RPC测试
v2.POST("/rpc/configs", handler.CreateRPCConfig)
v2.GET("/rpc/configs", handler.ListRPCConfigs)
v2.GET("/rpc/configs/:id", handler.GetRPCConfig)
v2.PUT("/rpc/configs/:id", handler.UpdateRPCConfig)
v2.DELETE("/rpc/configs/:id", handler.DeleteRPCConfig)
v2.POST("/rpc/tests", handler.ExecuteRPCTest)
v2.GET("/rpc/tests/:id", handler.GetRPCTestResult)
```

**实现文件位置**:
- `internal/handler/infrastructure_test_handler.go`
- `internal/service/redis_service.go`
- `internal/service/kafka_service.go`
- `internal/service/es_service.go`
- `internal/service/browser_service.go`
- `internal/service/rpc_service.go`

### 3. 协作与版本管理API

```go
// 协作WebSocket
v2.GET("/ws/collaboration/:documentId", handler.HandleCollaborationWebSocket)

// 版本管理
v2.POST("/tests/:id/versions", handler.CreateTestCaseVersion)
v2.GET("/tests/:id/versions", handler.ListTestCaseVersions)
v2.GET("/tests/:id/versions/:version", handler.GetTestCaseVersion)
v2.POST("/tests/:id/versions/:version/rollback", handler.RollbackTestCase)
v2.POST("/tests/:id/versions/:version/tags", handler.TagTestCaseVersion)
v2.DELETE("/tests/:id/versions/:version/tags/:tag", handler.UntagTestCaseVersion)

// 协作管理
v2.GET("/collaboration/:documentId/users", handler.GetOnlineUsers)
v2.POST("/collaboration/:documentId/lock", handler.LockDocument)
v2.DELETE("/collaboration/:documentId/lock", handler.UnlockDocument)
```

**实现文件位置**:
- `internal/handler/collaboration_handler.go`
- `internal/handler/version_handler.go`
- `internal/service/collaboration_service.go`
- `internal/service/version_service.go`

### 4. 统一执行API (扩展现有/executions)

```go
// 统一执行入口
v2.POST("/executions", handler.CreateExecution)
v2.GET("/executions", handler.ListExecutions)
v2.GET("/executions/:id", handler.GetExecution)
v2.DELETE("/executions/:id", handler.CancelExecution)

// 执行报告
v2.GET("/executions/:id/report", handler.GetExecutionReport)
v2.GET("/executions/:id/junit", handler.GetJUnitReport)
v2.GET("/executions/:id/logs", handler.GetExecutionLogs)

// 批量执行
v2.POST("/executions/batch", handler.BatchExecute)
```

**实现文件位置**:
- `internal/handler/execution_handler.go` (重构现有handler)
- `internal/service/execution_service.go`
- `internal/repository/execution_repository.go`

---

## 功能实现优先级

### P0: MVP核心功能 (Q2 2025)

**目标**: 实现AI生成测试用例，显著提升测试创建效率

| 功能模块 | 具体功能 | 预计工时 | 负责人 |
|---------|---------|---------|--------|
| AI中心 | AI测试用例生成 | 40h | 后端架构组 |
| AI中心 | Prompt管理与优化 | 20h | 后端架构组 |
| AI中心 | 生成内容验证 | 16h | 后端架构组 |
| 测试用例 | 模型字段扩展 | 12h | 后端架构组 |
| API | AI相关API开发 | 24h | 后端架构组 |
| 测试 | 单元测试与集成测试 | 16h | QA团队 |
| **合计** | | **128h** (2人周) | |

**成功标准**:
- AI生成测试用例可用率 > 70%
- 测试创建效率提升 > 50%
- API测试覆盖率 > 80%

### P1: 基础设施测试 (Q3 2025)

**目标**: 支持Redis和浏览器自动化测试，扩展测试场景覆盖

| 功能模块 | 具体功能 | 预计工时 | 负责人 |
|---------|---------|---------|--------|
| Redis测试 | Redis配置管理 | 8h | 中间件团队 |
| Redis测试 | Redis执行器 | 16h | 中间件团队 |
| Redis测试 | Redis测试API | 12h | 中间件团队 |
| 浏览器测试 | Playwright集成 | 24h | E2E团队 |
| 浏览器测试 | 浏览器执行器 | 20h | E2E团队 |
| 浏览器测试 | 浏览器测试API | 12h | E2E团队 |
| 模型 | Redis/浏览器模型 | 8h | 后端架构组 |
| **合计** | | **100h** (1.5人周) | |

**成功标准**:
- 支持Redis 90%常用命令测试
- 浏览器测试支持Chrome/Firefox/Webkit
- 可以测试完整的端到端场景

### P2: Kafka/ES测试与协作功能 (Q4 2025)

**目标**: 支持消息队列测试和实时协作，提升团队协作效率

| 功能模块 | 具体功能 | 预计工时 | 负责人 |
|---------|---------|---------|--------|
| Kafka测试 | Kafka配置与执行 | 24h | 中间件团队 |
| ES测试 | ES配置与执行 | 20h | 搜索团队 |
| 协作 | WebSocket扩展 | 16h | 后端架构组 |
| 协作 | 光标同步 | 12h | 前端团队 |
| 协作 | 实时编辑OT | 24h | 前端团队 |
| 协作 | 文档锁定 | 8h | 后端架构组 |
| **合计** | | **104h** (1.5人周) | |

**成功标准**:
- Kafka发布与消费测试支持
- 实时协作延迟 < 500ms
- 支持3人同时编辑同一测试用例

### P3: RPC测试与版本管理 (Q1 2026)

**目标**: 完善测试用例版本管理，支持企业级场景

| 功能模块 | 具体功能 | 预计工时 | 负责人 |
|---------|---------|---------|--------|
| RPC测试 | gRPC/Dubbo支持 | 32h | 微服务团队 |
| 版本管理 | Git集成 | 24h | 后端架构组 |
| 版本管理 | 版本API | 16h | 后端架构组 |
| 版本管理 | 版本差异对比 | 20h | 前端团队 |
| 版本管理 | 回滚功能 | 12h | 后端架构组 |
| **合计** | | **104h** (1.5人周) | |

**成功标准**:
- 支持gRPC协议的测试
- 版本管理Git-based
- 版本差异可视化

### P4: 高级功能 (2026 Q2+)

**目标**: 高级AI功能、企业级特性

- AI驱动的测试数据生成
- AI错误日志分析
- AI性能问题诊断
- 高级数据转换
- 编排优化算法
- 智能并行执行策略
- 测试影响分析

---

## 技术架构

### 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                         API Gateway                          │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │ REST API │  │ WebSocket│  │ GraphQL  │  │   gRPC   │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
├─────────────────────────────────────────────────────────────┤
│                    Service Layer                             │
│  ┌──────────┬──────────┬──────────┬──────────┬──────────┐  │
│  │AIService│InfraSvc  │TestSvc   │FlowSvc   │VersionSvc│  │
│  └──────────┴──────────┴──────────┴──────────┴──────────┘  │
├─────────────────────────────────────────────────────────────┤
│                  Repository Layer                            │
│  ┌──────────┬──────────┬──────────┬──────────┬──────────┐  │
│  │AIRepo    │InfraRepo │TestRepo  │FlowRepo  │ExecRepo  │  │
│  └──────────┴──────────┴──────────┴──────────┴──────────┘  │
├─────────────────────────────────────────────────────────────┤
│                     Core Libraries                             │
│  ┌──────────┬──────────┬──────────┬──────────┬──────────┐  │
│  │ Gemini   │Redis     │Kafka     │Playwright│   Git    │  │
│  │   SDK    │   Go     │  Go      │    Go    │  Go      │  │
│  └──────────┴──────────┴──────────┴──────────┴──────────┘  │
├─────────────────────────────────────────────────────────────┤
│                      Database Layer                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         SQLite / MySQL / PostgreSQL                   │  │
│  │                                                       │  │
│  │  Tables: test_cases, workflows, executions,          │  │
│  │          ai_requests, redis_configs, kafka_configs,  │  │
│  │          browser_configs, rpc_configs, versions      │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 关键组件

#### 1. AI服务组件

```go
type AIService struct {
    client      *genai.Client
    promptMgr   *PromptManager
    validator   *AIValidator
    templates   map[string]*PromptTemplate
}

// 核心逻辑
func (s *AIService) GenerateTestCase(req *AIRequest) (*TestCase, error) {
    // 1. 构建Prompt (含上下文)
    prompt := s.buildPrompt(req)

    // 2. 调用Gemini API
    resp, err := s.client.GenerateContent(ctx, prompt)
    if err != nil {
        return nil, fmt.Errorf("AI API call failed: %w", err)
    }

    // 3. 解析响应
    testCase := s.parseResponse(resp)

    // 4. 验证生成质量
    if err := s.validator.ValidateTestCase(testCase); err != nil {
        return nil, fmt.Errorf("generated test case validation failed: %w", err)
    }

    // 5. 评分
    testCase.AIConfidence = s.calculateConfidence(resp, testCase)
    testCase.AIGenerated = true

    return testCase, nil
}
```

#### 2. 执行器工厂

```go
type ExecutorFactory struct {
    httpExecutor    *HTTPExecutor
    cmdExecutor     *CommandExecutor
    workflowExecutor *WorkflowExecutor
    redisExecutor   *RedisExecutor
    kafkaExecutor   *KafkaExecutor
    esExecutor      *ESExecutor
    browserExecutor *BrowserExecutor
    rpcExecutor     *RPCExecutor
}

func (f *ExecutorFactory) GetExecutor(stepType string) (Executor, error) {
    switch stepType {
    case "http":
        return f.httpExecutor, nil
    case "redis":
        return f.redisExecutor, nil
    case "kafka":
        return f.kafkaExecutor, nil
    case "browser":
        return f.browserExecutor, nil
    case "grpc", "dubbo", "thrift":
        return f.rpcExecutor, nil
    default:
        return nil, fmt.Errorf("unsupported step type: %s", stepType)
    }
}
```

#### 3. 协作引擎

```go
type CollaborationEngine struct {
    hub              *CollaborationHub
    yjsServer        *yjsWS
    otServer         *OTServer
    lockManager      *LockManager
    presenceManager  *PresenceManager
}

// 实时同步
func (e *CollaborationEngine) SyncEdit(msg *CollaborationMessage) error {
    // 1. 广播给所有在线用户
    e.hub.Broadcast(msg.DocumentID, msg)

    // 2. OT/CRDT转换
    e.otServer.Transform(msg)

    // 3. 存储变更历史
    return e.storeChangeHistory(msg)
}
```

### 性能优化

#### 1. 数据库优化

**索引策略**:
```sql
-- 高频查询索引
CREATE INDEX idx_testcases_tenant_project ON test_cases(tenant_id, project_id);
CREATE INDEX idx_testcases_status ON test_cases(status);
CREATE INDEX idx_testcases_created ON test_cases(created_at DESC);
CREATE INDEX idx_executions_resource ON executions(resource_id, created_at DESC);
CREATE INDEX idx_workflows_tenant ON workflows(tenant_id, created_at DESC);

-- 复合索引
CREATE INDEX idx_ai_requests_user_time ON ai_requests(user_id, created_at DESC);
CREATE INDEX idx_redis_tests_config ON redis_test_executions(config_id, executed_at DESC);
```

**分片策略**:
- 按 `tenant_id` 分片 (多租户场景)
- 历史数据归档 (超过1年的执行记录归档到冷存储)

#### 2. 缓存策略

```go
// Redis缓存
type CacheService struct {
    client *redis.Client
}

// 缓存内容
const (
    CacheKeyTestCase        = "tc:{id}"
    CacheKeyTestCaseVersion = "tc:{id}:v:{version}"
    CacheKeyWorkflow        = "wf:{id}"
    CacheKeyRedisConfig     = "redis:cfg:{id}"
    CacheKeyBrowserPool     = "browser:pool"
)

// 缓存TTL
type CacheTTL struct {
    TestCase        time.Duration = 1 * time.Hour
    TestCaseVersion time.Duration = 24 * time.Hour
    Workflow        time.Duration = 1 * time.Hour
    RedisConfig     time.Duration = 1 * time.Hour
    ExecutionResult time.Duration = 5 * time.Minute
}
```

#### 3. 异步处理

**AI生成异步化**:
```go
// 使用消息队列处理AI请求
type AIJob struct {
    RequestID string    `json:"request_id"`
    UserID    string    `json:"user_id"`
    Prompt    string    `json:"prompt"`
    Model     string    `json:"model"`
}

func (s *AIService) GenerateTestCaseAsync(req *AIRequest) (string, error) {
    // 1. 保存请求到数据库
    if err := s.repo.CreateAIRequest(req); err != nil {
        return "", err
    }

    // 2. 发布到消息队列
    job := &AIJob{
        RequestID: req.RequestID,
        UserID:    req.UserID,
        Prompt:    req.Prompt,
        Model:     req.Model,
    }

    if err := s.queue.Publish("ai-generate", job); err != nil {
        return "", err
    }

    return req.RequestID, nil
}
```

**执行结果异步通知**:
- WebSocket实时推送
- Webhook回调
- Email通知

---

## 12个月路线图

### Q2 2025 (4-6月): AI智能核心

#### 里程碑1.1: AI测试用例生成 (MVP)
**目标日期**: 2025-04-30

- [ ] Gemini API集成
- [ ] Prompt模板系统
- [ ] AI测试用例生成核心逻辑
- [ ] 生成内容验证机制
- [ ] 基础AI API (generate-test-case)
- [ ] 单元测试与集成测试

**交付物**:
- 可用的AI测试用例生成功能
- API文档与使用示例
- 测试报告 (覆盖率>80%)

#### 里程碑1.2: Prompt工程与优化
**目标日期**: 2025-05-31

- [ ] Prompt版本管理
- [ ] Few-shot learning支持
- [ ] 上下文管理 (最近20个对话)
- [ ] Prompt模板管理API
- [ ] Prompt性能监控

**交付物**:
- Prompt模板库 (至少10个模板)
- Prompt优化指南

#### 里程碑1.3: AI功能扩展
**目标日期**: 2025-06-30

- [ ] AI测试数据生成
- [ ] AI失败分析辅助
- [ ] 完整的AI API集
- [ ] AI Agent框架

**交付物**:
- 完整的AICenter功能
- 用户手册

### Q3 2025 (7-9月): 基础设施测试

#### 里程碑2.1: Redis测试支持
**目标日期**: 2025-07-31

- [ ] Redis配置模型与数据库表
- [ ] Redis执行器实现
- [ ] Redis测试API
- [ ] Redis测试UI集成

**交付物**:
- Redis测试功能 (支持TOP 20命令)
- 文档与示例

#### 里程碑2.2: 浏览器自动化测试
**目标日期**: 2025-08-31

- [ ] Playwright-Go集成
- [ ] 浏览器执行器实现
- [ ] 浏览器配置管理
- [ ] 浏览器测试API

**交付物**:
- 浏览器自动化测试功能
- 3个E2E示例 (登录、购买、表单提交)

#### 里程碑2.3: 基础设施测试完善
**目标日期**: 2025-09-30

- [ ] Kafka配置与测试
- [ ] Elasticsearch配置与测试
- [ ] 基础设施测试文档

**交付物**:
- Kafka生产者/消费者测试
- ES查询测试
- 基础设施测试最佳实践指南

### Q4 2025 (10-12月): 协作与优化

#### 里程碑3.1: 实时协作基础
**目标日期**: 2025-10-31

- [ ] WebSocket协作通道
- [ ] 光标同步机制
- [ ] 在线用户列表
- [ ] 文档锁定机制

**交付物**:
- 实时光标同步
- 协作者在线状态

#### 里程碑3.2: 协作增强
**目标日期**: 2025-11-30

- [ ] Operational Transformation实现
- [ ] Yjs集成
- [ ] 变更历史记录
- [ ] 协作API完善

**交付物**:
- 多人实时编辑测试用例
- 变更历史查看

#### 里程碑3.3: 性能优化与版本管理
**目标日期**: 2025-12-31

- [ ] 统一执行模型
- [ ] 版本管理后端实现
- [ ] Git集成
- [ ] 性能优化 (1000并发执行)

**交付物**:
- 统一Executor API
- 版本管理API

### Q1 2026 (1-3月): 企业级特性

#### 里程碑4.1: RPC测试
**目标日期**: 2026-01-31

- [ ] gRPC支持
- [ ] Dubbo支持
- [ ] RPC测试API

**交付物**:
- RPC测试功能

#### 里程碑4.2: 版本管理完善
**目标日期**: 2026-02-28

- [ ] 版本差异对比UI
- [ ] 版本回滚功能
- [ ] 版本标签管理
- [ ] 版本分析报告

**交付物**:
- 完整版本管理功能

#### 里程碑4.3: 高级功能与企业级能力
**目标日期**: 2026-03-31

- [ ] AI性能诊断
- [ ] 智能编排优化
- [ ] 测试影响分析
- [ ] 多地域部署支持
- [ ] SLA保证机制

**交付物**:
- 企业级测试平台完整方案

---

## 成功指标

### 1. 业务指标

| 指标 | 当前值 | 目标值 (12个月) | 衡量方式 |
|------|--------|----------------|---------|
| 测试创建效率 | 1个/分钟 | 20个/分钟 | AI生成测试用例数 |
| 基础设施覆盖率 | 10% (仅HTTP) | 80% (多协议) | 支持的协议数量 |
| 协作效率提升 | 无协作 | 支持5人同时编辑 | 并行编辑用户数 |
| 测试维护成本 | 100% | 降低50% | 版本管理降低的返工时间 |
| 用户满意度 | 70% | 90% | NPS评分 |

### 2. 技术指标

| 指标 | 当前值 | 目标值 | 衡量方式 |
|------|--------|--------|---------|
| 工作流执行成功率 | 95% | 98% | 成功执行数/总执行数 |
| API响应时间 | <500ms | <300ms | P95延迟 |
| 并发执行能力 | 100 | 1000 | 同时执行测试数 |
| 系统可用性 | 99.5% | 99.9% | Uptime |
| 测试覆盖率 | 60% | 80% | Code coverage |

### 3. AI质量指标

| 指标 | 目标值 | 衡量方式 |
|------|--------|---------|
| AI生成准确率 | >70% | 人工审核通过率 |
| AI响应时间 | <10s | API响应时间 |
| AI置信度阈值 | 0.7 | 置信度分数 |
| Prompt模板数 | >20个 | 可用模板数量 |

### 4. 团队协作指标

| 指标 | 目标值 | 衡量方式 |
|------|--------|---------|
| 协作会话数 | >1000/月 | WebSocket连接数 |
| 冲突解决时间 | <5分钟 | 锁定到解决的平均时间 |
| 版本回滚成功率 | 100% | 回滚成功次数/总回滚次数 |
| 协作用户活跃度 | >60% | 有协作行为的用户占比 |

---

## 风险与应对

### 风险1: AI生成质量不达标

**风险描述**: AI生成的测试用例质量不稳定，准确率低于60%，影响用户体验。

**影响程度**: 高

**发生概率**: 中

**应对策略**:
- **预防**:
  - Prompt工程：建立Prompt模板库，持续优化
  - Few-shot learning：提供高质量示例
  - 人工审核机制：初始阶段强制人工确认
- **缓解**:
  - 置信度阈值：低于0.7的自动生成结果提示用户审核
  - A/B测试：对比不同模型和Prompt的效果
  - 用户反馈闭环：收集用户反馈持续优化

**应急预案**:
- 如果3个月后准确率仍低于60%，暂停自动生成功能，改为人工+建议模式
- 引入多个AI模型备选(GPT-4, Claude, 文心一言)

### 风险2: 基础设施测试稳定性问题

**风险描述**: Redis/Kafka/ES测试由于网络、环境问题导致不稳定，执行成功率低于90%。

**影响程度**: 中

**发生概率**: 中

**应对策略**:
- **预防**:
  - 连接池管理：合理配置连接池大小和超时
  - 健康检查：定期检测基础设施可用性
  - 重试机制：智能重试策略
- **缓解**:
  - 异步执行：长时间测试异步化，避免阻塞
  - 结果缓存：缓存成功结果，减少重复执行
  - 熔断机制：失败率达到阈值时暂停测试

**应急预案**:
- 对稳定性差的测试标记为"不稳定"，降低执行优先级
- 提供本地Mock模式，用于开发环境测试

### 风险3: 实时协作性能瓶颈

**风险描述**: 多人同时编辑时，WebSocket消息延迟高，用户体验差。

**影响程度**: 中

**发生概率**: 低

**应对策略**:
- **预防**:
  - WebSocket优化：消息压缩、批量发送
  - OT/CRDT算法优化：减少冲突解决时间
  - 边缘节点：使用CDN加速WebSocket连接
- **缓解**:
  - 限制同时编辑人数：单文档最多5人
  - 消息队列削峰：使用Redis Stream缓冲消息
  - 降级方案：高负载时降级为展示模式

**应急预案**:
- 如果延迟持续>2秒，切换到轮询模式
- 提供"只读模式"，用户可以查看但无法编辑

### 风险4: 版本管理复杂度

**风险描述**: Git-based版本管理引入额外复杂度，用户学习成本高，使用率低。

**影响程度**: 低

**发生概率**: 中

**应对策略**:
- **预防**:
  - 零配置：Git操作自动完成，用户无感知
  - 简化概念：只暴露"保存版本"、"查看历史"等简单操作
  - 可视化差异：提供友好的diff展示
- **缓解**:
  - 在线教程：提供视频和图文教程
  - 一键回滚：提供简单的一键回滚按钮
  - 版本标签：允许用户为重要版本打标签

**应急预案**:
- 如果使用率低于20%，降级为简单快照模式
- 提供"导出"功能，用户可以导出历史版本

### 风险5: 资源成本超预算

**风险描述**: AI API调用、浏览器实例、容器化执行环境导致运维成本超出预算。

**影响程度**: 高

**发生概率**: 中

**应对策略**:
- **预防**:
  - 配额管理：限制每个租户/用户的AI调用次数
  - 实例池化：复用浏览器实例，减少创建销毁开销
  - 自动扩容：根据负载自动调整资源，避免过度预配
- **缓解**:
  - 成本监控：实时监控各项成本指标
  - 费用告警：成本超阈值时发送告警
  - 优先级调度：优先保证付费用户资源

**应急预案**:
- 如果成本超过预算150%，限制AI功能的使用
- 提供本地执行选项，用户可以用自己的资源运行

---

## 附录

### 附录A: 术语表

| 术语 | 解释 |
|------|------|
| AI Request | 向AI服务发送的请求，包含Prompt和上下文 |
| Prompt Template | 预定义的Prompt模板，包含变量占位符 |
| Few-shot Learning | 提供少量示例，让AI学习模式 |
| Operational Transformation | 用于实时协作的文本编辑算法 |
| CRDT | Conflict-free Replicated Data Type，分布式数据一致性算法 |
| E2E测试 | End-to-End测试，端到端的完整流程测试 |
| DAG | Directed Acyclic Graph，有向无环图 |
| NPS | Net Promoter Score，净推荐值 |

### 附录B: 依赖的外部服务

| 服务 | 用途 | 成本估算 | 备注 |
|------|------|---------|------|
| Google Gemini | AI测试用例生成 | $0.001/1K tokens | 配额: 1M tokens/day |
| Playwright | 浏览器自动化 | 免费 | 开源 |
| Redis | 缓存与消息队列 | $0.1/GB | 自托管 |
| MinIO | 对象存储(截图/视频) | 自托管 | S3兼容 |

### 附录C: 参考文档

1. [Gemini API Documentation](https://ai.google.dev/docs)
2. [Playwright-Go GitHub](https://github.com/playwright-community/playwright-go)
3. [Yjs Documentation](https://docs.yjs.dev/)
4. [Operational Transformation](https://operational-transformation.github.io/)

### 附录D: 技术选型对比

#### AI模型对比

| 模型 | 成本 | 速度 | 质量 | 推荐理由 |
|------|------|------|------|---------|
| Gemini 1.5 Pro | 中 | 快 | 高 | 综合性能最佳 |
| Gemini 1.5 Flash | 低 | 很快 | 中 | 成本敏感场景 |
| GPT-4 | 高 | 中 | 很高 | 最高质量，备用 |
| Claude 3.5 Sonnet | 高 | 中 | 高 | 备用 |

#### 浏览器自动化对比

| 工具 | 语言 | 维护 | 推荐指数 | 理由 |
|------|------|------|---------|------|
| Playwright | Go/Python/Node | 活跃 | ⭐⭐⭐⭐⭐ | API设计优秀，多浏览器 |
| Selenium | 多语言 | 活跃 | ⭐⭐⭐⭐ | 生态成熟，但API较旧 |
| ChromeDP | Go | 一般 | ⭐⭐⭐ | 仅Chrome，文档少 |

---

**文档维护者**: 后端架构组
**下次评审时间**: 2025-12-31
**变更历史**:
- 2025-11-27: v1.0 初始版本

---

**审核与批准**:

| 角色 | 姓名 | 签名 | 日期 |
|------|------|------|------|
| 技术负责人 | | | |
| 产品负责人 | | | |
| 架构委员会 | | | |
