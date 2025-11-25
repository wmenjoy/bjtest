# Workflow View - Integration and Modification Guide

## Architecture Overview

The Workflow View feature consists of three main components that work together:

```
CaseDetail (Parent)
    ├── ViewModeSwitcher (Controls)
    └── WorkflowView (Visualization)
            └── WorkflowNode[] (Individual Steps)
```

## Component Details

### 1. ViewModeSwitcher

**Purpose**: Toggle between view modes
**Location**: `NextTestPlatformUI/components/testcase/ViewModeSwitcher.tsx`

**Props**:
```typescript
interface ViewModeSwitcherProps {
  currentMode: ViewMode;
  onChange: (mode: ViewMode) => void;
}

type ViewMode = 'list' | 'workflow';
```

**Customization Points**:

Add more view modes:
```typescript
// 1. Extend the type
export type ViewMode = 'list' | 'workflow' | 'timeline' | 'kanban';

// 2. Add button
<button onClick={() => onChange('timeline')}>
  <Clock size={16} />
  <span>Timeline</span>
</button>
```

Change styling:
```typescript
// Modify the className strings
className={`
  px-4 py-2 text-sm font-medium
  ${currentMode === 'list'
    ? 'bg-green-600 text-white'  // Your custom active style
    : 'bg-white text-slate-600'
  }
`}
```

---

### 2. WorkflowView

**Purpose**: Render workflow diagram
**Location**: `NextTestPlatformUI/components/testcase/workflow/WorkflowView.tsx`

**Props**:
```typescript
interface WorkflowViewProps {
  steps: WorkflowStep[];
  onStepClick?: (step: WorkflowStep) => void;
}
```

**Architecture**:
```typescript
WorkflowView
  ├── Start Node (always shown)
  ├── WorkflowNode[] (mapped from steps array)
  │   ├── Step Number Badge
  │   ├── Step Icon (type-based)
  │   ├── Step Name
  │   ├── Type Label
  │   ├── Condition/Loop Indicators
  │   ├── Input/Output Summary
  │   └── Connector Arrow
  ├── End Node (always shown)
  └── Detail Panel (conditionally shown)
```

**Customization Points**:

#### Add Custom Step Types

```typescript
// In getStepIcon()
const getStepIcon = () => {
  // Add your custom type
  if (step.type === 'database') {
    return <Database size={16} className="text-green-600" />;
  }
  if (step.type === 'api') {
    return <Cloud size={16} className="text-sky-600" />;
  }
  // ... existing logic
};

// In getStepColor()
const getStepColor = () => {
  if (step.type === 'database') return 'border-green-200 bg-green-50';
  if (step.type === 'api') return 'border-sky-200 bg-sky-50';
  // ... existing logic
};
```

#### Modify Node Appearance

```typescript
// Change node size
<div className="w-80 ...">  // Change from w-80 to w-96 for wider nodes

// Change node padding
<div className="p-4 ...">  // Change to p-6 for more padding

// Change shadow
<div className="shadow-sm ...">  // Change to shadow-lg for deeper shadow
```

#### Add More Node Information

```typescript
// In WorkflowNode component, add after existing content
{step.timeout && (
  <div className="mt-2 text-xs text-slate-500">
    <Clock size={10} className="inline mr-1" />
    Timeout: {step.timeout}s
  </div>
)}

{step.retryCount && (
  <div className="mt-2 text-xs text-slate-500">
    <RotateCcw size={10} className="inline mr-1" />
    Retry: {step.retryCount} times
  </div>
)}
```

#### Customize Detail Panel

```typescript
// Modify the detail panel JSX
{selectedStep && (
  <div className="fixed right-4 top-20 w-96 ...">  // Change width, position
    {/* Add custom sections */}
    <div className="mt-4">
      <h5 className="font-bold">Execution History</h5>
      <ExecutionHistory stepId={selectedStep.id} />
    </div>
  </div>
)}
```

---

### 3. CaseDetail Integration

**Purpose**: Host and control view modes
**Location**: `NextTestPlatformUI/components/testcase/CaseDetail.tsx`

**Integration Points**:

#### State Management
```typescript
// Current implementation
const [viewMode, setViewMode] = useState<ViewMode>('list');

// Remember user preference
const [viewMode, setViewMode] = useState<ViewMode>(
  localStorage.getItem('preferredViewMode') as ViewMode || 'list'
);

// Save preference on change
const handleViewModeChange = (mode: ViewMode) => {
  setViewMode(mode);
  localStorage.setItem('preferredViewMode', mode);
};
```

#### Conditional Rendering
```typescript
// Current structure
{viewMode === 'list' ? (
  <div>List View</div>
) : (
  <div>Workflow View</div>
)}

// Add more modes
{viewMode === 'list' && <ListView />}
{viewMode === 'workflow' && <WorkflowView />}
{viewMode === 'timeline' && <TimelineView />}
{viewMode === 'kanban' && <KanbanView />}
```

---

## Adding Execution State Visualization

To show real-time execution status on workflow nodes:

### Step 1: Extend Props

```typescript
// In WorkflowView.tsx
interface WorkflowViewProps {
  steps: WorkflowStep[];
  execution?: StepExecution[];  // Add execution data
  onStepClick?: (step: WorkflowStep) => void;
}

interface WorkflowNodeProps {
  step: WorkflowStep;
  execution?: StepExecution;  // Add execution state
  index: number;
  isLast: boolean;
  onClick?: (step: WorkflowStep) => void;
}
```

### Step 2: Map Execution State

```typescript
// In WorkflowView component
<WorkflowNode
  key={step.id}
  step={step}
  execution={execution?.find(e => e.stepId === step.id)}
  index={index}
  isLast={index === steps.length - 1}
  onClick={handleStepClick}
/>
```

### Step 3: Render Execution State

```typescript
// In WorkflowNode component
const getExecutionColor = () => {
  if (!execution) return '';
  switch (execution.status) {
    case 'passed': return 'border-green-500 bg-green-50';
    case 'failed': return 'border-red-500 bg-red-50';
    case 'running': return 'border-blue-500 bg-blue-50 animate-pulse';
    case 'skipped': return 'border-gray-500 bg-gray-50';
    default: return '';
  }
};

// Apply to node
<div className={`
  ${getStepColor()}
  ${getExecutionColor()}  // Override with execution state
`}>
```

### Step 4: Show Status Icon

```typescript
// Add status badge
{execution && (
  <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center bg-white border-2">
    {execution.status === 'passed' && <Check size={14} className="text-green-600" />}
    {execution.status === 'failed' && <X size={14} className="text-red-600" />}
    {execution.status === 'running' && <Loader size={14} className="text-blue-600 animate-spin" />}
  </div>
)}
```

### Step 5: Pass from CaseDetail

```typescript
// In CaseDetail.tsx
<WorkflowView
  steps={testCase.steps}
  execution={executionData}  // Pass execution state
/>
```

---

## Adding Horizontal Branching

For steps that run in parallel:

### Step 1: Detect Parallel Steps

```typescript
// Helper function
function detectParallelSteps(steps: WorkflowStep[]): WorkflowStep[][] {
  const layers: WorkflowStep[][] = [];
  const processed = new Set<string>();

  steps.forEach(step => {
    if (!step.dependsOn || step.dependsOn.length === 0) {
      // Root step, add to first layer
      if (!layers[0]) layers[0] = [];
      layers[0].push(step);
      processed.add(step.id);
    }
  });

  // Continue for dependent steps...
  return layers;
}
```

### Step 2: Render Layers

```typescript
// In WorkflowView
const layers = detectParallelSteps(steps);

{layers.map((layer, layerIndex) => (
  <div key={layerIndex} className="flex justify-center space-x-4">
    {layer.map((step, stepIndex) => (
      <WorkflowNode
        key={step.id}
        step={step}
        index={stepIndex}
        isLast={false}
      />
    ))}
  </div>
))}
```

---

## Adding Zoom and Pan

Use a library like `react-zoom-pan-pinch`:

### Installation

```bash
npm install react-zoom-pan-pinch
```

### Integration

```typescript
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';

export const WorkflowView: React.FC<WorkflowViewProps> = ({ steps }) => {
  return (
    <TransformWrapper
      initialScale={1}
      minScale={0.5}
      maxScale={3}
      centerOnInit={true}
    >
      {({ zoomIn, zoomOut, resetTransform }) => (
        <>
          {/* Zoom controls */}
          <div className="absolute top-4 right-4 flex space-x-2 z-10">
            <button onClick={() => zoomIn()}>+</button>
            <button onClick={() => zoomOut()}>-</button>
            <button onClick={() => resetTransform()}>Reset</button>
          </div>

          {/* Zoomable content */}
          <TransformComponent>
            <div className="workflow-canvas">
              {/* Your workflow nodes here */}
            </div>
          </TransformComponent>
        </>
      )}
    </TransformWrapper>
  );
};
```

---

## Adding Export Functionality

To export workflow as image:

### Using html2canvas

```bash
npm install html2canvas
```

```typescript
import html2canvas from 'html2canvas';

const exportWorkflow = async () => {
  const element = document.getElementById('workflow-view');
  if (!element) return;

  const canvas = await html2canvas(element);
  const dataUrl = canvas.toDataURL('image/png');

  // Download
  const link = document.createElement('a');
  link.download = 'workflow.png';
  link.href = dataUrl;
  link.click();
};

// Add export button
<button onClick={exportWorkflow}>
  <Download size={16} />
  Export as PNG
</button>
```

---

## Performance Optimization

### For Large Workflows (100+ steps)

#### Virtual Scrolling

```typescript
import { FixedSizeList as List } from 'react-window';

<List
  height={600}
  itemCount={steps.length}
  itemSize={150}
  width="100%"
>
  {({ index, style }) => (
    <div style={style}>
      <WorkflowNode step={steps[index]} index={index} />
    </div>
  )}
</List>
```

#### Memoization

```typescript
const WorkflowNode = React.memo<WorkflowNodeProps>(({ step, index }) => {
  // Component implementation
}, (prevProps, nextProps) => {
  // Custom comparison
  return prevProps.step.id === nextProps.step.id &&
         prevProps.execution?.status === nextProps.execution?.status;
});
```

#### Lazy Loading

```typescript
const [visibleSteps, setVisibleSteps] = useState(steps.slice(0, 20));

useEffect(() => {
  const handleScroll = () => {
    // Load more steps as user scrolls
    if (shouldLoadMore()) {
      setVisibleSteps(steps.slice(0, visibleSteps.length + 20));
    }
  };

  window.addEventListener('scroll', handleScroll);
  return () => window.removeEventListener('scroll', handleScroll);
}, [visibleSteps]);
```

---

## Styling Customization

### Theme Integration

```typescript
// Define theme
const workflowTheme = {
  node: {
    width: 'w-80',
    padding: 'p-4',
    rounded: 'rounded-lg',
    shadow: 'shadow-sm',
  },
  colors: {
    http: 'border-blue-200 bg-blue-50',
    command: 'border-amber-200 bg-amber-50',
    // ...
  }
};

// Use in component
<div className={`${theme.node.width} ${theme.node.padding} ...`}>
```

### Dark Mode Support

```typescript
const getStepColor = (isDark: boolean) => {
  if (step.type === 'http') {
    return isDark
      ? 'border-blue-700 bg-blue-900'
      : 'border-blue-200 bg-blue-50';
  }
  // ... other types
};

<div className={`${getStepColor(isDarkMode)}`}>
```

---

## Testing

### Unit Tests

```typescript
// WorkflowView.test.tsx
import { render, screen } from '@testing-library/react';
import { WorkflowView } from './WorkflowView';

describe('WorkflowView', () => {
  it('renders start and end nodes', () => {
    render(<WorkflowView steps={[]} />);
    expect(screen.getByText('Start')).toBeInTheDocument();
    expect(screen.getByText('End')).toBeInTheDocument();
  });

  it('renders all steps', () => {
    const steps = [
      { id: '1', name: 'Step 1', type: 'http' },
      { id: '2', name: 'Step 2', type: 'command' },
    ];
    render(<WorkflowView steps={steps} />);
    expect(screen.getByText('Step 1')).toBeInTheDocument();
    expect(screen.getByText('Step 2')).toBeInTheDocument();
  });
});
```

### Integration Tests

```typescript
// CaseDetail.test.tsx
it('switches between list and workflow view', async () => {
  const { user } = render(<CaseDetail testCase={mockTestCase} />);

  // Initially in list view
  expect(screen.getByText('List View')).toBeVisible();

  // Click workflow button
  await user.click(screen.getByRole('button', { name: /workflow/i }));

  // Now in workflow view
  expect(screen.getByText('Start')).toBeVisible();
});
```

---

## Troubleshooting

### Common Issues

**Issue**: Nodes not rendering
**Solution**: Check that steps array is not empty and has valid IDs

**Issue**: Icons not showing
**Solution**: Ensure lucide-react is installed: `npm install lucide-react`

**Issue**: Styling broken
**Solution**: Verify Tailwind CSS is configured and includes component paths

**Issue**: Click handlers not working
**Solution**: Check event propagation and ensure onClick is passed correctly

---

## API Reference

### ViewModeSwitcher

```typescript
<ViewModeSwitcher
  currentMode="list"  // 'list' | 'workflow'
  onChange={(mode) => setViewMode(mode)}
/>
```

### WorkflowView

```typescript
<WorkflowView
  steps={testCase.steps}          // Required: array of WorkflowStep
  onStepClick={(step) => {}}      // Optional: callback when step clicked
  execution={executionData}       // Optional: execution state data
/>
```

### WorkflowNode (Internal)

```typescript
<WorkflowNode
  step={step}                     // Required: WorkflowStep
  index={0}                       // Required: step index
  isLast={false}                  // Required: is last step
  onClick={(step) => {}}          // Optional: click handler
  execution={executionState}      // Optional: execution state
/>
```

---

## Best Practices

1. **Keep Nodes Simple**: Don't overcrowd nodes with information
2. **Use Color Consistently**: Same colors for same step types everywhere
3. **Provide Feedback**: Show loading states, hover effects
4. **Optimize for Performance**: Use memoization for large workflows
5. **Test Edge Cases**: Empty workflows, single steps, very long names
6. **Document Custom Types**: If adding custom step types, document them
7. **Follow Accessibility**: Use proper ARIA labels, keyboard navigation

---

## Contributing

When modifying these components:

1. Update TypeScript types in `types.ts`
2. Update this documentation
3. Add unit tests for new features
4. Test with real workflow data
5. Update user guide if UI changes
6. Consider backwards compatibility

---

## Resources

- **React Documentation**: https://react.dev
- **TypeScript Handbook**: https://www.typescriptlang.org/docs/
- **Tailwind CSS**: https://tailwindcss.com/docs
- **Lucide Icons**: https://lucide.dev

---

## Contact

For questions or issues with Workflow View implementation, contact the development team or open an issue in the project repository.
