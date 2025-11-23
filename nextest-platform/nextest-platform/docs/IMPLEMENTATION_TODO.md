# 系统实现计划 - 未完成任务清单

**最后更新**: 2025-11-23
**当前完成度**: 约70%

---

## ✅ 已完成的工作（Phase 1 & 2）

### 核心测试套件（12个测试文件）
1. ✅ `self-test-platform.json` - Platform基础功能测试
2. ✅ `self-test-testgroup-api.json` - Test Group API测试
3. ✅ `self-test-testcase-api.json` - Test Case API测试
4. ✅ `self-test-actions.json` - Actions API测试
5. ✅ `self-test-environment-api.json` - Environment API测试
6. ✅ `self-test-workflow-execution-api.json` - Workflow Execution测试
7. ✅ `self-test-results-api.json` - Results & History API测试
8. ✅ `self-test-workflow.json` - Workflow基础测试
9. ✅ `self-test-404-not-found.json` - 404错误测试（24步）
10. ✅ `self-test-400-bad-request.json` - 400错误测试（16步）
11. ✅ `self-test-409-conflict.json` - 409冲突测试（22步）
12. ✅ `self-test-error-handling.json` - 综合错误测试

### 核心文档
1. ✅ `docs/HTTP_STATUS_CODE_SPEC.md` - HTTP状态码规范
2. ✅ `docs/KNOWN_ISSUES.md` - 已知问题清单
3. ✅ `docs/BUG_FIX_REPORT_2025-11-23.md` - Bug修复报告

### Bug修复
1. ✅ P0-1: DELETE不存在资源返回404
2. ✅ P0-2: UNIQUE constraint返回409
3. ✅ P1-1: DELETE激活环境返回409

### 自动化
1. ✅ `run-self-tests.sh` - 自动化测试脚本（覆盖7个测试）

---

## ⚠️ 未完成的工作（Phase 3-5）

### Priority 1: 测试覆盖完善（高优先级）

#### 1.1 更新自动化测试脚本 ⏳
**状态**: 部分完成（7/12测试已集成）
**需要**: 将新的错误测试加入run-self-tests.sh

**任务**:
```bash
# 需要添加到run-self-tests.sh的测试：
- self-test-404-not-found.json
- self-test-400-bad-request.json
- self-test-409-conflict.json
- self-test-error-handling.json
- self-test-workflow.json
```

**优先级**: P0
**预计时间**: 15分钟

---

#### 1.2 Tenant Management API测试 ❌
**状态**: 未开始
**覆盖**: 0/11个端点

**需要测试的端点**:
```
POST   /api/v2/tenants
GET    /api/v2/tenants
GET    /api/v2/tenants/active
GET    /api/v2/tenants/:tenantId
PUT    /api/v2/tenants/:tenantId
DELETE /api/v2/tenants/:tenantId
POST   /api/v2/tenants/:tenantId/suspend
POST   /api/v2/tenants/:tenantId/activate
GET    /api/v2/tenants/:tenantId/projects
GET    /api/v2/tenants/:tenantId/projects/active
GET    /api/v2/tenants/:tenantId/members
```

**优先级**: P1
**预计时间**: 2小时

---

#### 1.3 Project Management API测试 ❌
**状态**: 未开始
**覆盖**: 0/11个端点

**需要测试的端点**:
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

**优先级**: P1
**预计时间**: 2小时

---

### Priority 2: 测试策略改进（中优先级）

#### 2.1 为断言步骤添加 onError: "continue" ⏳
**状态**: 未开始
**问题**: 当前测试在第一个断言失败时就中止，无法完整验证所有场景

**需要修改的文件**:
- `self-test-404-not-found.json` - 24个断言步骤
- `self-test-400-bad-request.json` - 8个断言步骤
- `self-test-409-conflict.json` - 多个断言步骤

**示例修改**:
```json
{
  "id": "step02_assert404Group",
  "name": "Assert 404 for Group",
  "type": "assert",
  "onError": "continue",  // 添加这一行
  "dependsOn": ["step01_getGroup404"],
  "config": {
    "assertions": [...]
  }
}
```

**优先级**: P1
**预计时间**: 30分钟
**影响**: 能够运行完整的测试套件，发现所有问题

---

#### 2.2 扩展404测试覆盖 ⏳
**状态**: 部分完成（13/24通过，需要扩展）

**需要添加的场景**:
- ✅ GET不存在资源 → 404 (已测试)
- ✅ DELETE不存在资源 → 404 (已修复)
- ❌ PUT不存在资源 → 404 (未测试，发现返回500)
- ❌ PATCH不存在资源 → 404 (未测试)
- ❌ 执行不存在workflow → 404 (部分测试)

**优先级**: P2
**预计时间**: 1小时

---

#### 2.3 扩展409测试覆盖 ⏳
**状态**: 部分完成

**需要添加的场景**:
- ✅ 创建重复资源(UNIQUE) → 409 (已修复)
- ✅ 删除激活环境 → 409 (已修复)
- ❌ 删除有子资源的group → 409 (未测试)
- ❌ 删除正在运行的workflow → 409 (未测试)
- ❌ 更新已归档的project → 409 (未测试)

**优先级**: P2
**预计时间**: 1小时

---

### Priority 3: 边界条件和安全性测试（中低优先级）

#### 3.1 边界条件测试 ❌
**状态**: 未开始

**需要测试的场景**:
- 空字符串参数
- 超长字符串（> 1000字符）
- 特殊字符（SQL注入尝试、XSS）
- 负数、零、超大数字
- 无效的JSON格式
- NULL值处理
- Unicode字符

**优先级**: P2
**预计时间**: 2小时

---

#### 3.2 并发和性能测试 ❌
**状态**: 未开始

**需要测试的场景**:
- 并发创建相同ID的资源
- 大量并发请求
- 长时间运行的workflow
- WebSocket连接数限制
- 内存泄漏检测

**优先级**: P3
**预计时间**: 4小时

---

### Priority 4: 文档完善（低优先级）

#### 4.1 更新API文档 ⏳
**状态**: 需要更新
**文件**: `docs/API_DOCUMENTATION.md`

**需要更新**:
- 所有端点的正确状态码
- 错误响应示例
- 添加409 Conflict场景说明

**优先级**: P2
**预计时间**: 1小时

---

#### 4.2 创建测试覆盖报告 ❌
**状态**: 未开始

**需要生成**:
- API覆盖率报告（当前：58% → 目标：>90%）
- 状态码覆盖报告
- 错误场景覆盖报告
- HTML格式的测试报告

**优先级**: P3
**预计时间**: 1小时

---

#### 4.3 创建自测试文档 ❌
**状态**: 旧文档可能已过期

**需要创建**:
- `docs/SELF_TEST_DOCUMENTATION.md` - 更新版本
- 包含所有12个测试的说明
- 包含新的404/400/409测试说明
- 覆盖率分析更新

**优先级**: P2
**预计时间**: 1小时

---

### Priority 5: 后续优化（可选）

#### 5.1 修复P2问题 ⏳
**状态**: 已记录，未修复

**待修复**:
- P2-1: PUT不存在资源返回404（当前返回500）
- P2-2: 错误信息暴露内部细节

**优先级**: P2
**预计时间**: 2小时

---

#### 5.2 创建CI/CD集成 ❌
**状态**: 未开始

**需要**:
- GitHub Actions workflow
- 自动运行所有测试
- 测试失败时阻止合并
- 生成测试报告

**优先级**: P3
**预计时间**: 2小时

---

## 📊 总体进度概览

### 测试覆盖
| 模块 | 当前 | 目标 | 状态 |
|------|------|------|------|
| Test Group API | 100% | 100% | ✅ |
| Test Case API | 100% | 100% | ✅ |
| Environment API | 100% | 100% | ✅ |
| Workflow API | 100% | 100% | ✅ |
| Results API | 100% | 100% | ✅ |
| Tenant API | 0% | 100% | ❌ |
| Project API | 0% | 100% | ❌ |
| Error Handling | 80% | 100% | ⏳ |
| **总计** | **58%** | **>90%** | ⏳ |

### Bug修复
| 级别 | 总数 | 已修复 | 未修复 |
|------|------|--------|--------|
| P0 | 2 | 2 | 0 ✅ |
| P1 | 1 | 1 | 0 ✅ |
| P2 | 2 | 0 | 2 ⚠️ |

### 文档
| 文档 | 状态 |
|------|------|
| HTTP规范 | ✅ 完成 |
| 已知问题 | ✅ 完成 |
| 修复报告 | ✅ 完成 |
| API文档 | ⚠️ 需要更新 |
| 测试文档 | ❌ 需要创建 |

---

## 🎯 推荐实施顺序

### 立即完成（今天）
1. ✅ **更新run-self-tests.sh** - 添加5个新测试（15分钟）
2. ✅ **添加onError: continue** - 让测试完整运行（30分钟）
3. ✅ **运行完整测试** - 验证所有修复（15分钟）

### 本周完成
4. ⏳ **创建Tenant API测试** - 覆盖11个端点（2小时）
5. ⏳ **创建Project API测试** - 覆盖11个端点（2小时）
6. ⏳ **扩展409测试** - 添加更多冲突场景（1小时）
7. ⏳ **更新API文档** - 反映正确状态码（1小时）

### 下周完成
8. ⏳ **边界条件测试** - 安全性和健壮性（2小时）
9. ⏳ **修复P2问题** - PUT返回404（2小时）
10. ⏳ **创建测试覆盖报告** - HTML格式（1小时）

---

## 📋 快速行动清单

**可以立即开始的任务**:

```bash
# Task 1: 更新自动化脚本（15分钟）
# 编辑run-self-tests.sh，添加新测试

# Task 2: 添加onError: continue（30分钟）
# 修改断言步骤配置

# Task 3: 创建Tenant测试（2小时）
# 参考已有测试，创建tenant-api-test.json

# Task 4: 创建Project测试（2小时）
# 参考已有测试，创建project-api-test.json

# Task 5: 更新测试文档（1小时）
# 创建完整的SELF_TEST_DOCUMENTATION.md
```

---

## ✅ 成功标准

完成后应该达到：
1. ✅ API覆盖率 >90%
2. ✅ 所有P0/P1 Bug已修复
3. ✅ 所有测试都能运行到底（onError: continue）
4. ✅ 完整的测试文档
5. ✅ 自动化测试脚本包含所有测试
6. ✅ HTTP状态码100%符合规范

**当前进度**: 70% → **目标**: 95%+
