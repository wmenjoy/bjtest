import React, { useState } from 'react';
import { DataMapper } from '../../../types';
import { ArrowRight, Trash2, Edit2, Zap } from 'lucide-react';
import { TransformFunctionSelector } from './TransformFunctionSelector';

interface MappingLineProps {
  mapper: DataMapper;
  onDelete: () => void;
  onChange: (mapper: DataMapper) => void;
}

/**
 * MappingLine Component
 *
 * Displays a single data mapping relationship with visual flow
 * Shows: sourceStep.sourcePath → [transform] → targetParam
 *
 * Features:
 * - Visual data flow with color coding (blue source, green target)
 * - Transform function badge (purple)
 * - Hover to show edit/delete actions
 * - Click transform badge to open advanced selector
 * - Inline editing mode for source path and target parameter
 */
export const MappingLine: React.FC<MappingLineProps> = ({
  mapper,
  onDelete,
  onChange
}) => {
  const [showTransformSelect, setShowTransformSelect] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="relative mb-2">
      <div className="flex items-center space-x-2 p-3 bg-white border border-slate-200 rounded-lg hover:shadow-sm transition-all group">
        {/* Source field */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-1">
            <span className="text-xs font-mono text-blue-600 truncate">
              {mapper.sourceStep}
            </span>
            <span className="text-slate-400 text-xs">.</span>
            <span className="text-xs font-mono text-slate-700 truncate">
              {mapper.sourcePath}
            </span>
          </div>
        </div>

        {/* Arrow + Transform */}
        <div className="flex items-center space-x-1">
          <ArrowRight size={14} className="text-slate-400" />

          {/* Transform function badge */}
          {mapper.transform && (
            <button
              onClick={() => setShowTransformSelect(true)}
              className="flex items-center space-x-1 text-xs px-2 py-1 bg-purple-100 text-purple-700 hover:bg-purple-200 rounded transition-colors"
              title="Click to change transformation"
            >
              <Zap size={10} />
              <span>{mapper.transform}</span>
            </button>
          )}

          {/* Add transform button */}
          {!mapper.transform && (
            <button
              onClick={() => setShowTransformSelect(true)}
              className="text-xs px-2 py-1 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded transition-colors opacity-0 group-hover:opacity-100"
              title="Add transformation"
            >
              + Transform
            </button>
          )}
        </div>

        {/* Target parameter */}
        <div className="flex-1 min-w-0">
          <span className="text-xs font-mono text-green-600 truncate">
            {mapper.targetParam}
          </span>
        </div>

        {/* Action buttons */}
        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => setIsEditing(true)}
            className="p-1 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded transition-colors"
            title="Edit mapping"
          >
            <Edit2 size={12} />
          </button>
          <button
            onClick={onDelete}
            className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
            title="Delete mapping"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {/* Transform function selector */}
      {showTransformSelect && (
        <TransformFunctionSelector
          value={mapper.transform || ''}
          onChange={(transform) => {
            onChange({ ...mapper, transform: transform || undefined });
            setShowTransformSelect(false);
          }}
          onClose={() => setShowTransformSelect(false)}
        />
      )}

      {/* Edit mode (optional - for advanced editing) */}
      {isEditing && (
        <div className="absolute inset-0 z-10 bg-white border-2 border-blue-400 rounded-lg p-3 shadow-lg">
          <div className="space-y-2">
            <div>
              <label className="block text-xs text-slate-600 mb-1">Source Path (JSONPath)</label>
              <input
                type="text"
                className="w-full px-2 py-1 text-xs font-mono border border-slate-200 rounded"
                value={mapper.sourcePath}
                onChange={(e) => onChange({ ...mapper, sourcePath: e.target.value })}
                placeholder="response.body.token"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-600 mb-1">Target Parameter</label>
              <input
                type="text"
                className="w-full px-2 py-1 text-xs font-mono border border-slate-200 rounded"
                value={mapper.targetParam}
                onChange={(e) => onChange({ ...mapper, targetParam: e.target.value })}
                placeholder="authToken"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setIsEditing(false)}
                className="px-3 py-1 text-xs text-slate-600 hover:bg-slate-100 rounded"
              >
                Cancel
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="px-3 py-1 text-xs bg-blue-600 text-white hover:bg-blue-700 rounded"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MappingLine;
