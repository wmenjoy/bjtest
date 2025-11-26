
import React, { useState } from 'react';
import { User, Beaker, Shield } from 'lucide-react';
import { User as UserType } from '../types';
import { useConfig } from '../ConfigContext';
import { LoginForm } from './auth/LoginForm';
import { RegisterForm } from './auth/RegisterForm';

interface AuthProps {
  onLogin: (user: UserType) => void;
}

export const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const { t } = useConfig();
  const [view, setView] = useState<'login' | 'register' | 'forgot'>('login');
  const [isLoading, setIsLoading] = useState(false);

  const handleLoginSubmit = (email: string) => {
    setIsLoading(true);
    setTimeout(() => {
      onLogin({
        id: 'u1',
        name: 'Admin User',
        email: email,
        roleId: 'admin',
        orgId: 'org-1',
        status: 'active',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix'
      });
      setIsLoading(false);
    }, 1000);
  };

  const handleSSO = (provider: string) => {
    setIsLoading(true);
    setTimeout(() => {
      onLogin({
        id: 'u2',
        name: `${provider} User`,
        email: `user@${provider}.com`,
        roleId: 'editor',
        orgId: 'org-2',
        status: 'active',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka'
      });
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-fade-in">
        <div className="bg-slate-50 p-8 text-center border-b border-slate-100">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary-500/30">
               <Beaker size={28} />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-slate-800">{t('auth.welcome')}</h2>
          <p className="text-slate-500 text-sm mt-2">{t('auth.sub')}</p>
        </div>

        <div className="p-8">
          {view === 'login' && (
            <LoginForm 
                onLogin={handleLoginSubmit} 
                onForgotPassword={() => setView('forgot')}
                onRegisterClick={() => setView('register')}
                onSSO={handleSSO}
                isLoading={isLoading}
            />
          )}

          {view === 'forgot' && (
             <div className="text-center">
                <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-4 text-primary-500">
                    <Shield size={32} />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">{t('auth.forgot')}</h3>
                <p className="text-sm text-slate-500 mb-6">Enter your email address and we'll send you a link to reset your password.</p>
                <div className="space-y-4">
                    <input 
                        type="email" 
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                        placeholder="name@company.com"
                    />
                    <button className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 rounded-lg">Send Reset Link</button>
                    <button onClick={() => setView('login')} className="text-sm text-slate-500 hover:text-slate-800">Back to Login</button>
                </div>
             </div>
          )}

          {view === 'register' && (
              <RegisterForm onBackToLogin={() => setView('login')} />
          )}
        </div>
      </div>
    </div>
  );
};
