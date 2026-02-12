import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { expect, test } from '@playwright/test'
import { writeJson } from '../../../../tests/e2e/utils/fs'

const mockDir = join(process.cwd(), 'mock')

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface FileBackup {
  path: string
  content: string
}

const backups: FileBackup[] = []

async function backupFile(filePath: string) {
  const content = await readFile(filePath, 'utf8')
  backups.push({ path: filePath, content })
}

async function restoreAll() {
  for (const backup of backups.reverse()) {
    await writeFile(backup.path, backup.content, 'utf8')
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
    try {
      const res = await request.get(path, {
        headers: { 'cache-control': 'no-cache' },
      })
      if (!res.ok()) {
        return false
      }
      const text = await res.text()
      const json = JSON.parse(text) as Record<string, unknown>
      return check(json)
    }
    catch {
      return false
    }
  }, { timeout }).toBe(true)
}

test.afterEach(async () => {
  await restoreAll()
})

// ---------------------------------------------------------------------------
// Edit JSON mocks
// ---------------------------------------------------------------------------

test.describe('edit JSON mock files', () => {
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

  test('rapid successive edits settle to the last value', async ({ request }) => {
    const filePath = join(mockDir, 'status.get.json')
    await backupFile(filePath)

    for (let i = 0; i < 5; i++) {
      await writeJson(filePath, { status: 'ok', rapid: `v${i}` })
    }
    const finalStamp = `final-${Date.now()}`
    await writeJson(filePath, { status: 'ok', rapid: finalStamp })

    await pollApi(request, '/api/status', body => body['rapid'] === finalStamp)
  })

  test('overwriting JSON with completely different structure', async ({ request }) => {
    const filePath = join(mockDir, 'status.get.json')
    await backupFile(filePath)

    await writeJson(filePath, { version: 1, shape: 'original' })
    await pollApi(request, '/api/status', body => body['version'] === 1)

    await writeJson(filePath, { version: 2, extra: 'added', array: [1, 2, 3] })
    await pollApi(request, '/api/status', (body) => {
      return body['version'] === 2
        && body['extra'] === 'added'
        && Array.isArray(body['array'])
    })
  })

  test('editing with special characters', async ({ request }) => {
    const filePath = join(mockDir, 'status.get.json')
    await backupFile(filePath)

    await writeJson(filePath, {
      emoji: '🚀',
      unicode: '你好世界',
      zero: 0,
      nullish: null,
    })

    await pollApi(request, '/api/status', (body) => {
      return body['emoji'] === '🚀'
        && body['unicode'] === '你好世界'
        && body['zero'] === 0
        && body['nullish'] === null
    })
  })

  test('editing with deeply nested JSON', async ({ request }) => {
    const filePath = join(mockDir, 'status.get.json')
    await backupFile(filePath)

    await writeJson(filePath, {
      a: { b: { c: { value: 'deep' } } },
    })

    await pollApi(request, '/api/status', (body) => {
      const a = body['a'] as Record<string, unknown> | undefined
      const b = a?.['b'] as Record<string, unknown> | undefined
      const c = b?.['c'] as Record<string, unknown> | undefined
      return c?.['value'] === 'deep'
    })
  })

  test('editing with empty JSON object', async ({ request }) => {
    const filePath = join(mockDir, 'status.get.json')
    await backupFile(filePath)

    await writeJson(filePath, {})

    await expect.poll(async () => {
      try {
        const res = await request.get('/api/status', {
          headers: { 'cache-control': 'no-cache' },
        })
        if (!res.ok()) {
          return null
        }
        return JSON.parse(await res.text())
      }
      catch {
        return null
      }
    }, { timeout: 15_000 }).toEqual({})
  })
})

// ---------------------------------------------------------------------------
// Edit TS handler mocks
// ---------------------------------------------------------------------------

test.describe('edit TS handler mock files', () => {
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

  test('editing profile.get.ts updates the response', async ({ request }) => {
    const filePath = join(mockDir, 'profile.get.ts')
    await backupFile(filePath)

    const marker = `profile-${Date.now()}`
    const content = [
      'import { defineHandler } from \'mokup\'',
      '',
      'export default defineHandler(() => ({',
      `  id: 'e2e',`,
      `  name: '${marker}',`,
      `  email: 'e2e@test.com',`,
      '}))',
      '',
    ].join('\n')
    await writeFile(filePath, content, 'utf8')

    await pollApi(request, '/api/profile', body => body['name'] === marker)
  })

  test('editing login.post.ts handler updates the response', async ({ request }) => {
    const filePath = join(mockDir, 'login.post.ts')
    await backupFile(filePath)

    const marker = `login-${Date.now()}`
    const content = [
      'import { defineHandler } from \'mokup\'',
      '',
      'export default defineHandler(async (c) => {',
      '  const body = await c.req.json().catch(() => ({}))',
      '  return {',
      '    ok: true,',
      `    marker: '${marker}',`,
      '    token: \'mock-token-7d91\',',
      '  }',
      '})',
      '',
    ].join('\n')
    await writeFile(filePath, content, 'utf8')

    await expect.poll(async () => {
      try {
        const res = await request.post('/api/login', {
          headers: { 'content-type': 'application/json' },
          data: { username: 'mokup', password: '123456' },
        })
        if (!res.ok()) {
          return false
        }
        const json = JSON.parse(await res.text()) as Record<string, unknown>
        return json['marker'] === marker
      }
      catch {
        return false
      }
    }, { timeout: 15_000 }).toBe(true)
  })

  test('editing users/[id].get.ts dynamic route updates the response', async ({ request }) => {
    const filePath = join(mockDir, 'users/[id].get.ts')
    await backupFile(filePath)

    const marker = `user-${Date.now()}`
    const content = [
      'import { defineHandler } from \'mokup\'',
      '',
      'export default defineHandler((c) => ({',
      '  ok: true,',
      '  id: c.req.param(\'id\'),',
      `  marker: '${marker}',`,
      '}))',
      '',
    ].join('\n')
    await writeFile(filePath, content, 'utf8')

    await pollApi(request, '/api/users/42', body => body['marker'] === marker && body['id'] === '42')
  })
})

// ---------------------------------------------------------------------------
// Multiple edits in sequence
// ---------------------------------------------------------------------------

test.describe('multiple sequential edits', () => {
  test('editing multiple JSON mocks in sequence', async ({ request }) => {
    const statusPath = join(mockDir, 'status.get.json')
    const summaryPath = join(mockDir, 'summary.get.jsonc')
    await backupFile(statusPath)
    await backupFile(summaryPath)

    const stamp = `multi-${Date.now()}`

    await writeJson(statusPath, { status: 'ok', e2e: stamp })
    await pollApi(request, '/api/status', body => body['e2e'] === stamp)

    const summaryContent = [
      '{',
      `  "service": "${stamp}",`,
      `  "e2e": "${stamp}"`,
      '}',
      '',
    ].join('\n')
    await writeFile(summaryPath, summaryContent, 'utf8')
    await pollApi(request, '/api/summary', body => body['e2e'] === stamp)
  })

  test('editing a TS mock twice picks up both changes', async ({ request }) => {
    const filePath = join(mockDir, 'variants.get.ts')
    await backupFile(filePath)

    const marker1 = `v1-${Date.now()}`
    const content1 = [
      'import { defineHandler } from \'mokup\'',
      `export default defineHandler(() => ({ phase: '${marker1}' }))`,
      '',
    ].join('\n')
    await writeFile(filePath, content1, 'utf8')
    await pollApi(request, '/api/variants', body => body['phase'] === marker1)

    const marker2 = `v2-${Date.now()}`
    const content2 = [
      'import { defineHandler } from \'mokup\'',
      `export default defineHandler(() => ({ phase: '${marker2}' }))`,
      '',
    ].join('\n')
    await writeFile(filePath, content2, 'utf8')
    await pollApi(request, '/api/variants', body => body['phase'] === marker2)
  })
})
