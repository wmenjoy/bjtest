
import React, { useState } from 'react';
import { Mail, Lock, ArrowRight, Smartphone, QrCode } from 'lucide-react';
import { useConfig } from '../../ConfigContext';

interface LoginFormProps {
    onLogin: (email: string) => void;
    onForgotPassword: () => void;
    onRegisterClick: () => void;
    onSSO: (provider: string) => void;
    isLoading: boolean;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onLogin, onForgotPassword, onRegisterClick, onSSO, isLoading }) => {
    const { t } = useConfig();
    const [email, setEmail] = useState('admin@nextest.com');
    const [password, setPassword] = useState('password');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onLogin(email);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">{t('auth.email')}</label>
                <div className="relative">
                    <Mail className="absolute left-3 top-2.5 text-slate-400" size={18} />
                    <input 
                    type="email" 
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    />
                </div>
            </div>
            <div className="space-y-1">
                <div className="flex justify-between">
                    <label className="text-xs font-bold text-slate-500 uppercase">{t('auth.password')}</label>
                    <button type="button" onClick={onForgotPassword} className="text-xs text-primary-600 hover:underline">{t('auth.forgot')}?</button>
                </div>
                <div className="relative">
                    <Lock className="absolute left-3 top-2.5 text-slate-400" size={18} />
                    <input 
                    type="password" 
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    />
                </div>
            </div>

            <button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-2.5 rounded-lg transition-all shadow-md shadow-primary-500/20 flex items-center justify-center"
            >
                {isLoading ? t('auth.authenticating') : t('auth.signin')}
                {!isLoading && <ArrowRight size={18} className="ml-2" />}
            </button>

            <div className="relative my-6">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
                <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-slate-400">{t('auth.sso')}</span></div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={() => onSSO('WeChat')} className="flex items-center justify-center py-2 border border-slate-200 rounded-lg hover:bg-green-50 hover:border-green-200 transition-colors group">
                    <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center mr-2 group-hover:scale-110 transition-transform"><Smartphone size={14} /></div>
                    <span className="text-sm text-slate-600 font-medium">WeChat</span>
                </button>
                <button type="button" onClick={() => onSSO('QQ')} className="flex items-center justify-center py-2 border border-slate-200 rounded-lg hover:bg-blue-50 hover:border-blue-200 transition-colors group">
                    <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-2 group-hover:scale-110 transition-transform"><QrCode size={14} /></div>
                    <span className="text-sm text-slate-600 font-medium">QQ Login</span>
                </button>
            </div>
            
            <div className="bg-slate-50 p-4 text-center border-t border-slate-100 -mx-8 -mb-8 mt-8">
                <p className="text-xs text-slate-500">Don't have an account? <button type="button" onClick={onRegisterClick} className="text-primary-600 font-bold hover:underline">{t('auth.signup')}</button></p>
            </div>
        </form>
    );
};
