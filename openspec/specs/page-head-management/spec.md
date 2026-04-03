## Purpose

定义 `vite-plugin-react-ssg` 如何基于 `@unhead/react` 提供页面级 head 管理能力，包括官方 Hook 接入方式、模板 HTML 处理边界，以及对外依赖约束。

## Requirements

### Requirement: 插件必须支持基于 `@unhead/react` 官方 Hook 的页面级 head 声明
系统 MUST 允许使用者在 React 组件中通过 `@unhead/react` 官方 `useHead()` 与 `useSeoMeta()` 声明页面级 head，并让这套声明同时服务于预渲染输出与客户端导航后的 head 更新。

#### Scenario: 路由模式页面使用官方 Hook 声明 SEO 信息
- **WHEN** 用户在路由组件中调用 `@unhead/react` 的 `useHead()` 或 `useSeoMeta()`，并在客户端入口使用 `UnheadProvider` 包裹应用
- **THEN** 对应预渲染页面的最终 HTML 必须反映这些 head 声明
- **THEN** 客户端后续路由切换必须继续复用同一套官方 Hook 更新 document head

#### Scenario: 单页模式入口使用官方 Hook 声明根页面 head
- **WHEN** 用户在单页模式根组件或其子组件中调用 `@unhead/react` 的官方 Hook，并完成客户端 Provider 初始化
- **THEN** 根路径预渲染输出必须包含对应的 head 结果
- **THEN** 系统不得要求用户改用插件私有的 head API

### Requirement: 预渲染阶段必须直接使用 Unhead 的模板变换结果作为最终 HTML
系统 MUST 在完成服务端渲染后调用 `transformHtmlTemplate()` 处理完整 HTML 模板，并直接以该返回结果作为最终写盘内容；系统不得在其前后追加额外的模板 head 合并、裁剪或覆盖规则。

#### Scenario: 模板 head 与页面 head 出现冲突或重复
- **WHEN** `index.html` 中原有 `<head>` 标签与页面通过 Unhead 声明的 head 标签存在冲突、重复或共存关系
- **THEN** 系统必须将应用 HTML 注入模板后交给 `transformHtmlTemplate()` 处理
- **THEN** 系统必须直接使用 `transformHtmlTemplate()` 的输出作为最终 prerender HTML
- **THEN** 模板 head 的保留、替换与去重语义必须完全遵循 Unhead 默认行为

### Requirement: 页面级 head 能力必须以 `@unhead/react` 作为官方集成依赖
系统 MUST 将 `@unhead/react` 作为页面级 head 能力的官方集成依赖，并在文档、示例与发布包元数据中统一体现这一要求。

#### Scenario: 用户接入页面级 head 管理
- **WHEN** 用户按照文档为项目接入页面级 head 管理能力
- **THEN** 发布包必须将 `@unhead/react` 声明为 peerDependency
- **THEN** 文档与示例必须使用 `@unhead/react` 提供的 `UnheadProvider`、`useHead()` 与 `useSeoMeta()`
- **THEN** 系统不得额外暴露插件私有的 head Hook API
