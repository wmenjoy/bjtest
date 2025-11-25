import React, { useState } from 'react';
import { WorkflowEditor } from './WorkflowEditor';
import { WorkflowStep } from '../types';
import { Play, FileJson, RotateCcw } from 'lucide-react';

/**
 * WorkflowEditorDemo Component
 *
 * Demonstrates WorkflowEditor functionality with sample workflows:
 * - Simple linear workflow (no dependencies)
 * - Complex workflow with parallel execution, branches, and loops
 */
export const WorkflowEditorDemo: React.FC = () => {
  const [currentWorkflow, setCurrentWorkflow] = useState<'simple' | 'complex'>('simple');
  const [steps, setSteps] = useState<WorkflowStep[]>(getSimpleWorkflow());
  const [readonly, setReadonly] = useState(false);

  const handleLoadSimple = () => {
    setCurrentWorkflow('simple');
    setSteps(getSimpleWorkflow());
  };

  const handleLoadComplex = () => {
    setCurrentWorkflow('complex');
    setSteps(getComplexWorkflow());
  };

  const handleReset = () => {
    setSteps([]);
  };

  return (
    <div className="h-screen flex flex-col bg-slate-100">
      {/* Demo toolbar */}
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200 shadow">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Workflow Editor Demo</h1>
          <p className="text-sm text-slate-500 mt-1">
            Task 3.1: Mode switching and complexity detection
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* Load sample workflows */}
          <button
            onClick={handleLoadSimple}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
              currentWorkflow === 'simple'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
            }`}
          >
            <FileJson size={16} />
            <span>Load Simple</span>
          </button>
          <button
            onClick={handleLoadComplex}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
              currentWorkflow === 'complex'
                ? 'bg-purple-600 text-white'
                : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
            }`}
          >
            <FileJson size={16} />
            <span>Load Complex</span>
          </button>

          {/* Reset */}
          <button
            onClick={handleReset}
            className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300 font-medium transition-all"
          >
            <RotateCcw size={16} />
            <span>Reset</span>
          </button>

          {/* Readonly toggle */}
          <label className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-slate-200 text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={readonly}
              onChange={(e) => setReadonly(e.target.checked)}
              className="rounded"
            />
            <span className="font-medium">Read-only</span>
          </label>

          {/* Mock execute button */}
          <button className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 font-medium transition-all">
            <Play size={16} />
            <span>Execute</span>
          </button>
        </div>
      </div>

      {/* Workflow info panel */}
      <div className="px-6 py-3 bg-slate-50 border-b border-slate-200">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-6">
            <span className="text-slate-600">
              Workflow: <span className="font-semibold text-slate-800">
                {currentWorkflow === 'simple' ? 'Simple Linear Workflow' : 'Complex Workflow with DAG'}
              </span>
            </span>
            <span className="text-slate-600">
              Steps: <span className="font-semibold text-slate-800">{steps.length}</span>
            </span>
          </div>
          <div className="text-xs text-slate-500">
            {currentWorkflow === 'simple' ? (
              'No dependencies - suitable for Simple Mode'
            ) : (
              'Contains parallel execution, branches, loops - requires Advanced Mode'
            )}
          </div>
        </div>
      </div>

      {/* WorkflowEditor component */}
      <div className="flex-1 overflow-hidden">
        <WorkflowEditor
          steps={steps}
          onChange={setSteps}
          readonly={readonly}
        />
      </div>
    </div>
  );
};

/**
 * Sample simple workflow (linear, no dependencies)
 */
function getSimpleWorkflow(): WorkflowStep[] {
  return [
    {
      id: 'step-1',
      name: 'Login',
      type: 'http',
      config: {
        method: 'POST',
        url: '/api/login',
        body: { username: 'admin', password: 'secret' }
      },
      output: { token: 'output.response.body.token' }
    },
    {
      id: 'step-2',
      name: 'Get User Profile',
      type: 'http',
      config: {
        method: 'GET',
        url: '/api/user/profile',
        headers: { Authorization: 'Bearer {{token}}' }
      },
      output: { userId: 'output.response.body.id' }
    },
    {
      id: 'step-3',
      name: 'Update Profile',
      type: 'http',
      config: {
        method: 'PUT',
        url: '/api/user/{{userId}}',
        body: { name: 'Updated Name' }
      }
    }
  ];
}

/**
 * Sample complex workflow (DAG with parallel, branches, loops)
 */
function getComplexWorkflow(): WorkflowStep[] {
  return [
    {
      id: 'step-1',
      name: 'Initialize',
      type: 'http',
      config: { method: 'GET', url: '/api/init' },
      output: { sessionId: 'output.response.body.sessionId' }
    },
    {
      id: 'step-2',
      name: 'Fetch Users',
      type: 'http',
      dependsOn: ['step-1'],
      config: { method: 'GET', url: '/api/users' },
      output: { users: 'output.response.body.users' }
    },
    {
      id: 'step-3',
      name: 'Fetch Products',
      type: 'http',
      dependsOn: ['step-1'],
      config: { method: 'GET', url: '/api/products' },
      output: { products: 'output.response.body.products' }
    },
    {
      id: 'step-4',
      name: 'Process Each User',
      type: 'loop',
      dependsOn: ['step-2'],
      loopOver: '{{users}}',
      loopVar: 'user',
      parallel: true,
      maxConcurrency: 5,
      config: {},
      children: ['step-5']
    },
    {
      id: 'step-5',
      name: 'Check User Status',
      type: 'condition',
      when: '{{user.active}} == true',
      config: {},
      children: ['step-6'],
      elseChildren: ['step-7']
    },
    {
      id: 'step-6',
      name: 'Process Active User',
      type: 'http',
      config: {
        method: 'POST',
        url: '/api/user/{{user.id}}/activate'
      }
    },
    {
      id: 'step-7',
      name: 'Archive Inactive User',
      type: 'http',
      config: {
        method: 'POST',
        url: '/api/user/{{user.id}}/archive'
      }
    },
    {
      id: 'step-8',
      name: 'Generate Report',
      type: 'http',
      dependsOn: ['step-4', 'step-3'],
      config: {
        method: 'POST',
        url: '/api/reports/generate',
        body: {
          users: '{{users}}',
          products: '{{products}}'
        }
      }
    }
  ];
}
