# 前端架构增强方案

> **文档版本**: v2.0.0
> **创建日期**: 2025-11-24
> **基于现有结构的渐进式增强方案**

## 目录

- [1. 现状分析](#1-现状分析)
- [2. 增强策略](#2-增强策略)
- [3. 导航结构优化](#3-导航结构优化)
- [4. 现有组件增强](#4-现有组件增强)
- [5. 新增组件设计](#5-新增组件设计)
- [6. 实施路线图](#6-实施路线图)

---

## 1. 现状分析

### 1.1 现有组件清单

#### ✅ 已实现的核心功能

**1. Dashboard (Dashboard.tsx)**
- ✅ 统计卡片 (StatCards)
- ✅ 图表展示 (Charts - Pie & Bar)
- ✅ AI洞察 (Gemini集成)
- ✅ 报告导出 (ReportModal)

**2. TestCaseManager (TestCaseManager.tsx)**
- ✅ 三栏布局: FolderTree | CaseList | CaseDetail
- ✅ 测试用例CRUD
- ✅ AI生成用例 (AIGeneratorModal)
- ✅ 测试执行 (TestRunner)
- ✅ 用例编辑器 (TestCaseEditor)

**3. ScriptLab (ScriptLab.tsx)**
- ✅ 双模式: Scripts | Workflows
- ✅ 可视化工作流编辑器 (WorkflowCanvas)
- ✅ 节点拖拽和配置 (NodeInspector)
- ✅ 代码视图切换 (YamlEditor)
- ✅ Action编辑器 (ActionEditor)

**4. ActionLibrary (ActionLibrary.tsx)**
- ✅ Action模板管理
- ✅ Action详情查看 (ActionDetails)
- ✅ Action测试台 (ActionTestBench)

**5. DatabaseManager (DatabaseManager.tsx)**
- ✅ 表结构设计 (TableDesigner)
- ✅ 数据查看和编辑 (TableData)
- ✅ 表列表 (TableList)

**6. TestHistory (TestHistory.tsx)**
- ✅ 执行历史记录
- ✅ 执行详情 (RunDetail)

**7. DocumentationHub (DocumentationHub.tsx)**
- ✅ 文档中心

**8. AdminPortal (AdminPortal.tsx)**
- ✅ 组织管理 (OrgTab)
- ✅ 项目管理 (ProjectTab)
- ✅ 用户管理 (UserTab)
- ✅ 角色管理 (RoleTab)

**9. SystemConfig (SystemConfig.tsx)**
- ✅ 环境管理 (EnvManager)
- ✅ 通用设置 (GeneralSettings)
- ✅ 安全设置 (SecuritySettings)

### 1.2 现有布局模式

**三栏布局** (TestCaseManager已实现):
```
┌─────────────────────────────────────────────────────┐
│  [左栏 250px]    [中栏 flex-1]    [右栏 400px]      │
│  Folder Tree     Case List        Case Detail       │
└─────────────────────────────────────────────────────┘
```

**可视化编辑器** (ScriptLab已实现):
```
┌─────────────────────────────────────────────────────┐
│  Header: Mode Toggle | Layout Toggle | Run Button   │
├─────────────────────────────────────────────────────┤
│  [左栏]           [Canvas]           [Inspector]     │
│  Script/         Visual/Code         Node Config     │
│  Workflow List    Editor                             │
└─────────────────────────────────────────────────────┘
```

### 1.3 缺失功能

根据产品化设计文档 (`TEST_PLATFORM_PRODUCTIZATION_DESIGN.md`):

#### 🔴 高优先级缺失

1. **资源管理模块** - 完全缺失
   - ❌ 资源模板库 (Resource Templates)
   - ❌ 资源实例管理 (Resource Instances)
   - ❌ 资源池监控 (Resource Pools)

2. **测试集合管理** - 部分缺失
   - ❌ 测试集合 (Test Suites) - 静态/动态集合
   - ⚠️ 测试分组 (Test Groups) - 仅有简单文件夹树

3. **报告增强** - 部分实现
   - ✅ 基础报告 (Dashboard已有)
   - ❌ 趋势分析 (Trend Analysis)
   - ❌ 报告订阅 (Report Subscription)
   - ❌ 多格式导出 (HTML/PDF/JSON)

4. **CI/CD集成** - 完全缺失
   - ❌ GitLab/GitHub/Jenkins配置
   - ❌ Webhook管理
   - ❌ 执行历史和状态监控

5. **测试用例管理增强** - 部分缺失
   - ⚠️ 智能标签 (部分实现,需增强)
   - ❌ 高级搜索和过滤
   - ❌ 价值评估
   - ❌ Flaky测试识别

#### 🟡 中优先级缺失

6. **专项测试** - 完全缺失
   - ❌ E2E测试配置 (前端测试)
   - ❌ 移动端测试配置

---

## 2. 增强策略

### 2.1 设计原则

1. **渐进式增强**: 在现有组件基础上扩展,而非重写
2. **一致性**: 保持现有UI风格和交互模式
3. **复用现有模式**: 复用三栏布局、卡片设计、Modal弹窗等
4. **最小化破坏**: 不改变现有API和数据结构

### 2.2 增强方式分类

| 增强类型 | 说明 | 示例 |
|---------|------|------|
| **扩展现有组件** | 在现有组件中添加新Tab/Section | TestCaseManager添加搜索过滤栏 |
| **新增独立页面** | 创建新的顶级导航页面 | ResourceLibrary, CICDIntegration |
| **Modal弹窗** | 通过弹窗提供功能,不占用导航 | TestSuiteEditor, TrendReportViewer |
| **侧边栏面板** | 可折叠的侧边面板 | AdvancedFilterPanel |

---

## 3. 导航结构优化

### 3.1 现有导航 (App.tsx + Sidebar.tsx)

```typescript
// 当前 9 个导航项
const currentNavItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'cases', icon: ListTodo, label: 'Test Cases' },
    { id: 'automation', icon: GitMerge, label: 'Automation' }, // ScriptLab
    { id: 'library', icon: Library, label: 'Library' },        // ActionLibrary
    { id: 'database', icon: Database, label: 'Database' },
    { id: 'history', icon: History, label: 'History' },
    { id: 'docs', icon: BookOpen, label: 'Docs' },
    { id: 'admin', icon: Users, label: 'Admin' },
    { id: 'settings', icon: Settings, label: 'Settings' }
];
```

### 3.2 优化后导航 (新增 3 项)

```typescript
// 新增 3 个导航项,总共 12 项
const enhancedNavItems = [
    // ... 保留现有 9 项 ...

    // 🆕 新增导航项
    { id: 'resources', icon: Package, label: 'Resources', permission: 'VIEW_RESOURCES' },
    { id: 'reports', icon: BarChart3, label: 'Reports', permission: 'VIEW_REPORTS' },
    { id: 'integration', icon: Plug, label: 'Integration', permission: 'MANAGE_INTEGRATION' },
];
```

**设计决策**:
- ❌ **不添加** `Testing` 独立页面 - E2E和移动端测试作为TestCase的子类型
- ✅ **合并** Automation + Library → 保持现有结构,ScriptLab已经很完善
- ✅ **专注** 添加最重要的三个缺失模块

---

## 4. 现有组件增强

### 4.1 TestCaseManager 增强

#### 当前布局
```
┌───────────────────────────────────────────────────────┐
│  [左栏 w-64]      [中栏 flex-1]     [右栏 w-96]       │
│  FolderTree       CaseList          CaseDetail        │
│  - 文件夹树       - 用例卡片列表     - 详情展示       │
│                   - 新建按钮         - 编辑/运行按钮  │
│                   - AI生成按钮                        │
└───────────────────────────────────────────────────────┘
```

#### 🔧 增强点

**1. 左栏增强 - 添加快速过滤器**

```typescript
// components/testcase/FolderTree.tsx 扩展
const FolderTree = ({ folders, selectedFolderId, onSelectFolder, onAddFolder }) => {
    return (
        <div className="w-64 border-r bg-slate-50 p-4 overflow-y-auto">
            {/* 现有文件夹树 */}
            <div className="mb-4">
                <h3 className="text-xs font-bold text-slate-600 mb-2">测试分组</h3>
                {/* 现有树结构 */}
            </div>

            {/* 🆕 新增: 快速过滤器 */}
            <div className="mb-4 border-t pt-4">
                <h3 className="text-xs font-bold text-slate-600 mb-2">快速过滤</h3>
                <div className="space-y-1">
                    <QuickFilter icon="👤" label="我的测试" count={12} />
                    <QuickFilter icon="🔥" label="P0用例" count={45} />
                    <QuickFilter icon="⚠️" label="不稳定" count={3} badge="warning" />
                    <QuickFilter icon="⏱️" label="长时间运行" count={8} />
                    <QuickFilter icon="💤" label="30天未执行" count={15} />
                </div>
            </div>

            {/* 🆕 新增: 标签云 */}
            <div className="border-t pt-4">
                <h3 className="text-xs font-bold text-slate-600 mb-2">标签云</h3>
                <div className="flex flex-wrap gap-1">
                    <TagChip label="smoke" count={23} />
                    <TagChip label="regression" count={156} />
                    <TagChip label="api" count={89} />
                    <TagChip label="e2e" count={34} />
                </div>
            </div>
        </div>
    );
};

// 🆕 新增组件
const QuickFilter: React.FC<{ icon: string; label: string; count: number; badge?: string }> =
    ({ icon, label, count, badge }) => (
    <button className="w-full flex items-center justify-between px-2 py-1.5 rounded hover:bg-slate-100 text-sm group">
        <span className="flex items-center space-x-2">
            <span>{icon}</span>
            <span className="text-slate-700">{label}</span>
        </span>
        <span className={`text-xs px-1.5 py-0.5 rounded ${
            badge === 'warning' ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-600'
        }`}>{count}</span>
    </button>
);

const TagChip: React.FC<{ label: string; count: number }> = ({ label, count }) => (
    <button className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-full hover:bg-blue-100 transition-colors">
        #{label} ({count})
    </button>
);
```

**2. 中栏增强 - 添加高级搜索和过滤**

```typescript
// components/testcase/CaseList.tsx 扩展
const CaseList = ({ cases, selectedCaseId, onSelectCase, onEditCase, onAddCase, onGenerateAI }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);
    const [filters, setFilters] = useState({
        priorities: [],
        statuses: [],
        tags: [],
        owners: [],
    });

    return (
        <div className="flex-1 flex flex-col border-r">
            {/* 🆕 增强: 搜索栏 */}
            <div className="p-4 border-b bg-white space-y-3">
                <div className="flex items-center space-x-2">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            placeholder="搜索测试用例 (支持标题、描述、标签)"
                            className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={() => setShowAdvancedFilter(!showAdvancedFilter)}
                        className={`px-3 py-2 border rounded-lg text-sm transition-colors ${
                            showAdvancedFilter ? 'bg-primary-50 border-primary-300 text-primary-700' : 'hover:bg-slate-50'
                        }`}
                    >
                        <SlidersHorizontal size={16} />
                    </button>
                </div>

                {/* 🆕 新增: 当前过滤器Chips */}
                {(filters.priorities.length > 0 || filters.tags.length > 0) && (
                    <div className="flex flex-wrap gap-2">
                        {filters.priorities.map(p => (
                            <FilterChip key={p} label={`优先级: ${p}`} onRemove={() => {}} />
                        ))}
                        {filters.tags.map(t => (
                            <FilterChip key={t} label={`标签: ${t}`} onRemove={() => {}} />
                        ))}
                        <button className="text-xs text-slate-500 hover:text-slate-700">清除全部</button>
                    </div>
                )}

                {/* 🆕 新增: 高级过滤面板 (可折叠) */}
                {showAdvancedFilter && (
                    <div className="p-4 bg-slate-50 rounded-lg border space-y-3 animate-slide-down">
                        <FilterSection label="优先级">
                            <Checkbox label="P0" />
                            <Checkbox label="P1" />
                            <Checkbox label="P2" />
                        </FilterSection>
                        <FilterSection label="状态">
                            <Checkbox label="Draft" />
                            <Checkbox label="Active" />
                            <Checkbox label="Deprecated" />
                        </FilterSection>
                        <FilterSection label="成功率">
                            <RangeSlider min={0} max={100} value={[80, 100]} />
                        </FilterSection>
                        <div className="flex justify-end space-x-2">
                            <button className="px-3 py-1 text-sm text-slate-600 hover:bg-slate-100 rounded">重置</button>
                            <button className="px-3 py-1 text-sm bg-primary-600 text-white rounded hover:bg-primary-700">应用</button>
                        </div>
                    </div>
                )}
            </div>

            {/* 现有用例列表 */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {/* 现有 CaseCard 渲染 */}
            </div>
        </div>
    );
};
```

**3. 右栏增强 - 添加价值评分和统计**

```typescript
// components/testcase/CaseDetail.tsx 扩展
const CaseDetail = ({ testCase, onEdit, onRun, onDelete }) => {
    if (!testCase) return <EmptyState />;

    return (
        <div className="w-96 border-l bg-white p-6 overflow-y-auto">
            {/* 现有详情展示 */}

            {/* 🆕 新增: 价值评分卡片 */}
            <div className="mt-6 p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center">
                    <Award size={16} className="mr-2 text-blue-600" />
                    用例价值评估
                </h4>
                <div className="space-y-2">
                    <ValueScore label="覆盖分数" value={95} color="green" />
                    <ValueScore label="稳定性" value={testCase.successRate || 0} color="blue" />
                    <ValueScore label="执行效率" value={85} color="amber" />
                    <ValueScore label="维护成本" value={90} color="purple" />
                </div>
                <div className="mt-3 pt-3 border-t border-blue-200">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-slate-700">综合评分</span>
                        <span className="text-2xl font-bold text-blue-600">92</span>
                    </div>
                    <div className="mt-2 text-xs text-slate-600">
                        推荐: <span className="font-semibold text-green-600">保持</span>
                    </div>
                </div>
            </div>

            {/* 🆕 新增: 执行统计 */}
            <div className="mt-4 grid grid-cols-2 gap-2">
                <StatMini label="执行次数" value={testCase.executionCount || 0} />
                <StatMini label="平均耗时" value={`${testCase.avgDuration || 0}ms`} />
                <StatMini label="最后执行" value={formatRelativeTime(testCase.lastRunAt)} />
                <StatMini label="成功率" value={`${testCase.successRate || 0}%`} />
            </div>
        </div>
    );
};
```

#### 💡 增强效果

- ✅ 保持现有三栏布局不变
- ✅ 左栏添加快速过滤和标签云
- ✅ 中栏添加高级搜索和过滤面板
- ✅ 右栏添加价值评估和统计信息
- ✅ 所有增强都是渐进式,不破坏现有功能

### 4.2 Dashboard 增强

#### 当前功能
- ✅ 统计卡片 (4个: Passed, Failed, Blocked, Skipped)
- ✅ AI洞察
- ✅ 饼图和柱状图
- ✅ 报告导出 (ReportModal)

#### 🔧 增强点

**1. 添加趋势图表**

```typescript
// components/Dashboard.tsx 扩展
export const Dashboard = ({ runs }) => {
    // 现有代码...

    // 🆕 新增: 计算趋势数据
    const trendData = useMemo(() => {
        // 按日期分组统计最近7天的数据
        const last7Days = getLast7Days();
        return last7Days.map(date => {
            const dayRuns = runs.filter(r => isSameDay(r.timestamp, date));
            return {
                date: formatDate(date),
                passed: dayRuns.filter(r => r.status === 'PASSED').length,
                failed: dayRuns.filter(r => r.status === 'FAILED').length,
                total: dayRuns.length,
                successRate: calculateSuccessRate(dayRuns)
            };
        });
    }, [runs]);

    return (
        <div className="space-y-6 animate-fade-in pb-10">
            {/* 现有: Header, StatCards, AI Insight */}

            {/* 🆕 新增: 趋势图表 */}
            <div className="grid grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="text-sm font-bold text-slate-700 mb-4">成功率趋势 (最近7天)</h3>
                    <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={trendData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                            <YAxis stroke="#64748b" fontSize={12} />
                            <Tooltip />
                            <Line
                                type="monotone"
                                dataKey="successRate"
                                stroke="#10b981"
                                strokeWidth={2}
                                dot={{ fill: '#10b981', r: 4 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="text-sm font-bold text-slate-700 mb-4">执行次数趋势 (最近7天)</h3>
                    <ResponsiveContainer width="100%" height={200}>
                        <AreaChart data={trendData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                            <YAxis stroke="#64748b" fontSize={12} />
                            <Tooltip />
                            <Area
                                type="monotone"
                                dataKey="total"
                                stroke="#3b82f6"
                                fill="#3b82f6"
                                fillOpacity={0.3}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* 🆕 新增: Top失败用例 */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h3 className="text-sm font-bold text-slate-700 mb-4">Top 10 失败用例</h3>
                <TopFailuresTable runs={runs} />
            </div>

            {/* 现有: Charts, ReportModal */}
        </div>
    );
};
```

**2. 增强ReportModal - 支持订阅和多格式导出**

```typescript
// components/dashboard/ReportModal.tsx 扩展
const ReportModal = ({ runs, stats, passRate, aiInsight, onClose }) => {
    const [exportFormat, setExportFormat] = useState<'html' | 'pdf' | 'json'>('html');
    const [showSubscription, setShowSubscription] = useState(false);

    return (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b flex items-center justify-between">
                    <h2 className="text-xl font-bold text-slate-800">测试报告</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                    {/* 现有报告内容 */}
                </div>

                {/* 🆕 Footer with Export Options */}
                <div className="px-6 py-4 border-t bg-slate-50 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <span className="text-sm text-slate-600">导出格式:</span>
                        <select
                            value={exportFormat}
                            onChange={(e) => setExportFormat(e.target.value as any)}
                            className="px-3 py-1.5 border rounded text-sm"
                        >
                            <option value="html">HTML</option>
                            <option value="pdf">PDF</option>
                            <option value="json">JSON</option>
                        </select>
                    </div>
                    <div className="flex space-x-2">
                        <button
                            onClick={() => setShowSubscription(true)}
                            className="px-4 py-2 border border-slate-300 rounded-lg text-sm hover:bg-slate-100"
                        >
                            <Bell size={16} className="inline mr-2" />
                            订阅报告
                        </button>
                        <button
                            onClick={() => handleExport(exportFormat)}
                            className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700"
                        >
                            <Download size={16} className="inline mr-2" />
                            导出
                        </button>
                    </div>
                </div>
            </div>

            {/* 🆕 Subscription Modal */}
            {showSubscription && (
                <ReportSubscriptionModal onClose={() => setShowSubscription(false)} />
            )}
        </div>
    );
};
```

### 4.3 ScriptLab 增强

ScriptLab已经很完善,只需**微调**:

#### 🔧 增强点

**1. 添加测试集合支持**

```typescript
// components/ScriptLab.tsx 扩展
const ScriptLab = ({ scripts, workflows, cases, ... }) => {
    const [mode, setMode] = useState<'scripts' | 'workflows' | 'suites'>('workflows'); // 🆕 新增 suites

    return (
        <div className="flex flex-col h-[calc(100vh-140px)]">
            <LabHeader
                mode={mode}
                setMode={setMode}
                // 🆕 新增 Suites 按钮
                modes={[
                    { value: 'scripts', label: 'Actions', icon: Code },
                    { value: 'workflows', label: 'Workflows', icon: GitMerge },
                    { value: 'suites', label: 'Test Suites', icon: FolderKanban } // 🆕
                ]}
                {...otherProps}
            />

            <div className="flex-1 flex overflow-hidden">
                {/* 左栏列表 */}
                <ScriptList mode={mode} {...listProps} />

                {/* 中间画布 */}
                <div className="flex-1">
                    {mode === 'workflows' && <WorkflowCanvas />}
                    {mode === 'scripts' && <ActionEditor />}
                    {mode === 'suites' && <TestSuiteEditor />} {/* 🆕 */}
                </div>
            </div>
        </div>
    );
};
```

---

## 5. 新增组件设计

### 5.1 ResourceLibrary (新增页面)

**路由**: `/resources`

**设计**: 复用TestCaseManager的三栏布局模式

```typescript
// components/ResourceLibrary.tsx (新增)
export const ResourceLibrary = () => {
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [selectedTemplate, setSelectedTemplate] = useState<ResourceTemplate | null>(null);

    return (
        <div className="flex h-[calc(100vh-140px)] bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">

            {/* 左栏: 分类树 */}
            <div className="w-64 border-r bg-slate-50 p-4 overflow-y-auto">
                <h3 className="text-xs font-bold text-slate-600 mb-3">资源分类</h3>
                <CategoryTree
                    categories={[
                        { id: 'all', label: '全部', icon: '📦', count: 51 },
                        { id: 'user', label: '用户', icon: '👤', count: 15 },
                        { id: 'data', label: '数据', icon: '📊', count: 23 },
                        { id: 'config', label: '配置', icon: '⚙️', count: 8 },
                        { id: 'file', label: '文件', icon: '📄', count: 5 }
                    ]}
                    selectedId={selectedCategory}
                    onSelect={setSelectedCategory}
                />

                <div className="mt-4 border-t pt-4">
                    <h3 className="text-xs font-bold text-slate-600 mb-2">作用域</h3>
                    <ScopeFilter
                        options={['system', 'platform', 'tenant']}
                        selected={[]}
                        onChange={() => {}}
                    />
                </div>
            </div>

            {/* 中栏: 资源模板列表 */}
            <div className="flex-1 flex flex-col border-r">
                <div className="p-4 border-b bg-white flex items-center justify-between">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            placeholder="搜索资源模板..."
                            className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm"
                        />
                    </div>
                    <button className="ml-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700">
                        <Plus size={16} className="inline mr-1" />
                        新建模板
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 gap-3 auto-rows-min">
                    {/* 资源模板卡片 */}
                    <ResourceTemplateCard template={mockTemplate} />
                </div>
            </div>

            {/* 右栏: 模板详情 */}
            <div className="w-96 bg-white p-6 overflow-y-auto">
                {selectedTemplate ? (
                    <ResourceTemplateDetail template={selectedTemplate} />
                ) : (
                    <EmptyState message="选择资源模板查看详情" />
                )}
            </div>
        </div>
    );
};

// 资源模板卡片
const ResourceTemplateCard = ({ template }) => (
    <div className="p-4 bg-white border border-slate-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer">
        <div className="flex items-start justify-between mb-2">
            <div className="flex items-center space-x-2">
                <span className="text-2xl">{getCategoryIcon(template.category)}</span>
                <div>
                    <h4 className="font-semibold text-slate-800 text-sm">{template.name}</h4>
                    <span className="text-xs text-slate-500">{getScopeLabel(template.scope)}</span>
                </div>
            </div>
        </div>
        <p className="text-xs text-slate-600 line-clamp-2 mb-3">{template.description}</p>
        <div className="flex items-center justify-between">
            <div className="flex space-x-1">
                {template.tags.map(tag => (
                    <span key={tag} className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded">
                        {tag}
                    </span>
                ))}
            </div>
            {template.scope === 'system' ? (
                <button className="text-xs text-primary-600 hover:text-primary-700">复制</button>
            ) : (
                <button className="text-xs text-primary-600 hover:text-primary-700">编辑</button>
            )}
        </div>
    </div>
);
```

### 5.2 CICDIntegration (新增页面)

**路由**: `/integration`

**设计**: 卡片列表 + Modal编辑器

```typescript
// components/CICDIntegration.tsx (新增)
export const CICDIntegration = () => {
    const [integrations, setIntegrations] = useState<Integration[]>([]);
    const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
    const [showEditor, setShowEditor] = useState(false);

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">CI/CD 集成</h2>
                    <p className="text-sm text-slate-500">配置GitLab、GitHub、Jenkins集成</p>
                </div>
                <button
                    onClick={() => setShowEditor(true)}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                    <Plus size={16} className="inline mr-2" />
                    新建集成
                </button>
            </div>

            {/* Platform Tabs */}
            <div className="flex space-x-2 border-b">
                <PlatformTab icon={<GitBranch />} label="GitLab CI" active />
                <PlatformTab icon={<Github />} label="GitHub Actions" />
                <PlatformTab icon={<Workflow />} label="Jenkins" />
            </div>

            {/* Integration Cards */}
            <div className="space-y-4">
                {integrations.map(integration => (
                    <IntegrationCard
                        key={integration.id}
                        integration={integration}
                        onEdit={() => { setSelectedIntegration(integration); setShowEditor(true); }}
                        onToggle={() => {}}
                        onViewHistory={() => {}}
                    />
                ))}
            </div>

            {/* Integration Editor Modal */}
            {showEditor && (
                <IntegrationEditorModal
                    integration={selectedIntegration}
                    onSave={(int) => {}}
                    onClose={() => setShowEditor(false)}
                />
            )}
        </div>
    );
};

// CI/CD集成卡片
const IntegrationCard = ({ integration, onEdit, onToggle, onViewHistory }) => (
    <div className="bg-white border border-slate-200 rounded-lg p-6 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between mb-4">
            <div className="flex items-start space-x-4">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    integration.enabled ? 'bg-green-100' : 'bg-slate-100'
                }`}>
                    {getPlatformIcon(integration.platform)}
                </div>
                <div>
                    <h3 className="font-bold text-slate-800">{integration.name}</h3>
                    <p className="text-sm text-slate-500">{integration.description}</p>
                    <div className="mt-2 flex items-center space-x-4 text-xs text-slate-600">
                        <span>触发器: {integration.trigger}</span>
                        <span>测试集: {integration.testSuite}</span>
                    </div>
                </div>
            </div>
            <div className="flex items-center space-x-2">
                <Switch checked={integration.enabled} onChange={onToggle} />
                <DropdownMenu>
                    <DropdownItem icon={Edit} label="编辑" onClick={onEdit} />
                    <DropdownItem icon={History} label="查看历史" onClick={onViewHistory} />
                    <DropdownItem icon={Trash} label="删除" danger />
                </DropdownMenu>
            </div>
        </div>

        {/* Last Execution Status */}
        <div className="pt-4 border-t">
            <div className="flex items-center justify-between">
                <div className="text-sm text-slate-600">
                    最后执行: {formatTime(integration.lastTriggered)}
                </div>
                <div className={`flex items-center space-x-2 ${
                    integration.lastStatus === 'passed' ? 'text-green-600' : 'text-red-600'
                }`}>
                    {integration.lastStatus === 'passed' ? <CheckCircle size={16} /> : <XCircle size={16} />}
                    <span className="text-sm font-semibold">
                        {integration.lastStatus === 'passed' ? 'Passed' : 'Failed'} ({integration.lastTestCount})
                    </span>
                </div>
            </div>
        </div>
    </div>
);
```

### 5.3 ReportsPage (新增页面)

**路由**: `/reports`

**设计**: Tab切换 (执行报告 | 趋势分析 | 报告订阅)

```typescript
// components/ReportsPage.tsx (新增)
export const ReportsPage = () => {
    const [activeTab, setActiveTab] = useState<'execution' | 'trend' | 'subscription'>('execution');

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">测试报告</h2>
                    <p className="text-sm text-slate-500">查看执行报告、趋势分析和配置订阅</p>
                </div>
                <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                    <Plus size={16} className="inline mr-2" />
                    生成报告
                </button>
            </div>

            {/* Tabs */}
            <div className="flex space-x-2 border-b">
                <Tab
                    label="执行报告"
                    active={activeTab === 'execution'}
                    onClick={() => setActiveTab('execution')}
                />
                <Tab
                    label="趋势分析"
                    active={activeTab === 'trend'}
                    onClick={() => setActiveTab('trend')}
                />
                <Tab
                    label="报告订阅"
                    active={activeTab === 'subscription'}
                    onClick={() => setActiveTab('subscription')}
                />
            </div>

            {/* Tab Content */}
            <div className="mt-6">
                {activeTab === 'execution' && <ExecutionReportsTab />}
                {activeTab === 'trend' && <TrendAnalysisTab />}
                {activeTab === 'subscription' && <ReportSubscriptionTab />}
            </div>
        </div>
    );
};

// 执行报告Tab
const ExecutionReportsTab = () => {
    const reports = useReports();

    return (
        <div className="space-y-4">
            {reports.map(report => (
                <ReportCard key={report.id} report={report} />
            ))}
        </div>
    );
};

// 趋势分析Tab
const TrendAnalysisTab = () => {
    const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('7d');
    const trendData = useTrendData(timeRange);

    return (
        <div className="space-y-6">
            {/* Time Range Selector */}
            <div className="flex items-center space-x-2">
                <span className="text-sm text-slate-600">时间范围:</span>
                <select
                    value={timeRange}
                    onChange={(e) => setTimeRange(e.target.value as any)}
                    className="px-3 py-1.5 border rounded text-sm"
                >
                    <option value="7d">最近7天</option>
                    <option value="30d">最近30天</option>
                    <option value="90d">最近90天</option>
                </select>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-2 gap-6">
                <TrendChart title="成功率趋势" data={trendData.successRate} />
                <TrendChart title="执行次数趋势" data={trendData.executionCount} />
            </div>

            {/* Tables */}
            <div className="grid grid-cols-2 gap-6">
                <TopFailuresTable data={trendData.topFailures} />
                <FlakyTestsTable data={trendData.flakyTests} />
            </div>
        </div>
    );
};
```

### 5.4 TestSuiteEditor (Modal组件)

**设计**: 在TestCaseManager中通过Modal弹窗提供测试集合编辑

```typescript
// components/testcase/TestSuiteEditor.tsx (新增)
export const TestSuiteEditor = ({ suite, onSave, onClose }) => {
    const [type, setType] = useState<'static' | 'dynamic'>(suite?.type || 'static');
    const [selectedCases, setSelectedCases] = useState<string[]>(suite?.testCaseIds || []);
    const [criteria, setCriteria] = useState(suite?.selectionCriteria || {});

    return (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b flex items-center justify-between">
                    <h2 className="text-xl font-bold text-slate-800">
                        {suite ? '编辑测试集' : '新建测试集'}
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)] space-y-6">
                    {/* Basic Info */}
                    <div className="space-y-4">
                        <FormField label="集合名称" required>
                            <input type="text" placeholder="例: 冒烟测试集" className="w-full" />
                        </FormField>
                        <FormField label="描述">
                            <textarea rows={3} placeholder="描述测试集的用途..." className="w-full" />
                        </FormField>
                    </div>

                    {/* Type Selection */}
                    <div>
                        <label className="text-sm font-semibold text-slate-700 mb-2 block">集合类型</label>
                        <div className="grid grid-cols-2 gap-4">
                            <TypeCard
                                title="静态集合"
                                description="手动选择测试用例"
                                icon={<FolderKanban />}
                                selected={type === 'static'}
                                onClick={() => setType('static')}
                            />
                            <TypeCard
                                title="动态集合"
                                description="基于规则自动筛选"
                                icon={<Filter />}
                                selected={type === 'dynamic'}
                                onClick={() => setType('dynamic')}
                            />
                        </div>
                    </div>

                    {/* Static: Case Selection */}
                    {type === 'static' && (
                        <div>
                            <label className="text-sm font-semibold text-slate-700 mb-2 block">
                                选择测试用例 ({selectedCases.length} 个已选)
                            </label>
                            <div className="border rounded-lg p-4 max-h-64 overflow-y-auto">
                                <CaseSelector
                                    selectedCases={selectedCases}
                                    onToggle={(caseId) => {
                                        setSelectedCases(prev =>
                                            prev.includes(caseId)
                                                ? prev.filter(id => id !== caseId)
                                                : [...prev, caseId]
                                        );
                                    }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Dynamic: Criteria Builder */}
                    {type === 'dynamic' && (
                        <div>
                            <label className="text-sm font-semibold text-slate-700 mb-2 block">
                                筛选条件
                            </label>
                            <CriteriaBuilder criteria={criteria} onChange={setCriteria} />
                        </div>
                    )}

                    {/* Execution Config */}
                    <div className="border-t pt-6">
                        <h3 className="text-sm font-semibold text-slate-700 mb-3">执行配置</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <FormField label="并发数">
                                <input type="number" defaultValue={5} className="w-full" />
                            </FormField>
                            <FormField label="超时时间 (秒)">
                                <input type="number" defaultValue={300} className="w-full" />
                            </FormField>
                        </div>
                        <div className="mt-3">
                            <label className="flex items-center space-x-2">
                                <input type="checkbox" />
                                <span className="text-sm text-slate-700">首次失败时停止</span>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t bg-slate-50 flex justify-end space-x-2">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-100"
                    >
                        取消
                    </button>
                    <button
                        onClick={() => onSave({ type, selectedCases, criteria })}
                        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                    >
                        保存
                    </button>
                </div>
            </div>
        </div>
    );
};

// 条件构建器
const CriteriaBuilder = ({ criteria, onChange }) => (
    <div className="space-y-3 p-4 bg-slate-50 rounded-lg">
        <CriterionRow label="标签包含">
            <TagInput tags={criteria.includeTags || []} onChange={(tags) => {}} />
        </CriterionRow>
        <CriterionRow label="标签排除">
            <TagInput tags={criteria.excludeTags || []} onChange={(tags) => {}} />
        </CriterionRow>
        <CriterionRow label="优先级">
            <CheckboxGroup options={['P0', 'P1', 'P2']} selected={criteria.priorities || []} />
        </CriterionRow>
        <CriterionRow label="成功率">
            <RangeInput min={0} max={100} value={criteria.successRateMin || 0} onChange={() => {}} />
        </CriterionRow>
        <CriterionRow label="状态">
            <CheckboxGroup options={['active', 'deprecated']} selected={criteria.statuses || ['active']} />
        </CriterionRow>
    </div>
);
```

---

## 6. 实施路线图

### Phase 1: TestCaseManager增强 (1周)

**优先级**: 🔴 最高

#### 任务清单

- [ ] **左栏增强** (2天)
  - [ ] FolderTree.tsx - 添加快速过滤器组件
  - [ ] FolderTree.tsx - 添加标签云组件
  - [ ] 创建 QuickFilter.tsx 组件
  - [ ] 创建 TagChip.tsx 组件

- [ ] **中栏增强** (2天)
  - [ ] CaseList.tsx - 添加高级搜索框
  - [ ] CaseList.tsx - 添加折叠式过滤面板
  - [ ] 创建 FilterChip.tsx 组件
  - [ ] 创建 AdvancedFilterPanel.tsx 组件

- [ ] **右栏增强** (2天)
  - [ ] CaseDetail.tsx - 添加价值评分卡片
  - [ ] CaseDetail.tsx - 添加执行统计
  - [ ] 创建 ValueScore.tsx 组件
  - [ ] 创建 StatMini.tsx 组件

- [ ] **后端API** (1天)
  - [ ] GET /api/v2/tests/search - 高级搜索
  - [ ] GET /api/v2/tests/stats - 统计信息

#### 验收标准

- ✅ 快速过滤器可以筛选用例
- ✅ 标签云可以点击过滤
- ✅ 高级搜索支持多条件组合
- ✅ 价值评分正确显示
- ✅ 所有增强不影响现有功能

### Phase 2: Dashboard增强 + ResourceLibrary (2周)

**优先级**: 🔴 高

#### 任务清单

- [ ] **Dashboard增强** (3天)
  - [ ] Dashboard.tsx - 添加趋势图表 (LineChart, AreaChart)
  - [ ] Dashboard.tsx - 添加Top失败用例表格
  - [ ] ReportModal.tsx - 添加导出格式选择
  - [ ] ReportModal.tsx - 添加订阅按钮
  - [ ] 创建 TopFailuresTable.tsx
  - [ ] 创建 ReportSubscriptionModal.tsx

- [ ] **ResourceLibrary页面** (5天)
  - [ ] 创建 ResourceLibrary.tsx (三栏布局)
  - [ ] 创建 CategoryTree.tsx
  - [ ] 创建 ResourceTemplateCard.tsx
  - [ ] 创建 ResourceTemplateDetail.tsx
  - [ ] 创建 ResourceTemplateEditor.tsx (Modal)
  - [ ] 创建 ScopeFilter.tsx

- [ ] **导航更新** (1天)
  - [ ] App.tsx - 添加 resources 路由
  - [ ] Sidebar.tsx - 添加 Resources 菜单项

- [ ] **后端API** (3天)
  - [ ] GET/POST /api/v2/resource-templates
  - [ ] GET/PUT/DELETE /api/v2/resource-templates/:id
  - [ ] POST /api/v2/resource-instances/allocate
  - [ ] POST /api/v2/resource-instances/release

#### 验收标准

- ✅ Dashboard显示7天趋势图
- ✅ Top失败用例表格可排序
- ✅ ResourceLibrary三栏布局正常
- ✅ 可以创建和编辑资源模板
- ✅ 资源分类和作用域过滤工作正常

### Phase 3: TestSuite + Reports (2周)

**优先级**: 🟡 中高

#### 任务清单

- [ ] **TestSuiteEditor** (4天)
  - [ ] 创建 TestSuiteEditor.tsx (Modal)
  - [ ] 创建 CriteriaBuilder.tsx
  - [ ] 创建 CaseSelector.tsx
  - [ ] TestCaseManager.tsx - 添加"测试集"Tab
  - [ ] TestCaseManager.tsx - 集成TestSuiteEditor

- [ ] **ReportsPage** (5天)
  - [ ] 创建 ReportsPage.tsx (Tab布局)
  - [ ] 创建 ExecutionReportsTab.tsx
  - [ ] 创建 TrendAnalysisTab.tsx
  - [ ] 创建 ReportSubscriptionTab.tsx
  - [ ] 创建 ReportCard.tsx
  - [ ] 创建 TrendChart.tsx

- [ ] **导航更新** (1天)
  - [ ] App.tsx - 添加 reports 路由
  - [ ] Sidebar.tsx - 添加 Reports 菜单项

- [ ] **后端API** (4天)
  - [ ] GET/POST /api/v2/test-suites
  - [ ] GET/PUT/DELETE /api/v2/test-suites/:id
  - [ ] POST /api/v2/test-suites/:id/execute
  - [ ] GET /api/v2/reports
  - [ ] GET /api/v2/reports/:id
  - [ ] POST /api/v2/reports/generate

#### 验收标准

- ✅ 可以创建静态和动态测试集
- ✅ 测试集可以执行
- ✅ 趋势分析图表正确显示
- ✅ 可以配置报告订阅
- ✅ 支持HTML/PDF/JSON导出

### Phase 4: CI/CD Integration (1-2周)

**优先级**: 🟡 中

#### 任务清单

- [ ] **CICDIntegration页面** (6天)
  - [ ] 创建 CICDIntegration.tsx
  - [ ] 创建 IntegrationCard.tsx
  - [ ] 创建 IntegrationEditorModal.tsx
  - [ ] 创建 PlatformConfigForm.tsx (GitLab/GitHub/Jenkins)
  - [ ] 创建 IntegrationHistoryModal.tsx
  - [ ] 创建 WebhookConfigPanel.tsx

- [ ] **导航更新** (1天)
  - [ ] App.tsx - 添加 integration 路由
  - [ ] Sidebar.tsx - 添加 Integration 菜单项

- [ ] **后端API** (4天)
  - [ ] GET/POST /api/v2/integrations
  - [ ] GET/PUT/DELETE /api/v2/integrations/:id
  - [ ] POST /api/v2/integrations/:id/toggle
  - [ ] GET /api/v2/integrations/:id/history
  - [ ] POST /api/v2/ci/webhook

#### 验收标准

- ✅ 可以配置GitLab CI集成
- ✅ 可以配置GitHub Actions集成
- ✅ 可以查看集成执行历史
- ✅ Webhook可以触发测试执行
- ✅ 自动生成配置代码片段

### Phase 5: E2E & Mobile Testing (2-3周)

**优先级**: 🟢 低

#### 任务清单

- [ ] **TestCase类型扩展** (3天)
  - [ ] TestCaseEditor.tsx - 添加 E2E 类型
  - [ ] TestCaseEditor.tsx - 添加 Mobile 类型
  - [ ] 创建 E2EConfigPanel.tsx
  - [ ] 创建 MobileConfigPanel.tsx

- [ ] **E2E测试配置** (4天)
  - [ ] 创建 BrowserConfigForm.tsx
  - [ ] 创建 ActionSequenceEditor.tsx
  - [ ] 创建 E2EActionCard.tsx
  - [ ] 集成到TestCaseEditor

- [ ] **移动端测试配置** (4天)
  - [ ] 创建 DeviceConfigForm.tsx
  - [ ] 创建 MobileActionSequenceEditor.tsx
  - [ ] 创建 MobileActionCard.tsx
  - [ ] 集成到TestCaseEditor

- [ ] **后端集成** (5天)
  - [ ] Playwright executor 集成
  - [ ] Appium executor 集成
  - [ ] 截图和视频存储
  - [ ] 执行结果展示

#### 验收标准

- ✅ 可以创建E2E测试用例
- ✅ 可以配置浏览器和视口
- ✅ E2E测试可以执行并生成截图
- ✅ 可以创建移动端测试用例
- ✅ 移动端测试可以执行

---

## 附录

### A. 新增依赖包

```json
{
  "dependencies": {
    // 已有: react, typescript, vite, recharts, lucide-react

    // 🆕 新增 (如果需要)
    "react-tag-input": "^6.10.3",           // 标签输入
    "react-range": "^1.8.14",               // 范围滑块
    "classnames": "^2.5.1",                 // className工具
    "date-fns": "^3.0.0",                   // 日期处理
    "react-markdown": "^9.0.0"              // Markdown渲染 (报告)
  }
}
```

### B. 组件命名规范

遵循现有规范:
- **Pages**: `XxxManager.tsx` (例: TestCaseManager)
- **Cards**: `XxxCard.tsx` (例: StatCard)
- **Modal**: `XxxModal.tsx` 或 `XxxEditor.tsx`
- **Tab Content**: `XxxTab.tsx` (例: OrgTab)
- **Panels**: `XxxPanel.tsx` (例: CopilotPanel)

### C. 样式规范

遵循现有Tailwind CSS风格:
- 使用 `rounded-xl` 用于卡片
- 使用 `shadow-sm` 或 `shadow-md` 用于阴影
- 使用 `border border-slate-200` 用于边框
- 使用 `bg-slate-50` 用于次要背景
- 使用 `text-slate-600` 用于次要文本
- 使用 `primary-600` 用于主色调按钮

### D. 关键差异对比

| 方面 | 之前方案 (v1.0) | 现在方案 (v2.0) |
|------|----------------|----------------|
| **TestCaseManager** | 完全重写 | 渐进式增强 |
| **WorkflowEditor** | 全新双模式编辑器 | 扩展现有ScriptLab |
| **ActionLibrary** | 重新设计 | 保持现有,微调 |
| **Dashboard** | 大幅重构 | 添加趋势图表 |
| **导航** | 12个顶级项 | 9+3=12个 (最小化新增) |
| **ResourceLibrary** | 独立设计 | 复用TestCaseManager布局模式 |
| **TestSuite** | 独立页面 | Modal弹窗方式 |

---

**文档结束**
