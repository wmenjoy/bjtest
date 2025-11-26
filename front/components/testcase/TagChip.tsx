import React from 'react';

/**
 * TagChip 组件 - 标签芯片
 *
 * 用于测试用例管理的标签云功能
 * 显示标签名称和对应的用例数量,支持点击过滤
 *
 * @example
 * <TagChip
 *   label="smoke"
 *   count={23}
 *   onClick={() => handleTagFilter('smoke')}
 * />
 *
 * @example
 * <TagChip
 *   label="regression"
 *   count={156}
 *   onClick={() => handleTagFilter('regression')}
 * />
 */
export interface TagChipProps {
  /** 标签名称 */
  label: string;
  /** 该标签下的用例数量 */
  count: number;
  /** 点击事件处理函数 */
  onClick?: () => void;
}

/**
 * TagChip 组件实现
 *
 * UI 规范:
 * - 使用 Tailwind CSS
 * - 颜色: bg-blue-50 / text-blue-700 (蓝色主题)
 * - 圆角: rounded-full (完全圆形)
 * - 间距: px-2 py-1
 * - 悬停: hover:bg-blue-100
 * - 过渡: transition-colors
 */
export const TagChip: React.FC<TagChipProps> = ({ label, count, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-full hover:bg-blue-100 transition-colors"
      type="button"
    >
      #{label} ({count})
    </button>
  );
};
