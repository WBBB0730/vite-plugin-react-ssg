# vite-plugin-react-ssg

A build-time prerendering plugin for traditional Vite React SPAs. It runs after `vite build`, renders eligible pages into static HTML, and preserves the original CSR output.

## Installation

```bash
pnpm add vite-plugin-react-ssg react-router
```

Make sure your project already installs and uses `react`, `react-dom`, and `vite`.

## Usage

### 1. Register the plugin in Vite

```ts
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import reactSsg from 'vite-plugin-react-ssg'

export default defineConfig({
  plugins: [react(), reactSsg()],
})
```

### 2. Create `react-ssg.config.ts`

Use route mode when your app is driven by React Router routes:

```ts
import { defineReactSsgConfig } from 'vite-plugin-react-ssg/config'
import { routes } from './src/routes'

export default defineReactSsgConfig({
  history: 'browser',
  routes,
  paths: ['/posts/hello-world'],
})
```

Use app mode when you want to prerender a single root app:

```ts
import { defineReactSsgConfig } from 'vite-plugin-react-ssg/config'
import { App } from './src/App'

export default defineReactSsgConfig({
  app: App,
})
```

The config file also supports the function form:

```ts
import { defineReactSsgConfig } from 'vite-plugin-react-ssg/config'

export default defineReactSsgConfig(({ mode }) => ({
  history: 'browser',
  routes,
  paths: mode === 'production' ? ['/posts/hello-world'] : [],
}))
```

## API Reference

### `reactSsg(): Plugin`

Registers the Vite plugin. The plugin only applies during build and loads `react-ssg.config.ts` from the project root after the bundle is written.

### `defineReactSsgConfig(config): ReactSsgUserConfigExport`

Type helper for `react-ssg.config.ts`.

```ts
import type { ComponentType } from 'react'
import type { RouteObject } from 'react-router'

type HistoryMode = 'browser' | 'hash'

interface ReactSsgConfigContext {
  command: 'build'
  mode: string
}

interface RouteConfigInput {
  history: HistoryMode
  routes: RouteObject[]
  paths?: string[]
}

interface AppConfigInput {
  app: ComponentType
}

type ReactSsgUserConfig = RouteConfigInput | AppConfigInput

type ReactSsgUserConfigExport =
  | ReactSsgUserConfig
  | ((context: ReactSsgConfigContext) => ReactSsgUserConfig)
```

Config fields:

- `history`: Route mode only. `browser` discovers static paths from `routes`; `hash` only prerenders `/`.
- `routes`: Route mode only. Must be a React Router `RouteObject[]`.
- `paths`: Route mode only. Extra paths to prerender, typically used for dynamic routes.
- `app`: App mode only. A React component used as the single-page entry.
- `context.command`: Always `'build'`.
- `context.mode`: The current Vite mode.

## Prerendering Behavior

- In app mode, only `/` is prerendered.
- In route mode with `history: 'hash'`, only `/` is prerendered.
- In route mode with `history: 'browser'`, static paths are discovered from `routes` and merged with `paths`.
- `/` is written to `dist/index.html`; other paths are written to `dist/<path>/index.html`.

## Fallback Behavior

- If `react-ssg.config.ts` is missing, prerendering is skipped and the normal CSR build output is kept.
- If the config is invalid or cannot be loaded, prerendering is skipped and the normal CSR build output is kept.
- If a single target path fails to render, only that path is skipped and the plugin continues prerendering the rest.

## Contributing

```bash
pnpm install
pnpm test -- --run
pnpm typecheck
pnpm build
```
