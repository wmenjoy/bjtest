/**
 * Step Executor Service
 * Executes individual test steps for testing purposes without running the full workflow
 */

import { WorkflowStep } from '../types';
import { apiClient } from './api/apiClient';
import { ParallelExecutor, ExecutionContext } from './parallelExecutor';

/**
 * Step execution result
 */
export interface StepExecutionResult {
  success: boolean;
  status: 'passed' | 'failed' | 'error';

  // Timing information
  duration: number; // milliseconds
  startTime: string; // ISO timestamp
  endTime: string; // ISO timestamp

  // HTTP specific (for http type steps)
  httpRequest?: {
    method: string;
    url: string;
    headers: Record<string, string>;
    body?: any;
  };
  httpResponse?: {
    statusCode: number;
    headers: Record<string, string>;
    body: any;
    responseTime: number;
  };

  // Command specific (for command type steps)
  commandExecution?: {
    command: string;
    args?: string[];
    exitCode: number;
    stdout?: string;
    stderr?: string;
  };

  // Data flow
  inputs: Record<string, any>;
  outputs: Record<string, any>;

  // Assertion results
  assertionResults?: Array<{
    name: string;
    passed: boolean;
    message?: string;
    expected?: any;
    actual?: any;
  }>;

  // Error information
  error?: string;
  errorStack?: string;

  // Logs
  logs: string[];
}

/**
 * Variable interpolation - replaces {{varName}} with actual values
 */
function interpolateVariables(value: any, variables: Record<string, any>): any {
  if (typeof value === 'string') {
    // Replace {{varName}} with actual values
    return value.replace(/\{\{([^}]+)\}\}/g, (match, varName) => {
      const trimmedVar = varName.trim();

      // Support nested paths like {{response.data.token}}
      const keys = trimmedVar.split('.');
      let result: any = variables;

      for (const key of keys) {
        if (result && typeof result === 'object' && key in result) {
          result = result[key];
        } else {
          return match; // Keep original if not found
        }
      }

      return result !== undefined ? String(result) : match;
    });
  }

  if (Array.isArray(value)) {
    return value.map(item => interpolateVariables(item, variables));
  }

  if (typeof value === 'object' && value !== null) {
    const result: Record<string, any> = {};
    for (const [key, val] of Object.entries(value)) {
      result[key] = interpolateVariables(val, variables);
    }
    return result;
  }

  return value;
}

/**
 * Execute HTTP step
 */
async function executeHttpStep(
  step: WorkflowStep,
  variables: Record<string, any>
): Promise<StepExecutionResult> {
  const startTime = new Date().toISOString();
  const logs: string[] = [];

  try {
    // Get config from either inline config or template inputs
    const config = step.config || {};
    const inputs = step.inputs || {};

    // Interpolate variables in config
    const interpolatedConfig = interpolateVariables(config, { ...variables, ...inputs });

    const method = (interpolatedConfig.method || 'GET').toUpperCase();
    const url = interpolatedConfig.url || '';
    const headers = interpolatedConfig.headers || {};
    const body = interpolatedConfig.body;

    logs.push(`[HTTP] Executing ${method} ${url}`);
    logs.push(`[HTTP] Headers: ${JSON.stringify(headers, null, 2)}`);
    if (body) {
      logs.push(`[HTTP] Body: ${JSON.stringify(body, null, 2)}`);
    }

    // Execute HTTP request
    const requestStart = Date.now();
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const requestEnd = Date.now();

    const responseBody = await response.json().catch(() => response.text());
    const endTime = new Date().toISOString();

    logs.push(`[HTTP] Response status: ${response.status}`);
    logs.push(`[HTTP] Response time: ${requestEnd - requestStart}ms`);
    logs.push(`[HTTP] Response body: ${JSON.stringify(responseBody, null, 2)}`);

    // Extract outputs based on step.outputs mapping
    const outputs: Record<string, any> = {};
    if (step.outputs) {
      for (const [key, path] of Object.entries(step.outputs)) {
        // Simple JSONPath extraction (supports dot notation)
        const keys = path.split('.');
        let value: any = { response: { status: response.status, body: responseBody } };

        for (const k of keys) {
          if (value && typeof value === 'object' && k in value) {
            value = value[k];
          } else {
            value = undefined;
            break;
          }
        }

        if (value !== undefined) {
          outputs[key] = value;
          logs.push(`[OUTPUT] ${key} = ${JSON.stringify(value)}`);
        }
      }
    }

    // Check assertions
    const assertionResults: Array<{
      name: string;
      passed: boolean;
      message?: string;
      expected?: any;
      actual?: any;
    }> = [];

    if (step.assertions && step.assertions.length > 0) {
      logs.push('[ASSERTIONS] Running assertions...');

      for (const assertion of step.assertions) {
        const actualValue = interpolateVariables(assertion.actual, {
          response: { status: response.status, body: responseBody },
          ...outputs,
        });

        let passed = false;
        switch (assertion.type) {
          case 'equals':
            passed = actualValue == assertion.expected;
            break;
          case 'contains':
            passed = String(actualValue).includes(String(assertion.expected));
            break;
          case 'greaterThan':
            passed = Number(actualValue) > Number(assertion.expected);
            break;
          case 'lessThan':
            passed = Number(actualValue) < Number(assertion.expected);
            break;
          default:
            passed = false;
        }

        assertionResults.push({
          name: assertion.message || `${assertion.actual} ${assertion.type} ${assertion.expected}`,
          passed,
          message: assertion.message,
          expected: assertion.expected,
          actual: actualValue,
        });

        logs.push(`[ASSERTION] ${passed ? '✓' : '✗'} ${assertion.message || assertion.type}`);
      }
    }

    const allAssertionsPassed = assertionResults.length === 0 || assertionResults.every(a => a.passed);

    return {
      success: response.ok && allAssertionsPassed,
      status: response.ok && allAssertionsPassed ? 'passed' : 'failed',
      duration: requestEnd - requestStart,
      startTime,
      endTime,
      httpRequest: {
        method,
        url,
        headers,
        body,
      },
      httpResponse: {
        statusCode: response.status,
        headers: Object.fromEntries(response.headers.entries()),
        body: responseBody,
        responseTime: requestEnd - requestStart,
      },
      inputs: { ...variables, ...inputs },
      outputs,
      assertionResults,
      logs,
    };
  } catch (error) {
    const endTime = new Date().toISOString();
    const errorMessage = error instanceof Error ? error.message : String(error);

    logs.push(`[ERROR] ${errorMessage}`);

    return {
      success: false,
      status: 'error',
      duration: Date.now() - new Date(startTime).getTime(),
      startTime,
      endTime,
      inputs: { ...variables, ...step.inputs },
      outputs: {},
      error: errorMessage,
      errorStack: error instanceof Error ? error.stack : undefined,
      logs,
    };
  }
}

/**
 * Execute command step
 */
async function executeCommandStep(
  step: WorkflowStep,
  variables: Record<string, any>
): Promise<StepExecutionResult> {
  const startTime = new Date().toISOString();
  const logs: string[] = [];

  try {
    const config = step.config || {};
    const inputs = step.inputs || {};

    // Interpolate variables
    const interpolatedConfig = interpolateVariables(config, { ...variables, ...inputs });

    const command = interpolatedConfig.cmd || interpolatedConfig.command || '';
    const args = interpolatedConfig.args || [];

    logs.push(`[COMMAND] Executing: ${command} ${args.join(' ')}`);
    logs.push('[COMMAND] Note: Command execution requires backend support');

    // In a real implementation, this would call a backend API endpoint
    // For now, we'll simulate the response
    const endTime = new Date().toISOString();

    return {
      success: false,
      status: 'error',
      duration: 0,
      startTime,
      endTime,
      commandExecution: {
        command,
        args,
        exitCode: -1,
        stderr: 'Command execution not yet implemented - requires backend API endpoint',
      },
      inputs: { ...variables, ...inputs },
      outputs: {},
      error: 'Command execution requires backend implementation',
      logs,
    };
  } catch (error) {
    const endTime = new Date().toISOString();
    const errorMessage = error instanceof Error ? error.message : String(error);

    logs.push(`[ERROR] ${errorMessage}`);

    return {
      success: false,
      status: 'error',
      duration: Date.now() - new Date(startTime).getTime(),
      startTime,
      endTime,
      inputs: { ...variables, ...step.inputs },
      outputs: {},
      error: errorMessage,
      logs,
    };
  }
}

/**
 * Execute merge step
 * Simulates merge execution for testing purposes
 */
async function executeMergeStep(
  step: WorkflowStep,
  variables: Record<string, any>
): Promise<StepExecutionResult> {
  const startTime = new Date().toISOString();
  const logs: string[] = [];

  try {
    // Create execution context
    const context: ExecutionContext = {
      variables,
      completedSteps: new Map(),
      stepOutputs: new Map(),
    };

    // Populate context with mock data for testing
    // In a real workflow execution, this would be populated by previous steps
    if (step.dependsOn) {
      logs.push(`[MERGE] Waiting for ${step.dependsOn.length} source steps: ${step.dependsOn.join(', ')}`);

      // Mock outputs for testing
      step.dependsOn.forEach(depId => {
        const mockOutput = variables[`${depId}_output`] || { status: 'completed', data: `Mock data from ${depId}` };
        context.stepOutputs.set(depId, mockOutput);
        logs.push(`[MERGE] Collected output from ${depId}`);
      });
    }

    // Execute merge
    const result = ParallelExecutor.executeMergeStep(step, context);
    const endTime = new Date().toISOString();

    logs.push(`[MERGE] Strategy: ${step.config?.strategy || 'waitAll'}`);
    logs.push(`[MERGE] Mode: ${step.config?.mode || 'object'}`);
    logs.push(`[MERGE] Result: ${JSON.stringify(result.outputs, null, 2)}`);

    return {
      success: result.status === 'passed',
      status: result.status === 'passed' ? 'passed' : 'failed',
      duration: result.duration || 0,
      startTime,
      endTime,
      inputs: variables,
      outputs: result.outputs || {},
      error: result.error,
      logs,
    };
  } catch (error) {
    const endTime = new Date().toISOString();
    const errorMessage = error instanceof Error ? error.message : String(error);

    logs.push(`[ERROR] ${errorMessage}`);

    return {
      success: false,
      status: 'error',
      duration: Date.now() - new Date(startTime).getTime(),
      startTime,
      endTime,
      inputs: variables,
      outputs: {},
      error: errorMessage,
      logs,
    };
  }
}

/**
 * Execute a single test step
 */
export async function executeStep(
  step: WorkflowStep,
  variables: Record<string, any> = {}
): Promise<StepExecutionResult> {
  const stepType = step.type || 'http';

  switch (stepType) {
    case 'http':
      return executeHttpStep(step, variables);

    case 'command':
      return executeCommandStep(step, variables);

    case 'assertion':
      // Assertions are typically evaluated within other step types
      return {
        success: false,
        status: 'error',
        duration: 0,
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString(),
        inputs: variables,
        outputs: {},
        error: 'Assertion steps must be part of another step type',
        logs: ['Assertion-only steps are not executable independently'],
      };

    case 'merge':
      return executeMergeStep(step, variables);

    case 'branch':
    case 'loop':
    case 'group':
    case 'parallel':
      return {
        success: false,
        status: 'error',
        duration: 0,
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString(),
        inputs: variables,
        outputs: {},
        error: `${stepType} steps cannot be tested individually - they require child steps`,
        logs: [`Control flow steps (${stepType}) must be tested as part of a complete workflow`],
      };

    default:
      return {
        success: false,
        status: 'error',
        duration: 0,
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString(),
        inputs: variables,
        outputs: {},
        error: `Unknown step type: ${stepType}`,
        logs: [`Step type '${stepType}' is not supported`],
      };
  }
}
