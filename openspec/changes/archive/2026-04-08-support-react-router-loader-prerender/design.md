## Context

当前路由模式预渲染实现位于 [`src/prerender.tsx`](/Users/wbbb/Projects/vite-plugin-react-ssg/src/prerender.tsx)，核心流程是：

- 为目标路径创建 `createMemoryRouter(routes, { initialEntries })`
- 直接渲染 `<RouterProvider router={router} />`
- 将生成的应用 HTML 注入构建产物中的 `#app`

这条链路可以渲染纯组件路由，但不会按 React Router 官方 data-router SSR 语义先执行 matched `loader`。结果是：

- `useLoaderData()` 无法在构建期获得数据
- `router.state.loaderData` 在 SSR 渲染开始前仍为空
- README 中“支持 data router”的表述与实际能力存在偏差

另一个约束来自客户端接入方式。当前 README 与 playground 的 routes 示例仍使用 `createRoot(...)` 和 `createBrowserRouter(routes)`，没有接收预渲染阶段生成的 hydration data。若服务端改为真正执行 `loader`，但客户端仍然直接创建 router 而不传 `hydrationData`，首屏后仍可能重复执行 `loader`，削弱构建期取数的价值。

本次变更还需要保持以下边界：

- 单页 `app` 模式保持原样，不引入 React Router 专属配置。
- 现有静态路径发现与 `paths` 补充语义继续保留，不把“动态页面枚举”与“页面数据获取”混为一谈。
- 继续遵守“配置级失败整体回退、页面级失败按目标跳过”的容错模型。
- 覆盖 README、Vitest 与 playground，使文档、测试和真实示例一起收敛到新行为。

## Goals / Non-Goals

**Goals:**

- 让路由模式在构建期按 React Router 官方 SSR data-router 流程执行 matched `loader`，并将结果用于最终 HTML 渲染。
- 为构建期 `Request` 提供稳定、可配置的绝对 URL 来源，满足 `loader` 对 `request.url` 的常见依赖。
- 让路由模式输出可复用的 hydration data，并在 README / playground 中给出官方推荐的客户端 hydration 接法。
- 明确 `loader` 执行、短路响应、错误边界与日志回退之间的边界，降低实现阶段歧义。
- 用 Vitest 和真实 playground 构建覆盖 `loader` 成功、失败、动态路径与 hydration data 输出场景。

**Non-Goals:**

- 不为单页 `app` 模式设计新的数据预取 API。
- 不引入插件私有的“构建期取数 Hook”或自定义数据上下文层。
- 不在本次变更中增加异步 `paths` 工厂、自动枚举动态参数、或基于 CMS 扫描全部动态页面。
- 不在首版里实现静态 redirect 页生成；由 `loader` 返回的短路 `Response` 先按页面级跳过处理。
- 不在本次变更中扩展 `clientLoader`、`defer`/流式 SSR 或浏览器 API polyfill 支持。

## Decisions

### 1. 路由模式切换到 React Router 官方 SSR data-router 流程

决策：对每个目标路径，使用 `createStaticHandler(routes).query(request)` 先执行匹配分支上的 `loader`，然后基于返回的 `dataRoutes` 与 `StaticHandlerContext` 创建 `createStaticRouter(...)`，最后通过 `<StaticRouterProvider />` 执行服务端渲染。

原因：

- 这是 React Router 官方文档推荐的 SSR / pre-render 路线，和 data-router 能力边界完全一致。
- 它天然支持 `loaderData`、`errors`、`matches`、状态码等 SSR 上下文，不需要插件自己再模拟 data-router 状态机。
- 相比继续使用 `createMemoryRouter(...)`，这条链路能够真正覆盖用户最关心的“页面渲染前获取自定义数据”。

备选方案：

- 继续沿用 `createMemoryRouter(...) + <RouterProvider />`：实现最小，但无法真正兼容 `loader`。
- 新增插件私有 `getPrerenderData()` API：虽然可控，但会把插件带向另一套平行数据模型，偏离 React Router 官方实践。

### 2. 路由模式新增可选 `origin` 配置，用于构建期请求 URL 生成

决策：在路由模式配置中新增可选 `origin?: string`，仅接受绝对 HTTP(S) 源地址；构建期为每个 `targetPath` 构造 `new Request(new URL(targetPath, originOrDefault))`。未提供时默认回退到稳定占位源，例如 `http://localhost`。

原因：

- 许多 `loader` 会依赖 `request.url`、`new URL(request.url)`、同源 API 拼接等行为，没有稳定 origin 会让构建期语义过于脆弱。
- 把 `origin` 作为可选配置可以减少 breaking 面，同时允许对 URL 敏感的项目显式声明线上语义。
- 保持 `origin` 只属于 route mode，可以避免对单页模式暴露无意义配置。

备选方案：

- 强制要求用户必须配置 `origin`：语义更明确，但会提高接入门槛。
- 从 Vite `base` 或其它配置隐式推导：只能得到路径基线，无法可靠推导协议与主机。
- 允许任意完整 URL（含 pathname/query/hash）：灵活但更容易引入路径拼接歧义，首版不需要这么宽。

### 3. hydration data 与 React 根节点分离注入

决策：服务端渲染 `<StaticRouterProvider />` 时显式关闭其默认 hydration 脚本注入，然后由插件把 `StaticHandlerContext` 中的 hydration data 序列化为官方约定的 `window.__staticRouterHydrationData`，并在完整 HTML 模板的 `</body>` 前单独注入 `<script>`。

原因：

- 当前插件是把应用 HTML 填进 `#app` 容器；如果沿用 `StaticRouterProvider` 的默认脚本输出，脚本会落在 React 根节点内部，容易与客户端 `hydrateRoot(...)` 产生结构冲突。
- 单独注入脚本可以让 `#app` 内只包含 React 树，客户端 hydration 更干净，也更贴近传统 Vite SPA 的 DOM 结构。
- 继续使用 React Router 官方全局名 `window.__staticRouterHydrationData`，能够让 README 与 playground 直接沿用官方 `createBrowserRouter(routes, { hydrationData })` 接法。

备选方案：

- 允许 `StaticRouterProvider` 默认输出脚本并直接把整段内容塞进 `#app`：实现更省，但客户端 hydration 容易出现不一致。
- 自定义另一个全局变量名：会增加文档和用户心智成本，也偏离官方示例。

### 4. 将 `query(request)` 返回的短路 `Response` 视为页面级跳过，而不是静态落盘

决策：若 `query(request)` 直接返回 `Response`，首版将其视为当前目标路径不可静态化，记录 warning 并跳过该页面；而如果返回 `StaticHandlerContext` 且其中带有 `errors`，则继续按 React Router 的错误边界语义渲染 HTML，并计为成功预渲染。

原因：

- 对于 redirect 或其它短路 `Response`，静态文件落盘语义并不明确；首版强行生成 redirect HTML 会引入额外产品决策。
- React Router 的错误边界是 SSR 语义的一部分，只要能渲染出最终 HTML，就不应被简单归类为“失败页面”。
- 该策略与现有“页面级失败按目标跳过”的总体容错模型一致，同时把复杂的 redirect 静态化留给后续迭代。

备选方案：

- 任何短路 `Response` 都当作构建失败：过于激进，会影响其它页面产物。
- 为 redirect 自动生成 meta refresh 或 JS redirect 页面：体验更完整，但会明显扩大首版范围。

### 5. 以现有 `routes-browser` playground 为主示例，并同步升级 README 与测试基线

决策：复用现有 `playgrounds/routes-browser` 作为 loader 场景主示例，给首页或动态文章页接入 `loader`，同时更新客户端入口为 `hydrateRoot(...) + hydrationData`。Vitest 则新增三层覆盖：

- fixture 级：验证 `loader` 数据进入最终 HTML、hydration data 被注入、短路 `Response` 触发页面级 skip
- playground 级：验证 `routes-browser` 的真实构建产物包含 loader 结果
- 文档级：README 中补充 loader / hydrationData 的接入说明

原因：

- 复用现有 routes-browser 示例能保持 playground 数量稳定，同时把“标准 browser history + 动态路径 + head + loader”集中到一个最有代表性的示例里。
- README、playground 与测试同步调整，能减少“实现支持了，文档仍停留在旧写法”的断层。

备选方案：

- 新增一个独立 loader playground：表达更聚焦，但会增加维护面和测试时间。
- 仅更新 README 不更新 playground：示例的真实性不足，难以长期回归验证。

### 6. 优先直接使用官方实现，必要时 vendoring 官方源码

决策：本次实现遵循以下优先级：

- 能直接通过 React Router 官方公开 API 完成的能力，必须直接使用官方 API
- 若关键行为依赖未公开导出的内部 helper，必须优先像现有 [`src/vendor/react-router/flatten-routes.ts`](/Users/wbbb/Projects/vite-plugin-react-ssg/src/vendor/react-router/flatten-routes.ts) 一样 vendoring 对应上游源码
- 非必要情况下不得自行手写与 React Router 官方实现等价的一套逻辑

原因：

- 这能最大限度保持与 React Router 官方语义一致，减少后续版本漂移。
- 当前仓库已经通过 vendored `flattenRoutes` 证明了这种策略在本项目中是可接受且可维护的。
- 对 hydration data、静态查询结果和内部序列化这类容易出现细节偏差的逻辑，自己实现一份的维护成本和风险都更高。

备选方案：

- 直接手写一版满足当前测试的等价逻辑：短期可能更快，但与上游实现发生漂移的风险最高。
- 无差别 vendoring 大段 React Router 服务端渲染代码：一致性更强，但会引入不必要的维护负担；因此仍以“先用公开 API，缺什么再 vendoring”作为原则。

## Risks / Trade-offs

- [已有项目中的 `loader` 过去不会在构建期执行，现在会被真实执行，可能暴露副作用或浏览器依赖] → 在 README 与 proposal 中明确行为变化，并保持页面级失败只影响当前目标。
- [未显式配置 `origin` 的项目可能在依赖绝对 URL 时得到占位源地址] → 提供默认值保证功能可用，同时在 README 中明确推荐对 URL 敏感场景显式配置 `origin`。
- [redirect 等短路 `Response` 首版无法直接静态化] → 先按 warning + skip 处理，把能力边界写进文档与 spec。
- [hydration data 序列化与注入不当可能引发 XSS 或 hydration mismatch] → 复用 React Router 官方 hydration data 结构，并让脚本注入位置固定在 `</body>` 前，避免进入 React 根节点。
- [README、playground、测试三者如果只改其中一部分，容易形成新的行为漂移] → 把三者都纳入同一 change 的 tasks 与 spec delta。

## Migration Plan

1. 在实现阶段先用 Vitest 补齐 loader 相关失败用例，覆盖 HTML 渲染、hydration data 注入和短路 `Response` 跳过。
2. 改造 route mode 预渲染主链路，接入 `createStaticHandler` / `createStaticRouter` / `StaticRouterProvider`。
3. 扩展配置类型与校验逻辑，加入 route mode 的可选 `origin`。
4. 更新 `routes-browser` playground 与 `README.md` / `README.zh-CN`，改为 loader + hydrationData 的官方接法。
5. 跑通 Vitest、类型检查与真实 playground 构建；若需要回滚，可先移除新配置与 SSR data-router 主链路，恢复到原有 memory router 渲染方式。

## Open Questions

- 无。首版已经明确选择“支持 matched `loader`、不处理静态 redirect 页、不扩展到 `clientLoader`/`defer`”，足以进入实现阶段。
