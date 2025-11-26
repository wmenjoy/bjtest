# 统一 Workflow 架构 - 测试快速开始

> **5分钟快速测试新功能**

---

## ⚡ 快速开始

### 1️⃣ 启动服务 (2分钟)

```bash
# 终端 1: 启动后端
cd nextest-platform
make run
# 等待输出: Server started on :8090

# 终端 2: 启动前端
cd NextTestPlatformUI
npm run dev
# 等待输出: Local: http://localhost:5173
```

---

### 2️⃣ 导入测试数据 (1分钟)

```bash
cd nextest-platform
./import-test-cases.sh
# 等待输出: ✓ 导入完成!
```

---

### 3️⃣ 执行测试 (2分钟)

**方式 A: 前端界面（推荐）**

1. 访问 http://localhost:5173
2. 点击 "Test Case Manager"
3. 找到 "Backend API Tests" → 执行
4. 找到 "Workflow Architecture Demo" → 执行

**方式 B: API 命令**

```bash
# 后端健康检查
curl -X POST http://localhost:8090/api/v2/tests/test-backend-health/execute

# 综合工作流演示
curl -X POST http://localhost:8090/api/v2/tests/test-demo-comprehensive-workflow/execute
```

---

## 📋 测试重点

### 必测功能 (15分钟)

1. **Action Template 模式** (3分钟)
   - 打开 `test-mode-switching`
   - 验证 Step 1 显示 "📦 Template" 徽章
   - 验证显示模板信息卡片

2. **DataMapper 数据流** (5分钟)
   - 打开 `test-datamapper-features`
   - 编辑 Step 2
   - 点击 "Data Flow Mapping"
   - 验证三栏布局
   - 从左栏拖拽字段到右栏
   - 选择转换函数

3. **Simple Mode 编辑器** (3分钟)
   - 打开 `test-simple-mode-editor`
   - 拖拽步骤排序
   - 添加新步骤
   - 删除步骤

4. **Advanced DAG 编辑器** (4分钟)
   - 打开 `test-advanced-dag-editor`
   - 系统显示复杂度警告
   - 切换到 Advanced Mode
   - 验证 DAG 图渲染
   - 拖拽节点
   - 切换布局方向

---

## ✅ 成功标准

- [ ] 后端服务启动成功（http://localhost:8090/health 返回 200）
- [ ] 前端服务启动成功（http://localhost:5173 可访问）
- [ ] 测试数据导入成功（无错误）
- [ ] 后端 API 测试全部通过
- [ ] DataMapper 拖拽创建映射成功
- [ ] Simple/Advanced 模式切换流畅
- [ ] 模式指示器清晰可见（📦 Template / ⚙️ Inline）

---

## 📚 详细文档

- **完整测试指南**: [TESTING_GUIDE.md](TESTING_GUIDE.md) - 详细的测试步骤和检查清单
- **测试案例摘要**: [TEST_CASES_SUMMARY.md](TEST_CASES_SUMMARY.md) - 所有测试案例的详细说明
- **最终实施报告**: [FINAL_IMPLEMENTATION_REPORT.md](FINAL_IMPLEMENTATION_REPORT.md) - 完整的实施总结

---

## 🐛 常见问题

**Q: 后端启动失败**
```bash
# 检查端口占用
lsof -i :8090

# 重新初始化
make clean
make init
make run
```

**Q: 导入脚本失败**
```bash
# 检查 JSON 格式
cat examples/test-new-architecture.json | jq .

# 手动导入
curl -X POST http://localhost:8090/api/v2/groups \
  -H "Content-Type: application/json" \
  -d @examples/test-new-architecture.json
```

**Q: 前端无法连接后端**
- 检查后端是否运行: `curl http://localhost:8090/health`
- 检查 CORS 配置
- 检查前端 API_BASE_URL 配置

---

## 🎯 下一步

测试完成后：
1. 填写测试报告（见 TESTING_GUIDE.md）
2. 记录所有问题
3. 反馈测试结果

---

**开始测试吧！** 🚀
