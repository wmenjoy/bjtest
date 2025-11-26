
import React, { useState } from 'react';
import { SystemConfig, Environment } from '../types';
import { Save } from 'lucide-react';
import { useConfig } from '../ConfigContext';
import { EnvManager } from './config/EnvManager';
import { GeneralSettings } from './config/GeneralSettings';
import { SecuritySettings } from './config/SecuritySettings';

interface SystemConfigPageProps {
    environments?: Environment[];
    onUpdateEnvironments?: (envs: Environment[]) => void;
    projectId: string;
}

export const SystemConfigPage: React.FC<SystemConfigPageProps> = ({ environments = [], onUpdateEnvironments, projectId }) => {
    const { t } = useConfig();
    const [config, setConfig] = useState<SystemConfig>({
        companyName: 'NexTest Corp',
        ssoEnabled: true,
        ssoProviders: ['wechat', 'qq'],
        allowRegistration: false,
        defaultUserRole: 'viewer',
        themeColor: '#2563eb'
    });

    return (
        <div className="p-8 max-w-4xl mx-auto">
             <h1 className="text-2xl font-bold text-slate-800 mb-8">{t('config.title')}</h1>
             
             <div className="space-y-6">
                 {/* Environment Manager */}
                 {onUpdateEnvironments && (
                     <EnvManager 
                        environments={environments} 
                        onUpdateEnvironments={onUpdateEnvironments} 
                        projectId={projectId}
                     />
                 )}

                 {/* General Settings */}
                 <GeneralSettings config={config} onChange={setConfig} />

                 {/* Security Settings */}
                 <SecuritySettings config={config} onChange={setConfig} />

                 <div className="flex justify-end">
                     <button className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-lg">
                         <Save size={18}/><span>{t('config.save')}</span>
                     </button>
                 </div>
             </div>
        </div>
    );
};