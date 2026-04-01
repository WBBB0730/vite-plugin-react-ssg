## Purpose

定义 `vite-plugin-react-ssg` 在 `v1` 阶段面向传统 Vite React SPA 的构建期预渲染能力边界，包括配置加载、路由与单页模式、路径发现以及失败回退语义。

## Requirements

### Requirement: 插件必须从独立配置文件加载预渲染规则
系统 MUST 从项目根目录的 `react-ssg.config.ts` 加载预渲染配置，并通过 `defineReactSsgConfig` 支持对象或函数两种导出形式。

#### Scenario: 缺少配置文件时回退到普通构建
- **WHEN** 用户启用了插件但项目根目录不存在 `react-ssg.config.ts`
- **THEN** 系统必须打印非致命错误提示
- **THEN** 系统必须跳过预渲染阶段
- **THEN** 系统必须保留普通 CSR 构建结果

#### Scenario: 配置函数返回有效配置
- **WHEN** `react-ssg.config.ts` 默认导出为 `defineReactSsgConfig(() => ({ ... }))`
- **THEN** 系统必须执行该函数并使用其返回值作为最终配置

#### Scenario: 配置非法时整体回退
- **WHEN** 用户同时提供 `routes` 与 `app`，或在路由模式下缺少 `history`
- **THEN** 系统必须打印非致命错误提示
- **THEN** 系统必须跳过预渲染阶段
- **THEN** 系统必须保留普通 CSR 构建结果

### Requirement: 插件入口模块必须保持薄封装
系统 MUST 让公共入口模块仅承担插件导出职责，并将构建期运行时编排委托给独立内部模块实现。

#### Scenario: 入口模块导出插件工厂
- **WHEN** 使用者从包入口加载默认导出插件
- **THEN** 系统必须仍然返回可用于 Vite `plugins` 的插件工厂
- **THEN** 入口模块不得内联配置加载、告警输出和预渲染编排细节

#### Scenario: 内部模块接管原有构建期编排
- **WHEN** 构建流程进入插件的 `closeBundle` 阶段
- **THEN** 系统必须继续执行与重构前一致的 SSR 跳过、配置加载、失败告警和预渲染调用链
- **THEN** 本次结构调整不得改变已有预渲染输出与回退语义

### Requirement: 包入口必须同时暴露插件工厂与配置辅助函数
系统 MUST 让使用者可以从包入口同时获取默认插件工厂和 `defineReactSsgConfig`，且不得因此破坏入口模块的薄封装约束。

#### Scenario: 从入口获取默认插件工厂
- **WHEN** 使用者从包入口加载默认导出
- **THEN** 系统必须返回可用于 Vite `plugins` 的插件工厂

#### Scenario: 从入口获取 defineReactSsgConfig
- **WHEN** 使用者从包入口按命名导入 `defineReactSsgConfig`
- **THEN** 系统必须暴露与 `./config` 子路径一致的同一辅助函数
- **THEN** 入口模块仍不得内联配置辅助函数实现

### Requirement: 路由模式必须支持基于 v6.4+ data router routes 的静态路径预渲染
当用户提供 `history` 和 React Router v6.4+ data router 使用的 `RouteObject[]` 时，系统 MUST 根据路由配置确定要预渲染的目标路径。

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

### Requirement: 单页模式必须支持直接预渲染单一应用入口
当用户提供 `app` 时，系统 MUST 将其视为单页入口，并仅为根路径生成静态 HTML。

#### Scenario: 组件类型作为单页入口
- **WHEN** 用户在配置中提供组件类型形式的 `app`
- **THEN** 系统必须将其作为根应用入口渲染
- **THEN** 系统必须生成根路径对应的 `index.html`

#### Scenario: 渲染函数作为单页入口
- **WHEN** 用户在配置中提供返回 React 节点的 `app` 函数
- **THEN** 系统必须执行该函数获取渲染入口
- **THEN** 系统必须生成根路径对应的 `index.html`

### Requirement: 页面级预渲染失败必须只影响当前目标
系统 MUST 在预渲染阶段区分配置级失败与页面级失败，并按目标粒度回退到 CSR。

#### Scenario: 单个目标路径渲染失败时继续其他路径
- **WHEN** 某个目标路径在预渲染过程中抛出异常
- **THEN** 系统必须记录该路径的失败信息
- **THEN** 系统必须跳过该路径的静态 HTML 输出
- **THEN** 系统必须继续处理其它目标路径

#### Scenario: 其它路径成功时仍输出预渲染结果
- **WHEN** 目标路径集合中部分路径成功、部分路径失败
- **THEN** 系统必须保留成功路径的静态 HTML 输出
- **THEN** 系统必须让失败路径继续依赖普通 CSR 入口运行
