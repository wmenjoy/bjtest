/**
 * Type definitions for Test Platform
 * Aligned with backend Go structures
 */

/**
 * DataMapper defines data mapping configuration for visual workflow builder
 * Supports JSONPath extraction from source step outputs with optional transformations
 */
export interface DataMapper {
  id: string;                    // Unique mapper ID
  sourceStep: string;            // Source step ID (e.g., "step-login")
  sourcePath: string;            // JSONPath to extract (e.g., "output.response.body.token")
  targetParam: string;           // Target parameter name (e.g., "authToken")
  transform?: string;            // Optional transformation: "uppercase" | "lowercase" | "trim" | "parseInt" | "parseFloat"
}

/**
 * WorkflowStep represents a workflow step definition
 */
export interface WorkflowStep {
  id: string;
  name: string;
  type: string;                  // http, command, test-case, loop, condition
  config: Record<string, any>;
  input?: Record<string, any>;
  output?: Record<string, string>;
  dependsOn?: string[];

  // Action Template Support
  actionTemplateId?: string;     // Reference to Action Template
  actionVersion?: string;        // Optional version constraint
  inputs?: Record<string, string>; // Parameter values for template
  outputs?: Record<string, string>; // Output variable mappings
  dataMappers?: DataMapper[];    // Visual data mapping configurations

  // Conditional execution
  when?: string;                 // Condition expression

  // Loop execution
  loopOver?: string;             // Loop collection expression
  loopVar?: string;              // Loop variable name
  loopCondition?: string;        // While loop condition
  maxIterations?: number;        // Max loop iterations
  parallel?: boolean;            // Parallel execution
  maxConcurrency?: number;       // Max concurrency

  // Tree structure (for conditional branches)
  children?: string[];           // Child nodes (then branch)
  elseChildren?: string[];       // Else branch

  // Other config
  retry?: RetryConfig;
  onError?: string;              // abort, continue
}

/**
 * RetryConfig for retry logic
 */
export interface RetryConfig {
  maxAttempts: number;
  interval: number;              // milliseconds
}

/**
 * WorkflowDefinition represents complete workflow
 */
export interface WorkflowDefinition {
  name: string;
  version: string;
  variables: Record<string, any>;
  steps: Record<string, WorkflowStep>;
}

/**
 * Transform function definition
 */
export interface TransformFunction {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  category: 'Control' | 'Text' | 'Number' | 'Date' | 'Array' | 'Object';
  example?: string;
}

/**
 * Step execution result
 */
export interface StepExecutionResult {
  status: string;
  duration: number;
  output: Record<string, any>;
  error: string;
}
