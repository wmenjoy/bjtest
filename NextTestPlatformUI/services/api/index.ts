/**
 * API Services - 统一导出
 */

// API 客户端
export {
  apiClient,
  apiClientV2,
  API_BASE_URL,
  API_V2_URL,
  ApiError,
  ValidationError,
  NotFoundError,
  ConflictError,
  ServerError,
  type PaginatedResponse,
  type PaginationParams,
  toApiPagination,
  fromPaginatedResponse,
} from './apiClient';

// 后端类型
export * from './backendTypes';

// 类型映射
export * from './mappers';

// API 服务
export { testApi } from './testApi';
export { groupApi } from './groupApi';
export { environmentApi } from './environmentApi';
export { workflowApi } from './workflowApi';
export { tenantApi } from './tenantApi';
export { projectApi } from './projectApi';
export { userApi, roleApi } from './userApi';

// WebSocket
export {
  WorkflowStreamClient,
  workflowStreamClient,
  type WebSocketMessage,
  type WebSocketMessageType,
  type StepStartPayload,
  type StepCompletePayload,
  type StepLogPayload,
  type VariableChangePayload,
  type WorkflowStreamCallbacks,
} from './websocket';
