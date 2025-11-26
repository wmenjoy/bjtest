import React, { useState } from 'react';
import { AtomicAssertion, Operator } from '../../../types';
import {
  ChevronDown,
  ChevronUp,
  Trash2,
  Copy,
  ArrowUp,
  ArrowDown,
  AlertCircle,
  AlertTriangle,
  Info
} from 'lucide-react';

interface AssertionCardProps {
  assertion: AtomicAssertion;
  index: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onChange: (updated: AtomicAssertion) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  availableVariables?: string[];
  readOnly?: boolean;
}

// Operator configurations with labels and descriptions
const OPERATORS: Array<{
  value: Operator;
  label: string;
  description: string;
  requiresExpected: boolean;
}> = [
  { value: 'equals', label: 'Equals', description: 'Value equals expected', requiresExpected: true },
  { value: 'notEquals', label: 'Not Equals', description: 'Value does not equal expected', requiresExpected: true },
  { value: 'greaterThan', label: 'Greater Than', description: 'Value is greater than expected', requiresExpected: true },
  { value: 'lessThan', label: 'Less Than', description: 'Value is less than expected', requiresExpected: true },
  { value: 'contains', label: 'Contains', description: 'String/Array contains expected value', requiresExpected: true },
  { value: 'notContains', label: 'Not Contains', description: 'String/Array does not contain value', requiresExpected: true },
  { value: 'exists', label: 'Exists', description: 'Field exists (not null/undefined)', requiresExpected: false },
  { value: 'notExists', label: 'Not Exists', description: 'Field does not exist', requiresExpected: false },
  { value: 'matchesRegex', label: 'Matches Regex', description: 'Value matches regex pattern', requiresExpected: true },
  { value: 'arrayLength', label: 'Array Length', description: 'Array has specified length', requiresExpected: true }
];

// Severity icons
const SEVERITY_ICONS = {
  error: <AlertCircle size={14} className="text-red-500" />,
  warning: <AlertTriangle size={14} className="text-amber-500" />,
  info: <Info size={14} className="text-blue-500" />
};

/**
 * AssertionCard - Individual assertion editor card
 *
 * Displays and allows editing of a single atomic assertion.
 * Can be expanded to show all options or collapsed for compact view.
 */
export const AssertionCard: React.FC<AssertionCardProps> = ({
  assertion,
  index,
  isExpanded,
  onToggleExpand,
  onChange,
  onDelete,
  onDuplicate,
  onMoveUp,
  onMoveDown,
  availableVariables = [],
  readOnly = false
}) => {
  const [showVariableSuggestions, setShowVariableSuggestions] = useState(false);

  // Get current operator config
  const operatorConfig = OPERATORS.find(op => op.value === assertion.operator);

  // Update field helper
  const updateField = <K extends keyof AtomicAssertion>(
    field: K,
    value: AtomicAssertion[K]
  ) => {
    onChange({ ...assertion, [field]: value });
  };

  // Insert variable at cursor position
  const insertVariable = (variable: string) => {
    const variableRef = `{{${variable}}}`;
    updateField('target', assertion.target + variableRef);
    setShowVariableSuggestions(false);
  };

  // Get severity color classes
  const getSeverityColor = () => {
    switch (assertion.severity) {
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-amber-50 border-amber-200';
      case 'info':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-slate-50 border-slate-200';
    }
  };

  return (
    <div className={`bg-white rounded-lg border transition-all ${getSeverityColor()}`}>
      {/* Card Header */}
      <div className="flex items-center p-3 space-x-3">
        {/* Index Badge */}
        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center">
          <span className="text-xs font-mono text-slate-600">{index + 1}</span>
        </div>

        {/* Severity Icon */}
        <div className="flex-shrink-0">
          {SEVERITY_ICONS[assertion.severity || 'error']}
        </div>

        {/* Summary Text (when collapsed) */}
        {!isExpanded && (
          <div className="flex-1 min-w-0">
            <p className="text-sm text-slate-700 truncate">
              <span className="font-mono text-xs text-slate-500">{assertion.target || '<target>'}</span>
              {' '}
              <span className="font-semibold text-slate-600">{assertion.operator}</span>
              {' '}
              {operatorConfig?.requiresExpected && (
                <span className="font-mono text-xs text-slate-500">
                  {typeof assertion.expected === 'string' ? `"${assertion.expected}"` : assertion.expected}
                </span>
              )}
            </p>
          </div>
        )}

        {isExpanded && (
          <div className="flex-1 text-sm font-medium text-slate-700">
            Assertion {index + 1}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center space-x-1">
          {!readOnly && onMoveUp && (
            <button
              type="button"
              onClick={onMoveUp}
              className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded"
              title="Move up"
            >
              <ArrowUp size={14} />
            </button>
          )}

          {!readOnly && onMoveDown && (
            <button
              type="button"
              onClick={onMoveDown}
              className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded"
              title="Move down"
            >
              <ArrowDown size={14} />
            </button>
          )}

          {!readOnly && (
            <>
              <button
                type="button"
                onClick={onDuplicate}
                className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded"
                title="Duplicate"
              >
                <Copy size={14} />
              </button>

              <button
                type="button"
                onClick={onDelete}
                className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded"
                title="Delete"
              >
                <Trash2 size={14} />
              </button>
            </>
          )}

          <button
            type="button"
            onClick={onToggleExpand}
            className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded"
            title={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-3 pb-3 space-y-3 border-t border-slate-100">
          {/* Assertion Type */}
          <div className="pt-3">
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Type
            </label>
            <select
              value={assertion.type}
              onChange={(e) => updateField('type', e.target.value as any)}
              disabled={readOnly}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:bg-slate-50 disabled:text-slate-500"
            >
              <option value="value">Value Assertion</option>
              <option value="structure">Structure Assertion</option>
              <option value="type">Type Assertion</option>
              <option value="pattern">Pattern Assertion</option>
            </select>
          </div>

          {/* Target Field */}
          <div className="relative">
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Target
              <span className="text-xs font-normal text-slate-400 ml-2">
                (Use {'{{'} variable {'}'} syntax)
              </span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={assertion.target}
                onChange={(e) => updateField('target', e.target.value)}
                onFocus={() => setShowVariableSuggestions(true)}
                onBlur={() => setTimeout(() => setShowVariableSuggestions(false), 200)}
                disabled={readOnly}
                placeholder="{{response.body.status}}"
                className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:bg-slate-50"
              />

              {/* Variable Suggestions Dropdown */}
              {showVariableSuggestions && availableVariables.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-auto">
                  <div className="p-2 border-b border-slate-100">
                    <p className="text-xs font-semibold text-slate-500">Available Variables</p>
                  </div>
                  {availableVariables.map((variable) => (
                    <button
                      key={variable}
                      type="button"
                      onClick={() => insertVariable(variable)}
                      className="w-full text-left px-3 py-2 text-sm font-mono text-slate-700 hover:bg-blue-50 transition-colors"
                    >
                      {'{{'}{variable}{'}}'}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Operator Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Operator
            </label>
            <select
              value={assertion.operator}
              onChange={(e) => updateField('operator', e.target.value as Operator)}
              disabled={readOnly}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:bg-slate-50"
            >
              {OPERATORS.map((op) => (
                <option key={op.value} value={op.value}>
                  {op.label} - {op.description}
                </option>
              ))}
            </select>
          </div>

          {/* Expected Value (conditional) */}
          {operatorConfig?.requiresExpected && (
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Expected Value
              </label>
              <input
                type="text"
                value={assertion.expected ?? ''}
                onChange={(e) => {
                  // Try to parse as number if it looks numeric
                  const value = e.target.value;
                  const numValue = Number(value);
                  updateField('expected', !isNaN(numValue) && value !== '' ? numValue : value);
                }}
                disabled={readOnly}
                placeholder="Expected value"
                className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:bg-slate-50"
              />
            </div>
          )}

          {/* Custom Message */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Custom Message (Optional)
            </label>
            <input
              type="text"
              value={assertion.message ?? ''}
              onChange={(e) => updateField('message', e.target.value)}
              disabled={readOnly}
              placeholder="Custom failure message"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:bg-slate-50"
            />
          </div>

          {/* Advanced Options */}
          <div className="pt-2 border-t border-slate-100">
            <p className="text-xs font-semibold text-slate-600 mb-2">Advanced Options</p>

            {/* Severity */}
            <div className="flex items-center space-x-4 mb-2">
              <label className="text-xs text-slate-600">Severity:</label>
              <div className="flex space-x-2">
                {(['error', 'warning', 'info'] as const).map((sev) => (
                  <label key={sev} className="flex items-center space-x-1 cursor-pointer">
                    <input
                      type="radio"
                      name={`severity-${assertion.id}`}
                      value={sev}
                      checked={assertion.severity === sev}
                      onChange={(e) => updateField('severity', e.target.value as any)}
                      disabled={readOnly}
                      className="w-3 h-3"
                    />
                    <span className="text-xs capitalize">{sev}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Continue on Failure */}
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={assertion.continueOnFailure ?? false}
                onChange={(e) => updateField('continueOnFailure', e.target.checked)}
                disabled={readOnly}
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-200"
              />
              <span className="text-xs text-slate-600">Continue execution if this assertion fails</span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
};
