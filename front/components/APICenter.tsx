/**
 * API Center Component
 *
 * A comprehensive API management interface with:
 * - Scope filtering (all, system, platform, organization, project)
 * - Category/module filtering
 * - Search functionality
 * - Left panel: API list with coverage indicators
 * - Right panel: Details with tabs (Overview, Playground, Related Tests)
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Globe,
  Shield,
  Building2,
  FolderTree,
  X,
  Play,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Code,
  Box,
  Tag,
  Clock,
  Users,
  ChevronRight,
  Send,
  FileText,
  TestTube2,
  Link2,
  ExternalLink,
  Copy,
  Check,
  Terminal,
  Activity,
  Target,
  Zap
} from 'lucide-react';
import { TestCase, Priority, Status } from '../types';
import { actionTemplateApi, ActionTemplate } from '../services/api/actionTemplateApi';

// ===== TYPE DEFINITIONS =====

interface APICenterProps {
  cases: TestCase[];
  projectId: string;
  activeOrgId: string;
  onCreateTest?: (api: ActionTemplate) => void;
}

type ScopeType = 'all' | 'system' | 'platform' | 'organization' | 'project';

interface CoverageStats {
  totalCalls: number;
  testedCalls: number;
  coveragePercent: number;
}

// ===== SUB-COMPONENTS =====

/**
 * Scope Badge Component
 * Displays colored scope labels with appropriate icons
 */
const ScopeBadge: React.FC<{ scope: string }> = ({ scope }) => {
  const config = useMemo(() => {
    switch (scope) {
      case 'system':
        return { color: 'bg-blue-100 text-blue-700 border-blue-200', icon: Shield, label: 'System' };
      case 'platform':
        return { color: 'bg-green-100 text-green-700 border-green-200', icon: Globe, label: 'Platform' };
      case 'organization':
        return { color: 'bg-purple-100 text-purple-700 border-purple-200', icon: Building2, label: 'Org' };
      case 'project':
        return { color: 'bg-amber-100 text-amber-700 border-amber-200', icon: FolderTree, label: 'Project' };
      default:
        return { color: 'bg-slate-100 text-slate-600 border-slate-200', icon: Box, label: scope };
    }
  }, [scope]);

  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${config.color}`}>
      <Icon size={12} className="mr-1" />
      {config.label}
    </span>
  );
};

/**
 * API Overview Tab
 * Shows API details, parameters, and usage information
 */
const APIOverviewTab: React.FC<{ api: ActionTemplate }> = ({ api }) => {
  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <div>
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Basic Information</h3>
        <div className="bg-slate-50 rounded-lg p-4 space-y-3">
          <div className="flex items-start">
            <span className="text-xs font-medium text-slate-500 w-24 flex-shrink-0">Name:</span>
            <span className="text-sm text-slate-800 font-medium">{api.name}</span>
          </div>
          <div className="flex items-start">
            <span className="text-xs font-medium text-slate-500 w-24 flex-shrink-0">Category:</span>
            <span className="text-sm text-slate-700">{api.category || 'General'}</span>
          </div>
          <div className="flex items-start">
            <span className="text-xs font-medium text-slate-500 w-24 flex-shrink-0">Type:</span>
            <span className="text-sm text-slate-700">{api.type || 'Unknown'}</span>
          </div>
          <div className="flex items-start">
            <span className="text-xs font-medium text-slate-500 w-24 flex-shrink-0">Scope:</span>
            <ScopeBadge scope={api.scope} />
          </div>
          <div className="flex items-start">
            <span className="text-xs font-medium text-slate-500 w-24 flex-shrink-0">Description:</span>
            <p className="text-sm text-slate-600 flex-1">{api.description || 'No description available'}</p>
          </div>
        </div>
      </div>

      {/* Parameters */}
      {api.parameters && api.parameters.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center">
            <Terminal size={14} className="mr-2 text-slate-500" />
            Input Parameters ({api.parameters.length})
          </h3>
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-2 text-left font-medium">Name</th>
                  <th className="px-4 py-2 text-left font-medium">Type</th>
                  <th className="px-4 py-2 text-left font-medium">Required</th>
                  <th className="px-4 py-2 text-left font-medium">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {api.parameters.map((param: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono text-xs text-blue-600">{param.name}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-xs font-medium">
                        {param.type || 'any'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {param.required ? (
                        <span className="text-red-600 font-medium">Yes</span>
                      ) : (
                        <span className="text-slate-400">No</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{param.description || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Outputs */}
      {api.outputs && api.outputs.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center">
            <Activity size={14} className="mr-2 text-slate-500" />
            Output Values ({api.outputs.length})
          </h3>
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-2 text-left font-medium">Name</th>
                  <th className="px-4 py-2 text-left font-medium">Type</th>
                  <th className="px-4 py-2 text-left font-medium">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {api.outputs.map((output: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono text-xs text-green-600">{output.name}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-xs font-medium">
                        {output.type || 'any'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{output.description || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Usage Statistics */}
      <div>
        <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center">
          <Target size={14} className="mr-2 text-slate-500" />
          Usage Statistics
        </h3>
        <div className="bg-slate-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">Total Usage Count:</span>
            <span className="text-lg font-bold text-slate-800">{api.usageCount || 0}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * API Playground Tab
 * Interactive testing interface for API calls
 */
const APIPlaygroundTab: React.FC<{ api: ActionTemplate; onCreateTest?: (api: ActionTemplate) => void }> = ({
  api,
  onCreateTest
}) => {
  const [paramValues, setParamValues] = useState<Record<string, string>>({});
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleParamChange = (paramName: string, value: string) => {
    setParamValues(prev => ({ ...prev, [paramName]: value }));
  };

  const handleRun = async () => {
    setIsRunning(true);
    setError(null);
    setResult(null);

    // Simulate API call
    setTimeout(() => {
      setIsRunning(false);
      setResult({
        status: 200,
        statusText: 'OK',
        body: {
          message: 'Mock response',
          data: paramValues,
          timestamp: new Date().toISOString()
        }
      });
    }, 1500);
  };

  const handleCopyAsTest = () => {
    if (onCreateTest) {
      onCreateTest(api);
    }
  };

  const handleCopyCode = () => {
    const code = JSON.stringify({ api: api.name, parameters: paramValues }, null, 2);
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Parameters Input */}
      <div>
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Input Parameters</h3>
        {api.parameters && api.parameters.length > 0 ? (
          <div className="space-y-3">
            {api.parameters.map((param: any) => (
              <div key={param.name} className="flex flex-col">
                <label className="text-xs font-medium text-slate-600 mb-1">
                  {param.name}
                  {param.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                <input
                  type="text"
                  className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={param.description || `Enter ${param.name}`}
                  value={paramValues[param.name] || ''}
                  onChange={(e) => handleParamChange(param.name, e.target.value)}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-slate-500 italic bg-slate-50 rounded-lg p-4">
            No input parameters required
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-2">
        <button
          onClick={handleRun}
          disabled={isRunning}
          className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm shadow-sm"
        >
          {isRunning ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              <span>Running...</span>
            </>
          ) : (
            <>
              <Play size={16} />
              <span>Run Test</span>
            </>
          )}
        </button>
        <button
          onClick={handleCopyAsTest}
          className="px-4 py-2 border border-slate-300 bg-white text-slate-700 rounded-lg hover:bg-slate-50 font-medium text-sm flex items-center space-x-2"
        >
          <TestTube2 size={16} />
          <span>Create Test</span>
        </button>
        <button
          onClick={handleCopyCode}
          className="px-4 py-2 border border-slate-300 bg-white text-slate-700 rounded-lg hover:bg-slate-50"
          title="Copy as code"
        >
          {copied ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
        </button>
      </div>

      {/* Result Display */}
      {(result || error) && (
        <div>
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Result</h3>
          {error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <XCircle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-medium text-red-800 mb-1">Error</div>
                  <pre className="text-xs text-red-700 whitespace-pre-wrap">{error}</pre>
                </div>
              </div>
            </div>
          ) : result ? (
            <div className="bg-slate-50 border border-slate-200 rounded-lg overflow-hidden">
              <div className="bg-green-50 border-b border-green-200 px-4 py-2 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 size={16} className="text-green-600" />
                  <span className="text-sm font-medium text-green-800">
                    {result.status} {result.statusText}
                  </span>
                </div>
                <span className="text-xs text-green-600">Response received</span>
              </div>
              <div className="p-4">
                <pre className="text-xs text-slate-700 whitespace-pre-wrap overflow-auto max-h-96 font-mono">
                  {JSON.stringify(result.body, null, 2)}
                </pre>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

/**
 * Related Tests Tab
 * Shows test cases that use this API
 */
const RelatedTestsTab: React.FC<{ api: ActionTemplate; cases: TestCase[] }> = ({ api, cases }) => {
  // Find test cases that reference this API template
  const relatedTests = useMemo(() => {
    return cases.filter(testCase => {
      // Check if any step references this template
      return testCase.steps.some(step =>
        step.linkedScriptId === api.templateId ||
        step.config?.templateId === api.templateId
      );
    });
  }, [api, cases]);

  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case Priority.CRITICAL: return 'text-red-600 bg-red-50 border-red-200';
      case Priority.HIGH: return 'text-orange-600 bg-orange-50 border-orange-200';
      case Priority.MEDIUM: return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case Priority.LOW: return 'text-slate-600 bg-slate-50 border-slate-200';
      default: return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  const getStatusColor = (status: Status) => {
    switch (status) {
      case Status.ACTIVE: return 'text-green-600 bg-green-50 border-green-200';
      case Status.DRAFT: return 'text-slate-600 bg-slate-50 border-slate-200';
      case Status.DEPRECATED: return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700">
          Related Test Cases ({relatedTests.length})
        </h3>
        {relatedTests.length > 0 && (
          <span className="text-xs text-slate-500">
            API used in {relatedTests.length} test{relatedTests.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {relatedTests.length === 0 ? (
        <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-lg p-12 text-center">
          <TestTube2 size={48} className="mx-auto mb-4 text-slate-300" />
          <p className="text-slate-500 mb-2">No test cases using this API yet</p>
          <p className="text-xs text-slate-400">Create a test case to start using this API</p>
        </div>
      ) : (
        <div className="space-y-2">
          {relatedTests.map(testCase => (
            <div
              key={testCase.id}
              className="bg-white border border-slate-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="font-medium text-slate-800 mb-1">{testCase.title}</h4>
                  <p className="text-xs text-slate-500 line-clamp-2">{testCase.description}</p>
                </div>
                <ExternalLink size={14} className="text-slate-400 flex-shrink-0 ml-2" />
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${getPriorityColor(testCase.priority)}`}>
                    {testCase.priority}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${getStatusColor(testCase.status)}`}>
                    {testCase.status}
                  </span>
                </div>
                <div className="flex items-center space-x-3 text-xs text-slate-500">
                  <span className="flex items-center">
                    <FileText size={12} className="mr-1" />
                    {testCase.steps.length} steps
                  </span>
                  {testCase.tags && testCase.tags.length > 0 && (
                    <span className="flex items-center">
                      <Tag size={12} className="mr-1" />
                      {testCase.tags.length}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * API Detail View Component
 * Right panel showing detailed API information with tabs
 */
const APIDetailView: React.FC<{
  api: ActionTemplate;
  cases: TestCase[];
  onClose: () => void;
  onCreateTest?: (api: ActionTemplate) => void;
}> = ({ api, cases, onClose, onCreateTest }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'playground' | 'tests'>('overview');

  return (
    <div className="flex flex-col h-full bg-white border-l border-slate-200">
      {/* Header */}
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <Box size={20} className="text-indigo-600" />
              <h2 className="text-xl font-bold text-slate-800">{api.name}</h2>
            </div>
            <p className="text-sm text-slate-600">{api.description}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <div className="flex items-center space-x-3">
          <ScopeBadge scope={api.scope} />
          <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-medium">
            {api.category}
          </span>
          <span className="text-xs text-slate-400 flex items-center">
            <Clock size={12} className="mr-1" />
            Used {api.usageCount} times
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 bg-slate-50">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'overview'
              ? 'border-blue-600 text-blue-600 bg-white'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <FileText size={14} className="inline-block mr-2" />
          Overview
        </button>
        <button
          onClick={() => setActiveTab('playground')}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'playground'
              ? 'border-blue-600 text-blue-600 bg-white'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Play size={14} className="inline-block mr-2" />
          Playground
        </button>
        <button
          onClick={() => setActiveTab('tests')}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'tests'
              ? 'border-blue-600 text-blue-600 bg-white'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Link2 size={14} className="inline-block mr-2" />
          Related Tests
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'overview' && <APIOverviewTab api={api} />}
        {activeTab === 'playground' && <APIPlaygroundTab api={api} onCreateTest={onCreateTest} />}
        {activeTab === 'tests' && <RelatedTestsTab api={api} cases={cases} />}
      </div>
    </div>
  );
};

// ===== MAIN COMPONENT =====

export const APICenter: React.FC<APICenterProps> = ({
  cases,
  projectId,
  activeOrgId,
  onCreateTest
}) => {
  // State
  const [templates, setTemplates] = useState<ActionTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedScope, setSelectedScope] = useState<ScopeType>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedApi, setSelectedApi] = useState<ActionTemplate | null>(null);

  // Load templates
  useEffect(() => {
    loadTemplates();
  }, [selectedScope, selectedCategory, searchTerm, projectId]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await actionTemplateApi.getAccessibleTemplates({
        projectId,
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        search: searchTerm || undefined,
        pageSize: 100
      });

      // Filter only API-related templates (category starts with "API.")
      let filteredData = (result.data || []).filter(t =>
        t.category?.startsWith('API.')
      );

      // Filter by scope
      if (selectedScope !== 'all') {
        filteredData = filteredData.filter(t => t.scope === selectedScope);
      }

      setTemplates(filteredData);
    } catch (err: any) {
      console.error('Failed to load templates:', err);
      setError(err.message || 'Failed to load API templates');
    } finally {
      setLoading(false);
    }
  };

  // Extract categories from templates (remove "API." prefix)
  const categories = useMemo(() => {
    const cats = Array.from(new Set(
      templates
        .map(t => t.category?.replace(/^API\./, '')) // Remove "API." prefix
        .filter(Boolean)
    ));
    return ['all', ...cats.sort()];
  }, [templates]);

  // Group templates by category for tree display
  const groupedTemplates = useMemo(() => {
    const groups: Record<string, ActionTemplate[]> = {};

    templates.forEach(template => {
      const category = template.category?.replace(/^API\./, '') || 'Uncategorized';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(template);
    });

    return groups;
  }, [templates, selectedCategory, selectedScope]);


  // Calculate coverage stats for each API
  const getCoverageStats = (api: ActionTemplate): CoverageStats => {
    const relatedTests = cases.filter(testCase =>
      testCase.steps.some(step =>
        step.linkedScriptId === api.templateId ||
        step.config?.templateId === api.templateId
      )
    );

    const totalCalls = api.usageCount || 0;
    const testedCalls = relatedTests.length;
    const coveragePercent = totalCalls > 0 ? Math.round((testedCalls / totalCalls) * 100) : 0;

    return { totalCalls, testedCalls, coveragePercent };
  };

  // Filter templates
  const filteredTemplates = useMemo(() => {
    return templates.filter(t => {
      // Filter by category (remove "API." prefix for comparison)
      const categoryWithoutPrefix = t.category?.replace(/^API\./, '');
      if (selectedCategory !== 'all' && categoryWithoutPrefix !== selectedCategory) return false;
      // Filter by search term
      if (searchTerm && !t.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      return true;
    });
  }, [templates, selectedCategory, searchTerm]);

  // Scope filter configs
  const scopeFilters: Array<{ value: ScopeType; label: string; icon: any; color: string }> = [
    { value: 'all', label: 'All APIs', icon: Zap, color: 'slate' },
    { value: 'system', label: 'System', icon: Shield, color: 'blue' },
    { value: 'platform', label: 'Platform', icon: Globe, color: 'green' },
    { value: 'organization', label: 'Organization', icon: Building2, color: 'purple' },
    { value: 'project', label: 'Project', icon: FolderTree, color: 'amber' },
  ];

  return (
    <div className="flex h-full bg-slate-50">
      {/* Left Panel - API List */}
      <div className="w-2/5 flex flex-col border-r border-slate-200 bg-white">
        {/* Header */}
        <div className="p-6 border-b border-slate-200">
          <h1 className="text-2xl font-bold text-slate-800 mb-1">API Center</h1>
          <p className="text-sm text-slate-500">Browse and manage your API collection</p>
        </div>

        {/* Search & Filters */}
        <div className="p-4 space-y-3 border-b border-slate-200 bg-slate-50">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <input
              type="text"
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Search APIs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Scope Filter */}
          <div className="flex flex-wrap gap-2">
            {scopeFilters.map(filter => {
              const Icon = filter.icon;
              const isActive = selectedScope === filter.value;
              return (
                <button
                  key={filter.value}
                  onClick={() => setSelectedScope(filter.value)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    isActive
                      ? `bg-${filter.color}-600 text-white`
                      : `bg-white border border-slate-200 text-slate-600 hover:bg-slate-50`
                  }`}
                >
                  <Icon size={12} />
                  <span>{filter.label}</span>
                </button>
              );
            })}
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-1">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2 py-1 text-xs rounded-md transition-colors ${
                  selectedCategory === cat
                    ? 'bg-slate-800 text-white'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {cat === 'all' ? 'All' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* API List - Grouped by Category */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <span className="ml-3 text-slate-600">Loading APIs...</span>
            </div>
          ) : error ? (
            <div className="m-4 bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
              <div className="font-semibold mb-1">Error loading APIs</div>
              <div className="text-sm">{error}</div>
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-slate-400">
              <Box size={48} className="mb-4 opacity-20" />
              <p className="text-sm">No APIs found</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {Object.entries(groupedTemplates)
                .filter(([category, apis]) =>
                  selectedCategory === 'all' || category === selectedCategory
                )
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([category, apis]) => (
                <div key={category} className="border-b border-slate-200">
                  {/* Category Header */}
                  <div className="bg-slate-50 px-4 py-2 border-b border-slate-200">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wide flex items-center">
                        <FolderTree size={14} className="mr-2 text-slate-500" />
                        {category}
                      </h3>
                      <span className="text-xs text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                        {apis.filter(api =>
                          !searchTerm || api.name.toLowerCase().includes(searchTerm.toLowerCase())
                        ).length} APIs
                      </span>
                    </div>
                  </div>

                  {/* APIs in this category */}
                  <div className="divide-y divide-slate-100">
                    {apis
                      .filter(api =>
                        !searchTerm || api.name.toLowerCase().includes(searchTerm.toLowerCase())
                      )
                      .map(api => {
                        const coverage = getCoverageStats(api);
                        const isSelected = selectedApi?.templateId === api.templateId;

                        return (
                          <div
                            key={api.templateId}
                            onClick={() => setSelectedApi(api)}
                            className={`p-4 cursor-pointer transition-all ${
                              isSelected
                                ? 'bg-blue-50 border-l-4 border-l-blue-600'
                                : 'hover:bg-slate-50 border-l-4 border-l-transparent'
                            }`}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <h3 className="font-semibold text-slate-800 mb-1">{api.name}</h3>
                                <p className="text-xs text-slate-500 line-clamp-2">{api.description}</p>
                              </div>
                              <ChevronRight size={16} className="text-slate-400 flex-shrink-0 ml-2" />
                            </div>

                            <div className="flex items-center justify-between mt-3">
                              <div className="flex items-center space-x-2">
                                <ScopeBadge scope={api.scope} />
                              </div>

                              {/* Coverage Badge */}
                              <div className="flex items-center space-x-1">
                                {coverage.coveragePercent >= 80 ? (
                                  <CheckCircle2 size={14} className="text-green-600" />
                                ) : coverage.coveragePercent >= 50 ? (
                                  <AlertCircle size={14} className="text-yellow-600" />
                                ) : (
                                  <XCircle size={14} className="text-red-600" />
                                )}
                                <span className="text-xs font-medium text-slate-600">
                                  {coverage.testedCalls}/{coverage.totalCalls}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Stats */}
        <div className="p-4 border-t border-slate-200 bg-slate-50">
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span>Total APIs: {filteredTemplates.length}</span>
            <span className="flex items-center">
              <Users size={12} className="mr-1" />
              {filteredTemplates.reduce((sum, t) => sum + (t.usageCount || 0), 0)} total uses
            </span>
          </div>
        </div>
      </div>

      {/* Right Panel - API Details */}
      {selectedApi ? (
        <div className="flex-1 flex flex-col">
          <APIDetailView
            api={selectedApi}
            cases={cases}
            onClose={() => setSelectedApi(null)}
            onCreateTest={onCreateTest}
          />
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-slate-400">
          <div className="text-center">
            <Box size={64} className="mx-auto mb-4 opacity-20" />
            <p className="text-lg font-medium mb-2">No API Selected</p>
            <p className="text-sm">Select an API from the list to view details</p>
          </div>
        </div>
      )}
    </div>
  );
};
