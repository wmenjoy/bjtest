
import React from 'react';
import { Script, Workflow } from '../../types';
import { Plus, FileCode } from 'lucide-react';
import { useConfig } from '../../ConfigContext';

interface ScriptListProps {
    mode: 'workflows' | 'scripts';
    workflows: Workflow[];
    scripts: Script[];
    selectedWorkflow: Workflow | null;
    selectedScript: Script | null;
    onSelectWorkflow: (w: Workflow) => void;
    onSelectScript: (s: Script) => void;
    onAdd: () => void;
}

export const ScriptList: React.FC<ScriptListProps> = ({ 
    mode, workflows, scripts, selectedWorkflow, selectedScript, onSelectWorkflow, onSelectScript, onAdd 
}) => {
    const { t } = useConfig();

    return (
        <div className="w-64 border-r border-slate-200 flex flex-col bg-slate-50/50 flex-shrink-0">
            <div className="p-3 border-b border-slate-200 flex justify-between items-center">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">{mode === 'workflows' ? t('lab.pipelines') : t('lab.actions')}</h4>
                <button onClick={onAdd} className="p-1 hover:bg-slate-200 rounded transition-colors"><Plus size={16} className="text-indigo-600" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {mode === 'workflows' ? workflows.map(wf => (
                    <div key={wf.id} onClick={() => onSelectWorkflow(wf)} className={`p-3 rounded-lg cursor-pointer text-sm flex flex-col transition-colors ${selectedWorkflow?.id === wf.id ? 'bg-indigo-50 border border-indigo-100 shadow-sm' : 'hover:bg-slate-100 border border-transparent'}`}>
                        <div className="font-medium text-slate-700 mb-1">{wf.name}</div>
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] text-slate-400">{wf.nodes.length} nodes</span>
                        </div>
                    </div>
                )) : scripts.map(sc => (
                    <div key={sc.id} onClick={() => onSelectScript(sc)} className={`p-2 rounded-lg cursor-pointer text-sm flex items-center justify-between transition-colors ${selectedScript?.id === sc.id ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}>
                        <div className="flex items-center space-x-2 truncate"><FileCode size={14} /><span className="truncate">{sc.name}</span></div>
                    </div>
                ))}
            </div>
        </div>
    );
};
