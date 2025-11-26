/**
 * Example React Component: Parallel Workflow Executor Demo
 *
 * This demonstrates how to use the ParallelExecutor in a React component
 */

import React, { useState } from 'react';
import { Play, CheckCircle, XCircle, Loader2, GitMerge, Layers } from 'lucide-react';
import { WorkflowStep, StepExecution } from '../types';
import { ParallelExecutor, ExecutionContext } from '../services/parallelExecutor';
import { executeStep } from '../services/stepExecutor';

/**
 * Sample parallel workflow for demo
 */
const sampleWorkflow: WorkflowStep[] = [
  {
    id: 'fetch-user',
    name: 'Fetch User Data',
    type: 'http',
    config: {
      method: 'GET',
      url: 'https://jsonplaceholder.typicode.com/users/1',
    },
    outputs: {
      userId: 'response.body.id',
    },
  },
  {
    id: 'get-posts',
    name: 'Get User Posts',
    type: 'http',
    dependsOn: ['fetch-user'],
    config: {
      method: 'GET',
      url: 'https://jsonplaceholder.typicode.com/posts?userId={{userId}}',
    },
    outputs: {
      posts: 'response.body',
    },
  },
  {
    id: 'get-albums',
    name: 'Get User Albums',
    type: 'http',
    dependsOn: ['fetch-user'],
    config: {
      method: 'GET',
      url: 'https://jsonplaceholder.typicode.com/albums?userId={{userId}}',
    },
    outputs: {
      albums: 'response.body',
    },
  },
  {
    id: 'merge-data',
    name: 'Merge User Data',
    type: 'merge',
    dependsOn: ['get-posts', 'get-albums'],
    config: {
      strategy: 'waitAll',
      mode: 'object',
    },
  },
];

export const ParallelWorkflowDemo: React.FC = () => {
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResults, setExecutionResults] = useState<StepExecution[]>([]);
  const [executionLayers, setExecutionLayers] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const executeWorkflow = async () => {
    setIsExecuting(true);
    setError(null);
    setExecutionResults([]);

    try {
      // 1. Validate DAG
      const validation = ParallelExecutor.validateDAG(sampleWorkflow);
      if (!validation.valid) {
        throw new Error(`Invalid workflow: ${validation.errors?.join('; ')}`);
      }

      // 2. Build execution layers
      const layers = ParallelExecutor.buildExecutionLayers(sampleWorkflow);
      setExecutionLayers(layers);

      // 3. Create execution context
      const context: ExecutionContext = {
        variables: {},
        completedSteps: new Map(),
        stepOutputs: new Map(),
      };

      // 4. Execute workflow
      const results = await ParallelExecutor.executeDAG(
        sampleWorkflow,
        context,
        async (step, ctx) => {
          const result = await executeStep(step, ctx.variables);
          return {
            stepId: step.id,
            stepName: step.name || step.id,
            status: result.status === 'passed' ? 'passed' : 'failed',
            startTime: result.startTime,
            endTime: result.endTime,
            duration: result.duration,
            inputs: result.inputs,
            outputs: result.outputs,
            error: result.error,
          };
        }
      );

      setExecutionResults(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsExecuting(false);
    }
  };

  const stats = executionResults.length > 0
    ? ParallelExecutor.getExecutionStats(executionResults)
    : null;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">
          Parallel Workflow Execution Demo
        </h2>
        <p className="text-slate-600">
          This demo shows how the ParallelExecutor handles DAG-based parallel execution with merge nodes.
        </p>
      </div>

      {/* Execute Button */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <button
          onClick={executeWorkflow}
          disabled={isExecuting}
          className={`w-full flex items-center justify-center space-x-2 px-6 py-3 rounded-lg font-semibold transition-all ${
            isExecuting
              ? 'bg-slate-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg'
          }`}
        >
          {isExecuting ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              <span>Executing...</span>
            </>
          ) : (
            <>
              <Play size={20} />
              <span>Execute Parallel Workflow</span>
            </>
          )}
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start space-x-2">
            <XCircle size={20} className="text-red-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-800">Execution Error</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Execution Layers */}
      {executionLayers.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center space-x-2">
            <Layers size={20} />
            <span>Execution Layers</span>
          </h3>
          <div className="space-y-3">
            {executionLayers.map((layer, index) => (
              <div key={index} className="border-l-4 border-blue-500 pl-4">
                <div className="text-sm font-medium text-slate-700 mb-2">
                  Layer {index}
                  {layer.steps.length > 1 && (
                    <span className="ml-2 text-xs bg-pink-100 text-pink-700 px-2 py-0.5 rounded-full">
                      Parallel ({layer.steps.length} steps)
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {layer.steps.map((step: WorkflowStep) => (
                    <div
                      key={step.id}
                      className="px-3 py-1.5 bg-slate-100 rounded-md text-sm text-slate-700 font-mono"
                    >
                      {step.id}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Execution Results */}
      {executionResults.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center space-x-2">
            <CheckCircle size={20} />
            <span>Execution Results</span>
          </h3>

          {/* Statistics */}
          {stats && (
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="bg-slate-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-slate-800">{stats.total}</div>
                <div className="text-xs text-slate-600">Total Steps</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-700">{stats.passed}</div>
                <div className="text-xs text-green-600">Passed</div>
              </div>
              <div className="bg-red-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-red-700">{stats.failed}</div>
                <div className="text-xs text-red-600">Failed</div>
              </div>
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-700">{stats.duration}ms</div>
                <div className="text-xs text-blue-600">Duration</div>
              </div>
            </div>
          )}

          {/* Individual Results */}
          <div className="space-y-2">
            {executionResults.map((result) => (
              <div
                key={result.stepId}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  result.status === 'passed'
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-red-50 border border-red-200'
                }`}
              >
                <div className="flex items-center space-x-3">
                  {result.status === 'passed' ? (
                    <CheckCircle size={18} className="text-green-600" />
                  ) : (
                    <XCircle size={18} className="text-red-600" />
                  )}
                  <div>
                    <div className="font-semibold text-slate-800">{result.stepName}</div>
                    <div className="text-xs text-slate-600 font-mono">{result.stepId}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-slate-700">
                    {result.duration}ms
                  </div>
                  {result.error && (
                    <div className="text-xs text-red-600 mt-1">{result.error}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Workflow Definition */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Workflow Definition</h3>
        <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg text-xs overflow-x-auto">
          {JSON.stringify(sampleWorkflow, null, 2)}
        </pre>
      </div>
    </div>
  );
};

/**
 * Usage in App.tsx or Router:
 *
 * import { ParallelWorkflowDemo } from './components/ParallelWorkflowDemo';
 *
 * function App() {
 *   return (
 *     <Routes>
 *       <Route path="/parallel-demo" element={<ParallelWorkflowDemo />} />
 *     </Routes>
 *   );
 * }
 */
