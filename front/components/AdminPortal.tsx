
import React, { useState } from 'react';
import { User, Role, Organization, Project } from '../types';
import { useConfig } from '../ConfigContext';
import { UserTab } from './admin/UserTab';
import { RoleTab } from './admin/RoleTab';
import { OrgTab } from './admin/OrgTab';
import { ProjectTab } from './admin/ProjectTab';

interface AdminPortalProps {
    users?: User[];
    roles?: Role[];
    orgs?: Organization[];
    projects?: Project[];
    onUpdateUsers?: (users: User[]) => void;
    onUpdateRoles?: (roles: Role[]) => void;
    onUpdateOrgs?: (orgs: Organization[]) => void;
    onUpdateProjects?: (projects: Project[]) => void;
}

// Fallback data if props not provided
const MOCK_USERS_DEFAULT: User[] = [];
const MOCK_ROLES_DEFAULT: Role[] = [];
const MOCK_ORGS_DEFAULT: Organization[] = [];
const MOCK_PROJECTS_DEFAULT: Project[] = [];

export const AdminPortal: React.FC<AdminPortalProps> = ({ 
    users = MOCK_USERS_DEFAULT, 
    roles = MOCK_ROLES_DEFAULT, 
    orgs = MOCK_ORGS_DEFAULT, 
    projects = MOCK_PROJECTS_DEFAULT,
    onUpdateUsers = (_: User[]) => {}, 
    onUpdateRoles = (_: Role[]) => {}, 
    onUpdateOrgs = (_: Organization[]) => {},
    onUpdateProjects = (_: Project[]) => {}
}) => {
    const { t } = useConfig();
    const [activeTab, setActiveTab] = useState<'users' | 'roles' | 'orgs' | 'projects'>('users');

    return (
        <div className="p-8 max-w-6xl mx-auto h-full flex flex-col">
            <div className="flex justify-between items-center mb-8 shrink-0">
                <h1 className="text-2xl font-bold text-slate-800">{t('admin.title')}</h1>
                <div className="bg-white p-1 rounded-lg border border-slate-200 shadow-sm flex space-x-1">
                    {[
                        {id: 'users', label: t('admin.users')}, 
                        {id: 'roles', label: t('admin.roles')}, 
                        {id: 'orgs', label: t('admin.orgs')},
                        {id: 'projects', label: 'Projects'}
                    ].map(tab => (
                        <button 
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)} 
                            className={`px-4 py-1.5 rounded-md font-medium text-sm transition-all ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 overflow-hidden">
                {activeTab === 'users' && (
                    <UserTab users={users} roles={roles} orgs={orgs} onUpdateUsers={onUpdateUsers} />
                )}
                {activeTab === 'roles' && (
                    <RoleTab roles={roles} users={users} onUpdateRoles={onUpdateRoles} />
                )}
                {activeTab === 'orgs' && (
                    <OrgTab orgs={orgs} onUpdateOrgs={onUpdateOrgs} />
                )}
                {activeTab === 'projects' && (
                    <ProjectTab projects={projects} orgs={orgs} onUpdateProjects={onUpdateProjects} />
                )}
            </div>
        </div>
    );
};
