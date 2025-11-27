/**
 * Example: Parallel Workflow Execution with Merge
 *
 * This demonstrates how to use the ParallelExecutor for DAG-based parallel execution
 *
 * Workflow DAG:
 *
 *     ┌─────────────┐
 *     │ fetch-user  │ (Layer 0)
 *     └──────┬──────┘
 *            │
 *     ┌──────┴──────┬──────────────┬──────────────┐
 *     │             │              │              │
 * ┌───▼────┐  ┌────▼─────┐  ┌─────▼────┐  ┌─────▼─────┐
 * │get-orders│ │get-profile│ │get-prefs │ │get-history│ (Layer 1 - Parallel)
 * └────┬─────┘ └────┬─────┘  └─────┬────┘  └─────┬─────┘
 *      │            │               │             │
 *      └────────────┴───────┬───────┴─────────────┘
 *                           │
 *                      ┌────▼─────┐
 *                      │  merge   │ (Layer 2)
 *                      └──────────┘
 */

import { WorkflowStep, MergeConfig } from '../types';
import { ParallelExecutor, ExecutionContext } from '../services/parallelExecutor';
import { executeStep } from '../services/stepExecutor';

/**
 * Example workflow with parallel execution
 */
export const parallelWorkflowExample: WorkflowStep[] = [
  // Layer 0: Initial step
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
      userName: 'response.body.name',
    },
  },

  // Layer 1: Parallel steps (all depend on fetch-user)
  {
    id: 'get-orders',
    name: 'Get User Orders',
    type: 'http',
    dependsOn: ['fetch-user'],
    config: {
      method: 'GET',
      url: 'https://jsonplaceholder.typicode.com/posts?userId={{userId}}',
    },
    outputs: {
      orders: 'response.body',
    },
  },
  {
    id: 'get-profile',
    name: 'Get User Profile',
    type: 'http',
    dependsOn: ['fetch-user'],
    config: {
      method: 'GET',
      url: 'https://jsonplaceholder.typicode.com/albums?userId={{userId}}',
    },
    outputs: {
      profile: 'response.body',
    },
  },
  {
    id: 'get-prefs',
    name: 'Get User Preferences',
    type: 'http',
    dependsOn: ['fetch-user'],
    config: {
      method: 'GET',
      url: 'https://jsonplaceholder.typicode.com/todos?userId={{userId}}',
    },
    outputs: {
      preferences: 'response.body',
    },
  },
  {
    id: 'get-history',
    name: 'Get User History',
    type: 'http',
    dependsOn: ['fetch-user'],
    config: {
      method: 'GET',
      url: 'https://jsonplaceholder.typicode.com/comments?email={{userId}}',
    },
    outputs: {
      history: 'response.body',
    },
  },

  // Layer 2: Merge step (depends on all parallel steps)
  {
    id: 'merge-results',
    name: 'Merge All User Data',
    type: 'merge',
    dependsOn: ['get-orders', 'get-profile', 'get-prefs', 'get-history'],
    config: {
      strategy: 'waitAll',
      mode: 'object',
      mapping: {
        'userData.orders': 'get-orders.orders',
        'userData.profile': 'get-profile.profile',
        'userData.preferences': 'get-prefs.preferences',
        'userData.history': 'get-history.history',
      },
    } as MergeConfig,
    outputs: {
      mergedData: 'mergedData',
    },
  },
];

/**
 * Example: Simple parallel branches
 */
export const simpleForkJoinExample: WorkflowStep[] = [
  {
    id: 'step-1',
    name: 'Branch A',
    type: 'http',
    config: {
      method: 'GET',
      url: 'https://jsonplaceholder.typicode.com/posts/1',
    },
  },
  {
    id: 'step-2',
    name: 'Branch B',
    type: 'http',
    config: {
      method: 'GET',
      url: 'https://jsonplaceholder.typicode.com/posts/2',
    },
  },
  {
    id: 'merge',
    name: 'Join Results',
    type: 'merge',
    dependsOn: ['step-1', 'step-2'],
    config: {
      strategy: 'waitAll',
      mode: 'array',
    } as MergeConfig,
  },
];

/**
 * Example: Complex dependency graph
 *
 *     A
 *    / \
 *   B   C
 *   │   │\
 *   D   E F
 *    \ /  │
 *     G   H
 *      \ /
 *       M
 */
export const complexDAGExample: WorkflowStep[] = [
  { id: 'A', name: 'Step A', type: 'http', config: { method: 'GET', url: '/api/a' } },
  { id: 'B', name: 'Step B', type: 'http', dependsOn: ['A'], config: { method: 'GET', url: '/api/b' } },
  { id: 'C', name: 'Step C', type: 'http', dependsOn: ['A'], config: { method: 'GET', url: '/api/c' } },
  { id: 'D', name: 'Step D', type: 'http', dependsOn: ['B'], config: { method: 'GET', url: '/api/d' } },
  { id: 'E', name: 'Step E', type: 'http', dependsOn: ['C'], config: { method: 'GET', url: '/api/e' } },
  { id: 'F', name: 'Step F', type: 'http', dependsOn: ['C'], config: { method: 'GET', url: '/api/f' } },
  { id: 'G', name: 'Step G', type: 'http', dependsOn: ['D', 'E'], config: { method: 'GET', url: '/api/g' } },
  { id: 'H', name: 'Step H', type: 'http', dependsOn: ['F'], config: { method: 'GET', url: '/api/h' } },
  {
    id: 'M',
    name: 'Merge All',
    type: 'merge',
    dependsOn: ['G', 'H'],
    config: { strategy: 'waitAll', mode: 'object' } as MergeConfig,
  },
];

/**
 * Demo function to execute parallel workflow
 */
export async function runParallelWorkflowDemo() {
  console.log('=== Parallel Workflow Demo ===\n');

  // Create execution context
  const context: ExecutionContext = {
    variables: {},
    completedSteps: new Map(),
    stepOutputs: new Map(),
  };

  // Validate DAG
  console.log('1. Validating DAG...');
  const validation = ParallelExecutor.validateDAG(parallelWorkflowExample);
  if (!validation.valid) {
    console.error('❌ DAG validation failed:', validation.errors);
    return;
  }
  console.log('✅ DAG is valid\n');

  // Build execution layers
  console.log('2. Building execution layers...');
  const layers = ParallelExecutor.buildExecutionLayers(parallelWorkflowExample);
  layers.forEach((layer, index) => {
    console.log(`   Layer ${index}: ${layer.steps.map(s => s.id).join(', ')}`);
  });
  console.log();

  // Execute workflow
  console.log('3. Executing workflow...');
  try {
    const results = await ParallelExecutor.executeDAG(
      parallelWorkflowExample,
      context,
      async (step, ctx) => {
        // Wrap executeStep to return StepExecution format
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

    // Print statistics
    const stats = ParallelExecutor.getExecutionStats(results);
    console.log('\n4. Execution complete!');
    console.log(`   Total steps: ${stats.total}`);
    console.log(`   Passed: ${stats.passed}`);
    console.log(`   Failed: ${stats.failed}`);
    console.log(`   Total duration: ${stats.duration}ms`);
    console.log();

    // Print individual results
    console.log('5. Step results:');
    results.forEach(result => {
      const status = result.status === 'passed' ? '✅' : '❌';
      console.log(`   ${status} ${result.stepName} (${result.duration}ms)`);
      if (result.error) {
        console.log(`      Error: ${result.error}`);
      }
    });
  } catch (error) {
    console.error('❌ Execution failed:', error);
  }
}

/**
 * Demo function to show execution layers
 */
export function demonstrateExecutionLayers() {
  console.log('=== Execution Layers Demo ===\n');

  const examples = [
    { name: 'Simple Fork-Join', steps: simpleForkJoinExample },
    { name: 'Complex DAG', steps: complexDAGExample },
    { name: 'Full Parallel Workflow', steps: parallelWorkflowExample },
  ];

  examples.forEach(({ name, steps }) => {
    console.log(`\n${name}:`);
    console.log('─'.repeat(50));

    const validation = ParallelExecutor.validateDAG(steps);
    if (!validation.valid) {
      console.log('❌ Invalid DAG:', validation.errors);
      return;
    }

    const layers = ParallelExecutor.buildExecutionLayers(steps);
    layers.forEach((layer, index) => {
      console.log(`Layer ${index}: ${layer.steps.map(s => s.id).join(', ')}`);
    });
  });
}

/**
 * Usage in React component:
 *
 * ```typescript
 * import { runParallelWorkflowDemo } from './examples/parallelWorkflowExample';
 *
 * function MyComponent() {
 *   const handleRunDemo = async () => {
 *     await runParallelWorkflowDemo();
 *   };
 *
 *   return <button onClick={handleRunDemo}>Run Parallel Workflow</button>;
 * }
 * ```
 */
