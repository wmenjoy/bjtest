# Data Mapper Component

A visual data flow configuration component for mapping outputs from one test step to inputs of another step.

## Overview

The DataMapper component provides a dual-panel interface that allows users to visually create data bindings between test steps by clicking on source outputs and target inputs.

## Features

- **Dual Panel Layout**: Source outputs (left) and target inputs (right)
- **Visual Binding Creation**: Click source, then click target to create a binding
- **Auto-mapping**: Automatically match fields with the same name
- **Type Display**: Shows data types for better understanding
- **Binding Management**: Easy deletion of bindings
- **Visual Feedback**: Color-coded states (unbound, bound, selected)

## Type Definitions

### DataBinding

```typescript
interface DataBinding {
  id: string;
  sourceStepId: string;
  sourcePath: string;      // JSONPath to output field
  sourceType?: string;
  targetStepId: string;
  targetParam: string;     // Target parameter name
  targetType?: string;
  transform?: DataTransform;
}
```

### DataTransform

```typescript
interface DataTransform {
  type: 'function' | 'template';
  function?: 'uppercase' | 'lowercase' | 'parseInt' | 'trim' | 'parseFloat' | 'toString';
  template?: string;       // e.g., "Bearer {{value}}"
}
```

## Usage

### Basic Example

```tsx
import { DataMapper } from './components/testcase/datamapper/DataMapper';
import { DataBinding } from './types';

function MyComponent() {
  const [bindings, setBindings] = useState<DataBinding[]>([]);
  const [showMapper, setShowMapper] = useState(false);

  const sourceOutputs = [
    { name: 'userId', path: 'response.body.userId', type: 'number', value: 12345 },
    { name: 'token', path: 'response.body.token', type: 'string', value: 'abc123' }
  ];

  const targetInputs = [
    { name: 'userId', type: 'number' },
    { name: 'auth', type: 'string' }
  ];

  return (
    <>
      <button onClick={() => setShowMapper(true)}>
        Open Data Mapper
      </button>

      {showMapper && (
        <DataMapper
          sourceStepId="step-1"
          sourceStepName="Login"
          sourceOutputs={sourceOutputs}
          targetStepId="step-2"
          targetStepName="Get Profile"
          targetInputs={targetInputs}
          bindings={bindings}
          onBindingsChange={setBindings}
          onClose={() => setShowMapper(false)}
        />
      )}
    </>
  );
}
```

### Integration with Test Steps

```typescript
// When defining a test step
const testStep: WorkflowStep = {
  id: 'step-2',
  name: 'Get Profile',
  type: 'http',
  config: {
    method: 'GET',
    url: '/api/profile'
  },
  // Add data bindings
  dataMappers: bindings,
  // Or use inputs with variable references
  inputs: {
    userId: '{{response.body.userId}}',
    auth: '{{response.body.token}}'
  }
};
```

## Props

| Prop | Type | Description |
|------|------|-------------|
| `sourceStepId` | `string` | ID of the source step |
| `sourceStepName` | `string` | Display name of the source step |
| `sourceOutputs` | `DataField[]` | Array of output fields from the source |
| `targetStepId` | `string` | ID of the target step |
| `targetStepName` | `string` | Display name of the target step |
| `targetInputs` | `DataField[]` | Array of input fields for the target |
| `bindings` | `DataBinding[]` | Current bindings |
| `onBindingsChange` | `(bindings: DataBinding[]) => void` | Callback when bindings change |
| `onClose` | `() => void` | Callback when mapper is closed |

## DataField Interface

```typescript
interface DataField {
  name: string;        // Field name
  path: string;        // JSONPath (for outputs)
  type?: string;       // Data type
  value?: any;         // Current value (for preview)
}
```

## User Interactions

### Creating a Binding

1. Click a source field (left panel)
2. Click a target field (right panel)
3. Binding is created automatically

**OR**

1. Click a target field (right panel)
2. Click a source field (left panel)
3. Binding is created automatically

### Auto-mapping

Click the "Auto Map" button to automatically create bindings for fields with matching names (case-insensitive).

### Deleting a Binding

Click the X button next to a bound target field.

### Clearing All Bindings

Click "Clear All" button and confirm.

## Visual States

### Field States

- **Unbound**: White background, gray border, empty circle
- **Bound**: Green background, green border, filled green circle
- **Selected**: Blue background, blue border

### Binding Display

Bound target fields show:
- Source path in monospace font
- Transform indicator (if applicable)
- Delete button (X)

## Styling

The component uses Tailwind CSS classes. Key color schemes:

- **Blue**: Selected state, primary actions
- **Green**: Bound/connected state
- **Slate**: Neutral, unbound state
- **Yellow**: Warnings, transforms

## Advanced Features (Future)

### Data Transformations

```typescript
const binding: DataBinding = {
  // ... basic fields
  transform: {
    type: 'template',
    template: 'Bearer {{value}}'
  }
};
```

### Type Validation

The component shows type information but doesn't enforce type compatibility yet. Future versions will include:

- Type mismatch warnings
- Automatic transform suggestions
- Validation rules

## Demo

Run the demo component to see the DataMapper in action:

```tsx
import { DataMapperDemo } from './components/DataMapperDemo';

function App() {
  return <DataMapperDemo />;
}
```

## File Structure

```
NextTestPlatformUI/
├── components/
│   ├── testcase/
│   │   └── datamapper/
│   │       └── DataMapper.tsx      # Main component
│   └── DataMapperDemo.tsx          # Demo/example
└── types.ts                        # Type definitions
```

## Benefits

1. **Visual Clarity**: See data flow at a glance
2. **Error Prevention**: Reduces typos in variable names
3. **Type Safety**: Display types for better understanding
4. **Efficiency**: Auto-mapping saves time
5. **User-Friendly**: Intuitive click-based interaction

## Backend Integration

When executing a test step with bindings, the backend should:

1. Extract data from source step using `sourcePath`
2. Apply transforms if defined
3. Set value to target parameter
4. Validate types if required

Example backend logic (Go):

```go
func applyDataBindings(step *WorkflowStep, ctx *ExecutionContext) error {
    for _, binding := range step.DataMappers {
        // 1. Extract source data
        sourceData := ctx.GetStepOutput(binding.SourceStepID)
        value := extractValue(sourceData, binding.SourcePath)

        // 2. Apply transform
        if binding.Transform != nil {
            value = applyTransform(value, binding.Transform)
        }

        // 3. Set to target
        ctx.SetVariable(binding.TargetParam, value)
    }
    return nil
}
```

## Migration from String Variables

**Before** (string-based):
```typescript
inputs: {
  userId: '{{userId}}',  // Hope this variable exists!
  auth: '{{token}}'      // Typo-prone
}
```

**After** (DataMapper):
```typescript
dataMappers: [
  {
    id: 'binding-1',
    sourceStepId: 'step-1',
    sourcePath: 'response.body.userId',  // Explicit source
    targetStepId: 'step-2',
    targetParam: 'userId'
  }
]
```

## Limitations

Current version:
- Click-based interaction only (no drag-and-drop yet)
- Simple line visualization (no curved connections)
- No real-time type validation
- Transform editing is basic

Future enhancements will address these limitations.

## Contributing

When extending the DataMapper:

1. Maintain the dual-panel layout
2. Keep interactions simple and intuitive
3. Provide clear visual feedback
4. Support keyboard navigation
5. Add comprehensive error handling

## License

Part of the NextTestPlatformUI project.
