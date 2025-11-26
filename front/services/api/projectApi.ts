/**
 * Project API Service (v2)
 */

import { Project } from '../../types';
import { apiClientV2 } from './apiClient';
import { BackendProject, CreateProjectRequest, UpdateProjectRequest } from './backendTypes';
import { projectFromBackend, projectToBackend } from './mappers';

interface ProjectListResponse {
  data: BackendProject[];
  total: number;
}

export const projectApi = {
  /**
   * 获取所有项目列表
   */
  async list(): Promise<Project[]> {
    const response = await apiClientV2.get<ProjectListResponse>('/projects');
    return response.data.map(projectFromBackend);
  },

  /**
   * 获取单个项目
   */
  async get(projectId: string): Promise<Project> {
    const response = await apiClientV2.get<BackendProject>(`/projects/${projectId}`);
    return projectFromBackend(response);
  },

  /**
   * 创建项目
   */
  async create(project: Project): Promise<Project> {
    const request: CreateProjectRequest = {
      ...projectToBackend(project),
    };
    const response = await apiClientV2.post<BackendProject>('/projects', request);
    return projectFromBackend(response);
  },

  /**
   * 更新项目
   */
  async update(projectId: string, updates: Partial<Project>): Promise<Project> {
    const request: UpdateProjectRequest = {};
    if (updates.name) {
      request.name = updates.name;
      request.displayName = updates.name;
    }
    if (updates.description) request.description = updates.description;

    const response = await apiClientV2.put<BackendProject>(`/projects/${projectId}`, request);
    return projectFromBackend(response);
  },

  /**
   * 删除项目
   */
  async delete(projectId: string): Promise<void> {
    await apiClientV2.delete(`/projects/${projectId}`);
  },

  /**
   * 归档项目
   */
  async archive(projectId: string): Promise<void> {
    await apiClientV2.post(`/projects/${projectId}/archive`);
  },

  /**
   * 激活项目
   */
  async activate(projectId: string): Promise<void> {
    await apiClientV2.post(`/projects/${projectId}/activate`);
  },

  /**
   * 获取项目的测试分组
   */
  async getTestGroups(projectId: string): Promise<unknown> {
    return apiClientV2.get(`/projects/${projectId}/test-groups`);
  },

  /**
   * 获取项目的测试案例
   */
  async getTestCases(projectId: string): Promise<unknown> {
    return apiClientV2.get(`/projects/${projectId}/test-cases`);
  },

  /**
   * 获取项目成员
   */
  async getMembers(projectId: string): Promise<unknown> {
    return apiClientV2.get(`/projects/${projectId}/members`);
  },

  /**
   * 更新项目统计
   */
  async updateStats(projectId: string): Promise<void> {
    await apiClientV2.post(`/projects/${projectId}/update-stats`);
  },
};
