import React, { useState } from 'react';
import { X, Plus, Trash2, Zap } from 'lucide-react';
import { DataBinding, DataTransform } from '../../../types';

interface DataField {
  name: string;
  path: string;
  type?: string;
  value?: any;
}

interface DataMapperProps {
  sourceStepId: string;
  sourceStepName: string;
  sourceOutputs: DataField[];
  targetStepId: string;
  targetStepName: string;
  targetInputs: DataField[];
  bindings: DataBinding[];
  onBindingsChange: (bindings: DataBinding[]) => void;
  onClose: () => void;
}

export const DataMapper: React.FC<DataMapperProps> = ({
  sourceStepId,
  sourceStepName,
  sourceOutputs,
  targetStepId,
  targetStepName,
  targetInputs,
  bindings,
  onBindingsChange,
  onClose
}) => {
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);

  // Create a new binding
  const createBinding = (sourcePath: string, targetParam: string) => {
    const sourceField = sourceOutputs.find(f => f.path === sourcePath);
    const targetField = targetInputs.find(f => f.name === targetParam);

    const newBinding: DataBinding = {
      id: `binding-${Date.now()}`,
      sourceStepId,
      sourcePath,
      sourceType: sourceField?.type,
      targetStepId,
      targetParam,
      targetType: targetField?.type
    };

    onBindingsChange([...bindings, newBinding]);
    setSelectedSource(null);
    setSelectedTarget(null);
  };

  // Delete a binding
  const deleteBinding = (bindingId: string) => {
    onBindingsChange(bindings.filter(b => b.id !== bindingId));
  };

  // Auto-map bindings based on name matching
  const autoMap = () => {
    const newBindings: DataBinding[] = [];

    targetInputs.forEach(targetField => {
      // Check for exact name match
      const exactMatch = sourceOutputs.find(
        source => source.name.toLowerCase() === targetField.name.toLowerCase()
      );

      if (exactMatch) {
        // Check if binding already exists
        const exists = bindings.some(
          b => b.targetParam === targetField.name
        );

        if (!exists) {
          newBindings.push({
            id: `binding-${Date.now()}-${targetField.name}`,
            sourceStepId,
            sourcePath: exactMatch.path,
            sourceType: exactMatch.type,
            targetStepId,
            targetParam: targetField.name,
            targetType: targetField.type
          });
        }
      }
    });

    if (newBindings.length > 0) {
      onBindingsChange([...bindings, ...newBindings]);
    }
  };

  // Clear all bindings
  const clearAll = () => {
    if (confirm('Clear all bindings?')) {
      onBindingsChange([]);
    }
  };

  // Check if a field is bound
  const isSourceBound = (path: string) => {
    return bindings.some(b => b.sourcePath === path);
  };

  const isTargetBound = (param: string) => {
    return bindings.some(b => b.targetParam === param);
  };

  // Get binding for a target parameter
  const getBindingForTarget = (param: string) => {
    return bindings.find(b => b.targetParam === param);
  };

  // Handle field click
  const handleSourceClick = (field: DataField) => {
    if (selectedTarget) {
      // Create binding if target is selected
      createBinding(field.path, selectedTarget);
    } else {
      // Just select the source
      setSelectedSource(field.path);
      setSelectedTarget(null);
    }
  };

  const handleTargetClick = (field: DataField) => {
    if (selectedSource) {
      // Create binding if source is selected
      createBinding(selectedSource, field.name);
    } else {
      // Just select the target
      setSelectedTarget(field.name);
      setSelectedSource(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-800">
            Data Mapper: {sourceStepName} → {targetStepName}
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={autoMap}
              className="px-3 py-1.5 text-sm bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-md flex items-center gap-1.5"
            >
              <Zap size={14} />
              Auto Map
            </button>
            <button
              onClick={clearAll}
              className="px-3 py-1.5 text-sm bg-slate-50 text-slate-600 hover:bg-slate-100 rounded-md flex items-center gap-1.5"
            >
              <Trash2 size={14} />
              Clear All
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-md"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Source Panel */}
          <div className="w-1/2 border-r border-slate-200 flex flex-col">
            <div className="px-6 py-3 bg-slate-50 border-b border-slate-200">
              <h3 className="font-medium text-slate-700">Source: {sourceStepName}</h3>
              <p className="text-xs text-slate-500 mt-0.5">Outputs</p>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {sourceOutputs.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  No outputs available
                </div>
              ) : (
                <div className="space-y-2">
                  {sourceOutputs.map(field => {
                    const isBound = isSourceBound(field.path);
                    const isSelected = selectedSource === field.path;

                    return (
                      <div
                        key={field.path}
                        onClick={() => handleSourceClick(field)}
                        className={`p-3 rounded-lg border cursor-pointer transition-all ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50'
                            : isBound
                            ? 'border-green-300 bg-green-50'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-3 h-3 rounded-full border-2 ${
                                isBound
                                  ? 'bg-green-500 border-green-600'
                                  : 'bg-white border-slate-300'
                              }`}
                            />
                            <div>
                              <div className="font-medium text-slate-800 text-sm">
                                {field.name}
                              </div>
                              <div className="text-xs text-slate-500 mt-0.5">
                                {field.path}
                              </div>
                            </div>
                          </div>
                          {field.type && (
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded">
                              {field.type}
                            </span>
                          )}
                        </div>
                        {field.value !== undefined && (
                          <div className="mt-2 text-xs text-slate-600 font-mono bg-slate-50 p-2 rounded">
                            {typeof field.value === 'object'
                              ? JSON.stringify(field.value)
                              : String(field.value)}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Target Panel */}
          <div className="w-1/2 flex flex-col">
            <div className="px-6 py-3 bg-slate-50 border-b border-slate-200">
              <h3 className="font-medium text-slate-700">Target: {targetStepName}</h3>
              <p className="text-xs text-slate-500 mt-0.5">Inputs</p>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {targetInputs.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  No inputs defined
                </div>
              ) : (
                <div className="space-y-2">
                  {targetInputs.map(field => {
                    const binding = getBindingForTarget(field.name);
                    const isBound = !!binding;
                    const isSelected = selectedTarget === field.name;

                    return (
                      <div key={field.name} className="relative">
                        <div
                          onClick={() => handleTargetClick(field)}
                          className={`p-3 rounded-lg border cursor-pointer transition-all ${
                            isSelected
                              ? 'border-blue-500 bg-blue-50'
                              : isBound
                              ? 'border-green-300 bg-green-50'
                              : 'border-slate-200 bg-white hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-3 h-3 rounded-full border-2 ${
                                  isBound
                                    ? 'bg-green-500 border-green-600'
                                    : 'bg-white border-slate-300'
                                }`}
                              />
                              <div>
                                <div className="font-medium text-slate-800 text-sm">
                                  {field.name}
                                </div>
                                {field.type && (
                                  <div className="text-xs text-slate-500 mt-0.5">
                                    Type: {field.type}
                                  </div>
                                )}
                              </div>
                            </div>
                            {binding && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteBinding(binding.id);
                                }}
                                className="p-1 hover:bg-red-100 rounded text-red-600"
                              >
                                <X size={14} />
                              </button>
                            )}
                          </div>

                          {/* Show binding info */}
                          {binding && (
                            <div className="mt-2 pl-5 text-xs text-slate-600">
                              <div className="flex items-center gap-1">
                                <span className="text-slate-500">From:</span>
                                <span className="font-mono bg-white px-1.5 py-0.5 rounded">
                                  {binding.sourcePath}
                                </span>
                              </div>
                              {binding.transform && (
                                <div className="flex items-center gap-1 mt-1">
                                  <Zap size={12} className="text-yellow-500" />
                                  <span className="text-slate-500">Transform:</span>
                                  <span className="font-mono">
                                    {binding.transform.type === 'function'
                                      ? binding.transform.function
                                      : binding.transform.template}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-600">
              {bindings.length > 0 ? (
                <>
                  {bindings.length} binding{bindings.length !== 1 ? 's' : ''} configured
                  {targetInputs.length > bindings.length && (
                    <span className="ml-2 text-yellow-600">
                      ({targetInputs.length - bindings.length} unmapped)
                    </span>
                  )}
                </>
              ) : (
                <>Click source field, then target field to create a binding</>
              )}
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
