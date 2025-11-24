# 统一 Workflow 架构 - 完整实施方案

> **文档版本**: v2.0.0
> **创建日期**: 2025-11-25
> **设计原则**: 第一性原理 + 完备性
> **实施方式**: Sub-agent 并行执行

---

## 第一性原理分析

### 1. 核心本质

**Workflow = TestCase = 可执行的步骤序列**

```
输入(Inputs) → [步骤1 → 步骤2 → ... → 步骤N] → 输出(Outputs)
                     ↓
              控制流(Condition/Loop/Branch)
                     ↓
              验证(Assertions)
```

**每个步骤的本质**: `输入 → 处理 → 输出`

**数据流的本质**: `步骤N的输出 → 步骤N+1的输入`

### 2. 当前系统根本问题

#### 问题 1: 数据模型分裂
- **前端**: TestStep (旧) ≠ WorkflowStep (新)
- **后端**: TestCase.Steps ≈ Workflow.Steps（结构相似但定义分散）
- **影响**: 两套编辑器、两套执行逻辑、维护困难

#### 问题 2: Action 重复定义
- **现状**: 每个步骤内联配置（重复劳动）
- **应该**: Action Template 复用机制

#### 问题 3: 数据流不清晰
- **现状**: 手写 `{{variable}}` 引用（易错）
- **应该**: 可视化拖拽映射

---

## 设计目标

### ✅ 目标 1: 统一数据模型
- 前后端使用同一个 `WorkflowStep` 定义
- TestCase.steps = Workflow.steps（完全相同的数据结构）
- 向后兼容旧数据（内联 config）

### ✅ 目标 2: 双模式并存
- **方式1（推荐）**: 引用 Action Template
- **方式2（兼容）**: 内联 Config
- 用户可自由选择，可相互切换

### ✅ 目标 3: 数据流可视化
- 三栏映射面板（上游输出 | 映射关系 | 当前输入）
- 拖拽式配置
- 支持 JSONPath 和转换函数

### ✅ 目标 4: 双编辑器模式
- **Simple Mode**: 列表式（适合简单线性流程）
- **Advanced Mode**: DAG 图（适合复杂并行/分支流程）
- 自动检测切换建议

---

## Phase 1: 数据模型统一（基础设施层）

### 核心原则
**"统一数据结构，差异化视图"**

### 1.1 前端类型定义统一

**文件**: `NextTestPlatformUI/types.ts`

**任务内容**:

```typescript
// ========== 统一的 WorkflowStep 定义 ==========
export interface WorkflowStep {
  id: string;
  name: string;
  type: string; // http, command, database, script, branch, loop, merge

  // 【核心】两种配置方式（互斥）
  // 方式1: 引用 Action Template（推荐）
  actionTemplateId?: string;
  actionVersion?: string;

  // 方式2: 内联配置（向后兼容）
  config?: Record<string, any>;

  // 数据流
  inputs?: Record<string, string>;      // 参数绑定: { "username": "{{testUser}}" }
  outputs?: Record<string, string>;     // 输出映射: { "authToken": "currentToken" }
  dataMappers?: DataMapper[];           // 可视化数据映射配置

  // 控制流
  condition?: string;                   // 条件表达式
  dependsOn?: string[];                 // 依赖步骤ID（DAG）
  loop?: LoopConfig;                    // 循环配置
  branches?: BranchConfig[];            // 分支配置
  children?: WorkflowStep[];            // 嵌套步骤（完整对象，非ID引用）

  // 错误处理
  onError?: 'abort' | 'continue' | 'retry';
  retryCount?: number;
  retryDelay?: number; // 秒
  timeout?: number;    // 秒

  // 断言（测试视角）
  assertions?: Assertion[];

  // UI 相关（高级模式）
  position?: Position;
  collapsed?: boolean;
  disabled?: boolean;
}

// 兼容旧代码
export type TestStep = WorkflowStep;

// ========== 辅助类型 ==========
export interface DataMapper {
  id: string;
  sourceStep: string;   // "step-login"
  sourcePath: string;   // "response.body.token" (JSONPath)
  targetParam: string;  // "authToken"
  transform?: string;   // "uppercase" | "parseInt" | "trim" 等
}

export interface Position {
  x: number;
  y: number;
}

export interface Assertion {
  type: 'equals' | 'contains' | 'matches' | 'greaterThan' | 'lessThan';
  actual: string;   // "{{step-login.response.status}}"
  expected: any;
  message?: string;
}

// LoopConfig, BranchConfig 已存在，确保完整
```

**验收标准**:
- ✅ types.ts 编译无错误
- ✅ WorkflowStep 包含所有必需字段
- ✅ TestStep = WorkflowStep 类型别名存在

---

### 1.2 StepCard 重构：双模式并存

**文件**: `NextTestPlatformUI/components/testcase/stepEditor/StepCard.tsx`

**核心逻辑**:

```typescript
const StepCard = ({ step, onChange, variables }) => {
  // 判断当前配置模式
  const isTemplateMode = !!step.actionTemplateId;
  const isInlineMode = !isTemplateMode;

  // 模式切换
  const switchToTemplateMode = () => {
    setShowTemplateSelector(true);
  };

  const switchToInlineMode = () => {
    onChange({
      ...step,
      actionTemplateId: undefined,
      actionVersion: undefined,
      inputs: undefined,
      // 保留 config
    });
  };

  return (
    <div className="step-card">
      {/* Header: 步骤名称 + 模式指示器 */}
      <div className="header">
        <span>{step.name}</span>
        {isTemplateMode && (
          <span className="badge">📦 Template</span>
        )}
        {isInlineMode && (
          <span className="badge">⚙️ Inline</span>
        )}
      </div>

      {/* 展开区域 */}
      {isExpanded && (
        <div className="config-area">
          {/* 模式选择器 */}
          <div className="mode-selector">
            <button
              onClick={switchToTemplateMode}
              className={isTemplateMode ? 'active' : ''}
            >
              📦 使用 Action Template
            </button>
            <button
              onClick={switchToInlineMode}
              className={isInlineMode ? 'active' : ''}
            >
              ⚙️ 自定义配置
            </button>
          </div>

          {/* Template 模式配置 */}
          {isTemplateMode && (
            <TemplateConfigSection
              step={step}
              onChange={onChange}
            />
          )}

          {/* 内联模式配置 */}
          {isInlineMode && (
            <InlineConfigSection
              step={step}
              onChange={onChange}
            />
          )}

          {/* 通用配置：控制流、断言等 */}
          <CommonConfigSection
            step={step}
            onChange={onChange}
          />
        </div>
      )}
    </div>
  );
};
```

**子组件拆分**:

#### 1.2.1 TemplateConfigSection（已有，优化）
```typescript
const TemplateConfigSection = ({ step, onChange }) => {
  const [template, setTemplate] = useState<ActionTemplate | null>(null);

  // 加载模板详情
  useEffect(() => {
    if (step.actionTemplateId) {
      actionTemplateApi.getTemplate(step.actionTemplateId)
        .then(setTemplate);
    }
  }, [step.actionTemplateId]);

  return (
    <div className="template-config">
      {/* 模板信息卡片 */}
      {template && (
        <TemplateInfoCard template={template} />
      )}

      {/* 输入参数配置 */}
      <InputParametersForm
        template={template}
        step={step}
        onChange={onChange}
      />

      {/* 输出映射配置 */}
      <OutputMappingsForm
        template={template}
        step={step}
        onChange={onChange}
      />

      {/* 解除模板关联按钮 */}
      <button onClick={() => switchToInlineMode()}>
        🔓 解除关联
      </button>
    </div>
  );
};
```

#### 1.2.2 InlineConfigSection（保留原有逻辑）
```typescript
const InlineConfigSection = ({ step, onChange }) => {
  return (
    <div className="inline-config">
      {/* 步骤类型选择 */}
      <select
        value={step.type}
        onChange={(e) => updateField('type', e.target.value)}
      >
        <option value="http">HTTP Request</option>
        <option value="command">Command</option>
        <option value="database">Database Query</option>
        {/* ... 其他类型 */}
      </select>

      {/* HTTP 配置（type === 'http'） */}
      {step.type === 'http' && (
        <HttpConfigForm step={step} onChange={onChange} />
      )}

      {/* Command 配置（type === 'command'） */}
      {step.type === 'command' && (
        <CommandConfigForm step={step} onChange={onChange} />
      )}

      {/* 手动输出映射 */}
      <ManualOutputMappingForm
        step={step}
        onChange={onChange}
      />
    </div>
  );
};
```

**验收标准**:
- ✅ 可以选择 Template 模式
- ✅ 可以选择 Inline 模式
- ✅ 两种模式可相互切换
- ✅ 切换时数据不丢失
- ✅ 原有 HTTP/Command 配置正常工作

---

### 1.3 后端执行器统一

**文件**: `nextest-platform/internal/workflow/executor.go`

**核心修改**:

```go
// ExecuteStep 统一步骤执行入口
func (e *WorkflowExecutor) ExecuteStep(ctx *ExecutionContext, step *WorkflowStep) (*StepResult, error) {
    // 1. 确定最终配置
    var finalConfig map[string]interface{}
    var outputDefinitions []ActionOutput

    if step.ActionTemplateID != "" {
        // 【方式1】引用 Action Template
        template, err := e.actionLibrary.GetTemplate(step.ActionTemplateID, step.ActionVersion)
        if err != nil {
            return nil, fmt.Errorf("action template not found: %s", step.ActionTemplateID)
        }

        // 合并配置: Template ConfigTemplate + Step Inputs
        finalConfig = e.mergeConfig(template.ConfigTemplate, step.Inputs, ctx)
        outputDefinitions = template.Outputs
    } else {
        // 【方式2】内联配置
        finalConfig = step.Config
    }

    // 2. 创建并执行 Action
    action := e.createAction(step.Type, finalConfig)
    result, err := action.Execute(ctx)
    if err != nil {
        return nil, err
    }

    // 3. 提取输出变量
    if len(outputDefinitions) > 0 {
        e.extractOutputsFromTemplate(result, outputDefinitions, step.Outputs, ctx)
    } else if step.Outputs != nil {
        e.extractOutputsFromMapping(result, step.Outputs, ctx)
    }

    return result, nil
}

// mergeConfig 合并模板配置和步骤输入
func (e *WorkflowExecutor) mergeConfig(
    templateConfig map[string]interface{},
    inputs map[string]string,
    ctx *ExecutionContext,
) map[string]interface{} {
    merged := make(map[string]interface{})

    // 1. 复制模板配置
    for k, v := range templateConfig {
        merged[k] = v
    }

    // 2. 用 inputs 覆盖（支持变量插值）
    for paramName, paramValue := range inputs {
        resolvedValue := e.variableResolver.Resolve(paramValue, ctx)
        merged[paramName] = resolvedValue
    }

    return merged
}

// extractOutputsFromTemplate 从模板定义提取输出
func (e *WorkflowExecutor) extractOutputsFromTemplate(
    result *StepResult,
    outputDefs []ActionOutput,
    outputMappings map[string]string,
    ctx *ExecutionContext,
) {
    for _, output := range outputDefs {
        // 使用 JSONPath 提取值
        value := gjson.Get(result.JSON(), output.Path).Value()

        // 映射到变量名
        varName := outputMappings[output.Name]
        if varName == "" {
            varName = output.Name // 使用默认名称
        }

        ctx.SetVariable(varName, value)
    }
}
```

**新增文件**: `nextest-platform/internal/workflow/variable_resolver.go`

```go
package workflow

import (
    "regexp"
    "strings"
)

type VariableResolver struct {
    // 变量引用正则: {{variableName}}
    varPattern *regexp.Regexp
}

func NewVariableResolver() *VariableResolver {
    return &VariableResolver{
        varPattern: regexp.MustCompile(`\{\{([^}]+)\}\}`),
    }
}

// Resolve 解析变量引用
func (r *VariableResolver) Resolve(input string, ctx *ExecutionContext) interface{} {
    // 查找所有 {{variable}} 引用
    matches := r.varPattern.FindAllStringSubmatch(input, -1)

    if len(matches) == 0 {
        // 无变量引用，直接返回原值
        return input
    }

    result := input
    for _, match := range matches {
        placeholder := match[0] // "{{variable}}"
        varName := match[1]     // "variable"

        // 从上下文获取变量值
        value := ctx.GetVariable(varName)
        if value == nil {
            value = ""
        }

        result = strings.ReplaceAll(result, placeholder, fmt.Sprintf("%v", value))
    }

    return result
}
```

**验收标准**:
- ✅ Action Template 模式可执行
- ✅ 内联 Config 模式可执行
- ✅ 输出变量正确提取
- ✅ 变量插值正常工作

---

## Phase 2: 数据流可视化（用户体验层）

### 核心原则
**"让数据流动一目了然"**

### 2.1 DataMapper 基础组件

**文件**: `NextTestPlatformUI/components/testcase/stepEditor/DataMappingPanel.tsx`

```typescript
interface DataMappingPanelProps {
  currentStep: WorkflowStep;
  previousSteps: WorkflowStep[]; // 所有前置步骤
  onChange: (step: WorkflowStep) => void;
}

const DataMappingPanel: React.FC<DataMappingPanelProps> = ({
  currentStep,
  previousSteps,
  onChange
}) => {
  const [dragData, setDragData] = useState<{
    sourceStep: string;
    sourcePath: string;
  } | null>(null);

  // 拖拽开始
  const handleDragStart = (sourceStep: string, sourcePath: string) => {
    setDragData({ sourceStep, sourcePath });
  };

  // 拖拽结束：创建映射
  const handleDrop = (targetParam: string) => {
    if (!dragData) return;

    const newMapper: DataMapper = {
      id: `mapper-${Date.now()}`,
      sourceStep: dragData.sourceStep,
      sourcePath: dragData.sourcePath,
      targetParam: targetParam,
    };

    onChange({
      ...currentStep,
      dataMappers: [...(currentStep.dataMappers || []), newMapper]
    });

    setDragData(null);
  };

  // 删除映射
  const deleteMapper = (mapperId: string) => {
    onChange({
      ...currentStep,
      dataMappers: currentStep.dataMappers?.filter(m => m.id !== mapperId)
    });
  };

  return (
    <div className="flex h-96 border rounded-lg overflow-hidden">
      {/* 左栏：上游输出 */}
      <div className="w-1/3 border-r bg-white overflow-y-auto">
        <div className="p-4">
          <h3 className="text-sm font-bold text-slate-700 mb-3">
            上游输出
          </h3>
          {previousSteps.map(step => (
            <UpstreamOutputTree
              key={step.id}
              step={step}
              onDragStart={handleDragStart}
            />
          ))}
        </div>
      </div>

      {/* 中栏：映射关系 */}
      <div className="w-1/3 border-r bg-slate-50 overflow-y-auto">
        <div className="p-4">
          <h3 className="text-sm font-bold text-slate-700 mb-3">
            映射关系
          </h3>
          {currentStep.dataMappers?.map(mapper => (
            <MappingLine
              key={mapper.id}
              mapper={mapper}
              onDelete={() => deleteMapper(mapper.id)}
              onChange={(updated) => updateMapper(mapper.id, updated)}
            />
          ))}
        </div>
      </div>

      {/* 右栏：当前输入 */}
      <div className="w-1/3 bg-white overflow-y-auto">
        <div className="p-4">
          <h3 className="text-sm font-bold text-slate-700 mb-3">
            当前输入
          </h3>
          <CurrentInputsList
            step={currentStep}
            onDrop={handleDrop}
            isDragging={!!dragData}
          />
        </div>
      </div>
    </div>
  );
};
```

**子组件 1**: `UpstreamOutputTree.tsx`

```typescript
const UpstreamOutputTree = ({ step, onDragStart }) => {
  const [expanded, setExpanded] = useState(false);

  // 获取步骤的输出结构（从 outputs 或 template.outputs）
  const outputs = getStepOutputs(step);

  return (
    <div className="mb-3">
      {/* 步骤名称（可展开） */}
      <div
        className="flex items-center cursor-pointer hover:bg-blue-50 p-2 rounded transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <ChevronRight
          size={14}
          className={`transition-transform ${expanded ? 'rotate-90' : ''}`}
        />
        <span className="ml-2 text-sm font-medium text-slate-700">
          {step.name}
        </span>
      </div>

      {/* 输出字段列表 */}
      {expanded && (
        <div className="ml-6 mt-1 space-y-1">
          {Object.entries(outputs).map(([fieldName, fieldType]) => (
            <div
              key={fieldName}
              draggable
              onDragStart={() => onDragStart(step.id, fieldName)}
              className="flex items-center space-x-2 p-2 hover:bg-blue-100 rounded cursor-move transition-colors"
            >
              <Database size={12} className="text-blue-600" />
              <span className="text-xs font-mono text-slate-700">{fieldName}</span>
              <span className="text-xs text-slate-400">{fieldType}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// 获取步骤输出结构
function getStepOutputs(step: WorkflowStep): Record<string, string> {
  // 优先从 outputs 获取
  if (step.outputs) {
    return Object.fromEntries(
      Object.values(step.outputs).map(varName => [varName, 'unknown'])
    );
  }

  // TODO: 从 action template 获取输出定义
  // TODO: 从历史执行结果获取输出结构

  return {};
}
```

**子组件 2**: `CurrentInputsList.tsx`

```typescript
const CurrentInputsList = ({ step, onDrop, isDragging }) => {
  const [dropTarget, setDropTarget] = useState<string | null>(null);

  // 获取当前步骤需要的输入参数
  const inputParams = getCurrentInputParams(step);

  return (
    <div className="space-y-2">
      {inputParams.map(param => (
        <div
          key={param.name}
          className={`p-3 border rounded-lg transition-all ${
            dropTarget === param.name
              ? 'border-blue-400 bg-blue-50'
              : 'border-slate-200 bg-white'
          } ${isDragging ? 'border-dashed' : ''}`}
          onDragOver={(e) => {
            e.preventDefault();
            setDropTarget(param.name);
          }}
          onDragLeave={() => setDropTarget(null)}
          onDrop={(e) => {
            e.preventDefault();
            onDrop(param.name);
            setDropTarget(null);
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-mono text-slate-700">
                {param.name}
              </span>
              {param.required && (
                <span className="ml-1 text-red-500">*</span>
              )}
            </div>
            <span className="text-xs text-slate-400">{param.type}</span>
          </div>
          {param.description && (
            <p className="text-xs text-slate-500 mt-1">{param.description}</p>
          )}
        </div>
      ))}
    </div>
  );
};

// 获取输入参数定义
function getCurrentInputParams(step: WorkflowStep): ActionParameter[] {
  // 从 Action Template 获取
  if (step.actionTemplateId) {
    // TODO: 从缓存或API获取 template.parameters
    return [];
  }

  // 从 config 推断
  // TODO: 根据 step.type 返回默认参数
  return [];
}
```

**验收标准**:
- ✅ 三栏布局正常显示
- ✅ 上游输出可展开/折叠
- ✅ 拖拽创建映射正常工作
- ✅ 映射关系可视化显示

---

### 2.2 映射关系可视化

**文件**: `NextTestPlatformUI/components/testcase/stepEditor/MappingLine.tsx`

```typescript
const MappingLine = ({ mapper, onDelete, onChange }) => {
  const [showTransformSelect, setShowTransformSelect] = useState(false);

  return (
    <div className="flex items-center space-x-2 p-2 bg-white border rounded-lg mb-2">
      {/* 源字段 */}
      <div className="flex-1 text-xs">
        <span className="font-mono text-blue-600">{mapper.sourceStep}</span>
        <span className="text-slate-400 mx-1">.</span>
        <span className="font-mono text-slate-700">{mapper.sourcePath}</span>
      </div>

      {/* 箭头 + 转换函数 */}
      <div className="flex items-center space-x-1">
        <ArrowRight size={14} className="text-slate-400" />

        {mapper.transform && (
          <button
            onClick={() => setShowTransformSelect(true)}
            className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded"
          >
            {mapper.transform}
          </button>
        )}
      </div>

      {/* 目标参数 */}
      <div className="flex-1 text-xs">
        <span className="font-mono text-green-600">{mapper.targetParam}</span>
      </div>

      {/* 删除按钮 */}
      <button
        onClick={onDelete}
        className="p-1 text-slate-400 hover:text-red-500"
      >
        <Trash2 size={14} />
      </button>

      {/* 转换函数选择器 */}
      {showTransformSelect && (
        <TransformFunctionSelector
          value={mapper.transform}
          onChange={(transform) => {
            onChange({ ...mapper, transform });
            setShowTransformSelect(false);
          }}
          onClose={() => setShowTransformSelect(false)}
        />
      )}
    </div>
  );
};

const TransformFunctionSelector = ({ value, onChange, onClose }) => {
  const transforms = [
    { id: '', name: '无转换' },
    { id: 'uppercase', name: '转大写' },
    { id: 'lowercase', name: '转小写' },
    { id: 'trim', name: '去空格' },
    { id: 'parseInt', name: '转整数' },
    { id: 'parseFloat', name: '转小数' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
      <div className="bg-white rounded-lg shadow-lg p-4 w-64">
        <h4 className="font-semibold mb-3">选择转换函数</h4>
        <div className="space-y-1">
          {transforms.map(t => (
            <button
              key={t.id}
              onClick={() => onChange(t.id)}
              className="w-full text-left px-3 py-2 hover:bg-slate-100 rounded"
            >
              {t.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
```

**验收标准**:
- ✅ 映射关系显示清晰（源 → 目标）
- ✅ 可选择转换函数
- ✅ 可删除映射
- ✅ 可编辑映射

---

### 2.3 后端变量解析增强

**文件**: `nextest-platform/internal/workflow/variable_resolver.go`（增强）

```go
package workflow

import (
    "fmt"
    "regexp"
    "strings"
    "github.com/tidwall/gjson"
)

// 内置转换函数
var builtInTransforms = map[string]TransformFunc{
    "uppercase":  func(v interface{}) interface{} { return strings.ToUpper(fmt.Sprintf("%v", v)) },
    "lowercase":  func(v interface{}) interface{} { return strings.ToLower(fmt.Sprintf("%v", v)) },
    "trim":       func(v interface{}) interface{} { return strings.TrimSpace(fmt.Sprintf("%v", v)) },
    "parseInt":   parseIntTransform,
    "parseFloat": parseFloatTransform,
}

type TransformFunc func(interface{}) interface{}

// ResolveStepInputs 解析步骤输入（优先使用 DataMappers）
func (r *VariableResolver) ResolveStepInputs(step *WorkflowStep, ctx *ExecutionContext) (map[string]interface{}, error) {
    resolved := make(map[string]interface{})

    // 1. 优先使用 DataMappers（可视化配置）
    for _, mapper := range step.DataMappers {
        value, err := r.resolveDataMapper(mapper, ctx)
        if err != nil {
            return nil, fmt.Errorf("failed to resolve mapper %s: %w", mapper.ID, err)
        }
        resolved[mapper.TargetParam] = value
    }

    // 2. 其次使用 Inputs（手动引用）
    for paramName, paramValue := range step.Inputs {
        if _, exists := resolved[paramName]; !exists {
            resolved[paramName] = r.Resolve(paramValue, ctx)
        }
    }

    return resolved, nil
}

// resolveDataMapper 解析单个 DataMapper
func (r *VariableResolver) resolveDataMapper(mapper *DataMapper, ctx *ExecutionContext) (interface{}, error) {
    // 1. 获取源步骤的输出
    sourceStepResult := ctx.GetStepResult(mapper.SourceStep)
    if sourceStepResult == nil {
        return nil, fmt.Errorf("source step %s not found", mapper.SourceStep)
    }

    // 2. 使用 JSONPath 提取值
    value := gjson.Get(sourceStepResult.JSON(), mapper.SourcePath).Value()

    // 3. 应用转换函数
    if mapper.Transform != "" {
        transformFunc, ok := builtInTransforms[mapper.Transform]
        if !ok {
            return nil, fmt.Errorf("unknown transform function: %s", mapper.Transform)
        }
        value = transformFunc(value)
    }

    return value, nil
}
```

**验收标准**:
- ✅ DataMapper 解析正常工作
- ✅ JSONPath 提取正确
- ✅ 转换函数执行正确
- ✅ 优先级正确（DataMapper > Inputs）

---

## Phase 3: 双模式编辑器（高级功能层）

### 核心原则
**"简单优先，复杂可选"**

### 3.1 模式切换逻辑

**文件**: `NextTestPlatformUI/components/WorkflowEditor.tsx`（新建）

```typescript
const WorkflowEditor = ({ workflow, onChange }) => {
  const [mode, setMode] = useState<'simple' | 'advanced'>('simple');

  // 自动检测是否需要高级模式
  const needsAdvancedMode = useMemo(() => {
    return workflow.steps.some(step =>
      (step.dependsOn && step.dependsOn.length > 0) ||  // 有依赖
      (step.branches && step.branches.length > 0) ||    // 有分支
      step.loop !== undefined ||                        // 有循环
      step.type === 'merge'                             // Merge 节点
    );
  }, [workflow.steps]);

  return (
    <div className="workflow-editor h-full flex flex-col">
      {/* 模式切换工具栏 */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setMode('simple')}
            className={`px-4 py-2 rounded ${
              mode === 'simple'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            📋 简单模式
          </button>
          <button
            onClick={() => setMode('advanced')}
            className={`px-4 py-2 rounded ${
              mode === 'advanced'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            🌐 高级模式 (DAG)
          </button>
        </div>

        {/* 提示信息 */}
        {needsAdvancedMode && mode === 'simple' && (
          <div className="flex items-center space-x-2 text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded">
            <AlertTriangle size={16} />
            <span>该 Workflow 包含复杂控制流，建议使用高级模式</span>
          </div>
        )}
      </div>

      {/* 编辑器区域 */}
      <div className="flex-1 overflow-hidden">
        {mode === 'simple' ? (
          <SimpleListEditor workflow={workflow} onChange={onChange} />
        ) : (
          <AdvancedDAGEditor workflow={workflow} onChange={onChange} />
        )}
      </div>
    </div>
  );
};
```

**验收标准**:
- ✅ 模式切换正常
- ✅ 自动检测复杂流程
- ✅ 提示信息显示正确

---

### 3.2 Simple Mode 增强

**文件**: `NextTestPlatformUI/components/SimpleListEditor.tsx`（基于现有 StepEditor）

```typescript
const SimpleListEditor = ({ workflow, onChange }) => {
  // 已有逻辑保持不变
  // 新增：集成 DataMappingPanel

  return (
    <div className="p-6 space-y-4">
      {workflow.steps.map((step, index) => (
        <div key={step.id} className="space-y-2">
          {/* StepCard */}
          <StepCard
            step={step}
            index={index}
            previousSteps={workflow.steps.slice(0, index)}
            onChange={(updatedStep) => updateStep(index, updatedStep)}
            onDelete={() => deleteStep(index)}
          />

          {/* DataMappingPanel（可选展开） */}
          {step.showDataMapping && (
            <DataMappingPanel
              currentStep={step}
              previousSteps={workflow.steps.slice(0, index)}
              onChange={(updatedStep) => updateStep(index, updatedStep)}
            />
          )}
        </div>
      ))}

      <button onClick={addStep}>+ 添加步骤</button>
    </div>
  );
};
```

**验收标准**:
- ✅ StepCard 集成 DataMappingPanel
- ✅ 拖拽排序正常
- ✅ 嵌套步骤显示清晰

---

### 3.3 Advanced Mode DAG 编辑器

**依赖**: `npm install reactflow`

**文件**: `NextTestPlatformUI/components/AdvancedDAGEditor.tsx`

```typescript
import ReactFlow, {
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  Background,
  Controls,
  MiniMap,
} from 'reactflow';
import 'reactflow/dist/style.css';

const AdvancedDAGEditor = ({ workflow, onChange }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  // 从 workflow.steps 转换为 nodes/edges
  useEffect(() => {
    const { nodes: convertedNodes, edges: convertedEdges } =
      convertStepsToGraph(workflow.steps);
    setNodes(convertedNodes);
    setEdges(convertedEdges);
  }, [workflow.steps]);

  // 自定义节点类型
  const nodeTypes = useMemo(() => ({
    action: ActionNode,
    branch: BranchNode,
    loop: LoopNode,
    merge: MergeNode,
  }), []);

  // 处理节点连接
  const handleConnect = (connection) => {
    // 创建依赖关系
    const targetStep = workflow.steps.find(s => s.id === connection.target);
    if (targetStep) {
      onChange({
        ...workflow,
        steps: workflow.steps.map(s =>
          s.id === connection.target
            ? { ...s, dependsOn: [...(s.dependsOn || []), connection.source] }
            : s
        )
      });
    }
  };

  return (
    <div className="h-full flex">
      {/* 左侧：Action Library */}
      <div className="w-64 border-r overflow-y-auto">
        <ActionLibrarySidebar />
      </div>

      {/* 中间：DAG 画布 */}
      <div className="flex-1">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={handleConnect}
          onNodeClick={(_, node) => setSelectedNode(node)}
          nodeTypes={nodeTypes}
          fitView
        >
          <Background />
          <Controls />
          <MiniMap />
        </ReactFlow>
      </div>

      {/* 右侧：配置面板 */}
      <div className="w-96 border-l overflow-y-auto">
        {selectedNode && (
          <StepConfigPanel
            step={selectedNode.data as WorkflowStep}
            onChange={(updatedStep) => {
              // 更新 workflow
              onChange({
                ...workflow,
                steps: workflow.steps.map(s =>
                  s.id === updatedStep.id ? updatedStep : s
                )
              });
            }}
          />
        )}
      </div>
    </div>
  );
};

// 转换函数：Steps → Graph
function convertStepsToGraph(steps: WorkflowStep[]): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  steps.forEach((step, index) => {
    // 创建节点
    nodes.push({
      id: step.id,
      type: getNodeType(step),
      position: step.position || autoLayoutPosition(index, steps.length),
      data: step,
    });

    // 创建边（依赖关系）
    if (step.dependsOn) {
      step.dependsOn.forEach(depId => {
        edges.push({
          id: `${depId}-${step.id}`,
          source: depId,
          target: step.id,
          animated: true,
        });
      });
    }
  });

  return { nodes, edges };
}

// 自动布局（简单垂直排列）
function autoLayoutPosition(index: number, total: number): { x: number; y: number } {
  return {
    x: 250,
    y: index * 120 + 50,
  };
}

// 确定节点类型
function getNodeType(step: WorkflowStep): string {
  if (step.type === 'branch') return 'branch';
  if (step.loop) return 'loop';
  if (step.type === 'merge') return 'merge';
  return 'action';
}
```

**自定义节点**: `ActionNode.tsx`, `BranchNode.tsx`, `LoopNode.tsx`, `MergeNode.tsx`（简化实现）

```typescript
// ActionNode.tsx
const ActionNode = ({ data }: { data: WorkflowStep }) => {
  return (
    <div className="bg-white border-2 border-blue-400 rounded-lg p-4 min-w-[200px] shadow-md">
      <div className="flex items-center space-x-2 mb-2">
        <Package size={16} className="text-blue-600" />
        <span className="font-bold text-slate-800">{data.name}</span>
      </div>
      <div className="text-xs text-slate-500">
        {data.actionTemplateId || data.type}
      </div>
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
};
```

**验收标准**:
- ✅ DAG 图正常渲染
- ✅ 节点可拖拽
- ✅ 可创建依赖连线
- ✅ 配置面板联动
- ✅ Action Library 可拖拽添加节点

---

## 任务拆分与并行执行

### 任务组 1: Phase 1 - 数据模型统一

**Sub-agent: requirements-code**

#### Task 1.1: 前端类型统一
```
文件: types.ts
任务:
1. 完善 WorkflowStep 接口
2. 添加 DataMapper, Position 等类型
3. 添加 TestStep = WorkflowStep 别名
4. 确保编译无误
```

#### Task 1.2: StepCard 重构
```
文件: StepCard.tsx, TemplateConfigSection.tsx, InlineConfigSection.tsx
任务:
1. 添加模式检测逻辑
2. 拆分 TemplateConfigSection
3. 拆分 InlineConfigSection
4. 实现模式切换
5. 保留原有 HTTP/Command UI
```

#### Task 1.3: 后端执行器统一
```
文件: executor.go, variable_resolver.go
任务:
1. 修改 ExecuteStep 支持双模式
2. 实现 mergeConfig 函数
3. 实现 extractOutputsFromTemplate
4. 创建 VariableResolver
5. 单元测试
```

---

### 任务组 2: Phase 2 - 数据流可视化

**Sub-agent: requirements-code**

#### Task 2.1: DataMapper 组件
```
文件: DataMappingPanel.tsx, UpstreamOutputTree.tsx, CurrentInputsList.tsx
任务:
1. 三栏布局
2. 上游输出树
3. 当前输入列表
4. 拖拽逻辑
```

#### Task 2.2: 映射关系可视化
```
文件: MappingLine.tsx, TransformFunctionSelector.tsx
任务:
1. 映射线显示
2. 转换函数选择器
3. 删除/编辑功能
```

#### Task 2.3: 后端变量解析增强
```
文件: variable_resolver.go（增强）
任务:
1. 实现 ResolveStepInputs
2. 实现 resolveDataMapper
3. 集成 gjson JSONPath
4. 内置转换函数
5. 单元测试
```

---

### 任务组 3: Phase 3 - 双模式编辑器

**Sub-agent: requirements-code**

#### Task 3.1: 模式切换
```
文件: WorkflowEditor.tsx
任务:
1. 模式状态管理
2. 自动检测复杂流程
3. 切换提示
```

#### Task 3.2: Simple Mode 增强
```
文件: SimpleListEditor.tsx
任务:
1. 集成 DataMappingPanel
2. 优化嵌套显示
```

#### Task 3.3: Advanced DAG Editor
```
文件: AdvancedDAGEditor.tsx, 自定义节点
任务:
1. 安装 reactflow
2. 实现 convertStepsToGraph
3. 创建 ActionNode 等自定义节点
4. 集成 Action Library
5. 配置面板联动
```

---

## 测试计划

### 单元测试
- ✅ VariableResolver.Resolve()
- ✅ VariableResolver.ResolveDataMapper()
- ✅ Executor.ExecuteStep() 双模式
- ✅ mergeConfig()
- ✅ extractOutputs()

### 集成测试
- ✅ Template 模式端到端执行
- ✅ Inline 模式端到端执行
- ✅ DataMapper 端到端数据流
- ✅ 模式切换数据一致性

### E2E 测试
- ✅ 创建使用 Template 的测试用例
- ✅ 创建使用 Inline 的测试用例
- ✅ 使用 DataMapper 配置数据流
- ✅ Simple ↔ Advanced 模式切换

---

## 验收标准（总）

### Phase 1
- ✅ 前后端类型统一
- ✅ StepCard 双模式工作正常
- ✅ 后端执行器双模式执行成功
- ✅ 向后兼容旧数据

### Phase 2
- ✅ DataMapper 拖拽配置正常
- ✅ 三栏面板显示清晰
- ✅ JSONPath 提取正确
- ✅ 转换函数执行正确

### Phase 3
- ✅ Simple/Advanced 模式切换流畅
- ✅ DAG 图渲染清晰
- ✅ 节点拖拽/连线正常
- ✅ Action Library 集成完善

---

## 实施顺序

**第一批（并行）**:
- Task 1.1 (类型)
- Task 1.3 (后端)

**第二批（并行，依赖第一批）**:
- Task 1.2 (StepCard)
- Task 2.3 (后端解析)

**第三批（并行，依赖第二批）**:
- Task 2.1 (DataMapper)
- Task 2.2 (映射线)

**第四批（并行，依赖第三批）**:
- Task 3.1 (模式切换)
- Task 3.2 (Simple)
- Task 3.3 (DAG)

---

**文档结束**
