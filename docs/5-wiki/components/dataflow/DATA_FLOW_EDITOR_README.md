# Data Flow Editor - React Flow Implementation

## Overview

A visual, drag-and-drop data flow editor for workflow steps using React Flow. This editor allows users to visually connect step outputs to step inputs, automatically generating variable bindings.

## Features

### Core Features
- ✅ Visual step nodes with input/output handles
- ✅ Drag-drop connections between outputs (cyan) and inputs (purple)
- ✅ Auto-generate variable bindings (e.g., `{{step1.token}}`)
- ✅ Connection validation (prevents circular dependencies)
- ✅ Interactive edge deletion (removes bindings)
- ✅ Zoom and pan support
- ✅ MiniMap for navigation
- ✅ Background grid
- ✅ Type-coded step nodes (HTTP, Command, Branch, Loop, etc.)

### UI Features
- Toggle between List View and Data Flow View
- Color-coded nodes by step type
- Hover labels for input/output handles
- Step selection and highlighting
- Help panel with usage instructions
- Responsive layout

## Architecture

### Component Structure

```
components/testcase/dataflow/
├── DataFlowEditor.tsx          # Main React Flow editor component
├── ReactFlowStepNode.tsx       # Custom node component for React Flow
├── utils.ts                    # Conversion and extraction utilities
├── DataFlowDiagram.tsx         # Static visualization (existing)
├── StepNode.tsx                # Node for static diagram (existing)
└── index.ts                    # Module exports
```

### Key Components

#### 1. DataFlowEditor
Main component that integrates React Flow with workflow steps.

**Props:**
- `steps: WorkflowStep[]` - Workflow steps to visualize
- `onChange: (steps: WorkflowStep[]) => void` - Callback when connections change
- `readonly?: boolean` - Disable editing

**Features:**
- Converts workflow steps to React Flow nodes and edges
- Handles connection creation (generates `{{stepId.fieldName}}` bindings)
- Handles edge deletion (removes bindings)
- Validates connections (prevents circular dependencies)

#### 2. ReactFlowStepNode
Custom node component for React Flow.

**Features:**
- Left handles for input parameters (purple circles)
- Right handles for output variables (cyan circles)
- Color-coded by step type (HTTP=blue, Command=amber, etc.)
- Shows step name, type badge, and parameter counts
- Hover labels for handle names
- Step ID badge in corner

#### 3. Utilities (utils.ts)
Helper functions for data flow operations.

**Functions:**
- `extractInputParameters(step)` - Extract input parameter names
- `extractOutputVariables(step)` - Extract output variable names
- `convertStepsToGraph(steps)` - Convert steps to React Flow nodes/edges
- `getVariableReference(stepId, field)` - Format variable reference
- `parseVariableReference(ref)` - Parse variable reference
- `validateConnection(source, target, steps)` - Validate connection

## Usage

### Basic Integration

```tsx
import { WorkflowView } from './components/testcase/workflow/WorkflowView';
import { WorkflowStep } from './types';

function MyComponent() {
  const [steps, setSteps] = useState<WorkflowStep[]>([...]);

  return (
    <WorkflowView
      steps={steps}
      onStepsChange={setSteps}
      onStepClick={(step) => console.log('Clicked:', step)}
    />
  );
}
```

### Direct DataFlowEditor Usage

```tsx
import { DataFlowEditor } from './components/testcase/dataflow';

function MyEditor() {
  const [steps, setSteps] = useState<WorkflowStep[]>([...]);

  return (
    <div style={{ height: '600px' }}>
      <DataFlowEditor
        steps={steps}
        onChange={setSteps}
        readonly={false}
      />
    </div>
  );
}
```

## Data Model

### WorkflowStep Structure

```typescript
interface WorkflowStep {
  id: string;
  name: string;
  type: StepType; // 'http' | 'command' | 'assertion' | ...

  // Input bindings (what this step consumes)
  inputs?: Record<string, string>; // { paramName: '{{stepId.field}}' }

  // Output mapping (what this step produces)
  outputs?: Record<string, string>; // { 'response.field': 'varName' }

  // Step configuration
  config?: Record<string, any>;

  // Other fields...
}
```

### Variable Binding Format

**Format:** `{{stepId.fieldName}}`

**Examples:**
- `{{step1.authToken}}` - Reference authToken from step1
- `{{step1.response.body.userId}}` - Reference nested field
- `{{step2.status}}` - Reference status from step2

### Connection Data Flow

1. **User drags connection** from output handle to input handle
2. **System extracts** source step ID and field name from handle ID
3. **System generates** variable reference: `{{sourceStepId.fieldName}}`
4. **System updates** target step's inputs object:
   ```typescript
   {
     ...step.inputs,
     [inputParam]: '{{sourceStepId.fieldName}}'
   }
   ```
5. **System creates** React Flow edge for visualization
6. **Callback fired** with updated steps array

## Handle Naming Convention

### Output Handles (Source)
- **ID Format:** `output-fieldName`
- **Examples:**
  - `output-authToken`
  - `output-response`
  - `output-userId`

### Input Handles (Target)
- **ID Format:** `input-paramName`
- **Examples:**
  - `input-authToken`
  - `input-url`
  - `input-body`

## Styling

### Colors by Step Type

| Type | Background | Border | Icon |
|------|-----------|--------|------|
| HTTP | Blue (bg-blue-50) | border-blue-300 | Globe |
| Command | Amber (bg-amber-50) | border-amber-300 | Terminal |
| Branch | Purple (bg-purple-50) | border-purple-300 | GitBranch |
| Loop | Orange (bg-orange-50) | border-orange-300 | Repeat |
| Assertion | Green (bg-green-50) | border-green-300 | CheckCircle |
| Merge | Cyan (bg-cyan-50) | border-cyan-300 | Layers |
| Group | Indigo (bg-indigo-50) | border-indigo-300 | Layers |

### Handle Colors
- **Input handles:** Purple (`bg-purple-500`)
- **Output handles:** Cyan (`bg-cyan-500`)

## Integration with WorkflowView

The DataFlowEditor is integrated into WorkflowView with a toggle:

```tsx
<WorkflowView
  steps={steps}
  onStepsChange={setSteps} // Required for editing
  onStepClick={handleClick}
/>
```

**Toggle buttons:**
- **List View** - Traditional vertical workflow visualization
- **Data Flow** - Interactive React Flow editor

## Technical Details

### Dependencies
- `@xyflow/react@^12.9.3` - React Flow library
- `react@^19.2.0` - React
- `lucide-react@^0.554.0` - Icons

### React Flow Configuration
- **Connection Mode:** `ConnectionMode.Loose`
- **Edge Type:** `smoothstep` with animation
- **Zoom Range:** 0.2x to 2x
- **Fit View:** Enabled by default

### Layout Algorithm
Currently uses simple vertical layout with fixed positions. Future improvements:
- DAG-based auto-layout
- Hierarchical layout for dependencies
- Force-directed layout option

## Future Enhancements

### Phase 2 (Planned)
- [ ] Type checking for connections (validate data types)
- [ ] Multi-select and bulk operations
- [ ] Undo/redo support
- [ ] Connection preview on hover
- [ ] Auto-layout algorithms (Dagre, ELK)
- [ ] Export/import graph as JSON
- [ ] Search and filter nodes
- [ ] Group nodes into sub-workflows

### Phase 3 (Ideas)
- [ ] Real-time execution visualization
- [ ] Breakpoint debugging
- [ ] Variable inspector panel
- [ ] Connection labels showing variable names
- [ ] Miniature connection previews
- [ ] Keyboard shortcuts
- [ ] Touch gesture support

## Testing

### Manual Testing Checklist
- [ ] Create connection between two steps
- [ ] Verify variable binding is generated
- [ ] Delete connection and verify binding is removed
- [ ] Test zoom and pan
- [ ] Test MiniMap navigation
- [ ] Test readonly mode
- [ ] Test with empty steps array
- [ ] Test with complex workflow (10+ steps)
- [ ] Test toggle between List and Data Flow views

### Integration Testing
- [ ] Test with CaseDetail component
- [ ] Test with TestCaseManager
- [ ] Test with workflow execution
- [ ] Test data persistence (save/load)

## Troubleshooting

### Common Issues

**Issue:** Connections not appearing
- **Solution:** Check that steps have `outputs` and `inputs` defined
- **Verify:** `extractInputParameters` and `extractOutputVariables` return non-empty arrays

**Issue:** Variable bindings not updating
- **Solution:** Ensure `onChange` callback is passed and properly handles state
- **Verify:** React state is being updated correctly

**Issue:** Nodes overlapping
- **Solution:** Adjust `NODE_HEIGHT` and `VERTICAL_SPACING` in utils.ts
- **Future:** Implement auto-layout algorithm

**Issue:** TypeScript errors
- **Solution:** Ensure `@xyflow/react` is installed and types are available
- **Verify:** Import `ReactFlow` as named export, not default

## Contributing

### Adding New Node Types
1. Update `types.ts` to add new `StepType`
2. Add icon mapping in `ReactFlowStepNode.tsx`
3. Add color scheme in `getNodeColor()` function
4. Update documentation

### Adding New Features
1. Test with existing workflows
2. Ensure backward compatibility
3. Update this README
4. Add TypeScript types

## Files Modified/Created

### New Files
- `/front/components/testcase/dataflow/DataFlowEditor.tsx`
- `/front/components/testcase/dataflow/ReactFlowStepNode.tsx`
- `/front/components/testcase/dataflow/utils.ts`
- `/front/components/testcase/workflow/DataFlowEditorExample.tsx`

### Modified Files
- `/front/components/testcase/dataflow/index.ts` - Added exports
- `/front/components/testcase/workflow/WorkflowView.tsx` - Added toggle

### Existing Files (Unchanged)
- `/front/components/testcase/dataflow/DataFlowDiagram.tsx` - Static visualization
- `/front/components/testcase/dataflow/StepNode.tsx` - Static node component

## License

This component is part of the Test Management Platform and follows the same license.

## Support

For issues or questions:
1. Check this README first
2. Review the example in `DataFlowEditorExample.tsx`
3. Check React Flow documentation: https://reactflow.dev
4. Contact the development team

---

**Last Updated:** 2025-11-26
**Version:** 1.0.0
**Status:** Production Ready ✅
