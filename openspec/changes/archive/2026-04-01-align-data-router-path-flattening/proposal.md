## Why

当前路由模式的实现虽然在运行时依赖 React Router 的 data router API，但对外约束、测试示例和静态路径发现逻辑都没有把这一点表达清楚，导致实现边界与产品承诺不一致。同时，`route-paths.ts` 仍使用自定义递归算法，和 React Router 官方在可选段、无路径布局路由、绝对子路由等场景下的路径展平语义存在偏差，容易让预渲染目标集合与真实匹配行为不一致。

## What Changes

- 明确路由模式仅支持 React Router v6.4+ data router 所使用的 `RouteObject[]` 输入模型，不再讨论或承诺兼容 v5 与 v6 早期声明式路由。
- 调整路由模式的规格说明、文档与测试用例，使其统一表达为 “v6.4+ data router 路由预渲染”。
- 在项目中 vendor React Router 官方 `flattenRoutes` 及其必要依赖，并让静态路径发现逻辑直接调用 vendored 实现。
- 保留当前 `createMemoryRouter` + `RouterProvider` 的预渲染主链路，只替换路径展平与候选路径收集方式。
- 使用 Vitest 补齐围绕 vendored `flattenRoutes` 语义的测试，覆盖可选段、无路径布局路由、绝对子路由、动态段和 `paths` 补充路径等场景。

## Capabilities

### New Capabilities
- 无

### Modified Capabilities
- `react-spa-prerender`: 将路由模式的支持边界明确为 React Router v6.4+ data router，并要求静态路径发现遵循 vendored React Router 官方 `flattenRoutes` 语义。

## Impact

- 影响 [`src/route-paths.ts`](/Users/wbbb/Projects/vite-plugin-react-ssg/src/route-paths.ts) 的核心路径发现实现与对应测试。
- 影响 [`src/config.ts`](/Users/wbbb/Projects/vite-plugin-react-ssg/src/config.ts)、[`README.md`](/Users/wbbb/Projects/vite-plugin-react-ssg/README.md) 和 [`README.zh-CN.md`](/Users/wbbb/Projects/vite-plugin-react-ssg/README.zh-CN.md) 中对路由模式支持范围的描述。
- 需要新增 vendored React Router 源码文件，并在实现中维护其来源与版本锚点。
- 影响集成测试夹具与新增单元测试，确保预渲染目标集合与官方路径展平语义一致。
