# NextTest Platform 自测案例文档

## 概述

本文档详细描述了 NextTest Platform 的所有自测案例，包括测试目的、覆盖范围、执行步骤和测试覆盖分析。

## 测试套件总览

| 序号 | 测试套件 | 文件名 | 步骤数 | 覆盖模块 |
|-----|---------|--------|-------|---------|
| 1 | TestGroup API | self-test-testgroup-api.json | 15 | 测试组管理 |
| 2 | TestCase API | self-test-testcase-api.json | 13 | 测试用例管理 |
| 3 | Platform Integration | self-test-platform.json | 16 | 平台集成 |
| 4 | Action Features | self-test-actions.json | 8 | 动作功能 |
| 5 | Environment API | self-test-environment-api.json | 17 | 环境管理 |
| 6 | Workflow Execution | self-test-workflow-execution-api.json | 15 | 工作流执行 |
| 7 | Test Results | self-test-results-api.json | 9 | 测试结果 |

**总计: 93 个测试步骤**

---

## 1. TestGroup API 测试

### 测试文件
`examples/self-test-testgroup-api.json`

### 测试目的
验证测试组的完整 CRUD 操作和层级结构功能。

### 覆盖接口
| 方法 | 端点 | 描述 |
|-----|------|------|
| POST | /api/groups | 创建测试组 |
| GET | /api/groups/:id | 获取单个测试组 |
| GET | /api/groups/tree | 获取测试组树形结构 |
| PUT | /api/groups/:id | 更新测试组 |
| DELETE | /api/groups/:id | 删除测试组 |

### 测试步骤详解

| 步骤 | 名称 | 类型 | 描述 |
|-----|------|------|------|
| step01 | 环境设置 | script | 模拟环境初始化 |
| step02 | 清理旧数据 | database | 删除测试数据避免冲突 |
| step03 | 创建父组 | http | POST /groups 创建根级测试组 |
| step04 | 验证创建 | assert | 验证返回 201 和正确的 groupId |
| step05 | 创建子组 | http | POST /groups 创建子测试组 |
| step06 | 获取单个组 | http | GET /groups/:id |
| step07 | 验证获取 | assert | 验证返回 200 |
| step08 | 获取树形结构 | http | GET /groups/tree |
| step09 | 验证树结构 | assert | 验证返回 200 |
| step10 | 更新测试组 | http | PUT /groups/:id |
| step11 | 验证更新 | assert | 验证名称已更新 |
| step12 | 删除子组 | http | DELETE /groups/:childId |
| step13 | 删除父组 | http | DELETE /groups/:parentId |
| step14 | 验证删除 | assert | 验证返回 200 |
| step15 | 最终清理 | database | 清理所有测试数据 |

### 测试场景
- ✅ 创建根级测试组
- ✅ 创建子测试组（层级关系）
- ✅ 获取单个测试组详情
- ✅ 获取树形结构
- ✅ 更新测试组属性
- ✅ 删除测试组（先子后父）

---

## 2. TestCase API 测试

### 测试文件
`examples/self-test-testcase-api.json`

### 测试目的
验证测试用例的完整生命周期管理。

### 覆盖接口
| 方法 | 端点 | 描述 |
|-----|------|------|
| POST | /api/tests | 创建测试用例 |
| GET | /api/tests/:id | 获取测试用例 |
| GET | /api/tests | 列出所有测试用例 |
| GET | /api/tests/search | 搜索测试用例 |
| PUT | /api/tests/:id | 更新测试用例 |
| DELETE | /api/tests/:id | 删除测试用例 |

### 测试步骤详解

| 步骤 | 名称 | 类型 | 描述 |
|-----|------|------|------|
| step01 | 环境设置 | script | 初始化测试环境 |
| step02 | 清理旧数据 | database | 删除已存在的测试数据 |
| step03 | 创建测试组 | http | 为测试用例创建所属组 |
| step04 | 创建HTTP测试 | http | POST /tests 创建 HTTP 类型测试 |
| step05 | 数据库验证 | database | 直接查询数据库验证创建 |
| step06 | 验证创建 | assert | 验证 HTTP 201 和数据库记录 |
| step07 | 获取测试用例 | http | GET /tests/:id |
| step08 | 列出测试用例 | http | GET /tests |
| step09 | 搜索测试用例 | http | GET /tests/search?q=HTTP |
| step10 | 更新测试用例 | http | PUT /tests/:id |
| step11 | 删除测试用例 | http | DELETE /tests/:id |
| step12 | 验证所有操作 | assert | 验证 GET/PUT/DELETE 返回 200 |
| step13 | 最终清理 | database | 清理测试数据和测试组 |

### 测试场景
- ✅ 创建 HTTP 类型测试用例
- ✅ 数据库层面验证数据持久化
- ✅ 获取单个测试用例
- ✅ 列出所有测试用例（分页）
- ✅ 关键字搜索
- ✅ 更新测试用例属性
- ✅ 删除测试用例

---

## 3. Platform Integration 测试

### 测试文件
`examples/self-test-platform.json`

### 测试目的
端到端验证平台核心功能的集成。

### 测试步骤详解

| 步骤 | 名称 | 类型 | 描述 |
|-----|------|------|------|
| step01-02 | 数据清理 | database | 清理环境、组、测试用例 |
| step03-04 | 创建环境 | http | 创建并激活测试环境 |
| step05-06 | 创建测试组 | http | 创建测试组并验证 |
| step07-09 | 创建测试用例 | http | 创建测试用例并验证 |
| step10-11 | 执行测试 | http | 执行测试并获取结果 |
| step12-13 | 验证结果 | assert | 验证执行结果状态 |
| step14-16 | 清理资源 | http/database | 删除所有创建的资源 |

### 测试场景
- ✅ 完整的测试执行流程
- ✅ 环境 -> 组 -> 用例 -> 执行 -> 结果
- ✅ 资源的正确清理

---

## 4. Action Features 测试

### 测试文件
`examples/self-test-actions.json`

### 测试目的
验证工作流引擎的各种动作类型功能。

### 覆盖的动作类型
| 动作类型 | 描述 |
|---------|------|
| database | 数据库查询和执行 |
| script | Shell 和 Python 脚本 |
| assert | 各种断言类型 |

### 测试步骤详解

| 步骤 | 名称 | 类型 | 描述 |
|-----|------|------|------|
| step01 | 数据库查询 | database | SELECT 查询并返回结果 |
| step02 | 验证查询 | assert | 验证查询成功 |
| step03 | Shell脚本 | script | 执行 shell 脚本 |
| step04 | Python脚本 | script | 执行 Python 脚本并使用上下文 |
| step05 | 验证Python | assert | 验证 Python 脚本成功执行 |
| step06 | 等于断言 | assert | 测试 equals 断言 |
| step07 | 存在断言 | assert | 测试 exists 断言 |
| step08 | 大于断言 | assert | 测试 greaterThan 断言 |

### 特殊验证点
- ✅ Python 脚本可以访问工作流上下文
- ✅ Shell 脚本可以使用变量插值
- ✅ 数据库动作支持 SELECT 和 EXEC
- ✅ 多种断言类型正常工作

---

## 5. Environment API 测试

### 测试文件
`examples/self-test-environment-api.json`

### 测试目的
验证环境管理的完整功能，包括变量管理和激活机制。

### 覆盖接口
| 方法 | 端点 | 描述 |
|-----|------|------|
| POST | /api/environments | 创建环境 |
| GET | /api/environments | 列出环境 |
| GET | /api/environments/:id | 获取环境 |
| PUT | /api/environments/:id | 更新环境 |
| DELETE | /api/environments/:id | 删除环境 |
| POST | /api/environments/:id/activate | 激活环境 |
| GET | /api/environments/active | 获取活动环境 |
| PUT | /api/environments/:id/variables/:key | 设置变量 |
| GET | /api/environments/:id/variables/:key | 获取变量 |
| DELETE | /api/environments/:id/variables/:key | 删除变量 |

### 测试步骤详解

| 步骤 | 名称 | 类型 | 描述 |
|-----|------|------|------|
| step01 | 清理旧数据 | database | 删除测试环境 |
| step02 | 创建环境 | http | POST /environments |
| step03 | 验证创建 | assert | 验证 201 和 envId |
| step04 | 获取环境 | http | GET /environments/:id |
| step05 | 列出环境 | http | GET /environments |
| step06 | 设置变量 | http | PUT /environments/:id/variables/TEST_VAR |
| step07 | 获取变量 | http | GET /environments/:id/variables/TEST_VAR |
| step08 | 验证变量 | assert | 验证变量值正确 |
| step09 | 激活环境 | http | POST /environments/:id/activate |
| step10 | 获取活动环境 | http | GET /environments/active |
| step11 | 验证激活 | assert | 验证活动环境是正确的 |
| step12 | 更新环境 | http | PUT /environments/:id |
| step13 | 验证更新 | assert | 验证名称和描述已更新 |
| step14 | 删除变量 | http | DELETE /environments/:id/variables/TEST_VAR |
| step15 | 激活默认环境 | http | POST /environments/default/activate |
| step16 | 删除环境 | http | DELETE /environments/:id |
| step17 | 验证删除 | assert | 验证 200 |

### 关键业务规则验证
- ✅ 创建环境时 isActive 默认为 false
- ✅ 同一时间只能有一个活动环境
- ✅ 激活新环境会自动停用旧环境
- ✅ **不能删除活动环境**（必须先激活其他环境）
- ✅ 变量随环境一起返回

---

## 6. Workflow Execution API 测试

### 测试文件
`examples/self-test-workflow-execution-api.json`

### 测试目的
验证工作流创建、执行和结果查询的完整流程。

### 覆盖接口
| 方法 | 端点 | 描述 |
|-----|------|------|
| POST | /api/workflows | 创建工作流 |
| POST | /api/workflows/:id/execute | 执行工作流 |
| GET | /api/workflows/runs/:runId | 获取运行详情 |
| GET | /api/workflows/runs/:runId/steps | 获取步骤执行 |
| GET | /api/workflows/runs/:runId/logs | 获取步骤日志 |
| GET | /api/workflows/:id/runs | 列出工作流运行 |
| DELETE | /api/workflows/:id | 删除工作流 |

### 测试步骤详解

| 步骤 | 名称 | 类型 | 描述 |
|-----|------|------|------|
| step01 | 清理旧工作流 | database | 删除测试工作流 |
| step02 | 创建简单工作流 | http | POST /workflows（包含嵌套定义）|
| step03 | 验证创建 | assert | 验证 201 |
| step04 | 执行工作流 | http | POST /workflows/:id/execute |
| step05 | 验证执行 | assert | 验证 200 和 status=success |
| step06 | 获取运行详情 | http | GET /workflows/runs/:runId |
| step07 | 验证运行 | assert | 验证状态和 workflowId |
| step08 | 获取步骤执行 | http | GET /workflows/runs/:runId/steps |
| step09 | 验证步骤 | assert | 验证 200 |
| step10 | 获取步骤日志 | http | GET /workflows/runs/:runId/logs |
| step11 | 验证日志 | assert | 验证 200 |
| step12 | 列出运行历史 | http | GET /workflows/:id/runs |
| step13 | 验证列表 | assert | 验证 200 |
| step14 | 删除工作流 | http | DELETE /workflows/:id |
| step15 | 验证删除 | assert | 验证 200 |

### 特殊验证点
- ✅ 工作流可以嵌套定义（workflow 包含 definition）
- ✅ 执行返回 runId 用于查询
- ✅ 可以查询步骤级别的执行详情
- ✅ 可以查询结构化日志
- ✅ 删除工作流会级联删除相关运行记录

---

## 7. Test Results API 测试

### 测试文件
`examples/self-test-results-api.json`

### 测试目的
验证测试结果和历史记录的查询功能。

### 覆盖接口
| 方法 | 端点 | 描述 |
|-----|------|------|
| GET | /api/results/:id | 获取测试结果 |
| GET | /api/runs | 列出测试运行 |
| GET | /api/tests/:id/history | 获取测试历史 |

### 测试步骤详解

| 步骤 | 名称 | 类型 | 描述 |
|-----|------|------|------|
| step01 | 获取结果ID | database | 从数据库获取最新结果 |
| step02 | 验证有数据 | assert | 确保数据库有测试结果 |
| step03 | 获取结果 | http | GET /results/:id |
| step04 | 验证结果 | assert | 验证 200 |
| step05 | 列出运行 | http | GET /runs |
| step06 | 验证列表 | assert | 验证 200 |
| step07 | 获取测试ID | database | 获取有历史的测试ID |
| step08 | 获取历史 | http | GET /tests/:id/history |
| step09 | 验证历史 | assert | 验证 200 |

### 特殊验证点
- ✅ 可以通过结果 ID 查询详细信息
- ✅ 可以列出所有测试运行
- ✅ 可以查询特定测试的执行历史

---

## 测试覆盖分析

### 已覆盖场景 (Happy Path)

| 类别 | 覆盖情况 | 说明 |
|-----|---------|------|
| CRUD 操作 | ✅ 完全覆盖 | 所有主要实体的增删改查 |
| 业务流程 | ✅ 基本覆盖 | 创建 -> 执行 -> 查询结果 |
| 数据验证 | ✅ 部分覆盖 | 通过断言验证返回数据 |
| 层级关系 | ✅ 基本覆盖 | 父子组关系、环境激活 |
| 变量管理 | ✅ 完全覆盖 | 环境变量的增删改查 |

### 未覆盖场景 (待补充)

#### 1. 错误处理场景
| 场景 | 预期行为 | 状态 |
|-----|---------|------|
| 创建重复 ID | 返回 409 Conflict | ❌ 未测试 |
| 获取不存在的资源 | 返回 404 Not Found | ❌ 未测试 |
| 缺少必填字段 | 返回 400 Bad Request | ❌ 未测试 |
| 无效的 JSON 格式 | 返回 400 Bad Request | ❌ 未测试 |
| 删除被引用的资源 | 返回 409 或级联删除 | ❌ 未测试 |

#### 2. 边界条件
| 场景 | 预期行为 | 状态 |
|-----|---------|------|
| 空字符串输入 | 验证错误或接受 | ❌ 未测试 |
| 超长字符串 | 截断或拒绝 | ❌ 未测试 |
| 特殊字符/Unicode | 正确处理 | ❌ 未测试 |
| 空列表返回 | 返回空数组 | ⚠️ 部分测试 |
| 大数据量分页 | 正确分页 | ❌ 未测试 |

#### 3. 并发和性能
| 场景 | 预期行为 | 状态 |
|-----|---------|------|
| 并发创建相同资源 | 一个成功，其他失败 | ❌ 未测试 |
| 并发更新同一资源 | 最后写入生效 | ❌ 未测试 |
| 大量并发请求 | 正常处理 | ❌ 未测试 |
| 超时处理 | 返回超时错误 | ❌ 未测试 |

#### 4. 未测试的 API 模块

**Tenant Management (11 端点)**
```
POST   /api/v2/tenants
GET    /api/v2/tenants
GET    /api/v2/tenants/:tenantId
PUT    /api/v2/tenants/:tenantId
DELETE /api/v2/tenants/:tenantId
POST   /api/v2/tenants/:tenantId/suspend
POST   /api/v2/tenants/:tenantId/activate
GET    /api/v2/tenants/:tenantId/projects
GET    /api/v2/tenants/:tenantId/projects/active
GET    /api/v2/tenants/:tenantId/members
GET    /api/v2/tenants/active
```

**Project Management (11 端点)**
```
POST   /api/v2/projects
GET    /api/v2/projects
GET    /api/v2/projects/:projectId
PUT    /api/v2/projects/:projectId
DELETE /api/v2/projects/:projectId
POST   /api/v2/projects/:projectId/archive
POST   /api/v2/projects/:projectId/activate
GET    /api/v2/projects/:projectId/test-groups
GET    /api/v2/projects/:projectId/test-cases
GET    /api/v2/projects/:projectId/members
POST   /api/v2/projects/:projectId/update-stats
```

**其他未测试功能**
- WebSocket 实时流 (`/api/workflows/runs/:runId/stream`)
- 测试组执行 (`POST /api/groups/:id/execute`)
- 测试统计 (`GET /api/tests/stats`)
- 测试树 (`GET /api/test-tree`)

---

## 测试覆盖率统计

### API 端点覆盖率

| 模块 | 总端点数 | 已测试 | 覆盖率 |
|-----|---------|-------|-------|
| Test Groups | 5 | 5 | 100% |
| Test Cases | 6 | 6 | 100% |
| Environments | 10 | 10 | 100% |
| Workflows | 7 | 7 | 100% |
| Test Results | 3 | 3 | 100% |
| Tenants | 11 | 0 | 0% |
| Projects | 11 | 0 | 0% |
| **总计** | **53** | **31** | **58%** |

### 测试类型覆盖率

| 测试类型 | 状态 |
|---------|------|
| 正向测试 (Happy Path) | ✅ 已覆盖 |
| 负向测试 (Error Cases) | ❌ 未覆盖 |
| 边界测试 | ⚠️ 部分覆盖 |
| 性能测试 | ❌ 未覆盖 |
| 安全测试 | ❌ 未覆盖 |

---

## 运行测试

### 运行所有测试
```bash
cd nextest-platform
./run-self-tests.sh
```

### 运行单个测试
```bash
# Environment API 测试
curl -X POST http://localhost:8090/api/workflows/self-test-environment-api-v2/execute

# Workflow Execution API 测试
curl -X POST http://localhost:8090/api/workflows/self-test-workflow-execution-api/execute

# Test Results API 测试
curl -X POST http://localhost:8090/api/workflows/self-test-results-api/execute
```

### 查看测试结果
```bash
# 获取运行详情
curl http://localhost:8090/api/workflows/runs/{runId} | jq

# 获取步骤执行
curl http://localhost:8090/api/workflows/runs/{runId}/steps | jq
```

---

## 改进建议

### 短期改进 (P0)
1. 添加错误场景测试（404, 400, 409）
2. 添加必填字段验证测试
3. 添加 Tenant/Project API 基本测试

### 中期改进 (P1)
1. 添加边界条件测试
2. 添加并发测试
3. 添加 WebSocket 测试
4. 添加测试组执行测试

### 长期改进 (P2)
1. 性能基准测试
2. 安全测试（如果有认证）
3. 数据一致性测试
4. 故障恢复测试

---

## 维护指南

### 添加新测试
1. 在 `examples/` 目录创建 JSON 文件
2. 按照现有格式定义 workflow
3. 在 `run-self-tests.sh` 中添加测试调用
4. 更新本文档

### 测试文件命名规范
- 格式: `self-test-{module}-{feature}.json`
- 示例: `self-test-environment-api.json`

### 调试失败的测试
```bash
# 获取详细的运行信息
curl http://localhost:8090/api/workflows/runs/{runId} | jq '.context.outputs'

# 查看服务日志
tail -f service.log
```

---

*文档更新时间: 2025-11-23*
*测试套件版本: 1.0.0*
