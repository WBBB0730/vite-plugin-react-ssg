// Vendored from React Router 7.13.2 development build:
// - lib/dom/ssr/markup.ts (`escapeHtml`)
// - StaticRouterProvider internals in dist/development/chunk-UVKPFVEO.mjs (`serializeErrors`)

import { isRouteErrorResponse, type StaticHandlerContext } from 'react-router'

const ESCAPE_LOOKUP: Record<string, string> = {
  '&': '\\u0026',
  '>': '\\u003e',
  '<': '\\u003c',
  '\u2028': '\\u2028',
  '\u2029': '\\u2029',
}

const ESCAPE_REGEX = /[&><\u2028\u2029]/g

function escapeHtml(html: string): string {
  return html.replace(ESCAPE_REGEX, match => ESCAPE_LOOKUP[match]!)
}

function serializeErrors(
  errors: StaticHandlerContext['errors'],
): StaticHandlerContext['errors'] | null {
  if (!errors) {
    return null
  }

  const entries = Object.entries(errors)
  const serialized: Record<string, unknown> = {}

  for (const [key, value] of entries) {
    if (isRouteErrorResponse(value)) {
      serialized[key] = { ...value, __type: 'RouteErrorResponse' }
      continue
    }

    if (value instanceof Error) {
      serialized[key] = {
        message: value.message,
        __type: 'Error',
        ...(value.name !== 'Error' ? { __subType: value.name } : {}),
      }
      continue
    }

    serialized[key] = value
  }

  return serialized as StaticHandlerContext['errors']
}

export function createStaticRouterHydrationScript(
  context: Pick<StaticHandlerContext, 'loaderData' | 'actionData' | 'errors'>,
): string {
  const data = {
    loaderData: context.loaderData,
    actionData: context.actionData,
    errors: serializeErrors(context.errors),
  }
  const json = escapeHtml(JSON.stringify(JSON.stringify(data)))

  return `window.__staticRouterHydrationData = JSON.parse(${json});`
}
