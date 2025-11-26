# 技术规范文档

**最后更新**: 2025-11-26

---

## 目录概览

本层存放技术约束和规范定义，作为代码实现的"合约"。

```
1-specs/
├── database/          # 数据库规范
│   ├── schema.md              # 全量Schema定义
│   ├── configuration.md       # 数据库配置说明
│   └── migrations/            # 迁移记录
│       ├── 001_initial.md
│       ├── 002_add_hooks.md
│       ├── 003_add_workflow.md
│       ├── 004_add_environment.md
│       └── index.md
│
├── api/               # API规范
│   ├── v1.md                  # API v1文档
│   ├── v2.md                  # API v2文档
│   ├── communication-spec.md  # 通信规范
│   ├── http-status-codes.md   # HTTP状态码规范
│   └── openapi.yaml           # OpenAPI规范（机器可读）
│
├── backend/           # 后端规范
│   ├── datamapper-implementation.md
│   └── datamapper-quick-reference.md
│
└── ui/                # UI规范
    ├── design-tokens.md           # 设计token（颜色、字体、间距）
    ├── accessibility-standards.md # 无障碍标准
    └── responsive-breakpoints.md  # 响应式断点
```

---

## 当前规范列表

### 数据库规范 (Database)

| 文档 | 版本 | 最后更新 | 说明 |
|------|------|---------|------|
| schema.md | 2.0 | 2025-11-26 | 全量11张表定义 |
| configuration.md | 1.0 | 待补充 | 数据库连接和配置 |

**迁移历史**:
- **001**: 初始Schema (test_cases, test_groups, test_results, test_runs)
- **002**: 添加生命周期钩子
- **003**: 添加工作流表 (workflows, workflow_runs, workflow_step_executions, workflow_step_logs, workflow_variable_changes)
- **004**: 添加环境管理表 (environments, environment_variables)

### API规范 (API)

| 文档 | 版本 | 最后更新 | 说明 |
|------|------|---------|------|
| v1.md | 1.0 | 待补充 | 遗留API（已废弃） |
| v2.md | 2.0 | 2025-11-26 | 当前生产API |
| communication-spec.md | 1.0 | 待补充 | WebSocket通信规范 |
| http-status-codes.md | 1.0 | 待补充 | 统一状态码定义 |

**API版本策略**:
- 使用 `/api/v1` 和 `/api/v2` 路径区分版本
- 不兼容变更必须升级大版本
- v1已废弃，新功能只在v2实现

### 后端规范 (Backend)

| 文档 | 版本 | 最后更新 | 说明 |
|------|------|---------|------|
| datamapper-implementation.md | 1.0 | 待补充 | DataMapper模式实现 |
| datamapper-quick-reference.md | 1.0 | 待补充 | 快速参考指南 |

### UI规范 (UI)

| 文档 | 版本 | 最后更新 | 说明 |
|------|------|---------|------|
| design-tokens.md | 1.0 | 待补充 | 设计token定义 |
| accessibility-standards.md | 1.0 | 待补充 | WCAG 2.1 AA标准 |
| responsive-breakpoints.md | 1.0 | 待补充 | 移动端/平板/桌面断点 |

---

## 版本化说明

### Schema版本管理

每次Schema变更必须:
1. 更新 `database/schema.md` 中的版本号
2. 创建对应的迁移文件 `migrations/00X_description.md`
3. 在变更历史表格中记录

**示例**:
```markdown
## 变更历史

| 版本 | 日期 | 变更说明 | 迁移文件 |
|------|------|---------|---------|
| 2.0  | 2025-11-21 | 添加环境管理表 | 004_add_environment.sql |
| 1.3  | 2024-11-15 | 添加工作流表 | 003_add_workflow.sql |
```

### API版本管理

**v1 → v2 主要变更**:
- 统一响应格式
- 添加分页支持
- 增强错误码定义
- WebSocket实时推送

**向后兼容性**:
- v1端点保留但标记为Deprecated
- 新功能仅在v2实现
- v1计划在2026-Q1下线

---

## 更新规则

### 何时更新Specs文档

**必须更新**:
- ✅ 添加/删除/修改数据库表或字段
- ✅ 新增/变更API端点
- ✅ 修改请求/响应格式
- ✅ 变更HTTP状态码语义
- ✅ 调整UI设计规范

**不需要更新**:
- ❌ 代码重构（不改变接口）
- ❌ 性能优化（不改变行为）
- ❌ Bug修复（不改变规范）

### 更新流程

```bash
# 1. 修改代码实现
git add backend/internal/infrastructure/persistence/models/

# 2. 同步更新Specs文档
git add docs/1-specs/database/schema.md

# 3. 创建迁移文件（如需要）
git add docs/1-specs/database/migrations/005_new_feature.md

# 4. 提交时注明规范更新
git commit -m "feat: 添加XX功能

- 实现XX功能
- 更新Schema规范 (v2.1)
- 创建迁移 005_add_xx"
```

### 评审要求

**Specs文档变更需要:**
1. 技术评审 - 确保规范合理
2. 向后兼容性检查 - 评估影响范围
3. 迁移计划 - 如何从旧版本升级

---

## 与其他文档层的关系

- **需求来源**: [2-requirements/](../2-requirements/) - 功能需求驱动规范定义
- **实现指南**: [3-guides/](../3-guides/) - 如何按照规范实现
- **业务逻辑**: [5-wiki/](../5-wiki/) - 规范的业务背景和原理
- **决策记录**: [6-decisions/](../6-decisions/) - 为什么采用这个规范

---

## 相关工具

### Schema生成工具
```bash
# 从数据库导出当前Schema
go run cmd/tools/schema-export/main.go > docs/1-specs/database/schema.md

# 验证Schema一致性
go run cmd/tools/schema-validate/main.go docs/1-specs/database/schema.md
```

### API文档生成
```bash
# 从代码注释生成OpenAPI规范
swag init -g cmd/server/main.go -o docs/1-specs/api/

# 生成Markdown文档
swagger-markdown -i docs/1-specs/api/openapi.yaml -o docs/1-specs/api/v2.md
```

### 规范检查脚本
```bash
# 检查Schema版本一致性
./scripts/tools/check-schema-version.sh

# 检查API文档完整性
./scripts/tools/check-api-docs.sh
```

---

## 快速链接

### Database
- **完整Schema**: [database/schema.md](database/schema.md)
- **迁移历史**: [database/migrations/index.md](database/migrations/index.md)

### API
- **v2 API文档**: [api/v2.md](api/v2.md)
- **通信规范**: [api/communication-spec.md](api/communication-spec.md)

### Backend
- **DataMapper实现**: [backend/datamapper-implementation.md](backend/datamapper-implementation.md)

### UI
- **设计Token**: [ui/design-tokens.md](ui/design-tokens.md)

---

## 统计信息

- **数据库表**: 11张
- **API端点**: v2约30个
- **迁移版本**: 004
- **支持的数据库**: SQLite, MySQL, PostgreSQL

---

## 常见问题

### Q: Schema文档与实际数据库不一致怎么办？
**A**: Schema文档是"单一数据源"（Single Source of Truth）。如果不一致:
1. 首先确认哪个是正确的
2. 更新另一方使其一致
3. 如果需要变更Schema，创建新的迁移

### Q: API v1还能用吗？
**A**: 可以，但已标记为Deprecated。建议:
- 新功能使用v2
- 逐步迁移现有调用到v2
- v1计划2026-Q1下线

### Q: 如何查看某个字段是何时添加的？
**A**: 查看 `database/migrations/index.md` 和对应的迁移文件。

---

## 相关文档

- **文档架构设计**: [../6-decisions/2025-11-26-documentation-organization-architecture.md](../6-decisions/2025-11-26-documentation-organization-architecture.md)
- **数据库设计决策**: (待创建 ADR)
- **API设计指南**: [../3-guides/development/api-design-guide.md](../3-guides/development/)
