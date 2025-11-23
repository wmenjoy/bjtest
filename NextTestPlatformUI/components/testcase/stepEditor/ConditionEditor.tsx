import React, { useState, useRef, useEffect } from 'react';
import { Code, ChevronDown } from 'lucide-react';

interface ConditionEditorProps {
  value: string;
  onChange: (value: string) => void;
  variables?: Record<string, any>;
  placeholder?: string;
}

// Common operators for conditions
const OPERATORS = [
  { label: '==', description: 'Equal' },
  { label: '!=', description: 'Not equal' },
  { label: '>', description: 'Greater than' },
  { label: '<', description: 'Less than' },
  { label: '>=', description: 'Greater or equal' },
  { label: '<=', description: 'Less or equal' },
  { label: 'contains', description: 'Contains substring' },
  { label: 'exists', description: 'Value exists' },
  { label: '&&', description: 'AND' },
  { label: '||', description: 'OR' },
];

export const ConditionEditor: React.FC<ConditionEditorProps> = ({
  value,
  onChange,
  variables = {},
  placeholder = 'e.g., {{status}} == 200'
}) => {
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [autocompleteItems, setAutocompleteItems] = useState<string[]>([]);
  const [cursorPosition, setCursorPosition] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<HTMLDivElement>(null);

  // Get variable names for autocomplete
  const variableNames = Object.keys(variables).map(k => `{{${k}}}`);

  // Handle click outside to close autocomplete
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        autocompleteRef.current &&
        !autocompleteRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowAutocomplete(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);

    // Check if we're typing {{ for variable
    const curPos = e.target.selectionStart || 0;
    setCursorPosition(curPos);

    // Find the word being typed
    const beforeCursor = newValue.substring(0, curPos);
    const match = beforeCursor.match(/\{\{(\w*)$/);

    if (match) {
      // Filter variables that match the partial input
      const partial = match[1].toLowerCase();
      const filtered = variableNames.filter(v =>
        v.toLowerCase().includes(partial) || partial === ''
      );
      setAutocompleteItems(filtered);
      setShowAutocomplete(filtered.length > 0);
    } else {
      setShowAutocomplete(false);
    }
  };

  const insertVariable = (variable: string) => {
    const beforeCursor = value.substring(0, cursorPosition);
    const afterCursor = value.substring(cursorPosition);

    // Find where {{ starts
    const matchStart = beforeCursor.lastIndexOf('{{');
    const newValue =
      beforeCursor.substring(0, matchStart) + variable + afterCursor;

    onChange(newValue);
    setShowAutocomplete(false);

    // Focus back to input
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  const insertOperator = (op: string) => {
    const newValue = value ? `${value} ${op} ` : `${op} `;
    onChange(newValue);
    inputRef.current?.focus();
  };

  // Detect expression type for preview
  const getExpressionHint = () => {
    if (!value) return null;

    if (value.includes('==') || value.includes('!=') || value.includes('>') || value.includes('<')) {
      return 'boolean';
    }
    if (value.includes('&&') || value.includes('||')) {
      return 'boolean';
    }
    if (value === 'default') {
      return 'fallback';
    }
    if (value.startsWith('{{') && value.endsWith('}}')) {
      return 'variable';
    }
    return 'expression';
  };

  const expressionHint = getExpressionHint();

  return (
    <div className="relative">
      {/* Input Field */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
          <Code size={14} className="text-slate-400" />
        </div>
        <input
          ref={inputRef}
          type="text"
          className="w-full pl-8 pr-20 py-2 text-sm font-mono border border-slate-200 rounded-lg bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-slate-700 placeholder-slate-400"
          value={value}
          onChange={handleInputChange}
          placeholder={placeholder}
        />
        {expressionHint && value && (
          <div className="absolute inset-y-0 right-2 flex items-center">
            <span
              className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                expressionHint === 'boolean'
                  ? 'bg-green-100 text-green-700'
                  : expressionHint === 'fallback'
                  ? 'bg-amber-100 text-amber-700'
                  : expressionHint === 'variable'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {expressionHint}
            </span>
          </div>
        )}
      </div>

      {/* Autocomplete Dropdown */}
      {showAutocomplete && (
        <div
          ref={autocompleteRef}
          className="absolute z-20 left-0 top-full mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-40 overflow-y-auto"
        >
          {autocompleteItems.map((item, idx) => (
            <button
              key={idx}
              type="button"
              className="w-full px-3 py-2 text-left text-sm font-mono text-blue-600 hover:bg-blue-50 transition-colors"
              onClick={() => insertVariable(item)}
            >
              {item}
            </button>
          ))}
        </div>
      )}

      {/* Operators Quick Insert */}
      <div className="mt-2 flex flex-wrap gap-1">
        {OPERATORS.slice(0, 6).map((op) => (
          <button
            key={op.label}
            type="button"
            className="px-2 py-0.5 text-xs font-mono bg-slate-100 hover:bg-slate-200 text-slate-600 rounded transition-colors"
            onClick={() => insertOperator(op.label)}
            title={op.description}
          >
            {op.label}
          </button>
        ))}
        <div className="relative group">
          <button
            type="button"
            className="px-2 py-0.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 rounded transition-colors flex items-center"
          >
            more <ChevronDown size={10} className="ml-0.5" />
          </button>
          <div className="hidden group-hover:block absolute z-10 left-0 top-full mt-1 bg-white border border-slate-200 rounded shadow-lg">
            {OPERATORS.slice(6).map((op) => (
              <button
                key={op.label}
                type="button"
                className="w-full px-3 py-1.5 text-left text-xs font-mono hover:bg-slate-50 flex items-center justify-between"
                onClick={() => insertOperator(op.label)}
              >
                <span className="text-slate-700">{op.label}</span>
                <span className="text-slate-400 ml-4">{op.description}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Variable Hints */}
      {variableNames.length > 0 && (
        <div className="mt-2">
          <p className="text-[10px] text-slate-400 mb-1">Available variables:</p>
          <div className="flex flex-wrap gap-1">
            {variableNames.slice(0, 5).map((v) => (
              <button
                key={v}
                type="button"
                className="px-1.5 py-0.5 text-[10px] font-mono bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"
                onClick={() => {
                  onChange(value + v);
                  inputRef.current?.focus();
                }}
              >
                {v}
              </button>
            ))}
            {variableNames.length > 5 && (
              <span className="text-[10px] text-slate-400">
                +{variableNames.length - 5} more
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
