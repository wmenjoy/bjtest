# 多分支与循环功能实施计划

**文档版本**: v1.0
**创建日期**: 2025-11-22
**目标**: 为测试平台添加条件分支和循环执行能力

---

## 一、项目目标

### 1.1 核心功能
1. **条件分支执行**: 支持TestStep和WorkflowNode的条件执行
2. **循环执行**: 支持forEach和while循环
3. **表达式引擎**: 实现变量引用和表达式求值
4. **混合执行引擎**: 支持DAG和树形结构的混合执行

### 1.2 成功标准
- [ ] 所有单元测试通过（覆盖率 > 80%）
- [ ] 集成测试通过（10+ 测试场景）
- [ ] 性能测试达标（1000次循环 < 10s）
- [ ] 向后兼容现有功能

---

## 二、详细测试案例

### 2.1 条件分支测试案例

#### TC-COND-001: 基础IF条件执行
**场景**: TestStep根据变量值决定是否执行
**前置条件**:
- 工作流包含变量 `userType = "admin"`
- TestStep设置 `condition = "{{userType}} === 'admin'"`

**执行步骤**:
1. 创建workflow，设置变量 `userType = "admin"`
2. 添加Step 1: 无条件执行，返回数据
3. 添加Step 2: condition = `{{userType}} === "admin"`
4. 添加Step 3: condition = `{{userType}} === "guest"`
5. 执行workflow

**预期结果**:
- Step 1: 执行 ✓
- Step 2: 执行 ✓（条件满足）
- Step 3: 跳过 ✗（条件不满足）

---

#### TC-COND-002: 多路分支（类Switch）
**场景**: 根据支付方式执行不同节点
**前置条件**:
- 变量 `paymentMethod = "credit_card"`
- 有4个节点分别处理不同支付方式

**执行步骤**:
1. Node 1: 获取订单，输出 `paymentMethod`
2. Node 2: condition = `{{paymentMethod}} === "credit_card"`
3. Node 3: condition = `{{paymentMethod}} === "paypal"`
4. Node 4: condition = `{{paymentMethod}} === "bank_transfer"`
5. Node 5: 无条件（汇总节点）

**预期结果**:
- Node 1: 执行 ✓
- Node 2: 执行 ✓（信用卡分支）
- Node 3: 跳过 ✗
- Node 4: 跳过 ✗
- Node 5: 执行 ✓

---

#### TC-COND-003: 嵌套条件
**场景**: 订单金额 + 用户等级的组合判断
**前置条件**:
- 变量 `orderAmount = 15000`, `userLevel = "vip"`

**执行步骤**:
1. Step 1: condition = `{{orderAmount}} > 10000`
2. Step 2: condition = `{{orderAmount}} > 10000 && {{userLevel}} === "vip"`
3. Step 3: condition = `{{orderAmount}} > 10000 && {{userLevel}} !== "vip"`
4. Step 4: condition = `{{orderAmount}} <= 10000`

**预期结果**:
- Step 1: 执行 ✓
- Step 2: 执行 ✓（高金额+VIP）
- Step 3: 跳过 ✗
- Step 4: 跳过 ✗

---

#### TC-COND-004: 引用节点输出的条件
**场景**: 根据上一个节点的输出决定执行
**前置条件**:
- Node 1 返回 `{status: 200, data: {...}}`

**执行步骤**:
1. Node 1: HTTP请求，返回status
2. Node 2: condition = `{{nodes.node1.output.status}} === 200`
3. Node 3: condition = `{{nodes.node1.output.status}} !== 200`

**预期结果**:
- Node 1: 执行 ✓
- Node 2: 执行 ✓（status=200）
- Node 3: 跳过 ✗

---

### 2.2 循环测试案例

#### TC-LOOP-001: ForEach基础循环
**场景**: 遍历数组执行操作
**前置条件**:
- 变量 `productIds = ["P001", "P002", "P003"]`

**执行步骤**:
1. Step 1: 设置变量 `productIds`
2. Step 2: loopOver = `{{productIds}}`, loopVar = `currentId`
   - 执行HTTP GET `/api/products/{{currentId}}`
3. Step 3: 汇总结果

**预期结果**:
- Step 2 执行3次
- 每次使用不同的 `currentId` (P001, P002, P003)
- 返回3个产品数据

---

#### TC-LOOP-002: 嵌套循环
**场景**: 二维循环（用户 x 权限）
**前置条件**:
- 变量 `users = [{id: "u1"}, {id: "u2"}]`
- 变量 `permissions = ["read", "write"]`

**执行步骤**:
1. 外层循环: loopOver = `{{users}}`, loopVar = `user`
2. 内层循环: loopOver = `{{permissions}}`, loopVar = `perm`
   - 执行权限检查 `user.id` + `perm`

**预期结果**:
- 总共执行 2 x 2 = 4 次
- 组合: (u1,read), (u1,write), (u2,read), (u2,write)

---

#### TC-LOOP-003: While循环
**场景**: 分页获取数据
**前置条件**:
- 变量 `hasMore = true`, `page = 1`

**执行步骤**:
1. Step 1: loopCondition = `{{hasMore}} && {{page}} <= 10`
   - 执行 GET `/api/items?page={{page}}`
   - 更新 `hasMore` 和 `page`

**预期结果**:
- 循环直到 `hasMore = false` 或 `page > 10`
- 每次循环 `page` 增加1
- 收集所有分页数据

---

#### TC-LOOP-004: 循环中的条件跳过
**场景**: 数据驱动测试，跳过特定数据
**前置条件**:
- 测试数据数组，部分数据标记为跳过

**执行步骤**:
1. 循环遍历测试数据
2. 内部条件判断是否跳过
3. 执行测试并记录结果

**预期结果**:
- 标记跳过的数据不执行
- 其他数据正常执行
- 记录跳过原因

---

#### TC-LOOP-005: 循环并行执行
**场景**: 并发测试多个API
**前置条件**:
- 变量 `endpoints = ["/api/users", "/api/products", "/api/orders"]`
- 循环配置 `parallel = true`, `maxConcurrency = 3`

**执行步骤**:
1. 循环遍历 `endpoints`
2. 并行执行HTTP请求

**预期结果**:
- 3个请求并行发起
- 总执行时间 ≈ 单个请求时间（而非3倍）
- 所有结果正确收集

---

### 2.3 表达式引擎测试案例

#### TC-EXPR-001: 变量引用
**测试内容**:
```
表达式: "{{baseUrl}}/api/users"
变量: baseUrl = "https://api.example.com"
预期: "https://api.example.com/api/users"
```

---

#### TC-EXPR-002: 节点输出引用
**测试内容**:
```
表达式: "{{nodes.step1.output.userId}}"
节点输出: {userId: "123", name: "Alice"}
预期: "123"
```

---

#### TC-EXPR-003: 嵌套字段访问
**测试内容**:
```
表达式: "{{nodes.api.output.user.profile.email}}"
节点输出: {user: {profile: {email: "alice@example.com"}}}
预期: "alice@example.com"
```

---

#### TC-EXPR-004: 数组访问
**测试内容**:
```
表达式: "{{users[0].name}}"
变量: users = [{name: "Alice"}, {name: "Bob"}]
预期: "Alice"
```

---

#### TC-EXPR-005: 算术表达式
**测试内容**:
```
表达式: "{{price * 1.1}}"
变量: price = 100
预期: 110
```

---

#### TC-EXPR-006: 内置函数
**测试内容**:
```
表达式: "{{$now()}}"
预期: ISO 8601时间字符串

表达式: "{{$uuid()}}"
预期: UUID格式字符串
```

---

### 2.4 混合执行引擎测试案例

#### TC-EXEC-001: DAG并行执行
**场景**: 无依赖节点并行执行
**结构**:
```
    A
   / \
  B   C
   \ /
    D
```

**预期执行顺序**:
- Layer 1: A
- Layer 2: B, C (并行)
- Layer 3: D

---

#### TC-EXEC-002: 树形递归执行
**场景**: IF-ELSE分支
**结构**:
```
A (condition)
├─ B (then)
│  └─ D
└─ C (else)
   └─ E
```

**预期执行顺序**:
- A 执行
- 根据条件执行 B 或 C
- 执行对应子节点

---

#### TC-EXEC-003: 混合模式
**场景**: DAG + 树形结构
**结构**:
```
A → B (dependsOn: [A])
    ├─ C (children)
    └─ D (elseChildren)
```

**预期执行顺序**:
- A 执行
- B 执行（等待A完成）
- 根据B的结果执行 C 或 D

---

### 2.5 性能测试案例

#### TC-PERF-001: 循环性能
**测试内容**:
- 循环1000次简单操作
- 预期时间: < 10秒
- 内存增长: < 100MB

---

#### TC-PERF-002: 并行执行性能
**测试内容**:
- 100个节点并行执行
- 预期时间: 接近单节点执行时间
- CPU利用率: > 70%

---

#### TC-PERF-003: 表达式解析性能
**测试内容**:
- 解析10000个表达式
- 预期时间: < 1秒
- 无内存泄漏

---

## 三、任务拆分

### Phase 1: 数据模型扩展（1周）

#### Task 1.1: 扩展Workflow数据模型
**文件**: `internal/models/workflow.go`
**改动**:
```go
type WorkflowNode struct {
    // 现有字段...

    // 新增: 条件执行
    When *string `gorm:"type:text;column:when" json:"when,omitempty"`

    // 新增: 循环配置
    LoopOver *string `gorm:"type:text;column:loop_over" json:"loopOver,omitempty"`
    LoopVar *string `gorm:"type:varchar(100);column:loop_var" json:"loopVar,omitempty"`
    LoopCondition *string `gorm:"type:text;column:loop_condition" json:"loopCondition,omitempty"`
    MaxIterations *int `gorm:"column:max_iterations" json:"maxIterations,omitempty"`

    // 新增: 树形结构
    Children []string `gorm:"type:text;column:children;serializer:json" json:"children,omitempty"`
    ElseChildren []string `gorm:"type:text;column:else_children;serializer:json" json:"elseChildren,omitempty"`
}
```

**测试**: 单元测试验证JSON序列化/反序列化

---

#### Task 1.2: 扩展TestCase数据模型
**文件**: `internal/models/test_case.go`
**改动**:
```go
type TestStep struct {
    // 现有字段...

    // 新增: 条件执行
    Condition *string `json:"condition,omitempty"`

    // 新增: 循环配置
    LoopOver *string `json:"loopOver,omitempty"`
    LoopVar *string `json:"loopVar,omitempty"`
}
```

---

#### Task 1.3: 数据库迁移脚本
**文件**: `migrations/005_add_condition_loop.sql`
**内容**:
```sql
-- 添加条件和循环字段到workflow_nodes表
ALTER TABLE workflow_definitions ADD COLUMN nodes_json TEXT;

-- 为了向后兼容，现有数据保持不变
```

---

### Phase 2: 表达式引擎实现（1周）

#### Task 2.1: 表达式解析器
**新文件**: `internal/expression/evaluator.go`
**功能**:
- 解析 `{{variable}}` 语法
- 支持嵌套字段访问
- 支持数组索引
- 支持算术运算

**测试**: TC-EXPR-001 到 TC-EXPR-006

---

#### Task 2.2: 内置函数库
**新文件**: `internal/expression/functions.go`
**功能**:
- `$now()`: 当前时间
- `$uuid()`: 生成UUID
- `$base64()`: Base64编码
- `$json()`: JSON解析

---

#### Task 2.3: 执行上下文
**新文件**: `internal/workflow/context.go`
**功能**:
```go
type ExecutionContext struct {
    RunID         string
    Variables     map[string]interface{}
    NodeOutputs   map[string]*NodeOutput
    CurrentNode   *WorkflowNode
    Evaluator     *expression.Evaluator
}
```

---

### Phase 3: 条件执行实现（3天）

#### Task 3.1: 条件求值器
**文件**: `internal/workflow/condition.go`
**功能**:
```go
func EvaluateCondition(condition string, ctx *ExecutionContext) (bool, error) {
    // 解析条件表达式
    // 求值并返回布尔结果
}
```

**测试**: TC-COND-001 到 TC-COND-004

---

#### Task 3.2: 执行器集成
**文件**: `internal/workflow/executor.go`
**改动**:
```go
func (e *Executor) executeNode(node *WorkflowNode, ctx *ExecutionContext) error {
    // 检查条件
    if node.When != nil {
        shouldExecute, err := EvaluateCondition(*node.When, ctx)
        if err != nil {
            return err
        }
        if !shouldExecute {
            ctx.Logger.Info("Node skipped due to condition", "nodeId", node.ID)
            return nil
        }
    }

    // 执行节点...
}
```

---

### Phase 4: 循环执行实现（3天）

#### Task 4.1: ForEach循环
**文件**: `internal/workflow/loop.go`
**功能**:
```go
func (e *Executor) executeLoop(node *WorkflowNode, ctx *ExecutionContext) error {
    if node.LoopOver == nil {
        return e.executeNode(node, ctx)
    }

    // 解析循环集合
    collection := ctx.Evaluator.Evaluate(*node.LoopOver)

    // 遍历执行
    for i, item := range collection {
        ctx.Variables[*node.LoopVar] = item
        ctx.Variables["$loopIndex"] = i

        err := e.executeNode(node, ctx)
        if err != nil {
            return err
        }
    }

    return nil
}
```

**测试**: TC-LOOP-001, TC-LOOP-002

---

#### Task 4.2: While循环
**功能**:
```go
func (e *Executor) executeWhileLoop(node *WorkflowNode, ctx *ExecutionContext) error {
    iteration := 0
    maxIter := 100
    if node.MaxIterations != nil {
        maxIter = *node.MaxIterations
    }

    for iteration < maxIter {
        shouldContinue, err := EvaluateCondition(*node.LoopCondition, ctx)
        if err != nil || !shouldContinue {
            break
        }

        err = e.executeNode(node, ctx)
        if err != nil {
            return err
        }

        iteration++
    }

    return nil
}
```

**测试**: TC-LOOP-003

---

#### Task 4.3: 并行循环
**功能**:
```go
func (e *Executor) executeParallelLoop(node *WorkflowNode, ctx *ExecutionContext) error {
    collection := ctx.Evaluator.Evaluate(*node.LoopOver)

    var wg sync.WaitGroup
    errChan := make(chan error, len(collection))

    for i, item := range collection {
        wg.Add(1)
        go func(index int, item interface{}) {
            defer wg.Done()

            // 创建独立上下文
            loopCtx := ctx.Clone()
            loopCtx.Variables[*node.LoopVar] = item
            loopCtx.Variables["$loopIndex"] = index

            err := e.executeNode(node, loopCtx)
            if err != nil {
                errChan <- err
            }
        }(i, item)
    }

    wg.Wait()
    close(errChan)

    // 检查错误
    for err := range errChan {
        if err != nil {
            return err
        }
    }

    return nil
}
```

**测试**: TC-LOOP-005

---

### Phase 5: 混合执行引擎（5天）

#### Task 5.1: DAG分层算法
**文件**: `internal/workflow/dag.go`
**功能**:
```go
func TopologicalSort(nodes map[string]*WorkflowNode) [][]string {
    // Kahn算法实现
    // 返回分层的节点ID
}
```

**测试**: TC-EXEC-001

---

#### Task 5.2: 树形递归执行
**文件**: `internal/workflow/tree.go`
**功能**:
```go
func (e *Executor) executeTree(node *WorkflowNode, ctx *ExecutionContext) error {
    // 执行当前节点
    err := e.executeNode(node, ctx)
    if err != nil {
        return err
    }

    // 根据结果选择分支
    if node.Children != nil {
        condition := true // 或根据节点结果
        if condition {
            for _, childId := range node.Children {
                child := e.workflow.Nodes[childId]
                err = e.executeTree(child, ctx)
                if err != nil {
                    return err
                }
            }
        }
    }

    if node.ElseChildren != nil && !condition {
        for _, childId := range node.ElseChildren {
            child := e.workflow.Nodes[childId]
            err = e.executeTree(child, ctx)
            if err != nil {
                return err
            }
        }
    }

    return nil
}
```

**测试**: TC-EXEC-002

---

#### Task 5.3: 混合执行引擎
**文件**: `internal/workflow/hybrid_executor.go`
**功能**:
```go
type HybridExecutor struct {
    workflow *Workflow
}

func (e *HybridExecutor) Execute(ctx *ExecutionContext) error {
    // 分析工作流结构
    hasDAG := e.hasDAGDependencies()
    hasTree := e.hasTreeStructure()

    if hasDAG && !hasTree {
        return e.executeDAG(ctx)
    } else if !hasDAG && hasTree {
        return e.executeTree(ctx)
    } else {
        return e.executeHybrid(ctx)
    }
}
```

**测试**: TC-EXEC-003

---

### Phase 6: 测试与优化（3天）

#### Task 6.1: 单元测试
**文件**: `internal/workflow/*_test.go`
**覆盖率目标**: > 80%

---

#### Task 6.2: 集成测试
**文件**: `internal/integration/*_test.go`
**测试用例**: TC-COND-*, TC-LOOP-*, TC-EXEC-*

---

#### Task 6.3: 性能测试
**文件**: `internal/benchmark/*_test.go`
**测试用例**: TC-PERF-*

---

#### Task 6.4: 文档更新
**文件**:
- `docs/CONDITION_LOOP_GUIDE.md`
- API文档更新
- 示例代码

---

## 四、实施时间表

```
Week 1: Phase 1 + Phase 2
├─ Day 1-2: 数据模型扩展
├─ Day 3-4: 表达式引擎
└─ Day 5: 单元测试

Week 2: Phase 3 + Phase 4
├─ Day 1-2: 条件执行
├─ Day 3-4: 循环执行
└─ Day 5: 集成测试

Week 3: Phase 5 + Phase 6
├─ Day 1-3: 混合执行引擎
├─ Day 4: 性能测试
└─ Day 5: 文档和Code Review
```

---

## 五、风险与缓解

### 5.1 技术风险
**风险**: 表达式解析性能不达标
**缓解**: 实现表达式缓存和编译优化

**风险**: 循环导致内存泄漏
**缓解**: 实现循环上下文隔离和及时GC

### 5.2 兼容性风险
**风险**: 新字段影响现有功能
**缓解**:
- 所有新字段为可选（Optional）
- 充分的回归测试
- 灰度发布策略

---

## 六、验收标准

### 6.1 功能验收
- [ ] 所有测试用例通过（40+ cases）
- [ ] 条件分支正确执行
- [ ] 循环正确执行（forEach/while/parallel）
- [ ] 表达式正确解析和求值
- [ ] 混合执行引擎正确工作

### 6.2 性能验收
- [ ] 1000次循环 < 10秒
- [ ] 100节点并行执行正常
- [ ] 内存占用 < 500MB（1000次循环）

### 6.3 质量验收
- [ ] 单元测试覆盖率 > 80%
- [ ] 集成测试覆盖所有核心场景
- [ ] 代码Review通过
- [ ] 文档完整

---

## 七、后续优化

### 7.1 短期优化（1-2周）
- 表达式编译缓存
- 循环结果聚合函数
- 错误处理增强

### 7.2 中期优化（1-2月）
- 可视化编辑器UI
- 调试断点功能
- 性能监控面板

### 7.3 长期优化（3-6月）
- AI辅助生成条件和循环
- 分布式并行执行
- 更多内置函数和运算符
