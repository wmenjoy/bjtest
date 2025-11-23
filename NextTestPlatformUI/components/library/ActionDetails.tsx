
import React, { useState } from 'react';
import { ActionDef } from './types';
import { Box, Zap, Copy, Edit3, Info, Code, Play, LogIn, LogOut } from 'lucide-react';
import { useConfig } from '../../ConfigContext';
import { ScriptType } from '../../types';
import { ActionTestBench } from './ActionTestBench';

interface ActionDetailsProps {
    action: ActionDef;
    onClose: () => void;
    onUseTemplate: (action: ActionDef) => void;
    onEdit: (action: ActionDef) => void;
}

export const ActionDetails: React.FC<ActionDetailsProps> = ({ action, onClose, onUseTemplate, onEdit }) => {
    const { t } = useConfig();
    const [detailsTab, setDetailsTab] = useState<'overview' | 'source' | 'test'>('overview');

    const handleSaveExample = () => {
        if (!action || action.isBuiltIn) return;
        alert("Example saved to local definition!");
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-6 animate-fade-in">
            <div className="bg-white w-full max-w-4xl h-[80vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-white">
                    <div className="flex items-center space-x-4">
                        <div className={`p-2 rounded-lg ${action.type === ScriptType.PYTHON ? 'bg-yellow-50 text-yellow-600' : 'bg-blue-50 text-blue-600'}`}>
                            {action.isBuiltIn ? <Box size={24}/> : <Zap size={24}/>}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800">{action.name}</h2>
                            <div className="flex items-center space-x-2 text-sm text-slate-500">
                                <span className="font-mono px-1.5 py-0.5 bg-slate-100 rounded text-xs">{action.type}</span>
                                <span>•</span>
                                <span>{action.isBuiltIn ? 'Built-in Module' : action.isTemplate ? 'Template Reference' : 'Custom Action'}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center space-x-3">
                        <button onClick={onClose} className="px-4 py-2 text-slate-500 hover:text-slate-700 font-medium">{t('library.close')}</button>
                        {action.isTemplate ? (
                            <button 
                                onClick={() => onUseTemplate(action)}
                                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center space-x-2 shadow-md"
                            >
                                <Copy size={16}/><span>{t('library.useTemplate')}</span>
                            </button>
                        ) : !action.isBuiltIn && (
                            <button 
                                onClick={() => onEdit(action)}
                                className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-medium flex items-center space-x-2 shadow-md"
                            >
                                <Edit3 size={16}/><span>{t('library.edit')}</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Sub-Nav */}
                <div className="flex px-6 border-b border-slate-100 bg-slate-50">
                    {[
                        { id: 'overview', label: t('library.definition'), icon: Info },
                        { id: 'source', label: action.isBuiltIn ? 'Documentation' : t('library.source'), icon: Code },
                        { id: 'test', label: t('library.test'), icon: Play }
                    ].map(tab => (
                        <button 
                            key={tab.id} 
                            onClick={() => setDetailsTab(tab.id as any)}
                            className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${detailsTab === tab.id ? 'border-blue-600 text-blue-700 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                        >
                            <tab.icon size={14}/><span>{tab.label}</span>
                        </button>
                    ))}
                </div>
                
                <div className="flex-1 overflow-hidden bg-slate-50 p-6">
                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm h-full overflow-hidden flex flex-col">
                        
                        {/* TAB: OVERVIEW (INTERFACE) */}
                        {detailsTab === 'overview' && (
                            <div className="flex-1 overflow-y-auto p-6">
                                <div className="mb-8">
                                    <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">{t('library.desc')}</h4>
                                    <p className="text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-lg border border-slate-100">
                                        {action.description || "No description provided for this action."}
                                    </p>
                                </div>
                                
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    {/* Inputs Definition Table */}
                                    <div>
                                        <div className="flex items-center justify-between mb-3">
                                            <h4 className="text-xs font-bold text-slate-400 uppercase flex items-center"><LogIn size={14} className="mr-2"/> {t('library.inputs')}</h4>
                                            <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded">{action.parameters.length}</span>
                                        </div>
                                        <div className="border border-slate-200 rounded-lg overflow-hidden">
                                            <table className="w-full text-sm text-left">
                                                <thead className="bg-slate-50 text-slate-500 text-xs uppercase border-b border-slate-200">
                                                    <tr>
                                                        <th className="px-4 py-2">Name</th>
                                                        <th className="px-4 py-2">Type</th>
                                                        <th className="px-4 py-2">Default</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {action.parameters.map(p => (
                                                        <tr key={p.name}>
                                                            <td className="px-4 py-2 font-mono font-bold text-slate-700">{p.name}</td>
                                                            <td className="px-4 py-2 text-xs text-slate-500">{p.type}</td>
                                                            <td className="px-4 py-2 font-mono text-xs text-slate-400">{p.defaultValue || '-'}</td>
                                                        </tr>
                                                    ))}
                                                    {action.parameters.length === 0 && (
                                                        <tr><td colSpan={3} className="p-4 text-center text-slate-400 italic">No inputs defined.</td></tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                    
                                    {/* Outputs Definition Table */}
                                    <div>
                                        <div className="flex items-center justify-between mb-3">
                                            <h4 className="text-xs font-bold text-slate-400 uppercase flex items-center"><LogOut size={14} className="mr-2"/> {t('library.outputs')}</h4>
                                            <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded">{action.outputs?.length || 0}</span>
                                        </div>
                                        <div className="border border-slate-200 rounded-lg overflow-hidden">
                                            <table className="w-full text-sm text-left">
                                                <thead className="bg-slate-50 text-slate-500 text-xs uppercase border-b border-slate-200">
                                                    <tr>
                                                        <th className="px-4 py-2">Property</th>
                                                        <th className="px-4 py-2">Type</th>
                                                        <th className="px-4 py-2">Desc</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {(action.outputs || []).map(o => (
                                                        <tr key={o.name}>
                                                            <td className="px-4 py-2 font-mono font-bold text-slate-700">{o.name}</td>
                                                            <td className="px-4 py-2 text-xs text-slate-500">{o.type}</td>
                                                            <td className="px-4 py-2 text-xs text-slate-400 truncate max-w-[100px]">{o.description || '-'}</td>
                                                        </tr>
                                                    ))}
                                                    {(!action.outputs || action.outputs.length === 0) && (
                                                        <tr><td colSpan={3} className="p-4 text-center text-slate-400 italic">No outputs defined.</td></tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB: SOURCE CODE / DOCS */}
                        {detailsTab === 'source' && (
                            <div className="flex-1 flex flex-col bg-[#1e1e1e] relative">
                                {action.isBuiltIn ? (
                                    <div className="p-8 text-slate-400 flex flex-col items-center justify-center h-full">
                                        <div className="p-4 bg-slate-800 rounded-full mb-4"><Info size={32}/></div>
                                        <p className="text-lg font-medium text-slate-300 mb-2">Native Module</p>
                                        <p className="text-sm text-center max-w-md">
                                            This action is provided by the NexTest Pro core engine. Its implementation is handled by the backend runner and cannot be modified directly.
                                        </p>
                                        <div className="mt-8 p-4 bg-slate-800/50 border border-slate-700 rounded-lg font-mono text-xs text-blue-300">
                                            Runner Handler: {action.type}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-4 overflow-auto flex-1">
                                        <pre className="font-mono text-sm text-blue-100 whitespace-pre-wrap leading-relaxed">{action.content}</pre>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* TAB: TEST BENCH */}
                        {detailsTab === 'test' && (
                            <ActionTestBench action={action} onSaveExample={handleSaveExample} />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
