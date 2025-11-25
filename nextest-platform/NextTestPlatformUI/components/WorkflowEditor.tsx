import React, { useState, useMemo } from 'react';
import { WorkflowStep } from '../types';
import { AlertTriangle, List, Network } from 'lucide-react';

interface WorkflowEditorProps {
  steps: WorkflowStep[];
  onChange: (steps: WorkflowStep[]) => void;
  readonly?: boolean;
}

/**
 * WorkflowEditor Component
 *
 * Unified workflow editor with dual-mode support:
 * - Simple Mode: List-based editor for linear workflows
 * - Advanced Mode: DAG-based editor for complex parallel/branching workflows
 *
 * Automatically detects workflow complexity and suggests appropriate mode.
 */
export const WorkflowEditor: React.FC<WorkflowEditorProps> = ({
  steps,
  onChange,
  readonly = false
}) => {
  const [mode, setMode] = useState<'simple' | 'advanced'>('simple');

  /**
   * Auto-detect if workflow requires advanced mode
   * Complex workflows include:
   * - Steps with dependencies (DAG structure)
   * - Conditional branches
   * - Loop constructs
   * - Merge nodes
   */
  const needsAdvancedMode = useMemo(() => {
    return steps.some(step =>
      (step.dependsOn && step.dependsOn.length > 0) ||  // DAG dependencies
      (step.children && step.children.length > 0) ||    // Conditional branches (then)
      (step.elseChildren && step.elseChildren.length > 0) || // Conditional branches (else)
      step.loopOver !== undefined ||                    // Loop over collection
      step.loopCondition !== undefined ||               // While loop
      step.when !== undefined                           // Conditional execution
    );
  }, [steps]);

  /**
   * Detect parallel execution patterns
   */
  const hasParallelSteps = useMemo(() => {
    return steps.some(step =>
      step.dependsOn && step.dependsOn.length > 1
    );
  }, [steps]);

  /**
   * Detect loop patterns
   */
  const hasLoops = useMemo(() => {
    return steps.some(step =>
      step.loopOver !== undefined || step.loopCondition !== undefined
    );
  }, [steps]);

  /**
   * Detect conditional branches
   */
  const hasBranches = useMemo(() => {
    return steps.some(step =>
      (step.children && step.children.length > 0) ||
      (step.elseChildren && step.elseChildren.length > 0) ||
      step.when !== undefined
    );
  }, [steps]);

  return (
    <div className="workflow-editor h-full flex flex-col bg-slate-50">
      {/* Mode switching toolbar */}
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200 shadow-sm">
        <div className="flex items-center space-x-3">
          <h2 className="text-lg font-bold text-slate-800">Workflow Editor</h2>
          <span className="text-sm text-slate-500">
            {steps.length} step{steps.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Mode toggle buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setMode('simple')}
            disabled={readonly}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
              mode === 'simple'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            } ${readonly ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <List size={16} />
            <span>Simple Mode</span>
          </button>
          <button
            onClick={() => setMode('advanced')}
            disabled={readonly}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
              mode === 'advanced'
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            } ${readonly ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Network size={16} />
            <span>Advanced Mode (DAG)</span>
          </button>
        </div>
      </div>

      {/* Complexity warning banner */}
      {needsAdvancedMode && mode === 'simple' && (
        <div className="mx-6 mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-start space-x-3">
            <AlertTriangle size={20} className="text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-amber-800 mb-1">
                Complex workflow detected
              </h3>
              <p className="text-sm text-amber-700">
                This workflow contains{' '}
                {hasParallelSteps && 'parallel execution, '}
                {hasBranches && 'conditional branches, '}
                {hasLoops && 'loops, '}
                which are better visualized in Advanced Mode.
              </p>
              <button
                onClick={() => setMode('advanced')}
                className="mt-2 text-sm font-medium text-amber-800 underline hover:text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-1 rounded"
              >
                Switch to Advanced Mode →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Editor content area */}
      <div className="flex-1 overflow-hidden">
        {mode === 'simple' ? (
          <SimpleListEditor steps={steps} onChange={onChange} readonly={readonly} />
        ) : (
          <AdvancedDAGEditor steps={steps} onChange={onChange} readonly={readonly} />
        )}
      </div>

      {/* Status bar */}
      <div className="px-6 py-2 bg-white border-t border-slate-200 text-xs text-slate-500">
        <div className="flex items-center justify-between">
          <div>
            Mode: <span className="font-medium text-slate-700">
              {mode === 'simple' ? 'Simple List' : 'Advanced DAG'}
            </span>
          </div>
          <div className="flex items-center space-x-4">
            {needsAdvancedMode && (
              <span className="text-amber-600 flex items-center space-x-1">
                <AlertTriangle size={12} />
                <span>Complex flow</span>
              </span>
            )}
            <span>
              Steps: <span className="font-medium text-slate-700">{steps.length}</span>
            </span>
            {hasParallelSteps && (
              <span className="text-blue-600 flex items-center space-x-1">
                <Network size={12} />
                <span>Parallel</span>
              </span>
            )}
            {hasBranches && (
              <span className="text-purple-600">Conditional</span>
            )}
            {hasLoops && (
              <span className="text-green-600">Loops</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * SimpleListEditor - Placeholder for Task 3.2
 * List-based editor for linear workflows
 */
const SimpleListEditor: React.FC<{
  steps: WorkflowStep[];
  onChange: (steps: WorkflowStep[]) => void;
  readonly?: boolean;
}> = ({ steps, readonly }) => {
  return (
    <div className="h-full flex items-center justify-center p-6">
      <div className="text-center space-y-3 max-w-md">
        <List size={48} className="mx-auto text-slate-300" />
        <h3 className="text-lg font-semibold text-slate-700">Simple List Editor</h3>
        <p className="text-sm text-slate-500">
          List-based workflow editor for linear step sequences.
          <br />
          <span className="text-xs text-slate-400 mt-2 block">
            (To be implemented in Task 3.2)
          </span>
        </p>
        {!readonly && steps.length === 0 && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700">
            Click "Add Step" to create your first workflow step
          </div>
        )}
        {steps.length > 0 && (
          <div className="mt-4 text-sm text-slate-600">
            Current steps: {steps.length}
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * AdvancedDAGEditor - Placeholder for Task 3.3
 * DAG-based visual editor for complex workflows
 */
const AdvancedDAGEditor: React.FC<{
  steps: WorkflowStep[];
  onChange: (steps: WorkflowStep[]) => void;
  readonly?: boolean;
}> = ({ steps, readonly }) => {
  return (
    <div className="h-full flex items-center justify-center p-6">
      <div className="text-center space-y-3 max-w-md">
        <Network size={48} className="mx-auto text-slate-300" />
        <h3 className="text-lg font-semibold text-slate-700">Advanced DAG Editor</h3>
        <p className="text-sm text-slate-500">
          Visual DAG editor for complex workflows with parallel execution,
          conditional branching, and loops.
          <br />
          <span className="text-xs text-slate-400 mt-2 block">
            (To be implemented in Task 3.3)
          </span>
        </p>
        {!readonly && steps.length === 0 && (
          <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded text-sm text-purple-700">
            Start by adding nodes to build your workflow graph
          </div>
        )}
        {steps.length > 0 && (
          <div className="mt-4 space-y-2">
            <div className="text-sm text-slate-600">
              Current steps: {steps.length}
            </div>
            <div className="text-xs text-slate-500">
              Dependencies: {steps.filter(s => s.dependsOn?.length).length} steps
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
