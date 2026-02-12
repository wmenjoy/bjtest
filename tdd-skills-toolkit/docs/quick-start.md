# TDD Skills Toolkit - 快速开始指南

> 5分钟开始使用TDD技能开发

## 最快开始（1分钟）

```bash
# 1. 复制toolkit到项目
cd /path/to/your/project
cp -r /path/to/tdd-skills-toolkit/skills .claude/

# 2. 完成！开始开发
# Claude会自动使用TDD流程
```

## 标准开始（5分钟）

### 步骤1: 安装Skills和Commands

```bash
cd /path/to/your/project

# 复制skills
cp -r /path/to/tdd-skills-toolkit/skills .claude/

# 复制commands
mkdir -p .claude/commands
cp /path/to/tdd-skills-toolkit/commands/* .claude/commands/

# 验证
ls .claude/skills/      # 应该看到7个skill目录
ls .claude/commands/    # 应该看到3个.md文件
```

### 步骤2: 安装Git Hook

```bash
# 复制预提交hook（Go项目示例）
cp /path/to/tdd-skills-toolkit/automation-templates/git-hooks-tdd.md .git/hooks/pre-commit

# 添加执行权限
chmod +x .git/hooks/pre-commit

# 测试
.git/hooks/pre-commit
```

### 步骤3: 第一个TDD功能

现在让Claude使用TDD开发一个功能：

**示例对话**:
```
你: 帮我实现一个CreateUser功能，接收用户名和邮箱，返回User对象

Claude:
我会使用test-driven-development技能来实现这个功能。

Phase 1: RED - 写失败的测试
[创建测试文件...]

Phase 2: 运行测试确认失败
[运行 go test ...]
✅ 测试失败（符合预期）

Phase 3: GREEN - 最小实现
[编写代码...]

Phase 4: 验证测试通过
[运行 go test ...]
✅ 所有测试通过

Phase 5: REFACTOR
[重构代码...]

✅ 完成！CreateUser已实现并测试
```

### 步骤4: 检查覆盖率

```bash
# 在Claude Code中运行
/analyze-coverage

# 输出示例:
📊 Coverage Analysis Report
Overall Coverage: 92.5%
Target: 80.0%
Status: ✅ PASS
```

---

## 三种典型使用场景

### 场景1: 全新项目（绿地项目）

```bash
# 1. 创建项目
mkdir my-new-app && cd my-new-app
git init

# 2. 安装toolkit
cp -r /path/to/tdd-skills-toolkit/skills .claude/
cp /path/to/tdd-skills-toolkit/commands/* .claude/commands/

# 3. 安装hooks
cp /path/to/tdd-skills-toolkit/automation-templates/git-hooks-tdd.md .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit

# 4. 开始TDD开发
# 每个功能都先写测试，再写实现
```

**典型工作流**:
1. 告诉Claude要实现的功能
2. Claude自动写测试（RED）
3. Claude实现功能（GREEN）
4. Claude重构代码（REFACTOR）
5. 提交代码（hook自动验证）

### 场景2: 遗留代码项目（棕地项目）

```bash
# 1. 安装toolkit
cd /path/to/legacy-project
cp -r /path/to/tdd-skills-toolkit/skills .claude/
cp /path/to/tdd-skills-toolkit/commands/* .claude/commands/

# 2. 为现有代码生成测试
/generate-tests backend/internal/service/user_service.go

# 3. 检查覆盖率
/analyze-coverage

# 4. 补充缺失测试
# 根据coverage report补充测试

# 5. 新功能使用TDD
# 从现在开始，所有新功能都用TDD
```

**典型工作流**:
1. 先用 `/generate-tests` 为关键代码生成测试
2. 用 `/analyze-coverage` 识别盲点
3. 逐步提高覆盖率到80%+
4. 新功能强制TDD开发

### 场景3: 团队协作项目

```bash
# 1. 在主分支安装toolkit
git checkout main
cp -r /path/to/tdd-skills-toolkit/skills .claude/
cp /path/to/tdd-skills-toolkit/commands/* .claude/commands/

# 2. 设置CI/CD
mkdir -p .github/workflows
# 从ci-cd-integration.md复制GitHub Actions配置

# 3. 提交配置
git add .claude/ .github/
git commit -m "chore: add TDD toolkit and CI"
git push

# 4. 团队成员pull后自动获得
git pull
# 每个人的Claude自动使用TDD技能
```

**团队规范**:
- PR必须包含测试
- CI自动检查覆盖率
- 覆盖率低于80%的PR不能合并

---

## 常用命令速查

### /analyze-coverage

分析测试覆盖率

```bash
# 分析整个项目
/analyze-coverage

# 分析特定目录
/analyze-coverage backend/internal/service

# 分析特定文件
/analyze-coverage backend/internal/service/user.go
```

### /generate-tests

为现有代码生成测试

```bash
# 为当前文件生成测试
/generate-tests

# 为指定文件生成测试
/generate-tests backend/internal/service/user.go
```

### /improve-tests

改进现有测试

```bash
# 改进当前测试文件
/improve-tests

# 改进指定测试文件
/improve-tests backend/internal/service/user_test.go
```

---

## 工作流示例

### 完整的TDD开发流程

#### 1. 实现新功能

**需求**: 实现用户登录功能

```
你: 实现用户登录功能，接收用户名密码，返回JWT token

Claude:
使用test-driven-development技能实现。

📝 Phase 1: RED - 写失败的测试

创建 auth_service_test.go:
```go
func TestLogin_Success(t *testing.T) {
    // Arrange
    mockRepo := new(MockUserRepository)
    service := NewAuthService(mockRepo)

    user := &User{
        Username: "testuser",
        Password: hashPassword("password123"),
    }
    mockRepo.On("FindByUsername", "testuser").Return(user, nil)

    // Act
    token, err := service.Login("testuser", "password123")

    // Assert
    require.NoError(t, err)
    assert.NotEmpty(t, token)
}
```

运行测试...
❌ FAIL: Login method不存在（符合预期）

📝 Phase 2: GREEN - 实现功能
[实现Login方法...]

运行测试...
✅ PASS: 所有测试通过

📝 Phase 3: REFACTOR
[提取JWT生成逻辑...]

✅ 完成！
```

#### 2. 提交代码

```bash
git add .
git commit -m "feat: add user login"

# Hook自动运行:
🧪 Running pre-commit TDD checks...
📝 Changed Go files:
  auth_service.go
🎨 Running go fmt... ✅
🔍 Running go vet... ✅
🧪 Running tests... ✅
📊 Checking coverage... ✅ 85.2%

✅ All TDD checks passed!

[main abc123] feat: add user login
```

#### 3. 推送并创建PR

```bash
git push origin feature/user-login

# GitHub Actions自动运行:
# ✅ Code Quality
# ✅ Unit Tests
# ✅ Coverage Check (85.2% >= 80%)
# ✅ TDD Compliance (auth_service_test.go exists)
```

#### 4. Code Review

```bash
# 审查者检查
/improve-tests backend/internal/service/auth_service_test.go

# Claude建议改进:
1. 添加密码错误测试
2. 添加用户不存在测试
3. 测试名称更明确
```

#### 5. 合并

```bash
# 所有检查通过后
git merge feature/user-login

# Dashboard自动更新:
📊 Metrics Updated:
  Coverage: 84.0% → 85.2% ↑
  TDD Score: 87.5% → 88.1% ↑
```

---

## 常见问题

### Q: Claude没有使用TDD技能？

**A**: 检查skill是否正确安装
```bash
ls .claude/skills/test-driven-development/SKILL.md
# 应该存在

# 如果不存在，重新安装
cp -r /path/to/toolkit/skills/test-driven-development .claude/skills/
```

### Q: /analyze-coverage命令不可用？

**A**: 检查command文件
```bash
ls .claude/commands/analyze-coverage.md
# 应该存在

# 如果不存在
cp /path/to/toolkit/commands/analyze-coverage.md .claude/commands/
```

### Q: Git hook不执行？

**A**: 检查权限
```bash
ls -la .git/hooks/pre-commit
# 应该有执行权限 (x)

# 添加权限
chmod +x .git/hooks/pre-commit
```

### Q: 如何临时跳过hook？

**A**: 使用 `--no-verify`（仅紧急情况）
```bash
git commit --no-verify -m "hotfix: urgent fix"

# 记得后续补充测试！
```

### Q: 如何调整覆盖率阈值？

**A**: 编辑hook文件
```bash
# 编辑 .git/hooks/pre-commit
COVERAGE_THRESHOLD=85  # 从80改为85
```

---

## 最佳实践

### DO（推荐做法）

✅ **总是先写测试**
- 让测试失败（RED）
- 然后实现（GREEN）
- 最后重构（REFACTOR）

✅ **提交前运行覆盖率分析**
```bash
/analyze-coverage
```

✅ **定期改进测试**
```bash
/improve-tests
```

✅ **为所有新代码写测试**
- Pre-commit hook会强制执行

✅ **Code Review检查测试质量**
- 不只看实现，也要审查测试

### DON'T（避免做法）

❌ **不要先写代码再补测试**
- 违背TDD原则
- 测试质量低

❌ **不要绕过Git hooks**
```bash
# 除非紧急情况，不要用:
git commit --no-verify
```

❌ **不要降低覆盖率阈值**
```bash
# 不要为了通过检查而降低标准
COVERAGE_THRESHOLD=50  # ❌ 太低
```

❌ **不要忽略coverage report建议**
- Coverage gap通常指向缺失的测试

❌ **不要删除"麻烦"的测试**
- 测试难写说明设计有问题
- 应该重构设计，不是删测试

---

## 下一步

掌握基础后:

1. **配置CI/CD**: 参考 `automation-templates/ci-cd-integration.md`
2. **设置Dashboard**: 参考 `automation-templates/test-dashboard.md`
3. **学习高级技能**:
   - `test-refactoring`: 重构测试代码
   - `test-review`: 审查测试质量
   - `flaky-test-detection`: 修复不稳定测试
4. **团队推广**: 分享TDD最佳实践

---

## 资源

- **完整文档**: `README.md`
- **安装指南**: `INSTALL.md`
- **Skill文档**: `skills/*/SKILL.md`
- **自动化模板**: `automation-templates/`

开始TDD之旅！🚀
