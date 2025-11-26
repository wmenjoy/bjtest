# 测试案例管理优化实施记录

## 概述
根据 `UNIFIED_WORKFLOW_ARCHITECTURE.md` 文档,对测试案例管理系统进行了架构优化,主要包括目录组织方式调整和统一架构类型定义。

## 已完成的改进

### 1. 目录组织方式调整 ✅

**改动内容:**
- 将目录组织从 `projects` 改为 `services/modules` 方式
- 支持 `backend/login/` 这样的层级结构

**修改文件:**

#### 前端
1. **`NextTestPlatformUI/types.ts`** (行 312-319)
   - 更新 `TestFolder` 接口
   - 将 `type` 从 `'project' | 'module' | 'folder'` 改为 `'service' | 'module' | 'folder'`
   - 添加 `folderType?: 'service' | 'module'` 元数据字段

2. **`NextTestPlatformUI/components/testcase/FolderTree.tsx`**
   - 更新 `onAddFolder` 参数类型: `'project' | 'module'` → `'service' | 'module'`
   - 添加两个按钮:新建 Service 和新建 Module
   - 更新显示文本: "All Projects" → "All Services"

3. **`NextTestPlatformUI/components/TestCaseManager.tsx`** (行 85-103)
   - 更新 `handleAddFolder` 函数
   - 支持 `'service' | 'module'` 类型
   - 添加 `folderType` 元数据到创建的文件夹

#### 后端
1. **`nextest-platform/internal/models/test_group.go`** (行 19-20)
   - 添加 `FolderType` 字段: `string gorm:"size:50;default:'folder'"`
   - 支持 service, module, folder 三种类型

2. **`nextest-platform/migrations/009_add_folder_type.sql`** (新文件)
   - 添加 `folder_type` 列到 `test_groups` 表
   - 创建索引以提升查询性能
   - 包含数据迁移逻辑,自动标记现有数据

---

### 2. 统一架构类型定义 ✅

根据统一架构文档,在前端添加了完整的类型定义系统。

**添加的类型 (NextTestPlatformUI/types.ts, 行 595-793):**

#### 核心类型
- **`Position`**: 高级模式下画布位置坐标
- **`DataMapper`**: 可视化数据流映射配置
- **`ActionParameter`**: Action 输入参数定义
- **`ActionOutput`**: Action 输出字段定义
- **`ActionTemplate`**: 可复用的 Action 模板定义
- **`MergeConfig`**: 并行分支合并配置
- **`Assertion`**: 测试断言定义
- **`WorkflowStep`**: 统一的工作流步骤定义
- **`UnifiedWorkflow`**: 统一的工作流/测试案例定义

#### WorkflowStep 特性支持

**数据流:**
- `actionTemplateId`: 引用 Action Template (推荐方式)
- `inputs`: 参数绑定 `{ "username": "{{testUser}}" }`
- `outputs`: 输出映射 `{ "authToken": "currentToken" }`
- `dataMappers`: 可视化数据映射配置

**控制流:**
- `dependsOn`: DAG 依赖关系
- `condition`: 条件表达式
- `loop`: 循环配置
- `branches`: 分支配置
- `children`: 嵌套步骤

**错误处理:**
- `onError`: 错误处理策略 (abort/continue/retry)
- `retryCount`: 重试次数
- `timeout`: 超时设置

**测试视角:**
- `assertions`: 断言配置数组

**UI 相关 (高级模式):**
- `position`: 节点在画布上的位置
- `collapsed`: 是否折叠
- `disabled`: 是否禁用

---

### 3. 数据库支持 ✅

#### Action Template 表结构
已存在的迁移文件 `005_add_action_templates.sql` 提供了完整的 Action Template 支持:
- 四层作用域: system, platform, organization, project
- 权限控制: `is_public`, `scope`
- 使用统计: `usage_count`
- 内置系统级模板:
  - HTTP GET/POST/PUT/DELETE
  - Command 执行
  - 等待/延迟
  - JSON 验证
  - 值提取
  - 变量设置
  - 条件分支

#### 模型已存在
`nextest-platform/internal/models/action_template.go` 已经实现了完整的 ActionTemplate 模型:
- 支持四层权限作用域
- 提供权限检查方法 `CanBeAccessedBy()`
- 使用 JSONB 存储配置模板
- 使用 JSONArray 存储参数和输出定义

---

### 4. 数据库问题修复 ✅

在实施过程中发现并修复了多个数据库问题:

#### 问题 1: 权限表为空
**现象:** 前端所有页面显示 "Access Denied" 错误
**根因:** `roles` 表为空,导致权限检查失败
**修复:**
- 执行 `005_add_users_roles.sql` 迁移脚本
- 插入 3 个默认角色: admin, editor, viewer
- 为所有角色添加 `VIEW_APIS` 权限

```sql
-- 默认角色
INSERT OR IGNORE INTO roles (role_id, name, description, permission_codes) VALUES
('admin', 'Administrator', 'Full system access', '["VIEW_DASHBOARD","VIEW_APIS","VIEW_CASES",...]'),
('editor', 'Editor', 'Can manage test cases', '["VIEW_DASHBOARD","VIEW_APIS","VIEW_CASES",...]'),
('viewer', 'Viewer', 'Read-only access', '["VIEW_DASHBOARD","VIEW_APIS","VIEW_CASES",...]');

-- 默认管理员用户
INSERT OR IGNORE INTO users (user_id, name, email, role_id, org_id, status, avatar) VALUES
('u1', 'Admin User', 'admin@company.com', 'admin', 'org-1', 'active', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin');
```

#### 问题 2: Action Templates 表缺失 project_id 列
**现象:** API 请求 `/api/action-templates/accessible` 返回 500 错误
**错误信息:** `no such column: project_id`
**根因:**
- `005_add_action_templates.sql` 迁移脚本中缺少 `project_id` 列定义
- Go 模型 `ActionTemplate` 包含 `ProjectID` 字段但数据库表没有对应列

**修复:**
1. 向 `action_templates` 表添加 `project_id` 列:
   ```sql
   ALTER TABLE action_templates ADD COLUMN project_id VARCHAR(100);
   CREATE INDEX idx_action_templates_project_id ON action_templates(project_id);
   ```

2. 更新迁移脚本 `005_add_action_templates.sql`:
   - 在 `tenant_id` 后添加 `project_id VARCHAR(100)` 字段
   - 添加索引 `idx_action_templates_project_id`

**验证:**
- API 成功返回 10 个系统级 Action Templates
- 包含类别: Network (4), Control (2), Data (2), Validation (1), System (1)

#### 已执行的数据库操作

```bash
# 1. 应用 roles 和 users 迁移
sqlite3 data/test_management.db < migrations/005_add_users_roles.sql

# 2. 更新 roles 添加 VIEW_APIS 权限
sqlite3 data/test_management.db "UPDATE roles SET permission_codes = '...' WHERE role_id IN ('admin','editor','viewer');"

# 3. 应用 action_templates 迁移
sqlite3 data/test_management.db < migrations/005_add_action_templates.sql

# 4. 添加 project_id 列
sqlite3 data/test_management.db "ALTER TABLE action_templates ADD COLUMN project_id VARCHAR(100);"
sqlite3 data/test_management.db "CREATE INDEX idx_action_templates_project_id ON action_templates(project_id);"

# 5. 应用 folder_type 迁移 (已在之前执行)
sqlite3 data/test_management.db < migrations/009_add_folder_type.sql
```

---

### 5. TestCase 编辑器优化 ✅

按照统一架构文档,优化了 TestCase 编辑器以支持 Action Template:

#### 新增组件

**1. ActionTemplateSelector.tsx** (新文件)
- 位置: `NextTestPlatformUI/components/testcase/stepEditor/ActionTemplateSelector.tsx`
- 功能:
  - 浏览和选择 Action Templates
  - 按类别分组展示 (Network, System, Control, Data, Validation)
  - 搜索功能 (按名称、描述、类别)
  - 显示模板作用域标签 (system, platform, organization, project)
  - 显示模板详情 (参数数量、输出数量、使用次数)
  - 实时加载可访问的模板列表

#### 增强的 StepCard 组件

**2. StepCard.tsx** (已更新)
- 位置: `NextTestPlatformUI/components/testcase/stepEditor/StepCard.tsx`
- 新增功能:

**Action Template 集成:**
- "Use Action Template" 按钮 - 打开模板选择器
- 显示已选择的 Action Template 信息:
  - 模板名称、作用域、类别
  - 模板描述
- "Unlink" 按钮 - 解除与模板的关联

**输入参数映射 (Inputs):**
- 根据模板参数自动生成输入字段
- 显示参数名称、类型、描述
- 必填参数标记 (红色星号)
- 支持变量引用 `{{variable}}` 语法
- 默认值预填充

**输出变量映射 (Outputs):**
- 根据模板输出字段生成映射输入框
- 显示输出名称 → 变量名称映射
- 可视化箭头指示数据流向
- 输出描述提示

**自动配置:**
- 选择模板后自动设置 step.type
- 使用 `linkedScriptId` 字段存储 actionTemplateId
- 自动初始化 inputs/outputs
- 记录模板使用次数

#### 数据流支持

**变量引用:**
- 输入框支持 `{{variableName}}` 语法
- 引用全局变量或前序步骤的输出
- 输出映射到新变量供后续步骤使用

**示例:**
```typescript
// 选择 "HTTP POST Request" 模板后
{
  linkedScriptId: "action-http-post",
  type: "http",
  name: "Create User",
  inputs: {
    url: "{{baseUrl}}/api/users",
    body: "{{userPayload}}"
  },
  outputs: {
    userId: "createdUserId",
    statusCode: "createUserStatus"
  }
}
```

#### UI 改进

**扩展编辑区:**
- Action Template 部分置于顶部 (高优先级)
- 清晰的视觉层次:
  1. Action Template (蓝色卡片)
  2. Input Parameters (白色表单)
  3. Output Mappings (带箭头指示)
  4. 基础配置 (折叠在下方)

**模板选择器:**
- 全屏模态弹窗
- 左侧类别导航
- 右侧模板列表
- 搜索栏实时过滤
- 响应式设计 (800px × 80vh)

#### 技术实现

**API 集成:**
```typescript
import { actionTemplateApi, ActionTemplate } from '../../../services/api/actionTemplateApi';

// 加载模板
actionTemplateApi.getAccessibleTemplates({ projectId, limit: 100, offset: 0 });

// 获取单个模板
actionTemplateApi.getTemplate(templateId);

// 记录使用
actionTemplateApi.recordUsage(templateId);
```

**状态管理:**
```typescript
const [showTemplateSelector, setShowTemplateSelector] = useState(false);
const [selectedTemplate, setSelectedTemplate] = useState<ActionTemplate | null>(null);

// 自动加载模板详情
useEffect(() => {
  if (step.linkedScriptId && !selectedTemplate) {
    actionTemplateApi.getTemplate(step.linkedScriptId)
      .then(setSelectedTemplate)
      .catch(console.error);
  }
}, [step.linkedScriptId, selectedTemplate]);
```

#### 用户体验优化

**1. 零配置开始:**
- 点击 "Use Action Template"
- 从库中选择模板
- 自动填充参数默认值
- 立即可用

**2. 可视化数据流:**
- 输入参数清晰标注 (必填/可选)
- 输出映射带箭头 `fieldName → variableName`
- 参数描述实时提示

**3. 灵活性保留:**
- 可随时解除模板关联
- 可手动修改生成的配置
- 支持混合使用模板和手动配置

---

## 下一步工作 (待实施)

### Phase 1: Action Template 管理界面

#### 1. 创建 Action Template 浏览器组件
**文件:** `NextTestPlatformUI/components/ActionTemplateBrowser.tsx`

**功能:**
- 按分类展示 Action Templates
- 支持搜索和过滤
- 显示作用域标签 (System/Platform/Tenant)
- 拖拽到步骤编辑器

**UI 设计:**
```
┌─────────────────────────────────────────┐
│ Action Library                      🔍  │
├─────────────────────────────────────────┤
│ 📁 Network (8)                          │
│   ├─ HTTP GET Request          [System] │
│   ├─ HTTP POST Request         [System] │
│   └─ ...                                │
│ 📁 Authentication (3)                   │
│   ├─ User Login                [Tenant] │
│   └─ ...                                │
│ 📁 Database (5)                         │
└─────────────────────────────────────────┘
```

#### 2. 创建 Action Template 编辑器
**文件:** `NextTestPlatformUI/components/ActionTemplateEditor.tsx`

**功能:**
- 创建/编辑 Action Template
- 配置输入参数 (类型、必填、默认值)
- 配置输出字段 (名称、JSONPath)
- 配置模板 (带变量占位符)

#### 3. 创建后端 API

**新增文件:**
- `internal/repository/action_template_repository.go`
- `internal/service/action_template_service.go`
- `internal/handler/action_template_handler.go`

**API 端点:**
```
POST   /api/v2/action-templates          - 创建模板
GET    /api/v2/action-templates/:id      - 获取模板
PUT    /api/v2/action-templates/:id      - 更新模板
DELETE /api/v2/action-templates/:id      - 删除模板
GET    /api/v2/action-templates          - 列表 (支持过滤)
POST   /api/v2/action-templates/:id/copy - 复制到私有库
GET    /api/v2/action-templates/search   - 搜索
```

---

### Phase 2: 优化 StepEditor 以支持 Action Template

#### 1. 更新 StepCard 组件
**文件:** `NextTestPlatformUI/components/testcase/stepEditor/StepCard.tsx`

**新增功能:**
- 显示引用的 Action Template 名称
- 从 Action Library 拖拽添加步骤
- 配置 Action 输入参数
- 显示 Action 输出字段

**UI 设计:**
```
┌───────────────────────────────────────────┐
│ Step 1: User Login                    ⋮  │
├───────────────────────────────────────────┤
│ 📦 Action: action-user-login  (System)    │
│                                           │
│ Inputs:                                   │
│  username: {{testUsername}} ━━━━━━ 🔗    │
│  password: {{testPassword}} ━━━━━━ 🔗    │
│                                           │
│ Outputs:                                  │
│  authToken  → currentToken                │
│  userId     → currentUserId               │
│                                           │
│ Assertions: (2)                           │
│  ✓ Status code equals 200                │
│  ✓ Response contains "token"             │
└───────────────────────────────────────────┘
```

#### 2. 创建数据映射面板
**文件:** `NextTestPlatformUI/components/testcase/stepEditor/DataMappingPanel.tsx`

**功能 (三栏布局):**
```
┌───────────────────────────────────────────────┐
│ Data Mapping                                  │
├──────────────┬────────────┬──────────────────┤
│ Upstream     │  Mapping   │  Current Inputs  │
│ Outputs      │  Relations │                  │
├──────────────┼────────────┼──────────────────┤
│ step-login   │            │ userId           │
│ ├─ token ────┼────────────┼→ [required]      │
│ └─ userId    │            │                  │
│              │            │ productId        │
│ step-product │            │ [required]       │
│ ├─ id ───────┼────────────┼→                 │
│ └─ name      │            │                  │
└──────────────┴────────────┴──────────────────┘
```

---

### Phase 3: 双模式编辑器 (长期)

#### 1. Simple Mode (当前实现)
- 列表式垂直布局 ✅
- 拖拽排序 ✅
- 适合线性流程 ✅

#### 2. Advanced Mode (待实现)
**新增文件:** `NextTestPlatformUI/components/testcase/AdvancedWorkflowEditor.tsx`

**技术栈:**
- React Flow (图形引擎)
- Dagre (自动布局)

**功能:**
- DAG 可视化
- 并行/分支/循环可视化
- 数据流连线
- Action Library 侧边栏

**切换逻辑:**
- 检测复杂流程 (并行/分支/循环)
- 自动转换为 DAG 表示
- 保持数据一致性

---

## 架构优势

### 1. 统一数据模型
- TestCase 和 Workflow 共享 WorkflowStep 结构
- 差异化仅在视图层 (测试视角 vs 研发视角)

### 2. Action 复用
- 定义一次,处处使用
- 降低维护成本
- 提高一致性

### 3. 多租户支持
- 系统级内置 Actions
- 平台级共享 Actions
- 租户私有 Actions
- 项目级私有 Actions

### 4. 可扩展性
- 支持自定义 Action Types
- 支持插件化扩展
- 支持第三方集成

---

## 使用示例

### 创建使用 Action Template 的测试步骤

#### 前端代码示例:
```typescript
const step: WorkflowStep = {
  id: "step-login",
  name: "User Login",
  type: "action",
  actionTemplateId: "action-user-login",
  actionVersion: "1.0.0",
  inputs: {
    username: "{{testUsername}}",
    password: "{{testPassword}}"
  },
  outputs: {
    authToken: "currentAuthToken",
    userId: "currentUserId"
  },
  assertions: [
    {
      type: "equals",
      actual: "{{step-login.response.status}}",
      expected: 200,
      message: "Login should return 200"
    }
  ]
};
```

#### 后端执行流程:
1. 加载 Action Template (`action-user-login`)
2. 合并 ConfigTemplate + inputs
3. 执行 HTTP 请求
4. 提取 outputs 根据定义
5. 验证 assertions

---

## 迁移指南

### 现有数据迁移
1. 运行迁移脚本: `009_add_folder_type.sql`
2. 自动标记:
   - 根级目录 → `service`
   - 二级目录 → `module`
   - 其他 → `folder`

### 现有代码兼容性
- 保持向后兼容
- 支持内联 config (旧方式)
- 支持 actionTemplateId (新方式)

---

## 参考文档

1. **统一架构设计:**
   - `nextest-platform/docs/UNIFIED_WORKFLOW_ARCHITECTURE.md`

2. **数据库设计:**
   - `nextest-platform/docs/DATABASE_DESIGN.md`

3. **API 文档:**
   - `nextest-platform/docs/API_DOCUMENTATION.md`

---

## 总结

本次优化为测试平台奠定了统一架构的基础:
- ✅ 调整了目录组织方式,支持 services/modules 结构
- ✅ 添加了完整的统一架构类型定义
- ✅ 数据库已支持 Action Template
- ⏳ 下一步需要实现 Action Template 管理界面
- ⏳ 优化 StepEditor 以支持新架构

这些改进将显著提升:
- **可维护性**: Action 复用减少重复代码
- **一致性**: 统一的数据模型和 API
- **可扩展性**: 插件化的 Action 系统
- **用户体验**: 简单模式和高级模式满足不同需求
