# TDD Skills Toolkit - 安装指南

> 详细的分步安装说明

## 前置要求

### 必需
- Claude Code CLI installed
- Git installed
- 目标项目已初始化Git仓库

### 可选（根据语言）
- **Go**: Go 1.20+
- **JavaScript/TypeScript**: Node.js 18+, npm/pnpm
- **Python**: Python 3.8+, pytest
- **Java**: JDK 11+, Maven/Gradle

## 安装方式选择

### 方式1: 完整安装（推荐新项目）

适用于:
- ✅ 新建项目
- ✅ 希望完全采用TDD流程
- ✅ 需要所有功能

### 方式2: 符号链接（推荐多项目）

适用于:
- ✅ 多个项目共享同一套技能
- ✅ 需要集中管理和更新
- ✅ 不希望重复复制文件

### 方式3: 选择性安装（定制需求）

适用于:
- ✅ 只需要部分功能
- ✅ 已有部分测试基础设施
- ✅ 希望逐步引入TDD

---

## 方式1: 完整安装

### 步骤1: 准备目标项目

```bash
# 进入目标项目根目录
cd /path/to/your/project

# 确认是Git仓库
git status  # 应该能正常显示

# 创建Claude配置目录
mkdir -p .claude/skills .claude/commands
```

### 步骤2: 复制Skills

```bash
# 从toolkit复制所有skills
cp -r /path/to/tdd-skills-toolkit/skills/* .claude/skills/

# 验证安装
ls .claude/skills/
# 应该显示:
# coverage-analyzer/
# flaky-test-detection/
# test-driven-development/
# test-generation-expert/
# test-hooks/
# test-refactoring/
# test-review/
```

### 步骤3: 复制Commands

```bash
# 复制所有测试命令
cp /path/to/tdd-skills-toolkit/commands/* .claude/commands/

# 验证安装
ls .claude/commands/
# 应该显示:
# analyze-coverage.md
# generate-tests.md
# improve-tests.md
```

### 步骤4: 安装Git Hooks

#### Go项目

```bash
# 复制Go pre-commit hook模板
# 从 automation-templates/git-hooks-tdd.md 复制 Go Pre-commit Hook 部分

cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
# Pre-commit hook for Go projects
# Enforces TDD by running tests before commit

set -e

echo "🧪 Running pre-commit TDD checks..."

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if Go files changed
GO_FILES=$(git diff --cached --name-only --diff-filter=ACM | grep '\.go$' | grep -v '_test\.go$' || true)

if [ -z "$GO_FILES" ]; then
    echo "✅ No Go source files changed, skipping tests"
    exit 0
fi

echo -e "${YELLOW}📝 Changed Go files:${NC}"
echo "$GO_FILES"

# Run go fmt
echo -e "\n${YELLOW}🎨 Running go fmt...${NC}"
if ! gofmt -l $GO_FILES | grep -q '.'; then
    echo -e "${GREEN}✅ Code formatting OK${NC}"
else
    echo -e "${RED}❌ Code not formatted. Run: go fmt ./...${NC}"
    exit 1
fi

# Run go vet
echo -e "\n${YELLOW}🔍 Running go vet...${NC}"
if go vet ./...; then
    echo -e "${GREEN}✅ Go vet passed${NC}"
else
    echo -e "${RED}❌ Go vet failed${NC}"
    exit 1
fi

# Run tests
echo -e "\n${YELLOW}🧪 Running tests...${NC}"
if go test -v ./...; then
    echo -e "${GREEN}✅ All tests passed${NC}"
else
    echo -e "${RED}❌ Tests failed${NC}"
    exit 1
fi

# Check coverage
echo -e "\n${YELLOW}📊 Checking test coverage...${NC}"
COVERAGE_THRESHOLD=80

go test -coverprofile=coverage.out ./... > /dev/null 2>&1

if [ -f coverage.out ]; then
    COVERAGE=$(go tool cover -func=coverage.out | grep total | awk '{print $3}' | sed 's/%//')

    echo "Current coverage: ${COVERAGE}%"
    echo "Required coverage: ${COVERAGE_THRESHOLD}%"

    if (( $(echo "$COVERAGE < $COVERAGE_THRESHOLD" | bc -l) )); then
        echo -e "${RED}❌ Coverage ${COVERAGE}% is below threshold ${COVERAGE_THRESHOLD}%${NC}"
        rm coverage.out
        exit 1
    else
        echo -e "${GREEN}✅ Coverage check passed (${COVERAGE}%)${NC}"
    fi

    rm coverage.out
fi

echo -e "\n${GREEN}✅ All TDD checks passed!${NC}"
exit 0
EOF

# 添加执行权限
chmod +x .git/hooks/pre-commit

# 测试hook
.git/hooks/pre-commit
```

#### JavaScript/TypeScript项目

```bash
# 安装Husky
npm install --save-dev husky
npx husky install

# 添加pre-commit hook
npx husky add .husky/pre-commit "npm run lint && npm test"

# 配置package.json
cat >> package.json << 'EOF'
{
  "scripts": {
    "prepare": "husky install",
    "lint": "eslint .",
    "test": "jest --passWithNoTests",
    "test:coverage": "jest --coverage"
  }
}
EOF

# 测试
npm run lint
npm test
```

#### Python项目

```bash
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
set -e

echo "🧪 Running pre-commit TDD checks..."

RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

# Check if Python files changed
PY_FILES=$(git diff --cached --name-only --diff-filter=ACM | grep '\.py$' | grep -v 'test_.*\.py$' || true)

if [ -z "$PY_FILES" ]; then
    echo "✅ No Python source files changed"
    exit 0
fi

# Run black
echo "🎨 Running black..."
if black --check $PY_FILES; then
    echo -e "${GREEN}✅ Code formatting OK${NC}"
else
    echo -e "${RED}❌ Code not formatted. Run: black .${NC}"
    exit 1
fi

# Run flake8
echo "🔍 Running flake8..."
if flake8 $PY_FILES; then
    echo -e "${GREEN}✅ Linting passed${NC}"
else
    echo -e "${RED}❌ Linting failed${NC}"
    exit 1
fi

# Run tests
echo "🧪 Running pytest..."
if pytest; then
    echo -e "${GREEN}✅ All tests passed${NC}"
else
    echo -e "${RED}❌ Tests failed${NC}"
    exit 1
fi

# Check coverage
COVERAGE_THRESHOLD=80
pytest --cov=. --cov-report=term-missing | tee /tmp/coverage.txt
COVERAGE=$(grep "TOTAL" /tmp/coverage.txt | awk '{print $4}' | sed 's/%//')

if (( $(echo "$COVERAGE < $COVERAGE_THRESHOLD" | bc -l) )); then
    echo -e "${RED}❌ Coverage ${COVERAGE}% below threshold${NC}"
    exit 1
else
    echo -e "${GREEN}✅ Coverage check passed (${COVERAGE}%)${NC}"
fi

rm /tmp/coverage.txt
exit 0
EOF

chmod +x .git/hooks/pre-commit
```

### 步骤5: 配置CI/CD

#### GitHub Actions

```bash
# 创建workflow目录
mkdir -p .github/workflows

# 创建TDD enforcement workflow
cat > .github/workflows/tdd-enforcement.yml << 'EOF'
name: TDD Enforcement

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  code-quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Set up Go
        uses: actions/setup-go@v4
        with:
          go-version: '1.21'

      - name: Run go fmt
        run: |
          if [ "$(gofmt -s -l . | wc -l)" -gt 0 ]; then
            echo "❌ Code not formatted"
            gofmt -s -l .
            exit 1
          fi

      - name: Run go vet
        run: go vet ./...

  unit-tests:
    runs-on: ubuntu-latest
    needs: code-quality
    steps:
      - uses: actions/checkout@v3

      - name: Set up Go
        uses: actions/setup-go@v4
        with:
          go-version: '1.21'

      - name: Run tests
        run: go test -v -race -coverprofile=coverage.out ./...

      - name: Check coverage
        run: |
          COVERAGE=$(go tool cover -func=coverage.out | grep total | awk '{print $3}' | sed 's/%//')
          THRESHOLD=80

          echo "Coverage: ${COVERAGE}%"
          echo "Threshold: ${THRESHOLD}%"

          if (( $(echo "$COVERAGE < $THRESHOLD" | bc -l) )); then
            echo "❌ Coverage below threshold"
            exit 1
          fi

      - name: Upload to Codecov
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage.out

  tdd-compliance:
    runs-on: ubuntu-latest
    if: github.event_name == 'pull_request'
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0

      - name: Check for untested code
        run: |
          CHANGED_FILES=$(git diff --name-only origin/${{ github.base_ref }}...HEAD | grep '\.go$' | grep -v '_test\.go$' || true)

          if [ -z "$CHANGED_FILES" ]; then
            echo "✅ No source files changed"
            exit 0
          fi

          for file in $CHANGED_FILES; do
            TEST_FILE="${file%.go}_test.go"
            if [ ! -f "$TEST_FILE" ]; then
              echo "❌ Missing test: $TEST_FILE"
              exit 1
            fi
          done

          echo "✅ All files have tests"
EOF

# 提交workflow
git add .github/workflows/tdd-enforcement.yml
git commit -m "chore: add TDD enforcement workflow"
```

#### GitLab CI

```bash
cat > .gitlab-ci.yml << 'EOF'
stages:
  - lint
  - test

variables:
  COVERAGE_THRESHOLD: "80"

lint:
  stage: lint
  image: golang:1.21
  script:
    - go fmt ./...
    - go vet ./...
    - if [ "$(gofmt -s -l . | wc -l)" -gt 0 ]; then exit 1; fi

unit-test:
  stage: test
  image: golang:1.21
  coverage: '/total:.*?(\d+\.\d+)%/'
  script:
    - go test -v -race -coverprofile=coverage.out ./...
    - go tool cover -func=coverage.out
    - |
      COVERAGE=$(go tool cover -func=coverage.out | grep total | awk '{print $3}' | sed 's/%//')
      if (( $(echo "$COVERAGE < $COVERAGE_THRESHOLD" | bc -l) )); then
        echo "Coverage below threshold"
        exit 1
      fi
  artifacts:
    paths:
      - coverage.out
EOF

git add .gitlab-ci.yml
git commit -m "chore: add GitLab CI configuration"
```

### 步骤6: 验证安装

```bash
# 1. 验证skills加载
# 启动Claude Code，应该能看到skills生效

# 2. 测试命令
# 在Claude Code中运行:
/analyze-coverage

# 3. 测试Git hook
echo "test" >> test.txt
git add test.txt
git commit -m "test hook"
# 应该看到hook执行

# 4. 推送到远程触发CI
git push origin main
# 检查GitHub Actions或GitLab CI运行
```

---

## 方式2: 符号链接安装

### 步骤1: 选择中央位置

```bash
# 将toolkit移到中央目录
mv tdd-skills-toolkit ~/shared-resources/tdd-toolkit

# 或者其他合适的位置
# mv tdd-skills-toolkit /opt/tdd-toolkit
# mv tdd-skills-toolkit ~/.config/claude/tdd-toolkit
```

### 步骤2: 为项目创建链接

```bash
# 进入第一个项目
cd ~/projects/project-1

# 创建skills链接
mkdir -p .claude
ln -s ~/shared-resources/tdd-toolkit/skills .claude/skills

# 创建commands链接
mkdir -p .claude/commands
for cmd in ~/shared-resources/tdd-toolkit/commands/*.md; do
    ln -s "$cmd" .claude/commands/
done

# 验证
ls -la .claude/skills      # 应显示 -> ~/shared-resources/...
ls -la .claude/commands/   # 应显示符号链接
```

### 步骤3: 为其他项目重复

```bash
# 项目2
cd ~/projects/project-2
mkdir -p .claude
ln -s ~/shared-resources/tdd-toolkit/skills .claude/skills
mkdir -p .claude/commands
for cmd in ~/shared-resources/tdd-toolkit/commands/*.md; do
    ln -s "$cmd" .claude/commands/
done

# 项目3
cd ~/projects/project-3
# 重复相同步骤
```

### 步骤4: Git Hooks和CI/CD

```bash
# Git hooks需要在每个项目单独配置
# 因为 .git/hooks 不能是符号链接

# 可以创建脚本自动安装
cat > ~/shared-resources/install-hooks.sh << 'EOF'
#!/bin/bash
# 为当前项目安装Git hooks

TOOLKIT_DIR="$HOME/shared-resources/tdd-toolkit"

# 检测语言
if [ -f "go.mod" ]; then
    echo "Detected Go project"
    # 复制Go hook
elif [ -f "package.json" ]; then
    echo "Detected JavaScript/TypeScript project"
    # 安装Husky
elif [ -f "requirements.txt" ]; then
    echo "Detected Python project"
    # 复制Python hook
fi

# ... (从automation-templates复制对应hook)
EOF

chmod +x ~/shared-resources/install-hooks.sh

# 在每个项目运行
cd ~/projects/project-1
~/shared-resources/install-hooks.sh
```

### 优点
- ✅ 更新一次，所有项目同步
- ✅ 节省磁盘空间
- ✅ 集中管理

### 注意事项
- ⚠️ Git hooks仍需单独配置
- ⚠️ CI/CD配置需要复制到每个项目
- ⚠️ 删除中央目录会影响所有项目

---

## 方式3: 选择性安装

### 最小安装（只要核心TDD）

```bash
cd /path/to/project
mkdir -p .claude/skills .claude/commands

# 只安装核心TDD技能
cp -r /path/to/tdd-skills-toolkit/skills/test-driven-development .claude/skills/

# 完成！Claude会在写代码时自动使用TDD
```

### 基础安装（TDD + 覆盖率）

```bash
mkdir -p .claude/skills .claude/commands

# TDD技能
cp -r /path/to/tdd-skills-toolkit/skills/test-driven-development .claude/skills/

# 覆盖率分析
cp -r /path/to/tdd-skills-toolkit/skills/coverage-analyzer .claude/skills/
cp /path/to/tdd-skills-toolkit/commands/analyze-coverage.md .claude/commands/

# 使用
# Claude自动TDD开发
# 手动运行: /analyze-coverage
```

### 标准安装（TDD + 覆盖率 + 测试生成）

```bash
mkdir -p .claude/skills .claude/commands

# 核心技能
cp -r /path/to/tdd-skills-toolkit/skills/test-driven-development .claude/skills/
cp -r /path/to/tdd-skills-toolkit/skills/coverage-analyzer .claude/skills/
cp -r /path/to/tdd-skills-toolkit/skills/test-generation-expert .claude/skills/

# 命令
cp /path/to/tdd-skills-toolkit/commands/analyze-coverage.md .claude/commands/
cp /path/to/tdd-skills-toolkit/commands/generate-tests.md .claude/commands/

# 适用场景：遗留代码项目
# 1. 用 /generate-tests 为现有代码生成测试
# 2. 用 /analyze-coverage 检查覆盖率
# 3. 新功能使用TDD开发
```

### 完整安装（所有功能）

参见"方式1: 完整安装"

---

## 卸载

### 完整卸载

```bash
cd /path/to/project

# 删除skills
rm -rf .claude/skills/test-*
rm -rf .claude/skills/coverage-analyzer
rm -rf .claude/skills/flaky-test-detection

# 删除commands
rm .claude/commands/analyze-coverage.md
rm .claude/commands/generate-tests.md
rm .claude/commands/improve-tests.md

# 删除Git hooks
rm .git/hooks/pre-commit
rm .git/hooks/pre-push

# 删除CI配置
rm .github/workflows/tdd-enforcement.yml
# 或
rm .gitlab-ci.yml
```

### 卸载符号链接

```bash
# 删除链接（不影响源文件）
rm .claude/skills
rm .claude/commands/*.md

# 删除hooks
rm .git/hooks/pre-commit
```

---

## 升级

### 检查版本

```bash
# 查看当前安装的版本
cat .claude/skills/test-driven-development/SKILL.md | head -20

# 查看toolkit版本
cat /path/to/tdd-skills-toolkit/README.md | grep "Version:"
```

### 升级步骤

```bash
# 1. 备份当前配置
cp -r .claude .claude.backup

# 2. 删除旧版本
rm -rf .claude/skills/test-*
rm -rf .claude/skills/coverage-analyzer
rm -rf .claude/skills/flaky-test-detection

# 3. 安装新版本
cp -r /path/to/new-tdd-toolkit/skills/* .claude/skills/
cp /path/to/new-tdd-toolkit/commands/* .claude/commands/

# 4. 验证
ls .claude/skills/

# 5. 测试
/analyze-coverage
```

### 符号链接项目的升级

```bash
# 只需更新中央toolkit
cd ~/shared-resources/tdd-toolkit
git pull  # 如果toolkit在git仓库中

# 所有链接的项目自动获得更新
```

---

## 故障排查

### 问题1: Skills未加载

**症状**: Claude不使用TDD技能

**检查**:
```bash
ls -la .claude/skills/test-driven-development/
# 应该存在 SKILL.md

cat .claude/skills/test-driven-development/SKILL.md | head -5
# 应该显示YAML front matter
```

**解决**:
```bash
# 重新复制
rm -rf .claude/skills/test-driven-development
cp -r /path/to/toolkit/skills/test-driven-development .claude/skills/
```

### 问题2: Commands不工作

**症状**: `/analyze-coverage` 显示未知命令

**检查**:
```bash
ls -la .claude/commands/
cat .claude/commands/analyze-coverage.md | head -5
```

**解决**:
```bash
# 确保文件名正确
mv .claude/commands/analyze-coverage.txt .claude/commands/analyze-coverage.md

# 或重新复制
cp /path/to/toolkit/commands/analyze-coverage.md .claude/commands/
```

### 问题3: Git Hook不执行

**症状**: 提交时没有运行测试

**检查**:
```bash
ls -la .git/hooks/pre-commit
# 应显示 -rwxr-xr-x (可执行)
```

**解决**:
```bash
# 添加执行权限
chmod +x .git/hooks/pre-commit

# 测试hook
.git/hooks/pre-commit
```

### 问题4: CI不触发

**症状**: 推送后GitHub Actions不运行

**检查**:
```bash
cat .github/workflows/tdd-enforcement.yml
# 检查语法

# 检查分支名
cat .github/workflows/tdd-enforcement.yml | grep "branches:"
```

**解决**:
```bash
# 确保workflow文件在正确位置
ls .github/workflows/

# 确保已提交
git status
git add .github/workflows/tdd-enforcement.yml
git commit -m "fix: add CI workflow"
git push
```

---

## 下一步

安装完成后:

1. **阅读快速开始指南**: `docs/quick-start.md`
2. **尝试第一个TDD功能**: 让Claude实现一个简单功能
3. **运行覆盖率分析**: `/analyze-coverage`
4. **配置Dashboard**: 选择适合的monitoring方案
5. **团队培训**: 分享TDD最佳实践

## 获取帮助

- 查看 `README.md` 了解功能概览
- 阅读各skill的 `SKILL.md` 了解详细用法
- 参考 `automation-templates/` 配置自动化

祝测试愉快！🧪
