/**
 * WorkflowLogs - 工作流实时日志显示组件
 *
 * Features:
 * - Real-time log streaming via WebSocket
 * - Log level filtering (INFO, WARN, ERROR, DEBUG)
 * - Auto-scroll to bottom
 * - Timestamp display
 * - Syntax highlighting for JSON data
 * - Step filtering
 */

import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Filter, Trash2, CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react';
import { StepLogPayload } from '../../services/api/websocket';

export interface LogEntry {
  id: string;
  stepId: string;
  stepName?: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  timestamp: string;
}

interface WorkflowLogsProps {
  logs: LogEntry[];
  onClear?: () => void;
  autoScroll?: boolean;
}

export const WorkflowLogs: React.FC<WorkflowLogsProps> = ({
  logs,
  onClear,
  autoScroll = true,
}) => {
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [stepFilter, setStepFilter] = useState<string>('all');
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  // Get unique steps for filtering
  const uniqueSteps = Array.from(new Set(logs.map(l => l.stepId)));

  // Filter logs
  const filteredLogs = logs.filter(log => {
    const levelMatch = levelFilter === 'all' || log.level === levelFilter;
    const stepMatch = stepFilter === 'all' || log.stepId === stepFilter;
    return levelMatch && stepMatch;
  });

  // Get level color and icon
  const getLevelStyles = (level: string) => {
    switch (level) {
      case 'error':
        return {
          color: 'text-red-400',
          bg: 'bg-red-900/20',
          icon: <XCircle size={14} className="text-red-400" />,
        };
      case 'warn':
        return {
          color: 'text-yellow-400',
          bg: 'bg-yellow-900/20',
          icon: <AlertCircle size={14} className="text-yellow-400" />,
        };
      case 'info':
        return {
          color: 'text-blue-400',
          bg: 'bg-blue-900/20',
          icon: <Info size={14} className="text-blue-400" />,
        };
      case 'debug':
        return {
          color: 'text-slate-400',
          bg: 'bg-slate-800/20',
          icon: <CheckCircle size={14} className="text-slate-400" />,
        };
      default:
        return {
          color: 'text-slate-300',
          bg: 'bg-slate-800/20',
          icon: <Info size={14} className="text-slate-300" />,
        };
    }
  };

  // Format timestamp
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3,
    });
  };

  // Detect JSON in message and format it
  const formatMessage = (message: string) => {
    try {
      // Try to detect JSON objects in the message
      const jsonMatch = message.match(/\{.*\}|\[.*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        const formatted = JSON.stringify(parsed, null, 2);
        return message.replace(jsonMatch[0], `\n${formatted}`);
      }
    } catch {
      // Not JSON, return as-is
    }
    return message;
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 text-white">
      {/* Toolbar */}
      <div className="flex items-center space-x-3 px-4 py-3 border-b border-slate-700 bg-slate-800/50">
        <Terminal size={16} className="text-slate-400" />
        <span className="text-sm font-medium text-slate-300">Execution Logs</span>

        <div className="flex-1" />

        {/* Level Filter */}
        <div className="flex items-center space-x-2">
          <Filter size={14} className="text-slate-500" />
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-slate-300 focus:outline-none focus:border-slate-600"
          >
            <option value="all">All Levels</option>
            <option value="debug">DEBUG</option>
            <option value="info">INFO</option>
            <option value="warn">WARN</option>
            <option value="error">ERROR</option>
          </select>
        </div>

        {/* Step Filter */}
        {uniqueSteps.length > 1 && (
          <select
            value={stepFilter}
            onChange={(e) => setStepFilter(e.target.value)}
            className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-slate-300 focus:outline-none focus:border-slate-600"
          >
            <option value="all">All Steps</option>
            {uniqueSteps.map(stepId => (
              <option key={stepId} value={stepId}>
                {logs.find(l => l.stepId === stepId)?.stepName || stepId}
              </option>
            ))}
          </select>
        )}

        {/* Clear Button */}
        {onClear && (
          <button
            onClick={onClear}
            className="flex items-center space-x-1 px-2 py-1 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded transition-colors"
          >
            <Trash2 size={12} />
            <span>Clear</span>
          </button>
        )}

        {/* Log Count */}
        <div className="text-xs text-slate-500">
          {filteredLogs.length} / {logs.length}
        </div>
      </div>

      {/* Log Content */}
      <div className="flex-1 overflow-y-auto p-4 font-mono text-xs leading-relaxed">
        {filteredLogs.length === 0 ? (
          <div className="flex items-center justify-center h-full text-slate-500">
            <div className="text-center">
              <Terminal size={48} className="mx-auto mb-2 opacity-50" />
              <p>No logs to display</p>
              {levelFilter !== 'all' && <p className="text-xs mt-1">Try changing the filter</p>}
            </div>
          </div>
        ) : (
          filteredLogs.map((log) => {
            const styles = getLevelStyles(log.level);
            return (
              <div
                key={log.id}
                className={`mb-2 p-2 rounded ${styles.bg} hover:bg-slate-800/40 transition-colors`}
              >
                <div className="flex items-start space-x-2">
                  {/* Timestamp */}
                  <span className="text-slate-500 shrink-0">
                    [{formatTime(log.timestamp)}]
                  </span>

                  {/* Level Icon */}
                  <div className="shrink-0 mt-0.5">{styles.icon}</div>

                  {/* Level Text */}
                  <span className={`${styles.color} font-bold uppercase w-12 shrink-0`}>
                    {log.level}
                  </span>

                  {/* Step Name */}
                  {log.stepName && (
                    <span className="text-indigo-400 shrink-0">
                      [{log.stepName}]
                    </span>
                  )}

                  {/* Message */}
                  <span className="text-slate-300 flex-1 whitespace-pre-wrap break-words">
                    {formatMessage(log.message)}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={logsEndRef} />
      </div>
    </div>
  );
};
