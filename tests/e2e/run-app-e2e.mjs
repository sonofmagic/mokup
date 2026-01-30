import { existsSync } from 'node:fs'
import { createServer } from 'node:net'
import { dirname, join, relative, resolve } from 'node:path'
import process from 'node:process'
import { execa } from 'execa'

const HOST = '127.0.0.1'
const DEFAULT_TIMEOUT_MS = 60_000

function findRepoRoot(startDir) {
  let current = resolve(startDir)
  while (current !== dirname(current)) {
    if (isWorkspaceRoot(current)) {
      return current
    }
    current = dirname(current)
  }
  return startDir
}

function isWorkspaceRoot(dir) {
  try {
    return ['pnpm-workspace.yaml', 'turbo.json']
      .map(file => join(dir, file))
      .some(file => existsSync(file))
  }
  catch {
    return false
  }
}

function detectAppName(repoRoot, cwd, argName) {
  if (argName) {
    return argName
  }
  const rel = relative(repoRoot, cwd)
  const parts = rel.split(/[/\\]+/).filter(Boolean)
  if (parts[0] === 'apps' && parts[1]) {
    return parts[1]
  }
  throw new Error('Unable to determine app name. Pass it as the first argument.')
}

function getAppConfig(appName, repoRoot, appRoot) {
  const viteBin = join(repoRoot, 'node_modules', '.bin', 'vite')
  const vitepressBin = join(repoRoot, 'node_modules', '.bin', 'vitepress')
  const tsxBin = join(repoRoot, 'node_modules', '.bin', 'tsx')

  const configs = {
    'mokup-web-demo': {
      readyPath: '/',
      server: { command: viteBin, args: [] },
    },
    'mokup-vite-server-demo': {
      readyPath: '/',
      server: { command: viteBin, args: [] },
    },
    'mokup-vite-sw-demo': {
      readyPath: '/',
      server: { command: viteBin, args: [] },
    },
    'mokup-vite-host-sw-demo': {
      readyPath: '/',
      server: { command: viteBin, args: [] },
    },
    'mokup-d1-demo': {
      readyPath: '/',
      server: { command: viteBin, args: [] },
    },
    'mokup-docs': {
      readyPath: '/',
      server: { command: vitepressBin, args: ['dev', 'docs'] },
    },
    'mokup-webpack-demo': {
      readyPath: '/',
      server: {
        command: tsxBin,
        args: [
          join(appRoot, 'node_modules/webpack-cli/bin/cli.js'),
          'serve',
          '--config',
          'webpack.config.ts',
          '--mode',
          'development',
        ],
      },
    },
    'mokup-node-demo': {
      readyPath: '/ping',
      server: {
        command: tsxBin,
        args: ['src/index.ts'],
        env: {},
      },
    },
    'mokup-middleware-demo': {
      readyPath: '/',
      preCommands: [
        { command: 'pnpm', args: ['build:mock'] },
      ],
      server: {
        command: tsxBin,
        args: ['src/index.ts'],
        env: {},
      },
    },
  }

  const config = configs[appName]
  if (!config) {
    throw new Error(`Unknown app name: ${appName}`)
  }
  return config
}

function getFreePort(host) {
  return new Promise((resolve, reject) => {
    const server = createServer()
    server.unref()
    server.on('error', reject)
    server.listen(0, host, () => {
      const address = server.address()
      if (!address || typeof address === 'string') {
        reject(new Error('Failed to acquire a port.'))
        return
      }
      const { port } = address
      server.close(() => resolve(port))
    })
  })
}

async function waitForHttp(url, timeoutMs) {
  const deadline = Date.now() + timeoutMs
  let lastError
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url, { method: 'GET' })
      if (response.ok || response.status < 500) {
        return
      }
    }
    catch (error) {
      lastError = error
    }
    await new Promise(resolve => setTimeout(resolve, 250))
  }
  throw new Error(`Timeout waiting for ${url}: ${String(lastError)}`)
}

async function stopProcess(child) {
  if (!child || child.killed) {
    return
  }
  child.kill('SIGTERM')
  const timeout = setTimeout(() => {
    if (!child.killed && child.exitCode === null) {
      child.kill('SIGKILL')
    }
  }, 5_000)
  try {
    await child
  }
  catch {
    // ignore termination errors
  }
  finally {
    clearTimeout(timeout)
  }
}

async function main() {
  const cwd = process.cwd()
  const repoRoot = findRepoRoot(cwd)
  const rawArgs = process.argv.slice(2)
  const hasAppArg = rawArgs.length > 0 && !rawArgs[0].startsWith('-')
  const appArg = hasAppArg ? rawArgs[0] : undefined
  let extraArgs = hasAppArg ? rawArgs.slice(1) : rawArgs
  if (extraArgs[0] === '--') {
    extraArgs = extraArgs.slice(1)
  }
  const appName = detectAppName(repoRoot, cwd, appArg)
  const appRoot = join(repoRoot, 'apps', appName)
  const appConfig = getAppConfig(appName, repoRoot, appRoot)

  const port = await getFreePort(HOST)
  const baseURL = `http://${HOST}:${port}`
  const readyUrl = new URL(appConfig.readyPath, baseURL).toString()

  const env = {
    ...process.env,
    ...appConfig.server.env,
    PORT: String(port),
  }

  if (appConfig.preCommands?.length) {
    for (const command of appConfig.preCommands) {
      await execa(command.command, command.args, {
        cwd: appRoot,
        env,
        stdio: 'inherit',
      })
    }
  }

  const devArgs = [
    ...appConfig.server.args,
    ...(appConfig.server.command.includes('vitepress')
      ? ['--host', HOST, '--port', String(port)]
      : []),
  ]

  if (appConfig.server.command.includes('vite') && !appConfig.server.command.includes('vitepress')) {
    devArgs.push('--host', HOST, '--port', String(port))
  }

  if (appName === 'mokup-webpack-demo') {
    devArgs.push('--port', String(port))
  }

  const devProcess = execa(appConfig.server.command, devArgs, {
    cwd: appRoot,
    env,
    stdio: 'inherit',
  })

  const onExit = async () => {
    await stopProcess(devProcess)
  }
  process.once('SIGINT', onExit)
  process.once('SIGTERM', onExit)

  try {
    await waitForHttp(readyUrl, DEFAULT_TIMEOUT_MS)

    const playwrightArgs = ['exec', 'playwright', 'test', ...extraArgs]
    await execa('pnpm', playwrightArgs, {
      cwd: appRoot,
      env: {
        ...env,
        E2E_BASE_URL: baseURL,
        E2E_PORT: String(port),
        E2E_APP_NAME: appName,
      },
      stdio: 'inherit',
    })
  }
  finally {
    process.off('SIGINT', onExit)
    process.off('SIGTERM', onExit)
    await stopProcess(devProcess)
  }
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`)
  process.exit(1)
})
