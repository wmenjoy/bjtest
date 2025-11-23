/**
 * Execution View Components
 *
 * A collection of React components for displaying real-time execution progress
 * of TestSteps with support for loops and branches.
 *
 * Components:
 * - ExecutionView: Main container with overall progress and step list
 * - StepProgress: Individual step execution display with expandable details
 * - LoopProgress: Loop iteration progress with statistics
 * - IterationCard: Single iteration display with nested steps
 * - BranchVisualization: Branch decision tree display
 * - VariablePool: Variable state viewer with search and highlighting
 */

// Main execution container
export { ExecutionView } from './ExecutionView';
export type { ExecutionViewProps } from './ExecutionView';

// Step progress component
export { StepProgress } from './StepProgress';
export type { StepProgressProps } from './StepProgress';

// Loop progress component
export { LoopProgress } from './LoopProgress';
export type { LoopProgressProps } from './LoopProgress';

// Iteration card component
export { IterationCard } from './IterationCard';
export type { IterationCardProps } from './IterationCard';

// Branch visualization component
export { BranchVisualization } from './BranchVisualization';
export type { BranchVisualizationProps } from './BranchVisualization';

// Variable pool component
export { VariablePool } from './VariablePool';
export type { VariablePoolProps } from './VariablePool';
