import { isAbsolute, join, resolve } from 'node:path'
import process from 'node:process'
import { execa } from 'execa'
import { WEB_HOST, WEB_PORT } from '../constants'
import { isPortOpen, waitForHttp } from './net'

export interface RunningServer {
  name: string
  process: ReturnType<typeof execa>
  url: string
}

export async function startViteServer(params?: {
  reuseExistingServer?: boolean
  cwd?: string
  env?: NodeJS.ProcessEnv
  appDir?: string
  host?: string
  port?: number
  name?: string
}) {
  const reuseExistingServer = params?.reuseExistingServer ?? false
  const port = params?.port ?? WEB_PORT
  const host = params?.host ?? WEB_HOST
  const baseUrl = `http://${host}:${port}`
  if (reuseExistingServer && await isPortOpen(port, host)) {
    return null
  }

  const repoRoot = params?.cwd ?? process.cwd()
  const appDir = params?.appDir ?? join('apps', 'web')
  const appRoot = isAbsolute(appDir) ? appDir : resolve(repoRoot, appDir)
  const name = params?.name ?? 'web'
  const viteBin = join(repoRoot, 'node_modules', '.bin', 'vite')
  const child = execa(
    viteBin,
    ['--host', host, '--port', String(port)],
    {
      cwd: appRoot,
      env: {
        ...process.env,
        ...params?.env,
      },
      stdio: 'inherit',
    },
  )

  await waitForHttp(baseUrl, 60_000)

  return {
    name,
    process: child,
    url: baseUrl,
  } satisfies RunningServer
}

export async function stopServers(servers: RunningServer[]) {
  await Promise.all(servers.map(async (server) => {
    if (server.process.killed) {
      return
    }
    server.process.kill('SIGTERM')
    const killTimer = setTimeout(() => {
      if (!server.process.killed && server.process.exitCode === null) {
        server.process.kill('SIGKILL')
      }
    }, 5_000)
    try {
      await server.process
    }
    catch {
      // ignore termination errors
    }
    finally {
      clearTimeout(killTimer)
    }
  }))
}
