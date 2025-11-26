/**
 * BranchVisualization - Branch decision display for conditional execution
 *
 * Features:
 * - Shows the evaluated condition expression
 * - Highlights the selected branch
 * - Tree view of all branches with condition results
 * - Visual indicator: checkmark for selected, X for not selected
 */

import React from 'react';
import {
  GitBranch,
  Check,
  X,
  ChevronRight,
  Code,
  ArrowRight,
} from 'lucide-react';
import { BranchExecution } from '../../../types';

export interface BranchVisualizationProps {
  /** Branch execution data */
  branchExecution: BranchExecution;
  /** All available branches for complete visualization (optional) */
  allBranches?: Array<{
    condition: string;
    label?: string;
  }>;
}

/**
 * Format the evaluated value for display
 */
const formatEvaluatedValue = (value: any): string => {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};

/**
 * Determine if a condition looks like a default/else branch
 */
const isDefaultBranch = (condition: string): boolean => {
  const normalized = condition.toLowerCase().trim();
  return normalized === 'default' || normalized === 'else' || normalized === 'true' || normalized === '*';
};

export const BranchVisualization: React.FC<BranchVisualizationProps> = ({
  branchExecution,
  allBranches,
}) => {
  const { condition, evaluatedValue, selectedBranch } = branchExecution;

  // If allBranches is not provided, create a minimal visualization
  const branches = allBranches || [
    { condition, label: selectedBranch },
  ];

  return (
    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2 text-amber-700 text-sm font-medium">
          <GitBranch size={14} />
          <span>Branch Decision</span>
        </div>
        <div className="flex items-center space-x-1 text-xs">
          <span className="text-amber-500">Selected:</span>
          <span className="font-medium text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
            {selectedBranch || 'default'}
          </span>
        </div>
      </div>

      {/* Evaluated Condition */}
      <div className="mb-3 p-2 bg-white border border-amber-200 rounded">
        <div className="flex items-center space-x-2 mb-1">
          <Code size={12} className="text-amber-500" />
          <span className="text-[10px] text-amber-500 uppercase font-bold">
            Condition Evaluated
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <code className="text-xs font-mono text-slate-700 bg-slate-100 px-2 py-1 rounded flex-1">
            {condition}
          </code>
          <ArrowRight size={14} className="text-amber-400 shrink-0" />
          <span className={`text-xs font-mono font-bold px-2 py-1 rounded ${
            evaluatedValue ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {formatEvaluatedValue(evaluatedValue)}
          </span>
        </div>
      </div>

      {/* Branch Tree */}
      <div className="space-y-1.5">
        <span className="text-[10px] text-amber-500 uppercase font-bold block mb-2">
          Branches
        </span>

        {branches.map((branch, idx) => {
          const isSelected = branch.condition === condition || branch.label === selectedBranch;
          const isDefault = isDefaultBranch(branch.condition);

          return (
            <div
              key={idx}
              className={`flex items-center space-x-2 p-2 rounded transition-all ${
                isSelected
                  ? 'bg-green-100 border border-green-300'
                  : 'bg-white border border-amber-100'
              }`}
            >
              {/* Selection Indicator */}
              <div className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${
                isSelected ? 'bg-green-500' : 'bg-slate-200'
              }`}>
                {isSelected ? (
                  <Check size={12} className="text-white" />
                ) : (
                  <X size={12} className="text-slate-400" />
                )}
              </div>

              {/* Branch Arrow */}
              <ChevronRight size={14} className={isSelected ? 'text-green-600' : 'text-slate-300'} />

              {/* Condition/Label */}
              <div className="flex-1 flex items-center space-x-2">
                {isDefault ? (
                  <span className="text-xs font-medium text-slate-500 italic">
                    default (else)
                  </span>
                ) : (
                  <code className={`text-xs font-mono ${
                    isSelected ? 'text-green-700' : 'text-slate-500'
                  }`}>
                    {branch.condition}
                  </code>
                )}

                {branch.label && branch.label !== branch.condition && (
                  <span className={`text-xs px-1.5 py-0.5 rounded ${
                    isSelected
                      ? 'bg-green-200 text-green-700'
                      : 'bg-slate-100 text-slate-500'
                  }`}>
                    {branch.label}
                  </span>
                )}
              </div>

              {/* Selected Badge */}
              {isSelected && (
                <span className="text-[10px] font-bold text-green-600 uppercase">
                  Selected
                </span>
              )}
            </div>
          );
        })}

        {/* If we only have the selected branch, show an indicator for other branches */}
        {!allBranches && branches.length === 1 && (
          <div className="flex items-center space-x-2 p-2 bg-slate-50 border border-slate-200 rounded text-xs text-slate-400 italic">
            <X size={12} />
            <span>Other branches not executed</span>
          </div>
        )}
      </div>

      {/* Visual Flow Indicator */}
      <div className="mt-3 pt-3 border-t border-amber-200">
        <div className="flex items-center justify-center space-x-2 text-xs text-amber-600">
          <GitBranch size={12} />
          <span>Execution continued via</span>
          <span className="font-bold bg-amber-100 px-2 py-0.5 rounded">
            {selectedBranch || 'default'}
          </span>
          <span>branch</span>
        </div>
      </div>
    </div>
  );
};
