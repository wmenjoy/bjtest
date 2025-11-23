/**
 * Test Group API Service
 */

import { TestFolder } from '../../types';
import { apiClient, PaginatedResponse } from './apiClient';
import { BackendTestGroup, CreateTestGroupRequest, UpdateTestGroupRequest } from './backendTypes';
import { testFolderFromBackend, testFolderToBackend } from './mappers';

export const groupApi = {
  /**
   * 获取分组列表
   */
  async list(): Promise<TestFolder[]> {
    const response = await apiClient.get<PaginatedResponse<BackendTestGroup>>('/groups');
    return response.data.map(testFolderFromBackend);
  },

  /**
   * 获取分组树
   */
  async tree(): Promise<TestFolder[]> {
    const response = await apiClient.get<BackendTestGroup[]>('/groups/tree');
    return response.map(testFolderFromBackend);
  },

  /**
   * 获取单个分组
   */
  async get(groupId: string): Promise<TestFolder> {
    const response = await apiClient.get<BackendTestGroup>(`/groups/${groupId}`);
    return testFolderFromBackend(response);
  },

  /**
   * 创建分组
   */
  async create(folder: TestFolder): Promise<TestFolder> {
    const request = testFolderToBackend(folder);
    const response = await apiClient.post<BackendTestGroup>('/groups', request);
    return testFolderFromBackend(response);
  },

  /**
   * 更新分组
   */
  async update(groupId: string, updates: Partial<TestFolder>): Promise<TestFolder> {
    const request: UpdateTestGroupRequest = {};
    if (updates.name) request.name = updates.name;
    if (updates.parentId) request.parentId = updates.parentId === 'root' ? undefined : updates.parentId;

    const response = await apiClient.put<BackendTestGroup>(`/groups/${groupId}`, request);
    return testFolderFromBackend(response);
  },

  /**
   * 删除分组
   */
  async delete(groupId: string): Promise<void> {
    await apiClient.delete(`/groups/${groupId}`);
  },

  /**
   * 执行分组内所有测试
   */
  async execute(groupId: string): Promise<unknown> {
    return apiClient.post(`/groups/${groupId}/execute`);
  },
};
