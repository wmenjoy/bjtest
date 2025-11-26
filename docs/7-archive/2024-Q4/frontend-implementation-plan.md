# 前端实施计划 - 改造 vs 重写决策与任务拆解

> **文档版本**: v1.0.0
> **创建日期**: 2025-11-24
> **策略**: 如无法改造则重写，但复用UI和交互风格

## 目录

- [1. 改造 vs 重写决策矩阵](#1-改造-vs-重写决策矩阵)
- [2. 组件分析结果](#2-组件分析结果)
- [3. 重写组件设计规范](#3-重写组件设计规范)
- [4. Phase 1 详细任务拆解](#4-phase-1-详细任务拆解)
- [5. Sub Agent 开发任务分配](#5-sub-agent-开发任务分配)
- [6. 验收标准](#6-验收标准)

---

## 1. 改造 vs 重写决策矩阵

### 1.1 决策标准

| 评估维度 | 改造 (Enhancement) | 重写 (Rewrite) |
|---------|-------------------|----------------|
| **代码质量** | 结构清晰, TypeScript完善 | 代码混乱, 缺少类型 |
| **架构耦合度** | 模块化, 低耦合 | 高耦合, 难以扩展 |
| **功能缺口** | < 30% 新功能 | > 50% 新功能 |
| **修改风险** | 改动局部, 风险可控 | 改动全局, 风险高 |
| **开发成本** | < 2天 | > 3天 |

### 1.2 UI和交互风格规范 (必须复用)

**颜色系统** (基于 Tailwind CSS):
```typescript
// 主色系
primary: 'bg-blue-600'           // 主按钮
primaryHover: 'hover:bg-blue-700'

// 状态色
success: 'bg-green-600'
warning: 'bg-amber-600'
error: 'bg-red-600'
info: 'bg-slate-600'

// 中性色
slate50: 'bg-slate-50'           // 次要背景
slate100: 'bg-slate-100'         // 分组背景
slate200: 'border-slate-200'     // 边框
slate400: 'text-slate-400'       // 次要文本
slate600: 'text-slate-600'       // 正文
slate800: 'text-slate-800'       // 标题
```

**组件样式** (复用现有模式):
```typescript
// 卡片样式
const cardClass = "bg-white rounded-xl shadow-sm border border-slate-200 p-4";

// 按钮样式 (主按钮)
const btnPrimary = "px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium";

// 按钮样式 (次要按钮)
const btnSecondary = "px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 text-sm";

// 输入框样式
const inputClass = "px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500";

// 三栏布局容器
const threeColumnLayout = "flex h-[calc(100vh-140px)] bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden";
```

**交互模式** (必须保持一致):
1. **Modal弹窗**: 使用固定的 Modal 样式和动画
2. **侧边栏**: 右侧滑入式 (w-80 或 w-96)
3. **Tab切换**: 下划线高亮样式
4. **悬停效果**: `hover:bg-slate-100` 或 `hover:shadow-md`
5. **过渡动画**: `transition-colors` 或 `transition-all`

---

## 2. 组件分析结果

### 2.1 ScriptLab (Workflow Editor)

**现状分析**:
- **代码质量**: ✅ 优秀 (246行, TypeScript完善)
- **架构**: ✅ 良好 (模块化, hooks分离)
- **功能覆盖**:
  - ✅ 双模式切换 ('scripts' | 'workflows')
  - ✅ 可视化编辑 (WorkflowCanvas, 支持 Condition/Loop 节点)
  - ✅ 代码视图 (YamlEditor)
  - ✅ 节点配置 (NodeInspector)
  - ❌ 缺少: Branch/Merge 节点, 测试集合模式, 数据流映射面板

**决策**: ✅ **改造**

**改造方案**:
1. 扩展 `mode` 类型: `'scripts' | 'workflows' | 'suites'`
2. 扩展 `NodeType`: 添加 `BRANCH`, `MERGE`
3. 扩展 `WorkflowCanvas`: 支持新节点类型渲染
4. 增强 `NodeInspector`: 添加数据流映射模式 (可选)

**改造成本**: ~2天

### 2.2 ActionLibrary

**现状分析**:
- **代码质量**: ✅ 优秀 (431行, TypeScript完善)
- **架构**: ✅ 良好 (Tab分离, Modal编辑)
- **功能覆盖**:
  - ✅ 三Tab设计 (builtin | custom | templates)
  - ✅ 脚本管理和编辑
  - ❌ 缺少: 通用 Action Template 支持 (HTTP/Database/Command)
  - ❌ 缺少: 类别分组 (Network/Database/Messaging)
  - ❌ 缺少: 作用域过滤 (System/Platform/Tenant)

**决策**: ⚠️ **部分重写**

**重写原因**:
- 现有架构主要针对脚本 (Script), 需要支持通用 Action Template
- 需要重新设计数据结构和 UI 布局
- 现有 `BUILT_IN_ACTIONS` 列表需要扩展为完整的 Action 类型系统

**重写范围**:
1. 数据结构: 新增 `ActionTemplate` 类型 (扩展 Script)
2. UI 布局: 保持三Tab, 增加类别和作用域过滤器
3. 编辑器: 复用 ActionEditor, 扩展配置选项

**重写成本**: ~3天

### 2.3 TestCaseManager

**现状分析**:
- **代码质量**: ✅ 优秀 (202行)
- **架构**: ✅ 完美 (三栏布局标准实现)
- **功能覆盖**:
  - ✅ 三栏布局 (FolderTree | CaseList | CaseDetail)
  - ✅ 基础搜索和过滤
  - ❌ 缺少: 快速过滤器, 高级搜索, 价值评分, 统计信息

**决策**: ✅ **改造**

**改造方案**:
1. 左栏: 在 FolderTree 下方添加 QuickFilter 和 TagChip 组件
2. 中栏: 在搜索栏下方添加 AdvancedFilterPanel 组件
3. 右栏: 在 CaseDetail 下方添加 ValueScore 和 StatMini 组件

**改造成本**: ~1天

### 2.4 Dashboard

**现状分析**:
- **代码质量**: ✅ 优秀 (108行)
- **架构**: ✅ 良好 (卡片 + 图表)
- **功能覆盖**:
  - ✅ StatCards, Charts, AI Insight, ReportModal
  - ❌ 缺少: 趋势图表, Top失败用例表格

**决策**: ✅ **改造**

**改造方案**:
1. 添加 TrendChart 组件 (LineChart, AreaChart)
2. 添加 TopFailuresTable 组件
3. 增强 ReportModal (导出格式选择, 订阅按钮)

**改造成本**: ~1天

### 2.5 新增组件 (需要完全重写)

以下组件不存在, 需要从头开发, 但**必须复用现有UI风格**:

1. **ResourceLibrary** (资源管理)
   - 参考: TestCaseManager 三栏布局
   - 复用: 卡片样式, 搜索框, Tab切换
   - 成本: ~2天

2. **ReportsPage** (报告中心)
   - 参考: Dashboard + TestCaseManager
   - 复用: 图表组件, 卡片列表
   - 成本: ~2天

3. **CICDIntegration** (CI/CD集成)
   - 参考: AdminPortal Tab设计
   - 复用: Tab布局, 表单组件
   - 成本: ~2天

4. **E2ETestManager** (E2E测试)
   - 参考: TestCaseManager 列表设计
   - 复用: 卡片列表, Modal编辑
   - 成本: ~1天

5. **MobileTestManager** (移动端测试)
   - 参考: E2ETestManager
   - 复用: 完全相同的布局模式
   - 成本: ~1天

---

## 3. 重写组件设计规范

### 3.1 组件模板 (必须遵循)

```typescript
// 组件结构标准模板
import React, { useState } from 'react';
import { Search, Plus } from 'lucide-react';

interface MyComponentProps {
    // Props definition
}

export const MyComponent: React.FC<MyComponentProps> = ({ /* props */ }) => {
    // State management
    const [state, setState] = useState(initialValue);

    // Event handlers
    const handleAction = () => {
        // Action logic
    };

    return (
        <div className="flex flex-col h-[calc(100vh-140px)] bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-slate-200 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Title</h1>
                    <p className="text-sm text-slate-500">Subtitle</p>
                </div>
                <div className="flex space-x-2">
                    {/* Action buttons */}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
                {/* Main content */}
            </div>
        </div>
    );
};
```

### 3.2 必须复用的组件库

从现有代码库中复用以下组件 (不要重新实现):

1. **Modal 组件**: 使用统一的 Modal wrapper
2. **Button 组件**: 使用 `btnPrimary`, `btnSecondary` 类
3. **Input 组件**: 使用统一的 `inputClass`
4. **Card 组件**: 使用 `cardClass`
5. **Tab 组件**: 参考 ActionLibrary 的 Tab 实现
6. **Table 组件**: 参考 ActionLibrary 的 Table 实现

### 3.3 文件组织规范

```
components/
├── resources/                 # 新增: 资源管理模块
│   ├── ResourceLibrary.tsx   # 主页面 (复用三栏布局)
│   ├── ResourceTemplateCard.tsx
│   ├── ResourceTemplateDetail.tsx
│   ├── CategoryTree.tsx      # 复用 FolderTree 样式
│   └── ScopeFilter.tsx
│
├── reports/                   # 新增: 报告中心模块
│   ├── ReportsPage.tsx       # 主页面 (Tab布局)
│   ├── ExecutionReportsTab.tsx
│   ├── TrendAnalysisTab.tsx
│   ├── ReportCard.tsx        # 复用 Card 样式
│   └── TrendChart.tsx        # 复用 recharts
│
├── integration/               # 新增: CI/CD集成模块
│   ├── CICDIntegration.tsx   # 主页面
│   ├── IntegrationCard.tsx
│   ├── IntegrationEditorModal.tsx
│   └── PlatformConfigForm.tsx
│
└── testing/                   # 新增: 专项测试模块
    ├── E2ETestManager.tsx
    ├── E2ETestCard.tsx
    ├── MobileTestManager.tsx
    └── MobileTestCard.tsx
```

---

## 4. Phase 1 详细任务拆解

### 4.1 任务优先级

**Week 1: 核心增强** (改造现有组件)
1. TestCaseManager 增强 (1天)
2. Dashboard 增强 (1天)
3. ScriptLab 扩展 (2天)

**Week 2: 新增核心页面** (重写)
1. ResourceLibrary (2天)
2. ReportsPage (2天)

**Week 3: CI/CD 和专项测试** (重写)
1. CICDIntegration (2天)
2. E2ETestManager + MobileTestManager (2天)

### 4.2 Task 1: TestCaseManager 增强

**文件**: `components/TestCaseManager.tsx`

**Sub-Task 1.1**: 左栏快速过滤器 (2小时)
```typescript
// 新增组件: components/testcase/QuickFilter.tsx
interface QuickFilterProps {
    icon: string;
    label: string;
    count: number;
    badge?: 'warning' | 'info';
    onClick?: () => void;
}

export const QuickFilter: React.FC<QuickFilterProps> = ({
    icon, label, count, badge, onClick
}) => (
    <button
        onClick={onClick}
        className="w-full flex items-center justify-between px-2 py-1.5 rounded hover:bg-slate-100 text-sm group transition-colors"
    >
        <span className="flex items-center space-x-2">
            <span className="text-base">{icon}</span>
            <span className="text-slate-700">{label}</span>
        </span>
        <span className={`text-xs px-1.5 py-0.5 rounded ${
            badge === 'warning'
                ? 'bg-amber-100 text-amber-700'
                : 'bg-slate-200 text-slate-600'
        }`}>
            {count}
        </span>
    </button>
);

// 新增组件: components/testcase/TagChip.tsx
interface TagChipProps {
    label: string;
    count: number;
    onClick?: () => void;
}

export const TagChip: React.FC<TagChipProps> = ({ label, count, onClick }) => (
    <button
        onClick={onClick}
        className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-full hover:bg-blue-100 transition-colors"
    >
        #{label} ({count})
    </button>
);
```

**集成到 TestCaseManager**:
```typescript
// components/TestCaseManager.tsx - 左栏部分
<div className="w-64 border-r bg-slate-50 p-4 overflow-y-auto">
    {/* 现有 FolderTree */}
    <FolderTree {...props} />

    {/* 🆕 快速过滤器 */}
    <div className="mb-4 border-t pt-4">
        <h3 className="text-xs font-bold text-slate-600 mb-2">快速过滤</h3>
        <div className="space-y-1">
            <QuickFilter icon="👤" label="我的测试" count={12} onClick={() => handleFilter('owner', 'me')} />
            <QuickFilter icon="🔥" label="P0用例" count={45} onClick={() => handleFilter('priority', 'P0')} />
            <QuickFilter icon="⚠️" label="不稳定" count={3} badge="warning" onClick={() => handleFilter('flaky', true)} />
            <QuickFilter icon="⏱️" label="长时间运行" count={8} onClick={() => handleFilter('duration', 'long')} />
            <QuickFilter icon="💤" label="30天未执行" count={15} onClick={() => handleFilter('lastRun', '30d')} />
        </div>
    </div>

    {/* 🆕 标签云 */}
    <div className="border-t pt-4">
        <h3 className="text-xs font-bold text-slate-600 mb-2">标签云</h3>
        <div className="flex flex-wrap gap-1">
            <TagChip label="smoke" count={23} onClick={() => handleTagFilter('smoke')} />
            <TagChip label="regression" count={156} onClick={() => handleTagFilter('regression')} />
            <TagChip label="api" count={89} onClick={() => handleTagFilter('api')} />
            <TagChip label="e2e" count={34} onClick={() => handleTagFilter('e2e')} />
        </div>
    </div>
</div>
```

**Sub-Task 1.2**: 中栏高级搜索面板 (3小时)
```typescript
// 新增组件: components/testcase/AdvancedFilterPanel.tsx
interface AdvancedFilterPanelProps {
    onFilterChange: (filters: any) => void;
    onClose: () => void;
}

export const AdvancedFilterPanel: React.FC<AdvancedFilterPanelProps> = ({
    onFilterChange, onClose
}) => {
    const [filters, setFilters] = useState({
        priorities: [] as string[],
        statuses: [] as string[],
        tags: [] as string[],
        successRateMin: 0,
        successRateMax: 100
    });

    return (
        <div className="p-4 bg-slate-50 rounded-lg border space-y-3 animate-slide-down">
            {/* 优先级 */}
            <div>
                <label className="text-xs font-semibold text-slate-700 mb-2 block">优先级</label>
                <div className="flex space-x-2">
                    {['P0', 'P1', 'P2', 'P3'].map(p => (
                        <label key={p} className="flex items-center space-x-1 text-sm">
                            <input type="checkbox" className="rounded" />
                            <span>{p}</span>
                        </label>
                    ))}
                </div>
            </div>

            {/* 状态 */}
            <div>
                <label className="text-xs font-semibold text-slate-700 mb-2 block">状态</label>
                <div className="flex space-x-2">
                    {['Draft', 'Active', 'Deprecated'].map(s => (
                        <label key={s} className="flex items-center space-x-1 text-sm">
                            <input type="checkbox" className="rounded" />
                            <span>{s}</span>
                        </label>
                    ))}
                </div>
            </div>

            {/* 成功率范围 */}
            <div>
                <label className="text-xs font-semibold text-slate-700 mb-2 block">
                    成功率: {filters.successRateMin}% - {filters.successRateMax}%
                </label>
                <div className="flex items-center space-x-2">
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={filters.successRateMin}
                        onChange={(e) => setFilters({...filters, successRateMin: Number(e.target.value)})}
                        className="flex-1"
                    />
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={filters.successRateMax}
                        onChange={(e) => setFilters({...filters, successRateMax: Number(e.target.value)})}
                        className="flex-1"
                    />
                </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex justify-end space-x-2 pt-2">
                <button
                    onClick={() => setFilters({priorities: [], statuses: [], tags: [], successRateMin: 0, successRateMax: 100})}
                    className="px-3 py-1 text-sm text-slate-600 hover:bg-slate-100 rounded"
                >
                    重置
                </button>
                <button
                    onClick={() => onFilterChange(filters)}
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                    应用
                </button>
            </div>
        </div>
    );
};
```

**Sub-Task 1.3**: 右栏价值评分 (3小时)
```typescript
// 新增组件: components/testcase/ValueScore.tsx
interface ValueScoreProps {
    label: string;
    value: number;
    color: 'green' | 'blue' | 'amber' | 'purple';
}

const colorClasses = {
    green: 'bg-green-100 text-green-700',
    blue: 'bg-blue-100 text-blue-700',
    amber: 'bg-amber-100 text-amber-700',
    purple: 'bg-purple-100 text-purple-700'
};

export const ValueScore: React.FC<ValueScoreProps> = ({ label, value, color }) => (
    <div className="flex items-center justify-between">
        <span className="text-xs text-slate-600">{label}</span>
        <div className="flex items-center space-x-2">
            <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                    className={`h-full ${colorClasses[color]}`}
                    style={{width: `${value}%`}}
                />
            </div>
            <span className="text-xs font-semibold text-slate-700 w-8 text-right">{value}</span>
        </div>
    </div>
);

// 新增组件: components/testcase/StatMini.tsx
interface StatMiniProps {
    label: string;
    value: string | number;
}

export const StatMini: React.FC<StatMiniProps> = ({ label, value }) => (
    <div className="p-2 bg-slate-50 rounded border">
        <div className="text-xs text-slate-500">{label}</div>
        <div className="text-sm font-semibold text-slate-800 mt-1">{value}</div>
    </div>
);
```

### 4.3 Task 2: Dashboard 增强

**文件**: `components/Dashboard.tsx`

**Sub-Task 2.1**: 趋势图表 (3小时)
```typescript
// 新增组件: components/dashboard/TrendChart.tsx
import { LineChart, Line, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface TrendChartProps {
    type: 'line' | 'area';
    title: string;
    data: any[];
    dataKey: string;
    color?: string;
}

export const TrendChart: React.FC<TrendChartProps> = ({
    type, title, data, dataKey, color = '#3b82f6'
}) => {
    const ChartComponent = type === 'line' ? LineChart : AreaChart;

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-sm font-bold text-slate-700 mb-4">{title}</h3>
            <ResponsiveContainer width="100%" height={200}>
                <ChartComponent data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                    <YAxis stroke="#64748b" fontSize={12} />
                    <Tooltip />
                    {type === 'line' ? (
                        <Line
                            type="monotone"
                            dataKey={dataKey}
                            stroke={color}
                            strokeWidth={2}
                            dot={{ fill: color, r: 4 }}
                        />
                    ) : (
                        <Area
                            type="monotone"
                            dataKey={dataKey}
                            stroke={color}
                            fill={color}
                            fillOpacity={0.3}
                        />
                    )}
                </ChartComponent>
            </ResponsiveContainer>
        </div>
    );
};
```

**Sub-Task 2.2**: Top失败用例表格 (2小时)
```typescript
// 新增组件: components/dashboard/TopFailuresTable.tsx
interface TopFailuresTableProps {
    data: Array<{
        testName: string;
        failureCount: number;
        lastFailure: string;
    }>;
}

export const TopFailuresTable: React.FC<TopFailuresTableProps> = ({ data }) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h3 className="text-sm font-bold text-slate-700 mb-4">Top 10 失败用例</h3>
        <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 font-medium border-b">
                <tr>
                    <th className="px-4 py-2 text-left">测试用例</th>
                    <th className="px-4 py-2 text-right">失败次数</th>
                    <th className="px-4 py-2 text-right">最后失败</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
                {data.slice(0, 10).map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                        <td className="px-4 py-2 text-slate-800">{item.testName}</td>
                        <td className="px-4 py-2 text-right text-red-600 font-semibold">{item.failureCount}</td>
                        <td className="px-4 py-2 text-right text-slate-500 text-xs">{item.lastFailure}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);
```

### 4.4 Task 3: ScriptLab 扩展

**文件**: `components/ScriptLab.tsx`

**Sub-Task 3.1**: 添加 'suites' 模式 (2小时)
```typescript
// 修改 ScriptLab.tsx
const [mode, setMode] = useState<'scripts' | 'workflows' | 'suites'>('workflows'); // 🆕 添加 suites

// 修改 LabHeader.tsx
<div className="flex space-x-2">
    <button onClick={() => setMode('scripts')} className={modeButtonClass('scripts')}>Actions</button>
    <button onClick={() => setMode('workflows')} className={modeButtonClass('workflows')}>Workflows</button>
    <button onClick={() => setMode('suites')} className={modeButtonClass('suites')}>Test Suites</button> {/* 🆕 */}
</div>
```

**Sub-Task 3.2**: 扩展 WorkflowCanvas 支持 Branch/Merge 节点 (4小时)
```typescript
// 修改 types.ts
export enum NodeType {
    SCRIPT = 'script',
    HTTP = 'http',
    CONDITION = 'condition',
    LOOP = 'loop',
    BRANCH = 'branch',        // 🆕
    MERGE = 'merge'           // 🆕
}

// 修改 components/scriptlab/constants.ts
export const NODE_SPECS = {
    // ... 现有节点规范
    [NodeType.BRANCH]: {
        title: 'Branch',
        icon: GitBranch,
        color: 'text-purple-600',
        defaultName: 'Branch Node'
    },
    [NodeType.MERGE]: {
        title: 'Merge',
        icon: GitMerge,
        color: 'text-teal-600',
        defaultName: 'Merge Node'
    }
};

// 修改 components/scriptlab/WorkflowCanvas.tsx
// 添加 Branch 节点渲染逻辑
{node.type === NodeType.BRANCH && (
    <div className="flex flex-col items-center">
        <NodeCard node={node} {...props} />
        <div className="flex space-x-8 mt-4">
            {/* 多分支渲染 */}
            {node.branches?.map((branch, idx) => (
                <div key={idx} className="relative flex flex-col items-center">
                    <span className="text-xs font-bold bg-blue-100 px-2 py-1 rounded">
                        Branch {idx + 1}
                    </span>
                    <WorkflowRenderer
                        nodes={branch.children || []}
                        parentId={node.id}
                        branch={`branch-${idx}`}
                        props={props}
                    />
                </div>
            ))}
        </div>
    </div>
)}
```

**Sub-Task 3.3**: 添加 Toolbox 节点选择器 (2小时)
```typescript
// 修改 components/scriptlab/Toolbox.tsx
const NODE_OPTIONS = [
    { type: NodeType.SCRIPT, label: 'Action', icon: Zap },
    { type: NodeType.HTTP, label: 'HTTP Request', icon: Globe },
    { type: NodeType.CONDITION, label: 'Condition', icon: GitBranch },
    { type: NodeType.LOOP, label: 'Loop', icon: Repeat },
    { type: NodeType.BRANCH, label: 'Branch', icon: GitBranch },  // 🆕
    { type: NodeType.MERGE, label: 'Merge', icon: GitMerge }      // 🆕
];
```

---

## 5. Sub Agent 开发任务分配

### 5.1 使用 bmad-dev Agent

**Agent 介绍**: Automated Developer agent for implementing features based on PRD, architecture, and sprint plan

**任务分配策略**:
- 每个 Sub-Task 分配一个独立的 bmad-dev agent
- Agent 必须严格遵循 UI 样式规范
- Agent 完成后需要通过 code review

### 5.2 Task 分配表

| Agent ID | Sub-Task | 估时 | 输入文档 | 输出文件 |
|----------|----------|------|----------|----------|
| dev-001 | TestCaseManager - QuickFilter | 2h | FRONTEND_IMPLEMENTATION_PLAN.md | components/testcase/QuickFilter.tsx<br>components/testcase/TagChip.tsx |
| dev-002 | TestCaseManager - AdvancedFilterPanel | 3h | FRONTEND_IMPLEMENTATION_PLAN.md | components/testcase/AdvancedFilterPanel.tsx |
| dev-003 | TestCaseManager - ValueScore | 3h | FRONTEND_IMPLEMENTATION_PLAN.md | components/testcase/ValueScore.tsx<br>components/testcase/StatMini.tsx |
| dev-004 | TestCaseManager - Integration | 2h | FRONTEND_IMPLEMENTATION_PLAN.md | components/TestCaseManager.tsx (修改) |
| dev-005 | Dashboard - TrendChart | 3h | FRONTEND_IMPLEMENTATION_PLAN.md | components/dashboard/TrendChart.tsx |
| dev-006 | Dashboard - TopFailuresTable | 2h | FRONTEND_IMPLEMENTATION_PLAN.md | components/dashboard/TopFailuresTable.tsx |
| dev-007 | Dashboard - Integration | 2h | FRONTEND_IMPLEMENTATION_PLAN.md | components/Dashboard.tsx (修改) |
| dev-008 | ScriptLab - Suites Mode | 2h | FRONTEND_IMPLEMENTATION_PLAN.md | components/ScriptLab.tsx (修改)<br>components/scriptlab/LabHeader.tsx (修改) |
| dev-009 | ScriptLab - Branch/Merge Nodes | 4h | FRONTEND_IMPLEMENTATION_PLAN.md | types.ts (修改)<br>components/scriptlab/constants.ts (修改)<br>components/scriptlab/WorkflowCanvas.tsx (修改) |
| dev-010 | ScriptLab - Toolbox Extension | 2h | FRONTEND_IMPLEMENTATION_PLAN.md | components/scriptlab/Toolbox.tsx (修改) |

### 5.3 Agent 调用命令

```bash
# Task 1: TestCaseManager 增强
# Sub-Task 1.1: QuickFilter + TagChip
bmad-dev --prd="Task 1.1: 创建 QuickFilter 和 TagChip 组件" \
         --architecture="FRONTEND_IMPLEMENTATION_PLAN.md" \
         --output="components/testcase/QuickFilter.tsx,components/testcase/TagChip.tsx"

# Sub-Task 1.2: AdvancedFilterPanel
bmad-dev --prd="Task 1.2: 创建 AdvancedFilterPanel 组件" \
         --architecture="FRONTEND_IMPLEMENTATION_PLAN.md" \
         --output="components/testcase/AdvancedFilterPanel.tsx"

# Sub-Task 1.3: ValueScore + StatMini
bmad-dev --prd="Task 1.3: 创建 ValueScore 和 StatMini 组件" \
         --architecture="FRONTEND_IMPLEMENTATION_PLAN.md" \
         --output="components/testcase/ValueScore.tsx,components/testcase/StatMini.tsx"

# Sub-Task 1.4: 集成到 TestCaseManager
bmad-dev --prd="Task 1.4: 将新组件集成到 TestCaseManager" \
         --architecture="FRONTEND_IMPLEMENTATION_PLAN.md" \
         --output="components/TestCaseManager.tsx"
```

---

## 6. 验收标准

### 6.1 代码质量标准

**必须满足**:
1. ✅ TypeScript 类型定义完整, 无 `any` 类型
2. ✅ 所有组件有 Props 接口定义
3. ✅ 遵循 ESLint 规则, 无警告
4. ✅ 组件命名遵循 PascalCase
5. ✅ 文件命名遵循约定 (XxxComponent.tsx)

### 6.2 UI 样式标准

**必须满足**:
1. ✅ 使用 Tailwind CSS, 不使用内联 style
2. ✅ 颜色使用规范的色系 (slate/blue/green/red/amber)
3. ✅ 间距使用 2/4/6/8 倍数 (p-2, p-4, space-x-4)
4. ✅ 圆角使用 lg/xl (rounded-lg, rounded-xl)
5. ✅ 过渡动画使用 transition-colors 或 transition-all
6. ✅ 悬停效果使用 hover:bg-slate-100 模式

### 6.3 功能验收标准

**TestCaseManager**:
- ✅ 快速过滤器点击后正确筛选测试用例
- ✅ 标签云点击后正确过滤
- ✅ 高级搜索面板支持多条件组合
- ✅ 价值评分正确显示 (假数据)
- ✅ 统计信息正确显示

**Dashboard**:
- ✅ 趋势图表正确渲染 (LineChart, AreaChart)
- ✅ Top 失败用例表格正确显示
- ✅ 数据更新时图表自动刷新

**ScriptLab**:
- ✅ 'suites' 模式 Tab 正确显示
- ✅ Branch 节点正确渲染多分支
- ✅ Merge 节点正确渲染
- ✅ Toolbox 包含所有新节点类型

### 6.4 测试标准

**必须完成**:
1. ✅ 组件能在浏览器正常渲染
2. ✅ 点击交互正常响应
3. ✅ 无控制台错误或警告
4. ✅ 响应式布局在不同屏幕尺寸下正常显示

---

## 附录

### A. 开发环境设置

```bash
# 1. 切换到前端目录
cd /Users/liujinliang/workspace/ai/bjtest/NextTestPlatformUI

# 2. 确保依赖已安装
npm install

# 3. 启动开发服务器
npm run dev

# 4. 打开浏览器
# http://localhost:5173
```

### B. 常用命令

```bash
# 格式化代码
npm run format

# 类型检查
npm run type-check

# 构建生产版本
npm run build

# 预览生产版本
npm run preview
```

### C. Git 工作流

```bash
# 1. 创建功能分支
git checkout -b feature/testcase-manager-enhancement

# 2. 提交代码
git add .
git commit -m "feat: add QuickFilter and TagChip components"

# 3. 推送到远程
git push origin feature/testcase-manager-enhancement

# 4. 创建 Pull Request
# 在 GitHub/GitLab 上创建 PR
```

---

**文档结束**
