
import React, { useEffect, useRef } from 'react';
import { Workflow as WorkflowIcon, Terminal, Loader2, Check, XCircle, AlertCircle, Sparkles } from 'lucide-react';
import { useConfig } from '../../ConfigContext';

interface WorkflowLogItem {
    nodeId: string;
    message: string;
    status: 'RUNNING' | 'DONE' | 'ERROR';
}

interface WorkflowViewProps {
    logs: WorkflowLogItem[];
    progress: number;
    onAnalyzeError: () => void;
}

export const WorkflowView: React.FC<WorkflowViewProps> = ({ logs, progress, onAnalyzeError }) => {
    const { t } = useConfig();
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if(scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs]);

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-center py-6">
                <div className="bg-indigo-50 rounded-full p-6 animate-pulse border border-indigo-100 shadow-sm">
                    <WorkflowIcon size={48} className="text-indigo-600"/>
                </div>
            </div>
            <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-xl overflow-hidden flex flex-col h-[500px]">
                    <div className="px-4 py-3 border-b border-slate-800 bg-slate-950 flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center"><Terminal size={12} className="mr-2"/> {t('runner.log')}</span>
                        {progress === 100 && <span className="text-xs text-green-400 font-bold">COMPLETED</span>}
                    </div>
                    <div className="flex-1 p-6 font-mono text-sm space-y-3 overflow-y-auto" ref={scrollRef}>
                    {logs.map((log, idx) => (
                        <div key={idx} className="flex items-start space-x-4 border-b border-slate-800/50 pb-2 last:border-0 animate-fade-in">
                            <span className="text-slate-600 text-xs pt-1 select-none w-20 text-right">{new Date().toLocaleTimeString([], {hour12: false, hour:'2-digit', minute:'2-digit', second:'2-digit'})}</span>
                            <div className="flex-1">
                                <div className={`flex items-center ${log.status === 'RUNNING' ? 'text-yellow-400' : log.status === 'DONE' ? 'text-green-400' : 'text-red-400'}`}>
                                    {log.status === 'RUNNING' ? <Loader2 size={14} className="animate-spin mr-2"/> : 
                                    log.status === 'DONE' ? <Check size={14} className="mr-2"/> : 
                                    <XCircle size={14} className="mr-2"/>}
                                    <span>{log.message}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                    {logs.some(l => l.status === 'ERROR') && (
                        <div className="pt-6 mt-4 border-t border-slate-800">
                                <div className="text-red-500 font-bold mb-3 flex items-center"><AlertCircle size={16} className="mr-2"/> Workflow Execution Failed</div>
                                <button 
                                onClick={onAnalyzeError} 
                                className="text-xs bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 flex items-center w-max transition-colors shadow-lg shadow-purple-900/20"
                                >
                                    <Sparkles size={14} className="mr-2"/> {t('runner.analyze')}
                                </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
