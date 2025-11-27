# Testing - 测试技术规范

**目录类型**: 技术规范 (1-specs)
**版本**: 1.0
**最后更新**: 2025-11-27

---

## 📁 目录用途

本目录存放测试的技术标准和规范文档，定义测试用例格式、测试数据管理、测试环境配置等技术细节。

### 与其他测试相关目录的区别

| 目录 | 内容 | 时效性 | 关系 |
|-----|------|-------|------|
| `1-specs/testing/` | 测试技术标准（格式、规范） | 长期稳定 | 本目录 - 定义标准 |
| `3-guides/testing/` | 测试执行指南（如何编写） | 中期更新 | 基于本目录的标准 |
| `4-planning/testing/` | 版本测试计划（测试排期） | 版本相关 | 使用本目录的标准 |
| `5-wiki/testcase/` | 测试平台功能说明 | 持续更新 | 平台使用知识 |
| `6-decisions/` | 测试策略决策（为什么） | 长期稳定 | 决策的实施标准 |

---

## 📄 关键文档

### 推荐创建的文档 (按优先级)

**P0 - 必须有**:
- [x] `test-case-format.md` - 测试用例的JSON格式定义
  - HTTP测试用例格式
  - Command测试用例格式
  - Workflow测试用例格式
  - 必填字段说明
  - 字段验证规则
  - 完整示例和最佳实践

**P1 - 应该有**:
- [x] `api-testing-spec.md` - API测试规范
  - ✅ 断言类型定义（status_code, json_path, response_time, header）
  - ✅ 断言操作符规范（equals, in, exists, contains, less_than, regex）
  - ✅ HTTP方法使用规范（GET, POST, PUT, PATCH, DELETE）
  - ✅ 请求头标准设置（Content-Type, Authorization等）
  - ✅ URL配置规范（path vs url）
  - ✅ 请求体规范（JSON、嵌套对象、数组、变量替换）
  - ✅ 错误处理规范（HTTP错误状态码）
  - ✅ 完整示例和最佳实践

- [ ] `test-data-spec.md` - 测试数据管理规范
  - 测试数据准备规范
  - 测试数据清理规范
  - 测试数据隔离策略
  - 敏感数据处理规范

**P2 - 最好有**:
- [ ] `test-environment-spec.md` - 测试环境配置规范
  - 环境变量命名规范
  - 环境配置文件格式
  - 多环境切换机制

- [ ] `test-naming-conventions.md` - 测试命名规范
  - 测试用例命名规则
  - 测试组命名规则
  - 测试数据命名规则

---

## 📋 文档模板

### 测试规范文档标准结构

```markdown
# [测试类型] 测试规范

**版本**: 1.0
**最后更新**: YYYY-MM-DD
**维护者**: QA团队
**状态**: Draft / Review / Approved

---

## 概述

说明本规范涵盖的测试类型和适用范围。

## 格式定义

### 数据结构

定义测试数据的JSON schema或格式。

```json
{
  "field1": "type",
  "field2": "type"
}
```

### 必填字段

列出所有必填字段及其说明。

### 可选字段

列出可选字段及其默认值。

## 验证规则

定义字段的验证规则和约束条件。

## 最佳实践

提供使用本规范的最佳实践建议。

## 错误处理

说明不符合规范时的错误提示和处理方式。

## 示例

提供符合规范的完整示例。

## 相关文档

- [测试指南](../../3-guides/testing/xxx-testing.md)
- [测试策略](../../6-decisions/testing-strategy.md)

---

**审核历史**:
- YYYY-MM-DD: 初始版本 - [Author]
```

---

## 📊 测试用例格式规范概览

### HTTP测试用例示例结构

```json
{
  "test_id": "string (required)",
  "name": "string (required)",
  "type": "http (required)",
  "enabled": "boolean (default: true)",
  "http_config": {
    "url": "string (required)",
    "method": "GET|POST|PUT|DELETE (required)",
    "headers": "object (optional)",
    "body": "object (optional)",
    "timeout": "number (default: 30000)"
  },
  "assertions": [
    {
      "type": "status|body|headers|response_time",
      "operator": "equals|contains|regex|less_than",
      "expected": "any",
      "description": "string"
    }
  ]
}
```

### 断言类型规范

| 断言类型 | 说明 | 支持的操作符 |
|---------|------|-------------|
| `status` | HTTP状态码 | equals, in |
| `body` | 响应体 | equals, contains, regex, json_path |
| `headers` | 响应头 | contains, equals |
| `response_time` | 响应时间 | less_than, greater_than |

### 验证优先级

1. **P0**: test_id, name, type, http_config.url, http_config.method
2. **P1**: assertions (至少一个), enabled
3. **P2**: timeout, headers, body

---

## 🔗 相关文档

- [文档标准](../../directory-standards.md) - 查看完整的文档组织规范
- [测试策略](../../6-decisions/testing-strategy.md) - 查看测试策略决策
- [单元测试指南](../../3-guides/testing/unit-testing.md) - 查看如何编写测试
- [测试平台使用](../../5-wiki/testcase/) - 查看测试平台功能

---

## 📌 注意事项

1. **保持稳定性**: 规范变更会影响所有测试用例，需谨慎
2. **向后兼容**: 新版本规范应尽量保持向后兼容
3. **版本管理**: 规范变更时更新版本号，记录变更内容
4. **关联实施**: 规范定义后，需在3-guides/中提供实施指南

---

## 🔄 规范变更流程

1. **提议变更** → 在Issues或团队会议中讨论
2. **评估影响** → 评估对现有测试用例的影响范围
3. **编写草案** → 创建规范草案（状态：Draft）
4. **团队审核** → QA团队和开发团队审核（状态：Review）
5. **批准发布** → 技术负责人批准（状态：Approved）
6. **更新文档** → 同步更新3-guides/中的实施指南
7. **迁移用例** → 逐步迁移现有测试用例

---

**维护者**: QA团队、测试工程师
**创建日期**: 2025-11-27
