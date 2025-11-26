/**
 * Tenant API Service (v2)
 */

import { Organization } from '../../types';
import { apiClientV2, PaginatedResponse } from './apiClient';
import { BackendTenant, CreateTenantRequest, UpdateTenantRequest } from './backendTypes';
import { organizationFromBackend, organizationToBackend } from './mappers';

interface TenantListResponse {
  data: BackendTenant[];
  total: number;
}

export const tenantApi = {
  /**
   * 获取租户列表
   */
  async list(): Promise<Organization[]> {
    const response = await apiClientV2.get<TenantListResponse>('/tenants');
    return response.data.map(organizationFromBackend);
  },

  /**
   * 获取活跃租户列表
   */
  async listActive(): Promise<Organization[]> {
    const response = await apiClientV2.get<TenantListResponse>('/tenants/active');
    return response.data.map(organizationFromBackend);
  },

  /**
   * 获取单个租户
   */
  async get(tenantId: string): Promise<Organization> {
    const response = await apiClientV2.get<BackendTenant>(`/tenants/${tenantId}`);
    return organizationFromBackend(response);
  },

  /**
   * 创建租户
   */
  async create(org: Organization): Promise<Organization> {
    const request: CreateTenantRequest = {
      ...organizationToBackend(org),
      maxProjects: 10,
      maxUsers: 50,
      maxTestCases: 1000,
    };
    const response = await apiClientV2.post<BackendTenant>('/tenants', request);
    return organizationFromBackend(response);
  },

  /**
   * 更新租户
   */
  async update(tenantId: string, updates: Partial<Organization>): Promise<Organization> {
    const request: UpdateTenantRequest = {};
    if (updates.name) {
      request.name = updates.name;
      request.displayName = updates.name;
    }

    const response = await apiClientV2.put<BackendTenant>(`/tenants/${tenantId}`, request);
    return organizationFromBackend(response);
  },

  /**
   * 删除租户
   */
  async delete(tenantId: string): Promise<void> {
    await apiClientV2.delete(`/tenants/${tenantId}`);
  },

  /**
   * 暂停租户
   */
  async suspend(tenantId: string): Promise<void> {
    await apiClientV2.post(`/tenants/${tenantId}/suspend`);
  },

  /**
   * 激活租户
   */
  async activate(tenantId: string): Promise<void> {
    await apiClientV2.post(`/tenants/${tenantId}/activate`);
  },

  /**
   * 获取租户的项目列表
   */
  async getProjects(tenantId: string): Promise<unknown[]> {
    const response = await apiClientV2.get<{ data: unknown[]; total: number }>(`/tenants/${tenantId}/projects`);
    return response.data;
  },

  /**
   * 获取租户成员
   */
  async getMembers(tenantId: string): Promise<unknown> {
    return apiClientV2.get(`/tenants/${tenantId}/members`);
  },
};
