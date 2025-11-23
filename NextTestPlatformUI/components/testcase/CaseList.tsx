
import React, { useState } from 'react';
import { TestCase, Priority } from '../../types';
import { Search, Sparkles, Plus, MoreHorizontal, Workflow as WorkflowIcon, Bot } from 'lucide-react';
import { useConfig } from '../../ConfigContext';

interface CaseListProps {
    cases: TestCase[];
    selectedCaseId: string | null;
    onSelectCase: (c: TestCase) => void;
    onEditCase: (c: TestCase) => void;
    onAddCase: () => void;
    onGenerateAI: () => void;
}

export const CaseList: React.FC<CaseListProps> = ({ cases, selectedCaseId, onSelectCase, onEditCase, onAddCase, onGenerateAI }) => {
    const { t } = useConfig();
    const [searchTerm, setSearchTerm] = useState('');

    const filteredCases = cases.filter(c => c.title.toLowerCase().includes(searchTerm.toLowerCase()));

    const priorityColors = {
        [Priority.LOW]: 'bg-slate-100 text-slate-600',
        [Priority.MEDIUM]: 'bg-blue-50 text-blue-600',
        [Priority.HIGH]: 'bg-orange-50 text-orange-600',
        [Priority.CRITICAL]: 'bg-red-50 text-red-600',
    };

    return (
        <div className="w-1/3 min-w-[300px] border-r border-slate-200 flex flex-col bg-white">
            <div className="p-4 border-b border-slate-100 space-y-3">
                <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-slate-700">{t('testCase.cases')}</h3>
                    <div className="flex space-x-2">
                        <button onClick={onGenerateAI} className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors" title={t('testCase.generateAI')}>
                            <Sparkles size={18} />
                        </button>
                        <button onClick={onAddCase} className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
                            <Plus size={18} />
                        </button>
                    </div>
                </div>
                <div className="relative">
                    <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
                    <input 
                        type="text" 
                        placeholder={t('testCase.filter')}
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                </div>
            </div>
            <div className="flex-1 overflow-y-auto">
                {filteredCases.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-sm">
                        {searchTerm ? 'No matching cases.' : t('testCase.noCases')}
                    </div>
                ) : (
                    filteredCases.map(tc => (
                        <div 
                            key={tc.id}
                            onClick={() => onSelectCase(tc)}
                            className={`p-4 border-b border-slate-50 cursor-pointer hover:bg-slate-50 transition-colors group ${selectedCaseId === tc.id ? 'bg-blue-50/50 border-l-4 border-l-blue-500' : 'border-l-4 border-l-transparent'}`}
                        >
                            <div className="flex justify-between items-start mb-1">
                                <span className="text-xs font-mono text-slate-400">{tc.id}</span>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${priorityColors[tc.priority]}`}>{tc.priority}</span>
                            </div>
                            <h4 className="text-sm font-medium text-slate-800 line-clamp-1">{tc.title}</h4>
                            <div className="flex justify-between items-center mt-2">
                                <span className="text-[10px] text-slate-400">{tc.steps.length} {t('testCase.steps')}</span>
                                <div className="flex space-x-2">
                                    {tc.linkedWorkflowId ? <WorkflowIcon size={14} className="text-indigo-500"/> : tc.steps.some(s => s.linkedScriptId) && <Bot size={14} className="text-purple-500" />}
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); onEditCase(tc); }}
                                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-blue-600"
                                    >
                                        <MoreHorizontal size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
