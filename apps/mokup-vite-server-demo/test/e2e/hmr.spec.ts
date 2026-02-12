import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { expect, test } from '@playwright/test'
import { writeJson } from '../../../../tests/e2e/utils/fs'

const mockDir = join(process.cwd(), 'mock')

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface FileBackup {
  path: string
  content: string | null
}

const backups: FileBackup[] = []

async function backupFile(filePath: string) {
  try {
    const content = await readFile(filePath, 'utf8')
    backups.push({ path: filePath, content })
  }
  catch {
    backups.push({ path: filePath, content: null })
  }
}

async function restoreAll() {
  for (const backup of backups.reverse()) {
    if (backup.content === null) {
      await rm(backup.path, { force: true })
    }
    else {
      await writeFile(backup.path, backup.content, 'utf8')
    }
  }
  backups.length = 0
}

async function pollApi(
  request: import('@playwright/test').APIRequestContext,
  path: string,
  check: (body: Record<string, unknown>) => boolean,
  timeout = 15_000,
) {
  await expect.poll(async () => {
    const res = await request.get(path, {
      headers: { 'cache-control': 'no-cache' },
    })
    if (!res.ok()) {
      return false
    }
    const json = await res.json() as Record<string, unknown>
    return check(json)
  }, { timeout }).toBe(true)
}

function removeBackup(filePath: string) {
  const idx = backups.findIndex(b => b.path === filePath)
  if (idx >= 0) {
    backups.splice(idx, 1)
  }
}

function removeBackupsUnder(dirPath: string) {
  const idxs = backups
    .map((b, i) => (b.path.startsWith(dirPath) ? i : -1))
    .filter(i => i >= 0)
    .reverse()
  for (const i of idxs) {
    backups.splice(i, 1)
  }
}

test.afterEach(async () => {
  await restoreAll()
})

// ---------------------------------------------------------------------------
// Edit existing mocks
// ---------------------------------------------------------------------------

test.describe('edit existing mocks', () => {
  test('editing a JSON mock triggers hot reload', async ({ request }) => {
    const filePath = join(mockDir, 'status.get.json')
    await backupFile(filePath)

    const stamp = `edit-${Date.now()}`
    await writeJson(filePath, { status: 'ok', e2e: stamp })

    await pollApi(request, '/api/status', body => body['e2e'] === stamp)
  })

  test('editing a JSONC mock triggers hot reload', async ({ request }) => {
    const filePath = join(mockDir, 'summary.get.jsonc')
    await backupFile(filePath)

    const stamp = `jsonc-${Date.now()}`
    const content = [
      '{',
      '  // JSONC with comments',
      `  "service": "mokup-vite-server-demo-${stamp}",`,
      `  "e2e": "${stamp}"`,
      '}',
      '',
    ].join('\n')
    await writeFile(filePath, content, 'utf8')

    await pollApi(request, '/api/summary', body => body['e2e'] === stamp)
  })

  test('editing a TS handler mock triggers hot reload', async ({ request }) => {
    const filePath = join(mockDir, 'variants.get.ts')
    await backupFile(filePath)

    const marker = `ts-${Date.now()}`
    const content = [
      'import { defineHandler } from \'mokup\'',
      '',
      'export default defineHandler(() => {',
      `  return { ok: true, marker: '${marker}' }`,
      '})',
      '',
    ].join('\n')
    await writeFile(filePath, content, 'utf8')

    await pollApi(request, '/api/variants', body => body['marker'] === marker)
  })
})

// ---------------------------------------------------------------------------
// Add new mocks
// ---------------------------------------------------------------------------

test.describe('add new mocks', () => {
  test('adding a new JSON mock registers a route', async ({ request }) => {
    const filePath = join(mockDir, 'e2e-new.get.json')
    await backupFile(filePath)

    await writeJson(filePath, { created: true, ts: Date.now() })

    await pollApi(request, '/api/e2e-new', body => body['created'] === true)
  })

  test('adding a new TS handler mock registers a route', async ({ request }) => {
    const filePath = join(mockDir, 'e2e-new-ts.get.ts')
    await backupFile(filePath)

    const marker = `new-${Date.now()}`
    const content = [
      'import { defineHandler } from \'mokup\'',
      '',
      `export default defineHandler(() => ({ added: true, marker: '${marker}' }))`,
      '',
    ].join('\n')
    await writeFile(filePath, content, 'utf8')

    await pollApi(request, '/api/e2e-new-ts', body => body['marker'] === marker)
  })

  test('adding a POST mock registers the correct method', async ({ request }) => {
    const filePath = join(mockDir, 'e2e-post.post.json')
    await backupFile(filePath)

    await writeJson(filePath, { method: 'POST', ok: true })

    await expect.poll(async () => {
      const res = await request.post('/api/e2e-post', {
        headers: { 'content-type': 'application/json' },
        data: {},
      })
      if (!res.ok()) {
        return false
      }
      const json = await res.json() as Record<string, unknown>
      return json['method'] === 'POST'
    }, { timeout: 15_000 }).toBe(true)
  })

  test('adding a mock in a new subdirectory registers a nested route', async ({ request }) => {
    const dirPath = join(mockDir, 'e2e-sub')
    const filePath = join(dirPath, 'info.get.json')
    await backupFile(filePath)

    await mkdir(dirPath, { recursive: true })
    await writeJson(filePath, { nested: true })

    await pollApi(request, '/api/e2e-sub/info', body => body['nested'] === true)

    backups.push({ path: dirPath, content: null })
  })
})

// ---------------------------------------------------------------------------
// Delete mocks
// ---------------------------------------------------------------------------

test.describe('delete mocks', () => {
  test('deleting a mock file removes the route', async ({ request }) => {
    const filePath = join(mockDir, 'e2e-del.get.json')
    await backupFile(filePath)

    await writeJson(filePath, { temp: true })
    await pollApi(request, '/api/e2e-del', body => body['temp'] === true)

    await rm(filePath, { force: true })
    removeBackup(filePath)

    await expect.poll(async () => {
      const res = await request.get('/api/e2e-del', {
        headers: { 'cache-control': 'no-cache' },
      })
      return res.status()
    }, { timeout: 15_000 }).toBeGreaterThanOrEqual(400)
  })

  test('deleting a TS handler removes the route', async ({ request }) => {
    const filePath = join(mockDir, 'e2e-del-ts.get.ts')
    await backupFile(filePath)

    const content = [
      'import { defineHandler } from \'mokup\'',
      'export default defineHandler(() => ({ alive: true }))',
      '',
    ].join('\n')
    await writeFile(filePath, content, 'utf8')
    await pollApi(request, '/api/e2e-del-ts', body => body['alive'] === true)

    await rm(filePath, { force: true })
    removeBackup(filePath)

    await expect.poll(async () => {
      const res = await request.get('/api/e2e-del-ts', {
        headers: { 'cache-control': 'no-cache' },
      })
      return res.status()
    }, { timeout: 15_000 }).toBeGreaterThanOrEqual(400)
  })

  test('deleting a directory removes all its routes', async ({ request }) => {
    const dirPath = join(mockDir, 'e2e-dir-del')
    const file1 = join(dirPath, 'one.get.json')
    const file2 = join(dirPath, 'two.get.json')
    await backupFile(file1)
    await backupFile(file2)

    await mkdir(dirPath, { recursive: true })
    await writeJson(file1, { route: 'one' })
    await writeJson(file2, { route: 'two' })

    await pollApi(request, '/api/e2e-dir-del/one', body => body['route'] === 'one')
    await pollApi(request, '/api/e2e-dir-del/two', body => body['route'] === 'two')

    await rm(dirPath, { recursive: true, force: true })
    removeBackupsUnder(dirPath)

    await expect.poll(async () => {
      const res = await request.get('/api/e2e-dir-del/one', {
        headers: { 'cache-control': 'no-cache' },
      })
      return res.status()
    }, { timeout: 15_000 }).toBeGreaterThanOrEqual(400)
  })
})

// ---------------------------------------------------------------------------
// Replace / swap
// ---------------------------------------------------------------------------

test.describe('replace mock content', () => {
  test('overwriting JSON with different structure', async ({ request }) => {
    const filePath = join(mockDir, 'e2e-swap.get.json')
    await backupFile(filePath)

    await writeJson(filePath, { v: 1 })
    await pollApi(request, '/api/e2e-swap', body => body['v'] === 1)

    await writeJson(filePath, { v: 2, extra: 'added' })
    await pollApi(request, '/api/e2e-swap', body => body['v'] === 2 && body['extra'] === 'added')
  })

  test('switching from JSON to TS handler', async ({ request }) => {
    const jsonPath = join(mockDir, 'e2e-format.get.json')
    const tsPath = join(mockDir, 'e2e-format.get.ts')
    await backupFile(jsonPath)
    await backupFile(tsPath)

    await writeJson(jsonPath, { format: 'json' })
    await pollApi(request, '/api/e2e-format', body => body['format'] === 'json')

    await rm(jsonPath, { force: true })
    const tsContent = [
      'import { defineHandler } from \'mokup\'',
      'export default defineHandler(() => ({ format: \'ts\' }))',
      '',
    ].join('\n')
    await writeFile(tsPath, tsContent, 'utf8')

    await pollApi(request, '/api/e2e-format', body => body['format'] === 'ts')
  })
})

// ---------------------------------------------------------------------------
// Full lifecycle
// ---------------------------------------------------------------------------

test.describe('full lifecycle: add → edit → delete', () => {
  test('JSON mock full lifecycle', async ({ request }) => {
    const filePath = join(mockDir, 'e2e-life.get.json')
    await backupFile(filePath)

    // Add
    await writeJson(filePath, { phase: 'created' })
    await pollApi(request, '/api/e2e-life', body => body['phase'] === 'created')

    // Edit
    await writeJson(filePath, { phase: 'updated' })
    await pollApi(request, '/api/e2e-life', body => body['phase'] === 'updated')

    // Delete
    await rm(filePath, { force: true })
    removeBackup(filePath)

    await expect.poll(async () => {
      const res = await request.get('/api/e2e-life', {
        headers: { 'cache-control': 'no-cache' },
      })
      return res.status()
    }, { timeout: 15_000 }).toBeGreaterThanOrEqual(400)
  })

  test('re-creating a deleted mock restores the route', async ({ request }) => {
    const filePath = join(mockDir, 'e2e-revive.get.json')
    await backupFile(filePath)

    await writeJson(filePath, { round: 1 })
    await pollApi(request, '/api/e2e-revive', body => body['round'] === 1)

    await rm(filePath, { force: true })
    await expect.poll(async () => {
      const res = await request.get('/api/e2e-revive', {
        headers: { 'cache-control': 'no-cache' },
      })
      return res.status()
    }, { timeout: 15_000 }).toBeGreaterThanOrEqual(400)

    await writeJson(filePath, { round: 2 })
    await pollApi(request, '/api/e2e-revive', body => body['round'] === 2)
  })
})
