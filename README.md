# vite-plugin-react-ssg

[![npm version](https://img.shields.io/npm/v/vite-plugin-react-ssg)](https://www.npmjs.com/package/vite-plugin-react-ssg)
[![license](https://img.shields.io/npm/l/vite-plugin-react-ssg)](./LICENSE)

Build-time prerendering for traditional Vite React SPAs.

[中文文档](./README.zh-CN.md)

## Features

- Prerender static HTML after `vite build`
- Keep original CSR assets while writing prerendered HTML files
- Support React Router v6.4+ data routers with build-time `loader` execution
- Support single-app mode

## Quick Start

### Install

```bash
npm install vite-plugin-react-ssg
```

> Requires `react >= 18.3.1`, `react-dom >= 18.3.1`, and `vite`.

### Skills

```bash
npx skills add wbbb0730/vite-plugin-react-ssg --skill vite-plugin-react-ssg
```

### Configure Vite

```ts
// vite.config.ts
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import reactSsg from 'vite-plugin-react-ssg'

export default defineConfig({
  plugins: [react(), reactSsg()],
})
```

### Configure SSG

Create `react-ssg.config.ts` in your project root.

**Route mode** — prerender multiple paths with React Router:

```ts
import { defineReactSsgConfig } from 'vite-plugin-react-ssg'
// routes is a React Router RouteObject[] using v6.4+ data router APIs
import { routes } from './src/routes'

export default defineReactSsgConfig({
  history: 'browser',
  origin: 'https://example.com',
  routes,
  paths: ['/posts/hello-world'],
})
```

**App mode** — prerender a single root component:

```ts
import { defineReactSsgConfig } from 'vite-plugin-react-ssg'
import { App } from './src/App'

export default defineReactSsgConfig({
  app: App,
})
```

> The config also accepts a function: `defineReactSsgConfig(({ mode }) => ({ ... }))`.

## API Reference

Options passed to `defineReactSsgConfig(...)` in `react-ssg.config.ts`.

| Option | Mode | Description |
| --- | --- | --- |
| `history` | Route | `'browser'` or `'hash'`. With `hash`, only `/` is prerendered. |
| `routes` | Route | React Router `RouteObject[]` (v6.4+ data router APIs). |
| `paths` | Route | Extra concrete paths to prerender (e.g. dynamic routes). |
| `origin` | Route | Absolute HTTP(S) origin for build-time `Request.url` in loaders. |
| `app` | App | Root React component to prerender. |
| `logLevel` | Both | `'silent'` \| `'normal'` (default) \| `'verbose'`. |

## Advanced Usage

### Loader + Dynamic Paths

A common pattern: fetch a list of slugs at build time and prerender each one with its loader.

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
  // Fetch all slugs at build time to generate paths
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

### Head Management

Use [`@unhead/react`](https://unhead.unjs.io/docs/getting-started/setup/react) for page-level `<head>` tags. The prerender pipeline delegates head merging to Unhead's `transformHtmlTemplate()`.

Set up `UnheadProvider` in your client entry. When using loaders, hydrate with `window.__staticRouterHydrationData` to reuse prerendered data:

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

Then declare head tags in any page component:

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

## Output & Fallbacks

- `/` is written to `dist/index.html`; other paths to `dist/<path>/index.html`
- Missing or invalid `react-ssg.config.ts` → prerendering is skipped, normal CSR output is kept
- A single path failure does not block other paths

## Limitations

- Requires React Router v6.4+ data router APIs (v5 and pre-v6.4 declarative routers are not supported)
- Dynamic parameter and splat routes must be listed explicitly in `paths`
- Only server-side `loader` is executed; `clientLoader` is not supported
- Redirect responses from static query are skipped, not emitted as static pages

## License

[MIT](./LICENSE)
