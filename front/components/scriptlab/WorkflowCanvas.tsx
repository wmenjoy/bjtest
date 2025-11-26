
import React from 'react';
import { WorkflowNode, NodeType, ExecutionStatus } from '../../types';
import { NODE_SPECS, DEFAULT_NODE_SPEC } from './constants';
import { Plus, Trash2, Repeat } from 'lucide-react';
import { InsertionPoint } from '../../hooks/useWorkflowGraph';

interface WorkflowCanvasProps {
    nodes: WorkflowNode[];
    layout: 'horizontal' | 'vertical';
    selectedNodeId: string | null;
    insertionPoint: InsertionPoint | null;
    executionState: Record<string, 'pending' | 'running' | 'success' | 'error'>;
    onSelectNode: (id: string) => void;
    onRemoveNode: (id: string) => void;
    onSetInsertionPoint: (point: InsertionPoint | null) => void;
}

// Trigger Button for inserting new nodes
const InsertTrigger: React.FC<{ 
    parentId: string, 
    branch: 'children'|'elseChildren', 
    index: number, 
    layout: 'horizontal' | 'vertical',
    isSelected: boolean,
    onClick: (e: React.MouseEvent) => void
}> = ({ parentId, branch, index, layout, isSelected, onClick }) => {
    return (
        <div className={`flex items-center group relative z-0 transition-all ${layout === 'vertical' ? 'flex-col h-8 w-full justify-center py-1' : 'w-8 h-full justify-center px-1'}`}>
            <div className={`bg-slate-300 group-hover:bg-blue-300 transition-colors ${layout === 'vertical' ? 'w-0.5 h-full' : 'h-0.5 w-full'} ${isSelected ? 'bg-blue-500' : ''}`}></div>
            <button 
                onClick={onClick} 
                className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full flex items-center justify-center transition-all z-10 shadow-sm ${isSelected ? 'bg-blue-600 text-white scale-125 ring-2 ring-blue-200' : 'bg-white border border-slate-300 text-slate-400 opacity-0 group-hover:opacity-100 hover:border-blue-500 hover:text-blue-600'}`}
            >
                <Plus size={10} />
            </button>
        </div>
    );
};

// Node Visualization Card
const NodeCard: React.FC<{ 
    node: WorkflowNode, 
    isSelected: boolean, 
    executionStatus: 'pending' | 'running' | 'success' | 'error' | undefined,
    onSelect: () => void,
    onRemove: () => void
}> = ({ node, isSelected, executionStatus, onSelect, onRemove }) => {
    const spec = NODE_SPECS[node.type] || DEFAULT_NODE_SPEC;
    const Icon = spec.icon;

    return (
        <div onClick={(e) => { e.stopPropagation(); onSelect(); }} className={`relative px-3 py-2 rounded-lg border shadow-md ${spec.color.replace('text-', 'bg-').replace('600', '900')} border-slate-700 min-w-[160px] max-w-[200px] group cursor-pointer transition-all text-white ${isSelected ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-500 scale-105 z-10' : 'hover:ring-1 hover:ring-slate-400'}`}>
            {executionStatus === 'running' && <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full border-2 border-white animate-pulse"></div>}
            {executionStatus === 'success' && <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>}
            
            <div className="flex items-center justify-between mb-1">
                <div className="flex items-center space-x-2">
                    <Icon size={14} className="text-white/70"/>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 opacity-75">{spec.title}</span>
                </div>
                <button onClick={(e) => { e.stopPropagation(); onRemove(); }} className="text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={12} /></button>
            </div>
            <div className="font-medium text-sm truncate" title={node.name}>{node.name}</div>
        </div>
    );
};

const LoopContainer: React.FC<{ layout: 'horizontal' | 'vertical', children: React.ReactNode }> = ({ layout, children }) => (
    <div className={`relative border-2 border-dashed border-orange-300 rounded-xl p-2 bg-orange-50/30 ${layout === 'vertical' ? 'mt-2 pt-6' : 'ml-2 pl-6 flex items-center'}`}>
        <div className={`absolute text-[9px] font-bold text-orange-600 bg-orange-100 border border-orange-200 px-1.5 py-0.5 rounded flex items-center space-x-1 ${layout === 'vertical' ? '-top-3 left-1/2 -translate-x-1/2' : '-left-3 top-1/2 -translate-y-1/2 rotate-[-90deg]'}`}>
            <Repeat size={10}/><span>LOOP</span>
        </div>
        {children}
    </div>
);

// Recursive Renderer
export const WorkflowRenderer: React.FC<{ 
    nodes: WorkflowNode[], 
    parentId: string, 
    branch: 'children' | 'elseChildren',
    props: WorkflowCanvasProps 
}> = ({ nodes, parentId, branch, props }) => {
    const isVertical = props.layout === 'vertical';
    
    const handleInsertClick = (e: React.MouseEvent, index: number) => {
        e.stopPropagation();
        props.onSetInsertionPoint({ parentId, branch, index });
    };

    if (nodes.length === 0) {
        const isSelected = props.insertionPoint?.parentId === parentId && props.insertionPoint?.branch === branch && props.insertionPoint?.index === 0;
        return <InsertTrigger parentId={parentId} branch={branch} index={0} layout={props.layout} isSelected={!!isSelected} onClick={(e) => handleInsertClick(e, 0)} />;
    }

    return (
        <div className={`flex ${isVertical ? 'flex-col items-center' : 'items-center'}`}>
            {nodes.map((node, idx) => (
                <React.Fragment key={node.id}>
                    <InsertTrigger 
                        parentId={parentId} 
                        branch={branch} 
                        index={idx} 
                        layout={props.layout} 
                        isSelected={props.insertionPoint?.parentId === parentId && props.insertionPoint?.branch === branch && props.insertionPoint?.index === idx}
                        onClick={(e) => handleInsertClick(e, idx)} 
                    />
                    <div className={`flex flex-col items-center justify-center relative ${isVertical ? 'py-1' : 'px-1'}`}>
                         {node.type === NodeType.CONDITION ? (
                             <div className={`flex flex-col items-center`}>
                                 <NodeCard 
                                    node={node} 
                                    isSelected={props.selectedNodeId === node.id} 
                                    executionStatus={props.executionState[node.id]}
                                    onSelect={() => props.onSelectNode(node.id)}
                                    onRemove={() => props.onRemoveNode(node.id)}
                                 />
                                 <div className={`relative flex ${isVertical ? 'justify-center space-x-12 mt-4' : 'flex-col space-y-8 ml-4'}`}>
                                      <div className="relative flex flex-col items-center">
                                            <div className={`absolute ${isVertical ? '-top-4 left-1/2 w-px h-4 bg-slate-300' : '-left-4 top-1/2 h-px w-4 bg-slate-300'}`}></div>
                                            <span className={`absolute z-10 text-[9px] font-bold bg-green-100 text-green-700 border border-green-200 px-1 rounded ${isVertical ? '-top-6' : '-left-8 top-0'}`}>T</span>
                                            <div className="p-2 border border-slate-200 border-dashed rounded-lg bg-white/50 min-w-[60px] min-h-[60px] flex items-center justify-center">
                                                <WorkflowRenderer nodes={node.children || []} parentId={node.id} branch="children" props={props} />
                                            </div>
                                      </div>
                                      <div className="relative flex flex-col items-center">
                                            <div className={`absolute ${isVertical ? '-top-4 left-1/2 w-px h-4 bg-slate-300' : '-left-4 top-1/2 h-px w-4 bg-slate-300'}`}></div>
                                            <span className={`absolute z-10 text-[9px] font-bold bg-red-100 text-red-700 border border-red-200 px-1 rounded ${isVertical ? '-top-6' : '-left-8 top-0'}`}>F</span>
                                            <div className="p-2 border border-slate-200 border-dashed rounded-lg bg-white/50 min-w-[60px] min-h-[60px] flex items-center justify-center">
                                                 <WorkflowRenderer nodes={node.elseChildren || []} parentId={node.id} branch="elseChildren" props={props} />
                                            </div>
                                      </div>
                                 </div>
                             </div>
                         ) : node.type === NodeType.LOOP ? (
                             <LoopContainer layout={props.layout}>
                                 <div className="flex items-center justify-center">
                                     <NodeCard 
                                        node={node} 
                                        isSelected={props.selectedNodeId === node.id}
                                        executionStatus={props.executionState[node.id]} 
                                        onSelect={() => props.onSelectNode(node.id)}
                                        onRemove={() => props.onRemoveNode(node.id)}
                                    />
                                     <div className={`${isVertical ? 'mt-4' : 'ml-4'}`}>
                                         <WorkflowRenderer nodes={node.children || []} parentId={node.id} branch="children" props={props} />
                                     </div>
                                 </div>
                             </LoopContainer>
                         ) : (
                             <NodeCard 
                                node={node} 
                                isSelected={props.selectedNodeId === node.id} 
                                executionStatus={props.executionState[node.id]}
                                onSelect={() => props.onSelectNode(node.id)}
                                onRemove={() => props.onRemoveNode(node.id)}
                            />
                         )}
                    </div>
                </React.Fragment>
            ))}
            <InsertTrigger 
                parentId={parentId} 
                branch={branch} 
                index={nodes.length} 
                layout={props.layout} 
                isSelected={props.insertionPoint?.parentId === parentId && props.insertionPoint?.branch === branch && props.insertionPoint?.index === nodes.length}
                onClick={(e) => handleInsertClick(e, nodes.length)} 
            />
        </div>
    );
};
