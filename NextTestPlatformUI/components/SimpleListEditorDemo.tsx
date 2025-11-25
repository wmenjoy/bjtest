import React, { useState } from 'react';
import { SimpleListEditor } from './SimpleListEditor';
import { WorkflowStep } from '../types';

/**
 * SimpleListEditorDemo Component
 *
 * Demonstrates the SimpleListEditor with sample workflow steps.
 * Shows integration with DataMappingPanel for visual data flow configuration.
 */
export const SimpleListEditorDemo: React.FC = () => {
  const [steps, setSteps] = useState<WorkflowStep[]>([
    {
      id: 'step-1',
      name: 'User Login',
      type: 'http',
      config: {
        method: 'POST',
        url: 'https://api.example.com/auth/login',
        body: {
          username: '{{username}}',
          password: '{{password}}',
        },
      },
      outputs: {
        token: 'authToken',
        userId: 'userId',
      },
    },
    {
      id: 'step-2',
      name: 'Get User Profile',
      type: 'http',
      config: {
        method: 'GET',
        url: 'https://api.example.com/users/{{userId}}',
        headers: {
          Authorization: 'Bearer {{authToken}}',
        },
      },
      dataMappers: [
        {
          id: 'mapper-1',
          sourceStep: 'step-1',
          sourcePath: 'authToken',
          targetParam: 'authToken',
        },
        {
          id: 'mapper-2',
          sourceStep: 'step-1',
          sourcePath: 'userId',
          targetParam: 'userId',
        },
      ],
    },
    {
      id: 'step-3',
      name: 'Update User Settings',
      type: 'http',
      config: {
        method: 'PUT',
        url: 'https://api.example.com/users/{{userId}}/settings',
        headers: {
          Authorization: 'Bearer {{authToken}}',
        },
      },
    },
  ]);

  const [readonly, setReadonly] = useState(false);

  return (
    <div className="h-screen flex flex-col bg-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              Simple List Editor Demo
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Workflow builder with visual data mapping
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={readonly}
                onChange={(e) => setReadonly(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm text-slate-600">Read-only mode</span>
            </label>
            <button
              onClick={() => console.log('Workflow steps:', steps)}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
            >
              Log Steps
            </button>
          </div>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-hidden">
        <SimpleListEditor steps={steps} onChange={setSteps} readonly={readonly} />
      </div>

      {/* Status bar */}
      <div className="bg-white border-t border-slate-200 px-6 py-3">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <div>
            {steps.length} steps • {steps.filter((s) => s.dataMappers?.length).length} with data
            mappings
          </div>
          <div>SimpleListEditor v1.0.0</div>
        </div>
      </div>
    </div>
  );
};

export default SimpleListEditorDemo;
