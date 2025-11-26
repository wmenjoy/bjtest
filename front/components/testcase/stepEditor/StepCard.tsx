
import React, { useState, useEffect } from 'react';
import { TestStep, BranchConfig } from '../../../types';
import {
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
  GripVertical,
  Package,
  Settings
} from 'lucide-react';
import { BranchConfigEditor } from './BranchConfigEditor';
import { ChildStepList } from './ChildStepList';
import { ActionTemplateSelector } from './ActionTemplateSelector';
import { TemplateConfigSection } from './TemplateConfigSection';
import { InlineConfigSection } from './InlineConfigSection';
import { actionTemplateApi, ActionTemplate } from '../../../services/api/actionTemplateApi';

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
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ActionTemplate | null>(null);

  // Load template details if actionTemplateId is set
  useEffect(() => {
    if (step.linkedScriptId && !selectedTemplate) {
      // linkedScriptId is being used as actionTemplateId for now
      actionTemplateApi.getTemplate(step.linkedScriptId)
        .then(setSelectedTemplate)
        .catch(console.error);
    }
  }, [step.linkedScriptId, selectedTemplate]);

  // Calculate left margin based on depth
  const marginLeft = depth * 24;

  // Check if step has control flow
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

  // Handle template selection
  const handleTemplateSelect = (template: ActionTemplate) => {
    setSelectedTemplate(template);

    // Initialize inputs from template parameters
    const initialInputs: Record<string, string> = {};
    template.parameters?.forEach((param: any) => {
      initialInputs[param.name] = param.defaultValue || '';
    });

    // Update step with template reference
    onChange({
      ...step,
      linkedScriptId: template.templateId, // Using linkedScriptId as actionTemplateId
      type: template.type,
      name: step.name || template.name,
      inputs: initialInputs,
      outputs: {},
      config: template.configTemplate || {}
    });

    setShowTemplateSelector(false);

    // Record usage
    actionTemplateApi.recordUsage(template.templateId).catch(console.error);
  };

  // Mode detection
  const isTemplateMode = !!step.actionTemplateId || !!step.linkedScriptId;
  const isInlineMode = !isTemplateMode;

  // Switch to template mode
  const switchToTemplateMode = () => {
    setShowTemplateSelector(true);
  };

  // Switch to inline mode (unlink template)
  const switchToInlineMode = () => {
    setSelectedTemplate(null);
    onChange({
      ...step,
      linkedScriptId: undefined,
      actionTemplateId: undefined,
      actionVersion: undefined,
      inputs: undefined,
      // Keep config for inline mode
    });
  };

  // Handle children change
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
              hasBranches ? 'bg-purple-50' : 'bg-slate-50'
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

                  {/* Mode indicator badge */}
                  {isTemplateMode && (
                    <span className="text-[10px] px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-medium flex items-center space-x-1">
                      <Package size={10} />
                      <span>Template</span>
                    </span>
                  )}
                  {isInlineMode && (
                    <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full font-medium flex items-center space-x-1">
                      <Settings size={10} />
                      <span>Inline</span>
                    </span>
                  )}
                </div>

                {/* Step Badges */}
                <div className="flex items-center flex-wrap gap-1.5 mt-2">
                  {/* Type Badge */}
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium uppercase border ${typeColor}`}>
                    {stepType}
                  </span>

                  {/* Branch Indicator */}
                  {hasBranches && (
                    <span className="flex items-center space-x-1 text-[10px] px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full font-medium">
                      <GitBranch size={10} />
                      <span>{step.branches?.length} branches</span>
                    </span>
                  )}

                  {/* Children Indicator */}
                  {hasChildren && (
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
            {/* Mode Selector (prominent at top) */}
            <div className="bg-white border border-slate-200 rounded-lg p-3">
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">
                Configuration Mode
              </label>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={switchToTemplateMode}
                  className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 text-sm font-medium rounded-lg border transition-all ${
                    isTemplateMode
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:bg-blue-50'
                  }`}
                >
                  <Package size={16} />
                  <span>Use Action Template</span>
                  {isTemplateMode && <span className="text-xs">(Active)</span>}
                </button>

                <button
                  type="button"
                  onClick={switchToInlineMode}
                  className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 text-sm font-medium rounded-lg border transition-all ${
                    isInlineMode
                      ? 'bg-slate-600 text-white border-slate-600 shadow-md'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <Settings size={16} />
                  <span>Custom Configuration</span>
                  {isInlineMode && <span className="text-xs">(Active)</span>}
                </button>
              </div>
            </div>

            {/* Template Mode Configuration */}
            {isTemplateMode && (
              <TemplateConfigSection
                step={step}
                selectedTemplate={selectedTemplate}
                onChange={onChange}
                onShowSelector={() => setShowTemplateSelector(true)}
                onUnlink={switchToInlineMode}
              />
            )}

            {/* Inline Mode Configuration */}
            {isInlineMode && (
              <InlineConfigSection
                step={step}
                onChange={onChange}
              />
            )}

            {/* Common Configuration (always visible) */}
            <div className="space-y-3">
              {/* Branch Configuration */}
              {(hasBranches || step.type === 'branch') && (
                <BranchConfigEditor
                  branches={step.branches || []}
                  onChange={(branches) => onChange({ ...step, branches })}
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
            </div>
          </div>
        )}
      </div>

      {/* Action Template Selector Modal */}
      {showTemplateSelector && (
        <ActionTemplateSelector
          projectId="default" // TODO: Get from context
          onSelect={handleTemplateSelect}
          onClose={() => setShowTemplateSelector(false)}
          selectedTemplateId={step.linkedScriptId}
        />
      )}
    </div>
  );
};
