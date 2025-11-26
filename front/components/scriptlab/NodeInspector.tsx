
import React, { useState } from 'react';
import { WorkflowNode } from '../../types';
import { DataBusPanel } from './DataBusPanel';
import { NodeConfigPanel } from './NodeConfigPanel';

interface UnifiedNodeInspectorProps {
    node: WorkflowNode;
    workflowNodes: WorkflowNode[];
    onUpdate: (n: WorkflowNode) => void;
    onClose: () => void;
}

export const NodeInspector: React.FC<UnifiedNodeInspectorProps> = ({ node, workflowNodes, onUpdate, onClose }) => {
    const [currentInputSetter, setCurrentInputSetter] = useState<((val: string) => void) | null>(null);

    const handleVariableInsert = (path: string) => {
        if (currentInputSetter) {
            currentInputSetter(path);
        } else {
            navigator.clipboard.writeText(path);
            alert(`Copied to clipboard: ${path}`);
        }
    };

    return (
        <div className="w-[800px] bg-white border-l border-slate-200 shadow-2xl flex h-full z-20 absolute right-0 top-0 bottom-0 animate-slide-in-right">
            <DataBusPanel 
                workflowNodes={workflowNodes}
                currentNodeId={node.id}
                onVariableInsert={handleVariableInsert}
            />
            <NodeConfigPanel 
                node={node}
                onUpdate={onUpdate}
                onClose={onClose}
                currentInputSetter={setCurrentInputSetter}
            />
        </div>
    );
};
