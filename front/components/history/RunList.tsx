
import React, { useState } from 'react';
import { TestRun, ExecutionStatus } from '../../types';
import { Search, CheckCircle, XCircle, AlertTriangle, Clock } from 'lucide-react';
import { useConfig } from '../../ConfigContext';

interface RunListProps {
    runs: TestRun[];
    selectedRunId: string | undefined;
    onSelect: (run: TestRun) => void;
}

export const RunList: React.FC<RunListProps> = ({ runs, selectedRunId, onSelect }) => {
    const { t } = useConfig();
    const [filterStatus, setFilterStatus] = useState<string>('ALL');
    const [searchTerm, setSearchTerm] = useState('');

    const filteredRuns = runs.filter(run => {
        const matchesStatus = filterStatus === 'ALL' || run.status === filterStatus;
        const matchesSearch = run.name.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesStatus && matchesSearch;
    }).sort((a, b) => new Date(b.executedAt).getTime() - new Date(a.executedAt).getTime());

    const getStatusIcon = (status: ExecutionStatus) => {
        switch (status) {
            case ExecutionStatus.PASSED: return <CheckCircle size={16} className="text-green-500" />;
            case ExecutionStatus.FAILED: return <XCircle size={16} className="text-red-500" />;
            default: return <AlertTriangle size={16} className="text-amber-500" />;
        }
    };

    return (
        <div className="w-1/3 min-w-[300px] border-r border-slate-200 flex flex-col bg-slate-50">
            <div className="p-4 border-b border-slate-200 space-y-3">
                <div className="flex justify-between items-center">
                    <h3 className="font-bold text-slate-800">{t('history.title')}</h3>
                    <span className="text-xs bg-slate-200 px-2 py-1 rounded-full text-slate-600">{filteredRuns.length}</span>
                </div>
                <div className="relative">
                    <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                    <input 
                        className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                        placeholder={t('history.search')}
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex space-x-2 overflow-x-auto pb-1">
                    {['ALL', 'Passed', 'Failed', 'Skipped'].map(s => (
                        <button
                            key={s}
                            onClick={() => setFilterStatus(s === 'ALL' ? 'ALL' : s === 'Passed' ? ExecutionStatus.PASSED : s === 'Failed' ? ExecutionStatus.FAILED : ExecutionStatus.SKIPPED)}
                            className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${filterStatus === (s === 'ALL' ? 'ALL' : s === 'Passed' ? ExecutionStatus.PASSED : s === 'Failed' ? ExecutionStatus.FAILED : ExecutionStatus.SKIPPED) ? 'bg-slate-800 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}
                        >
                            {s}
                        </button>
                    ))}
                </div>
            </div>
            <div className="flex-1 overflow-y-auto">
                {filteredRuns.map(run => (
                    <div 
                        key={run.id}
                        onClick={() => onSelect(run)}
                        className={`p-4 border-b border-slate-100 cursor-pointer hover:bg-white transition-colors ${selectedRunId === run.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : 'border-l-4 border-l-transparent'}`}
                    >
                        <div className="flex justify-between items-start mb-1">
                            <div className="font-medium text-sm text-slate-800 line-clamp-1">{run.name}</div>
                            {getStatusIcon(run.status)}
                        </div>
                        <div className="flex items-center text-xs text-slate-400 mt-1">
                            <Clock size={12} className="mr-1" />
                            {new Date(run.executedAt).toLocaleString()}
                        </div>
                    </div>
                ))}
                {filteredRuns.length === 0 && (
                     <div className="p-8 text-center text-slate-400 text-sm italic">No runs found matching filter.</div>
                )}
            </div>
        </div>
    );
};
