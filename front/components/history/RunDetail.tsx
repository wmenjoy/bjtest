
import React from 'react';
import { TestRun, ExecutionStatus } from '../../types';
import { FileText, Terminal } from 'lucide-react';
import { useConfig } from '../../ConfigContext';

interface RunDetailProps {
    run: TestRun | null;
}

export const RunDetail: React.FC<RunDetailProps> = ({ run }) => {
    const { t } = useConfig();

    if (!run) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                <FileText size={48} className="mb-4 opacity-20"/>
                <p>{t('history.select')}</p>
            </div>
        );
    }

    return (
        <div className="flex-1 bg-white flex flex-col overflow-hidden">
            <div className="p-6 border-b border-slate-200 flex justify-between items-start bg-slate-50/50">
                <div>
                    <div className="flex items-center space-x-3 mb-2">
                        <h2 className="text-xl font-bold text-slate-800">{run.name}</h2>
                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${run.status === ExecutionStatus.PASSED ? 'bg-green-100 text-green-700' : run.status === ExecutionStatus.FAILED ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                            {run.status}
                        </span>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-slate-500">
                        <span>ID: {run.id}</span>
                        <span>Case ID: {run.caseId}</span>
                        <span>Time: {new Date(run.executedAt).toLocaleString()}</span>
                        {run.environmentName && <span className="bg-slate-200 px-2 py-0.5 rounded text-xs text-slate-600">{run.environmentName}</span>}
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Notes */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <h4 className="text-sm font-bold text-slate-700 mb-2 flex items-center"><FileText size={14} className="mr-2"/> {t('history.notes')}</h4>
                    <p className="text-sm text-slate-600 leading-relaxed">
                        {run.notes || "No notes provided for this run."}
                    </p>
                </div>

                {/* Logs / Steps */}
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 flex justify-between items-center">
                        <h4 className="text-sm font-bold text-slate-700 flex items-center"><Terminal size={14} className="mr-2"/> {t('history.logs')}</h4>
                    </div>
                    <div className="bg-slate-900 text-slate-300 p-4 font-mono text-xs overflow-x-auto max-h-[500px]">
                        {run.logs && run.logs.length > 0 ? (
                            run.logs.map((log, idx) => (
                                <div key={idx} className="mb-1 border-b border-slate-800 pb-1 last:border-0">
                                    <span className="text-slate-500 mr-3">[{idx + 1}]</span>
                                    <span className={`${log.includes('Error') || log.includes('Failed') ? 'text-red-400' : log.includes('Success') || log.includes('Passed') ? 'text-green-400' : 'text-slate-300'}`}>
                                        {log}
                                    </span>
                                </div>
                            ))
                        ) : (
                            <div className="text-slate-500 italic">{t('history.noLogs')}</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
