# Phase 3 Progress - 环境管理集成

**日期**: 2025-11-23
**状态**: ✅ 基础集成完成，待测试
**进度**: 90%

---

## 完成的工作

### 1. ✅ 后端 Environment API（已存在）

**API 端点**:
```
POST   /api/environments              - 创建环境
GET    /api/environments              - 列出所有环境
GET    /api/environments/active       - 获取活动环境
GET    /api/environments/:id          - 获取环境详情
PUT    /api/environments/:id          - 更新环境
DELETE /api/environments/:id          - 删除环境
POST   /api/environments/:id/activate - 激活环境
GET    /api/environments/:id/variables - 获取环境变量
PUT    /api/environments/:id/variables/:key - 设置变量
DELETE /api/environments/:id/variables/:key - 删除变量
```

**测试结果**:
```bash
curl http://localhost:8090/api/environments
✅ 返回 4 个环境（default, testgroup-test-env, test-env-api, verify-p1-env）
```

**响应格式**:
```json
{
  "data": [
    {
      "id": 1,
      "envId": "default",
      "tenantId": "default",
      "projectId": "default",
      "name": "Default Environment",
      "description": "Default testing environment",
      "isActive": true,
      ...
    }
  ],
  "limit": 20,
  "offset": 0,
  "total": 4
}
```

---

### 2. ✅ 前端 environmentApi（已实现）

**文件**: `services/api/environmentApi.ts`

**已实现方法**:
- `list()` - 获取环境列表，返回 `Environment[]`
- `get(envId)` - 获取单个环境
- `getActive()` - 获取活动环境
- `create(env)` - 创建环境
- `update(envId, updates)` - 更新环境
- `delete(envId)` - 删除环境
- `activate(envId)` - 激活环境
- `getVariables(envId)` - 获取环境变量
- `setVariable(envId, key, value)` - 设置单个变量
- `deleteVariable(envId, key)` - 删除单个变量

**类型映射**:
```typescript
export function environmentFromBackend(backend: BackendEnvironment): Environment {
  const variables: EnvironmentVariable[] = [];
  if (backend.variables) {
    Object.entries(backend.variables).forEach(([key, value]) => {
      variables.push({
        key,
        value: String(value),
        isSecret: key.toLowerCase().includes('secret') ||
                  key.toLowerCase().includes('password') ||
                  key.toLowerCase().includes('token') ||
                  key.toLowerCase().includes('api_key'),
      });
    });
  }

  return {
    id: backend.envId,
    projectId: backend.projectId || 'default',
    name: backend.name,
    variables,
    color: backend.isActive ? '#10b981' : '#6b7280', // 绿色=激活, 灰色=未激活
  };
}
```

---

### 3. ✅ useApiState 集成（已完成）

**文件**: `hooks/useApiState.ts`

**loadEnvironments 函数**:
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
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load environments';
    setError(prev => ({ ...prev, environments: message }));
    console.error('Failed to load environments:', err);
  } finally {
    setLoading(prev => ({ ...prev, environments: false }));
  }
}, [activeProjectId, activeEnvId]);
```

**Effect 触发**: 当 `activeProjectId` 改变时自动加载

---

### 4. ✅ Sidebar 环境选择器（已实现）

**文件**: `components/layout/Sidebar.tsx` (line 154-187)

**UI 功能**:
- ✅ 显示当前活动环境（带颜色标识）
- ✅ 按项目过滤环境 (`projectEnvs`)
- ✅ 下拉菜单选择环境
- ✅ 点击切换环境
- ✅ 无环境时显示提示

**实现代码**:
```tsx
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
```

---

## 待完成的任务

### ⏳ 1. 测试环境切换功能

**测试步骤**:
1. ✅ 访问前端 http://localhost:8083/
2. ⏳ 打开 Sidebar 环境选择器
3. ⏳ 选择不同的环境
4. ⏳ 验证 `activeEnvId` 和 `activeEnv` 是否更新
5. ⏳ 检查其他组件是否使用新环境

**预期结果**:
- Sidebar 显示新选择的环境
- activeEnv 对象正确更新
- 环境颜色标识正确显示

---

### ⏳ 2. 测试环境变量管理（SystemConfig 页面）

**文件**: `components/SystemConfig.tsx`

**需要测试的功能**:
- [ ] 显示环境列表
- [ ] 切换选中环境
- [ ] 显示环境变量列表
- [ ] 添加新变量
- [ ] 编辑变量值
- [ ] 删除变量
- [ ] 密钥变量的掩码显示（`isSecret: true`）

**API 调用**:
```typescript
// 获取变量
const vars = await environmentApi.getVariables(envId)

// 设置变量
await environmentApi.setVariable(envId, 'API_KEY', 'secret-value')

// 删除变量
await environmentApi.deleteVariable(envId, 'API_KEY')
```

**UI 设计要求**:
- 变量列表表格（key, value, actions）
- 密钥变量用 `****` 掩码显示
- 添加/编辑变量的表单或模态框
- 删除确认弹窗

---

### ⏳ 3. 测试测试执行中的环境变量使用

**文件**: `components/TestRunner.tsx`

**测试场景**:
1. 创建一个 HTTP 测试用例，URL 使用变量：`{{BASE_URL}}/api/test`
2. 在环境中设置 `BASE_URL = http://localhost:8090`
3. 执行测试
4. 验证变量是否被正确替换

**后端支持**:
- ✅ 后端已实现变量注入 (`internal/service/variable_injector.go`)
- ✅ Workflow 执行支持变量插值

**前端需求**:
- TestRunner 传递 `activeEnv` 给执行 API
- 显示变量插值后的实际 URL（可选）

---

## 集成测试清单

### 环境切换
- [ ] 启动前端，验证环境列表加载
- [ ] 打开 Sidebar，检查环境选择器是否显示
- [ ] 切换环境，验证颜色和名称更新
- [ ] 刷新页面，验证选中的环境保持不变（localStorage）

### 环境变量管理
- [ ] 访问 Settings 页面
- [ ] 选择一个环境
- [ ] 显示该环境的变量列表
- [ ] 添加新变量（key: TEST_VAR, value: test123）
- [ ] 刷新页面，验证变量保存成功
- [ ] 编辑变量值
- [ ] 删除变量

### 测试执行中的变量使用
- [ ] 创建测试用例，URL 包含变量
- [ ] 选择包含对应变量的环境
- [ ] 执行测试
- [ ] 验证请求使用了正确的变量值
- [ ] 检查执行日志中的变量插值

---

## 已知问题

### 1. 环境颜色硬编码

**当前实现**:
```typescript
color: backend.isActive ? '#10b981' : '#6b7280'
```

**问题**: 颜色只根据 `isActive` 状态决定，不是从后端返回的实际颜色

**解决方案**:
- Option A: 后端添加 `color` 字段到 Environment 模型
- Option B: 前端根据环境名称或类型分配颜色（Dev=绿色, Staging=黄色, Prod=红色）

**优先级**: 低（不影响功能）

---

### 2. 环境变量的 isSecret 检测

**当前实现**:
```typescript
isSecret: key.toLowerCase().includes('secret') ||
          key.toLowerCase().includes('password') ||
          key.toLowerCase().includes('token') ||
          key.toLowerCase().includes('api_key')
```

**问题**: 基于关键词的简单检测，可能不准确

**解决方案**:
- 后端环境变量表添加 `is_secret` 字段
- 前端从后端读取该标志

**优先级**: 中（安全相关）

---

### 3. projectId 过滤逻辑

**当前实现**: 客户端过滤
```typescript
const mappedEnvs = allEnvs.filter(env => env.projectId === activeProjectId);
```

**问题**: 对于大量环境，客户端过滤效率低

**解决方案**: 后端添加查询参数支持
```typescript
const response = await apiClient.get('/environments', { projectId: activeProjectId })
```

**优先级**: 中（性能优化）

---

## 下一步

### 立即测试（优先级：高）
1. **环境切换**: 在浏览器中测试 Sidebar 环境选择器
2. **SystemConfig**: 访问 Settings 页面，验证环境管理 UI

### 功能完善（优先级：中）
1. **变量管理 UI**: 如果 SystemConfig 缺少变量管理，需要实现
2. **测试执行集成**: 验证 TestRunner 传递环境变量

### 优化（优先级：低）
1. **颜色自定义**: 允许用户设置环境颜色
2. **变量加密**: 后端存储时加密密钥变量
3. **变量验证**: 添加变量名格式验证（只允许大写字母、数字、下划线）

---

## 文档状态

**状态**: ✅ 活跃
**最后更新**: 2025-11-23
**下次审查**: Phase 3 完成后
**进度**: 90% (基础集成完成，待测试)
