# 系统架构概览

**版本**: 1.0
**最后更新**: 2025-11-27
**维护者**: 架构团队
**状态**: Approved

---

## 概述

本文档描述了测试管理平台（Test Management Platform）的整体系统架构，包括系统分层设计、技术栈选择、模块划分和部署架构。

### 系统定位

测试管理平台是一个**企业级全栈测试平台**，旨在提供：

- 📝 **测试用例管理**：支持HTTP、Command、Workflow等多种测试类型
- 🔄 **工作流编排**：基于DAG的测试步骤编排和并行执行
- 📊 **实时执行监控**：WebSocket实时推送测试执行日志
- 🎯 **测试价值评分**：自动评估测试用例的覆盖率、稳定性、效率
- 🏢 **多租户隔离**：支持多租户和项目级别的数据隔离

---

## 系统分层架构

### 整体架构图

```
┌─────────────────────────────────────────────────────────────┐
│                       前端层 (Frontend)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  React UI    │  │  WebSocket   │  │  Gemini AI   │      │
│  │  Components  │  │  Client      │  │  Integration │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            ↕ HTTP/WebSocket
┌─────────────────────────────────────────────────────────────┐
│                       后端层 (Backend)                       │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Handler Layer (HTTP & WebSocket Handlers)           │   │
│  │  - Gin Router  - WebSocket Hub  - API Controllers    │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Service Layer (Business Logic)                      │   │
│  │  - Test Execution  - Workflow Engine  - Scoring      │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Repository Layer (Data Access)                      │   │
│  │  - TestCase Repo  - Workflow Repo  - Result Repo     │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↕ GORM
┌─────────────────────────────────────────────────────────────┐
│                     数据存储层 (Data)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   SQLite     │  │   MySQL      │  │  PostgreSQL  │      │
│  │  (Default)   │  │  (Optional)  │  │  (Optional)  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### 层次说明

#### 1. 前端层 (Frontend)

**技术栈**: React 19.2 + TypeScript + Vite

**核心组件**:
- **UI组件**：测试用例管理、工作流构建器、实时日志查看器
- **WebSocket客户端**：接收实时测试执行日志
- **AI集成**：Google Gemini API辅助测试生成

**职责**:
- 提供用户界面
- 处理用户交互
- 实时展示测试执行状态
- AI辅助功能

#### 2. 后端层 (Backend)

**技术栈**: Go 1.24 + Gin + GORM + Gorilla WebSocket

**采用三层架构**：

##### Handler层
- 接收HTTP请求和WebSocket连接
- 参数验证和错误处理
- 响应格式化
- **关键组件**：
  - HTTP Handler：RESTful API接口
  - WebSocket Hub：管理所有WebSocket连接
  - WebSocket Client：每个连接的客户端实例

##### Service层
- 实现核心业务逻辑
- 测试用例执行编排
- Workflow引擎（DAG解析、并行执行）
- 测试价值评分计算
- **关键组件**：
  - TestExecutor：测试用例执行器（HTTP、Command）
  - WorkflowExecutor：工作流执行器
  - ScoringEngine：价值评分引擎
  - BroadcastLogger：三重输出日志（DB+WebSocket+Console）

##### Repository层
- 数据库CRUD操作
- 数据映射和转换
- 事务管理
- **关键组件**：
  - TestCaseRepository
  - WorkflowRepository
  - TestResultRepository
  - WorkflowRunRepository

#### 3. 数据存储层 (Data)

**默认**: SQLite（单文件数据库）
**可选**: MySQL / PostgreSQL（生产环境推荐）

**11个核心表**:
- 测试管理：test_groups, test_cases, test_results, test_runs
- 工作流管理：workflows, workflow_runs, workflow_step_executions, workflow_step_logs, workflow_variable_changes
- 环境管理：environments, environment_variables

**特性**:
- 软删除支持（GORM DeletedAt）
- 自定义JSONB类型（存储复杂配置）
- 外键约束和级联删除
- 多字段索引优化

---

## 核心模块划分

### 1. 测试执行模块 (Test Execution)

**位置**: `backend/internal/testcase/`

**功能**:
- HTTP测试执行（支持断言：status_code, json_path, response_time, header）
- Command测试执行（支持断言：exit_code, stdout, stderr）
- 断言验证和结果收集

**关键文件**:
- `executor.go` - 测试执行器主逻辑
- `http_executor.go` - HTTP测试执行
- `assertions.go` - 断言处理

### 2. 工作流引擎 (Workflow Engine)

**位置**: `backend/internal/workflow/`

**功能**:
- DAG（有向无环图）解析和层级划分
- 并行步骤执行（每层内并行，层间串行）
- 变量解析（`{{VAR_NAME}}`语法）
- DataMapper支持（JSONPath提取 + 内置转换函数）
- 重试机制（可配置重试次数）
- 错误处理（abort/continue策略）

**关键文件**:
- `executor.go` - 工作流执行引擎
- `variable_resolver.go` - 变量和DataMapper解析
- `actions/` - 步骤动作实现（HTTP、Command、TestCase）

**三种集成模式**:
1. **Mode 1**: 测试用例引用独立工作流（`workflowId`）
2. **Mode 2**: 测试用例嵌入工作流定义（`workflowDef`）
3. **Mode 3**: 工作流步骤引用测试用例（步骤type: `test-case`）

### 3. WebSocket实时推送 (Real-time Streaming)

**位置**: `backend/internal/websocket/`

**架构**:
- **Hub模式**：单例Hub管理所有连接，按`runId`分组
- **Client模式**：每个连接一个Client实例
- **双Goroutine**：ReadPump（接收）+ WritePump（发送）

**功能**:
- 实时推送工作流执行日志
- 心跳检测（54秒ping-pong）
- 慢客户端自动断开（防止内存泄漏）
- 256消息缓冲区（Hub和Client各256）

**WebSocket端点**:
```
ws://host/api/v2/workflows/runs/:runId/stream
```

### 4. 测试价值评分 (Test Value Scoring)

**位置**: `backend/internal/service/scoring.go`

**评分维度**:
- **覆盖率得分** (Coverage Score)：测试覆盖的功能模块数量
- **稳定性得分** (Stability Score)：成功率和Flaky测试检测
- **效率得分** (Efficiency Score)：执行时间和资源消耗
- **可维护性得分** (Maintainability Score)：断言清晰度和文档完整性

**综合得分计算**:
```
Overall Score = 0.3 * Coverage + 0.3 * Stability + 0.2 * Efficiency + 0.2 * Maintainability
```

### 5. 多租户和权限管理

**位置**: `backend/internal/middleware/`

**四层权限模型**:
1. **平台管理员**（Platform Admin）：全局管理权限
2. **租户管理员**（Tenant Admin）：租户级别管理
3. **项目管理员**（Project Admin）：项目级别管理
4. **普通用户**（User）：执行和查看权限

**隔离策略**:
- 租户级别数据隔离（`tenantId`字段）
- 项目级别资源隔离（`projectId`字段）
- 基于RBAC的权限控制

---

## 技术栈

### 后端技术栈

| 技术 | 版本 | 用途 |
|-----|------|------|
| **Go** | 1.24 | 核心开发语言 |
| **Gin** | 1.9+ | Web框架 |
| **GORM** | 1.25+ | ORM框架 |
| **Gorilla WebSocket** | 1.5+ | WebSocket实现 |
| **SQLite** | 3.x | 默认数据库 |
| **gjson** | 1.17+ | JSONPath解析 |

**核心依赖**:
```go
github.com/gin-gonic/gin
gorm.io/gorm
gorm.io/driver/sqlite
github.com/gorilla/websocket
github.com/tidwall/gjson
```

### 前端技术栈

| 技术 | 版本 | 用途 |
|-----|------|------|
| **React** | 19.2 | UI框架 |
| **TypeScript** | 5.x | 类型系统 |
| **Vite** | 6.2 | 构建工具 |
| **Recharts** | 3.4 | 数据可视化 |
| **Lucide React** | - | 图标库 |
| **Google Gemini** | - | AI辅助 |

### 基础设施

| 组件 | 说明 |
|-----|------|
| **数据库** | SQLite（开发） / MySQL/PostgreSQL（生产） |
| **缓存** | 内存缓存（计划引入Redis） |
| **日志** | 结构化日志（Console + Database + WebSocket） |
| **配置** | TOML配置文件 |

---

## 部署架构

### 开发环境部署

```
┌─────────────────────────────────────┐
│  开发机器 (localhost)                │
│                                     │
│  ┌──────────────┐  ┌─────────────┐ │
│  │  Frontend    │  │  Backend    │ │
│  │  :5173       │  │  :8090      │ │
│  └──────────────┘  └─────────────┘ │
│         ↓                  ↓        │
│  ┌──────────────────────────────┐  │
│  │  SQLite (./data/*.db)        │  │
│  └──────────────────────────────┘  │
└─────────────────────────────────────┘
```

**启动命令**:
```bash
# 后端
cd backend && make run

# 前端
cd NextTestPlatformUI && npm run dev
```

### 单机生产部署

```
┌─────────────────────────────────────────────┐
│  生产服务器                                  │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │  Nginx (反向代理)                    │   │
│  │  :80 → :8090 (Backend)              │   │
│  │  /ui → :5173 (Frontend Static)      │   │
│  └─────────────────────────────────────┘   │
│         ↓              ↓                    │
│  ┌──────────┐   ┌──────────┐              │
│  │ Backend  │   │ Frontend │              │
│  │ Service  │   │ (Build)  │              │
│  └──────────┘   └──────────┘              │
│         ↓                                   │
│  ┌────────────────────────┐                │
│  │  MySQL/PostgreSQL      │                │
│  └────────────────────────┘                │
└─────────────────────────────────────────────┘
```

### 集群部署架构（规划中）

```
┌─────────────────────────────────────────────────────┐
│                  Load Balancer                      │
└─────────────────────────────────────────────────────┘
         ↓                   ↓                   ↓
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Backend    │     │  Backend    │     │  Backend    │
│  Instance 1 │     │  Instance 2 │     │  Instance 3 │
└─────────────┘     └─────────────┘     └─────────────┘
         ↓                   ↓                   ↓
┌─────────────────────────────────────────────────────┐
│              MySQL/PostgreSQL Cluster               │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐             │
│  │ Primary │→ │ Replica │→ │ Replica │             │
│  └─────────┘  └─────────┘  └─────────┘             │
└─────────────────────────────────────────────────────┘
```

**集群特性**（规划）:
- 多实例负载均衡
- WebSocket连接粘性会话
- 数据库读写分离
- Redis共享会话

---

## 设计原则

### 1. 分层架构原则

遵循Handler → Service → Repository分层：
- ✅ **单向依赖**：上层依赖下层，禁止反向依赖
- ✅ **职责分离**：每层只做自己的事
- ✅ **接口优先**：依赖接口而非实现

### 2. 并发安全原则

- WebSocket Hub使用Channel通信（避免锁竞争）
- Repository使用事务保证数据一致性
- 工作流并行执行使用Goroutine Pool

### 3. 可扩展性原则

- **测试类型可扩展**：通过配置字段轻松添加新类型
- **断言类型可扩展**：插件化断言处理器
- **工作流动作可扩展**：Action Registry模式

### 4. 容错设计原则

- 测试执行失败不影响其他测试
- WebSocket断开自动清理资源
- 工作流支持重试和错误继续策略

---

## 性能考虑

### 数据库优化

- **索引策略**：
  - 高频查询字段（`testId`, `workflowId`, `status`, `tenantId`）
  - 组合索引（`tenantId + projectId`）
  - 时间字段索引（`createdAt`, `lastRunAt`）

- **查询优化**：
  - 分页查询（避免全表扫描）
  - 指定字段查询（避免`SELECT *`）
  - SQLite使用WAL模式

### WebSocket优化

- **缓冲区设计**：
  - Hub发送缓冲：256消息
  - Client发送缓冲：256消息
  - 防止慢客户端阻塞整个系统

- **连接管理**：
  - 心跳检测：54秒ping-pong
  - 自动清理：断开连接释放资源
  - 按runId分组：精准推送

### 工作流执行优化

- **并行执行**：
  - DAG层级并行（每层内步骤并发）
  - Goroutine Pool管理
  - Context超时控制

- **变量解析缓存**：
  - 解析结果缓存
  - JSONPath表达式预编译

---

## 扩展性考虑

### 未来可扩展方向

1. **测试类型扩展**：
   - gRPC测试
   - 数据库测试
   - 性能测试
   - 安全测试

2. **工作流能力**：
   - 条件分支（if-else）
   - 循环执行（for-each）
   - 子工作流调用
   - 定时触发

3. **AI能力增强**：
   - 测试用例自动生成
   - 测试结果智能分析
   - Flaky测试自动修复建议

4. **集成能力**：
   - CI/CD集成（Jenkins、GitLab CI）
   - 测试报告导出（HTML、PDF）
   - 第三方缺陷管理系统集成

---

## 相关文档

### 架构相关
- [WebSocket架构设计](./websocket-architecture.md) - WebSocket实时推送架构
- [后端分层架构](./backend-layered-design.md) - 三层架构详细说明
- [模块边界定义](../../5-wiki/architecture/module-boundaries.md) - 模块职责划分

### 技术规范
- [测试用例格式规范](../testing/test-case-format.md) - 测试用例JSON格式
- [DataMapper实现规范](../backend/datamapper-implementation.md) - 变量解析和转换

### 开发指南
- [代码文档化指南](../../3-guides/development/code-documentation-guide.md) - 代码文档编写
- [DataMapper使用指南](../../3-guides/development/datamapper-usage.md) - DataMapper使用

### 决策记录
- [统一工作流架构决策](../../6-decisions/2024-11-24-unified-workflow-architecture.md) - Workflow架构选型

---

## 端口配置

### 默认端口

| 服务 | 端口 | 配置位置 |
|-----|------|---------|
| **后端服务** | 8090 | `config.toml` → `[server].port` |
| **前端开发** | 5173 | Vite默认端口 |
| **目标服务** | 9095 | `config.toml` → `[test].target_host` |

### 端口冲突解决

```toml
# config.toml
[server]
host = "0.0.0.0"
port = 8091  # 修改为其他端口
```

---

## 环境变量

### 后端环境变量

| 变量 | 说明 | 默认值 |
|-----|------|-------|
| `CONFIG_PATH` | 配置文件路径 | `./config.toml` |
| `DB_TYPE` | 数据库类型 | `sqlite` |
| `DB_DSN` | 数据库连接串 | `./data/test_management.db` |

### 前端环境变量

| 变量 | 说明 |
|-----|------|
| `GEMINI_API_KEY` | Google Gemini API密钥 |
| `VITE_API_URL` | 后端API地址（生产环境） |

---

## 故障排除

### 常见问题

1. **端口占用**：
   ```bash
   # 修改config.toml中的端口号
   [server]
   port = 8091
   ```

2. **数据库锁定**：
   ```bash
   # SQLite使用WAL模式
   sqlite3 data/test_management.db "PRAGMA journal_mode = WAL;"
   ```

3. **WebSocket连接失败**：
   - 检查CORS配置
   - 检查防火墙规则
   - 验证WebSocket升级头

---

**审核历史**:
- 2025-11-27: 初始版本 - 架构团队
- 基于项目CLAUDE.md和现有架构文档整理

**维护计划**:
- 架构调整时同步更新
- 每季度审查架构合理性
- 重大变更前更新ADR
