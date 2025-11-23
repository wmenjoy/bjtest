
import React, { useEffect } from 'react';
import { Dashboard } from './components/Dashboard';
import { TestCaseManager } from './components/TestCaseManager';
import { ScriptLab } from './components/ScriptLab';
import { ActionLibrary } from './components/ActionLibrary';
import { DatabaseManager } from './components/DatabaseManager';
import { AdminPortal } from './components/AdminPortal';
import { SystemConfigPage } from './components/SystemConfig';
import { Auth } from './components/Auth';
import { TestHistory } from './components/TestHistory';
import { DocumentationHub } from './components/DocumentationHub';
import { Sidebar } from './components/layout/Sidebar';
import { useAppState } from './hooks/useAppState';
import { useApiState } from './hooks/useApiState';
import { usePermissions } from './hooks/usePermissions';
import { LoadingState, ErrorState } from './components/ui/LoadingState';
import { ShieldAlert } from 'lucide-react';

const AccessDenied = () => (
  <div className="h-full flex flex-col items-center justify-center text-slate-400">
      <div className="p-6 bg-slate-100 rounded-full mb-4">
          <ShieldAlert size={48} className="text-slate-500"/>
      </div>
      <h2 className="text-xl font-bold text-slate-700">Access Denied</h2>
      <p className="mt-2">You do not have permission to view this page.</p>
  </div>
);

const App: React.FC = () => {
  // 模式切换: true=Mock数据, false=API数据
  const useMock = import.meta.env.VITE_USE_MOCK_DATA === 'true';

  // 根据模式选择对应的状态管理 Hook
  const appState = useMock ? useAppState() : useApiState();

  const {
    currentUser, setCurrentUser,
    currentTab, setCurrentTab,
    cases, addCase, updateCase, deleteCase,
    folders, addFolder,
    runs, addRun,
    scripts, addScript, updateScript, deleteScript,
    workflows, addWorkflow, updateWorkflow,
    envs, setEnvs,
    activeEnvId, setActiveEnvId, activeEnv,
    users, setUsers,
    roles, setRoles,
    orgs, setOrgs,
    projects, setProjects,
    activeOrgId, setActiveOrgId,
    activeProjectId, setActiveProjectId
  } = appState;

  // Use the refactored hook which now accepts user and roles
  const { hasPermission } = usePermissions(currentUser, roles);

  // Extract loading and error states (only available in API mode)
  const loading = 'loading' in appState ? appState.loading : undefined;
  const error = 'error' in appState ? appState.error : undefined;

  // -- Filtering based on Multi-tenancy --
  const activeProjectCases = cases.filter(c => c.projectId === activeProjectId);
  const activeProjectFolders = folders.filter(f => f.projectId === activeProjectId);
  const activeProjectRuns = runs.filter(r => r.projectId === activeProjectId);
  const activeProjectScripts = scripts.filter(s => s.projectId === activeProjectId);
  const activeProjectWorkflows = workflows.filter(w => w.projectId === activeProjectId);
  const activeProjectEnvs = envs.filter(e => e.projectId === activeProjectId);

  // When Project changes, ensure the active environment is part of that project
  useEffect(() => {
    if (activeProjectEnvs.length > 0) {
        const currentIsInvalid = !activeProjectEnvs.find(e => e.id === activeEnvId);
        if (currentIsInvalid) {
            setActiveEnvId(activeProjectEnvs[0].id);
        }
    } else {
        // Optional: Clear or set to a dummy id if no envs exist
    }
  }, [activeProjectId, activeProjectEnvs, activeEnvId, setActiveEnvId]);


  if (!currentUser) {
      return <Auth onLogin={setCurrentUser} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans animate-fade-in transition-colors duration-300">
      <Sidebar 
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        currentUser={currentUser}
        roles={roles}
        onLogout={() => setCurrentUser(null)}
        orgs={orgs}
        projects={projects}
        activeOrgId={activeOrgId}
        setActiveOrgId={setActiveOrgId}
        activeProjectId={activeProjectId}
        setActiveProjectId={setActiveProjectId}
        envs={envs}
        activeEnvId={activeEnvId}
        setActiveEnvId={setActiveEnvId}
      />

      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-50 text-slate-900 transition-colors duration-300">
        <div className="flex-1 overflow-hidden relative">
            {currentTab === 'dashboard' && (
                hasPermission('VIEW_DASHBOARD') ? <div className="h-full overflow-y-auto p-8"><Dashboard runs={activeProjectRuns} /></div> : <AccessDenied />
            )}
            
            {currentTab === 'cases' && (
                 hasPermission('VIEW_CASES') ? (
                <>
                  {/* Loading State */}
                  {loading && (loading.cases || loading.folders) && (
                    <div className="h-full flex items-center justify-center">
                      <LoadingState message="Loading test cases..." size={32} />
                    </div>
                  )}

                  {/* Error State */}
                  {error && (error.cases || error.folders) && (
                    <div className="h-full flex items-center justify-center p-8">
                      <ErrorState
                        message={error.cases || error.folders || 'Failed to load data'}
                        onRetry={() => {
                          if ('refresh' in appState) {
                            appState.refresh.cases();
                            appState.refresh.folders();
                          }
                        }}
                      />
                    </div>
                  )}

                  {/* Main Content - only show when not loading and no error */}
                  {(!loading || (!loading.cases && !loading.folders)) &&
                   (!error || (!error.cases && !error.folders)) && (
                    <TestCaseManager
                        cases={activeProjectCases}
                        folders={activeProjectFolders}
                        runs={activeProjectRuns}
                        scripts={activeProjectScripts}
                        workflows={activeProjectWorkflows}
                        activeEnvironment={activeEnv}
                        projectId={activeProjectId}
                        onAddCase={addCase}
                        onUpdateCase={updateCase}
                        onDeleteCase={deleteCase}
                        onAddFolder={addFolder}
                        onRunComplete={addRun}
                    />
                  )}
                </>
                ) : <AccessDenied />
            )}
            
            {currentTab === 'automation' && (
                 hasPermission('VIEW_AUTOMATION') ? (
                <div className="h-full p-8 pb-0 flex flex-col">
                    <ScriptLab 
                        scripts={activeProjectScripts}
                        workflows={activeProjectWorkflows}
                        cases={activeProjectCases}
                        activeEnvironment={activeEnv}
                        projectId={activeProjectId}
                        onAddScript={addScript}
                        onUpdateScript={updateScript}
                        onAddWorkflow={addWorkflow}
                        onUpdateWorkflow={updateWorkflow}
                    />
                </div>
                ) : <AccessDenied />
            )}

            {currentTab === 'library' && (
                 hasPermission('VIEW_LIBRARY') ? (
                <ActionLibrary 
                    scripts={activeProjectScripts} 
                    workflows={activeProjectWorkflows}
                    cases={activeProjectCases}
                    projectId={activeProjectId}
                    onAddScript={addScript} 
                    onUpdateScript={updateScript}
                    onDeleteScript={deleteScript}
                />
                ) : <AccessDenied />
            )}

            {currentTab === 'database' && (
                 hasPermission('VIEW_DATABASE') ? <DatabaseManager projectId={activeProjectId} /> : <AccessDenied />
            )}

            {currentTab === 'docs' && (
                 hasPermission('VIEW_DOCS') ? (
                    <div className="h-full overflow-hidden">
                        <DocumentationHub 
                            workflows={activeProjectWorkflows}
                            projectId={activeProjectId}
                        />
                    </div>
                 ) : <AccessDenied />
            )}

            {currentTab === 'admin' && (
                 hasPermission('VIEW_ADMIN') ? (
                 <div className="h-full overflow-y-auto">
                     <AdminPortal 
                        users={users} 
                        roles={roles} 
                        orgs={orgs}
                        projects={projects}
                        onUpdateUsers={setUsers}
                        onUpdateRoles={setRoles}
                        onUpdateOrgs={setOrgs}
                        onUpdateProjects={setProjects}
                     />
                 </div>
                 ) : <AccessDenied />
            )}

            {currentTab === 'settings' && (
                 hasPermission('VIEW_SETTINGS') ? (
                <div className="h-full overflow-y-auto">
                    <SystemConfigPage 
                        environments={activeProjectEnvs}
                        projectId={activeProjectId}
                        onUpdateEnvironments={(updatedEnvs) => {
                            // Merge updated project envs back into global list
                            const otherEnvs = envs.filter(e => e.projectId !== activeProjectId);
                            setEnvs([...otherEnvs, ...updatedEnvs]);
                        }}
                    />
                </div>
                ) : <AccessDenied />
            )}

            {currentTab === 'history' && (
                 hasPermission('VIEW_HISTORY') ? <div className="h-full p-8"><TestHistory runs={activeProjectRuns}/></div> : <AccessDenied />
            )}
        </div>
      </main>
    </div>
  );
};

export default App;
