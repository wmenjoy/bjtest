# Loop & Branch Configuration - Test Cases & Browser Testing Guide

> 测试日期: 2025-11-24
> 状态: Backend Phase 7 已完成 ✅ | Frontend-Backend 集成测试进行中 🧪

---

## 📋 测试目标

验证 TestCase 的 loop 和 branch 配置能够：
1. **在前端 UI 中正确配置和显示**
2. **通过 API 正确保存到后端数据库**
3. **从数据库加载后完整还原配置**
4. **支持复杂的嵌套结构**

---

## 🧪 测试场景设计

### 场景 1: 简单 Count 循环
**业务场景**: 重试机制 - 发送 API 请求，失败后重试 3 次

**测试步骤**:
```json
{
  "id": "test-retry-count",
  "testId": "test-retry-count",
  "groupId": "base-images",
  "name": "API Retry with Count Loop",
  "type": "http",
  "priority": "P1",
  "status": "active",
  "objective": "测试 count 类型循环：API 请求重试 3 次",
  "steps": [
    {
      "id": "step-1",
      "name": "Retry API Call",
      "type": "http",
      "config": {
        "method": "POST",
        "url": "/api/external/unstable-service"
      },
      "loop": {
        "type": "count",
        "count": 3,
        "maxIterations": 5
      },
      "children": [
        {
          "id": "step-1-1",
          "name": "Check Response Status",
          "type": "assert",
          "config": {
            "condition": "{{response.status}} == 200"
          }
        }
      ]
    }
  ]
}
```

**预期结果**:
- ✅ Loop 配置显示: "Repeat 3 times Max: 5 iterations"
- ✅ Loop Body 显示: "1 step"
- ✅ 步骤徽章显示: "Loop: count"
- ✅ 保存后刷新页面，配置完整还原

---

### 场景 2: ForEach 数组迭代
**业务场景**: 批量用户处理 - 遍历用户列表，为每个用户创建账户

**测试步骤**:
```json
{
  "id": "test-foreach-users",
  "testId": "test-foreach-users",
  "groupId": "base-images",
  "name": "Batch User Creation with ForEach",
  "type": "http",
  "priority": "P0",
  "status": "active",
  "objective": "测试 forEach 类型循环：批量创建用户账户",
  "steps": [
    {
      "id": "step-1",
      "name": "Iterate Over User List",
      "type": "http",
      "loop": {
        "type": "forEach",
        "source": "{{userList}}",
        "itemVar": "user",
        "indexVar": "idx",
        "maxIterations": 100
      },
      "children": [
        {
          "id": "step-1-1",
          "name": "Create User Account",
          "type": "http",
          "config": {
            "method": "POST",
            "url": "/api/users",
            "body": {
              "username": "{{user.name}}",
              "email": "{{user.email}}",
              "index": "{{idx}}"
            }
          }
        },
        {
          "id": "step-1-2",
          "name": "Verify User Created",
          "type": "assert",
          "config": {
            "condition": "{{response.status}} == 201"
          }
        }
      ]
    }
  ],
  "variables": {
    "userList": [
      {"name": "alice", "email": "alice@example.com"},
      {"name": "bob", "email": "bob@example.com"},
      {"name": "charlie", "email": "charlie@example.com"}
    ]
  }
}
```

**预期结果**:
- ✅ Loop 配置显示: "For each {{userList}} as user (index: idx) Max: 100 iterations"
- ✅ Loop Body 显示: "2 steps"
- ✅ Source Array 输入框: "{{userList}}"
- ✅ Item Variable 输入框: "user"
- ✅ Index Variable 输入框: "idx"
- ✅ 保存后数据完整

---

### 场景 3: While 条件循环
**业务场景**: 分页数据获取 - 持续请求直到没有更多数据

**测试步骤**:
```json
{
  "id": "test-while-pagination",
  "testId": "test-while-pagination",
  "groupId": "base-images",
  "name": "Pagination with While Loop",
  "type": "http",
  "priority": "P1",
  "status": "active",
  "objective": "测试 while 类型循环：分页获取所有数据",
  "steps": [
    {
      "id": "step-1",
      "name": "Fetch Paginated Data",
      "type": "http",
      "loop": {
        "type": "while",
        "condition": "{{hasMore}} == true",
        "maxIterations": 50
      },
      "children": [
        {
          "id": "step-1-1",
          "name": "GET Page",
          "type": "http",
          "config": {
            "method": "GET",
            "url": "/api/data?page={{currentPage}}"
          },
          "outputs": {
            "hasMore": "response.body.hasNextPage",
            "currentPage": "response.body.nextPage"
          }
        }
      ]
    }
  ],
  "variables": {
    "hasMore": true,
    "currentPage": 1
  }
}
```

**预期结果**:
- ✅ Loop 配置显示: "While {{hasMore}} == true Max: 50 iterations"
- ✅ Condition 输入框: "{{hasMore}} == true"
- ✅ Loop Body 显示: "1 step"
- ✅ 步骤徽章显示: "Loop: while"

---

### 场景 4: 简单 If-Else 分支
**业务场景**: HTTP 状态码处理 - 根据响应状态执行不同操作

**测试步骤**:
```json
{
  "id": "test-branch-status",
  "testId": "test-branch-status",
  "groupId": "base-images",
  "name": "HTTP Status Code Branching",
  "type": "http",
  "priority": "P1",
  "status": "active",
  "objective": "测试条件分支：根据 HTTP 状态码执行不同逻辑",
  "steps": [
    {
      "id": "step-1",
      "name": "API Call with Status Handling",
      "type": "http",
      "config": {
        "method": "GET",
        "url": "/api/resource/123"
      },
      "branches": [
        {
          "condition": "{{response.status}} == 200",
          "label": "Success Path",
          "children": [
            {
              "id": "step-success-1",
              "name": "Log Success",
              "type": "command",
              "config": {
                "cmd": "echo",
                "args": ["Resource found successfully"]
              }
            }
          ]
        },
        {
          "condition": "{{response.status}} == 404",
          "label": "Not Found Path",
          "children": [
            {
              "id": "step-notfound-1",
              "name": "Create Default Resource",
              "type": "http",
              "config": {
                "method": "POST",
                "url": "/api/resource",
                "body": {"id": 123, "name": "default"}
              }
            }
          ]
        },
        {
          "condition": "",
          "label": "Default (else)",
          "children": [
            {
              "id": "step-default-1",
              "name": "Log Error",
              "type": "command",
              "config": {
                "cmd": "echo",
                "args": ["Unexpected status: {{response.status}}"]
              }
            }
          ]
        }
      ]
    }
  ]
}
```

**预期结果**:
- ✅ Branch Configuration 面板显示
- ✅ 分支计数: "3 branches"
- ✅ Branch Structure 预览:
  ```
  |-- {{response.status}} == 200 -> Success Path
  |-- {{response.status}} == 404 -> Not Found Path
  -- default -> Default (else)
  ```
- ✅ 每个分支显示正确的子步骤数量

---

### 场景 5: 多分支权限控制
**业务场景**: 基于用户角色的操作权限验证

**测试步骤**:
```json
{
  "id": "test-branch-roles",
  "testId": "test-branch-roles",
  "groupId": "base-images",
  "name": "Role-Based Access Control",
  "type": "http",
  "priority": "P0",
  "status": "active",
  "objective": "测试多分支：根据用户角色执行不同操作",
  "steps": [
    {
      "id": "step-1",
      "name": "Role-Based Operation",
      "type": "http",
      "branches": [
        {
          "condition": "{{user.role}} == 'admin'",
          "label": "Admin Path",
          "children": [
            {
              "id": "step-admin-1",
              "name": "Admin: Full Access",
              "type": "http",
              "config": {
                "method": "DELETE",
                "url": "/api/admin/users/{{targetUserId}}"
              }
            },
            {
              "id": "step-admin-2",
              "name": "Admin: Audit Log",
              "type": "http",
              "config": {
                "method": "POST",
                "url": "/api/audit",
                "body": {"action": "delete_user", "actor": "{{user.id}}"}
              }
            }
          ]
        },
        {
          "condition": "{{user.role}} == 'moderator'",
          "label": "Moderator Path",
          "children": [
            {
              "id": "step-mod-1",
              "name": "Moderator: Suspend User",
              "type": "http",
              "config": {
                "method": "PUT",
                "url": "/api/users/{{targetUserId}}/suspend"
              }
            }
          ]
        },
        {
          "condition": "{{user.role}} == 'user'",
          "label": "User Path",
          "children": [
            {
              "id": "step-user-1",
              "name": "User: View Only",
              "type": "http",
              "config": {
                "method": "GET",
                "url": "/api/users/{{targetUserId}}"
              }
            }
          ]
        },
        {
          "condition": "",
          "label": "Default (Unauthorized)",
          "children": [
            {
              "id": "step-default-1",
              "name": "Return 403 Forbidden",
              "type": "assert",
              "config": {
                "condition": "1 == 2",
                "message": "Unauthorized role"
              }
            }
          ]
        }
      ]
    }
  ],
  "variables": {
    "user": {"id": "user-123", "role": "admin"},
    "targetUserId": "user-456"
  }
}
```

**预期结果**:
- ✅ Branch Configuration 显示: "4 branches"
- ✅ 每个分支显示不同的子步骤数量
- ✅ Admin Path: "2 steps"
- ✅ Moderator Path: "1 step"
- ✅ User Path: "1 step"
- ✅ Default: "1 step"

---

### 场景 6: 嵌套结构 (Loop + Branch)
**业务场景**: 批量文件处理 - 遍历文件列表，根据文件类型执行不同处理

**测试步骤**:
```json
{
  "id": "test-nested-loop-branch",
  "testId": "test-nested-loop-branch",
  "groupId": "base-images",
  "name": "Nested Loop with Branches",
  "type": "http",
  "priority": "P2",
  "status": "active",
  "objective": "测试嵌套结构：循环中包含条件分支",
  "steps": [
    {
      "id": "step-1",
      "name": "Process File List",
      "type": "http",
      "loop": {
        "type": "forEach",
        "source": "{{fileList}}",
        "itemVar": "file",
        "indexVar": "i",
        "maxIterations": 100
      },
      "children": [
        {
          "id": "step-1-1",
          "name": "Handle File by Type",
          "type": "http",
          "branches": [
            {
              "condition": "{{file.type}} == 'image'",
              "label": "Image Processing",
              "children": [
                {
                  "id": "step-img-1",
                  "name": "Compress Image",
                  "type": "http",
                  "config": {
                    "method": "POST",
                    "url": "/api/images/compress",
                    "body": {"file": "{{file.path}}"}
                  }
                },
                {
                  "id": "step-img-2",
                  "name": "Generate Thumbnail",
                  "type": "http",
                  "config": {
                    "method": "POST",
                    "url": "/api/images/thumbnail",
                    "body": {"file": "{{file.path}}"}
                  }
                }
              ]
            },
            {
              "condition": "{{file.type}} == 'video'",
              "label": "Video Processing",
              "children": [
                {
                  "id": "step-vid-1",
                  "name": "Transcode Video",
                  "type": "http",
                  "config": {
                    "method": "POST",
                    "url": "/api/videos/transcode",
                    "body": {"file": "{{file.path}}", "format": "mp4"}
                  }
                }
              ]
            },
            {
              "condition": "",
              "label": "Default (Skip)",
              "children": [
                {
                  "id": "step-skip-1",
                  "name": "Log Skipped File",
                  "type": "command",
                  "config": {
                    "cmd": "echo",
                    "args": ["Skipping file: {{file.name}}"]
                  }
                }
              ]
            }
          ]
        }
      ]
    }
  ],
  "variables": {
    "fileList": [
      {"name": "photo1.jpg", "type": "image", "path": "/uploads/photo1.jpg"},
      {"name": "video1.mov", "type": "video", "path": "/uploads/video1.mov"},
      {"name": "doc1.pdf", "type": "document", "path": "/uploads/doc1.pdf"}
    ]
  }
}
```

**预期结构**:
```
step-1 (Loop: forEach)
├── Loop Body (1 step)
│   └── step-1-1 (3 branches)
│       ├── Image Processing (2 steps)
│       ├── Video Processing (1 step)
│       └── Default (1 step)
```

**预期结果**:
- ✅ 主步骤显示: "Loop: forEach"
- ✅ Loop Body 显示: "1 step"
- ✅ 子步骤显示: "3 branches"
- ✅ 嵌套编号正确: 1, 1.1, 1.1.1, 1.1.2, etc.
- ✅ 底部统计: "1 step | 1 loops | 1 branches" (主步骤层级)

---

## 🌐 浏览器测试步骤

### 前置条件
1. **后端服务运行**:
   ```bash
   cd nextest-platform
   ./test-service
   # 确认服务运行在 http://localhost:8090
   ```

2. **前端服务运行**:
   ```bash
   cd NextTestPlatformUI
   npm run dev
   # 确认前端运行在 http://localhost:8082 (或其他端口)
   ```

3. **数据准备**: 确保数据库有 tenant、project 和 test_group

---

### 测试流程

#### 步骤 1: 创建测试用例
1. 打开浏览器: `http://localhost:8082`
2. 打开 Chrome DevTools (F12)
3. 导航到 **Test Repository** 页面
4. 点击 **Add Test** 或选择现有测试的 **Edit** 按钮

#### 步骤 2: 配置 Loop (以场景 1 为例)
1. 在步骤编辑器中，点击 **Add Step**
2. 填写步骤名称: "Retry API Call"
3. 点击 **Expand** 展开配置
4. 点击 **Loop Configuration** 切换按钮
5. 选择 **Count** 类型
6. 输入 **Number of Iterations**: 3
7. 输入 **Max Iterations**: 5
8. 在 **Loop Body** 区域点击 **Add Step** 添加子步骤
9. 配置子步骤: "Check Response Status"

**验证点**:
- ✅ 实时预览显示: "Repeat 3 times Max: 5 iterations"
- ✅ 步骤徽章显示: "Loop: count"
- ✅ Loop Body 显示: "1 step"

#### 步骤 3: 保存并验证持久化
1. 点击页面底部的 **Save Changes** 按钮
2. 检查 DevTools Network 面板:
   - 查找 `PUT /api/tests/{testId}` 请求
   - 检查 **Request Payload** 中的 `steps[0].loop` 字段
   - 确认包含 `type`, `count`, `maxIterations`
3. 检查 **Response** 状态码: 应为 `200 OK`
4. 检查 Response Body 中的 `steps[0].loop` 字段是否完整

**验证 API 请求**:
```javascript
// 在 DevTools Console 中执行
const requestPayload = /* 从 Network 面板复制 */;
console.log('Loop Config:', requestPayload.steps[0].loop);
// 预期输出: {type: "count", count: 3, maxIterations: 5}
```

#### 步骤 4: 刷新验证
1. 按 **F5** 或 **Ctrl+R** 刷新页面
2. 重新进入刚才编辑的测试用例
3. 点击 **Edit** 进入编辑模式
4. 展开步骤的 Loop Configuration

**验证点**:
- ✅ Loop 类型保持为 **Count**
- ✅ Number of Iterations 显示: 3
- ✅ Max Iterations 显示: 5
- ✅ Loop Body 子步骤完整

#### 步骤 5: 配置 Branch (以场景 4 为例)
1. 创建新步骤或编辑现有步骤
2. 点击 **Expand** 展开配置
3. 点击 **Add Conditional Branches** 按钮
4. 配置第一个分支:
   - Label: "Success Path"
   - Condition: `{{response.status}} == 200`
   - 点击 **Add Step** 添加子步骤
5. 点击 **Add Branch** 添加第二个分支:
   - Label: "Not Found Path"
   - Condition: `{{response.status}} == 404`
6. 点击 **Add Default** 添加默认分支:
   - Label 自动显示: "Default (else)"
   - 无需输入 Condition

**验证点**:
- ✅ Branch Configuration 显示: "3 branches"
- ✅ Branch Structure 预览显示完整树形结构
- ✅ 每个分支显示正确的 children 数量
- ✅ Default 分支显示黄色标记

#### 步骤 6: 测试嵌套结构 (场景 6)
1. 创建步骤并配置 forEach 循环
2. 在 Loop Body 中添加子步骤
3. 在子步骤中点击 **Add Conditional Branches**
4. 配置多个分支，每个分支添加子步骤

**验证层级编号**:
- ✅ 主步骤: "1"
- ✅ Loop Body 子步骤: "1.1"
- ✅ Branch 子步骤: "1.1.1", "1.1.2"
- ✅ 嵌套深度最多支持 3-4 层

---

## 🔍 Chrome DevTools 调试技巧

### Network 面板
1. **Filter**: 输入 `/api/tests` 过滤测试相关请求
2. **Preserve log**: 勾选保留日志，防止页面跳转丢失请求
3. **查看 Request Payload**:
   ```javascript
   // 查看完整的 steps 结构
   JSON.parse(payload).steps.forEach((step, i) => {
     console.log(`Step ${i+1}:`, step.name);
     if (step.loop) console.log('  Loop:', step.loop);
     if (step.branches) console.log('  Branches:', step.branches.length);
     if (step.children) console.log('  Children:', step.children.length);
   });
   ```

### Console 面板
1. **测试 API 连接**:
   ```javascript
   // 获取测试用例
   fetch('http://localhost:8090/api/tests/test-loop-demo', {
     headers: {
       'X-Tenant-ID': 'default',
       'X-Project-ID': 'default'
     }
   })
   .then(r => r.json())
   .then(data => console.log('Steps:', data.steps));
   ```

2. **验证 Loop 配置**:
   ```javascript
   // 在前端代码中添加调试
   console.log('Current Step Config:', step);
   console.log('Has Loop:', !!step.loop);
   console.log('Loop Type:', step.loop?.type);
   console.log('Children Count:', step.children?.length || 0);
   ```

### Application 面板
1. **检查 LocalStorage**: 查看是否有缓存的测试数据
2. **检查 SessionStorage**: 查看会话期间的临时数据

---

## ✅ 验收标准

### 功能性验收
- [ ] **Loop - Count**: 配置、保存、加载正确
- [ ] **Loop - ForEach**: Source、ItemVar、IndexVar 完整
- [ ] **Loop - While**: Condition 正确保存
- [ ] **Branch - If-Else**: 单分支配置成功
- [ ] **Branch - Multi**: 多分支（3+）配置成功
- [ ] **Branch - Default**: 默认分支显示正确标记
- [ ] **Nested**: Loop + Branch 嵌套结构正确
- [ ] **Children**: 子步骤递归显示和编辑
- [ ] **Numbering**: 嵌套编号系统正确 (1, 1.1, 1.1.1)

### UI/UX 验收
- [ ] 实时预览准确反映配置
- [ ] 徽章动态更新 (Loop: count, 3 branches)
- [ ] 底部统计正确 (X steps | X loops | X branches)
- [ ] 展开/折叠动画流畅
- [ ] 所有按钮响应正常
- [ ] 无控制台错误

### 数据持久化验收
- [ ] 保存请求返回 200 OK
- [ ] Response 包含完整的 loop/branch 数据
- [ ] 刷新页面后数据完整还原
- [ ] 数据库中 steps 列包含完整 JSON

---

## 🐛 常见问题排查

### 问题 1: 保存后数据丢失
**症状**: 点击 Save 后刷新页面，loop/branch 配置消失

**排查步骤**:
1. 检查 Network 面板的 PUT 请求:
   ```bash
   # Request Payload 是否包含 steps 字段？
   # Response 是否返回完整的 steps 数据？
   ```
2. 检查后端日志:
   ```bash
   tail -f /tmp/server.log | grep "PUT /api/tests"
   ```
3. 检查数据库:
   ```bash
   sqlite3 data/test_management.db \
     "SELECT steps FROM test_cases WHERE test_id='test-loop-demo';"
   ```

**解决方案**: 参见本文档开头的 Phase 7 修复内容

### 问题 2: UI 显示不正确
**症状**: Loop 配置正确保存，但 UI 显示错误

**排查步骤**:
1. 检查前端类型定义 (`types.ts`)
2. 检查组件 props 传递
3. 在浏览器 Console 添加调试:
   ```javascript
   console.log('Step Data:', step);
   console.log('Loop Config:', step.loop);
   ```

### 问题 3: 嵌套层级过深
**症状**: 超过 3 层嵌套后 UI 显示异常

**限制**: 建议最大嵌套深度为 3-4 层

**解决方案**:
- 添加深度检查逻辑
- 超过限制时显示警告提示

---

## 📝 测试记录模板

```markdown
### 测试执行记录

**测试人员**: [姓名]
**测试日期**: 2025-11-24
**浏览器**: Chrome 120.0
**前端版本**: [Git Commit SHA]
**后端版本**: [Git Commit SHA]

| 场景 | 测试项 | 预期结果 | 实际结果 | 状态 | 备注 |
|------|--------|----------|----------|------|------|
| 场景1 | Count Loop 配置 | 显示正确 | ✅ 通过 | PASS | - |
| 场景1 | Count Loop 保存 | 200 OK | ✅ 通过 | PASS | - |
| 场景1 | Count Loop 加载 | 数据完整 | ✅ 通过 | PASS | - |
| 场景2 | ForEach Loop 配置 | Source/Item/Index | ✅ 通过 | PASS | - |
| ... | ... | ... | ... | ... | ... |

**总结**:
- ✅ 通过: X 项
- ❌ 失败: X 项
- ⏭️ 跳过: X 项

**发现的问题**:
1. [问题描述]
2. [问题描述]
```

---

## 🚀 下一步计划

完成 Phase 7 验收后，进入 **Phase 8: Backend Execution Engine**:

1. **Loop 执行引擎**:
   - Count 循环执行
   - ForEach 数组迭代
   - While 条件判断
   - 变量插值 ({{variable}})

2. **Branch 执行引擎**:
   - 条件表达式评估
   - 分支路径选择
   - Default 分支处理

3. **WebSocket 实时推送**:
   - Loop 迭代事件
   - Branch 选择事件
   - 变量变化通知

4. **ExecutionView 集成**:
   - 实时显示循环进度
   - 显示执行的分支路径
   - 变量池实时更新

---

*本测试文档由 Claude Code 生成，用于 TestCase 重构项目的前后端集成测试*
