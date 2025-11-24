
import React, { useState, useEffect } from 'react';
import { Script, ScriptType, Workflow, TestCase, ScriptParameter } from '../types';
import { Play, GitMerge, Loader2, Settings2, X, Code, Layers } from 'lucide-react';
import { YamlEditor } from './YamlEditor';
import { useConfig } from '../ConfigContext';
import { NodeInspector } from './scriptlab/NodeInspector';
import { WorkflowRenderer } from './scriptlab/WorkflowCanvas';
import { LabHeader } from './scriptlab/LabHeader';
import { ScriptList } from './scriptlab/ScriptList';
import { Toolbox } from './scriptlab/Toolbox';
import { useWorkflowGraph } from '../hooks/useWorkflowGraph';
import { ActionEditor } from './library/ActionEditor';

interface ScriptLabProps {
  scripts: Script[];
  workflows: Workflow[];
  cases: TestCase[];
  activeEnvironment?: any;
  projectId: string;
  onAddScript: (s: Script) => void;
  onUpdateScript: (s: Script) => void;
  onAddWorkflow: (w: Workflow) => void;
  onUpdateWorkflow: (w: Workflow) => void;
}

export const ScriptLab: React.FC<ScriptLabProps> = ({ scripts, workflows, cases, activeEnvironment, projectId, onAddScript, onUpdateScript, onAddWorkflow, onUpdateWorkflow }) => {
    const { t } = useConfig();
    const [mode, setMode] = useState<'scripts' | 'workflows' | 'suites'>('workflows');
    const [viewMode, setViewMode] = useState<'visual' | 'code'>('visual');
    const [layout, setLayout] = useState<'horizontal' | 'vertical'>('horizontal');
    
    const [selectedScript, setSelectedScript] = useState<Script | null>(null);
    const [scriptContent, setScriptContent] = useState("");
    const [scriptParams, setScriptParams] = useState<ScriptParameter[]>([]);
    const [scriptOutputs, setScriptOutputs] = useState<ScriptParameter[]>([]);

    const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
    const [workflowInputs, setWorkflowInputs] = useState<ScriptParameter[]>([]);
    const [workflowOutputs, setWorkflowOutputs] = useState<ScriptParameter[]>([]);
    const [showWfSettings, setShowWfSettings] = useState(false);

    // Custom Hook for Graph Logic
    const {
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
    } = useWorkflowGraph(selectedWorkflow, onUpdateWorkflow);

    useEffect(() => {
        if (selectedScript) {
            setScriptContent(selectedScript.content);
            setScriptParams(selectedScript.parameters || []);
            setScriptOutputs(selectedScript.outputs || []);
        }
    }, [selectedScript]);

    useEffect(() => {
        if (selectedWorkflow) {
            setInsertionPoint({ parentId: 'root', branch: 'children', index: selectedWorkflow.nodes.length });
            setWorkflowInputs(selectedWorkflow.inputSchema || []);
            setWorkflowOutputs(selectedWorkflow.outputSchema || []);
        } else {
            setInsertionPoint(null);
        }
        setSelectedNodeId(null);
        setShowWfSettings(false);
    }, [selectedWorkflow?.id]);

    useEffect(() => {
        if (selectedWorkflow) {
            const freshWorkflow = workflows.find(w => w.id === selectedWorkflow.id);
            if (freshWorkflow && freshWorkflow !== selectedWorkflow) {
                setSelectedWorkflow(freshWorkflow);
            }
        }
    }, [workflows, selectedWorkflow]);

     const handleNewScript = () => {
        const newScript: Script = { 
            id: `script-${Date.now()}`, 
            projectId,
            name: 'New Action.py', 
            type: ScriptType.PYTHON, 
            content: '', 
            parameters: [], 
            outputs: [], 
            isTemplate: false, 
            tags: [], 
            lastModified: new Date().toISOString() 
        };
        onAddScript(newScript); setSelectedScript(newScript); setMode('scripts');
    };
  
    const handleNewWorkflow = () => {
        const newFlow: Workflow = { 
            id: `flow-${Date.now()}`, 
            projectId,
            name: 'New Workflow', 
            description: '', 
            nodes: [] 
        };
        onAddWorkflow(newFlow); setSelectedWorkflow(newFlow); setMode('workflows');
    };

    const handleSaveWorkflowMeta = () => {
        if (selectedWorkflow) onUpdateWorkflow({ ...selectedWorkflow, inputSchema: workflowInputs, outputSchema: workflowOutputs });
        setShowWfSettings(false);
    };

    const handleScriptSave = (updated: Partial<Script>) => {
        if (selectedScript) {
            onUpdateScript({ ...selectedScript, ...updated } as Script);
        }
    };

    return (
      <div className="flex flex-col h-[calc(100vh-140px)] bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden relative">
         <LabHeader 
            mode={mode} 
            setMode={setMode} 
            layout={layout} 
            setLayout={setLayout} 
            viewMode={viewMode} 
            setViewMode={setViewMode} 
            selectedWorkflow={selectedWorkflow} 
         />
  
         <div className="flex-1 flex overflow-hidden relative">
             <ScriptList 
                mode={mode}
                workflows={workflows}
                scripts={scripts}
                selectedWorkflow={selectedWorkflow}
                selectedScript={selectedScript}
                onSelectWorkflow={setSelectedWorkflow}
                onSelectScript={setSelectedScript}
                onAdd={mode === 'workflows' ? handleNewWorkflow : handleNewScript}
             />
  
             {/* Canvas Area */}
             <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden relative">
                 {mode === 'workflows' ? (
                     selectedWorkflow ? (
                         viewMode === 'code' ? (
                             <YamlEditor workflow={selectedWorkflow} onUpdate={onUpdateWorkflow} />
                         ) : (
                             <div className="flex flex-col h-full overflow-hidden">
                                  <div className="h-14 border-b border-slate-200 bg-white px-6 flex justify-between items-center flex-shrink-0">
                                      <div className="flex items-center space-x-4">
                                          <input className="text-lg font-bold bg-transparent border-none focus:ring-0 text-slate-800 p-0 w-64 transition-colors hover:bg-slate-50 rounded px-1" value={selectedWorkflow.name} onChange={(e) => onUpdateWorkflow({...selectedWorkflow, name: e.target.value})}/>
                                          <button onClick={() => setShowWfSettings(true)} className="p-1 hover:bg-slate-100 rounded text-slate-500 transition-colors" title="Workflow I/O Settings"><Settings2 size={16}/></button>
                                      </div>
                                      <button onClick={simulateExecution} className="flex items-center space-x-2 px-4 py-1.5 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-700 text-sm transition-all active:scale-95">
                                          {runningWorkflows[selectedWorkflow.id] ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}<span>{t('lab.runPipeline')}</span>
                                      </button>
                                  </div>
                                  <div className="flex-1 overflow-hidden relative bg-slate-100" onClick={() => setSelectedNodeId(null)}>
                                      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#64748b 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                                      <div className="h-full overflow-auto custom-scrollbar flex items-center justify-center p-10">
                                          <div className={`flex ${layout === 'vertical' ? 'flex-col' : 'flex-row'} items-center min-w-max`}>
                                              <div className={`flex flex-col items-center ${layout === 'vertical' ? 'mb-4' : 'mr-4'}`}>
                                                  <div className="w-10 h-10 rounded-full bg-slate-800 text-white flex items-center justify-center shadow-lg border-4 border-slate-200"><Play size={14}/></div>
                                                  <span className="text-[9px] font-bold text-slate-400 mt-1">{t('lab.start')}</span>
                                              </div>
                                              <WorkflowRenderer
                                                nodes={selectedWorkflow.nodes}
                                                parentId="root"
                                                branch="children"
                                                props={{
                                                    nodes: selectedWorkflow.nodes,
                                                    layout,
                                                    selectedNodeId,
                                                    insertionPoint,
                                                    executionState,
                                                    onSelectNode: setSelectedNodeId,
                                                    onRemoveNode: handleRemoveNode,
                                                    onSetInsertionPoint: setInsertionPoint
                                                }}
                                              />
                                              <div className={`p-2 border-2 border-dashed border-slate-300 rounded-lg text-slate-400 text-[10px] w-24 text-center ${layout === 'vertical' ? 'mt-4' : 'ml-4'}`}>{t('lab.end')}</div>
                                          </div>
                                      </div>

                                      <Toolbox
                                          visible={!!insertionPoint}
                                          onClose={() => setInsertionPoint(null)}
                                          onAddNode={handleAddNode}
                                      />
                                  </div>

                                  {selectedNodeForInspector && (
                                      <NodeInspector
                                          node={selectedNodeForInspector}
                                          workflowNodes={selectedWorkflow.nodes}
                                          onUpdate={handleUpdateNode}
                                          onClose={() => setSelectedNodeId(null)}
                                      />
                                  )}

                                  {showWfSettings && (
                                      <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm flex justify-end z-30">
                                          <div className="w-80 bg-white shadow-2xl h-full p-6 flex flex-col animate-slide-in-right border-l border-slate-200">
                                              <div className="flex justify-between items-center mb-6">
                                                  <h3 className="font-bold text-slate-800">{t('lab.settings')}</h3>
                                                  <button onClick={() => setShowWfSettings(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
                                              </div>
                                              <p className="text-xs text-slate-500 mb-4">Define global inputs required when starting this pipeline.</p>
                                              <div className="flex-1 overflow-y-auto">
                                                  <div className="p-4 bg-slate-50 rounded text-center text-xs text-slate-400">I/O Configuration</div>
                                              </div>
                                              <button onClick={handleSaveWorkflowMeta} className="mt-4 w-full py-2 bg-indigo-600 text-white rounded shadow hover:bg-indigo-700 font-medium text-sm transition-colors">{t('lab.saveSettings')}</button>
                                          </div>
                                      </div>
                                  )}
                             </div>
                         )
                     ) : <div className="flex-1 flex items-center justify-center text-slate-400"><GitMerge size={48} className="mb-4 opacity-20"/><p>{t('lab.selectWorkflow')}</p></div>
                 ) : mode === 'scripts' ? (
                     selectedScript ? (
                        <ActionEditor
                            initialScript={selectedScript}
                            onSave={handleScriptSave}
                            onCancel={() => {}}
                            inline={true}
                        />
                     ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                            <Code size={48} className="mb-4 opacity-20"/>
                            <p>Select an action to edit</p>
                        </div>
                     )
                 ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                        <Layers size={48} className="mb-4 opacity-20"/>
                        <p className="text-lg font-semibold text-slate-500">Test Suites (Coming Soon)</p>
                        <p className="text-sm text-slate-400 mt-2">Create and manage test suites</p>
                    </div>
                 )}
             </div>
         </div>
      </div>
    );
};