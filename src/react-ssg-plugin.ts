import path from 'node:path'
import type { Plugin, ResolvedConfig } from 'vite'
import type { ReactSsgLogLevel } from './config'
import { createReactSsgLogger } from './logger'
import { loadReactSsgConfig } from './load-config'
import { prerenderBuild } from './prerender'

export function reactSsg(): Plugin {
  let resolvedConfig: ResolvedConfig

  function createLogger(logLevel: ReactSsgLogLevel) {
    return createReactSsgLogger({ logLevel })
  }

  return {
    name: 'vite-plugin-react-ssg',
    apply: 'build',
    configResolved(config) {
      resolvedConfig = config
    },
    async closeBundle() {
      if (resolvedConfig.build.ssr) {
        return
      }

      const loadedConfig = await loadReactSsgConfig({
        root: resolvedConfig.root,
        viteConfigFile: resolvedConfig.configFile,
        mode: resolvedConfig.mode,
      })

      if (loadedConfig.kind !== 'ok') {
        createLogger('normal').warn(loadedConfig.message)
        return
      }

      const logger = createLogger(loadedConfig.config.logLevel)
      const summary = await prerenderBuild({
        outDir: path.resolve(resolvedConfig.root, resolvedConfig.build.outDir),
        config: loadedConfig.config,
        onStart({ totalRoutes }) {
          logger.startPrerender(totalRoutes)
        },
        onWarning({ targetPath, error }) {
          logger.warnPrerenderFailure(targetPath, error)
        },
      })

      logger.finishPrerender(summary)
    },
  }
}
