import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { describe, expect, test } from 'vitest'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

describe('公共入口模块', () => {
  test('index.ts 保持薄封装，并导出插件工厂与配置辅助函数', async () => {
    const entryPath = path.join(repoRoot, 'src/index.ts')
    const pluginModuleUrl = pathToFileURL(path.join(repoRoot, 'src/react-ssg-plugin.ts')).href
    const configModuleUrl = pathToFileURL(path.join(repoRoot, 'src/config.ts')).href

    const [entrySource, entryModule, pluginModule, configModule] = await Promise.all([
      readFile(entryPath, 'utf8'),
      import(pathToFileURL(entryPath).href),
      import(pluginModuleUrl),
      import(configModuleUrl),
    ])

    expect(entryModule.default).toBe(pluginModule.reactSsg)
    expect(entryModule.defineReactSsgConfig).toBe(configModule.defineReactSsgConfig)
    expect(entrySource).not.toContain('closeBundle')
    expect(entrySource).not.toContain('configResolved')
    expect(entrySource).not.toContain('loadReactSsgConfig')
    expect(entrySource).not.toContain('prerenderBuild')
    expect(entrySource).not.toContain('console.warn')
  })
})
