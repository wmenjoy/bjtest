
import React, { useState } from 'react';
import { TestCase, Status } from '../../types';
import { FileText, Play, Bot, GitBranch, Repeat, Workflow, Trash2, Globe, Terminal, Settings } from 'lucide-react';
import { useConfig } from '../../ConfigContext';
import { ViewModeSwitcher, ViewMode } from './ViewModeSwitcher';
import { WorkflowView } from './workflow/WorkflowView';

interface CaseDetailProps {
    testCase: TestCase | null;
    onEdit: () => void;
    onRun: () => void;
    onDelete?: (caseId: string) => void;
}

export const CaseDetail: React.FC<CaseDetailProps> = ({ testCase, onEdit, onRun, onDelete }) => {
    const { t } = useConfig();
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [viewMode, setViewMode] = useState<ViewMode>('list');

    const handleDelete = () => {
        if (testCase && onDelete) {
            onDelete(testCase.id);
            setShowDeleteConfirm(false);
        }
    };

    // Get type indicator
    const getTypeIndicator = () => {
        if (!testCase) return null;
        if (testCase.linkedWorkflowId || testCase.automationType === 'WORKFLOW') {
            return { icon: <Workflow size={14} />, label: 'Workflow', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
        }
        // Check if it's HTTP or Command based on steps
        const firstStep = testCase.steps[0];
        if (firstStep?.parameterValues?.method) {
            return { icon: <Globe size={14} />, label: 'HTTP', color: 'bg-blue-50 text-blue-700 border-blue-200' };
        }
        if (firstStep?.parameterValues?.command) {
            return { icon: <Terminal size={14} />, label: 'Command', color: 'bg-amber-50 text-amber-700 border-amber-200' };
        }
        return { icon: <Bot size={14} />, label: 'Manual', color: 'bg-slate-50 text-slate-700 border-slate-200' };
    };

    if (!testCase) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                <FileText size={48} className="mb-4 opacity-50" />
                <p>{t('testCase.select')}</p>
            </div>
        );
    }

    const typeInfo = getTypeIndicator();

    return (
        <div className="flex-1 flex flex-col bg-slate-50/30 overflow-hidden">
            <div className="p-6 border-b border-slate-200 bg-white flex justify-between items-start">
                <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                        <h2 className="text-xl font-bold text-slate-800 truncate">{testCase.title}</h2>
                        <span className={`text-xs px-2 py-1 rounded-full border ${testCase.status === Status.ACTIVE ? 'bg-green-50 border-green-200 text-green-700' : 'bg-slate-100 border-slate-200 text-slate-500'}`}>
                            {testCase.status}
                        </span>
                        {typeInfo && (
                            <span className={`text-xs px-2 py-1 rounded-full border flex items-center space-x-1 ${typeInfo.color}`}>
                                {typeInfo.icon}
                                <span>{typeInfo.label}</span>
                            </span>
                        )}
                    </div>
                    <p className="text-slate-500 text-sm line-clamp-2">{testCase.description || "No description provided."}</p>
                </div>
                <div className="flex space-x-2 ml-4">
                    <button onClick={onEdit} className="px-3 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 text-sm font-medium">{t('testCase.edit')}</button>
                    {onDelete && (
                        <button
                            onClick={() => setShowDeleteConfirm(true)}
                            className="px-3 py-2 bg-white border border-red-200 text-red-600 rounded-lg hover:bg-red-50 text-sm font-medium flex items-center space-x-1"
                        >
                            <Trash2 size={14} />
                            <span>Delete</span>
                        </button>
                    )}
                    <button onClick={onRun} className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-md shadow-blue-200 transition-all"><Play size={16} /><span>{t('testCase.run')}</span></button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Workflow Type - Show linked workflow info */}
                {(testCase.linkedWorkflowId || testCase.automationType === 'WORKFLOW') ? (
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 bg-indigo-50 flex justify-between items-center">
                            <h3 className="font-semibold text-indigo-700 flex items-center space-x-2">
                                <Workflow size={18} />
                                <span>Linked Workflow</span>
                            </h3>
                        </div>
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <p className="text-sm text-slate-500 mb-1">Workflow ID</p>
                                    <p className="font-mono text-sm bg-slate-100 px-3 py-1.5 rounded">{testCase.linkedWorkflowId}</p>
                                </div>
                                <button className="px-3 py-2 bg-indigo-50 text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-100 text-sm font-medium flex items-center space-x-1">
                                    <Settings size={14} />
                                    <span>View Workflow</span>
                                </button>
                            </div>
                            <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
                                <p className="text-xs text-slate-500 uppercase font-bold mb-2">Execution Mode</p>
                                <p className="text-sm text-slate-700">This test case will execute the linked workflow with full step tracking and real-time logging.</p>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* HTTP/Command/Manual Type - Show steps */
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                            <h3 className="font-semibold text-slate-700">{t('testCase.definition')}</h3>
                            <ViewModeSwitcher currentMode={viewMode} onChange={setViewMode} />
                        </div>

                        {viewMode === 'list' ? (
                            /* List View */
                            <div className="divide-y divide-slate-100">
                                {testCase.steps.length > 0 ? testCase.steps.map((step, idx) => (
                                    <div key={step.id} className="p-4 grid grid-cols-12 gap-4 group hover:bg-slate-50/50 transition-colors">
                                        <div className="col-span-1 flex flex-col items-center pt-1 text-slate-300">
                                            <span className="text-xs font-bold">#{idx + 1}</span>
                                            <div className="mt-2">
                                                {step.linkedWorkflowId ? <Workflow size={16} className="text-indigo-500"/> : <Bot size={16} className="text-purple-500" />}
                                            </div>
                                        </div>
                                        <div className="col-span-11">
                                            <div className="flex justify-between items-start mb-2">
                                                <h5 className="text-sm font-bold text-slate-800">{step.summary || `Step ${idx + 1}`}</h5>
                                                <div className="flex items-center space-x-2">
                                                     {step.condition && (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-100">
                                                            <GitBranch size={10} className="mr-1" /> If {step.condition}
                                                        </span>
                                                    )}
                                                    {step.loopOver && (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-orange-50 text-orange-700 border border-orange-100">
                                                            <Repeat size={10} className="mr-1" /> Loop: {step.loopOver}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Param Visualization */}
                                            <div className="bg-slate-50 rounded border border-slate-100 p-2 text-xs font-mono text-slate-600 grid grid-cols-2 gap-4">
                                                <div>
                                                    <span className="text-[10px] text-slate-400 uppercase font-sans font-bold mb-1 block">Inputs</span>
                                                    {step.parameterValues && Object.keys(step.parameterValues).length > 0 ? (
                                                        Object.entries(step.parameterValues).map(([k,v]) => (
                                                            <div key={k} className="flex space-x-1"><span className="text-slate-500">{k}:</span> <span className="text-blue-600 truncate max-w-[150px]">{String(v)}</span></div>
                                                        ))
                                                    ) : <span className="text-slate-400 italic">-</span>}
                                                </div>
                                                <div>
                                                    <span className="text-[10px] text-slate-400 uppercase font-sans font-bold mb-1 block">Outputs</span>
                                                    {step.outputMapping && Object.keys(step.outputMapping).length > 0 ? (
                                                        Object.entries(step.outputMapping).map(([k,v]) => (
                                                            <div key={k} className="flex space-x-1"><span className="text-slate-500">{k}</span> <span className="text-slate-300">→</span> <span className="text-cyan-600">{v}</span></div>
                                                        ))
                                                    ) : <span className="text-slate-400 italic">-</span>}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )) : <div className="p-8 text-center text-slate-400">No steps defined for this test case</div>}
                            </div>
                        ) : (
                            /* Workflow View */
                            <div className="p-6 overflow-y-auto max-h-[600px]">
                                <WorkflowView steps={testCase.steps} />
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
                    <div className="fixed inset-0" onClick={() => setShowDeleteConfirm(false)}></div>
                    <div
                        className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 animate-slide-in-right"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-6">
                            <h3 className="text-xl font-bold text-slate-800 mb-2">Delete Test Case?</h3>
                            <p className="text-slate-600 text-sm">
                                Are you sure you want to delete "<strong>{testCase?.title}</strong>"?
                                This action cannot be undone.
                            </p>
                        </div>
                        <div className="flex justify-end space-x-3 p-6 border-t border-slate-200 bg-slate-50">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-sm"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
