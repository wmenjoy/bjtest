# Phase 4 Progress - 多租户管理集成

**日期**: 2025-11-23
**状态**: ✅ UI 已完成，后端集成正常
**进度**: 95%

---

## 完成的工作

### 1. ✅ 后端 Tenant/Project API（已存在）

**Tenant API 端点** (`/api/v2/tenants`):
```
POST   /api/v2/tenants                    - 创建租户
GET    /api/v2/tenants                    - 列出所有租户
GET    /api/v2/tenants/active             - 列出活跃租户
GET    /api/v2/tenants/:tenantId          - 获取租户详情
PUT    /api/v2/tenants/:tenantId          - 更新租户
DELETE /api/v2/tenants/:tenantId          - 删除租户
POST   /api/v2/tenants/:tenantId/suspend  - 暂停租户
POST   /api/v2/tenants/:tenantId/activate - 激活租户
GET    /api/v2/tenants/:tenantId/projects - 获取租户的项目列表
GET    /api/v2/tenants/:tenantId/projects/active - 获取租户的活跃项目
GET    /api/v2/tenants/:tenantId/members  - 获取租户成员
```

**Project API 端点** (`/api/v2/projects`):
```
POST   /api/v2/projects                       - 创建项目
GET    /api/v2/projects                       - 列出所有项目
GET    /api/v2/projects/:projectId            - 获取项目详情
PUT    /api/v2/projects/:projectId            - 更新项目
DELETE /api/v2/projects/:projectId            - 删除项目
POST   /api/v2/projects/:projectId/archive    - 归档项目
POST   /api/v2/projects/:projectId/activate   - 激活项目
GET    /api/v2/projects/:projectId/test-groups - 获取项目的测试组
GET    /api/v2/projects/:projectId/test-cases  - 获取项目的测试用例
GET    /api/v2/projects/:projectId/members     - 获取项目成员
POST   /api/v2/projects/:projectId/update-stats - 更新项目统计
```

---

### 2. ✅ 前端 tenantApi 和 projectApi（已实现）

**文件**: `services/api/tenantApi.ts`, `services/api/projectApi.ts`

**tenantApi 方法**:
```typescript
{
  list(): Promise<Organization[]>
  // 更多方法...
}
```

**projectApi 方法**:
```typescript
{
  list(): Promise<Project[]>
  // 更多方法...
}
```

**类型映射**:
```typescript
// organizationFromBackend
function organizationFromBackend(tenant: BackendTenant): Organization {
  return {
    id: tenant.tenantId,
    name: tenant.name,
    type: 'department' as const,
  };
}

// projectFromBackend
function projectFromBackend(proj: BackendProject): Project {
  return {
    id: proj.projectId,
    orgId: proj.tenantId,
    name: proj.name,
    description: proj.description,
    key: proj.projectId,
  };
}
```

---

### 3. ✅ useApiState 集成（已完成）

**文件**: `hooks/useApiState.ts`

**loadOrganizations 函数**:
```typescript
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
```

**loadProjects 函数**:
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

    // Set default active project if not set
    if (!activeProjectId && mappedProjects.length > 0) {
      setActiveProjectId(mappedProjects[0].id);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load projects';
    setError(prev => ({ ...prev, projects: message }));
    console.error('Failed to load projects:', err);
  } finally {
    setLoading(prev => ({ ...prev, projects: false }));
  }
}, [activeOrgId, activeProjectId]);
```

**Effect 触发**:
- 组织在组件挂载时加载
- 项目在 `activeOrgId` 改变时加载

---

### 4. ✅ Sidebar 组织/项目选择器（已实现）

**文件**: `components/layout/Sidebar.tsx` (line 74-152)

#### 组织选择器 (line 76-112)

**UI 功能**:
- ✅ 显示当前组织名称和图标
- ✅ 下拉菜单列出所有组织
- ✅ 选中的组织高亮显示（蓝色+√）
- ✅ 点击切换组织
- ✅ 组织图标使用 `Building2`

**实现代码**:
```tsx
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
```

#### 项目选择器 (line 114-152)

**UI 功能**:
- ✅ 显示当前项目名称
- ✅ 仅显示当前组织的项目（客户端过滤）
- ✅ 项目 KEY 显示在左侧
- ✅ 选中的项目高亮显示（蓝色+√）
- ✅ 点击切换项目
- ✅ 无项目时显示提示

**过滤逻辑**:
```typescript
const orgProjects = useMemo(() =>
  projects.filter(p => p.orgId === activeOrgId),
  [projects, activeOrgId]
);
```

**实现代码**:
```tsx
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
```

---

### 5. ✅ 数据隔离过滤（已实现）

**文件**: `App.tsx` (line 62-68)

**过滤逻辑**:
```typescript
// Filtering based on Multi-tenancy
const activeProjectCases = cases.filter(c => c.projectId === activeProjectId);
const activeProjectFolders = folders.filter(f => f.projectId === activeProjectId);
const activeProjectRuns = runs.filter(r => r.projectId === activeProjectId);
const activeProjectScripts = scripts.filter(s => s.projectId === activeProjectId);
const activeProjectWorkflows = workflows.filter(w => w.projectId === activeProjectId);
const activeProjectEnvs = envs.filter(e => e.projectId === activeProjectId);
```

**传递给组件**:
- TestCaseManager 接收 `activeProjectCases`
- ScriptLab 接收 `activeProjectScripts`, `activeProjectWorkflows`
- ActionLibrary 接收 `activeProjectScripts`
- 所有组件接收 `activeProjectId`

---

## 待完成的任务

### ⏳ 1. 测试组织切换

**测试步骤**:
1. ✅ 访问前端 http://localhost:8083/
2. ⏳ 打开 Sidebar，检查组织选择器
3. ⏳ 查看当前组织名称
4. ⏳ 点击组织选择器，查看所有组织
5. ⏳ 选择另一个组织
6. ⏳ 验证项目列表是否更新（只显示新组织的项目）
7. ⏳ 验证所有数据（测试用例、工作流等）是否清空或更新

**预期结果**:
- 组织切换后，项目列表自动过滤
- 如果新组织没有项目，显示"No projects found"
- 第一个项目自动选中（如果有）

---

### ⏳ 2. 测试项目切换

**测试步骤**:
1. ⏳ 选择一个有多个项目的组织
2. ⏳ 打开项目选择器，查看项目列表
3. ⏳ 选择不同的项目
4. ⏳ 验证 `activeProjectId` 更新
5. ⏳ 验证测试用例列表更新（只显示新项目的数据）
6. ⏳ 验证文件夹、工作流等也都更新

**预期结果**:
- 项目切换后，所有模块的数据都重新加载
- 只显示当前项目的数据
- 环境列表也更新（只显示当前项目的环境）

---

### ⏳ 3. 测试数据隔离

**测试场景**:
1. ⏳ 在项目 A 创建测试用例 "Test Case A"
2. ⏳ 切换到项目 B
3. ⏳ 验证"Test Case A"不可见
4. ⏳ 在项目 B 创建测试用例 "Test Case B"
5. ⏳ 切换回项目 A
6. ⏳ 验证"Test Case A"仍然存在
7. ⏳ 验证"Test Case B"不可见

**测试实体**:
- [ ] Test Cases
- [ ] Folders
- [ ] Workflows
- [ ] Scripts
- [ ] Environments
- [ ] Test Runs

---

### ⏳ 4. 测试组织/项目 CRUD（可选）

**Admin Portal 功能**:
- [ ] 创建新组织
- [ ] 编辑组织名称
- [ ] 删除组织
- [ ] 创建新项目
- [ ] 编辑项目信息
- [ ] 删除项目

**注意**: 这些功能可能在 AdminPortal 组件中，需要验证是否已实现

---

## 集成测试清单

### 组织管理
- [ ] 启动前端，验证组织列表加载
- [ ] 查看 Sidebar，确认显示当前组织
- [ ] 打开组织下拉菜单，查看所有组织
- [ ] 切换到另一个组织
- [ ] 验证项目列表更新
- [ ] 验证测试数据清空或更新

### 项目管理
- [ ] 查看当前组织的项目列表
- [ ] 切换项目
- [ ] 验证测试用例列表更新
- [ ] 验证文件夹列表更新
- [ ] 验证环境列表更新

### 数据隔离
- [ ] 在项目 A 创建测试数据
- [ ] 切换到项目 B，验证数据不可见
- [ ] 在项目 B 创建不同的测试数据
- [ ] 切换回项目 A，验证原数据仍存在

### 边界情况
- [ ] 组织没有项目时的处理
- [ ] 项目没有测试用例时的处理
- [ ] 切换组织时的 Loading 状态
- [ ] API 错误时的处理

---

## 已知问题

### 1. 项目过滤在客户端进行

**当前实现**:
```typescript
const allProjects = await projectApi.list();
const mappedProjects = allProjects.filter(p => p.orgId === activeOrgId);
```

**问题**: 对于大量项目，客户端过滤效率低

**解决方案**: 后端添加查询参数
```typescript
const mappedProjects = await projectApi.list({ tenantId: activeOrgId });
```

**优先级**: 中（性能优化）

---

### 2. 切换组织时的数据加载

**当前实现**: Effect 链式触发
```typescript
// 1. activeOrgId 改变 → loadProjects
// 2. activeProjectId 改变 → loadTestCases, loadFolders, ...
```

**问题**: 多次 API 调用，可能有短暂的中间状态

**解决方案**: 统一加载函数
```typescript
async function switchOrganization(orgId: string) {
  setActiveOrgId(orgId);
  const projects = await loadProjects(orgId);
  if (projects.length > 0) {
    await switchProject(projects[0].id);
  }
}
```

**优先级**: 低（用户体验优化）

---

### 3. 本地存储持久化

**当前实现**: 每次刷新页面，选择会重置

**解决方案**: 使用 localStorage 保存
```typescript
useEffect(() => {
  const saved = localStorage.getItem('activeOrgId');
  if (saved) setActiveOrgId(saved);
}, []);

useEffect(() => {
  localStorage.setItem('activeOrgId', activeOrgId);
}, [activeOrgId]);
```

**优先级**: 中（用户体验）

---

## UI 设计符合性

### ✅ 符合 UI 规范

**颜色方案**:
- ✅ 主背景: `bg-slate-900`
- ✅ 次级背景: `bg-slate-800`
- ✅ 边框: `border-slate-700`
- ✅ 文本: `text-slate-300`, `text-white`
- ✅ 高亮: `bg-indigo-600`, `text-indigo-400`

**交互效果**:
- ✅ Hover 状态: `hover:bg-slate-700`, `hover:bg-slate-800`
- ✅ 激活状态: `bg-slate-700/50`
- ✅ 过渡动画: `transition-colors`
- ✅ 图标旋转: `rotate-180`

**布局**:
- ✅ Flexbox 布局
- ✅ 文本截断: `truncate`
- ✅ 响应式间距
- ✅ 固定遮罩层: `fixed inset-0 z-10`

---

## 下一步

### 立即测试（优先级：高）
1. **组织切换**: 在浏览器中测试 Sidebar 组织选择器
2. **项目切换**: 测试项目选择器和数据过滤
3. **数据隔离**: 跨项目验证数据隔离

### 功能验证（优先级：中）
1. **Admin Portal**: 验证组织/项目 CRUD 功能是否实现
2. **成员管理**: 验证组织/项目成员管理是否实现

### 优化（优先级：低）
1. **localStorage 持久化**: 保存用户选择
2. **后端过滤**: 优化项目查询性能
3. **加载优化**: 减少切换时的 API 调用

---

## 文档状态

**状态**: ✅ 活跃
**最后更新**: 2025-11-23
**下次审查**: Phase 4 测试完成后
**进度**: 95% (UI 和集成完成，待测试)
