
import React, { useMemo } from 'react';
import { WorkflowNode } from '../../types';
import { Layers } from 'lucide-react';
import { useConfig } from '../../ConfigContext';
import { NODE_SPECS, DEFAULT_NODE_SPEC } from './constants';
import { TreeItem } from './widgets';

interface DataBusPanelProps {
    workflowNodes: WorkflowNode[];
    currentNodeId: string;
    onVariableInsert: (path: string) => void;
}

export const DataBusPanel: React.FC<DataBusPanelProps> = ({ workflowNodes, currentNodeId, onVariableInsert }) => {
    const { t } = useConfig();

    const dataContext = useMemo(() => {
        const ctx: Record<string, any> = {};
        const flatten = (nodes: WorkflowNode[]) => {
            nodes.forEach(n => {
                if (n.id === currentNodeId) return;
                const nSpec = NODE_SPECS[n.type] || DEFAULT_NODE_SPEC;
                const safeName = n.name.replace(/\s+/g, '');
                ctx[safeName] = nSpec.outputMock || { id: "sample" };
                
                if (n.children) flatten(n.children);
                if (n.elseChildren) flatten(n.elseChildren);
            });
        };
        flatten(workflowNodes);
        return ctx;
    }, [workflowNodes, currentNodeId]);

    return (
        <div className="w-64 bg-slate-50 border-r border-slate-200 flex flex-col">
            <div className="p-3 border-b border-slate-200 font-bold text-xs text-slate-500 uppercase tracking-wider flex items-center">
                <Layers size={14} className="mr-2"/> {t('lab.dataContext')}
            </div>
            <div className="flex-1 overflow-y-auto p-2">
                <div className="mb-2 text-[10px] text-slate-400 px-2">
                    {t('lab.contextTip')}
                </div>
                {Object.keys(dataContext).length === 0 && (
                    <div className="p-4 text-center text-slate-400 text-xs italic">
                        {t('lab.noUpstream')}
                    </div>
                )}
                {Object.entries(dataContext).map(([nodeName, data]) => (
                    <div key={nodeName} className="mb-2">
                        <div className="font-bold text-xs text-slate-700 px-2 py-1 bg-slate-100 rounded mb-1">{nodeName}</div>
                        <TreeItem label="output" data={data} path={nodeName} onInsert={onVariableInsert} />
                    </div>
                ))}
            </div>
        </div>
    );
};
