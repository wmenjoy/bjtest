import React, { useState } from 'react';
import { ChevronRight, Database } from 'lucide-react';

/**
 * WorkflowStep interface
 * Minimal definition for step data structure
 */
export interface WorkflowStep {
  id: string;
  name?: string;
  type: string;
  config?: Record<string, any>;
  outputs?: Record<string, string>;
  inputs?: Record<string, any>;
  dataMappers?: any[];
  dependsOn?: string[];
  position?: { x: number; y: number };
  [key: string]: any;
}

interface UpstreamOutputTreeProps {
  step: WorkflowStep;
  onDragStart: (sourceStep: string, sourcePath: string) => void;
}

/**
 * UpstreamOutputTree Component
 *
 * Displays outputs from an upstream step in a collapsible tree structure.
 * Users can drag output fields to create data mappings.
 */
export const UpstreamOutputTree: React.FC<UpstreamOutputTreeProps> = ({
  step,
  onDragStart
}) => {
  const [expanded, setExpanded] = useState(false);

  // Get step output structure (from outputs or inferred from template)
  const outputs = getStepOutputs(step);

  return (
    <div className="mb-3">
      {/* Step name (collapsible header) */}
      <div
        className="flex items-center cursor-pointer hover:bg-blue-50 p-2 rounded transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <ChevronRight
          size={14}
          className={`transition-transform ${expanded ? 'rotate-90' : ''}`}
        />
        <span className="ml-2 text-sm font-medium text-slate-700">
          {step.name || step.id}
        </span>
        <span className="ml-auto text-xs text-slate-400">
          {Object.keys(outputs).length} outputs
        </span>
      </div>

      {/* Output fields list (shown when expanded) */}
      {expanded && (
        <div className="ml-6 mt-1 space-y-1">
          {Object.keys(outputs).length === 0 ? (
            <div className="text-xs text-slate-400 italic p-2">
              No outputs defined
            </div>
          ) : (
            Object.entries(outputs).map(([fieldName, fieldType]) => (
              <div
                key={fieldName}
                draggable
                onDragStart={() => onDragStart(step.id, fieldName)}
                className="flex items-center space-x-2 p-2 hover:bg-blue-100 rounded cursor-move transition-colors group"
              >
                <Database size={12} className="text-blue-600" />
                <span className="text-xs font-mono text-slate-700">{fieldName}</span>
                <span className="text-xs text-slate-400">{fieldType || 'any'}</span>
                <span className="ml-auto text-xs text-blue-600 opacity-0 group-hover:opacity-100">
                  Drag →
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Get step output structure
 * Infers outputs from step configuration and type
 */
function getStepOutputs(step: WorkflowStep): Record<string, string> {
  const outputs: Record<string, string> = {};

  // 1. From outputs mapping
  if (step.outputs) {
    Object.values(step.outputs).forEach(varName => {
      if (typeof varName === 'string') {
        outputs[varName] = 'unknown';
      }
    });
  }

  // 2. Infer from config (HTTP response)
  if (step.type === 'http') {
    outputs['response.statusCode'] = 'number';
    outputs['response.body'] = 'object';
    outputs['response.headers'] = 'object';
  }

  // 3. Infer from config (Command)
  if (step.type === 'command') {
    outputs['result.stdout'] = 'string';
    outputs['result.stderr'] = 'string';
    outputs['result.exitCode'] = 'number';
  }

  // 4. Generic output field
  if (Object.keys(outputs).length === 0) {
    outputs['output'] = 'any';
  }

  // TODO: From action template output definitions
  // TODO: From historical execution results

  return outputs;
}

export default UpstreamOutputTree;
