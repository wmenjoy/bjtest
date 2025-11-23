/**
 * StepProgress - Single step execution progress display
 *
 * Features:
 * - Status icon with animations (pending, running, passed, failed, skipped)
 * - Step name and type badge
 * - Duration display
 * - Expandable details showing inputs/outputs/request/response
 * - Loop progress display via LoopProgress component
 * - Branch selection highlight via BranchVisualization component
 * - Nested child step support for recursive display
 */

import React, { useState } from 'react';
import {
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  ChevronDown,
  ChevronRight,
  SkipForward,
  Globe,
  Terminal,
  GitBranch,
  Repeat,
  AlertCircle,
} from 'lucide-react';
import { StepExecution } from '../../../types';
import { LoopProgress } from './LoopProgress';
import { BranchVisualization } from './BranchVisualization';

export interface StepProgressProps {
  /** Step execution data */
  execution: StepExecution;
  /** Nesting depth for indentation */
  depth?: number;
  /** Whether details are expanded */
  expanded?: boolean;
  /** Toggle expansion callback */
  onToggle?: () => void;
  /** Click callback */
  onClick?: () => void;
}

/**
 * Get status icon and styling configuration
 */
const getStatusConfig = (status: StepExecution['status']) => {
  switch (status) {
    case 'pending':
      return {
        icon: <Clock size={16} className="text-slate-400" />,
        emoji: '',
        label: 'Pending',
        textColor: 'text-slate-500',
        bgColor: 'bg-slate-50',
        borderColor: 'border-slate-200',
      };
    case 'running':
      return {
        icon: <Loader2 size={16} className="text-blue-600 animate-spin" />,
        emoji: '',
        label: 'Running',
        textColor: 'text-blue-600',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
      };
    case 'passed':
      return {
        icon: <CheckCircle size={16} className="text-green-600" />,
        emoji: '',
        label: 'Passed',
        textColor: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
      };
    case 'failed':
      return {
        icon: <XCircle size={16} className="text-red-600" />,
        emoji: '',
        label: 'Failed',
        textColor: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
      };
    case 'skipped':
      return {
        icon: <SkipForward size={16} className="text-slate-400" />,
        emoji: '',
        label: 'Skipped',
        textColor: 'text-slate-400',
        bgColor: 'bg-slate-50',
        borderColor: 'border-slate-200',
      };
    default:
      return {
        icon: <Clock size={16} className="text-slate-400" />,
        emoji: '',
        label: 'Unknown',
        textColor: 'text-slate-400',
        bgColor: 'bg-slate-50',
        borderColor: 'border-slate-200',
      };
  }
};

/**
 * Detect step type from execution data
 */
const getStepType = (execution: StepExecution): { icon: React.ReactNode; label: string; color: string } | null => {
  if (execution.httpRequest || execution.httpResponse) {
    return {
      icon: <Globe size={12} />,
      label: 'HTTP',
      color: 'bg-blue-100 text-blue-700 border-blue-200',
    };
  }
  if (execution.branch) {
    return {
      icon: <GitBranch size={12} />,
      label: 'Branch',
      color: 'bg-amber-100 text-amber-700 border-amber-200',
    };
  }
  if (execution.loop) {
    return {
      icon: <Repeat size={12} />,
      label: 'Loop',
      color: 'bg-orange-100 text-orange-700 border-orange-200',
    };
  }
  return null;
};

/**
 * Format duration to human-readable string
 */
const formatDuration = (ms?: number): string => {
  if (ms === undefined || ms === null) return '-';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
};

/**
 * Render JSON value with syntax highlighting
 */
const JsonValue: React.FC<{ value: any; maxLength?: number }> = ({ value, maxLength = 100 }) => {
  const stringified = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
  const truncated = stringified.length > maxLength ? `${stringified.slice(0, maxLength)}...` : stringified;

  return (
    <pre className="text-xs font-mono bg-slate-800 text-slate-200 p-2 rounded overflow-x-auto max-h-32 overflow-y-auto">
      {truncated}
    </pre>
  );
};

export const StepProgress: React.FC<StepProgressProps> = ({
  execution,
  depth = 0,
  expanded = false,
  onToggle,
  onClick,
}) => {
  const [localExpanded, setLocalExpanded] = useState(expanded);
  const [expandedIterations, setExpandedIterations] = useState<Set<number>>(new Set());

  const isExpanded = onToggle ? expanded : localExpanded;
  const toggleExpanded = onToggle || (() => setLocalExpanded(!localExpanded));

  const statusConfig = getStatusConfig(execution.status);
  const stepType = getStepType(execution);
  const hasDetails =
    execution.inputs ||
    execution.outputs ||
    execution.httpRequest ||
    execution.httpResponse ||
    execution.error ||
    execution.loop ||
    execution.branch ||
    (execution.children && execution.children.length > 0);

  // Calculate indentation based on depth
  const indentStyle = {
    marginLeft: `${depth * 24}px`,
  };

  const toggleIterationExpanded = (index: number) => {
    setExpandedIterations((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  return (
    <div style={indentStyle} className="animate-fade-in">
      {/* Step Header */}
      <div
        className={`flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer hover:shadow-sm ${statusConfig.bgColor} ${statusConfig.borderColor}`}
        onClick={() => {
          if (hasDetails) toggleExpanded();
          if (onClick) onClick();
        }}
      >
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          {/* Expand/Collapse Icon */}
          {hasDetails ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleExpanded();
              }}
              className="shrink-0 p-0.5 hover:bg-white/50 rounded"
            >
              {isExpanded ? (
                <ChevronDown size={14} className="text-slate-500" />
              ) : (
                <ChevronRight size={14} className="text-slate-500" />
              )}
            </button>
          ) : (
            <div className="w-5" />
          )}

          {/* Status Icon */}
          <div className="shrink-0">{statusConfig.icon}</div>

          {/* Step Name */}
          <div className="flex items-center space-x-2 min-w-0 flex-1">
            <span className={`font-medium truncate ${statusConfig.textColor}`}>
              {execution.stepName || execution.stepId}
            </span>

            {/* Type Badge */}
            {stepType && (
              <span className={`shrink-0 inline-flex items-center space-x-1 px-2 py-0.5 text-[10px] font-medium rounded-full border ${stepType.color}`}>
                {stepType.icon}
                <span>{stepType.label}</span>
              </span>
            )}
          </div>
        </div>

        {/* Duration */}
        <div className="shrink-0 ml-3 text-xs font-mono text-slate-500">
          {formatDuration(execution.duration)}
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && hasDetails && (
        <div className="mt-2 ml-6 space-y-3">
          {/* Error Message */}
          {execution.error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center space-x-2 text-red-700 text-sm font-medium mb-1">
                <AlertCircle size={14} />
                <span>Error</span>
              </div>
              <p className="text-red-600 text-xs font-mono">{execution.error}</p>
            </div>
          )}

          {/* HTTP Request Details */}
          {execution.httpRequest && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <div className="flex items-center space-x-2 text-slate-700 text-sm font-medium mb-2">
                <Globe size={14} />
                <span>Request</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-bold rounded">
                    {execution.httpRequest.method}
                  </span>
                  <span className="text-xs font-mono text-slate-600 truncate">
                    {execution.httpRequest.url}
                  </span>
                </div>
                {execution.httpRequest.headers && Object.keys(execution.httpRequest.headers).length > 0 && (
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold">Headers</span>
                    <JsonValue value={execution.httpRequest.headers} />
                  </div>
                )}
                {execution.httpRequest.body && (
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold">Body</span>
                    <JsonValue value={execution.httpRequest.body} />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* HTTP Response Details */}
          {execution.httpResponse && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2 text-slate-700 text-sm font-medium">
                  <Globe size={14} />
                  <span>Response</span>
                </div>
                <div className="flex items-center space-x-2 text-xs">
                  <span
                    className={`px-2 py-0.5 rounded font-bold ${
                      execution.httpResponse.statusCode >= 200 && execution.httpResponse.statusCode < 300
                        ? 'bg-green-100 text-green-700'
                        : execution.httpResponse.statusCode >= 400
                        ? 'bg-red-100 text-red-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}
                  >
                    {execution.httpResponse.statusCode}
                  </span>
                  <span className="text-slate-500 font-mono">
                    {execution.httpResponse.responseTime}ms
                  </span>
                </div>
              </div>
              {execution.httpResponse.body && (
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Body</span>
                  <JsonValue value={execution.httpResponse.body} maxLength={500} />
                </div>
              )}
            </div>
          )}

          {/* Inputs */}
          {execution.inputs && Object.keys(execution.inputs).length > 0 && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-[10px] text-slate-500 uppercase font-bold block mb-2">Inputs</span>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(execution.inputs).map(([key, value]) => (
                  <div key={key} className="text-xs">
                    <span className="text-slate-500">{key}:</span>
                    <span className="text-blue-600 font-mono ml-1">
                      {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Outputs */}
          {execution.outputs && Object.keys(execution.outputs).length > 0 && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-[10px] text-slate-500 uppercase font-bold block mb-2">Outputs</span>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(execution.outputs).map(([key, value]) => (
                  <div key={key} className="text-xs">
                    <span className="text-slate-500">{key}:</span>
                    <span className="text-cyan-600 font-mono ml-1">
                      {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Loop Progress */}
          {execution.loop && (
            <LoopProgress
              loopExecution={execution.loop}
              onIterationClick={(index) => toggleIterationExpanded(index)}
              expandedIterations={expandedIterations}
            />
          )}

          {/* Branch Visualization */}
          {execution.branch && <BranchVisualization branchExecution={execution.branch} />}

          {/* Child Steps (non-loop, non-branch children) */}
          {execution.children && execution.children.length > 0 && !execution.loop && (
            <div className="space-y-2 border-l-2 border-slate-200 pl-3">
              {execution.children.map((child) => (
                <StepProgress
                  key={child.stepId}
                  execution={child}
                  depth={0}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
