// Vendored from:
// https://github.com/remix-run/react-router/blob/00cb4d7b/packages/react-router/lib/router/utils.ts
// and
// https://github.com/remix-run/react-router/blob/00cb4d7b/packages/react-router/lib/router/history.ts

export interface RouteTreeNode {
  path?: string | undefined
  index?: boolean | undefined
  caseSensitive?: boolean | undefined
  children?: RouteTreeNode[] | undefined
}

export interface RouteMeta<
  RouteObjectType extends RouteTreeNode = RouteTreeNode,
> {
  relativePath: string
  caseSensitive: boolean
  childrenIndex: number
  route: RouteObjectType
}

export interface RouteBranch<
  RouteObjectType extends RouteTreeNode = RouteTreeNode,
> {
  path: string
  score: number
  routesMeta: RouteMeta<RouteObjectType>[]
}

export function invariant(value: boolean, message?: string): asserts value
export function invariant<T>(
  value: T | null | undefined,
  message?: string,
): asserts value is T
export function invariant(value: unknown, message?: string) {
  if (value === false || value === null || typeof value === 'undefined') {
    throw new Error(message)
  }
}

export const joinPaths = (paths: string[]): string =>
  paths.join('/').replace(/\/\/+/g, '/')

export function flattenRoutes<
  RouteObjectType extends RouteTreeNode = RouteTreeNode,
>(
  routes: RouteObjectType[],
  branches: RouteBranch<RouteObjectType>[] = [],
  parentsMeta: RouteMeta<RouteObjectType>[] = [],
  parentPath = '',
  _hasParentOptionalSegments = false,
): RouteBranch<RouteObjectType>[] {
  const flattenRoute = (
    route: RouteObjectType,
    index: number,
    hasParentOptionalSegments = _hasParentOptionalSegments,
    relativePath?: string,
  ) => {
    const meta: RouteMeta<RouteObjectType> = {
      relativePath:
        relativePath === undefined ? route.path || '' : relativePath,
      caseSensitive: route.caseSensitive === true,
      childrenIndex: index,
      route,
    }

    if (meta.relativePath.startsWith('/')) {
      if (
        !meta.relativePath.startsWith(parentPath)
        && hasParentOptionalSegments
      ) {
        return
      }

      invariant(
        meta.relativePath.startsWith(parentPath),
        `Absolute route path "${meta.relativePath}" nested under path `
        + `"${parentPath}" is not valid. An absolute child route path `
        + 'must start with the combined path of all its parent routes.',
      )

      meta.relativePath = meta.relativePath.slice(parentPath.length)
    }

    const path = joinPaths([parentPath, meta.relativePath])
    const routesMeta = parentsMeta.concat(meta)

    if (route.children && route.children.length > 0) {
      invariant(
        route.index !== true,
        `Index routes must not have child routes. Please remove `
        + `all child routes from route path "${path}".`,
      )

      flattenRoutes(
        route.children,
        branches,
        routesMeta,
        path,
        hasParentOptionalSegments,
      )
    }

    if (route.path == null && !route.index) {
      return
    }

    branches.push({
      path,
      score: computeScore(path, route.index),
      routesMeta,
    })
  }

  routes.forEach((route, index) => {
    if (route.path === '' || !route.path?.includes('?')) {
      flattenRoute(route, index)
    }
    else {
      for (const exploded of explodeOptionalSegments(route.path)) {
        flattenRoute(route, index, true, exploded)
      }
    }
  })

  return branches
}

function explodeOptionalSegments(path: string): string[] {
  const segments = path.split('/')
  if (segments.length === 0) {
    return []
  }

  const first = segments[0]!
  const rest = segments.slice(1)
  const isOptional = first.endsWith('?')
  const required = first.replace(/\?$/, '')

  if (rest.length === 0) {
    return isOptional ? [required, ''] : [required]
  }

  const restExploded = explodeOptionalSegments(rest.join('/'))
  const result: string[] = []

  result.push(
    ...restExploded.map((subpath) =>
      subpath === '' ? required : [required, subpath].join('/'),
    ),
  )

  if (isOptional) {
    result.push(...restExploded)
  }

  return result.map((exploded) =>
    path.startsWith('/') && exploded === '' ? '/' : exploded,
  )
}

const paramRe = /^:[\w-]+$/
const dynamicSegmentValue = 3
const indexRouteValue = 2
const emptySegmentValue = 1
const staticSegmentValue = 10
const splatPenalty = -2
const isSplat = (segment: string) => segment === '*'

function computeScore(path: string, index: boolean | undefined): number {
  const segments = path.split('/')
  let initialScore = segments.length

  if (segments.some(isSplat)) {
    initialScore += splatPenalty
  }

  if (index) {
    initialScore += indexRouteValue
  }

  return segments
    .filter((segment) => !isSplat(segment))
    .reduce(
      (score, segment) =>
        score
        + (paramRe.test(segment)
          ? dynamicSegmentValue
          : segment === ''
            ? emptySegmentValue
            : staticSegmentValue),
      initialScore,
    )
}
