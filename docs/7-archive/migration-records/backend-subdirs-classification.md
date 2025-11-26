# backend/子目录归类分析

**分析时间**: 2025-11-26
**目标目录**:
- `backend/nextest-platform/`
- `backend/NextTestPlatformUI/`

---

## 📊 目录内容统计

### backend/nextest-platform/

**总文件数**: 3个（全部为文档）

**文件列表**:
```
backend/nextest-platform/docs/
├── IMPLEMENTATION_TODO.md
├── BUG_FIX_REPORT_2025-11-23.md
└── KNOWN_ISSUES.md
```

**性质**: 项目管理文档（待办、bug修复报告、已知问题）

---

### backend/NextTestPlatformUI/

**总文件数**: 23个（15代码 + 8文档）

**目录结构**:
```
backend/NextTestPlatformUI/
├── components/
│   ├── SimpleListEditor.tsx                        # 简单列表编辑器
│   ├── SimpleListEditorDemo.tsx
│   ├── WorkflowEditor.tsx                          # 工作流编辑器
│   ├── WorkflowEditorDemo.tsx
│   ├── SIMPLE_LIST_EDITOR_QUICKSTART.md
│   ├── SIMPLE_LIST_EDITOR_README.md
│   ├── SIMPLE_LIST_EDITOR_VERIFICATION.md
│   └── testcase/
│       ├── AdvancedFilterPanel.tsx                  # 高级过滤面板
│       ├── StatMini.tsx                            # 统计小组件
│       ├── ValueScore.tsx                          # 价值评分组件
│       └── stepEditor/                             # Step编辑器组件集
│           ├── DataMappingPanel.tsx                 # 数据映射面板（核心）
│           ├── DataMappingPanelDemo.tsx
│           ├── UpstreamOutputTree.tsx              # 上游输出树
│           ├── CurrentInputsList.tsx               # 当前输入列表
│           ├── MappingLine.tsx                     # 映射连线
│           ├── TransformFunctionSelector.tsx       # 转换函数选择器
│           ├── index.ts
│           ├── README.md
│           ├── QUICK_START.md
│           ├── COMPONENT_STRUCTURE.md
│           ├── IMPLEMENTATION_SUMMARY.md
│           └── TASK_2.2_VERIFICATION.md
└── types/
    └── index.ts
```

**性质**:
- **实验性/验证性前端组件**
- 实施日期：2025-11-25（最近完成）
- 包含完整的组件实现 + 演示 + 文档
- 主要功能：数据映射可视化编辑器（DataMapper UI）

---

## 🤔 归类建议

### 方案A: 判断组件是否已集成到front/

**第一步**: 检查front/components/中是否已有这些组件的最新版本

#### 如果已集成到front/：

**backend/nextest-platform/docs/**:
```bash
# 归档到4-planning/backlog/
mv backend/nextest-platform/docs/IMPLEMENTATION_TODO.md docs/4-planning/backlog/backend-implementation-todos.md
mv backend/nextest-platform/docs/KNOWN_ISSUES.md docs/4-planning/backlog/backend-known-issues.md

# 归档到7-archive/2024-Q4/backend-reports/
mv backend/nextest-platform/docs/BUG_FIX_REPORT_2025-11-23.md docs/7-archive/2024-Q4/backend-reports/

# 删除空目录
rmdir backend/nextest-platform/docs backend/nextest-platform
```

**backend/NextTestPlatformUI/**:
```bash
# 归档实施报告和验证文档
mkdir -p docs/7-archive/2024-Q4/component-reports
mv backend/NextTestPlatformUI/components/testcase/stepEditor/IMPLEMENTATION_SUMMARY.md \
   backend/NextTestPlatformUI/components/testcase/stepEditor/TASK_2.2_VERIFICATION.md \
   backend/NextTestPlatformUI/components/SIMPLE_LIST_EDITOR_VERIFICATION.md \
   docs/7-archive/2024-Q4/component-reports/

# 删除整个目录（代码已集成到front/）
rm -rf backend/NextTestPlatformUI/
```

#### 如果未集成到front/（组件仍在实验阶段）：

**backend/nextest-platform/docs/** - 同上

**backend/NextTestPlatformUI/**:
```bash
# 方案1: 保留原位作为实验性代码
# （不做任何操作，保持backend/NextTestPlatformUI/）

# 方案2: 迁移到front/components/
# 将代码和文档一起迁移到front/对应位置
mv backend/NextTestPlatformUI/components/* front/components/
mv backend/NextTestPlatformUI/types/* front/types/（如果存在）
rmdir backend/NextTestPlatformUI/
```

---

## 🔍 需要确认的问题

### 1. 组件集成状态

**问题**: 这些组件是否已经集成到front/components/中？

**检查方法**:
```bash
# 检查front/中是否有相同组件
find front/components -name "DataMappingPanel.tsx" -o -name "SimpleListEditor.tsx"
```

**可能的情况**:
- ✅ 已集成且功能一致 → 删除backend/NextTestPlatformUI/
- ⚠️ 已集成但版本不同 → 对比代码，保留最新版本
- ❌ 未集成 → 决定是保留实验代码还是迁移到front/

### 2. 组件用途

**DataMappingPanel组件集** (stepEditor/):
- 用途：可视化工作流step间的数据映射
- 实施时间：2025-11-25
- 状态：看起来是已完成的功能组件，不是简单的原型

**SimpleListEditor**:
- 用途：简单列表编辑器
- 有完整的QUICKSTART和README

**WorkflowEditor**:
- 用途：工作流编辑器
- 可能与front/中的WorkflowBuilder重复

### 3. 建议的决策流程

```
1. 检查front/components/中是否有这些组件
   ↓
2a. 如果有 → 对比版本 → 删除backend/中的旧版本 → 归档文档
   ↓
2b. 如果没有 → 判断组件状态
      ↓
      - 生产ready → 迁移到front/components/
      - 实验阶段 → 保留在backend/NextTestPlatformUI/（标注为experimental）
```

---

## 📝 推荐方案

**推荐**: 执行方案A（判断集成状态后处理）

**理由**:
1. backend/NextTestPlatformUI/的组件看起来已经成熟（有完整文档和demo）
2. 这些组件应该在front/中使用，不应该留在backend/
3. 实施日期是2025-11-25，很可能已经集成到front/

**执行顺序**:
1. 先检查front/components/中的组件清单
2. 对比backend/NextTestPlatformUI/中的组件
3. 根据对比结果选择删除或迁移
4. 归档所有文档到docs/7-archive/2024-Q4/

---

**下一步**: 需要确认front/components/的组件清单

