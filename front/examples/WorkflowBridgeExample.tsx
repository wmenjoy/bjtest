/**
 * Workflow Bridge Integration Example
 *
 * This file demonstrates how to integrate the unified workflow bridge layer
 * into your application to synchronize state between TestCase and Workflow modules.
 */

import React, { useState, useEffect } from 'react';
import { TestCase, Workflow, Environment, ExecutionStatus } from '../types';
import {
  WorkflowBridge,
  ExecutionStateManager,
  UnifiedExecutionState,
  isTestCase,
  isWorkflow
} from '../services/workflowBridge';
import { UnifiedWorkflowView } from './workflow/UnifiedWorkflowView';

/**
 * Example: Using WorkflowBridge for bidirectional conversion
 */
export function ConversionExample() {
  // Example TestCase
  const testCase: TestCase = {
    id: 'tc-001',
    projectId: 'proj-1',
    title: 'User Login Flow',
    description: 'Test user authentication and session creation',
    priority: 'Medium' as any,
    status: 'Active' as any,
    folderId: 'folder-1',
    lastUpdated: new Date().toISOString(),
    tags: ['auth', 'login'],
    steps: [
      {
        id: 'step-1',
        name: 'Navigate to login page',
        type: 'http',
        config: {
          method: 'GET',
          url: '/login'
        }
      },
      {
        id: 'step-2',
        name: 'Submit credentials',
        type: 'http',
        config: {
          method: 'POST',
          url: '/api/auth/login',
          body: {
            username: '{{username}}',
            password: '{{password}}'
          }
        },
        outputs: {
          'authToken': 'response.body.token'
        }
      }
    ],
    variables: {
      username: 'testuser',
      password: 'testpass123'
    },
    preconditions: []
  };

  // Convert TestCase to Workflow
  const workflow = WorkflowBridge.testCaseToWorkflow(testCase);
  console.log('Converted Workflow:', workflow);

  // Convert Workflow back to TestCase
  const convertedTestCase = WorkflowBridge.workflowToTestCase(workflow, 'folder-1');
  console.log('Converted TestCase:', convertedTestCase);

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Workflow Bridge Conversion</h2>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h3 className="font-semibold mb-2">Original TestCase</h3>
          <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto">
            {JSON.stringify(testCase, null, 2)}
          </pre>
        </div>
        <div>
          <h3 className="font-semibold mb-2">Converted Workflow</h3>
          <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto">
            {JSON.stringify(workflow, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}

/**
 * Example: Managing Execution State
 */
export function ExecutionStateExample() {
  const [executions, setExecutions] = useState<UnifiedExecutionState[]>([]);

  const testCase: TestCase = {
    id: 'tc-001',
    projectId: 'proj-1',
    title: 'API Health Check',
    description: 'Verify API endpoints are responding',
    priority: 'High' as any,
    status: 'Active' as any,
    folderId: 'folder-1',
    lastUpdated: new Date().toISOString(),
    tags: ['health'],
    steps: [],
    variables: {},
    preconditions: []
  };

  const environment: Environment = {
    id: 'env-1',
    projectId: 'proj-1',
    name: 'Production',
    color: '#10b981',
    variables: [
      { key: 'API_URL', value: 'https://api.example.com', isSecret: false }
    ]
  };

  // Simulate execution
  const simulateExecution = () => {
    // Create execution state
    const execution = ExecutionStateManager.createExecutionState(
      testCase,
      environment
    );

    // Update to running
    execution.status = ExecutionStatus.RUNNING;
    execution.logs = ['Starting execution...', 'Environment: Production'];

    // Simulate step executions
    const stepExecution = {
      stepId: 'step-1',
      stepName: 'Health Check',
      status: 'running' as const,
      startTime: new Date().toISOString(),
      inputs: { url: 'https://api.example.com/health' },
      outputs: {}
    };

    execution.steps = [stepExecution];

    // Add to history
    ExecutionStateManager.addExecutionToHistory(execution);

    // Simulate completion after 2 seconds
    setTimeout(() => {
      execution.status = ExecutionStatus.PASSED;
      execution.completedAt = new Date().toISOString();
      execution.duration = 2000;
      execution.logs.push('Health check passed', 'Execution completed successfully');

      stepExecution.status = 'passed';
      stepExecution.endTime = new Date().toISOString();
      stepExecution.duration = 1500;
      stepExecution.outputs = { statusCode: 200, healthy: true };

      ExecutionStateManager.updateExecutionState(execution.id, execution);

      // Refresh view
      const history = ExecutionStateManager.getExecutionHistory('tc-001');
      setExecutions(history);
    }, 2000);

    // Refresh view
    const history = ExecutionStateManager.getExecutionHistory('tc-001');
    setExecutions(history);
  };

  // Get statistics
  const stats = ExecutionStateManager.getExecutionStats('tc-001');

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Execution State Management</h2>

      <div className="mb-6">
        <button
          onClick={simulateExecution}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Simulate Execution
        </button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="p-4 bg-gray-50 rounded border">
          <p className="text-xs text-gray-600">Total Runs</p>
          <p className="text-2xl font-bold">{stats.totalRuns}</p>
        </div>
        <div className="p-4 bg-green-50 rounded border border-green-200">
          <p className="text-xs text-green-600">Success Rate</p>
          <p className="text-2xl font-bold text-green-700">
            {stats.successRate.toFixed(0)}%
          </p>
        </div>
        <div className="p-4 bg-blue-50 rounded border border-blue-200">
          <p className="text-xs text-blue-600">Avg Duration</p>
          <p className="text-2xl font-bold text-blue-700">
            {stats.avgDuration.toFixed(0)}ms
          </p>
        </div>
        <div className="p-4 bg-purple-50 rounded border border-purple-200">
          <p className="text-xs text-purple-600">Last Run</p>
          <p className="text-sm font-medium text-purple-700">
            {stats.lastRunAt ? new Date(stats.lastRunAt).toLocaleTimeString() : 'Never'}
          </p>
        </div>
      </div>

      {/* Execution History */}
      <div>
        <h3 className="font-semibold mb-2">Execution History</h3>
        {executions.length === 0 ? (
          <p className="text-gray-500 text-sm">No executions yet</p>
        ) : (
          <div className="space-y-2">
            {executions.map(exec => (
              <div
                key={exec.id}
                className="p-4 bg-white border rounded hover:shadow"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{exec.sourceName}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(exec.startedAt).toLocaleString()}
                    </p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded ${
                    exec.status === ExecutionStatus.PASSED
                      ? 'bg-green-100 text-green-700'
                      : exec.status === ExecutionStatus.RUNNING
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {exec.status}
                  </span>
                </div>
                {exec.logs.length > 0 && (
                  <div className="mt-2 p-2 bg-gray-900 text-green-400 text-xs font-mono rounded max-h-32 overflow-auto">
                    {exec.logs.map((log, i) => (
                      <div key={i}>{log}</div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Example: Unified View Integration
 */
export function UnifiedViewExample() {
  const [selectedSource, setSelectedSource] = useState<TestCase | Workflow | undefined>();

  // Sample data
  const testCases: TestCase[] = [
    {
      id: 'tc-001',
      projectId: 'proj-1',
      title: 'User Registration',
      description: 'Test new user registration flow',
      priority: 'High' as any,
      status: 'Active' as any,
      folderId: 'folder-1',
      lastUpdated: new Date().toISOString(),
      tags: ['registration', 'user'],
      steps: [],
      variables: {},
      preconditions: []
    },
    {
      id: 'tc-002',
      projectId: 'proj-1',
      title: 'Password Reset',
      description: 'Test password reset functionality',
      priority: 'Medium' as any,
      status: 'Active' as any,
      folderId: 'folder-1',
      lastUpdated: new Date().toISOString(),
      tags: ['auth', 'password'],
      steps: [],
      variables: {},
      preconditions: []
    }
  ];

  const workflows: Workflow[] = [
    {
      id: 'wf-001',
      projectId: 'proj-1',
      name: 'E2E Checkout Flow',
      description: 'Complete checkout process from cart to confirmation',
      nodes: [],
      inputSchema: [],
      outputSchema: []
    },
    {
      id: 'wf-002',
      projectId: 'proj-1',
      name: 'Data Migration',
      description: 'Migrate user data between databases',
      nodes: [],
      inputSchema: [],
      outputSchema: []
    }
  ];

  const handleExecute = (source: TestCase | Workflow, environment?: Environment) => {
    console.log('Executing:', source, 'with environment:', environment);

    // Create execution state
    const execution = ExecutionStateManager.createExecutionState(source, environment);

    // Simulate execution
    execution.status = ExecutionStatus.RUNNING;
    execution.logs = ['Starting execution...'];
    ExecutionStateManager.addExecutionToHistory(execution);

    // Simulate completion
    setTimeout(() => {
      execution.status = ExecutionStatus.PASSED;
      execution.completedAt = new Date().toISOString();
      execution.duration = Math.random() * 5000 + 1000;
      execution.logs.push('Execution completed successfully');
      ExecutionStateManager.updateExecutionState(execution.id, execution);
    }, 2000);
  };

  return (
    <div className="h-screen">
      <UnifiedWorkflowView
        testCases={testCases}
        workflows={workflows}
        selectedSource={selectedSource}
        onSourceSelect={setSelectedSource}
        onExecute={handleExecute}
      />
    </div>
  );
}

/**
 * Integration Guide
 *
 * ## Step 1: Import the bridge service
 * ```typescript
 * import {
 *   WorkflowBridge,
 *   ExecutionStateManager,
 *   UnifiedExecutionState
 * } from '../services/workflowBridge';
 * ```
 *
 * ## Step 2: Convert between TestCase and Workflow
 * ```typescript
 * // TestCase to Workflow
 * const workflow = WorkflowBridge.testCaseToWorkflow(testCase);
 *
 * // Workflow to TestCase
 * const testCase = WorkflowBridge.workflowToTestCase(workflow, folderId);
 * ```
 *
 * ## Step 3: Manage execution state
 * ```typescript
 * // Create execution state
 * const execution = ExecutionStateManager.createExecutionState(
 *   testCase,
 *   environment
 * );
 *
 * // Add to history
 * ExecutionStateManager.addExecutionToHistory(execution);
 *
 * // Update state
 * ExecutionStateManager.updateExecutionState(executionId, updates);
 *
 * // Get history
 * const history = ExecutionStateManager.getExecutionHistory(sourceId);
 *
 * // Get statistics
 * const stats = ExecutionStateManager.getExecutionStats(sourceId);
 * ```
 *
 * ## Step 4: Use the UnifiedWorkflowView component
 * ```typescript
 * <UnifiedWorkflowView
 *   testCases={testCases}
 *   workflows={workflows}
 *   selectedSource={selectedSource}
 *   onSourceSelect={setSelectedSource}
 *   onExecute={handleExecute}
 * />
 * ```
 *
 * ## Integration with existing components
 *
 * ### TestRunner Integration
 * ```typescript
 * // In TestRunner.tsx, after execution completes:
 * const execution = ExecutionStateManager.createExecutionState(testCase, environment);
 * execution.status = ExecutionStatus.PASSED; // or FAILED
 * execution.completedAt = new Date().toISOString();
 * execution.duration = endTime - startTime;
 * execution.steps = stepExecutions;
 * execution.logs = executionLogs;
 * ExecutionStateManager.addExecutionToHistory(execution);
 * ```
 *
 * ### WorkflowRunner Integration
 * ```typescript
 * // In WorkflowRunner.tsx, track workflow execution:
 * const execution = ExecutionStateManager.createExecutionState(workflow, environment);
 * // Update as workflow progresses
 * ExecutionStateManager.updateExecutionState(execution.id, {
 *   status: ExecutionStatus.RUNNING,
 *   logs: [...execution.logs, 'Step completed']
 * });
 * ```
 *
 * ## Benefits
 *
 * 1. **Unified State**: Single source of truth for execution state across modules
 * 2. **Bidirectional Conversion**: Seamlessly convert between TestCase and Workflow
 * 3. **Execution History**: Track execution history for both test cases and workflows
 * 4. **Statistics**: Built-in calculation of success rate, duration, etc.
 * 5. **Type Safety**: Full TypeScript support with proper typing
 */
