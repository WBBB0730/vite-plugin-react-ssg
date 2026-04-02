import { describe, expect, test } from 'vitest'
import {
  resolvePublishPlan,
  resolvePublishPlanOrThrow,
} from '../scripts/prepare-npm-release.mjs'

describe('resolvePublishPlan', () => {
  test('正式版标签会解析为默认 npm dist-tag', () => {
    expect(resolvePublishPlan({
      gitRef: 'refs/tags/v1.2.3',
      packageVersion: '1.2.3',
    })).toEqual({
      ok: true,
      version: '1.2.3',
      distTag: null,
      publishArgs: [],
      isPrerelease: false,
    })
  })

  test('beta 标签会解析为 beta dist-tag', () => {
    expect(resolvePublishPlan({
      gitRef: 'refs/tags/v1.2.3-beta.1',
      packageVersion: '1.2.3-beta.1',
    })).toEqual({
      ok: true,
      version: '1.2.3-beta.1',
      distTag: 'beta',
      publishArgs: ['--tag', 'beta'],
      isPrerelease: true,
    })
  })

  test('不符合发布规则的标签会返回错误结果', () => {
    expect(resolvePublishPlan({
      gitRef: 'refs/tags/release-1.2.3',
      packageVersion: '1.2.3',
    })).toEqual({
      ok: false,
      message: 'Unsupported release tag "refs/tags/release-1.2.3". Expected v<major>.<minor>.<patch> or v<major>.<minor>.<patch>-beta.<n>.',
    })
  })
})

describe('resolvePublishPlanOrThrow', () => {
  test('标签版本与 package.json 不一致时抛出错误', () => {
    expect(() => resolvePublishPlanOrThrow({
      gitRef: 'refs/tags/v1.2.3',
      packageVersion: '1.2.4',
    })).toThrowError(
      'Tag version "1.2.3" does not match package.json version "1.2.4".',
    )
  })
})
