import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Package,
  Globe,
  Terminal,
  CheckCircle,
  Clock,
  Database,
  Settings,
  ChevronRight,
  X,
  Loader2
} from 'lucide-react';
import { actionTemplateApi, ActionTemplate } from '../../../services/api/actionTemplateApi';

interface ActionTemplateSelectorProps {
  projectId: string;
  onSelect: (template: ActionTemplate) => void;
  onClose: () => void;
  selectedTemplateId?: string;
}

// Category icons mapping
const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  Network: <Globe size={16} className="text-emerald-500" />,
  System: <Terminal size={16} className="text-orange-500" />,
  Control: <Clock size={16} className="text-blue-500" />,
  Data: <Database size={16} className="text-purple-500" />,
  Validation: <CheckCircle size={16} className="text-cyan-500" />,
  Default: <Package size={16} className="text-slate-500" />
};

// Scope badge colors
const SCOPE_COLORS: Record<string, string> = {
  system: 'bg-blue-100 text-blue-700',
  platform: 'bg-green-100 text-green-700',
  organization: 'bg-amber-100 text-amber-700',
  project: 'bg-purple-100 text-purple-700'
};

export const ActionTemplateSelector: React.FC<ActionTemplateSelectorProps> = ({
  projectId,
  onSelect,
  onClose,
  selectedTemplateId
}) => {
  const [templates, setTemplates] = useState<ActionTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Load templates
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        setLoading(true);
        const response = await actionTemplateApi.getAccessibleTemplates({
          projectId,
          limit: 100,
          offset: 0
        });
        setTemplates(response.data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load templates');
      } finally {
        setLoading(false);
      }
    };
    loadTemplates();
  }, [projectId]);

  // Group templates by category
  const templatesByCategory = useMemo(() => {
    const groups: Record<string, ActionTemplate[]> = {};
    templates.forEach(template => {
      const category = template.category || 'Other';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(template);
    });
    return groups;
  }, [templates]);

  // Get unique categories
  const categories = useMemo(() => Object.keys(templatesByCategory).sort(), [templatesByCategory]);

  // Filter templates by search and category
  const filteredTemplates = useMemo(() => {
    let result = templates;

    if (selectedCategory) {
      result = result.filter(t => t.category === selectedCategory);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(t =>
        t.name.toLowerCase().includes(query) ||
        t.description?.toLowerCase().includes(query) ||
        t.category.toLowerCase().includes(query)
      );
    }

    return result;
  }, [templates, selectedCategory, searchQuery]);

  const getCategoryIcon = (category: string) => {
    return CATEGORY_ICONS[category] || CATEGORY_ICONS.Default;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl w-[800px] max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Package size={20} className="text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Select Action Template</h2>
              <p className="text-xs text-slate-500">Choose a reusable action from the library</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-6 py-3 border-b border-slate-100">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search templates by name, description, or category..."
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:border-blue-400 focus:outline-none transition-colors"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Category Sidebar */}
          <div className="w-48 border-r border-slate-100 bg-slate-50 overflow-y-auto">
            <div className="p-3">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  !selectedCategory
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Package size={16} />
                <span>All Templates</span>
                <span className="ml-auto text-xs bg-slate-200 px-1.5 py-0.5 rounded">
                  {templates.length}
                </span>
              </button>

              <div className="mt-3 space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase px-3 mb-2">Categories</p>
                {categories.map(category => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedCategory === category
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {getCategoryIcon(category)}
                    <span className="truncate">{category}</span>
                    <span className="ml-auto text-xs bg-slate-200 px-1.5 py-0.5 rounded">
                      {templatesByCategory[category].length}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Template List */}
          <div className="flex-1 overflow-y-auto p-4">
            {loading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 size={24} className="animate-spin text-blue-500" />
                <span className="ml-2 text-slate-500">Loading templates...</span>
              </div>
            )}

            {error && (
              <div className="flex items-center justify-center py-12 text-red-500">
                <span>{error}</span>
              </div>
            )}

            {!loading && !error && filteredTemplates.length === 0 && (
              <div className="text-center py-12 text-slate-500">
                <Package size={32} className="mx-auto mb-2 text-slate-300" />
                <p>No templates found</p>
              </div>
            )}

            {!loading && !error && (
              <div className="grid grid-cols-1 gap-3">
                {filteredTemplates.map(template => (
                  <button
                    key={template.templateId}
                    onClick={() => onSelect(template)}
                    className={`w-full text-left p-4 rounded-xl border transition-all hover:shadow-md ${
                      selectedTemplateId === template.templateId
                        ? 'border-blue-400 bg-blue-50 shadow-md'
                        : 'border-slate-200 bg-white hover:border-blue-300'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <div className="p-2 bg-slate-100 rounded-lg mt-0.5">
                          {getCategoryIcon(template.category)}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="font-semibold text-slate-800">{template.name}</h3>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium uppercase ${SCOPE_COLORS[template.scope] || 'bg-slate-100 text-slate-600'}`}>
                              {template.scope}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                            {template.description || 'No description'}
                          </p>
                          <div className="flex items-center space-x-3 mt-2">
                            <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                              {template.type}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {template.parameters?.length || 0} params
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {template.outputs?.length || 0} outputs
                            </span>
                            <span className="text-[10px] text-slate-400">
                              Used {template.usageCount || 0} times
                            </span>
                          </div>
                        </div>
                      </div>
                      <ChevronRight size={16} className="text-slate-400 mt-1" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-200 bg-slate-50">
          <p className="text-xs text-slate-500">
            {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''} available
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};