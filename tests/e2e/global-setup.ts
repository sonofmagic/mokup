import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { runCommand } from './utils/command'
import { startViteServer, stopServers } from './utils/servers'

const repoRoot = fileURLToPath(new URL('../..', import.meta.url))

const buildPackages = [
  '@mokup/shared',
  '@mokup/runtime',
  '@mokup/playground',
  '@mokup/server',
  '@mokup/cli',
  'mokup',
]

export default async function globalSetup() {
  if (!process.env.MOKUP_E2E_SKIP_BUILD) {
    for (const pkg of buildPackages) {
      await runCommand('pnpm', ['--filter', pkg, 'build'], { cwd: repoRoot })
    }
  }

  const servers = [] as NonNullable<Awaited<ReturnType<typeof startViteServer>>>[]
  const reuseExistingServer = !process.env.CI
  const viteServer = await startViteServer({
    cwd: repoRoot,
    env: {
      VITE_USE_MOCK: 'false',
    },
    reuseExistingServer,
  })
  if (viteServer) {
    servers.push(viteServer)
  }

  return async () => {
    await stopServers(servers)
  }
}
