
import React from 'react';
import { GitMerge, Code, AlignLeft } from 'lucide-react';
import { useConfig } from '../../ConfigContext';
import { Workflow } from '../../types';

interface LabHeaderProps {
    mode: 'workflows' | 'scripts';
    setMode: (mode: 'workflows' | 'scripts') => void;
    layout: 'horizontal' | 'vertical';
    setLayout: (layout: 'horizontal' | 'vertical') => void;
    viewMode: 'visual' | 'code';
    setViewMode: (mode: 'visual' | 'code') => void;
    selectedWorkflow: Workflow | null;
}

export const LabHeader: React.FC<LabHeaderProps> = ({ 
    mode, setMode, layout, setLayout, viewMode, setViewMode, selectedWorkflow 
}) => {
    const { t } = useConfig();

    return (
        <div className="h-12 border-b border-slate-200 flex px-4 bg-slate-50 justify-between items-center z-10 relative shrink-0">
             <div className="flex h-full">
                 <button onClick={() => setMode('workflows')} className={`px-4 h-full text-sm font-medium border-b-2 flex items-center space-x-2 transition-colors ${mode === 'workflows' ? 'border-indigo-600 text-indigo-700 bg-white' : 'border-transparent text-slate-500 hover:text-indigo-600'}`}>
                     <GitMerge size={16} /><span>{t('lab.pipelines')}</span>
                 </button>
                 <button onClick={() => setMode('scripts')} className={`px-4 h-full text-sm font-medium border-b-2 flex items-center space-x-2 transition-colors ${mode === 'scripts' ? 'border-indigo-600 text-indigo-700 bg-white' : 'border-transparent text-slate-500 hover:text-indigo-600'}`}>
                     <Code size={16} /><span>{t('lab.actions')}</span>
                 </button>
             </div>
             {mode === 'workflows' && selectedWorkflow && (
                 <div className="flex items-center space-x-2">
                     <div className="flex bg-slate-200 p-0.5 rounded-lg mr-4">
                        <button onClick={() => setLayout('horizontal')} className={`p-1 rounded transition-colors ${layout === 'horizontal' ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-700'}`} title="Horizontal Layout"><AlignLeft className="rotate-90" size={14}/></button>
                        <button onClick={() => setLayout('vertical')} className={`p-1 rounded transition-colors ${layout === 'vertical' ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-700'}`} title="Vertical Layout"><AlignLeft size={14}/></button>
                     </div>
                     <div className="flex bg-slate-200 p-0.5 rounded-lg">
                         <button onClick={() => setViewMode('visual')} className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${viewMode === 'visual' ? 'bg-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>{t('lab.visual')}</button>
                         <button onClick={() => setViewMode('code')} className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${viewMode === 'code' ? 'bg-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>{t('lab.yaml')}</button>
                     </div>
                 </div>
             )}
         </div>
    );
};
