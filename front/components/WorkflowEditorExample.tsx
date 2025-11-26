/**
 * Example: Integrating AdvancedDAGEditor into WorkflowEditor
 *
 * This shows how to integrate the AdvancedDAGEditor component
 * into an existing WorkflowEditor with mode switching.
 */

import React, { useState } from 'react';
import { AdvancedDAGEditor } from './AdvancedDAGEditor';
import { SimpleListEditor } from './SimpleListEditor';
import { WorkflowStep } from '../types';
import { LayoutGrid, List } from 'lucide-react';

interface WorkflowEditorProps {
  initialSteps?: WorkflowStep[];
  onSave?: (steps: WorkflowStep[]) => void;
}

export const WorkflowEditorExample: React.FC<WorkflowEditorProps> = ({
  initialSteps = [],
  onSave,
}) => {
  const [mode, setMode] = useState<'simple' | 'advanced'>('simple');
  const [steps, setSteps] = useState<WorkflowStep[]>(initialSteps);
  const [readonly, setReadonly] = useState(false);

  const handleStepsChange = (updatedSteps: WorkflowStep[]) => {
    setSteps(updatedSteps);
  };

  const handleSave = () => {
    if (onSave) {
      onSave(steps);
    }
    console.log('Saving workflow:', steps);
  };

  return (
    <div className="h-screen flex flex-col bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              Workflow Editor
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Create and edit workflows visually or as a list
            </p>
          </div>

          <div className="flex items-center space-x-4">
            {/* Mode Toggle */}
            <div className="flex items-center bg-slate-100 rounded-lg p-1">
              <button
                onClick={() => setMode('simple')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                  mode === 'simple'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                <List size={18} />
                <span className="text-sm font-medium">Simple</span>
              </button>
              <button
                onClick={() => setMode('advanced')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                  mode === 'advanced'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                <LayoutGrid size={18} />
                <span className="text-sm font-medium">Advanced</span>
              </button>
            </div>

            {/* Readonly Toggle */}
            <label className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                checked={readonly}
                onChange={(e) => setReadonly(e.target.checked)}
                className="rounded border-slate-300"
              />
              <span className="text-slate-700">Read-only</span>
            </label>

            {/* Save Button */}
            <button
              onClick={handleSave}
              disabled={readonly}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                readonly
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              Save Workflow
            </button>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="bg-white border-b border-slate-200 px-6 py-3">
        <div className="flex items-center space-x-6 text-sm">
          <div className="flex items-center space-x-2">
            <span className="text-slate-500">Total Steps:</span>
            <span className="font-semibold text-slate-800">{steps.length}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-slate-500">Dependencies:</span>
            <span className="font-semibold text-slate-800">
              {steps.reduce((acc, s) => acc + (s.dependsOn?.length || 0), 0)}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-slate-500">Branches:</span>
            <span className="font-semibold text-slate-800">
              {steps.filter(s => s.branches && s.branches.length > 0).length}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-slate-500">Loops:</span>
            <span className="font-semibold text-slate-800">
              {steps.filter(s => s.loop).length}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-slate-500">Templates:</span>
            <span className="font-semibold text-slate-800">
              {steps.filter(s => s.actionTemplateId).length}
            </span>
          </div>
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex-1 overflow-hidden">
        {mode === 'simple' ? (
          <div className="h-full p-6">
            <SimpleListEditor
              steps={steps}
              onChange={handleStepsChange}
              readonly={readonly}
            />
          </div>
        ) : (
          <div className="h-full p-6">
            <AdvancedDAGEditor
              steps={steps}
              onChange={handleStepsChange}
              readonly={readonly}
            />
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-slate-200 px-6 py-3">
        <div className="flex items-center justify-between text-sm text-slate-600">
          <div className="flex items-center space-x-4">
            <span>Mode: <strong>{mode === 'simple' ? 'Simple List' : 'Advanced DAG'}</strong></span>
            <span className="text-slate-400">|</span>
            <span>Status: <strong>{readonly ? 'Read-only' : 'Editing'}</strong></span>
          </div>
          <div className="text-slate-500">
            Last modified: {new Date().toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
};

// Example usage in App.tsx or similar
export function App() {
  const sampleSteps: WorkflowStep[] = [
    {
      id: 'init',
      name: 'Initialize',
      type: 'command',
    },
    {
      id: 'fetch',
      name: 'Fetch Data',
      type: 'http',
      dependsOn: ['init'],
    },
    {
      id: 'process',
      name: 'Process Data',
      type: 'database',
      dependsOn: ['fetch'],
    },
  ];

  const handleSave = (steps: WorkflowStep[]) => {
    console.log('Workflow saved:', steps);
    // Send to backend API
    // POST /api/workflows
  };

  return (
    <WorkflowEditorExample
      initialSteps={sampleSteps}
      onSave={handleSave}
    />
  );
}
