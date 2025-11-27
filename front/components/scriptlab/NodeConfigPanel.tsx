
import React, { useState, useEffect } from 'react';
import { WorkflowNode, NodeConfig } from '../../types';
import { X, Save, ArrowDownToLine } from 'lucide-react';
import { NODE_SPECS, DEFAULT_NODE_SPEC } from './constants';
import { SmartField, KVEditor } from './Widgets';
import { useConfig } from '../../ConfigContext';

interface NodeConfigPanelProps {
    node: WorkflowNode;
    onUpdate: (n: WorkflowNode) => void;
    onClose: () => void;
    currentInputSetter: (fn: (val: string) => void) => void;
}

export const NodeConfigPanel: React.FC<NodeConfigPanelProps> = ({ node, onUpdate, onClose, currentInputSetter }) => {
    const { t } = useConfig();
    const spec = NODE_SPECS[node.type] || DEFAULT_NODE_SPEC;
    const [localConfig, setLocalConfig] = useState<NodeConfig>(node.config || {});
    const [nodeName, setNodeName] = useState(node.name);
    const [activeTab, setActiveTab] = useState<'config' | 'output'>('config');

    useEffect(() => {
        setLocalConfig(node.config || {});
        setNodeName(node.name);
    }, [node.id, node.name, node.config]);

    const handleSave = () => {
        onUpdate({ ...node, name: nodeName, config: localConfig });
    };

    const updateConfig = (key: keyof NodeConfig, value: any) => {
        setLocalConfig(prev => ({ ...prev, [key]: value }));
    };

    return (
        <div className="flex-1 flex flex-col">
            {/* Header */}
            <div className="h-14 border-b border-slate-200 flex items-center justify-between px-6 bg-white">
                <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${spec.color.replace('text-', 'bg-').replace('600', '100')} ${spec.color}`}>
                        <spec.icon size={20} />
                    </div>
                    <div>
                        <input 
                            className="font-bold text-slate-800 focus:outline-none border-b border-transparent hover:border-slate-300 focus:border-blue-500 transition-all"
                            value={nodeName}
                            onChange={e => setNodeName(e.target.value)}
                        />
                        <div className="text-xs text-slate-400">{spec.title}</div>
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                    <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors"><X size={18}/></button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex px-6 border-b border-slate-200 bg-white">
                <button onClick={() => setActiveTab('config')} className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'config' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>{t('lab.config')}</button>
                <button onClick={() => setActiveTab('output')} className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'output' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>{t('lab.debug')}</button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30">
                {activeTab === 'config' ? (
                    <div className="max-w-2xl mx-auto space-y-8">
                        {spec.groups.map((group, idx) => (
                            <div key={idx} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                                <h4 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">{group.title}</h4>
                                <div className="space-y-4">
                                    {group.fields.map(field => (
                                        <SmartField 
                                            key={field.key}
                                            spec={field}
                                            value={localConfig[field.key]}
                                            onChange={(val) => updateConfig(field.key, val)}
                                            activeSetter={currentInputSetter}
                                        />
                                    ))}
                                </div>
                            </div>
                        ))}
                        {/* Output Extraction Section (Unified) */}
                        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                            <h4 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2 flex items-center"><ArrowDownToLine size={16} className="mr-2 text-purple-500"/> Output Mapping</h4>
                            <p className="text-xs text-slate-500 mb-4">Map specific values from this node's output to global variables for easier access downstream.</p>
                            <KVEditor data={localConfig.outputTransform || {}} onChange={(d) => updateConfig('outputTransform', d)} />
                        </div>
                    </div>
                ) : (
                    <div className="h-full flex flex-col">
                        <div className="bg-slate-900 rounded-lg p-4 flex-1 font-mono text-xs text-green-400 overflow-auto shadow-inner border border-slate-800">
                            {JSON.stringify(spec.outputMock, null, 2)}
                        </div>
                        <div className="mt-2 text-xs text-slate-400 text-center">
                            * This is a mock preview. Run the workflow to see live data.
                        </div>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-200 bg-white flex justify-end">
                <button onClick={handleSave} className="flex items-center space-x-2 px-6 py-2.5 bg-slate-900 text-white rounded-lg shadow hover:bg-black text-sm font-medium transition-all">
                    <Save size={16} />
                    <span>{t('lab.saveNode')}</span>
                </button>
            </div>
        </div>
    );
};
