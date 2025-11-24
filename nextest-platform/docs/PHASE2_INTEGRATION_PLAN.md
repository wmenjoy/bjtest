# Phase 2: 快速集成计划

## 执行概要
使用 sub-agent 并行完成剩余未集成的功能，并解决前后端数据模型冲突。

**预计时间**: 2-3小时
**执行策略**: 3个并行sub-agent任务 + 1个冲突解决任务

---

## 问题分析

### 1. 已完成但未集成的功能

| 功能 | 后端状态 | 前端状态 | 集成状态 |
|------|---------|---------|---------|
| ActionTemplate API | ✅ 完成（8个端点） | ❌ 未调用 | ❌ 需要集成 |
| TestCase统计API | ✅ 完成（3个端点） | ❌ 未调用 | ❌ 需要集成 |
| TestCaseManager组件 | N/A | ✅ 完成（5个组件） | ❌ 需要集成到主组件 |

### 2. 前后端数据模型冲突分析

#### 后端模型 (Go - internal/models/test_case.go)
```go
type TestCase struct {
    ID        uint   `json:"id"`
    TestID    string `json:"testId"`
    TenantID  string `json:"tenantId"`
    ProjectID string `json:"projectId"`
    GroupID   string `json:"groupId"`
    Name      string `json:"name"`
    Type      string `json:"type"`  // http, command, integration, etc.

    // Workflow integration
    WorkflowID  string `json:"workflowId,omitempty"`   // Mode 1
    WorkflowDef JSONB  `json:"workflowDef,omitempty"`  // Mode 2

    // New fields (migration 006)
    CoverageScore       int `json:"coverageScore"`
    StabilityScore      int `json:"stabilityScore"`
    OverallScore        int `json:"overallScore"`
    ExecutionCount      int `json:"executionCount"`
    SuccessRate         int `json:"successRate"`
    IsFlaky             bool `json:"isFlaky"`
    FlakyScore          int `json:"flakyScore"`
    OwnerID             string `json:"ownerId"`
}
```

#### 前端模型 (types.ts)
```typescript
interface TestCase {
    id: string;
    projectId: string;
    title: string;           // ❌ 后端是 name
    description: string;
    priority: Priority;
    status: Status;
    steps: TestStep[];       // ❌ 后端没有
    folderId: string;        // ❌ 后端是 groupId

    automationType?: 'MANUAL' | 'WORKFLOW';  // ❌ 后端是 type 字段
    linkedWorkflowId?: string;               // ✅ 对应后端 workflowId

    // ❌ 缺少后端新增的字段
    // coverageScore, stabilityScore, overallScore
    // executionCount, successRate, isFlaky, flakyScore
}
```

#### 冲突总结

| 字段 | 前端 | 后端 | 冲突类型 |
|------|------|------|---------|
| 名称字段 | `title` | `name` | 字段名不一致 |
| 分组字段 | `folderId` | `groupId` | 字段名不一致 |
| 测试步骤 | `steps[]` | 无 | 前端独有 |
| 类型字段 | `automationType` | `type` | 字段名和值不一致 |
| 统计字段 | 无 | `coverageScore`, `successRate`等 | 前端缺少 |

---

## 任务拆分

### Task 1: 前后端类型对齐 (优先级：最高)
**执行者**: 手动完成（不使用sub-agent，需要仔细分析）
**时间**: 30分钟

**子任务**:
1. 创建类型映射层 `services/api/mappers.ts`
2. 实现双向转换函数：
   - `mapBackendTestCaseToFrontend()`
   - `mapFrontendTestCaseToBackend()`
3. 扩展前端 TestCase 接口添加缺失字段
4. 更新 API 调用层使用映射函数

**验证**:
- TypeScript 编译无错误
- 前端显示后端数据正确

---

### Task 2: ActionLibrary API 集成 (优先级：高)
**执行者**: Sub-agent (bmad-dev)
**时间**: 45分钟

**目标**: 连接ActionLibrary组件到后端ActionTemplate API

**详细要求**:

#### 2.1 创建 API Service
**文件**: `services/api/actionTemplateApi.ts`

```typescript
import { API_BASE_URL } from './config';

export interface ActionTemplate {
    id: number;
    templateId: string;
    tenantId: string;
    name: string;
    description: string;
    category: string;
    type: string;
    configTemplate: Record<string, any>;
    parameters: any[];
    outputs: any[];
    scope: 'system' | 'platform' | 'tenant';
    isPublic: boolean;
    usageCount: number;
}

export interface ActionTemplateFilter {
    category?: string;
    type?: string;
    scope?: string;
    search?: string;
    page?: number;
    pageSize?: number;
}

export const actionTemplateApi = {
    // GET /api/action-templates/accessible
    getAccessibleTemplates: async (filter: ActionTemplateFilter = {}) => {
        const params = new URLSearchParams();
        if (filter.category) params.append('category', filter.category);
        if (filter.type) params.append('type', filter.type);
        if (filter.search) params.append('search', filter.search);
        params.append('page', String(filter.page || 1));
        params.append('pageSize', String(filter.pageSize || 20));

        const response = await fetch(`${API_BASE_URL}/action-templates/accessible?${params}`);
        if (!response.ok) throw new Error('Failed to fetch templates');
        return response.json();
    },

    // GET /api/action-templates/:id
    getTemplate: async (templateId: string) => {
        const response = await fetch(`${API_BASE_URL}/action-templates/${templateId}`);
        if (!response.ok) throw new Error('Failed to fetch template');
        return response.json();
    },

    // POST /api/action-templates
    createTemplate: async (template: Partial<ActionTemplate>) => {
        const response = await fetch(`${API_BASE_URL}/action-templates`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(template)
        });
        if (!response.ok) throw new Error('Failed to create template');
        return response.json();
    },

    // PUT /api/action-templates/:id
    updateTemplate: async (templateId: string, template: Partial<ActionTemplate>) => {
        const response = await fetch(`${API_BASE_URL}/action-templates/${templateId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(template)
        });
        if (!response.ok) throw new Error('Failed to update template');
        return response.json();
    },

    // POST /api/action-templates/:templateId/copy
    copyToTenant: async (templateId: string, tenantId: string, newName: string) => {
        const response = await fetch(`${API_BASE_URL}/action-templates/${templateId}/copy`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tenantId, name: newName })
        });
        if (!response.ok) throw new Error('Failed to copy template');
        return response.json();
    },

    // POST /api/action-templates/:templateId/usage
    recordUsage: async (templateId: string) => {
        const response = await fetch(`${API_BASE_URL}/action-templates/${templateId}/usage`, {
            method: 'POST'
        });
        if (!response.ok) throw new Error('Failed to record usage');
        return response.json();
    }
};
```

#### 2.2 修改 ActionLibrary.tsx
**文件**: `components/ActionLibrary.tsx`

**修改点**:
1. 导入 `actionTemplateApi` 和类型
2. 使用 `useState` 和 `useEffect` 加载真实数据
3. 替换硬编码的 mock 数据
4. 添加加载状态和错误处理
5. 实现分类筛选功能
6. 实现搜索功能

**示例代码结构**:
```typescript
import { actionTemplateApi, ActionTemplate } from '../services/api/actionTemplateApi';

export const ActionLibrary: React.FC = () => {
    const [templates, setTemplates] = useState<ActionTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<ActionTemplateFilter>({
        category: '',
        search: ''
    });

    useEffect(() => {
        loadTemplates();
    }, [filter]);

    const loadTemplates = async () => {
        try {
            setLoading(true);
            const result = await actionTemplateApi.getAccessibleTemplates(filter);
            setTemplates(result.data || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // ... 渲染逻辑
};
```

**验证步骤**:
1. 编译成功无 TypeScript 错误
2. 页面加载显示10个系统模板（从数据库种子数据）
3. 分类筛选正常工作
4. 搜索功能正常工作
5. 浏览器 DevTools 显示 API 调用成功（200状态）

---

### Task 3: TestCaseManager API 集成 (优先级：高)
**执行者**: Sub-agent (bmad-dev)
**时间**: 45分钟

**目标**: 集成 TestCaseManager 组件并连接统计API

#### 3.1 创建 API Service Extension
**文件**: `services/api/testCaseApi.ts`

```typescript
export interface TestStatistics {
    totalTests: number;
    myTests: number;
    p0Tests: number;
    flakyTests: number;
    longRunningTests: number;
    notRunRecently: number;
    tagCloud: Record<string, number>;
}

export interface AdvancedSearchFilter {
    keywords?: string;
    priorities?: string[];  // ["P0", "P1"]
    statuses?: string[];    // ["active", "inactive"]
    tags?: string[];
    minSuccessRate?: number;
    maxSuccessRate?: number;
    isFlaky?: boolean;
    ownerId?: string;
    page?: number;
    pageSize?: number;
}

export const testCaseApi = {
    // GET /api/tests/advanced-search
    advancedSearch: async (filter: AdvancedSearchFilter) => {
        const params = new URLSearchParams();
        if (filter.keywords) params.append('keywords', filter.keywords);
        if (filter.priorities) params.append('priorities', filter.priorities.join(','));
        if (filter.statuses) params.append('statuses', filter.statuses.join(','));
        if (filter.tags) params.append('tags', filter.tags.join(','));
        if (filter.minSuccessRate) params.append('minSuccessRate', String(filter.minSuccessRate));
        if (filter.maxSuccessRate) params.append('maxSuccessRate', String(filter.maxSuccessRate));
        if (filter.isFlaky !== undefined) params.append('isFlaky', String(filter.isFlaky));
        if (filter.ownerId) params.append('ownerId', filter.ownerId);
        params.append('page', String(filter.page || 1));
        params.append('pageSize', String(filter.pageSize || 20));

        const response = await fetch(`${API_BASE_URL}/tests/advanced-search?${params}`);
        if (!response.ok) throw new Error('Failed to search test cases');
        return response.json();
    },

    // GET /api/tests/statistics
    getStatistics: async (currentUserId: string) => {
        const response = await fetch(`${API_BASE_URL}/tests/statistics?userId=${currentUserId}`);
        if (!response.ok) throw new Error('Failed to fetch statistics');
        return response.json();
    },

    // GET /api/tests/flaky
    getFlakyTests: async (limit: number = 10) => {
        const response = await fetch(`${API_BASE_URL}/tests/flaky?limit=${limit}`);
        if (!response.ok) throw new Error('Failed to fetch flaky tests');
        return response.json();
    }
};
```

#### 3.2 修改 TestCaseManager.tsx
**文件**: `components/TestCaseManager.tsx`

**集成步骤**:
1. 导入新创建的组件：
   ```typescript
   import { QuickFilter } from './testcase/QuickFilter';
   import { TagChip } from './testcase/TagChip';
   import { AdvancedFilterPanel } from './testcase/AdvancedFilterPanel';
   import { ValueScore } from './testcase/ValueScore';
   import { StatMini } from './testcase/StatMini';
   ```

2. 添加统计数据状态：
   ```typescript
   const [statistics, setStatistics] = useState<TestStatistics | null>(null);
   ```

3. 在左侧面板添加 QuickFilter 组件（在 Explorer 下方）：
   ```typescript
   <div className="mt-4 space-y-1 px-2">
       <QuickFilter
           icon="📋"
           label="All Tests"
           count={statistics?.totalTests || 0}
           onClick={() => handleQuickFilter('all')}
       />
       <QuickFilter
           icon="👤"
           label="My Tests"
           count={statistics?.myTests || 0}
           onClick={() => handleQuickFilter('my')}
       />
       <QuickFilter
           icon="🔥"
           label="P0 Tests"
           count={statistics?.p0Tests || 0}
           badge="warning"
           onClick={() => handleQuickFilter('p0')}
       />
       <QuickFilter
           icon="⚠️"
           label="Flaky Tests"
           count={statistics?.flakyTests || 0}
           badge="warning"
           onClick={() => handleQuickFilter('flaky')}
       />
   </div>
   ```

4. 在中间面板添加 AdvancedFilterPanel（搜索框下方）

5. 在右侧详情面板添加 ValueScore 和 StatMini（测试用例详情中）

**验证步骤**:
1. 左侧显示快速筛选器（带正确计数）
2. 点击筛选器触发API调用
3. 高级筛选面板正常工作
4. 测试用例详情显示价值评分

---

### Task 4: 数据映射层实现 (优先级：最高，前置任务)
**执行者**: 手动完成
**时间**: 30分钟

**文件**: `services/api/mappers.ts`

```typescript
import { TestCase as FrontendTestCase } from '../../types';

// 后端TestCase类型（基于Go模型）
export interface BackendTestCase {
    id: number;
    testId: string;
    tenantId: string;
    projectId: string;
    groupId: string;
    name: string;
    type: string;
    priority: string;
    status: string;
    objective: string;
    timeout: number;

    // Workflow integration
    workflowId?: string;
    workflowDef?: any;

    // Statistics (新增字段)
    coverageScore: number;
    stabilityScore: number;
    efficiencyScore: number;
    maintainabilityScore: number;
    overallScore: number;
    executionCount: number;
    successCount: number;
    failureCount: number;
    avgDuration: number;
    successRate: number;
    lastRunAt?: string;

    // Flaky detection
    isFlaky: boolean;
    flakyScore: number;
    consecutiveFailures: number;

    // Ownership
    ownerId: string;
    lastModifiedBy: string;

    createdAt: string;
    updatedAt: string;
}

export function mapBackendTestCaseToFrontend(backend: BackendTestCase): FrontendTestCase {
    return {
        id: backend.testId,
        projectId: backend.projectId,
        title: backend.name,
        description: backend.objective || '',
        priority: backend.priority as any,
        status: backend.status as any,
        steps: [], // 前端独有，暂时为空
        tags: [], // 需要从其他字段解析
        folderId: backend.groupId,
        lastUpdated: backend.updatedAt,

        automationType: backend.type === 'workflow' ? 'WORKFLOW' : 'MANUAL',
        linkedWorkflowId: backend.workflowId,

        // 新增统计字段
        coverageScore: backend.coverageScore,
        stabilityScore: backend.stabilityScore,
        overallScore: backend.overallScore,
        executionCount: backend.executionCount,
        successRate: backend.successRate,
        isFlaky: backend.isFlaky,
        flakyScore: backend.flakyScore,
        ownerId: backend.ownerId
    };
}

export function mapFrontendTestCaseToBackend(frontend: FrontendTestCase): Partial<BackendTestCase> {
    return {
        testId: frontend.id,
        projectId: frontend.projectId,
        groupId: frontend.folderId,
        name: frontend.title,
        objective: frontend.description,
        priority: frontend.priority,
        status: frontend.status,
        type: frontend.automationType === 'WORKFLOW' ? 'workflow' : 'manual',
        workflowId: frontend.linkedWorkflowId,
        ownerId: frontend.ownerId
    };
}
```

**修改前端 TestCase 接口**:
**文件**: `types.ts`

```typescript
export interface TestCase {
    // ... 现有字段 ...

    // 新增统计字段（从后端同步）
    coverageScore?: number;
    stabilityScore?: number;
    efficiencyScore?: number;
    maintainabilityScore?: number;
    overallScore?: number;
    executionCount?: number;
    successRate?: number;
    lastRunAt?: string;

    // Flaky detection
    isFlaky?: boolean;
    flakyScore?: number;

    // Ownership
    ownerId?: string;
}
```

---

## 并行执行策略

### 阶段1: 准备工作（串行）
1. **Task 4: 数据映射层** (30分钟) - 手动完成
   - 这是其他任务的前置依赖

### 阶段2: 并行开发（3个sub-agent）
同时启动以下3个任务：

1. **Task 2: ActionLibrary API集成** (45分钟)
   - Sub-agent 1: bmad-dev

2. **Task 3: TestCaseManager API集成** (45分钟)
   - Sub-agent 2: bmad-dev

3. **Task 5: Dashboard数据源切换** (30分钟)
   - Sub-agent 3: bmad-dev
   - 将 Dashboard 的 mock 数据替换为真实API调用

### 阶段3: 集成测试（串行）
1. 构建前端项目
2. 启动后端服务
3. 端到端测试所有功能
4. 修复发现的问题

---

## 验收标准

### 功能验收
- [ ] ActionLibrary 显示10个系统模板（从数据库）
- [ ] ActionLibrary 分类筛选正常工作
- [ ] ActionLibrary 搜索功能正常工作
- [ ] TestCaseManager 左侧显示快速筛选器（带正确计数）
- [ ] TestCaseManager 高级筛选面板正常工作
- [ ] TestCaseManager 测试详情显示价值评分
- [ ] Dashboard 显示真实的统计数据（如果有测试数据）

### 技术验收
- [ ] 前端 TypeScript 编译无错误
- [ ] 所有API调用返回200状态码
- [ ] 浏览器控制台无JavaScript错误
- [ ] 网络请求正确调用新增的11个API端点
- [ ] 数据映射正确（前后端字段对应）

### 性能验收
- [ ] API响应时间 < 500ms
- [ ] 页面加载时间 < 3s
- [ ] 无内存泄漏

---

## 风险管理

### 风险1: API响应格式不匹配
**缓解措施**:
- 先测试单个API端点
- 使用浏览器DevTools检查响应
- 必要时调整后端响应格式

### 风险2: 前端类型冲突
**缓解措施**:
- 优先完成数据映射层
- 使用TypeScript严格模式检查
- 逐步迁移而非一次性替换

### 风险3: 并行开发冲突
**缓解措施**:
- 每个sub-agent操作不同的文件
- ActionLibrary、TestCaseManager、Dashboard 互不依赖
- 使用 git 分支隔离（可选）

---

## 时间估算

| 任务 | 预计时间 | 执行方式 |
|------|---------|---------|
| Task 4: 数据映射层 | 30分钟 | 手动 |
| Task 2: ActionLibrary集成 | 45分钟 | Sub-agent |
| Task 3: TestCaseManager集成 | 45分钟 | Sub-agent |
| Task 5: Dashboard数据切换 | 30分钟 | Sub-agent |
| 集成测试与修复 | 30分钟 | 手动 |
| **总计** | **3小时** | |

由于Task 2/3/5并行执行，实际墙上时钟时间约为：
**30分钟（准备） + 45分钟（并行开发） + 30分钟（测试） = 1小时45分钟**

---

## 执行检查清单

### 开始前
- [ ] 确认前后端服务都在运行
- [ ] 确认数据库有测试数据
- [ ] 备份当前代码（git commit）

### Task 4完成后
- [ ] `mappers.ts` 文件创建
- [ ] 前端 TestCase 接口已扩展
- [ ] TypeScript 编译通过

### 启动并行任务前
- [ ] 3个sub-agent任务prompt已准备
- [ ] 每个任务的文件路径已明确
- [ ] 验收标准已明确

### 所有任务完成后
- [ ] 运行 `npm run build` 成功
- [ ] 启动 dev server 无错误
- [ ] 浏览器打开所有页面验证

---

## 后续优化（Phase 3）

1. **TestCase 完整数据映射**
   - 实现 steps 字段的序列化/反序列化
   - 处理 tags 字段的存储和解析

2. **ActionLibrary 完整CRUD**
   - 添加创建自定义模板UI
   - 添加编辑模板UI
   - 添加删除模板确认

3. **实时数据刷新**
   - 使用 WebSocket 实时更新统计数据
   - 添加自动刷新机制

4. **性能优化**
   - 添加请求缓存
   - 实现虚拟滚动（长列表）
   - 懒加载组件
