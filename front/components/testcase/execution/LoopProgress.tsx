/**
 * LoopProgress - Loop execution progress display
 *
 * Features:
 * - Progress indicator: "Iteration 3/10"
 * - Mini progress bar for iterations
 * - Expandable list of IterationCard components
 * - Statistics: passed/failed/skipped counts
 * - Exit reason display if loop terminated early
 */

import React from 'react';
import {
  Repeat,
  CheckCircle,
  XCircle,
  SkipForward,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { LoopExecution } from '../../../types';
import { IterationCard } from './IterationCard';

export interface LoopProgressProps {
  /** Loop execution data */
  loopExecution: LoopExecution;
  /** Callback when an iteration is clicked */
  onIterationClick?: (index: number) => void;
  /** Set of expanded iteration indices */
  expandedIterations?: Set<number>;
}

/**
 * Calculate iteration statistics
 */
const calculateStats = (loopExecution: LoopExecution) => {
  const iterations = loopExecution.iterations || [];
  return {
    total: loopExecution.totalIterations,
    completed: iterations.length,
    passed: iterations.filter((i) => i.status === 'passed').length,
    failed: iterations.filter((i) => i.status === 'failed').length,
    skipped: iterations.filter((i) => i.status === 'skipped').length,
  };
};

/**
 * Calculate progress percentage
 */
const calculateProgress = (loopExecution: LoopExecution): number => {
  if (loopExecution.totalIterations === 0) return 0;
  const completed = (loopExecution.iterations || []).length;
  return Math.round((completed / loopExecution.totalIterations) * 100);
};

export const LoopProgress: React.FC<LoopProgressProps> = ({
  loopExecution,
  onIterationClick,
  expandedIterations = new Set(),
}) => {
  const stats = calculateStats(loopExecution);
  const progress = calculateProgress(loopExecution);
  const isComplete = stats.completed === stats.total;
  const hasFailures = stats.failed > 0;

  // Determine if loop exited early
  const exitedEarly = stats.completed < stats.total && isComplete === false && loopExecution.iterations && loopExecution.iterations.length > 0;

  return (
    <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2 text-orange-700 text-sm font-medium">
          <Repeat size={14} />
          <span>Loop Progress</span>
        </div>
        <div className="text-sm font-mono">
          <span className="text-orange-600 font-bold">
            {loopExecution.currentIteration + 1}
          </span>
          <span className="text-orange-400"> / </span>
          <span className="text-orange-600">{stats.total}</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="h-2 bg-orange-200 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ease-out ${
              hasFailures ? 'bg-red-500' : 'bg-orange-500'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between mt-1 text-[10px] text-orange-500">
          <span>{progress}% complete</span>
          {!isComplete && (
            <span className="animate-pulse">Running...</span>
          )}
        </div>
      </div>

      {/* Statistics */}
      <div className="flex items-center space-x-4 mb-3 text-xs">
        {stats.passed > 0 && (
          <span className="flex items-center space-x-1 text-green-600">
            <CheckCircle size={12} />
            <span>{stats.passed} passed</span>
          </span>
        )}
        {stats.failed > 0 && (
          <span className="flex items-center space-x-1 text-red-600">
            <XCircle size={12} />
            <span>{stats.failed} failed</span>
          </span>
        )}
        {stats.skipped > 0 && (
          <span className="flex items-center space-x-1 text-slate-500">
            <SkipForward size={12} />
            <span>{stats.skipped} skipped</span>
          </span>
        )}
      </div>

      {/* Exit Reason (if loop terminated early) */}
      {exitedEarly && (
        <div className="mb-3 p-2 bg-amber-100 border border-amber-300 rounded text-xs text-amber-700">
          Loop terminated early at iteration {stats.completed} of {stats.total}
        </div>
      )}

      {/* Iterations List */}
      {loopExecution.iterations && loopExecution.iterations.length > 0 && (
        <div className="space-y-2 mt-3 border-t border-orange-200 pt-3">
          <div className="text-[10px] text-orange-500 uppercase font-bold mb-2">
            Iterations
          </div>
          {loopExecution.iterations.map((iteration, idx) => (
            <IterationCard
              key={idx}
              iteration={iteration}
              index={idx}
              expanded={expandedIterations.has(idx)}
              onToggle={() => onIterationClick?.(idx)}
            />
          ))}

          {/* Pending iterations indicator */}
          {stats.completed < stats.total && (
            <div className="flex items-center space-x-2 p-2 bg-orange-100/50 rounded text-xs text-orange-500 italic">
              <span className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" />
              <span>{stats.total - stats.completed} iterations pending...</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
