# NextTestPlatformUI UI 开发规范

## 文档概述

本文档是 NextTestPlatformUI 前端开发的**官方 UI 规范**，所有前端开发必须遵循此规范。

**版本**: 2.0
**最后更新**: 2025-11-23
**状态**: ✅ 活跃维护中
**适用范围**: 所有新增功能、组件开发、UI 修改
**维护人**: Frontend Development Team

---

## 📌 重要说明

### 规范强制性

1. **必须遵循** (MUST): 所有新增代码必须遵循本规范
2. **推荐遵循** (SHOULD): 旧代码重构时建议遵循
3. **持续完善**: 每次添加新组件或模式后更新本文档

### 文档结构

```
├── 1. 技术栈与架构
├── 2. 设计系统核心
├── 3. 组件库规范 ⭐
├── 4. 布局与交互模式
├── 5. 状态管理规范
├── 6. API 集成规范 ⭐ (新增)
├── 7. 最佳实践
└── 8. 附录与速查表
```

---

## 目录

1. [技术栈与架构](#1-技术栈与架构)
2. [设计系统核心](#2-设计系统核心)
3. [组件库规范](#3-组件库规范)
4. [布局与交互模式](#4-布局与交互模式)
5. [状态管理规范](#5-状态管理规范)
6. [API 集成规范](#6-api-集成规范)
7. [最佳实践](#7-最佳实践)
8. [附录与速查表](#8-附录与速查表)

---

## 1. 技术栈与架构

### 1.1 核心技术

| 技术 | 版本 | 说明 |
|------|------|------|
| **React** | 19.2.0 | 使用最新并发特性 |
| **TypeScript** | 5.8.2 | 强制类型安全，禁止 `any` |
| **Vite** | 6.2.0 | 开发服务器 + 构建工具 |
| **Tailwind CSS** | CDN | 原子化 CSS，**禁止内联样式** |
| **Lucide React** | 0.554.0 | 图标库 (1000+ 图标) |
| **Recharts** | 3.4.1 | 数据可视化 |

### 1.2 架构特点

#### ✅ 无 UI 组件库依赖

**决策**: 不使用 Ant Design、Material-UI、Chakra UI 等第三方组件库

**原因**:
1. **完全控制**: 对每个像素有完全控制权
2. **性能优化**: 无冗余代码，Bundle 更小
3. **一致性**: 统一的设计语言
4. **灵活性**: 易于扩展和定制

**规范**:
- ❌ **禁止** 引入任何第三方 UI 组件库
- ✅ **必须** 使用本文档定义的组件模式
- ✅ **必须** 将可复用组件添加到 `/components/ui/` 或 `/components/common/`

### 1.3 文件结构规范

```
NextTestPlatformUI/
├── components/
│   ├── ui/                    # 通用 UI 组件（新增）
│   │   ├── LoadingState.tsx   # 加载状态
│   │   ├── ErrorState.tsx     # 错误状态
│   │   ├── EmptyState.tsx     # 空状态
│   │   └── Toast.tsx          # 通知提示
│   ├── common/                # 基础组件
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Modal.tsx
│   │   └── Card.tsx
│   ├── layout/                # 布局组件
│   │   ├── Sidebar.tsx
│   │   └── Header.tsx
│   ├── dashboard/             # 功能模块组件
│   ├── testcase/
│   └── ...
├── hooks/                     # 自定义 Hooks
│   ├── useAppState.ts         # Mock 数据模式
│   ├── useApiState.ts         # API 数据模式 ⭐
│   ├── usePermissions.ts
│   └── ...
├── services/
│   └── api/                   # API 服务层 ⭐
│       ├── apiClient.ts
│       ├── mappers.ts
│       ├── testApi.ts
│       └── ...
├── types.ts                   # 类型定义
└── data/                      # Mock 数据
```

---

## 2. 设计系统核心

### 2.1 设计原则

#### 2.1.1 简洁优雅 (Minimalist Elegance)

```tsx
// ✅ 正确示例
<div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
  <div className="p-3 bg-green-50 text-green-600 rounded-lg ring-1 ring-green-100">
    <CheckCircle size={24} />
  </div>
  <div>
    <p className="text-xs text-slate-500 font-bold uppercase tracking-wide">Pass Rate</p>
    <h3 className="text-2xl font-extrabold text-slate-800">95%</h3>
  </div>
</div>
```

**设计要点**:
- ✅ 大量留白，视觉呼吸感
- ✅ 圆角设计 (`rounded-xl`, `rounded-lg`)
- ✅ 柔和阴影 (`shadow-sm`)
- ✅ 细腻边框 (`border-slate-200`)

#### 2.1.2 层次分明 (Clear Hierarchy)

**字体大小层级**:
```css
text-[10px]  /* 辅助信息、小标签 */
text-xs      /* 标签、提示 (12px) */
text-sm      /* 正文、列表项 (14px) */
text-base    /* 默认文本 (16px) */
text-lg      /* 小标题 (18px) */
text-xl      /* 标题 (20px) */
text-2xl     /* 大标题 (24px) */
```

**颜色层级**:
```css
text-slate-400  /* 次要信息、禁用 */
text-slate-500  /* 辅助文本 */
text-slate-600  /* 次要文本 */
text-slate-700  /* 主要文本 */
text-slate-800  /* 强调文本 */
text-slate-900  /* 最强调 */
```

### 2.2 色彩系统

#### 2.2.1 语义色彩 (必须遵循)

| 颜色 | 用途 | 类名示例 | 使用场景 |
|------|------|----------|----------|
| **Blue** | 主色调、主按钮 | `bg-blue-600 text-white` | 主要操作、激活状态 |
| **Green** | 成功、通过、激活 | `bg-green-50 text-green-600` | 成功提示、激活环境 |
| **Red** | 错误、失败、删除 | `bg-red-50 text-red-600` | 错误提示、危险操作 |
| **Amber** | 警告、待处理 | `bg-amber-50 text-amber-600` | 警告提示、待审核 |
| **Indigo** | AI、特殊功能 | `bg-indigo-50 text-indigo-600` | AI 生成、特殊标记 |
| **Purple** | 工作流、自动化 | `bg-purple-50 text-purple-600` | 工作流、自动化 |
| **Slate** | 中性色、文本 | `bg-slate-50 text-slate-600` | 背景、边框、文本 |

#### 2.2.2 中性色系统 (Slate)

```javascript
slate: {
  50: '#f8fafc',   // 主背景
  100: '#f1f5f9',  // 次背景
  200: '#e2e8f0',  // 边框
  300: '#cbd5e1',  // 分隔线
  400: '#94a3b8',  // 禁用文本
  500: '#64748b',  // 辅助文本
  700: '#334155',  // 主要文本
  800: '#1e293b',  // 强调文本
  900: '#0f172a',  // 侧边栏背景
}
```

### 2.3 视觉效果规范

#### 2.3.1 圆角系统

```css
/* 必须遵循以下规范 */
rounded      /* 4px - 小元素（标签） */
rounded-lg   /* 8px - 按钮、输入框 ⭐ */
rounded-xl   /* 12px - 卡片 ⭐ */
rounded-2xl  /* 16px - 模态框、大容器 */
rounded-full /* 完全圆形 - 头像、状态点 */
```

#### 2.3.2 阴影系统

```css
shadow-sm    /* 卡片默认阴影 ⭐ */
shadow-md    /* 卡片悬停阴影 */
shadow-lg    /* 下拉菜单阴影 */
shadow-xl    /* 模态框阴影 */
shadow-2xl   /* 重要元素阴影 */
```

#### 2.3.3 间距系统

```css
/* Padding - 使用 4px 倍数 */
p-1   /* 4px */
p-2   /* 8px */
p-3   /* 12px */
p-4   /* 16px ⭐ 列表项、小卡片 */
p-6   /* 24px ⭐ 卡片、模态框 */
p-8   /* 32px ⭐ 页面容器 */

/* Gap (Flexbox/Grid) */
gap-2  /* 8px */
gap-4  /* 16px ⭐ */
gap-6  /* 24px */
```

---

## 3. 组件库规范

### 3.1 核心 UI 组件 (Phase 1 新增)

#### 3.1.1 LoadingState - 加载状态 ⭐

**文件**: `components/ui/LoadingState.tsx`

**必须使用场景**:
- API 数据加载中
- 页面初始化
- 长时间操作

**标准用法**:
```tsx
import { LoadingState } from '../components/ui/LoadingState';

// 基础用法
<LoadingState message="Loading test cases..." />

// 自定义大小
<LoadingState message="Loading..." size={32} />

// 完整页面加载
<div className="h-full flex items-center justify-center">
  <LoadingState message="Initializing..." size={40} />
</div>
```

**实现规范**:
```tsx
// ✅ 正确实现
export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading...',
  size = 24,
  className = 'p-8'
}) => {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <Loader className="animate-spin text-blue-500" size={size} />
      {message && (
        <span className="ml-2 text-slate-600 text-sm">{message}</span>
      )}
    </div>
  );
};
```

**设计规范**:
- ✅ 蓝色旋转动画 (`text-blue-500 animate-spin`)
- ✅ 居中布局
- ✅ 可选消息文字
- ✅ 可自定义尺寸

#### 3.1.2 ErrorState - 错误状态 ⭐

**文件**: `components/ui/LoadingState.tsx`

**必须使用场景**:
- API 调用失败
- 数据加载错误
- 操作异常

**标准用法**:
```tsx
import { ErrorState } from '../components/ui/LoadingState';

// 基础用法
<ErrorState message="Failed to load data" />

// 带重试功能
<ErrorState
  message={error.cases || 'Failed to load test cases'}
  onRetry={() => {
    appState.refresh.cases();
  }}
/>

// 完整页面错误
<div className="h-full flex items-center justify-center p-8">
  <ErrorState
    message="Failed to connect to server"
    onRetry={handleRetry}
  />
</div>
```

**实现规范**:
```tsx
export const ErrorState: React.FC<ErrorStateProps> = ({
  message,
  className = 'p-4',
  onRetry
}) => {
  return (
    <div className={`bg-red-50 border border-red-200 rounded-lg ${className}`}>
      <p className="text-red-600 text-sm">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-2 px-3 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm"
        >
          Retry
        </button>
      )}
    </div>
  );
};
```

**设计规范**:
- ✅ 红色主题 (`bg-red-50 border-red-200 text-red-600`)
- ✅ 圆角 (`rounded-lg`)
- ✅ 可选重试按钮
- ✅ 错误消息清晰可读

#### 3.1.3 EmptyState - 空状态 ⭐

**文件**: `components/ui/LoadingState.tsx`

**必须使用场景**:
- 列表无数据
- 搜索无结果
- 初次使用提示

**标准用法**:
```tsx
import { EmptyState } from '../components/ui/LoadingState';

// 基础用法
<EmptyState message="No test cases found" />

// 自定义图标
<EmptyState
  icon={<Inbox size={48} className="mx-auto mb-2 text-slate-300" />}
  message="No data available"
/>

// 完整空状态（带引导）
{cases.length === 0 ? (
  <div className="flex flex-col items-center justify-center p-12">
    <EmptyState message="No test cases yet" />
    <button
      onClick={onAddCase}
      className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg"
    >
      Create First Test Case
    </button>
  </div>
) : (
  <CaseList cases={cases} />
)}
```

**设计规范**:
- ✅ 灰色主题 (`text-slate-400`)
- ✅ 居中布局
- ✅ 图标 + 文字
- ✅ 引导用户下一步操作

#### 3.1.4 Toast - 通知提示

**文件**: `components/ui/LoadingState.tsx`

**必须使用场景**:
- 操作成功提示
- 操作失败提示
- 信息通知

**标准用法**:
```tsx
import { Toast } from '../components/ui/LoadingState';

// 成功提示
<Toast message="Saved successfully!" type="success" onClose={() => setShowToast(false)} />

// 错误提示
<Toast message="Failed to save" type="error" onClose={() => setShowToast(false)} />

// 信息提示
<Toast message="Changes detected" type="info" onClose={() => setShowToast(false)} />
```

**实现规范**:
- ✅ 固定定位 (`fixed top-4 right-4`)
- ✅ 3 秒自动消失
- ✅ 淡入动画 (`animate-fade-in`)
- ✅ 三种类型: success (绿), error (红), info (蓝)

### 3.2 按钮组件规范

#### 3.2.1 主要按钮 (Primary Button)

```tsx
// ✅ 标准主按钮
<button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-medium">
  Save
</button>

// ✅ 带图标
<button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-medium flex items-center gap-2">
  <Plus size={18} />
  Create
</button>
```

**规范要点**:
- `bg-blue-600` 背景色
- `hover:bg-blue-700` 悬停效果
- `shadow-sm` 阴影
- `transition-colors` 平滑过渡

#### 3.2.2 次要按钮 (Secondary Button)

```tsx
<button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-sm">
  Cancel
</button>
```

#### 3.2.3 危险按钮 (Danger Button)

```tsx
<button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-sm">
  Delete
</button>
```

#### 3.2.4 图标按钮 (Icon Button)

```tsx
// ✅ 小图标按钮
<button className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors">
  <Sparkles size={18} />
</button>

// ✅ Ghost 按钮
<button className="p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-50 rounded-lg transition-colors">
  <Edit size={18} />
</button>
```

### 3.3 输入组件规范

#### 3.3.1 文本输入框

```tsx
// ✅ 标准输入框
<input
  type="text"
  placeholder="Enter text..."
  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
/>
```

**规范要点**:
- `bg-slate-50` 浅色背景
- `focus:ring-2 focus:ring-blue-500` 聚焦蓝色边框
- `focus:bg-white` 聚焦时背景变白
- `transition-colors` 平滑过渡

#### 3.3.2 搜索框

```tsx
// ✅ 标准搜索框
<div className="relative">
  <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
  <input
    type="text"
    placeholder="Search..."
    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
  />
</div>
```

**规范要点**:
- 左侧图标定位 (`absolute left-3`)
- `pl-9` 为图标留出空间
- 使用 `Search` 图标 (lucide-react)

#### 3.3.3 下拉选择器

```tsx
// ✅ 标准下拉选择器
<div className="relative">
  <button
    onClick={() => setShowMenu(!showMenu)}
    className="w-full flex items-center justify-between px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm hover:bg-white transition-colors"
  >
    <span>{selectedOption}</span>
    <ChevronDown
      size={16}
      className={`text-slate-400 transition-transform ${showMenu ? 'rotate-180' : ''}`}
    />
  </button>

  {showMenu && (
    <>
      <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)}></div>
      <div className="absolute top-full left-0 w-full mt-1 bg-white rounded-lg shadow-xl border border-slate-200 z-20 overflow-hidden py-1">
        {options.map(option => (
          <button
            key={option.value}
            onClick={() => { handleSelect(option); setShowMenu(false); }}
            className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-slate-50 transition-colors"
          >
            <span>{option.label}</span>
            {selected === option.value && <Check size={14} className="text-blue-600" />}
          </button>
        ))}
      </div>
    </>
  )}
</div>
```

**规范要点**:
- 全屏遮罩关闭菜单
- ChevronDown 旋转 180° 动画
- 选中项显示 Check 图标
- z-index: 遮罩 z-10, 菜单 z-20

### 3.4 卡片组件规范

#### 3.4.1 基础卡片

```tsx
// ✅ 标准卡片
<div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
  {/* 内容 */}
</div>

// ✅ 可悬停卡片
<div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow cursor-pointer">
  {/* 内容 */}
</div>
```

#### 3.4.2 统计卡片

```tsx
// ✅ 统计卡片模式
<div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center space-x-4 hover:shadow-md transition-shadow">
  {/* 图标区域 */}
  <div className="p-3 bg-green-50 text-green-600 rounded-lg ring-1 ring-green-100">
    <CheckCircle size={24} />
  </div>

  {/* 数据区域 */}
  <div>
    <p className="text-xs text-slate-500 font-bold uppercase tracking-wide">Pass Rate</p>
    <h3 className="text-2xl font-extrabold text-slate-800">95%</h3>
  </div>
</div>
```

**设计要点**:
- 图标容器使用语义色彩 (`bg-green-50 text-green-600`)
- `ring-1 ring-green-100` 细微边框
- 标签大写 + 字母间距 (`uppercase tracking-wide`)
- 数值大字号 + 粗体 (`text-2xl font-extrabold`)

### 3.5 模态框组件规范

```tsx
// ✅ 标准模态框
{showModal && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
    {/* 遮罩层 */}
    <div className="fixed inset-0" onClick={onClose}></div>

    {/* 模态框内容 */}
    <div
      className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden animate-slide-in-right"
      onClick={(e) => e.stopPropagation()}
    >
      {/* 头部 */}
      <div className="flex justify-between items-center p-6 border-b border-slate-200">
        <h3 className="text-xl font-bold text-slate-800">Title</h3>
        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
          <X size={20} />
        </button>
      </div>

      {/* 内容区域 */}
      <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
        {children}
      </div>

      {/* 底部操作栏 */}
      <div className="flex justify-end space-x-3 p-6 border-t border-slate-200 bg-slate-50">
        <button className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50">
          Cancel
        </button>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          Confirm
        </button>
      </div>
    </div>
  </div>
)}
```

**规范要点**:
- 半透明遮罩 (`bg-black/50`)
- 居中显示 (`flex items-center justify-center`)
- 最大高度 90vh (`max-h-[90vh]`)
- 内容区可滚动
- 底部操作栏灰色背景 (`bg-slate-50`)

---

## 4. 布局与交互模式

### 4.1 应用整体布局

```tsx
// ✅ 标准应用布局
<div className="min-h-screen bg-slate-50 flex font-sans animate-fade-in transition-colors duration-300">
  {/* 侧边栏 - 固定宽度 */}
  <Sidebar className="w-64 shrink-0" />

  {/* 主内容区 - 自适应 */}
  <main className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-50 text-slate-900">
    <div className="flex-1 overflow-hidden relative">
      {/* 页面内容 */}
    </div>
  </main>
</div>
```

### 4.2 三栏布局（测试用例管理）

```tsx
// ✅ 三栏布局模式
<div className="flex h-full">
  {/* 左侧：文件树 */}
  <div className="w-1/4 min-w-[250px] border-r border-slate-200 flex flex-col">
    <FolderTree />
  </div>

  {/* 中间：列表 */}
  <div className="w-1/3 min-w-[300px] border-r border-slate-200 flex flex-col">
    <CaseList />
  </div>

  {/* 右侧：详情 */}
  <div className="flex-1 flex flex-col">
    <CaseDetail />
  </div>
</div>
```

### 4.3 列表项交互模式

```tsx
// ✅ 标准列表项
<div
  onClick={() => onSelect(item)}
  className={`
    p-4 border-b border-slate-50 cursor-pointer group
    hover:bg-slate-50 transition-colors
    ${selected ? 'bg-blue-50/50 border-l-4 border-l-blue-500' : 'border-l-4 border-l-transparent'}
  `}
>
  {/* 列表项内容 */}

  {/* 悬停时显示的操作按钮 */}
  <button
    onClick={(e) => { e.stopPropagation(); onEdit(); }}
    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-blue-600"
  >
    <MoreHorizontal size={14} />
  </button>
</div>
```

**交互规范**:
- 选中状态: 左侧蓝色边框 + 浅蓝背景
- 悬停效果: `hover:bg-slate-50`
- `group` 类用于子元素响应父元素悬停
- 操作按钮默认隐藏，悬停显示
- `e.stopPropagation()` 阻止事件冒泡

---

## 5. 状态管理规范

### 5.1 全局状态管理

#### 5.1.1 Mock 数据模式 (useAppState)

```tsx
// hooks/useAppState.ts
export const useAppState = () => {
  const [cases, setCases] = useState<TestCase[]>(MOCK_CASES);
  const [folders, setFolders] = useState<TestFolder[]>(MOCK_FOLDERS);

  const addCase = (c: TestCase) => {
    setCases(prev => [...prev, { ...c, projectId: activeProjectId }]);
  };

  return {
    cases, addCase, updateCase,
    folders, addFolder,
    // ...
  };
};
```

#### 5.1.2 API 数据模式 (useApiState) ⭐

```tsx
// hooks/useApiState.ts
export const useApiState = () => {
  const [cases, setCases] = useState<TestCase[]>([]);
  const [loading, setLoading] = useState<LoadingState>({
    cases: false,
    folders: false,
    // ...
  });
  const [error, setError] = useState<ErrorState>({
    cases: null,
    folders: null,
    // ...
  });

  const loadTestCases = useCallback(async () => {
    setLoading(prev => ({ ...prev, cases: true }));
    setError(prev => ({ ...prev, cases: null }));
    try {
      const response = await testApi.list();
      setCases(response.data.map(testCaseFromBackend));
    } catch (err) {
      setError(prev => ({ ...prev, cases: err.message }));
    } finally {
      setLoading(prev => ({ ...prev, cases: false }));
    }
  }, [activeProjectId]);

  const addCase = async (c: TestCase) => {
    try {
      const created = await testApi.create(c);
      setCases(prev => [...prev, created]);
    } catch (err) {
      throw err;
    }
  };

  return {
    cases, addCase, updateCase,
    loading, error, // ⭐ 新增
    refresh: { cases: loadTestCases }, // ⭐ 新增
  };
};
```

**规范要点**:
- ✅ 完全兼容 useAppState 接口
- ✅ 添加 `loading` 和 `error` 状态
- ✅ 提供 `refresh` 函数集合
- ✅ 使用类型映射函数 (testCaseFromBackend)

### 5.2 模式切换规范

```tsx
// App.tsx
const useMock = import.meta.env.VITE_USE_MOCK_DATA === 'true';
const appState = useMock ? useAppState() : useApiState();

// 安全访问 API 专用字段
const loading = 'loading' in appState ? appState.loading : undefined;
const error = 'error' in appState ? appState.error : undefined;
```

**配置**:
```bash
# .env.local
VITE_USE_MOCK_DATA=false  # true=Mock, false=API
```

---

## 6. API 集成规范

### 6.1 API 服务层结构

```
services/api/
├── apiClient.ts          # HTTP 客户端 + 错误处理
├── backendTypes.ts       # 后端 API 类型定义
├── mappers.ts            # 前后端类型映射函数
├── testApi.ts            # 测试案例 API
├── groupApi.ts           # 测试分组 API
├── environmentApi.ts     # 环境管理 API
├── workflowApi.ts        # 工作流 API
├── tenantApi.ts          # 租户 API (v2)
├── projectApi.ts         # 项目 API (v2)
├── websocket.ts          # WebSocket 客户端
└── index.ts              # 统一导出
```

### 6.2 API 客户端规范

#### 6.2.1 错误处理

```tsx
// services/api/apiClient.ts
export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export class NotFoundError extends ApiError {
  constructor(message: string) {
    super(404, message);
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = errorData.error || `HTTP ${response.status}`;

    if (response.status === 404) throw new NotFoundError(message);
    if (response.status === 409) throw new ConflictError(message);
    if (response.status === 400) throw new ValidationError(message);
    throw new ServerError(response.status, message);
  }
  return response.json();
}
```

#### 6.2.2 类型映射规范

```tsx
// services/api/mappers.ts

// ✅ 前端 → 后端
export function testCaseToBackend(testCase: TestCase): CreateTestCaseRequest {
  return {
    testId: testCase.id,
    groupId: testCase.folderId,
    name: testCase.title,
    priority: priorityToBackend(testCase.priority),
    status: statusToBackend(testCase.status),
    // ...
  };
}

// ✅ 后端 → 前端
export function testCaseFromBackend(backend: BackendTestCase): TestCase {
  return {
    id: backend.testId,
    folderId: backend.groupId,
    title: backend.name,
    priority: priorityFromBackend(backend.priority),
    status: statusFromBackend(backend.status),
    // ...
  };
}
```

**规范要点**:
- ✅ 严格使用映射函数，禁止直接使用后端数据
- ✅ 所有字段映射必须在 mappers.ts 中定义
- ✅ 枚举类型必须有对应的转换函数

### 6.3 Loading/Error UI 集成规范

#### 6.3.1 标准模式

```tsx
// App.tsx - 测试案例模块示例
{currentTab === 'cases' && (
  hasPermission('VIEW_CASES') ? (
    <>
      {/* 1. Loading State */}
      {loading && (loading.cases || loading.folders) && (
        <div className="h-full flex items-center justify-center">
          <LoadingState message="Loading test cases..." size={32} />
        </div>
      )}

      {/* 2. Error State */}
      {error && (error.cases || error.folders) && (
        <div className="h-full flex items-center justify-center p-8">
          <ErrorState
            message={error.cases || error.folders || 'Failed to load data'}
            onRetry={() => {
              if ('refresh' in appState) {
                appState.refresh.cases();
                appState.refresh.folders();
              }
            }}
          />
        </div>
      )}

      {/* 3. Main Content */}
      {(!loading || (!loading.cases && !loading.folders)) &&
       (!error || (!error.cases && !error.folders)) && (
        <TestCaseManager
          cases={activeProjectCases}
          folders={activeProjectFolders}
          {...props}
        />
      )}
    </>
  ) : <AccessDenied />
)}
```

**规范要点**:
- ✅ 优先显示 Loading
- ✅ 错误优先于内容
- ✅ 正常时显示内容
- ✅ 提供 Retry 功能

#### 6.3.2 局部 Loading 规范

```tsx
// 组件内部局部加载
const [isLoading, setIsLoading] = useState(false);

const handleSubmit = async () => {
  setIsLoading(true);
  try {
    await testApi.create(testCase);
    // 成功提示
  } catch (err) {
    // 错误提示
  } finally {
    setIsLoading(false);
  }
};

return (
  <button
    onClick={handleSubmit}
    disabled={isLoading}
    className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
  >
    {isLoading ? (
      <>
        <Loader className="animate-spin" size={16} />
        Saving...
      </>
    ) : (
      'Save'
    )}
  </button>
);
```

### 6.4 WebSocket 集成规范

```tsx
// 实时工作流日志
import { workflowStreamClient } from '../services/api';

const handleExecute = async () => {
  const run = await workflowApi.execute(workflowId);

  // 连接 WebSocket
  workflowStreamClient.connect(run.runId, {
    onStepLog: (log) => {
      setLogs(prev => [...prev, log.message]);
    },
    onStepComplete: (payload) => {
      updateStepStatus(payload.stepId, payload.status);
    },
    onError: (error) => {
      console.error('WebSocket error:', error);
    },
    onClose: () => {
      console.log('WebSocket closed');
    }
  });
};

// 组件卸载时断开连接
useEffect(() => {
  return () => {
    workflowStreamClient.disconnect();
  };
}, []);
```

---

## 7. 最佳实践

### 7.1 组件设计原则

#### 7.1.1 单一职责

```tsx
// ❌ 不好：一个组件做太多事
const TestManager = () => {
  // 包含列表、详情、编辑、搜索、过滤...
};

// ✅ 好：拆分成多个组件
const TestCaseManager = () => (
  <div className="flex h-full">
    <FolderTree />
    <CaseList />
    <CaseDetail />
  </div>
);
```

#### 7.1.2 Props 接口清晰

```tsx
// ✅ 定义清晰的 Props 接口
interface CaseListProps {
  cases: TestCase[];
  selectedCaseId: string | null;
  onSelectCase: (c: TestCase) => void;
  onEditCase: (c: TestCase) => void;
  loading?: boolean; // 可选
  error?: string | null; // 可选
}

export const CaseList: React.FC<CaseListProps> = ({
  cases,
  selectedCaseId,
  onSelectCase,
  onEditCase,
  loading = false,
  error = null
}) => {
  // 组件实现
};
```

### 7.2 样式管理规范

#### 7.2.1 禁止内联样式

```tsx
// ❌ 禁止
<div style={{ backgroundColor: 'white', padding: '24px' }}>

// ✅ 使用 Tailwind 类
<div className="bg-white p-6">
```

#### 7.2.2 条件样式组合

```tsx
// ✅ 使用模板字符串
<div className={`
  p-4 rounded-lg transition-colors
  ${isActive ? 'bg-blue-50 border-blue-500' : 'bg-white border-slate-200'}
  ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-slate-50'}
`}>
```

#### 7.2.3 提取常用样式

```tsx
// ✅ 定义样式常量
const cardStyles = 'bg-white p-6 rounded-xl shadow-sm border border-slate-200';
const buttonPrimaryStyles = 'px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm';

<div className={cardStyles}>
  <button className={buttonPrimaryStyles}>Click</button>
</div>
```

### 7.3 性能优化

#### 7.3.1 使用 useMemo 缓存计算

```tsx
// ✅ 缓存过滤结果
const filteredCases = useMemo(() =>
  cases.filter(c => c.projectId === activeProjectId),
  [cases, activeProjectId]
);
```

#### 7.3.2 使用 useCallback 缓存函数

```tsx
// ✅ 避免子组件不必要的重渲染
const handleSelectCase = useCallback((caseId: string) => {
  setSelectedCaseId(caseId);
}, []);

<CaseList onSelectCase={handleSelectCase} />
```

#### 7.3.3 列表渲染优化

```tsx
// ✅ 使用唯一 key
{cases.map(c => (
  <CaseItem key={c.id} case={c} />
))}

// ❌ 避免使用索引作为 key（如果列表会重排序）
{cases.map((c, index) => (
  <CaseItem key={index} case={c} />
))}
```

### 7.4 类型安全

#### 7.4.1 禁止使用 any

```typescript
// ❌ 禁止
const handleData = (data: any) => { };

// ✅ 使用具体类型
const handleData = (data: TestCase) => { };

// ✅ 或使用泛型
const handleData = <T extends BaseType>(data: T) => { };
```

#### 7.4.2 定义完整的类型

```typescript
// ✅ 使用 TypeScript 接口
interface TestCase {
  id: string;
  title: string;
  priority: Priority;
  status: Status;
  steps: TestStep[];
  // ...
}

// ✅ 使用枚举
enum Priority {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High',
  CRITICAL = 'Critical'
}
```

### 7.5 错误处理

#### 7.5.1 空状态处理

```tsx
// ✅ 友好的空状态
{cases.length === 0 ? (
  <div className="flex flex-col items-center justify-center p-12">
    <EmptyState message="No test cases yet" />
    <button
      onClick={onAddCase}
      className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg"
    >
      Create Test Case
    </button>
  </div>
) : (
  <CaseList cases={cases} />
)}
```

#### 7.5.2 错误边界

```tsx
// ✅ 添加错误边界
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-screen">
          <AlertTriangle size={48} className="text-red-500 mb-4" />
          <h2 className="text-xl font-bold">Something went wrong</h2>
        </div>
      );
    }
    return this.props.children;
  }
}
```

### 7.6 可访问性

#### 7.6.1 语义化 HTML

```tsx
// ✅ 使用语义化标签
<nav>
  <button>Dashboard</button>
</nav>

<main>
  <article>
    <h1>Title</h1>
    <p>Content</p>
  </article>
</main>

// ❌ 避免全部使用 div
<div>
  <div>Dashboard</div>
</div>
```

#### 7.6.2 ARIA 属性

```tsx
// ✅ 为交互元素添加标签
<button
  aria-label="Close modal"
  onClick={onClose}
>
  <X size={20} />
</button>
```

---

## 8. 附录与速查表

### 8.1 颜色速查表

| 用途 | 类名 | 示例 |
|------|------|------|
| 主背景 | `bg-slate-50` | 页面背景 |
| 卡片背景 | `bg-white` | 卡片、模态框 |
| 主按钮 | `bg-blue-600 text-white` | CTA 按钮 |
| 次要按钮 | `bg-white border border-slate-200` | 取消按钮 |
| 危险按钮 | `bg-red-600 text-white` | 删除操作 |
| 成功提示 | `bg-green-50 text-green-600` | 成功消息 |
| 错误提示 | `bg-red-50 text-red-600` | 错误消息 |
| 警告提示 | `bg-amber-50 text-amber-600` | 警告消息 |
| 边框 | `border-slate-200` | 卡片边框 |
| 分隔线 | `border-slate-100` | 列表分隔 |

### 8.2 间距速查表

| 用途 | 类名 | 值 |
|------|------|-----|
| 列表项内边距 | `p-4` | 16px |
| 卡片内边距 | `p-6` | 24px |
| 页面容器内边距 | `p-8` | 32px |
| 按钮内边距 | `px-4 py-2` | 16px/8px |
| 元素间距 | `gap-4` | 16px |
| 网格间距 | `gap-6` | 24px |

### 8.3 组件速查表

| 组件 | 文件位置 | 用途 |
|------|----------|------|
| LoadingState | `components/ui/LoadingState.tsx` | 加载指示器 |
| ErrorState | `components/ui/LoadingState.tsx` | 错误提示 |
| EmptyState | `components/ui/LoadingState.tsx` | 空状态 |
| Toast | `components/ui/LoadingState.tsx` | 通知提示 |
| Button | 待创建 | 按钮组件 |
| Input | 待创建 | 输入框组件 |
| Modal | 待创建 | 模态框组件 |
| Card | 待创建 | 卡片组件 |

### 8.4 图标使用速查表

| 用途 | 图标 | 导入 |
|------|------|------|
| 成功 | CheckCircle | `import { CheckCircle } from 'lucide-react';` |
| 错误 | XCircle | `import { XCircle } from 'lucide-react';` |
| 警告 | AlertTriangle | `import { AlertTriangle } from 'lucide-react';` |
| 信息 | Info | `import { Info } from 'lucide-react';` |
| 加载 | Loader | `import { Loader } from 'lucide-react';` |
| 搜索 | Search | `import { Search } from 'lucide-react';` |
| 添加 | Plus | `import { Plus } from 'lucide-react';` |
| 编辑 | Edit | `import { Edit } from 'lucide-react';` |
| 删除 | Trash | `import { Trash } from 'lucide-react';` |
| 关闭 | X | `import { X } from 'lucide-react';` |
| AI功能 | Sparkles | `import { Sparkles } from 'lucide-react';` |
| 下拉 | ChevronDown | `import { ChevronDown } from 'lucide-react';` |

---

## 9. 版本更新日志

### Version 2.0 (2025-11-23)

**重大更新**:
- ✅ 添加 API 集成规范章节
- ✅ 新增 LoadingState、ErrorState、EmptyState、Toast 组件规范
- ✅ 添加 useApiState Hook 规范
- ✅ 添加 Loading/Error UI 集成模式
- ✅ 完善类型映射规范
- ✅ 添加 WebSocket 集成规范
- ✅ 更新文件结构规范
- ✅ 添加组件速查表

**文档改进**:
- 升级为正式开发规范文档
- 添加版本号和状态标识
- 添加强制性说明
- 优化章节结构

### Version 1.0 (2025-11-23)

**初始版本**:
- 技术栈分析
- 设计系统
- 基础组件模式
- 布局模式
- 交互模式

---

## 10. 贡献指南

### 10.1 如何更新本规范

1. **添加新组件**: 在对应章节添加组件说明和示例
2. **更新设计模式**: 在交互模式章节添加新模式
3. **修改规范**: 需团队评审后更新
4. **更新版本**: 每次重大更新需更新版本号

### 10.2 命名规范

- **组件文件**: PascalCase (如 `LoadingState.tsx`)
- **Hook 文件**: camelCase with use 前缀 (如 `useApiState.ts`)
- **类型文件**: camelCase (如 `types.ts`)
- **常量**: UPPER_SNAKE_CASE (如 `API_BASE_URL`)

---

**文档结束**

**下次更新提醒**:
- [ ] Phase 2 完成后添加实际使用示例
- [ ] 添加更多组件到组件库
- [ ] 添加动画系统详细说明
- [ ] 添加主题切换完整指南
