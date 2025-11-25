import React, { useState } from 'react';
import { Target } from 'lucide-react';
import { WorkflowStep } from './UpstreamOutputTree';

interface CurrentInputsListProps {
  step: WorkflowStep;
  onDrop: (targetParam: string) => void;
  isDragging: boolean;
}

/**
 * InputParameter interface
 * Defines the structure of an input parameter
 */
interface InputParameter {
  name: string;
  type: string;
  required: boolean;
  description?: string;
}

/**
 * CurrentInputsList Component
 *
 * Displays the current step's input parameters as drop targets.
 * Users can drop upstream output fields here to create data mappings.
 */
export const CurrentInputsList: React.FC<CurrentInputsListProps> = ({
  step,
  onDrop,
  isDragging
}) => {
  const [dropTarget, setDropTarget] = useState<string | null>(null);

  // Get current step's input parameters
  const inputParams = getCurrentInputParams(step);

  return (
    <div className="space-y-2">
      {inputParams.length === 0 ? (
        <div className="text-center py-8 text-slate-400 text-xs">
          No input parameters defined
        </div>
      ) : (
        inputParams.map(param => (
          <div
            key={param.name}
            className={`p-3 border rounded-lg transition-all ${
              dropTarget === param.name
                ? 'border-blue-400 bg-blue-50 shadow-md'
                : 'border-slate-200 bg-white'
            } ${isDragging ? 'border-dashed' : ''}`}
            onDragOver={(e) => {
              e.preventDefault();
              setDropTarget(param.name);
            }}
            onDragLeave={() => setDropTarget(null)}
            onDrop={(e) => {
              e.preventDefault();
              onDrop(param.name);
              setDropTarget(null);
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Target size={14} className="text-slate-400" />
                <span className="text-sm font-mono text-slate-700">
                  {param.name}
                </span>
                {param.required && (
                  <span className="text-red-500 text-xs">*</span>
                )}
              </div>
              <span className="text-xs text-slate-400">{param.type}</span>
            </div>
            {param.description && (
              <p className="text-xs text-slate-500 mt-1">{param.description}</p>
            )}
            {isDragging && dropTarget === param.name && (
              <div className="mt-2 text-xs text-blue-600 font-medium">
                Drop here to create mapping
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
};

/**
 * Get input parameter definitions for the current step
 * Infers parameters from step type and configuration
 */
function getCurrentInputParams(step: WorkflowStep): InputParameter[] {
  const params: InputParameter[] = [];

  // 1. From inputs field
  if (step.inputs) {
    Object.keys(step.inputs).forEach(name => {
      params.push({
        name,
        type: 'any',
        required: false,
        description: undefined
      });
    });
  }

  // 2. Infer from config (HTTP)
  if (step.type === 'http' && step.config) {
    if (!params.find(p => p.name === 'url')) {
      params.push({
        name: 'url',
        type: 'string',
        required: true,
        description: 'Request URL'
      });
    }
    if (!params.find(p => p.name === 'method')) {
      params.push({
        name: 'method',
        type: 'string',
        required: false,
        description: 'HTTP method (GET, POST, etc.)'
      });
    }
    if (!params.find(p => p.name === 'body')) {
      params.push({
        name: 'body',
        type: 'object',
        required: false,
        description: 'Request body'
      });
    }
    if (!params.find(p => p.name === 'headers')) {
      params.push({
        name: 'headers',
        type: 'object',
        required: false,
        description: 'HTTP headers'
      });
    }
  }

  // 3. Infer from config (Command)
  if (step.type === 'command' && step.config) {
    if (!params.find(p => p.name === 'command')) {
      params.push({
        name: 'command',
        type: 'string',
        required: true,
        description: 'Command to execute'
      });
    }
    if (!params.find(p => p.name === 'args')) {
      params.push({
        name: 'args',
        type: 'array',
        required: false,
        description: 'Command arguments'
      });
    }
  }

  // TODO: From Action Template parameter definitions
  // TODO: From workflow step schema

  return params;
}

export default CurrentInputsList;
