
import React from 'react';
import { Variable, CheckSquare, Trash2, Plus } from 'lucide-react';
import { useConfig } from '../../../ConfigContext';

interface EditorSidebarProps {
    variables: Record<string, string>;
    preconditions: string[];
    onUpdateVariable: (key: string, val: string) => void;
    onRemoveVariable: (key: string) => void;
    onAddVariable: () => void;
    onUpdatePrecondition: (idx: number, val: string) => void;
    onAddPrecondition: () => void;
}

export const EditorSidebar: React.FC<EditorSidebarProps> = ({ 
    variables, 
    preconditions, 
    onUpdateVariable, 
    onRemoveVariable, 
    onAddVariable,
    onUpdatePrecondition, 
    onAddPrecondition 
}) => {
    const { t } = useConfig();

    return (
        <div className="w-1/4 bg-slate-50 border-r border-slate-200 flex flex-col min-w-[250px]">
            <div className="p-4 border-b border-slate-200">
                <h4 className="text-xs font-bold text-slate-500 uppercase flex items-center"><Variable size={14} className="mr-2"/> {t('testCase.contextVars')}</h4>
            </div>
            <div className="p-4 space-y-4 overflow-y-auto flex-1">
                <div>
                    <p className="text-xs text-slate-400 mb-2">Define inputs available to all steps.</p>
                    <div className="space-y-2">
                        {Object.entries(variables || {}).map(([k, v]) => (
                            <div key={k} className="flex items-center space-x-2">
                                <input className="w-1/3 p-1.5 text-xs bg-white border border-slate-300 rounded font-bold text-slate-700" value={k} disabled />
                                <span className="text-slate-400">:</span>
                                <input className="flex-1 p-1.5 text-xs bg-white border border-slate-300 rounded text-blue-600 font-mono" value={v} onChange={e => onUpdateVariable(k, e.target.value)} />
                                <button onClick={() => onRemoveVariable(k)} className="text-slate-400 hover:text-red-500"><Trash2 size={12}/></button>
                            </div>
                        ))}
                        <button onClick={onAddVariable} className="flex items-center space-x-1 text-xs text-blue-600 hover:underline mt-2"><Plus size={12}/><span>{t('testCase.addVariable')}</span></button>
                    </div>
                </div>
                <hr className="border-slate-200"/>
                <div>
                     <h4 className="text-xs font-bold text-slate-500 uppercase flex items-center mb-2"><CheckSquare size={14} className="mr-2"/> {t('testCase.preconditions')}</h4>
                     <div className="space-y-2">
                         {(preconditions || []).map((pre, idx) => (
                             <input key={idx} className="w-full p-2 text-xs border border-slate-200 rounded bg-white focus:border-blue-400 outline-none" value={pre} onChange={e => onUpdatePrecondition(idx, e.target.value)} placeholder="e.g. User is logged in" />
                         ))}
                         <button onClick={onAddPrecondition} className="text-xs text-slate-400 hover:text-blue-600 flex items-center"><Plus size={12} className="mr-1"/> {t('testCase.addCondition')}</button>
                     </div>
                </div>
            </div>
        </div>
    );
};
