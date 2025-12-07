# 覆盖率分析命令

分析代码覆盖率，识别测试缺口，并生成补充测试建议。

## 使用方式

```
/analyze-coverage [选项]
```

## 选项

- `--path <路径>`: 要分析的代码路径（文件或目录）
- `--report <路径>`: 现有覆盖率报告文件路径（可选）
- `--threshold <百分比>`: 目标覆盖率阈值，默认 80%
- `--generate`: 自动生成补充测试
- `--output <格式>`: 输出格式 (text/json/markdown)，默认 markdown

## 执行流程

### 步骤 1: 收集覆盖率数据

根据项目语言运行覆盖率工具：

**Go:**
```bash
go test -coverprofile=coverage.out ./...
go tool cover -func=coverage.out
```

**Java:**
```bash
mvn test jacoco:report
# 读取 target/site/jacoco/jacoco.xml
```

**JavaScript/TypeScript:**
```bash
npm test -- --coverage
# 读取 coverage/lcov-report/index.html 或 coverage/coverage-summary.json
```

**C++:**
```bash
cmake --build . --target coverage
# 读取 coverage.info
```

### 步骤 2: 解析覆盖率报告

提取以下信息：
- 总体行覆盖率
- 总体分支覆盖率
- 每个文件的覆盖率
- 未覆盖的行号
- 未覆盖的分支条件

### 步骤 3: 识别覆盖率缺口

分析未覆盖的代码，分类：

```yaml
coverage_gaps:
  uncovered_functions:
    - 完全未测试的函数
    - 原因分析

  uncovered_branches:
    - 条件分支
    - 错误处理路径
    - 边界条件

  uncovered_lines:
    - 具体行号
    - 代码上下文
    - 覆盖建议

  edge_cases_missing:
    - 缺失的边界测试
    - 缺失的错误处理测试
```

### 步骤 4: 分析缺口原因

对每个覆盖缺口进行原因分析：

| 原因类型 | 描述 | 建议操作 |
|---------|------|---------|
| missing_test | 缺少测试用例 | 生成新测试 |
| dead_code | 死代码 | 删除代码 |
| hard_to_test | 难以测试 | 重构代码 |
| external_dependency | 外部依赖 | 添加 mock |
| error_path | 错误路径 | 添加错误测试 |
| edge_case | 边界条件 | 添加边界测试 |

### 步骤 5: 生成补充测试建议

为每个覆盖缺口生成测试建议：

```markdown
### 缺口 1: {file}:{line}

**未覆盖代码:**
```{language}
{uncovered_code}
```

**原因:** {reason}

**建议测试:**
```{language}
{suggested_test}
```

**预计覆盖提升:** +{percentage}%
```

### 步骤 6: 如果指定 --generate，自动生成测试

调用 `/generate-tests` 命令为识别的缺口生成测试。

### 步骤 7: 输出分析报告

## 输出格式

```markdown
# 覆盖率分析报告

## 概览

| 指标 | 当前值 | 目标值 | 状态 |
|------|--------|--------|------|
| 行覆盖率 | {line}% | {threshold}% | {status} |
| 分支覆盖率 | {branch}% | {threshold}% | {status} |
| 函数覆盖率 | {function}% | {threshold}% | {status} |

## 覆盖率详情

### 高覆盖率文件 (>90%)
| 文件 | 覆盖率 |
|------|--------|
| {file} | {coverage}% |

### 低覆盖率文件 (<{threshold}%)
| 文件 | 覆盖率 | 缺口数 |
|------|--------|--------|
| {file} | {coverage}% | {gaps} |

## 覆盖率缺口分析

### 缺口 1: {file}:{line_range}

**类型:** {gap_type}
**严重程度:** {severity}

**未覆盖代码:**
```{language}
{code}
```

**分析:**
{analysis}

**建议测试:**
```{language}
{suggested_test}
```

---

## 改进建议

### 优先级 1 (关键)
- {suggestion_1}

### 优先级 2 (重要)
- {suggestion_2}

### 优先级 3 (建议)
- {suggestion_3}

## 预计改进

如果实施所有建议:
- 行覆盖率: {current}% → {estimated}%
- 分支覆盖率: {current}% → {estimated}%
```

## 示例

### 示例 1: 分析项目覆盖率

```
用户: /analyze-coverage --path ./internal
```

### 示例 2: 分析并生成补充测试

```
用户: /analyze-coverage --path ./src/services --threshold 90 --generate
```

### 示例 3: 使用现有报告分析

```
用户: /analyze-coverage --report coverage.out --threshold 85
```

## 集成建议

### CI/CD 集成

```yaml
# .github/workflows/coverage.yml
- name: Run Coverage Analysis
  run: |
    # 运行测试收集覆盖率
    go test -coverprofile=coverage.out ./...

    # 使用 Claude Code 分析
    claude "/analyze-coverage --report coverage.out --threshold 80"
```

### Pre-commit Hook

```bash
#!/bin/bash
# .git/hooks/pre-push

# 检查覆盖率
claude "/analyze-coverage --path . --threshold 80"
if [ $? -ne 0 ]; then
    echo "覆盖率低于阈值，请补充测试"
    exit 1
fi
```

## 参考文档

- 测试案例库标准: `docs/1-specs/ai-test-generation/test-case-library-standard.md`
- 最佳实践指南: `docs/3-guides/ai-testing/best-practices.md`
- 代码生成规范: `docs/1-specs/ai-test-generation/code-generation-specification.md`
