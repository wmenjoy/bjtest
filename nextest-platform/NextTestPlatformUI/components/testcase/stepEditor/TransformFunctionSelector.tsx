import React, { useEffect, useRef } from 'react';
import { X, Zap, Type, Hash } from 'lucide-react';

interface TransformFunctionSelectorProps {
  value: string;
  onChange: (transform: string) => void;
  onClose: () => void;
}

// Transform function definition - aligned with backend Go implementation
// Reference: nextest-platform/internal/workflow/variable_resolver.go (builtInTransforms)
const TRANSFORM_FUNCTIONS = [
  {
    id: '',
    name: 'None',
    description: 'No transformation',
    icon: <X size={14} className="text-slate-400" />,
    category: 'Control'
  },
  {
    id: 'uppercase',
    name: 'Uppercase',
    description: 'Convert text to uppercase (ABC)',
    icon: <Type size={14} className="text-blue-500" />,
    category: 'Text',
    example: '"hello" → "HELLO"'
  },
  {
    id: 'lowercase',
    name: 'Lowercase',
    description: 'Convert text to lowercase (abc)',
    icon: <Type size={14} className="text-blue-500" />,
    category: 'Text',
    example: '"HELLO" → "hello"'
  },
  {
    id: 'trim',
    name: 'Trim',
    description: 'Remove leading/trailing whitespace',
    icon: <Type size={14} className="text-blue-500" />,
    category: 'Text',
    example: '"  hello  " → "hello"'
  },
  {
    id: 'parseInt',
    name: 'Parse Integer',
    description: 'Convert to integer number',
    icon: <Hash size={14} className="text-purple-500" />,
    category: 'Number',
    example: '"42" → 42'
  },
  {
    id: 'parseFloat',
    name: 'Parse Float',
    description: 'Convert to decimal number',
    icon: <Hash size={14} className="text-purple-500" />,
    category: 'Number',
    example: '"3.14" → 3.14'
  }
];

export const TransformFunctionSelector: React.FC<TransformFunctionSelectorProps> = ({
  value,
  onChange,
  onClose
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Group by category
  const categories = ['Control', 'Text', 'Number'];
  const functionsByCategory = categories.map(cat => ({
    category: cat,
    functions: TRANSFORM_FUNCTIONS.filter(f => f.category === cat)
  }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
      <div
        ref={modalRef}
        className="bg-white rounded-lg shadow-2xl w-96 max-h-[600px] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center space-x-2">
            <Zap size={16} className="text-purple-600" />
            <h3 className="font-semibold text-slate-800">Transform Function</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Description */}
        <div className="px-4 py-3 bg-blue-50 border-b border-blue-100">
          <p className="text-xs text-slate-600">
            Select a transformation to apply to the mapped value before passing it to the target parameter.
          </p>
        </div>

        {/* Function list */}
        <div className="overflow-y-auto max-h-[400px]">
          {functionsByCategory.map(({ category, functions }) => (
            <div key={category} className="border-b border-slate-100 last:border-b-0">
              <div className="px-4 py-2 bg-slate-50">
                <h4 className="text-xs font-bold text-slate-500 uppercase">{category}</h4>
              </div>
              <div className="p-2">
                {functions.map(func => (
                  <button
                    key={func.id}
                    onClick={() => onChange(func.id)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg transition-all mb-1 ${
                      value === func.id
                        ? 'bg-purple-100 border-2 border-purple-400'
                        : 'hover:bg-slate-50 border-2 border-transparent'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="mt-0.5">{func.icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm text-slate-800">
                            {func.name}
                          </span>
                          {value === func.id && (
                            <span className="text-xs text-purple-600 font-medium">Selected</span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5">{func.description}</p>
                        {func.example && (
                          <div className="mt-1.5 px-2 py-1 bg-slate-100 rounded text-xs font-mono text-slate-600">
                            {func.example}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50">
          <p className="text-xs text-slate-500">
            {TRANSFORM_FUNCTIONS.length - 1} transformations available
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
