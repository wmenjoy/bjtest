import React, { useCallback, useMemo, useState, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  ConnectionLineType,
  Panel,
  MarkerType,
} from '@xyflow/react';
import dagre from '@dagrejs/dagre';
import '@xyflow/react/dist/style.css';
import { WorkflowStep } from '../types';
import { Layers, GitBranch, Repeat, Workflow, Database, Globe, Terminal } from 'lucide-react';

interface AdvancedDAGEditorProps {
  steps: WorkflowStep[];
  onChange: (steps: WorkflowStep[]) => void;
  readonly?: boolean;
}

// Dagre layout configuration
const dagreGraph = new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
const nodeWidth = 250;
const nodeHeight = 100;

// Get node style based on step type
function getNodeStyle(step: WorkflowStep): React.CSSProperties {
  const baseStyle: React.CSSProperties = {
    padding: '16px',
    borderRadius: '8px',
    border: '2px solid',
    background: 'white',
    minWidth: `${nodeWidth}px`,
    minHeight: `${nodeHeight}px`,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
  };

  if (step.type === 'branch' || (step.branches && step.branches.length > 0)) {
    return { ...baseStyle, borderColor: '#9333ea', background: '#faf5ff' };
  }
  if (step.loop) {
    return { ...baseStyle, borderColor: '#7c3aed', background: '#f5f3ff' };
  }
  if (step.type === 'merge') {
    return { ...baseStyle, borderColor: '#059669', background: '#f0fdf4' };
  }
  if (step.type === 'http') {
    return { ...baseStyle, borderColor: '#2563eb', background: '#eff6ff' };
  }
  if (step.type === 'database') {
    return { ...baseStyle, borderColor: '#dc2626', background: '#fef2f2' };
  }
  if (step.type === 'command') {
    return { ...baseStyle, borderColor: '#ea580c', background: '#fff7ed' };
  }
  return { ...baseStyle, borderColor: '#64748b', background: '#f8fafc' };
}

// Get icon for step type
function getStepIcon(step: WorkflowStep): React.ReactNode {
  if (step.type === 'branch' || (step.branches && step.branches.length > 0)) {
    return <GitBranch size={18} className="text-purple-600" />;
  }
  if (step.loop) {
    return <Repeat size={18} className="text-violet-600" />;
  }
  if (step.type === 'merge') {
    return <Workflow size={18} className="text-green-600" />;
  }
  if (step.type === 'http') {
    return <Globe size={18} className="text-blue-600" />;
  }
  if (step.type === 'database') {
    return <Database size={18} className="text-red-600" />;
  }
  if (step.type === 'command') {
    return <Terminal size={18} className="text-orange-600" />;
  }
  return <Workflow size={18} className="text-slate-600" />;
}

// Custom node component
function CustomNode({ data }: { data: any }) {
  const step = data.step as WorkflowStep;
  const icon = getStepIcon(step);

  return (
    <div style={getNodeStyle(step)}>
      <div className="flex items-center space-x-2 mb-2">
        {icon}
        <div className="font-semibold text-sm text-slate-800 truncate flex-1">
          {data.label}
        </div>
      </div>
      <div className="text-xs text-slate-600">
        <div className="flex items-center justify-between">
          <span className="font-mono bg-slate-100 px-2 py-0.5 rounded">
            {step.type || 'step'}
          </span>
          {step.actionTemplateId && (
            <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs">
              Template
            </span>
          )}
        </div>
      </div>
      {step.loop && (
        <div className="mt-2 text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
          Loop: {step.loop.type}
        </div>
      )}
      {step.branches && step.branches.length > 0 && (
        <div className="mt-2 text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
          {step.branches.length} branches
        </div>
      )}
      {step.dependsOn && step.dependsOn.length > 0 && (
        <div className="mt-2 text-xs text-slate-500">
          Depends on: {step.dependsOn.length}
        </div>
      )}
    </div>
  );
}

// Node types configuration
const nodeTypes = {
  custom: CustomNode,
};

// Convert steps to DAG nodes and edges
function convertStepsToGraph(steps: WorkflowStep[]): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  // Create a flat list including nested steps for visualization
  const allSteps: WorkflowStep[] = [];

  function collectSteps(stepList: WorkflowStep[]) {
    stepList.forEach(step => {
      allSteps.push(step);

      // Collect children from branches
      if (step.branches) {
        step.branches.forEach(branch => {
          if (branch.children) {
            collectSteps(branch.children);
          }
        });
      }

      // Collect direct children (e.g., from loops)
      if (step.children) {
        collectSteps(step.children);
      }
    });
  }

  collectSteps(steps);

  allSteps.forEach((step, index) => {
    // Create node
    nodes.push({
      id: step.id,
      type: 'custom',
      position: step.position || { x: 0, y: index * 150 },
      data: {
        step,
        label: step.name || step.id,
        type: step.type,
        hasTemplate: !!step.actionTemplateId,
        hasLoop: !!step.loop,
        hasBranches: step.branches && step.branches.length > 0,
      },
    });

    // Create edges from dependencies
    if (step.dependsOn && step.dependsOn.length > 0) {
      step.dependsOn.forEach(depId => {
        edges.push({
          id: `${depId}-${step.id}`,
          source: depId,
          target: step.id,
          type: 'smoothstep',
          animated: true,
          label: 'depends on',
          markerEnd: {
            type: MarkerType.ArrowClosed,
          },
          style: { stroke: '#64748b', strokeWidth: 2 },
        });
      });
    }

    // Create edges for branch children
    if (step.branches) {
      step.branches.forEach((branch, branchIndex) => {
        if (branch.children) {
          branch.children.forEach(child => {
            edges.push({
              id: `${step.id}-branch${branchIndex}-${child.id}`,
              source: step.id,
              target: child.id,
              type: 'smoothstep',
              label: branch.label || `Branch ${branchIndex + 1}`,
              markerEnd: {
                type: MarkerType.ArrowClosed,
              },
              style: { stroke: '#9333ea', strokeWidth: 2 },
            });
          });
        }
      });
    }

    // Create edges for direct children (loops)
    if (step.children) {
      step.children.forEach(child => {
        edges.push({
          id: `${step.id}-child-${child.id}`,
          source: step.id,
          target: child.id,
          type: 'smoothstep',
          label: 'loop body',
          markerEnd: {
            type: MarkerType.ArrowClosed,
          },
          style: { stroke: '#7c3aed', strokeWidth: 2 },
        });
      });
    }
  });

  return { nodes, edges };
}

// Auto-layout using Dagre
function getLayoutedElements(
  nodes: Node[],
  edges: Edge[],
  direction: 'TB' | 'LR' = 'TB'
): { nodes: Node[]; edges: Edge[] } {
  const isHorizontal = direction === 'LR';
  dagreGraph.setGraph({ rankdir: direction, nodesep: 100, ranksep: 150 });

  nodes.forEach(node => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach(edge => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const newNodes = nodes.map(node => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      targetPosition: isHorizontal ? ('left' as const) : ('top' as const),
      sourcePosition: isHorizontal ? ('right' as const) : ('bottom' as const),
      position: {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      },
    };
  });

  return { nodes: newNodes, edges };
}

export const AdvancedDAGEditor: React.FC<AdvancedDAGEditorProps> = ({
  steps,
  onChange,
  readonly = false
}) => {
  const [layoutDirection, setLayoutDirection] = useState<'TB' | 'LR'>('TB');

  // Convert steps to nodes/edges and apply layout
  const { initialNodes, initialEdges } = useMemo(() => {
    const { nodes, edges } = convertStepsToGraph(steps);
    return getLayoutedElements(nodes, edges, layoutDirection);
  }, [steps, layoutDirection]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  // Update nodes when steps change
  useEffect(() => {
    const { nodes, edges } = convertStepsToGraph(steps);
    const layouted = getLayoutedElements(nodes, edges, layoutDirection);
    setNodes(layouted.nodes);
    setEdges(layouted.edges);
  }, [steps, layoutDirection, setNodes, setEdges]);

  // Handle new connection (dependency)
  const onConnect = useCallback(
    (connection: Connection) => {
      if (readonly) return;

      // Add dependency to target step
      const targetStepId = connection.target;
      const sourceStepId = connection.source;

      const newSteps = steps.map(step => {
        if (step.id === targetStepId) {
          return {
            ...step,
            dependsOn: [...(step.dependsOn || []), sourceStepId!],
          };
        }
        return step;
      });

      onChange(newSteps);
      setEdges(eds => addEdge({
        ...connection,
        type: 'smoothstep',
        animated: true,
        markerEnd: {
          type: MarkerType.ArrowClosed,
        },
      }, eds));
    },
    [steps, onChange, readonly, setEdges]
  );

  // Handle node click
  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  // Handle node position change
  const onNodeDragStop = useCallback(
    (event: React.MouseEvent, node: Node) => {
      if (readonly) return;

      const newSteps = steps.map(step => {
        if (step.id === node.id) {
          return {
            ...step,
            position: node.position,
          };
        }
        return step;
      });

      onChange(newSteps);
    },
    [steps, onChange, readonly]
  );

  // Apply layout
  const onLayout = useCallback((direction: 'TB' | 'LR') => {
    setLayoutDirection(direction);
  }, []);

  return (
    <div className="advanced-dag-editor h-full flex border border-slate-200 rounded-lg overflow-hidden">
      {/* Main DAG canvas */}
      <div className="flex-1 relative bg-slate-50">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={readonly ? undefined : onNodesChange}
          onEdgesChange={readonly ? undefined : onEdgesChange}
          onConnect={readonly ? undefined : onConnect}
          onNodeClick={onNodeClick}
          onNodeDragStop={readonly ? undefined : onNodeDragStop}
          nodeTypes={nodeTypes}
          connectionLineType={ConnectionLineType.SmoothStep}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.2}
          maxZoom={2}
        >
          <Background color="#cbd5e1" gap={16} />
          <Controls />
          <MiniMap
            nodeColor={(node) => {
              const step = node.data.step as WorkflowStep;
              if (step.type === 'branch' || (step.branches && step.branches.length > 0)) return '#9333ea';
              if (step.loop) return '#7c3aed';
              if (step.type === 'merge') return '#059669';
              if (step.type === 'http') return '#2563eb';
              if (step.type === 'database') return '#dc2626';
              if (step.type === 'command') return '#ea580c';
              return '#64748b';
            }}
            maskColor="rgba(100, 116, 139, 0.1)"
          />

          {/* Layout controls */}
          <Panel position="top-right" className="space-x-2">
            <button
              onClick={() => onLayout('TB')}
              className={`px-3 py-1.5 text-sm rounded shadow-sm transition-colors ${
                layoutDirection === 'TB'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-50'
              }`}
              disabled={readonly}
            >
              Vertical
            </button>
            <button
              onClick={() => onLayout('LR')}
              className={`px-3 py-1.5 text-sm rounded shadow-sm transition-colors ${
                layoutDirection === 'LR'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-50'
              }`}
              disabled={readonly}
            >
              Horizontal
            </button>
          </Panel>

          {/* Step count */}
          <Panel position="top-left">
            <div className="flex items-center space-x-2 bg-white px-3 py-2 rounded shadow-sm text-sm border border-slate-200">
              <Layers size={16} className="text-slate-500" />
              <span className="font-medium text-slate-700">{steps.length} steps</span>
            </div>
          </Panel>

          {/* Readonly badge */}
          {readonly && (
            <Panel position="bottom-left">
              <div className="bg-amber-50 border border-amber-200 text-amber-800 px-3 py-2 rounded shadow-sm text-sm">
                Read-only mode
              </div>
            </Panel>
          )}
        </ReactFlow>
      </div>

      {/* Right sidebar - Selected node details */}
      {selectedNode && (
        <div className="w-96 border-l border-slate-200 bg-white overflow-y-auto">
          <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 z-10">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800">
                Step Details
              </h3>
              <button
                onClick={() => setSelectedNode(null)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                Step ID
              </label>
              <div className="text-sm font-mono text-slate-700 bg-slate-50 px-3 py-2 rounded border border-slate-200">
                {selectedNode.id}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                Step Name
              </label>
              <div className="text-sm text-slate-700 bg-slate-50 px-3 py-2 rounded border border-slate-200">
                {selectedNode.data.label}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                Type
              </label>
              <div className="text-sm text-slate-700 bg-slate-50 px-3 py-2 rounded border border-slate-200">
                {selectedNode.data.type || 'default'}
              </div>
            </div>

            {selectedNode.data.step.actionTemplateId && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Workflow size={16} className="text-blue-600" />
                  <div>
                    <div className="text-xs font-semibold text-blue-700">Uses Action Template</div>
                    <div className="text-xs text-blue-600 mt-1 font-mono">
                      {selectedNode.data.step.actionTemplateId}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {selectedNode.data.step.loop && (
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Repeat size={16} className="text-purple-600" />
                  <div>
                    <div className="text-xs font-semibold text-purple-700">Loop Configuration</div>
                    <div className="text-xs text-purple-600 mt-1">
                      Type: {selectedNode.data.step.loop.type}
                    </div>
                    {selectedNode.data.step.loop.source && (
                      <div className="text-xs text-purple-600">
                        Source: {selectedNode.data.step.loop.source}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {selectedNode.data.step.branches && selectedNode.data.step.branches.length > 0 && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <GitBranch size={16} className="text-green-600" />
                  <div>
                    <div className="text-xs font-semibold text-green-700">
                      Branch Conditions
                    </div>
                    <div className="text-xs text-green-600 mt-1">
                      {selectedNode.data.step.branches.length} branches defined
                    </div>
                  </div>
                </div>
                <div className="mt-2 space-y-1">
                  {selectedNode.data.step.branches.map((branch, idx) => (
                    <div key={idx} className="text-xs bg-white p-2 rounded border border-green-200">
                      <div className="font-medium text-green-700">
                        {branch.label || `Branch ${idx + 1}`}
                      </div>
                      <div className="text-green-600 font-mono text-xs mt-1">
                        {branch.condition}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedNode.data.step.dependsOn && selectedNode.data.step.dependsOn.length > 0 && (
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                  Dependencies
                </label>
                <div className="space-y-1">
                  {selectedNode.data.step.dependsOn.map(depId => (
                    <div key={depId} className="text-xs bg-slate-50 px-3 py-2 rounded border border-slate-200 font-mono">
                      {depId}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedNode.data.step.inputs && Object.keys(selectedNode.data.step.inputs).length > 0 && (
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                  Inputs
                </label>
                <div className="space-y-2">
                  {Object.entries(selectedNode.data.step.inputs).map(([key, value]) => (
                    <div key={key} className="text-xs">
                      <div className="font-medium text-slate-600">{key}</div>
                      <div className="font-mono text-slate-500 bg-slate-50 px-2 py-1 rounded mt-1">
                        {String(value)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedNode.data.step.timeout && (
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                  Timeout
                </label>
                <div className="text-sm text-slate-700">
                  {selectedNode.data.step.timeout} seconds
                </div>
              </div>
            )}

            {selectedNode.data.step.onError && (
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                  Error Handling
                </label>
                <div className="text-sm text-slate-700 bg-slate-50 px-3 py-2 rounded border border-slate-200">
                  {selectedNode.data.step.onError}
                  {selectedNode.data.step.retryCount && (
                    <span className="ml-2 text-xs text-slate-500">
                      (Retry: {selectedNode.data.step.retryCount} times)
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
