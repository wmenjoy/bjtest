/**
 * Data Flow Visualization Components
 *
 * This module provides components for visualizing data flow between test steps,
 * showing how variables are passed from one step to another.
 *
 * @module testcase/dataflow
 */

// Main diagram component (static visualization)
export { DataFlowDiagram } from './DataFlowDiagram';
export type { DataFlowDiagramProps } from './DataFlowDiagram';

// Interactive React Flow editor (NEW)
export { DataFlowEditor } from './DataFlowEditor';
export { ReactFlowStepNode } from './ReactFlowStepNode';

// Step node component (for static diagram)
export { StepNode } from './StepNode';
export type { StepNodeProps, ExecutionStatusType } from './StepNode';

// Connection line component
export { ConnectionLine, ConnectionsLayer } from './ConnectionLine';
export type { ConnectionLineProps, ConnectionsLayerProps } from './ConnectionLine';

// Variable tracker component
export { VariableTracker } from './VariableTracker';
export type { VariableTrackerProps } from './VariableTracker';

// Loop data flow component
export { LoopDataFlow } from './LoopDataFlow';
export type { LoopDataFlowProps } from './LoopDataFlow';

// Utilities
export * from './utils';
