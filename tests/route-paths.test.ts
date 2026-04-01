import type { RouteObject } from 'react-router'
import { describe, expect, test } from 'vitest'
import { discoverStaticPaths, normalizeUserPaths } from '../src/route-paths'

describe('normalizeUserPaths', () => {
  test('会规范化并去重用户传入路径', () => {
    expect(
      normalizeUserPaths([
        'posts/1/',
        '/posts/1',
        '//about//',
        '/',
      ]),
    ).toEqual([
      '/posts/1',
      '/about',
      '/',
    ])
  })

  test('未传 paths 时返回空数组', () => {
    expect(normalizeUserPaths(undefined)).toEqual([])
  })
})

describe('discoverStaticPaths', () => {
  test('会跳过动态参数与 splat 分支，只保留静态路径', () => {
    const routes: RouteObject[] = [
      {
        path: '/',
        children: [
          { index: true },
          { path: 'about' },
          { path: 'posts/:id' },
          { path: 'files/*' },
        ],
      },
    ]

    expect(discoverStaticPaths(routes).toSorted()).toEqual([
      '/',
      '/about',
    ].toSorted())
  })

  test('会按照官方 optional segment 语义展开并收集静态路径', () => {
    const routes: RouteObject[] = [
      {
        path: '/',
        children: [
          { path: 'docs?/intro' },
          { path: 'guide/:lang?/start' },
        ],
      },
    ]

    expect(discoverStaticPaths(routes).toSorted()).toEqual([
      '/',
      '/docs/intro',
      '/intro',
      '/guide/start',
    ].toSorted())
  })

  test('无路径布局路由不会单独产出路径，但其子路由仍会被发现', () => {
    const routes: RouteObject[] = [
      {
        path: '/',
        children: [
          {
            children: [
              { index: true },
              { path: 'dashboard' },
            ],
          },
        ],
      },
    ]

    expect(discoverStaticPaths(routes).toSorted()).toEqual([
      '/',
      '/dashboard',
    ].toSorted())
  })

  test('合法的绝对子路由会沿用官方 flattenRoutes 语义', () => {
    const routes: RouteObject[] = [
      {
        path: '/app',
        children: [
          { index: true },
          { path: '/app/settings' },
        ],
      },
    ]

    expect(discoverStaticPaths(routes).toSorted()).toEqual([
      '/app',
      '/app/settings',
    ].toSorted())
  })

  test('非法的绝对子路由嵌套会抛出错误', () => {
    const routes: RouteObject[] = [
      {
        path: '/app',
        children: [
          { path: '/settings' },
        ],
      },
    ]

    expect(() => discoverStaticPaths(routes)).toThrowError(
      'Absolute route path "/settings" nested under path "/app" is not valid.',
    )
  })
})
