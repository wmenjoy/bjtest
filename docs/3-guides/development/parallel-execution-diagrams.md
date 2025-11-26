# Parallel Execution Visual Diagrams

## 1. Execution Flow Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Workflow Definition                       │
│                    (WorkflowStep[])                         │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              ParallelExecutor.validateDAG()                 │
│              Cycle Detection (DFS)                          │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│         ParallelExecutor.buildExecutionLayers()             │
│         Topological Sort (Kahn's Algorithm)                 │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│               ExecutionLayer[]                              │
│   Layer 0: [Step A]                                         │
│   Layer 1: [Step B, Step C, Step D] ← Parallel             │
│   Layer 2: [Merge Step]                                     │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│          ParallelExecutor.executeDAG()                      │
│          Layer-by-layer Execution                           │
└──────────────────────┬──────────────────────────────────────┘
                       │
         ┌─────────────┴─────────────┐
         ▼                           ▼
┌──────────────────┐        ┌──────────────────┐
│   Execute        │        │   Promise.all()  │
│   Layer 0        │        │   Parallel       │
│   (Sequential)   │        │   Execution      │
└────────┬─────────┘        └────────┬─────────┘
         │                           │
         │    Update Context         │
         └───────────┬───────────────┘
                     │
                     ▼
         ┌─────────────────────────┐
         │   Update Context with   │
         │   - completedSteps      │
         │   - stepOutputs         │
         │   - variables           │
         └───────────┬─────────────┘
                     │
                     ▼
         ┌─────────────────────────┐
         │   Next Layer or Done    │
         └─────────────────────────┘
```

## 2. Example Workflow DAG

```
Workflow: User Dashboard Data Aggregation
═══════════════════════════════════════════

                    ┌──────────────┐
                    │ fetch-user   │  Layer 0
                    │ GET /users/1 │
                    └──────┬───────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ get-orders  │    │ get-profile │    │ get-prefs   │  Layer 1
│ GET /orders │    │ GET /albums │    │ GET /todos  │  (Parallel)
└──────┬──────┘    └──────┬──────┘    └──────┬──────┘
       │                  │                  │
       └──────────────────┼──────────────────┘
                          │
                          ▼
                  ┌───────────────┐
                  │ merge-results │  Layer 2
                  │ type: merge   │
                  └───────────────┘

Execution Timeline:
══════════════════
0ms    ┌─────────────┐
       │ fetch-user  │ 200ms
200ms  └─────────────┘
       ├─────────────┤ ├──────────────────┤ ├──────────┤
       │ get-orders  │ │   get-profile    │ │get-prefs │
       │    300ms    │ │      400ms       │ │  250ms   │
600ms  └─────────────┘ └──────────────────┘ └──────────┘
       ┌─────────────────────────────────────────────────┐
       │              merge-results                       │
       │                  10ms                           │
610ms  └─────────────────────────────────────────────────┘

Total Time: 610ms (vs 1160ms sequential = 47% faster!)
```

## 3. Complex Diamond DAG

```
                     ┌───┐
                     │ A │  Layer 0
                     └─┬─┘
                       │
              ┌────────┴────────┐
              │                 │
              ▼                 ▼
            ┌───┐             ┌───┐
            │ B │             │ C │  Layer 1 (Parallel)
            └─┬─┘             └─┬─┘
              │                 │
              ▼                 ├─────────┐
            ┌───┐               │         │
            │ D │               ▼         ▼
            └─┬─┘             ┌───┐     ┌───┐
              │               │ E │     │ F │  Layer 2 (Parallel)
              │               └─┬─┘     └─┬─┘
              │                 │         │
              └────────┬────────┘         │
                       │                  │
                       ▼                  ▼
                     ┌───┐             ┌───┐
                     │ G │             │ H │  Layer 3 (Parallel)
                     └─┬─┘             └─┬─┘
                       │                 │
                       └────────┬────────┘
                                │
                                ▼
                              ┌───┐
                              │ M │  Layer 4 (Merge)
                              └───┘

Dependencies:
A: []
B: [A]
C: [A]
D: [B]
E: [C]
F: [C]
G: [D, E]
H: [F]
M: [G, H]
```

## 4. Merge Strategies Visualization

### waitAll Strategy
```
Source Steps:        Merge Step:
┌─────────┐
│ Step 1  │─────┐
└─────────┘     │
                ├───► ┌────────┐
┌─────────┐     │     │ Merge  │ ← Waits for ALL
│ Step 2  │─────┤     │ waitAll│   sources to complete
└─────────┘     │     └────────┘
                │
┌─────────┐     │
│ Step 3  │─────┘
└─────────┘

Timeline:
Step 1: ████████████ (300ms)
Step 2: ██████████████████ (500ms) ← Slowest
Step 3: ████████ (200ms)
Merge:              ▓▓ (waits 500ms, then merges)
```

### waitAny Strategy
```
Source Steps:        Merge Step:
┌─────────┐
│ Step 1  │─────┐
└─────────┘     │
                ├───► ┌────────┐
┌─────────┐     │     │ Merge  │ ← Proceeds when FIRST
│ Step 2  │─────┤     │ waitAny│   source completes
└─────────┘     │     └────────┘
                │
┌─────────┐     │
│ Step 3  │─────┘
└─────────┘

Timeline:
Step 1: ████████████ (300ms)
Step 2: ██████████████████ (500ms)
Step 3: ████████ (200ms) ← Fastest
Merge:          ▓▓ (proceeds at 200ms)
```

### waitN Strategy (N=2)
```
Source Steps:        Merge Step:
┌─────────┐
│ Step 1  │─────┐
└─────────┘     │
                │
┌─────────┐     ├───► ┌────────┐
│ Step 2  │─────┤     │ Merge  │ ← Waits for ANY 2
└─────────┘     │     │ waitN  │   sources (N=2)
                │     │ N=2    │
┌─────────┐     │     └────────┘
│ Step 3  │─────┤
└─────────┘     │
                │
┌─────────┐     │
│ Step 4  │─────┘
└─────────┘

Timeline:
Step 1: ████████████ (300ms) ← 2nd fastest
Step 2: ██████████████████ (500ms)
Step 3: ████████ (200ms) ← Fastest
Step 4: ███████████████ (400ms)
Merge:            ▓▓ (proceeds when 2 complete)
                    └─ At 300ms (Step 3 + Step 1 done)
```

## 5. Merge Modes Visualization

### Object Mode
```
Input Steps:
┌────────────────┐
│ get-users      │
│ outputs: {     │
│   users: [...]  │
│ }              │
└────────────────┘

┌────────────────┐
│ get-orders     │
│ outputs: {     │
│   orders: [...] │
│ }              │
└────────────────┘

Merge Config:
{
  mode: 'object',
  mapping: {
    'dashboard.users': 'get-users.users',
    'dashboard.orders': 'get-orders.orders'
  }
}

Output:
{
  dashboard: {
    users: [...],
    orders: [...]
  }
}
```

### Array Mode
```
Input Steps:
┌────────────────┐
│ api-1          │
│ outputs: {data}│
└────────────────┘

┌────────────────┐
│ api-2          │
│ outputs: {data}│
└────────────────┘

Merge Config:
{
  mode: 'array'
}

Output:
[
  { stepId: 'api-1', data: {...} },
  { stepId: 'api-2', data: {...} }
]
```

## 6. StepCard UI Layout

```
┌──────────────────────────────────────────────────────────┐
│ [Drag] [Icon] 1. Fetch User Data                   [▼] │
│        HTTP   [depends on 0]                            │
│                                                          │
│        GET https://api.example.com/users/1              │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│ [Drag] [Icon] 2. Get Orders                         [▼] │
│        HTTP   [depends on 1] ← Dependency Badge         │
│                                                          │
│        GET https://api.example.com/orders?userId={{...}}│
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│ [Drag] [Merge] 3. Merge Results                     [▼] │
│        MERGE  [depends on 2]                            │
│                                                          │
│        Strategy: waitAll | Mode: object                 │
└──────────────────────────────────────────────────────────┘

Badge Colors:
┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐
│HTTP│ │CMD │ │BRNCH│ │GRP │ │MERG│ │PRLL│
└────┘ └────┘ └────┘ └────┘ └────┘ └────┘
Green  Orange Purple Gray   Indigo Pink
```

## 7. Execution Context Flow

```
Initial Context:
┌──────────────────────────────┐
│ variables: { userId: 1 }     │
│ completedSteps: Map()        │
│ stepOutputs: Map()           │
└──────────────────────────────┘

After Layer 0 (fetch-user):
┌──────────────────────────────┐
│ variables: {                 │
│   userId: 1,                 │
│   userName: "John"           │
│ }                            │
│ completedSteps: Map({        │
│   "fetch-user": {...}        │
│ })                           │
│ stepOutputs: Map({           │
│   "fetch-user": {            │
│     userId: 1,               │
│     userName: "John"         │
│   }                          │
│ })                           │
└──────────────────────────────┘

After Layer 1 (parallel):
┌──────────────────────────────┐
│ variables: {                 │
│   userId: 1,                 │
│   userName: "John",          │
│   orders: [...],             │
│   profile: {...}             │
│ }                            │
│ completedSteps: Map({        │
│   "fetch-user": {...},       │
│   "get-orders": {...},       │
│   "get-profile": {...}       │
│ })                           │
│ stepOutputs: Map({           │
│   "fetch-user": {...},       │
│   "get-orders": {orders: []},│
│   "get-profile": {profile: {}}│
│ })                           │
└──────────────────────────────┘

After Layer 2 (merge):
┌──────────────────────────────┐
│ variables: {                 │
│   userId: 1,                 │
│   userName: "John",          │
│   orders: [...],             │
│   profile: {...},            │
│   mergedData: {              │
│     orders: [...],           │
│     profile: {...}           │
│   }                          │
│ }                            │
│ completedSteps: Map({        │
│   "fetch-user": {...},       │
│   "get-orders": {...},       │
│   "get-profile": {...},      │
│   "merge-results": {...}     │
│ })                           │
│ stepOutputs: Map({           │
│   ...,                       │
│   "merge-results": {         │
│     mergedData: {...}        │
│   }                          │
│ })                           │
└──────────────────────────────┘
```

## 8. Topological Sort Algorithm Visualization

```
Input Graph:
A → B → D
↓       ↑
C → E ──┘
↓
F

Step 1: Calculate In-Degrees
┌─────┬──────────┐
│ Node│ In-Degree│
├─────┼──────────┤
│  A  │    0     │ ← Start here
│  B  │    1     │
│  C  │    1     │
│  D  │    2     │
│  E  │    1     │
│  F  │    1     │
└─────┴──────────┘

Step 2: Layer 0 (in-degree = 0)
Nodes: [A]
Execute: A
Update in-degrees:
  B: 1 → 0
  C: 1 → 0

Step 3: Layer 1 (in-degree = 0)
Nodes: [B, C]
Execute: B, C (parallel)
Update in-degrees:
  D: 2 → 1 (from B)
  E: 1 → 0 (from C)
  F: 1 → 0 (from C)

Step 4: Layer 2 (in-degree = 0)
Nodes: [E, F]
Execute: E, F (parallel)
Update in-degrees:
  D: 1 → 0 (from E)

Step 5: Layer 3 (in-degree = 0)
Nodes: [D]
Execute: D

Result: 4 Layers
Layer 0: [A]
Layer 1: [B, C] ← Parallel
Layer 2: [E, F] ← Parallel
Layer 3: [D]
```

## 9. Error Handling Flow

```
┌─────────────────────────────────────────┐
│         Execute Layer N                 │
└──────────────┬──────────────────────────┘
               │
               ▼
    ┌──────────────────────────┐
    │   Promise.all([          │
    │     executeStep(step1),  │
    │     executeStep(step2),  │
    │     executeStep(step3)   │
    │   ])                     │
    └──────────┬───────────────┘
               │
    ┌──────────┴─────────────┐
    │                        │
    ▼                        ▼
┌─────────┐            ┌──────────┐
│ Success │            │  Failure │
└────┬────┘            └─────┬────┘
     │                       │
     │                       ▼
     │              ┌────────────────┐
     │              │ Catch & Convert│
     │              │ to StepExecution│
     │              │ with status:    │
     │              │   'failed'      │
     │              └────────┬────────┘
     │                       │
     └───────────┬───────────┘
                 │
                 ▼
    ┌────────────────────────┐
    │  Update Context        │
    │  Continue to Next Layer│
    └────────────────────────┘

Note: Current behavior continues on error
Future: Add abort/retry strategies
```

## 10. Performance Comparison

```
Sequential Execution:
═══════════════════════
Time →
0    200  500  750  1150
│───│───│───│───│
A    B    C    D
└────┴────┴────┴──── Total: 1150ms

Parallel Execution:
═══════════════════════
Time →
0    200  500
│───│───│
A   │ B │
    │ C │ ← Parallel
    │ D │
    └───┘
Total: 500ms

Speedup: 57% faster!
```

---

These diagrams provide visual representations of:
1. Overall architecture
2. Example workflows
3. Merge strategies
4. UI components
5. Context propagation
6. Algorithm visualization
7. Error handling
8. Performance comparisons
