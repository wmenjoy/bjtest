
import React from 'react';
import { TestRun, ExecutionStatus } from '../../types';
import { X, FileText, Printer, FileDown } from 'lucide-react';

interface ReportModalProps {
    runs: TestRun[];
    stats: {
        passed: number;
        failed: number;
        total: number;
    };
    passRate: number;
    aiInsight: string;
    onClose: () => void;
}

export const ReportModal: React.FC<ReportModalProps> = ({ runs, stats, passRate, aiInsight, onClose }) => {
    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
               <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                  <div className="flex items-center space-x-3">
                      <div className="p-2 bg-primary-100 text-primary-600 rounded-lg">
                          <FileText size={20}/>
                      </div>
                      <div>
                          <h3 className="font-bold text-lg text-slate-800">Export Report</h3>
                          <p className="text-xs text-slate-500">Choose format and download</p>
                      </div>
                  </div>
                  <button onClick={onClose} className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-2 rounded-full transition-colors"><X size={20}/></button>
               </div>
               
               <div className="p-8 overflow-y-auto custom-scrollbar">
                  <div className="bg-slate-50 rounded-xl border border-slate-200 p-6 mb-8">
                      <h1 className="text-xl font-bold text-slate-900 text-center mb-2">Test Execution Summary</h1>
                      <p className="text-slate-500 text-center text-sm mb-6">{new Date().toLocaleDateString()} • {new Date().toLocaleTimeString()}</p>
                      
                      <div className="grid grid-cols-3 gap-4">
                          <div className="bg-white p-4 rounded-lg text-center border border-slate-100 shadow-sm">
                              <span className="block text-2xl font-extrabold text-green-600">{passRate}%</span>
                              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Pass Rate</span>
                          </div>
                          <div className="bg-white p-4 rounded-lg text-center border border-slate-100 shadow-sm">
                              <span className="block text-2xl font-extrabold text-red-600">{stats.failed}</span>
                              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Failed</span>
                          </div>
                          <div className="bg-white p-4 rounded-lg text-center border border-slate-100 shadow-sm">
                              <span className="block text-2xl font-extrabold text-primary-600">{stats.total}</span>
                              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Runs</span>
                          </div>
                      </div>
                  </div>

                  <div className="space-y-6">
                      <div>
                          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 border-b border-slate-100 pb-2">AI Analysis</h4>
                          <p className="text-sm text-slate-700 leading-relaxed italic pl-4 border-l-2 border-primary-200">
                              "{aiInsight || "No analysis data available."}"
                          </p>
                      </div>

                      {runs.some(r => r.status === ExecutionStatus.FAILED) && (
                          <div>
                              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 border-b border-slate-100 pb-2">Top Failures</h4>
                              <ul className="space-y-2">
                                  {runs.filter(r => r.status === ExecutionStatus.FAILED).slice(0,5).map(r => (
                                      <li key={r.id} className="text-sm flex justify-between items-center bg-red-50 px-3 py-2 rounded border border-red-100">
                                          <span className="font-medium text-red-700">{r.name}</span>
                                          <span className="text-xs text-red-400">{new Date(r.executedAt).toLocaleDateString()}</span>
                                      </li>
                                  ))}
                              </ul>
                          </div>
                      )}
                  </div>
               </div>

               <div className="p-6 border-t border-slate-200 bg-slate-50 flex justify-end space-x-3">
                   <button onClick={() => alert("Simulated Print")} className="flex items-center space-x-2 px-4 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 hover:border-slate-400 font-medium transition-all shadow-sm">
                       <Printer size={16}/><span>Print</span>
                   </button>
                   <button onClick={() => alert("Simulated PDF Download")} className="flex items-center space-x-2 px-6 py-2.5 bg-slate-900 text-white rounded-lg hover:bg-black font-bold shadow-md hover:shadow-lg transition-all">
                       <FileDown size={16}/><span>Download PDF</span>
                   </button>
               </div>
            </div>
        </div>
    );
};
