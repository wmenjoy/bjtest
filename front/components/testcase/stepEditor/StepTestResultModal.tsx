import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Globe,
  Terminal,
  Activity,
  FileText,
  ChevronDown,
  ChevronUp,
  Copy,
  Check
} from 'lucide-react';
import { StepExecutionResult } from '../../../services/stepExecutor';

interface StepTestResultModalProps {
  result: StepExecutionResult;
  stepName: string;
  onClose: () => void;
}

export const StepTestResultModal: React.FC<StepTestResultModalProps> = ({
  result,
  stepName,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'request' | 'response' | 'logs' | 'assertions'>('overview');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    headers: false,
    body: true,
  });
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const getStatusIcon = () => {
    switch (result.status) {
      case 'passed':
        return <CheckCircle2 size={24} className="text-green-600" />;
      case 'failed':
        return <XCircle size={24} className="text-red-600" />;
      case 'error':
        return <AlertCircle size={24} className="text-orange-600" />;
      default:
        return <Clock size={24} className="text-slate-400" />;
    }
  };

  const getStatusColor = () => {
    switch (result.status) {
      case 'passed':
        return 'bg-green-50 border-green-200 text-green-700';
      case 'failed':
        return 'bg-red-50 border-red-200 text-red-700';
      case 'error':
        return 'bg-orange-50 border-orange-200 text-orange-700';
      default:
        return 'bg-slate-50 border-slate-200 text-slate-600';
    }
  };

  const formatJson = (obj: any) => {
    try {
      return JSON.stringify(obj, null, 2);
    } catch {
      return String(obj);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center space-x-3">
            {getStatusIcon()}
            <div>
              <h2 className="text-xl font-bold text-slate-800">Step Test Result</h2>
              <p className="text-sm text-slate-600 mt-0.5">{stepName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            title="Close"
          >
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        {/* Status Badge */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className={`px-4 py-1.5 rounded-full text-sm font-semibold uppercase border ${getStatusColor()}`}>
                {result.status}
              </span>
              <div className="flex items-center space-x-2 text-sm text-slate-600">
                <Clock size={14} />
                <span>{result.duration}ms</span>
              </div>
            </div>
            {result.httpResponse && (
              <div className="flex items-center space-x-2">
                <span className={`text-sm font-mono font-semibold ${
                  result.httpResponse.statusCode >= 200 && result.httpResponse.statusCode < 300
                    ? 'text-green-600'
                    : result.httpResponse.statusCode >= 400
                    ? 'text-red-600'
                    : 'text-orange-600'
                }`}>
                  HTTP {result.httpResponse.statusCode}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 bg-white px-6">
          <button
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'overview'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-800'
            }`}
            onClick={() => setActiveTab('overview')}
          >
            <div className="flex items-center space-x-2">
              <Activity size={14} />
              <span>Overview</span>
            </div>
          </button>
          {result.httpRequest && (
            <button
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'request'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-600 hover:text-slate-800'
              }`}
              onClick={() => setActiveTab('request')}
            >
              <div className="flex items-center space-x-2">
                <Globe size={14} />
                <span>Request</span>
              </div>
            </button>
          )}
          {result.httpResponse && (
            <button
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'response'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-600 hover:text-slate-800'
              }`}
              onClick={() => setActiveTab('response')}
            >
              <div className="flex items-center space-x-2">
                <FileText size={14} />
                <span>Response</span>
              </div>
            </button>
          )}
          {result.assertionResults && result.assertionResults.length > 0 && (
            <button
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'assertions'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-600 hover:text-slate-800'
              }`}
              onClick={() => setActiveTab('assertions')}
            >
              <div className="flex items-center space-x-2">
                <CheckCircle2 size={14} />
                <span>Assertions</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  result.assertionResults.every(a => a.passed)
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }`}>
                  {result.assertionResults.filter(a => a.passed).length}/{result.assertionResults.length}
                </span>
              </div>
            </button>
          )}
          <button
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
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
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
          {activeTab === 'overview' && (
            <div className="space-y-4">
              {/* Error Message */}
              {result.error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <AlertCircle size={20} className="text-red-600 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-red-900 mb-1">Error</h4>
                      <p className="text-sm text-red-700 font-mono">{result.error}</p>
                      {result.errorStack && (
                        <pre className="mt-2 text-xs text-red-600 overflow-x-auto bg-red-100 p-2 rounded">
                          {result.errorStack}
                        </pre>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-lg border border-slate-200 p-4">
                  <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">Duration</h4>
                  <p className="text-2xl font-bold text-slate-800">{result.duration}ms</p>
                </div>
                {result.httpResponse && (
                  <div className="bg-white rounded-lg border border-slate-200 p-4">
                    <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">Status Code</h4>
                    <p className={`text-2xl font-bold ${
                      result.httpResponse.statusCode >= 200 && result.httpResponse.statusCode < 300
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}>
                      {result.httpResponse.statusCode}
                    </p>
                  </div>
                )}
                {result.commandExecution && (
                  <div className="bg-white rounded-lg border border-slate-200 p-4">
                    <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">Exit Code</h4>
                    <p className={`text-2xl font-bold ${
                      result.commandExecution.exitCode === 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {result.commandExecution.exitCode}
                    </p>
                  </div>
                )}
              </div>

              {/* Outputs */}
              {Object.keys(result.outputs).length > 0 && (
                <div className="bg-white rounded-lg border border-slate-200 p-4">
                  <h4 className="text-sm font-semibold text-slate-700 mb-3">Output Variables</h4>
                  <div className="space-y-2">
                    {Object.entries(result.outputs).map(([key, value]) => (
                      <div key={key} className="flex items-start justify-between p-2 bg-slate-50 rounded">
                        <div className="flex-1">
                          <span className="text-xs font-semibold text-slate-600">{key}</span>
                          <pre className="text-xs font-mono text-slate-800 mt-1">{formatJson(value)}</pre>
                        </div>
                        <button
                          onClick={() => copyToClipboard(formatJson(value), `output-${key}`)}
                          className="p-1 hover:bg-slate-200 rounded"
                          title="Copy"
                        >
                          {copiedField === `output-${key}` ? (
                            <Check size={14} className="text-green-600" />
                          ) : (
                            <Copy size={14} className="text-slate-400" />
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Command Output */}
              {result.commandExecution && (
                <>
                  {result.commandExecution.stdout && (
                    <div className="bg-white rounded-lg border border-slate-200 p-4">
                      <h4 className="text-sm font-semibold text-slate-700 mb-3">Standard Output</h4>
                      <pre className="text-xs font-mono text-slate-800 bg-slate-50 p-3 rounded overflow-x-auto">
                        {result.commandExecution.stdout}
                      </pre>
                    </div>
                  )}
                  {result.commandExecution.stderr && (
                    <div className="bg-white rounded-lg border border-slate-200 p-4">
                      <h4 className="text-sm font-semibold text-slate-700 mb-3">Standard Error</h4>
                      <pre className="text-xs font-mono text-red-700 bg-red-50 p-3 rounded overflow-x-auto">
                        {result.commandExecution.stderr}
                      </pre>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {activeTab === 'request' && result.httpRequest && (
            <div className="space-y-4">
              {/* Method & URL */}
              <div className="bg-white rounded-lg border border-slate-200 p-4">
                <div className="flex items-center space-x-3 mb-3">
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 font-bold text-xs rounded">
                    {result.httpRequest.method}
                  </span>
                  <code className="flex-1 text-sm font-mono text-slate-800">{result.httpRequest.url}</code>
                  <button
                    onClick={() => copyToClipboard(result.httpRequest!.url, 'url')}
                    className="p-1.5 hover:bg-slate-100 rounded"
                    title="Copy URL"
                  >
                    {copiedField === 'url' ? (
                      <Check size={16} className="text-green-600" />
                    ) : (
                      <Copy size={16} className="text-slate-400" />
                    )}
                  </button>
                </div>
              </div>

              {/* Headers */}
              <div className="bg-white rounded-lg border border-slate-200">
                <button
                  onClick={() => toggleSection('headers')}
                  className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
                >
                  <h4 className="text-sm font-semibold text-slate-700">Request Headers</h4>
                  {expandedSections.headers ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                {expandedSections.headers && (
                  <div className="px-4 pb-4 space-y-2">
                    {Object.entries(result.httpRequest.headers).map(([key, value]) => (
                      <div key={key} className="flex items-start justify-between p-2 bg-slate-50 rounded">
                        <div className="flex-1">
                          <span className="text-xs font-semibold text-slate-600">{key}:</span>
                          <span className="text-xs text-slate-800 ml-2">{value}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Request Body */}
              {result.httpRequest.body && (
                <div className="bg-white rounded-lg border border-slate-200 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-slate-700">Request Body</h4>
                    <button
                      onClick={() => copyToClipboard(formatJson(result.httpRequest!.body), 'request-body')}
                      className="p-1.5 hover:bg-slate-100 rounded"
                      title="Copy Body"
                    >
                      {copiedField === 'request-body' ? (
                        <Check size={16} className="text-green-600" />
                      ) : (
                        <Copy size={16} className="text-slate-400" />
                      )}
                    </button>
                  </div>
                  <pre className="text-xs font-mono text-slate-800 bg-slate-50 p-3 rounded overflow-x-auto">
                    {formatJson(result.httpRequest.body)}
                  </pre>
                </div>
              )}
            </div>
          )}

          {activeTab === 'response' && result.httpResponse && (
            <div className="space-y-4">
              {/* Response Body */}
              <div className="bg-white rounded-lg border border-slate-200 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-slate-700">Response Body</h4>
                  <button
                    onClick={() => copyToClipboard(formatJson(result.httpResponse!.body), 'response-body')}
                    className="p-1.5 hover:bg-slate-100 rounded"
                    title="Copy Body"
                  >
                    {copiedField === 'response-body' ? (
                      <Check size={16} className="text-green-600" />
                    ) : (
                      <Copy size={16} className="text-slate-400" />
                    )}
                  </button>
                </div>
                <pre className="text-xs font-mono text-slate-800 bg-slate-50 p-3 rounded overflow-x-auto max-h-96">
                  {formatJson(result.httpResponse.body)}
                </pre>
              </div>

              {/* Response Headers */}
              <div className="bg-white rounded-lg border border-slate-200 p-4">
                <h4 className="text-sm font-semibold text-slate-700 mb-3">Response Headers</h4>
                <div className="space-y-2">
                  {Object.entries(result.httpResponse.headers).map(([key, value]) => (
                    <div key={key} className="flex items-start justify-between p-2 bg-slate-50 rounded">
                      <div className="flex-1">
                        <span className="text-xs font-semibold text-slate-600">{key}:</span>
                        <span className="text-xs text-slate-800 ml-2">{value}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'assertions' && result.assertionResults && (
            <div className="space-y-3">
              {result.assertionResults.map((assertion, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-lg border-l-4 ${
                    assertion.passed
                      ? 'bg-green-50 border-green-500'
                      : 'bg-red-50 border-red-500'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    {assertion.passed ? (
                      <CheckCircle2 size={18} className="text-green-600 mt-0.5" />
                    ) : (
                      <XCircle size={18} className="text-red-600 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <h4 className="font-medium text-sm text-slate-800">
                        {assertion.name}
                      </h4>
                      {assertion.message && (
                        <p className="text-xs text-slate-600 mt-1">{assertion.message}</p>
                      )}
                      {!assertion.passed && (
                        <div className="mt-2 text-xs space-y-1">
                          <div className="flex space-x-2">
                            <span className="text-slate-500 font-medium">Expected:</span>
                            <span className="font-mono text-green-700">{formatJson(assertion.expected)}</span>
                          </div>
                          <div className="flex space-x-2">
                            <span className="text-slate-500 font-medium">Actual:</span>
                            <span className="font-mono text-red-700">{formatJson(assertion.actual)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="space-y-2">
              {result.logs.map((log, idx) => (
                <div key={idx} className="font-mono text-xs bg-slate-900 text-green-400 px-4 py-2 rounded">
                  {log}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50">
          <div className="text-xs text-slate-500">
            <span>Started: {new Date(result.startTime).toLocaleString()}</span>
            <span className="mx-2">•</span>
            <span>Ended: {new Date(result.endTime).toLocaleString()}</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
