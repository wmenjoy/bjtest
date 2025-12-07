# Advanced DAG Editor

## Overview

The **AdvancedDAGEditor** is a React component built on top of React Flow and Dagre that provides a visual, interactive workflow editor with automatic DAG (Directed Acyclic Graph) layout capabilities.

## Features

### Core Capabilities
- **Visual DAG Representation**: Automatically converts workflow steps into a visual graph
- **Auto-Layout**: Uses Dagre algorithm for automatic node positioning
- **Interactive Editing**: Drag nodes, create connections, and edit dependencies
- **Multi-Layout Support**: Toggle between vertical (top-to-bottom) and horizontal (left-to-right) layouts
- **Read-Only Mode**: Display workflows without allowing modifications
- **MiniMap Navigation**: Overview map for easy navigation in large workflows
- **Detailed Inspector**: Right-side panel showing selected node details

### Supported Step Types

The editor supports and visually differentiates these step types:

| Type | Color | Icon | Description |
|------|-------|------|-------------|
| `http` | Blue | Globe | HTTP request steps |
| `database` | Red | Database | Database query steps |
| `command` | Orange | Terminal | Command/shell execution |
| `branch` | Purple | GitBranch | Conditional branching |
| `loop` | Violet | Repeat | Iteration/loop steps |
| `merge` | Green | Workflow | Merge multiple branches |
| Default | Slate | Workflow | Generic steps |

### Control Flow Features

1. **Branches**: Visual representation of conditional paths
   - Shows all branch conditions
   - Connects parent to child steps
   - Purple-colored edges

2. **Loops**: Visual representation of iteration
   - Shows loop configuration (forEach, while, count)
   - Displays loop body steps
   - Violet-colored edges

3. **Dependencies**: DAG-based execution order
   - `dependsOn` array creates edges between steps
   - Animated edges show flow direction
   - Slate-colored edges for dependencies

## Installation

```bash
npm install @xyflow/react @dagrejs/dagre
```

## Usage

### Basic Usage

```tsx
import { AdvancedDAGEditor } from './components/AdvancedDAGEditor';
import { WorkflowStep } from './types';

function MyWorkflowEditor() {
  const [steps, setSteps] = useState<WorkflowStep[]>([
    {
      id: 'step-1',
      name: 'Fetch Data',
      type: 'http',
      config: { url: '/api/data' },
    },
    {
      id: 'step-2',
      name: 'Process Data',
      type: 'command',
      dependsOn: ['step-1'],
    },
  ]);

  return (
    <div className="h-screen">
      <AdvancedDAGEditor
        steps={steps}
        onChange={setSteps}
        readonly={false}
      />
    </div>
  );
}
```

### Read-Only Display

```tsx
<AdvancedDAGEditor
  steps={workflowSteps}
  onChange={() => {}}
  readonly={true}
/>
```

### With Custom Height

```tsx
<div className="h-[600px]">
  <AdvancedDAGEditor
    steps={steps}
    onChange={setSteps}
  />
</div>
```

## Props

### AdvancedDAGEditorProps

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `steps` | `WorkflowStep[]` | Yes | - | Array of workflow steps to visualize |
| `onChange` | `(steps: WorkflowStep[]) => void` | Yes | - | Callback when steps are modified |
| `readonly` | `boolean` | No | `false` | Disable editing (no drag, no connections) |

## WorkflowStep Interface

```typescript
interface WorkflowStep {
  id: string;                      // Unique identifier
  name?: string;                   // Display name
  type?: string;                   // Step type (http, database, etc.)

  // Action Template (recommended)
  actionTemplateId?: string;

  // Inline Config (fallback)
  config?: Record<string, any>;

  // Data Flow
  inputs?: Record<string, string>;
  outputs?: Record<string, string>;

  // Control Flow
  dependsOn?: string[];            // Dependencies (DAG)
  loop?: LoopConfig;               // Loop configuration
  branches?: BranchConfig[];       // Branch configuration
  children?: WorkflowStep[];       // Nested steps

  // UI
  position?: { x: number; y: number }; // Node position

  // Error Handling
  onError?: 'abort' | 'continue' | 'retry';
  retryCount?: number;
  timeout?: number;
}
```

## Interactive Features

### Node Selection
Click any node to view detailed information in the right panel:
- Step ID (unique identifier)
- Step Name
- Type
- Action Template (if used)
- Loop Configuration (if applicable)
- Branch Conditions (if applicable)
- Dependencies
- Input/Output mappings
- Error handling settings

### Creating Dependencies
1. Hover over a node's edge
2. Drag from the source node
3. Drop on the target node
4. A new dependency edge is created
5. The target step's `dependsOn` array is updated

### Node Positioning
- Drag nodes to reposition them
- Positions are automatically saved to `step.position`
- Manual positions persist until auto-layout is applied

### Layout Controls
- **Vertical Button**: Apply top-to-bottom layout
- **Horizontal Button**: Apply left-to-right layout
- Auto-layout recalculates node positions using Dagre

## Styling

The component uses Tailwind CSS for styling. Key classes:

```css
/* Node Styles */
.advanced-dag-editor {
  /* Container styling */
}

/* Custom node colors */
- Blue: HTTP requests (#2563eb)
- Red: Database queries (#dc2626)
- Orange: Commands (#ea580c)
- Purple: Branches (#9333ea)
- Violet: Loops (#7c3aed)
- Green: Merge nodes (#059669)
- Slate: Default (#64748b)
```

## Advanced Examples

### Complex Workflow with Branches

```tsx
const steps: WorkflowStep[] = [
  {
    id: 'check-auth',
    name: 'Check Authentication',
    type: 'http',
  },
  {
    id: 'auth-branch',
    name: 'Authentication Decision',
    type: 'branch',
    branches: [
      {
        condition: '{{response.authenticated}} == true',
        label: 'Authenticated',
        children: [
          {
            id: 'fetch-user-data',
            name: 'Fetch User Data',
            type: 'http',
          },
        ],
      },
      {
        condition: 'default',
        label: 'Not Authenticated',
        children: [
          {
            id: 'redirect-login',
            name: 'Redirect to Login',
            type: 'http',
          },
        ],
      },
    ],
    dependsOn: ['check-auth'],
  },
];
```

### Loop Example

```tsx
const steps: WorkflowStep[] = [
  {
    id: 'fetch-items',
    name: 'Fetch Items',
    type: 'http',
  },
  {
    id: 'process-items',
    name: 'Process Each Item',
    type: 'http',
    loop: {
      type: 'forEach',
      source: '{{items}}',
      itemVar: 'item',
      indexVar: 'i',
      maxIterations: 100,
    },
    children: [
      {
        id: 'process-single',
        name: 'Process Single Item',
        type: 'http',
        config: {
          url: '/api/items/{{item.id}}',
        },
      },
    ],
    dependsOn: ['fetch-items'],
  },
];
```

## Architecture

### Component Structure

```
AdvancedDAGEditor
├── ReactFlow Canvas
│   ├── Custom Nodes (CustomNode component)
│   ├── Edges (dependencies, branches, loops)
│   ├── Background Grid
│   ├── Controls (zoom, fit view)
│   ├── MiniMap
│   └── Panels (layout controls, step count)
└── Details Sidebar
    └── Selected Node Inspector
```

### Data Flow

1. **Input**: `steps` prop (WorkflowStep[])
2. **Convert**: `convertStepsToGraph()` → nodes + edges
3. **Layout**: `getLayoutedElements()` → positioned nodes
4. **Render**: React Flow displays the graph
5. **Interaction**: User modifies (drag, connect)
6. **Output**: `onChange()` callback with updated steps

### Layout Algorithm

The editor uses **Dagre** for automatic layout:

1. Create Dagre graph with spacing config
2. Add all nodes with fixed dimensions
3. Add edges representing dependencies
4. Run `dagre.layout()`
5. Extract calculated positions
6. Apply to React Flow nodes

## Performance Considerations

- **Large Workflows**: Tested with 100+ nodes
- **Rendering**: React Flow handles virtualization
- **Updates**: Efficient re-renders via `useMemo` and `useCallback`
- **Memory**: Dagre layout runs on-demand (layout button click)

## Limitations

1. **Nested Children**: Currently flattens all nested steps for visualization
2. **Circular Dependencies**: Not prevented (future enhancement)
3. **Custom Node Types**: Limited to predefined types
4. **Mobile**: Optimized for desktop (touch support is limited)

## Browser Support

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support
- Mobile: ⚠️ Limited (touch interactions)

## Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@xyflow/react` | ^12.9.3 | React Flow library |
| `@dagrejs/dagre` | ^2.0.0 | Auto-layout algorithm |
| `lucide-react` | ^0.554.0 | Icons |
| `react` | ^19.2.0 | React framework |

## Related Components

- `WorkflowEditor`: Parent component that uses AdvancedDAGEditor
- `SimpleListEditor`: Alternative simple list view
- `ActionLibrary`: Action template management

## Future Enhancements

- [ ] Drag-and-drop from Action Library
- [ ] Undo/Redo support
- [ ] Export as image (PNG/SVG)
- [ ] Validation (detect circular dependencies)
- [ ] Custom node templates
- [ ] Collaborative editing
- [ ] Performance profiler overlay

## Troubleshooting

### Nodes Not Rendering
- Ensure `steps` array has valid `id` fields
- Check console for React Flow errors
- Verify CSS is imported: `import '@xyflow/react/dist/style.css'`

### Layout Broken
- Confirm Dagre is installed: `npm list @dagrejs/dagre`
- Check `position` values are not `NaN`
- Reset layout by clicking Vertical/Horizontal buttons

### Dependencies Not Showing
- Verify `dependsOn` contains valid step IDs
- Check that referenced steps exist in the array
- Ensure IDs are unique

## License

This component is part of the NextTest Platform and follows the project's license terms.

## Contributors

- Built with React Flow v12
- Uses Dagre layout algorithm
- Integrated with NextTest Platform workflow system
