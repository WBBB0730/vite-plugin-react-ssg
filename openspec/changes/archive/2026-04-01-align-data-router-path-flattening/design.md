## Context

当前项目的路由模式已经在预渲染阶段直接使用 `createMemoryRouter` 与 `RouterProvider`，这意味着运行时能力天然站在 React Router v6.4+ data router 之上。但现有规格与文档只写成了“React Router routes”，没有清晰限定为 data router；同时，静态路径发现位于 [`src/route-paths.ts`](/Users/wbbb/Projects/vite-plugin-react-ssg/src/route-paths.ts)，实现是仓库自定义的递归算法，与 React Router 官方 `flattenRoutes` 在以下行为上可能不一致：

- 可选段 `?` 的展开顺序与结果
- 无路径布局路由是否参与候选路径集合
- 绝对子路由嵌套时的合法性校验
- `index` 路由与父路径的组合方式

由于预渲染输出路径集合必须尽量贴近 React Router 真实匹配语义，本次设计目标不是重做预渲染链路，而是将“支持边界”与“路径展平语义”都收敛到官方 data router 语义上。

## Goals / Non-Goals

**Goals:**

- 明确路由模式只支持 React Router v6.4+ data router `RouteObject[]`。
- 将静态路径发现改为基于 vendored React Router 官方 `flattenRoutes` 及其必要依赖。
- 保持当前预渲染主链路不变，仅替换路径展平与候选路径发现逻辑。
- 通过 Vitest 固化官方路径展平语义对应的行为测试。

**Non-Goals:**

- 不兼容 React Router v5 的 `<Switch>` / `<Route>` 路由树。
- 不兼容 React Router v6 早期基于 `<Routes>` / `<BrowserRouter>` 的声明式模式。
- 不引入 `matchRoutes`、`compilePath` 等本次实现不需要的整套 React Router 内部工具。
- 不改变 `createMemoryRouter` + `RouterProvider` 的 SSR 入口，也不引入 `loader` 静态执行。

## Decisions

### 1. 路由模式的产品边界收敛为 v6.4+ data router

决策：将路由模式的支持范围明确表述为“仅接受 React Router v6.4+ data router 使用的 `RouteObject[]`”，文档、规格和测试都以这一边界为准。

原因：

- 当前实现本身已经依赖 `createMemoryRouter` 与 `RouterProvider`，继续宣称更宽泛的 React Router 兼容范围会制造错误预期。
- 该边界与当前最小改动路径一致，不需要重新设计 SSR 入口或配置模型。

备选方案：

- 继续模糊地写成“支持 React Router routes”：实现边界与用户预期仍会错位。
- 扩展到兼容 v5 或 v6 早期声明式路由：需要引入新的配置模型或 SSR 入口，超出本次范围。

### 2. 只 vendor `flattenRoutes` 这条最小依赖链

决策：从 React Router 官方 `utils.ts` 中复制 `flattenRoutes` 及其必要依赖到项目内部 vendored 文件，只做导出整理，不改算法逻辑。

必要依赖包括：

- `explodeOptionalSegments`
- `computeScore`
- `joinPaths`
- `invariant`
- `RouteMeta` / `RouteBranch` 等最小内部类型

原因：

- 当前静态路径发现真正需要的是“官方 route tree flatten 语义”，不是整套 `matchRoutes` 能力。
- 维持最小 vendored 面积，降低后续同步官方源码时的维护成本。

备选方案：

- 复制整份 `utils.ts`：依赖面过大，而且会引入本次不需要的内部逻辑。
- 自己重写等价逻辑：继续承担与官方语义漂移的风险。

### 3. 由本地包装层负责“静态路径可输出性”判断

决策：vendored `flattenRoutes` 只负责把路由树按官方语义展平；哪些 branch.path 可以自动输出为静态 HTML，仍由 [`src/route-paths.ts`](/Users/wbbb/Projects/vite-plugin-react-ssg/src/route-paths.ts) 的本地包装逻辑判断。

原因：

- React Router 官方 `flattenRoutes` 负责展平，不负责 SSG 输出策略。
- 插件仍需额外排除包含动态参数 `:id` 或 splat `*` 的路径，并继续合并用户传入的 `paths`。
- 这样既能复用官方路径语义，又能保留本插件的产物生成规则。

备选方案：

- 完全放弃本地包装层：无法直接从 `flattenRoutes` 得到“哪些 path 要写入 HTML”。

### 4. 先以测试固化官方语义，再替换实现

决策：实现顺序遵循 TDD，先补 route-paths 单元测试和必要的集成测试，再引入 vendored 实现替换现有逻辑。

原因：

- 这样可以用测试锁住行为差异，避免 vendor 接入后引入隐性回归。
- 对可选段、pathless layout、绝对子路由这些边缘场景，先有测试比先写实现更稳妥。

备选方案：

- 先改实现再补测试：不利于识别当前行为与目标行为的真实差异。

## Risks / Trade-offs

- [vendored 官方源码后续可能与上游版本漂移] → 在 vendored 文件中记录来源 commit，并让测试覆盖关键语义，降低同步风险。
- [只复制最小依赖链仍需维护少量内部类型和工具函数] → 将 vendored 代码集中在单一目录，并避免手写“等价实现”。
- [收紧为 v6.4+ data router 可能与现有模糊文档不一致] → 在 README 与类型说明中明确边界，避免继续误导用户。
- [官方 `flattenRoutes` 会对非法绝对子路由抛错] → 通过测试先明确行为，并沿用现有页面级/配置级错误处理边界评估最终落点。

## Migration Plan

- 第一步：更新 OpenSpec 规格、设计与任务，明确新的支持边界。
- 第二步：补充 Vitest 用例，覆盖 vendored `flattenRoutes` 语义。
- 第三步：引入 vendored 代码并替换 [`src/route-paths.ts`](/Users/wbbb/Projects/vite-plugin-react-ssg/src/route-paths.ts) 实现。
- 第四步：更新 README、README.zh-CN 与必要的类型注释。
- 第五步：执行 `vitest`、`tsc --noEmit` 与构建验证。

## Open Questions

- 对于 `flattenRoutes` 抛出的非法嵌套路由错误，是直接沿用现有预渲染阶段 warning 回退，还是在配置校验阶段提前暴露，需要在实现阶段结合测试结果确认。
