import React, { useState } from 'react';
import { AdvancedDAGEditor } from './AdvancedDAGEditor';
import { WorkflowStep } from '../types';

/**
 * Demo component for AdvancedDAGEditor
 * Shows example workflow with various step types
 */
export const AdvancedDAGEditorDemo: React.FC = () => {
  const [readonly, setReadonly] = useState(false);

  // Sample workflow steps demonstrating different features
  const [steps, setSteps] = useState<WorkflowStep[]>([
    {
      id: 'step-1',
      name: 'Initialize Variables',
      type: 'command',
      config: {
        command: 'echo "Starting workflow"',
      },
      position: { x: 0, y: 0 },
    },
    {
      id: 'step-2',
      name: 'Fetch User Data',
      type: 'http',
      actionTemplateId: 'http-get-user',
      inputs: {
        userId: '{{userId}}',
        apiKey: '{{apiKey}}',
      },
      outputs: {
        userData: 'response.data',
      },
      dependsOn: ['step-1'],
      position: { x: 300, y: 0 },
    },
    {
      id: 'step-3',
      name: 'Check User Status',
      type: 'branch',
      branches: [
        {
          condition: '{{userData.status}} == "active"',
          label: 'Active User',
          children: [
            {
              id: 'step-3a',
              name: 'Process Active User',
              type: 'http',
              config: {
                method: 'POST',
                url: '/api/process',
              },
            },
          ],
        },
        {
          condition: 'default',
          label: 'Inactive User',
          children: [
            {
              id: 'step-3b',
              name: 'Send Activation Email',
              type: 'http',
              config: {
                method: 'POST',
                url: '/api/email/activate',
              },
            },
          ],
        },
      ],
      dependsOn: ['step-2'],
      position: { x: 600, y: 0 },
    },
    {
      id: 'step-4',
      name: 'Process Orders',
      type: 'http',
      loop: {
        type: 'forEach',
        source: '{{userData.orders}}',
        itemVar: 'order',
        indexVar: 'i',
        maxIterations: 100,
      },
      children: [
        {
          id: 'step-4-child',
          name: 'Process Single Order',
          type: 'http',
          config: {
            method: 'POST',
            url: '/api/orders/{{order.id}}/process',
          },
        },
      ],
      dependsOn: ['step-3'],
      position: { x: 900, y: 0 },
    },
    {
      id: 'step-5',
      name: 'Query Database',
      type: 'database',
      config: {
        dbType: 'POSTGRES',
        sql: 'SELECT * FROM users WHERE id = {{userId}}',
      },
      dependsOn: ['step-4'],
      position: { x: 1200, y: 0 },
    },
    {
      id: 'step-6',
      name: 'Merge Results',
      type: 'merge',
      dependsOn: ['step-5'],
      position: { x: 1500, y: 0 },
    },
  ]);

  const handleStepsChange = (updatedSteps: WorkflowStep[]) => {
    setSteps(updatedSteps);
    console.log('Steps updated:', updatedSteps);
  };

  return (
    <div className="h-screen flex flex-col bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              Advanced DAG Editor Demo
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Visual workflow editor with React Flow and Dagre auto-layout
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                checked={readonly}
                onChange={(e) => setReadonly(e.target.checked)}
                className="rounded border-slate-300"
              />
              <span className="text-slate-700">Read-only mode</span>
            </label>
            <button
              onClick={() => console.log('Current steps:', steps)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              Log Steps
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="bg-white border-b border-slate-200 px-6 py-3">
        <div className="flex items-center space-x-6 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="text-slate-600">HTTP: {steps.filter(s => s.type === 'http').length}</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-purple-500"></div>
            <span className="text-slate-600">Branch: {steps.filter(s => s.type === 'branch' || (s.branches && s.branches.length > 0)).length}</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-violet-500"></div>
            <span className="text-slate-600">Loop: {steps.filter(s => s.loop).length}</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-slate-600">Database: {steps.filter(s => s.type === 'database').length}</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
            <span className="text-slate-600">Command: {steps.filter(s => s.type === 'command').length}</span>
          </div>
        </div>
      </div>

      {/* DAG Editor */}
      <div className="flex-1 p-6">
        <AdvancedDAGEditor
          steps={steps}
          onChange={handleStepsChange}
          readonly={readonly}
        />
      </div>

      {/* Instructions */}
      <div className="bg-white border-t border-slate-200 px-6 py-4">
        <div className="text-sm text-slate-600">
          <strong className="text-slate-800">Instructions:</strong>
          <ul className="mt-2 space-y-1 ml-4 list-disc">
            <li>Click on nodes to view details in the right panel</li>
            <li>Drag nodes to reposition them (positions are saved)</li>
            <li>Connect nodes by dragging from one node's edge to another</li>
            <li>Use Vertical/Horizontal buttons to change layout</li>
            <li>Use MiniMap for navigation</li>
            <li>Toggle read-only mode to prevent editing</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
