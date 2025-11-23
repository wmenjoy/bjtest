
import React, { useState } from 'react';
import { TestFolder } from '../../types';
import { Folder, Layout, ChevronDown, ChevronRight, Plus } from 'lucide-react';
import { useConfig } from '../../ConfigContext';

interface FolderTreeProps {
    folders: TestFolder[];
    selectedFolderId: string;
    onSelectFolder: (id: string) => void;
    onAddFolder: (type: 'project' | 'module') => void;
}

const FolderItem: React.FC<{
    folder: TestFolder;
    selectedFolderId: string;
    onSelect: (id: string) => void;
    level: number;
    childrenFolders: TestFolder[];
    allFolders: TestFolder[];
}> = ({ folder, selectedFolderId, onSelect, level, childrenFolders, allFolders }) => {
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
                    onSelect={onSelect} 
                    level={level + 1} 
                    allFolders={allFolders}
                    childrenFolders={getChildFolders(child.id)}
                />
            ))}
        </div>
    );
};

export const FolderTree: React.FC<FolderTreeProps> = ({ folders, selectedFolderId, onSelectFolder, onAddFolder }) => {
    const { t } = useConfig();
    const rootFolders = folders.filter(f => f.parentId === 'root');

    return (
        <div className="w-64 min-w-[250px] border-r border-slate-200 flex flex-col bg-slate-50">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center">
                <h3 className="font-semibold text-slate-700 text-sm">{t('testCase.explorer')}</h3>
                <div className="flex space-x-1">
                    <button onClick={() => onAddFolder('project')} title={t('testCase.newFolder')} className="p-1 hover:bg-slate-200 rounded text-slate-500">
                        <Folder size={16} />
                    </button>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
                <div 
                    className={`flex items-center px-2 py-1.5 cursor-pointer hover:bg-slate-100 rounded-md mb-0.5 ${selectedFolderId === 'root' ? 'bg-blue-100 text-blue-700 font-medium' : 'text-slate-600'}`}
                    onClick={() => onSelectFolder('root')}
                >
                    <Layout size={14} className="mr-2" />
                    <span className="text-sm">{t('testCase.allProjects')}</span>
                </div>
                {rootFolders.map(f => (
                    <FolderItem 
                        key={f.id} 
                        folder={f} 
                        selectedFolderId={selectedFolderId} 
                        onSelect={onSelectFolder} 
                        allFolders={folders}
                        childrenFolders={folders.filter(child => child.parentId === f.id)}
                        level={0}
                    />
                ))}
            </div>
        </div>
    );
};
