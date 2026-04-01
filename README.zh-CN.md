# vite-plugin-react-ssg

一个面向传统 Vite React SPA 的构建期预渲染插件。它会在 `vite build` 之后把符合条件的页面渲染成静态 HTML，同时保留原有的 CSR 产物。

## 安装

```bash
pnpm add vite-plugin-react-ssg react-router
```

确保项目中已经安装并使用了 `react`、`react-dom`、`vite`。
路由模式要求 React Router v6.4+ 的 data router API。

## 使用方式

### 1. 在 Vite 中注册插件

```ts
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import reactSsg from 'vite-plugin-react-ssg'

export default defineConfig({
  plugins: [react(), reactSsg()],
})
```

### 2. 创建 `react-ssg.config.ts`

如果你的应用由 React Router v6.4+ data router 路由驱动，使用路由模式：

```ts
import { defineReactSsgConfig } from 'vite-plugin-react-ssg/config'
import { routes } from './src/routes'

export default defineReactSsgConfig({
  history: 'browser',
  routes,
  paths: ['/posts/hello-world'],
  logLevel: 'normal',
})
```

如果你只想预渲染单个根应用，使用单页模式：

```ts
import { defineReactSsgConfig } from 'vite-plugin-react-ssg/config'
import { App } from './src/App'

export default defineReactSsgConfig({
  app: App,
  logLevel: 'normal',
})
```

配置文件也支持函数写法：

```ts
import { defineReactSsgConfig } from 'vite-plugin-react-ssg/config'
import { routes } from './src/routes'

export default defineReactSsgConfig(({ mode }) => ({
  history: 'browser',
  routes,
  paths: mode === 'production' ? ['/posts/hello-world'] : [],
}))
```

## API 参考

### `reactSsg(): Plugin`

注册 Vite 插件。该插件只在构建阶段生效，并会在产物写入后从项目根目录加载 `react-ssg.config.ts`。

### `defineReactSsgConfig(config): ReactSsgUserConfigExport`

用于 `react-ssg.config.ts` 的类型辅助函数。

```ts
import type { ComponentType } from 'react'
import type { RouteObject } from 'react-router'

type HistoryMode = 'browser' | 'hash'
type ReactSsgLogLevel = 'silent' | 'normal' | 'verbose'

interface ReactSsgConfigContext {
  command: 'build'
  mode: string
}

interface RouteConfigInput {
  history: HistoryMode
  routes: RouteObject[]
  paths?: string[]
  logLevel?: ReactSsgLogLevel
}

interface AppConfigInput {
  app: ComponentType
  logLevel?: ReactSsgLogLevel
}

type ReactSsgUserConfig = RouteConfigInput | AppConfigInput

type ReactSsgUserConfigExport =
  | ReactSsgUserConfig
  | ((context: ReactSsgConfigContext) => ReactSsgUserConfig)
```

配置项说明：

- `history`：仅路由模式可用。`browser` 会根据 `routes` 自动发现静态路径；`hash` 只会预渲染 `/`。
- `routes`：仅路由模式可用，类型必须是 React Router v6.4+ data router 的 `RouteObject[]`。
- `paths`：仅路由模式可用，用于补充需要预渲染的额外路径，通常用于动态路由。
- `app`：仅单页模式可用，类型为 React 组件。
- `logLevel`：可选，控制构建日志粒度，默认值为 `normal`。
- `context.command`：固定为 `'build'`。
- `context.mode`：当前 Vite 的运行模式。

`logLevel` 可选值：

- `silent`：不输出标题、阶段日志、完成摘要和逐路由结果列表。
- `normal`：输出标题、阶段日志、警告以及单行完成摘要。
- `verbose`：先输出与 `normal` 完全一致的内容，再在完成摘要后追加 `Route (prerender)` 结果列表。

## 预渲染行为

- 单页模式只会预渲染 `/`。
- 路由模式下如果 `history: 'hash'`，只会预渲染 `/`。
- 路由模式下如果 `history: 'browser'`，会从 v6.4+ data router `routes` 自动发现静态路径，并与 `paths` 合并。
- `/` 会输出到 `dist/index.html`，其他路径会输出到 `dist/<path>/index.html`。

## 回退行为

- 如果缺少 `react-ssg.config.ts`，会跳过预渲染并保留普通 CSR 构建结果。
- 如果配置无效或加载失败，会跳过预渲染并保留普通 CSR 构建结果。
- 如果某个目标路径渲染失败，只会跳过当前路径，其它路径会继续预渲染。
- React Router v5 和 v6.4 之前的声明式路由模式不在支持范围内。

## 参与贡献

```bash
pnpm install
pnpm test -- --run
pnpm typecheck
pnpm build
```
