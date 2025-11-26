import React, { useState, useCallback } from 'react';
import { TestStep } from '../../../types';
import { StepCard } from './StepCard';
import { LoopStepCard } from './LoopStepCard';
import { BranchStepCard } from './BranchStepCard';
import { ActionTemplateSelector } from './ActionTemplateSelector';
import { ActionTemplate } from '../../../services/api/actionTemplateApi';
import {
  Plus,
  ChevronDown,
  PlayCircle,
  StopCircle,
  Globe,
  Terminal,
  CheckCircle,
  GitBranch,
  Layers,
  RefreshCw,
  Package,
  Code
} from 'lucide-react';

interface StepEditorProps {
  steps: TestStep[];
  onChange: (steps: TestStep[]) => void;
  variables?: Record<string, any>;
  readOnly?: boolean;
  projectId?: string; // Required for Action Library integration
}

// Step type definitions for the add step dropdown
const STEP_TYPES = [
  { type: 'http', label: 'HTTP Request', icon: Globe, color: 'emerald' },
  { type: 'command', label: 'Command', icon: Terminal, color: 'orange' },
  { type: 'assert', label: 'Assertion', icon: CheckCircle, color: 'cyan' },
  { type: 'loop', label: 'Loop', icon: RefreshCw, color: 'blue' },
  { type: 'branch', label: 'Branch', icon: GitBranch, color: 'purple' },
  { type: 'group', label: 'Group', icon: Layers, color: 'slate' }
];

export const StepEditor: React.FC<StepEditorProps> = ({
  steps,
  onChange,
  variables = {},
  readOnly = false,
  projectId
}) => {
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showActionLibrary, setShowActionLibrary] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Generate unique step ID
  const generateStepId = useCallback(() => {
    return `step-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Add new step
  const addStep = useCallback((type: string = 'http') => {
    let defaultConfig: any = {};
    if (type === 'http') {
      defaultConfig = { method: 'GET', url: '' };
    } else if (type === 'loop') {
      defaultConfig = { type: 'forEach', source: '', itemVar: 'item', maxIterations: 100 };
    } else if (type === 'branch') {
      defaultConfig = { branches: [] };
    }

    const newStep: TestStep = {
      id: generateStepId(),
      name: '',
      summary: '',
      type,
      config: defaultConfig
    };
    onChange([...steps, newStep]);
    setShowAddMenu(false);
  }, [steps, onChange, generateStepId]);

  // Add step from Action Library
  const handleActionTemplateSelect = useCallback((template: ActionTemplate) => {
    const newStep: TestStep = {
      id: generateStepId(),
      name: template.name,
      summary: template.description,
      type: template.type as any, // Map action type to step type
      actionTemplateId: template.templateId,
      actionVersion: '1.0', // Default version
      inputs: {}, // Will be configured by user
      outputs: {}, // Will be configured by user
      config: undefined // Using template reference, not inline config
    };
    onChange([...steps, newStep]);
    setShowActionLibrary(false);
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
                Add your first step to get started
              </p>
              {!readOnly && (
                <button
                  onClick={() => setShowAddMenu(true)}
                  className="inline-flex items-center space-x-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-all shadow-sm hover:shadow"
                >
                  <Plus size={18} />
                  <span>Add Step</span>
                </button>
              )}
            </div>
          )}

          {/* Steps List */}
          <div className="space-y-4">
            {steps.map((step, index) => {
              // Render different cards based on step type
              if (step.type === 'loop') {
                return (
                  <React.Fragment key={step.id}>
                    {/* Connector Line */}
                    {index > 0 && (
                      <div className="flex justify-center -my-2">
                        <div className="w-px h-4 bg-slate-300" />
                      </div>
                    )}

                    {/* Loop Step Card */}
                    <LoopStepCard
                      step={step}
                      index={index}
                      onChange={(updatedStep) => updateStep(index, updatedStep)}
                      onDelete={() => deleteStep(index)}
                      onDuplicate={() => duplicateStep(index)}
                    />
                  </React.Fragment>
                );
              } else if (step.type === 'branch') {
                return (
                  <React.Fragment key={step.id}>
                    {/* Connector Line */}
                    {index > 0 && (
                      <div className="flex justify-center -my-2">
                        <div className="w-px h-4 bg-slate-300" />
                      </div>
                    )}

                    {/* Branch Step Card */}
                    <BranchStepCard
                      step={step}
                      index={index}
                      onChange={(updatedStep) => updateStep(index, updatedStep)}
                      onDelete={() => deleteStep(index)}
                      onDuplicate={() => duplicateStep(index)}
                    />
                  </React.Fragment>
                );
              } else {
                return (
                  <React.Fragment key={step.id}>
                    {/* Connector Line */}
                    {index > 0 && (
                      <div className="flex justify-center -my-2">
                        <div className="w-px h-4 bg-slate-300" />
                      </div>
                    )}

                    {/* Standard Step Card */}
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
                );
              }
            })}
          </div>

          {/* Add Step Button */}
          {!readOnly && steps.length > 0 && (
            <div className="mt-6">
              {/* Connector */}
              <div className="flex justify-center mb-4">
                <div className="w-px h-6 bg-slate-300" />
              </div>

              {/* Single Add Button with Menu */}
              <div className="flex justify-center">
                <div className="relative">
                  <button
                    onClick={() => setShowAddMenu(!showAddMenu)}
                    className="flex items-center space-x-2 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-medium shadow-md hover:shadow-lg transition-all transform hover:scale-105"
                  >
                    <Plus size={20} />
                    <span>Add Step</span>
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
                      <div className="absolute z-20 top-full mt-3 left-1/2 -translate-x-1/2 w-72 bg-white rounded-xl border border-slate-200 shadow-2xl overflow-hidden">
                        {/* Action Library Option */}
                        {projectId && (
                          <>
                            <button
                              onClick={() => {
                                setShowActionLibrary(true);
                                setShowAddMenu(false);
                              }}
                              className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-blue-50 transition-colors border-b border-slate-100"
                            >
                              <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                                <Package size={18} />
                              </div>
                              <div className="flex-1 text-left">
                                <div className="text-sm font-semibold text-slate-800">From Action Library</div>
                                <div className="text-xs text-slate-500">Use pre-built templates</div>
                              </div>
                            </button>
                          </>
                        )}

                        {/* Custom Step Types */}
                        <div className="p-2">
                          <p className="text-[10px] font-bold text-slate-400 uppercase px-2 py-2">
                            Create Custom Step
                          </p>
                          {STEP_TYPES.map((stepType) => {
                            const Icon = stepType.icon;
                            return (
                              <button
                                key={stepType.type}
                                onClick={() => addStep(stepType.type)}
                                className="w-full flex items-center space-x-3 px-3 py-2.5 hover:bg-slate-50 rounded-lg transition-colors"
                              >
                                <div className={`p-1.5 rounded bg-${stepType.color}-100 text-${stepType.color}-600`}>
                                  <Icon size={16} />
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

      {/* Action Library Modal */}
      {showActionLibrary && projectId && (
        <ActionTemplateSelector
          projectId={projectId}
          onSelect={handleActionTemplateSelect}
          onClose={() => setShowActionLibrary(false)}
        />
      )}
    </div>
  );
};