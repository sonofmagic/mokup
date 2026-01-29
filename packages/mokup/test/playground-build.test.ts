import { mkdir, mkdtemp, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { writePlaygroundBuild } from '@mokup/core'
import { describe, expect, it, vi } from 'vitest'

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
      disabledConfigFiles: [{ file: join(mockDir, 'disabled.config.ts') }],
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
    const parsed = JSON.parse(routesPayload) as {
      count: number
      routes: unknown[]
      disabledConfigs: unknown[]
    }
    expect(parsed.count).toBe(1)
    expect(parsed.routes.length).toBe(1)
    expect(parsed.disabledConfigs.length).toBe(1)
  })

  it('injects the service worker script into index.html', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mokup-playground-sw-'))
    const mockDir = join(root, 'mock')
    const outDir = join(root, 'dist')
    await mkdir(mockDir, { recursive: true })

    await writePlaygroundBuild({
      outDir,
      base: '/',
      playgroundPath: '/__mokup',
      root,
      routes: [],
      disabledRoutes: [],
      ignoredRoutes: [],
      configFiles: [],
      disabledConfigFiles: [],
      dirs: [mockDir],
      swScript: 'console.log("sw")',
      logger: {
        error: vi.fn(),
        warn: vi.fn(),
        info: vi.fn(),
        log: vi.fn(),
      },
    })

    const indexHtml = await readFile(join(outDir, '__mokup', 'index.html'), 'utf8')
    expect(indexHtml).toContain('mokup-playground-sw')
    expect(indexHtml).toContain('console.log("sw")')
  })
})
