/**
 * UnifiedWorkflowView Component
 *
 * Unified view for both TestCase workflows and standalone Workflows.
 * Provides seamless switching between sources and unified execution history.
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  TestCase,
  Workflow,
  Environment,
  ExecutionStatus,
  StepExecution
} from '../../types';
import {
  WorkflowBridge,
  ExecutionStateManager,
  UnifiedExecutionState,
  isTestCase,
  isWorkflow,
  getSourceDisplayName
} from '../../services/workflowBridge';
import {
  Play,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronRight,
  ChevronDown,
  FileText,
  GitMerge,
  Calendar,
  TrendingUp,
  Activity,
  BarChart3
} from 'lucide-react';

interface UnifiedWorkflowViewProps {
  /** Test cases to display */
  testCases?: TestCase[];

  /** Workflows to display */
  workflows?: Workflow[];

  /** Active environment for execution */
  activeEnvironment?: Environment;

  /** Currently selected source */
  selectedSource?: TestCase | Workflow;

  /** Callback when source is selected */
  onSourceSelect?: (source: TestCase | Workflow) => void;

  /** Callback when execution is triggered */
  onExecute?: (source: TestCase | Workflow, environment?: Environment) => void;
}

export const UnifiedWorkflowView: React.FC<UnifiedWorkflowViewProps> = ({
  testCases = [],
  workflows = [],
  activeEnvironment,
  selectedSource,
  onSourceSelect,
  onExecute,
}) => {
  const [viewMode, setViewMode] = useState<'all' | 'test-cases' | 'workflows'>('all');
  const [expandedHistory, setExpandedHistory] = useState<Set<string>>(new Set());
  const [selectedExecution, setSelectedExecution] = useState<UnifiedExecutionState | null>(null);

  // Combine sources based on view mode
  const combinedSources = useMemo(() => {
    const sources: Array<{ source: TestCase | Workflow; type: 'test-case' | 'workflow' }> = [];

    if (viewMode === 'all' || viewMode === 'test-cases') {
      testCases.forEach(tc => sources.push({ source: tc, type: 'test-case' }));
    }

    if (viewMode === 'all' || viewMode === 'workflows') {
      workflows.forEach(wf => sources.push({ source: wf, type: 'workflow' }));
    }

    return sources;
  }, [testCases, workflows, viewMode]);

  // Get execution history for selected source
  const executionHistory = useMemo(() => {
    if (!selectedSource) return [];
    return ExecutionStateManager.getExecutionHistory(selectedSource.id);
  }, [selectedSource]);

  // Get execution statistics for selected source
  const executionStats = useMemo(() => {
    if (!selectedSource) return null;
    return ExecutionStateManager.getExecutionStats(selectedSource.id);
  }, [selectedSource]);

  const handleExecute = (source: TestCase | Workflow) => {
    if (onExecute) {
      onExecute(source, activeEnvironment);
    }
  };

  const toggleHistoryExpansion = (sourceId: string) => {
    setExpandedHistory(prev => {
      const next = new Set(prev);
      if (next.has(sourceId)) {
        next.delete(sourceId);
      } else {
        next.add(sourceId);
      }
      return next;
    });
  };

  const getStatusIcon = (status: ExecutionStatus) => {
    switch (status) {
      case ExecutionStatus.PASSED:
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case ExecutionStatus.FAILED:
        return <XCircle className="w-4 h-4 text-red-500" />;
      case ExecutionStatus.RUNNING:
        return <Activity className="w-4 h-4 text-blue-500 animate-pulse" />;
      case ExecutionStatus.PENDING:
        return <Clock className="w-4 h-4 text-gray-400" />;
      case ExecutionStatus.BLOCKED:
        return <AlertCircle className="w-4 h-4 text-orange-500" />;
      case ExecutionStatus.SKIPPED:
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: ExecutionStatus) => {
    switch (status) {
      case ExecutionStatus.PASSED:
        return 'bg-green-50 text-green-700 border-green-200';
      case ExecutionStatus.FAILED:
        return 'bg-red-50 text-red-700 border-red-200';
      case ExecutionStatus.RUNNING:
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case ExecutionStatus.PENDING:
        return 'bg-gray-50 text-gray-700 border-gray-200';
      case ExecutionStatus.BLOCKED:
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case ExecutionStatus.SKIPPED:
        return 'bg-gray-50 text-gray-600 border-gray-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return 'N/A';
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
    return `${(ms / 60000).toFixed(2)}m`;
  };

  return (
    <div className="flex h-full bg-gray-50">
      {/* Left Sidebar - Source List */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* View Mode Selector */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('all')}
              className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                viewMode === 'all'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setViewMode('test-cases')}
              className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                viewMode === 'test-cases'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              <FileText className="w-4 h-4 inline mr-1" />
              Tests
            </button>
            <button
              onClick={() => setViewMode('workflows')}
              className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                viewMode === 'workflows'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              <GitMerge className="w-4 h-4 inline mr-1" />
              Flows
            </button>
          </div>
        </div>

        {/* Source List */}
        <div className="flex-1 overflow-y-auto">
          {combinedSources.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <GitMerge className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No sources available</p>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {combinedSources.map(({ source, type }) => {
                const stats = ExecutionStateManager.getExecutionStats(source.id);
                const isSelected = selectedSource?.id === source.id;

                return (
                  <div
                    key={source.id}
                    onClick={() => onSourceSelect?.(source)}
                    className={`p-3 rounded-lg cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-blue-50 border border-blue-200 shadow-sm'
                        : 'hover:bg-gray-50 border border-transparent'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {type === 'test-case' ? (
                            <FileText className="w-4 h-4 text-blue-500 flex-shrink-0" />
                          ) : (
                            <GitMerge className="w-4 h-4 text-purple-500 flex-shrink-0" />
                          )}
                          <h3 className="text-sm font-medium text-gray-900 truncate">
                            {getSourceDisplayName(source)}
                          </h3>
                        </div>
                        {stats.totalRuns > 0 && (
                          <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <TrendingUp className="w-3 h-3" />
                              {stats.successRate.toFixed(0)}%
                            </span>
                            <span className="flex items-center gap-1">
                              <Activity className="w-3 h-3" />
                              {stats.totalRuns} runs
                            </span>
                          </div>
                        )}
                      </div>
                      {stats.lastStatus && (
                        <div className="ml-2 flex-shrink-0">
                          {getStatusIcon(stats.lastStatus)}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {selectedSource ? (
          <>
            {/* Header */}
            <div className="bg-white border-b border-gray-200 p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {isTestCase(selectedSource) ? (
                      <FileText className="w-6 h-6 text-blue-500" />
                    ) : (
                      <GitMerge className="w-6 h-6 text-purple-500" />
                    )}
                    <h1 className="text-2xl font-bold text-gray-900">
                      {getSourceDisplayName(selectedSource)}
                    </h1>
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
                      {isTestCase(selectedSource) ? 'Test Case' : 'Workflow'}
                    </span>
                  </div>
                  {selectedSource.description && (
                    <p className="text-gray-600 text-sm">{selectedSource.description}</p>
                  )}
                </div>
                <button
                  onClick={() => handleExecute(selectedSource)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Play className="w-4 h-4" />
                  Execute
                </button>
              </div>

              {/* Statistics Cards */}
              {executionStats && executionStats.totalRuns > 0 && (
                <div className="grid grid-cols-4 gap-4 mt-6">
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-500">Total Runs</span>
                      <BarChart3 className="w-4 h-4 text-gray-400" />
                    </div>
                    <p className="mt-2 text-2xl font-bold text-gray-900">{executionStats.totalRuns}</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-green-600">Success Rate</span>
                      <TrendingUp className="w-4 h-4 text-green-500" />
                    </div>
                    <p className="mt-2 text-2xl font-bold text-green-700">
                      {executionStats.successRate.toFixed(0)}%
                    </p>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-blue-600">Avg Duration</span>
                      <Clock className="w-4 h-4 text-blue-500" />
                    </div>
                    <p className="mt-2 text-2xl font-bold text-blue-700">
                      {formatDuration(executionStats.avgDuration)}
                    </p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-purple-600">Last Run</span>
                      <Calendar className="w-4 h-4 text-purple-500" />
                    </div>
                    <p className="mt-2 text-xs font-medium text-purple-700">
                      {executionStats.lastRunAt
                        ? new Date(executionStats.lastRunAt).toLocaleString()
                        : 'Never'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Execution History */}
            <div className="flex-1 overflow-y-auto p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Execution History</h2>

              {executionHistory.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No execution history yet</p>
                  <p className="text-xs mt-1">Click Execute to run this {isTestCase(selectedSource) ? 'test case' : 'workflow'}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {executionHistory.map(execution => (
                    <div
                      key={execution.id}
                      className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                    >
                      {/* Execution Summary */}
                      <div
                        className="p-4 cursor-pointer"
                        onClick={() => toggleHistoryExpansion(execution.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1">
                            {getStatusIcon(execution.status)}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-900">
                                  {new Date(execution.startedAt).toLocaleString()}
                                </span>
                                <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${getStatusColor(execution.status)}`}>
                                  {execution.status}
                                </span>
                              </div>
                              <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                                {execution.duration && (
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {formatDuration(execution.duration)}
                                  </span>
                                )}
                                {execution.environment && (
                                  <span>Env: {execution.environment}</span>
                                )}
                                <span>{execution.steps.length} steps</span>
                              </div>
                            </div>
                          </div>
                          <div className="ml-4">
                            {expandedHistory.has(execution.id) ? (
                              <ChevronDown className="w-5 h-5 text-gray-400" />
                            ) : (
                              <ChevronRight className="w-5 h-5 text-gray-400" />
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Expanded Details */}
                      {expandedHistory.has(execution.id) && (
                        <div className="border-t border-gray-200 bg-gray-50 p-4">
                          {/* Steps */}
                          {execution.steps.length > 0 && (
                            <div className="mb-4">
                              <h4 className="text-xs font-semibold text-gray-700 mb-2">Steps</h4>
                              <div className="space-y-2">
                                {execution.steps.map((step, index) => (
                                  <div
                                    key={step.stepId}
                                    className="flex items-center gap-2 text-sm bg-white p-2 rounded border border-gray-200"
                                  >
                                    <span className="text-gray-400 text-xs">#{index + 1}</span>
                                    {getStatusIcon(step.status as ExecutionStatus)}
                                    <span className="flex-1 text-gray-700">{step.stepName}</span>
                                    {step.duration && (
                                      <span className="text-xs text-gray-500">
                                        {formatDuration(step.duration)}
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Logs */}
                          {execution.logs.length > 0 && (
                            <div>
                              <h4 className="text-xs font-semibold text-gray-700 mb-2">Logs</h4>
                              <div className="bg-gray-900 text-green-400 p-3 rounded text-xs font-mono max-h-48 overflow-y-auto">
                                {execution.logs.map((log, index) => (
                                  <div key={index}>{log}</div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Error */}
                          {execution.error && (
                            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
                              <p className="text-xs font-semibold text-red-700 mb-1">Error</p>
                              <p className="text-xs text-red-600">{execution.error}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <GitMerge className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Select a source to view details</p>
              <p className="text-sm mt-1">Choose a test case or workflow from the left panel</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
