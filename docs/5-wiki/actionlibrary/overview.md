# Action Library - 动作库模块概览

**版本**: 0.1 (规划中)
**最后更新**: 2025-11-26
**维护者**: 开发团队
**状态**: ⏳ 计划中

---

## 目录

1. [模块简介](#模块简介)
2. [核心概念](#核心概念)
3. [规划的代码路径](#规划的代码路径)
4. [规划的数据模型](#规划的数据模型)
5. [规划的核心流程](#规划的核心流程)
6. [规划的API接口](#规划的api接口)
7. [与其他模块的关系](#与其他模块的关系)
8. [实施计划](#实施计划)

---

## 模块简介

> **注意**: 本模块当前处于规划阶段,以下内容为设计方案,尚未实施。

动作库模块负责管理和维护可复用的工作流动作模板,提供分层的动作资源库(System/Platform/Tenant),支持拖拽式编排和快速组装测试流程。

### 主要功能 (规划)

- **动作模板管理**: 创建、编辑、发布可复用的Action模板
- **分层资源库**: System层(系统内置)、Platform层(平台共享)、Tenant层(租户私有)
- **分类组织**: 按功能分类(Network/Database/Messaging/Transform/Control等)
- **拖拽集成**: 从库中拖拽Action到Workflow编辑器
- **参数配置**: 动态参数定义,支持变量插值
- **版本管理**: Action模板的版本控制和变更追踪
- **智能推荐**: 基于使用频率和上下文推荐相关Action

### 适用场景

- **快速编排**: 从Action库拖拽组装工作流,提升编排效率
- **最佳实践**: 封装常用测试步骤为标准Action,统一最佳实践
- **知识沉淀**: 将专家经验固化为Action模板,降低学习成本
- **跨项目复用**: Platform层Action可跨项目共享,减少重复开发
- **自定义扩展**: Tenant可创建私有Action满足特定需求

---

## 核心概念

### 概念1: ActionTemplate (动作模板)

**定义**: 可复用的工作流步骤定义,包含配置Schema、默认参数、执行逻辑引用等。

**属性**:
- `templateId` (String) - 模板唯一标识符
- `name` (String) - 动作名称
- `displayName` (String) - 显示名称(支持多语言)
- `category` (String) - 分类: Network/Database/Messaging/Transform/Control/Assert
- `scope` (String) - 作用域: system(系统), platform(平台), tenant(租户)
- `icon` (String) - 图标名称(用于UI展示)
- `description` (Text) - 详细描述
- `version` (String) - 版本号(如1.0.0)
- `configSchema` (JSONB) - 配置项的JSON Schema定义
- `defaultConfig` (JSONB) - 默认配置值
- `executor` (String) - 执行器类型: http/command/script/builtin
- `executorConfig` (JSONB) - 执行器特定配置
- `tags` (Array) - 标签数组

**示例 - HTTP请求Action**:
```json
{
  "templateId": "action-http-request",
  "name": "http-request",
  "displayName": "HTTP 请求",
  "category": "Network",
  "scope": "system",
  "icon": "globe",
  "description": "发送HTTP请求并返回响应",
  "version": "1.0.0",
  "configSchema": {
    "type": "object",
    "required": ["method", "url"],
    "properties": {
      "method": {
        "type": "string",
        "enum": ["GET", "POST", "PUT", "DELETE", "PATCH"],
        "default": "GET",
        "description": "HTTP方法"
      },
      "url": {
        "type": "string",
        "description": "请求URL,支持变量插值 {{baseUrl}}/api/users"
      },
      "headers": {
        "type": "object",
        "description": "请求头"
      },
      "body": {
        "type": "object",
        "description": "请求体(JSON)"
      },
      "timeout": {
        "type": "integer",
        "default": 30000,
        "description": "超时时间(毫秒)"
      }
    }
  },
  "defaultConfig": {
    "method": "GET",
    "headers": {
      "Content-Type": "application/json"
    },
    "timeout": 30000
  },
  "executor": "http",
  "executorConfig": {
    "retryOnFailure": true,
    "maxRetries": 3
  },
  "tags": ["network", "api", "http"]
}
```

**示例 - 数据库查询Action**:
```json
{
  "templateId": "action-db-query",
  "name": "database-query",
  "displayName": "数据库查询",
  "category": "Database",
  "scope": "platform",
  "icon": "database",
  "description": "执行SQL查询并返回结果集",
  "version": "1.0.0",
  "configSchema": {
    "type": "object",
    "required": ["dsn", "query"],
    "properties": {
      "dsn": {
        "type": "string",
        "description": "数据库连接字符串,支持从环境变量读取 {{env.DB_DSN}}"
      },
      "query": {
        "type": "string",
        "description": "SQL查询语句"
      },
      "timeout": {
        "type": "integer",
        "default": 60000,
        "description": "查询超时(毫秒)"
      }
    }
  },
  "defaultConfig": {
    "timeout": 60000
  },
  "executor": "database",
  "executorConfig": {
    "driver": "postgres"
  },
  "tags": ["database", "sql", "query"]
}
```

### 概念2: 三层资源架构

**定义**: Action模板按作用域分为三层,控制可见性和权限。

```
┌─────────────────────────────────────────────────┐
│ System Layer (系统层)                            │
│ - 内置Action模板                                  │
│ - 所有租户可见,不可修改                           │
│ - 示例: HTTP Request, Database Query, Assert    │
└─────────────────────────────────────────────────┘
                   ↓ 继承
┌─────────────────────────────────────────────────┐
│ Platform Layer (平台层)                          │
│ - 平台管理员创建的共享Action                      │
│ - 所有租户可见,可复制到Tenant层修改               │
│ - 示例: 发送钉钉通知, 调用企业微信接口            │
└─────────────────────────────────────────────────┘
                   ↓ 继承
┌─────────────────────────────────────────────────┐
│ Tenant Layer (租户层)                            │
│ - 租户私有Action                                  │
│ - 仅本租户可见,可自由编辑                         │
│ - 示例: 调用内部系统API, 特定业务流程            │
└─────────────────────────────────────────────────┘
```

**可见性规则**:
- Tenant用户: 可见 System + Platform + 自己的Tenant Action
- Platform Admin: 可见 System + Platform (可管理Platform层)
- System Admin: 可见所有层级 (可管理System层)

**继承与覆盖**:
- Tenant可以"复制"Platform Action到自己的层级,修改后不影响原模板
- 不允许跨层级修改(Tenant不能改System/Platform Action)

### 概念3: Action分类体系

**定义**: 按功能将Action划分为不同类别,便于查找和管理。

**标准分类**:

| 分类 | 英文名称 | 说明 | 示例Action |
|------|---------|------|-----------|
| **Network** | 网络操作 | HTTP请求、WebSocket、gRPC等 | HTTP Request, WebSocket Connect |
| **Database** | 数据库操作 | SQL查询、NoSQL操作等 | MySQL Query, MongoDB Find |
| **Messaging** | 消息通知 | 邮件、短信、IM等 | Send Email, Dingtalk Notify |
| **Transform** | 数据转换 | JSON/XML转换、加密解密等 | JSON Parse, Base64 Encode |
| **Control** | 流程控制 | 条件判断、循环、等待等 | If-Else, Loop, Wait |
| **Assert** | 断言验证 | 响应验证、数据校验等 | Assert Equals, Assert Contains |
| **TestCase** | 测试用例 | 调用其他测试用例 | Run TestCase |
| **Script** | 脚本执行 | JavaScript/Python等 | Run JavaScript, Run Python |
| **Custom** | 自定义 | 用户自定义Action | Custom Action |

**UI展示**:
```
ActionLibrary Sidebar:
┌──────────────────┐
│ [搜索框]          │
├──────────────────┤
│ 📡 Network (15)  │  ← 可折叠
│   └ HTTP Request │
│   └ WebSocket... │
├──────────────────┤
│ 🗄️ Database (8)  │
│   └ MySQL Query  │
│   └ MongoDB...   │
├──────────────────┤
│ 📬 Messaging (5) │
│ 🔄 Transform (12)│
│ ⚙️ Control (6)   │
│ ✓ Assert (10)    │
│ 📋 TestCase (3)  │
│ 🔧 Custom (20)   │
└──────────────────┘
```

### 概念4: 动态参数配置

**定义**: Action模板通过JSON Schema定义可配置参数,支持变量插值和环境变量引用。

**参数来源**:
1. **configSchema**: 定义参数类型、默认值、校验规则
2. **用户输入**: 在Workflow编辑器中配置具体值
3. **变量插值**: 使用`{{varName}}`引用workflow变量
4. **环境变量**: 使用`{{env.VAR_NAME}}`引用环境变量

**参数校验**:
```go
// 后端验证逻辑
func ValidateActionConfig(template *ActionTemplate, userConfig map[string]interface{}) error {
    schema := template.ConfigSchema

    // 使用JSON Schema验证器
    result := jsonschema.Validate(schema, userConfig)
    if !result.Valid {
        return fmt.Errorf("配置验证失败: %v", result.Errors)
    }

    // 检查required字段
    // 检查enum约束
    // 检查数值范围

    return nil
}
```

**UI动态生成**:
```typescript
// 前端根据configSchema自动生成表单
const ActionConfigForm = ({ template, value, onChange }) => {
    const schema = template.configSchema;

    return (
        <Form>
            {Object.keys(schema.properties).map(key => {
                const prop = schema.properties[key];

                // 根据类型渲染不同组件
                if (prop.enum) {
                    return <Select options={prop.enum} />;
                } else if (prop.type === 'string') {
                    return <Input placeholder={prop.description} />;
                } else if (prop.type === 'number') {
                    return <NumberInput />;
                }
            })}
        </Form>
    );
};
```

### 概念5: 执行器模型

**定义**: Action模板通过executor字段指定执行逻辑,支持多种执行器类型。

**执行器类型**:

1. **http**: HTTP请求执行器
```go
type HTTPExecutor struct{}

func (e *HTTPExecutor) Execute(ctx *ExecutionContext, config map[string]interface{}) (*Result, error) {
    method := config["method"].(string)
    url := config["url"].(string)

    // 发送HTTP请求
    resp, err := http.NewRequest(method, url, nil)
    // ...
}
```

2. **database**: 数据库执行器
```go
type DatabaseExecutor struct{}

func (e *DatabaseExecutor) Execute(ctx *ExecutionContext, config map[string]interface{}) (*Result, error) {
    dsn := config["dsn"].(string)
    query := config["query"].(string)

    // 连接数据库并执行查询
    db := sql.Open("postgres", dsn)
    rows := db.Query(query)
    // ...
}
```

3. **script**: 脚本执行器
```go
type ScriptExecutor struct{}

func (e *ScriptExecutor) Execute(ctx *ExecutionContext, config map[string]interface{}) (*Result, error) {
    language := config["language"].(string) // "javascript" | "python"
    code := config["code"].(string)

    // 执行脚本代码
    if language == "javascript" {
        return e.executeJS(code, ctx)
    }
    // ...
}
```

4. **builtin**: 内置执行器(Assert, Transform等)
```go
type AssertExecutor struct{}

func (e *AssertExecutor) Execute(ctx *ExecutionContext, config map[string]interface{}) (*Result, error) {
    operator := config["operator"].(string) // "equals" | "contains" | "gt"
    expected := config["expected"]
    actual := config["actual"]

    // 执行断言逻辑
    if !compare(actual, expected, operator) {
        return nil, fmt.Errorf("断言失败: %v %s %v", actual, operator, expected)
    }
    return &Result{Status: "passed"}, nil
}
```

**执行器注册**:
```go
var executorRegistry = map[string]Executor{
    "http":     &HTTPExecutor{},
    "database": &DatabaseExecutor{},
    "script":   &ScriptExecutor{},
    "builtin":  &BuiltinExecutor{},
}

func GetExecutor(executorType string) (Executor, error) {
    executor, ok := executorRegistry[executorType]
    if !ok {
        return nil, fmt.Errorf("未知执行器: %s", executorType)
    }
    return executor, nil
}
```

### 概念6: 拖拽式编排

**定义**: 从Action Library拖拽Action到Workflow编辑器画布,快速组装工作流。

**拖拽流程**:
```
1. 用户在ActionLibrary Sidebar点击Action
2. onDragStart → 设置dragData = ActionTemplate
3. 拖动到Workflow画布
4. onDrop → 创建新的WorkflowStep
   4.1 复制ActionTemplate的configSchema
   4.2 使用defaultConfig作为初始配置
   4.3 生成唯一stepId
   4.4 添加到workflow.steps数组
5. 渲染新的Step节点
6. 用户双击Step → 打开配置面板
7. 根据configSchema动态生成表单
8. 用户填写参数 → 保存到step.config
```

**前端实现**:
```typescript
// ActionLibrary.tsx
const ActionCard = ({ template }: { template: ActionTemplate }) => {
    const handleDragStart = (e: DragEvent) => {
        e.dataTransfer.setData('action-template', JSON.stringify(template));
        e.dataTransfer.effectAllowed = 'copy';
    };

    return (
        <div
            draggable
            onDragStart={handleDragStart}
            className="action-card"
        >
            <Icon name={template.icon} />
            <span>{template.displayName}</span>
        </div>
    );
};

// WorkflowCanvas.tsx
const WorkflowCanvas = () => {
    const handleDrop = (e: DragEvent) => {
        const templateJson = e.dataTransfer.getData('action-template');
        const template = JSON.parse(templateJson);

        // 创建新步骤
        const newStep = {
            id: generateStepId(),
            name: template.name,
            type: template.executor, // 'http', 'database', etc.
            config: template.defaultConfig,
            position: { x: e.clientX, y: e.clientY }
        };

        addStepToWorkflow(newStep);
    };

    return (
        <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className="workflow-canvas"
        >
            {/* Workflow节点 */}
        </div>
    );
};
```

---

## 规划的代码路径

### 后端代码 (规划)

| 分层 | 路径 | 职责 |
|------|------|------|
| **模型层** | `nextest-platform/internal/models/action_template.go` | ActionTemplate模型定义 |
| **仓储层** | `nextest-platform/internal/repository/action_template_repo.go` | 数据访问接口 |
| **服务层** | `nextest-platform/internal/service/action_template_service.go` | 模板管理、权限控制 |
| **处理层** | `nextest-platform/internal/handler/action_template_handler.go` | HTTP API处理器 |
| **执行器** | `nextest-platform/internal/workflow/executors/` | 各类型执行器实现 |
| **Schema验证** | `nextest-platform/internal/actionlibrary/schema_validator.go` | JSON Schema验证 |
| **预置模板** | `nextest-platform/internal/actionlibrary/builtin_templates.go` | System层内置Action |

---

### 前端代码 (规划)

| 分层 | 路径 | 职责 |
|------|------|------|
| **页面组件** | `NextTestPlatformUI/components/ActionLibrary.tsx` | 动作库主页(已存在,需增强) |
| **UI组件** | `NextTestPlatformUI/components/actionlibrary/ActionCard.tsx` | Action卡片组件 |
| **UI组件** | `NextTestPlatformUI/components/actionlibrary/ActionEditor.tsx` | Action编辑器 |
| **UI组件** | `NextTestPlatformUI/components/actionlibrary/ActionLibrarySidebar.tsx` | Workflow编辑器侧边栏 |
| **UI组件** | `NextTestPlatformUI/components/actionlibrary/ConfigForm.tsx` | 动态配置表单生成器 |

---

## 规划的数据模型

### 核心实体

#### ActionTemplate (动作模板)

**数据库表**: `action_templates` (规划)

**字段说明**:

| 字段 | 类型 | 说明 | 是否必填 |
|------|------|---------|---------|
| id | uint | 自增主键 | ✅ |
| template_id | string | 模板唯一ID (UUID) | ✅ |
| tenant_id | string | 租户ID (scope=tenant时必填) | ❌ |
| project_id | string | 项目ID (项目级隔离) | ❌ |
| name | string | Action名称 (如http-request) | ✅ |
| display_name | string | 显示名称 (如HTTP 请求) | ✅ |
| category | string | 分类 (Network/Database等) | ✅ |
| scope | string | 作用域 (system/platform/tenant) | ✅ |
| icon | string | 图标名称 | ❌ |
| description | text | 详细描述 | ❌ |
| version | string | 版本号 (如1.0.0) | ✅ |
| config_schema | jsonb | 配置Schema (JSON Schema) | ✅ |
| default_config | jsonb | 默认配置 | ❌ |
| executor | string | 执行器类型 (http/database/script/builtin) | ✅ |
| executor_config | jsonb | 执行器特定配置 | ❌ |
| tags | jsonb | 标签数组 | ❌ |
| usage_count | int | 使用次数统计 | ❌ |
| last_used_at | timestamp | 最后使用时间 | ❌ |
| is_published | bool | 是否已发布,默认true | ❌ |
| parent_template_id | string | 父模板ID (复制时记录) | ❌ |
| created_by | string | 创建者ID | ❌ |
| created_at | timestamp | 创建时间 | ✅ |
| updated_at | timestamp | 更新时间 | ✅ |
| deleted_at | timestamp | 软删除时间 | ❌ |

**索引**:
- `template_id`: 唯一索引
- `tenant_id`, `scope`: 联合索引 (多租户查询)
- `category`: 普通索引 (分类查询)
- `scope`: 普通索引 (按作用域过滤)
- `is_published`: 普通索引 (只查询已发布)

**关联关系**:
- `ParentTemplate ActionTemplate` - 父模板 (belongs to, 如果是复制的)

#### ActionTemplateVersion (动作模板版本)

**数据库表**: `action_template_versions` (规划)

**字段说明**:

| 字段 | 类型 | 说明 | 是否必填 |
|------|------|---------|---------|
| id | uint | 自增主键 | ✅ |
| template_id | string | 关联模板ID | ✅ |
| version | string | 版本号 | ✅ |
| config_schema | jsonb | 此版本的Schema | ✅ |
| default_config | jsonb | 此版本的默认配置 | ❌ |
| changelog | text | 变更日志 | ❌ |
| created_at | timestamp | 创建时间 | ✅ |
| deprecated_at | timestamp | 废弃时间 | ❌ |

**用途**: 支持Action模板的版本管理和兼容性处理

---

## 规划的核心流程

### 流程1: 创建System层Action模板 (内置)

**触发条件**: 系统初始化或数据库迁移

**流程步骤**:
```
1. 定义内置Action模板列表
   builtin_templates.go:
   - HTTP Request
   - Database Query
   - Assert Equals
   - JSON Parse
   - Wait
   ... (约20个内置Action)

2. 系统启动时执行InitBuiltinTemplates()
   2.1 检查数据库是否已有System Action
   2.2 如果没有 → 批量插入
       For each template:
       - templateId = uuid.New()
       - scope = "system"
       - isPublished = true
       - Save to action_templates

3. 前端加载时自动获取System Action
   GET /api/v2/action-library/templates?scope=system

4. 渲染在ActionLibrary Sidebar
```

**内置Action列表示例**:
```go
var builtinTemplates = []ActionTemplate{
    {
        Name:        "http-request",
        DisplayName: "HTTP 请求",
        Category:    "Network",
        Scope:       "system",
        Icon:        "globe",
        Executor:    "http",
        ConfigSchema: httpRequestSchema,
        DefaultConfig: map[string]interface{}{
            "method": "GET",
            "timeout": 30000,
        },
    },
    {
        Name:        "database-query",
        DisplayName: "数据库查询",
        Category:    "Database",
        Scope:       "system",
        Icon:        "database",
        Executor:    "database",
        ConfigSchema: databaseQuerySchema,
    },
    // ... 更多内置Action
}
```

### 流程2: 创建Platform/Tenant层Action模板

**触发条件**: 管理员在ActionLibrary页面点击"新建Action"

**流程步骤**:
```
1. 用户打开ActionEditor Modal
2. 填写基本信息
   - name: "send-dingtalk-notify"
   - displayName: "发送钉钉通知"
   - category: "Messaging"
   - scope: "platform" (Platform Admin) 或 "tenant" (Tenant User)
   - executor: "http"
3. 定义configSchema
   3.1 添加参数: webhook_url (string, required)
   3.2 添加参数: message (string, required)
   3.3 添加参数: at_mobiles (array, optional)
4. 设置defaultConfig
   {
     "at_mobiles": []
   }
5. 配置executorConfig (HTTP执行器)
   {
     "method": "POST",
     "url": "{{webhook_url}}",
     "body": {
       "msgtype": "text",
       "text": {
         "content": "{{message}}"
       },
       "at": {
         "atMobiles": "{{at_mobiles}}"
       }
     }
   }
6. 提交 → POST /api/v2/action-library/templates
7. 后端验证
   7.1 检查name的唯一性 (同scope下)
   7.2 验证configSchema格式
   7.3 验证用户权限
       - Platform Admin → 允许创建scope=platform
       - Tenant User → 只能创建scope=tenant
8. 创建ActionTemplate记录
   8.1 生成templateId
   8.2 设置created_by
   8.3 isPublished=false (初始为草稿)
9. 返回201 Created
10. 前端刷新Action库
```

**涉及组件**:
- 前端: `ActionLibrary.tsx`, `ActionEditor.tsx`, `ConfigForm.tsx`
- 后端: `action_template_handler.go:CreateTemplate()`
- 数据库: `action_templates`

### 流程3: 从Action Library拖拽到Workflow

**触发条件**: 用户在Workflow编辑器中从ActionLibrary Sidebar拖拽Action

**流程步骤**:
```
1. 用户打开Workflow编辑器 (Advanced Mode)
2. 左侧显示ActionLibrary Sidebar
   2.1 加载可用Action: GET /api/v2/action-library/templates
       - System Action (所有人可见)
       - Platform Action (当前平台)
       - Tenant Action (当前租户)
   2.2 按category分组展示
   2.3 支持搜索和过滤

3. 用户拖拽Action到画布
   3.1 onDragStart → 设置dragData
       {
         type: 'action-template',
         template: {...ActionTemplate对象}
       }
   3.2 onDragOver → 显示可放置位置
   3.3 onDrop → 创建WorkflowStep
       {
         id: generateStepId(),
         name: template.displayName,
         type: template.executor,
         templateId: template.templateId, // 关联模板
         config: template.defaultConfig,  // 初始配置
         position: dropPosition
       }

4. 渲染新Step节点在画布上
5. 用户双击Step → 打开配置面板
   5.1 加载template.configSchema
   5.2 动态生成表单
       For each property in schema:
       - 渲染对应输入组件
       - 填充当前step.config值
       - 显示参数说明
   5.3 用户修改参数
   5.4 实时验证 (基于configSchema)
   5.5 保存 → 更新step.config

6. 保存Workflow定义
   POST /api/v2/workflows/:id
   {
     "steps": [
       {
         "id": "step-1",
         "templateId": "action-http-request",
         "config": {
           "method": "POST",
           "url": "{{baseUrl}}/api/users",
           "body": {...}
         }
       }
     ]
   }
```

**涉及组件**:
- 前端:
  - `ActionLibrarySidebar.tsx` - 拖拽源
  - `WorkflowCanvas.tsx` - 拖拽目标
  - `StepConfigPanel.tsx` - 配置面板
  - `ConfigForm.tsx` - 动态表单生成
- 后端: `workflow_handler.go:UpdateWorkflow()`

### 流程4: 执行引用ActionTemplate的Workflow

**触发条件**: 用户执行包含ActionTemplate的Workflow

**流程步骤**:
```
1. 用户点击"Run Workflow"
   POST /api/v2/workflows/:id/execute

2. 后端加载Workflow定义
   2.1 解析steps数组
   2.2 遇到有templateId的step:
       {
         "id": "step-1",
         "templateId": "action-http-request",
         "config": {
           "method": "POST",
           "url": "{{baseUrl}}/users"
         }
       }

3. 加载ActionTemplate
   template := actionTemplateRepo.GetByID(step.TemplateId)
   if template == nil {
     return Error("Action模板不存在")
   }

4. 验证step.config是否符合template.configSchema
   err := ValidateActionConfig(template, step.Config)
   if err != nil {
     return Error("配置验证失败: %v", err)
   }

5. 获取执行器
   executor := GetExecutor(template.Executor)
   // 根据template.executor → http/database/script/builtin

6. 合并executorConfig和step.config
   finalConfig := mergeConfig(template.ExecutorConfig, step.Config)

7. 执行Action
   result := executor.Execute(ctx, finalConfig)

8. 更新统计
   template.UsageCount++
   template.LastUsedAt = now()
   actionTemplateRepo.Update(template)

9. 返回执行结果
```

**涉及组件**:
- `workflow/executor.go:Execute()`
- `action_template_service.go:GetTemplate()`
- `workflow/executors/http_executor.go`
- `action_templates` 表 (更新统计)

### 流程5: 复制Platform Action到Tenant层

**触发条件**: Tenant用户想基于Platform Action创建自定义版本

**流程步骤**:
```
1. 用户在ActionLibrary中查看Platform Action
2. 点击"复制到我的库"按钮
3. 前端发送请求
   POST /api/v2/action-library/templates/:id/fork
   {
     "customizations": {
       "displayName": "自定义钉钉通知",
       "description": "增加了@所有人功能"
     }
   }

4. 后端处理复制
   4.1 加载源模板
       sourceTemplate := repo.GetByID(templateId)
   4.2 验证权限
       if sourceTemplate.Scope == "system" && !user.IsSystemAdmin {
         return Error("系统Action不允许复制")
       }
   4.3 创建新模板
       newTemplate := sourceTemplate.Clone()
       newTemplate.TemplateId = uuid.New()
       newTemplate.Scope = "tenant"
       newTemplate.TenantId = currentUser.TenantId
       newTemplate.ParentTemplateId = sourceTemplate.TemplateId
       newTemplate.DisplayName = customizations.DisplayName
       newTemplate.Description = customizations.Description
   4.4 保存
       repo.Create(newTemplate)

5. 返回新模板
6. 前端刷新,新Action出现在Tenant层
7. 用户可以编辑这个副本
```

**涉及组件**:
- 前端: `ActionLibrary.tsx`, `ActionCard.tsx`
- 后端: `action_template_handler.go:ForkTemplate()`
- 数据库: `action_templates` (新增记录,记录parent_template_id)

---

## 规划的API接口

### 核心端点

#### 创建Action模板

```http
POST /api/v2/action-library/templates
Content-Type: application/json

{
  "name": "send-email",
  "displayName": "发送邮件",
  "category": "Messaging",
  "scope": "platform",
  "icon": "mail",
  "description": "通过SMTP发送电子邮件",
  "version": "1.0.0",
  "executor": "script",
  "configSchema": {
    "type": "object",
    "required": ["to", "subject", "body"],
    "properties": {
      "to": {"type": "string", "description": "收件人邮箱"},
      "subject": {"type": "string", "description": "邮件主题"},
      "body": {"type": "string", "description": "邮件正文"}
    }
  },
  "defaultConfig": {},
  "executorConfig": {
    "language": "javascript",
    "code": "sendEmail(config.to, config.subject, config.body)"
  },
  "tags": ["email", "notification"]
}
```

**响应**:
```json
{
  "templateId": "action-uuid-123",
  "name": "send-email",
  "displayName": "发送邮件",
  "scope": "platform",
  "createdAt": "2025-11-26T10:00:00Z"
}
```

#### 获取Action模板列表

```http
GET /api/v2/action-library/templates?scope=system,platform,tenant&category=Network&published=true
```

**响应**:
```json
{
  "data": [
    {
      "templateId": "action-http-request",
      "name": "http-request",
      "displayName": "HTTP 请求",
      "category": "Network",
      "scope": "system",
      "icon": "globe",
      "usageCount": 1250
    },
    {
      "templateId": "action-dingtalk-notify",
      "name": "dingtalk-notify",
      "displayName": "钉钉通知",
      "category": "Messaging",
      "scope": "platform",
      "icon": "message-square",
      "usageCount": 85
    }
  ],
  "pagination": {
    "page": 1,
    "size": 50,
    "total": 65
  }
}
```

#### 获取单个模板详情

```http
GET /api/v2/action-library/templates/:templateId
```

**响应**: 完整的ActionTemplate对象,包含configSchema和executorConfig

#### 复制Action模板

```http
POST /api/v2/action-library/templates/:id/fork
Content-Type: application/json

{
  "customizations": {
    "displayName": "自定义HTTP请求",
    "description": "增加了重试机制"
  }
}
```

**响应**:
```json
{
  "templateId": "action-forked-uuid-456",
  "parentTemplateId": "action-http-request",
  "scope": "tenant",
  "tenantId": "tenant-001"
}
```

#### 发布/下架Action模板

```http
PUT /api/v2/action-library/templates/:id/publish
```

```http
PUT /api/v2/action-library/templates/:id/unpublish
```

#### 验证Action配置

```http
POST /api/v2/action-library/templates/:id/validate
Content-Type: application/json

{
  "config": {
    "method": "POST",
    "url": "https://api.example.com"
  }
}
```

**响应**:
```json
{
  "valid": true,
  "errors": []
}
```

---

## 与其他模块的关系

### 依赖关系

**本模块依赖** (规划):
- **Workflow模块** - Action模板被Workflow步骤引用
- **Tenant模块** - 三层资源架构需要租户ID隔离
- **User模块** - 权限控制 (谁能创建Platform层Action)

**本模块被依赖** (规划):
- **Workflow模块** - Workflow步骤引用ActionTemplate执行
- **TestCase模块** - TestCase可以引用Action模板 (如果支持)
- **Dashboard模块** - 显示Action使用统计和趋势

### 边界规则

**✅ 允许的调用**:
- Workflow可以调用 `ActionLibrary.GetTemplate(templateId)` 获取模板
- Workflow可以调用 `ActionLibrary.ValidateConfig(template, config)` 验证配置
- ActionLibrary可以调用 `Tenant.GetById()` 验证租户归属
- Dashboard可以调用 `ActionLibrary.GetUsageStats()` 获取使用统计

**❌ 禁止的调用**:
- ActionLibrary **不能**直接执行Workflow (只提供Action定义)
- ActionLibrary **不能**修改Workflow定义
- ActionLibrary **不能**跨租户访问其他租户的Action
- Workflow **不能**绕过ActionLibrary直接修改action_templates表

**调用流向**:
```
Workflow → ActionLibrary (获取模板定义)
ActionLibrary → Tenant (验证权限和归属)
Dashboard → ActionLibrary (读取统计数据)
ActionLibrary ← Executor Registry (注册执行器)
```

**数据隔离**:
- System Action: 所有租户可见
- Platform Action: 所有租户可见,Platform Admin可管理
- Tenant Action: 仅本租户可见,通过tenantId过滤

**详细边界定义**: [`docs/5-wiki/architecture/module-boundaries.md`](../architecture/module-boundaries.md)

---

## 实施计划

### Phase 1: 数据模型和基础CRUD (预计3周)

**目标**: 建立ActionTemplate数据模型和基本管理功能

**任务**:
1. 设计数据库表 (action_templates, action_template_versions)
2. 创建GORM模型和仓储层
3. 实现基本CRUD API
   - 创建/查询/更新/删除ActionTemplate
   - 按scope, category, tags过滤
4. 前端ActionLibrary主页基础版
   - 列表展示
   - 搜索和过滤
   - 创建/编辑/删除

**验收标准**:
- [ ] 数据库表创建完成并通过测试
- [ ] 可以手动创建和查询Action模板
- [ ] 前端可以展示Action列表并进行CRUD

### Phase 2: 内置Action和执行器 (预计4周)

**目标**: 实现System层内置Action和执行器框架

**任务**:
1. 实现ExecutorRegistry和Executor接口
2. 实现HTTPExecutor (支持GET/POST/PUT/DELETE)
3. 实现DatabaseExecutor (支持MySQL/PostgreSQL)
4. 实现ScriptExecutor (支持JavaScript)
5. 实现BuiltinExecutor (Assert, Transform, Wait等)
6. 创建20个内置Action模板
7. 系统启动时自动初始化System Action

**验收标准**:
- [ ] 所有执行器可以正常工作
- [ ] 20个System Action已预置
- [ ] 可以从后端执行Action并返回结果

### Phase 3: Workflow集成和拖拽编排 (预计4周)

**目标**: 实现Action Library与Workflow编辑器集成

**任务**:
1. 实现ActionLibrarySidebar组件
2. 实现拖拽交互 (drag & drop)
3. WorkflowStep引用templateId
4. 根据configSchema动态生成配置表单
5. Workflow执行时加载ActionTemplate
6. 配置验证 (基于JSON Schema)
7. 更新Action使用统计

**验收标准**:
- [ ] 可以从Sidebar拖拽Action到Workflow画布
- [ ] 配置表单自动生成且符合Schema
- [ ] Workflow执行正常调用Action模板
- [ ] 使用统计正确更新

### Phase 4: 三层资源架构和权限 (预计3周)

**目标**: 实现System/Platform/Tenant三层架构

**任务**:
1. 实现scope权限控制
   - System Admin可管理System层
   - Platform Admin可管理Platform层
   - Tenant User可管理Tenant层
2. 实现可见性规则
   - Tenant用户可见所有三层
   - Platform Admin可见System + Platform
3. 实现复制(Fork)功能
   - Platform → Tenant复制
   - 记录parent_template_id
4. 多租户隔离
   - Tenant Action按tenantId过滤
5. UI按层级分组展示

**验收标准**:
- [ ] 权限控制正确实施
- [ ] 不同角色看到正确的Action列表
- [ ] 可以复制Platform Action到Tenant层
- [ ] 多租户隔离正常工作

### Phase 5: 高级功能和优化 (预计3周)

**目标**: 版本管理和智能推荐

**任务**:
1. 实现Action版本管理
   - 记录变更历史
   - 支持版本回退
2. 智能推荐
   - 基于使用频率推荐
   - 基于上下文推荐相关Action
3. Action测试功能
   - 在编辑器中测试Action
   - Dry Run模式
4. 导入/导出
   - 导出Action库为JSON
   - 导入其他平台的Action模板
5. 使用分析
   - Action使用趋势图表
   - 最受欢迎Action排行

**验收标准**:
- [ ] 版本管理正常工作
- [ ] 推荐算法有效
- [ ] 可以测试Action执行结果
- [ ] 导入/导出功能完整

---

## 相关文档

### 技术规范
- **数据库设计**: 待实施后补充至 [`1-specs/database/schema.md#action-library`](../../1-specs/database/schema.md)
- **API文档**: 待实施后补充至 [`1-specs/api/v2-documentation.md#action-library-api`](../../1-specs/api/v2-documentation.md)

### 决策记录
- [前端架构设计](../../6-decisions/2024-11-25-frontend-architecture-design.md) - 包含Action Library UI设计
- [统一工作流架构](../../6-decisions/2024-11-24-unified-workflow-architecture.md) - Action Library作为核心组件

### 架构文档
- [模块边界定义](../architecture/module-boundaries.md) - Action Library定位为Extension Layer

### 外部参考
- **JSON Schema规范**: https://json-schema.org/
- **n8n Nodes**: https://docs.n8n.io/nodes/ (类似产品参考)
- **Zapier Actions**: https://zapier.com/apps (Action模板设计参考)

---

## 术语表

| 术语 | 说明 |
|------|------|
| Action Template | 动作模板,可复用的工作流步骤定义 |
| Executor | 执行器,负责执行Action的具体逻辑 |
| Config Schema | 配置Schema,JSON Schema定义Action的可配置参数 |
| Scope | 作用域,System/Platform/Tenant三层架构 |
| Fork | 复制,从Platform层复制Action到Tenant层 |
| Category | 分类,按功能划分Action (Network/Database等) |
| Builtin Action | 内置Action,System层预置的标准Action |

**完整术语表**: [`docs/5-wiki/glossary.md`](../glossary.md)

---

## 更新历史

| 日期 | 版本 | 变更说明 | 作者 |
|------|------|---------|------|
| 2025-11-26 | 0.1 | 初始版本,规划设计文档 | 开发团队 |

---

**维护提示**:
- 本文档为规划文档,实施后需更新为实际实现
- 当开始实施时,更新状态从"计划中"改为"开发中"
- 实施完成后,补充实际的代码路径和API端点
- 定期review规划内容,根据实际需求调整设计

---

## 常见问题 (规划)

### Q1: 为什么需要Action Library?

**A**: Action Library解决以下痛点:

1. **重复劳动**: 每次编写Workflow都要重新配置相同的步骤
2. **学习成本**: 新手不知道如何配置HTTP请求、数据库查询等
3. **最佳实践**: 难以统一和推广团队的最佳实践
4. **知识流失**: 专家经验无法沉淀和复用

**收益**:
- 拖拽式编排,5分钟组装一个复杂工作流
- 标准化Action,降低80%学习成本
- 跨项目复用,减少70%重复配置

### Q2: System/Platform/Tenant三层如何选择?

**A**:

| 层级 | 使用场景 | 谁可以创建 | 谁可以使用 | 示例 |
|------|---------|----------|----------|------|
| **System** | 通用基础Action | 系统管理员 | 所有用户 | HTTP Request, Database Query |
| **Platform** | 企业共享Action | 平台管理员 | 所有租户 | 钉钉通知, 企业微信通知 |
| **Tenant** | 租户专有Action | 租户用户 | 仅本租户 | 调用内部系统API, 特定业务流程 |

**决策树**:
```
是否所有用户都需要?
  └─ 是 → System
  └─ 否 → 是否跨租户共享?
            └─ 是 → Platform
            └─ 否 → Tenant
```

### Q3: 如何扩展新的Executor类型?

**A**: 实现Executor接口并注册:

```go
// 1. 实现Executor接口
type KafkaExecutor struct{}

func (e *KafkaExecutor) Execute(ctx *ExecutionContext, config map[string]interface{}) (*Result, error) {
    topic := config["topic"].(string)
    message := config["message"].(string)

    // 发送Kafka消息
    producer := kafka.NewProducer(config)
    err := producer.Send(topic, message)
    if err != nil {
        return nil, err
    }

    return &Result{
        Status: "success",
        Data: map[string]interface{}{
            "topic": topic,
            "offset": producer.Offset(),
        },
    }, nil
}

// 2. 注册到Registry
func init() {
    executorRegistry["kafka"] = &KafkaExecutor{}
}

// 3. 创建ActionTemplate使用新Executor
{
  "name": "kafka-send",
  "executor": "kafka",
  "configSchema": {
    "properties": {
      "topic": {"type": "string"},
      "message": {"type": "string"}
    }
  }
}
```

### Q4: Action配置支持哪些变量插值?

**A**: 支持3种变量:

1. **Workflow变量**: `{{varName}}`
```json
{
  "url": "{{baseUrl}}/api/users/{{userId}}"
}
```

2. **环境变量**: `{{env.VAR_NAME}}`
```json
{
  "api_key": "{{env.API_KEY}}"
}
```

3. **Step输出**: `{{steps.step-id.output.field}}`
```json
{
  "user_id": "{{steps.create-user.output.id}}"
}
```

**插值时机**: Workflow执行时,在调用Executor之前替换所有变量

### Q5: 如何处理Action配置的敏感信息?

**A**: 3种方案:

**方案1: 使用环境变量** (推荐)
```json
{
  "config": {
    "api_key": "{{env.SECRET_API_KEY}}"
  }
}
```
- 优点: 集中管理,支持环境切换
- 缺点: 需要先配置Environment

**方案2: 使用加密字段**
```json
{
  "config": {
    "password": "encrypted:AES256:xxxxxx"
  }
}
```
- 优点: 直接存储在Workflow定义中
- 缺点: 需要实现加密/解密逻辑

**方案3: 运行时输入**
```json
{
  "config": {
    "password": "{{input:请输入数据库密码}}"
  }
}
```
- 优点: 不存储敏感信息
- 缺点: 无法自动化执行

**推荐**: 生产环境使用方案1,测试环境可用方案3

### Q6: 复制(Fork)的Action模板会同步更新吗?

**A**: 不会自动同步。

**原因**: Fork是"复制"而非"引用",目的是让租户可以自由修改而不影响原模板。

**同步机制** (未来可实现):
- 记录parent_template_id
- 当父模板更新时发送通知
- 用户手动选择是否合并更新
- 类似Git的merge机制

**当前行为**:
```
1. Tenant Fork Platform Action
2. Tenant修改配置 → 不影响Platform原模板
3. Platform更新原模板 → Tenant的副本不会自动更新
4. 如需同步 → Tenant重新Fork一次
```

---

**规划审查时间**: 2026-Q1 (待Workflow模块稳定后启动实施)
