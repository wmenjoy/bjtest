# TDD Skills Toolkit - 开始使用

## 目录结构

```
tdd-skills-toolkit/
├── README.md                          # 工具包概览和功能说明
├── INSTALL.md                         # 详细安装指南
├── GETTING-STARTED.md                 # 本文件 - 快速上手
├── skills/                            # 7个TDD技能
│   ├── test-driven-development/       # 核心TDD流程
│   ├── coverage-analyzer/             # 覆盖率分析
│   ├── test-generation-expert/        # 测试生成
│   ├── test-hooks/                    # 测试生命周期hooks
│   ├── test-refactoring/              # 测试重构
│   ├── test-review/                   # 测试审查
│   └── flaky-test-detection/          # 不稳定测试检测
├── commands/                          # 3个斜杠命令
│   ├── analyze-coverage.md            # /analyze-coverage
│   ├── generate-tests.md              # /generate-tests
│   └── improve-tests.md               # /improve-tests
├── automation-templates/              # 自动化enforcement模板
│   ├── git-hooks-tdd.md               # Git pre-commit hooks
│   ├── ci-cd-integration.md           # CI/CD pipeline配置
│   └── test-dashboard.md              # 测试指标仪表板
└── docs/                              # 使用文档
    ├── quick-start.md                 # 5分钟快速开始
    └── examples.md                    # 实际应用示例

总计: 7 skills + 3 commands + 3 automation templates + 完整文档
```

## 30秒快速安装

```bash
# 1. 进入你的项目
cd /path/to/your/project

# 2. 复制skills
cp -r /path/to/tdd-skills-toolkit/skills .claude/

# 3. 复制commands
mkdir -p .claude/commands
cp /path/to/tdd-skills-toolkit/commands/* .claude/commands/

# 4. 完成！Claude会自动使用TDD技能
```

## 5分钟完整设置

```bash
# 1. 安装skills和commands（同上）
cp -r /path/to/tdd-skills-toolkit/skills .claude/
cp /path/to/tdd-skills-toolkit/commands/* .claude/commands/

# 2. 安装Git hooks
cp /path/to/tdd-skills-toolkit/automation-templates/git-hooks-tdd.md .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit

# 3. 配置CI/CD（GitHub Actions示例）
mkdir -p .github/workflows
# 从automation-templates/ci-cd-integration.md复制模板

# 4. 验证安装
ls .claude/skills/     # 应看到7个skill目录
.git/hooks/pre-commit  # 测试hook
```

## 核心功能

### 1. 自动TDD开发
- Claude自动使用RED-GREEN-REFACTOR循环
- 强制测试优先（不允许先写代码）
- 防止rationalization（合理化跳过测试的借口）

### 2. 覆盖率分析
```bash
/analyze-coverage                    # 分析整个项目
/analyze-coverage backend/service    # 分析特定目录
```

### 3. 测试生成
```bash
/generate-tests path/to/file.go     # 为现有代码生成测试
```

### 4. 自动化Enforcement
- Git pre-commit hooks: 提交前自动运行测试
- CI/CD pipeline: 强制质量门禁
- Test dashboard: 可视化监控TDD合规性

## 支持语言

- ✅ Go (完整支持)
- ✅ JavaScript/TypeScript (Jest, Vitest)
- ✅ Python (pytest, unittest)
- ✅ Java (JUnit, TestNG)
- ✅ C++ (Google Test)
- ✅ Rust (cargo test)

## 第一次使用

### 新功能开发示例

**你说**:
```
实现一个CreateUser功能，接收用户名和邮箱
```

**Claude自动执行**:
1. Phase 1 (RED): 写失败的测试
2. Phase 2: 运行测试，确认失败
3. Phase 3 (GREEN): 写最小实现
4. Phase 4: 运行测试，确认通过
5. Phase 5 (REFACTOR): 清理代码

**结果**:
- ✅ 功能实现
- ✅ 测试覆盖
- ✅ 代码质量

### Bug修复示例

**你说**:
```
修复bug: GetUser在用户不存在时panic
```

**Claude自动执行**:
1. 写测试复现bug
2. 运行测试确认复现
3. 修复代码
4. 验证测试通过
5. Bug不会再复发

### 遗留代码加测试

```bash
# 为现有代码生成测试
/generate-tests backend/service/payment.go

# 检查覆盖率
/analyze-coverage

# 改进测试质量
/improve-tests backend/service/payment_test.go
```

## 下一步

1. **阅读详细文档**:
   - `README.md` - 完整功能介绍
   - `INSTALL.md` - 安装指南（3种方式）
   - `docs/quick-start.md` - 快速开始教程
   - `docs/examples.md` - 真实使用示例

2. **配置自动化**:
   - Git Hooks: 防止未测试代码提交
   - CI/CD: 强制质量门禁
   - Dashboard: 监控TDD合规性

3. **学习高级功能**:
   - 测试重构 (test-refactoring)
   - 测试审查 (test-review)
   - 不稳定测试检测 (flaky-test-detection)

## 获取帮助

- 📖 完整文档: 各文件的README和SKILL.md
- 💡 示例: `docs/examples.md`
- 🔧 故障排查: `INSTALL.md#故障排查`

## 核心原则

> **No production code without a failing test first**
>
> 没有先失败的测试，就不写生产代码

这个toolkit让这个原则自动执行，无需人工记忆。

---

**现在开始TDD之旅！** 🚀

进入你的项目，复制skills，让Claude自动使用TDD开发。
