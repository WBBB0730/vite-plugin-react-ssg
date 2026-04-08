# vite-plugin-react-ssg

[![npm version](https://img.shields.io/npm/v/vite-plugin-react-ssg)](https://www.npmjs.com/package/vite-plugin-react-ssg)
[![license](https://img.shields.io/npm/l/vite-plugin-react-ssg)](./LICENSE)

面向传统 Vite React SPA 的构建期预渲染插件。

[English](./README.md)

## 特性

- 在 `vite build` 后生成静态 HTML
- 保留原有 CSR 资源，同时写入预渲染 HTML
- 支持 React Router v6.4+ data router，构建期执行 `loader`
- 支持单页模式

## 快速开始

### 安装

```bash
npm install vite-plugin-react-ssg
```

> 需要 `react >= 18.3.1`、`react-dom >= 18.3.1` 和 `vite`。

### 技能

```bash
npx skills add wbbb0730/vite-plugin-react-ssg --skill vite-plugin-react-ssg
```

### 配置 Vite

```ts
// vite.config.ts
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import reactSsg from 'vite-plugin-react-ssg'

export default defineConfig({
  plugins: [react(), reactSsg()],
})
```

### 配置 SSG

在项目根目录创建 `react-ssg.config.ts`。

**路由模式** — 使用 React Router 预渲染多个路径：

```ts
import { defineReactSsgConfig } from 'vite-plugin-react-ssg'
// routes 是 React Router v6.4+ data router API 的 RouteObject[]
import { routes } from './src/routes'

export default defineReactSsgConfig({
  history: 'browser',
  origin: 'https://example.com',
  routes,
  paths: ['/posts/hello-world'],
})
```

**单页模式** — 预渲染单个根组件：

```ts
import { defineReactSsgConfig } from 'vite-plugin-react-ssg'
import { App } from './src/App'

export default defineReactSsgConfig({
  app: App,
})
```

> 配置也支持函数形式：`defineReactSsgConfig(({ mode }) => ({ ... }))`。

## API 参考

以下选项用于 `react-ssg.config.ts` 中的 `defineReactSsgConfig(...)`。

| 选项 | 模式 | 说明 |
| --- | --- | --- |
| `history` | 路由 | `'browser'` 或 `'hash'`。`hash` 模式只预渲染 `/`。 |
| `routes` | 路由 | React Router `RouteObject[]`（v6.4+ data router API）。 |
| `paths` | 路由 | 额外需要预渲染的具体路径（通常用于动态路由）。 |
| `origin` | 路由 | 构建期 loader `Request.url` 使用的绝对 HTTP(S) 源地址。 |
| `app` | 单页 | 要预渲染的根 React 组件。 |
| `logLevel` | 通用 | `'silent'` \| `'normal'`（默认）\| `'verbose'`。 |

## 进阶用法

### Loader + 动态路径

常见模式：构建期获取所有 slug 列表，逐一预渲染并执行对应 loader。

```ts
// src/routes.ts
import { useLoaderData, type RouteObject, type LoaderFunctionArgs } from 'react-router'

async function postLoader({ params, request }: LoaderFunctionArgs) {
  const origin = new URL(request.url).origin
  const res = await fetch(`${origin}/api/posts/${params.slug}`)
  return res.json()
}

function PostPage() {
  const post = useLoaderData() as { title: string; content: string }
  return <article><h1>{post.title}</h1><p>{post.content}</p></article>
}

export const routes: RouteObject[] = [
  { path: '/posts/:slug', loader: postLoader, Component: PostPage },
]
```

```ts
// react-ssg.config.ts
import { defineReactSsgConfig } from 'vite-plugin-react-ssg'
import { routes } from './src/routes'

export default defineReactSsgConfig(async () => {
  // 构建期获取所有 slug 生成路径
  const slugs: string[] = await fetch('https://example.com/api/posts')
    .then(r => r.json())
    .then(posts => posts.map((p: { slug: string }) => `/posts/${p.slug}`))

  return {
    history: 'browser',
    origin: 'https://example.com',
    routes,
    paths: slugs,
  }
})
```

### Head 管理

使用 [`@unhead/react`](https://unhead.unjs.io/docs/getting-started/setup/react) 管理页面级 `<head>` 标签。预渲染阶段会将 head 合并委托给 Unhead 的 `transformHtmlTemplate()`。

在客户端入口初始化 `UnheadProvider`。使用 loader 时，通过 `window.__staticRouterHydrationData` 复用预渲染数据：

```tsx
// src/main.tsx
import { StrictMode } from 'react'
import { hydrateRoot } from 'react-dom/client'
import { createHead, UnheadProvider } from '@unhead/react/client'
import { createBrowserRouter, RouterProvider } from 'react-router'
import { routes } from './routes'

const head = createHead()
const router = createBrowserRouter(routes, {
  hydrationData: (window as any).__staticRouterHydrationData,
})

hydrateRoot(document.querySelector('#app')!,
  <StrictMode>
    <UnheadProvider head={head}>
      <RouterProvider router={router} />
    </UnheadProvider>
  </StrictMode>,
)
```

然后在页面组件中声明 head 标签：

```tsx
import { useSeoMeta } from '@unhead/react'

export function PostPage() {
  const post = useLoaderData() as { title: string; summary: string }

  useSeoMeta({
    title: post.title,
    description: post.summary,
    ogTitle: post.title,
    ogDescription: post.summary,
  })

  return <article>...</article>
}
```

## 输出与回退

- `/` 写入 `dist/index.html`，其他路径写入 `dist/<path>/index.html`
- 缺少或无效的 `react-ssg.config.ts` → 跳过预渲染，保留正常 CSR 构建结果
- 单个路径渲染失败不会阻断其他路径

## 限制

- 需要 React Router v6.4+ data router API（不支持 v5 及 v6.4 之前的声明式路由）
- 动态参数和 splat 路由需要通过 `paths` 显式声明
- 仅执行服务端 `loader`，不支持 `clientLoader`
- 静态查询返回 redirect 类 `Response` 时会跳过，不会生成静态跳转页

## 许可证

[MIT](./LICENSE)
