import React from 'react';
import { WorkflowStep, BranchConfig, TestStep } from '../../../types';
import { GitBranch, Trash2, Copy } from 'lucide-react';
import { BranchConfigEditor } from './BranchConfigEditor';
import { ChildStepList } from './ChildStepList';
import { StepCard } from './StepCard';

interface BranchStepCardProps {
  step: WorkflowStep;
  index: number;
  onChange: (step: WorkflowStep) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  depth?: number;
}

export const BranchStepCard: React.FC<BranchStepCardProps> = ({
  step,
  index,
  onChange,
  onDelete,
  onDuplicate,
  depth = 0
}) => {
  const branches = (step.config as any)?.branches || [];

  // Render child steps for each branch using full StepCard
  const renderChildSteps = (
    children: TestStep[],
    onChildrenChange: (children: TestStep[]) => void,
    label: string
  ) => {
    return (
      <ChildStepList
        children={children}
        onChange={onChildrenChange}
        containerLabel={label}
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
    );
  };

  return (
    <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4 mb-3" style={{ marginLeft: `${depth * 24}px` }}>
      {/* Branch Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <GitBranch size={16} className="text-purple-600" />
          <span className="font-semibold text-purple-900">{index + 1}. {step.name || 'Branch Step'}</span>
          <span className="text-xs px-2 py-0.5 bg-purple-200 text-purple-700 rounded-full">
            {branches.length} branches
          </span>
        </div>
        <div className="flex items-center space-x-1">
          <button
            onClick={onDuplicate}
            className="p-1.5 text-purple-400 hover:text-purple-600 hover:bg-purple-100 rounded"
            title="Duplicate"
          >
            <Copy size={14} />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 text-purple-400 hover:text-red-500 hover:bg-red-50 rounded"
            title="Delete"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Branch Configuration */}
      <BranchConfigEditor
        branches={branches}
        onChange={(newBranches) => onChange({ ...step, config: { branches: newBranches } })}
        variables={{}}
        renderChildSteps={renderChildSteps}
      />

      {/* Branches Info */}
      <div className="mt-3 pt-3 border-t border-purple-200">
        <div className="space-y-1">
          {branches.map((branch: BranchConfig, idx: number) => (
            <div key={idx} className="text-xs text-purple-600 flex items-center space-x-2">
              <span className="font-mono bg-purple-100 px-2 py-0.5 rounded">{branch.label || `Branch ${idx + 1}`}</span>
              <span className="text-purple-400">→</span>
              <span>{branch.children?.length || 0} steps</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
