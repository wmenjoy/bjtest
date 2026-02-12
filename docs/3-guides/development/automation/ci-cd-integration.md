# CI/CD集成 - TDD自动化

> 版本: 1.0.0
> 创建日期: 2025-12-09
> 目的: 在CI/CD pipeline中强制执行TDD流程和质量门禁

## 概述

CI/CD是TDD enforcement的**最后防线**：
- Git hooks可以被 `--no-verify` 绕过
- CI/CD无法绕过，必须通过才能合并
- 提供团队级别的质量监控

## GitHub Actions配置

### 1. 完整TDD Pipeline

**文件**: `.github/workflows/tdd-enforcement.yml`

```yaml
name: TDD Enforcement

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  # Job 1: 代码质量检查
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

      - name: Run golangci-lint
        uses: golangci/golangci-lint-action@v3
        with:
          version: latest

  # Job 2: 单元测试
  unit-tests:
    runs-on: ubuntu-latest
    needs: code-quality
    steps:
      - uses: actions/checkout@v3

      - name: Set up Go
        uses: actions/setup-go@v4
        with:
          go-version: '1.21'

      - name: Run unit tests
        run: |
          go test -v -race -coverprofile=coverage.out ./...

      - name: Check test coverage
        run: |
          COVERAGE=$(go tool cover -func=coverage.out | grep total | awk '{print $3}' | sed 's/%//')
          THRESHOLD=80

          echo "Coverage: ${COVERAGE}%"
          echo "Threshold: ${THRESHOLD}%"

          if (( $(echo "$COVERAGE < $THRESHOLD" | bc -l) )); then
            echo "❌ Coverage $COVERAGE% is below threshold $THRESHOLD%"
            exit 1
          fi

          echo "✅ Coverage check passed"

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage.out
          flags: unittests
          name: codecov-umbrella

  # Job 3: 集成测试
  integration-tests:
    runs-on: ubuntu-latest
    needs: unit-tests
    steps:
      - uses: actions/checkout@v3

      - name: Set up Go
        uses: actions/setup-go@v4
        with:
          go-version: '1.21'

      - name: Start test database
        run: |
          docker run -d \
            --name test-db \
            -e POSTGRES_PASSWORD=testpass \
            -e POSTGRES_DB=testdb \
            -p 5432:5432 \
            postgres:15

      - name: Wait for database
        run: |
          until docker exec test-db pg_isready; do
            echo "Waiting for database..."
            sleep 1
          done

      - name: Run integration tests
        run: |
          export DATABASE_URL="postgres://postgres:testpass@localhost:5432/testdb?sslmode=disable"
          go test -v -tags=integration ./...

      - name: Cleanup
        if: always()
        run: docker stop test-db && docker rm test-db

  # Job 4: TDD合规性检查
  tdd-compliance:
    runs-on: ubuntu-latest
    if: github.event_name == 'pull_request'
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0  # 获取完整历史以便diff

      - name: Check for untested code
        run: |
          # 获取变更的Go文件（排除测试文件）
          CHANGED_FILES=$(git diff --name-only origin/${{ github.base_ref }}...HEAD | grep '\.go$' | grep -v '_test\.go$' || true)

          if [ -z "$CHANGED_FILES" ]; then
            echo "✅ No source files changed"
            exit 0
          fi

          echo "📝 Changed files:"
          echo "$CHANGED_FILES"

          # 检查每个变更的源文件是否有对应的测试文件
          MISSING_TESTS=""
          for file in $CHANGED_FILES; do
            TEST_FILE="${file%.go}_test.go"
            if [ ! -f "$TEST_FILE" ]; then
              MISSING_TESTS="${MISSING_TESTS}\n  - $file (missing $TEST_FILE)"
            fi
          done

          if [ -n "$MISSING_TESTS" ]; then
            echo "❌ TDD Violation: Source files without test files:"
            echo -e "$MISSING_TESTS"
            echo ""
            echo "TDD requires: Write test first, then implementation"
            exit 1
          fi

          echo "✅ All source files have corresponding test files"

      - name: Check test quality
        run: |
          # 检查新增的测试是否有assertions
          NEW_TESTS=$(git diff origin/${{ github.base_ref }}...HEAD | grep -E "^\\+.*func Test" || true)

          if [ -z "$NEW_TESTS" ]; then
            echo "⚠️  Warning: No new tests added in this PR"
            # 不失败，只警告
            exit 0
          fi

          echo "✅ New tests detected"

  # Job 5: 安全扫描
  security-scan:
    runs-on: ubuntu-latest
    needs: code-quality
    steps:
      - uses: actions/checkout@v3

      - name: Run Gosec Security Scanner
        uses: securego/gosec@master
        with:
          args: ./...

  # Job 6: 质量门禁总结
  quality-gate:
    runs-on: ubuntu-latest
    needs: [code-quality, unit-tests, integration-tests, tdd-compliance, security-scan]
    if: always()
    steps:
      - name: Check if all jobs passed
        run: |
          if [ "${{ needs.code-quality.result }}" != "success" ] || \
             [ "${{ needs.unit-tests.result }}" != "success" ] || \
             [ "${{ needs.integration-tests.result }}" != "success" ] || \
             [ "${{ needs.tdd-compliance.result }}" != "success" ] || \
             [ "${{ needs.security-scan.result }}" != "success" ]; then
            echo "❌ Quality gate failed"
            exit 1
          fi

          echo "✅ All quality gates passed"

      - name: Post PR comment
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v6
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: '✅ All TDD quality gates passed! Ready for review.'
            })
```

### 2. 覆盖率报告上传

**使用Codecov**:

```yaml
# .github/workflows/coverage.yml
name: Coverage Report

on:
  push:
    branches: [main, develop]
  pull_request:

jobs:
  coverage:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Set up Go
        uses: actions/setup-go@v4
        with:
          go-version: '1.21'

      - name: Generate coverage report
        run: |
          go test -v -coverprofile=coverage.out -covermode=atomic ./...
          go tool cover -html=coverage.out -o coverage.html

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          token: ${{ secrets.CODECOV_TOKEN }}
          file: ./coverage.out
          flags: unittests
          name: codecov-umbrella
          fail_ci_if_error: true

      - name: Upload coverage HTML as artifact
        uses: actions/upload-artifact@v3
        with:
          name: coverage-report
          path: coverage.html
```

### 3. PR质量检查

**文件**: `.github/workflows/pr-quality.yml`

```yaml
name: PR Quality Check

on:
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  pr-quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0

      - name: Check PR title follows convention
        run: |
          PR_TITLE="${{ github.event.pull_request.title }}"

          # PR标题必须符合: feat/fix/refactor/test: description
          if ! echo "$PR_TITLE" | grep -qE "^(feat|fix|refactor|test|docs|chore)(\(.+\))?: .+"; then
            echo "❌ PR title must follow format: type(scope)?: description"
            echo "Examples:"
            echo "  - feat(auth): add user login"
            echo "  - fix(api): handle nil pointer"
            echo "  - test(service): add environment tests"
            exit 1
          fi

          echo "✅ PR title follows convention"

      - name: Check for test files in PR
        run: |
          # 检查PR是否包含测试文件
          TEST_FILES=$(git diff --name-only origin/${{ github.base_ref }}...HEAD | grep '_test\.go$' || true)
          SOURCE_FILES=$(git diff --name-only origin/${{ github.base_ref }}...HEAD | grep '\.go$' | grep -v '_test\.go$' || true)

          if [ -n "$SOURCE_FILES" ] && [ -z "$TEST_FILES" ]; then
            echo "❌ PR modifies source files but doesn't include test files"
            echo "TDD requires: Write tests alongside code changes"
            exit 1
          fi

          echo "✅ PR includes test files"

      - name: Check coverage delta
        uses: codecov/codecov-action@v3
        with:
          token: ${{ secrets.CODECOV_TOKEN }}
          flags: pr-check
          fail_ci_if_error: true

      - name: Comment coverage delta on PR
        uses: actions/github-script@v6
        with:
          script: |
            const fs = require('fs');

            // Read coverage report
            const coverage = fs.readFileSync('coverage.out', 'utf8');

            // Post comment
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: `## 📊 Test Coverage Report\n\nCoverage: XX%\n\nSee full report: [Codecov](https://codecov.io/gh/...)`
            })
```

## GitLab CI配置

**文件**: `.gitlab-ci.yml`

```yaml
stages:
  - lint
  - test
  - integration
  - report

variables:
  COVERAGE_THRESHOLD: "80"

# 代码质量
lint:
  stage: lint
  image: golang:1.21
  script:
    - go fmt ./...
    - go vet ./...
    - if [ "$(gofmt -s -l . | wc -l)" -gt 0 ]; then exit 1; fi
  only:
    - merge_requests
    - main

# 单元测试
unit-test:
  stage: test
  image: golang:1.21
  coverage: '/total:.*?(\d+\.\d+)%/'
  script:
    - go test -v -race -coverprofile=coverage.out ./...
    - go tool cover -func=coverage.out

    # 检查覆盖率
    - |
      COVERAGE=$(go tool cover -func=coverage.out | grep total | awk '{print $3}' | sed 's/%//')
      echo "Coverage: ${COVERAGE}%"

      if (( $(echo "$COVERAGE < $COVERAGE_THRESHOLD" | bc -l) )); then
        echo "Coverage below threshold"
        exit 1
      fi
  artifacts:
    paths:
      - coverage.out
    reports:
      coverage_report:
        coverage_format: cobertura
        path: coverage.out
  only:
    - merge_requests
    - main

# 集成测试
integration-test:
  stage: integration
  image: golang:1.21
  services:
    - postgres:15
  variables:
    POSTGRES_DB: testdb
    POSTGRES_USER: postgres
    POSTGRES_PASSWORD: testpass
    DATABASE_URL: "postgres://postgres:testpass@postgres:5432/testdb?sslmode=disable"
  script:
    - go test -v -tags=integration ./...
  only:
    - merge_requests
    - main

# TDD合规性检查
tdd-compliance:
  stage: test
  image: golang:1.21
  script:
    - |
      # 检查变更的文件
      CHANGED_FILES=$(git diff --name-only $CI_MERGE_REQUEST_DIFF_BASE_SHA...HEAD | grep '\.go$' | grep -v '_test\.go$' || true)

      if [ -z "$CHANGED_FILES" ]; then
        echo "No source files changed"
        exit 0
      fi

      # 检查测试文件
      for file in $CHANGED_FILES; do
        TEST_FILE="${file%.go}_test.go"
        if [ ! -f "$TEST_FILE" ]; then
          echo "Missing test file: $TEST_FILE"
          exit 1
        fi
      done

      echo "All source files have corresponding tests"
  only:
    - merge_requests

# 生成报告
coverage-report:
  stage: report
  image: golang:1.21
  dependencies:
    - unit-test
  script:
    - go tool cover -html=coverage.out -o coverage.html
  artifacts:
    paths:
      - coverage.html
    expire_in: 30 days
  only:
    - main
    - merge_requests
```

## Jenkins Pipeline配置

**文件**: `Jenkinsfile`

```groovy
pipeline {
    agent any

    environment {
        GO_VERSION = '1.21'
        COVERAGE_THRESHOLD = '80'
    }

    stages {
        stage('Setup') {
            steps {
                sh 'go version'
                sh 'go env'
            }
        }

        stage('Code Quality') {
            steps {
                sh 'go fmt ./...'
                sh 'go vet ./...'

                script {
                    def fmtOutput = sh(script: 'gofmt -s -l .', returnStdout: true).trim()
                    if (fmtOutput) {
                        error("Code not formatted:\n${fmtOutput}")
                    }
                }
            }
        }

        stage('Unit Tests') {
            steps {
                sh 'go test -v -race -coverprofile=coverage.out ./...'

                script {
                    def coverage = sh(
                        script: "go tool cover -func=coverage.out | grep total | awk '{print \$3}' | sed 's/%//'",
                        returnStdout: true
                    ).trim().toFloat()

                    echo "Coverage: ${coverage}%"

                    if (coverage < COVERAGE_THRESHOLD.toFloat()) {
                        error("Coverage ${coverage}% is below threshold ${COVERAGE_THRESHOLD}%")
                    }
                }
            }
            post {
                always {
                    publishHTML([
                        allowMissing: false,
                        alwaysLinkToLastBuild: true,
                        keepAll: true,
                        reportDir: '.',
                        reportFiles: 'coverage.html',
                        reportName: 'Coverage Report'
                    ])
                }
            }
        }

        stage('Integration Tests') {
            steps {
                sh '''
                    docker run -d --name test-db \
                        -e POSTGRES_PASSWORD=testpass \
                        -e POSTGRES_DB=testdb \
                        -p 5432:5432 \
                        postgres:15
                '''

                sh '''
                    until docker exec test-db pg_isready; do
                        echo "Waiting for database..."
                        sleep 1
                    done
                '''

                sh 'export DATABASE_URL="postgres://postgres:testpass@localhost:5432/testdb?sslmode=disable" && go test -v -tags=integration ./...'
            }
            post {
                always {
                    sh 'docker stop test-db && docker rm test-db'
                }
            }
        }

        stage('TDD Compliance') {
            when {
                changeRequest()
            }
            steps {
                script {
                    def changedFiles = sh(
                        script: "git diff --name-only origin/${env.CHANGE_TARGET}...HEAD | grep '\\.go\$' | grep -v '_test\\.go\$' || true",
                        returnStdout: true
                    ).trim()

                    if (changedFiles) {
                        changedFiles.split('\n').each { file ->
                            def testFile = file.replace('.go', '_test.go')
                            if (!fileExists(testFile)) {
                                error("Missing test file: ${testFile}")
                            }
                        }
                    }
                }
            }
        }
    }

    post {
        success {
            echo '✅ All TDD quality gates passed'
        }
        failure {
            echo '❌ TDD quality gates failed'
        }
        always {
            cleanWs()
        }
    }
}
```

## 质量门禁配置

### SonarQube集成

**文件**: `sonar-project.properties`

```properties
sonar.projectKey=my-project
sonar.projectName=My Project
sonar.projectVersion=1.0

sonar.sources=.
sonar.exclusions=**/*_test.go,**/vendor/**,**/mocks/**

sonar.tests=.
sonar.test.inclusions=**/*_test.go

sonar.go.coverage.reportPaths=coverage.out

# 质量门禁
sonar.qualitygate.wait=true
sonar.coverage.minimum=80.0
```

**GitHub Action集成**:

```yaml
- name: SonarQube Scan
  uses: sonarsource/sonarqube-scan-action@master
  env:
    SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
    SONAR_HOST_URL: ${{ secrets.SONAR_HOST_URL }}
```

### CodeClimate集成

```yaml
- name: Test Coverage
  uses: paambaati/codeclimate-action@v3.0.0
  env:
    CC_TEST_REPORTER_ID: ${{ secrets.CC_TEST_REPORTER_ID }}
  with:
    coverageCommand: go test -coverprofile=coverage.out ./...
    prefix: github.com/user/repo
```

## 覆盖率趋势监控

### 使用Codecov徽章

在README.md中添加：

```markdown
[![codecov](https://codecov.io/gh/username/repo/branch/main/graph/badge.svg)](https://codecov.io/gh/username/repo)
```

### GitHub Actions生成徽章

```yaml
- name: Generate coverage badge
  uses: cicirello/jacoco-badge-generator@v2
  with:
    badges-directory: badges
    coverage-badge-filename: coverage.svg

- name: Commit badge
  run: |
    git config --local user.email "action@github.com"
    git config --local user.name "GitHub Action"
    git add badges/coverage.svg
    git commit -m "Update coverage badge" || echo "No changes"
    git push
```

## 失败通知

### Slack通知

```yaml
- name: Notify Slack on failure
  if: failure()
  uses: rtCamp/action-slack-notify@v2
  env:
    SLACK_WEBHOOK: ${{ secrets.SLACK_WEBHOOK }}
    SLACK_COLOR: danger
    SLACK_TITLE: TDD Quality Gate Failed
    SLACK_MESSAGE: |
      PR: ${{ github.event.pull_request.html_url }}
      Author: ${{ github.actor }}
      Failed job: ${{ github.job }}
```

### Email通知

```yaml
- name: Send email on failure
  if: failure()
  uses: dawidd6/action-send-mail@v3
  with:
    server_address: smtp.gmail.com
    server_port: 465
    username: ${{ secrets.EMAIL_USERNAME }}
    password: ${{ secrets.EMAIL_PASSWORD }}
    subject: TDD Quality Gate Failed
    to: team@example.com
    from: ci@example.com
    body: |
      TDD quality gate failed for PR: ${{ github.event.pull_request.html_url }}
      Please fix tests before merging.
```

## 最佳实践

### 1. 分阶段执行

```
Stage 1: Fast checks (lint, fmt) - 30秒
Stage 2: Unit tests - 2分钟
Stage 3: Integration tests - 5分钟
Stage 4: E2E tests - 10分钟
```

### 2. 缓存依赖

```yaml
- name: Cache Go modules
  uses: actions/cache@v3
  with:
    path: ~/go/pkg/mod
    key: ${{ runner.os }}-go-${{ hashFiles('**/go.sum') }}
    restore-keys: |
      ${{ runner.os }}-go-
```

### 3. 并行执行

```yaml
jobs:
  test:
    strategy:
      matrix:
        go-version: ['1.20', '1.21']
        os: [ubuntu-latest, macos-latest]
    runs-on: ${{ matrix.os }}
```

### 4. 只在必要时运行

```yaml
on:
  push:
    paths:
      - '**.go'
      - 'go.mod'
      - 'go.sum'
      - '.github/workflows/**'
```

## 故障排查

### CI通过但本地失败

```bash
# 本地模拟CI环境
docker run -it golang:1.21 bash
git clone <repo>
./run-tests.sh
```

### CI失败但本地通过

```bash
# 检查环境差异
echo $PATH
go version
go env

# 清理本地缓存
go clean -cache -testcache -modcache
```

## 参考文档

- **Git Hooks**: `docs/3-guides/development/automation/git-hooks-tdd.md`
- **Test Dashboard**: `docs/3-guides/development/automation/test-dashboard.md`
- **TDD Skill**: `.claude/skills/test-driven-development/SKILL.md`
