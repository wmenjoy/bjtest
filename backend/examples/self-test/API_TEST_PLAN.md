# 平台自测试用例库 - API完整覆盖

## 模块1: Test Groups API (分组管理)

### 端点列表
- POST /api/v2/groups - 创建测试分组
- GET /api/v2/groups/:id - 获取分组详情
- GET /api/v2/groups/tree - 获取分组树
- PUT /api/v2/groups/:id - 更新测试分组
- DELETE /api/v2/groups/:id - 删除测试分组
- POST /api/v2/groups/:id/execute - 执行分组内所有测试

## 模块2: Test Cases API (测试用例管理)

### 端点列表
- POST /api/v2/tests - 创建测试用例
- GET /api/v2/tests/:id - 获取测试用例详情
- GET /api/v2/tests - 列出测试用例(分页)
- GET /api/v2/tests/search - 搜索测试用例
- GET /api/v2/tests/stats - 获取测试统计
- GET /api/v2/test-tree - 获取测试树
- PUT /api/v2/tests/:id - 更新测试用例
- DELETE /api/v2/tests/:id - 删除测试用例
- POST /api/v2/tests/:id/execute - 执行测试
- GET /api/v2/results/:id - 获取测试结果
- GET /api/v2/tests/:id/history - 获取测试历史
- GET /api/v2/runs/:id - 获取测试运行详情
- GET /api/v2/runs - 列出测试运行

## 模块3: Workflows API (工作流管理)

### 端点列表
- POST /api/v2/workflows - 创建工作流
- GET /api/v2/workflows/:id - 获取工作流详情
- GET /api/v2/workflows - 列出工作流(分页)
- PUT /api/v2/workflows/:id - 更新工作流
- DELETE /api/v2/workflows/:id - 删除工作流
- POST /api/v2/workflows/:id/execute - 执行工作流
- GET /api/v2/workflows/:id/runs - 获取工作流运行列表
- GET /api/v2/workflows/runs/:runId - 获取运行详情
- GET /api/v2/workflows/runs/:runId/steps - 获取步骤执行记录
- GET /api/v2/workflows/runs/:runId/logs - 获取步骤日志
- GET /api/v2/workflows/:id/test-cases - 获取关联的测试用例

## 模块4: Environments API (环境管理)

### 端点列表
- POST /api/v2/environments - 创建环境
- GET /api/v2/environments - 列出所有环境
- GET /api/v2/environments/active - 获取当前激活环境
- GET /api/v2/environments/:id - 获取环境详情
- PUT /api/v2/environments/:id - 更新环境
- DELETE /api/v2/environments/:id - 删除环境
- POST /api/v2/environments/:id/activate - 激活环境
- GET /api/v2/environments/:id/variables - 获取环境变量列表
- GET /api/v2/environments/:id/variables/:key - 获取特定变量
- PUT /api/v2/environments/:id/variables/:key - 设置环境变量
- DELETE /api/v2/environments/:id/variables/:key - 删除环境变量

## 测试策略

### 每个API端点测试包含:
1. **HTTP请求测试** - 验证API可访问性和响应格式
2. **数据库验证** - 使用Database Action验证数据持久化
3. **断言验证** - 使用Assert Action验证响应数据正确性
4. **脚本处理** - 使用Script Action处理和验证复杂数据

### 测试覆盖:
- ✅ 正常流程测试 (Happy Path)
- ✅ 错误处理测试 (Error Cases)
- ✅ 边界条件测试 (Edge Cases)
- ✅ 数据完整性验证
- ✅ 级联操作测试 (如删除时的级联)
- ✅ 并发操作测试
