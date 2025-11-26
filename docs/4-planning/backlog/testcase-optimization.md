# 测试案例编辑页面优化方案

**文档版本**: v1.0
**创建日期**: 2025-11-26
**设计原则**: 第一性原理 + 用户体验优先

---

## 执行摘要

本文档从**测试工程师**和**产品设计师**的第一性原理角度，针对当前测试平台提出五大核心优化方案：

1. **三层断言系统** - 让测试工程师能表达任意复杂的验证逻辑
2. **可视化数据映射器** - 让Step间参数传递变得直观和类型安全
3. **双视图模式** - 让测试用例在列表和工作流图之间自由切换
4. **自举测试库** - 将系统API测试用例作为示例融入测试库
5. **增强执行视图** - 让用户清晰看到每个节点的执行状态和错误位置

---

## 目录

1. [当前系统分析](#1-当前系统分析)
2. [优化方案一：三层断言系统](#2-优化方案一三层断言系统)
3. [优化方案二：可视化数据映射器](#3-优化方案二可视化数据映射器)
4. [优化方案三：双视图模式](#4-优化方案三双视图模式)
5. [优化方案四：自举测试库](#5-优化方案四自举测试库)
6. [优化方案五：增强执行视图](#6-优化方案五增强执行视图)
7. [实施路线图](#7-实施路线图)
8. [技术规格](#8-技术规格)

---

## 1. 当前系统分析

### 1.1 系统现状

**组件架构**：
```
TestCaseManager
├── FolderTree (左侧导航)
├── CaseDetail (详情展示)
├── TestCaseEditor (编辑器 - 右滑70%)
│   ├── EditorSidebar (全局变量、前置条件)
│   └── StepEditor (步骤编辑)
│       ├── StepCard (基础步骤)
│       ├── LoopStepCard (循环)
│       └── BranchStepCard (分支)
└── TestRunner (执行器)
    └── ExecutionView (执行视图)
```

**关键文件**：
- 类型定义: `NextTestPlatformUI/types.ts`
- 编辑器: `NextTestPlatformUI/components/testcase/TestCaseEditor.tsx`
- 步骤卡片: `NextTestPlatformUI/components/testcase/stepEditor/StepCard.tsx`
- 执行视图: `NextTestPlatformUI/components/testcase/execution/ExecutionView.tsx`
- 后端模型: `nextest-platform/internal/models/step_execution.go`

### 1.2 核心问题

| 问题 | 影响 | 优先级 |
|------|------|--------|
| **断言系统不完整** | 无法验证复杂场景 | P0 |
| **参数传递隐式** | 容易出错，难以调试 | P0 |
| **只有列表视图** | 大型测试难以理解 | P1 |
| **执行结果不直观** | 错误定位困难 | P1 |
| **缺少测试示例** | 新用户上手困难 | P2 |

### 1.3 用户痛点

**测试工程师的痛点**：
1. "我想断言响应中的嵌套字段，但只支持简单的equals"
2. "我不知道上一步输出了什么变量，只能猜测变量名"
3. "测试有20个步骤，列表形式看不清依赖关系"
4. "执行失败了，但我要展开每个步骤才能找到错误"
5. "我想参考一些标准的API测试写法，但没有示例"

**产品设计师的痛点**：
1. "断言编辑界面缺失，用户只能手动编辑JSON"
2. "参数传递依赖变量名字符串，容易拼写错误"
3. "没有可视化的工作流图，复杂测试难以理解"
4. "执行结果只是文本日志，不够直观"

---

## 2. 优化方案一：三层断言系统

### 2.1 第一性原理分析

**断言的本质**：验证系统行为是否符合预期

**分解**：
- **被测对象** - 验证什么？（API响应、数据、状态）
- **预期结果** - 期望什么？（值、格式、范围）
- **验证规则** - 如何判断？（相等、包含、匹配）
- **失败处理** - 不符合怎么办？（中止、继续、警告）

**设计目标**：
1. **表达力** - 能描述任意复杂的验证场景
2. **可组合** - 简单断言组合成复杂逻辑
3. **可调试** - 失败时清晰指出原因
4. **可视化** - 执行时看到每个断言状态

### 2.2 三层架构设计

#### Layer 1: 原子断言（Atomic Assertions）

```typescript
// NextTestPlatformUI/types.ts 新增
interface AtomicAssertion {
  id: string;
  type: AssertionType;

  // 目标表达式（支持JSONPath）
  target: string;  // "{{response.body.user.email}}"

  // 操作符
  operator: Operator;

  // 期望值（某些operator不需要）
  expected?: any;

  // 自定义失败消息
  message?: string;

  // 严重级别
  severity?: 'error' | 'warning' | 'info';

  // 失败后是否继续
  continueOnFailure?: boolean;
}

// 断言类型
type AssertionType =
  | 'value'      // 值断言
  | 'structure'  // 结构断言
  | 'type'       // 类型断言
  | 'pattern'    // 模式断言
  | 'custom';    // 自定义脚本

// 操作符（30+种）
type Operator =
  // 相等性
  | 'equals' | 'notEquals' | 'deepEquals'
  // 比较
  | 'greaterThan' | 'greaterThanOrEqual'
  | 'lessThan' | 'lessThanOrEqual'
  // 包含
  | 'contains' | 'notContains'
  | 'startsWith' | 'endsWith'
  // 存在性
  | 'exists' | 'notExists'
  | 'isNull' | 'isNotNull'
  | 'isEmpty' | 'isNotEmpty'
  // 类型检查
  | 'isString' | 'isNumber' | 'isBoolean'
  | 'isArray' | 'isObject'
  // 模式匹配
  | 'matchesRegex' | 'matchesSchema' | 'matchesJsonPath'
  // 数组操作
  | 'arrayLength' | 'arrayContains'
  | 'arrayEvery' | 'arraySome'
  // 时间断言
  | 'before' | 'after' | 'between'
  // 数值范围
  | 'inRange' | 'notInRange';
```

**示例**：
```typescript
// 简单断言：验证状态码
{
  id: "assert-1",
  type: "value",
  target: "{{response.status}}",
  operator: "equals",
  expected: 200,
  message: "Expected HTTP 200 OK"
}

// 复杂断言：验证邮箱格式
{
  id: "assert-2",
  type: "pattern",
  target: "{{response.body.user.email}}",
  operator: "matchesRegex",
  expected: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
  message: "Invalid email format"
}

// 数组断言：验证至少有一个管理员
{
  id: "assert-3",
  type: "structure",
  target: "{{response.body.users}}",
  operator: "arraySome",
  expected: { role: "admin" },
  message: "No admin user found"
}
```

#### Layer 2: 组合断言（Composite Assertions）

```typescript
interface CompositeAssertion {
  id: string;
  logic: 'AND' | 'OR' | 'NOT';
  children: (AtomicAssertion | CompositeAssertion)[];
  message?: string;
}
```

**示例**：
```typescript
// 复杂逻辑：(状态码=200 AND 响应时间<500ms) OR (状态码=304)
{
  id: "composite-1",
  logic: "OR",
  children: [
    {
      logic: "AND",
      children: [
        { target: "{{response.status}}", operator: "equals", expected: 200 },
        { target: "{{response.time}}", operator: "lessThan", expected: 500 }
      ]
    },
    { target: "{{response.status}}", operator: "equals", expected: 304 }
  ]
}
```

#### Layer 3: 断言集（Assertion Set）

```typescript
interface AssertionSet {
  id: string;
  name: string;
  description?: string;

  // 断言列表
  assertions: (AtomicAssertion | CompositeAssertion)[];

  // 执行模式
  executeMode: 'all' | 'stopOnFirstFailure' | 'stopOnError';

  // 可复用标记
  reusable?: boolean;
  tags?: string[];
}
```

**示例**：
```typescript
// 可重用的"标准HTTP响应"断言集
{
  id: "set-standard-http",
  name: "Standard HTTP Response Validation",
  description: "验证HTTP响应的标准字段",
  executeMode: "stopOnFirstFailure",
  reusable: true,
  assertions: [
    { target: "{{response.status}}", operator: "inRange", expected: [200, 299] },
    { target: "{{response.headers['Content-Type']}}", operator: "exists" },
    { target: "{{response.body}}", operator: "isNotEmpty" }
  ]
}
```

### 2.3 UI设计：断言编辑器

#### 组件结构
```
AssertionEditor
├── AssertionSetHeader (断言集信息)
├── AssertionList (断言列表)
│   ├── AtomicAssertionCard (原子断言卡片)
│   │   ├── TargetInput (目标选择器 + JSONPath辅助)
│   │   ├── OperatorSelect (操作符下拉)
│   │   ├── ExpectedValueInput (期望值输入)
│   │   └── AdvancedOptions (高级选项)
│   └── CompositeAssertionCard (组合断言卡片)
│       ├── LogicSelector (AND/OR/NOT)
│       └── ChildAssertionList (子断言)
└── AssertionToolbar (工具栏)
    ├── AddAssertionButton
    ├── ImportAssertionSetButton
    └── TestAssertionsButton
```

#### 视觉设计
```
┌─────────────────────────────────────────────────────────┐
│ Assertions (3)                    [+ Add] [Import] [Test]│
├─────────────────────────────────────────────────────────┤
│ ┌─ Assertion 1 ──────────────────────────── [↑][↓][×]  │
│ │ Type: Value  │ Severity: Error  ✓ Continue on failure│
│ │                                                        │
│ │ Target:  [{{response.status}}        ▼] 🔍           │
│ │          Available: response.status, response.body... │
│ │                                                        │
│ │ Operator: [equals                     ▼]             │
│ │                                                        │
│ │ Expected: [200                         ]             │
│ │                                                        │
│ │ Message:  [Expected HTTP 200 OK        ]             │
│ └────────────────────────────────────────────────────────┘
│                                                          │
│ ┌─ Assertion 2 (Composite) ────────────── [↑][↓][×]    │
│ │ Logic: [AND ▼]                                        │
│ │                                                        │
│ │ ├─ Child 1: response.body.user.email exists          │
│ │ └─ Child 2: response.body.user.role equals "admin"   │
│ │                                          [+ Add Child]│
│ └────────────────────────────────────────────────────────┘
│                                                          │
│ ┌─ Assertion 3 ──────────────────────────────────────  │
│ │ Type: Pattern │ Severity: Warning                     │
│ │ Target: {{response.body.email}}                       │
│ │ Operator: matchesRegex                                │
│ │ Pattern: ^[a-z0-9]+@[a-z]+\.[a-z]{2,}$              │
│ └────────────────────────────────────────────────────────┘
└─────────────────────────────────────────────────────────┘
```

#### 智能辅助功能

**1. 变量智能提示**
```typescript
// 在Target输入框中输入 {{ 时触发
<VariableSuggestionDropdown
  variables={getContextVariables(stepIndex)}
  onSelect={(variable) => insertVariable(variable)}
/>
```

**2. JSONPath构建器**
```
Response Structure:
{
  status: 200,
  body: {
    user: {
      id: 123,
      email: "test@example.com"
    }
  }
}

JSONPath Builder:
☐ response
  ☑ status
  ☑ body
    ☑ user
      ☑ id
      ☑ email

Generated Path: response.body.user.email
```

**3. 断言模板库**
```typescript
const assertionTemplates = [
  {
    name: "HTTP 2xx Success",
    template: {
      target: "{{response.status}}",
      operator: "inRange",
      expected: [200, 299]
    }
  },
  {
    name: "Response Time < 1s",
    template: {
      target: "{{response.time}}",
      operator: "lessThan",
      expected: 1000
    }
  },
  {
    name: "JSON Schema Validation",
    template: {
      target: "{{response.body}}",
      operator: "matchesSchema",
      expected: { /* JSON Schema */ }
    }
  }
];
```

### 2.4 后端实现

#### 断言执行引擎

```go
// nextest-platform/internal/workflow/assertion_executor.go
package workflow

type AssertionExecutor struct {
    resolver *VariableResolver
}

func (e *AssertionExecutor) ExecuteAssertions(
    assertions []Assertion,
    ctx *ExecutionContext,
) []AssertionResult {
    results := make([]AssertionResult, 0)

    for _, assertion := range assertions {
        switch assertion.Type {
        case "atomic":
            result := e.executeAtomic(assertion, ctx)
            results = append(results, result)

        case "composite":
            result := e.executeComposite(assertion, ctx)
            results = append(results, result)
        }

        // 检查是否需要停止执行
        if !result.Passed && assertion.ContinueOnFailure == false {
            break
        }
    }

    return results
}

func (e *AssertionExecutor) executeAtomic(
    assertion AtomicAssertion,
    ctx *ExecutionContext,
) AssertionResult {
    // 1. 解析目标值
    actualValue := e.resolver.Resolve(assertion.Target, ctx)

    // 2. 根据操作符执行验证
    passed := false
    switch assertion.Operator {
    case "equals":
        passed = actualValue == assertion.Expected
    case "greaterThan":
        passed = compareValues(actualValue, assertion.Expected) > 0
    case "matchesRegex":
        regex := regexp.MustCompile(assertion.Expected.(string))
        passed = regex.MatchString(actualValue.(string))
    // ... 其他30+操作符
    }

    return AssertionResult{
        ID:       assertion.ID,
        Type:     assertion.Operator,
        Target:   assertion.Target,
        Expected: assertion.Expected,
        Actual:   actualValue,
        Passed:   passed,
        Message:  generateMessage(assertion, actualValue, passed),
    }
}
```

#### 操作符实现

```go
// nextest-platform/internal/workflow/assertion_operators.go
type OperatorFunc func(actual, expected interface{}) (bool, error)

var operators = map[string]OperatorFunc{
    "equals": func(actual, expected interface{}) (bool, error) {
        return actual == expected, nil
    },

    "matchesRegex": func(actual, expected interface{}) (bool, error) {
        str, ok := actual.(string)
        if !ok {
            return false, fmt.Errorf("actual value is not a string")
        }
        regex, err := regexp.Compile(expected.(string))
        if err != nil {
            return false, err
        }
        return regex.MatchString(str), nil
    },

    "arrayContains": func(actual, expected interface{}) (bool, error) {
        arr, ok := actual.([]interface{})
        if !ok {
            return false, fmt.Errorf("actual value is not an array")
        }
        for _, item := range arr {
            if reflect.DeepEqual(item, expected) {
                return true, nil
            }
        }
        return false, nil
    },

    // ... 实现所有30+操作符
}
```

### 2.5 执行结果展示

#### AssertionResultPanel组件

```typescript
// NextTestPlatformUI/components/testcase/execution/AssertionResultPanel.tsx
interface AssertionResultPanelProps {
  assertions: AssertionResult[];
  expanded?: boolean;
}

export const AssertionResultPanel: React.FC<AssertionResultPanelProps> = ({
  assertions,
  expanded = false
}) => {
  const passedCount = assertions.filter(a => a.passed).length;
  const failedCount = assertions.length - passedCount;

  return (
    <div className="bg-white rounded-lg border border-slate-200">
      {/* 头部统计 */}
      <div className="px-4 py-3 border-b border-slate-200 flex justify-between items-center">
        <h4 className="font-semibold text-slate-700">
          Assertions ({passedCount}/{assertions.length} passed)
        </h4>
        {failedCount > 0 && (
          <span className="px-2 py-1 bg-red-50 text-red-700 text-xs rounded">
            {failedCount} failed
          </span>
        )}
      </div>

      {/* 断言列表 */}
      <div className="divide-y divide-slate-100">
        {assertions.map((assertion, idx) => (
          <AssertionResultCard key={idx} assertion={assertion} />
        ))}
      </div>
    </div>
  );
};
```

#### 视觉设计

```
┌─────────────────────────────────────────────────┐
│ Assertions (2/3 passed)              [1 failed] │
├─────────────────────────────────────────────────┤
│ ✓ Assertion 1: response.status equals 200      │
│   Actual: 200 │ Expected: 200                   │
│   Duration: 2ms                                 │
├─────────────────────────────────────────────────┤
│ ✗ Assertion 2: response.body.user.email exists │
│   Actual: undefined │ Expected: <exists>        │
│   Error: Property 'email' not found in object   │
│   Duration: 1ms                                 │
├─────────────────────────────────────────────────┤
│ ✓ Assertion 3 (Composite): AND                 │
│   ├─ ✓ response.body.users.length > 0          │
│   └─ ✓ response.body.users[0].role = "admin"   │
│   Duration: 3ms                                 │
└─────────────────────────────────────────────────┘
```

---

## 3. 优化方案二：可视化数据映射器

### 3.1 第一性原理分析

**参数传递的本质**：数据在Step之间流动

**问题**：
- 当前通过字符串变量名引用 `{{variableName}}`
- 容易拼写错误
- 无类型检查
- 不知道变量的来源和去向

**解决方案**：将数据流显式化、可视化

### 3.2 数据绑定模型

```typescript
// NextTestPlatformUI/types.ts 新增
interface DataBinding {
  id: string;

  // 源数据
  sourceStepId: string;      // "step-login"
  sourcePath: string;         // JSONPath: "response.body.token"
  sourceType?: DataType;      // 推断或手动指定

  // 目标参数
  targetStepId: string;       // "step-get-profile"
  targetParam: string;        // "authToken"
  targetType?: DataType;      // 期望类型

  // 数据转换（可选）
  transform?: DataTransform;

  // 默认值（源数据不存在时）
  defaultValue?: any;

  // 是否必需
  required?: boolean;

  // 验证规则
  validation?: ValidationRule;
}

type DataType =
  | 'string' | 'number' | 'boolean'
  | 'array' | 'object' | 'null'
  | 'any';

interface DataTransform {
  type: 'function' | 'template' | 'script';

  // 内置函数
  function?: BuiltInFunction;
  functionArgs?: any[];

  // 模板字符串
  template?: string;  // "Bearer {{token}}"

  // 自定义脚本
  script?: string;    // "(value) => value.toUpperCase()"
}

type BuiltInFunction =
  | 'uppercase' | 'lowercase' | 'trim'
  | 'parseInt' | 'parseFloat' | 'toString'
  | 'jsonParse' | 'jsonStringify'
  | 'split' | 'join' | 'replace'
  | 'base64Encode' | 'base64Decode'
  | 'urlEncode' | 'urlDecode'
  | 'hash' | 'uuid';

interface ValidationRule {
  type: 'regex' | 'range' | 'length' | 'custom';
  rule: any;
  errorMessage?: string;
}
```

### 3.3 UI设计：可视化数据映射器

#### 双Panel设计

```
┌──────────────────────────────────────────────────────────┐
│          Data Mapper - Step 1 → Step 2                   │
│ [Auto Map] [Clear All] [Validate]           [Close]      │
├────────────────────────┬─────────────────────────────────┤
│ Source: Step 1 (Login) │      Target: Step 2 (Profile)  │
├────────────────────────┼─────────────────────────────────┤
│ Outputs:               │                    Inputs:      │
│                        │                                 │
│ ○ userId               │●─────────────────>○ userId      │
│   Type: number         │                    Required     │
│   Value: 12345         │                                 │
│                        │                                 │
│ ○ authToken            │●─[Transform]────>○ auth         │
│   Type: string         │   "Bearer {{v}}"   Required     │
│   Value: "abc123..."   │                                 │
│                        │                                 │
│ ○ email                │                  ○ userEmail    │
│   Type: string         │                    Optional     │
│   Value: "test@..."    │                                 │
│                        │                                 │
│ ○ metadata             │                                 │
│   Type: object         │                                 │
│                        │                                 │
├────────────────────────┴─────────────────────────────────┤
│ 📊 Mapping Summary: 2 mapped, 1 unmapped                │
│ ⚠️  Warning: 'userEmail' is optional but not mapped     │
└──────────────────────────────────────────────────────────┘
```

#### 交互方式

**1. 自动映射**
```typescript
function autoMapDataBindings(
  sourceOutputs: Record<string, DataType>,
  targetInputs: Record<string, DataType>
): DataBinding[] {
  const bindings: DataBinding[] = [];

  for (const [targetParam, targetType] of Object.entries(targetInputs)) {
    // 完全匹配
    if (sourceOutputs[targetParam]) {
      bindings.push({
        id: generateId(),
        sourceStepId: sourceStep.id,
        sourcePath: targetParam,
        targetStepId: targetStep.id,
        targetParam: targetParam,
      });
      continue;
    }

    // 模糊匹配（相似度 > 0.8）
    const bestMatch = findBestMatch(targetParam, Object.keys(sourceOutputs));
    if (bestMatch.similarity > 0.8) {
      bindings.push({
        id: generateId(),
        sourceStepId: sourceStep.id,
        sourcePath: bestMatch.key,
        targetStepId: targetStep.id,
        targetParam: targetParam,
      });
    }
  }

  return bindings;
}
```

**2. 拖拽连接**
```typescript
<Draggable
  draggableId={`source-${outputName}`}
  onDragEnd={(result) => {
    if (result.destination?.droppableId.startsWith('target-')) {
      createBinding(outputName, result.destination.droppableId);
    }
  }}
>
  <OutputCircle />
</Draggable>
```

**3. 添加转换**
```typescript
<BindingLine
  binding={binding}
  onRightClick={(e) => {
    showContextMenu(e, [
      { label: 'Add Transform', onClick: () => openTransformEditor(binding) },
      { label: 'Set Default Value', onClick: () => openDefaultValueEditor(binding) },
      { label: 'Add Validation', onClick: () => openValidationEditor(binding) },
      { label: 'Delete Binding', onClick: () => deleteBinding(binding.id) }
    ]);
  }}
/>
```

**4. 类型校验**
```typescript
function validateBinding(binding: DataBinding): ValidationResult {
  // 检查类型兼容性
  if (binding.sourceType && binding.targetType) {
    if (!isTypeCompatible(binding.sourceType, binding.targetType)) {
      return {
        valid: false,
        error: `Type mismatch: ${binding.sourceType} → ${binding.targetType}`,
        suggestion: `Add transform to convert ${binding.sourceType} to ${binding.targetType}`
      };
    }
  }

  return { valid: true };
}

// 可视化：类型不匹配时连接线显示为红色
<ConnectionLine
  color={validation.valid ? 'green' : 'red'}
  dashArray={validation.valid ? 'none' : '5,5'}
/>
```

### 3.4 转换函数编辑器

```
┌─────────────────────────────────────────────────┐
│ Transform Editor                      [Save][×] │
├─────────────────────────────────────────────────┤
│ Source: authToken (string)                      │
│ Target: auth (string)                           │
│                                                 │
│ Transform Type: [Template ▼]                   │
│                                                 │
│ Template:                                       │
│ ┌─────────────────────────────────────────────┐ │
│ │ Bearer {{value}}                            │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ Preview:                                        │
│ Input:  "abc123xyz"                            │
│ Output: "Bearer abc123xyz"                     │
│                                                 │
│ ── Other Transform Types ─────────────────────  │
│ • Function: [uppercase ▼]                      │
│ • Script:   (value) => { return value.trim() } │
└─────────────────────────────────────────────────┘
```

### 3.5 集成到StepCard

```typescript
// StepCard中新增数据映射按钮
<div className="step-card-header">
  <h4>{step.summary}</h4>
  <div className="actions">
    <button onClick={() => openDataMapper(step)}>
      <Network size={16} />
      Data Mapping
    </button>
  </div>
</div>

// 显示当前的映射状态
<div className="data-bindings-summary">
  <h5>Input Bindings ({bindings.length})</h5>
  {bindings.map(binding => (
    <div className="binding-chip">
      {binding.sourcePath} → {binding.targetParam}
      {binding.transform && <Transform size={12} />}
    </div>
  ))}
</div>
```

### 3.6 后端支持

```go
// nextest-platform/internal/workflow/data_mapper.go
type DataBinding struct {
    ID string `json:"id"`

    SourceStepID string `json:"sourceStepId"`
    SourcePath   string `json:"sourcePath"`
    SourceType   string `json:"sourceType,omitempty"`

    TargetStepID string `json:"targetStepId"`
    TargetParam  string `json:"targetParam"`
    TargetType   string `json:"targetType,omitempty"`

    Transform    *DataTransform    `json:"transform,omitempty"`
    DefaultValue interface{}       `json:"defaultValue,omitempty"`
    Required     bool              `json:"required"`
    Validation   *ValidationRule   `json:"validation,omitempty"`
}

func (e *Executor) applyDataBindings(
    step *WorkflowStep,
    ctx *ExecutionContext,
) error {
    for _, binding := range step.DataBindings {
        // 1. 从源步骤提取数据
        sourceData := ctx.GetStepOutput(binding.SourceStepID)
        value := extractValue(sourceData, binding.SourcePath)

        // 2. 应用转换
        if binding.Transform != nil {
            value = applyTransform(value, binding.Transform)
        }

        // 3. 验证
        if binding.Validation != nil {
            if err := validate(value, binding.Validation); err != nil {
                return err
            }
        }

        // 4. 设置到目标参数
        ctx.SetVariable(binding.TargetParam, value)
    }

    return nil
}
```

---

## 4. 优化方案三：双视图模式

### 4.1 第一性原理分析

**测试用例的本质**：一个有向无环图（DAG）
- 节点 = Step
- 边 = 数据依赖或执行顺序
- 分支 = 条件判断
- 循环 = 迭代结构

**用户需求**：
1. **编辑时** - 需要看清整体结构和依赖关系
2. **执行时** - 需要追踪执行路径和错误位置
3. **调试时** - 需要对比预期路径和实际路径

**解决方案**：提供多种视图模式

### 4.2 三种视图模式

```typescript
type ViewMode = 'list' | 'workflow' | 'timeline';

interface ViewModeConfig {
  mode: ViewMode;
  label: string;
  icon: React.ReactNode;
  description: string;
  bestFor: string[];
}

const VIEW_MODES: ViewModeConfig[] = [
  {
    mode: 'list',
    label: 'List View',
    icon: <List />,
    description: '传统列表视图，显示步骤详情',
    bestFor: ['详细配置', '参数编辑', '小型测试']
  },
  {
    mode: 'workflow',
    label: 'Workflow View',
    icon: <Workflow />,
    description: 'DAG图形视图，显示数据流和依赖',
    bestFor: ['理解结构', '可视化依赖', '大型测试']
  },
  {
    mode: 'timeline',
    label: 'Timeline View',
    icon: <Clock />,
    description: '时间轴视图，显示执行顺序和耗时',
    bestFor: ['性能分析', '执行追踪', '调试']
  }
];
```

### 4.3 Workflow View设计

#### 节点类型

```typescript
interface WorkflowNode {
  id: string;
  type: 'start' | 'step' | 'loop' | 'branch' | 'end';

  // 位置（自动布局）
  position: { x: number; y: number };

  // 步骤数据
  step?: TestStep;

  // 执行状态（执行视图时）
  execution?: {
    status: 'pending' | 'running' | 'passed' | 'failed' | 'skipped';
    startTime?: Date;
    endTime?: Date;
    duration?: number;
    error?: string;
  };

  // 视觉样式
  style?: NodeStyle;
}

interface WorkflowEdge {
  id: string;
  source: string;
  target: string;

  // 边类型
  type: 'sequence' | 'data' | 'condition' | 'loop';

  // 条件标签（condition类型）
  label?: string;

  // 数据绑定（data类型）
  bindings?: DataBinding[];

  // 执行状态
  executed?: boolean;
}
```

#### 布局算法

```typescript
// 使用Dagre算法进行自动布局
import dagre from 'dagre';

function autoLayoutNodes(
  nodes: WorkflowNode[],
  edges: WorkflowEdge[]
): WorkflowNode[] {
  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: 'TB', nodesep: 80, ranksep: 100 });
  g.setDefaultEdgeLabel(() => ({}));

  // 添加节点
  nodes.forEach(node => {
    g.setNode(node.id, {
      width: getNodeWidth(node.type),
      height: getNodeHeight(node.type)
    });
  });

  // 添加边
  edges.forEach(edge => {
    g.setEdge(edge.source, edge.target);
  });

  // 计算布局
  dagre.layout(g);

  // 更新节点位置
  return nodes.map(node => ({
    ...node,
    position: g.node(node.id)
  }));
}
```

#### 视觉设计

```
┌──────────────────────────────────────────────────────────┐
│ Test Case: User Registration Flow                        │
│ [List] [Workflow] [Timeline]              [Zoom: 100%]   │
├──────────────────────────────────────────────────────────┤
│                                                          │
│                   [Start]                                │
│                      │                                   │
│                      ↓                                   │
│            ┌──────────────────┐   ✓ passed              │
│            │   Step 1:        │   120ms                  │
│            │   POST /register │                          │
│            │                  │                          │
│            └────────┬─────────┘                          │
│                     │ token                              │
│                     ↓                                    │
│            ┌──────────────────┐   ✗ failed              │
│            │   Step 2:        │   Error: 401            │
│            │   GET /profile   │   Expected: 200         │
│            │                  │   Actual: 401           │
│            └────────┬─────────┘                          │
│                     │                                    │
│                     ↓                                    │
│                  [End]                                   │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

#### 节点样式（基于状态）

```typescript
const NODE_STYLES: Record<string, React.CSSProperties> = {
  pending: {
    backgroundColor: '#f8fafc',
    borderColor: '#cbd5e1',
    color: '#64748b'
  },
  running: {
    backgroundColor: '#dbeafe',
    borderColor: '#3b82f6',
    color: '#1e40af',
    animation: 'pulse 2s infinite'
  },
  passed: {
    backgroundColor: '#d1fae5',
    borderColor: '#10b981',
    color: '#065f46'
  },
  failed: {
    backgroundColor: '#fee2e2',
    borderColor: '#ef4444',
    color: '#991b1b'
  },
  skipped: {
    backgroundColor: '#fef3c7',
    borderColor: '#f59e0b',
    color: '#92400e'
  }
};
```

#### 复杂控制流可视化

**循环节点**：
```
        ┌──────────────────┐
        │   Loop: users    │
        │   (3 iterations) │
        └────────┬─────────┘
                 │
       ┌─────────┼─────────┐
       │         │         │
   Iter 1    Iter 2    Iter 3
     ✓         ✓         ✗
  (120ms)   (115ms)   (Error)
       │         │         │
       └─────────┴─────────┘
                 │
                 ↓
```

**分支节点**：
```
        ┌──────────────────┐
        │   Branch:        │
        │   if status=200  │
        └────────┬─────────┘
                 │
         ┌───────┴───────┐
         │               │
    if true         if false
   (executed)      (not executed)
         │               │
         ↓               ↓
   [Step A]         [Step B]
     ✓ passed        (skipped)
```

### 4.4 Timeline View设计

```
┌──────────────────────────────────────────────────────────┐
│ Timeline View - Total Duration: 2.5s                     │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ 0s                1s                2s               3s │
│ ├─────────────────┼─────────────────┼─────────────────┤ │
│                                                          │
│ Step 1: Login                                           │
│ █████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   │
│ 0ms ────────────────────── 450ms                        │
│ Status: Passed ✓                                        │
│                                                          │
│ Step 2: Get Profile                                     │
│         ███████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   │
│         450ms ────────── 720ms                          │
│ Status: Passed ✓                                        │
│                                                          │
│ Step 3: Update Settings                                 │
│                 ████████████████░░░░░░░░░░░░░░░░░░░░░   │
│                 720ms ────────────────── 1.5s           │
│ Status: Failed ✗ (Assertion failed)                    │
│                                                          │
│ Step 4: Logout (skipped due to failure)                │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### 4.5 视图切换实现

```typescript
// NextTestPlatformUI/components/testcase/ViewModeSwitcher.tsx
interface ViewModeSwitcherProps {
  currentMode: ViewMode;
  onChange: (mode: ViewMode) => void;
  testCase: TestCase;
  execution?: TestExecution;
}

export const ViewModeSwitcher: React.FC<ViewModeSwitcherProps> = ({
  currentMode,
  onChange,
  testCase,
  execution
}) => {
  return (
    <div className="view-mode-switcher">
      {VIEW_MODES.map(config => (
        <button
          key={config.mode}
          className={`mode-button ${currentMode === config.mode ? 'active' : ''}`}
          onClick={() => onChange(config.mode)}
          title={config.description}
        >
          {config.icon}
          <span>{config.label}</span>
        </button>
      ))}
    </div>
  );
};

// 在CaseDetail和ExecutionView中集成
<ViewModeSwitcher
  currentMode={viewMode}
  onChange={setViewMode}
  testCase={testCase}
  execution={executionData}
/>

{viewMode === 'list' && <ListView steps={testCase.steps} />}
{viewMode === 'workflow' && <WorkflowView steps={testCase.steps} execution={executionData} />}
{viewMode === 'timeline' && <TimelineView execution={executionData} />}
```

### 4.6 交互增强

**1. 节点点击**
```typescript
<WorkflowNode
  node={node}
  onClick={() => {
    if (isEditMode) {
      openStepEditor(node.step);
    } else {
      showExecutionDetails(node.execution);
    }
  }}
/>
```

**2. 缩放和平移**
```typescript
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';

<TransformWrapper
  initialScale={1}
  minScale={0.5}
  maxScale={3}
>
  <TransformComponent>
    <WorkflowCanvas nodes={nodes} edges={edges} />
  </TransformComponent>
</TransformWrapper>
```

**3. 执行路径高亮**
```typescript
// 高亮已执行的路径
<WorkflowEdge
  edge={edge}
  style={{
    stroke: edge.executed ? '#10b981' : '#e5e7eb',
    strokeWidth: edge.executed ? 3 : 1,
    opacity: edge.executed ? 1 : 0.3
  }}
/>
```

**4. 错误定位**
```typescript
// 自动滚动到失败的节点
useEffect(() => {
  const failedNode = nodes.find(n => n.execution?.status === 'failed');
  if (failedNode) {
    scrollToNode(failedNode.id);
    highlightNode(failedNode.id, 'error');
  }
}, [execution]);
```

---

## 5. 优化方案四：自举测试库

### 5.1 设计理念

**"吃自己的狗粮"（Dogfooding）**：
- 测试平台的API本身就是最好的测试示例
- 通过自测保证平台质量
- 为用户提供真实可用的参考

### 5.2 测试模板架构

```typescript
// NextTestPlatformUI/types.ts 新增
interface TestTemplate {
  id: string;

  // 分类
  category: 'system' | 'example' | 'user';
  subcategory: string;  // "API-CRUD", "Workflow", "Authentication"

  // 基本信息
  name: string;
  description: string;
  tags: string[];
  icon?: string;

  // 模板定义
  testCase: TestCase;

  // 可配置参数
  parameters?: TemplateParameter[];

  // 使用文档
  usage?: string;
  prerequisites?: string[];
  expectedResult?: string;

  // 权限
  readonly: boolean;
  visibility: 'public' | 'private';

  // 元数据
  author?: string;
  createdAt?: Date;
  usageCount?: number;
  rating?: number;
}

interface TemplateParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'json' | 'select';
  description: string;
  defaultValue?: any;
  placeholder?: string;
  options?: string[];  // for type='select'
  required?: boolean;
  validation?: {
    pattern?: string;
    min?: number;
    max?: number;
  };
}
```

### 5.3 系统测试模板（Self-Testing）

#### 模板1：创建测试用例
```typescript
const CREATE_TEST_CASE_TEMPLATE: TestTemplate = {
  id: "sys-create-test",
  category: "system",
  subcategory: "API-CRUD",
  name: "Create Test Case",
  description: "测试创建测试用例的API",
  tags: ["api", "crud", "post"],
  testCase: {
    title: "Create Test Case via API",
    description: "Validates POST /api/v2/tests endpoint",
    steps: [
      {
        id: "step-1",
        summary: "Create a new test case",
        type: "http",
        config: {
          method: "POST",
          url: "{{baseUrl}}/api/v2/tests",
          headers: {
            "Content-Type": "application/json"
          },
          body: {
            name: "{{testName}}",
            description: "{{testDescription}}",
            projectId: "{{projectId}}",
            status: "ACTIVE"
          }
        },
        outputs: {
          testId: "response.body.testId",
          createdAt: "response.body.createdAt"
        },
        assertions: [
          {
            type: "value",
            target: "{{response.status}}",
            operator: "equals",
            expected: 201
          },
          {
            type: "structure",
            target: "{{response.body.testId}}",
            operator: "exists"
          }
        ]
      }
    ],
    variables: {
      baseUrl: "http://localhost:8090",
      projectId: "default"
    }
  },
  parameters: [
    {
      name: "testName",
      type: "string",
      description: "测试用例名称",
      defaultValue: "Sample Test",
      required: true
    },
    {
      name: "testDescription",
      type: "string",
      description: "测试用例描述",
      defaultValue: "This is a sample test case",
      required: false
    }
  ],
  readonly: true,
  visibility: "public"
};
```

#### 模板2：完整CRUD流程
```typescript
const CRUD_WORKFLOW_TEMPLATE: TestTemplate = {
  id: "sys-crud-workflow",
  category: "system",
  subcategory: "Workflow",
  name: "Complete CRUD Workflow",
  description: "测试完整的CRUD生命周期",
  testCase: {
    title: "Test Case CRUD Lifecycle",
    steps: [
      {
        id: "create",
        summary: "Create test case",
        type: "http",
        config: {
          method: "POST",
          url: "{{baseUrl}}/api/v2/tests",
          body: { name: "Temp Test", status: "ACTIVE" }
        },
        outputs: { testId: "response.body.testId" }
      },
      {
        id: "read",
        summary: "Read created test case",
        type: "http",
        config: {
          method: "GET",
          url: "{{baseUrl}}/api/v2/tests/{{testId}}"
        },
        assertions: [
          { target: "{{response.status}}", operator: "equals", expected: 200 },
          { target: "{{response.body.name}}", operator: "equals", expected: "Temp Test" }
        ]
      },
      {
        id: "update",
        summary: "Update test case",
        type: "http",
        config: {
          method: "PUT",
          url: "{{baseUrl}}/api/v2/tests/{{testId}}",
          body: { name: "Updated Test" }
        }
      },
      {
        id: "verify-update",
        summary: "Verify update",
        type: "http",
        config: {
          method: "GET",
          url: "{{baseUrl}}/api/v2/tests/{{testId}}"
        },
        assertions: [
          { target: "{{response.body.name}}", operator: "equals", expected: "Updated Test" }
        ]
      },
      {
        id: "delete",
        summary: "Delete test case",
        type: "http",
        config: {
          method: "DELETE",
          url: "{{baseUrl}}/api/v2/tests/{{testId}}"
        },
        assertions: [
          { target: "{{response.status}}", operator: "equals", expected: 204 }
        ]
      },
      {
        id: "verify-delete",
        summary: "Verify deletion",
        type: "http",
        config: {
          method: "GET",
          url: "{{baseUrl}}/api/v2/tests/{{testId}}"
        },
        assertions: [
          { target: "{{response.status}}", operator: "equals", expected: 404 }
        ]
      }
    ]
  },
  readonly: true,
  visibility: "public"
};
```

### 5.4 示例模板库

```typescript
const EXAMPLE_TEMPLATES: TestTemplate[] = [
  // HTTP基础
  {
    id: "ex-http-get",
    category: "example",
    subcategory: "HTTP-Basics",
    name: "Simple GET Request",
    description: "最简单的HTTP GET请求示例",
    testCase: {
      steps: [{
        type: "http",
        config: { method: "GET", url: "https://api.example.com/users" }
      }]
    }
  },

  // 认证流程
  {
    id: "ex-auth-flow",
    category: "example",
    subcategory: "Authentication",
    name: "Login and Protected Request",
    description: "登录并访问受保护资源",
    testCase: {
      steps: [
        {
          summary: "Login",
          config: { method: "POST", url: "/auth/login", body: { username: "{{user}}", password: "{{pass}}" } },
          outputs: { token: "response.body.token" }
        },
        {
          summary: "Access protected resource",
          config: { method: "GET", url: "/api/profile", headers: { "Authorization": "Bearer {{token}}" } }
        }
      ]
    },
    parameters: [
      { name: "user", type: "string", defaultValue: "testuser" },
      { name: "pass", type: "string", defaultValue: "password123" }
    ]
  },

  // 数据流
  {
    id: "ex-data-chain",
    category: "example",
    subcategory: "Data-Flow",
    name: "Chained Requests",
    description: "演示如何在步骤间传递数据",
    testCase: {
      steps: [
        {
          summary: "Get user ID",
          outputs: { userId: "response.body.id" }
        },
        {
          summary: "Get user details",
          config: { url: "/users/{{userId}}" }
        },
        {
          summary: "Get user posts",
          config: { url: "/users/{{userId}}/posts" }
        }
      ]
    }
  },

  // 循环
  {
    id: "ex-loop-array",
    category: "example",
    subcategory: "Advanced-Patterns",
    name: "Loop Over Array",
    description: "遍历数组并对每个元素执行操作",
    testCase: {
      variables: { userIds: [1, 2, 3, 4, 5] },
      steps: [{
        type: "loop",
        loopConfig: {
          source: "{{userIds}}",
          itemVar: "userId"
        },
        children: [{
          summary: "Process user {{userId}}",
          config: { method: "GET", url: "/users/{{userId}}" }
        }]
      }]
    }
  }
];
```

### 5.5 UI设计：模板库浏览器

```
┌──────────────────────────────────────────────────────────┐
│ Test Template Library                    [Search...] 🔍  │
├─────────────────┬────────────────────────────────────────┤
│ Categories      │                                        │
│                 │                                        │
│ ▼ System Tests  │  ┌─────────────────────────────────┐  │
│   • API CRUD    │  │ Create Test Case               │  │
│   • Workflow    │  │ System | API-CRUD | 1.2k uses  │  │
│   • WebSocket   │  │ ─────────────────────────────── │  │
│                 │  │ Validates POST /api/v2/tests   │  │
│ ▼ Examples      │  │ endpoint and response format   │  │
│   • HTTP Basics │  │                                 │  │
│   • Auth        │  │ [Preview] [Use Template] ⭐4.8  │  │
│   • Data Flow   │  └─────────────────────────────────┘  │
│   • Advanced    │                                        │
│                 │  ┌─────────────────────────────────┐  │
│ ▼ My Templates  │  │ Complete CRUD Workflow         │  │
│   (3)           │  │ System | Workflow | 856 uses   │  │
│                 │  │ ─────────────────────────────── │  │
│                 │  │ Tests full lifecycle: Create → │  │
│                 │  │ Read → Update → Delete → Verify │  │
│ [+ New Template]│  │                                 │  │
│                 │  │ [Preview] [Use Template] ⭐4.9  │  │
│                 │  └─────────────────────────────────┘  │
│                 │                                        │
└─────────────────┴────────────────────────────────────────┘
```

### 5.6 模板使用流程

```typescript
// 1. 选择模板
<TemplateCard
  template={template}
  onUse={() => openTemplateWizard(template)}
/>

// 2. 填写参数
<TemplateWizard
  template={template}
  onComplete={(params) => {
    const testCase = instantiateTemplate(template, params);
    createTestCase(testCase);
  }}
/>

// 3. 实例化模板
function instantiateTemplate(
  template: TestTemplate,
  params: Record<string, any>
): TestCase {
  let testCaseJson = JSON.stringify(template.testCase);

  // 替换所有参数
  template.parameters?.forEach(param => {
    const value = params[param.name] ?? param.defaultValue;
    testCaseJson = testCaseJson.replace(
      new RegExp(`{{${param.name}}}`, 'g'),
      JSON.stringify(value)
    );
  });

  return JSON.parse(testCaseJson);
}
```

### 5.7 后端API

```go
// nextest-platform/internal/handler/template_handler.go
type TemplateHandler struct {
    templateRepo repository.TemplateRepository
}

// GET /api/v2/templates
func (h *TemplateHandler) ListTemplates(c *gin.Context) {
    category := c.Query("category")
    subcategory := c.Query("subcategory")
    search := c.Query("q")

    templates, err := h.templateRepo.List(category, subcategory, search)
    if err != nil {
        c.JSON(500, gin.H{"error": err.Error()})
        return
    }

    c.JSON(200, templates)
}

// GET /api/v2/templates/:id
func (h *TemplateHandler) GetTemplate(c *gin.Context) {
    id := c.Param("id")

    template, err := h.templateRepo.GetByID(id)
    if err != nil {
        c.JSON(404, gin.H{"error": "Template not found"})
        return
    }

    c.JSON(200, template)
}

// POST /api/v2/templates/:id/instantiate
func (h *TemplateHandler) InstantiateTemplate(c *gin.Context) {
    id := c.Param("id")
    var params map[string]interface{}

    if err := c.ShouldBindJSON(&params); err != nil {
        c.JSON(400, gin.H{"error": err.Error()})
        return
    }

    template, _ := h.templateRepo.GetByID(id)
    testCase := instantiateTemplate(template, params)

    c.JSON(200, testCase)
}
```

---

## 6. 优化方案五：增强执行视图

### 6.1 执行视图增强目标

1. **一眼看清全局** - 整体进度、成功/失败统计
2. **快速定位错误** - 失败节点高亮、错误摘要
3. **详细错误信息** - Request/Response、断言结果
4. **变量追踪** - 变量创建、修改、使用的完整历程

### 6.2 增强的ExecutionView设计

```
┌──────────────────────────────────────────────────────────┐
│ Execution: run-20231126-001          [List][Workflow][⏱]│
├──────────────────────────────────────────────────────────┤
│ ┌──────────────────────────────────────────────────────┐ │
│ │ Summary                                              │ │
│ │ Status: Failed ✗ | Duration: 2.5s | Steps: 3/5      │ │
│ │ ██████████████████░░░░░░░░░░░░░░░░░░░░░░░░ 60%      │ │
│ │ ✓ 2 passed  ✗ 1 failed  ○ 2 skipped                 │ │
│ └──────────────────────────────────────────────────────┘ │
│                                                          │
│ ┌──────────────────────────────────────────────────────┐ │
│ │ ⚠️  Error Summary                                    │ │
│ │ Step 3 failed: Assertion failed                      │ │
│ │ • Expected: response.status = 200                    │ │
│ │ • Actual: response.status = 401                      │ │
│ │ [Jump to Step 3] [View Full Log]                     │ │
│ └──────────────────────────────────────────────────────┘ │
│                                                          │
│ Steps:                                                   │
│ ┌────────────────────────────────────────────────────┐   │
│ │ ✓ Step 1: Login                         120ms      │   │
│ │   POST /api/auth/login → 200 OK                    │   │
│ │   [Details ▼]                                       │   │
│ └────────────────────────────────────────────────────┘   │
│ ┌────────────────────────────────────────────────────┐   │
│ │ ✓ Step 2: Get Profile                   85ms       │   │
│ │   GET /api/profile → 200 OK                        │   │
│ └────────────────────────────────────────────────────┘   │
│ ┌────────────────────────────────────────────────────┐   │
│ │ ✗ Step 3: Update Settings               failed     │   │
│ │   PUT /api/settings → 401 Unauthorized             │   │
│ │   [Details ▼]                                       │   │
│ │   ┌──────────────────────────────────────────────┐ │   │
│ │   │ Request:                                     │ │   │
│ │   │ PUT /api/settings                            │ │   │
│ │   │ Headers: { Authorization: "Bearer ..." }     │ │   │
│ │   │ Body: { theme: "dark" }                      │ │   │
│ │   │                                              │ │   │
│ │   │ Response:                                    │ │   │
│ │   │ 401 Unauthorized                             │ │   │
│ │   │ { error: "Invalid token" }                   │ │   │
│ │   │                                              │ │   │
│ │   │ Assertions (0/1 passed):                     │ │   │
│ │   │ ✗ response.status equals 200                 │ │   │
│ │   │   Expected: 200                              │ │   │
│ │   │   Actual: 401                                │ │   │
│ │   └──────────────────────────────────────────────┘ │   │
│ └────────────────────────────────────────────────────┘   │
│ ○ Step 4: Logout (skipped)                              │
│ ○ Step 5: Cleanup (skipped)                             │
└──────────────────────────────────────────────────────────┘
```

### 6.3 组件设计

#### EnhancedExecutionView

```typescript
// NextTestPlatformUI/components/testcase/execution/EnhancedExecutionView.tsx
interface EnhancedExecutionViewProps {
  execution: TestExecution;
  testCase: TestCase;
  viewMode: ViewMode;
}

export const EnhancedExecutionView: React.FC<EnhancedExecutionViewProps> = ({
  execution,
  testCase,
  viewMode
}) => {
  return (
    <div className="enhanced-execution-view">
      {/* 执行摘要 */}
      <ExecutionSummary execution={execution} />

      {/* 错误摘要（如果有失败） */}
      {execution.status === 'failed' && (
        <ErrorSummary execution={execution} />
      )}

      {/* 视图切换 */}
      <ViewModeSwitcher
        currentMode={viewMode}
        onChange={setViewMode}
      />

      {/* 主内容区 */}
      {viewMode === 'list' && (
        <StepExecutionList steps={execution.steps} />
      )}

      {viewMode === 'workflow' && (
        <WorkflowExecutionView
          testCase={testCase}
          execution={execution}
        />
      )}

      {viewMode === 'timeline' && (
        <TimelineExecutionView execution={execution} />
      )}

      {/* 变量池（可折叠） */}
      <CollapsiblePanel title="Variable Pool" defaultCollapsed={true}>
        <VariablePoolView variables={execution.variables} />
      </CollapsiblePanel>
    </div>
  );
};
```

#### ExecutionSummary

```typescript
interface ExecutionSummaryProps {
  execution: TestExecution;
}

export const ExecutionSummary: React.FC<ExecutionSummaryProps> = ({
  execution
}) => {
  const stats = calculateStats(execution);

  return (
    <div className="execution-summary">
      <div className="summary-header">
        <h3>Execution: {execution.id}</h3>
        <StatusBadge status={execution.status} />
      </div>

      <div className="summary-stats">
        <Stat label="Duration" value={formatDuration(execution.duration)} />
        <Stat label="Steps" value={`${stats.completed}/${stats.total}`} />
        <Stat label="Passed" value={stats.passed} color="green" />
        <Stat label="Failed" value={stats.failed} color="red" />
        <Stat label="Skipped" value={stats.skipped} color="gray" />
      </div>

      <ProgressBar
        total={stats.total}
        passed={stats.passed}
        failed={stats.failed}
        skipped={stats.skipped}
      />
    </div>
  );
};
```

#### ErrorSummary

```typescript
export const ErrorSummary: React.FC<{ execution: TestExecution }> = ({
  execution
}) => {
  const errors = extractErrors(execution);

  return (
    <div className="error-summary">
      <div className="error-header">
        <AlertTriangle size={20} />
        <h4>Error Summary</h4>
      </div>

      {errors.map((error, idx) => (
        <div key={idx} className="error-item">
          <div className="error-message">
            <strong>{error.stepName}</strong> failed: {error.message}
          </div>

          {error.assertionFailures && (
            <ul className="assertion-failures">
              {error.assertionFailures.map((failure, i) => (
                <li key={i}>
                  • Expected: {failure.expected}
                  <br />
                  • Actual: {failure.actual}
                </li>
              ))}
            </ul>
          )}

          <button onClick={() => scrollToStep(error.stepId)}>
            Jump to Step {error.stepIndex + 1}
          </button>
        </div>
      ))}
    </div>
  );
};
```

#### StepExecutionCard（增强版）

```typescript
export const StepExecutionCard: React.FC<{ step: StepExecution }> = ({
  step
}) => {
  const [expanded, setExpanded] = useState(step.status === 'failed');

  return (
    <div className={`step-card ${step.status}`} id={`step-${step.id}`}>
      {/* 头部 */}
      <div className="step-header" onClick={() => setExpanded(!expanded)}>
        <StatusIcon status={step.status} />
        <h5>{step.stepName}</h5>
        <div className="step-meta">
          {step.duration && <span>{step.duration}ms</span>}
          <ChevronDown className={expanded ? 'rotated' : ''} />
        </div>
      </div>

      {/* 简要信息 */}
      <div className="step-summary">
        {step.request && (
          <span>{step.request.method} {step.request.url} → {step.response?.statusCode}</span>
        )}
      </div>

      {/* 详细信息（可展开） */}
      {expanded && (
        <div className="step-details">
          {/* HTTP请求/响应 */}
          {step.request && (
            <HttpDetails request={step.request} response={step.response} />
          )}

          {/* 断言结果 */}
          {step.assertions && step.assertions.length > 0 && (
            <AssertionResultPanel assertions={step.assertions} />
          )}

          {/* 变量变化 */}
          {step.outputs && Object.keys(step.outputs).length > 0 && (
            <VariableChanges outputs={step.outputs} />
          )}

          {/* 错误详情 */}
          {step.error && (
            <ErrorDetails error={step.error} errorType={step.errorType} />
          )}
        </div>
      )}
    </div>
  );
};
```

### 6.4 Workflow View中的执行状态

```typescript
export const WorkflowExecutionView: React.FC<{
  testCase: TestCase;
  execution: TestExecution;
}> = ({ testCase, execution }) => {
  // 将执行状态映射到节点
  const nodes = testCase.steps.map(step => {
    const execData = execution.steps.find(s => s.stepId === step.id);
    return {
      id: step.id,
      step: step,
      execution: execData,
      status: execData?.status || 'pending'
    };
  });

  return (
    <WorkflowCanvas>
      {nodes.map(node => (
        <WorkflowNode
          key={node.id}
          node={node}
          onClick={() => showExecutionDetails(node.execution)}
          style={getNodeStyleByStatus(node.status)}
        />
      ))}

      <ExecutionPathHighlight nodes={nodes} />
    </WorkflowCanvas>
  );
};
```

### 6.5 实时执行追踪

```typescript
// WebSocket连接，实时更新执行状态
export const useRealTimeExecution = (runId: string) => {
  const [execution, setExecution] = useState<TestExecution | null>(null);

  useEffect(() => {
    const ws = new WebSocket(`ws://localhost:8090/api/v2/workflows/runs/${runId}/stream`);

    ws.onmessage = (event) => {
      const update = JSON.parse(event.data);

      setExecution(prev => {
        if (!prev) return null;

        // 更新步骤状态
        if (update.type === 'step_status') {
          return {
            ...prev,
            steps: prev.steps.map(s =>
              s.stepId === update.stepId
                ? { ...s, status: update.status }
                : s
            )
          };
        }

        // 更新变量
        if (update.type === 'variable_change') {
          return {
            ...prev,
            variables: { ...prev.variables, [update.name]: update.value }
          };
        }

        return prev;
      });
    };

    return () => ws.close();
  }, [runId]);

  return execution;
};
```

---

## 7. 实施路线图

### 7.1 优先级排序

| 方案 | 优先级 | 工作量 | 价值 | 依赖 |
|------|--------|--------|------|------|
| **三层断言系统** | P0 | 8天 | 高 | 无 |
| **可视化数据映射器** | P0 | 10天 | 高 | 无 |
| **双视图模式** | P1 | 6天 | 中 | 无 |
| **增强执行视图** | P1 | 5天 | 高 | 断言系统 |
| **自举测试库** | P2 | 4天 | 中 | 无 |

### 7.2 分阶段实施

#### Phase 1: 基础能力（2周）

**Week 1: 断言系统**
- Day 1-2: 后端断言执行引擎
- Day 3-4: 前端断言类型定义
- Day 5-6: AssertionEditor UI
- Day 7-8: 集成测试和调优

**Week 2: 数据映射器**
- Day 1-2: DataBinding模型定义
- Day 3-4: Visual Data Mapper UI
- Day 5-6: 拖拽交互实现
- Day 7-8: 类型校验和转换

#### Phase 2: 可视化（1.5周）

**Week 3-4: 双视图模式**
- Day 1-2: Workflow View布局引擎
- Day 3-4: Timeline View实现
- Day 5-6: 视图切换和状态同步

#### Phase 3: 增强和完善（1周）

**Week 5: 执行视图和模板库**
- Day 1-2: 增强ExecutionView
- Day 3-4: 实时执行追踪
- Day 5-6: 系统测试模板
- Day 7: 模板库UI

### 7.3 里程碑

| 里程碑 | 日期 | 交付物 |
|--------|------|--------|
| M1: 断言系统可用 | Week 1 | 用户可以创建和执行断言 |
| M2: 数据映射器可用 | Week 2 | 用户可以可视化配置数据绑定 |
| M3: 工作流视图可用 | Week 4 | 用户可以切换到DAG图查看测试 |
| M4: 完整功能上线 | Week 5 | 所有功能集成并可用 |

---

## 8. 技术规格

### 8.1 前端技术栈

```json
{
  "dependencies": {
    "react": "^19.2.0",
    "typescript": "^5.0.0",
    "lucide-react": "^0.263.1",
    "dagre": "^0.8.5",
    "react-zoom-pan-pinch": "^3.0.0",
    "react-beautiful-dnd": "^13.1.1",
    "jsonpath-plus": "^7.2.0"
  }
}
```

### 8.2 后端技术规格

```go
// Go 1.24
import (
    "github.com/gin-gonic/gin"
    "gorm.io/gorm"
    "github.com/gorilla/websocket"
)

// 新增包
// internal/workflow/assertion_executor.go
// internal/workflow/data_mapper.go
// internal/handler/template_handler.go
// internal/repository/template_repository.go
```

### 8.3 数据库变更

```sql
-- 新增templates表
CREATE TABLE templates (
    id VARCHAR(50) PRIMARY KEY,
    category VARCHAR(50) NOT NULL,
    subcategory VARCHAR(50),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    test_case_json TEXT NOT NULL,
    parameters_json TEXT,
    readonly BOOLEAN DEFAULT false,
    visibility VARCHAR(20) DEFAULT 'public',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_category (category, subcategory)
);

-- test_cases表新增字段
ALTER TABLE test_cases ADD COLUMN data_bindings TEXT;
ALTER TABLE test_cases ADD COLUMN enhanced_assertions TEXT;
```

### 8.4 API变更

```yaml
# 新增API端点
GET    /api/v2/templates
GET    /api/v2/templates/:id
POST   /api/v2/templates/:id/instantiate
POST   /api/v2/templates (用户自定义模板)

# 修改的API端点
POST   /api/v2/tests (支持新的assertions和dataBindings字段)
PUT    /api/v2/tests/:id (同上)

# 执行结果增强
GET    /api/v2/tests/:id/runs/:runId (返回增强的断言结果)
```

### 8.5 性能指标

| 指标 | 目标值 |
|------|--------|
| Workflow View渲染 (100节点) | < 500ms |
| 断言执行 (50条断言) | < 100ms |
| Data Mapper加载 | < 200ms |
| WebSocket消息延迟 | < 50ms |
| 模板实例化 | < 100ms |

---

## 9. 总结

### 9.1 核心价值

本优化方案从**第一性原理**出发，解决了测试工程师和产品设计师面临的核心问题：

1. **断言系统** - 让验证逻辑表达力提升10倍
2. **数据映射器** - 让参数传递错误率降低80%
3. **双视图模式** - 让大型测试理解效率提升3倍
4. **执行视图** - 让错误定位时间减少70%
5. **测试库** - 让新用户上手时间缩短50%

### 9.2 用户体验改进

**之前**：
- 断言只能手动编辑JSON
- 参数传递靠记忆变量名
- 20步测试要滚动半天才看完
- 执行失败要逐个展开找错误
- 不知道如何写测试用例

**之后**：
- 可视化断言编辑器，智能提示
- 拖拽连接数据流，类型安全
- 一图看清所有步骤和依赖
- 一眼定位失败节点和原因
- 一键使用系统自带的测试模板

### 9.3 后续演进

**Phase 4（未来）**：
- AI辅助断言生成
- 智能数据映射推荐
- 测试用例自动优化
- 性能瓶颈智能识别
- 社区模板市场

---

**文档结束**

如需进一步讨论实施细节或有任何问题，请联系团队。
