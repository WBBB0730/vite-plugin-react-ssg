import { describe, expect, test, vi } from 'vitest'

import {
  buildViteArgs,
  completeMissingSelections,
  parseCliArgs,
  supportedActions,
  type PromptLike,
} from '../scripts/play'

describe('play command CLI parsing', () => {
  const apps = ['app-basic', 'routes-browser', 'routes-hash']

  test('无参数时保留为空，等待交互补全', () => {
    expect(parseCliArgs([], apps)).toEqual({
      action: null,
      appName: null,
      extraArgs: [],
      errorMessage: null,
    })
  })

  test('只传 action 时识别 action 并等待补全 app', () => {
    expect(parseCliArgs(['build'], apps)).toEqual({
      action: 'build',
      appName: null,
      extraArgs: [],
      errorMessage: null,
    })
  })

  test('只传 app 时识别 app 并等待补全 action', () => {
    expect(parseCliArgs(['routes-browser'], apps)).toEqual({
      action: null,
      appName: 'routes-browser',
      extraArgs: [],
      errorMessage: null,
    })
  })

  test('完整参数和 -- 透传参数会被正确拆分', () => {
    expect(parseCliArgs(['preview', 'routes-hash', '--', '--host', '0.0.0.0'], apps)).toEqual({
      action: 'preview',
      appName: 'routes-hash',
      extraArgs: ['--host', '0.0.0.0'],
      errorMessage: null,
    })
  })

  test('非法单参数保留显式错误而不是进入交互式', () => {
    expect(parseCliArgs(['unknown'], apps)).toEqual({
      action: null,
      appName: null,
      extraArgs: [],
      errorMessage: 'Unrecognized argument "unknown". Expected a supported action or a playground app name.',
    })
  })

  test('非法 action 仍然报错', () => {
    expect(parseCliArgs(['serve', 'app-basic'], apps)).toEqual({
      action: null,
      appName: null,
      extraArgs: [],
      errorMessage: 'Unsupported action "serve".',
    })
  })
})

describe('play command interactive completion', () => {
  const apps = ['app-basic', 'routes-browser', 'routes-hash']

  function createPrompt(selectResults: unknown[]): PromptLike {
    const select = vi.fn()

    for (const result of selectResults) {
      select.mockResolvedValueOnce(result)
    }

    return {
      select,
      isCancel: value => value === Symbol.for('cancel'),
      cancel: vi.fn(),
    }
  }

  test('无参数时依次补全 action 和 app', async () => {
    const prompt = createPrompt(['dev', 'app-basic'])

    await expect(
      completeMissingSelections(
        {
          action: null,
          appName: null,
          extraArgs: [],
          errorMessage: null,
        },
        apps,
        prompt,
      ),
    ).resolves.toEqual({
      action: 'dev',
      appName: 'app-basic',
      extraArgs: [],
    })

    expect(prompt.select).toHaveBeenCalledTimes(2)
    expect(prompt.select).toHaveBeenNthCalledWith(1, {
      message: 'Select a playground action',
      options: supportedActions.map(action => ({
        value: action,
        label: action,
      })),
    })
    expect(prompt.select).toHaveBeenNthCalledWith(2, {
      message: 'Select a playground app',
      options: apps.map(appName => ({
        value: appName,
        label: appName,
      })),
    })
  })

  test('只缺 app 时只补全 app', async () => {
    const prompt = createPrompt(['routes-browser'])

    await expect(
      completeMissingSelections(
        {
          action: 'build',
          appName: null,
          extraArgs: ['--mode', 'test'],
          errorMessage: null,
        },
        apps,
        prompt,
      ),
    ).resolves.toEqual({
      action: 'build',
      appName: 'routes-browser',
      extraArgs: ['--mode', 'test'],
    })

    expect(prompt.select).toHaveBeenCalledTimes(1)
  })

  test('用户取消交互时返回 null 并输出取消提示', async () => {
    const prompt = createPrompt([Symbol.for('cancel')])

    await expect(
      completeMissingSelections(
        {
          action: null,
          appName: null,
          extraArgs: [],
          errorMessage: null,
        },
        apps,
        prompt,
      ),
    ).resolves.toBeNull()

    expect(prompt.cancel).toHaveBeenCalledWith('Playground selection cancelled.')
  })
})

describe('play command vite args', () => {
  test('dev 使用默认 vite dev 命令格式', () => {
    expect(buildViteArgs('dev', 'app-basic', ['--host'])).toEqual([
      'exec',
      'vite',
      '--config',
      'playgrounds/app-basic/vite.config.ts',
      '--host',
    ])
  })

  test('build 和 preview 会带上 action 子命令', () => {
    expect(buildViteArgs('build', 'routes-browser', [])).toEqual([
      'exec',
      'vite',
      'build',
      '--config',
      'playgrounds/routes-browser/vite.config.ts',
    ])

    expect(buildViteArgs('preview', 'routes-hash', ['--port', '4174'])).toEqual([
      'exec',
      'vite',
      'preview',
      '--config',
      'playgrounds/routes-hash/vite.config.ts',
      '--port',
      '4174',
    ])
  })
})
