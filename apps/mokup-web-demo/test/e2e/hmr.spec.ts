import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { expect, test } from '@playwright/test'
import { writeJson } from '../../../../tests/e2e/utils/fs'
import { repoRoot } from '../../../../tests/e2e/utils/paths'

const heartbeatPath = join(repoRoot, 'apps/mokup-web-demo/mock/heartbeat.get.json')

let originalRaw = ''
let originalJson: Record<string, unknown> = {}

test.beforeAll(async () => {
  originalRaw = await readFile(heartbeatPath, 'utf8')
  originalJson = JSON.parse(originalRaw) as Record<string, unknown>
})

test.afterAll(async () => {
  if (originalRaw) {
    await writeFile(heartbeatPath, originalRaw, 'utf8')
  }
})

test('hot reload picks up file changes', async ({ request }) => {
  const stamp = `e2e-${Date.now()}`
  const updated = {
    ...originalJson,
    e2e: stamp,
  }

  await writeJson(heartbeatPath, updated)

  await expect.poll(async () => {
    const response = await request.get('/api/heartbeat')
    const data = await response.json() as Record<string, unknown>
    return data.e2e
  }, {
    timeout: 15_000,
  }).toBe(stamp)
})
