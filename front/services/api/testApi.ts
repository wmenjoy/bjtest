/**
 * Test Case API Service
 */

import { TestCase } from '../../types';
import { apiClient, PaginatedResponse, PaginationParams, toApiPagination, fromPaginatedResponse } from './apiClient';
import { BackendTestCase, CreateTestCaseRequest, UpdateTestCaseRequest } from './backendTypes';
import { testCaseFromBackend, testCaseToBackend } from './mappers';

export const testApi = {
  /**
   * 获取测试案例列表
   */
  async list(params?: PaginationParams) {
    const apiParams = params ? toApiPagination(params) : { limit: 20, offset: 0 };
    const response = await apiClient.get<PaginatedResponse<BackendTestCase>>('/tests', apiParams);
    return fromPaginatedResponse(response, testCaseFromBackend);
  },

  /**
   * 获取单个测试案例
   */
  async get(testId: string): Promise<TestCase> {
    const response = await apiClient.get<BackendTestCase>(`/tests/${testId}`);
    return testCaseFromBackend(response);
  },

  /**
   * 创建测试案例
   */
  async create(testCase: TestCase): Promise<TestCase> {
    const request = testCaseToBackend(testCase);
    const response = await apiClient.post<BackendTestCase>('/tests', request);
    return testCaseFromBackend(response);
  },

  /**
   * 更新测试案例
   */
  async update(testId: string, testCase: TestCase): Promise<TestCase> {
    // Use full type mapper for complete field conversion
    const request = testCaseToBackend(testCase);
    const response = await apiClient.put<BackendTestCase>(`/tests/${testId}`, request);
    return testCaseFromBackend(response);
  },

  /**
   * 删除测试案例
   */
  async delete(testId: string): Promise<void> {
    await apiClient.delete(`/tests/${testId}`);
  },

  /**
   * 搜索测试案例
   */
  async search(query: string): Promise<TestCase[]> {
    const response = await apiClient.get<BackendTestCase[]>('/tests/search', { q: query });
    return response.map(testCaseFromBackend);
  },

  /**
   * 执行测试案例
   */
  async execute(testId: string): Promise<{
    resultId: string;
    status: string;
    response?: unknown;
  }> {
    return apiClient.post(`/tests/${testId}/execute`);
  },

  /**
   * 获取测试历史
   */
  async getHistory(testId: string, limit = 10): Promise<unknown[]> {
    return apiClient.get(`/tests/${testId}/history`, { limit });
  },
};
