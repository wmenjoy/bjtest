import React, { useState } from 'react';
import { TestStep, LoopConfig, BranchConfig } from '../../../types';
import {
  RefreshCw,
  GitBranch,
  ChevronDown,
  ChevronUp,
  Trash2,
  Copy,
  Edit2,
  Globe,
  Terminal,
  CheckCircle,
  Layers,
  GripVertical
} from 'lucide-react';
import { LoopConfigEditor } from './LoopConfigEditor';
import { BranchConfigEditor } from './BranchConfigEditor';
import { ChildStepList } from './ChildStepList';

interface StepCardProps {
  step: TestStep;
  index: number;
  onChange: (step: TestStep) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  variables?: Record<string, any>;
  depth?: number;
  draggable?: boolean;
  onDragStart?: () => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDragEnd?: () => void;
}

// Step type icons
const STEP_TYPE_ICONS: Record<string, React.ReactNode> = {
  http: <Globe size={14} />,
  command: <Terminal size={14} />,
  assert: <CheckCircle size={14} />,
  branch: <GitBranch size={14} />,
  group: <Layers size={14} />
};

// Step type colors
const STEP_TYPE_COLORS: Record<string, string> = {
  http: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  command: 'bg-orange-100 text-orange-700 border-orange-200',
  assert: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  branch: 'bg-purple-100 text-purple-700 border-purple-200',
  group: 'bg-slate-100 text-slate-700 border-slate-200'
};

export const StepCard: React.FC<StepCardProps> = ({
  step,
  index,
  onChange,
  onDelete,
  onDuplicate,
  variables = {},
  depth = 0,
  draggable = true,
  onDragStart,
  onDragOver,
  onDragEnd
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Calculate left margin based on depth
  const marginLeft = depth * 24;

  // Check if step has control flow
  const hasLoop = !!step.loop;
  const hasBranches = step.branches && step.branches.length > 0;
  const hasChildren = step.children && step.children.length > 0;

  // Step type badge
  const stepType = step.type || 'http';
  const typeColor = STEP_TYPE_COLORS[stepType] || STEP_TYPE_COLORS.http;
  const typeIcon = STEP_TYPE_ICONS[stepType] || STEP_TYPE_ICONS.http;

  // Update step field
  const updateField = <K extends keyof TestStep>(field: K, value: TestStep[K]) => {
    onChange({ ...step, [field]: value });
  };

  // Handle loop config change
  const handleLoopChange = (loopConfig: LoopConfig | undefined) => {
    const updatedStep = { ...step };
    if (loopConfig) {
      updatedStep.loop = loopConfig;
      // Initialize children array if enabling loop
      if (!updatedStep.children) {
        updatedStep.children = [];
      }
    } else {
      delete updatedStep.loop;
    }
    onChange(updatedStep);
  };

  // Handle branches change
  const handleBranchesChange = (branches: BranchConfig[]) => {
    onChange({ ...step, branches });
  };

  // Handle children change (for loop body)
  const handleChildrenChange = (children: TestStep[]) => {
    onChange({ ...step, children });
  };

  // Render child step cards recursively
  const renderChildStepCard = (
    childStep: TestStep,
    childIndex: number,
    childOnChange: (s: TestStep) => void,
    childOnDelete: () => void,
    childOnDuplicate: () => void,
    childDepth: number
  ) => (
    <StepCard
      key={childStep.id}
      step={childStep}
      index={childIndex}
      onChange={childOnChange}
      onDelete={childOnDelete}
      onDuplicate={childOnDuplicate}
      variables={variables}
      depth={childDepth}
      draggable={false}
    />
  );

  return (
    <div
      className="group relative"
      style={{ marginLeft: `${marginLeft}px` }}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
    >
      {/* Main Card */}
      <div
        className={`bg-white rounded-xl border transition-all overflow-hidden ${
          isExpanded
            ? 'border-slate-300 shadow-md'
            : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
        }`}
      >
        {/* Card Header */}
        <div className="flex items-stretch">
          {/* Drag Handle */}
          {draggable && (
            <div className="w-8 flex items-center justify-center bg-slate-50 border-r border-slate-100 cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500">
              <GripVertical size={14} />
            </div>
          )}

          {/* Step Type Indicator */}
          <div
            className={`w-12 flex flex-col items-center justify-center border-r border-slate-100 ${
              hasLoop ? 'bg-blue-50' : hasBranches ? 'bg-purple-50' : 'bg-slate-50'
            }`}
          >
            <div className={`p-1.5 rounded ${typeColor}`}>{typeIcon}</div>
          </div>

          {/* Main Content */}
          <div className="flex-1 p-3">
            <div className="flex items-start justify-between">
              {/* Step Info */}
              <div className="flex-1 min-w-0">
                {/* Step Header with Name */}
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-slate-400 font-mono">{index + 1}.</span>
                  {isEditing ? (
                    <input
                      type="text"
                      className="flex-1 px-2 py-1 text-sm font-semibold text-slate-800 border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-200"
                      value={step.name || step.summary || ''}
                      onChange={(e) => {
                        updateField('name', e.target.value);
                        updateField('summary', e.target.value);
                      }}
                      onBlur={() => setIsEditing(false)}
                      onKeyDown={(e) => e.key === 'Enter' && setIsEditing(false)}
                      autoFocus
                    />
                  ) : (
                    <span
                      className="text-sm font-semibold text-slate-800 truncate cursor-pointer hover:text-blue-600"
                      onClick={() => setIsEditing(true)}
                    >
                      {step.name || step.summary || 'Unnamed Step'}
                    </span>
                  )}
                </div>

                {/* Step Badges */}
                <div className="flex items-center flex-wrap gap-1.5 mt-2">
                  {/* Type Badge */}
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium uppercase border ${typeColor}`}>
                    {stepType}
                  </span>

                  {/* Loop Indicator */}
                  {hasLoop && (
                    <span className="flex items-center space-x-1 text-[10px] px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-medium">
                      <RefreshCw size={10} />
                      <span>Loop: {step.loop?.type}</span>
                    </span>
                  )}

                  {/* Branch Indicator */}
                  {hasBranches && (
                    <span className="flex items-center space-x-1 text-[10px] px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full font-medium">
                      <GitBranch size={10} />
                      <span>{step.branches?.length} branches</span>
                    </span>
                  )}

                  {/* Children Indicator */}
                  {hasChildren && !hasLoop && (
                    <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full font-medium">
                      {step.children?.length} child steps
                    </span>
                  )}

                  {/* Condition Badge */}
                  {step.condition && (
                    <span className="text-[10px] px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full font-mono truncate max-w-[150px]">
                      if: {step.condition}
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-1 ml-3">
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded transition-colors"
                  title="Edit"
                >
                  <Edit2 size={14} />
                </button>
                <button
                  type="button"
                  onClick={onDuplicate}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors"
                  title="Duplicate"
                >
                  <Copy size={14} />
                </button>
                <button
                  type="button"
                  onClick={onDelete}
                  className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                  title="Delete"
                >
                  <Trash2 size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors"
                  title={isExpanded ? 'Collapse' : 'Expand'}
                >
                  {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
              </div>
            </div>

            {/* Quick Config Preview (collapsed state) */}
            {!isExpanded && (step.config?.url || step.config?.method) && step.type !== 'command' && (
              <div className="mt-2 text-xs font-mono text-slate-500 bg-slate-50 px-2 py-1 rounded truncate">
                {step.config?.method && <span className="font-semibold text-slate-700">{step.config.method} </span>}
                {step.config?.url}
              </div>
            )}
            {/* Command Preview (collapsed state) */}
            {!isExpanded && step.type === 'command' && step.config?.cmd && (
              <div className="mt-2 text-xs font-mono bg-slate-900 text-green-400 px-2 py-1 rounded truncate">
                <span className="text-slate-500">$ </span>
                {step.config.cmd} {Array.isArray(step.config?.args) ? step.config.args.join(' ') : ''}
              </div>
            )}
          </div>
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="border-t border-slate-100 p-4 space-y-4 bg-slate-50/50">
            {/* Basic Step Configuration */}
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
                  Condition (optional)
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-lg bg-white focus:border-blue-400 outline-none"
                  placeholder="{{status}} == 200"
                  value={step.condition || ''}
                  onChange={(e) => updateField('condition', e.target.value)}
                />
              </div>
            </div>

            {/* HTTP Config (if type is http) */}
            {(step.type === 'http' || !step.type) && (
              <div className="space-y-3">
                <div className="flex space-x-3">
                  <div className="w-28">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      Method
                    </label>
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
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      URL
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-lg bg-white focus:border-blue-400 outline-none"
                      placeholder="/api/users or {{baseUrl}}/users"
                      value={step.config?.url || ''}
                      onChange={(e) =>
                        updateField('config', { ...step.config, url: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Command Config (if type is command) */}
            {step.type === 'command' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                    Command
                  </label>
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
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                    Arguments (one per line or space-separated)
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
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
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
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
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
                  <div className="bg-slate-900 text-green-400 font-mono text-sm p-3 rounded-lg overflow-x-auto">
                    <span className="text-slate-500">$ </span>
                    {step.config?.cmd || 'command'} {Array.isArray(step.config?.args) ? step.config.args.join(' ') : ''}
                  </div>
                )}
              </div>
            )}

            {/* Outputs Configuration */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                Output Variables (JSON path to variable name)
              </label>
              <div className="text-xs text-slate-400 mb-2">
                Map response paths to variables, e.g., response.body.users -{'>'} userList
              </div>
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
                    <span className="text-slate-400">-{'>'}</span>
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

            {/* Loop Configuration */}
            <LoopConfigEditor
              config={step.loop}
              onChange={handleLoopChange}
              variables={variables}
            />

            {/* Loop Body (if loop enabled) */}
            {hasLoop && (
              <div className="mt-3">
                <ChildStepList
                  children={step.children || []}
                  onChange={handleChildrenChange}
                  variables={variables}
                  containerLabel="Loop Body (executed each iteration)"
                  depth={depth + 1}
                  renderStepCard={renderChildStepCard}
                />
              </div>
            )}

            {/* Branch Configuration */}
            {(hasBranches || step.type === 'branch') && (
              <BranchConfigEditor
                branches={step.branches || []}
                onChange={handleBranchesChange}
                variables={variables}
                renderChildSteps={(children, onChange, label) => (
                  <ChildStepList
                    children={children}
                    onChange={onChange}
                    variables={variables}
                    containerLabel={label}
                    depth={depth + 1}
                    renderStepCard={renderChildStepCard}
                  />
                )}
              />
            )}

            {/* Add Branch Button (if not already has branches and not branch type) */}
            {!hasBranches && step.type !== 'branch' && (
              <button
                type="button"
                onClick={() => handleBranchesChange([{ condition: '', label: 'Branch 1', children: [] }])}
                className="w-full flex items-center justify-center space-x-2 px-3 py-2 text-xs font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 border border-dashed border-purple-300 rounded-lg transition-colors"
              >
                <GitBranch size={14} />
                <span>Add Conditional Branches</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
