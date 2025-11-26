
import React from 'react';
import { TableSchema } from '../../types';
import { Key, Trash2 } from 'lucide-react';
import { useConfig } from '../../ConfigContext';

interface TableDesignerProps {
    table: TableSchema;
    onUpdate: (table: TableSchema) => void;
}

export const TableDesigner: React.FC<TableDesignerProps> = ({ table, onUpdate }) => {
    const { t } = useConfig();

    const handleDeleteColumn = (idx: number) => {
        const newCols = [...table.columns];
        newCols.splice(idx, 1);
        onUpdate({ ...table, columns: newCols });
    };

    return (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
            <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                    <tr>
                        <th className="px-6 py-3 w-10">PK</th>
                        <th className="px-6 py-3">{t('db.colName')}</th>
                        <th className="px-6 py-3">{t('db.dataType')}</th>
                        <th className="px-6 py-3">{t('db.nullable')}</th>
                        <th className="px-6 py-3 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {table.columns.map((col, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                            <td className="px-6 py-4">
                                {col.isPrimaryKey && <Key size={14} className="text-amber-500"/>}
                            </td>
                            <td className="px-6 py-4 font-medium text-slate-700">
                                {col.name}
                            </td>
                            <td className="px-6 py-4">
                                <span className="px-2 py-1 bg-slate-100 rounded text-xs font-mono text-slate-600">{col.type}</span>
                            </td>
                            <td className="px-6 py-4 text-slate-500">
                                {col.isNullable ? 'Yes' : 'No'}
                            </td>
                            <td className="px-6 py-4 text-right">
                                <button onClick={() => handleDeleteColumn(idx)} className="text-slate-400 hover:text-red-500"><Trash2 size={14}/></button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
