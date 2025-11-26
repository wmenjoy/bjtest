import React, { useRef, useState, useEffect } from 'react';

/**
 * Props for the ConnectionLine component
 */
export interface ConnectionLineProps {
  /** Source step ID */
  fromStep: string;
  /** Variable name from source step output */
  fromVar: string;
  /** Target step ID */
  toStep: string;
  /** Variable name to target step input */
  toVar: string;
  /** Actual value if available during execution */
  value?: any;
  /** Whether this connection is active (during execution) */
  isActive?: boolean;
  /** Whether this connection is highlighted (on hover) */
  isHighlighted?: boolean;
  /** Start position {x, y} */
  startPos: { x: number; y: number };
  /** End position {x, y} */
  endPos: { x: number; y: number };
  /** Click handler */
  onClick?: () => void;
  /** Hover handler */
  onHover?: (isHovering: boolean) => void;
}

/**
 * Generate SVG path data for a smooth bezier curve connection
 */
const generateBezierPath = (
  start: { x: number; y: number },
  end: { x: number; y: number }
): string => {
  // Calculate control point offsets for smooth curves
  const dx = Math.abs(end.x - start.x);
  const dy = Math.abs(end.y - start.y);

  // Vertical connection (typical case in dataflow)
  if (start.y < end.y) {
    // Downward flow
    const controlOffset = Math.max(40, Math.min(dy * 0.4, 100));
    const cp1x = start.x;
    const cp1y = start.y + controlOffset;
    const cp2x = end.x;
    const cp2y = end.y - controlOffset;
    return `M ${start.x} ${start.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${end.x} ${end.y}`;
  } else {
    // Upward flow (feedback loop)
    const controlOffset = Math.max(60, dx * 0.3);
    const cp1x = start.x + controlOffset;
    const cp1y = start.y;
    const cp2x = end.x + controlOffset;
    const cp2y = end.y;
    return `M ${start.x} ${start.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${end.x} ${end.y}`;
  }
};

/**
 * Data type to color mapping
 */
const getColorForType = (value: any): string => {
  if (value === undefined || value === null) return '#94a3b8'; // slate-400
  if (typeof value === 'string') return '#8b5cf6'; // violet-500
  if (typeof value === 'number') return '#3b82f6'; // blue-500
  if (typeof value === 'boolean') return '#10b981'; // emerald-500
  if (Array.isArray(value)) return '#f59e0b'; // amber-500
  if (typeof value === 'object') return '#ec4899'; // pink-500
  return '#6b7280'; // gray-500
};

/**
 * Format value for display
 */
const formatValue = (value: any): string => {
  if (value === undefined) return 'undefined';
  if (value === null) return 'null';
  if (typeof value === 'string') {
    return value.length > 30 ? `"${value.slice(0, 30)}..."` : `"${value}"`;
  }
  if (typeof value === 'object') {
    return JSON.stringify(value).slice(0, 50) + '...';
  }
  return String(value);
};

/**
 * ConnectionLine component - Renders an SVG connection between step nodes
 *
 * Features:
 * - Smooth bezier curve path
 * - Animated flowing dots during execution
 * - Color coding by data type
 * - Hover tooltip showing variable name and value
 * - Arrow marker at end point
 */
export const ConnectionLine: React.FC<ConnectionLineProps> = ({
  fromStep,
  fromVar,
  toStep,
  toVar,
  value,
  isActive = false,
  isHighlighted = false,
  startPos,
  endPos,
  onClick,
  onHover
}) => {
  const [isHovering, setIsHovering] = useState(false);
  const pathRef = useRef<SVGPathElement>(null);
  const [pathLength, setPathLength] = useState(0);

  // Calculate path length for animation
  useEffect(() => {
    if (pathRef.current) {
      setPathLength(pathRef.current.getTotalLength());
    }
  }, [startPos, endPos]);

  const handleMouseEnter = () => {
    setIsHovering(true);
    onHover?.(true);
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    onHover?.(false);
  };

  const pathD = generateBezierPath(startPos, endPos);
  const color = isActive || isHighlighted ? '#3b82f6' : getColorForType(value);
  const strokeWidth = isHighlighted || isHovering ? 3 : 2;
  const opacity = isHighlighted || isHovering ? 1 : 0.6;

  // Generate unique IDs for markers and gradients
  const uniqueId = `${fromStep}-${fromVar}-${toStep}-${toVar}`.replace(/[^a-zA-Z0-9]/g, '_');
  const arrowId = `arrow-${uniqueId}`;
  const gradientId = `gradient-${uniqueId}`;
  const flowId = `flow-${uniqueId}`;

  // Calculate midpoint for label
  const midX = (startPos.x + endPos.x) / 2;
  const midY = (startPos.y + endPos.y) / 2;

  return (
    <g className="connection-line" onClick={onClick}>
      {/* Definitions for markers and gradients */}
      <defs>
        {/* Arrow marker */}
        <marker
          id={arrowId}
          markerWidth="10"
          markerHeight="10"
          refX="9"
          refY="3"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path d="M0,0 L0,6 L9,3 z" fill={color} />
        </marker>

        {/* Gradient for the line */}
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#a78bfa" /> {/* violet-400 */}
          <stop offset="100%" stopColor="#22d3ee" /> {/* cyan-400 */}
        </linearGradient>
      </defs>

      {/* Invisible wider path for easier hover */}
      <path
        d={pathD}
        fill="none"
        stroke="transparent"
        strokeWidth={20}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{ cursor: 'pointer' }}
      />

      {/* Main connection path */}
      <path
        ref={pathRef}
        d={pathD}
        fill="none"
        stroke={isHighlighted ? `url(#${gradientId})` : color}
        strokeWidth={strokeWidth}
        strokeOpacity={opacity}
        markerEnd={`url(#${arrowId})`}
        className="transition-all duration-200"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{ cursor: 'pointer' }}
      />

      {/* Animated flowing dot during active state */}
      {isActive && pathLength > 0 && (
        <>
          <circle r="4" fill="#3b82f6" className="flow-dot">
            <animateMotion dur="1.5s" repeatCount="indefinite">
              <mpath href={`#path-${uniqueId}`} />
            </animateMotion>
          </circle>
          <path id={`path-${uniqueId}`} d={pathD} fill="none" stroke="none" />
        </>
      )}

      {/* Glow effect when highlighted */}
      {(isHighlighted || isHovering) && (
        <path
          d={pathD}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth + 4}
          strokeOpacity={0.2}
          className="blur-sm"
        />
      )}

      {/* Tooltip on hover */}
      {isHovering && (
        <g transform={`translate(${midX}, ${midY})`}>
          {/* Tooltip background */}
          <rect
            x="-60"
            y="-35"
            width="120"
            height="50"
            rx="6"
            fill="#1e293b"
            opacity="0.95"
            className="drop-shadow-lg"
          />
          {/* Variable name */}
          <text
            x="0"
            y="-18"
            textAnchor="middle"
            className="text-xs font-mono fill-white"
            style={{ fontSize: '11px' }}
          >
            {fromVar} {'->'} {toVar}
          </text>
          {/* Value if available */}
          {value !== undefined && (
            <text
              x="0"
              y="2"
              textAnchor="middle"
              className="text-xs fill-slate-300"
              style={{ fontSize: '10px' }}
            >
              {formatValue(value)}
            </text>
          )}
        </g>
      )}
    </g>
  );
};

/**
 * Props for rendering multiple connections
 */
export interface ConnectionsLayerProps {
  /** Array of connection data */
  connections: Array<{
    id: string;
    fromStep: string;
    fromVar: string;
    toStep: string;
    toVar: string;
    startPos: { x: number; y: number };
    endPos: { x: number; y: number };
    value?: any;
    isActive?: boolean;
  }>;
  /** Currently highlighted variable */
  highlightedVar?: string | null;
  /** Handler when connection is clicked */
  onConnectionClick?: (connection: { fromStep: string; fromVar: string; toStep: string; toVar: string }) => void;
}

/**
 * ConnectionsLayer - Renders all connections in an SVG container
 */
export const ConnectionsLayer: React.FC<ConnectionsLayerProps> = ({
  connections,
  highlightedVar,
  onConnectionClick
}) => {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ overflow: 'visible' }}
    >
      <g className="connections-group" style={{ pointerEvents: 'auto' }}>
        {connections.map((conn) => (
          <ConnectionLine
            key={conn.id}
            fromStep={conn.fromStep}
            fromVar={conn.fromVar}
            toStep={conn.toStep}
            toVar={conn.toVar}
            startPos={conn.startPos}
            endPos={conn.endPos}
            value={conn.value}
            isActive={conn.isActive}
            isHighlighted={highlightedVar === conn.fromVar || highlightedVar === conn.toVar}
            onClick={() =>
              onConnectionClick?.({
                fromStep: conn.fromStep,
                fromVar: conn.fromVar,
                toStep: conn.toStep,
                toVar: conn.toVar
              })
            }
          />
        ))}
      </g>
    </svg>
  );
};

export default ConnectionLine;
