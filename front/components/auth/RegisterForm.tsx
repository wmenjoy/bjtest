
import React from 'react';
import { useConfig } from '../../ConfigContext';

interface RegisterFormProps {
    onBackToLogin: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onBackToLogin }) => {
    const { t } = useConfig();

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-800 text-center">{t('auth.createAccount')}</h3>
            <div className="grid grid-cols-2 gap-4">
                <input className="px-3 py-2 border border-slate-200 rounded-lg text-sm" placeholder="First Name" />
                <input className="px-3 py-2 border border-slate-200 rounded-lg text-sm" placeholder="Last Name" />
            </div>
            <input className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" placeholder="Work Email" />
            <input className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" type="password" placeholder="Choose Password" />
            <button className="w-full bg-primary-600 text-white font-bold py-2 rounded-lg">{t('auth.signup')}</button>
            <div className="text-center">
                <button onClick={onBackToLogin} className="text-sm text-primary-600 hover:underline">Already have an account?</button>
            </div>
        </div>
    );
};
