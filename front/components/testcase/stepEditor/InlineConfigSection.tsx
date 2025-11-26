import React from 'react';
import { WorkflowStep } from '../../../types';
import { Trash2 } from 'lucide-react';

interface InlineConfigSectionProps {
  step: WorkflowStep;
  onChange: (step: WorkflowStep) => void;
}

export const InlineConfigSection: React.FC<InlineConfigSectionProps> = ({
  step,
  onChange
}) => {
  // Update field
  const updateField = <K extends keyof WorkflowStep>(field: K, value: WorkflowStep[K]) => {
    onChange({ ...step, [field]: value });
  };

  return (
    <div className="space-y-4">
      {/* Step Type Selection */}
      <div className="bg-white border border-slate-200 rounded-lg p-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
              Step Type
            </label>
            <select
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:border-blue-400 outline-none"
              value={step.type || 'http'}
              onChange={(e) => updateField('type', e.target.value)}
            >
              <option value="http">HTTP Request</option>
              <option value="command">Command</option>
              <option value="assert">Assertion</option>
              <option value="branch">Branch</option>
              <option value="group">Group</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
              Execution Condition (Optional)
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-lg bg-white focus:border-blue-400 outline-none"
              placeholder="{{previousStep.status}} == 'success'"
              value={step.condition || ''}
              onChange={(e) => updateField('condition', e.target.value)}
            />
            <p className="text-[10px] text-slate-500 mt-1">
              Controls whether this step runs. For result validation, use Assertions instead.
            </p>
          </div>
        </div>
      </div>

      {/* HTTP Config */}
      {(step.type === 'http' || !step.type) && (
        <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
          <label className="block text-[10px] font-bold text-slate-500 uppercase">
            HTTP Configuration
          </label>
          <div className="flex space-x-3">
            <div className="w-28">
              <label className="block text-xs text-slate-600 mb-1">Method</label>
              <select
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:border-blue-400 outline-none font-semibold"
                value={step.config?.method || 'GET'}
                onChange={(e) =>
                  updateField('config', { ...step.config, method: e.target.value })
                }
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
                <option value="PATCH">PATCH</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-xs text-slate-600 mb-1">URL</label>
              <input
                type="text"
                className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-lg bg-white focus:border-blue-400 outline-none"
                placeholder="/api/endpoint or {{baseUrl}}/users"
                value={step.config?.url || ''}
                onChange={(e) =>
                  updateField('config', { ...step.config, url: e.target.value })
                }
              />
            </div>
          </div>

          {/* Headers Section */}
          <div>
            <label className="block text-xs text-slate-600 mb-2">Headers</label>
            <div className="space-y-2">
              {Object.entries(step.config?.headers || {}).map(([key, value], idx) => (
                <div key={idx} className="flex items-center space-x-2">
                  <input
                    type="text"
                    className="flex-1 px-2 py-1.5 text-xs font-mono border border-slate-200 rounded bg-white focus:border-blue-400 outline-none"
                    placeholder="Header-Name"
                    value={key}
                    onChange={(e) => {
                      const newHeaders = { ...step.config?.headers };
                      const oldValue = newHeaders[key];
                      delete newHeaders[key];
                      if (e.target.value) {
                        newHeaders[e.target.value] = oldValue;
                      }
                      updateField('config', { ...step.config, headers: newHeaders });
                    }}
                  />
                  <span className="text-slate-400">:</span>
                  <input
                    type="text"
                    className="flex-1 px-2 py-1.5 text-xs font-mono border border-slate-200 rounded bg-white focus:border-blue-400 outline-none"
                    placeholder="header-value or {{variable}}"
                    value={value}
                    onChange={(e) => {
                      updateField('config', {
                        ...step.config,
                        headers: { ...step.config?.headers, [key]: e.target.value }
                      });
                    }}
                  />
                  <button
                    type="button"
                    className="p-1 text-slate-400 hover:text-red-500"
                    onClick={() => {
                      const newHeaders = { ...step.config?.headers };
                      delete newHeaders[key];
                      updateField('config', { ...step.config, headers: newHeaders });
                    }}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="text-xs text-blue-600 hover:underline"
                onClick={() => {
                  const newHeaders = { ...step.config?.headers, '': '' };
                  updateField('config', { ...step.config, headers: newHeaders });
                }}
              >
                + Add header
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Command Config */}
      {step.type === 'command' && (
        <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
          <label className="block text-[10px] font-bold text-slate-500 uppercase">
            Command Configuration
          </label>
          <div>
            <label className="block text-xs text-slate-600 mb-1">Command</label>
            <input
              type="text"
              className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-lg bg-white focus:border-blue-400 outline-none"
              placeholder="echo, curl, python, etc."
              value={step.config?.cmd || ''}
              onChange={(e) =>
                updateField('config', { ...step.config, cmd: e.target.value })
              }
            />
          </div>
          <div>
            <label className="block text-xs text-slate-600 mb-1">
              Arguments (one per line)
            </label>
            <textarea
              className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-lg bg-white focus:border-blue-400 outline-none resize-none"
              placeholder="--flag value&#10;-o output.txt&#10;{{variable}}"
              rows={3}
              value={Array.isArray(step.config?.args) ? step.config.args.join('\n') : (step.config?.args || '')}
              onChange={(e) => {
                const args = e.target.value.split('\n').filter(a => a.trim());
                updateField('config', { ...step.config, args });
              }}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-600 mb-1">
                Working Directory (optional)
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-lg bg-white focus:border-blue-400 outline-none"
                placeholder="/path/to/dir or {{workDir}}"
                value={step.config?.workDir || ''}
                onChange={(e) =>
                  updateField('config', { ...step.config, workDir: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-xs text-slate-600 mb-1">
                Timeout (seconds)
              </label>
              <input
                type="number"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:border-blue-400 outline-none"
                placeholder="30"
                min={0}
                value={step.config?.timeout || ''}
                onChange={(e) =>
                  updateField('config', { ...step.config, timeout: parseInt(e.target.value) || undefined })
                }
              />
            </div>
          </div>
          {/* Command Preview */}
          {(step.config?.cmd || step.config?.args) && (
            <div className="bg-slate-900 text-green-400 font-mono text-sm p-3 rounded-lg">
              <span className="text-slate-500">$ </span>
              {step.config?.cmd || 'command'} {Array.isArray(step.config?.args) ? step.config.args.join(' ') : ''}
            </div>
          )}
        </div>
      )}

      {/* Manual Output Mapping */}
      <div className="bg-white border border-slate-200 rounded-lg p-4">
        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">
          Output Variables
        </label>
        <p className="text-xs text-slate-400 mb-3">
          Map response paths to variables (e.g., response.body.token → authToken)
        </p>
        <div className="space-y-2">
          {Object.entries(step.outputs || {}).map(([path, varName], idx) => (
            <div key={idx} className="flex items-center space-x-2">
              <input
                type="text"
                className="flex-1 px-2 py-1.5 text-xs font-mono border border-slate-200 rounded bg-white"
                value={path}
                placeholder="response.body.data"
                onChange={(e) => {
                  const newOutputs = { ...step.outputs };
                  delete newOutputs[path];
                  newOutputs[e.target.value] = varName;
                  updateField('outputs', newOutputs);
                }}
              />
              <span className="text-slate-400">→</span>
              <input
                type="text"
                className="w-32 px-2 py-1.5 text-xs font-mono border border-slate-200 rounded bg-white text-cyan-600"
                value={varName}
                placeholder="varName"
                onChange={(e) => {
                  updateField('outputs', { ...step.outputs, [path]: e.target.value });
                }}
              />
              <button
                type="button"
                className="p-1 text-slate-400 hover:text-red-500"
                onClick={() => {
                  const newOutputs = { ...step.outputs };
                  delete newOutputs[path];
                  updateField('outputs', newOutputs);
                }}
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
          <button
            type="button"
            className="text-xs text-blue-600 hover:underline"
            onClick={() =>
              updateField('outputs', { ...step.outputs, '': '' })
            }
          >
            + Add output mapping
          </button>
        </div>
      </div>
    </div>
  );
};