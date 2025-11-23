/**
 * Environment API Service
 */

import { Environment } from '../../types';
import { apiClient, PaginatedResponse } from './apiClient';
import { BackendEnvironment, CreateEnvironmentRequest, UpdateEnvironmentRequest } from './backendTypes';
import { environmentFromBackend, environmentToBackend } from './mappers';

export const environmentApi = {
  /**
   * 获取环境列表
   */
  async list(): Promise<Environment[]> {
    const response = await apiClient.get<PaginatedResponse<BackendEnvironment>>('/environments');
    return response.data.map(environmentFromBackend);
  },

  /**
   * 获取单个环境
   */
  async get(envId: string): Promise<Environment> {
    const response = await apiClient.get<BackendEnvironment>(`/environments/${envId}`);
    return environmentFromBackend(response);
  },

  /**
   * 获取当前激活的环境
   */
  async getActive(): Promise<Environment | null> {
    try {
      const response = await apiClient.get<BackendEnvironment>('/environments/active');
      return environmentFromBackend(response);
    } catch (error) {
      // 404 表示没有激活的环境
      return null;
    }
  },

  /**
   * 创建环境
   */
  async create(env: Environment): Promise<Environment> {
    const request = environmentToBackend(env);
    const response = await apiClient.post<BackendEnvironment>('/environments', request);
    return environmentFromBackend(response);
  },

  /**
   * 更新环境
   */
  async update(envId: string, updates: Partial<Environment>): Promise<Environment> {
    const request: UpdateEnvironmentRequest = {};
    if (updates.name) request.name = updates.name;
    if (updates.variables) {
      request.variables = {};
      updates.variables.forEach(v => {
        request.variables![v.key] = v.value;
      });
    }

    const response = await apiClient.put<BackendEnvironment>(`/environments/${envId}`, request);
    return environmentFromBackend(response);
  },

  /**
   * 删除环境
   */
  async delete(envId: string): Promise<void> {
    await apiClient.delete(`/environments/${envId}`);
  },

  /**
   * 激活环境
   */
  async activate(envId: string): Promise<void> {
    await apiClient.post(`/environments/${envId}/activate`);
  },

  /**
   * 获取环境变量
   */
  async getVariables(envId: string): Promise<Record<string, unknown>> {
    return apiClient.get(`/environments/${envId}/variables`);
  },

  /**
   * 设置单个环境变量
   */
  async setVariable(envId: string, key: string, value: unknown): Promise<void> {
    await apiClient.put(`/environments/${envId}/variables/${key}`, { value });
  },

  /**
   * 删除单个环境变量
   */
  async deleteVariable(envId: string, key: string): Promise<void> {
    await apiClient.delete(`/environments/${envId}/variables/${key}`);
  },
};
