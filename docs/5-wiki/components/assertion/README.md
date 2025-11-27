# Assertion Editor - Phase 1 Implementation

## Overview

The **Assertion Editor** is a simplified assertion editing component that implements **Phase 1** of the three-layer assertion system outlined in the test case optimization plan.

This component allows test engineers to create, edit, and manage atomic assertions with a visual interface, eliminating the need to manually edit JSON.

## Features

### Current Implementation (Phase 1)

- **Atomic Assertions**: Single validation rules with clear semantics
- **10 Common Operators**: Most frequently used validation operators
- **Visual Editing**: Clean card-based UI for managing assertions
- **Variable Suggestions**: Autocomplete dropdown for available variables
- **Severity Levels**: Error, Warning, and Info levels
- **Advanced Options**: Continue on failure, custom messages
- **Reordering**: Move assertions up/down to control execution order

### Supported Operators

| Operator | Description | Requires Expected Value |
|----------|-------------|------------------------|
| `equals` | Value equals expected | Yes |
| `notEquals` | Value does not equal expected | Yes |
| `greaterThan` | Value is greater than expected | Yes |
| `lessThan` | Value is less than expected | Yes |
| `contains` | String/Array contains expected value | Yes |
| `notContains` | String/Array does not contain value | Yes |
| `exists` | Field exists (not null/undefined) | No |
| `notExists` | Field does not exist | No |
| `matchesRegex` | Value matches regex pattern | Yes |
| `arrayLength` | Array has specified length | Yes |

## Installation

The assertion editor is located in:
```
NextTestPlatformUI/components/testcase/assertion/
├── AssertionEditor.tsx      # Main container component
├── AssertionCard.tsx         # Individual assertion card
└── AssertionEditorDemo.tsx   # Usage example
```

## Usage

### Basic Usage

```typescript
import { AssertionEditor } from './components/testcase/assertion/AssertionEditor';
import { AtomicAssertion } from './types';

const MyComponent = () => {
  const [assertions, setAssertions] = useState<AtomicAssertion[]>([]);

  return (
    <AssertionEditor
      assertions={assertions}
      onChange={setAssertions}
    />
  );
};
```

### With Variable Suggestions

```typescript
const availableVariables = [
  'response.status',
  'response.body',
  'response.body.token',
  'previousStep.userId'
];

<AssertionEditor
  assertions={assertions}
  onChange={setAssertions}
  availableVariables={availableVariables}
/>
```

### Integration with Test Steps

```typescript
// In StepCard or InlineConfigSection
import { AssertionEditor } from './assertion/AssertionEditor';

const StepCard = ({ step, onChange }) => {
  return (
    <div>
      {/* Other step configuration */}

      {/* Assertions Section */}
      <div className="mt-4">
        <AssertionEditor
          assertions={step.assertions || []}
          onChange={(assertions) => onChange({ ...step, assertions })}
          availableVariables={getAvailableVariables(step)}
        />
      </div>
    </div>
  );
};
```

## Data Structure

### AtomicAssertion Interface

```typescript
interface AtomicAssertion {
  id: string;                    // Unique identifier
  type: 'value' | 'structure' | 'type' | 'pattern';
  target: string;                // JSONPath or variable reference
  operator: Operator;            // Comparison operator
  expected?: any;                // Expected value (if required)
  message?: string;              // Custom failure message
  severity?: 'error' | 'warning' | 'info';
  continueOnFailure?: boolean;   // Continue if assertion fails
}
```

### Example Assertions

```typescript
// Simple equality check
{
  id: "assertion-1",
  type: "value",
  target: "{{response.status}}",
  operator: "equals",
  expected: 200,
  message: "Expected HTTP 200 OK",
  severity: "error",
  continueOnFailure: false
}

// Existence check (no expected value needed)
{
  id: "assertion-2",
  type: "structure",
  target: "{{response.body.token}}",
  operator: "exists",
  message: "Token must be present",
  severity: "error",
  continueOnFailure: false
}

// Regex pattern matching
{
  id: "assertion-3",
  type: "pattern",
  target: "{{response.body.email}}",
  operator: "matchesRegex",
  expected: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
  message: "Invalid email format",
  severity: "warning",
  continueOnFailure: true
}

// Array length validation
{
  id: "assertion-4",
  type: "structure",
  target: "{{response.body.users}}",
  operator: "arrayLength",
  expected: 5,
  message: "Should return exactly 5 users",
  severity: "error",
  continueOnFailure: false
}
```

## Component Props

### AssertionEditor Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `assertions` | `AtomicAssertion[]` | Yes | Array of assertions to display |
| `onChange` | `(assertions: AtomicAssertion[]) => void` | Yes | Callback when assertions change |
| `availableVariables` | `string[]` | No | Variables for autocomplete |
| `readOnly` | `boolean` | No | Disable editing (default: false) |

### AssertionCard Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `assertion` | `AtomicAssertion` | Yes | Assertion to display |
| `index` | `number` | Yes | Position in list |
| `isExpanded` | `boolean` | Yes | Expanded state |
| `onToggleExpand` | `() => void` | Yes | Toggle expand callback |
| `onChange` | `(updated: AtomicAssertion) => void` | Yes | Update callback |
| `onDelete` | `() => void` | Yes | Delete callback |
| `onDuplicate` | `() => void` | Yes | Duplicate callback |
| `onMoveUp` | `(() => void) \| undefined` | No | Move up callback |
| `onMoveDown` | `(() => void) \| undefined` | No | Move down callback |
| `availableVariables` | `string[]` | No | Variables for autocomplete |
| `readOnly` | `boolean` | No | Disable editing |

## Backend Integration

### Storing Assertions

Update the `WorkflowStep` interface to include the enhanced assertions:

```typescript
// In types.ts
export interface WorkflowStep {
  // ... existing fields

  // Legacy assertions (kept for backward compatibility)
  assertions?: Assertion[];

  // Enhanced assertions (Phase 1)
  enhancedAssertions?: AtomicAssertion[];
}
```

### Backend Model

In the Go backend, add support for the new assertion structure:

```go
// internal/models/assertion.go
type AtomicAssertion struct {
    ID                string      `json:"id"`
    Type              string      `json:"type"` // value, structure, type, pattern
    Target            string      `json:"target"`
    Operator          string      `json:"operator"`
    Expected          interface{} `json:"expected,omitempty"`
    Message           string      `json:"message,omitempty"`
    Severity          string      `json:"severity,omitempty"` // error, warning, info
    ContinueOnFailure bool        `json:"continueOnFailure,omitempty"`
}
```

### Execution Engine

Create an assertion executor to validate the assertions:

```go
// internal/workflow/assertion_executor.go
func (e *AssertionExecutor) Execute(
    assertion *AtomicAssertion,
    ctx *ExecutionContext,
) (*AssertionResult, error) {
    // 1. Resolve target value using variable resolver
    actualValue := e.resolver.Resolve(assertion.Target, ctx)

    // 2. Execute operator
    passed, err := e.executeOperator(
        assertion.Operator,
        actualValue,
        assertion.Expected,
    )

    // 3. Return result
    return &AssertionResult{
        ID:       assertion.ID,
        Target:   assertion.Target,
        Operator: assertion.Operator,
        Expected: assertion.Expected,
        Actual:   actualValue,
        Passed:   passed,
        Message:  e.generateMessage(assertion, actualValue, passed),
        Severity: assertion.Severity,
    }, err
}
```

## Styling

The assertion editor uses Tailwind CSS classes consistent with the rest of the platform. Key color schemes:

- **Error**: Red (bg-red-50, border-red-200, text-red-700)
- **Warning**: Amber (bg-amber-50, border-amber-200, text-amber-700)
- **Info**: Blue (bg-blue-50, border-blue-200, text-blue-700)

## Testing

### Running the Demo

1. Start the development server:
```bash
cd NextTestPlatformUI
npm run dev
```

2. Navigate to the demo component (you'll need to add a route):
```typescript
// In your router
import { AssertionEditorDemo } from './components/testcase/assertion/AssertionEditorDemo';

<Route path="/assertion-demo" element={<AssertionEditorDemo />} />
```

### Manual Testing Checklist

- [ ] Add new assertion
- [ ] Edit assertion fields
- [ ] Delete assertion
- [ ] Duplicate assertion
- [ ] Reorder assertions (move up/down)
- [ ] Expand/collapse cards
- [ ] Test all 10 operators
- [ ] Test variable suggestions
- [ ] Test severity levels
- [ ] Test continue on failure option
- [ ] Test with empty assertions array
- [ ] Test read-only mode

## Future Enhancements (Phase 2 & 3)

### Phase 2: Composite Assertions

- Add logical operators (AND, OR, NOT)
- Allow nesting of assertions
- Support complex validation logic

### Phase 3: Assertion Sets

- Create reusable assertion templates
- Import/export assertion sets
- Community assertion library

## Troubleshooting

### Variables Not Showing

Make sure you're passing the `availableVariables` prop:

```typescript
<AssertionEditor
  assertions={assertions}
  onChange={setAssertions}
  availableVariables={['response.status', 'response.body']}
/>
```

### Assertions Not Saving

Ensure the `onChange` callback properly updates the parent state:

```typescript
const [step, setStep] = useState(initialStep);

<AssertionEditor
  assertions={step.assertions || []}
  onChange={(assertions) => setStep({ ...step, assertions })}
/>
```

### Type Errors

Make sure you've imported the correct types:

```typescript
import { AtomicAssertion, Operator } from '../../../types';
```

## Contributing

When adding new operators:

1. Add the operator to the `Operator` type in `types.ts`
2. Add configuration to `OPERATORS` array in `AssertionCard.tsx`
3. Implement execution logic in backend `assertion_executor.go`
4. Add tests for the new operator
5. Update this README

## Support

For questions or issues:
- Check the optimization plan: `TESTCASE_OPTIMIZATION_PLAN.md`
- Review the demo: `AssertionEditorDemo.tsx`
- Contact the team

---

**Version**: 1.0.0 (Phase 1)
**Last Updated**: 2025-11-26
**Status**: Ready for Integration
