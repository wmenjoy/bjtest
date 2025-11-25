import React, { useState } from 'react';
import { WorkflowStep } from '../../../types';
import { Bot, Workflow, ArrowDown, Globe, Terminal, GitBranch, Repeat } from 'lucide-react';

interface WorkflowViewProps {
  steps: WorkflowStep[];
  onStepClick?: (step: WorkflowStep) => void;
}

interface WorkflowNodeProps {
  step: WorkflowStep;
  index: number;
  isLast: boolean;
  onClick?: (step: WorkflowStep) => void;
}

const WorkflowNode: React.FC<WorkflowNodeProps> = ({ step, index, isLast, onClick }) => {
  const getStepIcon = () => {
    if (step.linkedWorkflowId) {
      return <Workflow size={16} className="text-indigo-600" />;
    }
    if (step.type === 'http' || step.parameterValues?.method) {
      return <Globe size={16} className="text-blue-600" />;
    }
    if (step.type === 'command' || step.parameterValues?.command) {
      return <Terminal size={16} className="text-amber-600" />;
    }
    if (step.type === 'branch' || step.condition) {
      return <GitBranch size={16} className="text-purple-600" />;
    }
    if (step.type === 'loop' || step.loopOver) {
      return <Repeat size={16} className="text-orange-600" />;
    }
    return <Bot size={16} className="text-slate-600" />;
  };

  const getStepTypeLabel = () => {
    if (step.linkedWorkflowId) return 'Workflow';
    if (step.type === 'http' || step.parameterValues?.method) return 'HTTP';
    if (step.type === 'command' || step.parameterValues?.command) return 'Command';
    if (step.type === 'branch' || step.condition) return 'Branch';
    if (step.type === 'loop' || step.loopOver) return 'Loop';
    return 'Manual';
  };

  const getStepColor = () => {
    if (step.linkedWorkflowId) return 'border-indigo-200 bg-indigo-50';
    if (step.type === 'http' || step.parameterValues?.method) return 'border-blue-200 bg-blue-50';
    if (step.type === 'command' || step.parameterValues?.command) return 'border-amber-200 bg-amber-50';
    if (step.type === 'branch' || step.condition) return 'border-purple-200 bg-purple-50';
    if (step.type === 'loop' || step.loopOver) return 'border-orange-200 bg-orange-50';
    return 'border-slate-200 bg-slate-50';
  };

  return (
    <div className="flex flex-col items-center">
      {/* Step Node */}
      <div
        onClick={() => onClick?.(step)}
        className={`
          relative w-80 border-2 rounded-lg p-4 bg-white shadow-sm transition-all
          ${getStepColor()}
          ${onClick ? 'cursor-pointer hover:shadow-md hover:scale-105' : ''}
        `}
      >
        {/* Step Number Badge */}
        <div className="absolute -top-3 -left-3 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-md">
          {index + 1}
        </div>

        {/* Step Header */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center space-x-2 flex-1">
            {getStepIcon()}
            <span className="font-semibold text-slate-800 text-sm line-clamp-2">
              {step.summary || step.name || `Step ${index + 1}`}
            </span>
          </div>
          <span className="text-xs px-2 py-1 rounded-full bg-white border border-current text-slate-600 ml-2">
            {getStepTypeLabel()}
          </span>
        </div>

        {/* Step Details */}
        {step.instruction && (
          <p className="text-xs text-slate-600 mb-2 line-clamp-2">{step.instruction}</p>
        )}

        {/* Condition/Loop Indicators */}
        <div className="flex items-center space-x-2 mt-2">
          {step.condition && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700 border border-amber-200">
              <GitBranch size={10} className="mr-1" /> If: {step.condition}
            </span>
          )}
          {step.loopOver && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-700 border border-orange-200">
              <Repeat size={10} className="mr-1" /> Loop: {step.loopOver}
            </span>
          )}
        </div>

        {/* Input/Output Summary */}
        <div className="mt-3 pt-3 border-t border-slate-200 grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-slate-500 font-medium block mb-1">Inputs:</span>
            {step.parameterValues && Object.keys(step.parameterValues).length > 0 ? (
              <span className="text-blue-600">{Object.keys(step.parameterValues).length} params</span>
            ) : (
              <span className="text-slate-400 italic">None</span>
            )}
          </div>
          <div>
            <span className="text-slate-500 font-medium block mb-1">Outputs:</span>
            {step.outputMapping && Object.keys(step.outputMapping).length > 0 ? (
              <span className="text-cyan-600">{Object.keys(step.outputMapping).length} vars</span>
            ) : (
              <span className="text-slate-400 italic">None</span>
            )}
          </div>
        </div>
      </div>

      {/* Connector Arrow */}
      {!isLast && (
        <div className="flex flex-col items-center my-2">
          <ArrowDown size={20} className="text-slate-400" />
        </div>
      )}
    </div>
  );
};

export const WorkflowView: React.FC<WorkflowViewProps> = ({ steps, onStepClick }) => {
  const [selectedStep, setSelectedStep] = useState<WorkflowStep | null>(null);

  const handleStepClick = (step: WorkflowStep) => {
    setSelectedStep(step);
    onStepClick?.(step);
  };

  if (!steps || steps.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-400">
        <Workflow size={48} className="mb-4 opacity-50" />
        <p>No steps to display</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Start Node */}
      <div className="flex flex-col items-center mb-4">
        <div className="w-32 h-12 bg-green-500 text-white rounded-full flex items-center justify-center font-bold shadow-md">
          Start
        </div>
        <div className="flex flex-col items-center my-2">
          <ArrowDown size={20} className="text-slate-400" />
        </div>
      </div>

      {/* Steps */}
      <div className="flex flex-col items-center space-y-0">
        {steps.map((step, index) => (
          <WorkflowNode
            key={step.id}
            step={step}
            index={index}
            isLast={index === steps.length - 1}
            onClick={handleStepClick}
          />
        ))}
      </div>

      {/* End Node */}
      <div className="flex flex-col items-center mt-4">
        <div className="w-32 h-12 bg-slate-500 text-white rounded-full flex items-center justify-center font-bold shadow-md">
          End
        </div>
      </div>

      {/* Step Details Panel (Optional - shows when a step is selected) */}
      {selectedStep && (
        <div className="fixed right-4 top-20 w-80 bg-white border-2 border-blue-500 rounded-lg shadow-xl p-4 z-50">
          <div className="flex justify-between items-start mb-3">
            <h4 className="font-bold text-slate-800">Step Details</h4>
            <button
              onClick={() => setSelectedStep(null)}
              className="text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          </div>
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-slate-500 font-medium">Name:</span>
              <p className="text-slate-800">{selectedStep.summary || selectedStep.name || 'Unnamed'}</p>
            </div>
            {selectedStep.instruction && (
              <div>
                <span className="text-slate-500 font-medium">Instruction:</span>
                <p className="text-slate-800">{selectedStep.instruction}</p>
              </div>
            )}
            {selectedStep.expectedResult && (
              <div>
                <span className="text-slate-500 font-medium">Expected Result:</span>
                <p className="text-slate-800">{selectedStep.expectedResult}</p>
              </div>
            )}
            {selectedStep.parameterValues && Object.keys(selectedStep.parameterValues).length > 0 && (
              <div>
                <span className="text-slate-500 font-medium">Parameters:</span>
                <div className="bg-slate-50 rounded p-2 mt-1 text-xs font-mono">
                  {Object.entries(selectedStep.parameterValues).map(([key, value]) => (
                    <div key={key} className="mb-1">
                      <span className="text-slate-600">{key}:</span>{' '}
                      <span className="text-blue-600">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
