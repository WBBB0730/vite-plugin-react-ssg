import path from 'node:path'
import type { Plugin, ResolvedConfig } from 'vite'
import { loadReactSsgConfig } from './load-config'
import { prerenderBuild } from './prerender'

function warn(message: string): void {
  console.warn(`[vite-plugin-react-ssg] ${message}`)
}

export function reactSsg(): Plugin {
  let resolvedConfig: ResolvedConfig

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
        warn(loadedConfig.message)
        return
      }

      await prerenderBuild({
        outDir: path.resolve(resolvedConfig.root, resolvedConfig.build.outDir),
        config: loadedConfig.config,
        onWarning({ targetPath, error }) {
          const message = error instanceof Error ? error.message : String(error)
          warn(`预渲染 ${targetPath} 失败，已回退到 CSR：${message}`)
        },
      })
    },
  }
}
