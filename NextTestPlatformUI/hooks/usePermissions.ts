
import { useCallback } from 'react';
import { User, Role } from '../types';

export const usePermissions = (currentUser: User | null, roles: Role[]) => {
    const hasPermission = useCallback((permissionCode: string): boolean => {
        if (!currentUser) return false;
        
        // Find user's role
        const userRole = roles.find(r => r.id === currentUser.roleId);
        
        // Fallback: if role not found, deny
        if (!userRole) return false;

        // Optional: Super Admin Bypass (e.g. if role ID is specifically 'admin')
        // if (userRole.id === 'admin') return true;

        return userRole.permissionCodes.includes(permissionCode);
    }, [currentUser, roles]);

    const hasAnyPermission = useCallback((permissionCodes: string[]): boolean => {
        return permissionCodes.some(code => hasPermission(code));
    }, [hasPermission]);

    return { hasPermission, hasAnyPermission };
};
