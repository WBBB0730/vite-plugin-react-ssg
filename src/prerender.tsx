import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { createElement } from 'react'
import { renderToString } from 'react-dom/server'
import { UnheadProvider, createHead, transformHtmlTemplate } from '@unhead/react/server'
import {
  createMemoryRouter,
  RouterProvider,
  type RouteObject,
} from 'react-router'
import type { ResolvedReactSsgConfig } from './load-config'
import type {
  PrerenderRouteResult,
  PrerenderSummary,
} from './logger'
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

function createAppElement(config: ResolvedReactSsgConfig, targetPath: string) {
  if (config.mode === 'app') {
    return createElement(config.app)
  }

  return createRouteElement(config.routes, targetPath)
}

function injectAppHtml(template: string, appHtml: string): string {
  return template.replace('<div id="app"></div>', `<div id="app">${appHtml}</div>`)
}

async function renderPageHtml(
  template: string,
  config: ResolvedReactSsgConfig,
  targetPath: string,
): Promise<string> {
  const head = createHead()
  const appHtml = renderToString(
    createElement(UnheadProvider, {
      value: head,
      children: createAppElement(config, targetPath),
    }),
  )

  return transformHtmlTemplate(head, injectAppHtml(template, appHtml))
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
  onStart?: (event: { totalRoutes: number }) => void
  onWarning: (warning: PrerenderWarning) => void
}): Promise<PrerenderSummary> {
  const templatePath = path.join(options.outDir, 'index.html')
  const template = await readFile(templatePath, 'utf8')
  const targetPaths = resolveTargetPaths(options.config)
  const routes: PrerenderRouteResult[] = []
  let prerendered = 0
  let skipped = 0

  options.onStart?.({ totalRoutes: targetPaths.length })

  for (const targetPath of targetPaths) {
    try {
      const html = await renderPageHtml(template, options.config, targetPath)
      const outputPath = getOutputFilePath(options.outDir, targetPath)

      await mkdir(path.dirname(outputPath), { recursive: true })
      await writeFile(outputPath, html)
      prerendered += 1
      routes.push({
        targetPath,
        status: 'prerendered',
      })
    }
    catch (error) {
      skipped += 1
      routes.push({
        targetPath,
        status: 'skipped',
      })
      options.onWarning({
        targetPath,
        error,
      })
    }
  }

  return {
    total: targetPaths.length,
    prerendered,
    skipped,
    routes,
  }
}
