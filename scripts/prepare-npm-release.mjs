import process from 'node:process'
import { readFile } from 'node:fs/promises'

const RELEASE_TAG_PATTERN = /^refs\/tags\/v(?<version>\d+\.\d+\.\d+(?:-beta\.\d+)?)$/

function createTagError(gitRef) {
  return {
    ok: false,
    message: `Unsupported release tag "${gitRef}". Expected v<major>.<minor>.<patch> or v<major>.<minor>.<patch>-beta.<n>.`,
  }
}

export function resolvePublishPlan({ gitRef, packageVersion }) {
  const match = RELEASE_TAG_PATTERN.exec(gitRef)

  if (!match?.groups?.version) {
    return createTagError(gitRef)
  }

  const { version } = match.groups

  if (version !== packageVersion) {
    return {
      ok: false,
      message: `Tag version "${version}" does not match package.json version "${packageVersion}".`,
    }
  }

  const isPrerelease = version.includes('-beta.')

  return {
    ok: true,
    version,
    distTag: isPrerelease ? 'beta' : null,
    publishArgs: isPrerelease ? ['--tag', 'beta'] : [],
    isPrerelease,
  }
}

export function resolvePublishPlanOrThrow(input) {
  const result = resolvePublishPlan(input)

  if (!result.ok) {
    throw new Error(result.message)
  }

  return result
}

async function readPackageVersion(packageJsonPath) {
  const packageJsonContent = await readFile(packageJsonPath, 'utf8')
  const packageJson = JSON.parse(packageJsonContent)

  if (!packageJson.version || typeof packageJson.version !== 'string') {
    throw new Error(`package.json at "${packageJsonPath}" is missing a valid version field.`)
  }

  return packageJson.version
}

function writeGitHubOutput(plan, githubOutput) {
  if (!githubOutput) {
    return
  }

  const lines = [
    `version=${plan.version}`,
    `dist_tag=${plan.distTag ?? ''}`,
    `publish_args=${plan.publishArgs.join(' ')}`,
    `is_prerelease=${String(plan.isPrerelease)}`,
  ]

  return import('node:fs/promises').then(({ appendFile }) =>
    appendFile(githubOutput, `${lines.join('\n')}\n`, 'utf8'))
}

async function main() {
  const gitRef = process.env['GITHUB_REF']

  if (!gitRef) {
    throw new Error('GITHUB_REF is required.')
  }

  const packageJsonPath = process.env['PACKAGE_JSON_PATH'] ?? new URL('../package.json', import.meta.url)
  const packageVersion = await readPackageVersion(packageJsonPath)
  const plan = resolvePublishPlanOrThrow({
    gitRef,
    packageVersion,
  })

  await writeGitHubOutput(plan, process.env['GITHUB_OUTPUT'])

  process.stdout.write(`${JSON.stringify(plan, null, 2)}\n`)
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    const message = error instanceof Error ? error.message : String(error)
    process.stderr.write(`${message}\n`)
    process.exitCode = 1
  })
}
