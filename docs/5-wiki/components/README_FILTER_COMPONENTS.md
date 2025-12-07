# QuickFilter & TagChip 组件文档

> **创建日期**: 2025-11-24
> **任务**: dev-001 - TestCaseManager 快速过滤器和标签芯片组件
> **文档版本**: v1.0.0

## 概述

这两个组件是 TestCaseManager 左侧栏增强功能的核心组件,用于实现快速过滤和标签云功能。

### 组件列表

1. **QuickFilter.tsx** - 快速过滤器组件
2. **TagChip.tsx** - 标签芯片组件

---

## 1. QuickFilter 组件

### 功能描述

快速过滤器组件,用于在测试用例管理界面提供一键过滤功能。支持图标、标签、计数和可选的警告/信息 badge 显示。

### 文件路径

```
NextTestPlatformUI/components/testcase/QuickFilter.tsx
```

### Props 接口

```typescript
interface QuickFilterProps {
  /** 过滤器图标 (emoji 或 icon string) */
  icon: string;
  /** 过滤器标签文本 */
  label: string;
  /** 匹配该过滤器的项目数量 */
  count: number;
  /** 可选的 badge 样式 - 用于警告或提示 */
  badge?: 'warning' | 'info';
  /** 点击事件处理函数 */
  onClick?: () => void;
}
```

### 使用示例

#### 基础用法

```tsx
import { QuickFilter } from './components/testcase/QuickFilter';

<QuickFilter
  icon="👤"
  label="我的测试"
  count={12}
  onClick={() => handleFilter('owner', 'me')}
/>
```

#### 带警告 Badge

```tsx
<QuickFilter
  icon="⚠️"
  label="不稳定"
  count={3}
  badge="warning"
  onClick={() => handleFilter('flaky', true)}
/>
```

#### 带信息 Badge

```tsx
<QuickFilter
  icon="💤"
  label="30天未执行"
  count={15}
  badge="info"
  onClick={() => handleFilter('lastRun', '30d')}
/>
```

### UI 样式规范

- **颜色系统**:
  - 标签文本: `text-slate-700`
  - 默认 Badge: `bg-slate-200 text-slate-600`
  - 警告 Badge: `bg-amber-100 text-amber-700`
  - 悬停背景: `hover:bg-slate-100`

- **间距**:
  - 内边距: `px-2 py-1.5` (按钮), `px-1.5 py-0.5` (Badge)
  - 图标间距: `space-x-2`

- **圆角**: `rounded`

- **过渡**: `transition-colors`

### 视觉效果

```
┌────────────────────────────────┐
│ 👤 我的测试              [12] │  ← 标准样式
├────────────────────────────────┤
│ ⚠️  不稳定              [3]  │  ← 警告 Badge (amber)
├────────────────────────────────┤
│ 💤 30天未执行           [15] │  ← 信息 Badge (slate)
└────────────────────────────────┘
```

---

## 2. TagChip 组件

### 功能描述

标签芯片组件,用于显示测试用例标签和对应的用例数量。采用圆角完全圆形设计,蓝色主题。

### 文件路径

```
NextTestPlatformUI/components/testcase/TagChip.tsx
```

### Props 接口

```typescript
interface TagChipProps {
  /** 标签名称 */
  label: string;
  /** 该标签下的用例数量 */
  count: number;
  /** 点击事件处理函数 */
  onClick?: () => void;
}
```

### 使用示例

#### 基础用法

```tsx
import { TagChip } from './components/testcase/TagChip';

<TagChip
  label="smoke"
  count={23}
  onClick={() => handleTagFilter('smoke')}
/>
```

#### 标签云布局

```tsx
<div className="flex flex-wrap gap-1">
  <TagChip label="smoke" count={23} onClick={() => handleTagFilter('smoke')} />
  <TagChip label="regression" count={156} onClick={() => handleTagFilter('regression')} />
  <TagChip label="api" count={89} onClick={() => handleTagFilter('api')} />
  <TagChip label="e2e" count={34} onClick={() => handleTagFilter('e2e')} />
</div>
```

### UI 样式规范

- **颜色系统**:
  - 背景: `bg-blue-50`
  - 文本: `text-blue-700`
  - 悬停背景: `hover:bg-blue-100`

- **间距**:
  - 内边距: `px-2 py-1`
  - 标签间距: 使用 `gap-1` (父容器)

- **圆角**: `rounded-full` (完全圆形)

- **过渡**: `transition-colors`

### 视觉效果

```
┌─────────────────────────────────────────┐
│ #smoke (23)  #regression (156)  #api (89) │
│ #e2e (34)  #unit (245)  #security (8)     │
└─────────────────────────────────────────┘
```

---

## 3. 集成到 TestCaseManager

### 完整集成示例

```tsx
import React from 'react';
import { FolderTree } from './FolderTree';
import { QuickFilter } from './QuickFilter';
import { TagChip } from './TagChip';

export const TestCaseManager: React.FC = () => {
  // 状态管理
  const handleFilter = (type: string, value: string | boolean) => {
    console.log(`Filter by ${type}:`, value);
    // 实现过滤逻辑
  };

  const handleTagFilter = (tag: string) => {
    console.log(`Filter by tag:`, tag);
    // 实现标签过滤逻辑
  };

  return (
    <div className="flex h-[calc(100vh-140px)] bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* 左栏: 文件夹树 + 快速过滤 + 标签云 */}
      <div className="w-64 border-r bg-slate-50 p-4 overflow-y-auto">
        {/* 现有 FolderTree */}
        <FolderTree />

        {/* 🆕 快速过滤器 */}
        <div className="mb-4 border-t pt-4">
          <h3 className="text-xs font-bold text-slate-600 mb-2">快速过滤</h3>
          <div className="space-y-1">
            <QuickFilter
              icon="👤"
              label="我的测试"
              count={12}
              onClick={() => handleFilter('owner', 'me')}
            />
            <QuickFilter
              icon="🔥"
              label="P0用例"
              count={45}
              onClick={() => handleFilter('priority', 'P0')}
            />
            <QuickFilter
              icon="⚠️"
              label="不稳定"
              count={3}
              badge="warning"
              onClick={() => handleFilter('flaky', true)}
            />
            <QuickFilter
              icon="⏱️"
              label="长时间运行"
              count={8}
              onClick={() => handleFilter('duration', 'long')}
            />
            <QuickFilter
              icon="💤"
              label="30天未执行"
              count={15}
              onClick={() => handleFilter('lastRun', '30d')}
            />
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

      {/* 中栏: 用例列表 */}
      <div className="flex-1">{/* CaseList */}</div>

      {/* 右栏: 用例详情 */}
      <div className="w-96">{/* CaseDetail */}</div>
    </div>
  );
};
```

---

## 4. 技术规范

### TypeScript 要求

- ✅ 完整的 Props 接口定义
- ✅ 所有 Props 都有 JSDoc 注释
- ✅ 不使用 `any` 类型
- ✅ 导出使用 `React.FC`

### Tailwind CSS 规范

- ✅ 只使用 Tailwind 类名,不使用内联 style
- ✅ 颜色使用 slate/blue/amber 系统
- ✅ 间距使用 2/4/6/8 倍数
- ✅ 圆角使用 rounded 或 rounded-full
- ✅ 过渡动画使用 transition-colors
- ✅ 悬停效果使用 hover 修饰符

### 无障碍性 (Accessibility)

- ✅ 按钮使用 `<button type="button">` 标签
- ✅ 所有交互元素可通过键盘访问
- ✅ 提供清晰的视觉反馈 (悬停效果)

---

## 5. 验收标准

### 功能验收

- [x] QuickFilter 组件支持图标、标签、计数显示
- [x] QuickFilter 支持可选的 warning/info badge
- [x] QuickFilter 支持点击事件
- [x] TagChip 组件支持标签和计数显示
- [x] TagChip 支持点击事件
- [x] 悬停时显示正确的背景色变化

### 代码质量验收

- [x] TypeScript 类型完整,无 any 类型
- [x] Props 接口有完整的 JSDoc 注释
- [x] 代码格式规范,注释清晰
- [x] 组件可复用,耦合度低

### UI 样式验收

- [x] 严格遵循 Tailwind CSS 规范
- [x] 颜色使用符合设计系统
- [x] 间距和圆角符合规范
- [x] 过渡动画流畅自然

---

## 6. 文件清单

```
NextTestPlatformUI/components/testcase/
├── QuickFilter.tsx              # 快速过滤器组件 (82 行)
├── TagChip.tsx                  # 标签芯片组件 (54 行)
├── examples/
│   └── FilterExample.tsx        # 使用示例 (173 行)
└── README_FILTER_COMPONENTS.md  # 本文档
```

---

## 7. 后续任务

- [ ] Sub-Task 1.2: 中栏高级搜索面板 (AdvancedFilterPanel.tsx)
- [ ] Sub-Task 1.3: 右栏价值评分和统计组件 (ValueScore.tsx, StatMini.tsx)
- [ ] 集成到 TestCaseManager 主组件
- [ ] 实现数据获取和状态管理逻辑
- [ ] 编写单元测试

---

## 8. 参考文档

- **实施计划**: `nextest-platform/docs/FRONTEND_IMPLEMENTATION_PLAN.md` (Section 4.2 Task 1)
- **项目说明**: `CLAUDE.md` - NextTestPlatformUI 技术栈和组件规范

---

**创建者**: BMAD Developer Agent
**更新日期**: 2025-11-24
