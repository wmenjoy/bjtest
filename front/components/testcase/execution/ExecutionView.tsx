/**
 * ExecutionView - Main execution progress container for test case steps
 *
 * Features:
 * - Overall progress bar display
 * - List of step executions with expand/collapse
 * - Real-time status updates (running spinner, success checkmark, failed X)
 * - Duration display for each step
 * - Expandable variable pool section
 */

import React, { useState, useMemo } from 'react';
import {
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  ChevronDown,
  ChevronRight,
  Ban,
} from 'lucide-react';
import { StepExecution } from '../../../types';
import { StepProgress } from './StepProgress';
import { VariablePool } from './VariablePool';

export interface ExecutionViewProps {
  /** Test case ID being executed */
  testCaseId: string;
  /** Execution run ID */
  runId: string;
  /** Array of step executions */
  steps: StepExecution[];
  /** Overall execution status */
  status: 'pending' | 'running' | 'passed' | 'failed' | 'cancelled';
  /** Current variable pool state */
  variables?: Record<string, any>;
  /** Callback when a step is clicked */
  onStepClick?: (stepId: string) => void;
  /** Recently changed variable names for highlighting */
  highlightedVariables?: string[];
}

/**
 * Calculate overall progress percentage from step executions
 */
const calculateProgress = (steps: StepExecution[]): number => {
  if (steps.length === 0) return 0;

  const completedSteps = steps.filter(
    (step) => step.status === 'passed' || step.status === 'failed' || step.status === 'skipped'
  ).length;

  return Math.round((completedSteps / steps.length) * 100);
};

/**
 * Calculate total duration from step executions
 */
const calculateTotalDuration = (steps: StepExecution[]): number => {
  return steps.reduce((total, step) => total + (step.duration || 0), 0);
};

/**
 * Format duration in milliseconds to human-readable string
 */
const formatDuration = (ms: number): string => {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  const minutes = Math.floor(ms / 60000);
  const seconds = ((ms % 60000) / 1000).toFixed(1);
  return `${minutes}m ${seconds}s`;
};

/**
 * Get status configuration for display
 */
const getStatusConfig = (status: ExecutionViewProps['status']) => {
  switch (status) {
    case 'pending':
      return {
        icon: <Clock size={20} className="text-slate-400" />,
        label: 'Pending',
        color: 'text-slate-400',
        bgColor: 'bg-slate-100',
        progressColor: 'bg-slate-300',
      };
    case 'running':
      return {
        icon: <Loader2 size={20} className="text-blue-600 animate-spin" />,
        label: 'Running',
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        progressColor: 'bg-blue-500',
      };
    case 'passed':
      return {
        icon: <CheckCircle size={20} className="text-green-600" />,
        label: 'Passed',
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        progressColor: 'bg-green-500',
      };
    case 'failed':
      return {
        icon: <XCircle size={20} className="text-red-600" />,
        label: 'Failed',
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        progressColor: 'bg-red-500',
      };
    case 'cancelled':
      return {
        icon: <Ban size={20} className="text-orange-600" />,
        label: 'Cancelled',
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
        progressColor: 'bg-orange-500',
      };
    default:
      return {
        icon: <Clock size={20} className="text-slate-400" />,
        label: 'Unknown',
        color: 'text-slate-400',
        bgColor: 'bg-slate-100',
        progressColor: 'bg-slate-300',
      };
  }
};

export const ExecutionView: React.FC<ExecutionViewProps> = ({
  testCaseId,
  runId,
  steps,
  status,
  variables = {},
  onStepClick,
  highlightedVariables = [],
}) => {
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());
  const [showVariables, setShowVariables] = useState(false);

  // Calculate progress metrics
  const progress = useMemo(() => calculateProgress(steps), [steps]);
  const totalDuration = useMemo(() => calculateTotalDuration(steps), [steps]);
  const statusConfig = useMemo(() => getStatusConfig(status), [status]);

  // Count step statuses
  const stepCounts = useMemo(() => {
    return {
      total: steps.length,
      passed: steps.filter((s) => s.status === 'passed').length,
      failed: steps.filter((s) => s.status === 'failed').length,
      running: steps.filter((s) => s.status === 'running').length,
      pending: steps.filter((s) => s.status === 'pending').length,
      skipped: steps.filter((s) => s.status === 'skipped').length,
    };
  }, [steps]);

  // Toggle step expansion
  const toggleStep = (stepId: string) => {
    setExpandedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(stepId)) {
        next.delete(stepId);
      } else {
        next.add(stepId);
      }
      return next;
    });
  };

  // Handle step click
  const handleStepClick = (stepId: string) => {
    if (onStepClick) {
      onStepClick(stepId);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            {statusConfig.icon}
            <div>
              <h3 className="text-lg font-bold text-slate-800">Execution: {runId}</h3>
              <p className="text-xs text-slate-500 font-mono">Test Case: {testCaseId}</p>
            </div>
          </div>
          <div className={`px-3 py-1.5 rounded-full text-sm font-medium ${statusConfig.bgColor} ${statusConfig.color}`}>
            {statusConfig.label}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600">
              Progress: <span className="font-bold">{progress}%</span>
            </span>
            <span className="text-slate-500">
              Duration: <span className="font-mono font-medium">{formatDuration(totalDuration)}</span>
            </span>
          </div>
          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ease-out ${statusConfig.progressColor}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Step Counts */}
        <div className="flex items-center space-x-4 mt-3 text-xs">
          <span className="text-slate-500">
            Steps: <span className="font-bold">{stepCounts.total}</span>
          </span>
          {stepCounts.passed > 0 && (
            <span className="text-green-600">
              <CheckCircle size={12} className="inline mr-1" />
              {stepCounts.passed} passed
            </span>
          )}
          {stepCounts.failed > 0 && (
            <span className="text-red-600">
              <XCircle size={12} className="inline mr-1" />
              {stepCounts.failed} failed
            </span>
          )}
          {stepCounts.running > 0 && (
            <span className="text-blue-600">
              <Loader2 size={12} className="inline mr-1 animate-spin" />
              {stepCounts.running} running
            </span>
          )}
          {stepCounts.skipped > 0 && (
            <span className="text-slate-400">
              {stepCounts.skipped} skipped
            </span>
          )}
        </div>
      </div>

      {/* Step List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {steps.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <Clock size={48} className="mb-2 opacity-50" />
            <p>No steps to display</p>
          </div>
        ) : (
          steps.map((step) => (
            <StepProgress
              key={step.stepId}
              execution={step}
              depth={0}
              expanded={expandedSteps.has(step.stepId)}
              onToggle={() => toggleStep(step.stepId)}
              onClick={() => handleStepClick(step.stepId)}
            />
          ))
        )}
      </div>

      {/* Variable Pool Section */}
      <div className="border-t border-slate-200">
        <button
          onClick={() => setShowVariables(!showVariables)}
          className="w-full px-4 py-3 flex items-center justify-between text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <span className="flex items-center space-x-2">
            <span>Variable Pool</span>
            <span className="text-xs text-slate-400 font-normal">
              ({Object.keys(variables).length} variables)
            </span>
          </span>
          {showVariables ? (
            <ChevronDown size={16} className="text-slate-400" />
          ) : (
            <ChevronRight size={16} className="text-slate-400" />
          )}
        </button>
        {showVariables && (
          <div className="border-t border-slate-100 max-h-64 overflow-y-auto">
            <VariablePool variables={variables} highlights={highlightedVariables} />
          </div>
        )}
      </div>
    </div>
  );
};
