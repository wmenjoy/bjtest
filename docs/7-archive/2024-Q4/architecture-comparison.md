# 前后端架构方案对比与共存策略

> **文档版本**: v1.0.0
> **创建日期**: 2025-11-24
> **目的**: 审核前后端理解差异,提出共存方案

## 目录

- [1. 核心差异对比](#1-核心差异对比)
- [2. 后端架构理解](#2-后端架构理解)
- [3. 前端架构理解](#3-前端架构理解)
- [4. 关键分歧点分析](#4-关键分歧点分析)
- [5. 共存方案设计](#5-共存方案设计)
- [6. 实施建议](#6-实施建议)

---

## 1. 核心差异对比

### 1.1 架构设计理念差异

| 维度 | 前端方案 v1.0 (DESIGN) | 前端方案 v2.0 (ENHANCEMENT) | 后端期望 |
|------|----------------------|---------------------------|----------|
| **设计策略** | 完全重构,全新导航 | 渐进式增强,保留现有 | 渐进式增强 ✅ |
| **导航结构** | 12个顶级导航项 | 9个现有 + 3个新增 | 最小化改动 ✅ |
| **WorkflowEditor** | 全新双模式编辑器 | 扩展现有ScriptLab | 复用现有能力 ✅ |
| **TestCaseManager** | 完全重写 | 左中右栏渐进增强 | 增强不重写 ✅ |
| **TestSuite** | 独立顶级页面 | Modal弹窗 | 轻量化实现 ✅ |
| **ResourceLibrary** | 全新三栏设计 | 复用TestCaseManager模式 | 模式复用 ✅ |

**结论**: 前端方案 v2.0 (ENHANCEMENT) 与后端理解高度一致 ✅

---

### 1.2 Workflow 理解差异

#### 后端 Workflow 架构 (UNIFIED_WORKFLOW_ARCHITECTURE.md)

```go
type Workflow struct {
    ID          string          `json:"id"`
    Name        string          `json:"name"`
    Type        string          `json:"type"`  // "workflow" or "testcase"
    Steps       []WorkflowStep  `json:"steps"`
    Variables   map[string]interface{} `json:"variables"`
}

type WorkflowStep struct {
    ID                string `json:"id"`
    Type              string `json:"type"`  // action, branch, loop, merge
    ActionTemplateId  string `json:"actionTemplateId,omitempty"` // 引用Action Template
    Config            map[string]interface{} `json:"config,omitempty"` // 内联配置
    DependsOn         []string `json:"dependsOn,omitempty"` // DAG依赖
    Loop              *LoopConfig `json:"loop,omitempty"`
    Branches          []BranchConfig `json:"branches,omitempty"`
}
```

**核心特性**:
- ✅ Workflow 和 TestCase 底层数据结构统一
- ✅ Step 可以引用 Action Template 或内联配置
- ✅ 支持 DAG 依赖、并行执行
- ✅ 支持 Branch、Loop、Merge 控制流

#### 前端 Workflow 理解 (FRONTEND_ARCHITECTURE_DESIGN.md)

**v1.0 方案** - 提出全新双模式编辑器:
```typescript
// Simple Mode - 列表式编辑
const SimpleEditor = ({ workflow }) => (
    <div>
        <DragDropContext>
            <StepCard step={step} />
        </DragDropContext>
    </div>
);

// Advanced Mode - 图形化编辑
const AdvancedWorkflowEditor = ({ workflow }) => (
    <div className="flex">
        <ActionLibrarySidebar />
        <ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} />
        <StepConfigPanel />
    </div>
);
```

**v2.0 方案** - 扩展现有 ScriptLab:
```typescript
// ScriptLab.tsx 已有双模式和可视化编辑器
const [mode, setMode] = useState<'scripts' | 'workflows'>('workflows');
const [viewMode, setViewMode] = useState<'visual' | 'code'>('visual');

// 建议: 添加 'suites' 模式
const [mode, setMode] = useState<'scripts' | 'workflows' | 'suites'>('workflows');
```

**差异点**:
- v1.0: 认为需要全新构建双模式编辑器
- v2.0: 发现 ScriptLab 已实现大部分功能
- **后端视角**: 应复用现有能力,避免重复开发

---

### 1.3 Action Template 理解差异

#### 后端设计 (UNIFIED_WORKFLOW_ARCHITECTURE.md)

```go
type ActionTemplate struct {
    ID              string                 `json:"id"`          // "action-user-login"
    Name            string                 `json:"name"`        // "用户登录"
    Type            string                 `json:"type"`        // "http", "command", "database"
    ConfigTemplate  map[string]interface{} `json:"configTemplate"` // 配置模板
    Parameters      []ActionParameter      `json:"parameters"`     // 输入参数定义
    Outputs         []ActionOutput         `json:"outputs"`        // 输出定义
    Scope           string                 `json:"scope"`          // system, platform, tenant
    TenantID        string                 `json:"tenantId"`
}

// 使用方式
type WorkflowStep struct {
    ActionTemplateId string            `json:"actionTemplateId"` // 引用模板ID
    Inputs           map[string]string `json:"inputs"`           // 参数绑定
    Outputs          map[string]string `json:"outputs"`          // 输出映射
}
```

**核心理念**: "定义一次,处处复用"

#### 前端理解 (ActionLibrary.tsx 现状)

当前 ActionLibrary 主要管理 **Scripts (脚本)**:
```typescript
// components/ActionLibrary.tsx
const ActionLibrary = () => {
    const [scripts, setScripts] = useState<Script[]>([]);

    return (
        <div>
            <ScriptCard script={script} />
            <ActionTestBench />
        </div>
    );
};
```

**差异点**:
- 前端 ActionLibrary 主要是**脚本管理器**
- 后端 ActionTemplate 是**可复用的原子操作定义**(不限于脚本)
- 后端 ActionTemplate 包含参数定义、输出定义、作用域管理

**共识**: 需要扩展 ActionLibrary 以支持通用 Action Template

---

### 1.4 数据流映射理解差异

#### 后端设计 (UNIFIED_WORKFLOW_ARCHITECTURE.md)

```go
// Step 间数据映射
type DataMapper struct {
    SourceStep  string `json:"sourceStep"`   // "step-login"
    SourcePath  string `json:"sourcePath"`   // "response.body.token"
    TargetParam string `json:"targetParam"`  // "authToken"
    Transform   string `json:"transform"`    // 转换函数
}

type WorkflowStep struct {
    DataMappers []DataMapper `json:"dataMappers,omitempty"` // 可视化配置
}
```

**设计目标**: 三栏拖拽式数据映射面板
```
┌───────────────┐  ┌──────────────┐  ┌──────────────┐
│  上游输出     │  │   映射关系    │  │  当前输入    │
│  step-login   │  │              │  │  userId      │
│  ├─ token     │──┼──────────────┼→ │   required   │
│  └─ userId    │  │              │  │              │
└───────────────┘  └──────────────┘  └──────────────┘
```

#### 前端现状

ScriptLab 的 NodeInspector 提供了配置面板,但是**表单式**而非**可视化拖拽**:
```typescript
// components/workflow/NodeInspector.tsx
const NodeInspector = ({ node }) => (
    <div className="w-80 border-l p-4">
        <h3>节点配置</h3>
        <FormField label="输入参数">
            <input name="userId" value={config.userId} />
        </FormField>
    </div>
);
```

**差异点**:
- 后端期望: 拖拽式三栏数据流映射(类似低代码平台)
- 前端现状: 表单式配置面板
- **用户体验**: 拖拽式对于复杂数据流更直观

---

## 2. 后端架构理解

### 2.1 后端核心诉求

基于 `UNIFIED_WORKFLOW_ARCHITECTURE.md`:

1. **统一数据模型**: Workflow 和 TestCase 共享底层结构
2. **Action 复用**: 通过 ActionTemplate 避免重复定义
3. **可视化编排**: 支持 Simple Mode 和 Advanced Mode
4. **数据流可视化**: 三栏拖拽式映射面板
5. **多租户共享**: System/Platform/Tenant 三层 Action Library

### 2.2 后端已实现功能

```go
// internal/workflow/executor.go
func (e *WorkflowExecutor) Execute(workflow *Workflow) (*WorkflowResult, error) {
    // 1. 构建 DAG
    graph := buildDAG(workflow.Steps)

    // 2. 拓扑排序得到执行层
    layers := topologicalSort(graph)

    // 3. 按层并行执行
    for _, layer := range layers {
        var wg sync.WaitGroup
        for _, step := range layer {
            wg.Add(1)
            go func(s *WorkflowStep) {
                defer wg.Done()
                result := e.ExecuteStep(ctx, s)
            }(step)
        }
        wg.Wait()
    }
}

func (e *WorkflowExecutor) ExecuteStep(ctx *ExecutionContext, step *WorkflowStep) (*StepResult, error) {
    // 支持引用 Action Template
    if step.ActionTemplateId != "" {
        template := e.actionLibrary.GetTemplate(step.ActionTemplateId)
        resolvedConfig := e.mergeConfig(template.ConfigTemplate, step.Inputs)
        action := e.createAction(template.Type, resolvedConfig)
        return action.Execute(ctx)
    }

    // 内联 Action (向后兼容)
    action := e.createAction(step.Type, step.Config)
    return action.Execute(ctx)
}
```

**后端能力清单**:
- ✅ DAG 构建和拓扑排序
- ✅ 并行执行 (goroutine + WaitGroup)
- ✅ Action Template 引用和解析
- ✅ 变量插值 `{{VAR_NAME}}`
- ✅ 数据流映射(后端支持,但前端UI缺失)
- ✅ 控制流 (Branch/Loop/Merge 已设计,待实现)

---

## 3. 前端架构理解

### 3.1 前端现有能力

基于实际 TSX 文件分析:

**已实现的核心组件**:
1. ✅ **TestCaseManager** - 三栏布局 (FolderTree | CaseList | CaseDetail)
2. ✅ **ScriptLab** - 双模式 (Scripts | Workflows) + 可视化编辑器
3. ✅ **Dashboard** - 统计卡片 + 图表 + AI 洞察
4. ✅ **ActionLibrary** - 脚本管理(需扩展为通用 Action Template)
5. ✅ **DatabaseManager** - 表设计和数据管理
6. ✅ **AdminPortal** - 多租户管理(Org/Project/User/Role)

**ScriptLab 已有功能** (components/ScriptLab.tsx):
```typescript
// 双模式切换
const [mode, setMode] = useState<'scripts' | 'workflows'>('workflows');

// 可视化/代码视图切换
const [viewMode, setViewMode] = useState<'visual' | 'code'>('visual');

// 组件
<LabHeader mode={mode} setMode={setMode} />
<ScriptList mode={mode} />
<WorkflowCanvas />          // 可视化画布
<YamlEditor />              // YAML 代码编辑
<NodeInspector />           // 节点配置面板
<ActionEditor />            // Action 编辑器
```

### 3.2 前端缺失功能

根据后端期望,前端缺失:

1. ❌ **通用 Action Template 管理** - ActionLibrary 仅支持脚本
2. ❌ **三栏数据流映射面板** - 当前是表单式配置
3. ❌ **Branch/Loop/Merge 节点可视化** - WorkflowCanvas 需扩展
4. ❌ **Action Library 分层展示** (System/Platform/Tenant)
5. ❌ **实时验证 UI** - Schema 验证、Dry Run 测试

---

## 4. 关键分歧点分析

### 4.1 WorkflowEditor: 新建 vs 扩展

**分歧点**:
- **v1.0 方案**: 认为需要全新构建 WorkflowEditor
- **v2.0 方案**: 发现 ScriptLab 已实现大部分功能,建议扩展
- **后端视角**: 应复用现有能力

**技术对比**:

| 功能 | ScriptLab 现状 | v1.0 方案 | 差距 |
|------|---------------|----------|------|
| 双模式切换 | ✅ Scripts/Workflows | ✅ Simple/Advanced | ✅ 已有 |
| 可视化编辑 | ✅ WorkflowCanvas | ✅ React Flow | ✅ 已有 |
| 节点拖拽 | ✅ | ✅ | ✅ 已有 |
| 代码视图 | ✅ YamlEditor | ✅ | ✅ 已有 |
| 节点配置 | ✅ NodeInspector | ✅ StepConfigPanel | ✅ 已有 |
| Branch节点 | ⚠️ 需扩展 | ✅ BranchNode | ❌ 缺失 |
| Loop节点 | ⚠️ 需扩展 | ✅ LoopNode | ❌ 缺失 |
| Merge节点 | ⚠️ 需扩展 | ✅ MergeNode | ❌ 缺失 |
| 数据流映射 | ❌ 表单式 | ✅ 三栏拖拽 | ❌ 缺失 |

**结论**: ScriptLab 已有 70% 功能,只需补充:
1. Branch/Loop/Merge 节点组件
2. 三栏数据流映射面板
3. 测试集合模式(添加 'suites' 选项)

---

### 4.2 ActionLibrary: 脚本 vs 通用 Action

**分歧点**:
- **前端现状**: ActionLibrary 是脚本管理器
- **后端期望**: ActionLibrary 是通用 Action Template 管理
- **核心差异**: 脚本是 Action 的一种类型,但不是全部

**后端 Action Template 类型**:
```go
const (
    ActionTypeHTTP      = "http"
    ActionTypeCommand   = "command"
    ActionTypeDatabase  = "database"
    ActionTypeScript    = "script"      // 脚本只是一种类型
    ActionTypeTestCase  = "test-case"
    ActionTypeDelay     = "delay"
)
```

**前端需要扩展**:
1. 支持多种 Action 类型(不仅是 script)
2. 按类别分组(Network/Database/Messaging/etc.)
3. 按作用域过滤(System/Platform/Tenant)
4. 智能搜索和推荐
5. 拖拽到 Workflow 画布

---

### 4.3 TestSuite: 独立页面 vs Modal

**分歧点**:
- **v1.0 方案**: TestSuite 是独立顶级页面(`/repository/suites`)
- **v2.0 方案**: TestSuite 作为 Modal 弹窗
- **后端期望**: 轻量化实现,避免过度复杂

**方案对比**:

| 维度 | 独立页面方案 | Modal 方案 | 推荐 |
|------|-------------|-----------|------|
| 导航复杂度 | 增加顶级菜单 | 无需新菜单 | Modal ✅ |
| 实施成本 | 高(新路由+页面) | 低(复用现有) | Modal ✅ |
| 用户体验 | 页面跳转 | 快速弹窗 | 取决于使用频率 |
| 功能复杂度 | 适合复杂功能 | 适合轻量功能 | Modal(当前) |

**建议**: 先实现 Modal 方案,如果用户反馈需要更多功能,再升级为独立页面

---

### 4.4 资源管理: 全新 vs 复用模式

**共识**: 两个方案都建议复用 TestCaseManager 的三栏布局 ✅

**无分歧**: ResourceLibrary 设计一致

---

## 5. 共存方案设计

### 5.1 设计原则

1. **两套方案并行**: 在不同页面/场景使用不同方案
2. **用户选择**: 提供 UI 切换,让用户决定用哪个
3. **渐进迁移**: 从 v2.0 方案开始,逐步引入 v1.0 的高级功能
4. **A/B 测试**: 收集用户反馈,决定最终保留哪个

### 5.2 WorkflowEditor 共存方案

#### 方案 A: 扩展现有 ScriptLab (v2.0)

**路由**: `/automation` (现有)

**实施**:
1. ScriptLab 添加 'suites' 模式
2. 扩展 WorkflowCanvas 支持 Branch/Loop/Merge 节点
3. 添加数据流映射面板(可选功能)

**优点**:
- ✅ 快速实施(复用现有80%代码)
- ✅ 用户熟悉现有界面
- ✅ 开发成本低

**缺点**:
- ⚠️ 受限于现有架构
- ⚠️ 难以引入全新交互模式

#### 方案 B: 全新双模式编辑器 (v1.0)

**路由**: `/automation/workflows/new` (新增)

**实施**:
1. 创建全新 WorkflowEditor 组件
2. React Flow + Dagre 自动布局
3. 三栏数据流映射面板
4. 自定义节点类型(Action/Branch/Loop/Merge)

**优点**:
- ✅ 全新交互体验
- ✅ 更强大的可视化能力
- ✅ 不受现有架构限制

**缺点**:
- ⚠️ 开发成本高(2-3周)
- ⚠️ 用户学习成本
- ⚠️ 维护两套代码

#### 推荐: 渐进式共存

**Phase 1** (1周): 扩展 ScriptLab
- 添加 Branch/Loop/Merge 节点组件
- 添加 'suites' 模式

**Phase 2** (2周): 引入高级编辑器
- 创建 `/automation/workflows/advanced` 路由
- 实现全新 React Flow 编辑器
- 在 ScriptLab 添加"切换到高级编辑器"按钮

**Phase 3** (1周): 用户选择
- 用户设置中添加"默认编辑器"选项
- 收集使用统计和反馈
- 根据数据决定后续策略

```typescript
// 共存实现示例
const WorkflowEditorRouter = ({ workflowId }) => {
    const { userPreference } = useUserSettings();
    const editorMode = userPreference.defaultWorkflowEditor; // 'simple' or 'advanced'

    if (editorMode === 'advanced') {
        return <AdvancedWorkflowEditor workflowId={workflowId} />;
    }

    return <ScriptLab mode="workflows" workflowId={workflowId} />;
};
```

---

### 5.3 ActionLibrary 共存方案

#### 方案: 扩展现有 ActionLibrary

当前 ActionLibrary 主要是脚本管理,扩展为通用 Action Template 管理:

**新增功能**:
1. **类别分组**: Network, Database, Messaging, Script, Custom
2. **作用域过滤**: System, Platform, Tenant
3. **Action 类型支持**: HTTP, Command, Database, Script
4. **参数定义**: 输入参数和输出定义
5. **拖拽支持**: 拖拽 Action 到 Workflow 画布

**UI 改进**:
```typescript
// components/ActionLibrary.tsx 扩展
const ActionLibrary = () => {
    const [category, setCategory] = useState<string>('all');
    const [scope, setScope] = useState<string>('all');
    const [actionType, setActionType] = useState<string>('all');

    return (
        <div className="h-screen flex flex-col">
            {/* 🆕 类别标签 */}
            <CategoryTabs
                categories={['all', 'network', 'database', 'messaging', 'script', 'custom']}
                selected={category}
                onChange={setCategory}
            />

            {/* 🆕 作用域过滤 */}
            <ScopeFilter
                options={['all', 'system', 'platform', 'tenant']}
                selected={scope}
                onChange={setScope}
            />

            {/* 现有脚本列表 → 改为 Action Template 列表 */}
            <ActionTemplateGrid
                templates={filteredTemplates}
                onDragStart={handleDragAction}
                onSelect={handleSelectAction}
            />
        </div>
    );
};
```

**向后兼容**:
- 现有 Script 自动转换为 `type: "script"` 的 Action Template
- 保留现有 ScriptCard 组件
- 新增 ActionTemplateCard 组件(支持多种类型)

---

### 5.4 数据流映射共存方案

#### 方案: 渐进式引入

**Phase 1**: 保持现有表单式配置
```typescript
// components/workflow/NodeInspector.tsx (现有)
const NodeInspector = ({ node }) => (
    <div className="w-80 border-l p-4">
        <FormField label="用户ID">
            <input value={config.userId} />
        </FormField>
    </div>
);
```

**Phase 2**: 添加"高级映射"按钮
```typescript
const NodeInspector = ({ node, workflow }) => {
    const [showAdvancedMapping, setShowAdvancedMapping] = useState(false);

    return (
        <div className="w-80 border-l p-4">
            <div className="flex justify-between items-center mb-4">
                <h3>节点配置</h3>
                <button onClick={() => setShowAdvancedMapping(!showAdvancedMapping)}>
                    {showAdvancedMapping ? '基础配置' : '高级映射'}
                </button>
            </div>

            {showAdvancedMapping ? (
                <DataFlowMapper
                    step={node}
                    workflow={workflow}
                    onMappingChange={handleMappingChange}
                />
            ) : (
                <BasicConfigForm step={node} onChange={handleChange} />
            )}
        </div>
    );
};
```

**Phase 3**: 三栏数据流映射面板(Modal)
```typescript
// components/workflow/DataFlowMapper.tsx (新增)
const DataFlowMapper = ({ step, workflow, onMappingChange }) => (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl w-full max-w-6xl h-[80vh] flex">
            {/* 左栏: 上游输出 */}
            <div className="w-80 border-r p-4">
                <h3>上游输出</h3>
                <OutputTree outputs={getUpstreamOutputs(workflow, step)} />
            </div>

            {/* 中栏: 映射关系 (可视化连线) */}
            <div className="flex-1 p-4 relative">
                <h3>映射关系</h3>
                <MappingCanvas
                    mappings={step.dataMappers}
                    onMappingChange={onMappingChange}
                />
            </div>

            {/* 右栏: 当前输入 */}
            <div className="w-80 border-l p-4">
                <h3>当前输入</h3>
                <InputList inputs={getStepInputs(step)} />
            </div>
        </div>
    </div>
);
```

**用户体验**:
- 简单场景: 使用表单式配置(快速)
- 复杂场景: 使用三栏映射(清晰)
- 用户自主选择

---

### 5.5 TestSuite 共存方案

#### 方案: Modal 优先,按需升级

**Phase 1** (1周): Modal 实现
```typescript
// components/testcase/TestSuiteModal.tsx
const TestSuiteModal = ({ isOpen, onClose }) => (
    <Modal isOpen={isOpen} onClose={onClose} size="large">
        <TestSuiteEditor />
    </Modal>
);

// TestCaseManager.tsx 添加按钮
<button onClick={() => setShowSuiteModal(true)}>
    + 创建测试集
</button>
```

**Phase 2** (按需): 独立页面
- 如果用户反馈 Modal 功能不够
- 添加 `/repository/suites` 路由
- 复用 TestCaseManager 三栏布局

**决策依据**: 收集用户使用数据
- 如果 70% 用户只创建简单测试集 → 保持 Modal
- 如果 30% 用户需要复杂管理功能 → 升级为独立页面

---

## 6. 实施建议

### 6.1 实施优先级

#### 🔴 Phase 1: 最小可行产品 (MVP) - 2周

**目标**: 快速验证核心功能

1. **TestCaseManager 增强** (v2.0 方案)
   - 左栏: 快速过滤器 + 标签云
   - 中栏: 高级搜索面板
   - 右栏: 价值评分 + 统计

2. **ScriptLab 扩展** (v2.0 方案)
   - 添加 'suites' 模式
   - 添加 Branch/Loop 节点组件(基础版)

3. **ActionLibrary 扩展** (共存方案)
   - 支持类别分组
   - 支持作用域过滤

**验收标准**:
- ✅ 用户可以使用快速过滤找到测试用例
- ✅ 用户可以在 ScriptLab 创建包含分支的 Workflow
- ✅ 用户可以按作用域浏览 Action Library

---

#### 🟡 Phase 2: 高级功能 - 3周

**目标**: 引入高级编辑体验

1. **高级 WorkflowEditor** (v1.0 方案)
   - React Flow 图形编辑器
   - 自定义节点类型(完整版)
   - 自动布局算法

2. **数据流映射面板** (共存方案)
   - 三栏布局
   - 拖拽连线
   - JSONPath 编辑

3. **ResourceLibrary** (v2.0 方案)
   - 三栏布局
   - 资源模板管理

**验收标准**:
- ✅ 用户可以选择使用基础或高级编辑器
- ✅ 用户可以通过拖拽配置复杂数据流
- ✅ 用户可以管理资源模板

---

#### 🟢 Phase 3: 产品化功能 - 4周

**目标**: 完整产品功能

1. **Reports 页面** (v2.0 方案)
2. **CI/CD Integration** (v2.0 方案)
3. **E2E & Mobile Testing** (v2.0 方案)

---

### 6.2 用户反馈收集

**方案 A**: 应用内反馈
```typescript
// components/common/FeedbackWidget.tsx
const FeedbackWidget = ({ feature }) => (
    <div className="fixed bottom-4 right-4">
        <button onClick={() => setShowFeedback(true)}>
            💬 反馈
        </button>

        {showFeedback && (
            <FeedbackModal
                feature={feature}
                questions={[
                    "这个功能好用吗?",
                    "您更喜欢哪种编辑方式?",
                    "还需要什么功能?"
                ]}
                onSubmit={handleSubmitFeedback}
            />
        )}
    </div>
);
```

**方案 B**: 使用统计埋点
```typescript
// hooks/useAnalytics.ts
export const useAnalytics = () => {
    const trackEvent = (event: string, properties: any) => {
        // 发送到后端统计
        fetch('/api/analytics/events', {
            method: 'POST',
            body: JSON.stringify({ event, properties, timestamp: Date.now() })
        });
    };

    return { trackEvent };
};

// 使用示例
const WorkflowEditor = () => {
    const { trackEvent } = useAnalytics();

    useEffect(() => {
        trackEvent('workflow_editor_opened', {
            mode: editorMode,
            workflowId,
            userRole
        });
    }, []);

    const handleSwitchMode = (newMode) => {
        trackEvent('workflow_editor_mode_switched', {
            from: currentMode,
            to: newMode
        });
        setCurrentMode(newMode);
    };
};
```

---

### 6.3 决策矩阵

基于收集的数据,做出最终决策:

| 指标 | 权重 | 基础编辑器 | 高级编辑器 | 决策 |
|------|------|----------|----------|------|
| **使用频率** | 40% | 统计实际使用次数 | 统计实际使用次数 | 高者胜 |
| **用户满意度** | 30% | 1-5分评分 | 1-5分评分 | 高者胜 |
| **任务完成率** | 20% | 成功创建 Workflow 比例 | 成功创建 Workflow 比例 | 高者胜 |
| **维护成本** | 10% | 代码复杂度 | 代码复杂度 | 低者胜 |

**决策规则**:
1. 如果基础编辑器 > 高级编辑器(综合得分) → 移除高级编辑器
2. 如果高级编辑器 > 基础编辑器(综合得分) → 将高级编辑器设为默认
3. 如果差距 < 10% → 保持共存,用户自选

---

### 6.4 技术实施检查清单

#### 前端团队检查清单

**准备阶段**:
- [ ] 阅读 UNIFIED_WORKFLOW_ARCHITECTURE.md 理解后端期望
- [ ] 阅读 FRONTEND_ARCHITECTURE_ENHANCEMENT.md 理解增强方案
- [ ] 阅读 FRONTEND_IMPLEMENTATION_GUIDE.md 获取代码示例
- [ ] 审核现有组件 (TestCaseManager, ScriptLab, ActionLibrary)

**Phase 1 实施**:
- [ ] 创建 QuickFilter、TagChip 组件
- [ ] 扩展 FolderTree 添加快速过滤
- [ ] 创建 AdvancedFilterPanel 组件
- [ ] 扩展 CaseDetail 添加价值评分
- [ ] 扩展 ScriptLab 添加 'suites' 模式
- [ ] 扩展 WorkflowCanvas 支持 Branch/Loop 节点
- [ ] 扩展 ActionLibrary 支持类别和作用域过滤

**Phase 2 实施**:
- [ ] 创建 AdvancedWorkflowEditor 组件(React Flow)
- [ ] 创建自定义节点类型(ActionNode, BranchNode, LoopNode, MergeNode)
- [ ] 创建 DataFlowMapper 三栏组件
- [ ] 实现拖拽交互逻辑
- [ ] 创建 ResourceLibrary 页面
- [ ] 添加编辑器切换功能

**测试**:
- [ ] 用户可以在基础编辑器创建简单 Workflow
- [ ] 用户可以在高级编辑器创建复杂 DAG
- [ ] 用户可以切换编辑器且数据不丢失
- [ ] 数据流映射正确保存和加载
- [ ] Action Library 拖拽到画布正常工作

#### 后端团队检查清单

**准备阶段**:
- [ ] 确认 ActionTemplate 数据库表已创建
- [ ] 确认 WorkflowExecutor 支持 actionTemplateId 解析
- [ ] 确认 DataMapper 字段已添加到 WorkflowStep

**API 实现**:
- [ ] POST /api/v2/action-templates (创建 Action Template)
- [ ] GET /api/v2/action-templates/:id (获取 Action Template)
- [ ] GET /api/v2/action-templates?category=&scope= (列表和过滤)
- [ ] POST /api/v2/action-templates/:id/copy (复制到私有库)
- [ ] GET /api/v2/tests/search (高级搜索)
- [ ] GET /api/v2/tests/stats (统计信息)
- [ ] POST /api/v2/analytics/events (埋点统计)

**控制流实现**:
- [ ] BranchNode 执行逻辑
- [ ] LoopNode 执行逻辑
- [ ] MergeNode 执行逻辑
- [ ] DataMapper 解析和应用

---

## 7. 总结

### 7.1 核心发现

1. **前端 v2.0 方案与后端理解高度一致** ✅
   - 渐进式增强策略
   - 复用现有组件
   - 最小化导航改动

2. **ScriptLab 已实现大部分 Workflow 功能** ✅
   - 不需要完全重写
   - 只需扩展节点类型和数据映射

3. **ActionLibrary 需要扩展为通用 Action Template** ⚠️
   - 当前仅支持脚本
   - 需支持 HTTP/Database/Command 等类型

4. **数据流映射是最大差距** ❌
   - 后端期望三栏拖拽式
   - 前端当前是表单式
   - 建议共存: 简单场景用表单,复杂场景用拖拽

### 7.2 推荐策略

**采用渐进式共存**:
1. Phase 1: 基于 v2.0 方案快速实施(2周)
2. Phase 2: 引入 v1.0 高级功能(3周)
3. Phase 3: 收集用户反馈和使用数据
4. Phase 4: 根据数据决策最终保留哪个

**关键原则**: 让用户选择,数据驱动决策

### 7.3 风险提示

**技术风险**:
- ⚠️ 维护两套编辑器增加代码复杂度
- ⚠️ React Flow 性能问题(大型 Workflow)
- ⚠️ 数据流映射 UI 交互复杂度高

**用户风险**:
- ⚠️ 两套 UI 可能导致用户困惑
- ⚠️ 学习成本增加
- ⚠️ 需要清晰的引导和文档

**缓解措施**:
- ✅ 提供清晰的切换按钮和说明
- ✅ 新手引导和教程
- ✅ 应用内帮助提示
- ✅ 收集反馈快速迭代

---

**文档结束**
