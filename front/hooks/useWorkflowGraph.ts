
import { useState, useCallback } from 'react';
import { Workflow, WorkflowNode, NodeType, NodeConfig } from '../types';

export interface InsertionPoint {
    parentId: string | 'root';
    branch: 'children' | 'elseChildren';
    index: number;
}

export const useWorkflowGraph = (
    selectedWorkflow: Workflow | null, 
    onUpdateWorkflow: (w: Workflow) => void
) => {
    const [insertionPoint, setInsertionPoint] = useState<InsertionPoint | null>(null);
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
    const [runningWorkflows, setRunningWorkflows] = useState<Record<string, boolean>>({});
    const [executionState, setExecutionState] = useState<Record<string, 'pending' | 'running' | 'success' | 'error'>>({});

    const findNodeById = useCallback((nodes: WorkflowNode[], id: string): WorkflowNode | null => {
        for (const node of nodes) {
            if (node.id === id) return node;
            if (node.children) { const f = findNodeById(node.children, id); if(f) return f; }
            if (node.elseChildren) { const f = findNodeById(node.elseChildren, id); if(f) return f; }
        }
        return null;
    }, []);

    const updateNodeInTree = (nodes: WorkflowNode[], updatedNode: WorkflowNode): WorkflowNode[] => {
        return nodes.map(node => {
            if (node.id === updatedNode.id) return updatedNode;
            return { 
                ...node, 
                children: node.children ? updateNodeInTree(node.children, updatedNode) : undefined, 
                elseChildren: node.elseChildren ? updateNodeInTree(node.elseChildren, updatedNode) : undefined 
            };
        });
    };

    const executeInsert = (nodes: WorkflowNode[], target: InsertionPoint, newNode: WorkflowNode[]): WorkflowNode[] => {
        if (target.parentId === 'root') { 
            const newNodes = [...nodes]; 
            newNodes.splice(target.index, 0, ...newNode); 
            return newNodes; 
        }
        const traverse = (list: WorkflowNode[]): WorkflowNode[] => {
            return list.map(node => {
                if (node.id === target.parentId) {
                    if (target.branch === 'children') { 
                        const n = [...(node.children||[])]; 
                        n.splice(target.index, 0, ...newNode); 
                        return { ...node, children: n }; 
                    } else { 
                        const n = [...(node.elseChildren||[])]; 
                        n.splice(target.index, 0, ...newNode); 
                        return { ...node, elseChildren: n }; 
                    }
                }
                return { 
                    ...node, 
                    children: node.children ? traverse(node.children) : undefined, 
                    elseChildren: node.elseChildren ? traverse(node.elseChildren) : undefined 
                };
            });
        };
        return traverse(nodes);
    };

    const handleAddNode = (type: NodeType, configOverride: Partial<NodeConfig> = {}) => {
        if (!selectedWorkflow) return; 
        
        let targetPoint = insertionPoint;
        if (!targetPoint && selectedWorkflow.nodes.length === 0) {
            targetPoint = { parentId: 'root', branch: 'children', index: 0 };
        }
        if (!targetPoint) { 
            alert("Select insertion point (+) or create a new workflow."); 
            return; 
        }
        
        const timestamp = Date.now();
        let name = 'Node'; 
        let config: NodeConfig = { ...configOverride };
        
        if (type === NodeType.HTTP_REQUEST) { name = 'HTTP Request'; config.method = 'GET'; }
        else if (type === NodeType.DB_QUERY) { name = 'DB Query'; }
        else name = type.replace('_', ' ');

        const newNodeId = `node-${timestamp}`;
        
        const nodesToAdd: WorkflowNode[] = [{ 
            id: newNodeId, 
            type, 
            name, 
            config, 
            children: (type===NodeType.LOOP||type===NodeType.CONDITION)?[]:undefined, 
            elseChildren:type===NodeType.CONDITION?[]:undefined 
        }];
        
        const updatedNodes = executeInsert(selectedWorkflow.nodes, targetPoint, nodesToAdd);
        onUpdateWorkflow({ ...selectedWorkflow, nodes: updatedNodes });
        setInsertionPoint(null);
        
        setTimeout(() => setSelectedNodeId(newNodeId), 50);
    };

    const handleRemoveNode = (nodeId: string) => {
        if (!selectedWorkflow) return;
        const filterNodes = (nodes: WorkflowNode[]): WorkflowNode[] => 
            nodes.filter(n => n.id !== nodeId).map(n => ({ 
                ...n, 
                children: n.children ? filterNodes(n.children) : undefined, 
                elseChildren: n.elseChildren ? filterNodes(n.elseChildren) : undefined 
            }));
            
        onUpdateWorkflow({ ...selectedWorkflow, nodes: filterNodes(selectedWorkflow.nodes) });
        if(selectedNodeId === nodeId) setSelectedNodeId(null);
    };

    const handleUpdateNode = (updatedNode: WorkflowNode) => { 
        if (selectedWorkflow) {
            onUpdateWorkflow({ ...selectedWorkflow, nodes: updateNodeInTree(selectedWorkflow.nodes, updatedNode) }); 
        }
    };

    const simulateExecution = async () => {
        if (!selectedWorkflow) return;
        setRunningWorkflows(p => ({...p, [selectedWorkflow.id]: true}));
        setExecutionState({});
        const traverse = async (nodes: WorkflowNode[]) => {
            for (const node of nodes) {
                setExecutionState(prev => ({ ...prev, [node.id]: 'running' }));
                await new Promise(r => setTimeout(r, 600)); 
                setExecutionState(prev => ({ ...prev, [node.id]: 'success' }));
                if (node.children) await traverse(node.children);
                if (node.elseChildren) await traverse(node.elseChildren);
            }
        };
        await traverse(selectedWorkflow.nodes);
        setRunningWorkflows(p => ({...p, [selectedWorkflow.id]: false}));
    };

    const selectedNodeForInspector = selectedWorkflow && selectedNodeId 
        ? findNodeById(selectedWorkflow.nodes, selectedNodeId) 
        : null;

    return {
        insertionPoint,
        setInsertionPoint,
        selectedNodeId,
        setSelectedNodeId,
        executionState,
        runningWorkflows,
        simulateExecution,
        handleAddNode,
        handleRemoveNode,
        handleUpdateNode,
        selectedNodeForInspector
    };
};
