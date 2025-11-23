
import React from 'react';
import { SystemConfig } from '../../types';
import { Shield } from 'lucide-react';
import { useConfig } from '../../ConfigContext';

interface SecuritySettingsProps {
    config: SystemConfig;
    onChange: (config: SystemConfig) => void;
}

export const SecuritySettings: React.FC<SecuritySettingsProps> = ({ config, onChange }) => {
    const { t } = useConfig();

    const toggleSSO = () => onChange({...config, ssoEnabled: !config.ssoEnabled});
    const toggleReg = () => onChange({...config, allowRegistration: !config.allowRegistration});
    
    const toggleProvider = (provider: 'wechat' | 'qq' | 'dingtalk') => {
        const newProviders = config.ssoProviders.includes(provider)
            ? config.ssoProviders.filter(p => p !== provider)
            : [...config.ssoProviders, provider];
        onChange({...config, ssoProviders: newProviders});
    };

    return (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center space-x-2 mb-6 pb-4 border-b border-slate-100">
                <Shield className="text-green-600" size={20}/>
                <h3 className="font-bold text-lg text-slate-800">{t('config.security')}</h3>
            </div>
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h4 className="font-medium text-slate-800">{t('config.enableSSO')}</h4>
                        <p className="text-sm text-slate-500">Allow users to login via WeChat/QQ</p>
                    </div>
                    <button 
                        onClick={toggleSSO}
                        className={`w-12 h-6 rounded-full transition-colors relative ${config.ssoEnabled ? 'bg-green-500' : 'bg-slate-200'}`}
                    >
                        <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${config.ssoEnabled ? 'translate-x-6' : ''}`}></div>
                    </button>
                </div>
                
                {config.ssoEnabled && (
                    <div className="pl-4 border-l-2 border-slate-100 space-y-2">
                        <label className="flex items-center space-x-2">
                            <input 
                                type="checkbox" 
                                checked={config.ssoProviders.includes('wechat')} 
                                onChange={() => toggleProvider('wechat')} 
                                className="rounded text-blue-600"
                            />
                            <span className="text-sm text-slate-700">WeChat Enterprise</span>
                        </label>
                        <label className="flex items-center space-x-2">
                            <input 
                                type="checkbox" 
                                checked={config.ssoProviders.includes('qq')} 
                                onChange={() => toggleProvider('qq')} 
                                className="rounded text-blue-600"
                            />
                            <span className="text-sm text-slate-700">QQ Connect</span>
                        </label>
                    </div>
                )}

                <hr className="border-slate-100"/>

                <div className="flex items-center justify-between">
                    <div>
                        <h4 className="font-medium text-slate-800">{t('config.publicReg')}</h4>
                        <p className="text-sm text-slate-500">Allow new users to sign up without invite</p>
                    </div>
                    <button 
                        onClick={toggleReg}
                        className={`w-12 h-6 rounded-full transition-colors relative ${config.allowRegistration ? 'bg-green-500' : 'bg-slate-200'}`}
                    >
                        <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${config.allowRegistration ? 'translate-x-6' : ''}`}></div>
                    </button>
                </div>
            </div>
        </div>
    );
};
