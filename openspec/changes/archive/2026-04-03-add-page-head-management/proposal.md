## Why

当前插件只能把 React 应用内容注入到构建产物中的 `#app` 容器，无法让页面或布局在预渲染时声明自己的 `<title>`、TDK、Open Graph 与其它 head 标签。用户已经明确希望采用 `@unhead/react` 官方 `useHead()` / `useSeoMeta()` 方案，因此现在需要补齐页面级 head 管理能力，并明确模板 head 与页面 head 的最终合并边界。

## What Changes

- 新增基于 `@unhead/react` 的页面级 head 管理能力，允许使用者在组件中直接调用官方 `useHead()` / `useSeoMeta()`。
- 在预渲染阶段为每个目标页面创建 Unhead 实例，并使用 `transformHtmlTemplate()` 处理完整 HTML 模板。
- 让 `index.html` 中原有的 `<head>` 继续作为模板输入存在，但模板 head 与页面 head 的最终合并、替换与去重完全以 Unhead 默认行为为准。
- 要求启用该能力的项目在客户端入口按 Unhead 官方方式创建 `head` 实例并包裹 `UnheadProvider`，从而让首屏预渲染与客户端路由切换共用同一套 head 声明方式。
- **BREAKING** 将包的 `react` 与 `react-dom` peerDependencies 下限提升到 `>=18.3.1`，与 `@unhead/react` 当前最低支持版本保持一致。
- **BREAKING** 将 `@unhead/react` 引入为发布包的必需 peerDependency，并在文档与示例中明确其安装与接入方式。

## Capabilities

### New Capabilities
- `page-head-management`: 提供基于 `@unhead/react` 官方 Hook 与 `transformHtmlTemplate()` 的页面级 head 管理能力。

### Modified Capabilities
- `react-spa-prerender`: 调整包元数据中的 React / React DOM 对外兼容下限，使其与新增的 `@unhead/react` 依赖要求一致。

## Impact

- 影响 `package.json` 的 peerDependencies，需要新增 `@unhead/react` 并提升 React / React DOM 下限。
- 影响预渲染主链路，需要在 SSR 时集成 `@unhead/react/server` 并使用 `transformHtmlTemplate()` 生成最终 HTML。
- 影响示例与文档，需要展示客户端入口中的 `UnheadProvider` 初始化，以及页面内 `useHead()` / `useSeoMeta()` 的官方用法。
- 影响测试结构，需要新增围绕模板 head、页面级 head、最终 HTML 输出与包元数据的 Vitest 回归验证。
