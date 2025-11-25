# Component Structure Overview

## Visual Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        DataMappingPanel                              │
│  ┌──────────────┬───────────────────────┬───────────────────────┐  │
│  │   Upstream   │     Mapping Lines      │   Current Inputs      │  │
│  │   Outputs    │     (Middle Column)    │   (Right Column)      │  │
│  │ (Left Column)│                        │                       │  │
│  │              │                        │                       │  │
│  │ ┌─────────┐  │  ┌──────────────────┐ │  ┌─────────────────┐ │  │
│  │ │Step-1   │  │  │ MappingLine #1   │ │  │ authToken       │ │  │
│  │ │ └token  │──┼──│ step1.token ─→   │─┼──│ (drop zone)     │ │  │
│  │ │  └userId│  │  │   [uppercase]    │ │  │                 │ │  │
│  │ │         │  │  │      authToken   │ │  │ ┌─────────────┐ │ │  │
│  │ └─────────┘  │  └──────────────────┘ │  │ │ userId      │ │ │  │
│  │              │                        │  │ │ (drop zone) │ │ │  │
│  │ ┌─────────┐  │  ┌──────────────────┐ │  │ └─────────────┘ │ │  │
│  │ │Step-2   │  │  │ MappingLine #2   │ │  │                 │ │  │
│  │ │ └status │──┼──│ step2.status ─→  │─┼──│ ┌─────────────┐ │ │  │
│  │ │         │  │  │      status      │ │  │ │ apiKey      │ │ │  │
│  │ └─────────┘  │  └──────────────────┘ │  │ │ (drop zone) │ │ │  │
│  │              │                        │  │ └─────────────┘ │ │  │
│  └──────────────┴───────────────────────┴───────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘

                            │
                            │ User clicks transform badge
                            ▼

┌─────────────────────────────────────────────────────────────────────┐
│            TransformFunctionSelector (Modal)                         │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  [⚡ Transform Function]                              [×]        │ │
│  ├────────────────────────────────────────────────────────────────┤ │
│  │  Select a transformation to apply...                            │ │
│  ├────────────────────────────────────────────────────────────────┤ │
│  │  ● CONTROL                                                       │ │
│  │    [ ] None - No transformation                                 │ │
│  │                                                                  │ │
│  │  ● TEXT                                                          │ │
│  │    [✓] Uppercase - Convert to uppercase                         │ │
│  │        "hello" → "HELLO"                        [Selected]      │ │
│  │    [ ] Lowercase - Convert to lowercase                         │ │
│  │        "HELLO" → "hello"                                        │ │
│  │    [ ] Trim - Remove whitespace                                 │ │
│  │        "  hello  " → "hello"                                    │ │
│  │                                                                  │ │
│  │  ● NUMBER                                                        │ │
│  │    [ ] Parse Integer - Convert to integer                       │ │
│  │        "42" → 42                                                │ │
│  │    [ ] Parse Float - Convert to decimal                         │ │
│  │        "3.14" → 3.14                                            │ │
│  ├────────────────────────────────────────────────────────────────┤ │
│  │  5 transformations available                    [Close]         │ │
│  └────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

## Component Hierarchy

```
DataMappingPanel.tsx (Main Container)
├── Header
│   ├── Title: "Data Flow Mapping"
│   └── Description
│
├── Three-Column Layout (h-96)
│   │
│   ├── LEFT COLUMN: UpstreamOutputTree.tsx
│   │   ├── For each previousStep:
│   │   │   ├── Step Header (collapsible)
│   │   │   │   ├── ChevronRight icon
│   │   │   │   └── Step name
│   │   │   └── Output Fields List
│   │   │       └── For each output:
│   │   │           ├── Database icon
│   │   │           ├── Field name (draggable)
│   │   │           └── onDragStart callback
│   │   │
│   │   └── Empty State: "No previous steps"
│   │
│   ├── MIDDLE COLUMN: MappingLine.tsx
│   │   ├── For each dataMapper:
│   │   │   ├── Source Display
│   │   │   │   ├── sourceStep (blue)
│   │   │   │   ├── dot separator
│   │   │   │   └── sourcePath (slate)
│   │   │   │
│   │   │   ├── Arrow + Transform
│   │   │   │   ├── ArrowRight icon
│   │   │   │   └── Transform Badge (if set)
│   │   │   │       ├── Zap icon
│   │   │   │       ├── transform name
│   │   │   │       └── onClick → open selector
│   │   │   │   └── "+ Transform" button (hover)
│   │   │   │
│   │   │   ├── Target Display
│   │   │   │   └── targetParam (green)
│   │   │   │
│   │   │   └── Action Buttons (hover)
│   │   │       ├── Edit2 icon → inline edit
│   │   │       └── Trash2 icon → delete
│   │   │
│   │   └── TransformFunctionSelector.tsx (Modal)
│   │       ├── Modal Overlay (fixed, z-50)
│   │       ├── Modal Container (w-96)
│   │       │   ├── Header
│   │       │   │   ├── Zap icon + Title
│   │       │   │   └── Close button
│   │       │   │
│   │       │   ├── Description
│   │       │   │
│   │       │   ├── Function List (scrollable)
│   │       │   │   ├── For each category:
│   │       │   │   │   ├── Category Header
│   │       │   │   │   └── For each function:
│   │       │   │   │       ├── Icon (X/Type/Hash)
│   │       │   │   │       ├── Name
│   │       │   │   │       ├── Description
│   │       │   │   │       ├── Example (if exists)
│   │       │   │   │       └── Selected indicator
│   │       │   │   │
│   │       │   │   ├── Control Category
│   │       │   │   │   └── None
│   │       │   │   │
│   │       │   │   ├── Text Category
│   │       │   │   │   ├── Uppercase
│   │       │   │   │   ├── Lowercase
│   │       │   │   │   └── Trim
│   │       │   │   │
│   │       │   │   └── Number Category
│   │       │   │       ├── Parse Integer
│   │       │   │       └── Parse Float
│   │       │   │
│   │       │   └── Footer
│   │       │       ├── Count: "5 available"
│   │       │       └── Close button
│   │       │
│   │       └── Click-outside handler
│   │
│   └── Empty State: "No mappings yet"
│
└── RIGHT COLUMN: CurrentInputsList.tsx
    ├── For each input parameter:
    │   ├── Parameter Header
    │   │   ├── Target icon
    │   │   ├── Parameter name
    │   │   └── Required indicator (*)
    │   │
    │   ├── Drop Zone (droppable)
    │   │   ├── onDrop callback
    │   │   ├── Highlight when dragging
    │   │   └── "Drop here" indicator
    │   │
    │   └── Type hint
    │
    └── Empty State: "No input parameters"
```

## Data Flow Sequence

```
1. USER INITIATES DRAG
   User drags field from UpstreamOutputTree
   ↓
   onDragStart(sourceStep, sourcePath)
   ↓
   setDragData({ sourceStep, sourcePath })

2. USER DROPS ON TARGET
   User drops on CurrentInputsList parameter
   ↓
   onDrop(targetParam)
   ↓
   Create DataMapper object:
   {
     id: "mapper-1732552634523",
     sourceStep: "step-login",
     sourcePath: "output.response.body.token",
     targetParam: "authToken",
     transform: undefined
   }
   ↓
   onChange(updatedStep)
   ↓
   step.dataMappers = [...step.dataMappers, newMapper]

3. MAPPING DISPLAYED
   MappingLine renders in middle column
   ↓
   Shows: step-login.output.response.body.token → authToken
   ↓
   User hovers → shows [+ Transform] and [Delete] buttons

4. USER ADDS TRANSFORM
   User clicks [+ Transform]
   ↓
   setShowTransformSelect(true)
   ↓
   TransformFunctionSelector modal opens
   ↓
   User selects "uppercase"
   ↓
   onChange({ ...mapper, transform: "uppercase" })
   ↓
   setShowTransformSelect(false)
   ↓
   MappingLine updates: shows purple [⚡ uppercase] badge

5. USER CHANGES TRANSFORM
   User clicks purple badge
   ↓
   TransformFunctionSelector opens (shows "uppercase" selected)
   ↓
   User selects "trim"
   ↓
   onChange({ ...mapper, transform: "trim" })
   ↓
   Badge updates: [⚡ trim]

6. USER REMOVES TRANSFORM
   User clicks badge → selects "None"
   ↓
   onChange({ ...mapper, transform: undefined })
   ↓
   Badge hidden → [+ Transform] button appears on hover

7. USER DELETES MAPPING
   User hovers → clicks [Trash] icon
   ↓
   onDelete()
   ↓
   onChange({ ...step, dataMappers: filtered })
   ↓
   MappingLine removed from display
```

## State Management

### DataMappingPanel State
```typescript
const [dragData, setDragData] = useState<{
  sourceStep: string;
  sourcePath: string;
} | null>(null);
```

### MappingLine State
```typescript
const [showTransformSelect, setShowTransformSelect] = useState(false);
const [isEditing, setIsEditing] = useState(false);
```

### TransformFunctionSelector State
```typescript
const modalRef = useRef<HTMLDivElement>(null);
// No local state - controlled by props (value, onChange, onClose)
```

## Props Interface

### DataMappingPanel
```typescript
interface DataMappingPanelProps {
  currentStep: WorkflowStep;        // Step being edited
  previousSteps: WorkflowStep[];    // Upstream steps
  onChange: (step: WorkflowStep) => void; // Persist changes
}
```

### MappingLine
```typescript
interface MappingLineProps {
  mapper: DataMapper;               // Mapping configuration
  onDelete: () => void;             // Delete this mapping
  onChange: (mapper: DataMapper) => void; // Update mapping
}
```

### TransformFunctionSelector
```typescript
interface TransformFunctionSelectorProps {
  value: string;                    // Current transform ("" = none)
  onChange: (transform: string) => void; // New transform selected
  onClose: () => void;              // Close modal
}
```

## Styling Classes Reference

### Colors
```css
/* Source */
.text-blue-600      /* Step name */
.text-slate-700     /* Field path */

/* Target */
.text-green-600     /* Parameter name */

/* Transform */
.bg-purple-100      /* Badge background */
.text-purple-700    /* Badge text */
.hover:bg-purple-200 /* Badge hover */

/* Borders */
.border-slate-200   /* Default borders */
.border-purple-400  /* Selected state */

/* States */
.hover:shadow-sm    /* Hover elevation */
.opacity-0          /* Hidden by default */
.group-hover:opacity-100 /* Show on hover */
```

### Layout
```css
.flex               /* Flexbox container */
.space-x-2          /* Horizontal spacing */
.w-1/3              /* Three-column layout */
.h-96               /* Fixed height */
.overflow-y-auto    /* Internal scrolling */
.truncate           /* Text overflow */
.rounded-lg         /* Rounded corners */
```

## Icon Reference (lucide-react)

| Icon | Usage | Size | Color |
|------|-------|------|-------|
| ArrowRight | Data flow direction | 14px | slate-400 |
| Zap | Transform function | 10px | purple-700 |
| Trash2 | Delete mapping | 12px | slate-400 → red-500 |
| Edit2 | Edit mapping | 12px | slate-400 → blue-500 |
| X | None/Close | 14/16px | slate-400 |
| Type | Text transforms | 14px | blue-500 |
| Hash | Number transforms | 14px | purple-500 |
| ChevronRight | Expandable tree | 14px | slate-400 |
| Database | Output field | 12px | blue-500 |
| Target | Input parameter | 12px | green-500 |

## File Sizes

| File | Size | Lines | Purpose |
|------|------|-------|---------|
| DataMappingPanel.tsx | 4.6 KB | 159 | Main container |
| UpstreamOutputTree.tsx | 3.8 KB | 113 | Left column |
| CurrentInputsList.tsx | 4.6 KB | 135 | Right column |
| MappingLine.tsx | 5.7 KB | 161 | Mapping display |
| TransformFunctionSelector.tsx | 6.0 KB | 175 | Transform picker |
| index.ts | 386 B | 12 | Export barrel |
| **TOTAL** | **25.1 KB** | **755** | Complete implementation |

## Browser Compatibility

### HTML5 Drag-and-Drop API
- Chrome 4+
- Firefox 3.5+
- Safari 3.1+
- Edge (all versions)

### CSS Features Used
- Flexbox (all modern browsers)
- Tailwind CSS utilities (requires build)
- CSS transitions (all modern browsers)

### React Hooks Used
- `useState` (React 16.8+)
- `useRef` (React 16.8+)
- `useEffect` (React 16.8+)

## Performance Metrics

### Initial Render
- 5 components loaded
- ~25 KB total code
- Minimal re-renders (optimized with callbacks)

### Runtime Performance
- Drag-and-drop: Native HTML5 (no overhead)
- Modal rendering: Lazy (only when open)
- List rendering: O(n) where n = number of mappings

### Memory Usage
- Event listeners properly cleaned up
- No memory leaks detected
- Modal overlay removed when closed

## Accessibility Status

### Current Support
- ✅ Keyboard focus (basic)
- ✅ Semantic HTML
- ⚠️ Screen reader support (limited)
- ⚠️ Keyboard navigation (partial)
- ❌ ARIA labels (not implemented)

### Recommended Improvements
- Add `aria-label` to all buttons
- Add `role="dialog"` to modal
- Add `aria-selected` to transform options
- Implement keyboard shortcuts (Delete, Escape)
- Add focus trap in modal

## Integration Checklist

- ✅ Imported in DataMappingPanel
- ✅ Exported in index.ts
- ✅ Type definitions in types/index.ts
- ✅ Backend alignment verified
- ✅ Demo component available
- ✅ Documentation complete
- ✅ No console errors
- ✅ TypeScript compilation passes

## Maintenance Notes

### Dependencies
```json
{
  "react": "^19.2.0",
  "lucide-react": "latest",
  "tailwindcss": "latest"
}
```

### External Dependencies (Backend)
- `github.com/tidwall/gjson` for JSONPath extraction
- Transform functions in `internal/workflow/variable_resolver.go`

### Breaking Changes to Watch For
1. If backend adds new transform functions → update TRANSFORM_FUNCTIONS array
2. If DataMapper type changes → update interface in types/index.ts
3. If resolution logic changes → may need to update UI hints

---

**Last Updated**: 2025-11-25
**Component Version**: 1.0.0
**Status**: Production Ready ✅
