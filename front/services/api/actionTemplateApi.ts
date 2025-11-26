/**
 * Action Template API - Action Template 服务接口
 * 用于管理动作模板的 CRUD 操作和使用记录
 */

import { apiClient, toApiPagination, PaginationParams } from './apiClient';

// ===== 类型定义 =====

export interface ActionTemplate {
  id: number;
  templateId: string;
  tenantId: string;
  projectId?: string;
  name: string;
  description: string;
  category: string;
  type: string;
  configTemplate: Record<string, any>;
  parameters: any[];
  outputs: any[];
  scope: 'system' | 'platform' | 'organization' | 'project';
  isPublic: boolean;
  usageCount: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ActionTemplateFilter extends PaginationParams {
  projectId: string;
  category?: string;
  type?: string;
  search?: string;
}

export interface AccessibleTemplatesResponse {
  data: ActionTemplate[];
  total: number;
  limit: number;
  offset: number;
}

// ===== API 客户端 =====

export const actionTemplateApi = {
  /**
   * 获取可访问的 Action Templates (带过滤和分页)
   * GET /api/action-templates/accessible
   */
  getAccessibleTemplates: async (filter: ActionTemplateFilter): Promise<AccessibleTemplatesResponse> => {
    // 校验 projectId 必传
    if (!filter.projectId) {
      throw new Error('projectId is required');
    }

    const pagination = toApiPagination(filter);
    const params: Record<string, string | number> = {
      limit: pagination.limit,
      offset: pagination.offset,
      projectId: filter.projectId,
    };

    if (filter.category) {
      params.category = filter.category;
    }
    if (filter.type) {
      params.type = filter.type;
    }
    if (filter.search) {
      params.search = filter.search;
    }

    return apiClient.get<AccessibleTemplatesResponse>('/action-templates/accessible', params);
  },

  /**
   * 根据 ID 获取单个 Action Template
   * GET /api/action-templates/:id
   */
  getTemplate: async (templateId: string): Promise<ActionTemplate> => {
    return apiClient.get<ActionTemplate>(`/action-templates/${templateId}`);
  },

  /**
   * 记录 Action Template 使用次数
   * POST /api/action-templates/:templateId/usage
   */
  recordUsage: async (templateId: string): Promise<{ message: string; usageCount: number }> => {
    return apiClient.post<{ message: string; usageCount: number }>(
      `/action-templates/${templateId}/usage`
    );
  },

  /**
   * 创建新的 Action Template
   * POST /api/action-templates
   */
  createTemplate: async (
    template: Omit<ActionTemplate, 'id' | 'usageCount' | 'createdAt' | 'updatedAt'>,
    projectId?: string
  ): Promise<ActionTemplate> => {
    const payload = projectId ? { ...template, projectId } : template;
    return apiClient.post<ActionTemplate>('/action-templates', payload);
  },

  /**
   * 更新 Action Template
   * PUT /api/action-templates/:templateId
   */
  updateTemplate: async (
    templateId: string,
    updates: Partial<Omit<ActionTemplate, 'id' | 'templateId' | 'tenantId' | 'createdAt' | 'updatedAt'>>
  ): Promise<ActionTemplate> => {
    return apiClient.put<ActionTemplate>(`/action-templates/${templateId}`, updates);
  },

  /**
   * 删除 Action Template
   * DELETE /api/action-templates/:templateId
   */
  deleteTemplate: async (templateId: string): Promise<void> => {
    return apiClient.delete<void>(`/action-templates/${templateId}`);
  },
};
