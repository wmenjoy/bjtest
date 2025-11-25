
import React, { useState, useMemo, useEffect } from 'react';
import { TestCase, Priority, Status, TestRun, TestFolder, Script, Workflow, Environment } from '../types';
import { TestRunner } from './TestRunner';
import { generateTestCase } from '../services/geminiService';
import { TestCaseEditor } from './testcase/TestCaseEditor';
import { FolderTree } from './testcase/FolderTree';
import { CaseDetail } from './testcase/CaseDetail';
import { AIGeneratorModal } from './testcase/AIGeneratorModal';
import { Toast } from './ui/LoadingState';
import { QuickFilter } from './testcase/QuickFilter';
import { testCaseStatsApi, TestStatistics } from '../services/api/testCaseStatsApi';

interface TestCaseManagerProps {
  cases: TestCase[];
  folders: TestFolder[];
  runs: TestRun[];
  scripts?: Script[];
  workflows?: Workflow[];
  activeEnvironment?: Environment;
  projectId: string;
  onAddCase: (c: TestCase) => void;
  onUpdateCase: (c: TestCase) => void;
  onDeleteCase?: (caseId: string) => void;
  onAddFolder: (f: TestFolder) => void;
  onRunComplete: (run: TestRun) => void;
}

export const TestCaseManager: React.FC<TestCaseManagerProps> = ({ cases, folders, runs, scripts = [], workflows = [], activeEnvironment, projectId, onAddCase, onUpdateCase, onDeleteCase, onAddFolder, onRunComplete }) => {
  const [selectedFolderId, setSelectedFolderId] = useState<string>('root');
  const [selectedCase, setSelectedCase] = useState<TestCase | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [statistics, setStatistics] = useState<TestStatistics | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  const filteredCases = useMemo(() => {
     return cases.filter(c => c.folderId === selectedFolderId);
  }, [cases, selectedFolderId]);

  // Load statistics on component mount
  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    try {
      setStatsLoading(true);
      const stats = await testCaseStatsApi.getStatistics();
      setStatistics(stats);
    } catch (err) {
      console.error('Failed to load statistics:', err);
      // Use default values if API fails
      setStatistics({
        totalTests: cases.length,
        myTests: 0,
        p0Tests: 0,
        flakyTests: 0,
        longRunningTests: 0,
        notRunRecently: 0,
        tagCloud: {}
      });
    } finally {
      setStatsLoading(false);
    }
  };

  const handleDeleteCase = async (caseId: string) => {
    if (onDeleteCase) {
      try {
        await onDeleteCase(caseId);
        setSelectedCase(null); // Clear selection after delete
        setToast({ message: 'Test case deleted successfully!', type: 'success' });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to delete test case';
        setToast({ message, type: 'error' });
      }
    }
  };

  const handleAddFolder = async (type: 'service' | 'module') => {
      const name = prompt(`Enter ${type} name:`);
      if(name) {
          try {
            await onAddFolder({
                id: `f-${Date.now()}`,
                name,
                parentId: selectedFolderId === 'root' && type === 'service' ? 'root' : selectedFolderId,
                type: 'folder',
                projectId,
                folderType: type  // Add folder type metadata
            });
            setToast({ message: `${type.charAt(0).toUpperCase() + type.slice(1)} created successfully!`, type: 'success' });
          } catch (err) {
            const message = err instanceof Error ? err.message : `Failed to create ${type}`;
            setToast({ message, type: 'error' });
          }
      }
  };

  const handleGenerate = async (prompt: string) => {
    setIsGenerating(true);
    const generated = await generateTestCase(prompt);
    if (generated) {
        const newCase: TestCase = {
            id: `TC-${Date.now()}`,
            title: generated.title || 'Untitled Case',
            description: generated.description || '',
            priority: generated.priority || Priority.MEDIUM,
            status: generated.status || Status.DRAFT,
            steps: generated.steps || [],
            tags: generated.tags || [],
            folderId: selectedFolderId,
            lastUpdated: new Date().toISOString(),
            variables: {},
            preconditions: [],
            projectId
        };
        onAddCase(newCase);
        setSelectedCase(newCase);
        setShowAiModal(false);
    }
    setIsGenerating(false);
  };

  const openNewCaseModal = () => {
      setSelectedCase({
          id: `TC-${Date.now()}`,
          title: '',
          description: '',
          priority: Priority.MEDIUM,
          status: Status.DRAFT,
          steps: [],
          tags: [],
          folderId: selectedFolderId,
          lastUpdated: new Date().toISOString(),
          automationType: 'MANUAL',
          variables: {},
          preconditions: [],
          projectId
      });
      setIsEditing(true);
  };

  const handleSaveCase = async (updatedCase: TestCase) => {
      const exists = cases.find(c => c.id === updatedCase.id);
      try {
        if (exists) {
            await onUpdateCase(updatedCase);
            setToast({ message: 'Test case updated successfully!', type: 'success' });
        } else {
            await onAddCase(updatedCase);
            setToast({ message: 'Test case created successfully!', type: 'success' });
        }
        setIsEditing(false);
        setSelectedCase(updatedCase);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to save test case';
        setToast({ message, type: 'error' });
      }
  };

  return (
    <div className="flex h-[calc(100vh-140px)] bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden relative">

      {/* 左栏: 增强的FolderTree (固定350px宽度) */}
      <div className="w-[350px] border-r border-slate-200 flex-shrink-0">
        <FolderTree
          folders={folders}
          cases={cases}
          selectedFolderId={selectedFolderId}
          selectedCaseId={selectedCase?.id || null}
          onSelectFolder={setSelectedFolderId}
          onSelectCase={setSelectedCase}
          onEditCase={(c) => { setSelectedCase(c); setIsEditing(true); }}
          onAddFolder={handleAddFolder}
          statistics={statistics}
          statsLoading={statsLoading}
        />
      </div>

      {/* 右栏: 案例详情 (占据剩余空间) */}
      <div className="flex-1 overflow-hidden">
        <CaseDetail
          testCase={selectedCase}
          onEdit={() => setIsEditing(true)}
          onRun={() => setIsRunning(true)}
          onDelete={handleDeleteCase}
        />
      </div>

      {/* 编辑器 (右侧滑入，70%宽度，不遮挡左栏) */}
      {isEditing && selectedCase && (
        <div className="absolute right-0 top-0 bottom-0 w-[70%] bg-white shadow-2xl z-30 border-l border-slate-300 animate-slide-in-right">
          <TestCaseEditor
            initialCase={selectedCase}
            availableScripts={scripts}
            availableWorkflows={workflows}
            onSave={handleSaveCase}
            onCancel={() => setIsEditing(false)}
          />
        </div>
      )}

      {/* TestRunner模态框 (保持不变) */}
      {isRunning && selectedCase && (
        <TestRunner
          testCase={selectedCase}
          scripts={scripts}
          workflows={workflows}
          activeEnvironment={activeEnvironment}
          onComplete={(run) => {
            onRunComplete(run);
            setIsRunning(false);
          }}
          onCancel={() => setIsRunning(false)}
        />
      )}

      {/* AI生成器模态框 (保持不变) */}
      <AIGeneratorModal
        isOpen={showAiModal}
        onClose={() => setShowAiModal(false)}
        onGenerate={handleGenerate}
        isGenerating={isGenerating}
      />

      {/* Toast通知 (保持不变) */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};