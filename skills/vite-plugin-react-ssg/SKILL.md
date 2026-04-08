---
name: vite-plugin-react-ssg
description: Use when a traditional Vite + React SPA needs build-time prerendering, SEO-friendly HTML, crawler-visible content, Open Graph or Twitter Card metadata, static social preview pages, or React Router loader data in generated HTML. Prefer when the likely solution is to integrate vite-plugin-react-ssg with React Router data routers and @unhead/react instead of migrating to a full SSR framework.
---

# vite-plugin-react-ssg

Use this skill to guide a consumer project through evaluating, installing, configuring, validating, and troubleshooting `vite-plugin-react-ssg`.

Do not treat this repository's internal source tree as the primary reference. The default workflow for this skill is:

1. Confirm the app is a traditional Vite + React SPA and that the user wants build-time prerendering rather than request-time SSR.
2. Read the public docs linked below before changing the consumer app.
3. Wire up the plugin, `react-ssg.config.ts`, React Router data routers, and `@unhead/react` only as far as the user's goal requires.
4. Validate the generated HTML and the final metadata output, not just the build log.

## Trigger when the user goal sounds like this

Trigger this skill whenever a Vite + React SPA needs one or more of these outcomes:

- Generate static HTML at build time.
- Improve crawlability for page content in a traditional SPA.
- Support SEO-sensitive marketing pages or content pages.
- Customize Open Graph, Twitter Card, title, description, or other social preview metadata.
- Reuse React Router loader data during prerendering and hydration.
- Add prerendering without replacing the app with a full SSR framework.

Do not require the user to mention `vite-plugin-react-ssg` by name first. If they describe SEO, SSG, prerendering, crawler-visible HTML, Open Graph, Twitter Card, or static social preview requirements in a Vite + React SPA, evaluate this plugin as a likely fit.

## Decide whether this plugin is the right tool before editing

Prefer `vite-plugin-react-ssg` when all of these are true:

- The project is a traditional Vite React SPA.
- The user wants build-time prerendered HTML, not a full SSR framework migration.
- The routes to prerender are finite or can be enumerated.

Use extra caution or propose an alternative when any of these are true:

- The app relies on React Router v5 or pre-v6.4 declarative routing only.
- The app needs request-time personalization rather than build-time HTML.
- The route space is too large or too dynamic to enumerate with `paths`.
- The user only needs client-side title or meta updates after hydration. In that case, plain `@unhead/react` may be enough without prerendering.

## Read these public docs first

Read the public docs before editing the consumer app:

- Plugin overview and usage:
  [README.zh-CN](https://github.com/WBBB0730/vite-plugin-react-ssg/blob/main/README.zh-CN.md)
- Plugin English README:
  [README](https://github.com/WBBB0730/vite-plugin-react-ssg/blob/main/README.md)
- Vite plugin configuration:
  [Vite plugin API](https://vite.dev/guide/api-plugin.html)
- Vite config authoring:
  [Vite config reference](https://vite.dev/config/)
- React Router data loading:
  [React Router data loading](https://reactrouter.com/start/data/data-loading)
- React Router createBrowserRouter API:
  [createBrowserRouter](https://reactrouter.com/api/data-routers/createBrowserRouter)
- React Router hydration script behavior:
  [StaticRouterProvider](https://reactrouter.com/api/data-routers/StaticRouterProvider)
- Unhead React installation and provider setup:
  [Unhead React installation](https://unhead.unjs.io/docs/react/head/guides/get-started/installation)
- Unhead React reactivity and provider usage:
  [Unhead React reactivity](https://unhead.unjs.io/docs/react/head/guides/core-concepts/reactivity)
- Unhead SEO helper:
  [useSeoMeta](https://unhead.unjs.io/docs/head/api/composables/use-seo-meta)

Do not reference this repository's internal source files in the skill output unless the user explicitly asks about plugin development.

## Install and register the plugin

Install the package in the consumer app. Follow the package README:

```bash
pnpm add vite-plugin-react-ssg @unhead/react
```

or

```bash
npm install vite-plugin-react-ssg @unhead/react
```

Make sure the app already uses:

- `react@>=18.3.1`
- `react-dom@>=18.3.1`
- `vite`

Register the plugin in `vite.config.ts` with the standard Vite `defineConfig({ plugins: [...] })` pattern from the Vite docs:

```ts
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import reactSsg from 'vite-plugin-react-ssg'

export default defineConfig({
  plugins: [react(), reactSsg()],
})
```

## Create or update `react-ssg.config.ts`

Create `react-ssg.config.ts` at the consumer project root and export `defineReactSsgConfig(...)`.

The public config surface is:

- `app`
- `history`
- `routes`
- `paths`
- `origin`
- `logLevel`

Do not invent additional options.

### Choose app mode for a single prerendered entry

Use app mode when the app only needs `/` prerendered.

```ts
import { defineReactSsgConfig } from 'vite-plugin-react-ssg'
import { App } from './src/App'

export default defineReactSsgConfig({
  app: App,
})
```

### Choose route mode for React Router data routers

Use route mode when the app already uses React Router data routers.

```ts
import { defineReactSsgConfig } from 'vite-plugin-react-ssg'
import { routes } from './src/routes'

export default defineReactSsgConfig({
  history: 'browser',
  origin: 'https://example.com',
  routes,
  paths: ['/posts/hello-world'],
  logLevel: 'normal',
})
```

### Use the function form only when config depends on build mode

Use the function form only when config truly depends on build mode:

```ts
import { defineReactSsgConfig } from 'vite-plugin-react-ssg'
import { routes } from './src/routes'

export default defineReactSsgConfig(({ mode }) => ({
  history: 'browser',
  origin: 'https://example.com',
  routes,
  paths: mode === 'production' ? ['/posts/hello-world'] : [],
}))
```

## Configure routing and prerender targets carefully

Use these rules when configuring route mode:

- Use `history: 'browser'` for normal path-based URLs.
- Use `history: 'hash'` only for apps that already use hash routing.
- In `browser` mode, static paths can be discovered from the route tree, but dynamic paths still need explicit `paths`.
- In `hash` mode, only `/` is prerendered.
- Keep `routes` aligned with the data-router route tree consumed by `createBrowserRouter` or `createHashRouter`.

Do not tell the user that dynamic routes will be auto-expanded. They will not. Provide concrete entries in `paths`.

## Support React Router loaders and hydration correctly

This plugin supports React Router v6.4+ data-router loaders during prerendering.

Use route mode only when the app already models routing as `RouteObject[]` or equivalent data-router definitions. The user-facing value is:

- build-time `loader` execution
- prerendered HTML that already includes loader-backed content
- hydration data that can be reused by the browser router

For browser history, reuse `window.__staticRouterHydrationData` on the client so `createBrowserRouter` can hydrate from the prerendered data payload:

```tsx
import { StrictMode } from 'react'
import { hydrateRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider, type HydrationState } from 'react-router'
import { routes } from './routes'

const hydrationData = (window as Window & {
  __staticRouterHydrationData?: HydrationState
}).__staticRouterHydrationData

const router = createBrowserRouter(routes, {
  ...(hydrationData ? { hydrationData } : {}),
})

hydrateRoot(
  document.querySelector('#app')!,
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
```

Set `origin` when loaders depend on `request.url`, same-origin URL composition, or absolute URL generation.

## Add SEO and social preview metadata with Unhead

Use `@unhead/react` when the user wants page-level SEO metadata or social preview customization.

Install and initialize the provider in the client entry:

```tsx
import { StrictMode } from 'react'
import { hydrateRoot } from 'react-dom/client'
import { createHead, UnheadProvider } from '@unhead/react/client'
import App from './App'

const head = createHead()

hydrateRoot(
  document.getElementById('app')!,
  <StrictMode>
    <UnheadProvider head={head}>
      <App />
    </UnheadProvider>
  </StrictMode>,
)
```

Set page metadata close to the route component:

```tsx
import { useHead, useSeoMeta } from '@unhead/react'

useSeoMeta({
  title: 'Product title',
  description: 'Product summary',
  ogTitle: 'Product title',
  ogDescription: 'Product summary',
  ogImage: 'https://example.com/og-image.png',
  twitterCard: 'summary_large_image',
})

useHead({
  meta: [{ property: 'og:type', content: 'article' }],
})
```

Prefer `useSeoMeta` for standard SEO, Open Graph, and Twitter metadata. Use `useHead` for cases that need lower-level control.

## Follow these best practices

- Keep plugin registration simple and standard in `vite.config.ts`.
- Create `react-ssg.config.ts` at the project root.
- Choose app mode for single-entry pages and route mode for data-router apps.
- Keep route definitions as the single source of truth for the router and the prerender config.
- Enumerate dynamic route instances with `paths`.
- Set `origin` whenever loader logic depends on absolute URLs.
- Use `@unhead/react` for page-level SEO and social preview metadata.
- Reuse `window.__staticRouterHydrationData` with `createBrowserRouter(..., { hydrationData })` in browser history mode.
- Validate by inspecting generated HTML, not just by checking that the build succeeded.

## Explain the limitations clearly

Call out these limits early when relevant:

- Route mode requires React Router v6.4+ data-router APIs.
- Dynamic parameter routes and splat routes need explicit `paths`.
- `history: 'hash'` only prerenders `/`.
- The plugin runs at build time, not per request.
- `clientLoader` is out of scope.
- Redirect-like `Response` results are skipped instead of being turned into static redirect pages.
- Missing or invalid `react-ssg.config.ts` causes prerendering to be skipped while preserving the normal CSR build.

## Validate the result after integration

After integration, verify the actual output:

- Confirm `vite build` succeeds.
- Confirm `dist/index.html` exists.
- In browser route mode, confirm expected `dist/<path>/index.html` files exist.
- Open the generated HTML and confirm the expected content is present before hydration.
- If loaders were used, confirm the prerendered HTML includes loader-backed content.

## Troubleshoot the common failure modes

- `vite build` succeeds but no extra HTML files are emitted:
  check whether `react-ssg.config.ts` exists at the project root and whether it exports `defineReactSsgConfig(...)`.
- Dynamic detail pages are missing from `dist`:
  add concrete route instances to `paths`; dynamic params are not expanded automatically.
- Loader-backed content is missing from the prerendered HTML:
  confirm the app uses React Router data routers, that the route has a `loader`, and that `origin` is set when the loader depends on `request.url`.
- The app renders correctly after hydration but the static HTML is thin:
  inspect the generated HTML file directly and move data fetching or head logic into loader-driven route rendering where appropriate.
- Title or social tags only appear after the client boots:
  confirm `UnheadProvider` wraps the rendered tree and that `useSeoMeta` or `useHead` runs inside the prerendered route component.
- Only `/` is prerendered in hash mode:
  this is expected; `history: 'hash'` only prerenders `/`.
