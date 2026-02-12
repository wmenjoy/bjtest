# AI测试多语言支持总结

> 版本: 1.0.0
> 创建日期: 2025-12-08
> 相关文档: best-practices.md, user-manual.md

## 概述

本文档总结了AI测试系统对10种编程语言的完整支持情况。

## 支持的语言矩阵

| 语言 | 覆盖率工具 | 测试框架 | Mock框架 | 命令支持 | 技能支持 | 状态 |
|------|----------|---------|---------|---------|---------|------|
| **Go** | go test -cover | testing + testify | testify/mock | ✅ | ✅ | 完全支持 |
| **Java** | JaCoCo | JUnit 5 | Mockito | ✅ | ✅ | 完全支持 |
| **JavaScript** | Jest/Istanbul | Jest | Jest | ✅ | ✅ | 完全支持 |
| **TypeScript** | Jest/Istanbul | Jest | Jest | ✅ | ✅ | 完全支持 |
| **Python** | pytest-cov | pytest | unittest.mock/pytest-mock | ✅ | ✅ | 完全支持 |
| **C++** | gcov/lcov | Google Test | Google Mock | ✅ | ✅ | 完全支持 |
| **C** | gcov | Unity | - | ✅ | ✅ | 完全支持 |
| **Rust** | tarpaulin | Built-in testing | mockall | ✅ | ✅ | 完全支持 |
| **Vue** | Vitest | Vitest + Vue Test Utils | Vitest (vi) | ✅ | ✅ | 完全支持 |
| **React** | Jest | Jest + React Testing Library | Jest | ✅ | ✅ | 完全支持 |

## 覆盖率工具使用

### Go
```bash
go test -coverprofile=coverage.out ./...
go tool cover -func=coverage.out
```

### Java
```bash
mvn clean test jacoco:report
# 报告: target/site/jacoco/index.html
```

### JavaScript/TypeScript
```bash
npm test -- --coverage
# 报告: coverage/lcov-report/index.html
```

### Python
```bash
pytest --cov=. --cov-report=xml --cov-report=html
# 报告: htmlcov/index.html
```

### C++
```bash
g++ -fprofile-arcs -ftest-coverage -o test_app *.cpp
./test_app
gcov *.cpp
lcov --capture --directory . --output-file coverage.info
```

### C
```bash
gcc -fprofile-arcs -ftest-coverage -o test_program *.c
./test_program
gcov *.c
```

### Rust
```bash
cargo install cargo-tarpaulin  # 首次安装
cargo tarpaulin --out Xml --out Html
# 报告: tarpaulin-report.html
```

### Vue
```bash
npm run test -- --coverage
# 或
vitest run --coverage
# 报告: coverage/index.html
```

### React
```bash
npm test -- --coverage --watchAll=false
# 报告: coverage/lcov-report/index.html
```

## 测试命令快速参考

### analyze-coverage 命令

分析代码覆盖率并识别缺口：

```bash
# Go项目
/analyze-coverage --path ./backend --threshold 85

# Java项目
/analyze-coverage --path ./src/main/java --threshold 80 --language java

# Python项目
/analyze-coverage --path ./src --threshold 80 --language python

# C++项目
/analyze-coverage --path ./src --threshold 75 --language cpp

# Rust项目
/analyze-coverage --path ./src --threshold 85 --language rust

# Vue项目
/analyze-coverage --path ./src/components --threshold 80 --language vue

# React项目
/analyze-coverage --path ./src/components --threshold 80 --language react
```

### generate-tests 命令

为已有代码生成测试：

```bash
# Go
/generate-tests --file internal/service/user_service.go --coverage 85

# Java
/generate-tests --file src/main/java/UserService.java --language java

# Python
/generate-tests --file src/services/user_service.py --language python

# C++
/generate-tests --file src/user_service.cpp --language cpp

# Rust
/generate-tests --file src/user_service.rs --language rust

# Vue
/generate-tests --file src/components/UserProfile.vue --language vue

# React
/generate-tests --file src/components/UserProfile.tsx --language react
```

## 语言特定最佳实践

### Go
- ✅ 使用表驱动测试
- ✅ 使用t.Helper()标记辅助函数
- ✅ 使用t.Parallel()并行测试
- ✅ 使用testify进行断言

### Java
- ✅ 使用@DisplayName提高可读性
- ✅ 使用@Nested组织测试
- ✅ 使用@ParameterizedTest参数化测试
- ✅ 使用AssertJ流式断言

### JavaScript/TypeScript
- ✅ 使用describe/it组织测试
- ✅ 使用beforeEach/afterEach管理状态
- ✅ 使用jest.fn()创建mock
- ✅ 使用test.each参数化测试

### Python
- ✅ 使用pytest fixtures管理依赖
- ✅ 使用@pytest.mark.parametrize参数化
- ✅ 使用pytest-mock简化mocking
- ✅ 使用@pytest.mark.asyncio测试异步代码

### C++
- ✅ 使用TEST_F进行fixture测试
- ✅ 使用EXPECT_CALL设置mock期望
- ✅ 使用INSTANTIATE_TEST_SUITE_P参数化
- ✅ 使用EXPECT_NO_THROW测试异常

### Rust
- ✅ 使用#[cfg(test)]分离测试代码
- ✅ 使用#[should_panic]测试panic
- ✅ 使用mockall创建mock
- ✅ 使用Result<(), Box<dyn Error>>简化错误处理

### Vue
- ✅ 使用mount挂载组件
- ✅ 使用wrapper.emitted()测试事件
- ✅ 使用flushPromises等待异步操作
- ✅ 使用data-testid选择元素

### React
- ✅ 使用screen查询元素
- ✅ 使用userEvent模拟用户操作
- ✅ 使用waitFor等待异步更新
- ✅ 使用renderHook测试自定义hooks

## 常见问题

### Q1: 如何选择合适的测试框架？

A: 按照语言推荐：
- **Go**: testing + testify（标准+增强断言）
- **Java**: JUnit 5 + Mockito + AssertJ
- **JS/TS**: Jest（全功能解决方案）
- **Python**: pytest（强大灵活）
- **C++**: Google Test + Google Mock
- **C**: Unity（轻量级）
- **Rust**: 内置testing + mockall
- **Vue**: Vitest + Vue Test Utils
- **React**: Jest + React Testing Library

### Q2: 不同语言的覆盖率目标应该一致吗？

A: 建议根据语言特性调整：
- **类型安全语言**（Go, Rust, TypeScript）: 80-85%
- **动态语言**（Python, JavaScript）: 85-90%（需要更多测试弥补类型检查缺失）
- **系统编程**（C, C++）: 75-80%（考虑测试难度）
- **前端组件**（Vue, React）: 70-80%（视觉测试难度较高）

### Q3: 如何处理多语言项目？

A: 策略：
1. **分别设置覆盖率目标**：每种语言独立配置
2. **统一测试流程**：使用相同的测试阶段（单元→集成→E2E）
3. **集中报告**：汇总到统一的CI/CD dashboard
4. **共享最佳实践**：AAA模式、FIRST原则等通用原则

### Q4: AI生成的测试在不同语言中质量一致吗？

A: 质量因语言而异：
- **最佳**：Go, Java, TypeScript（文档多，示例丰富）
- **良好**：Python, JavaScript, C++（社区活跃）
- **中等**：Rust, Vue, React（相对较新，但快速改善）
- **基础**：C（简单，但测试框架有限）

建议：**始终审查AI生成的测试**，特别是对于较新的语言和框架。

## 更新日志

### 2025-12-08
- ✅ 添加Python完整支持
- ✅ 添加C++完整支持
- ✅ 添加C完整支持
- ✅ 添加Rust完整支持
- ✅ 添加Vue完整支持
- ✅ 添加React完整支持
- ✅ 更新所有命令和技能文档
- ✅ 添加语言特定示例代码

## 参考文档

- **命令文档**:
  - `.claude/commands/analyze-coverage.md`
  - `.claude/commands/generate-tests.md`

- **技能文档**:
  - `.claude/skills/coverage-analyzer/SKILL.md`
  - `.claude/skills/test-generation-expert/SKILL.md`
  - `.claude/skills/test-driven-development/SKILL.md`

- **最佳实践**:
  - `docs/3-guides/ai-testing/best-practices.md`
  - `docs/3-guides/ai-testing/user-manual.md`

- **测试报告**:
  - `docs/ai-testing-skills-verification-report.md`
