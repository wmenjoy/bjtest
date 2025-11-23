
import React, { useState, useEffect, useRef } from 'react';
import { TestCase, TestRun, ExecutionStatus, Script, Workflow, WorkflowNode, Environment } from '../types';
import { ChevronRight, Server, Sparkles, Loader2, SkipForward, XCircle, CheckCircle, Globe, Terminal } from 'lucide-react';
import { chatWithCopilot } from '../services/geminiService';
import { useConfig } from '../ConfigContext';
import { CopilotPanel } from './runner/CopilotPanel';
import { StepView } from './runner/StepView';
import { WorkflowView } from './runner/WorkflowView';
import { WorkflowRunner } from './workflow/WorkflowRunner';

// Test execution type
type ExecutionMode = 'STEPS' | 'WORKFLOW' | 'HTTP' | 'COMMAND';

interface TestRunnerProps {
  testCase: TestCase;
  scripts?: Script[];
  workflows?: Workflow[];
  activeEnvironment?: Environment;
  onComplete: (result: TestRun) => void;
  onCancel: () => void;
}

export const TestRunner: React.FC<TestRunnerProps> = ({ testCase, scripts = [], workflows = [], activeEnvironment, onComplete, onCancel }) => {
  const { t } = useConfig();

  // Determine execution mode based on test case type
  const getExecutionMode = (): ExecutionMode => {
    if (testCase.linkedWorkflowId || testCase.automationType === 'WORKFLOW') {
      return 'WORKFLOW';
    }
    // Check first step for HTTP/Command indicators
    const firstStep = testCase.steps[0];
    if (firstStep?.parameterValues?.method) {
      return 'HTTP';
    }
    if (firstStep?.parameterValues?.command) {
      return 'COMMAND';
    }
    return 'STEPS';
  };

  const [mode] = useState<ExecutionMode>(getExecutionMode());
  const isMounted = useRef(true);

  // HTTP/Command execution state
  const [httpExecuting, setHttpExecuting] = useState(false);
  const [httpResult, setHttpResult] = useState<{status: number; body: string; duration: number} | null>(null);
  const [httpError, setHttpError] = useState<string | null>(null);

  useEffect(() => {
      return () => { isMounted.current = false; };
  }, []);
  
  // Step Mode State
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [stepStatuses, setStepStatuses] = useState<Record<string, ExecutionStatus>>({});
  const [notes, setNotes] = useState("");
  const [autoExecuting, setAutoExecuting] = useState(false);
  const [executionLog, setExecutionLog] = useState<string[]>([]);
  
  // Workflow Mode State
  const [workflowLog, setWorkflowLog] = useState<{nodeId: string, message: string, status: 'RUNNING'|'DONE'|'ERROR'}[]>([]);
  const [workflowProgress, setWorkflowProgress] = useState(0);

  // AI Copilot State
  const [showCopilot, setShowCopilot] = useState(false);
  const [chatMessages, setChatMessages] = useState<{role: 'user' | 'ai', text: string}[]>([
      { role: 'ai', text: "Hello! I'm monitoring your test execution. If you encounter an error, I can help analyze the logs." }
  ]);
  const [isChatting, setIsChatting] = useState(false);

  // Setup active data
  const activeData = testCase.testData && testCase.testData.length > 0 
    ? JSON.parse(testCase.testData[0].data) 
    : {};

  const replaceVariables = (text: string) => {
      return text.replace(/\{\{(\w+)\}\}/g, (_, key) => {
          if (activeData[key]) return activeData[key];
          if (testCase.variables && testCase.variables[key]) return testCase.variables[key];
          if (activeEnvironment) {
              const envVar = activeEnvironment.variables.find(v => v.key === key);
              if (envVar) return envVar.value;
          }
          return `{{${key}}}`;
      });
  };

  const maskSecrets = (text: string) => {
      if (!activeEnvironment) return text;
      let masked = text;
      activeEnvironment.variables.forEach(v => {
          if (v.isSecret && v.value) {
             masked = masked.split(v.value).join('********');
          }
      });
      return masked;
  };

  const addLog = (log: string) => {
      setExecutionLog(prev => [...prev, maskSecrets(log)]);
  };

  const handleSendMessage = async (userMsg: string) => {
      setChatMessages(prev => [...prev, { role: 'user', text: userMsg }]);
      setIsChatting(true);

      const currentLogs = mode === 'STEPS' ? executionLog : workflowLog.map(l => l.message);
      const response = await chatWithCopilot(currentLogs, userMsg);

      if (isMounted.current) {
          setChatMessages(prev => [...prev, { role: 'ai', text: response }]);
          setIsChatting(false);
      }
  };

  const handleAnalyzeError = async () => {
      if (!showCopilot) setShowCopilot(true);
      handleSendMessage("Analyze the current errors in the execution logs and suggest a fix.");
  };

  // Execute HTTP test via backend API
  const executeHttpTest = async () => {
    setHttpExecuting(true);
    setHttpError(null);
    const startTime = Date.now();

    try {
      const response = await fetch(`http://localhost:8090/api/v2/tests/${testCase.id}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ envId: activeEnvironment?.id }),
      });

      const data = await response.json();
      const duration = Date.now() - startTime;

      if (!isMounted.current) return;

      if (response.ok && data.status === 'passed') {
        setHttpResult({
          status: data.httpResponse?.statusCode || 200,
          body: JSON.stringify(data.httpResponse?.body || data, null, 2),
          duration,
        });
        addLog(`HTTP ${testCase.steps[0]?.parameterValues?.method || 'GET'} request completed successfully`);
        addLog(`Status: ${data.httpResponse?.statusCode || 200}, Duration: ${duration}ms`);
      } else {
        setHttpError(data.error || 'Test execution failed');
        addLog(`Error: ${data.error || 'Test execution failed'}`);
      }
    } catch (err) {
      if (!isMounted.current) return;
      const errorMsg = err instanceof Error ? err.message : 'Network error';
      setHttpError(errorMsg);
      addLog(`Error: ${errorMsg}`);
    } finally {
      if (isMounted.current) setHttpExecuting(false);
    }
  };

  // Execute Command test via backend API
  const executeCommandTest = async () => {
    setHttpExecuting(true);
    setHttpError(null);
    const startTime = Date.now();

    try {
      const response = await fetch(`http://localhost:8090/api/v2/tests/${testCase.id}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ envId: activeEnvironment?.id }),
      });

      const data = await response.json();
      const duration = Date.now() - startTime;

      if (!isMounted.current) return;

      if (response.ok && data.status === 'passed') {
        setHttpResult({
          status: 0,
          body: data.output || 'Command executed successfully',
          duration,
        });
        addLog(`Command executed successfully`);
        addLog(`Duration: ${duration}ms`);
      } else {
        setHttpError(data.error || 'Command execution failed');
        addLog(`Error: ${data.error || 'Command execution failed'}`);
      }
    } catch (err) {
      if (!isMounted.current) return;
      const errorMsg = err instanceof Error ? err.message : 'Network error';
      setHttpError(errorMsg);
      addLog(`Error: ${errorMsg}`);
    } finally {
      if (isMounted.current) setHttpExecuting(false);
    }
  };

  // Auto-execute HTTP/Command tests on mount
  useEffect(() => {
    if (mode === 'HTTP') {
      executeHttpTest();
    } else if (mode === 'COMMAND') {
      executeCommandTest();
    }
  }, []);

  const currentStep = testCase.steps[currentStepIndex];
  const progress = ((currentStepIndex) / testCase.steps.length) * 100;

  useEffect(() => {
      if (mode === 'STEPS' && currentStep && (currentStep.linkedScriptId || currentStep.linkedWorkflowId) && !stepStatuses[currentStep.id] && !autoExecuting) {
          runAutomatedStep();
      }
  }, [currentStepIndex, mode]);

  const runAutomatedStep = () => {
      if (!currentStep.linkedScriptId && !currentStep.linkedWorkflowId) return;
      setAutoExecuting(true);

      if (currentStep.linkedWorkflowId) {
          const wf = workflows.find(w => w.id === currentStep.linkedWorkflowId);
          const wfName = wf ? wf.name : 'Unknown Workflow';
          addLog(`> Orchestrating Sub-Workflow: ${wfName}`);
          
          setTimeout(() => {
              if (!isMounted.current) return;
              addLog(`>> Workflow execution completed successfully.`);
              setAutoExecuting(false);
              markStep(ExecutionStatus.PASSED);
          }, 2500);
          return;
      }

      const script = scripts.find(s => s.id === currentStep.linkedScriptId);
      const scriptName = script ? script.name : 'Unknown Script';
      addLog(`> Executing Action: ${scriptName}`);

      if (currentStep.loopOver) {
         setTimeout(() => {
             if (!isMounted.current) return;
             const loopVal = replaceVariables(currentStep.loopOver || '');
             addLog(`> Detected Loop over: ${loopVal}`);
             [1, 2, 3].forEach(i => {
                 setTimeout(() => {
                    if (!isMounted.current) return;
                    addLog(`>> Iteration ${i}: Processing ${currentStep.loopVar || 'item'}...`);
                 }, i * 800);
             });

             setTimeout(() => {
                 if (!isMounted.current) return;
                 addLog(`> Loop Completed Successfully.`);
                 setAutoExecuting(false);
                 markStep(ExecutionStatus.PASSED);
             }, 3000);
         }, 500);
         return;
      }

      setTimeout(() => {
          if (!isMounted.current) return;
          addLog(`> Success: Action completed.`);
          setAutoExecuting(false);
          markStep(ExecutionStatus.PASSED);
      }, 1500);
  };

  const markStep = (status: ExecutionStatus) => {
    setStepStatuses(prev => ({ ...prev, [currentStep.id]: status }));
    if (currentStepIndex < testCase.steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      // If last step passed, mark completed but wait for user submit
      setCurrentStepIndex(prev => prev + 1); 
    }
  };

  useEffect(() => {
      if (mode === 'WORKFLOW' && testCase.linkedWorkflowId) {
          runWorkflowSimulation();
      }
  }, []);

  const runWorkflowSimulation = async () => {
      const workflow = workflows.find(w => w.id === testCase.linkedWorkflowId);
      if (!workflow) return;

      const nodes = flattenNodes(workflow.nodes);
      const total = nodes.length;

      for (let i = 0; i < total; i++) {
          if (!isMounted.current) return;
          const node = nodes[i];
          
          const resolvedName = replaceVariables(node.name);
          let detail = '';
          if (node.type === 'HTTP_REQUEST') detail = `[${node.config?.method}] ${replaceVariables(node.config?.url || '')}`;
          if (node.type === 'BROWSER_ACTION') detail = `${node.config?.browserCommand} ${replaceVariables(node.config?.selector || '')}`;

          const logMsg = maskSecrets(`Starting: ${resolvedName} ${detail}`);
          
          setWorkflowLog(prev => [...prev, { nodeId: node.id, message: logMsg, status: 'RUNNING' }]);
          
          await new Promise(r => setTimeout(r, 1000));
          
          if (!isMounted.current) return;
          
          if (node.name.toLowerCase().includes('fail')) {
               setWorkflowLog(prev => {
                  const last = prev[prev.length - 1];
                  return [...prev.slice(0, -1), { ...last, status: 'ERROR', message: `Failed: ${resolvedName} (Simulated Error)` }];
              });
          } else {
              setWorkflowLog(prev => {
                  const last = prev[prev.length - 1];
                  return [...prev.slice(0, -1), { ...last, status: 'DONE', message: `Completed: ${resolvedName}` }];
              });
          }
          setWorkflowProgress(((i + 1) / total) * 100);
      }
  };

  const flattenNodes = (nodes: WorkflowNode[]): WorkflowNode[] => {
      let result: WorkflowNode[] = [];
      nodes.forEach(n => {
          result.push(n);
          if (n.children) result = result.concat(flattenNodes(n.children));
          if (n.elseChildren) result = result.concat(flattenNodes(n.elseChildren));
      });
      return result;
  };

  const handleFinish = () => {
    let finalStatus = ExecutionStatus.PASSED;
    let finalLogs: string[] = [];

    if (mode === 'STEPS') {
        const statuses = Object.values(stepStatuses);
        if (statuses.includes(ExecutionStatus.FAILED)) finalStatus = ExecutionStatus.FAILED;
        finalLogs = executionLog;
    } else {
        const hasError = workflowLog.some(l => l.status === 'ERROR');
        if (hasError) finalStatus = ExecutionStatus.FAILED;
        finalLogs = workflowLog.map(l => `${new Date().toLocaleTimeString()} - ${l.message}`);
    }

    const run: TestRun = {
        id: `run-${Date.now()}`,
        caseId: testCase.id,
        projectId: testCase.projectId,
        name: `Run: ${testCase.title}`,
        executedAt: new Date().toISOString(),
        status: finalStatus,
        notes: notes || (mode === 'WORKFLOW' ? 'Automated Workflow Execution' : ''),
        logs: finalLogs,
        environmentName: activeEnvironment?.name || 'Default'
    };
    onComplete(run);
  };

  // Handle workflow execution completion
  const handleWorkflowComplete = (runId: string, status: 'success' | 'failed') => {
    const finalStatus = status === 'success' ? ExecutionStatus.PASSED : ExecutionStatus.FAILED;
    const run: TestRun = {
        id: runId,
        caseId: testCase.id,
        projectId: testCase.projectId,
        name: `Workflow Run: ${testCase.title}`,
        executedAt: new Date().toISOString(),
        status: finalStatus,
        notes: `Automated workflow execution via API`,
        logs: [`Workflow ${status}. Run ID: ${runId}`],
        environmentName: activeEnvironment?.name || 'Default'
    };
    onComplete(run);
  };

  const isStepsCompleted = currentStepIndex >= testCase.steps.length;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300">
      <div className={`bg-white w-full h-[90vh] rounded-2xl shadow-2xl flex flex-row overflow-hidden transition-all duration-500 ease-in-out ${showCopilot ? 'max-w-7xl' : 'max-w-5xl'}`}>
        
        {/* LEFT PANEL: RUNNER */}
        <div className="flex-1 flex flex-col min-w-0 border-r border-slate-200 bg-slate-50/30 relative">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-white sticky top-0 z-10">
                <div>
                    <div className="flex items-center space-x-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                        <span>{t('runner.mode')}</span>
                        <ChevronRight size={12}/>
                        <span className={`${mode === 'WORKFLOW' ? 'text-indigo-600' : mode === 'HTTP' ? 'text-blue-600' : mode === 'COMMAND' ? 'text-amber-600' : 'text-blue-600'}`}>
                            {mode === 'WORKFLOW' ? t('runner.workflow') : mode === 'HTTP' ? 'HTTP' : mode === 'COMMAND' ? 'Command' : t('runner.step')}
                        </span>
                        {activeEnvironment && (
                            <>
                            <ChevronRight size={12}/>
                            <span className={`flex items-center px-1.5 py-0.5 rounded text-[10px] ${activeEnvironment.name === 'Production' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'}`}>
                                <Server size={10} className="mr-1"/> {activeEnvironment.name}
                            </span>
                            </>
                        )}
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 truncate max-w-md">{testCase.title}</h2>
                </div>
                
                <div className="flex items-center space-x-3">
                    <button 
                        onClick={() => setShowCopilot(!showCopilot)} 
                        className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-all ${showCopilot ? 'bg-purple-50 border-purple-200 text-purple-700 shadow-inner' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-purple-600 hover:border-purple-200 shadow-sm'}`}
                    >
                        <Sparkles size={16} className={showCopilot ? 'fill-purple-400' : ''} />
                        <span className="font-semibold text-sm">{t('runner.copilot')}</span>
                    </button>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="h-1 w-full bg-slate-100">
                <div className={`h-full transition-all duration-500 ease-out ${mode === 'WORKFLOW' ? 'bg-indigo-500' : 'bg-blue-600'}`} style={{ width: `${mode === 'WORKFLOW' ? workflowProgress : progress}%` }}></div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto">
                {mode === 'HTTP' || mode === 'COMMAND' ? (
                    <div className="p-8">
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className={`px-6 py-4 border-b border-slate-100 ${mode === 'HTTP' ? 'bg-blue-50' : 'bg-amber-50'}`}>
                                <h3 className={`font-semibold flex items-center space-x-2 ${mode === 'HTTP' ? 'text-blue-700' : 'text-amber-700'}`}>
                                    {mode === 'HTTP' ? <Globe size={18} /> : <Terminal size={18} />}
                                    <span>{mode === 'HTTP' ? 'HTTP Request' : 'Command Execution'}</span>
                                </h3>
                            </div>
                            <div className="p-6">
                                {/* Request/Command Info */}
                                {mode === 'HTTP' && testCase.steps[0]?.parameterValues && (
                                    <div className="mb-4">
                                        <div className="flex items-center space-x-2 mb-2">
                                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-bold">
                                                {testCase.steps[0].parameterValues.method || 'GET'}
                                            </span>
                                            <span className="font-mono text-sm text-slate-600">
                                                {testCase.steps[0].parameterValues.url || '/api/endpoint'}
                                            </span>
                                        </div>
                                    </div>
                                )}
                                {mode === 'COMMAND' && testCase.steps[0]?.parameterValues && (
                                    <div className="mb-4">
                                        <div className="bg-slate-900 text-green-400 font-mono text-sm p-3 rounded">
                                            $ {testCase.steps[0].parameterValues.command} {testCase.steps[0].parameterValues.args || ''}
                                        </div>
                                    </div>
                                )}

                                {/* Execution Status */}
                                {httpExecuting ? (
                                    <div className="flex items-center justify-center py-8">
                                        <Loader2 size={32} className="animate-spin text-blue-500 mr-3" />
                                        <span className="text-slate-600 font-medium">Executing...</span>
                                    </div>
                                ) : httpError ? (
                                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                        <div className="flex items-center text-red-700 font-semibold mb-2">
                                            <XCircle size={18} className="mr-2" />
                                            Execution Failed
                                        </div>
                                        <p className="text-sm text-red-600">{httpError}</p>
                                    </div>
                                ) : httpResult ? (
                                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                        <div className="flex items-center text-green-700 font-semibold mb-2">
                                            <CheckCircle size={18} className="mr-2" />
                                            Execution Successful
                                        </div>
                                        {mode === 'HTTP' && (
                                            <p className="text-sm text-green-600 mb-2">Status: {httpResult.status} | Duration: {httpResult.duration}ms</p>
                                        )}
                                        {mode === 'COMMAND' && (
                                            <p className="text-sm text-green-600 mb-2">Duration: {httpResult.duration}ms</p>
                                        )}
                                        <div className="bg-white border border-green-100 rounded p-3 mt-2">
                                            <pre className="text-xs text-slate-600 whitespace-pre-wrap max-h-64 overflow-y-auto">{httpResult.body}</pre>
                                        </div>
                                    </div>
                                ) : null}

                                {/* Execution Logs */}
                                {executionLog.length > 0 && (
                                    <div className="mt-4">
                                        <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Execution Log</h4>
                                        <div className="bg-slate-50 rounded-lg p-3 max-h-32 overflow-y-auto">
                                            {executionLog.map((log, idx) => (
                                                <div key={idx} className="text-xs font-mono text-slate-600">{log}</div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ) : mode === 'STEPS' ? (
                    <div className="p-8">
                        <StepView
                            step={currentStep}
                            isCompleted={isStepsCompleted}
                            logs={executionLog}
                            autoExecuting={autoExecuting}
                            notes={notes}
                            onNotesChange={setNotes}
                            replaceVariables={replaceVariables}
                        />
                    </div>
                ) : testCase.linkedWorkflowId ? (
                    <WorkflowRunner
                        workflowId={testCase.linkedWorkflowId}
                        workflowName={workflows.find(w => w.id === testCase.linkedWorkflowId)?.name || 'Workflow'}
                        variables={testCase.variables}
                        onComplete={handleWorkflowComplete}
                        onCancel={onCancel}
                    />
                ) : (
                    <div className="p-8">
                        <WorkflowView
                            logs={workflowLog}
                            progress={workflowProgress}
                            onAnalyzeError={handleAnalyzeError}
                        />
                    </div>
                )}
            </div>

            {/* Footer Actions - Show for STEPS and HTTP/COMMAND modes */}
            {(mode === 'STEPS' || mode === 'HTTP' || mode === 'COMMAND') && (
                <div className="p-6 border-t border-slate-200 bg-white flex justify-between items-center sticky bottom-0 z-10">
                    <button onClick={onCancel} className="text-slate-500 font-medium hover:text-slate-800 px-4 py-2 rounded-lg hover:bg-slate-100 transition-colors">{t('runner.cancel')}</button>

                    {mode === 'STEPS' ? (
                        !isStepsCompleted ? (
                            <div className="flex items-center space-x-3">
                                {autoExecuting ? (
                                    <div className="text-sm text-purple-600 font-bold animate-pulse px-6 flex items-center bg-purple-50 py-2 rounded-lg border border-purple-100">
                                        <Loader2 size={16} className="animate-spin mr-2"/> {t('runner.executing')}
                                    </div>
                                ) : (
                                    <>
                                        <button onClick={() => markStep(ExecutionStatus.SKIPPED)} className="flex items-center space-x-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 hover:border-slate-300 font-medium transition-all">
                                            <SkipForward size={18} /><span>{t('runner.skip')}</span>
                                        </button>
                                        <button onClick={() => markStep(ExecutionStatus.FAILED)} className="flex items-center space-x-2 px-6 py-2.5 bg-red-50 text-red-700 border border-red-100 rounded-lg hover:bg-red-100 hover:border-red-200 font-medium transition-all">
                                            <XCircle size={18} /><span>{t('runner.fail')}</span>
                                        </button>
                                        <button onClick={() => markStep(ExecutionStatus.PASSED)} className="flex items-center space-x-2 px-8 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium shadow-lg shadow-green-200 transform hover:-translate-y-0.5 transition-all">
                                            <CheckCircle size={18} /><span>{t('runner.pass')}</span>
                                        </button>
                                    </>
                                )}
                            </div>
                        ) : (
                            <button onClick={handleFinish} className="px-8 py-3 bg-slate-900 text-white rounded-lg hover:bg-black font-bold shadow-xl transform hover:-translate-y-0.5 transition-all flex items-center">
                                {t('runner.submit')}
                            </button>
                        )
                    ) : (
                        /* HTTP/COMMAND mode footer */
                        <div className="flex items-center space-x-3">
                            {httpExecuting ? (
                                <div className="text-sm text-blue-600 font-bold animate-pulse px-6 flex items-center bg-blue-50 py-2 rounded-lg border border-blue-100">
                                    <Loader2 size={16} className="animate-spin mr-2"/> Executing...
                                </div>
                            ) : (
                                <>
                                    {(httpResult || httpError) && (
                                        <button
                                            onClick={mode === 'HTTP' ? executeHttpTest : executeCommandTest}
                                            className="flex items-center space-x-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 hover:border-slate-300 font-medium transition-all"
                                        >
                                            <span>Re-run</span>
                                        </button>
                                    )}
                                    <button
                                        onClick={() => {
                                            const status = httpError ? ExecutionStatus.FAILED : ExecutionStatus.PASSED;
                                            const run: TestRun = {
                                                id: `run-${Date.now()}`,
                                                caseId: testCase.id,
                                                projectId: testCase.projectId,
                                                name: `Run: ${testCase.title}`,
                                                executedAt: new Date().toISOString(),
                                                status,
                                                notes: httpError || `${mode} test completed successfully`,
                                                logs: executionLog,
                                                environmentName: activeEnvironment?.name || 'Default'
                                            };
                                            onComplete(run);
                                        }}
                                        disabled={httpExecuting}
                                        className="px-8 py-3 bg-slate-900 text-white rounded-lg hover:bg-black font-bold shadow-xl transform hover:-translate-y-0.5 transition-all flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Complete
                                    </button>
                                </>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>

        {/* RIGHT PANEL: AI COPILOT */}
        <CopilotPanel 
            show={showCopilot} 
            onClose={() => setShowCopilot(false)}
            messages={chatMessages}
            isChatting={isChatting}
            onSendMessage={handleSendMessage}
        />
      </div>
    </div>
  );
};