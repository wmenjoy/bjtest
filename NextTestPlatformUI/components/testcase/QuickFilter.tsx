import React from 'react';

/**
 * QuickFilter 组件 - 快速过滤器
 *
 * 用于测试用例管理的侧边栏快速过滤功能
 * 支持图标 + 标签 + 计数显示,可选的 badge 提示
 *
 * @example
 * <QuickFilter
 *   icon="👤"
 *   label="我的测试"
 *   count={12}
 *   onClick={() => handleFilter('owner', 'me')}
 * />
 *
 * @example
 * <QuickFilter
 *   icon="⚠️"
 *   label="不稳定"
 *   count={3}
 *   badge="warning"
 *   onClick={() => handleFilter('flaky', true)}
 * />
 */
export interface QuickFilterProps {
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

/**
 * QuickFilter 组件实现
 *
 * UI 规范:
 * - 使用 Tailwind CSS
 * - 颜色: slate (中性), amber (警告)
 * - 间距: 2/4 倍数
 * - 圆角: rounded
 * - 悬停: hover:bg-slate-100
 * - 过渡: transition-colors
 */
export const QuickFilter: React.FC<QuickFilterProps> = ({
  icon,
  label,
  count,
  badge,
  onClick
}) => {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between px-2 py-1.5 rounded hover:bg-slate-100 text-sm group transition-colors"
      type="button"
    >
      {/* 左侧: 图标 + 标签 */}
      <span className="flex items-center space-x-2">
        <span className="text-base">{icon}</span>
        <span className="text-slate-700">{label}</span>
      </span>

      {/* 右侧: 计数 Badge */}
      <span
        className={`text-xs px-1.5 py-0.5 rounded ${
          badge === 'warning'
            ? 'bg-amber-100 text-amber-700'
            : 'bg-slate-200 text-slate-600'
        }`}
      >
        {count}
      </span>
    </button>
  );
};
