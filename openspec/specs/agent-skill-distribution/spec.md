# agent-skill-distribution Specification

## Purpose
TBD - created by archiving change publish-vite-react-ssg-skill. Update Purpose after archive.
## Requirements
### Requirement: 仓库必须以开放技能生态可发现的结构发布 vite-plugin-react-ssg skill
系统 MUST 在仓库内以 `vercel-labs/skills` 可发现的目录结构提供 `vite-plugin-react-ssg` skill，并确保其 `SKILL.md` frontmatter 合法、可解析且包含 `name` 与 `description`。

#### Scenario: 仓库根可发现 vite-plugin-react-ssg skill
- **WHEN** 技能安装工具扫描该仓库内的标准技能目录
- **THEN** 系统必须在 `skills/vite-plugin-react-ssg/` 下提供 `SKILL.md`
- **THEN** 该 `SKILL.md` 的 YAML frontmatter 必须至少包含合法的 `name` 与 `description`

### Requirement: skill 的触发范围必须覆盖 Vite React SPA 中的 SEO 与预渲染需求语义
系统 MUST 让 `vite-plugin-react-ssg` skill 在用户提出 Vite + React SPA 中的 SEO、SSG、预渲染、静态 HTML 输出、社媒预览元数据等需求时可以被正确触发，而不要求用户先明确说出插件名。

#### Scenario: 用户只描述 SEO 或社媒预览需求
- **WHEN** 用户在 Vite + React 项目中提出 SEO、Open Graph、Twitter Card、社媒预览或 crawler-friendly HTML 等需求
- **THEN** skill 的触发描述必须覆盖这些需求语义
- **THEN** 系统不得要求用户必须先明确提到 `vite-plugin-react-ssg`

#### Scenario: 触发范围明确限定在 Vite React SPA 场景
- **WHEN** skill 描述触及 SEO、SSG 或预渲染需求
- **THEN** 系统必须明确该 skill 面向 Vite + React 的传统 SPA 集成场景
- **THEN** 系统不得把该 skill 描述成适用于任意前端框架或任意 SSR 场景

### Requirement: skill 正文必须指导消费方项目集成插件与相关公开 API
系统 MUST 让 `vite-plugin-react-ssg` skill 的正文面向消费方项目接入，说明插件安装、Vite 注册、`react-ssg.config.ts`、React Router data router / hydrationData、`@unhead/react` 元数据接入、限制与验证步骤，并提供对应公开文档链接。

#### Scenario: skill 正文聚焦消费方集成
- **WHEN** agent 读取该 skill 的正文
- **THEN** 正文必须说明如何在消费方项目中安装并注册 `vite-plugin-react-ssg`
- **THEN** 正文必须说明如何创建或更新 `react-ssg.config.ts`
- **THEN** 正文不得依赖本仓库内部源码路径作为主要操作说明

#### Scenario: skill 正文覆盖 React Router 与 Unhead 官方接入点
- **WHEN** 用户场景涉及 loader 预渲染、hydrationData 复用或页面级 SEO 元数据
- **THEN** 正文必须说明 React Router data router、`window.__staticRouterHydrationData` 与 `@unhead/react` 的接入方式
- **THEN** 正文必须提供指向插件 README、Vite、React Router 与 Unhead 公开文档的链接
