/**
 * QuickFilter 和 TagChip 组件使用示例
 *
 * 这个文件展示如何在 TestCaseManager 中集成这两个组件
 * 路径: components/testcase/examples/FilterExample.tsx
 */

import React from 'react';
import { QuickFilter } from '../QuickFilter';
import { TagChip } from '../TagChip';

/**
 * 示例: 在 TestCaseManager 左侧栏中使用
 */
export const FilterSidebarExample: React.FC = () => {
  // 模拟过滤处理函数
  const handleFilter = (type: string, value: string | boolean) => {
    console.log(`Filter by ${type}:`, value);
  };

  const handleTagFilter = (tag: string) => {
    console.log(`Filter by tag:`, tag);
  };

  return (
    <div className="w-64 border-r bg-slate-50 p-4 overflow-y-auto">
      {/* 🆕 快速过滤器区域 */}
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

      {/* 🆕 标签云区域 */}
      <div className="border-t pt-4">
        <h3 className="text-xs font-bold text-slate-600 mb-2">标签云</h3>
        <div className="flex flex-wrap gap-1">
          <TagChip
            label="smoke"
            count={23}
            onClick={() => handleTagFilter('smoke')}
          />
          <TagChip
            label="regression"
            count={156}
            onClick={() => handleTagFilter('regression')}
          />
          <TagChip
            label="api"
            count={89}
            onClick={() => handleTagFilter('api')}
          />
          <TagChip
            label="e2e"
            count={34}
            onClick={() => handleTagFilter('e2e')}
          />
          <TagChip
            label="performance"
            count={12}
            onClick={() => handleTagFilter('performance')}
          />
          <TagChip
            label="security"
            count={8}
            onClick={() => handleTagFilter('security')}
          />
        </div>
      </div>
    </div>
  );
};

/**
 * 示例: QuickFilter 不同状态展示
 */
export const QuickFilterShowcase: React.FC = () => {
  return (
    <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-200 space-y-4">
      <h2 className="text-xl font-bold text-slate-800 mb-4">
        QuickFilter 组件展示
      </h2>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-slate-600">标准样式</h3>
        <div className="w-64 space-y-1">
          <QuickFilter icon="👤" label="我的测试" count={12} />
          <QuickFilter icon="🔥" label="P0用例" count={45} />
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-slate-600">警告 Badge</h3>
        <div className="w-64 space-y-1">
          <QuickFilter
            icon="⚠️"
            label="不稳定"
            count={3}
            badge="warning"
          />
          <QuickFilter
            icon="❌"
            label="失败率高"
            count={7}
            badge="warning"
          />
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-slate-600">信息 Badge</h3>
        <div className="w-64 space-y-1">
          <QuickFilter icon="⏱️" label="长时间运行" count={8} badge="info" />
          <QuickFilter icon="💤" label="30天未执行" count={15} badge="info" />
        </div>
      </div>
    </div>
  );
};

/**
 * 示例: TagChip 展示
 */
export const TagChipShowcase: React.FC = () => {
  return (
    <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-200 space-y-4">
      <h2 className="text-xl font-bold text-slate-800 mb-4">
        TagChip 组件展示
      </h2>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-slate-600">标签云示例</h3>
        <div className="flex flex-wrap gap-2">
          <TagChip label="smoke" count={23} />
          <TagChip label="regression" count={156} />
          <TagChip label="api" count={89} />
          <TagChip label="e2e" count={34} />
          <TagChip label="unit" count={245} />
          <TagChip label="integration" count={67} />
          <TagChip label="performance" count={12} />
          <TagChip label="security" count={8} />
          <TagChip label="smoke-test" count={45} />
          <TagChip label="critical" count={23} />
        </div>
      </div>
    </div>
  );
};
