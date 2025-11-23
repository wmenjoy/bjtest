
import React, { useState } from 'react';
import { Environment } from '../../types';
import { Server, Plus } from 'lucide-react';
import { useConfig } from '../../ConfigContext';
import { EnvCard } from './EnvCard';

interface EnvManagerProps {
    environments: Environment[];
    projectId: string;
    onUpdateEnvironments: (envs: Environment[]) => void;
}

export const EnvManager: React.FC<EnvManagerProps> = ({ environments, projectId, onUpdateEnvironments }) => {
    const { t } = useConfig();
    const [expandedEnv, setExpandedEnv] = useState<string | null>(null);
    const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});

    const updateEnv = (updatedEnv: Environment) => {
        onUpdateEnvironments(environments.map(e => e.id === updatedEnv.id ? updatedEnv : e));
    };

    const addEnvironment = () => {
        const name = prompt("Enter Environment Name (e.g. UAT):");
        if (name) {
            const newEnv: Environment = {
                id: `env-${Date.now()}`,
                projectId,
                name,
                color: 'bg-slate-500',
                variables: []
            };
            onUpdateEnvironments([...environments, newEnv]);
            setExpandedEnv(newEnv.id);
        }
    };
    
    const cloneEnvironment = (env: Environment) => {
        const name = prompt(`Enter new name for clone of ${env.name}:`, `${env.name} Copy`);
        if (name) {
             const newEnv: Environment = {
                ...env,
                id: `env-${Date.now()}`,
                name: name,
                variables: env.variables.map(v => ({ ...v }))
            };
            onUpdateEnvironments([...environments, newEnv]);
            setExpandedEnv(newEnv.id);
        }
    };

    const deleteEnvironment = (id: string) => {
        if (confirm("Delete this environment? This cannot be undone.")) {
            onUpdateEnvironments(environments.filter(e => e.id !== id));
        }
    };

    const toggleSecret = (key: string) => {
        setShowSecrets(prev => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                <div className="flex items-center space-x-2">
                    <Server className="text-purple-600" size={20}/>
                    <h3 className="font-bold text-lg text-slate-800">{t('config.envManager')}</h3>
                </div>
                <button onClick={addEnvironment} className="flex items-center space-x-1 text-sm bg-purple-50 text-purple-700 px-3 py-1.5 rounded-lg hover:bg-purple-100 transition-colors font-medium">
                    <Plus size={14}/><span>{t('config.addEnv')}</span>
                </button>
            </div>
            
            <div className="space-y-4">
                {environments.map(env => (
                    <EnvCard 
                        key={env.id}
                        env={env}
                        isExpanded={expandedEnv === env.id}
                        showSecrets={showSecrets}
                        onToggleExpand={() => setExpandedEnv(expandedEnv === env.id ? null : env.id)}
                        onUpdate={updateEnv}
                        onClone={cloneEnvironment}
                        onDelete={deleteEnvironment}
                        onToggleSecret={toggleSecret}
                    />
                ))}
            </div>
        </div>
    );
};