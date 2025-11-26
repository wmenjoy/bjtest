
import React, { useState, useEffect } from 'react';
import { TestRun, ExecutionStatus } from '../types';
import { FileText, Download } from 'lucide-react';
import { analyzeTestReport } from '../services/geminiService';
import { useConfig } from '../ConfigContext';
import { StatCards } from './dashboard/StatCards';
import { Charts } from './dashboard/Charts';
import { ReportModal } from './dashboard/ReportModal';
import { TrendChart } from './dashboard/TrendChart';
import { TopFailuresTable } from './dashboard/TopFailuresTable';
import { statisticsApi, TestStatistics } from '../services/api/statisticsApi';

interface DashboardProps {
  runs: TestRun[];
}

const COLORS = ['#10b981', '#ef4444', '#f59e0b', '#64748b']; // Green, Red, Amber, Slate

export const Dashboard: React.FC<DashboardProps> = ({ runs }) => {
  const { t } = useConfig();
  const [aiInsight, setAiInsight] = useState<string>("");
  const [loadingInsight, setLoadingInsight] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [apiStats, setApiStats] = useState<TestStatistics | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

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

  // Generate trend data for last 7 days
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
  });

  const trendData = last7Days.map((date, idx) => ({
    date,
    successRate: Math.floor(75 + Math.random() * 20),
    executions: Math.floor(20 + Math.random() * 30),
    passed: Math.floor(15 + Math.random() * 20),
    failed: Math.floor(2 + Math.random() * 5)
  }));

  const topFailures = [
    { testName: 'test_user_login_invalid_credentials', failureCount: 15, successRate: 45, lastFailure: '2小时前' },
    { testName: 'test_api_timeout_handling', failureCount: 12, successRate: 60, lastFailure: '5小时前' },
    { testName: 'test_database_connection_pool', failureCount: 10, successRate: 55, lastFailure: '1天前' },
    { testName: 'test_cache_invalidation', failureCount: 8, successRate: 70, lastFailure: '1天前' },
    { testName: 'test_concurrent_requests', failureCount: 7, successRate: 75, lastFailure: '2天前' },
    { testName: 'test_payment_gateway_integration', failureCount: 6, successRate: 80, lastFailure: '3天前' },
    { testName: 'test_file_upload_large_size', failureCount: 5, successRate: 82, lastFailure: '3天前' },
    { testName: 'test_email_notification_service', failureCount: 4, successRate: 85, lastFailure: '4天前' },
    { testName: 'test_search_performance', failureCount: 3, successRate: 88, lastFailure: '5天前' },
    { testName: 'test_authentication_token_refresh', failureCount: 2, successRate: 92, lastFailure: '1周前' }
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

  // Load statistics from API
  useEffect(() => {
    const loadStatistics = async () => {
      try {
        setLoadingStats(true);
        const statistics = await statisticsApi.getStatistics();
        setApiStats(statistics);
      } catch (err) {
        console.error('Failed to load dashboard statistics:', err);
      } finally {
        setLoadingStats(false);
      }
    };

    loadStatistics();
  }, []);

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

      {/* Loading State for Statistics */}
      {loadingStats && (
        <div className="flex items-center justify-center p-6 bg-slate-50 rounded-lg border border-slate-200">
          <div className="flex flex-col items-center space-y-3">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
            <p className="text-sm text-slate-600">{t('dashboard.loading') || 'Loading statistics...'}</p>
          </div>
        </div>
      )}

      {/* Show API Statistics if Available */}
      {!loadingStats && apiStats && (
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
          <p className="text-sm text-blue-800">
            <span className="font-semibold">API Stats:</span> Total: {apiStats.totalTests}, My Tests: {apiStats.myTests}, P0: {apiStats.p0Tests}, Flaky: {apiStats.flakyTests}
          </p>
        </div>
      )}

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

      {/* Trend Charts Section */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <TrendChart
          type="line"
          title="成功率趋势 (最近7天)"
          data={trendData}
          dataKey="successRate"
          color="#10b981"
        />
        <TrendChart
          type="area"
          title="执行次数趋势 (最近7天)"
          data={trendData}
          dataKey="executions"
          color="#3b82f6"
        />
      </div>

      {/* Top Failures Table */}
      <div className="mb-6">
        <TopFailuresTable data={topFailures} />
      </div>

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
