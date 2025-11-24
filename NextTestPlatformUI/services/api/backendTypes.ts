/**
 * Backend Types - 后端 API 类型定义
 * 遵循 API_COMMUNICATION_SPEC.md 规范
 */

// ===== 后端实体类型 =====

export interface BackendTestCase {
  id: number;
  testId: string;
  tenantId: string;
  projectId: string;
  groupId: string;
  name: string;
  type: 'http' | 'command' | 'workflow';
  priority: '' | 'P0' | 'P1' | 'P2';
  status: 'active' | 'inactive' | 'draft';
  objective?: string;
  timeout: number;
  http?: {
    method: string;
    url?: string;
    path?: string;
    headers?: Record<string, string>;
    body?: unknown;
  };
  command?: {
    cmd: string;
    args?: string[];
    timeout?: number;
  };
  workflowId?: string;
  workflowDef?: unknown;
  assertions?: unknown[];
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface BackendTestGroup {
  id: number;
  groupId: string;
  tenantId: string;
  projectId: string;
  name: string;
  parentId?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BackendEnvironment {
  id: number;
  envId: string;
  tenantId: string;
  projectId: string;
  name: string;
  description?: string;
  isActive: boolean;
  variables?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface BackendWorkflow {
  id: number;
  workflowId: string;
  tenantId: string;
  projectId: string;
  name: string;
  version: string;
  description?: string;
  definition: {
    variables?: Record<string, unknown>;
    steps: Record<string, BackendWorkflowStep>;
  };
  isTestCase: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BackendWorkflowStep {
  id: string;
  name: string;
  type: 'http' | 'command' | 'test-case' | 'assert' | 'script' | 'database';
  dependsOn?: string[];
  config: Record<string, unknown>;
  onError?: 'abort' | 'continue';
  output?: Record<string, string>;
}

export interface BackendWorkflowRun {
  id: number;
  runId: string;
  workflowId: string;
  status: 'pending' | 'running' | 'success' | 'failed' | 'cancelled';
  startTime: string;
  endTime?: string;
  duration?: number;
  result?: string;
  error?: string;
  createdAt: string;
}

export interface BackendTenant {
  tenantId: string;
  name: string;
  displayName: string;
  description?: string;
  status: 'active' | 'suspended';
  maxProjects: number;
  maxUsers: number;
  maxTestCases: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface BackendProject {
  projectId: string;
  tenantId: string;
  name: string;
  displayName: string;
  description?: string;
  status: 'active' | 'archived';
  repositoryUrl?: string;
  testCaseCount: number;
  testGroupCount: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  tenant?: BackendTenant;
}

export interface BackendTestResult {
  id: number;
  resultId: string;
  testId: string;
  status: 'passed' | 'failed' | 'error' | 'skipped';
  startTime: string;
  endTime: string;
  duration: number;
  response?: {
    statusCode?: number;
    body?: unknown;
    workflowRunId?: string;
  };
  error?: string;
  createdAt: string;
}

// ===== 请求类型 =====

export interface CreateTestCaseRequest {
  testId: string;
  groupId: string;
  name: string;
  type: 'http' | 'command' | 'workflow';
  priority?: 'P0' | 'P1' | 'P2';
  status?: 'active' | 'inactive';
  objective?: string;
  timeout?: number;
  steps?: unknown[];  // Support for new step-based format with loop/branch
  http?: {
    method: string;
    url?: string;
    path?: string;
    headers?: Record<string, string>;
    body?: unknown;
  };
  workflowId?: string;
  workflowDef?: unknown;
  tags?: string[];
}

export interface UpdateTestCaseRequest {
  name?: string;
  priority?: 'P0' | 'P1' | 'P2';
  status?: 'active' | 'inactive';
  objective?: string;
  timeout?: number;
  steps?: unknown[];  // Support for new step-based format with loop/branch
  http?: {
    method: string;
    url?: string;
    path?: string;
    headers?: Record<string, string>;
    body?: unknown;
  };
  tags?: string[];
}

export interface CreateTestGroupRequest {
  groupId: string;
  name: string;
  parentId?: string;
  description?: string;
}

export interface UpdateTestGroupRequest {
  name?: string;
  parentId?: string;
  description?: string;
}

export interface CreateEnvironmentRequest {
  envId: string;
  name: string;
  description?: string;
  variables?: Record<string, unknown>;
}

export interface UpdateEnvironmentRequest {
  name?: string;
  description?: string;
  variables?: Record<string, unknown>;
}

export interface CreateWorkflowRequest {
  workflowId: string;
  name: string;
  version?: string;
  description?: string;
  definition: {
    variables?: Record<string, unknown>;
    steps: Record<string, BackendWorkflowStep>;
  };
  isTestCase?: boolean;
}

export interface CreateTenantRequest {
  tenantId: string;
  name: string;
  displayName?: string;
  description?: string;
  maxProjects?: number;
  maxUsers?: number;
  maxTestCases?: number;
}

export interface UpdateTenantRequest {
  name?: string;
  displayName?: string;
  description?: string;
  maxProjects?: number;
  maxUsers?: number;
  maxTestCases?: number;
}

export interface CreateProjectRequest {
  projectId: string;
  tenantId: string;
  name: string;
  displayName?: string;
  description?: string;
  repositoryUrl?: string;
}

export interface UpdateProjectRequest {
  name?: string;
  displayName?: string;
  description?: string;
  repositoryUrl?: string;
}
