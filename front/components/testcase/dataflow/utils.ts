import { WorkflowStep, TestStep } from '../../../types';
import { Node, Edge } from '@xyflow/react';

/**
 * Extract input parameter names from a workflow step
 * Parses step.inputs and step.config for {{varName}} patterns
 */
export const extractInputParameters = (step: WorkflowStep | TestStep): string[] => {
  const params = new Set<string>();

  // From explicit inputs
  if (step.inputs) {
    Object.keys(step.inputs).forEach((paramName) => {
      params.add(paramName);
    });
  }

  // From parameterValues (backward compatibility)
  if (step.parameterValues) {
    Object.keys(step.parameterValues).forEach((paramName) => {
      params.add(paramName);
    });
  }

  // For HTTP steps, add common parameters
  if (step.type === 'http' || step.config?.method) {
    if (step.config?.url && step.config.url.includes('{{')) {
      params.add('url');
    }
    if (step.config?.body) {
      params.add('body');
    }
    if (step.config?.headers) {
      params.add('headers');
    }
  }

  // For command steps
  if (step.type === 'command' || step.config?.command) {
    params.add('command');
  }

  return Array.from(params);
};

/**
 * Extract output variable names from a workflow step
 * Returns the variable names that this step produces
 */
export const extractOutputVariables = (step: WorkflowStep | TestStep): string[] => {
  const outputs = new Set<string>();

  // From explicit outputs mapping
  if (step.outputs) {
    Object.values(step.outputs).forEach((varName) => {
      if (varName && typeof varName === 'string' && varName.trim() !== '') {
        outputs.add(varName);
      }
    });
  }

  // From outputMapping (backward compatibility)
  if (step.outputMapping) {
    Object.values(step.outputMapping).forEach((varName) => {
      if (varName && typeof varName === 'string' && varName.trim() !== '') {
        outputs.add(varName);
      }
    });
  }

  // For HTTP steps, add common outputs if not explicitly defined
  if ((step.type === 'http' || step.config?.method) && outputs.size === 0) {
    outputs.add('response');
    outputs.add('status');
    outputs.add('body');
  }

  // For command steps
  if ((step.type === 'command' || step.config?.command) && outputs.size === 0) {
    outputs.add('stdout');
    outputs.add('exitCode');
  }

  return Array.from(outputs);
};

/**
 * Convert workflow steps to React Flow nodes and edges
 * Creates a graph representation suitable for React Flow
 */
export const convertStepsToGraph = (
  steps: (WorkflowStep | TestStep)[]
): { initialNodes: Node[]; initialEdges: Edge[] } => {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  // Track variable sources (which step produces which variable)
  const variableSources = new Map<string, string>(); // varName -> stepId

  // Layout configuration
  const NODE_WIDTH = 280;
  const NODE_HEIGHT = 200;
  const HORIZONTAL_SPACING = 150;
  const VERTICAL_SPACING = 120;

  // Simple vertical layout
  steps.forEach((step, index) => {
    const inputs = extractInputParameters(step);
    const outputs = extractOutputVariables(step);

    // Create node
    const node: Node = {
      id: step.id,
      type: 'stepNode',
      position: {
        x: 100,
        y: index * (NODE_HEIGHT + VERTICAL_SPACING) + 50,
      },
      data: {
        step,
        inputs,
        outputs,
      },
    };

    nodes.push(node);

    // Create edges from variable sources to this step's inputs
    inputs.forEach((inputParam) => {
      // Check if this input references a variable from a previous step
      if (step.inputs && step.inputs[inputParam]) {
        const inputValue = step.inputs[inputParam];

        // Parse {{stepId.fieldName}} or {{varName}} pattern
        const match = String(inputValue).match(/\{\{([^}]+)\}\}/);
        if (match) {
          const ref = match[1];
          const parts = ref.split('.');
          const sourceStepId = parts[0]; // step ID or variable name
          const sourceField = parts[1] || ref; // field name or full ref

          // Check if source is a previous step
          const sourceStep = steps.find(s => s.id === sourceStepId);
          if (sourceStep) {
            // Create edge from sourceStepId.sourceField to current step.inputParam
            const edgeId = `${sourceStepId}-${sourceField}-${step.id}-${inputParam}`;
            edges.push({
              id: edgeId,
              source: sourceStepId,
              sourceHandle: `output-${sourceField}`,
              target: step.id,
              targetHandle: `input-${inputParam}`,
              type: 'smoothstep',
              animated: true,
              style: { stroke: '#3b82f6', strokeWidth: 2 },
            });
          } else {
            // Check if it's a simple variable reference
            const varSource = variableSources.get(ref);
            if (varSource) {
              const edgeId = `${varSource}-${ref}-${step.id}-${inputParam}`;
              edges.push({
                id: edgeId,
                source: varSource,
                sourceHandle: `output-${ref}`,
                target: step.id,
                targetHandle: `input-${inputParam}`,
                type: 'smoothstep',
                animated: true,
                style: { stroke: '#3b82f6', strokeWidth: 2 },
              });
            }
          }
        }
      }
    });

    // Register output variables from this step
    outputs.forEach((outputVar) => {
      variableSources.set(outputVar, step.id);
    });
  });

  return { initialNodes: nodes, initialEdges: edges };
};

/**
 * Get variable reference from a step output
 * Formats: {{stepId.fieldName}}
 */
export const getVariableReference = (stepId: string, fieldName: string): string => {
  return `{{${stepId}.${fieldName}}}`;
};

/**
 * Parse variable reference to extract step ID and field name
 * Parses: {{stepId.fieldName}} -> { stepId, fieldName }
 */
export const parseVariableReference = (
  ref: string
): { stepId: string; fieldName: string } | null => {
  const match = ref.match(/\{\{([^}]+)\}\}/);
  if (!match) return null;

  const parts = match[1].split('.');
  if (parts.length < 2) return null;

  return {
    stepId: parts[0],
    fieldName: parts.slice(1).join('.'),
  };
};

/**
 * Validate if a connection between two handles is valid
 * Checks type compatibility and prevents circular dependencies
 */
export const validateConnection = (
  sourceStepId: string,
  targetStepId: string,
  steps: (WorkflowStep | TestStep)[]
): boolean => {
  // Prevent self-connections
  if (sourceStepId === targetStepId) return false;

  // Check for circular dependencies (basic check)
  const sourceIndex = steps.findIndex(s => s.id === sourceStepId);
  const targetIndex = steps.findIndex(s => s.id === targetStepId);

  // Source should come before target in the workflow
  if (sourceIndex >= targetIndex) {
    console.warn('Connection would create a circular dependency or backward reference');
    return false;
  }

  return true;
};
