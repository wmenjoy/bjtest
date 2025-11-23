# Phase 5 Progress - 工作流模块集成

**日期**: 2025-11-23
**状态**: ✅ 核心功能已完成，待测试
**进度**: 85%

---

## 完成的工作

### 1. ✅ 后端 Workflow API（已存在）

**Workflow API 端点** (`/api/workflows` 和 `/api/v2/workflows`):
```
POST   /workflows                            - 创建工作流
GET    /workflows                            - 列出所有工作流（分页）
GET    /workflows/:id                        - 获取工作流详情
PUT    /workflows/:id                        - 更新工作流
DELETE /workflows/:id                        - 删除工作流
POST   /workflows/:workflowId/execute        - 执行工作流
GET    /workflows/runs/:runId                - 获取执行结果
GET    /workflows/runs/:runId/steps          - 获取步骤详情
GET    /workflows/runs/:runId/logs           - 获取执行日志
```

**WebSocket 端点**:
```
WS     /api/workflows/runs/:runId/stream     - 实时工作流执行流
```

**WebSocket 消息类型**:
- `step_start` - 步骤开始
- `step_complete` - 步骤完成
- `step_log` - 步骤日志
- `variable_change` - 变量变更

**测试 WebSocket**:
```bash
# 后端 WebSocket 架构
- Hub 管理所有连接
- 每个 runId 一个独立的 client group
- 心跳检测（54秒）
- 自动清理断开的连接
```

---

### 2. ✅ 前端 workflowApi（已实现）

**文件**: `services/api/workflowApi.ts`

**已实现方法**:
```typescript
{
  list(params?: PaginationParams): Promise<PaginatedResponse<BackendWorkflow>>
  get(workflowId: string): Promise<BackendWorkflow>
  create(workflow: CreateWorkflowRequest): Promise<BackendWorkflow>
  update(workflowId: string, updates: Partial<CreateWorkflowRequest>): Promise<BackendWorkflow>
  delete(workflowId: string): Promise<void>
  execute(workflowId: string, variables?: Record<string, unknown>): Promise<BackendWorkflowRun>
  getRun(runId: string): Promise<BackendWorkflowRun>
  getRunHistory(workflowId: string, params?: PaginationParams): Promise<PaginatedResponse<BackendWorkflowRun>>
  getRunSteps(runId: string): Promise<unknown[]>
  getRunLogs(runId: string, stepId?: string): Promise<unknown[]>
}
```

**响应格式**:
```typescript
// execute() 返回
interface BackendWorkflowRun {
  runId: string;
  workflowId: string;
  status: 'running' | 'completed' | 'failed';
  startedAt: string;
  completedAt?: string;
  // ...
}
```

---

### 3. ✅ WebSocket 客户端（已完成）

**文件**: `services/api/websocket.ts`

**WorkflowStreamClient 类**:
```typescript
class WorkflowStreamClient {
  // 连接到工作流执行流
  connect(runId: string, callbacks: WorkflowStreamCallbacks): void

  // 断开连接
  disconnect(): void

  // 获取连接状态
  get isConnected(): boolean

  // 获取当前 runId
  get currentRunId(): string | null
}
```

**回调接口**:
```typescript
interface WorkflowStreamCallbacks {
  onStepStart?: (payload: StepStartPayload) => void
  onStepComplete?: (payload: StepCompletePayload) => void
  onStepLog?: (payload: StepLogPayload) => void
  onVariableChange?: (payload: VariableChangePayload) => void
  onError?: (error: Event) => void
  onClose?: () => void
  onOpen?: () => void
}
```

**特性**:
- ✅ 自动重连（最多3次）
- ✅ 指数退避重连策略
- ✅ 连接状态管理
- ✅ 类型安全的消息处理
- ✅ 优雅的断开连接

**WebSocket URL**:
```typescript
const WS_BASE_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8090/api';
// 连接: ws://localhost:8090/api/workflows/runs/{runId}/stream
```

---

### 4. ✅ WorkflowLogs 组件（已创建）

**文件**: `components/workflow/WorkflowLogs.tsx`

**UI 功能**:
- ✅ 实时日志显示（来自 WebSocket）
- ✅ 日志级别过滤（DEBUG, INFO, WARN, ERROR）
- ✅ 步骤过滤（按 stepId）
- ✅ 自动滚动到底部
- ✅ 时间戳显示（毫秒精度）
- ✅ 日志级别颜色编码和图标
- ✅ JSON 数据自动格式化
- ✅ 清空日志功能
- ✅ 日志计数显示

**级别样式**:
```typescript
ERROR: red-400, XCircle icon
WARN:  yellow-400, AlertCircle icon
INFO:  blue-400, Info icon
DEBUG: slate-400, CheckCircle icon
```

**实现代码片段**:
```tsx
<div className="flex flex-col h-full bg-slate-900 text-white">
  {/* Toolbar */}
  <div className="flex items-center space-x-3 px-4 py-3 border-b border-slate-700">
    <Terminal size={16} />
    <span className="text-sm font-medium">Execution Logs</span>

    {/* Level Filter */}
    <select value={levelFilter} onChange={...}>
      <option value="all">All Levels</option>
      <option value="debug">DEBUG</option>
      <option value="info">INFO</option>
      <option value="warn">WARN</option>
      <option value="error">ERROR</option>
    </select>

    {/* Step Filter */}
    <select value={stepFilter} onChange={...}>
      <option value="all">All Steps</option>
      {uniqueSteps.map(stepId => ...)}
    </select>

    {/* Clear Button */}
    <button onClick={onClear}>
      <Trash2 size={12} /> Clear
    </button>
  </div>

  {/* Log Content */}
  <div className="flex-1 overflow-y-auto p-4 font-mono text-xs">
    {filteredLogs.map(log => (
      <div className={`mb-2 p-2 rounded ${styles.bg}`}>
        <span>[{formatTime(log.timestamp)}]</span>
        {styles.icon}
        <span className={styles.color}>{log.level}</span>
        <span>{log.stepName}</span>
        <span>{formatMessage(log.message)}</span>
      </div>
    ))}
  </div>
</div>
```

---

### 5. ✅ WorkflowRunner 组件（已创建）

**文件**: `components/workflow/WorkflowRunner.tsx`

**核心功能**:
- ✅ 调用 `workflowApi.execute()` 执行工作流
- ✅ 获取 `runId` 并连接 WebSocket
- ✅ 实时显示步骤状态（pending, running, success, failed）
- ✅ 实时收集和显示日志
- ✅ 监控变量变化
- ✅ 执行时间统计
- ✅ 步骤进度统计（成功/失败/总数）
- ✅ 启动/停止/重试控制
- ✅ 执行完成回调

**UI 布局**:
```
┌─────────────────────────────────────────┐
│ Header                                  │
│ - Workflow Name                         │
│ - Run ID, Live Status                   │
│ - Start/Stop/Retry/Close Buttons        │
├─────────────────────────────────────────┤
│ Status Bar                              │
│ - Execution Status (Running/Success/Failed) │
│ - Step Progress (Success/Total)         │
│ - Execution Time                        │
├─────────────────────────────────────────┤
│ WorkflowLogs (Real-time)                │
│                                         │
└─────────────────────────────────────────┘
```

**实现代码片段**:
```tsx
const executeWorkflow = async () => {
  // 1. Call API to execute
  const response = await workflowApi.execute(workflowId, variables);
  setRunId(response.runId);

  // 2. Connect WebSocket
  wsClient.current = new WorkflowStreamClient();
  wsClient.current.connect(response.runId, {
    onStepStart: (payload) => {
      addLog(payload.stepId, 'info', `Step started: ${payload.stepName}`);
      updateStepStatus(payload.stepId, payload.stepName, 'running');
    },
    onStepComplete: (payload) => {
      addLog(payload.stepId, payload.status === 'success' ? 'info' : 'error',
        `Step ${payload.status}: ${payload.stepName}`);
      updateStepStatus(payload.stepId, payload.stepName, payload.status);
    },
    onStepLog: (payload) => {
      addLog(payload.stepId, payload.level, payload.message);
    },
    onClose: () => {
      handleExecutionComplete();
    }
  });
};

const handleExecutionComplete = async () => {
  // Fetch final result
  const result = await workflowApi.getRun(runId);
  setExecutionStatus(result.status === 'completed' ? 'success' : 'failed');
  onComplete(runId, result.status);
};
```

---

### 6. ✅ TestRunner 集成（已完成）

**文件**: `components/TestRunner.tsx` (line 10, 327-333, 253-267, 345-376)

**集成方式**:
1. 导入 `WorkflowRunner` 组件
2. 检测 `testCase.linkedWorkflowId` 是否存在
3. 如果是工作流模式，渲染 `WorkflowRunner` 而非旧的模拟
4. 添加 `handleWorkflowComplete` 回调处理执行结果
5. WorkflowRunner 自带控制按钮，移除 TestRunner 的 footer

**改动内容**:
```tsx
// Import
import { WorkflowRunner } from './workflow/WorkflowRunner';

// Body section
{mode === 'STEPS' ? (
  <StepView ... />
) : testCase.linkedWorkflowId ? (
  <WorkflowRunner
    workflowId={testCase.linkedWorkflowId}
    workflowName={workflows.find(w => w.id === testCase.linkedWorkflowId)?.name || 'Workflow'}
    variables={testCase.variables}
    onComplete={handleWorkflowComplete}
    onCancel={onCancel}
  />
) : (
  <WorkflowView ... /> // Fallback for old simulation
)}

// Callback
const handleWorkflowComplete = (runId: string, status: 'success' | 'failed') => {
  const finalStatus = status === 'success' ? ExecutionStatus.PASSED : ExecutionStatus.FAILED;
  const run: TestRun = {
    id: runId,
    caseId: testCase.id,
    projectId: testCase.projectId,
    name: `Workflow Run: ${testCase.title}`,
    executedAt: new Date().toISOString(),
    status: finalStatus,
    notes: `Automated workflow execution via API`,
    logs: [`Workflow ${status}. Run ID: ${runId}`],
    environmentName: activeEnvironment?.name || 'Default'
  };
  onComplete(run);
};

// Footer - Only show for STEPS mode
{mode === 'STEPS' && (
  <div className="p-6 border-t ...">
    ...
  </div>
)}
```

---

## 待完成的任务

### ⏳ 1. 测试工作流执行

**前置条件**:
1. 后端服务运行中 (`http://localhost:8090`)
2. 数据库中存在测试工作流
3. 前端开发服务器运行中 (`http://localhost:5173`)

**测试步骤**:
1. ⏳ 访问前端 http://localhost:5173/
2. ⏳ 创建或选择一个测试用例，关联工作流（`linkedWorkflowId`）
3. ⏳ 点击 "Run" 执行测试用例
4. ⏳ 验证 TestRunner 显示 WorkflowRunner 组件
5. ⏳ 点击 "Start" 按钮开始执行
6. ⏳ 观察 WebSocket 连接状态（应显示 "Live" 绿点）
7. ⏳ 观察实时日志流入（步骤开始、日志、步骤完成）
8. ⏳ 观察步骤统计更新（Success/Total）
9. ⏳ 等待执行完成，验证最终状态（Success 或 Failed）
10. ⏳ 验证执行结果保存到测试运行记录

**预期结果**:
- WebSocket 成功连接
- 实时日志正确显示
- 步骤状态实时更新
- 执行时间正确计算
- 完成后状态正确（Success/Failed）

---

### ⏳ 2. 测试 WebSocket 重连机制

**测试场景**:
1. ⏳ 执行工作流时，中途断开网络连接
2. ⏳ 观察 WebSocket 尝试重连（最多3次）
3. ⏳ 恢复网络连接
4. ⏳ 验证 WebSocket 重连成功，日志继续流入

**预期结果**:
- 断开后自动尝试重连
- 重连成功后继续接收日志
- 重连失败3次后停止尝试

---

### ⏳ 3. 测试日志过滤功能

**测试步骤**:
1. ⏳ 执行包含多个步骤的工作流
2. ⏳ 使用日志级别过滤器（All Levels, INFO, WARN, ERROR）
3. ⏳ 验证只显示匹配级别的日志
4. ⏳ 使用步骤过滤器
5. ⏳ 验证只显示选中步骤的日志
6. ⏳ 点击 "Clear" 清空日志

**预期结果**:
- 过滤器正常工作
- 日志计数正确（显示 "过滤后/总数"）
- 清空功能正常

---

### ⏳ 4. 测试工作流 CRUD（ScriptLab/ActionLibrary）

**文件**: `components/ScriptLab.tsx`, `components/ActionLibrary.tsx`

**测试步骤**:
1. ⏳ 打开 ScriptLab 或 ActionLibrary 页面
2. ⏳ 创建新工作流
3. ⏳ 编辑工作流定义（steps, variables）
4. ⏳ 保存工作流
5. ⏳ 验证工作流列表更新
6. ⏳ 删除工作流
7. ⏳ 验证工作流从列表中移除

**预期结果**:
- 工作流 CRUD 操作正常
- useApiState 中 workflows 状态正确更新

---

### ⏳ 5. 测试错误处理

**测试场景**:
1. ⏳ 执行一个会失败的工作流（例如无效的 HTTP 请求）
2. ⏳ 验证错误日志正确显示（红色，ERROR 级别）
3. ⏳ 验证步骤状态标记为 "failed"
4. ⏳ 验证最终执行状态为 "Failed"
5. ⏳ 点击 "Retry" 重新执行

**预期结果**:
- 错误日志清晰显示
- 失败步骤正确标记
- 重试功能正常

---

## 待实现的任务（可选）

### ⏳ 6. WorkflowDAG 可视化（优先级：低）

**文件**: 新建 `components/workflow/WorkflowDAG.tsx`

**功能**:
- 使用 React Flow 或类似库
- 将 workflow definition 转换为 DAG 节点
- 显示步骤依赖关系
- 实时更新步骤状态（pending, running, success, failed）
- 点击节点查看步骤详情

**数据转换**:
```typescript
// workflow.definition.steps → React Flow nodes
const nodes = Object.entries(workflow.definition.steps).map(([id, step]) => ({
  id,
  data: { label: step.name, status: 'pending' },
  position: calculatePosition(id, step.dependencies)
}));

const edges = Object.entries(workflow.definition.steps).flatMap(([id, step]) =>
  (step.dependencies || []).map(dep => ({
    id: `${dep}-${id}`,
    source: dep,
    target: id
  }))
);
```

**集成到 WorkflowRunner**:
- 添加 "Graph View" / "Logs View" 切换按钮
- 在 Graph View 中显示 DAG，在 Logs View 中显示日志
- 两个视图共享执行状态

**优先级**: 低（因为日志视图已经足够）

---

## 集成测试清单

### 工作流执行
- [ ] 后端工作流 API 正常响应
- [ ] workflowApi.execute() 返回 runId
- [ ] WebSocket 连接成功
- [ ] 实时日志流入
- [ ] 步骤状态实时更新
- [ ] 变量变化日志显示
- [ ] 执行完成后状态正确
- [ ] 执行时间计算正确

### WebSocket
- [ ] 连接时显示 "Live" 状态
- [ ] onStepStart 回调触发
- [ ] onStepComplete 回调触发
- [ ] onStepLog 回调触发
- [ ] onVariableChange 回调触发
- [ ] onClose 回调触发
- [ ] 自动重连机制工作
- [ ] 断开连接后清理资源

### UI 交互
- [ ] Start 按钮启动执行
- [ ] Stop 按钮停止执行
- [ ] Retry 按钮重新执行
- [ ] Close 按钮关闭面板
- [ ] 日志级别过滤正常
- [ ] 步骤过滤正常
- [ ] Clear 按钮清空日志
- [ ] 自动滚动到底部

### 错误处理
- [ ] API 调用失败时显示错误
- [ ] WebSocket 连接失败时显示错误
- [ ] 执行失败时状态正确
- [ ] 网络断开后重连
- [ ] 组件卸载时清理 WebSocket

---

## 已知问题

### 1. BackendWorkflowRun 类型不完整

**当前问题**: `workflowApi.execute()` 返回的 `BackendWorkflowRun` 类型可能缺少 `runId` 字段

**解决方案**: 检查 `services/api/backendTypes.ts` 中的类型定义
```typescript
export interface BackendWorkflowRun {
  runId: string;  // 确保存在
  workflowId: string;
  status: 'running' | 'completed' | 'failed';
  startedAt: string;
  completedAt?: string;
  // ...
}
```

**优先级**: 高（影响执行）

---

### 2. VITE_WS_URL 环境变量

**当前实现**:
```typescript
const WS_BASE_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8090/api';
```

**问题**: 开发环境可能需要配置不同的 WebSocket URL

**解决方案**: 在 `.env.local` 中添加
```bash
VITE_WS_URL=ws://localhost:8090/api
```

**优先级**: 中（开发体验）

---

### 3. 工作流变量传递

**当前实现**: 从 `testCase.variables` 传递给工作流
```tsx
<WorkflowRunner
  variables={testCase.variables}
  ...
/>
```

**问题**: `testCase.variables` 可能未定义或格式不匹配

**解决方案**: 在 WorkflowRunner 中添加默认值和类型检查
```typescript
const safeVariables = variables || {};
```

**优先级**: 中（数据一致性）

---

### 4. 日志时间戳格式

**当前实现**:
```typescript
timestamp: new Date().toISOString()
```

**问题**: 后端可能返回不同格式的时间戳

**解决方案**: 添加时间戳解析函数
```typescript
const parseTimestamp = (ts: string | number) => {
  return typeof ts === 'string' ? new Date(ts) : new Date(ts);
};
```

**优先级**: 低（UI 显示）

---

## UI 设计符合性

### ✅ 符合 UI 规范

**WorkflowLogs 颜色方案**:
- ✅ 主背景: `bg-slate-900`
- ✅ 次级背景: `bg-slate-800`
- ✅ 边框: `border-slate-700`
- ✅ 文本: `text-white`, `text-slate-300`
- ✅ 错误: `text-red-400`
- ✅ 警告: `text-yellow-400`
- ✅ 信息: `text-blue-400`
- ✅ 调试: `text-slate-400`

**WorkflowRunner 颜色方案**:
- ✅ 主背景: `bg-white`
- ✅ 边框: `border-slate-200`
- ✅ 成功: `text-green-600`, `bg-green-600`
- ✅ 失败: `text-red-600`, `bg-red-600`
- ✅ 运行中: `text-blue-600`

**交互效果**:
- ✅ Hover 状态: `hover:bg-slate-700`, `hover:bg-slate-100`
- ✅ 过渡动画: `transition-all`, `transition-colors`
- ✅ Loading 动画: `animate-spin`, `animate-pulse`

---

## 下一步

### 立即测试（优先级：高）
1. **工作流执行**: 在浏览器中测试 WorkflowRunner 组件
2. **WebSocket 连接**: 验证实时日志流
3. **错误处理**: 测试失败场景和重连

### 功能验证（优先级：中）
1. **ScriptLab**: 验证工作流 CRUD 功能
2. **ActionLibrary**: 验证工作流管理

### 优化（优先级：低）
1. **DAG 可视化**: 添加 WorkflowDAG 组件
2. **性能优化**: 大量日志时的虚拟滚动
3. **UI 增强**: 步骤详情展开面板

---

## 文档状态

**状态**: ✅ 活跃
**最后更新**: 2025-11-23
**下次审查**: Phase 5 测试完成后
**进度**: 85% (核心功能完成，DAG 可视化可选)

---

## 技术亮点

### 1. 完整的 WebSocket 生命周期管理
- 自动连接、重连、断开
- 类型安全的消息处理
- 优雅的资源清理

### 2. 实时日志流
- 毫秒级时间戳
- 多级别过滤
- JSON 自动格式化
- 自动滚动

### 3. 步骤状态追踪
- pending → running → success/failed
- 实时更新步骤计数
- 执行时间统计

### 4. 错误处理
- API 调用错误捕获
- WebSocket 连接错误显示
- 执行失败状态标记
- 重试机制

### 5. 组件化设计
- WorkflowLogs 可复用
- WorkflowRunner 可独立使用
- TestRunner 无缝集成

---

## 与后端集成点

### API 集成
```
Frontend workflowApi → Backend /api/workflows
Frontend WebSocket → Backend /api/workflows/runs/:runId/stream
```

### 数据流
```
1. User clicks "Start" → workflowApi.execute()
2. Backend returns { runId }
3. Frontend connects WebSocket(runId)
4. Backend Hub broadcasts messages to runId group
5. Frontend receives step_start, step_log, step_complete
6. Frontend updates UI in real-time
7. WebSocket closes → Frontend fetches final result
```

### 类型映射
```typescript
// Backend → Frontend
BackendWorkflow → Workflow (via workflowFromBackend)
BackendWorkflowRun → 直接使用
WebSocketMessage → 类型化处理（step_start, step_log, etc.）
```

---

**完成时间**: 2025-11-23 下午
**实现者**: Claude Code
**审核状态**: 待用户测试
