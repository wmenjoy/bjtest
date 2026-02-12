# 测试指标仪表板 - TDD合规性监控

> 版本: 1.0.0
> 创建日期: 2025-12-09
> 目的: 可视化监控团队TDD实践，追踪测试质量和流程合规性

## 概述

测试仪表板提供：
- **实时指标**: 覆盖率、测试通过率、构建状态
- **趋势分析**: 质量变化趋势、合规性评分
- **团队洞察**: 谁在遵循TDD，谁需要帮助
- **告警机制**: 覆盖率下降、测试失败时自动告警

## 仪表板架构

```
数据源:
├── Git Hooks日志
├── CI/CD执行记录
├── 代码覆盖率报告 (Codecov/SonarQube)
└── Issue Tracker (GitHub/GitLab)

处理层:
├── 数据聚合器
├── 指标计算引擎
└── 趋势分析器

展示层:
├── 实时仪表板 (Grafana/自定义UI)
├── 通知系统 (Slack/Email)
└── 报告生成器 (PDF/HTML)
```

## 核心指标

### 1. TDD合规性评分 (0-100分)

**计算公式**:

```
TDD合规性 = (
    测试优先率 × 0.3 +
    覆盖率达标率 × 0.25 +
    测试质量分 × 0.25 +
    CI通过率 × 0.2
)
```

**指标定义**:

| 指标 | 计算方法 | 权重 | 目标值 |
|------|---------|------|--------|
| **测试优先率** | (测试文件提交时间 < 代码文件提交时间的次数) / 总提交数 | 30% | >80% |
| **覆盖率达标率** | (覆盖率 >= 阈值的模块数) / 总模块数 | 25% | >90% |
| **测试质量分** | 测试质量评估分数 (详见下文) | 25% | >85 |
| **CI通过率** | (CI通过次数) / (CI总运行次数) | 20% | >95% |

### 2. 代码覆盖率指标

**多维度覆盖率**:

```
覆盖率类型:
├── 行覆盖率 (Line Coverage)
├── 分支覆盖率 (Branch Coverage)
├── 函数覆盖率 (Function Coverage)
└── 变异覆盖率 (Mutation Coverage) - 可选
```

**目标阈值**:

```yaml
coverage_targets:
  critical_code:      # 认证、支付、安全
    line: 95%
    branch: 90%
    function: 95%

  core_business:      # 核心业务逻辑
    line: 90%
    branch: 85%
    function: 90%

  standard_code:      # 标准代码
    line: 80%
    branch: 75%
    function: 80%

  utility_code:       # 工具类
    line: 70%
    branch: 65%
    function: 70%
```

### 3. 测试质量评分 (0-100)

**评分维度**:

```yaml
test_quality_score:
  naming_clarity: /20      # 测试名称清晰度
    - 描述性名称: 15分
    - 遵循命名约定: 5分

  aaa_structure: /20       # AAA模式遵循度
    - Arrange清晰: 7分
    - Act简洁: 7分
    - Assert充分: 6分

  independence: /15        # 测试独立性
    - 无共享状态: 8分
    - 可并行执行: 7分

  edge_cases: /15          # 边界情况覆盖
    - 错误路径: 8分
    - 边界值: 7分

  maintainability: /15     # 可维护性
    - 无重复代码: 8分
    - 适当抽象: 7分

  assertion_quality: /10   # 断言质量
    - 明确断言: 5分
    - 错误信息: 5分

  no_anti_patterns: /5     # 无反模式
    - 无mock滥用: 3分
    - 无脆弱测试: 2分

total: /100
```

**自动化评分脚本**:

```bash
#!/bin/bash
# test-quality-score.sh

TEST_FILE=$1
SCORE=0

# 1. 检查命名 (20分)
if grep -q "func Test.*_.*(" "$TEST_FILE"; then
    SCORE=$((SCORE + 15))  # 描述性名称
fi

# 2. 检查AAA注释 (20分)
if grep -q "// Arrange\|// Act\|// Assert" "$TEST_FILE"; then
    SCORE=$((SCORE + 20))
fi

# 3. 检查t.Parallel (独立性，15分)
if grep -q "t.Parallel()" "$TEST_FILE"; then
    SCORE=$((SCORE + 7))
fi

# 4. 检查错误测试 (边界情况，15分)
ERROR_TESTS=$(grep -c "wantErr.*true\|require.Error" "$TEST_FILE")
if [ "$ERROR_TESTS" -gt 0 ]; then
    SCORE=$((SCORE + 8))
fi

# 5. 检查helper函数 (可维护性，15分)
if grep -q "t.Helper()" "$TEST_FILE"; then
    SCORE=$((SCORE + 8))
fi

# 6. 检查断言消息 (10分)
ASSERTIONS_WITH_MSG=$(grep -c 'assert.*".*"' "$TEST_FILE")
if [ "$ASSERTIONS_WITH_MSG" -gt 3 ]; then
    SCORE=$((SCORE + 10))
fi

# 7. 检查反模式 (5分，扣分项)
if ! grep -q "AssertCalled.*mock" "$TEST_FILE"; then
    SCORE=$((SCORE + 5))  # 没有测试mock行为
fi

echo "Test Quality Score: $SCORE/100"
```

### 4. TDD流程指标

**提交时序分析**:

```
指标: 测试优先率
计算: git log分析测试文件vs源文件的提交时间

示例:
Commit A: add user_service_test.go  (10:00 AM) ✅
Commit B: add user_service.go       (10:15 AM) ✅
  → TDD合规: 是

Commit C: add order_service.go      (11:00 AM) ❌
Commit D: add order_service_test.go (11:30 AM) ❌
  → TDD合规: 否
```

**检测脚本**:

```bash
#!/bin/bash
# tdd-compliance-check.sh

# 获取最近N次提交
COMMITS=$(git log -n 50 --pretty=format:"%H")

COMPLIANT=0
NON_COMPLIANT=0

for commit in $COMMITS; do
    # 获取该提交变更的文件
    FILES=$(git show --name-only --pretty="" $commit)

    # 分离源文件和测试文件
    SOURCE_FILES=$(echo "$FILES" | grep '\.go$' | grep -v '_test\.go$' || true)
    TEST_FILES=$(echo "$FILES" | grep '_test\.go$' || true)

    if [ -n "$SOURCE_FILES" ]; then
        # 有源文件变更
        if [ -n "$TEST_FILES" ]; then
            # 同时有测试文件 - 需要检查时序
            # 简化：假设同一commit包含两者为合规
            COMPLIANT=$((COMPLIANT + 1))
        else
            # 只有源文件，无测试 - 非合规
            NON_COMPLIANT=$((NON_COMPLIANT + 1))
        fi
    fi
done

TOTAL=$((COMPLIANT + NON_COMPLIANT))
if [ "$TOTAL" -gt 0 ]; then
    COMPLIANCE_RATE=$(echo "scale=2; ($COMPLIANT * 100) / $TOTAL" | bc)
    echo "TDD Compliance Rate: ${COMPLIANCE_RATE}%"
    echo "Compliant commits: $COMPLIANT"
    echo "Non-compliant commits: $NON_COMPLIANT"
fi
```

### 5. 持续监控指标

**关键时序指标**:

| 指标 | 描述 | 目标 | 告警阈值 |
|------|------|------|---------|
| **覆盖率趋势** | 过去30天覆盖率变化 | 持平或上升 | 下降>5% |
| **测试执行时间** | 测试套件总执行时间 | <5分钟 | >10分钟 |
| **flaky测试率** | 间歇性失败的测试比例 | <1% | >3% |
| **hook绕过率** | 使用`--no-verify`的次数 | <5% | >10% |
| **平均修复时间** | 从测试失败到修复的时间 | <1小时 | >4小时 |

## 仪表板实现方案

### 方案1: Grafana + Prometheus

**优点**: 成熟、功能强大、可定制
**适用**: 中大型团队，有DevOps资源

**架构**:

```
数据采集:
  └── Prometheus Exporter (自定义)
      ├── 读取CI日志
      ├── 解析覆盖率报告
      └── 分析Git历史

存储:
  └── Prometheus Time Series DB

可视化:
  └── Grafana Dashboard
```

**Prometheus Exporter示例** (`/metrics`):

```go
package main

import (
    "net/http"
    "github.com/prometheus/client_golang/prometheus"
    "github.com/prometheus/client_golang/prometheus/promhttp"
)

var (
    // 覆盖率指标
    coverage = prometheus.NewGaugeVec(
        prometheus.GaugeOpts{
            Name: "test_coverage_percentage",
            Help: "Test coverage percentage by module",
        },
        []string{"module", "type"}, // type: line/branch/function
    )

    // TDD合规性
    tddCompliance = prometheus.NewGauge(
        prometheus.GaugeOpts{
            Name: "tdd_compliance_score",
            Help: "TDD compliance score (0-100)",
        },
    )

    // 测试质量
    testQuality = prometheus.NewGaugeVec(
        prometheus.GaugeOpts{
            Name: "test_quality_score",
            Help: "Test quality score by file",
        },
        []string{"file"},
    )

    // CI通过率
    ciPassRate = prometheus.NewGaugeVec(
        prometheus.GaugeOpts{
            Name: "ci_pass_rate_percentage",
            Help: "CI pipeline pass rate",
        },
        []string{"pipeline"},
    )
)

func init() {
    prometheus.MustRegister(coverage)
    prometheus.MustRegister(tddCompliance)
    prometheus.MustRegister(testQuality)
    prometheus.MustRegister(ciPassRate)
}

func updateMetrics() {
    // 更新覆盖率
    coverage.WithLabelValues("auth", "line").Set(95.5)
    coverage.WithLabelValues("auth", "branch").Set(92.3)

    // 更新TDD合规性
    tddCompliance.Set(87.5)

    // 更新测试质量
    testQuality.WithLabelValues("user_service_test.go").Set(92.0)

    // 更新CI通过率
    ciPassRate.WithLabelValues("main").Set(98.5)
}

func main() {
    // 定期更新指标
    go func() {
        for {
            updateMetrics()
            time.Sleep(5 * time.Minute)
        }
    }()

    http.Handle("/metrics", promhttp.Handler())
    http.ListenAndServe(":9090", nil)
}
```

**Grafana Dashboard JSON**:

```json
{
  "dashboard": {
    "title": "TDD Compliance Dashboard",
    "panels": [
      {
        "title": "TDD Compliance Score",
        "type": "gauge",
        "targets": [
          {
            "expr": "tdd_compliance_score"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "thresholds": {
              "steps": [
                { "value": 0, "color": "red" },
                { "value": 70, "color": "yellow" },
                { "value": 85, "color": "green" }
              ]
            },
            "max": 100,
            "min": 0
          }
        }
      },
      {
        "title": "Coverage Trend (30 days)",
        "type": "graph",
        "targets": [
          {
            "expr": "test_coverage_percentage{type=\"line\"}"
          }
        ]
      },
      {
        "title": "Test Quality by Module",
        "type": "bar",
        "targets": [
          {
            "expr": "test_quality_score"
          }
        ]
      }
    ]
  }
}
```

### 方案2: GitHub Actions + Badge

**优点**: 轻量、免费、集成GitHub
**适用**: 小型团队，开源项目

**实现**:

```yaml
# .github/workflows/dashboard-update.yml
name: Update Dashboard

on:
  push:
    branches: [main]
  schedule:
    - cron: '0 */6 * * *'  # 每6小时更新

jobs:
  update-dashboard:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Calculate metrics
        run: |
          # 计算覆盖率
          COVERAGE=$(go test -coverprofile=coverage.out ./... | grep total | awk '{print $3}')

          # 计算TDD合规性
          COMPLIANCE=$(bash scripts/tdd-compliance-check.sh)

          # 保存到JSON
          cat > dashboard-data.json <<EOF
          {
            "coverage": "$COVERAGE",
            "tddCompliance": "$COMPLIANCE",
            "lastUpdate": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
          }
          EOF

      - name: Generate badge
        run: |
          # 生成覆盖率徽章
          node scripts/generate-badge.js

      - name: Commit dashboard data
        run: |
          git config user.name "GitHub Actions"
          git config user.email "actions@github.com"
          git add dashboard-data.json badges/
          git commit -m "Update dashboard data" || echo "No changes"
          git push
```

**README.md展示**:

```markdown
## 📊 测试仪表板

![Coverage](./badges/coverage.svg)
![TDD Compliance](./badges/tdd-compliance.svg)
![Build](https://github.com/user/repo/workflows/CI/badge.svg)

| 指标 | 当前值 | 目标 | 状态 |
|------|--------|------|------|
| 代码覆盖率 | 87.5% | 80% | ✅ |
| TDD合规性 | 82.3% | 80% | ✅ |
| CI通过率 | 98.5% | 95% | ✅ |
| 测试质量 | 89/100 | 85 | ✅ |
```

### 方案3: 自定义Web仪表板

**优点**: 完全定制、集成业务逻辑
**适用**: 有前端资源的团队

**技术栈**:
- 后端: Go + Gin (提供API)
- 前端: React + Recharts (可视化)
- 数据库: SQLite/PostgreSQL (存储历史数据)

**API示例**:

```go
// GET /api/metrics/coverage
{
  "overall": 87.5,
  "by_module": [
    { "module": "auth", "coverage": 95.5, "trend": "+2.3%" },
    { "module": "payment", "coverage": 92.1, "trend": "+1.8%" },
    { "module": "order", "coverage": 84.3, "trend": "-0.5%" }
  ],
  "history": [
    { "date": "2025-12-01", "coverage": 85.2 },
    { "date": "2025-12-08", "coverage": 87.5 }
  ]
}

// GET /api/metrics/tdd-compliance
{
  "score": 82.3,
  "breakdown": {
    "test_first_rate": 78.5,
    "coverage_compliance": 90.2,
    "test_quality": 89.0,
    "ci_pass_rate": 98.5
  },
  "recent_violations": [
    {
      "commit": "abc123",
      "author": "developer1",
      "violation": "Source file without test",
      "date": "2025-12-07"
    }
  ]
}
```

**React组件示例**:

```tsx
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

function CoverageTrendChart() {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetch('/api/metrics/coverage')
      .then(res => res.json())
      .then(data => setData(data.history));
  }, []);

  return (
    <div>
      <h2>Coverage Trend (30 days)</h2>
      <LineChart width={600} height={300} data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis domain={[0, 100]} />
        <Tooltip />
        <Line type="monotone" dataKey="coverage" stroke="#8884d8" />
      </LineChart>
    </div>
  );
}
```

## 告警配置

### Slack告警

**触发条件**:
- 覆盖率下降 >5%
- TDD合规性 <70%
- CI连续失败 >3次
- Flaky测试率 >3%

**Webhook配置**:

```bash
#!/bin/bash
# alert-to-slack.sh

WEBHOOK_URL=$1
MESSAGE=$2

curl -X POST $WEBHOOK_URL \
  -H 'Content-Type: application/json' \
  -d "{
    \"text\": \"⚠️ TDD Alert\",
    \"blocks\": [
      {
        \"type\": \"section\",
        \"text\": {
          \"type\": \"mrkdwn\",
          \"text\": \"$MESSAGE\"
        }
      }
    ]
  }"
```

**使用示例**:

```bash
# 覆盖率告警
if (( $(echo "$COVERAGE < $PREV_COVERAGE - 5" | bc -l) )); then
    bash alert-to-slack.sh $SLACK_WEBHOOK "Coverage dropped from ${PREV_COVERAGE}% to ${COVERAGE}%"
fi
```

### Email告警

**配置** (使用GitHub Actions):

```yaml
- name: Send coverage alert
  if: env.COVERAGE_DROPPED == 'true'
  uses: dawidd6/action-send-mail@v3
  with:
    server_address: smtp.gmail.com
    server_port: 465
    username: ${{ secrets.EMAIL_USERNAME }}
    password: ${{ secrets.EMAIL_PASSWORD }}
    subject: ⚠️ Test Coverage Dropped
    to: team@example.com
    from: ci@example.com
    body: |
      Test coverage has dropped below threshold.

      Previous: 87.5%
      Current: 82.1%
      Drop: 5.4%

      Please review and add tests.
```

## 数据保留策略

```yaml
retention:
  realtime_metrics: 7天    # 实时指标
  daily_aggregates: 90天   # 每日聚合
  weekly_summaries: 1年    # 每周汇总
  monthly_reports: 永久     # 月度报告
```

## 最佳实践

### 1. 从简单开始

```
Phase 1 (第1周): Badge + README
  - 覆盖率徽章
  - 基本指标表格

Phase 2 (第2-4周): GitHub Actions仪表板
  - 自动更新指标
  - 趋势图表

Phase 3 (第2-3月): Grafana/自定义仪表板
  - 完整监控
  - 告警系统
```

### 2. 关注可操作指标

```
✅ GOOD: "Auth模块覆盖率从92%降到85%，需要补充3个测试"
❌ BAD: "整体代码质量评分: 7.2/10"
```

### 3. 避免指标游戏

```
问题: 开发者为了提高覆盖率而写无意义测试
解决: 结合测试质量评分，不仅看数量，更看质量
```

### 4. 定期回顾

```
每周: 团队回顾TDD合规性
每月: 分析趋势，调整流程
每季: 评估指标有效性，更新阈值
```

## 参考实现

### 开源项目示例

- **Codecov**: https://codecov.io - 覆盖率报告
- **Coveralls**: https://coveralls.io - 覆盖率追踪
- **SonarQube**: https://sonarqube.org - 代码质量平台

### 自建示例

参见: `examples/test-dashboard/` (待实现)

## 参考文档

- **Git Hooks**: `docs/3-guides/development/automation/git-hooks-tdd.md`
- **CI/CD Integration**: `docs/3-guides/development/automation/ci-cd-integration.md`
- **TDD Skill**: `.claude/skills/test-driven-development/SKILL.md`
