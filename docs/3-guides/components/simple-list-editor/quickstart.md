# SimpleListEditor - Quick Start Guide

## 5-Minute Setup

### Step 1: Import the Component

```typescript
import { SimpleListEditor } from './components/SimpleListEditor';
import { WorkflowStep } from './types';
```

### Step 2: Set Up State

```typescript
const [steps, setSteps] = useState<WorkflowStep[]>([]);
```

### Step 3: Render the Editor

```typescript
<SimpleListEditor steps={steps} onChange={setSteps} />
```

That's it! You now have a fully functional workflow editor.

## Complete Example

```typescript
import React, { useState } from 'react';
import { SimpleListEditor } from './components/SimpleListEditor';
import { WorkflowStep } from './types';

function MyWorkflowEditor() {
  const [steps, setSteps] = useState<WorkflowStep[]>([]);

  return (
    <div className="h-screen">
      <SimpleListEditor steps={steps} onChange={setSteps} />
    </div>
  );
}

export default MyWorkflowEditor;
```

## Demo Component

To see it in action with sample data:

```typescript
import { SimpleListEditorDemo } from './components/SimpleListEditorDemo';

function App() {
  return <SimpleListEditorDemo />;
}
```

## Common Use Cases

### 1. Creating a New Workflow

```typescript
// User clicks "Add First Step"
// SimpleListEditor handles everything automatically
```

### 2. Loading Existing Workflow

```typescript
const [steps, setSteps] = useState<WorkflowStep[]>([
  {
    id: 'step-1',
    name: 'API Call',
    type: 'http',
    config: {
      method: 'GET',
      url: 'https://api.example.com/data',
    },
  },
]);
```

### 3. Saving Workflow

```typescript
<SimpleListEditor
  steps={steps}
  onChange={(newSteps) => {
    setSteps(newSteps);
    saveToBackend(newSteps); // Your save logic
  }}
/>
```

### 4. Read-Only Display

```typescript
<SimpleListEditor
  steps={existingSteps}
  onChange={() => {}} // No-op
  readonly={true}
/>
```

## Key Features at a Glance

| Feature | How to Use |
|---------|-----------|
| **Add Step** | Click "Add Step" button |
| **Edit Name** | Click step name and type |
| **Configure** | Click "Show details" |
| **Delete** | Click trash icon |
| **Duplicate** | Click copy icon |
| **Reorder** | Drag by grip handle |
| **Data Mapping** | Click "Data Flow Mapping" (steps 2+) |

## Pro Tips

1. **Data Mapping**: Only available for steps after the first one (needs upstream data source)

2. **Expand All**: Click individual "Show details" buttons (bulk expand coming in Phase 2)

3. **Step Types**: Change via dropdown in expanded configuration panel

4. **Validation**: Step is valid as long as required fields are filled (type-specific)

5. **Performance**: Handles 100+ steps smoothly

## Troubleshooting

### Issue: Steps not updating
**Solution**: Make sure you're passing `onChange` callback and updating parent state

```typescript
// ✅ Correct
const [steps, setSteps] = useState<WorkflowStep[]>([]);
<SimpleListEditor steps={steps} onChange={setSteps} />

// ❌ Wrong
const steps = [];
<SimpleListEditor steps={steps} onChange={() => {}} />
```

### Issue: Data mapping not showing
**Solution**: Data mapping only shows for steps after the first one (index > 0)

### Issue: Can't drag steps
**Solution**: Check if `readonly={true}` is set

## Next Steps

1. ✅ Read the complete documentation: `SIMPLE_LIST_EDITOR_README.md`
2. ✅ Explore the demo: `SimpleListEditorDemo.tsx`
3. ✅ Check DataMappingPanel docs: `testcase/stepEditor/README.md`
4. ✅ Review type definitions: `types/index.ts`

## Need Help?

- Check the demo component for working examples
- Review the complete README for detailed documentation
- Look at existing workflow files for real-world usage patterns

---

**Ready to build workflows in under 5 minutes!** 🚀
