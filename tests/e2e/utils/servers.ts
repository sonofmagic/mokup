import { join } from 'node:path'
import process from 'node:process'
import { execa } from 'execa'
import { WEB_BASE_URL, WEB_HOST, WEB_PORT } from '../constants'
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
}) {
  const reuseExistingServer = params?.reuseExistingServer ?? false
  const port = WEB_PORT
  const host = WEB_HOST
  if (reuseExistingServer && await isPortOpen(port, host)) {
    return null
  }

  const repoRoot = params?.cwd ?? process.cwd()
  const viteBin = join(repoRoot, 'node_modules', '.bin', 'vite')
  const appRoot = join(repoRoot, 'apps', 'web')
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

  await waitForHttp(WEB_BASE_URL, 60_000)

  return {
    name: 'web',
    process: child,
    url: WEB_BASE_URL,
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
