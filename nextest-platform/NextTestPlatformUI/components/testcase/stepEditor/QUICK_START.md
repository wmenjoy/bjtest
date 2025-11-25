# Quick Start Guide - DataMapper UI Components

## 1. Basic Usage (5 minutes)

```typescript
import { DataMappingPanel } from './components/testcase/stepEditor';

function MyWorkflowEditor() {
  const [currentStep, setCurrentStep] = useState({
    id: 'step-2',
    name: 'Get User Profile',
    type: 'http',
    dependsOn: ['step-1'],
    dataMappers: []
  });

  const previousSteps = [
    {
      id: 'step-1',
      name: 'Login',
      type: 'http',
      outputs: {
        'response.body.token': 'authToken'
      }
    }
  ];

  return (
    <DataMappingPanel
      currentStep={currentStep}
      previousSteps={previousSteps}
      onChange={setCurrentStep}
    />
  );
}
```

## 2. Run the Demo

```bash
# In your React app, import and render the demo
import { DataMappingPanelDemo } from './components/testcase/stepEditor';

<DataMappingPanelDemo />
```

## 3. Integration Checklist

- [ ] Import DataMappingPanel component
- [ ] Provide currentStep (with dataMappers array)
- [ ] Provide previousSteps (steps that currentStep depends on)
- [ ] Implement onChange handler to save updates
- [ ] Ensure lucide-react icons are installed
- [ ] Ensure Tailwind CSS is configured

## 4. Data Structure

Your step object should have:

```typescript
{
  id: string;              // Required
  name?: string;           // Optional display name
  type: string;            // 'http', 'command', etc.
  dependsOn?: string[];    // Array of step IDs
  dataMappers?: DataMapper[]; // Created by the panel
  outputs?: Record<string, string>;  // Optional
  inputs?: Record<string, any>;      // Optional
}
```

## 5. How It Works

1. User expands an upstream step in the left column
2. User drags an output field (e.g., "authToken")
3. User drops it onto an input parameter (e.g., "Authorization")
4. A DataMapper object is created:
   ```json
   {
     "id": "mapper-1637846293847",
     "sourceStep": "step-1",
     "sourcePath": "authToken",
     "targetParam": "Authorization"
   }
   ```
5. The onChange callback is triggered with the updated step
6. Your app saves the updated step with the new mapper

## 6. Backend Integration

The backend variable resolver automatically processes dataMappers:

```go
// In workflow executor
resolvedInputs, err := e.variableResolver.ResolveStepInputs(step, ctx)

// DataMappers take priority over manual inputs
// Example: Authorization = "eyJhbGciOiJIUzI1NiIs..."
```

## 7. Common Issues

**Issue**: "No previous steps" message
- **Fix**: Ensure currentStep.dependsOn includes step IDs that exist in previousSteps

**Issue**: "No outputs defined"
- **Fix**: Add outputs field to upstream steps, or rely on auto-inference for http/command types

**Issue**: Drag-and-drop not working
- **Fix**: Ensure parent container has sufficient height and overflow is visible

## 8. Customization

### Change column widths:
```typescript
// In DataMappingPanel.tsx, modify:
<div className="w-1/3 ...">  // Change to w-1/4, w-2/5, etc.
```

### Add custom transforms:
```typescript
// In MappingLine.tsx, add to availableTransforms array:
{ value: 'base64', label: 'Base64 Encode' }
```

### Change panel height:
```typescript
// In DataMappingPanel.tsx:
<div className="flex h-96">  // Change to h-screen, h-[600px], etc.
```

## 9. Next Steps

- Integrate into your workflow editor (StepCard.tsx or similar)
- Connect to your backend API to save workflow changes
- Add validation for mapping compatibility
- Implement preview mode with sample data

## 10. Support

- See README.md for detailed documentation
- See IMPLEMENTATION_SUMMARY.md for architecture details
- See DataMappingPanelDemo.tsx for working example
- Backend docs: /docs/DATAMAPPER_IMPLEMENTATION.md
