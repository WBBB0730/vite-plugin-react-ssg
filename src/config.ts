import type { ComponentType } from 'react'
import type { RouteObject } from 'react-router'

export type HistoryMode = 'browser' | 'hash'
export type ReactSsgLogLevel = 'silent' | 'normal' | 'verbose'

export interface ReactSsgConfigContext {
  command: 'build'
  mode: string
}

interface SharedConfigInput {
  logLevel?: ReactSsgLogLevel
}

export interface RouteConfigInput extends SharedConfigInput {
  history: HistoryMode
  routes: RouteObject[]
  paths?: string[]
  app?: never
}

export interface AppConfigInput extends SharedConfigInput {
  app: ComponentType
  history?: never
  routes?: never
  paths?: never
}

export type ReactSsgUserConfig = RouteConfigInput | AppConfigInput

export type ReactSsgUserConfigExport =
  | ReactSsgUserConfig
  | ((context: ReactSsgConfigContext) => ReactSsgUserConfig)

export function defineReactSsgConfig(
  config: ReactSsgUserConfigExport,
): ReactSsgUserConfigExport {
  return config
}
