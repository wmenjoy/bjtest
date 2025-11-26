import React, { useState } from 'react';
import { BranchConfig, TestStep } from '../../../types';
import { GitBranch, Plus, Trash2, GripVertical, ChevronDown, ChevronUp, Check } from 'lucide-react';
import { ConditionEditor } from './ConditionEditor';

interface BranchConfigEditorProps {
  branches: BranchConfig[];
  onChange: (branches: BranchConfig[]) => void;
  variables?: Record<string, any>;
  renderChildSteps?: (
    children: TestStep[],
    onChange: (children: TestStep[]) => void,
    label: string
  ) => React.ReactNode;
}

export const BranchConfigEditor: React.FC<BranchConfigEditorProps> = ({
  branches,
  onChange,
  variables = {},
  renderChildSteps
}) => {
  const [expandedBranches, setExpandedBranches] = useState<Set<number>>(new Set([0]));
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const toggleExpand = (index: number) => {
    const newExpanded = new Set(expandedBranches);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedBranches(newExpanded);
  };

  const addBranch = () => {
    const newBranch: BranchConfig = {
      condition: '',
      label: `Branch ${branches.length + 1}`,
      children: []
    };
    onChange([...branches, newBranch]);
    setExpandedBranches(new Set([...expandedBranches, branches.length]));
  };

  const addDefaultBranch = () => {
    // Check if default branch already exists
    const hasDefault = branches.some(b => b.condition === 'default');
    if (hasDefault) return;

    const newBranch: BranchConfig = {
      condition: 'default',
      label: 'Default (else)',
      children: []
    };
    onChange([...branches, newBranch]);
    setExpandedBranches(new Set([...expandedBranches, branches.length]));
  };

  const updateBranch = (index: number, updates: Partial<BranchConfig>) => {
    const newBranches = [...branches];
    newBranches[index] = { ...newBranches[index], ...updates };
    onChange(newBranches);
  };

  const removeBranch = (index: number) => {
    const newBranches = branches.filter((_, i) => i !== index);
    onChange(newBranches);

    // Update expanded indices
    const newExpanded = new Set<number>();
    expandedBranches.forEach(i => {
      if (i < index) newExpanded.add(i);
      else if (i > index) newExpanded.add(i - 1);
    });
    setExpandedBranches(newExpanded);
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newBranches = [...branches];
    const draggedItem = newBranches[draggedIndex];
    newBranches.splice(draggedIndex, 1);
    newBranches.splice(index, 0, draggedItem);
    onChange(newBranches);

    // Update expanded indices accordingly
    const newExpanded = new Set<number>();
    expandedBranches.forEach(i => {
      if (i === draggedIndex) {
        newExpanded.add(index);
      } else if (draggedIndex < index) {
        if (i > draggedIndex && i <= index) newExpanded.add(i - 1);
        else newExpanded.add(i);
      } else {
        if (i >= index && i < draggedIndex) newExpanded.add(i + 1);
        else newExpanded.add(i);
      }
    });
    setExpandedBranches(newExpanded);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const hasDefaultBranch = branches.some(b => b.condition === 'default');

  return (
    <div className="border border-purple-200 rounded-lg bg-purple-50/50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-purple-200 bg-purple-100/50">
        <div className="flex items-center space-x-2">
          <GitBranch size={14} className="text-purple-600" />
          <span className="text-sm font-medium text-slate-700">Branch Configuration</span>
          <span className="text-xs px-2 py-0.5 bg-purple-200 text-purple-700 rounded-full font-medium">
            {branches.length} branches
          </span>
        </div>
      </div>

      {/* Branches List */}
      <div className="p-3 space-y-2">
        {branches.length === 0 ? (
          <div className="text-center py-6 text-slate-400">
            <GitBranch size={24} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">No branches defined</p>
            <p className="text-xs mt-1">Add conditions to create different execution paths</p>
          </div>
        ) : (
          branches.map((branch, index) => (
            <div
              key={index}
              className={`border rounded-lg bg-white overflow-hidden transition-all ${
                draggedIndex === index ? 'ring-2 ring-purple-400' : 'border-slate-200'
              }`}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
            >
              {/* Branch Header */}
              <div
                className={`flex items-center space-x-2 px-3 py-2 cursor-pointer hover:bg-slate-50 ${
                  branch.condition === 'default' ? 'bg-amber-50' : ''
                }`}
                onClick={() => toggleExpand(index)}
              >
                <div className="cursor-grab text-slate-300 hover:text-slate-500">
                  <GripVertical size={14} />
                </div>

                {/* Branch indicator */}
                <div className={`w-6 h-6 rounded flex items-center justify-center ${
                  branch.condition === 'default'
                    ? 'bg-amber-100 text-amber-600'
                    : 'bg-purple-100 text-purple-600'
                }`}>
                  {index + 1}
                </div>

                {/* Label */}
                <div className="flex-1 min-w-0">
                  <input
                    type="text"
                    className="w-full text-sm font-medium text-slate-700 bg-transparent border-none p-0 focus:ring-0 truncate"
                    value={branch.label || ''}
                    placeholder={branch.condition === 'default' ? 'Default (else)' : 'Branch label'}
                    onChange={(e) => updateBranch(index, { label: e.target.value })}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <p className="text-[10px] font-mono text-slate-400 truncate">
                    {branch.condition === 'default' ? 'Fallback branch' : branch.condition || 'No condition'}
                  </p>
                </div>

                {/* Child count */}
                {branch.children.length > 0 && (
                  <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded">
                    {branch.children.length} steps
                  </span>
                )}

                {/* Actions */}
                <button
                  type="button"
                  className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeBranch(index);
                  }}
                >
                  <Trash2 size={14} />
                </button>
                {expandedBranches.has(index) ? (
                  <ChevronUp size={16} className="text-slate-400" />
                ) : (
                  <ChevronDown size={16} className="text-slate-400" />
                )}
              </div>

              {/* Expanded Content */}
              {expandedBranches.has(index) && (
                <div className="border-t border-slate-100 p-3 space-y-3">
                  {/* Condition Editor (not for default branch) */}
                  {branch.condition !== 'default' && (
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">
                        Condition
                      </label>
                      <ConditionEditor
                        value={branch.condition}
                        onChange={(value) => updateBranch(index, { condition: value })}
                        variables={variables}
                        placeholder="e.g., {{user.role}} == 'admin'"
                      />
                    </div>
                  )}

                  {/* Default branch notice */}
                  {branch.condition === 'default' && (
                    <div className="flex items-center space-x-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
                      <Check size={14} className="text-amber-600" />
                      <span className="text-sm text-amber-700">
                        This branch executes when no other conditions match
                      </span>
                    </div>
                  )}

                  {/* Child Steps */}
                  {renderChildSteps ? (
                    <div className="mt-3">
                      {renderChildSteps(
                        branch.children,
                        (newChildren) => updateBranch(index, { children: newChildren }),
                        `Branch: ${branch.label || `#${index + 1}`}`
                      )}
                    </div>
                  ) : (
                    <div className="mt-3 p-4 bg-slate-50 rounded-lg border border-dashed border-slate-300">
                      <p className="text-xs text-slate-400 text-center">
                        {branch.children.length} child step(s) - Use ChildStepList to render
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}

        {/* Add Branch Buttons */}
        <div className="flex space-x-2 pt-2">
          <button
            type="button"
            onClick={addBranch}
            className="flex-1 flex items-center justify-center space-x-1.5 px-3 py-2 text-xs font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 border border-dashed border-purple-300 rounded-lg transition-colors"
          >
            <Plus size={14} />
            <span>Add Branch</span>
          </button>
          {!hasDefaultBranch && (
            <button
              type="button"
              onClick={addDefaultBranch}
              className="flex items-center justify-center space-x-1.5 px-3 py-2 text-xs font-medium text-amber-600 bg-amber-50 hover:bg-amber-100 border border-dashed border-amber-300 rounded-lg transition-colors"
            >
              <Plus size={14} />
              <span>Add Default</span>
            </button>
          )}
        </div>
      </div>

      {/* Visual Tree Preview */}
      {branches.length > 0 && (
        <div className="border-t border-purple-200 p-3 bg-slate-50">
          <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Branch Structure</p>
          <div className="font-mono text-xs text-slate-600">
            {branches.map((branch, index) => (
              <div key={index} className="flex items-center space-x-1">
                <span className={index === branches.length - 1 ? 'text-slate-300' : 'text-slate-300'}>
                  {index === branches.length - 1 ? ' -- ' : ' |-- '}
                </span>
                <span className={branch.condition === 'default' ? 'text-amber-600' : 'text-purple-600'}>
                  {branch.condition === 'default'
                    ? 'default'
                    : branch.condition
                      ? `${branch.condition.substring(0, 30)}${branch.condition.length > 30 ? '...' : ''}`
                      : '(no condition)'}
                </span>
                <span className="text-slate-400">
                  {' -> '}{branch.label || `[${branch.children.length} steps]`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};