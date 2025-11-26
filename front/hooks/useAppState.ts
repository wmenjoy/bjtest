
import { useState } from 'react';
import { User, TestCase, TestFolder, TestRun, Script, Workflow, Environment, Role, Organization, Project } from '../types';
import { MOCK_CASES, MOCK_FOLDERS, MOCK_RUNS, MOCK_SCRIPTS, MOCK_WORKFLOWS, MOCK_ENVS, MOCK_USERS, MOCK_ROLES, MOCK_ORGS, MOCK_PROJECTS } from '../data/mockData';

export type Tab = 'dashboard' | 'cases' | 'automation' | 'library' | 'database' | 'admin' | 'settings' | 'history';

export const useAppState = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentTab, setCurrentTab] = useState<Tab>('dashboard');
  
  // Admin / Multi-tenancy State
  const [orgs, setOrgs] = useState<Organization[]>(MOCK_ORGS);
  const [projects, setProjects] = useState<Project[]>(MOCK_PROJECTS);
  const [activeOrgId, setActiveOrgId] = useState<string>(MOCK_ORGS[0].id);
  const [activeProjectId, setActiveProjectId] = useState<string>(MOCK_PROJECTS[0].id);

  // Core Entity State
  const [cases, setCases] = useState<TestCase[]>(MOCK_CASES);
  const [folders, setFolders] = useState<TestFolder[]>(MOCK_FOLDERS);
  const [runs, setRuns] = useState<TestRun[]>(MOCK_RUNS);
  const [scripts, setScripts] = useState<Script[]>(MOCK_SCRIPTS);
  const [workflows, setWorkflows] = useState<Workflow[]>(MOCK_WORKFLOWS);
  const [envs, setEnvs] = useState<Environment[]>(MOCK_ENVS);
  const [activeEnvId, setActiveEnvId] = useState<string>(MOCK_ENVS[0].id);
  
  // Admin Portal State (Users/Roles)
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [roles, setRoles] = useState<Role[]>(MOCK_ROLES);

  const activeEnv = envs.find(e => e.id === activeEnvId);

  // Actions
  const addCase = (c: TestCase) => setCases(prev => [...prev, { ...c, projectId: activeProjectId }]);
  const updateCase = (c: TestCase) => setCases(prev => prev.map(ex => ex.id === c.id ? c : ex));
  const deleteCase = (caseId: string) => setCases(prev => prev.filter(c => c.id !== caseId));

  const addFolder = (f: TestFolder) => setFolders(prev => [...prev, { ...f, projectId: activeProjectId }]);
  
  const addRun = (r: TestRun) => setRuns(prev => [...prev, { ...r, projectId: activeProjectId }]);
  
  const addScript = (s: Script) => setScripts(prev => [...prev, { ...s, projectId: activeProjectId }]);
  const updateScript = (s: Script) => setScripts(prev => prev.map(ex => ex.id === s.id ? s : ex));
  const deleteScript = (ids: string[]) => setScripts(prev => prev.filter(s => !ids.includes(s.id)));

  const addWorkflow = (w: Workflow) => setWorkflows(prev => [...prev, { ...w, projectId: activeProjectId }]);
  const updateWorkflow = (w: Workflow) => setWorkflows(prev => prev.map(ex => ex.id === w.id ? w : ex));

  return {
    currentUser, setCurrentUser,
    currentTab, setCurrentTab,
    
    // Multi-tenancy
    orgs, setOrgs,
    projects, setProjects,
    activeOrgId, setActiveOrgId,
    activeProjectId, setActiveProjectId,

    cases, addCase, updateCase, deleteCase,
    folders, addFolder,
    runs, addRun,
    scripts, addScript, updateScript, deleteScript,
    workflows, addWorkflow, updateWorkflow,
    envs, setEnvs,
    activeEnvId, setActiveEnvId, activeEnv,
    users, setUsers,
    roles, setRoles
  };
};
