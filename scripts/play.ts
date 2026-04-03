import * as p from '@clack/prompts'
import { spawn } from 'node:child_process'
import { existsSync, readdirSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath, pathToFileURL } from 'node:url'

const repoRoot = fileURLToPath(new URL('../', import.meta.url))
const playgroundsRoot = path.join(repoRoot, 'playgrounds')
const packageDistEntry = path.join(repoRoot, 'dist', 'index.mjs')

export const supportedActions = ['dev', 'build', 'preview'] as const

type PlaygroundAction = (typeof supportedActions)[number]

export interface ParsedCliArgs {
  action: PlaygroundAction | null
  appName: string | null
  extraArgs: string[]
  errorMessage: string | null
}

export interface ResolvedCliArgs {
  action: PlaygroundAction
  appName: string
  extraArgs: string[]
}

interface SelectOption<T extends string> {
  value: T
  label: string
}

export interface PromptLike {
  select<T extends string>(options: {
    message: string
    options: Array<SelectOption<T>>
  }): Promise<T | symbol>
  isCancel(value: unknown): boolean
  cancel(message: string): void
}

interface MainDeps {
  listApps?: () => string[]
  prompt?: PromptLike
  hasPackageDist?: () => boolean
  run?: (command: string, args: string[]) => Promise<number>
  writeStderr?: (message: string) => void
}

const defaultPrompt: PromptLike = {
  select: p.select as PromptLike['select'],
  isCancel: p.isCancel,
  cancel: p.cancel,
}

export function listApps(): string[] {
  return readdirSync(playgroundsRoot, { withFileTypes: true })
    .filter(entry => entry.isDirectory() && !entry.name.startsWith('_'))
    .map(entry => entry.name)
    .sort()
}

function writeUsage(writeStderr: (message: string) => void, apps: string[], message?: string): void {
  if (message) {
    writeStderr(`${message}\n`)
  }

  writeStderr('Usage: pnpm play <dev|build|preview> <app-name> [-- <vite-args>]\n')
  writeStderr(`Available apps: ${apps.join(', ')}\n`)
}

function isPlaygroundAction(value: string): value is PlaygroundAction {
  return supportedActions.includes(value as PlaygroundAction)
}

function splitCliArgs(argv: string[]): {
  positionals: string[]
  extraArgs: string[]
} {
  const separatorIndex = argv.indexOf('--')

  if (separatorIndex === -1) {
    return {
      positionals: argv,
      extraArgs: [],
    }
  }

  return {
    positionals: argv.slice(0, separatorIndex),
    extraArgs: argv.slice(separatorIndex + 1),
  }
}

export function parseCliArgs(argv: string[], apps: string[]): ParsedCliArgs {
  const { positionals, extraArgs } = splitCliArgs(argv)

  if (positionals.length === 0) {
    return {
      action: null,
      appName: null,
      extraArgs,
      errorMessage: null,
    }
  }

  if (positionals.length === 1) {
    const value = positionals[0]

    if (!value) {
      return {
        action: null,
        appName: null,
        extraArgs,
        errorMessage: 'Missing positional argument.',
      }
    }

    const matchesAction = isPlaygroundAction(value)
    const matchesApp = apps.includes(value)

    if (matchesAction && matchesApp) {
      return {
        action: null,
        appName: null,
        extraArgs,
        errorMessage: `Ambiguous argument "${value}". It matches both an action and a playground app name.`,
      }
    }

    if (matchesAction) {
      return {
        action: value,
        appName: null,
        extraArgs,
        errorMessage: null,
      }
    }

    if (matchesApp) {
      return {
        action: null,
        appName: value,
        extraArgs,
        errorMessage: null,
      }
    }

    return {
      action: null,
      appName: null,
      extraArgs,
      errorMessage: `Unrecognized argument "${value}". Expected a supported action or a playground app name.`,
    }
  }

  if (positionals.length > 2) {
    return {
      action: null,
      appName: null,
      extraArgs,
      errorMessage: `Unexpected positional arguments: ${positionals.slice(2).join(', ')}.`,
    }
  }

  const actionArg = positionals[0]
  const appName = positionals[1]

  if (!actionArg || !appName) {
    return {
      action: null,
      appName: null,
      extraArgs,
      errorMessage: 'Missing required positional arguments.',
    }
  }

  if (!isPlaygroundAction(actionArg)) {
    return {
      action: null,
      appName: null,
      extraArgs,
      errorMessage: `Unsupported action "${actionArg}".`,
    }
  }

  if (!apps.includes(appName)) {
    return {
      action: null,
      appName: null,
      extraArgs,
      errorMessage: `Unknown playground app "${appName}".`,
    }
  }

  return {
    action: actionArg,
    appName,
    extraArgs,
    errorMessage: null,
  }
}

export async function completeMissingSelections(
  parsedArgs: ParsedCliArgs,
  apps: string[],
  prompt: PromptLike = defaultPrompt,
): Promise<ResolvedCliArgs | null> {
  let { action, appName } = parsedArgs

  if (parsedArgs.errorMessage) {
    throw new Error(parsedArgs.errorMessage)
  }

  if (!action) {
    const selectedAction = await prompt.select<PlaygroundAction>({
      message: 'Select a playground action',
      options: supportedActions.map(currentAction => ({
        value: currentAction,
        label: currentAction,
      })),
    })

    if (prompt.isCancel(selectedAction)) {
      prompt.cancel('Playground selection cancelled.')
      return null
    }

    if (typeof selectedAction !== 'string') {
      prompt.cancel('Playground selection cancelled.')
      return null
    }

    action = selectedAction
  }

  if (!appName) {
    const selectedApp = await prompt.select<string>({
      message: 'Select a playground app',
      options: apps.map(currentApp => ({
        value: currentApp,
        label: currentApp,
      })),
    })

    if (prompt.isCancel(selectedApp)) {
      prompt.cancel('Playground selection cancelled.')
      return null
    }

    if (typeof selectedApp !== 'string') {
      prompt.cancel('Playground selection cancelled.')
      return null
    }

    appName = selectedApp
  }

  if (!action || !appName) {
    return null
  }

  return {
    action,
    appName,
    extraArgs: parsedArgs.extraArgs,
  }
}

export function buildViteArgs(
  action: PlaygroundAction,
  appName: string,
  extraArgs: string[],
): string[] {
  const configPath = path.join('playgrounds', appName, 'vite.config.ts')
  const viteArgs =
    action === 'dev'
      ? ['exec', 'vite', '--config', configPath]
      : ['exec', 'vite', action, '--config', configPath]

  return [...viteArgs, ...extraArgs]
}

function run(command: string, args: string[]): Promise<number> {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd: repoRoot,
      stdio: 'inherit',
    })

    child.on('exit', (code) => {
      resolve(code ?? 1)
    })

    child.on('error', (error) => {
      process.stderr.write(`${error.message}\n`)
      resolve(1)
    })
  })
}

export async function main(argv: string[] = process.argv.slice(2), deps: MainDeps = {}): Promise<number> {
  const apps = deps.listApps?.() ?? listApps()
  const writeStderr = deps.writeStderr ?? (message => process.stderr.write(message))
  const parsedArgs = parseCliArgs(argv, apps)

  if (parsedArgs.errorMessage) {
    writeUsage(writeStderr, apps, parsedArgs.errorMessage)
    return 1
  }

  const resolvedArgs = await completeMissingSelections(parsedArgs, apps, deps.prompt)

  if (!resolvedArgs) {
    return 0
  }

  if ((resolvedArgs.action === 'dev' || resolvedArgs.action === 'build')
    && !(deps.hasPackageDist?.() ?? existsSync(packageDistEntry))) {
    writeStderr('Local dist package was not found. Run "pnpm build" or "pnpm dev" first.\n')
    return 1
  }

  return (deps.run ?? run)(
    'pnpm',
    buildViteArgs(resolvedArgs.action, resolvedArgs.appName, resolvedArgs.extraArgs),
  )
}

function isDirectExecution(): boolean {
  const scriptPath = process.argv[1]

  if (!scriptPath) {
    return false
  }

  return import.meta.url === pathToFileURL(scriptPath).href
}

if (isDirectExecution()) {
  main().then((exitCode) => {
    process.exit(exitCode)
  }).catch((error) => {
    const message = error instanceof Error ? error.message : String(error)
    process.stderr.write(`${message}\n`)
    process.exit(1)
  })
}
