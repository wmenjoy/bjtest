# Workflow View Quick Start Guide

## What is Workflow View?

Workflow View is a visual representation of your test case steps displayed as a directed graph (DAG). Instead of looking at steps in a table, you can see them as connected nodes in a flowchart.

## How to Use

### 1. Open a Test Case
- Navigate to any test case in the Test Case Manager
- The test case details will appear on the right side

### 2. Switch to Workflow View
- Look for the view mode switcher at the top of the steps section
- Click the **[Workflow]** button (with workflow icon)
- The steps will transform from a list into a visual diagram

### 3. Understanding the Diagram

```
        [Start]
           ↓
    ┌──────────────┐
    │   Step 1     │  ← Step node
    │   Login      │
    └──────────────┘
           ↓         ← Connector arrow
    ┌──────────────┐
    │   Step 2     │
    │   Get Data   │
    └──────────────┘
           ↓
        [End]
```

### 4. Interacting with Steps

**Click a Step Node**:
- A detail panel appears on the right
- Shows full step information:
  - Name and description
  - Instructions
  - Expected results
  - All parameters and their values

**Close Detail Panel**:
- Click the ✕ button in the panel
- Or click on another step to see its details

### 5. Switch Back to List View
- Click the **[List]** button
- Returns to the traditional tabular view

## Understanding Step Nodes

### Node Components

Each step node shows:

```
┌────────────────────────────┐
│ [#] [Icon] Name    [Type]  │ ← Header
│ Brief description          │ ← Description
│ [If: condition]            │ ← Conditional indicator
│ [Loop: variable]           │ ← Loop indicator
│ Inputs: 3 | Outputs: 2     │ ← Data summary
└────────────────────────────┘
```

### Color Coding

- **Blue** = HTTP Request step
- **Amber** = Command/Shell step
- **Indigo** = Workflow step
- **Purple** = Branch/Conditional step
- **Orange** = Loop step
- **Gray** = Manual step

### Icons

- 🌐 Globe = HTTP request
- 💻 Terminal = Command execution
- 🔄 Workflow = Sub-workflow
- 🔀 GitBranch = Conditional branch
- 🔁 Repeat = Loop/iteration
- 🤖 Bot = Manual step

## Example Use Cases

### 1. Understanding Test Flow
**Problem**: Test has 15 steps, hard to see the flow
**Solution**: Switch to Workflow View to see the entire sequence at a glance

### 2. Finding Step Dependencies
**Problem**: Need to know which step produces the data for step 5
**Solution**: Look at the workflow diagram - the arrows show the flow

### 3. Presenting Test Cases
**Problem**: Need to explain test case to stakeholders
**Solution**: Use Workflow View for a clear visual presentation

### 4. Debugging Test Execution
**Problem**: Test failed but not sure at which step
**Solution**: (Future) Workflow View will show execution status on each node

## Tips and Tricks

### For Large Workflows
- The workflow area is scrollable
- Use mouse wheel or trackpad to scroll
- Consider breaking very large tests into smaller sub-workflows

### For Complex Logic
- Loop steps show iteration variable
- Branch steps show condition
- Use these indicators to understand flow control

### For Documentation
- Take screenshots of workflow view for documentation
- Use it in presentations and design reviews
- Easier for non-technical stakeholders to understand

## Keyboard Shortcuts

Currently:
- No keyboard shortcuts yet

Future:
- `L` = Switch to List view
- `W` = Switch to Workflow view
- `Escape` = Close detail panel
- `Arrow keys` = Navigate between steps

## Common Questions

**Q: Can I edit steps in Workflow View?**
A: Not yet. Currently it's view-only. Click "Edit" button to modify steps.

**Q: Why doesn't my workflow show execution status?**
A: Execution visualization is planned for future release. Currently shows structure only.

**Q: Can I rearrange steps by dragging?**
A: Not yet. Use the edit mode to reorder steps.

**Q: Does it work with nested steps (loops, branches)?**
A: Yes! The diagram shows loop/branch indicators. Full nested visualization coming soon.

**Q: Can I export the diagram?**
A: Not yet, but planned for future release (PNG, SVG export).

## Limitations

Current version:
- View-only (cannot edit in workflow view)
- Simple vertical layout (no complex branching visualization)
- No execution state display yet
- No zoom/pan controls

Coming soon:
- Real-time execution state
- Interactive editing
- Advanced layouts
- Export capabilities

## Feedback

Have suggestions for improving Workflow View? Contact the development team!

---

**Quick Reference Card**

| Action | How To |
|--------|--------|
| Open Workflow View | Click [Workflow] button |
| Return to List | Click [List] button |
| View Step Details | Click on step node |
| Close Detail Panel | Click ✕ or click another step |
| Scroll Large Workflow | Mouse wheel or trackpad |

**Node Colors**

| Color | Meaning |
|-------|---------|
| Blue | HTTP Request |
| Amber | Command/Shell |
| Indigo | Sub-workflow |
| Purple | Conditional Branch |
| Orange | Loop |
| Gray | Manual Step |
