import { apiClientV2 } from './apiClient';
import { User, Role } from '../types';

// Backend response types
interface BackendUser {
  userId: string;
  name: string;
  email: string;
  roleId: string;
  orgId: string;
  status: string;
  avatar: string;
}

interface BackendRole {
  roleId: string;
  name: string;
  description: string;
  permissionCodes: string[];
}

interface UserListResponse {
  data: BackendUser[];
  total: number;
}

interface RoleListResponse {
  data: BackendRole[];
  total: number;
}

// Type mappers
function userFromBackend(backendUser: BackendUser): User {
  return {
    id: backendUser.userId,
    name: backendUser.name,
    email: backendUser.email,
    roleId: backendUser.roleId,
    orgId: backendUser.orgId,
    status: backendUser.status as 'active' | 'inactive',
    avatar: backendUser.avatar,
  };
}

function roleFromBackend(backendRole: BackendRole): Role {
  return {
    id: backendRole.roleId,
    name: backendRole.name,
    description: backendRole.description,
    permissionCodes: backendRole.permissionCodes,
  };
}

// User API
export const userApi = {
  async list(): Promise<User[]> {
    const response = await apiClientV2.get<UserListResponse>('/users');
    return response.data.map(userFromBackend);
  },

  async getCurrentUser(): Promise<User> {
    const response = await apiClientV2.get<BackendUser>('/users/current');
    return userFromBackend(response);
  },
};

// Role API
export const roleApi = {
  async list(): Promise<Role[]> {
    const response = await apiClientV2.get<RoleListResponse>('/roles');
    return response.data.map(roleFromBackend);
  },
};
