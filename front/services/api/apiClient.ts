/**
 * API Client - 基础 HTTP 客户端
 * 遵循 API_COMMUNICATION_SPEC.md 规范
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8090/api';
const API_V2_URL = import.meta.env.VITE_API_V2_URL || 'http://localhost:8090/api/v2';

// ===== 错误类型 =====

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public originalError?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class ValidationError extends ApiError {
  constructor(message: string) {
    super(400, message);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends ApiError {
  constructor(message: string) {
    super(404, message);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends ApiError {
  constructor(message: string) {
    super(409, message);
    this.name = 'ConflictError';
  }
}

export class ServerError extends ApiError {
  constructor(message: string) {
    super(500, message);
    this.name = 'ServerError';
  }
}

// ===== 响应类型 =====

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
}

export interface ErrorResponse {
  error: string;
}

// ===== 分页参数 =====

export interface PaginationParams {
  page?: number;      // 从 1 开始
  pageSize?: number;
}

export interface ApiPagination {
  limit: number;
  offset: number;
}

export function toApiPagination(params: PaginationParams): ApiPagination {
  const page = params.page || 1;
  const pageSize = params.pageSize || 20;
  return {
    limit: pageSize,
    offset: (page - 1) * pageSize,
  };
}

export function fromPaginatedResponse<T, R>(
  response: PaginatedResponse<T>,
  mapper: (item: T) => R
) {
  return {
    items: response.data.map(mapper),
    total: response.total,
    page: Math.floor(response.offset / response.limit) + 1,
    pageSize: response.limit,
    totalPages: Math.ceil(response.total / response.limit),
  };
}

// ===== 错误处理 =====

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage = 'Unknown error';
    try {
      const body: ErrorResponse = await response.json();
      errorMessage = body.error || errorMessage;
    } catch {
      errorMessage = response.statusText;
    }

    switch (response.status) {
      case 400:
        throw new ValidationError(errorMessage);
      case 404:
        throw new NotFoundError(errorMessage);
      case 409:
        throw new ConflictError(errorMessage);
      case 500:
        throw new ServerError(errorMessage);
      default:
        throw new ApiError(response.status, errorMessage);
    }
  }

  // 处理空响应
  const text = await response.text();
  if (!text) {
    return {} as T;
  }
  return JSON.parse(text);
}

// ===== HTTP 客户端 =====

export const apiClient = {
  // v1 API
  async get<T>(path: string, params?: Record<string, string | number | boolean>): Promise<T> {
    const url = new URL(`${API_BASE_URL}${path}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
    return handleResponse<T>(response);
  },

  async post<T>(path: string, data?: unknown): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: data ? JSON.stringify(data) : undefined,
    });
    return handleResponse<T>(response);
  },

  async put<T>(path: string, data: unknown): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return handleResponse<T>(response);
  },

  async delete<T = void>(path: string): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
      },
    });
    return handleResponse<T>(response);
  },
};

// v2 API (多租户)
export const apiClientV2 = {
  async get<T>(path: string, params?: Record<string, string | number | boolean>): Promise<T> {
    const url = new URL(`${API_V2_URL}${path}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
    return handleResponse<T>(response);
  },

  async post<T>(path: string, data?: unknown): Promise<T> {
    const response = await fetch(`${API_V2_URL}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: data ? JSON.stringify(data) : undefined,
    });
    return handleResponse<T>(response);
  },

  async put<T>(path: string, data: unknown): Promise<T> {
    const response = await fetch(`${API_V2_URL}${path}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return handleResponse<T>(response);
  },

  async delete<T = void>(path: string): Promise<T> {
    const response = await fetch(`${API_V2_URL}${path}`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
      },
    });
    return handleResponse<T>(response);
  },
};

export { API_BASE_URL, API_V2_URL };
