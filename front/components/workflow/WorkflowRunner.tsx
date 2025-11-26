/**
 * WorkflowRunner - 工作流执行器组件
 *
 * Features:
 * - Real API workflow execution
 * - WebSocket real-time log streaming
 * - Step status tracking
 * - Variable change monitoring
 * - Error handling and retry
 */

import React, { useState, useEffect, useRef } from 'react';
import { Play, Square, RefreshCw, Loader2, CheckCircle, XCircle, Clock } from 'lucide-react';
import { workflowApi } from '../../services/api/workflowApi';
import {
  WorkflowStreamClient,
  StepStartPayload,
  StepCompletePayload,
  StepLogPayload,
  VariableChangePayload,
} from '../../services/api/websocket';
import { WorkflowLogs, LogEntry } from './WorkflowLogs';

interface WorkflowRunnerProps {
  workflowId: string;
  workflowName: string;
  variables?: Record<string, unknown>;
  onComplete?: (runId: string, status: 'success' | 'failed') => void;
  onCancel?: () => void;
}

interface StepStatus {
  stepId: string;
  stepName: string;
  status: 'pending' | 'running' | 'success' | 'failed';
  duration?: number;
}

export const WorkflowRunner: React.FC<WorkflowRunnerProps> = ({
  workflowId,
  workflowName,
  variables = {},
  onComplete,
  onCancel,
}) => {
  const [runId, setRunId] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionStatus, setExecutionStatus] = useState<'idle' | 'running' | 'success' | 'failed'>('idle');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [steps, setSteps] = useState<Map<string, StepStatus>>(new Map());
  const [wsConnected, setWsConnected] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [endTime, setEndTime] = useState<number | null>(null);

  const wsClient = useRef<WorkflowStreamClient | null>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
      // Cleanup WebSocket on unmount
      if (wsClient.current) {
        wsClient.current.disconnect();
      }
    };
  }, []);

  // Add log entry
  const addLog = (stepId: string, level: StepLogPayload['level'], message: string, stepName?: string) => {
    if (!isMounted.current) return;
    const entry: LogEntry = {
      id: `${Date.now()}-${Math.random()}`,
      stepId,
      stepName,
      level,
      message,
      timestamp: new Date().toISOString(),
    };
    setLogs(prev => [...prev, entry]);
  };

  // Update step status
  const updateStepStatus = (stepId: string, stepName: string, status: StepStatus['status'], duration?: number) => {
    if (!isMounted.current) return;
    setSteps(prev => {
      const newMap = new Map(prev);
      newMap.set(stepId, { stepId, stepName, status, duration });
      return newMap;
    });
  };

  // Execute workflow
  const executeWorkflow = async () => {
    try {
      setIsExecuting(true);
      setExecutionStatus('running');
      setStartTime(Date.now());
      setLogs([]);
      setSteps(new Map());

      addLog('system', 'info', `Starting workflow: ${workflowName}`);
      addLog('system', 'info', `Variables: ${JSON.stringify(variables)}`);

      // Call API to execute workflow
      const response = await workflowApi.execute(workflowId, variables);
      const executionRunId = response.runId;

      if (!executionRunId) {
        throw new Error('No runId returned from API');
      }

      setRunId(executionRunId);
      addLog('system', 'info', `Execution started with runId: ${executionRunId}`);

      // Connect WebSocket for real-time updates
      connectWebSocket(executionRunId);

    } catch (error) {
      console.error('Failed to execute workflow:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      addLog('system', 'error', `Failed to start workflow: ${errorMsg}`);
      setExecutionStatus('failed');
      setIsExecuting(false);
      setEndTime(Date.now());
    }
  };

  // Connect to WebSocket
  const connectWebSocket = (executionRunId: string) => {
    wsClient.current = new WorkflowStreamClient();

    wsClient.current.connect(executionRunId, {
      onOpen: () => {
        if (!isMounted.current) return;
        setWsConnected(true);
        addLog('system', 'info', 'WebSocket connected - streaming real-time logs');
      },

      onStepStart: (payload: StepStartPayload) => {
        if (!isMounted.current) return;
        addLog(payload.stepId, 'info', `Step started: ${payload.stepName}`, payload.stepName);
        updateStepStatus(payload.stepId, payload.stepName, 'running');
      },

      onStepComplete: (payload: StepCompletePayload) => {
        if (!isMounted.current) return;
        const level = payload.status === 'success' ? 'info' : 'error';
        const statusText = payload.status === 'success' ? 'completed' : 'failed';
        addLog(
          payload.stepId,
          level,
          `Step ${statusText}: ${payload.stepName} (${payload.duration}ms)`,
          payload.stepName
        );
        updateStepStatus(payload.stepId, payload.stepName, payload.status, payload.duration);
      },

      onStepLog: (payload: StepLogPayload) => {
        if (!isMounted.current) return;
        // Find step name from steps map
        const stepStatus = Array.from(steps.values()).find(s => s.stepId === payload.stepId);
        addLog(payload.stepId, payload.level, payload.message, stepStatus?.stepName);
      },

      onVariableChange: (payload: VariableChangePayload) => {
        if (!isMounted.current) return;
        const stepStatus = Array.from(steps.values()).find(s => s.stepId === payload.stepId);
        addLog(
          payload.stepId,
          'debug',
          `Variable ${payload.changeType}: ${payload.varName} = ${JSON.stringify(payload.newValue)}`,
          stepStatus?.stepName
        );
      },

      onClose: () => {
        if (!isMounted.current) return;
        setWsConnected(false);
        addLog('system', 'info', 'WebSocket disconnected');
        handleExecutionComplete();
      },

      onError: (error) => {
        if (!isMounted.current) return;
        addLog('system', 'error', `WebSocket error: ${error}`);
        setWsConnected(false);
      },
    });
  };

  // Handle execution complete
  const handleExecutionComplete = async () => {
    if (!runId || !isMounted.current) return;

    try {
      // Fetch final execution result
      const result = await workflowApi.getRun(runId);
      const finalStatus = result.status === 'completed' ? 'success' : 'failed';

      setExecutionStatus(finalStatus);
      setEndTime(Date.now());
      setIsExecuting(false);

      addLog('system', 'info', `Workflow ${finalStatus}. Status: ${result.status}`);

      if (onComplete) {
        onComplete(runId, finalStatus);
      }
    } catch (error) {
      console.error('Failed to fetch execution result:', error);
      setExecutionStatus('failed');
      setEndTime(Date.now());
      setIsExecuting(false);
    }
  };

  // Stop execution (disconnect WebSocket)
  const stopExecution = () => {
    if (wsClient.current) {
      wsClient.current.disconnect();
    }
    setIsExecuting(false);
    setEndTime(Date.now());
    addLog('system', 'warn', 'Execution stopped by user');
  };

  // Clear logs
  const clearLogs = () => {
    setLogs([]);
  };

  // Calculate execution time
  const executionTime = startTime && endTime ? endTime - startTime : startTime ? Date.now() - startTime : 0;
  const formattedTime = (executionTime / 1000).toFixed(2);

  // Count step statuses
  const stepStatusCounts = {
    total: steps.size,
    success: Array.from(steps.values()).filter(s => s.status === 'success').length,
    failed: Array.from(steps.values()).filter(s => s.status === 'failed').length,
    running: Array.from(steps.values()).filter(s => s.status === 'running').length,
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-200 bg-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900">{workflowName}</h3>
            <div className="flex items-center space-x-4 mt-2 text-xs text-slate-500">
              {runId && <span className="font-mono">Run ID: {runId}</span>}
              {wsConnected && (
                <span className="flex items-center text-green-600">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></span>
                  Live
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Execution Controls */}
            {executionStatus === 'idle' || executionStatus === 'success' || executionStatus === 'failed' ? (
              <button
                onClick={executeWorkflow}
                disabled={isExecuting}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Play size={16} />
                <span>{executionStatus === 'idle' ? 'Start' : 'Retry'}</span>
              </button>
            ) : (
              <button
                onClick={stopExecution}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-all"
              >
                <Square size={16} />
                <span>Stop</span>
              </button>
            )}

            {onCancel && (
              <button
                onClick={onCancel}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors"
              >
                Close
              </button>
            )}
          </div>
        </div>

        {/* Status Bar */}
        <div className="mt-4 flex items-center space-x-6 text-sm">
          {/* Execution Status */}
          <div className="flex items-center space-x-2">
            {executionStatus === 'running' && (
              <>
                <Loader2 size={16} className="text-blue-600 animate-spin" />
                <span className="font-medium text-blue-600">Running</span>
              </>
            )}
            {executionStatus === 'success' && (
              <>
                <CheckCircle size={16} className="text-green-600" />
                <span className="font-medium text-green-600">Success</span>
              </>
            )}
            {executionStatus === 'failed' && (
              <>
                <XCircle size={16} className="text-red-600" />
                <span className="font-medium text-red-600">Failed</span>
              </>
            )}
            {executionStatus === 'idle' && (
              <>
                <Clock size={16} className="text-slate-400" />
                <span className="font-medium text-slate-400">Ready</span>
              </>
            )}
          </div>

          {/* Step Progress */}
          {stepStatusCounts.total > 0 && (
            <div className="flex items-center space-x-2 text-slate-600">
              <span>Steps:</span>
              <span className="text-green-600 font-bold">{stepStatusCounts.success}</span>
              <span>/</span>
              <span className="font-bold">{stepStatusCounts.total}</span>
              {stepStatusCounts.failed > 0 && (
                <span className="text-red-600 font-bold">({stepStatusCounts.failed} failed)</span>
              )}
            </div>
          )}

          {/* Execution Time */}
          {startTime && (
            <div className="text-slate-600">
              <span>Time: </span>
              <span className="font-mono font-bold">{formattedTime}s</span>
            </div>
          )}
        </div>
      </div>

      {/* Logs */}
      <div className="flex-1 min-h-0">
        <WorkflowLogs logs={logs} onClear={logs.length > 0 ? clearLogs : undefined} />
      </div>
    </div>
  );
};
