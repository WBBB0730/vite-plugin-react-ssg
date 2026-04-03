import process from 'node:process'
import { existsSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const repoRoot = fileURLToPath(new URL('../', import.meta.url))
const playgroundsRoot = path.join(repoRoot, 'playgrounds')
const packageDistEntry = path.join(repoRoot, 'dist', 'index.mjs')
const supportedActions = ['dev', 'build', 'preview'] as const

type PlaygroundAction = (typeof supportedActions)[number]

function listApps(): string[] {
  return readdirSync(playgroundsRoot, { withFileTypes: true })
    .filter(entry => entry.isDirectory() && !entry.name.startsWith('_'))
    .map(entry => entry.name)
    .sort()
}

function exitWithUsage(message?: string): never {
  if (message) {
    process.stderr.write(`${message}\n`)
  }

  const apps = listApps()
  process.stderr.write('Usage: pnpm play <dev|build|preview> <app-name> [-- <vite-args>]\n')
  process.stderr.write(`Available apps: ${apps.join(', ')}\n`)
  process.exit(1)
}

function isPlaygroundAction(value: string): value is PlaygroundAction {
  return supportedActions.includes(value as PlaygroundAction)
}

function run(command: string, args: string[]): void {
  const child = spawn(command, args, {
    cwd: repoRoot,
    stdio: 'inherit',
  })

  child.on('exit', (code) => {
    process.exit(code ?? 1)
  })
}

const [actionArg, appName, ...extraArgs] = process.argv.slice(2)

if (!actionArg || !appName) {
  exitWithUsage()
}

if (!isPlaygroundAction(actionArg)) {
  exitWithUsage(`Unsupported action "${actionArg}".`)
}

if (!listApps().includes(appName)) {
  exitWithUsage(`Unknown playground app "${appName}".`)
}

if ((actionArg === 'dev' || actionArg === 'build') && !existsSync(packageDistEntry)) {
  process.stderr.write('Local dist package was not found. Run "pnpm build" or "pnpm dev" first.\n')
  process.exit(1)
}

const configPath = path.join('playgrounds', appName, 'vite.config.ts')
const viteArgs =
  actionArg === 'dev'
    ? ['exec', 'vite', '--config', configPath]
    : ['exec', 'vite', actionArg, '--config', configPath]

run('pnpm', [...viteArgs, ...extraArgs])
