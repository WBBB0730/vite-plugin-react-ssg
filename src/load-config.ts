import { access } from 'node:fs/promises'
import path from 'node:path'
import type { ComponentType } from 'react'
import { createServer, type InlineConfig } from 'vite'
import type { RouteObject } from 'react-router'
import type {
  AppConfigInput,
  HistoryMode,
  ReactSsgConfigContext,
  ReactSsgUserConfig,
  ReactSsgUserConfigExport,
  RouteConfigInput,
} from './config'
import { normalizeUserPaths } from './route-paths'

export interface ResolvedRouteConfig {
  mode: 'routes'
  history: HistoryMode
  routes: RouteObject[]
  paths: string[]
}

export interface ResolvedAppConfig {
  mode: 'app'
  app: ComponentType
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

function validateConfig(config: unknown): ConfigLoadResult {
  if (!config || typeof config !== 'object') {
    return {
      kind: 'invalid',
      message: 'react-ssg.config.ts 必须导出一个有效的配置对象。',
    }
  }

  if (isRouteConfig(config as ReactSsgUserConfig) && isAppConfig(config as ReactSsgUserConfig)) {
    return {
      kind: 'invalid',
      message: 'react-ssg.config.ts 不能同时声明 routes 和 app。',
    }
  }

  if (isRouteConfig(config as ReactSsgUserConfig)) {
    const routeConfig = config as RouteConfigInput

    if (routeConfig.history !== 'browser' && routeConfig.history !== 'hash') {
      return {
        kind: 'invalid',
        message: '路由模式必须声明 history: "browser" 或 "hash"。',
      }
    }

    if (!Array.isArray(routeConfig.routes)) {
      return {
        kind: 'invalid',
        message: '路由模式必须提供 routes 数组。',
      }
    }

    return {
      kind: 'ok',
      config: {
        mode: 'routes',
        history: routeConfig.history,
        routes: routeConfig.routes,
        paths: normalizeUserPaths(routeConfig.paths),
      },
    }
  }

  if (isAppConfig(config as ReactSsgUserConfig)) {
    const appConfig = config as AppConfigInput

    if (typeof appConfig.app !== 'function') {
      return {
        kind: 'invalid',
        message: '单页模式必须提供可渲染的 app 组件。',
      }
    }

    return {
      kind: 'ok',
      config: {
        mode: 'app',
        app: appConfig.app,
      },
    }
  }

  return {
    kind: 'invalid',
    message: 'react-ssg.config.ts 必须声明 routes 或 app。',
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
      message: '未找到 react-ssg.config.ts，已跳过预渲染并回退到普通 CSR 构建。',
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
        message: 'react-ssg.config.ts 必须使用 default export 导出配置。',
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
      error instanceof Error ? error.message : '未知错误'

    return {
      kind: 'invalid',
      message: `加载 react-ssg.config.ts 失败：${message}`,
    }
  }
  finally {
    await server.close()
  }
}
