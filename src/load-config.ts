import { access } from 'node:fs/promises'
import path from 'node:path'
import type { ComponentType } from 'react'
import { createServer, type InlineConfig } from 'vite'
import type { RouteObject } from 'react-router'
import type {
  AppConfigInput,
  HistoryMode,
  ReactSsgConfigContext,
  ReactSsgLogLevel,
  ReactSsgUserConfig,
  ReactSsgUserConfigExport,
  RouteConfigInput,
} from './config'
import { normalizeUserPaths } from './route-paths'

export interface ResolvedRouteConfig {
  mode: 'routes'
  history: HistoryMode
  routes: RouteObject[]
  origin?: string
  paths: string[]
  logLevel: ReactSsgLogLevel
}

export interface ResolvedAppConfig {
  mode: 'app'
  app: ComponentType
  logLevel: ReactSsgLogLevel
}

export type ResolvedReactSsgConfig = ResolvedRouteConfig | ResolvedAppConfig

export interface ConfigLoadSuccess {
  kind: 'ok'
  config: ResolvedReactSsgConfig
}

export interface ConfigLoadFailure {
  kind: 'missing' | 'invalid'
  message: string
}

export type ConfigLoadResult = ConfigLoadSuccess | ConfigLoadFailure

interface LoadConfigOptions {
  root: string
  viteConfigFile?: string | undefined
  mode: string
}

function isRouteConfig(config: ReactSsgUserConfig): config is RouteConfigInput {
  return 'routes' in config
}

function isAppConfig(config: ReactSsgUserConfig): config is AppConfigInput {
  return 'app' in config
}

function resolveExportedConfig(
  exportedConfig: ReactSsgUserConfigExport,
  context: ReactSsgConfigContext,
): ReactSsgUserConfig {
  if (typeof exportedConfig === 'function') {
    return exportedConfig(context)
  }

  return exportedConfig
}

function normalizeLogLevel(value: unknown): ReactSsgLogLevel | null {
  if (value === undefined) {
    return 'normal'
  }

  if (value === 'silent' || value === 'normal' || value === 'verbose') {
    return value
  }

  return null
}

function normalizeOrigin(value: unknown): string | undefined | null {
  if (value === undefined) {
    return undefined
  }

  if (typeof value !== 'string') {
    return null
  }

  try {
    const url = new URL(value)

    if (
      (url.protocol !== 'http:' && url.protocol !== 'https:')
      || url.pathname !== '/'
      || url.search !== ''
      || url.hash !== ''
    ) {
      return null
    }

    return url.origin
  }
  catch {
    return null
  }
}

function validateConfig(config: unknown): ConfigLoadResult {
  if (!config || typeof config !== 'object') {
    return {
      kind: 'invalid',
      message: 'Invalid react-ssg.config.ts: export a valid configuration object.',
    }
  }

  const logLevel = normalizeLogLevel((config as { logLevel?: unknown }).logLevel)

  if (!logLevel) {
    return {
      kind: 'invalid',
      message: 'Invalid react-ssg.config.ts: logLevel must be "silent", "normal", or "verbose".',
    }
  }

  if (isRouteConfig(config as ReactSsgUserConfig) && isAppConfig(config as ReactSsgUserConfig)) {
    return {
      kind: 'invalid',
      message: 'Invalid react-ssg.config.ts: declare either routes or app, but not both.',
    }
  }

  if (isRouteConfig(config as ReactSsgUserConfig)) {
    const routeConfig = config as RouteConfigInput
    const origin = normalizeOrigin(routeConfig.origin)

    if (routeConfig.history !== 'browser' && routeConfig.history !== 'hash') {
      return {
        kind: 'invalid',
        message: 'Invalid react-ssg.config.ts: route mode requires history to be set to "browser" or "hash".',
      }
    }

    if (!Array.isArray(routeConfig.routes)) {
      return {
        kind: 'invalid',
        message: 'Invalid react-ssg.config.ts: route mode requires a routes array.',
      }
    }

    if (origin === null) {
      return {
        kind: 'invalid',
        message: 'Invalid react-ssg.config.ts: route mode origin must be a valid absolute http(s) URL.',
      }
    }

    return {
      kind: 'ok',
      config: {
        mode: 'routes',
        history: routeConfig.history,
        routes: routeConfig.routes,
        paths: normalizeUserPaths(routeConfig.paths),
        logLevel,
        ...(origin !== undefined ? { origin } : {}),
      },
    }
  }

  if (isAppConfig(config as ReactSsgUserConfig)) {
    const appConfig = config as AppConfigInput

    if (typeof appConfig.app !== 'function') {
      return {
        kind: 'invalid',
        message: 'Invalid react-ssg.config.ts: app mode requires a renderable app component.',
      }
    }

    return {
      kind: 'ok',
      config: {
        mode: 'app',
        app: appConfig.app,
        logLevel,
      },
    }
  }

  return {
    kind: 'invalid',
    message: 'Invalid react-ssg.config.ts: declare either routes or app.',
  }
}

export async function loadReactSsgConfig(
  options: LoadConfigOptions,
): Promise<ConfigLoadResult> {
  const configFilePath = path.join(options.root, 'react-ssg.config.ts')

  try {
    await access(configFilePath)
  }
  catch {
    return {
      kind: 'missing',
      message: 'Skipping prerendering because react-ssg.config.ts was not found. Keeping the default CSR build output.',
    }
  }

  const inlineConfig: InlineConfig = {
    root: options.root,
    configFile: options.viteConfigFile ?? false,
    mode: 'development',
    appType: 'custom',
    logLevel: 'silent',
    server: {
      middlewareMode: true,
      watch: null,
    },
  }

  const server = await createServer(inlineConfig)

  try {
    const module = await server.ssrLoadModule('/react-ssg.config.ts')
    const exportedConfig = module['default'] as ReactSsgUserConfigExport | undefined

    if (!exportedConfig) {
      return {
        kind: 'invalid',
        message: 'Invalid react-ssg.config.ts: use a default export for the configuration.',
      }
    }

    const resolvedConfig = resolveExportedConfig(exportedConfig, {
      command: 'build',
      mode: options.mode,
    })

    return validateConfig(resolvedConfig)
  }
  catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown error'

    return {
      kind: 'invalid',
      message: `Failed to load react-ssg.config.ts: ${message}`,
    }
  }
  finally {
    await server.close()
  }
}
