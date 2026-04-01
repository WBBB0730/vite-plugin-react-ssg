import { mkdtemp, mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { build } from 'vite'
import { afterEach, describe, expect, test, vi } from 'vitest'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const tempRoot = path.join(repoRoot, '.tmp-tests')
const pluginEntryUrl = pathToFileURL(path.join(repoRoot, 'src/index.ts')).href
const configEntryUrl = pathToFileURL(path.join(repoRoot, 'src/config.ts')).href

interface FixtureProject {
  root: string
  readDistFile: (filePath: string) => Promise<string>
  hasDistFile: (filePath: string) => Promise<boolean>
}

async function writeProjectFiles(
  root: string,
  files: Record<string, string>,
): Promise<void> {
  for (const [relativePath, content] of Object.entries(files)) {
    const absolutePath = path.join(root, relativePath)
    await mkdir(path.dirname(absolutePath), { recursive: true })
    await writeFile(absolutePath, content)
  }
}

async function createProject(files: Record<string, string>): Promise<FixtureProject> {
  await mkdir(tempRoot, { recursive: true })
  const root = await mkdtemp(path.join(tempRoot, 'fixture-'))

  await writeProjectFiles(root, {
    'index.html': [
      '<!doctype html>',
      '<html lang="zh-CN">',
      '  <head>',
      '    <meta charset="UTF-8" />',
      '    <meta name="viewport" content="width=device-width, initial-scale=1.0" />',
      '    <title>fixture</title>',
      '  </head>',
      '  <body>',
      '    <div id="app"></div>',
      '    <script type="module" src="/src/main.tsx"></script>',
      '  </body>',
      '</html>',
    ].join('\n'),
    'vite.config.ts': [
      "import react from '@vitejs/plugin-react'",
      "import { defineConfig } from 'vite'",
      `import reactSsg from ${JSON.stringify(pluginEntryUrl)}`,
      '',
      'export default defineConfig({',
      '  plugins: [react(), reactSsg()],',
      '})',
      '',
    ].join('\n'),
    ...files,
  })

  return {
    root,
    async readDistFile(filePath: string) {
      return readFile(path.join(root, 'dist', filePath), 'utf8')
    },
    async hasDistFile(filePath: string) {
      try {
        await stat(path.join(root, 'dist', filePath))
        return true
      }
      catch {
        return false
      }
    },
  }
}

async function buildProject(root: string): Promise<void> {
  await build({
    root,
    configFile: path.join(root, 'vite.config.ts'),
    logLevel: 'silent',
  })
}

function collectMessages(spy: ReturnType<typeof vi.spyOn>): string[] {
  return spy.mock.calls.flatMap(call =>
    call.map(value => String(value)),
  )
}

function expectMessages(
  spy: ReturnType<typeof vi.spyOn>,
  messages: string[],
): void {
  expect(collectMessages(spy)).toEqual(messages)
}

function createDataRouterModeFiles(options: {
  history: 'browser' | 'hash'
  configBody: string
  routesBody: string
}): Record<string, string> {
  const routerFactory =
    options.history === 'browser' ? 'createBrowserRouter' : 'createHashRouter'

  return {
    'src/main.tsx': [
      "import { StrictMode } from 'react'",
      "import { createRoot } from 'react-dom/client'",
      `import { ${routerFactory}, RouterProvider } from 'react-router'`,
      "import { routes } from './routes'",
      '',
      `const router = ${routerFactory}(routes)`,
      '',
      "createRoot(document.querySelector('#app')!).render(",
      '  <StrictMode>',
      '    <RouterProvider router={router} />',
      '  </StrictMode>,',
      ')',
      '',
    ].join('\n'),
    'src/routes.tsx': options.routesBody,
    'react-ssg.config.ts': [
      `import { defineReactSsgConfig } from ${JSON.stringify(configEntryUrl)}`,
      "import { routes } from './src/routes'",
      '',
      options.configBody,
      '',
    ].join('\n'),
  }
}

afterEach(async () => {
  await rm(tempRoot, { recursive: true, force: true })
  vi.restoreAllMocks()
})

describe('vite-plugin-react-ssg', () => {
  test('缺少 react-ssg.config.ts 时回退到普通 CSR 构建', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {})
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const project = await createProject({
      'src/main.tsx': [
        "import { StrictMode } from 'react'",
        "import { createRoot } from 'react-dom/client'",
        '',
        "function App() { return <h1>CSR 首页</h1> }",
        '',
        "createRoot(document.querySelector('#app')!).render(",
        '  <StrictMode>',
        '    <App />',
        '  </StrictMode>,',
        ')',
        '',
      ].join('\n'),
    })

    await buildProject(project.root)

    const html = await project.readDistFile('index.html')

    expect(html).not.toContain('CSR 首页')
    expect(warn).toHaveBeenCalled()
    expectMessages(log, ['▲ React SSG', ''])
    expectMessages(warn, [
      '⚠ Skipping prerendering because react-ssg.config.ts was not found. Keeping the default CSR build output.',
    ])
  })

  test('非法配置时回退到普通 CSR 构建', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {})
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const project = await createProject({
      'src/main.tsx': [
        "import { StrictMode } from 'react'",
        "import { createRoot } from 'react-dom/client'",
        "import { App } from './App'",
        '',
        "createRoot(document.querySelector('#app')!).render(",
        '  <StrictMode>',
        '    <App />',
        '  </StrictMode>,',
        ')',
        '',
      ].join('\n'),
      'src/App.tsx': 'export function App() { return <h1>非法配置页面</h1> }\n',
      'src/routes.tsx': 'export const routes = []\n',
      'react-ssg.config.ts': [
        `import { defineReactSsgConfig } from ${JSON.stringify(configEntryUrl)}`,
        "import { App } from './src/App'",
        "import { routes } from './src/routes'",
        '',
        'export default defineReactSsgConfig({',
        "  history: 'browser',",
        '  routes,',
        '  app: App,',
        '})',
        '',
      ].join('\n'),
    })

    await buildProject(project.root)

    const html = await project.readDistFile('index.html')

    expect(html).not.toContain('非法配置页面')
    expect(warn).toHaveBeenCalled()
    expectMessages(log, ['▲ React SSG', ''])
    expectMessages(warn, [
      '⚠ Invalid react-ssg.config.ts: declare either routes or app, but not both.',
    ])
  })

  test('未声明 logLevel 时默认使用 normal 输出并预渲染静态路由和 paths 指定的动态路径', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {})
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const project = await createProject(
      createDataRouterModeFiles({
        history: 'browser',
        configBody: [
          'export default defineReactSsgConfig({',
          "  history: 'browser',",
          '  routes,',
          "  paths: ['/posts/1'],",
          '})',
        ].join('\n'),
        routesBody: [
          "import { Outlet, useParams } from 'react-router'",
          '',
          'function Layout() {',
          '  return (',
          "    <main><h1>布局</h1><Outlet /></main>",
          '  )',
          '}',
          '',
          'function HomePage() { return <p>首页内容</p> }',
          'function AboutPage() { return <p>关于内容</p> }',
          'function PostPage() {',
          '  const params = useParams()',
          '  return <p>文章 {params.id}</p>',
          '}',
          '',
          'export const routes = [',
          '  {',
          "    path: '/',",
          '    Component: Layout,',
          '    children: [',
          '      { index: true, Component: HomePage },',
          "      { path: 'about', Component: AboutPage },",
          "      { path: 'posts/:id', Component: PostPage },",
          '    ],',
          '  },',
          ']',
          '',
        ].join('\n'),
      }),
    )

    await buildProject(project.root)

    expect(await project.readDistFile('index.html')).toContain('首页内容')
    expect(await project.readDistFile('about/index.html')).toContain('关于内容')
    const postHtml = await project.readDistFile('posts/1/index.html')
    expect(postHtml).toContain('文章')
    expect(postHtml).toContain('1')
    expectMessages(log, [
      '▲ React SSG',
      '',
      '- Generating static HTML for 3 route(s)',
      '',
      '✓ Static HTML generation completed: 3 total, 3 prerendered, 0 skipped',
    ])
    expectMessages(warn, [])
  })

  test('hash data router 路由模式只输出默认首屏', async () => {
    const project = await createProject(
      createDataRouterModeFiles({
        history: 'hash',
        configBody: [
          'export default defineReactSsgConfig({',
          "  history: 'hash',",
          '  routes,',
          '})',
        ].join('\n'),
        routesBody: [
          "import { Outlet } from 'react-router'",
          '',
          'function Layout() {',
          '  return (',
          "    <main><h1>Hash 布局</h1><Outlet /></main>",
          '  )',
          '}',
          '',
          'function HomePage() { return <p>Hash 首页</p> }',
          'function AboutPage() { return <p>Hash 关于</p> }',
          '',
          'export const routes = [',
          '  {',
          "    path: '/',",
          '    Component: Layout,',
          '    children: [',
          '      { index: true, Component: HomePage },',
          "      { path: 'about', Component: AboutPage },",
          '    ],',
          '  },',
          ']',
          '',
        ].join('\n'),
      }),
    )

    await buildProject(project.root)

    expect(await project.readDistFile('index.html')).toContain('Hash 首页')
    expect(await project.hasDistFile('about/index.html')).toBe(false)
  })

  test('单页模式支持函数式配置并预渲染根页面', async () => {
    const project = await createProject({
      'src/App.tsx': 'export function App() { return <h1>单页预渲染</h1> }\n',
      'src/main.tsx': [
        "import { StrictMode } from 'react'",
        "import { createRoot } from 'react-dom/client'",
        "import { App } from './App'",
        '',
        "createRoot(document.querySelector('#app')!).render(",
        '  <StrictMode>',
        '    <App />',
        '  </StrictMode>,',
        ')',
        '',
      ].join('\n'),
      'react-ssg.config.ts': [
        `import { defineReactSsgConfig } from ${JSON.stringify(configEntryUrl)}`,
        "import { App } from './src/App'",
        '',
        'export default defineReactSsgConfig(() => ({',
        '  app: App,',
        '}))',
        '',
      ].join('\n'),
    })

    await buildProject(project.root)

    expect(await project.readDistFile('index.html')).toContain('单页预渲染')
  })

  test('silent 模式会抑制常规构建日志', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {})
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const project = await createProject(
      createDataRouterModeFiles({
        history: 'browser',
        configBody: [
          'export default defineReactSsgConfig({',
          "  history: 'browser',",
          "  logLevel: 'silent',",
          '  routes,',
          '})',
        ].join('\n'),
        routesBody: [
          'function HomePage() { return <p>Silent 首页</p> }',
          '',
          'export const routes = [',
          '  {',
          "    path: '/',",
          '    Component: HomePage,',
          '  },',
          ']',
          '',
        ].join('\n'),
      }),
    )

    await buildProject(project.root)

    expect(await project.readDistFile('index.html')).toContain('Silent 首页')
    expectMessages(log, [])
    expectMessages(warn, [])
  })

  test('normal 模式下单个页面预渲染失败时只跳过当前页面', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {})
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const project = await createProject(
      createDataRouterModeFiles({
        history: 'browser',
        configBody: [
          'export default defineReactSsgConfig({',
          "  history: 'browser',",
          "  logLevel: 'normal',",
          '  routes,',
          '})',
        ].join('\n'),
        routesBody: [
          "import { Outlet } from 'react-router'",
          '',
          'function Layout() {',
          '  return <div><Outlet /></div>',
          '}',
          '',
          'function HomePage() { return <p>正常首页</p> }',
          'function OkPage() { return <p>正常页面</p> }',
          'function BoomPage() { throw new Error(\'boom\') }',
          '',
          'export const routes = [',
          '  {',
          "    path: '/',",
          '    Component: Layout,',
          '    children: [',
          '      { index: true, Component: HomePage },',
          "      { path: 'ok', Component: OkPage },",
          "      { path: 'boom', Component: BoomPage },",
          '    ],',
          '  },',
          ']',
          '',
        ].join('\n'),
      }),
    )

    await buildProject(project.root)

    expect(await project.readDistFile('index.html')).toContain('正常首页')
    expect(await project.readDistFile('ok/index.html')).toContain('正常页面')
    expect(await project.hasDistFile('boom/index.html')).toBe(false)
    expectMessages(log, [
      '▲ React SSG',
      '',
      '- Generating static HTML for 3 route(s)',
      '',
      '✓ Static HTML generation completed: 3 total, 2 prerendered, 1 skipped',
    ])
    expectMessages(warn, [
      '⚠ Failed to prerender /boom. Falling back to CSR for this route. Reason: boom',
    ])
  })

  test('verbose 模式会在 completed 摘要后追加逐路由结果列表', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {})
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const project = await createProject(
      createDataRouterModeFiles({
        history: 'browser',
        configBody: [
          'export default defineReactSsgConfig({',
          "  history: 'browser',",
          "  logLevel: 'verbose',",
          '  routes,',
          '})',
        ].join('\n'),
        routesBody: [
          "import { Outlet } from 'react-router'",
          '',
          'function Layout() {',
          '  return <div><Outlet /></div>',
          '}',
          '',
          'function HomePage() { return <p>Verbose 首页</p> }',
          'function OkPage() { return <p>Verbose 页面</p> }',
          'function BoomPage() { throw new Error(\'boom\') }',
          '',
          'export const routes = [',
          '  {',
          "    path: '/',",
          '    Component: Layout,',
          '    children: [',
          '      { index: true, Component: HomePage },',
          "      { path: 'ok', Component: OkPage },",
          "      { path: 'boom', Component: BoomPage },",
          '    ],',
          '  },',
          ']',
          '',
        ].join('\n'),
      }),
    )

    await buildProject(project.root)

    expect(await project.readDistFile('index.html')).toContain('Verbose 首页')
    expect(await project.readDistFile('ok/index.html')).toContain('Verbose 页面')
    expect(await project.hasDistFile('boom/index.html')).toBe(false)
    expectMessages(log, [
      '▲ React SSG',
      '',
      '- Generating static HTML for 3 route(s)',
      '',
      '✓ Static HTML generation completed: 3 total, 2 prerendered, 1 skipped',
      '',
      'Route (prerender)',
      '○ /',
      '○ /ok',
      '× /boom',
    ])
    expectMessages(warn, [
      '⚠ Failed to prerender /boom. Falling back to CSR for this route. Reason: boom',
    ])
  })
})
