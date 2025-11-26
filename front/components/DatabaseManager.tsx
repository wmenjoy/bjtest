
import React, { useState, useMemo } from 'react';
import { TableSchema, TableColumn } from '../types';
import { Database, Table, Plus } from 'lucide-react';
import { useConfig } from '../ConfigContext';
import { TableList } from './database/TableList';
import { TableDesigner } from './database/TableDesigner';
import { TableData } from './database/TableData';

// Mock Data
const MOCK_TABLES: TableSchema[] = [
    {
        id: 'tb-1',
        projectId: 'proj-1',
        name: 'users',
        description: 'System users table',
        columns: [
            { name: 'id', type: 'INT', isPrimaryKey: true },
            { name: 'username', type: 'VARCHAR', isNullable: false },
            { name: 'email', type: 'VARCHAR' },
            { name: 'created_at', type: 'TIMESTAMP' }
        ]
    },
    {
        id: 'tb-2',
        projectId: 'proj-1',
        name: 'orders',
        description: 'Customer orders',
        columns: [
            { name: 'id', type: 'INT', isPrimaryKey: true },
            { name: 'user_id', type: 'INT' },
            { name: 'total', type: 'INT' },
            { name: 'status', type: 'VARCHAR' }
        ]
    },
    {
        id: 'tb-3',
        projectId: 'proj-2',
        name: 'mobile_sessions',
        description: 'Active user sessions',
        columns: [
             { name: 'device_id', type: 'VARCHAR', isPrimaryKey: true },
             { name: 'token', type: 'VARCHAR' }
        ]
    }
];

const MOCK_DATA: Record<string, any[]> = {
    'tb-1': [
        { id: 1, username: 'alice', email: 'alice@test.com', created_at: '2023-01-01' },
        { id: 2, username: 'bob', email: 'bob@test.com', created_at: '2023-01-02' }
    ],
    'tb-2': [
        { id: 101, user_id: 1, total: 500, status: 'paid' },
        { id: 102, user_id: 2, total: 120, status: 'pending' }
    ],
    'tb-3': [
        { device_id: 'iphone-123', token: 'xyz' }
    ]
};

interface DatabaseManagerProps {
    projectId: string;
}

export const DatabaseManager: React.FC<DatabaseManagerProps> = ({ projectId }) => {
    const { t } = useConfig();
    const [tables, setTables] = useState<TableSchema[]>(MOCK_TABLES);
    const [selectedTable, setSelectedTable] = useState<TableSchema | null>(null);
    const [activeTab, setActiveTab] = useState<'schema' | 'data'>('schema');
    const [tableData, setTableData] = useState(MOCK_DATA);

    const projectTables = useMemo(() => tables.filter(t => t.projectId === projectId), [tables, projectId]);

    // When switching projects, ensure selected table is valid
    React.useEffect(() => {
        if (selectedTable && selectedTable.projectId !== projectId) {
            setSelectedTable(null);
        } else if (!selectedTable && projectTables.length > 0) {
             setSelectedTable(projectTables[0]);
        }
    }, [projectId, projectTables, selectedTable]);

    const handleAddTable = () => {
        const name = prompt("Enter table name:");
        if (name) {
            const newTable: TableSchema = {
                id: `tb-${Date.now()}`,
                projectId: projectId,
                name,
                columns: [{ name: 'id', type: 'INT', isPrimaryKey: true }]
            };
            setTables([...tables, newTable]);
            setTableData({...tableData, [newTable.id]: []});
            setSelectedTable(newTable);
        }
    };

    const handleDeleteTable = (id: string) => {
        if (confirm("Are you sure you want to drop this table?")) {
            setTables(tables.filter(t => t.id !== id));
            if (selectedTable?.id === id) setSelectedTable(null);
        }
    };

    const addColumn = () => {
        if (!selectedTable) return;
        const newCol: TableColumn = { name: 'new_column', type: 'VARCHAR', isNullable: true };
        const updatedTable = { ...selectedTable, columns: [...selectedTable.columns, newCol] };
        setTables(tables.map(t => t.id === selectedTable.id ? updatedTable : t));
        setSelectedTable(updatedTable);
    };

    const handleUpdateCell = (tableId: string, rowIdx: number, field: string, value: string) => {
        const newData = [...(tableData[tableId] || [])];
        newData[rowIdx] = { ...newData[rowIdx], [field]: value };
        setTableData({ ...tableData, [tableId]: newData });
    };

    const handleAddRow = (tableId: string) => {
        if (!selectedTable) return;
        const newRow: any = {};
        selectedTable.columns.forEach(c => newRow[c.name] = c.type === 'INT' ? 0 : '');
        setTableData({ ...tableData, [tableId]: [...(tableData[tableId] || []), newRow] });
    };

    const handleUpdateTable = (updatedTable: TableSchema) => {
        setTables(tables.map(t => t.id === updatedTable.id ? updatedTable : t));
        setSelectedTable(updatedTable);
    };

    return (
        <div className="flex h-full bg-white">
            <TableList 
                tables={projectTables} 
                selectedTableId={selectedTable?.id} 
                onSelect={setSelectedTable} 
                onAdd={handleAddTable} 
                onDelete={handleDeleteTable}
            />

            <div className="flex-1 flex flex-col overflow-hidden">
                {selectedTable ? (
                    <>
                        <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-white">
                            <div>
                                <h1 className="text-xl font-bold text-slate-800 flex items-center">
                                    <Table className="mr-2 text-slate-400"/> {selectedTable.name}
                                </h1>
                                <p className="text-sm text-slate-500 mt-1">{selectedTable.description || "No description"}</p>
                            </div>
                            <div className="flex items-center space-x-4">
                                <div className="flex bg-slate-100 p-1 rounded-lg">
                                    <button onClick={() => setActiveTab('schema')} className={`px-3 py-1 text-xs font-medium rounded ${activeTab === 'schema' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}>{t('db.design')}</button>
                                    <button onClick={() => setActiveTab('data')} className={`px-3 py-1 text-xs font-medium rounded ${activeTab === 'data' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}>{t('db.data')}</button>
                                </div>
                                {activeTab === 'schema' && (
                                    <button onClick={addColumn} className="flex items-center space-x-2 px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-sm font-medium">
                                        <Plus size={16}/><span>{t('db.addCol')}</span>
                                    </button>
                                )}
                                {activeTab === 'data' && (
                                    <button onClick={() => handleAddRow(selectedTable.id)} className="flex items-center space-x-2 px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-sm font-medium">
                                        <Plus size={16}/><span>{t('db.addRow')}</span>
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30">
                            {activeTab === 'schema' ? (
                                <TableDesigner table={selectedTable} onUpdate={handleUpdateTable} />
                            ) : (
                                <TableData 
                                    table={selectedTable} 
                                    data={tableData[selectedTable.id] || []} 
                                    onUpdateRow={(rowIdx, field, val) => handleUpdateCell(selectedTable.id, rowIdx, field, val)} 
                                />
                            )}
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                        <Database size={48} className="mb-4 opacity-20"/>
                        <p>{t('db.select')}</p>
                    </div>
                )}
            </div>
        </div>
    );
};
