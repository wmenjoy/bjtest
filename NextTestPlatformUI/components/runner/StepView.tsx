
import React from 'react';
import { TestStep, ExecutionStatus } from '../../types';
import { Bot, Workflow, Terminal, Loader2, CheckCircle, GitBranch, Repeat } from 'lucide-react';
import { useConfig } from '../../ConfigContext';

interface StepViewProps {
    step: TestStep | undefined;
    isCompleted: boolean;
    logs: string[];
    autoExecuting: boolean;
    notes: string;
    onNotesChange: (notes: string) => void;
    replaceVariables: (text: string | undefined | null) => string;
}

export const StepView: React.FC<StepViewProps> = ({ step, isCompleted, logs, autoExecuting, notes, onNotesChange, replaceVariables }) => {
    const { t } = useConfig();

    if (isCompleted || !step) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center py-12 animate-fade-in">
                <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-green-200"><CheckCircle size={40} /></div>
                <h3 className="text-2xl font-bold text-slate-800 mb-2">{t('runner.completed')}</h3>
                <p className="text-slate-500">You can now submit the test run results.</p>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="grid grid-cols-1 gap-6">
                <div className={`p-6 rounded-xl border shadow-sm transition-all ${step.linkedScriptId || step.linkedWorkflowId ? 'bg-purple-50/50 border-purple-100' : 'bg-white border-slate-200'}`}>
                    <div className="flex items-center space-x-2 mb-3">
                        {step.linkedScriptId ? <Bot className="text-purple-600" size={20}/> : 
                        step.linkedWorkflowId ? <Workflow className="text-indigo-600" size={20}/> :
                        <div className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-bold text-slate-500">{t('testCase.manualStep')}</div>}
                        
                        <h4 className={`text-xs font-bold uppercase tracking-wider ${step.linkedScriptId || step.linkedWorkflowId ? 'text-purple-600' : 'text-slate-500'}`}>
                            {step.linkedScriptId ? t('runner.automated') : step.linkedWorkflowId ? t('runner.subflow') : t('runner.manual')}
                        </h4>
                    </div>
                    <p className="text-xl text-slate-800 font-medium leading-relaxed">{replaceVariables(step.instruction || step.name || step.summary || 'No instruction')}</p>
                    
                    {step.condition && (
                        <div className="mt-2 flex items-center text-xs text-amber-600 bg-amber-50 w-max px-2 py-1 rounded border border-amber-100">
                            <GitBranch size={12} className="mr-1"/> Condition: {step.condition}
                        </div>
                    )}
                    
                    {(step.linkedScriptId || step.linkedWorkflowId) && (
                        <div className="mt-6 bg-slate-900 rounded-lg p-4 font-mono text-xs text-slate-300 shadow-inner min-h-[120px] border border-slate-800 relative overflow-hidden">
                            <div className="absolute top-0 left-0 right-0 h-6 bg-slate-800/50 flex items-center px-3 border-b border-slate-700 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                                <Terminal size={10} className="mr-1.5"/> {t('runner.console')}
                            </div>
                            <div className="mt-4 space-y-1">
                                {autoExecuting && <div className="flex items-center text-yellow-400 animate-pulse"><Loader2 size={12} className="animate-spin mr-2"/> {t('runner.executing')}</div>}
                                {logs.map((log, i) => (
                                    <div key={i} className="opacity-90 break-all">{log}</div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-blue-400"></div>
                    <h4 className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">{t('testCase.expectedResult')}</h4>
                    <p className="text-lg text-blue-900 font-medium leading-relaxed">{replaceVariables(step.expectedResult || 'Verify step executes successfully')}</p>
                </div>
            </div>
            <div>
                <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">{t('runner.notes')}</label>
                <textarea 
                    className="w-full p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm bg-white shadow-sm transition-all"
                    value={notes}
                    onChange={e => onNotesChange(e.target.value)}
                    rows={3}
                    placeholder="Add any observations here..."
                />
            </div>
        </div>
    );
};
