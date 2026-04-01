## Why

当前仓库仍是一个通用 React 组件库模板，尚未承载“为传统 Vite React SPA 提供构建时预渲染”的核心能力。为了让项目尽快聚焦到目标产品，需要先明确插件的配置方式、支持范围、失败回退语义以及与 React Router 的集成边界，避免后续实现阶段反复调整接口。

## What Changes

- 新增一个面向传统 Vite React SPA 的预渲染插件能力，在构建时为符合条件的页面生成静态 HTML。
- 约定新增独立配置文件 `react-ssg.config.ts`，通过 `defineReactSsgConfig` 提供类型友好的配置入口。
- 支持两种输入模式：基于 React Router `routes` 的路由模式，以及基于单一 `App` 的单页模式。
- 在路由模式下支持 `browser` 与 `hash` 两种 history 语义，其中 `browser` 自动发现静态路由并允许通过 `paths` 补充动态路径，`hash` 仅预渲染默认首屏。
- 明确失败回退语义：缺少或非法配置时整体回退到普通 CSR 构建；单个页面预渲染失败时仅该页面回退到 CSR，其余页面继续生成静态 HTML。
- `loader` 静态执行、浏览器 API polyfill、`router` 对象输入不纳入 `v1`，仅作为后续演进方向记录。

## Capabilities

### New Capabilities
- `react-spa-prerender`: 提供面向传统 Vite React SPA 的构建期预渲染能力，覆盖配置加载、路由发现、单页渲染、失败回退与输出产物规则。

### Modified Capabilities
- 无

## Impact

- 影响 `src/` 下的导出接口与插件核心实现，需要从当前组件模板演进为 Vite 插件入口。
- 影响测试结构，需要引入围绕配置解析、路由发现、预渲染产物与失败回退的 Vitest 测试。
- 影响 `README.md` 与 playground，用于展示 `react-ssg.config.ts`、路由模式和单页模式的典型用法。
- 可能新增与服务端渲染相关的运行时代码，但 `v1` 不引入 `jsdom` 或其它 polyfill 依赖。
