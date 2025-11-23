import React, { useMemo } from 'react';
import { TestStep, StepExecution } from '../../../types';
import {
  ArrowRight,
  CircleDot,
  Edit3,
  Eye,
  CheckCircle2,
  XCircle,
  Clock
} from 'lucide-react';

/**
 * Represents a point in the variable's journey
 */
interface VariableJourneyPoint {
  stepId: string;
  stepName: string;
  stepIndex: number;
  action: 'created' | 'modified' | 'read' | 'destroyed';
  path?: string; // JSON path where variable was extracted
  value?: any; // Value at this point if known
  timestamp?: string;
  status?: 'passed' | 'failed' | 'pending' | 'running';
}

/**
 * Props for the VariableTracker component
 */
export interface VariableTrackerProps {
  /** The variable name to track */
  variableName: string;
  /** All test steps to analyze */
  steps: TestStep[];
  /** Optional execution data for actual values */
  executionData?: StepExecution[];
  /** Callback when a step in the journey is clicked */
  onStepClick?: (stepId: string) => void;
  /** Whether to show in compact mode */
  compact?: boolean;
}

/**
 * Analyze steps to find variable usage
 */
const analyzeVariableJourney = (
  variableName: string,
  steps: TestStep[],
  executionData?: StepExecution[]
): VariableJourneyPoint[] => {
  const journey: VariableJourneyPoint[] = [];

  const processStep = (step: TestStep, index: number, depth: number = 0) => {
    // Check outputs - variable creation
    if (step.outputs) {
      for (const [path, varName] of Object.entries(step.outputs)) {
        if (varName === variableName) {
          // Find execution data for this step
          const stepExec = executionData?.find((e) => e.stepId === step.id);
          journey.push({
            stepId: step.id,
            stepName: step.name || step.summary || `Step ${index + 1}`,
            stepIndex: index,
            action: journey.length === 0 ? 'created' : 'modified',
            path,
            value: stepExec?.outputs?.[variableName],
            timestamp: stepExec?.startTime,
            status: stepExec?.status as any
          });
        }
      }
    }

    // Check inputs - variable read
    if (step.inputs) {
      for (const [param, varRef] of Object.entries(step.inputs)) {
        // Variable references can be like "{{varName}}" or just "varName"
        const cleanRef = String(varRef).replace(/\{\{|\}\}/g, '').trim();
        if (cleanRef === variableName || cleanRef.startsWith(`${variableName}.`)) {
          const stepExec = executionData?.find((e) => e.stepId === step.id);
          journey.push({
            stepId: step.id,
            stepName: step.name || step.summary || `Step ${index + 1}`,
            stepIndex: index,
            action: 'read',
            path: param,
            value: stepExec?.inputs?.[param],
            timestamp: stepExec?.startTime,
            status: stepExec?.status as any
          });
        }
      }
    }

    // Check config for variable references
    if (step.config) {
      const configStr = JSON.stringify(step.config);
      if (configStr.includes(`{{${variableName}}}`) || configStr.includes(`{{${variableName}.`)) {
        const stepExec = executionData?.find((e) => e.stepId === step.id);
        // Only add if not already added through inputs
        const alreadyAdded = journey.some((j) => j.stepId === step.id && j.action === 'read');
        if (!alreadyAdded) {
          journey.push({
            stepId: step.id,
            stepName: step.name || step.summary || `Step ${index + 1}`,
            stepIndex: index,
            action: 'read',
            value: stepExec?.inputs?.[variableName],
            timestamp: stepExec?.startTime,
            status: stepExec?.status as any
          });
        }
      }
    }

    // Check loop source for forEach loops
    if (step.loop?.type === 'forEach' && step.loop.source) {
      const cleanSource = step.loop.source.replace(/\{\{|\}\}/g, '').trim();
      if (cleanSource === variableName) {
        const stepExec = executionData?.find((e) => e.stepId === step.id);
        journey.push({
          stepId: step.id,
          stepName: step.name || step.summary || `Step ${index + 1}`,
          stepIndex: index,
          action: 'read',
          path: 'loop.source',
          timestamp: stepExec?.startTime,
          status: stepExec?.status as any
        });
      }
    }

    // Process children recursively
    if (step.children) {
      step.children.forEach((child, childIndex) => {
        processStep(child, index * 100 + childIndex, depth + 1);
      });
    }

    // Process branches recursively
    if (step.branches) {
      step.branches.forEach((branch, branchIndex) => {
        branch.children.forEach((child, childIndex) => {
          processStep(child, index * 100 + branchIndex * 10 + childIndex, depth + 1);
        });
      });
    }
  };

  steps.forEach((step, index) => processStep(step, index));

  // Sort by step index
  journey.sort((a, b) => a.stepIndex - b.stepIndex);

  return journey;
};

/**
 * Action icon component
 */
const ActionIcon: React.FC<{ action: VariableJourneyPoint['action'] }> = ({ action }) => {
  switch (action) {
    case 'created':
      return <CircleDot size={16} className="text-green-500" />;
    case 'modified':
      return <Edit3 size={16} className="text-amber-500" />;
    case 'read':
      return <Eye size={16} className="text-blue-500" />;
    case 'destroyed':
      return <XCircle size={16} className="text-red-500" />;
    default:
      return null;
  }
};

/**
 * Status icon component
 */
const StatusIcon: React.FC<{ status?: VariableJourneyPoint['status'] }> = ({ status }) => {
  switch (status) {
    case 'passed':
      return <CheckCircle2 size={12} className="text-green-500" />;
    case 'failed':
      return <XCircle size={12} className="text-red-500" />;
    case 'running':
      return <Clock size={12} className="text-blue-500 animate-pulse" />;
    case 'pending':
      return <Clock size={12} className="text-slate-400" />;
    default:
      return null;
  }
};

/**
 * Format value for display
 */
const formatValue = (value: any, maxLength: number = 50): string => {
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
 * Journey point component
 */
const JourneyPoint: React.FC<{
  point: VariableJourneyPoint;
  isFirst: boolean;
  isLast: boolean;
  onClick?: () => void;
}> = ({ point, isFirst, isLast, onClick }) => {
  const actionLabels: Record<string, string> = {
    created: 'Created',
    modified: 'Modified',
    read: 'Used',
    destroyed: 'Destroyed'
  };

  return (
    <div
      className={`relative flex items-start space-x-3 py-3 px-4 cursor-pointer hover:bg-slate-50 rounded-lg transition-colors ${
        isFirst ? 'pt-0' : ''
      } ${isLast ? 'pb-0' : ''}`}
      onClick={onClick}
    >
      {/* Timeline connector */}
      <div className="absolute left-[26px] top-0 bottom-0 w-0.5 bg-slate-200" />

      {/* Action icon */}
      <div className="relative z-10 flex items-center justify-center w-8 h-8 rounded-full bg-white border-2 border-slate-200 shadow-sm">
        <ActionIcon action={point.action} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-slate-800">{point.stepName}</span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                point.action === 'created'
                  ? 'bg-green-100 text-green-700'
                  : point.action === 'modified'
                  ? 'bg-amber-100 text-amber-700'
                  : point.action === 'read'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-red-100 text-red-700'
              }`}
            >
              {actionLabels[point.action]}
            </span>
          </div>
          <StatusIcon status={point.status} />
        </div>

        {/* Path info */}
        {point.path && (
          <p className="text-xs text-slate-500 mt-1 font-mono">{point.path}</p>
        )}

        {/* Value */}
        {point.value !== undefined && (
          <div className="mt-2 p-2 bg-slate-100 rounded text-xs font-mono text-slate-600 overflow-x-auto">
            {formatValue(point.value, 100)}
          </div>
        )}

        {/* Timestamp */}
        {point.timestamp && (
          <p className="text-[10px] text-slate-400 mt-1">
            {new Date(point.timestamp).toLocaleTimeString()}
          </p>
        )}
      </div>
    </div>
  );
};

/**
 * VariableTracker component - Shows a single variable's journey through test steps
 *
 * Displays:
 * - Timeline view of where variable was created, modified, and read
 * - Actual values at each point (if execution data available)
 * - Step names and execution status
 */
export const VariableTracker: React.FC<VariableTrackerProps> = ({
  variableName,
  steps,
  executionData,
  onStepClick,
  compact = false
}) => {
  const journey = useMemo(
    () => analyzeVariableJourney(variableName, steps, executionData),
    [variableName, steps, executionData]
  );

  if (journey.length === 0) {
    return (
      <div className="p-4 text-center text-slate-400 text-sm">
        Variable "{variableName}" is not used in any step
      </div>
    );
  }

  if (compact) {
    // Compact horizontal view
    return (
      <div className="flex items-center space-x-2 overflow-x-auto py-2 px-4">
        {journey.map((point, index) => (
          <React.Fragment key={`${point.stepId}-${point.action}-${index}`}>
            {index > 0 && <ArrowRight size={14} className="text-slate-300 flex-shrink-0" />}
            <div
              className="flex items-center space-x-1.5 px-2 py-1 bg-slate-100 rounded-full cursor-pointer hover:bg-slate-200 transition-colors flex-shrink-0"
              onClick={() => onStepClick?.(point.stepId)}
            >
              <ActionIcon action={point.action} />
              <span className="text-xs text-slate-600 max-w-[100px] truncate">
                {point.stepName}
              </span>
            </div>
          </React.Fragment>
        ))}
      </div>
    );
  }

  // Full timeline view
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-purple-500" />
          <h3 className="text-sm font-semibold text-slate-800">
            Variable Journey: <code className="text-purple-600">{variableName}</code>
          </h3>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Tracking {journey.length} reference{journey.length !== 1 ? 's' : ''} across steps
        </p>
      </div>

      {/* Timeline */}
      <div className="p-4 pl-6">
        {journey.map((point, index) => (
          <JourneyPoint
            key={`${point.stepId}-${point.action}-${index}`}
            point={point}
            isFirst={index === 0}
            isLast={index === journey.length - 1}
            onClick={() => onStepClick?.(point.stepId)}
          />
        ))}
      </div>

      {/* Summary */}
      <div className="px-4 py-3 border-t border-slate-100 bg-slate-50">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>
            Created in Step {journey.find((j) => j.action === 'created')?.stepIndex ?? '?'}
          </span>
          <span>
            Used {journey.filter((j) => j.action === 'read').length} time
            {journey.filter((j) => j.action === 'read').length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>
    </div>
  );
};

export default VariableTracker;
