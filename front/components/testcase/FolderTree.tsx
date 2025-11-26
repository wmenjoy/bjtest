
import React, { useState } from 'react';
import { TestFolder, TestCase } from '../../types';
import { Folder, Layout, ChevronDown, ChevronRight, Plus, FileText } from 'lucide-react';
import { useConfig } from '../../ConfigContext';
import { QuickFilter } from './QuickFilter';
import { TestStatistics } from '../../services/api/testCaseStatsApi';

interface FolderTreeProps {
    folders: TestFolder[];
    cases: TestCase[];
    selectedFolderId: string;
    selectedCaseId?: string | null;
    onSelectFolder: (id: string) => void;
    onSelectCase: (testCase: TestCase) => void;
    onEditCase: (testCase: TestCase) => void;
    onAddFolder: (type: 'service' | 'module') => void;
    statistics?: TestStatistics | null;
    statsLoading?: boolean;
}

const FolderItem: React.FC<{
    folder: TestFolder;
    selectedFolderId: string;
    selectedCaseId?: string | null;
    onSelect: (id: string) => void;
    onSelectCase: (testCase: TestCase) => void;
    onEditCase: (testCase: TestCase) => void;
    level: number;
    childrenFolders: TestFolder[];
    allFolders: TestFolder[];
    cases: TestCase[];
}> = ({ folder, selectedFolderId, selectedCaseId, onSelect, onSelectCase, onEditCase, level, childrenFolders, allFolders, cases }) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const hasChildren = childrenFolders.length > 0;

    const getChildFolders = (parentId: string) => allFolders.filter(f => f.parentId === parentId);

    return (
        <div>
            <div 
                className={`flex items-center px-2 py-1.5 cursor-pointer hover:bg-slate-100 rounded-md mb-0.5 ${selectedFolderId === folder.id ? 'bg-blue-100 text-blue-700 font-medium' : 'text-slate-600'}`}
                style={{ paddingLeft: `${level * 12 + 8}px` }}
                onClick={() => onSelect(folder.id)}
            >
                <button 
                    onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
                    className={`p-0.5 rounded hover:bg-slate-200 mr-1 ${hasChildren ? 'visible' : 'invisible'}`}
                >
                    {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                </button>
                <Folder size={14} className={`mr-2 ${selectedFolderId === folder.id ? 'fill-blue-200 text-blue-600' : 'text-slate-400'}`} />
                <span className="text-sm truncate">{folder.name}</span>
            </div>
            {isExpanded && childrenFolders.map(child => (
                <FolderItem
                    key={child.id}
                    folder={child}
                    selectedFolderId={selectedFolderId}
                    selectedCaseId={selectedCaseId}
                    onSelect={onSelect}
                    onSelectCase={onSelectCase}
                    onEditCase={onEditCase}
                    level={level + 1}
                    allFolders={allFolders}
                    childrenFolders={getChildFolders(child.id)}
                    cases={cases}
                />
            ))}
            {/* 该文件夹的案例列表 - 新增 */}
            {isExpanded && cases
                .filter(c => c.folderId === folder.id)
                .map(testCase => (
                    <div
                        key={testCase.id}
                        className={`flex items-center px-3 py-1.5 cursor-pointer group ${
                            selectedCaseId === testCase.id
                                ? 'bg-blue-50 text-blue-700'
                                : 'hover:bg-slate-50 text-slate-700'
                        }`}
                        style={{ paddingLeft: `${(level + 1) * 12 + 20}px` }}
                        onClick={() => onSelectCase(testCase)}
                        onDoubleClick={() => onEditCase(testCase)}
                    >
                        <FileText size={14} className="mr-2 flex-shrink-0 text-slate-400" />
                        <span className="text-xs truncate flex-1">
                            {testCase.title || 'Untitled Test'}
                        </span>
                        <span className="text-[10px] text-slate-400 ml-1">
                            {testCase.steps?.length || 0}
                        </span>
                    </div>
                ))}
        </div>
    );
};

export const FolderTree: React.FC<FolderTreeProps> = ({
    folders,
    cases,
    selectedFolderId,
    selectedCaseId,
    onSelectFolder,
    onSelectCase,
    onEditCase,
    onAddFolder,
    statistics,
    statsLoading
}) => {
    const { t } = useConfig();
    const rootFolders = folders.filter(f => f.parentId === 'root');

    return (
        <div className="w-64 min-w-[250px] border-r border-slate-200 flex flex-col bg-slate-50">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center">
                <h3 className="font-semibold text-slate-700 text-sm">{t('testCase.explorer')}</h3>
                <div className="flex space-x-1">
                    <button
                        onClick={() => onAddFolder('service')}
                        title="New Service"
                        className="p-1 hover:bg-slate-200 rounded text-slate-500"
                    >
                        <Folder size={16} />
                    </button>
                    <button
                        onClick={() => onAddFolder('module')}
                        title="New Module"
                        className="p-1 hover:bg-slate-200 rounded text-slate-400"
                    >
                        <Plus size={16} />
                    </button>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
                <div
                    className={`flex items-center px-2 py-1.5 cursor-pointer hover:bg-slate-100 rounded-md mb-0.5 ${selectedFolderId === 'root' ? 'bg-blue-100 text-blue-700 font-medium' : 'text-slate-600'}`}
                    onClick={() => onSelectFolder('root')}
                >
                    <Layout size={14} className="mr-2" />
                    <span className="text-sm">{t('testCase.allServices') || 'All Services'}</span>
                </div>
                {rootFolders.map(f => (
                    <FolderItem
                        key={f.id}
                        folder={f}
                        selectedFolderId={selectedFolderId}
                        selectedCaseId={selectedCaseId}
                        onSelect={onSelectFolder}
                        onSelectCase={onSelectCase}
                        onEditCase={onEditCase}
                        allFolders={folders}
                        childrenFolders={folders.filter(child => child.parentId === f.id)}
                        cases={cases}
                        level={0}
                    />
                ))}
            </div>

            {/* Quick Filters Section */}
            {!statsLoading && statistics && (
                <div className="px-3 py-4 border-t border-slate-200">
                    <h4 className="text-xs font-semibold text-slate-500 uppercase mb-3">
                        {t('testCase.quickFilters') || 'Quick Filters'}
                    </h4>
                    <div className="space-y-1">
                        <QuickFilter
                            icon="📋"
                            label={t('testCase.allTests') || 'All Tests'}
                            count={statistics.totalTests}
                            onClick={() => console.log('Filter: all')}
                        />
                        <QuickFilter
                            icon="👤"
                            label={t('testCase.myTests') || 'My Tests'}
                            count={statistics.myTests}
                            onClick={() => console.log('Filter: my')}
                        />
                        <QuickFilter
                            icon="🔥"
                            label={t('testCase.p0Tests') || 'P0 Tests'}
                            count={statistics.p0Tests}
                            badge="warning"
                            onClick={() => console.log('Filter: p0')}
                        />
                        <QuickFilter
                            icon="⚠️"
                            label={t('testCase.flakyTests') || 'Flaky Tests'}
                            count={statistics.flakyTests}
                            badge="warning"
                            onClick={() => console.log('Filter: flaky')}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};
