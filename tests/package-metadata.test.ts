import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, test } from 'vitest'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

describe('package metadata', () => {
  test('React peer 兼容范围保持在实现真实依赖边界内', async () => {
    const packageJsonPath = path.join(repoRoot, 'package.json')
    const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf8')) as {
      peerDependencies?: Record<string, string>
    }

    expect(packageJson.peerDependencies).toMatchObject({
      '@unhead/react': '*',
      react: '>=18.3.1',
      'react-dom': '>=18.3.1',
      'react-router': '^6.4.0 || ^7.0.0',
    })
  })
})
