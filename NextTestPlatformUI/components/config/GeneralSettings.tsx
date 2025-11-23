
import React from 'react';
import { SystemConfig } from '../../types';
import { Globe } from 'lucide-react';
import { useConfig } from '../../ConfigContext';

interface GeneralSettingsProps {
    config: SystemConfig;
    onChange: (config: SystemConfig) => void;
}

export const GeneralSettings: React.FC<GeneralSettingsProps> = ({ config, onChange }) => {
    const { t } = useConfig();

    return (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center space-x-2 mb-6 pb-4 border-b border-slate-100">
                <Globe className="text-blue-600" size={20}/>
                <h3 className="font-bold text-lg text-slate-800">{t('config.general')}</h3>
            </div>
            <div className="grid grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">{t('config.companyName')}</label>
                    <input 
                        className="w-full p-2 border border-slate-200 rounded-lg" 
                        value={config.companyName} 
                        onChange={e => onChange({...config, companyName: e.target.value})}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">{t('config.themeColor')}</label>
                    <div className="flex items-center space-x-2">
                    <input 
                        type="color" 
                        className="h-10 w-10 border border-slate-200 rounded cursor-pointer" 
                        value={config.themeColor} 
                        onChange={e => onChange({...config, themeColor: e.target.value})}
                    />
                    <span className="text-sm text-slate-500 font-mono">{config.themeColor}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
