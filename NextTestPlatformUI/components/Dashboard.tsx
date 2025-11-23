
import React, { useState, useEffect } from 'react';
import { TestRun, ExecutionStatus } from '../types';
import { FileText, Download } from 'lucide-react';
import { analyzeTestReport } from '../services/geminiService';
import { useConfig } from '../ConfigContext';
import { StatCards } from './dashboard/StatCards';
import { Charts } from './dashboard/Charts';
import { ReportModal } from './dashboard/ReportModal';

interface DashboardProps {
  runs: TestRun[];
}

const COLORS = ['#10b981', '#ef4444', '#f59e0b', '#64748b']; // Green, Red, Amber, Slate

export const Dashboard: React.FC<DashboardProps> = ({ runs }) => {
  const { t } = useConfig();
  const [aiInsight, setAiInsight] = useState<string>("");
  const [loadingInsight, setLoadingInsight] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  const stats = {
    passed: runs.filter(r => r.status === ExecutionStatus.PASSED).length,
    failed: runs.filter(r => r.status === ExecutionStatus.FAILED).length,
    blocked: runs.filter(r => r.status === ExecutionStatus.BLOCKED).length,
    skipped: runs.filter(r => r.status === ExecutionStatus.SKIPPED).length,
    total: runs.length
  };

  const passRate = stats.total > 0 ? Math.round((stats.passed / stats.total) * 100) : 0;

  const pieData = [
    { name: 'Passed', value: stats.passed },
    { name: 'Failed', value: stats.failed },
    { name: 'Blocked', value: stats.blocked },
    { name: 'Skipped', value: stats.skipped },
  ];

  // Mock historical data
  const barData = [
    { name: 'Sprint 1', passed: 40, failed: 24 },
    { name: 'Sprint 2', passed: 30, failed: 13 },
    { name: 'Sprint 3', passed: 20, failed: 9 },
    { name: 'Current', passed: stats.passed, failed: stats.failed },
  ];

  useEffect(() => {
    const fetchInsight = async () => {
      if (stats.total === 0) return;
      setLoadingInsight(true);
      const summary = `Total: ${stats.total}, Passed: ${stats.passed}, Failed: ${stats.failed}, Blocked: ${stats.blocked}. Pass rate: ${passRate}%.`;
      const insight = await analyzeTestReport(summary);
      setAiInsight(insight);
      setLoadingInsight(false);
    };
    fetchInsight();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runs.length]); 

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex justify-between items-center">
          <div>
             <h2 className="text-2xl font-bold text-slate-800">{t('dashboard.title')}</h2>
             <p className="text-sm text-slate-500">{t('dashboard.subtitle')}</p>
          </div>
          <button 
            onClick={() => setShowReportModal(true)}
            className="h-10 flex items-center space-x-2 px-4 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-primary-300 text-slate-700 text-sm font-medium shadow-sm transition-all active:scale-95"
          >
             <Download size={16} className="text-primary-600"/>
             <span>{t('dashboard.export')}</span>
          </button>
      </div>

      <StatCards stats={stats} passRate={passRate} />

      {/* AI Insight Banner */}
      <div className="bg-gradient-to-r from-primary-50 via-purple-50 to-primary-50 border border-primary-100 p-5 rounded-xl flex items-start space-x-4 shadow-sm">
         <div className="mt-1 p-2 bg-white rounded-lg text-primary-600 shadow-sm">
            <FileText size={20} />
         </div>
         <div className="flex-1">
            <h4 className="text-sm font-bold text-primary-900 uppercase tracking-wide mb-1">{t('dashboard.aiSummary')}</h4>
            <p className="text-sm text-primary-800 leading-relaxed">
              {loadingInsight ? (
                  <span className="flex items-center"><span className="w-2 h-2 bg-primary-400 rounded-full animate-pulse mr-2"></span>{t('dashboard.analyzing')}</span>
              ) : (aiInsight || "No enough data available for analysis.")}
            </p>
         </div>
      </div>

      <Charts pieData={pieData} barData={barData} COLORS={COLORS} />

      {showReportModal && (
          <ReportModal 
             runs={runs} 
             stats={stats} 
             passRate={passRate} 
             aiInsight={aiInsight} 
             onClose={() => setShowReportModal(false)} 
          />
      )}
    </div>
  );
};
