import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { TestStep, StepExecution } from '../../../types';
import { StepNode, ExecutionStatusType } from './StepNode';
import { ConnectionsLayer } from './ConnectionLine';
import { LoopDataFlow } from './LoopDataFlow';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Eye,
  EyeOff,
  Box,
  ArrowDown,
  Layers
} from 'lucide-react';

/**
 * Props for the DataFlowDiagram component
 */
export interface DataFlowDiagramProps {
  /** Array of test steps to visualize */
  steps: TestStep[];
  /** Initial/environment variables available at start */
  initialVariables?: Record<string, any>;
  /** Execution data for steps (shows actual values) */
  executionData?: StepExecution[];
  /** Callback when a step is clicked */
  onStepClick?: (stepId: string) => void;
  /** Callback when a variable is clicked */
  onVariableClick?: (varName: string) => void;
  /** Height of the diagram container */
  height?: number | string;
  /** Whether to show loop bodies expanded */
  showLoopDetails?: boolean;
}

/**
 * Represents a connection between steps
 */
interface Connection {
  id: string;
  fromStep: string;
  fromVar: string;
  toStep: string;
  toVar: string;
  startPos: { x: number; y: number };
  endPos: { x: number; y: number };
  value?: any;
  isActive?: boolean;
}

/**
 * Node position data for layout
 */
interface NodeLayout {
  stepId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  inputPorts: { varName: string; y: number }[];
  outputPorts: { varName: string; y: number }[];
}

// Layout constants
const NODE_WIDTH = 360;
const NODE_MARGIN_Y = 100;
const NODE_MARGIN_X = 100;
const INITIAL_VARS_HEIGHT = 80;
const PORT_OFFSET_START = 30;
const PORT_SPACING = 20;

/**
 * Extracts all variable references from step inputs and config
 */
const extractInputVars = (step: TestStep): string[] => {
  const vars = new Set<string>();

  // From explicit inputs
  if (step.inputs) {
    Object.values(step.inputs).forEach((ref) => {
      const match = String(ref).match(/\{\{([^}]+)\}\}/);
      if (match) {
        // Get base variable name (before any dots)
        const varName = match[1].split('.')[0];
        vars.add(varName);
      }
    });
  }

  // From config (search for {{varName}} patterns)
  if (step.config) {
    const configStr = JSON.stringify(step.config);
    const matches = configStr.matchAll(/\{\{([^}]+)\}\}/g);
    for (const match of matches) {
      const varName = match[1].split('.')[0];
      vars.add(varName);
    }
  }

  // From loop source
  if (step.loop?.source) {
    const match = step.loop.source.match(/\{\{([^}]+)\}\}/);
    if (match) {
      vars.add(match[1].split('.')[0]);
    }
  }

  // From condition
  if (step.condition) {
    const matches = step.condition.matchAll(/\{\{([^}]+)\}\}/g);
    for (const match of matches) {
      vars.add(match[1].split('.')[0]);
    }
  }

  return Array.from(vars);
};

/**
 * Extracts output variable names from step
 */
const extractOutputVars = (step: TestStep): string[] => {
  if (!step.outputs) return [];
  return Object.values(step.outputs).filter((v) => v && v.trim() !== '');
};

/**
 * Calculate layout positions for all nodes
 */
const calculateLayout = (
  steps: TestStep[],
  hasInitialVars: boolean,
  containerWidth: number
): { nodes: NodeLayout[]; height: number; connections: Connection[] } => {
  const nodes: NodeLayout[] = [];
  const connections: Connection[] = [];

  // Track which variables are available at each point
  const availableVars = new Map<string, { stepId: string; portIndex: number }>();

  // Start Y position (after initial variables section)
  let currentY = hasInitialVars ? INITIAL_VARS_HEIGHT + 40 : 40;

  // Center X position
  const centerX = Math.max(containerWidth / 2, NODE_WIDTH / 2 + 60);

  steps.forEach((step, index) => {
    const inputVars = extractInputVars(step);
    const outputVars = extractOutputVars(step);
    const maxPorts = Math.max(inputVars.length, outputVars.length, 1);
    const nodeHeight = Math.max(70, 40 + maxPorts * PORT_SPACING);

    const nodeX = centerX - NODE_WIDTH / 2;
    const nodeY = currentY;

    // Calculate port positions
    const inputPorts = inputVars.map((varName, i) => ({
      varName,
      y: nodeY + PORT_OFFSET_START + i * PORT_SPACING
    }));

    const outputPorts = outputVars.map((varName, i) => ({
      varName,
      y: nodeY + PORT_OFFSET_START + i * PORT_SPACING
    }));

    // Create connections from available variables to this step's inputs
    inputVars.forEach((varName, portIndex) => {
      const source = availableVars.get(varName);
      if (source) {
        connections.push({
          id: `${source.stepId}-${varName}-${step.id}`,
          fromStep: source.stepId,
          fromVar: varName,
          toStep: step.id,
          toVar: varName,
          startPos: {
            x: nodeX + NODE_WIDTH + 6, // Right edge of previous node
            y: 0 // Will be updated later
          },
          endPos: {
            x: nodeX - 6, // Left edge of current node
            y: nodeY + PORT_OFFSET_START + portIndex * PORT_SPACING
          }
        });
      }
    });

    // Register output variables
    outputVars.forEach((varName, portIndex) => {
      availableVars.set(varName, { stepId: step.id, portIndex });
    });

    nodes.push({
      stepId: step.id,
      x: nodeX,
      y: nodeY,
      width: NODE_WIDTH,
      height: nodeHeight,
      inputPorts,
      outputPorts
    });

    currentY += nodeHeight + NODE_MARGIN_Y;
  });

  // Update connection start positions based on source node positions
  connections.forEach((conn) => {
    const sourceNode = nodes.find((n) => n.stepId === conn.fromStep);
    if (sourceNode) {
      const outputPort = sourceNode.outputPorts.find((p) => p.varName === conn.fromVar);
      if (outputPort) {
        conn.startPos.x = sourceNode.x + sourceNode.width + 6;
        conn.startPos.y = outputPort.y;
      }
    }
  });

  return { nodes, height: currentY + 40, connections };
};

/**
 * Initial variables panel component
 */
const InitialVariablesPanel: React.FC<{
  variables: Record<string, any>;
  highlightedVar: string | null;
  onVarHover: (varName: string | null) => void;
  onVarClick: (varName: string) => void;
}> = ({ variables, highlightedVar, onVarHover, onVarClick }) => {
  const varEntries = Object.entries(variables);

  if (varEntries.length === 0) return null;

  return (
    <div className="mx-auto mb-4" style={{ maxWidth: NODE_WIDTH + 120 }}>
      <div className="bg-gradient-to-r from-violet-50 to-purple-50 rounded-xl border border-violet-200 p-4">
        <div className="flex items-center space-x-2 mb-3">
          <Box size={14} className="text-violet-600" />
          <span className="text-xs font-semibold text-violet-700 uppercase tracking-wide">
            Initial Variables (Inputs)
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {varEntries.map(([name, value]) => (
            <div
              key={name}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg cursor-pointer transition-all ${
                highlightedVar === name
                  ? 'bg-violet-200 ring-2 ring-violet-300'
                  : 'bg-white hover:bg-violet-100'
              }`}
              onMouseEnter={() => onVarHover(name)}
              onMouseLeave={() => onVarHover(null)}
              onClick={() => onVarClick(name)}
            >
              <span className="w-2 h-2 rounded-full bg-purple-400" />
              <span className="text-xs font-mono text-slate-700">{name}</span>
            </div>
          ))}
        </div>
      </div>
      {/* Arrow down */}
      <div className="flex justify-center mt-4">
        <ArrowDown size={20} className="text-slate-300" />
      </div>
    </div>
  );
};

/**
 * Highlight mode dropdown
 */
const HighlightModeSelect: React.FC<{
  mode: 'all' | 'inputs' | 'outputs' | 'none';
  onChange: (mode: 'all' | 'inputs' | 'outputs' | 'none') => void;
}> = ({ mode, onChange }) => {
  return (
    <div className="flex items-center space-x-2">
      <Eye size={14} className="text-slate-500" />
      <select
        className="text-xs border border-slate-200 rounded px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-blue-300"
        value={mode}
        onChange={(e) => onChange(e.target.value as any)}
      >
        <option value="all">Show All Connections</option>
        <option value="inputs">Highlight Inputs</option>
        <option value="outputs">Highlight Outputs</option>
        <option value="none">Hide Connections</option>
      </select>
    </div>
  );
};

/**
 * DataFlowDiagram component - Main visualization of data flow between steps
 *
 * Features:
 * - Vertical flow diagram with step nodes
 * - SVG connection lines showing variable flow
 * - Initial variables panel at top
 * - Hover highlighting for variable paths
 * - Zoom and pan support
 * - Loop visualization with nested structure
 */
export const DataFlowDiagram: React.FC<DataFlowDiagramProps> = ({
  steps,
  initialVariables = {},
  executionData,
  onStepClick,
  onVariableClick,
  height = 600,
  showLoopDetails = false
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(800);
  const [highlightedVar, setHighlightedVar] = useState<string | null>(null);
  const [highlightedStep, setHighlightedStep] = useState<string | null>(null);
  const [highlightMode, setHighlightMode] = useState<'all' | 'inputs' | 'outputs' | 'none'>('all');
  const [zoom, setZoom] = useState(1);

  // Calculate container width on mount and resize
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // Calculate layout
  const layout = useMemo(() => {
    const hasInitialVars = Object.keys(initialVariables).length > 0;
    return calculateLayout(steps, hasInitialVars, containerWidth);
  }, [steps, initialVariables, containerWidth]);

  // Build connections with execution data values
  const connectionsWithValues = useMemo(() => {
    return layout.connections.map((conn) => {
      // Find execution data for source step
      const sourceExec = executionData?.find((e) => e.stepId === conn.fromStep);
      const value = sourceExec?.outputs?.[conn.fromVar];
      const isActive = sourceExec?.status === 'running';

      return { ...conn, value, isActive };
    });
  }, [layout.connections, executionData]);

  // Filter connections based on highlight mode
  const visibleConnections = useMemo(() => {
    if (highlightMode === 'none') return [];
    return connectionsWithValues;
  }, [connectionsWithValues, highlightMode]);

  // Handle variable hover
  const handleVarHover = useCallback((varName: string | null) => {
    setHighlightedVar(varName);
  }, []);

  // Handle variable click
  const handleVarClick = useCallback(
    (varName: string) => {
      onVariableClick?.(varName);
    },
    [onVariableClick]
  );

  // Handle zoom
  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.1, 2));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.1, 0.5));
  const handleZoomReset = () => setZoom(1);

  return (
    <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-slate-100">
        <div className="flex items-center space-x-2">
          <Layers size={16} className="text-slate-600" />
          <span className="text-sm font-semibold text-slate-700">Data Flow View</span>
          <span className="text-xs text-slate-400">({steps.length} steps)</span>
        </div>

        <div className="flex items-center space-x-4">
          {/* Highlight mode */}
          <HighlightModeSelect mode={highlightMode} onChange={setHighlightMode} />

          {/* Zoom controls */}
          <div className="flex items-center space-x-1 border-l border-slate-200 pl-4">
            <button
              className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded"
              onClick={handleZoomOut}
              title="Zoom out"
            >
              <ZoomOut size={16} />
            </button>
            <span className="text-xs text-slate-500 w-12 text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded"
              onClick={handleZoomIn}
              title="Zoom in"
            >
              <ZoomIn size={16} />
            </button>
            <button
              className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded"
              onClick={handleZoomReset}
              title="Reset zoom"
            >
              <Maximize2 size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Diagram container */}
      <div
        ref={containerRef}
        className="overflow-auto"
        style={{ height: typeof height === 'number' ? `${height}px` : height }}
      >
        <div
          className="relative min-w-full p-6"
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: 'top center',
            minHeight: layout.height * zoom
          }}
        >
          {/* Initial variables panel */}
          {Object.keys(initialVariables).length > 0 && (
            <InitialVariablesPanel
              variables={initialVariables}
              highlightedVar={highlightedVar}
              onVarHover={handleVarHover}
              onVarClick={handleVarClick}
            />
          )}

          {/* SVG layer for connections */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ height: layout.height, overflow: 'visible' }}
          >
            <ConnectionsLayer
              connections={visibleConnections}
              highlightedVar={highlightedVar}
              onConnectionClick={(conn) => handleVarClick(conn.fromVar)}
            />
          </div>

          {/* Step nodes */}
          <div className="relative" style={{ height: layout.height - 100 }}>
            {layout.nodes.map((nodeLayout, index) => {
              const step = steps[index];
              const stepExec = executionData?.find((e) => e.stepId === step.id);
              const inputVars = extractInputVars(step);
              const outputVars = extractOutputVars(step);

              // Check if this is a loop step and should show details
              const hasLoop = step.loop && showLoopDetails;

              return (
                <div
                  key={step.id}
                  className="absolute"
                  style={{
                    left: nodeLayout.x,
                    top: nodeLayout.y,
                    width: nodeLayout.width
                  }}
                >
                  {hasLoop ? (
                    <LoopDataFlow
                      step={step}
                      loopConfig={step.loop!}
                      iterations={stepExec?.loop?.iterations}
                      onIterationClick={(idx) => console.log('Iteration clicked:', idx)}
                      onChildStepClick={(stepId, idx) =>
                        console.log('Child step clicked:', stepId, 'in iteration', idx)
                      }
                    />
                  ) : (
                    <StepNode
                      step={step}
                      index={index}
                      inputVars={inputVars}
                      outputVars={outputVars}
                      isHighlighted={
                        highlightedStep === step.id ||
                        inputVars.includes(highlightedVar || '') ||
                        outputVars.includes(highlightedVar || '')
                      }
                      executionStatus={stepExec?.status as ExecutionStatusType}
                      onClick={() => {
                        setHighlightedStep(step.id);
                        onStepClick?.(step.id);
                      }}
                      onInputHover={handleVarHover}
                      onOutputHover={handleVarHover}
                      width={NODE_WIDTH}
                    />
                  )}

                  {/* Arrow to next step */}
                  {index < steps.length - 1 && (
                    <div className="flex justify-center mt-6">
                      <ArrowDown size={20} className="text-slate-300" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Final outputs section (if any steps produce outputs) */}
          {steps.some((s) => s.outputs && Object.keys(s.outputs).length > 0) && (
            <div
              className="mx-auto mt-8"
              style={{ maxWidth: NODE_WIDTH + 120, marginTop: layout.height - 40 }}
            >
              <div className="bg-gradient-to-r from-cyan-50 to-teal-50 rounded-xl border border-cyan-200 p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <Box size={14} className="text-cyan-600" />
                  <span className="text-xs font-semibold text-cyan-700 uppercase tracking-wide">
                    Final Outputs
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {steps.flatMap((step) =>
                    Object.values(step.outputs || {}).map((varName) => (
                      <div
                        key={varName}
                        className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg cursor-pointer transition-all ${
                          highlightedVar === varName
                            ? 'bg-cyan-200 ring-2 ring-cyan-300'
                            : 'bg-white hover:bg-cyan-100'
                        }`}
                        onMouseEnter={() => handleVarHover(varName)}
                        onMouseLeave={() => handleVarHover(null)}
                        onClick={() => handleVarClick(varName)}
                      >
                        <span className="w-2 h-2 rounded-full bg-cyan-400" />
                        <span className="text-xs font-mono text-slate-700">{varName}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DataFlowDiagram;
