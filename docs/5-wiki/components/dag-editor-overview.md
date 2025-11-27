# AdvancedDAGEditor - Quick Start

A powerful React Flow-based DAG editor for visual workflow creation and editing.

## Installation

```bash
npm install @xyflow/react @dagrejs/dagre
```

## Quick Start

```tsx
import { AdvancedDAGEditor } from './components/AdvancedDAGEditor';
import { WorkflowStep } from './types';

function App() {
  const [steps, setSteps] = useState<WorkflowStep[]>([
    {
      id: 'step-1',
      name: 'Start',
      type: 'http',
    },
    {
      id: 'step-2',
      name: 'Process',
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

## Demo

To see the full demo:

```tsx
import { AdvancedDAGEditorDemo } from './components/AdvancedDAGEditorDemo';

function App() {
  return <AdvancedDAGEditorDemo />;
}
```

## Key Features

✅ Auto-layout (Dagre algorithm)
✅ Vertical/Horizontal layouts
✅ Drag-and-drop node positioning
✅ Create dependencies by connecting nodes
✅ Visual step type differentiation
✅ Branch and loop visualization
✅ Read-only mode
✅ MiniMap navigation
✅ Detailed node inspector

## Step Types

| Type | Visual |
|------|--------|
| `http` | Blue border + Globe icon |
| `database` | Red border + Database icon |
| `command` | Orange border + Terminal icon |
| `branch` | Purple border + Branch icon |
| `loop` | Violet border + Loop icon |
| `merge` | Green border + Workflow icon |

## Full Documentation

See [ADVANCED_DAG_EDITOR.md](./ADVANCED_DAG_EDITOR.md) for complete documentation.

## Files

- `components/AdvancedDAGEditor.tsx` - Main component (620 lines)
- `components/AdvancedDAGEditorDemo.tsx` - Demo component
- `components/ADVANCED_DAG_EDITOR.md` - Full documentation

## Dependencies

- `@xyflow/react@^12.9.3`
- `@dagrejs/dagre@^2.0.0`
- `lucide-react@^0.554.0`
- `react@^19.2.0`
