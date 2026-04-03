import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export function createViteConfig(configFileUrl: string) {
  const appRoot = fileURLToPath(new URL('.', configFileUrl))
  const packageEntry = fileURLToPath(new URL('../../dist/index.mjs', configFileUrl))
  const packageConfigEntry = fileURLToPath(new URL('../../dist/config.mjs', configFileUrl))

  return defineConfig(async () => {
    const { default: reactSsg } = await import('../../dist/index.mjs')

    return {
      root: appRoot,
      plugins: [react(), reactSsg()],
      resolve: {
        alias: [
          {
            find: 'vite-plugin-react-ssg/config',
            replacement: packageConfigEntry,
          },
          {
            find: 'vite-plugin-react-ssg',
            replacement: packageEntry,
          },
        ],
        dedupe: ['react', 'react-dom', 'react-router'],
      },
      build: {
        outDir: 'dist',
        emptyOutDir: true,
      },
    }
  })
}
