# Assertion Editor - Quick Start Guide

## 1-Minute Quick Start

### Installation

No installation needed! The assertion editor is already part of the project at:
```
NextTestPlatformUI/components/testcase/assertion/
```

### Import

```typescript
import { AssertionEditor } from '@/components/testcase/assertion';
import { AtomicAssertion } from '@/types';
```

### Basic Usage

```typescript
function MyTestEditor() {
  const [assertions, setAssertions] = useState<AtomicAssertion[]>([]);

  return (
    <AssertionEditor
      assertions={assertions}
      onChange={setAssertions}
    />
  );
}
```

That's it! You now have a fully functional assertion editor.

## 5-Minute Integration

### Step 1: Add to Your Step Editor

```typescript
// In InlineConfigSection.tsx or StepCard.tsx
import { AssertionEditor } from './assertion';

export const InlineConfigSection = ({ step, onChange }) => {
  return (
    <div className="space-y-4">
      {/* Existing HTTP/Command config */}

      {/* Add Assertion Editor */}
      <div>
        <h4 className="text-sm font-semibold text-slate-700 mb-2">
          Assertions
        </h4>
        <AssertionEditor
          assertions={step.assertions || []}
          onChange={(assertions) => onChange({ ...step, assertions })}
          availableVariables={[
            'response.status',
            'response.body',
            'response.headers'
          ]}
        />
      </div>
    </div>
  );
};
```

### Step 2: Update Your Step Type

```typescript
// Make sure your WorkflowStep includes assertions
interface WorkflowStep {
  // ... existing fields
  assertions?: AtomicAssertion[];  // Add this
}
```

### Step 3: Test It

1. Open your test case editor
2. Add a new HTTP step
3. Expand the step
4. Click "Add Assertion"
5. Configure the assertion
6. Save and execute!

## Common Use Cases

### Use Case 1: API Response Validation

```typescript
const apiAssertions: AtomicAssertion[] = [
  {
    id: '1',
    type: 'value',
    target: '{{response.status}}',
    operator: 'equals',
    expected: 200,
    severity: 'error'
  },
  {
    id: '2',
    type: 'structure',
    target: '{{response.body.data}}',
    operator: 'exists',
    severity: 'error'
  }
];
```

### Use Case 2: Data Format Validation

```typescript
const formatAssertions: AtomicAssertion[] = [
  {
    id: '1',
    type: 'pattern',
    target: '{{response.body.email}}',
    operator: 'matchesRegex',
    expected: '^[a-z0-9]+@[a-z]+\\.[a-z]{2,}$',
    severity: 'warning',
    continueOnFailure: true
  }
];
```

### Use Case 3: Array Validation

```typescript
const arrayAssertions: AtomicAssertion[] = [
  {
    id: '1',
    type: 'structure',
    target: '{{response.body.users}}',
    operator: 'arrayLength',
    expected: 10,
    severity: 'error'
  },
  {
    id: '2',
    type: 'value',
    target: '{{response.body.users}}',
    operator: 'contains',
    expected: { role: 'admin' },
    severity: 'error'
  }
];
```

## Available Variables

The assertion editor supports variable autocomplete. Provide available variables based on your context:

```typescript
// Example: Variables from previous steps
const getAvailableVariables = (currentStepIndex: number) => {
  const vars = [
    // Response variables
    'response.status',
    'response.headers',
    'response.body',
    'response.time',

    // Previous step outputs
    ...getPreviousStepOutputs(currentStepIndex),

    // Global variables
    ...testCase.variables ? Object.keys(testCase.variables) : []
  ];

  return vars;
};

<AssertionEditor
  availableVariables={getAvailableVariables(stepIndex)}
  ...
/>
```

## Visual Demo

Run the demo to see all features:

1. Create a demo route in your router:
```typescript
import { AssertionEditorDemo } from '@/components/testcase/assertion';

<Route path="/demo/assertions" element={<AssertionEditorDemo />} />
```

2. Navigate to `/demo/assertions`

3. Explore the interactive demo!

## Tips & Tricks

### Tip 1: Auto-expand New Assertions

The editor automatically expands newly added assertions for easy configuration.

### Tip 2: Variable Syntax

Use `{{variableName}}` syntax for variable references:
- ✅ `{{response.body.token}}`
- ✅ `{{previousStep.userId}}`
- ❌ `response.body.token` (missing braces)

### Tip 3: Operator Selection

Choose operators based on your validation needs:
- **Equality**: `equals`, `notEquals`
- **Comparison**: `greaterThan`, `lessThan`
- **Existence**: `exists`, `notExists`
- **Pattern**: `matchesRegex`
- **Array**: `arrayLength`, `contains`

### Tip 4: Severity Levels

- **Error** (red): Critical validations that should fail the test
- **Warning** (amber): Important but not critical
- **Info** (blue): Informational checks

### Tip 5: Continue on Failure

Enable "Continue on failure" for non-critical assertions to prevent blocking subsequent steps.

## Next Steps

1. ✅ Integrate into your step editor
2. ✅ Test with real API responses
3. ✅ Provide meaningful variable suggestions
4. ✅ Customize assertion messages
5. ⏳ Wait for Phase 2 (Composite Assertions)
6. ⏳ Wait for Phase 3 (Assertion Sets)

## Getting Help

- 📖 Full documentation: `README.md`
- 🎯 Example code: `AssertionEditorDemo.tsx`
- 📋 Optimization plan: `/TESTCASE_OPTIMIZATION_PLAN.md`
- 🐛 Issues: Contact the team

---

Happy Testing! 🚀
