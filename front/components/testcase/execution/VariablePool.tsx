/**
 * VariablePool - Variable state display component
 *
 * Features:
 * - Collapsible sections for organization
 * - JSON tree view for complex values
 * - Search/filter functionality
 * - Highlight recently changed variables
 * - Show loop variables: $loopIndex, $loopItem, etc.
 */

import React, { useState, useMemo } from 'react';
import {
  Search,
  ChevronDown,
  ChevronRight,
  Braces,
  Hash,
  Type,
  ToggleLeft,
  List,
  Sparkles,
  Repeat,
} from 'lucide-react';

export interface VariablePoolProps {
  /** Current variable pool state */
  variables: Record<string, any>;
  /** Variable names to highlight (recently changed) */
  highlights?: string[];
  /** Maximum depth for JSON tree expansion */
  maxDepth?: number;
}

/**
 * Get icon for variable type
 */
const getTypeIcon = (value: any): React.ReactNode => {
  if (value === null || value === undefined) return <Type size={12} className="text-slate-400" />;
  if (typeof value === 'string') return <Type size={12} className="text-green-500" />;
  if (typeof value === 'number') return <Hash size={12} className="text-blue-500" />;
  if (typeof value === 'boolean') return <ToggleLeft size={12} className="text-purple-500" />;
  if (Array.isArray(value)) return <List size={12} className="text-orange-500" />;
  if (typeof value === 'object') return <Braces size={12} className="text-amber-500" />;
  return <Type size={12} className="text-slate-400" />;
};

/**
 * Get type label for variable
 */
const getTypeLabel = (value: any): string => {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (typeof value === 'string') return 'string';
  if (typeof value === 'number') return 'number';
  if (typeof value === 'boolean') return 'boolean';
  if (Array.isArray(value)) return `array[${value.length}]`;
  if (typeof value === 'object') return `object{${Object.keys(value).length}}`;
  return typeof value;
};

/**
 * Check if variable is a loop variable
 */
const isLoopVariable = (name: string): boolean => {
  return name.startsWith('$loop') || name.startsWith('$item') || name.startsWith('$index');
};

/**
 * Check if variable is a system variable
 */
const isSystemVariable = (name: string): boolean => {
  return name.startsWith('$') || name.startsWith('_');
};

/**
 * JsonTreeNode - Recursive component for displaying JSON values
 */
interface JsonTreeNodeProps {
  name: string;
  value: any;
  depth: number;
  maxDepth: number;
  isHighlighted: boolean;
}

const JsonTreeNode: React.FC<JsonTreeNodeProps> = ({
  name,
  value,
  depth,
  maxDepth,
  isHighlighted,
}) => {
  const [expanded, setExpanded] = useState(depth < 1);
  const isExpandable = typeof value === 'object' && value !== null;
  const canExpand = depth < maxDepth;

  // Format primitive value for display
  const formatValue = (val: any): string => {
    if (val === null) return 'null';
    if (val === undefined) return 'undefined';
    if (typeof val === 'string') return `"${val.length > 50 ? val.slice(0, 50) + '...' : val}"`;
    if (typeof val === 'boolean') return val ? 'true' : 'false';
    return String(val);
  };

  // Get color class for value
  const getValueColor = (val: any): string => {
    if (val === null || val === undefined) return 'text-slate-400';
    if (typeof val === 'string') return 'text-green-600';
    if (typeof val === 'number') return 'text-blue-600';
    if (typeof val === 'boolean') return 'text-purple-600';
    return 'text-slate-600';
  };

  return (
    <div className={`${isHighlighted ? 'bg-yellow-50 -mx-2 px-2 rounded' : ''}`}>
      <div
        className={`flex items-center space-x-1.5 py-1 group ${isExpandable && canExpand ? 'cursor-pointer hover:bg-slate-50 -mx-1 px-1 rounded' : ''}`}
        onClick={() => isExpandable && canExpand && setExpanded(!expanded)}
      >
        {/* Expand/Collapse */}
        {isExpandable && canExpand ? (
          <button className="shrink-0 w-4 h-4 flex items-center justify-center">
            {expanded ? (
              <ChevronDown size={12} className="text-slate-400" />
            ) : (
              <ChevronRight size={12} className="text-slate-400" />
            )}
          </button>
        ) : (
          <div className="w-4" />
        )}

        {/* Type Icon */}
        <div className="shrink-0">{getTypeIcon(value)}</div>

        {/* Name */}
        <span className={`font-medium text-xs ${isLoopVariable(name) ? 'text-orange-600' : isSystemVariable(name) ? 'text-purple-600' : 'text-slate-700'}`}>
          {name}
        </span>

        {/* Colon */}
        <span className="text-slate-400 text-xs">:</span>

        {/* Value Preview or Type Label */}
        {isExpandable ? (
          <span className="text-[10px] text-slate-400 font-mono">
            {getTypeLabel(value)}
          </span>
        ) : (
          <span className={`text-xs font-mono truncate max-w-[200px] ${getValueColor(value)}`}>
            {formatValue(value)}
          </span>
        )}

        {/* Highlight indicator */}
        {isHighlighted && (
          <Sparkles size={10} className="text-yellow-500 shrink-0 ml-auto" />
        )}
      </div>

      {/* Expanded Children */}
      {isExpandable && canExpand && expanded && (
        <div className="ml-4 border-l border-slate-200 pl-2">
          {Array.isArray(value) ? (
            value.map((item, idx) => (
              <JsonTreeNode
                key={idx}
                name={`[${idx}]`}
                value={item}
                depth={depth + 1}
                maxDepth={maxDepth}
                isHighlighted={false}
              />
            ))
          ) : (
            Object.entries(value).map(([key, val]) => (
              <JsonTreeNode
                key={key}
                name={key}
                value={val}
                depth={depth + 1}
                maxDepth={maxDepth}
                isHighlighted={false}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
};

export const VariablePool: React.FC<VariablePoolProps> = ({
  variables,
  highlights = [],
  maxDepth = 3,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showLoopVars, setShowLoopVars] = useState(true);
  const [showSystemVars, setShowSystemVars] = useState(false);

  // Categorize variables
  const categorizedVars = useMemo(() => {
    const loopVars: Record<string, any> = {};
    const systemVars: Record<string, any> = {};
    const userVars: Record<string, any> = {};

    Object.entries(variables).forEach(([key, value]) => {
      if (isLoopVariable(key)) {
        loopVars[key] = value;
      } else if (isSystemVariable(key)) {
        systemVars[key] = value;
      } else {
        userVars[key] = value;
      }
    });

    return { loopVars, systemVars, userVars };
  }, [variables]);

  // Filter variables by search query
  const filteredVars = useMemo(() => {
    if (!searchQuery.trim()) {
      return {
        loopVars: categorizedVars.loopVars,
        systemVars: categorizedVars.systemVars,
        userVars: categorizedVars.userVars,
      };
    }

    const query = searchQuery.toLowerCase();
    const filterObj = (obj: Record<string, any>) => {
      return Object.fromEntries(
        Object.entries(obj).filter(([key, value]) => {
          return (
            key.toLowerCase().includes(query) ||
            JSON.stringify(value).toLowerCase().includes(query)
          );
        })
      );
    };

    return {
      loopVars: filterObj(categorizedVars.loopVars),
      systemVars: filterObj(categorizedVars.systemVars),
      userVars: filterObj(categorizedVars.userVars),
    };
  }, [categorizedVars, searchQuery]);

  const highlightSet = useMemo(() => new Set(highlights), [highlights]);

  const hasLoopVars = Object.keys(filteredVars.loopVars).length > 0;
  const hasSystemVars = Object.keys(filteredVars.systemVars).length > 0;
  const hasUserVars = Object.keys(filteredVars.userVars).length > 0;

  return (
    <div className="p-4">
      {/* Search Bar */}
      <div className="relative mb-4">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search variables..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
        />
      </div>

      {/* Empty State */}
      {!hasLoopVars && !hasSystemVars && !hasUserVars && (
        <div className="text-center py-8 text-slate-400 text-sm">
          {searchQuery ? 'No variables match your search' : 'No variables available'}
        </div>
      )}

      {/* Loop Variables Section */}
      {hasLoopVars && (
        <div className="mb-4">
          <button
            onClick={() => setShowLoopVars(!showLoopVars)}
            className="flex items-center space-x-2 w-full text-left mb-2 text-xs font-bold text-orange-600 hover:text-orange-700"
          >
            {showLoopVars ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            <Repeat size={12} />
            <span>Loop Variables ({Object.keys(filteredVars.loopVars).length})</span>
          </button>
          {showLoopVars && (
            <div className="pl-2 border-l-2 border-orange-200">
              {Object.entries(filteredVars.loopVars).map(([key, value]) => (
                <JsonTreeNode
                  key={key}
                  name={key}
                  value={value}
                  depth={0}
                  maxDepth={maxDepth}
                  isHighlighted={highlightSet.has(key)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* User Variables Section */}
      {hasUserVars && (
        <div className="mb-4">
          <div className="text-[10px] font-bold text-slate-500 uppercase mb-2">
            Variables ({Object.keys(filteredVars.userVars).length})
          </div>
          <div className="space-y-0.5">
            {Object.entries(filteredVars.userVars).map(([key, value]) => (
              <JsonTreeNode
                key={key}
                name={key}
                value={value}
                depth={0}
                maxDepth={maxDepth}
                isHighlighted={highlightSet.has(key)}
              />
            ))}
          </div>
        </div>
      )}

      {/* System Variables Section */}
      {hasSystemVars && (
        <div>
          <button
            onClick={() => setShowSystemVars(!showSystemVars)}
            className="flex items-center space-x-2 w-full text-left mb-2 text-xs font-bold text-purple-600 hover:text-purple-700"
          >
            {showSystemVars ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            <span>System Variables ({Object.keys(filteredVars.systemVars).length})</span>
          </button>
          {showSystemVars && (
            <div className="pl-2 border-l-2 border-purple-200">
              {Object.entries(filteredVars.systemVars).map(([key, value]) => (
                <JsonTreeNode
                  key={key}
                  name={key}
                  value={value}
                  depth={0}
                  maxDepth={maxDepth}
                  isHighlighted={highlightSet.has(key)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
