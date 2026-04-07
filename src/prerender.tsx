import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { createElement } from 'react'
import { renderToString } from 'react-dom/server'
import { UnheadProvider, createHead, transformHtmlTemplate } from '@unhead/react/server'
import {
  createStaticHandler,
  createStaticRouter,
  StaticRouterProvider,
  type StaticHandlerContext,
} from 'react-router'
import type { ResolvedReactSsgConfig, ResolvedRouteConfig } from './load-config'
import type {
  PrerenderRouteResult,
  PrerenderSummary,
} from './logger'
import { discoverStaticPaths } from './route-paths'
import { createStaticRouterHydrationScript } from './vendor/react-router/static-hydration'

export interface PrerenderWarning {
  targetPath: string
  error: unknown
}

const DEFAULT_PRERENDER_ORIGIN = 'http://localhost'

class StaticQueryResponseError extends Error {
  constructor(status: number) {
    super(`Received a Response with status ${status} during static query.`)
    this.name = 'StaticQueryResponseError'
  }
}

function injectAppHtml(template: string, appHtml: string): string {
  return template.replace('<div id="app"></div>', `<div id="app">${appHtml}</div>`)
}

function injectBodyScript(template: string, script: string): string {
  return template.replace('</body>', `<script>${script}</script></body>`)
}

function createRouteRequest(config: ResolvedRouteConfig, targetPath: string): Request {
  const url = new URL(targetPath, config.origin ?? DEFAULT_PRERENDER_ORIGIN)

  return new Request(url)
}

async function renderAppPageHtml(
  template: string,
  app: ResolvedReactSsgConfig & { mode: 'app' },
): Promise<string> {
  const head = createHead()
  const appHtml = renderToString(
    createElement(UnheadProvider, {
      value: head,
      children: createElement(app.app),
    }),
  )

  return transformHtmlTemplate(head, injectAppHtml(template, appHtml))
}

async function renderRoutePageHtml(
  template: string,
  config: ResolvedRouteConfig,
  targetPath: string,
): Promise<string> {
  const { query, dataRoutes } = createStaticHandler(config.routes)
  const queried = await query(createRouteRequest(config, targetPath))

  if (queried instanceof Response) {
    throw new StaticQueryResponseError(queried.status)
  }

  const context = queried as StaticHandlerContext
  const router = createStaticRouter(dataRoutes, context)
  const head = createHead()
  const appHtml = renderToString(
    createElement(UnheadProvider, {
      value: head,
      children: createElement(StaticRouterProvider, {
        router,
        context,
        hydrate: false,
      }),
    }),
  )
  const transformedHtml = await transformHtmlTemplate(
    head,
    injectAppHtml(template, appHtml),
  )

  return injectBodyScript(
    transformedHtml,
    createStaticRouterHydrationScript(context),
  )
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
      const html = options.config.mode === 'app'
        ? await renderAppPageHtml(template, options.config)
        : await renderRoutePageHtml(template, options.config, targetPath)
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
