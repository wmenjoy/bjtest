import React, { useState } from 'react';
import { LoopConfig as LoopConfigType } from '../../../types';
import { RefreshCw, Hash, List, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';

interface LoopConfigEditorProps {
  config?: LoopConfigType;
  onChange: (config: LoopConfigType | undefined) => void;
  variables?: Record<string, any>;
}

export const LoopConfigEditor: React.FC<LoopConfigEditorProps> = ({
  config,
  onChange,
  variables = {}
}) => {
  const [isExpanded, setIsExpanded] = useState(!!config);

  // Get variable names for autocomplete hints
  const variableNames = Object.keys(variables);

  const handleToggle = () => {
    if (config) {
      onChange(undefined);
      setIsExpanded(false);
    } else {
      // Enable with default forEach config
      onChange({
        type: 'forEach',
        source: '',
        itemVar: 'item',
        indexVar: 'i',
        maxIterations: 100
      });
      setIsExpanded(true);
    }
  };

  const handleTypeChange = (type: 'forEach' | 'while' | 'count') => {
    const baseConfig = {
      type,
      maxIterations: config?.maxIterations || 100
    };

    if (type === 'forEach') {
      onChange({
        ...baseConfig,
        source: config?.source || '',
        itemVar: 'item',
        indexVar: 'i'
      });
    } else if (type === 'while') {
      onChange({
        ...baseConfig,
        condition: config?.condition || ''
      });
    } else if (type === 'count') {
      onChange({
        ...baseConfig,
        count: config?.count || 10
      });
    }
  };

  const updateConfig = (updates: Partial<LoopConfigType>) => {
    if (config) {
      onChange({ ...config, ...updates });
    }
  };

  // Generate preview text based on loop type
  const getLoopPreview = () => {
    if (!config) return '';

    switch (config.type) {
      case 'forEach':
        const source = config.source || '[]';
        const itemVar = config.itemVar || 'item';
        const indexVar = config.indexVar ? ` (index: ${config.indexVar})` : '';
        return `For each ${source} as ${itemVar}${indexVar}`;
      case 'while':
        return `While ${config.condition || 'condition'} is true`;
      case 'count':
        return `Repeat ${config.count || 0} times`;
      default:
        return '';
    }
  };

  return (
    <div className="border border-blue-200 rounded-lg bg-blue-50/50 overflow-hidden">
      {/* Header with toggle */}
      <div
        className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-blue-100/50 transition-colors"
        onClick={() => config && setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-2">
          <RefreshCw size={14} className={config ? 'text-blue-600' : 'text-slate-400'} />
          <span className="text-sm font-medium text-slate-700">Loop Configuration</span>
          {config && (
            <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-medium">
              {config.type}
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {/* Toggle Switch */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleToggle();
            }}
            className={`relative w-10 h-5 rounded-full transition-colors ${
              config ? 'bg-blue-500' : 'bg-slate-300'
            }`}
          >
            <div
              className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                config ? 'translate-x-5' : 'translate-x-0.5'
              }`}
            />
          </button>
          {config && (
            isExpanded ? (
              <ChevronUp size={16} className="text-slate-400" />
            ) : (
              <ChevronDown size={16} className="text-slate-400" />
            )
          )}
        </div>
      </div>

      {/* Loop Preview */}
      {config && !isExpanded && (
        <div className="px-3 pb-2">
          <p className="text-xs text-blue-600 font-mono bg-blue-100/50 px-2 py-1 rounded">
            {getLoopPreview()}
          </p>
        </div>
      )}

      {/* Expanded Configuration */}
      {config && isExpanded && (
        <div className="border-t border-blue-200 p-3 space-y-4">
          {/* Loop Type Selector */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">
              Loop Type
            </label>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => handleTypeChange('forEach')}
                className={`flex-1 flex items-center justify-center space-x-1.5 px-3 py-2 text-xs font-medium rounded-lg border transition-all ${
                  config.type === 'forEach'
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
                }`}
              >
                <List size={14} />
                <span>ForEach</span>
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange('while')}
                className={`flex-1 flex items-center justify-center space-x-1.5 px-3 py-2 text-xs font-medium rounded-lg border transition-all ${
                  config.type === 'while'
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
                }`}
              >
                <RefreshCw size={14} />
                <span>While</span>
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange('count')}
                className={`flex-1 flex items-center justify-center space-x-1.5 px-3 py-2 text-xs font-medium rounded-lg border transition-all ${
                  config.type === 'count'
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
                }`}
              >
                <Hash size={14} />
                <span>Count</span>
              </button>
            </div>
          </div>

          {/* ForEach Configuration */}
          {config.type === 'forEach' && (
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  Source Array
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-lg bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none"
                  placeholder="{{userList}} or response.data.items"
                  value={config.source || ''}
                  onChange={(e) => updateConfig({ source: e.target.value })}
                />
                {variableNames.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {variableNames.slice(0, 4).map((v) => (
                      <button
                        key={v}
                        type="button"
                        className="px-1.5 py-0.5 text-[10px] font-mono bg-slate-100 text-slate-600 rounded hover:bg-slate-200"
                        onClick={() => updateConfig({ source: `{{${v}}}` })}
                      >
                        {`{{${v}}}`}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                    Item Variable
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-lg bg-white focus:border-blue-400 outline-none"
                    placeholder="item"
                    value={config.itemVar || ''}
                    onChange={(e) => updateConfig({ itemVar: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                    Index Variable
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-lg bg-white focus:border-blue-400 outline-none"
                    placeholder="i"
                    value={config.indexVar || ''}
                    onChange={(e) => updateConfig({ indexVar: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}

          {/* While Configuration */}
          {config.type === 'while' && (
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                Condition
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-lg bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none"
                placeholder="{{hasMore}} == true"
                value={config.condition || ''}
                onChange={(e) => updateConfig({ condition: e.target.value })}
              />
              <p className="mt-1 text-[10px] text-slate-400">
                Loop continues while this condition evaluates to true
              </p>
            </div>
          )}

          {/* Count Configuration */}
          {config.type === 'count' && (
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                Number of Iterations
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-lg bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none"
                placeholder="10 or {{retryCount}}"
                value={config.count?.toString() || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  const num = parseInt(val);
                  updateConfig({ count: isNaN(num) ? val : num });
                }}
              />
            </div>
          )}

          {/* Max Iterations (Safety) */}
          <div className="pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5">
                <AlertCircle size={12} className="text-amber-500" />
                <label className="text-[10px] font-bold text-slate-500 uppercase">
                  Max Iterations (Safety Limit)
                </label>
              </div>
              <input
                type="number"
                className="w-20 px-2 py-1 text-xs font-mono border border-slate-200 rounded bg-white focus:border-blue-400 outline-none text-center"
                value={config.maxIterations || 100}
                min={1}
                max={10000}
                onChange={(e) => updateConfig({ maxIterations: parseInt(e.target.value) || 100 })}
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Prevents infinite loops. Default: 100
            </p>
          </div>

          {/* Preview */}
          <div className="bg-slate-100 rounded-lg p-3">
            <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Preview</p>
            <p className="text-sm text-slate-700 font-mono">{getLoopPreview()}</p>
            <p className="text-[10px] text-slate-400 mt-1">Max: {config.maxIterations || 100} iterations</p>
          </div>
        </div>
      )}
    </div>
  );
};
