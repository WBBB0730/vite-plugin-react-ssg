import { describe, expect, test } from 'vitest'
import { defineReactSsgConfig } from '../src/config'

describe('defineReactSsgConfig', () => {
  test('返回对象配置本身', () => {
    const config = defineReactSsgConfig({
      app: () => 'hello',
    })

    expect(config).toMatchObject({
      app: expect.any(Function),
    })
  })

  test('返回函数配置本身', () => {
    const factory = () =>
      defineReactSsgConfig({
        history: 'browser',
        routes: [],
      })

    const config = defineReactSsgConfig(factory)

    expect(config).toBe(factory)
    expect(config()).toMatchObject({
      history: 'browser',
      routes: [],
    })
  })
})
