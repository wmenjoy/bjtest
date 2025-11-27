# DataMapper Quick Start Guide

## 5-Minute Integration Guide

### Step 1: Import Types and Component

```typescript
import { DataMapper } from './components/testcase/datamapper/DataMapper';
import { DataBinding } from './types';
```

### Step 2: Add State to Your Component

```typescript
const [showMapper, setShowMapper] = useState(false);
const [bindings, setBindings] = useState<DataBinding[]>([]);
```

### Step 3: Prepare Your Data

```typescript
// Define source outputs (from previous step)
const sourceOutputs = [
  {
    name: 'userId',                    // Display name
    path: 'response.body.userId',      // JSONPath
    type: 'number',                    // Optional: data type
    value: 12345                       // Optional: preview value
  },
  {
    name: 'token',
    path: 'response.body.token',
    type: 'string',
    value: 'eyJhbGc...'
  }
];

// Define target inputs (for current step)
const targetInputs = [
  {
    name: 'userId',                    // Parameter name
    type: 'number'                     // Optional: expected type
  },
  {
    name: 'auth',
    type: 'string'
  }
];
```

### Step 4: Render the Component

```typescript
return (
  <>
    {/* Your trigger button */}
    <button onClick={() => setShowMapper(true)}>
      Configure Data Mapping
    </button>

    {/* DataMapper modal */}
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
```

### Step 5: Use the Bindings

```typescript
// Apply bindings to your step configuration
const step: WorkflowStep = {
  id: 'step-2',
  name: 'Get Profile',
  type: 'http',
  config: {
    method: 'GET',
    url: '/api/profile'
  },
  dataMappers: bindings  // ← Add this
};
```

## Common Patterns

### Pattern 1: Extract Outputs from Step Execution

```typescript
function extractOutputsFromStep(step: WorkflowStep, execution: StepExecution) {
  const outputs: DataField[] = [];

  if (execution.outputs) {
    Object.entries(execution.outputs).forEach(([key, value]) => {
      outputs.push({
        name: key,
        path: key,
        type: typeof value,
        value: value
      });
    });
  }

  // For HTTP steps, also add common response fields
  if (step.type === 'http' && execution.httpResponse) {
    outputs.push({
      name: 'statusCode',
      path: 'response.statusCode',
      type: 'number',
      value: execution.httpResponse.statusCode
    });
  }

  return outputs;
}
```

### Pattern 2: Define Inputs from Step Config

```typescript
function getStepInputs(step: WorkflowStep): DataField[] {
  const inputs: DataField[] = [];

  // From config
  if (step.config) {
    Object.keys(step.config).forEach(key => {
      inputs.push({
        name: key,
        type: 'string'  // Default type
      });
    });
  }

  // From explicit inputs definition
  if (step.inputs) {
    Object.keys(step.inputs).forEach(key => {
      inputs.push({
        name: key,
        type: 'string'
      });
    });
  }

  return inputs;
}
```

### Pattern 3: Persist Bindings

```typescript
// Save bindings when step is updated
const updateStep = (stepId: string, bindings: DataBinding[]) => {
  const updatedStep = {
    ...step,
    dataMappers: bindings
  };

  // Save to backend or state
  saveStep(updatedStep);
};
```

## Complete Example: Integration in StepCard

```typescript
import React, { useState } from 'react';
import { Network } from 'lucide-react';
import { DataMapper } from './datamapper/DataMapper';
import { WorkflowStep, DataBinding } from '../../../types';

interface StepCardProps {
  step: WorkflowStep;
  previousStep?: WorkflowStep;
  previousExecution?: StepExecution;
  onUpdate: (step: WorkflowStep) => void;
}

export const StepCard: React.FC<StepCardProps> = ({
  step,
  previousStep,
  previousExecution,
  onUpdate
}) => {
  const [showMapper, setShowMapper] = useState(false);

  const handleBindingsChange = (bindings: DataBinding[]) => {
    onUpdate({
      ...step,
      dataMappers: bindings
    });
  };

  // Extract outputs from previous step
  const sourceOutputs = previousExecution
    ? extractOutputsFromStep(previousStep!, previousExecution)
    : [];

  // Get inputs for current step
  const targetInputs = getStepInputs(step);

  return (
    <div className="step-card">
      {/* Step header */}
      <div className="step-header">
        <h4>{step.name}</h4>
        <button
          onClick={() => setShowMapper(true)}
          disabled={!previousStep}
          className="btn-icon"
          title="Configure data mapping"
        >
          <Network size={16} />
        </button>
      </div>

      {/* Show binding summary */}
      {step.dataMappers && step.dataMappers.length > 0 && (
        <div className="binding-summary">
          <span className="text-sm text-green-600">
            {step.dataMappers.length} data binding{step.dataMappers.length !== 1 ? 's' : ''} configured
          </span>
        </div>
      )}

      {/* DataMapper modal */}
      {showMapper && previousStep && (
        <DataMapper
          sourceStepId={previousStep.id}
          sourceStepName={previousStep.name || `Step ${previousStep.id}`}
          sourceOutputs={sourceOutputs}
          targetStepId={step.id}
          targetStepName={step.name || `Step ${step.id}`}
          targetInputs={targetInputs}
          bindings={step.dataMappers || []}
          onBindingsChange={handleBindingsChange}
          onClose={() => setShowMapper(false)}
        />
      )}
    </div>
  );
};
```

## Keyboard Shortcuts (Future)

| Key | Action |
|-----|--------|
| `Esc` | Close mapper |
| `Ctrl+A` | Auto-map |
| `Ctrl+K` | Clear all |
| `Delete` | Remove selected binding |

## Troubleshooting

### Issue: "No outputs available"

**Cause**: Previous step hasn't been executed or has no outputs.

**Solution**:
- Execute the previous step first
- Or manually define outputs for preview

### Issue: Bindings not applied during execution

**Cause**: Backend doesn't process `dataMappers` field.

**Solution**: Ensure backend executor calls `applyDataBindings()` function.

### Issue: Type mismatch not shown

**Cause**: Current version doesn't validate types.

**Solution**: Future enhancement - add type validation layer.

## Tips and Tricks

1. **Use Auto Map First**: Click "Auto Map" to create obvious bindings, then manually create the rest.

2. **Preview Values**: If you have execution results, pass actual values to see previews.

3. **Type Information**: Always provide type information for better UX.

4. **Naming Convention**: Use consistent naming (camelCase) for easier auto-mapping.

5. **Required vs Optional**: Visually distinguish required inputs (future enhancement).

## API Reference

### DataMapper Props

```typescript
interface DataMapperProps {
  // Step identification
  sourceStepId: string;
  sourceStepName: string;
  targetStepId: string;
  targetStepName: string;

  // Field definitions
  sourceOutputs: DataField[];
  targetInputs: DataField[];

  // Binding state
  bindings: DataBinding[];

  // Callbacks
  onBindingsChange: (bindings: DataBinding[]) => void;
  onClose: () => void;
}
```

### DataField Type

```typescript
interface DataField {
  name: string;        // Required: Field name
  path: string;        // Required: JSONPath (for outputs)
  type?: string;       // Optional: Data type
  value?: any;         // Optional: Preview value
}
```

### DataBinding Type

```typescript
interface DataBinding {
  id: string;
  sourceStepId: string;
  sourcePath: string;
  sourceType?: string;
  targetStepId: string;
  targetParam: string;
  targetType?: string;
  transform?: DataTransform;
}
```

## Next Steps

1. ✅ Integrate DataMapper into TestCaseEditor
2. ⏳ Add transform editor modal
3. ⏳ Implement type validation
4. ⏳ Add drag-and-drop support
5. ⏳ SVG connection lines

---

**Need Help?** Check the full README at `components/testcase/datamapper/README.md`
