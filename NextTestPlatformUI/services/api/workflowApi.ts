/**
 * Workflow API Service
 */

import { apiClient, PaginatedResponse, PaginationParams, toApiPagination } from './apiClient';
import { BackendWorkflow, BackendWorkflowRun, CreateWorkflowRequest } from './backendTypes';

export const workflowApi = {
  /**
   * 获取工作流列表
   */
  async list(params?: PaginationParams) {
    const apiParams = params ? toApiPagination(params) : { limit: 20, offset: 0 };
    return apiClient.get<PaginatedResponse<BackendWorkflow>>('/workflows', apiParams);
  },

  /**
   * 获取单个工作流
   */
  async get(workflowId: string): Promise<BackendWorkflow> {
    return apiClient.get(`/workflows/${workflowId}`);
  },

  /**
   * 创建工作流
   */
  async create(workflow: CreateWorkflowRequest): Promise<BackendWorkflow> {
    return apiClient.post('/workflows', workflow);
  },

  /**
   * 更新工作流
   */
  async update(workflowId: string, updates: Partial<CreateWorkflowRequest>): Promise<BackendWorkflow> {
    return apiClient.put(`/workflows/${workflowId}`, updates);
  },

  /**
   * 删除工作流
   */
  async delete(workflowId: string): Promise<void> {
    await apiClient.delete(`/workflows/${workflowId}`);
  },

  /**
   * 执行工作流
   */
  async execute(workflowId: string, variables?: Record<string, unknown>): Promise<BackendWorkflowRun> {
    return apiClient.post(`/workflows/${workflowId}/execute`, variables ? { variables } : undefined);
  },

  /**
   * 获取工作流执行记录
   */
  async getRun(runId: string): Promise<BackendWorkflowRun> {
    return apiClient.get(`/workflows/runs/${runId}`);
  },

  /**
   * 获取工作流执行历史
   */
  async getRunHistory(workflowId: string, params?: PaginationParams) {
    const apiParams = params ? toApiPagination(params) : { limit: 20, offset: 0 };
    return apiClient.get<PaginatedResponse<BackendWorkflowRun>>(`/workflows/${workflowId}/runs`, apiParams);
  },

  /**
   * 获取执行步骤详情
   */
  async getRunSteps(runId: string): Promise<unknown[]> {
    return apiClient.get(`/workflows/runs/${runId}/steps`);
  },

  /**
   * 获取执行日志
   */
  async getRunLogs(runId: string, stepId?: string): Promise<unknown[]> {
    const params: Record<string, string> = {};
    if (stepId) params.stepId = stepId;
    return apiClient.get(`/workflows/runs/${runId}/logs`, params);
  },
};
