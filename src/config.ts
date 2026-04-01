import type { ComponentType } from 'react'
import type { RouteObject } from 'react-router'

export type HistoryMode = 'browser' | 'hash'

export interface ReactSsgConfigContext {
  command: 'build'
  mode: string
}

export interface RouteConfigInput {
  history: HistoryMode
  routes: RouteObject[]
  paths?: string[]
  app?: never
}

export interface AppConfigInput {
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
