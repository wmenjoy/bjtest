/**
 * Type Mappers - 前后端类型转换
 * 遵循 API_COMMUNICATION_SPEC.md 规范
 */

import { Priority, Status, ExecutionStatus, TestCase, TestFolder, TestRun, Environment, EnvironmentVariable, Workflow, WorkflowNode, NodeType, Organization, Project, TestStep } from '../../types';
import {
  BackendTestCase,
  BackendTestGroup,
  BackendEnvironment,
  BackendWorkflow,
  BackendWorkflowStep,
  BackendTenant,
  BackendProject,
  BackendTestResult,
  CreateTestCaseRequest,
  CreateTestGroupRequest,
  CreateEnvironmentRequest,
} from './backendTypes';

// ===== Priority 映射 =====

export function priorityFromBackend(priority: string): Priority {
  switch (priority) {
    case 'P0': return Priority.CRITICAL;
    case 'P1': return Priority.HIGH;
    case 'P2': return Priority.MEDIUM;
    default: return Priority.LOW;
  }
}

export function priorityToBackend(priority: Priority): 'P0' | 'P1' | 'P2' | '' {
  switch (priority) {
    case Priority.CRITICAL: return 'P0';
    case Priority.HIGH: return 'P1';
    case Priority.MEDIUM: return 'P2';
    default: return '';
  }
}

// ===== Status 映射 =====

export function statusFromBackend(status: string): Status {
  switch (status) {
    case 'active': return Status.ACTIVE;
    case 'inactive': return Status.DEPRECATED;
    case 'draft': return Status.DRAFT;
    default: return Status.DRAFT;
  }
}

export function statusToBackend(status: Status): 'active' | 'inactive' | 'draft' {
  switch (status) {
    case Status.ACTIVE: return 'active';
    case Status.DEPRECATED: return 'inactive';
    case Status.DRAFT: return 'draft';
  }
}

// ===== ExecutionStatus 映射 =====

export function executionStatusFromBackend(status: string): ExecutionStatus {
  switch (status) {
    case 'pending': return ExecutionStatus.PENDING;
    case 'running': return ExecutionStatus.RUNNING;
    case 'passed':
    case 'success': return ExecutionStatus.PASSED;
    case 'failed': return ExecutionStatus.FAILED;
    case 'blocked': return ExecutionStatus.BLOCKED;
    case 'skipped': return ExecutionStatus.SKIPPED;
    default: return ExecutionStatus.PENDING;
  }
}

// ===== TestCase 映射 =====

// 从后端配置生成前端步骤
function generateStepsFromBackend(backend: BackendTestCase): TestStep[] {
  const steps: TestStep[] = [];

  if (backend.type === 'http' && backend.http) {
    steps.push({
      id: `step-${backend.testId}-http`,
      summary: `HTTP ${backend.http.method} Request`,
      instruction: `Send ${backend.http.method} request to ${backend.http.url || backend.http.path || 'endpoint'}`,
      expectedResult: 'Request should return expected response',
      parameterValues: {
        method: backend.http.method,
        url: backend.http.url || backend.http.path || '',
        ...(backend.http.headers ? { headers: JSON.stringify(backend.http.headers) } : {}),
        ...(backend.http.body ? { body: JSON.stringify(backend.http.body) } : {}),
      },
    });
  } else if (backend.type === 'command' && backend.command) {
    steps.push({
      id: `step-${backend.testId}-cmd`,
      summary: `Execute Command`,
      instruction: `Run command: ${backend.command.cmd} ${(backend.command.args || []).join(' ')}`,
      expectedResult: 'Command should execute successfully',
      parameterValues: {
        command: backend.command.cmd,
        args: (backend.command.args || []).join(' '),
      },
    });
  } else if (backend.type === 'workflow' && backend.workflowId) {
    steps.push({
      id: `step-${backend.testId}-workflow`,
      summary: `Execute Workflow`,
      instruction: `Execute workflow: ${backend.workflowId}`,
      expectedResult: 'Workflow should complete successfully',
      linkedWorkflowId: backend.workflowId,
    });
  }

  return steps;
}

export function testCaseFromBackend(backend: BackendTestCase): TestCase {
  return {
    id: backend.testId,
    projectId: backend.projectId || 'default',
    title: backend.name,
    description: backend.objective || '',
    priority: priorityFromBackend(backend.priority),
    status: statusFromBackend(backend.status),
    steps: generateStepsFromBackend(backend),
    tags: backend.tags || [],
    folderId: backend.groupId,
    lastUpdated: backend.updatedAt,
    automationType: backend.type === 'workflow' ? 'WORKFLOW' : 'MANUAL',
    linkedWorkflowId: backend.workflowId,
  };
}

export function testCaseToBackend(testCase: TestCase): CreateTestCaseRequest {
  return {
    testId: testCase.id,
    groupId: testCase.folderId,
    name: testCase.title,
    type: testCase.automationType === 'WORKFLOW' ? 'workflow' : 'http',
    priority: priorityToBackend(testCase.priority) || undefined,
    status: statusToBackend(testCase.status),
    objective: testCase.description,
    workflowId: testCase.linkedWorkflowId,
    tags: testCase.tags,
  };
}

// ===== TestFolder/TestGroup 映射 =====

export function testFolderFromBackend(backend: BackendTestGroup): TestFolder {
  return {
    id: backend.groupId,
    projectId: backend.projectId || 'default',
    name: backend.name,
    parentId: backend.parentId || 'root',
    type: backend.parentId ? 'folder' : 'module',
  };
}

export function testFolderToBackend(folder: TestFolder): CreateTestGroupRequest {
  return {
    groupId: folder.id,
    name: folder.name,
    parentId: folder.parentId === 'root' ? undefined : folder.parentId,
    description: undefined,
  };
}

// ===== Environment 映射 =====

export function environmentFromBackend(backend: BackendEnvironment): Environment {
  const variables: EnvironmentVariable[] = [];
  if (backend.variables) {
    Object.entries(backend.variables).forEach(([key, value]) => {
      variables.push({
        key,
        value: String(value),
        isSecret: key.toLowerCase().includes('secret') ||
                  key.toLowerCase().includes('password') ||
                  key.toLowerCase().includes('token') ||
                  key.toLowerCase().includes('api_key'),
      });
    });
  }

  return {
    id: backend.envId,
    projectId: backend.projectId || 'default',
    name: backend.name,
    variables,
    color: backend.isActive ? '#10b981' : '#6b7280', // 绿色=激活, 灰色=未激活
  };
}

export function environmentToBackend(env: Environment): CreateEnvironmentRequest {
  const variables: Record<string, unknown> = {};
  env.variables.forEach(v => {
    variables[v.key] = v.value;
  });

  return {
    envId: env.id,
    name: env.name,
    variables,
  };
}

// ===== TestRun 映射 =====

export function testRunFromBackend(backend: BackendTestResult): TestRun {
  return {
    id: backend.resultId,
    projectId: 'default', // 后端可能不返回此字段
    name: `Run ${backend.resultId}`,
    caseId: backend.testId,
    executedAt: backend.startTime,
    status: executionStatusFromBackend(backend.status),
    notes: backend.error,
    logs: [], // 需要单独获取
  };
}

// ===== Workflow 映射 =====

// ===== Workflow Step Type 映射 =====

function stepTypeToNodeType(stepType: string): NodeType {
  switch (stepType) {
    case 'http': return NodeType.HTTP_REQUEST;
    case 'command': return NodeType.SCRIPT;
    case 'test-case': return NodeType.TEST_CASE;
    case 'script': return NodeType.SCRIPT;
    case 'database': return NodeType.DB_QUERY;
    case 'assert': return NodeType.STEP;
    default: return NodeType.SCRIPT;
  }
}

function nodeTypeToStepType(nodeType: NodeType): string {
  switch (nodeType) {
    case NodeType.HTTP_REQUEST: return 'http';
    case NodeType.TEST_CASE: return 'test-case';
    case NodeType.DB_QUERY: return 'database';
    case NodeType.SCRIPT: return 'script';
    case NodeType.STEP: return 'assert';
    default: return 'command';
  }
}

function backendStepToNode(stepId: string, step: BackendWorkflowStep): WorkflowNode {
  return {
    id: stepId,
    type: stepTypeToNodeType(step.type),
    name: step.name,
    config: step.config as any,
    referenceId: step.config?.testCaseId as string || step.config?.scriptId as string,
  };
}

function nodeToBackendStep(node: WorkflowNode, dependsOn: string[] = []): BackendWorkflowStep {
  return {
    id: node.id,
    name: node.name,
    type: nodeTypeToStepType(node.type) as any,
    dependsOn: dependsOn.length > 0 ? dependsOn : undefined,
    config: node.config || {},
    onError: 'abort',
  };
}

export function workflowFromBackend(backend: BackendWorkflow): Workflow {
  // 将后端 steps (DAG) 转换为前端 nodes (树)
  // 简化实现：将所有步骤平铺为线性列表
  const nodes: WorkflowNode[] = [];

  if (backend.definition?.steps) {
    // 按依赖关系排序步骤
    const stepEntries = Object.entries(backend.definition.steps);
    const sortedSteps = topologicalSort(stepEntries);

    for (const [stepId, step] of sortedSteps) {
      nodes.push(backendStepToNode(stepId, step));
    }
  }

  return {
    id: backend.workflowId,
    projectId: backend.projectId || 'default',
    name: backend.name,
    description: backend.description || '',
    nodes,
    lastRunStatus: undefined,
    lastRunAt: backend.updatedAt,
  };
}

// 拓扑排序：按依赖关系排序步骤
function topologicalSort(steps: [string, BackendWorkflowStep][]): [string, BackendWorkflowStep][] {
  const sorted: [string, BackendWorkflowStep][] = [];
  const visited = new Set<string>();
  const visiting = new Set<string>();
  const stepMap = new Map(steps);

  function visit(stepId: string) {
    if (visited.has(stepId)) return;
    if (visiting.has(stepId)) return; // 循环依赖，跳过

    visiting.add(stepId);
    const step = stepMap.get(stepId);
    if (step?.dependsOn) {
      for (const dep of step.dependsOn) {
        visit(dep);
      }
    }
    visiting.delete(stepId);
    visited.add(stepId);
    if (step) {
      sorted.push([stepId, step]);
    }
  }

  for (const [stepId] of steps) {
    visit(stepId);
  }

  return sorted;
}

export function workflowToBackend(workflow: Workflow): any {
  // 将前端 nodes (树) 转换为后端 steps (DAG)
  // 简化实现：将线性列表转换为依赖链
  const steps: Record<string, BackendWorkflowStep> = {};

  let previousStepId: string | null = null;
  for (const node of workflow.nodes) {
    const dependsOn = previousStepId ? [previousStepId] : [];
    steps[node.id] = nodeToBackendStep(node, dependsOn);
    previousStepId = node.id;
  }

  return {
    workflowId: workflow.id,
    projectId: workflow.projectId,
    name: workflow.name,
    description: workflow.description,
    definition: {
      variables: {},
      steps,
    },
  };
}

// ===== Tenant/Organization 映射 =====

export function organizationFromBackend(backend: BackendTenant): Organization {
  return {
    id: backend.tenantId,
    name: backend.displayName || backend.name,
    parentId: undefined,
    type: 'department',
  };
}

export function organizationToBackend(org: Organization): {
  tenantId: string;
  name: string;
  displayName?: string
} {
  return {
    tenantId: org.id,
    name: org.name,
    displayName: org.name,
  };
}

// ===== Project 映射 =====

export function projectFromBackend(backend: BackendProject): Project {
  return {
    id: backend.projectId,
    orgId: backend.tenantId,
    name: backend.displayName || backend.name,
    description: backend.description,
    key: backend.projectId.toUpperCase().replace(/-/g, '_'),
  };
}

export function projectToBackend(project: Project): {
  projectId: string;
  tenantId: string;
  name: string;
  displayName?: string;
  description?: string;
} {
  return {
    projectId: project.id,
    tenantId: project.orgId,
    name: project.name,
    displayName: project.name,
    description: project.description,
  };
}

// ===== 导出别名 (为了兼容性) =====

// Group 是 Folder 的别名
export const groupFromBackend = testFolderFromBackend;
export const groupToBackend = testFolderToBackend;

