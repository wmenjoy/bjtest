
import React, { useState, useEffect } from 'react';
import * as yaml from 'js-yaml';
import { Workflow, WorkflowNode } from '../types';
import { Save, AlertCircle } from 'lucide-react';

interface YamlEditorProps {
  workflow: Workflow;
  onUpdate: (updatedWorkflow: Workflow) => void;
}

export const YamlEditor: React.FC<YamlEditorProps> = ({ workflow, onUpdate }) => {
  const [yamlContent, setYamlContent] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Safe access to dump/load regardless of import style
  const dump = yaml.dump || (yaml as any).default?.dump;
  const load = yaml.load || (yaml as any).default?.load;

  useEffect(() => {
    try {
      if (dump) {
        const content = dump(workflow.nodes, { indent: 2, lineWidth: -1, noRefs: true });
        setYamlContent(content);
        setError(null);
      }
    } catch (e) {
      setError("Failed to generate YAML from workflow.");
    }
  }, [workflow.id, workflow.nodes, dump]);

  const handleSave = () => {
    try {
      if (!load) throw new Error("YAML parser not loaded");
      
      const parsed = load(yamlContent) as WorkflowNode[];
      if (!Array.isArray(parsed)) {
        throw new Error("Root must be an array of nodes");
      }
      onUpdate({ ...workflow, nodes: parsed });
      setError(null);
    } catch (e: any) {
      setError(e.message || "Invalid YAML syntax");
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#1e1e1e] text-slate-300 font-mono text-sm animate-fade-in">
      <div className="flex items-center justify-between px-4 py-2 bg-[#252526] border-b border-[#3e3e42]">
        <span className="text-xs text-slate-400 uppercase tracking-wider">workflow.yaml</span>
        <div className="flex items-center space-x-4">
            {error && <div className="flex items-center text-red-400 text-xs"><AlertCircle size={12} className="mr-1"/>{error}</div>}
            <button onClick={handleSave} className="flex items-center space-x-1 px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-medium transition-colors">
                <Save size={12} /><span>Apply Changes</span>
            </button>
        </div>
      </div>
      <div className="flex-1 relative">
        <textarea
            className="w-full h-full bg-[#1e1e1e] text-slate-200 p-4 resize-none focus:outline-none leading-relaxed"
            value={yamlContent}
            onChange={(e) => { setYamlContent(e.target.value); setError(null); }}
            spellCheck={false}
        />
      </div>
    </div>
  );
};
