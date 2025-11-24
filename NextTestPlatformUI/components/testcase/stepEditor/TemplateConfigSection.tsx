import React, { useEffect, useState } from 'react';
import { WorkflowStep } from '../../../types';
import { actionTemplateApi, ActionTemplate } from '../../../services/api/actionTemplateApi';
import { Package, Unlink, ArrowRight } from 'lucide-react';

interface TemplateConfigSectionProps {
  step: WorkflowStep;
  selectedTemplate: ActionTemplate | null;
  onChange: (step: WorkflowStep) => void;
  onShowSelector: () => void;
  onUnlink: () => void;
}

export const TemplateConfigSection: React.FC<TemplateConfigSectionProps> = ({
  step,
  selectedTemplate,
  onChange,
  onShowSelector,
  onUnlink
}) => {
  const [template, setTemplate] = useState<ActionTemplate | null>(selectedTemplate);

  // Load template details if not already loaded
  useEffect(() => {
    const templateId = step.actionTemplateId || step.linkedScriptId;
    if (templateId && !template) {
      actionTemplateApi.getTemplate(templateId)
        .then(setTemplate)
        .catch(console.error);
    }
  }, [step.actionTemplateId, step.linkedScriptId, template]);

  // Update field
  const updateField = <K extends keyof WorkflowStep>(field: K, value: WorkflowStep[K]) => {
    onChange({ ...step, [field]: value });
  };

  if (!template) {
    // Template not selected yet
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-4">
        <button
          type="button"
          onClick={onShowSelector}
          className="w-full flex items-center justify-center space-x-2 px-4 py-3 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 border border-dashed border-blue-300 rounded-lg transition-colors"
        >
          <Package size={16} />
          <span>Select Action Template from Library</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Template Info Card */}
      <div className="bg-white border border-slate-200 rounded-lg p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-blue-50 rounded">
              <Package size={16} className="text-blue-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <h4 className="font-semibold text-slate-800">{template.name}</h4>
                <span className="text-[10px] px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-medium uppercase">
                  {template.scope}
                </span>
                <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                  {template.category}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1">{template.description}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onUnlink}
            className="flex items-center space-x-1 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded transition-colors"
            title="Switch to inline configuration"
          >
            <Unlink size={12} />
            <span>Unlink</span>
          </button>
        </div>
      </div>

      {/* Input Parameters */}
      {template.parameters && template.parameters.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-3">
            Input Parameters
          </label>
          <div className="space-y-3">
            {template.parameters.map((param: any) => (
              <div key={param.name}>
                <label className="block text-xs text-slate-600 mb-1.5">
                  {param.name}
                  {param.required && <span className="text-red-500 ml-1">*</span>}
                  <span className="text-slate-400 ml-2 text-[10px]">({param.type})</span>
                </label>
                {param.description && (
                  <p className="text-[10px] text-slate-400 mb-1">{param.description}</p>
                )}
                <input
                  type="text"
                  className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-lg bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                  placeholder={param.defaultValue || `Enter ${param.type} or use {{variable}}`}
                  value={(step.inputs && step.inputs[param.name]) || ''}
                  onChange={(e) =>
                    updateField('inputs', { ...step.inputs, [param.name]: e.target.value })
                  }
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Output Mappings */}
      {template.outputs && template.outputs.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">
            Output Mappings
          </label>
          <p className="text-xs text-slate-400 mb-3">
            Map template outputs to workflow variables
          </p>
          <div className="space-y-2">
            {template.outputs.map((output: any) => (
              <div key={output.name} className="flex items-center space-x-2">
                <div className="flex-1 flex items-center space-x-2">
                  <span className="text-xs text-slate-600 font-mono bg-slate-50 px-2 py-1 rounded">
                    {output.name}
                  </span>
                  <ArrowRight size={14} className="text-slate-400" />
                  <input
                    type="text"
                    className="flex-1 px-2 py-1.5 text-xs font-mono border border-slate-200 rounded bg-white text-cyan-600 focus:border-blue-400 outline-none"
                    placeholder="variableName"
                    value={(step.outputs && step.outputs[output.name]) || ''}
                    onChange={(e) =>
                      updateField('outputs', { ...step.outputs, [output.name]: e.target.value })
                    }
                  />
                </div>
                {output.description && (
                  <span className="text-xs text-slate-400 w-40 truncate" title={output.description}>
                    {output.description}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
