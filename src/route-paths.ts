import type { RouteObject } from 'react-router'

function normalizePathname(pathname: string): string {
  if (pathname === '/') {
    return pathname
  }

  const trimmed = pathname.replace(/\/+/g, '/').replace(/\/$/, '')
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`
}

function joinPathname(parentPath: string, childPath: string): string {
  if (childPath.startsWith('/')) {
    return normalizePathname(childPath)
  }

  if (parentPath === '/') {
    return normalizePathname(`/${childPath}`)
  }

  return normalizePathname(`${parentPath}/${childPath}`)
}

function hasDynamicSegments(pathname: string): boolean {
  return pathname.includes(':') || pathname.includes('*')
}

function collectStaticPaths(
  routes: RouteObject[],
  collected: Set<string>,
  parentPath = '/',
  parentDynamic = false,
): void {
  for (const route of routes) {
    const routePath = typeof route.path === 'string' ? route.path : undefined
    const currentPath = routePath ? joinPathname(parentPath, routePath) : parentPath
    const currentDynamic = routePath?.startsWith('/')
      ? hasDynamicSegments(routePath)
      : parentDynamic || (routePath ? hasDynamicSegments(routePath) : false)

    if (route.index && !parentDynamic) {
      collected.add(normalizePathname(parentPath))
    }

    if (routePath && !currentDynamic) {
      collected.add(currentPath)
    }

    if (Array.isArray(route.children) && route.children.length > 0) {
      collectStaticPaths(route.children, collected, currentPath, currentDynamic)
    }
  }
}

export function normalizeUserPaths(paths: string[] | undefined): string[] {
  if (!paths) {
    return []
  }

  return [...new Set(paths.map(normalizePathname))]
}

export function discoverStaticPaths(routes: RouteObject[]): string[] {
  const collected = new Set<string>()
  collectStaticPaths(routes, collected)
  return [...collected]
}
