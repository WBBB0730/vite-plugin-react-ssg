# vite-plugin-react-ssg

Build-time prerendering for traditional Vite React SPAs.

## Features

- prerender static HTML after `vite build`
- keep the original CSR assets while writing prerendered HTML files
- support React Router v6.4+ data routers, including build-time `loader` execution
- support a single-app mode

## Getting started

### Installation

```bash
pnpm add vite-plugin-react-ssg @unhead/react
```

```bash
npm install vite-plugin-react-ssg @unhead/react
```

Make sure your project already uses `react@>=18.3.1`, `react-dom@>=18.3.1`, and `vite`.

### Usage

Register the plugin in `vite.config.ts`.

```ts
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import reactSsg from 'vite-plugin-react-ssg'

export default defineConfig({
  plugins: [react(), reactSsg()],
})
```

Create `react-ssg.config.ts` in your project root.

Route mode:

```ts
import { defineReactSsgConfig } from 'vite-plugin-react-ssg'
import { routes } from './src/routes'

export default defineReactSsgConfig({
  history: 'browser',
  origin: 'https://example.com',
  routes,
  paths: ['/posts/hello-world'],
})
```

App mode:

```ts
import { defineReactSsgConfig } from 'vite-plugin-react-ssg'
import { App } from './src/App'

export default defineReactSsgConfig({
  app: App,
})
```

Function form:

```ts
import { defineReactSsgConfig } from 'vite-plugin-react-ssg'
import { routes } from './src/routes'

export default defineReactSsgConfig(({ mode }) => ({
  history: 'browser',
  origin: 'https://example.com',
  routes,
  paths: mode === 'production' ? ['/posts/hello-world'] : [],
  logLevel: 'normal',
}))
```

The plugin reads `react-ssg.config.ts` after `vite build` finishes and prerenders the configured targets into static HTML.

Route mode executes the matched React Router `loader` functions before each target path is rendered. A minimal loader route can look like this:

```tsx
import { useLoaderData, type LoaderFunctionArgs } from 'react-router'

async function postLoader({ params, request }: LoaderFunctionArgs) {
  const slug = params.slug ?? 'unknown'
  const origin = new URL(request.url).origin

  return {
    slug,
    origin,
  }
}

function PostPage() {
  const data = useLoaderData() as {
    slug: string
    origin: string
  }

  return <main>{data.slug} from {data.origin}</main>
}

export const routes = [
  {
    path: '/posts/:slug',
    loader: postLoader,
    Component: PostPage,
  },
]
```

If your loaders depend on `request.url` or same-origin URL composition, set `origin` in `react-ssg.config.ts` so the build-time request URL is deterministic.

### Page-level head management

Use the official `@unhead/react` APIs if you want page-specific titles, meta tags, and social tags.

Initialize `UnheadProvider` in your client entry. If route mode uses loaders during prerendering, hydrate the browser router with `window.__staticRouterHydrationData` so the client can reuse the prerendered data:

```tsx
import { StrictMode } from 'react'
import { hydrateRoot } from 'react-dom/client'
import { createHead, UnheadProvider } from '@unhead/react/client'
import { createBrowserRouter, RouterProvider, type HydrationState } from 'react-router'
import { routes } from './routes'

const head = createHead()
const hydrationData = (window as Window & {
  __staticRouterHydrationData?: HydrationState
}).__staticRouterHydrationData
const router = createBrowserRouter(routes, { hydrationData })

hydrateRoot(document.querySelector('#app')!,
  <StrictMode>
    <UnheadProvider head={head}>
      <RouterProvider router={router} />
    </UnheadProvider>
  </StrictMode>,
)
```

Then declare head tags in pages or layouts:

```tsx
import { useHead, useSeoMeta } from '@unhead/react'

export function PostPage() {
  useSeoMeta({
    title: 'Post title',
    description: 'Post summary',
  })

  useHead({
    meta: [
      { property: 'og:image', content: 'https://example.com/post-cover.png' },
    ],
  })

  return <main>...</main>
}
```

The prerender pipeline injects your app HTML into `index.html` and then delegates the final template/head merge to Unhead's `transformHtmlTemplate()`. The plugin does not add custom head merge rules on top of Unhead.

## API Reference

These options are passed to `defineReactSsgConfig(...)` in `react-ssg.config.ts`.

### `history`

Route mode only. Accepts `browser` or `hash`.

With `browser`, the plugin discovers static paths from `routes` and merges `paths`.

With `hash`, the plugin only prerenders `/`.

### `routes`

Route mode only. Must be a React Router `RouteObject[]` built with the v6.4+ data router APIs.

### `paths`

Route mode only. Adds extra concrete paths to prerender, typically for dynamic routes.

### `origin`

Route mode only. Sets the absolute HTTP(S) origin used to construct the build-time `Request.url` passed to React Router loaders.

### `app`

App mode only. A root React component to prerender.

### `logLevel`

Controls prerender logs. Defaults to `normal`.

- `silent`: suppress regular prerender logs
- `normal`: print the start phase, warnings, and a completed summary
- `verbose`: add a per-route result list after the completed summary

## Notes

### Output

- App mode prerenders `/`
- Route mode with `history: 'hash'` prerenders `/`
- `/` is written to `dist/index.html`
- Other paths are written to `dist/<path>/index.html`

### Fallbacks

- Missing `react-ssg.config.ts` skips prerendering and keeps the normal CSR build output
- Invalid or unloadable config skips prerendering and keeps the normal CSR build output
- If one target path fails to render, only that path is skipped and the rest continue
- If React Router static query returns a `Response` such as a redirect, only that target path is skipped and the rest continue

## Limitations

- Route mode requires React Router v6.4+ data router APIs
- Dynamic parameter routes and splat routes must be provided explicitly through `paths`
- Route mode only runs matched server-side `loader` functions; `clientLoader` is out of scope
- Redirect-like `Response` results from static query are skipped instead of being emitted as static redirect pages
- React Router v5 and pre-v6.4 declarative router setups are out of scope

## Development

```bash
# Install project dependencies
pnpm install

# Run the Vitest test suite once
pnpm test -- --run

# Run TypeScript type checking
pnpm typecheck

# Build the package output
pnpm build
```
