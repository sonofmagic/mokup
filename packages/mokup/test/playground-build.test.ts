import { mkdir, mkdtemp, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import { writePlaygroundBuild } from '../src/core/playground/build'

describe('playground build output', () => {
  it('writes a playground bundle with routes payload', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mokup-playground-'))
    const mockDir = join(root, 'mock')
    const outDir = join(root, 'dist')
    await mkdir(mockDir, { recursive: true })

    const routes = [
      {
        file: join(mockDir, 'users.get.json'),
        template: '/api/users',
        method: 'GET',
        tokens: [{ type: 'static', value: 'api' }, { type: 'static', value: 'users' }],
        score: [4, 5],
        handler: { ok: true },
        headers: { 'x-test': '1' },
        status: 200,
      },
    ]
    const disabledRoutes = [
      {
        file: join(mockDir, 'disabled.get.ts'),
        reason: 'disabled',
        method: 'GET',
        url: '/api/disabled',
      },
    ]
    const ignoredRoutes = [
      {
        file: join(mockDir, 'ignored.txt'),
        reason: 'unsupported',
      },
    ]

    await writePlaygroundBuild({
      outDir,
      base: '/',
      playgroundPath: '/__mokup',
      root,
      routes,
      disabledRoutes,
      ignoredRoutes,
      configFiles: [{ file: join(mockDir, 'index.config.ts') }],
      disabledConfigFiles: [],
      dirs: [mockDir],
      swScript: null,
      logger: {
        error: vi.fn(),
        warn: vi.fn(),
        info: vi.fn(),
        log: vi.fn(),
      },
    })

    const routesPayload = await readFile(join(outDir, '__mokup', 'routes'), 'utf8')
    const parsed = JSON.parse(routesPayload) as { count: number, routes: unknown[] }
    expect(parsed.count).toBe(1)
    expect(parsed.routes.length).toBe(1)
  })
})
