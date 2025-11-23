
import React from 'react';
import { TestStep, Script, Workflow } from '../../../types';
import { Bot, Trash2, GitBranch, Repeat, LogOut, Workflow as WorkflowIcon, ArrowRight, Box } from 'lucide-react';
import { useConfig } from '../../../ConfigContext';

interface ExecutableDef {
    id: string;
    name: string;
    _kind: 'SCRIPT' | 'WORKFLOW';
    parameters?: any[];
    outputs?: any[];
}

interface StepItemProps {
    step: TestStep;
    index: number;
    isSelected: boolean;
    executables: ExecutableDef[];
    contextVariables: string[];
    onSelect: () => void;
    onUpdate: (field: keyof TestStep, value: any) => void;
    onRemove: () => void;
}

export const StepItem: React.FC<StepItemProps> = ({ 
    step, index, isSelected, executables, contextVariables, onSelect, onUpdate, onRemove 
}) => {
    const { t } = useConfig();

    // Identify current linked action/workflow
    const currentExecutableId = step.linkedWorkflowId || step.linkedScriptId;
    const currentExecutable = executables.find(e => e.id === currentExecutableId);

    const updateParam = (key: string, value: string) => {
        const newParams = { ...(step.parameterValues || {}) };
        if (value) newParams[key] = value;
        else delete newParams[key];
        onUpdate('parameterValues', newParams);
    };

    const updateOutput = (key: string, value: string) => {
        const newOutputs = { ...(step.outputMapping || {}) };
        if (value) newOutputs[key] = value;
        else delete newOutputs[key];
        onUpdate('outputMapping', newOutputs);
    };

    return (
        <div className="flex flex-col items-center relative group w-full px-12">
             <div 
                onClick={onSelect}
                className={`w-full max-w-4xl bg-white rounded-xl shadow-sm border transition-all cursor-pointer z-10 relative overflow-hidden
                    ${isSelected ? 'border-blue-500 ring-4 ring-blue-50/50 shadow-md' : 'border-slate-200 hover:border-blue-300'}
                `}
            >
                {/* Header / Main Config */}
                <div className="flex items-stretch border-b border-slate-100">
                    {/* Index & Icon */}
                    <div className={`w-12 flex items-center justify-center border-r border-slate-100 ${currentExecutable?._kind === 'WORKFLOW' ? 'bg-indigo-50 text-indigo-600' : 'bg-purple-50 text-purple-600'}`}>
                        {currentExecutable?._kind === 'WORKFLOW' ? <WorkflowIcon size={20} /> : <Bot size={20} />}
                    </div>
                    
                    {/* Main Fields */}
                    <div className="flex-1 p-4 flex flex-col gap-3">
                        <div className="flex justify-between items-start">
                            <div className="flex-1 mr-4">
                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Step Name</label>
                                <input 
                                    className="w-full bg-transparent border-none p-0 focus:ring-0 text-sm font-bold text-slate-800 placeholder-slate-300"
                                    value={step.summary || ''}
                                    onChange={e => onUpdate('summary', e.target.value)}
                                    placeholder="e.g. Login User"
                                />
                            </div>
                            <div className="flex-1">
                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Action / Workflow</label>
                                <select 
                                    className="w-full p-1.5 text-sm border border-slate-200 rounded bg-slate-50 focus:bg-white focus:border-blue-500 outline-none transition-all font-medium text-slate-700"
                                    value={currentExecutableId || ''}
                                    onChange={e => onUpdate('linkedScriptId', e.target.value)}
                                >
                                    <option value="" disabled>Select Action...</option>
                                    <optgroup label="Workflows">
                                        {executables.filter(e => e._kind === 'WORKFLOW').map(e => (
                                            <option key={e.id} value={e.id}>{e.name}</option>
                                        ))}
                                    </optgroup>
                                    <optgroup label="Scripts">
                                        {executables.filter(e => e._kind === 'SCRIPT').map(e => (
                                            <option key={e.id} value={e.id}>{e.name}</option>
                                        ))}
                                    </optgroup>
                                </select>
                            </div>
                            <div className="ml-4">
                                 <button onClick={(e) => {e.stopPropagation(); onRemove();}} className="p-2 text-slate-300 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"><Trash2 size={16}/></button>
                            </div>
                        </div>
                        
                        {/* Logic Bar */}
                        <div className="flex items-center space-x-4 pt-2 mt-1 border-t border-slate-50">
                             <div className="flex items-center space-x-2 bg-amber-50 px-2 py-1 rounded border border-amber-100">
                                <GitBranch size={12} className="text-amber-600"/>
                                <input 
                                    className="bg-transparent border-none p-0 text-xs w-32 focus:ring-0 text-amber-800 placeholder-amber-400/70" 
                                    placeholder="Run Condition (opt)"
                                    value={step.condition || ''}
                                    onChange={e => onUpdate('condition', e.target.value)}
                                />
                            </div>
                            <div className="flex items-center space-x-2 bg-orange-50 px-2 py-1 rounded border border-orange-100">
                                <Repeat size={12} className="text-orange-600"/>
                                <input 
                                    className="bg-transparent border-none p-0 text-xs w-32 focus:ring-0 text-orange-800 placeholder-orange-400/70" 
                                    placeholder="Loop Array (opt)"
                                    value={step.loopOver || ''}
                                    onChange={e => onUpdate('loopOver', e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Parameter & Output Mapping Area */}
                {currentExecutable && (
                    <div className="grid grid-cols-2 divide-x divide-slate-100 bg-slate-50/50">
                        {/* Inputs */}
                        <div className="p-4">
                            <div className="flex items-center justify-between mb-3">
                                <h4 className="text-[10px] font-bold text-slate-400 uppercase flex items-center"><Box size={12} className="mr-1.5"/> Input Parameters</h4>
                                <span className="text-[10px] text-slate-400 px-1.5 py-0.5 bg-slate-100 rounded">{currentExecutable.parameters?.length || 0}</span>
                            </div>
                            
                            <div className="space-y-2">
                                {(currentExecutable.parameters || []).map((param: any) => (
                                    <div key={param.name} className="flex items-center space-x-2">
                                        <div className="w-1/3 text-xs font-medium text-slate-600 truncate" title={param.name}>{param.name}</div>
                                        <div className="flex-1 relative group">
                                            <input 
                                                className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded bg-white focus:border-blue-400 outline-none text-blue-600 font-mono"
                                                placeholder={param.defaultValue ? `(default: ${param.defaultValue})` : 'Value / {{var}}'}
                                                value={step.parameterValues?.[param.name] || ''}
                                                onChange={e => updateParam(param.name, e.target.value)}
                                            />
                                            {/* Variable autocomplete suggestion could go here */}
                                            <div className="hidden group-hover:block absolute z-20 right-0 top-full mt-1 w-48 bg-white border border-slate-200 shadow-lg rounded max-h-32 overflow-y-auto">
                                                {contextVariables.map(v => (
                                                    <div 
                                                        key={v} 
                                                        className="px-2 py-1 text-xs hover:bg-blue-50 cursor-pointer text-slate-600 truncate"
                                                        onClick={() => updateParam(param.name, v)}
                                                    >
                                                        {v}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {(!currentExecutable.parameters || currentExecutable.parameters.length === 0) && (
                                    <div className="text-xs text-slate-400 italic p-2 text-center">No parameters required.</div>
                                )}
                            </div>
                        </div>

                        {/* Outputs */}
                        <div className="p-4">
                             <div className="flex items-center justify-between mb-3">
                                <h4 className="text-[10px] font-bold text-slate-400 uppercase flex items-center"><LogOut size={12} className="mr-1.5"/> Output Mapping</h4>
                                <span className="text-[10px] text-slate-400 px-1.5 py-0.5 bg-slate-100 rounded">{currentExecutable.outputs?.length || 0}</span>
                            </div>

                            <div className="space-y-2">
                                {(currentExecutable.outputs || []).map((out: any) => (
                                    <div key={out.name} className="flex items-center space-x-2">
                                        <div className="w-1/3 text-xs font-medium text-slate-600 truncate" title={out.name}>{out.name}</div>
                                        <ArrowRight size={10} className="text-slate-300"/>
                                        <input 
                                            className="flex-1 px-2 py-1.5 text-xs border border-slate-200 rounded bg-white focus:border-cyan-400 outline-none text-cyan-700 font-mono placeholder-slate-300"
                                            placeholder="Save to variable..."
                                            value={step.outputMapping?.[out.name] || ''}
                                            onChange={e => updateOutput(out.name, e.target.value)}
                                        />
                                    </div>
                                ))}
                                 {(!currentExecutable.outputs || currentExecutable.outputs.length === 0) && (
                                    <div className="text-xs text-slate-400 italic p-2 text-center">No outputs available.</div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
