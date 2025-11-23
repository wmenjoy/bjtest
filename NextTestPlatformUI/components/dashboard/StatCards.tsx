
import React from 'react';
import { CheckCircle, XCircle, Activity, AlertTriangle } from 'lucide-react';
import { useConfig } from '../../ConfigContext';

interface StatCardsProps {
    stats: {
        passed: number;
        failed: number;
        blocked: number;
        skipped: number;
        total: number;
    };
    passRate: number;
}

export const StatCards: React.FC<StatCardsProps> = ({ stats, passRate }) => {
    const { t } = useConfig();

    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center space-x-4 hover:shadow-md transition-shadow">
          <div className="p-3 bg-green-50 text-green-600 rounded-lg ring-1 ring-green-100">
            <CheckCircle size={24} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wide">{t('dashboard.passRate')}</p>
            <h3 className="text-2xl font-extrabold text-slate-800">{passRate}%</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center space-x-4 hover:shadow-md transition-shadow">
          <div className="p-3 bg-red-50 text-red-600 rounded-lg ring-1 ring-red-100">
            <XCircle size={24} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wide">{t('dashboard.failed')}</p>
            <h3 className="text-2xl font-extrabold text-slate-800">{stats.failed}</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center space-x-4 hover:shadow-md transition-shadow">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg ring-1 ring-blue-100">
            <Activity size={24} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wide">{t('dashboard.executed')}</p>
            <h3 className="text-2xl font-extrabold text-slate-800">{stats.total}</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center space-x-4 hover:shadow-md transition-shadow">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg ring-1 ring-amber-100">
            <AlertTriangle size={24} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wide">{t('dashboard.pending')}</p>
            <h3 className="text-2xl font-extrabold text-slate-800">{stats.blocked + stats.skipped}</h3>
          </div>
        </div>
      </div>
    );
};
