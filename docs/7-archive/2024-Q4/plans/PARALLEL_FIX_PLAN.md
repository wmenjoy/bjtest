# 并发修复执行计划 - Parallel Fix Execution Plan

## 🎯 总体目标

1. **P0**: 修复编辑器全屏布局问题
2. **P1**: 移除StepCard中错误的Loop/Branch配置UI
3. **P1**: 创建正确的Loop/Branch独立步骤组件

---

## 📋 任务拆分 - 完全独立,可并发执行

### 第一批 - 6个完全独立的任务 (可同时启动)

#### Task 1.1: 修复TestCaseEditor布局
**文件**: `NextTestPlatformUI/components/testcase/TestCaseEditor.tsx`
**修改**:
- 第106行: 将 `className="fixed inset-0 bg-white z-50 flex flex-col animate-fade-in"`
- 改为: `className="flex-1 flex flex-col bg-white animate-fade-in h-full overflow-hidden"`
**验证**: 编辑器打开后导航栏仍然可见

#### Task 1.2: 移除StepCard的Loop Configuration UI
**文件**: `NextTestPlatformUI/components/testcase/stepEditor/StepCard.tsx`
**修改**:
- 移除 "Loop Configuration" 相关代码 (约第122-123行附近的UI元素)
- 移除 `LoopConfigEditor` 的引入和使用
- 移除 `handleLoopChange` 函数
**验证**: 步骤卡片中不再显示Loop开关

#### Task 1.3: 移除StepCard的Branches UI
**文件**: `NextTestPlatformUI/components/testcase/stepEditor/StepCard.tsx`
**修改**:
- 移除 "Add Conditional Branches" 按钮 (约第124行附近)
- 移除 `BranchConfigEditor` 的引入和使用
- 移除 `handleBranchesChange` 函数
**验证**: 步骤卡片中不再显示Branches按钮

#### Task 1.4: 创建LoopStepCard组件
**文件**: `NextTestPlatformUI/components/testcase/stepEditor/LoopStepCard.tsx` (新建)
**内容**:
```tsx
import React from 'react';
import { WorkflowStep, LoopConfig } from '../../../types';
import { RefreshCw } from 'lucide-react';
import { LoopConfigEditor } from './LoopConfigEditor';

interface LoopStepCardProps {
  step: WorkflowStep;
  index: number;
  onChange: (step: WorkflowStep) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  depth?: number;
}

export const LoopStepCard: React.FC<LoopStepCardProps> = ({
  step,
  index,
  onChange,
  onDelete,
  onDuplicate,
  depth = 0
}) => {
  const loopConfig = step.config as LoopConfig;

  return (
    <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4" style={{ marginLeft: `${depth * 24}px` }}>
      {/* Loop Header */}
      <div className="flex items-center space-x-2 mb-3">
        <RefreshCw size={16} className="text-blue-600" />
        <span className="font-semibold text-blue-900">{index + 1}. {step.name || 'Loop Step'}</span>
        <span className="text-xs px-2 py-0.5 bg-blue-200 text-blue-700 rounded-full">
          {loopConfig?.type || 'forEach'}
        </span>
      </div>

      {/* Loop Configuration */}
      <LoopConfigEditor
        loopConfig={loopConfig}
        onChange={(config) => onChange({ ...step, config })}
      />

      {/* Child Steps Placeholder */}
      <div className="mt-3 pt-3 border-t border-blue-200">
        <span className="text-xs text-blue-600">Loop Body: {step.children?.length || 0} steps</span>
      </div>
    </div>
  );
};
```
**验证**: 组件可成功导入和渲染

#### Task 1.5: 创建BranchStepCard组件
**文件**: `NextTestPlatformUI/components/testcase/stepEditor/BranchStepCard.tsx` (新建)
**内容**:
```tsx
import React from 'react';
import { WorkflowStep, BranchConfig } from '../../../types';
import { GitBranch } from 'lucide-react';
import { BranchConfigEditor } from './BranchConfigEditor';

interface BranchStepCardProps {
  step: WorkflowStep;
  index: number;
  onChange: (step: WorkflowStep) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  depth?: number;
}

export const BranchStepCard: React.FC<BranchStepCardProps> = ({
  step,
  index,
  onChange,
  onDelete,
  onDuplicate,
  depth = 0
}) => {
  const branches = (step.config as any)?.branches || [];

  return (
    <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4" style={{ marginLeft: `${depth * 24}px` }}>
      {/* Branch Header */}
      <div className="flex items-center space-x-2 mb-3">
        <GitBranch size={16} className="text-purple-600" />
        <span className="font-semibold text-purple-900">{index + 1}. {step.name || 'Branch Step'}</span>
        <span className="text-xs px-2 py-0.5 bg-purple-200 text-purple-700 rounded-full">
          {branches.length} branches
        </span>
      </div>

      {/* Branch Configuration */}
      <BranchConfigEditor
        branches={branches}
        onChange={(newBranches) => onChange({ ...step, config: { branches: newBranches } })}
      />
    </div>
  );
};
```
**验证**: 组件可成功导入和渲染

#### Task 1.6: 更新types.ts的StepType定义
**文件**: `NextTestPlatformUI/types.ts`
**修改**:
- 在WorkflowStep接口之前添加StepType类型定义
```typescript
/**
 * Step Type Definition
 * Each step must have exactly one type
 */
export type StepType =
  | 'http'       // HTTP请求
  | 'command'    // 命令执行
  | 'assertion'  // 断言验证
  | 'loop'       // 循环控制
  | 'branch'     // 条件分支
  | 'merge'      // 合并节点
  | 'group';     // 步骤组

export interface WorkflowStep {
  id: string;
  name?: string;
  type: StepType; // 改为必填,移除optional标记

  // 配置 - 根据type不同而不同
  config?: Record<string, any>;

  // ... 其他字段保持不变

  // 移除以下字段(已废弃):
  // loop?: LoopConfig;  // 删除这行
  // branches?: BranchConfig[]; // 删除这行
}
```
**验证**: TypeScript编译无错误

---

### 第二批 - 2个任务 (依赖第一批完成)

#### Task 2.1: 更新StepEditor添加Loop/Branch选项
**文件**: `NextTestPlatformUI/components/testcase/stepEditor/StepEditor.tsx`
**修改**:
- 更新STEP_TYPES数组 (约第24-30行)
```typescript
const STEP_TYPES = [
  { type: 'http', label: 'HTTP Request', icon: Globe, color: 'emerald' },
  { type: 'command', label: 'Command', icon: Terminal, color: 'orange' },
  { type: 'assertion', label: 'Assertion', icon: CheckCircle, color: 'cyan' },
  { type: 'loop', label: 'Loop', icon: RefreshCw, color: 'blue' },  // 新增
  { type: 'branch', label: 'Branch', icon: GitBranch, color: 'purple' },  // 新增
  { type: 'group', label: 'Group', icon: Layers, color: 'slate' }
];
```
- 更新addStep函数,为loop和branch提供默认配置
```typescript
const addStep = useCallback((type: string = 'http') => {
  let defaultConfig: any = {};
  if (type === 'http') {
    defaultConfig = { method: 'GET', url: '' };
  } else if (type === 'loop') {
    defaultConfig = { type: 'forEach', source: '', itemVar: 'item', maxIterations: 100 };
  } else if (type === 'branch') {
    defaultConfig = { branches: [] };
  }

  const newStep: TestStep = {
    id: generateStepId(),
    name: '',
    summary: '',
    type,
    config: defaultConfig
  };
  onChange([...steps, newStep]);
  setShowAddMenu(false);
}, [steps, onChange, generateStepId]);
```
**验证**: Add Step菜单显示Loop和Branch选项

#### Task 2.2: 更新StepEditor渲染逻辑
**文件**: `NextTestPlatformUI/components/testcase/stepEditor/StepEditor.tsx`
**修改**:
- 导入新组件
```typescript
import { LoopStepCard } from './LoopStepCard';
import { BranchStepCard } from './BranchStepCard';
```
- 更新步骤渲染逻辑 (约第120行附近)
```typescript
{steps.map((step, index) => {
  // 根据type渲染不同的卡片
  if (step.type === 'loop') {
    return (
      <LoopStepCard
        key={step.id}
        step={step}
        index={index}
        onChange={(updatedStep) => updateStep(index, updatedStep)}
        onDelete={() => deleteStep(index)}
        onDuplicate={() => duplicateStep(index)}
      />
    );
  } else if (step.type === 'branch') {
    return (
      <BranchStepCard
        key={step.id}
        step={step}
        index={index}
        onChange={(updatedStep) => updateStep(index, updatedStep)}
        onDelete={() => deleteStep(index)}
        onDuplicate={() => duplicateStep(index)}
      />
    );
  } else {
    return (
      <StepCard
        key={step.id}
        step={step}
        index={index}
        onChange={(updatedStep) => updateStep(index, updatedStep)}
        onDelete={() => deleteStep(index)}
        onDuplicate={() => duplicateStep(index)}
        variables={variables}
        draggable={!readOnly}
        onDragStart={() => setDraggedIndex(index)}
        onDragOver={(e) => handleDragOver(e, index)}
        onDragEnd={handleDragEnd}
      />
    );
  }
})}
```
**验证**: Loop和Branch步骤使用专用卡片渲染

---

## 🚀 执行策略

### Phase 1: 并发执行第一批 (6个agents同时启动)
```bash
启动时间: 立即
预计耗时: 10-15分钟 (并发执行)
Agent数量: 6个
```

### Phase 2: 并发执行第二批 (2个agents同时启动)
```bash
启动时间: Phase 1完成后
预计耗时: 5-10分钟 (并发执行)
Agent数量: 2个
依赖: Task 1.4, 1.5 完成
```

### Phase 3: 集成测试
```bash
启动时间: Phase 2完成后
预计耗时: 5分钟
测试项:
- 编辑器布局正确
- 步骤卡片无Loop/Branch选项
- 可添加Loop步骤
- 可添加Branch步骤
- Loop/Branch步骤正确渲染
```

---

## ✅ 验证清单

### 布局修复验证
- [ ] 打开测试用例编辑器
- [ ] 左侧导航栏可见
- [ ] 案例列表可见
- [ ] 可以切换到其他模块

### UI清理验证
- [ ] HTTP步骤卡片无Loop Configuration开关
- [ ] HTTP步骤卡片无Add Conditional Branches按钮
- [ ] Command步骤卡片无Loop/Branch选项

### 新功能验证
- [ ] Add Step菜单包含Loop选项
- [ ] Add Step菜单包含Branch选项
- [ ] 添加Loop步骤后使用蓝色卡片
- [ ] 添加Branch步骤后使用紫色卡片
- [ ] Loop步骤显示循环配置
- [ ] Branch步骤显示分支配置

---

## 📊 进度追踪

| Task ID | 描述 | 状态 | Agent | 开始时间 | 完成时间 |
|---------|------|------|-------|----------|----------|
| 1.1 | 修复编辑器布局 | 🔲 Pending | - | - | - |
| 1.2 | 移除Loop UI | 🔲 Pending | - | - | - |
| 1.3 | 移除Branch UI | 🔲 Pending | - | - | - |
| 1.4 | 创建LoopStepCard | 🔲 Pending | - | - | - |
| 1.5 | 创建BranchStepCard | 🔲 Pending | - | - | - |
| 1.6 | 更新types.ts | 🔲 Pending | - | - | - |
| 2.1 | 更新Add菜单 | 🔲 Pending | - | - | - |
| 2.2 | 更新渲染逻辑 | 🔲 Pending | - | - | - |

---

**总预计时间**: 20-30分钟 (并发执行)
**串行执行时间**: 60-90分钟
**效率提升**: 3x
