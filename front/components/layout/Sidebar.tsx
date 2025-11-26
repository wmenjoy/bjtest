
import React, { useState, useMemo } from 'react';
import { LayoutDashboard, ListTodo, GitMerge, Library, Database, Shield, Settings, History, LogOut, ChevronDown, Check, Sun, Moon, Building2, FolderKanban, Server, BookOpen, Globe } from 'lucide-react';
import { User, Environment, Organization, Project, Role } from '../../types';
import { useConfig } from '../../ConfigContext';
import { usePermissions } from '../../hooks/usePermissions';

interface SidebarProps {
    currentTab: string;
    setCurrentTab: (tab: any) => void;
    currentUser: User;
    roles: Role[]; // Added roles prop
    onLogout: () => void;
    
    // Multi-tenancy
    orgs: Organization[];
    projects: Project[];
    activeOrgId: string;
    setActiveOrgId: (id: string) => void;
    activeProjectId: string;
    setActiveProjectId: (id: string) => void;

    envs: Environment[];
    activeEnvId: string;
    setActiveEnvId: (id: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
    currentTab, setCurrentTab, currentUser, roles, onLogout, 
    orgs, projects, activeOrgId, setActiveOrgId, activeProjectId, setActiveProjectId,
    envs, activeEnvId, setActiveEnvId 
}) => {
    const { t, language, setLanguage, theme, setTheme } = useConfig();
    
    // Use the hook with passed data instead of internal state
    const { hasPermission } = usePermissions(currentUser, roles);
    
    const [showOrgMenu, setShowOrgMenu] = useState(false);
    const [showProjectMenu, setShowProjectMenu] = useState(false);
    const [showEnvMenu, setShowEnvMenu] = useState(false);
    const [showThemeMenu, setShowThemeMenu] = useState(false);

    const activeOrg = orgs.find(o => o.id === activeOrgId) || orgs[0];
    const activeProject = projects.find(p => p.id === activeProjectId) || projects[0];
    const activeEnv = envs.find(e => e.id === activeEnvId);

    // Filter projects by current Org
    const orgProjects = useMemo(() => projects.filter(p => p.orgId === activeOrgId), [projects, activeOrgId]);

    // Filter envs by current Project
    const projectEnvs = useMemo(() => envs.filter(e => e.projectId === activeProjectId), [envs, activeProjectId]);

    const allNavItems = [
        { id: 'dashboard', icon: LayoutDashboard, label: t('nav.dashboard'), permission: 'VIEW_DASHBOARD' },
        { id: 'apis', icon: Globe, label: 'API 中心', permission: 'VIEW_APIS' },
        { id: 'cases', icon: ListTodo, label: t('nav.repository'), permission: 'VIEW_CASES' },
        { id: 'automation', icon: GitMerge, label: t('nav.automation'), permission: 'VIEW_AUTOMATION' },
        { id: 'library', icon: Library, label: t('nav.library'), permission: 'VIEW_LIBRARY' },
        { id: 'database', icon: Database, label: t('nav.database'), permission: 'VIEW_DATABASE' },
        { id: 'history', icon: History, label: t('nav.history'), permission: 'VIEW_HISTORY' },
        { id: 'docs', icon: BookOpen, label: t('nav.docs'), permission: 'VIEW_DOCS' },
    ];

    const allSystemItems = [
        { id: 'admin', icon: Shield, label: t('nav.admin'), permission: 'VIEW_ADMIN' },
        { id: 'settings', icon: Settings, label: t('nav.settings'), permission: 'VIEW_SETTINGS' },
    ];

    // Filter based on permissions
    const visibleNavItems = allNavItems.filter(item => hasPermission(item.permission));
    const visibleSystemItems = allSystemItems.filter(item => hasPermission(item.permission));

    return (
        <div className="w-64 bg-slate-900 text-slate-300 flex flex-col h-screen shrink-0 border-r border-slate-800 transition-colors duration-300">
            {/* Org & Project Switcher */}
            <div className="p-4 space-y-3 border-b border-slate-800 bg-slate-950">
                {/* Organization Selector */}
                <div className="relative">
                    <button 
                        onClick={() => { setShowOrgMenu(!showOrgMenu); setShowProjectMenu(false); }}
                        className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-800 transition-colors text-left group"
                    >
                        <div className="flex items-center overflow-hidden">
                            <div className="w-8 h-8 rounded bg-indigo-600 flex items-center justify-center text-white shrink-0 mr-3">
                                <Building2 size={16}/>
                            </div>
                            <div className="truncate">
                                <div className="text-xs text-slate-500 uppercase font-bold tracking-wider">Organization</div>
                                <div className="text-sm font-bold text-white truncate">{activeOrg?.name}</div>
                            </div>
                        </div>
                        <ChevronDown size={14} className={`text-slate-500 transition-transform ${showOrgMenu ? 'rotate-180' : ''}`}/>
                    </button>

                    {showOrgMenu && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setShowOrgMenu(false)}></div>
                            <div className="absolute top-full left-0 w-full mt-1 bg-slate-800 rounded-xl shadow-xl border border-slate-700 z-20 overflow-hidden py-1">
                                {orgs.map(org => (
                                    <button 
                                        key={org.id}
                                        onClick={() => { setActiveOrgId(org.id); setShowOrgMenu(false); }}
                                        className={`w-full flex items-center px-4 py-2 text-sm hover:bg-slate-700 transition-colors ${activeOrgId === org.id ? 'text-white bg-slate-700/50' : 'text-slate-400'}`}
                                    >
                                        <Building2 size={14} className="mr-2"/>
                                        <span className="flex-1 text-left truncate">{org.name}</span>
                                        {activeOrgId === org.id && <Check size={14} className="text-indigo-400"/>}
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                {/* Project Selector */}
                <div className="relative">
                    <button 
                        onClick={() => { setShowProjectMenu(!showProjectMenu); setShowOrgMenu(false); }}
                        className="w-full flex items-center justify-between p-2 rounded-lg bg-slate-800/50 border border-slate-700/50 hover:bg-slate-800 transition-colors text-left"
                    >
                         <div className="flex items-center overflow-hidden">
                            <div className="w-6 h-6 rounded bg-slate-700 flex items-center justify-center text-slate-300 shrink-0 mr-3">
                                <FolderKanban size={14}/>
                            </div>
                            <div className="truncate">
                                <div className="text-xs font-medium text-slate-300 truncate">{activeProject?.name || 'Select Project'}</div>
                            </div>
                        </div>
                        <ChevronDown size={14} className="text-slate-500"/>
                    </button>

                    {showProjectMenu && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setShowProjectMenu(false)}></div>
                            <div className="absolute top-full left-0 w-full mt-1 bg-slate-800 rounded-xl shadow-xl border border-slate-700 z-20 overflow-hidden py-1">
                                <div className="px-3 py-2 text-[10px] font-bold text-slate-500 uppercase">Projects in {activeOrg?.name}</div>
                                {orgProjects.map(proj => (
                                    <button 
                                        key={proj.id}
                                        onClick={() => { setActiveProjectId(proj.id); setShowProjectMenu(false); }}
                                        className={`w-full flex items-center px-4 py-2 text-sm hover:bg-slate-700 transition-colors ${activeProjectId === proj.id ? 'text-white bg-slate-700/50' : 'text-slate-400'}`}
                                    >
                                        <span className="w-6 text-center text-xs font-mono text-slate-500 mr-2">{proj.key}</span>
                                        <span className="flex-1 text-left truncate">{proj.name}</span>
                                        {activeProjectId === proj.id && <Check size={14} className="text-indigo-400"/>}
                                    </button>
                                ))}
                                {orgProjects.length === 0 && <div className="px-4 py-2 text-sm text-slate-500 italic">No projects found</div>}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Environment Selector */}
            <div className="px-4 py-3 border-b border-slate-800">
                 <div className="relative">
                    <button 
                        onClick={() => setShowEnvMenu(!showEnvMenu)}
                        className="w-full flex items-center justify-between px-3 py-1.5 rounded bg-slate-800 text-xs text-slate-300 hover:bg-slate-700 transition-colors"
                    >
                        <div className="flex items-center">
                            <div className={`w-2 h-2 rounded-full mr-2 ${activeEnv?.color || 'bg-slate-500'}`}></div>
                            <span className="font-medium">{activeEnv?.name || 'No Environment'}</span>
                        </div>
                        <Server size={12} className="text-slate-500"/>
                    </button>
                    
                    {showEnvMenu && (
                        <>
                        <div className="fixed inset-0 z-10" onClick={() => setShowEnvMenu(false)}></div>
                        <div className="absolute top-full left-0 w-full mt-1 bg-slate-800 rounded-lg shadow-xl border border-slate-700 z-20 py-1">
                            {projectEnvs.map(env => (
                                <button 
                                    key={env.id}
                                    onClick={() => { setActiveEnvId(env.id); setShowEnvMenu(false); }}
                                    className={`w-full flex items-center px-3 py-2 text-xs hover:bg-slate-700 transition-colors ${activeEnvId === env.id ? 'text-white' : 'text-slate-400'}`}
                                >
                                    <div className={`w-2 h-2 rounded-full mr-2 ${env.color}`}></div>
                                    <span className="flex-1 text-left">{env.name}</span>
                                </button>
                            ))}
                            {projectEnvs.length === 0 && <div className="px-3 py-2 text-xs text-slate-500 italic">No environments defined</div>}
                        </div>
                        </>
                    )}
                 </div>
            </div>

            {/* Nav Items */}
            <div className="flex-1 overflow-y-auto py-4 space-y-6 custom-scrollbar">
                {visibleNavItems.length > 0 && (
                    <div>
                        <div className="px-4 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{t('nav.main')}</div>
                        <nav className="space-y-0.5 px-2">
                            {visibleNavItems.map(item => (
                                <button
                                    key={item.id}
                                    onClick={() => setCurrentTab(item.id)}
                                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200 text-sm font-medium ${currentTab === item.id ? 'bg-primary-600 text-white shadow-lg shadow-primary-900/20' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'}`}
                                >
                                    <item.icon size={18} />
                                    <span>{item.label}</span>
                                </button>
                            ))}
                        </nav>
                    </div>
                )}

                {visibleSystemItems.length > 0 && (
                    <div>
                        <div className="px-4 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{t('nav.system')}</div>
                        <nav className="space-y-0.5 px-2">
                            {visibleSystemItems.map(item => (
                                <button
                                    key={item.id}
                                    onClick={() => setCurrentTab(item.id)}
                                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200 text-sm font-medium ${currentTab === item.id ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'}`}
                                >
                                    <item.icon size={18} />
                                    <span>{item.label}</span>
                                </button>
                            ))}
                        </nav>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-950">
                <div className="flex items-center justify-between mb-4">
                     <div className="flex items-center space-x-2 bg-slate-900 rounded-lg p-1">
                         <button onClick={() => setLanguage('en')} className={`px-2 py-1 text-[10px] font-bold rounded ${language === 'en' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'}`}>EN</button>
                         <button onClick={() => setLanguage('zh')} className={`px-2 py-1 text-[10px] font-bold rounded ${language === 'zh' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'}`}>中文</button>
                     </div>
                     <div className="relative">
                         <button onClick={() => setShowThemeMenu(!showThemeMenu)} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
                             {theme === 'light' ? <Sun size={16}/> : <Moon size={16}/>}
                         </button>
                         {showThemeMenu && (
                             <>
                             <div className="fixed inset-0 z-10" onClick={() => setShowThemeMenu(false)}></div>
                             <div className="absolute bottom-full right-0 mb-2 w-32 bg-slate-800 rounded-xl shadow-xl border border-slate-700 z-20 overflow-hidden py-1">
                                 {['light', 'dark', 'midnight'].map(t => (
                                     <button 
                                        key={t} 
                                        onClick={() => { setTheme(t as any); setShowThemeMenu(false); }}
                                        className="w-full text-left px-4 py-2 text-xs text-slate-300 hover:bg-slate-700 capitalize flex items-center"
                                     >
                                         {t === theme && <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full mr-2"></div>}
                                         {t}
                                     </button>
                                 ))}
                             </div>
                             </>
                         )}
                     </div>
                </div>

                <div className="flex items-center space-x-3">
                    <img src={currentUser.avatar} alt={currentUser.name} className="w-9 h-9 rounded-full border-2 border-slate-700" />
                    <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-white truncate">{currentUser.name}</div>
                        <div className="text-xs text-slate-500 truncate">{currentUser.email}</div>
                    </div>
                    <button onClick={onLogout} className="p-2 text-slate-500 hover:text-red-400 hover:bg-slate-900 rounded-lg transition-colors" title={t('nav.signout')}>
                        <LogOut size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
};
