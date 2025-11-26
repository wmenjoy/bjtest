import React from 'react';
import { AlertCircle } from 'lucide-react';

interface TopFailure {
    testName: string;
    failureCount: number;
    lastFailure: string;
    successRate: number;
}

interface TopFailuresTableProps {
    data: TopFailure[];
}

export const TopFailuresTable: React.FC<TopFailuresTableProps> = ({ data }) => {
    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center mb-4">
                <AlertCircle size={20} className="text-red-600 mr-2" />
                <h3 className="text-sm font-bold text-slate-700">Top 10 失败用例</h3>
            </div>

            {data && data.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 text-slate-500 font-medium border-b">
                            <tr>
                                <th className="px-4 py-2 text-left">#</th>
                                <th className="px-4 py-2 text-left">测试用例</th>
                                <th className="px-4 py-2 text-right">失败次数</th>
                                <th className="px-4 py-2 text-right">成功率</th>
                                <th className="px-4 py-2 text-right">最后失败</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {data.slice(0, 10).map((item, idx) => (
                                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-4 py-2 text-slate-500">{idx + 1}</td>
                                    <td className="px-4 py-2 text-slate-800 font-medium">{item.testName}</td>
                                    <td className="px-4 py-2 text-right">
                                        <span className="text-red-600 font-semibold">{item.failureCount}</span>
                                    </td>
                                    <td className="px-4 py-2 text-right">
                                        <span className={`font-semibold ${
                                            item.successRate >= 80 ? 'text-green-600' :
                                            item.successRate >= 50 ? 'text-amber-600' :
                                            'text-red-600'
                                        }`}>
                                            {item.successRate}%
                                        </span>
                                    </td>
                                    <td className="px-4 py-2 text-right text-slate-500 text-xs">{item.lastFailure}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="text-center py-8 text-slate-500">
                    <AlertCircle size={48} className="mx-auto mb-2 text-slate-300" />
                    <p>暂无失败用例数据</p>
                </div>
            )}
        </div>
    );
};
