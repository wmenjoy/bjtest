# 两栏布局改造计划 - Two-Column Layout Refactor Plan

## 🎯 目标

将三栏布局改为两栏布局：
- **左栏**: Explorer (目录树 + 案例，案例作为"文件"显示)
- **右栏**: 案例详情/编辑器

## 📋 并发任务拆分

### 第一批 - 3个并发任务

#### Task 3.1: 增强FolderTree显示案例
**文件**: `NextTestPlatformUI/components/testcase/FolderTree.tsx`
**修改**:
1. 添加`cases`和`selectedCaseId`到props
2. 在每个文件夹下方渲染该文件夹的案例列表
3. 案例显示为"文件"样式（无folder图标，使用文档图标）
4. 支持选中案例（高亮显示）
5. 支持右键菜单（编辑、删除）

**Props接口**:
```typescript
interface FolderTreeProps {
  folders: TestFolder[];
  cases: TestCase[];  // 新增
  selectedFolderId: string;
  selectedCaseId?: string | null;  // 新增
  onSelectFolder: (id: string) => void;
  onSelectCase: (testCase: TestCase) => void;  // 新增
  onEditCase: (testCase: TestCase) => void;  // 新增
  onAddFolder: (type: 'service' | 'module') => void;
  statistics: TestStatistics | null;
  statsLoading: boolean;
}
```

#### Task 3.2: 修改TestCaseManager布局
**文件**: `NextTestPlatformUI/components/TestCaseManager.tsx`
**修改**:
1. 移除CaseList组件的引入和渲染（第179-186行）
2. 更新布局为两栏:
```tsx
<div className="flex h-[calc(100vh-140px)] bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
  {/* 左栏: 增强的FolderTree */}
  <FolderTree
    folders={folders}
    cases={cases}  // 新增
    selectedFolderId={selectedFolderId}
    selectedCaseId={selectedCase?.id || null}  // 新增
    onSelectFolder={setSelectedFolderId}
    onSelectCase={setSelectedCase}  // 新增
    onEditCase={(c) => { setSelectedCase(c); setIsEditing(true); }}  // 新增
    onAddFolder={handleAddFolder}
    statistics={statistics}
    statsLoading={statsLoading}
  />

  {/* 右栏: 案例详情（占据剩余空间） */}
  <div className="flex-1 flex flex-col">
    <CaseDetail
      testCase={selectedCase}
      onEdit={() => setIsEditing(true)}
      onRun={() => setIsRunning(true)}
      onDelete={handleDeleteCase}
    />
  </div>

  {/* 编辑器（右侧滑入，不遮挡左栏） */}
  {isEditing && selectedCase && (
    <div className="absolute right-0 top-0 bottom-0 w-[70%] bg-white shadow-2xl z-30 animate-slide-in-right">
      <TestCaseEditor
        initialCase={selectedCase}
        availableScripts={scripts}
        availableWorkflows={workflows}
        onSave={handleSaveCase}
        onCancel={() => setIsEditing(false)}
      />
    </div>
  )}

  {/* 其他模态框保持不变 */}
</div>
```

#### Task 3.3: 优化TestCaseEditor为侧边栏样式
**文件**: `NextTestPlatformUI/components/testcase/TestCaseEditor.tsx`
**修改**:
1. 修改第106行的className:
```tsx
className="flex flex-col bg-white h-full overflow-hidden"
```
2. 添加关闭按钮在Header右侧
3. 优化为右侧滑入效果

---

## 🎨 视觉效果

### 左栏 (Explorer) - 350px固定宽度
```
┌─ Explorer ──────────────────┐
│ 📁 API Tests                │
│   └─ 📄 test-hooks-demo     │  ← 案例显示为"文件"
│   └─ 📄 test-api-health     │
│ 📁 Integration Tests        │
│   └─ 📄 test-workflow-1     │
│ 📁 Manual Test              │
├─────────────────────────────┤
│ TESTCASE.QUICKFILTERS       │
│ 📋 All Tests 19             │
│ 👤 My Tests 0               │
└─────────────────────────────┘
```

### 右栏 (详情区) - flex-1
```
┌─ Lifecycle Hooks Demo Test ─────────┐
│ [Edit] [Run] [Delete]                │
│                                      │
│ 案例详情内容...                       │
│                                      │
└──────────────────────────────────────┘
```

### 编辑器 (右侧滑入) - 70%宽度
```
┌─────────────┬──────────────────────────┐
│ Explorer    │ [x] Editing Test Case    │
│ (仍然可见)   │                          │
│             │ 编辑器内容...             │
│             │                          │
└─────────────┴──────────────────────────┘
```

---

## 🔧 技术细节

### 1. FolderTree案例渲染逻辑
```tsx
// 在每个文件夹节点下
{expanded && (
  <div>
    {/* 子文件夹 */}
    {childFolders.map(child => renderFolder(child, depth + 1))}

    {/* 该文件夹的案例 - 新增 */}
    {folderCases.map(testCase => (
      <div
        key={testCase.id}
        className={`flex items-center px-3 py-2 cursor-pointer ${
          selectedCaseId === testCase.id ? 'bg-blue-50 text-blue-700' : 'hover:bg-slate-50'
        }`}
        style={{ paddingLeft: `${(depth + 1) * 24 + 12}px` }}
        onClick={() => onSelectCase(testCase)}
        onContextMenu={(e) => showContextMenu(e, testCase)}
      >
        <FileText size={16} className="mr-2 text-slate-400" />
        <span className="text-sm truncate flex-1">{testCase.title || 'Untitled'}</span>
        <span className="text-xs text-slate-400">{testCase.steps.length} steps</span>
      </div>
    ))}
  </div>
)}
```

### 2. 编辑器滑入动画
```css
@keyframes slide-in-right {
  from {
    transform: translateX(100%);
  }
  to {
    transform: translateX(0);
  }
}

.animate-slide-in-right {
  animation: slide-in-right 0.3s ease-out;
}
```

---

## ✅ 验证清单

### 功能验证
- [ ] 点击文件夹展开/折叠
- [ ] 文件夹下显示案例列表
- [ ] 点击案例选中并显示详情
- [ ] 双击案例打开编辑器
- [ ] 编辑器从右侧滑入
- [ ] 编辑器打开时左侧Explorer仍可见
- [ ] 关闭编辑器后返回详情视图

### 视觉验证
- [ ] 案例显示为"文件"样式（文档图标）
- [ ] 选中案例高亮显示
- [ ] 缩进层级清晰
- [ ] 编辑器不遮挡左侧
- [ ] 动画流畅

---

## 🚀 执行顺序

1. **Task 3.1 + 3.3 并发** (可同时修改)
2. **Task 3.2** (依赖3.1完成后的props定义)

**预计总时间**: 15-20分钟
