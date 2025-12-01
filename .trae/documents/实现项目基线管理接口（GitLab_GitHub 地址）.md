# 产品需求文档（PRD）

## 一、产品概述
- 名称：项目基线管理与评审能力（含多基线、模板化通知、AI 评审、多渠道支持）
- 目标：为项目与其下的服务/模块提供统一的“基线”管理，支持 GitHub/GitLab 多仓库与多分支；在代码 push/MR 或人工触发时进行评审（AI/人工），并按模板将结果通知到企业微信等渠道；以角色与权限实现“多人/团队”多层次管理。
- 背景痛点：多仓库管理混乱、评审缺少结构化度量、事件触发难以串联、通知不灵活。

## 二、范围与不在本期范围
- 本期范围：
  - 项目下的服务（serviceName）管理多条基线（Baseline）
  - 基线的人工与 AI 评审（OpenAI 兼容格式，多渠道）
  - GitHub/GitLab push/MR 事件触发评审
  - 通知渠道可配置，支持模板渲染（企业微信 Webhook 等）
  - 多层次权限（owner/maintainer/developer/tester/viewer）
- 不在本期：
  - 代码静态分析/安全扫描的深度集成（可未来接入）
  - 团队实体与层级组织的完整实现（本期用成员+角色满足）

## 三、目标用户与场景
- 研发负责人：配置项目的多基线与通知策略，管理评审规则与通道。
- 开发/测试工程师：创建基线、提交评审（人工与 AI），查看结构化结果。
- 项目干系人：接收企业微信等渠道通知，快速获知变更与评审结论。

## 四、核心能力与用户故事
1) 多基线管理
- 作为开发者，我可以在同一服务（serviceName）下维护多个基线（不同仓库/分支），以适应多环境与镜像仓库。
- 作为负责人，我可以查询与更新基线，标记启用/停用状态。
2) 评审（人工/AI）
- 作为测试人员，我可以对某次变更进行人工评审并打分与备注。
- 作为负责人，我可以选择某个 AI 通道（OpenAI 兼容）自动评审，得到结构化评分与评语。
3) 触发与通知
- 作为系统，我在收到 GitHub/GitLab 的 push/MR Webhook 时，自动定位对应基线并触发 AI 评审。
- 作为负责人，我配置企业微信 Webhook 与模板，让评审结果以约定格式推送到群聊。
4) 多层次管理
- 作为项目成员，我的角色决定我能创建/更新基线、触发评审、配置通知或仅查看。

## 五、角色与权限矩阵
- 角色：owner｜maintainer｜developer｜tester｜viewer（参考 `internal/models/tenant.go:154-160`）
- 权限：
  - 基线 CRUD：owner｜maintainer｜developer
  - 评审创建（人工）：owner｜maintainer｜developer｜tester
  - AI 渠道/通知配置：owner｜maintainer
  - 查询：所有项目成员

## 六、功能需求（FR）
FR-1 基线 CRUD
- 创建：输入 `serviceName, provider, repoUrl, branch, description`
- 查询：按 `projectId` 与可选 `serviceName` 过滤；支持分页与状态筛选（active/inactive）
- 更新/删除：按 `baselineId` 操作
FR-2 评审（人工/AI）
- 人工评审：输入 `score(0-100), comment`
- AI 评审：指定 `channelId`（或默认），可传 `promptOverrides`；返回结构化 `{score, comment}` 并持久化
FR-3 Webhook 触发
- GitHub：push/MR（merge_request）识别；校验 secret；映射到 `Baseline`（RepoURL+Branch）
- GitLab：同上；支持不同事件 payload
- 触发后：调用 AI 评审并记录 `BaselineReview`（Trigger=push/MR）
FR-4 通知模板
- 渲染模板（Go `text/template`）：支持企业微信 Markdown；模板中可用变量：`event, projectId, serviceName, baselineId, branch, score, comment, trigger, commitId`
- 订阅事件：`onPush, onMergeRequest, onReviewCreated`
- 多渠道：`wecom|webhook|email|...`（本期以 WeCom 与通用 Webhook 为主）
FR-5 AI 通道管理
- 新增/更新/删除通道：`type(openai|custom), baseURL, model, apiKeyRef, defaultPromptTemplate, enabled`
- 选择通道触发评审；失败重试与错误暴露

## 七、非功能需求（NFR）
- 安全：不在日志中打印 secrets；`apiKeyRef` 仅为引用名，真实值从环境或安全配置读取。
- 可用性：Webhook 与评审失败时记录事件与错误详情；通知渲染失败不阻塞评审持久化。
- 性能：评审调用异步化（可后续优化），通知发送带重试与退避策略。

## 八、接口规范（API）
- 基线：`/api/v2/projects/:projectId/baselines`
  - POST `/` 创建；GET `/` 列表；GET `/:baselineId`；PUT `/:baselineId`；DELETE `/:baselineId`
- 评审：`/api/v2/projects/:projectId/baselines/:baselineId/reviews`
  - POST `/` 人工评审；POST `/ai` AI 评审；GET `/` 列表
- Webhook：`/api/v2/baselines/webhooks/github`，`/api/v2/baselines/webhooks/gitlab`
  - Header/Body 校验 secret；适配事件 payload
- 通知：`/api/v2/projects/:projectId/notifications`
  - POST `/`；GET `/`；PUT `/:notificationId`；DELETE `/:notificationId`
- AI 通道：`/api/v2/projects/:projectId/ai-channels`
  - POST `/`；GET `/`；PUT `/:channelId`；DELETE `/:channelId`

## 九、数据模型（DDL 方向）
- Baselines（新增）
  - `id, baseline_id, project_id, service_name, provider, repo_url, branch, description, status, created_by, created_at, updated_at, deleted_at`
- BaselineReviews（新增）
  - `id, review_id, baseline_id, reviewer_type, reviewer_id, trigger, channel_id?, score, comment, created_at`
- ProjectNotifications（新增）
  - `id, notification_id, project_id, type, config(JSONB: webhookUrl, signingKey, headers, template, events), enabled, created_at, updated_at`
- AIChannels（新增）
  - `id, channel_id, project_id, type, base_url, model, api_key_ref, default_prompt_template, enabled, created_at, updated_at`

## 十、交互流程（关键）
1) push → Webhook → 解析 → 匹配 Baseline → 触发 AI 评审 → 写评审记录 → 模板通知
2) 人工评审 → 写评审记录 → 模板通知（onReviewCreated）
3) 配置变更 → 通道与通知生效于后续触发

## 十一、模板渲染规范
- 语法：Go `text/template`；容错：渲染失败记录错误并继续核心流程。
- 默认企业微信模板（Markdown）：
```
[{{.event}}] 项目 {{.projectId}} / 服务 {{.serviceName}}
基线: {{.baselineId}}\n分支: {{.branch}}\n评分: {{.score}}\n评语: {{.comment}}\n触发: {{.trigger}}\n提交: {{.commitId}}
```

## 十二、AI 评审规范（OpenAI 兼容）
- Prompt 模板示例：
```
系统：你是资深代码评审专家，请给变更打分并给出简洁评语。
用户：仓库 {{.repoUrl}} 分支 {{.branch}} 最新提交 {{.commitId}}。变更摘要：{{.diffSummary}}。
请用 JSON 返回：{"score": 0-100, "comment": "..."}
```
- 解析：严格 JSON 解析，异常返回错误并记录。

## 十三、实施映射（代码模块）
- 模型：`internal/models/*` 新增 3-4 个模型文件；`cmd/server/main.go:45-63` 加入 `AutoMigrate`
- 仓储：`internal/repository/*` 新增 Baseline/BaselineReview/ProjectNotification/AIChannel
- 服务：`internal/service/*` 新增 BaselineService/NotificationService/AIClient(OpenAI)
- 处理器：`internal/handler/*` 新增/扩展路由与处理函数

## 十四、配置与安全
- `config.toml` 增加 `GitHubWebhookSecret`、`GitLabWebhookSecret`；AI 链接参数优先从环境变量读取（`API_KEY` 等）。
- 日志屏蔽敏感字段；错误与审计事件落库。

## 十五、验收标准
- 能为同一 `serviceName` 配置多个基线，CRUD 正常。
- 人工/AI 评审返回结构化评分与评语；AI 多渠道可配置并可选用。
- push/MR 能触发评审与模板化通知（企业微信）。
- 权限矩阵生效；新增集成测试覆盖主要路径与边界；现有用例无回归失败。

## 十六、里程碑
- M1：模型/仓储/服务与基础路由完成；单元/集成测试可运行
- M2：Webhook + AI 通道接入（OpenAI 兼容）与模板通知
- M3：文档与权限完善，验收与上线

—— 如需调整或补充，请告知，我将据此开始实施落地。