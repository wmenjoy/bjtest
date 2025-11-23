/**
 * useApiState - API-backed version of useAppState
 *
 * Maintains the same interface as useAppState but loads data from backend API.
 * Includes loading and error states for better UX.
 */

import { useState, useEffect, useCallback } from 'react';
import { User, TestCase, TestFolder, TestRun, Script, Workflow, Environment, Role, Organization, Project } from '../types';
import { Tab } from './useAppState';
import {
  testApi,
  groupApi,
  environmentApi,
  workflowApi,
  tenantApi,
  projectApi,
  userApi,
  roleApi,
  testCaseFromBackend,
  testCaseToBackend,
  groupFromBackend,
  groupToBackend,
  environmentFromBackend,
  environmentToBackend,
  workflowFromBackend,
  workflowToBackend,
} from '../services/api';

interface LoadingState {
  cases: boolean;
  folders: boolean;
  environments: boolean;
  workflows: boolean;
  orgs: boolean;
  projects: boolean;
}

interface ErrorState {
  cases: string | null;
  folders: string | null;
  environments: string | null;
  workflows: string | null;
  orgs: string | null;
  projects: string | null;
}

export const useApiState = () => {
  // UI State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentTab, setCurrentTab] = useState<Tab>('dashboard');

  // Multi-tenancy State
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeOrgId, setActiveOrgId] = useState<string>('');
  const [activeProjectId, setActiveProjectId] = useState<string>('');

  // Core Entity State
  const [cases, setCases] = useState<TestCase[]>([]);
  const [folders, setFolders] = useState<TestFolder[]>([]);
  const [runs, setRuns] = useState<TestRun[]>([]);
  const [scripts, setScripts] = useState<Script[]>([]);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [envs, setEnvs] = useState<Environment[]>([]);
  const [activeEnvId, setActiveEnvId] = useState<string>('');

  // Admin State
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);

  // Loading & Error States
  const [loading, setLoading] = useState<LoadingState>({
    cases: false,
    folders: false,
    environments: false,
    workflows: false,
    orgs: false,
    projects: false,
  });

  const [error, setError] = useState<ErrorState>({
    cases: null,
    folders: null,
    environments: null,
    workflows: null,
    orgs: null,
    projects: null,
  });

  // Computed
  const activeEnv = envs.find(e => e.id === activeEnvId);

  // ===== Data Loading Functions =====

  const loadOrganizations = useCallback(async () => {
    setLoading(prev => ({ ...prev, orgs: true }));
    setError(prev => ({ ...prev, orgs: null }));
    try {
      const mappedOrgs = await tenantApi.list(); // Already returns Organization[]
      setOrgs(mappedOrgs);

      // Set default active org if not set
      if (!activeOrgId && mappedOrgs.length > 0) {
        setActiveOrgId(mappedOrgs[0].id);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load organizations';
      setError(prev => ({ ...prev, orgs: message }));
      console.error('Failed to load organizations:', err);
    } finally {
      setLoading(prev => ({ ...prev, orgs: false }));
    }
  }, [activeOrgId]);

  const loadProjects = useCallback(async () => {
    if (!activeOrgId) return;

    setLoading(prev => ({ ...prev, projects: true }));
    setError(prev => ({ ...prev, projects: null }));
    try {
      const allProjects = await projectApi.list(); // Already returns Project[]
      // Filter projects by tenant
      const mappedProjects = allProjects.filter(p => p.orgId === activeOrgId);
      setProjects(mappedProjects);

      // Set active project to first one in the tenant, or reset if no projects
      if (mappedProjects.length > 0) {
        // Check if current project belongs to the new tenant
        const currentProjectInTenant = mappedProjects.find(p => p.id === activeProjectId);
        if (!currentProjectInTenant) {
          // Current project is not in this tenant, switch to first project
          setActiveProjectId(mappedProjects[0].id);
        }
      } else {
        // No projects in this tenant, clear the active project
        setActiveProjectId('');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load projects';
      setError(prev => ({ ...prev, projects: message }));
      console.error('Failed to load projects:', err);
    } finally {
      setLoading(prev => ({ ...prev, projects: false }));
    }
  }, [activeOrgId, activeProjectId]);

  const loadTestCases = useCallback(async () => {
    if (!activeProjectId) return;

    setLoading(prev => ({ ...prev, cases: true }));
    setError(prev => ({ ...prev, cases: null }));
    try {
      const response = await testApi.list({ limit: 100, offset: 0 });
      // response is { items, total, page, ... } from fromPaginatedResponse
      const mappedCases = response.items
        .filter(tc => tc.projectId === activeProjectId);
      setCases(mappedCases);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load test cases';
      setError(prev => ({ ...prev, cases: message }));
      console.error('Failed to load test cases:', err);
    } finally {
      setLoading(prev => ({ ...prev, cases: false }));
    }
  }, [activeProjectId]);

  const loadFolders = useCallback(async () => {
    if (!activeProjectId) return;

    setLoading(prev => ({ ...prev, folders: true }));
    setError(prev => ({ ...prev, folders: null }));
    try {
      const allFolders = await groupApi.tree(); // Use tree() not getTree()
      const mappedFolders = allFolders.filter(g => g.projectId === activeProjectId);
      setFolders(mappedFolders);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load folders';
      setError(prev => ({ ...prev, folders: message }));
      console.error('Failed to load folders:', err);
    } finally {
      setLoading(prev => ({ ...prev, folders: false }));
    }
  }, [activeProjectId]);

  const loadEnvironments = useCallback(async () => {
    if (!activeProjectId) return;

    setLoading(prev => ({ ...prev, environments: true }));
    setError(prev => ({ ...prev, environments: null }));
    try {
      const allEnvs = await environmentApi.list(); // Returns Environment[] (already mapped)
      const mappedEnvs = allEnvs.filter(env => env.projectId === activeProjectId);
      setEnvs(mappedEnvs);

      // Set active env to the first active one or first one
      if (!activeEnvId && mappedEnvs.length > 0) {
        const activeOne = mappedEnvs.find(e => e.id.includes('active'));
        setActiveEnvId(activeOne ? activeOne.id : mappedEnvs[0].id);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load environments';
      setError(prev => ({ ...prev, environments: message }));
      console.error('Failed to load environments:', err);
    } finally {
      setLoading(prev => ({ ...prev, environments: false }));
    }
  }, [activeProjectId, activeEnvId]);

  const loadWorkflows = useCallback(async () => {
    if (!activeProjectId) return;

    setLoading(prev => ({ ...prev, workflows: true }));
    setError(prev => ({ ...prev, workflows: null }));
    try {
      const response = await workflowApi.list({ limit: 100, offset: 0 });
      const mappedWorkflows = response.data
        .filter(w => w.projectId === activeProjectId)
        .map(workflowFromBackend);
      setWorkflows(mappedWorkflows);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load workflows';
      setError(prev => ({ ...prev, workflows: message }));
      console.error('Failed to load workflows:', err);
    } finally {
      setLoading(prev => ({ ...prev, workflows: false }));
    }
  }, [activeProjectId]);

  // ===== Effects =====

  // Load roles on mount (needed for permissions)
  useEffect(() => {
    const loadRoles = async () => {
      try {
        const loadedRoles = await roleApi.list();
        setRoles(loadedRoles);
      } catch (err) {
        console.error('Failed to load roles:', err);
      }
    };
    loadRoles();
  }, []);

  // Load current user on mount
  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        const user = await userApi.getCurrentUser();
        setCurrentUser(user);
      } catch (err) {
        console.error('Failed to load current user:', err);
      }
    };
    loadCurrentUser();
  }, []);

  // Load organizations on mount
  useEffect(() => {
    loadOrganizations();
  }, [loadOrganizations]);

  // Load projects when org changes
  useEffect(() => {
    if (activeOrgId) {
      loadProjects();
    }
  }, [activeOrgId, loadProjects]);

  // Load project-specific data when project changes
  useEffect(() => {
    if (activeProjectId) {
      loadTestCases();
      loadFolders();
      loadEnvironments();
      loadWorkflows();
    }
  }, [activeProjectId, loadTestCases, loadFolders, loadEnvironments, loadWorkflows]);

  // ===== Action Functions =====

  const addCase = async (c: TestCase) => {
    try {
      const caseWithProject = { ...c, projectId: activeProjectId };
      const created = await testApi.create(caseWithProject);
      setCases(prev => [...prev, created]);
    } catch (err) {
      console.error('Failed to create test case:', err);
      throw err;
    }
  };

  const updateCase = async (c: TestCase) => {
    try {
      const updated = await testApi.update(c.id, c);
      setCases(prev => prev.map(ex => ex.id === c.id ? updated : ex));
    } catch (err) {
      console.error('Failed to update test case:', err);
      throw err;
    }
  };

  const deleteCase = async (caseId: string) => {
    try {
      await testApi.delete(caseId);
      setCases(prev => prev.filter(c => c.id !== caseId));
    } catch (err) {
      console.error('Failed to delete test case:', err);
      throw err;
    }
  };

  const addFolder = async (f: TestFolder) => {
    try {
      const folderWithProject = { ...f, projectId: activeProjectId };
      const request = groupToBackend(folderWithProject);
      const created = await groupApi.create(request);
      const mapped = groupFromBackend(created);
      setFolders(prev => [...prev, mapped]);
    } catch (err) {
      console.error('Failed to create folder:', err);
      throw err;
    }
  };

  const addRun = (r: TestRun) => {
    // TODO: Implement test run API when backend supports it
    setRuns(prev => [...prev, { ...r, projectId: activeProjectId }]);
  };

  const addScript = (s: Script) => {
    // TODO: Implement script API when backend supports it
    setScripts(prev => [...prev, { ...s, projectId: activeProjectId }]);
  };

  const updateScript = (s: Script) => {
    // TODO: Implement script API when backend supports it
    setScripts(prev => prev.map(ex => ex.id === s.id ? s : ex));
  };

  const deleteScript = (ids: string[]) => {
    // TODO: Implement script API when backend supports it
    setScripts(prev => prev.filter(s => !ids.includes(s.id)));
  };

  const addWorkflow = async (w: Workflow) => {
    try {
      const workflowWithProject = { ...w, projectId: activeProjectId };
      const created = await workflowApi.create(workflowToBackend(workflowWithProject));
      const mapped = workflowFromBackend(created);
      setWorkflows(prev => [...prev, mapped]);
    } catch (err) {
      console.error('Failed to create workflow:', err);
      throw err;
    }
  };

  const updateWorkflow = async (w: Workflow) => {
    try {
      const updated = await workflowApi.update(w.id, workflowToBackend(w));
      const mapped = workflowFromBackend(updated);
      setWorkflows(prev => prev.map(ex => ex.id === w.id ? mapped : ex));
    } catch (err) {
      console.error('Failed to update workflow:', err);
      throw err;
    }
  };

  return {
    // UI State
    currentUser, setCurrentUser,
    currentTab, setCurrentTab,

    // Multi-tenancy
    orgs, setOrgs,
    projects, setProjects,
    activeOrgId, setActiveOrgId,
    activeProjectId, setActiveProjectId,

    // Core Entities
    cases, addCase, updateCase, deleteCase,
    folders, addFolder,
    runs, addRun,
    scripts, addScript, updateScript, deleteScript,
    workflows, addWorkflow, updateWorkflow,
    envs, setEnvs,
    activeEnvId, setActiveEnvId, activeEnv,
    users, setUsers,
    roles, setRoles,

    // API-specific: Loading & Error states
    loading,
    error,

    // Refresh functions
    refresh: {
      orgs: loadOrganizations,
      projects: loadProjects,
      cases: loadTestCases,
      folders: loadFolders,
      environments: loadEnvironments,
      workflows: loadWorkflows,
    },
  };
};
