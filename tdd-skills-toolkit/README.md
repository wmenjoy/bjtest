# TDD Skills Toolkit

> 可重用的测试驱动开发（TDD）技能集合和自动化工具包
> Version: 1.0.0

## 概述

这是一个完整的TDD工具包，可以直接集成到任何项目中，为Claude Code提供专业的测试驱动开发技能支持和自动化enforcement。

**包含内容**:
- 7个专业测试技能（Skills）
- 3个测试命令（Commands）
- 3个自动化模板（Git Hooks、CI/CD、Dashboard）
- 完整的安装和使用指南

**支持语言**: Go, JavaScript/TypeScript, Python, Java, C++, Rust

## 目录结构

```
tdd-skills-toolkit/
├── README.md                          # 本文件
├── INSTALL.md                         # 详细安装指南
├── skills/                            # Claude Code技能
│   ├── test-driven-development/       # 核心TDD技能（含automation集成）
│   ├── coverage-analyzer/             # 覆盖率分析
│   ├── test-generation-expert/        # 测试生成专家
│   ├── test-hooks/                    # 测试生命周期hooks
│   ├── test-refactoring/              # 测试重构
│   ├── test-review/                   # 测试代码审查
│   └── flaky-test-detection/          # 不稳定测试检测
├── commands/                          # Claude Code斜杠命令
│   ├── analyze-coverage.md            # /analyze-coverage
│   ├── generate-tests.md              # /generate-tests
│   └── improve-tests.md               # /improve-tests
├── automation-templates/              # 自动化模板
│   ├── git-hooks-tdd.md               # Git hooks模板
│   ├── ci-cd-integration.md           # CI/CD pipeline模板
│   └── test-dashboard.md              # 测试指标仪表板
└── docs/                              # 说明文档
    └── quick-start.md                 # 快速开始指南
```

## 快速开始

### 方法1: 完整安装（推荐）

将整个toolkit复制到目标项目：

```bash
# 1. 复制toolkit到目标项目根目录
cp -r tdd-skills-toolkit /path/to/your/project/

# 2. 安装skills到Claude配置
cd /path/to/your/project
mkdir -p .claude/skills .claude/commands

# 3. 链接skills
cp -r tdd-skills-toolkit/skills/* .claude/skills/

# 4. 链接commands
cp tdd-skills-toolkit/commands/* .claude/commands/

# 5. 验证安装
ls .claude/skills/  # 应该看到7个skill目录
ls .claude/commands/ # 应该看到3个命令文件
```

### 方法2: 符号链接（适合多项目共享）

```bash
# 1. 将toolkit放在中央位置
mv tdd-skills-toolkit ~/shared-resources/

# 2. 在每个项目中创建符号链接
cd /path/to/project1
mkdir -p .claude/skills .claude/commands

ln -s ~/shared-resources/tdd-skills-toolkit/skills/* .claude/skills/
ln -s ~/shared-resources/tdd-skills-toolkit/commands/* .claude/commands/

# 3. 对其他项目重复步骤2
```

### 方法3: 选择性安装

只安装需要的skills：

```bash
cd /path/to/your/project
mkdir -p .claude/skills .claude/commands

# 只安装核心TDD技能
cp -r /path/to/tdd-skills-toolkit/skills/test-driven-development .claude/skills/

# 只安装覆盖率分析
cp -r /path/to/tdd-skills-toolkit/skills/coverage-analyzer .claude/skills/
cp /path/to/tdd-skills-toolkit/commands/analyze-coverage.md .claude/commands/
```

## 技能说明

### 核心技能

#### 1. test-driven-development
**用途**: 实现任何功能或修复bug时，强制RED-GREEN-REFACTOR循环

**何时使用**:
- 实现新功能
- 修复bug
- 重构代码

**关键特性**:
- 强制测试优先（必须先看到测试失败）
- 集成自动化enforcement（Git hooks、CI/CD、Dashboard）
- 防止rationalization（合理化跳过TDD的借口）

**调用**:
```
Claude会在实现代码前自动使用此技能
用户无需显式调用
```

#### 2. coverage-analyzer
**用途**: 分析测试覆盖率，识别未测试的代码路径

**何时使用**:
- 完成功能后验证覆盖率
- 识别测试盲点
- 确保达到覆盖率目标

**调用**:
```bash
/analyze-coverage
/analyze-coverage backend/internal/service
```

**输出示例**:
```
📊 Coverage Analysis Report

Overall Coverage: 84.6%
Target: 80.0%
Status: ✅ PASS

By Module:
  environment_service.go: 84.6% (38/45 statements)
  project_service.go: 78.5% (40/51 statements)

Missing Coverage:
  environment_service.go:156-158 (error handling)
  environment_service.go:201-203 (edge case)

Recommendations:
  1. Add test for error case at line 156
  2. Add test for nil validation at line 201
```

#### 3. test-generation-expert
**用途**: 为现有代码生成全面的测试套件

**何时使用**:
- 为旧代码添加测试（遗留代码）
- 为第三方代码补充测试
- 快速建立测试基线

**不要用于**:
- 新功能开发（应使用TDD）
- 已经有测试的代码

**调用**:
```bash
/generate-tests
/generate-tests backend/internal/service/environment_service.go
```

#### 4. test-refactoring
**用途**: 重构测试代码，提高测试质量和可维护性

**何时使用**:
- 测试有重复代码
- 测试名称不清晰
- 测试难以理解
- 测试过于脆弱

**关键原则**:
- 只在测试全部通过（GREEN）时重构
- 重构后测试必须仍然通过
- 不改变测试验证的行为

#### 5. test-review
**用途**: 审查测试代码质量，确保符合最佳实践

**何时使用**:
- Code Review时审查测试
- 合并PR前验证测试质量
- 定期审查测试健康度

#### 6. flaky-test-detection
**用途**: 检测和修复不稳定的测试（间歇性失败）

**何时使用**:
- 测试有时pass有时fail
- CI pipeline不稳定
- 测试依赖执行顺序

#### 7. test-hooks
**用途**: 正确使用测试生命周期hooks（setup/teardown）

**何时使用**:
- 测试需要数据库连接
- 测试需要临时文件
- 测试需要清理资源

**关键原则**:
- 每个测试必须独立（FIRST原则）
- 不共享可变状态
- 始终清理资源

## 命令说明

### /analyze-coverage

分析测试覆盖率并生成详细报告。

**参数**:
- 无参数: 分析整个项目
- 路径: 分析指定目录或文件

**示例**:
```bash
/analyze-coverage                           # 全项目分析
/analyze-coverage backend/internal/service  # 特定目录
```

**输出**:
- 总体覆盖率
- 模块级覆盖率
- 未覆盖代码行
- 改进建议

### /generate-tests

为现有代码生成测试套件。

**参数**:
- 无参数: 生成当前打开文件的测试
- 路径: 生成指定文件的测试

**示例**:
```bash
/generate-tests                                      # 当前文件
/generate-tests backend/internal/service/user.go    # 指定文件
```

**输出**:
- 完整的测试文件
- 边界情况测试
- 错误处理测试
- Mock对象

### /improve-tests

改进现有测试的质量。

**参数**:
- 无参数: 改进当前测试文件
- 路径: 改进指定测试文件

**示例**:
```bash
/improve-tests                                          # 当前测试
/improve-tests backend/internal/service/user_test.go   # 指定测试
```

**改进内容**:
- 测试名称优化
- AAA结构调整
- 重复代码提取
- 断言改进

## 自动化集成

### Git Hooks

**模板位置**: `automation-templates/git-hooks-tdd.md`

**安装**:
```bash
# 1. 复制pre-commit hook
cp automation-templates/git-hooks-tdd.md .git/hooks/pre-commit

# 2. 添加执行权限
chmod +x .git/hooks/pre-commit

# 3. 测试
.git/hooks/pre-commit
```

**功能**:
- 提交前自动运行测试
- 检查代码格式
- 验证覆盖率阈值
- 阻止未测试代码提交

**支持语言**:
- Go (go fmt, go vet, go test)
- JavaScript/TypeScript (ESLint, Jest)
- Python (black, flake8, pytest)

### CI/CD Pipeline

**模板位置**: `automation-templates/ci-cd-integration.md`

**支持平台**:
- GitHub Actions
- GitLab CI
- Jenkins Pipeline
- CircleCI

**功能**:
1. 代码质量检查
2. 单元测试运行
3. 集成测试运行
4. TDD合规性检查
5. 覆盖率报告上传

**GitHub Actions示例**:
```yaml
# .github/workflows/tdd-enforcement.yml
name: TDD Enforcement

on:
  pull_request:
    branches: [main]

jobs:
  tdd-compliance:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Check test coverage
        run: go test -coverprofile=coverage.out ./...
      # 更多步骤见模板文件
```

### Test Dashboard

**模板位置**: `automation-templates/test-dashboard.md`

**实现方案**:
1. **Grafana + Prometheus** (企业级)
2. **GitHub Actions + Badges** (轻量级)
3. **自定义Dashboard** (完全控制)

**关键指标**:
- TDD合规性评分 (0-100)
- 测试覆盖率趋势
- 测试质量评分
- CI通过率
- Flaky测试率

## 使用示例

### 场景1: 新项目初始化

```bash
# 1. 创建新项目
mkdir my-new-project && cd my-new-project
git init

# 2. 安装TDD toolkit
cp -r /path/to/tdd-skills-toolkit/skills .claude/
cp /path/to/tdd-skills-toolkit/commands/* .claude/commands/

# 3. 安装Git hooks
cp /path/to/tdd-skills-toolkit/automation-templates/git-hooks-tdd.md .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit

# 4. 设置CI/CD
mkdir -p .github/workflows
# 从ci-cd-integration.md复制模板

# 5. 开始TDD开发
# Claude会自动使用test-driven-development skill
```

### 场景2: 为遗留项目添加测试

```bash
# 1. 安装toolkit
cp -r /path/to/tdd-skills-toolkit/skills .claude/
cp /path/to/tdd-skills-toolkit/commands/* .claude/commands/

# 2. 分析覆盖率
/analyze-coverage

# 3. 为现有代码生成测试
/generate-tests backend/internal/service/legacy_service.go

# 4. 审查生成的测试
/improve-tests backend/internal/service/legacy_service_test.go

# 5. 运行测试
go test ./...

# 6. 验证覆盖率
/analyze-coverage
```

### 场景3: 多项目共享

```bash
# 1. 将toolkit放在中央位置
mv tdd-skills-toolkit ~/shared-tdd-toolkit/

# 2. 为每个项目创建符号链接
cd ~/projects/project-a
ln -s ~/shared-tdd-toolkit/skills .claude/skills
ln -s ~/shared-tdd-toolkit/commands/* .claude/commands/

cd ~/projects/project-b
ln -s ~/shared-tdd-toolkit/skills .claude/skills
ln -s ~/shared-tdd-toolkit/commands/* .claude/commands/

# 3. 更新toolkit时，所有项目自动同步
cd ~/shared-tdd-toolkit/skills/test-driven-development
# 编辑SKILL.md
# 所有链接的项目立即获得更新
```

## 配置自定义

### 调整覆盖率阈值

**在Git hooks中**:
```bash
# 编辑 .git/hooks/pre-commit
COVERAGE_THRESHOLD=85  # 从80改为85
```

**在CI/CD中**:
```yaml
# .github/workflows/tdd-enforcement.yml
env:
  COVERAGE_THRESHOLD: 85
```

### 自定义测试质量评分

编辑 `automation-templates/test-dashboard.md` 中的权重：

```yaml
test_quality_score:
  naming_clarity: /25      # 从20改为25
  aaa_structure: /20
  independence: /15
  edge_cases: /10          # 从15改为10
  maintainability: /15
  assertion_quality: /10
  no_anti_patterns: /5
total: /100
```

## 故障排查

### Skill未加载

**问题**: Claude没有使用TDD技能

**解决**:
```bash
# 检查skill是否正确安装
ls -la .claude/skills/test-driven-development/

# 验证SKILL.md存在
cat .claude/skills/test-driven-development/SKILL.md

# 重启Claude Code
```

### Command未识别

**问题**: `/analyze-coverage` 命令不可用

**解决**:
```bash
# 检查命令文件
ls -la .claude/commands/analyze-coverage.md

# 验证文件格式
head -5 .claude/commands/analyze-coverage.md

# 应该看到 "---" YAML front matter
```

### Git Hook不执行

**问题**: 提交时hook不运行

**解决**:
```bash
# 检查权限
ls -la .git/hooks/pre-commit

# 应该显示 -rwxr-xr-x (可执行)
# 如果不是，添加权限
chmod +x .git/hooks/pre-commit

# 测试hook
.git/hooks/pre-commit
```

### 覆盖率检查失败

**问题**: Hook报告覆盖率不足

**解决**:
```bash
# 手动运行覆盖率检查
go test -coverprofile=coverage.out ./...
go tool cover -func=coverage.out

# 查看详细报告
go tool cover -html=coverage.out -o coverage.html
open coverage.html

# 添加缺失的测试
/analyze-coverage
# 根据建议补充测试
```

## 版本更新

### 检查更新

```bash
cd tdd-skills-toolkit
cat README.md | grep "Version:"  # 查看当前版本
```

### 更新toolkit

```bash
# 1. 备份当前版本
cp -r .claude/skills .claude/skills.backup

# 2. 下载新版本toolkit
# (从源项目复制最新版本)

# 3. 替换旧版本
rm -rf .claude/skills/test-*
cp -r /path/to/new-toolkit/skills/* .claude/skills/

# 4. 验证
ls .claude/skills/
```

## 贡献指南

### 添加新的Skill

1. 在 `skills/` 目录创建新目录
2. 添加 `SKILL.md` 文件（遵循现有格式）
3. 更新本README的"技能说明"部分
4. 提供使用示例

### 添加新的Command

1. 在 `commands/` 目录创建 `.md` 文件
2. 添加YAML front matter
3. 编写命令提示词
4. 更新本README的"命令说明"部分

### 改进Automation模板

1. 更新 `automation-templates/` 中的模板
2. 确保向后兼容
3. 更新相关文档
4. 提供迁移指南（如果breaking change）

## 许可证

本工具包基于实际项目经验开发，遵循最佳测试实践。可自由用于任何项目。

## 支持

**问题反馈**:
- 在源项目创建Issue
- 提供详细的错误信息和环境

**文档**:
- 详细安装指南: `INSTALL.md`
- 快速开始: `docs/quick-start.md`
- 各skill的详细说明: `skills/*/SKILL.md`

## 更新日志

### v1.0.0 (2025-12-09)
- 初始版本
- 包含7个测试技能
- 包含3个测试命令
- 包含3个自动化模板
- 完整的安装和使用指南
