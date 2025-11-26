# 前端整合计划

**创建日期**: 2025-11-23
**目标**: NextTestPlatformUI 与 nextest-platform 后端集成

---

## 一、现状分析

### 1.1 前端项目概述

| 项目 | 值 |
|------|-----|
| 位置 | `/NextTestPlatformUI` |
| 框架 | React 19.2 + TypeScript 5.8 |
| 构建工具 | Vite 6.2 (端口 8081) |
| 代码量 | ~9,000 行 / 70+ 文件 |
| 组件数 | 53 个 React 组件 |
| 状态 | **完整 UI，无后端集成** |

### 1.2 前端组件分布

| 分类 | 文件数 | 功能 |
|------|--------|------|
| root | 12 | App, Auth, Manager, Dashboard |
| admin/ | 4 | User, Role, Project, Organization 管理 |
| auth/ | 2 | 登录注册表单 |
| config/ | 4 | 环境、安全、通用设置 |
| dashboard/ | 3 | 图表、统计、报告 |
| database/ | 3 | Schema 设计器 |
| history/ | 2 | 测试运行历史 |
| layout/ | 1 | 导航侧边栏 |
| library/ | 5 | Action 编辑器、测试台 |
| runner/ | 3 | 测试执行、AI Copilot |
| scriptlab/ | 8 | 可视化工作流编辑器 |
| testcase/ | 6 | 用例编辑、列表、AI 生成 |

### 1.3 后端 API 概述

| 模块 | 端点数 | 状态 |
|------|--------|------|
| 测试案例 API | 7 | ✅ 已实现 |
| 测试分组 API | 4 | ✅ 已实现 |
| 工作流 API | 11 | ✅ 已实现 |
| 环境管理 API | 11 | ✅ 已实现 |
| 测试执行 API | 2 | ✅ 已实现 |
| 测试结果 API | 4 | ✅ 已实现 |
| WebSocket API | 1 | ✅ 已实现 |
| **Tenant API** | 11 | ❌ 未测试 |
| **Project API** | 11 | ❌ 未测试 |

---

## 二、差距分析

### 2.1 数据类型映射

| 前端类型 | 后端 API | 映射状态 | 差异说明 |
|----------|----------|----------|----------|
| `TestCase` | `/api/tests` | ⚠️ 部分 | 字段命名不同 |
| `TestFolder` | `/api/groups` | ⚠️ 部分 | 前端叫 Folder，后端叫 Group |
| `TestRun` | `/api/results`, `/api/runs` | ⚠️ 部分 | 结构需调整 |
| `Script` | - | ❌ 无 | 后端不支持脚本管理 |
| `Workflow` | `/api/workflows` | ⚠️ 部分 | 节点结构差异大 |
| `Environment` | `/api/environments` | ✅ 匹配 | 结构相似 |
| `User` | - | ❌ 无 | 后端无用户管理 |
| `Role` | - | ❌ 无 | 后端无角色管理 |
| `Organization` | `/api/tenants` | ❓ 待验证 | 后端有但未测试 |
| `Project` | `/api/projects` | ❓ 待验证 | 后端有但未测试 |

### 2.2 关键缺失

**前端需要添加:**
```
1. API 服务层 (services/api.ts)
2. HTTP 客户端配置 (axios/fetch)
3. WebSocket 客户端实现
4. 认证 Token 管理
5. 网络错误处理
6. 环境配置文件 (.env.local)
```

**后端需要验证:**
```
1. Tenant API (11 个端点)
2. Project API (11 个端点)
3. 用户认证 API (规划中)
4. RBAC 权限 API (规划中)
```

---

## 三、整合计划

### Phase 1: 基础设施搭建 (1-2天)

#### 1.1 创建 API 服务层

```typescript
// services/api.ts
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8090/api';

export const apiClient = {
  get: async <T>(path: string): Promise<T> => {
    const response = await fetch(`${API_BASE_URL}${path}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  },

  post: async <T>(path: string, data: unknown): Promise<T> => {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  },

  put: async <T>(path: string, data: unknown): Promise<T> => {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  },

  delete: async (path: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
  },
};
```

#### 1.2 创建环境配置

```bash
# .env.local
VITE_API_URL=http://localhost:8090/api
VITE_WS_URL=ws://localhost:8090/api
GEMINI_API_KEY=your_key_here
```

#### 1.3 创建 WebSocket 客户端

```typescript
// services/websocket.ts
export class WorkflowStreamClient {
  private ws: WebSocket | null = null;

  connect(runId: string, onMessage: (msg: any) => void) {
    const WS_BASE = import.meta.env.VITE_WS_URL || 'ws://localhost:8090/api';
    this.ws = new WebSocket(`${WS_BASE}/workflows/runs/${runId}/stream`);

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      onMessage(data);
    };

    this.ws.onerror = (error) => console.error('WebSocket error:', error);
  }

  disconnect() {
    this.ws?.close();
    this.ws = null;
  }
}
```

### Phase 2: 核心 API 集成 (3-5天)

#### 2.1 测试案例 API

| 前端操作 | 后端端点 | 优先级 |
|----------|----------|--------|
| 获取列表 | `GET /tests` | P0 |
| 获取详情 | `GET /tests/:id` | P0 |
| 创建用例 | `POST /tests` | P0 |
| 更新用例 | `PUT /tests/:id` | P0 |
| 删除用例 | `DELETE /tests/:id` | P1 |
| 搜索用例 | `GET /tests/search?q=` | P1 |
| 执行测试 | `POST /tests/:id/execute` | P0 |

**字段映射:**

```typescript
// 前端 TestCase → 后端 API
interface BackendTestCase {
  testId: string;          // 前端 id
  groupId: string;         // 前端 folderId
  name: string;            // 前端 title
  type: 'http' | 'command' | 'workflow';
  priority: 'P0' | 'P1' | 'P2';  // 前端 Priority enum
  status: 'active' | 'inactive'; // 前端 Status enum
  http?: HttpConfig;
  workflowId?: string;
  workflowDef?: WorkflowDefinition;
  tags?: string[];
}

// 转换函数
function toBackendTestCase(tc: TestCase): BackendTestCase {
  return {
    testId: tc.id,
    groupId: tc.folderId,
    name: tc.title,
    type: tc.automationType === 'WORKFLOW' ? 'workflow' : 'http',
    priority: priorityToP(tc.priority),
    status: tc.status === 'Active' ? 'active' : 'inactive',
    tags: tc.tags,
  };
}
```

#### 2.2 测试分组 API

| 前端操作 | 后端端点 |
|----------|----------|
| 获取树 | `GET /groups/tree` |
| 创建分组 | `POST /groups` |
| 更新分组 | `PUT /groups/:id` |
| 删除分组 | `DELETE /groups/:id` |

**字段映射:**

```typescript
// 前端 TestFolder → 后端 TestGroup
interface BackendTestGroup {
  groupId: string;     // 前端 id
  name: string;
  parentId?: string;   // 前端 parentId ('root' → null)
  description?: string;
}
```

#### 2.3 环境管理 API

| 前端操作 | 后端端点 |
|----------|----------|
| 列表 | `GET /environments` |
| 详情 | `GET /environments/:id` |
| 创建 | `POST /environments` |
| 更新 | `PUT /environments/:id` |
| 删除 | `DELETE /environments/:id` |
| 激活 | `POST /environments/:id/activate` |
| 获取激活 | `GET /environments/active` |

**字段映射:**

```typescript
// 前端 Environment → 后端 API
interface BackendEnvironment {
  envId: string;           // 前端 id
  name: string;
  description?: string;
  isActive: boolean;
  variables: Record<string, any>;  // 前端 EnvironmentVariable[]
}

// 转换函数
function toBackendEnv(env: Environment): BackendEnvironment {
  const variables: Record<string, any> = {};
  env.variables.forEach(v => {
    variables[v.key] = v.value;
  });
  return {
    envId: env.id,
    name: env.name,
    variables,
  };
}
```

#### 2.4 工作流 API

| 前端操作 | 后端端点 |
|----------|----------|
| 列表 | `GET /workflows` |
| 详情 | `GET /workflows/:id` |
| 创建 | `POST /workflows` |
| 执行 | `POST /workflows/:id/execute` |
| 执行记录 | `GET /workflows/runs/:runId` |
| 实时日志 | `WS /workflows/runs/:runId/stream` |

**关键差异 - 工作流结构:**

前端使用可视化节点树:
```typescript
interface Workflow {
  nodes: WorkflowNode[];  // 嵌套树结构
}
```

后端使用 DAG 步骤图:
```json
{
  "definition": {
    "steps": {
      "step1": { "id": "step1", "dependsOn": [] },
      "step2": { "id": "step2", "dependsOn": ["step1"] }
    }
  }
}
```

**需要转换函数:**
```typescript
// 前端节点树 → 后端 DAG 步骤
function nodesToSteps(nodes: WorkflowNode[]): Record<string, BackendStep> {
  const steps: Record<string, BackendStep> = {};
  const flatten = (node: WorkflowNode, parentId?: string) => {
    const step: BackendStep = {
      id: node.id,
      name: node.name,
      type: nodeTypeToStepType(node.type),
      dependsOn: parentId ? [parentId] : [],
      config: node.config,
    };
    steps[node.id] = step;
    node.children?.forEach(child => flatten(child, node.id));
  };
  nodes.forEach(n => flatten(n));
  return steps;
}
```

### Phase 3: 多租户集成 (2-3天)

#### 3.1 验证后端 Tenant/Project API

需先确认后端 API 可用性:

```bash
# 测试 Tenant API
curl -X GET http://localhost:8090/api/tenants
curl -X POST http://localhost:8090/api/tenants -d '{"name":"Test Org"}'

# 测试 Project API
curl -X GET http://localhost:8090/api/projects
curl -X POST http://localhost:8090/api/projects -d '{"name":"Test Project","tenantId":"xxx"}'
```

#### 3.2 前端集成

```typescript
// services/tenant.ts
export const tenantApi = {
  list: () => apiClient.get<Organization[]>('/tenants'),
  create: (data: Partial<Organization>) => apiClient.post('/tenants', data),
  // ...
};

// services/project.ts
export const projectApi = {
  list: (tenantId: string) => apiClient.get<Project[]>(`/tenants/${tenantId}/projects`),
  create: (data: Partial<Project>) => apiClient.post('/projects', data),
  // ...
};
```

### Phase 4: 替换 Mock 数据 (2-3天)

#### 4.1 重构 useAppState Hook

```typescript
// hooks/useAppState.ts - 重构版
import { useState, useEffect } from 'react';
import { testApi, groupApi, envApi, workflowApi } from '../services/api';

export const useAppState = () => {
  const [cases, setCases] = useState<TestCase[]>([]);
  const [folders, setFolders] = useState<TestFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 初始加载
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [casesData, foldersData] = await Promise.all([
          testApi.list(),
          groupApi.tree(),
        ]);
        setCases(casesData.map(fromBackendTestCase));
        setFolders(foldersData.map(fromBackendGroup));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // 操作 - 调用 API 而非本地状态
  const addCase = async (tc: TestCase) => {
    const result = await testApi.create(toBackendTestCase(tc));
    setCases(prev => [...prev, fromBackendTestCase(result)]);
  };

  // ...其他操作
};
```

#### 4.2 添加错误处理

```typescript
// components/ErrorBoundary.tsx
export const ErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [error, setError] = useState<Error | null>(null);

  if (error) {
    return (
      <div className="error-page">
        <h2>出错了</h2>
        <p>{error.message}</p>
        <button onClick={() => setError(null)}>重试</button>
      </div>
    );
  }

  return <>{children}</>;
};
```

---

## 四、优先级排序

### P0 - 必须完成 (核心功能)

| 任务 | 预估时间 | 说明 |
|------|----------|------|
| API 客户端基础设施 | 0.5天 | fetch/axios 封装 |
| 测试案例 CRUD | 1天 | 列表、创建、编辑、删除 |
| 测试分组 CRUD | 0.5天 | 树形结构 |
| 测试执行 | 1天 | 执行 + 结果展示 |
| 环境管理 | 0.5天 | 列表、切换、变量 |

### P1 - 应该完成 (增强体验)

| 任务 | 预估时间 |
|------|----------|
| 工作流执行 | 1天 |
| WebSocket 实时日志 | 1天 |
| 搜索功能 | 0.5天 |
| 错误处理优化 | 0.5天 |

### P2 - 可以完成 (完整功能)

| 任务 | 预估时间 |
|------|----------|
| 多租户集成 | 2天 |
| 用户认证 | 2天 |
| 权限控制 | 1天 |
| 脚本管理 | 2天 |

---

## 五、技术风险

### 5.1 高风险

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 工作流结构差异大 | 可视化编辑器无法使用 | 实现双向转换函数 |
| Tenant/Project API 未验证 | 多租户功能不可用 | 优先进行 API 测试 |
| 无用户认证 | 生产环境不安全 | 规划认证方案 |

### 5.2 中风险

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 字段命名不一致 | 前后端数据不匹配 | 统一使用转换函数 |
| Script 无后端 | 脚本功能不可用 | 暂时保留本地存储 |
| CORS 配置 | 开发环境请求失败 | 后端配置 CORS |

---

## 六、验收标准

### Phase 1 验收

- [ ] 可以从后端获取测试案例列表
- [ ] 可以创建新的测试案例
- [ ] 可以执行测试并查看结果
- [ ] 环境变量可以切换

### Phase 2 验收

- [ ] 工作流可以创建和执行
- [ ] 实时日志正常显示
- [ ] 搜索功能正常工作

### Phase 3 验收

- [ ] 可以创建和切换租户
- [ ] 项目隔离正常工作
- [ ] 用户登录功能正常

---

## 七、附录

### 后端 API 基础 URL

```
开发环境: http://localhost:8090/api
WebSocket: ws://localhost:8090/api
```

### 相关文档

- [API 文档](../../1-specs/api/v2-documentation.md)
- [数据库设计](../../1-specs/database/schema.md)
- [WebSocket 架构](../WEBSOCKET_ARCHITECTURE.md)
- [项目状态](../../4-planning/active/status-2025-11-23.md)

---

**更新时间**: 2025-11-23
**负责人**: Development Team
