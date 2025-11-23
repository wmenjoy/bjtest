import React, { useMemo } from 'react';
import { TestStep, LoopConfig, IterationExecution, StepExecution } from '../../../types';
import {
  RefreshCw,
  ArrowDown,
  Box,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronRight,
  Layers,
  MoreHorizontal
} from 'lucide-react';

/**
 * Props for the LoopDataFlow component
 */
export interface LoopDataFlowProps {
  /** The step containing the loop */
  step: TestStep;
  /** Loop configuration */
  loopConfig: LoopConfig;
  /** Execution data for iterations (if available) */
  iterations?: IterationExecution[];
  /** Whether to show in expanded view */
  expanded?: boolean;
  /** Max iterations to display (for large arrays) */
  maxDisplayIterations?: number;
  /** Callback when iteration is clicked */
  onIterationClick?: (index: number) => void;
  /** Callback when child step is clicked */
  onChildStepClick?: (stepId: string, iterationIndex: number) => void;
}

/**
 * Status badge component
 */
const StatusBadge: React.FC<{ status: 'passed' | 'failed' | 'skipped' | 'pending' | 'running' }> = ({
  status
}) => {
  const config = {
    passed: { icon: <CheckCircle2 size={12} />, bg: 'bg-green-100', text: 'text-green-700' },
    failed: { icon: <XCircle size={12} />, bg: 'bg-red-100', text: 'text-red-700' },
    skipped: { icon: <MoreHorizontal size={12} />, bg: 'bg-slate-100', text: 'text-slate-500' },
    pending: { icon: <Clock size={12} />, bg: 'bg-slate-100', text: 'text-slate-500' },
    running: {
      icon: <RefreshCw size={12} className="animate-spin" />,
      bg: 'bg-blue-100',
      text: 'text-blue-700'
    }
  };

  const { icon, bg, text } = config[status];

  return (
    <span
      className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${bg} ${text}`}
    >
      {icon}
      <span className="capitalize">{status}</span>
    </span>
  );
};

/**
 * Format value for display (truncated)
 */
const formatItemValue = (value: any, maxLength: number = 30): string => {
  if (value === undefined) return 'undefined';
  if (value === null) return 'null';
  if (typeof value === 'string') {
    return value.length > maxLength ? `"${value.slice(0, maxLength)}..."` : `"${value}"`;
  }
  if (typeof value === 'object') {
    const str = JSON.stringify(value);
    return str.length > maxLength ? str.slice(0, maxLength) + '...' : str;
  }
  return String(value);
};

/**
 * Single iteration card component
 */
const IterationCard: React.FC<{
  index: number;
  itemValue?: any;
  status?: 'passed' | 'failed' | 'skipped';
  duration?: number;
  childrenCount?: number;
  itemVarName?: string;
  onClick?: () => void;
  isExpanded?: boolean;
  children?: React.ReactNode;
}> = ({
  index,
  itemValue,
  status,
  duration,
  childrenCount,
  itemVarName = 'item',
  onClick,
  isExpanded,
  children
}) => {
  return (
    <div
      className={`border rounded-lg overflow-hidden transition-all ${
        status === 'failed'
          ? 'border-red-200 bg-red-50/30'
          : status === 'passed'
          ? 'border-green-200 bg-green-50/30'
          : 'border-slate-200 bg-slate-50/30'
      }`}
    >
      {/* Iteration header */}
      <div
        className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-white/50 transition-colors"
        onClick={onClick}
      >
        <div className="flex items-center space-x-3">
          {/* Iteration index */}
          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">
            {index}
          </div>

          {/* Item variable assignment */}
          <div className="text-xs font-mono text-slate-600">
            <span className="text-purple-600">{itemVarName}</span>
            <span className="text-slate-400"> = </span>
            <span className="text-slate-700">{formatItemValue(itemValue)}</span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Duration */}
          {duration !== undefined && (
            <span className="text-[10px] text-slate-400">{duration}ms</span>
          )}

          {/* Status */}
          {status && <StatusBadge status={status} />}

          {/* Expand icon */}
          {children && (
            <ChevronRight
              size={14}
              className={`text-slate-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
            />
          )}
        </div>
      </div>

      {/* Expanded child steps */}
      {isExpanded && children && (
        <div className="border-t border-slate-100 p-3 bg-white/50">{children}</div>
      )}
    </div>
  );
};

/**
 * Loop source indicator
 */
const LoopSourceIndicator: React.FC<{
  loopConfig: LoopConfig;
  sourceValue?: any[];
}> = ({ loopConfig, sourceValue }) => {
  const getLoopDescription = () => {
    switch (loopConfig.type) {
      case 'forEach':
        return (
          <span>
            Iterating over{' '}
            <code className="text-purple-600 bg-purple-50 px-1 rounded">
              {loopConfig.source?.replace(/\{\{|\}\}/g, '')}
            </code>
            {sourceValue && (
              <span className="text-slate-500"> ({sourceValue.length} items)</span>
            )}
          </span>
        );
      case 'count':
        return (
          <span>
            Repeating{' '}
            <code className="text-blue-600 bg-blue-50 px-1 rounded">{loopConfig.count}</code>{' '}
            times
          </span>
        );
      case 'while':
        return (
          <span>
            While{' '}
            <code className="text-amber-600 bg-amber-50 px-1 rounded">{loopConfig.condition}</code>
          </span>
        );
      default:
        return <span>Loop</span>;
    }
  };

  return (
    <div className="flex items-center space-x-2 text-xs text-slate-600">
      <RefreshCw size={14} className="text-blue-500" />
      {getLoopDescription()}
    </div>
  );
};

/**
 * LoopDataFlow component - Visualizes loop-specific data flow
 *
 * Shows:
 * - Source array flowing into loop
 * - Item variable scope within loop body
 * - Each iteration with its item value
 * - Accumulated outputs from iterations
 */
export const LoopDataFlow: React.FC<LoopDataFlowProps> = ({
  step,
  loopConfig,
  iterations,
  expanded = false,
  maxDisplayIterations = 10,
  onIterationClick,
  onChildStepClick
}) => {
  const [expandedIteration, setExpandedIteration] = React.useState<number | null>(null);

  // Calculate loop statistics
  const stats = useMemo(() => {
    if (!iterations) return null;

    return {
      total: iterations.length,
      passed: iterations.filter((i) => i.status === 'passed').length,
      failed: iterations.filter((i) => i.status === 'failed').length,
      skipped: iterations.filter((i) => i.status === 'skipped').length,
      totalDuration: iterations.reduce((sum, i) => sum + (i.duration || 0), 0)
    };
  }, [iterations]);

  // Determine which iterations to show
  const displayIterations = useMemo(() => {
    if (!iterations) return [];
    if (iterations.length <= maxDisplayIterations) return iterations;

    // Show first few, ellipsis, last few
    const firstCount = Math.floor(maxDisplayIterations / 2);
    const lastCount = maxDisplayIterations - firstCount;
    return [
      ...iterations.slice(0, firstCount),
      { isEllipsis: true, skippedCount: iterations.length - maxDisplayIterations },
      ...iterations.slice(-lastCount)
    ] as (IterationExecution | { isEllipsis: true; skippedCount: number })[];
  }, [iterations, maxDisplayIterations]);

  const itemVarName = loopConfig.itemVar || 'item';
  const indexVarName = loopConfig.indexVar || 'i';

  return (
    <div className="bg-white rounded-xl border-2 border-blue-200 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-blue-50 border-b border-blue-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded bg-blue-100">
              <RefreshCw size={16} className="text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-800">
                {step.name || step.summary || 'Loop Step'}
              </h3>
              <LoopSourceIndicator loopConfig={loopConfig} />
            </div>
          </div>

          {/* Stats */}
          {stats && (
            <div className="flex items-center space-x-3 text-xs">
              <span className="text-slate-500">{stats.total} iterations</span>
              {stats.passed > 0 && (
                <span className="text-green-600">{stats.passed} passed</span>
              )}
              {stats.failed > 0 && <span className="text-red-600">{stats.failed} failed</span>}
              <span className="text-slate-400">{stats.totalDuration}ms total</span>
            </div>
          )}
        </div>

        {/* Variable scope info */}
        <div className="mt-2 flex items-center space-x-4 text-[10px] text-slate-500">
          <span>
            Scope variables:{' '}
            <code className="text-purple-600 bg-purple-50 px-1 rounded">{itemVarName}</code>
            {loopConfig.indexVar && (
              <>
                ,{' '}
                <code className="text-purple-600 bg-purple-50 px-1 rounded">{indexVarName}</code>
              </>
            )}
          </span>
        </div>
      </div>

      {/* Loop body representation */}
      <div className="p-4">
        {/* Source array indicator */}
        <div className="flex items-center justify-center mb-4">
          <div className="flex items-center space-x-2 px-3 py-1.5 bg-purple-50 border border-purple-200 rounded-lg">
            <Layers size={14} className="text-purple-500" />
            <span className="text-xs font-mono text-purple-700">
              {loopConfig.source?.replace(/\{\{|\}\}/g, '')} [{loopConfig.type === 'forEach' ? '...' : loopConfig.count}]
            </span>
          </div>
        </div>

        {/* Arrow */}
        <div className="flex justify-center mb-4">
          <ArrowDown size={20} className="text-slate-300" />
        </div>

        {/* Loop boundary box */}
        <div className="border-2 border-dashed border-blue-200 rounded-lg p-4 bg-blue-50/30">
          {/* Loop icon */}
          <div className="flex items-center justify-center mb-3">
            <div className="px-3 py-1 bg-blue-100 rounded-full text-xs text-blue-700 font-medium">
              <RefreshCw size={12} className="inline mr-1" />
              for each {itemVarName} in{' '}
              {loopConfig.source?.replace(/\{\{|\}\}/g, '')}
            </div>
          </div>

          {/* Iterations */}
          {iterations ? (
            <div className="space-y-2">
              {displayIterations.map((item, idx) => {
                if ('isEllipsis' in item) {
                  return (
                    <div
                      key="ellipsis"
                      className="flex items-center justify-center py-2 text-slate-400 text-xs"
                    >
                      <MoreHorizontal size={16} />
                      <span className="ml-1">
                        {item.skippedCount} more iteration{item.skippedCount !== 1 ? 's' : ''}
                      </span>
                    </div>
                  );
                }

                const iteration = item as IterationExecution;
                return (
                  <IterationCard
                    key={iteration.index}
                    index={iteration.index}
                    itemValue={iteration.itemValue}
                    status={iteration.status}
                    duration={iteration.duration}
                    childrenCount={iteration.children?.length}
                    itemVarName={itemVarName}
                    onClick={() => {
                      setExpandedIteration(
                        expandedIteration === iteration.index ? null : iteration.index
                      );
                      onIterationClick?.(iteration.index);
                    }}
                    isExpanded={expandedIteration === iteration.index}
                  >
                    {/* Child step execution info */}
                    {iteration.children && iteration.children.length > 0 && (
                      <div className="space-y-1">
                        {iteration.children.map((child) => (
                          <div
                            key={child.stepId}
                            className="flex items-center justify-between px-2 py-1.5 bg-slate-50 rounded text-xs cursor-pointer hover:bg-slate-100"
                            onClick={(e) => {
                              e.stopPropagation();
                              onChildStepClick?.(child.stepId, iteration.index);
                            }}
                          >
                            <span className="text-slate-700">{child.stepName}</span>
                            <StatusBadge status={child.status} />
                          </div>
                        ))}
                      </div>
                    )}
                  </IterationCard>
                );
              })}
            </div>
          ) : (
            /* No execution data - show placeholder */
            <div className="space-y-2">
              {step.children && step.children.length > 0 ? (
                step.children.map((child, idx) => (
                  <div
                    key={child.id}
                    className="flex items-center space-x-2 px-3 py-2 bg-white border border-slate-200 rounded-lg"
                  >
                    <Box size={14} className="text-slate-400" />
                    <span className="text-xs text-slate-600">
                      {child.name || child.summary || `Child Step ${idx + 1}`}
                    </span>
                    <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                      {child.type || 'http'}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center text-slate-400 text-sm py-4">
                  No child steps defined in loop body
                </div>
              )}
            </div>
          )}
        </div>

        {/* Output arrow */}
        <div className="flex justify-center mt-4">
          <ArrowDown size={20} className="text-slate-300" />
        </div>

        {/* Output accumulation indicator */}
        {step.outputs && Object.keys(step.outputs).length > 0 && (
          <div className="flex items-center justify-center mt-4">
            <div className="flex items-center space-x-2 px-3 py-1.5 bg-cyan-50 border border-cyan-200 rounded-lg">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              <span className="text-xs font-mono text-cyan-700">
                Outputs: {Object.values(step.outputs).join(', ')}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoopDataFlow;
