/**
 * Parallel Executor Service
 * Handles DAG-based parallel execution of workflow steps with dependency resolution
 */

import { WorkflowStep, StepExecution, MergeConfig } from '../types';

/**
 * Execution context shared across all steps
 * Contains variables and accumulated outputs from completed steps
 */
export interface ExecutionContext {
  /** Global and step output variables */
  variables: Record<string, any>;
  /** Completed step executions for reference */
  completedSteps: Map<string, StepExecution>;
  /** Step outputs indexed by step ID */
  stepOutputs: Map<string, Record<string, any>>;
}

/**
 * Execution layer representing steps that can run in parallel
 */
export interface ExecutionLayer {
  /** Layer number (0-indexed) */
  layer: number;
  /** Steps in this layer that have no dependencies on each other */
  steps: WorkflowStep[];
}

/**
 * DAG validation result
 */
export interface DAGValidationResult {
  valid: boolean;
  cycles?: string[][]; // Array of cycles found
  errors?: string[];
}

/**
 * Parallel Executor
 * Executes workflow steps based on dependency graph (DAG)
 */
export class ParallelExecutor {
  /**
   * Build execution layers from steps using topological sort
   * Steps in the same layer can be executed in parallel
   *
   * Algorithm:
   * 1. Calculate in-degree (number of dependencies) for each step
   * 2. Start with steps having 0 in-degree (no dependencies)
   * 3. Process each layer, removing edges and updating in-degrees
   * 4. Repeat until all steps are processed or cycle detected
   */
  static buildExecutionLayers(steps: WorkflowStep[]): ExecutionLayer[] {
    if (!steps || steps.length === 0) {
      return [];
    }

    // Build step map for quick lookup
    const stepMap = new Map<string, WorkflowStep>();
    steps.forEach(step => stepMap.set(step.id, step));

    // Calculate in-degree (number of dependencies) for each step
    const inDegree = new Map<string, number>();
    const dependencies = new Map<string, Set<string>>(); // step -> its dependencies
    const dependents = new Map<string, Set<string>>(); // step -> steps that depend on it

    // Initialize
    steps.forEach(step => {
      inDegree.set(step.id, 0);
      dependencies.set(step.id, new Set());
      dependents.set(step.id, new Set());
    });

    // Calculate in-degrees and build dependency graph
    steps.forEach(step => {
      if (step.dependsOn && step.dependsOn.length > 0) {
        // Filter out invalid dependencies (steps that don't exist)
        const validDeps = step.dependsOn.filter(depId => stepMap.has(depId));
        inDegree.set(step.id, validDeps.length);
        dependencies.set(step.id, new Set(validDeps));

        validDeps.forEach(depId => {
          const deps = dependents.get(depId) || new Set();
          deps.add(step.id);
          dependents.set(depId, deps);
        });
      }
    });

    // Build layers using Kahn's algorithm
    const layers: ExecutionLayer[] = [];
    const processed = new Set<string>();
    let currentLayer = 0;

    while (processed.size < steps.length) {
      // Find all steps with in-degree 0 (ready to execute)
      const currentLayerSteps: WorkflowStep[] = [];

      steps.forEach(step => {
        if (!processed.has(step.id) && inDegree.get(step.id) === 0) {
          currentLayerSteps.push(step);
        }
      });

      // If no steps can be added, we have a cycle
      if (currentLayerSteps.length === 0 && processed.size < steps.length) {
        const remaining = steps.filter(s => !processed.has(s.id));
        throw new Error(
          `Circular dependency detected in workflow. Remaining steps: ${remaining.map(s => s.id).join(', ')}`
        );
      }

      // Add layer
      if (currentLayerSteps.length > 0) {
        layers.push({
          layer: currentLayer,
          steps: currentLayerSteps,
        });

        // Mark steps as processed and update in-degrees
        currentLayerSteps.forEach(step => {
          processed.add(step.id);

          // Reduce in-degree for all dependent steps
          const deps = dependents.get(step.id);
          if (deps) {
            deps.forEach(depId => {
              const current = inDegree.get(depId) || 0;
              inDegree.set(depId, current - 1);
            });
          }
        });

        currentLayer++;
      }
    }

    return layers;
  }

  /**
   * Validate DAG for cycles
   * Uses DFS to detect cycles in the dependency graph
   */
  static validateDAG(steps: WorkflowStep[]): DAGValidationResult {
    if (!steps || steps.length === 0) {
      return { valid: true };
    }

    const stepMap = new Map<string, WorkflowStep>();
    steps.forEach(step => stepMap.set(step.id, step));

    // Build adjacency list
    const graph = new Map<string, string[]>();
    steps.forEach(step => {
      const validDeps = (step.dependsOn || []).filter(depId => stepMap.has(depId));
      graph.set(step.id, validDeps);
    });

    // DFS cycle detection
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const cycles: string[][] = [];

    const dfs = (stepId: string, path: string[]): boolean => {
      visited.add(stepId);
      recursionStack.add(stepId);
      path.push(stepId);

      const deps = graph.get(stepId) || [];
      for (const depId of deps) {
        if (!visited.has(depId)) {
          if (dfs(depId, [...path])) {
            return true;
          }
        } else if (recursionStack.has(depId)) {
          // Cycle detected
          const cycleStart = path.indexOf(depId);
          const cycle = path.slice(cycleStart);
          cycle.push(depId); // Complete the cycle
          cycles.push(cycle);
          return true;
        }
      }

      recursionStack.delete(stepId);
      return false;
    };

    // Check all nodes
    for (const step of steps) {
      if (!visited.has(step.id)) {
        dfs(step.id, []);
      }
    }

    if (cycles.length > 0) {
      return {
        valid: false,
        cycles,
        errors: cycles.map(cycle => `Circular dependency: ${cycle.join(' -> ')}`),
      };
    }

    return { valid: true };
  }

  /**
   * Execute steps in parallel layers
   * Each layer's steps run in parallel, then proceeds to next layer
   *
   * @param steps - All workflow steps
   * @param context - Execution context with variables
   * @param executeStepFn - Function to execute a single step (injected for flexibility)
   * @returns Array of all step executions
   */
  static async executeDAG(
    steps: WorkflowStep[],
    context: ExecutionContext,
    executeStepFn: (step: WorkflowStep, ctx: ExecutionContext) => Promise<StepExecution>
  ): Promise<StepExecution[]> {
    // Validate DAG first
    const validation = this.validateDAG(steps);
    if (!validation.valid) {
      throw new Error(`Invalid workflow DAG: ${validation.errors?.join('; ')}`);
    }

    // Build execution layers
    const layers = this.buildExecutionLayers(steps);
    const allResults: StepExecution[] = [];

    console.log(`[ParallelExecutor] Executing ${steps.length} steps in ${layers.length} layers`);

    // Execute each layer
    for (let i = 0; i < layers.length; i++) {
      const layer = layers[i];
      console.log(`[ParallelExecutor] Layer ${i}: Executing ${layer.steps.length} steps in parallel`);

      // Execute all steps in this layer in parallel
      const layerPromises = layer.steps.map(step =>
        executeStepFn(step, context).catch(error => {
          // Convert errors to failed executions
          const execution: StepExecution = {
            stepId: step.id,
            stepName: step.name || 'Unnamed Step',
            status: 'failed',
            startTime: new Date().toISOString(),
            endTime: new Date().toISOString(),
            duration: 0,
            inputs: context.variables,
            outputs: {},
            error: error instanceof Error ? error.message : String(error),
          };
          return execution;
        })
      );

      // Wait for all steps in this layer to complete
      const layerResults = await Promise.all(layerPromises);
      allResults.push(...layerResults);

      // Update context with outputs from this layer
      layerResults.forEach(result => {
        context.completedSteps.set(result.stepId, result);
        if (result.outputs) {
          context.stepOutputs.set(result.stepId, result.outputs);
          // Also merge outputs into global variables
          Object.assign(context.variables, result.outputs);
        }
      });

      // Check for failures - optionally abort on error
      const failures = layerResults.filter(r => r.status === 'failed');
      if (failures.length > 0) {
        console.warn(`[ParallelExecutor] Layer ${i}: ${failures.length} step(s) failed`);
        // Note: Current implementation continues execution
        // Future enhancement: Add error handling strategy (abort/continue/retry)
      }

      console.log(`[ParallelExecutor] Layer ${i}: Completed. Updated context with ${layerResults.length} results`);
    }

    return allResults;
  }

  /**
   * Execute merge step
   * Waits for specified source steps to complete and merges their results
   *
   * @param step - The merge step configuration
   * @param context - Execution context
   * @returns Step execution result with merged data
   */
  static executeMergeStep(
    step: WorkflowStep,
    context: ExecutionContext
  ): StepExecution {
    const startTime = new Date().toISOString();
    const mergeConfig = step.config as MergeConfig | undefined;

    if (!mergeConfig) {
      return {
        stepId: step.id,
        stepName: step.name || 'Merge Step',
        status: 'failed',
        startTime,
        endTime: new Date().toISOString(),
        duration: 0,
        inputs: context.variables,
        outputs: {},
        error: 'Merge step requires config with strategy and sources',
      };
    }

    // Get source step IDs from dependsOn or config
    const sourceIds = step.dependsOn || [];

    if (sourceIds.length === 0) {
      return {
        stepId: step.id,
        stepName: step.name || 'Merge Step',
        status: 'failed',
        startTime,
        endTime: new Date().toISOString(),
        duration: 0,
        inputs: context.variables,
        outputs: {},
        error: 'Merge step requires dependsOn to specify source steps',
      };
    }

    // Collect results from source steps
    const sourceResults: Record<string, any> = {};
    const missingSteps: string[] = [];

    sourceIds.forEach(sourceId => {
      const stepOutput = context.stepOutputs.get(sourceId);
      if (stepOutput) {
        sourceResults[sourceId] = stepOutput;
      } else {
        missingSteps.push(sourceId);
      }
    });

    // Check if all required sources are available
    if (missingSteps.length > 0) {
      return {
        stepId: step.id,
        stepName: step.name || 'Merge Step',
        status: 'failed',
        startTime,
        endTime: new Date().toISOString(),
        duration: 0,
        inputs: context.variables,
        outputs: {},
        error: `Missing outputs from steps: ${missingSteps.join(', ')}`,
      };
    }

    // Apply merge strategy
    let mergedData: any;

    switch (mergeConfig.strategy) {
      case 'waitAll':
        // All sources must be complete (already validated above)
        mergedData = this.mergeResults(sourceResults, mergeConfig.mode, mergeConfig.mapping);
        break;

      case 'waitAny':
        // At least one source must be complete
        if (Object.keys(sourceResults).length === 0) {
          return {
            stepId: step.id,
            stepName: step.name || 'Merge Step',
            status: 'failed',
            startTime,
            endTime: new Date().toISOString(),
            duration: 0,
            inputs: context.variables,
            outputs: {},
            error: 'No source steps completed',
          };
        }
        mergedData = this.mergeResults(sourceResults, mergeConfig.mode, mergeConfig.mapping);
        break;

      case 'waitN':
        // Wait for N sources (specified in waitCount)
        const requiredCount = mergeConfig.waitCount || 1;
        if (Object.keys(sourceResults).length < requiredCount) {
          return {
            stepId: step.id,
            stepName: step.name || 'Merge Step',
            status: 'failed',
            startTime,
            endTime: new Date().toISOString(),
            duration: 0,
            inputs: context.variables,
            outputs: {},
            error: `Only ${Object.keys(sourceResults).length} of ${requiredCount} required steps completed`,
          };
        }
        mergedData = this.mergeResults(sourceResults, mergeConfig.mode, mergeConfig.mapping);
        break;

      default:
        mergedData = sourceResults;
    }

    const endTime = new Date().toISOString();

    return {
      stepId: step.id,
      stepName: step.name || 'Merge Step',
      status: 'passed',
      startTime,
      endTime,
      duration: new Date(endTime).getTime() - new Date(startTime).getTime(),
      inputs: context.variables,
      outputs: { mergedData },
    };
  }

  /**
   * Merge results from multiple source steps
   *
   * @param sourceResults - Results indexed by step ID
   * @param mode - Merge mode: 'object' or 'array'
   * @param mapping - Optional custom mapping
   * @returns Merged data
   */
  private static mergeResults(
    sourceResults: Record<string, any>,
    mode: 'object' | 'array',
    mapping?: Record<string, string>
  ): any {
    if (mode === 'array') {
      // Merge into array
      return Object.entries(sourceResults).map(([stepId, data]) => ({
        stepId,
        data,
      }));
    }

    // Merge into object
    if (mapping) {
      // Use custom mapping
      const result: Record<string, any> = {};
      Object.entries(mapping).forEach(([targetKey, sourcePath]) => {
        // sourcePath format: "stepId.path.to.value"
        const [stepId, ...pathParts] = sourcePath.split('.');
        let value = sourceResults[stepId];

        // Navigate path
        for (const part of pathParts) {
          if (value && typeof value === 'object' && part in value) {
            value = value[part];
          } else {
            value = undefined;
            break;
          }
        }

        if (value !== undefined) {
          result[targetKey] = value;
        }
      });
      return result;
    }

    // Default: merge all results into flat object
    return sourceResults;
  }

  /**
   * Get execution statistics for a DAG execution
   */
  static getExecutionStats(executions: StepExecution[]): {
    total: number;
    passed: number;
    failed: number;
    duration: number;
  } {
    return {
      total: executions.length,
      passed: executions.filter(e => e.status === 'passed').length,
      failed: executions.filter(e => e.status === 'failed').length,
      duration: executions.reduce((sum, e) => sum + (e.duration || 0), 0),
    };
  }
}
