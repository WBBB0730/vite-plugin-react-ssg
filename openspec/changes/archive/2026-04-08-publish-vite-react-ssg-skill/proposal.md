## Why

仓库已经提供了 `skills/vite-plugin-react-ssg/SKILL.md`，但当前 skill 还没有完整对齐开放技能生态的分发与消费方式：触发范围偏窄，说明中仍掺杂仓库内部实现视角。这会降低它在 `vercel-labs/skills` 生态中的可发现性，也会让 agent 在真实消费方项目里更难稳定地把它用对。

现在补齐这部分约束，可以让仓库内的 skill 既能被 `npx skills add <repo>` 正常发现，也能更准确地在 Vite + React 项目的 SEO、SSG、预渲染和社媒预览场景中触发，并提供面向使用者而不是仓库开发者的集成指引。

## What Changes

- 将 `skills/vite-plugin-react-ssg/SKILL.md` 重写为面向消费方项目接入的 skill，扩大触发范围到 Vite + React 场景中的 SEO、SSG、预渲染、静态 HTML、Open Graph、Twitter Card 等需求。
- 将 skill 正文聚焦于插件的安装、接入、`react-ssg.config.ts` 配置、React Router data router / loader / hydrationData、`@unhead/react` 元数据接入、验证与限制，不再依赖仓库内部源码路径。
- 在 skill 中补充指向公开文档的链接，包括插件 README、Vite 插件配置、React Router data loading / hydration、Unhead React 安装与 SEO API。

## Capabilities

### New Capabilities

- `agent-skill-distribution`: 规范仓库内 `vite-plugin-react-ssg` skill 的分发目录、触发范围与集成说明，使其可被开放技能生态稳定发现和消费。

### Modified Capabilities

- 无

## Impact

- 影响目录：`skills/vite-plugin-react-ssg/`
- 影响 OpenSpec：新增 `agent-skill-distribution` 能力说明
- 不影响插件运行时代码、对外 JavaScript API、构建产物或现有测试基线
