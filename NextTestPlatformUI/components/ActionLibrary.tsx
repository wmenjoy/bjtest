
import React, { useState, useEffect } from 'react';
import { Script, ScriptType, NodeType, Workflow, TestCase, WorkflowNode } from '../types';
import { Code, Terminal, Box, Search, Plus, Zap, Play, Copy, X, Edit3, Trash2, CheckSquare, Square, AlertTriangle, LogIn, LogOut } from 'lucide-react';
import { useConfig } from '../ConfigContext';
import { ActionDef, BUILT_IN_ACTIONS } from './library/types';
import { ActionEditor } from './library/ActionEditor';
import { ActionDetails } from './library/ActionDetails';
import { actionTemplateApi, ActionTemplate } from '../services/api/actionTemplateApi';

interface ActionLibraryProps {
  scripts: Script[];
  workflows: Workflow[];
  cases: TestCase[];
  projectId: string;
  onAddScript: (s: Script) => void;
  onUpdateScript?: (s: Script) => void;
  onDeleteScript: (ids: string[]) => void;
}

// Helper to find references recursively
const findScriptInNodes = (nodes: WorkflowNode[], scriptId: string): boolean => {
    for (const node of nodes) {
        if (node.type === NodeType.SCRIPT && node.config?.scriptId === scriptId) return true;
        if (node.children && findScriptInNodes(node.children, scriptId)) return true;
        if (node.elseChildren && findScriptInNodes(node.elseChildren, scriptId)) return true;
    }
    return false;
};

export const ActionLibrary: React.FC<ActionLibraryProps> = ({ scripts, workflows, cases, projectId, onAddScript, onUpdateScript, onDeleteScript }) => {
  const { t } = useConfig();
  const [activeTab, setActiveTab] = useState<'builtin' | 'custom' | 'templates'>('builtin');
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<string>('All');

  // Backend Action Templates state
  const [templates, setTemplates] = useState<ActionTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [templatesError, setTemplatesError] = useState<string | null>(null);

  const [selectedScripts, setSelectedScripts] = useState<string[]>([]);

  // Load backend action templates when builtin tab is active or filter changes
  useEffect(() => {
    if (activeTab === 'builtin' && projectId) {  // ⭐ 添加 projectId 检查
      loadActionTemplates();
    }
  }, [activeTab, selectedFilter, searchTerm, projectId]);

  const loadActionTemplates = async () => {
    try {
      setTemplatesLoading(true);
      setTemplatesError(null);
      const result = await actionTemplateApi.getAccessibleTemplates({
        projectId,  // ⭐ 添加必需的 projectId 参数
        category: selectedFilter !== 'All' ? selectedFilter : undefined,
        search: searchTerm || undefined,
        pageSize: 100
      });
      setTemplates(result.data || []);
    } catch (err: any) {
      console.error('Failed to load action templates:', err);
      setTemplatesError(err.message || 'Failed to load templates');
    } finally {
      setTemplatesLoading(false);
    }
  };

  // Modal States
  const [showEditor, setShowEditor] = useState(false);
  const [editingScript, setEditingScript] = useState<Partial<Script>>({});
  const [isReadOnlyView, setIsReadOnlyView] = useState(false);
  const [viewingAction, setViewingAction] = useState<ActionDef | null>(null);
  const [deleteWarning, setDeleteWarning] = useState<{ blocked: string[], safe: string[] } | null>(null);

  // Transform Custom Scripts to ActionDef for unified handling
  const customActions: ActionDef[] = scripts.filter(s => !s.isTemplate).map(s => ({
      ...s,
      category: 'Custom',
      isBuiltIn: false
  }));

  const templateActions: ActionDef[] = scripts.filter(s => s.isTemplate).map(s => ({
      ...s,
      category: 'Template',
      isBuiltIn: false
  }));

  const filteredBuiltIn = BUILT_IN_ACTIONS.filter(a =>
    (selectedFilter === 'All' || a.category === selectedFilter) &&
    a.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredCustom = customActions.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredTemplates = templateActions.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));

  // Categories from backend templates
  const categories = ['All', ...Array.from(new Set(templates.map(t => t.category).filter(Boolean)))];

  const getScriptReferences = (scriptId: string) => {
      const refs: string[] = [];
      cases.forEach(c => {
          if (c.steps.some(s => s.linkedScriptId === scriptId)) refs.push(`Test Case: ${c.title}`);
      });
      workflows.forEach(w => {
          if (findScriptInNodes(w.nodes, scriptId)) refs.push(`Workflow: ${w.name}`);
      });
      return refs;
  };

  const toggleSelect = (id: string) => {
      if (selectedScripts.includes(id)) {
          setSelectedScripts(selectedScripts.filter(s => s !== id));
      } else {
          setSelectedScripts([...selectedScripts, id]);
      }
  };

  const toggleSelectAll = () => {
      if (selectedScripts.length === filteredCustom.length) {
          setSelectedScripts([]);
      } else {
          setSelectedScripts(filteredCustom.map(s => s.id));
      }
  };

  const handleDeleteRequest = (ids: string[]) => {
      const blocked: string[] = [];
      const safe: string[] = [];

      ids.forEach(id => {
          const refs = getScriptReferences(id);
          if (refs.length > 0) {
             const s = scripts.find(sc => sc.id === id);
             blocked.push(`${s?.name} (${refs.length} refs)`);
          } else {
             safe.push(id);
          }
      });

      if (blocked.length > 0) {
          setDeleteWarning({ blocked, safe });
      } else {
          if (confirm(`Are you sure you want to delete ${ids.length} script(s)?`)) {
              onDeleteScript(safe);
              setSelectedScripts([]);
          }
      }
  };

  const confirmPartialDelete = () => {
      if (deleteWarning && deleteWarning.safe.length > 0) {
          onDeleteScript(deleteWarning.safe);
          setSelectedScripts([]);
      }
      setDeleteWarning(null);
  };

  const handleCreateNew = () => {
      setEditingScript({
          id: `sc-${Date.now()}`,
          name: '',
          description: '',
          type: ScriptType.PYTHON,
          content: '# Write your script here\n',
          parameters: [],
          outputs: [],
          isTemplate: false,
          tags: []
      });
      setIsReadOnlyView(false);
      setShowEditor(true);
  };

  const handleEditCustom = (script: Script) => {
      setEditingScript({ ...script });
      setIsReadOnlyView(false);
      setShowEditor(true);
  };

  const handleViewDetails = (action: ActionDef) => {
      setViewingAction(action);
  };

  // Convert backend ActionTemplate to frontend ActionDef format
  const convertTemplateToActionDef = (template: ActionTemplate): ActionDef => {
      return {
          id: template.templateId,
          name: template.name,
          description: template.description,
          type: ScriptType.PYTHON, // Default type, could be derived from category
          category: template.category || 'General',
          isBuiltIn: template.scope === 'system',
          parameters: template.parameters || [],
          outputs: template.outputs || [],
          content: template.sourceCode || '',
          testExamples: []
      };
  };

  const handleViewTemplate = (template: ActionTemplate) => {
      const actionDef = convertTemplateToActionDef(template);
      setViewingAction(actionDef);
  };

  const handleUseTemplate = (tpl: ActionDef) => {
      const newScript: Script = {
          id: `sc-${Date.now()}`,
          projectId,
          name: `Copy of ${tpl.name}`,
          type: tpl.type as ScriptType,
          content: tpl.content || '',
          description: `Created from template: ${tpl.name}`,
          isTemplate: false,
          lastModified: new Date().toISOString(),
          parameters: tpl.parameters ? [...tpl.parameters] : [],
          outputs: tpl.outputs ? [...tpl.outputs] : [],
          testExamples: tpl.testExamples ? [...tpl.testExamples] : [],
          tags: []
      };

      setViewingAction(null);
      setEditingScript(newScript);
      setIsReadOnlyView(false);
      setShowEditor(true);
  };

  const handleSaveScript = (script: Partial<Script>) => {
      const finalScript = {
          ...script,
          lastModified: new Date().toISOString()
      } as Script;

      if (scripts.some(s => s.id === finalScript.id)) {
          if (onUpdateScript) onUpdateScript(finalScript);
      } else {
          onAddScript(finalScript);
      }
      setShowEditor(false);
      if (activeTab === 'templates') setActiveTab('custom');
  };

  return (
    <div className="flex flex-col h-full bg-slate-50/50 relative">
      {/* Header */}
      <div className="p-6 border-b border-slate-200 bg-white flex justify-between items-center">
        <div>
           <h1 className="text-2xl font-bold text-slate-800">{t('library.title')}</h1>
           <p className="text-slate-500 text-sm">{t('library.subtitle')}</p>
        </div>
        <div className="flex space-x-2">
            <div className="relative">
                <Search className="absolute left-3 top-2.5 text-slate-400" size={16}/>
                <input 
                    className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
                    placeholder={t('library.search')}
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>
            <button onClick={handleCreateNew} className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm shadow-sm">
                <Plus size={16}/><span>{t('library.new')}</span>
            </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex px-6 border-b border-slate-200 bg-white items-center justify-between">
          <div className="flex">
              <button onClick={() => setActiveTab('builtin')} className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'builtin' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>{t('library.builtin')}</button>
              <button onClick={() => setActiveTab('custom')} className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'custom' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>{t('library.custom')}</button>
              <button onClick={() => setActiveTab('templates')} className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'templates' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>{t('library.templates')}</button>
          </div>
          {activeTab === 'custom' && selectedScripts.length > 0 && (
              <button onClick={() => handleDeleteRequest(selectedScripts)} className="flex items-center text-xs text-red-600 bg-red-50 px-3 py-1 rounded-full hover:bg-red-100 font-medium animate-fade-in">
                  <Trash2 size={12} className="mr-1"/> {t('library.delete')} ({selectedScripts.length})
              </button>
          )}
      </div>

      {activeTab === 'builtin' && (
          <div className="px-6 py-2 bg-slate-50 border-b border-slate-200 flex space-x-2 overflow-x-auto">
              {categories.map(cat => (
                  <button key={cat} onClick={() => setSelectedFilter(cat || 'All')} className={`px-3 py-1 text-xs rounded-full transition-colors ${selectedFilter === (cat || 'All') ? 'bg-slate-800 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'}`}>
                      {cat || 'All'}
                  </button>
              ))}
          </div>
      )}

      <div className="p-6 overflow-y-auto flex-1">
          {/* BUILT-IN MODULES (Backend Action Templates) */}
          {activeTab === 'builtin' && (
              <>
                  {templatesLoading ? (
                      <div className="flex items-center justify-center p-12">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                          <span className="ml-3 text-slate-600">Loading action templates...</span>
                      </div>
                  ) : templatesError ? (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                          <div className="font-semibold mb-1">Error loading templates</div>
                          <div className="text-sm">{templatesError}</div>
                      </div>
                  ) : templates.length === 0 ? (
                      <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl p-12 text-center text-slate-400">
                          <Box size={48} className="mx-auto mb-4 opacity-20"/>
                          <p>No action templates found</p>
                      </div>
                  ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {templates.map((template) => (
                              <div
                                  key={template.templateId}
                                  onClick={() => handleViewTemplate(template)}
                                  className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer"
                              >
                                  <div className="flex items-start justify-between mb-3">
                                      <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                                          <Box size={24}/>
                                      </div>
                                      <div className="flex flex-col items-end gap-1">
                                          <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded border border-slate-200">
                                              {template.category}
                                          </span>
                                          {template.scope && (
                                              <span className={`text-[9px] uppercase font-medium px-2 py-0.5 rounded ${
                                                  template.scope === 'system' ? 'bg-blue-50 text-blue-600' :
                                                  template.scope === 'platform' ? 'bg-green-50 text-green-600' :
                                                  'bg-purple-50 text-purple-600'
                                              }`}>
                                                  {template.scope}
                                              </span>
                                          )}
                                      </div>
                                  </div>
                                  <h3 className="font-bold text-slate-800 mb-1">{template.name}</h3>
                                  <p className="text-sm text-slate-500 mb-3 line-clamp-2">{template.description}</p>
                                  <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-100">
                                      <span className="flex items-center">
                                          <LogIn size={12} className="mr-1"/>
                                          {template.parameters?.length || 0} inputs
                                      </span>
                                      <span className="flex items-center">
                                          <Play size={12} className="mr-1"/>
                                          Used {template.usageCount} times
                                      </span>
                                  </div>
                              </div>
                          ))}
                      </div>
                  )}
              </>
          )}

          {/* CUSTOM ACTIONS TABLE */}
          {activeTab === 'custom' && (
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                  <table className="w-full text-sm text-left">
                      <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                          <tr>
                              <th className="px-4 py-3 w-10 text-center">
                                  <button onClick={toggleSelectAll} className="text-slate-400 hover:text-blue-600">
                                    {selectedScripts.length === filteredCustom.length && filteredCustom.length > 0 ? <CheckSquare size={16}/> : <Square size={16}/>}
                                  </button>
                              </th>
                              <th className="px-6 py-3">{t('library.name')}</th>
                              <th className="px-6 py-3">{t('library.executor')}</th>
                              <th className="px-6 py-3">{t('library.inputs')}</th>
                              <th className="px-6 py-3">{t('library.refs')}</th>
                              <th className="px-6 py-3 text-right">{t('library.actions')}</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                          {filteredCustom.map(script => {
                              const refs = getScriptReferences(script.id);
                              return (
                                  <tr key={script.id} className="hover:bg-slate-50 transition-colors">
                                      <td className="px-4 py-4 text-center">
                                          <button onClick={() => toggleSelect(script.id)} className={`${selectedScripts.includes(script.id) ? 'text-blue-600' : 'text-slate-300'}`}>
                                              {selectedScripts.includes(script.id) ? <CheckSquare size={16}/> : <Square size={16}/>}
                                          </button>
                                      </td>
                                      <td className="px-6 py-4 font-medium text-slate-800 flex items-center">
                                          <Zap size={16} className="mr-2 text-slate-400"/>
                                          <div>
                                              <div>{script.name}</div>
                                              <div className="text-xs text-slate-400 font-normal truncate max-w-[200px]">{script.description}</div>
                                          </div>
                                      </td>
                                      <td className="px-6 py-4">
                                          <span className={`px-2 py-1 rounded text-xs font-medium ${script.type === ScriptType.PYTHON ? 'bg-yellow-50 text-yellow-700' : 'bg-blue-50 text-blue-700'}`}>
                                              {script.type}
                                          </span>
                                      </td>
                                      <td className="px-6 py-4 text-slate-600 text-xs">
                                          {script.parameters?.length || 0} Params
                                      </td>
                                      <td className="px-6 py-4">
                                          {refs.length > 0 ? (
                                              <span className="inline-flex items-center px-2 py-1 rounded-full bg-amber-50 text-amber-600 text-xs font-medium" title={refs.join('\n')}>
                                                  {refs.length}
                                              </span>
                                          ) : (
                                              <span className="text-slate-300">-</span>
                                          )}
                                      </td>
                                      <td className="px-6 py-4 text-right">
                                          <div className="flex justify-end space-x-2">
                                              <button onClick={() => handleViewDetails(script as unknown as ActionDef)} className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors" title="Details & Test">
                                                  <Play size={14}/>
                                              </button>
                                              <button onClick={() => handleEditCustom(script as unknown as Script)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Edit">
                                                  <Edit3 size={14}/>
                                              </button>
                                              <button onClick={() => handleDeleteRequest([script.id])} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Delete">
                                                  <Trash2 size={14}/>
                                              </button>
                                          </div>
                                      </td>
                                  </tr>
                              );
                          })}
                      </tbody>
                  </table>
                  {filteredCustom.length === 0 && <div className="p-12 text-center text-slate-400 italic">{t('library.noCustom')}</div>}
              </div>
          )}

        {/* TEMPLATES GRID */}
        {activeTab === 'templates' && (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {filteredTemplates.map(tpl => (
                     <div key={tpl.id} onClick={() => handleViewDetails(tpl)} className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col shadow-sm hover:shadow-md hover:border-blue-200 transition-all cursor-pointer group">
                         <div className="flex items-center justify-between mb-3">
                             <div className="flex items-center space-x-3">
                                 <div className={`p-2.5 rounded-lg ${tpl.type === ScriptType.PYTHON ? 'bg-yellow-50 text-yellow-600' : tpl.type === ScriptType.SHELL ? 'bg-slate-800 text-white' : 'bg-blue-50 text-blue-600'}`}>
                                    {tpl.type === ScriptType.SHELL ? <Terminal size={20}/> : <Code size={20}/>}
                                 </div>
                                 <div>
                                     <h3 className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{tpl.name}</h3>
                                     <span className="text-xs text-slate-400 uppercase font-mono">{tpl.type}</span>
                                 </div>
                             </div>
                             <Zap size={18} className="text-slate-300 group-hover:text-yellow-500"/>
                         </div>
                         
                         <div className="flex-1 mb-4">
                             <p className="text-sm text-slate-500 mb-4 line-clamp-2 h-10">{tpl.description || "No description available."}</p>
                             <div className="flex flex-wrap gap-1 mb-3">
                                {tpl.tags?.slice(0,3).map(tag => (
                                    <span key={tag} className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-md text-[10px] font-medium">{tag}</span>
                                ))}
                            </div>
                            <div className="flex items-center space-x-4 text-xs text-slate-500 bg-slate-50 p-2 rounded border border-slate-100">
                                <span className="flex items-center" title="Inputs"><LogIn size={12} className="mr-1"/> {tpl.parameters?.length || 0} Inputs</span>
                                <span className="flex items-center" title="Outputs"><LogOut size={12} className="mr-1"/> {tpl.outputs?.length || 0} Outputs</span>
                            </div>
                         </div>

                         <button onClick={(e) => { e.stopPropagation(); handleUseTemplate(tpl); }} className="w-full py-2 border border-slate-200 rounded-lg hover:bg-blue-50 hover:border-blue-200 text-sm font-medium text-slate-600 hover:text-blue-600 flex justify-center items-center space-x-2 transition-colors">
                             <Copy size={14}/><span>{t('library.useTemplate')}</span>
                         </button>
                     </div>
                 ))}
                 {filteredTemplates.length === 0 && (
                     <div className="col-span-3 p-12 text-center border-2 border-dashed border-slate-200 rounded-xl text-slate-400">
                         <Code size={48} className="mx-auto mb-4 opacity-20"/>
                         <p>{t('library.noTemplates')}</p>
                     </div>
                 )}
             </div>
        )}
      </div>

      {/* DETAIL & TEST MODAL */}
      {viewingAction && (
          <ActionDetails 
             action={viewingAction} 
             onClose={() => setViewingAction(null)}
             onUseTemplate={handleUseTemplate}
             onEdit={(a) => { setViewingAction(null); handleEditCustom(a as unknown as Script); }}
          />
      )}

      {/* DELETE WARNING MODAL */}
      {deleteWarning && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-6 animate-fade-in">
              <div className="bg-white w-full max-w-md rounded-xl shadow-2xl p-6">
                  <div className="flex items-center space-x-3 mb-4 text-red-600">
                      <AlertTriangle size={28}/>
                      <h3 className="text-xl font-bold">Cannot Delete Script(s)</h3>
                  </div>
                  <p className="text-slate-600 text-sm mb-4">
                      Some selected scripts are currently in use by Test Cases or Workflows. To prevent system instability, referenced scripts cannot be deleted until the reference is removed.
                  </p>
                  
                  <div className="bg-red-50 border border-red-100 rounded-lg p-4 mb-6 max-h-40 overflow-y-auto">
                      <h4 className="text-xs font-bold text-red-700 uppercase mb-2">Blocked Items:</h4>
                      <ul className="list-disc pl-4 space-y-1">
                          {deleteWarning.blocked.map((msg, i) => (
                              <li key={i} className="text-xs text-red-800">{msg}</li>
                          ))}
                      </ul>
                  </div>

                  <div className="flex justify-end space-x-3">
                      <button onClick={() => setDeleteWarning(null)} className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium">Cancel</button>
                      {deleteWarning.safe.length > 0 && (
                          <button onClick={confirmPartialDelete} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium">
                              Delete {deleteWarning.safe.length} Safe Item(s)
                          </button>
                      )}
                  </div>
              </div>
          </div>
      )}

      {/* EDITOR MODAL */}
      {showEditor && (
          <ActionEditor 
             initialScript={editingScript} 
             isReadOnly={isReadOnlyView} 
             onSave={handleSaveScript} 
             onCancel={() => setShowEditor(false)} 
          />
      )}
    </div>
  );
};