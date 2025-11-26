# Assertion Editor - Visual Design Guide

## Component Hierarchy

```
AssertionEditor
├── Header
│   ├── Title + Count Badge
│   └── Add Button
├── Empty State (when no assertions)
│   └── Icon + Message
└── Assertion List
    └── AssertionCard (repeatable)
        ├── Header Row
        │   ├── Index Badge
        │   ├── Severity Icon
        │   ├── Summary (collapsed)
        │   └── Action Buttons
        │       ├── Move Up
        │       ├── Move Down
        │       ├── Duplicate
        │       ├── Delete
        │       └── Expand/Collapse
        └── Expanded Content
            ├── Type Selector
            ├── Target Input (with autocomplete)
            ├── Operator Dropdown
            ├── Expected Value Input
            ├── Custom Message Input
            └── Advanced Options
                ├── Severity (radio buttons)
                └── Continue on Failure (checkbox)
```

## Visual States

### Collapsed State
```
┌────────────────────────────────────────────────────────┐
│ 🔵 1  ❌  {{response.status}} equals 200   [↑][↓][⎘][×][˅]│
└────────────────────────────────────────────────────────┘
```

### Expanded State
```
┌────────────────────────────────────────────────────────────┐
│ 🔵 1  ❌  Assertion 1                 [↑][↓][⎘][×][˄]     │
├────────────────────────────────────────────────────────────┤
│ Type: [Value Assertion ▼]                                 │
│                                                            │
│ Target: (Use {{variable}} syntax)                         │
│ [{{response.status}}                           ] 🔍        │
│ ┌───────────────────────────┐                             │
│ │ Available Variables       │                             │
│ │ {{response.status}}       │                             │
│ │ {{response.body}}         │                             │
│ └───────────────────────────┘                             │
│                                                            │
│ Operator: [equals - Value equals expected ▼]              │
│                                                            │
│ Expected Value:                                            │
│ [200                                           ]           │
│                                                            │
│ Custom Message (Optional):                                 │
│ [Expected HTTP 200 OK                          ]           │
│                                                            │
│ ─── Advanced Options ───                                   │
│ Severity: ○ Error  ○ Warning  ○ Info                      │
│ ☑ Continue execution if this assertion fails              │
└────────────────────────────────────────────────────────────┘
```

## Color Scheme

### Severity Colors

**Error (Red)**
- Background: `bg-red-50` (#FEF2F2)
- Border: `border-red-200` (#FECACA)
- Text: `text-red-700` (#B91C1C)
- Icon: `AlertCircle` in red

**Warning (Amber)**
- Background: `bg-amber-50` (#FFFBEB)
- Border: `border-amber-200` (#FDE68A)
- Text: `text-amber-700` (#B45309)
- Icon: `AlertTriangle` in amber

**Info (Blue)**
- Background: `bg-blue-50` (#EFF6FF)
- Border: `border-blue-200` (#BFDBFE)
- Text: `text-blue-700` (#1D4ED8)
- Icon: `Info` in blue

### Operator Badges

```
┌─────────┐  ┌─────────┐  ┌─────────┐
│  HTTP   │  │ COMMAND │  │ ASSERT  │
│ emerald │  │ orange  │  │  cyan   │
└─────────┘  └─────────┘  └─────────┘
```

## Interactive States

### Hover Effects
- Cards: `hover:border-slate-300 hover:shadow-sm`
- Buttons: `hover:bg-blue-100 hover:text-blue-600`
- Delete: `hover:bg-red-50 hover:text-red-500`

### Focus States
- Inputs: `focus:ring-2 focus:ring-blue-200`
- Dropdowns: `focus:outline-none focus:ring-2 focus:ring-blue-200`

### Disabled States
- Background: `disabled:bg-slate-50`
- Text: `disabled:text-slate-500`
- Cursor: `cursor-not-allowed`

## Responsive Design

### Desktop (>1024px)
```
┌─────────────────────────────────────────────────────────┐
│  Assertions (3)                          [+ Add]        │
├─────────────────────────────────────────────────────────┤
│  [Full width cards with all controls visible]          │
└─────────────────────────────────────────────────────────┘
```

### Tablet (768px - 1024px)
```
┌──────────────────────────────────────┐
│  Assertions (3)          [+ Add]     │
├──────────────────────────────────────┤
│  [Slightly narrower cards]           │
└──────────────────────────────────────┘
```

### Mobile (<768px)
```
┌────────────────────────┐
│  Assertions (3)        │
│  [+ Add]               │
├────────────────────────┤
│  [Stacked layout]      │
│  [Buttons wrap]        │
└────────────────────────┘
```

## Empty State

```
┌─────────────────────────────────────────────────────┐
│                        🔔                           │
│                                                     │
│              No assertions defined                  │
│                                                     │
│     Click "Add Assertion" to create validation      │
│                     rules                           │
└─────────────────────────────────────────────────────┘
```

## Variable Suggestions Dropdown

```
Target: [{{resp|                                    ]
        ┌──────────────────────────────────────┐
        │ Available Variables                  │
        ├──────────────────────────────────────┤
        │ {{response.status}}        ← hover   │
        │ {{response.body}}                    │
        │ {{response.headers}}                 │
        │ {{response.time}}                    │
        └──────────────────────────────────────┘
```

## Operator Dropdown

```
Operator: [equals - Value equals expec|              ▼]
          ┌────────────────────────────────────────┐
          │ Equals - Value equals expected         │
          │ Not Equals - Value does not equal      │
          │ Greater Than - Value is greater than   │
          │ Less Than - Value is less than         │
          │ Contains - String/Array contains       │
          │ Not Contains - Does not contain        │
          │ Exists - Field exists                  │
          │ Not Exists - Field does not exist      │
          │ Matches Regex - Matches pattern        │
          │ Array Length - Array has length        │
          └────────────────────────────────────────┘
```

## Quick Stats Footer

```
┌─────────────────────────────────────────────────────┐
│ 2 error-level  •  1 warning-level  •  1 continue   │
└─────────────────────────────────────────────────────┘
```

## Animation & Transitions

### Card Expand/Collapse
- Duration: 200ms
- Easing: ease-in-out
- Property: max-height + opacity

### Hover States
- Duration: 150ms
- Easing: ease-out
- Properties: background-color, border-color, shadow

### Button Press
- Active state: `active:scale-95`
- Duration: 100ms

## Accessibility

### Keyboard Navigation
- Tab: Move between fields
- Enter: Submit / Toggle
- Escape: Close dropdown / Cancel
- Arrow keys: Navigate dropdowns
- Space: Toggle checkboxes/radios

### ARIA Labels
- `aria-label` on icon buttons
- `role="button"` on clickable elements
- `aria-expanded` on expandable sections
- `aria-live="polite"` on status updates

### Screen Reader Text
- Hidden labels for icon-only buttons
- Descriptive placeholder text
- Clear error messages

## Icon Reference

| Icon | Component | Usage |
|------|-----------|-------|
| Plus | `<Plus size={14} />` | Add assertion |
| ChevronDown | `<ChevronDown size={14} />` | Expand card |
| ChevronUp | `<ChevronUp size={14} />` | Collapse card |
| Trash2 | `<Trash2 size={14} />` | Delete assertion |
| Copy | `<Copy size={14} />` | Duplicate assertion |
| ArrowUp | `<ArrowUp size={14} />` | Move up |
| ArrowDown | `<ArrowDown size={14} />` | Move down |
| AlertCircle | `<AlertCircle size={14} />` | Error severity |
| AlertTriangle | `<AlertTriangle size={14} />` | Warning severity |
| Info | `<Info size={14} />` | Info severity |

## Typography

### Font Families
- Sans: Default system font stack
- Mono: `font-mono` for code/variables

### Font Sizes
- Header: `text-sm font-semibold` (14px)
- Labels: `text-xs font-semibold` (12px)
- Inputs: `text-sm` (14px)
- Badges: `text-[10px]` (10px)
- Help text: `text-xs` (12px)

### Font Weights
- Normal: 400
- Medium: 500
- Semibold: 600
- Bold: 700

## Spacing

### Padding
- Cards: `p-3` (12px)
- Expanded content: `p-4` (16px)
- Buttons: `px-3 py-1.5` (12px x 6px)
- Inputs: `px-3 py-2` (12px x 8px)

### Margins
- Between sections: `space-y-3` (12px)
- Between elements: `space-x-2` (8px)
- Top margin: `mt-4` (16px)

### Gaps
- Flex gaps: `gap-2` (8px)
- Grid gaps: `gap-4` (16px)

## Border Radius

- Cards: `rounded-xl` (12px)
- Inputs: `rounded-lg` (8px)
- Buttons: `rounded` (4px)
- Badges: `rounded-full` (9999px)

## Shadows

- Default: `shadow-sm` (subtle)
- Hover: `shadow-md` (medium)
- Dropdown: `shadow-lg` (large)

---

This visual guide ensures consistent design across the assertion editor components.
