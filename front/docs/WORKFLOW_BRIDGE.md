# Workflow Bridge Layer

## Overview

The **Workflow Bridge Layer** is a unified synchronization layer that bridges the gap between the TestCase and Workflow modules. It provides bidirectional conversion, unified execution state management, and a consistent interface for working with both test cases and workflows.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   Application Layer                         │
│  (TestCaseManager, ScriptLab, UnifiedWorkflowView)         │
└────────────────┬────────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────────┐
│              Workflow Bridge Layer                          │
│  ┌──────────────────────┐  ┌──────────────────────────────┐ │
│  │  WorkflowBridge      │  │  ExecutionStateManager       │ │
│  │  - testCaseToWorkflow│  │  - createExecutionState      │ │
│  │  - workflowToTestCase│  │  - getExecutionHistory       │ │
│  └──────────────────────┘  │  - getExecutionStats         │ │
│                             └──────────────────────────────┘ │
└────────────────┬────────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────────┐
│                   Data Layer                                │
│          TestCase Types  ◄──►  Workflow Types               │
└─────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. WorkflowBridge Class

Handles bidirectional conversion between TestCase and Workflow structures.

#### Methods

- **`testCaseToWorkflow(testCase: TestCase): Workflow`**
  - Converts a TestCase to Workflow format
  - Maps steps to nodes
  - Converts variables to input schema
  - Preserves execution metadata

- **`workflowToTestCase(workflow: Workflow, folderId: string): TestCase`**
  - Converts a Workflow to TestCase format
  - Maps nodes to steps
  - Converts input schema to variables
  - Sets default priority and status

#### Example Usage

```typescript
import { WorkflowBridge } from './services/workflowBridge';

// TestCase → Workflow conversion
const workflow = WorkflowBridge.testCaseToWorkflow(testCase);
console.log('Converted to workflow:', workflow);

// Workflow → TestCase conversion
const testCase = WorkflowBridge.workflowToTestCase(workflow, 'folder-123');
console.log('Converted to test case:', testCase);
```

### 2. ExecutionStateManager Class

Manages unified execution state across both TestCase and Workflow modules.

#### Methods

- **`createExecutionState(source, environment?): UnifiedExecutionState`**
  - Creates a new execution state for any source type
  - Automatically detects whether source is TestCase or Workflow
  - Initializes with PENDING status

- **`addExecutionToHistory(execution): void`**
  - Stores execution in history (max 50 per source)
  - Associates with source ID

- **`updateExecutionState(executionId, updates): void`**
  - Updates existing execution state
  - Merges updates with current state

- **`getExecutionHistory(sourceId, type?): UnifiedExecutionState[]`**
  - Retrieves execution history for a source
  - Optional filtering by type ('test-case' or 'workflow')

- **`getExecutionStats(sourceId): Stats`**
  - Calculates statistics:
    - Total runs
    - Success rate
    - Average duration
    - Last run timestamp

- **`getLatestExecution(sourceId): UnifiedExecutionState | null`**
  - Returns most recent execution for a source

- **`getAllExecutions(limit?): UnifiedExecutionState[]`**
  - Returns all executions across all sources
  - Sorted by start time (descending)

#### Example Usage

```typescript
import { ExecutionStateManager } from './services/workflowBridge';

// Create execution state
const execution = ExecutionStateManager.createExecutionState(
  testCase,
  activeEnvironment
);

// Update during execution
execution.status = ExecutionStatus.RUNNING;
execution.logs.push('Step 1 completed');
ExecutionStateManager.updateExecutionState(execution.id, execution);

// Mark as completed
execution.status = ExecutionStatus.PASSED;
execution.completedAt = new Date().toISOString();
execution.duration = 2500; // ms
ExecutionStateManager.addExecutionToHistory(execution);

// Get history
const history = ExecutionStateManager.getExecutionHistory(testCase.id);

// Get statistics
const stats = ExecutionStateManager.getExecutionStats(testCase.id);
console.log(`Success rate: ${stats.successRate}%`);
```

### 3. UnifiedExecutionState Interface

Common execution state structure for both TestCase and Workflow.

```typescript
interface UnifiedExecutionState {
  id: string;                    // Unique execution ID
  type: 'test-case' | 'workflow'; // Source type
  sourceId: string;               // Original source ID
  sourceName: string;             // Display name
  status: ExecutionStatus;        // PENDING, RUNNING, PASSED, FAILED, etc.
  startedAt: string;              // ISO timestamp
  completedAt?: string;           // ISO timestamp
  duration?: number;              // Milliseconds
  steps: StepExecution[];         // Step-level details
  logs: string[];                 // Execution logs
  environment?: string;           // Environment name
  error?: string;                 // Error message if failed
  metadata?: {
    triggeredBy?: string;
    runCount?: number;
    retryCount?: number;
    variables?: Record<string, any>;
  };
}
```

### 4. UnifiedWorkflowView Component

React component providing a unified interface for viewing and executing both test cases and workflows.

#### Props

```typescript
interface UnifiedWorkflowViewProps {
  testCases?: TestCase[];
  workflows?: Workflow[];
  activeEnvironment?: Environment;
  selectedSource?: TestCase | Workflow;
  onSourceSelect?: (source: TestCase | Workflow) => void;
  onExecute?: (source: TestCase | Workflow, environment?: Environment) => void;
}
```

#### Features

- **View Mode Toggle**: Switch between 'all', 'test-cases', or 'workflows'
- **Source List**: Browse all available sources with type indicators
- **Execution Statistics**: Display total runs, success rate, avg duration
- **Execution History**: View detailed history with expandable logs
- **Execute Button**: Trigger execution with current environment

#### Example Usage

```typescript
import { UnifiedWorkflowView } from './components/workflow/UnifiedWorkflowView';

function MyComponent() {
  const [selectedSource, setSelectedSource] = useState<TestCase | Workflow>();

  const handleExecute = (source, environment) => {
    const execution = ExecutionStateManager.createExecutionState(
      source,
      environment
    );
    // Execute logic here...
    ExecutionStateManager.addExecutionToHistory(execution);
  };

  return (
    <UnifiedWorkflowView
      testCases={testCases}
      workflows={workflows}
      activeEnvironment={activeEnvironment}
      selectedSource={selectedSource}
      onSourceSelect={setSelectedSource}
      onExecute={handleExecute}
    />
  );
}
```

## Integration Guide

### Step 1: Install and Import

```typescript
// Import bridge services
import {
  WorkflowBridge,
  ExecutionStateManager,
  UnifiedExecutionState,
  isTestCase,
  isWorkflow
} from './services/workflowBridge';

// Import UI component
import { UnifiedWorkflowView } from './components/workflow/UnifiedWorkflowView';
```

### Step 2: Integrate with TestRunner

Update your TestRunner to track execution state:

```typescript
// In TestRunner.tsx
import { ExecutionStateManager, ExecutionStatus } from '../services/workflowBridge';

// After execution completes
const trackExecution = (testCase: TestCase, result: TestRun) => {
  const execution = ExecutionStateManager.createExecutionState(
    testCase,
    activeEnvironment
  );

  execution.status = result.status === 'Passed'
    ? ExecutionStatus.PASSED
    : ExecutionStatus.FAILED;
  execution.completedAt = new Date().toISOString();
  execution.duration = result.duration;
  execution.steps = result.stepExecutions || [];
  execution.logs = result.logs || [];
  execution.error = result.error;

  ExecutionStateManager.addExecutionToHistory(execution);
};
```

### Step 3: Integrate with WorkflowRunner

Update your WorkflowRunner to track workflow execution:

```typescript
// In WorkflowRunner.tsx
import { ExecutionStateManager, ExecutionStatus } from '../services/workflowBridge';

const trackWorkflowExecution = (workflow: Workflow, runResult: any) => {
  const execution = ExecutionStateManager.createExecutionState(
    workflow,
    activeEnvironment
  );

  execution.status = runResult.success
    ? ExecutionStatus.PASSED
    : ExecutionStatus.FAILED;
  execution.completedAt = new Date().toISOString();
  execution.duration = runResult.duration;
  execution.steps = runResult.steps || [];
  execution.logs = runResult.logs || [];

  ExecutionStateManager.addExecutionToHistory(execution);
};
```

### Step 4: Add Unified View to Your App

```typescript
// In App.tsx or routing component
import { UnifiedWorkflowView } from './components/workflow/UnifiedWorkflowView';

function App() {
  const [view, setView] = useState<'cases' | 'unified'>('unified');

  return (
    <div>
      {view === 'unified' ? (
        <UnifiedWorkflowView
          testCases={testCases}
          workflows={workflows}
          activeEnvironment={activeEnvironment}
          onExecute={handleExecute}
        />
      ) : (
        <TestCaseManager />
      )}
    </div>
  );
}
```

## Helper Functions

### Type Guards

```typescript
import { isTestCase, isWorkflow } from './services/workflowBridge';

// Check if source is a TestCase
if (isTestCase(source)) {
  console.log('This is a test case:', source.title);
}

// Check if source is a Workflow
if (isWorkflow(source)) {
  console.log('This is a workflow:', source.name);
}
```

### Display Helpers

```typescript
import { getSourceDisplayName, getSourceProjectId } from './services/workflowBridge';

const displayName = getSourceDisplayName(source); // Works for both types
const projectId = getSourceProjectId(source);     // Works for both types
```

## Data Flow

### Conversion Flow

```
TestCase                        Workflow
┌─────────────┐                ┌─────────────┐
│ id          │───────────────►│ id          │
│ title       │───────────────►│ name        │
│ description │───────────────►│ description │
│ steps[]     │───────────────►│ nodes[]     │
│ variables{} │───────────────►│ inputSchema │
│ lastRunAt   │───────────────►│ lastRunAt   │
└─────────────┘                └─────────────┘
       ▲                              │
       │                              │
       └──────────────────────────────┘
           workflowToTestCase()
```

### Execution State Flow

```
1. Create Execution State
   ↓
2. Update Status to RUNNING
   ↓
3. Execute Steps (track progress)
   ↓
4. Update Status to PASSED/FAILED
   ↓
5. Add to History
   ↓
6. Calculate Statistics
```

## Type Mappings

### Step Type ↔ Node Type

| Step Type  | Node Type       | Description          |
|------------|-----------------|----------------------|
| http       | HTTP_REQUEST    | HTTP API call        |
| command    | SHELL_CMD       | Shell command        |
| assertion  | CONDITION       | Validation check     |
| loop       | LOOP            | Iteration control    |
| branch     | BRANCH          | Conditional flow     |
| merge      | MERGE           | Flow merge point     |
| group      | STEP            | Grouped steps        |

### Priority Mapping

TestCase Priority → Workflow (uses default MEDIUM if no priority)

### Status Mapping

TestCase Status → Workflow (ACTIVE maps to available for execution)

## Performance Considerations

1. **History Limit**: Execution history is limited to 50 entries per source to prevent memory issues
2. **In-Memory Storage**: Current implementation uses in-memory Map for execution history
3. **Future Enhancement**: Consider persisting to localStorage or backend API for long-term storage

## Troubleshooting

### Common Issues

**Issue**: Execution history not persisting after page reload
**Solution**: History is in-memory. Implement localStorage persistence:

```typescript
// Add to ExecutionStateManager
static persistToStorage() {
  localStorage.setItem('executionHistory', JSON.stringify(
    Array.from(this.executionHistory.entries())
  ));
}

static loadFromStorage() {
  const data = localStorage.getItem('executionHistory');
  if (data) {
    this.executionHistory = new Map(JSON.parse(data));
  }
}
```

**Issue**: Type conversion loses custom fields
**Solution**: Extend the conversion methods in WorkflowBridge to handle custom fields:

```typescript
static testCaseToWorkflow(testCase: TestCase): Workflow {
  const workflow = {
    // ... standard conversion
    customField: testCase.customField // Add custom mappings
  };
  return workflow;
}
```

## Best Practices

1. **Always use ExecutionStateManager** for tracking execution instead of custom state management
2. **Call addExecutionToHistory** only after execution completes to maintain accurate statistics
3. **Use type guards** (isTestCase, isWorkflow) for type-safe operations
4. **Provide environment context** when creating execution state for better tracking
5. **Handle errors gracefully** by setting execution.error field before adding to history

## Future Enhancements

- [ ] Backend API integration for persistent storage
- [ ] Real-time execution updates via WebSocket
- [ ] Export execution history to CSV/JSON
- [ ] Advanced filtering and search in UnifiedWorkflowView
- [ ] Execution comparison and diff view
- [ ] Scheduled execution support
- [ ] Retry failed executions from history

## Files Created

- `/front/services/workflowBridge.ts` - Core bridge service
- `/front/components/workflow/UnifiedWorkflowView.tsx` - Unified UI component
- `/front/examples/WorkflowBridgeExample.tsx` - Usage examples and integration guide

## Summary

The Workflow Bridge Layer provides a clean, type-safe abstraction for working with both TestCase and Workflow modules. It eliminates duplication, provides unified execution tracking, and offers a consistent user experience across different workflow types.

**Key Benefits**:
- ✅ Bidirectional conversion between TestCase and Workflow
- ✅ Unified execution state management
- ✅ Consistent UI for both types
- ✅ Type-safe operations with TypeScript
- ✅ Built-in statistics and history tracking
- ✅ Easy integration with existing components
