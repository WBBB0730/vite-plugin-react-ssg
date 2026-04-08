## Context

本次变更不涉及插件运行时代码，而是面向仓库内 skill 的分发质量与消费体验。当前仓库已经存在 `skills/vite-plugin-react-ssg/SKILL.md`，但它最初更偏向仓库内部开发视角，触发范围和内容结构还不足以支撑开放技能生态中的稳定发现与复用。

`vercel-labs/skills` 的基本发现机制依赖有效的 `SKILL.md`、正确的目录布局以及清晰的 `name` / `description`。因此，这次设计重点是让 skill 在开放技能生态中更容易被发现，并且在真实消费方项目里更容易被正确使用。

同时，skill 的正文必须面向“如何在消费方项目里正确集成插件”，而不是指导 agent 阅读本仓库源码实现。

## Goals / Non-Goals

**Goals:**

- 让仓库内的 `vite-plugin-react-ssg` skill 可以被 `vercel-labs/skills` 生态稳定发现
- 将触发范围扩展到 Vite + React 项目的 SEO、SSG、预渲染、社媒预览等需求语义
- 让 skill 正文聚焦插件安装、配置、限制、验证与公开文档，而非仓库内部源码路径
- 用 OpenSpec 记录这次分发与文档约束，避免后续回退

**Non-Goals:**

- 不修改 `vite-plugin-react-ssg` 的运行时功能、对外 API 或测试逻辑
- 不把 skill 扩展成插件开发者指南
- 不新增额外的仓库级 README、安装脚本或发布流程

## Decisions

1. 将 skill 的 canonical 分发目录保持为 `skills/vite-plugin-react-ssg/`。
原因：`vercel-labs/skills` 会扫描仓库内约定路径下的 `SKILL.md`，当前目录已满足该生态的发现方式，继续沿用可以避免引入额外路径迁移成本。

备选方案：
- 改放到 `.agents/skills/`
  不采用：这更偏向 agent 本地安装目录，而不是仓库对外分发目录。

2. 将 frontmatter `description` 改成以需求语义驱动，而不是只以插件名驱动。
原因：真实用户常常先提出“SEO、预渲染、社媒卡片”这类需求，而不会先说出 `vite-plugin-react-ssg`。让 description 覆盖这些触发词，才能让 skill 在正确时机被选中。

备选方案：
- 继续仅写“当用户提到 vite-plugin-react-ssg 时使用”
  不采用：触发面太窄，和用户实际表达方式不匹配。

3. 将 skill 正文完全切换到“消费方项目接入指南”视角。
原因：skill 的职责是指导 agent 解决用户问题，而不是讲解本仓库内部实现。正文应聚焦安装、`vite.config.ts` 注册、`react-ssg.config.ts`、React Router data router、Unhead、验证步骤和限制。

备选方案：
- 在 skill 中保留对仓库源码文件的引用
  不采用：这会让 skill 和消费方场景耦合过深，也更容易因内部重构而失效。

4. 使用公开文档链接作为权威引用来源。
原因：skill 被安装到别的项目后，仍然需要稳定引用可访问的资料。链接到 README、Vite、React Router、Unhead 官方文档，比引用仓库相对路径更稳妥。

备选方案：
- 只保留文字说明，不给文档链接
  不采用：agent 在边界问题上缺少进一步核对的入口。

## Risks / Trade-offs

- [风险] skill 的触发范围扩大后，可能在非目标场景中过度触发。
  → 缓解：在 description 与正文中明确限定为 “Vite + React SPA” 与“传统 SPA 的构建期预渲染”。

- [风险] skill 中的公开文档链接后续可能漂移或失效。
  → 缓解：优先链接 README 与主仓库文档路径，避免引用临时页面；后续文档调整时同步更新 skill。
