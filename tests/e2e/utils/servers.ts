import type { ExecaChildProcess } from 'execa'

import process from 'node:process'
import { execa } from 'execa'
import { WEB_BASE_URL, WEB_HOST, WEB_PORT } from '../constants'
import { isPortOpen, waitForHttp } from './net'

export interface RunningServer {
  name: string
  process: ExecaChildProcess
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

  const child = execa(
    'pnpm',
    ['--filter', 'web', 'dev', '--', '--host', host, '--port', String(port)],
    {
      cwd: params?.cwd,
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
    server.process.kill('SIGTERM', {
      forceKillAfterTimeout: 5_000,
    })
    try {
      await server.process
    }
    catch {
      // ignore termination errors
    }
  }))
}
