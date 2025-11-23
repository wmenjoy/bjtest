
import React, { useState } from 'react';
import { ActionDef } from './types';
import { Plus, Play, Loader2, Info } from 'lucide-react';
import { ScriptType } from '../../types';
import { useConfig } from '../../ConfigContext';

interface ActionTestBenchProps {
    action: ActionDef;
    onSaveExample?: () => void;
}

export const ActionTestBench: React.FC<ActionTestBenchProps> = ({ action, onSaveExample }) => {
    const { t } = useConfig();
    const [testInputValues, setTestInputValues] = useState<Record<string, string>>(() => {
        const defaults: Record<string, string> = {};
        action.parameters?.forEach(p => {
            defaults[p.name] = p.defaultValue || '';
        });
        return defaults;
    });
    const [testResult, setTestResult] = useState<string>("");
    const [isTesting, setIsTesting] = useState(false);

    const handleRunTest = () => {
        setIsTesting(true);
        setTestResult("");
        
        setTimeout(() => {
            const outputs = action?.outputs || [];
            let outputStr = `[System] Initializing execution environment...\n[System] Executor: ${action?.type}\n[System] Inputs: ${JSON.stringify(testInputValues, null, 2)}\n`;
            
            if (action?.isBuiltIn) {
                outputStr += `\n[Module] Executing Built-in Module logic...\n> Connecting to external system...\n> Command sent successfully.`;
            } else if (action?.content?.includes("requests")) {
                outputStr += `\n> Sending HTTP Request to ${testInputValues['url'] || 'localhost'}...\n> Response: 200 OK\n> Payload: { "data": "mock_response" }`;
            } else if (action?.type === ScriptType.SHELL) {
                outputStr += `\n$ exec ${action.name}\n> Command executed successfully. Exit Code: 0`;
            } else {
                outputStr += `\n> Processing logic...\n> Success.\n> Output variables detected: ${outputs.map(o => o.name).join(', ')}`;
            }
            
            const mockJson: Record<string, any> = {};
            outputs?.forEach(o => {
                if (o.type === 'number') mockJson[o.name] = 123;
                else if (o.type === 'boolean') mockJson[o.name] = true;
                else mockJson[o.name] = "sample_value";
            });
            
            outputStr += `\n\n[Result Output]\n${JSON.stringify(mockJson, null, 2)}`;

            setTestResult(outputStr);
            setIsTesting(false);
        }, 1200);
    };

    return (
        <div className="flex-1 flex flex-col">
            <div className="flex-1 overflow-y-auto p-6">
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6 flex items-start space-x-3">
                    <Info size={20} className="text-blue-600 mt-0.5"/>
                    <div className="text-sm text-blue-800">
                        <p className="font-bold mb-1">Action Simulator</p>
                        <p>Use this test bench to verify your action logic with specific inputs. Mock output data will be generated based on your Output Schema.</p>
                    </div>
                </div>
                
                {/* Example Loader */}
                {action.testExamples && action.testExamples.length > 0 && (
                    <div className="mb-6">
                        <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Load Example</h4>
                        <div className="flex flex-wrap gap-2">
                            {action.testExamples.map(ex => (
                                <button 
                                    key={ex.id}
                                    onClick={() => setTestInputValues(ex.inputValues)}
                                    className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-all"
                                >
                                    {ex.name}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div className="space-y-4 max-w-2xl">
                        {action.parameters?.map(param => (
                        <div key={param.name}>
                            <label className="block text-xs font-bold text-slate-500 mb-1 flex justify-between">
                                <span>{param.name}</span>
                                <span className="font-normal text-slate-400 font-mono">{param.type}</span>
                            </label>
                            <input 
                                className="w-full p-2.5 border border-slate-200 rounded-lg bg-white text-sm text-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all font-mono"
                                value={testInputValues[param.name] || ''}
                                onChange={(e) => setTestInputValues({...testInputValues, [param.name]: e.target.value})}
                                placeholder={param.defaultValue ? `Default: ${param.defaultValue}` : `Enter ${param.name}...`}
                            />
                        </div>
                    ))}
                    {(!action.parameters || action.parameters.length === 0) && (
                        <div className="text-sm text-slate-400 italic">No inputs needed for this action.</div>
                    )}
                </div>

                {!action.isBuiltIn && onSaveExample && (
                    <div className="mt-6 pt-4 border-t border-slate-100">
                        <button onClick={onSaveExample} className="text-xs text-blue-600 hover:underline flex items-center">
                            <Plus size={12} className="mr-1"/> Save current inputs as new Example
                        </button>
                    </div>
                )}
            </div>

            <div className="bg-slate-50 border-t border-slate-200 p-4">
                <div className="flex justify-between items-start mb-4">
                    <h4 className="text-xs font-bold text-slate-500 uppercase mt-2">Execution Output</h4>
                    <button 
                        onClick={handleRunTest}
                        disabled={isTesting}
                        className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold text-sm shadow-lg shadow-green-200 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        {isTesting ? <Loader2 size={16} className="animate-spin"/> : <Play size={16}/>}
                        <span>{t('library.run')}</span>
                    </button>
                </div>
                <div className="bg-slate-900 rounded-lg p-4 h-48 overflow-y-auto font-mono text-xs text-green-400 shadow-inner leading-relaxed border border-slate-800">
                    {testResult ? (
                        <div className="whitespace-pre-wrap">{testResult}</div>
                    ) : (
                        <div className="text-slate-600 italic">Ready to execute... waiting for input.</div>
                    )}
                </div>
            </div>
        </div>
    );
};
