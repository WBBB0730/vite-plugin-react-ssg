## ADDED Requirements

### Requirement: 路由模式必须在构建期执行 matched loaders
当用户在路由模式下提供 React Router v6.4+ data router `routes`，且某个目标路径命中包含 `loader` 的路由分支时，系统 MUST 在生成该路径静态 HTML 之前执行 matched `loader`，并让对应组件可以通过 React Router 官方数据 API 使用这些结果。

#### Scenario: 静态路由在预渲染前执行 loader
- **WHEN** 用户提供 `history: 'browser'` 的 data router `routes`，且某个静态路径分支声明了 `loader`
- **THEN** 系统必须在该目标路径写盘前执行对应的 matched `loader`
- **THEN** 该路径生成的 HTML 必须反映 `useLoaderData()` 等官方数据 API 读取到的结果

#### Scenario: paths 补充的动态路径执行 loader 并携带具体参数
- **WHEN** 用户通过 `paths` 为动态参数路由补充了具体目标路径，且匹配分支声明了 `loader`
- **THEN** 系统必须针对每个补充路径分别执行 matched `loader`
- **THEN** 生成的 HTML 必须反映与该具体路径参数相对应的数据结果

#### Scenario: loader 错误被 React Router 错误边界接管时仍可生成 HTML
- **WHEN** matched `loader` 抛出的错误被该路由分支的 React Router 错误边界处理并成功渲染错误页面
- **THEN** 系统必须继续输出该目标路径的静态 HTML
- **THEN** 系统不得仅因 `StaticHandlerContext.errors` 非空就将该目标路径视为 prerender 失败

### Requirement: 路由模式必须允许声明构建期请求源
系统 MUST 允许用户在路由模式配置中声明构建期请求源，以便为 `loader` 生成稳定的绝对 `Request.url`；未声明时系统 MUST 使用稳定的默认源地址。

#### Scenario: 用户显式声明 origin
- **WHEN** 用户在路由模式配置中提供合法的绝对 HTTP(S) `origin`
- **THEN** 系统必须使用该 `origin` 与目标路径拼接出传给 `loader` 的 `Request.url`
- **THEN** 同一次预渲染中所有目标路径都必须复用该配置生成各自的绝对 URL

#### Scenario: 用户未声明 origin
- **WHEN** 用户在路由模式配置中未提供 `origin`
- **THEN** 系统必须仍然为每个目标路径构造稳定的绝对 `Request.url`
- **THEN** 系统不得因为缺少 `origin` 而直接放弃执行 `loader`

#### Scenario: origin 非法时按配置级失败回退
- **WHEN** 用户在路由模式配置中提供了非法的 `origin`
- **THEN** 系统必须将该配置视为无效配置
- **THEN** 系统必须沿用现有配置级失败回退语义，跳过本次预渲染并保留普通 CSR 构建结果

### Requirement: 路由模式输出必须暴露可复用的 hydration data
系统 MUST 在路由模式的预渲染 HTML 中暴露 React Router 官方形态的 hydration data，使客户端可以通过 `createBrowserRouter(..., { hydrationData })` 复用构建期 `loader` 结果。

#### Scenario: 预渲染 HTML 注入官方 hydration data 全局变量
- **WHEN** 系统完成某个路由目标路径的预渲染
- **THEN** 输出 HTML 必须包含 `window.__staticRouterHydrationData`
- **THEN** 该 hydration data 必须至少包含 React Router 客户端创建 browser router 所需的 `loaderData`、`actionData` 和 `errors` 字段

#### Scenario: hydration data 脚本不得混入 React 挂载根节点标记
- **WHEN** 系统将路由模式的 SSR 结果写入最终 HTML 模板
- **THEN** `#app` 容器中的标记必须只包含 React 应用的服务端渲染结果
- **THEN** hydration data 脚本必须作为独立模板内容注入，而不是作为 React 根节点子内容被写入

### Requirement: 路由模式必须对短路 Response 按目标粒度回退
当 React Router 的静态查询阶段直接返回短路 `Response` 时，系统 MUST 将其视为当前目标路径不可静态化的结果，并按目标粒度回退，而不是阻断其它路径的预渲染。

#### Scenario: matched loader 返回 redirect Response
- **WHEN** 某个目标路径在静态查询阶段直接得到 redirect `Response`
- **THEN** 系统必须跳过该目标路径的静态 HTML 输出
- **THEN** 系统必须记录该目标路径的英文 warning，并继续处理其它目标路径

#### Scenario: 其它目标路径不受短路 Response 影响
- **WHEN** 同一次构建中只有部分目标路径触发短路 `Response`
- **THEN** 系统必须继续输出其它未触发短路 `Response` 的目标路径 HTML
- **THEN** 构建摘要中的 `prerendered` 与 `skipped` 统计必须准确反映该结果
