import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { WorkflowStep } from '../../../types';
import { Globe, Terminal, GitBranch, Repeat, CheckCircle, AlertCircle, Layers } from 'lucide-react';

interface ReactFlowStepNodeData {
  step: WorkflowStep;
  inputs: string[];
  outputs: string[];
}

/**
 * ReactFlowStepNode - Visual node component for React Flow drag-drop editor
 *
 * This is different from the existing StepNode used in DataFlowDiagram.
 * This component is specifically designed for React Flow's interactive editing.
 *
 * Features:
 * - Left handles for input parameters (purple)
 * - Right handles for output variables (cyan)
 * - Color-coded by step type
 * - Shows parameter/output counts
 * - Interactive hover states
 */
export const ReactFlowStepNode = memo<NodeProps<ReactFlowStepNodeData>>(({ data, selected }) => {
  const { step, inputs, outputs } = data;

  // Get step icon based on type
  const getStepIcon = () => {
    if (step.type === 'http' || step.config?.method) {
      return <Globe size={16} className="text-blue-600" />;
    }
    if (step.type === 'command' || step.config?.command) {
      return <Terminal size={16} className="text-amber-600" />;
    }
    if (step.type === 'branch' || step.condition) {
      return <GitBranch size={16} className="text-purple-600" />;
    }
    if (step.type === 'loop') {
      return <Repeat size={16} className="text-orange-600" />;
    }
    if (step.type === 'assertion') {
      return <CheckCircle size={16} className="text-green-600" />;
    }
    if (step.type === 'group') {
      return <Layers size={16} className="text-indigo-600" />;
    }
    return <AlertCircle size={16} className="text-slate-600" />;
  };

  // Get step type label
  const getStepTypeLabel = () => {
    if (step.type === 'http') return 'HTTP';
    if (step.type === 'command') return 'Command';
    if (step.type === 'branch') return 'Branch';
    if (step.type === 'loop') return 'Loop';
    if (step.type === 'assertion') return 'Assert';
    if (step.type === 'merge') return 'Merge';
    if (step.type === 'group') return 'Group';
    return 'Step';
  };

  // Get node background color based on type
  const getNodeColor = () => {
    if (step.type === 'http') return 'bg-blue-50 border-blue-300';
    if (step.type === 'command') return 'bg-amber-50 border-amber-300';
    if (step.type === 'branch') return 'bg-purple-50 border-purple-300';
    if (step.type === 'loop') return 'bg-orange-50 border-orange-300';
    if (step.type === 'assertion') return 'bg-green-50 border-green-300';
    if (step.type === 'merge') return 'bg-cyan-50 border-cyan-300';
    if (step.type === 'group') return 'bg-indigo-50 border-indigo-300';
    return 'bg-slate-50 border-slate-300';
  };

  // Calculate handle positions (evenly distributed)
  const getHandleStyle = (index: number, total: number) => {
    if (total === 0) return { top: '50%' };
    if (total === 1) return { top: '50%' };

    const spacing = 100 / (total + 1);
    return { top: `${spacing * (index + 1)}%` };
  };

  return (
    <div
      className={`
        px-4 py-3 rounded-lg border-2 shadow-md min-w-[240px] max-w-[320px]
        transition-all bg-white
        ${getNodeColor()}
        ${selected ? 'ring-2 ring-blue-500 ring-offset-2 shadow-xl scale-105' : 'hover:shadow-lg'}
      `}
    >
      {/* Input Handles (Left Side) */}
      {inputs.map((input, index) => (
        <React.Fragment key={`input-${input}`}>
          <Handle
            type="target"
            position={Position.Left}
            id={`input-${input}`}
            style={getHandleStyle(index, inputs.length)}
            className="w-3 h-3 bg-purple-500 border-2 border-white hover:scale-150 transition-transform cursor-crosshair"
          />
          {/* Input label - only show on hover */}
          <div
            className="absolute left-0 -translate-x-full pr-2 text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-md opacity-0 hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap font-mono"
            style={getHandleStyle(index, inputs.length)}
          >
            {input}
          </div>
        </React.Fragment>
      ))}

      {/* Node Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center space-x-2 flex-1 min-w-0">
          {getStepIcon()}
          <span className="font-semibold text-slate-800 text-sm truncate" title={step.name || step.summary}>
            {step.name || step.summary || `Step ${step.id}`}
          </span>
        </div>
        <span className="text-[10px] px-2 py-1 rounded-full bg-white border border-current text-slate-600 ml-2 font-medium whitespace-nowrap">
          {getStepTypeLabel()}
        </span>
      </div>

      {/* Step Description (if available) */}
      {step.instruction && (
        <p className="text-xs text-slate-600 mb-2 line-clamp-2" title={step.instruction}>
          {step.instruction}
        </p>
      )}

      {/* HTTP Method and URL (for HTTP steps) */}
      {(step.type === 'http' || step.config?.method) && step.config?.url && (
        <div className="mb-2 text-xs bg-slate-100 rounded px-2 py-1 font-mono truncate" title={step.config.url}>
          <span className="font-bold text-blue-600">{step.config.method || 'GET'}</span>
          <span className="text-slate-600 ml-1">{step.config.url}</span>
        </div>
      )}

      {/* Step Details */}
      <div className="mt-3 pt-3 border-t border-slate-200 grid grid-cols-2 gap-2 text-xs">
        <div>
          <span className="text-slate-500 font-medium block mb-1">Inputs:</span>
          <div className="flex items-center space-x-1">
            <span className={`font-semibold ${inputs.length > 0 ? 'text-purple-600' : 'text-slate-400'}`}>
              {inputs.length}
            </span>
            {inputs.length > 0 && <span className="w-2 h-2 rounded-full bg-purple-400" />}
          </div>
        </div>
        <div>
          <span className="text-slate-500 font-medium block mb-1">Outputs:</span>
          <div className="flex items-center space-x-1">
            <span className={`font-semibold ${outputs.length > 0 ? 'text-cyan-600' : 'text-slate-400'}`}>
              {outputs.length}
            </span>
            {outputs.length > 0 && <span className="w-2 h-2 rounded-full bg-cyan-400" />}
          </div>
        </div>
      </div>

      {/* Output Handles (Right Side) */}
      {outputs.map((output, index) => (
        <React.Fragment key={`output-${output}`}>
          <Handle
            type="source"
            position={Position.Right}
            id={`output-${output}`}
            style={getHandleStyle(index, outputs.length)}
            className="w-3 h-3 bg-cyan-500 border-2 border-white hover:scale-150 transition-transform cursor-crosshair"
          />
          {/* Output label - only show on hover */}
          <div
            className="absolute right-0 translate-x-full pl-2 text-xs bg-cyan-100 text-cyan-700 px-2 py-1 rounded-md opacity-0 hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap font-mono"
            style={getHandleStyle(index, outputs.length)}
          >
            {output}
          </div>
        </React.Fragment>
      ))}

      {/* Step ID Badge */}
      <div className="absolute -top-2 -left-2 bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold shadow-md">
        {step.id}
      </div>

      {/* Dependency indicator */}
      {step.dependsOn && step.dependsOn.length > 0 && (
        <div className="absolute -bottom-1 -right-1 bg-purple-600 text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold shadow-md">
          {step.dependsOn.length} deps
        </div>
      )}
    </div>
  );
});

ReactFlowStepNode.displayName = 'ReactFlowStepNode';

// Export as default for React Flow nodeTypes
export default ReactFlowStepNode;
