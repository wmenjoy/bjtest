# TestCase Redesign - 当前状态与下一步工作

> 最后更新: 2025-11-24
> 状态: 前端UI已完成 ✅ | 后端集成待完成 ⏳

---

## 📊 项目概述

将 TestCase 从手动/自动混合模式重构为纯自动化执行模式，支持循环、分支等高级控制流。

### 设计目标
- **TestCase = 一堆 TestStep 的自动化执行流程**
- 支持 forEach/while/count 三种循环类型
- 支持条件分支（if-else-if-else）
- 嵌套子步骤（loop body、branch body）
- 变量传递和输出映射

---

## ✅ 已完成工作

### Phase 1-3: 后端数据模型 (已完成)
- ✅ `TestStep` 模型更新（支持 loop, branches, children）
- ✅ `LoopConfig` 类型定义（forEach, while, count）
- ✅ `BranchConfig` 类型定义（condition, label, children）
- ✅ 前端 TypeScript 类型同步

**相关文件:**
- `/Users/liujinliang/workspace/ai/testplatform/nextest-platform/internal/models/test_step.go`
- `/Users/liujinliang/workspace/ai/testplatform/NextTestPlatformUI/types/index.ts`

### Phase 4-5: 前端组件开发 (已完成)
- ✅ `StepEditor.tsx` - 主步骤编辑器
- ✅ `StepCard.tsx` - 单个步骤卡片
- ✅ `LoopConfigEditor.tsx` - 循环配置UI
- ✅ `BranchConfigEditor.tsx` - 分支配置UI
- ✅ `ChildStepList.tsx` - 嵌套步骤容器
- ✅ `ConditionEditor.tsx` - 条件表达式编辑器

**相关文件:**
- `/Users/liujinliang/workspace/ai/testplatform/NextTestPlatformUI/components/testcase/stepEditor/`

### Phase 6: UI集成与测试 (已完成)
- ✅ 替换 `TestCaseEditor.tsx` 中的旧 StepItem 为新 StepEditor
- ✅ 前端构建成功，无错误
- ✅ 浏览器测试通过 (端口: 8082)

**修改文件:**
- `/Users/liujinliang/workspace/ai/testplatform/NextTestPlatformUI/components/testcase/TestCaseEditor.tsx`

---

## 🧪 前端UI测试结果 (2025-11-24)

### 测试环境
- **前端**: http://localhost:8082
- **测试用例**: base-images-get-detail (基础镜像API测试)
- **浏览器**: Chrome DevTools

### 功能测试详情

#### 1. StepEditor 基础功能 ✅
```
测试步骤:
1. 进入 Test Repository → 基础镜像API测试 → base-images-get-detail
2. 点击 Edit 按钮进入编辑模式
3. 验证新 StepEditor 界面显示

结果:
✅ START EXECUTION 指示器显示
✅ 步骤卡片显示: "1. HTTP GET Request"
✅ 类型徽章显示: "HTTP" (emerald 绿色)
✅ 操作按钮显示: Edit, Duplicate, Delete, Expand
✅ ADD STEP 按钮显示
✅ END 指示器显示
✅ 底部统计显示: "1 step | 0 loops | 0 branches"
```

#### 2. Loop Configuration - forEach ✅
```
测试步骤:
1. 点击 Expand 展开步骤配置
2. 点击 Loop Configuration 切换按钮

结果:
✅ 循环类型选择器显示: ForEach, While, Count 按钮
✅ forEach 默认选中
✅ Source Array 输入框: "{{userList}} or response.data.items"
✅ Item Variable 输入框: 默认值 "item"
✅ Index Variable 输入框: 默认值 "i"
✅ Max Iterations 微调器: 默认值 100
✅ 实时预览显示: "For each [] as item (index: i) Max: 100 iterations"
✅ Loop Body 容器显示: "0 steps"
✅ 步骤徽章更新: "Loop: forEach"
✅ 底部统计更新: "1 loops"
```

#### 3. Loop Configuration - while ✅
```
测试步骤:
1. 点击 While 按钮切换循环类型

结果:
✅ UI 动态切换为 while 配置
✅ Condition 输入框显示: "{{hasMore}} == true"
✅ 帮助文本显示: "Loop continues while this condition evaluates to true"
✅ Max Iterations 保留
✅ 实时预览更新: "While condition is true Max: 100 iterations"
✅ 步骤徽章更新: "Loop: while"
✅ forEach 特有字段已移除 (Source Array, Item Variable, Index Variable)
```

#### 4. Loop Configuration - count ✅
```
测试步骤:
1. 点击 Count 按钮切换循环类型

结果:
✅ UI 动态切换为 count 配置
✅ Number of Iterations 输入框: "10 or {{retryCount}}", 默认值 10
✅ Max Iterations 保留
✅ 实时预览更新: "Repeat 10 times Max: 100 iterations"
✅ 步骤徽章更新: "Loop: count"
✅ while 特有字段已移除 (Condition)
```

#### 5. Loop Body - 嵌套子步骤 ✅
```
测试步骤:
1. 在 Loop Body 区域点击 Add Step 按钮

结果:
✅ 子步骤成功创建
✅ 嵌套编号显示: "1.1" (表示步骤1的第1个子步骤)
✅ 子步骤名称: "Unnamed Step"
✅ 子步骤类型徽章: "HTTP"
✅ 子步骤操作按钮: Edit, Duplicate, Delete, Expand
✅ Loop Body 计数更新: "1 step"
✅ 子步骤支持完整的编辑功能
```

#### 6. Branch Configuration - 基础分支 ✅
```
测试步骤:
1. 点击 Add Conditional Branches 按钮

结果:
✅ Branch Configuration 面板显示
✅ 分支计数显示: "1 branches"
✅ 分支 1 配置显示:
   - Label 输入框: "Branch 1"
   - Condition 输入框: "e.g., {{user.role}} == 'admin'"
   - 操作符快捷按钮: ==, !=, >, <, >=, <=, contains, exists, &&, ||
   - Branch Body 容器: "0 steps"
   - Delete 按钮
✅ Branch Structure 预览显示: "-- (no condition) -> Branch 1"
✅ 步骤徽章更新: "1 branches"
✅ 底部统计更新: "1 branches"
```

#### 7. Multiple Branches - 多分支 ✅
```
测试步骤:
1. 点击 Add Branch 按钮添加第二个分支

结果:
✅ 分支 2 成功创建
✅ 分支计数更新: "2 branches"
✅ 分支 2 显示完整配置界面（同分支 1）
✅ Branch Structure 预览更新:
   |-- (no condition) -> Branch 1
   -- (no condition) -> Branch 2
✅ 步骤徽章保持: "2 branches" (注意: 前端显示为总分支数，不是单独计数)
```

#### 8. Default Branch - 默认/Else 分支 ✅
```
测试步骤:
1. 点击 Add Default 按钮

结果:
✅ Default 分支成功创建
✅ 分支计数更新: "3 branches"
✅ Default 分支特殊显示:
   - Label: "Default (else)" (黄色背景标记)
   - 标识文本: "Fallback branch"
   - 说明文字: "This branch executes when no other conditions match"
   - 无 Condition 编辑器（符合预期，默认分支无条件）
   - Branch Body 容器: "0 steps"
✅ Branch Structure 预览完整:
   |-- (no condition) -> Branch 1
   |-- (no condition) -> Branch 2
   -- default -> Default (else)
✅ Add Default 按钮消失（防止重复添加）
```

#### 9. 视觉反馈与 UX ✅
```
✅ 步骤类型颜色编码正确:
   - HTTP: emerald (绿色)
   - Command: orange (橙色)
   - Assert: cyan (青色)
   - Branch: purple (紫色)
   - Group: slate (灰色)

✅ 动态徽章更新:
   - "Loop: count" 显示在步骤标题
   - "3 branches" 显示在步骤标题

✅ 底部统计实时更新:
   - "1 step" (主步骤)
   - "1 loops" (循环配置)
   - "1 branches" (分支配置，注意这里显示为主步骤的分支数)

✅ 展开/折叠动画流畅
✅ 所有按钮和输入框响应正常
✅ 无 UI 错误或卡顿
```

---

## ❌ 已知问题与限制

### 1. 数据持久化失败 (预期行为)
**问题描述:**
- 点击 "Save Changes" 按钮后，配置的 loop 和 branch 数据不会保存到后端
- 刷新页面后，所有配置丢失，恢复到原始状态

**根本原因:**
- 后端 API (`PUT /api/v2/tests/:id`) 尚未更新以接收和存储新的 `loop`, `branches`, `children` 字段
- 前端发送的数据结构与后端期望的 `TestCase` 模型不匹配

**影响范围:**
- 仅影响持久化，UI 功能完全正常
- 所有编辑操作在当前会话中有效

**解决方案:**
见 "下一步工作 - Phase 7"

### 2. 测试执行 404 错误 (预期行为)
**错误日志:**
```
[GIN] 2025/11/24 - 07:10:31 | 404 | 4.209µs | ::1 | POST "/api/v2/tests/test-hooks-demo/execute"
```

**问题描述:**
- 点击 "Run" 按钮或直接执行测试时，返回 404 错误
- 执行端点不存在或未正确路由

**根本原因:**
- 后端执行引擎尚未集成新的 loop/branch 执行逻辑
- 可能是端点路径不匹配或执行逻辑未实现

**解决方案:**
见 "下一步工作 - Phase 8"

### 3. ExecutionView 未集成
**问题描述:**
- ExecutionView 组件已开发 (`components/testcase/execution/ExecutionView.tsx`)
- 但尚未集成到测试执行流程中
- 无法实时查看 loop 迭代和 branch 执行路径

**影响范围:**
- 无法可视化执行进度
- 无法调试 loop/branch 行为

**解决方案:**
见 "下一步工作 - Phase 9"

---

## 🎯 下一步工作计划

### Phase 7: 后端 API 更新 (高优先级) ⏳

**目标:** 使前端保存的 loop/branch 配置能够正确存储到数据库

**任务清单:**
1. **更新 TestCase 保存端点**
   - 文件: `/Users/liujinliang/workspace/ai/testplatform/nextest-platform/internal/handler/test_handler.go`
   - 方法: `UpdateTest()`
   - 任务:
     - 确保接收 `steps[].loop` 字段（JSON 对象）
     - 确保接收 `steps[].branches` 字段（JSON 数组）
     - 确保接收 `steps[].children` 字段（JSON 数组，嵌套 TestStep）
     - 验证数据结构完整性

2. **更新 TestCase 加载端点**
   - 文件: `/Users/liujinliang/workspace/ai/testplatform/nextest-platform/internal/handler/test_handler.go`
   - 方法: `GetTest()`
   - 任务:
     - 确保返回 `steps[].loop` 字段
     - 确保返回 `steps[].branches` 字段
     - 确保返回 `steps[].children` 字段（完整嵌套结构）

3. **数据库 Schema 验证**
   - 文件: `/Users/liujinliang/workspace/ai/testplatform/nextest-platform/internal/models/test_case.go`
   - 任务:
     - 确认 `test_cases.steps` 列的 JSONB 类型支持嵌套结构
     - 如需要，创建数据库迁移脚本
     - 测试大型嵌套结构的存储和查询

4. **API 测试**
   ```bash
   # 测试保存带 loop 的 TestCase
   curl -X PUT http://localhost:8090/api/v2/tests/test-001 \
     -H "Content-Type: application/json" \
     -d '{
       "title": "Loop Test",
       "steps": [{
         "id": "step-1",
         "type": "http",
         "loop": {
           "type": "count",
           "count": 10,
           "maxIterations": 100
         },
         "children": [{
           "id": "step-1-1",
           "type": "http",
           "config": {"method": "GET", "url": "/api/test"}
         }]
       }]
     }'

   # 测试加载
   curl http://localhost:8090/api/v2/tests/test-001
   ```

**预期结果:**
- 保存后，loop/branch 配置存储到数据库
- 刷新页面后，配置正确恢复
- 前端 UI 显示完整的配置信息

---

### Phase 8: 后端执行引擎集成 (高优先级) ⏳

**目标:** 使带有 loop/branch 的 TestCase 能够正确执行

**任务清单:**
1. **Loop 执行逻辑**
   - 文件: `/Users/liujinliang/workspace/ai/testplatform/nextest-platform/internal/testcase/executor.go`
   - 方法: 新增 `executeStepWithLoop()`
   - 任务:
     - **forEach 循环:**
       - 解析 `loop.source` 变量（如 `{{userList}}`）
       - 迭代数组，每次设置 `loop.itemVar` 和 `loop.indexVar`
       - 执行 `step.children`，传递更新后的变量池
       - 收集每次迭代的输出
     - **while 循环:**
       - 评估 `loop.condition` 表达式
       - 当条件为 true 时重复执行 `step.children`
       - 检查 `loop.maxIterations` 防止无限循环
       - 每次迭代后重新评估条件
     - **count 循环:**
       - 解析 `loop.count` 值（支持变量如 `{{retryCount}}`）
       - 重复执行 `step.children` N 次
       - 设置循环计数器变量

2. **Branch 执行逻辑**
   - 文件: `/Users/liujinliang/workspace/ai/testplatform/nextest-platform/internal/testcase/executor.go`
   - 方法: 新增 `executeStepWithBranches()`
   - 任务:
     - 按顺序评估每个 `branch.condition`
     - 执行第一个条件为 true 的分支的 `children`
     - 如果所有条件都为 false，执行 default 分支（`condition: ""`）
     - 记录执行的分支路径

3. **变量插值引擎**
   - 文件: `/Users/liujinliang/workspace/ai/testplatform/nextest-platform/internal/testcase/variable_interpolator.go` (可能需要新建)
   - 任务:
     - 实现 `{{variable}}` 语法解析
     - 支持嵌套访问: `{{response.body.users}}`
     - 支持表达式: `{{status}} == 200`, `{{count}} > 10`
     - 支持逻辑运算: `&&`, `||`, `!`
     - 类型转换和错误处理

4. **执行结果记录**
   - 文件: `/Users/liujinliang/workspace/ai/testplatform/nextest-platform/internal/models/test_result.go`
   - 任务:
     - 扩展 `StepResult` 模型以包含:
       - `loopIterations` - 循环迭代次数
       - `executedBranchIndex` - 执行的分支索引
       - `childResults` - 嵌套步骤结果（递归结构）
     - 更新数据库 schema 以存储嵌套结果

5. **WebSocket 实时推送**
   - 文件: `/Users/liujinliang/workspace/ai/testplatform/nextest-platform/internal/websocket/hub.go`
   - 任务:
     - 推送 loop 迭代开始/完成事件
     - 推送 branch 条件评估结果
     - 推送嵌套步骤执行状态
     - 更新变量池变化

6. **修复执行端点 404**
   - 文件: `/Users/liujinliang/workspace/ai/testplatform/nextest-platform/cmd/server/main.go`
   - 任务:
     - 确认路由注册: `POST /api/v2/tests/:id/execute`
     - 或修正前端调用的端点路径

**测试场景:**
```go
// Test 1: forEach loop
{
  "title": "ForEach Loop Test",
  "variables": {
    "userList": ["alice", "bob", "charlie"]
  },
  "steps": [{
    "id": "step-1",
    "type": "http",
    "loop": {
      "type": "forEach",
      "source": "{{userList}}",
      "itemVar": "user",
      "indexVar": "i",
      "maxIterations": 100
    },
    "children": [{
      "id": "step-1-1",
      "type": "http",
      "config": {
        "method": "GET",
        "url": "/api/users/{{user}}"
      }
    }]
  }]
}
// 预期: 执行 3 次，每次 user 为 alice, bob, charlie

// Test 2: Conditional branches
{
  "title": "Branch Test",
  "variables": {
    "role": "admin"
  },
  "steps": [{
    "id": "step-1",
    "type": "http",
    "branches": [
      {
        "condition": "{{role}} == 'admin'",
        "label": "Admin Path",
        "children": [{"id": "step-admin", "type": "http", "config": {...}}]
      },
      {
        "condition": "{{role}} == 'user'",
        "label": "User Path",
        "children": [{"id": "step-user", "type": "http", "config": {...}}]
      },
      {
        "condition": "",
        "label": "Default",
        "children": [{"id": "step-default", "type": "http", "config": {...}}]
      }
    ]
  }]
}
// 预期: 执行 Admin Path 分支
```

---

### Phase 9: ExecutionView 组件集成 (中优先级) ⏳

**目标:** 实时可视化 loop/branch 执行过程

**任务清单:**
1. **集成 ExecutionView 到测试运行流程**
   - 文件: `/Users/liujinliang/workspace/ai/testplatform/NextTestPlatformUI/components/TestCaseManager.tsx` 或专用运行页面
   - 任务:
     - 创建测试运行页面/模态框
     - 渲染 `<ExecutionView>` 组件
     - 传递 `testCaseId`, `runId`, `steps`, `status`, `variables`

2. **WebSocket 连接管理**
   - 文件: `/Users/liujinliang/workspace/ai/testplatform/NextTestPlatformUI/hooks/useTestExecution.ts` (新建)
   - 任务:
     - 连接到 `ws://localhost:8090/api/v2/workflows/runs/:runId/stream`
     - 监听执行事件:
       - `step_start`, `step_complete`, `step_failed`
       - `loop_iteration_start`, `loop_iteration_complete`
       - `branch_evaluated`, `branch_executed`
       - `variable_updated`
     - 更新 React state 触发 UI 刷新

3. **StepProgress 组件扩展**
   - 文件: `/Users/liujinliang/workspace/ai/testplatform/NextTestPlatformUI/components/testcase/execution/StepProgress.tsx`
   - 任务:
     - 显示循环迭代进度条: "Iteration 2/10"
     - 显示分支执行路径: "Branch: Admin Path (condition matched)"
     - 递归渲染嵌套子步骤
     - 支持展开/折叠嵌套结构

4. **VariablePool 实时更新**
   - 文件: `/Users/liujinliang/workspace/ai/testplatform/NextTestPlatformUI/components/testcase/execution/VariablePool.tsx`
   - 任务:
     - 高亮最近变化的变量
     - 显示循环变量: `item`, `i`
     - 显示分支评估时的变量值

**预期效果:**
```
执行视图示例:

Execution: run-12345
Status: Running
Progress: 60% | Duration: 2.3s

Steps:
  ✓ 1. Initialize Variables (100ms)
  ⟳ 2. Fetch User Data (Loop: forEach) - Iteration 2/3
    ✓ 2.1. HTTP GET /api/users/alice (50ms)
    ⟳ 2.1. HTTP GET /api/users/bob (running...)
    ⏳ 2.1. HTTP GET /api/users/charlie (pending)
  ⏳ 3. Process Response (pending)

Variable Pool:
  userList: ["alice", "bob", "charlie"]
  ✨ user: "bob"  (highlighted as changed)
  ✨ i: 1         (highlighted as changed)
  response_alice: {...}
```

---

### Phase 10: 端到端测试 (低优先级) 📋

**目标:** 完整的集成测试和用户验收测试

**任务清单:**
1. 创建测试套件
   - 简单 loop (count: 5)
   - 复杂 forEach (迭代 API 返回的数组)
   - while 循环 (分页获取)
   - 单层分支 (if-else)
   - 多层分支 (if-else-if-else)
   - 嵌套 loop + branch

2. 性能测试
   - 大循环 (100+ 迭代)
   - 深度嵌套 (4+ 层)
   - 并发执行多个带 loop 的测试

3. 错误处理测试
   - 循环中某次迭代失败
   - 所有分支条件都不匹配
   - 变量插值失败
   - 超过 maxIterations 限制

---

## 📁 关键文件清单

### 前端文件 (已完成)
```
/Users/liujinliang/workspace/ai/testplatform/NextTestPlatformUI/
├── components/testcase/
│   ├── TestCaseEditor.tsx                    ✅ 已修改 (集成 StepEditor)
│   ├── stepEditor/
│   │   ├── StepEditor.tsx                    ✅ 新建 (主编辑器)
│   │   ├── StepCard.tsx                      ✅ 新建 (步骤卡片)
│   │   ├── LoopConfigEditor.tsx              ✅ 新建 (循环配置)
│   │   ├── BranchConfigEditor.tsx            ✅ 新建 (分支配置)
│   │   ├── ChildStepList.tsx                 ✅ 新建 (子步骤列表)
│   │   └── ConditionEditor.tsx               ✅ 新建 (条件编辑器)
│   └── execution/
│       ├── ExecutionView.tsx                 ✅ 已存在 (待集成)
│       ├── StepProgress.tsx                  ✅ 已存在 (待扩展)
│       └── VariablePool.tsx                  ✅ 已存在 (待扩展)
└── types/index.ts                            ✅ 已修改 (新增类型)
```

### 后端文件 (待修改)
```
/Users/liujinliang/workspace/ai/testplatform/nextest-platform/
├── internal/
│   ├── models/
│   │   ├── test_case.go                      ✅ 已更新 (TestStep 模型)
│   │   └── test_result.go                    ⏳ 待扩展 (嵌套结果)
│   ├── handler/
│   │   └── test_handler.go                   ⏳ 待修改 (保存/加载端点)
│   ├── testcase/
│   │   ├── executor.go                       ⏳ 待扩展 (loop/branch 执行)
│   │   └── variable_interpolator.go          ⏳ 待新建 (变量插值)
│   └── websocket/
│       └── hub.go                            ⏳ 待扩展 (loop/branch 事件)
└── cmd/server/main.go                        ⏳ 检查路由
```

---

## 🔧 技术债务

1. **变量插值引擎缺失**
   - 当前可能依赖简单的字符串替换
   - 需要完整的表达式评估器（支持 `==`, `>`, `&&`, 等）

2. **嵌套结构序列化**
   - JSONB 存储可能对深度嵌套有性能影响
   - 考虑限制嵌套深度（建议最大 5 层）

3. **循环超时处理**
   - 需要全局超时控制，防止单个 loop 执行过久
   - 建议添加步骤级别的 timeout 配置

4. **错误传播机制**
   - 嵌套步骤失败时，是否中断父步骤？
   - 需要明确的错误处理策略（abort vs continue）

---

## 📊 测试覆盖率

### 前端 UI 测试
- ✅ StepEditor 基础渲染
- ✅ Loop Configuration (forEach, while, count)
- ✅ Loop Body 嵌套步骤
- ✅ Branch Configuration (单分支、多分支、默认分支)
- ✅ 视觉反馈和动态更新
- ❌ 数据持久化（依赖后端）
- ❌ 执行流程（依赖后端）

### 后端功能测试
- ❌ Loop 执行逻辑
- ❌ Branch 执行逻辑
- ❌ 变量插值
- ❌ 嵌套结果存储
- ❌ WebSocket 事件推送

---

## 🚀 推荐执行顺序

基于依赖关系和优先级，建议按以下顺序完成：

1. **Phase 7: 后端 API 更新** (1-2天)
   - 优先级: 🔴 最高
   - 理由: 阻塞所有其他功能，必须先完成数据持久化

2. **Phase 8: 后端执行引擎** (3-5天)
   - 优先级: 🔴 最高
   - 理由: 核心功能，loop/branch 执行是项目目标

3. **Phase 9: ExecutionView 集成** (1-2天)
   - 优先级: 🟡 中等
   - 理由: 提升用户体验，但不阻塞基本功能

4. **Phase 10: 端到端测试** (持续)
   - 优先级: 🟢 低
   - 理由: 在开发过程中持续进行

---

## 💡 注意事项

1. **向后兼容性**
   - 现有的简单 TestCase（无 loop/branch）必须继续工作
   - 需要渐进式迁移策略

2. **性能监控**
   - 大循环可能导致性能问题
   - 需要添加监控和限流机制

3. **用户文档**
   - 需要更新用户手册说明 loop/branch 语法
   - 提供示例和最佳实践

4. **错误信息友好性**
   - 变量插值失败时，提供清晰的错误信息
   - 循环超时时，说明在哪次迭代失败

---

## 📞 联系信息

如有问题或需要讨论技术细节，请参考：
- 项目文档: `/Users/liujinliang/workspace/ai/testplatform/nextest-platform/README.md`
- API 文档: `/Users/liujinliang/workspace/ai/testplatform/nextest-platform/docs/API_DOCUMENTATION.md`
- 前端文档: `/Users/liujinliang/workspace/ai/testplatform/NextTestPlatformUI/README.md`

---

*本文档由 Claude Code 自动生成，最后更新时间: 2025-11-24*
