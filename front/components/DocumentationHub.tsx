
import React, { useState } from 'react';
import { Workflow, ApiEndpoint, BusinessRule, Script } from '../types';
import { useConfig } from '../ConfigContext';
import { Database, Globe, GitMerge, Book, Plus, Trash2, ArrowRight } from 'lucide-react';

// Mock Initial Data
const MOCK_API_ENDPOINTS: ApiEndpoint[] = [
    { id: 'api-1', method: 'POST', path: '/api/v1/auth/login', summary: 'User Login', description: 'Authenticates a user and returns a JWT.', parameters: [{name: 'email', in: 'body', type: 'string', required: true}] },
    { id: 'api-2', method: 'GET', path: '/api/v1/products', summary: 'List Products', description: 'Returns paged list of products.', parameters: [{name: 'page', in: 'query', type: 'number', required: false}] }
];

const MOCK_BUSINESS_RULES: BusinessRule[] = [
    { id: 'br-1', title: 'Order Validation', rule: 'An order cannot be placed if inventory is < quantity requested.', impact: 'High' },
    { id: 'br-2', title: 'Discount Policy', rule: 'Users with "VIP" tag get 10% off automatically.', impact: 'Medium' }
];

interface DocumentationHubProps {
    workflows: Workflow[];
    projectId: string;
}

export const DocumentationHub: React.FC<DocumentationHubProps> = ({ workflows, projectId }) => {
    const { t } = useConfig();
    const [activeSection, setActiveSection] = useState<'models' | 'logic' | 'api' | 'workflows'>('models');
    
    // Local state for managing simple docs
    const [apis, setApis] = useState<ApiEndpoint[]>(MOCK_API_ENDPOINTS);
    const [rules, setRules] = useState<BusinessRule[]>(MOCK_BUSINESS_RULES);

    const addRule = () => {
        const text = prompt("Enter Business Rule:");
        if (text) {
            setRules([...rules, { id: `br-${Date.now()}`, title: 'New Rule', rule: text, impact: 'Medium' }]);
        }
    };

    const addApi = () => {
        const path = prompt("Enter API Path (e.g. /api/users):");
        if (path) {
            setApis([...apis, { id: `api-${Date.now()}`, method: 'GET', path, summary: 'New Endpoint', description: 'Description here...' }]);
        }
    };

    const deleteItem = (setFunc: Function, list: any[], id: string) => {
        if (confirm("Remove this item?")) {
            setFunc(list.filter(i => i.id !== id));
        }
    };

    return (
        <div className="flex h-full bg-slate-50">
            {/* Sub-Sidebar */}
            <div className="w-64 bg-white border-r border-slate-200 flex flex-col">
                <div className="p-6 border-b border-slate-100">
                    <h2 className="text-xl font-bold text-slate-800">{t('doc.title')}</h2>
                    <p className="text-xs text-slate-400 mt-1">Project Knowledge Base</p>
                </div>
                <nav className="p-4 space-y-1">
                    <button onClick={() => setActiveSection('models')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeSection === 'models' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}>
                        <Database size={18}/><span>{t('doc.models')}</span>
                    </button>
                    <button onClick={() => setActiveSection('logic')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeSection === 'logic' ? 'bg-amber-50 text-amber-700' : 'text-slate-600 hover:bg-slate-50'}`}>
                        <Book size={18}/><span>{t('doc.logic')}</span>
                    </button>
                    <button onClick={() => setActiveSection('api')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeSection === 'api' ? 'bg-purple-50 text-purple-700' : 'text-slate-600 hover:bg-slate-50'}`}>
                        <Globe size={18}/><span>{t('doc.api')}</span>
                    </button>
                    <button onClick={() => setActiveSection('workflows')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeSection === 'workflows' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}>
                        <GitMerge size={18}/><span>{t('doc.workflows')}</span>
                    </button>
                </nav>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto p-8">
                {activeSection === 'models' && (
                    <div className="max-w-4xl mx-auto">
                        <div className="mb-6">
                            <h1 className="text-2xl font-bold text-slate-800">{t('doc.models')}</h1>
                            <p className="text-slate-500">System entity definitions and data schemas.</p>
                        </div>
                        
                        <div className="space-y-6">
                            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                                <h3 className="text-lg font-bold text-slate-800 mb-4">System Entities</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {['User', 'Role', 'Project', 'Organization', 'TestCase', 'TestRun', 'Environment'].map(entity => (
                                        <div key={entity} className="p-4 bg-slate-50 rounded border border-slate-100 flex items-center justify-between">
                                            <span className="font-mono font-bold text-slate-700">{entity}</span>
                                            <span className="text-xs text-slate-400 bg-white px-2 py-1 rounded border border-slate-200">System Core</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            
                            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                                <h3 className="text-lg font-bold text-slate-800 mb-4">Database Schemas</h3>
                                <div className="text-center py-8 text-slate-400 bg-slate-50 rounded border border-dashed border-slate-200">
                                    <Database size={32} className="mx-auto mb-2 opacity-20"/>
                                    <p>View live schema details in the <span className="font-bold">Data Schema</span> tab.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeSection === 'logic' && (
                    <div className="max-w-4xl mx-auto">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h1 className="text-2xl font-bold text-slate-800">{t('doc.logic')}</h1>
                                <p className="text-slate-500">Core business rules and constraints.</p>
                            </div>
                            <button onClick={addRule} className="flex items-center space-x-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 font-medium shadow-sm">
                                <Plus size={16}/><span>Add Rule</span>
                            </button>
                        </div>

                        <div className="grid gap-4">
                            {rules.map(rule => (
                                <div key={rule.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative group">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-bold text-slate-800">{rule.title}</h3>
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${rule.impact === 'High' ? 'bg-red-100 text-red-700' : 'bg-blue-50 text-blue-700'}`}>{rule.impact} Impact</span>
                                    </div>
                                    <p className="text-slate-600 text-sm leading-relaxed">{rule.rule}</p>
                                    <button onClick={() => deleteItem(setRules, rules, rule.id)} className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 p-2 text-slate-300 hover:text-red-500 transition-opacity">
                                        <Trash2 size={16}/>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeSection === 'api' && (
                     <div className="max-w-4xl mx-auto">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h1 className="text-2xl font-bold text-slate-800">{t('doc.api')}</h1>
                                <p className="text-slate-500">Service endpoints and contracts.</p>
                            </div>
                            <button onClick={addApi} className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium shadow-sm">
                                <Plus size={16}/><span>Add Endpoint</span>
                            </button>
                        </div>

                        <div className="space-y-4">
                            {apis.map(api => (
                                <div key={api.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm group">
                                    <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                        <div className="flex items-center space-x-3">
                                            <span className={`px-2 py-1 rounded text-xs font-bold w-16 text-center ${api.method === 'GET' ? 'bg-blue-100 text-blue-700' : api.method === 'POST' ? 'bg-green-100 text-green-700' : api.method === 'DELETE' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>{api.method}</span>
                                            <span className="font-mono text-sm font-medium text-slate-700">{api.path}</span>
                                        </div>
                                        <button onClick={() => deleteItem(setApis, apis, api.id)} className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-opacity"><Trash2 size={16}/></button>
                                    </div>
                                    <div className="p-4">
                                        <p className="text-sm font-bold text-slate-800 mb-1">{api.summary}</p>
                                        <p className="text-sm text-slate-500 mb-4">{api.description}</p>
                                        
                                        {api.parameters && api.parameters.length > 0 && (
                                            <div className="bg-slate-50 rounded p-3">
                                                <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Parameters</h4>
                                                <div className="space-y-1">
                                                    {api.parameters.map(p => (
                                                        <div key={p.name} className="flex text-xs">
                                                            <span className="font-mono text-slate-700 w-24">{p.name}</span>
                                                            <span className="text-slate-400 w-16">{p.in}</span>
                                                            <span className="text-blue-600">{p.type}</span>
                                                            {p.required && <span className="text-red-500 ml-2">*</span>}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                     </div>
                )}

                {activeSection === 'workflows' && (
                     <div className="max-w-4xl mx-auto">
                        <div className="mb-6">
                            <h1 className="text-2xl font-bold text-slate-800">{t('doc.workflows')}</h1>
                            <p className="text-slate-500">{t('doc.generated')}</p>
                        </div>

                        <div className="space-y-6">
                            {workflows.map(wf => (
                                <div key={wf.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <div className="flex items-center space-x-2 mb-1">
                                                <GitMerge size={20} className="text-indigo-600"/>
                                                <h3 className="text-lg font-bold text-slate-800">{wf.name}</h3>
                                            </div>
                                            <p className="text-sm text-slate-500">{wf.description || "No description provided."}</p>
                                        </div>
                                        <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded font-medium">{wf.nodes.length} Nodes</span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-6 text-sm">
                                        <div>
                                            <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Inputs</h4>
                                            {wf.inputSchema && wf.inputSchema.length > 0 ? (
                                                <ul className="space-y-1">
                                                    {wf.inputSchema.map(i => (
                                                        <li key={i.name} className="flex items-center text-slate-600">
                                                            <span className="font-mono text-xs bg-slate-100 px-1 rounded mr-2">{i.name}</span>
                                                            <span className="text-xs text-slate-400">{i.type}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : <span className="text-slate-400 italic">No inputs defined.</span>}
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Process Flow</h4>
                                            <div className="flex flex-wrap gap-2">
                                                {wf.nodes.map((n, i) => (
                                                    <div key={n.id} className="flex items-center">
                                                        <span className="px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs text-slate-700">{n.name}</span>
                                                        {i < wf.nodes.length - 1 && <ArrowRight size={12} className="mx-1 text-slate-300"/>}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {workflows.length === 0 && (
                                <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-xl text-slate-400">
                                    {t('doc.noWorkflows')}
                                </div>
                            )}
                        </div>
                     </div>
                )}
            </div>
        </div>
    );
};
