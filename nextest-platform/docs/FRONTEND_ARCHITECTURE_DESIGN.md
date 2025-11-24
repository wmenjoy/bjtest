# 前端架构设计方案

> **文档版本**: v1.0.0
> **创建日期**: 2025-11-24
> **最后更新**: 2025-11-24
> **状态**: 设计方案，待实施

## 目录

- [1. 设计目标](#1-设计目标)
- [2. 整体架构](#2-整体架构)
- [3. 页面组织结构](#3-页面组织结构)
- [4. 核心功能页面设计](#4-核心功能页面设计)
- [5. 组件架构](#5-组件架构)
- [6. 路由设计](#6-路由设计)
- [7. 状态管理](#7-状态管理)
- [8. 权限控制](#8-权限控制)
- [9. 多租户支持](#9-多租户支持)
- [10. 技术栈](#10-技术栈)
- [11. 实施路线图](#11-实施路线图)

---

## 1. 设计目标

### 1.1 功能覆盖

前端页面需要覆盖以下完整产品功能:

**核心产品功能** (来自 `TEST_PLATFORM_PRODUCTIZATION_DESIGN.md`):
1. ✅ **资源管理**: 资源模板库、资源实例管理、资源池监控
2. ✅ **测试用例管理**: 智能标签、高级搜索、测试集合、价值评估
3. ✅ **测试报告**: 执行报告、批次报告、趋势报告、自动化分发
4. ✅ **CI/CD集成**: Webhook配置、执行历史、状态监控
5. ✅ **前端测试**: E2E测试配置、可视化回归测试
6. ✅ **移动端测试**: 设备管理、App配置、测试执行

**统一 Workflow 架构** (来自 `UNIFIED_WORKFLOW_ARCHITECTURE.md`):
1. ✅ **Action Library**: 分层资源库 (System/Platform/Tenant)
2. ✅ **双模式编辑器**: Simple Mode (列表) / Advanced Mode (图形)
3. ✅ **数据流可视化**: 三栏数据映射面板
4. ✅ **控制流可视化**: Branch/Loop/Merge 节点
5. ✅ **实时验证**: Schema验证、依赖检查、Dry Run

### 1.2 设计原则

1. **渐进式复杂度**: 从简单到复杂,支持不同技能水平用户
2. **角色差异化**: QA 关注测试验证, Dev 关注流程编排
3. **一致性**: 统一的设计语言和交互模式
4. **响应式**: 支持不同屏幕尺寸
5. **可扩展**: 模块化设计,便于未来功能扩展

---

## 2. 整体架构

### 2.1 信息架构

```
顶层导航 (Top Navigation)
├── Dashboard (仪表盘)
├── Repository (测试仓库)
│   ├── Test Cases (测试用例)
│   ├── Test Suites (测试集合)
│   └── Test Groups (测试分组)
├── Automation (自动化)
│   ├── Workflows (工作流)
│   ├── Executions (执行历史)
│   └── Schedules (定时任务)
├── Resources (资源管理) ⭐ 新增
│   ├── Resource Library (资源模板库)
│   ├── Resource Instances (资源实例)
│   └── Resource Pools (资源池)
├── Library (素材库)
│   ├── Action Templates (Action模板)
│   ├── Test Scripts (测试脚本)
│   └── Data Templates (数据模板)
├── Reports (报告中心) ⭐ 新增
│   ├── Execution Reports (执行报告)
│   ├── Trend Analysis (趋势分析)
│   └── Report Subscriptions (报告订阅)
├── Integration (集成) ⭐ 新增
│   ├── CI/CD (持续集成)
│   ├── Webhooks (Webhook配置)
│   └── API Management (API管理)
├── Testing (专项测试) ⭐ 新增
│   ├── E2E Tests (前端E2E测试)
│   ├── Mobile Tests (移动端测试)
│   └── Performance Tests (性能测试)
├── Database (数据库)
├── History (历史记录)
├── Docs (文档中心)
└── Settings (系统设置)
    ├── Organization (组织管理)
    ├── Projects (项目管理)
    ├── Environments (环境管理)
    ├── Users & Roles (用户角色)
    └── System Config (系统配置)
```

### 2.2 布局结构

```
┌────────────────────────────────────────────────────────┐
│  Header: Logo | Tenant Selector | User Menu            │
├────────────────────────────────────────────────────────┤
│                                                        │
│  ┌──────────┐  ┌─────────────────────────────────┐   │
│  │          │  │                                 │   │
│  │  Sidebar │  │     Main Content Area           │   │
│  │          │  │                                 │   │
│  │  - Nav   │  │  ┌──────────────────────────┐  │   │
│  │  - Org   │  │  │  Breadcrumb              │  │   │
│  │  - Proj  │  │  ├──────────────────────────┤  │   │
│  │  - Env   │  │  │                          │  │   │
│  │          │  │  │  Page Content            │  │   │
│  │          │  │  │                          │  │   │
│  │          │  │  │                          │  │   │
│  │          │  │  └──────────────────────────┘  │   │
│  │          │  │                                 │   │
│  └──────────┘  └─────────────────────────────────┘   │
│                                                        │
└────────────────────────────────────────────────────────┘
```

---

## 3. 页面组织结构

### 3.1 Dashboard (仪表盘)

**路由**: `/dashboard`

**功能**:
- 测试执行概览 (今日/本周/本月)
- 成功率趋势图
- 最近执行记录
- 快速操作入口
- 系统健康状态
- Top 失败用例

**组件**:
```typescript
// components/dashboard/Dashboard.tsx
const Dashboard = () => {
    return (
        <div className="p-6">
            {/* 统计卡片 */}
            <div className="grid grid-cols-4 gap-4 mb-6">
                <StatCard
                    title="今日执行"
                    value={stats.todayExecutions}
                    trend={stats.todayTrend}
                    icon={<PlayCircle />}
                />
                <StatCard
                    title="成功率"
                    value={`${stats.successRate}%`}
                    trend={stats.successRateTrend}
                    icon={<CheckCircle />}
                />
                <StatCard
                    title="活跃用例"
                    value={stats.activeCases}
                    icon={<FileText />}
                />
                <StatCard
                    title="资源使用"
                    value={`${stats.resourceUsage}%`}
                    icon={<Database />}
                />
            </div>

            {/* 趋势图表 */}
            <div className="grid grid-cols-2 gap-4 mb-6">
                <TrendChart
                    title="执行次数趋势"
                    data={stats.executionTrend}
                />
                <TrendChart
                    title="成功率趋势"
                    data={stats.successRateTrend}
                />
            </div>

            {/* 最近执行 */}
            <RecentExecutions executions={stats.recentExecutions} />

            {/* Top 失败用例 */}
            <TopFailures failures={stats.topFailures} />
        </div>
    );
};
```

### 3.2 Test Repository (测试仓库)

#### 3.2.1 Test Cases (测试用例)

**路由**: `/repository/cases`

**功能**:
- 测试用例列表 (支持分页、排序、筛选)
- 智能搜索 (关键词、标签、元数据)
- 批量操作 (执行、删除、标签)
- 测试用例详情查看/编辑
- 双模式编辑器 (Simple/Advanced)
- 快速执行

**UI布局**:
```
┌─────────────────────────────────────────────────────────┐
│  测试用例管理                                             │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  [左侧] 过滤器               [右侧] 用例列表             │
│  ┌──────────────┐          ┌──────────────────────┐    │
│  │ 测试分组树   │          │ 搜索栏               │    │
│  │              │          ├──────────────────────┤    │
│  │ ├─ 功能测试  │          │ 过滤器 Chips         │    │
│  │ ├─ 集成测试  │          ├──────────────────────┤    │
│  │ └─ 性能测试  │          │                      │    │
│  │              │          │ TestCaseCard (列表)  │    │
│  ├──────────────┤          │ TestCaseCard         │    │
│  │ 快速过滤     │          │ TestCaseCard         │    │
│  │ □ 我的测试   │          │ ...                  │    │
│  │ □ P0用例     │          │                      │    │
│  │ □ 不稳定     │          │ [分页控制]           │    │
│  │ □ 未执行     │          │                      │    │
│  │              │          └──────────────────────┘    │
│  ├──────────────┤                                      │
│  │ 标签云       │                                      │
│  │ #smoke       │                                      │
│  │ #regression  │                                      │
│  │ #api         │                                      │
│  └──────────────┘                                      │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**组件**:
```typescript
// components/repository/TestCaseManager.tsx
const TestCaseManager = () => {
    const [filters, setFilters] = useState<TestFilters>({});
    const [selectedCases, setSelectedCases] = useState<string[]>([]);
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

    return (
        <div className="h-screen flex">
            {/* 左侧过滤器 */}
            <TestCaseSidebar
                filters={filters}
                onFilterChange={setFilters}
            />

            {/* 中间列表 */}
            <div className="flex-1 flex flex-col">
                {/* 搜索和工具栏 */}
                <TestCaseToolbar
                    selectedCount={selectedCases.length}
                    onBatchExecute={handleBatchExecute}
                    onBatchDelete={handleBatchDelete}
                    viewMode={viewMode}
                    onViewModeChange={setViewMode}
                />

                {/* 用例列表 */}
                <TestCaseList
                    filters={filters}
                    viewMode={viewMode}
                    selectedCases={selectedCases}
                    onSelectionChange={setSelectedCases}
                />
            </div>

            {/* 右侧详情 (可选) */}
            {selectedCases.length === 1 && (
                <TestCaseDetailPanel caseId={selectedCases[0]} />
            )}
        </div>
    );
};
```

#### 3.2.2 Test Suites (测试集合)

**路由**: `/repository/suites`

**功能**:
- 测试集合列表
- 静态集合 (手动添加用例)
- 动态集合 (基于规则自动筛选)
- 执行配置 (并发度、超时)
- 调度配置 (定时执行)
- 批量执行

**UI布局**:
```typescript
// components/repository/TestSuiteManager.tsx
const TestSuiteManager = () => {
    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">测试集合</h2>
                <button className="btn-primary">
                    + 新建测试集
                </button>
            </div>

            {/* 集合列表 */}
            <div className="grid grid-cols-3 gap-4">
                {suites.map(suite => (
                    <TestSuiteCard
                        key={suite.id}
                        suite={suite}
                        onExecute={handleExecute}
                        onEdit={handleEdit}
                    />
                ))}
            </div>
        </div>
    );
};
```

### 3.3 Automation (自动化)

#### 3.3.1 Workflows (工作流)

**路由**: `/automation/workflows`

**功能**:
- 工作流列表
- 创建/编辑工作流
- 双模式编辑器:
  - Simple Mode: 列表式步骤编辑
  - Advanced Mode: 图形化 DAG 编辑
- 执行工作流
- 查看执行历史

**双模式编辑器**:

**Simple Mode UI**:
```
┌─────────────────────────────────────────────────────────┐
│  工作流编辑 - Simple Mode          [切换到高级模式 →]   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  工作流名称: ___________________________________        │
│  描述: ______________________________________________   │
│                                                         │
│  【步骤列表】                                           │
│  ┌─────────────────────────────────────────────────┐   │
│  │ [1] Step: 用户登录                   [↑] [↓] [x]│   │
│  │     Type: Action Template                      │   │
│  │     Template: action-user-login                │   │
│  │     [展开配置 ▼]                               │   │
│  │     ┌──────────────────────────────────────┐   │   │
│  │     │ Inputs:                             │   │   │
│  │     │   username: {{testUser}}            │   │   │
│  │     │   password: {{testPassword}}        │   │   │
│  │     │ Outputs:                            │   │   │
│  │     │   authToken → currentToken          │   │   │
│  │     └──────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ [2] Step: 查询订单                   [↑] [↓] [x]│   │
│  │     Type: HTTP Request                         │   │
│  │     [折叠配置 ▶]                               │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  [+ 添加步骤]                                           │
│                                                         │
│  [保存] [执行测试]                                      │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Advanced Mode UI** (基于 React Flow):
```
┌─────────────────────────────────────────────────────────┐
│  工作流编辑 - Advanced Mode        [← 切回简单模式]     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  [左侧] Action Library    [中间] 画布    [右侧] 配置   │
│  ┌──────────┐  ┌──────────────────┐  ┌──────────────┐ │
│  │          │  │                  │  │              │ │
│  │ [搜索栏] │  │   ┌──────────┐   │  │ Step Config  │ │
│  │          │  │   │ Step 1   │   │  │              │ │
│  │ Network  │  │   │ 用户登录  │   │  │ Name: ______ │ │
│  │ ├─ HTTP  │  │   └────┬─────┘   │  │              │ │
│  │ └─ WS    │  │        │         │  │ Type: Action │ │
│  │          │  │   ┌────▼─────┐   │  │              │ │
│  │ Database │  │   │ Step 2   │   │  │ Template:    │ │
│  │ ├─ MySQL │  │   │ 查询订单  │   │  │ [选择器]     │ │
│  │ └─ Redis │  │   └──────────┘   │  │              │ │
│  │          │  │                  │  │ Inputs:      │ │
│  │ [我的]   │  │  [Mini Map]      │  │ ...          │ │
│  │ ├─ 登录  │  │                  │  │              │ │
│  │ └─ ...   │  │  [Auto Layout]   │  │ [保存]       │ │
│  │          │  │                  │  │              │ │
│  └──────────┘  └──────────────────┘  └──────────────┘ │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**组件实现**:
```typescript
// components/automation/WorkflowEditor.tsx
const WorkflowEditor = ({ workflowId, mode }: {
    workflowId?: string;
    mode: 'simple' | 'advanced'
}) => {
    const [editMode, setEditMode] = useState<'simple' | 'advanced'>(mode);
    const [workflow, setWorkflow] = useState<Workflow | null>(null);

    return (
        <div className="h-screen">
            {/* 顶部工具栏 */}
            <WorkflowEditorToolbar
                mode={editMode}
                onModeChange={setEditMode}
                onSave={handleSave}
                onExecute={handleExecute}
            />

            {/* 编辑器 */}
            {editMode === 'simple' ? (
                <SimpleWorkflowEditor
                    workflow={workflow}
                    onChange={setWorkflow}
                />
            ) : (
                <AdvancedWorkflowEditor
                    workflow={workflow}
                    onChange={setWorkflow}
                />
            )}
        </div>
    );
};

// Simple Mode 编辑器
const SimpleWorkflowEditor = ({ workflow, onChange }) => {
    return (
        <div className="p-6">
            <WorkflowBasicInfo workflow={workflow} onChange={onChange} />
            <StepList
                steps={workflow.steps}
                onStepsChange={(steps) => onChange({...workflow, steps})}
            />
        </div>
    );
};

// Advanced Mode 编辑器
const AdvancedWorkflowEditor = ({ workflow, onChange }) => {
    const [nodes, setNodes] = useNodesState([]);
    const [edges, setEdges] = useEdgesState([]);
    const [selectedNode, setSelectedNode] = useState<Node | null>(null);

    // 自定义节点类型
    const nodeTypes = {
        action: ActionNode,
        branch: BranchNode,
        loop: LoopNode,
        merge: MergeNode
    };

    return (
        <div className="h-full flex">
            {/* Action Library 侧边栏 */}
            <ActionLibrarySidebar onDragStart={handleDragAction} />

            {/* React Flow 画布 */}
            <div className="flex-1">
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    nodeTypes={nodeTypes}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    onNodeClick={(_, node) => setSelectedNode(node)}
                    fitView
                >
                    <Background />
                    <Controls />
                    <MiniMap />
                </ReactFlow>
            </div>

            {/* Step 配置面板 */}
            {selectedNode && (
                <StepConfigPanel
                    node={selectedNode}
                    workflow={workflow}
                    onChange={handleStepChange}
                />
            )}
        </div>
    );
};
```

#### 3.3.2 Data Flow Mapper (数据流映射器)

**功能**: 可视化配置 Step 间的数据流

**UI布局** (三栏设计):
```
┌─────────────────────────────────────────────────────────┐
│  数据映射配置: Step "创建订单"                           │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  [左] 上游输出      [中] 映射关系      [右] 当前输入    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │              │  │              │  │              │ │
│  │ step-login   │  │              │  │ userId       │ │
│  │ ├─ token     │──┼──────────────┼→ │  (required)  │ │
│  │ └─ userId    │  │              │  │              │ │
│  │              │  │              │  │ productId    │ │
│  │ step-product │  │              │  │  (required)  │ │
│  │ ├─ id        │──┼──────────────┼→ │              │ │
│  │ ├─ name      │  │              │  │ quantity     │ │
│  │ └─ price     │  │              │  │  (optional)  │ │
│  │              │  │              │  │              │ │
│  │ 全局变量:    │  │              │  │ 转换函数:    │ │
│  │ ├─ baseUrl   │  │              │  │ [选择器]     │ │
│  │ └─ apiKey    │  │              │  │              │ │
│  │              │  │              │  │              │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│                                                         │
│  [+ 添加自定义映射]           [预览 JSON]              │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**组件实现**:
```typescript
// components/automation/DataFlowMapper.tsx
const DataFlowMapper = ({
    step,
    workflow,
    onMappingChange
}: {
    step: WorkflowStep;
    workflow: Workflow;
    onMappingChange: (mappings: DataMapper[]) => void;
}) => {
    const [mappings, setMappings] = useState<DataMapper[]>(step.dataMappers || []);
    const [dragItem, setDragItem] = useState<DragItem | null>(null);

    // 获取所有前置步骤的输出
    const upstreamOutputs = useMemo(() => {
        return getUpstreamStepOutputs(workflow, step);
    }, [workflow, step]);

    // 获取当前步骤的输入参数
    const currentInputs = useMemo(() => {
        return getStepInputParameters(step);
    }, [step]);

    return (
        <div className="h-full flex">
            {/* 左栏: 上游输出 */}
            <div className="w-80 border-r p-4 overflow-y-auto">
                <h3 className="font-bold mb-3">上游输出</h3>
                <OutputTree
                    outputs={upstreamOutputs}
                    onDragStart={handleDragStart}
                />
            </div>

            {/* 中栏: 映射关系 (连线可视化) */}
            <div className="flex-1 border-r p-4 relative">
                <h3 className="font-bold mb-3">映射关系</h3>
                <MappingCanvas
                    mappings={mappings}
                    upstreamOutputs={upstreamOutputs}
                    currentInputs={currentInputs}
                    onMappingChange={setMappings}
                />
            </div>

            {/* 右栏: 当前输入 */}
            <div className="w-80 p-4 overflow-y-auto">
                <h3 className="font-bold mb-3">当前输入</h3>
                <InputList
                    inputs={currentInputs}
                    mappings={mappings}
                    onDrop={handleDrop}
                />
            </div>
        </div>
    );
};
```

### 3.4 Resources (资源管理) ⭐ 新增

#### 3.4.1 Resource Library (资源模板库)

**路由**: `/resources/library`

**功能**:
- 资源模板列表
- 按类别筛选 (User/Data/Config/File)
- 按作用域筛选 (System/Platform/Tenant)
- 创建/编辑资源模板
- 复制公共模板到私有库
- 预览资源定义

**UI布局**:
```
┌─────────────────────────────────────────────────────────┐
│  资源模板库                              [+ 新建资源模板] │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  [分类标签]                                             │
│  👤 用户(15)  📦 数据(23)  ⚙️ 配置(8)  📄 文件(5)      │
│                                                         │
│  [作用域筛选]                                           │
│  ○ 全部  ○ 系统内置  ○ 平台公共  ○ 我的租户            │
│                                                         │
│  【资源模板卡片】                                       │
│  ┌──────────────────┐  ┌──────────────────┐           │
│  │ 👤 标准测试用户   │  │ 📦 订单数据模板   │           │
│  │ System Built-in  │  │ Platform Shared  │           │
│  │                  │  │                  │           │
│  │ 创建测试用户并返回│  │ 创建订单测试数据  │           │
│  │ Token和UserID    │  │                  │           │
│  │                  │  │                  │           │
│  │ [查看] [使用]    │  │ [查看] [复制]    │           │
│  └──────────────────┘  └──────────────────┘           │
│                                                         │
│  ┌──────────────────┐  ┌──────────────────┐           │
│  │ ⚙️ Redis配置     │  │ 📄 测试文件      │           │
│  │ Tenant Private   │  │ Tenant Private   │           │
│  │                  │  │                  │           │
│  │ Redis连接配置    │  │ 上传测试文件     │           │
│  │                  │  │                  │           │
│  │ [编辑] [删除]    │  │ [编辑] [删除]    │           │
│  └──────────────────┘  └──────────────────┘           │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**组件实现**:
```typescript
// components/resources/ResourceLibrary.tsx
const ResourceLibrary = () => {
    const [category, setCategory] = useState<string>('all');
    const [scope, setScope] = useState<string>('all');
    const [templates, setTemplates] = useState<ResourceTemplate[]>([]);

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">资源模板库</h2>
                <button className="btn-primary">
                    + 新建资源模板
                </button>
            </div>

            {/* 分类标签 */}
            <CategoryTabs
                value={category}
                onChange={setCategory}
                categories={[
                    { id: 'all', label: '全部', count: 51 },
                    { id: 'user', label: '👤 用户', count: 15 },
                    { id: 'data', label: '📦 数据', count: 23 },
                    { id: 'config', label: '⚙️ 配置', count: 8 },
                    { id: 'file', label: '📄 文件', count: 5 }
                ]}
            />

            {/* 作用域筛选 */}
            <ScopeFilter
                value={scope}
                onChange={setScope}
            />

            {/* 资源模板卡片 */}
            <div className="grid grid-cols-3 gap-4 mt-6">
                {templates.map(template => (
                    <ResourceTemplateCard
                        key={template.id}
                        template={template}
                        onView={handleView}
                        onCopy={handleCopy}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                    />
                ))}
            </div>
        </div>
    );
};
```

#### 3.4.2 Resource Instances (资源实例)

**路由**: `/resources/instances`

**功能**:
- 实例列表 (状态、关联测试、过期时间)
- 手动分配/释放资源
- 延长 TTL
- 查看实例详情

**UI布局**:
```typescript
// components/resources/ResourceInstances.tsx
const ResourceInstances = () => {
    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold mb-6">资源实例</h2>

            {/* 实例表格 */}
            <table className="w-full">
                <thead>
                    <tr>
                        <th>实例ID</th>
                        <th>资源模板</th>
                        <th>状态</th>
                        <th>关联测试</th>
                        <th>分配时间</th>
                        <th>过期时间</th>
                        <th>操作</th>
                    </tr>
                </thead>
                <tbody>
                    {instances.map(instance => (
                        <tr key={instance.id}>
                            <td>{instance.instanceId}</td>
                            <td>{instance.resourceName}</td>
                            <td>
                                <StatusBadge status={instance.status} />
                            </td>
                            <td>{instance.testId || '-'}</td>
                            <td>{formatTime(instance.allocatedAt)}</td>
                            <td>{formatTime(instance.expiresAt)}</td>
                            <td>
                                <button onClick={() => handleRelease(instance)}>
                                    释放
                                </button>
                                <button onClick={() => handleExtendTTL(instance)}>
                                    延长
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
```

### 3.5 Reports (报告中心) ⭐ 新增

#### 3.5.1 Execution Reports (执行报告)

**路由**: `/reports/executions`

**功能**:
- 报告列表
- 按类型筛选 (Execution/Batch/Trend)
- 查看报告详情
- 导出报告 (HTML/PDF/JSON)
- 发送报告

**UI布局**:
```
┌─────────────────────────────────────────────────────────┐
│  测试报告                                               │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  [报告类型]  执行报告 | 批次报告 | 趋势报告            │
│                                                         │
│  【报告列表】                                           │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 📊 测试批次报告 - 2025-11-24 12:00              │   │
│  │    Total: 50  Passed: 45  Failed: 5            │   │
│  │    Success Rate: 90%  Duration: 5m 23s         │   │
│  │    [查看详情] [导出PDF] [发送邮件]             │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 📈 质量趋势报告 - 最近7天                       │   │
│  │    Avg Success Rate: 92%  Total Executions: 350│   │
│  │    Top Failures: test-login (5), test-pay (3)  │   │
│  │    [查看详情] [导出HTML]                       │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**组件实现**:
```typescript
// components/reports/ReportCenter.tsx
const ReportCenter = () => {
    const [reportType, setReportType] = useState<'execution' | 'batch' | 'trend'>('batch');
    const [reports, setReports] = useState<Report[]>([]);

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">测试报告</h2>
                <button className="btn-primary">
                    + 生成报告
                </button>
            </div>

            {/* 报告类型切换 */}
            <ReportTypeTabs
                value={reportType}
                onChange={setReportType}
            />

            {/* 报告列表 */}
            <div className="space-y-4 mt-6">
                {reports.map(report => (
                    <ReportCard
                        key={report.id}
                        report={report}
                        onView={handleView}
                        onExport={handleExport}
                        onSend={handleSend}
                    />
                ))}
            </div>
        </div>
    );
};

// 报告详情查看器
const ReportViewer = ({ reportId }: { reportId: string }) => {
    const [report, setReport] = useState<Report | null>(null);

    return (
        <div className="p-6 max-w-6xl mx-auto">
            {/* 报告头部 */}
            <ReportHeader report={report} />

            {/* 统计卡片 */}
            <div className="grid grid-cols-5 gap-4 my-6">
                <StatCard label="总数" value={report.statistics.totalTests} />
                <StatCard label="通过" value={report.statistics.passedTests} color="green" />
                <StatCard label="失败" value={report.statistics.failedTests} color="red" />
                <StatCard label="错误" value={report.statistics.errorTests} color="yellow" />
                <StatCard label="跳过" value={report.statistics.skippedTests} color="gray" />
            </div>

            {/* 成功率 */}
            <SuccessRateCard rate={report.statistics.successRate} />

            {/* 报告章节 */}
            {report.sections.map(section => (
                <ReportSection key={section.id} section={section} />
            ))}
        </div>
    );
};
```

#### 3.5.2 Trend Analysis (趋势分析)

**路由**: `/reports/trends`

**功能**:
- 成功率趋势图
- 执行次数趋势图
- Top 失败用例
- Flaky 测试识别
- 性能回归检测

**UI布局**:
```typescript
// components/reports/TrendAnalysis.tsx
const TrendAnalysis = () => {
    const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('7d');
    const [trendData, setTrendData] = useState<TrendData | null>(null);

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">趋势分析</h2>
                <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
            </div>

            {/* 成功率趋势 */}
            <div className="bg-white rounded-lg p-6 mb-6">
                <h3 className="text-lg font-bold mb-4">成功率趋势</h3>
                <LineChart
                    data={trendData.successRateTrend}
                    xKey="date"
                    yKey="successRate"
                />
            </div>

            {/* 执行次数趋势 */}
            <div className="bg-white rounded-lg p-6 mb-6">
                <h3 className="text-lg font-bold mb-4">执行次数趋势</h3>
                <BarChart
                    data={trendData.executionCountTrend}
                    xKey="date"
                    yKeys={['passed', 'failed']}
                />
            </div>

            {/* Top 失败用例 */}
            <div className="bg-white rounded-lg p-6 mb-6">
                <h3 className="text-lg font-bold mb-4">Top 10 失败用例</h3>
                <TopFailuresTable data={trendData.topFailures} />
            </div>

            {/* Flaky 测试 */}
            <div className="bg-white rounded-lg p-6">
                <h3 className="text-lg font-bold mb-4">不稳定测试</h3>
                <FlakyTestsTable data={trendData.flakyTests} />
            </div>
        </div>
    );
};
```

### 3.6 Integration (集成) ⭐ 新增

#### 3.6.1 CI/CD Integration

**路由**: `/integration/cicd`

**功能**:
- CI/CD 平台配置 (GitLab/GitHub/Jenkins)
- Webhook 配置
- 触发器设置
- 执行历史
- 状态监控

**UI布局**:
```
┌─────────────────────────────────────────────────────────┐
│  CI/CD 集成                           [+ 新建集成配置]   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  [平台选择]  GitLab CI | GitHub Actions | Jenkins      │
│                                                         │
│  【集成配置列表】                                       │
│  ┌─────────────────────────────────────────────────┐   │
│  │ GitLab CI - 主项目流水线                        │   │
│  │ ○ 已启用                                       │   │
│  │                                                │   │
│  │ Trigger: Push to main, Merge Request          │   │
│  │ Test Suite: suite-smoke-tests                 │   │
│  │ Last Triggered: 2025-11-24 10:30              │   │
│  │ Status: ✅ Passed (45/50)                      │   │
│  │                                                │   │
│  │ [查看配置] [编辑] [禁用] [查看历史]            │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ GitHub Actions - PR自动测试                     │   │
│  │ ○ 已启用                                       │   │
│  │                                                │   │
│  │ Trigger: Pull Request                         │   │
│  │ Test Suite: suite-api-regression              │   │
│  │ Last Triggered: 2025-11-24 09:15              │   │
│  │ Status: ❌ Failed (38/50)                      │   │
│  │                                                │   │
│  │ [查看配置] [编辑] [禁用] [查看历史]            │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**组件实现**:
```typescript
// components/integration/CICDIntegration.tsx
const CICDIntegration = () => {
    const [platform, setPlatform] = useState<'gitlab' | 'github' | 'jenkins'>('gitlab');
    const [integrations, setIntegrations] = useState<Integration[]>([]);

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">CI/CD 集成</h2>
                <button className="btn-primary">
                    + 新建集成配置
                </button>
            </div>

            {/* 平台选择 */}
            <PlatformTabs value={platform} onChange={setPlatform} />

            {/* 集成配置列表 */}
            <div className="space-y-4 mt-6">
                {integrations.map(integration => (
                    <IntegrationCard
                        key={integration.id}
                        integration={integration}
                        onEdit={handleEdit}
                        onToggle={handleToggle}
                        onViewHistory={handleViewHistory}
                    />
                ))}
            </div>
        </div>
    );
};

// 集成配置编辑器
const IntegrationConfigEditor = ({ platform }: { platform: string }) => {
    return (
        <div className="p-6">
            <h3 className="text-lg font-bold mb-4">配置 {platform} 集成</h3>

            {/* GitLab CI 配置示例 */}
            {platform === 'gitlab' && (
                <div className="space-y-4">
                    <FormField label="项目URL">
                        <input type="text" placeholder="https://gitlab.com/org/project" />
                    </FormField>
                    <FormField label="Access Token">
                        <input type="password" placeholder="glpat-****" />
                    </FormField>
                    <FormField label="触发条件">
                        <MultiSelect options={['Push', 'Merge Request', 'Tag']} />
                    </FormField>
                    <FormField label="测试集">
                        <Select options={testSuites} />
                    </FormField>
                    <FormField label="失败时">
                        <Radio options={['阻止合并', '仅通知', '忽略']} />
                    </FormField>
                </div>
            )}

            {/* 生成配置代码 */}
            <div className="mt-6">
                <h4 className="font-bold mb-2">配置代码 (.gitlab-ci.yml):</h4>
                <CodeBlock language="yaml">
                    {generateGitLabConfig()}
                </CodeBlock>
            </div>

            <div className="mt-6 flex space-x-2">
                <button className="btn-primary">保存配置</button>
                <button className="btn-secondary">测试连接</button>
            </div>
        </div>
    );
};
```

### 3.7 Testing (专项测试) ⭐ 新增

#### 3.7.1 E2E Tests (前端E2E测试)

**路由**: `/testing/e2e`

**功能**:
- E2E 测试列表
- Playwright/Puppeteer 配置
- 浏览器选择 (Chromium/Firefox/WebKit)
- 视口配置
- 截图和视频录制
- 执行 E2E 测试

**UI布局**:
```
┌─────────────────────────────────────────────────────────┐
│  前端 E2E 测试                         [+ 新建E2E测试]   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  【E2E测试列表】                                        │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 🌐 用户登录流程测试                             │   │
│  │ Browser: Chromium  Viewport: 1280x720          │   │
│  │ Actions: 7 steps                                │   │
│  │ Last Run: 2025-11-24 10:00 ✅ Passed            │   │
│  │ [查看] [编辑] [执行] [查看截图]                 │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 🌐 订单创建流程测试                             │   │
│  │ Browser: Firefox  Viewport: 1920x1080          │   │
│  │ Actions: 12 steps                               │   │
│  │ Last Run: 2025-11-24 09:30 ❌ Failed            │   │
│  │ [查看] [编辑] [执行] [查看录屏]                 │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**组件实现**:
```typescript
// components/testing/E2ETestManager.tsx
const E2ETestManager = () => {
    const [e2eTests, setE2ETests] = useState<E2ETest[]>([]);

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">前端 E2E 测试</h2>
                <button className="btn-primary">
                    + 新建 E2E 测试
                </button>
            </div>

            <div className="space-y-4">
                {e2eTests.map(test => (
                    <E2ETestCard
                        key={test.id}
                        test={test}
                        onEdit={handleEdit}
                        onExecute={handleExecute}
                        onViewScreenshots={handleViewScreenshots}
                    />
                ))}
            </div>
        </div>
    );
};

// E2E 测试编辑器
const E2ETestEditor = ({ testId }: { testId?: string }) => {
    const [config, setConfig] = useState<E2ETestConfig>({
        browser: { type: 'chromium', headless: true },
        viewport: { width: 1280, height: 720 },
        actions: []
    });

    return (
        <div className="p-6">
            <h3 className="text-lg font-bold mb-4">E2E 测试配置</h3>

            {/* 浏览器配置 */}
            <div className="mb-6">
                <h4 className="font-bold mb-2">浏览器配置</h4>
                <div className="grid grid-cols-3 gap-4">
                    <FormField label="浏览器类型">
                        <Select
                            value={config.browser.type}
                            options={['chromium', 'firefox', 'webkit']}
                            onChange={(type) => setConfig({
                                ...config,
                                browser: {...config.browser, type}
                            })}
                        />
                    </FormField>
                    <FormField label="视口宽度">
                        <input
                            type="number"
                            value={config.viewport.width}
                            onChange={(e) => setConfig({
                                ...config,
                                viewport: {...config.viewport, width: Number(e.target.value)}
                            })}
                        />
                    </FormField>
                    <FormField label="视口高度">
                        <input
                            type="number"
                            value={config.viewport.height}
                            onChange={(e) => setConfig({
                                ...config,
                                viewport: {...config.viewport, height: Number(e.target.value)}
                            })}
                        />
                    </FormField>
                </div>
                <div className="mt-2">
                    <Checkbox
                        label="无头模式 (Headless)"
                        checked={config.browser.headless}
                        onChange={(headless) => setConfig({
                            ...config,
                            browser: {...config.browser, headless}
                        })}
                    />
                    <Checkbox
                        label="截图"
                        checked={config.screenshots}
                        onChange={(screenshots) => setConfig({...config, screenshots})}
                    />
                    <Checkbox
                        label="视频录制"
                        checked={config.videoRecording}
                        onChange={(videoRecording) => setConfig({...config, videoRecording})}
                    />
                </div>
            </div>

            {/* Action 列表 */}
            <div>
                <h4 className="font-bold mb-2">操作序列</h4>
                <ActionList
                    actions={config.actions}
                    onActionsChange={(actions) => setConfig({...config, actions})}
                />
            </div>

            <div className="mt-6 flex space-x-2">
                <button className="btn-primary">保存</button>
                <button className="btn-secondary">执行测试</button>
            </div>
        </div>
    );
};
```

#### 3.7.2 Mobile Tests (移动端测试)

**路由**: `/testing/mobile`

**功能**:
- 移动端测试列表
- 设备配置 (真机/模拟器/云测试)
- App 配置 (.apk/.ipa)
- 操作序列配置
- 执行移动端测试

**UI布局**:
```typescript
// components/testing/MobileTestManager.tsx
const MobileTestManager = () => {
    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">移动端测试</h2>
                <button className="btn-primary">
                    + 新建移动端测试
                </button>
            </div>

            {/* 平台选择 */}
            <PlatformTabs platform={platform} onChange={setPlatform}>
                <Tab value="android" label="Android" />
                <Tab value="ios" label="iOS" />
            </PlatformTabs>

            {/* 测试列表 */}
            <div className="space-y-4 mt-6">
                {mobileTests.map(test => (
                    <MobileTestCard
                        key={test.id}
                        test={test}
                        onEdit={handleEdit}
                        onExecute={handleExecute}
                    />
                ))}
            </div>
        </div>
    );
};
```

---

## 4. 核心功能页面设计

### 4.1 Library (素材库)

#### 4.1.1 Action Templates (Action模板)

**路由**: `/library/actions`

**现状**: 已有 `ActionLibrary.tsx` 组件

**增强**:
- 支持通用 Action Template (不仅是脚本)
- 按类别分组 (Network/Database/Messaging/etc.)
- 按作用域筛选 (System/Platform/Tenant)
- 智能搜索和推荐
- 拖拽到 Workflow 编辑器

**UI增强**:
```typescript
// 增强现有 ActionLibrary.tsx
const ActionLibrary = () => {
    const [category, setCategory] = useState<string>('all');
    const [scope, setScope] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState<string>('');

    return (
        <div className="h-screen flex flex-col">
            {/* 搜索栏 (增强) */}
            <div className="p-4 border-b">
                <SearchBar
                    value={searchQuery}
                    onChange={setSearchQuery}
                    placeholder="搜索 Action (支持模糊搜索、标签搜索)"
                    onSearch={handleSearch}
                />
            </div>

            {/* 类别和作用域筛选 */}
            <div className="p-4 border-b">
                <CategoryTabs value={category} onChange={setCategory} />
                <ScopeFilter value={scope} onChange={setScope} />
            </div>

            {/* 推荐 Actions */}
            {searchQuery === '' && (
                <div className="p-4">
                    <h3 className="font-bold mb-2">推荐 Actions</h3>
                    <RecommendedActions context={currentWorkflow} />
                </div>
            )}

            {/* Action 列表 */}
            <div className="flex-1 overflow-y-auto p-4">
                <ActionGrid
                    actions={filteredActions}
                    onDragStart={handleDragStart}
                    onSelect={handleSelect}
                />
            </div>
        </div>
    );
};
```

---

## 5. 组件架构

### 5.1 组件目录结构

```
components/
├── layout/                    # 布局组件
│   ├── Header.tsx            # 顶部导航
│   ├── Sidebar.tsx           # 侧边栏 (已有,需增强)
│   └── Breadcrumb.tsx        # 面包屑导航
│
├── dashboard/                 # 仪表盘
│   ├── Dashboard.tsx         # 主仪表盘 (已有)
│   ├── StatCard.tsx          # 统计卡片
│   ├── TrendChart.tsx        # 趋势图表
│   └── RecentExecutions.tsx  # 最近执行记录
│
├── repository/                # 测试仓库
│   ├── TestCaseManager.tsx   # 测试用例管理器 (已有,需增强)
│   ├── TestCaseSidebar.tsx   # 侧边栏过滤器
│   ├── TestCaseToolbar.tsx   # 工具栏
│   ├── TestCaseList.tsx      # 用例列表
│   ├── TestCaseCard.tsx      # 用例卡片
│   ├── TestSuiteManager.tsx  # 测试集合管理 ⭐ 新增
│   └── TestGroupTree.tsx     # 分组树
│
├── automation/                # 自动化
│   ├── WorkflowList.tsx      # 工作流列表
│   ├── WorkflowEditor.tsx    # 工作流编辑器 ⭐ 新增
│   │   ├── SimpleWorkflowEditor.tsx   # Simple Mode
│   │   ├── AdvancedWorkflowEditor.tsx # Advanced Mode
│   │   └── DataFlowMapper.tsx         # 数据流映射器 ⭐ 新增
│   ├── WorkflowCanvas.tsx    # 图形画布 (已有)
│   ├── StepConfigPanel.tsx   # Step配置面板
│   └── ExecutionHistory.tsx  # 执行历史
│
├── resources/                 # 资源管理 ⭐ 新增
│   ├── ResourceLibrary.tsx   # 资源模板库
│   ├── ResourceTemplateCard.tsx # 资源模板卡片
│   ├── ResourceInstances.tsx # 资源实例管理
│   ├── ResourcePoolMonitor.tsx # 资源池监控
│   └── ResourceEditor.tsx    # 资源编辑器
│
├── library/                   # 素材库
│   ├── ActionLibrary.tsx     # Action库 (已有,需增强)
│   ├── ActionTemplateCard.tsx # Action卡片
│   ├── ActionEditor.tsx      # Action编辑器
│   └── TestScriptManager.tsx # 测试脚本管理器
│
├── reports/                   # 报告中心 ⭐ 新增
│   ├── ReportCenter.tsx      # 报告中心
│   ├── ReportCard.tsx        # 报告卡片
│   ├── ReportViewer.tsx      # 报告查看器
│   ├── TrendAnalysis.tsx     # 趋势分析
│   └── ReportSubscription.tsx # 报告订阅
│
├── integration/               # 集成 ⭐ 新增
│   ├── CICDIntegration.tsx   # CI/CD集成
│   ├── WebhookConfig.tsx     # Webhook配置
│   └── IntegrationHistory.tsx # 集成历史
│
├── testing/                   # 专项测试 ⭐ 新增
│   ├── E2ETestManager.tsx    # E2E测试管理
│   ├── E2ETestEditor.tsx     # E2E测试编辑器
│   ├── MobileTestManager.tsx # 移动端测试管理
│   └── MobileTestEditor.tsx  # 移动端测试编辑器
│
├── testcase/                  # 测试用例 (已有)
│   └── stepEditor/           # Step编辑器 (已有,需增强)
│       ├── StepCard.tsx      # Step卡片
│       ├── ConditionEditor.tsx # 条件编辑器
│       ├── LoopEditor.tsx    # 循环编辑器 ⭐ 新增
│       └── BranchEditor.tsx  # 分支编辑器 ⭐ 新增
│
├── workflow/                  # 工作流 (已有)
│   ├── nodes/                # 自定义节点 ⭐ 新增
│   │   ├── ActionNode.tsx    # Action节点
│   │   ├── BranchNode.tsx    # 分支节点
│   │   ├── LoopNode.tsx      # 循环节点
│   │   └── MergeNode.tsx     # 合并节点
│   └── WorkflowBuilder.tsx   # 工作流构建器 (已有)
│
├── admin/                     # 管理 (已有)
│   ├── TenantManagement.tsx  # 租户管理
│   ├── ProjectManagement.tsx # 项目管理
│   ├── EnvironmentManagement.tsx # 环境管理
│   └── UserManagement.tsx    # 用户管理
│
├── common/                    # 通用组件
│   ├── Button.tsx
│   ├── Modal.tsx
│   ├── Table.tsx
│   ├── Form.tsx
│   ├── Select.tsx
│   ├── MultiSelect.tsx
│   ├── CodeBlock.tsx
│   ├── StatusBadge.tsx
│   ├── FilterChip.tsx
│   ├── ValidationPanel.tsx   # 验证面板 ⭐ 新增
│   └── ...
│
└── config/                    # 配置 (已有)
    └── ConfigEditor.tsx
```

### 5.2 关键组件接口

#### 5.2.1 WorkflowEditor Props

```typescript
interface WorkflowEditorProps {
    workflowId?: string;              // 编辑已有工作流时传入
    mode: 'simple' | 'advanced';      // 编辑模式
    onSave: (workflow: Workflow) => Promise<void>;
    onExecute: (workflow: Workflow) => Promise<void>;
    onModeChange?: (mode: 'simple' | 'advanced') => void;
}
```

#### 5.2.2 DataFlowMapper Props

```typescript
interface DataFlowMapperProps {
    step: WorkflowStep;               // 当前步骤
    workflow: Workflow;               // 完整工作流
    onMappingChange: (mappings: DataMapper[]) => void;
}
```

#### 5.2.3 ActionLibrary Props

```typescript
interface ActionLibraryProps {
    draggable?: boolean;              // 是否支持拖拽
    onSelect?: (action: ActionTemplate) => void;
    onDragStart?: (action: ActionTemplate, event: DragEvent) => void;
    filters?: {
        category?: string;
        scope?: string;
        tags?: string[];
    };
}
```

---

## 6. 路由设计

### 6.1 路由表

```typescript
// Router.tsx
const routes = [
    // Dashboard
    { path: '/dashboard', component: Dashboard, permission: 'VIEW_DASHBOARD' },

    // Repository
    { path: '/repository/cases', component: TestCaseManager, permission: 'VIEW_CASES' },
    { path: '/repository/cases/:id', component: TestCaseDetail, permission: 'VIEW_CASES' },
    { path: '/repository/suites', component: TestSuiteManager, permission: 'VIEW_CASES' },
    { path: '/repository/groups', component: TestGroupManager, permission: 'VIEW_CASES' },

    // Automation
    { path: '/automation/workflows', component: WorkflowList, permission: 'VIEW_AUTOMATION' },
    { path: '/automation/workflows/new', component: WorkflowEditor, permission: 'CREATE_WORKFLOW' },
    { path: '/automation/workflows/:id/edit', component: WorkflowEditor, permission: 'EDIT_WORKFLOW', props: { mode: 'simple' } },
    { path: '/automation/workflows/:id/advanced', component: WorkflowEditor, permission: 'EDIT_WORKFLOW', props: { mode: 'advanced' } },
    { path: '/automation/executions', component: ExecutionHistory, permission: 'VIEW_AUTOMATION' },

    // Resources ⭐ 新增
    { path: '/resources/library', component: ResourceLibrary, permission: 'VIEW_RESOURCES' },
    { path: '/resources/instances', component: ResourceInstances, permission: 'VIEW_RESOURCES' },
    { path: '/resources/pools', component: ResourcePoolMonitor, permission: 'VIEW_RESOURCES' },

    // Library
    { path: '/library/actions', component: ActionLibrary, permission: 'VIEW_LIBRARY' },
    { path: '/library/scripts', component: TestScriptManager, permission: 'VIEW_LIBRARY' },

    // Reports ⭐ 新增
    { path: '/reports/executions', component: ReportCenter, permission: 'VIEW_REPORTS' },
    { path: '/reports/trends', component: TrendAnalysis, permission: 'VIEW_REPORTS' },
    { path: '/reports/subscriptions', component: ReportSubscription, permission: 'VIEW_REPORTS' },
    { path: '/reports/:id', component: ReportViewer, permission: 'VIEW_REPORTS' },

    // Integration ⭐ 新增
    { path: '/integration/cicd', component: CICDIntegration, permission: 'MANAGE_INTEGRATION' },
    { path: '/integration/webhooks', component: WebhookConfig, permission: 'MANAGE_INTEGRATION' },

    // Testing ⭐ 新增
    { path: '/testing/e2e', component: E2ETestManager, permission: 'MANAGE_E2E_TESTS' },
    { path: '/testing/mobile', component: MobileTestManager, permission: 'MANAGE_MOBILE_TESTS' },

    // Database
    { path: '/database', component: DatabaseManager, permission: 'VIEW_DATABASE' },

    // History
    { path: '/history', component: HistoryViewer, permission: 'VIEW_HISTORY' },

    // Docs
    { path: '/docs', component: DocumentationHub, permission: 'VIEW_DOCS' },

    // Settings
    { path: '/settings/organization', component: OrganizationSettings, permission: 'MANAGE_ORGANIZATION' },
    { path: '/settings/projects', component: ProjectSettings, permission: 'MANAGE_PROJECTS' },
    { path: '/settings/environments', component: EnvironmentSettings, permission: 'MANAGE_ENVIRONMENTS' },
    { path: '/settings/users', component: UserManagement, permission: 'MANAGE_USERS' },
    { path: '/settings/system', component: SystemConfig, permission: 'MANAGE_SYSTEM' },
];
```

### 6.2 路由守卫

```typescript
// RouteGuard.tsx
const RouteGuard = ({ route, children }: { route: Route; children: ReactNode }) => {
    const { user, permissions } = useAuth();

    if (!user) {
        return <Navigate to="/login" />;
    }

    if (route.permission && !permissions.includes(route.permission)) {
        return <Forbidden />;
    }

    return <>{children}</>;
};
```

---

## 7. 状态管理

### 7.1 全局状态

使用 React Context + Hooks 管理全局状态:

```typescript
// contexts/AppContext.tsx
interface AppState {
    // 多租户上下文
    currentTenant: Tenant | null;
    currentProject: Project | null;
    currentEnvironment: Environment | null;

    // 用户上下文
    user: User | null;
    permissions: string[];

    // UI 状态
    sidebarCollapsed: boolean;
    theme: 'light' | 'dark';
    language: 'zh-CN' | 'en-US';
}

const AppContext = createContext<AppState | null>(null);

export const AppProvider = ({ children }: { children: ReactNode }) => {
    const [state, setState] = useState<AppState>({
        currentTenant: null,
        currentProject: null,
        currentEnvironment: null,
        user: null,
        permissions: [],
        sidebarCollapsed: false,
        theme: 'light',
        language: 'zh-CN'
    });

    return (
        <AppContext.Provider value={state}>
            {children}
        </AppContext.Provider>
    );
};

export const useApp = () => useContext(AppContext);
```

### 7.2 页面级状态

每个页面使用独立的状态管理:

```typescript
// 示例: TestCaseManager 状态
const TestCaseManager = () => {
    // 筛选状态
    const [filters, setFilters] = useState<TestFilters>({
        groups: [],
        tags: [],
        priorities: [],
        statuses: []
    });

    // 选中状态
    const [selectedCases, setSelectedCases] = useState<string[]>([]);

    // 视图状态
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

    // 分页状态
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);

    // 数据状态
    const [testCases, setTestCases] = useState<TestCase[]>([]);
    const [loading, setLoading] = useState(false);

    // ... 其他逻辑
};
```

---

## 8. 权限控制

### 8.1 权限定义

```typescript
// types/permissions.ts
export const PERMISSIONS = {
    // Dashboard
    VIEW_DASHBOARD: 'VIEW_DASHBOARD',

    // Test Repository
    VIEW_CASES: 'VIEW_CASES',
    CREATE_CASE: 'CREATE_CASE',
    EDIT_CASE: 'EDIT_CASE',
    DELETE_CASE: 'DELETE_CASE',
    EXECUTE_CASE: 'EXECUTE_CASE',

    // Automation
    VIEW_AUTOMATION: 'VIEW_AUTOMATION',
    CREATE_WORKFLOW: 'CREATE_WORKFLOW',
    EDIT_WORKFLOW: 'EDIT_WORKFLOW',
    DELETE_WORKFLOW: 'DELETE_WORKFLOW',
    EXECUTE_WORKFLOW: 'EXECUTE_WORKFLOW',

    // Resources
    VIEW_RESOURCES: 'VIEW_RESOURCES',
    MANAGE_RESOURCES: 'MANAGE_RESOURCES',

    // Library
    VIEW_LIBRARY: 'VIEW_LIBRARY',
    MANAGE_LIBRARY: 'MANAGE_LIBRARY',

    // Reports
    VIEW_REPORTS: 'VIEW_REPORTS',
    GENERATE_REPORTS: 'GENERATE_REPORTS',

    // Integration
    MANAGE_INTEGRATION: 'MANAGE_INTEGRATION',

    // Testing
    MANAGE_E2E_TESTS: 'MANAGE_E2E_TESTS',
    MANAGE_MOBILE_TESTS: 'MANAGE_MOBILE_TESTS',

    // Admin
    MANAGE_ORGANIZATION: 'MANAGE_ORGANIZATION',
    MANAGE_PROJECTS: 'MANAGE_PROJECTS',
    MANAGE_ENVIRONMENTS: 'MANAGE_ENVIRONMENTS',
    MANAGE_USERS: 'MANAGE_USERS',
    MANAGE_SYSTEM: 'MANAGE_SYSTEM'
} as const;
```

### 8.2 权限检查 Hook

```typescript
// hooks/usePermission.ts
export const usePermission = () => {
    const { permissions } = useApp();

    const hasPermission = (permission: string): boolean => {
        return permissions.includes(permission);
    };

    const hasAnyPermission = (requiredPermissions: string[]): boolean => {
        return requiredPermissions.some(p => permissions.includes(p));
    };

    const hasAllPermissions = (requiredPermissions: string[]): boolean => {
        return requiredPermissions.every(p => permissions.includes(p));
    };

    return {
        hasPermission,
        hasAnyPermission,
        hasAllPermissions
    };
};
```

### 8.3 权限控制组件

```typescript
// components/common/PermissionGuard.tsx
const PermissionGuard = ({
    permission,
    fallback = null,
    children
}: {
    permission: string;
    fallback?: ReactNode;
    children: ReactNode;
}) => {
    const { hasPermission } = usePermission();

    if (!hasPermission(permission)) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
};

// 使用示例
<PermissionGuard permission="DELETE_CASE">
    <button onClick={handleDelete}>删除</button>
</PermissionGuard>
```

---

## 9. 多租户支持

### 9.1 租户上下文切换

```typescript
// components/layout/TenantSelector.tsx
const TenantSelector = () => {
    const { currentTenant, setCurrentTenant } = useApp();
    const [tenants, setTenants] = useState<Tenant[]>([]);

    return (
        <div className="flex items-center space-x-2">
            {/* 组织选择器 */}
            <Select
                value={currentTenant?.id}
                options={tenants}
                onChange={handleTenantChange}
                placeholder="选择组织"
            />

            {/* 项目选择器 */}
            {currentTenant && (
                <ProjectSelector tenantId={currentTenant.id} />
            )}

            {/* 环境选择器 */}
            {currentProject && (
                <EnvironmentSelector projectId={currentProject.id} />
            )}
        </div>
    );
};
```

### 9.2 数据过滤

所有数据请求自动携带租户上下文:

```typescript
// api/client.ts
export const apiClient = {
    get: async (url: string, params?: any) => {
        const { currentTenant, currentProject } = getAppState();

        const headers = {
            'X-Tenant-ID': currentTenant?.id || '',
            'X-Project-ID': currentProject?.id || ''
        };

        return fetch(url, {
            method: 'GET',
            headers,
            params
        });
    },
    // ... 其他方法
};
```

---

## 10. 技术栈

### 10.1 核心技术

| 技术 | 版本 | 用途 |
|------|------|------|
| React | 19.2 | UI 框架 |
| TypeScript | 5.x | 类型系统 |
| Vite | 6.2 | 构建工具 |
| React Router | 7.x | 路由管理 |
| React Flow | 11.x | 图形化编辑器 (Workflow Advanced Mode) |
| Recharts | 3.4 | 数据可视化 (报告图表) |
| Lucide React | - | 图标库 |

### 10.2 新增依赖

```json
{
  "dependencies": {
    "react-flow-renderer": "^11.x",  // 图形化 Workflow 编辑器
    "dagre": "^0.8.x",                // 自动布局算法
    "react-beautiful-dnd": "^13.x",   // 拖拽排序 (Simple Mode)
    "@tanstack/react-query": "^5.x",  // 数据请求和缓存
    "zustand": "^4.x",                // 轻量级状态管理 (可选)
    "recharts": "^3.4",               // 图表库 (已有)
    "date-fns": "^3.x",               // 日期处理
    "lodash-es": "^4.x",              // 工具库
    "classnames": "^2.x",             // className 工具
    "monaco-editor": "^0.45.x"        // 代码编辑器 (用于 JSON/YAML 编辑)
  }
}
```

---

## 11. 实施路线图

### 11.1 Phase 1: 基础增强 (1-2周)

**优先级**: 🔴 高

**目标**: 增强现有功能,添加缺失的核心页面

#### 前端任务

1. **增强 Sidebar 导航**
   - 添加新菜单项: Resources, Reports, Integration, Testing
   - 图标更新
   - 权限控制

2. **增强 TestCaseManager**
   - 添加智能搜索
   - 添加快速过滤器
   - 添加标签云
   - 优化列表性能

3. **新增 TestSuiteManager 页面**
   - 测试集合列表
   - 静态/动态集合管理
   - 批量执行

4. **新增 ResourceLibrary 页面**
   - 资源模板列表
   - 按类别/作用域筛选
   - 复制到私有库

5. **新增 ReportCenter 页面**
   - 报告列表
   - 报告查看器
   - 导出功能

#### 验收标准

- ✅ 导航菜单包含所有新增页面
- ✅ TestSuiteManager 可以创建和管理测试集合
- ✅ ResourceLibrary 可以浏览和使用资源模板
- ✅ ReportCenter 可以查看和导出报告

---

### 11.2 Phase 2: 双模式编辑器 (2-3周)

**优先级**: 🔴 高

**目标**: 实现 Workflow 双模式编辑器

#### 前端任务

1. **SimpleWorkflowEditor (列表式)**
   - 基于现有 StepCard 优化
   - 拖拽排序
   - 折叠/展开配置

2. **AdvancedWorkflowEditor (图形式)**
   - React Flow 集成
   - 自定义节点类型 (Action/Branch/Loop/Merge)
   - 自动布局算法
   - Mini Map 和 Controls

3. **DataFlowMapper (数据映射)**
   - 三栏布局
   - 拖拽连线
   - JSONPath 编辑器
   - 转换函数选择器

4. **模式切换逻辑**
   - 自动检测复杂流程
   - 转换算法 (列表 ↔ DAG)
   - 保持数据一致性

#### 验收标准

- ✅ Simple Mode 支持列表式编辑和拖拽排序
- ✅ Advanced Mode 支持图形化编辑和自动布局
- ✅ 两种模式可以无缝切换
- ✅ DataFlowMapper 支持拖拽配置数据映射

---

### 11.3 Phase 3: 专项测试 (1-2周)

**优先级**: 🟡 中

**目标**: 添加 E2E 和移动端测试支持

#### 前端任务

1. **E2ETestManager 页面**
   - E2E 测试列表
   - 浏览器配置
   - 操作序列编辑器
   - 截图/视频查看

2. **MobileTestManager 页面**
   - 移动端测试列表
   - 设备管理
   - App 配置
   - 操作序列编辑器

#### 验收标准

- ✅ 可以创建和配置 E2E 测试
- ✅ 可以创建和配置移动端测试
- ✅ 可以查看测试执行结果和截图/视频

---

### 11.4 Phase 4: CI/CD集成 (1周)

**优先级**: 🟡 中

**目标**: 添加 CI/CD 集成管理

#### 前端任务

1. **CICDIntegration 页面**
   - 集成配置列表
   - GitLab/GitHub/Jenkins 配置编辑器
   - Webhook 配置
   - 执行历史

2. **配置代码生成器**
   - 自动生成 .gitlab-ci.yml
   - 自动生成 GitHub Actions workflow
   - 自动生成 Jenkinsfile

#### 验收标准

- ✅ 可以配置 GitLab CI/GitHub Actions/Jenkins 集成
- ✅ 可以查看集成执行历史
- ✅ 可以自动生成配置代码

---

### 11.5 Phase 5: 报告增强 (1周)

**优先级**: 🟢 低

**目标**: 增强报告功能

#### 前端任务

1. **TrendAnalysis 页面**
   - 成功率趋势图
   - 执行次数趋势图
   - Top 失败用例
   - Flaky 测试识别

2. **ReportSubscription 页面**
   - 订阅配置
   - 定时发送
   - 接收人管理

#### 验收标准

- ✅ 可以查看趋势分析图表
- ✅ 可以配置报告订阅

---

## 附录

### A. 颜色规范

```typescript
// tailwind.config.js
module.exports = {
    theme: {
        extend: {
            colors: {
                primary: {
                    50: '#eff6ff',
                    100: '#dbeafe',
                    500: '#3b82f6',
                    600: '#2563eb',
                    700: '#1d4ed8',
                },
                success: {
                    500: '#10b981',
                    600: '#059669',
                },
                warning: {
                    500: '#f59e0b',
                    600: '#d97706',
                },
                error: {
                    500: '#ef4444',
                    600: '#dc2626',
                }
            }
        }
    }
}
```

### B. 图标规范

使用 Lucide React 图标库,统一图标风格:

```typescript
// 常用图标
import {
    LayoutDashboard,  // Dashboard
    ListTodo,         // Test Cases
    GitMerge,         // Workflows
    Database,         // Resources
    Library,          // Action Library
    BarChart3,        // Reports
    Plug,             // Integration
    Smartphone,       // Mobile Tests
    Globe,            // E2E Tests
    Settings,         // Settings
    CheckCircle,      // Success
    XCircle,          // Error
    AlertCircle,      // Warning
    PlayCircle,       // Execute
    Zap               // Action
} from 'lucide-react';
```

### C. 参考文档

- [TEST_PLATFORM_PRODUCTIZATION_DESIGN.md](./TEST_PLATFORM_PRODUCTIZATION_DESIGN.md) - 产品化设计
- [UNIFIED_WORKFLOW_ARCHITECTURE.md](./UNIFIED_WORKFLOW_ARCHITECTURE.md) - Workflow架构
- [SELF_TEST_ORGANIZATION.md](./SELF_TEST_ORGANIZATION.md) - 自测用例组织
- [DATABASE_DESIGN.md](./DATABASE_DESIGN.md) - 数据库设计
- [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) - API文档

---

**文档结束**
