import type { RouteObject } from 'react-router'
import { flattenRoutes } from './vendor/react-router/flatten-routes'

function normalizePathname(pathname: string): string {
  return pathname.replace(/\/+$/, '').replace(/^\/*/, '/')
}

function hasDynamicSegments(pathname: string): boolean {
  return pathname.split('/').some(segment => segment.startsWith(':') || segment === '*')
}

export function normalizeUserPaths(paths: string[] | undefined): string[] {
  if (!paths) {
    return []
  }

  return [...new Set(paths.map(normalizePathname))]
}

export function discoverStaticPaths(routes: RouteObject[]): string[] {
  const collected = new Set<string>()

  for (const branch of flattenRoutes<RouteObject>(routes)) {
    if (hasDynamicSegments(branch.path)) {
      continue
    }

    collected.add(normalizePathname(branch.path))
  }

  return [...collected]
}
