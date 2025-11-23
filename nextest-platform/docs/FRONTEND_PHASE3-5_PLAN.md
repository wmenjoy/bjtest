# 前后端适配计划 - Phase 3-5

**日期**: 2025-11-23
**当前进度**: Phase 2 完成，准备开始 Phase 3

---

## Phase 3: 环境管理集成 (1-2天)

### 目标
完成环境切换和变量管理的前后端集成，确保环境配置能够正确同步和使用。

### 后端状态检查
- ✅ Environment API 已存在 (`internal/handler/environment_handler.go`)
- ✅ API 端点已注册：
  - `POST /api/environments` - 创建环境
  - `GET /api/environments` - 列出所有环境
  - `GET /api/environments/active` - 获取活动环境
  - `GET /api/environments/:id` - 获取环境详情
  - `PUT /api/environments/:id` - 更新环境
  - `DELETE /api/environments/:id` - 删除环境
  - `POST /api/environments/:id/activate` - 激活环境
  - `GET /api/environments/:id/variables` - 获取环境变量
  - `PUT /api/environments/:id/variables/:key` - 设置变量
  - `DELETE /api/environments/:id/variables/:key` - 删除变量

### 前端状态检查
- ✅ environmentApi 已创建 (`services/api/environmentApi.ts`)
- ✅ useApiState 中已集成 loadEnvironments
- ⏳ **待办**: 测试环境切换功能
- ⏳ **待办**: 测试环境变量管理

### 具体任务

#### 3.1 ✅ 验证环境 API 集成（已完成）
- [x] environmentApi.list() 正常工作
- [x] 响应格式正确（Environment[]）
- [x] useApiState 正确加载环境列表

#### 3.2 测试环境切换功能
**文件**: `App.tsx`, `components/layout/Sidebar.tsx`

**任务**:
1. 验证 Sidebar 中的环境选择器
2. 测试 `setActiveEnvId` 切换逻辑
3. 确认环境切换后，相关组件能获取正确的 `activeEnv`

**验证步骤**:
```typescript
// 在浏览器中测试：
1. 选择不同的环境（Development, Staging, Production）
2. 检查 activeEnv 是否更新
3. 验证环境变量是否正确显示
```

#### 3.3 测试环境变量管理
**文件**: `components/SystemConfig.tsx`

**任务**:
1. 测试显示环境变量列表
2. 测试添加新变量
3. 测试编辑变量
4. 测试删除变量
5. 测试密钥变量的掩码显示

**API 调用**:
```typescript
// 获取变量
await environmentApi.getVariables(envId)

// 设置变量
await environmentApi.setVariable(envId, key, value, isSecret)

// 删除变量
await environmentApi.deleteVariable(envId, key)
```

#### 3.4 集成环境变量到测试执行
**文件**: `components/TestRunner.tsx`

**任务**:
1. 确认测试执行时使用当前活动环境
2. 验证变量插值功能 (`{{VAR_NAME}}`)
3. 测试环境变量在 HTTP 请求中的使用

---

## Phase 4: 多租户管理集成 (2-3天)

### 目标
完成组织（Tenant）和项目（Project）的切换功能，确保数据隔离正常工作。

### 后端状态检查
- ✅ Tenant API 已存在 (`internal/handler/tenant_handler.go`)
- ✅ Project API 已存在 (`internal/handler/project_handler.go`)
- ✅ API 端点已注册 (v2 API)
- ✅ tenantApi 和 projectApi 前端客户端已创建

### 前端状态检查
- ✅ useApiState 中已集成 loadOrganizations 和 loadProjects
- ✅ App.tsx 中有 activeOrgId 和 activeProjectId 状态
- ⏳ **待办**: 测试组织切换
- ⏳ **待办**: 测试项目切换
- ⏳ **待办**: 验证数据隔离

### 具体任务

#### 4.1 测试组织管理
**文件**: `components/AdminPortal.tsx`, `components/layout/Sidebar.tsx`

**任务**:
1. 验证组织列表加载
2. 测试创建新组织
3. 测试编辑组织信息
4. 测试删除组织
5. 测试组织状态切换（active/suspended）

**API 调用**:
```typescript
// 列出组织
await tenantApi.list()

// 创建组织
await tenantApi.create({ name: 'New Org', type: 'department' })

// 更新组织
await tenantApi.update(orgId, { name: 'Updated Name' })

// 删除组织
await tenantApi.delete(orgId)
```

#### 4.2 测试项目管理
**文件**: `components/AdminPortal.tsx`, `components/layout/Sidebar.tsx`

**任务**:
1. 验证项目列表加载（按组织过滤）
2. 测试创建新项目
3. 测试编辑项目信息
4. 测试删除项目
5. 测试项目状态切换（active/archived）

**API 调用**:
```typescript
// 列出所有项目
await projectApi.list()

// 按组织过滤（客户端）
const orgProjects = projects.filter(p => p.orgId === activeOrgId)

// 创建项目
await projectApi.create({
  name: 'New Project',
  orgId: activeOrgId,
  key: 'PRJ',
  description: 'Project description'
})

// 更新项目
await projectApi.update(projectId, { name: 'Updated Project' })

// 删除项目
await projectApi.delete(projectId)
```

#### 4.3 实现 Sidebar 组织/项目选择器
**文件**: `components/layout/Sidebar.tsx`

**当前状态**: Sidebar 已有 orgs, projects, activeOrgId, activeProjectId props

**任务**:
1. 添加组织下拉选择器 UI
2. 添加项目下拉选择器 UI
3. 实现切换逻辑
4. 添加 Loading 状态显示
5. 添加错误处理

**设计规范参考**: `NextTestPlatformUI_UI_FRAMEWORK_ANALYSIS.md`

**UI 实现**:
```tsx
{/* 组织选择器 */}
<div className="px-4 py-3 border-b border-slate-200">
  <label className="text-xs text-slate-500 mb-1">Organization</label>
  <select
    value={activeOrgId}
    onChange={(e) => setActiveOrgId(e.target.value)}
    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg"
  >
    {orgs.map(org => (
      <option key={org.id} value={org.id}>{org.name}</option>
    ))}
  </select>
</div>

{/* 项目选择器 */}
<div className="px-4 py-3 border-b border-slate-200">
  <label className="text-xs text-slate-500 mb-1">Project</label>
  <select
    value={activeProjectId}
    onChange={(e) => setActiveProjectId(e.target.value)}
    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg"
  >
    {projects.map(proj => (
      <option key={proj.id} value={proj.id}>{proj.name}</option>
    ))}
  </select>
</div>
```

#### 4.4 测试数据隔离
**文件**: 所有模块

**测试场景**:
1. 在组织 A 创建测试用例
2. 切换到组织 B
3. 验证组织 A 的测试用例不可见
4. 切换回组织 A
5. 验证测试用例仍然存在

**验证实体**:
- ✅ Test Cases (已过滤 by projectId)
- ✅ Folders (已过滤 by projectId)
- ✅ Runs (已过滤 by projectId)
- ✅ Scripts (已过滤 by projectId)
- ✅ Workflows (已过滤 by projectId)
- ✅ Environments (已过滤 by projectId)

---

## Phase 5: 工作流模块集成 (2-3天)

### 目标
完成工作流执行的前后端集成，实现 WebSocket 实时日志流。

### 后端状态检查
- ✅ Workflow API 已存在 (`internal/handler/workflow_handler.go`)
- ✅ WebSocket 支持已实现 (`internal/websocket/`)
- ✅ API 端点已注册
- ✅ WebSocket 端点: `GET /api/workflows/runs/:runId/stream`

### 前端状态检查
- ✅ workflowApi 已创建 (`services/api/workflowApi.ts`)
- ✅ WebSocket 客户端已创建 (`services/api/websocket.ts`)
- ⏳ **待办**: 测试工作流执行
- ⏳ **待办**: 测试 WebSocket 实时日志
- ⏳ **待办**: 实现工作流可视化

### 具体任务

#### 5.1 测试工作流 CRUD
**文件**: `components/ScriptLab.tsx`, `components/ActionLibrary.tsx`

**任务**:
1. 测试创建工作流
2. 测试更新工作流定义
3. 测试删除工作流
4. 测试列出工作流

**API 调用**:
```typescript
// 创建工作流
await workflowApi.create({
  name: 'Test Workflow',
  description: 'Workflow description',
  definition: {
    variables: { baseUrl: 'http://localhost' },
    steps: {
      step1: { /* ... */ }
    }
  }
})

// 更新工作流
await workflowApi.update(workflowId, updatedWorkflow)

// 删除工作流
await workflowApi.delete(workflowId)

// 列出工作流
await workflowApi.list({ limit: 100, offset: 0 })
```

#### 5.2 实现工作流执行
**文件**: `components/TestRunner.tsx` (或新建 WorkflowRunner)

**任务**:
1. 添加工作流执行按钮
2. 调用执行 API
3. 获取 runId
4. 初始化 WebSocket 连接
5. 显示执行状态

**API 调用**:
```typescript
// 执行工作流
const { runId } = await workflowApi.execute(workflowId, {
  variables: { env: 'dev' }
})

// 连接 WebSocket
const wsClient = new WorkflowStreamClient()
await wsClient.connect(runId, {
  onMessage: (msg) => console.log('Message:', msg),
  onStepStart: (payload) => console.log('Step started:', payload),
  onStepComplete: (payload) => console.log('Step completed:', payload),
  onStepLog: (payload) => console.log('Log:', payload),
  onVariableChange: (payload) => console.log('Variable changed:', payload),
  onComplete: () => console.log('Workflow complete'),
  onError: (error) => console.error('Error:', error)
})
```

#### 5.3 实现实时日志显示
**文件**: 新建 `components/workflow/WorkflowLogs.tsx`

**任务**:
1. 创建日志显示组件
2. 实现自动滚动
3. 添加日志过滤（按 level, step）
4. 添加时间戳显示
5. 添加语法高亮（JSON 数据）

**UI 设计**:
```tsx
<div className="flex flex-col h-full bg-slate-900 text-white">
  {/* 工具栏 */}
  <div className="flex items-center space-x-2 p-3 border-b border-slate-700">
    <span className="text-sm font-medium">Logs</span>
    <select className="px-2 py-1 bg-slate-800 rounded">
      <option>All Levels</option>
      <option>INFO</option>
      <option>WARN</option>
      <option>ERROR</option>
    </select>
    <button className="ml-auto text-sm">Clear</button>
  </div>

  {/* 日志内容 */}
  <div className="flex-1 overflow-y-auto p-4 font-mono text-sm">
    {logs.map((log, index) => (
      <div key={index} className="mb-1">
        <span className="text-slate-500">[{log.timestamp}]</span>
        <span className={`ml-2 ${getLevelColor(log.level)}`}>
          {log.level}
        </span>
        <span className="ml-2 text-slate-300">{log.message}</span>
      </div>
    ))}
  </div>
</div>
```

#### 5.4 实现工作流可视化（DAG）
**文件**: 新建 `components/workflow/WorkflowDAG.tsx`

**任务**:
1. 使用 React Flow 或类似库
2. 将 workflow definition 转换为 DAG 节点
3. 显示步骤依赖关系
4. 实时更新步骤状态（pending, running, success, failed）
5. 添加步骤点击查看详情

**数据转换**:
```typescript
// workflow.definition.steps → React Flow nodes
const nodes = Object.entries(workflow.definition.steps).map(([id, step]) => ({
  id,
  data: { label: step.name, status: 'pending' },
  position: calculatePosition(id, step.dependencies)
}))

const edges = Object.entries(workflow.definition.steps).flatMap(([id, step]) =>
  (step.dependencies || []).map(dep => ({
    id: `${dep}-${id}`,
    source: dep,
    target: id
  }))
)
```

---

## 测试检查清单

### Phase 3: 环境管理
- [ ] 环境列表正确加载
- [ ] 环境切换功能正常
- [ ] 环境变量显示正确
- [ ] 添加环境变量成功
- [ ] 编辑环境变量成功
- [ ] 删除环境变量成功
- [ ] 密钥变量正确掩码
- [ ] 测试执行时使用正确环境
- [ ] 变量插值在 HTTP 请求中工作

### Phase 4: 多租户管理
- [ ] 组织列表正确加载
- [ ] 组织切换功能正常
- [ ] 项目列表按组织过滤
- [ ] 项目切换功能正常
- [ ] 创建组织成功
- [ ] 编辑组织成功
- [ ] 删除组织成功
- [ ] 创建项目成功
- [ ] 编辑项目成功
- [ ] 删除项目成功
- [ ] 数据隔离正确（测试用例）
- [ ] 数据隔离正确（文件夹）
- [ ] 数据隔离正确（工作流）
- [ ] 切换组织后数据自动刷新

### Phase 5: 工作流模块
- [ ] 工作流列表正确加载
- [ ] 创建工作流成功
- [ ] 编辑工作流成功
- [ ] 删除工作流成功
- [ ] 工作流执行成功
- [ ] WebSocket 连接成功
- [ ] 实时日志正确显示
- [ ] 步骤状态实时更新
- [ ] 变量变更实时显示
- [ ] 执行完成通知正常
- [ ] 错误处理正确
- [ ] DAG 可视化正确
- [ ] 步骤依赖关系正确
- [ ] 并行步骤显示正确
- [ ] 失败步骤高亮显示

---

## 性能优化建议

### 数据加载优化
1. **懒加载**: 仅在需要时加载数据
2. **分页**: 对大列表使用分页（测试用例、工作流运行）
3. **缓存**: 缓存不常变化的数据（组织、项目、角色）

### WebSocket 优化
1. **自动重连**: 连接断开时自动重连
2. **心跳检测**: 定期发送 ping 保持连接
3. **消息队列**: 批量处理高频消息

### UI 优化
1. **虚拟滚动**: 长列表使用虚拟滚动
2. **防抖/节流**: 搜索、过滤等操作使用防抖
3. **骨架屏**: Loading 时显示骨架屏而非空白

---

## 风险与应对

### 风险 1: API 响应格式不一致
**应对**:
- 使用 TypeScript 严格类型检查
- 在 mapper 中添加运行时验证
- 编写集成测试

### 风险 2: WebSocket 连接不稳定
**应对**:
- 实现自动重连机制
- 添加降级方案（轮询）
- 显示连接状态给用户

### 风险 3: 数据隔离泄露
**应对**:
- 后端添加严格的权限检查
- 前端双重过滤（按 projectId）
- 编写专门的隔离测试

### 风险 4: 性能问题
**应对**:
- 添加 Loading 状态
- 实现分页和虚拟滚动
- 优化 API 查询（后端添加索引）

---

## 时间估算

| Phase | 任务 | 预计时间 | 备注 |
|-------|------|---------|------|
| Phase 3 | 环境切换测试 | 2小时 | 简单功能测试 |
| Phase 3 | 环境变量管理 | 4小时 | UI + API 集成 |
| Phase 3 | 测试集成 | 2小时 | 验证变量插值 |
| **Phase 3 小计** | | **8小时** | **1天** |
| Phase 4 | 组织/项目管理 | 4小时 | CRUD + UI |
| Phase 4 | Sidebar 选择器 | 3小时 | UI 实现 |
| Phase 4 | 数据隔离测试 | 5小时 | 全面测试 |
| **Phase 4 小计** | | **12小时** | **1.5天** |
| Phase 5 | 工作流 CRUD | 3小时 | API 测试 |
| Phase 5 | WebSocket 集成 | 6小时 | 实时通信 |
| Phase 5 | 日志显示组件 | 4小时 | UI 实现 |
| Phase 5 | DAG 可视化 | 8小时 | 复杂 UI |
| **Phase 5 小计** | | **21小时** | **2.5天** |
| **总计** | | **41小时** | **5天** |

---

**文档状态**: ✅ 活跃
**最后更新**: 2025-11-23
**下次审查**: Phase 3 完成后
