import React from 'react';
import { List, Workflow } from 'lucide-react';

export type ViewMode = 'list' | 'workflow';

interface ViewModeSwitcherProps {
  currentMode: ViewMode;
  onChange: (mode: ViewMode) => void;
}

export const ViewModeSwitcher: React.FC<ViewModeSwitcherProps> = ({
  currentMode,
  onChange
}) => {
  return (
    <div className="inline-flex rounded-lg border border-slate-200 bg-white shadow-sm">
      <button
        onClick={() => onChange('list')}
        className={`
          px-4 py-2 text-sm font-medium rounded-l-lg flex items-center space-x-2 transition-colors
          ${currentMode === 'list'
            ? 'bg-blue-600 text-white'
            : 'bg-white text-slate-600 hover:bg-slate-50'
          }
        `}
        title="List view - Show steps in detailed list format"
      >
        <List size={16} />
        <span>List</span>
      </button>
      <button
        onClick={() => onChange('workflow')}
        className={`
          px-4 py-2 text-sm font-medium rounded-r-lg flex items-center space-x-2 transition-colors border-l border-slate-200
          ${currentMode === 'workflow'
            ? 'bg-blue-600 text-white border-blue-600'
            : 'bg-white text-slate-600 hover:bg-slate-50'
          }
        `}
        title="Workflow view - Show steps as DAG diagram"
      >
        <Workflow size={16} />
        <span>Workflow</span>
      </button>
    </div>
  );
};
