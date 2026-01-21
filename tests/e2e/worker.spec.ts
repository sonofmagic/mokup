import { expect, test } from '@playwright/test'
import { createMokupWorker } from 'mokup/server'
import { runCommand } from './utils/command'
import { ensureEmptyDir } from './utils/fs'
import { repoRoot } from './utils/paths'

const mockDir = 'apps/web/mock'

test('worker bundle serves json and handler responses', async (_context, testInfo) => {
  const outDir = testInfo.outputPath('worker-build')
  await ensureEmptyDir(outDir)

  await runCommand(
    'pnpm',
    ['exec', 'mokup', 'build', '--dir', mockDir, '--out', outDir],
    { cwd: repoRoot },
  )

  const worker = await createMokupWorker(outDir)

  const profileResponse = await worker.fetch(
    new Request('http://localhost/profile'),
  )
  const profileJson = await profileResponse.json() as Record<string, unknown>
  expect(profileJson.name).toBe('Orion Vale')

  const loginResponse = await worker.fetch(
    new Request('http://localhost/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'mokup',
        password: '123456',
      }),
    }),
  )
  const loginJson = await loginResponse.json() as Record<string, unknown>
  expect(loginJson.token).toBe('mock-token-7d91')
})
