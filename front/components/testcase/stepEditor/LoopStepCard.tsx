
import React from 'react';
import { WorkflowStep, LoopConfig, TestStep } from '../../../types';
import { RefreshCw, Trash2, Copy } from 'lucide-react';
import { LoopConfigEditor } from './LoopConfigEditor';
import { ChildStepList } from './ChildStepList';
import { StepCard } from './StepCard';

interface LoopStepCardProps {
  step: WorkflowStep;
  index: number;
  onChange: (step: WorkflowStep) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  depth?: number;
}

export const LoopStepCard: React.FC<LoopStepCardProps> = ({
  step,
  index,
  onChange,
  onDelete,
  onDuplicate,
  depth = 0
}) => {
  const loopConfig = step.config as LoopConfig;

  return (
    <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-3" style={{ marginLeft: `${depth * 24}px` }}>
      {/* Loop Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <RefreshCw size={16} className="text-blue-600" />
          <span className="font-semibold text-blue-900">{index + 1}. {step.name || 'Loop Step'}</span>
          <span className="text-xs px-2 py-0.5 bg-blue-200 text-blue-700 rounded-full">
            {loopConfig?.type || 'forEach'}
          </span>
        </div>
        <div className="flex items-center space-x-1">
          <button
            onClick={onDuplicate}
            className="p-1.5 text-blue-400 hover:text-blue-600 hover:bg-blue-100 rounded"
            title="Duplicate"
          >
            <Copy size={14} />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 text-blue-400 hover:text-red-500 hover:bg-red-50 rounded"
            title="Delete"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Loop Configuration */}
      <LoopConfigEditor
        config={loopConfig}
        onChange={(config) => onChange({ ...step, config })}
        variables={{}}
      />

      {/* Child Steps */}
      <div className="mt-3 pt-3 border-t border-blue-200">
        <ChildStepList
          children={(step.children as TestStep[]) || []}
          onChange={(newChildren) => onChange({ ...step, children: newChildren })}
          containerLabel="Loop Body"
          depth={depth + 1}
          variables={{}}
          renderStepCard={(childStep, childIndex, onChildChange, onChildDelete, onChildDuplicate, childDepth) => (
            <StepCard
              step={childStep}
              index={childIndex}
              onChange={onChildChange}
              onDelete={onChildDelete}
              onDuplicate={onChildDuplicate}
              variables={{}}
              depth={childDepth}
              draggable={false}
              onDragStart={() => {}}
              onDragOver={() => {}}
              onDragEnd={() => {}}
            />
          )}
        />
      </div>
    </div>
  );
};
