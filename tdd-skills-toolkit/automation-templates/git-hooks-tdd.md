# Git Hooks for TDD Enforcement

> 版本: 1.0.0
> 创建日期: 2025-12-09
> 目的: 在工具层面强制执行TDD流程，防止未经测试的代码提交

## 概述

Git hooks 在代码提交前自动运行测试，确保：
- 没有未经测试的代码进入代码库
- 所有测试通过后才能提交
- 覆盖率达到目标阈值
- TDD流程自动化执行

## Pre-commit Hook 模板

### 1. Go项目Pre-commit Hook

**文件位置**: `.git/hooks/pre-commit` (可执行)

```bash
#!/bin/bash
# Pre-commit hook for Go projects
# Enforces TDD by running tests before commit

set -e  # Exit on error

echo "🧪 Running pre-commit TDD checks..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Check if Go files changed
GO_FILES=$(git diff --cached --name-only --diff-filter=ACM | grep '\.go$' | grep -v '_test\.go$' || true)

if [ -z "$GO_FILES" ]; then
    echo "✅ No Go source files changed, skipping tests"
    exit 0
fi

echo -e "${YELLOW}📝 Changed Go files:${NC}"
echo "$GO_FILES"

# 2. Run go fmt
echo -e "\n${YELLOW}🎨 Running go fmt...${NC}"
if ! gofmt -l $GO_FILES | grep -q '.'; then
    echo -e "${GREEN}✅ Code formatting OK${NC}"
else
    echo -e "${RED}❌ Code not formatted. Run: go fmt ./...${NC}"
    exit 1
fi

# 3. Run go vet
echo -e "\n${YELLOW}🔍 Running go vet...${NC}"
if go vet ./...; then
    echo -e "${GREEN}✅ Go vet passed${NC}"
else
    echo -e "${RED}❌ Go vet failed${NC}"
    exit 1
fi

# 4. Run tests
echo -e "\n${YELLOW}🧪 Running tests...${NC}"
if go test -v ./...; then
    echo -e "${GREEN}✅ All tests passed${NC}"
else
    echo -e "${RED}❌ Tests failed${NC}"
    echo -e "${RED}TDD violation: Cannot commit failing tests${NC}"
    exit 1
fi

# 5. Check coverage
echo -e "\n${YELLOW}📊 Checking test coverage...${NC}"
COVERAGE_THRESHOLD=80

go test -coverprofile=coverage.out ./... > /dev/null 2>&1

if [ -f coverage.out ]; then
    COVERAGE=$(go tool cover -func=coverage.out | grep total | awk '{print $3}' | sed 's/%//')

    echo "Current coverage: ${COVERAGE}%"
    echo "Required coverage: ${COVERAGE_THRESHOLD}%"

    if (( $(echo "$COVERAGE < $COVERAGE_THRESHOLD" | bc -l) )); then
        echo -e "${RED}❌ Coverage ${COVERAGE}% is below threshold ${COVERAGE_THRESHOLD}%${NC}"
        echo -e "${RED}TDD violation: Add tests to increase coverage${NC}"
        rm coverage.out
        exit 1
    else
        echo -e "${GREEN}✅ Coverage check passed (${COVERAGE}%)${NC}"
    fi

    rm coverage.out
else
    echo -e "${RED}❌ Coverage file not generated${NC}"
    exit 1
fi

# 6. Check for TODOs in test files (indicates incomplete tests)
echo -e "\n${YELLOW}📝 Checking for incomplete tests...${NC}"
TODO_COUNT=$(git diff --cached | grep -i "TODO.*test" | wc -l)

if [ "$TODO_COUNT" -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Warning: Found $TODO_COUNT TODO comments in tests${NC}"
    echo -e "${YELLOW}Consider completing tests before committing${NC}"
    # Don't fail, just warn
fi

echo -e "\n${GREEN}✅ All TDD checks passed! Proceeding with commit...${NC}"
exit 0
```

**安装方法**:

```bash
# 1. 复制到项目
cp docs/3-guides/development/automation/pre-commit .git/hooks/pre-commit

# 2. 添加执行权限
chmod +x .git/hooks/pre-commit

# 3. 测试
.git/hooks/pre-commit
```

### 2. JavaScript/TypeScript项目

**文件位置**: `.git/hooks/pre-commit`

```bash
#!/bin/bash
# Pre-commit hook for JavaScript/TypeScript projects

set -e

echo "🧪 Running pre-commit TDD checks..."

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if JS/TS files changed
JS_FILES=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(js|jsx|ts|tsx)$' | grep -v -E '\.(test|spec)\.(js|jsx|ts|tsx)$' || true)

if [ -z "$JS_FILES" ]; then
    echo "✅ No JS/TS source files changed"
    exit 0
fi

# 1. Run ESLint
echo -e "\n${YELLOW}🔍 Running ESLint...${NC}"
if npm run lint; then
    echo -e "${GREEN}✅ Linting passed${NC}"
else
    echo -e "${RED}❌ Linting failed${NC}"
    exit 1
fi

# 2. Run tests
echo -e "\n${YELLOW}🧪 Running tests...${NC}"
if npm test -- --passWithNoTests; then
    echo -e "${GREEN}✅ All tests passed${NC}"
else
    echo -e "${RED}❌ Tests failed${NC}"
    exit 1
fi

# 3. Check coverage
echo -e "\n${YELLOW}📊 Checking test coverage...${NC}"
COVERAGE_THRESHOLD=80

npm test -- --coverage --passWithNoTests > /tmp/coverage.txt 2>&1

if grep -q "All files" /tmp/coverage.txt; then
    COVERAGE=$(grep "All files" /tmp/coverage.txt | awk '{print $10}' | sed 's/%//')

    echo "Current coverage: ${COVERAGE}%"
    echo "Required coverage: ${COVERAGE_THRESHOLD}%"

    if (( $(echo "$COVERAGE < $COVERAGE_THRESHOLD" | bc -l) )); then
        echo -e "${RED}❌ Coverage ${COVERAGE}% is below threshold${NC}"
        exit 1
    else
        echo -e "${GREEN}✅ Coverage check passed (${COVERAGE}%)${NC}"
    fi
fi

rm -f /tmp/coverage.txt

echo -e "\n${GREEN}✅ All TDD checks passed!${NC}"
exit 0
```

### 3. Python项目

**文件位置**: `.git/hooks/pre-commit`

```bash
#!/bin/bash
# Pre-commit hook for Python projects

set -e

echo "🧪 Running pre-commit TDD checks..."

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if Python files changed
PY_FILES=$(git diff --cached --name-only --diff-filter=ACM | grep '\.py$' | grep -v 'test_.*\.py$' || true)

if [ -z "$PY_FILES" ]; then
    echo "✅ No Python source files changed"
    exit 0
fi

# 1. Run black formatter check
echo -e "\n${YELLOW}🎨 Running black formatter...${NC}"
if black --check $PY_FILES; then
    echo -e "${GREEN}✅ Code formatting OK${NC}"
else
    echo -e "${RED}❌ Code not formatted. Run: black .${NC}"
    exit 1
fi

# 2. Run flake8
echo -e "\n${YELLOW}🔍 Running flake8...${NC}"
if flake8 $PY_FILES; then
    echo -e "${GREEN}✅ Flake8 passed${NC}"
else
    echo -e "${RED}❌ Flake8 failed${NC}"
    exit 1
fi

# 3. Run tests
echo -e "\n${YELLOW}🧪 Running pytest...${NC}"
if pytest; then
    echo -e "${GREEN}✅ All tests passed${NC}"
else
    echo -e "${RED}❌ Tests failed${NC}"
    exit 1
fi

# 4. Check coverage
echo -e "\n${YELLOW}📊 Checking test coverage...${NC}"
COVERAGE_THRESHOLD=80

pytest --cov=. --cov-report=term-missing | tee /tmp/coverage.txt

COVERAGE=$(grep "TOTAL" /tmp/coverage.txt | awk '{print $4}' | sed 's/%//')

echo "Current coverage: ${COVERAGE}%"
echo "Required coverage: ${COVERAGE_THRESHOLD}%"

if (( $(echo "$COVERAGE < $COVERAGE_THRESHOLD" | bc -l) )); then
    echo -e "${RED}❌ Coverage ${COVERAGE}% is below threshold${NC}"
    rm /tmp/coverage.txt
    exit 1
else
    echo -e "${GREEN}✅ Coverage check passed (${COVERAGE}%)${NC}"
fi

rm /tmp/coverage.txt

echo -e "\n${GREEN}✅ All TDD checks passed!${NC}"
exit 0
```

## 使用Husky自动化安装（推荐）

对于JavaScript/TypeScript项目，使用Husky管理Git hooks更方便：

### 安装Husky

```bash
npm install --save-dev husky
npx husky install
```

### 配置package.json

```json
{
  "scripts": {
    "prepare": "husky install",
    "test": "jest",
    "test:coverage": "jest --coverage",
    "lint": "eslint ."
  },
  "husky": {
    "hooks": {
      "pre-commit": "npm run lint && npm test && npm run test:coverage"
    }
  }
}
```

### 创建pre-commit hook

```bash
npx husky add .husky/pre-commit "npm run lint && npm test"
chmod +x .husky/pre-commit
```

## Pre-push Hook（推荐用于慢速测试）

如果测试运行时间较长，可以将部分检查移到pre-push：

```bash
#!/bin/bash
# .git/hooks/pre-push

echo "🚀 Running pre-push checks..."

# Run integration tests
npm run test:integration

# Run E2E tests
npm run test:e2e

# Generate coverage report
npm run test:coverage

exit 0
```

## 覆盖率阈值配置

### Go项目 - 配置文件方式

**文件**: `.coveragerc`

```ini
[coverage]
threshold = 80
fail_under_threshold = true

[paths]
critical = internal/service/auth_*,internal/service/payment_*
high_priority = internal/service/*
standard = internal/handler/*
```

### JavaScript项目 - jest.config.js

```javascript
module.exports = {
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    './src/services/': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    }
  }
}
```

### Python项目 - .coveragerc

```ini
[run]
source = .
omit = */tests/*,*/migrations/*

[report]
fail_under = 80
precision = 2

[html]
directory = htmlcov
```

## 绕过Hook（紧急情况）

**⚠️ 警告：仅在紧急情况下使用**

```bash
# 跳过pre-commit hook
git commit --no-verify -m "Emergency fix"

# 跳过pre-push hook
git push --no-verify
```

**最佳实践：**
- 记录每次使用 `--no-verify` 的原因
- 立即创建issue补充测试
- 在下一次提交前修复

## 团队配置

### 共享Hook配置

**文件**: `.githooks/`

```
.githooks/
├── pre-commit
├── pre-push
├── commit-msg
└── install.sh
```

**install.sh**:

```bash
#!/bin/bash
# Install Git hooks for all team members

HOOKS_DIR=".githooks"
GIT_HOOKS_DIR=".git/hooks"

echo "Installing Git hooks..."

# Copy all hooks
cp $HOOKS_DIR/* $GIT_HOOKS_DIR/

# Make executable
chmod +x $GIT_HOOKS_DIR/*

echo "✅ Git hooks installed successfully"
echo "Run 'git config core.hooksPath .githooks' to use shared hooks"
```

**在package.json中自动安装**:

```json
{
  "scripts": {
    "postinstall": "bash .githooks/install.sh"
  }
}
```

## 监控Hook执行

### 记录Hook执行日志

在hook中添加日志：

```bash
#!/bin/bash
# Log all hook executions

LOG_FILE=".git/hooks/hook-execution.log"

echo "$(date): Pre-commit hook started" >> $LOG_FILE

# ... hook logic ...

if [ $? -eq 0 ]; then
    echo "$(date): Pre-commit hook passed" >> $LOG_FILE
else
    echo "$(date): Pre-commit hook failed" >> $LOG_FILE
fi
```

### 分析团队遵循TDD的情况

```bash
#!/bin/bash
# Analyze TDD compliance from hook logs

echo "📊 TDD Compliance Report"
echo "======================"

TOTAL=$(grep "Pre-commit hook" .git/hooks/hook-execution.log | wc -l)
PASSED=$(grep "hook passed" .git/hooks/hook-execution.log | wc -l)
FAILED=$(grep "hook failed" .git/hooks/hook-execution.log | wc -l)
SKIPPED=$(git log --all --grep="--no-verify" | wc -l)

COMPLIANCE=$(echo "scale=2; ($PASSED / $TOTAL) * 100" | bc)

echo "Total commits: $TOTAL"
echo "Passed hooks: $PASSED"
echo "Failed hooks: $FAILED"
echo "Skipped hooks: $SKIPPED"
echo "Compliance rate: ${COMPLIANCE}%"
```

## 故障排查

### Hook不执行

```bash
# 检查hook是否可执行
ls -la .git/hooks/pre-commit

# 如果不可执行，添加权限
chmod +x .git/hooks/pre-commit

# 检查shebang行
head -1 .git/hooks/pre-commit  # 应该是 #!/bin/bash
```

### Hook执行失败但没有错误信息

```bash
# 在hook开头添加调试
#!/bin/bash
set -x  # 打印每个命令
set -e  # 遇到错误立即退出

# ... hook logic ...
```

### 测试在本地通过但在hook中失败

```bash
# 检查环境变量
#!/bin/bash
echo "PATH: $PATH"
echo "GO version: $(go version)"
echo "Node version: $(node --version)"

# 可能需要设置环境
export PATH="/usr/local/go/bin:$PATH"
```

## 最佳实践

### 1. 快速失败原则

```bash
# ✅ GOOD: 失败时立即停止
set -e

# Run lint
npm run lint || exit 1

# Run tests
npm test || exit 1
```

### 2. 提供清晰的错误信息

```bash
# ✅ GOOD: 告诉用户如何修复
if ! go test ./...; then
    echo "❌ Tests failed"
    echo "Fix tests before committing:"
    echo "  1. Run: go test ./..."
    echo "  2. Fix failing tests"
    echo "  3. Try commit again"
    exit 1
fi
```

### 3. 只检查变更的文件

```bash
# ✅ GOOD: 只测试变更的模块
CHANGED_DIRS=$(git diff --cached --name-only | grep '\.go$' | xargs -I {} dirname {} | sort -u)

for dir in $CHANGED_DIRS; do
    echo "Testing $dir..."
    go test ./$dir/...
done
```

### 4. 缓存测试结果（可选）

```bash
# 使用go test -c预编译测试，加快速度
go test -c ./... > /dev/null 2>&1
```

## 与CI/CD集成

Git hooks是**第一道防线**，CI/CD是**最后防线**：

```
开发流程：
1. 本地开发 → TDD (手动)
2. git commit → Pre-commit hook (自动)
3. git push → Pre-push hook (自动)
4. PR创建 → CI/CD pipeline (自动)
5. Code Review → 人工审查
6. Merge → 部署
```

详见：`ci-cd-integration.md`

## 参考文档

- **TDD Skill**: `.claude/skills/test-driven-development/SKILL.md`
- **CI/CD Integration**: `docs/3-guides/development/automation/ci-cd-integration.md`
- **Test Dashboard**: `docs/3-guides/development/automation/test-dashboard.md`
- **Git Hooks Documentation**: https://git-scm.com/docs/githooks
