import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import { expect, test } from '@playwright/test'
import { writeJson, writeTextFile } from '../../../../tests/e2e/utils/fs'
import { repoRoot } from '../../../../tests/e2e/utils/paths'

const mockDir = join(repoRoot, 'apps/mokup-web-demo/mock')
const hmrSettleDelayMs = 200
const hmrRewriteIntervalMs = 2_000

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
    await writeTextFile(backup.path, backup.content)
  }
  backups.length = 0
}

/**
 * Poll an API endpoint until the response body satisfies `check`.
 * Resilient to non-JSON responses (returns false on parse failure).
 */
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

async function writeJsonAndWaitForApi(
  request: import('@playwright/test').APIRequestContext,
  filePath: string,
  value: unknown,
  path: string,
  check: (body: Record<string, unknown>) => boolean,
  timeout = 15_000,
) {
  const deadline = Date.now() + timeout
  let lastRewriteAt = 0
  let consecutiveMatches = 0

  while (Date.now() < deadline) {
    const now = Date.now()
    if (lastRewriteAt === 0 || now - lastRewriteAt >= hmrRewriteIntervalMs) {
      await writeJson(filePath, value)
      lastRewriteAt = now
      consecutiveMatches = 0
    }

    try {
      const res = await request.get(path, {
        headers: { 'cache-control': 'no-cache' },
      })
      if (res.ok()) {
        const text = await res.text()
        const json = JSON.parse(text) as Record<string, unknown>
        consecutiveMatches = check(json) ? consecutiveMatches + 1 : 0
        if (consecutiveMatches >= 2) {
          return
        }
      }
    }
    catch {
      consecutiveMatches = 0
    }

    await delay(hmrSettleDelayMs)
  }

  await pollApi(request, path, check, Math.max(hmrSettleDelayMs, timeout))
}

test.afterEach(async () => {
  await restoreAll()
  await delay(hmrSettleDelayMs)
})

// ---------------------------------------------------------------------------
// 1. Edit JSON mocks
// ---------------------------------------------------------------------------

test.describe('edit JSON mock files', () => {
  test('editing a JSON mock file triggers hot reload', async ({ request }) => {
    const filePath = join(mockDir, 'heartbeat.get.json')
    await backupFile(filePath)

    const stamp = `edit-json-${Date.now()}`
    const original = JSON.parse(await readFile(filePath, 'utf8'))
    await writeJsonAndWaitForApi(
      request,
      filePath,
      { ...original, e2e: stamp },
      '/api/heartbeat',
      body => body['e2e'] === stamp,
    )
  })

  test('editing a JSON mock replaces the entire response body', async ({ request }) => {
    const filePath = join(mockDir, 'heartbeat.get.json')
    await backupFile(filePath)

    const nextBody = {
      status: 'replaced',
      extra: 42,
      nested: { ok: true },
    }

    await writeJsonAndWaitForApi(
      request,
      filePath,
      nextBody,
      '/api/heartbeat',
      (body) => {
        return body['status'] === 'replaced'
          && body['extra'] === 42
          && (body['nested'] as Record<string, unknown>)?.['ok'] === true
      },
    )
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
    await writeTextFile(filePath, newContent)

    await pollApi(request, '/api/about', body => body['e2e'] === stamp)
  })

  test('editing messages.post.json triggers hot reload', async ({ request }) => {
    const filePath = join(mockDir, 'messages.post.json')
    await backupFile(filePath)

    const stamp = `msg-${Date.now()}`
    await writeJson(filePath, { ok: true, message: stamp })

    await expect.poll(async () => {
      try {
        const res = await request.post('/api/messages', {
          headers: { 'content-type': 'application/json' },
          data: {},
        })
        if (!res.ok()) {
          return false
        }
        const json = JSON.parse(await res.text()) as Record<string, unknown>
        return json['message'] === stamp
      }
      catch {
        return false
      }
    }, { timeout: 15_000 }).toBe(true)
  })

  test('rapid successive edits settle to the last value', async ({ request }) => {
    const filePath = join(mockDir, 'heartbeat.get.json')
    await backupFile(filePath)

    const original = JSON.parse(await readFile(filePath, 'utf8'))

    for (let i = 0; i < 5; i++) {
      await writeJson(filePath, { ...original, rapid: `v${i}` })
    }
    const finalStamp = `final-${Date.now()}`
    await writeJsonAndWaitForApi(
      request,
      filePath,
      { ...original, rapid: finalStamp },
      '/api/heartbeat',
      body => body['rapid'] === finalStamp,
    )
  })

  test('editing profile.get.json updates the response', async ({ request }) => {
    const filePath = join(mockDir, 'profile.get.json')
    await backupFile(filePath)

    const stamp = `profile-${Date.now()}`
    await writeJsonAndWaitForApi(
      request,
      filePath,
      {
        id: 99,
        name: stamp,
        role: 'e2e-tester',
        location: 'CI',
        updatedAt: new Date().toISOString(),
      },
      '/api/profile',
      body => body['name'] === stamp,
    )
  })

  test('editing users/index.get.json updates the response', async ({ request }) => {
    const filePath = join(mockDir, 'users/index.get.json')
    await backupFile(filePath)

    const stamp = `team-${Date.now()}`
    await writeJsonAndWaitForApi(
      request,
      filePath,
      { team: stamp, members: ['E2E'] },
      '/api/users',
      body => body['team'] === stamp,
    )
  })
})

// ---------------------------------------------------------------------------
// 2. Edit TS handler mocks
// ---------------------------------------------------------------------------

test.describe('edit TS handler mock files', () => {
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
    await writeTextFile(filePath, newContent)

    await pollApi(request, '/api/health', body => body['marker'] === marker)
  })

  test('editing override.get.ts updates the response', async ({ request }) => {
    const filePath = join(mockDir, 'override.get.ts')
    await backupFile(filePath)

    const marker = `override-${Date.now()}`
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
    await writeTextFile(filePath, newContent)

    await pollApi(request, '/api/override', body => body['marker'] === marker)
  })

  test('editing search.get.ts handler logic updates the response', async ({ request }) => {
    const filePath = join(mockDir, 'search.get.ts')
    await backupFile(filePath)

    const marker = `search-${Date.now()}`
    const newContent = [
      'import type { RequestHandler, RouteRule } from \'mokup\'',
      '',
      'const handler: RequestHandler = (c) => {',
      '  const term = c.req.query(\'q\')',
      `  return { term: term ?? 'none', marker: '${marker}' }`,
      '}',
      '',
      'const rule: RouteRule = { handler }',
      'export default rule',
      '',
    ].join('\n')
    await writeTextFile(filePath, newContent)

    await pollApi(request, '/api/search', body => body['marker'] === marker)
  })

  test('editing login.post.ts handler updates the response', async ({ request }) => {
    const filePath = join(mockDir, 'login.post.ts')
    await backupFile(filePath)

    const marker = `login-${Date.now()}`
    const newContent = [
      'import type { RouteRule } from \'mokup\'',
      '',
      'const rule: RouteRule = {',
      '  handler: async (c) => {',
      '    const body = await c.req.json().catch(() => ({}))',
      '    return {',
      '      ok: true,',
      `      marker: '${marker}',`,
      '      token: \'mock-token-7d91\',',
      '    }',
      '  },',
      '}',
      '',
      'export default rule',
      '',
    ].join('\n')
    await writeTextFile(filePath, newContent)

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
    const newContent = [
      'import type { RequestHandler, RouteRule } from \'mokup\'',
      '',
      'const handler: RequestHandler = (c) => {',
      '  const id = c.req.param(\'id\')',
      `  return { ok: true, id, marker: '${marker}' }`,
      '}',
      '',
      'const rule: RouteRule = { handler }',
      'export default rule',
      '',
    ].join('\n')
    await writeTextFile(filePath, newContent)

    await pollApi(request, '/api/users/42', body => body['marker'] === marker && body['id'] === '42')
  })
})

// ---------------------------------------------------------------------------
// 3. Multiple edits and content structure changes
// ---------------------------------------------------------------------------

test.describe('content structure changes', () => {
  test('overwriting a JSON mock with completely different structure', async ({ request }) => {
    const filePath = join(mockDir, 'heartbeat.get.json')
    await backupFile(filePath)

    await writeJsonAndWaitForApi(
      request,
      filePath,
      { version: 1, shape: 'original' },
      '/api/heartbeat',
      body => body['version'] === 1,
    )

    await writeJsonAndWaitForApi(
      request,
      filePath,
      { version: 2, newField: 'replaced', array: [1, 2, 3] },
      '/api/heartbeat',
      (body) => {
        return body['version'] === 2
          && body['newField'] === 'replaced'
          && Array.isArray(body['array'])
      },
    )
  })

  test('editing with special characters in the response', async ({ request }) => {
    const filePath = join(mockDir, 'heartbeat.get.json')
    await backupFile(filePath)

    await writeJsonAndWaitForApi(
      request,
      filePath,
      {
        emoji: '🚀',
        unicode: '你好世界',
        html: '<script>alert("xss")</script>',
        zero: 0,
        nullish: null,
      },
      '/api/heartbeat',
      (body) => {
        return body['emoji'] === '🚀'
          && body['unicode'] === '你好世界'
          && body['zero'] === 0
          && body['nullish'] === null
      },
    )
  })

  test('editing with deeply nested JSON', async ({ request }) => {
    const filePath = join(mockDir, 'heartbeat.get.json')
    await backupFile(filePath)

    await writeJsonAndWaitForApi(
      request,
      filePath,
      {
        a: { b: { c: { d: { value: 'deep' } } } },
        array: [{ nested: [1, 2, 3] }],
      },
      '/api/heartbeat',
      (body) => {
        const a = body['a'] as Record<string, unknown> | undefined
        const b = a?.['b'] as Record<string, unknown> | undefined
        const c = b?.['c'] as Record<string, unknown> | undefined
        const d = c?.['d'] as Record<string, unknown> | undefined
        return d?.['value'] === 'deep'
      },
    )
  })

  test('editing with empty JSON object', async ({ request }) => {
    const filePath = join(mockDir, 'heartbeat.get.json')
    await backupFile(filePath)

    await writeJsonAndWaitForApi(
      request,
      filePath,
      {},
      '/api/heartbeat',
      body => Object.keys(body).length === 0,
    )
  })

  test('editing multiple JSON mocks in sequence', async ({ request }) => {
    const heartbeatPath = join(mockDir, 'heartbeat.get.json')
    const profilePath = join(mockDir, 'profile.get.json')
    await backupFile(heartbeatPath)
    await backupFile(profilePath)

    const stamp = `multi-${Date.now()}`

    await writeJsonAndWaitForApi(
      request,
      heartbeatPath,
      { status: 'alive', e2e: stamp },
      '/api/heartbeat',
      body => body['e2e'] === stamp,
    )

    await writeJsonAndWaitForApi(
      request,
      profilePath,
      { id: 1, name: stamp, role: 'tester' },
      '/api/profile',
      body => body['name'] === stamp,
    )
  })
})
