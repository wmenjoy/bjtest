# Workflow Bridge - Quick Reference

## Import Statements

```typescript
// Core services
import {
  WorkflowBridge,
  ExecutionStateManager,
  UnifiedExecutionState,
  isTestCase,
  isWorkflow,
  getSourceDisplayName
} from './services/workflowBridge';

// UI Component
import { UnifiedWorkflowView } from './components/workflow/UnifiedWorkflowView';

// Types
import { TestCase, Workflow, Environment, ExecutionStatus } from './types';
```

## Common Operations

### Convert TestCase to Workflow

```typescript
const workflow = WorkflowBridge.testCaseToWorkflow(testCase);
```

### Convert Workflow to TestCase

```typescript
const testCase = WorkflowBridge.workflowToTestCase(workflow, folderId);
```

### Create Execution State

```typescript
const execution = ExecutionStateManager.createExecutionState(
  source,        // TestCase or Workflow
  environment    // Optional
);
```

### Update Execution State

```typescript
execution.status = ExecutionStatus.RUNNING;
execution.logs.push('Step completed');
ExecutionStateManager.updateExecutionState(execution.id, execution);
```

### Add to History

```typescript
ExecutionStateManager.addExecutionToHistory(execution);
```

### Get Execution History

```typescript
const history = ExecutionStateManager.getExecutionHistory(sourceId);
const testCaseHistory = ExecutionStateManager.getExecutionHistory(sourceId, 'test-case');
```

### Get Statistics

```typescript
const stats = ExecutionStateManager.getExecutionStats(sourceId);
// Returns: { totalRuns, successRate, avgDuration, lastRunAt, lastStatus }
```

### Check Source Type

```typescript
if (isTestCase(source)) {
  console.log('Test case:', source.title);
}

if (isWorkflow(source)) {
  console.log('Workflow:', source.name);
}
```

## Component Usage

```typescript
<UnifiedWorkflowView
  testCases={testCases}
  workflows={workflows}
  activeEnvironment={activeEnvironment}
  selectedSource={selectedSource}
  onSourceSelect={setSelectedSource}
  onExecute={(source, env) => {
    // Handle execution
  }}
/>
```

## Complete Execution Flow

```typescript
// 1. Create execution state
const execution = ExecutionStateManager.createExecutionState(
  testCase,
  activeEnvironment
);

// 2. Mark as running
execution.status = ExecutionStatus.RUNNING;
execution.logs = ['Starting execution...'];

// 3. Execute steps
for (const step of testCase.steps) {
  const stepExec = {
    stepId: step.id,
    stepName: step.name,
    status: 'running' as const,
    startTime: new Date().toISOString(),
    inputs: {},
    outputs: {}
  };

  execution.steps.push(stepExec);

  // Execute step logic...

  stepExec.status = 'passed';
  stepExec.endTime = new Date().toISOString();
  stepExec.duration = 1000;
}

// 4. Mark as completed
execution.status = ExecutionStatus.PASSED;
execution.completedAt = new Date().toISOString();
execution.duration = execution.steps.reduce((sum, s) => sum + (s.duration || 0), 0);

// 5. Add to history
ExecutionStateManager.addExecutionToHistory(execution);

// 6. Get updated statistics
const stats = ExecutionStateManager.getExecutionStats(testCase.id);
console.log(`Success rate: ${stats.successRate}%`);
```

## Type Mappings

| TestCase Field | Workflow Field | Notes |
|----------------|----------------|-------|
| `id` | `id` | Prefixed with `wf-from-tc-` |
| `title` | `name` | Direct mapping |
| `description` | `description` | Direct mapping |
| `steps[]` | `nodes[]` | Converted via stepToNode() |
| `variables{}` | `inputSchema[]` | Converted to parameter array |
| `folderId` | N/A | TestCase specific |
| N/A | `projectId` | Both have projectId |

## Execution Status Values

```typescript
enum ExecutionStatus {
  PENDING = 'Pending',
  RUNNING = 'Running',
  PASSED = 'Passed',
  FAILED = 'Failed',
  BLOCKED = 'Blocked',
  SKIPPED = 'Skipped'
}
```

## Helper Functions

```typescript
// Get display name (works for both types)
const name = getSourceDisplayName(source);

// Get project ID (works for both types)
const projectId = getSourceProjectId(source);

// Type guards
const isTc = isTestCase(source);
const isWf = isWorkflow(source);
```

## Error Handling

```typescript
try {
  const execution = ExecutionStateManager.createExecutionState(source, env);
  // ... execution logic ...
  execution.status = ExecutionStatus.PASSED;
} catch (error) {
  execution.status = ExecutionStatus.FAILED;
  execution.error = error instanceof Error ? error.message : 'Unknown error';
} finally {
  execution.completedAt = new Date().toISOString();
  execution.duration = Date.now() - new Date(execution.startedAt).getTime();
  ExecutionStateManager.addExecutionToHistory(execution);
}
```

## Best Practices

1. ✅ Always use `ExecutionStateManager` for tracking execution
2. ✅ Call `addExecutionToHistory` after execution completes
3. ✅ Use type guards (`isTestCase`, `isWorkflow`) for type safety
4. ✅ Provide environment when creating execution state
5. ✅ Set `execution.error` if execution fails
6. ✅ Update logs during execution for better debugging
7. ✅ Calculate duration based on actual execution time

## Common Patterns

### Pattern 1: Convert and Execute

```typescript
const workflow = WorkflowBridge.testCaseToWorkflow(testCase);
const execution = ExecutionStateManager.createExecutionState(workflow, env);
// Execute workflow...
ExecutionStateManager.addExecutionToHistory(execution);
```

### Pattern 2: Track Multiple Sources

```typescript
const sources = [...testCases, ...workflows];
sources.forEach(source => {
  const stats = ExecutionStateManager.getExecutionStats(source.id);
  console.log(`${getSourceDisplayName(source)}: ${stats.successRate}%`);
});
```

### Pattern 3: Filter History by Type

```typescript
const allHistory = ExecutionStateManager.getAllExecutions();
const testCaseRuns = allHistory.filter(exec => exec.type === 'test-case');
const workflowRuns = allHistory.filter(exec => exec.type === 'workflow');
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| History not persisting | Use localStorage (see docs) |
| Type conversion loses fields | Extend conversion methods |
| Stats incorrect | Ensure `addExecutionToHistory` called after completion |
| Memory usage high | Clear old history with `clearHistory(sourceId)` |

## File Locations

```
services/workflowBridge.ts                    - Core service
components/workflow/UnifiedWorkflowView.tsx   - UI component
examples/WorkflowBridgeExample.tsx            - Examples
docs/WORKFLOW_BRIDGE.md                       - Full documentation
docs/WORKFLOW_BRIDGE_IMPLEMENTATION.md        - Implementation report
```

## Version

- **Created**: 2025-11-27
- **Version**: 1.0.0
- **Status**: Production Ready
- **Build**: ✅ Passing
