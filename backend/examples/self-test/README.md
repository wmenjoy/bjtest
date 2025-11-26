# 平台自测试套件

完整的自测试用例库，用于测试平台自身的所有API接口和功能。

## 📋 测试套件概览

> **📢 重要更新 (v2.0.0):**
> - 所有测试套件已升级为完整的多租户支持
> - 每个测试创建独立的租户和项目
> - 所有API请求包含 X-Tenant-ID 和 X-Project-ID 头
> - 所有数据库查询按tenant_id过滤
> - 测试结束后自动清理租户数据

### 1. TestGroup API 测试套件 (`01-testgroup-api-tests.json`)
**版本:** 2.0.0 ✨
**覆盖的API端点:**
- ✅ POST /api/v2/groups - 创建测试分组
- ✅ GET /api/v2/groups/:id - 获取分组详情
- ✅ GET /api/v2/groups/tree - 获取分组树
- ✅ PUT /api/v2/groups/:id - 更新测试分组
- ✅ DELETE /api/v2/groups/:id - 删除测试分组

**测试场景:**
- 🔑 创建测试租户和项目 (多租户)
- 创建父分组和子分组
- 验证层级结构
- 更新分组信息
- 软删除验证
- 数据库持久化验证
- 🔒 验证租户数据隔离

**测试步骤:** 28个步骤 (+10步多租户基础设施)
**断言数量:** 18+
**数据库验证:** 6次
**多租户支持:** ✅

### 2. TestCase API 测试套件 (`02-testcase-api-tests.json`)
**版本:** 2.0.0 ✨
**覆盖的API端点:**
- ✅ POST /api/v2/tests - 创建测试用例
- ✅ GET /api/v2/tests/:id - 获取测试用例详情
- ✅ GET /api/v2/tests - 列出测试用例
- ✅ GET /api/v2/tests/search - 搜索测试用例
- ✅ GET /api/v2/tests/stats - 获取测试统计
- ✅ PUT /api/v2/tests/:id - 更新测试用例
- ✅ DELETE /api/v2/tests/:id - 删除测试用例
- ✅ POST /api/v2/tests/:id/execute - 执行测试
- ✅ GET /api/v2/results/:id - 获取测试结果
- ✅ GET /api/v2/tests/:id/history - 获取测试历史

**测试场景:**
- 🔑 创建测试租户和项目 (多租户)
- 创建HTTP和Command类型测试用例
- 执行测试并验证结果
- 获取测试历史记录
- 列表和搜索功能
- 统计数据获取
- 数据库持久化验证
- 🔒 验证租户数据隔离

**测试步骤:** 42个步骤 (+10步多租户基础设施)
**断言数量:** 20+
**数据库验证:** 6次
**测试类型:** HTTP, Command
**多租户支持:** ✅

### 3. Workflow API 测试套件 (`03-workflow-api-tests.json`)
**版本:** 2.0.0 ✨
**覆盖的API端点:**
- ✅ POST /api/v2/workflows - 创建工作流
- ✅ GET /api/v2/workflows/:id - 获取工作流详情
- ✅ GET /api/v2/workflows - 列出工作流
- ✅ PUT /api/v2/workflows/:id - 更新工作流
- ✅ DELETE /api/v2/workflows/:id - 删除工作流
- ✅ POST /api/v2/workflows/:id/execute - 执行工作流
- ✅ GET /api/v2/workflows/runs/:runId - 获取运行详情
- ✅ GET /api/v2/workflows/runs/:runId/steps - 获取步骤执行记录
- ✅ GET /api/v2/workflows/runs/:runId/logs - 获取步骤日志
- ✅ GET /api/v2/workflows/:id/runs - 获取工作流运行列表

**测试场景:**
- 🔑 创建测试租户和项目 (多租户)
- 创建包含Script和Assert步骤的工作流
- 执行工作流并验证结果
- 获取步骤执行记录和日志
- 验证工作流运行历史
- 数据库持久化验证
- 🔒 验证租户数据隔离

**测试步骤:** 36个步骤 (+10步多租户基础设施)
**断言数量:** 15+
**数据库验证:** 5次
**功能验证:** 工作流执行引擎
**多租户支持:** ✅

### 4. Environment API 测试套件 (`04-environment-api-tests.json`)
**版本:** 2.0.0 ✨
**覆盖的API端点:**
- ✅ POST /api/v2/environments - 创建环境
- ✅ GET /api/v2/environments - 列出所有环境
- ✅ GET /api/v2/environments/active - 获取当前激活环境
- ✅ GET /api/v2/environments/:id - 获取环境详情
- ✅ PUT /api/v2/environments/:id - 更新环境
- ✅ DELETE /api/v2/environments/:id - 删除环境
- ✅ POST /api/v2/environments/:id/activate - 激活环境
- ✅ GET /api/v2/environments/:id/variables - 获取环境变量列表
- ✅ GET /api/v2/environments/:id/variables/:key - 获取特定变量
- ✅ PUT /api/v2/environments/:id/variables/:key - 设置环境变量
- ✅ DELETE /api/v2/environments/:id/variables/:key - 删除环境变量

**测试场景:**
- 🔑 创建测试租户和项目 (多租户)
- 创建多个环境（Dev, Test）
- 环境激活切换
- 环境变量CRUD操作
- 数据库持久化验证
- 🔒 验证租户数据隔离

**测试步骤:** 39个步骤 (+10步多租户基础设施)
**断言数量:** 18+
**数据库验证:** 6次
**功能验证:** 环境管理和变量操作
**多租户支持:** ✅

### 5. 多租户隔离测试套件 (`05-multi-tenant-tests.json`)
**版本:** 1.0.0
**测试目的:** 验证多租户数据隔离和跨租户访问控制

**测试场景:**
- 🔑 创建两个独立的租户和项目
- 为每个租户创建测试分组
- 为每个租户创建环境
- 🔍 验证数据库中的租户隔离
- 🚫 测试跨租户访问拒绝 (应返回404)
- 验证每个租户的激活环境
- 验证环境变量隔离

**测试步骤:** 23个步骤
**测试租户数:** 2
**隔离验证:** ✅
**跨租户访问阻止:** ✅

### 6. 端到端综合集成测试 (`06-end-to-end-integration-test.json`) 🆕
**版本:** 2.0.0
**测试目的:** 演示平台完整能力的综合端到端场景

**完整测试场景:**
1. 🔑 创建租户和项目
2. 🌍 创建开发环境
3. 📁 创建父子测试分组（层级结构）
4. 🧪 创建并执行HTTP测试用例
5. ⚙️ 创建包含4步骤的工作流:
   - 从JSONPlaceholder API获取用户数据
   - 验证用户数据
   - 获取用户的帖子
   - 验证帖子数量
6. ▶️ 执行工作流
7. ✅ 验证所有工作流步骤执行完成
8. 🔒 验证跨表的租户数据隔离
9. 🌳 验证分组树结构
10. 🔄 创建并激活测试环境
11. 🧹 清理所有测试数据

**测试步骤:** 30个步骤
**API调用:** 18次
**数据库验证:** 2次
**测试组件:** 租户、项目、环境、分组、测试用例、工作流
**工作流步骤:** 4个
**创建环境数:** 2个
**多租户支持:** ✅

## 🚀 快速开始

### 前置条件
1. 服务已编译：`make build`
2. 数据库已初始化：`make init`

### 运行所有测试

```bash
# 1. 启动服务
make run

# 2. 在新终端运行测试套件
./run-self-tests.sh
```

### 运行单个测试套件

```bash
# 方法1: 使用工作流API
curl -X POST http://localhost:8090/api/v2/workflows \
  -H "Content-Type: application/json" \
  -d @examples/self-test/01-testgroup-api-tests.json

# 方法2: 通过导入工具
./bin/import -f examples/self-test/01-testgroup-api-tests.json
```

## 📊 测试覆盖统计

### API端点覆盖
- **TestGroup API:** 5/5 端点 (100%)
- **TestCase API:** 10/10 端点 (100%)
- **Workflow API:** 10/10 端点 (100%)
- **Environment API:** 11/11 端点 (100%)
- **Tenant API:** 测试中隐式验证
- **Project API:** 测试中隐式验证
- **总计:** 40+ 端点 (100%)

### 多租户测试覆盖 🆕
- **多租户基础设施:** 6/6 测试套件 (100%)
- **租户隔离验证:** ✅ 所有测试
- **跨租户访问拒绝:** ✅ 专门测试
- **租户级数据清理:** ✅ 所有测试
- **多租户API头部:** ✅ 100% 覆盖

### 测试类型覆盖
- ✅ HTTP请求测试
- ✅ 数据库验证测试
- ✅ 断言验证测试
- ✅ Python脚本测试
- ✅ Shell脚本测试
- ✅ 工作流执行测试
- ✅ 多租户隔离测试 🆕
- ✅ 端到端集成测试 🆕

### Action覆盖
- ✅ HTTP Action
- ✅ Database Action (SQLite)
- ✅ Script Action (Python/Shell)
- ✅ Assert Action (多种断言类型)

### 测试数量统计
| 测试套件 | 版本 | 步骤数 | API调用 | 数据库验证 | 多租户 |
|---------|------|--------|---------|------------|--------|
| TestGroup API | 2.0.0 | 28 | 8 | 6 | ✅ |
| TestCase API | 2.0.0 | 42 | 15 | 6 | ✅ |
| Workflow API | 2.0.0 | 36 | 11 | 5 | ✅ |
| Environment API | 2.0.0 | 39 | 16 | 6 | ✅ |
| Multi-Tenant Tests | 1.0.0 | 23 | 10 | 3 | ✅ |
| E2E Integration | 2.0.0 | 30 | 18 | 2 | ✅ |
| **总计** | - | **198** | **78** | **28** | **100%** |

## 🔐 多租户架构测试

### 多租户支持模式

所有v2.0.0测试文件遵循统一的多租户模式:

**1. ID生成** (时间戳 + 随机后缀)
```python
ts = datetime.datetime.now().strftime('%Y%m%d%H%M%S')
rand_suffix = random.randint(1000, 9999)
tenant_id = f'tenant-{prefix}-{ts}'
project_id = f'project-{prefix}-{ts}'
```

**2. 租户设置**
- 通过数据库INSERT创建租户
- 通过数据库INSERT创建项目
- 项目关联到租户

**3. HTTP请求头**
所有API请求包含:
```json
{
  "X-Tenant-ID": "{{tenant_id}}",
  "X-Project-ID": "{{project_id}}"
}
```

**4. 数据库查询过滤**
所有SELECT查询按tenant_id过滤:
```sql
SELECT * FROM table WHERE id = ? AND tenant_id = ? AND deleted_at IS NULL
```

**5. 数据清理顺序**
1. 子实体 (workflow_runs, test_results, test_cases, 等)
2. 父实体 (workflows, test_groups, environments)
3. Projects
4. Tenants

### 多租户测试验证点

✅ **数据隔离**: 每个租户只能访问自己的数据
✅ **跨租户访问拒绝**: 租户A无法访问租户B的资源
✅ **独立环境**: 每个租户有独立的环境配置
✅ **API级隔离**: 通过X-Tenant-ID头实现请求隔离
✅ **数据库级隔离**: 通过tenant_id字段实现存储隔离
✅ **自动清理**: 测试结束后完全清理租户数据



## 📝 测试结果

测试结果保存在 `test-results/` 目录：

```
test-results/
├── 01-testgroup-api-tests_20250122_120000.json
├── 02-testcase-api-tests_20250122_120100.json
├── 03-workflow-api-tests_20250122_120200.json
├── 04-environment-api-tests_20250122_120300.json
└── test_report_20250122_120400.txt
```

### 查看测试报告
```bash
cat test-results/test_report_*.txt | tail -1
```

### 查看详细结果
```bash
# 查看最新的TestGroup测试结果
cat test-results/01-testgroup-api-tests_*.json | jq '.'
```

## 🔍 测试特性

### 1. 自动清理
每个测试套件在执行前会自动清理旧的测试数据，确保测试环境干净。

### 2. 数据库验证
每个关键操作后都会查询数据库验证数据持久化正确性。

### 3. 断言验证
使用Assert Action验证响应数据、状态码、字段存在性等。

### 4. 脚本处理
使用Python/JavaScript脚本处理复杂数据和验证逻辑。

### 5. 独立运行
每个测试套件可以独立运行，互不干扰。

## 🛠️ 故障排除

### 服务未运行
```bash
Error: 服务未运行，请先启动服务
Solution: make run
```

### 端口被占用
```bash
Error: bind: address already in use
Solution: 修改 config.toml 中的端口号
```

### 数据库锁定
```bash
Error: database is locked
Solution:
1. 确保只有一个服务实例在运行
2. 删除并重新创建数据库: make clean-db && make init
```

### 测试超时
```bash
Warning: 测试套件超时
Solution:
1. 增加 run-self-tests.sh 中的 max_wait 值
2. 检查服务日志查看是否有错误
```

## 📚 扩展测试

### 添加新测试场景

1. 创建新的工作流JSON文件
2. 包含必要的步骤：
   - 数据清理
   - API调用
   - 数据库验证
   - 断言验证
   - 结果汇总
3. 添加到 `run-self-tests.sh` 的测试列表

### 示例：添加新的API测试
```json
{
  "name": "New API Test Suite",
  "version": "1.0.0",
  "description": "Test new API endpoints",
  "variables": {
    "baseUrl": "http://localhost:8090/api/v2"
  },
  "steps": {
    "testNewEndpoint": {
      "id": "testNewEndpoint",
      "name": "Test New Endpoint",
      "type": "http",
      "config": {
        "method": "GET",
        "url": "{{baseUrl}}/new-endpoint"
      }
    },
    "assertResponse": {
      "id": "assertResponse",
      "name": "Verify Response",
      "type": "assert",
      "dependsOn": ["testNewEndpoint"],
      "config": {
        "assertions": [
          {
            "type": "equals",
            "actual": "{{testNewEndpoint.status}}",
            "expected": 200
          }
        ]
      }
    }
  }
}
```

## 🎯 测试最佳实践

1. **测试隔离**: 每个测试套件使用唯一的ID和时间戳避免冲突
2. **数据清理**: 测试前后都清理测试数据
3. **幂等性**: 测试可以重复运行多次
4. **明确断言**: 每个测试都有明确的成功/失败标准
5. **错误处理**: 使用 `onError: "continue"` 确保清理步骤总是执行

## 📖 相关文档

- [API文档](../docs/API_DOCUMENTATION.md)
- [数据库设计](../docs/DATABASE_DESIGN.md)
- [工作流引擎](../WORKFLOW_ENGINE.md)
- [快速开始](../QUICKSTART.md)

## 🤝 贡献

欢迎添加更多测试场景！提交PR时请确保：
- 测试覆盖新功能的所有边界情况
- 包含数据库验证
- 包含充分的断言
- 测试可以独立运行
- 包含清理逻辑

## 📊 测试报告示例

```
平台自测试报告
生成时间: 2025-01-22 12:04:00

测试结果汇总:
  总计: 4 个测试套件
  通过: 4
  失败: 0

详细结果文件保存在: ./test-results

🎉 所有测试套件通过！
```

## ⚡ 性能指标

- TestGroup API: ~3秒
- TestCase API: ~5秒
- Workflow API: ~8秒
- Environment API: ~4秒
- **总计**: ~20秒

## 🔐 安全性

测试套件会：
- 自动生成唯一ID避免数据冲突
- 测试后自动清理敏感数据
- 不会影响生产数据（使用独立的测试数据库）
