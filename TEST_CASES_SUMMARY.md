# 统一 Workflow 架构 - 测试案例摘要

> **创建时间**: 2025-11-25
> **目的**: 使用当前前端后端系统测试新实现的统一 Workflow 架构
> **状态**: 就绪，可执行测试

---

## 📦 已创建的测试文件

### 1. 后端 API 测试
**文件**: `nextest-platform/examples/test-new-architecture.json`

**包含**:
- 1 个测试分组: `group-backend-api`
- 3 个测试案例:
  - `test-backend-health`: 健康检查
  - `test-backend-groups-api`: 测试分组 CRUD
  - `test-backend-testcases-api`: 测试案例生命周期

**验证功能**:
- ✅ 后端 API 端点正常工作
- ✅ 统一 WorkflowStep 数据模型
- ✅ 变量引用 `{{variable}}`
- ✅ Assertions 断言

---

### 2. 综合工作流演示
**文件**: `nextest-platform/examples/demo-comprehensive-workflow.json`

**包含**:
- 1 个测试分组: `group-demo-workflow`
- 1 个工作流: `workflow-comprehensive-demo` (8个步骤)
- 1 个测试案例: `test-demo-comprehensive-workflow`

**演示功能**:
- ✅ **Action Template 模式**: Step 1 使用 `action-http-get`
- ✅ **DataMapper 映射**: Step 2, 4 使用 DataMapper 提取和转换数据
- ✅ **并行执行**: Step 3A 和 3B 并行运行
- ✅ **Merge 节点**: Step 4 合并并行结果
- ✅ **条件分支**: Step 5 根据 `totalTests` 条件执行不同分支
- ✅ **循环**: Step 6 遍历分组（最多3次）
- ✅ **错误重试**: Step 7 支持重试3次
- ✅ **清理步骤**: Step 8 cleanup（onError: continue）

---

### 3. 前端功能测试
**文件**: `nextest-platform/examples/test-frontend-features.json`

**包含**:
- 4 个测试分组:
  - `group-frontend-ui`: 前端 UI 测试根分组
  - `group-simple-mode`: Simple Mode 测试
  - `group-advanced-mode`: Advanced Mode 测试
  - `group-data-mapper`: DataMapper 测试
- 4 个工作流:
  - `workflow-simple-linear`: 简单线性工作流（4步）
  - `workflow-complex-dag`: 复杂 DAG 工作流（7步，带位置坐标）
  - `workflow-datamapper-demo`: DataMapper 演示（4步，5个映射）
  - `workflow-template-vs-inline`: 双模式对比（3步）
- 4 个测试案例

**演示功能**:
- ✅ **Simple Mode 编辑器**: 线性工作流，拖拽排序
- ✅ **Advanced DAG 编辑器**: 复杂 DAG，自动布局
- ✅ **DataMapper 拖拽**: 5种转换函数（uppercase, lowercase, trim, parseInt, parseFloat）
- ✅ **双模式切换**: Template vs Inline 对比

---

## 🎯 测试覆盖矩阵

| 功能模块 | 测试文件 | 测试案例 | 状态 |
|---------|---------|---------|------|
| **Phase 1: 数据模型统一** | | | |
| - WorkflowStep 类型 | test-new-architecture.json | 所有案例 | ✅ |
| - 向后兼容 TestStep | test-new-architecture.json | 所有案例 | ✅ |
| - 变量解析 {{var}} | test-new-architecture.json | test-backend-testcases-api | ✅ |
| - Action Template 模式 | demo-comprehensive-workflow.json | Step 1 | ✅ |
| - Inline Config 模式 | demo-comprehensive-workflow.json | Step 3A, 3B | ✅ |
| **Phase 2: 数据流可视化** | | | |
| - DataMapper 基础 | demo-comprehensive-workflow.json | Step 2, 4, 6 | ✅ |
| - JSONPath 提取 | test-frontend-features.json | workflow-datamapper-demo | ✅ |
| - 转换函数: uppercase | test-frontend-features.json | dm-2, dm-4 | ✅ |
| - 转换函数: trim | test-frontend-features.json | dm-3 | ✅ |
| - 转换函数: parseInt | test-frontend-features.json | dm-5 | ✅ |
| - 优先级 (DataMapper > Inputs) | test-frontend-features.json | step-target-with-datamapper | ✅ |
| **Phase 3: 双模式编辑器** | | | |
| - Simple Mode 编辑器 | test-frontend-features.json | test-simple-mode-editor | ✅ |
| - Advanced DAG 编辑器 | test-frontend-features.json | test-advanced-dag-editor | ✅ |
| - 模式切换逻辑 | test-frontend-features.json | workflow-complex-dag | ✅ |
| - Dagre 自动布局 | test-frontend-features.json | workflow-complex-dag | ✅ |
| - DataMapper 拖拽 | test-frontend-features.json | test-datamapper-features | ✅ |
| - Template vs Inline 切换 | test-frontend-features.json | test-mode-switching | ✅ |
| **控制流** | | | |
| - 并行执行 (dependsOn) | demo-comprehensive-workflow.json | Step 3A, 3B | ✅ |
| - Merge 节点 | demo-comprehensive-workflow.json | Step 4 | ✅ |
| - 条件分支 | demo-comprehensive-workflow.json | Step 5 | ✅ |
| - 循环 (forEach) | demo-comprehensive-workflow.json | Step 6 | ✅ |
| **错误处理** | | | |
| - onError: abort | demo-comprehensive-workflow.json | Step 1 | ✅ |
| - onError: retry | demo-comprehensive-workflow.json | Step 7 | ✅ |
| - onError: continue | demo-comprehensive-workflow.json | Step 8 | ✅ |
| **断言** | | | |
| - equals | test-new-architecture.json | 所有案例 | ✅ |

---

## 🚀 快速执行指南

### 步骤 1: 启动服务

```bash
# 终端 1: 启动后端
cd nextest-platform
make run

# 终端 2: 启动前端
cd NextTestPlatformUI
npm run dev
```

---

### 步骤 2: 导入测试数据

**选项 A: 使用导入脚本（推荐）**
```bash
cd nextest-platform
./import-test-cases.sh
```

**选项 B: 手动导入**
```bash
cd nextest-platform/examples

# 导入后端 API 测试
curl -X POST http://localhost:8090/api/v2/import \
  -H "Content-Type: application/json" \
  -d @test-new-architecture.json

# 导入综合演示
curl -X POST http://localhost:8090/api/v2/import \
  -H "Content-Type: application/json" \
  -d @demo-comprehensive-workflow.json

# 导入前端功能测试
curl -X POST http://localhost:8090/api/v2/import \
  -H "Content-Type: application/json" \
  -d @test-frontend-features.json
```

---

### 步骤 3: 执行测试

#### 3.1 通过前端界面

1. 访问 http://localhost:5173
2. 进入 **Test Case Manager**
3. 选择测试分组：
   - Backend API Tests
   - Workflow Architecture Demo
   - Frontend UI Tests
4. 点击测试案例执行
5. 查看执行结果

---

#### 3.2 通过 API

**执行单个测试**:
```bash
# Health Check
curl -X POST http://localhost:8090/api/v2/tests/test-backend-health/execute

# Groups API
curl -X POST http://localhost:8090/api/v2/tests/test-backend-groups-api/execute

# Comprehensive Workflow
curl -X POST http://localhost:8090/api/v2/tests/test-demo-comprehensive-workflow/execute
```

**执行整个分组**:
```bash
# 执行所有后端 API 测试
curl -X POST http://localhost:8090/api/v2/groups/group-backend-api/execute

# 执行所有前端 UI 测试
curl -X POST http://localhost:8090/api/v2/groups/group-frontend-ui/execute
```

---

## 📊 测试场景详解

### 场景 1: 后端 API 基础测试

**目的**: 验证后端服务基本功能

**测试流程**:
1. 健康检查 → 验证服务运行
2. 创建分组 → 查询分组 → 删除分组
3. 创建测试 → 查询测试 → 执行测试 → 删除测试

**预期结果**:
- 所有 API 返回正确的 HTTP 状态码
- CRUD 操作正常工作
- 测试执行成功

---

### 场景 2: 综合工作流演示

**目的**: 验证所有新功能集成

**工作流步骤**:
```
Step 1 (Health Check - Template Mode)
  ↓
Step 2 (Get Groups - DataMapper)
  ↓
Step 3A (Get Tests) ←→ Step 3B (Get Workflows)  [并行]
  ↓                      ↓
  └──────→ Step 4 (Merge + DataMapper) ←──────┘
            ↓
         Step 5 (Conditional Branch)
            ├─ Has Tests → Process Tests
            └─ No Tests  → Warning
            ↓
         Step 6 (Loop forEach)
            ↓
         Step 7 (Create Group - Retry)
            ↓
         Step 8 (Cleanup - Continue)
```

**预期结果**:
- Action Template 正确加载和执行
- DataMapper 正确提取和转换数据
- 并行步骤同时执行
- 条件分支根据数据选择路径
- 循环最多迭代 3 次
- 错误重试机制工作
- 清理步骤总是执行

---

### 场景 3: 前端编辑器测试

#### 3.1 Simple Mode
**测试**: `test-simple-mode-editor`

**操作**:
1. 打开测试案例编辑器
2. 验证 4 个步骤线性排列
3. 拖拽 Step 3 到 Step 2 之前
4. 添加新步骤
5. 展开 Step 3 的 DataMapping
6. 验证三栏布局

**预期**:
- 拖拽排序流畅
- CRUD 操作正常
- DataMapping 面板正常显示

---

#### 3.2 Advanced DAG Mode
**测试**: `test-advanced-dag-editor`

**操作**:
1. 打开测试案例编辑器
2. 系统检测复杂度并提示切换
3. 切换到 Advanced Mode
4. 验证 DAG 图渲染
5. 拖拽节点
6. 切换垂直/水平布局
7. 点击节点查看 Inspector

**预期**:
- 复杂度检测准确
- DAG 自动布局清晰
- 所有交互功能正常

---

#### 3.3 DataMapper 拖拽
**测试**: `test-datamapper-features`

**操作**:
1. 打开 Step 2 的 DataMapping
2. 查看 5 个预置映射
3. 从左栏拖拽字段到右栏
4. 点击转换函数徽章
5. 选择不同的转换函数
6. 删除映射

**预期**:
- 拖拽创建映射流畅
- 转换函数选择器正常
- 映射关系实时更新

---

#### 3.4 模式切换
**测试**: `test-mode-switching`

**操作**:
1. 打开 Step 1 (Template Mode)
2. 验证模式指示器
3. 验证 Template 配置区
4. 打开 Step 2 (Inline Mode)
5. 验证模式指示器
6. 验证 Inline 配置区
7. 将 Step 2 切换到 Template Mode
8. 将 Step 1 切换到 Inline Mode
9. 撤销所有更改

**预期**:
- 模式指示器清晰可见
- Template 配置完整显示
- Inline 配置完整显示
- 模式切换流畅
- 数据不丢失

---

## 🐛 已知问题和限制

### 限制 1: Action Template 依赖
某些测试案例需要预先导入 Action Templates:
- `action-http-get`
- `action-http-post`

**解决**: 确保数据库包含系统级 Action Templates

---

### 限制 2: 前端 API 调用
前端测试需要后端 API 返回正确的数据结构

**解决**: 确保后端版本为 v2.0+

---

### 限制 3: 循环迭代限制
循环最多迭代次数设置为 3（防止无限循环）

**解决**: 这是设计限制，可在工作流定义中调整 `maxIterations`

---

## 📝 测试检查清单

### 功能测试
- [ ] 后端健康检查通过
- [ ] 测试分组 CRUD 正常
- [ ] 测试案例 CRUD 正常
- [ ] 工作流创建和执行正常
- [ ] Action Template 模式正常工作
- [ ] Inline 配置模式正常工作
- [ ] DataMapper 数据提取正确
- [ ] 转换函数执行正确
- [ ] 并行执行正常
- [ ] 条件分支正确
- [ ] 循环正常工作
- [ ] 错误重试机制工作
- [ ] Simple Mode 编辑器正常
- [ ] Advanced DAG 编辑器正常
- [ ] 模式切换流畅

### 性能测试
- [ ] 工作流执行时间 < 10秒
- [ ] DAG 渲染流畅（无卡顿）
- [ ] 拖拽响应及时
- [ ] 大型工作流（10+步骤）正常工作

### UI/UX 测试
- [ ] 模式指示器清晰可见
- [ ] 配置区布局合理
- [ ] 拖拽反馈明显
- [ ] 错误提示友好
- [ ] 空状态显示友好

---

## 🎓 学习资源

### 文档
- **实施计划**: `COMPLETE_IMPLEMENTATION_PLAN.md`
- **实施进度**: `IMPLEMENTATION_PROGRESS.md`
- **Phase 2 报告**: `PHASE_2_COMPLETION_REPORT.md`
- **Phase 3 报告**: `PHASE_3_COMPLETION_REPORT.md`
- **最终报告**: `FINAL_IMPLEMENTATION_REPORT.md`
- **测试指南**: `TESTING_GUIDE.md`

### 组件文档
- **DataMapper**: `NextTestPlatformUI/components/testcase/stepEditor/README.md`
- **DAG Editor**: `NextTestPlatformUI/components/README_DAG_EDITOR.md`

### API 文档
- **后端 API**: `nextest-platform/docs/API_DOCUMENTATION.md`

---

## 💡 提示和技巧

### 技巧 1: 查看执行日志
工作流执行时，查看后端日志了解详细执行过程:
```bash
# 后端日志包含
[INFO] Executing Step: step-1-health-check
[INFO] Resolving DataMapper: mapper-1
[INFO] Source: step-1-health-check, Path: body.status, Transform: uppercase
[INFO] Result: HEALTHY
```

---

### 技巧 2: 调试 DataMapper
如果 DataMapper 不工作：
1. 检查源步骤是否已执行
2. 检查 JSONPath 是否正确
3. 检查转换函数名称是否正确
4. 查看后端日志中的 DataMapper 解析过程

---

### 技巧 3: DAG 布局优化
如果 DAG 图布局混乱：
1. 尝试切换垂直/水平布局
2. 检查 `dependsOn` 关系是否正确
3. 手动设置节点 `position` 坐标

---

### 技巧 4: 模式切换
Template ↔ Inline 切换时：
1. 切换前保存当前配置
2. 切换后检查数据是否保留
3. 如有丢失，使用撤销功能

---

## 📞 反馈和支持

**问题反馈**: 请在测试过程中记录所有问题

**测试报告**: 填写 `TESTING_GUIDE.md` 中的测试报告模板

**成功标准**: 所有测试案例通过，无严重 Bug

---

**祝测试顺利！** 🎉
