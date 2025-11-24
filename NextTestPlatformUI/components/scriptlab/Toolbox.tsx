
import React from 'react';
import { NodeType, NodeConfig } from '../../types';
import { X, GitBranch, Repeat, GitMerge, Globe, Plug, Database, HardDrive, Search, Activity, Terminal, Sparkles, Monitor } from 'lucide-react';
import { useConfig } from '../../ConfigContext';

interface ToolboxProps {
    visible: boolean;
    onClose: () => void;
    onAddNode: (type: NodeType, configOverride?: Partial<NodeConfig>) => void;
}

export const Toolbox: React.FC<ToolboxProps> = ({ visible, onClose, onAddNode }) => {
    const { t } = useConfig();

    const tools = [
        { category: 'Logic & Flow', items: [{ type: NodeType.CONDITION, icon: GitBranch, label: 'If / Else', bg: 'bg-amber-50' }, { type: NodeType.LOOP, icon: Repeat, label: 'Loop', bg: 'bg-orange-50' }, { type: NodeType.CALL_WORKFLOW, icon: GitMerge, label: 'Sub Flow', bg: 'bg-indigo-100' }, { type: NodeType.BRANCH, icon: GitBranch, label: 'Branch', bg: 'bg-purple-50' }, { type: NodeType.MERGE, icon: GitMerge, label: 'Merge', bg: 'bg-teal-50' }] },
        { category: 'Integration', items: [{ type: NodeType.HTTP_REQUEST, icon: Globe, label: 'HTTP', bg: 'bg-blue-50' }, { type: NodeType.RPC_CALL, icon: Plug, label: 'RPC', bg: 'bg-cyan-50' }, { type: NodeType.MCP_TOOL, icon: Plug, label: 'MCP Tool', bg: 'bg-green-50' }] },
        { category: 'Data & Store', items: [{ type: NodeType.DB_QUERY, icon: Database, label: 'SQL', bg: 'bg-emerald-50' }, { type: NodeType.REDIS_CMD, icon: HardDrive, label: 'Redis', bg: 'bg-red-50' }, { type: NodeType.ES_QUERY, icon: Search, label: 'Elastic', bg: 'bg-yellow-50' }] },
        { category: 'Infrastructure', items: [{ type: NodeType.KAFKA_PUB, icon: Activity, label: 'Kafka', bg: 'bg-slate-100' }, { type: NodeType.SHELL_CMD, icon: Terminal, label: 'Shell', bg: 'bg-zinc-200' }] },
        { category: 'AI & Agents', items: [{ type: NodeType.LLM_PROMPT, icon: Sparkles, label: 'Gemini', bg: 'bg-purple-50' }, { type: NodeType.BROWSER_ACTION, icon: Monitor, label: 'Browser', bg: 'bg-pink-50' }] },
    ];

    return (
        <div className={`absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-white/95 backdrop-blur border border-slate-200 shadow-2xl rounded-2xl p-3 flex flex-col transition-all duration-300 w-full max-w-3xl z-30 ${visible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0 pointer-events-none'}`}>
            <div className="flex items-center justify-between px-2 mb-2 border-b border-slate-100 pb-1">
                <span className="text-[10px] font-bold text-slate-400">{t('lab.addNode')}</span>
                <button onClick={onClose} className="text-slate-400 hover:text-red-500 transition-colors"><X size={12}/></button>
            </div>
            <div className="flex justify-between gap-4 px-2">
                {tools.map((category, idx) => (
                    <div key={idx} className="flex flex-col space-y-2 flex-1">
                        <span className="text-[9px] font-bold text-slate-300 uppercase mb-1 border-b border-slate-100 pb-1">{category.category}</span>
                        <div className="flex flex-wrap gap-2">
                            {category.items.map((tool, tIdx) => (
                                <button key={tIdx} onClick={() => onAddNode(tool.type as NodeType, (tool as any).config)} className="flex flex-col items-center group w-10">
                                    <div className={`p-1.5 bg-slate-50 rounded-full ${tool.bg} mb-0.5 border border-slate-100 hover:border-slate-300 transition-colors shadow-sm`}>
                                        <tool.icon size={16} className="text-slate-500"/>
                                    </div>
                                    <span className="text-[8px] text-slate-400 text-center leading-tight truncate w-full">{tool.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
