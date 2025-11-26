
import React, { useState, useEffect } from 'react';
import { Script, ScriptType } from '../../types';
import { Code, LogIn, LogOut, Zap, X, AlertCircle, Save } from 'lucide-react';
import { useConfig } from '../../ConfigContext';
import { ParamListEditor } from './ParamListEditor';

interface ActionEditorProps {
    initialScript: Partial<Script>;
    isReadOnly?: boolean;
    onSave: (script: Partial<Script>) => void;
    onCancel: () => void;
    inline?: boolean;
}

export const ActionEditor: React.FC<ActionEditorProps> = ({ initialScript, isReadOnly = false, onSave, onCancel, inline = false }) => {
    const { t } = useConfig();
    const [editingScript, setEditingScript] = useState<Partial<Script>>(initialScript);
    const [editorTab, setEditorTab] = useState<'code' | 'inputs' | 'outputs'>('code');
    const [validationError, setValidationError] = useState<string | null>(null);

    // Sync state when initialScript changes (e.g. selecting a different item in list)
    useEffect(() => {
        setEditingScript(initialScript);
        setValidationError(null);
        setEditorTab('code');
    }, [initialScript.id]);

    const handleSave = () => {
        if (!editingScript.name?.trim()) {
            setValidationError("Script Name is required.");
            return;
        }
        if (!editingScript.content?.trim()) {
            setValidationError("Script Content cannot be empty.");
            return;
        }
        onSave(editingScript);
    };

    const EditorContent = (
        <div className={`flex flex-col h-full bg-white ${!inline ? 'rounded-xl shadow-2xl overflow-hidden w-full max-w-6xl h-[90vh]' : ''}`}>
            {/* Header */}
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 flex-shrink-0">
                <div className="flex items-center space-x-4 flex-1">
                    <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg"><Zap size={20}/></div>
                    {isReadOnly ? (
                        <h3 className="font-bold text-lg text-slate-800">{editingScript.name}</h3>
                    ) : (
                        <input 
                            className="bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 focus:outline-none text-lg font-bold text-slate-800 transition-colors placeholder-slate-400 w-full max-w-md"
                            placeholder="Action Name (e.g. ValidateUser)"
                            value={editingScript.name}
                            onChange={e => setEditingScript({...editingScript, name: e.target.value})}
                        />
                    )}
                </div>
                <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2 bg-white px-3 py-1.5 rounded border border-slate-200">
                        <span className="text-xs font-bold text-slate-500 uppercase mr-2">Executor:</span>
                        {!isReadOnly ? (
                            <select 
                                className="border-none bg-transparent text-sm font-medium text-slate-700 focus:ring-0 cursor-pointer outline-none"
                                value={editingScript.type}
                                onChange={e => setEditingScript({...editingScript, type: e.target.value as ScriptType})}
                            >
                                <option value={ScriptType.PYTHON}>Python Runner</option>
                                <option value={ScriptType.JAVASCRIPT}>Node.js Runner</option>
                                <option value={ScriptType.SHELL}>Shell Runner</option>
                                <option value={ScriptType.TEMPLATE}>Template</option>
                            </select>
                        ) : <span className="text-sm font-medium">{editingScript.type}</span>}
                    </div>
                    {!inline && (
                        <button onClick={onCancel} className="p-2 hover:bg-slate-200 rounded text-slate-500"><X size={20}/></button>
                    )}
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex border-b border-slate-200 bg-white px-4 flex-shrink-0">
                {[
                    {id: 'code', label: t('library.source'), icon: Code},
                    {id: 'inputs', label: t('library.inputs'), icon: LogIn},
                    {id: 'outputs', label: t('library.outputs'), icon: LogOut},
                ].map(tab => (
                    <button 
                        key={tab.id}
                        onClick={() => setEditorTab(tab.id as any)}
                        className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${editorTab === tab.id ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                    >
                        <tab.icon size={14}/><span>{tab.label}</span>
                        {tab.id === 'inputs' && editingScript.parameters && editingScript.parameters.length > 0 && <span className="ml-1 px-1.5 bg-slate-100 rounded-full text-[10px]">{editingScript.parameters.length}</span>}
                        {tab.id === 'outputs' && editingScript.outputs && editingScript.outputs.length > 0 && <span className="ml-1 px-1.5 bg-slate-100 rounded-full text-[10px]">{editingScript.outputs.length}</span>}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="flex-1 flex overflow-hidden">
                <div className="flex-1 relative flex flex-col bg-slate-50 overflow-hidden">
                    {editorTab === 'code' && (
                        <div className="flex-1 flex flex-col bg-[#1e1e1e]">
                            <textarea 
                                className="flex-1 w-full h-full p-6 font-mono text-sm bg-[#1e1e1e] text-slate-300 focus:outline-none resize-none leading-relaxed"
                                value={editingScript.content}
                                onChange={e => setEditingScript({...editingScript, content: e.target.value})}
                                readOnly={isReadOnly}
                                spellCheck={false}
                            />
                        </div>
                    )}

                    {editorTab === 'inputs' && (
                        <div className="flex-1 overflow-y-auto p-8">
                            <div className="max-w-3xl mx-auto">
                                <div className="mb-4 text-sm text-slate-600">Define the variables this action expects to receive.</div>
                                <ParamListEditor 
                                    type="Input" 
                                    items={editingScript.parameters || []} 
                                    onChange={items => setEditingScript({...editingScript, parameters: items})}
                                />
                            </div>
                        </div>
                    )}

                    {editorTab === 'outputs' && (
                        <div className="flex-1 overflow-y-auto p-8">
                            <div className="max-w-3xl mx-auto">
                                <div className="mb-4 text-sm text-slate-600">Define the structured data this action will return.</div>
                                <ParamListEditor 
                                    type="Output" 
                                    items={editingScript.outputs || []} 
                                    onChange={items => setEditingScript({...editingScript, outputs: items})}
                                />
                            </div>
                        </div>
                    )}
                </div>
                
                {/* Sidebar: Metadata */}
                {!isReadOnly && (
                    <div className="w-80 border-l border-slate-200 bg-white p-6 overflow-y-auto">
                        <h4 className="text-xs font-bold text-slate-500 uppercase mb-6">{t('library.settings')}</h4>
                        
                        <div className="mb-6">
                            <label className="block text-xs font-bold text-slate-700 mb-2">{t('library.desc')}</label>
                            <textarea 
                                className="w-full p-3 text-sm border border-slate-200 rounded-lg resize-none h-24 focus:border-blue-500 outline-none bg-slate-50 focus:bg-white transition-colors"
                                placeholder="What does this action do?"
                                value={editingScript.description || ''}
                                onChange={e => setEditingScript({...editingScript, description: e.target.value})}
                            />
                        </div>

                        <div className="mb-6">
                            <label className="block text-xs font-bold text-slate-700 mb-2">Configuration</label>
                            <div className="flex items-center space-x-2 mb-2">
                                <input 
                                    type="checkbox" 
                                    checked={editingScript.isTemplate} 
                                    onChange={e => setEditingScript({...editingScript, isTemplate: e.target.checked})}
                                    className="rounded text-blue-600 w-4 h-4"
                                />
                                <span className="text-sm text-slate-700">Save as Template</span>
                            </div>
                        </div>

                        <div className="mb-6">
                            <label className="block text-xs font-bold text-slate-700 mb-2">{t('library.tags')}</label>
                            <div className="flex flex-wrap gap-2 mb-3">
                                {editingScript.tags?.map(t => (
                                    <span key={t} className="px-2 py-1 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded text-xs flex items-center font-medium">
                                        {t}
                                        <button onClick={() => setEditingScript({...editingScript, tags: editingScript.tags?.filter(tag => tag !== t)})} className="ml-1 hover:text-red-500"><X size={12}/></button>
                                    </span>
                                ))}
                            </div>
                            <input 
                                className="w-full p-2 border border-slate-200 rounded text-sm"
                                placeholder="Type tag & hit Enter"
                                onKeyDown={e => {
                                    if(e.key === 'Enter') {
                                        const val = e.currentTarget.value.trim();
                                        if(val && !editingScript.tags?.includes(val)) {
                                            setEditingScript({...editingScript, tags: [...(editingScript.tags||[]), val]});
                                            e.currentTarget.value = '';
                                        }
                                    }
                                }}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-200 bg-white flex justify-between items-center flex-shrink-0">
                <div className="text-red-500 text-sm flex items-center font-medium">
                    {validationError && <><AlertCircle size={16} className="mr-2"/>{validationError}</>}
                </div>
                <div className="flex space-x-3">
                    {!inline && (
                        <button onClick={onCancel} className="px-5 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium">
                            {isReadOnly ? 'Close' : 'Cancel'}
                        </button>
                    )}
                    {!isReadOnly && (
                        <button onClick={handleSave} className="px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg text-sm font-medium shadow-md shadow-blue-200 flex items-center space-x-2 transition-all">
                            <Save size={16}/><span>{t('library.save')}</span>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );

    if (inline) {
        return (
            <div className="flex-1 h-full w-full overflow-hidden relative bg-white">
                {EditorContent}
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
            {EditorContent}
        </div>
    );
};
