import React from 'react';
import { TestStep } from '../../../types';
import { Plus, Layers } from 'lucide-react';

interface ChildStepListProps {
  children: TestStep[];
  onChange: (children: TestStep[]) => void;
  variables?: Record<string, any>;
  containerLabel: string;
  depth?: number;
  renderStepCard?: (
    step: TestStep,
    index: number,
    onChange: (step: TestStep) => void,
    onDelete: () => void,
    onDuplicate: () => void,
    depth: number
  ) => React.ReactNode;
}

export const ChildStepList: React.FC<ChildStepListProps> = ({
  children,
  onChange,
  variables = {},
  containerLabel,
  depth = 1,
  renderStepCard
}) => {
  // Calculate indentation based on depth
  const indentClass = depth > 0 ? 'ml-4 pl-4 border-l-2 border-slate-200' : '';

  const addStep = () => {
    const newStep: TestStep = {
      id: `step-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: '',
      summary: '',
      type: 'http'
    };
    onChange([...children, newStep]);
  };

  const updateStep = (index: number, updatedStep: TestStep) => {
    const newChildren = [...children];
    newChildren[index] = updatedStep;
    onChange(newChildren);
  };

  const deleteStep = (index: number) => {
    const newChildren = children.filter((_, i) => i !== index);
    onChange(newChildren);
  };

  const duplicateStep = (index: number) => {
    const stepToDuplicate = children[index];
    const duplicatedStep: TestStep = {
      ...stepToDuplicate,
      id: `step-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: stepToDuplicate.name ? `${stepToDuplicate.name} (copy)` : '',
      summary: stepToDuplicate.summary ? `${stepToDuplicate.summary} (copy)` : ''
    };
    const newChildren = [
      ...children.slice(0, index + 1),
      duplicatedStep,
      ...children.slice(index + 1)
    ];
    onChange(newChildren);
  };

  // Get background color based on depth
  const getBgColor = () => {
    const colors = [
      'bg-slate-50',
      'bg-blue-50/30',
      'bg-purple-50/30',
      'bg-amber-50/30'
    ];
    return colors[depth % colors.length];
  };

  return (
    <div className={`${indentClass} rounded-lg ${getBgColor()} border border-slate-200 overflow-hidden`}>
      {/* Container Header */}
      <div className="flex items-center space-x-2 px-3 py-2 bg-slate-100/80 border-b border-slate-200">
        <Layers size={14} className="text-slate-500" />
        <span className="text-xs font-medium text-slate-600">{containerLabel}</span>
        <span className="text-[10px] px-1.5 py-0.5 bg-white text-slate-500 rounded">
          {children.length} step{children.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Steps */}
      <div className="p-3 space-y-2">
        {children.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-xs text-slate-400">No steps in this container</p>
            <p className="text-[10px] text-slate-300 mt-1">Add steps to define the execution flow</p>
          </div>
        ) : (
          children.map((step, index) => (
            <div key={step.id} className="relative">
              {/* Step Number Indicator */}
              <div className="absolute -left-1 top-3 w-5 h-5 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-[10px] font-bold z-10">
                {index + 1}
              </div>

              {/* Step Content */}
              <div className="ml-5">
                {renderStepCard ? (
                  renderStepCard(
                    step,
                    index,
                    (updatedStep) => updateStep(index, updatedStep),
                    () => deleteStep(index),
                    () => duplicateStep(index),
                    depth
                  )
                ) : (
                  // Default minimal step card rendering
                  <DefaultStepCard
                    step={step}
                    index={index}
                    onChange={(updatedStep) => updateStep(index, updatedStep)}
                    onDelete={() => deleteStep(index)}
                    onDuplicate={() => duplicateStep(index)}
                    variables={variables}
                  />
                )}
              </div>

              {/* Connector Line */}
              {index < children.length - 1 && (
                <div className="absolute left-1.5 top-8 bottom-0 w-px bg-slate-200" />
              )}
            </div>
          ))
        )}

        {/* Add Step Button */}
        <button
          type="button"
          onClick={addStep}
          className="w-full flex items-center justify-center space-x-1.5 px-3 py-2 text-xs font-medium text-slate-500 bg-white hover:bg-slate-50 border border-dashed border-slate-300 rounded-lg transition-colors mt-2"
        >
          <Plus size={14} />
          <span>Add Step</span>
        </button>
      </div>
    </div>
  );
};

// Default step card component when no custom renderer is provided
interface DefaultStepCardProps {
  step: TestStep;
  index: number;
  onChange: (step: TestStep) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  variables?: Record<string, any>;
}

const DefaultStepCard: React.FC<DefaultStepCardProps> = ({
  step,
  onChange,
  onDelete,
  onDuplicate,
  variables = {}
}) => {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-3 hover:border-slate-300 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <input
            type="text"
            className="w-full text-sm font-medium text-slate-700 bg-transparent border-none p-0 focus:ring-0 placeholder-slate-400"
            value={step.name || step.summary || ''}
            placeholder="Step name..."
            onChange={(e) => onChange({ ...step, name: e.target.value, summary: e.target.value })}
          />
          <div className="flex items-center space-x-2 mt-1">
            <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded uppercase font-medium">
              {step.type || 'http'}
            </span>
            {step.loop && (
              <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded flex items-center space-x-1">
                <span>Loop</span>
              </span>
            )}
            {step.branches && step.branches.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 bg-purple-100 text-purple-600 rounded flex items-center space-x-1">
                <span>Branch</span>
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-1 ml-2">
          <button
            type="button"
            onClick={onDuplicate}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors"
            title="Duplicate"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
            title="Delete"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18"></path>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};