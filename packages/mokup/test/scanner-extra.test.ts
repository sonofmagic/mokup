import { mkdir, mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { scanRoutes } from '@mokup/core'
import { describe, expect, it, vi } from 'vitest'

function createLogger() {
  return { warn: vi.fn(), info: vi.fn(), error: vi.fn(), log: vi.fn() }
}

describe('scanRoutes extra coverage', () => {
  it('reports invalid routes, skips rules, and warns on duplicates', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mokup-scan-extra-'))
    const mockDir = join(root, 'mock')
    await mkdir(mockDir, { recursive: true })

    await writeFile(join(mockDir, 'index.config.mjs'), 'export default {}', 'utf8')

    await writeFile(join(mockDir, 'users.get.mjs'), 'export default { handler: { ok: true } }', 'utf8')
    await writeFile(join(mockDir, 'users.get.json'), '{"ok":true}', 'utf8')
    await writeFile(join(mockDir, 'users-disabled.get.mjs'), 'export default { enabled: false, handler: { ok: true } }', 'utf8')
    await writeFile(join(mockDir, 'users-unsupported.get.mjs'), 'export default { response: { ok: true }, handler: { ok: true } }', 'utf8')
    await writeFile(join(mockDir, 'users-no-handler.get.mjs'), 'export default { status: 200 }', 'utf8')
    await writeFile(join(mockDir, 'users-array.get.mjs'), 'export default [null, { handler: { ok: true } }]', 'utf8')
    await writeFile(join(mockDir, 'invalid.mjs'), 'export default { handler: { ok: true } }', 'utf8')

    const logger = createLogger()
    const skipped: Array<{ reason: string }> = []
    const ignored: Array<{ reason: string }> = []

    const routes = await scanRoutes({
      dirs: [mockDir],
      prefix: '/api',
      include: /users|invalid/,
      logger,
      onSkip: info => skipped.push(info),
      onIgnore: info => ignored.push(info),
      onConfig: vi.fn(),
    })

    expect(routes.length).toBeGreaterThan(0)
    expect(skipped.some(entry => entry.reason === 'disabled')).toBe(true)
    expect(ignored.some(entry => entry.reason === 'invalid-route')).toBe(true)
    expect(logger.warn).toHaveBeenCalled()
  })

  it('skips rules when resolveRule fails', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mokup-scan-extra-'))
    const mockDir = join(root, 'mock')
    await mkdir(mockDir, { recursive: true })
    await writeFile(join(mockDir, 'users.get.json'), '{"ok":true}', 'utf8')

    const routes = await scanRoutes({
      dirs: [mockDir],
      prefix: '/(group)',
      logger: createLogger(),
    })

    expect(routes).toEqual([])
  })
})
