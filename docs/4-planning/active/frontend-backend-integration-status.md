# 前后端功能对照矩阵

**日期**: 2025-11-23
**目的**: 系统分析前端页面功能和后端API支持情况，规划测试验证方案

---

## 📊 当前数据统计

### 数据库现状
```
✅ test_cases (测试用例):    15 条
✅ test_groups (测试组):     18 条
✅ workflows (工作流):       23 条
✅ environments (环境):       6 条
✅ tenants (组织):           5 条
✅ projects (项目):          5 条
✅ users (用户):             3 条 (Admin, Editor, Viewer)
✅ roles (角色):             3 条 (Administrator, Editor, Viewer)
```

**问题**: 数据管理混乱，需要通过前端页面进行系统化整理

---

## 🎯 前端页面功能清单

### 1. **Dashboard（仪表盘）** 📊
**文件**: `components/Dashboard.tsx`
**权限**: `VIEW_DASHBOARD`
**功能**:
- ✅ 显示测试统计（总数、通过率、失败数）
- ✅ 最近测试运行历史
- ✅ 测试覆盖率图表
- ✅ 项目健康度指标

**后端依赖**:
```
GET /api/tests?limit=100&offset=0     - 获取测试用例列表
GET /api/groups/tree                  - 获取测试组树
（暂无专门的统计API，前端自行计算）
```

**数据来源**: 基于现有 15 个测试用例和 18 个测试组
**验证方式**: 打开 Dashboard 查看统计数据是否正确

---

### 2. **TestCaseManager（测试用例管理）** 📝
**文件**: `components/TestCaseManager.tsx`
**权限**: `VIEW_CASES`, `CREATE_CASE`, `EDIT_CASE`, `DELETE_CASE`
**功能**:
- ✅ 列表查看（表格视图）
- ✅ 创建新测试用例
- ✅ 编辑测试用例（标题、描述、步骤、断言）
- ✅ 删除测试用例
- ✅ 按文件夹分组
- ✅ 搜索和过滤
- ✅ 批量操作

**后端API支持**:
```
✅ GET    /api/tests                    - 列表（分页）
✅ GET    /api/tests/:id                - 详情
✅ POST   /api/tests                    - 创建
✅ PUT    /api/tests/:id                - 更新
✅ DELETE /api/tests/:id                - 删除
✅ GET    /api/tests/search?q=keyword   - 搜索
✅ POST   /api/tests/:id/execute        - 执行测试
```

**数据来源**: 现有 15 个测试用例
**验证重点**:
1. ✅ 查看所有15个测试用例
2. ⏳ 整理：删除重复/无效用例
3. ⏳ 创建新的规范测试用例
4. ⏳ 编辑现有用例，添加详细描述和标签
5. ⏳ 按文件夹整理分类

**测试用例类型**:
- HTTP 测试（API 调用）
- Command 测试（命令行执行）
- Workflow 测试（关联工作流）

---

### 3. **TestHistory（测试历史）** 📜
**文件**: `components/TestHistory.tsx`
**权限**: `VIEW_RUNS`
**功能**:
- ✅ 查看所有测试运行记录
- ✅ 按时间排序
- ✅ 按状态过滤（Passed, Failed, Skipped）
- ✅ 查看执行日志
- ✅ 重新执行测试

**后端API**:
```
⚠️ GET /api/runs                       - 列表（暂无专门API）
⚠️ GET /api/runs/:id                   - 详情（暂无专门API）
✅ POST /api/tests/:id/execute         - 执行测试
```

**数据来源**: test_results, test_runs 表
**状态**: ⚠️ **后端缺少专门的 TestRun API**
**验证方式**: 执行测试后查看历史记录

---

### 4. **ScriptLab（脚本实验室）** 🧪
**文件**: `components/ScriptLab.tsx`
**权限**: `VIEW_SCRIPTS`, `CREATE_SCRIPT`, `EDIT_SCRIPT`
**功能**:
- ✅ 工作流列表查看
- ✅ 创建新工作流
- ✅ 编辑工作流定义（YAML/JSON）
- ✅ 测试工作流执行
- ✅ 查看执行历史
- ✅ 工作流版本管理

**后端API**:
```
✅ GET    /api/workflows                - 列表（分页）
✅ GET    /api/workflows/:id            - 详情
✅ POST   /api/workflows                - 创建
✅ PUT    /api/workflows/:id            - 更新
✅ DELETE /api/workflows/:id            - 删除
✅ POST   /api/workflows/:id/execute    - 执行
✅ GET    /api/workflows/runs/:runId    - 获取执行结果
✅ WS     /api/workflows/runs/:runId/stream - 实时日志
```

**数据来源**: 现有 23 个工作流
**验证重点**:
1. ✅ 查看所有23个工作流
2. ⏳ 整理工作流定义
3. ⏳ 测试工作流执行
4. ⏳ 验证 WebSocket 实时日志
5. ⏳ 查看执行历史记录

---

### 5. **ActionLibrary（动作库）** 🎬
**文件**: `components/ActionLibrary.tsx`
**权限**: `VIEW_SCRIPTS`, `CREATE_SCRIPT`
**功能**:
- ✅ 脚本/动作列表
- ✅ 创建新动作
- ✅ 编辑动作代码
- ✅ 分类管理（Python, JavaScript, Shell）
- ✅ 参数配置
- ✅ 测试运行

**后端API**:
```
⚠️ （暂无专门的 Script API，使用 Workflow API 替代）
✅ GET  /api/workflows               - 可用于脚本列表
✅ POST /api/workflows               - 创建脚本
```

**数据来源**: 可使用 workflows 表存储脚本
**状态**: ⚠️ **后端缺少专门的 Script API**
**验证方式**: 通过 Workflow API 管理脚本类型的工作流

---

### 6. **SystemConfig（系统配置）** ⚙️
**文件**: `components/SystemConfig.tsx`
**权限**: `VIEW_SETTINGS`, `EDIT_SETTINGS`
**功能**:
- ✅ 环境管理（Dev, Staging, Production）
- ✅ 环境变量配置
- ✅ 激活/停用环境
- ✅ 全局设置

**后端API**:
```
✅ GET    /api/environments                    - 列表
✅ GET    /api/environments/active             - 获取活动环境
✅ GET    /api/environments/:id                - 详情
✅ POST   /api/environments                    - 创建
✅ PUT    /api/environments/:id                - 更新
✅ DELETE /api/environments/:id                - 删除
✅ POST   /api/environments/:id/activate       - 激活
✅ GET    /api/environments/:id/variables      - 获取变量
✅ PUT    /api/environments/:id/variables/:key - 设置变量
✅ DELETE /api/environments/:id/variables/:key - 删除变量
```

**数据来源**: 现有 6 个环境
**验证重点**:
1. ✅ 查看所有6个环境
2. ⏳ 配置环境变量（API_KEY, BASE_URL等）
3. ⏳ 激活/停用环境
4. ⏳ 测试变量在测试执行中的使用

---

### 7. **AdminPortal（管理门户）** 👥
**文件**: `components/AdminPortal.tsx`
**权限**: `MANAGE_USERS`, `MANAGE_ROLES`, `MANAGE_PROJECTS`
**功能**:
- ✅ 用户管理（列表、创建、编辑、删除）
- ✅ 角色管理（权限配置）
- ✅ 组织管理（Tenant CRUD）
- ✅ 项目管理（Project CRUD）
- ✅ 成员分配

**后端API**:
```
# 用户管理
✅ GET  /api/v2/users                - 用户列表
✅ GET  /api/v2/users/current        - 当前用户
⚠️ POST /api/v2/users                - 创建用户（待实现）
⚠️ PUT  /api/v2/users/:id            - 更新用户（待实现）
⚠️ DELETE /api/v2/users/:id          - 删除用户（待实现）

# 角色管理
✅ GET  /api/v2/roles                - 角色列表
⚠️ POST /api/v2/roles                - 创建角色（待实现）
⚠️ PUT  /api/v2/roles/:id            - 更新角色（待实现）

# 组织管理
✅ GET    /api/v2/tenants              - 组织列表
✅ GET    /api/v2/tenants/:id          - 组织详情
✅ POST   /api/v2/tenants              - 创建组织
✅ PUT    /api/v2/tenants/:id          - 更新组织
✅ DELETE /api/v2/tenants/:id          - 删除组织
✅ POST   /api/v2/tenants/:id/suspend  - 暂停组织
✅ POST   /api/v2/tenants/:id/activate - 激活组织

# 项目管理
✅ GET    /api/v2/projects                - 项目列表
✅ GET    /api/v2/projects/:id            - 项目详情
✅ POST   /api/v2/projects                - 创建项目
✅ PUT    /api/v2/projects/:id            - 更新项目
✅ DELETE /api/v2/projects/:id            - 删除项目
✅ POST   /api/v2/projects/:id/archive    - 归档项目
✅ POST   /api/v2/projects/:id/activate   - 激活项目
```

**数据来源**:
- 现有 5 个组织（tenants）
- 现有 5 个项目（projects）
- 现有 3 个用户（users）
- 现有 3 个角色（roles）

**验证重点**:
1. ✅ 查看组织和项目结构
2. ⏳ 整理组织层级关系
3. ⏳ 分配用户到不同项目
4. ⏳ 配置角色权限
5. ⚠️ **用户 CUD 操作需后端实现**

---

### 8. **DatabaseManager（数据库管理）** 🗄️
**文件**: `components/DatabaseManager.tsx`
**权限**: `MANAGE_DATABASE`
**功能**:
- ✅ 数据库表查看
- ✅ 数据导入/导出
- ✅ 数据备份/恢复
- ✅ SQL 查询执行（只读）

**后端API**:
```
⚠️ （暂无专门的数据库管理API）
```

**状态**: ⚠️ **后端缺少数据库管理API**
**验证方式**: 使用 SQLite 客户端直接管理

---

### 9. **DocumentationHub（文档中心）** 📚
**文件**: `components/DocumentationHub.tsx`
**权限**: `VIEW_DOCS`
**功能**:
- ✅ API 文档查看
- ✅ 用户指南
- ✅ 变更日志
- ✅ 最佳实践

**后端API**:
```
⚠️ （静态文档，无需API）
```

**验证方式**: 查看文档是否完整和最新

---

## 🔐 权限系统

### 16个权限码
```typescript
const ALL_PERMISSIONS = [
  'VIEW_DASHBOARD',      // 查看仪表盘
  'VIEW_CASES',          // 查看测试用例
  'CREATE_CASE',         // 创建测试用例
  'EDIT_CASE',           // 编辑测试用例
  'DELETE_CASE',         // 删除测试用例
  'EXECUTE_TESTS',       // 执行测试
  'VIEW_RUNS',           // 查看测试运行
  'VIEW_SCRIPTS',        // 查看脚本
  'CREATE_SCRIPT',       // 创建脚本
  'EDIT_SCRIPT',         // 编辑脚本
  'DELETE_SCRIPT',       // 删除脚本
  'VIEW_SETTINGS',       // 查看设置
  'EDIT_SETTINGS',       // 编辑设置
  'MANAGE_USERS',        // 管理用户
  'MANAGE_ROLES',        // 管理角色
  'MANAGE_PROJECTS'      // 管理项目
];
```

### 3个角色
```typescript
1. Administrator (admin)
   - 所有16个权限 ✅

2. Editor (editor)
   - 测试用例管理权限
   - 脚本管理权限
   - 执行测试权限
   - 查看权限

3. Viewer (viewer)
   - 仅查看权限
   - VIEW_DASHBOARD, VIEW_CASES, VIEW_RUNS, VIEW_SCRIPTS, VIEW_DOCS
```

---

## 🎨 Sidebar 多租户选择器

### 三级选择器（已实现）
```
组织选择器 (Sidebar.tsx line 76-112)
  └─► 当前组织: 显示名称和图标
  └─► 下拉菜单: 所有组织列表
  └─► 选中标记: 蓝色背景 + √ 标记
  └─► 切换动作: setActiveOrgId()

项目选择器 (Sidebar.tsx line 114-152)
  └─► 当前项目: 显示名称和 KEY
  └─► 下拉菜单: 当前组织的项目
  └─► 过滤逻辑: projects.filter(p => p.orgId === activeOrgId)
  └─► 切换动作: setActiveProjectId()

环境选择器 (Sidebar.tsx line 154-187)
  └─► 当前环境: 显示名称和颜色点
  └─► 下拉菜单: 当前项目的环境
  └─► 过滤逻辑: envs.filter(e => e.projectId === activeProjectId)
  └─► 切换动作: setActiveEnvId()
```

### 数据隔离（App.tsx line 62-68）
```typescript
// 所有数据按 projectId 过滤
const activeProjectCases = cases.filter(c => c.projectId === activeProjectId);
const activeProjectFolders = folders.filter(f => f.projectId === activeProjectId);
const activeProjectRuns = runs.filter(r => r.projectId === activeProjectId);
const activeProjectScripts = scripts.filter(s => s.projectId === activeProjectId);
const activeProjectWorkflows = workflows.filter(w => w.projectId === activeProjectId);
const activeProjectEnvs = envs.filter(e => e.projectId === activeProjectId);
```

---

## 🧪 测试验证计划

### Phase 1: 基础验证（高优先级）⭐

#### 1.1 组织和项目结构整理
```bash
# 目标: 建立清晰的组织层级
1. ✅ 访问 AdminPortal
2. ✅ 查看现有5个组织
3. ⏳ 整理组织名称和描述
4. ✅ 查看现有5个项目
5. ⏳ 分配项目到正确的组织
6. ⏳ 删除重复或测试项目
7. ⏳ 创建标准项目结构

示例结构:
- 组织1: Engineering Department
  ├─ 项目1: API Testing
  └─ 项目2: UI Testing
- 组织2: QA Team
  ├─ 项目3: Smoke Tests
  └─ 项目4: Regression Tests
```

#### 1.2 测试用例整理
```bash
# 目标: 清理和分类15个测试用例
1. ✅ 访问 TestCaseManager
2. ✅ 查看所有15个测试用例
3. ⏳ 分析每个用例的目的和质量
4. ⏳ 删除重复/无效用例
5. ⏳ 为保留的用例添加详细描述
6. ⏳ 分配到正确的测试组（文件夹）
7. ⏳ 设置优先级和标签
8. ⏳ 关联环境和工作流

测试用例分类:
- API 测试 (HTTP type)
- 命令行测试 (Command type)
- 工作流测试 (Workflow type)
```

#### 1.3 工作流整理
```bash
# 目标: 验证和整理23个工作流
1. ✅ 访问 ScriptLab
2. ✅ 查看所有23个工作流
3. ⏳ 验证工作流定义格式
4. ⏳ 测试工作流执行
5. ⏳ 检查 WebSocket 实时日志
6. ⏳ 整理工作流命名和描述
7. ⏳ 删除测试/无效工作流

工作流类型:
- HTTP 请求工作流
- 命令执行工作流
- 复合工作流（多步骤）
```

#### 1.4 环境配置
```bash
# 目标: 配置6个环境的变量
1. ✅ 访问 SystemConfig
2. ✅ 查看6个环境
3. ⏳ 为每个环境配置变量
   - BASE_URL
   - API_KEY (标记为 secret)
   - TIMEOUT
   - DB_CONNECTION
4. ⏳ 激活正确的环境
5. ⏳ 测试环境切换功能
6. ⏳ 验证变量在测试执行中的使用
```

---

### Phase 2: 功能验证（中优先级）

#### 2.1 多租户切换验证
```bash
1. ⏳ Sidebar 切换组织
2. ⏳ 验证项目列表自动过滤
3. ⏳ 切换项目
4. ⏳ 验证测试用例列表更新
5. ⏳ 验证数据隔离（跨项目）
6. ⏳ 切换环境
7. ⏳ 验证环境变量更新
```

#### 2.2 测试执行验证
```bash
1. ⏳ 选择一个 HTTP 测试用例
2. ⏳ 点击 Run 执行
3. ⏳ 验证 TestRunner 正常显示
4. ⏳ 执行步骤模式测试
5. ⏳ 查看测试日志
6. ⏳ 验证执行结果保存

7. ⏳ 选择一个关联工作流的测试用例
8. ⏳ 点击 Run 执行
9. ⏳ 验证 WorkflowRunner 显示
10. ⏳ 观察 WebSocket "Live" 状态
11. ⏳ 观察实时日志流
12. ⏳ 验证步骤状态更新
13. ⏳ 检查最终执行结果
```

#### 2.3 工作流执行验证
```bash
1. ⏳ 在 ScriptLab 中选择工作流
2. ⏳ 点击执行
3. ⏳ 验证 WebSocket 连接
4. ⏳ 观察实时日志
5. ⏳ 检查步骤执行顺序
6. ⏳ 验证变量插值
7. ⏳ 查看执行历史
```

---

### Phase 3: 高级功能验证（低优先级）

#### 3.1 权限系统验证
```bash
1. ⏳ 以 Admin 登录，验证所有功能可访问
2. ⏳ 以 Editor 登录，验证部分功能受限
3. ⏳ 以 Viewer 登录，验证只读权限
4. ⏳ 尝试无权限操作，验证访问拒绝
```

#### 3.2 数据导入导出
```bash
1. ⏳ 导出测试用例（JSON）
2. ⏳ 修改后重新导入
3. ⏳ 验证数据完整性
```

#### 3.3 Dashboard 统计验证
```bash
1. ⏳ 打开 Dashboard
2. ⏳ 验证测试用例统计
3. ⏳ 验证执行历史图表
4. ⏳ 验证覆盖率数据
```

---

## ⚠️ 已知缺陷和限制

### 后端API缺失
1. **TestRun专门API**
   - 当前: 无专门的 `/api/runs` 端点
   - 影响: TestHistory 页面无法完整工作
   - 优先级: 中

2. **Script专门API**
   - 当前: 使用 Workflow API 替代
   - 影响: ActionLibrary 功能受限
   - 优先级: 低

3. **用户管理 CUD 操作**
   - 当前: 只有 List 和 Get Current
   - 缺失: Create, Update, Delete
   - 影响: AdminPortal 用户管理不完整
   - 优先级: 中

4. **数据库管理API**
   - 当前: 完全缺失
   - 影响: DatabaseManager 无法工作
   - 优先级: 低

### 前端已知问题
1. **客户端过滤**
   - 项目和环境按 ID 客户端过滤
   - 大量数据时可能影响性能
   - 优先级: 中（性能优化）

2. **环境颜色硬编码**
   - 基于 isActive 状态，不是从后端返回
   - 无法自定义颜色
   - 优先级: 低

3. **密钥检测基于关键词**
   - 可能误判或漏判
   - 优先级: 中（安全相关）

---

## 📋 数据整理检查清单

### 组织/项目（AdminPortal）
- [ ] 删除重复组织
- [ ] 规范组织命名
- [ ] 整理项目归属
- [ ] 删除测试项目
- [ ] 创建标准项目结构
- [ ] 分配成员到项目

### 测试用例（TestCaseManager）
- [ ] 审查所有15个用例
- [ ] 删除无效/重复用例
- [ ] 补充用例描述
- [ ] 设置优先级
- [ ] 分配到测试组
- [ ] 关联工作流
- [ ] 关联环境

### 工作流（ScriptLab）
- [ ] 审查所有23个工作流
- [ ] 验证工作流定义
- [ ] 测试工作流执行
- [ ] 整理工作流命名
- [ ] 删除无效工作流
- [ ] 分类整理

### 环境（SystemConfig）
- [ ] 配置环境变量
- [ ] 设置密钥变量
- [ ] 激活正确环境
- [ ] 删除无用环境
- [ ] 验证变量使用

### 测试组（TestCaseManager）
- [ ] 整理文件夹结构
- [ ] 规范命名
- [ ] 删除空文件夹
- [ ] 建立层级关系

---

## 🚀 启动验证

### 1. 确保服务运行
```bash
# Terminal 1: 后端
cd /Users/liujinliang/workspace/ai/testplatform/nextest-platform
./test-service

# Terminal 2: 前端
cd /Users/liujinliang/workspace/ai/testplatform/NextTestPlatformUI
npm run dev

# 访问
open http://localhost:5173
```

### 2. 登录系统
- 用户: Admin User (admin@company.com)
- 权限: 所有16个权限
- 默认自动加载

### 3. 开始验证
按照测试验证计划顺序执行：
1. Phase 1: 基础验证（组织、项目、测试用例、工作流、环境）
2. Phase 2: 功能验证（多租户、测试执行、工作流执行）
3. Phase 3: 高级功能（权限、导入导出、Dashboard）

---

## 📝 总结

### 前端页面（9个）
✅ Dashboard - 仪表盘
✅ TestCaseManager - 测试用例管理
✅ TestHistory - 测试历史
✅ ScriptLab - 脚本实验室
✅ ActionLibrary - 动作库
✅ SystemConfig - 系统配置
✅ AdminPortal - 管理门户
⚠️ DatabaseManager - 数据库管理（缺API）
✅ DocumentationHub - 文档中心

### 后端API覆盖率
- ✅ **完全支持**: TestCase, Workflow, Environment, Tenant, Project
- ⚠️ **部分支持**: User/Role (缺 CUD 操作)
- ❌ **缺失**: TestRun, Script, Database 专门API

### 数据现状
- 测试用例: 15 条（需整理）
- 测试组: 18 条（需整理）
- 工作流: 23 条（需验证）
- 环境: 6 条（需配置变量）
- 组织: 5 条（需规范）
- 项目: 5 条（需分配）

### 下一步行动
1. ⏳ 启动服务验证基础功能
2. ⏳ 使用 AdminPortal 整理组织和项目
3. ⏳ 使用 TestCaseManager 整理测试用例
4. ⏳ 使用 ScriptLab 验证工作流执行
5. ⏳ 使用 SystemConfig 配置环境变量
6. ⏳ 测试多租户切换和数据隔离

---

**创建时间**: 2025-11-23
**状态**: ✅ 活跃
**用途**: 系统化验证前后端集成，整理测试数据
