## Why

当前插件虽然面向 React Router v6.4+ data router，但路由模式的预渲染链路仍然只是创建 memory router 后直接 `renderToString()`，不会在构建期按 React Router 官方 SSR 方式执行 matched `loader`。这让“页面渲染前获取自定义数据”这一 data router 的核心能力在静态预渲染场景下缺失，也导致 README 中“支持 data router”的表述与实际行为存在落差。

## What Changes

- 将路由模式预渲染从 `createMemoryRouter(...) + <RouterProvider />` 调整为 React Router 官方 data-router SSR 流程：先执行 `createStaticHandler(routes).query(request)`，再通过 `createStaticRouter(...) + <StaticRouterProvider />` 产出 HTML。
- 让每个目标路径在构建期执行其匹配分支上的 `loader`，并将 `loaderData`、`errors`、状态码等 SSR 上下文用于最终静态 HTML 渲染。
- 为路由模式增加可选的请求源配置，用于在构建期生成稳定的 `Request.url`，避免 `loader` 依赖绝对 URL 时只能退回占位地址。
- 在文档中补充 loader 模式的推荐客户端接入方式，说明如何通过 `hydrateRoot(...)` 与 `createBrowserRouter(..., { hydrationData })` 复用预渲染阶段生成的数据。
- 更新测试覆盖，新增围绕 loader 数据渲染、失败回退、hydration data 输出以及真实 playground 构建的 Vitest 回归用例。
- 更新至少一个 routes playground，演示构建期执行 `loader` 并将结果写入静态 HTML 的完整链路。

## Capabilities

### New Capabilities
- 无

### Modified Capabilities
- `react-spa-prerender`: 路由模式的预渲染语义从“仅渲染路由组件树”扩展为“在构建期执行 matched loaders 并使用官方 data-router SSR 上下文渲染 HTML”。
- `local-playground-validation`: 本地 playground 联调基线需要覆盖至少一个启用 loader 的 routes app，验证其真实构建输出包含预取数据结果。
- `readme-information-architecture`: README 需要在现有章节结构下补充 loader 预渲染与客户端 hydrationData 接入说明。

## Impact

- 影响 [`src/prerender.tsx`](/Users/wbbb/Projects/vite-plugin-react-ssg/src/prerender.tsx) 的路由模式主链路，需要切换到 React Router 官方 SSR data-router API。
- 影响 [`src/config.ts`](/Users/wbbb/Projects/vite-plugin-react-ssg/src/config.ts) 与 [`src/load-config.ts`](/Users/wbbb/Projects/vite-plugin-react-ssg/src/load-config.ts) 的配置模型与校验逻辑，需要承载构建期 request origin 等新配置。
- 影响 [`tests/react-ssg.test.ts`](/Users/wbbb/Projects/vite-plugin-react-ssg/tests/react-ssg.test.ts) 和相关 playground 测试基线，需要把 loader 场景纳入 TDD 回归。
- 影响 [`README.md`](/Users/wbbb/Projects/vite-plugin-react-ssg/README.md)、[`README.zh-CN.md`](/Users/wbbb/Projects/vite-plugin-react-ssg/README.zh-CN.md) 与 `playgrounds/` 示例，确保对外文档和演示与新行为一致。
