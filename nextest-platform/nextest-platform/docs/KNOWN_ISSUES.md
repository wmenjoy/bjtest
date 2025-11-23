# Known Issues - Backend HTTP Status Code Violations

本文档记录了nextest-platform后端当前不符合HTTP状态码规范的问题。

**最后更新**: 2025-11-23
**测试版本**: v1.0.0
**参考文档**: `docs/HTTP_STATUS_CODE_SPEC.md`

## 概述

通过系统化的错误处理测试，我们发现了后端在HTTP状态码使用上的若干问题。这些问题违反了RESTful API最佳实践，需要修复以提升API的规范性和可预测性。

### 测试结果汇总

| 测试套件 | 总步骤 | 通过 | 失败 | 通过率 |
|---------|-------|------|------|-------|
| 404 Not Found Tests | 24 | 9 | 1 | 90% (部分未执行) |
| 400 Bad Request Tests | 16 | 16 | 0 | 100% ✓ |
| 409 Conflict Tests | 22 | 3 | 1 | 75% (部分未执行) |

**说明**: 由于workflow在断言失败时中止执行，部分步骤未能运行。实际问题数量可能更多。

---

## P0 问题 (严重 - 必须修复)

### P0-1: DELETE不存在的资源返回500而非404

**问题描述**:
当DELETE请求的资源ID不存在时，后端返回500 Internal Server Error，而不是404 Not Found。

**受影响的API**:
- `DELETE /api/tests/{id}` - 当testId不存在时
- `DELETE /api/groups/{id}` - 当groupId不存在时 (推测)
- `DELETE /api/environments/{id}` - 当envId不存在时 (推测)

**当前行为**:
```http
DELETE /api/tests/non-existent-id-12345
HTTP/1.1 500 Internal Server Error
Content-Type: application/json

{
  "error": "test case not found or access denied"
}
```

**期望行为**:
```http
DELETE /api/tests/non-existent-id-12345
HTTP/1.1 404 Not Found
Content-Type: application/json

{
  "error": "test case not found"
}
```

**测试case**: `self-test-404-not-found` - step09, step10

**修复建议**:
```go
// 当前代码 (错误)
if testCase == nil {
    c.JSON(500, gin.H{"error": "test case not found or access denied"})
    return
}

// 应该改为
if testCase == nil {
    c.JSON(404, gin.H{"error": "test case not found"})
    return
}
```

**影响等级**: P0 - 严重
**原因**: 500应该只用于服务器内部错误，资源不存在是客户端问题，应该返回404

---

### P0-2: 创建重复资源(UNIQUE约束)返回500而非409

**问题描述**:
当POST请求创建的资源ID已存在（UNIQUE constraint violation）时，后端返回500 Internal Server Error，而不是409 Conflict。

**受影响的API**:
- `POST /api/groups` - 当groupId已存在时
- `POST /api/tests` - 当testId已存在时 (推测)
- `POST /api/environments` - 当envId已存在时 (推测)
- `POST /api/workflows` - 当workflowId已存在时 (推测)

**当前行为**:
```http
POST /api/groups
Content-Type: application/json

{
  "groupId": "existing-group",
  "name": "Duplicate Group"
}

HTTP/1.1 500 Internal Server Error
Content-Type: application/json

{
  "error": "failed to create test group: failed to create test group: UNIQUE constraint failed: test_groups.group_id"
}
```

**期望行为**:
```http
HTTP/1.1 409 Conflict
Content-Type: application/json

{
  "error": "group already exists: existing-group"
}
```

**测试case**: `self-test-409-conflict` - step03, step04

**修复建议**:
```go
// 在repository层或handler层捕获UNIQUE constraint错误
err := repo.Create(ctx, group)
if err != nil {
    if strings.Contains(err.Error(), "UNIQUE constraint") {
        c.JSON(409, gin.H{"error": fmt.Sprintf("group already exists: %s", group.GroupID)})
        return
    }
    c.JSON(500, gin.H{"error": fmt.Sprintf("failed to create group: %v", err)})
    return
}
```

**影响等级**: P0 - 严重
**原因**: 暴露了数据库内部错误信息，且状态码不符合RESTful规范

---

## P1 问题 (重要 - 建议修复)

### P1-1: DELETE激活的环境返回500而非409

**问题描述**:
当尝试删除处于激活状态的环境时，后端返回500而不是409 Conflict。

**受影响的API**:
- `DELETE /api/environments/{id}` - 当environment是激活状态时

**当前行为**:
```http
DELETE /api/environments/active-env
HTTP/1.1 500 Internal Server Error

{
  "error": "cannot delete active environment 'active-env'"
}
```

**期望行为**:
```http
HTTP/1.1 409 Conflict

{
  "error": "cannot delete active environment 'active-env'"
}
```

**测试case**: `self-test-409-conflict` - step15, step16

**修复建议**:
```go
// 当前代码 (错误)
if env.IsActive {
    c.JSON(500, gin.H{"error": fmt.Sprintf("cannot delete active environment '%s'", envId)})
    return
}

// 应该改为
if env.IsActive {
    c.JSON(409, gin.H{"error": fmt.Sprintf("cannot delete active environment '%s'", envId)})
    return
}
```

**影响等级**: P1 - 重要
**原因**: 这是业务规则冲突，不是服务器错误

---

### P1-2: 执行不存在的workflow返回500而非404 (推测)

**问题描述**:
当POST请求执行不存在的workflowId时，推测会返回500而不是404。

**受影响的API**:
- `POST /api/workflows/{workflowId}/execute` - 当workflowId不存在时
- `POST /api/tests/{testId}/execute` - 当testId不存在时 (推测)
- `POST /api/groups/{groupId}/execute` - 当groupId不存在时 (推测)

**测试case**: `self-test-404-not-found` - step15, step16 (未执行)

**影响等级**: P1 - 重要
**原因**: 需要验证，但从DELETE的行为模式推测很可能有同样问题

---

## P2 问题 (一般 - 可选修复)

### P2-1: 错误信息暴露内部实现细节

**问题描述**:
某些错误信息暴露了数据库内部错误，例如"UNIQUE constraint failed: test_groups.group_id"。

**修复建议**:
统一错误处理，隐藏内部实现细节，只返回用户友好的错误信息。

**示例**:
```go
// 不好
{"error": "failed to create test group: failed to create test group: UNIQUE constraint failed: test_groups.group_id"}

// 好
{"error": "group already exists: my-group-id"}
```

---

## 未验证问题 (需要进一步测试)

由于workflow在断言失败时中止执行，以下场景尚未验证：

1. **PUT不存在的资源** - 可能也返回500
   - `PUT /api/tests/{non-existent-id}`
   - `PUT /api/groups/{non-existent-id}`
   - `PUT /api/environments/{non-existent-id}`

2. **DELETE有子资源的group** - 可能返回500而非409
   - `DELETE /api/groups/{id}` (当group下有tests时)

3. **POST workflow execute** - 已知问题，未完整验证
   - `POST /api/workflows/{non-existent-id}/execute`

4. **激活不存在的环境** - 可能返回500
   - `POST /api/environments/{non-existent-id}/activate`

---

## 修复优先级建议

### 立即修复 (本周)
1. P0-1: DELETE不存在资源返回404
2. P0-2: UNIQUE constraint返回409

### 本月修复
3. P1-1: DELETE激活环境返回409
4. P1-2: 执行不存在workflow返回404
5. 完善测试，验证未验证问题

### 持续改进
6. P2-1: 统一错误处理，优化错误信息
7. 添加更多边界条件测试

---

## 测试复现步骤

### 复现P0-1 (DELETE返回500)
```bash
# 1. 启动服务
./test-service

# 2. 尝试删除不存在的测试
curl -X DELETE http://localhost:8090/api/tests/non-existent-id

# 实际返回: 500
# 期望返回: 404
```

### 复现P0-2 (UNIQUE返回500)
```bash
# 1. 创建一个group
curl -X POST http://localhost:8090/api/groups \
  -H "Content-Type: application/json" \
  -d '{"groupId": "test-group", "name": "Test"}'

# 2. 再次创建相同groupId
curl -X POST http://localhost:8090/api/groups \
  -H "Content-Type: application/json" \
  -d '{"groupId": "test-group", "name": "Duplicate"}'

# 实际返回: 500
# 期望返回: 409
```

### 复现P1-1 (DELETE激活环境返回500)
```bash
# 1. 创建并激活环境
curl -X POST http://localhost:8090/api/environments \
  -H "Content-Type: application/json" \
  -d '{"envId": "test-env", "name": "Test Environment"}'

curl -X POST http://localhost:8090/api/environments/test-env/activate

# 2. 尝试删除激活的环境
curl -X DELETE http://localhost:8090/api/environments/test-env

# 实际返回: 500
# 期望返回: 409
```

---

## 自动化测试

所有问题都可以通过以下测试套件自动验证：

```bash
# 执行404测试
curl -X POST http://localhost:8090/api/workflows/self-test-404-not-found/execute

# 执行400测试
curl -X POST http://localhost:8090/api/workflows/self-test-400-bad-request/execute

# 执行409测试
curl -X POST http://localhost:8090/api/workflows/self-test-409-conflict/execute
```

**测试文件位置**:
- `examples/self-test-404-not-found.json`
- `examples/self-test-400-bad-request.json`
- `examples/self-test-409-conflict.json`

---

## 相关文档

- [HTTP状态码规范](./HTTP_STATUS_CODE_SPEC.md) - 完整的状态码使用规范
- [API文档](./API_DOCUMENTATION.md) - API端点文档
- [测试文档](./SELF_TEST_DOCUMENTATION.md) - 测试案例说明

---

## 修复进度跟踪

| 问题ID | 状态 | 修复PR | 验证时间 | 备注 |
|--------|------|--------|----------|------|
| P0-1 | 🔴 Open | - | - | 待修复 |
| P0-2 | 🔴 Open | - | - | 待修复 |
| P1-1 | 🔴 Open | - | - | 待修复 |
| P1-2 | 🟡 Unverified | - | - | 需要验证 |
| P2-1 | 🔴 Open | - | - | 待优化 |

**图例**:
- 🔴 Open: 已确认，待修复
- 🟡 Unverified: 需要进一步验证
- 🟢 Fixed: 已修复
- ✅ Verified: 已验证通过

---

## 联系方式

如有问题或建议，请通过以下方式反馈：
- GitHub Issues: https://github.com/your-org/nextest-platform/issues
- Email: dev-team@example.com
