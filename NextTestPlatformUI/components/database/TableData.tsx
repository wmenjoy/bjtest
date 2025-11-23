
import React from 'react';
import { TableSchema } from '../../types';
import { useConfig } from '../../ConfigContext';

interface TableDataProps {
    table: TableSchema;
    data: any[];
    onUpdateRow: (rowIdx: number, field: string, value: string) => void;
}

export const TableData: React.FC<TableDataProps> = ({ table, data, onUpdateRow }) => {
    const { t } = useConfig();

    return (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm overflow-x-auto">
            <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                    <tr>
                        <th className="px-4 py-2 w-10">#</th>
                        {table.columns.map(col => (
                            <th key={col.name} className="px-4 py-2 whitespace-nowrap">{col.name} <span className="text-[10px] text-slate-400 font-normal">({col.type})</span></th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {(data || []).map((row, rIdx) => (
                        <tr key={rIdx} className="hover:bg-slate-50">
                            <td className="px-4 py-2 text-slate-400 text-xs">{rIdx + 1}</td>
                            {table.columns.map(col => (
                                <td key={col.name} className="px-4 py-2">
                                    <input 
                                        className="w-full bg-transparent focus:outline-none border-b border-transparent focus:border-blue-400"
                                        value={row[col.name]}
                                        onChange={e => onUpdateRow(rIdx, col.name, e.target.value)}
                                    />
                                </td>
                            ))}
                        </tr>
                    ))}
                    {(!data || data.length === 0) && (
                        <tr>
                            <td colSpan={table.columns.length + 1} className="p-8 text-center text-slate-400 italic">
                                {t('db.noData')}
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};
