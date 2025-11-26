import React, { useMemo } from 'react';
import { TestStep } from '../../../types';
import {
  Globe,
  Terminal,
  CheckCircle,
  GitBranch,
  Layers,
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2
} from 'lucide-react';

/**
 * Execution status type for step nodes
 */
export type ExecutionStatusType = 'pending' | 'running' | 'passed' | 'failed';

/**
 * Props for the StepNode component
 */
export interface StepNodeProps {
  /** The test step data */
  step: TestStep;
  /** Step index (0-based) */
  index: number;
  /** Input variable names consumed by this step */
  inputVars: string[];
  /** Output variable names produced by this step */
  outputVars: string[];
  /** Whether this step is highlighted */
  isHighlighted?: boolean;
  /** Current execution status */
  executionStatus?: ExecutionStatusType;
  /** Click handler for the step */
  onClick?: () => void;
  /** Hover handler for input variable port */
  onInputHover?: (varName: string | null) => void;
  /** Hover handler for output variable port */
  onOutputHover?: (varName: string | null) => void;
  /** Y position for SVG positioning */
  y?: number;
  /** Node width */
  width?: number;
}

// Step type icons mapping
const STEP_TYPE_ICONS: Record<string, React.ReactNode> = {
  http: <Globe size={14} />,
  command: <Terminal size={14} />,
  assert: <CheckCircle size={14} />,
  branch: <GitBranch size={14} />,
  group: <Layers size={14} />,
  loop: <RefreshCw size={14} />
};

// Step type colors mapping (Tailwind classes)
const STEP_TYPE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  http: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  command: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  assert: { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200' },
  branch: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  group: { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' },
  loop: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' }
};

// Execution status icons and colors
const STATUS_CONFIG: Record<ExecutionStatusType, { icon: React.ReactNode; color: string }> = {
  pending: { icon: <Clock size={12} />, color: 'text-slate-400' },
  running: { icon: <Loader2 size={12} className="animate-spin" />, color: 'text-blue-500' },
  passed: { icon: <CheckCircle2 size={12} />, color: 'text-green-500' },
  failed: { icon: <XCircle size={12} />, color: 'text-red-500' }
};

/**
 * Variable port component for inputs/outputs
 */
interface VariablePortProps {
  varName: string;
  side: 'input' | 'output';
  index: number;
  totalPorts: number;
  onHover?: (varName: string | null) => void;
  isHighlighted?: boolean;
}

const VariablePort: React.FC<VariablePortProps> = ({
  varName,
  side,
  index,
  totalPorts,
  onHover,
  isHighlighted
}) => {
  // Calculate vertical position within the node
  const portSpacing = 20;
  const startOffset = 30;
  const topOffset = startOffset + index * portSpacing;

  return (
    <div
      className={`absolute flex items-center group/port cursor-pointer ${
        side === 'input' ? 'left-0 -translate-x-full pr-2' : 'right-0 translate-x-full pl-2'
      }`}
      style={{ top: `${topOffset}px` }}
      onMouseEnter={() => onHover?.(varName)}
      onMouseLeave={() => onHover?.(null)}
    >
      {/* Port circle */}
      <div
        className={`w-3 h-3 rounded-full border-2 transition-all ${
          isHighlighted
            ? 'bg-purple-500 border-purple-300 shadow-lg shadow-purple-200'
            : side === 'input'
            ? 'bg-purple-400 border-purple-200'
            : 'bg-cyan-400 border-cyan-200'
        } ${side === 'input' ? 'order-2 ml-1' : 'order-1 mr-1'}`}
      />

      {/* Variable name tooltip */}
      <div
        className={`absolute ${
          side === 'input' ? 'right-full mr-2' : 'left-full ml-2'
        } px-2 py-1 text-xs font-mono bg-slate-800 text-white rounded shadow-lg
        opacity-0 group-hover/port:opacity-100 transition-opacity whitespace-nowrap z-10`}
      >
        {varName}
      </div>
    </div>
  );
};

/**
 * StepNode component - Renders a single step in the data flow diagram
 *
 * Displays:
 * - Step name and type badge
 * - Input variable ports (left side, purple)
 * - Output variable ports (right side, cyan)
 * - Execution status indicator
 * - Loop/branch indicators
 */
export const StepNode: React.FC<StepNodeProps> = ({
  step,
  index,
  inputVars,
  outputVars,
  isHighlighted = false,
  executionStatus,
  onClick,
  onInputHover,
  onOutputHover,
  width = 360
}) => {
  const stepType = step.type || 'http';
  const colors = STEP_TYPE_COLORS[stepType] || STEP_TYPE_COLORS.http;
  const typeIcon = STEP_TYPE_ICONS[stepType] || STEP_TYPE_ICONS.http;
  const statusConfig = executionStatus ? STATUS_CONFIG[executionStatus] : null;

  // Determine if step has control flow
  const hasLoop = !!step.loop;
  const hasBranches = step.branches && step.branches.length > 0;

  // Calculate node height based on number of ports
  const maxPorts = Math.max(inputVars.length, outputVars.length, 1);
  const nodeHeight = Math.max(70, 40 + maxPorts * 20);

  // Get method and URL for HTTP steps
  const httpMethod = step.config?.method || 'GET';
  const httpUrl = step.config?.url || '';

  return (
    <div
      className={`relative rounded-xl border-2 transition-all cursor-pointer overflow-hidden ${
        isHighlighted
          ? 'border-blue-400 shadow-lg shadow-blue-100 ring-2 ring-blue-200'
          : `${colors.border} hover:shadow-md`
      }`}
      style={{ width: `${width}px`, minHeight: `${nodeHeight}px` }}
      onClick={onClick}
    >
      {/* Input variable ports */}
      {inputVars.map((varName, i) => (
        <VariablePort
          key={`input-${varName}`}
          varName={varName}
          side="input"
          index={i}
          totalPorts={inputVars.length}
          onHover={onInputHover}
          isHighlighted={isHighlighted}
        />
      ))}

      {/* Output variable ports */}
      {outputVars.map((varName, i) => (
        <VariablePort
          key={`output-${varName}`}
          varName={varName}
          side="output"
          index={i}
          totalPorts={outputVars.length}
          onHover={onOutputHover}
          isHighlighted={isHighlighted}
        />
      ))}

      {/* Node content */}
      <div className={`flex items-stretch h-full ${colors.bg}`}>
        {/* Step type indicator bar */}
        <div
          className={`w-12 flex flex-col items-center justify-center border-r ${colors.border}`}
        >
          <div className={`p-1.5 rounded ${colors.text}`}>{typeIcon}</div>
          {/* Execution status */}
          {statusConfig && (
            <div className={`mt-1 ${statusConfig.color}`}>{statusConfig.icon}</div>
          )}
        </div>

        {/* Main content area */}
        <div className="flex-1 p-3">
          {/* Step header */}
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-400 font-mono">{index + 1}.</span>
            <span className="text-sm font-semibold text-slate-800 truncate">
              {step.name || step.summary || 'Unnamed Step'}
            </span>
          </div>

          {/* Step badges */}
          <div className="flex items-center flex-wrap gap-1.5 mt-2">
            {/* Type badge */}
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-medium uppercase border ${colors.bg} ${colors.text} ${colors.border}`}
            >
              {stepType}
            </span>

            {/* Loop indicator */}
            {hasLoop && (
              <span className="flex items-center space-x-1 text-[10px] px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-medium">
                <RefreshCw size={10} />
                <span>Loop: {step.loop?.type}</span>
              </span>
            )}

            {/* Branch indicator */}
            {hasBranches && (
              <span className="flex items-center space-x-1 text-[10px] px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full font-medium">
                <GitBranch size={10} />
                <span>{step.branches?.length} branches</span>
              </span>
            )}
          </div>

          {/* HTTP method and URL preview */}
          {(stepType === 'http' || !stepType) && httpUrl && (
            <div className="mt-2 text-xs font-mono text-slate-500 bg-white/50 px-2 py-1 rounded truncate">
              <span className="font-semibold text-slate-700">{httpMethod} </span>
              {httpUrl}
            </div>
          )}

          {/* Input/Output summary */}
          <div className="flex items-center justify-between mt-2 text-[10px] text-slate-400">
            {inputVars.length > 0 && (
              <span className="flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-purple-400" />
                <span>{inputVars.length} inputs</span>
              </span>
            )}
            {outputVars.length > 0 && (
              <span className="flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                <span>{outputVars.length} outputs</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StepNode;
