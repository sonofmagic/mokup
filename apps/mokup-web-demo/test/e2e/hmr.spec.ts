import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { expect, test } from '@playwright/test'
import { writeJson } from '../../../../tests/e2e/utils/fs'
import { repoRoot } from '../../../../tests/e2e/utils/paths'

const mockDir = join(repoRoot, 'apps/mokup-web-demo/mock')

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface FileBackup {
  path: string
  content: string | null // null means the file did not exist (was created by the test)
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

// Ensure all files are restored even if a test fails
test.afterEach(async () => {
  await restoreAll()
})

// ---------------------------------------------------------------------------
// 1. Edit existing JSON mock — basic hot reload
// ---------------------------------------------------------------------------

test.describe('edit existing mock files', () => {
  test('editing a JSON mock file triggers hot reload', async ({ request }) => {
    const filePath = join(mockDir, 'heartbeat.get.json')
    await backupFile(filePath)

    const stamp = `edit-json-${Date.now()}`
    const original = JSON.parse(await readFile(filePath, 'utf8'))
    await writeJson(filePath, { ...original, e2e: stamp })

    await pollApi(request, '/api/heartbeat', body => body['e2e'] === stamp)
  })

  test('editing a JSON mock replaces the entire response body', async ({ request }) => {
    const filePath = join(mockDir, 'heartbeat.get.json')
    await backupFile(filePath)

    const replacement = {
      status: 'replaced',
      extra: 42,
      nested: { ok: true },
    }
    await writeJson(filePath, replacement)

    await pollApi(request, '/api/heartbeat', (body) => {
      return body['status'] === 'replaced'
        && body['extra'] === 42
        && (body['nested'] as Record<string, unknown>)?.['ok'] === true
    })
  })

  test('editing a TS handler mock triggers hot reload', async ({ request }) => {
    const filePath = join(mockDir, 'health.get.ts')
    await backupFile(filePath)

    const marker = `ts-edit-${Date.now()}`
    const newContent = [
      'import type { RouteRule } from \'mokup\'',
      '',
      'const rule: RouteRule = {',
      `  handler: () => ({ ok: true, marker: '${marker}' }),`,
      '}',
      '',
      'export default rule',
      '',
    ].join('\n')
    await writeFile(filePath, newContent, 'utf8')

    await pollApi(request, '/api/health', body => body['marker'] === marker)
  })

  test('editing a JSONC mock file triggers hot reload', async ({ request }) => {
    const filePath = join(mockDir, 'about.get.jsonc')
    await backupFile(filePath)

    const stamp = `jsonc-${Date.now()}`
    const newContent = [
      '{',
      '  // JSONC supports comments',
      `  "version": "0.1.0-e2e-${stamp}",`,
      '  "mission": "Mock APIs at lightspeed",',
      `  "e2e": "${stamp}"`,
      '}',
      '',
    ].join('\n')
    await writeFile(filePath, newContent, 'utf8')

    await pollApi(request, '/api/about', body => body['e2e'] === stamp)
  })

  test('rapid successive edits settle to the last value', async ({ request }) => {
    const filePath = join(mockDir, 'heartbeat.get.json')
    await backupFile(filePath)

    const original = JSON.parse(await readFile(filePath, 'utf8'))

    // Fire several writes in quick succession
    for (let i = 0; i < 5; i++) {
      await writeJson(filePath, { ...original, rapid: `v${i}` })
    }
    const finalStamp = `final-${Date.now()}`
    await writeJson(filePath, { ...original, rapid: finalStamp })

    await pollApi(request, '/api/heartbeat', body => body['rapid'] === finalStamp)
  })
})

// ---------------------------------------------------------------------------
// 2. Add new mock files — hot reload picks up new routes
// ---------------------------------------------------------------------------

test.describe('add new mock files', () => {
  test('adding a new JSON mock file registers a new route', async ({ request }) => {
    const filePath = join(mockDir, 'e2e-new-route.get.json')
    await backupFile(filePath)

    const payload = { created: true, ts: Date.now() }
    await writeJson(filePath, payload)

    await pollApi(request, '/api/e2e-new-route', body => body['created'] === true)
  })

  test('adding a new TS handler mock file registers a new route', async ({ request }) => {
    const filePath = join(mockDir, 'e2e-new-handler.get.ts')
    await backupFile(filePath)

    const marker = `new-ts-${Date.now()}`
    const content = [
      'import type { RouteRule } from \'mokup\'',
      '',
      'const rule: RouteRule = {',
      `  handler: () => ({ added: true, marker: '${marker}' }),`,
      '}',
      '',
      'export default rule',
      '',
    ].join('\n')
    await writeFile(filePath, content, 'utf8')

    await pollApi(request, '/api/e2e-new-handler', body => body['marker'] === marker)
  })

  test('adding a new POST mock file registers the correct method', async ({ request }) => {
    const filePath = join(mockDir, 'e2e-new-post.post.json')
    await backupFile(filePath)

    await writeJson(filePath, { method: 'POST', ok: true })

    await expect.poll(async () => {
      const res = await request.post('/api/e2e-new-post', {
        headers: { 'content-type': 'application/json' },
        data: {},
      })
      if (!res.ok()) {
        return false
      }
      const json = await res.json() as Record<string, unknown>
      return json['method'] === 'POST' && json['ok'] === true
    }, { timeout: 15_000 }).toBe(true)
  })

  test('adding a new mock file in a subdirectory registers a nested route', async ({ request }) => {
    const dirPath = join(mockDir, 'e2e-nested')
    const filePath = join(dirPath, 'info.get.json')
    await backupFile(filePath)

    await mkdir(dirPath, { recursive: true })
    await writeJson(filePath, { nested: true, level: 'deep' })

    await pollApi(request, '/api/e2e-nested/info', body => body['nested'] === true)

    // Cleanup the directory too
    backups.push({ path: dirPath, content: null })
  })

  test('adding a dynamic route mock file works', async ({ request }) => {
    const dirPath = join(mockDir, 'e2e-items')
    const filePath = join(dirPath, '[id].get.ts')
    await backupFile(filePath)

    const content = [
      'import type { RequestHandler, RouteRule } from \'mokup\'',
      '',
      'const handler: RequestHandler = (c) => {',
      '  return { ok: true, id: c.req.param(\'id\') }',
      '}',
      '',
      'const rule: RouteRule = { handler }',
      'export default rule',
      '',
    ].join('\n')

    await mkdir(dirPath, { recursive: true })
    await writeFile(filePath, content, 'utf8')

    await pollApi(request, '/api/e2e-items/42', body => body['id'] === '42')

    backups.push({ path: dirPath, content: null })
  })
})

// ---------------------------------------------------------------------------
// 3. Delete mock files — routes are removed
// ---------------------------------------------------------------------------

test.describe('delete mock files', () => {
  test('deleting a JSON mock file removes the route', async ({ request }) => {
    const filePath = join(mockDir, 'e2e-to-delete.get.json')
    await backupFile(filePath)

    await writeJson(filePath, { temporary: true })
    await pollApi(request, '/api/e2e-to-delete', body => body['temporary'] === true)

    await rm(filePath, { force: true })
    removeBackup(filePath)

    await expect.poll(async () => {
      const res = await request.get('/api/e2e-to-delete', {
        headers: { 'cache-control': 'no-cache' },
      })
      return res.status()
    }, { timeout: 15_000 }).toBeGreaterThanOrEqual(400)
  })

  test('deleting a TS handler mock file removes the route', async ({ request }) => {
    const filePath = join(mockDir, 'e2e-ts-delete.get.ts')
    await backupFile(filePath)

    const content = [
      'import type { RouteRule } from \'mokup\'',
      'const rule: RouteRule = { handler: () => ({ alive: true }) }',
      'export default rule',
      '',
    ].join('\n')
    await writeFile(filePath, content, 'utf8')
    await pollApi(request, '/api/e2e-ts-delete', body => body['alive'] === true)

    await rm(filePath, { force: true })
    removeBackup(filePath)

    await expect.poll(async () => {
      const res = await request.get('/api/e2e-ts-delete', {
        headers: { 'cache-control': 'no-cache' },
      })
      return res.status()
    }, { timeout: 15_000 }).toBeGreaterThanOrEqual(400)
  })

  test('deleting a directory of mocks removes all its routes', async ({ request }) => {
    const dirPath = join(mockDir, 'e2e-dir-delete')
    const file1 = join(dirPath, 'alpha.get.json')
    const file2 = join(dirPath, 'beta.get.json')
    await backupFile(file1)
    await backupFile(file2)

    await mkdir(dirPath, { recursive: true })
    await writeJson(file1, { route: 'alpha' })
    await writeJson(file2, { route: 'beta' })

    await pollApi(request, '/api/e2e-dir-delete/alpha', body => body['route'] === 'alpha')
    await pollApi(request, '/api/e2e-dir-delete/beta', body => body['route'] === 'beta')

    await rm(dirPath, { recursive: true, force: true })
    removeBackupsUnder(dirPath)

    await expect.poll(async () => {
      const res = await request.get('/api/e2e-dir-delete/alpha', {
        headers: { 'cache-control': 'no-cache' },
      })
      return res.status()
    }, { timeout: 15_000 }).toBeGreaterThanOrEqual(400)

    await expect.poll(async () => {
      const res = await request.get('/api/e2e-dir-delete/beta', {
        headers: { 'cache-control': 'no-cache' },
      })
      return res.status()
    }, { timeout: 15_000 }).toBeGreaterThanOrEqual(400)
  })
})

// ---------------------------------------------------------------------------
// 4. Replace / overwrite mock files — content swap
// ---------------------------------------------------------------------------

test.describe('replace mock file content', () => {
  test('overwriting a JSON mock with completely different structure', async ({ request }) => {
    const filePath = join(mockDir, 'e2e-replace.get.json')
    await backupFile(filePath)

    await writeJson(filePath, { version: 1, shape: 'original' })
    await pollApi(request, '/api/e2e-replace', body => body['version'] === 1)

    await writeJson(filePath, { version: 2, newField: 'replaced', array: [1, 2, 3] })
    await pollApi(request, '/api/e2e-replace', (body) => {
      return body['version'] === 2
        && body['newField'] === 'replaced'
        && Array.isArray(body['array'])
    })
  })

  test('switching a route from JSON to TS handler', async ({ request }) => {
    const jsonPath = join(mockDir, 'e2e-switch.get.json')
    const tsPath = join(mockDir, 'e2e-switch.get.ts')
    await backupFile(jsonPath)
    await backupFile(tsPath)

    await writeJson(jsonPath, { type: 'json', ok: true })
    await pollApi(request, '/api/e2e-switch', body => body['type'] === 'json')

    await rm(jsonPath, { force: true })
    const tsContent = [
      'import type { RouteRule } from \'mokup\'',
      'const rule: RouteRule = { handler: () => ({ type: \'ts\', ok: true }) }',
      'export default rule',
      '',
    ].join('\n')
    await writeFile(tsPath, tsContent, 'utf8')

    await pollApi(request, '/api/e2e-switch', body => body['type'] === 'ts')
  })

  test('switching a route from TS handler to JSON', async ({ request }) => {
    const tsPath = join(mockDir, 'e2e-switch-back.get.ts')
    const jsonPath = join(mockDir, 'e2e-switch-back.get.json')
    await backupFile(tsPath)
    await backupFile(jsonPath)

    const tsContent = [
      'import type { RouteRule } from \'mokup\'',
      'const rule: RouteRule = { handler: () => ({ type: \'ts\' }) }',
      'export default rule',
      '',
    ].join('\n')
    await writeFile(tsPath, tsContent, 'utf8')
    await pollApi(request, '/api/e2e-switch-back', body => body['type'] === 'ts')

    await rm(tsPath, { force: true })
    await writeJson(jsonPath, { type: 'json' })

    await pollApi(request, '/api/e2e-switch-back', body => body['type'] === 'json')
  })
})

// ---------------------------------------------------------------------------
// 5. Add → Edit → Delete lifecycle
// ---------------------------------------------------------------------------

test.describe('full lifecycle: add → edit → delete', () => {
  test('JSON mock full lifecycle', async ({ request }) => {
    const filePath = join(mockDir, 'e2e-lifecycle.get.json')
    await backupFile(filePath)

    // Add
    await writeJson(filePath, { phase: 'created' })
    await pollApi(request, '/api/e2e-lifecycle', body => body['phase'] === 'created')

    // Edit
    await writeJson(filePath, { phase: 'updated', extra: true })
    await pollApi(request, '/api/e2e-lifecycle', body => body['phase'] === 'updated' && body['extra'] === true)

    // Delete
    await rm(filePath, { force: true })
    removeBackup(filePath)

    await expect.poll(async () => {
      const res = await request.get('/api/e2e-lifecycle', {
        headers: { 'cache-control': 'no-cache' },
      })
      return res.status()
    }, { timeout: 15_000 }).toBeGreaterThanOrEqual(400)
  })

  test('TS handler full lifecycle', async ({ request }) => {
    const filePath = join(mockDir, 'e2e-ts-lifecycle.get.ts')
    await backupFile(filePath)

    // Add
    const v1 = [
      'import type { RouteRule } from \'mokup\'',
      'const rule: RouteRule = { handler: () => ({ phase: \'created\' }) }',
      'export default rule',
      '',
    ].join('\n')
    await writeFile(filePath, v1, 'utf8')
    await pollApi(request, '/api/e2e-ts-lifecycle', body => body['phase'] === 'created')

    // Edit
    const v2 = [
      'import type { RouteRule } from \'mokup\'',
      'const rule: RouteRule = { handler: () => ({ phase: \'updated\', v: 2 }) }',
      'export default rule',
      '',
    ].join('\n')
    await writeFile(filePath, v2, 'utf8')
    await pollApi(request, '/api/e2e-ts-lifecycle', body => body['phase'] === 'updated' && body['v'] === 2)

    // Delete
    await rm(filePath, { force: true })
    removeBackup(filePath)

    await expect.poll(async () => {
      const res = await request.get('/api/e2e-ts-lifecycle', {
        headers: { 'cache-control': 'no-cache' },
      })
      return res.status()
    }, { timeout: 15_000 }).toBeGreaterThanOrEqual(400)
  })
})

// ---------------------------------------------------------------------------
// 6. Edge cases
// ---------------------------------------------------------------------------

test.describe('edge cases', () => {
  test('adding a mock with special characters in the response', async ({ request }) => {
    const filePath = join(mockDir, 'e2e-special.get.json')
    await backupFile(filePath)

    await writeJson(filePath, {
      emoji: '🚀',
      unicode: '你好世界',
      html: '<script>alert("xss")</script>',
      empty: '',
      zero: 0,
      nullish: null,
    })

    await pollApi(request, '/api/e2e-special', (body) => {
      return body['emoji'] === '🚀'
        && body['unicode'] === '你好世界'
        && body['zero'] === 0
        && body['nullish'] === null
    })
  })

  test('adding a mock with deeply nested JSON', async ({ request }) => {
    const filePath = join(mockDir, 'e2e-deep.get.json')
    await backupFile(filePath)

    await writeJson(filePath, {
      a: { b: { c: { d: { value: 'deep' } } } },
      array: [{ nested: [1, 2, 3] }],
    })

    await pollApi(request, '/api/e2e-deep', (body) => {
      const a = body['a'] as Record<string, unknown> | undefined
      const b = a?.['b'] as Record<string, unknown> | undefined
      const c = b?.['c'] as Record<string, unknown> | undefined
      const d = c?.['d'] as Record<string, unknown> | undefined
      return d?.['value'] === 'deep'
    })
  })

  test('adding an empty JSON object mock', async ({ request }) => {
    const filePath = join(mockDir, 'e2e-empty.get.json')
    await backupFile(filePath)

    await writeJson(filePath, {})

    await expect.poll(async () => {
      const res = await request.get('/api/e2e-empty', {
        headers: { 'cache-control': 'no-cache' },
      })
      if (!res.ok()) {
        return null
      }
      return await res.json()
    }, { timeout: 15_000 }).toEqual({})
  })

  test('multiple new routes added simultaneously', async ({ request }) => {
    const paths = [
      join(mockDir, 'e2e-batch-a.get.json'),
      join(mockDir, 'e2e-batch-b.get.json'),
      join(mockDir, 'e2e-batch-c.get.json'),
    ]
    for (const p of paths) {
      await backupFile(p)
    }

    // Write all files at once
    await Promise.all(
      paths.map((p, i) => writeJson(p, { batch: true, index: i })),
    )

    await pollApi(request, '/api/e2e-batch-a', body => body['index'] === 0)
    await pollApi(request, '/api/e2e-batch-b', body => body['index'] === 1)
    await pollApi(request, '/api/e2e-batch-c', body => body['index'] === 2)
  })

  test('re-creating a deleted mock file restores the route', async ({ request }) => {
    const filePath = join(mockDir, 'e2e-recreate.get.json')
    await backupFile(filePath)

    // Create
    await writeJson(filePath, { round: 1 })
    await pollApi(request, '/api/e2e-recreate', body => body['round'] === 1)

    // Delete
    await rm(filePath, { force: true })
    await expect.poll(async () => {
      const res = await request.get('/api/e2e-recreate', {
        headers: { 'cache-control': 'no-cache' },
      })
      return res.status()
    }, { timeout: 15_000 }).toBeGreaterThanOrEqual(400)

    // Re-create
    await writeJson(filePath, { round: 2 })
    await pollApi(request, '/api/e2e-recreate', body => body['round'] === 2)
  })
})
