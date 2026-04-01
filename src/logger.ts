import type { ReactSsgLogLevel } from './config'

export interface PrerenderRouteResult {
  targetPath: string
  status: 'prerendered' | 'skipped'
}

export interface PrerenderSummary {
  total: number
  prerendered: number
  skipped: number
  routes: PrerenderRouteResult[]
}

export interface ReactSsgLogger {
  warn: (message: string) => void
  startPrerender: (totalRoutes: number) => void
  finishPrerender: (summary: PrerenderSummary) => void
  warnPrerenderFailure: (targetPath: string, error: unknown) => void
}

function formatErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

export function createReactSsgLogger(options: {
  logLevel: ReactSsgLogLevel
}): ReactSsgLogger {
  let bannerPrinted = false

  function ensureBanner(): void {
    if (options.logLevel === 'silent' || bannerPrinted) {
      return
    }

    bannerPrinted = true
    console.log('▲ React SSG')
    console.log('')
  }

  return {
    warn(message) {
      if (options.logLevel !== 'silent') {
        ensureBanner()
      }

      console.warn(`⚠ ${message}`)
    },
    startPrerender(totalRoutes) {
      if (options.logLevel === 'silent') {
        return
      }

      ensureBanner()
      console.log(`- Generating static HTML for ${totalRoutes} route(s)`)
    },
    finishPrerender(summary) {
      if (options.logLevel === 'silent') {
        return
      }

      ensureBanner()
      console.log('')
      console.log(
        `✓ Static HTML generation completed: ${summary.total} total, ${summary.prerendered} prerendered, ${summary.skipped} skipped`,
      )

      if (options.logLevel !== 'verbose') {
        return
      }

      console.log('')
      console.log('Route (prerender)')

      for (const route of summary.routes) {
        console.log(`${route.status === 'prerendered' ? '○' : '×'} ${route.targetPath}`)
      }
    },
    warnPrerenderFailure(targetPath, error) {
      if (options.logLevel !== 'silent') {
        ensureBanner()
      }

      console.warn(
        `⚠ Failed to prerender ${targetPath}. Falling back to CSR for this route. Reason: ${formatErrorMessage(error)}`,
      )
    },
  }
}
