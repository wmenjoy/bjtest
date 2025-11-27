import React, { useState } from 'react';
import { TestCase, TestRun } from '../../types';
import {
    CheckCircle2, XCircle, Clock, Play, Terminal,
    Activity, ChevronDown, ChevronUp, AlertCircle
} from 'lucide-react';

interface ExecutionPanelProps {
    testCase: TestCase | null;
    latestRun?: TestRun | null;
    isRunning?: boolean;
    realTimeLogs?: string[];
}

export const ExecutionPanel: React.FC<ExecutionPanelProps> = ({
    testCase,
    latestRun,
    isRunning = false,
    realTimeLogs = []
}) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const [activeTab, setActiveTab] = useState<'logs' | 'assertions' | 'metrics'>('logs');

    if (!testCase && !isRunning) {
        return null;
    }

    const getStatusIcon = (status?: string) => {
        switch (status) {
            case 'PASSED':
                return <CheckCircle2 size={16} className="text-green-600" />;
            case 'FAILED':
                return <XCircle size={16} className="text-red-600" />;
            case 'RUNNING':
                return <Activity size={16} className="text-blue-600 animate-pulse" />;
            default:
                return <Clock size={16} className="text-slate-400" />;
        }
    };

    const getStatusColor = (status?: string) => {
        switch (status) {
            case 'PASSED':
                return 'bg-green-50 border-green-200 text-green-700';
            case 'FAILED':
                return 'bg-red-50 border-red-200 text-red-700';
            case 'RUNNING':
                return 'bg-blue-50 border-blue-200 text-blue-700';
            default:
                return 'bg-slate-50 border-slate-200 text-slate-600';
        }
    };

    return (
        <div className={`border-t border-slate-200 bg-white transition-all duration-300 ${isExpanded ? 'h-80' : 'h-12'}`}>
            {/* Header */}
            <div
                className="flex items-center justify-between px-6 py-3 bg-slate-50 border-b border-slate-200 cursor-pointer hover:bg-slate-100"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                        {isRunning ? (
                            <>
                                <Activity size={18} className="text-blue-600 animate-pulse" />
                                <h3 className="font-semibold text-slate-800">Execution in Progress</h3>
                            </>
                        ) : latestRun ? (
                            <>
                                {getStatusIcon(latestRun.status)}
                                <h3 className="font-semibold text-slate-800">Execution Results</h3>
                            </>
                        ) : (
                            <>
                                <Terminal size={18} className="text-slate-400" />
                                <h3 className="font-semibold text-slate-800">Execution Panel</h3>
                            </>
                        )}
                    </div>

                    {latestRun && !isRunning && (
                        <span className={`text-xs px-3 py-1 rounded-full border font-medium ${getStatusColor(latestRun.status)}`}>
                            {latestRun.status}
                        </span>
                    )}
                </div>

                <div className="flex items-center space-x-4">
                    {latestRun && !isRunning && (
                        <div className="flex items-center space-x-6 text-xs text-slate-600">
                            <div className="flex items-center space-x-1">
                                <Clock size={14} />
                                <span>{latestRun.duration ? `${latestRun.duration}ms` : 'N/A'}</span>
                            </div>
                            {latestRun.startedAt && (
                                <span className="text-slate-400">
                                    {new Date(latestRun.startedAt).toLocaleString()}
                                </span>
                            )}
                        </div>
                    )}
                    <button className="p-1 hover:bg-slate-200 rounded">
                        {isExpanded ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
                    </button>
                </div>
            </div>

            {/* Content */}
            {isExpanded && (
                <div className="flex flex-col h-[calc(100%-3rem)]">
                    {/* Tabs */}
                    <div className="flex border-b border-slate-200 bg-white px-6">
                        <button
                            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                                activeTab === 'logs'
                                    ? 'border-blue-600 text-blue-600'
                                    : 'border-transparent text-slate-600 hover:text-slate-800'
                            }`}
                            onClick={() => setActiveTab('logs')}
                        >
                            <div className="flex items-center space-x-2">
                                <Terminal size={14} />
                                <span>Logs</span>
                            </div>
                        </button>
                        <button
                            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                                activeTab === 'assertions'
                                    ? 'border-blue-600 text-blue-600'
                                    : 'border-transparent text-slate-600 hover:text-slate-800'
                            }`}
                            onClick={() => setActiveTab('assertions')}
                        >
                            <div className="flex items-center space-x-2">
                                <CheckCircle2 size={14} />
                                <span>Assertions</span>
                            </div>
                        </button>
                        <button
                            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                                activeTab === 'metrics'
                                    ? 'border-blue-600 text-blue-600'
                                    : 'border-transparent text-slate-600 hover:text-slate-800'
                            }`}
                            onClick={() => setActiveTab('metrics')}
                        >
                            <div className="flex items-center space-x-2">
                                <Activity size={14} />
                                <span>Metrics</span>
                            </div>
                        </button>
                    </div>

                    {/* Tab Content */}
                    <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
                        {activeTab === 'logs' && (
                            <div className="space-y-2">
                                {isRunning && realTimeLogs.length > 0 ? (
                                    realTimeLogs.map((log, idx) => (
                                        <div key={idx} className="font-mono text-xs bg-slate-900 text-green-400 px-4 py-2 rounded">
                                            {log}
                                        </div>
                                    ))
                                ) : latestRun?.logs && latestRun.logs.length > 0 ? (
                                    latestRun.logs.map((log, idx) => (
                                        <div key={idx} className="font-mono text-xs bg-slate-900 text-green-400 px-4 py-2 rounded">
                                            {log}
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center text-slate-400 py-8">
                                        <Terminal size={32} className="mx-auto mb-2 opacity-50" />
                                        <p className="text-sm">No logs available. Run the test to see execution logs.</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'assertions' && (
                            <div className="space-y-3">
                                {latestRun?.assertionResults && latestRun.assertionResults.length > 0 ? (
                                    latestRun.assertionResults.map((assertion, idx) => (
                                        <div
                                            key={idx}
                                            className={`p-4 rounded-lg border-l-4 ${
                                                assertion.passed
                                                    ? 'bg-green-50 border-green-500'
                                                    : 'bg-red-50 border-red-500'
                                            }`}
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-start space-x-3">
                                                    {assertion.passed ? (
                                                        <CheckCircle2 size={18} className="text-green-600 mt-0.5" />
                                                    ) : (
                                                        <XCircle size={18} className="text-red-600 mt-0.5" />
                                                    )}
                                                    <div>
                                                        <h4 className="font-medium text-sm text-slate-800">
                                                            {assertion.name || `Assertion ${idx + 1}`}
                                                        </h4>
                                                        {assertion.message && (
                                                            <p className="text-xs text-slate-600 mt-1">{assertion.message}</p>
                                                        )}
                                                        {!assertion.passed && assertion.expected && assertion.actual && (
                                                            <div className="mt-2 text-xs space-y-1">
                                                                <div className="flex space-x-2">
                                                                    <span className="text-slate-500 font-medium">Expected:</span>
                                                                    <span className="font-mono text-green-700">{JSON.stringify(assertion.expected)}</span>
                                                                </div>
                                                                <div className="flex space-x-2">
                                                                    <span className="text-slate-500 font-medium">Actual:</span>
                                                                    <span className="font-mono text-red-700">{JSON.stringify(assertion.actual)}</span>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center text-slate-400 py-8">
                                        <AlertCircle size={32} className="mx-auto mb-2 opacity-50" />
                                        <p className="text-sm">No assertion results available.</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'metrics' && (
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white rounded-lg border border-slate-200 p-4">
                                    <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">Duration</h4>
                                    <p className="text-2xl font-bold text-slate-800">
                                        {latestRun?.duration ? `${latestRun.duration}ms` : 'N/A'}
                                    </p>
                                </div>
                                <div className="bg-white rounded-lg border border-slate-200 p-4">
                                    <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">Steps</h4>
                                    <p className="text-2xl font-bold text-slate-800">
                                        {testCase?.steps?.length || 0}
                                    </p>
                                </div>
                                <div className="bg-white rounded-lg border border-slate-200 p-4">
                                    <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">Assertions Passed</h4>
                                    <p className="text-2xl font-bold text-green-600">
                                        {latestRun?.assertionResults?.filter(a => a.passed).length || 0}
                                    </p>
                                </div>
                                <div className="bg-white rounded-lg border border-slate-200 p-4">
                                    <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">Assertions Failed</h4>
                                    <p className="text-2xl font-bold text-red-600">
                                        {latestRun?.assertionResults?.filter(a => !a.passed).length || 0}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
