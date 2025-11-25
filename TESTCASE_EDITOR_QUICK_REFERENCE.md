# 测试案例编辑页面 - 快速参考指南

## 核心文件速查表

| 文件名 | 行数 | 目的 | 关键点 |
|--------|------|------|--------|
| **CaseDetail.tsx** | 206 | 案例详情展示 | ❌ 需要展开/折叠 |
| **TestCaseEditor.tsx** | 156 | 编辑主容器 | ❌ 缺乏预览 |
| **StepEditor.tsx** | 304 | 步骤列表管理 | ⚠️ 拖拽优化 |
| **StepCard.tsx** | 300+ | 单步编辑 | ❌ 过于复杂 |
| **ExecutionView.tsx** | 293 | 执行跟踪 | ⚠️ 性能 |
| **DataFlowDiagram.tsx** | 565 | 数据流可视化 | ⚠️ 连接线性能 |
| **WorkflowRunner.tsx** | 353 | 工作流执行 | ✅ 质量好 |

## 问题优先级速查

### 红色告警 (必须修复)
```
[Critical] 旧新API并存
- 文件: CaseDetail.tsx, StepCard.tsx
- 影响: 数据兼容性bug
- 修复时间: 2天

[Critical] 嵌套深度无限制
- 文件: StepEditor.tsx, StepCard.tsx
- 影响: 创建不可理解的工作流
- 修复时间: 1天

[Critical] 模式混乱 (Template/Inline/Workflow)
- 文件: StepCard.tsx (300+行)
- 影响: 用户困惑，配置丢失
- 修复时间: 3天
```

### 黄色警告 (应该优化)
```
[Important] 步骤显示简洁
- 文件: CaseDetail.tsx
- 影响: 难以快速了解工作流
- 优化时间: 2天

[Important] UI认知过载
- 文件: StepCard.tsx
- 影响: 编辑体验差
- 优化时间: 3天

[Important] 缺乏撤销/重做
- 文件: TestCaseEditor.tsx
- 影响: 可能丢失编辑
- 优化时间: 2天
```

### 绿色提示 (可以改进)
```
[Nice] 性能优化机会
- SVG连接线计算缓存
- 虚拟化大列表
- 模板加载缓存

[Nice] 功能增强
- 搜索/过滤步骤
- 工作流模板库
- AI智能建议
```

## 代码复杂度热力图

```
超高风险 (300+行):
  StepCard.tsx (★★★★★)
  DataFlowDiagram.tsx (★★★★☆)

高风险 (200-300行):
  StepEditor.tsx (★★★☆☆)
  ExecutionView.tsx (★★★☆☆)
  WorkflowRunner.tsx (★★★☆☆)

中等 (100-200行):
  TestCaseEditor.tsx (★★☆☆☆)
  CaseDetail.tsx (★★☆☆☆)
```

## 快速改进清单

### 本周 (Week 1)
- [ ] 在CaseDetail.tsx添加展开/折叠功能 (2天)
- [ ] 限制StepCard嵌套深度到3 (1天)

### 下周 (Week 2)
- [ ] 统一StepCard模式管理 (3天)
- [ ] 为TestCaseEditor添加撤销/重做 (2天)

### 两周后 (Week 3-4)
- [ ] 重构StepCard为Tab式UI (3天)
- [ ] 添加步骤搜索/过滤 (2天)
- [ ] 优化DataFlowDiagram性能 (2天)

## 关键指标追踪

```
当前状态:
├── 组件复杂度: ⚠️ 平均180行 (目标<150)
├── TypeScript覆盖: ✅ 95% (目标100%)
├── 测试覆盖: ❌ 40% (目标80%)
├── 文档完整性: ⚠️ 60% (目标90%)
└── 性能评分: ⚠️ 3.5/5 (目标4.5+)
```

## 用户体验评估

```
首次使用体验: ⚠️ 2/5
- 太多选项 (模式、配置项)
- 没有引导
- 错误信息不清晰

日常编辑效率: ⚠️ 3/5
- 拖拽顺手
- 但模式切换多
- 没有快捷方式

执行调试体验: ✅ 4/5
- 进度显示清晰
- 日志展示详细
- 缺乏搜索功能

可视化体验: ✅ 4/5
- 数据流图很炫
- 但大工作流卡
- 分支条件不显示
```

## 技术债务偿还计划

| 项目 | 复杂度 | 工作量 | ROI | 优先级 |
|------|--------|--------|-----|--------|
| API迁移 | 高 | 2天 | 高 | P1 |
| 嵌套限制 | 低 | 1天 | 高 | P1 |
| 模式统一 | 高 | 3天 | 高 | P1 |
| UI简化 | 中 | 5天 | 中 | P2 |
| 性能优化 | 中 | 4天 | 中 | P2 |
| 功能增强 | 低 | 各2天 | 低 | P3 |

## 推荐技术栈升级

```
✅ 已有 (维持)
├── React 19.2
├── TypeScript
├── Tailwind CSS
└── Lucide React icons

⚠️ 建议引入
├── react-window (虚拟化)
├── zustand或jotai (状态管理)
├── immer (不可变更新)
└── @headlessui/react (弹窗框架)

❌ 考虑移除
└── 重复的状态管理逻辑
```

## 文档清单

已有:
- ✅ TESTCASE_EDITOR_ANALYSIS.md (主分析)
- ✅ TESTCASE_EDITOR_DETAILED_ANALYSIS.md (技术细节)
- ❌ TESTCASE_EDITOR_QUICK_REFERENCE.md (本文档)

需要创建:
- 用户指南 (如何使用各种模式)
- API文档 (TestStep数据结构规范)
- 架构决策记录 (ADR)
- 性能基准 (Performance Baseline)

## 联系方式

**技术责任人**: 前端架构组  
**相关文档**:
- 主分析报告: `TESTCASE_EDITOR_ANALYSIS.md`
- 技术细节: `TESTCASE_EDITOR_DETAILED_ANALYSIS.md`
- 代码评审清单: 见下方

## 代码评审清单

在提交PR前，检查:

```typescript
// 1. API格式检查
✓ 不使用 parameterValues (用 config 替代)
✓ 不混用 linkedScriptId 和 actionTemplateId
✓ 统一使用 type 字段识别步骤类型

// 2. 嵌套深度检查
✓ 最多3层嵌套 (validateNesting函数)
✓ 循环中不包含循环
✓ 分支中的步骤数 < 10

// 3. 模式检查
✓ StepCard 只用 Template 模式
✓ 没有 if/else 切换 Template/Inline
✓ 配置模式清晰（选择操作 -> 配置参数 -> 配置输出）

// 4. 性能检查
✓ 没有在render中调用API
✓ 使用useMemo缓存计算
✓ useCallback包装回调函数
✓ 大列表使用虚拟化

// 5. 可用性检查
✓ 添加了必要的加载态
✓ 错误信息清晰
✓ 有撤销/重做或确认对话框
```

