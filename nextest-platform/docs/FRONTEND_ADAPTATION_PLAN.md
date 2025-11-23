# 前端适配详细计划

**创建日期**: 2025-11-23
**目标**: NextTestPlatformUI 适配 nextest-platform 后端
**原则**: 复用现有组件、保持 UI 一致性、渐进式改造

---

## 一、前端技术栈分析

### 1.1 核心技术

| 技术 | 版本 | 用途 |
|------|------|------|
| React | 19.2.0 | UI 框架 |
| TypeScript | 5.8.2 | 类型系统 |
| Vite | 6.2.0 | 构建工具 |
| Tailwind CSS | - | 样式系统 (手写，无组件库) |
| lucide-react | 0.554.0 | 图标库 (48+ 图标) |
| Recharts | 3.4.1 | 数据可视化 |
| @google/genai | 1.30.0 | AI 集成 |

### 1.2 设计系统

**颜色规范**:
```typescript
// 主色调
slate: 50, 100, 200, 400, 500, 600, 700, 800, 900

// 功能色
blue:    主按钮、选中状态 (50, 500, 600, 700)
indigo:  AI 功能 (50, 500, 600)
purple:  环境管理 (50, 600, 700)
orange:  高优先级 (50, 600)
red:     关键/错误 (50, 600)
green:   成功/激活 (emerald: 500, 600, 700)
```

**组件样式规范**:
```css
/* 圆角 */
button: rounded-lg
card:   rounded-xl

/* 阴影 */
card:   shadow-sm
button: shadow-sm (可选)

/* 边框 */
border: border-slate-200
input:  border-slate-200

/* 间距 */
padding: p-4 (小), p-6 (中), p-8 (大)
margin:  mb-4, mb-6, space-x-2, space-y-3

/* 过渡 */
transition-colors
```

### 1.3 组件设计模式

| 模式 | 示例 | 使用场景 |
|------|------|----------|
| **三栏布局** | FolderTree + CaseList + Detail | 测试案例管理 |
| **Modal 覆盖** | TestCaseEditor, AIGeneratorModal | 编辑、创建操作 |
| **Table 列表** | ProjectTab, UserTab | 管理页面 |
| **卡片网格** | Dashboard, EnvCard | 数据展示 |
| **搜索+过滤** | `<Search />` + input + Select | 列表筛选 |

### 1.4 交互模式

```tsx
// 搜索框
<div className="relative">
  <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
  <input className="pl-9 pr-3 py-2 bg-slate-50 border rounded-lg" />
</div>

// 列表项选中
className={`cursor-pointer hover:bg-slate-50
  ${selected ? 'bg-blue-50/50 border-l-4 border-l-blue-500' : ''}`}

// 悬停操作
<button className="opacity-0 group-hover:opacity-100 p-1">
  <MoreHorizontal size={14} />
</button>

// 主按钮
<button className="px-4 py-2 bg-blue-600 text-white rounded-lg
  hover:bg-blue-700 transition-colors shadow-sm">
  Save
</button>

// 次要按钮
<button className="px-3 py-1.5 bg-purple-50 text-purple-700
  rounded-lg hover:bg-purple-100 transition-colors">
  Action
</button>
```

---

## 二、现有架构分析

### 2.1 状态管理

| 层级 | 实现 | 说明 |
|------|------|------|
| 全局状态 | `useAppState` Hook | 无 Redux/Zustand |
| 主题配置 | `ConfigContext` | 主题、语言切换 |
| 权限管理 | `usePermissions` Hook | RBAC 权限控制 |
| 组件状态 | `useState` | 本地状态 |

**当前数据流**:
```
Mock Data → useAppState (useState) → Props Drilling → Components
```

### 2.2 数据过滤

```typescript
// 多租户过滤
const activeProjectCases = cases.filter(c => c.projectId === activeProjectId);

// 本地搜索
const filteredCases = cases.filter(c =>
  c.title.toLowerCase().includes(searchTerm.toLowerCase())
);
```

### 2.3 组件通信

```
App
├─ Sidebar (全局导航)
│  ├─ Org/Project 选择器
│  └─ Environment 选择器
└─ Main Content
   ├─ TestCaseManager
   │  ├─ FolderTree
   │  ├─ CaseList
   │  └─ CaseDetail
   └─ AdminPortal
      ├─ UserTab
      ├─ RoleTab
      ├─ OrgTab
      └─ ProjectTab
```

---

## 三、适配策略

### 3.1 核心原则

| 原则 | 说明 |
|------|------|
| **渐进式改造** | 一个模块一个模块替换，保持系统可用 |
| **保持 UI 一致性** | 不改变现有样式和交互模式 |
| **复用现有组件** | 只修改数据来源，不重写组件 |
| **向后兼容** | 支持 Mock 模式和 API 模式切换 |

### 3.2 改造方案

**方案A - 最小侵入** (推荐):
```
保留 useAppState 结构 → 只替换数据加载逻辑
```

**方案B - 完全重构**:
```
引入状态库 (React Query/SWR) → 重写数据层
```

**选择**: 方案A（最小侵入，风险低）

---

## 四、详细实施计划

### Phase 1: 基础设施 (1-2天)

#### 1.1 创建数据层适配器

**目标**: 将 API 调用封装成与 useAppState 兼容的接口

**新增文件**:
```
/hooks/
  useApiState.ts       # API 版本的 useAppState
  useDataLoader.ts     # 数据加载 Hook

/services/api/
  (已创建)
```

**useApiState 结构**:
```typescript
export const useApiState = () => {
  const [cases, setCases] = useState<TestCase[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 从后端加载数据
  useEffect(() => {
    loadTestCases();
  }, [activeProjectId]);

  const loadTestCases = async () => {
    setLoading(true);
    try {
      const result = await testApi.list();
      setCases(result.items);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const addCase = async (c: TestCase) => {
    const created = await testApi.create(c);
    setCases(prev => [...prev, created]);
  };

  return {
    cases, addCase, updateCase: ...,
    loading, error
  };
};
```

#### 1.2 模式切换机制

**环境变量**:
```bash
# .env.local
VITE_USE_MOCK_DATA=false  # true=Mock, false=API
```

**切换逻辑**:
```typescript
// App.tsx
const useMock = import.meta.env.VITE_USE_MOCK_DATA === 'true';
const appState = useMock ? useAppState() : useApiState();
```

### Phase 2: 测试案例模块 (2-3天)

#### 2.1 替换 TestCaseManager

**修改文件**:
- `hooks/useAppState.ts` → 添加 API 加载逻辑
- `components/TestCaseManager.tsx` → 添加 loading/error 处理

**改动最小化**:
```typescript
// 修改前
const { cases, addCase, updateCase } = useAppState();

// 修改后
const {
  cases, addCase, updateCase,
  loading, error // 新增
} = useAppState();

// 组件内新增
{loading && <div className="flex items-center justify-center p-8">
  <Loader className="animate-spin text-blue-500" size={24} />
</div>}

{error && <div className="p-4 bg-red-50 text-red-600 rounded-lg">
  {error}
</div>}
```

#### 2.2 保持现有交互

| 功能 | 现状 | 改造方案 |
|------|------|----------|
| 搜索 | 本地过滤 | **保持不变** (数据量小，无需后端搜索) |
| 分页 | 无 | **不添加** (当前设计无分页) |
| 创建 | 本地添加 | 调用 `testApi.create()` |
| 更新 | 本地更新 | 调用 `testApi.update()` |
| 删除 | 本地删除 | 调用 `testApi.delete()` |

### Phase 3: 环境管理模块 (1-2天)

#### 3.1 EnvManager 适配

**当前结构**:
```typescript
interface Environment {
  id: string;
  variables: { key: string; value: string; isSecret: boolean }[];
}
```

**后端结构**:
```typescript
interface BackendEnvironment {
  envId: string;
  variables: Record<string, any>;
}
```

**适配方案**:
```typescript
// 使用已创建的 mappers.ts
import { environmentFromBackend, environmentToBackend } from '../services/api/mappers';

const loadEnvs = async () => {
  const backendEnvs = await environmentApi.list();
  setEnvs(backendEnvs.map(environmentFromBackend));
};

const createEnv = async (env: Environment) => {
  const request = environmentToBackend(env);
  const created = await environmentApi.create(request);
  setEnvs(prev => [...prev, environmentFromBackend(created)]);
};
```

#### 3.2 激活环境

**新增交互**:
```typescript
const activateEnv = async (envId: string) => {
  await environmentApi.activate(envId);
  // 刷新列表
  await loadEnvs();
  setActiveEnvId(envId);
};
```

**UI 更新**:
```tsx
// EnvCard 添加激活按钮
{!env.isActive && (
  <button onClick={() => onActivate(env.id)}
    className="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg">
    Activate
  </button>
)}
```

### Phase 4: 多租户管理 (2-3天)

#### 4.1 Tenant/Project API 集成

**修改文件**:
- `components/admin/OrgTab.tsx`
- `components/admin/ProjectTab.tsx`

**保持现有 UI**:
```tsx
// OrgTab.tsx - 只修改数据加载
useEffect(() => {
  loadTenants();
}, []);

const loadTenants = async () => {
  const tenants = await tenantApi.list();
  setOrgs(tenants);
};

const handleCreate = async (org: Organization) => {
  const created = await tenantApi.create(org);
  setOrgs(prev => [...prev, created]);
};
```

#### 4.2 Sidebar 组织/项目选择器

**当前**: Mock 数据
**改造**: 从后端加载

```typescript
// Sidebar.tsx
useEffect(() => {
  loadOrgs();
  loadProjects();
}, []);
```

### Phase 5: 工作流模块 (2-3天)

#### 5.1 ScriptLab 适配

**挑战**: 前端工作流结构 vs 后端 DAG 步骤

**前端结构** (嵌套树):
```typescript
interface WorkflowNode {
  id: string;
  type: NodeType;
  children?: WorkflowNode[];
  elseChildren?: WorkflowNode[];
}
```

**后端结构** (DAG):
```json
{
  "steps": {
    "step1": { "dependsOn": [] },
    "step2": { "dependsOn": ["step1"] }
  }
}
```

**适配方案**:

**选项1 - 双向转换** (推荐):
```typescript
// utils/workflowConverter.ts
function frontendToBackend(nodes: WorkflowNode[]): Record<string, BackendStep> {
  // 递归扁平化
}

function backendToFrontend(steps: Record<string, BackendStep>): WorkflowNode[] {
  // 重建树结构
}
```

**选项2 - 仅保存时转换**:
```
编辑: 前端格式 → 保存: 转换为后端格式 → 执行: 后端格式
```

#### 5.2 实时日志 (WebSocket)

**组件**: `TestRunner.tsx`

**集成 WebSocket**:
```typescript
import { workflowStreamClient } from '../services/api';

const handleExecute = async () => {
  const run = await workflowApi.execute(workflowId);

  // 连接 WebSocket
  workflowStreamClient.connect(run.runId, {
    onStepLog: (log) => {
      setLogs(prev => [...prev, log.message]);
    },
    onStepComplete: (payload) => {
      updateStepStatus(payload.stepId, payload.status);
    }
  });
};
```

---

## 五、组件复用策略

### 5.1 无需修改的组件

| 组件 | 说明 |
|------|------|
| `FolderTree.tsx` | 纯展示组件，接收 props |
| `CaseDetail.tsx` | 纯展示组件 |
| `EnvCard.tsx` | 卡片组件 |
| `Dashboard.tsx` | 图表组件 (数据源变化即可) |
| 所有 `layout/` 组件 | 布局组件 |

### 5.2 需小幅修改的组件

| 组件 | 修改内容 |
|------|----------|
| `CaseList.tsx` | 添加 loading 状态 |
| `EnvManager.tsx` | 添加激活 API 调用 |
| `ProjectTab.tsx` | 添加 API 调用 |
| `TestCaseManager.tsx` | 添加 error 处理 |

### 5.3 需转换逻辑的组件

| 组件 | 转换函数 |
|------|----------|
| `TestCaseEditor.tsx` | `testCaseToBackend()` |
| `ScriptLab.tsx` | `workflowFrontendToBackend()` |

---

## 六、UI 一致性保证

### 6.1 样式指南

**新增组件必须遵循**:

```tsx
// 加载状态
<div className="flex items-center justify-center p-8">
  <Loader className="animate-spin text-blue-500" size={24} />
  <span className="ml-2 text-slate-600">Loading...</span>
</div>

// 错误提示
<div className="p-4 bg-red-50 border border-red-200 rounded-lg">
  <p className="text-red-600 text-sm">{error}</p>
</div>

// 成功提示 (Toast)
<div className="fixed top-4 right-4 p-4 bg-green-50 border border-green-200
  rounded-lg shadow-lg animate-fade-in">
  <p className="text-green-700">Saved successfully!</p>
</div>

// 空状态
<div className="p-8 text-center text-slate-400 text-sm">
  <FileX className="mx-auto mb-2 text-slate-300" size={48} />
  <p>No data available</p>
</div>
```

### 6.2 按钮风格

```tsx
// 主按钮 (CTA)
<button className="px-4 py-2 bg-blue-600 text-white rounded-lg
  hover:bg-blue-700 transition-colors shadow-sm font-medium">
  Primary Action
</button>

// 次要按钮
<button className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg
  hover:bg-slate-200 transition-colors">
  Secondary
</button>

// 危险按钮
<button className="px-4 py-2 bg-red-600 text-white rounded-lg
  hover:bg-red-700 transition-colors">
  Delete
</button>

// 图标按钮
<button className="p-2 bg-purple-50 text-purple-600 rounded-lg
  hover:bg-purple-100 transition-colors">
  <Plus size={18} />
</button>
```

### 6.3 表单控件

```tsx
// Input
<input className="w-full px-3 py-2 border border-slate-200 rounded-lg
  text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />

// Select
<select className="border border-slate-200 rounded-lg px-3 py-2 text-sm
  focus:outline-none focus:ring-2 focus:ring-blue-500">
  <option>Option 1</option>
</select>

// Textarea
<textarea className="w-full px-3 py-2 border border-slate-200 rounded-lg
  text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
  rows={4} />
```

---

## 七、测试策略

### 7.1 集成测试优先级

| 模块 | 优先级 | 测试内容 |
|------|--------|----------|
| 测试案例 | P0 | CRUD 操作、搜索过滤 |
| 环境管理 | P0 | 切换环境、变量管理 |
| 多租户 | P1 | 组织/项目切换 |
| 工作流 | P1 | 创建、执行、实时日志 |
| Dashboard | P2 | 数据展示 |

### 7.2 用户验收测试

**测试场景**:
1. 创建测试案例 → 验证后端数据库
2. 切换环境 → 验证激活状态
3. 执行工作流 → 查看实时日志
4. 切换组织/项目 → 验证数据隔离

---

## 八、风险与缓解

### 8.1 高风险

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 工作流结构不兼容 | 无法编辑/保存 | 实现双向转换函数 + 充分测试 |
| WebSocket 连接失败 | 无实时日志 | 降级到轮询方案 |
| 字段映射错误 | 数据丢失 | 严格使用 mappers.ts |

### 8.2 中风险

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 性能问题 (大数据量) | 加载慢 | 添加分页 (后续) |
| 并发冲突 | 数据不一致 | 乐观锁 + 错误提示 |

---

## 九、时间规划

### 总计: 10-14 天

| 阶段 | 工作日 | 关键里程碑 |
|------|---------|------------|
| Phase 1 | 1-2天 | API 层完成、模式切换可用 |
| Phase 2 | 2-3天 | 测试案例CRUD完成 |
| Phase 3 | 1-2天 | 环境管理完成 |
| Phase 4 | 2-3天 | 多租户完成 |
| Phase 5 | 2-3天 | 工作流完成 |
| 测试 | 2天 | 集成测试、UAT |

### Milestone 验收标准

**M1 - 基础设施**:
- [ ] API 服务层可用
- [ ] Mock/API 模式切换正常
- [ ] 错误处理统一

**M2 - 核心功能**:
- [ ] 测试案例 CRUD 完整
- [ ] 环境管理可用
- [ ] 数据持久化到后端

**M3 - 高级功能**:
- [ ] 多租户隔离正常
- [ ] 工作流执行成功
- [ ] WebSocket 实时日志

**M4 - 生产就绪**:
- [ ] 所有集成测试通过
- [ ] UAT 验收通过
- [ ] 性能可接受

---

## 十、后续优化

### 阶段 2 (生产优化)

1. **性能优化**:
   - 添加分页 (后端已支持)
   - 虚拟滚动 (长列表)
   - 请求去抖/节流

2. **用户体验**:
   - Toast 通知系统
   - 离线提示
   - 自动保存草稿

3. **高级功能**:
   - 批量操作
   - 导入/导出
   - 快捷键支持

---

**更新时间**: 2025-11-23
**维护人**: Development Team
