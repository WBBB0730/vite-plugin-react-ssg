## MODIFIED Requirements

### Requirement: 路由模式必须支持基于 v6.4+ data router routes 的静态路径预渲染
当用户提供 `history` 和 React Router v6.4+ data router 使用的 `RouteObject[]` 时，系统必须根据路由配置确定要预渲染的目标路径。

#### Scenario: browser history 自动发现静态路由
- **WHEN** 用户提供 `history: 'browser'` 和包含静态 `path` / `index` 的 data router `routes`
- **THEN** 系统必须自动发现可静态确定的路由路径
- **THEN** 系统必须为每个已发现的静态路径生成对应的 HTML 输出

#### Scenario: browser history 路径展平遵循 vendored flattenRoutes 语义
- **WHEN** 用户提供包含可选段、无路径布局路由、`index` 路由或绝对子路由的 data router `routes`
- **THEN** 系统必须使用 vendored React Router 官方 `flattenRoutes` 语义展平候选路径
- **THEN** 系统必须按照展平后的 branch path 判断哪些路径可自动参与预渲染

#### Scenario: browser history 自动发现时跳过动态路径分支
- **WHEN** 用户提供 `history: 'browser'`，且某些展平后的 branch path 含有动态参数段或 splat 段
- **THEN** 系统不得自动将这些动态路径加入预渲染目标集合
- **THEN** 系统必须要求用户通过 `paths` 显式补充具体路径实例

#### Scenario: browser history 通过 paths 补充动态路径
- **WHEN** 用户提供 `history: 'browser'`、包含动态参数的 data router `routes`，并声明 `paths`
- **THEN** 系统必须将 `paths` 中的路径加入预渲染目标集合
- **THEN** 系统必须为这些补充路径生成对应的 HTML 输出

#### Scenario: hash history 仅预渲染默认首屏
- **WHEN** 用户提供 `history: 'hash'` 和 data router `routes`
- **THEN** 系统必须只生成默认首屏所需的 `index.html`
- **THEN** 系统不得为各个 hash 片段生成独立 HTML 输出
