# Data Flow Editor - Quick Start Guide

## What is the Data Flow Editor?

A visual editor that lets you **connect workflow steps** by dragging lines from outputs to inputs, automatically creating variable bindings.

---

## How to Access

1. Open any test case or workflow
2. Look for the **view toggle** buttons at the top
3. Click **"Data Flow"** button (icon: Network)

---

## Understanding the Interface

### Step Nodes
- **Left side (Purple circles)** = Inputs (what the step needs)
- **Right side (Cyan circles)** = Outputs (what the step produces)
- **Color-coded** by type (Blue=HTTP, Amber=Command, etc.)

### Connection Lines
- **Blue animated lines** show data flow from one step to another
- Each line represents a variable binding

---

## Basic Operations

### Create a Connection (Variable Binding)

1. **Find the source:** Look for the output you want to use (right side, cyan circle)
2. **Drag to target:** Click and drag from output to input (left side, purple circle)
3. **Release:** Connection is created automatically
4. **Result:** Variable binding like `{{step1.authToken}}` is generated

**Example:**
```
Step 1: Login  →  outputs: authToken, userId
Step 2: Get User  →  inputs: authToken (needs token from Step 1)

Action: Drag from Step1.authToken to Step2.authToken
Result: Step 2 input now references {{step1.authToken}}
```

### Delete a Connection

1. **Click the connection line** to select it
2. **Press Delete key** or **Backspace**
3. Connection and binding are removed

### Navigate the Canvas

- **Zoom In/Out:** Mouse wheel or zoom buttons (top right)
- **Pan:** Click and drag the background
- **Minimap:** Use the small map (bottom right) to jump to different areas
- **Reset View:** Click the "fit view" button

---

## Tips and Tricks

### Hover for Details
- **Hover over circles** to see parameter/variable names
- **Hover over nodes** to see step details
- **Hover over connections** to see binding details

### Selection
- **Click a node** to select it (highlights with blue ring)
- **Click canvas** to deselect

### Read-Only Mode
- If you only see connections but can't create new ones, the editor is in read-only mode
- Check if you have edit permissions

---

## Common Workflows

### 1. Login → API Call Pattern
```
Step 1: POST /login
  Outputs: authToken

Step 2: GET /api/users
  Inputs: Authorization header

Connect: Step1.authToken → Step2.Authorization
```

### 2. Multi-Step Data Pipeline
```
Step 1: Fetch Data
  Outputs: userId, email

Step 2: Get Profile
  Inputs: userId

Step 3: Update Profile
  Inputs: userId, email

Connect: Step1.userId → Step2.userId
Connect: Step1.userId → Step3.userId
Connect: Step1.email → Step3.email
```

### 3. Conditional Branching
```
Step 1: Check Status
  Outputs: isActive

Step 2: Process if Active
  Inputs: isActive
  Condition: {{isActive}} == true

Connect: Step1.isActive → Step2.isActive
```

---

## Color Guide

| Color | Meaning |
|-------|---------|
| 🟣 Purple circles | Input parameters |
| 🩵 Cyan circles | Output variables |
| 🔵 Blue nodes | HTTP requests |
| 🟠 Amber nodes | Commands |
| 🟣 Purple nodes | Branches |
| 🟠 Orange nodes | Loops |
| 🟢 Green nodes | Assertions |

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| Delete / Backspace | Delete selected connection |
| Mouse Wheel | Zoom in/out |
| Space + Drag | Pan canvas |
| Escape | Deselect |

---

## Troubleshooting

### "I can't create connections"
- ✅ Check if you're in edit mode (not read-only)
- ✅ Verify you have the right permissions
- ✅ Make sure you're dragging from output (right) to input (left)

### "I don't see any circles on the nodes"
- ✅ Steps need to have inputs/outputs defined
- ✅ Try toggling to List View to check step configuration

### "Connections look messy"
- ✅ Use zoom out to see the big picture
- ✅ Try List View for sequential view
- ✅ Delete unnecessary connections

### "Where did my changes go?"
- ✅ Make sure to save the workflow/test case
- ✅ Check if auto-save is enabled

---

## Best Practices

### ✅ DO
- Name your steps clearly
- Keep workflows simple (< 20 steps)
- Use List View for overview, Data Flow for editing
- Document complex data flows
- Test connections by running the workflow

### ❌ DON'T
- Create circular dependencies (A→B→A)
- Connect incompatible data types
- Make spaghetti connections (too many crossing lines)
- Forget to save your changes

---

## Getting Help

### Need More Info?
- Check the full documentation: `DATA_FLOW_EDITOR_README.md`
- View examples: Open sample workflows
- Ask your team: Share screenshots for help

### Report Issues
- Describe what you were trying to do
- Include screenshot of the graph
- Note any error messages
- Share your browser console (F12)

---

## Quick Reference

### Variable Binding Syntax
```
{{stepId.fieldName}}
{{stepId.response.body.token}}
{{stepId.status}}
```

### Connection Rules
- ✅ Output → Input (right to left)
- ✅ Earlier step → Later step
- ❌ Step → Itself (self-loop)
- ❌ Later step → Earlier step (backward)

---

**Happy Flow Editing! 🎉**

For advanced features and technical details, see the complete documentation.

---
**Version:** 1.0.0
**Last Updated:** 2025-11-26
