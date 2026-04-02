# vite-plugin-react-ssg

Build-time prerendering for traditional Vite React SPAs.

## Features

- prerender static HTML after `vite build`
- keep the original CSR assets while writing prerendered HTML files
- support React Router v6.4+ data routers and a single-app mode

## Getting started

### Installation

```bash
pnpm add vite-plugin-react-ssg
```

```bash
npm install vite-plugin-react-ssg
```

Make sure your project already uses `react`, `react-dom`, and `vite`.

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
  routes,
  paths: mode === 'production' ? ['/posts/hello-world'] : [],
  logLevel: 'normal',
}))
```

The plugin reads `react-ssg.config.ts` after `vite build` finishes and prerenders the configured targets into static HTML.

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

## Limitations

- Route mode requires React Router v6.4+ data router APIs
- Dynamic parameter routes and splat routes must be provided explicitly through `paths`
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
