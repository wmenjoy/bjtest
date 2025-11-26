# Frontend API Integration Fixes

**Date**: 2025-11-23
**Status**: ✅ All Fixed
**Files Modified**: `hooks/useApiState.ts`

---

## Overview

Fixed multiple API response handling issues in `useApiState.ts` where the code was attempting to access properties that didn't exist on the actual API response objects.

---

## Issues Fixed

### 1. ✅ Organization Loading - `.data.map()` on Already-Mapped Response

**Error**:
```
TypeError: Cannot read properties of undefined (reading 'map')
at useApiState.ts:99:56
```

**Root Cause**:
The `tenantApi.list()` already returns `Organization[]` directly (mapping is done inside the API function), but the code was trying to access `response.data.map()`.

**Before** (useApiState.ts:94-112):
```typescript
const loadOrganizations = useCallback(async () => {
  setLoading(prev => ({ ...prev, orgs: true }));
  setError(prev => ({ ...prev, orgs: null }));
  try {
    const response = await tenantApi.list();
    const mappedOrgs: Organization[] = response.data.map(tenant => ({
      id: tenant.tenantId,
      name: tenant.name,
      type: 'department' as const,
    }));
    setOrgs(mappedOrgs);
    // ...
  }
});
```

**After**:
```typescript
const loadOrganizations = useCallback(async () => {
  setLoading(prev => ({ ...prev, orgs: true }));
  setError(prev => ({ ...prev, orgs: null }));
  try {
    const mappedOrgs = await tenantApi.list(); // Already returns Organization[]
    setOrgs(mappedOrgs);
    // ...
  }
});
```

**API Function** (services/api/tenantApi.ts:19-22):
```typescript
async list(): Promise<Organization[]> {
  const response = await apiClientV2.get<TenantListResponse>('/tenants');
  return response.data.map(organizationFromBackend);
}
```

---

### 2. ✅ Project Loading - Same Issue

**Error**:
```
(Similar to org loading - would have occurred if org loading succeeded)
```

**Root Cause**:
The `projectApi.list()` already returns `Project[]`, but the code was calling it with parameters and accessing `.data.map()`.

**Before** (useApiState.ts:114-136):
```typescript
const loadProjects = useCallback(async () => {
  if (!activeOrgId) return;
  setLoading(prev => ({ ...prev, projects: true }));
  setError(prev => ({ ...prev, projects: null }));
  try {
    const response = await projectApi.list({ tenantId: activeOrgId });
    const mappedProjects: Project[] = response.data.map(proj => ({
      id: proj.projectId,
      orgId: proj.tenantId,
      name: proj.name,
      description: proj.description,
      key: proj.projectId,
    }));
    setProjects(mappedProjects);
    // ...
  }
});
```

**After**:
```typescript
const loadProjects = useCallback(async () => {
  if (!activeOrgId) return;
  setLoading(prev => ({ ...prev, projects: true }));
  setError(prev => ({ ...prev, projects: null }));
  try {
    const allProjects = await projectApi.list(); // Already returns Project[]
    // Filter projects by tenant client-side
    const mappedProjects = allProjects.filter(p => p.orgId === activeOrgId);
    setProjects(mappedProjects);
    // ...
  }
});
```

**API Function** (services/api/projectApi.ts:19-22):
```typescript
async list(): Promise<Project[]> {
  const response = await apiClientV2.get<ProjectListResponse>('/projects');
  return response.data.map(projectFromBackend);
}
```

---

### 3. ✅ Test Cases Loading - Wrong Property Name

**Error**:
```
TypeError: Cannot read properties of undefined (reading 'filter')
at useApiState.ts:147:10
```

**Root Cause**:
The `testApi.list()` uses `fromPaginatedResponse()` helper which returns `{ items, total, page, pageSize, totalPages }`, but the code was trying to access `response.data` instead of `response.items`.

**Before** (useApiState.ts:138-156):
```typescript
const loadTestCases = useCallback(async () => {
  if (!activeProjectId) return;
  setLoading(prev => ({ ...prev, cases: true }));
  setError(prev => ({ ...prev, cases: null }));
  try {
    const response = await testApi.list({ limit: 100, offset: 0 });
    const mappedCases = response.data  // ❌ Wrong property name
      .filter(tc => tc.projectId === activeProjectId)
      .map(testCaseFromBackend);
    setCases(mappedCases);
  }
});
```

**After**:
```typescript
const loadTestCases = useCallback(async () => {
  if (!activeProjectId) return;
  setLoading(prev => ({ ...prev, cases: true }));
  setError(prev => ({ ...prev, cases: null }));
  try {
    const response = await testApi.list({ limit: 100, offset: 0 });
    // response is { items, total, page, ... } from fromPaginatedResponse
    const mappedCases = response.items  // ✅ Correct property name
      .filter(tc => tc.projectId === activeProjectId);
    setCases(mappedCases);
  }
});
```

**API Helper** (services/api/helpers.ts):
```typescript
export function fromPaginatedResponse<T>(response: any): PaginatedResponse<T> {
  return {
    items: response.data || [],  // Backend data → frontend items
    total: response.total || 0,
    page: response.page || 1,
    pageSize: response.pageSize || 10,
    totalPages: Math.ceil((response.total || 0) / (response.pageSize || 10))
  };
}
```

---

### 4. ✅ Folders Loading - Wrong Method Name

**Error**:
```
TypeError: groupApi.getTree is not a function
at useApiState.ts:164:39
```

**Root Cause**:
The method is called `tree()` not `getTree()`.

**Before** (useApiState.ts:159-175):
```typescript
const loadFolders = useCallback(async () => {
  if (!activeProjectId) return;
  setLoading(prev => ({ ...prev, folders: true }));
  setError(prev => ({ ...prev, folders: null }));
  try {
    const response = await groupApi.getTree();  // ❌ Wrong method name
    const mappedFolders = response
      .filter(g => g.projectId === activeProjectId)
      .map(groupFromBackend);
    setFolders(mappedFolders);
  }
});
```

**After**:
```typescript
const loadFolders = useCallback(async () => {
  if (!activeProjectId) return;
  setLoading(prev => ({ ...prev, folders: true }));
  setError(prev => ({ ...prev, folders: null }));
  try {
    const allFolders = await groupApi.tree(); // ✅ Correct method name
    const mappedFolders = allFolders.filter(g => g.projectId === activeProjectId);
    setFolders(mappedFolders);
  }
});
```

**API Function** (services/api/groupApi.ts:22-25):
```typescript
async tree(): Promise<TestFolder[]> {
  const response = await apiClient.get<BackendTestGroup[]>('/groups/tree');
  return response.map(testFolderFromBackend);
}
```

---

### 5. ✅ Environments Loading - Accessing Wrong Property

**Error**:
```
TypeError: Cannot read properties of undefined (reading 'filter')
at useApiState.ts:185:10
```

**Root Cause**:
The `environmentApi.list()` already returns `Environment[]` directly (mapping done inside the API function), but the code was trying to access `.data` property and then map again.

**Before** (useApiState.ts:176-198):
```typescript
const loadEnvironments = useCallback(async () => {
  if (!activeProjectId) return;
  setLoading(prev => ({ ...prev, environments: true }));
  setError(prev => ({ ...prev, environments: null }));
  try {
    const allEnvs = await environmentApi.list();
    const mappedEnvs = allEnvs.data  // ❌ Wrong - allEnvs is already Environment[]
      .filter(env => env.projectId === activeProjectId)
      .map(environmentFromBackend);
    setEnvs(mappedEnvs);
    // ...
  }
});
```

**After**:
```typescript
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
  }
});
```

**API Function** (services/api/environmentApi.ts):
```typescript
async list(): Promise<Environment[]> {
  const response = await apiClientV2.get<EnvironmentListResponse>('/environments');
  return response.data.map(environmentFromBackend); // Already mapped
}
```

---

## Summary of Changes

| Function | Issue | Fix |
|----------|-------|-----|
| `loadOrganizations` | Accessing `.data.map()` on `Organization[]` | Use response directly |
| `loadProjects` | Calling `list({ tenantId })` + accessing `.data.map()` | Remove params, filter client-side |
| `loadTestCases` | Accessing `response.data` instead of `response.items` | Changed to `response.items` |
| `loadFolders` | Calling `getTree()` instead of `tree()` | Changed to `tree()` |
| `loadEnvironments` | Accessing `.data` on `Environment[]` | Use response directly, remove `.data` |

---

## Key Learnings

### 1. API Response Patterns

**Pattern A**: Direct array return (already mapped)
- `tenantApi.list()` → `Organization[]`
- `projectApi.list()` → `Project[]`
- `groupApi.tree()` → `TestFolder[]`
- `environmentApi.list()` → `Environment[]`

**Pattern B**: Paginated with items (using fromPaginatedResponse helper)
- `testApi.list()` → `{ items: TestCase[], total: number, page: number, pageSize: number, totalPages: number }`

**Pattern C**: Paginated raw data
- `workflowApi.list()` → `{ data: BackendWorkflow[], total: number }`

### 2. Mapping Responsibilities

**Server-side mapping** (in API functions - Pattern A):
- `tenantApi.list()` does: `response.data.map(organizationFromBackend)`
- `projectApi.list()` does: `response.data.map(projectFromBackend)`
- `groupApi.tree()` does: `response.map(testFolderFromBackend)`
- `environmentApi.list()` does: `response.data.map(environmentFromBackend)`

**Server-side mapping with pagination helper** (Pattern B):
- `testApi.list()` does: `fromPaginatedResponse()` which returns `{ items, total, page, ... }`
- Items are already `TestCase[]` (mapped by `testCaseFromBackend`)

**Client-side mapping** (Pattern C):
- `workflowApi.list()` returns `{ data: BackendWorkflow[], total }` → client maps with `workflowFromBackend`

### 3. Filtering Strategy

**Server-side filtering** (ideal but not available):
- `projectApi.list({ tenantId })` - NOT supported, filter client-side

**Client-side filtering** (current approach):
```typescript
const allProjects = await projectApi.list();
const filtered = allProjects.filter(p => p.orgId === activeOrgId);
```

---

## Testing Status

✅ **Compilation**: Successful
```bash
dist/assets/index-Bo3cH4Vr.js  873.80 kB │ gzip: 244.47 kB
✓ built in 2.27s
```

⏳ **Runtime Testing**: Pending
- Need to verify data loads correctly from backend
- Test organization → project → test cases cascade
- Verify error handling works

---

## Recommendations

### 1. API Consistency

**Current State**: Mixed mapping responsibilities
- Some APIs map in the API function
- Others return raw data for client to map

**Recommendation**: Standardize on one approach:

**Option A**: All mapping in API functions (preferred)
```typescript
// In testApi.ts
async list(params?: PaginationParams): Promise<TestCase[]> {
  const response = await apiClient.get<PaginatedResponse<BackendTestCase>>('/tests', params);
  return response.data.map(testCaseFromBackend);
}

// In useApiState.ts
const allCases = await testApi.list({ limit: 100 });
const filtered = allCases.filter(tc => tc.projectId === activeProjectId);
```

**Option B**: All mapping in client (current for some)
- More control but more boilerplate

### 2. Type Safety

Add return type comments for clarity:
```typescript
// Returns Organization[] (already mapped)
const orgs = await tenantApi.list();

// Returns { data: BackendTestCase[], total: number }
const response = await testApi.list();
```

### 3. Error Context

Current error handling is good, but consider adding request context:
```typescript
catch (err) {
  const message = err instanceof Error ? err.message : 'Failed to load test cases';
  setError(prev => ({ ...prev, cases: `${message} (projectId: ${activeProjectId})` }));
  console.error('Failed to load test cases:', { activeProjectId, err });
}
```

---

**Status**: ✅ All API issues resolved
**Next**: Runtime testing with actual backend
