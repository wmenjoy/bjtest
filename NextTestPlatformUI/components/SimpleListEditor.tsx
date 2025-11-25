import React, { useState } from 'react';
import { Plus, ChevronDown, ChevronUp, GripVertical, Trash2, Copy, Settings } from 'lucide-react';
import { DataMappingPanel } from './testcase/stepEditor/DataMappingPanel';
import { WorkflowStep } from '../types';

interface SimpleListEditorProps {
  steps: WorkflowStep[];
  onChange: (steps: WorkflowStep[]) => void;
  readonly?: boolean;
}

/**
 * SimpleListEditor Component
 *
 * Provides a simple list-based workflow editor with:
 * - Step CRUD operations (add, edit, delete, duplicate)
 * - Drag-and-drop reordering
 * - Integrated DataMappingPanel for visual data flow
 * - Collapsible data mapping UI
 */
export const SimpleListEditor: React.FC<SimpleListEditorProps> = ({
  steps,
  onChange,
  readonly = false
}) => {
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());
  const [showDataMappingFor, setShowDataMappingFor] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [editingStep, setEditingStep] = useState<string | null>(null);

  // Add new step
  const handleAddStep = () => {
    const newStep: WorkflowStep = {
      id: `step-${Date.now()}`,
      name: `Step ${steps.length + 1}`,
      type: 'http',
      config: {
        method: 'GET',
        url: '',
      },
    };
    onChange([...steps, newStep]);
    setExpandedSteps(new Set([...expandedSteps, newStep.id]));
  };

  // Update step
  const handleUpdateStep = (index: number, updated: WorkflowStep) => {
    const newSteps = [...steps];
    newSteps[index] = updated;
    onChange(newSteps);
  };

  // Delete step
  const handleDeleteStep = (index: number) => {
    if (readonly) return;
    const newSteps = steps.filter((_, i) => i !== index);
    onChange(newSteps);
  };

  // Duplicate step
  const handleDuplicateStep = (index: number) => {
    if (readonly) return;
    const stepToDuplicate = steps[index];
    const duplicated: WorkflowStep = {
      ...JSON.parse(JSON.stringify(stepToDuplicate)), // Deep clone
      id: `step-${Date.now()}`,
      name: `${stepToDuplicate.name} (Copy)`,
    };
    const newSteps = [...steps];
    newSteps.splice(index + 1, 0, duplicated);
    onChange(newSteps);
  };

  // Toggle step expansion
  const toggleStepExpansion = (stepId: string) => {
    const newExpanded = new Set(expandedSteps);
    if (newExpanded.has(stepId)) {
      newExpanded.delete(stepId);
    } else {
      newExpanded.add(stepId);
    }
    setExpandedSteps(newExpanded);
  };

  // Toggle data mapping panel
  const toggleDataMapping = (stepId: string) => {
    setShowDataMappingFor(showDataMappingFor === stepId ? null : stepId);
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    if (readonly) return;
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (readonly || draggedIndex === null || draggedIndex === index) return;

    const newSteps = [...steps];
    const draggedStep = newSteps[draggedIndex];
    newSteps.splice(draggedIndex, 1);
    newSteps.splice(index, 0, draggedStep);
    onChange(newSteps);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  // Render step type badge
  const getStepTypeBadge = (type: string) => {
    const badges: Record<string, { color: string; label: string }> = {
      http: { color: 'bg-blue-100 text-blue-700', label: 'HTTP' },
      command: { color: 'bg-green-100 text-green-700', label: 'CMD' },
      'test-case': { color: 'bg-purple-100 text-purple-700', label: 'Test' },
      loop: { color: 'bg-orange-100 text-orange-700', label: 'Loop' },
      condition: { color: 'bg-yellow-100 text-yellow-700', label: 'If' },
    };
    const badge = badges[type] || { color: 'bg-slate-100 text-slate-700', label: type };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded ${badge.color}`}>
        {badge.label}
      </span>
    );
  };

  // Render step configuration summary
  const getStepSummary = (step: WorkflowStep) => {
    if (step.type === 'http') {
      const method = step.config?.method || 'GET';
      const url = step.config?.url || '(no url)';
      return `${method} ${url}`;
    }
    if (step.type === 'command') {
      const cmd = step.config?.command || '(no command)';
      return cmd.length > 50 ? `${cmd.substring(0, 50)}...` : cmd;
    }
    if (step.type === 'test-case') {
      return `Test Case: ${step.config?.testCaseId || '(not set)'}`;
    }
    return 'Click to configure';
  };

  return (
    <div className="simple-list-editor h-full overflow-y-auto bg-slate-50">
      <div className="max-w-5xl mx-auto py-6 px-6 space-y-4">
        {/* Empty state */}
        {steps.length === 0 && (
          <div className="text-center py-16 bg-white rounded-xl border-2 border-dashed border-slate-300">
            <div className="text-slate-400 mb-4">
              <Plus size={48} className="mx-auto" />
            </div>
            <h3 className="text-lg font-semibold text-slate-700 mb-2">
              No steps yet
            </h3>
            <p className="text-sm text-slate-500 mb-6">
              Add your first step to start building the workflow
            </p>
            <button
              onClick={handleAddStep}
              disabled={readonly}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add First Step
            </button>
          </div>
        )}

        {/* Steps list */}
        {steps.map((step, index) => (
          <div key={step.id} className="space-y-2">
            {/* Step Card */}
            <div
              draggable={!readonly}
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`bg-white rounded-lg border-2 transition-all ${
                draggedIndex === index
                  ? 'border-blue-500 shadow-lg'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              {/* Step Header */}
              <div className="p-4">
                <div className="flex items-start space-x-3">
                  {/* Drag handle */}
                  {!readonly && (
                    <div className="cursor-move mt-1">
                      <GripVertical size={18} className="text-slate-400" />
                    </div>
                  )}

                  {/* Step number */}
                  <div className="flex-shrink-0 w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-sm font-bold text-slate-600">
                    {index + 1}
                  </div>

                  {/* Step content */}
                  <div className="flex-1 min-w-0">
                    {/* Step name and type */}
                    <div className="flex items-center space-x-2 mb-2">
                      <input
                        type="text"
                        value={step.name}
                        onChange={(e) =>
                          handleUpdateStep(index, { ...step, name: e.target.value })
                        }
                        disabled={readonly}
                        className="text-base font-semibold text-slate-800 bg-transparent border-none focus:outline-none focus:ring-0 flex-1"
                        placeholder="Step name"
                      />
                      {getStepTypeBadge(step.type)}
                    </div>

                    {/* Step summary */}
                    <div className="text-sm text-slate-500 truncate">
                      {getStepSummary(step)}
                    </div>

                    {/* Expand/collapse button */}
                    <button
                      onClick={() => toggleStepExpansion(step.id)}
                      className="mt-3 flex items-center space-x-2 text-xs text-blue-600 hover:text-blue-700"
                    >
                      {expandedSteps.has(step.id) ? (
                        <>
                          <ChevronUp size={14} />
                          <span>Hide details</span>
                        </>
                      ) : (
                        <>
                          <ChevronDown size={14} />
                          <span>Show details</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Action buttons */}
                  {!readonly && (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => toggleStepExpansion(step.id)}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="Configure"
                      >
                        <Settings size={16} />
                      </button>
                      <button
                        onClick={() => handleDuplicateStep(index)}
                        className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                        title="Duplicate"
                      >
                        <Copy size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteStep(index)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Expanded step configuration */}
                {expandedSteps.has(step.id) && (
                  <div className="mt-4 pt-4 border-t border-slate-200 space-y-4">
                    {/* Type selector */}
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-2">
                        Step Type
                      </label>
                      <select
                        value={step.type}
                        onChange={(e) =>
                          handleUpdateStep(index, { ...step, type: e.target.value })
                        }
                        disabled={readonly}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="http">HTTP Request</option>
                        <option value="command">Command</option>
                        <option value="test-case">Test Case</option>
                        <option value="loop">Loop</option>
                        <option value="condition">Condition</option>
                      </select>
                    </div>

                    {/* HTTP Configuration */}
                    {step.type === 'http' && (
                      <div className="space-y-3">
                        <div className="flex space-x-3">
                          <div className="w-32">
                            <label className="block text-xs font-medium text-slate-600 mb-2">
                              Method
                            </label>
                            <select
                              value={step.config?.method || 'GET'}
                              onChange={(e) =>
                                handleUpdateStep(index, {
                                  ...step,
                                  config: { ...step.config, method: e.target.value },
                                })
                              }
                              disabled={readonly}
                              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="GET">GET</option>
                              <option value="POST">POST</option>
                              <option value="PUT">PUT</option>
                              <option value="DELETE">DELETE</option>
                              <option value="PATCH">PATCH</option>
                            </select>
                          </div>
                          <div className="flex-1">
                            <label className="block text-xs font-medium text-slate-600 mb-2">
                              URL
                            </label>
                            <input
                              type="text"
                              value={step.config?.url || ''}
                              onChange={(e) =>
                                handleUpdateStep(index, {
                                  ...step,
                                  config: { ...step.config, url: e.target.value },
                                })
                              }
                              disabled={readonly}
                              placeholder="https://api.example.com/endpoint"
                              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Command Configuration */}
                    {step.type === 'command' && (
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-2">
                          Command
                        </label>
                        <input
                          type="text"
                          value={step.config?.command || ''}
                          onChange={(e) =>
                            handleUpdateStep(index, {
                              ...step,
                              config: { ...step.config, command: e.target.value },
                            })
                          }
                          disabled={readonly}
                          placeholder="echo 'Hello World'"
                          className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                        />
                      </div>
                    )}

                    {/* Test Case Configuration */}
                    {step.type === 'test-case' && (
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-2">
                          Test Case ID
                        </label>
                        <input
                          type="text"
                          value={step.config?.testCaseId || ''}
                          onChange={(e) =>
                            handleUpdateStep(index, {
                              ...step,
                              config: { ...step.config, testCaseId: e.target.value },
                            })
                          }
                          disabled={readonly}
                          placeholder="test-case-123"
                          className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Data Mapping Panel (collapsible) */}
            {index > 0 && (
              <div className="ml-12">
                <button
                  onClick={() => toggleDataMapping(step.id)}
                  className="flex items-center space-x-2 px-3 py-2 text-sm text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  {showDataMappingFor === step.id ? (
                    <ChevronUp size={14} />
                  ) : (
                    <ChevronDown size={14} />
                  )}
                  <span className="font-medium">
                    Data Flow Mapping
                    {step.dataMappers && step.dataMappers.length > 0 && (
                      <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">
                        {step.dataMappers.length}
                      </span>
                    )}
                  </span>
                </button>

                {showDataMappingFor === step.id && (
                  <div className="mt-2">
                    <DataMappingPanel
                      currentStep={step}
                      previousSteps={steps.slice(0, index)}
                      onChange={(updated) => handleUpdateStep(index, updated)}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {/* Add step button */}
        {steps.length > 0 && !readonly && (
          <button
            onClick={handleAddStep}
            className="w-full flex items-center justify-center space-x-2 px-4 py-4 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 border-2 border-dashed border-blue-300 rounded-xl transition-colors"
          >
            <Plus size={16} />
            <span>Add Step</span>
          </button>
        )}

        {/* Footer info */}
        {steps.length > 0 && (
          <div className="text-center text-xs text-slate-400 py-4">
            {steps.length} step{steps.length !== 1 ? 's' : ''} in workflow
          </div>
        )}
      </div>
    </div>
  );
};

export default SimpleListEditor;
