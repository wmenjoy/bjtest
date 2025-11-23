import React, { useState, useCallback } from 'react';
import { TestStep } from '../../../types';
import { StepCard } from './StepCard';
import {
  Plus,
  ChevronDown,
  PlayCircle,
  StopCircle,
  Globe,
  Terminal,
  CheckCircle,
  GitBranch,
  Layers
} from 'lucide-react';

interface StepEditorProps {
  steps: TestStep[];
  onChange: (steps: TestStep[]) => void;
  variables?: Record<string, any>;
  readOnly?: boolean;
}

// Step type definitions for the add step dropdown
const STEP_TYPES = [
  { type: 'http', label: 'HTTP Request', icon: Globe, color: 'emerald' },
  { type: 'command', label: 'Command', icon: Terminal, color: 'orange' },
  { type: 'assert', label: 'Assertion', icon: CheckCircle, color: 'cyan' },
  { type: 'branch', label: 'Branch', icon: GitBranch, color: 'purple' },
  { type: 'group', label: 'Group', icon: Layers, color: 'slate' }
];

export const StepEditor: React.FC<StepEditorProps> = ({
  steps,
  onChange,
  variables = {},
  readOnly = false
}) => {
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Generate unique step ID
  const generateStepId = useCallback(() => {
    return `step-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Add new step
  const addStep = useCallback((type: string = 'http') => {
    const newStep: TestStep = {
      id: generateStepId(),
      name: '',
      summary: '',
      type,
      config: type === 'http' ? { method: 'GET', url: '' } : {}
    };
    onChange([...steps, newStep]);
    setShowAddMenu(false);
  }, [steps, onChange, generateStepId]);

  // Update step at index
  const updateStep = useCallback((index: number, updatedStep: TestStep) => {
    const newSteps = [...steps];
    newSteps[index] = updatedStep;
    onChange(newSteps);
  }, [steps, onChange]);

  // Delete step at index
  const deleteStep = useCallback((index: number) => {
    const newSteps = steps.filter((_, i) => i !== index);
    onChange(newSteps);
  }, [steps, onChange]);

  // Duplicate step at index
  const duplicateStep = useCallback((index: number) => {
    const stepToDuplicate = steps[index];
    const duplicatedStep: TestStep = {
      ...JSON.parse(JSON.stringify(stepToDuplicate)), // Deep clone
      id: generateStepId(),
      name: stepToDuplicate.name ? `${stepToDuplicate.name} (copy)` : '',
      summary: stepToDuplicate.summary ? `${stepToDuplicate.summary} (copy)` : ''
    };
    const newSteps = [
      ...steps.slice(0, index + 1),
      duplicatedStep,
      ...steps.slice(index + 1)
    ];
    onChange(newSteps);
  }, [steps, onChange, generateStepId]);

  // Drag and drop handlers
  const handleDragStart = useCallback((index: number) => {
    setDraggedIndex(index);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newSteps = [...steps];
    const draggedItem = newSteps[draggedIndex];
    newSteps.splice(draggedIndex, 1);
    newSteps.splice(index, 0, draggedItem);
    onChange(newSteps);
    setDraggedIndex(index);
  }, [draggedIndex, steps, onChange]);

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null);
  }, []);

  // Get context variables available at a step index
  // (includes initial variables plus outputs from previous steps)
  const getContextVariables = useCallback((stepIndex: number): Record<string, any> => {
    const contextVars = { ...variables };

    // Collect outputs from all previous steps
    for (let i = 0; i < stepIndex; i++) {
      const step = steps[i];
      if (step.outputs) {
        Object.values(step.outputs).forEach(varName => {
          if (varName) {
            contextVars[varName] = `[output from step ${i + 1}]`;
          }
        });
      }
      if (step.outputMapping) {
        Object.values(step.outputMapping).forEach(varName => {
          if (varName) {
            contextVars[varName] = `[output from step ${i + 1}]`;
          }
        });
      }
    }

    return contextVars;
  }, [variables, steps]);

  return (
    <div className="flex flex-col h-full">
      {/* Step List Container */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto py-6 px-4">
          {/* Start Indicator */}
          <div className="flex flex-col items-center mb-6">
            <div className="flex items-center space-x-2 px-4 py-2 bg-green-100 border border-green-200 rounded-full">
              <PlayCircle size={14} className="text-green-600" />
              <span className="text-xs font-bold text-green-700 uppercase tracking-wider">
                Start Execution
              </span>
            </div>
            {steps.length > 0 && (
              <div className="w-px h-6 bg-slate-300 mt-2" />
            )}
          </div>

          {/* Empty State */}
          {steps.length === 0 && (
            <div className="text-center py-12 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
              <Layers size={32} className="mx-auto text-slate-300 mb-3" />
              <h3 className="text-sm font-medium text-slate-600 mb-1">
                No steps defined
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                Add steps to define your test execution flow
              </p>
              {!readOnly && (
                <button
                  onClick={() => addStep('http')}
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  <Plus size={16} />
                  <span>Add First Step</span>
                </button>
              )}
            </div>
          )}

          {/* Steps List */}
          <div className="space-y-4">
            {steps.map((step, index) => (
              <React.Fragment key={step.id}>
                {/* Connector Line */}
                {index > 0 && (
                  <div className="flex justify-center -my-2">
                    <div className="w-px h-4 bg-slate-300" />
                  </div>
                )}

                {/* Step Card */}
                <StepCard
                  step={step}
                  index={index}
                  onChange={(updatedStep) => updateStep(index, updatedStep)}
                  onDelete={() => deleteStep(index)}
                  onDuplicate={() => duplicateStep(index)}
                  variables={getContextVariables(index)}
                  depth={0}
                  draggable={!readOnly}
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                />
              </React.Fragment>
            ))}
          </div>

          {/* Add Step Button */}
          {!readOnly && steps.length > 0 && (
            <div className="mt-6">
              {/* Connector */}
              <div className="flex justify-center mb-4">
                <div className="w-px h-6 bg-slate-300" />
              </div>

              {/* Add Button with Dropdown */}
              <div className="relative flex justify-center">
                <button
                  onClick={() => setShowAddMenu(!showAddMenu)}
                  className="flex items-center space-x-2 px-6 py-3 bg-white hover:bg-slate-50 border border-dashed border-slate-300 hover:border-blue-400 rounded-xl text-slate-500 hover:text-blue-600 shadow-sm hover:shadow transition-all"
                >
                  <Plus size={18} />
                  <span className="font-medium">Add Step</span>
                  <ChevronDown size={14} className={`transition-transform ${showAddMenu ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {showAddMenu && (
                  <>
                    {/* Backdrop */}
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowAddMenu(false)}
                    />

                    {/* Menu */}
                    <div className="absolute z-20 top-full mt-2 w-56 bg-white rounded-xl border border-slate-200 shadow-lg overflow-hidden">
                      <div className="p-2">
                        <p className="text-[10px] font-bold text-slate-400 uppercase px-2 py-1">
                          Select Step Type
                        </p>
                        {STEP_TYPES.map((stepType) => {
                          const Icon = stepType.icon;
                          return (
                            <button
                              key={stepType.type}
                              onClick={() => addStep(stepType.type)}
                              className="w-full flex items-center space-x-3 px-3 py-2 hover:bg-slate-50 rounded-lg transition-colors"
                            >
                              <div className={`p-1.5 rounded bg-${stepType.color}-100 text-${stepType.color}-600`}>
                                <Icon size={14} />
                              </div>
                              <span className="text-sm font-medium text-slate-700">
                                {stepType.label}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* End Indicator */}
          {steps.length > 0 && (
            <div className="flex flex-col items-center mt-6">
              <div className="w-px h-6 bg-slate-300" />
              <div className="flex items-center space-x-2 px-4 py-2 bg-slate-200 border border-slate-300 rounded-full">
                <StopCircle size={14} className="text-slate-500" />
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                  End
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer Summary (Optional) */}
      {steps.length > 0 && (
        <div className="border-t border-slate-200 bg-white px-4 py-2">
          <div className="max-w-4xl mx-auto flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center space-x-4">
              <span>{steps.length} step{steps.length !== 1 ? 's' : ''}</span>
              <span className="text-slate-300">|</span>
              <span>
                {steps.filter(s => s.loop).length} loops
              </span>
              <span className="text-slate-300">|</span>
              <span>
                {steps.filter(s => s.branches && s.branches.length > 0).length} branches
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-slate-400">Drag steps to reorder</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
