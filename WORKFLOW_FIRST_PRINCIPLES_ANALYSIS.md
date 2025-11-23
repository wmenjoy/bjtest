# 自动化测试工作流引擎：第一性原理分析与最佳实践设计

**文档版本**: v1.0
**创建日期**: 2025-11-22
**研究方法**: 第一性原理推导 + 主流系统分析 + 多角色视角
**参考系统**: n8n, Warm-Flow, Airflow, Playwright, Cypress

---

## 📖 目录

1. [第一部分: 第一性原理分析](#第一部分-第一性原理分析)
2. [第二部分: 主流系统深度解构](#第二部分-主流系统深度解构)
3. [第三部分: 测试Case与工作流的本质关系](#第三部分-测试case与工作流的本质关系)
4. [第四部分: 多角色视角需求分析](#第四部分-多角色视角需求分析)
5. [第五部分: 数据流转与类型系统设计](#第五部分-数据流转与类型系统设计)
6. [第六部分: 测试案例复用与组合策略](#第六部分-测试案例复用与组合策略)
7. [第七部分: 最终架构设计方案](#第七部分-最终架构设计方案)
8. [第八部分: 实施路线图与验证策略](#第八部分-实施路线图与验证策略)

---

## 第一部分: 第一性原理分析

### 1.1 什么是"测试"？（本质定义）

从第一性原理出发，测试的本质是：

```
测试 = 输入(Input) → 执行(Execution) → 验证(Validation) → 输出(Output)
```

**核心要素分解**：

1. **输入 (Input)**
   - 测试数据 (Test Data)
   - 环境状态 (Environment State)
   - 系统配置 (System Configuration)
   - 前置条件 (Preconditions)

2. **执行 (Execution)**
   - 操作序列 (Action Sequence)
   - 状态转换 (State Transition)
   - 时间约束 (Time Constraints)
   - 并发控制 (Concurrency Control)

3. **验证 (Validation)**
   - 断言 (Assertions)
   - 预期结果 (Expected Results)
   - 不变量检查 (Invariant Checks)
   - 性能指标 (Performance Metrics)

4. **输出 (Output)**
   - 测试结果 (Pass/Fail/Skip)
   - 执行日志 (Execution Logs)
   - 副产品 (Artifacts: 截图、录像、报告)
   - 度量数据 (Metrics)

### 1.2 什么是"工作流"？（本质定义）

工作流的本质是：

```
工作流 = 有向图(Graph) + 数据流(DataFlow) + 控制流(ControlFlow) + 副作用(SideEffects)
```

**核心要素分解**：

1. **有向图 (Directed Graph)**
   - 节点 (Nodes) - 执行单元
   - 边 (Edges) - 依赖关系
   - 拓扑结构 (Topology) - DAG或树
   - 执行顺序 (Execution Order)

2. **数据流 (Data Flow)**
   - 输入变量 (Input Variables)
   - 中间结果 (Intermediate Results)
   - 输出映射 (Output Mapping)
   - 类型约束 (Type Constraints)

3. **控制流 (Control Flow)**
   - 顺序执行 (Sequential)
   - 条件分支 (Conditional)
   - 循环迭代 (Loop)
   - 并行执行 (Parallel)
   - 错误处理 (Error Handling)

4. **副作用 (Side Effects)**
   - 状态修改 (State Mutation)
   - 外部调用 (External Calls)
   - 资源管理 (Resource Management)
   - 事务控制 (Transaction Control)

### 1.3 测试与工作流的关系（本质推导）

通过第一性原理推导，我们发现：

```
测试 ⊂ 工作流
```

**推导过程**：

1. **测试是一种特殊的工作流**
   - 测试有明确的输入→执行→验证流程 ✓
   - 测试步骤之间有依赖关系（有向图）✓
   - 测试步骤间需要传递数据（数据流）✓
   - 测试需要控制流（条件、循环）✓

2. **但测试有特殊约束**
   - **幂等性要求**: 测试应该是可重复的
   - **隔离性要求**: 测试之间应该独立
   - **可观测性要求**: 测试必须产生可验证的结果
   - **确定性要求**: 相同输入应产生相同结果

3. **因此，测试工作流 = 通用工作流 + 测试特定约束**

```typescript
interface TestWorkflow extends Workflow {
  // 继承通用工作流能力
  nodes: Node[];
  dataFlow: DataFlow;
  controlFlow: ControlFlow;

  // 测试特定约束
  assertions: Assertion[];          // 必须有验证点
  repeatability: 'idempotent';      // 幂等性
  isolation: 'independent';         // 隔离性
  observability: 'measurable';      // 可观测性
}
```

### 1.4 核心矛盾与设计权衡

**矛盾1: 灵活性 vs 易用性**
- 通用工作流引擎：灵活但学习成本高
- 专用测试框架：易用但扩展性差
- **解决方案**: 分层抽象 + 渐进式复杂度

**矛盾2: 复用性 vs 可读性**
- 高度复用：逻辑嵌套，难以理解
- 平铺直叙：重复代码，维护困难
- **解决方案**: 组件化 + 可视化

**矛盾3: 并行 vs 依赖**
- 并行执行：性能最优
- 严格依赖：逻辑清晰
- **解决方案**: DAG自动分层

**矛盾4: 强类型 vs 动态性**
- 强类型：安全但死板
- 动态类型：灵活但易错
- **解决方案**: 渐进式类型 + 运行时校验

---

## 第二部分: 主流系统深度解构

### 2.1 n8n - 可视化工作流自动化平台

#### 核心设计哲学
**"低代码 + 事件驱动 + 节点组合"**

#### 架构特点分析

**1. 节点系统 (Node System)**

```typescript
// n8n的节点分类
interface N8nNodeTypes {
  // 触发器类 - 启动工作流
  Trigger: [
    'Webhook',      // HTTP触发
    'Schedule',     // 定时触发
    'Manual',       // 手动触发
    'Email',        // 邮件触发
  ];

  // 动作类 - 执行操作
  Action: [
    'HTTP Request', // API调用
    'Database',     // 数据库操作
    'SendEmail',    // 发送邮件
    'Transform',    // 数据转换
  ];

  // 逻辑类 - 控制流
  Logic: [
    'IF',           // 条件分支
    'Switch',       // 多路分支
    'Split',        // 数据分割
    'Merge',        // 数据合并
  ];

  // 子节点 - 能力扩展
  SubNode: [
    'AI Tool',      // AI能力
    'AI Memory',    // 记忆存储
    'AI Model',     // 模型选择
  ];
}
```

**2. 数据流设计**

```typescript
// n8n的数据结构
interface N8nDataFlow {
  // 所有节点间传递的数据都是对象数组
  data: Array<{
    json: Record<string, any>;    // 主要数据
    binary?: Record<string, {     // 二进制数据（文件）
      data: Buffer;
      mimeType: string;
      fileName: string;
    }>;
    pairedItem?: {                // 数据溯源
      item: number;
      input: number;
    };
  }>;

  // 执行上下文
  context: {
    node: NodeContext;
    workflow: WorkflowContext;
  };
}
```

**3. 表达式系统**

```javascript
// n8n支持的变量引用语法
const expressions = {
  // 引用上一个节点的输出
  previousNode: '{{ $json.fieldName }}',

  // 引用特定节点的输出
  specificNode: '{{ $node["Node Name"].json.fieldName }}',

  // 执行JavaScript表达式
  jsExpression: '{{ $json.price * 1.1 }}',

  // 内置函数
  builtinFunctions: '{{ $now.format("YYYY-MM-DD") }}',
};
```

**4. 错误处理机制**

```typescript
interface N8nErrorHandling {
  // 节点级错误处理
  continueOnFail: boolean;        // 失败后是否继续
  retryOnFail: boolean;           // 是否重试
  maxTries: number;               // 最大重试次数
  waitBetweenTries: number;       // 重试间隔(ms)

  // 工作流级错误处理
  errorWorkflow: string;          // 错误工作流ID
  errorOutputs: ErrorOutput[];    // 错误输出
}
```

#### 对测试场景的启示

✅ **优点**:
1. **可视化编排** - 非技术人员也能创建复杂流程
2. **400+ 集成** - 覆盖大量第三方服务
3. **表达式语法** - 灵活的数据引用和转换
4. **子节点机制** - AI能力无缝集成

❌ **局限**:
1. **缺乏测试特定抽象** - 没有断言、Mock等测试概念
2. **数据溯源不够精细** - pairedItem机制较简单
3. **版本控制困难** - JSON格式不友好于Git Diff
4. **调试能力弱** - 难以断点调试复杂逻辑

---

### 2.2 Warm-Flow - 轻量级国产工作流引擎

#### 核心设计哲学
**"7张表 + 双模式设计 + 多ORM支持"**

#### 架构特点分析

**1. 数据库设计极简主义**

```sql
-- Warm-Flow的7张核心表
CREATE TABLE flow_definition (      -- 流程定义
    id BIGINT PRIMARY KEY,
    flow_code VARCHAR(50),
    flow_name VARCHAR(100),
    version INT,
    flow_xml TEXT                   -- 流程XML定义
);

CREATE TABLE flow_node (             -- 流程节点
    id BIGINT PRIMARY KEY,
    flow_id BIGINT,
    node_code VARCHAR(50),
    node_name VARCHAR(100),
    node_type VARCHAR(20),          -- start/task/gateway/end
    node_ratio DECIMAL(5,2),        -- 节点坐标比例(用于渲染)
    coordinate VARCHAR(100)         -- 坐标信息
);

CREATE TABLE flow_skip (             -- 节点跳转关系
    id BIGINT PRIMARY KEY,
    flow_id BIGINT,
    now_node_code VARCHAR(50),      -- 当前节点
    next_node_code VARCHAR(50),     -- 下一节点
    skip_name VARCHAR(100),
    skip_type VARCHAR(20),          -- 跳转类型
    skip_condition TEXT             -- 跳转条件(SpEL表达式)
);

CREATE TABLE flow_instance (         -- 流程实例
    id BIGINT PRIMARY KEY,
    flow_id BIGINT,
    business_id VARCHAR(100),       -- 关联业务ID
    flow_status INT,                -- 流程状态
    create_time DATETIME,
    ext_data TEXT                   -- 扩展数据(JSON)
);

CREATE TABLE flow_task (             -- 任务实例
    id BIGINT PRIMARY KEY,
    instance_id BIGINT,
    node_code VARCHAR(50),
    node_name VARCHAR(100),
    task_status INT,                -- 任务状态
    assignee VARCHAR(50),           -- 处理人
    approval_opinion TEXT,          -- 审批意见
    create_time DATETIME
);

CREATE TABLE flow_his_task (         -- 历史任务
    -- 与flow_task结构相同，用于归档
);

CREATE TABLE flow_user (             -- 用户表(可选)
    id BIGINT PRIMARY KEY,
    username VARCHAR(50),
    dept_id BIGINT
);
```

**对比Activiti (25+表) 和 Flowable (40+表)**:
- **极简哲学**: 只保留核心功能，砍掉边缘特性
- **扩展字段**: ext_data (JSON) 允许业务自定义扩展
- **坐标存储**: 直接在节点表存储UI坐标，前后端统一

**2. 双模式设计器**

```typescript
// 模式1: 经典流程图模式
interface ClassicMode {
  layout: 'flowchart';              // 流程图布局
  nodeShape: 'rectangle' | 'diamond' | 'circle';
  connector: 'polyline' | 'bezier';
  snapToGrid: boolean;
}

// 模式2: 钉钉审批模式
interface DingTalkMode {
  layout: 'vertical-tree';          // 垂直树布局
  nodeStyle: 'card';                // 卡片风格
  connector: 'straight-line';       // 直线连接
  mobileOptimized: true;            // 移动端优化
}
```

**3. SpEL表达式系统**

```java
// Warm-Flow的条件表达式示例
public interface SkipConditionExamples {
    // 简单条件
    String SIMPLE = "${amount > 1000}";

    // 复杂逻辑
    String COMPLEX = "${amount > 1000 && dept == 'finance'}";

    // 动态处理人
    String DYNAMIC_ASSIGNEE = "${handler}"; // 运行时解析

    // 调用Bean方法
    String BEAN_METHOD = "@userService.isManager(#userId)";

    // 访问流程变量
    String PROCESS_VAR = "${processVariables['approvalLevel']}";
}
```

**4. 监听器机制**

```java
// 四种监听器
public enum ListenerType {
    GLOBAL_START,      // 流程开始前
    GLOBAL_END,        // 流程结束后
    NODE_START,        // 节点开始前
    NODE_END           // 节点结束后
}

// 监听器接口
public interface FlowListener {
    void execute(ExecutionContext context);
}

// 使用示例
@Component
public class TestDataSetupListener implements FlowListener {
    @Override
    public void execute(ExecutionContext context) {
        // 在测试流程开始前初始化测试数据
        String businessId = context.getBusinessId();
        testDataService.setupTestData(businessId);

        // 设置流程变量
        context.setVariable("testEnv", "staging");
    }
}
```

#### 对测试场景的启示

✅ **优点**:
1. **数据库极简** - 7张表易于理解和维护
2. **多ORM支持** - MyBatis/JPA/EasyQuery全兼容
3. **监听器机制** - 非常适合测试前置/后置逻辑
4. **流程变量** - 支持测试数据传递

❌ **局限**:
1. **缺乏并行能力** - 主要面向审批流，少并行
2. **节点类型少** - 无HTTP/DB等测试常用节点
3. **缺乏数据转换** - 没有内置的数据映射能力
4. **可视化能力弱** - UI渲染依赖前端，无统一标准

---

### 2.3 Apache Airflow - 数据工作流调度平台

#### 核心设计哲学
**"代码即配置 + DAG编排 + 强大的调度"**

#### 架构特点分析

**1. DAG (有向无环图) 核心**

```python
# Airflow的DAG定义
from airflow import DAG
from airflow.operators.python import PythonOperator
from datetime import datetime

with DAG(
    'test_data_pipeline',
    start_date=datetime(2025, 1, 1),
    schedule_interval='@daily',      # Cron表达式
    catchup=False,
    tags=['testing', 'e2e'],
) as dag:

    # 任务定义
    setup_db = PythonOperator(
        task_id='setup_database',
        python_callable=setup_test_db,
    )

    load_data = PythonOperator(
        task_id='load_test_data',
        python_callable=load_test_data,
    )

    run_tests = PythonOperator(
        task_id='run_integration_tests',
        python_callable=run_tests,
    )

    cleanup = PythonOperator(
        task_id='cleanup',
        python_callable=cleanup_resources,
        trigger_rule='all_done',     # 无论成败都执行
    )

    # DAG依赖关系
    setup_db >> load_data >> run_tests >> cleanup
```

**2. TaskFlow API (数据传递)**

```python
# Airflow 2.0+ 的TaskFlow API
from airflow.decorators import dag, task
from datetime import datetime

@dag(schedule_interval='@daily', start_date=datetime(2025, 1, 1))
def test_workflow():

    @task
    def extract_test_data() -> dict:
        # 提取测试数据
        return {
            'user_id': 12345,
            'test_cases': ['TC001', 'TC002'],
            'environment': 'staging'
        }

    @task
    def transform_data(data: dict) -> dict:
        # 数据转换
        transformed = {
            'userId': data['user_id'],
            'testCases': data['test_cases'],
            'env': data['environment']
        }
        return transformed

    @task
    def execute_tests(test_config: dict) -> dict:
        # 执行测试
        results = run_tests(test_config)
        return {
            'total': len(test_config['testCases']),
            'passed': results['passed'],
            'failed': results['failed']
        }

    # 数据流定义 (自动推导依赖)
    data = extract_test_data()
    config = transform_data(data)
    results = execute_tests(config)

test_workflow()
```

**3. XCom (跨任务通信)**

```python
# XCom - Cross-Communication
def task_a(ti):  # ti = task_instance
    result = perform_calculation()
    # 推送数据到XCom
    ti.xcom_push(key='calculation_result', value=result)

def task_b(ti):
    # 从XCom拉取数据
    result = ti.xcom_pull(key='calculation_result', task_ids='task_a')
    use_result(result)

# TaskFlow API自动处理XCom
@task
def task_a() -> int:
    return 42  # 自动推送到XCom

@task
def task_b(value: int):
    print(f"Received: {value}")  # 自动从XCom拉取
```

**4. 依赖管理**

```python
# 复杂的依赖关系
from airflow.utils.trigger_rule import TriggerRule

# 方式1: 位移操作符
task_a >> [task_b, task_c]  # task_a完成后，b和c并行执行
[task_b, task_c] >> task_d  # b和c都完成后，执行d

# 方式2: 设置依赖
task_a.set_downstream([task_b, task_c])
task_d.set_upstream([task_b, task_c])

# 方式3: 触发规则
task_final = PythonOperator(
    task_id='final',
    python_callable=finalize,
    trigger_rule=TriggerRule.ONE_SUCCESS,  # 任一上游成功即触发
)

# 触发规则类型
TriggerRule.ALL_SUCCESS      # 所有上游成功(默认)
TriggerRule.ALL_FAILED       # 所有上游失败
TriggerRule.ALL_DONE         # 所有上游完成(不管成败)
TriggerRule.ONE_SUCCESS      # 至少一个上游成功
TriggerRule.ONE_FAILED       # 至少一个上游失败
TriggerRule.NONE_FAILED      # 没有上游失败
```

**5. 分层执行 (Layer-based Execution)**

```python
# Airflow自动将DAG分层并行执行
"""
DAG结构:
    A
   / \
  B   C
   \ / \
    D   E
     \ /
      F

执行顺序:
Layer 1: A
Layer 2: B, C (并行)
Layer 3: D, E (并行)
Layer 4: F
"""

# 分层算法伪代码
def topological_sort(dag):
    layers = []
    visited = set()

    while len(visited) < len(dag.nodes):
        current_layer = []
        for node in dag.nodes:
            if node not in visited:
                # 检查所有上游是否已执行
                if all(dep in visited for dep in node.upstream):
                    current_layer.append(node)

        # 当前层的所有节点并行执行
        execute_parallel(current_layer)
        visited.update(current_layer)
        layers.append(current_layer)

    return layers
```

#### 对测试场景的启示

✅ **优点**:
1. **DAG天然适合测试流程** - 测试步骤本身就是DAG
2. **TaskFlow API** - 类型化的数据传递
3. **强大的调度** - 支持复杂的定时策略
4. **分层并行执行** - 自动优化执行性能
5. **Trigger Rules** - 灵活的执行条件

❌ **局限**:
1. **学习曲线陡峭** - Python代码定义，非技术人员难用
2. **重量级部署** - 需要数据库、Redis、Celery
3. **不适合实时触发** - 主要面向批处理调度
4. **缺乏可视化编排** - 需要写代码

---

### 2.4 Playwright - 现代Web自动化测试框架

#### 核心设计哲学
**"Fixture机制 + 自动等待 + 跨浏览器 + 类型安全"**

#### 架构特点分析

**1. Fixture系统 (核心创新)**

```typescript
// Fixture = Setup + Teardown + 依赖注入 + 按需加载
import { test as base } from '@playwright/test';

// 定义自定义Fixture
type MyFixtures = {
  authenticatedPage: Page;
  testDatabase: Database;
  apiClient: ApiClient;
};

const test = base.extend<MyFixtures>({
  // Fixture 1: 已认证的页面
  authenticatedPage: async ({ page }, use) => {
    // Setup: 登录
    await page.goto('/login');
    await page.fill('#username', 'test-user');
    await page.fill('#password', 'test-pass');
    await page.click('#login-button');
    await page.waitForURL('/dashboard');

    // 使用页面
    await use(page);

    // Teardown: 登出 (自动执行)
    await page.click('#logout');
  },

  // Fixture 2: 测试数据库 (依赖其他Fixture)
  testDatabase: async ({ }, use) => {
    const db = await createTestDB();
    await db.seedData();

    await use(db);

    // 清理数据库
    await db.cleanup();
  },

  // Fixture 3: API客户端 (组合Fixture)
  apiClient: async ({ authenticatedPage }, use) => {
    // 从已认证页面获取Token
    const token = await authenticatedPage.evaluate(() =>
      localStorage.getItem('authToken')
    );

    const client = new ApiClient(token);
    await use(client);
  },
});

// 使用Fixture
test('user can create order', async ({
  authenticatedPage,  // 自动Setup/Teardown
  testDatabase,       // 自动Setup/Teardown
  apiClient           // 自动Setup/Teardown
}) => {
  // 测试逻辑
  const product = await testDatabase.getProduct('PROD-001');
  await apiClient.createOrder({ productId: product.id });

  // 验证
  await expect(authenticatedPage.locator('.order-success')).toBeVisible();
});
```

**2. 自动等待机制**

```typescript
// Playwright的智能等待
test('auto-wait example', async ({ page }) => {
  // ❌ 传统方式 (Selenium风格)
  await page.goto('/products');
  await page.waitForSelector('.product-list');  // 手动等待
  await page.waitForTimeout(1000);              // 魔法数字
  const button = await page.$('.buy-button');
  if (button) {
    await button.click();
  }

  // ✅ Playwright方式 (自动等待)
  await page.goto('/products');
  // 自动等待元素可见、可点击
  await page.click('.buy-button');
  // 自动等待导航完成
  await expect(page).toHaveURL('/checkout');
  // 自动等待文本出现
  await expect(page.locator('.success-message')).toHaveText('Order created');
});
```

**3. 数据共享策略**

```typescript
// 方式1: Worker级别共享 (推荐用于昂贵的Setup)
import { test as base } from '@playwright/test';

type WorkerFixtures = {
  sharedDatabase: Database;
};

const test = base.extend<{}, WorkerFixtures>({
  // Worker Fixture: 在Worker启动时创建一次，多个测试共享
  sharedDatabase: [async ({}, use) => {
    const db = await createDatabase();  // 只创建一次
    await use(db);
    await db.close();
  }, { scope: 'worker' }],  // 关键: scope = worker
});

test('test 1', async ({ sharedDatabase }) => {
  // 使用共享数据库
});

test('test 2', async ({ sharedDatabase }) => {
  // 复用同一个数据库实例
});

// 方式2: Test级别 (默认，每个测试独立)
const test2 = base.extend<{ isolatedDB: Database }>({
  isolatedDB: async ({}, use) => {
    const db = await createDatabase();  // 每个测试创建新实例
    await use(db);
    await db.close();
  },  // 默认 scope = test
});

// 方式3: 使用Page Storage State共享认证
test.use({
  storageState: 'auth.json'  // 共享登录状态
});

test.beforeAll(async ({ browser }) => {
  const page = await browser.newPage();
  await page.goto('/login');
  await page.fill('#username', 'admin');
  await page.fill('#password', 'password');
  await page.click('#login');
  await page.context().storageState({ path: 'auth.json' });
});
```

**4. 组合测试与参数化**

```typescript
// 参数化测试
const testCases = [
  { username: 'user1', role: 'admin' },
  { username: 'user2', role: 'editor' },
  { username: 'user3', role: 'viewer' },
];

for (const { username, role } of testCases) {
  test(`user ${username} with role ${role}`, async ({ page }) => {
    await loginAs(page, username);
    await expect(page.locator('.role-badge')).toHaveText(role);
  });
}

// 测试组合
test.describe('Shopping Cart', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/cart');
  });

  test('add item', async ({ page }) => { /* ... */ });
  test('remove item', async ({ page }) => { /* ... */ });
  test('checkout', async ({ page }) => { /* ... */ });
});
```

#### 对测试场景的启示

✅ **优点**:
1. **Fixture机制** - 优雅的Setup/Teardown/依赖注入
2. **自动等待** - 消除了99%的flaky测试
3. **类型安全** - TypeScript全链路支持
4. **Worker共享** - 性能优化利器

❌ **局限**:
1. **缺乏工作流编排** - 没有可视化DAG
2. **线性执行** - 虽然支持并行测试，但单个测试内是线性的
3. **数据传递限制** - Fixture间传递数据有限制
4. **缺乏条件控制** - 没有内置的IF/LOOP节点

---

### 2.5 Cypress - 开发者友好的E2E测试框架

#### 核心设计哲学
**"命令链 + 自动重试 + 时间旅行调试 + 一体化工具"**

#### 架构特点分析

**1. 命令链 (Command Chaining)**

```javascript
// Cypress的链式调用
cy.visit('/products')
  .get('.product-list')           // 查询
  .find('.product-item')          // 进一步查询
  .first()                        // 过滤
  .click()                        // 动作
  .url()                          // 断言准备
  .should('include', '/product/') // 断言
  .get('.price')                  // 新链
  .invoke('text')                 // 调用方法
  .then(priceText => {            // 获取值
    const price = parseFloat(priceText.replace('$', ''));
    expect(price).to.be.greaterThan(0);
  });
```

**2. 自动重试机制**

```javascript
// Cypress自动重试断言
cy.get('.loading').should('not.exist');  // 自动重试直到不存在或超时

// 配置重试
cy.get('.data', { timeout: 10000 })      // 10秒超时
  .should('have.length', 5);

// 自定义重试逻辑
cy.get('.status').should(($status) => {
  const text = $status.text();
  expect(text).to.match(/success|completed/);
});
```

**3. 别名系统 (Aliases) - 数据共享**

```javascript
// 使用别名共享数据
cy.request('/api/users/1')
  .its('body')
  .as('user');  // 创建别名

cy.get('@user').then(user => {
  cy.log('User:', user.name);
  cy.get('#username').should('have.value', user.name);
});

// 别名用于元素引用
cy.get('.product-list').as('products');
cy.get('@products').find('.item').should('have.length', 10);
cy.get('@products').find('.sort-button').click();
cy.get('@products').find('.item').first().should('contain', 'Cheapest');
```

**4. 自定义命令 (Custom Commands) - 复用**

```javascript
// 定义自定义命令
Cypress.Commands.add('login', (username, password) => {
  cy.visit('/login');
  cy.get('#username').type(username);
  cy.get('#password').type(password);
  cy.get('#login-button').click();
  cy.url().should('include', '/dashboard');
});

Cypress.Commands.add('createOrder', (productId, quantity) => {
  return cy.request({
    method: 'POST',
    url: '/api/orders',
    body: { productId, quantity },
    auth: {
      bearer: Cypress.env('authToken')
    }
  }).its('body');
});

// 使用自定义命令
cy.login('testuser', 'password123');
cy.createOrder('PROD-001', 2).then(order => {
  cy.visit(`/orders/${order.id}`);
  cy.get('.order-status').should('contain', 'Pending');
});
```

**5. 任务系统 (Tasks) - 后端能力**

```javascript
// cypress.config.js
const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      // 定义任务
      on('task', {
        // 数据库操作
        'db:seed': async (data) => {
          await database.seed(data);
          return null;
        },

        // 读取文件
        'readFile': (filePath) => {
          return fs.readFileSync(filePath, 'utf8');
        },

        // 发送邮件验证
        'getLatestEmail': async (recipient) => {
          const email = await emailService.getLatest(recipient);
          return email;
        }
      });
    }
  }
});

// 测试中使用任务
cy.task('db:seed', {
  users: [{ name: 'Alice', role: 'admin' }],
  products: [{ name: 'Widget', price: 9.99 }]
});

cy.login('alice@test.com', 'password');

cy.task('getLatestEmail', 'alice@test.com').then(email => {
  expect(email.subject).to.contain('Welcome');
});
```

#### 对测试场景的启示

✅ **优点**:
1. **命令链** - 流畅的API，易于阅读
2. **自动重试** - 极大减少flaky测试
3. **别名系统** - 简单的数据共享机制
4. **自定义命令** - 强大的复用能力
5. **任务系统** - 打通前端测试与后端能力

❌ **局限**:
1. **单线程执行** - 同一浏览器无法并行
2. **异步限制** - 不能在cy链外使用async/await
3. **缺乏复杂控制流** - 没有内置的条件、循环节点
4. **数据传递复杂** - 依赖闭包和别名

---

## 第三部分: 测试Case与工作流的本质关系

### 3.1 三种关系模型对比

经过深入分析，测试Case与工作流的关系可以有三种模型：

#### 模型A: 测试Case = 工作流 (平等模型)

```typescript
// 模型A: TestCase本身就是Workflow
interface TestCaseAsWorkflow {
  id: string;
  name: string;

  // 测试定义 = 工作流定义
  workflow: {
    nodes: WorkflowNode[];
    edges: Edge[];
  };

  // 测试特定字段
  assertions: Assertion[];
  expectedResult: string;
}

// 使用场景
const testCase: TestCaseAsWorkflow = {
  id: 'TC-001',
  name: 'User Login Flow',
  workflow: {
    nodes: [
      { id: 'n1', type: 'HTTP_REQUEST', config: { url: '/api/login' } },
      { id: 'n2', type: 'ASSERTION', config: { field: 'status', value: 200 } },
      { id: 'n3', type: 'HTTP_REQUEST', config: { url: '/api/profile' } },
    ],
    edges: [
      { from: 'n1', to: 'n2' },
      { from: 'n2', to: 'n3' }
    ]
  },
  assertions: [/*...*/],
  expectedResult: 'User logged in successfully'
};
```

**评估**:
- ✅ 统一性强，概念简单
- ✅ 工作流引擎可直接执行测试
- ❌ 测试特有约束难以表达（幂等性、隔离性）
- ❌ 测试人员需要理解工作流概念

---

#### 模型B: 测试Case 引用 工作流 (引用模型)

```typescript
// 模型B: TestCase引用独立的Workflow
interface TestCaseReferencesWorkflow {
  id: string;
  name: string;
  description: string;

  // 引用工作流ID
  workflowId: string;

  // 测试特定配置
  inputData: Record<string, any>;    // 输入数据
  assertions: Assertion[];           // 断言
  timeout: number;                   // 超时
  retry: number;                     // 重试次数

  // 测试元数据
  tags: string[];
  priority: string;
}

interface Workflow {
  id: string;
  name: string;
  nodes: WorkflowNode[];
  edges: Edge[];

  // 接口定义
  inputSchema: ParameterSchema[];
  outputSchema: ParameterSchema[];
}

// 使用场景
const workflow: Workflow = {
  id: 'WF-LOGIN',
  name: 'Generic Login Workflow',
  inputSchema: [
    { name: 'username', type: 'string', required: true },
    { name: 'password', type: 'string', required: true }
  ],
  nodes: [/*...*/],
  edges: [/*...*/]
};

const testCase: TestCaseReferencesWorkflow = {
  id: 'TC-001',
  name: 'Admin Login Test',
  workflowId: 'WF-LOGIN',
  inputData: {
    username: 'admin',
    password: 'admin123'
  },
  assertions: [
    { field: 'response.user.role', operator: '==', value: 'admin' }
  ]
};
```

**评估**:
- ✅ 工作流可复用（多个测试共享）
- ✅ 测试和工作流分离，各司其职
- ✅ 工作流可独立测试和版本管理
- ❌ 两层抽象，增加复杂度
- ❌ 需要管理TestCase和Workflow的关联

---

#### 模型C: 测试Case 包含 工作流步骤 (组合模型)

```typescript
// 模型C: TestCase包含TestStep, TestStep可选绑定Workflow/Script
interface TestCaseContainsSteps {
  id: string;
  name: string;
  description: string;

  // 测试步骤
  steps: TestStep[];

  // 测试上下文
  variables: Record<string, any>;
  preconditions: string[];
}

interface TestStep {
  id: string;
  instruction: string;           // 人类可读的描述
  expectedResult: string;

  // 自动化绑定 (可选)
  automation?: {
    type: 'workflow' | 'script' | 'inline';

    // 选项1: 引用工作流
    workflowId?: string;

    // 选项2: 引用脚本
    scriptId?: string;

    // 选项3: 内联配置（HTTP/DB等）
    inlineConfig?: {
      type: 'HTTP' | 'DB' | 'SHELL';
      config: any;
    };

    // 输入输出映射
    input?: Record<string, any>;
    outputMapping?: Record<string, string>;
  };

  // 控制流
  condition?: string;            // 条件执行
  loopOver?: string;             // 循环
}

// 使用场景 - 混合自动化
const testCase: TestCaseContainsSteps = {
  id: 'TC-001',
  name: 'E2E Order Flow',
  steps: [
    {
      id: 's1',
      instruction: 'User logs in',
      expectedResult: 'Dashboard is shown',
      automation: {
        type: 'workflow',
        workflowId: 'WF-LOGIN',
        input: {
          username: '{{testUser}}',
          password: '{{testPassword}}'
        },
        outputMapping: {
          'userId': 'currentUserId',
          'authToken': 'sessionToken'
        }
      }
    },
    {
      id: 's2',
      instruction: 'User adds product to cart',
      expectedResult: 'Cart shows 1 item',
      automation: {
        type: 'script',
        scriptId: 'SCRIPT-ADD-TO-CART',
        input: {
          productId: 'PROD-001',
          userId: '{{currentUserId}}'
        }
      }
    },
    {
      id: 's3',
      instruction: 'User checks out',
      expectedResult: 'Order created successfully',
      automation: {
        type: 'inline',
        inlineConfig: {
          type: 'HTTP',
          config: {
            method: 'POST',
            url: '/api/checkout',
            headers: {
              'Authorization': 'Bearer {{sessionToken}}'
            }
          }
        }
      }
    },
    {
      id: 's4',
      instruction: 'Manually verify email sent',  // 手动步骤
      expectedResult: 'Order confirmation email received',
      // 无automation字段 - 人工验证
    }
  ]
};
```

**评估**:
- ✅ 最灵活：支持手动、自动化、混合测试
- ✅ 渐进式自动化：可以逐步给步骤添加自动化
- ✅ 可读性强：步骤描述清晰
- ✅ 易于复用：步骤可以引用Workflow或Script
- ❌ 数据结构最复杂
- ❌ 需要三层抽象：TestCase → TestStep → Workflow/Script

---

### 3.2 最佳模型选择：**模型C (组合模型)**

基于以下原因，我推荐采用**模型C**:

**1. 符合测试实际工作流**
```
测试设计阶段: 编写测试步骤 (纯文本)
              ↓
自动化阶段:   给步骤添加自动化绑定
              ↓
执行阶段:     自动执行已绑定的步骤，手动执行未绑定的
              ↓
维护阶段:     修改步骤或更换自动化实现
```

**2. 支持多种自动化策略**
```typescript
// 策略1: 步骤级自动化 (最细粒度)
step.automation = { scriptId: 'login' };

// 策略2: 用例级工作流 (整体自动化)
testCase.linkedWorkflowId = 'WF-E2E-ORDER';

// 策略3: 混合模式
testCase.steps = [
  { automation: { scriptId: 'setup' } },   // 自动
  { automation: null },                     // 手动
  { automation: { workflowId: 'checkout' } } // 自动
];
```

**3. 易于扩展**
```typescript
// 扩展1: 添加新的自动化类型
automation.type = 'browser-recording';  // 录制回放
automation.recordingId = 'REC-001';

// 扩展2: 添加数据驱动
step.dataDriven = {
  source: 'csv',
  file: 'test-data.csv',
  iterations: 10
};

// 扩展3: 添加AI辅助
step.aiAssistant = {
  generateAssertion: true,
  suggestTestData: true
};
```

---

### 3.3 配置、展示、观测的设计

基于模型C，我们设计完整的配置、展示、观测方案：

#### 3.3.1 配置界面设计

```typescript
// 配置UI组件树
TestCaseEditor
├─ BasicInfo              // 基础信息
│  ├─ Name, Description
│  ├─ Priority, Status
│  └─ Tags
├─ StepEditor             // 步骤编辑器
│  ├─ StepList
│  │  └─ StepItem
│  │     ├─ StepDescription (文本)
│  │     ├─ ExpectedResult (文本)
│  │     └─ AutomationBinding (可选)
│  │        ├─ BindingType: [workflow | script | inline | none]
│  │        ├─ InputMapping (变量映射)
│  │        └─ OutputMapping (结果映射)
│  └─ StepActions
│     ├─ AddStep
│     ├─ DeleteStep
│     ├─ ReorderSteps
│     └─ AutoBindSuggestion (AI建议自动化)
└─ VariablesEditor        // 变量编辑器
   ├─ EnvironmentVars
   ├─ TestCaseVars
   └─ DynamicVars (步骤输出)
```

**可视化编辑器**:
```typescript
// 步骤绑定UI示例
<StepItem step={step}>
  <StepDescription editable>
    User logs in with username {{testUser}}
  </StepDescription>

  <AutomationBindingSelector>
    <Radio value="none">Manual Test (No Automation)</Radio>
    <Radio value="workflow">
      Bind to Workflow
      <WorkflowSelector
        workflows={availableWorkflows}
        selected={step.automation?.workflowId}
        onChange={handleWorkflowSelect}
      />
    </Radio>
    <Radio value="script">
      Bind to Script
      <ScriptSelector
        scripts={availableScripts}
        selected={step.automation?.scriptId}
      />
    </Radio>
    <Radio value="inline">
      Quick Action
      <QuickActionBuilder
        type={step.automation?.inlineConfig?.type}
        config={step.automation?.inlineConfig?.config}
      />
    </Radio>
  </AutomationBindingSelector>

  <InputMapping>
    <VariableMap from="username" to="{{testUser}}" />
    <VariableMap from="password" to="{{testPassword}}" />
  </InputMapping>

  <OutputMapping>
    <VariableMap from="response.userId" to="currentUserId" />
    <VariableMap from="response.token" to="authToken" />
  </OutputMapping>
</StepItem>
```

#### 3.3.2 展示界面设计

**展示模式1: 列表视图 (适合测试人员)**
```
┌─────────────────────────────────────────────────────┐
│ Test Case: TC-001 - User Login Flow                │
│ Priority: P0 | Status: Active | Tags: auth, smoke  │
├─────────────────────────────────────────────────────┤
│ Variables:                                          │
│   testUser: "alice@example.com"                     │
│   testPassword: "***"                               │
├─────────────────────────────────────────────────────┤
│ Steps:                                              │
│                                                     │
│ [1] Navigate to login page                         │
│     Expected: Login form is displayed              │
│     Automation: ⚙️ Script "navigate-to-login"      │
│     Status: ✓ PASS (0.5s)                          │
│                                                     │
│ [2] Enter credentials and submit                   │
│     Expected: Dashboard is shown                   │
│     Automation: 🔄 Workflow "WF-LOGIN"             │
│     Input: username={{testUser}}                   │
│     Output: userId → currentUserId                 │
│     Status: ✓ PASS (1.2s)                          │
│                                                     │
│ [3] Verify user profile loaded                     │
│     Expected: Profile shows correct name           │
│     Automation: 🌐 HTTP GET /api/users/{{userId}}  │
│     Status: ✓ PASS (0.3s)                          │
│                                                     │
│ [4] Manually check browser console for errors      │
│     Expected: No errors in console                 │
│     Automation: 👤 MANUAL                           │
│     Status: ⏱️ PENDING                              │
└─────────────────────────────────────────────────────┘
```

**展示模式2: 工作流图 (适合开发者)**
```
┌─────────────────────────────────────────────────┐
│ Workflow Visualization                          │
│                                                 │
│   ┌──────────┐                                 │
│   │  START   │                                 │
│   └────┬─────┘                                 │
│        │                                       │
│        ▼                                       │
│   ┌──────────────────┐                        │
│   │ Step 1: Navigate │                        │
│   │ [Script]         │                        │
│   │ ✓ 0.5s           │                        │
│   └────┬─────────────┘                        │
│        │                                       │
│        ▼                                       │
│   ┌──────────────────┐                        │
│   │ Step 2: Login    │                        │
│   │ [Workflow]       │                        │
│   │ ✓ 1.2s           │                        │
│   └────┬─────────────┘                        │
│        │                                       │
│        ▼                                       │
│   ┌──────────────────┐                        │
│   │ Step 3: Verify   │                        │
│   │ [HTTP]           │                        │
│   │ ✓ 0.3s           │                        │
│   └────┬─────────────┘                        │
│        │                                       │
│        ▼                                       │
│   ┌──────────────────┐                        │
│   │ Step 4: Manual   │                        │
│   │ [MANUAL]         │                        │
│   │ ⏱️ PENDING        │                        │
│   └────┬─────────────┘                        │
│        │                                       │
│        ▼                                       │
│   ┌──────────┐                                │
│   │   END    │                                │
│   └──────────┘                                │
└─────────────────────────────────────────────────┘
```

**展示模式3: 数据流图 (适合调试)**
```
┌─────────────────────────────────────────────────┐
│ Data Flow Tracing                               │
│                                                 │
│ Environment Variables:                          │
│   baseUrl: "https://staging.example.com"       │
│   testUser: "alice@example.com"                │
│                                                 │
│ ┌─────────────────────────────────────────┐   │
│ │ Step 1: Navigate                        │   │
│ │ IN:  { url: "{{baseUrl}}/login" }       │   │
│ │ OUT: { pageLoaded: true }               │   │
│ └─────────────────────────────────────────┘   │
│              ▼                                  │
│ ┌─────────────────────────────────────────┐   │
│ │ Step 2: Login                           │   │
│ │ IN:  { username: "alice@example.com",   │   │
│ │        password: "***" }                │   │
│ │ OUT: { userId: "123",                   │   │
│ │        token: "eyJ...",                 │   │
│ │        role: "admin" }                  │   │
│ │ MAPPED:                                 │   │
│ │   userId → currentUserId = "123"        │   │
│ │   token → authToken = "eyJ..."          │   │
│ └─────────────────────────────────────────┘   │
│              ▼                                  │
│ ┌─────────────────────────────────────────┐   │
│ │ Step 3: Verify                          │   │
│ │ IN:  { userId: "{{currentUserId}}" }    │   │
│ │      (resolved: "123")                  │   │
│ │ OUT: { user: {                          │   │
│ │          id: "123",                     │   │
│ │          name: "Alice",                 │   │
│ │          role: "admin" }               │   │
│ └─────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

#### 3.3.3 观测系统设计

**1. 实时执行监控**

```typescript
// WebSocket消息协议
interface ExecutionMessage {
  type: 'test_start' | 'test_end' | 'step_start' | 'step_end' | 'step_log';
  payload: any;
}

// 消息类型1: 测试开始
{
  type: 'test_start',
  payload: {
    testCaseId: 'TC-001',
    runId: 'RUN-20250122-001',
    startTime: '2025-01-22T10:00:00Z',
    environment: 'staging',
    variables: {
      testUser: 'alice@example.com',
      baseUrl: 'https://staging.example.com'
    }
  }
}

// 消息类型2: 步骤开始
{
  type: 'step_start',
  payload: {
    runId: 'RUN-20250122-001',
    stepId: 's2',
    stepName: 'User logs in',
    automationType: 'workflow',
    workflowId: 'WF-LOGIN',
    startTime: '2025-01-22T10:00:01Z'
  }
}

// 消息类型3: 步骤日志
{
  type: 'step_log',
  payload: {
    runId: 'RUN-20250122-001',
    stepId: 's2',
    level: 'info',
    message: 'Executing workflow node: HTTP_REQUEST',
    timestamp: '2025-01-22T10:00:01.500Z',
    data: {
      url: '/api/login',
      method: 'POST'
    }
  }
}

// 消息类型4: 步骤结束
{
  type: 'step_end',
  payload: {
    runId: 'RUN-20250122-001',
    stepId: 's2',
    status: 'passed',
    duration: 1200,  // ms
    endTime: '2025-01-22T10:00:02.200Z',
    output: {
      userId: '123',
      token: 'eyJ...',
      role: 'admin'
    },
    assertions: [
      { description: 'Status code is 200', passed: true },
      { description: 'Response has userId', passed: true }
    ]
  }
}

// 消息类型5: 测试结束
{
  type: 'test_end',
  payload: {
    testCaseId: 'TC-001',
    runId: 'RUN-20250122-001',
    status: 'passed',
    duration: 3500,
    endTime: '2025-01-22T10:00:03.500Z',
    summary: {
      total: 4,
      passed: 3,
      failed: 0,
      skipped: 1,
      manual: 1
    }
  }
}
```

**2. 前端实时UI**

```typescript
// 实时执行监控组件
const ExecutionMonitor = ({ testCaseId, runId }: Props) => {
  const [steps, setSteps] = useState<StepStatus[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);

  useEffect(() => {
    const ws = new WebSocket(`ws://api/runs/${runId}/stream`);

    ws.onmessage = (event) => {
      const message: ExecutionMessage = JSON.parse(event.data);

      switch (message.type) {
        case 'step_start':
          setSteps(prev => prev.map(s =>
            s.id === message.payload.stepId
              ? { ...s, status: 'running', startTime: message.payload.startTime }
              : s
          ));
          break;

        case 'step_log':
          setLogs(prev => [...prev, message.payload]);
          break;

        case 'step_end':
          setSteps(prev => prev.map(s =>
            s.id === message.payload.stepId
              ? {
                  ...s,
                  status: message.payload.status,
                  duration: message.payload.duration,
                  output: message.payload.output
                }
              : s
          ));
          break;
      }
    };

    return () => ws.close();
  }, [runId]);

  return (
    <div className="execution-monitor">
      <StepProgress steps={steps} />
      <LiveLogViewer logs={logs} />
      <DataFlowInspector steps={steps} />
    </div>
  );
};
```

**3. 历史回溯与对比**

```typescript
// 执行历史对比
interface ExecutionComparison {
  testCaseId: string;
  runs: [
    {
      runId: 'RUN-20250121-001',
      status: 'failed',
      duration: 3800,
      failedStep: 's3',
      error: 'Assertion failed: Expected status 200, got 500'
    },
    {
      runId: 'RUN-20250122-001',
      status: 'passed',
      duration: 3500,
      failedStep: null,
      error: null
    }
  ];

  // 差异分析
  differences: [
    {
      category: 'performance',
      description: 'Step 2 improved from 1500ms to 1200ms'
    },
    {
      category: 'outcome',
      description: 'Step 3 status changed from FAILED to PASSED'
    }
  ];
}
```

---

## 第四部分: 多角色视角需求分析

### 4.1 测试工程师视角

**核心诉求**: "我要快速创建、执行、维护测试用例"

#### 4.1.1 测试用例创建

**场景1: 从需求到测试用例 (AI辅助)**
```
测试工程师: "我需要测试用户登录功能"
              ↓
AI助手:     生成测试用例草稿
            ┌─────────────────────────────────┐
            │ TestCase: User Login            │
            │ Steps:                          │
            │ 1. Navigate to login page       │
            │ 2. Enter valid credentials      │
            │ 3. Click login button           │
            │ 4. Verify dashboard displayed   │
            └─────────────────────────────────┘
              ↓
测试工程师: 审查、修改、补充细节
              ↓
保存测试用例 (手动测试)
```

**场景2: 渐进式自动化**
```
Day 1: 创建手动测试用例
       [Step 1] → MANUAL
       [Step 2] → MANUAL
       [Step 3] → MANUAL

Day 7: 自动化高频步骤
       [Step 1] → SCRIPT "navigate-to-login"
       [Step 2] → MANUAL
       [Step 3] → MANUAL

Day 14: 自动化关键路径
       [Step 1] → SCRIPT "navigate-to-login"
       [Step 2] → WORKFLOW "WF-LOGIN"
       [Step 3] → HTTP GET /api/user/profile

Day 30: 全自动化
       完整自动化流程，纳入CI/CD
```

#### 4.1.2 测试执行与调试

**痛点1: Flaky Test (不稳定测试)**
```typescript
// 问题: 网络延迟导致测试失败
Step 3: Click login button
  ❌ FAILED: Element not found: .dashboard

// 解决方案1: 自动重试 (配置级)
step.automation = {
  scriptId: 'click-login',
  retry: {
    maxAttempts: 3,
    interval: 1000
  }
};

// 解决方案2: 智能等待 (引擎级)
// 引擎自动等待元素出现，类似Playwright/Cypress
```

**痛点2: 数据污染**
```typescript
// 问题: 测试之间相互影响
Test A: 创建用户 "alice@test.com"
Test B: 期望用户 "alice@test.com" 不存在 ❌ 失败

// 解决方案: 测试隔离 + 自动清理
testCase.isolation = {
  database: 'snapshot',        // 数据库快照隔离
  cleanup: 'auto',             // 自动清理
  teardownScript: 'cleanup-db' // 清理脚本
};
```

#### 4.1.3 测试报告与分析

**需求**: "我要一目了然地知道哪些测试失败了，为什么失败"

```typescript
// 测试报告结构
interface TestReport {
  summary: {
    total: 100,
    passed: 85,
    failed: 10,
    skipped: 5,
    passRate: '85%',
    duration: '5m 30s'
  };

  failures: [
    {
      testCaseId: 'TC-042',
      name: 'Checkout flow',
      failedStep: 'Step 3: Payment processing',
      error: 'Timeout after 30s',
      screenshot: 'data:image/png;base64,...',
      logs: [/*...*/],

      // AI分析
      aiAnalysis: {
        possibleCauses: [
          'Payment gateway API is down',
          'Network latency exceeded threshold',
          'Test environment out of sync'
        ],
        suggestedActions: [
          'Check payment gateway status',
          'Retry with increased timeout',
          'Verify test data setup'
        ]
      }
    }
  ];

  trends: {
    comparedTo: 'last-run',
    improvements: 2,    // 新通过的测试
    regressions: 1,     // 新失败的测试
    flaky: 3            // 不稳定的测试
  };
}
```

---

### 4.2 开发者视角

**核心诉求**: "我要集成到CI/CD，自动化测试前后端"

#### 4.2.1 API测试与集成

**场景: 微服务集成测试**
```typescript
// 测试用例: 订单创建流程 (涉及3个微服务)
const testCase: TestCase = {
  id: 'TC-INTEGRATION-001',
  name: 'Create Order - Microservices Integration',
  steps: [
    {
      id: 's1',
      instruction: 'Create user in User Service',
      automation: {
        type: 'inline',
        inlineConfig: {
          type: 'HTTP',
          config: {
            method: 'POST',
            url: '{{userServiceUrl}}/api/users',
            body: {
              name: 'Test User',
              email: 'test@example.com'
            }
          }
        },
        outputMapping: {
          'body.userId': 'userId'
        }
      }
    },
    {
      id: 's2',
      instruction: 'Create product in Product Service',
      automation: {
        type: 'inline',
        inlineConfig: {
          type: 'HTTP',
          config: {
            method: 'POST',
            url: '{{productServiceUrl}}/api/products',
            body: {
              name: 'Widget',
              price: 19.99
            }
          }
        },
        outputMapping: {
          'body.productId': 'productId'
        }
      }
    },
    {
      id: 's3',
      instruction: 'Create order in Order Service',
      automation: {
        type: 'inline',
        inlineConfig: {
          type: 'HTTP',
          config: {
            method: 'POST',
            url: '{{orderServiceUrl}}/api/orders',
            body: {
              userId: '{{userId}}',      // 来自s1
              items: [
                {
                  productId: '{{productId}}',  // 来自s2
                  quantity: 2
                }
              ]
            }
          }
        },
        outputMapping: {
          'body.orderId': 'orderId'
        }
      }
    },
    {
      id: 's4',
      instruction: 'Verify order in database',
      automation: {
        type: 'inline',
        inlineConfig: {
          type: 'DB_QUERY',
          config: {
            dbType: 'POSTGRES',
            sql: `
              SELECT * FROM orders
              WHERE order_id = {{orderId}}
              AND user_id = {{userId}}
              AND status = 'pending'
            `
          }
        }
      }
    }
  ]
};
```

#### 4.2.2 CI/CD集成

**场景: Jenkins Pipeline**
```groovy
// Jenkinsfile
pipeline {
    agent any

    stages {
        stage('Build') {
            steps {
                sh 'npm run build'
            }
        }

        stage('Unit Tests') {
            steps {
                sh 'npm run test:unit'
            }
        }

        stage('Deploy to Staging') {
            steps {
                sh './deploy.sh staging'
            }
        }

        stage('Integration Tests') {
            steps {
                // 调用测试平台API
                script {
                    def response = sh(
                        script: '''
                            curl -X POST https://test-platform/api/v2/runs/batch \\
                              -H "Content-Type: application/json" \\
                              -d '{
                                "projectId": "proj-001",
                                "environment": "staging",
                                "tags": ["integration", "smoke"],
                                "parallel": true
                              }'
                        ''',
                        returnStdout: true
                    ).trim()

                    def result = readJSON text: response
                    def runId = result.runId

                    // 等待测试完成
                    waitForTestCompletion(runId)

                    // 获取测试结果
                    def testResult = getTestResult(runId)

                    if (testResult.summary.failed > 0) {
                        error("Integration tests failed: ${testResult.summary.failed} failures")
                    }
                }
            }
        }

        stage('Deploy to Production') {
            when {
                branch 'main'
            }
            steps {
                sh './deploy.sh production'
            }
        }
    }

    post {
        always {
            // 发布测试报告
            publishHTML([
                reportDir: 'test-reports',
                reportFiles: 'index.html',
                reportName: 'Test Report'
            ])
        }
    }
}
```

#### 4.2.3 性能测试

**场景: 压力测试**
```typescript
// 性能测试用例
const loadTestCase: TestCase = {
  id: 'TC-PERF-001',
  name: 'API Load Test - 100 concurrent users',
  steps: [
    {
      id: 's1',
      instruction: 'Ramp up to 100 concurrent users over 60s',
      automation: {
        type: 'script',
        scriptId: 'LOAD-TEST-RAMPUP',
        input: {
          targetRPS: 100,          // Requests per second
          rampUpDuration: 60,      // seconds
          testDuration: 300,       // 5 minutes
          endpoint: '{{baseUrl}}/api/products'
        },
        outputMapping: {
          'metrics.avgResponseTime': 'avgResponseTime',
          'metrics.p95ResponseTime': 'p95ResponseTime',
          'metrics.errorRate': 'errorRate'
        }
      }
    },
    {
      id: 's2',
      instruction: 'Verify performance SLA',
      automation: {
        type: 'inline',
        inlineConfig: {
          type: 'ASSERTION',
          config: {
            assertions: [
              {
                field: '{{avgResponseTime}}',
                operator: '<',
                value: 200,  // ms
                message: 'Average response time must be < 200ms'
              },
              {
                field: '{{p95ResponseTime}}',
                operator: '<',
                value: 500,
                message: 'P95 response time must be < 500ms'
              },
              {
                field: '{{errorRate}}',
                operator: '<',
                value: 0.01,  // 1%
                message: 'Error rate must be < 1%'
              }
            ]
          }
        }
      }
    }
  ]
};
```

---

### 4.3 产品经理视角

**核心诉求**: "我要可视化展示测试覆盖率和质量趋势"

#### 4.3.1 测试覆盖率可视化

```typescript
// 测试覆盖率仪表板
interface CoverageDashboard {
  // 功能覆盖率
  featureCoverage: {
    total: 50,               // 总功能数
    tested: 42,              // 已测功能数
    automated: 35,           // 已自动化功能数
    coverageRate: '84%',
    automationRate: '70%',

    byModule: [
      { module: 'Authentication', coverage: '100%', automated: '90%' },
      { module: 'Shopping Cart', coverage: '95%', automated: '80%' },
      { module: 'Checkout', coverage: '60%', automated: '40%' },  // ⚠️ 低覆盖
    ]
  };

  // 需求覆盖率
  requirementCoverage: {
    total: 120,
    covered: 100,
    coverageRate: '83%',

    byPriority: {
      'P0': { total: 20, covered: 20, rate: '100%' },
      'P1': { total: 40, covered: 38, rate: '95%' },
      'P2': { total: 60, covered: 42, rate: '70%' },  // ⚠️ 低覆盖
    }
  };

  // 质量趋势
  qualityTrends: [
    { week: 'W1', passRate: 85, flaky: 5 },
    { week: 'W2', passRate: 88, flaky: 4 },
    { week: 'W3', passRate: 90, flaky: 3 },  // ✅ 改善趋势
    { week: 'W4', passRate: 92, flaky: 2 },
  ];
}
```

#### 4.3.2 需求追溯

```typescript
// 从需求到测试的追溯
interface RequirementTraceability {
  requirement: {
    id: 'REQ-042',
    title: 'User should be able to checkout with multiple payment methods',
    priority: 'P1',
    status: 'In Development'
  };

  // 关联的测试用例
  testCases: [
    {
      id: 'TC-101',
      name: 'Checkout with Credit Card',
      status: 'passed',
      automated: true,
      lastRun: '2025-01-22'
    },
    {
      id: 'TC-102',
      name: 'Checkout with PayPal',
      status: 'passed',
      automated: true,
      lastRun: '2025-01-22'
    },
    {
      id: 'TC-103',
      name: 'Checkout with Apple Pay',
      status: 'not-run',  // ⚠️ 未测试
      automated: false,
      lastRun: null
    }
  ];

  // 覆盖率
  coverage: {
    totalScenarios: 3,
    testedScenarios: 2,
    rate: '67%',
    status: 'warning'  // 未达到100%
  };
}
```

---

### 4.4 后端运维视角

**核心诉求**: "我要监控测试环境稳定性，快速定位问题"

#### 4.4.1 环境健康监控

```typescript
// 环境健康检查
interface EnvironmentHealth {
  environment: 'staging';

  // 基础设施
  infrastructure: {
    database: {
      status: 'healthy',
      latency: 5,  // ms
      connections: 12
    },
    redis: {
      status: 'healthy',
      memory: '45%',
      keys: 1520
    },
    messageQueue: {
      status: 'degraded',  // ⚠️ 降级
      queueDepth: 1500,    // 队列积压
      latency: 250
    }
  };

  // 外部依赖
  externalServices: {
    paymentGateway: {
      status: 'healthy',
      uptime: '99.9%',
      avgResponseTime: 120
    },
    emailService: {
      status: 'down',      // ❌ 宕机
      lastCheckTime: '2025-01-22T10:05:00Z',
      error: 'Connection timeout'
    }
  };

  // 测试执行影响
  testImpact: {
    affectedTests: [
      {
        testId: 'TC-055',
        name: 'Email notification test',
        reason: 'Email service is down'
      }
    ],
    recommendation: 'Skip email-related tests until service recovers'
  };
}
```

#### 4.4.2 资源使用追踪

```typescript
// 资源使用监控
interface ResourceUsage {
  testRun: {
    runId: 'RUN-20250122-001',
    duration: 300,  // seconds
  };

  // 数据库资源
  database: {
    queries: 1520,
    avgQueryTime: 8,  // ms
    slowQueries: [
      { sql: 'SELECT * FROM orders WHERE...', duration: 250 },
    ],
    connections: {
      peak: 15,
      avg: 8
    }
  };

  // 网络资源
  network: {
    totalRequests: 450,
    totalBytes: '12.5 MB',
    bandwidth: {
      peak: '5 Mbps',
      avg: '2.5 Mbps'
    }
  };

  // 计算资源
  compute: {
    cpu: {
      peak: '45%',
      avg: '25%'
    },
    memory: {
      peak: '1.2 GB',
      avg: '800 MB'
    }
  };
}
```

---

## 第五部分: 数据流转与类型系统设计

### 5.1 数据流转机制

#### 5.1.1 数据流的本质

从第一性原理分析，工作流中的数据流包含三个层次：

```
Level 1: 变量作用域 (Scope)
  ├─ Global Variables     (全局变量 - 跨所有节点)
  ├─ Node Local Variables (节点局部变量 - 仅当前节点)
  └─ Node Outputs         (节点输出 - 可供下游节点使用)

Level 2: 数据传递方式 (Transfer)
  ├─ Implicit Passing     (隐式传递 - 自动继承上游输出)
  ├─ Explicit Mapping     (显式映射 - 手动配置输入)
  └─ Reference            (引用 - 通过表达式引用)

Level 3: 数据转换 (Transform)
  ├─ Type Coercion        (类型转换)
  ├─ Data Extraction      (数据提取 - JSONPath, XPath)
  └─ Data Aggregation     (数据聚合 - Merge, Reduce)
```

#### 5.1.2 统一的数据模型

```typescript
// 执行上下文 - 贯穿整个工作流执行
interface ExecutionContext {
  // 1. 全局变量
  globalVariables: Record<string, any>;

  // 2. 节点输出 (按节点ID索引)
  nodeOutputs: Record<string, NodeOutput>;

  // 3. 当前节点上下文
  currentNode: {
    id: string;
    type: string;
    input: Record<string, any>;     // 当前节点的输入
    localVars: Record<string, any>; // 节点局部变量
  };

  // 4. 元数据
  metadata: {
    runId: string;
    startTime: string;
    environment: string;
  };
}

// 节点输出
interface NodeOutput {
  nodeId: string;
  nodeName: string;
  status: 'success' | 'failed';

  // 输出数据 (结构化)
  data: {
    // 原始输出 (节点返回的原始数据)
    raw: any;

    // 映射后的输出 (根据outputMapping转换)
    mapped: Record<string, any>;
  };

  // 元数据
  metadata: {
    duration: number;
    timestamp: string;
  };
}
```

#### 5.1.3 数据引用语法

**设计目标**: 类似n8n和Airflow，但更强大

```typescript
// 语法设计
const syntax = {
  // 1. 引用全局变量
  globalVar: '{{variableName}}',

  // 2. 引用特定节点的输出
  nodeOutput: '{{nodes.nodeId.output.fieldName}}',

  // 3. 引用上一个节点的输出 (简写)
  prevOutput: '{{$prev.fieldName}}',

  // 4. 嵌套字段访问 (JSONPath)
  nested: '{{nodes.api1.output.user.profile.email}}',

  // 5. 数组访问
  array: '{{nodes.api1.output.users[0].name}}',

  // 6. 表达式计算
  expression: '{{nodes.api1.output.price * 1.1}}',

  // 7. 函数调用
  function: '{{$now()}}',             // 当前时间
  function2: '{{$uuid()}}',           // 生成UUID
  function3: '{{$base64(data)}}',     // Base64编码

  // 8. 条件表达式 (三元运算符)
  conditional: '{{nodes.api1.output.status === 200 ? "success" : "failed"}}',

  // 9. 模板字符串
  template: 'User {{user.name}} has {{user.points}} points',
};
```

**实现: 表达式解析器**

```typescript
// 表达式解析器
class ExpressionEvaluator {
  private context: ExecutionContext;

  constructor(context: ExecutionContext) {
    this.context = context;
  }

  // 解析并求值表达式
  evaluate(expression: string): any {
    // 1. 检测是否包含变量引用
    const varRegex = /\{\{(.+?)\}\}/g;

    if (!varRegex.test(expression)) {
      return expression;  // 纯字符串，直接返回
    }

    // 2. 替换所有变量引用
    return expression.replace(varRegex, (match, expr) => {
      return this.evaluateSingle(expr.trim());
    });
  }

  // 求值单个表达式
  private evaluateSingle(expr: string): any {
    // 处理不同的引用类型

    // 1. 全局变量: variableName
    if (!expr.includes('.') && !expr.includes('(')) {
      return this.context.globalVariables[expr];
    }

    // 2. 节点输出: nodes.nodeId.output.field
    if (expr.startsWith('nodes.')) {
      const path = expr.split('.');
      const nodeId = path[1];
      const field = path.slice(3).join('.');  // 跳过 "nodes.nodeId.output"

      const nodeOutput = this.context.nodeOutputs[nodeId];
      return this.getNestedValue(nodeOutput.data.mapped, field);
    }

    // 3. 上一个节点: $prev.field
    if (expr.startsWith('$prev.')) {
      const prevNodeId = this.getPreviousNodeId();
      const field = expr.substring(6);  // 去掉 "$prev."

      const nodeOutput = this.context.nodeOutputs[prevNodeId];
      return this.getNestedValue(nodeOutput.data.mapped, field);
    }

    // 4. 内置函数: $functionName()
    if (expr.startsWith('$') && expr.includes('(')) {
      return this.evaluateFunction(expr);
    }

    // 5. 表达式计算 (使用安全的求值)
    try {
      return this.safeEval(expr);
    } catch (error) {
      throw new Error(`Failed to evaluate expression: ${expr}`);
    }
  }

  // 获取嵌套字段值
  private getNestedValue(obj: any, path: string): any {
    const keys = path.split('.');
    let current = obj;

    for (const key of keys) {
      // 处理数组访问: users[0]
      if (key.includes('[')) {
        const [arrayKey, indexStr] = key.split('[');
        const index = parseInt(indexStr.replace(']', ''));
        current = current[arrayKey][index];
      } else {
        current = current[key];
      }

      if (current === undefined) {
        return null;
      }
    }

    return current;
  }

  // 求值内置函数
  private evaluateFunction(expr: string): any {
    const funcRegex = /\$(\w+)\((.*)\)/;
    const match = expr.match(funcRegex);

    if (!match) {
      throw new Error(`Invalid function syntax: ${expr}`);
    }

    const [, funcName, argsStr] = match;

    // 内置函数映射
    const functions: Record<string, (...args: any[]) => any> = {
      now: () => new Date().toISOString(),
      uuid: () => crypto.randomUUID(),
      base64: (data: string) => Buffer.from(data).toString('base64'),
      json: (data: string) => JSON.parse(data),
      stringify: (data: any) => JSON.stringify(data),

      // 数学函数
      abs: (n: number) => Math.abs(n),
      ceil: (n: number) => Math.ceil(n),
      floor: (n: number) => Math.floor(n),
      round: (n: number) => Math.round(n),

      // 字符串函数
      upper: (s: string) => s.toUpperCase(),
      lower: (s: string) => s.toLowerCase(),
      trim: (s: string) => s.trim(),

      // 数组函数
      length: (arr: any[]) => arr.length,
      first: (arr: any[]) => arr[0],
      last: (arr: any[]) => arr[arr.length - 1],
    };

    const func = functions[funcName];
    if (!func) {
      throw new Error(`Unknown function: ${funcName}`);
    }

    // 解析参数
    const args = argsStr ? argsStr.split(',').map(arg => this.evaluate(arg.trim())) : [];

    return func(...args);
  }

  // 安全求值 (使用沙箱)
  private safeEval(expr: string): any {
    // 创建受限的上下文
    const sandbox = {
      nodes: this.context.nodeOutputs,
      vars: this.context.globalVariables,
      Math,
      Date,
      JSON,
    };

    // 使用Function构造器 (相对eval更安全)
    const func = new Function(...Object.keys(sandbox), `return (${expr});`);
    return func(...Object.values(sandbox));
  }

  private getPreviousNodeId(): string {
    // 根据DAG获取当前节点的上一个节点
    // 实现略
    return '';
  }
}

// 使用示例
const evaluator = new ExpressionEvaluator(executionContext);

const url = evaluator.evaluate('{{baseUrl}}/users/{{nodes.login.output.userId}}');
// 结果: "https://api.example.com/users/123"

const price = evaluator.evaluate('{{nodes.getProduct.output.price * 1.1}}');
// 结果: 21.99 (假设原价19.99)

const timestamp = evaluator.evaluate('{{$now()}}');
// 结果: "2025-01-22T10:30:00.000Z"
```

---

### 5.2 类型系统设计

#### 5.2.1 渐进式类型系统

**设计哲学**: TypeScript风格 - 可选但推荐

```typescript
// Level 1: 无类型 (完全动态)
const workflow1 = {
  nodes: {
    n1: {
      type: 'HTTP_REQUEST',
      config: {
        url: '{{baseUrl}}/users',
      },
      output: {}  // 无类型定义
    }
  }
};

// Level 2: 简单类型注解
const workflow2 = {
  nodes: {
    n1: {
      type: 'HTTP_REQUEST',
      config: {
        url: '{{baseUrl}}/users',
      },
      output: {
        schema: {
          type: 'object',
          properties: {
            users: { type: 'array' },
            total: { type: 'number' }
          }
        }
      }
    }
  }
};

// Level 3: 详细类型定义 (完整Schema)
const workflow3: TypedWorkflow = {
  nodes: {
    n1: {
      type: 'HTTP_REQUEST',
      config: {
        url: '{{baseUrl}}/users',
      },
      output: {
        schema: {
          type: 'object',
          properties: {
            users: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  email: { type: 'string', format: 'email' },
                  age: { type: 'number', minimum: 0, maximum: 150 }
                },
                required: ['id', 'name', 'email']
              }
            },
            total: { type: 'number' }
          },
          required: ['users', 'total']
        }
      }
    }
  }
};
```

#### 5.2.2 类型推断

```typescript
// 类型推断引擎
class TypeInferenceEngine {
  // 从实际数据推断类型
  inferTypeFromValue(value: any): JSONSchema {
    if (value === null) {
      return { type: 'null' };
    }

    const type = typeof value;

    if (type === 'boolean') {
      return { type: 'boolean' };
    }

    if (type === 'number') {
      return { type: 'number' };
    }

    if (type === 'string') {
      // 检测特殊格式
      if (this.isEmail(value)) {
        return { type: 'string', format: 'email' };
      }
      if (this.isUUID(value)) {
        return { type: 'string', format: 'uuid' };
      }
      if (this.isISO8601(value)) {
        return { type: 'string', format: 'date-time' };
      }
      return { type: 'string' };
    }

    if (Array.isArray(value)) {
      if (value.length === 0) {
        return { type: 'array' };
      }

      // 推断数组元素类型 (取第一个元素)
      const itemSchema = this.inferTypeFromValue(value[0]);
      return {
        type: 'array',
        items: itemSchema
      };
    }

    if (type === 'object') {
      const properties: Record<string, JSONSchema> = {};
      const required: string[] = [];

      for (const [key, val] of Object.entries(value)) {
        properties[key] = this.inferTypeFromValue(val);
        if (val !== null && val !== undefined) {
          required.push(key);
        }
      }

      return {
        type: 'object',
        properties,
        required
      };
    }

    return { type: 'string' };  // 默认
  }

  // 运行时自动学习类型
  async learnTypeFromExecution(nodeId: string, executionHistory: NodeOutput[]): Promise<JSONSchema> {
    // 收集多次执行的输出
    const samples = executionHistory.map(h => h.data.raw);

    // 合并类型 (求最宽松的类型)
    let mergedSchema: JSONSchema = this.inferTypeFromValue(samples[0]);

    for (let i = 1; i < samples.length; i++) {
      const currentSchema = this.inferTypeFromValue(samples[i]);
      mergedSchema = this.mergeSchemas(mergedSchema, currentSchema);
    }

    return mergedSchema;
  }

  // 合并两个Schema (求并集)
  private mergeSchemas(schema1: JSONSchema, schema2: JSONSchema): JSONSchema {
    // 实现略 (复杂逻辑)
    // 处理类型冲突、可选字段等
    return schema1;
  }

  private isEmail(str: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str);
  }

  private isUUID(str: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
  }

  private isISO8601(str: string): boolean {
    return !isNaN(Date.parse(str));
  }
}
```

#### 5.2.3 类型校验

```typescript
// 类型校验器 (基于JSON Schema)
import Ajv from 'ajv';

class TypeValidator {
  private ajv: Ajv;

  constructor() {
    this.ajv = new Ajv({
      allErrors: true,
      verbose: true,
      coerceTypes: true  // 自动类型转换
    });
  }

  // 校验数据是否符合Schema
  validate(data: any, schema: JSONSchema): ValidationResult {
    const validate = this.ajv.compile(schema);
    const valid = validate(data);

    if (valid) {
      return {
        valid: true,
        errors: []
      };
    }

    return {
      valid: false,
      errors: validate.errors?.map(err => ({
        path: err.instancePath,
        message: err.message || '',
        expected: err.schema,
        actual: err.data
      })) || []
    };
  }

  // 节点间类型兼容性检查
  checkCompatibility(
    sourceNode: WorkflowNode,
    targetNode: WorkflowNode
  ): CompatibilityResult {
    const sourceOutput = sourceNode.output?.schema;
    const targetInput = targetNode.input?.schema;

    if (!sourceOutput || !targetInput) {
      return {
        compatible: true,
        warnings: ['No type information available']
      };
    }

    // 检查source的输出是否满足target的输入要求
    const errors: string[] = [];
    const warnings: string[] = [];

    // 检查必填字段
    if (targetInput.required) {
      for (const field of targetInput.required) {
        if (!sourceOutput.properties?.[field]) {
          errors.push(`Missing required field: ${field}`);
        }
      }
    }

    // 检查类型匹配
    if (sourceOutput.properties && targetInput.properties) {
      for (const [field, targetSchema] of Object.entries(targetInput.properties)) {
        const sourceSchema = sourceOutput.properties[field];

        if (sourceSchema && sourceSchema.type !== targetSchema.type) {
          warnings.push(
            `Type mismatch for field "${field}": ` +
            `expected ${targetSchema.type}, got ${sourceSchema.type}`
          );
        }
      }
    }

    return {
      compatible: errors.length === 0,
      errors,
      warnings
    };
  }
}

interface ValidationResult {
  valid: boolean;
  errors: Array<{
    path: string;
    message: string;
    expected: any;
    actual: any;
  }>;
}

interface CompatibilityResult {
  compatible: boolean;
  errors?: string[];
  warnings?: string[];
}
```

#### 5.2.4 UI中的类型提示

```typescript
// 智能代码补全
class AutoCompleteProvider {
  // 获取可用的变量补全
  getCompletions(
    cursorPosition: number,
    expression: string,
    context: ExecutionContext
  ): Completion[] {
    const completions: Completion[] = [];

    // 1. 全局变量
    for (const varName of Object.keys(context.globalVariables)) {
      completions.push({
        label: varName,
        kind: 'variable',
        detail: typeof context.globalVariables[varName],
        insertText: `{{${varName}}}`
      });
    }

    // 2. 节点输出
    for (const [nodeId, output] of Object.entries(context.nodeOutputs)) {
      const nodeName = output.nodeName;

      // 添加节点引用
      completions.push({
        label: `nodes.${nodeId}`,
        kind: 'reference',
        detail: `Output from ${nodeName}`,
        insertText: `{{nodes.${nodeId}.output.`
      });

      // 如果有Schema，添加字段补全
      if (output.schema) {
        for (const field of Object.keys(output.schema.properties || {})) {
          completions.push({
            label: `${nodeId}.${field}`,
            kind: 'field',
            detail: output.schema.properties[field].type,
            insertText: `{{nodes.${nodeId}.output.${field}}}`
          });
        }
      }
    }

    // 3. 内置函数
    const builtinFunctions = [
      '$now()', '$uuid()', '$base64()', '$json()',
      '$upper()', '$lower()', '$trim()'
    ];

    for (const func of builtinFunctions) {
      completions.push({
        label: func,
        kind: 'function',
        detail: 'Built-in function',
        insertText: `{{${func}}}`
      });
    }

    return completions;
  }

  // 类型提示 (Hover)
  getTypeHint(
    expression: string,
    context: ExecutionContext
  ): TypeHint | null {
    const evaluator = new ExpressionEvaluator(context);

    try {
      const value = evaluator.evaluate(expression);
      const type = typeof value;

      return {
        value: JSON.stringify(value, null, 2),
        type,
        schema: new TypeInferenceEngine().inferTypeFromValue(value)
      };
    } catch (error) {
      return {
        error: (error as Error).message
      };
    }
  }
}

interface Completion {
  label: string;
  kind: 'variable' | 'reference' | 'field' | 'function';
  detail: string;
  insertText: string;
}

interface TypeHint {
  value?: string;
  type?: string;
  schema?: JSONSchema;
  error?: string;
}
```

---

**未完待续...**

文档太长，我将继续在后续部分完成：
- 第六部分: 测试案例复用与组合策略
- 第七部分: 最终架构设计方案
- 第八部分: 实施路线图与验证策略

现在先保存当前进度。

## 第六部分: 测试案例复用与组合策略

### 6.1 复用的三个层次

基于第一性原理，测试复用可以在三个层次实现：

```
Layer 1: 原子级复用 (Atomic)
  └─ Script、Action、Assertion的复用

Layer 2: 组件级复用 (Component)
  └─ TestStep、Workflow Fragment的复用

Layer 3: 流程级复用 (Flow)
  └─ 完整Workflow、TestCase Template的复用
```

---

### 6.2 原子级复用：Script Library

**设计模式**: Repository Pattern

```typescript
// Script作为最小复用单元
interface ScriptRepository {
  // CRUD操作
  create(script: Script): Promise<Script>;
  findById(id: string): Promise<Script | null>;
  findByTag(tags: string[]): Promise<Script[]>;
  search(query: string): Promise<Script[]>;

  // 版本管理
  createVersion(scriptId: string, changelog: string): Promise<ScriptVersion>;
  getVersionHistory(scriptId: string): Promise<ScriptVersion[]>;
  rollback(scriptId: string, version: number): Promise<Script>;
}

// Script使用示例
const loginScript: Script = {
  id: 'SCRIPT-LOGIN',
  name: 'User Login',
  type: 'JAVASCRIPT',
  category: 'authentication',
  tags: ['auth', 'login', 'user'],

  // 参数定义
  parameters: [
    {
      name: 'username',
      type: 'string',
      required: true,
      description: 'Username or email'
    },
    {
      name: 'password',
      type: 'string',
      required: true,
      description: 'User password',
      sensitive: true  // 标记为敏感数据
    },
    {
      name: 'rememberMe',
      type: 'boolean',
      required: false,
      defaultValue: false
    }
  ],

  // 输出定义
  outputs: [
    {
      name: 'userId',
      type: 'string',
      description: 'User ID'
    },
    {
      name: 'token',
      type: 'string',
      description: 'Authentication token'
    },
    {
      name: 'role',
      type: 'string',
      description: 'User role'
    }
  ],

  // 脚本内容
  content: `
    async function execute({ username, password, rememberMe }) {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, rememberMe })
      });

      const data = await response.json();

      return {
        userId: data.user.id,
        token: data.token,
        role: data.user.role
      };
    }
  `,

  // 测试示例 (用于文档和自测)
  testExamples: [
    {
      name: 'Admin Login',
      input: {
        username: 'admin@example.com',
        password: 'admin123',
        rememberMe: true
      },
      expectedOutput: {
        role: 'admin'
      }
    },
    {
      name: 'Regular User Login',
      input: {
        username: 'user@example.com',
        password: 'user123'
      },
      expectedOutput: {
        role: 'user'
      }
    }
  ],

  // 版本信息
  version: '2.1.0',
  changelog: 'Added rememberMe parameter',
  isTemplate: false  // 不是模板，是可执行脚本
};
```

**复用方式**:
```typescript
// 方式1: 在TestStep中引用
testStep.automation = {
  type: 'script',
  scriptId: 'SCRIPT-LOGIN',
  input: {
    username: '{{testUser}}',
    password: '{{testPassword}}'
  },
  outputMapping: {
    'userId': 'currentUserId',
    'token': 'authToken'
  }
};

// 方式2: 在Workflow Node中引用
workflowNode = {
  id: 'n1',
  type: 'SCRIPT',
  config: {
    scriptId: 'SCRIPT-LOGIN',
    input: {
      username: '{{vars.username}}',
      password: '{{vars.password}}'
    }
  }
};
```

---

### 6.3 组件级复用：Workflow Fragments

**设计模式**: Composition Pattern

```typescript
// Workflow Fragment - 可复用的工作流片段
interface WorkflowFragment {
  id: string;
  name: string;
  description: string;

  // 片段类型
  type: 'sequence' | 'conditional' | 'loop' | 'parallel';

  // 接口定义
  inputSchema: ParameterSchema[];
  outputSchema: ParameterSchema[];

  // 节点定义
  nodes: Record<string, WorkflowNode>;

  // 入口和出口节点
  entryNode: string;
  exitNode: string;

  // 元数据
  tags: string[];
  category: string;
}

// 示例: 用户认证Fragment
const authFragment: WorkflowFragment = {
  id: 'FRAG-AUTH',
  name: 'User Authentication Flow',
  description: 'Complete user authentication with token refresh',
  type: 'sequence',

  inputSchema: [
    { name: 'username', type: 'string', required: true },
    { name: 'password', type: 'string', required: true }
  ],

  outputSchema: [
    { name: 'userId', type: 'string' },
    { name: 'accessToken', type: 'string' },
    { name: 'refreshToken', type: 'string' }
  ],

  nodes: {
    'login': {
      id: 'login',
      type: 'SCRIPT',
      config: { scriptId: 'SCRIPT-LOGIN' }
    },
    'getProfile': {
      id: 'getProfile',
      type: 'HTTP_REQUEST',
      config: {
        url: '/api/users/{{login.userId}}',
        headers: {
          'Authorization': 'Bearer {{login.token}}'
        }
      },
      dependsOn: ['login']
    },
    'refreshToken': {
      id: 'refreshToken',
      type: 'HTTP_REQUEST',
      config: {
        url: '/api/auth/refresh',
        method: 'POST'
      },
      dependsOn: ['login']
    }
  },

  entryNode: 'login',
  exitNode: 'refreshToken',

  tags: ['auth', 'security'],
  category: 'authentication'
};

// Fragment组合
class WorkflowComposer {
  // 将Fragment嵌入到Workflow中
  embedFragment(
    workflow: Workflow,
    fragmentId: string,
    position: string,  // 插入位置
    inputMapping: Record<string, string>,
    outputMapping: Record<string, string>
  ): Workflow {
    const fragment = this.loadFragment(fragmentId);

    // 1. 复制Fragment的所有节点到Workflow
    for (const [nodeId, node] of Object.entries(fragment.nodes)) {
      const newNodeId = `${fragmentId}_${nodeId}`;
      workflow.nodes[newNodeId] = {
        ...node,
        id: newNodeId
      };
    }

    // 2. 处理输入映射
    const entryNodeId = `${fragmentId}_${fragment.entryNode}`;
    workflow.nodes[entryNodeId].input = inputMapping;

    // 3. 处理输出映射
    const exitNodeId = `${fragmentId}_${fragment.exitNode}`;
    workflow.nodes[exitNodeId].output = outputMapping;

    // 4. 连接到Workflow
    const previousNode = workflow.nodes[position];
    previousNode.children = [entryNodeId];

    return workflow;
  }

  private loadFragment(id: string): WorkflowFragment {
    // 从数据库加载Fragment
    return {} as WorkflowFragment;
  }
}
```

---

### 6.4 流程级复用：Test Case Templates

**设计模式**: Template Method Pattern + Parameterization

```typescript
// TestCase Template
interface TestCaseTemplate {
  id: string;
  name: string;
  description: string;
  category: string;

  // 模板参数 (可变部分)
  templateParameters: TemplateParameter[];

  // 固定步骤 (不可变部分)
  fixedSteps: TestStep[];

  // 可选步骤
  optionalSteps: TestStep[];

  // 使用次数
  usageCount: number;
}

interface TemplateParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object';
  description: string;
  defaultValue?: any;
  required: boolean;
}

// 示例: E2E购物模板
const e2eShoppingTemplate: TestCaseTemplate = {
  id: 'TMPL-E2E-SHOPPING',
  name: 'E2E Shopping Flow Template',
  description: 'Complete shopping flow from login to checkout',
  category: 'e2e',

  templateParameters: [
    {
      name: 'productId',
      type: 'string',
      description: 'Product ID to purchase',
      required: true
    },
    {
      name: 'quantity',
      type: 'number',
      description: 'Quantity to purchase',
      defaultValue: 1,
      required: false
    },
    {
      name: 'paymentMethod',
      type: 'string',
      description: 'Payment method: credit_card | paypal',
      defaultValue: 'credit_card',
      required: false
    }
  ],

  fixedSteps: [
    {
      id: 's1',
      instruction: 'User logs in',
      automation: {
        type: 'workflow',
        workflowId: 'FRAG-AUTH'
      }
    },
    {
      id: 's2',
      instruction: 'Add product {{productId}} to cart',
      automation: {
        type: 'script',
        scriptId: 'SCRIPT-ADD-TO-CART',
        input: {
          productId: '{{templateParams.productId}}',
          quantity: '{{templateParams.quantity}}'
        }
      }
    },
    {
      id: 's3',
      instruction: 'Proceed to checkout',
      automation: {
        type: 'script',
        scriptId: 'SCRIPT-CHECKOUT'
      }
    },
    {
      id: 's4',
      instruction: 'Complete payment with {{paymentMethod}}',
      automation: {
        type: 'script',
        scriptId: 'SCRIPT-PAYMENT',
        input: {
          method: '{{templateParams.paymentMethod}}'
        }
      }
    }
  ],

  optionalSteps: [
    {
      id: 'opt1',
      instruction: 'Apply coupon code',
      automation: {
        type: 'script',
        scriptId: 'SCRIPT-APPLY-COUPON'
      }
    }
  ],

  usageCount: 0
};

// 从模板实例化TestCase
class TestCaseFactory {
  createFromTemplate(
    templateId: string,
    params: Record<string, any>,
    includeOptionalSteps?: string[]  // 选择包含的可选步骤
  ): TestCase {
    const template = this.loadTemplate(templateId);

    // 验证参数
    this.validateParameters(template, params);

    // 实例化步骤
    const steps = template.fixedSteps.map(step => ({
      ...step,
      // 替换模板变量
      instruction: this.interpolateTemplate(step.instruction, params),
      automation: step.automation ? {
        ...step.automation,
        input: this.interpolateObject(step.automation.input, params)
      } : undefined
    }));

    // 添加可选步骤
    if (includeOptionalSteps) {
      for (const stepId of includeOptionalSteps) {
        const optStep = template.optionalSteps.find(s => s.id === stepId);
        if (optStep) {
          steps.push(optStep);
        }
      }
    }

    return {
      id: this.generateId(),
      name: `${template.name} - ${params.productId}`,
      description: `Generated from template ${template.id}`,
      steps,
      tags: ['generated-from-template', template.category],
      templateId: template.id,
      templateParams: params,
      // ... 其他字段
    } as TestCase;
  }

  private validateParameters(template: TestCaseTemplate, params: Record<string, any>) {
    for (const param of template.templateParameters) {
      if (param.required && !(param.name in params)) {
        throw new Error(`Missing required parameter: ${param.name}`);
      }
    }
  }

  private interpolateTemplate(text: string, params: Record<string, any>): string {
    return text.replace(/\{\{templateParams\.(\w+)\}\}/g, (_, key) => {
      return params[key] || '';
    });
  }

  private interpolateObject(obj: any, params: Record<string, any>): any {
    if (typeof obj === 'string') {
      return this.interpolateTemplate(obj, params);
    }
    if (Array.isArray(obj)) {
      return obj.map(item => this.interpolateObject(item, params));
    }
    if (typeof obj === 'object' && obj !== null) {
      const result: any = {};
      for (const [key, value] of Object.entries(obj)) {
        result[key] = this.interpolateObject(value, params);
      }
      return result;
    }
    return obj;
  }

  private loadTemplate(id: string): TestCaseTemplate {
    // 从数据库加载模板
    return {} as TestCaseTemplate;
  }

  private generateId(): string {
    return `TC-${Date.now()}`;
  }
}

// 使用示例
const factory = new TestCaseFactory();

const testCase1 = factory.createFromTemplate(
  'TMPL-E2E-SHOPPING',
  {
    productId: 'PROD-001',
    quantity: 2,
    paymentMethod: 'paypal'
  },
  ['opt1']  // 包含优惠券步骤
);
```

---

### 6.5 组合策略：Test Suite Composer

**组合模式**: 将多个TestCase组合成TestSuite

```typescript
interface TestSuite {
  id: string;
  name: string;
  description: string;

  // 测试用例列表
  testCases: Array<{
    testCaseId: string;
    order: number;
    enabled: boolean;
    runCondition?: string;  // 条件执行
  }>;

  // Suite级配置
  config: {
    parallel: boolean;          // 是否并行执行
    maxParallel?: number;       // 最大并行数
    continueOnFailure: boolean; // 失败后是否继续
    timeout: number;            // 总超时时间
  };

  // Setup/Teardown
  setupWorkflowId?: string;
  teardownWorkflowId?: string;

  // 调度
  schedule?: {
    cron: string;               // Cron表达式
    timezone: string;
    enabled: boolean;
  };
}

// 示例: 冒烟测试套件
const smokeSuite: TestSuite = {
  id: 'SUITE-SMOKE',
  name: 'Smoke Test Suite',
  description: 'Critical path smoke tests',

  testCases: [
    { testCaseId: 'TC-001', order: 1, enabled: true },  // 登录
    { testCaseId: 'TC-005', order: 2, enabled: true },  // 浏览商品
    { testCaseId: 'TC-010', order: 3, enabled: true },  // 加入购物车
    {
      testCaseId: 'TC-015',
      order: 4,
      enabled: true,
      runCondition: '{{nodes.TC-010.output.cartTotal}} > 0'  // 条件执行
    },  // 结账
  ],

  config: {
    parallel: false,            // 顺序执行
    continueOnFailure: false,   // 失败即停止
    timeout: 600                // 10分钟
  },

  setupWorkflowId: 'WF-SETUP-TEST-ENV',
  teardownWorkflowId: 'WF-CLEANUP-TEST-ENV',

  schedule: {
    cron: '0 2 * * *',          // 每天凌晨2点
    timezone: 'UTC',
    enabled: true
  }
};
```

---

## 第七部分: 最终架构设计方案

### 7.1 系统架构全景图

```
┌─────────────────────────────────────────────────────────────────────┐
│                         用户层 (User Layer)                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │ 测试工程师    │  │   开发者      │  │  产品经理    │              │
│  │ Web UI       │  │ CLI / API     │  │ Dashboard    │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
│                                                                       │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      前端层 (Frontend Layer)                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  React + TypeScript                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │测试用例编辑器 │  │可视化编排器   │  │ 实时监控面板 │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │ 脚本库管理    │  │ 报告分析     │  │  AI 助手     │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
│                                                                       │
└───────────────────────────────┬─────────────────────────────────────┘
                                │ REST API + WebSocket
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     API网关层 (API Gateway)                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │   认证/鉴权   │  │   限流控制    │  │   路由转发   │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
│  ┌──────────────┐  ┌──────────────┐                                │
│  │ WebSocket网关 │  │   监控埋点    │                                │
│  └──────────────┘  └──────────────┘                                │
│                                                                       │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      服务层 (Service Layer)                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌───────────────────┐  ┌────────────────────┐                     │
│  │  测试管理服务       │  │   工作流引擎        │                     │
│  │  - TestCase CRUD   │  │  - DAG Executor    │                     │
│  │  - Folder Mgmt     │  │  - Action Registry │                     │
│  │  - Template        │  │  - Data Flow       │                     │
│  └───────────────────┘  └────────────────────┘                     │
│                                                                       │
│  ┌───────────────────┐  ┌────────────────────┐                     │
│  │   执行引擎          │  │    权限服务         │                     │
│  │  - HTTP Executor   │  │  - RBAC Engine     │                     │
│  │  - DB Executor     │  │  - Multi-tenancy   │                     │
│  │  - Browser Driver  │  │  - Audit Log       │                     │
│  └───────────────────┘  └────────────────────┘                     │
│                                                                       │
│  ┌───────────────────┐  ┌────────────────────┐                     │
│  │   脚本服务          │  │    AI 服务          │                     │
│  │  - Script Repo     │  │  - Gemini API      │                     │
│  │  - Version Ctrl    │  │  - Test Generation │                     │
│  │  - Execution       │  │  - Report Analysis │                     │
│  └───────────────────┘  └────────────────────┘                     │
│                                                                       │
│  ┌───────────────────┐  ┌────────────────────┐                     │
│  │  调度服务           │  │   通知服务          │                     │
│  │  - Cron Scheduler  │  │  - WebHook         │                     │
│  │  - Event Trigger   │  │  - Email/Slack     │                     │
│  └───────────────────┘  └────────────────────┘                     │
│                                                                       │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      数据层 (Data Layer)                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌───────────────────┐  ┌────────────────────┐                     │
│  │   PostgreSQL       │  │      Redis          │                     │
│  │  - Test Cases      │  │  - Session Cache   │                     │
│  │  - Workflows       │  │  - Execution Queue │                     │
│  │  - Scripts         │  │  - Lock Manager    │                     │
│  │  - Executions      │  │  - PubSub          │                     │
│  │  - Users/Roles     │  └────────────────────┘                     │
│  └───────────────────┘                                              │
│                                                                       │
│  ┌───────────────────┐  ┌────────────────────┐                     │
│  │  对象存储 (S3)      │  │   时序数据库        │                     │
│  │  - Screenshots     │  │  - Metrics         │                     │
│  │  - Videos          │  │  - Logs            │                     │
│  │  - Reports         │  │  - Performance     │                     │
│  └───────────────────┘  └────────────────────┘                     │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

---

### 7.2 核心模型定义 (最终版本)

```typescript
// ========== 测试用例模型 ==========
interface TestCase {
  // 标识
  id: string;
  testId: string;
  projectId: string;
  orgId: string;

  // 基础信息
  name: string;
  description: string;
  priority: 'P0' | 'P1' | 'P2' | 'P3';
  status: 'DRAFT' | 'ACTIVE' | 'DEPRECATED';
  tags: string[];

  // 组织
  folderId: string;

  // 测试步骤 (核心)
  steps: TestStep[];

  // 上下文
  variables: Record<string, any>;
  preconditions: string[];

  // 自动化策略
  automationStrategy: 'MANUAL' | 'PARTIAL' | 'FULL';

  // 模板相关
  templateId?: string;
  templateParams?: Record<string, any>;

  // 元数据
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

interface TestStep {
  id: string;
  summary: string;
  instruction: string;
  expectedResult: string;

  // 自动化绑定 (核心设计)
  automation?: {
    type: 'workflow' | 'script' | 'inline';

    // 工作流引用
    workflowId?: string;

    // 脚本引用
    scriptId?: string;

    // 内联配置
    inlineConfig?: NodeConfig;

    // 输入输出映射
    input?: Record<string, any>;
    outputMapping?: Record<string, string>;

    // 执行配置
    retry?: RetryConfig;
    timeout?: number;
  };

  // 控制流
  condition?: string;
  loopOver?: string;
  loopVar?: string;
}

// ========== 工作流模型 ==========
interface Workflow {
  id: string;
  workflowId: string;
  projectId: string;

  name: string;
  description: string;
  version: string;

  // 工作流定义 (核心)
  definition: WorkflowDefinition;

  // 接口定义
  inputSchema: ParameterSchema[];
  outputSchema: ParameterSchema[];

  // 元数据
  category: string;
  tags: string[];
  isTemplate: boolean;

  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

interface WorkflowDefinition {
  name: string;
  version: string;

  // 全局变量
  variables: Record<string, any>;

  // 节点定义 (Map结构 - 支持DAG)
  nodes: Record<string, WorkflowNode>;

  // 执行配置
  timeout?: number;
  concurrency?: number;
  onError?: 'abort' | 'continue';
}

interface WorkflowNode {
  id: string;
  name: string;
  type: NodeType;

  // DAG依赖 (后端优势)
  dependsOn?: string[];

  // 树形结构 (前端优势)
  children?: string[];
  elseChildren?: string[];

  // 条件和循环
  when?: string;
  loopOver?: string;
  loopVar?: string;

  // 重试
  retry?: RetryConfig;
  onError?: 'abort' | 'continue';

  // 节点配置
  config: NodeConfig;

  // 输入输出
  input?: Record<string, any>;
  output?: Record<string, string>;
  outputTransform?: Record<string, string>;
}

enum NodeType {
  // 测试类
  TEST_CASE = 'TEST_CASE',
  TEST_STEP = 'TEST_STEP',

  // 脚本类
  SCRIPT = 'SCRIPT',

  // 控制流
  LOOP = 'LOOP',
  CONDITION = 'CONDITION',
  CALL_WORKFLOW = 'CALL_WORKFLOW',

  // HTTP/API
  HTTP_REQUEST = 'HTTP_REQUEST',
  RPC_CALL = 'RPC_CALL',
  GRPC_CALL = 'GRPC_CALL',
  WEBSOCKET = 'WEBSOCKET',

  // 数据库
  DB_QUERY = 'DB_QUERY',
  REDIS_CMD = 'REDIS_CMD',
  ES_QUERY = 'ES_QUERY',

  // 消息队列
  KAFKA_PUB = 'KAFKA_PUB',

  // 系统
  SHELL_CMD = 'SHELL_CMD',
  BROWSER_ACTION = 'BROWSER_ACTION',

  // AI
  LLM_PROMPT = 'LLM_PROMPT',

  // 工具
  JSON_TRANSFORM = 'JSON_TRANSFORM',
  WAIT = 'WAIT',
  LOG = 'LOG',
  ASSERTION = 'ASSERTION'
}

// ========== 脚本模型 ==========
interface Script {
  id: string;
  scriptId: string;
  projectId: string;

  name: string;
  description: string;
  type: 'PYTHON' | 'JAVASCRIPT' | 'SHELL';
  content: string;

  // 接口定义
  parameters: ParameterDef[];
  outputs: ParameterDef[];

  // 测试示例
  testExamples: TestExample[];

  // 元数据
  category: string;
  tags: string[];
  isTemplate: boolean;

  // 版本
  version: string;
  changelog: string;

  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

// ========== 执行相关 ==========
interface TestRun {
  id: string;
  runId: string;
  projectId: string;

  // 执行来源
  testCaseId?: string;
  workflowRunId?: string;

  // 状态
  status: ExecutionStatus;

  // 时间
  startTime: string;
  endTime?: string;
  duration?: number;

  // 统计
  summary: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
  };

  // 数据
  logs: string[];
  error?: string;

  // 环境
  environmentId: string;

  // 执行人
  executedBy: string;

  createdAt: string;
}

interface WorkflowRun {
  id: string;
  runId: string;
  workflowId: string;
  projectId: string;

  status: ExecutionStatus;

  startTime: string;
  endTime?: string;
  duration?: number;

  // 步骤统计
  stepStats: {
    total: number;
    completed: number;
    failed: number;
  };

  // 执行上下文
  context: {
    variables: Record<string, any>;
    nodeOutputs: Record<string, any>;
  };

  error?: string;

  executedBy: string;
  createdAt: string;
}

interface WorkflowStepExecution {
  id: string;
  runId: string;
  nodeId: string;
  nodeName: string;

  status: ExecutionStatus;

  startTime?: string;
  endTime?: string;
  duration?: number;

  inputData?: any;
  outputData?: any;

  error?: string;

  createdAt: string;
}

enum ExecutionStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  PASSED = 'PASSED',
  FAILED = 'FAILED',
  BLOCKED = 'BLOCKED',
  SKIPPED = 'SKIPPED',
  CANCELLED = 'CANCELLED'
}
```

---

### 7.3 混合执行引擎设计

**核心创新**: DAG + 树形 混合执行模式

```typescript
class HybridWorkflowExecutor {
  // 执行工作流
  async execute(
    workflow: Workflow,
    context: ExecutionContext
  ): Promise<WorkflowResult> {
    const { nodes } = workflow.definition;

    // 1. 分析节点依赖关系
    const analysisResult = this.analyzeWorkflow(nodes);

    // 2. 根据依赖类型选择执行策略
    if (analysisResult.hasDAGDependencies && !analysisResult.hasTreeStructure) {
      // 纯DAG - 使用分层并行执行
      return this.executeDAG(nodes, context);
    } else if (!analysisResult.hasDAGDependencies && analysisResult.hasTreeStructure) {
      // 纯树形 - 使用递归执行
      return this.executeTree(nodes, context);
    } else {
      // 混合模式 - 智能执行
      return this.executeHybrid(nodes, context);
    }
  }

  // 分析工作流结构
  private analyzeWorkflow(nodes: Record<string, WorkflowNode>) {
    let hasDAGDependencies = false;
    let hasTreeStructure = false;

    for (const node of Object.values(nodes)) {
      if (node.dependsOn && node.dependsOn.length > 0) {
        hasDAGDependencies = true;
      }
      if (node.children && node.children.length > 0) {
        hasTreeStructure = true;
      }
    }

    return { hasDAGDependencies, hasTreeStructure };
  }

  // DAG执行 (Airflow风格 - 分层并行)
  private async executeDAG(
    nodes: Record<string, WorkflowNode>,
    context: ExecutionContext
  ): Promise<WorkflowResult> {
    // 1. 拓扑排序，分层
    const layers = this.topologicalSort(nodes);

    // 2. 逐层执行
    for (const layer of layers) {
      // 同一层的节点并行执行
      await Promise.all(
        layer.map(nodeId => this.executeNode(nodes[nodeId], context))
      );
    }

    return this.buildResult(context);
  }

  // 树形执行 (n8n风格 - 递归)
  private async executeTree(
    nodes: Record<string, WorkflowNode>,
    context: ExecutionContext
  ): Promise<WorkflowResult> {
    // 找到根节点 (没有父节点的节点)
    const rootNode = this.findRootNode(nodes);

    // 递归执行
    await this.executeNodeRecursive(rootNode, nodes, context);

    return this.buildResult(context);
  }

  // 混合执行
  private async executeHybrid(
    nodes: Record<string, WorkflowNode>,
    context: ExecutionContext
  ): Promise<WorkflowResult> {
    // 策略: 优先使用DAG依赖，遇到children时切换到递归

    const visited = new Set<string>();
    const layers = this.topologicalSort(nodes);

    for (const layer of layers) {
      await Promise.all(
        layer.map(async (nodeId) => {
          if (visited.has(nodeId)) return;

          const node = nodes[nodeId];

          // 执行节点
          await this.executeNode(node, context);
          visited.add(nodeId);

          // 如果有children，递归执行子树
          if (node.children && node.children.length > 0) {
            for (const childId of node.children) {
              await this.executeNodeRecursive(
                nodes[childId],
                nodes,
                context
              );
              visited.add(childId);
            }
          }

          // 如果有elseChildren，根据条件执行
          if (node.elseChildren && node.elseChildren.length > 0) {
            const condition = this.evaluateNodeResult(node, context);
            if (!condition) {
              for (const childId of node.elseChildren) {
                await this.executeNodeRecursive(
                  nodes[childId],
                  nodes,
                  context
                );
                visited.add(childId);
              }
            }
          }
        })
      );
    }

    return this.buildResult(context);
  }

  // 执行单个节点
  private async executeNode(
    node: WorkflowNode,
    context: ExecutionContext
  ): Promise<NodeOutput> {
    // 1. 检查条件
    if (node.when && !this.evaluateCondition(node.when, context)) {
      return { status: 'skipped', data: {} };
    }

    // 2. 处理循环
    if (node.loopOver) {
      return this.executeLoop(node, context);
    }

    // 3. 根据节点类型执行
    const action = this.actionRegistry.get(node.type);
    if (!action) {
      throw new Error(`Unknown node type: ${node.type}`);
    }

    // 4. 执行动作
    try {
      const result = await action.execute(node.config, context);

      // 5. 输出映射
      if (node.outputTransform) {
        result.data = this.transformOutput(result.data, node.outputTransform);
      }

      // 6. 保存输出到上下文
      context.nodeOutputs[node.id] = result;

      return result;
    } catch (error) {
      // 错误处理
      if (node.onError === 'continue') {
        return { status: 'failed', data: {}, error: error.message };
      } else {
        throw error;
      }
    }
  }

  // 拓扑排序 (Kahn算法)
  private topologicalSort(
    nodes: Record<string, WorkflowNode>
  ): string[][] {
    const inDegree: Record<string, number> = {};
    const graph: Record<string, string[]> = {};

    // 初始化
    for (const [id, node] of Object.entries(nodes)) {
      inDegree[id] = 0;
      graph[id] = [];
    }

    // 构建图
    for (const [id, node] of Object.entries(nodes)) {
      if (node.dependsOn) {
        for (const depId of node.dependsOn) {
          graph[depId].push(id);
          inDegree[id]++;
        }
      }
    }

    // 分层
    const layers: string[][] = [];
    const queue: string[] = [];

    // 找到入度为0的节点
    for (const [id, degree] of Object.entries(inDegree)) {
      if (degree === 0) {
        queue.push(id);
      }
    }

    while (queue.length > 0) {
      const currentLayer = [...queue];
      layers.push(currentLayer);
      queue.length = 0;

      for (const nodeId of currentLayer) {
        for (const nextId of graph[nodeId]) {
          inDegree[nextId]--;
          if (inDegree[nextId] === 0) {
            queue.push(nextId);
          }
        }
      }
    }

    return layers;
  }

  // 其他辅助方法...
  private findRootNode(nodes: Record<string, WorkflowNode>): WorkflowNode {
    // 实现略
    return Object.values(nodes)[0];
  }

  private async executeNodeRecursive(
    node: WorkflowNode,
    nodes: Record<string, WorkflowNode>,
    context: ExecutionContext
  ): Promise<void> {
    // 实现略
  }

  private executeLoop(
    node: WorkflowNode,
    context: ExecutionContext
  ): Promise<NodeOutput> {
    // 实现略
    return Promise.resolve({ status: 'success', data: {} });
  }

  private evaluateCondition(condition: string, context: ExecutionContext): boolean {
    // 实现略
    return true;
  }

  private evaluateNodeResult(node: WorkflowNode, context: ExecutionContext): boolean {
    // 实现略
    return true;
  }

  private transformOutput(data: any, transform: Record<string, string>): any {
    // 实现略
    return data;
  }

  private buildResult(context: ExecutionContext): WorkflowResult {
    // 实现略
    return { status: 'success', data: {} } as any;
  }
}
```

---

## 第八部分: 多分支与循环用例详细设计

### 8.1 多分支 (Conditional Branching) 详细用例

#### 8.1.1 基础IF-ELSE模式

**场景**: 根据用户类型执行不同的测试流程

```typescript
// 组合模型中的条件分支TestStep
const userTypeTestCase: TestCase = {
  id: 'TC-CONDITIONAL-001',
  name: '用户类型条件测试',
  description: '根据用户类型执行不同验证流程',

  variables: {
    userId: '{{envVars.testUserId}}',
    userType: null  // 运行时获取
  },

  steps: [
    // Step 1: 获取用户信息
    {
      id: 's1',
      instruction: '获取用户详细信息',
      expectedResult: '返回用户对象，包含type字段',
      automation: {
        type: 'inline',
        inlineConfig: {
          type: 'HTTP_REQUEST',
          config: {
            method: 'GET',
            url: '{{baseUrl}}/api/users/{{userId}}'
          }
        },
        outputMapping: {
          'body.user.type': 'userType',
          'body.user.id': 'userId',
          'body.user.permissions': 'userPermissions'
        }
      }
    },

    // Step 2: 条件分支 - Admin用户验证
    {
      id: 's2_admin',
      instruction: '【Admin】验证管理员权限',
      expectedResult: '能够访问管理员面板',
      condition: '{{userType}} === "admin"',  // 条件表达式
      automation: {
        type: 'workflow',
        workflowId: 'WF-ADMIN-VERIFICATION',
        input: {
          userId: '{{userId}}'
        }
      }
    },

    // Step 3: 条件分支 - Premium用户验证
    {
      id: 's2_premium',
      instruction: '【Premium】验证高级用户功能',
      expectedResult: '能够使用高级功能',
      condition: '{{userType}} === "premium"',
      automation: {
        type: 'workflow',
        workflowId: 'WF-PREMIUM-FEATURES',
        input: {
          userId: '{{userId}}'
        }
      }
    },

    // Step 4: 条件分支 - 普通用户验证
    {
      id: 's2_normal',
      instruction: '【Normal】验证普通用户基础功能',
      expectedResult: '能够使用基础功能',
      condition: '{{userType}} === "normal" || {{userType}} === "free"',
      automation: {
        type: 'script',
        scriptId: 'SCRIPT-BASIC-USER-TEST',
        input: {
          userId: '{{userId}}'
        }
      }
    },

    // Step 5: 通用验证 (无条件，所有分支都执行)
    {
      id: 's3',
      instruction: '验证通用用户功能',
      expectedResult: '所有用户都能使用基础功能',
      automation: {
        type: 'inline',
        inlineConfig: {
          type: 'HTTP_REQUEST',
          config: {
            method: 'GET',
            url: '{{baseUrl}}/api/users/{{userId}}/profile'
          }
        }
      }
    }
  ],

  automationStrategy: 'FULL'
};
```

#### 8.1.2 多路分支 (Switch-Case) 模式

**场景**: 支付方式多路分支测试

```typescript
// 工作流定义 - 支付方式Switch
const paymentSwitchWorkflow: WorkflowDefinition = {
  name: 'Payment Method Switch Test',
  version: '1.0.0',

  variables: {
    orderId: '',
    paymentMethod: '',  // credit_card | paypal | apple_pay | bank_transfer
    amount: 0
  },

  nodes: {
    // 入口节点 - 获取订单信息
    'getOrder': {
      id: 'getOrder',
      name: '获取订单信息',
      type: 'HTTP_REQUEST',
      config: {
        method: 'GET',
        url: '{{baseUrl}}/api/orders/{{orderId}}'
      },
      output: {
        'body.order.paymentMethod': 'paymentMethod',
        'body.order.amount': 'amount'
      }
    },

    // Switch节点 - 根据支付方式分发
    'paymentSwitch': {
      id: 'paymentSwitch',
      name: '支付方式路由',
      type: 'CONDITION',
      dependsOn: ['getOrder'],
      config: {
        // Switch表达式
        switchOn: '{{paymentMethod}}',
        cases: {
          'credit_card': 'processCreditCard',
          'paypal': 'processPaypal',
          'apple_pay': 'processApplePay',
          'bank_transfer': 'processBankTransfer'
        },
        default: 'processUnknown'
      },
      // 子节点引用 (树形结构)
      children: ['processCreditCard', 'processPaypal', 'processApplePay', 'processBankTransfer'],
      elseChildren: ['processUnknown']
    },

    // Case 1: 信用卡支付
    'processCreditCard': {
      id: 'processCreditCard',
      name: '处理信用卡支付',
      type: 'HTTP_REQUEST',
      when: '{{paymentMethod}} === "credit_card"',
      config: {
        method: 'POST',
        url: '{{baseUrl}}/api/payments/credit-card',
        body: {
          orderId: '{{orderId}}',
          amount: '{{amount}}'
        }
      },
      // 信用卡特有验证
      children: ['verifyCreditCardTransaction']
    },

    // Case 2: PayPal支付
    'processPaypal': {
      id: 'processPaypal',
      name: '处理PayPal支付',
      type: 'HTTP_REQUEST',
      when: '{{paymentMethod}} === "paypal"',
      config: {
        method: 'POST',
        url: '{{baseUrl}}/api/payments/paypal',
        body: {
          orderId: '{{orderId}}',
          returnUrl: '{{baseUrl}}/payment/success',
          cancelUrl: '{{baseUrl}}/payment/cancel'
        }
      },
      children: ['waitForPaypalRedirect']
    },

    // Case 3: Apple Pay支付
    'processApplePay': {
      id: 'processApplePay',
      name: '处理Apple Pay支付',
      type: 'HTTP_REQUEST',
      when: '{{paymentMethod}} === "apple_pay"',
      config: {
        method: 'POST',
        url: '{{baseUrl}}/api/payments/apple-pay',
        body: {
          orderId: '{{orderId}}',
          merchantIdentifier: '{{appleMerchantId}}'
        }
      }
    },

    // Case 4: 银行转账
    'processBankTransfer': {
      id: 'processBankTransfer',
      name: '处理银行转账',
      type: 'HTTP_REQUEST',
      when: '{{paymentMethod}} === "bank_transfer"',
      config: {
        method: 'POST',
        url: '{{baseUrl}}/api/payments/bank-transfer',
        body: {
          orderId: '{{orderId}}',
          bankCode: '{{bankCode}}'
        }
      },
      // 银行转账需要等待确认
      children: ['waitForBankConfirmation']
    },

    // Default: 未知支付方式
    'processUnknown': {
      id: 'processUnknown',
      name: '处理未知支付方式',
      type: 'ASSERTION',
      config: {
        assertions: [
          {
            type: 'fail',
            message: '不支持的支付方式: {{paymentMethod}}'
          }
        ]
      }
    },

    // 信用卡验证子流程
    'verifyCreditCardTransaction': {
      id: 'verifyCreditCardTransaction',
      name: '验证信用卡交易',
      type: 'HTTP_REQUEST',
      config: {
        method: 'GET',
        url: '{{baseUrl}}/api/payments/verify/{{nodes.processCreditCard.output.transactionId}}'
      }
    },

    // PayPal重定向等待
    'waitForPaypalRedirect': {
      id: 'waitForPaypalRedirect',
      name: '等待PayPal回调',
      type: 'WAIT',
      config: {
        type: 'webhook',
        webhookPath: '/payment/paypal/callback',
        timeout: 120000  // 2分钟
      }
    },

    // 银行确认等待
    'waitForBankConfirmation': {
      id: 'waitForBankConfirmation',
      name: '等待银行确认',
      type: 'WAIT',
      config: {
        type: 'polling',
        url: '{{baseUrl}}/api/payments/bank-transfer/{{orderId}}/status',
        condition: 'response.status === "confirmed"',
        interval: 5000,
        timeout: 300000  // 5分钟
      }
    },

    // 最终验证 (所有分支汇聚)
    'finalVerification': {
      id: 'finalVerification',
      name: '验证订单状态更新',
      type: 'HTTP_REQUEST',
      dependsOn: ['processCreditCard', 'processPaypal', 'processApplePay', 'processBankTransfer'],
      config: {
        method: 'GET',
        url: '{{baseUrl}}/api/orders/{{orderId}}'
      }
    }
  }
};
```

#### 8.1.3 嵌套条件 (Nested Conditions) 模式

**场景**: 订单处理中的多层嵌套条件判断

```typescript
// TestStep中的嵌套条件
const nestedConditionTestCase: TestCase = {
  id: 'TC-NESTED-CONDITION-001',
  name: '订单处理嵌套条件测试',
  description: '测试订单金额和用户等级的嵌套条件处理',

  variables: {
    orderAmount: 0,
    userLevel: '',
    discountRate: 0,
    requiresApproval: false
  },

  steps: [
    // Step 1: 获取订单和用户信息
    {
      id: 's1',
      instruction: '获取订单和用户信息',
      expectedResult: '获取到订单金额和用户等级',
      automation: {
        type: 'inline',
        inlineConfig: {
          type: 'HTTP_REQUEST',
          config: {
            method: 'GET',
            url: '{{baseUrl}}/api/orders/{{orderId}}/details'
          }
        },
        outputMapping: {
          'body.order.amount': 'orderAmount',
          'body.user.level': 'userLevel'
        }
      }
    },

    // Step 2: 第一层条件 - 高金额订单 (>10000)
    {
      id: 's2_high_amount',
      instruction: '【高金额订单】处理大额订单流程',
      expectedResult: '进入大额订单审批流程',
      condition: '{{orderAmount}} > 10000',
      automation: {
        type: 'workflow',
        workflowId: 'WF-HIGH-VALUE-ORDER',
        input: {
          orderId: '{{orderId}}',
          amount: '{{orderAmount}}'
        },
        outputMapping: {
          'requiresApproval': 'requiresApproval'
        }
      }
    },

    // Step 2a: 嵌套条件 - 高金额 + VIP用户
    {
      id: 's2a_vip_high',
      instruction: '【高金额+VIP】VIP用户大额订单特殊处理',
      expectedResult: '自动审批通过，享受VIP折扣',
      // 嵌套条件: 金额>10000 AND 用户是VIP
      condition: '{{orderAmount}} > 10000 && {{userLevel}} === "vip"',
      automation: {
        type: 'inline',
        inlineConfig: {
          type: 'HTTP_REQUEST',
          config: {
            method: 'POST',
            url: '{{baseUrl}}/api/orders/{{orderId}}/vip-auto-approve',
            body: {
              discountRate: 0.15  // VIP 15%折扣
            }
          }
        },
        outputMapping: {
          'body.discountRate': 'discountRate'
        }
      }
    },

    // Step 2b: 嵌套条件 - 高金额 + 普通用户
    {
      id: 's2b_normal_high',
      instruction: '【高金额+普通用户】需要人工审批',
      expectedResult: '订单进入审批队列',
      condition: '{{orderAmount}} > 10000 && {{userLevel}} !== "vip"',
      automation: {
        type: 'inline',
        inlineConfig: {
          type: 'HTTP_REQUEST',
          config: {
            method: 'POST',
            url: '{{baseUrl}}/api/orders/{{orderId}}/request-approval'
          }
        }
      }
    },

    // Step 3: 第一层条件 - 中等金额订单 (1000-10000)
    {
      id: 's3_medium_amount',
      instruction: '【中等金额订单】处理中等金额订单',
      expectedResult: '正常处理流程',
      condition: '{{orderAmount}} >= 1000 && {{orderAmount}} <= 10000',
      automation: {
        type: 'workflow',
        workflowId: 'WF-STANDARD-ORDER'
      }
    },

    // Step 3a: 嵌套 - 中等金额 + 新用户首单
    {
      id: 's3a_medium_newuser',
      instruction: '【中等金额+新用户首单】新用户首单优惠',
      expectedResult: '应用新用户折扣',
      condition: '{{orderAmount}} >= 1000 && {{orderAmount}} <= 10000 && {{userLevel}} === "new" && {{isFirstOrder}}',
      automation: {
        type: 'script',
        scriptId: 'SCRIPT-NEW-USER-DISCOUNT',
        input: {
          orderId: '{{orderId}}',
          discountRate: 0.20  // 新用户首单20%折扣
        }
      }
    },

    // Step 4: 第一层条件 - 小金额订单 (<1000)
    {
      id: 's4_low_amount',
      instruction: '【小金额订单】快速处理小额订单',
      expectedResult: '快速通道处理',
      condition: '{{orderAmount}} < 1000',
      automation: {
        type: 'inline',
        inlineConfig: {
          type: 'HTTP_REQUEST',
          config: {
            method: 'POST',
            url: '{{baseUrl}}/api/orders/{{orderId}}/quick-process'
          }
        }
      }
    },

    // Step 5: 通用验证 (所有分支后执行)
    {
      id: 's5',
      instruction: '验证订单最终状态',
      expectedResult: '订单状态正确更新',
      automation: {
        type: 'inline',
        inlineConfig: {
          type: 'ASSERTION',
          config: {
            assertions: [
              {
                field: '{{orderStatus}}',
                operator: 'in',
                value: ['approved', 'pending_approval', 'processing'],
                message: '订单状态应为有效状态'
              }
            ]
          }
        }
      }
    }
  ]
};
```

#### 8.1.4 条件表达式语法参考

```typescript
// 条件表达式语法定义
interface ConditionExpressionSyntax {
  // 1. 简单比较
  simpleComparison: {
    equals: '{{variable}} === "value"',
    notEquals: '{{variable}} !== "value"',
    greaterThan: '{{variable}} > 100',
    lessThan: '{{variable}} < 100',
    greaterOrEqual: '{{variable}} >= 100',
    lessOrEqual: '{{variable}} <= 100'
  };

  // 2. 逻辑运算
  logicalOperators: {
    and: '{{condA}} && {{condB}}',
    or: '{{condA}} || {{condB}}',
    not: '!{{condition}}',
    combined: '({{a}} && {{b}}) || {{c}}'
  };

  // 3. 类型检查
  typeChecks: {
    isNull: '{{variable}} === null',
    isNotNull: '{{variable}} !== null',
    isUndefined: '{{variable}} === undefined',
    isEmpty: '{{variable}} === "" || {{variable}}.length === 0',
    isArray: 'Array.isArray({{variable}})',
    isNumber: 'typeof {{variable}} === "number"'
  };

  // 4. 数组操作
  arrayOperations: {
    includes: '{{array}}.includes("value")',
    hasLength: '{{array}}.length > 0',
    isEmpty: '{{array}}.length === 0',
    inArray: '["a", "b", "c"].includes({{variable}})'
  };

  // 5. 字符串操作
  stringOperations: {
    startsWith: '{{variable}}.startsWith("prefix")',
    endsWith: '{{variable}}.endsWith("suffix")',
    contains: '{{variable}}.includes("substring")',
    matches: '/regex/.test({{variable}})'
  };

  // 6. 节点输出引用
  nodeOutputReference: {
    previousNode: '{{$prev.status}} === "success"',
    specificNode: '{{nodes.nodeId.output.field}} > 100',
    nestedField: '{{nodes.api.output.user.role}} === "admin"'
  };

  // 7. 内置函数
  builtinFunctions: {
    now: '{{$now()}} > {{deadline}}',
    isEmpty: '{{$isEmpty(variable)}}',
    isNotEmpty: '{{$isNotEmpty(variable)}}',
    length: '{{$length(array)}} > 5'
  };
}
```

---

### 8.2 循环 (Loop) 详细用例

#### 8.2.1 基础数组循环 (ForEach)

**场景**: 批量测试多个产品

```typescript
const productBatchTestCase: TestCase = {
  id: 'TC-LOOP-001',
  name: '产品批量测试',
  description: '循环测试多个产品的基础功能',

  variables: {
    productIds: ['PROD-001', 'PROD-002', 'PROD-003', 'PROD-004', 'PROD-005'],
    testResults: []
  },

  steps: [
    // Step 1: 获取产品列表
    {
      id: 's1',
      instruction: '获取待测试产品列表',
      expectedResult: '返回产品ID数组',
      automation: {
        type: 'inline',
        inlineConfig: {
          type: 'HTTP_REQUEST',
          config: {
            method: 'GET',
            url: '{{baseUrl}}/api/products?category=electronics&limit=10'
          }
        },
        outputMapping: {
          'body.products[*].id': 'productIds'
        }
      }
    },

    // Step 2: 循环测试每个产品
    {
      id: 's2_loop',
      instruction: '循环测试每个产品',
      expectedResult: '每个产品都通过基础测试',

      // 循环配置
      loopOver: '{{productIds}}',  // 要遍历的数组
      loopVar: 'currentProductId', // 循环变量名

      automation: {
        type: 'workflow',
        workflowId: 'WF-PRODUCT-TEST',
        input: {
          productId: '{{currentProductId}}',
          iteration: '{{$loopIndex}}'  // 内置循环索引
        },
        outputMapping: {
          'result': 'testResults[{{$loopIndex}}]'  // 结果追加到数组
        }
      }
    },

    // Step 3: 汇总测试结果
    {
      id: 's3',
      instruction: '汇总所有产品测试结果',
      expectedResult: '生成汇总报告',
      automation: {
        type: 'script',
        scriptId: 'SCRIPT-AGGREGATE-RESULTS',
        input: {
          results: '{{testResults}}'
        }
      }
    }
  ]
};
```

#### 8.2.2 工作流中的循环节点

```typescript
// 工作流定义 - 包含循环节点
const loopWorkflowDefinition: WorkflowDefinition = {
  name: 'User Permission Batch Test',
  version: '1.0.0',

  variables: {
    users: [],
    permissions: ['read', 'write', 'delete', 'admin'],
    testResults: []
  },

  nodes: {
    // 获取用户列表
    'fetchUsers': {
      id: 'fetchUsers',
      name: '获取用户列表',
      type: 'HTTP_REQUEST',
      config: {
        method: 'GET',
        url: '{{baseUrl}}/api/users?status=active'
      },
      output: {
        'body.users': 'users'
      }
    },

    // 循环节点 - 遍历用户
    'userLoop': {
      id: 'userLoop',
      name: '遍历用户',
      type: 'LOOP',
      dependsOn: ['fetchUsers'],
      config: {
        // 循环配置
        loopType: 'forEach',
        collection: '{{users}}',
        itemVar: 'currentUser',
        indexVar: 'userIndex',

        // 并行控制
        parallel: true,
        maxConcurrency: 5
      },
      // 循环体中的子节点
      children: ['testUserPermissions']
    },

    // 循环体 - 测试用户权限
    'testUserPermissions': {
      id: 'testUserPermissions',
      name: '测试用户权限',
      type: 'CALL_WORKFLOW',
      config: {
        workflowId: 'WF-PERMISSION-TEST',
        input: {
          userId: '{{currentUser.id}}',
          userName: '{{currentUser.name}}',
          expectedPermissions: '{{currentUser.permissions}}'
        }
      },
      output: {
        'result': 'testResults[{{userIndex}}]'
      },
      // 嵌套循环 - 遍历权限
      children: ['permissionLoop']
    },

    // 嵌套循环 - 遍历权限
    'permissionLoop': {
      id: 'permissionLoop',
      name: '遍历权限',
      type: 'LOOP',
      config: {
        loopType: 'forEach',
        collection: '{{permissions}}',
        itemVar: 'currentPermission',
        indexVar: 'permIndex',
        parallel: false  // 顺序执行
      },
      children: ['verifyPermission']
    },

    // 验证单个权限
    'verifyPermission': {
      id: 'verifyPermission',
      name: '验证权限',
      type: 'HTTP_REQUEST',
      config: {
        method: 'GET',
        url: '{{baseUrl}}/api/users/{{currentUser.id}}/permissions/{{currentPermission}}'
      }
    },

    // 汇总结果
    'aggregateResults': {
      id: 'aggregateResults',
      name: '汇总测试结果',
      type: 'SCRIPT',
      dependsOn: ['userLoop'],  // 等待所有循环完成
      config: {
        scriptId: 'SCRIPT-AGGREGATE',
        input: {
          results: '{{testResults}}'
        }
      }
    }
  }
};
```

#### 8.2.3 动态循环次数 (While Loop)

**场景**: 分页获取数据直到没有更多数据

```typescript
const paginationTestCase: TestCase = {
  id: 'TC-PAGINATION-001',
  name: '分页数据完整性测试',
  description: '循环获取分页数据直到所有页面',

  variables: {
    currentPage: 1,
    pageSize: 20,
    hasMore: true,
    allItems: [],
    maxPages: 100  // 安全限制
  },

  steps: [
    // Step 1: While循环获取分页数据
    {
      id: 's1_pagination_loop',
      instruction: '循环获取所有分页数据',
      expectedResult: '获取所有页面数据',

      // While循环配置
      loopOver: null,  // 不是forEach
      loopCondition: '{{hasMore}} && {{currentPage}} <= {{maxPages}}',  // 循环条件

      automation: {
        type: 'inline',
        inlineConfig: {
          type: 'HTTP_REQUEST',
          config: {
            method: 'GET',
            url: '{{baseUrl}}/api/items?page={{currentPage}}&size={{pageSize}}'
          }
        },
        outputMapping: {
          // 追加数据到数组
          'body.items': 'allItems.concat($prev)',
          // 更新循环条件
          'body.hasMore': 'hasMore',
          // 更新页码
          '{{currentPage}} + 1': 'currentPage'
        }
      }
    },

    // Step 2: 验证数据完整性
    {
      id: 's2',
      instruction: '验证获取的数据总数',
      expectedResult: '总数与API返回的total一致',
      automation: {
        type: 'inline',
        inlineConfig: {
          type: 'ASSERTION',
          config: {
            assertions: [
              {
                field: '{{allItems}}.length',
                operator: '>',
                value: 0,
                message: '应该获取到数据'
              }
            ]
          }
        }
      }
    }
  ]
};
```

#### 8.2.4 带条件退出的循环

**场景**: 重试机制 - 循环直到成功或达到最大次数

```typescript
const retryLoopWorkflow: WorkflowDefinition = {
  name: 'Retry Until Success',
  version: '1.0.0',

  variables: {
    attempt: 0,
    maxAttempts: 5,
    success: false,
    lastError: null
  },

  nodes: {
    // 重试循环节点
    'retryLoop': {
      id: 'retryLoop',
      name: '重试循环',
      type: 'LOOP',
      config: {
        // While模式循环
        loopType: 'while',
        condition: '!{{success}} && {{attempt}} < {{maxAttempts}}',

        // 重试配置
        delayBetweenIterations: 2000,  // 2秒间隔
        exponentialBackoff: true,       // 指数退避
        maxDelay: 30000                 // 最大30秒
      },
      children: ['attemptOperation', 'checkResult']
    },

    // 尝试操作
    'attemptOperation': {
      id: 'attemptOperation',
      name: '尝试操作',
      type: 'HTTP_REQUEST',
      config: {
        method: 'POST',
        url: '{{baseUrl}}/api/unstable-operation',
        timeout: 5000
      },
      onError: 'continue',  // 失败时继续
      output: {
        'status': 'operationStatus',
        '$error': 'lastError'
      }
    },

    // 检查结果
    'checkResult': {
      id: 'checkResult',
      name: '检查操作结果',
      type: 'SCRIPT',
      config: {
        inline: `
          const status = context.vars.operationStatus;
          const error = context.vars.lastError;

          context.vars.attempt++;

          if (status === 200 && !error) {
            context.vars.success = true;
          } else {
            console.log(\`Attempt \${context.vars.attempt} failed: \${error}\`);
          }

          return {
            success: context.vars.success,
            attempt: context.vars.attempt
          };
        `
      }
    },

    // 循环后检查
    'finalCheck': {
      id: 'finalCheck',
      name: '最终检查',
      type: 'CONDITION',
      dependsOn: ['retryLoop'],
      when: '{{success}}',
      children: ['successHandler'],
      elseChildren: ['failureHandler']
    },

    // 成功处理
    'successHandler': {
      id: 'successHandler',
      name: '操作成功',
      type: 'LOG',
      config: {
        level: 'info',
        message: '操作在第{{attempt}}次尝试后成功'
      }
    },

    // 失败处理
    'failureHandler': {
      id: 'failureHandler',
      name: '操作失败',
      type: 'ASSERTION',
      config: {
        assertions: [
          {
            type: 'fail',
            message: '操作在{{maxAttempts}}次尝试后仍然失败: {{lastError}}'
          }
        ]
      }
    }
  }
};
```

#### 8.2.5 循环与条件组合 - 数据驱动测试

**场景**: 使用测试数据表驱动测试，包含条件跳过

```typescript
const dataDriverTestCase: TestCase = {
  id: 'TC-DATA-DRIVEN-001',
  name: '数据驱动登录测试',
  description: '使用多组测试数据测试登录功能',

  variables: {
    testData: [
      { username: 'valid_user', password: 'valid_pass', expectedResult: 'success', skipIf: null },
      { username: 'invalid_user', password: 'wrong_pass', expectedResult: 'failure', skipIf: null },
      { username: '', password: 'any_pass', expectedResult: 'validation_error', skipIf: null },
      { username: 'admin', password: 'admin123', expectedResult: 'success', skipIf: '{{env}} === "production"' },
      { username: 'blocked_user', password: 'any', expectedResult: 'blocked', skipIf: '{{skipBlockedTests}}' }
    ],
    results: []
  },

  steps: [
    // Step 1: 数据驱动循环
    {
      id: 's1_data_loop',
      instruction: '遍历测试数据执行登录测试',
      expectedResult: '每组数据都得到预期结果',

      loopOver: '{{testData}}',
      loopVar: 'currentData',

      automation: {
        type: 'workflow',
        workflowId: 'WF-LOGIN-TEST-ITERATION',
        input: {
          username: '{{currentData.username}}',
          password: '{{currentData.password}}',
          expectedResult: '{{currentData.expectedResult}}',
          iterationIndex: '{{$loopIndex}}'
        }
      }
    }
  ]
};

// 登录测试迭代工作流
const loginTestIterationWorkflow: WorkflowDefinition = {
  name: 'Login Test Iteration',
  version: '1.0.0',

  variables: {
    username: '',
    password: '',
    expectedResult: '',
    actualResult: '',
    iterationIndex: 0
  },

  nodes: {
    // 条件跳过检查
    'checkSkipCondition': {
      id: 'checkSkipCondition',
      name: '检查是否跳过',
      type: 'CONDITION',
      config: {
        condition: '{{skipIf}} !== null && {{skipIf}}'
      },
      children: ['skipTest'],
      elseChildren: ['performLogin']
    },

    // 跳过测试
    'skipTest': {
      id: 'skipTest',
      name: '跳过此测试',
      type: 'LOG',
      config: {
        level: 'info',
        message: '跳过测试 #{{iterationIndex}}: {{skipIf}}'
      }
    },

    // 执行登录
    'performLogin': {
      id: 'performLogin',
      name: '执行登录',
      type: 'HTTP_REQUEST',
      config: {
        method: 'POST',
        url: '{{baseUrl}}/api/auth/login',
        body: {
          username: '{{username}}',
          password: '{{password}}'
        }
      },
      onError: 'continue',
      output: {
        'status': 'httpStatus',
        'body.result': 'actualResult'
      },
      children: ['verifyResult']
    },

    // 验证结果
    'verifyResult': {
      id: 'verifyResult',
      name: '验证结果',
      type: 'ASSERTION',
      config: {
        assertions: [
          {
            field: '{{actualResult}}',
            operator: '===',
            value: '{{expectedResult}}',
            message: '测试 #{{iterationIndex}}: 期望{{expectedResult}}, 实际{{actualResult}}'
          }
        ]
      }
    }
  }
};
```

#### 8.2.6 循环语法参考

```typescript
// 循环配置语法定义
interface LoopConfigurationSyntax {
  // 1. ForEach循环 (遍历数组)
  forEachLoop: {
    // TestStep中的配置
    testStep: {
      loopOver: '{{arrayVariable}}',    // 要遍历的数组
      loopVar: 'item',                   // 当前元素变量名
      loopIndexVar: '$loopIndex'         // 索引变量名 (可选)
    };

    // WorkflowNode中的配置
    workflowNode: {
      type: 'LOOP',
      config: {
        loopType: 'forEach',
        collection: '{{arrayVariable}}',
        itemVar: 'item',
        indexVar: 'index',
        parallel: false,                  // 是否并行执行
        maxConcurrency: 5                 // 最大并行数
      }
    };
  };

  // 2. While循环 (条件循环)
  whileLoop: {
    testStep: {
      loopCondition: '{{count}} < {{maxCount}}',
      maxIterations: 100                 // 安全限制
    };

    workflowNode: {
      type: 'LOOP',
      config: {
        loopType: 'while',
        condition: '{{condition}}',
        maxIterations: 100,
        delayBetweenIterations: 1000     // 循环间隔(ms)
      }
    };
  };

  // 3. 计数循环 (Fixed iterations)
  countLoop: {
    type: 'LOOP',
    config: {
      loopType: 'count',
      count: 10,                          // 固定循环10次
      // 或动态计数
      countExpression: '{{items.length}}',
      indexVar: 'i'
    }
  };

  // 4. 循环控制
  loopControl: {
    // 提前退出
    breakCondition: '{{foundTarget}} === true',

    // 跳过当前迭代
    continueCondition: '{{item.skip}} === true',

    // 重试配置
    retryOnError: true,
    retryCount: 3,
    retryDelay: 1000
  };

  // 5. 循环内置变量
  builtinVariables: {
    '$loopIndex': 'number',              // 当前索引 (0-based)
    '$loopCount': 'number',              // 当前迭代次数 (1-based)
    '$loopTotal': 'number',              // 总迭代次数
    '$loopFirst': 'boolean',             // 是否第一次迭代
    '$loopLast': 'boolean',              // 是否最后一次迭代
    '$loopItem': 'any'                   // 当前元素
  };

  // 6. 结果聚合
  resultAggregation: {
    // 收集所有迭代的结果
    collectResults: true,
    resultVar: 'loopResults',

    // 聚合函数
    aggregation: {
      sum: '{{$sum(loopResults, "value")}}',
      avg: '{{$avg(loopResults, "value")}}',
      count: '{{$count(loopResults)}}',
      filter: '{{$filter(loopResults, item => item.status === "success")}}'
    }
  };
}
```

---

### 8.3 多分支与循环组合模式

#### 8.3.1 循环中的条件分支

**场景**: 批量处理订单，根据订单类型执行不同操作

```typescript
const orderBatchProcessWorkflow: WorkflowDefinition = {
  name: 'Order Batch Process with Conditions',
  version: '1.0.0',

  variables: {
    orders: [],
    processedOrders: [],
    skippedOrders: [],
    errorOrders: []
  },

  nodes: {
    // 获取待处理订单
    'fetchOrders': {
      id: 'fetchOrders',
      name: '获取待处理订单',
      type: 'HTTP_REQUEST',
      config: {
        method: 'GET',
        url: '{{baseUrl}}/api/orders?status=pending'
      },
      output: {
        'body.orders': 'orders'
      }
    },

    // 订单处理循环
    'orderLoop': {
      id: 'orderLoop',
      name: '遍历订单',
      type: 'LOOP',
      dependsOn: ['fetchOrders'],
      config: {
        loopType: 'forEach',
        collection: '{{orders}}',
        itemVar: 'order',
        indexVar: 'orderIndex',
        parallel: true,
        maxConcurrency: 10
      },
      children: ['classifyOrder']
    },

    // 订单分类 (条件节点)
    'classifyOrder': {
      id: 'classifyOrder',
      name: '订单分类',
      type: 'CONDITION',
      config: {
        // 多路分支
        switchOn: '{{order.type}}',
        cases: {
          'standard': 'processStandard',
          'express': 'processExpress',
          'international': 'processInternational',
          'subscription': 'processSubscription'
        },
        default: 'handleUnknownType'
      }
    },

    // 标准订单处理
    'processStandard': {
      id: 'processStandard',
      name: '处理标准订单',
      type: 'CALL_WORKFLOW',
      when: '{{order.type}} === "standard"',
      config: {
        workflowId: 'WF-STANDARD-ORDER',
        input: {
          orderId: '{{order.id}}'
        }
      },
      // 标准订单内部也有条件
      children: ['checkStandardAmount']
    },

    // 标准订单金额检查 (嵌套条件)
    'checkStandardAmount': {
      id: 'checkStandardAmount',
      name: '检查订单金额',
      type: 'CONDITION',
      config: {
        conditions: [
          {
            when: '{{order.amount}} > 5000',
            then: 'requireApproval'
          },
          {
            when: '{{order.amount}} > 1000',
            then: 'standardProcessing'
          }
        ],
        else: 'quickProcessing'
      }
    },

    // 加急订单处理
    'processExpress': {
      id: 'processExpress',
      name: '处理加急订单',
      type: 'CALL_WORKFLOW',
      when: '{{order.type}} === "express"',
      config: {
        workflowId: 'WF-EXPRESS-ORDER',
        input: {
          orderId: '{{order.id}}',
          priority: 'high'
        }
      }
    },

    // 国际订单处理
    'processInternational': {
      id: 'processInternational',
      name: '处理国际订单',
      type: 'CALL_WORKFLOW',
      when: '{{order.type}} === "international"',
      config: {
        workflowId: 'WF-INTERNATIONAL-ORDER'
      },
      // 国际订单需要额外循环处理清关文件
      children: ['customsDocLoop']
    },

    // 清关文件循环
    'customsDocLoop': {
      id: 'customsDocLoop',
      name: '处理清关文件',
      type: 'LOOP',
      config: {
        loopType: 'forEach',
        collection: '{{order.customsDocuments}}',
        itemVar: 'doc',
        parallel: false
      },
      children: ['uploadCustomsDoc']
    },

    'uploadCustomsDoc': {
      id: 'uploadCustomsDoc',
      name: '上传清关文件',
      type: 'HTTP_REQUEST',
      config: {
        method: 'POST',
        url: '{{baseUrl}}/api/customs/documents',
        body: {
          orderId: '{{order.id}}',
          documentType: '{{doc.type}}',
          content: '{{doc.content}}'
        }
      }
    },

    // 订阅订单处理
    'processSubscription': {
      id: 'processSubscription',
      name: '处理订阅订单',
      type: 'CALL_WORKFLOW',
      when: '{{order.type}} === "subscription"',
      config: {
        workflowId: 'WF-SUBSCRIPTION-ORDER'
      }
    },

    // 未知类型处理
    'handleUnknownType': {
      id: 'handleUnknownType',
      name: '处理未知订单类型',
      type: 'LOG',
      config: {
        level: 'warn',
        message: '未知订单类型: {{order.type}}, 订单ID: {{order.id}}'
      }
    },

    // 汇总结果
    'summarize': {
      id: 'summarize',
      name: '汇总处理结果',
      type: 'SCRIPT',
      dependsOn: ['orderLoop'],
      config: {
        inline: `
          const results = {
            total: vars.orders.length,
            processed: vars.processedOrders.length,
            skipped: vars.skippedOrders.length,
            errors: vars.errorOrders.length
          };
          return results;
        `
      }
    }
  }
};
```

#### 8.3.2 条件决定循环

**场景**: 根据条件决定是否需要循环重试

```typescript
const conditionalRetryTestCase: TestCase = {
  id: 'TC-CONDITIONAL-RETRY-001',
  name: '条件重试测试',
  description: '根据错误类型决定是否重试',

  variables: {
    result: null,
    errorType: null,
    retryCount: 0,
    maxRetries: 3
  },

  steps: [
    // Step 1: 首次尝试
    {
      id: 's1_initial_attempt',
      instruction: '首次尝试操作',
      expectedResult: '成功或返回错误类型',
      automation: {
        type: 'inline',
        inlineConfig: {
          type: 'HTTP_REQUEST',
          config: {
            method: 'POST',
            url: '{{baseUrl}}/api/flaky-operation'
          }
        },
        outputMapping: {
          'body.result': 'result',
          'body.errorType': 'errorType'
        }
      }
    },

    // Step 2: 条件判断 - 是否需要重试
    {
      id: 's2_check_retry',
      instruction: '检查是否需要重试',
      expectedResult: '确定重试策略',

      // 只有特定错误类型才重试
      condition: '{{result}} === null && ["timeout", "connection_reset", "rate_limit"].includes({{errorType}})',

      // 进入重试循环
      automation: {
        type: 'workflow',
        workflowId: 'WF-RETRY-LOOP',
        input: {
          maxRetries: '{{maxRetries}}',
          errorType: '{{errorType}}'
        }
      }
    },

    // Step 3: 不可重试的错误直接失败
    {
      id: 's3_non_retryable',
      instruction: '处理不可重试错误',
      expectedResult: '记录错误并失败',
      condition: '{{result}} === null && !["timeout", "connection_reset", "rate_limit"].includes({{errorType}})',
      automation: {
        type: 'inline',
        inlineConfig: {
          type: 'ASSERTION',
          config: {
            assertions: [
              {
                type: 'fail',
                message: '不可重试的错误: {{errorType}}'
              }
            ]
          }
        }
      }
    },

    // Step 4: 成功路径
    {
      id: 's4_success',
      instruction: '验证操作成功',
      expectedResult: '操作完成',
      condition: '{{result}} !== null',
      automation: {
        type: 'inline',
        inlineConfig: {
          type: 'ASSERTION',
          config: {
            assertions: [
              {
                field: '{{result}}',
                operator: '!==',
                value: null,
                message: '操作应该成功完成'
              }
            ]
          }
        }
      }
    }
  ]
};
```

---

### 8.4 实际应用场景示例

#### 8.4.1 用户角色权限矩阵测试

```typescript
// 完整的角色权限测试用例
const rolePermissionMatrixTest: TestCase = {
  id: 'TC-ROLE-PERMISSION-MATRIX',
  name: '角色权限矩阵测试',
  description: '测试所有角色对所有资源的权限',

  variables: {
    roles: ['admin', 'manager', 'editor', 'viewer', 'guest'],
    resources: ['users', 'products', 'orders', 'reports', 'settings'],
    operations: ['create', 'read', 'update', 'delete'],

    // 权限矩阵定义
    permissionMatrix: {
      admin:   { users: ['c','r','u','d'], products: ['c','r','u','d'], orders: ['c','r','u','d'], reports: ['c','r','u','d'], settings: ['c','r','u','d'] },
      manager: { users: ['r','u'],         products: ['c','r','u','d'], orders: ['c','r','u','d'], reports: ['c','r'],         settings: ['r']           },
      editor:  { users: ['r'],             products: ['c','r','u'],     orders: ['r','u'],         reports: ['r'],             settings: []              },
      viewer:  { users: ['r'],             products: ['r'],             orders: ['r'],             reports: ['r'],             settings: []              },
      guest:   { users: [],                products: ['r'],             orders: [],                reports: [],                settings: []              }
    },

    testResults: []
  },

  steps: [
    // Step 1: 外层循环 - 遍历角色
    {
      id: 's1_role_loop',
      instruction: '遍历所有角色',
      expectedResult: '测试每个角色的权限',

      loopOver: '{{roles}}',
      loopVar: 'currentRole',

      automation: {
        type: 'workflow',
        workflowId: 'WF-ROLE-TEST-ITERATION',
        input: {
          role: '{{currentRole}}',
          resources: '{{resources}}',
          operations: '{{operations}}',
          expectedPermissions: '{{permissionMatrix[currentRole]}}'
        }
      }
    },

    // Step 2: 生成测试报告
    {
      id: 's2_report',
      instruction: '生成权限测试报告',
      expectedResult: '输出完整的测试结果矩阵',
      automation: {
        type: 'script',
        scriptId: 'SCRIPT-GENERATE-PERMISSION-REPORT',
        input: {
          results: '{{testResults}}'
        }
      }
    }
  ]
};

// 角色测试迭代工作流
const roleTestIterationWorkflow: WorkflowDefinition = {
  name: 'Role Test Iteration',
  version: '1.0.0',

  variables: {
    role: '',
    resources: [],
    operations: [],
    expectedPermissions: {},
    roleTestResults: []
  },

  nodes: {
    // 创建测试用户
    'createTestUser': {
      id: 'createTestUser',
      name: '创建测试用户',
      type: 'HTTP_REQUEST',
      config: {
        method: 'POST',
        url: '{{baseUrl}}/api/test-users',
        body: {
          role: '{{role}}',
          username: 'test_{{role}}_{{$timestamp()}}'
        }
      },
      output: {
        'body.userId': 'testUserId',
        'body.token': 'testToken'
      }
    },

    // 资源循环
    'resourceLoop': {
      id: 'resourceLoop',
      name: '遍历资源',
      type: 'LOOP',
      dependsOn: ['createTestUser'],
      config: {
        loopType: 'forEach',
        collection: '{{resources}}',
        itemVar: 'resource',
        parallel: true,
        maxConcurrency: 5
      },
      children: ['operationLoop']
    },

    // 操作循环 (嵌套)
    'operationLoop': {
      id: 'operationLoop',
      name: '遍历操作',
      type: 'LOOP',
      config: {
        loopType: 'forEach',
        collection: '{{operations}}',
        itemVar: 'operation',
        parallel: false
      },
      children: ['testPermission']
    },

    // 测试单个权限
    'testPermission': {
      id: 'testPermission',
      name: '测试权限',
      type: 'SCRIPT',
      config: {
        inline: `
          const role = vars.role;
          const resource = vars.resource;
          const operation = vars.operation;
          const expected = vars.expectedPermissions[resource] || [];
          const opCode = operation[0]; // 'c', 'r', 'u', 'd'

          const shouldHavePermission = expected.includes(opCode);

          // 执行权限测试
          const result = await testPermission(vars.testToken, resource, operation);

          const passed = result.allowed === shouldHavePermission;

          return {
            role,
            resource,
            operation,
            expected: shouldHavePermission,
            actual: result.allowed,
            passed
          };
        `
      },
      output: {
        'result': 'roleTestResults.push($output)'
      }
    },

    // 清理测试用户
    'cleanup': {
      id: 'cleanup',
      name: '清理测试用户',
      type: 'HTTP_REQUEST',
      dependsOn: ['resourceLoop'],
      config: {
        method: 'DELETE',
        url: '{{baseUrl}}/api/test-users/{{testUserId}}'
      }
    }
  }
};
```

#### 8.4.2 API兼容性测试 (多版本循环)

```typescript
const apiCompatibilityTest: TestCase = {
  id: 'TC-API-COMPATIBILITY',
  name: 'API多版本兼容性测试',
  description: '测试API在多个版本中的兼容性',

  variables: {
    apiVersions: ['v1', 'v2', 'v3'],
    endpoints: [
      { path: '/users', methods: ['GET', 'POST'] },
      { path: '/users/:id', methods: ['GET', 'PUT', 'DELETE'] },
      { path: '/products', methods: ['GET', 'POST'] },
      { path: '/orders', methods: ['GET', 'POST'] }
    ],
    compatibilityResults: []
  },

  steps: [
    // 版本循环
    {
      id: 's1_version_loop',
      instruction: '遍历API版本',
      expectedResult: '测试每个版本的兼容性',

      loopOver: '{{apiVersions}}',
      loopVar: 'version',

      automation: {
        type: 'inline',
        inlineConfig: {
          type: 'SCRIPT',
          config: {
            inline: `
              const version = vars.version;
              const endpoints = vars.endpoints;
              const results = [];

              for (const endpoint of endpoints) {
                for (const method of endpoint.methods) {
                  // 条件: 某些端点只在特定版本存在
                  if (endpoint.path === '/orders' && version === 'v1') {
                    results.push({
                      version,
                      endpoint: endpoint.path,
                      method,
                      status: 'skipped',
                      reason: 'Orders API not available in v1'
                    });
                    continue;
                  }

                  // 测试端点
                  const url = \`\${vars.baseUrl}/api/\${version}\${endpoint.path}\`;
                  const response = await fetch(url, { method });

                  results.push({
                    version,
                    endpoint: endpoint.path,
                    method,
                    status: response.ok ? 'pass' : 'fail',
                    statusCode: response.status
                  });
                }
              }

              return results;
            `
          }
        },
        outputMapping: {
          'results': 'compatibilityResults.concat($output)'
        }
      }
    },

    // 生成兼容性报告
    {
      id: 's2_compatibility_report',
      instruction: '生成兼容性报告',
      expectedResult: '显示所有版本的兼容性状态',
      automation: {
        type: 'script',
        scriptId: 'SCRIPT-COMPATIBILITY-REPORT'
      }
    }
  ]
};
```

---

## 第九部分: 实施路线图与验证策略

### 9.1 实施阶段规划

```
Phase 1: 基础架构 (4周)
├── 统一数据模型定义
├── 核心表达式引擎实现
├── 基础执行引擎开发
└── 单元测试覆盖

Phase 2: 核心功能 (6周)
├── 多分支条件执行实现
├── 循环节点实现
├── DAG+树形混合执行引擎
└── WebSocket实时推送

Phase 3: UI集成 (4周)
├── 可视化条件编辑器
├── 循环配置界面
├── 实时执行监控面板
└── 数据流可视化

Phase 4: 高级特性 (4周)
├── 数据驱动测试支持
├── 模板系统
├── AI辅助测试生成
└── 性能优化

Phase 5: 生产就绪 (2周)
├── 压力测试
├── 安全审计
├── 文档完善
└── 部署指南
```

### 9.2 验证策略

**功能验证**:
- 单元测试: 所有条件表达式、循环逻辑
- 集成测试: 完整工作流执行
- E2E测试: 用户场景覆盖

**性能验证**:
- 循环性能: 1000+迭代性能测试
- 并发性能: 100+并行执行
- 内存泄漏: 长时间运行测试

---

**文档完成**
