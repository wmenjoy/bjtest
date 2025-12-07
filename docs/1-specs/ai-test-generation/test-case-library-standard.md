# 测试案例库标准规范

> 版本: 1.0.0
> 创建日期: 2025-12-07
> 状态: 设计阶段

## 1. 概述

测试案例库是 AI 测试生成系统的核心知识库，存储了经过验证的测试模式、模板和规则。本文档定义了案例库的结构、格式标准和管理规范。

### 1.1 设计原则

| 原则 | 描述 |
|------|------|
| **语言无关** | 模板和模式不依赖特定编程语言 |
| **可组合** | 小粒度模式可以组合成复杂测试 |
| **可扩展** | 易于添加新的模式和模板 |
| **版本化** | 所有内容都有版本控制 |
| **可验证** | 模板有明确的验证标准 |

### 1.2 核心概念

```
┌─────────────────────────────────────────────────────────────────┐
│                        测试案例库                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │   Pattern   │  │  Template   │  │  Assertion  │             │
│  │   (模式)    │  │   (模板)    │  │   (断言)    │             │
│  │             │  │             │  │             │             │
│  │ 原子测试行为 │  │ 完整测试场景 │  │ 验证规则   │             │
│  │ 可重用组件   │  │ 可实例化    │  │ 语言无关   │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│         │                │                │                    │
│         └────────────────┼────────────────┘                    │
│                          │                                     │
│                  ┌───────▼───────┐                             │
│                  │    Rules      │                             │
│                  │   (规则)      │                             │
│                  │               │                             │
│                  │ 质量标准      │                             │
│                  │ 覆盖率要求    │                             │
│                  │ 命名约定      │                             │
│                  └───────────────┘                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. 目录结构

```
test-case-library/
├── README.md                        # 案例库说明
├── VERSION                          # 当前版本号
├── CHANGELOG.md                     # 变更历史
│
├── patterns/                        # 测试模式库
│   ├── _index.yaml                  # 模式索引
│   ├── unit/                        # 单元测试模式
│   │   ├── assertion-patterns.yaml
│   │   ├── mock-patterns.yaml
│   │   ├── setup-teardown-patterns.yaml
│   │   └── data-driven-patterns.yaml
│   ├── integration/                 # 集成测试模式
│   │   ├── api-testing-patterns.yaml
│   │   ├── database-patterns.yaml
│   │   ├── messaging-patterns.yaml
│   │   └── external-service-patterns.yaml
│   ├── e2e/                         # 端到端测试模式
│   │   ├── user-flow-patterns.yaml
│   │   ├── ui-interaction-patterns.yaml
│   │   └── multi-system-patterns.yaml
│   └── security/                    # 安全测试模式
│       ├── injection-patterns.yaml
│       ├── authentication-patterns.yaml
│       ├── authorization-patterns.yaml
│       └── data-protection-patterns.yaml
│
├── templates/                       # 测试模板库
│   ├── _index.yaml                  # 模板索引
│   ├── _schema.yaml                 # 模板 Schema 定义
│   ├── common/                      # 通用模板
│   │   ├── crud-operations.yaml
│   │   ├── authentication.yaml
│   │   ├── authorization.yaml
│   │   ├── validation.yaml
│   │   └── error-handling.yaml
│   ├── domain/                      # 领域特定模板
│   │   ├── e-commerce/
│   │   │   ├── cart-operations.yaml
│   │   │   ├── checkout-flow.yaml
│   │   │   └── payment-processing.yaml
│   │   ├── social/
│   │   │   ├── user-profile.yaml
│   │   │   ├── content-posting.yaml
│   │   │   └── social-interaction.yaml
│   │   └── fintech/
│   │       ├── transaction.yaml
│   │       ├── account-management.yaml
│   │       └── compliance.yaml
│   └── infrastructure/              # 基础设施模板
│       ├── database/
│       │   ├── connection-pool.yaml
│       │   ├── transaction-handling.yaml
│       │   └── migration.yaml
│       ├── cache/
│       │   ├── cache-operations.yaml
│       │   └── cache-invalidation.yaml
│       └── messaging/
│           ├── queue-operations.yaml
│           └── pubsub.yaml
│
├── assertions/                      # 断言库
│   ├── _index.yaml
│   ├── common/
│   │   ├── equality.yaml
│   │   ├── nullability.yaml
│   │   ├── collection.yaml
│   │   └── string.yaml
│   ├── http/
│   │   ├── status-code.yaml
│   │   ├── headers.yaml
│   │   ├── body.yaml
│   │   └── timing.yaml
│   ├── database/
│   │   ├── record-existence.yaml
│   │   ├── field-values.yaml
│   │   └── constraints.yaml
│   └── security/
│       ├── authentication.yaml
│       ├── authorization.yaml
│       └── data-protection.yaml
│
├── fixtures/                        # 测试数据
│   ├── generators/                  # 数据生成器
│   │   ├── user-generator.yaml
│   │   ├── product-generator.yaml
│   │   └── transaction-generator.yaml
│   └── samples/                     # 示例数据
│       ├── users.yaml
│       ├── products.yaml
│       └── transactions.yaml
│
├── rules/                           # 规则库
│   ├── coverage-rules.yaml          # 覆盖率规则
│   ├── naming-conventions.yaml      # 命名约定
│   ├── quality-metrics.yaml         # 质量指标
│   └── language-mappings.yaml       # 语言映射规则
│
└── schemas/                         # JSON Schema 定义
    ├── pattern.schema.json
    ├── template.schema.json
    ├── assertion.schema.json
    └── rule.schema.json
```

---

## 3. 模式 (Pattern) 规范

### 3.1 模式定义

模式是测试中最小的可重用单元，描述一种特定的测试行为或技术。

### 3.2 模式 Schema

```yaml
# schemas/pattern.schema.yaml
pattern:
  type: object
  required:
    - id
    - name
    - category
    - description
    - applicability
    - structure
  properties:
    id:
      type: string
      pattern: "^[a-z]+-[a-z]+-[0-9]{3}$"
      description: "唯一标识符，格式: {category}-{type}-{number}"

    name:
      type: string
      description: "模式名称"

    category:
      type: string
      enum: [unit, integration, e2e, security, performance]
      description: "测试类别"

    description:
      type: string
      description: "模式描述"

    version:
      type: string
      pattern: "^[0-9]+\\.[0-9]+\\.[0-9]+$"
      description: "语义化版本号"

    applicability:
      type: object
      properties:
        languages:
          type: array
          items:
            type: string
          description: "适用的编程语言"
        frameworks:
          type: array
          items:
            type: string
          description: "适用的测试框架"
        scenarios:
          type: array
          items:
            type: string
          description: "适用的测试场景"

    structure:
      type: object
      description: "模式结构定义"

    examples:
      type: array
      items:
        type: object
      description: "使用示例"

    anti_patterns:
      type: array
      items:
        type: string
      description: "应避免的用法"

    related_patterns:
      type: array
      items:
        type: string
      description: "相关模式 ID"
```

### 3.3 模式示例

```yaml
# patterns/unit/mock-patterns.yaml
patterns:
  - id: unit-mock-001
    name: "Dependency Injection Mock"
    category: unit
    description: |
      通过依赖注入替换真实依赖为模拟对象，
      实现单元测试的隔离性。
    version: "1.0.0"

    applicability:
      languages: [golang, java, typescript, python]
      frameworks: [gomock, mockito, jest, pytest]
      scenarios:
        - 测试依赖外部服务的函数
        - 测试数据库操作
        - 测试第三方 API 调用

    structure:
      setup:
        - description: "创建 mock 对象"
          abstract: create_mock(dependency_interface)
        - description: "配置 mock 行为"
          abstract: configure_mock(mock, expected_calls, return_values)
        - description: "注入 mock 到被测对象"
          abstract: inject_mock(target, mock)

      execution:
        - description: "调用被测方法"
          abstract: call_method(target, method, args)

      verification:
        - description: "验证 mock 调用"
          abstract: verify_mock_calls(mock, expected_calls)
        - description: "验证结果"
          abstract: assert_result(actual, expected)

      cleanup:
        - description: "重置或销毁 mock"
          abstract: cleanup_mock(mock)

    examples:
      - language: golang
        framework: gomock
        code: |
          func TestService_GetUser(t *testing.T) {
              ctrl := gomock.NewController(t)
              defer ctrl.Finish()

              mockRepo := NewMockUserRepository(ctrl)
              mockRepo.EXPECT().
                  FindByID(gomock.Eq("user-123")).
                  Return(&User{ID: "user-123", Name: "Test"}, nil)

              service := NewUserService(mockRepo)
              user, err := service.GetUser("user-123")

              assert.NoError(t, err)
              assert.Equal(t, "Test", user.Name)
          }

      - language: java
        framework: mockito
        code: |
          @Test
          void testGetUser() {
              UserRepository mockRepo = mock(UserRepository.class);
              when(mockRepo.findById("user-123"))
                  .thenReturn(Optional.of(new User("user-123", "Test")));

              UserService service = new UserService(mockRepo);
              User user = service.getUser("user-123");

              assertEquals("Test", user.getName());
              verify(mockRepo, times(1)).findById("user-123");
          }

    anti_patterns:
      - "在集成测试中使用 mock（应使用真实依赖）"
      - "mock 返回值与真实行为不一致"
      - "过度 mock 导致测试脆弱"
      - "mock 内部实现细节而非接口"

    related_patterns:
      - unit-stub-001
      - unit-spy-001
      - unit-fake-001

  - id: unit-mock-002
    name: "Behavior Verification Mock"
    category: unit
    description: |
      验证被测代码是否正确调用了依赖，
      包括调用次数、参数和顺序。
    version: "1.0.0"

    applicability:
      languages: [golang, java, typescript]
      frameworks: [gomock, mockito, jest]
      scenarios:
        - 验证日志记录
        - 验证通知发送
        - 验证缓存操作

    structure:
      setup:
        - description: "创建 mock 并定义期望"
          abstract: create_mock_with_expectations(interface, expectations)

      execution:
        - description: "执行被测代码"
          abstract: execute_code_under_test()

      verification:
        - description: "验证所有期望都已满足"
          abstract: verify_all_expectations(mock)

    examples:
      - language: golang
        framework: gomock
        code: |
          func TestNotifier_SendEmail(t *testing.T) {
              ctrl := gomock.NewController(t)
              defer ctrl.Finish()

              mockMailer := NewMockMailer(ctrl)

              // 定义期望：必须调用 Send，参数匹配
              mockMailer.EXPECT().
                  Send(
                      gomock.Eq("user@example.com"),
                      gomock.Eq("Welcome"),
                      gomock.Any(),
                  ).
                  Times(1).
                  Return(nil)

              notifier := NewNotifier(mockMailer)
              err := notifier.WelcomeUser("user@example.com")

              require.NoError(t, err)
              // gomock 自动验证期望
          }

    anti_patterns:
      - "验证不重要的内部调用"
      - "参数匹配过于严格"
      - "忽略调用顺序（如果顺序重要）"
```

---

## 4. 模板 (Template) 规范

### 4.1 模板定义

模板是完整的测试场景集合，可以被实例化为具体的测试代码。

### 4.2 模板 Schema

```yaml
# schemas/template.schema.yaml
template:
  type: object
  required:
    - id
    - name
    - description
    - applicable_to
    - test_scenarios
  properties:
    id:
      type: string
      pattern: "^[a-z]+-[0-9]{3}$"

    name:
      type: string

    description:
      type: string

    version:
      type: string
      pattern: "^[0-9]+\\.[0-9]+\\.[0-9]+$"

    tags:
      type: array
      items:
        type: string

    applicable_to:
      type: object
      properties:
        functions:
          type: array
          description: "适用的函数名模式"
        patterns:
          type: array
          description: "适用的代码模式"
        domains:
          type: array
          description: "适用的业务领域"

    dependencies:
      type: object
      properties:
        mocks:
          type: array
          description: "需要的 mock 对象"
        fixtures:
          type: array
          description: "需要的测试数据"
        setup:
          type: array
          description: "前置条件"

    test_scenarios:
      type: array
      items:
        $ref: "#/definitions/scenario"

    coverage_targets:
      type: object
      properties:
        line_coverage:
          type: number
        branch_coverage:
          type: number
        mutation_score:
          type: number

definitions:
  scenario:
    type: object
    required:
      - id
      - name
      - given
      - when
      - then
    properties:
      id:
        type: string
      name:
        type: string
      category:
        type: string
        enum: [happy_path, error_handling, edge_case, security, performance]
      priority:
        type: string
        enum: [critical, high, medium, low]
      given:
        type: array
        description: "前置条件"
      when:
        type: object
        description: "执行的动作"
      then:
        type: array
        description: "预期结果/断言"
      tags:
        type: array
```

### 4.3 模板示例

```yaml
# templates/common/crud-operations.yaml
id: crud-001
name: "CRUD Operations Testing"
description: |
  完整的 CRUD（创建、读取、更新、删除）操作测试模板，
  涵盖正常路径、错误处理和边界情况。
version: "2.0.0"
tags: [crud, database, persistence, common]

applicable_to:
  functions:
    - "*Create*"
    - "*Get*"
    - "*Find*"
    - "*Update*"
    - "*Delete*"
    - "*Save*"
    - "*Remove*"
  patterns:
    - "*Repository*"
    - "*Store*"
    - "*DAO*"
    - "*Service*"
  domains:
    - any

dependencies:
  mocks:
    - database_connection
    - transaction_manager
  fixtures:
    - valid_entity
    - invalid_entity
  setup:
    - database_initialized
    - test_data_seeded

test_scenarios:
  # ============ CREATE 操作 ============
  - id: create_happy_path
    name: "Successfully create entity"
    category: happy_path
    priority: critical
    given:
      - valid_entity_data
      - database_available
    when:
      action: create
      input: valid_entity
    then:
      - assert: no_error
      - assert: entity_created
        verify: entity_exists_in_database
      - assert: id_assigned
        verify: entity.id != null
      - assert: timestamps_set
        verify:
          - entity.created_at != null
          - entity.updated_at != null
    tags: [smoke, critical]

  - id: create_duplicate
    name: "Reject duplicate entity"
    category: error_handling
    priority: high
    given:
      - entity_already_exists
    when:
      action: create
      input: duplicate_entity
    then:
      - assert: error_returned
        error_type: duplicate_error
      - assert: entity_not_created
        verify: count_unchanged
    tags: [error_handling]

  - id: create_validation_failure
    name: "Reject invalid entity"
    category: error_handling
    priority: high
    given:
      - invalid_entity_data
        variations:
          - missing_required_field
          - invalid_format
          - exceeds_max_length
    when:
      action: create
      input: invalid_entity
    then:
      - assert: validation_error
      - assert: error_details_provided
        verify: error.field != null
    tags: [validation]

  - id: create_null_input
    name: "Handle null input"
    category: edge_case
    priority: medium
    given:
      - null_input
    when:
      action: create
      input: null
    then:
      - assert: error_returned
        error_type: invalid_input
      - assert: no_panic
    tags: [edge_case, defensive]

  # ============ READ 操作 ============
  - id: read_by_id_success
    name: "Find entity by ID"
    category: happy_path
    priority: critical
    given:
      - entity_exists_with_id: "test-123"
    when:
      action: find_by_id
      input: "test-123"
    then:
      - assert: no_error
      - assert: entity_returned
      - assert: entity_matches
        verify: returned.id == "test-123"
    tags: [smoke, critical]

  - id: read_by_id_not_found
    name: "Handle non-existent ID"
    category: error_handling
    priority: high
    given:
      - entity_does_not_exist
    when:
      action: find_by_id
      input: "non-existent-id"
    then:
      - assert: not_found_error
        or: nil_result  # 根据实现可能返回错误或 nil
      - assert: no_panic
    tags: [error_handling]

  - id: read_list_with_pagination
    name: "List entities with pagination"
    category: happy_path
    priority: high
    given:
      - multiple_entities_exist
        count: 50
    when:
      action: list
      input:
        page: 1
        page_size: 10
    then:
      - assert: correct_page_size
        verify: len(result) == 10
      - assert: pagination_info
        verify:
          - total_count == 50
          - has_next_page == true
    tags: [pagination]

  - id: read_with_filter
    name: "Filter entities by criteria"
    category: happy_path
    priority: medium
    given:
      - mixed_entities_exist
    when:
      action: find_by_criteria
      input:
        status: "active"
    then:
      - assert: filtered_results
        verify: all(entity.status == "active")
    tags: [filtering]

  # ============ UPDATE 操作 ============
  - id: update_success
    name: "Successfully update entity"
    category: happy_path
    priority: critical
    given:
      - entity_exists_with_id: "test-123"
    when:
      action: update
      input:
        id: "test-123"
        changes:
          name: "Updated Name"
    then:
      - assert: no_error
      - assert: entity_updated
        verify: entity.name == "Updated Name"
      - assert: updated_at_changed
        verify: entity.updated_at > original.updated_at
      - assert: other_fields_unchanged
    tags: [smoke, critical]

  - id: update_not_found
    name: "Update non-existent entity"
    category: error_handling
    priority: high
    given:
      - entity_does_not_exist
    when:
      action: update
      input:
        id: "non-existent"
        changes: {}
    then:
      - assert: not_found_error
    tags: [error_handling]

  - id: update_concurrent_modification
    name: "Handle concurrent update"
    category: edge_case
    priority: medium
    given:
      - entity_exists
      - concurrent_update_in_progress
    when:
      action: update
      input: stale_version
    then:
      - assert: conflict_error
        or: optimistic_lock_exception
    tags: [concurrency, edge_case]

  # ============ DELETE 操作 ============
  - id: delete_success
    name: "Successfully delete entity"
    category: happy_path
    priority: critical
    given:
      - entity_exists_with_id: "test-123"
    when:
      action: delete
      input: "test-123"
    then:
      - assert: no_error
      - assert: entity_deleted
        verify: entity_not_in_database
      - assert: cascading_deletes  # 如果适用
        verify: related_entities_handled
    tags: [smoke, critical]

  - id: delete_not_found
    name: "Delete non-existent entity"
    category: error_handling
    priority: medium
    given:
      - entity_does_not_exist
    when:
      action: delete
      input: "non-existent"
    then:
      - assert: not_found_error
        or: idempotent_success  # 根据实现
    tags: [error_handling]

  - id: delete_with_dependencies
    name: "Delete entity with dependencies"
    category: edge_case
    priority: high
    given:
      - entity_exists
      - entity_has_dependencies
    when:
      action: delete
      input: entity_id
    then:
      - assert: dependency_error
        verify: helpful_error_message
        or: cascading_delete
    tags: [edge_case, integrity]

# ============ 边界案例 ============
edge_cases:
  - empty_string_id
  - very_long_id
  - special_characters_in_id
  - unicode_in_fields
  - max_field_lengths
  - null_optional_fields
  - empty_collections

# ============ 性能要求 ============
performance_requirements:
  create:
    max_latency_p95: 100ms
  read_single:
    max_latency_p95: 50ms
  read_list:
    max_latency_p95: 200ms
  update:
    max_latency_p95: 100ms
  delete:
    max_latency_p95: 100ms

# ============ 覆盖率目标 ============
coverage_targets:
  line_coverage: 90
  branch_coverage: 85
  mutation_score: 75
```

---

## 5. 断言 (Assertion) 规范

### 5.1 断言定义

断言是测试验证的基本单元，定义了如何验证测试结果。

### 5.2 断言分类

```yaml
# assertions/_index.yaml
categories:
  - name: equality
    description: "相等性断言"
    assertions:
      - equals
      - not_equals
      - deep_equals
      - same_instance

  - name: nullability
    description: "空值断言"
    assertions:
      - is_null
      - is_not_null
      - is_empty
      - is_not_empty

  - name: comparison
    description: "比较断言"
    assertions:
      - greater_than
      - less_than
      - greater_or_equal
      - less_or_equal
      - between

  - name: collection
    description: "集合断言"
    assertions:
      - contains
      - not_contains
      - has_size
      - is_subset
      - all_match
      - any_match

  - name: string
    description: "字符串断言"
    assertions:
      - starts_with
      - ends_with
      - contains_substring
      - matches_regex
      - has_length

  - name: error
    description: "错误断言"
    assertions:
      - no_error
      - has_error
      - error_type
      - error_message_contains

  - name: http
    description: "HTTP 断言"
    assertions:
      - status_code
      - header_exists
      - header_value
      - body_contains
      - json_path_equals

  - name: async
    description: "异步断言"
    assertions:
      - eventually
      - within_timeout
      - never_happens
```

### 5.3 断言示例

```yaml
# assertions/common/equality.yaml
assertions:
  - id: equals
    name: "Equals"
    description: "验证两个值相等"
    parameters:
      - name: expected
        type: any
        required: true
      - name: actual
        type: any
        required: true
      - name: message
        type: string
        required: false
    language_mappings:
      golang:
        testify: 'assert.Equal(t, {{expected}}, {{actual}}, "{{message}}")'
        stdlib: 'if {{expected}} != {{actual}} { t.Errorf("{{message}}") }'
      java:
        junit5: 'assertEquals({{expected}}, {{actual}}, "{{message}}")'
        assertj: 'assertThat({{actual}}).isEqualTo({{expected}})'
      javascript:
        jest: 'expect({{actual}}).toBe({{expected}})'
        chai: 'expect({{actual}}).to.equal({{expected}})'
      python:
        pytest: 'assert {{actual}} == {{expected}}, "{{message}}"'
        unittest: 'self.assertEqual({{expected}}, {{actual}}, "{{message}}")'

  - id: deep_equals
    name: "Deep Equals"
    description: "验证两个对象深度相等"
    parameters:
      - name: expected
        type: object
        required: true
      - name: actual
        type: object
        required: true
    language_mappings:
      golang:
        testify: 'assert.EqualValues(t, {{expected}}, {{actual}})'
        cmp: 'if diff := cmp.Diff({{expected}}, {{actual}}); diff != "" { t.Error(diff) }'
      java:
        assertj: 'assertThat({{actual}}).usingRecursiveComparison().isEqualTo({{expected}})'
      javascript:
        jest: 'expect({{actual}}).toEqual({{expected}})'

# assertions/http/status-code.yaml
assertions:
  - id: status_code
    name: "HTTP Status Code"
    description: "验证 HTTP 响应状态码"
    parameters:
      - name: expected
        type: integer
        required: true
      - name: response
        type: http_response
        required: true
    language_mappings:
      golang:
        testify: 'assert.Equal(t, {{expected}}, {{response}}.StatusCode)'
        httptest: 'if {{response}}.Code != {{expected}} { t.Errorf("expected %d, got %d", {{expected}}, {{response}}.Code) }'
      java:
        restassured: '.statusCode({{expected}})'
        mockmvc: '.andExpect(status().is({{expected}}))'
      javascript:
        supertest: '.expect({{expected}})'
        axios: 'expect({{response}}.status).toBe({{expected}})'

  - id: status_ok
    name: "HTTP 200 OK"
    description: "验证响应状态为 200 OK"
    extends: status_code
    parameters:
      - name: expected
        default: 200

  - id: status_created
    name: "HTTP 201 Created"
    description: "验证响应状态为 201 Created"
    extends: status_code
    parameters:
      - name: expected
        default: 201

  - id: status_bad_request
    name: "HTTP 400 Bad Request"
    description: "验证响应状态为 400 Bad Request"
    extends: status_code
    parameters:
      - name: expected
        default: 400

  - id: status_unauthorized
    name: "HTTP 401 Unauthorized"
    description: "验证响应状态为 401 Unauthorized"
    extends: status_code
    parameters:
      - name: expected
        default: 401

  - id: status_not_found
    name: "HTTP 404 Not Found"
    description: "验证响应状态为 404 Not Found"
    extends: status_code
    parameters:
      - name: expected
        default: 404

# assertions/error/error-handling.yaml
assertions:
  - id: no_error
    name: "No Error"
    description: "验证没有错误发生"
    parameters:
      - name: err
        type: error
        required: true
      - name: message
        type: string
        required: false
        default: "expected no error"
    language_mappings:
      golang:
        testify: 'require.NoError(t, {{err}}, "{{message}}")'
        stdlib: 'if {{err}} != nil { t.Fatalf("{{message}}: %v", {{err}}) }'
      java:
        junit5: 'assertDoesNotThrow(() -> { {{code}} })'
      javascript:
        jest: 'expect(() => { {{code}} }).not.toThrow()'
      python:
        pytest: '# 如果没有异常，测试通过'

  - id: error_type
    name: "Error Type"
    description: "验证错误类型"
    parameters:
      - name: err
        type: error
        required: true
      - name: expected_type
        type: error_type
        required: true
    language_mappings:
      golang:
        errors: 'assert.ErrorIs(t, {{err}}, {{expected_type}})'
        type_assert: 'var target *{{expected_type}}; assert.ErrorAs(t, {{err}}, &target)'
      java:
        junit5: 'assertThrows({{expected_type}}.class, () -> { {{code}} })'
      javascript:
        jest: 'expect(() => { {{code}} }).toThrow({{expected_type}})'
      python:
        pytest: 'with pytest.raises({{expected_type}}): {{code}}'
```

---

## 6. 规则 (Rule) 规范

### 6.1 覆盖率规则

```yaml
# rules/coverage-rules.yaml
coverage_rules:
  default:
    line_coverage:
      minimum: 80
      target: 90
      critical_paths: 95

    branch_coverage:
      minimum: 75
      target: 85
      critical_paths: 90

    mutation_score:
      minimum: 60
      target: 75

  by_criticality:
    critical:
      line_coverage: 95
      branch_coverage: 90
      mutation_score: 80

    high:
      line_coverage: 90
      branch_coverage: 85
      mutation_score: 75

    medium:
      line_coverage: 80
      branch_coverage: 75
      mutation_score: 60

    low:
      line_coverage: 70
      branch_coverage: 65
      mutation_score: 50

  exclusions:
    - pattern: "*_generated.go"
      reason: "Auto-generated code"
    - pattern: "**/vendor/**"
      reason: "Third-party code"
    - pattern: "**/mock_*.go"
      reason: "Mock implementations"
    - pattern: "**/test/**"
      reason: "Test code"

  enforcement:
    pre_commit: warning
    pr_merge: block_if_decreased
    release: strict
```

### 6.2 命名约定

```yaml
# rules/naming-conventions.yaml
naming_conventions:
  golang:
    test_file: "{source_file}_test.go"
    test_function: "Test{FunctionName}_{Scenario}"
    benchmark_function: "Benchmark{FunctionName}"
    example_function: "Example{FunctionName}"
    helper_function: "test{Helper}"

    examples:
      test_function:
        - "TestLogin_Success"
        - "TestLogin_InvalidPassword"
        - "TestLogin_AccountLocked"
      benchmark_function:
        - "BenchmarkLogin"
      helper_function:
        - "testSetupUser"
        - "testCreateToken"

  java:
    test_class: "{SourceClass}Test"
    test_method: "test{Scenario}_{ExpectedBehavior}"
    parameterized_method: "test{Scenario}_WithParameters"

    examples:
      test_class:
        - "UserServiceTest"
        - "AuthenticationControllerTest"
      test_method:
        - "testLogin_Success"
        - "testLogin_ShouldReturnUnauthorizedForInvalidPassword"

  javascript:
    test_file: "{source_file}.test.{js|ts}"
    describe_block: "{ClassName|FunctionName}"
    it_block: "should {expected_behavior} when {condition}"

    examples:
      describe_block:
        - "UserService"
        - "login"
      it_block:
        - "should return token when credentials are valid"
        - "should throw UnauthorizedError when password is invalid"

  python:
    test_file: "test_{source_file}.py"
    test_class: "Test{ClassName}"
    test_method: "test_{scenario}_{expected_behavior}"

    examples:
      test_class:
        - "TestUserService"
        - "TestAuthenticationFlow"
      test_method:
        - "test_login_success"
        - "test_login_invalid_password_raises_unauthorized"
```

### 6.3 质量指标

```yaml
# rules/quality-metrics.yaml
quality_metrics:
  test_quality:
    - name: single_assertion_principle
      description: "每个测试只验证一个行为"
      severity: warning
      check: assertion_count <= 3

    - name: no_logic_in_tests
      description: "测试中不应有复杂逻辑"
      severity: error
      check: no_conditionals AND no_loops_except_table_driven

    - name: meaningful_names
      description: "测试名称应清晰描述场景"
      severity: warning
      check: name_describes_scenario

    - name: independent_tests
      description: "测试应相互独立"
      severity: error
      check: no_shared_mutable_state

    - name: deterministic
      description: "测试结果应确定性"
      severity: error
      check: no_random_without_seed AND no_time_dependent

  test_performance:
    - name: fast_unit_tests
      description: "单元测试应快速执行"
      threshold: 100ms
      severity: warning

    - name: reasonable_integration_tests
      description: "集成测试应在合理时间内完成"
      threshold: 5s
      severity: warning

  test_maintainability:
    - name: low_duplication
      description: "测试代码重复度低"
      threshold: 10%
      severity: warning

    - name: proper_setup_teardown
      description: "正确使用 setup/teardown"
      severity: info
```

---

## 7. 版本管理

### 7.1 版本号规范

```yaml
versioning:
  format: "MAJOR.MINOR.PATCH"

  major_change:
    - 不兼容的模板格式变更
    - 断言行为变更
    - 移除模式或模板

  minor_change:
    - 新增模式或模板
    - 新增断言类型
    - 新增语言支持

  patch_change:
    - 修复模板错误
    - 改进示例
    - 文档更新
```

### 7.2 变更日志

```markdown
# CHANGELOG.md

## [2.0.0] - 2025-12-07

### Breaking Changes
- 重构模板 schema，新增 `applicable_to` 字段
- 断言参数格式变更

### Added
- 新增 C++ 语言支持
- 新增安全测试模式库
- 新增 E2E 测试模板

### Changed
- 改进覆盖率规则配置
- 优化 mock 模式示例

### Fixed
- 修复 Java 断言映射错误
- 修复边界案例生成逻辑

## [1.1.0] - 2025-11-01

### Added
- 新增 TypeScript 支持
- 新增分页测试模板

...
```

---

## 8. 扩展指南

### 8.1 添加新模式

```yaml
# 1. 创建模式文件
# patterns/{category}/{pattern-name}.yaml

# 2. 遵循 schema 定义
pattern:
  id: "{category}-{type}-{number}"
  name: "Pattern Name"
  category: unit|integration|e2e|security
  # ... 完整定义

# 3. 添加多语言示例
examples:
  - language: golang
    code: "..."
  - language: java
    code: "..."

# 4. 更新索引
# patterns/_index.yaml
patterns:
  - id: new-pattern-001
    file: patterns/{category}/{pattern-name}.yaml
```

### 8.2 添加新模板

```yaml
# 1. 确定模板分类
# templates/common/  - 通用模板
# templates/domain/  - 领域特定模板
# templates/infrastructure/ - 基础设施模板

# 2. 创建模板文件
# 遵循完整的 template schema

# 3. 定义测试场景
# 每个模板应包含:
# - happy_path 场景
# - error_handling 场景
# - edge_case 场景
# - 可选: security, performance 场景

# 4. 设置覆盖率目标
coverage_targets:
  line_coverage: 90
  branch_coverage: 85
```

### 8.3 添加新语言支持

```yaml
# 1. 添加语言映射配置
# rules/language-mappings.yaml
languages:
  new_language:
    test_framework: "framework_name"
    mock_framework: "mock_framework"
    assertion_style: "assertion_style"
    file_pattern: "*_test.ext"

# 2. 为每个断言添加语言映射
# assertions/**/*.yaml
language_mappings:
  new_language:
    framework: 'assertion code template'

# 3. 添加示例
# patterns/**/*.yaml
examples:
  - language: new_language
    framework: framework_name
    code: |
      # 示例代码
```

---

## 9. 附录

### 9.1 常用标签

| 标签 | 描述 |
|------|------|
| `smoke` | 冒烟测试 |
| `critical` | 关键路径 |
| `security` | 安全相关 |
| `performance` | 性能相关 |
| `edge_case` | 边界情况 |
| `error_handling` | 错误处理 |
| `validation` | 验证相关 |
| `concurrency` | 并发相关 |
| `integration` | 集成测试 |
| `e2e` | 端到端测试 |

### 9.2 参考资料

- [Google Testing Blog](https://testing.googleblog.com/)
- [Martin Fowler - Testing](https://martinfowler.com/testing/)
- [Test Driven Development](https://www.amazon.com/Test-Driven-Development-Kent-Beck/dp/0321146530)
- [xUnit Test Patterns](http://xunitpatterns.com/)
