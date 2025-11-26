
import React, { useState } from 'react';
import { Environment } from '../../types';
import { Copy, Trash2, Plus, Shield, Globe, Eye, EyeOff } from 'lucide-react';

interface EnvCardProps {
    env: Environment;
    isExpanded: boolean;
    showSecrets: Record<string, boolean>;
    onToggleExpand: () => void;
    onUpdate: (env: Environment) => void;
    onClone: (env: Environment) => void;
    onDelete: (id: string) => void;
    onToggleSecret: (key: string) => void;
}

export const EnvCard: React.FC<EnvCardProps> = ({ 
    env, isExpanded, showSecrets, onToggleExpand, onUpdate, onClone, onDelete, onToggleSecret 
}) => {
    const [newVarKey, setNewVarKey] = useState("");
    const [newVarVal, setNewVarVal] = useState("");
    const [newVarSecret, setNewVarSecret] = useState(false);

    const addVariable = () => {
        if (!newVarKey) return;
        const newVars = [...env.variables, { key: newVarKey, value: newVarVal, isSecret: newVarSecret }];
        onUpdate({ ...env, variables: newVars });
        setNewVarKey("");
        setNewVarVal("");
        setNewVarSecret(false);
    };

    const deleteVariable = (idx: number) => {
        const newVars = [...env.variables];
        newVars.splice(idx, 1);
        onUpdate({ ...env, variables: newVars });
    };

    return (
        <div className={`border rounded-lg transition-all ${isExpanded ? 'border-purple-200 bg-purple-50/30' : 'border-slate-200 hover:border-purple-200'}`}>
            <div 
                className="flex items-center justify-between p-4 cursor-pointer"
                onClick={onToggleExpand}
            >
                <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${env.color}`}></div>
                    <span className="font-bold text-slate-700">{env.name}</span>
                    <span className="text-xs text-slate-400">({env.variables.length} vars)</span>
                </div>
                <div className="flex items-center space-x-4">
                    {!isExpanded && <span className="text-xs text-slate-400">Click to edit variables</span>}
                    <button onClick={(e) => { e.stopPropagation(); onClone(env); }} className="text-slate-400 hover:text-blue-500 p-1" title="Clone Environment"><Copy size={16}/></button>
                    <button onClick={(e) => { e.stopPropagation(); onDelete(env.id); }} className="text-slate-400 hover:text-red-500 p-1"><Trash2 size={16}/></button>
                </div>
            </div>

            {isExpanded && (
                <div className="p-4 border-t border-slate-200 bg-white rounded-b-lg">
                    <div className="flex space-x-2 mb-4">
                        <input 
                            className="flex-1 p-2 text-sm border border-slate-200 rounded" 
                            placeholder="Key (e.g. BASE_URL)" 
                            value={newVarKey} 
                            onChange={e => setNewVarKey(e.target.value)}
                        />
                        <input 
                            className="flex-1 p-2 text-sm border border-slate-200 rounded" 
                            placeholder="Value" 
                            type={newVarSecret ? "password" : "text"}
                            value={newVarVal} 
                            onChange={e => setNewVarVal(e.target.value)}
                        />
                        <button 
                            onClick={() => setNewVarSecret(!newVarSecret)}
                            className={`p-2 border border-slate-200 rounded ${newVarSecret ? 'bg-slate-800 text-white' : 'text-slate-400'}`}
                            title="Toggle Secret"
                        >
                            {newVarSecret ? <Shield size={16}/> : <Globe size={16}/>}
                        </button>
                        <button onClick={addVariable} className="px-4 py-2 bg-purple-600 text-white rounded text-sm font-medium hover:bg-purple-700"><Plus size={16}/></button>
                    </div>
                    <div className="space-y-2">
                        {env.variables.map((v, idx) => (
                            <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 rounded border border-slate-100">
                                <span className="text-sm font-mono font-bold text-slate-600 w-1/3">{v.key}</span>
                                <div className="flex-1 flex items-center space-x-2">
                                    <span className="text-sm font-mono text-slate-500 truncate max-w-[200px]">
                                        {v.isSecret && !showSecrets[`${env.id}-${idx}`] ? '••••••••' : v.value}
                                    </span>
                                    {v.isSecret && (
                                        <button onClick={() => onToggleSecret(`${env.id}-${idx}`)} className="text-slate-400 hover:text-blue-600">
                                            {showSecrets[`${env.id}-${idx}`] ? <EyeOff size={14}/> : <Eye size={14}/>}
                                        </button>
                                    )}
                                    {v.isSecret && <span title="Secret Variable"><Shield size={12} className="text-amber-500 ml-2"/></span>}
                                </div>
                                <button onClick={() => deleteVariable(idx)} className="text-slate-300 hover:text-red-500"><Trash2 size={14}/></button>
                            </div>
                        ))}
                        {env.variables.length === 0 && <div className="text-center text-xs text-slate-400 py-2">No variables defined.</div>}
                    </div>
                </div>
            )}
        </div>
    );
};
