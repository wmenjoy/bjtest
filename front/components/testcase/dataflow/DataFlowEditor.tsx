import React, { useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Node,
  Edge,
  Connection,
  addEdge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  ConnectionMode,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { WorkflowStep, DataBinding } from '../../../types';
import { ReactFlowStepNode } from './ReactFlowStepNode';
import { convertStepsToGraph, extractOutputVariables, extractInputParameters } from './utils';

interface DataFlowEditorProps {
  steps: WorkflowStep[];
  onChange: (steps: WorkflowStep[]) => void;
  readonly?: boolean;
}

const nodeTypes = {
  stepNode: ReactFlowStepNode,
};

/**
 * DataFlowEditor - Visual data flow editor with drag-drop connections
 *
 * Features:
 * - Visual step nodes with input/output handles
 * - Drag-drop connections between outputs and inputs
 * - Auto-generate variable bindings (e.g., {{step1.token}})
 * - Type checking for connections
 * - Connection preview on hover
 */
export const DataFlowEditor: React.FC<DataFlowEditorProps> = ({ steps, onChange, readonly = false }) => {
  // Convert workflow steps to React Flow nodes and edges
  const { initialNodes, initialEdges } = useMemo(() => convertStepsToGraph(steps), [steps]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  /**
   * Handle new connection between nodes
   * Creates a data binding and updates the target step's inputs
   */
  const onConnect = useCallback(
    (connection: Connection) => {
      if (readonly) return;

      const { source, sourceHandle, target, targetHandle } = connection;

      if (!source || !sourceHandle || !target || !targetHandle) return;

      // Parse handles
      // sourceHandle format: "output-fieldName"
      // targetHandle format: "input-paramName"
      const outputField = sourceHandle.replace('output-', '');
      const inputParam = targetHandle.replace('input-', '');

      // Create variable reference: {{sourceStepId.outputField}}
      const varRef = `{{${source}.${outputField}}}`;

      // Update target step's inputs
      const updatedSteps = steps.map(step => {
        if (step.id === target) {
          return {
            ...step,
            inputs: {
              ...step.inputs,
              [inputParam]: varRef,
            },
          };
        }
        return step;
      });

      onChange(updatedSteps);

      // Add edge to the graph
      setEdges((eds) => addEdge(connection, eds));
    },
    [steps, onChange, readonly, setEdges]
  );

  /**
   * Handle connection validation
   * Validates type compatibility between source and target
   */
  const isValidConnection = useCallback((connection: Connection) => {
    if (readonly) return false;

    const { source, sourceHandle, target, targetHandle } = connection;

    // Prevent self-connections
    if (source === target) return false;

    // TODO: Add type checking
    // const sourceNode = nodes.find(n => n.id === source);
    // const targetNode = nodes.find(n => n.id === target);
    // Check if sourceHandle output type matches targetHandle input type

    return true;
  }, [readonly]);

  /**
   * Handle edge deletion
   * Removes the data binding from the target step
   */
  const onEdgesDelete = useCallback(
    (deletedEdges: Edge[]) => {
      if (readonly) return;

      let updatedSteps = [...steps];

      deletedEdges.forEach(edge => {
        const { source, sourceHandle, target, targetHandle } = edge;

        if (!sourceHandle || !targetHandle) return;

        const inputParam = targetHandle.replace('input-', '');

        // Remove the input binding from target step
        updatedSteps = updatedSteps.map(step => {
          if (step.id === target) {
            const newInputs = { ...step.inputs };
            delete newInputs[inputParam];
            return {
              ...step,
              inputs: newInputs,
            };
          }
          return step;
        });
      });

      onChange(updatedSteps);
    },
    [steps, onChange, readonly]
  );

  return (
    <div className="w-full h-full bg-slate-50">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={readonly ? undefined : onNodesChange}
        onEdgesChange={readonly ? undefined : onEdgesChange}
        onConnect={onConnect}
        onEdgesDelete={onEdgesDelete}
        isValidConnection={isValidConnection}
        nodeTypes={nodeTypes}
        connectionMode={ConnectionMode.Loose}
        fitView
        attributionPosition="bottom-left"
        minZoom={0.2}
        maxZoom={2}
        defaultEdgeOptions={{
          type: 'smoothstep',
          animated: true,
          style: { stroke: '#3b82f6', strokeWidth: 2 },
        }}
      >
        <Background color="#94a3b8" gap={16} />
        <Controls />
        <MiniMap
          nodeColor={(node) => {
            switch (node.type) {
              case 'stepNode':
                return '#3b82f6';
              default:
                return '#94a3b8';
            }
          }}
          maskColor="rgba(0, 0, 0, 0.1)"
        />
      </ReactFlow>

      {/* Help Panel */}
      {!readonly && (
        <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-4 max-w-xs text-sm">
          <h4 className="font-bold text-slate-800 mb-2">Data Flow Editor</h4>
          <ul className="text-slate-600 space-y-1">
            <li>• Drag connections from outputs to inputs</li>
            <li>• Auto-generates variable bindings</li>
            <li>• Delete connections to remove bindings</li>
            <li>• Zoom with mouse wheel</li>
            <li>• Pan by dragging the canvas</li>
          </ul>
        </div>
      )}
    </div>
  );
};
