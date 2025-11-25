
import React, { useState } from 'react';
import { TestCase, Script, Workflow, TestStep } from '../../types';
import { ArrowRight, Save, Plus, List, Sliders, PlayCircle, X } from 'lucide-react';
import { useConfig } from '../../ConfigContext';
import { EditorSidebar } from './editor/EditorSidebar';
import { StepEditor } from './stepEditor/StepEditor';

interface TestCaseEditorProps {
    initialCase: TestCase;
    availableScripts: Script[];
    availableWorkflows: Workflow[];
    onSave: (c: TestCase) => void;
    onCancel: () => void;
}

export const TestCaseEditor: React.FC<TestCaseEditorProps> = ({ initialCase, availableScripts, availableWorkflows, onSave, onCancel }) => {
    const { t } = useConfig();
    const [formState, setFormState] = useState<TestCase>({
        ...initialCase,
        variables: initialCase.variables || {},
        preconditions: initialCase.preconditions || []
    });
    const [selectedStepIndex, setSelectedStepIndex] = useState<number | null>(null);

    // Helper to combine scripts and workflows for the dropdown
    const executables = [
        ...availableScripts.map(s => ({ ...s, _kind: 'SCRIPT' as const })),
        ...availableWorkflows.map(w => ({ ...w, _kind: 'WORKFLOW' as const, parameters: w.inputSchema, outputs: w.outputSchema }))
    ];

    const updateVariable = (key: string, value: string) => {
        setFormState(prev => ({ ...prev, variables: { ...prev.variables, [key]: value } }));
    };
    const removeVariable = (key: string) => {
        const newVars = { ...formState.variables }; delete newVars[key];
        setFormState(prev => ({ ...prev, variables: newVars }));
    };
    const addVariable = () => updateVariable(`var_${Date.now()}`, '');

    const addPrecondition = () => setFormState(prev => ({ ...prev, preconditions: [...(prev.preconditions || []), ''] }));
    const updatePrecondition = (idx: number, val: string) => {
        const newPres = [...(formState.preconditions || [])]; newPres[idx] = val;
        setFormState(prev => ({ ...prev, preconditions: newPres }));
    };

    const addStep = () => {
        setFormState(prev => ({
            ...prev,
            steps: [...prev.steps, { 
                id: `step-${Date.now()}`, 
                summary: 'New Automation Step', 
                instruction: '', 
                expectedResult: '',
                // Default to first available action if exists
                linkedScriptId: availableScripts.length > 0 ? availableScripts[0].id : undefined
            }]
        }));
        setSelectedStepIndex(formState.steps.length);
    };

    const updateStep = (idx: number, field: keyof TestStep, value: any) => {
        const newSteps = [...formState.steps];
        
        // Handle switching logic between Script and Workflow
        if (field === 'linkedScriptId') {
            const targetId = value;
            const isWorkflow = availableWorkflows.some(w => w.id === targetId);
            
            newSteps[idx] = {
                ...newSteps[idx],
                linkedScriptId: isWorkflow ? undefined : targetId,
                linkedWorkflowId: isWorkflow ? targetId : undefined,
                parameterValues: {}, // Reset params on switch
                outputMapping: {}    // Reset outputs on switch
            };
        } else {
            // @ts-ignore
            newSteps[idx] = { ...newSteps[idx], [field]: value };
        }
        
        setFormState(prev => ({ ...prev, steps: newSteps }));
    };

    const removeStep = (idx: number) => {
        const newSteps = [...formState.steps];
        newSteps.splice(idx, 1);
        setFormState(prev => ({ ...prev, steps: newSteps }));
        setSelectedStepIndex(null);
    };

    const selectedStep = selectedStepIndex !== null ? formState.steps[selectedStepIndex] : null;
    
    const getAvailableContextVariables = (currentStepIdx: number) => {
        const vars = Object.keys(formState.variables || {}).map(k => `{{${k}}}`);
        for(let i=0; i<currentStepIdx; i++) {
            const s = formState.steps[i];
            if (s.outputMapping) {
                Object.values(s.outputMapping).forEach(v => vars.push(`{{${v}}}`));
            }
        }
        return vars;
    };

    return (
        <div className="flex flex-col bg-white h-full overflow-hidden">
            {/* Header */}
            <div className="h-14 border-b border-slate-200 flex justify-between items-center px-6 bg-slate-900 text-white shrink-0">
                <div className="flex items-center space-x-4">
                    <button onClick={onCancel} className="hover:bg-slate-800 p-1 rounded text-slate-300"><ArrowRight className="rotate-180" size={20}/></button>
                    <div className="flex flex-col">
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Automated Test Case</span>
                        <input 
                            className="bg-transparent border-none focus:ring-0 text-lg font-bold text-white placeholder-slate-500 w-96 p-0 h-6"
                            value={formState.title}
                            onChange={e => setFormState({...formState, title: e.target.value})}
                            placeholder={t('testCase.untitled')}
                        />
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                    <button
                        onClick={onCancel}
                        className="px-4 py-1.5 border border-slate-300 hover:bg-slate-50 rounded text-sm font-medium flex items-center space-x-2"
                    >
                        <X size={16}/>
                        <span>Close</span>
                    </button>
                    <button onClick={() => onSave(formState)} className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 rounded text-sm font-medium flex items-center space-x-2 shadow-lg shadow-blue-900/20 text-white">
                        <Save size={16}/><span>{t('testCase.save')}</span>
                    </button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Left Sidebar: Global Context */}
                <EditorSidebar 
                    variables={formState.variables || {}}
                    preconditions={formState.preconditions || []}
                    onUpdateVariable={updateVariable}
                    onRemoveVariable={removeVariable}
                    onAddVariable={addVariable}
                    onUpdatePrecondition={updatePrecondition}
                    onAddPrecondition={addPrecondition}
                />

                {/* Main Content: Steps Editor */}
                <div className="flex-1 bg-slate-100 flex flex-col overflow-hidden relative">
                    <div className="p-6 overflow-y-auto pb-20 h-full">
                        <StepEditor
                            steps={formState.steps}
                            onChange={(newSteps) => setFormState(prev => ({ ...prev, steps: newSteps }))}
                            variables={formState.variables}
                            readOnly={false}
                        />
                    </div>
                </div>

                {/* Right Sidebar: Properties Panel removed in favor of inline editing in StepItem, 
                    but keeping structure if we want to add global case metadata later */}
            </div>
        </div>
    );
};
