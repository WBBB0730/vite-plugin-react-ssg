import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { createElement } from 'react'
import { renderToString } from 'react-dom/server'
import {
  createMemoryRouter,
  RouterProvider,
  type RouteObject,
} from 'react-router'
import type { ResolvedReactSsgConfig } from './load-config'
import { discoverStaticPaths } from './route-paths'

export interface PrerenderWarning {
  targetPath: string
  error: unknown
}

function createRouteElement(routes: RouteObject[], targetPath: string) {
  const router = createMemoryRouter(routes, {
    initialEntries: [targetPath],
  })

  return createElement(RouterProvider, { router })
}

function renderAppHtml(config: ResolvedReactSsgConfig, targetPath: string): string {
  if (config.mode === 'app') {
    return renderToString(createElement(config.app))
  }

  return renderToString(createRouteElement(config.routes, targetPath))
}

function injectAppHtml(template: string, appHtml: string): string {
  return template.replace('<div id="app"></div>', `<div id="app">${appHtml}</div>`)
}

function resolveTargetPaths(config: ResolvedReactSsgConfig): string[] {
  if (config.mode === 'app') {
    return ['/']
  }

  if (config.history === 'hash') {
    return ['/']
  }

  return [
    ...new Set([
      ...discoverStaticPaths(config.routes),
      ...config.paths,
    ]),
  ]
}

function getOutputFilePath(outDir: string, targetPath: string): string {
  if (targetPath === '/') {
    return path.join(outDir, 'index.html')
  }

  return path.join(outDir, targetPath.slice(1), 'index.html')
}

export async function prerenderBuild(options: {
  outDir: string
  config: ResolvedReactSsgConfig
  onWarning: (warning: PrerenderWarning) => void
}): Promise<void> {
  const templatePath = path.join(options.outDir, 'index.html')
  const template = await readFile(templatePath, 'utf8')
  const targetPaths = resolveTargetPaths(options.config)

  for (const targetPath of targetPaths) {
    try {
      const html = injectAppHtml(template, renderAppHtml(options.config, targetPath))
      const outputPath = getOutputFilePath(options.outDir, targetPath)

      await mkdir(path.dirname(outputPath), { recursive: true })
      await writeFile(outputPath, html)
    }
    catch (error) {
      options.onWarning({
        targetPath,
        error,
      })
    }
  }
}
