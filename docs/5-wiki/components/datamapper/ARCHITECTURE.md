# DataMapper Component Architecture

## Component Hierarchy

```
DataMapperDemo (Demo/Example)
│
└── DataMapper (Main Component)
    ├── Header Section
    │   ├── Title
    │   ├── Auto Map Button
    │   ├── Clear All Button
    │   └── Close Button
    │
    ├── Main Panel (Dual Layout)
    │   ├── Source Panel (Left)
    │   │   ├── Panel Header
    │   │   │   ├── Source Step Name
    │   │   │   └── "Outputs" Label
    │   │   │
    │   │   └── Field List (Scrollable)
    │   │       └── Field Card (for each output)
    │   │           ├── Connection Circle
    │   │           ├── Field Name
    │   │           ├── JSONPath
    │   │           ├── Type Badge
    │   │           └── Value Preview
    │   │
    │   └── Target Panel (Right)
    │       ├── Panel Header
    │       │   ├── Target Step Name
    │       │   └── "Inputs" Label
    │       │
    │       └── Field List (Scrollable)
    │           └── Field Card (for each input)
    │               ├── Connection Circle
    │               ├── Field Name
    │               ├── Type Label
    │               ├── Binding Info (if bound)
    │               │   ├── Source Path
    │               │   └── Transform Badge
    │               └── Delete Button
    │
    └── Footer Section
        ├── Status Message
        └── Done Button
```

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│                     Parent Component                     │
│                    (e.g., StepCard)                      │
│                                                          │
│  State:                                                  │
│  - showMapper: boolean                                   │
│  - bindings: DataBinding[]                               │
│                                                          │
│  Data Sources:                                           │
│  - sourceOutputs: DataField[] ←─ Previous step execution│
│  - targetInputs: DataField[] ←─ Current step config     │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ Props
                     ↓
┌─────────────────────────────────────────────────────────┐
│                      DataMapper                          │
│                                                          │
│  Internal State:                                         │
│  - selectedSource: string | null                         │
│  - selectedTarget: string | null                         │
│                                                          │
│  Event Handlers:                                         │
│  - handleSourceClick(field)                              │
│  - handleTargetClick(field)                              │
│  - createBinding(source, target)                         │
│  - deleteBinding(bindingId)                              │
│  - autoMap()                                             │
│  - clearAll()                                            │
│                                                          │
│  Callbacks:                                              │
│  - onBindingsChange(bindings) ───────────────────────┐  │
│  - onClose() ─────────────────────────────────────┐  │  │
└──────────────────────────────────────────────────│──│──┘
                                                   │  │
                                                   │  │
                                                   ↓  ↓
┌─────────────────────────────────────────────────────────┐
│                     Parent Component                     │
│                                                          │
│  Updates:                                                │
│  - bindings ← Updated binding array                      │
│  - showMapper ← false (close)                            │
└─────────────────────────────────────────────────────────┘
```

## State Management

### Parent Component State

```typescript
// Persistent state (saved to step config)
const [bindings, setBindings] = useState<DataBinding[]>([]);

// UI state (temporary)
const [showMapper, setShowMapper] = useState(false);
```

### DataMapper Internal State

```typescript
// Selection state (cleared after binding creation)
const [selectedSource, setSelectedSource] = useState<string | null>(null);
const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
```

## User Interaction Flow

### Flow 1: Manual Binding Creation

```
User clicks Source Field
     ↓
selectedSource = field.path
selectedTarget = null
     ↓
Source field shows blue highlight
     ↓
User clicks Target Field
     ↓
createBinding(selectedSource, targetField.name)
     ↓
New binding created
     ↓
selectedSource = null
selectedTarget = null
     ↓
onBindingsChange(updatedBindings)
     ↓
Parent receives updated bindings
     ↓
Re-render with new binding shown
```

### Flow 2: Auto-mapping

```
User clicks "Auto Map"
     ↓
autoMap() function
     ↓
For each targetInput:
  Find sourceOutput with matching name
     ↓
  If found and not already bound:
    Create new binding
     ↓
Collect all new bindings
     ↓
onBindingsChange([...existingBindings, ...newBindings])
     ↓
Parent receives updated bindings
     ↓
Re-render with all auto-mapped bindings shown
```

### Flow 3: Binding Deletion

```
User clicks X button on bound target
     ↓
deleteBinding(binding.id)
     ↓
Filter out binding from array
     ↓
onBindingsChange(filteredBindings)
     ↓
Parent receives updated bindings
     ↓
Re-render without deleted binding
```

## Visual States

### Field Card States

```typescript
// State 1: Unbound
{
  backgroundColor: 'white',
  border: '1px solid #e2e8f0', // slate-200
  circle: 'white with gray border'
}

// State 2: Bound
{
  backgroundColor: '#d1fae5',   // green-50
  border: '1px solid #86efac',  // green-300
  circle: 'green filled'
}

// State 3: Selected
{
  backgroundColor: '#dbeafe',   // blue-50
  border: '1px solid #3b82f6',  // blue-500
  circle: 'same as bound/unbound'
}
```

### Connection Indicator (Circle)

```
Unbound:  ○  (white circle, gray border)
Bound:    ●  (green filled circle, green border)
```

## Type System

### Core Types

```typescript
// User-facing types
DataBinding      // Complete binding configuration
DataTransform    // Optional transformation
DataField        // Field metadata for UI

// Internal types
FieldState = 'unbound' | 'bound' | 'selected'
PanelType = 'source' | 'target'
```

### Type Relationships

```
DataField (UI)
     ↓
Used to create
     ↓
DataBinding (Data Model)
     ↓
Saved to
     ↓
WorkflowStep.dataMappers[]
     ↓
Processed by
     ↓
Backend Executor
```

## Styling System

### Tailwind Classes Used

```css
/* Layout */
.fixed .inset-0                    /* Modal overlay */
.flex .items-center .justify-center /* Center modal */
.w-full .max-w-5xl                 /* Max width */
.max-h-[90vh]                      /* Max height */

/* Panels */
.w-1/2                             /* 50% width each */
.border-r .border-slate-200        /* Divider */
.overflow-y-auto                   /* Scrollable */

/* Field Cards */
.p-3 .rounded-lg .border           /* Card styling */
.cursor-pointer                    /* Clickable */
.transition-all                    /* Smooth animations */

/* States */
.bg-green-50 .border-green-300     /* Bound state */
.bg-blue-50 .border-blue-500       /* Selected state */
.bg-white .border-slate-200        /* Default state */

/* Typography */
.text-sm .font-medium              /* Field names */
.text-xs .text-slate-500           /* Metadata */
.font-mono                         /* Code/paths */
```

## Performance Considerations

### Optimization Strategies

1. **Avoid Re-renders**
   - Use `useState` for local selection state
   - Only call `onBindingsChange` when bindings actually change

2. **Efficient List Rendering**
   - Use `key` prop with stable IDs
   - Avoid inline object creation in render

3. **Scroll Performance**
   - Use `overflow-y-auto` for virtual scrolling
   - Limit field list height with `max-h`

4. **Event Handlers**
   - Use `useCallback` for handler memoization (future)
   - Avoid creating new functions in render

### Scalability

| Fields | Performance |
|--------|-------------|
| < 20   | Excellent   |
| 20-50  | Good        |
| 50-100 | Fair        |
| > 100  | Consider virtualization |

## Extension Points

### 1. Custom Field Renderer

```typescript
interface DataMapperProps {
  // ... existing props
  renderSourceField?: (field: DataField) => React.ReactNode;
  renderTargetField?: (field: DataField) => React.ReactNode;
}
```

### 2. Transform Editor

```typescript
// Add transform editor modal
const [editingBinding, setEditingBinding] = useState<DataBinding | null>(null);

<TransformEditor
  binding={editingBinding}
  onSave={(transform) => updateBindingTransform(editingBinding.id, transform)}
  onClose={() => setEditingBinding(null)}
/>
```

### 3. Validation Layer

```typescript
interface DataMapperProps {
  // ... existing props
  validateBinding?: (binding: DataBinding) => ValidationResult;
}

// Show validation errors
{validationError && (
  <div className="text-red-600 text-xs mt-1">
    {validationError.message}
  </div>
)}
```

### 4. Drag-and-Drop

```typescript
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

// Replace click handlers with drag handlers
<Draggable draggableId={field.path} index={index}>
  {(provided) => (
    <div ref={provided.innerRef} {...provided.draggableProps}>
      {/* Field content */}
    </div>
  )}
</Draggable>
```

## Testing Strategy

### Unit Tests

```typescript
describe('DataMapper', () => {
  test('creates binding on source-then-target click', () => {
    // ... test implementation
  });

  test('auto-mapping matches fields by name', () => {
    // ... test implementation
  });

  test('deletes binding on X click', () => {
    // ... test implementation
  });
});
```

### Integration Tests

```typescript
describe('DataMapper Integration', () => {
  test('integrates with StepCard', () => {
    // ... test implementation
  });

  test('persists bindings to step config', () => {
    // ... test implementation
  });
});
```

## Accessibility

### ARIA Labels (Future Enhancement)

```typescript
<button
  aria-label={`Create binding from ${field.name}`}
  role="button"
>
  {/* Field content */}
</button>
```

### Keyboard Navigation (Future Enhancement)

- `Tab`: Navigate between fields
- `Enter`: Select field / Create binding
- `Escape`: Cancel selection / Close modal
- `Delete`: Remove selected binding

---

This architecture provides a solid foundation that can be extended with additional features while maintaining simplicity and performance.
