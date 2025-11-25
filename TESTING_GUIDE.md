# 统一 Workflow 架构 - 测试执行指南

> **测试目标**: 验证新实现的统一 Workflow 架构的所有功能
> **测试范围**: 后端 API + 前端编辑器 + DataMapper + 双模式编辑器
> **预计时间**: 30-60 分钟

---

## 📋 测试清单

### 测试准备

- [ ] 后端服务已启动 (http://localhost:8090)
- [ ] 前端服务已启动 (http://localhost:5173)
- [ ] 数据库已初始化
- [ ] Action Templates 已导入（系统级）

### Phase 1: 后端 API 测试

**测试文件**: `examples/test-new-architecture.json`

#### 测试案例 1: Health Check
- [ ] 执行 `test-backend-health`
- [ ] 验证健康检查返回 200
- [ ] 验证服务状态为 "healthy"

#### 测试案例 2: Test Groups API
- [ ] 执行 `test-backend-groups-api`
- [ ] 验证创建分组成功（201）
- [ ] 验证查询分组树成功（200）
- [ ] 验证删除分组成功（200）

#### 测试案例 3: Test Cases API
- [ ] 执行 `test-backend-testcases-api`
- [ ] 验证创建测试案例成功
- [ ] 验证查询测试案例详情成功
- [ ] 验证执行测试案例成功
- [ ] 验证删除测试案例成功

---

### Phase 2: 综合工作流测试

**测试文件**: `examples/demo-comprehensive-workflow.json`

#### 测试案例: Comprehensive Workflow
- [ ] 执行 `test-demo-comprehensive-workflow`
- [ ] **验证 Action Template 模式**: Step 1 使用 `action-http-get`
- [ ] **验证 DataMapper**: Step 2 从 Step 1 提取数据并转换
- [ ] **验证并行执行**: Step 3A 和 3B 并行运行
- [ ] **验证 Merge 节点**: Step 4 合并并行结果
- [ ] **验证条件分支**: Step 5 根据条件执行不同分支
- [ ] **验证循环**: Step 6 循环处理分组
- [ ] **验证错误重试**: Step 7 失败时重试 3 次
- [ ] **验证清理步骤**: Step 8 cleanup 执行

**期望结果**:
- 所有步骤成功执行
- DataMapper 正确提取和转换数据
- 并行步骤同时执行
- 分支逻辑正确
- 循环最多执行 3 次迭代

---

### Phase 3: 前端编辑器测试

**测试文件**: `examples/test-frontend-features.json`

#### 3.1 Simple Mode 编辑器

**工作流**: `workflow-simple-linear`

**测试步骤**:
1. [ ] 在前端打开 Test Case Manager
2. [ ] 找到 `test-simple-mode-editor`
3. [ ] 点击编辑，进入 WorkflowEditor
4. [ ] **验证默认为 Simple Mode**
5. [ ] **验证步骤卡片**:
   - [ ] Step 1: 显示 Command 类型徽章
   - [ ] Step 2: 显示 HTTP 类型徽章
   - [ ] Step 3: 显示 DataMapper 映射计数
   - [ ] Step 4: 显示 Command 类型徽章
6. [ ] **验证拖拽排序**:
   - [ ] 拖拽 Step 3 到 Step 2 之前
   - [ ] 验证顺序已更改
   - [ ] 撤销更改
7. [ ] **验证 CRUD 操作**:
   - [ ] 点击 "+ Add Step"
   - [ ] 选择 HTTP 类型
   - [ ] 输入名称 "New Step"
   - [ ] 保存步骤
   - [ ] 删除新创建的步骤
8. [ ] **验证 DataMapping 集成**:
   - [ ] 展开 Step 3 的 "Data Flow Mapping"
   - [ ] 验证三栏布局显示
   - [ ] 验证左栏显示 Step 2 的输出
   - [ ] 验证中栏显示映射关系
   - [ ] 验证右栏显示 Step 3 的输入

---

#### 3.2 Advanced DAG 编辑器

**工作流**: `workflow-complex-dag`

**测试步骤**:
1. [ ] 在前端打开 `test-advanced-dag-editor`
2. [ ] **验证复杂度检测**:
   - [ ] 系统显示黄色警告："This workflow contains complex control flow"
   - [ ] 显示建议："Consider switching to Advanced Mode"
3. [ ] **切换到 Advanced Mode**:
   - [ ] 点击 "Switch to Advanced" 按钮
   - [ ] 或点击顶部 "🌐 Advanced Mode (DAG)"
4. [ ] **验证 DAG 渲染**:
   - [ ] 验证所有节点正常显示
   - [ ] 验证节点位置使用 Dagre 自动布局
   - [ ] 验证依赖连线正确绘制
5. [ ] **验证节点类型**:
   - [ ] step-start: Action 节点（蓝色边框）
   - [ ] step-parallel-a/b: Action 节点（并行）
   - [ ] step-branch: Branch 节点（紫色）
   - [ ] step-loop: Loop 节点（蓝色循环图标）
   - [ ] step-merge: Merge 节点（橙色）
6. [ ] **验证交互功能**:
   - [ ] 拖拽节点改变位置
   - [ ] 缩放画布（滚轮）
   - [ ] 平移画布（拖拽空白区域）
   - [ ] MiniMap 导航正常
7. [ ] **验证布局切换**:
   - [ ] 点击 "↓" 切换到垂直布局
   - [ ] 点击 "→" 切换到水平布局
   - [ ] 验证节点重新排列
8. [ ] **验证 Inspector 面板**:
   - [ ] 点击任意节点
   - [ ] 右侧显示 Inspector 面板
   - [ ] 验证步骤详情显示
   - [ ] 关闭 Inspector

---

#### 3.3 DataMapper 拖拽测试

**工作流**: `workflow-datamapper-demo`

**测试步骤**:
1. [ ] 在前端打开 `test-datamapper-features`
2. [ ] 编辑工作流
3. [ ] **测试 Step 2 的 DataMapper**:
   - [ ] 展开 Step 2
   - [ ] 点击 "Data Flow Mapping"
4. [ ] **验证三栏布局**:
   - [ ] **左栏 - Upstream Outputs**:
     - [ ] 显示 "step-source"
     - [ ] 可展开查看输出字段: testId, testName, priority, createStatus
   - [ ] **中栏 - Mapping Relations**:
     - [ ] 显示 5 个映射关系
     - [ ] dm-1: testId → testIdProcessed (无转换)
     - [ ] dm-2: testName → nameUppercase (🔧uppercase)
     - [ ] dm-3: testName → nameTrimmed (🔧trim)
     - [ ] dm-4: priority → priorityUpper (🔧uppercase)
     - [ ] dm-5: createStatus → statusCode (🔧parseInt)
   - [ ] **右栏 - Current Inputs**:
     - [ ] 显示 Step 2 的输入参数
     - [ ] 标记必填/可选
5. [ ] **测试拖拽创建映射**:
   - [ ] 从左栏拖拽 "testId"
   - [ ] 放置到右栏的某个输入参数
   - [ ] 验证中栏新增映射关系
   - [ ] 删除刚创建的映射
6. [ ] **测试转换函数选择**:
   - [ ] 点击某个映射的转换函数徽章
   - [ ] 验证弹出 TransformFunctionSelector
   - [ ] 验证分类显示: Control, Text, Number
   - [ ] 验证每个函数有示例
   - [ ] 选择不同的转换函数
   - [ ] 验证映射更新
7. [ ] **测试删除映射**:
   - [ ] 悬停在映射关系上
   - [ ] 点击 🗑️ 删除按钮
   - [ ] 验证映射已删除

---

#### 3.4 双模式切换测试

**工作流**: `workflow-template-vs-inline`

**测试步骤**:
1. [ ] 在前端打开 `test-mode-switching`
2. [ ] 编辑工作流
3. [ ] **验证 Step 1 - Template Mode**:
   - [ ] 展开 Step 1
   - [ ] **验证模式指示器**:
     - [ ] 收起状态显示 "📦 Template" 徽章
     - [ ] 展开状态顶部显示蓝色 "📦 Use Action Template" 按钮（激活状态）
   - [ ] **验证 Template 配置区**:
     - [ ] 显示 Action Template 信息卡片
     - [ ] 显示模板名称: "HTTP GET Request"
     - [ ] 显示 Scope: System
     - [ ] 显示 Category: Network
   - [ ] **验证输入参数表单**:
     - [ ] url 参数输入框
     - [ ] headers 参数输入框
     - [ ] 支持 {{variable}} 语法
   - [ ] **验证输出映射**:
     - [ ] statusCode → templateStatus
     - [ ] body → templateData
4. [ ] **验证 Step 2 - Inline Mode**:
   - [ ] 展开 Step 2
   - [ ] **验证模式指示器**:
     - [ ] 收起状态显示 "⚙️ Inline" 徽章
     - [ ] 展开状态顶部显示灰色 "⚙️ Custom Configuration" 按钮（激活状态）
   - [ ] **验证 Inline 配置区**:
     - [ ] 步骤类型选择器: HTTP
     - [ ] Method 选择器: GET
     - [ ] URL 输入框
     - [ ] Headers 输入区
     - [ ] Body 输入区
   - [ ] **验证手动输出映射**:
     - [ ] response.status → inlineStatus
     - [ ] response.body → inlineData
5. [ ] **测试模式切换**:
   - [ ] **Inline → Template**:
     - [ ] 在 Step 2 点击 "📦 Use Action Template"
     - [ ] 验证弹出 ActionTemplateSelector
     - [ ] 选择 "HTTP GET Request"
     - [ ] 验证 Step 2 切换到 Template 模式
     - [ ] 验证输入参数自动填充默认值
   - [ ] **Template → Inline**:
     - [ ] 在 Step 1 点击 "⚙️ Custom Configuration"
     - [ ] 验证 Step 1 切换到 Inline 模式
     - [ ] 验证之前的 config 保留
   - [ ] **撤销所有更改**（不保存）
6. [ ] **验证数据不丢失**:
   - [ ] 在 Simple Mode 和 Advanced Mode 之间切换
   - [ ] 验证所有步骤数据完整保留
   - [ ] 验证映射关系完整保留

---

### Phase 4: 执行验证

#### 4.1 Simple Workflow 执行
1. [ ] 执行 `test-simple-mode-editor`
2. [ ] 验证所有步骤成功执行
3. [ ] 验证 DataMapper 正确提取数据

#### 4.2 Complex DAG Workflow 执行
1. [ ] 执行 `test-advanced-dag-editor`
2. [ ] 验证并行步骤同时执行
3. [ ] 验证条件分支正确
4. [ ] 验证循环正常工作

#### 4.3 DataMapper Workflow 执行
1. [ ] 执行 `test-datamapper-features`
2. [ ] 验证转换函数正确执行:
   - [ ] uppercase: "p2" → "P2"
   - [ ] trim: "  Temporary Test  " → "Temporary Test"
   - [ ] parseInt: "201" → 201
3. [ ] 验证 assertions 通过

#### 4.4 Mode Switching Workflow 执行
1. [ ] 执行 `test-mode-switching`
2. [ ] 验证 Template 模式执行成功
3. [ ] 验证 Inline 模式执行成功
4. [ ] 验证两种模式结果一致

---

## 🚀 快速开始

### 步骤 1: 启动后端服务

```bash
cd nextest-platform
make run
```

**验证**: 访问 http://localhost:8090/health 应返回 `{"status":"healthy"}`

---

### 步骤 2: 导入测试数据

```bash
# 方式 1: 使用 curl 导入
cd nextest-platform/examples

# 导入后端 API 测试
curl -X POST http://localhost:8090/api/v2/import \
  -H "Content-Type: application/json" \
  -d @test-new-architecture.json

# 导入综合演示工作流
curl -X POST http://localhost:8090/api/v2/import \
  -H "Content-Type: application/json" \
  -d @demo-comprehensive-workflow.json

# 导入前端功能测试
curl -X POST http://localhost:8090/api/v2/import \
  -H "Content-Type: application/json" \
  -d @test-frontend-features.json

# 方式 2: 使用导入工具（如果存在）
./import-tool -f test-new-architecture.json
./import-tool -f demo-comprehensive-workflow.json
./import-tool -f test-frontend-features.json
```

---

### 步骤 3: 启动前端服务

```bash
cd NextTestPlatformUI
npm run dev
```

**验证**: 访问 http://localhost:5173 应显示测试平台首页

---

### 步骤 4: 执行测试

**通过前端界面**:
1. 访问 http://localhost:5173
2. 进入 "Test Case Manager"
3. 找到测试分组 "Backend API Tests"
4. 执行各个测试案例
5. 查看执行结果

**通过 API**:
```bash
# 执行单个测试
curl -X POST http://localhost:8090/api/v2/tests/test-backend-health/execute

# 执行整个分组
curl -X POST http://localhost:8090/api/v2/groups/group-backend-api/execute
```

---

## 📊 预期结果

### 后端 API 测试
- ✅ Health Check: 200 OK
- ✅ Test Groups CRUD: 全部成功
- ✅ Test Cases Lifecycle: 全部成功

### 综合工作流测试
- ✅ 8 个步骤全部成功
- ✅ DataMapper 正确提取和转换数据
- ✅ 并行执行正常
- ✅ 条件分支正确
- ✅ 循环最多 3 次迭代
- ✅ 错误重试机制工作
- ✅ 清理步骤执行

### 前端编辑器测试
- ✅ Simple Mode: 拖拽、CRUD、DataMapping 全部正常
- ✅ Advanced DAG: 渲染、交互、布局切换正常
- ✅ DataMapper: 拖拽、映射、转换全部正常
- ✅ 模式切换: Template ↔ Inline 切换流畅，数据不丢失

---

## 🐛 故障排查

### 问题 1: 后端服务无法启动
**检查**:
- [ ] 端口 8090 是否被占用
- [ ] 数据库文件是否存在
- [ ] 配置文件 config.toml 是否正确

**解决**:
```bash
# 检查端口
lsof -i :8090

# 重新初始化数据库
make clean-db
make init
```

---

### 问题 2: 前端无法连接后端
**检查**:
- [ ] 后端服务是否运行
- [ ] CORS 配置是否正确
- [ ] API 基础 URL 是否正确

**解决**:
检查 `NextTestPlatformUI/services/api/config.ts`:
```typescript
export const API_BASE_URL = 'http://localhost:8090/api/v2';
```

---

### 问题 3: 测试案例导入失败
**检查**:
- [ ] JSON 格式是否正确
- [ ] groupId 是否存在
- [ ] Action Template 是否已导入

**解决**:
```bash
# 验证 JSON 格式
cat test-new-architecture.json | jq .

# 检查 Action Templates
curl http://localhost:8090/api/v2/action-templates/accessible
```

---

### 问题 4: DataMapper 不工作
**检查**:
- [ ] 后端 variable_resolver.go 是否正确编译
- [ ] 源步骤是否已执行
- [ ] JSONPath 是否正确

**解决**:
查看后端日志:
```bash
# 日志应显示 DataMapper 解析过程
[INFO] Resolving DataMapper: dm-1
[INFO] Source step: step-source
[INFO] Source path: testId
[INFO] Transform: uppercase
[INFO] Result: TEST-123
```

---

### 问题 5: DAG 编辑器不显示
**检查**:
- [ ] React Flow 依赖是否安装
- [ ] Dagre 依赖是否安装
- [ ] 浏览器控制台是否有错误

**解决**:
```bash
cd NextTestPlatformUI
npm install @xyflow/react @dagrejs/dagre
npm run dev
```

---

## 📝 测试报告模板

### 执行信息
- **执行人**: _______
- **执行日期**: _______
- **环境**: 本地开发环境
- **后端版本**: v2.0
- **前端版本**: v1.0

### 测试结果

| 测试分组 | 测试案例 | 状态 | 备注 |
|---------|---------|------|------|
| Backend API Tests | test-backend-health | ⬜ | |
| Backend API Tests | test-backend-groups-api | ⬜ | |
| Backend API Tests | test-backend-testcases-api | ⬜ | |
| Workflow Demo | test-demo-comprehensive-workflow | ⬜ | |
| Simple Mode Tests | test-simple-mode-editor | ⬜ | |
| Advanced Mode Tests | test-advanced-dag-editor | ⬜ | |
| DataMapper Tests | test-datamapper-features | ⬜ | |
| UI Tests | test-mode-switching | ⬜ | |

### 功能验证

| 功能 | 状态 | 备注 |
|------|------|------|
| Action Template 模式 | ⬜ | |
| Inline 配置模式 | ⬜ | |
| 双模式切换 | ⬜ | |
| DataMapper 拖拽 | ⬜ | |
| DataMapper 转换函数 | ⬜ | |
| Simple Mode 编辑器 | ⬜ | |
| Advanced DAG 编辑器 | ⬜ | |
| Dagre 自动布局 | ⬜ | |
| 并行执行 | ⬜ | |
| 条件分支 | ⬜ | |
| 循环 | ⬜ | |
| 错误处理 | ⬜ | |

### 问题记录

| 序号 | 问题描述 | 严重程度 | 状态 | 备注 |
|------|---------|---------|------|------|
| 1 | | | | |
| 2 | | | | |

### 总体评价
⬜ 通过
⬜ 部分通过
⬜ 未通过

**备注**: _______________________________

---

## 🎯 成功标准

所有以下条件必须满足：

1. ✅ **后端 API 测试**: 所有3个测试案例通过
2. ✅ **综合工作流测试**: 8个步骤全部成功执行
3. ✅ **Simple Mode 编辑器**: 拖拽、CRUD、DataMapping 正常
4. ✅ **Advanced DAG 编辑器**: 渲染、交互、布局切换正常
5. ✅ **DataMapper 功能**: 拖拽映射、转换函数、优先级正确
6. ✅ **模式切换**: Template ↔ Inline 切换流畅，数据不丢失
7. ✅ **前端功能测试**: 所有4个测试案例通过
8. ✅ **无严重 Bug**: 没有导致系统崩溃或数据丢失的问题

---

**测试完成后，请填写测试报告并反馈结果！**
