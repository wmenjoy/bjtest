/**
 * IterationCard - Single iteration display within a loop
 *
 * Features:
 * - Header with iteration index and current item value preview
 * - Status badge (passed/failed/skipped)
 * - Duration display
 * - Expandable children StepProgress list
 * - Current item value display with JSON formatting
 */

import React from 'react';
import {
  CheckCircle,
  XCircle,
  SkipForward,
  ChevronDown,
  ChevronRight,
  Hash,
  Loader2,
} from 'lucide-react';
import { IterationExecution, StepExecution } from '../../../types';
import { StepProgress } from './StepProgress';

export interface IterationCardProps {
  /** Iteration execution data */
  iteration: IterationExecution;
  /** Zero-based iteration index */
  index: number;
  /** Whether details are expanded */
  expanded?: boolean;
  /** Toggle expansion callback */
  onToggle?: () => void;
}

/**
 * Get status configuration for display
 */
const getStatusConfig = (status: IterationExecution['status']) => {
  switch (status) {
    case 'passed':
      return {
        icon: <CheckCircle size={14} className="text-green-600" />,
        label: 'Passed',
        textColor: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
      };
    case 'failed':
      return {
        icon: <XCircle size={14} className="text-red-600" />,
        label: 'Failed',
        textColor: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
      };
    case 'skipped':
      return {
        icon: <SkipForward size={14} className="text-slate-400" />,
        label: 'Skipped',
        textColor: 'text-slate-400',
        bgColor: 'bg-slate-50',
        borderColor: 'border-slate-200',
      };
    default:
      return {
        icon: <Loader2 size={14} className="text-blue-600 animate-spin" />,
        label: 'Running',
        textColor: 'text-blue-600',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
      };
  }
};

/**
 * Format duration to human-readable string
 */
const formatDuration = (ms: number): string => {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
};

/**
 * Format item value for preview display
 */
const formatItemPreview = (value: any, maxLength: number = 30): string => {
  if (value === null || value === undefined) return 'null';
  if (typeof value === 'object') {
    // Try to find a meaningful identifier property
    if (value.id !== undefined) return `id=${value.id}`;
    if (value.name !== undefined) return `name=${value.name}`;
    if (value.key !== undefined) return `key=${value.key}`;
    // Fallback to JSON preview
    const json = JSON.stringify(value);
    return json.length > maxLength ? `${json.slice(0, maxLength)}...` : json;
  }
  const str = String(value);
  return str.length > maxLength ? `${str.slice(0, maxLength)}...` : str;
};

export const IterationCard: React.FC<IterationCardProps> = ({
  iteration,
  index,
  expanded = false,
  onToggle,
}) => {
  const statusConfig = getStatusConfig(iteration.status);
  const hasChildren = iteration.children && iteration.children.length > 0;

  return (
    <div className={`border rounded-lg overflow-hidden ${statusConfig.borderColor}`}>
      {/* Header */}
      <div
        className={`flex items-center justify-between p-2.5 cursor-pointer transition-colors ${statusConfig.bgColor} hover:opacity-90`}
        onClick={onToggle}
      >
        <div className="flex items-center space-x-2 flex-1 min-w-0">
          {/* Expand/Collapse Icon */}
          {hasChildren ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggle?.();
              }}
              className="shrink-0 p-0.5 hover:bg-white/50 rounded"
            >
              {expanded ? (
                <ChevronDown size={12} className="text-slate-500" />
              ) : (
                <ChevronRight size={12} className="text-slate-500" />
              )}
            </button>
          ) : (
            <div className="w-4" />
          )}

          {/* Status Icon */}
          <div className="shrink-0">{statusConfig.icon}</div>

          {/* Iteration Label */}
          <div className="flex items-center space-x-2 min-w-0 flex-1">
            <span className="flex items-center space-x-1 text-sm font-medium">
              <Hash size={12} className="text-slate-400" />
              <span className={statusConfig.textColor}>
                Iteration {index + 1}
              </span>
            </span>

            {/* Item Value Preview */}
            {iteration.itemValue !== undefined && (
              <span className="text-xs text-slate-500 font-mono truncate max-w-[150px]" title={JSON.stringify(iteration.itemValue)}>
                ({formatItemPreview(iteration.itemValue)})
              </span>
            )}
          </div>
        </div>

        {/* Status Badge and Duration */}
        <div className="flex items-center space-x-3 shrink-0 ml-2">
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusConfig.bgColor} ${statusConfig.textColor} border ${statusConfig.borderColor}`}>
            {statusConfig.label}
          </span>
          <span className="text-xs font-mono text-slate-500">
            {formatDuration(iteration.duration)}
          </span>
        </div>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="border-t border-inherit bg-white p-3 space-y-3">
          {/* Current Item Value */}
          {iteration.itemValue !== undefined && (
            <div className="p-2 bg-slate-50 rounded border border-slate-200">
              <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">
                Current Item Value
              </span>
              <pre className="text-xs font-mono text-slate-700 overflow-x-auto max-h-24 overflow-y-auto">
                {typeof iteration.itemValue === 'object'
                  ? JSON.stringify(iteration.itemValue, null, 2)
                  : String(iteration.itemValue)}
              </pre>
            </div>
          )}

          {/* Child Steps */}
          {hasChildren && (
            <div className="space-y-2">
              <span className="text-[10px] text-slate-500 uppercase font-bold block">
                Steps ({iteration.children.length})
              </span>
              <div className="space-y-2 border-l-2 border-slate-200 pl-2">
                {iteration.children.map((child: StepExecution) => (
                  <StepProgress
                    key={child.stepId}
                    execution={child}
                    depth={0}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {!hasChildren && iteration.itemValue === undefined && (
            <div className="text-center text-xs text-slate-400 py-2">
              No additional details available
            </div>
          )}
        </div>
      )}
    </div>
  );
};
