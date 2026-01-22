import { promises as fs } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import { scanRoutes } from '../src/dev/scanner'

async function createTempRoot() {
  const root = await fs.mkdtemp(path.join(tmpdir(), 'mokup-dev-scan-'))
  const mockDir = path.join(root, 'mock')
  await fs.mkdir(mockDir, { recursive: true })
  return { root, mockDir }
}

describe('dev route scanner', () => {
  it('scans routes, merges config, and skips unsupported rules', async () => {
    const { root, mockDir } = await createTempRoot()
    const logger = { warn: vi.fn(), info: vi.fn(), error: vi.fn() }
    try {
      await fs.mkdir(path.join(mockDir, '.draft'), { recursive: true })
      await fs.writeFile(path.join(mockDir, 'users.get.json'), '{ "ok": true }', 'utf8')
      await fs.writeFile(
        path.join(mockDir, '.draft', 'hidden.get.json'),
        '{ "ok": true }',
        'utf8',
      )
      await fs.writeFile(
        path.join(mockDir, 'disabled.get.ts'),
        'export default { enabled: false, handler: { ok: true } }',
        'utf8',
      )
      await fs.writeFile(
        path.join(mockDir, 'skip.get.js'),
        'export default { response: { ok: true }, handler: { ok: true } }',
        'utf8',
      )
      await fs.writeFile(
        path.join(mockDir, 'index.config.js'),
        [
          'export default {',
          '  headers: { "x-root": "1" },',
          '  status: 201,',
          '  delay: 5,',
          '}',
        ].join('\n'),
        'utf8',
      )

      const routes = await scanRoutes({
        dirs: [mockDir],
        prefix: '/api',
        logger,
      })

      expect(routes).toHaveLength(1)
      expect(routes[0]?.template).toBe('/api/users')
      expect(routes[0]?.headers).toEqual({ 'x-root': '1' })
      expect(routes[0]?.status).toBe(201)
      expect(routes[0]?.delay).toBe(5)
      expect(logger.warn).toHaveBeenCalled()
    }
    finally {
      await fs.rm(root, { recursive: true, force: true })
    }
  })
})
