
import React from 'react';
import { TableSchema } from '../../types';
import { Database, Plus, Table, Trash2 } from 'lucide-react';
import { useConfig } from '../../ConfigContext';

interface TableListProps {
    tables: TableSchema[];
    selectedTableId: string | undefined;
    onSelect: (table: TableSchema) => void;
    onAdd: () => void;
    onDelete: (id: string) => void;
}

export const TableList: React.FC<TableListProps> = ({ tables, selectedTableId, onSelect, onAdd, onDelete }) => {
    const { t } = useConfig();

    return (
        <div className="w-64 border-r border-slate-200 bg-slate-50 flex flex-col">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center">
                <h2 className="font-bold text-slate-700 flex items-center"><Database size={18} className="mr-2 text-blue-600"/> {t('db.schema')}</h2>
                <button onClick={onAdd} className="p-1 hover:bg-slate-200 rounded text-slate-500"><Plus size={16}/></button>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {tables.map(t => (
                    <div 
                        key={t.id} 
                        onClick={() => onSelect(t)}
                        className={`p-2 rounded flex justify-between items-center cursor-pointer text-sm ${selectedTableId === t.id ? 'bg-blue-100 text-blue-700 font-medium' : 'text-slate-600 hover:bg-slate-100'}`}
                    >
                        <div className="flex items-center"><Table size={14} className="mr-2 opacity-70"/> {t.name}</div>
                        <button onClick={(e) => {e.stopPropagation(); onDelete(t.id)}} className="text-slate-400 hover:text-red-500 p-1"><Trash2 size={12}/></button>
                    </div>
                ))}
            </div>
        </div>
    );
};
