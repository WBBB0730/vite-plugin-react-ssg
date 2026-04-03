# vite-plugin-react-ssg

面向传统 Vite React SPA 的构建期预渲染插件。

## 特性

- 在 `vite build` 后生成静态 HTML
- 保留原有 CSR 资源文件，并额外写入预渲染 HTML 文件
- 支持 React Router v6.4+ data router 和单页模式

## 快速开始

### 安装

```bash
pnpm add vite-plugin-react-ssg @unhead/react
```

```bash
npm install vite-plugin-react-ssg @unhead/react
```

确保项目中已经使用 `react@>=18.3.1`、`react-dom@>=18.3.1` 和 `vite`。

### 使用

先在 `vite.config.ts` 中注册插件。

```ts
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import reactSsg from 'vite-plugin-react-ssg'

export default defineConfig({
  plugins: [react(), reactSsg()],
})
```

在项目根目录创建 `react-ssg.config.ts`。

路由模式：

```ts
import { defineReactSsgConfig } from 'vite-plugin-react-ssg'
import { routes } from './src/routes'

export default defineReactSsgConfig({
  history: 'browser',
  routes,
  paths: ['/posts/hello-world'],
})
```

单页模式：

```ts
import { defineReactSsgConfig } from 'vite-plugin-react-ssg'
import { App } from './src/App'

export default defineReactSsgConfig({
  app: App,
})
```

函数形式：

```ts
import { defineReactSsgConfig } from 'vite-plugin-react-ssg'
import { routes } from './src/routes'

export default defineReactSsgConfig(({ mode }) => ({
  history: 'browser',
  routes,
  paths: mode === 'production' ? ['/posts/hello-world'] : [],
  logLevel: 'normal',
}))
```

插件会在 `vite build` 完成后读取 `react-ssg.config.ts`，并将配置中的目标预渲染为静态 HTML。

### 页面级 head 管理

如果你希望为页面或布局声明标题、TDK、Open Graph 等信息，请直接使用官方 `@unhead/react` API。

先在客户端入口初始化 `UnheadProvider`：

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createHead, UnheadProvider } from '@unhead/react/client'
import { createBrowserRouter, RouterProvider } from 'react-router'
import { routes } from './routes'

const head = createHead()
const router = createBrowserRouter(routes)

createRoot(document.querySelector('#app')!).render(
  <StrictMode>
    <UnheadProvider head={head}>
      <RouterProvider router={router} />
    </UnheadProvider>
  </StrictMode>,
)
```

然后在页面或布局组件里使用官方 Hook：

```tsx
import { useHead, useSeoMeta } from '@unhead/react'

export function PostPage() {
  useSeoMeta({
    title: '文章标题',
    description: '文章摘要',
  })

  useHead({
    meta: [
      { property: 'og:image', content: 'https://example.com/post-cover.png' },
    ],
  })

  return <main>...</main>
}
```

预渲染阶段会先把应用 HTML 注入 `index.html`，再把完整模板交给 Unhead 的 `transformHtmlTemplate()` 处理。插件不会在 Unhead 之上额外添加自定义的 head 合并规则。

## API 参考

以下配置项用于 `react-ssg.config.ts` 中的 `defineReactSsgConfig(...)`。

### `history`

仅路由模式可用，取值为 `browser` 或 `hash`。

当为 `browser` 时，插件会从 `routes` 中发现静态路径，并与 `paths` 合并。

当为 `hash` 时，插件只会预渲染 `/`。

### `routes`

仅路由模式可用，类型必须是基于 React Router v6.4+ data router API 的 `RouteObject[]`。

### `paths`

仅路由模式可用，用于补充需要预渲染的具体路径，通常用于动态路由。

### `app`

仅单页模式可用，表示要预渲染的根 React 组件。

### `logLevel`

控制预渲染日志输出，默认值为 `normal`。

- `silent`：不输出常规预渲染日志
- `normal`：输出开始阶段、警告和完成摘要
- `verbose`：在完成摘要后追加逐路由结果列表

## 注意事项

### 输出行为

- 单页模式会预渲染 `/`
- 路由模式下，`history: 'hash'` 会预渲染 `/`
- `/` 会写入 `dist/index.html`
- 其他路径会写入 `dist/<path>/index.html`

### 回退行为

- 如果缺少 `react-ssg.config.ts`，会跳过预渲染并保留普通 CSR 构建结果
- 如果配置无效或加载失败，会跳过预渲染并保留普通 CSR 构建结果
- 如果某个目标路径渲染失败，只会跳过当前路径，其它路径会继续处理

## 限制

- 路由模式要求使用 React Router v6.4+ data router API
- 包含动态参数或 splat 的路径不会被自动发现，需要通过 `paths` 显式补充
- React Router v5 和 v6.4 之前的声明式路由模式不在支持范围内

## 开发

```bash
# 安装项目依赖
pnpm install

# 执行一次 Vitest 测试套件
pnpm test -- --run

# 执行 TypeScript 类型检查
pnpm typecheck

# 构建产物输出
pnpm build
```
