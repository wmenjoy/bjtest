/**
 * Workflow Bridge Service
 *
 * Unified bridge layer to synchronize state between TestCase and Workflow modules.
 * Provides conversion functions and unified execution state management.
 */

import {
  TestCase,
  Workflow,
  WorkflowStep,
  Priority,
  Status,
  ExecutionStatus,
  StepExecution,
  Environment,
  WorkflowNode,
  NodeType
} from '../types';

// ===== CONVERSION FUNCTIONS =====

/**
 * WorkflowBridge - Handles bidirectional conversion between TestCase and Workflow
 */
export class WorkflowBridge {
  /**
   * Convert TestCase to Workflow
   * Maps test case structure to workflow format for unified execution
   */
  static testCaseToWorkflow(testCase: TestCase): Workflow {
    return {
      id: `wf-from-tc-${testCase.id}`,
      projectId: testCase.projectId,
      name: testCase.title,
      description: testCase.description,
      nodes: this.convertStepsToNodes(testCase.steps),
      inputSchema: testCase.variables ? this.variablesToInputSchema(testCase.variables) : [],
      outputSchema: [],
      lastRunStatus: testCase.lastRunAt ? ExecutionStatus.PASSED : undefined,
      lastRunAt: testCase.lastRunAt,
    };
  }

  /**
   * Convert Workflow to TestCase
   * Maps workflow structure to test case format
   */
  static workflowToTestCase(workflow: Workflow, folderId: string): TestCase {
    return {
      id: `tc-from-wf-${workflow.id}`,
      projectId: workflow.projectId,
      title: workflow.name,
      description: workflow.description,
      steps: this.convertNodesToSteps(workflow.nodes),
      automationType: 'WORKFLOW',
      linkedWorkflowId: workflow.id,
      priority: Priority.MEDIUM,
      status: Status.ACTIVE,
      tags: [],
      folderId,
      lastUpdated: new Date().toISOString(),
      variables: this.inputSchemaToVariables(workflow.inputSchema || []),
      preconditions: [],
      lastRunAt: workflow.lastRunAt,
    };
  }

  /**
   * Convert WorkflowSteps to WorkflowNodes
   * TestCase uses steps array, Workflow uses nodes array
   */
  private static convertStepsToNodes(steps: WorkflowStep[]): WorkflowNode[] {
    return steps.map((step, index) => this.stepToNode(step, index));
  }

  /**
   * Convert single WorkflowStep to WorkflowNode
   */
  private static stepToNode(step: WorkflowStep, index: number): WorkflowNode {
    const nodeType = this.mapStepTypeToNodeType(step.type);

    const node: WorkflowNode = {
      id: step.id,
      type: nodeType,
      name: step.name || `Step ${index + 1}`,
      config: step.config || {},
    };

    // Add children for loop/branch steps
    if (step.children && step.children.length > 0) {
      node.children = this.convertStepsToNodes(step.children);
    }

    // Add step reference if linked to a script
    if (step.linkedScriptId) {
      node.referenceId = step.linkedScriptId;
    }

    // Add workflow reference if linked to a workflow
    if (step.linkedWorkflowId) {
      node.referenceId = step.linkedWorkflowId;
      node.config = { ...node.config, targetWorkflowId: step.linkedWorkflowId };
    }

    return node;
  }

  /**
   * Map StepType to NodeType
   */
  private static mapStepTypeToNodeType(stepType: string): NodeType {
    const typeMap: Record<string, NodeType> = {
      'http': NodeType.HTTP_REQUEST,
      'command': NodeType.SHELL_CMD,
      'assertion': NodeType.CONDITION,
      'loop': NodeType.LOOP,
      'branch': NodeType.BRANCH,
      'merge': NodeType.MERGE,
      'group': NodeType.STEP,
    };

    return typeMap[stepType] || NodeType.STEP;
  }

  /**
   * Convert WorkflowNodes to WorkflowSteps
   */
  private static convertNodesToSteps(nodes: WorkflowNode[]): WorkflowStep[] {
    return nodes.map((node, index) => this.nodeToStep(node, index));
  }

  /**
   * Convert single WorkflowNode to WorkflowStep
   */
  private static nodeToStep(node: WorkflowNode, index: number): WorkflowStep {
    const stepType = this.mapNodeTypeToStepType(node.type);

    const step: WorkflowStep = {
      id: node.id,
      name: node.name,
      type: stepType,
      config: node.config || {},
    };

    // Add children for loop/branch nodes
    if (node.children && node.children.length > 0) {
      step.children = this.convertNodesToSteps(node.children);
    }

    // Add linked references
    if (node.referenceId) {
      if (node.type === NodeType.SCRIPT) {
        step.linkedScriptId = node.referenceId;
      } else if (node.type === NodeType.CALL_WORKFLOW) {
        step.linkedWorkflowId = node.referenceId;
      }
    }

    return step;
  }

  /**
   * Map NodeType to StepType
   */
  private static mapNodeTypeToStepType(nodeType: NodeType): 'http' | 'command' | 'assertion' | 'loop' | 'branch' | 'merge' | 'group' {
    const typeMap: Record<NodeType, 'http' | 'command' | 'assertion' | 'loop' | 'branch' | 'merge' | 'group'> = {
      [NodeType.HTTP_REQUEST]: 'http',
      [NodeType.SHELL_CMD]: 'command',
      [NodeType.CONDITION]: 'assertion',
      [NodeType.LOOP]: 'loop',
      [NodeType.BRANCH]: 'branch',
      [NodeType.MERGE]: 'merge',
      [NodeType.STEP]: 'group',
      // Default mappings for other types
      [NodeType.TEST_CASE]: 'group',
      [NodeType.SCRIPT]: 'command',
      [NodeType.JSON_TRANSFORM]: 'group',
      [NodeType.WAIT]: 'group',
      [NodeType.WEBHOOK]: 'http',
      [NodeType.SCHEDULE]: 'group',
      [NodeType.DB_QUERY]: 'command',
      [NodeType.BROWSER_ACTION]: 'command',
      [NodeType.RPC_CALL]: 'http',
      [NodeType.LLM_PROMPT]: 'http',
      [NodeType.REPORT_GEN]: 'group',
      [NodeType.REDIS_CMD]: 'command',
      [NodeType.KAFKA_PUB]: 'command',
      [NodeType.ES_QUERY]: 'command',
      [NodeType.MCP_TOOL]: 'command',
      [NodeType.CALL_WORKFLOW]: 'group',
    };

    return typeMap[nodeType] || 'group';
  }

  /**
   * Convert variables record to input schema
   */
  private static variablesToInputSchema(variables: Record<string, string>) {
    return Object.entries(variables).map(([key, value]) => ({
      name: key,
      type: 'string' as const,
      description: `Variable ${key}`,
      required: false,
      defaultValue: value,
    }));
  }

  /**
   * Convert input schema to variables record
   */
  private static inputSchemaToVariables(inputSchema: Array<{ name: string; defaultValue?: any }>) {
    const variables: Record<string, string> = {};
    inputSchema.forEach(param => {
      if (param.defaultValue !== undefined) {
        variables[param.name] = String(param.defaultValue);
      }
    });
    return variables;
  }
}

// ===== UNIFIED EXECUTION STATE =====

/**
 * UnifiedExecutionState - Common execution state for both TestCase and Workflow
 */
export interface UnifiedExecutionState {
  /** Unique execution ID */
  id: string;

  /** Type of source - test case or workflow */
  type: 'test-case' | 'workflow';

  /** Original source ID (TestCase.id or Workflow.id) */
  sourceId: string;

  /** Source name for display */
  sourceName: string;

  /** Execution status */
  status: ExecutionStatus;

  /** ISO timestamp when execution started */
  startedAt: string;

  /** ISO timestamp when execution completed */
  completedAt?: string;

  /** Duration in milliseconds */
  duration?: number;

  /** Step execution details */
  steps: StepExecution[];

  /** Execution logs */
  logs: string[];

  /** Environment used for execution */
  environment?: string;

  /** Error message if execution failed */
  error?: string;

  /** Additional metadata */
  metadata?: {
    triggeredBy?: string;
    runCount?: number;
    retryCount?: number;
    variables?: Record<string, any>;
  };
}

/**
 * ExecutionStateManager - Manages execution state across TestCase and Workflow
 */
export class ExecutionStateManager {
  private static executionHistory: Map<string, UnifiedExecutionState[]> = new Map();

  /**
   * Create unified execution state from TestCase or Workflow
   */
  static createExecutionState(
    source: TestCase | Workflow,
    environment?: Environment
  ): UnifiedExecutionState {
    const isTestCase = 'steps' in source && 'folderId' in source;

    const executionState: UnifiedExecutionState = {
      id: `exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: isTestCase ? 'test-case' : 'workflow',
      sourceId: source.id,
      sourceName: isTestCase ? (source as TestCase).title : (source as Workflow).name,
      status: ExecutionStatus.PENDING,
      startedAt: new Date().toISOString(),
      steps: [],
      logs: [],
      environment: environment?.name,
      metadata: {
        variables: isTestCase ? (source as TestCase).variables : {},
      },
    };

    return executionState;
  }

  /**
   * Update execution state
   */
  static updateExecutionState(
    executionId: string,
    updates: Partial<UnifiedExecutionState>
  ): void {
    // Find the execution in history
    for (const [sourceId, history] of this.executionHistory.entries()) {
      const index = history.findIndex(exec => exec.id === executionId);
      if (index !== -1) {
        history[index] = { ...history[index], ...updates };
        break;
      }
    }
  }

  /**
   * Add execution to history
   */
  static addExecutionToHistory(execution: UnifiedExecutionState): void {
    const history = this.executionHistory.get(execution.sourceId) || [];
    history.unshift(execution); // Add to beginning

    // Keep only last 50 executions per source
    if (history.length > 50) {
      history.pop();
    }

    this.executionHistory.set(execution.sourceId, history);
  }

  /**
   * Get execution history for a source
   */
  static getExecutionHistory(
    sourceId: string,
    type?: 'test-case' | 'workflow'
  ): UnifiedExecutionState[] {
    const history = this.executionHistory.get(sourceId) || [];

    if (type) {
      return history.filter(exec => exec.type === type);
    }

    return history;
  }

  /**
   * Get latest execution for a source
   */
  static getLatestExecution(sourceId: string): UnifiedExecutionState | null {
    const history = this.executionHistory.get(sourceId);
    return history && history.length > 0 ? history[0] : null;
  }

  /**
   * Get all executions across all sources
   */
  static getAllExecutions(limit?: number): UnifiedExecutionState[] {
    const allExecutions: UnifiedExecutionState[] = [];

    for (const history of this.executionHistory.values()) {
      allExecutions.push(...history);
    }

    // Sort by startedAt descending
    allExecutions.sort((a, b) =>
      new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
    );

    return limit ? allExecutions.slice(0, limit) : allExecutions;
  }

  /**
   * Clear execution history for a source
   */
  static clearHistory(sourceId: string): void {
    this.executionHistory.delete(sourceId);
  }

  /**
   * Clear all execution history
   */
  static clearAllHistory(): void {
    this.executionHistory.clear();
  }

  /**
   * Get execution statistics for a source
   */
  static getExecutionStats(sourceId: string): {
    totalRuns: number;
    successRate: number;
    avgDuration: number;
    lastRunAt?: string;
    lastStatus?: ExecutionStatus;
  } {
    const history = this.executionHistory.get(sourceId) || [];

    if (history.length === 0) {
      return {
        totalRuns: 0,
        successRate: 0,
        avgDuration: 0,
      };
    }

    const completed = history.filter(exec => exec.completedAt);
    const passed = completed.filter(exec => exec.status === ExecutionStatus.PASSED);
    const durations = completed
      .filter(exec => exec.duration !== undefined)
      .map(exec => exec.duration!);

    const avgDuration = durations.length > 0
      ? durations.reduce((sum, d) => sum + d, 0) / durations.length
      : 0;

    return {
      totalRuns: history.length,
      successRate: completed.length > 0 ? (passed.length / completed.length) * 100 : 0,
      avgDuration,
      lastRunAt: history[0]?.startedAt,
      lastStatus: history[0]?.status,
    };
  }
}

// ===== HELPER FUNCTIONS =====

/**
 * Check if a source is a TestCase
 */
export function isTestCase(source: TestCase | Workflow): source is TestCase {
  return 'folderId' in source;
}

/**
 * Check if a source is a Workflow
 */
export function isWorkflow(source: TestCase | Workflow): source is Workflow {
  return 'nodes' in source;
}

/**
 * Get unified display name for a source
 */
export function getSourceDisplayName(source: TestCase | Workflow): string {
  return isTestCase(source) ? source.title : source.name;
}

/**
 * Get unified project ID for a source
 */
export function getSourceProjectId(source: TestCase | Workflow): string {
  return source.projectId;
}
